# R-WEB-LIVE-VERIFY-MIXED-ARMY-REMEASURE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (pomiar wykonany; progi A1 złamany w jednym składzie M3, kandydat R-WEB-* opisany; kodu gry nie zmieniano)
DOMAIN: GAME (tylko pomiary; kod gry NIE zmieniany)
TEMAT: R-WEB-LIVE-VERIFY-MIXED-ARMY-REMEASURE-Q1
GOAL: ponowny pomiar na żywo mieszanej armii po FALACH 750–758 (narzędzie `gra/tools/live-verify-battle-after-full-move-live.cjs`), ≥ 8 nowych ziaren (11–18), ≥ 3 składy mieszane, tabela + histogram rozrzutu, progi: rozrzut ≤ 2, ciosy ≤ 1, niewykorzystany ruch ≤ 10%.

## Baza i środowisko

- BAZA/KANDYDAT: `cb29ce7af57fbeb667b144ff7bbf4f3c1ccae2a7` (origin/main), worktree odłączony (detached) od tego SHA.
- Dispatch oryginalny `dyspozycje/autobot/runs/.../00-dispatch.md` NIE istnieje w `origin/main` (`git show` zwrócił „does not exist"); użyto DODATKU z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`00-dispatch-DODATEK-claude.md`).
- Build: BRAK builda artefaktowego (MD5 NIE DOTYCZY). Narzędzie samo podnosi vite dev server in-process (`createServer` z `gra/vite.config.ts`, port wolny, 127.0.0.1) i Chromium headless z `/usr/bin/chromium` (`--use-gl=swiftshader`).
- Zależności: `npm ci` w `gra/` (71 pakietów, 134 MB node_modules; bez `build`/`dev`).
- Komenda: `cd gra && node tools/live-verify-battle-after-full-move-live.cjs --out <worktree>/dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-MIXED-ARMY-REMEASURE-Q1/evidence --part all --seeds 11,12,13,14,15,16,17,18`
- Uruchomienia: wszystkie na pierwszym planie, jeden proces Chromium naraz; 80/80 wierszy (`live-n2-n3.jsonl`), kod wyjścia narzędzia 1 (przyczyna: A1 w M3, patrz niżej), pageerror 0, timeout 0.

## Zmiana narzędzia (drobna, uzasadniona)

- `gra/tools/live-verify-battle-after-full-move-live.cjs`: +2 linie, nowy skład **M3** („mieszana asymetryczna”, atak `Wojownik:6,Lucznik:8,Konnica:6` vs obrona `Wojownik:12,Lucznik:4,Konnica:4`). Powód: dispatch wymaga ≥ 3 składów mieszanych; narzędzie miało 2 (M1, M2). Bez zmiany progów i logiki pomiaru.

## Tabela N2 (AUTO, czas rzeczywisty; zderzenie wrecz zawsze w rundzie 2)

Źródło: `evidence/live-n2-n3.jsonl`, `evidence/n2-spread-stats.txt` (wyliczone funkcją `analyzeRow` z narzędzia), tabela tool w `evidence/all-run-1.log`.
Rozrzut min/avg/max liczony po próbkach (strona × migawka do zderzenia, n=4 na bitwę).

| skład | ziarno | rozrzut frontu min/avg/max | niewykorzystany ruch % (obs) inf / strz / konn / machiny | ciosy/jedn./tura max | naruszenia |
|---|---|---|---|---|---|
| M1 mieszana (lustro) | 11 | 0/0.75/2 | 0 (105) / 1.1 (89) / 0 (36) / — | 1 | brak |
| M1 | 12 | 0/0.75/2 | 1.3 (78) / 0 (110) / 0 (41) | 1 | brak |
| M1 | 13 | 0/0.75/2 | 0.9 (116) / 1.3 (79) / 2.2 (45) | 1 | brak |
| M1 | 14 | 0/0.75/2 | 1.1 (91) / 1 (101) / 2.4 (42) | 1 | brak |
| M1 | 15 | 0/0.75/2 | 0 (81) / 0 (95) / 0 (39) | 1 | brak |
| M1 | 16 | 0/0.75/2 | 0 (47) / 0 (81) / 2.9 (35) | 1 | brak |
| M1 | 17 | 0/0.75/2 | 0 (93) / 0 (97) / 0 (48) | 1 | brak |
| M1 | 18 | 0/0.75/2 | 0 (107) / 0 (95) / 0 (46) | 1 | brak |
| M2 mieszana + Katapulta | 11 | 0/0.50/1 | 0 (109) / 0 (96) / 0 (60) / siege 0 (30) | 1 | brak |
| M2 | 12 | 0/0.50/1 | 0 (103) / 1.1 (95) / 0 (56) / siege 0 (28) | 1 | brak |
| M2 | 13 | 0/0.50/1 | 0 (156) / 1.5 (136) / 0 (100) / siege 0 (50) | 1 | brak |
| M2 | 14 | 0/0.50/1 | 0 (94) / 0 (94) / 0 (56) / siege 0 (28) | 1 | brak |
| M2 | 15 | 0/0.50/1 | 0 (102) / 0 (102) / 0 (47) / siege 0 (30) | 1 | brak |
| M2 | 16 | 0/0.50/1 | 0 (74) / 1 (101) / 0 (60) / siege 0 (30) | 1 | brak |
| M2 | 17 | 0/0.50/1 | 2.6 (117) / 0 (136) / 0 (96) / siege 0 (48) | 1 | brak |
| M2 | 18 | 0/0.50/1 | 0 (75) / 0 (102) / 0 (61) / siege 0 (30) | 1 | brak |
| M3 asymetryczna | 11 | 0/1.50/**3** | 0 (36) / 0 (100) / 0 (55) | 1 | **A1: rozrzut 3 > 2** |
| M3 | 12 | 0/1.50/**3** | 0 (61) / 0 (76) / 0 (38) | 1 | **A1: rozrzut 3 > 2** |
| M3 | 13 | 0/1.50/**3** | 2.4 (41) / 0 (104) / 0 (35) | 1 | **A1: rozrzut 3 > 2** |
| M3 | 14 | 0/1.50/**3** | 0 (44) / 0 (72) / 0 (48) | 1 | **A1: rozrzut 3 > 2** |
| M3 | 15 | 0/1.50/**3** | 1.5 (67) / 0 (100) / 0 (62) | 1 | **A1: rozrzut 3 > 2** |
| M3 | 16 | 0/1.50/**3** | 0 (59) / 0 (92) / 0 (47) | 1 | **A1: rozrzut 3 > 2** |
| M3 | 17 | 0/1.50/**3** | 0 (28) / 0 (116) / 0 (54) | 1 | **A1: rozrzut 3 > 2** |
| M3 | 18 | 0/1.50/**3** | 0 (52) / 0.8 (127) / 0 (49) | 1 | **A1: rozrzut 3 > 2** |

Zbiorcze: ciosy/jednostkę/turę max = 1 we wszystkich 24 bitwach (próg ≤ 1: OK). Niewykorzystany ruch: max 2.9% (próg ≤ 10%: OK) we wszystkich typach. Naruszenia: wyłącznie A1 w M3 (8/8 ziaren).

Histogram rozrzutu przed zderzeniem (maksimum na bitwę, 24 bitwy N2): **0: 0 · 1: 8 · 2: 8 · 3+: 8**.

Obserwacja NIE_ZMIERZONO: rozrzut (min/avg/max) jest identyczny dla wszystkich ziaren w obrębie jednego składu, choć wyniki bitew (zwycięzca, liczba rund 14–26) różnią się. Przyczyny nie zbadano (prawdopodobnie seed nie wpływa na rozstawienie i pierwsze ruchy; do weryfikacji przez Evaluatora).

## Diagnoza M3 (kandydat, NIE naprawiano)

Dowód: `evidence/m3-s11-first-snapshots.txt` (seed 11, migawki k=0..3). W rundzie 2 (k=1, pierwsza po starcie ruchu, przed zderzeniem):
- piechota atakującego: disp = 2 (wszystkie 6 jednostek),
- konnica atakującego: atk16 `x=29 disp=0 unused=1`, atk18 `x=33 disp=3`, atk14 disp 0 — rozrzut konnicy 0–3 kolumn,
- stąd rozrzut frontu (infantry + mounted) = 3.

Miejsce w kodzie (gra/src/battle/battleScene.ts, tylko do wskazania, bez zmian):
- `_lineAdvanceCap` (ok. l. 8469): dla `ru.mounted` zwraca +∞ — konnica nie jest wiązana sufitem kolumnowym rangi piechoty,
- `_paceCapFor` (ok. l. 8427): ogranicza tylko pulę ruchu (`moveLeft`) do najmniejszej puli rangi, a nie kolumnę docelową; `_paceExemptClass` (ok. l. 8408) = `false`, więc konnica nie jest zwolniona z pulą.
Hipoteza (NIE ZMIERZONO jako przyczyna): konnica, nie objęta sufitem kolumnowym, rozjeżdża się względem piechoty w pierwszych rundach; M1/M2 mieszczą się w progu, bo mają mniej konnicy/inne proporcje (M1 ma 4 konnicy, M3 ma 6 po stronie atakującego).

Kandydat do decyzji orkiestratora: **R-WEB-BATTLE-MOUNTED-FRONT-SPREAD-Q1** (nazwa robocza).
- Minimalna reprodukcja: part n2, mode auto, seed 11, atk `Wojownik:6,Lucznik:8,Konnica:6`, def `Wojownik:12,Lucznik:4,Konnica:4`; wiersz w `evidence/live-n2-n3.jsonl` (id `M3`, seed 11).
- Dowód: `evidence/live-n2-n3.jsonl` (snapshots), `evidence/m3-s11-first-snapshots.txt`, `evidence/n2-spread-stats.txt`.
- Pytanie do ABC (nie rozstrzygam): czy konnica ma być wiązana sufitem kolumnowym frontu przed zderzeniem (zmiana zachowania), czy próg A1 dla składów z konnicą ma być inny (decyzja progu należy do właściciela).

## Tabela N3 (ucieczka, pościg, neverRout; progi B1–B4 i K1–K5)

Źródło: `evidence/live-n2-n3.jsonl`, tabela w `evidence/all-run-1.log`. Wszystkie wiersze PASS.

| scenariusz | ziarna | tryb | zwycięzca | rozbicia (zdarz.) | pierwsze rozbicie (runda) | neverRout (liczba / losy) | ciosy neverRout po 1. rozbiciu | pościg razem/konnica/strz. | max kroki ucieczki / ruch |
|---|---|---|---|---|---|---|---|---|---|
| R1 Chaska×4 + piechota vs piechota+konnica | 11–18 | auto, skip | obrońca (16/16) | 13–17 | 1 | 4 / wszystkie 4 zginęły walcząc | 5–12 | 27–69 / 11–22 / 0 | 0.5 |
| R2 wręcz 12v12 Hastati | 11–18 | auto, skip | obrońca (16/16) | 12–17 | 3–6 | 0 | — | 2–19 / 0 / 0 | 0.33 |
| R2 instant | 11–18 | instant | — | — | — | — | — | — | rozstrzygnięcie bez bitwy (INFO, K1 OK) |
| R3 konnica vs piechota | 11–18 | auto, skip | atakujący (16/16) | 9–11 | 1 | 0 | — | 12–27 / to samo / 0 | 0.5 |

Naruszenia K1–K5 i B1–B4: brak (0 pageerror, 0 timeout, 0 routedLeft, bilans OK, fledNotAtEdge = 0). Odwrót armii po bitwie: NIE_ZMIERZONO (wymaga kampanii; INFO w narzędziu).

## Histogram N2 (podsumowanie)

Bitwy N2: 24. Maksymalny rozrzut na bitwę: 0 → 0 bitew; 1 → 8; 2 → 8; 3+ → 8 (wszystkie 8 to M3).

## TESTY (bramki z dispatchu, wyniki z surowego wyjścia)

- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/logic-test.cjs`: exit 0, ostatnia linia `LOGIC OK (213/213)`.
- `node tools/tech-tree-test.cjs`: exit 0, `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs`: exit 0, `ALL GREEN`.
- `node tools/unit-replace-test.cjs`: exit 0, `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node tools/combat-test.cjs`: exit 0, `All sanity checks passed.`
- `git diff --check`: czysto.
- `git status`: tylko `gra/tools/live-verify-battle-after-full-move-live.cjs` (zmiana narzędzia) i katalog runu. Testy matrix (`battle-large-mixed-doctrine-matrix-test.cjs`) NIE uruchamiane, tracked `R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1/01-matrix.json` nietknięty. Zrzuty PNG nie generowane (`--shots` nie użyte).

## BLOKADY

- Brak. Jedyna przeszkoda: nie ma oryginalnego pliku `00-dispatch.md` w `origin/main` (użyto DODATKU).

## RUNDY

1/5 (Operator, Haiku 5.5). Brak Sonnet na Operatorze (nie spełniono warunków zasady modeli).

## UWAGI-DLA-ORKIESTRATORA

- Kandydat R-WEB-BATTLE-MOUNTED-FRONT-SPREAD-Q1 (patrz wyżej) — do decyzji orkiestratora i właściciela; NIE zaplanowano ani nie uruchomiono (zgodnie z dispatchem: nie naprawiać, tylko opisać).
- Narzędzie domyślnie zapisuje do `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1/evidence` (stary run); tu użyto `--out`. Warto zmienić domyślną ścieżkę przy następnym runie.
- Rozrzut identyczny per ziarno w składzie — do sprawdzenia przez Evaluatora, czy seed w ogóle wpływa na rozstawienie.

## NASTĘPNY KROK

Evaluator (Sonnet) weryfikuje: tabelę vs `evidence/live-n2-n3.jsonl` (ponowne `analyzeRow`), diff narzędzia (+2 linie M3), bramki. Potem Final Control. Decyzja o kandydacie R-WEB-BATTLE-MOUNTED-FRONT-SPREAD-Q1 — po stronie orkiestratora/właściciela.

ZMIANY-COMMIT: patrz commit na gałęzi roboczej (zawiera: `gra/tools/live-verify-battle-after-full-move-live.cjs` (+2 linie, M3), `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-MIXED-ARMY-REMEASURE-Q1/**` (raport, `evidence/`).

DEPLOY/PUSH: NIE WYKONANO
