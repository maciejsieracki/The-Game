# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T9`
GOAL: Audytować dwie jednostki celtyckie: **Miecznik galijski, Rydwan celtycki** —
dziś dedykowany dispatch, ale Rydwan celtycki jest CZĘŚCIOWO generyczny (bryła
`buildCategoryModel('rydwan')`, tylko kolor akcentu bespoke) — ustalić czy to
świadomy wzorzec dla rydwanów, czy luka.

## Wyzwalacz

Kontynuacja `R-ZELAZO-AUDYT-POZOSTALE-Q1`, sekwencyjnie po T8. Pełny kontekst:
`docs/decyzje/R-ZELAZO-AUDYT-POZOSTALE-Q1.md`.

## Izolacja

Nowa gałąź `autobot/ZELAZO-AUDYT-T9-Q1`, odgałęziona od `origin/main` (zawiera już
T5+T6+T7+T8), osobny worktree per rola.

## Allowlista

- `gra/src/render/jednostki-z3-plemiona.ts` — WYŁĄCZNIE `buildMiecznikGalijski()`.
  NIE ruszać Berserker/Wojownik germański (T8), Drużynnik/iButho (T10).
- `gra/src/render/units.ts` — funkcja `decorateChariot()` (ok. `units.ts:1252`) TYLKO
  jeśli audyt Rydwanu celtyckiego wymaga zmiany współdzielonej geometrii — sprawdź
  najpierw ilu innych rydwanów (mykeński, Shang, inne) korzysta z tej samej funkcji
  (ok. `units.ts:1284/1309/1321/1328/1334/1339`) PRZED zmianą, żeby nie wywołać
  regresji u innych kultur. Linia dispatchu Rydwanu celtyckiego (ok. `units.ts:1284`).
  Linia dispatchu Miecznika galijskiego (ok. `units.ts:1485`).
- `gra/tools/*` — nowy lub rozszerzony test regresji renderowania.

## Kontekst techniczny

**Dane jednostek** (`units.json`): Miecznik galijski (Celtowie, Atak 9/Obrona 5/Pancerz 3
— lekki, ofensywny miecznik), Rydwan celtycki (Celtowie, Atak 7/Obrona 2/Pancerz 1 —
niski pancerz zgodny z lekkim rydwanem bojowym).

**Kwestia Rydwanu celtyckiego — do rozstrzygnięcia, nie do ślepej naprawy:** dzisiejszy
kod (`decorateChariot(buildCategoryModel('rydwan', ownerColor_), ownerColor_,
COLOR_GOLD_BR, COLOR_FOREST)`) dzieli WSPÓLNĄ bryłę kategorii `rydwan` z innymi
rydwanami (mykeński, Shang — potwierdź dokładną listę), różnicując wyłącznie paletę
kolorów + doczepioną tarczę z bossem. To MOŻE być świadomy wzorzec projektowy (jedna
bryła rydwanu, wiele palet — analogicznie do tego, jak różne kultury pieszej mają różne
sylwetki, ale konstrukcja koła/skrzyni rydwanu jest uniwersalna technicznie). Operator
MA zbadać: czy to jest zamierzone (i wtedy udokumentować jako świadomą decyzję z
uzasadnieniem, nie naprawiać) czy jest to realna luka wymagająca bespoke geometrii
(np. inny kształt skrzyni/koła dla lekkiego rydwanu celtyckiego vs cięższego
mykeńskiego) — zdecydować i udokumentować, nie zgadywać.

**Metoda — jak T1-T8:** zmierzyć geometrię, sprawdzić kolizje/orientacje, uzupełnić
sekcję historyczną K-style (Celtowie epoki żelaza — kultura lateńska, rydwany bojowe
udokumentowane np. u Bellovaków/Brytów, źródła Cezar/Diodor Sycylijski).

## Kryteria sukcesu

1. Dwa modele zmierzone (dowód pomiaru w raporcie).
2. Kwestia współdzielonej bryły rydwanu rozstrzygnięta i udokumentowana (świadomy
   wzorzec ALBO naprawiona luka — obie ścieżki dopuszczalne, patrz kontekst wyżej).
3. Zero regresji dla INNYCH rydwanów korzystających z `buildCategoryModel('rydwan')`
   jeśli ta funkcja jest dotykana — potwierdzone testem.
4. Sekcja historyczna K-style dla obu jednostek, ze źródłami.
5. Real render Playwright/Chromium z dowodem nietautologiczności per-asercja.
6. Zero regresji: testy T1-T8 tej serii + 5 bramek referencyjnych zielone.
7. `tsc --noEmit` i `vite build` (C-001) czyste.
8. Wątpliwości historyczne/projektowe — Operator rozstrzyga i dokumentuje (§10), nie
   pyta, chyba że znajdzie sprzeczność z treścią decyzji tego tematu.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora**
(temat czysto wizualny, `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High.

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–8 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1 (po zamknięciu T5-T8).
DEPLOY/PUSH: NIE WYKONANO.
