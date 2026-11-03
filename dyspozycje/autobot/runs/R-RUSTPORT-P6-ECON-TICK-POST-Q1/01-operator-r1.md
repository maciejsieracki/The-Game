STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ECON-TICK-POST-Q1
GOAL: port 1:1 etapów kroku ekonomii tury PO bankowaniu (web `4bbef081d`) do Rust; dług `-Q7` pkt 5; rozstrzygnięcie `settle_turn`.

ZMIANY/COMMIT: gałąź `worktree-wf_6dcea91b-ec4-1` od `c8782b58d`; commity kodu `2408c454f`, `3841347a9`, `70e24e061`, `ad186d795`; gate-logi `4f86441df`. Pozycje:
* NOWE `domain/turn_economy_post.rs` (+`pub mod`): `run_gold_deficit_step` (`:35250-35354`), `run_post_central_growth` (`:36009-36092`), `apply_praca_upkeep_post` (`:36097`), `growth_inputs_from_order_lane`.
* `city_growth.rs` addytywnie: `apply_post_central_population_growth_ext` + `PostCentralGrowthExt` (`orderGrowthMultByCity`, `manpowerMaxMultByOwnerId`, fallback macierzowy). Wykryty dryf P6.7A (pin `edb8fb56`); stara funkcja deleguje z `Default`.
* `Default` na `CityLoopTick`/`EconomyTickResult`; `order_effects_lane.rs` (POZA allowlistą, ZAŁOŻENIE Z-POST-4): +2 pola odczytowe raportu miasta, NIE_ZMIERZONO vs web.
* Doc `dyspozycje/rust-port/p6/P6-ECON-TICK-POST.md` (inwentarz 28 kroków plik:linia, `settle_turn`, dług, założenia Z-POST-1..7). Testy: `p6_econ_post_e2e.rs` (347 scenariuszy, porównanie bitowe, fixture 4,5 MB), `p6_econ_post_unit.rs`. Generator z czystego `git archive 4bbef081d`, esbuild w `/dev/shm`, zero zmian w `gra/`.

WYNIKI MERYTORYCZNE:
* Korekta dispatchu: power snapshots wykonują się PRZED bankowaniem (`main.ts:34577-34578`); research jest w bloku bankowania (`:35151`, `:35166`).
* `settle_turn`/`resolve_turn`: brak odpowiednika (`git grep` na pinie = 0); konflikt: Rust obcina skarbiec do 0 i zeruje Pracę co turę, web dopuszcza skarbiec < 0 (`:35046-35056`) i akumuluje Pracę (`:36172-36176`). Propozycja: nie podpinać; usunięcie/legacy tylko osobnym tematem za zgodą właściciela.
* Dług z dowodem: `-POWER`, `-AIRESEARCH`, `-ERASYNC`, `-AIDIFF`, `-AUTOMANAGE`, `-PRODUCTION-LANE`, `-LIVERATION`, `-WONDERMAP`, `-Q8` (`resolveSiegeSurrender` `:15874`), wektory web dla nowych pól lane, auto-ulepszenia, podpięcie do pętli tury.

TESTY:
* e2e POST: zielony; niezależny `verify-p6-econ-post.py` (`-I`): 25 097 sprawdzeń, 0 rozbieżności, kontrola `--neg` wykrywa.
* Mutacje: 57, zabite 50, 7 równoważnych z dowodem (doc sek. 6); brutto 87,7% (<90%), bez równoważnych 100%.
* `cargo fmt --check` EXIT=0; `clippy --all-targets -D warnings` EXIT=0; `git diff --check` EXIT=0.
* Pełny `cargo test -j 2` (lib + 8 shardów, PO ostatniej zmianie kodu): 2091 passed / 0 failed = baza 2087/0 + 4 nowe. PRZED nie mierzono ponownie (przyjęta baza z dispatchu).

BLOKADY: brak. Zastrzeżenia: Z-POST-1 (wektory od stanu granicznego, łańcuch tick->EmpireFood->bank w `p6_empirefood_e2e`), Z-POST-2 (pętla per miasto `:35358-36008` poza zakresem), brutto mutacji <90% (równoważniki udowodnione).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator R1 (sprawdzić dowody równoważności P02/P05/P11/P14/P20/P21/G04, Z-POST-4 poza allowlistą, brak wektorów dla `szczescie`/`citizen_growth_pct_delta`).
DEPLOY/PUSH: NIE WYKONANO
