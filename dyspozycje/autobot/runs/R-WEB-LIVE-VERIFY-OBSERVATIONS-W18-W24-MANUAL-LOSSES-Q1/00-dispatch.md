# R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1 (LIVEOBS)

DOMAIN: GAME (pomiar na żywo, BEZ zmian w src/data) · Operator HAIKU · Evaluator SONNET · Obrona HAIKU · FC SONNET · max 5 rund. Zadanie #272 (obserwacje otwarte).

## GOAL — trzy pomiary w żywym Chromium (xvfb-run, vite `--outDir` poza repo wg C-001), każdy z liczbami/zrzutami albo jawnym „NIE ZMIERZONO + gdzie utknęło”
1. **W18** (FALA 654, `R-WEB-SIEGE-MACHINES-ONLY-TECH-AVAILABLE-VISIBLE-Q1`): w pełnej grze machiny oblężnicze na liście są widoczne tylko gdy tech dostępny (Taran: patrz wyniki ABC #261 w rejestrze — odczytaj aktualną regułę z kodu/dispatchu); zrzut listy bez i z techem.
2. **W24** (FALA 655, `R-WEB-UI-LEFT-BANNER-OVERFLOW-NARROW-WINDOW-Q1`): lewy baner nie wylewa się w wąskim oknie (≥3 szerokości: np. 1024, 900, 800 px); zrzuty + odczyt `scrollWidth` vs `clientWidth` elementu banera.
3. **Straty zwycięzcy w trybie ręcznym**: w bitwie ręcznej (nie AUTO) zmierz straty zwycięzcy dla ≥3 ziaren/ustawień (ta sama armia, wręcz i dystans) i porównaj z AUTO (ta sama para armii); tabela: ziarno | tryb | straty zwycięzcy | straty przegranego. To POMIAR do decyzji właściciela — nie zgłaszaj „błędu” bez porównania.

## Metoda
Skorzystaj z działających harnessów, które dochodzą do bitwy (`gra/tools/battle-doctrine-live-r4-test.cjs`, `battle-manual-control-multicycle-live-test.cjs`, `ambush-live-test.cjs`, zielone w FALI 795) i `R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1` (driver ręczny). Nowe narzędzia tylko w `gra/tools/` (np. `live-observations-w18-w24-manual-losses-test.cjs`), wyniki i raport w katalogu runu; zrzuty do /tmp i opisane (obejrzane), nie do repo.

## Kryteria binarne
- Każdy z 3 punktów: PASS/FAIL z liczbami albo „NIE ZMIERZONO” z dokładnym miejscem zatrzymania (krok, selektor, log) po max 2 podejściach.
- Brak zmian w `gra/src`, `gra/data`, `gra-robocza`, `WERSJE.md`; tsc bez nowych błędów; 5 bramek referencyjnych.
- Nowa czerwień/defekt → zapisz w raporcie jako osobne zgłoszenie z dowodem (NIE naprawiaj w tym temacie).

## Zakazy
`npm run build/dev` w `gra/`, `git add -A`, `rm/rmdir/unlink` w komendach, logi do /tmp, nie commituj cudzych PNG nadpisanych testami.
