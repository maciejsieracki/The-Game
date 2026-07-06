# ORCHESTRATOR — rozdanie E2 (gęstość świata + kreator)

| Pole | Wartość |
|------|---------|
| **Flaga** | **→ ORCHESTRATOR: ROZDYSponuj TERAZ** |
| **Od** | Maciej (decyzje zamknięte) + MASTER |
| **Data** | 2026-06-28 |
| **Decyzja kanon** | `docs/decyzje/E2-gestosc-swiat-kreator.md` |
| **Hub techniczny** | `dyspozycje/_handoff/MASTER-PLAN-E2-gestosc-swiat.md` |

---

## TL;DR dla orkiestratora

1. **Równolegle (2 subagenty):** **MAPA** (generator) + **UI** (miasta-państwa w kreatorze).
2. **Sekwencyjnie po MAPA:** **SILNIK** (`main.ts` — jedyny editor).
3. **Po UI + MAPA + SILNIK:** **INTEGRATOR** → ROBOCZA + bramka testów.
4. **Maciej:** playtest ROBOCZA — bez kolejnych ABC na E2.

---

## Maciej — parametry do wdrożenia (nie pytaj ponownie)

| Temat | Werdykt |
|-------|---------|
| E2-Q1 | **B** — Typy cywilizacji na głównej siatce ±1 |
| E2-Q2 | **A** — Suwak surowców 0,6/1,0/1,4 **+ wyższa baza rarity** (więcej złóż niż dziś przy Normalnie) |
| E2-Q3 | **A\*** — Rzeki 2/5/8 na **Małej** mapie; **skala proporcjonalna** na większych |
| E2-Q4 | **A\*** — Las **i** pustynia osobno; mnożniki **0,5/1/0/2** (drastyczniej) |
| E2-Q5 | **A\*** — Główna + zaawansowane gęstości; **zamiast Jakość mapy** → **Miasta-państwa** |

---

## Zadanie 1 — MAPA (Grupa A · Composer)

| | |
|---|---|
| **Trigger Macieja w czacie lane** | `start` |
| **Czyta** | `dyspozycje/MAPA.md` → `_handoff/MASTER-do-MAPA_E2-gestosc-generator.md` |
| **Model** | `composer-2.5-fast` · **1 Task = ten batch** |
| **Pliki** | `gen-helpers.ts`, `generator.ts`, `newGameMapDefaults.ts`, `cluster-spawn.ts` |
| **NIE ruszać** | `main.ts`, `newGameFlow.ts` |

**AC (skrót):**

- `generujSwiat(..., opts?)` + `WorldGenerationPreset` + `civTypesCount`
- Surowce: mult 0,6/1/1,4 + **podniesiona baza** `placeDeposits` (Normalnie > dziś)
- Rzeki: 2/5/8 × **skaler rozmiaru mapy** (Mała = baza)
- Pustynia + las logiczny: **0,5/1/2** (osobne)
- `allowedOn` / DEPOSIT_RULES — bez zmian
- Testy + handoff `MAPA-do-SILNIK_E2-world-opts.md`

**Po GOTOWE:** `MAPA-DO-MASTERA.md` append · flaga **`→ SILNIK: GOTOWE`**

---

## Zadanie 2 — UI (Grupa E · Composer)

| | |
|---|---|
| **Trigger** | `start` |
| **Czyta** | `dyspozycje/UI.md` → `_handoff/UI-do-INTEGRATOR_E2-kreator-gestosc.md` |
| **Pliki** | `newGameFlow.ts`, `ui-params.json`, opcjonalnie sync podglądu `UI/Gra-podglad-KREATOR-E2.html` |
| **NIE ruszać** | `main.ts` |

**AC (delta po decyzji Maciej 2026-06-28):**

- [x] Typy cywilizacji + 4 suwaki gęstości w zaawansowanych *(już w podglądzie)*
- [ ] **Usunąć** wiersz **Jakość mapy** z zaawansowanych kreatora
- [ ] **Dodać** suwak **Miasta-państwa** (historyczna nazwa; reguły spawnu — kontrakt MAPA/cluster-start)
- [ ] Jakość mapy E1 → ustawienia globalne menu **lub** domyślna Średnia bez suwaka w kreatorze
- [ ] `buildParams()` / `NewGameParams` — pole `miastaPanstwaCount` (nazwa do uzgodnienia z MAPA w handoff)
- [ ] Self-test: `.\tools\grupa-selftest.ps1 -Grupa E` + MD5

**Po GOTOWE:** `UI-DO-MASTERA.md` · flaga **`→ INTEGRATOR: GOTOWE` 🟡**

**Uwaga:** UI może iść **równolegle z MAPA** — brak kolizji plików.

---

## Zadanie 3 — SILNIK (Grupa F · GLM / Master Silnik)

| | |
|---|---|
| **Status** | **BLOKADA** do `MAPA → SILNIK: GOTOWE` |
| **Czyta** | `_handoff/MASTER-do-SILNIK_E2-gestosc-wpiecie.md` + `MAPA-do-SILNIK_E2-world-opts.md` |
| **Pliki** | **tylko** `gra/src/main.ts` (+ backup `.bak-SILNIK-*`) |
| **Batch** | 1 zmiana · build `/tmp/civ-dist` · 17 suitów |

**AC:** `doStartGame` przekazuje `worldDensity` + `civTypesCount` (+ miasta-państwa gdy UI+MAPA API gotowe) → `generujSwiat`.

**Po GOTOWE:** `SILNIK-DO-MASTERA.md` · **`→ INTEGRATOR: GOTOWE` 🟡**

---

## Zadanie 4 — INTEGRATOR (Master w czacie Macieja)

| | |
|---|---|
| **Warunek** | UI 🟡 + MAPA ✅ + SILNIK 🟡 |
| **Akcja** | Batch ROBOCZA · bramka · MD5 · wpis DZIENNIK |
| **Maciej** | Playtest: Mało/Normalnie/Dużo surowców · rzeki mała vs duża mapa · miasta-państwa |

---

## Kolejka Task tool (sugerowana)

```
T0 [TERAZ, równolegle]
  Task MAPA  — composer-2.5-fast — MASTER-do-MAPA_E2-gestosc-generator.md
  Task UI    — composer-2.5-fast — UI.md E2 delta miasta-państwa

T1 [po MAPA → SILNIK: GOTOWE]
  SILNIK     — glm-5.2 / Master Silnik — main.ts batch E2

T2 [po T0+T1 meldunki]
  INTEGRATOR — build ROBOCZA + testy
```

**Limit playbook:** max 2 równoległe na pilot; tu 2 lane = OK.

---

## Eskalacja

| Problem | Kto |
|---------|-----|
| API miasta-państwa niejasne | UI ↔ MAPA handoff cross-lane |
| Regresja DEPOSIT_RULES | MAPA fix, nie SILNIK |
| Kolizja na `newGameMapDefaults.ts` | MAPA właściciel; UI tylko czyta kontrakt |

---

*MASTER dispatch 2026-06-28 · Maciej: „przykazane do orkiestratora”*
