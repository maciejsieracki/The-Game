# R-WEB-AI-EMPTY-BISECT-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; zero zmian gra/src, gra/data)
TEMAT: R-WEB-AI-EMPTY-BISECT-Q1 (tag AIEMPTY2)
GOAL: znaleźć FALĘ, od której puste miasta AI w t60 rosną z ~8% do 25–36%, albo ustalić, że to inne ustawienia.
ZMIANY/COMMIT: allowlista: `gra/tools/aiempty-bisect-run-nns.cjs` (nowy runner, kopia aibal2 z hakiem startu FALI 857), `dyspozycje/analizy/AI-PUSTE-MIASTA-BISEKCJA-2026-11-27.md` (analiza), `dyspozycje/autobot/runs/R-WEB-AI-EMPTY-BISECT-Q1/**` (dane `.jsonl.gz`, logi, skrypty, ten raport). Kod gry nietknięty. SHA: patrz commit na gałęzi roboczej (czubek = commit z tym raportem).
BAZA: bac0462be (origin/main).

## Wynik

Źródło skoku: **commit d269541eb** „R-WEB-ECONOMY-ERA-REBALANCE-ENABLE-Q1” (rebalans ekonomii wg epok domyślnie WŁĄCZONY, `eraRebalansAktywny` false→true, `zywnoscWojskaSkalaNaEpoke` 3). Sąsiedni commit b7a2923be (FALA 868) = 3,7% (ziarno 7); d269541eb = 21,5% (ziarno 7). Drugi człon: FALA 883 (UPKEEPMULT, żywność jednostek 4/16/64): 878 → 883 = +6 pkt (ziarno 7).

Ocena: zamierzone wobec decyzji właściciela (ABC A, 2026-11-19: „włączyć na ROBOCZEJ i zobaczyć w grze”); skutek dla garnizonów AI nieprzewidziany w decyzji. NIE ROZSTRZYGAM balansu. Decyzja = pytanie ABC po turnieju.

## Tabela (t60, puste/miasta AI; harness FALI 857: Normalny, koszt niski)

| Commit | FALA | ziarno 4242 | ziarno 7 |
|---|---|---|---|
| 60bc97b60 | 857 | 12/188 (6,4%) | 7/191 (3,7%) |
| 2be949df6 | 867 | — | 7/191 (3,7%) |
| b7a2923be | 868 | — | 7/191 (3,7%) |
| d269541eb | rebalans ON | — | 39/181 (21,5%) |
| 76aa74e81 | 874 | 23/183 (12,6%) | 39/181 (21,5%) |
| 141a2bc56 | 878 | 31/171 (18,1%) | 40/170 (23,5%) |
| dc2f0fed0 | 883 | 40/173 (23,1%) | 51/172 (29,7%) |
| 13e869f51 | 887 | 40/173 (23,1%) | — |
| bac0462be | main | 31/153 (20,3%) | — |

Maksimum (Trudny, koszt wysoki, dyplomacja trudna, kultura trudny; hak startu załatany w kopii roboczej poza repo), ziarno 7: 857 33/200 (16,5%); 868 34/199 (17,1%); d269 46/192 (24,0%).

## Punkt zerowy

Odtworzony w przybliżeniu: FALA 857 t60 = 6,4% (4242) i 3,7% (7); rejestr podaje ~8% (16/188). Metoda: hak `__nnsMeasureDebug.startGame` (jedyny hak startu w 857; `__settingsLive` pojawia się po FALI 874). Ustawienia wpisane w hak: Normalny, koszt `niski`.

## Sprawdzenia

- `aiempty-analyze.cjs` na każdym biegu (surowe liczby z konsoli `aiempty-analyze`, pliki w `dane/`).
- Build: `git archive` commita → vite poza repo, po buildzie katalog usunięty; `npm ci --ignore-scripts` raz w katalogu poza repo.
- Brak `gra/src` w diffie allowlisty (`git diff --stat` tylko w allowliście).

## Blokady i ograniczenia (NIE ZMIERZONO tam, gdzie nie zmierzono)

- Maksimum NIE zmierzono w bisekcji (hak startu w commitach sprzed 874 nie przyjmuje ustawień); maksimum tylko dla 857/868/d269 (ziarno 7) przez patch kopii roboczej.
- Punkty 874 s4242 i d269 s4242 nie zmierzone; 879–882 nie rozdzielone; 884–926, 890, 926 nie zmierzone.
- Jeden bieg na punkt, dwa ziarna. Różnice poniżej ~3 pkt traktować jako szum.
- Chromium padał w 3 biegach (`Target page … closed`); powtórzono (≤2 razy na punkt).
- Rozbieżność z AIEMPTY (C-max s4242: 23,8% tu wobec 31,6% w AIBAL2) — NIE WYJAŚNIONO.
- Nie sprawdzono, czy model PRZED/PO rebalansu (FALA 15) obejmował garnizony AI.
- Nie rozdzielono składników utrzymania (żywność wojska ×3/epokę vs inne) — mechanizm to hipoteza wspierana liczbami (AI jednostki wojskowe t60: 504 → 270; skarbiec AI: 41 228 → 25 624; ziarno 7, harness Normalny/niski).

## RUNDY

1/5 (jedna runda, PASS-WITH-NOTES; brak FAIL)

## NASTĘPNY KROK

Orkiestrator: (a) decyzja ABC po turnieju — czy skutek rebalansu na garnizony AI (puste miasta ~4% → ~21%, s7) jest akceptowalny lub wymaga kompensacji; (b) ewentualnie powtórzyć d269 i 874 na ziarnie 4242 oraz rozdzielić 878→883 (879–882) — osobny temat pomiarowy; (c) ewentualnie bisekcja 890/926 nie była potrzebna do lokalizacji skoku.

## DEPLOY/PUSH: NIE WYKONANO
