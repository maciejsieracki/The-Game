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

## 5. ZNALEZISKO BLOKUJĄCE — P7: wyrąb lasu spod obozu (sonda §F)

Ścieżka wprost w grze, dla gracza **i** AI, prowadząca do obozu stojącego poza lasem:

1. obóz stawiany legalnie na `Nakladka.Las` (np. las na wzgórzu);
2. `qualifies('wyrab', …)` na TYM SAMYM heksie zwraca **`true`** — obecność obozu nie blokuje
   wyrębu (improvement-build.ts:790-795 sprawdza tylko `nakladka === Las` i terytorium);
3. egzekucja wyrębu: `finalizeHexClearing` (main.ts:11908) i AI (main.ts:28906) ustawiają
   `hex.nakladka = Brak` i wołają `stripImprovementsWhenForestRemoved`, która **jest pustym
   przelotem** (`return [...layers]`, improvement-build.ts:165-167) mimo że jej własny
   docstring obiecuje: „Po usunięciu lasu z heksa — odfiltruj ulepszenia zależne od nakładki Las".

Wynik zmierzony (nie wywnioskowany): `wyrab=true`, warstwy po wyrębie `["oboz_lowiecki"]`,
`nakladka='brak'` → **obóz łowiecki na heksie bez lasu, powstały w normalnej rozgrywce po
tej zmianie.** To jedyna czerwona asercja mojej sondy (F2).

Raport Operatora **nie wymienia tego punktu w ogóle** — a dispatch żądał wprost: „Wypisz
WSZYSTKIE znalezione punkty egzekwowania i pokaż stan każdego z nich po zmianie".
Hook `stripImprovementsWhenForestRemoved` **jest w allowliście** (`improvement-build.ts`).

Wybór między dwiema naprawami jest decyzją właściciela (kasuje opłacone ulepszenie albo
odbiera możliwość wyrębu), nie Operatora — to drugie pytanie ABC obok pytania o wariant:
(A) po wyrębie obóz znika · (B) wyrąb niedostępny dopóki stoi obóz · (C) obóz zostaje
(stan dzisiejszy, świadomie zaakceptowany, jak kryt. 6 dla starych zapisów).

## 6. Mutacje — powtórzone MOJĄ ręką (reguła f)

Liczba `[FAIL]` po jednej celowanej mutacji źródła (baseline sondy = 1, znalezisko §5):

| mutacja | bramka tematu | moja sonda |
|---|---|---|
| cofnięcie gate'u commitu (`computeImprovementBuildImpact`) | 8 | 16 |
| cofnięcie **samego** `createQualifier` | **0** | 1 (baseline) |
| cofnięcie OBU gate'ów silnika naraz | 22 | 30 |
| cofnięcie warunku w tooltipie | 5 | 8 |
| cofnięcie `galleryTerrainEligible` do `Łąka\|Równina` | 3 | 4 |
| cofnięcie `depositAllowsPlayerImprovement` | 1 | 1 |
| **pułapka: dopasowanie po podciągu nazwy terenu** (`'Plaskie (rownina/laka)'.includes('las')`) | **21** | **39** |

Pułapka „p-LAS-kie" jest realnie wyłapana — na WŁASNYM przypadku równiny i łąki, w czterech
wariantach złoża, na czterech ścieżkach (panel/commit/picker/tooltip) i na heksach z
`generateMap`. **BRAK DOWODU** dla `createQualifier` w izolacji (mut. = 0 FAIL) — potwierdzam
zgłoszenie Operatora: gate commitu maskuje gate panelu. To obrona w głąb, nie luka, ale
bramka nie odróżnia obu warstw.

## 7. Build (kanon C-001)

`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ev --emptyOutDir`
→ `848 modules transformed`, `built in 33.18s`, exit 0, `index.html` 37 476 170 B.
Zakaz `npm run build`/`dev` i `npx` — dotrzymany. `map-gen-regression-test` NIE uruchamiany.

## 8. Kryteria dispatchu 1–8

1 ✅ (4 typy złóż zwierzęcych × 4 ścieżki) · 2 ✅ (las na wzgórzu, też z `generateMap`) ·
3 ✅ · 4 ✅ (własny przypadek + mutacja pułapki) · 5 ✅ zmierzone i **odtworzone co do liczby**
na jego ziarnie · 6 ✅ (stare zapisy zostają; **ale patrz §5 — nowe obozy poza lasem nadal
powstają przez wyrąb**) · 7 ✅ · 8 ✅ (bramka nietautologiczna — woła prawdziwy
`buildHexContextTooltipHtml` i `migrateImprovementLayers`).

## 9. WERDYKT

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1
GOAL: Obóz łowiecki wyłącznie na nakładce Las (dowolny teren pod lasem, także wzgórze),
nigdy poza lasem — gracz, automat, AI jednakowo.
ZMIANY-COMMIT: bez zmian w `gra/src` i `gra/data`. Dodane: `gra/tools/oboz-lowiecki-evaluator-probe.cjs`
+ ten raport, gałąź `autobot/R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1`.
TESTY: tsc 0 · logic 213/213 · tech-tree 19/0 · research 33/33 · unit-replace 13/13 ·
combat 6/6 · auto-improvements 45/0 (baseline) · bramka tematu 71/71 · sonda Evaluatora 87/1 ·
build vite OK · AI 40 tur PRZED=PO 83/62 (ziarna 42, 5150, 31337).
BLOKADY: (1) P7 — wyrąb lasu spod obozu tworzy obóz poza lasem (§5), punkt nieujęty w
inwentaryzacji Operatora; hook w allowliście. (2) DECISION_REQUIRED — wariant `tylko Las`
niepotwierdzony przez właściciela (podtrzymuję zgłoszenie Operatora; pomiar `Las I złoże` = 0
pól odtworzony: `Nakladka` to jedno pole, `Las` ∉ `NAKLADKI_ZWIERZECZE`). (3) BRAK DOWODU dla
`createQualifier` w izolacji.
RUNDY: 1/5
NASTĘPNY KROK: Operator runda 2 — JEDNA poprawka: nazwać P7, dołożyć asercję na wyrąb pod
obozem i postawić właścicielowi pytanie ABC (A/B/C z §5) obok już otwartego pytania o wariant.
Reszta pracy rundy 1 zweryfikowana i zielona — nie przerabiać.
DEPLOY-PUSH: NIE WYKONANO
