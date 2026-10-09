"""Thin wrapper around Gemini so the rest of the code never imports the SDK directly."""

from __future__ import annotations

from functools import lru_cache

from app import config


class LLMUnavailable(RuntimeError):
    pass


@lru_cache
def _client():
    if not config.llm_enabled():
        raise LLMUnavailable("GEMINI_API_KEY is not set on the server.")
    from google import genai

    return genai.Client(api_key=config.GEMINI_API_KEY)


def generate_json(parts: list, schema, system: str, temperature: float = 0.1, timeout_s: float = 60):
    """Call Gemini with a schema-constrained JSON response; returns the parsed object.

    timeout_s bounds the HTTP call (the SDK default is no timeout), so a hung request
    turns into LLMUnavailable and the caller's fallback instead of a stalled demo.
    """
    from google.genai import types

    try:
        resp = _client().models.generate_content(
            model=config.GEMINI_MODEL,
            contents=parts,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=temperature,
                response_mime_type="application/json",
                response_schema=schema,
                http_options=types.HttpOptions(timeout=int(timeout_s * 1000)),
            ),
        )
    except LLMUnavailable:
        raise
    except Exception as exc:  # network, quota, bad model name...
        raise LLMUnavailable(f"Gemini call failed: {exc}") from exc

    if resp.parsed is not None:
        return resp.parsed
    try:
        return schema.model_validate_json(resp.text)
    except Exception as exc:
        raise LLMUnavailable(f"Gemini returned unreadable JSON: {exc}") from exc


def image_part(data: bytes, mime_type: str):
    from google.genai import types

    return types.Part.from_bytes(data=data, mime_type=mime_type)
