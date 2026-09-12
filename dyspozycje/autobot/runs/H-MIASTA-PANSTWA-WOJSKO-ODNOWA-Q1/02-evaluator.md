STATUS: FAIL
DOMAIN: GAME
TEMAT: H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1
GOAL: Zastosować nowe reguły liczby jednostek startowych zależnie od trudności oraz potwierdzić i naprawić, jeśli trzeba, przydzielanie i co-turę uzupełnianie wojska/HP bez naruszenia ustawień państw-miast gracza z kreatora.

ZARZUTY:

1. Startowa armia gracza jest przyznawana przy każdym założeniu miasta, nie tylko po pierwszym.
   Miejsce: gra/src/main.ts:13010-13057; dodane w diffie origin/main..HEAD przy linii 13057:
   `grantPlayerStartUnits(c.ownerId, c.q, c.r);`.

   `tryFoundPlayerCityAt()` jest wspólną ścieżką dla pierwszego i kolejnych miast. Potwierdza to
   bezpośrednio wcześniejszy kod tej funkcji: `evaluateFoundCityAffordance(...)` rozróżnia
   `isSubsequentFoundCity(...)`, pobiera dla kolejnego miasta koszt Pracy i ludności, a
   `validateFirstPlayerCityPlacement(...)` ogranicza promień startowy wyłącznie, gdy
   `awaitingFirstCity === true`. Po udanym `foundCityAt(...)` wywołanie `grantPlayerStartUnits`
   jest bezwarunkowe. Jedyny zapis `playerEverOwnedCityByOwner.add(ME())` następuje dopiero
   kilka linii później (13066), więc nie chroni tego wywołania.

   Skutek: po pierwszej stolicy gracz dostaje poprawnie 1/2/3 Wojowników, ale każde następne
   założone miasto może dodać kolejną pełną paczkę 1/2/3 Wojowników. Narusza to znaczenie
   "startowej" armii i raport Operatora (01-operator.md:23: "po skutecznym założeniu
   pierwszego miasta"). Aktualny live-test zakłada tylko jedno miasto gracza w każdym przebiegu,
   więc tego przypadku nie wykrywa. Należy przyznać armię tylko dla pierwszego miasta danego
   ownera, przed zapisaniem flagi/zbioru pierwszego miasta, oraz dodać regresję dla drugiego
   miasta; w hot-seat warunek musi być per owner/fotel.

ZMIANY/DOWODY:

- Faktyczny diff origin/main..HEAD: 7 plików, 221 insertions(+), 81 deletions(-):
  - gra/src/game/ai-difficulty-bonus.ts
  - gra/src/main.ts
  - gra/tools/ai-difficulty-bonus-test.cjs
  - gra/tools/city-state-start-units-test.cjs
  - gra/tools/city-state-start-units-live-test.cjs
  - dyspozycje/autobot/runs/H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1/00-dispatch.md
  - dyspozycje/autobot/runs/H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1/01-operator.md
- Zakres kodu mieści się w allowliście; nie zmieniono gra/src/game/manpower.ts ani
  gra/src/game/turn-economy.ts. Worktree Evaluatora po testach jest czysty.
- Tabele resolverów są poprawne i rozdzielone:
  - gra/src/game/ai-difficulty-bonus.ts:146-150: gracz easy/normal/hard = 1/2/3.
  - gra/src/game/ai-difficulty-bonus.ts:153-157: obce państwa-miasta = 2/1/0.
  - gra/src/game/ai-difficulty-bonus.ts:139-143: państwo-miasto typu gracza = 0/1/2 wg osobnego suwaka.
- Call-site 1 w gra/src/main.ts:8931-8936 używa `_menuCityStateDifficulty`.
- Call-site 2 w gra/src/main.ts:9066-9071 używa `foreignCityStateStartUnitCount(_menuDifficulty)`
  wyłącznie w gałęzi `isCS`; nie ma przypadkowego wywołania z bonusu major AI.
- `grantPlayerStartUnits(c.ownerId, ...)` przekazuje właściciela założonego miasta, więc sama
  identyfikacja aktywnego fotela w tej ścieżce jest poprawna; zarzut dotyczy braku guardu
  pierwszego miasta, nie ownerId.
- Brak kandydatów sekretów/kluczy w dodanych literalach; brak zmian w zabronionych WERSJE.md,
  gra-robocza/**, playbooku/regułach AutoBota. Brak nakładania zmienionych ścieżek z dirty
  stanem nadrzędnego checkoutu `/home/ubuntu/projects/The-Game`.

TESTY:

PASS (wykonane niezależnie w tym Evaluatorze):
- `node tools/ai-difficulty-bonus-test.cjs` — 79 passed, 0 failed.
- `node tools/city-state-start-units-test.cjs` — 16 PASS, 0 FAIL.
- `CS_CHROME_PATH=/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome node tools/city-state-start-units-live-test.cjs` — 22 PASS, 0 FAIL; 3 pełne generacje świata; oba strukturalne punkty spawnu; główna trudność easy/normal/hard = armia gracza 1/2/3; PM normal niezależnie; obce PM 2/1/0; typ/fotel gracza 0/1/2; 0 błędów konsoli/JS.
- `node tools/manpower-test.cjs` — 63 OK, 0 FAIL.
- `node tools/r-manpower-uzupelnienie-hp-niezapisuje-q1-test.cjs` — 12 OK, 0 FAIL; live callback, zapis HP/HP max i Manpower.
- `node ./node_modules/typescript/bin/tsc --noEmit` — PASS; TypeScript 5.9.3.
- `git diff --check origin/main..HEAD` — PASS.
- `env PLAYWRIGHT_BROWSERS_PATH=/home/ubuntu/.cache/ms-playwright node tools/hotseat-human-owners-test.cjs` — 29 PASS, 0 FAIL.
- `env PLAYWRIGHT_BROWSERS_PATH=/home/ubuntu/.cache/ms-playwright node tools/first-player-city-test.cjs` — 16 pass, 0 fail.
- `env PLAYWRIGHT_BROWSERS_PATH=/home/ubuntu/.cache/ms-playwright node tools/hotseat-etap7-saveload-test.cjs` — 59 passed, 0 failed; niepusty roundtrip dwóch foteli, miasta/jednostki, technologie, explored per owner i aktywny fotel.
- Runtime browser: Google Chrome for Testing 151.0.7922.34; Node v26.8.2; Vite 5.4.21.

MUTACJA:
- Nietautologiczny mutant tabeli: tymczasowo zmieniono `playerStartUnitCount(normal)` 2 -> 1
  w kopii źródeł; `ai-difficulty-bonus-test.cjs` wykrył zmianę: 78 passed, 1 failed.
- Nietautologiczny mutant call-site'u: tymczasowo usunięto wywołanie resolvera w pętli rywali
  tego samego typu; kopia `city-state-start-units-test.cjs` wykryła regresję: 14 PASS, 2 FAIL
  (licznik call-site'ów i kotwica miejsca 1).
- Wszystkie tymczasowe kopie/usuwalne artefakty usunięto; worktree jest czysty.

MANPOWER/HP:
- Audyt potwierdza istniejący resolver: 2% max Manpower/turę, HP easy 40% / normal 30% /
  hard 20% maxHP/turę, cap, brak puli, oblężenie, wykluczenie zwiadowcy i synchronizację do
  żywego obiektu/save. Nie znaleziono defektu i nie zmieniano tych mechanik.

BLOKADY: Brak blokady infrastrukturalnej. FAIL wynika z konkretnego defektu zakresu GAME opisanego w zarzucie 1.

NASTĘPNY KROK: Operator — poprawić guard pierwszego miasta per owner/fotel i dodać test regresyjny drugiego miasta; następnie ponowić Evaluator na tym samym ID. Nie tworzyć Final Control przed usunięciem zarzutu.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 2/5
