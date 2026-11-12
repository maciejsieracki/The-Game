# 30 — Obrona Operatora (Claude) — R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1 — runda 1/5

STATUS: PASS-WITH-NOTES (kod gry bez zmian; do integracji potrzebne DECISION_REQUIRED/ABC z zarzutu 4)
DOMAIN: GAME
TEMAT: R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1
GOAL: odpowiedzieć na 4 zarzuty Evaluatora (20-evaluator-claude.md, cc0c15378, PASS-WITH-NOTES) do kandydata
444d82e6a (baza 81e357dee) — PRZYJMUJĘ (poprawka + dowód + commit) albo ODRZUCAM (dowód).

Start: `444d82e6af768d0ce3d698fd33dee9ba6131044f`, gałąź robocza `obrona/copper-q1` w izolowanym worktree.
Dane pomiaru to te same biegi headless Chromium, które Operator zostawił w toku (`copper-income-audit-measure.cjs`,
build POST = kandydat 444d82e6a, mapa Standardowa/kontynenty, start w epoce 2). Kopie JSONL leżą w scratchpadzie
`cu/out/post-kontynenty-{4242,777,1234}.jsonl` i `pre-kontynenty-*.jsonl`. Liczby niżej pochodzą z surowego
wyjścia `copper-income-audit-summarize.cjs`, nowego `copper-income-audit-check.cjs` i sondy z zarzutu 3.

## Odpowiedzi na zarzuty

| # | Zarzut (skrót) | Werdykt | Commit |
|---|---|---|---|
| 1 | Pomiar POST tylko do t45–48, 6 cywilizacji | **PRZYJMUJĘ CZĘŚCIOWO**: zasięg POST wydłużony do t83–89, wszyscy właściciele z MP; 150 tur i 9 pozostałych cywilizacji nadal NIE_ZMIERZONO | ten (tylko raport) |
| 2 | Brak liczbowego pułapu na poziomie gry | **PRZYJMUJĘ**: nowa bramka `gra/tools/copper-income-audit-check.cjs` (P1 skok kopalń, P2 zapas/cap): PRE czerwone (62 naruszenia), POST zielone (0) | ten |
| 3 | Ten sam wzorzec dla kamieniołomu, glinianki, tartaku | **PRZYJMUJĘ jako potwierdzony fakt** (zmierzone 14/14 na wywołanie), **bez zmiany kodu** w tym temacie, bo to balans innych surowców → osobny temat + ABC | ten (tylko raport) |
| 4 | Dwie decyzje balansu ZAŁOŻENIEM bez ABC, dług REPIN | **PRZYJMUJĘ** — Obrona nie może tego rozstrzygnąć. Pakiet ABC poniżej, wymagany przed deployem | ten (tylko raport) |

### Zarzut 1 — zasięg pomiaru (PRZYJMUJĘ CZĘŚCIOWO)

Biegi POST trwały po commicie Operatora. Stan w chwili tej rundy (`status.json`: lastTurn 83 / 89 / 85):

| ziarno | tury POST | właściciele | max `ruda` (kto, tura) | max `braz` (kto, tura) | max skok Kopalń miedzi/turę |
|---|---|---|---|---|---|
| 4242 | 2–83 | 11 (6 głównych + MP) | 2 523 (grecy, t83) | 3 755 (inkowie, t83) | +4 (egipt t22, wchłonięcie MP) |
| 777 | 2–89 | 7 | 2 008 (chińczycy, t89) | 998 (egipt, t84) | +4 (egipt t58, 14→18) |
| 1234 | 2–85 | 8 | 3 870 (MP rzymianie, t85) | 13 391 (egipt, t85, epoka 3, cap 880 000) | +5 (grecy t60, 20→25) |

Dla porównania PRE w tym samym horyzoncie (do t80; `an.cjs`, wszyscy właściciele): max `ruda` 74 580 / 34 320 / 15 790,
max `braz` 54 089 / 9 709 / 79 243, max skok kopalń +58 / +37 / +24.

**Bilans ledgera POST** (`summarize.cjs`, cały bieg): dla każdej głównej cywilizacji `ruda` pochodzi wyłącznie z
`creditTerritory` (kopalnie), a `braz` z odlewni (`tickEmpireResourcePipeline`) oraz z szlaku, koszyka i łupów.
Reszta „NIEOPISANE” pojawia się tylko w turach 22–27 (wchłonięcie MP) i w t74 u Greków w ziarnie 777
(413 `braz`, 40 `ruda`; zmiana właściciela miasta). Brak źródła „z niczego”.

**Wzrost `braz` w ziarnie 1234** (wszystkie główne cywilizacje równo: t60 ≈ 3,1–3,7 tys., t70 ≈ 6,1–7,4 tys.,
t79 ≈ 9,7–10,9 tys.) to produkcja w epoce 3 (mnożnik odlewni). Na przykład Egipt wyprodukował w odlewniach 36 880
`braz`, a ma 10 904 (t79). Stan nie przekracza własnej produkcji. Szlak wyrównuje, a nie koncentruje (rozrzut
między cywilizacjami ≤ 1,13×).

**Uwaga:** państwa-miasta Rzymian (epoka 2, cap 100 000) dzięki wyrównaniu przez szlak trzymają `braz` na poziomie
głównych cywilizacji: MP 38/39 ma 10 011 / 9 828 w t79 i do 12 311 w t85, przyrost ok. 350–400 na turę. Masa jest
zachowana, a MP nigdy nie przegania dawcy (L1). Przy obecnym tempie MP przekroczy 20% swojego capu (pułap P2
z zarzutu 2) około t100–105. **NIE_ZMIERZONO** — biegi tam jeszcze nie doszły. To argument do ABC (zarzut 4, pyt. 3).

**Nadal otwarte:**
- **t90–150:** NIE_ZMIERZONO. Biegi trwają (PID 20527–20529, ok. 30–40 s/turę, czyli ok. 40 min do t150).
  Domknięcie: `node gra/tools/copper-income-audit-check.cjs <scratchpad>/cu/out/post-kontynenty-*.jsonl` po `*.DONE`.
- **Pozostałe 9 z 15 cywilizacji:** NIE_ZMIERZONO w grze, bo konfiguracja pomiaru ma 6 głównych.
  Dowód pośredni, że ścieżka jest niezależna od cywilizacji:
  - `civs.json`, `civ-params.json`, `civ-ai.json` i `wonders.json` nie mają premii `ruda`/`braz`/`kopalnia_miedzi`/odlewni.
    Grep pokazał 27 trafień `"braz"` w `civs.json`, wszystkie to klucze epoki (przywódca epoki / `epokaWejscia`).
  - Obie poprawki (L1 `computeTradeRouteResourceFlow`, L2 `capDeficitMinePicks`) nie czytają `civType`.
  - Cywilizacje z `epokaWejscia: "braz"` (5 z 15) pozostają NIE_ZMIERZONO.

### Zarzut 2 — pułap na poziomie pełnej gry (PRZYJMUJĘ)

**Poprawka:** `gra/tools/copper-income-audit-check.cjs` (nowe narzędzie pomiarowe, w allowliście „narzędzia
pomiarowe”). Czyta JSONL z pełnej gry i kończy się `exit 1` przy przekroczeniu jednego z pułapów:

- **P1:** skok liczby Kopalń miedzi u jednego właściciela w 1 turze ≤ 9 (`--max-mine-jump`).
- **P2:** zapas `ruda` i `braz` ≤ 20% capu magazynu właściciela (`--max-stock-share`).

**Progi z pomiaru, nie z głowy:**
- P1 = kryterium Operatora „skok ≥ 10” (§4.2). Leży między POST (max +5) a PRE (najmniejsze z maksimów +24).
- P2 to 20% capu, czyli poniżej zgłoszenia właściciela: 24 000 przy capie 100 000 w Brązie daje 24%.
- Oba progi są parametrami CLI z adnotacją ZAŁOŻENIE (ABC w zarzucie 4), a nie stałą gry.

**Dowód — surowe wyjście:**

```
== POST (kandydat 444d82e6a)
post-kontynenty-4242.jsonl: tury 2..83 — P1 max +4 (1:egipt, t22); P2 max 3.3% (39:rzymianie(MP) braz=3281/100000, t83); naruszenia: 0
post-kontynenty-777.jsonl:  tury 2..89 — P1 max +4 (15:egipt, t58); P2 max 2.0% (1:zulusi ruda=1980/100000, t35); naruszenia: 0
post-kontynenty-1234.jsonl: tury 2..85 — P1 max +5 (29:grecy, t60); P2 max 12.3% (39:rzymianie(MP) braz=12311/100000, t85); naruszenia: 0
copper-income-audit-check: PASS (naruszeń: 0)   exit=0

== PRE (baza 81e357dee)
pre-kontynenty-4242.jsonl: tury 2..91 — P1 max +58 (22:chinczycy, t42); P2 max 74.7% (39:rzymianie(MP) braz=74719/100000, t89); naruszenia: 27
pre-kontynenty-777.jsonl:  tury 2..98 — P1 max +37 (29:inkowie, t54); P2 max 14.4% (29:inkowie ruda=57630/400000, t98); naruszenia: 5
pre-kontynenty-1234.jsonl: tury 2..91 — P1 max +24 (22:inkowie, t67); P2 max 100.0% (37:rzymianie(MP) braz=100000/100000, t90); naruszenia: 30
copper-income-audit-check: FAIL (naruszeń: 62)  exit=1
```

Bramka odróżnia PRE od POST we wszystkich 3 ziarnach. W ziarnie 777 PRE łapie P1, bo P2 ma tam 14,4%
(cap epoki 3 = 400 000).

**Ograniczenie:** to bramka na wyniku pełnego biegu (Chromium, ok. 35 s/turę), więc nie nadaje się do szybkiego
CI. Szybkie testy jednostkowe pozostają bez zmian (re-run w tej rundzie: deficit-mine-cap 9/0,
trade-route-flow-no-concentration 10/0).

### Zarzut 3 — inne klucze deficytowe (PRZYJMUJĘ jako fakt, bez zmiany kodu)

Sonda w scratchpadzie `obrona/probe-deficit-keys.cjs` (bundle esbuild z prawdziwego `pickAutoImprovements` z
kandydata). Warunki: K2 gracz „zrównoważone”, `demandDriven: true`, 14 kwalifikujących się heksów, 13 wariantów
terenu × epoka 2/3. Surowe wyjście:

```
drewno -> tartak: max 14 w 1 wywołaniu (14 heksów) wariant {"terenBazowy":"rownina","nakladka":"las"} era2
kamien -> kamieniolom: max 14 w 1 wywołaniu (14 heksów) wariant {"terenBazowy":"wzgorza"} era2
glina -> glinianka: max 14 w 1 wywołaniu (14 heksów) wariant {"terenBazowy":"rownina","zloze":"glina"} era2
ruda -> kopalnia_miedzi: max 1 w 1 wywołaniu (14 heksów) ...
ruda_zelaza -> kopalnia_zelaza: max 1 w 1 wywołaniu (14 heksów) ...
ruda_cyny -> kopalnia_cyny: max 1 w 1 wywołaniu (14 heksów) ...
sol -> warzelnia_soli: max 0 w 1 wywołaniu (14 heksów) (żaden wariant nie kwalifikuje)
kon -> stadnina: max 0 w 1 wywołaniu (14 heksów) (żaden wariant nie kwalifikuje)
```

**Wniosek:** wzorzec „krok deficytowy stawia ulepszenie na wszystkich kwalifikujących się heksach naraz” **istnieje**
dla `tartak`, `kamieniolom` i `glinianka`. Potwierdzono to na poziomie funkcji.

**Nadal NIE_ZMIERZONO:**
- Wpływ w pełnej grze: JSONL pomiaru loguje tylko 3 typy kopalń.
- `warzelnia_soli` i `stadnina`: sonda nie trafiła w kwalifikujący teren.

**Dlaczego bez zmiany kodu w tym temacie:**
- Rozszerzenie `DEFICIT_CAPPED_MINE_KEYS` na drewno/kamień/glinę zmienia tempo produkcji surowców spoza zgłoszenia.
- To decyzja balansu (CLAUDE.md, zasada 3), a dispatch dotyczy miedzi.

Proponowany temat: **R-WEB-AUDIT-DEFICIT-IMPROVEMENT-BURST-OTHER-KEYS-Q1**. Zakres: pomiar w grze z rozszerzonym
logiem (`tartak`/`kamieniolom`/`glinianka`, zapas `drewno`/`kamien`/`glina`), potem ABC (pyt. 4 niżej).

### Zarzut 4 — decyzje balansu i dług REPIN (PRZYJMUJĘ)

Obrona nie rozstrzyga balansu. Status tematu do integracji: **DECISION_REQUIRED**. Pakiet ABC dla orkiestratora
(po polsku, z rekomendacją):

1. **Przepływ surowca na szlaku (L1)**, `trade-routes.ts` l. 2220–2221.
   - **A (rek., wdrożone):** wyrównanie, czyli najwyżej połowa różnicy zapasów. Bez nowej liczby. Dotyczy też gracza.
   - **B:** stały limit sztuk/szlak/turę.
   - **C:** brak przepływu surowców AI↔AI.
2. **Limit kopalń z niedoboru (L2)**, `auto-improvements.ts` `DEFICIT_MINE_PICKS_PER_KEY_PER_TURN = 1`.
   - **A (rek., wdrożone):** 1 kopalnia/typ/turę.
   - **B:** 1 na miasto/turę.
   - **C:** proporcjonalnie do liczby odlewni.
   - Po decyzji ewentualnie przenieść do `ai-params.json`. Dispatch zabrania tego bez ABC.
3. **Pułapy bramki z zarzutu 2.**
   - **A (rek.):** P1 = 9, P2 = 20% capu jako kryterium akceptacji pomiaru.
   - **B:** P2 jako kwota bezwzględna per epoka.
   - **C:** P2 liczone wobec capu dawcy szlaku, bo MP w niższej epoce mają mniejszy cap (patrz uwaga w zarzucie 1).
4. **Inne klucze deficytowe (zarzut 3).**
   - **A (rek.):** osobny temat pomiaru, potem decyzja.
   - **B:** od razu objąć limitem 1/typ/turę wszystkie klucze `IMPROVEMENT_FOR_DEFICIT`.
   - **C:** zostawić jak jest.

**Dług REPIN rust-port** (bez zmian względem Operatora):
- Picker auto-ulepszeń (`pick.json`) musi dostać limit L2.
- Port przepływu surowca na szlaku nie istnieje, więc L1 nie ma czego przepinać.
- Do rejestru długu przy integracji.

## ZMIANY/COMMIT

Allowlista dotrzymana. Brak zmian w `gra/src/**`, `WERSJE.md`, JSON balansu i `rust-port`.

- `gra/tools/copper-income-audit-check.cjs` (NOWY): bramka pułapu w pełnej grze (zarzut 2).
- `dyspozycje/autobot/runs/R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1/30-obrona-claude.md`: ten raport.
- Commit na gałęzi `obrona/copper-q1` nad 444d82e6a. Jawne `git add` dwóch ścieżek, bez `-A`. SHA w polu `sha`
  wyniku Workflow.
- Sondy `an.cjs` i `probe-deficit-keys.cjs` zostały poza repo, w scratchpadzie `obrona/`. To narzędzia jednorazowe,
  a ich wyjście jest zacytowane wyżej.

## TESTY

| Bramka / test | Wynik (surowe wyjście) |
|---|---|
| `copper-income-audit-check` POST ×3 ziarna | PASS, 0 naruszeń, exit 0 |
| `copper-income-audit-check` PRE ×3 ziarna (mutacja = baza) | FAIL, 62 naruszenia, exit 1 |
| `deficit-mine-cap-test` | 9 passed, 0 failed |
| `trade-route-flow-no-concentration-test` | 10 passed, 0 failed |
| `tsc --noEmit` | nie uruchamiano: zmiana to tylko plik `.cjs` poza zakresem `tsconfig`, a kod gry jest bez zmian względem kandydata, dla którego Operator i Evaluator mają exit 0 |
| 5 bramek (logic/tech-tree/research/unit-replace/combat) | nie uruchamiano ponownie z tego samego powodu; Evaluator odtworzył 213/213, 20/0, 33/33, 21/21, 6/6 na 444d82e6a |

Środowisko: `gra/node_modules` jako dowiązanie do `node_modules` worktree Operatora (wf_d0cf54a3-77f-1), bo na dysku
było 1,5 GB wolnego, więc bez `npm ci`. Dowiązanie jest ignorowane przez git i nie trafiło do commita.

## BLOKADY

1. **DECISION_REQUIRED:** ABC 1–4 z zarzutu 4 przed deployem.
2. Pomiar POST t90–150: NIE_ZMIERZONO (biegi w toku). Ryzyko: P2 może się zaczerwienić dla MP Rzymian w ziarnie
   1234 około t100–105 (wyrównanie przez szlak przy capie MP 100 000). Pytanie 3 w ABC.
3. 9 z 15 cywilizacji: NIE_ZMIERZONO w grze (dowód pośredni: brak premii w danych, kod niezależny od cywilizacji).
4. Tartak, kamieniołom i glinianka: wzorzec hurtowy potwierdzony funkcjonalnie, w grze NIE_ZMIERZONO. Osobny temat.
5. Dysk: 1,5 GB wolnego (97%). Nowe starty wstrzymać do sprzątania (CLAUDE.md, zasada 7).

## RUNDY

1/5 (Obrona po Evaluatorze rundy 1)

## NASTĘPNY KROK

1. Final Control (SONNET): weryfikacja bramki `copper-income-audit-check.cjs` (PRE czerwone / POST zielone) i
   odpowiedzi na zarzuty.
2. Orkiestrator: ABC 1–4 do właściciela. Po `*.DONE` biegów ponowne uruchomienie bramki na t150.
3. Rejestracja tematu z zarzutu 3 i długu REPIN.

## DEPLOY/PUSH

NIE WYKONANO
