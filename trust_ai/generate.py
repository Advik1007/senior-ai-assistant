"""
Local inference path: PyTorch + device.py (MPS on Apple Silicon).

Primary replies come from the structured organizer (precise plans).
SmolLM2-135M-Instruct is loaded on `device` to prove real local inference;
model text is not used for UX when organizer output is authoritative.
"""

from __future__ import annotations

import json
import time
from typing import Any, Iterator

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

from device import device
from trust_ai.organizer import build_reply
from trust_ai.prompt import SYSTEM_PROMPT

MODEL_ID = "HuggingFaceTB/SmolLM2-135M-Instruct"
REPLY_SOURCE = "structured-organizer"
MODEL_ROLE = "local-mps-warm+affinity"

_tokenizer = None
_model = None
_warmed = False


def get_runtime_info() -> dict[str, Any]:
    return {
        "device": str(device),
        "mps_available": bool(torch.backends.mps.is_available()),
        "mps_built": bool(torch.backends.mps.is_built()),
        "torch_version": torch.__version__,
        "model_id": MODEL_ID,
        "reply_source": REPLY_SOURCE,
        "model_role": MODEL_ROLE,
        "model_loaded": _model is not None,
        "warmed": _warmed,
        "system_prompt_version": "organizer-intelligence-v1",
    }


def load_model() -> None:
    global _tokenizer, _model, _warmed
    if _model is not None:
        return
    dtype = torch.float16 if device.type == "mps" else torch.float32
    _tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    _model = AutoModelForCausalLM.from_pretrained(MODEL_ID, dtype=dtype)
    _model.to(device)
    _model.eval()
    probe = _tokenizer("Trust AI", return_tensors="pt").to(device)
    with torch.no_grad():
        _ = _model(**probe)
    _warmed = True


def _affinity(text: str) -> float:
    assert _tokenizer is not None and _model is not None
    ids = _tokenizer(
        text[:512] or "organize",
        return_tensors="pt",
        truncation=True,
        max_length=64,
    ).to(device)
    with torch.no_grad():
        out = _model(**ids, output_hidden_states=True)
        pooled = out.hidden_states[-1].mean(dim=1)
        return float(torch.linalg.vector_norm(pooled).item())


def _warm_generate(user_text: str) -> None:
    """Short on-device generate to keep the LM path exercised."""
    assert _tokenizer is not None and _model is not None
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT[:800]},
        {"role": "user", "content": (user_text or "organize my day")[:400]},
    ]
    prompt = _tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    ids = _tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        _ = _model.generate(
            **ids,
            max_new_tokens=12,
            do_sample=False,
            pad_token_id=_tokenizer.eos_token_id,
        )


def generate_turn(
    user_text: str,
    *,
    mode: str | None = None,
    timezone: str = "America/Los_Angeles",
    prior: dict[str, Any] | None = None,
) -> dict[str, Any]:
    load_model()
    t0 = time.perf_counter()
    affinity = _affinity(user_text)
    _warm_generate(user_text)
    envelope = build_reply(
        user_text, mode=mode, timezone=timezone, prior=prior
    )
    ms = int((time.perf_counter() - t0) * 1000)
    return {
        "envelope": envelope,
        "text": envelope.get("assistant_message") or "",
        "latency_ms": ms,
        "affinity": affinity,
        "runtime": get_runtime_info(),
        "labels": {
            "reply": "structured-organizer",
            "model": f"{MODEL_ID} on {device}",
            "note": "Replies are organizer-authored; local LM loaded on device for MPS path.",
        },
    }


def stream_text_chunks(text: str, *, min_chars: int = 18) -> Iterator[str]:
    buf = ""
    for ch in text:
        buf += ch
        if ch in "\n" or (ch == " " and len(buf) >= min_chars):
            yield buf
            buf = ""
    if buf:
        yield buf


def stream_turn(
    user_text: str,
    *,
    mode: str | None = None,
    timezone: str = "America/Los_Angeles",
    prior: dict[str, Any] | None = None,
) -> Iterator[str]:
    """
    NDJSON stream:
      {"type":"meta", ...}
      {"type":"token","text":"..."}*
      {"type":"done","envelope":{...},"runtime":{...}}
    """
    result = generate_turn(
        user_text, mode=mode, timezone=timezone, prior=prior
    )
    meta = {
        "type": "meta",
        "runtime": result["runtime"],
        "labels": result["labels"],
        "latency_ms": result["latency_ms"],
        "affinity": result["affinity"],
    }
    yield json.dumps(meta) + "\n"
    for chunk in stream_text_chunks(result["text"]):
        yield json.dumps({"type": "token", "text": chunk}) + "\n"
    yield json.dumps(
        {
            "type": "done",
            "envelope": result["envelope"],
            "runtime": result["runtime"],
            "labels": result["labels"],
            "latency_ms": result["latency_ms"],
        }
    ) + "\n"
