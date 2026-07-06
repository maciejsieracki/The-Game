#!/usr/bin/env python3
"""
sync-chat-export.py — automatyczny eksport pełnej korespondencji czatu Cursor.

Źródło: agent-transcripts/<chat-id>/<chat-id>.jsonl (Cursor, lokalnie).
Cel: docs/archiwum-czatow/eksport-pelny/<SLOT>_KORESPONDENCJA.md

Użycie (z root Civ):
  python gra/tools/sync-chat-export.py --slot MASTER-Silnik --chat-id <uuid>
  python gra/tools/sync-chat-export.py --slot GRUPA-F --chat-id <uuid> --mode delta
  python gra/tools/sync-chat-export.py --slot MASTER-Silnik --chat-id <uuid> --context-pct 65

Maciej NIE eksportuje ręcznie — agent odpala przy starcie sesji i przy >60% kontekstu.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

CIV_ROOT = Path(__file__).resolve().parents[2]
EXPORT_DIR = CIV_ROOT / "docs" / "archiwum-czatow" / "eksport-pelny"
META_SUFFIX = ".sync-meta.json"

# Domyślna ścieżka transkryptów Cursor (projekt Civ)
TRANSCRIPT_ROOT = (
    Path.home()
    / ".cursor"
    / "projects"
    / "c-Users-macie-OneDrive-NASTER-S-A-NOWA-STRUKTURA-06-Prywatne-Gry-Civ"
    / "agent-transcripts"
)


def find_transcript(chat_id: str) -> Path | None:
    p = TRANSCRIPT_ROOT / chat_id / f"{chat_id}.jsonl"
    return p if p.is_file() else None


def extract_text(content_blocks: list) -> str:
    parts: list[str] = []
    for block in content_blocks or []:
        if not isinstance(block, dict):
            continue
        if block.get("type") == "text":
            t = block.get("text") or ""
            # usuń tagi user_query dla czytelności
            t = re.sub(r"</?user_query>", "", t)
            parts.append(t.strip())
    return "\n\n".join(p for p in parts if p)


def parse_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open(encoding="utf-8", errors="replace") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                obj["_line"] = i
                rows.append(obj)
            except json.JSONDecodeError:
                rows.append({"role": "system", "_line": i, "_raw": line})
    return rows


def row_to_md(row: dict) -> str:
    line_no = row.get("_line", "?")
    role = row.get("role", "unknown").upper()
    if role == "USER":
        label = "MACIEJ"
    elif role == "ASSISTANT":
        label = "AGENT"
    else:
        label = role

    msg = row.get("message") or {}
    if isinstance(msg, dict):
        text = extract_text(msg.get("content"))
    else:
        text = row.get("_raw", str(msg))

    if not text:
        return ""

    return f"\n### Linia {line_no} — {label}\n\n{text}\n"


def build_header(slot: str, chat_id: str, line_count: int, mode: str, context_pct: int | None) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    ctx = f"{context_pct}%" if context_pct is not None else "—"
    return f"""# Korespondencja pełna — {slot}

> **Plik historyczny** — tylko treść rozmowy i ustalenia. **Nie** używaj jako dyspozycji operacyjnej.
> Operacyjne: `DO-MASTERA`, `OD-MASTERA`, `DZIENNIK`, `STATUS`.

| Pole | Wartość |
|------|---------|
| **Slot czatu** | `{slot}` |
| **Chat ID (Cursor)** | `{chat_id}` |
| **Ostatnia synchronizacja** | {now} |
| **Tryb sync** | {mode} |
| **Kontekst (szac.)** | {ctx} |
| **Linii w transkrypcie** | {line_count} |
| **Źródło** | `agent-transcripts/{chat_id}/` |

---

## Korespondencja

"""


def load_meta(export_path: Path) -> dict:
    meta_path = export_path.with_suffix(export_path.suffix + META_SUFFIX)
    if meta_path.is_file():
        return json.loads(meta_path.read_text(encoding="utf-8"))
    return {"last_line": 0}


def save_meta(export_path: Path, chat_id: str, last_line: int) -> None:
    meta_path = export_path.with_suffix(export_path.suffix + META_SUFFIX)
    meta = {
        "chat_id": chat_id,
        "last_line": last_line,
        "updated": datetime.now(timezone.utc).isoformat(),
    }
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Sync Cursor chat transcript to eksport-pelny markdown")
    ap.add_argument("--slot", required=True, help="np. MASTER-Silnik, GRUPA-A")
    ap.add_argument("--chat-id", required=True, help="UUID czatu Cursor")
    ap.add_argument("--mode", choices=("full", "delta", "auto"), default="auto")
    ap.add_argument("--context-pct", type=int, default=None, help="Szacowany %% kontekstu")
    args = ap.parse_args()

    transcript = find_transcript(args.chat_id)
    if not transcript:
        print(f"BLOK: brak transkryptu: {args.chat_id}", file=sys.stderr)
        print(f"Szukano: {TRANSCRIPT_ROOT}", file=sys.stderr)
        return 1

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    export_path = EXPORT_DIR / f"{args.slot}_KORESPONDENCJA.md"
    rows = parse_jsonl(transcript)
    total_lines = len(rows)

    meta = load_meta(export_path)
    mode = args.mode
    if mode == "auto":
        mode = "full" if meta.get("last_line", 0) == 0 or meta.get("chat_id") != args.chat_id else "delta"

    start_line = 0 if mode == "full" else int(meta.get("last_line", 0))

    if mode == "delta" and start_line >= total_lines:
        print(f"OK: brak nowych linii ({total_lines} total)")
        return 0

    body_parts: list[str] = []
    if mode == "full" or not export_path.is_file():
        body_parts.append(build_header(args.slot, args.chat_id, total_lines, mode, args.context_pct))
    elif mode == "delta":
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        body_parts.append(f"\n\n---\n\n## Dopisek synchronizacji — {ts} (linie {start_line + 1}–{total_lines})\n\n")

    for row in rows:
        if row.get("_line", 0) <= start_line:
            continue
        md = row_to_md(row)
        if md:
            body_parts.append(md)

    if mode == "full":
        export_path.write_text("".join(body_parts), encoding="utf-8")
    else:
        with export_path.open("a", encoding="utf-8") as f:
            f.write("".join(body_parts))

    save_meta(export_path, args.chat_id, total_lines)

    # Handoff przy wysokim kontekście
    if args.context_pct is not None and args.context_pct >= 60:
        handoff = EXPORT_DIR / f"{args.slot}_HANDOFF-KONTEKST.md"
        handoff.write_text(
            f"""# Handoff kontekstu — {args.slot}

**Data:** {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}
**Kontekst:** ~{args.context_pct}%
**Pełna korespondencja:** `{export_path.name}`

Kontekst czatu został zarchiwizowany. Kontynuuj w tym czacie lub otwórz **nowy** z tą samą `DYSPOZYCJA` —
agent wczyta eksport z `eksport-pelny/` zamiast polegać na skompresowanej pamięci Cursor.

**Nie czytaj plików operacyjnych** — Maciej pracuje tylko w czacie.
""",
            encoding="utf-8",
        )
        print(f"HANDOFF: {handoff}")

    print(f"OK: {export_path} ({mode}, linie 1–{total_lines}, nowe od {start_line})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
