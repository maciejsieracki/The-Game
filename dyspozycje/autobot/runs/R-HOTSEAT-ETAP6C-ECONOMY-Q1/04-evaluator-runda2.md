# R-HOTSEAT-ETAP6C-ECONOMY-Q1 — Evaluator runda 2

**Metoda:** świeży `Read` całego bloku Klastra F (`main.ts:30690-30900`, po obronie
commit `05aabd5d`), grep historii `setOwnerPracaPool`/`ownerPracaPool`/`pracaPoolByHuman`
i porównanie z `302ea837` (Etap 3, gdzie akcesor powstał), świeże niezależne uruchomienie
`tsc --noEmit`, nowej bramki i wszystkich bramek referencyjnych wskazanych przez Obronę
oraz 5 bramek kanonicznych z `R-PROC-AUTOBOT.md` §6, świeża weryfikacja pre-istniejącego
FAIL `ai-praca-split-parity-test`.

## Ocena zarzutów rundy 1

**Zarzut 1 (Klaster F mieszanie danych) — częściowo naprawiony, patrz NOWY zarzut 4.**
Pętla `for (const hOid of humanSeats.humanOwnerIds)` (30713-30879) teraz konsekwentnie
przekazuje `hOid` do `civTypeForOwner`, `unlockedTechSetForOwner`, `resourceDeficitKeysForOwner`,
`isTerritoryHexOwnedBy`, `freshClearingState`, `registerFortNodeIfNeeded`, `ownerPracaPool`/
`setOwnerPracaPool` — archetyp/technologie/deficyt/terytorium/pula WEWNĘTRZNEGO STANU są
teraz faktycznie per-fotel, potwierdzone świeżym czytaniem, nie tylko deklaracją. Cache HUD
(`_lastPraca`, toasty) poprawnie zawężony `if (hOid === humanOwnerId)` w treści pętli. ALE:
przy śledzeniu konkretnego scenariusza dwóch foteli (`humanOwnerId` = fotel kończący turę
≠ 0) wykryto, że `setOwnerPracaPool()` (akcesor Etapu 3, `main.ts:26511-26519`, NIE zmieniony
w tej rundzie) ma efekt uboczny `_lastPraca = playerPracaPool;` wykonywany BEZWARUNKOWO za
każdym razem gdy `isHuman(ownerId)`, niezależnie od tego, czy `ownerId===humanOwnerId`.
`playerPracaPool` to zmienna modułu aliasowana WYŁĄCZNIE dla `HUMAN_OWNER_PRIMARY(0)` przez
`playerPracaCell` (`10422-10426`) — dla innego fotela `pracaPoolByHuman.get(ownerId)` to
osobny obiekt, więc zapis NIE dotyka `playerPracaPool`. Efekt: `_lastPraca` (renderowany
wprost jako czip HUD „Praca", `main.ts:17563`, bez przeliczenia w `refreshLiveEmpireRatesUnsafe`)
po turze fotela 1 pokazuje resztkową pulę fotela 0, nie fotela 1 — dokładnie ten rodzaj
mieszania, przed którym ostrzegał dispatch. Ten SAM efekt uboczny działa też w bloku
bankowania (Klaster A, `setOwnerPracaPool(city.ownerId,…)` linie 30432/30455, z rundy 1) —
nie jest to nowa regresja Klastra F, ale Klaster F też go dziedziczy i obrona rundy 2 błędnie
zakłada pełne domknięcie „cache HUD singularny aktualizowany WYŁĄCZNIE dla humanOwnerId".
Dziś behawioralny no-op (`humanOwnerIds=[0]`), reprodukowalny dopiero przy realnym drugim
fotelu — zweryfikowane czytaniem kodu, nie bramką (żadna bramka tego nie wywołuje, patrz
zarzut 2/3 niżej).

**Zarzut 2 (brak Chromium) — PRZYJĘTY zasadnie, nadal otwarty.** Obrona wprost przyznaje
brak i nie próbuje pozorować pokrycia. Zarzut 4 wyżej jest bezpośrednim dowodem, DLACZEGO
ta luka ma znaczenie: headless reimplementacja (`B3` w nowej bramce) nie wywołuje realnego
`setOwnerPracaPool`/`_lastPraca` z main.ts, więc nie mogła złapać tego efektu.

**Zarzut 3 (A6 tautologiczna) — naprawiony, potwierdzone.** `hotseat-etap6c-economy-noop-
test.cjs:~195-205` (`A6`): wywołuje `maxSafePoziomRacjiForCity` DWA razy dla tego samego
miasta/ownera (bez `humanOwnerIds` → stock-based; z `humanOwnerIds=[0,1]` → flow-based) i
asercja `maxSafeStock !== maxSafeFlow` faktycznie różnicuje zachowanie, nie tylko `typeof`.
Świeże uruchomienie: 70/70 PASS, ta konkretna asercja obecna i zielona.

## Bramki (świeże, niezależne uruchomienie)

`tsc --noEmit`: 0 błędów. Nowa bramka: 70/70. Referencyjne wskazane przez Obronę:
difficulty-cost 22/22, wealth 36/36, ai-major-economy 33/33, ai-praca-podzial-tura1-seed
9/9, hotseat-etap3-akcesory 64/64, auto-wyzywienie-flow-balance 17/17 — wszystkie zielone.
5 bramek kanonicznych §6: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
unit-replace-test 13/13, combat-test 6/6 — zgodne z wynikiem referencyjnym. `ai-praca-split-
parity-test`: 21/22 (1 FAIL), świeżo potwierdzone jako niezmienione względem poprzedniej
rundy (pre-istniejące na `302b6a96`, nie regres tej rundy).

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6C-ECONOMY-Q1
GOAL: migracja 32 miejsc kategorii „ekonomia" na `isHuman(ownerId)`, blok bankowania
`runWorldEndTurn()`, decyzje `isPlayerOwner`/rebelia, dowód no-op.
TESTY: patrz sekcja Bramki wyżej — wszystko zielone poza pre-istniejącym FAIL.
BLOKADY: (1) `isPlayerOwner` call-site'y odłożone (uzasadnione, z rundy 1). (2) auto-research/
toasty epoki jednoosobowe (jawne, z rundy 1). (3) Zarzut 2 (Chromium) nadal otwarty. (4) NOWY
zarzut 4 niżej.
RUNDY: 2/5
ZARZUTY:
1. [ODDALONY, patrz nowy 4] Klaster F pętla po `humanOwnerIds` — naprawiona dla stanu
   wewnętrznego (archetyp/tech/deficyt/terytorium/pula), potwierdzone świeżym czytaniem.
2. [ŚREDNIA WAGA, NADAL OTWARTY] Brak komponentu Chromium dla Klastra F/G — patrz decyzja
   niżej.
3. [ODDALONY] A6 naprawiona, realny test behawioralny, potwierdzone.
4. [WYSOKA WAGA, NOWY] `setOwnerPracaPool()` (`main.ts:26511-26519`, akcesor Etapu 3,
   niezmieniony w tej rundzie, ale wykorzystywany zarówno przez Klaster A z rundy 1 jak i
   naprawiony Klaster F z rundy 2) ma efekt uboczny `_lastPraca = playerPracaPool;`
   bezwarunkowy dla każdego `isHuman(ownerId)`, mimo że `playerPracaPool` (zmienna modułu)
   jest aliasowana WYŁĄCZNIE dla `HUMAN_OWNER_PRIMARY`. Przy realnym drugim fotelu (`humanOwnerId
   ≠ 0` kończący turę) HUD-owy czip „Praca" (`_lastPraca`, main.ts:17563, czytany wprost bez
   przeliczenia) po EOT pokazuje resztkową pulę fotela 0, nie aktywnego fotela — mieszanie
   danych między fotelami, którego żadna z dostarczonych bramek (headless, nie wywołuje
   realnego main.ts) nie wykrywa. Dziś no-op (`humanOwnerIds=[0]`), ale to dokładnie ta klasa
   błędu, o której ostrzegał dispatch dla Klastra A, i obrona rundy 2 mylnie twierdzi pełne
   domknięcie cache'u HUD dla Klastra F.

DECYZJA co do zarzutu 2 (Chromium) — z uzasadnieniem: NIE wymagam kolejnej pełnej rundy
Obrony wyłącznie dla tego zarzutu w tej chwili. Headless dowód logiki (stan wewnętrzny:
archetyp/tech/deficyt/terytorium/pula) jest wystarczający dla samej migracji literałów —
ale zarzut 4 pokazuje, że brak Chromium NIE jest czysto kosmetyczny: jest bezpośrednią
przyczyną, dla której realny defekt HUD przeszedł niewykryty. Rekomendacja: `PASS-WITH-NOTES`
z jawnie zarejestrowaną luką (zarzuty 2+4) jako osobny, odłożony temat naprawy `_lastPraca`/
harnessu Chromium dla Klastra F/G — NIE blokuję integracji tej rundy o migrację literałów
(behawioralny no-op dziś), ale zarzut 4 musi trafić do rejestru jako jawny, nieprzemilczany
punkt przed jakimkolwiek włączeniem drugiego fotela produkcyjnie. To DECISION_REQUIRED wyłącznie
co do PRIORYTETU/terminu naprawy (osobna runda teraz vs. przy Etapie realnego drugiego fotela)
— nie co do samego faktu defektu, który jest jednoznacznie potwierdzony w kodzie.

NASTĘPNY KROK: Final Control ocenia zarzut 4 per model §3c (NAPRAW/ODDAL/DO DECYZJI
CZŁOWIEKA) — rekomendacja Evaluatora: DO DECYZJI CZŁOWIEKA co do terminu (teraz vs. odłożone
razem z Chromium), NAPRAW jeśli właściciel chce zamknięcia teraz w tej samej rundzie.
DEPLOY/PUSH: NIE WYKONANO
