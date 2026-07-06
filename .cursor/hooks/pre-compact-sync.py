#!/usr/bin/env python3
"""Hook preCompact: sync korespondencji przed kompresją kontekstu Cursor."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

CIV_ROOT = Path(__file__).resolve().parents[2]
REJESTR = CIV_ROOT / "docs" / "archiwum-czatow" / "eksport-pelny" / "REJESTR-CZATOW.md"
SYNC = CIV_ROOT / "gra" / "tools" / "sync-chat-export.py"


def parse_rejestr() -> list[tuple[str, str]]:
    if not REJESTR.is_file():
        return []
    text = REJESTR.read_text(encoding="utf-8")
    rows: list[tuple[str, str]] = []
    for line in text.splitlines():
        if "`" not in line or "uzupełni agent" in line:
            continue
        m = re.search(r"\|\s*\*\*([^*]+)\*\*\s*\|[^|]*\|[^|]*\|\s*`([^`]+)`\s*\|", line)
        if m:
            rows.append((m.group(1).strip(), m.group(2).strip()))
    return rows


def main() -> int:
    raw = sys.stdin.read()
    chat_id = None
    if raw.strip():
        try:
            data = json.loads(raw)
            chat_id = (
                data.get("conversation_id")
                or data.get("conversationId")
                or data.get("chat_id")
                or data.get("chatId")
            )
        except json.JSONDecodeError:
            pass

    mapping = parse_rejestr()
    if chat_id:
        targets = [(s, c) for s, c in mapping if c == chat_id]
    else:
        targets = mapping

    if not targets:
        return 0

    for slot, cid in targets:
        if chat_id and cid != chat_id:
            continue
        subprocess.run(
            [
                sys.executable,
                str(SYNC),
                "--slot",
                slot,
                "--chat-id",
                cid,
                "--mode",
                "delta",
                "--context-pct",
                "60",
            ],
            cwd=str(CIV_ROOT),
            check=False,
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
