# P1.1 — Katalog plików/modułów `gra/src` (pin web `main` = `edb8fb56`)

**Temat:** `R-RUSTPORT-P1-1-FILE-CATALOG-Q1` · **Runda:** 1/5 · **Rola:** Operator (Haiku 5.5 medium)
**Źródło:** `git archive edb8fb56 gra/src` (odczyt z obiektów Git, bez zmian w `gra/**`).
**Metoda liczb:** `find <dir> -type f | wc -l` oraz zliczanie znaków nowej linii per plik (odpowiednik `wc -l`), wykonane w tej rundzie.
**Opis przeznaczenia:** pierwsza sensowna linia komentarza nagłówkowego pliku; gdy brak — lista eksportów. Opis mechaniczny, do weryfikacji przy P1.13/P1.14 (nie zastępuje czytania kodu).

## Podsumowanie liczbowe

| Katalog | Pliki (wszystkie) | Pliki `.ts` | Linie (`wc -l` na wszystkich plikach; 2 PNG w `ui` zawyżają sumę) | Stan poprzedniego audytu | Korekta |
|---|---:|---:|---:|---|---|
| `gra/src/game` | 183 | 183 | 70637 | 179 plików | 179 → **183** (wszystkie `.ts`) |
| `gra/src/ui` | 438 | 117 | 73963 | 105 plików | 105 → **117 `.ts`** (438 plików łącznie: 307 SVG, 8 JSON, 4 CSS, 2 PNG) |
| `gra/src/map` | 25 | 25 | 23682 | — | brak danych w starym audycie |
| `gra/src/units` | 2 | 2 | 1226 | — | brak danych w starym audycie |
| `gra/src/battle` | 15 | 14 | 26867 | — | brak danych w starym audycie |
| `gra/src/render` | 88 | 88 | 59319 | — | brak danych w starym audycie |
| **Razem 6 katalogów** | **751** | **429** | **255694** | | |

Uwaga do `ui`: na pinie `edb8fb56` plików `.ts` jest 117 (stary audyt: 105); łącznie 438 plików, z czego 307 to SVG. Liczby linii w kolumnie obejmują też SVG/JSON/CSS, więc są większe niż suma kodu.

**Metoda i zastrzeżenia (uzupełnienie po zarzutach Evaluatora, runda 1):**
- Źródło liczb: blob z `git show edb8fb56:<ścieżka>` (nie checkout roboczy). Checkout roboczy (`claude/sprawdzenie-funkcjonalnosci-ek4ra0`) różni się od pinu w 138 plikach `gra/` (`git diff --stat edb8fb56 HEAD -- gra`), więc `find gra/src/...` na nim NIE odtworzy tych liczb (dałoby np. 179 zamiast 183 w `game`). Weryfikacja: `git ls-tree -r edb8fb56 -- gra/src/<katalog>` + `git show edb8fb56:<ścieżka> | wc -l`.
- Kolumna „Linie” = liczba znaków nowej linii (`wc -l`), nie liczba linii tekstu. Dla plików bez końcowego `\n` ostatnia linia nie jest liczona.
- PNG (`ui/assets/hero/hero-intro.png` = 7342, `hero-menu.png` = 7733; razem 2039500 + 2175174 B) są binarne: liczba `\n` w nich nie ma znaczenia tekstowego. Suma `ui` bez PNG = 73963 − 15075 = **58888**; wartość 73963 zostaje jako suma kolumny, z zastrzeżeniem.
- SVG: 292 z 307 plików na pinie ma 0 znaków `\n` (jednowierszowe bez końcowego newline). Rozmiar w bajtach jest miarodajny: wszystkie SVG na pinie = 108231 B; z tego 292 pliki z 0 `\n` = 102723 B. Kolumna „Linie” dla SVG nie oddaje ich rozmiaru.

## Inne katalogi `gra/src` (poza zakresem 6 katalogów — informacyjnie, liczba plików)

| Katalog | Pliki | Z tego `.ts` |
|---|---:|---:|
| `gra/src/util` | 1 | 1 |
| `gra/src/types` | 12 | 12 |
| `gra/src/input` | 1 | 1 |
| `gra/src/perf` | 1 | 1 |
| `gra/src/oblezenie` | 2 | 1 |
| `gra/src/wonderpreview` | 2 | 1 |
| `gra/src/data` | 4 | 3 |
| `gra/src/audio` | 70 | 5 |
| `gra/src/assets` | 45 | 0 |

## Entry pointy (poza katalogami domenowymi)

| Plik | Linie | Przeznaczenie |
|---|---:|---|
| `gra/src/main.ts` | 39350 | Punkt wejscia The Game -- M1 Step 1: 3D hex map renderer. [importów: 313, eksportów: 0] |
| `gra/src/buildInfo.ts` | 27 | buildInfo.ts — stempel builda + marker grep w bundlu (DESIGN-RZEKI §PILNE, civ-workflow). [importów: 0, eksportów: 5] |
| `gra/src/vite-env.d.ts` | 30 | deklaracje typów środowiska Vite |
| `gra/index.html` | 42 | strona wejściowa HTML (Vite entry) |
| `gra/podglad-sektory/index.html` | 26 | strona wejściowa HTML (Vite entry) |
| `gra/podglad-sektory/main.ts` | 166 | podglad-sektory/main.ts — samodzielny mini-świat do OCENY układu sektorowego ulepszeń [importów: 3, eksportów: 0] |
| `gra/Gra-podglad-POLE-BITWY.html` | 3959 | strona podglądu HTML (poza grą) |

Pozostałe katalogi `gra/src` (poza zakresem 6 katalogów) — patrz sekcja „Inne katalogi” niżej.

## `gra/src/game` — 183 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/game/ai-city-capture-executor.ts` | 122 | ts | Egzekutor zwykłego ruchu AI z wąską ścieżką przejęcia pustego miasta. [importów: 1, eksportów: 7] |
| `gra/src/game/ai-cs-absorption.ts` | 289 | ts | R-AI-MP-WASAL-WCHLONIECIE — czysta logika AI major → miasto-państwo (trybut/wasal/wojna/wchłonięcie). [importów: 1, eksportów: 10] |
| `gra/src/game/ai-difficulty-bonus.ts` | 209 | ts | P-AI-MOC-BONUS=A — podpięcie martwych pól DifficultyParams dla major AI. [importów: 7, eksportów: 14] |
| `gra/src/game/ai-expansion.ts` | 37 | ts | P-AI-006=C — ekspansywność AI per nacja (zakładanie miast). [importów: 0, eksportów: 6] |
| `gra/src/game/ai-fog.ts` | 135 | ts | P-AI-BRAK-POJECIA-MGLY-Q1 — trwała pamięć celów AI. [importów: 0, eksportów: 10] |
| `gra/src/game/ai-major-absorb.ts` | 80 | ts | P-AI-MAJOR-ABSORB — czysta logika wchłaniania major AI → major AI. [importów: 1, eksportów: 6] |
| `gra/src/game/ai-moc-diag.ts` | 90 | ts | ai-moc-diag.ts — metryki diagnostyczne Mocy AI (AI-MOC-NEXT-Q1=B). [importów: 1, eksportów: 4] |
| `gra/src/game/ai-production-priorities.ts` | 28 | ts | P-AI-007=A — priorytety produkcji miasta AI z Panelu D (civ-ai.json). [importów: 0, eksportów: 3] |
| `gra/src/game/ai-resource-needs.ts` | 152 | ts | ai-resource-needs.ts — wykrywanie deficytu surowców per owner (P-AI-011 / proaktywny handel). [importów: 4, eksportów: 6] |
| `gra/src/game/ai-threat-mode.ts` | 50 | ts | P-AI-008 — tryb zagrożenia AI: jednostki + rozwój (major AI), nie mury. [importów: 0, eksportów: 8] |
| `gra/src/game/ai.ts` | 6054 | ts | AI decision module for The Game -- pure functions, no DOM, no THREE. [importów: 38, eksportów: 107] |
| `gra/src/game/alliance-war-obligation.ts` | 57 | ts | alliance-war-obligation.ts — czysta heurystyka N4: czy sojusznik honoruje obowiązek wojny. [importów: 0, eksportów: 2] |
| `gra/src/game/army-concentration.ts` | 332 | ts | Owner-agnostic concentration gate for active field armies. [importów: 3, eksportów: 15] |
| `gra/src/game/army-cycle.ts` | 128 | ts | army-cycle.ts — R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2 (Evaluator, runda PASS-WITH-NOTES, N1, [importów: 2, eksportów: 3] |
| `gra/src/game/army-starvation.ts` | 87 | ts | army-starvation.ts — głód wojska (B5-Q1 / PYTANIE-85): [importów: 2, eksportów: 4] |
| `gra/src/game/armyMerge.ts` | 1015 | ts | armyMerge.ts — stosy armii na mapie: widoczność, merge, split (v1.0). [importów: 6, eksportów: 48] |
| `gra/src/game/auto-battle-params.ts` | 42 | ts | auto-battle-params.ts — parametry auto-walki (Panel-C → auto-battle-params.json). [importów: 1, eksportów: 6] |
| `gra/src/game/auto-battle-power.ts` | 243 | ts | auto-battle-power.ts — werdykt i straty auto-walki na mocy M (kanon v2b). [importów: 3, eksportów: 11] |
| `gra/src/game/auto-improvements.ts` | 1049 | ts | auto-improvements.ts [importów: 11, eksportów: 15] |
| `gra/src/game/auto-manage.ts` | 438 | ts | auto-manage.ts [importów: 7, eksportów: 8] |
| `gra/src/game/barbarians.ts` | 2638 | ts | barbarians.ts [importów: 9, eksportów: 52] |
| `gra/src/game/battle-loot.ts` | 93 | ts | battle-loot.ts — łup po wygranej bitwie = koszt rekrutacji zniszczonych jednostek wroga. [importów: 5, eksportów: 7] |
| `gra/src/game/battle-summary.ts` | 173 | ts | battle-summary.ts — dane podsumowania po bitwie (mapa / szturm). [importów: 0, eksportów: 7] |
| `gra/src/game/border-march-scan.ts` | 61 | ts | border-march-scan.ts — P5: wykrycie par intruz→właściciel terytorium (koniec tury). [importów: 3, eksportów: 4] |
| `gra/src/game/braz-access.ts` | 53 | ts | braz-access.ts — łańcuch brązu (ABC-12/13; Maciej 2026-07-09: brąz to STOP miedzi, NIE surowiec). [importów: 1, eksportów: 5] |
| `gra/src/game/building-cost-tempo.ts` | 39 | ts | building-cost-tempo.ts [importów: 0, eksportów: 3] |
| `gra/src/game/building-resource-gate.ts` | 619 | ts | building-resource-gate.ts — bramka budynków: realne wymogi terenowe / budynkowe per budynek. [importów: 3, eksportów: 32] |
| `gra/src/game/building-stock-cost.ts` | 420 | ts | Konsument magazynu surowców przetworzonych (TEMAT #6): opcjonalny koszt `koszt_surowce` budynku pobierany z magazynu państwa przy starcie budowy. [importów: 1, eksportów: 24] |
| `gra/src/game/building-upgrades.ts` | 248 | ts | Upgrade budynków — kanon Maciej 2026-07-05 (UPG-LOC/PROD/BONUS, ABC-20…24). [importów: 2, eksportów: 19] |
| `gra/src/game/capital-capture.ts` | 326 | ts | capital-capture.ts — RDZEŃ „przejęcie stolicy" (plunder + eliminacja). [importów: 1, eksportów: 12] |
| `gra/src/game/cities.ts` | 1393 | ts | City founding logic: validation, creation, and name generation. [importów: 9, eksportów: 80] |
| `gra/src/game/citizen-resource-upkeep.ts` | 353 | ts | citizen-resource-upkeep.ts — R-ZUZYCIE-SUROWCOW-OBYWATELE (Maciej 2026-08-10, drenaż [importów: 1, eksportów: 12] |
| `gra/src/game/city-defense.ts` | 178 | ts | city-defense.ts [importów: 2, eksportów: 7] |
| `gra/src/game/city-founding.ts` | 163 | ts | city-founding.ts — koszt założenia miasta z mapy (B1 Maciej 2026-06-29). [importów: 1, eksportów: 11] |
| `gra/src/game/city-hex-clear.ts` | 74 | ts | F-CITY-HEX — heks centrum miasta wg MACIERZY B (Maciej 2026-07-09). [importów: 5, eksportów: 4] |
| `gra/src/game/city-hex-movement.ts` | 85 | ts | city-hex-movement.ts — reguły zajmowania heksu miasta (garnizon vs obcy). [importów: 2, eksportów: 6] |
| `gra/src/game/city-names-pool.ts` | 295 | ts | city-names-pool.ts — pule nazw miast per cywilizacja (B-city-names-pools). [importów: 0, eksportów: 23] |
| `gra/src/game/city-state-difficulty.ts` | 237 | ts | Trudność państw-miast vs trudność gry + reguły konsolidacji klastra (AI-CS-CLUSTER-DIFF 2026-07-30). [importów: 0, eksportów: 15] |
| `gra/src/game/civ-ai-allocation.ts` | 113 | ts | Per-civilization AI allocation profiles. [importów: 0, eksportów: 10] |
| `gra/src/game/civ-ai-data.ts` | 218 | ts | civ-ai-data.ts — odczyt per-nacja z civ-ai.json / civ-params.json (Excel 5A). [importów: 6, eksportów: 15] |
| `gra/src/game/civ-bonuses.ts` | 380 | ts | civ-bonuses.ts [importów: 1, eksportów: 17] |
| `gra/src/game/civ-entry-epoch.ts` | 88 | ts | civ-entry-epoch.ts — epoka PIERWSZEGO wejścia cywilizacji (kaskada w górę). [importów: 0, eksportów: 9] |
| `gra/src/game/civ-matrix-semantic.ts` | 636 | ts | civ-matrix-semantic.ts — read-only semantic presentation of the civilization matrix. [importów: 2, eksportów: 25] |
| `gra/src/game/civ-matrix.ts` | 142 | ts | civ-matrix.ts — odczyt mnoznikow cywilizacji z civ-matrix.json (Panel Cyw-macierz). [importów: 1, eksportów: 13] |
| `gra/src/game/civ-names.ts` | 195 | ts | civ-names.ts — wspólna sekwencja nazw (civs.json + city-names-pools.json). [importów: 3, eksportów: 15] |
| `gra/src/game/civ-roster.ts` | 177 | ts | civ-roster.ts — przypisanie typów cywilizacji AI przy starcie gry (E1-D-Q1=A). [importów: 0, eksportów: 7] |
| `gra/src/game/civ-visual.ts` | 113 | ts | civ-visual.ts — kolory wizualne cywilizacji (kolorHex z civs.json). [importów: 1, eksportów: 11] |
| `gra/src/game/cluster-start.ts` | 395 | ts | cluster-start.ts — orchestracja startu klastra (SILNIK / handoff). [importów: 9, eksportów: 5] |
| `gra/src/game/combat.ts` | 1426 | ts | PURE, deterministyczny resolver walki (kanoniczny model SS5l): mnożniki statystyk, bonusy cywilizacji, budynków i weteranów oraz moc armii; bez globalnego stanu. [importów: 12, eksportów: 35] |
| `gra/src/game/conquest-stability.ts` | 191 | ts | conquest-stability.ts [importów: 4, eksportów: 11] |
| `gra/src/game/converters.ts` | 360 | ts | converters.ts [importów: 0, eksportów: 20] |
| `gra/src/game/culture-religion.ts` | 1479 | ts | culture-religion.ts [importów: 1, eksportów: 58] |
| `gra/src/game/cyna-access.ts` | 89 | ts | cyna-access.ts — dostęp do Rudy cyny (nowy surowiec, Maciej 2026-08-13). Wzorem [importów: 2, eksportów: 6] |
| `gra/src/game/danina-nazwa.ts` | 64 | ts | danina-nazwa.ts [importów: 0, eksportów: 7] |
| `gra/src/game/defenseBreakdown.ts` | 322 | ts | defenseBreakdown.ts [importów: 2, eksportów: 12] |
| `gra/src/game/diag-log.ts` | 172 | ts | diag-log.ts — pierścień zdarzeń diagnostycznych (błędy, load/save, sesja). [importów: 0, eksportów: 11] |
| `gra/src/game/difficulty-cost.ts` | 136 | ts | difficulty-cost.ts [importów: 3, eksportów: 9] |
| `gra/src/game/diplomacy-acceptance-points.ts` | 715 | ts | diplomacy-acceptance-points.ts — punkty akceptacji stołu negocjacji (Maciej 2026-07-29). [importów: 7, eksportów: 16] |
| `gra/src/game/diplomacy-ai-balance.ts` | 639 | ts | diplomacy-ai-balance.ts — R-HANDEL-AI-FALA: AI trade proposals vs real resources. [importów: 4, eksportów: 10] |
| `gra/src/game/diplomacy-ai-offer-balance.ts` | 686 | ts | diplomacy-ai-offer-balance.ts — D-DYPLO-AI-OFERTA-ZERO (Maciej 2026-07-29). [importów: 6, eksportów: 23] |
| `gra/src/game/diplomacy-audience-actions.ts` | 134 | ts | diplomacy-audience-actions.ts — budowa listy akcji audiencji z katalogu JSON [importów: 2, eksportów: 8] |
| `gra/src/game/diplomacy-barbarian-cooperation.ts` | 82 | ts | R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1. [importów: 4, eksportów: 7] |
| `gra/src/game/diplomacy-basket-transfer.ts` | 289 | ts | diplomacy-basket-transfer.ts — transfer tech + surowiec boolean z koszyka PN (P6). [importów: 3, eksportów: 13] |
| `gra/src/game/diplomacy-border-march.ts` | 296 | ts | diplomacy-border-march.ts — kara za nieautoryzowany przemarsz (D3-BORD, P5). [importów: 5, eksportów: 11] |
| `gra/src/game/diplomacy-credibility.ts` | 684 | ts | diplomacy-credibility.ts — Wiarygodność cywilizacji (Etap 1: rdzeń). [importów: 2, eksportów: 37] |
| `gra/src/game/diplomacy-currency-trade.ts` | 39 | ts | diplomacy-currency-trade.ts — kurs wymiany ¤ ↔ Praca (handel dyplomatyczny v1). [importów: 1, eksportów: 3] |
| `gra/src/game/diplomacy-deposit-trade.ts` | 67 | ts | diplomacy-deposit-trade.ts — cennik dostępu do złoża (handel dyplomatyczny v1). [importów: 1, eksportów: 5] |
| `gra/src/game/diplomacy-display.ts` | 731 | ts | diplomacy-display.ts — dane prezentacyjne dyplomacji (D3-UX BBBB, lane CYW). [importów: 11, eksportów: 34] |
| `gra/src/game/diplomacy-economy.ts` | 325 | ts | diplomacy-economy.ts — rozliczenia trybutu / handlu v1.1 (lane EKO). [importów: 1, eksportów: 34] |
| `gra/src/game/diplomacy-factors.ts` | 204 | ts | diplomacy-factors.ts — rejestr per-para czynników relacji + rozbicie [importów: 1, eksportów: 10] |
| `gra/src/game/diplomacy-goods.ts` | 138 | ts | diplomacy-goods.ts — indeks dóbr handlowych PER WŁAŚCICIEL (domknięcie zaległości #3, [importów: 0, eksportów: 7] |
| `gra/src/game/diplomacy-layers.ts` | 374 | ts | diplomacy-layers.ts — warstwy dyplomacji D-START-2B / 3A. [importów: 4, eksportów: 25] |
| `gra/src/game/diplomacy-locks.ts` | 341 | ts | diplomacy-locks.ts — logika blokad akcji dyplomatycznych (Makieta DYPLOMACJA [importów: 0, eksportów: 6] |
| `gra/src/game/diplomacy-pair-summary.ts` | 113 | ts | diplomacy-pair-summary.ts — R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA. [importów: 3, eksportów: 4] |
| `gra/src/game/diplomacy-peace-lock.ts` | 57 | ts | diplomacy-peace-lock.ts — karencja po zawarciu pokoju / rozejmu (Maciej 2026-08-01). [importów: 2, eksportów: 4] |
| `gra/src/game/diplomacy-penalty-preview.ts` | 172 | ts | diplomacy-penalty-preview.ts — podgląd kar Wiarygodności / Zaufania PRZED akcją gracza. [importów: 3, eksportów: 7] |
| `gra/src/game/diplomacy-pn-engine.ts` | 476 | ts | diplomacy-pn-engine.ts — stan per para + logika PN→Zaufanie (D4-WYMIANA-PN). [importów: 6, eksportów: 30] |
| `gra/src/game/diplomacy-proposals.ts` | 2734 | ts | diplomacy-proposals.ts — ocena propozycji dyplomatycznych v1.1 (lane CYW). [importów: 14, eksportów: 61] |
| `gra/src/game/diplomacy-rejection-cooldown.ts` | 83 | ts | diplomacy-rejection-cooldown.ts — D-DYPLO-AI-NO-NAG (Maciej 2026-07-29). [importów: 1, eksportów: 7] |
| `gra/src/game/diplomacy-resource-trade-pick.ts` | 234 | ts | diplomacy-resource-trade-pick.ts — wybór kierunku handlu surowcem między dwoma ownerami. [importów: 2, eksportów: 10] |
| `gra/src/game/diplomacy-tech-trade.ts` | 236 | ts | diplomacy-tech-trade.ts — R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE (2026-08-08, playtest Macieja). [importów: 2, eksportów: 8] |
| `gra/src/game/diplomacy-trade-validation.ts` | 36 | ts | Walidacja stron koszyka wymiany — logika czysta (testowalna bez UI). [importów: 1, eksportów: 3] |
| `gra/src/game/diplomacy-treaties.ts` | 448 | ts | diplomacy-treaties.ts — aktywne traktaty v1.1 (lane CYW). [importów: 2, eksportów: 33] |
| `gra/src/game/diplomacy-unit-transfer.ts` | 74 | ts | diplomacy-unit-transfer.ts — P6: spawn jednostki z koszyka wymiany PN. [importów: 3, eksportów: 4] |
| `gra/src/game/diplomacy-value-catalog.ts` | 731 | ts | diplomacy-value-catalog.ts — wspólny katalog PN (handel, dar, przekupstwo). [importów: 10, eksportów: 40] |
| `gra/src/game/diplomacy-war-gates.ts` | 54 | ts | diplomacy-war-gates.ts — wspólne bramki wojny (Maciej 2026-08-01). [importów: 1, eksportów: 6] |
| `gra/src/game/diplomacy.ts` | 1766 | ts | diplomacy.ts [importów: 10, eksportów: 45] |
| `gra/src/game/display-names.ts` | 311 | ts | display-names.ts — etykiety państw vs miast-państw klastra (Maciej 2026-07-07). [importów: 0, eksportów: 19] |
| `gra/src/game/economy-upkeep.ts` | 1174 | ts | economy-upkeep.ts [importów: 5, eksportów: 67] |
| `gra/src/game/economy.ts` | 1340 | ts | City economy logic for The Game -- pure module, no DOM, no THREE. [importów: 6, eksportów: 35] |
| `gra/src/game/effective-difficulty-for-owner.ts` | 15 | ts | P-AI-PROD-GATE-Q1=A — trudność efektywna per owner (major vs miasto-państwo). [importów: 1, eksportów: 1] |
| `gra/src/game/embarkation.ts` | 133 | ts | embarkation.ts — TEMAT #15: embarkacja jednostek lądowych (gracz + AI + Ludy Morza). [importów: 7, eksportów: 10] |
| `gra/src/game/empire-city-defaults.ts` | 554 | ts | empire-city-defaults.ts — R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE=A (Maciej 2026-08-09). [importów: 3, eksportów: 24] |
| `gra/src/game/empire-diplo-resource-flow.ts` | 37 | ts | empire-diplo-resource-flow.ts — przepływy surowców z umów dyplomatycznych (per turę). [importów: 1, eksportów: 2] |
| `gra/src/game/empire-food.ts` | 1074 | ts | empire-food.ts — centralny magazyn żywności (PYTANIE-85). [importów: 9, eksportów: 39] |
| `gra/src/game/empire-handel-split.ts` | 84 | ts | empire-handel-split.ts — globalny domyślny podział Daniny/Podatku (DYSPOZYCJA-85-SUWAK=C). [importów: 2, eksportów: 4] |
| `gra/src/game/empire-hud-totals.ts` | 99 | ts | empire-hud-totals.ts — R-HUD-MIASTO-STAN-CYWILIZACJI (2026-08-08, playtest Macieja). [importów: 0, eksportów: 5] |
| `gra/src/game/eot-event-defer.ts` | 260 | ts | R-EOT-EVENT-DEFER-Q1=A — skutki końca tury nie migają w overlay; czekają na start tury gracza. [importów: 1, eksportów: 6] |
| `gra/src/game/era-change-notify.ts` | 49 | ts | era-change-notify.ts — komunikat graczowi przy awansie epoki (ownerId 0). [importów: 0, eksportów: 8] |
| `gra/src/game/era-gate-ui.ts` | 147 | ts | era-gate-ui.ts — R-EPOKA-CUD-ZAKRES-Q1=B: informacja UI "co brakuje do awansu epoki". [importów: 4, eksportów: 7] |
| `gra/src/game/first-player-city.ts` | 49 | ts | R-PIERWSZE-MIASTO (decyzja B): gracz z 0 miast może wyłącznie założyć pierwsze [importów: 0, eksportów: 5] |
| `gra/src/game/forced-war-bronze.ts` | 277 | ts | Wymuszona wojna epoki Brąz: główna cywilizacja AI bez aktywnej wojny wypowiada wojnę sąsiadowi; koniec po zdobyciu/utracie N miast, potem odpoczynek i cooldown. [importów: 1, eksportów: 17] |
| `gra/src/game/forced-war-common.ts` | 413 | ts | Wspólny, czysty mechanizm wojen wymuszonych. [importów: 0, eksportów: 17] |
| `gra/src/game/forced-war-iron.ts` | 292 | ts | Wymuszona wojna epoki Żelazo (trzecia i ostatnia epoka): mechanizm naśladuje Brąz, wyzwalany awansem epoki (R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1). [importów: 1, eksportów: 17] |
| `gra/src/game/forced-war-stone.ts` | 163 | ts | Wymuszona wojna epoki Kamień: stałe (start od tury 25, limity miast, odpoczynku, cooldownu, czasu trwania pary wojny) i logika oparta o forced-war-common. [importów: 1, eksportów: 17] |
| `gra/src/game/forced-war-waves.ts` | 293 | ts | Fale wymuszonej wojny: wybór świeżej fali z wolnych jednostek (kierunek sektorowy od miasta celu) oraz typy stanu i historii fal. [importów: 3, eksportów: 12] |
| `gra/src/game/fort-territory.ts` | 214 | ts | game/fort-territory.ts [importów: 3, eksportów: 9] |
| `gra/src/game/fsa-autosave.ts` | 530 | ts | fsa-autosave.ts [importów: 1, eksportów: 24] |
| `gra/src/game/gold-deficit.ts` | 250 | ts | gold-deficit.ts — kara za deficyt Złota (R-DEFICYT-ZLOTA-KARA-Q1=A), próg [importów: 2, eksportów: 17] |
| `gra/src/game/growth-happiness.ts` | 30 | ts | Wspólny, jawnie ograniczony kontrakt kanałów Szczęścia używany przez [importów: 0, eksportów: 1] |
| `gra/src/game/human-owners.ts` | 71 | ts | human-owners.ts [importów: 2, eksportów: 7] |
| `gra/src/game/idb-storage.ts` | 205 | ts | idb-storage.ts [importów: 0, eksportów: 5] |
| `gra/src/game/improvement-tech.ts` | 181 | ts | improvement-tech.ts — tech gate ulepszeń terenu + logika wycinki lasu (wyrąb). [importów: 2, eksportów: 14] |
| `gra/src/game/inca-llama-seed.ts` | 66 | ts | inca-llama-seed.ts — POSIEW LAMY przy starcie Inków (decyzja 3a, Maciej 2026-07-09). [importów: 3, eksportów: 3] |
| `gra/src/game/livestock-unlock.ts` | 175 | ts | livestock-unlock.ts — odblokowanie hodowli (Model B 2026-07-09). [importów: 3, eksportów: 13] |
| `gra/src/game/load-map-source.ts` | 57 | ts | load-map-source.ts [importów: 3, eksportów: 2] |
| `gra/src/game/manpower.ts` | 877 | ts | manpower.ts — ludność absolutna i pula Manpower per miasto (EKONOMIA). [importów: 4, eksportów: 52] |
| `gra/src/game/map-rebels.ts` | 91 | ts | map-rebels.ts — buntownicy mapowi od epoki Średniowiecze (ABC 11=C*). [importów: 3, eksportów: 5] |
| `gra/src/game/mapSiegeDetect.ts` | 95 | ts | mapSiegeDetect.ts — klasyfikacja starcia przy ataku miasta z mapy (C1/C3). [importów: 3, eksportów: 8] |
| `gra/src/game/mennica-zloto-grace.ts` | 108 | ts | mennica-zloto-grace.ts — 1 tura łaski Mennicy po utracie dostępu do złota. [importów: 0, eksportów: 10] |
| `gra/src/game/okolica.ts` | 815 | ts | Wybor obrabianych pol miasta -- czysta logika (bez DOM/THREE/I/O). [importów: 10, eksportów: 27] |
| `gra/src/game/order.ts` | 567 | ts | City "Porządek" (Order) logic for The Game — pure module, no DOM, no THREE, [importów: 0, eksportów: 19] |
| `gra/src/game/owner-epoch.ts` | 128 | ts | owner-epoch.ts — epoka imperium AI z badań (nie z etykiety Epoka w tech.json). [importów: 5, eksportów: 6] |
| `gra/src/game/owner-utils.ts` | 17 | ts | owner-utils.ts [importów: 1, eksportów: 1] |
| `gra/src/game/pending-improvements.ts` | 74 | ts | pending-improvements.ts — ulepszenia terenu w bieżącej turze (cofanie do endTurn). [importów: 2, eksportów: 4] |
| `gra/src/game/planned-march.ts` | 479 | ts | planned-march.ts — A3 zaplanowany marsz (pure logic). [importów: 3, eksportów: 18] |
| `gra/src/game/playerState.ts` | 675 | ts | playerState.ts [importów: 8, eksportów: 27] |
| `gra/src/game/playtestMapaSwiata.ts` | 259 | ts | playtestMapaSwiata.ts [importów: 9, eksportów: 7] |
| `gra/src/game/playtestMiastoEkonomia.ts` | 184 | ts | playtestMiastoEkonomia.ts [importów: 10, eksportów: 5] |
| `gra/src/game/playtestOdskok3v3.ts` | 307 | ts | playtestOdskok3v3.ts [importów: 7, eksportów: 8] |
| `gra/src/game/playtestWalkaMapy.ts` | 499 | ts | playtestWalkaMapy.ts [importów: 7, eksportów: 17] |
| `gra/src/game/population-growth-tempo.ts` | 41 | ts | population-growth-tempo.ts [importów: 0, eksportów: 3] |
| `gra/src/game/population-growth-v85.ts` | 580 | ts | population-growth-v85.ts — racje żywności (Wyżywienie 0–6, krok 0,5). [importów: 13, eksportów: 35] |
| `gra/src/game/post-battle-map.ts` | 561 | ts | post-battle-map.ts — wspólne skutki walki na mapie (auto + ręczna 3D). [importów: 13, eksportów: 14] |
| `gra/src/game/post-capture-law.ts` | 170 | ts | post-capture-law.ts — bonus Prawa po zdobyciu miasta (B-LAW-Q1). [importów: 3, eksportów: 15] |
| `gra/src/game/power-objective.ts` | 279 | ts | power-objective.ts — obiektywny POWER imperium (Maciej 2026-06-26, kanon P-A). [importów: 1, eksportów: 12] |
| `gra/src/game/power-options.ts` | 68 | ts | power-options.ts — opcje Moc/Power z power-params.json (Panel-B → Potega-opcje). [importów: 1, eksportów: 4] |
| `gra/src/game/power-ranking.ts` | 72 | ts | power-ranking.ts — lista państw widocznych w rankingu Mocy (panel imperium + overlay). [importów: 1, eksportów: 4] |
| `gra/src/game/power.ts` | 114 | ts | Składniki Potęgi z domeny miasto/ekonomia (B-Power-Q1=A, Q2=B, Q3=A). [importów: 0, eksportów: 4] |
| `gra/src/game/production.ts` | 2380 | ts | production.ts [importów: 12, eksportów: 78] |
| `gra/src/game/r-stawki-strojenie.ts` | 64 | ts | R-STAWKI-STROJENIE 2026-08-03 — Maciej: ×2 koszty (nie dochody). Playtest → ustaw 1 aby cofnąć. [importów: 0, eksportów: 9] |
| `gra/src/game/rally-point.ts` | 85 | ts | rally-point.ts — owner-wide rally point state. [importów: 2, eksportów: 7] |
| `gra/src/game/relief-preserving-improvements.ts` | 44 | ts | relief-preserving-improvements.ts — ulepszenia terenu, które NIE spłaszczają wzgórza/góry [importów: 0, eksportów: 2] |
| `gra/src/game/research.ts` | 627 | ts | Technology research logic for The Game -- pure module, no DOM, no THREE. [importów: 0, eksportów: 30] |
| `gra/src/game/resource-access.ts` | 362 | ts | resource-access.ts — surowce w zasięgu miasta (ABC-19: potencjał vs dostęp aktywny). [importów: 12, eksportów: 10] |
| `gra/src/game/resource-usage-breakdown.ts` | 137 | ts | resource-usage-breakdown.ts — P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA (Maciej 2026-08-12, [importów: 0, eksportów: 5] |
| `gra/src/game/ruch-swiata-tempo.ts` | 43 | ts | ruch-swiata-tempo.ts [importów: 0, eksportów: 3] |
| `gra/src/game/save-label.ts` | 68 | ts | save-label.ts — domyślne nazwy zapisów (manual / szybki / autozapis). [importów: 1, eksportów: 4] |
| `gra/src/game/save.ts` | 1114 | ts | SAVE / LOAD (task F1) -- serialize the live game state to a JSON string and [importów: 10, eksportów: 29] |
| `gra/src/game/scout-auto-explore.ts` | 280 | ts | scout-auto-explore.ts — automatyczne zwiedzanie mapy przez zwiadowców. [importów: 3, eksportów: 7] |
| `gra/src/game/side-panel-event-link.ts` | 114 | ts | side-panel-event-link.ts — P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1. [importów: 0, eksportów: 5] |
| `gra/src/game/side-panel-event-priority.ts` | 9 | ts | Reguła blokującego zdarzenia panelu bocznego: tylko karty wymagające decyzji gracza (`blocking === true`) blokują koniec tury. [importów: 1, eksportów: 1] |
| `gra/src/game/siege.ts` | 866 | ts | PURE, deterministic, DOM-free city-siege logic for The Game (4X Civ-style). [importów: 3, eksportów: 32] |
| `gra/src/game/siegeAi.ts` | 292 | ts | Pure, deterministic AI siege stance logic (C3-Q2=custom). [importów: 2, eksportów: 18] |
| `gra/src/game/siegeDefenders.ts` | 162 | ts | siegeDefenders.ts — kto broni miasto przy szturmie / zdobyciu (C3-ST-1…3). [importów: 4, eksportów: 13] |
| `gra/src/game/siegeMachines.ts` | 83 | ts | siegeMachines.ts — kolejka machin oblężniczych (C3-Q8=C, OBL-S5). [importów: 0, eksportów: 10] |
| `gra/src/game/society-breakdown.ts` | 1139 | ts | society-breakdown.ts [importów: 3, eksportów: 53] |
| `gra/src/game/society-inputs.ts` | 122 | ts | society-inputs.ts — pomocnicze wejścia do evaluateOrderFromBreakdown (B2-Q8=2A). [importów: 4, eksportów: 8] |
| `gra/src/game/spich-auto-ration-notify.ts` | 31 | ts | spich-auto-ration-notify.ts — komunikaty SPICH-AUTO-Q1 (auto-obniżenie racji). [importów: 3, eksportów: 3] |
| `gra/src/game/start-preview.ts` | 129 | ts | start-preview.ts — podgląd startu klastra (kreator nowej gry → SILNIK). [importów: 4, eksportów: 4] |
| `gra/src/game/tech-tempo.ts` | 40 | ts | tech-tempo.ts [importów: 0, eksportów: 3] |
| `gra/src/game/tech-tree.ts` | 161 | ts | tech-tree.ts — B1-Q3 drzewko liniowe (Maciej 2026-06-28, opcja B). [importów: 1, eksportów: 8] |
| `gra/src/game/terrain-improvements.ts` | 484 | ts | terrain-improvements.ts [importów: 4, eksportów: 35] |
| `gra/src/game/trade-routes.ts` | 2091 | ts | trade-routes.ts — Handel E2/E3: wykrywanie połączeń miast + dochód z tras. [importów: 5, eksportów: 49] |
| `gra/src/game/triumph-city-state.ts` | 80 | ts | triumph-city-state.ts — triumf po zjednoczeniu miast-państw tej samej kultury (P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1=A). [importów: 1, eksportów: 5] |
| `gra/src/game/turn-economy.ts` | 2967 | ts | turn-economy.ts [importów: 29, eksportów: 47] |
| `gra/src/game/unit-building-bonuses.ts` | 526 | ts | unit-building-bonuses.ts [importów: 0, eksportów: 33] |
| `gra/src/game/unit-card-stats.ts` | 121 | ts | unit-card-stats.ts — efektywne staty bojowe na karcie jednostki (C-UNIT-CARD-Q1–Q3). [importów: 3, eksportów: 4] |
| `gra/src/game/unit-cost-tempo.ts` | 39 | ts | unit-cost-tempo.ts [importów: 0, eksportów: 3] |
| `gra/src/game/unit-power.ts` | 207 | ts | unit-power.ts — moc jednostki (pole vs oblężenie), TW v3. [importów: 1, eksportów: 11] |
| `gra/src/game/unit-replace-context.ts` | 63 | ts | unit-replace-context.ts [importów: 1, eksportów: 2] |
| `gra/src/game/veteran.ts` | 424 | ts | TRZECI, NIEZALEŻNY system trwałych ulepszeń jednostek: doświadczenie bojowe [importów: 0, eksportów: 40] |
| `gra/src/game/victory.ts` | 239 | ts | Victory / defeat condition checks (warunki zwyciestwa). [importów: 2, eksportów: 19] |
| `gra/src/game/villageRewards.ts` | 220 | ts | villageRewards.ts [importów: 4, eksportów: 19] |
| `gra/src/game/visibility.ts` | 328 | ts | visibility.ts [importów: 7, eksportów: 21] |
| `gra/src/game/wealth.ts` | 251 | ts | System WEALTH (zamoznosc spoleczenstwa) -- czysty modul, bez DOM/THREE, ZERO importow. [importów: 0, eksportów: 15] |
| `gra/src/game/wiarygodnosc-types.ts` | 58 | ts | wiarygodnosc-types.ts — Etap 0: typy i struktury Wiarygodności (bez logiki tick / bez Dźwigni 1). [importów: 0, eksportów: 7] |
| `gra/src/game/wonder-availability.ts` | 120 | ts | wonder-availability.ts — bramka dostępności budowy cudu (pure logic). [importów: 3, eksportów: 6] |
| `gra/src/game/wonder-civ-tech.ts` | 110 | ts | wonder-civ-tech.ts — reguła techUnlock cudów E vs epokaWejscia państwa. [importów: 1, eksportów: 7] |
| `gra/src/game/wonder-map-build.ts` | 69 | ts | wonder-map-build.ts — budowa cudów na heksie mapy (nie kolejka miasta). [importów: 0, eksportów: 4] |
| `gra/src/game/wonders-data.ts` | 312 | ts | wonders-data.ts — odczyt cudów świata (gra/data/wonders.json). [importów: 1, eksportów: 27] |
| `gra/src/game/zelazo-access.ts` | 89 | ts | zelazo-access.ts — dostęp do żelaza (decyzja właściciela 2026-07-19, korekta 2026-07-30). [importów: 2, eksportów: 8] |
| `gra/src/game/zloto-access.ts` | 145 | ts | zloto-access.ts — Złoto w magazynie państwa (PYTANIE-84-R9, U-13, Maciej 2026-07-27). [importów: 1, eksportów: 14] |

## `gra/src/ui` — 438 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/ui/aiCivPicker.ts` | 76 | ts | aiCivPicker.ts — logika multi-select cywilizacji przeciwnika w kreatorze (krok 4), [importów: 0, eksportów: 4] |
| `gra/src/ui/armyListHud.ts` | 368 | ts | armyListHud.ts — lista armii gracza na mapie (po kliknięciu medalionu Armia w [importów: 5, eksportów: 11] |
| `gra/src/ui/armyMergePanel.ts` | 221 | ts | armyMergePanel.ts — makieta połączenia armii (v1.0). [importów: 3, eksportów: 5] |
| `gra/src/ui/armyMergePickPanel.ts` | 183 | ts | armyMergePickPanel.ts — wybór jednostek i sąsiedniego stosu do połączenia (v1.0). [importów: 3, eksportów: 5] |
| `gra/src/ui/armySplitPanel.ts` | 185 | ts | armySplitPanel.ts — rozdzielenie stosu armii na dwa heksy (v1.0). [importów: 3, eksportów: 5] |
| `gra/src/ui/armyStackHud.ts` | 380 | ts | armyStackHud.ts — dolny pasek armii (A-06 · 1E). [importów: 6, eksportów: 5] |
| `gra/src/ui/armyStackPrompt.ts` | 211 | ts | Okno „Zajęty heks”: pyta gracza o scalenie armii (Połącz / Nie łącz) przy wejściu jednostki na zajęty heks; DOM-only, bez importów z game/ i types/. [importów: 1, eksportów: 4] |
| `gra/src/ui/assets/hero/hero-intro.png` | 7342 | png | obraz (PNG) |
| `gra/src/ui/assets/hero/hero-menu.png` | 7733 | png | obraz (PNG) |
| `gra/src/ui/bottomBarHud.ts` | 335 | ts | bottomBarHud.ts — dolny pasek [I]/[I2]: WYKONAJ + Koniec tury (A1-Q9=A, A1-Q10). [importów: 3, eksportów: 3] |
| `gra/src/ui/brandTokenVars.ts` | 118 | ts | Warstwa 1 — wspólne tokeny CSS (decyzje 1B, 2C, 4C, 5C). [importów: 2, eksportów: 3] |
| `gra/src/ui/buildModeHud.ts` | 963 | ts | buildModeHud.ts — tryb 🔨 Budowa (A4-Q1=A, A4-D4-Q1=A). [importów: 7, eksportów: 5] |
| `gra/src/ui/buildStampToggle.ts` | 100 | ts | buildStampToggle.ts — ukrywa pieczęć builda (inject-build-stamp.ps1) domyślnie; [importów: 0, eksportów: 1] |
| `gra/src/ui/buildingHoverTooltip.ts` | 7 | ts | @deprecated Użyj hoverDetailDock.ts — zachowane dla kompatybilności importów. [importów: 0, eksportów: 0] |
| `gra/src/ui/cityAttackChoice.ts` | 239 | ts | cityAttackChoice.ts -- wybor akcji przy ataku miasta z murem (C3-Q1=A). [importów: 3, eksportów: 4] |
| `gra/src/ui/cityCaptureNotice.ts` | 356 | ts | cityCaptureNotice.ts — tabliczka po zdobyciu miasta. [importów: 2, eksportów: 6] |
| `gra/src/ui/cityForeignPick.ts` | 244 | ts | cityForeignPick.ts — wybór przy kliknięciu obcego miasta: informacja o heksie/mieście [importów: 2, eksportów: 4] |
| `gra/src/ui/cityListHud.ts` | 332 | ts | cityListHud.ts — lista miast gracza na mapie świata (po kliknięciu medalionu Miasta [importów: 5, eksportów: 11] |
| `gra/src/ui/cityPanel.ts` | 11986 | ts | cityPanel.ts [importów: 66, eksportów: 22] |
| `gra/src/ui/cityUnitPick.ts` | 265 | ts | cityUnitPick.ts — wybór: panel miasta vs zaznaczenie jednostki (ten sam heks). [importów: 3, eksportów: 4] |
| `gra/src/ui/cityUxFrame.ts` | 296 | ts | cityUxFrame.ts — ramka panelu miasta (Civ V): lewo=produkcja, prawo=okolica, mapa centralna. [importów: 7, eksportów: 6] |
| `gra/src/ui/civBrandDisplay.ts` | 68 | ts | civBrandDisplay.ts — krótka linia wyróżnika cywilizacji (styl + jednostka specjalna). [importów: 1, eksportów: 4] |
| `gra/src/ui/civElimNotice.ts` | 124 | ts | civElimNotice.ts — modal „ELIMINACJA!" dla wchłonięcia dyplomatycznego (miasto-państwo lub [importów: 1, eksportów: 3] |
| `gra/src/ui/contextPanelHud.ts` | 63 | ts | contextPanelHud.ts — panel kontekstowy (strefa C mockupu HUD Mapy 1E). [importów: 3, eksportów: 3] |
| `gra/src/ui/diploListHud.ts` | 502 | ts | diploListHud.ts — lista cywilizacji do dyplomacji (toolbar tb-diplomacy). [importów: 7, eksportów: 16] |
| `gra/src/ui/diploUiSkin.ts` | 231 | ts | diploUiSkin.ts — wspólny skin 1E dla modułów dyplomacji (P1 reskin). [importów: 4, eksportów: 14] |
| `gra/src/ui/diplomacyAcceptanceBalance.ts` | 911 | ts | diplomacyAcceptanceBalance.ts — panel punktów wymiany (PW) na stole negocjacji. [importów: 5, eksportów: 16] |
| `gra/src/ui/diplomacyAudience.ts` | 2443 | ts | diplomacyAudience.ts — ekran audiencji dyplomatycznej (D3-Q1…Q4). [importów: 18, eksportów: 32] |
| `gra/src/ui/diplomacyDealDisplay.ts` | 312 | ts | diplomacyDealDisplay.ts — czytelny HTML ofert handlowych (ikony surowców + rozpiska). [importów: 4, eksportów: 9] |
| `gra/src/ui/diplomacyNegotiationModal.ts` | 562 | ts | diplomacyNegotiationModal.ts — modale negocjacji audiencji v1.1 (lane UI). [importów: 6, eksportów: 7] |
| `gra/src/ui/diplomacyPanel.ts` | 533 | ts | diplomacyPanel.ts [importów: 3, eksportów: 19] |
| `gra/src/ui/diplomacyPendingHud.ts` | 87 | ts | diplomacyPendingHud.ts — modal odpowiedzi na propozycję AI (A1-Q18 blocking). [importów: 1, eksportów: 3] |
| `gra/src/ui/diplomacyProposalBanner.ts` | 55 | ts | diplomacyProposalBanner.ts — wynik negocjacji po evaluateProposal. [importów: 1, eksportów: 2] |
| `gra/src/ui/diplomacyTradeBasket.ts` | 2851 | ts | diplomacyTradeBasket.ts — koszyk handlu / daru (PN) v1.0 (lane UI, P4). [importów: 24, eksportów: 19] |
| `gra/src/ui/empireBalance.ts` | 115 | ts | empireBalance.ts [importów: 1, eksportów: 7] |
| `gra/src/ui/empireDetailPanel.ts` | 4433 | ts | empireDetailPanel.ts — panel boczny imperium (HUD mapy): parametry + Moc + zasoby + kultura. [importów: 19, eksportów: 25] |
| `gra/src/ui/empireDetailTypes.ts` | 732 | ts | empireDetailTypes.ts — snapshot panelu imperium (HUD mapy). [importów: 2, eksportów: 30] |
| `gra/src/ui/empireMiastaTable.ts` | 144 | ts | empireMiastaTable.ts — P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA punkt 2 (Maciej 2026-08-12, [importów: 0, eksportów: 8] |
| `gra/src/ui/empireOverlayHud.ts` | 138 | ts | empireOverlayHud.ts — overlaye imperium: Kultura + Religia (A1-Q16=A). [importów: 2, eksportów: 5] |
| `gra/src/ui/empirePanelSectionMap.ts` | 151 | ts | empirePanelSectionMap.ts — mapowanie żetonów HUD → blok panelu imperium (R-PANEL-SPLIT). [importów: 0, eksportów: 5] |
| `gra/src/ui/entityCards/buildingAdapter.ts` | 340 | ts | entityCards/buildingAdapter.ts — `BuildingDef` (`buildings.json`) → `EntityCardData` [importów: 13, eksportów: 2] |
| `gra/src/ui/entityCards/civpediaOpenGate.ts` | 60 | ts | entityCards/civpediaOpenGate.ts — szew (seam) między KARTĄ ENCJI a HUBEM CIVPEDII. [importów: 0, eksportów: 4] |
| `gra/src/ui/entityCards/improvementAdapter.ts` | 249 | ts | entityCards/improvementAdapter.ts — pełne wypełnienie (T7b, KARTA-ULEPSZENIA-TERENU): [importów: 5, eksportów: 1] |
| `gra/src/ui/entityCards/registry.ts` | 194 | ts | entityCards/registry.ts — resolvery `id → surowy wiersz` per kind (plan §2). [importów: 9, eksportów: 12] |
| `gra/src/ui/entityCards/renderer.ts` | 1212 | ts | entityCards/renderer.ts — jeden DOM-builder dla wszystkich 4 kinds (plan §1). [importów: 11, eksportów: 4] |
| `gra/src/ui/entityCards/slug.ts` | 49 | ts | entityCards/slug.ts — slugify NIEZALEŻNY od dwóch istniejących implementacji. [importów: 0, eksportów: 1] |
| `gra/src/ui/entityCards/technologyAdapter.ts` | 386 | ts | entityCards/technologyAdapter.ts — `RawTech` (`tech.json`) → `EntityCardData` (T3). [importów: 10, eksportów: 1] |
| `gra/src/ui/entityCards/types.ts` | 209 | ts | entityCards/types.ts — wspólny kontrakt karty encji (T1 KONTRAKT-KARTA-ENCJI). [importów: 0, eksportów: 15] |
| `gra/src/ui/entityCards/unitAdapter.ts` | 291 | ts | entityCards/unitAdapter.ts — `UnitDef` (`units.json`) → `EntityCardData` (T4, rozszerzone w T6). [importów: 6, eksportów: 1] |
| `gra/src/ui/entityCards/wonderAdapter.ts` | 156 | ts | entityCards/wonderAdapter.ts — R-KARTY-HISTORIA-INFRA-CUDA-Q1: surowy wiersz [importów: 3, eksportów: 1] |
| `gra/src/ui/escapeOverlayStack.ts` | 140 | ts | escapeOverlayStack.ts [importów: 0, eksportów: 10] |
| `gra/src/ui/formatPl.ts` | 64 | ts | Odmiana „jednostka" (1 / 2–4 / 5+). [importów: 0, eksportów: 7] |
| `gra/src/ui/gamePauseMenu.ts` | 317 | ts | gamePauseMenu.ts — menu pomocnicze w trakcie gry (zapis / wczytaj / nowa / menu główne). [importów: 2, eksportów: 7] |
| `gra/src/ui/hexContextTooltip.ts` | 992 | ts | hexContextTooltip.ts — treść panelu kontekstowego mapy (heks / jednostka, D17=A). [importów: 19, eksportów: 6] |
| `gra/src/ui/hotSeatHandoff.ts` | 135 | ts | hotSeatHandoff.ts [importów: 2, eksportów: 4] |
| `gra/src/ui/hoverDetailDock.ts` | 412 | ts | Panel szczegółów przy hover — wysuwa się obok kolumny UX (lewo / prawo). [importów: 0, eksportów: 13] |
| `gra/src/ui/hud.ts` | 1861 | ts | HUD w grze (UI plan pkt 3, D1=C) — gorny pasek zasobow + minimapa + panel boczny. [importów: 32, eksportów: 11] |
| `gra/src/ui/hudChip6c.ts` | 76 | ts | Chip HUD 6C (Design System 1E) — medalion + etykieta PL + wartość + przyrost. [importów: 5, eksportów: 4] |
| `gra/src/ui/hudLayout.ts` | 84 | ts | hudLayout.ts — jedno źródło prawdy dla marginesów HUD mapy i miasta (mockup 1E, FALA 60). [importów: 0, eksportów: 36] |
| `gra/src/ui/hudPanelDismiss.ts` | 29 | ts | Zamyka panel HUD po kliknięciu poza panelem (mapa, inne UI). [importów: 0, eksportów: 1] |
| `gra/src/ui/hudTitleTooltip.ts` | 278 | ts | hudTitleTooltip.ts — większe podpisy hover (atrybut title) dla HUD / toolbar / ikon. [importów: 0, eksportów: 1] |
| `gra/src/ui/icons/brand/aquila-emblem.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/building-icon-map.json` | 46 | json | dane JSON |
| `gra/src/ui/icons/brand/buildings/bld-admin.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-akademia.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-akademia_wojskowa.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-akwedukt.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-biblioteka.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-cegielnia.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-culture.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-default.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-defense.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-food.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-fort.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-garncarnia.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-garnizon.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-health.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-kamieniarski.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-kamienne_kregi.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-karawanseraj.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-koszary.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-kuznia.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-kuznia_zelaza.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-lazaret.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-laznia_publiczna.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-magazyn.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-mennica.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-mielerz.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-military.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-monument.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-mury.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-odlewnia_brazu.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-odlewnia_zelaza.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-palac.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-palisada.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-port.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-port_wielki.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-pretorium.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-production.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-religion.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-sad.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-science.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-spichlerz.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-stela.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-stolarnia.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-storage.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-studnia.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-swiatynia.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-targowisko.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-teatr.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-trade.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-warsztat_oblezniczy.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/buildings/bld-wielka_kuznia.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/chip-crate.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/chip-death.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/chip-garrison.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/chip-heart.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/chip-manpower.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/chip-map.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/chip-star.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/chip-trend-up.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/chip-warning.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civ-icon-map.json` | 20 | json | dane JSON |
| `gra/src/ui/icons/brand/civilizations/civ-asyria.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-babilonia.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-celtowie.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-chinczycy.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-default.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-egipt.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-fenicjanie.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-germanie.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-grecy.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-harappa.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-hetyci.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-inkowie.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-rzymianie.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-slowianie.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-sumer.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/civilizations/civ-zulusi.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/cp-health.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/cp-order.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/dip-gift.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/dip-peace.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/dip-vassal.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/dip-war.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/earth-emblem.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/epoch-icon-map.json` | 9 | json | dane JSON |
| `gra/src/ui/icons/brand/epochs/epoch-braz.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/epochs/epoch-kamien.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/epochs/epoch-zelazo.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/icons-manifest.json` | 380 | json | dane JSON |
| `gra/src/ui/icons/brand/improvement-icon-map.json` | 30 | json | dane JSON |
| `gra/src/ui/icons/brand/improvements/imp-farm.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/improvements/imp-fishing.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/improvements/imp-fort.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/improvements/imp-irrigation.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/improvements/imp-lumber.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/improvements/imp-mine.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/improvements/imp-outpost.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/improvements/imp-pasture.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/improvements/imp-quarry.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/improvements/imp-road.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu-background.css` | 19 | css | arkusz stylów (CSS) |
| `gra/src/ui/icons/brand/menu-components.css` | 26 | css | arkusz stylów (CSS) |
| `gra/src/ui/icons/brand/menu-emblem.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-achievements-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-achievements-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-audio-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-audio-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-campaign-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-campaign-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-controls-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-controls-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-credits-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-credits-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-emblem-mini-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-emblem-mini-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-exit-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-exit-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-info-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-info-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-language-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-language-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-load-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-load-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-more-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-more-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-multiplayer-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-multiplayer-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-play-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-play-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-save-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-save-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-settings-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/menu/menu-settings-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/motion.css` | 8 | css | arkusz stylów (CSS) |
| `gra/src/ui/icons/brand/res-cattle.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/res-clay.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/res-culture.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/res-food.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/res-horses.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/res-influence.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/res-population.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/res-religion.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/res-salt.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/res-science.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/res-settlements.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/res-treasury.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/res-work.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map-icon-map.json` | 44 | json | dane JSON |
| `gra/src/ui/icons/brand/resources-map/res-brick.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-bronze.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-cattle.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-ceramics.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-clay.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-copper-ore.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-gold.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-horse.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-horses.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-iron-ore.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-iron.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-salt.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-steel.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-stone.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-tin-ore.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/resources-map/res-wood.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/setting-icon-map.json` | 17 | json | dane JSON |
| `gra/src/ui/icons/brand/settings/sett-city-states.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/settings/sett-civ-types.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/settings/sett-difficulty.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/settings/sett-game-speed.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/settings/sett-map-size.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/settings/sett-world-type.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tb-army.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tb-cities.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tb-diplomacy.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-culture-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-culture-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-food-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-food-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-influence-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-influence-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-population-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-population-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-religion-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-religion-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-science-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-science-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-settlements-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-settlements-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-treasury-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-treasury-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-work-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier1/res-work-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier2/tb-army-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier2/tb-army-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier2/tb-build-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier2/tb-build-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier2/tb-cities-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier2/tb-cities-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier2/tb-diplomacy-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier2/tb-diplomacy-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier2/tb-science-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier2/tb-science-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-buildings-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-buildings-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-culture-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-culture-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-granary-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-granary-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-health-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-health-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-labor-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-labor-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-order-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-order-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-recruit-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-recruit-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-religion-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-religion-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-trade-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier3/cp-trade-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-crate-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-crate-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-death-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-death-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-garrison-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-garrison-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-grain-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-grain-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-happiness-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-happiness-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-heart-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-heart-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-manpower-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-manpower-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-map-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-map-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-order-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-order-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-rebellion-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-rebellion-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-star-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-star-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-trend-up-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-trend-up-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-warning-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier4/chip-warning-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/dip-alliance-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/dip-alliance-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/dip-pact-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/dip-pact-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/dip-peace-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/dip-peace-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/dip-war-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/dip-war-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/dip-war-strip-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/dip-war-strip-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-accepted-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-accepted-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-check-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-check-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-close-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-close-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-denied-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-denied-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-end-turn-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-end-turn-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-lock-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-lock-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-menu-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-menu-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-pause-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-pause-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-play-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-play-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-wiki-24.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier5/ui-wiki-40.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier6/field-balanced-24.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier6/field-balanced-40.svg` | 1 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier6/field-food-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier6/field-food-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier6/field-production-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier6/field-production-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier6/field-tax-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier6/field-tax-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier7/terrain-desert-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier7/terrain-desert-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier7/terrain-hills-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier7/terrain-hills-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier7/terrain-mountains-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier7/terrain-mountains-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier7/terrain-plains-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier7/terrain-plains-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier7/terrain-water-24.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tier7/terrain-water-40.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/tokens.css` | 74 | css | arkusz stylów (CSS) |
| `gra/src/ui/icons/brand/ui-accepted.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/ui-check.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/ui-close.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/ui-denied.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/ui-end-turn.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/ui-lock.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/ui-menu.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/ui-pause.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/ui-play.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/ui/globe-continents.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/unit-icon-map.json` | 23 | json | dane JSON |
| `gra/src/ui/icons/brand/units/unit-archer.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/units/unit-cavalry.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/units/unit-chariot.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/units/unit-default.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/units/unit-elite.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/units/unit-melee.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/units/unit-naval.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/units/unit-scout.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/units/unit-siege.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/units/unit-sling.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/units/unit-spear.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brand/units/unit-worker.svg` | 0 | svg | ikona/grafika wektorowa (SVG) |
| `gra/src/ui/icons/brandAssets.ts` | 267 | ts | Assety brand-book PACZKA FINAL — REALNA KOPIA W REPO: gra/src/ui/icons/brand/ (71 plikow). [importów: 14, eksportów: 17] |
| `gra/src/ui/icons/iconRegistry.ts` | 49 | ts | Rejestr ikon Warstwa 1 (3C) — PACZKA FINAL brand-book. [importów: 2, eksportów: 2] |
| `gra/src/ui/icons/scienceOwlIcon.ts` | 38 | ts | Ikona badań — sowa z biretem (Design: res-science / tb-science). [importów: 1, eksportów: 3] |
| `gra/src/ui/icons/scienceProgressRing.ts` | 27 | ts | Pierścień postępu badań na ikonie Nauki (HUD). [importów: 0, eksportów: 1] |
| `gra/src/ui/icons/wikiBookIcon.ts` | 19 | ts | Ikona Wiki — Design ui-wiki.svg (brand-book szata-sync 2026-07-03). [importów: 1, eksportów: 1] |
| `gra/src/ui/improvementBuildConfirm.ts` | 93 | ts | improvementBuildConfirm.ts — potwierdzenie zastąpienia ulepszeń / lasu przy budowie z mapy. [importów: 4, eksportów: 1] |
| `gra/src/ui/interHumanDiplomacyHud.ts` | 263 | ts | interHumanDiplomacyHud.ts — R-HOTSEAT-ETAP8-DYPLOMACJA-UI-Q1 (Etap 8 część ii). [importów: 1, eksportów: 7] |
| `gra/src/ui/leaderBannersHud.ts` | 68 | ts | leaderBannersHud.ts — banery liderów (strefa D mockupu HUD Mapy 1E). [importów: 3, eksportów: 2] |
| `gra/src/ui/leaderPortraits.ts` | 225 | ts | leaderPortraits.ts — portrety władców w medalionach dowódców (bitwa/preBattle/dyplomacja). [importów: 2, eksportów: 6] |
| `gra/src/ui/mainMenu.ts` | 514 | ts | Main menu + global settings screen (UI task 4). [importów: 4, eksportów: 9] |
| `gra/src/ui/mapLoadingOverlay.ts` | 260 | ts | mapLoadingOverlay.ts — panel postępu generacji mapy (DYSPOZYCJA-WYDAJNOSC C2 + C2b). [importów: 2, eksportów: 5] |
| `gra/src/ui/mapToolbarHud.ts` | 172 | ts | mapToolbarHud.ts — lewy toolbar [C] mapy (mockup HUD Mapy layout 1E). [importów: 5, eksportów: 6] |
| `gra/src/ui/mapUnitCursor.ts` | 116 | ts | mapUnitCursor.ts — kontekstowe kursory mapy przy zaznaczonej jednostce. [importów: 0, eksportów: 7] |
| `gra/src/ui/mapUnitHudSkin.ts` | 78 | ts | mapUnitHudSkin.ts — wspólny skin 1E dla panelu jednostki / stosu armii (A-06). [importów: 2, eksportów: 4] |
| `gra/src/ui/markdownLite.ts` | 92 | ts | markdownLite.ts — lekki renderer Markdown dla panelu Civpedia (bez zależności). [importów: 0, eksportów: 1] |
| `gra/src/ui/minimapHud.ts` | 448 | ts | minimapHud.ts [importów: 4, eksportów: 11] |
| `gra/src/ui/minimapLayout.ts` | 130 | ts | minimapLayout.ts — wspólna geometria minimapy i docku karty jednostki (Maciej 2026-07-28). [importów: 2, eksportów: 26] |
| `gra/src/ui/naukaLabel.ts` | 18 | ts | Etykieta tekstowa zamiast mikroskopu (🔬) przy zasobie Nauka. [importów: 0, eksportów: 4] |
| `gra/src/ui/newGameFlow.ts` | 2373 | ts | newGameFlow.ts [importów: 15, eksportów: 10] |
| `gra/src/ui/orderPanel.ts` | 231 | ts | orderPanel.ts [importów: 3, eksportów: 7] |
| `gra/src/ui/perfReport.ts` | 315 | ts | perfReport.ts — trwały raport czasów mapy: auto-download, localStorage, chip HUD (FALA 159). [importów: 5, eksportów: 10] |
| `gra/src/ui/perfTestPanel.ts` | 677 | ts | perfTestPanel.ts — panel „Test wydajności" (Batch 7, pomysł Macieja 2026-07-05). [importów: 6, eksportów: 3] |
| `gra/src/ui/postBattleSummary.ts` | 603 | ts | postBattleSummary.ts — wynik po bitwie mapowej (layout TW jak preBattle C-01 v3). [importów: 6, eksportów: 4] |
| `gra/src/ui/power-labels.ts` | 36 | ts | power-labels.ts — nazewnictwo Moc / Power (Maciej P-C3, 2026-06-26). [importów: 2, eksportów: 5] |
| `gra/src/ui/powerOverlayHud.ts` | 238 | ts | powerOverlayHud.ts — overlay Moc (P-A, P-C3): składniki + ranking. [importów: 2, eksportów: 9] |
| `gra/src/ui/preBattle.ts` | 918 | ts | preBattle.ts [importów: 8, eksportów: 15] |
| `gra/src/ui/resourceColors.ts` | 128 | ts | resourceColors.ts — JEDNO ŹRÓDŁO PRAWDY koloru sześciu surowców. [importów: 0, eksportów: 9] |
| `gra/src/ui/saveLoadDialog.ts` | 623 | ts | saveLoadDialog.ts — wybór slotu zapisu / wczytywania (localStorage). [importów: 3, eksportów: 14] |
| `gra/src/ui/sceneTimingReport.ts` | 212 | ts | sceneTimingReport.ts — raport czasów mapy (FALA 159: plik + localStorage + chip HUD). [importów: 5, eksportów: 2] |
| `gra/src/ui/scienceHubHud.ts` | 792 | ts | scienceHubHud.ts — hub badań (postęp + lista tech + wejście do drzewka). [importów: 11, eksportów: 13] |
| `gra/src/ui/scienceHubSnapshotLogic.ts` | 142 | ts | scienceHubSnapshotLogic.ts — czysta logika listy „Możesz wybrać" (hub badań). [importów: 0, eksportów: 6] |
| `gra/src/ui/sciencePicker.ts` | 1666 | ts | sciencePicker.ts [importów: 15, eksportów: 16] |
| `gra/src/ui/sideListHud.css.ts` | 146 | ts | sideListHud.css.ts — wspólny arkusz stylów + logika prezentacyjna dla list bocznych [importów: 1, eksportów: 10] |
| `gra/src/ui/sidePanelEventFilter.ts` | 25 | ts | sidePanelEventFilter.ts [importów: 1, eksportów: 1] |
| `gra/src/ui/sidePanelHud.ts` | 969 | ts | sidePanelHud.ts [importów: 8, eksportów: 7] |
| `gra/src/ui/sidePanelLayout.ts` | 33 | ts | sidePanelLayout.ts — JEDNO wspólne źródło prawdy dla pozycji paneli otwieranych [importów: 1, eksportów: 4] |
| `gra/src/ui/siegeMapPanel.ts` | 371 | ts | siegeMapPanel.ts — panel oblężenia na mapie (C3-Q7=A: boczny overlay, mapa widoczna). [importów: 6, eksportów: 7] |
| `gra/src/ui/techDiscoveryNotice.ts` | 946 | ts | Karta odkrytej technologii, otwierana przy ukończeniu badań. [importów: 11, eksportów: 4] |
| `gra/src/ui/techIcons.ts` | 77 | ts | Ikony 32 technologii Antyku (Claude Design, Zlecenie 7 — TECH-IKONY-32). [importów: 0, eksportów: 2] |
| `gra/src/ui/techTreeView.ts` | 1130 | ts | techTreeView.ts [importów: 11, eksportów: 6] |
| `gra/src/ui/techUnlockParse.ts` | 52 | ts | techUnlockParse.ts [importów: 1, eksportów: 3] |
| `gra/src/ui/treasuryBalanceFormat.ts` | 13 | ts | Formatowanie komórek bilansu skarbca (panel ZASOBY IMPERIUM). [importów: 1, eksportów: 1] |
| `gra/src/ui/triumphCityStateNotice.ts` | 131 | ts | triumphCityStateNotice.ts — modal „TRIUMF!" po zjednoczeniu miast-państw tej [importów: 1, eksportów: 4] |
| `gra/src/ui/turnTransitionOverlay.ts` | 132 | ts | turnTransitionOverlay.ts — B5-A: pasek postępu + „Teraz gra: …” przy końcu tury. [importów: 1, eksportów: 5] |
| `gra/src/ui/uiParams.ts` | 98 | ts | Single typed entry point for the UI parameter panel (Civ-UI). [importów: 1, eksportów: 8] |
| `gra/src/ui/unitActionBarHtml.ts` | 169 | ts | Pasek ikon akcji jednostki (fortyfikuj, zastąp, czuwaj, pomiń, rozwiąż) — [importów: 1, eksportów: 2] |
| `gra/src/ui/unitCardStatus.ts` | 394 | ts | unitCardStatus.ts — wspólny wiersz statusów karty jednostki (C-OBCE-JEDN-KARTA). [importów: 5, eksportów: 14] |
| `gra/src/ui/unitCtxDockDiploGate.ts` | 26 | ts | unitCtxDockDiploGate.ts — ukrywanie docku karty jednostki przy otwartym UI dyplomacji [importów: 0, eksportów: 4] |
| `gra/src/ui/unitForeignPick.ts` | 245 | ts | unitForeignPick.ts — wybór przy kliknięciu obcej jednostki: karta jednostki [importów: 2, eksportów: 4] |
| `gra/src/ui/unitInfoCard.ts` | 419 | ts | Karta informacyjna jednostki (mapa) — T4 MIGRACJA-KARTA-JEDNOSTKI-MAPA. [importów: 8, eksportów: 6] |
| `gra/src/ui/unitInfographic.ts` | 171 | ts | unitInfographic.ts — kanon ikon jednostek 1E (jednostki-infografiki-1E.html). [importów: 2, eksportów: 7] |
| `gra/src/ui/unitMiniPreview.ts` | 155 | ts | Miniatura 3D jednostki (buildUnitModel) — statyczny render z shared WebGL. [importów: 4, eksportów: 2] |
| `gra/src/ui/unitPanelHud.ts` | 183 | ts | unitPanelHud.ts — panel jednostki [H] (A-06 · 1E). [importów: 3, eksportów: 5] |
| `gra/src/ui/unitRecruitCard.ts` | 286 | ts | Kompaktowe wiersze jednostek w katalogu rekrutacji (panel miasta). [importów: 6, eksportów: 3] |
| `gra/src/ui/unitReplacePicker.ts` | 207 | ts | unitReplacePicker.ts — modal mechanizmu "Zastąp" (ZASTAP-JEDNOSTKI-PLAN.md). [importów: 3, eksportów: 5] |
| `gra/src/ui/victoryScreen.ts` | 346 | ts | victoryScreen.ts — pełnoekranowy ekran końca gry (E-15 · 1E cinematic). [importów: 3, eksportów: 10] |
| `gra/src/ui/wikiHubHud.ts` | 644 | ts | wikiHubHud.ts — Civpedia in-game: Poradnik + Encyklopedia (rev. E bundle). [importów: 9, eksportów: 11] |
| `gra/src/ui/wonderCompletedNotice.ts` | 124 | ts | wonderCompletedNotice.ts — powiadomienie „Cud ukończony” (TEMAT #16, klatka C). [importów: 1, eksportów: 3] |

## `gra/src/map` — 25 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/map/cluster-spawn.ts` | 516 | ts | cluster-spawn.ts — API spawnu miast z klastra (lane MAPA). [importów: 8, eksportów: 11] |
| `gra/src/map/clusters.ts` | 4250 | ts | clusters.ts  (lane Grupa A / MAPA) [importów: 4, eksportów: 78] |
| `gra/src/map/deposit-era.ts` | 46 | ts | deposit-era.ts — widoczność złóż metali per epoka (E-P0-04/05). [importów: 2, eksportów: 7] |
| `gra/src/map/earth-land-mask.generated.ts` | 417 | ts | AUTO-GENERATED — nie edytuj ręcznie. [importów: 0, eksportów: 4] |
| `gra/src/map/earth-land-mask.ts` | 170 | ts | Maska szablonu Ziemi (mockup Macieja, decyzja A 2026-07-04). [importów: 1, eksportów: 8] |
| `gra/src/map/gen-helpers.ts` | 12561 | ts | gen-helpers.ts [importów: 6, eksportów: 259] |
| `gra/src/map/genWorker.ts` | 45 | ts | genWorker.ts — generacja mapy poza głównym wątkiem (DYSPOZYCJA-WYDAJNOSC C1). [importów: 4, eksportów: 2] |
| `gra/src/map/generator.ts` | 848 | ts | generator.ts [importów: 11, eksportów: 15] |
| `gra/src/map/improvement-build.ts` | 1569 | ts | map/improvement-build.ts (lane Grupa A / MAPA) [importów: 14, eksportów: 41] |
| `gra/src/map/map-attack-city.ts` | 155 | ts | map-attack-city.ts — routing kliku wrogiego miasta z mapy (F-P1-01). [importów: 6, eksportów: 4] |
| `gra/src/map/mapGenAsync.ts` | 98 | ts | mapGenAsync.ts — generacja mapy w Web Workerze z fallbackiem na main thread. [importów: 6, eksportów: 1] |
| `gra/src/map/mapGenProgress.ts` | 101 | ts | mapGenProgress.ts — wspólny raport postępu generacji mapy (UI overlay + worker). [importów: 0, eksportów: 7] |
| `gra/src/map/mapSnapshot.ts` | 404 | ts | mapSnapshot.ts [importów: 2, eksportów: 6] |
| `gra/src/map/minimap.ts` | 271 | ts | map/minimap.ts (Grupa A / lane MAPA) [importów: 3, eksportów: 9] |
| `gra/src/map/newGameMapDefaults.ts` | 743 | ts | newGameMapDefaults.ts [importów: 7, eksportów: 65] |
| `gra/src/map/range-hexes.ts` | 115 | ts | range-hexes.ts — heksy zasięgu kultury i religii (logika MAPA, bez Three.js). [importów: 4, eksportów: 4] |
| `gra/src/map/riverGenSwitch.ts` | 83 | ts | Kill-switch generowania rzek w mapgen. [importów: 0, eksportów: 9] |
| `gra/src/map/road-movement.ts` | 84 | ts | map/road-movement.ts (lane Grupa A / MAPA) [importów: 3, eksportów: 7] |
| `gra/src/map/road-network.ts` | 182 | ts | map/road-network.ts — SIEĆ DRÓG: maska 6 bitów sąsiedztwa + porty na ściankach heksa. [importów: 0, eksportów: 17] |
| `gra/src/map/startScoring.ts` | 142 | ts | startScoring.ts — wybór preferowanego hexu startu gracza (lane MAPA / SILNIK). [importów: 4, eksportów: 4] |
| `gra/src/map/territory-border.ts` | 238 | ts | territory-border.ts — obwód terytorium państwa jako zamknięte pętle (logika MAPA, bez Three.js). [importów: 1, eksportów: 6] |
| `gra/src/map/territory-work.ts` | 166 | ts | territory-work.ts — filtrowanie pracy obywateli wg właściciela terytorium. [importów: 2, eksportów: 7] |
| `gra/src/map/territory.ts` | 145 | ts | map/territory.ts [importów: 1, eksportów: 7] |
| `gra/src/map/villages.ts` | 214 | ts | Neutralne WIOSKI (goodie huts) — rzadkie punkty na mapie świata, rozmieszczane [importów: 4, eksportów: 10] |
| `gra/src/map/wonder-placement.ts` | 119 | ts | wonder-placement.ts — wybór heksa na cud świata w terytorium miasta (MAPA). [importów: 5, eksportów: 6] |

## `gra/src/units` — 2 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/units/battleRoster.ts` | 158 | ts | battleRoster.ts — skład armii na potyczkę (C1-Q4 / D8=A). [importów: 2, eksportów: 8] |
| `gra/src/units/setup.ts` | 1068 | ts | Unit placement and movement logic for the world map. [importów: 6, eksportów: 21] |

## `gra/src/battle` — 15 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/battle/README-manualBattle.md` | 121 | md | dokumentacja (Markdown) |
| `gra/src/battle/autoBatchPhase.ts` | 190 | ts | Deterministic planning/arbitration primitives for one automatic battle phase. [importów: 0, eksportów: 7] |
| `gra/src/battle/battle-terrain.ts` | 818 | ts | battle-terrain.ts [importów: 0, eksportów: 10] |
| `gra/src/battle/battleHudTheme.ts` | 1758 | ts | battleHudTheme.ts — tokeny HUD bitwy 1E (Design Grupa C). [importów: 0, eksportów: 130] |
| `gra/src/battle/battleMinimap.ts` | 110 | ts | battleMinimap.ts — Q2 minimap data contract + canvas renderer (D5=B). [importów: 0, eksportów: 8] |
| `gra/src/battle/battleScene.ts` | 19493 | ts | battleScene.ts [importów: 38, eksportów: 12] |
| `gra/src/battle/battleSceneOpen.ts` | 35 | ts | battleSceneOpen.ts [importów: 0, eksportów: 3] |
| `gra/src/battle/battleTerrainTooltip.ts` | 96 | ts | C-TEREN-IMPL-3=B — składowe wiersza TEREN w tooltipie jednostki bitwy. [importów: 2, eksportów: 5] |
| `gra/src/battle/endDetails1E.ts` | 337 | ts | endDetails1E.ts — C-23 „Szczegóły bitwy" (Design TW v5, klatka 4). [importów: 1, eksportów: 7] |
| `gra/src/battle/endScreen1E.ts` | 221 | ts | endScreen1E.ts — C-12 „Koniec bitwy" (Design TW v5, klatka 5). [importów: 1, eksportów: 4] |
| `gra/src/battle/manualBattle.ts` | 1433 | ts | manualBattle.ts [importów: 10, eksportów: 5] |
| `gra/src/battle/mapFieldBattle.ts` | 581 | ts | mapFieldBattle.ts — atak miasta bez muru z mapy (F-P1-01 / C1). [importów: 17, eksportów: 7] |
| `gra/src/battle/siegeHud1E.ts` | 178 | ts | siegeHud1E.ts — HUD oblężenia C-04 (Design 1E, 2026-07-03). [importów: 1, eksportów: 10] |
| `gra/src/battle/siegeWall.ts` | 1047 | ts | siegeWall.ts — proceduralny mur obronny dla 9 cywilizacji epoki brazu. [importów: 2, eksportów: 3] |
| `gra/src/battle/testBattle.ts` | 449 | ts | testBattle.ts [importów: 1, eksportów: 10] |

## `gra/src/render` — 88 plików

| Ścieżka | Linie | Typ | Przeznaczenie |
|---|---:|---|---|
| `gra/src/render/braz-konnica-opus5.ts` | 934 | ts | braz-konnica-opus5.ts — KONNICA (Horseman), epoka BRĄZU [importów: 2, eksportów: 2] |
| `gra/src/render/braz-lucznik-nubijski-opus5.ts` | 775 | ts | braz-lucznik-nubijski-opus5.ts — ŁUCZNIK NUBIJSKI (Nubian Archer), jednostka [importów: 2, eksportów: 2] |
| `gra/src/render/braz-miecznik-opus5.ts` | 765 | ts | braz-miecznik-opus5.ts — MIECZNIK BRĄZOWY (Bronze Swordsman), bazowa piechota [importów: 2, eksportów: 2] |
| `gra/src/render/braz-procarz-opus5.ts` | 766 | ts | braz-procarz-opus5.ts — PROCARZ (Slinger), jednostka BAZOWA dystansowa [importów: 2, eksportów: 2] |
| `gra/src/render/braz-rydwan-kapadokijski-opus5.ts` | 781 | ts | braz-rydwan-kapadokijski-opus5.ts — RYDWAN KAPADOCKI / KAPADOKIJSKI [importów: 2, eksportów: 2] |
| `gra/src/render/braz-rydwan-konny-opus5.ts` | 784 | ts | braz-rydwan-konny-opus5.ts — RYDWAN KONNY (War Chariot), LEKKI DWUKOŁOWY [importów: 2, eksportów: 2] |
| `gra/src/render/braz-rydwan-woly-opus5.ts` | 620 | ts | braz-rydwan-woly-opus5.ts — RYDWAN NA WOŁACH (Ox-Drawn Battle Cart), [importów: 2, eksportów: 2] |
| `gra/src/render/braz-taran-opus5.ts` | 492 | ts | braz-taran-opus5.ts — TARAN OKUTY (Bronze-Shod Ram), machina oblężnicza [importów: 2, eksportów: 2] |
| `gra/src/render/braz-wlocznik-opus5.ts` | 711 | ts | braz-wlocznik-opus5.ts — WŁÓCZNIK (Brąz), bazowa piechota epoki Brązu [importów: 2, eksportów: 2] |
| `gra/src/render/bronzeCity.ts` | 464 | ts | bronzeCity.ts (Grupa A / MAPA — render) — miasta EPOKI BRAZU per cywilizacja. [importów: 1, eksportów: 4] |
| `gra/src/render/bronzeCityRoblox.ts` | 437 | ts | bronzeCityRoblox.ts — miasta epoki brązu w stylu Roblox (klocki, flatShading). [importów: 3, eksportów: 3] |
| `gra/src/render/camera.ts` | 309 | ts | Ręczna obsługa kamery — pan (drag myszą / WASD) + zoom (kółko myszy). [importów: 1, eksportów: 3] |
| `gra/src/render/cities.ts` | 946 | ts | Renders settlement models on the hex map, one per City. [importów: 20, eksportów: 3] |
| `gra/src/render/cityMapOutline.ts` | 85 | ts | cityMapOutline.ts — delikatna obwódka heksu miasta na mapie świata (MAPA). [importów: 3, eksportów: 4] |
| `gra/src/render/cityMapStatChip.ts` | 1133 | ts | cityMapStatChip.ts — etykieta miasta na mapie świata (MAPA). [importów: 4, eksportów: 23] |
| `gra/src/render/cityOkolicaOverlay.ts` | 347 | ts | cityOkolicaOverlay.ts — nakładka okolicy miasta na mapie 3D (Civ V style). [importów: 11, eksportów: 7] |
| `gra/src/render/countSceneOverlayCandidates.ts` | 124 | ts | Offline licznik kandydatów styledOverlays (bez WebGL) — diagnostyka R-SCENA-PERF. [importów: 5, eksportów: 4] |
| `gra/src/render/dekor-laki-rowniny.ts` | 463 | ts | dekor-laki-rowniny.ts — MIKRODEKORACJE pustych heksów ŁĄKA i RÓWNINA [importów: 1, eksportów: 13] |
| `gra/src/render/djungla-modele.ts` | 218 | ts | djungla-modele.ts — R-SCENA-PERF: kępy dżungli tropikalnej jako 5 InstancedMesh [importów: 1, eksportów: 7] |
| `gra/src/render/droga-6-ramion.ts` | 190 | ts | droga-6-ramion.ts — DROGA jako SZEŚCIORAMIENNA GWIAZDA (render, Opus 5). [importów: 2, eksportów: 2] |
| `gra/src/render/fogDim.ts` | 44 | ts | fogDim.ts — wspólne przyciemnianie dekoracji 3D (FoW explored). [importów: 2, eksportów: 2] |
| `gra/src/render/galera-model.ts` | 273 | ts | galera-model.ts — GALERA (jedyna jednostka morska, epoka brązu) — redesign ROBLOX [importów: 1, eksportów: 2] |
| `gra/src/render/hastati-falangita.ts` | 694 | ts | hastati-falangita.ts — proceduralne modele piechoty, KOREKTA v2 (render-jednostki) [importów: 2, eksportów: 2] |
| `gra/src/render/hastati-opus5.ts` | 993 | ts | hastati-opus5.ts — MODEL HASTATIEGO UZYWANY PRZEZ GRE [importów: 2, eksportów: 2] |
| `gra/src/render/hexShape.ts` | 32 | ts | hexShape.ts — wspólna geometria pointy-top (zgodna z units.ts / CylinderGeometry mapy). [importów: 1, eksportów: 2] |
| `gra/src/render/hexutil.ts` | 71 | ts | Konwersja współrzędnych aksjalnych (q, r) → pozycja świata Three.js. [importów: 0, eksportów: 5] |
| `gra/src/render/improvements.ts` | 602 | ts | improvements.ts (Grupa A / MAPA — render) — wyglad ULEPSZEN TERENU na heksie. [importów: 8, eksportów: 7] |
| `gra/src/render/jednostki-p1-rdzen.ts` | 833 | ts | jednostki-p1-rdzen.ts — PACZKA 1/8: rdzen generyczny (7 jednostek) [importów: 2, eksportów: 7] |
| `gra/src/render/jednostki-p2-inka.ts` | 685 | ts | jednostki-p2-inka.ts — PACZKA 2/8: INKOWIE, proceduralne modele piechoty [importów: 2, eksportów: 4] |
| `gra/src/render/jednostki-p3-dystans.ts` | 879 | ts | jednostki-p3-dystans.ts — proceduralne modele DYSTANSOWYCH per cywilizacja [importów: 2, eksportów: 5] |
| `gra/src/render/jednostki-p4-melee.ts` | 866 | ts | jednostki-p4-melee.ts — PACZKA 4/8: MELEE SPECIALS (6), epoka BRAZU [importów: 2, eksportów: 6] |
| `gra/src/render/jednostki-p57-wlocznie-machiny.ts` | 840 | ts | jednostki-p57-wlocznie-machiny.ts — PACZKA 5+7/8: WLOCZNICY PER-CIV (2) + MACHINY (2) [importów: 2, eksportów: 4] |
| `gra/src/render/jednostki-p6-super.ts` | 911 | ts | jednostki-p6-super.ts — PACZKA 6/8: SUPER-JEDNOSTKI (braz) [importów: 2, eksportów: 2] |
| `gra/src/render/jednostki-p8a-bliskiwschod.ts` | 704 | ts | jednostki-p8a-bliskiwschod.ts — PACZKA 8a/8: BLISKI WSCHOD (4), epoka BRAZU [importów: 2, eksportów: 4] |
| `gra/src/render/jednostki-p8b-rozni.ts` | 794 | ts | jednostki-p8b-rozni.ts — PACZKA 8b/8: 4 JEDNOSTKI BEZ WLASNEGO MODELU [importów: 2, eksportów: 4] |
| `gra/src/render/jednostki-z1-mezopotamia.ts` | 1329 | ts | jednostki-z1-mezopotamia.ts — ZELAZO P1: MEZOPOTAMIA / INDUS (4 jednostki) [importów: 2, eksportów: 4] |
| `gra/src/render/jednostki-z2-srodziemne.ts` | 1604 | ts | jednostki-z2-srodziemne.ts — ZELAZO P2: SRODZIEMNOMORZE (render-jednostki) [importów: 2, eksportów: 5] |
| `gra/src/render/jednostki-z3-plemiona.ts` | 1994 | ts | jednostki-z3-plemiona.ts — SERIA Z3: PLEMIONA (5 jednostek, ZELAZO) [importów: 2, eksportów: 5] |
| `gra/src/render/kamien-bazowe-opus5.ts` | 1190 | ts | kamien-bazowe-opus5.ts — WARIANT PORÓWNAWCZY: 4 jednostki BAZOWE epoki KAMIENIA [importów: 2, eksportów: 5] |
| `gra/src/render/kamien-inka-opus5.ts` | 928 | ts | kamien-inka-opus5.ts — WARIANTY PORÓWNAWCZE (OPUS 5) dwóch jednostek [importów: 2, eksportów: 3] |
| `gra/src/render/kamien-lucznicy-opus5.ts` | 986 | ts | kamien-lucznicy-opus5.ts — WARIANTY PORÓWNAWCZE cywilizacyjnych ŁUCZNIKÓW [importów: 2, eksportów: 3] |
| `gra/src/render/kamien-zulu-taran-opus5.ts` | 1130 | ts | kamien-zulu-taran-opus5.ts — WARIANTY PORÓWNAWCZE (OPUS 5) dwóch jednostek [importów: 2, eksportów: 3] |
| `gra/src/render/kon-nowy-model.ts` | 342 | ts | kon-nowy-model.ts — NOWY proceduralny model konia (koncept, render-kon) [importów: 2, eksportów: 3] |
| `gra/src/render/kopalnia-cyny-opus5.ts` | 352 | ts | kopalnia-cyny-opus5.ts — ULEPSZENIE TERENU „Kopalnia cyny" (własny model 3D). [importów: 2, eksportów: 2] |
| `gra/src/render/kopalnia-zlota-opus5.ts` | 350 | ts | kopalnia-zlota-opus5.ts — ULEPSZENIE TERENU „Kopalnia złota" (własny model 3D). [importów: 2, eksportów: 2] |
| `gra/src/render/lasy-modele.ts` | 440 | ts | lasy-modele.ts — TEREN: 5 wariantów KĘP LASU (nakładka Nakladka.Las) [importów: 1, eksportów: 11] |
| `gra/src/render/mapRenderStyle.ts` | 1996 | ts | mapRenderStyle.ts — palety i fabryki dekoracji mapy (Roblox / Minecraft). [importów: 6, eksportów: 80] |
| `gra/src/render/mergeDecor.ts` | 175 | ts | mergeDecor.ts — FPS: scalanie grupy dekoracji per-heks (dziesiątki/setki małych [importów: 1, eksportów: 5] |
| `gra/src/render/miasto-braz.ts` | 905 | ts | miasto-braz.ts — MIASTA EPOKI BRAZU per cywilizacja (GRECJA, RZYM) w stylu [importów: 2, eksportów: 10] |
| `gra/src/render/miasto-kamien.ts` | 667 | ts | miasto-kamien.ts — MIASTO EPOKI KAMIENIA (paleolit/neolit) w stylu Roblox [importów: 1, eksportów: 8] |
| `gra/src/render/minecraftScene.ts` | 11 | ts | minecraftScene.ts — ten sam buildScene co mapa gry, styl dekoracji Minecraft. [importów: 2, eksportów: 2] |
| `gra/src/render/oaza-pustynia.ts` | 578 | ts | oaza-pustynia.ts — OAZA (feature pustyni) + MIKRODEKORACJE PUSTYNI [importów: 1, eksportów: 17] |
| `gra/src/render/pastwisko-modele.ts` | 261 | ts | pastwisko-modele.ts — zwierzeta terenowe pastwiska w stylu Roblox [importów: 1, eksportów: 13] |
| `gra/src/render/perfDebugOverlay.ts` | 76 | ts | perfDebugOverlay.ts — overlay diagnostyczny F9 (BATCH 3 / A4). [importów: 0, eksportów: 6] |
| `gra/src/render/rangeOverlay.ts` | 909 | ts | rangeOverlay.ts — wizualizacja zasięgu kultury / religii na mapie 3D (MAPA). [importów: 6, eksportów: 15] |
| `gra/src/render/resources.ts` | 171 | ts | resources.ts (Grupa A / MAPA — render) [importów: 2, eksportów: 2] |
| `gra/src/render/riverLod.ts` | 413 | ts | riverLod.ts — LOD + merge helperów wstęg rzek (Batch 3 remainder). [importów: 2, eksportów: 22] |
| `gra/src/render/robloxCity.ts` | 294 | ts | robloxCity.ts — miasta na mapie w stylu Roblox (kolorowe klocki, wieże, mury). [importów: 1, eksportów: 3] |
| `gra/src/render/robloxImprovements.ts` | 484 | ts | robloxImprovements.ts — ulepszenia terenu w stylu RoboProBlocks. [importów: 13, eksportów: 3] |
| `gra/src/render/robloxScene.ts` | 12 | ts | robloxScene.ts — buildScene w stylu Roblox + eksport miast. [importów: 2, eksportów: 4] |
| `gra/src/render/scene.ts` | 3760 | ts | Buduje scenę Three.js dla mapy hex The Game. [importów: 21, eksportów: 12] |
| `gra/src/render/settlementModel.ts` | 27 | ts | settlementModel.ts — fabryka modeli osady na mapie (classic / Roblox). [importów: 6, eksportów: 1] |
| `gra/src/render/siegeCampModels.ts` | 160 | ts | siegeCampModels.ts — modele 3D obozu oblężniczego (OBL-S6, źródło: siegepreview). [importów: 2, eksportów: 6] |
| `gra/src/render/siegeCampSync.ts` | 47 | ts | siegeCampSync.ts — pomocnik dla INTEGRATOR: mapowanie machin → heksy obozów (OBL-S6). [importów: 1, eksportów: 3] |
| `gra/src/render/siegeMarker.ts` | 262 | ts | siegeMarker.ts — wizualizacja oblężenia na mapie świata (MAPA/C3). [importów: 5, eksportów: 2] |
| `gra/src/render/stoneCity.ts` | 387 | ts | stoneCity.ts — miasta EPOKI KAMIENIA per cywilizacja (10 typow jak bronzeCity). [importów: 2, eksportów: 6] |
| `gra/src/render/stoneCityRoblox.ts` | 471 | ts | stoneCityRoblox.ts — epoka kamienia, styl Roblox (klocki, flatShading). [importów: 4, eksportów: 3] |
| `gra/src/render/styleResources.ts` | 499 | ts | styleResources.ts — surowce mapy w stylu Roblox / Minecraft. [importów: 8, eksportów: 6] |
| `gra/src/render/swinia-trzoda.ts` | 187 | ts | swinia-trzoda.ts — SWINIA (2 pozy x 2 warianty) + kompozycja TRZODA [importów: 2, eksportów: 7] |
| `gra/src/render/tarasy-model.ts` | 403 | ts | tarasy-model.ts — ULEPSZENIE „TARASY" na NOWYCH wzgórzach W0/W3 [importów: 1, eksportów: 5] |
| `gra/src/render/teren-gory-wzgorza.ts` | 509 | ts | teren-gory-wzgorza.ts — TEREN: 5 wariantów WZGÓRZ + 5 wariantów GÓR [importów: 1, eksportów: 14] |
| `gra/src/render/tradeRoutesOverlay.ts` | 101 | ts | tradeRoutesOverlay.ts — E7 (epik Handel): wizualizacja aktywnych szlaków handlowych [importów: 5, eksportów: 3] |
| `gra/src/render/ulepszenia-modele-p2.ts` | 345 | ts | ulepszenia-modele-p2.ts — ULEPSZENIA TERENU, PARTIA 2: budynki gospodarcze [importów: 1, eksportów: 7] |
| `gra/src/render/ulepszenia-modele-p3a.ts` | 510 | ts | ulepszenia-modele-p3a.ts — ULEPSZENIA TERENU, PARTIA 3A: osady produkcyjne [importów: 2, eksportów: 7] |
| `gra/src/render/ulepszenia-modele-p3b.ts` | 571 | ts | ulepszenia-modele-p3b.ts — ULEPSZENIA TERENU, PARTIA 3B: irygacja, pole [importów: 1, eksportów: 15] |
| `gra/src/render/unitOwnerEmblem.ts` | 516 | ts | unitOwnerEmblem.ts [importów: 2, eksportów: 12] |
| `gra/src/render/unitStatPlate.ts` | 936 | ts | unitStatPlate.ts [importów: 4, eksportów: 18] |
| `gra/src/render/unitUpgradeBadges.ts` | 459 | ts | unitUpgradeBadges.ts [importów: 6, eksportów: 14] |
| `gra/src/render/unitVeteranBadges.ts` | 294 | ts | unitVeteranBadges.ts [importów: 4, eksportów: 7] |
| `gra/src/render/unitVitalsPalette.ts` | 89 | ts | unitVitalsPalette.ts [importów: 0, eksportów: 11] |
| `gra/src/render/units.ts` | 6779 | ts | Renders unit tokens and movement-range highlight discs on the hex map. [importów: 44, eksportów: 3] |
| `gra/src/render/wioska-oboz.ts` | 342 | ts | wioska-oboz.ts — WIOSKA NEUTRALNA + OBOZ BARBARZYNCOW w stylu Roblox [importów: 1, eksportów: 4] |
| `gra/src/render/wonderModels.ts` | 493 | ts | wonderModels.ts — modele 3D cudów świata na heksie mapy (MAPA, Roblox). [importów: 2, eksportów: 3] |
| `gra/src/render/wonderRenderer.ts` | 143 | ts | wonderRenderer.ts — render cudów świata na heksach mapy (MAPA). [importów: 7, eksportów: 3] |
| `gra/src/render/workerFieldOverlay.ts` | 211 | ts | workerFieldOverlay.ts — ikonki pracowników na mapie świata (pola z robotnikami). [importów: 6, eksportów: 8] |
| `gra/src/render/zelazo-jezdziec-oszczepami-opus5.ts` | 1256 | ts | zelazo-jezdziec-oszczepami-opus5.ts — JEŹDZIEC Z OSZCZEPAMI (Słowianie, ŻELAZO) [importów: 2, eksportów: 2] |
| `gra/src/render/zelazo-konnica-asyryjska-opus5.ts` | 1180 | ts | zelazo-konnica-asyryjska-opus5.ts — KONNICA ASYRYJSKA, epoka ŻELAZA [importów: 2, eksportów: 3] |
| `gra/src/render/zoomLod.ts` | 220 | ts | zoomLod.ts — progi jakości renderu w zależności od oddalenia kamery (zoom out). [importów: 0, eksportów: 14] |
