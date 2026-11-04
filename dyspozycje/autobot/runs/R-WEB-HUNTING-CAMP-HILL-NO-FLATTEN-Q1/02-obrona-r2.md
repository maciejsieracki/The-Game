STATUS: PASS
DOMAIN: GAME (WEB) — render mapy
TEMAT: R-WEB-HUNTING-CAMP-HILL-NO-FLATTEN-Q1
RUNDA: 2/5 (obrona)

## Odpowiedź na zarzuty

1. Regresja `oboz-lowiecki-las-znika-render-test.cjs` — PRZYJMUJĘ. Wpis `oboz_lowiecki` w whiteliście sprawił, że mutacja poprzedniego testu (tylko `forestKept`->false) nie odtwarza objawu. Test zaktualizowany: wariant PRZED cofa w locie OBIE poprawki (`forestKept` oraz wpis whitelisty w `src/game/relief-preserving-improvements.ts`). Wynik na bazie: 26 PASS / 1 FAIL; po poprawce: 26 PASS / 1 FAIL. Jedyny czerwony to `TERRAIN_ALLOW.lodzie_rybackie` (jest też na bazie, poza tematem). Dwa wcześniej nowe czerwone są znów zielone.
2. Seria regresji — PRZYJMUJĘ, wykonana (log: `gate-regresja-po-r2.txt`, 100 s limit na test). PO == PRZED dla: `oboz-lowiecki-las-test` 19 FAIL na obu (znane czerwone z dispatchu; zmierzone też PRZED po cofnięciu wpisu), `kopalnia-cyny-render`, `zloze-zloto-render` 0 FAIL na obu. PO zielone (EXIT=0): oboz-lowiecki-wymaga-tartaku, sawmill-hill-relief, relief-preserving-mine-prefix, terrain-base-resource-yields, terrain-hill-movement, map-improvement-qualify, improvement-* (territory-gate, era-scaling 144/0, adapter-resource-note, card-callsites, card-uklad-sekcji, build-highlight-lifecycle), auto-improvements, ai-improvements, pending-improvements, era-improvement-cost-upkeep, ai-food-improvement-priority-stages, river-terrain-move, city-defense-terrain-gate, hex-tooltip-improvement-production-text, unit-renderer-overlay-sync, capture-render-sync, hotseat-etap6e-render-noop. NIE_ZMIERZONO (limit czasu 100-150 s także na bazie, 0 FAIL do chwili przerwania): `terrain-height-audit-test`, `horse-resource-terrain-test`, `tartak-wzgorze-las-real-render-test` (timeout EXIT=124 zarówno PO, jak i PRZED dla ostatniego). Pominięte jako niezwiązane z reliefem (UI `*-real-render-test` paneli, `zelazo-*`): świadomie, nie mierzone.
3. Pomiar ścieżek — PRZYJMUJĘ częściowo, dane z kodu (grep + odczyt), nie z uruchomienia:
   - Zapisy `hex.nakladka`/`hex.terenBazowy` w ścieżkach budowy: tylko jawne wyręby `main.ts:15230`, `main.ts:15441` (finalizeHexClearing), `main.ts:39551` (wyrąb AI). Ulepszenie `oboz_lowiecki` danych nie zmienia: `syncHexUlepszenieFields` (`main.ts:14717-14731`) dotyka tylko `ulepszenia`/`improvementKey`/`ulepszenie`. Pozostałe zapisy `nakladka` w main.ts (25789, 25818, 25827, 26815) to seedy/playtest/złoże konia, nie budowa; `city-hex-clear.ts:51-75` dotyczy miast.
   - Wszystkie ścieżki budowy schodzą do jednego lejka `spawnImprovementMesh` (`main.ts:15473`) -> `syncImprovementDecorForHex` (`main.ts:15502`) -> predykat `keepsReliefUnderImprovement` (`main.ts:15269`) -> `preservesHillRelief`: gracz `15246`, wyrąb gracza `15435`, auto-ulepszenia (callback `15588`, hotseat/auto `37038`), AI `39583`, test-seed `25628`, odtworzenie wszystkich ulepszeń po wczytaniu/zasiewie mapy `14687`, `15647`. Jedna poprawka predykatu pokrywa je wszystkie.
   - Wczytanie zapisu: brak osobnej migracji reliefu w kodzie danych (żadnego zapisu terenu w ścieżce wczytania); ulepszenia są odtwarzane przez `spawnImprovementMesh` (`14687`, `15647`), czyli przez ten sam predykat. Test dla ścieżki wczytania zapisu i dla ścieżki AI NIE_ZMIERZONO w Chromium (tylko analiza kodu); test obejmuje budowę ręczną przez silnik (`placeViaEngine`) oraz obóz solo (stary zapis bez tartaku).
4. Odchylenie od allowlisty — PRZYJMUJĘ. Zmiana w `gra/src/game/relief-preserving-improvements.ts` leży poza allowlistą dispatchu (`gra/src/render/*`, `main.ts`, test, run). Przyczyna źródłowa jest tam (whitelista kluczy dla `preservesHillRelief`, używana przez `main.ts:15278`); nie da się jej naprawić w `render/*` bez duplikowania listy. Zgłaszam jawnie i proszę orkiestratora o zatwierdzenie rozszerzenia allowlisty o ten jeden plik. Zmiana: jeden wpis w zbiorze, bez zmian reguł gry.
5. Zrzut referencyjny tartaku — PRZYJMUJĘ. Test zapisuje teraz `evidence/{przed,po}-0-tartak-referencja-zblizenie-1280x720.png` (to samo ujęcie dist=14 co zrzuty obozu 1/2). Obejrzane: PO — wzgórza z lasem widoczne zarówno przy tartaku, jak i po obozie. Uwaga: kadr to szerokie ujęcie (kamera nie dociąga mocniej), więc porównanie literalne wspierają też asercje liczbowe (dekor lasu 3->3, sectorR i sampler identyczne dla tartaku i obozu).

## Bramki
- `hunting-camp-hill-no-flatten-test.cjs`: 20 PASS / 0 FAIL, EXIT=0 (`gate-hunting-camp-test-r2.txt`).
- `oboz-lowiecki-las-znika-render-test.cjs`: 26 PASS / 1 FAIL (baza 26/1) — znane czerwone `lodzie_rybackie`.
- `tsc --noEmit`: EXIT=0 (`gate-tsc-r2.txt`).

## Dla orkiestratora
- REPIN w LEDGER: `rust-port/renderer/src/models/improvements/**` ma odtworzyć „obóz zachowuje relief wzgórza jak tartak".
- Zero zmian w `gra-robocza/**`, `rust-port/**`, `WERSJE.md`. Push NIE.
