# R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1 — raport Evaluatora (runda 1/5)

STATUS: ZARZUTY (3) — werdykt wydaje Final Control po Obronie (§3c)
DOMAIN: GAME
TEMAT: R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1
MODEL+EFFORT: Sonnet 5, effort high
GOAL: łączne straty zwycięzcy auto-bitwy mapy mają maleć monotonicznie ze wzrostem
stosunku sił. (Zgodny z `00-dispatch.md` — §16a pkt 9 bez zastrzeżeń.)

## SPRAWDZONE SAMODZIELNIE (nie z raportu)

Bramki uruchomione u mnie, `f72744d3`, worktree czysty przed i po:
`auto-battle-przewaga-monotonicznosc-test` 37/0 exit 0 (ciąg 0,3873 / 0,3656 /
0,3372 / 0,3045 / 0,2650 / 0,2300 — odtworzony moim własnym rachunkiem
`0,42/r^1,2`, zgodny z tabelą GOAL w ±0,005); `tsc --noEmit` exit 0;
`auto-battle-power-test` 14/0; `logic-test` 213/213; `tech-tree-test` 19/19;
`research-test` 33/33; `unit-replace-test` 13/13; `combat-test` 6/6;
`battle-summary-test` OK. Dodatkowo sąsiedztwo nienazwane w dispatchu:
`weterani-test` 79/0, `post-battle-map-test` 32/0, `barb-city-behavior-test` 178/0.
`map-field-battle-test` exit 1 (`import_meta.glob`, moduł audio) — sprawdziłem
na plikach z bazy `287718c2`: **czerwona identycznie**, defekt INFRA sprzed tematu.

Mutacje źródła (dowód nietautologiczności, §16a pkt 8):
- A — `L_MIN` z powrotem na jednostce, `p=1,2`: **31/6, exit 1** (r=10 → 0,500,
  r=20 → 1,000). Pułapka (C) faktycznie wykrywana.
- B — `p` z powrotem na `0,58`, poprawka `L_MIN` zostawiona: **16/21, exit 1**.
- C — podłoga usunięta całkowicie (`winnerLossFloorPct` → `0`): **37/0, exit 0**.

Allowlista (§16a pkt 1): commit dotyka dokładnie 5 plików, wszystkie z listy;
`combat.ts`, `battleScene.ts`, `main.ts`, `WERSJE.md`, `playbook.json`, `docs/decyzje`
nietknięte. §9: brak `npm run build`/`dev`, brak sekretów, brak usunięć spoza GOAL,
brak upstreamu i brak gałęzi na `origin` — nie pushowano. §2b: żaden z pozostałych
6 worktree nie dotyka auto-bitwy. Save/load i parytet gracz/AI: parametry ładowane
z JSON, jedna ścieżka `resolveAutoBattleByPower` dla obu stron — bez zmian.

## ZARZUTY

**1. `gra/tools/auto-battle-przewaga-monotonicznosc-test.cjs:155-162`** — sekcja
„5. L_MIN nadal działa jako podłoga na SUMIE" jest tautologiczna. Mutacja C
(`gra/src/game/auto-battle-power.ts:100`, `return p.L_MIN / sizeUnits;` → `return 0;`)
zostawia bramkę na **37/0, exit 0**. Żadna asercja nie pokrywa nowej podłogi —
sonda przy `r=1000` daje sumę 0,1 z samego `raw`, nie z podłogi. Znaczenie:
kryterium końca nr 2 („`L_MIN` działa jako podłoga na SUMIE — udowodnione testem")
jest udowodnione tylko w części „stara podłoga usunięta", nie w części „nowa działa".

**2. `gra/src/game/auto-battle-power.ts:98-107`** — podłoga na sumie nigdy nie
gryzie w grywalnym zakresie i przestaje istnieć przy dużym `r`. Suma = `0,42/r^0,2`,
więc `raw` przekracza `L_MIN` aż do `r ≈ 41 821`. Gorzej: `winnerLossPct` zaokrągla
do 4 miejsc, a podłoga to `0,05/r`, więc od `r ≈ 1866` obie schodzą poniżej `0,00005`
i zaokrąglają się do zera. Zmierzone realnym solverem: `r=1866/2000/5000/10000`
→ `lossAtkPct = 0`, suma strat zwycięzcy **0,00000**. Przed zmianą podłoga
na jednostce gwarantowała ≥5 %. Znaczenie: gwarancja „zwycięstwo nigdy nie jest
darmowe" znika przy skrajnej przewadze — to skutek uboczny mechaniki podłogi,
nieobjęty wiążącymi rozstrzygnięciami właściciela (te dotyczyły `p=1,2` i braku
rozdziału wykładników na role). Poprawka kierunkowa: albo zwiększyć precyzję
zaokrąglenia w `winnerLossPct`, albo świadomie i jawnie uznać `L_MIN` za martwy
w tej mechanice — druga opcja jest decyzją balansową, nie techniczną.

**3. `gra/tools/auto-battle-power.py:133`** — `return round(max(L_MIN, min(cap, raw)), 4)`,
czyli stara podłoga NA JEDNOSTCE, przy `p` czytanym z `auto-battle-params.json`
(już 1,2). Symulator balansu repo odtwarza dziś dokładnie krzywą-pułapkę:
`r=10 → 0,500`, `r=20 → 1,000` (przeliczone), sprzeczną z runtime TS. Dwa źródła
prawdy dla jednego wzoru; recon orkiestratora liczony tym narzędziem będzie fałszywy.
Plik jest **poza allowlistą**, więc Operator nie mógł go tknąć — zarzutem jest brak
zgłoszenia tego w `01-operator.md`, nie brak edycji. Rozstrzygnięcie (rozszerzenie
allowlisty w tej rundzie vs osobny temat) należy do orkiestratora.

## POZA ZARZUTAMI (dla Final Control)

Kryterium końca nr 7 niespełnione w części `map-field-battle-test` — potwierdzam
diagnozę Operatora: defekt INFRA sprzed tematu, nie regres tej zmiany. Wymaga
osobnego tematu (§16b pkt 4), nie powrotu do Operatora.
Rozbieżności wobec tabeli dispatchu zgłoszone przez Operatora przeliczyłem —
`r=20` suma 0,2300 vs 0,231 i przegrany 97,35/98,85 % vs 97,3/98,8 % — wszystkie
w ±0,005, zgłoszone uczciwie, bramka trzyma liczby z dispatchu.
NIE zgłaszam jako defektu: `p=1,20` ani zaostrzenia kary przegranego przy 1,5:1
(74,2 %) — to wiążące rozstrzygnięcia właściciela.

RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (§3c pkt 2) → Final Control
DEPLOY/PUSH: NIE WYKONANO
