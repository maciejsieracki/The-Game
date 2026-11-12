STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-PROGRESS-Q1
GOAL: Postep jednostki (battlesSurvived, parametryBonusProc) w modelu stanu i odczyt do HP zamiany (newMaxHp/oldMaxHp) zamiast stalej PLAYABLE_UNIT_PROGRESS; wektory newMaxHp z pinu 07d2fbd72 dla postepu > 0; test e2e HP.
ZMIANY/COMMIT: baza 513e1a56c (detached, zgodnie z dispatchem). Commit na gałęzi roboczej (SHA w sekcji DEPLOY/PUSH i w wiadomosci commita). Allowlista: rust-port/engine/src/domain/playable.rs; rust-port/engine/tests/p6_unit_replace_l3_state.rs (tylko tekst komunikatu asercji: PLAYABLE_UNIT_PROGRESS -> DLUG-UNIT-REPLACE-PROGRESS); nowe rust-port/engine/tests/p6_unit_replace_progress.rs; nowe rust-port/engine/tests/p6_unit_replace_progress_vectors/{gen-unit-replace-progress-vectors.mjs, unit-replace-progress-vectors.json}; dyspozycje/autobot/runs/R-RUSTPORT-P6-UNIT-REPLACE-PROGRESS-Q1/. Cargo.lock nie commitowany.
TESTY:
- cargo fmt --check: OK
- cargo clippy --all-targets -- -D warnings: OK (po zamianie map_or -> is_none_or w playable.rs)
- cargo test --lib: 64 passed, 0 failed
- cargo test --test p6_unit_replace_defs (7), --test p6_unit_replace_l3 (8), --test p6_unit_replace_l3_state (13, w tym zapis_sprzed_etapu_2 i fixture pre-etap2-state.json bez zmian), --test p6_unit_replace_cost (4), --test playable_slice (7): wszystkie OK
- cargo test --test p6_unit_replace_progress (nowe): 5 passed, 0 failed (newmaxhp_zgodne_z_pinem_dla_postepu, wektory_postepu_maja_straznika_i_probe, e2e_zamiana_zranionej_jednostki_z_awansem_daje_hp_z_pinu, pola_postepu_pomijane_gdy_domyslne_i_laduja_sie_z_zapisu_sprzed_zmiany, ustawienie_stanu_odrzuca_nieskonczone_wartosci_i_nieznana_jednostke)
- Wektory: 3525 przypadkow (postep > 0; siatka parametryBonusProc {0,5,10,20,35,50} x battlesSurvived {0,1,2,3,5,7,10,12} bez pary 0/0), 75 typow z units.json pina. Generator wykonuje TEKST pina (gra/src, git archive 07d2fbd72), meta.textSha256 = bacfd6380b41fbca3004576b69b2f5745cf7eab7767d9871c449e27ba86195d6 (straznik w tescie).
- Pozostale testy crate nie uruchamiane w tej rundzie (poza wymienionymi): NIE_ZMIERZONO.
- Pominiete bramki: brak (df przed startem 12 GB wolne, po kompilacji nie mierzono ponownie).
BLOKADY:
- ODCHYLENIE OD DISPATCHU (uzasadnione): pola postepu NIE zostaly dodane do struktury PlayableUnit, lecz do PlayableReplaceUnit (stan zamiany trzymany w economy.units, klucz = id jednostki; ten sam wzorzec co w etapie 2 L3). Powod: PlayableUnit ma literaly w p6_wire_war_view.rs i p6_wire_war_march_adapter.rs, ktore sa poza allowlista tematu; dodanie pol do PlayableUnit wymagaloby ich edycji (zakaz). Zgodnosc wsteczna: pola z #[serde(default)] i skip_serializing_if (None lub 0 nie sa zapisywane); test sprawdza zapis i odczyt zapisu bez pol.
- Dodana metoda PlayableGame::set_replace_unit_state (scenariusz/test, jak set_human_treasury): ustawia stan zamiany jednostki, odrzuca NaN/Inf i nieznane id. Nie jest to kod bitwy; NIE ustawia postepu w bitwie (osobny temat).
- Brak zrodla postepu w bitwie: pola sa tylko modelem i odczytem. Dopoki bitwa ich nie zapisuje, HP zamiany jednostki z realnym awansem w grze nadal nie jest parytetowe (dlug DLUG-UNIT-REPLACE-PROGRESS otwarty w czesci zapisu z bitwy).
- Stala PLAYABLE_UNIT_PROGRESS usunieta; jej wejscie (postep) czytane z jednostki w replace_unit_with_defs (zarowno dla oldMaxHp jak i newMaxHp, zgodnie z wiringiem replace_unit_wired).
- Uwaga o wektorach: wybrany scenariusz e2e (Wojownik z mieczem i tarcza -> Wojownik, oldHp 7, postep 20%/3 bitwy) daje wynik z postepem 5 i bez postepu 6; test asercyjnie to sprawdza.
RUNDY: 1/5 (Operator, Haiku 5.5)
NASTEPNY KROK: Evaluator (Sonnet) na commicie operatora; potem Final Control. Integracja i push dopiero po READY_FOR_DEPLOY (poza tym tematem).
DEPLOY/PUSH: NIE WYKONANO (zgodnie z dispatchem: bez push i bez integracji)
