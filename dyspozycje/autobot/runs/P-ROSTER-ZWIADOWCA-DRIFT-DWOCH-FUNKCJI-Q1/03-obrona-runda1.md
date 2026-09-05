# P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1 — Operator (obrona), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1
GOAL: skład bitwy niezależny od tego, którą funkcją go policzono.
MODEL+EFFORT: Opus 5, effort high · ROLA: Operator (obrona, II faza rundy 1) · RUNDA 1/5

## OBRONA 1 → PRZYJMUJĘ

Teza „żadna zmiana `gra/src` nie zazieleni obu naraz" (`01-operator-runda1.md:37`)
jest w brzmieniu uniwersalnym FAŁSZYWA. Odtworzyłem E5 sam, na fixturze rundy 1
(`4e44b0bd`): `battleRoster.ts:59` `return out;` → `return out.slice(0, 2);` daje
`map-field-battle-test` **20 ok/0 fail** (bez mutacji 19/1) i `battle-roster-test` 7/7.
Teza broni się wyłącznie w brzmieniu węższym: *żadna zmiana ZGODNA Z KONTRAKTEM
rosteru* („heks kotwicy + własne jednostki w promieniu 1 heksa", `main.ts:24282`,
`battleRoster.ts:3`) — E5 ten kontrakt łamie, cicho gubiąc jednostki.
**Ta dziura jest już dziś zamknięta**: ta sama mutacja na fixturze HEAD `83482d5c`
daje **21 ok/1 fail**, czerwieniejąc na `collectBattleRoster atk: pozostale trzy
jednostki bojowe ZOSTAJA w rosterze`. Asercja parytetu pod E5 zostaje zielona —
zgodnie z kryterium 4 dispatchu.

## OBRONA 2 → PRZYJMUJĘ

Recon był niepełny i sformułowanie „zero śladu zamierzonej różnicy" (`:44`) —
nieprawdziwe. `main.ts:24288-24293`: przy `playtestWalkaActive` `collectBattleRoster`
deleguje do `collectPlaytestBattleRoster` (`playtestWalkaMapy.ts:113-142`), które
nie ma żadnego filtra cywilnego. Pomiar runtime na jednym zestawie
(`u0` Hastati `(5,0)`, `u2` Łucznik `(4,0)`, zwiadowca `(5,1)`):
pure → `["u0","u2"]`, playtest → `["u0","u2","u-scout"]`. Ślad zamierzoności
jest jawny w komentarzu `main.ts:24289` („klik jednej jednostki zbiera cały klaster").
Zasięg: `playtestWalkaActive = true` ustawia wyłącznie
`doStartPlaytestWalkaMapy()` (`main.ts:33738-33740`) — normalnej gry nie dotyczy.
Znalezisko poboczne nr 4 do rejestru (rejestruje orkiestrator, nie ja).

## OBRONA 3 → ODRZUCAM

Fakt (19/1, brak asercji parytetu) jest prawdziwy, ale jako zarzut wobec pracy —
nietrafny. Dispatch sam przewiduje to wyjście: kryterium 2 („Jeśli po analizie
uznasz, że asercja jest błędna — to jest `DECISION_REQUIRED` z dowodem, nie
samodzielna zmiana testu") i §GRANICE. C-054: `DECISION_REQUIRED` to nie `BLOCK`
i nie zużywa rundy. Ratyfikacja `7a19f591` potwierdziła, że kryteria 1–3 rundy 1
były niespełnialne — zastąpiła je własnymi. Kryterium 3 jest dziś spełnione przez
rundę 2 (`83482d5c`).

## OBRONA 4 → ODRZUCAM

Warunek JEST podany, dosłownie, w tym samym zdaniu — `01-operator-runda1.md:46`:
„Parytet już zachodzi: **dla wspólnej kotwicy na heksie miasta** oba rostery
zwracają identyczny zbiór ID." `decision-abc.md` o parytecie nie mówi w ogóle.
Zmierzyłem oba układy: kotwica `(6,0)` = heks miasta → `["u0","u2"]` vs
`["u0","u2"]`, parytet TAK; kotwica `(5,0)` obok miasta → `["u0","u3"]` vs
`["u0","u2"]`, parytet NIE. Asercja parytetu z rundy 2 ustawia kotwicę na heksie
miasta — dokładnie na warunku z mojego raportu.

## OBSERWACJE

- Limit słów: PRZYJMUJĘ, 542 zamiast ~400. Ten raport mieści się w limicie.
- E5 przechodzi `battle-roster-test` 7/7 także na HEAD — twardy limit 2 jednostek
  łapie wyłącznie przepisana asercja z `map-field-battle-test`. Bramka rodziny
  sama w sobie pozostaje na to ślepa.
- Erraty do `01-operator-runda1.md` nie wprowadzam: raport rundy 1 jest oceniony,
  a korektą jest ten plik.

## ZMIANY/COMMIT

`gra/**` — ZERO zmian z mojej strony. Zapisany wyłącznie ten plik, po jawnej
ścieżce. Mutacje E5 i pomiary runtime prowadzone w izolowanej KOPII drzewa poza
repo (`scratchpad/sandbox-*`), bajt-identycznej z worktree
(`diff -rq gra/src`, `gra/tools` — rc 0), z tym samym `gra/node_modules`.

## TESTY (na HEAD `83482d5c`)

`tsc --noEmit` exit 0 · `map-field-battle-test` **22/22** · `battle-roster-test` 7/7 ·
`battle-summary-test` OK · `auto-battle-power-test` 14/14 ·
`entity-card-contract-test` 75/75 · `retreat-garnizon-fortyfikacja-test` 27/27 ·
`logic-test` 213/213 · `tech-tree-test` 19/19 · `research-test` 33/33 ·
`unit-replace-test` 13/13 · `combat-test` 6/6 (exit 0). Bramki grepem po
`battleRoster`: `battle-roster-test`, `map-field-battle-test`,
`retreat-garnizon-fortyfikacja-test`, `_tmp-battle-roster-test` (nie bramka).
Uruchomione w kopii, nie w worktree — patrz BLOKADY.

## BLOKADY

**Współdzielony worktree, potwierdzony.** Prompt wymagał HEAD `91877f11` i czystego
drzewa; zastałem `1854bd26` + obcą, niezacommitowaną modyfikację
`gra/tools/map-field-battle-test.cjs`, która w trakcie mojej pracy została
zacommitowana jako `83482d5c` (Operator rundy 2). Nie zatrzymałem się na `BLOCK`,
bo cały rozjazd tłumaczą legalne commity TEGO tematu (`4e44b0bd` mój,
`7a19f591` ratyfikacja, `1854bd26` Evaluator, `83482d5c` runda 2), a warunek
`91877f11` jest brzmieniem promptu rundy 1, nie stanem właściwym II fazie.
Nie napisałem nic do `gra/**` i nie uruchamiałem bramek w worktree — bramki piszą
`gra/tools/.*-bundle.cjs` pod stałą nazwą, więc równoległy przebieg dałby
fałszywy wynik obu procesom (dokładnie klasa błędu z §IZOLACJA/C-001).

## DO DECYZJI CZŁOWIEKA

Czy różnica rosteru w trybie playtest (obrona 2) jest akceptowanym wyjątkiem od
GOAL, czy defektem — wytwór tego nie rozstrzyga: komentarz `main.ts:24289` mówi
o zamierzonym klastrze armii, ale nie o cywilach.

RUNDY: 1/5
NASTĘPNY KROK: Final Control (werdykt rundy 1).
DEPLOY/PUSH: NIE WYKONANO
