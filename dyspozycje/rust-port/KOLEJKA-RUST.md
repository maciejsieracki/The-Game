# KOLEJKA RUST — gotowe tematy do uzupełniania slotów (maks. 4 operatorów naraz)

Zasada (właściciel, 2026-11-11): zawsze działają cztery tematy operatorskie. Slot zwolniony = w tej samej turze start następnego z tej listy (dispatch gotowy lub pisany od razu). Nie czekać na integrację: temat zależny od niezintegrowanego batcha startuje na czubku batcha (gałąź `rust-port-wip/BATCH*-tip`); FF na parity-v2 daje dokładnie ten commit.

## W toku (operatorzy)
1. P6-UNIT-REPLACE-L1 r2 (`R-RUSTPORT-P6-UNIT-REPLACE-L1-Q1`)
2. P6-AIPEACE-V2-MIGRACJA (`R-RUSTPORT-P6-AIPEACE-V2-MIGRACJA-Q1`)
3. P6-BRAKE-INPUTS (`R-RUSTPORT-P6-BRAKE-INPUTS-Q1`, W8 podział 2/3)
4. P6-SIEGE-TRANSFER (`R-RUSTPORT-P6-SIEGE-TRANSFER-Q1`, Q2)

## Następne (gotowe do startu, w kolejności)
5. ZAPIS-SAVELOAD-KOMENTARZ (zadanie 6): przestarzały komentarz „Rust nie ma dziś loadera plików” w `save_load.rs` ~750-753; dispatch do napisania (allowlista: tylko ten komentarz).
6. W8 r3 (`R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1`): po integracji BRAKE-INPUTS i SIEGE-TRANSFER; DODATEK r3 z bazą = nowy czubek parity-v2; WarTurnContext, wariant B, wiring `common_border_delta`.
7. UNIT-REPLACE L-3 (zadanie 9): po W8 r3.
8. Siege #217 (zadanie 11): po W8 r3.
9. Test infantry: `available_replacements_for` — dokładny zbiór (z raportu L-1), po L-1.

## Czekają na decyzję właściciela (gameplay) — NIE startować
- Faza zwarcia DYSTANS / resolve_combat (zadanie 10).
- REPIN-DRYFT 1–6 (zadania 14–19).
- 50 rozbieżności pól units.json Rust vs pin (zadanie 27).
