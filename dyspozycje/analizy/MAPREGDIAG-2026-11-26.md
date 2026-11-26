# MAPREGDIAG — diagnoza 11 twardych naruszeń map-gen-regression-test (kandydat MAPFIX vs baza)

Data: 2026-11-26 · Tag: MAPREGDIAG · Temat: R-WEB-MAP-REGRESSION-DIAG-Q1 · Zero zmian w gra/src, gra/data, gra/tools.

## Wniosek

**MAPFIX NIE jest bezpieczny do wdrożenia w obecnej postaci.** MAPFIX (f781bbd0a) powoduje
**6 NOWYCH naruszeń** (przypadki z osieroconymi heksami sieci rzecznej, 63 heksy łącznie),
wszystkie na typie `wyspy`, deterministycznie powtarzalne. Pozostałe 5 naruszeń
(1 trasa bez ujścia + 4 przypadki kształtu Pangei) jest **ISTNIEJĄCYCH** — identyczne na bazie.

Liczba twardych naruszeń: baza = 5, kandydat = 11 (zgodne z raportem FC).

Przyczyna (eksperyment ablacji, nie tylko domysł): nowy wywołanie `purgeOpenOceanLandSpecks(hexes)`
w przebiegu 3e-final (`gra/src/map/generator.ts`, po `ensureRiverOutlets`, dla wszystkich typów)
zamienia w morze suche heksy bez lądowego sąsiada. Wyłączenie tego jednego wywołania
(na kopii kandydata, bez commita) zeruje osierocone heksy dla seed 777 / rivers=medium / wyspy
(6 → 0). Przywrócono plik kandydata przez `git checkout`.

## Metoda

- Runner: `dyspozycje/analizy/map-regression-diag/run-sections.cjs` (wznawialny, każdy przypadek
  zapisany jako linia `KLUCZ<TAB>JSON`; sekcja bench czasu pominięta zgodnie z dispatchem).
- Te same przypadki na obu drzewach: seedy [42,123,777,7,2026] × typy [kontynenty,pangea,wyspy,ziemia]
  × rivers [medium,high]; sekcje A (rzeki bez ujścia, mała mapa), B (sieć rzek + dopływy,
  standardowy), C (pangea nieregularna), D (chat), E (determinizm). Logika zgodna z
  `gra/tools/map-gen-regression-test.cjs` (sprawdzona linia po linii).
- Baza: `690947a2a` (origin/main przed MAPFIX), worktree tematu.
- Kandydat: `f781bbd0a` w osobnym worktree. **Uwaga:** f781 bazuje na `1bb77a7a0`, nie na
  `690947a2a`; różnice poza kodem mapy (building-demolish, main.ts, cityPanel) nie dotykają
  generatora. Różnice w `gra/src/map/` ograniczają się do trzech plików MAPFIX
  (`earth-land-mask.ts`, `gen-helpers.ts`, `generator.ts`), więc porównanie generatora jest czyste.
- Powtórzenie: 6 naruszeń kandydata B uruchomionych drugi raz — liczby identyczne → brak NIEDETERMINISTYCZNYCH.
- Determinizm generatora (sekcja E): hash A = hash B = `7db77e46` na obu drzewach.

## Tabela naruszeń

| Sekcja | Przypadek (seed / typ / rzeki) | Baza | Kandydat | Klasyfikacja |
|---|---|---|---|---|
| A | 777 / wyspy / high — szlak dopływu bez ujścia (idx 185, len 4) | 1 bez ujścia | 1 bez ujścia | ISTNIEJĄCE |
| B | 777 / wyspy / medium — osierocone heksy sieci | 0 | 6 | NOWE |
| B | 7 / wyspy / medium | 0 | 24 | NOWE |
| B | 2026 / wyspy / medium | 0 | 1 | NOWE |
| B | 123 / wyspy / high | 0 | 4 | NOWE |
| B | 777 / wyspy / high | 0 | 10 | NOWE |
| B | 7 / wyspy / high | 0 | 18 | NOWE |
| C | 42 / pangea — bboxFill 0,883 (próg < 0,87) | fail | fail (ta sama wartość) | ISTNIEJĄCE |
| C | 123 / pangea — bboxFill 0,881 | fail | fail | ISTNIEJĄCE |
| C | 777 / pangea — bboxFill 0,876 | fail | fail | ISTNIEJĄCE |
| C | 2026 / pangea — bboxFill 0,874 | fail | fail | ISTNIEJĄCE |
| A–E | pozostałe przypadki (kontynenty, pangea 7, ziemia, chat, determinizm) | OK | OK | — |

Sumarycznie: baza 1 (A) + 4 (C) = **5** twardych naruszeń; kandydat 1 + 6 (B) + 4 (C) = **11**.
Delta = **+6, wszystkie NOWE**, wszystkie typ `wyspy`, wszystkie w sieci rzek (sekcja B).

Chat (sekcja D): cel 70, postawione 70 na obu drzewach (zgodne). Pozostałe przypadki bez naruszeń na obu drzewach.

## Dlaczego to nie szum

- Baza ma 0 osieroconych heksów w 40 przypadkach B; kandydat ma 63 w 6 przypadkach.
- Wyniki powtarzają się identycznie przy drugim przebiegu.
- Ablacja jednego wywołania (purge w przebiegu 3e-final) usuwa osierocone heksy na przypadku 777/medium/wyspy.

## Mechanizm (wnioskowany z kodu, potwierdzony ablacją)

`purgeOpenOceanLandSpecks` działa po wygenerowaniu rzek. Heks lądowy bez suchego sąsiada
zostaje zamieniony w morze. Jeśli taki heks był częścią ścieżki rzeki, sąsiednie segmenty
tracą połączenie i stają się osierocone. Dla typu `wyspy` (małe wyspy, wiele pojedynczych
lądów) efekt jest częsty. Nie zmierzono bezpośrednio, który heks rzeki został zamieniony;
mechanizm jest wnioskiem z kodu i wyniku ablacji.

## Propozycja minimalnej poprawki (opis, kod poza allowlistą — NIE wdrożona)

Najmniejsza zmiana: w `purgeOpenOceanLandSpecks` (lub w wywołaniu w 3e-final) pomijać heksy
należące do dowolnej ścieżki rzeki (`riverPaths`), tak aby purge nie przecinał sieci rzecznej.
Alternatywa: przenieść purge przed `ensureRiverOutlets`. Obie wymagają ponownego pomiaru
sekcji B (6 przypadków) i sekcji C oraz bramki `map-gen-regression`. Nie zmierzono, czy
poprawka nie cofa efektu MAPFIX na „0 samotnych lądów”.

## Uwagi do decyzji orkiestratora

- Stan `main` (01790e553, FALA 925 MAPFIX) należy sprawdzić pod kątem tego samego wywołania
  purge; nie weryfikowano w tym temacie.
- Pangea (sekcja C) nie jest regresją MAPFIX; to ISTNIEJĄCE naruszenie bazy (4/5 przypadków).
- Pełne liczby surowe: `dyspozycje/analizy/map-regression-diag/base-results.tsv`,
  `cand-results.tsv`, `cand-repeat.tsv`, `trace-nopurge.tsv`.
