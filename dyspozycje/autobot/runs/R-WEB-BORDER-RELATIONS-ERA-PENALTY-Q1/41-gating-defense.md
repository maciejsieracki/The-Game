# R-WEB-BORDER-RELATIONS-ERA-PENALTY-Q1 — runtime-hook exposure defense

STATUS: PASS — opt-in test hook is absent by default and available with `civTest=1`
KANDYDAT: `codex/border-era-penalty`
CZAS: 2026-11-10, Chromium run started 20:34:22 UTC and completed about 20:36:33 UTC

## Zmiana

- Jedynie assignment `window.__borderEraPenaltyRuntimeTestDebug` jest wewnątrz warunku `new URLSearchParams(location.search).get('civTest') === '1'`. Pozostałe istniejące hooki nie zostały objęte warunkiem ani zmienione.
- Live gate zawsze dodaje `civTest=1` do pozytywnego URL. Przed nim uruchamia rzeczywistą aplikację playtest bez tego parametru i sprawdza ekspozycję po boot.

## Rzeczywisty test przeglądarki

- Bez parametru: aplikacja z `?playtest=mapa` doszła do załadowanego świata (`__eraTestDebug`, miasta > 0); `typeof window.__borderEraPenaltyRuntimeTestDebug` wyniosło `undefined`. `pageerror` było puste.
- Z `?playtest=mapa&civTest=1`: po ponownym załadowaniu działały oczekiwane metody `ownerIds`, `setupFixture`, `pairEvidence`, `applyProductionTick`, `quickSave` i `loadSlot` (łącznie hook udostępnił 13 metod). `pageerror` było puste.
- W tym samym oznaczonym przebiegu pełny runtime gate także zakończył się `RESULT PASS`: para ownerów AI 1/3 miała stawki −4 dla epok 2/3, zapis/odczyt IndexedDB zachował rzeczywisty roster i badania, po restore epoki 2/3 dały ten sam wiersz breakdown i tick, kolejność pary zachowała −3 po zmianie obu ownerów na Brąz, a guard bez granicy usunął wiersz UI.
- Test zgłosił ostrzeżenia renderera WebGL i pojedynczy 404 zasobu; nie było błędów strony. Nie zmieniałem produkcyjnej kalkulacji stawki ani restore.

## Bramka

- `node tools/diplomacy-border-era-penalty-test.cjs` — PASS, 39/39.
- `npm run typecheck` — PASS (`tsc --noEmit`). `git diff --check` — PASS.
- Proces Chromium działał na własnym Vite `127.0.0.1:18904` i odseparowanym profilu, równolegle z ROOTAUDIO616 zgodnie z aktualnym przydziałem zasobów.

DEPLOY/PUSH/MERGE: NIE WYKONANO
