# 00-dispatch — R-MIASTA-CYWILIZACJE-PANSTWA-WSPOLNA-LISTA-Q1

STATUS: INFRA
DOMAIN: INFRA
ROLE: Operator (po usunięciu blokady routingu)
TEMAT: R-MIASTA-CYWILIZACJE-PANSTWA-WSPOLNA-LISTA-Q1
ROUND: 1
ATTEMPT: 1

## ZLECENIE WŁAŚCICIELA

Dla każdej cywilizacji przepiąć miasta cywilizacji i państwa-miasta na jedną
wspólną listę. Lista cywilizacji ma zachować kolejność od najbardziej znanych
historycznie/prawdopodobnie istotnych do najmniej znanych. Pierwsza nazwa jest
zawsze zarezerwowana dla cywilizacji: musi być jej głównym miastem i stolicą.
Kolejne nazwy mogą być używane przez państwa-miasta. Państwo-miasto nie może
mieć nazwy zastrzeżonej jako pierwsza nazwa cywilizacji. Dotyczy to wszystkich
cywilizacji, nie tylko Grecji.

## GOAL

Doprowadzić dane i żywy przepływ wyboru nazw do jednego, rozdzielnego kontraktu
per cywilizacja:

1. jedna wspólna sekwencja nazw dla cywilizacji i jej państw-miast;
2. indeks 0 zarezerwowany wyłącznie dla głównego miasta/stolicy cywilizacji;
3. istniejące nazwy miast państw-miast dołączone na sam koniec sekwencji;
4. brak kolizji nazwy stolicy z nazwą państwa-miasta;
5. wszystkie 15 cywilizacji sprawdzone programowo;
6. cywilizacje i państwa-miasta korzystają z tej samej listy/źródła, bez cichego
   powrotu do dwóch niezależnych pul.

## ZAKRES DANYCH

Operator ma audytować wszystkie wpisy w:

- `gra/data/city-names-pools.json`;
- `gra/data/civs.json` (`nazwyMiast`);
- żywe miejsca użycia w `gra/src/game/city-names-pool.ts`,
  `gra/src/game/civ-names.ts` oraz — tylko jeśli konieczne do spięcia źródła —
  `gra/src/main.ts`.

Dla każdej cywilizacji raport musi podać przed/po:

- liczbę nazw cywilizacji;
- liczbę nazw państw-miast;
- liczbę nazw wspólnej listy;
- nazwę i indeks stolicy;
- nazwy dołączone na końcu;
- puste wpisy, duplikaty i kolizje;
- zgodność `civs.json.nazwyMiast` ze źródłem pul;
- rzeczywiste miejsca wywołania dla stolicy, zwykłego miasta i państwa-miasta.

Nie usuwać nazw bez osobnego, udokumentowanego powodu. Kolejność ustalać na
podstawie istniejących danych i weryfikowalnych faktów historycznych; nie
wymyślać nazw ani nie przedstawiać niepewnego porządku jako faktu. Jeśli
konkretna kolejność jest nierozstrzygalna, zapisać `DECISION_REQUIRED` zamiast
dopowiadać.

## ZASADA PIERWSZEJ NAZWY

Pierwszy element każdej wspólnej listy jest stolicą cywilizacji i nie może być
wylosowany/przydzielony jako państwo-miasto. Operator ma znaleźć i przetestować
realny guard indeksu/wyboru, a nie tylko zmienić JSON. Kolejne elementy mogą
być używane przez państwa-miasta zgodnie z istniejącą kolejnością wyboru.

## ALLOWLISTA ZMIAN

- `gra/data/city-names-pools.json`
- `gra/data/civs.json`
- `gra/src/game/city-names-pool.ts` — wyłącznie jeśli potrzebne do wspólnego
  źródła/guardu
- `gra/src/game/civ-names.ts` — wyłącznie jeśli potrzebne do wspólnego
  źródła/guardu
- `gra/src/main.ts` — wyłącznie jeśli audyt wykaże konieczne miejsce wiring/guardu
- ukierunkowane testy w `gra/tools/`
- `dyspozycje/autobot/runs/R-MIASTA-CYWILIZACJE-PANSTWA-WSPOLNA-LISTA-Q1/**`

Zakres nie obejmuje balansu, trudności, startowych jednostek, generatora mapy,
UI niezwiązanego z nazwami ani innych danych cywilizacji.

## KRYTERIA AKCEPTACJI OPERATORA

- [ ] Wszystkie 15 cywilizacji mają jedną wspólną, rozdzielną listę.
- [ ] Dla każdej cywilizacji pierwszy element jest stolicą i jest zarezerwowany
      dla cywilizacji.
- [ ] Nazwy państw-miast są dopisane na końcu, a nie mieszane przed stolicą.
- [ ] Brak duplikatów i kolizji kapitał–państwo-miasto.
- [ ] `civs.json.nazwyMiast` oraz `city-names-pools.json` są zgodne po zmianie.
- [ ] Żywy kod używa wspólnego kontraktu; testy obejmują cywilizację, jej miasta,
      państwa-miasta, stolicę i brak cross-talku między cywilizacjami.
- [ ] Test mutacyjny obala wariant, w którym państwo-miasto może dostać indeks 0.
- [ ] Typecheck i testy obszaru przechodzą, a czerwone baseline są rozdzielone.
- [ ] Raport/evidence/journal/transition receipt zawierają realne wyniki,
      pełny HEAD, hashe i następny etap Evaluator.
- [ ] Push, PR, merge i deploy: NIE WYKONANO.

## POLITYKA ROUTINGU — WYMAGANA PRZED DISPATCHEM

```text
profile:             the-game-bugs
board:               the-game-bugs
tenant:              the-game-bugs
project:             p_9ae9ac64 / the-game
model_override:      gpt-5.6-luna
provider_override:   openai-codex
reasoning_effort:    high
service_tier:        priority  # Fast
process_phase:       operator
```

`reasoning_effort` i `service_tier` są niezależne. Karta nie może dziedziczyć
ustawień głównego chatu ani profilu. Receipt runu musi zawierać requested oraz
actual dla modelu, providera, effortu i service tier.

## BLOKADA FAIL-CLOSED

Stan bieżący: `INFRA/ROUTING_ERROR`. CLI/API Kanbana nie udostępnia jeszcze
obsługi per-card `service_tier`, a istniejący setter/API zwrócił `Unauthorized`.
Karta może zostać zarejestrowana jako `blocked` bez workera, ale nie wolno jej
promować, przypisywać ani dispatchować, dopóki obsługiwany setter/API nie zapisze
jawnie `reasoning_effort=high` i `service_tier=priority`, a dispatcher nie
przekaże ich do procesu i receiptu.

## ŚRODOWISKO I GRANICA

```text
workspace_kind: worktree
workspace: /home/ubuntu/projects/The-Game-worktrees/R-MIASTA-CYWILIZACJE-PANSTWA-WSPOLNA-LISTA-Q1
branch: hermes/R-MIASTA-CYWILIZACJE-PANSTWA-WSPOLNA-LISTA-Q1
base_head: ff9ce26a663c53c9f711e50536eb10f59dc4b70b
```

Operator pracuje wyłącznie w tym worktree. Nie używać `git reset`, `git clean`,
`git stash`, `git rebase`, force-push ani `git add -A`. Nie edytować `main`,
`WERSJE.md`, `KANAL-PRACA.md`, `HANDOFF-AKTUALNY.md` ani `gra-robocza/**`.
Nie wykonywać pushu, PR, merge ani deployu.

## PROCEDURA PO ODBLOKOWANIU

1. Powtórzyć readback profilu, boardu, projektu, karty, worktree, HEAD i polityki.
2. Uzupełnić jawne pola effort/service tier przez obsługiwany setter.
3. Dopiero wtedy dispatchować Operatora przez natywny dispatcher.
4. Po terminalnym evencie wykonać technical/contextual readback i utworzyć
   Evaluatora z `high + priority`; Final Control dopiero po pełnym obiegu,
   z `max + priority`.
