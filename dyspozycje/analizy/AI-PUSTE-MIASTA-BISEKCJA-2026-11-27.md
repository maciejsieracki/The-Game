# AI: puste miasta w t60 — bisekcja po FALACH (R-WEB-AI-EMPTY-BISECT-Q1, tag AIEMPTY2)

Data: 2026-11-27. Baza: `bac0462be` (origin/main). Zmian w `gra/src` i `gra/data` NIE WPROWADZONO.
Dane: `dyspozycje/autobot/runs/R-WEB-AI-EMPTY-BISECT-Q1/dane/*.jsonl.gz`. Logi: `.../logi/`.
Narzędzia: `gra/tools/aiempty-analyze.cjs` (zestawienie), `gra/tools/aiempty-bisect-run-nns.cjs` (runner, patrz §2).
Wersja po obronie r1 (zarzuty Evaluatora 1–6). Zmiany względem r0 są oznaczone **[r1]**.

## 1. Definicja metryki

Bez zmian względem AIEMPTY: „puste miasto” = `owners[].miastaWojsko[].wojsko === 0`, właściciel ≠ 0 (gracz)
i ≠ −1. Liczba = puste / miasta AI w turze 60 (`aiempty-analyze.cjs`, jedna metryka).

## 2. Ustawienia i metoda — poprawione [r1]

**Domyślna gra = Normalny (koszt jednostek = Normalny ×2).** Potwierdzone w kodzie kreatora: `kosztJednostekPace: 'normalny'`
w `gra/src/ui/newGameFlow.ts` (domyślne ustawienia zaawansowane; linia 275 w 857, 282 w 883, 296 w 887, 312 w bac).
Pole `kosztJednostekPace` w `playerState.ts:151` ma wartość startową `'niski'`, ale nowa gra zawsze przechodzi przez kreator.

**Co robił runner r0 (poprawka, zarzut 1 i 6a):** `aiempty-bisect-run-nns.cjs` wołał `setUnitCostPace(PACE)` tylko wtedy,
gdy hak istnieje, a gdy go nie było, zwracał `PACE` bez ustawiania (linia 562). Domyślne `--pace` = `normalny`.
Skutek: w buildach sprzed FALI 874 (857, 868, d269, 874, 883, 887, których hak startu ma na stałe `kosztJednostekPace: 'niski'`)
tempo było **niski**, mimo że runner deklarował `normalny`; bac0462be (ma setter) był mierzony przy **normalny**.
Wiersz „main” z r0 (31/153) był więc poprawnym pomiarem przy Normalny, ale wiersze 857–887 były przy niski — tabela r0 mieszała metody.
[r1] Runner: brak setera jest zgłaszany w logu linią `[pace] UWAGA ...` (nie jest cicho ignorowany). Pomiary r1 podają tempo jawnie.

**Punkt zerowy (zarzut 4) [r1]:** Rejestr podaje 167/193 → 16/188 dla FALI 857. Źródło w dyspozycjach to
`R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1/30-obrona-claude.md` (r4), czysty świeży start na commicie **`28bace9bb`** (ziarno 4242,
bez instrumentacji), a nie na `60bc97b60` (commit FALI 857 użyty w r0). `28bace9bb` jest przodkiem `60bc97b60` (43 commity wcześniej).
W tamtym biegu nie zapisano tempa; przy świeżym starcie kreatora domyślnie byłby to Normalny, ale to NIE ZWERYFIKOWANE.
Odtworzenie na `60bc97b60`: niski s4242 = 12/188 (6,4%), niski s7 = 7/191 (3,7%), normalny s7 = 22/192 (11,5%).
Normalny s4242 na `60bc97b60` NIE ZMIERZONO. Kryterium „857 ≈ 8%” jest spełnione tylko luźno.

**Metoda r1:** Builds z `git archive` poza repo (`vite build`, `node_modules` ze wspólnej kopii), headless Chrome, 60 tur,
realny `endTurn`, `--every 10`. Dla buildów bez setera tempo ustawiono patchem HAKA STARTU w kopii roboczej poza repo
(zamiana `kosztJednostekPace: 'niski'` → `'normalny'` w bloku `__nnsMeasureDebug`; 1 miejsce w każdym buildzie, potwierdzone skryptem).
Patch dotyczy wyłącznie `normalny`; commity w repo nie zmieniono. Oznaczenie: **[setter]** = `setUnitCostPace` w buildzie,
**[patch-normalny]** = hak zmieniony na normalny, **[hak-niski]** = bez zmian (niski).

Chrome padał w kilku biegach (`Target page ... closed`, SIGSEGV): powtórzono ze startu (≤3 próby). Powtórka udanego biegu
bac normalny s4242 dała wynik identyczny (31/153, dwa biegi); pozostałe biegi nie były powtarzane.

## 3. Tabela: puste miasta AI, t60 (surowe liczby z `aiempty-analyze.cjs`) [r1]

Każdy punkt = 1 bieg. Kolumny: tempo kosztu jednostek w grze; sposób ustawienia.

**A. Tempo Normalny (domyślna gra):**

| Commit | FALA | ziarno 4242 | ziarno 7 | tempo / sposób |
|---|---|---|---|---|
| 60bc97b60 | 857 | — (NIE ZMIERZONO) | 22/192 (11,5%) | normalny [patch-normalny] |
| dc2f0fed0 | 883 | 32/172 (18,6%) | 55/174 (31,6%) | normalny [patch-normalny] |
| 13e869f51 | 887 | 38/136 (27,9%) | 65/150 (43,3%) | normalny [patch-normalny] |
| bac0462be | main | 31/153 (20,3%) (dwa biegi, identyczne) | 64/169 (37,9%) | normalny [setter] |

**B. Tempo Niski (ta sama metoda co punkt zerowy):**

| Commit | FALA | ziarno 4242 | ziarno 7 | tempo / sposób |
|---|---|---|---|---|
| 60bc97b60 | 857 | 12/188 (6,4%) | 7/191 (3,7%) | niski [hak-niski] |
| 2be949df6 | 867 (merge) | — | 7/191 (3,7%) | niski [hak-niski], z r0 |
| b7a2923be | 868 (merge) | — | 7/191 (3,7%) | niski [hak-niski], z r0 |
| d269541eb | rebalans epok ON | 23/183 (12,6%) [r1 nowe] | 39/181 (21,5%) | niski [hak-niski] |
| 76aa74e81 | 874 | 23/183 (12,6%) | 39/181 (21,5%) | niski [hak-niski], z r0 |
| 141a2bc56 | 878 (merge) | 31/171 (18,1%) | 40/170 (23,5%) | niski [hak-niski], z r0 |
| dc2f0fed0 | 883 | 40/173 (23,1%) | 51/172 (29,7%) | niski [hak-niski], z r0 |
| 13e869f51 | 887 | 40/173 (23,1%) | — | niski [hak-niski], z r0 (= 883) |
| bac0462be | main | 45/160 (28,1%) [r1 nowe] | 47/167 (28,1%) [r1 nowe] | niski [setter] |

**C. Maksimum (zasada testowania, pkt 3 Evaluatora):** z r0 tylko trzy punkty, ziarno 7, patch kopii roboczej
(Trudny, Koszty `wysoki`, dyplomacja `trudna`, kultura `trudny`): 857 33/200 (16,5%); 868 34/199 (17,1%);
d269541eb 46/192 (24,0%); bac0462be na __settingsLive s4242 43/181 (23,8%, z AIEMPTY). **NIE ZMIERZONO [r1]:** maksimum dla
874, 883, 887 i main; maksimum dla s4242 w d269 i 857. Kierunek z trzech punktów (skok 857→d269 na s7) jest w danych,
ale wielkość nie jest pewna (jeden bieg na punkt).

**Maksimum — wyjaśnienie poziomu:** „najwyższy poziom” w tej tabeli = Trudny, Koszty jednostek `wysoki` (×4), dyplomacja `trudna`,
kultura `trudny`, zgodnie z zasadą właściciela. Tabele A i B mierzą tylko poziom Normalny i Niski, nie maksimum.

Punkty t30 (kontrola): 857 niski s7 35/89; d269 niski s7 35/68; main niski s4242 17/62 (27,4%); main normalny s4242 24/66 (36,4%);
main normalny s7 36/79 (45,6%); 887n s7 26/45 (57,8%); 883n s7 30/55 (54,5%). W t30 różnice są zaszumione.

## 4. Lokalizacja skoku — wnioski z danych [r1]

**Przy tempie niski** (metoda zerowa): skok w **d269541eb** (rebalans epok ON, `eraRebalansAktywny` false→true):
s7 3,7% → 21,5% (+17,8 pkt, ten sam bieg). Na s4242 skok 857→d269 to 6,4% → 12,6% (+6,2 pkt).
Mechanizm (ziarno 7, z r0, rekordy tury): jednostki wojskowe AI 504 → 270 (−46%), skarbiec AI 41 228 → 25 624 (−38%).
Ten sam commit na s4242 zmierzony w r1 (23/183) — identyczny z 874 s4242, więc 874 i d269 nie różnią się na s4242.

**Przy tempie Normalny (domyślna gra):** pomiary są tylko dla 857, 883, 887 i main (brak d269 i 868/874/878 przy normalny).
- 857 → 883 (s7): 11,5% → 31,6% (+20,1 pkt). Nie rozdzielono, który commit w tym przedziale (868, 874, d269, 878) to daje.
- 883 → 887 (s7): 31,6% → 43,3% (+11,7 pkt); (s4242): 18,6% → 27,9% (+9,3 pkt). Spójny kierunek na dwóch ziarnach.
- Mechanizm 887 (z dispatchu i diffu): „Koszty jednostek” mnoży także utrzymanie jednostek (Pieniądz, surowce, żywność).
  Przy niski mnożnik = ×1 i 883 = 887 (identyczne na s4242). Przy Normalny ×2 wzrost kosztu utrzymania AI.
- 887 → main (s7): 43,3% → 37,9% (−5,4 pkt); (s4242): 27,9% → 20,3% (−7,6 pkt). Późniejsze FALE (m.in. 890: darmowe utrzymanie AI
  t1–40) obniżają wynik w domyślnej grze; NIE ZMIERZONO osobno.

## 5. Wynik „25% vs 20,3%” (zarzut 2) [r1]

Dokument AIEMPTY podał dla tego samego kodu i ziarna 4242 wynik 39/155 (25%); r0 zmierzył 31/153 (20,3%).
**Wyjaśnienie [r1]:** powtórka biegu w r1 dała ten sam wynik (31/153, deterministycznie). Różnica nie wynika więc z losowości
harnessu r1. Źródło 39/155 (inny runner AIEMPTY / inne ustawienia startu) NIE SPRAWDZONO. Traktować 20,3% jako wynik tego harnessu.

## 6. Ocena: regresja czy zamierzone? [r1]

- **Źródło skoku przy niski (d269541eb):** zamierzone wobec decyzji właściciela (ABC A, 2026-11-19: włączyć rebalans epok na ROBOCZEJ).
  Skutek dla garnizonów AI (−46% jednostek; puste miasta 3,7% → 21,5% na s7) NIE był zapisany jako cel tej decyzji — skutek uboczny.
  Kod robi to, co opisano w pliku danych. Nie jest to błąd implementacji.
- **Źródło skoku przy Normalny (FALA 887, UPKEEPPACE):** mnożnik „Koszty jednostek” na utrzymaniu był częścią zamierzonej zmiany
  (#50 w kolejce). Wzrost pustych miast AI (+9…+12 pkt) jest skutkiem tego mnożnika na garnizony AI. Czy AI ma taki koszt
  utrzymania — decyzja właściciela.
- **Wniosek:** NIEJEDNOZNACZNE, z przewagą „zamierzone mechanicznie, skutek uboczny dla AI”. Nie ma dowodu na błąd kodu.
  Nie proponuję zmiany balansu (zakaz z dispatchu). Decyzja = pytanie ABC właściciela po turnieju.

## 7. Ograniczenia [r1]

- Dwa ziarna (4242, 7), jeden bieg na punkt, poza powtórką bac normalny s4242 (identyczna). Wariancja między ziarnami
  (np. 857 niski s4242 vs s7) jest rzędu kilku punktów procentowych; różnice <5 pkt traktować jako szum.
- Maksimum: tylko trzy punkty z r0 (§3C), bez powtórek. Nie ma maksimum dla 874–main.
- 857 normalny na s4242 i 868/874/878/d269 na normalny: NIE ZMIERZONO.
- `ecoRebalance` w rekordach = `null` dla wszystkich biegów, bo runner był wywołany bez `--rebalance` (flaga nie była ustawiana
  przez harness). Stan rebalansu potwierdza wyłącznie diff `gra/data/econ-era-rebalance-params.json` (d269541eb: `eraRebalansAktywny` → true).
- Składników utrzymania (jedzenie vs pieniądz vs surowce) nie rozdzielono: mechanizm jest hipotezą.
- Chrome: kilka biegów padło (t45–t59), powtórzono ze startu.

## 8. Otwarte

- Decyzja właściciela (ABC po turnieju): czy koszt utrzymania jednostek AI przy Normalny ×2 (FALA 887) jest akceptowalny; czy AI ma kompensację.
- Rozdział 857→883 przy normalny (868, 874, d269, 878) — NIE ZMIERZONO.
- Maksimum dla 874–main — NIE ZMIERZONO.
- Źródło 39/155 (AIEMPTY, 25%) — NIE SPRAWDZONO.
- Zero punkt 16/188 (`28bace9bb`): tempo nieznane — NIE ZWERYFIKOWANO.
