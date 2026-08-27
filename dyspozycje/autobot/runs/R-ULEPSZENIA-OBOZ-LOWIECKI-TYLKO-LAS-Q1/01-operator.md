# 01 — OPERATOR (runda 1, wznowienie po awarii poprzedniego przebiegu)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: `R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`
GOAL: Obóz łowiecki wyłącznie na nakładce Las — dowolny teren pod lasem (także wzgórze),
nigdy poza lasem; jednakowo dla gracza, automatu i AI.
MODEL+EFFORT: Opus 5, effort high.
RUNDY: 1/5 (poprzedni przebieg padł bez raportu — licznik nie rośnie, §3a).
DEPLOY/PUSH: NIE WYKONANO.

## KROK 0 — co przejmuję po poprzedniku i z jakim dowodem

Wszystkie punkty egzekwowania odnalezione i zweryfikowane **pomiarem zachowania**, nie regexem:

| Punkt egzekwowania | Plik | Stan | Dowód |
|---|---|---|---|
| lista/panel budowy gracza | `improvement-build.ts` `createQualifier:807` | Las-only | mut. M-C czerwieni 19 asercji |
| commit budowy (poza panelem) | `improvement-build.ts` `computeImprovementBuildImpact:346` | Las-only | mut. M-A czerwieni 8 asercji |
| automat ulepszeń | `auto-improvements.ts` → `buildImprovementQualifier` | dziedziczy | bez zmian w pliku, asercje pickera |
| AI | `ai.ts:planCityImprovements` → `pickAutoImprovements` | dziedziczy | j.w. — `ai.ts` NIE ruszany |
| tooltip heksu | `hexContextTooltip.ts:479` + `galleryTerrainEligible:915` | Las-only / bez wody | mut. M-D (8), M-E (3) |
| rezerwa złoża | `depositAllowsPlayerImprovement:508` | Las-only | mut. M-F (1) |
| wczytanie zapisu | `terrain-improvements.ts:migrateImprovementLayers` | **celowo nietknięty** | mut. M-G (3) |

`main.ts:12031` (`demoKeysForHex`) już bramkuje obóz `Nakladka.Las` — `main.ts` nie wymagał zmian.

**Przejmuję jako dobre**, z dowodem: zawężenie w 5 miejscach + bramka. **Nie przejąłem bez
zmian** asercji „stare zapisy" — była TAUTOLOGIĄ (czytała `Map`, którą sama zbudowała).
Podmieniona na realną ścieżkę wczytania (`migrateImprovementLayers`, wołaną z
`restorePlacedImprovementsFromSave`). Bramka: **33 → 71 asercji**, w tym sekcja na heksach
z `generateMap(42)` (gracz / automat+AI / tooltip / commit **osobno**) i wzgórze bez lasu dla
**wszystkich czterech** nakładek zwierzęcych.

## Nietautologiczność — 8 celowanych mutacji

M-A 8 FAIL · M-C 19 · M-D 8 · M-E 3 · M-F 1 · M-G 3 · M-H (pułapka „p-LAS-kie") 10 FAIL.
**M-B (sam `createQualifier`) = 0 FAIL** — zgłaszam jawnie jako BRAK DOWODU dla tej jednej
linii: `qualifies()` kończy się `computeImprovementBuildImpact(...) !== null`, więc oba gate'y
są redundantne i żaden z osobna nie da się wykryć. To celowa obrona w głąb, nie luka w kodzie.

**Pułapka „p-LAS-kie" (M-H):** własny przypadek na równinę. Podmieniłem oba gate'y na
dopasowanie po podciągu nazwy `'Plaskie (rownina/laka)'` — czerwienieje 10 asercji, w tym
`równina BEZ lasu → NIEDOSTĘPNY`. Trap jest realnie pilnowany.
**Las na wzgórzu (kryt. 2): DZIAŁA** — `mapa 42 (11,17)` gracz/automat+AI/tooltip/commit = TAK.

## KROK 2 — warianty (5 map 36×28, `kontynenty`)

| seed | ląd | dziś `Las LUB złoże` | `tylko Las` | `Las I złoże` | las na wzgórzu | wzgórze bez lasu ze złożem |
|---|---|---|---|---|---|---|
| 42 | 306 | 164 | 163 | 0 | 9 | 0 |
| 1337 | 304 | 158 | 158 | 0 | 4 | 0 |
| 2026 | 307 | 158 | 158 | 0 | 13 | 0 |
| 7 | 311 | 155 | 155 | 0 | 7 | 0 |
| 99 | 304 | 156 | 156 | 0 | 4 | 0 |
| **SUMA** | 1532 | **791** | **790** | **0** | 37 | **0** |

`Las I złoże` = 0 nie z powodu doboru map, tylko **strukturalnie**: `Nakladka` to JEDNO pole
(`types/hex.ts:28`), a `Nakladka.Las` nigdy nie należy do `NAKLADKI_ZWIERZECZE`
(`improvement-build.ts:607`). Sprawdziłem też drugi odczyt („złoże" jako `hex.zloze`) — też 0.
Do tego `gen-helpers.ts:11992` (Model B, 2026-07-09) **usunął z generatora złoża owiec/bydła**;
zostaje wyłącznie złoże koni na równinie → 1 pole ze złożem zwierzęcym na 5 map, **0 na wzgórzach**.

**Stąd `DECISION_REQUIRED`** (dyspozycja: przy wyniku bliskim zeru wybór wariantu nie należy do
Operatora). Zaimplementowany jest wariant **`tylko Las`**; `Las I złoże` uczyniłoby ulepszenie
martwym (0 pól, zawsze). Właściciel może to obalić jednym zdaniem.

## KROK 1 — PRZED/PO dla AI (3 ziarna × 40 tur, ta sama mapa i ziarno)

| ziarno | PRZED obóz/pastwiska | PO obóz/pastwiska |
|---|---|---|
| 42 | 31 / 19 | 31 / 19 |
| 1337 | 33 / 20 | 33 / 20 |
| 2026 | 35 / 17 | 35 / 17 |
| **RAZEM** | **99 / 56** | **99 / 56** |

PRZED = `git merge-base origin/main HEAD` = `0ad2c20a`, PO = ta gałąź; ten sam harness.

**MÓWIĘ WPROST: zawężenie terenu NIE rozwiązało skargi właściciela.** Liczby są identyczne
co do jednego pola. Powód: obozy poza lasem prawie nie istniały (791 → 790 pól na 5 map, −1),
bo złóż zwierzęcych na wzgórzach generator nie tworzy w ogóle. To, co właściciel widział jako
„obozy na wzgórzach", to **lasy na wzgórzach** — przypadek, który ma działać (kryt. 2).
AI dalej stawia **1,77× więcej obozów niż pastwisk**.

**ZNALEZISKO DO REJESTRU (poza allowlistą — nie zakładam tematu sam):** strojenie wag AI dla
`oboz_lowiecki` vs pastwiska. Przyczyna jest w dostępności terenu, nie w kolejności
`AI_IMPROVEMENT_PRIORITY` (pastwiska są tam PRZED obozem): lasu jest ~158 pól/mapę, a `owce`
wymagają OTWARTEGO wzgórza. Naprawa wymaga `ai.ts`/`auto-improvements.ts` — osobny temat.

## Kryterium 6 — stare zapisy

**Istniejące obozy poza lasem ZOSTAJĄ.** `migrateImprovementLayers` migruje wyłącznie legacy
`kopalnia` i celowo nie ruszony. Nowego obozu na tym samym polu już nie postawisz
(`canBuild=false`). Żadnej cichej migracji kasującej ulepszenia — dowód: mutacja M-G.

## ZMIANY/COMMIT

Allowlista, bez wyjątków (`git diff --stat` od merge-base): `gra/data/terrain-improvements.json`
(tylko `teren`/`warunek` wpisu `oboz_lowiecki`) · `gra/src/map/improvement-build.ts` ·
`gra/src/ui/hexContextTooltip.ts` · `gra/tools/oboz-lowiecki-las-test.cjs` ·
`gra/tools/oboz-lowiecki-ai-40tur-measure.cjs` · ten raport.
**Nietknięte:** `main.ts`, `ai.ts`, `auto-improvements.ts`, `terrain-improvements.ts`,
pozostałe wpisy JSON, `WERSJE.md`, `gra-robocza/**`, pliki trzech tematów równoległych.
Commity: `1ed473b9`, `bbc4ceed`, `08972e1f` (przejęte) + commity tej rundy na gałęzi.

## TESTY

`tsc --noEmit` 0 błędów · logic 213/213 · tech-tree 19 pass/0 fail · research 33/33 ·
unit-replace 13/13 · combat 6/6 · **auto-improvements 45/0 (baseline bez pogorszenia)** ·
**bramka tematu `oboz-lowiecki-las-test` 71/71**. `map-gen-regression-test` NIE uruchamiany
(zakaz dyspozycji). Bramki uruchomione na finalnym drzewie tej gałęzi.

## BLOKADY

1. `DECISION_REQUIRED`: potwierdzenie wariantu `tylko Las` (`Las I złoże` = 0 pól, strukturalnie).
2. BRAK DOWODU dla samego `createQualifier` w izolacji (M-B = 0 FAIL) — redundancja gate'ów.
3. Skarga „zamiast owcy buduje obóz" NIEROZWIĄZANA tym tematem — wymaga osobnego ID.

NASTĘPNY KROK: decyzja właściciela o wariancie, potem Evaluator (runda 1).
