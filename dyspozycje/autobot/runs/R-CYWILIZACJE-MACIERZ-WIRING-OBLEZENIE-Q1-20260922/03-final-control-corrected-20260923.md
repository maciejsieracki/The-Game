STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
GOAL: Niezależnie potwierdzić, że wszystkie trzy parametry Oblężenia są konsumowane przez mapę, bitwę interaktywną, decyzję AI o oblężeniu oraz obrażenia machin, bez podwójnego naliczenia.
ZMIANY/COMMIT: Final Control read-only; produktu, testów i danych nie zmieniano. Allowlista produktu pozostaje ograniczona do 8 ścieżek zatwierdzonych w dispatchu. Podczas audytu orkiestrator dodał osobny, docs-only commit `389d6b19` z istniejącą bramką integracji; nie jest to zmiana produktu ani mój commit.

USTALENIA:
- Poprzedni zarzut blokujący jest zamknięty. Oba produkcyjne wywołania AI (`main.ts:14930-14962` i `14966-14987`) budują `SiegeCity` przez `buildSiegeCityFromRuntime` (`main.ts:15044-15065`) z civKey obrońcy: mapa ludzkich ownerów, `player.civType`, mapa AI albo `null`. Brak/nieznany klucz daje neutralne `0`, bez greckiego fallbacku w tej ścieżce.
- `siege.ts:445-456` odczytuje `obl_mur_proc` i `obl_obrona_miasta_proc` przez wspólną `cityWallDefenseBonusPercent`; `siegeAi.ts:103-114` stosuje `applyCityBonus(..., true)` dokładnie raz. `resolveSiegeAttack` (`siege.ts:684-723`) pozostaje z domyślnym `false`, a nie ma produkcyjnego call-site’u w `gra/src`; realna bitwa korzysta z osobnych ścieżek `main.ts`/`battleScene.ts`.
- Mapa i bitwa interaktywna używają tej samej funkcji: obrońca miasta (`main.ts:26768-26797`, `battleScene.ts:2617-2646`). Machiny używają civKey atakującego (`battleScene.ts:5886-5915`, `7149-7175`, `7189-7194`); obrońcy są w gałęzi hold (`5938-5952`) i nie niszczą muru/bramy.
- 45/45 komórek pozostaje zgodnych z INPUT; zmienione względem `origin/main` są 20 niezerowych ścieżek `obl_*`, bez pól spoza allowlisty. Przecięcie ze zmianami Manpower wynosi 0.

TESTY: `tsc --noEmit` PASS; wiring 83/0 (45 cells); siege AI 17/0; logic 213/213; city-defense 34/0; defense-breakdown 44/0; fortify 41/0; mur 29/0; militia siege 8/0; `git diff --check` PASS. Znane, niezwiązane baseline: empire 115/1 FAIL i koszty 126/3 FAIL — te same wyniki na czystym `origin/main`.

BLOKADY: brak blokującego zarzutu. Nota nieblokująca: heurystyka AI skaluje w `applyCityBonus(..., true)` zarówno Obronę, jak i Pancerz, podczas gdy realna bitwa stosuje strukturalny procent tylko do składowej Obrony; to rozdział modelu decyzyjnego AI od rozstrzygnięcia walki, nie podwójne naliczenie.
RUNDY: 2/5 (runda 1 + wąska korekta AI).
NASTĘPNY KROK: Reużycie istniejącej bramki `05-integration-gate.md`, status `INTEGRATION_PENDING`, workerless/blocked; integracja, merge, push i deploy wymagają osobnej zgody właściciela.
DEPLOY/PUSH: NIE WYKONANO.
