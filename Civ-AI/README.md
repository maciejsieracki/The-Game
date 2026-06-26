# Civ-AI — dział inteligencji przeciwników (indeks)

Wszystkie **nie-growe** pliki działu AI w jednym miejscu — żeby nie szukać po liście ~50 plików w katalogu Civ.
Pliki **kodu i danych gry** zostają w drzewie `gra/` (są potrzebne do builda) — linki niżej.

## W tym katalogu (`Civ-AI/`)
- **`Spec-AI-architektura.md`** — dokumentacja dewelopera: architektura, dokładne API/sygnatury, reguły, parametry, interakcje z działami, znane bugi/TODO. (Zacznij tutaj.)
- **`Spec-AI.md`** — projekt/założenia (design §1–§9).
- **`AI-parametry.xlsx`** — **PANEL STEROWANIA** (parametry; kolumna `Status` LIVE/PLANOWANE + arkusz `Eksport-README`).
- **`_archiwum/`** — historyczne/nieużywane (backupy: `AI-parametry.xlsx.bak-aidoc`, `ai-params.json.bak-aidoc`).

## Pliki gry — ZOSTAJĄ w drzewie (potrzebne do builda)
- `gra/src/game/ai.ts` — decyzje rywali (ruch/ekspansja/atak/produkcja)
- `gra/src/game/victory.ts` — warunki zwycięstwa (dominacja typu / nauka / przegrana)
- `gra/src/game/barbarians.ts` — barbarzyńcy (obozy/spawn/agresja)
- `gra/data/ai-params.json` — parametry wczytywane przez kod (wynik eksportu z panelu)
- `gra/tools/export-ai-params.py` — eksport `AI-parametry.xlsx` → `ai-params.json`
- `gra/tools/barbarians-test.cjs` — test barbarzyńców (53/0)

## Kanał koordynacji — ZOSTAJE w `dyspozycje/` (wspólna infrastruktura, nie ruszać)
- `dyspozycje/AI.md` — dyspozycje od mastera
- `dyspozycje/AI-DO-MASTERA.md` — raporty do mastera

## Pętla zmiany parametrów
`Civ-AI/AI-parametry.xlsx` (zmień kolumnę „Wartość") → `python3 gra/tools/export-ai-params.py` → `gra/data/ai-params.json`.
**Nigdy** `export-data.py` ani `npm run build` (regenerują wszystkie JSON-y).
