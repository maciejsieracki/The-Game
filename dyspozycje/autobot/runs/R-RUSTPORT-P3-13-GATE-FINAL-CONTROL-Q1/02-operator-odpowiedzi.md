# R-RUSTPORT-P3-13-GATE-FINAL-CONTROL-Q1 — runda 2, odpowiedź Operatora na zarzuty Evaluatora

Stan wyjściowy: commit Operatora `ec9faf44` (runda 1). Zmiany rundy 2: `dyspozycje/rust-port/p3/P3-13-GATE-FINAL-CONTROL.md` oraz ten plik i `fmt-r2.txt`, `clippy-r2.txt`, `test-r2.txt`. Brak zmian w `rust-port/**`, `src-tauri/**`, `gra/**`. `Cargo.lock` nieśledzony, nie dodany.

| # | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | Klauzula „dane ładowane ze źródła” niespełniona w runtime | PRZYJMUJĘ (potwierdzone, status FAIL) | `grep -rnE "(data::\|load_all\|load_file\|DATA_FILES)" rust-port/engine/src --include=*.rs` poza `src/data/` → 0 trafień. `grep -rn "civ_engine" src-tauri/src` → 0 trafień. |
| 2 | Tabela rekrutacji: 75/75 nie przemierzone (LEDGER) | PRZYJMUJĘ — zmierzone | Skrypt Python (poza repo) parsował `canonical_recruitment_costs()` (75 rekordów `record(...)`) i porównał z `units.json` (75 wierszy). Nazwy 75/75 zgodne. Koszt złota 9/75, utrzymanie złota 75/75, surowiec+ilość 1/75, utrzymanie surowca+ilość 1/75; w 4 polach jednocześnie 0/75. Wojownik: Rust 10 / drewno 50 / utrzymanie drewno 10; JSON 5 / 13 / 3. |
| 3 | Trzy SHA z doc §5 nie są przodkami `17454b33` | PRZYJMUJĘ — poprawione | `git merge-base --is-ancestor`: `5e694021`, `f3cbbf04`, `5cecefc8`, `4caa8717` → NIE (nie-przodkowie). `275297a2`, `0a04fc7c` (P3.4c), `e67444a9`, `a9441bd9` (P3.11), `7f155227`, `ae9b85ea` (P3.12) → TAK. Doc §5 zaktualizowany o odpowiedniki parity-v2. |
| 4 | P3.9 PASS-WITH-NOTES przy niespełnionej klauzuli; P3.5A–E „PASS” zawyżony | PRZYJMUJĘ — poprawione | P3.9 → FAIL/OPEN; P3.5A–E → „PASS dla pliku/zawartości (29/29); runtime NIE SPEŁNIONE”. |
| 5 | „40 sekcji test result” | PRZYJMUJĘ — poprawione na 36 | `grep -c "test result"` w `test.txt` (operator, r1) = 36; w `test-r2.txt` patrz wynik poniżej. |
| 6 | „59 (łącznie z wykluczonymi)” sprzeczne | PRZYJMUJĘ — poprawione | 59 aktywnych = 42 350 853 B; 42 350 853 + 2 233 830 (3 pliki `_wykluczone/`) = 44 584 683 B = MP3 razem. Wiersz opisuje 59 bez `_wykluczone/`. |
| 7 | OWNER 91 vs 73 — nie wiadomo, która miara | PRZYJMUJĘ — zmierzone jedną miarą | `grep -rnE "owner_id\s*:\s*(Option<)?(u64\|i64)\|player_id\s*:\s*(Option<)?u64" rust-port/engine/src` → 76 linii deklaracji. `OwnerRef`/`CampId` w `rust-port/engine/src` → 0 trafień. Liczby 91 i 73 oznaczone NIE_ZMIERZONO w tej formie, nie podtrzymywane. Typowanie `u64`/`i64` potwierdzone. |
| 8 | 3 pliki `_wykluczone/` klasyfikowane „nie blokuje” bez dowodu decyzji | PRZYJMUJĘ — OPEN | Wiersz §6 pkt 10 i §3.2: **OPEN**, decyzja właściciela; nie blokuje P4. |
| 9 | Pozycje LEDGER oznaczone jak ZMIERZONO / brak NIE_ZMIERZONO | PRZYJMUJĘ — poprawione | N1 (1190) i N2 (120): NIE_ZMIERZONO w r2. 75/75: ZMIERZONO (patrz #2). `tracing`: ZMIERZONO 0 odwołań w `src-tauri/src` i `bridge.rs`. `src-tauri` bez GTK: NIE_ZMIERZONO w r2. „88 plików three”: ZMIERZONO 80 (`git grep -l "from ['\"]three['\"]" edb8fb56 -- gra/src/render`), 88 NIE_ZMIERZONO. `deny_unknown_fields`: ZMIERZONO 6 plików w `src/data/` (LEDGER podawał 3 moduły). |

Wniosek Operatora: klauzula 1 bramki NIE spełniona (FAIL), klauzula 2 PASS (bez zmian). Werdykt bramki: FAIL. Rekomendacja bez zmian co do P4.1–P4.5 (otwarte) i warunków P6.
