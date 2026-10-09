"""Plain-language explanation of a score, in English and Urdu.

Gemini writes the explanation from the computed numbers only (it is told not to
add facts). If Gemini is unavailable, a deterministic template produces the
same structure so the demo never breaks.
"""

from __future__ import annotations

import json
from typing import Literal

from pydantic import BaseModel

from app.services import llm

BAND_EN = {"ready": "Ready for a loan", "building": "Building credit", "not_yet": "Not ready yet"}
BAND_UR = {"ready": "قرض کے لیے تیار", "building": "تیاری کے مراحل میں", "not_yet": "ابھی تیار نہیں"}

LABEL_UR = {
    "log_monthly_inflow": "ماہانہ آمدنی",
    "inflow_volatility": "ہفتہ وار آمدنی میں اتار چڑھاؤ",
    "net_margin": "منافع کی شرح",
    "active_day_ratio": "دکان کھلنے کے دن",
    "udhaar_ratio": "ادھار پر فروخت کا حصہ",
    "recovery_rate": "ادھار کی وصولی",
    "inflow_trend": "آمدنی کا رجحان",
    "months_of_history": "ریکارڈ کے مہینے",
}

ADVICE = {
    "udhaar_ratio": (
        "Reduce credit sales: set a limit per customer and keep udhaar below 20% of sales.",
        "ادھار کم کریں: ہر گاہک کی حد مقرر کریں اور ادھار کو کل فروخت کے 20 فیصد سے کم رکھیں۔",
    ),
    "recovery_rate": (
        "Recover outstanding udhaar: follow up weekly with the customers who owe the most.",
        "باقی ادھار وصول کریں: جن گاہکوں پر سب سے زیادہ رقم باقی ہے ان سے ہر ہفتے رابطہ کریں۔",
    ),
    "net_margin": (
        "Improve your margin: compare supplier rates and track which items earn the most.",
        "منافع بہتر کریں: مختلف سپلائرز کے ریٹ کا موازنہ کریں اور دیکھیں کون سی اشیاء زیادہ منافع دیتی ہیں۔",
    ),
    "inflow_volatility": (
        "Steady your income: keep fast-selling items in stock so weak weeks are less weak.",
        "آمدنی میں استحکام لائیں: جلدی بکنے والی اشیاء ہمیشہ اسٹاک میں رکھیں تاکہ کمزور ہفتے کم ہوں۔",
    ),
    "active_day_ratio": (
        "Open on more days: every closed day is a day with no recorded income.",
        "دکان زیادہ دن کھولیں: ہر بند دن کا مطلب ہے کہ اس دن کوئی آمدنی ریکارڈ نہیں ہوئی۔",
    ),
    "months_of_history": (
        "Keep writing the khata every day: three more months of records will make the score more reliable.",
        "روزانہ کھاتہ لکھتے رہیں: مزید تین مہینوں کا ریکارڈ آپ کے اسکور کو زیادہ قابلِ اعتماد بنا دے گا۔",
    ),
    "log_monthly_inflow": (
        "Grow sales steadily: even small, regular increases raise the amount you can safely borrow.",
        "فروخت بڑھائیں: روزانہ فروخت میں چھوٹا مگر مسلسل اضافہ بھی آپ کی قرض لینے کی گنجائش بڑھاتا ہے۔",
    ),
    "inflow_trend": (
        "Turn the trend around: check which weeks sales dropped and why.",
        "کمی کے رجحان کو روکیں: دیکھیں کن ہفتوں میں فروخت کم ہوئی اور کیوں۔",
    ),
}


class _Expl(BaseModel):
    language: Literal["en", "ur"]
    summary: str
    strengths: list[str]
    concerns: list[str]
    next_steps: list[str]


class _ExplSet(BaseModel):
    explanations: list[_Expl]


SYSTEM_PROMPT = """You explain a small shop's credit-readiness assessment to the shopkeeper and to a
microfinance loan officer in Pakistan. Use ONLY the numbers in the JSON you are given; never invent
figures, laws, interest rates or lender names. Be warm, direct and practical; no jargon.

For each requested language produce:
- summary: 2 sentences - the score and band, and the single biggest reason.
- strengths: up to 3 short points from factors with direction "up".
- concerns: up to 3 short points from factors with direction "down", plus any warning flags.
- next_steps: exactly 3 concrete actions the shopkeeper can take in the next 3 months that would
  improve the weakest factors.
Language "ur" means natural Urdu in Urdu script (keep numbers as digits, amounts as "روپے").
Language "en" means simple English. Mention amounts as PKR with thousands separators."""


def _template(language: str, name: str | None, score: dict, profile: dict, loan: dict, flags: list[dict]) -> dict:
    who = name or ("This shop" if language == "en" else "اس دکان")
    up = [f for f in score["factors"] if f["direction"] == "up"][:3]
    down = [f for f in score["factors"] if f["direction"] == "down"][:3]
    steps = [ADVICE[f["feature"]][0 if language == "en" else 1] for f in down]
    for f in ("months_of_history", "recovery_rate", "net_margin"):  # pad to 3 steps
        if len(steps) >= 3:
            break
        s = ADVICE[f][0 if language == "en" else 1]
        if s not in steps:
            steps.append(s)
    warn = [fl["message"] for fl in flags if fl["severity"] == "warning"][:1]

    if language == "en":
        loan_txt = (
            f"A loan of about PKR {loan['principal']:,.0f} (PKR {loan['monthly_instalment']:,.0f}/month for "
            f"{loan['tenure_months']} months) looks affordable."
            if loan["eligible"] else "A loan is not recommended yet."
        )
        return {
            "language": "en",
            "summary": (
                f"{who} scores {score['score']}/100 - {BAND_EN[score['band']]}. Average monthly inflow is "
                f"PKR {profile['avg_monthly_inflow']:,.0f} with a {profile['net_margin']:.0%} margin. {loan_txt}"
            ),
            "strengths": [f"{f['label']}: {f['display_value']}" for f in up],
            "concerns": [f"{f['label']}: {f['display_value']}" for f in down] + warn,
            "next_steps": steps[:3],
        }
    loan_txt = (
        f"تقریباً {loan['principal']:,.0f} روپے کا قرض ({loan['tenure_months']} ماہ کے لیے {loan['monthly_instalment']:,.0f} روپے ماہانہ قسط) قابلِ برداشت لگتا ہے۔"
        if loan["eligible"] else "فی الحال قرض لینے کا مشورہ نہیں دیا جاتا۔"
    )
    return {
        "language": "ur",
        "summary": (
            f"{who} کا کریڈٹ اسکور 100 میں سے {score['score']} ہے ({BAND_UR[score['band']]})۔ "
            f"اوسط ماہانہ آمدنی {profile['avg_monthly_inflow']:,.0f} روپے اور منافع کی شرح {profile['net_margin']:.0%} ہے۔ {loan_txt}"
        ),
        "strengths": [f"{LABEL_UR[f['feature']]} اچھی ہے ({f['display_value']})" for f in up],
        "concerns": [f"{LABEL_UR[f['feature']]} کمزور ہے ({f['display_value']})" for f in down] + warn,
        "next_steps": steps[:3],
    }


def explain(languages: list[str], name: str | None, score: dict, profile: dict, loan: dict, flags: list[dict]) -> list[dict]:
    facts = {
        "business_name": name,
        "score": score["score"],
        "band": BAND_EN[score["band"]],
        "factors": [{k: f[k] for k in ("label", "display_value", "direction", "impact")} for f in score["factors"]],
        "profile": {k: v for k, v in profile.items() if k != "monthly"},
        "loan_suggestion": loan,
        "flags": [f["message"] for f in flags],
    }
    try:
        out: _ExplSet = llm.generate_json(
            [f"Languages: {', '.join(languages)}\n\nAssessment JSON:\n{json.dumps(facts, ensure_ascii=False)}"],
            _ExplSet, SYSTEM_PROMPT, temperature=0.3, timeout_s=20,  # then fall back to the template
        )
        by_lang = {e.language: e for e in out.explanations}
        if all(lang in by_lang for lang in languages):
            return [{**by_lang[lang].model_dump(), "source": "gemini"} for lang in languages]
    except llm.LLMUnavailable:
        pass
    return [{**_template(lang, name, score, profile, loan, flags), "source": "template"} for lang in languages]
