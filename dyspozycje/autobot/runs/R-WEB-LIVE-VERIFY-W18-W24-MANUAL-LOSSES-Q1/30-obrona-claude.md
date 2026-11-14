STATUS: PASS-WITH-NOTES (obrona runda 3: zarzuty 1-6 rozstrzygnięte; punkt 1 (W18) NIE_ZMIERZONO z podaniem przyczyny technicznej; punkt 3 zmierzony 7 przebiegów kontrolnych, klik-po-klik NIE_ZMIERZONO; punkt 2 bez zmian z r1)
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1
GOAL: odpowiedź na zarzuty Evaluatora (raport 20-evaluator, FAIL, rekomendacja powrót do Operatora z tym samym ID). Baza kodu: 3b36ee80c (origin/main); kandydat do obrony: 2135f73ad (r2 operatora; allowlista OK, gra/src i gra/data bez zmian).

ZMIANY-COMMIT:
- gra/tools/live-verify-w18-w24-manual-losses-w3r3.cjs (nowy; skrypt pomiaru r3: tryb 'skip' zamiast 'manual', hitMode ustawiany hakiem + kontrola 'losowe', pole wallBreached, przebieg K1).
- dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1/evidence/w3-straty-zwyciezcy-r3.json (surowy JSON, 14 przebiegów, 0 błędów strony).
- ten plik (30-obrona-claude.md).
- Bez zmian w gra/src, gra/data, WERSJE.md, gra-robocza/, rust-port/. Build wykonany poza repo (katalog w scratchpad). SHA: pole sha w odpowiedzi strukturalnej.

ODPOWIEDZI NA ZARZUTY
Zarzut 1 (W18 niewykonany, uzasadnienie „brak haka”): ODRZUCAM uzasadnienie „brak haka” jako jedyne; PRZYJMUJĘ, że pomiar nie został wykonany. Przyczyna techniczna (zweryfikowana w kodzie, nie w przeglądarce):
  (a) Oblężenie gracza startuje wyłącznie ścieżką gestu na mapie: offerCityAttackChoice (gra/src/main.ts ~18789) → onSiege → startMapSiege (main.ts ~18605), która dopiero ustawia city.oblegane i oblegajacyOwnerId.
  (b) Hooki __civTest nie uruchamiają tej ścieżki: setWar (main.ts ~30348) tylko zmienia status relacji na 'wojna'; endTurn i addUnit nie tworzą oblężenia gracza.
  (c) Kliknięcie heksu wymaga współrzędnych ekranowych (hexCenterClientPx, main.ts ~16388); funkcja jest domknięciem i nie jest wystawiona na okno.
  (d) Lista machin oblężniczych dla gracza (siegeEngineOptions, main.ts ~18831-18834) bierze ownerId z oblegajacyOwnerId; hak __siegeBadgeTestDebug.setSiege nie ustawia tego pola, więc lista byłaby pusta z przyczyny testu, a nie gry.
  (e) Izolacja techu: dostępny jest tylko unlockAllTech (ustawia zbadane = wszystkie). Zgodnie z dispatchem: „przed” = świeża gra bez unlockAllTech, „po” = po unlockAllTech. Nie wykonano w tej rundzie.
  Wniosek: W18 pozostaje NIE_ZMIERZONO. Domknięcie wymaga haka „rozpocznij oblężenie miasta AI przez armię gracza” albo eksportu projekcji hex→ekran w civ-test-hooks.ts; obie zmiany dotykają gra/src, które jest poza zakresem tego tematu. Decyzja orkiestratora (zob. NASTĘPNY KROK).
  Dowód kodowy (nie live): siege-engine-build.ts — visibleSiegeEngineOptions/isSiegeEngineTechUnlocked filtrują machiny po unlockedTechs; siegeEngineBuildOption zwraca reason 'technology_locked'.

Zarzut 2 (punkt 3: „manual” = bs.skip(), manualBattle.ts nie uruchomiony): PRZYJMUJĘ w części.
  - Etykieta zmieniona: tryb 'skip' = bs.skip() (przycisk Pomiń, bez klikania). Dane r2 z etykietą „manual” nie są już używane jako dowód sterowania ręcznego.
  - Klik-po-klik (ManualBattle w manualBattle.ts ani rozkazy BattleScene) NIE został wykonany → NIE_ZMIERZONO.
  - Porównanie z auto-battle-power (szybka rozgrywka) NIE zostało wykonane → NIE_ZMIERZONO.
  - Porównanie wykonane: 'skip' vs 'auto' (BattleScene: _endDeployPhase + wyłączony tryb ręczny + 8×) przy trybie trafień 'pewne' (zgodnie z dispatchem: „tryb automatyczny przy Trafienia: pewne”).

Zarzut 3 (hitMode null, brak dowodu, że „pewne” działało): PRZYJMUJĘ.
  - Fakt: bs._hitMode nie istnieje w gra/src (grep pusty); getActiveHitMode (gra/src/game/hit-mode.ts) nie jest wystawiona na okno. Pole null w r2 to błąd odczytu, nie stan gry.
  - Dowód skutku (zamiast odczytu wartości): przebieg kontrolny K1 = ten sam seed 1, ten sam preset bitwa-duza, tryb 'losowe'. Wynik różni się od 'pewne' (B1): skip — obronca, runda 24 (B1: runda 17); auto — ZWYCIĘZCA ATAKUJĄCY, runda 21 (B1: obronca, runda 17). Przełącznik działa, a tryb 'pewne' w B1/B2/B3/B5/B6 jest zgodny z dispatchem.
  - Brak bezpośredniego odczytu wartości trybu z okna — to jawne ograniczenie.

Zarzut 4 (zakres stosunków sił zbyt wąski; presety maly/konnica/rzym_grecja nieużyte; brak odwrotnego stosunku): PRZYJMUJĘ lukę, NIE_ZMIERZONO dla tych przypadków.
  - Presety maly, duzy, konnica, rzym_grecja, oblezenie (testBattle.ts, PRESETS) są buildowane przez buildTestArmies dla harnessów testowych; scena w przeglądarce jest dostępna przez ?playtest=bitwa-duza|oblezenie-duze, a parametry URL ?rams/?chariots/?towers dodają tylko jednostki atakującego. Nie ma URL, który wybrałby któryś z tych presetów ani osłabił atakującego.
  - Odwrotny stosunek (przewaga obrońcy) wymaga zmiany gra/src (wybór presetu lub parametru obrońcy) → poza zakresem tematu. Zmierzony zakres: 1:1 do 1,82:1 (w jednym kierunku, wszystkie wyniki na korzyść atakującego w oblężeniu — nie na korzyść gracza „w obronie”).

Zarzut 5 (uwaga: „anomalia limitu 150” w rundzie 400): PRZYJMUJĘ — błąd w raporcie r2, cofam tezę o anomalii.
  - Dane r3 (pole wallBreached z bs.wallEverBreached): dla B3, B4, B5 i B6 wylom był (wallBreached=true, siegeWallCol=40). Dla tych bitew obowiązuje sufit FF_MAX_ROUNDS=400 (battleScene.ts ~1134), a sufit 150 (combat-params.json oblezenie.bez_wylomu_max_tur) dotyczy wyłącznie oblężenia BEZ wylomu (battleScene.ts ~9612-9622). Runda 400 przy żywych atakujących jest więc zgodna z kodem.
  - Sufitu 150 nie zmierzono (żadna bitwa r3 nie była bez wylomu) — NIE_ZMIERZONO, bez wniosku.

Zarzut 6 (punkt 2/W24 nie mierzony w r2): ODRZUCAM jako błąd zakresu. Dispatch r2 wprost wyłączył punkt 2 z pomiaru („punkt 2/W24 jest wykonany; defekt top −6 px @800×600 jest osobnym tematem W83 — nie ruszaj go”). Wynik r1 (PASS literalny: brak poziomego przewijania przy 1000×700, 800×600, 640×480) pozostaje bez zmian. Pionowy defekt (hud-chip-grid top −6 px przy 800×600) jest realnym defektem wizualnym do osobnego tematu — NIE naprawiany tu.

TESTY (surowe, z kolejnych wywołań skryptu):
- npm ci w gra/: „added 71 packages”, EXIT 0.
- vite build (3b36ee80c = src identyczny z 2135f73ad; zmiany kandydata to tylko narzędzia i dokumenty): EXIT 0, „built in 18.87s”, index.html 14 676 914 B; katalog poza repo (scratchpad).
- Pomiar r3 (w3r3.cjs), 14 przebiegów: LEFT 0; 0 błędów skryptu; 0 błędów strony (errors puste w każdym wpisie).

Tabela punkt 3 (dane surowe z evidence/w3-straty-zwyciezcy-r3.json; tryb 'pewne' chyba że zaznaczono):
| Config | Stosunek sił atak/obrona (start) | Ścieżka | Zwycięzca | Runda | Wylom | Straty atakującego (utr.) | HP atak. koniec/max | Straty obrońcy (utr.) | HP obr. koniec/max |
|---|---|---|---|---|---|---|---|---|---|
| B1 bitwa-duza s1 | 28/28 = 1:1 | skip | obrońca | 17 | nie | 28/28 | 0/988 | 9/28 | 497/1008 |
| B1 | 28/28 | auto | obrońca | 17 | nie | 28/28 | 0/988 | 9/28 | 497/1008 |
| B2 bitwa-duza s2 | 28/28 | skip | obrońca | 17 | nie | 28/28 | 0/988 | 9/28 | 497/1008 |
| B2 | 28/28 | auto | obrońca | 17 | nie | 28/28 | 0/988 | 9/28 | 497/1008 |
| B3 oblężenie bazowe s1 | 39/28 = 1,39:1 | skip | obrońca | 400 | tak | 28/39 | 2451/4188 | 12/28 | 671/1008 |
| B3 | 39/28 | auto | obrońca | 400 | tak | 28/39 | 2451/4188 | 12/28 | 671/1008 |
| B4 oblężenie +6 rydwanów s1 | 45/28 = 1,61:1 | skip | obrońca | 400 | tak | 33/45 | 2535/4860 | 13/28 | 626/1008 |
| B4 | 45/28 | auto | obrońca | 400 | tak | 33/45 | 2517/4860 | 13/28 | 626/1008 |
| B5 oblężenie +12 rydwanów s1 | 51/28 = 1,82:1 | skip | obrońca | 400 | tak | 30/51 | 3361/5532 | 10/28 | 701/1008 |
| B5 | 51/28 | auto | obrońca | 400 | tak | 30/51 | 3361/5532 | 10/28 | 701/1008 |
| B6 oblężenie +6 taranów s2 | 45/28 = 1,61:1 | skip | atakujący | 137 | tak | 26/45 | 5428/8388 | 28/28 | 0/1008 |
| B6 | 45/28 | auto | atakujący | 139 | tak | 27/45 | 5268/8388 | 28/28 | 0/1008 |
| K1 kontrola: bitwa-duza s1, tryb LOSOWE | 28/28 = 1:1 | skip | obrońca | 24 | nie | 28/28 | 0/988 | 20/28 | 263/1008 |
| K1 | 28/28 | auto | ATAKUJĄCY | 21 | nie | 11/28 | 410/988 | 28/28 | 0/1008 |

Anomalie danych (bez oceny balansu):
- Tryb 'pewne': B1 i B2 (ziarna 1 i 2) dają identyczny wynik co do jednostki i HP. Prawdopodobna przyczyna: w trybie 'pewne' trafienia nie losują (hit-mode.ts), a w tym presecie nie ma innych losowań wpływających na wynik. Nie potwierdzono w kodzie; to hipoteza.
- Skip vs auto w trybie 'pewne': identyczne w B1, B2, B3, B5; różne w B4 (HP atakującego 2535 vs 2517) i B6 (runda 137 vs 139; HP 5428 vs 5268). Roznica w oblężeniu z wyłomem jest znana (#202) i tu jest tylko zarejestrowana.
- Tryb 'losowe' (K1, ten sam seed): skip i auto dają PRZECIWNEGO zwycięzcę (obrońca r24 vs atakujący r21). Anomalia do rozstrzygnięcia przez orkiestratora: możliwa różna liczba losowań między ścieżkami. Nie oceniam balansu.
- Zwycięzca bez strat przy równych siłach: nie wystąpił (w B1/B2 zwycięzca obrońca stracił 9/28).

Dla zachowania spójności: tabela r2 w 10-operator-claude.md zawiera etykietę „manual” i tezę o anomalii 150 — obie cofnięte w tym raporcie; 10-operator-claude.md nie został zmieniony w tej rundzie.

BLOKADY:
- Punkt 1 (W18): brak hooka rozpoczynającego oblężenie gracza lub projekcji hex→ekran (gra/src poza zakresem tematu).
- Punkt 3: klik-po-klik (ManualBattle / rozkazy BattleScene) NIE wykonane; porównanie z auto-battle-power NIE wykonane; brak bezpośredniego odczytu trybu trafień z okna.
- Punkt 4 (zakres stosunków sił): presety maly/konnica/rzym_grecja niedostępne przez URL; odwrotny stosunek wymaga zmiany gra/src.
- Sufit 150 tur (bitwa bez wylomu): nie zmierzony.
- Punkt 2: wynik r1 bez zmian; defekt top −6 px @800×600 do osobnego tematu.

RUNDY: 3/5 (obrona po FC r2; Obrona = Haiku, bez eskalacji modelu).

NASTĘPNY KROK (decyzja orkiestratora):
  (a) Punkt 1: dodać hak testowy w gra/src (np. `__civTest.startSiege(cityId, ownerId)` wywołujący startMapSiege, oraz eksport hexCenterClientPx lub projekcji) — osobny temat z allowlistą gra/src; po nim pomiar przed/po techu (Taran) w trybie oblężenia.
  (b) Punkt 4: decyzja, czy dopuścić zmianę gra/src w celu wyboru presetu/obrońcy (odwrotny stosunek).
  (c) Anomalia K1 (skip vs auto w trybie 'losowe' dają przeciwnego zwycięzcę) — rozważyć osobny temat diagnostyczny.
  (d) Defekt W24 top −6 px @800×600 — osobny temat R-WEB-*.

UWAGI-DLA-ORKIESTRATORA:
- Brak zmian w gra/src. Tryb 'pewne' w r3 ustawiany hakiem __civSetHitMode (main.ts ~28120) PRZED startem walki; skutek potwierdzony kontrolą K1.
- Node_modules w gra/ i build w scratchpad: po zakończeniu usunięte (sprzątanie dysku).

DEPLOY/PUSH: NIE WYKONANO
