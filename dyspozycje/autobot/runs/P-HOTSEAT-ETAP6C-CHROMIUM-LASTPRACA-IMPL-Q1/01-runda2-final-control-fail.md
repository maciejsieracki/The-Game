RUNDA: 2/5 (kontynuacja tej samej gałęzi/worktree)

## Werdykt Final Control rundy 1

Mimo że wszystkie 4 zarzuty Evaluatora rundy 1 zostały ODDALONE (obrona
skutecznie je naprawiła), Final Control znalazł PRZY WŁASNEJ, niezależnej
weryfikacji kodu NOWĄ, w-zakresie wadę → agregat: **FAIL**.

## Dokładna wada do naprawy

`gra/src/main.ts:18113-18115` wewnątrz `refreshLiveEmpireRatesUnsafe()`:

```
const pracaUpkeepPreview = computePracaUpkeepByOwner(
  map, buildAllTerritoryNodes(), data, _menuDifficulty,
).get(0) ?? 0;
```

`.get(0)` jest twardo zaszyte na ownerId 0, mimo że `computePracaUpkeepByOwner`
(`gra/src/game/turn-economy.ts:963-974`) faktycznie liczy utrzymanie Pracy
ODDZIELNIE per właściciel (ulepszenia surowcowe per owner różnią się między
fotelami). Ta sama funkcja kilka linii wyżej poprawnie filtruje
`playerCities = cities.filter(c => isMe(c.ownerId))` — `pracaUpkeepPreview`
powinno analogicznie czytać wartość dla `ME()`, nie stały klucz `0`.

Skutek: naprawiony w rundzie 1 zapis
`setOwnerLastPracaRate(ME(), pracaPoolBrutto - pracaUpkeepPreview)`
(main.ts:18180) trafia teraz do WŁAŚCIWEGO slotu cache (Zarzut 1 Evaluatora
w wąskim ujęciu naprawiony poprawnie), ale WARTOŚĆ jest błędna, gdy
utrzymanie Pracy fotela B różni się od fotela 0 — miesza brutto-przychód
własnego fotela z utrzymaniem fotela 0. Narusza kryterium #3 dispatchu
(„cache poprawny per fotel we wszystkich kierunkach, w tym `pracaRate`").

Dodatkowo: ten sam `.get(0)` sprawia, że akcesor `setOwnerLastPracaUpkeep`
(main.ts ok. 10874, wprowadzony w rundzie 1) ma DZIŚ zero wołających dla
ownerId≠0 — martwy per-owner write, niezgłoszony jako trzeci nazwany
wyjątek obok `playerPracaPool`/`_pracaRateFreshFromEndTurn`. Final Control
uznał to za naruszenie kryterium #1 (wszystkie 9 zmiennych zmigrowane albo
jawnie uzasadniony wyjątek).

Żadna istniejąca bramka (ani nowa `hotseat-etap6c-lastpraca-per-fotel-test.cjs`,
ani `hotseat-drugi-fotel-tura-test.cjs`) tego nie łapie — obie testują tylko
`praca`/przełączanie fotela, żadna nie asercjonuje `pracaRate`/`pracaUpkeep`
przy RÓŻNYM utrzymaniu obu foteli.

## ZADANIE rundy 2

1. Zmień `.get(0) ?? 0` na `.get(ME()) ?? 0` w main.ts:18113-18115 (albo
   równoważne, jeśli w międzyczasie zmieniła się dokładna linia — zweryfikuj
   przez `grep -n "pracaUpkeepPreview"`).
2. Zweryfikuj, czy `setOwnerLastPracaUpkeep` po tej poprawce ma realnego
   wołającego dla ownerId≠0 (jeśli nadal nie — zbadaj dlaczego i napraw albo
   jawnie uzasadnij).
3. Rozszerz `gra/tools/hotseat-etap6c-lastpraca-per-fotel-test.cjs` o
   scenariusz z RÓŻNYM utrzymaniem Pracy obu foteli (np. jeden fotel ma
   ulepszenia surowcowe generujące niezerowe `computePracaUpkeepByOwner`,
   drugi zero) i asercję na `hudPracaSnapshotForTest(ownerId).pracaRate`
   dla OBU foteli po przełączeniu — nie tylko `praca`.
4. Ponów PEŁNĄ listę testów z dispatchu (tsc, 5 bramek referencyjnych,
   hotseat-etap6c-economy-noop-test.cjs, hotseat-drugi-fotel-tura-test.cjs,
   nowa/rozszerzona bramka).
5. Żywy dowód Chromium pokazujący `pracaRate` poprawny dla obu foteli przy
   różnym utrzymaniu (nie tylko `praca`).

Reszta dispatchu (`00-dispatch.md`) i zakaz ruszania silnika
`playerPracaPool` (6 zakazanych zakresów linii) bez zmian.
