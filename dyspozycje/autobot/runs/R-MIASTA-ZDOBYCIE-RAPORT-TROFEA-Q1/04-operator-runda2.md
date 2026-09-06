# R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — Operator, runda 2

STATUS: PASS
DOMAIN: GAME
TEMAT: R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1
GOAL: zamknąć zarzut 1 rundy 1 — przepisać `gra/tools/eliminacja-lup-kwoty-test.cjs`
na strukturę `reportRows` bez osłabienia, naprawić twardy crash, dowieść nietautologiczności.
MODEL+EFFORT: **Opus 5, effort high**.
BAZA: `99d6bcf01527d8db61bad829e70d8caa65475205` (potwierdzona `git log -1` PRZED pracą,
worktree `/home/user/wt-miasta-zdobycie-raport`, gałąź `autobot/R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1`).

## 1. Co zrobiono (zakres = dokładnie „RATYFIKACJA ORKIESTRATORA — runda 2")

Przepisany **wyłącznie** `gra/tools/eliminacja-lup-kwoty-test.cjs`. `main.ts`,
`cityCaptureNotice.ts`, `capital-capture.ts` — **NIETKNIĘTE** (poza dwiema mutacjami
nietautologiczności, cofniętymi; `git status` niżej). Zarzuty 2 i 3 nie otwierane.

**Metoda jest mocniejsza niż przed przepisaniem, nie słabsza.** Stara bramka wycinała
z `main.ts` literał sklejanego stringa i asercjonowała go dosłownie — czyli sprawdzała
w większości **kod źródłowy**. Nowa wycina i **URUCHAMIA** dwa fragmenty `main.ts`:
1. **BLOK CZYSTY** (markery `BLOK CZYSTY: POCZATEK/KONIEC`) → prawdziwe
   `buildCityCaptureReportRows` / `captureReportOneLine`;
2. **MIEJSCE WYWOŁANIA z gałęzi eliminacji** — od `const eliminationRows =
   buildCityCaptureReportRows({` po `const eliminatedDetails = captureReportOneLine(eliminationRows);`
   — uruchamiane z wstrzykniętym `outcome`/`powerGain`/`barbCaptor`.

Dzięki (2) asercje pokrywają **także mapowanie kwot w `main.ts`** (`zloto:
Math.floor(outcome.skarbiecPrzejety)` itd.), którego stara bramka dotykała wyłącznie
przez `includes()` na źródle. Etykieta Mocy pochodzi z **realnego `mocLabel()`**
(`ui/power-labels.ts`, zbundlowanego esbuildem), nie ze stałej w teście — inaczej asercja
„w tekście gracza nie ma słowa `Power`" byłaby tautologią.

## 2. Mapowanie 1:1 — każda stara asercja i jej następca

Znaczniki `[<- Xy]` są też **w kodzie bramki**, przy każdej asercji.

### Sześć asercji wymaganych jawnie przez ratyfikację (1a–1f)

| # | Co sprawdzała PRZED | Przez co jest sprawdzana PO |
|---|---|---|
| **1a** | że w `main.ts` istnieje start bloku — literał `const skarbiecKwota = Math.floor(outcome.skarbiecPrzejety);` | że istnieje **BLOK CZYSTY** wycięty po jawnych, wersjonowanych markerach `POCZATEK/KONIEC` — to jest dzisiejszy, stabilniejszy punkt zaczepienia tego samego kodu (nie literał, który GOAL 2 kazał usunąć) |
| **1b** | że istnieje koniec bloku — przypisanie `eliminatedDetails` sklejonym stringiem | że istnieje **miejsce wywołania gałęzi eliminacji** (`eliminationRows` … `eliminatedDetails`); zmienna `eliminatedDetails` nadal istnieje i nadal kończy ten fragment, tylko powstaje z wierszy |
| **1c** | że wycięty blok jest niepusty | że **oba** wycinki są niepuste i że BLOK CZYSTY niesie obu budowniczych raportu (`buildCityCaptureReportRows` + `captureReportOneLine`) |
| **1d** | że kwota złota to `Math.floor(outcome.skarbiecPrzejety)` (deklaracja `skarbiecKwota`) | **ta sama własność, nowe miejsce**: miejsce wywołania zawiera `zloto: Math.floor(outcome.skarbiecPrzejety),` |
| **1e** | że kwota nauki to `Math.floor(outcome.naukaPrzejeta)` (deklaracja `naukaKwota`) | j.w.: miejsce wywołania zawiera `nauka: Math.floor(outcome.naukaPrzejeta),` |
| **1f** | że gałąź barbarzyńska jest sterowana `barbCaptor` (`const eliminatedDetails = barbCaptor`) | że gałąź barbarzyńska **nadal jest sterowana `barbCaptor`** — `barbarzyncaZdobywca: barbCaptor,` w miejscu wywołania **oraz** `if (input.barbarzyncaZdobywca)` w BLOKU CZYSTYM |

### Pozostałe 18 asercji

| # | PRZED | PO |
|---|---|---|
| 0a, 0b, 0c | brak formattera walut w `main.ts` (grep) | **bez zmian** — dotyczy `main.ts`, nie nośnika raportu |
| 2a | pełny string `Skarbiec: +1234 złota. 3 tech(y) przejęte. Zdobycze Power: +777.` | `2a` — pozycja `Złoto ze skarbca` = `+1234`; `2a-2` — pozycja o nauce **w ogóle nie powstaje** przy nauce 0 (dawniej „bez wzmianki w zdaniu") |
| 2a-kontrola | `"1234"` literalnie w tekście | **bez zmian** (na spłaszczonej linii) |
| 2b | `Skarbiec był pusty.` przy skarbcu 0 | `2b` — pozycja o skarbcu **pominięta**, nie wypisana z zerem (GOAL 5 pkt 2); `2b-2` — przy pustym łupie powstaje dokładnie jedna świadoma pozycja `Łup: brak`. **To jedyna asercja, której SŁOWO zmienił dispatch**: własność „gracz dostaje jawną informację, że nic nie zdobył" jest zachowana, brzmienie „pusty" → „brak" wymusił GOAL 2 pkt 1 + ECHO (1) |
| 2b-kontrola | słowo `pusty` w tekście | `brak` w tekście — następca, ta sama rola |
| 2c | pełny string ze skarbcem 500 i nauką 88 | `2c` — `Złoto ze skarbca` = `+500`; `2c-2` — `Punkty nauki` = `+88` w **osobnej** pozycji (koniec defektu E2 „Nauka: +88 nauki") |
| 2c-kontrola, 2c-kontrola2 | `"88"` i `"500"` literalnie | **bez zmian** |
| 2d | `Math.floor` na 250.7 → 250 i 12.9 → 12 | `2d` i `2d-2` — te same liczby, ale podłogę wykonuje **faktyczny kod `main.ts`**, a nie builder; asercja mocniejsza |
| 2e | `Skarbiec i nauka przepadły (barbarzyńcy nie dziedziczą łupu).` | `2e` — pozycja `Łup: przepadł — barbarzyńcy nie dziedziczą zdobyczy`; `2e-2` — **żadnej** pozycji łupu mimo skarbca 999 i nauki 40. Sens zachowany, brzmienie zmienił GOAL 2 (uwaga recon E: „nie zepsuj tej gałęzi") |
| 3a | literał końcówki `${outcome.techSkopiowane.length} tech(y) przejęte. Zdobycze Power: +${lostPower}.` — **literał, którego usunięcia żąda GOAL 2 pkt 2** | `3a` — `Technologie` = `+3` dla 3 skopiowanych; `3b` — pozycja Mocy = `+777`; `3c` — w tekście gracza **nie ma** już `tech(y)` ani `Power`. Własność „liczba techów i Moc nadal raportowane konkretną liczbą" zachowana, dodatkowo domknięta skanem negatywnym |
| 4a–4d | realny `applyCapitalCapturePlunder`: outcome ≠ null, `eliminacja=true`, skarbiec 1500, nauka 63 | **bez zmian, te same liczby** |
| 4e | pełny tekst `Skarbiec: +1500 złota. Nauka: +63 nauki. 2 tech(y) przejęte. Zdobycze Power: +420.` | `4e` — dosłowna asercja na spłaszczonej linii z **tymi samymi czterema liczbami**; `4f/4g/4h` — 1500 / 63 / 2 każda we własnej pozycji; `4i` — etykieta Mocy z realnego `mocLabel()` = `Moc` |

**Żadna stara asercja nie została usunięta bez następcy.** Bilans: **24 → 35 asercji**,
każda kwota nadal sprawdzana konkretną liczbą.

## 3. Naprawa twardego crasha

`ReferenceError: eliminatedDetails is not defined` (stare linie 92/104) brał się z tego,
że przy nieudanym wycięciu bramka i tak wołała `new Function(blockCode + 'return
eliminatedDetails;')` na pustym `blockCode`. Dziś każda egzekucja wycinka jest w `try/catch`,
a brak wycinka daje `null` i **FAIL asercji**, nigdy wyjątek.

Dowód (mutacja M3 — `buildCityCaptureReportRows` → `buildCityCaptureReportRowsXX`, czyli
całkowita utrata wycinka): **10 passed, 25 failed, exit 1, podsumowanie wypisane** —
bramka dobiega do końca zamiast się wywalić.

## 4. Dowód nietautologiczności (kwota skarbca zepsuta w `main.ts`)

- **M1 — kwota skarbca w BLOKU CZYSTYM**: `value: '+' + input.zloto` → `'+' + Math.round(input.zloto / 10)`.
  Wynik: **28 passed, 7 failed, exit 1** — 2a, 2a-kontrola, 2c, 2c-kontrola2, 2d, 4e, 4f
  (m.in. `got "+123", want "+1234"` i `got "+150", want "+1500"`).
- **M2 — kwota skarbca w miejscu wywołania**: `zloto: Math.floor(outcome.skarbiecPrzejety)` → `zloto: 0`.
  Wynik: **27 passed, 8 failed, exit 1** — 1d, 2a, 2a-kontrola, 2c, 2c-kontrola2, 2d, 4e, 4f.
- Po cofnięciu obu: **35 passed, 0 failed**, a `git status --porcelain` w worktree pokazuje
  **wyłącznie** ` M gra/tools/eliminacja-lup-kwoty-test.cjs` — zero pozostałości po mutacjach.

## ZMIANY/COMMIT

- `gra/tools/eliminacja-lup-kwoty-test.cjs` — przepisany (allowlista rozszerzona ratyfikacją).
- `dyspozycje/autobot/runs/R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1/04-operator-runda2.md` — ten raport.
- `gra/src/main.ts`, `gra/src/ui/cityCaptureNotice.ts`, `gra/src/game/capital-capture.ts` — **bez zmian**.
- SHA commita rundy 2: patrz `ZMIANY/COMMIT` w podsumowaniu odpowiedzi Operatora.

## TESTY

- `node ./node_modules/typescript/bin/tsc --noEmit` — **0 błędów**.
- `tools/eliminacja-lup-kwoty-test.cjs` — **35 passed, 0 failed, exit 0, bez crasha** (≥24 ✓).
- `tools/miasto-zdobycie-raport-test.cjs` — **95/95**.
- Referencyjne: logic **213/213**, tech-tree **19/19**, research **33/33**,
  unit-replace **13/13**, combat **6/6**.
- Rodzina capture/elim (kontrola braku regresu): capital-capture **86/86**,
  elimination-toast-merge **54/54**, oblezenie **27/27**, post-capture-law **25/25**.
- Mutacje M1/M2/M3 — patrz §3 i §4.

## BLOKADY

Brak. Zarzut 1 rundy 1 uznaję za zamknięty: bramka nie jest wycofana ani osłabiona,
jest przepisana i mocniejsza (24 → 35 asercji, dowód runtime zamiast lektury literału).

RUNDY: 2/5
NASTĘPNY KROK: Evaluator rundy 2 (weryfikacja mapowania 1:1 i braku osłabienia), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
