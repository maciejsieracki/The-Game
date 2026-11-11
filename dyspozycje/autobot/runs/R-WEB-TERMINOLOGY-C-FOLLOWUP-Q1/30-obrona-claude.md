STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TERMINOLOGY-C-FOLLOWUP-Q1
GOAL: Dług #204 po R-WEB-TERMINOLOGY-C-AND-ONESHOT-LABEL-Q1: (a) panel imperium „Handel i pieniądz” jako „Podatek i pieniądz” (klucz danych bez zmian); (b) przegląd stylów/tekstów JSON kart; (c) wiki „Mnożnik handlu/waluty” — zmiana tylko, jeśli mnożnik dotyczy podatku.
ZMIANY/COMMIT: Obrona r1 NIE zmienia kodu. Kandydat kodu: 73ce56f83 (baza af1235544 = origin/main), `git diff --name-only af1235544 73ce56f83`: gra/src/ui/empireDetailPanel.ts, gra/tools/terminology-trade-vs-tax-test.cjs, dyspozycje/autobot/runs/R-WEB-TERMINOLOGY-C-FOLLOWUP-Q1/10-operator-claude.md. Commit obrony: tylko ten plik (30-obrona-claude.md), git add jawną ścieżką. SHA końcowy: patrz pole sha w StructuredOutput.
ZAKRES (a) — bez zmian względem r1: empireDetailPanel.ts:117-121 (mapa EMPIRE_BUILDING_GROUP_LABEL, `'Handel i pieniądz': 'Podatek i pieniądz'`), użycie w wierszu grupy, stopka empireDetailPanel.ts:2318 pokazuje „Podatek i pieniądz”. Klucz `grupa` i BUILDING_GROUP_ORDER nietknięte.

ODPOWIEDZI NA ZARZUTY EVALUATORA (4acec825e, raport 20-evaluator-claude.md, werdykt PASS-WITH-NOTES, zero zarzutów blokujących):

Zarzut 1 (nota niskiej wagi): brak tabeli plik:linia przejrzanych trafień w (b). — PRZYJMUJĘ. Dodaję poniżej tabelę (sekcja „Tabela (b)”) z surowego grepa `handl|Handel` po gra/data/building-cards-top5.json i gra/data/tech-cards-top5.json oraz wynik przeglądu klasyfikacyjnego. Wynik merytoryczny bez zmian: żadne trafienie w kartach nie oznacza podatku jako „handlu”; trafienia to trasy handlowe (B, zostają), nazwy budynków/technologii (zostają), albo już poprawny tekst podatku („Port wielki: +10 podatku…”, tech-cards-top5.json:1052).

Zarzut 2a (nota: render panelu imperium w Chromium NIE_ZMIERZONO; zmianę etykiety potwierdzają tylko asercje źródłowe [C-FU]). — PRZYJMUJĘ FAKT, ODRZUCAM jako wymóg blokujący. Powód: DODATEK orkiestratora (sekcja KRYTERIA: lista napisów, brak starych form w obszarze, ids-leak, wonder-text, city-administrator 117, wikiBundle odtwarzalny, testy terminologii zielone, tsc, 5 bramek referencyjnych) nie zawiera kryterium renderu w przeglądarce; temat to podmiana stałego napisu w jednej mapie i jednej stopce. Render NIE_ZMIERZONO pozostaje jawnie otwarty; jeśli orkiestrator uzna, że CLAUDE.md §9 (realna weryfikacja w przeglądarce dla tematów wizualnych) obejmuje ten temat, wymaga to osobnego kroku przed READY_FOR_DEPLOY — nie robię go w tej rundzie.

Zarzut 2b (nota: pkt (c) zgłoszony jako DECISION_REQUIRED; PORADNIK-GRACZA-SPIS-TRESCI.md:2352 „Mnożnik handlu — więcej złota z suwaka Daniny” poza zakresem). — PRZYJMUJĘ. Pkt (c) zostaje bez zmian w kodzie i wiki (zgodnie z dispatchem: „jeśli dotyczy tras — nie zmieniaj i zgłoś”). Dodatkowe dowody ponad raport r1, zweryfikowane przeze mnie na 73ce56f83 (patrz „Tabela (c)”): (1) turn-economy.ts ma 0 wystąpień `meta_mnoznik_waluta`, a opis gra/src/civ-matrix-semantic.ts:96 podaje „turn-economy.ts:297” jako miejsce wpięcia — rozbieżność dokumentacji z kodem potwierdzona; (2) PORADNIK:2352 zostaje poza zakresem (klasa: tekst podatku, nie obszar tego tematu; to kandydat na osobny temat R-WEB-* lub ABC, nie zmieniam w tej rundzie).

ZAKRES (b) — przegląd, BEZ zmian (wynik jak w r1, uzupełniony o tabelę).
ZAKRES (c) — NIE ZMIENIONO, DECISION_REQUIRED (wynik jak w r1, uzupełniony o tabelę wystąpień i dowody z Evaluatora zweryfikowane grepem).

TABELA (b) — gra/data/building-cards-top5.json i tech-cards-top5.json, surowy grep `handl|Handel` na 73ce56f83:
| plik:linia | fragment (skrót) | klasa | decyzja |
|---|---|---|---|
| building-cards-top5.json:172 | „+50% dochodu z tras handlowych miasta” | B trasy | zostaje |
| building-cards-top5.json:174 | „Każda trasa handlowa tego miasta…” | B trasy | zostaje |
| building-cards-top5.json:185, 219, 798 | „+1 trasa handlowa i premia 5% trasy” | B trasy | zostaje |
| building-cards-top5.json:249, 283 | „Zbuduj/Rozbuduj Port handlowy…” (nazwa budynku) | nazwa budynku | zostaje |
| building-cards-top5.json:263 | „Podwaja podatek z Portu handlowego…” | nazwa budynku, tekst podatku poprawny | zostaje |
| building-cards-top5.json:268, 269 | „Zachowuje trasę handlową i premię morską Portu” | B trasy | zostaje |
| tech-cards-top5.json:129, 231 | „Warunek Wymiany — klucz do tras handlowych” | B trasy | zostaje |
| tech-cards-top5.json:130, 232 | „…bez których nie wyznaczysz żadnej trasy handlowej” | B trasy | zostaje |
| tech-cards-top5.json:357, 358 | „Otwiera handel: bez Wymiany nie ma tras handlowych” / „Wymiana jest warunkiem handlu” | B trasy/handel | zostaje |
| tech-cards-top5.json:362, 364 | „Targowisko: +50% dochodu z tras handlowych miasta” | B trasy (Targowisko) | zostaje |
| tech-cards-top5.json:368, 387, 388, 392 | trasy handlowe, „nowe źródło dochodu” | B trasy | zostaje |
| tech-cards-top5.json:567, 569, 588, 589 | Port: trasa handlowa, nazwa budynku | B trasy / nazwa | zostaje |
| tech-cards-top5.json:624 | „Otwiera Matematykę, Kodeks, Handel, Filozofię” | nazwa technologii Handel | zostaje (klucz/nazwa techu, poza zakresem) |
| tech-cards-top5.json:787 | klucz `"Handel": {` | identyfikator/klucz danych | zostaje (ZAKAZ zmian kluczy) |
| tech-cards-top5.json:796, 798, 826 | Emporion: trasa handlowa | B trasy | zostaje |
| tech-cards-top5.json:1052, 1054 | „Port wielki: +10 podatku i +1 trasa handlowa” | podatek już poprawny; trasa B | zostaje |
| tech-cards-top5.json:1073 | nazwa budynku Port handlowy | nazwa budynku | zostaje |

Wynik: 0 trafień w kartach, w których „handel/handlu” oznacza podatek. Pozostałe trafienia w gra/data/*.json (buildings.json, econ-params.json, diplomacy.json, tech.json, resources.json, society-params.json itd.) są opisami historii, trasami, dyplomacją, nazwami budynków/technologii lub identyfikatorami i zostają wg zakresu „ZAKAZY” dispatchu.

TABELA (c) — wystąpienia „Mnożnik handlu/waluty” / „Mnożnik handlu” / `meta_mnoznik_waluta` (surowy grep na 73ce56f83):
| plik:linia | treść | decyzja |
|---|---|---|
| docs/encyklopedia/cywilizacje/{grecy:50, egipt:50, sumer:50, rzymianie:50, germanie:50, celtowie:50, zulusi:50, inkowie:50, chinczycy:50}.md | „Mnożnik handlu/waluty: **X** (meta macierzy).” (9 plików) | NIE ZMIENIONO (DECISION_REQUIRED) |
| src/data/wikiBundle.json (1 trafienie) | „Mnożnik handlu” | NIE ZMIENIONO; bundle niezmieniany, brak regeneracji |
| docs/PORADNIK-GRACZA-SPIS-TRESCI.md:2352 | „Mnożnik handlu — więcej złota z suwaka Daniny” | NIE ZMIENIONO, poza zakresem (zgłoszone) |
| gra/src/game/civ-matrix-semantic.ts:96 | opis `meta_mnoznik_waluta` wskazuje turn-economy.ts:297, cityPanel.ts:1196 | NIE ZMIENIONO; rozbieżność z kodem (patrz niżej) |
| gra/src/game/economy.ts:717, 739, 745; culture-religion.ts:1235, 1246, 1266, 1287, 1312 | definicje `mnoznikHandelPieniadzForCiv`, `cityTradeMultiplier`, odczyt `meta_mnoznik_waluta` | kod bez zmian |
| gra/src/game/turn-economy.ts | 0 wystąpień `meta_mnoznik_waluta` | potwierdza brak wpięcia |
| gra/src/ui/cityPanel.ts | 0 wystąpień `meta_mnoznik_waluta` / `mnoznikHandel` | potwierdza brak wpięcia |
| gra/src/game/economy.ts:964-967 (wg raportu r1, NIE_ZMIERZONE ponownie w obronie) | `mennicaMnoznikPoWalucie` (1.5) mnoży handelNetto (podatek) | kod bez zmian |

Wniosek (c): wartość z wiki (`meta_mnoznik_waluta`) nie jest udowodniona jako wpięta w podatek w gra/src; mnożnik podatku realny to `mennicaMnoznikPoWalucie`. Zgodnie z dispatchem zostaje bez zmian. Gdyby właściciel zdecydował o zmianie na „Mnożnik waluty” (bez „handlu”), zmiana wymaga też testu pr141-matrix-only-data-wiki-test.cjs:66 (wymaga dokładnej frazy) i generatora gra/tools/gen-cyw-encyklopedia.py:148 — to decyzja właściciela (pytanie ABC), nie Operatora.

TESTY (własne, surowe wyjście, worktree wf_59835be2-f15-3 na 73ce56f83):
- `npm ci --ignore-scripts` w gra/: exit 0.
- `node_modules/.bin/tsc --noEmit` (TypeScript 5.9.3 z lokalnych node_modules): exit 0, brak wyjścia.
- UWAGA środowiskowa: `npx tsc --noEmit` BEZ lokalnych node_modules (przed npm ci) zwraca exit 2 z TS5101 („Option 'baseUrl' is deprecated…”) — to wynik globalnego npx, nie kodu; po npm ci lokalny tsc jest zielony.
- `node tools/terminology-trade-vs-tax-test.cjs`: `798 pass, 1 fail` — jedyny FAIL: `[G] gen-building-cards-top5.cjs --check zgodny z plikiem danych — building-cards-top5.json NIEZGODNY z generatorem` (surowe wyjście: `[terminology-trade-vs-tax-test] 798 pass, 1 fail`, exit 1).
- Bazowy [G] (af1235544): wynik 795 pass, 1 fail z raportu Evaluatora (4acec825e) — NIE_ZMIERZONE przeze mnie osobno; przyjmuję jako dług bazowy, nie regresję kandydata (795 + 3 nowe asercje = 798).
- Nie uruchamiano w tej rundzie (brak zmiany kodu i wikiBundle): ids-leak-audit, wonder-text-no-raw-ids, city-administrator 117, regeneracja wikiBundle, render w Chromium — NIE_ZMIERZONO w tej rundzie.
- `git diff --check af1235544 73ce56f83`: exit 0 (czysto).
- `npm run build` / `npm run dev`: NIE URUCHAMIANO (zakaz).

BLOKADY: brak technicznych. (1) Decyzja właściciela (ABC) w sprawie (c): „Mnożnik handlu/waluty” zostaje czy zmienić na „Mnożnik waluty” (wymaga zmian w testach i generatorze). (2) PORADNIK-GRACZA-SPIS-TRESCI.md:2352 — kandydat na osobną zmianę, decyzja orkiestratora. (3) [G] building-cards-top5 — dług bazowy do osobnego tematu. (4) Render panelu imperium NIE_ZMIERZONO — do decyzji orkiestratora/Final Control (patrz 2a).
RUNDY: obrona 1/5 (odpowiedź na ocenę r1 Evaluatora)
NASTĘPNY KROK: Final Control (Sonnet) na 73ce56f83 + ten commit raportu; orkiestrator: ABC (c), decyzja o renderze (2a), PORADNIK:2352 i dług [G].
DEPLOY/PUSH: NIE WYKONANO
