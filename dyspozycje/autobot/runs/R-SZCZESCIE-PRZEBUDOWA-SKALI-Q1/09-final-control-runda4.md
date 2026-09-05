# R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 — Final Control, runda 4 (werdykt całego tematu)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1
MODEL+EFFORT: Opus 5, effort high.
GOAL: Werdykt końcowy całego tematu (cztery rundy), nie tylko rundy 4.
BAZA rundy 4: `ed6b73e2` · HEAD: `bf913490` · baza tematu: `f570a91a`.
IZOLACJA: wszystkie mutacje w KLONIE `--shared` poza worktree (+ drugi klon na bazie
tematu). `/home/user/wt-szczescie-skala` nie był zapisywany ani razu przed tym raportem —
`git status --porcelain -uall` puste przed i po. Dispatch zapowiadał HEAD `ed6b73e2`;
faktyczny HEAD to commit Operatora rundy 4 **na** `ed6b73e2` — stan właściwy dla Final
Control, nie rozbieżność.

## PYTANIE 1 — czy FC-M10 dziś czerwieni

**MUT-1** (`SZ_MAX_POP_WSP_DEFAULT` 0,04 → **0,5**): normalizacja **146 OK, 1 FAIL**
(`got 0.5 expected 0.04`), exit 1. Pozostałych pięć bramek zielone i tak ma być — podają
`society` jawnie, fallback nie leży na ich ścieżce. **MUT-4** (0,04 → **0,041**, dryf 2,5%):
**146/1**. Nawet mikrorozjazd czerwieni. Rundę 3 to zostawiało zielone na sześciu bramkach.

## PYTANIE 2 — czy asercja wiąże OBIE strony

Przeczytana w źródle, nie tylko po wyniku: lewa strona to `bezWsp.szMaxPopWsp` z modułu TS,
prawa to `wspNormalJSON` wczytane `fs.readFileSync` z `gra/data/society-params.json`. Dwa
niezależne nośniki — nie tautologia. **MUT-2** (dane `normal` 0,04 → 0,05): **141/6**, w tym
asercja R4 (`got 0.04 expected 0.05`). **MUT-3** (usunięcie wiersza z JSON): obie asercje R4
czerwone — resztkowa luka wzorca R3-C domknięta. **MUT-5** (`SZMAX_BY_ERA_DEFAULT` 70 → 71):
**143/4**, strażnik R3-C żywy. Liczba asercji 146 → **147**, nie spadła.

## PYTANIE 3 — czy runda 4 ruszyła balans

`git diff ed6b73e2..HEAD -- gra/data/` = **0 bajtów**. Runda 4 dotknęła trzech plików:
`society-breakdown.ts`, `szczescie-skala-normalizacja-test.cjs`, własny raport. `grep 0.048`
w `gra/src/` poza `render/`: zero (151 trafień w `render/` to geometria 3D modeli, bez
związku). **Zero zmian balansu.**

## PYTANIE 4 — allowlista i ratyfikacje całego tematu

31 plików w `f570a91a..HEAD`, każdy na allowliście dispatchu albo ratyfikacji R2/R3-B/R3-D.
`gra/src/main.ts` — diff **0 bajtów**, NIETKNIĘTY. Zero trafień na `docs/decyzje/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `playbook.json`, `order.ts`, `post-capture-law.ts`.
Liczby właściciela sprawdzone **własnym greppem po JSON**, nie z raportów:
`szczescie_max_epoka` 20/40/60 · 30/50/70 · 35/55/80 · cap 120 · współczynnik 0,04 ×3 ·
kultura/religia [10,16,23] ×3 · podatki −10/+10, próg 90 · wojna −5 · osiedle [15,12,8,5] ×3 ·
`_kara` +2/−2 · `dajeSzczescie` **19 true / 22 false**, zbiory identyczne z listami dispatchu,
zero rozbieżności · Spichlerz 4+1=5, Świątynia 3, Teatr 4, Akademia 4 · sześć cudów po 6
(diff pokazuje dokładnie pięć zmian 3→6; `koloseum` już miał 6; `mundo_perdido` `teren` +2 to
zastany bonus terenowy, nietknięty) · 7 martwych kluczy nieobecnych. **Ani jednej liczby
innej niż w dispatchu.**

## MUTACJE WŁASNE — dziewięć

| # | mutacja | skutek |
|---|---|---|
| MUT-1 | `SZ_MAX_POP_WSP_DEFAULT` → 0,5 (powtórka FC-M10) | normalizacja **146/1** (przed R4: zielona) |
| MUT-2 | dane `szczescie_max_pop_wspolczynnik.normal` → 0,05 | normalizacja **141/6** |
| MUT-3 | usunięcie wiersza `szczescie_max_pop_wspolczynnik` z JSON | obie asercje R4 czerwone |
| MUT-4 | `SZ_MAX_POP_WSP_DEFAULT` → 0,041 | normalizacja **146/1** |
| MUT-5 | `SZMAX_BY_ERA_DEFAULT` [30,50,70] → [30,50,71] | normalizacja **143/4** (R3-C) |
| MUT-6 | `buildings.json` `sad.dajeSzczescie` → false | przebudowa **513/6** (G1) |
| MUT-7 | `_kara.szczescieZaBrakujacy` −2 → −1 | upkeep **107/2**, przebudowa **508/11** (G8) |
| MUT-8 | `szczescie_kara_wojna.normal` −5 → −4 | przebudowa **518/1**, war-parity **18/3** (G9) |
| MUT-9 | `cityPanel.ts` `haCuda` zamrożony na 0 | przebudowa **501/18** (G15, jeden tor) |

Po każdej mutacji cofnięcie **kopią pliku**, nigdy `git checkout`; `git diff --quiet`
w klonie czysty po każdym cofnięciu. MUT-6/7/9 odtwarzają liczby FC-M3/M6/M2 co do sztuki.

## BRAMKI — własny przebieg

`tsc --noEmit` exit 0. Rodzina szczęścia/porządku, 15 bramek, wszystkie zielone:
building-happiness 14 · citizen-resource-upkeep 109 · culture-religion 65 ·
happiness-breakdown 38 · porządek-panel 81 · r-wzrost 59 · society-breakdown 53 ·
przebudowa-skali 519 · **normalizacja 147** · zamożność 88 · war-parity 21 · wealth 36 ·
religia-panel 15 · orderstate-restore 9 · ai-dług-porządki 17.
Referencyjne: logic **213/213** · tech-tree 19/19 · research 33/33 · unit-replace 13/13 ·
combat OK. Czerwone spoza rodziny: `border-march-wygasanie` **22/4** i
`unit-resource-upkeep` **3/4** — zmierzone przeze mnie w osobnym klonie na bazie tematu
`f570a91a` z **identycznymi** liczbami. Zastane, nie regres.

## WERDYKTY

1. Mutacja FC-M10 czerwieni bramkę (146/1) — **ODDAL**.
2. Asercja wiąże obie strony, dowiedzione MUT-2 i MUT-3, treść przeczytana w źródle — **ODDAL**.
3. Zero zmian balansu w rundzie 4 (`gra/data/` diff 0 bajtów) — **ODDAL**.
4. Allowlista, `main.ts`, ratyfikacje i liczby właściciela w całym temacie zgodne — **ODDAL**.

Zero NAPRAW, zero DO DECYZJI CZŁOWIEKA → agregat **PASS**.

## Obserwacja poza zakresem (nie zarzut)

`szczescie_religia_dominujaca` (3/2/1) i `szczescie_kultura_dominujaca` (2/1/0) mają zero
odczytów w `gra/src` i trójkę per trudność. Nie były na liście G14 ani w żadnej ratyfikacji —
zostawiam nietknięte, do wiadomości orkiestratora jako materiał na osobny temat.

## BLOKADY

Brak.

## RUNDY

4/5 zamknięte. Piąta niepotrzebna.

## NASTĘPNY KROK

Integracja allowlist-only ręką orkiestratora, potem `READY_FOR_DEPLOY`. Final Control nie
integruje i nie wystawia `READY_FOR_DEPLOY`.

DEPLOY/PUSH: NIE WYKONANO
