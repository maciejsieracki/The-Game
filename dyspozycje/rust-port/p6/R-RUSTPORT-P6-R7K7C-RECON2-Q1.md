# R-RUSTPORT-P6-R7K7C-RECON2-Q1 - ponowna weryfikacja #106 (R7K7C-WIRING)

Pelny raport z tabela 5 punktow, tematami wdrozeniowymi i lista tego, czego nie wdrazac:
`dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-RECON2-Q1/01-operator-r1.md`.

Skrot wynikow:
- 1a NIE: `apply_dipl_deltas_to_state` ma wolajacych tylko w testach.
- 1b TAK, ale wynik D3 jest odrzucany w `playable.rs:1192`.
- 1c TAK: kolejnosc D3 zgodna z pinem na poziomie wywolan.
- 2 TAK: pin zapisuje zapasy miast (`main.ts:24008-24012`), Rust nie zapisuje `city_stock`. Reprodukcja NIE_ZMIERZONO.
- 3 NIE: brak pola stanu i konsumenta grace; brak portu kar za przemarsz.
- 4 NIE (nieosiagalne w produkcji dzis): rekomendacja - zostawic blad.
- 5 TAK: D6 obejmuje tylko zloto (pin `diplomacy-economy.ts:78-124`, Rust `turn_war_dipl_steps.rs:206`).

Tematy wdrozeniowe: R7K7C-WIRING-A (punkty 1 i 2). Punkt 3 - zaleznosc od portu kar za przemarsz. Punkty 4 i 5 - bez zmian.
