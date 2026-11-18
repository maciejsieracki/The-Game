STATUS: PASS-WITH-NOTES (ocena Evaluatora; werdykt końcowy należy do FC)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-LEGACY-FIELDS-REMOVE-Q1
GOAL: usunąć martwe pola zegara zmęczenia wojną bez zmiany zachowania gry.
ZMIANY-COMMIT: oceniony kandydat 8e677191fb24d20008d19e594523145a38883710 (rodzic = baza a72c6b968). Allowlista (git diff --name-only): params.json, diplomacy-war-peace-profile.ts, diplomacy-peace-lock.ts (komentarz), diplomacy.ts (komentarz), diplo-truce-impl-test, diplo-war-peace-profile-unit-test, diplo-war-peace-sim-test (eksport), 10-operator-claude.md. Wszystko w allowliście; brak plików spoza niej. ZMIERZONO.

DOWÓD MARTWOŚCI (własny git grep na kandydacie, całe repo): zmeczenieT, warWearinessFraction/Share, WAR_WEARINESS_MAX_SHARE, maksUdzial, bazaTurBrakDanych występują już tylko w komentarzach (peace-lock.ts:123, _wzor w JSON), w asercjach nieobecności (main-guard l.97, weariness-20-turns l.100-116) oraz w dokumentach historycznych/artefakcie gra-robocza. Jedyny czytelnik zmeczenie.* w profilu = progSygnaluPokoju (profile.ts:283) — zostaje. Inne czytelniki "zmeczenie" (war-weariness*.ts, diplomacy-display.ts) czytają war-weariness-params.json, nie ten plik. ZMIERZONO.

TESTY (kandydat, surowe wyjście, ZMIERZONO):
- tsc --noEmit: puste wyjście (0 błędów)
- logic-test 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6
- truce-impl 91/0 (baza 94/0; -3 = usunięte asercje warWearinessFraction); profile-unit 124/0 (baza 198/0; -74 = 3+15+7+45+4, wszystkie dotyczą zmeczenieT/warWearinessShare/Fraction); war-peace-sim 25/0 (baza 25/0); main-guard 35/0; weariness-20-turns 31/0; weariness-forced-peace 14/0; forced-peace-pending 40/0; peace-tail-integration 42/0; wiki-weariness-rate-consistency 18/0; civpedia-values 129 OK.
- json-descriptions-sync-test 18/1: FAIL a1 (war-weariness-params.json vs f196422ef) — IDENTYCZNY na bazie a72c6b968 = dług bazowy, nie regresja.
- git diff --check baza..kandydat: czysto.
- Mutacja kontrolna (WYKONANA przeze mnie, przywrócono pliki): (a) usunięcie zmeczenie.progSygnaluPokoju z JSON -> profile-unit 123/1 (czerwone); (b) wstawienie `.zmeczenieT` do diplomacy.ts -> main-guard 34/1 (czerwone). Wykonane w kopii roboczej, przywrócone z kopii; git status czysty.
- NIE ZMIERZONO: diplo-forced-peace-pending-live-paths-test (wymaga fixture przeglądarkowego; deklaracja Operatora o długu bazowym niezweryfikowana), treaty-parity i forced-peace-wiring niepowtórzone przeze mnie.

ZARZUTY (wszystkie drobne, żaden nie blokuje):
1. Raport Operatora nie zawiera tabeli "przed/po" z osobnymi liczbami przed (pisze "przed = po"), a SHA commita wskazuje tylko odsyłaczem do pola odpowiedzi, nie w pliku (kontrakt wymaga jawnego SHA). Liczby przed dla truce/profile/sim zweryfikowałem sam (94/198/25) — zgodne.
2. Raport Operatora podaje mutację kontrolną jako NIE ZMIERZONO, choć dispatch ją wymagał; luka uzupełniona przeze mnie (powyżej).
3. diplo-war-peace-sim-test pozostaje zielony (25/0) po usunięciu progSygnaluPokoju z JSON (porównanie z undefined = false) — test sim nie chroni tego pola; chroni je profile-unit. Uwaga, nie wada tematu.
Brak zarzutów dot. osłabienia testów: usunięte asercje dotyczą wyłącznie usuniętych pól; asercje zachowania (sygnały a-e, clamp zakresów dla 15 cywilizacji, hamulecN, minTurWojny) nietknięte; inwariant D4 (pełne zmęczenie w limicie) pokrywa weariness-20-turns-test (31/0).

BLOKADY: brak
RUNDY: 1/5 (Evaluator)
NASTĘPNY KROK: Obrona -> Final Control
UWAGI-DLA-ORKIESTRATORA: dług bazowy json-descriptions-sync-test a1; node_modules w gra/ worktree wf_3c431a4a-db8-2 (do sprzątnięcia).
DEPLOY/PUSH: NIE WYKONANO
