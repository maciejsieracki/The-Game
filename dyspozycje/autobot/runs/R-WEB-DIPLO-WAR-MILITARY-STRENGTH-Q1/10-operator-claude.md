# R-WEB-DIPLO-WAR-MILITARY-STRENGTH-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-MILITARY-STRENGTH-Q1
GOAL: Krok 2 z 4 (decyzje właściciela 2026-11-13): miara „Siła militarna” pary w wojnie, liczona OSOBNO od Power, jako czysta funkcja + parametry w JSON + testy. Bez podpięcia do AI, pokoju ani UI (kroki 3 i 4).
BAZA: origin/main d09df3e0b (worktree, checkout --detach).

## ZMIANY / COMMIT

Allowlista (wszystkie pliki NOWE):
- gra/src/game/diplomacy-military-strength.ts — funkcje: `computeMilitaryStrength`, `compareMilitaryStrength`, `loadMilitaryStrengthParams`, `DEFAULT_MILITARY_STRENGTH_PARAMS`. Import tylko JSON (brak importu silnika).
- gra/data/diplomacy-military-strength-params.json — parametry w formacie `{wartosc, opis}` (opis po polsku):
  progPrzewagiProc = 20, wagaBitew = 1 (z uzasadnieniem: ten sam model co `wygrane_bitwy` w Power, enemy_m_sum), trybutBonusProc = 10, trybutBonusTur = 10.
- gra/tools/diplo-military-strength-test.cjs — test (a)–(h), 23 asercje.
- dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-MILITARY-STRENGTH-Q1/10-operator-claude.md — ten raport.

Brak zmian w ai.ts, main.ts, diplomacy.ts, diplomacy-proposals.ts, power-objective.ts, power-params.json, UI, WERSJE.md.

SHA: patrz pole `sha` w StructuredOutput (commit z kodem + raportem, na gałęzi detached od d09df3e0b).

## Założenia rozstrzygnięte w raporcie (luki dispatchu)

1. Sygnatura `compareMilitaryStrength` przyjmuje obiekty `{ id, sila, armiaPkt }` (zamiast gołych liczb), bo wynik `silniejszyId` wymaga identyfikatora i sumy armii do rozstrzygnięcia remisu. Dispatch podawał `(silaA, silaB, params)`; to jedyna zmiana względem niego.
2. Próg liczony w całkowitych procentach: `A·100 ≥ B·(100 + próg)` (bez zmiennoprzecinkowego 1,2). Obie siły 0 → `brak`. B = 0, A > 0 → przewaga A, `stosunek = Infinity`.
3. Remis (dokładnie równa siła): `silniejszyId` wg kolejno: większa suma armiaPkt, potem mniejszy id (porównanie leksykograficzne). Wynik `przewaga` przy remisie zależy od progu (przy 20% → `brak`). `silniejszyId` jest zawsze wyznaczony, także przy `brak`.
4. Wartości ujemne i NaN wejść są traktowane jako 0 (`x > 0 ? x : 0`).
5. `trybutBonusTur` jest tylko parametrem; licznik tur należy do integracji (krok 3/4).

## TESTY (surowe wyniki)

- `npx tsc --noEmit` → exit 0 (bez wyjścia).
- `node tools/diplo-military-strength-test.cjs` → `RESULT: 23 PASS / 0 FAIL`, exit 0.
  - (a) zbiór military=true z power-params.json = {armia, rekruci}; suma składników military=true z computeObjectivePower (10 jedn., 80 ekw.) = 25 + 800 = 825 = armiaPkt + rekrutPkt.
  - (b) +40 wygranych bitew = +40·wagaBitew; dodatkowe pola gospodarcze nie zmieniają siły; Power rośnie, składniki military=true bez zmian.
  - (c) bez trybutu 100, z trybutem 110.
  - (d) 119 vs 100 → brak; 120 vs 100 → A; 100 vs 120 → B; 100 vs 119 → brak; 0 vs 0 → brak; 5 vs 0 → A (Infinity).
  - (e) symetria na siatce 12×12 wartości: przewaga zamieniona, stosunek odwrotny, silniejszyId bez zmian.
  - (f) remis: mniejszy id przy obu kolejnościach; wyższa armia wygrywa przy równej sile.
  - (g) parametry z JSON; brak literałów 1.2 / 0.2 / 1.1 w .ts (regex po liniach); jedyny import to JSON.
- Mutacja (h): `progPrzewagiProc` 20 → 25 w JSON → `RESULT: 20 PASS / 3 FAIL`, exit 1 (czerwone: 120% → A, B = 120 → B, przypięte wartości). Przywrócone do 20 → `23 PASS / 0 FAIL`, exit 0.
- Bramki referencyjne (po przywróceniu JSON):
  - logic-test: `LOGIC OK (213/213)`, exit 0
  - tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, exit 0
  - research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0
  - unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
  - combat-test: `COMBAT TEST: 6/6 pass`, exit 0

Uwaga: `npm run build` / `dev` nie były uruchamiane (zakaz). `npm ci --ignore-scripts` wykonane w gra/ (exit 0).

## Nieużycie funkcji poza testem

`grep -rn "diplomacy-military-strength" src tools` → jedyny import to sam moduł (linia importu JSON); test importuje przez bundle esbuild. Funkcje nie są importowane w silniku.

## BLOKADY

Brak.

## MIEJSCA DO ZLICZANIA WYGRANYCH BITEW Z TEJ WOJNY (wskazanie, licznik = osobne zadanie)

Obecnie nie istnieje licznik per para/wojna. Istnieje tylko licznik per właściciel (suma pkt wszystkich bitew):
- gra/src/main.ts:35059 — `battlePowerPtsByOwner.set(winOid, … + pts)`: miejsce zapisu punktów wygranej bitwy (per właściciel, nie per wojna; do rozszerzenia o klucz pary i reset przy wybuchu wojny).
- gra/src/main.ts:2283 — deklaracja mapy `battlePowerPtsByOwner`.
- gra/src/main.ts:2792, 2847 — odczyt jako `bitwyPktSum` do Power (nie zmieniać: Power ma pozostać jak jest).
- gra/src/main.ts:35975 — czyszczenie wpisu właściciela (eliminacja).
- gra/src/main.ts:37956 oraz 47166–47169 — zapis i odczyt w meta zapisu gry (przy nowym liczniku pary trzeba dopisać zapis/odczyt, z migracją pustą dla starych zapisów).
- gra/src/main.ts:45760 — czyszczenie przy nowej grze.
- gra/src/game/power-objective.ts (computeObjectivePower, `bitwyRaw`) — konsument; bez zmian.

## RUNDY

1/5 (Operator, Haiku).

## NASTĘPNY KROK

Krok 3 (wypowiadanie wojny: zaufanie i siła militarna) — wpięcie `compareMilitaryStrength` w ścieżkę wojny i licznik bitew per para wg wskazań powyżej (osobny temat). Ten temat nie wpina funkcji do AI, pokoju ani UI.

## DEPLOY/PUSH: NIE WYKONANO
