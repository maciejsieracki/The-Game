STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-WAREHOUSE-STATE-CAP-20PCT-Q1
GOAL: Każdy Magazyn zwiększa pojemność magazynu państwa o 20% BAZY (zamiast stałego +500). cap(typ) = magazyn_baza_surowce × (1 + 0,2 × N) × mnożnik epoki. Addytywnie między Magazynami. Mnożnik epoki bez zmian.
ZMIANY/COMMIT: b29f5bc1d (kod + testy + econ-params + opis Magazynu). Allowlista zachowana: gra/src/game/economy-upkeep.ts, gra/src/game/empire-food.ts (komentarz), gra/src/ui/empireDetailTypes.ts (komentarz), gra/data/econ-params.json (tylko klucze magazynu), gra/data/buildings.json (tylko opis Magazynu), gra/tools/magazyn-era-scaling-test.cjs, gra/tools/surow-civ-storage-test.cjs, NOWY gra/tools/warehouse-state-cap-20pct-test.cjs, dyspozycje/autobot/runs/R-WEB-WAREHOUSE-STATE-CAP-20PCT-Q1/**. Nie dotknięto gra-robocza, WERSJE.md, rust-port, src-tauri, battle. turn-economy.ts, main.ts i empireDetailPanel.ts bez zmian kodu (czytają ten sam interfejs; UI liczy magazyny z (cap-baza)/bonus, co nadal działa).

Zmiana techniczna:
- OwnerStorageParams: pole bonusSurowceNaBudynek zastąpione bonusProcNaBudynek (0,2).
- ownerResourceCapacityPerType = Math.round(baza × (1 + proc × N) × mnożnik). Sygnatura bez zmian, więc konsumenci (turn-economy, empire-food) działają bez edycji.
- ownerStorageParamsForEra zwraca rozbicie UI (OwnerStorageBreakdown): capBonusPerMagazyn = baza × proc × mnożnik. Suma baza + bonus × N == cap (sprawdzone).
- econ-params.json: magazyn_bonus_surowce_na_budynek (500) usunięty, dodany magazyn_bonus_surowce_proc_na_budynek = 0,2 (easy/normal/hard).
- Stare zapisy: bez migracji, cap liczy się z liczby Magazynów.

POMIAR PRZED / PO (realne econ-params, wszystkie trudności identyczne):
- N=0: epoka1 50 000 / 50 000; epoka2 100 000 / 100 000; epoka3 200 000 / 200 000 (bez zmian)
- N=1: epoka1 50 500 → 60 000; epoka2 101 000 → 120 000; epoka3 202 000 → 240 000
- N=3: epoka1 51 500 → 80 000; epoka2 103 000 → 160 000; epoka3 206 000 → 320 000
- Rozbicie UI era1: baza 50 000 + bonus 500 → baza 50 000 + bonus 10 000 (sumuje się do capu).

TESTY:
- tsc --noEmit: EXIT=0 (po zmianach; baseline tsc EXIT=0).
- warehouse-state-cap-20pct-test (NOWY): 56 passed, 0 failed. Mutacja: proc=500 zamiast 0,2 → 27 FAIL (test wykrywa stare +500). Plik econ-params przywrócony i ponownie zielony.
- magazyn-era-scaling-test: 58/0 przed i po (asercje zaktualizowane do +20%, z uzasadnieniem w komentarzach).
- surow-civ-storage-test: 63/4 przed → 64/4 po. Te 4 FAIL to pre-existing main.ts (anchor pętli wyrębu), nie związane z tematem. Zaktualizowano pinowane wartości 50500/51000/52500 → 60000/70000/80000/100000 oraz pola fixture.
- Bez regresji (ten sam wynik przed/po): mennica-magazyn 34/7, hex-plony-magazyn 10/4, resource-usage-breakdown 98/2, ai-test 274/20, hud-skarbiec 34/0, upkeep 73/0, empire-food-b5 OK, spichlerz-* OK, popcap-spichlerz2 OK, granary2-tech-data-guard OK.
- citizen-resource-upkeep-test 107/2 i unit-resource-upkeep-test 3/4: uruchomione po zmianie, NIE mierzone przed (brak baseline). FAIL dotyczą kotwic main.ts i kosztów jednostek (Wojownik/Włócznik), nie kodu capu; diff nie dotyka tych ścieżek. Oznaczam jako NIE_ZMIERZONO_BASELINE.
- Logi: gate-*.txt (po zmianie) i gate-base-*.txt (przed) z linią EXIT= w tym katalogu.

BLOKADY / OTWARTE NOTATKI (bez pytań ABC, rozstrzygnięte założeniem):
1. Założenie: Żywność centralna (magazyn_centralny_bonus_zywnosc_na_budynek = 100 na Magazyn) BEZ zmian, zgodnie z dispatchem. Właściciel może chcieć tego samego +20% także dla żywności; wymaga osobnego tematu.
2. Rozbicie UI pokazuje wartości bezwzględne („10000 × N”), nie „20%”. Kwota jest poprawna, ale tooltip nie wymienia procentu. Dodanie „+20%” do tooltipa wymaga zmiany empireDetailPanel.ts poza minimalnym zakresem; pominięte.
3. Komentarze w main.ts (~3680) nadal wspominają stare liczby „10000 + 100×Magazyny” (tylko tekst, bez wpływu na kod). Nie zmieniano.
4. Nie wykonano pomiaru w przeglądarce (zmiana czysto ekonomiczna, bez wizualnej nowości poza liczbami w panelu).

PROPOZYCJA „DOM HANDLOWY” (z prośby właściciela, do akceptacji, NIEZAIMPLEMENTOWANE):
- Budynek następca Targowiska, wymaga Targu w mieście (zastępuje go albo dokłada się do niego; decyzja właściciela).
- Efekt: +5% wielkości handlu (kumuluje się z Targiem, łącznie +10%) oraz +1 linia wymiany, tak jak Targowisko.
- Koszt budowy i utrzymanie wyższe niż Targ; epoka wejścia późniejsza.
- Otwarte pytania dla właściciela: czy ma zastąpić Targ, czy go dopełniać; limit na miasto (proponowany 1).

NASTĘPNY KROK: Evaluator (weryfikacja diff b29f5bc1d względem allowlisty i testów), potem Final Control. Integracja i push wyłącznie przez orkiestratora.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
