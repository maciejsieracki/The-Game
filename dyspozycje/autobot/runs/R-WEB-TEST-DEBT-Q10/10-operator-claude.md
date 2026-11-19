STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy; bez zmian w gra/src ani gra/data)
TEMAT: R-WEB-TEST-DEBT-Q10
GOAL: triage 18 czerwonych testów na origin/main (04722f538) + naprawa testów nieaktualnych (a) i kotwic (b); błędy gry (d) tylko opisać.
ZMIANY/COMMIT: gra/tools/citypanel-konwerter-produkcja-test.cjs (b: kotwica N2 po dodaniu toggledOff), gra/tools/hotseat-etap5-no-leak-test.cjs (a: guard zamykający ekran powitalny nowej cywilizacji, który przechwytuje kliki). Raport: ten plik. Brak zmian w src/data.
TESTY: tsc --noEmit exit 0; logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace (6 plików) exit 0, 21 [OK] w unit-replace-test; combat exit 0. Po zmianach: citypanel 108 pass / 0 fail (przed: 107/1); hotseat PASS A=PASS B=PASS (91 s; przed: exit 2, klik przechwycony przez #civ-welcome-screen-root). Mutacja kotwicy: `resolveOwnedBuildingInactiveStatus(...)` w miejscu flagi -> regex odrzuca (sprawdzone node). Mutacja hotseat: wersja bez guardu czerwona (dowód z pierwszego biegu). Zielone z 18: 3 (citypanel, hotseat, autoimprove z limitem >=142 s). Tryb flagi OFF (setEraRebalanceEnabledForTest(false)) NIE ZMIERZONO - testy uruchomione tylko w stanie domyślnym.
BLOKADY: 15 testów czerwonych wymaga decyzji właściciela lub osobnego tematu gry (patrz tabela). Brak ścieżki bezpiecznej naprawy bez zmiany reguł.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: (1) decyzja ABC o regule x5 i bazie surowców (ekonomia-5x, grupa-b, hex, mennica, tarasy); (2) decyzja o Mennicy bez złota i stadnina na lesie (zloto, hodowla-las, map-improvement); (3) tematy gry dla pozycji (d).
DEPLOY/PUSH: NIE WYKONANO

## Tabela (origin/main 04722f538, stan domyślny flagi)

| test | wynik | czerwone asercje (plik:linia / treść) | przyczyna | działanie |
|---|---|---|---|---|
| auto-fort-claim | 61 pass / 2 fail | :47 "bez limitu droga JEST budowana" got []; :51 "fort stoi -> drogi ruszają" | d? nieustalone | zostawiono czerwone |
| autoimprove-irrigation-after-farms | 42/0 | timeout 130 s w runnerze; przechodzi w 142 s | c (czas) | bez zmian; wymaga limitu >=200 s |
| building-upkeep-resources | 47 pass / 1 fail | D10 :169 karta musi używać stockResourceLabel + plUpkeepForm; w buildingAdapter.ts helper UPKEEP_NOUN_FORMS/plUpkeepForm (~237-252) nieużywany | d? (martwy kod po refaktorze; NIE ZMIERZONO w przeglądarce) | zostawiono czerwone |
| citypanel-konwerter-produkcja | 108/0 | (przed: N2 :274 kotwica `convInactive = inactiveStatus?.inactive === true`) | b: po dodaniu `toggledOff \|\|` | NAPRAWIONO (regex akceptuje oba warianty, intencja zachowana) |
| ekonomia-5x-inwariant | 230 / 50 fail | "wielokrotność 5" (units: 13, 38, 3, 8) i PRZYPIĘTE (Równina.Drewno got 5 want 10; Równina.Kamień 2/5; Rzeka.Glina 5/10; wycinka 50/25) | a: P-SUROWCE-BAZA-DREWNO-KAMIEŃ-GLINA-Q1 (2026-08-17) zmienił bazę terenu; wartości jednostek nie są już x5; źródło zmian jednostek NIE USTALONO | wymaga decyzji ABC: czy reguła x5 obowiązuje; nie przypinano nowych wartości |
| entity-card-cross-links-nested-overlay | 17 pass / 7 fail | [2] Esc #1: backdrops 0, remainingKind null | c: niestabilny (w dispatchu raz 17/7, raz 24/0; u mnie 17/7) | zostawiono; retry nie dodany (ryzyko maskowania) |
| fishing-boats-666 | 20 OK / 2 FAIL | encyklopedia lodzie_rybackie.md i wikiBundle.json: "+6/+6/+6" | a-doc: dane i testy = 6/6/6, opisy stare; pliki poza allowlistą | zostawiono; propozycja tematu dokumentacyjnego |
| grupa-b-lane | 43 / 6 | "las równina drewno 10+15 (x5, bylo 2+3)", clearing 5P, tick 25, food 30%, reserve | a: pinned x5 wobec P-SUROWCE i kosztów | zostawiono (decyzja ABC) |
| hex-plony-magazyn | 10 / 4 | rzeka +10 (got 7 vs 15); Równina+Łąka drewno/kamień/glina; glina addytywnie | a/d?: rzeka = osobny modyfikator wg P-SUROWCE; wynik 7 wymaga sprawdzenia | zostawiono |
| hodowla-las | 106 / 7 | stadnina "kwalifikuje się na lesie (zakaz cofnięty)" mapy 90210/777/31415; AI wybiera stadninę poza złożem | NIE USTALONO: zakaz lasu zniesiony intencjonalnie czy regresja; konflikt z map-improvement-qualify | zostawiono (decyzja ABC) |
| hotseat-etap5-no-leak | exit 2 (przed) -> PASS (po) | klik "Budowa ulepszeń" przechwycony przez #civ-welcome-screen-root (FALA 840/870) | a/c: test nie odprawia ekranu powitalnego | NAPRAWIONO: guard klika [data-cww="close"] realnym klikiem |
| hud-skarbiec | 39 / 1 | MIEJSCE POPRAWKI: previewCityEconomy w refreshLiveEmpireRatesUnsafe = 3 wywołania (oczekiwane 1) | d?: dodatkowe wywołania; NIE USTALONO czy zamierzone | zostawiono |
| mennica-magazyn | 34 / 7 | Mennica bez Waluty delta 0 (want 2); cityYieldPerTurn x5 (30 vs 60, 12 vs 30); Garncarnia ceramika undefined; odlewnia_brazu bez rudy | a (x5) + d? (Garncarnia, odlewnia) | zostawiono |
| rekrutacja-koszty-polowa-all | exit 1 | AssertionError "Wojownik: unrelated fields changed" | NIE ZMIERZONO (przyczyny nie analizowano) | zostawiono |
| stadnina-early-eras-deposit-only | 34 / 1 | "auto-improvements.ts: stan dla buildImprovementQualifier niesie playerEra" | NIE ZMIERZONO (prawdopodobnie kotwica b; do sprawdzenia) | zostawiono |
| tarasy-cywilizacje | 14 / 3 | lama ma pole cywilizacje; AI Chińczycy i Inkowie: 2 buildImprovement (want 1) | d?: zachowanie AI i gate lamy; NIE USTALONO | zostawiono |
| map-improvement-qualify | 132 / 1 | "ŻYWY TEST GOAL 1: stadnina KWALIFIKUJE SIĘ na Łące+Lesie po Koniu" | sprzeczne z hodowla-las; decyzja ABC | zostawiono |
| zloto-test | 38 / 7 | Mennica dostępna bez złota (kanon magazyn); stadnina 5 Koń/t (korekta 2026-08-12); "Złoto" jako etykieta; parytet AI | NIE USTALONO: bramka złota zmieniona (d) czy test przestarzały (a); wymaga ABC | zostawiono |

Liczby z surowych wyjść logów: scratchpad `.../scratchpad/q10/*.log`. Komenda: z katalogu gra/ `CHROME_PATH=/usr/bin/google-chrome node tools/<nazwa>-test.cjs`.

## UWAGI-DLA-ORKIESTRATORA
- W tym biegu nie ustalono zmian (d) bez decyzji właściciela. Kilka pozycji (a) wymaga ABC: reguła x5 (ekonomia-5x, grupa-b, mennica), bramka złota (zloto), zakaz stadniny na lesie (hodowla-las vs map-improvement-qualify).
- Zalecany temat dokumentacyjny: lodzie_rybackie w encyklopedii i wikiBundle.json (+6/+6/+6).
- Zalecany temat gry: sprawdzić martwy plUpkeepForm/UPKEEP_NOUN_FORMS w buildingAdapter.ts (karta utrzymania) oraz dodatkowe wywołania previewCityEconomy w main.ts (hud-skarbiec).
- Autoimprove wymaga limitu >=200 s; hotseat ok 90 s; ekonomia/zloto do 15 s.
