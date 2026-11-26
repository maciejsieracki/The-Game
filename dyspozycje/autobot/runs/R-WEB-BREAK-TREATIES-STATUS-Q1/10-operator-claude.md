STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-BREAK-TREATIES-STATUS-Q1 (BREAKTREATIES, #169)
GOAL: ustalić na dowodzie, czy po wypowiedzeniu wojny (breakTreatiesOnWar i jego wywołania w main.ts) relacja pary może zostać w statusie „sojusz” albo z żywą umową sojuszu/handlu. Wynik: BRAK BŁĘDU w ścieżkach produkcyjnych; dodano test inwariantu z mutacjami czerwonymi. Poprawki w grze nie wprowadzono.
ZMIANY/COMMIT: baza 6c4f0f6ca (origin/main). Nowy plik: gra/tools/break-treaties-status-test.cjs; ten raport. Kod gry (src/) nietknięty. SHA commita: w polu sha zwrotki.
TESTY:
- gra/tools/break-treaties-status-test.cjs: PASS=18 FAIL=0 (esbuild z katalogu tymczasowego poza repo, przez ESBUILD_PATH).
  Mutacje czerwone: M1 usunięcie removeTreatiesById w ciele breakTreatiesOnWar, M2 brak statusu wojny po casus belli, M3 brak statusu wojny przy wypowiedzeniu przez gracza, M4 bezKary przed usunięciem umów — każda wykryta. (Pierwsza wersja mutacji M1/M4 trafiała w pierwsze wystąpienie linii w main.ts (L22919), nie w ciało funkcji; poprawiono na zakres ciała funkcji, potem PASS.)
- gra/tools/alliance-label-clean-test.cjs (sanity, powiązany): PASS=26 FAIL=0.
- tsc, logic 213, tech-tree 20, research 33, combat 6, ai-test 297/0, war-rules-multiwar-main-guard 21/0, war-limit-truce-count 19/0: NIE_ZMIERZONO (w worktree brak node_modules; bez zmian w src/ nie ma regresji do sprawdzenia; nie instalowano zależności w repo).
BLOKADY: brak.

TABELA ŚCIEŻEK (wywołania breakTreatiesOnWar w main.ts, definicja L25825):
| # | Linia | Ścieżka | Status po breakTreatiesOnWar | Dowód |
|---|---|---|---|---|
| 1 | 12752 | r3: wojna z progu (casus belli), opts.bezKary=true | setDiploRelation(... applyDiploEventTracked 'wojna_wypowiedziana') w ~10 liniach po wywołaniu → 'wojna' | grep; diplomacy.ts:955-959 (wojna_wypowiedziana → newStatus='wojna') |
| 2 | 14407 | gracz wypowiada wojnę (ME → owner) | setDiploRelation ... 'wojna_wypowiedziana' w 10 liniach → 'wojna' | main.ts 14407-14416 |
| 3 | 14446 | ownerDeclareWarOn (ogólna deklaracja AI/gracza, także force) | applyDiploEventTracked 'wojna_wypowiedziana' (L14455) → 'wojna' | main.ts 14446-14460 |
| 4 | 26351 | joinAllyToWar (sojusznik dołącza do wojny) | setDiploRelation 'wojna_wypowiedziana' bezpośrednio po wywołaniu → 'wojna' | main.ts 26351-26356 |
| 5 | 45933 | wojna państwa-miasta klastra na gracza | newRel = applyDiploEventTracked 'wojna_wypowiedziana' → setDiploRelation → 'wojna' | main.ts 45933-45937 |
| 6 | 47651 | deklaracja AI na cel (autonomia AI) | newRel = applyDiploEventTracked 'wojna_wypowiedziana' → 'wojna' | main.ts 47651-47656 |

Kolejność: w każdym miejscu getDiploRelation czytany jest PO breakTreatiesOnWar (które w wariancie bez bezKary zapisuje tylko 'zlamana_obietnica' bez zmiany statusu na 'sojusz'), więc nadpisanie na 'wojna' jest ostateczne. Inwariant umów: removeTreatiesById(activeDeals, treatiesBrokenByWar(...)) usuwa wszystkie kinds z BREAK_ON_WAR dla pary (sojusze wojskowe/obronne/pełne, NAP, handel, przemarsz, szlaki, wymiany, otwarte granice, wspólna walka z barbarzyńcami); treatiesBrokenByWar jest niezależny od kolejności stron (addTreaty sortuje strony, dealsForPair czyta po posortowanej parze).
Ścieżka bezKary (casus belli): usunięcie umów (removeTreatiesById) jest PRZED `if (opts?.bezKary) return;` — zdarzenie relacji pomijane, ale status ustawia wywołujący (wiersz 1).

Ścieżki ustawiające 'wojna' BEZ breakTreatiesOnWar (zbadane, nie produkcyjne):
- main.ts:30838, 31401, 33731, 51256, 51750: hooki testowe (__…TestDebug) i presety playtestu. 30838 (forceBronzeForcedWarDominoOnPlayer) samo czyści sojusze przed ustawieniem wojny.
- diplomacy.ts events 'zdrada' i 'wojna_casus_belli' ustawiają 'wojna', ale NIE MAJĄ wywołań produkcyjnych w src (martwe typy zdarzeń).
Wniosek: w produkcji każda wojna przechodzi przez breakTreatiesOnWar + status 'wojna'. Relacja „sojusz” po wojnie nie jest możliwa przez te ścieżki.

Gdzie sojusz-bez-umowy może powstać: NIE przez breakTreatiesOnWar (zbadane w tym temacie). Zjawisko „pary sojusz bez umowy” z ALLYMEAS/ALLYCLEAN jest obsłużone przez reconcileAllianceStatusAfterDeals (FALA 913) i nie dotyczy tej ścieżki.

DECISION_REQUIRED: brak (błąd nie potwierdzony, poprawka nie jest potrzebna).

RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o integracji testu (Final Control). Brak zmian gry do deployu.

UWAGI-DLA-ORKIESTRATORA (poza zakresem, nie wykonywano):
- Linia 22919 (`if (brokenIds.length) activeDeals = removeTreatiesById(...)`) to inny punkt usuwania umów; nie badany w tym temacie.
- Dispatch podawał przybliżone linie (≈14099, ≈14136, ≈30167); aktualne wywołania: 12752, 14407, 14446, 26351, 45933, 47651. Test wymusza dokładnie 6 wywołań produkcyjnych — nowe wywołanie wymaga przeglądu statusu.
- Hooki testowe 30838/31401/33731 ustawiają 'wojna' ręcznie; jeśli kiedyś trafią do produkcji, inwariant wypadnie.
- Biblioteka esbuild nie jest w repo (brak gra/node_modules w worktree); test wymaga ESBUILD_PATH albo npm install w gra/ — jak alliance-label-clean-test.

DEPLOY/PUSH: NIE WYKONANO
