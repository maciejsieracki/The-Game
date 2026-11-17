# R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko pomiary i narzędzia; kod gry NIE zmieniany)
TEMAT: R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1
GOAL: (a) odsetek zmarnowanego ruchu strzelców po zderzeniu; (b) doktryny Obrona/Ostrzał i uciekinierzy po FALI 745/747; (c) anomalia determinizmu hashu (e20cd0b5…).
BAZA: 71ca0e588 (origin/main, FALA 750), checkout --detach.

## ZMIANY / COMMIT
- Nowe: `gra/tools/battle-full-move-gaps-measure.cjs` (tryby measure / doctrine / det; kod wyjścia 1 przy niespełnionym niezmienniku).
- Dane: `dyspozycje/autobot/runs/R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1/evidence/` (measure-measure.json, measure-doctrine.json [ziarna 2-5], measure-doctrine-seed1.json [ziarno 1], measure-det.json).
- Doklejona do sondy jest wyłącznie transformacja w pamięci narzędzia (wymuszenie doktryny przez `window.__ovDoc`); pliki `tools/battle-pursuit-pace-browser-entry.ts` i `battleScene.ts` NIE zmienione.
- Nie uruchamiano testów na żywo z zapisem `dowody/*.png` (brak nadpisań).

## TESTY
Warunek startu: w dispatchu wskazano #410 (zakończone; FALA 750 w bazie) i #426 (w trackerze oznaczone completed; na origin/main nie widziano merge FC dla R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1, ZAŁOŻENIE: zakończony). Praca dotyczy wyłącznie nowych plików, bez battleScene.ts.

(a) Strzelcy po zderzeniu (sonda battle-pursuit-pace, tryb pomin, Chromium, 3D):
| skład (atak vs obrona) | ziarna | zderzenie | aktywacje strzelców | pula MP | niewykorzystane MP | z tego fizycznie zablokowane | niewyjaśnione |
|---|---|---|---|---|---|---|---|
| C0: Hastati:8,Lucznik:6,Konnica:4 vs Hastati:14 | 1-5 | 5/5 | 964 | 2892 | 1337 (46,2%) | 960 | 377 |
| C1: Lucznik:10,Hastati:6 vs Hastati:10,Lucznik:4 | 1-5 | 0/5 | — | — | — | — | NIE ZMIERZONO: brak zderzenia wrecz w 5/5 ziarnach (bitwa kończy się ostrzałem bez kontaktu, 31-34 rundy) |
| C2: Lucznik:8,Konnica:6 vs Hastati:8,Konnica:4 | 1-5 | 5/5 | 443 | 1329 | 709 (53,3%) | 598 | 111 |
| SUMA | | 10 przebiegów | 1407 | 4221 | 2046 (48,5%) | 1558 | 488 (11,6% puli) |

Definicje (ZAŁOŻENIE, do decyzji ABC): "niewykorzystane MP" = moveLeft na końcu aktywacji. "Fizycznie zablokowane" = brak wolnego pola przyległego, brak ścieżki do ciosu, stoi w zasiegu wolnego wroga (canStrike), albo silnik oznaczył brak dalszego ciosu. Strzelec, który zostaje w zasięgu strzału, jest tu liczony jako zablokowany (świadomy wybór, nie strata). "Niewyjaśnione" (488 MP) to kandydat na zmarnowany ruch wg reguły; NIE jest potwierdzonym defektem, bo nie zrobiono przeglądu każdego przypadku. Listy przypadków: pole `unexplainedList` w measure-measure.json.
Obserwacja: po ciosie strzelcy wykonali ruch w 166 aktywacjach (reguła działa dla strzelców).

(b) Wyjątki (sonda z wymuszoną doktryną, ziarna 1-5, C0):
- Obrona (defensive) po stronie obrony: 397 aktywacji po zderzeniu, z czego 181 w doktrynie Obrona, reszta uciekinierzy; ruch po ciosie: 0.
- Ostrzał (skirmish) po stronie ataku: 2246 aktywacji, 1231 w doktrynie Ostrzał, reszta uciekinierzy; ruch po ciosie: 0.
- Uciekinierzy (routed): w przebiegach bez wymuszenia wszystkie 393 wyjątki to uciekinierzy, ruch po ciosie 0.
- Rozkaz ręczny gracza (manual) i mur oblężniczy: NIE ZMIERZONO. Sonda nie steruje rozkazami ręcznymi ani oblężeniem; wymaga osobnego drivera (pokrywa się z tematami #426/#431), więc nie dotykałem tych narzędzi.

(c) Determinizm: ziarno 1, skład C0, 20 powtórzeń: 20/20 ten sam skrót 14f9e9bb… Anomalia e20cd0b5… NIE ODTWORZONA w 20 próbach dla tej trójki. Dispatch nie podaje, która trójka dała anomalię, więc to nie jest pomiar tej trójki: NIE ODTWORZONO (N=20, inna trójka lub brak anomalii na ~aktualnym kodzie).

Bramki referencyjne (po npm ci w gra/):
- logic-test: 213/213 PASS (exit 0)
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/33 PASS
- unit-replace-test: exit 0 (wszystkie [OK])
- combat-test: 6/6 pass
- tsc --noEmit: exit 0
- git diff --check: czysto

## BLOKADY
- Manual orders i mur oblężniczy (b): NIE ZMIERZONO (brak drivera w sondzie).
- Skład C1 bez zderzenia: NIE ZMIERZONO dla (a).
- Anomalia e20cd0b5: NIE ODTWORZONO w 20 próbach, ale nieznana trójka.

## RUNDY
1/5 (ten raport). Ostatni werdykt: brak (pierwsza runda).

## UWAGI-DLA-ORKIESTRATORA
- Kandydaci R-WEB do przeglądu (NIE naprawiane): 488 MP "niewyjaśnionego" ruchu strzelców. Minimalna reprodukcja: ziarno 2, skład C0 (219 aktywacji, 67 niewyjaśnionych MP); lista przypadków w evidence/measure-measure.json (`runs[].unexplainedList`). Wymaga ręcznego przeglądu, czy są to przypadki legalne.
- Kandydat na pytanie ABC: skład C1 (Łucznik-przewaga) kończy się bez zderzenia w 5/5 ziarnach. Czy to zamierzone?
- Źródło anomalii e20cd0b5: dispatch nie podaje ziarna/składu; potrzebny identyfikator trójki z FC FULL-MOVE-RESIDUAL-INFANTRY-Q2.
- Zgodnie z zasadą: narzędzie wymusza doktrynę tylko w pamięci przeglądarki (transformacja Vite), bez zmian w repo sondy.

NASTĘPNY KROK: Evaluator (SONNET) weryfikuje narzędzie, liczby z evidence i klasyfikację "niewyjaśnione"; potem FC; decyzja ABC o progu odsetka (brak progu w tym narzędziu).
DEPLOY/PUSH: NIE WYKONANO
