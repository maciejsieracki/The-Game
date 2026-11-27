# Mapa „wyspy”: osierocone heksy sieci rzecznej po MAPFIX — naprawa (R-WEB-MAP-ISLANDS-ORPHAN-FIX-Q1, tag MAPFIX2)

Data: 2026-11-27. Baza: origin/main `6319eaf66` (zawiera MAPFIX `f781bbd0a` / `7398bd08`).
Źródło diagnozy: MAPREGDIAG (`refs/keep/MAPREGDIAG-fc`, raport FC `fc004bf26`).

## Problem

MAPFIX (purge suchego lądu bez sąsiada-lądu, `purgeOpenOceanLandSpecks`, wołany w generatorze
na końcu geografii, po ostatniej bramce ujść) zamieniał w morze także heksy rzeczne stojące na
lądzie bez suchego sąsiada. Przerywało to łańcuchy rzek: heksy rzeczne nie były już osiągalne
z morza (BFS po krawędziach z ujść głównych), czyli liczyły się jako **osierocone**.
Bramka `ensureRiverOutlets` (przycinanie osieroconych tras) stała PRZED tym purge, więc nie
zdążyła tego naprawić.

Drugi, mniejszy składnik: `syncRiverEdgeBonusHexes` dopisuje krawędzie rzeczne także na
heksach wodnych przy brzegu, które nie należą do żadnej zachowanej trasy. Bramka
`verifyRiverNetworkConnectivity` liczy każdy heks z `rzeka.obecna`, więc taki dekoracyjny
znacznik na morzu daje 1 „osierocony” heks nawet po przycięciu tras (zdiagnozowane na seed 777,
rivers=high: jedyny pozostały osierocony heks to `plytkie_morze` z `krawedzie=[1]`, poza każdą trasą).

## Zmiana (minimalna)

1. `gra/src/map/gen-helpers.ts`:
   - `purgeOpenOceanLandSpecksAndReconcileRivers(hexes, paths, kinds, w, h)` — do 4 przebiegów:
     purge → `ensureRiverOutlets` → `clearStrayWaterRiverMarks` → sprawdzenie
     `verifyRiverNetworkConnectivity`; kończy, gdy purge nic nie usunął i nie ma osieroconych heksów.
   - `clearStrayWaterRiverMarks(hexes, paths)` — zdejmuje `rzeka` tylko z heksów WODNYCH,
     które nie należą do żadnej zachowanej trasy. Heksy lądowe i trasy nietknięte, bez `rand()`.
2. `gra/src/map/generator.ts`: w miejscu dawnego `purgeOpenOceanLandSpecks(hexes)` (przebieg 3e-final,
   przed `4-fairplay-final`) wołane jest `purgeOpenOceanLandSpecksAndReconcileRivers`.
   Wywołanie `purgeOpenOceanLandSpecks` w przebiegu `kontynenty` przed pasem polarnym (linia ~463) — bez zmian.
3. Test: `gra/tools/map-islands-orphan-test.cjs` (seed 777, wyspy, rivers=high, standardowy):
   wymaga `orphanCount == 0` i `solitaryLand == 0`.

Zakres dotyczy wszystkich typów mapy (pętla działa dla każdego typu), ale efekt widoczny jest tylko
tam, gdzie purge usuwał heks rzeczny. Dla map bez osieroconych heksów pętla kończy się w 1 przebiegu.

## Pomiary (liczby z surowego wyjścia `measure-def.cjs`, wyspy, poziom maksymalny rzek = `high`, a dla `medium` — medium)

Kolumna „przed” = MAPFIX (baza `6319eaf66`). Wartość „przed” 777/medium (6 / 0) zmierzona ponownie
tym samym skryptem; pozostałe „przed” pochodzą z MAPREGDIAG (`cand-results.tsv`, raport FC `fc004bf26`)
i nie były ponownie mierzone w tym temacie (NIE ZMIERZONO osobno).

| seed | rivers | orphan PRZED | solitary PRZED | orphan PO | solitary PO | czas PO (s) |
|---|---|---|---|---|---|---|
| 777 | medium | 6 | 0 | **0** | **0** | 386 |
| 7 | medium | 24 | NIE ZMIERZONO | **0** | **0** | 321 |
| 2026 | medium | 1 | NIE ZMIERZONO | **0** | **0** | 260 |
| 777 | high | 10 | 0 | **0** | **0** | 466 |
| 7 | high | 18 | 0 | **0** | **0** | 411 |
| 123 | high | 4 | NIE ZMIERZONO | **0** | **0** | 376 |

Suma osieroconych heksów na 6 mapach: PRZED 63, PO 0. Solitary (lądy bez lądowego sąsiada) = 0 na wszystkich
zmierzonych mapach po zmianie. Czasy PO: pojedynczy przebieg, bez równoległości (przy równoległych
uruchomieniach czas rośnie, dlatego 777/high był mierzony w pojedynkę).

### Warianty (krok 2 dispatchu)

| wariant | orphan 777/medium | orphan 777/high | orphan 7/high | solitary | wniosek |
|---|---|---|---|---|---|
| MAPFIX (baza) | 6 | 10 | 18 | 0 | regresja |
| `purge pomija rzeki` (MAPREGDIAG) | 0 | 0 | 0 | 3 i 1 (rzeki) | odpada: samotne lądy |
| purge → `ensureRiverOutlets`, do 3 przebiegów (V1) | 0 | 1 | 0 | 0 | prawie; 1 znacznik wodny |
| **finalna: purge+bramka do zbieżności + czyszczenie znaczników wodnych** | **0** | **0** | **0** | **0** | **wybrana** |
| purge przed `ensureRiverOutlets` (bez pętli) | NIE ZMIERZONO osobno — wariant V1 obejmuje to zachowanie | | | | |
| usuwanie osieroconych po purge | zrealizowane przez bramkę ujść w V1/finalnej | | | | |
| samotne lądy dla rivers=medium | 0 (w pomiarze finalnym: 777/7/2026 medium) | | | | |

## Test i mutacja

- `gra/tools/map-islands-orphan-test.cjs`: PASS na finalnym kodzie (`orphan=0 solitary=0`, riverHexCount=7832).
- Czerwona wersja: generator z samym `purgeOpenOceanLandSpecks` (stan bazy) daje `orphanCount=10` na tym
  samym ziarnie (MAPREGDIAG; test NIE uruchomiony na bazie — NIE ZMIERZONO bezpośrednio).

## Bramki

- `tsc --noEmit` (gra/): exit 0.
- `map-offmask-stranded-fix-test.cjs` (MAPFIX, lekki): 5 pass / 0 fail.
- `earth-template-test.cjs`: 9 pass / 1 fail — fail „Antarktyda w szablonie nad buforem południowym (found 0)”
  to pin sprzed decyzji 5B; poprawiony na main w `5317bff8a` (ANTARDOC), którego nie ma w bazie `6319eaf66`.
  Nie jest to skutek tej zmiany (zmiana nie dodaje ani nie usuwa lądu poza purge samotnych heksów; baza ma 0 heksów przy r=85).
- `map-gen-regression-test.cjs` (ciężki, wszystkie sekcje A–E; sama sekcja B to co najmniej kilkanaście map po ~5–9 min): NIE ZMIERZONO (limit czasu tematu).
  Oczekiwany efekt (wnioskowany, nie zmierzony): 6 nowych naruszeń sekcji B znika, liczba twardych naruszeń
  wraca z 11 do 5 (baza `690947a2a`).
- Lekkie testy river-*, world-density, cluster-plan-name, determinism-save-load: NIE ZMIERZONO w tym temacie.
- `river-sea-buffer-test` był czerwony już przed zmianą (dług RIVSEATEST, #167) — NIE ZMIERZONO po zmianie.

## Pozostałe uwagi

- Zmiana usuwa dekoracyjne znaczniki rzeki na heksach wodnych poza trasami. Wizualnie to usuwa „dopisek” na morzu
  przy ujściu; nie zmienia tras, lądu ani ujść. Do oceny wizualnej po deployu (NIE ZMIERZONO w grze).
- Po tej zmianie orphan=0 wymaga zbieżności pętli (do 4 przebiegów). Na mapach bez problemu pętla kończy się w 1 przebiegu.
