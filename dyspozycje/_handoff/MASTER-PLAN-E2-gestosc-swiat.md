# MASTER — plan E2: gęstość świata + typy cywilizacji

**Data:** 2026-06-29 · **E2 dispatch 2026-06-28:** `ORCHESTRATOR-DISPATCH-E2-2026-06-28.md`  
**Decyzja:** `docs/decyzje/E2-gestosc-swiat-kreator.md`  
**Maciej:** delegacja pełna — bez ABC po drodze  
**Orkiestrator:** `dyspozycje/ORCHESTRATOR-DISPATCH-E2-2026-06-28.md` · flaga **`→ ORCHESTRATOR: ROZDYSponuj TERAZ`**  

---

## Kolejność

```
UI (kreator + params) ──┬──► SILNIK (wpięcie main.ts)
                        │
MAPA (generator opts) ──┘
         │
         └──► testy tools/* + forest-parity / deposit rules
```

---

## Kto co robi

| # | Lane | Pliki | Zadanie | Flaga po GOTOWE |
|---|------|-------|---------|-----------------|
| 1 | **UI (E)** | `newGameFlow.ts`, `ui-params.json`, mockup | Krok 4: `civ_types_count`; zaawansowane: jakość + 4 gęstości; `buildParams()` | `→ INTEGRATOR: GOTOWE` 🟡 |
| 2 | **MAPA** | `gen-helpers.ts`, `generator.ts`, `newGameMapDefaults.ts`, `cluster-spawn.ts` | `WorldGenerationOptions` + mnożniki; **nie psuć** `allowedOn` | `→ SILNIK: GOTOWE` |
| 3 | **SILNIK** | `main.ts` | `generujSwiat(..., opts)` + spawn z `civTypesCount` | `→ INTEGRATOR: GOTOWE` 🟡 |
| 4 | **INTEGRATOR** | ROBOCZA | Batch po UI+MAPA+SILNIK meldunkach | publish |

---

## Handoffy

| Od → Do | Plik |
|---------|------|
| MASTER → MAPA | `_handoff/MASTER-do-MAPA_E2-gestosc-generator.md` |
| MASTER → SILNIK | `_handoff/MASTER-do-SILNIK_E2-gestosc-wpiecie.md` |
| UI → INTEGRATOR | `_handoff/UI-do-INTEGRATOR_E2-kreator-gestosc.md` (po self-test) |
| MAPA → SILNIK | `_handoff/MAPA-do-SILNIK_E2-world-opts.md` (MAPA tworzy po implementacji) |

---

## Reguły surowców (referencja — nie zmieniać sensu)

`gra/src/map/gen-helpers.ts` → `DEPOSIT_RULES`: bydło tylko Łąka/Równina; konie Równina; ruda Góry; morze/wybrzeże = brak złóż; las nie nadpisywany złożem.

---

## ISO-5

Każdy lane przed GOTOWE: `.\tools\grupa-selftest.ps1 -Grupa <X>` + MD5 + warstwa.
