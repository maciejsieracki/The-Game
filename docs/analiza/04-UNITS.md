# Analiza 04 — UNITS (jednostki + walka + oblężenie)

*Audyt: 2026-06-26 | Źródła: `units/setup.ts`, `combat.ts`, `battle/*`, `Jednostki.xlsx`*

---

## 1. Zakres lane'a

Jednostki wojskowe, model walki §5l (Total War), bitwa taktyczna 3D, oblężenie, stacking/merge armii.

**Własność:** `units/setup.ts`, `game/combat.ts`, `battle/*`, `Jednostki.xlsx`, `Macierz-walki.xlsx`.

---

## 2. Stan (% ~68%)

### DONE
- `combat.ts` — resolveCombat, structureDefenseBonusFor (mur+200/fort+100/posterunek+50)
- `battleScene.ts` — scena 3D bitwy, fazy dystansowa→szarża→zwarcie
- Model flanki/tyłu per typ jednostki (kolumny w units.json)
- Countery (trójkąt włócznik/konnica/dystans)
- Barbarzyńcy — spawn, AI, atak (barbarians.ts, 53 testów)
- Rename Hastati (przygotowane, gated na Zelazo 1A)
- Modele render jednostek (UnitRenderer, bespoke per cyw)
- Oblężenie PARTIAL: atrycja 8%, kapitulacja, mur+200%

### IN PROGRESS
- Kontrakt **multi-unit** (skład bitwy zbiorowej z heksa)
- Kontrakt **start oblężenia** (flaga oblegane, HP garnizon)
- Machiny in-siege (Taran=Kamień, Katapulta=Żelazo)
- Stacking bez limitu + merge wounded

### BLOCKED
- **UX bitwy Q2–Q7** — Maciej (auto vs ręczna, kamera, tempo)
- **Robotnik usunięty?** — decyzja 2A ZAMKNIĘTA (usuń), implementacja gated
- **Zelazo 1A** — rename Hastati/Triari, jednostki epoki

---

## 3. Model ruchu (decyzje Macieja)

| # | Decyzja | Status |
|---|---------|--------|
| 1C | Min. 1 pole przejezdne z resztką ruchu | ZAMKNIĘTE |
| 2 | Brak ZoC; reakcja fight/flee | ZAMKNIĘTE — CYWILIZACJE heurystyka |
| 3 | Stacking bez limitu + okno połącz/nie | ZAMKNIĘTE — UI showArmyStackPrompt gotowe |
| 4 | Zaokrętowanie po Żeglarstwie | Robocze A — do potwierdzenia |
| Posilki | Sąsiedztwo ≤1 heks | ZAMKNIĘTE |

**Granica MAPA↔UNITS:** ruch=MAPA; oblężenie+walka=UNITS od planszy walki.

---

## 4. Testy

| Suite | Wynik |
|-------|-------|
| combat-test | 6/6 |
| oblezenie-test | 27/27 |
| barbarians-test | 53/53 |
| battle-smoke.cjs | OK |

---

## 5. Kontrakty do dostarczenia (handoff → SILNIK)

| Kontrakt | Plik handoff | Status |
|----------|--------------|--------|
| multi-unit battle roster | UNITS-do-SILNIK_multi-unit.md | CZEKA |
| start siege + garnizon HP | UNITS-do-SILNIK_oblezenie-start.md | CZEKA |
| merge/stacking API | UNITS-do-UI_army-merge.md | CZEKA |
| fight/flee heurystyka | CYWILIZACJE-do-SILNIK_reakcja.md | CZEKA |
| machiny in-siege queue | UNITS-do-EKONOMIA_machiny.md | CZEKA |

---

## 6. Następne kroki

| # | Zadanie | Rola | AC |
|---|---------|------|-----|
| U1 | Kontrakt multi-unit + test 6/6 | Composer | Handoff SILNIK |
| U2 | Start oblężenia + HP garnizon | Composer | oblezenie-test rozszerzony |
| U3 | Machiny: Taran/Katapulta epoki | Composer | Warsztat oblezniczy prereq |
| U4 | UX bitwy spec (po Q2) | GLM→Composer | Q po Q z Maciejem |
| U5 | Panel transferu armii (Total War) | UI+Composer | Makieta-panel-armii.html |
| U6 | Usunięcie Robotnika z main/setup | Composer | Po potwierdzeniu 2A |

*Rola: Composer + GLM (UX spec bitwy)*
