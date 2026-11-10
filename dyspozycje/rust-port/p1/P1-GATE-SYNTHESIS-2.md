# P1-GATE-SYNTHESIS-2 — druga, aktualna synteza bramki P1 (wersja po obronie, runda 1/5, tura 2)

**Temat:** R-RUSTPORT-P1-GATE-SYNTHESIS-2-Q1 · **Operator:** Haiku 5.5 medium
**Źródło prawdy:** `dyspozycje/rust-port/LEDGER.md` (L1–L71, odczytany w całości), lista tematów z `PLAN-PORT-RUST-TAURI-20261020.md` §4, `GOAL-RUST-PORT-20261020.md`.
**Poprzednia synteza** (`P1-GATE-SYNTHESIS.md`) nie była źródłem wniosków.

## Kryterium binarne (z dispatchu)

Bramka P1 jest otwarta tylko wtedy, gdy WSZYSTKIE tematy P1.1–P1.18 (z podwariantami) mają status PASS. Dla tematu z następcami status gałęzi = status NAJNOWSZEGO ogniwa łańcucha. Numer w kolumnie „L” = numer wiersza w `LEDGER.md`.

## Tabela (41 pozycji)

| # | Temat | Ostatni wpis LEDGER (linia, data, status) | Plik wyniku | Ocena |
|---|---|---|---|---|
| 1 | P1.1 katalog plików gra/src | L27, 2026-10-20, PASS | p1/P1-1-FILE-CATALOG.md | PASS |
| 2 | P1.1b pozostałe podkatalogi | L38, 2026-10-20, PASS | p1/P1-1B-REMAINING-DIRS.md | PASS |
| 3 | P1.2 toolchain | L28, 2026-10-20, PASS | p1/P1-2-TOOLCHAIN.md | PASS |
| 4 | P1.3 intro/start | L36, 2026-10-20, PASS (ledger nie podaje pliku) | p1/P1-3-INTRO-START.md (plik istnieje na dysku, 2257 B; wskazanie z dysku, nie z LEDGER) | PASS |
| 5 | P1.4 wybór epoki | L40, 2026-10-20, PASS | p1/P1-4-EPOCH-SELECTION.md | PASS |
| 6 | P1.5 wybór cywilizacji | L41, 2026-10-20, PASS | p1/P1-5-CIV-SELECTION.md | PASS |
| 7 | P1.6 liczba cyw. / rozmiar mapy | L44, 2026-10-20, PASS | p1/P1-6-CIVCOUNT-MAPSIZE.md | PASS |
| 8 | P1.7 ustawienia / walidacja | L42, 2026-10-20, PASS | p1/P1-7-SETTINGS-VALIDATION.md | PASS |
| 9 | P1.8 generowanie świata | L49, 2026-10-20 (R2), PASS | p1/P1-8-WORLD-GENERATION.md | PASS |
| 10 | P1.9 mapa/HUD/panele | L47, 2026-10-20, PASS | p1/P1-9-MAP-HUD-PANELS.md | PASS |
| 11 | P1.10 viewporty | L29, 2026-10-20, PASS | p1/P1-10-VIEWPORTS.md | PASS |
| 12 | P1.11 assety | L31, 2026-10-20, PASS | p1/P1-11-ASSET-CATALOG.md | PASS |
| 13 | P1.12 dane JSON | L30, 2026-10-20, PASS | p1/P1-12-DATA-CATALOG.md | PASS |
| 14 | P1.13 komendy/eventy | L35, 2026-10-20, PASS | p1/P1-13-COMMANDS-EVENTS.md | PASS |
| 15 | P1.13b domknięcie ProposalActionId | L52, 2026-10-20 (R3), PASS | p1/P1-13-COMMANDS-EVENTS.md (sekcje E, H, I) | PASS |
| 16 | P1.14 katalog mechanizmów | L37, 2026-10-20, PASS | p1/P1-14-GAMEPLAY-CATALOG.md | PASS |
| 17 | P1.14b brakujące systemy | L45, 2026-10-20, PASS | p1/P1-14B-MISSING-SYSTEMS-RECHECK.md | PASS |
| 18 | P1.15 indeks zrzutów | L50, 2026-10-20, **PASS-WITH-NOTES** | p1/P1-15-SCREENSHOT-INDEX.md | **NIE PASS** (warunek binarny niespełniony) |
| 19 | P1.16 edge cases | L32, 2026-10-20, PASS | p1/P1-16-EDGE-CASES.md | PASS |
| 20 | P1.16b audyt krzyżowy | L53, 2026-10-21, LIMIT-5-EXCEEDED / DECISION_REQUIRED; następcy L54, L55, L56, L58 (ostatni L58: „zamyka OSTATNI z 4 następców P1.16b”, PASS) | p1/P1-16-EDGE-CASES.md §8–§14 | PASS wg reguły gałęzi (L58) |
| 21 | P1.16c-KODU-A | L54, 2026-10-21, PASS | P1-16-EDGE-CASES.md §11 | PASS |
| 22 | P1.16c-PARYTET-AI | L55, 2026-10-21, PASS | P1-16-EDGE-CASES.md §12 | PASS |
| 23 | P1.16c-STOLICE | L56, 2026-10-21, PASS | P1-16-EDGE-CASES.md §13 | PASS |
| 24 | P1.16c-CIVPEDIA-KARAWANSERAJ | L58, 2026-10-21, PASS | P1-16-EDGE-CASES.md §14 | PASS |
| 25 | P1.16c-CIVPEDIA-OPISY | brak własnego wpisu statusu. L56: „Slot → P1.16c-CIVPEDIA-OPISY (ostatni z 4)”. L59: „1/5 z 5 równoległych P1.16d-OPISY”. Ledger nie zapisuje wprost słowa „zastępuje”. | — | **BRAK STATUSU** (mapowanie na 26–30 jest wnioskiem z L56 i L59, nie cytatem) |
| 26 | P1.16d-BOILERPLATE | L59, 2026-10-21, PASS | p1/P1-16D-OPISY-BOILERPLATE.md | PASS |
| 27 | P1.16d-EKONOMIA5X | L60, 2026-10-21 (R2), PASS | p1/P1-16D-OPISY-EKONOMIA5X.md | PASS |
| 28 | P1.16d-PORADNIK-B (rozdz. 14–16 + follow-upy) | L61, 2026-10-21, PASS (sam wpis: ~11 pozycji Części A NIEROZSTRZYGNIĘTYCH „wyznaczone do ewentualnej kolejnej rundy”) | p1/P1-16D-OPISY-PORADNIK-B.md | PASS z zastrzeżeniem C1 |
| 29 | P1.16d-PORADNIK-A (rozdz. 00–10) | L64, 2026-10-21 (R3), PASS („4/5 (+1 następca)”, bez statusu następcy w ledgerze) | p1/P1-16D-OPISY-PORADNIK-A.md | PASS z zastrzeżeniem C2 |
| 30 | P1.16d-CIVPEDIA-UI | L62, 2026-10-21 (R2), **DECISION_REQUIRED (częściowo rozstrzygnięte)**; następcy: L65 PASS (17 paneli), L66–L71 PASS (CUDA, ULEPSZENIA, JEDNOSTKI, TECHNOLOGIE, POJECIA, CYWILIZACJE) | p1/P1-16D-OPISY-CIVPEDIA-UI.md | PASS wg reguły gałęzi, z zastrzeżeniem B (brak jawnego wpisu zamykającego ID i brak sumy 143/143) |
| 31 | P1.16e-OPISY-UI-PANELE | L65, 2026-10-21, PASS | (ledger nie podaje pliku; w p1/ brak dedykowanego pliku) | PASS |
| 32 | P1.16f-CUDA | L66, 2026-10-21, PASS (1/6 z 6 równoległych) | p1/P1-16F-CIVPEDIA-CUDA.md | PASS |
| 33 | P1.16f-ULEPSZENIA | L67, 2026-10-21, PASS (2/6) | p1/P1-16F-CIVPEDIA-ULEPSZENIA.md | PASS |
| 34 | P1.16f-JEDNOSTKI | L68, 2026-10-21, PASS (3/6) | p1/P1-16F-CIVPEDIA-JEDNOSTKI.md | PASS |
| 35 | P1.16f-TECHNOLOGIE | L69, 2026-10-21, PASS (4/6) | p1/P1-16F-TECHNOLOGIE.md | PASS |
| 36 | P1.16f-POJECIA | L70, 2026-10-21, PASS (5/6) | p1/P1-16F-CIVPEDIA-POJECIA.md | PASS |
| 37 | P1.16f-CYWILIZACJE | L71, 2026-10-21, PASS (6/6, „ZAMYKA CAŁY P1.16f”) | p1/P1-16F-CIVPEDIA-CYWILIZACJE.md | PASS |
| 38 | P1.17 klasyfikacja rdzeń | L33, 2026-10-20, PASS | p1/P1-17-RUST-CLASSIFICATION.md | PASS |
| 39 | P1.17b klasyfikacja UI | L39, 2026-10-20, PASS | p1/P1-17B-UI-CLASSIFICATION.md | PASS |
| 40 | P1.17c scalenie klasyfikacji | L51, 2026-10-20, PASS | p1/P1-17C-MERGED-CLASSIFICATION.md | PASS |
| 41 | P1.18 macierz hot-seat | L34, 2026-10-20, PASS | p1/P1-18-HOTSEAT-MATRIX.md | PASS |

### Liczniki (tabela, nie deklaracja)

- Własny ostatni status dokładnie `PASS`: **37** (wiersze 1–17, 19, 21–24, 26–29, 31–41).
- `PASS-WITH-NOTES`: **1** (wiersz 18, L50).
- Ostatni własny status nie-PASS, ale PASS wg reguły gałęzi: **2** (wiersz 20 → L58; wiersz 30 → L65–L71).
- Brak własnego statusu: **1** (wiersz 25, mapowanie inferowane z L56/L59).
- Razem: 37 + 1 + 2 + 1 = **41**.

## Wniosek (wynika z tabeli)

- Warunek „wszystkie 41 pozycji mają PASS” **NIE JEST SPEŁNIONY**: wiersz 18 ma PASS-WITH-NOTES (L50), a wiersz 25 nie ma żadnego statusu.
- **Bramka P1 NIE JEST OTWARTA** wg kryterium binarnego. Operator nie otwiera jej sam.
- Otwarcie wymaga jawnej decyzji orkiestratora, z dwoma punktami do odnotowania: (a) przyjęcie L50 (PASS-WITH-NOTES) jako równoważne PASS, z notatką; (b) potwierdzenie mapowania wiersza 25 na P1.16d-* (następcy L59–L64) albo wpisanie go jako osobnej pozycji do domknięcia.
- Wiersze 20 i 30 spełniają regułę gałęzi (L58, L65–L71). Wiersz 30 wymaga dodatkowo zapisania w bramce zastrzeżenia B.

### Zastrzeżenia do notatki bramki (nie zmieniają tabeli)

- **A (wiersz 18, L50):** P1.15 ma PASS-WITH-NOTES, nie czysty PASS.
- **B (wiersz 30, L62):** brak jawnego wpisu zamykającego P1.16d-CIVPEDIA-UI i brak sumarycznego domknięcia 143 haseł. Ledger pokrywa: panele (L65, 17), CUDA (L66, 19 haseł wg dowodu wyszukiwania; L62 podawał 20), ULEPSZENIA (L67, 15 haseł / 18 wierszy), JEDNOSTKI (L68, 51/51), TECHNOLOGIE (L69, 32/32), POJECIA (L70, 151 twierdzeń, nie hasła; 10 haseł z L62 nie ma liczby haseł), CYWILIZACJE (L71, 6/6 to liczba tematów, nie haseł; 12 haseł z L62 bez liczby). Suma 143/143 w ledgerze nie występuje.
- **C1 (wiersz 28, L61):** ~11 pozycji Części A (rozdz. 14–16) NIEROZSTRZYGNIĘTYCH, „wyznaczone do ewentualnej kolejnej rundy”. Brak kolejnego wpisu.
- **C2 (wiersz 29, L64):** „(+1 następca)” bez wpisu i bez statusu w ledgerze.

Ledger nie określa żadnej z pozycji C jako „niebloczącej”. Ta ocena jest operatorska i wymaga decyzji orkiestratora.

Dodatkowe znaleziska zapisane w ledgerze do P2 (nie wpływają na bramkę): rozjazd tartak/kamieniołom 200 vs 50/turę (L60); nazwa `wyrab.praca_per_tura` (L67); koszt jednostek po commicie `4c1126de` (L68); koszt nauki po `ab75bb4f` (L69); brak `forced-war`/`batch`/`auto_manage` na pinie (L45).

## Status

- Brak zmian w `gra/**`, brak commitów, brak push/deploy.
- Testy: nie dotyczy (praca odczytowa).
