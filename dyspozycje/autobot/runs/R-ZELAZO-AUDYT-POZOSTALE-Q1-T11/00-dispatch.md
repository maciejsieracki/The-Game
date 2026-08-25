# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T11`
GOAL: Audytować **Katapultę** (bez kultury/nacji) — ostatnia jednostka tej serii,
dziś dedykowany dispatch, lokalna funkcja w `units.ts`, nigdy rygorystycznie
zmierzona.

## Wyzwalacz

Kontynuacja `R-ZELAZO-AUDYT-POZOSTALE-Q1`, sekwencyjnie po T10, OSTATNI temat tej
serii. Pełny kontekst: `docs/decyzje/R-ZELAZO-AUDYT-POZOSTALE-Q1.md`.

## Izolacja

Nowa gałąź `autobot/ZELAZO-AUDYT-T11-Q1`, odgałęziona od `origin/main` (zawiera już
T5-T10), osobny worktree per rola.

## Allowlista

- `gra/src/render/units.ts` — WYŁĄCZNIE funkcja `buildCatapult()` (ok. `units.ts:2969`)
  i linia dispatchu (ok. `units.ts:1429`). Nic innego w tym pliku.
- `gra/tools/*` — nowy lub rozszerzony test regresji renderowania.

## Kontekst techniczny

**Dane jednostki** (`units.json`): Katapulta — Atak 1/Obrona 1/`Atak dystansowy=8`,
Pancerz 0, brak Kultury/Nacji (maszyna oblężnicza dostępna dla wszystkich cywilizacji
— sprawdź czy model faktycznie jest kulturowo neutralny, bez akcentu jednej cywilizacji).
Machina oblężnicza — inny typ konstrukcji niż jednostki piesze/konne w tej serii
(brak anatomii ludzkiej/końskiej do zmierzenia w tym samym sensie, ale nadal: ramię
miotające, spust, koła, rama — sprawdź proporcje i czy ruchome części (jeśli
animowane) mają sensowną geometrię spoczynkową).

**Metoda — jak T1-T10, dostosowana do maszyny:** zmierzyć geometrię w żywym Three.js,
sprawdzić proporcje względem `HEX_R`, sprawdzić czy konstrukcja jest mechanicznie
wiarygodna (oś obrotu ramienia, przeciwwaga/skręt liny w zależności od typu — onager
vs balista, sprawdź który typ reprezentuje i czy geometria jest z nim spójna), dodać
sekcję historyczną K-style (machiny oblężnicze epoki żelaza, ~500 p.n.e.-500 n.e. —
zależnie od typu: greckie/rzymskie źródła, np. Witruwiusz dla balist).

## Kryteria sukcesu

1. Model zmierzony (dowód pomiaru w raporcie).
2. Typ machiny (onager/balista/inny) jednoznacznie ustalony i geometria z nim spójna.
3. Sekcja historyczna K-style, ze źródłami.
4. Real render Playwright/Chromium z dowodem nietautologiczności per-asercja.
5. Zero regresji: testy T1-T10 tej serii + 5 bramek referencyjnych zielone.
6. `tsc --noEmit` i `vite build` (C-001) czyste.
7. Wątpliwości historyczne — Operator rozstrzyga i dokumentuje (§10), nie pyta.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora**
(temat czysto wizualny, `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High.

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–7 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1 (po zamknięciu T5-T10) — po tym temacie: zbiorczy
deploy ROBOCZA dla całej serii `R-ZELAZO-AUDYT-POZOSTALE-Q1`.
DEPLOY/PUSH: NIE WYKONANO.
