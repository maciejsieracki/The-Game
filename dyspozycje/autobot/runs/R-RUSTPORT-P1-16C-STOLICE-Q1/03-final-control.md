STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16C-STOLICE-Q1
GOAL: Status z dowodem na pinie edb8fb56 dla 5 pozycji z `AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md`
§9.4, bez nowego pytania ABC (decyzja MAP-UX-CLUSTER-LABEL już zdeployowana FALA 296).

RUNDY: 1/5 (Operator → Evaluator 6 zarzutów, m.in. dowód nie pokrywał lokalizacji z audytu [luzowanie
MP w `packCityStatesHubChain` vs faktyczne miejsce `repackClusterStateCitiesIfSparse`], status spoza
dozwolonego zbioru dla pozycji 5, błędne zakresy linii → Obrona 6×PRZYJMUJE, dowody poprawione
[`clusters.ts:2084/2894/3399`, `display-names.ts:171-195/247`] → Final Control 6×ODDAL, zweryfikowane
niezależnie przez `git show` na edb8fb56).

ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md`, §13 (+32 insertions, §1-§12
nienaruszone).

WYNIK:
1. Luzowanie MP: NADAL ISTNIEJE (tylko w `repackClusterStateCitiesIfSparse`, floor=3 warunkowe,
   minDist≤5; hub-chain NIE luzuje, wbrew pierwotnej lokalizacji audytu).
2. Menu MP Standard: (a) audytowe 4/5/7 NIEAKTUALNE wobec faktu (pin ma 5/6/7, `miasta_panstwa=6`),
   (b) wymóg min 5 MP NADAL ISTNIEJE.
3. Test `capital-sep-unit-test.cjs` 36 PASS: NIEROZSTRZYGNIĘTY (nie uruchomiony — zakaz w temacie;
   przegląd statyczny: 121 linii, 29 asercji, 0 trafień literalnego „36").
4. Chip „· miasto-państwo": NADAL ISTNIEJE częściowo (stolica obca bez dopisku, tylko nazwa miasta).
5. Zgodność z B+C FALA 296: NADAL ISTNIEJE rozbieżność — pin realizuje PÓŹNIEJSZĄ decyzję
   `R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1` (2026-09-04, `foreignCapitalMapName`,
   `display-names.ts:184-189/247`), nie literalnie B+C. To zmiana decyzji w czasie, nie błąd kodu.

ZNALEZISKO DLA ORKIESTRATORA (bez pytania ABC — czysto porządkowe): decyzja
`R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1` (2026-09-04) nie ma wpisu w `PYTANIA-OTWARTE.md`, choć
jest zaimplementowana i działająca na pinie. Rejestr jest niekompletny, nie temat P1.

BLOKADY: brak.
NASTĘPNY KROK: integracja orkiestratora, potem dispatch `P1.16c-CIVPEDIA-OPISY` (czwarty, ostatni w
sekwencji).
DEPLOY/PUSH: NIE WYKONANO
