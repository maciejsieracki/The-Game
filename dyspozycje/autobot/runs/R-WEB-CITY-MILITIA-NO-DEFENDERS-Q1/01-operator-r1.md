STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-MILITIA-NO-DEFENDERS-Q1
GOAL: Milicja miasta wg specyfikacji właściciela 2026-11-03 (M1-M5): 1 mieszkaniec = 1 jednostka, ZAWSZE przy ataku na miasto z ukończonym budynkiem Garnizon, połowa wręcz (×0,5) / połowa dystans (pełne staty), typy wg epoki, niższe morale, straty zmniejszają ludność.
ZMIANY/COMMIT: SHA w sekcji końcowej (jeden commit, push NIE). Pliki: `gra/data/combat-params.json` (militia_pop_fraction 1.0, +militia_morale_fraction 0.5, +militia_morale_min_margin_over_flee 3, +militia_roster), `gra/src/game/siege.ts` (stałe + `effectiveGarrison` dokłada milicję do realnych obrońców), `gra/src/game/siegeDefenders.ts` (`buildMilitiaDef`, `buildMilitiaSquad`, `collectCityDefRoster` -> N pojedynczych jednostek, `applyMilitiaPopulationLoss`, `defenderSideTitle`), `gra/src/main.ts` (ownerEra w `cityDefenderOptions`, tytuł strony, spadek ludności po bitwie w `applyMapBattleOutcome`, estymator panelu), `gra/src/battle/mapFieldBattle.ts` (ownerEra), `gra/src/ui/siegeMapPanel.ts` (tylko wyświetlanie), `PROJEKT-GRY-master.md` §9c, NOWY `gra/tools/city-militia-no-defenders-test.cjs`, 3 testy zaktualizowane (militia-garrison-contract, militia-garrison-router-siege, map-field-battle: stare oczekiwanie 1 zbiorczej "Milicji" i 20% -> nowa spec).

USTALENIA (stan z kodu PRZED, plik:linia na origin/main ae292911f)
- Opis z dispatchu był częściowo nieaktualny: warunek `city.garnizon>0` w `collectCityDefRoster` już nie istniał (poprzedni temat R-MILITIA-GARRISON-Q1 wprowadził budynek Garnizon `siegeDefenders.ts` `isGarrisonBuildingCompleted`); milicja była JEDNĄ zbiorczą jednostką `typeId:'Milicja'` ze stałą `STONE_WARRIOR` (`siege.ts:494`) i udziałem 0,2 (`combat-params.json` oblężenie.militia_pop_fraction).
- Pomiar PRZED (Chromium, prawdziwe moduły, `probe-pre.json`): pop 3 + budynek -> 0 milicji (floor(3*0,2)=0); pop 10/30/60 -> 1 zbiorcza jednostka "Milicja (~2/6/12)"; bez budynku i bez wojska -> zdobycie bez walki; licznik `garnizon`=5 bez jednostek -> `hasCityDefenders=true`, ale roster pusty ("Brak").
- Bramki: `map-attack-city.ts:150` (capture_empty), `mapFieldBattle.ts:323-325` (plan potyczki), `main.ts:31626` `collectSiegeDefRoster`, `main.ts:32874` `tryAutoCaptureEmptyCityAt`, `main.ts:38663` (AI zdobywa miasto), `siegeAi.ts:108` (`effectiveGarrison`).

PO (probe-post.json, ownerEra=2): pop 3/10/30/60 z budynkiem -> 3/10/30/60 jednostek, połowa Włócznik (wręcz, atk 3 / obr 4 / HP 16, morale 33) + połowa Łucznik (pełne staty); z realnym Wojownikiem milicja dołącza ("Wojownik + Milicja (N)"); bez budynku brak milicji niezależnie od licznika.

TESTY
- Nowy `city-militia-no-defenders-test.cjs`: base GREEN 100 OK/0 FAIL (`gate-new-test-green.txt`, EXIT=0); na drzewie origin/main RED (`gate-new-test-red-base.txt`, brak API, EXIT=1); 8 mutacji źródła (ceil->floor, brak bramki budynku, wręcz bez skalowania, dystans skalowany, przesunięta epoka, brak podłogi ludności, zastąpienie zamiast dołączenia, brak obniżenia morale) - każda łamie test. Pokrywa: pop 3/10/30/60 x 3 epoki (typy Oszczepnik/Łucznik/Procarz oraz Wojownik/Włócznik/Wojownik z mieczem i tarczą), pełne staty dystansu vs units.json, wręcz x0,5 (min 1), morale niższe ale ponad progiem ucieczki, licznik 0/5, bez/z realnymi obrońcami, bonus terenu na milicji (resolveSiegeAttack), strata ludności (min 1), tytuły.
- tsc `--noEmit`: czysto (`gate-tsc.txt`, EXIT=0).
- Regresja 54 testów siege/oblez/defender/militia/garnizon/city-attack/battle (bez live/browser), PRE vs POST: identyczny zbiór 13 testów FAIL w obu stanach (preegzystujące: administracja-stolica, auto-battle-simultaneous, battle-attack-move-pointer, battle-loot, battle-mode-choice-labels, battle-natural-chariot-r5, battle-natural-near-range-r6, battle-ranged-approach-regression, budynek-garnizon, heal-stale-blockers-pending-battle, mapa-etykieta-stolicy, pre-battle-retreat-exhausted, pre-battle-save); brak nowych porażek (`gate-regression-pre-vs-post.txt`).

BLOKADY / NIE_ZMIERZONO / ZAŁOŻENIA
- NIE_ZMIERZONO: pełna gra w Chromium (build zakazany; bundle `gra-robocza` odpowiada stanowi PRZED). Zmierzone prawdziwe moduły w Chromium; ścieżki AI->AI, państwa-miasta, barbarzyńcy, wydajność bitwy 3D przy 60 jednostkach - tylko analiza kodu.
- Dyspozycja nie zawiera nazwy "Miecznik z tarczą": użyto "Wojownik z mieczem i tarczą" (Brąz;Żelazo). Procarz w units.json ma Epokę "Brąz", ale spec wymaga go dla Żelaza - zastosowano spec.
- Morale: ×0,5 z podłogą (Morale ucieczki + 3), bo np. Łucznik 40->20 < próg 25 byłby złamany od startu (parametry w danych).
- Straty: manualna bitwa - ocaleni z `survivors`; auto - `applyLossPctToRoster` (jak `applyAutoLosses`); ludność min 1. Zmiana w `main.ts applyMapBattleOutcome` (spoza ścisłej listy "tylko zbieranie obrońców" - uzasadnienie: jedyny punkt znający wynik bitwy; `post-battle-map.ts` poza allowlistą).
- Poza allowlistą, NIE zmieniono: `barbarians.ts:409` woła `canCaptureCityWithoutBattle(destCity, units)` bez opcji (ignoruje budynek Garnizon -> barbarzyńcy z morza wchodzą do miasta tylko z milicją); desynchronizacja licznika `garnizon`>0 bez jednostek (`hasCityDefenders` true, roster pusty).
- Uboczny efekt testów: `tools` nadpisują śledzony `R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1/01-matrix.json`; cofnięto, nie w commicie. `node_modules` usunięty.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5): zweryfikować diff, mutacje, potwierdzić brak regresji; zdecydować o `barbarians.ts:409`; temat R-WEB-PALISADE-BATTLE-WALL-RULES-Q1 sekwencyjnie po integracji.
DEPLOY/PUSH: NIE WYKONANO
