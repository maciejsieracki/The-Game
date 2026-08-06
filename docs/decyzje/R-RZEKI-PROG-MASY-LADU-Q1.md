# R-RZEKI-PROG-MASY-LADU-Q1 — niespójny próg wielkości masy lądu dla generowania rzek

**Status:** 🟢 **ZAMKNIĘTA — FAŁSZYWY ALARM** (2026-08-06, weryfikacja niezależna, subagent)

## Sytuacja

Zgłoszenie: „niespójny próg wielkości masy lądu dla generowania rzek — FALA 199 obniżyła go do 5 w jednym
miejscu w `gra/src/map/gen-helpers.ts`, ale gdzie indziej został stary filtr `m.length >= 8`".

## Weryfikacja

**Krok 1 — dokument FALA 199 (kanoniczna wartość).** `dyspozycje/WERSJE.md:299` (wpis `046c3ec9`,
2026-08-02 22:32): *„Rzeki: bez cap liczby/komórek na Pangea; **masy od 5 hex**."* Diagnoza poprzedzająca
fix, `dyspozycje/PYTANIA-OTWARTE.md:1608` (Maciej, 2026-08-02 ~22:27, **PRZED** FALA 199): opisuje ówczesny
stan jako problem — „filtr `m.length >= 8`" blokował rzeki na mniejszych masach/wyspach. FALA 199 miała
temu zaradzić obniżeniem progu do **5** dla generowania rzek. Kanoniczna wartość dla rzek: **5**.

**Krok 2 — grep całego `gra/src/map/` za filtrami masy lądu w kontekście rzek.** Jedyny plik z takimi
filtrami to `gen-helpers.ts`. Wszystkie funkcje generowania/domykania rzek zweryfikowane indywidualnie
(kontekst funkcji odczytany, nie tylko numer linii):

| Linia | Funkcja | Filtr | Kontekst |
|---|---|---|---|
| 9562 | `refillMainRiverCoastMouthGapsOnMap` | `m.length >= 5` | domknięcie luk ujść rzek głównych (FALA 171) |
| 11541 | `generateRivers` (def. L11512) | `m.length >= 5` | generator główny rzek, 3 etapy (FALA 178) |
| 11781 | `topUpRiverGridCoverage` | `m.length >= 5` | domknięcie siatki startów rzek (2026-07-31) |

Wszystkie **trzy** miejsca związane z generowaniem rzek są dziś **spójne na wartości 5** — zgodnej z FALA 199.
Dodatkowo sprawdzone dwa pozostałe wystąpienia `groupLandMassKeys(hexes)` w pliku, oba **niezwiązane
z rzekami**: L1567 `landPartitionKeysForDistribution` (bez filtra długości) i L2965–2966
`growMountainRanges`/relief — filtr `m.length >= params.minMasaHexow` (parametr konfigurowalny reliefu,
nie stała rzek).

**Krok 3 — wystąpienia `m.length >= 8`.** Trzy miejsca, **żadne nie dotyczy rzek**:

| Linia | Funkcja | System |
|---|---|---|
| 2371 | `ensureReliefGridCoverage` | siatka fair-play żelazo/miedź na reliefie (Góry/Wzgórza) |
| 12304 | `ensureDepositGridCoverage` | siatka fair-play pakietu złóż (żelazo+miedź+glina) |
| 12383 | `ensureForestGridCoverage` | siatka fair-play pokrycia lasem |

Komentarz przy L12302–12303 w kodzie potwierdza zamiar wprost: *„fair-play-grid-test.cjs mierzy pokrycie
per SPÓJNA masa lądu (`groupLandMassKeys`), nie strefa Voronoi — `ensureReliefGridCoverage` /
`ensureForestGridCoverage` robią tak samo (**C-MAPA-Q1=B**)."* Te trzy systemy są **celowo spójne między
sobą** na wartości 8, na mocy odrębnej decyzji **C-MAPA-Q1=B** — niezależnej od progu rzek i od FALA 199.

## Wniosek

**Nie ma niespójności.** Dwa różne systemy (generowanie rzek vs. siatki fair-play reliefu/złóż/lasu) mają
**odrębne, każdy wewnętrznie spójny** progi wielkości masy lądu:
- **Rzeki** (3/3 miejsc): **5** — zgodnie z FALA 199 (`dyspozycje/WERSJE.md:299`).
- **Siatki fair-play reliefu/złóż/lasu** (3/3 miejsc): **8** — zgodnie z C-MAPA-Q1=B, jawnie skomentowane
  w kodzie jako celowa spójność między tymi trzema, niezależna od progu rzek.

Zgłoszenie prawdopodobnie wynikało z odczytania L1608 w `PYTANIA-OTWARTE.md` (opis stanu **przed** fixem
FALA 199, gdzie 8 rzeczywiście dotyczyło ówczesnego, wadliwego kodu rzek) jako opisu stanu **dzisiejszego**.

**Brak zmian w kodzie.** Kod pozostaje bez modyfikacji — obie grupy filtrów są dziś poprawne i zamierzone.
