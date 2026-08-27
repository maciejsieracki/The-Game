# 02 — EVALUATOR (runda 1)

STATUS: W TOKU (uzupełniany przyrostowo; werdykt na końcu pliku)
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1
MODEL+EFFORT: Opus 5, effort high
RUNDY: 1/5
WORKTREE: /home/user/wt-ev2-lowiecki (detached @ 24ba11c4)
DEPLOY-PUSH: NIE WYKONANO

## 1. SCOPE / allowlista (16a.1, 16a.6, 16a.7)

`git diff --stat 0ad2c20a..24ba11c4` (merge-base, nie `origin/main..`, §9 poz. 10):
`01-operator.md` · `gra/data/terrain-improvements.json` (tylko `teren`/`warunek` wpisu
`oboz_lowiecki`) · `gra/src/map/improvement-build.ts` · `gra/src/ui/hexContextTooltip.ts` ·
`gra/tools/oboz-lowiecki-ai-40tur-measure.cjs` · `gra/tools/oboz-lowiecki-las-test.cjs`.
**Wszystko w allowliście.** `main.ts`, `ai.ts`, `auto-improvements.ts`, `WERSJE.md`,
`gra-robocza/**` — NIETKNIĘTE (potwierdzone diffem, nie deklaracją). Zero kolizji z
`P-DYPLO-WOJNY…` i `P-WYDARZENIA-ZBADANO…`. Brak sekretów. Brak usunięć poza jednym
nieużywanym importem `hasAnimalDeposit` w tooltipie. GOAL w raporcie = GOAL z dispatchu.

## 2. WŁASNA inwentaryzacja punktów egzekwowania — INNĄ METODĄ

Nie grep po `oboz_lowiecki`, tylko przejście ścieżkami wykonania (klik gracza → panel →
commit; automat; AI; tooltip; wczytanie zapisu; wyrąb). Wynik — 7 punktów:

| # | Punkt | Kto go używa | Stan po zmianie |
|---|---|---|---|
| P1 | `createQualifier`/`qualifies` (improvement-build.ts:801) | panel budowy (`canBuild`, `getQualifyingHexes`), automat, AI | poprawiony |
| P2 | `computeImprovementBuildImpact` (:343) | commit gracza `applyBuildRequest` (main.ts:11707) | poprawiony (NOWY gate) |
| P3 | `pickAutoImprovements` → P1 (auto-improvements.ts:433) | automat gracza **i AI** (`ai.ts:1986 planCityImprovements`) | poprawiony przez P1 |
| P4 | `listTerrainPossibleImprovements` (hexContextTooltip.ts:479) + `galleryTerrainEligible` (:915) | tooltip heksu | poprawiony |
| P5 | `depositAllowsPlayerImprovement` (:505) | `resource-access.ts:204` | poprawiony, ale **martwy dla tego klucza** (`oboz_lowiecki` ∉ `DEPOSIT_LINKED_IMPROVEMENTS`) — zmiana bez skutku, brak regresji (sonda D) |
| P6 | `migrateImprovementLayers` | wczytanie zapisu (main.ts:12009) | celowo nietknięty (kryt. 6) |
| P7 | **`stripImprovementsWhenForestRemoved` (:165)** | wyrąb lasu — gracz (main.ts:11895) **i AI** (:28906) | **NIE poprawiony — LUKA, patrz §5** |

Punkt kontrolny asymetrii: commit AI (`main.ts:28823`) **nie powtarza** `qualifies()` —
opiera się wyłącznie na P3. Ta ścieżka jest domknięta. Ścieżka `posterunek` z ai.ts:2123
tworzy `buildImprovement` z pominięciem kwalifikatora, ale tylko dla klucza `posterunek`.

## 3. Bramki uruchomione MOJĄ ręką (16a.3)

| Bramka | Wynik |
|---|---|
| `tsc --noEmit` | 0 błędów (pusty output, exit 0) |
| `tools/logic-test.cjs` | LOGIC OK (213/213) |
| `tools/tech-tree-test.cjs` | 19 pass, 0 fail |
| `tools/research-test.cjs` | PASSED 33 / FAILED 0 |
| `tools/unit-replace-test.cjs` | 13/13 |
| `tools/combat-test.cjs` | 6/6 |
| `tools/auto-improvements-test.cjs` | 45 passed, 0 failed (plik testu i `auto-improvements.ts` poza diffem → to jest baseline; bez pogorszenia) |
| `tools/oboz-lowiecki-las-test.cjs` (bramka tematu) | 71 passed, 0 failed |
| `tools/oboz-lowiecki-evaluator-probe.cjs` (MOJA sonda) | **87 passed, 1 failed** |

## 4. Pomiar AI 40 tur — MOJE ziarna + jedno jego (reguła e)

`OBOZ_SRC_DIR` na `git archive 0ad2c20a` (PRZED) vs bieżące `src` (PO), 3 miasta, 40 tur.

| ziarno | PRZED obóz/pastw. | PO obóz/pastw. |
|---|---|---|
| 42 (jego) | 31/19 | 31/19 |
| 5150 (moje) | 24/21 | 24/21 |
| 31337 (moje) | 28/22 | 28/22 |
| RAZEM | **83/62** | **83/62** |

Na jego ziarnie 42 dostaję **dokładnie jego liczby** (31/19) — brak rozjazdu, brak blokady
z reguły (e). Wniosek Operatora potwierdzony niezależnie: **zawężenie terenu nie zmieniło
zachowania AI ani o jedno pole.** Skarga „zamiast owcy buduje obóz" tym tematem nierozwiązana.
