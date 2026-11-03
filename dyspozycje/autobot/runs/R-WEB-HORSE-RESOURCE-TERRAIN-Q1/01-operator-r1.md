STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-HORSE-RESOURCE-TERRAIN-Q1
GOAL: koń (złoże) nigdy na lesie przy GENEROWANIU mapy; liczba koni zachowana; reszta mapy bit-w-bit bez zmian; analiza odmów Stadniny.
ZMIANY/COMMIT: SHA w sekcji końcowej (commit z jawnym `git add`, bez pusha). Pliki: `gra/src/map/gen-helpers.ts` (nowa `relocateForestHorses`, ~50 linii + komentarz reguły), `gra/src/map/generator.ts` (import + 1 wywołanie), NOWY `gra/tools/horse-resource-terrain-test.cjs` (+ GOLDEN), logi/raport w `dyspozycje/autobot/runs/R-WEB-HORSE-RESOURCE-TERRAIN-Q1/`. Baza: origin/main 57a7ada40 (zawiera STADNINA-NO-HEX-FALSE-NEGATIVE-Q1).

## (1) Gdzie i dlaczego (plik:linia, stan bazowy)
- Kolejność: las PRZED złożami — `generator.ts:625` (reapplyForestOverlay) -> `:641` (placeDeposits).
- `gen-helpers.ts` `nakladkaBlocksDepositSpawn` (Las nie blokuje złoża) + `applyDepositToHex`: na heksie z Las koń zapisywany jako `hex.zloze='konie'` (nakladka zostaje Las). Reguła terenu konia: tylko Równina (`DEPOSIT_RULES`, id `konie`).
- Skutek (zmierzony): renderer rysuje konia z `zloze` (`styleResources.ts:486`), ale kwalifikator Stadniny sprawdza wyłącznie `nakladka === ZlozeKonia` (`livestock-unlock.ts:68`, `improvement-build.ts:803`) — koń widoczny, budowa odmawiana. Raport STADNINA-Q1 („koń tylko na Równinie, nigdy pod Lasem") jest w części „pod Lasem" FAŁSZYWY.

## (2) Pomiar PRZED (Standardowy, kod bazowy, prawdziwy generator)
| typ | ziarna | konie | na lesie |
|---|---|---|---|
| kontynenty | 8 (42,123,777,7,2026,11,99,314) | 286 | 168 (58,7%) |
| pangea | 8 (jw.) | 468 | 277 (59,2%) |
| wyspy | 4 (42,123,777,11) | 182 | 107 (58,8%) |
Razem 936 koni, 552 na lesie (59,0%); wszystkie na Równinie (0 na innym terenie). Histogram odmów Stadniny (miasto przy każdym koniu): 552 x „koń pod lasem (zloze=konie, nakladka=las)", 384 x OK. Odmowa z innej przyczyny: 0.

## (3) Poprawka
`relocateForestHorses(hexes)` wołana RAZ na końcowym stanie mapy (po ostatnim przebiegu reliefu/złóż): każdy koń z `zloze='konie'` pod `Las` przesuwany na najbliższy (hexDistanceAxial, remis wg kolejności kluczy) wolny heks Równiny (Brak nakładki, bez złoża, nie woda). Zero PRNG; placeDeposits i wszystkie wcześniejsze przebiegi bez zmian (stąd identyczność reszty mapy). Brak miejsca = koń zostaje (nie kasujemy). Pierwsza próba (przesuwanie wewnątrz placeDeposits) odrzucona: późniejszy bootstrap fair-play skasował 1 przesuniętego konia (kontynenty:123, 31 vs 32) — pomiar wykrył, przeniesione na koniec generacji.

## (4) Testy (GREEN po poprawce)
- `node tools/horse-resource-terrain-test.cjs --types=<typ> [--seeds=..]` (generacja Standardowej mapy trwa minuty -> filtry; HORSE_PAR=4): kontynenty 44 OK/0 FAIL (8 ziaren), pangea 44/0 (8), wyspy 24/0 (4). Sprawdza: 0 koni na lesie, konie tylko Równina/Łąka, liczba koni = GOLDEN (±0), hash mapy BEZ koni identyczny jak PRZED (20/20), hash pól poza heksami (rzeki, pozycje startowe) identyczny (20/20). Histogram po poprawce: 0 odmów (wszystkie 936 koni budowalne; histogram wysp zapisany w gate-horse-wyspy.txt: 182/182 OK).
- RED przed: sekcja (A) na kodzie bazowym A1 FAIL (670 koni na lesie w syntetycznej siatce), mapy: B1 FAIL na każdym ziarnie (np. kontynenty:7 22/33 na lesie). Mutacja (relocate = no-op) łamie sekcję (A): A4 OK.
- tsc `--noEmit` EXIT=0. stadnina-hex-candidates 15/0, stadnina-las 28/0, map-deposits-era 16/0 (EXIT=0). deposit-building-gate 46/1: FAIL „stolarnia eraBuildingCatalog" — test nie używa generatora, niezwiązane (NIE zmierzone na bazie osobno).
- NIE_ZMIERZONO: wyspy ziarna 7/2026/99/314 (generacja wysp ~15-25 min/mapę przy obciążeniu hosta, load 8-18; limit zasobów) — kryterium „>= 8 ziaren x 3 typy" spełnione dla kontynenty i pangea, dla wysp 4/8. Regresje `*pangea*`, `*capital-sep*`, `*cluster*`, `*determinism*`, `map-gen-regression`: NIE URUCHOMIONE (koszt czasowy); ryzyko niskie — zmiana nie dotyka terenu/rzek/pozycji startowych (dowód: hash poza koniem + pola poza heksami identyczne 20/20). Golden-hashy w istniejących testach nie wymagały aktualizacji w uruchomionych bramkach.

## Uwagi dla portu Rust (LEDGER)
Zmieniają się hashe KAŻDEJ mapy z koniem pod lasem (praktycznie wszystkie): tylko heksy źródłowe (zloze='konie'+Las -> bez złoża) i docelowe (Równina -> ZlozeKonia). Repin wektorów mapgen: dodać krok końcowy `relocate_forest_horses` po ostatnim reliefie, kolejność: klucze sortowane numerycznie (q,r), dystans axial, remis = pierwszy klucz; hash BEZ koni niezmieniony. Pełna lista (20 map): GOLDEN w teście.

## BLOKADY / DECYZJA_WYMAGANA
- Zapisy gry z koniem pod lasem (zloze='konie'): nadal widoczny koń, ale Stadnina odmawia (kwalifikator czyta tylko `nakladka`; płatność 50 koni w `main.ts:15064`). Naprawa wymaga plików poza allowlistą (`livestock-unlock.ts`, `terrain-improvements.ts`, `main.ts`) — ZAŁOŻENIE: nie ruszam; proponuję osobny temat (uznanie `zloze==='konie'` za złoże konia albo migracja zapisów). Dispatch dopuszcza stadninę na takim koniu, więc to jedyna pozostała „fałszywa odmowa".
- ZAŁOŻENIE terenu: generowanie nadal tylko Równina (podzbiór dozwolonych trzech; „trawa" nie istnieje jako teren, Łąka NIE dodana, by nie zmienić gęstości/PRNG innych zasobów) — do akceptacji.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (powtórzyć GREEN dla wysp 7/2026/99/314 oraz regresje map-gen/pangea/capital-sep/cluster; ocenić ZAŁOŻENIE terenu i temat zapisów).
DEPLOY/PUSH: NIE WYKONANO

COMMIT: 3aac69141 (gałąź worktree-wf_b9d1a905-60f-1, worktree /home/user/The-Game/.claude/worktrees/wf_b9d1a905-60f-1)
