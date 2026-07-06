# SILNIK — rozdzielenie WSZYSTKICH wiszących tematów (2026-06-29)

| Pole | Wartość |
|------|---------|
| **Od** | MASTER (Maciej: „wszystko co wisi u innych → SILNIK rozdysponuje”) |
| **Flaga** | **→ SILNIK: ROZDYSponuj TERAZ** |
| **Rola SILNIK** | **Jedyny router** lane'ów · MASTER **nie trzyma** kolejki od 29.06 |

**Zasada:** SILNIK **nie koduje** tematów lane (OBL-S6, menu, Excel…) — **wysyła** Macieja do właściwego czatu + dopisuje dyspozycję w `<LANE>.md` i `<LANE>-DO-MASTERA.md`. SILNIK **koduje** tylko `main.ts` + kanon gdy jest `→ SILNIK: GOTOWE` (moduł lane) lub własna bramka.

---

## A. GOTOWE-do-wpiecia → SILNIK (`main.ts` + ROBOCZA)

| # | ID | Temat | Handoff | Priorytet |
|---|-----|-------|---------|-----------|
| 1 | **E-P0-06** | Zwycięstwo Power+rakieta (10=A*) | `CYWILIZACJE-do-SILNIK_victory-10A.md` | **P0** |
| 2 | **E2-11** | Barbarzyńcy reguła epok (11=C*) | `CYWILIZACJE-do-SILNIK_barbarians-11C.md` | **P0** |
| 3 | **D-P0-4** | Bonusy walki 3D + integracja Grupa D | `CYWILIZACJE-do-SILNIK_F-GRUPA-D-P0-integracja.md` | **P0** |
| 4 | **UI-B2** | Społeczeństwo B2 — haki panelu | `UI-do-MASTER_B2-spoleczenstwo.md` | **P1** |
| 5 | **MAPA-B2-Q5** | Ikona 🔥 buntu na hex | `MAPA-do-SILNIK_B2-Q5-bunt-hex.md` | **P1** (jeśli MAPA nie zrobił — najpierw eskaluj MAPA) |
| 7 | **E2-SILNIK** | Wpięcie `worldDensity` + `civTypesCount` | **P1** (blok: MAPA `→ SILNIK: GOTOWE`) | `MASTER-do-SILNIK_E2-gestosc-wpiecie.md` |
| 8 | **F-CITY-HEX** | Czysty hex po founding | `MASTER-do-SILNIK_F-city-hex-czysty.md` | **P1** (po EKONOMIA snapshot) |

**Po każdym batchu:** build `/tmp/civ-dist` · bramka · `Gra-podglad-ROBOCZA.html` · meldunek `SILNIK-DO-MASTERA.md`.

**Już WPIĘTE (nie powtarzaj):** sesja 28.06 (B5/F2/tartak/OBL-S5/S7/D-START P0) · F-B-PILNE · F-B-WYRAB-TARTAK · F-B-TARTAK-DREWNO · cluster-spawn · mgla-ghost · spawn obcy.

---

## B. ROBIA u lane — SILNIK wysyła Macieja (`start` w czacie)

| # | Lane | Czat Cursor | ID | Temat | Plik start | Handoff |
|---|------|-------------|-----|-------|------------|---------|
| 1 | **MAPA** | Grupa A | **OBL-S6** | Obóz 3D oblężenia | `MAPA.md` | `MASTER-do-MAPA_oboz-3D-OBL-S6.md` |
| 2 | **MAPA** | Grupa A | **E-P0-04/05** | Złoża epok | `MAPA.md` | `GRUPA-E-do-MAPA_zloza-epoki-8B-star.md` |
| 3 | **MAPA** | Grupa A | **MAP-P1-04** | Audit ulepszeń A4-D4 | `MAPA.md` | `terrain-improvements.json` |
| 4 | **MAPA** | Grupa A | **MAP-S1** | Miasta 10 poz + mury | P2 | `A5-do-MAPA_miasta-10poziomow-mury.md` |
| 5 | **UI** | Grupa E | **E2** | Gęstość świata kreator | `UI.md` | `UI-do-INTEGRATOR_E2-kreator-gestosc.md` ✅ UI · czeka MAPA+SILNIK |
| 6 | **MAPA** | Grupa A | **E2-GEN** | Generator gęstości + `generujSwiat(opts)` | `MAPA.md` | `MASTER-do-MAPA_E2-gestosc-generator.md` |
| 7 | **UI** | Grupa A | **UI-P1-02** | Panel jednostki A2 | `UI.md` | A2-Q4=A |
| 7 | **UI** | Grupa A | **P0-D4** | preBattle bonusy cyw | `UI.md` | `CYWILIZACJE-do-UI_bonusy-wyswietlanie.md` |
| 8 | **EKONOMIA** | Grupa B | **EKO-P2-01** | Pełny tick B5 | `EKONOMIA.md` | `EKONOMIA-do-SILNIK_B5-empire-food.md` |
| 9 | **EKONOMIA** | Grupa B | **F-CITY-HEX** | Snapshot hex miasta | `EKONOMIA.md` | `MASTER-do-EKONOMIA_F-city-hex-snapshot.md` |
| 10 | **UNITS** | Grupa C | **P1** | typeId + helmy na mapie | `UNITS.md` | plan §1–2 (wizual, nie blocker P0) |

**CYW lane:** D-P0-01…03 + victory/barbarians moduły = **DONE** (patrz sekcja A). Jeśli `diplomacy-test` nadal FAIL — eskaluj CYW naprawę w `diplomacy.ts` (nie main.ts).

**Komenda dla Macieja w czacie lane:** `start`

**Po GOTOWE lane:** meldunek `<LANE>-DO-MASTERA.md` + flaga `→ SILNIK: GOTOWE` → SILNIK wpina (jeśli dotyczy `main.ts`).

---

## C. Proces — SILNIK przypomina Maciejowi (nie lane)

| # | Temat | Akcja | Plik |
|---|-------|-------|------|
| 1 | **Opus HUD-S7** | Otwórz **Opus 4.8 Ask** → review batch 28.06 | `docs/decyzje/OPUS-REVIEW-QUEUE.md` |
| 2 | **Playtest** | Ctrl+F5 `Gra-podglad.html` — checklist | `_handoff/MASTER-do-SILNIK_handoff-test-sesja-2026-06-28.md` § AC |
| 3 | **Promocja kanonu** | Po Opus APPROVE → `Gra-podglad.html` oficjalny | SILNIK only |

---

## D. BLOK — czeka Maciej ABC (SILNIK nie deleguje)

| Temat | Plik | Po ABC |
|-------|------|--------|
| **B1-tech Q1–Q5** | `docs/decyzje/B1-tech-ABC-OTWARTE.md` | CYW + EKONOMIA → potem SILNIK usuwa aliasy |

---

## E. Kolejność rozdzielenia (rekomendacja SILNIK)

1. **Wpięcie P0** z sekcji A (victory → barbarians → Grupa D integracja) — **1 batch naraz**
2. **Przypomnij Maciejowi:** Opus + playtest (równolegle)
3. **Eskaluj lane P0:** MAPA OBL-S6 · UI menu · EKO B5 tick
4. **P1** po P0: UI panel jednostki · MAPA złoża · B2 haki
5. **B1-tech** — dopiero po literach Macieja

---

## F. Meldunek SILNIK (obowiązkowy)

```
### [2026-06-29] SILNIK → MASTER: rozdzielenie lane

Wpięte dziś: …
Eskalowano Maciejowi: MAPA/UI/EKO/UNITS — …
Opus/playtest: CZEKA|OK
→ MASTER: routing-29.06 ZAMKNIĘTY
```

**Maciej w czacie SILNIK:** `start` — SILNIK czyta ten plik + `SILNIK.md` § DO ZROBIENIA TERAZ.
