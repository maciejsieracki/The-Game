# P-MAPGEN-PANGEA-OBRYS — sekcja „Pangea nieregularna" czerwona, bo metryka mierzy zły obrys

**Status:** 🟢 **ZAPISANA — D** (2026-08-07) · wdrożenie WSTRZYMANE do polecenia właściciela
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

## [TEMAT: metryka kształtu pangei]

**ID:** `P-MAPGEN-PANGEA-OBRYS`
**Sytuacja / Cel / Dlaczego teraz:** jak wyżej — mamy liczby, przyczynę i proweniencję progu.
Bramka obowiązkowa świeci czerwono z powodu, który nie jest defektem gry.

| | Opcja | Za | Przeciw |
|---|---|---|---|
| **D** | **Naprawić metrykę** — w `pangeaShapeMetrics` traktować `Wybrzeze` jako wodę (albo dodać `groupLandMassKeysStrict`) | 1. Usuwa **przyczynę**, nie objaw: mierzy to, co nazwa metryki obiecuje — linię brzegową lądu. 2. Zero zmian w generatorze → zero ryzyka dla spawnów, rzek i determinizmu, dopiero co dostrojonych przy `C-MAPA-Q1=B`. 3. Wszystkie 5 seedów przechodzi z zapasem 39–55 % nad progiem — bez „teaching to the test". | 1. Zmienia znaczenie liczby `coastRatio` w historycznych logach — stare wpisy przestają być porównywalne. 2. Próg 3,8 po naprawie staje się bardzo luźny (wszystko przechodzi z ogromnym zapasem) i przestaje cokolwiek bramkować — trzeba go osobno przekalibrować, żeby miał sens. |
| **B** | **Obniżyć próg** do wartości pod zmierzonym zakresem (np. 3,7) | 1. Zmiana wyłącznie w pliku testu — zerowe ryzyko dla gry. 2. Natychmiast zdejmuje czerwień. | 1. Utrwala **wadliwą metrykę** na stałe — nadal mierzymy krawędź pierścienia wody. 2. Dopasowanie testu pod obecny wynik; margines seed=123 (3,7987) jest tak blisko granicy, że przy nowym seedzie test znów zacznie oscylować. |
| **A** | **Podnieść nieregularność generatora**, żeby trwale trafiał `coastRatio > 3,8` | 1. Gdyby metryka była poprawna, to byłaby naprawa przyczyny. 2. Bramka zostałaby twarda. | 1. **Goni metrykę, która i tak mierzy krawędź pierścienia wody** — praca w złym miejscu. 2. Ingerencja w `landSea` ryzykuje spawny, rzeki i determinizm; margines to 0,0013–0,0222 jednostki, brak metryki „ile nieregularności wystarczy" → ryzyko nadkorekty. |

**Rekomendacja: D.** Opcja **D dominuje A i B** — usuwa przyczynę, nie dotyka generatora i zdejmuje
czerwień bez naginania testu. Zastrzeżenie do D jest realne: po naprawie próg 3,8 przestaje
bramkować cokolwiek, więc **w tym samym zleceniu** trzeba go przekalibrować — sensownie na percentylu
z ≥30 seedów, nie z 5.

**Osobno, niezależnie od litery:** rozważyć, czy progi czasowe AC (`standard <7 s`, `duża <15 s`)
mają nadal wchodzić do `allOk`, skoro na wolnej maszynie zawsze dają exit 1 i przez to maskują
każdą realną czerwień w tej bramce. To odrębny temat — nie mieszać z metryką kształtu.


---

## ECHO

**Odpowiedź Macieja:** „1" — pierwsza opcja z tabeli ABC, czyli **D**.

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **P-MAPGEN-PANGEA-OBRYS** | **D** | `pangeaShapeMetrics` traktuje `Wybrzeze` jako wodę (albo dostaje `groupLandMassKeysStrict`). **Zero zmian w generatorze.** |

### Wymogi wdrożenia (wiążące dla Operatora, gdy padnie polecenie startu)

1. **Zero zmian w `gra/src/map/generator.ts`.** Naprawa dotyczy wyłącznie liczenia metryki.
   Jeśli Operator uzna, że trzeba ruszyć generator — to znak, że źle zrozumiał zlecenie.
2. **Nie psuć `groupLandMassKeys` dla innych wołających.** Ta funkcja jest używana poza sekcją
   Pangei — sprawdzić wszystkie call-site przed zmianą sygnatury. Bezpieczniej dodać wariant
   `strict` niż zmienić zachowanie istniejącej funkcji.
3. **Przekalibrować próg w TYM SAMYM zleceniu.** Po naprawie metryki `coastRatio` wynosi
   5,29–5,89, więc próg 3,8 przestaje cokolwiek bramkować. Podstawa kalibracji: rozkład
   z **≥30 seedów**, nie z 5. Podać w raporcie: min, max, mediana, odchylenie, oraz proponowany
   próg z jawną regułą (np. „min − 2σ"), nie liczbę wziętą z sufitu.
4. **Wynik ma być zielony z zapasem**, ale nie tak luźny, żeby przepuścił dysk (podłoga 3,4380
   przy starej metryce — przeliczyć odpowiednik przy nowej) ani zwykły prostokąt.
5. Bramki: `map-gen-regression-test.cjs` (długi, uruchamiać w tle), `logic-test.cjs`,
   `fair-play-grid-test.cjs`, `relief-grid-coverage-test.cjs`, `npx tsc --noEmit`.
6. **Worktree przygotowuje orkiestrator** na właściwej bazie — `isolation: "worktree"`
   konsekwentnie odbija od `main`, nie od gałęzi roboczej (trzy realne wypadki 2026-08-07).
