# R-WEB-DATA-GARNCARNIA-THROUGHPUT-30-PLUS-20-PER-ERA-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane + mała zmiana kodu)
TEMAT: R-WEB-DATA-GARNCARNIA-THROUGHPUT-30-PLUS-20-PER-ERA-Q1
GOAL: Przepustowość Garncarni (cykle glina+drewno → ceramika na turę) = 30 / 50 / 70 / 90 / 110 dla epok właściciela 1–5 (liniowo +20 na epokę), ta sama wartość dla gracza i AI, flat na trudnościach. Zastępuje 50 cykli +10% bazy/epokę (50/55/60/65/70).
BAZA: f1886bacf6476f85c5619e81a6e978d8cce0c5e7 (origin/main), detached HEAD w worktree.

## ZMIANY / COMMIT

Commit z kodem i raportem: SHA w polu `sha` odpowiedzi Operatora (commit na gałęzi detached tego worktree, bez push).

Allowlista (zmiany):
- `gra/data/econ-params.json` — `budynek_garncarnia_przepustowosc` 50 → 30 (easy/normal/hard); nowe wiersze `budynek_garncarnia_epoka2_przepustowosc` 50, `..._epoka3_` 70, `..._epoka4_` 90, `..._epoka5_` 110 (easy/normal/hard). Opisy zaktualizowane.
- `gra/src/game/converters.ts` — recepta `garncarnia`: `throughputFallback` 30, `throughputEraParamKeys` {1..5} (wiersze per era, ten sam mechanizm co Cegielnia/brąz). Usunięte `CONVERTER_ERA_SCALING_RECIPE_IDS` i `CONVERTER_ERA_SCALING_PCT` (addytywne +10%), `converterThroughputForEra` nie skaluje już Garncarni. Komentarze tabeli i funkcji zaktualizowane.
- Testy (`gra/tools/*`): `converters-test.cjs`, `brick-production-x2-test.cjs`, `brick-cycles-75-100-test.cjs`, `foundry-throughput-x2-era-mult-test.cjs`, `converter-era-scaling-test.cjs` (sekcje A/B/C2/C5/E), `citypanel-konwerter-produkcja-test.cjs` (era 1–5 = 30/50/70/90/110), `hud-konwerter-dopasowanie-test.cjs` (ceramika 30), `resource-building-utilization-test.cjs` (GARN_MAX 30, pule 45/15), `resource-amount-chip-icons-real-render-test.cjs` (fixture 30).
- NOWE testy: `gra/tools/garncarnia-throughput-30-plus-20-test.cjs` (28 asercji), `gra/tools/garncarnia-throughput-chromium-render-test.cjs` (13 asercji, Chromium).

Poza allowlistą (uzasadnione, konieczne):
- `gra/data/building-cards-top5.json` — karta Garncarni „do 50 sztuk na turę” → „30 / 50 / 70 / 90 / 110 (wg epoki)”. Bez tego karta kłamałaby. Spichlerz w tym tekście NIE zmieniony (25 jak w bazie).

Nie zmienione (świadomie):
- `docs/encyklopedia/**`, `docs/PORADNIK-GRACZA/**` — grep po „Garncarn”+cykle/przepust/epok/10%/50 nie znalazł w dokumentacji liczby przepustowości Garncarni; nic do poprawy.
- `gra/src/data/wikiBundle.json` — regeneracja (`tools/bundle-wiki-for-game.cjs`) dała zmianę niezwiązaną z tematem (przestarzały bundle), więc plik przywrócony do stanu z bazy. Bundle nie zależy od `building-cards-top5.json`.
- `gra/src/main.ts`, `gra/src/game/turn-economy.ts` — tylko komentarze o „+10%”; nie są konieczne, przywrócone do bazy (poza allowlistą).
- `WERSJE.md`, manifest, `rust-port` — nie tknięte.

## TESTY

Środowisko: `npm ci` w `gra/` (71 pakietów), Node v22.22.0, Chromium `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (Playwright). Żadnego `npm run build`/`dev`.

Bramki referencyjne (§6 R-PROC-AUTOBOT), na zmienionym drzewie:
- `npx tsc --noEmit` — exit 0, 0 błędów wyjścia.
- `node tools/logic-test.cjs` — exit 0 (ostatni numer przypadku [213]; brak jawnego podsumowania w wyjściu).
- `node tools/tech-tree-test.cjs` — 20 pass, 0 fail.
- `node tools/research-test.cjs` — 33/33.
- `node tools/unit-replace-test.cjs` — exit 0, 21 linii [OK], 0 FAIL.
- `node tools/combat-test.cjs` — exit 0 („All sanity checks passed”).
- `node tools/unit-power-test.cjs` — 6 pass, 0 fail.
- NIE_ZMIERZONO: `map-gen-regression-test`, `mgla-sciezka-inwariant-test`, `ai-buduje-budynki-test`, `map-field-battle-test`, `entity-card-contract-test` (poza zakresem tematu; nie uruchamiane w tej rundzie).

Testy tematu (wynik z surowego wyjścia):
- `garncarnia-throughput-30-plus-20-test.cjs`: 28 passed, 0 failed (era 1–5 = 30/50/70/90/110 dla easy/normal/hard; era 0/-3/NaN = 30; `converterThroughputForEra` nie skaluje Garncarni; era 3, 200 gliny + 200 drewna → produkcja 70, zużycie 70 gliny + 70 drewna, magazyn 130/130/+70; parytet gracz vs AI).
- `garncarnia-throughput-chromium-render-test.cjs` (Chromium, prawdziwe `formatConverterProductionRowHtml` z cityPanel.ts + `converterProductionDisplayForBuilding`): 13 passed, 0 failed. Epoka 1 → „Prod.: −30 Glina/t · −30 Drewno/t · +30 Ceramika/t”, epoka 3 → 70, epoka 5 → 110; ikony SVG; brak przepełnienia przy 520 px; brak błędów strony. Zrzut: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/shots/garncarnia-era-rows.png` (ścieżka w scratchpadzie sesji).
- `converter-era-scaling-test.cjs`: 115 passed, 0 failed.
- `converters-test.cjs`: exit 0. `brick-production-x2-test.cjs`: exit 0. `brick-cycles-75-100-test.cjs`: exit 0. `foundry-throughput-x2-era-mult-test.cjs`: exit 0. `hud-konwerter-dopasowanie-test.cjs`: exit 0. `building-upkeep-ceramics-test.cjs`: exit 0. `resource-building-toggle-test.cjs`: exit 0. `resource-building-utilization-test.cjs`: exit 0 (po aktualizacji oczekiwań). `resource-amount-chip-icons-real-render-test.cjs`: exit 0. `civpedia-caly-wiersz-przyciskiem-test.cjs`: exit 0. `hud-topbar-grid-gross-net-test.cjs`: exit 0. `map-snapshot-load-test.cjs`: 58 pass, 0 fail (94 s).

Porównanie z bazą (ta sama lista testów uruchomiona na czystym `git archive` bazy):
- Ta sama wartość exit przed i po, poza testami zaktualizowanymi pod nowe liczby (zob. wyżej) oraz nowymi testami.
- `citypanel-konwerter-produkcja-test.cjs` exit 1 PRZED i PO (pre-existing: „N2: flaga nieaktywności wiersza produkcji czyta TĘ SAMĄ zmienną”), 1 FAIL bez zmiany.
- `mennica-magazyn-test.cjs` exit 1 PRZED i PO, te same 7 FAIL (pre-existing: mnożnik waluty, cityYieldPerTurn, odlewnia bez rudy).
- Testy z przypadkowym różnym wynikiem w bazie (`tech-cards-top5-test`, `pr141-f04-society-activation-test`) padały w kopii bazy z powodu brakującego pliku generowanego w `git archive`, nie przez kod; w worktree przechodzą.
- Przy 116+70 testach powiązanych słowami kluczowymi uruchomiono wszystkie niedotknięte stałe testy poza: `live`, `real-render`, `measure`, `bundle`, `generate` (nie uruchamiane w tej rundzie → NIE_ZMIERZONO).

## BLOKADY

1. Kryterium (a) z dispatchu: `converterThroughputForEra('garncarnia', …, era)` nie może zwracać 30/50/70/90/110 — funkcja zostawia bazę, a wartości per era idą przez wiersze econ-params (`converterThroughputEraParamKey`), czytane przez wszystkie wywołujące (turn-economy, main.ts, cityPanel). Świadome odstępstwo: wzór „+20 z kroku” wymagałby przekazywania kroku przez 3 wywołujące i/lub zahardkodowania stałej w TS; wiersze per era dają to samo w econ-params, bez zahardkodowania. Dowód na poziomie danych: test 28/28 i Chromium 13/13.
2. Epoki > 5: `converterThroughputEraParamKey` niesie wiersz epoki 5 (110) dalej. Zakładam, że gra ma 5 epok (dispatch: „epoki 4–5”); NIE_ZMIERZONO w `tech.json` (próba odczytu wieku nie dała wyniku; nie drążyłem).
3. Spichlerz w bazie zużywa 25 ceramiki (I i II, econ-params), NIE 10/20 jak w przykładzie właściciela. Wartości 10/20 są w temacie #402 (inne, w toku) — NIE wdrażane tutaj.
4. Konflikt z #402 (w toku w innym workflow): jego opis zawiera „Garncarnia 30/50/70/90/110 na turę”. Ryzyko dublowania/konfliktu na tych samych plikach (`econ-params.json`, `converters.ts`) — orchestrator musi to rozstrzygnąć przy integracji.
5. Krok po epokach 4–5 i ceramika obywateli — patrz tabela poniżej (założenia).

## BILANS CERAMIKI (1 miasto, 1 Garncarnia, Spichlerz I i II)

Źródła: produkcja Garncarni — ZMIERZONO (test/Chromium). Spichlerz I/II = 25/t w bazie — ZMIERZONO (econ-params `budynek_spichlerz_zuzywa_ceramika`, `budynek_spichlerz_ii_zuzywa_ceramika`). Obywatele zużywający ceramikę — w kodzie bazowym NIE istnieje (grep: brak klucza w econ-params; racja obywateli to żywność × m(e)) → w tabeli A zero.

A. Stan kodu po zmianie (ZMIERZONO):

| Epoka | Garncarnia (cykle/t) | Spichlerz I+II (25+25) | Bilans | Tylko Spichlerz I (25) |
|---|---|---|---|---|
| 1 | 30 | 50 | −20 | +5 |
| 2 | 50 | 50 | 0 | +25 |
| 3 | 70 | 50 | +20 | +45 |
| 4 | 90 | 50 | +40 | +65 |
| 5 | 110 | 50 | +60 | +85 |

B. Przykład właściciela (NIE w kodzie bazowym; liczby z dispatchu: Spichlerz I 10, II 20; obywatele 20 × 1,5/2/2,5/3 od epoki 2; era 1 — założenie 1,0). Policzone analitycznie, wynik zależy od tych założeń:

| Epoka | Garncarnia | Spichlerz I+II (10+20) | Obywatele 20 × m | Popyt | Bilans |
|---|---|---|---|---|---|
| 1 | 30 | 30 | 20 (założenie) | 50 | −20 |
| 2 | 50 | 30 | 30 | 60 | −10 |
| 3 | 70 | 30 | 40 | 70 | 0 |
| 4 | 90 | 30 | 50 | 80 | +10 |
| 5 | 110 | 30 | 60 | 90 | +20 |

Uwaga: w dispatchu bilans epoki 3 podany jako +10 („40 + Spichlerz 20 = 60”). Przy Spichlerzu I 10 + II 20 (=30) wychodzi 0; +10 wynika tylko przy łącznej drenie 20. Do rozstrzygnięcia przez właściciela razem z #402.

## NASTĘPNY KROK

Orchestrator: (a) decyzja, czy #402 (Garncarnia 30/50/70/90/110 w toku) ma być scalony z tym tematem zamiast równolegle; (b) decyzja właściciela co do ceramiki obywateli (#404) i wartości Spichlerza (#402) przed bilansem; (c) integracja po Evaluator/Final Control (ten temat nie integruje ani nie pushuje).
Dług Rust: REPIN parametrów Garncarni (econ-params, nowe wiersze epoka2–5) — do zapisania w rejestrze REPIN.

## UWAGI-DLA-ORKIESTRATORA

- Kopia bazy do porównań: `scratchpad/base/gra` (git archive f1886bac, symlink node_modules) — można usunąć po integracji.
- `gra/node_modules` zainstalowane przez `npm ci` w worktree tego Operatora — do sprzątania po integracji tematu.
- Task-list reminder w narzędziach pokazywał stale pozycje #402/#404 jako in_progress — nie zmieniałem żadnego wpisu tasków.

DEPLOY/PUSH: NIE WYKONANO
RUNDY: 1/5
