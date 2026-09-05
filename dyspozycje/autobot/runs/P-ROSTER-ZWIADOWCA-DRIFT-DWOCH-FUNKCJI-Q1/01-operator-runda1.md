# P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1 — Operator, runda 1

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1
GOAL: skład bitwy niezależny od tego, którą funkcją go policzono — zwiadowca przy
miejscu starcia identycznie w `collectBattleRoster`, `collectAtkRosterNearCity`
i `collectDefRosterNearCity`.
MODEL+EFFORT: Opus 5, effort high · ŚCIEŻKA A (Workflow) · RUNDA 1/5
IZOLACJA: `/home/user/wt-roster-zwiadowca` @ `91877f11` (potomek bazy `fe57a068`),
drzewo czyste przed i po pracy.

## HIPOTEZA ORKIESTRATORA — NIEPOTWIERDZONA

Predykat `shouldIncludeInBattleRoster` (`gra/src/units/battleRoster.ts:29-31`) w
gałęzi atakującego **nie czyta `battleHex`** — zwraca `u.id === ctx.anchor.id`.
`battleHex` działa tylko na obrońcę, co mówi wprost komentarz pola (`:16`).

## PRAWDZIWA PRZYCZYNA — ROZJAZDU FUNKCJI NIE MA

Zwiadowca jest wykluczany w OBU funkcjach. Zmierzone na bundlu bramki:
`collectBattleRoster(hastati,[hastati,ally,scout,warrior2])` → `u0+u2+u3` (n=3,
bez zwiadowcy); ten sam zestaw przez `collectAtkRosterNearCity` → `u0+u2` (n=2);
`collectBattleRoster` bez `warrior2` → `u0+u2` (n=2).

Asercja `map-field-battle-test.cjs:155-157` czerwieni się **wyłącznie na
`length === 2`**. Jej fixture podaje czwartą jednostkę `warrior2` (`u3`, Hastati,
ownerId 0, hex `(5,-1)`) — pełnoprawną jednostkę bojową w `hexDistance` 1 od
kotwicy `(5,0)`; roster ma więc poprawnie 3 pozycje. Siostrzana asercja przechodzi,
bo jej fixture `warrior2` pomija; dodany i tak wypada — od miasta `(6,0)` dzieli
go dystans 2, odsiewa go promień, nie reguła cywilna.

`gra/tools/battle-roster-test.cjs:105-109` testuje to samo zdanie poprawnym
fixturem (bez czwartej jednostki) i jest zielona. Asercja w `map-field-battle-test`
jest jej wadliwą kopią, a przy tym sprzeczna z sąsiadką `:152-153`: tamta wymaga
sojusznika bojowego w dystansie 1 W rosterze, ta wymagałaby `warrior2` — własnego,
niecywilnego, też w dystansie 1 — POZA nim. Żadna zmiana `gra/src` nie zazieleni
obu naraz. Kontrakt pola: `main.ts:24282` „heks kotwicy + własne jednostki w
promieniu 1 heksa".

## TRZECIA FUNKCJA, ZAMIERZONOŚĆ, PARYTET

`collectDefRosterNearCity` (`:98`) nie ma tego rozjazdu — ten sam predykat,
`side:'defender'`. Zero śladu zamierzonej różnicy w kodzie, komentarzach ani
wywołaniach (`mapFieldBattle.ts:308`, `main.ts:23644`, `:24283-24306`, `:25563`,
`:26642`). Parytet już zachodzi: dla wspólnej kotwicy na heksie miasta oba rostery
zwracają identyczny zbiór ID. Asercji parytetu nie dopisałem — zabetonowałaby
bramkę przed decyzją właściciela.

## DOWÓD NIETAUTOLOGICZNOŚCI (mutacje `gra/src`, cofnięte)

M1 (predykat zawsze `true`): `map-field-battle-test` 16 ok/4 fail,
`battle-roster-test` 2 ok/5 fail — logika wykluczenia jest żywa i mierzona.
M2 (cywil wykluczany także na heksie starcia): 18 ok/2 fail oraz 6 ok/1 fail —
czerwienieją wyłącznie asercje „scout ON city hex included", asercje wykluczenia
zostają zielone. Po każdej mutacji `git diff --quiet` czysto, bramka wraca do 19/20.

## ZMIANY/COMMIT

`gra/**` BEZ ZMIAN (`git diff --quiet` czyste). Zapisane tylko artefakty runu:
ten raport + `decision-abc.md`.

## TESTY

`map-field-battle-test` **19/20** (czerwona wyłącznie sporna asercja; nie tknięta) ·
`battle-roster-test` 7/7 · `battle-summary-test` OK · `auto-battle-power-test` 14/14 ·
`entity-card-contract-test` 75/75 · `retreat-garnizon-fortyfikacja-test` exit 0 ·
`logic-test` 213/213 · `tech-tree-test` 19/19 · `research-test` 33/33 ·
`unit-replace-test` 13/13 · `combat-test` 6/6 ·
`node ./node_modules/typescript/bin/tsc --noEmit` 0 błędów (tsc 5.9.3, `gra/node_modules`
symlink, C-029). Grep objął też `gra/tools/_tmp-battle-roster-test.cjs` — zacommitowany
plik roboczy, nie bramka; znalezisko poboczne do rejestru, nie ruszane. Drugie
znalezisko poboczne (C-025, nie naprawiane): `collectDefRosterNearCity` nie filtruje
po `ownerId` — kompensują to oba wywołania (`siegeDefenders.ts:16`, `main.ts:25593`).

## WPŁYW NA GRĘ

Zerowy — nic nie zmieniono, zwiadowca już dziś wypada z obu rosterów. Przykład:
kotwica Hastati `(5,0)`, Łucznik `(5,1)`, Zwiadowca `(5,1)`, Hastati `(5,-1)` —
roster `u0+u2+u3` przed i po. Zazielenienie asercji „naprawą kodu" usunęłoby z
rosteru jednostkę BOJOWĄ sąsiadującą z kotwicą — realna zmiana balansu bitwy w polu.

## BLOKADY

Kryterium 2 zabrania zmiany asercji, kryterium 1 wymaga 20/20 — bez decyzji
właściciela nie da się spełnić obu. `DECISION_REQUIRED` wg C-054 (nie zużywa rundy).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja diagnozy i dowodów); równolegle decyzja
właściciela wg `decision-abc.md`, status tematu w rejestrze → `ABC-OCZEKUJE`.
DEPLOY/PUSH: NIE WYKONANO
