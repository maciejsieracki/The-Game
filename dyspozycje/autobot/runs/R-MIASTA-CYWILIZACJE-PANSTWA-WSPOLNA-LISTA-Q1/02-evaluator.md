# R-MIASTA-CYWILIZACJE-PANSTWA-WSPOLNA-LISTA-Q1 — Evaluator, runda 1/5

STATUS: ZARZUTY (4) — Evaluator nie wydaje werdyktu PASS/FAIL (§3c)
DOMAIN: GAME
TEMAT: R-MIASTA-CYWILIZACJE-PANSTWA-WSPOLNA-LISTA-Q1
GOAL: jedna wspólna sekwencja nazw per cywilizacja; indeks 0 wyłącznie dla stolicy; istniejące nazwy państw-miast na końcu; brak kolizji; wspólne źródło bez cichego powrotu do dwóch pul.
MODEL+EFFORT: gpt-5.6-luna · effort high · provider openai-codex · service_tier priority (Fast)
ROLA: Evaluator · RUNDY: 1/5
HEAD: 172d2ed9a67817ed8e67b580c85f6b1bb2f1ab5b
WORKTREE: /home/ubuntu/projects/The-Game-worktrees/R-MIASTA-CYWILIZACJE-PANSTWA-WSPOLNA-LISTA-Q1

## SPRAWDZONE SAMODZIELNIE

Allowlista: `git diff --name-only` obejmuje wyłącznie `gra/data/city-names-pools.json`,
`gra/data/civs.json`, `gra/src/game/city-names-pool.ts`, `gra/src/game/civ-names.ts`,
`gra/src/main.ts`, ukierunkowane testy w `gra/tools/` oraz artefakty bieżącego runu.
Brak zmian w `WERSJE.md`, `gra-robocza/**`, `KANAL-PRACA.md` i `HANDOFF-AKTUALNY.md`.
`git diff --check` = 0. Skan diffu na typowe tokeny sekretów = 0 trafień. Nie wykonano
push/PR/merge/deploy.

Audyt danych wykonany niezależnie: 15/15 kluczy, każda lista
`miasta_cywilizacji` ma 110 wpisów i 110 unikalnych wartości; puste wpisy = 0,
duplikaty = 0, kolizje kapitał–państwo-miasto (w obrębie i między cywilizacjami) = 0;
`civs.json.nazwyMiast` jest lustrem wspólnej listy dla 15/15. Pierwsza nazwa i końcowe
10 nazw są zgodne z oczekiwanym podziałem 100+10.

SHA-256 zweryfikowane w worktree:
- `gra/data/city-names-pools.json`: `876ed2c964303580804d970378bca2c6c6712c6bcc493a54657771f6926645f2`
- `gra/data/civs.json`: `6215661f0eb00e7a4df837d8284f285ec472b61a3bf6647d9dc7aecb998464f5`
- `gra/src/game/city-names-pool.ts`: `8b679fda47d8200fdfd2982e5335b178b7a1ed67f75711b99d4f667efd1c6f67`
- `gra/src/game/civ-names.ts`: `b9680efb7eae9d25d0e5f649ab768a1bdf55da0b2d6691c8f7610be0044126b0`

## BRAMKI URUCHOMIONE NIEZALEŻNIE

- `npm run typecheck` → `rc=0` (`tsc --noEmit`).
- `node tools/city-names-pool-test.cjs` → `123 passed, 0 failed`.
- `node tools/city-names-pools-test.cjs` → `9 passed, 0 failed`.
- `node tools/civ-names-test.cjs` → `7 passed, 0 failed`.
- `node tools/nazwy-miast-rozlaczne-pule-test.cjs` → `9 passed, 0 failed`.
- `node tools/mapa-etykieta-stolicy-test.cjs` → `47 passed, 0 failed`.
- Dodatkowo `node tools/display-names-test.cjs` → `27 passed, 0 failed`.
- Referencje: `logic-test.cjs` 213/213; `tech-tree-test.cjs` 19/19;
  `research-test.cjs` 33/33; `unit-replace-test.cjs` 13/13; `combat-test.cjs` 6/6.
- `node tools/start-preview-test.cjs` → `3 passed, 3 failed`; trzy failure dotyczą
  istniejących ustawień balansu/mapy (`12 rywali`, `12 typów`, `11 obcych typów`),
  poza zakresem dispatchu. Nazwy stolicy i suffixu przechodzą.
- `node tools/cluster-start-test.cjs` nie zakończył się przed limitem 420 s. Log ma
  failures placement/hub-chain oraz dwa failures kontraktu nazw: `chińska stolica = Qin`
  i `etykieta ... = Qin`. Te dwa nie są unrelated baseline — wynik `Xi'an` jest skutkiem
  wspólnej listy i wymaga aktualizacji testu/wywołania z `cityNamesPools`.

## DOWÓD NIETAUTOLOGICZNOŚCI

Na kopii poza worktree wykonano mutacje bez zmiany plików repozytorium:

- `const idx = CITY_NAMES_POOL_REGULAR_LEN + index` → `const idx = index`;
  `city-names-pool-test.cjs` zwrócił `rc=1`, `121 passed, 2 failed`.
- `regular.slice(1)` → `regular` w ścieżce wyboru zwykłej nazwy;
  test zwrócił `rc=1`, `122 passed, 1 failed`, z komunikatem
  `zwykłe miasto pomija zastrzeżoną stolicę (Ateny)`.

Oba warianty czerwienieją, ale obecna bramka nie ma jeszcze asercji overflow rywala
powyżej 10 — patrz zarzut 1.

## ZARZUTY

1. **Overflow państwa-miasta może dostać stolicę — `gra/src/game/city-names-pool.ts:123-137`,
   `clusterRivalFromPool`.** Dla `rivalIndex1Based > pan.length` pętla iteruje całe
   `regular`, włącznie z `regular[0]`. Niezależny probe:
   `clusterRivalCityName(civs, 'grecy', 11, pools)` → `actual="Ateny"`,
   `capital="Ateny"`, `violatesReservedCapital=true`, exit 1. Wywołujący
   `gra/src/map/cluster-spawn.ts:91-123` przekazuje `idx + 1`, a API nie ogranicza
   `rivalCount` do 10, więc nie jest to wyłącznie martwa ścieżka. To narusza GOAL pkt 2,
   kryterium indeksu 0 i STRICT-EDGE. Operator musi wykluczyć `regular[0]` w overflow
   (oraz dobrać bezpieczny fallback) i dodać asercję dla indeksu 11.

2. **Powiązana bramka testowa jest niespójna z nowym kontraktem —
   `gra/tools/cluster-start-test.cjs:180-190`.** Test nadal oczekuje `Qin` z usuniętej
   koncepcji `nazwyKlastra`, mimo że wspólna lista ma stolicę Chin `Xi'an`. Należy przekazać
   `cityNamesPools` do `buildClusterStartPlan` i asertować bieżący kontrakt, albo osobno
   udokumentować te dwa name-failures jako regresję celową. Nie wolno w raporcie nazywać
   ich niezwiązanym baseline; pozostałe failures placement/hub-chain mogą pozostać
   pre-existing po dowodzie baseline.

3. **Literalna utrata nazwy bez jawnego rozliczenia — `gra/data/civs.json` (Asyria)
   i `01-operator-report.md:38`, `01-evidence.json`.** Porównanie bazowego
   `HEAD:civs.json` z worktree wykazało `Assur` usunięte i `Aszur` dodane. To może być
   świadoma normalizacja kanonicznego zapisu (w bazowym `city-names-pools.json` jest
   `Aszur`), ale deklaracja „all original names preserved / set 110/110” jest literalnie
   fałszywa i nie wskazuje decyzji/racji. Obrona musi dopisać udokumentowaną decyzję
   o `Assur` → `Aszur` albo przywrócić literalną nazwę zgodnie z GOAL „nie usuwać nazw”.

4. **Brak realnego śladu mutacji w handoffie operatora — `01-operator-report.md:6,40`
   i `01-evidence.json`.** Raport opisuje test indeksu 0 jako przechodzący, ale nie zawiera
   wyniku mutacji, którego wymaga kryterium acceptance. Wyniki z sekcji „DOWÓD
   NIETAUTOLOGICZNOŚCI” powyżej są reprodukowalne i pokazują, co należy dopisać do
   evidence: mutacja, kopia poza worktree, `rc=1` oraz liczby pass/fail. To narusza
   kryterium raport/evidence z dispatchu oraz STRICT-EDGE, dopóki ślad nie zostanie
   zapisany.

## OSIE BEZ ZARZUTU

Brak nowych pól stanu ani zmian snapshotu/save-load — STRICT-SAVE nie uruchamia się.
Zmiana pure helperów i wspólnego wiring nie zawiera gałęzi `ownerId`/`isPlayer`; ścieżki
stolicy, AI founding i MP są sprawdzane przez wspólne pule — brak osobnego zarzutu
STRICT-PARITY. Diff mieści się w allowliście i nie zawiera sekretów.

BLOKADY: brak zewnętrznych; lista zarzutów przekazana do Obrony Operatora (§3c).
NASTĘPNY KROK: Obrona Operatora odpowiada osobno na zarzuty 1–4 z dowodem z wytworu,
potem Final Control.
DEPLOY/PUSH: NIE WYKONANO.
