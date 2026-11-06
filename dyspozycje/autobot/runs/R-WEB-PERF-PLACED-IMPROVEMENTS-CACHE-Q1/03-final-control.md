STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-PLACED-IMPROVEMENTS-CACHE-Q1
GOAL: koszt placedImprovementsForOwner >=5x nizszy bez zmiany wynikow. Dowod syntetyczny (bench v2): x12-x112 zaleznie od czestosci zapisow; live t.95 NIE_ZMIERZONO.
ZMIANY/COMMIT: kod do integracji 5ca18b195bda20bc5a7d720b4b1e88dab29774a7 (R2; main.ts bez zmian wzgl. b11fb0e93). Baza 318c6ecdb = origin/main (fast-forward). Diff 318c6ecdb..5ca18b195 w allowliscie: gra/src/main.ts, gra/src/game/trade-routes.ts, gra/tools/placed-improvements-cache-q1-test.cjs, katalog runa. git diff --check czysto.
TESTY (FC, wlasne uruchomienie): tsc EXIT=0; placed-improvements-cache-q1 15/0; trade-grant 62/0; zloto-szlak 54/0; mennica-uspienie 49/0; auto-improvements 46/0; bench-micro-v2: bez zapisow x76-112, zapis/200 x81-84, zapis/20 x19-28, zapis/1 x11.6-13.1, wynik identyczny wszedzie (load 5.9). okolica-load-reconcile 21/23 i ownership-change-reconcile 12/15 = baseline.
ROZSTRZYGNIECIE ZARZUTOW: 1 (brak live t.95) ODDAL -> osobna fala z bundlem/maszyna >30 min; nie wada kodu. 2 (zapisy uniewazniaja cache) NAPRAWIONE w R2 (memo hexOwner przezywa zapisy), zmierzone. 3 (skany zalezne) ODDAL: reszta kosztu jest w czasie PO benchu; computeEmpireLivestockUnlocks NIE_ZMIERZONO. 4 (test zrodlowy pkt 5) ODDAL: uzupelnienie, rdzen behawioralny + 6 mutantow. 5 (hashe war-allin-capital-quick, river-forest-clear-no-citizen) ODDAL: wymagaja bundla/Chromium, determinizm oparty na rownowaznosci z referencja. Brak NAPRAW -> PASS.
Weryfikacja inwalidacji: territoryOwnerAt czyta q,r,isFort,isOutpost,order,ownerId, pop (przez cityTerritoryRadius); wszystkie w podpisie sameTerritoryNodes. Kazdy zapis placedImprovements idzie przez VersionedMap.set/delete/clear. Zwracana mapa ReadonlyMap (tsc).
BLOKADY: NIE_ZMIERZONO live t.95; hashe; computeEmpireLivestockUnlocks.
RUNDY: FC 1/5
NASTEPNY KROK: integracja orkiestratora: fast-forward origin/main na 5ca18b195 + commit FC; wzgledem origin/rust-port/parity-v2 niezalezne (zero plikow rust-port), dowolna kolejnosc; przy rownoleglym LATE-GAME-LAG-HUD-Q2 sprawdzic konflikt w main.ts (hunki: import, ok. l.5255, l.14777, sygnatury ReadonlyMap). Live t.95 zlecic osobno.
DEPLOY/PUSH: NIE WYKONANO
