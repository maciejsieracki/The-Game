STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-LAND-FRACTION-RESTORE-Q1
GOAL: Przywrocic domyslny udzial ladu per typ swiata (Pangea 60, Wyspy 50, Kontynenty 30, Ziemia szablon ~21 bez suwaka) po regresie z 9c3d921db; nie nadpisywac zapisanych prefs.

ZMIANY/COMMIT: SHA w sekcji na koncu (commit zawierajacy ten plik; SHA podany w odpowiedzi orkiestratorowi).
- gra/src/map/newGameMapDefaults.ts: usunieto `if (typ !== 'ziemia') return 30;` w defaultLandFractionPercentForTyp; teraz wszystkie typy ze zrodla defaultLandFractionForTyp (gen-helpers.ts:3254) zaokraglone do opcji suwaka (60/30/50/20). Zero duplikacji liczb.
- gra/src/ui/newGameFlow.ts: hint landFraction (mainGridExtraRows/advancedSettingRows) = "Domyslnie: Pangea 60%, Kontynenty 30%, Wyspy 50%. Typ Ziemia = szablon ... (~21%, bez suwaka)". Inne miejsca z "30% we wszystkich typach": brak (git grep).
- gra/tools/newgame-defaults-test.cjs: oczekiwania Pangea 60/40, Wyspy 50/50 (takze po powrocie z Ziemi), __params.landFractionPercent=50 (Wyspy), opis naglowka.
- DEFAULT_ADVANCED.landFractionPercent=30 zgodny z domyslnym typem Kontynenty; zmiana typu: newGameFlow.ts:1683 -> resetAdvLandOnWorldTypeChange (:465, custom=false); wczytanie prefs/render kroku: syncAdvLandFromWorldType (:450, :2017) nie rusza wartosci przy landFractionCustom=true.

PUNKT (2) PRZEGLAD (plik:linia):
- newGameFlow.ts:2174 params.landFractionPercent = advOpts.landFractionPercent -> main.ts:40747 `/100` -> generujSwiatAsync -> resolveLandFraction (newGameMapDefaults.ts:479) -> generator.ts:161. Suwak realnie wplywa (pomiar PO: Wyspy 50.0%, Pangea ~56%).
- Ziemia: generator.ts:315-318 i :383 uzywa enforceEarthTemplateOnHexes, landFraction ignorowany -> ukryty suwak nie zostawia zlego stanu w mapie (nawet custom=true z prefs). Kosmetyka: podsumowanie kroku Start (newGameFlow.ts:2222) dla Ziemi pokazuje "20% / 80%" (zmierzone realnie 15.6%) - NIE zmieniane (poza zakresem "tylko land fraction + opisy"; do rozwazenia przez orkiestratora).
- main.ts:26426, :27212: fixtury testowe (debug hooki) z 30 - nie bledy, bez zmian.
- main.ts:33477/:40553/:40636: zapis/odczyt loadLandFraction, fallback `?? 30` dotyczy tylko starych zapisow bez meta i bez snapshotu mapy (regeneracja przy wczytaniu); dla Pangea/Wyspy ze starych zapisow dalby 30 zamiast domyslnej typu. NOTE, nie zmieniane (main.ts tylko przy bledzie w przekazywaniu; nowe zapisy zawsze maja wartosc z _lastNewGameParams). Do decyzji orkiestratora.
- main.ts:41065 landFractionPercent: 50: sciezka playtest "walka" (PLAYTEST_WALKA_SEED, Kontynenty, mapa Maly) - deterministyczna fixtura playtestu, nie ma zwiazku z kreatorem; bez zmian (zmiana zmienilaby mape playtestu).
- Menu (877f6d5fa, c46d6c47f, a08120797): suwak w siatce kroku 4 z setIdx -> custom=true, getIdx fallback na 30; przelaczenie typu resetuje. Nic "odpietego" w przekazywaniu nie znaleziono.

TESTY:
- tsc: `node ./node_modules/typescript/bin/tsc --noEmit` EXIT=0 (gate-tsc.txt).
- Pomiar generatora (gate-measure-land.txt, EXIT=0), Standardowy 168x120, 3 ziarna (101/202/303), rzeki wylaczone kill-switchem (udzial ladu liczony przed rzekami): PRZED -> PO: Kontynenty 30.0% -> 30.0%; Pangea 14.5/8.9/8.9% (slider 30) -> 56.8/55.9/56.3% (slider 60); Wyspy 30.0% -> 50.0% (10080 heksow); Ziemia 15.6% -> 15.6% (bez zmian). Pangea realnie ~56-57%, nie dokladnie 60% (generator, zakaz zmian); Wyspy i Kontynenty trafiaja w cel.
- newgame-defaults-test.cjs: NIE_ZMIENIONO WYNIKU / NIE_URUCHOMIONO - w srodowisku brak przegladarki Chromium dla Playwright (brak ~/.cache/ms-playwright). Zaktualizowano tylko oczekiwania; wymaga uruchomienia w Evaluatorze/FC z przegladarka.
- Pozostale testy z 30: clearing-deficit-live-measure.cjs:44, interaction-latency-vs-citycount-live-test.cjs:200 podaja wlasne jawne params (30) - niezalezne od domyslnych; newgame-settings-layout-reposition-test.cjs:174 porownuje dynamicznie wybrana wartosc - bez zmian. Ich uruchomienie: NIE_ZMIERZONO (brak przegladarki).
- node_modules usuniete po pracy.

BLOKADY: brak przegladarki w srodowisku (test UI nieuruchomiony).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (uruchomic newgame-defaults-test.cjs z przegladarka, zweryfikowac pomiar niezaleznie, ocenic notes: Ziemia podsumowanie 20%, fallback ?? 30 przy wczytaniu starych zapisow).
DEPLOY/PUSH: NIE WYKONANO
