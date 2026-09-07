# R-HOTSEAT-ETAP-2-MGLA-WOJNY-Q1 — Operator, runda 1/5

## Świeży audyt (przed pracą)

`git log -1` PRZED pracą: `414996fc` (zgodne z dispatch). Grep globalnego `explored`
w `gra/src/main.ts` (świeży, nie z planu): ~24 miejsca czytające/piszące, w tym
save/load (linie ok. 27789, 34309/34554/34782/35187 — format zapisu, NIETKNIĘTE,
poza zakresem tej rundy zgodnie z GRANICE). Literały `0` jako argument do funkcji
JUŻ przyjmujących `ownerId`/`playerOwnerId` — po świeżym grepie realnie w zakresie
renderu/widoczności znalazłem dokładnie 4 call-site'y (nie licząc pętli AI, które
GOAL wyraźnie wyklucza): `unitsVisibleOnMap(units, vis, 0)` (~10028),
`cityRenderer.applyFogVisibility(vis, true, 0)` / `(ALL_KEYS, false, 0)` (~10091/10100
w `refreshFog()`), oraz `playerOwnerId: 0` w wywołaniu `getMinimapData(...)` (~21280).
Literał `currentVisibleForOwner(0)` — ZERO wystąpień (wszystkie realne wywołania już
używają zmiennej `ownerId`/`oid` z pętli AI, poza zakresem). `visibility.ts`/
`minimap.ts`/`cities.ts`/`wonderRenderer.ts` — same funkcje mają domyślny parametr
`= 0`, ale main.ts realnie przekazuje literał `0` tylko w miejscach wyżej; sygnatury
NIE zmienione.

## Zmiany (allowlista: `gra/src/main.ts` wyłącznie)

1. Dodano `ME(): number` — alias `humanSeats.activeHumanOwnerId` (zaraz po
   deklaracji `humanSeats`, ~10281).
2. Dodano `exploredByHuman: Map<number, Set<string>>` — scaffold rundy 1: JEDEN
   wpis `HUMAN_OWNER_PRIMARY -> explored`, DOSŁOWNIE ten sam obiekt `Set`, nie
   kopia. `explored` NIE usunięty (liczne miejsca zapisu/odczytu, w tym save/load,
   pozostają nietknięte w tej rundzie — patrz PROCEDURA/GRANICE dispatch).
3. `ownPlayerVisibleHexes()`: `u.ownerId === 0` / `c.ownerId === 0` → `ME()`.
4. `currentVisible()`: `allianceFormalKindBetween(activeDeals, 0, oid)` →
   `..., ME(), oid)`.
5. `refreshFog()`: `addExplored(explored, vis)` → `addExplored(exploredByHuman.get(ME())!, vis)`
   (behawioralnie identyczne w tej rundzie — patrz dowód niżej); dwa wywołania
   `cityRenderer.applyFogVisibility(..., 0)` → `..., ME())`.
6. `visibleUnitsList()`: `unitsVisibleOnMap(units, vis, 0)` → `..., ME())`.
7. `getMinimapData(...)` call: `playerOwnerId: 0` → `playerOwnerId: ME())`.

**NIE ruszone (świadomie, poza zakresem GOAL/GRANICE tej rundy):** `cityFogVisible`
(`city.ownerId === 0`, hardkodowany warunek, nie literał-argument), wnętrze
`currentVisibleForOwner(ownerId)` (`ownerId !== 0`, `allianceFormalKindBetween(activeDeals, 0, ownerId)`
— to identyfikator gracza używany też w logice sojuszu AI, poza GOAL pkt 4/5),
wszystkie `explored`-y w save/load i w blokach debug-hooków testowych (linie
19021/19147/19161/19167/19170/19181/19185/19191/19217/19333 — czytają/piszą
globalny `explored` z dynamicznym `ownerId` z pętli AI/testów, NIE literałem `0`
— GOAL wyraźnie wyklucza dotykanie pętli tur AI). **RUNDA 2** (na tym samym ID):
pełne odseparowanie `exploredByHuman` na realne osobne Sety per fotel (dziś to
jeden i ten sam obiekt) plus decyzja co z `explored`/save-format przy realnym
drugim fotelu.

## Dowód identyczności TREŚCI zbioru `explored` (nie tylko rozmiaru), PRZED/PO

Metoda: kopia `mgla-sciezka-live-test.cjs` (usunięta po użyciu, NIE część commitu)
z dodanym dumpem `sha256(sorted(getExploredKeys()).join('|'))` w dwóch
deterministycznych punktach scenariusza — [1] tuż po `resetFogToCurrentlyVisible()`
(przed turą), [2] po realnym końcu tury z auto-eksploracją zwiadowcy (realny
Chromium, realny `vite build`). Uruchomione DWA razy: raz na kodzie PO zmianie,
raz na `git stash` (kod PRZED, commit `414996fc`).

```
PO ZMIANIE:
  SCENARIUSZ-1-PRZED-TURA: size=326 hash=9fd882382dffada1cbf79491ba4c9a6a06de57bf05dacd0134e8673933fe1784
  SCENARIUSZ-2-PO-TURZE:   size=331 hash=96f24d5109be7bb6dd2c25882e874103d1d2a0344bf88f692ee93105064e9977
PRZED ZMIANĄ (git stash, main.ts=414996fc):
  SCENARIUSZ-1-PRZED-TURA: size=326 hash=9fd882382dffada1cbf79491ba4c9a6a06de57bf05dacd0134e8673933fe1784
  SCENARIUSZ-2-PO-TURZE:   size=331 hash=96f24d5109be7bb6dd2c25882e874103d1d2a0344bf88f692ee93105064e9977
```

Hashe identyczne w OBU scenariuszach — nie tylko rozmiar, treść (posortowana lista
kluczy) identyczna bit-w-bit. `first5`/`last5` posortowanej listy również identyczne
w obu przebiegach (np. scenariusz 1: `["39,31","39,32","39,33","39,34","39,35"]` /
`["57,27","57,28","57,29","57,30","57,31"]`).

## Testy

- `tsc --noEmit` w `gra/`: czysto (brak output).
- Bramki mgły/widoczności — PRZED i PO identyczne liczbowo:
  - `mgla-odkrycie-wzdluz-sciezki-test.cjs`: 16 pass, 1 fail (PRE-ISTNIEJĄCY FAIL,
    zweryfikowany przez `git stash` na `414996fc`: identyczny komunikat "currentVisible()
    nadal liczy WYLACZNIE z biezacej pozycji jednostek" — poza zakresem tego tematu,
    NIE spowodowany tą zmianą).
  - `mgla-odkrycie-wzdluz-sciezki-live-render-test.cjs`: 5 pass, 0 fail.
  - `mgla-sciezka-inwariant-test.cjs`: 42 pass, 0 fail.
  - `mgla-sciezka-live-test.cjs`: 10 pass, 1 fail (PRE-ISTNIEJĄCY FAIL [C4], niezwiązany
    komunikat konsoli o "Wojna wymuszona" — zweryfikowany identyczny na `git stash`
    baseline).
  - `mgla-sciezka-rzeka-test.cjs`: 14 pass, 0 fail.
  - `mgla-teleport-koniec-tury-test.cjs`: 16 pass, 0 fail.
  - `river-fog-visibility-test.cjs`: 31 pass, 0 fail.
  - `ai-fog-test.cjs`: 8/8 PASS.
- 5 bramek referencyjnych: `logic-test.cjs` 213/213, `tech-tree-test.cjs` 19 pass/0 fail,
  `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6 — wszystkie
  zielone.

## Blokady / uwagi

Brak DECISION_REQUIRED — żadna sygnatura eksportowanej funkcji publicznej nie zmieniona.
Dwa FAIL-e (mgla-odkrycie-wzdluz-sciezki-test.cjs, mgla-sciezka-live-test.cjs) są
przedmiotowo nietknięte tym tematem i zweryfikowane jako identyczne na baseline
`414996fc` przez `git stash` — nie są regresją tej rundy. Format zapisu/wczytania
(Etap 7) NIETKNIĘTY.

## Rozliczenie względem zakresu GOAL

Zakres tej rundy okazał się MNIEJSZY niż zakładano w GENEZA (świeży audyt: 4
realne call-site'y, nie "33"/"35" z planu — większość historycznych literałów `0`
w main.ts to identyfikator gracza w logice gospodarczej/dyplomatycznej, poza
zakresem "render/widoczność" tego tematu). Pełny zakres GOAL pkt 1-5 zrealizowany
w tej rundzie; scaffold `exploredByHuman` świadomie NIE w pełni odseparowany od
`explored` (ten sam obiekt) — to jest jawnie opisany fragment do rundy 2, zgodnie
z dozwolonym podziałem scaffold/migracja.
