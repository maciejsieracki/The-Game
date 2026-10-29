# P6-REPIN-WOJNA-NOWE-A - port nowych modulow wojny/armii z weba (pin 91dc998a)

**Temat:** `R-RUSTPORT-REPIN-WOJNA-NOWE-A-Q1` · **Runda:** 1/5 · **Rola:** Operator-impl
**Pin webu:** `91dc998a5f1b51ad29e0f4785edfd45655445c53` · **Pin dotychczasowy:** `edb8fb56` (bez zmiany pinu w manifestach).
**Baza portu:** `rust-port/parity-v2` (`fb55afe2` i nowsze; silnik 1265/0 przed zmianą).

## 1. Zakres (weryfikacja)

- `git diff --name-status edb8fb56 91dc998a -- <3 pliki>` → **A, A, A**: wszystkie trzy moduly sa nowe w webie (brak odpowiednika w `edb8fb56`), zatem cala zmiana behawioralna to tresc tych plikow.
- Cytowania web: `gra/src/battle/formationRules.ts` (127 linii), `gra/src/game/army-leadership.ts` (63), `gra/src/game/ai-era-unit-promotion.ts` (63). Zmiany niebehawioralne (komentarze, typy TS) nie maja osobnego portu; typy przeniesiono do sygnatur Rust.
- Zrodla web uruchamiane BEZ zmian przez `node --experimental-strip-types` z drzewa `git archive 91dc998a gra/src gra/data` (poza repo). SHA256 zrodel w naglowku kazdego pliku wektorow (`sourceSha256`).

## 2. Tabela zmiana -> web -> Rust -> test -> status

| # | Funkcja / zmiana (web) | plik:linia web | plik:linia Rust | test / wektor | status |
|---|---|---|---|---|---|
| 1 | `classifyInitialBattleRole` (kolejnosc galezi, normalizacja) | formationRules.ts:3-30 | formation_rules.rs:140 (`classify_initial_battle_role`), :95 (`strip_base`), :123 (`normalize`) | `p6_repin_wojna_a_formation.rs::classify_matches_web_on_all_vectors` (2031 przypadkow) + `diacritics_are_folded_like_web` | PORTOWANE |
| 2 | `initialBattleFormation` (podzial pasm) | formationRules.ts:92-113 | formation_rules.rs:202 | `formation_groups_and_slots_match_web` (406 ukladow, pola `groups`) | PORTOWANE |
| 3 | `initialBattleSlots` (wiersze, rangi, jazda na skrzydlach) | formationRules.ts:46-85 | formation_rules.rs:232 (`initial_battle_slots`), :274 (`lay_band`) | `formation_groups_and_slots_match_web` (sloty bit-w-bit) | PORTOWANE |
| 4 | `compactLineAllowsAdvance` | formationRules.ts:115-127 | formation_rules.rs:306 | `compact_line_matches_web_on_grid` (1872 przypadki) | PORTOWANE |
| 5 | `hasMilitaryAcademy`, `armyLeaderTitle` | army-leadership.ts:13-20 | army_leadership.rs:78, :84 (stale: `war-leadership-params.json`) | `academy_title_and_bonus_match_web` (207) | PORTOWANE |
| 6 | `armyLeaderMoraleBonusFrac` (0.10 / 0.20, 0 bez dowodcy) | army-leadership.ts:23-29 | army_leadership.rs:95 | `academy_title_and_bonus_match_web` | PORTOWANE |
| 7 | `moraleWithArmyLeaderBonus` (ochrony, ceil) | army-leadership.ts:32-36 | army_leadership.rs:110 | `morale_with_bonus_matches_web` (460; w tym NaN/Infinity) | PORTOWANE |
| 8 | `armyMoraleRatioWithoutCommander` | army-leadership.ts:39-54 | army_leadership.rs:123 | `morale_ratio_matches_web` (1204) + `empty_army_ratio_edge_cases` | PORTOWANE |
| 9 | `commandersToWithdrawAfterArmyBreak` (zwraca indeksy) | army-leadership.ts:57-63 | army_leadership.rs:146 | `withdraw_commanders_matches_web` (1204) | PORTOWANE (ZALOZENIE: indeksy zamiast obiektow) |
| 10 | `promoteAiUnitForEra` (idempotencja, typ, epoka, koszt, HP, skarbiec) | ai-era-unit-promotion.ts:38-63 | ai_era_unit_promotion.rs:62 (`promote_ai_unit_for_era`), trait :34 | `promotion_matches_web_on_all_vectors` (613) + `empty_typ_blocks_promotion` | PORTOWANE (ZALOZENIE: deps jako trait, epoka liczbowa) |
| 11 | `Math.round` w przeliczeniu HP | ai-era-unit-promotion.ts:57 | ai_era_unit_promotion.rs:51 (`js_round`) | wektory awansu (ulamki HP) | PORTOWANE |

Dane stale przeniesione do `rust-port/engine/data/derived/` (bez literalow w kodzie):
- `war-leadership-params.json` (id akademii, tytuly, premie 0.1/0.2 jako tekst),
- `formation-role-keywords.json` (podciagi regex z weba, mapa liter, kategorie).

## 3. Wektory

Katalog: `rust-port/engine/tests/p6_repin_wojna_a_vectors/` (wygenerowane generatorem
`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-NOWE-A-Q1/gen-repin-wojna-a-web-vectors.mjs`):

| plik | rozmiar | przypadki |
|---|---|---|
| `formation-rules.json` | 1.59 MB | 2031 klasyfikacji, 406 ukladow, 1872 linii |
| `army-leadership.json` | 1.39 MB | 207 dowodcow, 460 morale, 1204 stosunkow, 1204 wycofan |
| `ai-era-unit-promotion.json` | 0.27 MB | 613 awansow (katalog 10 jednostek) |

Liczby zapisane jako tekst (`String(x)`, `-0`, `NaN`, `Infinity`), zgodnie z konwencja P6.1 r2.

## 4. Zalozenia (luki rozstrzygniete zalozeniem)

- Normalizacja diakrytykow (korekta r3, zarzut 1): zakres = wszystkie rozkladalne litery Latin-1 + polskie litery (ą ć ę ł ń ś ź ż) + č š ž. Litery Latin Extended-A spoza tego zbioru (ě ř ů ť ď ň ľ ő ű ā ē ī ō ū ğ ş) NIE sa w tabeli `strip_base` (web robi NFD, Rust nie - wynik rozni sie). Dane jednostek `gra/data/units.json` nie zawieraja tych liter (sprawdzone: 0 wystapien), wiec wektory ich nie testuja. Pelna przestrzen Unicode i te litery: **NIE_ZMIERZONO**.
- Wspolrzedne siatki i progi calkowite (wektory weba tak je generuja); NaN w wejsciach ukladu: **NIE_ZMIERZONO**.
- `null` i `undefined` w polach `hp`/`ruchLeft` traktowane tak samo (`None`) - web uzywa tylko `??`.
- Deps awansu (katalog, koszt, skarbiec) sa po stronie adaptera gry; w tescie adapter zbudowany z katalogu w wektorze, ta sama logika co w webie.

## 5. Bramki (runda 1)

- `cargo fmt --all -- --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0 (po jednej poprawce `manual_contains`).
- `cargo test --no-fail-fast` w `rust-port/engine`: **1277 passed / 0 failed** (baseline 1265 + 12 nowych testow). Logi: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-NOWE-A-Q1/*.log`.
- Mutacja kontrolna: `own_line_limit = line_minimum_progress + 2.0` (zamiast `+ 1.0`) → test `compact_line_matches_web_on_grid` FAILED (zabity). Przywrocono kod.
- Pozostale mutacje (12 w formacji/dowodztwie/awansie): **NIE_ZMIERZONO** w tej rundzie.

## 6. Poza zakresem tej rundy

- Zmiana pinu w manifestach (`pin-manifest.json`, `MANIFEST.tsv`, `derived/*.json` z polem `pin`): osobny temat po krokach 1-5 (REPIN-DELTA §6).
- Kolejne czesci: `army-consolidation.ts`, `ai-general-war-campaign.ts`, `ai-move-range.ts`, `diplomacy-tick-war-brake.ts`, `forced-war-*`.
- Brak zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`.

## 7. Weryfikacja niezalezna (runda 2, Operator-pomiary)

- Regeneracja wektorow z URUCHOMIONEGO weba `91dc998a` (`gen-repin-wojna-a-web-vectors.mjs`, poza repo): wszystkie 3 pliki **bajt-w-bajt identyczne** z committed `tests/p6_repin_wojna_a_vectors/*.json` (0 rozbieznosci). Liczniki: classify 2031, slots 406, compact 1872, academy 207, morale 460, ratio 1204, withdraw 1204, promo 613.
- Numery linii web z tabeli sekcji 2 sprawdzone przez `git show 91dc998a:<plik>` (exporty: formationRules.ts:3/46/92/115; army-leadership.ts:13/18/23/32/39/57; ai-era-unit-promotion.ts:38; Math.round :57) - zgodne.
- Numery linii Rust sprawdzone grepem (formation_rules.rs:95/123/140/202/232/274/306; army_leadership.rs:69/78/84/95/110/123/146; ai_era_unit_promotion.rs:34/51/62) - zgodne.
- Mutacje niezalezne (kazda zabita, kod przywrocony, `git diff` czysty):
  - M2 `army_leadership.rs` `moraleWithArmyLeaderBonus`: `.ceil()` -> `.floor()` -> FAILED `morale_with_bonus_matches_web`.
  - M3 `ai_era_unit_promotion.rs`: `target.epoka <= old.epoka` -> `<` -> FAILED `promotion_matches_web_on_all_vectors`.
  - M4 `formation_rules.rs` `compact_line_allows_advance`: `own_line_limit.min(previous)` -> `.max(previous)` -> FAILED `compact_line_matches_web_on_grid`.
  - (M1 `+1.0` -> `+2.0` z Operatora-impl r1 - zabita; nie powtarzana.)
- Bramki r2 (surowe logi w runie): fmt EXIT=0; clippy `-D warnings` EXIT=0; `cargo test --no-fail-fast` EXIT=0, **1277 passed / 0 failed / 0 ignored**; trzy cele `p6_repin_wojna_a_*` 5+5+2 = **12/12 ok**.
- Incydent srodowiskowy: pierwsze `cargo test` zakonczylo sie EXIT=101 z bledem linkera (`rust-lld` Bus error, sygnal 7) przy zapelnionym dysku (93%, 3.1 GB wolne). Ponowienie z `-j 2` przeszlo bez zmian w kodzie (log `test-r2.log` = ponowienie).
