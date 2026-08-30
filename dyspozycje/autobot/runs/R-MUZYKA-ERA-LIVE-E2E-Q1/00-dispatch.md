TEMAT:  R-MUZYKA-ERA-LIVE-E2E-Q1
RUNDA:  1/5
DATA:   2026-08-30
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high / Final Control Sonnet 5 effort=high (osobne wywołanie Workflow)

## WYZWALACZ
Final Control retroaktywnego audytu `P-AUDYT-RETRO-MUZYKA-BRAZ-KROK10-Q1`:
- Zarzut #1 (werdykt NAPRAW): twierdzenie orkiestratora, że "istniejący live-test
  Playwright potwierdza przejście Kamień↔Brąz", było prawdziwe wyłącznie dla
  warstwy toast/karta technologii (`era-change-toast-live-test.cjs`) — NIGDY dla
  warstwy audio (stan `<audio>`/aktywnej playlisty). Dodatkowo sandbox
  `?playtest=mapa` (`doStartPlaytestMapaSwiata`, main.ts ~31833) hardkoduje
  `player.era = 2` od startu, więc naturalna ścieżka wywołania `setEra()` od
  Kamienia jest w tym sandboksie no-opem — obecne narzędzia NIE POZWALAJĄ
  odtworzyć realnego przejścia w przeglądarce bez nowego haka testowego.
- Zarzut #2 (werdykt DO_DECYZJI_CZŁOWIEKA, właściciel: dopisać): test
  jednostkowy `muzyka-braz-era-playlist-test.cjs`, scenariusz C, testuje
  WYŁĄCZNIE kierunek kamień(1)→brąz(2) dla gałęzi playlista-plikowa→INNA-
  playlista-plikowa; brakuje lustrzanego kierunku brąz(2)→kamień(1) dla tej
  samej gałęzi kodu.

## GOAL
Dwie niezależne, ale tematycznie spójne poprawki pokrycia testowego —
**zero zmian w logice audio** (`filePlayer.ts`, `muzyka-antyczna.ts` poza
dodaniem debug-hooka nie mają się zmienić funkcjonalnie):

**(a) Nowy hak testowy w `gra/src/main.ts`** — analogiczny wzorcem i
uzasadnieniem do istniejącego `__eraTestDebug` (main.ts ~20006) — pozwalający
Playwright: (1) wystartować grę w erze 1 (Kamień) z playlistą plikową grającą,
(2) wywołać REALNY `setEra(2)` (ścieżka silnika, nie reimplementacja), (3)
odczytać faktyczny stan aktywnej playlisty/`<audio>` (który plik/playlist
gra, czy poprzedni został zatrzymany), (4) to samo w drugą stronę
`setEra(1)`. Nazwij hak spójnie z konwencją (`__musicEraTestDebug` albo
rozszerzenie istniejącego `__eraTestDebug` o metody muzyczne — wybierz to,
co mniej narusza istniejący kod). Hak wyłącznie odczytuje stan i wywołuje
istniejące funkcje — nie zmienia logiki `setEra`/`activeFilePlaylist`.

**(b) Nowy Playwright test** (`gra/tools/muzyka-era-live-e2e-test.cjs` albo
podobna nazwa w tym samym katalogu) — używa haka z (a), w PRAWDZIWEJ,
zbudowanej grze (headless Chromium), sprawdza obie strony przejścia:
Kamień→Brąz i Brąz→Kamień, asercje na faktycznym stanie audio (nie tylko że
funkcja zwróciła oczekiwaną wartość w izolacji — to już robi test jednostkowy
z R-MUZYKA-BRAZ-23-UTWORY-Q1).

**(c) Rozszerzenie `gra/tools/muzyka-braz-era-playlist-test.cjs`** — dopisz
lustrzany scenariusz C' (`eraStart:2, setEraArg:1`, oba `kamienHasTracks`/
`brazHasTracks` true) dla tej samej gałęzi plik→plik co istniejący scenariusz
C, ale w kierunku brąz→kamień. Zero zmian w scenariuszach A/B/D/E/F/G.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Nowy hak testowy w `main.ts` istnieje, jest wołany WYŁĄCZNIE z Playwright
   (komentarz analogiczny do istniejących haków wyjaśnia to), i NIE zmienia
   zachowania gry dla zwykłego gracza (diff poza dodaniem nowego bloku —
   zero edycji istniejącej logiki `setEra`/`activeFilePlaylist`/`usesFilePlayer`).
2. Nowy test Playwright uruchamia REALNY `setEra()` w obu kierunkach
   (Kamień→Brąz I Brąz→Kamień) w żywej, zbudowanej grze i czyta faktyczny stan
   audio (nie tylko wartość zwracaną przez funkcję w izolacji) — wklejony
   realny wynik uruchomienia w tej sesji, nie z pamięci/raportu.
3. Test dowodzi mutation-testingiem (jak w P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1),
   że NIE jest tautologiczny: po ręcznej, tymczasowej mutacji źródła (np.
   `setEra` przestaje wołać `.stop()` na poprzedniej playliście) test
   faktycznie czerwienieje, po czym mutacja jest cofnięta i test wraca do
   zielonego — wklejony dowód obu przebiegów.
4. `muzyka-braz-era-playlist-test.cjs` ma nowy scenariusz C' (brąz→kamień) i
   nadal przechodzi w całości (26 istniejących + nowe asercje C').
5. Wszystkie 5 bramek referencyjnych zielone (logic-test 213/213,
   tech-tree-test 19/19, research-test 33/33, unit-replace-test 13/13,
   combat-test 6/6) + `node ./node_modules/typescript/bin/tsc --noEmit` bez
   błędów.
6. Zero zmian poza allowlistą; `git diff --check` czysty.

## ALLOWLISTA — nic poza tym
- `gra/src/main.ts` — WYŁĄCZNIE nowy blok haka testowego (dodanie, nie edycja
  istniejących funkcji poza ew. jednym punktem podpięcia inicjalizacji, tym
  samym wzorcem co `__eraTestDebug`/`__sidePanelLinkTestDebug`).
- `gra/tools/muzyka-era-live-e2e-test.cjs` (lub analogiczna nazwa) — NOWY plik.
- `gra/tools/muzyka-braz-era-playlist-test.cjs` — WYŁĄCZNIE dodanie scenariusza C'.
Zakazane bezwzględnie: `gra/src/audio/filePlayer.ts`, `gra/src/audio/muzyka-
antyczna.ts` (żadnych zmian logiki — tylko odczyt przez hak w main.ts),
`gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-MUZYKA-ERA-LIVE-E2E-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium końca 2 za spełnione na podstawie SAMEGO faktu, że
nowy test "przechodzi" — musi czytać REALNY stan silnika (np. który obiekt
playlisty ma aktywne odtwarzanie, nie tylko że `setEra()` nie rzuciło
wyjątku). Zakaz uznania testu za wystarczający dowód bez mutation-testingu
(kryterium 3) — dokładnie ten tryb samooszukiwania (test zielony, ale nic nie
sprawdza) był przedmiotem Zarzutu #1 tego audytu źródłowego. Zakaz
reimplementowania `setEra`/`activeFilePlaylist` wewnątrz haka testowego —
hak ma wywoływać PRAWDZIWE funkcje silnika, nie ich kopię.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 na TYM SAMYM
ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
jeśli Playwright test wymaga zbudowanej gry). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona, tylko
gdy zarzuty niepuste, ta sama runda) → Final Control (osobne wywołanie
Workflow) → orkiestrator integruje allowlist-only i cutuje kolejną FALA
ROBOCZA po PASS/PASS-WITH-NOTES.
