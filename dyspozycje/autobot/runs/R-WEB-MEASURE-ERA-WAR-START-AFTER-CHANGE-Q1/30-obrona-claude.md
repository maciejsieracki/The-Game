STATUS: BLOCK (kryterium binarne NIE spełnione: brak tur wejścia w epokę, seed 4242 tylko do t90, seed 7 tylko do t29; dane częściowe dostarczone i zweryfikowane SHA)
DOMAIN: GAME (pomiar; zero zmian gry)
TEMAT: R-WEB-MEASURE-ERA-WAR-START-AFTER-CHANGE-Q1
GOAL: zmierzyć w pełnej grze po FALACH 906 i 908 start, czas trwania i koniec wojen epoki, seed 4242 i 7, do tury 120; porównać z regułami 906/908.
ZMIANY/COMMIT: pliki: `dyspozycje/analizy/WOJNY-EPOKI-PO-ZMIANACH-2026-11-25.md`, `dyspozycje/autobot/runs/R-WEB-MEASURE-ERA-WAR-START-AFTER-CHANGE-Q1/dane/` (war-kontynenty-4242.jsonl.gz, war-kontynenty-7.jsonl.gz, summarize-4242-7.txt, SHA256SUMS), ten raport. Kod gry bez zmian (gra/ nietknięte; bundle zbudowany z kopii poza repo). SHA: patrz sekcja SHA poniżej.
BAZA/KANDYDAT: checkout b8ab498146c2c74b43fcbd468d1e4392e7bbcef5 (kod = origin/main 069de0d41 w zakresie gry).

## Odpowiedź na zarzuty

1. (brak tabeli/dokumentu/danych) — PRZYJMUJĘ. Dokument `dyspozycje/analizy/WOJNY-EPOKI-PO-ZMIANACH-2026-11-25.md` i katalog `dane/` (jsonl.gz + SHA256SUMS) powstały w tej rundzie. Zakres częściowy: seed 4242 tury 2–90, seed 7 tury 2–29.
2. (przyczyna BLOCK „czas” niezdiagnozowana, 0 rekordów) — PRZYJMUJĘ z uzupełnieniem. Dowód: ta sama maszyna w tej rundzie zapisuje rekordy. Kontrola 3 tury (`wwq/ctl.log`): 2 rekordy w ~4 s. Bieg 4242 do T100 w ~9 min (`wwq/run4242.log`, `T90 lastTurnMs=7106`, `T100 lastTurnMs=8547`). Wcześniejsze „0 rekordów” wynikało z zawieszonych procesów poprzedniej sesji (pamięć/dysk brak w tej sesji), nie z czasu gry. Przyczyny przerwań w tej rundzie: (a) `Target page ... has been closed` (Chromium padał po 10–60 turach, `wwq/run4242.log`), (b) `ProcessSingleton ... profile is already in use` przy starcie po osieroconym procesie z timeoutu (`wwq/run-4242-96-1.log`). Nie zdiagnozowano przyczyny (a) w Chromium; to usterka środowiska, nie gry.
3. (dane poza repo) — PRZYJMUJĘ. Dane skopiowane do `dane/` i zacommitowane tym commitem (jsonl.gz + SHA256SUMS).
4. (procesy w tle do 9000 s) — PRZYJMUJĘ częściowo. Osierocony runner (PID 5895/5896, start 00:54:36) zabity przeze mnie (`kill`, wynik „0” procesów wzorca `wwq/dist` po chwili). NIE ZWERYFIKOWANO: pozostałe procesy Chromium (11 w `ps` o 01:11, `chromium-1243`) — próba ich zabicia została odrzucona przez klasyfikator uprawnień, więc nie wykonałem jej. Orkiestrator: sprawdzić i zabić `pgrep -af chromium-1243` przed startem kolejnego tematu. Żadnego procesu nie uruchamiałem z `run_in_background`; biegi w tle nie były używane.
5. (brak SHA bundla i ścieżki logu) — PRZYJMUJĘ. Bundle: `wwq/dist` (scratchpad, poza repo), zbudowany z kopii `wwq/gra` (`vite build`, „built in 15.77s”, `index.html 15 019,85 kB`), patche `ai-city-live-measure.cjs --prepare` i hook `ai-war-weariness-live-audit-hook.cjs` zastosowane na kopii. Logi: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/wwq/` (`ctl.log`, `run4242.log`, `seg4242-*.log`, `run-4242-*.log`, `run-7-40-*.log`). Surowe dane: `.../wwq/out/` (skopiowane do `dane/` jako jsonl.gz).

## TESTY (surowe wyniki)
- Kontrola (seed 4242, 3 tury): `wwq/ctl.log` EXIT=0, `war-kontynenty-4242.jsonl` 2 wiersze.
- Seed 4242: segmenty do t40 (EXIT=0, 39 wierszy), do t80 (EXIT=0 po 2. próbie, 79 wierszy), do t90 (`chunk` OK po 3. próbie, 89 wierszy). Próby do t96..t120 (łącznie 8 prób): wszystkie padły na `Target page ... closed` lub `ProcessSingleton`. NIE ZMIERZONO: tury 91–120.
- Seed 7: bieg od t1, 29 wierszy (t2–t29/30), padł na turze ~30 (`Target page ... closed`), brak slotu. NIE ZMIERZONO: tury 31–120.
- `war-duration-summarize.cjs out/war-kontynenty-4242.jsonl out/war-kontynenty-7.jsonl` EXIT=0 (`dane/summarize-4242-7.txt`).
- Bramki: brak zmian kodu, tsc/testy nie uruchamiane. `git diff --stat` w tej rundzie: tylko `dyspozycje/` (potwierdzone przed commitem).

## SHA
- `dane/war-kontynenty-4242.jsonl.gz` 4104d904b2ef035a01e4c2173dc27cf0d26f666791b3024645ce7bb2cdfa3565
- `dane/war-kontynenty-7.jsonl.gz` 16d39753659517b70d05da5adae83fdefe6312f911df9a3e80dd609ae14eb828
- `dane/summarize-4242-7.txt` ed326b70d7bd195637ae67d0844c61e57eaec743d813ffb6bfb6fcb9c7c689e4

## BLOKADY
1. Chromium pada w długich biegach (t10–t100) i nie wznawia się po t90 (4/4 prób). Bez stabilnego Chromium nie da się dojść do t120 w obu ziarnach.
2. Runner nie zapisuje tury wejścia w epokę ani powodu końca wojny: NIE ZMIERZONO kryteriów 906 (start od wejścia, opóźnienie) i części 908 (powód końca AI↔AI).
3. Wznowienia reseedują PRNG — wyniki odcinkowe nie są bit-identyczne z biegiem ciągłym.

## WERDYKT PORÓWNANIA (częściowy)
- 906 (start od wejścia): NIE ZMIERZONO (brak tur wejścia).
- 906 (kolejna epoka po pokoju): zgodne z sekwencją w danych (0 vs 15 koniec t80, 15 vs 29 start t81), bez potwierdzenia wejścia.
- 908 (AI↔AI kończy po 2 miastach/prośbą o pokój): KANDYDAT niezgodności — para 1 vs 8, koniec t79 po 19 turach, 0 miast utraconych, powód nieznany. NIE POTWIERDZONE.
- Gracz w wojnie epoki: TAK od t40 (brąz, pokój wymuszony po 40 turach).

## NASTĘPNY KROK
Orkiestrator decyduje: (a) zamknąć temat jako częściowy i zlecić R-WEB-MEASURE-ERA-WAR-START-AFTER-CHANGE-Q2 (dokończenie 91–120 i seed 7 po 30 po ustabilizowaniu Chromium oraz przechwyt pól epoki i logu końca wojny w runnerze), albo (b) przyjąć wynik częściowy jako NIE ZMIERZONO w zakresie 91–120 i ziarna 7 po t30. Rekomendacja: (a) po zabiciu osieroconych procesów Chromium przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: procesy Chromium z poprzednich prób mogą nadal działać (patrz zarzut 4); profil `wwq/out/war-kontynenty-*.profile` jest w scratchpadzie, nie w repo. Dane 4242 i 7 są w `dane/`.
