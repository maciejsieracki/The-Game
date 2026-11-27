# R-WEB-AI-EMPTY-BISECT-Q1 — obrona Operatora (Claude, Haiku, runda 1/5, po raporcie Evaluatora 2b66917c)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; zero zmian gra/src, gra/data)
TEMAT: R-WEB-AI-EMPTY-BISECT-Q1 (tag AIEMPTY2)
GOAL: znaleźć FALĘ, od której puste miasta AI w t60 rosną w DOMYŚLNEJ grze (Normalny), albo ustalić, że różnica wynika z innych ustawień pomiaru 857.
ZMIANY/COMMIT: poprawki w `dyspozycje/analizy/AI-PUSTE-MIASTA-BISEKCJA-2026-11-27.md`, `gra/tools/aiempty-bisect-run-nns.cjs` (jawny komunikat przy buildzie bez setera), nowe dane i logi w `dane/` i `logi/` (10 biegów). Baza kodu gry bez zmian (`git diff gra/src gra/data` = 0).

## Odpowiedź na zarzuty Evaluatora

1. **PRZYJMUJĘ — poprawione pomiarem.** Wiersz bac0462be zmierzono ponownie przy niski (s4242: 45/160 = 28,1%; s7: 47/167 = 28,1%) — `logi/nns-bac0462-niski-*`, readback `kosztJednostekPace: niski`, rekordy `unitCostPace: niski` (59/59). Wiersz normalny bac (31/153, 20,3%) jest też w danych (`nns-bac0462-normalny-*`). Tabela w dokumencie rozdzielona na A (Normalny) i B (Niski). Runner: brak setera jest logowany (`[pace] UWAGA ...`), a nie cicho pomijany.

2. **PRZYJMUJĘ — częściowo poprawione.** Dodano pomiary przy Normalny dla 857 (s7: 22/192 = 11,5%), 883 (s4242: 32/172 = 18,6%; s7: 55/174 = 31,6%), 887 (s4242: 38/136 = 27,9%; s7: 65/150 = 43,3%) i main (s4242: 31/153; s7: 64/169 = 37,9%). Nie zmierzono d269, 868, 874, 878 przy Normalny ani 857 na s4242.
   - Wpływ FALI 887 przy Normalny: +11,7 pkt (s7) i +9,3 pkt (s4242) względem 883 — spójny kierunek na dwóch ziarnach. Przy niski 883 = 887 (identyczne na s4242), zgodnie z mechanizmem (mnożnik działa przy Normalny i wyżej).
   - „20,3% vs 25%”: powtórka biegu bac normalny s4242 daje ten sam wynik (31/153, dwa biegi). Źródło 39/155 z AIEMPTY nie sprawdzone — zapisane jako NIE SPRAWDZONO.

3. **PRZYJMUJĘ — nie poprawiono.** Maksimum dla 874, 883, 887 i main nie zmierzono (czas i limit biegów; każdy bieg ~6 min). Dokument oznacza to jako NIE ZMIERZONO. Maksimum dla 857, 868 i d269 (ziarno 7) z r0 pozostaje jedynym pomiarem maksimum; jest jednopunktowe.

4. **PRZYJMUJĘ — źródło znalezione, punkt zerowy nadal niezgodny.** Rejestr 167/193 → 16/188 pochodzi z `R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1/30-obrona-claude.md` (r4), czysty świeży start na commicie `28bace9bb` (ziarno 4242), a nie na `60bc97b60` użytym w r0. Tempo tamtego biegu nie zostało zapisane. Odtworzenie na 60bc97b60: niski s4242 = 12/188 (6,4%), niski s7 = 7/191 (3,7%), normalny s7 = 22/192 (11,5%). Kryterium „857 ≈ 8%” spełnione tylko luźno.

5. **PRZYJMUJĘ — uzupełnione.** d269541eb przy niski na s4242: 23/183 (12,6%), identyczne z 874 na s4242 (23/183). Skok 857 → d269 na s4242 wynosi +6,2 pkt, na s7 +17,8 pkt. Wariancja między ziarnami nieznana (jeden bieg na punkt) — zapisane w §7 dokumentu.

6. **a) PRZYJMUJĘ — poprawione:** opis runnera w §2 dokumentu przepisany; readback `null` przed FALĄ 874 wyjaśniony, a tempo potwierdzone przez pole `unitCostPace` w rekordach (59/59 rekordów zgodnych z zadanym tempem w każdym nowym biegu).
   **b) PRZYJMUJĘ — bez zmiany danych:** `ecoRebalance` = null, bo runner był wywołany bez `--rebalance` (flaga nie była ustawiana). Stan rebalansu potwierdza tylko diff `gra/data/econ-era-rebalance-params.json`; tak jest napisane w dokumencie.
   **c) PRZYJMUJĘ — bez zmiany:** składników utrzymania nie rozdzielono; mechanizm pozostaje hipotezą (oznaczenie w dokumencie).

## Co zmierzono w tej rundzie (surowe liczby, t60)

| Build | Tempo | s4242 | s7 |
|---|---|---|---|
| 60bc97b60 (857) | niski | 12/188 (6,4%) | 7/191 (3,7%) |
| 60bc97b60 (857) | normalny | — | 22/192 (11,5%) |
| d269541eb | niski | 23/183 (12,6%) | 39/181 (21,5%, r0) |
| dc2f0fed0 (883) | normalny | 32/172 (18,6%) | 55/174 (31,6%) |
| 13e869f51 (887) | normalny | 38/136 (27,9%) | 65/150 (43,3%) |
| bac0462be (main) | niski | 45/160 (28,1%) | 47/167 (28,1%) |
| bac0462be (main) | normalny | 31/153 (20,3%) | 64/169 (37,9%) |

Metoda: `git archive` poza repo, `vite build` do katalogów poza repo, headless Chrome, 60 tur, `--every 10`. Dla buildów bez setera tempo ustawiono patchem haka startu w kopii roboczej (1 miejsce w bloku `__nnsMeasureDebug`, potwierdzone liczbą podmian); commity w repo nie zmieniono.

Chrome padał (SIGSEGV / `Target page closed`) w kilku biegach: powtórzono ze startu (łącznie 3 próby dla bac normalny s4242; wynik identyczny). Przy biegach bac niski s7 pierwsza próba padła w t59 i została powtórzona w całości.

## Wniosek (wspólny z dokumentem)

- Przy niski (metoda punktu zerowego): skok w d269541eb (rebalans epok ON): s7 3,7% → 21,5%; s4242 6,4% → 12,6%. Zamierzone wobec decyzji właściciela (ABC A, 2026-11-19), skutek uboczny dla garnizonów AI.
- Przy Normalny (domyślna gra): 883 → 887 daje +9…+12 pkt pustych miast AI (mnożnik „Koszty jednostek” na utrzymaniu). Zamierzone mechanicznie (#50), skutek dla AI nieoczekiwany — decyzja właściciela.
- Wniosek: NIEJEDNOZNACZNE, z przewagą „zamierzone, skutek uboczny”. Brak dowodu błędu kodu. Bez zmiany balansu. Pytanie ABC po turnieju.

## Otwarte (NIE ZMIERZONO)

- Maksimum dla 874–main; rozdział 857→883 przy Normalny (868, 874, d269, 878).
- Źródło 39/155 (AIEMPTY) — NIE SPRAWDZONO.
- Tempo biegu punktu zerowego `28bace9bb` — NIE ZWERYFIKOWANO.

## RUNDY

2/5 (Operator obrona, po r1 Evaluatora). Pierwsza runda pomiarowa: 1/5 (Operator 10-operator-claude.md).

## NASTĘPNY KROK

Evaluator (sonnet/haiku wg bieżącej polityki) → Final Control; decyzja o balansie = pytanie ABC właściciela po turnieju.

## DEPLOY/PUSH: NIE WYKONANO
