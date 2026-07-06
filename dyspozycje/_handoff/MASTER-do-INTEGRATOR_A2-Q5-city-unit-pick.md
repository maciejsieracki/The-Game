# HANDOFF: MASTER → INTEGRATOR (F) — A2-Q5 picker Miasto vs Jednostka

**Data handoff:** 2026-07-01  
**Decyzja Macieja:** **A2-Q5 = A** (picker split)  
**Sign-off playtest Maciej:** **OK** (2026-07-01 — „wszystko działa”)  
**Status:** **ZATWIERDZONE · WDROŻONE W ROBOCZA** — brak nowego batcha `main.ts`

---

## Co przesyłam

| Element | Ścieżka / stan |
|---------|----------------|
| UI pickera | `gra/src/ui/cityUnitPick.ts` |
| Wpięcie mapy | `gra/src/main.ts` — gałąź kliku własnego miasta (~4211), `isCityUnitPickOpen()` w trybie mapy i ruchu |
| Decyzja | `docs/decyzje/A2-Q5-miasto-vs-jednostka-klik.md` |
| Powiązane | `UNITS-do-MASTER_wejscie-miasta-garnizon.md` §4b |

**Kanon opublikowany:** `Gra-podglad.html` = ROBOCZA = PLAYTEST-MAPA  
**md5:** `27B69A47A26787687666FFD013C8A3D9` *(stary — aktualny kanon: `4602e752d7e4b21f3c2460e494e82a8f`)*

---

## Co Integrator ma z tym zrobić

1. **Przyjąć sign-off** — nie otwierać ponownego batcha integracji (już wpięte).
2. **Bramka regresji** (przed kolejnym publish): `node tools/smoke.cjs` + skrócony playtest sanity (klik miasto+wojsko → oba wybory).
3. **Opus review** — kolejka gdy limit odblokowany (batch C3 + A2-Q5).
4. **REJEST UX:** dopisać wpis **A-21** w `docs/ux/REJEST-UX-MASTER.md` (picker miasto/jednostka).

---

## DoD (kryteria akceptacji)

| # | Kryterium | Maciej | Kod |
|---|-----------|--------|-----|
| D1 | Wojsko na własnym mieście → klik → modal Miasto \| Jednostka | ✅ | ✅ |
| D2 | Miasto → panel miasta | ✅ | ✅ |
| D3 | Jednostka → zaznaczenie + panel armii | ✅ | ✅ |
| D4 | Miasto bez wojska → od razu panel (bez pickera) | ✅ | ✅ |
| D5 | Ruch domek na miasto → bez pickera | ✅ | ✅ |
| D6 | Esc / Anuluj zamyka bez akcji | ✅ | ✅ |
| D7 | smoke.cjs zielony po build | — | ✅ |

---

## Flaga

**→ INTEGRATOR: ZATWIERDZONE · KANON ROBOCZA · CZEKA Opus (opcjonalny gate przed „final”)**
