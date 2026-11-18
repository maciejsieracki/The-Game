STATUS: PASS-WITH-NOTES (obrona Operatora po ocenie Evaluatora; werdykt końcowy należy do FC)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-LEGACY-FIELDS-REMOVE-Q1
GOAL: usunąć martwe pola zegara zmęczenia wojną (zmeczenieT, bazaTur, maksTur, maksUdzial, bazaTurBrakDanych, wagaAgresja, warWearinessFraction/Share, WAR_WEARINESS_MAX_SHARE) bez zmiany zachowania gry.
SHA: kod Operatora 8e677191fb24d20008d19e594523145a38883710 (bez zmian w tej rundzie); ten raport jest commitem na wierzchu c6add57df (raport Evaluatora), baza a72c6b96850b92e1652359c8b81d25eb5d980d73.
ZMIANY-COMMIT: w tej rundzie zmieniono wyłącznie ten plik raportu (brak zmian w gra/). Kod = 8e677191f, zgodny z allowlistą (git diff --stat a72c6b968..8e677191f: 8 plików, 46+/71-).

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. Brak tabeli przed/po z osobnymi liczbami; SHA tylko w polu odpowiedzi. PRZYJMUJĘ. Tabela w sekcji TESTY, liczby przed (a72c6b968) i po (8e677191f) zmierzone ponownie w tej rundzie; SHA kodu jawnie w nagłówku tego pliku.
2. Mutacja kontrolna oznaczona NIE ZMIERZONO. PRZYJMUJĘ, wykonana w tej rundzie (wyniki w sekcji MUTACJE, pliki przywrócone przez git checkout do HEAD, git status czysty).
3. diplo-war-peace-sim-test zostaje zielony bez progSygnaluPokoju. PRZYJMUJĘ jako uwagę o pokryciu, bez zmiany kodu: pole chroni diplo-war-peace-profile-unit-test (mutacja: 123/1). Sim-test nie jest zmieniany, bo jego asercje behawioralne są nietknięte.

DOWÓD MARTWOŚCI (poprzednio: git grep na 8e677191f; potwierdzone przez Evaluatora):
- zmeczenie.maksUdzial/bazaTur/maksTur/bazaTurBrakDanych/wagaAgresja: jedyne odwołania w gra/src i gra/data to usunięte pola i testy (usunięte). progSygnaluPokoju ZOSTAJE (czytany przez aiPeaceSignals, profile.ts, sygnał (e)).
- zmeczenieT, warWearinessFraction/Share, WAR_WEARINESS_MAX_SHARE: brak wywołań w src poza usuniętym modułem profilu. Pozostałe wystąpienia: komentarz peace-lock.ts:123 (zmieniony na tekst bez pola), asercje nieobecności main-guard i weariness-20-turns (zostawione, zielone).
- war-weariness.ts: bez zmian (logika 20 tur nietknięta).

TABELA TESTÓW PRZED/PO (surowy wynik, ta runda):
| test | przed (a72c6b968) | po (8e677191f) |
| diplo-truce-impl-test | 94 PASS / 0 FAIL | 91 PASS / 0 FAIL (-3: asercje warWearinessFraction) |
| diplo-war-peace-profile-unit-test | 198 pass / 0 fail | 124 pass / 0 fail (-74: zmeczenieT i warWearinessShare/Fraction) |
| diplo-war-peace-sim-test | 25 pass / 0 fail | 25 pass / 0 fail (bez zmian) |
| diplo-war-peace-main-guard-test | 35 pass / 0 fail | 35 pass / 0 fail (bez zmian) |
| diplo-weariness-20-turns-test | PASS=31 FAIL=0 | PASS=31 FAIL=0 (bez zmian) |
| diplo-forced-peace-pending-live-paths-test | EXIT 1, SETUP FAIL page.goto ERR_FILE_NOT_FOUND (brak fixture) | nie powtórzony na kandydacie; identyczny błąd środowiskowy na bazie, dług bazowy |

Usunięte asercje (tabela): diplo-truce-impl-test: 3 asercje warWearinessFraction (martwa funkcja) + eksport. diplo-war-peace-profile-unit-test: 74 asercje zmeczenieT per cywilizacja i brak danych, blok R4/D4 warWearinessShare/Fraction (martwe pola). diplo-war-peace-sim-test: eksport nazw martwych funkcji. Asercje zachowania (sygnały a-e, clamp zakresów, hamulecN, minTurWojny) nietknięte.

BRAMKI (kandydat 8e677191f, surowe wyjście):
- tsc --noEmit: exit 0, brak błędów
- LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: ALL GREEN (33/33); unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21); combat-test: All sanity checks passed (6/6)
- diplo-forced-peace-pending-test PASS=40 FAIL=0; diplo-forced-peace-window-declutter-test PASS=16 FAIL=0; diplo-peace-tail-integration-test 42 pass / 0 fail; diplo-weariness-forced-peace-test PASS=14 FAIL=0; diplo-weariness-forced-peace-wiring-test 13 pass / 0 fail; diplo-treaties-ai-parity-test 80 pass / 0 fail
- git diff --check: wykonane przez Evaluatora (czysto); ta runda nie zmieniała kodu.
- Dług bazowy (nie regresja): json-descriptions-sync-test a1 (identyczny na a72c6b968, zgodnie z oceną Evaluatora).

MUTACJE KONTROLNE (ta runda, przywrócone przez git checkout):
- (a) usunięcie klucza zmeczenie.progSygnaluPokoju z diplomacy-war-peace-params.json (JSON parse OK) -> diplo-war-peace-profile-unit-test: 123 pass / 1 fail (CZERWONE, jak oczekiwano); diplo-war-peace-sim-test 25/0 (zielony, uwaga 3).
- (b) dopisanie referencji (0 as any).zmeczenieT na końcu gra/src/game/diplomacy.ts -> diplo-war-peace-main-guard-test: 34 pass / 1 fail (CZERWONE, jak oczekiwano).

BLOKADY: brak. Uwaga środowiskowa: gra/node_modules w worktree to symlink do install z wf_3c431a4a-db8-1 (zgodnie z regułą symlinku w .gitignore, bez npm ci; dysk ok. 4,2 GB wolne przed startem). W trakcie mutacji (a) skrypt zapisał kopię JSON w poza-repo ścieżce (cp do ../../../../../tmp/x); plik poza repo, nie usuwany (zakaz rm).
RUNDY: 2/5 (Operator r1: 8e677191f; Obrona r1 = ten raport)
NASTĘPNY KROK: Final Control (Sonnet) — weryfikacja raportu i mutacji, potem integracja orkiestratora.
UWAGI-DLA-ORKIESTRATORA: uwaga pokrycia z zarzutu 3 (sim-test nie chroni progSygnaluPokoju; chroni profile-unit) do rozważenia w przyszłym temacie, nie blokuje.
DEPLOY/PUSH: NIE WYKONANO
