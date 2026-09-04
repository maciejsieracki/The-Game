# GOAL 1 — inwentaryzacja WSZYSTKICH miejsc zmiany pozycji jednostki

Temat: `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1` · runda 1/5 · Operator (Opus 5, effort high)
Baza: `20f9993d` (= `origin/main`). Inwentaryzacja wykonana **PRZED** jakąkolwiek naprawą.

## Komenda wyszukiwania (mechaniczna, powtarzalna)

```bash
grep -rnE '\.(q|r)[[:space:]]*=[^=>]' gra/src --include=*.ts
```

Wynik na bazie `20f9993d`: **47 trafień w 6 plikach** (main.ts 26, post-battle-map.ts 8,
battleScene.ts 8, scout-auto-explore.ts 2, ai-city-capture-executor.ts 2, manualBattle.ts 1).

**Uzgodnienie z HEAD rundy 1 (żeby nikt nie dostał innej liczby niż zapisana).** Na HEAD ta
sama komenda zwraca **48**, nie 47. Różnica to **jedna linia KOMENTARZA** dodana w tej rundzie
(`gra/src/main.ts`, nagłówek helpera `revealAlongPathForStack`, tekst „…(`.q =` / `.r =`)…”) —
komentarz cytuje własny wzorzec i dlatego wpada w surowego grepa. Skaner bramki pomija **całe
linie komentarza** (blok [5] to osobno asertuje), więc widzi niezmiennie **47 trafień na
poziomie kodu**, wszystkie sklasyfikowane. Zapis „47" dotyczy kodu, „48" surowego grepa na
HEAD — obie liczby są prawdziwe, żadna nie jest zaokrągleniem.

Ta sama komenda jest zaimplementowana jako `RE_ZAPIS_POZYCJI` w bramce
`gra/tools/mgla-sciezka-inwariant-test.cjs` (blok [1]) — każde jej trafienie musi mieć wpis
w tabeli `KLASYFIKACJA`, inaczej bramka czerwieni.

### Wzorce pośrednie — komendy rozstrzygające i ich PRAWDZIWE wyniki

**Korekta rundy 1 (obrona, zarzut 2 Evaluatora).** Pierwsza wersja tej tabeli podawała dla
`Object.assign` wynik „0". To było **nieprawdą**: komenda `grep -rnE 'Object\.assign' gra/src
--include=*.ts` zwraca **244**. Merytoryczny wniosek się bronił (wszystkie 244 mają pierwszy
argument `*.style`), ale zapisana liczba nie była tym, co dostaje ktoś, kto uruchomi komendę —
a dispatch wymaga metody, „którą ktoś inny może uruchomić i **dostać ten sam wynik**". Poniżej
komendy faktycznie rozstrzygające, z wynikami odtworzonymi na HEAD rundy 1.

Komendy dosłownie, do skopiowania (uruchamiane z katalogu repo, nie z `gra/`):

```bash
# A. przypisanie zlozone i inkrementacja               -> 0 i 0
grep -rnE '\.(q|r)[[:space:]]*([-+*/%|&^]|\*\*|<<|>>>?)=' gra/src --include=*.ts | wc -l
grep -rnE '(\+\+|--)[[:space:]]*\w+\.(q|r)\b|\w+\.(q|r)[[:space:]]*(\+\+|--)' gra/src --include=*.ts | wc -l

# B. notacja nawiasowa                                 -> 6 (same userData Three.js)
grep -rnE "\[[[:space:]]*['\"](q|r)['\"][[:space:]]*\][[:space:]]*=[^=]" gra/src --include=*.ts

# C. Object.assign — naiwna vs rozstrzygajaca          -> 244, potem 0
grep -rnE 'Object\.assign' gra/src --include=*.ts | wc -l
grep -rnoE 'Object\.assign\([^,]*,' gra/src --include=*.ts | grep -v '\.style' | wc -l

# D. spread i podmiana elementu tablicy                -> 0 i 0
grep -rnE '\.\.\..*,[[:space:]]*q:' gra/src --include=*.ts | wc -l
grep -rnE 'units\[[^]]+\][[:space:]]*=[^=]' gra/src --include=*.ts | wc -l
```

| Wzorzec | Wynik na HEAD rundy 1 | Egzekwowany w bramce? |
|---|---|---|
| A. przypisanie złożone / inkrementacja | **0** i **0** | **TAK** — `RE_ZAPIS_ZLOZONY`, blok [1c] |
| B. notacja nawiasowa | **6**, wyłącznie `userData` Three.js: `render/cities.ts:486,487,528,529` i `battle/manualBattle.ts:677,678` — żadne nie jest jednostką | **TAK** — `RE_ZAPIS_NAWIASOWY` + whitelista `DOZWOLONE_NAWIASOWE`, blok [1c] |
| C. `Object.assign` na jednostce | naiwna: **244** (nie 0!); rozstrzygająca: **0** — wszystkie 244 wywołania mają pierwszy argument kończący się `.style` | **TAK** — `skanujObjectAssign`, wycinanie pierwszego argumentu z uwzględnieniem zagnieżdżeń (odporne na `Object.assign({a,b}, x)`), blok [1c] |
| D. spread + podmiana elementu tablicy | **0** i **0** | NIE — patrz nota niżej |

**Nota o dwóch ostatnich wierszach — świadoma granica, nie przeoczenie.** Spread sam w sobie
niczego nie mutuje (`{...u, q: x}` tworzy NOWY obiekt); żeby przemieścił jednostkę, wynik musi
zostać podstawiony z powrotem — czyli przez wiersz „podmiana elementu tablicy". A ten wzorzec
nie ma regexu, który byłby jednocześnie szczelny i wolny od fałszywych alarmów: każde
`tablica[i] = obiekt` w kodzie wyglądałoby tak samo. Te dwa wiersze są więc **pomiarem
wykonanym raz na HEAD**, nie asercją chroniącą przyszłość — i tak są tu zapisane, zamiast
udawać pokrycie, którego nie ma. Zostaje to jako ryzyko rezydualne w raporcie rundy.

Wniosek (skorygowany): `.q =` / `.r =` **nie jest** kompletną siecią samo z siebie. Kompletną
siecią na wszystkie wzorce realnie mutujące pozycję jest dopiero **suma czterech skanerów bloku
[1] + [1c]** bramki `mgla-sciezka-inwariant-test.cjs`, z jawnie nazwanym wyjątkiem powyżej.

## Tabela

`>1 heks?` = czy to przemieszczenie może przeskoczyć więcej niż jeden heks.
`Odkrywa wzdłuż ścieżki?` = czy heksy POŚREDNIE trafiają do `explored`.

| # | Miejsce (linie wg bazy 20f9993d) | Kontekst | >1 heks? | Odkrywa wzdłuż ścieżki? | Klasa |
|---|---|---|---|---|---|
| 1 | `main.ts:10419-10420` | `evictForeignUnitsFromCityHexes` | NIE — `findAdjacentEmptyHexes` | n/d | KROK-1-HEX |
| 2 | `main.ts:10617-10618` | BB2 „zostaw osobno", powrót armii | TAK, ale na origin marszu | n/d — heks już odwiedzony w tej turze, ruch w pełni refundowany | POWROT-NA-ODWIEDZONY |
| 3 | `main.ts:10776-10777` | rozdzielenie armii (split) | NIE — `findSplitDestHexes`, koszt 1 | n/d | KROK-1-HEX |
| 4 | `main.ts:10923-10924` | scalenie armii (merge) | NIE — `adjacentVisibleArmyHexes`, `moveCost = 1` | n/d | KROK-1-HEX |
| 5 | `main.ts:11634-11635` | ewakuacja z przejmowanego fortu | TAK — `findEvacuationHexOutsideCity`, pierścienie 1..20 | brak ścieżki: teleport, zwraca PIERWSZY wolny pierścień; odkrycie z celu przez `refreshFog` | TELEPORT-BEZ-SCIEZKI |
| 6 | `main.ts:20996`, `21026` | hak testowy wojny (Brąz/Żelazo) | n/d | n/d — przestawia **MIASTO**, nie jednostkę | NIE-JEDNOSTKA |
| 7 | `main.ts:21549-21550` | `pullPlayerUnitsHome` | TAK (teleport) | n/d — hak bramki testowej buntu | DEBUG-TEST-HOOK |
| **8** | `main.ts:22502-22503` | `applyMarchSegmentInstant` — ruch natychmiastowy stosu | **TAK** | **TAK** — `:22514` `computeVisibleAlongPath(result.movePath, …)` | **MIEJSCE 1/3** (naprawione wcześniej) |
| 9 | `main.ts:23033-23034` | konsola dewel. „zaokrętuj" | TAK (teleport na najbliższą wodę) | n/d — hak debug | DEBUG-TEST-HOOK |
| **10** | `main.ts:27677-27678` | koniec tury w trakcie animacji marszu | **TAK** | **TAK** — `:27689` `computeVisibleAlongPath(anim.pathHexes, …)` | **MIEJSCE 2/3** (naprawione wcześniej) |
| 11 | `main.ts:31962-31963` | barbarzyńca, komenda `move` | TAK | n/d — `explored` gracza liczy się wyłącznie z jednostek `ownerId === 0` | BEZ-MGLY-GRACZA |
| 12 | `main.ts:31985-31986` | barbarzyńca, komenda `raid` | TAK | n/d — j.w. | BEZ-MGLY-GRACZA |
| **13** | `main.ts:32405-32406` | koniec animacji marszu (`renderLoop`) | **TAK** | **TAK** — `:32435` `computeVisibleAlongPath(pathHexes, …)` | **MIEJSCE 3/3** (naprawione wcześniej) |
| **14** | `scout-auto-explore.ts:234-235` | `advanceScoutAutoExplore`, pętla `while (unit.ruchLeft > 0)` | **TAK — kilkanaście heksów w jednej turze** | **NIE ⇒ TO JEST CZWARTE MIEJSCE** | **NAPRAWIONE W TEJ RUNDZIE** |
| 15 | `ai-city-capture-executor.ts:104-105` | `executeAiCityMove` | TAK (`computePath`) | n/d — jednostka AI | BEZ-MGLY-GRACZA |
| 16 | `post-battle-map.ts:233-234` | rout fan-out po bitwie | NIE — `u.q + dq*step`, `step ≤ 3`, promieniście od heksu bitwy | n/d — cały wachlarz w zasięgu heksu bitwy, już odkrytego | KROK-1-HEX |
| 17 | `post-battle-map.ts:299-300` | zwycięzca wchodzi na heks bitwy | NIE — heks sąsiedni, widoczny | n/d | KROK-1-HEX |
| 18 | `post-battle-map.ts:312-313` | `retreatAtkRosterToStart` | powrót na `atkStart` | n/d — heks opuszczony w tej samej turze | POWROT-NA-ODWIEDZONY |
| 19 | `post-battle-map.ts:440-441` | wejście do zdobytego miasta | NIE — sąsiad, oblegany/atakowany, więc widoczny | n/d | KROK-1-HEX |
| 20 | `battleScene.ts:5422-5423, 6901-6902, 6918, 7532, 15554-15555` | bitwa taktyczna | n/d | n/d — `RuntimeBattleUnit`, siatka `col/row`, **inna przestrzeń współrzędnych** niż mapa świata | POZA-MAPA-SWIATA |
| 21 | `manualBattle.ts:1020` | bitwa ręczna | n/d | n/d — j.w. | POZA-MAPA-SWIATA |

## Czwarte miejsce — dlaczego było niewidoczne

`advanceScoutAutoExplore` **prowadzi własne** `workingExplored`
(`scout-auto-explore.ts:213`, `addExplored(workingExplored, computeVisibleAt(...))` po każdym
kroku) — ale to `new Set(explored)`, **kopia lokalna**, porzucana przy powrocie z funkcji.
Służy wyłącznie do wyboru kolejnego celu eksploracji. Jedynym zapisem do prawdziwego
`explored` był `refreshFog()` **po całej pętli** (`main.ts:27776`), a on liczy wyłącznie
z pozycji AKTUALNEJ (`currentVisible()` → `computeVisibleAt(u.q, u.r, …)`).

Kod wyglądał więc na poprawny („przecież tam jest `addExplored`") — i to jest powód, dla
którego trzy poprzednie audyty go przeoczyły.

## Hipoteza rzeczna — OBALONA jako osobna ścieżka kodu

`grep -rniE "rzek|river" gra/src --include=*.ts | grep -iE "ruch|move|cost|path"` → jedyne
trafienie ruchowe to `units/setup.ts:627-659`:

```ts
const RIVER_HEX_MOVE_COST = 1;
export function terrainMoveCost(hex: Hex): number {
  if (hex.rzeka?.obecna === true) { … return applyRoadMovementModifier(RIVER_HEX_MOVE_COST, hex); }
```

Rzeka to **płaska WARTOŚĆ kosztu** w `terrainMoveCost` — brak osobnej funkcji ruchu
rzecznego, osobnego pathfindingu i osobnego zapisu pozycji. Ruch rzeczny przechodzi przez
DOKŁADNIE te same 4 miejsca co każdy inny. Rzeka jest **mnożnikiem długości ścieżki**
(mierzone w `mgla-sciezka-rzeka-test.cjs` blok [A]: ten sam teren Wzgórza+Las kosztuje
3 MP bez rzeki i 1 MP z rzeką ⇒ przy 12 MP 4 heksy vs 12 heksów na turę), więc uwydatnia
ten sam defekt, nie jest osobnym defektem.

Obserwacja właściciela „zwłaszcza rzekami" była **trafna co do objawu i myląca co do
przyczyny** — i dlatego test rzeczny (GOAL 4) zostaje jako regresja na dokładnie ten
zgłoszony przypadek.
