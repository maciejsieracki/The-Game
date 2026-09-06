STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-PRAWO-PRZEBUDOWA-SKALI-Q1
GOAL: Przebudować skalę Prawa (D1-D7 właściciela): tabela prawo_max_epoka per trudność,
prawo_max_pop_wspolczynnik=0,04 płasko, prawo_pct_cap=170, dwie kary usunięte na stałe, nowa
bramka, budynek Garnizon wpięty w kalibrację z własnym id linii rozpiski.

ZMIANY/COMMIT: gra/data/society-params.json (prawo_max_epoka [35,55,75]/[40,65,85]/
[45,75,100]; prawo_max_pop_wspolczynnik 0,04 ×3; prawo_pct_cap 170 ×3; usunięte
prawo_kara_brak_garnizonu, prawo_kara_podboj_bez_garnizonu; dodane
prawo_garnizon_budynek_epoka [25,35,47] ×3) · gra/src/game/society-breakdown.ts (fallbacki
dosunięte do JSON; nowy prawGarnizonBudynekForEra + pole SocietyScaleParams; LawBreakdownInput
+hasGarnizonBudynek, brakGarnizonuKara/conquestNoGarrisonPenalty @deprecated no-op;
computeLawBreakdown: usunięte dwie kary, dodana linia id='garnizon_budynek') ·
gra/src/game/conquest-stability.ts (conquestNoGarrisonLawPenalty → zawsze 0, @deprecated, ten
sam wzorzec co istniejące conquestUnstableHappinessPenalty; usunięty martwy helper pick/
RawParamRow) · gra/src/ui/cityPanel.ts (tor Prawa: brakGarnizonuKara usunięte, dodane
hasGarnizonBudynek: builtIds.includes('garnizon'), usunięty martwy playtestSandbox) ·
gra/tools/prawo-przebudowa-skali-test.cjs (NOWA, 134 asercji, 9 sekcji 3a-3i) ·
gra/tools/conquest-stability-test.cjs, society-breakdown-test.cjs,
szczescie-przebudowa-skali-test.cjs, szczescie-skala-normalizacja-test.cjs (asercje
PRZEPISANE na nowy kontrakt, liczba asercji nie spadła — patrz TESTY). Brak commitu w tym
raporcie (Operator nie integruje) — pliki gotowe do commitu przez orkiestratora/kolejny etap.

TESTY:
- tsc --noEmit: 0 błędów.
- 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33, unit-replace
  13/13, combat 6/6 — wszystkie zielone.
- Nowa bramka prawo-przebudowa-skali-test.cjs: 134 OK, 0 FAIL (3a-3i, patrz GOAL).
  Mutacyjnie zweryfikowana (Tryb piąty, próbka nie cała lista sekcji z uwagi na budżet czasu):
  mutacja prawo_max_epoka.normal[0]→999 czerwieni 4 asercje (3a/3b/3d), przywrócona z kopii,
  git diff --quiet czysty; mutacja id linii budynku 'garnizon_budynek'→'garnizon' (kolizja
  pułapki nazewniczej) czerwieni 22 asercje (3e/3i), przywrócona, tsc i sama bramka znów
  zielone.
- Cała rodzina Prawo/Porządek (grep prawo/porzadek/order/society/law/garnizon/conquest
  po gra/tools/), stan PO zmianie: prawo-siatka-v2-test 55/0, society-breakdown-test 53/0
  (2 asercje przeliczone: prawMax 50→40, PrawPct 40%→50% dla pop2/era1/normal — netto bez
  zmian, mianownik inny), conquest-stability-test 28/1 (1 FAIL PRE-ISTNIEJĄCY, spoza tematu —
  szczescie_kara_podboj_podwojna_obca; 1 asercja Prawa przepisana na "zawsze 0"),
  post-capture-law-test 25/0, porzadek-panel-czytelnosc-test 81/0, law-garrison-test 3/0,
  prawo-palac-tier-test 30/0, szczescie-przebudowa-skali-test 515/4 (4 FAIL PRE-ISTNIEJĄCE,
  spoza tematu — licznik budynków 41→42 po integracji budynku Garnizon; naprawiona 1 realna
  regresja własna: brak hasGarnizonBudynek w referencji Sz spowodował rozjazd porPct panel/
  silnik — dodane), szczescie-skala-normalizacja-test 148/0 (47 asercji przeliczonych: cap
  100→170, prawMax tabela per trudność, współczynnik spłaszczony — WSZYSTKIE PRZYCZYNY to
  D3/D3a/D3b/D4/D7 tego tematu, potwierdzone porównaniem z bazą przez git stash).
  administracja-stolica-test 52/1 i budynek-garnizon-test 80/1: FAIL PRE-ISTNIEJĄCE
  (potwierdzone git stash), niezwiązane z Prawem.
- Parytet panel↔silnik (3i): cityPanel.ts zbudowany i URUCHOMIONY (esbuild+jsdom), 5
  scenariuszy, linie Prawa (id+wartość) i prawPct identyczne panel==silnik we wszystkich.
  porPct celowo NIE porównywany (zależy też od Szczęścia, poza zakresem tematu, referencja Sz
  uproszczona).
- D7 pomiar (3h): PorPct ma WŁASNY cap 120 (order.ts, z szczescie_pct_cap) niezależny od
  prawo_pct_cap — podniesienie do 170 NIE przepuszcza PorPct >120% (computePorPct(200,200)=120
  zmierzone).

BLOKADY: brak. Dwa zapisane fakty bez wpływu na kryteria (pełny opis: decision-abc.md):
(1) main.ts (poza allowlistą) nadal przekazuje martwe pola brakGarnizonuKara/
conquestNoGarrisonPenalty — rozwiązane wzorcem @deprecated-zawsze-0, identycznym z
istniejącym precedensem w tym samym pliku (conquestUnstableHappinessPenalty); (2) tabela "P"
właściciela w dispatchu zakłada tę samą sumę budynków na każdej trudności — realne dane
(sprzed tego tematu) różnicują je per trudność, więc P realne dla easy/hard różni się od
tabeli dispatchu (normal zgadza się co do 0,02). prawo_max_epoka samo jest mimo to dokładnie
liczbą właściciela.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator.

DEPLOY/PUSH: NIE WYKONANO
