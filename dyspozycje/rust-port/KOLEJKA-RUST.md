# KOLEJKA RUST — gotowe tematy do uzupełniania slotów (maks. 4 operatorów naraz)

Zasada (właściciel, 2026-11-11): zawsze działają cztery tematy operatorskie. Slot zwolniony = w tej samej turze start następnego z tej listy (dispatch gotowy lub pisany od razu). Nie czekać na integrację: temat zależny od niezintegrowanego batcha startuje na czubku batcha (gałąź `rust-port-wip/BATCH*-tip`); FF na parity-v2 daje dokładnie ten commit.

## W toku (operatorzy, 23:18 UTC)
1. DLUG-TESTHELPERS (`R-RUSTPORT-DLUG-TESTHELPERS-Q1`)
2. POWER-PRODUCERS (`R-RUSTPORT-P6-POWER-PRODUCERS-Q1`)
3. SIEGE-TRANSFER-Q3 r2 (`R-RUSTPORT-P6-SIEGE-TRANSFER-Q3-Q1`)
4. BRAKE-VECTORS r2 (`R-RUSTPORT-P6-BRAKE-VECTORS-Q1`)

## Następne (gotowe do startu, w kolejności)
6. W8 r3 (`R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1`): po integracji BRAKE-INPUTS i SIEGE-TRANSFER; DODATEK r3 z bazą = nowy czubek parity-v2; WarTurnContext, wariant B, wiring `common_border_delta`.
7. UNIT-REPLACE L-3 (zadanie 9): po W8 r3.
8. Siege #217 (zadanie 11): po W8 r3.
9. Test infantry: `available_replacements_for` — dokładny zbiór (z raportu L-1), po L-1.

## Czekają na decyzję właściciela (gameplay) — NIE startować
- Faza zwarcia DYSTANS / resolve_combat (zadanie 10).
- REPIN-DRYFT 1–6 (zadania 14–19).
- 50 rozbieżności pól units.json Rust vs pin (zadanie 27).

## Następne (08:0x UTC; zadania 83–93 na liście; kolejność zalecana)
1. K5I2b — składanie BlowInput + rangedDamageMultFor (po K5I2a3/a4).
2. INTEG-B14C — K5I2a1–a4 + CRED (+ R7K7, jeśli nie w B14B) na parity-v2.
3. DLUG-POWER-ULEPSZENIA-WIRING; POWER-BITWY-ZDOBYCZE; DLUG-UNIT-REPLACE-PROGRESS (stan: pola serde default + zgodność zapisu).
4. R7K7-B (P7, zlozeGrants, wektory D3/sync) i R7K7-C (efekty na PlayableState, skarbiec AI, pula Pracy).
5. K5-LOOP (test składania pętli taktycznej), KLASY-WIRE, DLUG-NFD-CCC.
6. Raport poranny (pytania gameplay: SZTURM ODPARTY, Q1–Q4 W8 r7, units.json vs pin, DYSTANS, REPIN-DRYFT 1–6).
Zasada: każdy start od dispatchu z jedyną obowiązującą BAZĄ; temat zależny startuje na czubku fc, integracja rundą Operatora z pełnym cargo test.
