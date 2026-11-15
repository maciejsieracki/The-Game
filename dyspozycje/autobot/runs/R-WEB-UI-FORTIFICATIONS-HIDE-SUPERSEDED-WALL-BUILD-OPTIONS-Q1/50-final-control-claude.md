STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-FORTIFICATIONS-HIDE-SUPERSEDED-WALL-BUILD-OPTIONS-Q1
GOAL: nowa budowa niższego muru znika po odblokowaniu wyższego (Palisada po Murarstwie, Mury kamienne po Budownictwie); awans zbudowanego niższego etapu zostaje; Cytadela i baszta bez zmian.
ZMIANY/COMMIT: oceniany kandydat d2747192567caa27e790991fd45caed53590d532 (potomek bazy 33c888c1a: `merge-base --is-ancestor` = tak). UWAGA: kandydat NIE jest potomkiem aktualnego origin/main (c9c161ec3, tam m.in. R-WEB-DATA-STONE-WALLS-NO-BRICK-COST-Q1) - integracja wymaga merge. Diff vs baza: production.ts, building-upgrades.ts (czysta isFortificationSupersededForBuild), 4 testy fortyfikacji + nowy fortifications-superseded-build-test.cjs, 2 hasła encyklopedii, wikiBundle.json, artefakty runu. ai.ts i main.ts NIETKNIETE (poza allowlistą nic).
TESTY (własny przebieg, surowe wyjścia):
- kandydat d2747192: tsc --noEmit exit 0; superseded-build 38/0; stack-repro 49/0; upgrade-chain-ai 13/0; queue-cleanup 10/0; upgrade-chain-ui (Chromium/Playwright przez esbuild-bundle realnego cityPanel) 17 passed/0 failed, w tym F1 (tylko Obróbka drewna -> palisada), F2 (+Murarstwo -> tylko Mury kamienne), U11 (+Budownictwo od zera -> tylko Mury ceglane), U9/U10 (kamienne stoją -> awans na ceglane w "Ulepsz"); 5 bramek: logic 213/213, tech-tree 20/0, research 33/0 ALL GREEN, unit-replace 21/21, combat 6/6; git diff --check (baza..kandydat) czysty.
- próbny merge kandydata z origin/main c9c161ec3 (poza repo, odrzucony po teście): jedyny konflikt = wikiBundle.json (regenerowalny, `node tools/bundle-wiki-for-game.cjs`); po regeneracji tsc 0, wszystkie powyższe testy/bramki zielone (38/49/13/10/17, 213/20/33/21/6).
- mutacja: zastąpienie wywołania isFortificationSupersededForBuild w production.ts przez false -> superseded-build 32 pass/6 fail, upgrade-chain-ai 14 OK/1 FAIL (test nie jest tautologiczny).
- czerwone-na-bazie: brak czerwonych bramek, więc nic do rozróżniania (baza nie mierzona osobno).
ROZSTRZYGNIĘCIE ZARZUTÓW:
1. ODDAL/zamknięte przez Obronę: asercje awansu przywrócone do oryginałów; zmienione tylko S0/U11 (od zera) i regex U1 - zgodne z GOAL ("nowa budowa"). Awans palisada->Mury kamienne przy Budownictwie: kod zachowuje awans (kontrolowany skipChainUpgradeSource), jedyne pytanie ABC to preferencja; zgodne z dispatch (d). Nie blokuje.
2. ODDAL: redundantne bramki w ai.ts usunięte; A5a/A5b pokrywają przez realny gate availableProduction (mutacja czerwona).
3. ODDAL: administrator/auto-build korzystają ze wspólnej availableProduction/buildableProduction (ta sama bramka co gracz); osobny test ścieżki administratora NIE_ZMIERZONO - nota.
4. ODDAL: kolejka: dostępność sprawdzana przy dodawaniu, istniejący wpis zostaje (kryterium (e) = opis, dyspozycja kazała nie usuwać); opis w raporcie operatora. Nota.
5. ODDAL: F1/F2 + zrzuty 05/06 (+01-04) są w runie; moje własne uruchomienie testu Chromium: 17/0.
6. ODDAL: akapity w mury.md i mury-kamienne.md + wikiBundle dodane.
7. ODDAL: wszystko zielone na kandydacie i po merge z main.
8. ODDAL: dług Rust to osobny REPIN, nie blokada.
Zadne NAPRAW.
BLOKADY: brak. Noty: (a) integracja wymaga merge z origin/main i regeneracji wikiBundle.json (konflikt tylko tam); (b) ABC dla właściciela opcjonalnie: czy awans Palisada->Mury kamienne ma zostać po Budownictwie (obecnie zostaje), czy palisada w kolejce po Murarstwie ma być usuwana (obecnie zostaje); (c) mury-kamienne.md sekcja kosztów mogła mieć rozbieżność z bazą po zmianie bez cegły - po merge sprawdzić (poza zakresem); (d) dług Rust REPIN reguły muru NIE_ZMIERZONO.
RUNDY: FC 1 (Operator 1/5, obrona 1).
NASTĘPNY KROK: integracja orkiestratora (merge d2747192 z origin/main, regeneracja wikiBundle.json, powtórzenie bramek), potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: gra/node_modules (npm ci, ignorowane przez git) i gra/tools/_fort-chain-shots w worktree do sprzątnięcia.
