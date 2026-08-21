# 04-operator-r2 — R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 (RUNDA 2)

STATUS: PASS
TEMAT: R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1
GOAL: Dokończyć Wątek C (cap 50% dla kontrolki #3, ECHO=A), potwierdzić Wątek E (ten sam stan
co #1/#2, zero dodatkowego kodu) i wykonać Wątek F (przeprojektowanie prezentacyjne panelu
„Podział pracy" w obu miejscach — empireDetailPanel.ts i cityPanel.ts).

## Provenance

- Worktree izolowany, branch `autobot/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1`.
- HEAD startowy zweryfikowany: `94d9483b` — dokładnie SHA wskazany w dyspozycji (tip po
  scaleniu rundy 1, brak nowszych commitów).
- Przeczytano w całości: `01-operator.md` (raport rundy 1, tabela 4 kontrolek z KROKU 1) oraz
  `docs/decyzje/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1.md` (ABC/ECHO właściciela, Wątek C=A,
  Wątek E="ta sama decyzja co Cap miasta 50%").
- `npm install` w `gra/` wykonany (node_modules brakował, tak jak w rundzie 1).

---

## WĄTEK C — cap 50% na kontrolce #3 (historyczny automat) — WYKONANE, ECHO=A

### Zmiana rdzenia

`clampUlepszeniaPracaPercent()` (`gra/src/game/cities.ts`) egzekwowała dotąd niezależny zakres
0–100%. Zgodnie z ECHO właściciela (Wątek C = A) zmieniono górny limit z literału `100` na stałą
`MAX_PRACA_WSPOLNY_WOREK_PROCENT` (dziś 50) — dokładnie ten sam cap, jaki ma
`clampPracaWspolnyWorekPercent()` (kontrolka #1/#2). To JEDNA zmiana w JEDNYM miejscu, ponieważ
`clampUlepszeniaPracaPercent` jest wspólną funkcją używaną przez WSZYSTKIE ścieżki zapisu/odczytu
tego pola:

- politykę imperium (`ulepszeniaEmpireByOwner.pracaAutoPercent`, ustawianą przez suwak „Globalny
  budżet automatu:" w `buildModeHud.ts` i wczytywaną z zapisu w `main.ts`),
- override per-miasto (`city.ulepszeniaPracaPercent`, ustawiany przez suwak „Lokalny budżet
  automatu:" w trybie „Indywidualne" i przez `resolveEffectiveUlepszenia()` w `cities.ts`),
- migrację starych zapisów (`ensureCitySaveDefaults()` w `cities.ts` i wczytywanie polityki
  imperium w `main.ts`, oba przez `resolveUlepszeniaPracaPercentFromRaw()` → `clampUlepszeniaPracaPercent()`).

Poza samą stałą zmieniono TYLKO komentarze dokumentujące decyzję (żeby nie zostawić w kodzie
nieaktualnego uzasadnienia „to jest historyczny budżet automatu, więc zachowuje 0–100%" — to
uzasadnienie zostało jawnie cofnięte przez ECHO). Zero zmian w sygnaturach funkcji, zero zmian w
logice ekonomii poza wynikiem clampu.

### Zasięg efektu (potwierdzone testami)

1. Miasto w trybie „Indywidualne" z override np. 70%/80% ulepszeń → teraz efektywnie 50%
   (`resolveEffectiveUlepszenia()`).
2. Globalny automat imperium (suwak „Globalny budżet automatu:", `buildModeHud.ts:425-431`) —
   również ścięty do 50% (ta sama funkcja clamp), UI zaktualizowane: `max={MAX_PRACA_WSPOLNY_WOREK_PROCENT}`
   zamiast `100` na obu suwakach automatu (globalny i lokalny override), z tekstem tooltipa
   zaktualizowanym pod nowy zakres.
3. Migracja zapisów: stary zapis z override >50% (np. 80%, albo legacy `ulepszeniaPerTurn=3` →
   100% po migracji) zostaje ścięty do 50% przy pierwszym wczytaniu (`ensureCitySaveDefaults`,
   wczytywanie polityki imperium w `main.ts`) — dokładnie to, o co prosiło ECHO właściciela
   („sprawdzenia migracji/save-load dla istniejących zapisów").

### UI (`buildModeHud.ts`)

Oba suwaki „Globalny budżet automatu:" i „Lokalny budżet automatu:" (`renderUlepszeniaPercentRow`)
zmienione z `max=100` na `max=MAX_PRACA_WSPOLNY_WOREK_PROCENT` (import wartości z `cities.ts`,
nie duplikat literału), tooltip zaktualizowany, żeby nie kłamał o zakresie 0–100%.

### Testy referencyjne — jawnie zmienione, nie tylko naprawione

Zgodnie z poleceniem ABC/ECHO ("scenariusz 5 musi się zmienić"), `gra/tools/praca-limit-50-test.cjs`
**PRZESTAJE dokumentować starą decyzję i teraz dokumentuje NOWĄ** (cap 50% wszędzie): sekcje 3–9
zaktualizowane z komentarzem wyjaśniającym cofnięcie wcześniejszej decyzji z 2026-08-17. Plik
`gra/tools/praca-miasto-limit-50-test.cjs` (kontrolka #4, osobny mechanizm) miał na końcu 3
asercje testujące WŁAŚNIE `clampUlepszeniaPracaPercent` jako "niezależną od lokalnego capu 50%"
(„automat 100% pozostaje legalny") — te też zaktualizowane pod nowy cap; **reszta pliku (kontrolka
#4, MIN=50/MAX=100 na Budynki) NIETKNIĘTA**, bo Wątek C nie zmienia tego mechanizmu.

Nowy test kontraktowy `gra/tools/praca-miasto-limit-50-cap-test.cjs` — analogiczny do
`praca-limit-50-test.cjs`, ale skupiony wyłącznie na ścieżce per-city automat + empire automat +
migracji save/load, z pełnym pokryciem granic (0/49/50/51/70/80/100/150) i dwoma konkretnymi
zrzutami ekranu właściciela (70/30 i 30/70) z ABC. **46/46 PASS.**

---

## WĄTEK E — potwierdzenie „ten sam stan", zero dodatkowego kodu

Recon rundy 1 (tabela KROKU 1, `01-operator.md`, wiersze #1/#2) już ustalił, że suwak „Podział
Praca: budynki / ulepszenia" w panelu Automatyzacji (`buildModeHud.ts:269-287`,
`renderEmpirePracaSplit`) czyta i zapisuje DOKŁADNIE ten sam stan (`ownerDefaultPracaSplit` /
`EmpirePracaSplit.procentUlepszenia`, przez `config.getEmpirePracaSplit`/
`onEmpirePracaSplitChange` → `effectivePracaSplitForOwner(0)`), co suwak #1 w panelu Praca
Imperium. **Zweryfikowałem ten kod ponownie w tej rundzie** — `renderEmpirePracaSplit` w
`buildModeHud.ts` (linia 269) ma zakres `min="0" max="50"` od zawsze, niezależnie od Wątku C
(cap tu pochodzi z `clampPracaWspolnyWorekPercent`, nie z `clampUlepszeniaPracaPercent`
zmienionego w tej rundzie). Ponieważ ECHO właściciela dla Wątku E brzmi „ta sama decyzja co Cap
miasta 50%" — a decyzja to „cap zostaje 50% (Wariant A dla kontrolki #1/#2/#3)" — ta gałąź ECHO
oznacza: **suwak #2 NIE rozszerza się do 0–100%, zostaje 0–50% bez zmian**. Zero kodu zmienione
dla Wątku E — nie jest osobnym parametrem, więc nie ma czego zmieniać oddzielnie; jego zachowanie
jest w pełni pokryte przez fakt, że jest to ten sam stan co #1 (rozszerzenie tu i tak by się
cofnęło przez #1 w tej samej turze).

---

## WĄTEK F — przeprojektowanie prezentacji panelu „Podział pracy" (czysto UI, ta runda)

Zakres: `empireDetailPanel.ts` `renderEmpirePracaBudgetSplitSection()` (kontrolka #1, panel
„Praca Imperium") oraz `cityPanel.ts` `renderPodzialPracy()` (kontrolka #4, panel „Podział
pracy" per-miasto). **Zero zmian logiki procentów** poza tym, co już wymagał Wątek C (który nie
dotyczy tych dwóch konkretnych kontrolek — #1 miała cap 50% od zawsze, #4 miała cap 50% od
zawsze, patrz tabela KROKU 1 rundy 1).

### Sprawdzone przed zmianą: czy Wątek B (runda 1) już to zrobił?

Wątek B rundy 1 zmienił WYŁĄCZNIE etykiety w `empireDetailPanel.ts` (`Budynki (50–100%)` →
`Budynki (0–100%)`, `Pula Pracy (0–50%)` → `Ulepszenia (0–50%)`, eyebrow „PODZIAŁ PRACY: BUDYNKI
/ PULA" → „.../ULEPSZENIA"). **`cityPanel.ts` `renderPodzialPracy()` NIE był tknięty w Wątku B** —
suwak lokalny per-miasto nadal miał etykietę „Budynki 50–100% / Pula Pracy 0–50% (lokalnie)" oraz
chip „Budowa" (nie „Budynki") w `appendPodzialPracyInfo()`. Ta runda dokańcza to przemianowanie w
`cityPanel.ts`, bez dublowania pracy Wątku B w `empireDetailPanel.ts` (tam zmieniono TYLKO układ i
usunięcie redundancji, nie nazwy — nazwy już były poprawne).

### `empireDetailPanel.ts` — `renderEmpirePracaBudgetSplitSection()`

Przed: eyebrow „PODZIAŁ PRACY: BUDYNKI / ULEPSZENIA" + osobna linia „Ulepszenia X% · Budynki Y%
(remainder)" + wiersz etykiet „Budynki (0–100%) / Ulepszenia (0–50%)" + wartość „X%/Y%" + suwak +
stopka „Suwak steruje tylko Ulepszeniami; Budynki zawsze = 100% − Ulepszenia." — ta sama para
liczb powtórzona ok. 3 razy tekstem.

Po: eyebrow „PODZIAŁ PRACY" (bez powtarzania nazw w środku) + **sygnał „Ulepszenia N%" jako hero
na samej górze sekcji** (żądanie właściciela: „podsumowanie ulepszenia na samej górze") + dwa
wyraźnie oddzielone boxy w układzie `.civ-emp-two` (wzorem istniejącego układu PULA IMPERIUM /
UTRZYMANIE ULEPSZEŃ wyżej w tej samej zakładce): **BUDYNKI po lewej** (wyliczany remainder, tylko
do odczytu) / **ULEPSZENIA po prawej** (interaktywny suwak 0–50%). Tooltip zredukowany do
jednego miejsca zamiast trzech.

### `cityPanel.ts` — `renderPodzialPracy()`

Przed: pojedynczy wiersz tekstu „Budynki 50–100% / Pula Pracy 0–50% (lokalnie)" + wartość
`pracaSplitBarLabelHtml` (ikony + %), potem suwak, potem `appendPodzialPracyInfo()` z chipami
Miasto/„Budowa"/Ulepszenia.

Po: **sygnał „Ulepszenia N%" (z ikoną `chip-crate`) na samej górze**, przed suwakiem — analogiczne
do zmiany w `empireDetailPanel.ts`. Poniżej dwie wyraźnie oddzielone kolumny `.praca-split-col
left`/`.right` (nowe, minimalne klasy CSS dodane obok istniejących `.praca-w4-sliders`):
**Budynki po lewej** / **Ulepszenia po prawej**, każda z ikoną + etykietą + wartością (%, ilość),
usuwając zdanie opisowe, które tylko powtarzało to, co już mówią ikony `cp-buildings`/`chip-crate`.
Suwak (zakres 50–100% na Budynki, MIN/MAX niezmienione — to jest kontrolka #4, poza zakresem
Wątku C) zostaje pod kolumnami, funkcjonalnie identyczny. Nazewnictwo: chip „Budowa" →
„Budynki" w `appendPodzialPracyInfo()`; „Pula Pracy" usunięte z widocznego suwaka (zastąpione
„Ulepszenia"). Funkcja `pracaSplitBarLabelHtml()` (nieużywana po zmianie) usunięta jako martwy
kod.

**Nie tknięto** `buildPracaDetailCard()` (osobna funkcja, karta „?" ze szczegółami/ściągą
algorytmu) — poza zakresem dwóch wskazanych funkcji, czysto edukacyjna treść, ryzyko scope creep
bez korzyści.

### Test kontraktowy zaktualizowany

`gra/tools/praca-split-ui-test.cjs` — 8 starych asercji (sprawdzających dokładne stare stringi
markupu) zastąpionych 11 nowymi, dopasowanymi do nowego układu (hero, kolumny, brak duplikacji),
plus 3 nowe asercje dla `cityPanel.ts` (sygnał na górze, dwie kolumny, brak „Pula Pracy" w
suwaku). **14/14 PASS.**

---

## ZMIANY / COMMIT

Allowlista wykorzystana (tylko `gra/src/` i `gra/tools/`, zero zmian w `docs/decyzje/`):

- `gra/src/game/cities.ts` — Wątek C: `clampUlepszeniaPracaPercent()` egzekwuje
  `MAX_PRACA_WSPOLNY_WOREK_PROCENT` zamiast `100`; zaktualizowane komentarze przy
  `resolveEffectiveUlepszenia()` i `ensureCitySaveDefaults()`.
- `gra/src/main.ts` — Wątek C: zaktualizowane 2 nieaktualne komentarze dokumentujące starą
  decyzję (linia ok. 19071 i 31720) — zero zmian logiki, `clampUlepszeniaPracaPercent` już robi
  całą pracę.
- `gra/src/ui/buildModeHud.ts` — Wątek C: oba suwaki automatu (`max=100` → `max=MAX_PRACA_WSPOLNY_WOREK_PROCENT`,
  import stałej), tooltipy zaktualizowane.
- `gra/src/ui/empireDetailPanel.ts` — Wątek F: przeprojektowanie
  `renderEmpirePracaBudgetSplitSection()` (hero + dwie kolumny, usunięta redundancja tekstu).
- `gra/src/ui/cityPanel.ts` — Wątek F: przeprojektowanie `renderPodzialPracy()` (sygnał na górze
  + dwie kolumny), rename „Budowa"→„Budynki" w `appendPodzialPracyInfo()`, usunięcie martwej
  funkcji `pracaSplitBarLabelHtml()`, nowe minimalne klasy CSS (`praca-split-summary`,
  `praca-split-cols`, `praca-split-col`).
- `gra/tools/praca-limit-50-test.cjs` — Wątek C: scenariusze 3–9 jawnie zmienione (nie tylko
  naprawione), dokumentują cofnięcie decyzji z 2026-08-17 zgodnie z poleceniem ABC/ECHO.
- `gra/tools/praca-miasto-limit-50-test.cjs` — Wątek C: 3 asercje na końcu (testujące
  `clampUlepszeniaPracaPercent` jako niezależny od capu) zaktualizowane pod nowy cap; reszta
  pliku (kontrolka #4) nietknięta.
- `gra/tools/praca-miasto-limit-50-cap-test.cjs` — NOWY test kontraktowy, Wątek C, pełne
  pokrycie ścieżki per-city automat + empire automat + migracja save/load.
- `gra/tools/praca-split-ui-test.cjs` — Wątek F: 8 asercji zastąpionych 11 nowymi + 3 dodatkowe
  dla `cityPanel.ts`.
- `dyspozycje/autobot/runs/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1/04-operator-r2.md` — ten
  raport.

Commit lokalny wykonany (NIE push) — patrz sekcja SHA/DIFF niżej.

## TESTY

- `npm install` w `gra/` — wykonane (node_modules brakował).
- `npx tsc --noEmit` — **PASS, 0 błędów** (przed i po zmianach).
- `node tools/praca-limit-50-test.cjs` — **PASS, 23/23** (zaktualizowany pod ECHO=A).
- `node tools/praca-miasto-limit-50-test.cjs` — **PASS, 33/33** (zaktualizowany pod ECHO=A dla 3
  asercji dot. `clampUlepszeniaPracaPercent`; reszta pliku bez zmian, nadal PASS).
- `node tools/praca-miasto-limit-50-cap-test.cjs` — **PASS, 46/46** (NOWY test, Wątek C).
- `node tools/praca-na-pieniadz-test.cjs` — **PASS, 23/23** (bez zmian, regres brak).
- `node tools/praca-split-ui-test.cjs` — **PASS, 14/14** (zaktualizowany pod Wątek F).
- `node tools/praca-global-default-live-test.cjs` — **PASS, 7/7** (bez zmian, regres brak).
- `node tools/praca-pula-rate-parity-test.cjs` — **PASS, 3/3** (bez zmian, Wątek D z rundy 1
  nadal trzyma).
- `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir` — **build PASS**
  (837 modules, 27.4s), `dist/` usunięty po weryfikacji (nie commitowany, nie generowany przez
  hook prebuild-eksportujący dane).
- `git diff --check` — **PASS**, brak konfliktów whitespace.

Suma: **7/7 plików `praca-*.cjs` PASS** (6 istniejących zaktualizowanych/niezmienionych + 1
nowy), zero regresji, build zielony, typecheck czysty.

## BLOKADY

Brak. Wątki C, E, F zamknięte w tej rundzie. Zero otwartych pytań ABC.

## NASTĘPNY KROK

1. Przekazać ten run do Evaluatora — z naciskiem na test save/load dla zmiany capu Wątku C
   (zgodnie z poleceniem orkiestratora w `docs/decyzje/.../R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1.md`,
   sekcja „Następny krok") — pokryte przez `praca-miasto-limit-50-cap-test.cjs` sekcja 6
   (`ensureCitySaveDefaults` z override 80%/50%/20%/legacy perTurn=3) oraz
   `praca-limit-50-test.cjs` scenariusze 6–9, ale Evaluator powinien to zweryfikować niezależnie.
2. Final Control, następnie integracja orkiestratora.

DEPLOY/PUSH: NIE WYKONANO

---

## SHA i diff

Baza (HEAD startowy tej rundy, zweryfikowany zgodnie z dyspozycją): `94d9483b3e65a2557b497a6c3cb4b565afc93301`.

Commit tej rundy zostanie wykonany zaraz po zapisaniu tego raportu (patrz `git log` po
commicie w tym worktree — commit lokalny na branchu
`autobot/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1`, NIE pushowany).
