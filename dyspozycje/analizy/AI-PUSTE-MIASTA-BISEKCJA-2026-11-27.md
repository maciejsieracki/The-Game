# AI: puste miasta w t60 — bisekcja po FALACH (R-WEB-AI-EMPTY-BISECT-Q1, tag AIEMPTY2)

Data: 2026-11-27. Baza: `bac0462be` (origin/main). Zmian w `gra/src` i `gra/data` NIE WPROWADZONO.
Dane: `dyspozycje/autobot/runs/R-WEB-AI-EMPTY-BISECT-Q1/dane/*.jsonl.gz`. Logi: `.../logi/`.
Narzędzia: `gra/tools/aiempty-analyze.cjs` (zestawienie), `gra/tools/aiempty-bisect-run-nns.cjs` (runner, patrz §2).

## 1. Definicja metryki

Bez zmian względem AIEMPTY: „puste miasto” = `owners[].miastaWojsko[].wojsko === 0`, właściciel ≠ 0 (gracz)
i ≠ −1. Obie metryki (FALA 857 i AIBAL2) dają identyczne liczby (potwierdzone w AIEMPTY).

## 2. Punkt zerowy i metoda

Rejestr (FALA 857) nie podaje ustawień pomiaru 167/193→16/188 w sposób odtwarzalny. Odtworzono metodę
najbliższą FALI 857 z jej własnego kodu: **start przez `__nnsMeasureDebug.startGame`** (ta funkcja istnieje
w FALI 857; w commicie 857 jest jedynym hakiem startu, bo `__settingsLive` pojawia się dopiero po FALI 874).
Ustawienia twardo wpisane w tym haku w każdym commicie (sprawdzone w źródle 857 i bac): **Trudność Normalny,
Koszty jednostek `niski`, Budowa `niski`**, dyplomacja i kultura na wartościach domyślnych gry.
Runner: `aiempty-bisect-run-nns.cjs` = kopia `aibal2-measure-run.cjs`, z dwiema zmianami: start przez
`__nnsMeasureDebug.startGame` oraz pominięcie `setUnitCostPace`, gdy hak nie istnieje (commity sprzed FALI 874).
Gra: headless Chrome (`/usr/bin/google-chrome`), 60 tur, realny `endTurn` gracza, ziarna 4242 i 7.
Każdy commit kodu zbudowany osobno (`git archive` → vite w katalogu roboczym poza repo, po buildzie usunięty).

**Punkt zerowy odtworzony w przybliżeniu:** FALA 857 → t60 **12/188 (6,4%)** (ziarno 4242) i **7/191 (3,7%)**
(ziarno 7). Rejestr podaje ~8% (16/188). Różnica wynika z harnessu/ziarna; kierunek i rząd wielkości się zgadzają.

## 3. Tabela: puste miasta AI, t60 (wynik z `aiempty-analyze.cjs`, surowe liczby)

Harness „NNS” = Normalny, koszt jednostek `niski` (jak haki FALI 857). Każdy punkt = 1 bieg.

| Commit | FALA | ziarno 4242 | ziarno 7 | uwagi |
|---|---|---|---|---|
| 60bc97b60 | 857 | 12/188 (6,4%) | 7/191 (3,7%) | punkt zerowy |
| 2be949df6 | 867 (merge) | — | 7/191 (3,7%) | jak 857 |
| b7a2923be | 868 (merge) | — | 7/191 (3,7%) | jak 857 |
| **d269541eb** | **R-WEB-ECONOMY-ERA-REBALANCE-ENABLE-Q1** | — | **39/181 (21,5%)** | **skok: +17,8 pkt** |
| 76aa74e81 | 874 | 23/183 (12,6%) | 39/181 (21,5%) | — |
| 141a2bc56 | 878 (merge) | 31/171 (18,1%) | 40/170 (23,5%) | — |
| dc2f0fed0 | 883 (merge) | 40/173 (23,1%) | 51/172 (29,7%) | +6 pkt od 878 (s7) |
| 13e869f51 | 887 | 40/173 (23,1%) | — | identyczny wynik z 883 (mnożnik „Koszty jednostek” nie działa przy `niski`) |
| bac0462be | main | 31/153 (20,3%) | — | NNS; poza tym C-max w AIEMPTY: 43/181 (23,8%) |

Liczby t30 (dla kontroli): 857 s7 35/89; 868 s7 35/89; d269 s7 35/68; 874 s7 35/68; 883 s7 23/53; 878 s7 26/53.
W t30 różnice są zbyt małe i zbyt zaszumione, by wskazywać FALĘ.

**Punkty NIE zmierzone:** 874 s4242 i d269 s4242 (jest tylko s7 dla d269); 879–882 pojedynczo (rozdział
878→883 nieprzeprowadzony); 884–926 i 890, 926 (nie mierzono — bisekcja zatrzymana po zlokalizowaniu skoku).

## 4. Zlokalizowany skok

Ciąg commitów dla ziarna 7: 868 (3,7%) → **d269541eb (21,5%)**. Między nimi jest jeden commit gra/src
(`b7a2923be..d269541eb`, lista `git log -- gra/src gra/data` pokazuje tylko d269541eb). Commit zmienia
`gra/data/econ-era-rebalance-params.json`:

- `eraRebalansAktywny`: `false` → **`true`** (rebalans ekonomii wg epok domyślnie WŁĄCZONY),
- `zywnoscWojskaSkalaNaEpoke`: 3 (żywność wojska ×3 na epokę: 4/12/36),
- `racjeObywateliMnoznikNaEpoke`: 2, `przychodyUlepszenStałeEpoka1`: true.

Opis w pliku: „decyzja właściciela 2026-11-19, ABC A: włączyć na ROBOCZEJ i zobaczyć w grze”.

Mechanizm (dane z rekordów tury, ziarno 7, t60, NNS): jednostki wojskowe AI **504 → 270 (−46%)**, miasta AI
191 → 181, skarbiec AI sumarycznie **41 228 → 25 624 (−38%)**. Armia spada, więc miasta zostają puste.
Potwierdzone liczbowo; że bezpośrednią przyczyną jest utrzymanie żywności wojska (×3/epokę), NIE ZMIERZONO
osobno (nie rozdzielono składników utrzymania).

## 5. Maksimum (reguła właściciela 2026-11-26)

W harnessie „NNS” nie da się ustawić maksimum. Dla trzech commitów zbudowano kopię roboczą (poza repo) z
podmienionym hakiem startu: Trudny, Koszty jednostek `wysoki`, dyplomacja `trudna`, kultura `trudny`
(`run-max.sh`; to jest poziom maksymalny w rozumieniu ustawień nowej gry). Ziarno 7, t60:

| Commit | puste/miasta t60 |
|---|---|
| 857 | 33/200 (16,5%) |
| 868 | 34/199 (17,1%) |
| d269541eb (rebalans ON) | 46/192 (24,0%) |

Na maksimum baza jest wyższa (16–17% zamiast 4%), a skok od rebalansu jest mniejszy (+7 pkt zamiast +18),
ale występuje. Skok w FALI 857→868 na maksimum nie występuje (33 → 34).
Hak __settingsLive (żywe ustawienia) nie istnieje przed FALĄ 874–d269, więc maksimum nie było mierzone
bez patcha; bac0462be na maksimum (runner z __settingsLive, s4242): 43/181 (23,8%).

## 6. Ocena: regresja czy zamierzone?

- **Źródło skoku (d269541eb):** zamierzone wobec decyzji właściciela (włączenie rebalansu „zobaczyć w grze”,
  2026-11-19). Skutek dla garnizonów AI (−46% jednostek wojskowych AI, puste miasta ×4 w default) **nie był
  zapisany jako cel decyzji**. NIE SPRAWDZONO, czy model PRZED/PO z FALI 15 (`dyspozycje/` rebalans) obejmował
  AI. To nie jest błąd kodu (kod robi to, co opisano w pliku), ale jest to skutek uboczny wobec celu graczy AI.
- **Drugi człon (883, UPKEEPMULT: żywność jednostek 4/16/64):** +6 pkt (s7, 878→883). Zamierzone wg rejestru
  (kurs 0,2, mnożniki żywności jednostek). Rozdział 879–882 NIE ZMIERZONO.
- **Wniosek:** NIEJEDNOZNACZNE, z przewagą „zamierzone wobec decyzji o rebalansie”. Decyzja o balansie
  (czy AI ma mieć mniej jednostek przy rebalansie, czy zwiększyć ich dochód) należy do właściciela — pytanie ABC
  po turnieju. Nie proponuję zmiany balansu (zakaz z dispatchu).

## 7. Ograniczenia

- Dwa ziarna, jeden bieg na punkt (ziarno 4242 tylko dla 857, 874, 878, 883, 887, bac; ziarno 7 dla 857, 867,
  868, 874, 878, 883, d269, mx-serii). Brak powtórzeń → wariancja między biegami nieznana. Różnice rzędu
  2–3 pkt traktować jako szum.
- Harness „NNS” ma twardo wpisane Normalny/koszt niski, więc tabela §3 NIE jest pomiarem maksimum (zasada
  testowania: maksimum = §5, tylko 3 punkty).
- Chromium padał w 3 biegach (`Target page ... closed` w t45, t57); powtórzono do skutku (≤2 powtórzenia na punkt).
- Rozbieżność z AIEMPTY: C-max bac s4242 wyszło 23,8% wobec 31,6% w AIBAL2 (ten sam kod src). NIE WYJAŚNIONO
  (inna wersja runnera / ziarno / losowość). Nie wpływa na wniosek, bo porównania są robione w ramach jednej metody.

## 8. Otwarte

- Decyzja właściciela (ABC): czy skutek rebalansu na garnizony AI jest akceptowalny; czy AI ma kompensację
  (np. pula utrzymania) — DO ZADANIA PO TURNIEJU, nie tu.
- Rozdział 878→883 (879–882) i 884–926 — NIE ZMIERZONO.
- PRZED/PO rebalans dla AI (model z FALI 15) — NIE SPRAWDZONO.
