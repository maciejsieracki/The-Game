# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — Final Control, runda 2/5

**Uwaga proceduralna:** agent Final Control zwrócił kompletną treść tego raportu przez
StructuredOutput, ale proces zakończył się przed zapisaniem/zacommitowaniem pliku na dysku.
Orkiestrator odtwarza ten raport z zarejestrowanej treści zwrotnej agenta, bez zmiany
choćby jednego znaku, i commituje w jego imieniu.

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1
GOAL: AI wybiera budynki z tego samego źródła co gracz (availableProduction()), punktowane po BuildingDef.grupa, zero zaszytych id budynków jako źródła kandydatów. Final Control rundy 2/5 — ocena Obrony na 4 zarzuty Evaluatora (ratyfikacja 00-dispatch.md).

## Metoda i guard
Worktree /home/user/wt-ai-produkcja, HEAD a5f84aa1 (Operator, Obrona rundy 2/5), drzewo czyste. Guard w moim promptcie podawał oczekiwany HEAD 6a40594b (ratyfikacja) — sprawdziłem `git merge-base --is-ancestor 6a40594b HEAD` = true, a trzy commity pomiędzy (f9294ac0/ad05adbd/a5f84aa1) to dokładnie Operator/Evaluator/Obrona rundy 2 opisane w dispatchu — nieodświeżony snapshot guarda z początku rundy, nie rozbieżność tożsamości (ten sam precedens co Final Control rundy 1 wobec analogicznej sytuacji). Nie BLOCK, kontynuowałem. `git diff 6a40594b HEAD --stat`: zmiany wyłącznie w allowlist (ai.ts, 4 pliki tools/ai-*, 3 raporty rundy 2). Zero zmian w gra/data/**, gra/main.ts, docs/decyzje/**.

## Testy (odtworzone niezależnie)
`tsc --noEmit`: 0 błędów. 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6 — wszystkie uruchomione osobiście. Rodzina ai-*.cjs: 39 plików w tools/, 38 uruchomionych indywidualnie (ai-buduje-budynki-test.cjs pominięty — Vite/Chromium, potwierdzone niezwiązane w rundzie 1). Wynik identyczny z raportem Obrony: ai-threat-mode-test 12/0 (T8h obecny i zielony), ai-produkcja-pokrycie-katalogu-test 6/0 (Katalog: 42 z danych), ai-jednostki-tylko-zakup-test 44/0 (chroniony gate nietknięty). 4 przedistniejące czerwone zweryfikowane BIT-DO-BITU wobec tymczasowego worktree na 6a40594b (osobny `git worktree add`, node_modules symlink, bez `npm install`/build w gra/): ai-balans-step3-test 7/1, ai-praca-split-parity-test 21/1, ai-slider-test 33/5, ai-test 291/4 — identyczne liczby przed/po, zero nowych regresji. Katalog buildings.json: 42 (liczone z danych, node -e). Uwaga proceduralna: dwukrotnie podczas mojego biegu ai-balans-step2-smoke.cjs zregenerował docs/decyzje/AI-BALANS-STEP2-SMOKE.md (efekt uboczny runu, poza allowlistą) — cofnięte `git checkout --` natychmiast oba razy, drzewo czyste na końcu.

## Własne mutacje (7, min. 5 wymagane)
1. Zagrożenie, WŁASNY scenariusz (4 miasta, tura 77, inny zestaw kandydatów niż T8d): brak zagrożenia→koszary, z wrogiem w zasięgu→mury. Flip potwierdzony niezależnie.
2. Granica, WŁASNA geometria (inna niż T8h): obcy właściciel w zasięgu→mury; ten sam obcy właściciel POZA marginesem→koszary (brak fałszywego pozytywu).
3. Bisekcja progu granicznego w MOIM scenariuszu: 60/100/105/110→koszary, 120→mury — inny próg niż w T8d-owym scenariuszu Obrony (tam 110), ale 120 działa odpornie w OBU niezależnie skonstruowanych scenariuszach.
4. Miasto-państwo (defensiveCopy): NIETKNIĘTE — identyczny wybór (Wojownik bez garnizonu / studnia z garnizonem) niezależnie od obecności nowego sygnału granicznego w opts.territoryNodes.
5. Bisekcja Spichlerza przy chronionym gate: podstawiłem AI_MAJOR_SPICHLERZ_PRIORITY_BONUS=9 (kopia pliku, przywrócone natychmiast) → ai-jednostki-tylko-zakup-test 41/3 (było 44/0) — potwierdza dokładnie próg zgłoszony przez Obronę.
6. Spichlerz w proxy, WŁASNY scenariusz (2 miasta, tura 45, inny niż raport): bonus=0→pozycja 11/42, bonus=8→pozycja 10/42 — przesunięcie o dokładnie 1 pozycję, jakościowo identyczne ze zgłoszeniem Obrony (12→11 w ich scenariuszu), różne liczby jak oczekiwano przy innym scenariuszu.
7. Grep 13 zaszytych literałów fortyfikacji/priorytetu/konwerterów w ai.ts — wszystkie obecne (≥1 wystąpienie każdy), zgodne z listą Obrony.

## Ocena 4 zarzutów
Wszystkie 4 PRZYJĘTE przez Obronę z konkretną poprawką i dowodem — zweryfikowałem każdą niezależnie (patrz mutacje wyżej + odczyt kodu):
1. (a)/(a2) słusznie uznane za degeneracko puste; naprawa (komentarz + T8h) zweryfikowana — T8h realnie testuje pole konkurencyjne, zielony 12/12.
2. Bonus graniczny 60→120 słusznie podniesiony; zweryfikowałem niezależnie że 120 działa odpornie także w INNYM niż T8d scenariuszu (mój próg przełamania: 110 nieskuteczne, 120 skuteczne).
3. Tabela 42 budynków/epoka dostarczona w 03-operator-obrona-runda2.md, spójna z formułą GROUP_BUILDING_BASE/COST_WEIGHT w kodzie (zweryfikowałem stałe źródłowo).
4. Ślad Spichlerza (3 miasta, tura 60, bonus 0→12/42, bonus 8→11/42) odtwarzalny, oba komentarze w kodzie zreconciled — potwierdzone czytaniem obu miejsc w ai.ts (linie ~1417-1436 i ~1735-1750).

## Otwarta, nierozstrzygnięta decyzja (powód STATUS DECISION_REQUIRED)
Niezależnie od 4 zarzutów: Operator sam zgłosił (§3 raportu rundy 2, potwierdzone przez Evaluatora i niezależnie przeze mnie mutacją #5) że AI_MAJOR_SPICHLERZ_PRIORITY_BONUS jest TWARDO ograniczony do 8 przez chroniony gate ai-jednostki-tylko-zakup-test (9 już łamie 44/0→41/3) — pełne odtworzenie historycznej wczesnej pozycji Spichlerza (2.-4. miejsce, jak żądała ratyfikacja "odtwarzającym jego dawną wczesną pozycję") wymagałoby bonusu ~15-30, co jest niemożliwe bez osłabienia chronionego gate. Wartość 8 daje tylko przesunięcie o ~1 pozycję (z ok. 11.-12. na 10.-11.), NIE zbliżoną do historycznej 4.To jest nowa, nierozstrzygnięta decyzja produktowa (surowa dopiero w tej rundzie, bo dopiero bisekcja ją ujawniła) — właściciel musi zdecydować: (a) zaakceptować częściową poprawę jako wystarczającą, czy (b) zlecić osobny temat kalibracji (np. rozluźnienie damping majorEarly), zanim temat zostanie zintegrowany. Nie jest to NAPRAW (nic w kodzie nie jest błędne — Operator uczciwie, jawnie zgłosił ograniczenie zamiast cicho je ukryć, zgodnie z regułą przeciw samooszukiwaniu trybu trzeciego) ani odroczone kryterium 4 (to osobna, nowa sprawa).

## Kryterium 4 (150 tur w realnym silniku)
Świadomie odroczone przez właściciela (ratyfikacja) — NIE liczy się jako brak ani jako DO DECYZJI. Odnotowane jako otwarte ryzyko do zweryfikowania nocnym przebiegiem i playtestem właściciela, zgodnie z instrukcją.

## Tabela pokrycia (zweryfikowana niezależnie)
| Zakres | Wynik |
|---|---|
| Major AI, pełny katalog | 42/42 (mury/fort/baszta odblokowane, P-AI-008 usunięta) |
| Miasto-państwo (defensiveCopy) | 42/42 (nietknięte — potwierdzone moją mutacją #4) |
| Katalog łącznie (buildings.json, liczone z danych) | 42 |
| ai-threat-mode-test.cjs | 12/12 (T8h border-only konkurencyjny, dodany Obroną) |
| ai-jednostki-tylko-zakup-test.cjs (chroniony gate) | 44/0 (bonus Spichlerza=9 łamie na 41/3 — potwierdzone moją mutacją #5) |

## Tabela priorytetów wszystkich 42 budynków per epoka (przyjęta od Obrony, zweryfikowana źródłowo — formuła i stałe zgodne z ai.ts)
| Epoka | Budynek | Grupa | Koszt | Score (bez wyjątku) | Wyjątek | Score końcowy |
|---|---|---:|---:|---:|---|---:|
| 1 | studnia | Zdrowie | 15 | 265.5 | — | 265.5 |
| 1 | garncarnia | Produkcja surowców | 18 | 254.6 | — | 254.6 |
| 1 | stolarnia | Produkcja surowców | 20 | 254.0 | — | 254.0 |
| 1 | kamieniarski | Produkcja surowców | 20 | 254.0 | — | 254.0 |
| 1 | spichlerz | Żywność | 20 | 244.0 | +8 (runda 2) | 252.0 |
| 1 | targowisko | Handel i pieniądz | 25 | 232.5 | — | 232.5 |
| 1 | dom_starszyzny | Prawo i administracja | 25 | 222.5 | — | 222.5 |
| 1 | garnizon | Prawo i administracja | 30 | 221.0 | — | 221.0 |
| 1 | palac | Prawo i administracja | 40 | 218.0 | — | 218.0 |
| 1 | kamienne_kregi | Wiara | 18 | 184.6 | — | 184.6 |
| 1 | palisada | Wojsko i obrona | 22 | 183.4 | — | 183.4 |
| 1 | stela | Nauka i kultura | 15 | 175.5 | — | 175.5 |
| 2 | koszary | Wojsko i obrona | 25 | 182.5 | +110 | 292.5 |
| 2 | biblioteka | Nauka i kultura | 25 | 172.5 | +90 | 262.5 |
| 2 | akwedukt | Zdrowie | 30 | 261.0 | — | 261.0 |
| 2 | cegielnia | Produkcja surowców | 22 | 253.4 | — | 253.4 |
| 2 | odlewnia_brazu | Produkcja surowców | 28 | 251.6 | — | 251.6 |
| 2 | kuznia | Produkcja surowców | 30 | 251.0 | — | 251.0 |
| 2 | spichlerz_ii | Żywność | 35 | 239.5 | — | 239.5 |
| 2 | magazyn | Handel i pieniądz | 20 | 234.0 | — | 234.0 |
| 2 | mennica | Handel i pieniądz | 28 | 231.6 | — | 231.6 |
| 2 | port | Handel i pieniądz | 30 | 231.0 | — | 231.0 |
| 2 | trybunal | Prawo i administracja | 30 | 221.0 | — | 221.0 |
| 2 | dwor_zarzadcy | Prawo i administracja | 45 | 216.5 | — | 216.5 |
| 2 | palac_ii | Prawo i administracja | 60 | 212.0 | — | 212.0 |
| 2 | swiatynia | Wiara | 25 | 182.5 | — | 182.5 |
| 2 | mury | Wojsko i obrona | 35 | 179.5 | +180 zagrożenie / +120 granica (warunkowo) | 179.5 (bazowo) |
| 3 | laznia_publiczna | Zdrowie | 50 | 255.0 | — | 255.0 |
| 3 | odlewnia_zelaza | Produkcja surowców | 35 | 249.5 | — | 249.5 |
| 3 | akademia | Nauka i kultura | 70 | 159.0 | +90 | 249.0 |
| 3 | kuznia_zelaza | Produkcja surowców | 60 | 242.0 | — | 242.0 |
| 3 | port_wielki | Handel i pieniądz | 55 | 223.5 | — | 223.5 |
| 3 | sad | Prawo i administracja | 55 | 213.5 | — | 213.5 |
| 3 | pretorium | Prawo i administracja | 75 | 207.5 | — | 207.5 |
| 3 | palac_iii | Prawo i administracja | 90 | 203.0 | — | 203.0 |
| 3 | warsztat_oblezniczy | Wojsko i obrona | 65 | 170.5 | (poza MAJOR_FORTIFICATION_IDS) | 170.5 |
| 3 | fort | Wojsko i obrona | 70 | 169.0 | +180/+120 (warunkowo) | 169.0 (bazowo) |
| 3 | baszta | Wojsko i obrona | 70 | 169.0 | +180/+120 (warunkowo) | 169.0 (bazowo) |
| 3 | akademia_wojskowa | Wojsko i obrona | 80 | 166.0 | — | 166.0 |
| 3 | teatr | Nauka i kultura | 55 | 163.5 | — | 163.5 |
| 4 | wielka_odlewnia | Produkcja surowców | 80 | 236.0 | — | 236.0 |
| 4 | wielka_kuznia | Produkcja surowców | 90 | 233.0 | — | 233.0 |

## BLOKADY
DECISION_REQUIRED (jedyny, opisany wyżej): magnitude bonusu Spichlerza (8, bezpieczne maksimum) daje tylko częściowe odtworzenie historycznej pozycji, nie pełne (2.-4. miejsce, jak dosłownie żądała ratyfikacja) — właściciel decyduje, czy akceptować, czy zlecić osobną kalibrację. Kryterium 4 (150 tur, realny silnik) — świadomie odroczone, NIE blokada. Poza tym: zero nowych blokad, zero regresji, allowlista zachowana, guard zweryfikowany.

## ZMIANY/COMMIT
Final Control nie edytuje plików allowlisty — zero commitów tej rundy. Oceniany commit: a5f84aa1 (Operator, Obrona rundy 2/5). Ten raport zapisany osobno w dyspozycje/autobot/runs/R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1/.

RUNDY: 2/5
NASTĘPNY KROK: Właściciel rozstrzyga DECISION_REQUIRED (magnitude bonusu Spichlerza: akceptacja częściowej poprawy 8 vs zlecenie osobnej kalibracji) — dopiero potem integracja orkiestratora i odblokowanie R-PRAWO-PRZEBUDOWA-SKALI-Q1. Kryterium 4 pozostaje do nocnego przebiegu i playtestu właściciela, niezależnie od tej decyzji.
DEPLOY/PUSH: NIE WYKONANO

WERDYKTY:
1 -> ODDAL
2 -> ODDAL
3 -> ODDAL
4 -> ODDAL
