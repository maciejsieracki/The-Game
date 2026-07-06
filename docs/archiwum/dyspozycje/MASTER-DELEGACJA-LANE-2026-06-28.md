# MASTER → Maciej: delegacja pozostałej pracy (2026-06-28)

**Od:** MASTER (sesja pilna)  
**Status:** SILNIK **zakończył kod** sesji · reszta = **osobne czaty lane**

---

## Co MASTER/SILNIK domknął (NIE otwieraj ponownie)

| Batch | Gdzie |
|-------|--------|
| B5 żywność HUD · F2 minimapa · Wpływ/ Skarbiec · zasięgi 3D | `Gra-podglad.html` |
| OBL-S5 machiny · OBL-S7 AI oblężenie · D-START P0 | `main.ts` |
| F-B-TARTAK-DREWNO · save ulepszeń mapy | `main.ts` |
| Bramka testów | 490+ testów ZIELONE (2026-06-28) |

**SILNIK teraz:** tylko test + meldunek — `dyspozycje/SILNIK.md` § TESTUJ

---

## Otwórz te czaty (pilne)

| # | Czat / lane | Plik startowy | Zadanie | Handoff |
|---|-------------|---------------|---------|---------|
| 1 | **Civ-MAPA** | `dyspozycje/MAPA.md` | **OBL-S6** obóz 3D (Q10=C) | `_handoff/MASTER-do-MAPA_oboz-3D-OBL-S6.md` |
| 2 | **Civ-MAPA** | `dyspozycje/MAPA.md` | **E-P0-04/05** złoża miedź/żelazo epoki | `_handoff/GRUPA-E-do-MAPA_zloza-epoki-8B-star.md` |
| 3 | **Civ-CYWILIZACJE** | `dyspozycje/CYWILIZACJE.md` | **D-P0-01…03** Excel Grupa D | `P0-KOLEJKA-LUKI.md` § Grupa D |
| 4 | **Civ-CYWILIZACJE** | `dyspozycje/CYWILIZACJE.md` | **E-P0-06** zwycięstwo Power | `_handoff/GRUPA-E-do-CYWILIZACJE_victory-10A-star.md` |
| 5 | **Civ-UI** | `dyspozycje/UI.md` | **E-P0-01…03** menu S0 hybryda | `_handoff/GRUPA-E-do-UI_menu-S0-5C.md` |
| 6 | **Opus 4.8** (Ask, ręczny) | `docs/decyzje/OPUS-REVIEW-QUEUE.md` | **HUD-S7** review → kanon | `Gra-podglad.html` = ROBOCZA |
| 7 | **Civ-UI** | `dyspozycje/UI.md` | **UI-P1-02** panel jednostki vs mockup A2 | decyzja **A2-Q4=A** · weryfikacja wizualna |
| 8 | **Civ-MAPA** | `dyspozycje/MAPA.md` | **MAP-P1-04** audit ulepszeń A4-D4 | `terrain-improvements.json` |
| 9 | **Civ-EKONOMIA** | `dyspozycje/EKONOMIA.md` | **EKO-P2-01** pełny tick B5 | `_handoff/EKONOMIA-do-SILNIK_B5-empire-food.md` |

**SILNIK:** pozycje 1–9 = **NIE Twój kod** — tylko przekaż Maciejowi / otwórz właściwy czat lane.

---

## Komenda w czacie lane

```
start — przeczytaj dyspozycje/<LANE>.md sekcja DO ZROBIENIA TERAZ i wykonaj bez pytania
```

---

## Po GOTOWE od lane

1. Lane melduje `<LANE>-DO-MASTERA.md` + flaga `→ SILNIK: GOTOWE`
2. **Master Silnik** (osobny czat) wpina do `main.ts` jeśli trzeba
3. **Grupa F / SILNIK** — bramka + ROBOCZA
4. **Opus** → `Gra-podglad.html` oficjalny

---

## Kolejność rekomendowana Mastera

1. **Opus** (szybki sign-off tego co jest)  
2. **MAPA OBL-S6** (wizual oblężenia — OBL-S5 już w silniku)  
3. **UI E-P0-01** (menu — wejście w grę)  
4. **CYW D-P0-01** (Excel AI kopie typu)  
5. MAPA złoża · CYW victory · reszta P2
