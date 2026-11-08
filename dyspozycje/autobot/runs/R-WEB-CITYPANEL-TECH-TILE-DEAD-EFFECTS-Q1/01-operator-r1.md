STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITYPANEL-TECH-TILE-DEAD-EFFECTS-Q1
GOAL: Kafelek „Technologie” w karcie budynku (gra/src/ui/cityPanel.ts, appendTechDetailBlock) nie pokazuje efektów martwych, które karta odkrycia już ukrywa; jeden wspólny filtr; test ZNANY STAN zaktualizowany bez osłabiania; test regresji dopisany. Bez zmian liczb w silniku.
BAZA: origin/main fd8cc14a3 (FALA 562); worktree wf_61c17bf5-f5f-1, HEAD = fd8cc14a3 przed zmianą.

ZMIANY/COMMIT:
- NOWY gra/src/ui/entityCards/techDeadEffects.ts — WSPÓLNY filtr: isDeadTechCardBuilding (przeniesiony z technologyAdapter.ts), hiddenTechEffectNames(tech) (= `ukryte` z data/tech-cards-top5.json), deadBuildingNames(), filterDeadEffectText(tekst, tech) (dzieli po „;", wycina człony z efektem martwym, zwraca null gdy pusto).
- gra/src/ui/cityPanel.ts — appendTechDetailBlock: wiersze „Wymaga budynek”, „Odblokowuje budynek”, „Odblokowuje surowiec”, „Odblokowuje pole”, „Uwagi tech” (playerFacingNote → filtr) przechodzą przez filterDeadEffectText. Brak nowej listy.
- gra/src/ui/entityCards/technologyAdapter.ts — `hidden` = hiddenTechEffectNames(techName); isDeadTechCardBuilding re-eksportowane z techDeadEffects (kompatybilność importu).
- gra/src/ui/techDiscoveryNotice.ts — `hidden` = hiddenTechEffectNames(tech.Technologia) (ścieżka zapasowa karty odkrycia używa tej samej reguły).
- gra/tools/building-cards-top5-test.cjs — sekcja [G]: kafelek liczony przez WSPÓLNY filtr (bundle esbuild techDeadEffects.ts); ZNANY_STAN_HOST zmniejszony z 5 do 3 wpisów (2× Teatr/Filozofia naprawione). Komentarz z uzasadnieniem 3 pozostałych.
- NOWY gra/tools/citypanel-tech-tile-dead-effects-test.cjs — 17 asercji: [A] źródło (import, użycie filtra, brak drugiej listy `ukryte`), [B] zachowanie (Filozofia: „Odblokowuje budynek” = „Akademia”, Uwagi bez „Teatr”; dla wszystkich 89 niepustych wierszy tekstowych tech.json żaden efekt ukryty/martwy budynek nie przechodzi), [C] regresja (Katapulta i „elitarnych” zostają).
- Commit: SHA w sekcji „COMMIT” poniżej (commit lokalny, bez push).

DECYZJA / ZAŁOŻENIE OPERATORA (luka w dispatchu):
Dispatch zakładał, że wszystkie 5 wierszy ZNANY STAN to efekty martwe. Sprawdzenie w danych pokazało, że tylko 2 są martwe:
  1. Filozofia → „Odblokowuje budynek” „Akademia; Teatr” i „Uwagi” „… Teatr = NOWY budynek …” — Teatr jest martwy (suppressed: true, buildings.json:1728; ukryte w tech-cards-top5.json; ANALIZA-KART-ODKRYC.md Q4). UKRYTE (2 wiersze).
  2. Oblężnictwo → „Warsztat oblężniczy; Jednostki: Katapulta” i „Uwagi” „… Katapulta …” — Katapulta NIE jest martwa: jednostka Tech=Oblężnictwo (units.json), Warsztat ją odblokowuje (buildings.json:1637-1639, uwagi :1629), a karta odkrycia pokazuje ją jako Top1 (ANALIZA-KART-ODKRYC.md). Trafienie pochodzi z frazy `_martweFrazy` (tools/gen-building-cards-top5.korekty.json, wpis warsztat_oblezniczy) przeniesionej na kafelek. ZOSTAWIONE (2 wiersze, ten sam stan co karta odkrycia).
  3. Sztuka wojenna → „Uwagi” Akademii wojskowej „… prereq elitarnych jednostek żelaznych” — „elit” to realna bramka jednostek elit (uwagi buildings.json:2115), nie efekt martwy. ZOSTAWIONE (1 wiersz).
Zasada: kafelek ukrywa dokładnie to, co karta odkrycia ukrywa (jeden filtr). Ukrycie Katapulty byłoby REGRESJĄ względem karty odkrycia (gracz straciłby Top1 Oblężnictwa). Wpis `_martweFrazy` dla warsztat_oblezniczy / akademia_wojskowa wygląda na nieaktualny — decyzja danych poza allowlistą tego tematu; do rozstrzygnięcia przez właściciela lub osobny temat.

TESTY:
- tsc --noEmit (gra/tsconfig.json): exit 0, 0 linii błędów.
- node tools/citypanel-tech-tile-dead-effects-test.cjs: 17 pass, 0 fail.
- node tools/building-cards-top5-test.cjs: 1179 pass, 0 fail (baseline przed zmianą też 1179/0; ZNANY STAN 5 → 3 wpisy).
- node tools/tech-cards-top5-test.cjs: 594 pass, 0 fail.
- node tools/civpedia-technologie-rys-historyczny-test.cjs: 324 pass, 0 fail.
- node tools/karta-technologia-uklad-real-render-test.cjs: 11 pass, 0 fail.
- node tools/tech-discovery-card-click-test.cjs: 13 PASS, 0 FAIL.
- NIE_ZMIERZONO: weryfikacja DOM w Chromium na żywej karcie miasta (zrzut kafelka „Technologie” dla Filozofii). Zmiana jest tekstowa; sprawdzona została funkcja, której wynik trafia do DOM (bundle w Node), nie sam render. Nie uruchomiono npm run build/dev (zakaz).
- npm ci w gra/ (tylko zależności, bez build) — w worktree; node_modules ignorowany przez git.

BLOKADY: brak poza NIE_ZMIERZONO (DOM) i decyzją o Katapulcie/elit do potwierdzenia przez właściciela.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator (Sonnet) i Final Control: weryfikacja diffu (allowlista), decyzja o 3 zostawionych trafieniach (Katapulta ×2, elit ×1), ewentualny zrzut DOM w Chromium.

DEPLOY/PUSH: NIE WYKONANO
