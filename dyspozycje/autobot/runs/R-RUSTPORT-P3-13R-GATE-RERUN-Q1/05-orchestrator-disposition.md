STATUS: ORCHESTRATOR-DISPOSITION
TEMAT: R-RUSTPORT-P3-13R-GATE-RERUN-Q1
DATA: 2026-10-22

Werdykt pomiarowy (Final Control, 2 rundy): bramka P3 = FAIL (klauzula 1 „dane ładowane ze źródła w runtime” OPEN: domena czyta bezpośrednio 2/29 plików, reszta przez `data::derived`/testy; literały L1–L31 w `domain/**`; klauzula 2: manifest assetów 428/428 PASS, kopie `rust-port/engine/data/*.json` 29/29 = pin; 3 pliki `gra/data/*` na gałęzi parity-v2 różnią się od pinu).

Rozstrzygnięcia orkiestratora (administracyjne — NIE decyzje produktowe):
1. Rozjazd `gra/data/{civs,units,civ-matrix}.json` na gałęzi `parity-v2` vs pin `edb8fb56`: `parity-v2` odgałęziła się od starszego `main` (pin NIE jest jej przodkiem; `git rev-list --count 2a45e340..edb8fb56 -- gra/data` = 6). Silnik czyta WYŁĄCZNIE kopie `rust-port/engine/data/*.json` (29/29 bajtowo = pin, `data_compliance`). Zawartość `gra/data/` na tej gałęzi jest nieużywana przez Rust; zakaz zmian w `gra/**` obowiązuje → NIE synchronizować. Źródłem prawdy pozostaje pin (zgodnie z regułą źródeł). Zapis do wiedzy; brak kroku naprawczego.
2. Klauzula 1 — przeskopowanie: pełne „podpięcie 27 plików” danych w runtime to praca mechanik gameplay (P6), nie fundamentu. Warunek wejścia do P6 ustalony tak: każdy moduł P6 czyta swoje dane przez `parse_*`/`derived` (bez literałów; wzorzec P3.17–P3.23), a literały L1–L31 z P3-13R §3 są sklasyfikowane w P3.23 (etap 3) i kolejnych etapach mnożników. P3 uznaję za ZAMKNIĘTĄ Z UWAGAMI na potrzeby startu planowania P6 (nie jako „PASS bramki”): faza P6 startuje od analizy luk (P6.0), a bramka P3.13R-2 odbędzie się po P3.23 i P6.0.
3. P3.10 (fixtures z nagrań weba) — nadal zablokowane brakiem nagrań; pozostaje na liście właściciela (wymaga jego nagrań albo jawnej decyzji o odłożeniu).
4. Do ABC (genuine, właściciel): 3 MP3 w `_wykluczone/`; P3.10 nagrania/odłożenie; martwy `combat.rs`.
