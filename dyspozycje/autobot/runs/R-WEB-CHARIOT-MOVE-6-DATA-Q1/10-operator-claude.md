STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CHARIOT-MOVE-6-DATA-Q1
GOAL: w bitwie „Ruch w bitwie (heksy)” wpis „Konnica” = 7 (zmiana z 6); „Rydwan (woły)” = 5 bez zmian; pozostałe rydwany = 6 bez zmian; pole „Ruch” (mapa) bez zmian.
BAZA: b77a0b7b940081f9b6da13f2b7cd9028bdf44394 (origin/main), worktree wf_d2f6f86e-073-1, detached.

ZMIANY/COMMIT:
- gra/data/units.json: jedna linia (610), wpis „Konnica”, pole „Ruch w bitwie (heksy)”: 6 -> 7. Pole „Ruch” (4) nietknięte.
- gra/tools/chariot-move-6-data-test.cjs (nowy): sprawdza kryteria 1–3 (Konnica bitwa=7; Rydwan (woły)=5; wszystkie pozostałe „Rydwan*”=6; snapshot pola „Ruch” dla 75 jednostek z origin/main b77a0b7b9). Czerwieni się przy zmianie wartości.
- SHA: patrz sekcja „SHA commita” poniżej.

TESTY:
- node tools/chariot-move-6-data-test.cjs -> passed=163 failed=0, exit 0 (uruchomione z katalogu gra/).
- Kontrola stanu wyjściowego (przed zmianą, odczyt z units.json): Rydwan (woły)=5, Konnica=6, pozostałe rydwany: Rydwan konny, egipski, sumeryjski, mykeński, Shang, celtycki, Kapadokijski = 6. Zgodne z dispatchem.
- git diff --check: czysto.
- tsc --noEmit: NIE_ZMIERZONO w sensie projektowym. W worktree brak gra/node_modules (brak zainstalowanych zależności; nie instalowałem, zgodnie z zasadą izolacji). Globalny tsc 6.0.2 (/opt/node22/bin/tsc) zwraca błąd konfiguracji tsconfig.json(15,5) TS5101 (baseUrl deprecated), zanim sprawdzi kod. Zmiana dotyczy wyłącznie danych JSON; nie wpływa na typy TS.
- bramki referencyjne (npm run build/dev): ZAKAZANE dispatchem; nie uruchamiane.

BLOKADY:
- Dispatch w repo: plik 00-dispatch.md istnieje TYLKO na gałęzi origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (nie w origin/main). Plik 00-dispatch-DODATEK-claude.md NIE istnieje na żadnej z pobranych gałęzi. Wykonano wg 00-dispatch.md z zadania workflow (GOAL/allowlista/kryteria są tam zgodne z opisem tematu). Luka rozstrzygnięta założeniem: dodatek orkiestratora nieobecny, przyjęto zakres z 00-dispatch.md i zadania.
- Dispatch podaje bazę aeb52465e845d29acb5f7b628370789af399d673; zadanie wskazuje b77a0b7b9. Sprawdzono: aeb52465 jest przodkiem b77a0b7b9 (merge-base OK). Pracę wykonano na b77a0b7b9 zgodnie z zadaniem. Stan danych w obu bazach dla wartości objętych zmianą jest identyczny (Konnica=6, rydwany jak wyżej) — NIE_ZMIERZONO dla aeb52465 osobno, założono brak różnic w tych polach.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja diffu allowlisty: tylko units.json pole Konnica + nowy test; test czerwony przy 6; decyzja o tsc po zainstalowaniu zależności projektu).
DEPLOY/PUSH: NIE WYKONANO
