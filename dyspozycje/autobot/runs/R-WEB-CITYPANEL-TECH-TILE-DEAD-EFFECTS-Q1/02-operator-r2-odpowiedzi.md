# R-WEB-CITYPANEL-TECH-TILE-DEAD-EFFECTS-Q1 — Operator, runda 2 (obrona)

BAZA: commit c3b8604d7 (Operator r1, potomek fd8cc14a3). Ten dokument nie zmienia kodu.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITYPANEL-TECH-TILE-DEAD-EFFECTS-Q1
RUNDY: 2/5

## Odpowiedzi na zarzuty

1. Brak weryfikacji w Chromium: PRZYJMUJĘ (częściowo, dowód niedostępny).
   Instalacja Playwright (`npx playwright install chromium`) została odrzucona przez klasyfikator
   uprawnień i nie próbowałem obejść tej blokady. W systemie nie ma binarki chromium/chrome.
   NIE_ZMIERZONO: zrzut DOM karty miasta, także dla Medycyny i Obróbki żelaza.
   Pokrycie: testy w Node na bundlu `techDeadEffects.ts` (17/17) oraz skan 89 wierszy tekstowych.
   Zalecenie: zrzut DOM przy Final Control, jeśli orkiestrator dostarczy przeglądarkę.

2. Wynik niezgodny z założeniem (5 wierszy / 3 karty): ODRZUCAM zmianę listy, PRZYJMUJĘ opis.
   Dane: martwy jest tylko Teatr (`suppressed: true` w buildings.json, `ukryte` w tech-cards-top5.json).
   Katapulta: buildings.json:1637-1639 ma `odblokowuje: maWarsztatOblezniczy`, a cities.ts:844-853
   mówi, że odblokowanie Katapulty sprawdza budynek bezpośrednio (CITY_BUILDING_PREREQ,
   building-resource-gate.ts:111). Katapulta nie jest więc efektem martwym.
   „elitarnych” (Sztuka wojenna, Uwagi): realna bramka jednostek elit, nie efekt martwy.
   Pozostałe dwa trafienia w `_martweFrazy` (warsztat_oblezniczy, akademia_wojskowa) to rozjazd
   między wpisem korekt budynku a silnikiem. Usunięcie tego wpisu leży poza allowlistą.
   DECYZJA DANYCH do orkiestratora (ABC, nie rozstrzygam sam): czy `_martweFrazy` dla Warsztatu
   oblężniczego i Akademii wojskowej ma zostać skorygowany.

3. Filtr zostawia zdania o ukrytych budynkach: PRZYJMUJĘ jako notatkę, ODRZUCAM poprawkę.
   Dane Filozofii: „Akademia = NOWY budynek (nauka++); Teatr = NOWY budynek (kultura++, zadowolenie++);
   oba dla EKONOMIA”. Po filtrze zostaje „Akademia = NOWY budynek (nauka++); oba dla EKONOMIA”.
   Słowo „oba” jest mylące, bo wskazuje jeden budynek. Usunięcie go wymagałoby reguły na tekst
   źródła (poza zakresem „ukryj efekty martwe”) albo zmiany danych w tech.json. Zostaje jako
   defekt kosmetyczny do osobnego tematu danych. Test go nie wykrywa, co przyjmuję.
   Medycyna: po filtrze „Lazaret = …” znika, zostaje „Łaźnia publiczna = …; oba dla EKONOMIA; styk z UNITS (regeneracja)”.
   Ta sama kosmetyka „oba”.

4. Zakres zmian wykracza poza dispatch: ODRZUCAM.
   Dispatch dopuszcza `gra/src/ui/**` i wspólny moduł filtra. `technologyAdapter.ts` i
   `techDiscoveryNotice.ts` to ten sam refaktor, którego wymaga „jeden wspólny filtr, bez duplikowania
   listy” (test [A] to sprawdza). Re-eksport `isDeadTechCardBuilding` zachowuje dotychczasowych importerów.
   Zachowanie karty odkrycia nie zmienia się. Potwierdzenie: `tech-cards-top5-test` 594/0.

5. Brak logic-test w raporcie: PRZYJMUJĘ, uzupełnione (zob. TESTY).

6. Osłabienie testu ZNANY_STAN: ODRZUCAM.
   ZNANY_STAN_HOST zmniejszono z 5 do 3 wpisów, tylko o Teatr, który jest faktycznie ukryty.
   Asercje [A]–[G] zostały. Trzy pozostałe wpisy pilnują, by Katapulta i „elitarnych” nie zniknęły (regresja).

## Zweryfikowane w tej rundzie (worktree na c3b8604d7, `npm ci --ignore-scripts` w gra/)

- `npx tsc --noEmit`: exit 0.
- `node tools/logic-test.cjs`: LOGIC OK (213/213).
- `node tools/citypanel-tech-tile-dead-effects-test.cjs`: 17 pass, 0 fail.
- `node tools/building-cards-top5-test.cjs`: 1179 pass, 0 fail.
- `node tools/tech-cards-top5-test.cjs`: 594 pass, 0 fail.
- `node tools/civpedia-technologie-rys-historyczny-test.cjs`: 324 pass, 0 fail.
- `node tools/tech-discovery-card-click-test.cjs`: 13 PASS, 0 FAIL.
- Chromium / zrzut DOM: NIE_ZMIERZONO (zob. zarzut 1).

## Otwarte (do orkiestratora)

- ABC: `_martweFrazy` dla warsztat_oblezniczy i akademia_wojskowa (zarzut 2).
- Dane: „oba dla EKONOMIA” po filtrze (zarzut 3), osobny temat.
- Weryfikacja DOM w Chromium przy Final Control.

BLOKADY: brak przeglądarki (odrzucona instalacja Playwright), zob. zarzut 1.

ZMIANY/COMMIT: brak zmian kodu w tej rundzie; ten dokument jest jedyną zmianą (commit poniżej).

NASTĘPNY KROK: Evaluator (Sonnet) i Final Control; ABC do orkiestratora o `_martweFrazy`.

DEPLOY/PUSH: NIE WYKONANO
