# R-WEB-DIPLO-JSON-DESCRIPTIONS-SYNC-Q1 — dispatch (2026-11-13)

GOAL: opisowe fragmenty gra/data/diplomacy.json (tabele referencyjne i opisy akcji dla gracza) zgadzają się z faktycznymi parametrami i kodem; ZERO zmian zachowania gry. Szczegóły: DODATEK.

BAZA: origin/main 52fc1d5ca (FALA 680). Operator: HAIKU. Evaluator/FC: SONNET.
ALLOWLISTA: gra/data/diplomacy.json (WYŁĄCZNIE pola opisowe/tekstowe i nieczytane przez kod tabele referencyjne — nie zmieniaj żadnej wartości parametru czytanej przez kod), komentarze (tylko komentarze!) w gra/src/game/diplomacy.ts ok. 985–993 i 1103–1108, istniejące testy tylko jeśli sprawdzają teksty, NOWY gra/tools/diplo-json-descriptions-sync-test.cjs, docs/encyklopedia/pojecia/*.md tylko jeśli wymagają korekty po zmianie tekstu, gra/src/data/wikiBundle.json (WYŁĄCZNIE regeneracja skryptem), dyspozycje/autobot/runs/R-WEB-DIPLO-JSON-DESCRIPTIONS-SYNC-Q1/**.
ZAKAZ: wartości parametrów, ai.ts, main.ts, diplomacy-proposals.ts, kod wykonawczy w diplomacy.ts (tylko komentarze), JSON balansu poza diplomacy.json, WERSJE.md, gra-robocza/, rust-port/, npm run build/dev, git add -A.
