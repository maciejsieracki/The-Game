# CYWILIZACJE → MASTER : wnioski + decyzje (dyplomacja/AI/cyw) + rozpoczęte buildy

Data: 2026-06-25 | Od: **CYWILIZACJE** | Status: **DECYZJE DO MACIEJA + buildy w toku**

**Pełny opis + turnieje:** `Civ-CYWILIZACJE/PROPOZYCJA-dyplomacja-AI-v0.1.md` (506 lin., decyzje w sekcji 5).

## Zwycięzcy turniejów + rekomendacje
- **T1 Respekt → A (14/15):** `computeRespekt(inputs, wagi)` = czysta fn w `diplomacy.ts`; SILNIK agreguje wejścia (UNITS=wojsko/bitwy, MIASTO=miasta, EKONOMIA=gospodarka, epoka) wg wag panelu; liczony WZGLĘDEM partnera.
- **T2 Zakres v0.1 → C (12/15):** rdzeń dyplomacji AI — wojna/pokój/trybut + jednostki specjalne + 2–3 efekty walki (A miał ten sam wynik, ale droższy).
- **T3 Bonusy cyw → A (13/15):** strukturalny schemat `{typ, cel, wartosc}` w `civs.json`; mechanizacja stopniowo per dział.
- **T4 Trudność → C:** v0.1 = bonusy; „spryt" AI (cele/agresja) w v0.2.

## Flagi (do decyzji/koordynacji mastera)
1. Niespójność: zerwanie umowy handlowej — szablon §1.5 = −15 Relacja/−10 Zaufanie, a kod nie ma osobnego eventu. → dodaję `zerwanie_handlu` (−10 Zaufanie).
2. `TypCywilizacji` enum = 7 + DrobnaCywilizacja vs roster 9 (brak Celtów/Germanów). Cross-lane (`Record<TypCywilizacji>` w wielu modułach) → koordynacja mastera.
3. `Typ główny = false` dla wszystkich 9 — flaga martwa; potwierdzić użycie/sens.

## Rozpoczęte buildy (solo, mój lane, na polecenie Macieja — wg rekomendacji; wszystko czyste/additive/NIEwpięte)
- `diplomacy.ts`: **computeRespekt** (T1=A) + **tickDiplomacy** (tura dyplomacji: per-turowe delty, wygasanie traktatów, zanik urazów) + event **zerwanie_handlu**. [w toku]
- Następnie: `ai.ts` **decideAIDiplomacy** (T2=C: wojna/pokój/trybut wg stance+archetyp+siła) + **AI świadome szans walki**; `civs.json` **schemat bonusów** (T3=A).
Raporty po testach. Wpięcie = master.
