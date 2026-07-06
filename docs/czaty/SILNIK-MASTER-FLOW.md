# Flow Integrator (F) ↔ Master — skrót

> ⛔ **ARCHIWUM (2026-06-30)** — używaj: `docs/obieg/_ZASADY.md` §3 · `docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md`  
> Backup: `SILNIK-MASTER-FLOW.md.bak-OBIEG-2026-06-30`

> **Pełny słownik grup:** `docs/obieg/NAZEWNICTWO-GRUP.md`

---

## Artefakty

| Plik | Wersja | Kto |
|------|--------|-----|
| `Gra-podglad-ROBOCZA.html` | **Robocza** | **Grupa F (Integrator)** po bramce |
| `Gra-podglad.html` | **Finalna** | **Master** po Opus APPROVE |

Build: `gra/tools/bramka-test-publish.ps1` → kopia `index.html` → **ROBOCZA**.

---

## Pipeline

```
A–E: → INTEGRATOR: GOTOWE  (docs/obieg/<grupa>.md)
  → F (Integrator): main.ts + bramka + ROBOCZA  (→ MASTER: GOTOWE-ROBOCZA)
  → Master: Opus  (OPUS-REVIEW-QUEUE)
  → APPROVE: ROBOCZA → Gra-podglad.html + _backup/
```

---

## Grupa F — Integrator (automatycznie)

Trigger: `master` + `docs/obieg/INTEGRATOR-kolejka.md` lub `→ INTEGRATOR: GOTOWE` w `docs/obieg/<grupa>.md`.

1. Backup `main.ts.bak-SILNIK-…`
2. Wpięcie tylko GOTOWE (backlog BLOKADY)
3. Bramka PASS
4. Publikuj **ROBOCZA** — **nie** `Gra-podglad.html`
5. Raport: `SILNIK-DO-MASTERA.md` + `docs/obieg/INTEGRATOR-kolejka.md` → `GOTOWE-ROBOCZA`

---

## Master (automatycznie)

Trigger: `czaty` lub `GOTOWE-ROBOCZA`.

1. Pakiet Opus (`OPUS-REVIEW-QUEUE.md`)
2. Po APPROVE: ROBOCZA → finalna + STATUS + DZIENNIK
3. BLOCK → dyspozycja do F/grupy w `docs/obieg/`

**Master nie edytuje `main.ts`.**

---

## Maciej

| Tak | Nie |
|-----|-----|
| ABC w zakładkach A–E | Test/bramka/kanon w czacie F |
| Opus Ask (UI) — **w czacie Master** | Ponowne ABC na zamknięte decyzje z A–E |
| Playtest **finalnej** od **Mastera** (ten czat) | Raport wykonania / briefing / checklist od Grupy F |
| Opcjonalnie: zgoda na archiwum („Archiwum OK: …”) | Drugie sign-off tego samego handoffu |

---

## Grupa F — przed wpięciem (2026-06-27, Maciej)

1. Czytaj `→ INTEGRATOR: GOTOWE` + handoff.
2. **Weryfikuj technicznie** (bez pytania Macieja): kompletność handoffu, spójność kodu — **nie** audyt cross-grupa, **nie** sync STATUS/MAPA-PYTAN.
3. Wpinaj `main.ts` → bramka → **ROBOCZA** → raport **tylko** `SILNIK-DO-MASTERA` + `INTEGRATOR-kolejka.md` → `GOTOWE-ROBOCZA`.
4. **BLOK** → `→ MASTER: BLOK` — **nie** briefing dla Macieja zamiast Mastera.

**ZAKAZ roli Master:** Opus, finalna `Gra-podglad.html`, playtest checklist dla Macieja, edycja `STATUS.md` / `MAPA-PYTAN-OPEN.md` / `DZIENNIK-MASTERA.md`, sekcja „Master — briefing", routing Grup A–E do Macieja.

Pełna spec: `docs/czaty/GRUPA-F-SILNIK.md`
