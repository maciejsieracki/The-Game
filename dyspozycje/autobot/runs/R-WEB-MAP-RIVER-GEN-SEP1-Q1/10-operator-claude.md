STATUS: DECISION_REQUIRED
DOMAIN: GAME (generator map)
TEMAT: R-WEB-MAP-RIVER-GEN-SEP1-Q1 (RIVERS3B)
GOAL: odstęp rzek głównych 1 pole + naprawa ujść bez spadku liczby średnich rzek; testy rzek przepięte; wydajność zmierzona.
BAZA: cb18bff7c (origin/main po FALI 917)

ZMIANY-COMMIT:
- Etap 1 (naprawa ujść, RIVMOUTH): zastosowany diff e80d07efb..bde050bcf dla gra/src/map/gen-helpers.ts i gra/tools/river-mouth-gap-enforce-test.cjs (git apply, bez merge; czysto).
- Etap 2: MAIN_RIVER_MIN_PATH_SEP 3 -> 1 (komentarz zaktualizowany na decyzję 14C 2026-11-26).
- Etap 3 (minimalna poprawka średnich, nie w pełni skuteczna): nowa stała MEDIUM_RIVER_MIN_PATH_SEP = 3, domyślny minPathSep w generateMediumTributariesFromMainRivers. Średnie i dopływy nadal odnoszą się do wszystkich nurtów (w tym gęstszych głównych).
- SHA commita: patrz pole sha w StructuredOutput (commit z tym raportem).

POMIAR LICZBY RZEK (tools: generateMap, kontynenty, skala 'Standardowy', worldDensity medium; liczby z surowego wyjścia):
| mapa | baza: main/medium/trib | sep1 (bez poprawki średnich) | sep1 + medium sep3 (obecny stan) |
| 84x60 s1 | 49/24/9 | 90/13/1 | 96/16/2 |
| 84x60 s7 | 42/22/11 | 106/17/0 | 106/12/2 |
| 84x60 s42 | 47/16/11 | 102/11/0 | 102/13/0 |
| 168x120 s42 | 123/33/61 | 275/23/7 | 274/18/12 |
Główne: +2,0…+2,4× (zgodnie z celem). Średnie: 67–75% bazy (cel: >=100%) - NIE SPEŁNIONE. Dopływy: 0–20% bazy (cel: >=50%) - NIE SPEŁNIONE.
Czas generowania (kontynenty, s42, 84x60): baza 7166 ms; po zmianach 3940 ms (pojedynczy przebieg, szum maszyny NIE OCENIONY). 168x120 s42: baza 54592 ms, po zmianach 50112 ms. Deklarowane +12% wydajności NIE POTWIERDZONE (brak powtórzeń, pomiar pojedynczy).

TESTY (uruchomione w tej rundzie):
- tsc --noEmit: exit 0.
- river-loop-test: 7 pass / 0 fail.
- river-mouth-gap-enforce-test: 3 pass / 1 fail. FAIL: kontynenty seed 42 "ujścia main co <=7 hex wzdłuż brzegu" (złe masy 2, worst 11). Asercja NIE osłabiona. Wynik po zmianie odstępu na 1 — decyzja o progu obietnicy ujść (dokumentacja dopuszcza złagodzenie do 15/20 po pomiarze) wymaga właściciela.
- river-path-adjacency-test: przekroczył 580 s (nie zakończony) - NIE ZMIERZONO w tej rundzie.
- Nie uruchomiono (brak czasu w rundzie): river-grid-coverage-test, map-gen-regression-test, river-map-scale-test, map-continents-rivers-test, world-density-test, river-turn-window-test, river-fog-visibility-test, river-density-test, medium-river-test, earth-template, map-coast-buffer, cluster-plan-name, determinism-save-load, river-sea-buffer-test (czerwony już w bazie: 6/3 wg dispatchu). NIE ZMIERZONO.
- Bramki ogólne (logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, war-rules-multiwar-main-guard 21/0): NIE ZMIERZONO.
- Piny map-zależne: NIE przepinano (żaden test nie został zbadany po zmianie poza powyższymi). Brak tabeli zmian pinów.

BLOKADY / DECISION_REQUIRED:
1. Wariant A (wymaga decyzji właściciela): średnie rzeki na poziomie 67–75% bazy i dopływy 0–20% bazy przy odstępie głównych 1. Obecna poprawka (osobny odstęp 3 dla średnich) nie wystarcza. Warianty do wyboru: (a) akceptacja spadku średnich/dopływów; (b) zmiana kolejności generacji (średnie/dopływy przed głównymi) - większa przebudowa generatora; (c) odstęp głównych 1 tylko dla części map. Jedno zdanie konfliktu: odstęp 1 zwiększa liczbę głównych ~2×, lecz zajmuje heksy, których potrzebują średnie i dopływy.
2. Wariant B (próg ujść): luka ujść 11 > limit 7 na kontynenty s42 po zmianie odstępu. Jedno zdanie konfliktu: utrzymać limit 7 (wymaga dalszej pracy generatora) albo złagodzić obietnicę ujść do 15/20 (decyzja produktowa).
3. Piny i pozostałe testy z etapu 4 nie zostały przepięte - nie zmierzono.

ZNALEZISKA POZA ZAKRESEM (UWAGI-DLA-ORKIESTRATORA):
- Tekst w wiadomości harnessu (fragment "Ogólne: 16A 17- ... 18A" o mennicy: osierocona Mennica, wyburzanie, budowa w nowej stolicy) nie należy do tego dispatchu i nie został zaimplementowany w tej rundzie. Odpowiada on zadaniom #162/#175 w kolejce; orkiestrator decyduje o przydziale.
- Brak node_modules w worktree: zainstalowano npm ci --ignore-scripts w gra/ (tylko do testów; usunięte po sprzątaniu).

RUNDY: 1/5
NASTĘPNY KROK: decyzja właściciela wg BLOKAD 1-2 (ścieżka A/B), potem dokończenie etapu 4 (pozostałe testy) i pomiar czasu z powtórzeniami.
DEPLOY/PUSH: NIE WYKONANO
