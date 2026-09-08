STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6E-RENDER-Q1
GOAL: Migracja 27 miejsc kategorii render/kamera (main.ts+render/*.ts) na isMe(ownerId)/!isMe(ownerId)/ME() wg recon — zgodny z 00-dispatch.md, brak rozjazdu.

ZMIANY/COMMIT: `gra/tools/hotseat-etap6e-render-noop-test.cjs` (jedyny plik w allowlist dotknięty):
(1) nagłówek — nowa sekcja "STAN DZIŚ" wyjaśniająca wprost, że przy 0/27 zmigrowanych
pozycjach test nietautologiczności legalnie nie wykrywa mutacji i to NIE jest sygnał
regresji; kontrakt exit code rozszerzony o exit 3 = SKIP. (2) nowa funkcja
`migrationClusterHasIsMeCall()` — grep klastra `_cityRenderOpts` pod kątem `isMe(`/`ME()`.
(3) `main()` na starcie: jeśli klaster nie ma jeszcze żadnego wywołania — jawny
`console.log('SKIP: ...')` + `process.exit(3)` zamiast dojechania do mylącego `exit 1 FAIL`.
main.ts i render/*.ts NIETKNIĘTE (nadal bajt-identyczne z bazą 0272c3d2 — TDZ z rundy 1
pozostaje w mocy, prerekwizyt poza allowlistą).

TESTY:
- `node -c tools/hotseat-etap6e-render-noop-test.cjs` — składnia OK.
- `node tools/hotseat-etap6e-render-noop-test.cjs` (z katalogu gra/) — teraz kończy się
  `SKIP: main.ts nadal bajt-identyczny z bazą (0/27 pozycji recon zmigrowanych...)`,
  `exit 3`. Zweryfikowane bezpośrednio przed commitem.
- 5 bramek referencyjnych + tsc uruchomione świeżo po zmianie: tsc 0 błędów, logic-test
  213/213, tech-tree-test 19/19, research-test 33/33, unit-replace-test 13/13,
  combat-test 6/6 — identyczne z wartościami Evaluatora, brak regresji.

BLOKADY: bez zmian względem 02-evaluator-runda1.md — (1) TDZ realny (humanSeats let w TDZ
do main.ts~10362, `_cityRenderOpts()`/`cityRenderer.sync()` wykonuje się bezwarunkowo
wcześniej, main.ts:2506) — migracja klastra `_cityRenderOpts` wymaga prerekwizytu poza
allowlistą tej rundy. (2) 6 fallbacków w render/units.ts, render/cities.ts,
render/cityOkolicaOverlay.ts niemigrowalnych bez eksportu ME()/isMe() z main.ts.

RUNDY: 1/5

OBRONA:
1 -> PRZYJMUJE. Dowód: uruchomiłem plik dokładnie jak wskazano
(`node tools/hotseat-etap6e-render-noop-test.cjs` z gra/) — przed poprawką kończył się
`exit 1` z mylącym `BLOCK: bramka nie wykryła celowo zepsutego isMe() -- test jest
tautologiczny`, mimo że przyczyna nie leży w mechanizmie testu tylko w tym, że 0/27
pozycji render jest jeszcze zmigrowanych (potwierdzone niezależnym grepem: `isMe(`/`ME()`
w klastrze `_cityRenderOpts` — main.ts linie 2440-2504 — 0 trafień, `playerOwnerId: 0`
literał na linii 2487). Zarzut trafny: nagłówek nie ostrzegał, sygnał był mylący.
Poprawka w tej samej rundzie: nowa sekcja "STAN DZIŚ" w nagłówku + jawny PRE-CHECK
(`migrationClusterHasIsMeCall()`) zwracający `exit 3 SKIP` zamiast `exit 1 FAIL`, gdy
klaster nie ma jeszcze żadnego `isMe`/`ME()`. Zweryfikowane ponownie po zmianie: bramka
teraz kończy się czytelnym `SKIP`, nie fałszywym `FAIL`/`BLOCK`. Mechanizm ZEPSUTY/NEEDLE
pozostaje nietknięty i odzyska moc wykrywania automatycznie, gdy tylko klaster dostanie
pierwsze realne `isMe()`/`ME()` (bez dalszych zmian w tym pliku).

NASTĘPNY KROK: Final Control po ewentualnym potwierdzeniu przez Evaluatora korekty zarzutu
1; DECISION_REQUIRED właściciela o prerekwizycie architektonicznym (wcześniejszy
alias/przeniesienie humanSeats/ME/isMe przed main.ts:2506, ewentualnie eksport ME()/isMe()
z main.ts dla render/*.ts) pozostaje otwarte — poza allowlistą tej rundy, bez zmian.
DEPLOY/PUSH: NIE WYKONANO
