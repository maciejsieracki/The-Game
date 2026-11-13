STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TERRAIN-ID-NAME-MAP-UNIFY-Q1
GOAL: Jedno źródło prawdy mapy id↔nazwa terenu (TerenBazowy) zamiast czterech kopii; zero zmiany zachowania gry.
ZMIANY/COMMIT: Allowlista (tylko te pliki):
- NOWY gra/src/map/terrain-names.ts: jedna tabela (id, etykieta UI, klucz ASCII minimapy, etykieta z terrain-yields.json, aliasy terrain-movement.json) i z niej wyprowadzone mapy: TEREN_LABEL_PL, TEREN_MINIMAP_KEY, TEREN_DANE_LABEL_TO_ENUM, TEREN_MOVEMENT_KEY_ALIASES.
- gra/src/ui/hexContextTooltip.ts: usunięta kopia TEREN_LABEL, import z terrain-names.
- gra/src/map/minimap.ts: usunięta kopia TEREN_KEY, import z terrain-names.
- gra/src/game/economy.ts: TERRAIN_NAME_TO_ENUM = TEREN_DANE_LABEL_TO_ENUM.
- gra/src/units/setup.ts: TERRAIN_MOVEMENT_KEY_ALIASES = TEREN_MOVEMENT_KEY_ALIASES.
- NOWY gra/tools/terrain-names-equivalence-test.cjs (snapshot dawnych literałów vs nowe mapy).
- dyspozycje/autobot/runs/R-WEB-TERRAIN-ID-NAME-MAP-UNIFY-Q1/ (ten raport, gate-*.txt).
Nie dotknięto: ai.ts, auto-improvements.ts (brak kopii mapy nazw), gra-robocza, WERSJE.md, rust-port, src-tauri, battle.
Commit: patrz końcowa odpowiedź (SHA). Push: NIE.

POMIAR KOPII (PRZED):
1. ui/hexContextTooltip.ts TEREN_LABEL (TerenBazowy → etykieta UI, np. 'Płytkie morze').
2. map/minimap.ts TEREN_KEY (TerenBazowy → klucz ASCII, np. 'Wybrzeze').
3. game/economy.ts TERRAIN_NAME_TO_ENUM (etykieta z terrain-yields.json, np. 'Wybrzeże' → enum; 8 wpisów).
4. units/setup.ts TERRAIN_MOVEMENT_KEY_ALIASES (21 aliasów: ASCII, z diakrytykami, małe litery).
Porównanie zawartości: kopie NIE są identyczne co do formatu klucza/wartości (UI 'Płytkie morze' vs dane 'Wybrzeże' vs ASCII 'Wybrzeze'). Nie ujednolicano wartości: każdy widok zachowuje dokładnie swój dotychczasowy zbiór kluczy i wartości (potwierdza test równoważności). Nie stwierdzono rozbieżności, która zmieniałaby wynik gry.
Zgłoszone, nie zmienione: minimapHud.ts TEREN_KOLOR ma klucz 'Morse' (literówka obok 'Morze'; poza allowlistą, martwy wpis dla terenu).
Poza zakresem (nie są kopiami mapy nazw): ai.ts normalizeTerrainLabel (normalizator), battle/battle-terrain.ts (switch po id), ui/cityPanel.ts TEREN_COL/TEREN_LETTER i render/units.ts CIV_TERRAIN_TOP (klucz enum → kolor/litera/wysokość).

TESTY:
- Równoważność: gra/tools/terrain-names-equivalence-test.cjs → PASS=23 FAIL=0 (EXIT=0), log gate-equivalence.txt.
- tsc: node ./node_modules/typescript/bin/tsc --noEmit po npm ci --ignore-scripts → EXIT=0, 0 linii wyjścia, gate-tsc.txt.
- git diff --check: czysto.
- Regresje, drzewo PO (pliki 1–32 z listy, wykonane sekwencyjnie): 27× EXIT=0 (m.in. logic-test, hud-tooltip-body-mounted-panels 16/0, ai-city-yield, hex-tooltip-*, civpedia-* poza dwoma, economy/owner/diplomacy-economy, terrain-base-resource-yields nie w tej połowie). Niezerowe:
  a) ai-major-economy-test: EXIT=1, TypeError computeMajorArchetypeMilitaryFraction — PRZED identycznie → niezwiązane.
  b) civpedia-karty-nazwa-przyciskiem-test: EXIT=1, 25 pass / 2 fail — PRZED identycznie 25/2 → niezwiązane.
  c) civpedia-karty-spojnosc-q1-c-test: EXIT=1, 23 pass / 1 fail (1420 px, układ obok siebie) — PRZED: NIE ZMIERZONO (kopia bazowa niedostępna, patrz BLOKADY).
  d) dyplo-warunek-niespelniony-czerwony-tooltip-test: EXIT=1, 4 FAIL (pakt nieagresji, relacja 112) — PRZED: NIE ZMIERZONO (j.w.). Test nie dotyka mapy terenu.
  e) horse-resource-terrain-test: EXIT=124 (timeout 400 s) — PRZED: NIE ZMIERZONO (j.w.).
- Test d) przy uruchomieniu nadpisał 4 śledzone pliki PNG w dyspozycje/autobot/runs/R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1/dowody/; przywrócone git checkout, NIE są w commicie.
- Hash mapy generatora dla ≥3 ziaren przed/po: NIE ZMIERZONO.
- Regresje 33–64 (od map-attack-city-test do wonder-map-build-test, bez live/real-render/measure/bench): NIE ZMIERZONO w tej rundzie.

BLOKADY:
1. Bramka regresji niedomknięta: NIE ZMIERZONO pkt 33–64, hash mapy ≥3 ziaren, PRZED dla trzech testów (c, d, e).
2. Katalog kopii bazowej (scratchpad/base) zniknął w trakcie pracy (usunięty poza moim procesem), więc pomiar PRZED nie został dokończony. Do powtórzenia w następnej rundzie z nową kopią HEAD=origin/main.
3. Testy live/Chromium (np. hud-tooltip) uruchomione na tej maszynie wolno; nie uruchamiano wszystkich.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator: sprawdzić diff (4 kopie → import, zero zmiany wartości) i zlecić Operatorowi R2 domknięcie bramki regresji (33–64, PRZED dla c/d/e, hash ≥3 ziaren) na świeżej kopii bazowej.
DEPLOY/PUSH: NIE WYKONANO
