# P-MAPGEN-PANGEA-OBRYS — sekcja „Pangea nieregularna" czerwona, bo metryka mierzy zły obrys

**Status:** 🟡 **OTWARTE — czeka na literę ABC** (2026-08-07)
**Wykonanie diagnostyki:** AutoBot Operator→Evaluator, `w2vcni6m1`. Werdykt Evaluatora na raport
Operatora: **FAIL** — pomiar był poprawny, ale dwa wnioski były fałszywe, a właściwej przyczyny
Operator nie znalazł. Poniżej wersja po korektach Evaluatora, zweryfikowana niezależnie.

## 1. Fakty zmierzone (dwie niezależne serie, zgodne co do 10 miejsc po przecinku)

Sekcja `=== Pangea nieregularna (FALA 187, 5 seedów standardowy) ===` daje **4 fail na 5 seedów**:

| seed | massCount | dominantRatio | bboxFill | `coastRatio` (coast/√A) | wobec progu > 3,8 |
|---|---:|---:|---:|---:|---|
| 42 | 1 | 1,000 | 0,8559 | **3,7887** | FAIL, brakuje 0,0113 |
| 123 | 1 | 1,000 | 0,8490 | **3,7987** | FAIL, brakuje 0,0013 |
| 777 | 1 | 1,000 | 0,8530 | **3,7778** | FAIL, brakuje 0,0222 |
| 7 | 1 | 1,000 | 0,8332 | **3,8272** | PASS, nadwyżka 0,0272 |
| 2026 | 1 | 1,000 | 0,8513 | **3,7795** | FAIL, brakuje 0,0205 |

Każdy z 4 failujących seedów łamie **wyłącznie** warunek `coastRatio > 3,8` — `massCount`,
`dominantRatio` i `bboxFill` są spełnione we wszystkich 5 przypadkach.

## 2. To NIE jest regresja po `C-MAPA-Q1=B`

Pomiar na commicie `8044900` (rodzic `807b177`, czyli stan **przed** `C-MAPA-Q1=B`) i na `HEAD`:
**delta 0,0000000000 na wszystkich 5 seedach, dla wszystkich 4 metryk** — bit w bit.

Potwierdzenie strukturalne: `807b177` i `41eed4d` operują wyłącznie na już istniejących heksach
lądowych (relief, złoża, las). `coastRatio` liczony jest z geometrii ląd–morze ustalanej w fazie
`landSea`, **przed** fazą `relief` — poza zasięgiem obu commitów. W dodanym kodzie zero przypisań
`TerenBazowy.Morze` (jedno wystąpienie, w komentarzu).

**Te same 4 seedy failowały tym samym marginesem, zanim `C-MAPA-Q1=B` w ogóle powstało.**

## 3. Właściwa przyczyna — metryka mierzy krawędź pierścienia wody, nie linię brzegową

`TerenBazowy.Wybrzeze` jest **wodą** — `gra/src/types/hex.ts:17`, wprowadzone commitem `bed3ea1`
o tytule dosłownie *„mapa — **wybrzeze jako woda** + dluzsze pasma gorskie + uproszczenie rzek"*.

Ale `groupLandMassKeys` (`gra/src/map/gen-helpers.ts:1402`) wyklucza **wyłącznie** `Morze`:

```ts
if (!hex || hex.terenBazowy === TerenBazowy.Morze) continue;
```

Skutek: cały pierścień płytkiej wody wchodzi do `landCount`, a mierzony „obrys" to **zewnętrzna
krawędź pierścienia Wybrzeża**, a nie linia brzegowa lądu.

| seed | heksów `Wybrzeze` | udział w rzekomym „lądzie" | `coastRatio` wg testu | `coastRatio` przy woda = Morze + Wybrzeże | wobec progu 3,8 |
|---|---:|---:|---:|---:|---|
| 42 | 2 071 | 15,6 % | 3,7887 | **5,3026** | FAIL → **PASS** |
| 123 | 2 042 | 15,4 % | 3,7987 | **5,5901** | FAIL → **PASS** |
| 777 | 2 106 | 15,9 % | 3,7778 | **5,2932** | FAIL → **PASS** |
| 7 | 2 162 | 16,2 % | 3,8272 | **5,8931** | PASS → **PASS** |
| 2026 | 2 060 | 15,3 % | 3,7795 | **5,4300** | FAIL → **PASS** |

**Prawdziwy obrys lądu ma `coastRatio` 5,29–5,89 — o 54–71 % powyżej podłogi geometrycznej.
Generator robi dokładnie to, czego chciała FALA 187.**

## 4. Próg 3,8 nie mierzy nieregularności — jest niżej niż zwykły prostokąt

| kształt (A ≈ 13 300 heksów) | `coastRatio` |
|---|---:|
| dysk heksowy R=66 (najgładszy możliwy) — **podłoga** | **3,4380** |
| stan obecny wg testu (5 seedów) | 3,7778 – 3,8272 |
| **próg testu** | **3,8000** |
| pełny prostokąt 115×115, `bboxFill` = 1,00 | **3,9652** |
| prostokąt 150×89 | 4,1024 |

Próg 3,8 leży **poniżej** wartości bezcechowego prostokąta i tylko 10,5 % nad podłogą dysku —
nudny prostokąt zdaje ten warunek. Dodatkowo `bed3ea1` (2026-07-20) **poprzedza** `6f96f08`
(2026-08-02, commit wprowadzający próg), więc 3,8 było dobierane **już przy wadliwej metryce** —
co tłumaczy, dlaczego zmierzone wartości oblepiają go z obu stron.

**Proweniencja liczby 3,8:** jeden commit `6f96f08` „FALA 199-200…", 2026-08-02 22:52 PL.
**Brak jakiegokolwiek uzasadnienia** w diffie, `docs/decyzje/`, `KANAL-PRACA.md`, `PYTANIA-OTWARTE.md`.
Etykieta „FALA 187" w tekście logu odnosi się do wcześniejszej fali (`ab9e6d3c`, `WERSJE.md:368-370`)
— do momentu wdrożenia *funkcji* nieregularnej pangei, nie do ustalenia progu.

## 5. ⛔ Korekta: bramka zwraca exit 1, nie exit 0

Pierwotny wpis w `PYTANIA-OTWARTE.md` (i powtórzony przez Operatora) twierdził, że
`pangeaShapeFail` nie wpływa na kod wyjścia. **To nieprawda.** Blok porażki inkrementuje **także
wspólny licznik `fail`**:

```
104| let fail = 0;                          ← jedyna deklaracja, nigdy nie zerowana
214|     fail++;                            ← w bloku porażki Pangei
258|   && tribJunctionFails === 0 && detOk && fail === 0 && villageOk;
259| process.exit(allOk ? 0 : 1);
```

Przy 4 porażkach `fail = 4` → `allOk = false` → **`process.exit(1)`**.

Niezależnie exit 1 wymuszają **progi czasowe AC**: `standard <7 s` (zmierzone **130,01 s**) oraz
`duża <15 s` (zmierzone **1194,15 s**) — `stdOk` i `duzyOk` też są koniunktami `allOk`. To znany,
udokumentowany artefakt wolnej maszyny (handoff §6), ale **oznacza, że ta bramka zwraca exit 1
zawsze na tym sprzęcie**, niezależnie od Pangei.

**Kryteria merytoryczne bramki wg `CLAUDE.md` pozostają zielone:** determinizm A=B **PASS**
(hash A=`85ec40a7`, B=`85ec40a7`, IDENTYCZNY), trasy bez ujścia **2124/2124**, główne rzeki
**1235/1235**, sieć rzek 0 sierot, dopływy 0 naruszeń.

---

## [TEMAT: metryka kształtu pangei] — TRZY NIEZALEŻNE PYTANIA

**ID:** `P-MAPGEN-PANGEA-OBRYS`
**Sytuacja / Cel / Dlaczego teraz:** mamy liczby, przyczynę i proweniencję progu (sekcje 1–5 wyżej).
Bramka obowiązkowa świeci czerwono z powodu, który nie jest defektem gry.

**Uwaga o formie:** pierwsza wersja tego dokumentu sklejała temat w jedną tabelę D/B/A. To był błąd —
te trzy decyzje są **rozłączne** i można je rozstrzygnąć osobno oraz różnie. Poniżej wersja rozbita.
**Żadna litera nie jest jeszcze wybrana.**

### PYTANIE 1 — co zrobić z metryką

| Litera | Opcja | Za | Przeciw |
|---|---|---|---|
| **A** | **Naprawić metrykę** — `Wybrzeze` liczone jako woda (nowy `groupLandMassKeysStrict` albo parametr) | 1. Usuwa przyczynę: mierzy to, co nazwa obiecuje — linię brzegową lądu. 2. Zero zmian w generatorze → zero ryzyka dla spawnów, rzek i determinizmu. | 1. Historyczne wartości `coastRatio` w logach przestają być porównywalne. 2. Wymusza przekalibrowanie progu (PYTANIE 2) — inaczej nic nie bramkuje. |
| **B** | **Zostawić metrykę, obniżyć próg** (np. 3,7) | 1. Zmiana wyłącznie w pliku testu, zerowe ryzyko dla gry. 2. Natychmiast zdejmuje czerwień. | 1. Utrwala wadliwą metrykę na stałe. 2. seed 123 (3,7987) leży tak blisko granicy, że przy nowym seedzie test znów zacznie oscylować. |
| **C** | **Zmienić generator**, żeby trafiał > 3,8 przy obecnej metryce | 1. Bramka zostaje twarda bez zmiany testu. | 1. Goni metrykę, która mierzy krawędź pierścienia wody — praca w złym miejscu. 2. Ingerencja w `landSea` ryzykuje spawny, rzeki i determinizm; margines to 0,0013–0,0222 jednostki, brak metryki „ile nieregularności wystarczy". |

**Rekomendacja: A.**

### PYTANIE 2 — na czym oprzeć nowy próg (dotyczy tylko, jeśli PYTANIE 1 = A)

| Litera | Opcja | Za | Przeciw |
|---|---|---|---|
| **A** | **Rozkład z ≥30 seedów**, próg = min − margines, reguła zapisana w komentarzu | 1. Pierwsza liczba w tej metryce z jawnym uzasadnieniem. 2. Odporna na nowy seed. | 1. ~30 generacji mapy standardowej (~40 s każda w tym środowisku). 2. Wybór marginesu nadal arbitralny. |
| **B** | **Próg z kształtów odniesienia** — musi odrzucić dysk i prostokąt, przepuścić obecny generator | 1. Próg zaczyna mierzyć **nieregularność**, a nie wielkość. 2. Sens niezależny od dzisiejszego generatora. | 1. Wymaga przeliczenia dysku i prostokąta przy nowej metryce. 2. Węższe okno — łatwiej o fałszywy alarm. |
| **C** | **Zostawić 3,8**, sekcja czysto informacyjna (wypiąć `fail++`) | 1. Zero pracy. 2. Bramka przestaje fałszywie czerwienić. | 1. Sekcja przestaje cokolwiek pilnować — martwy kod w teście. 2. Regresja kształtu przejdzie niezauważona. |

**Rekomendacja: B** — dopiero to daje progowi sens, którego dziś nie ma.

### PYTANIE 3 — progi czasowe AC (niezależne od pytań 1 i 2)

`standard <7 s` przy zmierzonych **130,01 s**, `duża <15 s` przy **1194,15 s**. Oba są koniunktami
`allOk`, więc **ta bramka zwraca exit 1 zawsze na tej maszynie**, niezależnie od Pangei — i przez to
maskuje każdą realną czerwień.

| Litera | Opcja | Za | Przeciw |
|---|---|---|---|
| **A** | **Wypiąć progi czasowe z `allOk`**, zostawić jako pomiar w logu | 1. Bramka zaczyna świecić na treść, nie na sprzęt. 2. Zgodne z tym, co handoff §6 już mówi („to pomiar wydajności, nie regresja"). | 1. Znika automatyczny sygnał realnego spowolnienia generatora. 2. Ktoś musi patrzeć na liczby w logu. |
| **B** | **Podnieść progi** do realnych wartości tej maszyny (np. 180 s / 1500 s) | 1. Zachowuje automatyczny sygnał regresji wydajności. | 1. Progi stają się zależne od sprzętu — na Windowsie znaczą co innego. 2. Aktualizacja przy każdej zmianie środowiska. |
| **C** | **Zostawić bez zmian** | 1. Zero pracy. | 1. Bramka pozostaje trwale czerwona i bezużyteczna jako sygnał. |

**Rekomendacja: A.**

---

**Osobno, niezależnie od liter:** wymogi wdrożenia (gdy padną decyzje) — zero zmian w
`gra/src/map/generator.ts`; nie psuć `groupLandMassKeys` dla innych wołających (sprawdzić wszystkie
call-site, bezpieczniej dodać wariant `strict`); bramki: `map-gen-regression-test.cjs` (długi,
w tle), `logic-test.cjs`, `fair-play-grid-test.cjs`, `relief-grid-coverage-test.cjs`,
`npx tsc --noEmit`; worktree przygotowuje orkiestrator na tipie gałęzi roboczej.
