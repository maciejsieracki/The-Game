# AI „Kultura i religia” — plus +10 tylko dla AI (R-WEB-CULT-REL-AI-PLUS10-Q1, runda 1)

Data: 2026-11-27. Baza kodu: origin/main `44649038c`. Decyzja właściciela 38b (pytanie 38, R-WEB-AI-CULT-REL-DIAG-Q1), potwierdzona 2026-11-27:
„Plus dziesięć zawsze stałe miało być tylko dla AI. Dla gracza nic nie zmieniamy.” Plus rośnie w każdej epoce; dotyczy Szczęścia i Prawa, religii i kultury.

## Co się zmienia (reguła)

| Poziom | Gracz / hotseat (bez zmian) | Komputer (AI) — NOWE |
|---|---|---|
| Łatwy | D −10, G +10 | D −10, **G +10** (wartość bez zmian) |
| Normalny | D −15, G +5 | D −15, **G +10** (było +5) |
| Trudny | D −20, G 0 | D −20, **G +10** (było 0) |

Wartość linii = (D + (G − D) · udział własnej) · skala epoki; skala ×1,0 / ×1,6 / ×2,3 daje plus AI +10 / +16 / +23. Minusy D nie zmieniają się dla nikogo. Tryb zgodności (brak poziomu) działa bit-w-bit jak dziś.

## Implementacja (jedna formuła, dwa zestawy granic)

- `gra/src/game/culture-religion-level.ts`: pole `GAi` w `CulturaReligiaBounds` (domyślnie 10 na każdym poziomie), pomocnik `culturaReligiaBoundsForOwner(bounds, ownerIsHuman)` (gracz → G, AI → GAi), `cultureReligionLineValue(..., ownerIsHuman = true)`.
- `gra/data/society-params.json` → `kultura_religia_poziomy.*.G_ai = 10` (D i G bez zmian).
- `gra/src/game/society-breakdown.ts`: pole wejścia `ownerIsHuman` (domyślnie gracz) w `HappinessBreakdownInput` i `LawBreakdownInput`; `evaluateOrderFromBreakdown` przekazuje je do Prawa. Linie Szczęścia i Prawa idą przez tę samą funkcję `kultReligLinePoints`. Poziom łatwy z granicami −10/+10 (gracz i AI) używa dzisiejszego wzoru `proporcjonalneSzczescie` (bit-w-bit).
- `gra/src/main.ts`: jedna linia w literale `evaluateOrderFromBreakdown` dla miasta: `ownerIsHuman: isHuman(city.ownerId)`. Z tego wejścia Porządek, potrzeba garnizonu (`aiCityGarrisonNeedFromOrder`) i preferencja budynków (`applyOrderDeficitBuildingBonus`) czytają już wartości AI, bo biorą rozpiskę Porządku.
- `gra/src/ui/newGameFlow.ts`: w opisie ustawienia „Kultura i religia” dopisane zdanie „Komputer zawsze dostaje plus +10 za własną kulturę i religię; poziom wybiera wielkość minusów (przy mieszanych populacjach).” Bez nowych kontrolek.

## Testy

- Nowy plik `gra/tools/ai-plus10-culture-test.cjs`: 69/0. Obejmuje granice AI (G=+10 na 3 poziomach), gracza bez zmian (G +10/+5/0), D bez zmian, AI +10/+16/+23 w epokach 1–3 dla trzech poziomów, hotseat (człowiek = gracz), tryb zgodności (AI = gracz, brak linii Prawa), linie Prawa AI, propagację typu właściciela przez `evaluateOrderFromBreakdown`, potrzebę garnizonu AI ≤ gracza.
- Istniejące testy z tabelą wartości dla gracza NIE wymagały zmiany oczekiwanych wartości, bo domyślne wejście to gracz: culture-religion-level 59/0, culture-religion 65/0, society-breakdown 56/0, ai-city-order-need 35/0, ai-city-order-need-wiring 231/0.
- Bramki: `tsc --noEmit` bez błędów; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-test 297/0.
- Mutacje czerwone (każda cofnięta, potem ponownie 69/0):
  - M1: `G_ai` trudny = 0 (wartość gracza) → 13 czerwonych (AI 100% = 0 zamiast +10);
  - M2: typ właściciela zignorowany (zawsze gracz) → 15 czerwonych;
  - M3: skala epok ignorowana dla linii (k = 1) → 9 czerwonych (np. Prawo AI epoka 2 = 10 zamiast 16).

## Pomiar PRZED / PO (poziom MAKSYMALNY)

Warunki jak w diagnozie: gra Trudny, Kultura i religia Trudny, Porządek hard, tempo kosztów jednostek `wysoki` (×4), `--unit-flow 1 --city-state 1`, 60 tur, seed 4242 i 7, runner `gra/tools/ai-cult-rel-measure-run.cjs` na żywym bundle vite (zbudowany poza repo), headless Chromium.

Wyniki, suma AI (owner > 0), tura 60:

| Wielkość | s4242 PRZED | s4242 PO | s7 PRZED | s7 PO |
|---|---|---|---|---|
| Miasta AI | 153 | 186 | 149 | 185 |
| Jednostki wojskowe AI | 159 | **227** | 138 | **249** |
| Puste miasta (0 wojska) | 56 (37%) | 49 (26%) | 59 (40%) | 41 (22%) |
| Porządek śr. (PorPct), t60 | 21,2 | **56,1** | 19,1 | **51,7** |
| Miasta poniżej 14% (bunt skrajny), t60 | 60 (39%) | **1** | 75 (50%) | **0** |
| Porządek śr., t10 | 19,3 | **64,0** | 20,8 | **63,3** |
| Nowe jednostki AI (t2–60) | 208 | 284 | 202 | 271 |
| Skarbiec AI, t60 | 3 731 | 4 451 | 4 374 | 14 698 |

Oś czasu jednostek AI PO (t10 / t20 / t30 / t40 / t50 / t60): s4242 57 / 96 / 178 / 261 / 215 / 227; s7 56 / 98 / 176 / 248 / 242 / 249.

Odniesienie zgodności (PRZED, bez kultury trudnej): jednostki 221 (s4242) i 230 (s7). Po zmianie AI na poziomie trudnym jest blisko tego odniesienia (227 i 249).

Zakres pomiaru i zastrzeżenia:
- PRZED pochodzi z `AI-KULTURA-RELIGIA-DIAG-2026-11-26.md` (baza origin/main `5748b924f`), PO na bazie `44649038c`. Między nimi weszły inne zmiany (m.in. FALA 926 i tematy AI). Bazowy bieg na obecnym HEAD bez tej zmiany NIE ZMIERZONO, więc część różnicy może pochodzić z innych zmian. Zmierzony jest kształt zmiany (miasta poniżej progu 60/75 → 1/0, Porządek 19–21 → 52–64), nie czysty udział tej jednej zmiany.
- Seed 4242 i 7 wykonane w 60 turach. Bieg s4242 był wznawiany ze slotu (Chromium raz padł przy wznowieniu, ponowienie przeszło). Liczby z surowego wyjścia `gra/tools/ai-cult-rel-measure-flow.cjs`.
- Bunty i rebelie: bunt 0–1 miasto, rebelia 0 (w PRZED dla trudnego też 0).
- Gracz i hotseat: wartości gracza nie zmieniają się w kodzie (potwierdzone testem), ale osobnego biegu gracza NIE ZMIERZONO w tym temacie.
- Widoki poza turą (panel miasta, `growth-happiness.ts`, `turn-economy.ts`, `conquest-stability.ts`) nie dostały typu właściciela, więc dla miast AI pokazują nadal wartości gracza. Tury liczy `main.ts` przez `evaluateOrderFromBreakdown`, więc wynik pomiaru tego nie dotyczy. Do osobnego tematu, jeśli te widoki mają pokazywać wartości AI.

Dane surowe (poza repo): `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/aiplus10/post-4242/` oraz `.../post-7/` (seed*.jsonl, summary).
