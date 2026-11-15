# R-RUSTPORT-P6-R7K7C-RECON2-Q1 - ponowna weryfikacja #106 (R7K7C-WIRING)

Pelny raport z tabela 5 punktow, tematami wdrozeniowymi i lista tego, czego nie wdrazac:
`dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-RECON2-Q1/01-operator-r1.md`.

Skrot wynikow (po obronie operatora: `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-RECON2-Q1/02a-obrona.md`):
- 1a NIE: `apply_dipl_deltas_to_state` ma wolajacych tylko w testach.
- 1b TAK, ale wynik D3 jest odrzucany w `playable.rs:1194`. D3 zapisuje stan wojny (relacje, umowy, `*war = work` w `turn_war_dipl_steps.rs:1022`); gubione sa `treasury_deltas` (`:1020`), `praca_deltas` (`:1021`), `city_resources` (`:1019`).
- 1c TAK: kolejnosc D3 zgodna z pinem na poziomie wywolan.
- 2 TAK: pin zapisuje zapasy miast (`main.ts:24005-24009`), Rust tylko raportuje `city_resources` i nie zapisuje `city_stock`. Reprodukcja NIE_ZMIERZONO.
- 3 NIE: brak pola stanu i konsumenta grace; brak portu kar za przemarsz.
- 4 Brak producenta wpisu w `src/` (wolajacych tylko w testach). Osiagalnosc przez deserializacje stanu NIE_ZMIERZONO. DECISION_REQUIRED (ABC w 02a-obrona.md, rekomendacja: zostawic blad).
- 5 TAK: D6 obejmuje tylko zloto (pin `diplomacy-economy.ts:78-124`, Rust `turn_war_dipl_steps.rs:206`).

Tematy wdrozeniowe: R7K7C-WIRING-A (punkty 1 i 2). Wymagania (z obrony):
- zapis `treasury`, `praca_pool_by_owner` i `city_stock` z mapowaniem id miasta na klucz;
- rollback w `advance_turn` (`playable.rs:1112-1133`) obejmuje tez `economy` (sciezka `TurnPhaseQueueIncomplete`, `:1157-1163`);
- oczekiwane wartosci testow z pina (generator), bez wartosci recznych; warunek >=150 wektorow z #106.
Punkt 3 - zaleznosc od portu kar za przemarsz. Punkty 4 i 5 - bez zmian kodu.
