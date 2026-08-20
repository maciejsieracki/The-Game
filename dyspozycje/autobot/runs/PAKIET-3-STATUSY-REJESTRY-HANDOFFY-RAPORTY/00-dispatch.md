# 00 — DISPATCH

- ID runu: `PAKIET-3-STATUSY-REJESTRY-HANDOFFY-RAPORTY`
- Temat: uporządkowanie statusów, ABC, handoffów i struktury raportów.
- Zakres: wyłącznie dokumentacja i struktura artefaktów.
- Allowlista: `REJESTR-PROSB-I-ZADAN.md`, `PYTANIA-OTWARTE.md`,
  `STAN-PRACY-HANDOFF.md`, `_handoff/HANDOFF-AKTUALNY.md`, `_handoff/KANAL-PRACA.md`,
  `WERSJE.md`, `STAN-PRACY-HANDOFF-ARCHIWUM-2026-08-20.md`,
  `autobot/runs/<ID>/`.
- Poza zakresem: `CLAUDE.md`, `.cursor/rules`, `.claude/skills`,
  `R-PROC-AUTOBOT`, `gra/`, deploy, push.
- Kryteria akceptacji: historia zachowana, statusy bez dowodu niezmienione,
  linki działają, `git diff --check` przechodzi.
