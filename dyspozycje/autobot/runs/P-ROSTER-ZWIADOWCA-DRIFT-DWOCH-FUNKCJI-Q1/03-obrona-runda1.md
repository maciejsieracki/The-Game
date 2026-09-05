# P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1 — Operator (obrona), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1
GOAL: skład bitwy niezależny od tego, którą funkcją go policzono.
MODEL+EFFORT: Opus 5, effort high · ROLA: Operator (obrona, II faza rundy 1) · RUNDA 1/5

## OBRONA 1 → PRZYJMUJĘ

Teza z `01-operator-runda1.md:37` jest w brzmieniu uniwersalnym FAŁSZYWA. Odtworzyłem
E5 na fixturze rundy 1 (`4e44b0bd`): `battleRoster.ts:59` `return out;` →
`return out.slice(0, 2);` daje `map-field-battle-test` **20 ok/0 fail** (bez mutacji
19/1), `battle-roster-test` 7/7. Teza broni się tylko węziej: żadna zmiana ZGODNA
Z KONTRAKTEM rosteru („heks kotwicy + własne jednostki w promieniu 1", `main.ts:24282`);
E5 kontrakt łamie, cicho gubiąc jednostki. Dziura jest już zamknięta — ta sama mutacja
na HEAD `83482d5c` daje **21 ok/1 fail**, czerwieniejąc na asercji „pozostale trzy
jednostki bojowe ZOSTAJA w rosterze". Parytet pod E5 zostaje zielony (kryterium 4).

## OBRONA 2 → PRZYJMUJĘ

„Zero śladu zamierzonej różnicy" (`:44`) jest nieprawdziwe. `main.ts:24288-24293`:
przy `playtestWalkaActive` `collectBattleRoster` deleguje do
`collectPlaytestBattleRoster` (`playtestWalkaMapy.ts:113-142`) — bez filtra cywilnego.
Pomiar runtime, jeden zestaw (Hastati `(5,0)`, Łucznik `(4,0)`, zwiadowca `(5,1)`):
pure `["u0","u2"]` vs playtest `["u0","u2","u-scout"]`. Ślad zamierzoności jest jawny
w komentarzu `main.ts:24289`. Zasięg: flagę ustawia wyłącznie
`doStartPlaytestWalkaMapy()` (`main.ts:33738-33740`) — normalnej gry nie dotyczy.
Znalezisko poboczne nr 4 do rejestru.

## OBRONA 3 → ODRZUCAM

Fakt (19/1, brak parytetu) prawdziwy, jako zarzut wobec pracy — nietrafny. Dispatch
przewiduje to wyjście wprost: kryterium 2 („to jest `DECISION_REQUIRED` z dowodem,
nie samodzielna zmiana testu") i §GRANICE. C-054: `DECISION_REQUIRED` to nie `BLOCK`
i nie zużywa rundy. Ratyfikacja `7a19f591` uznała kryteria 1–3 za niespełnialne
i je zastąpiła; kryterium 3 spełnia dziś runda 2.

## OBRONA 4 → ODRZUCAM

Warunek JEST podany dosłownie, `01-operator-runda1.md:46`: „Parytet już zachodzi:
**dla wspólnej kotwicy na heksie miasta** oba rostery zwracają identyczny zbiór ID."
`decision-abc.md` o parytecie nie mówi wcale. Zmierzyłem oba układy: kotwica `(6,0)`
= heks miasta → `["u0","u2"]` vs `["u0","u2"]`, parytet TAK; kotwica `(5,0)` obok →
`["u0","u3"]` vs `["u0","u2"]`, parytet NIE. Asercja rundy 2 stoi na heksie miasta —
dokładnie na moim warunku.

## OBSERWACJE

- Limit słów: PRZYJMUJĘ (542 zamiast ~400). Ten raport ma 578 słów — nadal ponad
  limit, mimo destylacji; podaję liczbę zamiast ją przemilczeć.
- E5 przechodzi `battle-roster-test` 7/7 także na HEAD: twardy limit 2 łapie wyłącznie
  przepisana asercja z `map-field-battle-test`; bramka rodziny pozostaje ślepa.
- Erraty do raportu rundy 1 nie wprowadzam — korektą jest ten plik.

## ZMIANY/COMMIT

`gra/**` — ZERO zmian z mojej strony (`git diff 83482d5c..HEAD -- gra/` puste).
Zapisany wyłącznie ten plik, po jawnej ścieżce. Mutacje i pomiary w izolowanej KOPII
drzewa poza repo, bajt-identycznej z worktree (`diff -rq` na `gra/src` i `gra/tools`,
rc 0), z tym samym `gra/node_modules`.

## TESTY (HEAD `83482d5c`)

`tsc --noEmit` exit 0 · `map-field-battle-test` **22/22** · `battle-roster-test` 7/7 ·
`battle-summary-test` OK · `auto-battle-power-test` 14/14 · `entity-card-contract-test`
75/75 · `retreat-garnizon-fortyfikacja-test` 27/27 · `logic-test` 213/213 ·
`tech-tree-test` 19/19 · `research-test` 33/33 · `unit-replace-test` 13/13 ·
`combat-test` 6/6. Grep po `battleRoster` nie dodał nic poza tymi bramkami
i `_tmp-battle-roster-test` (nie bramka). Uruchomione w kopii — patrz BLOKADY.

## BLOKADY

**Współdzielony worktree, potwierdzony.** Prompt wymagał HEAD `91877f11` i czystego
drzewa; zastałem `1854bd26` plus obcą, niezacommitowaną modyfikację
`gra/tools/map-field-battle-test.cjs`, zacommitowaną w trakcie mojej pracy jako
`83482d5c` (Operator rundy 2). Nie zatrzymałem się na `BLOCK`: rozjazd tłumaczą legalne
commity tego tematu (`4e44b0bd`, `7a19f591`, `1854bd26`, `83482d5c`), a `91877f11` to
warunek promptu rundy 1, nie stan właściwy II fazie. Bramek w worktree nie uruchamiałem —
piszą `gra/tools/.*-bundle.cjs` pod stałą nazwą, więc równoległy przebieg dałby fałszywy
wynik obu procesom (klasa błędu z C-001).

## DO DECYZJI CZŁOWIEKA

Czy różnica rosteru w trybie playtest (obrona 2) to akceptowany wyjątek od GOAL, czy
defekt — wytwór nie rozstrzyga: komentarz mówi o zamierzonym klastrze armii, nie o cywilach.

RUNDY: 1/5
NASTĘPNY KROK: Final Control (werdykt rundy 1).
DEPLOY/PUSH: NIE WYKONANO
