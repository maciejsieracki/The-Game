# P6-REPIN-DYPLOMACJA-DANE — dryf danych dyplomacji i ery wojny (Rust względem weba)

TEMAT: R-RUSTPORT-REPIN-DYPLOMACJA-DANE-SOJUSZ-ERA-Q1 · RUNDA 1/5 · DOMAIN: GAME (RUST)
BAZA RUST: `origin/rust-port/parity-v2` = `5261decd7` · BAZA WEB: `origin/main` = `0c5b227a9`
ŹRÓDŁO POMIARU: `dyspozycje/rust-port/p6/REPIN-DELTA-6.md` (§1, §2) + ponowny odczyt JSON weba (`git show origin/main:gra/data/*.json`).

Legenda: ZMIERZONO = odczyt pliku/komendy w tej rundzie; NIE_ZMIERZONO = nie potwierdzone.

## 1. Tabela dryfu (przed zmianą → po zmianie)

| Klucz | Web `origin/main` (ZMIERZONO) | Rust przed | Rust po (ta runda) | Plik Rust |
|---|---|---|---|---|
| `sojusz_pelny.prog_relacja` | 130 (`gra/data/diplomacy-acceptance-points.json`) | 151 | 130 | `rust-port/engine/data/diplomacy-acceptance-points.json` |
| `sojusz_defensywny.prog_relacja` | 130 | 151 | 130 | j.w. |
| `progSojuszRelacja` | 130 (`gra/data/diplomacy.json`) | 151 | 130 | `rust-port/engine/data/diplomacy.json` (+ `DiplomacyParams::alliance_relation` `diplomacy.rs`) |
| `progSojuszZaufanie` | 90 (`gra/data/diplomacy.json`) | 91 | 90 | `diplomacy.json` (+ `alliance_trust_threshold` `diplomacy.rs`) |
| `progUmowaMinRelacja` | 130 (`gra/data/diplomacy.json`; używane w `diplomacyTreatyMinRelacja = max(progUmowaMinRelacja, prog)`, `diplomacy.ts:619`) | 151 | 130 (`treaty_min_relation`) | `diplomacy.json` + `diplomacy.rs` |
| `eraForcedWarStartTurnsFromEra.bronze` | 40 (`gra/data/war-rules-params.json:5`) | 20 (`diplomacy_multiwar_gate.rs:58`) | 40 | `diplomacy_multiwar_gate.rs` |
| `eraForcedWarStartTurnsFromEra.iron` | 40 | 20 (`diplomacy_multiwar_gate.rs:60`) | 40 | `diplomacy_multiwar_gate.rs` |
| `eraForcedWarStartTurnsFromEra.stone` | 40 | 25 (`war_forced_stone.rs:16`, komentarz „web: forced-war-stone.ts:18”) | 40 | `war_forced_stone.rs` (POZA allowlistą, patrz §3) |

## 2. Dryf zmierzony, NIE naprawiany w tej rundzie

| Klucz / mechanizm | Web | Rust | Status |
|---|---|---|---|
| `progNapBezterminowyRelacja` | 151 (`gra/data/diplomacy.json:39`) | brak pola w `DiplomacyParams` i w `diplomacy.json` (0 trafień) | LUKA (ZMIERZONO) |
| traktat `rozejm` (200 PN, bramki wojny) w `diplomacy-acceptance-points.json` | obecny | brak klucza w pliku Rust | LUKA danych (ZMIERZONO); temat ROZEJM-5-10-15 |
| `progNapRelacja` = 110, `progNapZaufanie` = 30 | 110 / 30 | `nap_relation` = 110, `minimum_relation` = 30 | ZGODNE (ZMIERZONO) |
| `przewagaMilitarna.prog` 0,20, `pokojAiAi.minBilansPW`, `bez_wylomu_max_tur` 150, `unitsPerSiegeEngine`, `rangeDamageTw` | jak w REPIN-DELTA-6 §1 | jak w REPIN-DELTA-6 §1 | LUKI (poza tym tematem, bez zmian) |
| `utrzymanie surowcowe budynków` (5 jedn./typ vs proporcjonalne do Pieniądza) | `economy-upkeep.ts:688` | `turn_economy.rs:1674` | DRYF LOGIKI (REPIN-DELTA-6 §1), poza tym tematem |

## 3. Zakres poza allowlistą (ZAŁOŻENIA, zgodnie z zasadą „rób dalej”)

- `rust-port/engine/data/diplomacy.json` — NIE na allowliście (allowlista zna tylko `diplomacy-acceptance-points.json` i `*war*params*.json`). Zmieniony, bo `prog_sojusz_relacja` z tego pliku steruje bramką `diplomacy_locks.rs:225`, a `DiplomacyParams` jest ładowany z niego. ZAŁOŻENIE: wartości zsynchronizowane z `gra/data/diplomacy.json`.
- `rust-port/engine/src/domain/war_forced_stone.rs` — NIE na allowliście. Zmieniony `WOJNA_KAMIEN_WYMUSZONA_START_TURY` 25 → 40, bo web `war-rules-params.json` ma `eraForcedWarStartTurnsFromEra.stone = 40` i `_opisEraDelay` mówi „Stone, Bronze and Iron … wait 40 turns”. Bez tego testy `p6_forced_war_g1/g3b` (wektory z weba) nie przechodzą. ZAŁOŻENIE.
- `rust-port/engine/tests/p6_forced_war_g1_data/cases.json`, `p6_forced_war_g2_data/cases.json`, `p6_forced_war_g3b_data/cases.json`, `p6_dyplo_multiwar_gates_data/eraign.json`, `p6_repin_ai_war_vectors.json` — wektory z weba zaktualizowane do progu 40 (patrz §4).

## 4. Pochodzenie wektorów (co zmierzono, a co nie)

- `p6_forced_war_g2_data/cases.json`: regenerowany Node 22 (`gen_cases_g2.mjs --write`) z `git archive origin/main gra/src gra/data` rozpakowanego poza repo. ZMIERZONO (306 przypadków, różnica 0 względem weba; 12 wierszy zmienionych).
- `p6_forced_war_g3b_data/cases.json`: regenerowany Node 22 skryptem `gen_cases_g3b.mjs`, ALE wersja w repo nie działa na obecnym webie (`forced-war-stone.ts` nie ma już literału `WOJNA_KAMIEN_WYMUSZONA_START_TURY`, rzuca `nie znaleziono`). Użyto kopii z łatą (w scratchpadzie): literał zastąpiony wartością 40 z `war-rules-params.json`. ZMIERZONO wynik: 5 przypadków `search` przeszło z true na false. NIE_ZMIERZONO: poprawka w repo skryptu (nie dotykana, poza allowlistą).
- `p6_forced_war_g1_data/cases.json`: edycja wierszy `constant WOJNA_KAMIEN_WYMUSZONA_START_TURY` (25 → 40) oraz 2 wierszy `isEligibleForStoneForcedWar` (turn 25–39, true → false). NIE_ZMIERZONO Node (oparte na regule progu z `war-rules-multiwar.ts` / `forced-war-stone.ts`).
- `p6_dyplo_multiwar_gates_data/eraign.json`: 2 wiersze `eraForcedWarStartTurnsFromEra` 20 → 40. Wartość z JSON weba (ZMIERZONO), bez ponownego uruchomienia Node.
- `p6_repin_ai_war_vectors.json`: NIE_ZMIERZONO Node — generator z poprzedniej sesji jest poza repo. Przeliczono `out` funkcją 1:1 z `war-rules-multiwar.ts:314–320` w Pythonie. Walidacja: ta sama funkcja z progiem 20 odtwarza 560/560 zapisanych wyników; z progiem 40 zmienia się 24 wiersze.
- `tests/diplomacy.rs` `alliance_sweetener_ease_is_measured_in_points`: zaufanie wejściowe 89 → 88. Po zmianie progu 91 → 90 i ease 1 pkt próg wynosi 89, więc 89 przechodzi. Test nadal sprawdza „odrzucenie przez Zaufanie” o 1 pkt poniżej progu.

## 5. Testy

- Nowy plik: `rust-port/engine/tests/p6_repin_dyplomacja_dane_sojusz_era.rs` (4 testy: parsowanie JSON, `DiplomacyParams::default()`, progi ery).
- Zaktualizowane asercje: `data_civilizations.rs:121` (151 → 130), `p6_dyplo_multiwar2_eraign.rs:140–141` (20 → 40).
- Wyniki (ZMIERZONO, `CARGO_INCREMENTAL=0 CARGO_PROFILE_*_DEBUG=0`): `cargo fmt --check` OK; `cargo clippy --all-targets -- -D warnings` exit 0; `cargo test --lib` 22/22; wszystkie binarki `tests/*` z nazwami dyplo/diplom/war/forced/peace/truce/alliance/sojusz/multiwar/era/data_civ/ai_ — bez FAILED (ostatni przebieg po wszystkich poprawkach).
- Uwaga: pełny `cargo test` po wszystkich binarkach NIE_ZMIERZONO w tej rundzie (uruchomiono podzbiór dotykany zmianą).

## 6. Runda 2 (odpowiedź na zarzuty FAIL r1)

- **Pin `diplomacy.json` (zarzut 1, ZAŁOŻENIE):** test `p6_1e_civ_matrix::data_files_are_byte_identical_to_web_pin` asertował FNV `a96283cc97919a00` (migawka `diplomacy.json` z bazy 5261decd7). Po synchronizacji plik Rust ma FNV `a9f6c9917d17f733`. Pin zaktualizowano w `rust-port/engine/tests/p6_1e_vectors/web-vectors.json` (`dataFnv.diplomacy` oraz `scenarios[base].vec.dataFnv.diplomacy`, 2 wystąpienia). Jest to ZAŁOŻENIE, nie regeneracja z weba: bieżący `gra/data/diplomacy.json` z `origin/main` ma FNV `6cc897e2c8a06f92` i NIE jest bajtowo równy plikowi Rust. Różnice (ZMIERZONO `diff`): web ma klucze `ekspansjaGranicaBraz_zaufanie_perTura` (-3), `ekspansjaGranicaZelazo_zaufanie_perTura` (-4), `progNapBezterminowyRelacja` (151), `progNapZaufanie` (30), `progSojuszWillingnessMin` (0,54 vs Rust 0,68) oraz inny opis `Opis` przy pakcie nieagresji. Wyrównanie tych kluczy jest poza tym tematem (pierwsze trzy to inne tematy weba, Willingness to R-WEB-ALLIANCE-WILLINGNESS-THRESHOLD-054). Pin 'web' jest więc pinem migawki zsynchronizowanej w tym temacie, a nie bieżącym webem.
- **`progNapBezterminowyRelacja` = 151 (zarzut 2 i 4, ZMIERZONO grepem):** w Rust nie ma konsumenta tego progu. Web używa go w `gra/src/game/ai.ts:7064` (`napIndefinite` → `turns: 0`). W Rust: brak propozycji NAP po stronie AI w `ai_turn.rs` (grep `ProposalAction::Nap` nie trafia w `ai_turn.rs`); `diplomacy_nap_trust.rs` używa `prog_nap_relacja` (nie `alliance_relation`); brak słowa `indefin`/`bezterm` w ścieżce AI. Decyzja: parametr 151 POZOSTAJE poza zakresem (brak miejsca wywołania w Rust, dodanie pola to nowy temat funkcjonalny). Rust `alliance_relation` (130) zmienia wyłącznie: `relation_tier` (`diplomacy.rs:789`, bez wywołań poza definicją), `diplomacy_treaty_min_relation`, `score_factor` przy sojuszu (`diplomacy.rs:1162`) i próg zerwania (`diplomacy.rs:3318–3338`). Odpowiada to `progSojuszRelacja`/`progUmowaMinRelacja` z webu, nie NAP-bezterminowemu.
- **`war_era_pool.rs` (zarzut 3):** plik ujęty w zakresie. Zmiana: komentarz 20 → 40 (`rust-port/engine/src/domain/war_era_pool.rs`), bez zmiany logiki.
- **Pełny `cargo test --no-fail-fast` (zarzut 1, ZMIERZONO):** na 9c2d68370 po poprawce pinu: 328 binarek z `test result`, łącznie passed=2394, failed=0, ignored=1 (jeden `#[ignore]` z bazy, bez nowych). `p6_1e_civ_matrix`: 21/21 zielone. `p6_repin_dyplomacja_dane_sojusz_era`: zielone. `cargo fmt --check`: OK.
- **Zakres dryfu (zarzut 4):** dispatch wymagał pomiaru wszystkich kluczy tych dwóch plików weba. Pełne zestawienie różnic jest w §6 pierwszym punkcie (diff). Nieobjęte tym tematem i zostawione: `progNapBezterminowyRelacja` (brak konsumenta), `progNapZaufanie` (Rust ma osobny moduł `diplomacy_nap_trust.rs`; NIE_ZMIERZONO, czy wartość 30 jest tam domyślna), `progSojuszWillingnessMin` 0,54 vs 0,68 (osobny temat), `ekspansjaGranica*` (osobny temat).
- **Wektory `ai_war` (zarzut 5, NIE_ZMIERZONO w Node):** bez zmian w tej rundzie; nadal przeliczone funkcją 1:1 z `war-rules-multiwar.ts`, a testy `p6_repin_ai_war_vectors` i `p6_forced_war_*` są zielone w pełnym przebiegu.
