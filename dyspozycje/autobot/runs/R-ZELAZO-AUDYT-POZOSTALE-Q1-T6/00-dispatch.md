# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T6`
GOAL: Audytować i podnieść do standardu serii Opus 5 cztery jednostki śródziemnomorskie
epoki Żelaza: **Gwardia Tyreńska, Tyrski miecznik, Wojownik z żelaznym khopesh,
Thorakites** — dziś dedykowany dispatch po nazwie, ale kod z `jednostki-z2-srodziemne.ts`,
nigdy rygorystycznie zmierzony.

## Wyzwalacz

Kontynuacja `R-ZELAZO-AUDYT-POZOSTALE-Q1`, sekwencyjnie po T5 (ten sam plik-sąsiad
`jednostki-z2-srodziemne.ts` co T3 Falanga, już zintegrowany — nie duplikować pracy).
Pełny kontekst: `docs/decyzje/R-ZELAZO-AUDYT-POZOSTALE-Q1.md`.

## Izolacja

Nowa gałąź `autobot/ZELAZO-AUDYT-T6-Q1`, odgałęziona od `origin/main` (zawiera już T5),
osobny worktree per rola.

## Allowlista

- `gra/src/render/jednostki-z2-srodziemne.ts` — WYŁĄCZNIE funkcje `buildGwardiaTyrenska()`,
  `buildTyrskiMiecznik()`, `buildZelaznyKhopesh()`, `buildThorakites()`. NIE ruszać
  `buildFalangita`/inne funkcje w tym samym pliku (już zintegrowane w T3, poza zakresem).
- `gra/src/render/units.ts` — WYŁĄCZNIE linie dispatchu tych czterech jednostek w
  `buildNamedUnit()` (ok. `units.ts:1477-1480`), jeśli audyt tego wymaga.
- `gra/tools/*` — nowy lub rozszerzony test regresji renderowania (real render).

## Kontekst techniczny

**Dane jednostek** (`units.json`, wszystkie Epoka=Żelazo, `Atak dystansowy=0`):
Gwardia Tyreńska (Fenicjanie, Atak 8/Obrona 7/Pancerz 4), Tyrski miecznik (Fenicjanie,
8/6/4), Wojownik z żelaznym khopesh (Egipt, 8/7/6 — khopesh = zakrzywiony miecz
sierpowy, sprawdź czy model faktycznie go dzierży, nie prosty miecz), Thorakites
(Grecja, 7/9/6 — historycznie lekka piechota z pancerzem liniowym `thorax`, TO NIE
JEST hoplita/falangita — sprawdź czy sylwetka jest odróżnialna od Falangi z T3,
zintegrowanej w tym samym pliku).

**Metoda — jak T1-T5:** zmierzyć geometrię w żywym Three.js PRZED oceną, sprawdzić
kolizje broni z ciałem, orientację tarcz względem kamery gry (azymut 0 — dokładnie
błąd T2), uzupełnić sekcję historyczną K-style (Fenicja/Egipt/Grecja epoki żelaza,
~1200-600 p.n.e., unikać anachronizmów).

## Kryteria sukcesu

1. Wszystkie 4 modele zmierzone (dowód pomiaru w raporcie).
2. Zero kolizji broni/tarczy, khopesh Egipcjanina faktycznie zakrzywiony jeśli
   historycznie poprawne, Thorakites wizualnie odróżnialny od Falangi (T3).
3. Sekcja historyczna K-style dla każdej z 4 jednostek, ze źródłami.
4. Real render Playwright/Chromium z dowodem nietautologiczności per-asercja.
5. Zero regresji: testy T1-T5 tej serii + 5 bramek referencyjnych zielone.
6. `tsc --noEmit` i `vite build` (C-001) czyste.
7. Wątpliwości historyczne — Operator rozstrzyga i dokumentuje (§10), nie pyta.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora**
(temat czysto wizualny, `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High.

## Runda 1 — PASS-WITH-NOTES (zamknięte, po 2 integration micro-fixach)

Operator PASS, Evaluator PASS-WITH-NOTES, Final Control PASS-WITH-NOTES. Kluczowe
znalezisko: `jednostki-z2-srodziemne.ts` miał ten sam problem co T5 — zero nazwanych
mesh, brak `userData.anchors`, nigdy niemierzalny. Po dodaniu anchors Operator znalazł
NOWĄ klasę błędu w tej serii — nie broń w ciele (T1/T3/T5), tylko element FIZYCZNIE
NIEWIDOCZNY z jedynej kamery gry (azymut 0, elewacja 52°): miecz Gwardii Tyreńskiej
niesiony niemal dokładnie wzdłuż osi patrzenia, zakrzywienie khopesza w płaszczyźnie
niewidocznej dla tej kamery, dzwon hełmu Thorakitesa zasłaniający oczy. Wszystkie
naprawione minimalną zmianą stałych, potwierdzone macierzą ablacyjną 11×11.

Final Control sam naprawił (integration micro-fix na branchu, commit `e6729c49`) trzy
nieprawdziwe/nieprecyzyjne zdania znalezione przez Evaluatora: błędną wartość normalnej
tarczy do kamery (skopiowana stała kierunku patrzenia), fałszywe „ścieżka angielska
dziś nieosiągalna" (battleScene.ts ma faktycznie osiągalny fallback), czas dokonany
„zapisano" dla wpisu rejestru który jeszcze nie istniał.

**Drugi integration micro-fix (orkiestrator, przy mergu):** Final Control T6 znalazł,
że IDENTYCZNY błąd „ścieżka angielska dziś nieosiągalna" nadal stał w komentarzu T5
(`units.ts:1476-1478`, dotyczy Mezopotamii — poza zakresem T6, mój wcześniejszy fix
w T5 poprawił tylko `jednostki-z1-mezopotamia.ts`, nie zmieniony wtedy fragment
`units.ts`). Poprawione przy tej integracji.

3 znaleziska (nazwa EN khopesza vs materiał, khepresz na szeregowcu, brak sylwetki
pancerza Tyrskiego miecznika) zarejestrowane osobno.

Zmergowane do `main`, zweryfikowane niezależnie przez orkiestratora (tsc/vite build/
testy tematu+T1-T5/5 bramek referencyjnych zielone).

## Raport terminalny dispatchu

ZMIANY/COMMIT: branch `autobot/ZELAZO-AUDYT-T6-Q1`, commit `e6729c49`, zmergowane do
`main`.
TESTY: kryteria sukcesu 1–7 spełnione, potwierdzone niezależnie 3-krotnie + orkiestrator
po merge.
BLOKADY: brak (3 znaleziska zarejestrowane osobno, nie blokują).
RUNDY: 1/5 (zamknięte pozytywnie).
NASTĘPNY KROK: T7 (super-jednostki Rzym/Grecja + Hastati).
DEPLOY/PUSH: git push (main) WYKONANO; deploy ROBOCZA po zamknięciu T7-T11.
