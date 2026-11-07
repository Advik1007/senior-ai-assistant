"""
Trust AI organizer intelligence.

Implements plan / prioritize / clarify / confirm-before-Google from
docs/organizer-intelligence.md. Emits trust_ai_v1 envelopes + sharp markdown.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Any, Literal
from zoneinfo import ZoneInfo

from trust_ai.prompt import SYSTEM_PROMPT

SCHEMA = "trust_ai_v1"
Intent = Literal[
    "plan",
    "prioritize",
    "break_down",
    "clarify",
    "confirm_google",
    "status",
    "homework_help",
    "plagiarism_check",
    "compose_email",
]

_TASK_SPLIT = re.compile(r"[,;\n]| and | & |\+| then | / ", re.I)
_HOURS = re.compile(
    r"(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours)\b|(?:about|~)?\s*(\d+)\s*(?:min|mins|minutes)\b",
    re.I,
)
_DEADLINE = re.compile(
    r"\b(due|deadline|exam|quiz|test|tomorrow|tonight|today|friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b",
    re.I,
)
_CONFIRM = re.compile(r"^\s*(confirm|yes|do it|push|go ahead)\b", re.I)
_CANCEL = re.compile(r"^\s*(cancel|never\s*mind|stop|no)\b", re.I)
_EDIT = re.compile(r"^\s*(edit|change|update)\b", re.I)
_CALENDAR_ASK = re.compile(
    r"\b(add to calendar|push to calendar|calendar|schedule (?:it|this|them)|google calendar)\b",
    re.I,
)
_EMAIL_ASK = re.compile(r"\b(send (?:the )?email|email (?:my |the )?teacher|gmail)\b", re.I)

FILLER = {
    "help",
    "please",
    "me",
    "my",
    "i",
    "need",
    "to",
    "for",
    "tonight",
    "today",
    "prioritize",
    "organize",
    "plan",
    "with",
    "the",
    "a",
    "an",
    "can",
    "you",
    "we",
}


@dataclass
class ScoredTask:
    id: str
    title: str
    urgency: int
    impact: int
    effort_minutes: int
    depends_on: list[str] = field(default_factory=list)
    dependency_blocker: int = 0
    score: int = 0
    rationale: str = ""


def score_task(
    urgency: int,
    impact: int,
    dependency_blocker: int,
    effort_penalty: int,
) -> int:
    """score = urgency*3 + impact*2 + dependency_blocker*2 − effort_penalty"""
    return urgency * 3 + impact * 2 + dependency_blocker * 2 - effort_penalty


def detect_mode(text: str, explicit: str | None = None) -> str:
    if explicit in ("student", "general"):
        return explicit
    lower = text.lower()
    student_keys = (
        "homework",
        "study",
        "exam",
        "quiz",
        "school",
        "assignment",
        "essay",
        "teacher",
        "subject",
        "chapter",
        "chem",
        "math",
        "biology",
        "history",
    )
    return "student" if any(k in lower for k in student_keys) else "general"


def extract_hours_budget(text: str) -> float | None:
    hours = 0.0
    found = False
    for m in _HOURS.finditer(text):
        found = True
        if m.group(1):
            hours += float(m.group(1))
        elif m.group(2):
            hours += float(m.group(2)) / 60.0
    return hours if found else None


_META_ONLY = re.compile(
    r"^(?:quiz|exam|test|deadline|due)\b.*\b(?:tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b$",
    re.I,
)


def extract_tasks(text: str) -> list[str]:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []
    # Strip time-budget phrases so "Spanish vocab — 3 hours" → "Spanish vocab"
    cleaned = _HOURS.sub(" ", cleaned)
    parts = [p.strip(" .-•*—–") for p in _TASK_SPLIT.split(cleaned) if p.strip()]
    tasks: list[str] = []
    for p in parts:
        if _META_ONLY.match(p.strip()):
            continue
        words = [w for w in p.split() if w.lower() not in FILLER]
        title = " ".join(words).strip(" -—–")
        if len(words) >= 2 or (len(words) == 1 and len(words[0]) > 4):
            if title.lower() in {"quiz tomorrow", "exam tomorrow", "due tomorrow"}:
                continue
            tasks.append(title[:90])
    seen: set[str] = set()
    unique: list[str] = []
    for t in tasks:
        key = t.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(t)
    return unique[:10]


def _effort_for(title: str) -> int:
    lower = title.lower()
    if any(k in lower for k in ("email", "mail", "message")):
        return 15
    if any(k in lower for k in ("grocery", "shop", "errand")):
        return 35
    if any(k in lower for k in ("essay", "paper", "report")):
        return 50
    if any(k in lower for k in ("exam", "quiz", "chapter", "homework", "study", "math", "chem")):
        return 45
    return 30


def _urgency_impact(title: str, raw: str) -> tuple[int, int, str]:
    lower = title.lower()
    raw_l = raw.lower()
    urgency = 2
    impact = 3
    why = "Useful progress"
    hard = any(k in raw_l for k in ("exam", "quiz", "test", "due tomorrow", "deadline"))
    academic = any(
        k in lower
        for k in (
            "homework",
            "assignment",
            "essay",
            "chapter",
            "chem",
            "math",
            "bio",
            "history",
            "physics",
            "study",
        )
    )
    if hard and academic:
        urgency = 5
        impact = 5
        why = "Hard deadline / assessment"
    elif hard and any(k in lower for k in ("vocab", "flashcard", "review")):
        urgency = 4
        impact = 3
        why = "Support review — after core assessment prep"
    elif "tonight" in raw_l or "today" in raw_l:
        urgency = 4
        impact = 4 if academic else 3
        why = "Same-day window"
    elif academic:
        urgency = 4
        impact = 5
        why = "School deliverable"
    elif any(k in lower for k in ("email", "teacher", "mail")):
        urgency = 3
        impact = 3
        why = "Unblocks communication"
    elif any(k in lower for k in ("grocery", "shop", "errand", "chore")):
        urgency = 2
        impact = 2
        why = "Errand — after deep work"
    return urgency, impact, why


def score_tasks(titles: list[str], raw: str) -> list[ScoredTask]:
    scored: list[ScoredTask] = []
    for i, title in enumerate(titles):
        urgency, impact, why = _urgency_impact(title, raw)
        effort = _effort_for(title)
        effort_penalty = 0 if effort <= 30 else 1 if effort <= 45 else 2
        dep = 0
        s = score_task(urgency, impact, dep, effort_penalty)
        scored.append(
            ScoredTask(
                id=f"t{i+1}",
                title=title,
                urgency=urgency,
                impact=impact,
                effort_minutes=effort,
                score=s,
                rationale=why,
            )
        )
    scored.sort(key=lambda t: (-t.score, t.effort_minutes))
    # re-id after sort for stable display
    for i, t in enumerate(scored):
        t.id = f"t{i+1}"
    return scored


def _time_window(text: str, hours: float | None) -> str:
    lower = text.lower()
    if "tonight" in lower:
        return "tonight"
    if "tomorrow" in lower:
        return "tomorrow"
    if "week" in lower:
        return "this week"
    if hours is not None:
        return f"next {hours:g} hour{'s' if hours != 1 else ''}"
    return "today"


def _start_hour(text: str, now: datetime) -> int:
    lower = text.lower()
    if "tonight" in lower:
        return max(now.hour + 1, 19) if now.hour < 22 else now.hour
    if "morning" in lower:
        return 9
    if "afternoon" in lower:
        return 14
    return max(now.hour + 1, 16) % 24


def _fmt(h: int, m: int) -> str:
    return f"{h % 24:02d}:{m:02d}"


def _add_minutes(h: int, m: int, delta: int) -> tuple[int, int]:
    total = h * 60 + m + delta
    return (total // 60) % 24, total % 60


def build_schedule(
    tasks: list[ScoredTask],
    text: str,
    hours: float | None,
    tz: ZoneInfo,
) -> dict[str, Any]:
    now = datetime.now(tz)
    day = now.date()
    if "tomorrow" in text.lower():
        day = day + timedelta(days=1)
    window = _time_window(text, hours)
    budget_min = int((hours or 3.0) * 60)
    # Cap at 90% of budget
    usable = int(budget_min * 0.9)
    start_h = _start_hour(text, now)
    start_m = 0
    blocks: list[dict[str, Any]] = []
    used = 0
    must_do: list[str] = []
    should_do: list[str] = []
    park: list[str] = []

    for i, task in enumerate(tasks):
        focus = min(task.effort_minutes, 50)
        if used + focus > usable and i > 0:
            park.append(task.id)
            continue
        if i == 0 or task.urgency >= 4:
            must_do.append(task.id)
        elif task.urgency >= 3:
            should_do.append(task.id)
        else:
            should_do.append(task.id)

        sh, sm = start_h, start_m
        eh, em = _add_minutes(sh, sm, focus)
        criterion = _success_criteria(task.title)
        blocks.append(
            {
                "start": _fmt(sh, sm),
                "end": _fmt(eh, em),
                "date": day.isoformat(),
                "title": task.title,
                "task_ids": [task.id],
                "success_criteria": criterion,
                "kind": "focus",
            }
        )
        used += focus
        start_h, start_m = _add_minutes(eh, em, 0)
        # break after focus if more work remains
        remaining = [t for t in tasks[i + 1 :] if t.id not in park]
        if remaining and used + 10 <= usable:
            bh, bm = start_h, start_m
            eh2, em2 = _add_minutes(bh, bm, 8)
            blocks.append(
                {
                    "start": _fmt(bh, bm),
                    "end": _fmt(eh2, em2),
                    "date": day.isoformat(),
                    "title": "Break",
                    "task_ids": [],
                    "success_criteria": "Away from desk",
                    "kind": "break",
                }
            )
            used += 8
            start_h, start_m = eh2, em2

    goal = tasks[0].title if tasks else "Clear next actions"
    if len(tasks) > 1:
        goal = f"Finish {tasks[0].title}; advance {tasks[1].title}"

    risks = []
    if park:
        risks.append("If focus slips, keep must-do only and park the rest.")
    if hours is None:
        risks.append("Time budget assumed — adjust if the evening is shorter.")

    return {
        "goal": goal,
        "time_window": window,
        "blocks": blocks,
        "must_do": must_do,
        "should_do": should_do,
        "park": park,
        "risks": risks or ["None flagged from the input."],
        "date": day.isoformat(),
    }


def _success_criteria(title: str) -> str:
    lower = title.lower()
    if any(k in lower for k in ("email", "mail")):
        return "Draft ready to send (subject + 3 clear sentences)"
    if any(k in lower for k in ("grocery", "shop")):
        return "List complete; trip started or scheduled"
    if any(k in lower for k in ("essay", "outline")):
        return "Thesis + 3 section headers written"
    if any(k in lower for k in ("math", "problem")):
        return "Assigned problems attempted; stuck spots listed"
    if any(k in lower for k in ("chapter", "chem", "bio", "history", "study", "exam")):
        return "Can explain 5 key points without notes"
    return "Concrete output exists (notes, draft, or checked-off steps)"


def needs_clarify(tasks: list[str], hours: float | None, text: str) -> bool:
    """Ask only when missing data would materially change the plan."""
    if len(tasks) == 0:
        return True
    # Very vague single dump with no hours and no deadline signal
    if hours is None and not _DEADLINE.search(text) and len(tasks) >= 3:
        return True
    if hours is None and len(tasks) >= 4:
        return True
    return False


def clarify_envelope(mode: str, tasks: list[str], subjects: list[str]) -> dict[str, Any]:
    qs = [
        {
            "id": "q1",
            "question": "How many hours can you put into this today?",
            "why_it_matters": "Sets block count and depth",
            "default_if_skipped": "3 hours",
        },
        {
            "id": "q2",
            "question": "What is the earliest hard deadline among these items?",
            "why_it_matters": "Drives priority order",
            "default_if_skipped": "All due in 7 days",
        },
    ]
    if mode == "student" and len(qs) < 3:
        qs.append(
            {
                "id": "q3",
                "question": "Any fixed class or work blocks I must schedule around?",
                "why_it_matters": "Anchors the day so soft work fills gaps",
                "default_if_skipped": "No fixed anchors",
            }
        )
    qs = qs[:3]
    lines = ["## Need {} details to plan well".format(len(qs)), ""]
    for i, q in enumerate(qs, 1):
        lines.append(f"{i}. {q['question']}")
    defaults = "; ".join(q["default_if_skipped"] for q in qs)
    lines.append("")
    lines.append(f"**If no reply:** I’ll assume {defaults} and build the plan.")
    return {
        "schema": SCHEMA,
        "intent": "clarify",
        "mode": mode,
        "assistant_message": "\n".join(lines),
        "assumptions": [],
        "clarifying_questions": qs,
        "priorities": [],
        "plan": None,
        "breakdown": None,
        "next_action": None,
        "google_action": None,
        "student": (
            {"hook": "plan_study_day", "subjects": subjects[:6]}
            if mode == "student"
            else None
        ),
        "needs_user_confirmation": False,
        "system_prompt_version": "organizer-intelligence-v1",
    }


def format_plan_markdown(envelope: dict[str, Any]) -> str:
    plan = envelope["plan"]
    pri = envelope["priorities"]
    assumptions = envelope.get("assumptions") or []
    lines = [
        f"## Plan — {plan['goal']} ({plan['time_window']})",
        "",
        "**Assumptions:** "
        + (
            "; ".join(assumptions)
            if assumptions
            else "None — you gave enough."
        ),
        "",
        "### Priorities",
    ]
    for i, p in enumerate(pri[:5], 1):
        lines.append(
            f"{i}. **{p['title']}** — {p['rationale']} · ~{p['effort_minutes']}m · score {p['score']}"
        )
    lines.extend(["", "### Schedule", "| When | Block | Done when |", "|------|-------|-----------|"])
    for b in plan["blocks"]:
        when = f"{b['start']}–{b['end']}"
        lines.append(f"| {when} | {b['title']} | {b['success_criteria']} |")
    lines.extend(["", "### Watchouts"])
    for r in plan.get("risks") or ["None"]:
        lines.append(f"- {r}")
    must = plan.get("must_do") or []
    should = plan.get("should_do") or []
    park = plan.get("park") or []
    id_to_title = {p["id"]: p["title"] for p in pri}
    if must:
        lines.append("")
        lines.append("**Must-do today:** " + ", ".join(id_to_title.get(i, i) for i in must))
    if should:
        lines.append("**Should-do if time:** " + ", ".join(id_to_title.get(i, i) for i in should))
    if park:
        lines.append("**Park for later:** " + ", ".join(id_to_title.get(i, i) for i in park))
    nxt = envelope.get("next_action") or {}
    lines.append("")
    lines.append(f"**Next:** {nxt.get('summary', 'Start the first focus block.')}")
    return "\n".join(lines)


def format_confirm_google(envelope: dict[str, Any]) -> str:
    g = envelope["google_action"]
    events = (g.get("payload") or {}).get("events") or []
    lines = [
        "## Confirm Google action",
        "",
        f"**Service:** {'Calendar' if g['service'] == 'calendar' else 'Gmail'}",
        f"**Action:** {g['operation'].replace('_', ' ')}",
        f"**Summary:** {g.get('summary', 'Drafted events from your plan.')}",
        "",
        "| Field | Value |",
        "|------|-------|",
    ]
    for i, ev in enumerate(events, 1):
        lines.append(
            f"| Event {i} | {ev['title']} · {ev['date']} {ev['start']}–{ev['end']} |"
        )
    lines.extend(
        [
            "",
            "Reply **confirm**, **edit** (say what to change), or **cancel**.",
            "I won’t call Gemini until you confirm.",
        ]
    )
    return "\n".join(lines)


def google_confirm_from_plan(
    envelope: dict[str, Any],
    timezone: str,
) -> dict[str, Any]:
    plan = envelope["plan"]
    events = []
    for b in plan["blocks"]:
        if b.get("kind") != "focus":
            continue
        events.append(
            {
                "title": f"Trust AI: {b['title']}",
                "date": b["date"],
                "start": b["start"],
                "end": b["end"],
                "timezone": timezone,
                "description": f"Success: {b['success_criteria']}",
            }
        )
    out = dict(envelope)
    out["intent"] = "confirm_google"
    out["needs_user_confirmation"] = True
    out["google_action"] = {
        "provider": "gemini_bridge",
        "service": "calendar",
        "operation": "create_events",
        "status": "awaiting_confirmation",
        "confirmation_prompt": "Confirm to proceed?",
        "summary": f"{len(events)} study/work blocks from your plan.",
        "payload": {"events": events, "email": None},
    }
    out["assistant_message"] = format_confirm_google(out)
    return out


def handle_confirm_cancel(
    text: str,
    prior: dict[str, Any] | None,
) -> dict[str, Any] | None:
    """Host-side gate: user confirm/edit/cancel against awaiting google_action."""
    if not prior or not prior.get("google_action"):
        return None
    g = prior["google_action"]
    if g.get("status") != "awaiting_confirmation":
        return None

    if _CANCEL.search(text):
        out = dict(prior)
        out["intent"] = "status"
        out["needs_user_confirmation"] = False
        out["google_action"] = {**g, "status": "cancelled"}
        out["assistant_message"] = (
            "## Cancelled — Calendar push\n"
            "No Gemini call. Your offline plan is unchanged.\n\n"
            f"**Next:** {prior.get('next_action', {}).get('summary', 'Start the first focus block.')}"
        )
        return out

    if _EDIT.search(text):
        out = dict(prior)
        out["intent"] = "confirm_google"
        out["needs_user_confirmation"] = True
        out["assistant_message"] = (
            "## Edit Google action\n\n"
            "Say what to change (times, titles, which events to drop). "
            "I’ll revise the payload and ask for confirm again.\n\n"
            "I won’t call Gemini until you confirm."
        )
        return out

    if _CONFIRM.search(text):
        # Host must call Gemini; we only mark awaiting_host_execution — never succeeded.
        out = dict(prior)
        out["intent"] = "status"
        out["needs_user_confirmation"] = False
        out["google_action"] = {**g, "status": "awaiting_host_execution"}
        out["assistant_message"] = (
            "## Ready — waiting on Google bridge\n\n"
            "Confirmation received. The host must call Gemini with your credentials "
            "and report success or failure. I will not claim events were created until then.\n\n"
            "**Still have:** your offline plan above.\n"
            "**If auth fails:** reconnect Google; the plan stays."
        )
        return out

    return None


def build_reply(
    user_text: str,
    *,
    mode: str | None = None,
    timezone: str = "America/Los_Angeles",
    prior: dict[str, Any] | None = None,
    force_clarify: bool = False,
) -> dict[str, Any]:
    """Main organizer turn → trust_ai_v1 envelope."""
    text = (user_text or "").strip()
    gated = handle_confirm_cancel(text, prior)
    if gated:
        gated["meta"] = {"source": "organizer", "system_prompt": "loaded"}
        return gated

    try:
        tz = ZoneInfo(timezone)
    except Exception:
        tz = ZoneInfo("UTC")
        timezone = "UTC"

    resolved_mode = detect_mode(text, mode)
    hours = extract_hours_budget(text)
    tasks = extract_tasks(text)
    subjects = [t for t in tasks if detect_mode(t) == "student"] or tasks

    # If user asks to push calendar after a plan, emit confirm gate.
    if prior and prior.get("plan") and _CALENDAR_ASK.search(text):
        return google_confirm_from_plan(prior if prior.get("priorities") else prior, timezone)

    if force_clarify or needs_clarify(tasks, hours, text):
        # If they answered vaguely but we can assume — only clarify when truly blocked.
        if not tasks:
            return clarify_envelope(resolved_mode, tasks, subjects)
        if hours is None and len(tasks) >= 4 and not _DEADLINE.search(text):
            return clarify_envelope(resolved_mode, tasks, subjects)

    assumptions: list[str] = []
    if hours is None:
        hours = 3.0
        assumptions.append("3 hours available")
    if not _DEADLINE.search(text):
        assumptions.append("No hard deadline stated — ranked by impact")

    scored = score_tasks(tasks, text)
    if not scored:
        scored = score_tasks(
            [
                "Capture the full messy list",
                "Choose one high-leverage next action",
                "Park the rest for later",
            ],
            text,
        )
        assumptions.append("No concrete tasks parsed — using capture defaults")

    plan = build_schedule(scored, text, hours, tz)
    priorities = [
        {
            "id": t.id,
            "title": t.title,
            "urgency": t.urgency,
            "impact": t.impact,
            "effort_minutes": t.effort_minutes,
            "depends_on": t.depends_on,
            "score": t.score,
            "rationale": t.rationale,
        }
        for t in scored
    ]
    next_action = {
        "summary": f"Start {scored[0].title}: first 10 minutes only",
        "task_id": scored[0].id,
        "minutes": 10,
    }

    envelope: dict[str, Any] = {
        "schema": SCHEMA,
        "intent": "plan",
        "mode": resolved_mode,
        "assistant_message": "",
        "assumptions": assumptions,
        "clarifying_questions": [],
        "priorities": priorities,
        "plan": plan,
        "breakdown": None,
        "next_action": next_action,
        "google_action": None,
        "student": (
            {"hook": "plan_study_day", "subjects": subjects[:6]}
            if resolved_mode == "student"
            else None
        ),
        "needs_user_confirmation": False,
        "system_prompt_version": "organizer-intelligence-v1",
    }
    envelope["assistant_message"] = format_plan_markdown(envelope)

    # Student study plan → offer Calendar confirm (gate, do not execute).
    if resolved_mode == "student" and any(
        b.get("kind") == "focus" for b in plan["blocks"]
    ):
        # Append a quiet bridge affordance; full confirm card when user asks or confirms path.
        envelope["assistant_message"] += (
            "\n\n---\n"
            "Want these focus blocks on Google Calendar? Say **add to calendar** — "
            "I’ll show the exact events and wait for confirm before any Gemini call."
        )

    # Explicit calendar/email intent on this same turn → confirm card.
    if _CALENDAR_ASK.search(text):
        envelope = google_confirm_from_plan(envelope, timezone)
        # Keep plan in envelope; assistant_message becomes confirm pattern.
        # Also prepend a short plan pointer.
        envelope["assistant_message"] = (
            format_plan_markdown({**envelope, "assistant_message": ""})
            + "\n\n"
            + envelope["assistant_message"]
        )

    if _EMAIL_ASK.search(text) and not envelope.get("google_action"):
        envelope["intent"] = "compose_email"
        envelope["needs_user_confirmation"] = True
        envelope["google_action"] = {
            "provider": "gemini_bridge",
            "service": "gmail",
            "operation": "draft_email",
            "status": "awaiting_confirmation",
            "confirmation_prompt": "Confirm to proceed?",
            "summary": "Draft only — send requires a later confirm.",
            "payload": {
                "events": None,
                "email": {
                    "to": [],
                    "cc": [],
                    "subject": "Quick note",
                    "body": "Draft pending your recipient and outcome.",
                },
            },
        }
        envelope["assistant_message"] += (
            "\n\n## Confirm Google action\n\n"
            "**Service:** Gmail\n**Action:** draft email\n"
            "**Summary:** I can draft after you name the recipient and outcome.\n\n"
            "Reply **confirm**, **edit**, or **cancel**. I won’t call Gemini until you confirm."
        )

    envelope["meta"] = {
        "source": "organizer",
        "system_prompt_chars": len(SYSTEM_PROMPT),
    }
    return envelope
