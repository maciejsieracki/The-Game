# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`
GOAL: Lista „ULEPSZENIA TERENU" w panelu budowy ma być **w całości osiągalna i klikalna**
przy każdym realistycznym powiększeniu przeglądarki i rozmiarze okna — dziś przy dużym
powiększeniu nie da się dojechać do pozycji na samym dole.

## Wyzwalacz — ECHO właściciela (2026-08-25, główny czat orkiestratora)

> „to menu budowania ulepszeń się nie przesuwa, przy dużym powiększeniu nie można otworzyć
> ulepszeń na samym dole"

Załączone dwa zrzuty: panel z listą od „Farma" do „Warzelnia soli"; na pierwszym widać, że
dolna część listy wchodzi pod przyciski **WYKONAJ** i **ZAKOŃCZ TURĘ**.

## Punkt zaczepienia (recon orkiestratora — DO POTWIERDZENIA POMIAREM)

`gra/src/ui/buildModeHud.ts:144-148`:

```css
.civ-build-panel{position:fixed;top:90px;right:<HUD_EDGE_PX>;z-index:311;width:270px;
  max-height:calc(100vh - 180px);
  overflow-y:auto;display:none;flex-direction:column;gap:4px;padding:8px;}
.civ-build-panel.open{display:flex;}
```

Panel MA `overflow-y:auto`, więc „nie przesuwa się" nie może wynikać z braku scrolla jako takiego.
Hipotezy do sprawdzenia pomiarem (nie zgadywać, która):
1. `top:90px` + `max-height:calc(100vh - 180px)` to **sztywne piksele** — przy dużym powiększeniu
   viewport w px CSS się kurczy, a te stałe nie, więc dolna krawędź panelu może wypaść poza
   ekran albo pod paskiem akcji.
2. Dolne pozycje listy są **zasłonięte** przez przyciski WYKONAJ / ZAKOŃCZ TURĘ (wyższy z-index
   albo brak rezerwy na ich wysokość) — scroll działa, ale ostatnie wiersze są nieklikalne.
3. Scroll gubi się przez zagnieżdżony kontener albo przechwytywanie kółka myszy przez kanwę mapy
   (zoom mapy zamiast scrolla listy) — to bardzo prawdopodobne w grze 3D i trzeba to sprawdzić
   OSOBNO od samego layoutu.

Operator ma **zmierzyć**, która przyczyna faktycznie zachodzi (może być więcej niż jedna),
i naprawić każdą realnie występującą.

## Izolacja

Gałąź `autobot/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1` od `origin/main`, osobny worktree per rola.

**UWAGA — TEMATY RÓWNOLEGŁE:** biegną jednocześnie `R-PRACA-JEDEN-PODZIAL-Q1` oraz
`R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`. Pierwszy z nich ma w allowliście `gra/src/ui/buildModeHud.ts`
(suwaki budżetu automatu). Nie zakładaj, że tamte są zintegrowane. Trzymaj zmiany wyłącznie
w warstwie layoutu/scrolla listy — NIE dotykaj logiki suwaków budżetu automatu ani wartości
procentowych, żeby merge był rozstrzygalny.

## Allowlista

- `gra/src/ui/buildModeHud.ts` — WYŁĄCZNIE CSS/layout panelu i listy ulepszeń oraz obsługa
  zdarzeń scrolla. NIE ruszać logiki wyboru ulepszeń, cen, warunków technologicznych ani
  suwaków budżetu automatu.
- `gra/src/ui/*.css`-równoważne bloki stylów, jeśli styl panelu żyje poza `buildModeHud.ts`
  (Operator ma to najpierw ustalić).
- `gra/tools/*` — nowy test real-render.

NIE ruszać: `gra/data/**`, `dyspozycje/WERSJE.md`, logiki gry.

## Kryteria sukcesu

1. **Pomiar stanu zastanego:** dla siatki warunków — powiększenie przeglądarki
   **100%, 125%, 150%, 175%, 200%** × wysokości okna (np. 1080, 900, 768, 640) — zmierzyć,
   czy OSTATNIA pozycja listy („Warzelnia soli" lub aktualnie ostatnia) jest:
   (a) w ogóle wyrenderowana, (b) osiągalna scrollem, (c) **klikalna** (nie zasłonięta
   niczym innym — sprawdzić `elementFromPoint` na jej środku, nie samą pozycję w DOM).
   Liczby do raportu — to jest dowód, że bug istnieje i w jakich warunkach.
2. Po naprawie: dla KAŻDEGO punktu tej siatki ostatnia pozycja jest widoczna, osiągalna
   i klikalna. Ten sam pomiar, te same warunki.
3. Scroll kółkiem myszy nad listą przewija **listę**, a nie zoomuje mapę (jeśli pomiar
   z hipotezy 3 wykaże, że dziś zoomuje mapę).
4. Zero regresji reszty panelu: sekcje MIASTO / CUDA ŚWIATA / POLITYKA PAŃSTWA — AUTO
   ULEPSZENIA nadal widoczne i działające; przyciski WYKONAJ / ZAKOŃCZ TURĘ nie zostały
   zasłonięte ani przesunięte.
5. Real render Playwright/Chromium z dowodem nietautologiczności (mutacja pojedyncza per
   asercja — np. przywrócenie starej wartości `max-height` MUSI zaczerwienić dokładnie
   asercję o osiągalności ostatniej pozycji).
6. `tsc --noEmit` i `vite build` (C-001) czyste; 5 bramek referencyjnych zielonych.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna gałąź.
Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora** (temat czysto wizualny,
`R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High. `opts.model` jawnie na KAŻDYM
wywołaniu `agent()` (C-062).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–6 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
