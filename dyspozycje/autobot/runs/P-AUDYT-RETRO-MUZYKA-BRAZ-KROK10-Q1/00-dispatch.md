TEMAT:  P-AUDYT-RETRO-MUZYKA-BRAZ-KROK10-Q1
RUNDA:  1/5
DATA:   2026-08-30
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c) — WARIANT AUDYTOWY
MODEL + EFFORT per rola: Evaluator Sonnet 5 effort=high / Final Control Sonnet 5 effort=high (osobne wywołanie Workflow)

## WYZWALACZ
Luka procesowa wykryta przez orkiestratora: dwa tematy z REALNĄ zmianą kodu
(`R-MUZYKA-BRAZ-23-UTWORY-Q1`, `R-DYPLO-CENNIK-KROK10-Q1`) zostały zaimplementowane
bezpośrednio przez orkiestratora, BEZ dispatchu osobnego Operatora przez Workflow —
łamiąc standing instruction z tej sesji („do każdego tematu odpal oddzielnego
operatora AutoBot Workflows"). Oba są już zmergowane do `main` i wdrożone (FALA 327,
328). Właściciel, po ujawnieniu luki: „Odpal retroaktywny audyt Evaluator+Final
Control dla obu (Rekomendacja)".

## GOAL
**To jest AUDYT, nie implementacja.** Praca już istnieje na `main` — nie ma
Operatora do dispatchowania, nie ma Obrony w pierwszym przebiegu. Evaluator
adwersaryjnie sprawdza DWA już-zmergowane commity, tak jakby właśnie dostał raport
Operatora do oceny, i wydaje ponumerowane zarzuty (§3c) — lista może być pusta.
Jeśli zarzuty się pojawią, Final Control orzeka per zarzut; każdy zarzut z
werdyktem NAPRAW wymaga NOWEGO, osobnego tematu naprawczego (nie naprawiaj w tym
audycie — to złamałoby zasadę „audyt = zero zmian w mechanice", wzorem
`P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`).

**Commit A — `R-MUZYKA-BRAZ-23-UTWORY-Q1`** (`64356b59`, main): nowy `brazPlaylist`
w `gra/src/audio/filePlayer.ts`, nowa gałąź w `setEra()` (`gra/src/audio/muzyka-
antyczna.ts`) obsługująca przejście playlista-plikowa→INNA-playlista-plikowa
(kamień↔brąz), nowy test `gra/tools/muzyka-braz-era-playlist-test.cjs`.
Sprawdź w szczególności:
- Czy realnie działa przejście kamień→brąz→kamień (nie tylko kamień→brąz)?
- Czy `setMusicVolume`/`stopMusic` faktycznie obsługują obie playlisty poprawnie
  we WSZYSTKICH kombinacjach stanu (grająca/niegrająca, era 1/2)?
- Czy nowy test `muzyka-braz-era-playlist-test.cjs` faktycznie wykonuje realny kod
  (extractFn ze źródła + new Function), czy to zamaskowany regex/atrapa?
- Czy 23 pliki mp3 w `gra/src/audio/utwory/braz/` są prawidłowymi plikami audio
  (nie tylko poprawną nazwą) — zweryfikuj magic bytes na PRÓBIE plików, nie ufaj
  raportowi.
- Czy poprawka nazwy pliku `The_Smiths_Measure.mp3` (dawniej `The_Smith` po błędzie
  unrar) rzeczywiście odpowiada zawartości z archiwum — jeśli masz dostęp do
  oryginalnego wyniku `unrar lb`, zweryfikuj niezależnie.

**Commit B — `R-DYPLO-CENNIK-KROK10-Q1`** (`dd9fe018`, main): krok handlu w
`gra/src/game/diplomacy-value-catalog.ts` (`HANDEL_SUROWCE_KROK5`→
`HANDEL_SUROWCE_KROK10`), `cena_*` w `gra/data/econ-params.json` NUMERYCZNIE bez
zmian, 9 plików testowych zaktualizowanych. Sprawdź w szczególności:
- Czy WSZYSCY wywołujący `diplomacyHandelSurowiecKrok()` (UI koszyka, generatory
  ofert AI, silnik PN) faktycznie widzą nowy krok=10 — grep całego repo pod kątem
  ewentualnego zahardkodowanego "5" gdzie indziej powiązanego z tym samym
  mechanizmem, którego orkiestrator mógł nie zauważyć.
- Czy arytmetyka we WSZYSTKICH 9 zaktualizowanych testach jest faktycznie
  poprawna (floor-do-bloku, nie tylko "test przechodzi") — przelicz niezależnie
  co najmniej 5 losowo wybranych asercji.
- Czy udokumentowany efekt uboczny (fallback `|| krok` w chip-switch handlerze,
  `diplomacyTradeBasket.ts`) jest poprawnie opisany i czy nie ma INNYCH,
  nieudokumentowanych miejsc z tym samym wzorcem `|| krok`/`|| 5`, które mogły
  ulec cichej zmianie zachowania.
- Czy usunięty scenariusz testowy (kotwica `seedQty` skolidowała z krokiem=10,
  `diplomacy-pn-engine.ts`) rzeczywiście jest strukturalnie niemożliwy do
  odtworzenia, czy orkiestrator zbyt szybko uznał to za niemożliwe zamiast
  poszukać alternatywnego sposobu pokrycia.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Evaluator wszedł w REALNY kod obu commitów na `main` (nie w opis z rejestru) i
   uruchomił WSZYSTKIE testy wymienione wyżej + 5 bramek referencyjnych + `tsc
   --noEmit` samodzielnie, z wklejonym realnym wynikiem (nie zaufaniem raportowi).
2. Dla commitu A: co najmniej jedna REALNA weryfikacja w przeglądarce (headless
   Chromium) niezależna od istniejącego testu — np. realne odtworzenie sekwencji
   startMusic→setEra(2)→setEra(1) i sprawdzenie że playlist faktycznie się
   przełącza (nie tylko że funkcja zwraca oczekiwaną wartość w izolacji).
3. Dla commitu B: co najmniej 5 niezależnie przeliczonych asercji z listy testów
   (patrz GOAL) z wklejoną arytmetyką krok po kroku.
4. Lista zarzutów Evaluatora — pusta ALBO ponumerowana, każdy z dokładnym
   miejscem (plik+linia) i uzasadnieniem.
5. Final Control orzeka per zarzut (NAPRAW/ODDAL/DO DECYZJI CZŁOWIEKA) — agregat
   zapisany jawnie. Jeśli agregat = FAIL (choć jeden NAPRAW), Final Control
   PROPONUJE treść nowego tematu naprawczego (ID, GOAL, allowlista) zamiast
   naprawiać na miejscu.
6. Zero zmian w `gra/src`, `gra/data`, `gra/tools` — to audyt, dowód w diffie
   (`git diff origin/main..HEAD --stat` musi być pusty poza plikami raportu, jeśli
   jakiekolwiek powstały).

## ALLOWLISTA — nic poza tym
ŻADNYCH zmian w `gra/src`, `gra/data`, `gra/tools`, `gra-robocza/`. Dozwolony
wyłącznie odczyt (Read/Grep/Bash bez modyfikacji) i uruchamianie istniejących
testów/bramek. Jeśli Evaluator uzna, że potrzebuje NAPISAĆ nowy test weryfikacyjny
do audytu (np. dodatkowy real-browser check) — dozwolone WYŁĄCZNIE jako plik
tymczasowy poza repo (np. `/tmp/`), NIE commitować do `gra/tools/`.
Zakazane bezwzględnie: jakakolwiek zmiana w `gra/src/**`, `gra/data/**`,
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-AUDYT-RETRO-MUZYKA-BRAZ-KROK10-Q1`, baza JAWNIE
`origin/main` (już zawiera oba audytowane commity). Sparse-checkout bez
`gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania audytu za kompletny na podstawie SAMEGO wpisu w
`REJESTR-PROSB-I-ZADAN.md` lub `WERSJE.md` — to są twierdzenia orkiestratora o
własnej pracy, dokładnie ten rodzaj źródła, który ten audyt ma zweryfikować
niezależnie. Zakaz uznania „testy zielone" za wystarczający dowód bez realnego
uruchomienia ich SAMEMU w tej sesji audytu (§13a — zielona bramka nie jest
dowodem zachowania w rozgrywce/poprawności kodu, jeśli nikt jej nie uruchomił
niezależnie).

## PROCEDURA NAPRAWCZA PRZY FAIL
To jest audyt — „FAIL" oznacza tu realny, potwierdzony defekt w już-zmergowanym
kodzie, nie niespełnienie kryterium implementacji. Final Control w takim wypadku
proponuje treść NOWEGO tematu naprawczego (osobne ID) zamiast żądać rundy N+1 tego
audytu. Runda N+1 tego SAMEGO audytu ma sens wyłącznie, jeśli Evaluator/Final
Control nie zdążyli sprawdzić wszystkiego (np. TIMEOUT) — nie przy znalezionym
defekcie.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck wyłącznie
`tsc --noEmit`). Zakaz `git add -A`.

## OBIEG
Evaluator (audyt, zarzuty mogą być puste) → Final Control (werdykt per zarzut,
osobne wywołanie Workflow) → orkiestrator zamyka audyt ALBO otwiera nowy temat
naprawczy per zarzut z werdyktem NAPRAW.
