# 02a-obrona — R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1 (runda 1, obrona Operatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (rozpoznanie, bez kodu)
TEMAT: R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1 (EKONOMIA-8I2, #180)
BAZA: `5e8b116e8` (czubek `origin/rust-port/parity-v2`), pin `07d2fbd72` (tylko odczyt).
SHA raportu bazowego Operatora: `0dfdbaf40`. Ta obrona: SHA commitu podany w odpowiedzi orkiestratorowi (plik nie zawiera własnego SHA).
ZMIANY/COMMIT: dwa pliki: (a) korekta `dyspozycje/rust-port/p6/R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (nowa §5, nadpisuje statusy §1/§2), (b) ten plik. Zero zmian w `rust-port/**`, `gra/**`, testach, Cargo.
TESTY: NIE DOTYCZY (rozpoznanie). Sprawdzenia: `git grep` na `07d2fbd72` i `5e8b116e8` (wyniki w §"Dowody").

## Odpowiedzi na zarzuty

### Z1. KRYTYCZNY: brąz per-era (`converters.ts:99,100,102`) i zbiór `CONVERTER_FOUNDRY_ERA_RECIPE_IDS` (3 vs 6) — PRZYJMUJĘ

Dowody:
- Pin `converters.ts:99,100,102` ma `throughputEraParamKeys: { 2: 'budynek_huta_braz_epoka2_przepustowosc', 3: 'budynek_huta_braz_epoka3_przepustowosc' }`. Konsument w pinie: `converters.ts:178-183` (`converterThroughputEraParamKey`) i `:226`.
- Rust: `git grep huta_braz_epoka 5e8b116e8 -- rust-port` = 0 trafień. Rust `ConverterRecipe` (`turn_economy_resources.rs:41-49`) nie ma pola per-era.
- Pin `CONVERTER_FOUNDRY_ERA_RECIPE_IDS` = 3 wpisy (`converters.ts:148-152`). Rust `turn_economy_resources.rs:151-158` = 6 wpisów, z `odlewnia_brazu`, `odlewnia_zelaza__braz`, `wielka_odlewnia__braz`. Rust `:186` mnoży przez m(e) każdy wpis zbioru, więc brąz jest skalowany błędnie.
- Poprawka: §5.1 wiersze 6, 9b, 10, 16 w korekcie (CZĘŚCIOWO, rozbieżność). Wiersz 6 z §1 był oznaczony JEST, to był błąd Operatora.
- Dowód commita: korekta w `dyspozycje/rust-port/p6/R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1-ROZPOZNANIE.md` §5.1 i §5.3 (temat T-A).
- Realna rozbieżność: REPIN-DRYFT 2 (zadanie #15, decyzja właściciela) to ta sama luka. Zgłoszona teraz jako osobny temat T-A.

### Z2. WYSOKI: cytaty Rust (`converters.ts:81-101` i `:147`) są ze starszego pinu — PRZYJMUJĘ (częściowo)

- Potwierdzone: Rust `turn_economy_resources.rs:51` cytuje `converters.ts:81-101`, a w pinie tabela to `:85-105` (wpisy `:86-104`). Rust `:149` cytuje `:147`, a w pinie zbiór to `:148-152` z innym składem (3 wpisy).
- Nie potwierdzone: że port pochodzi z konkretnego starszego pinu. To hipoteza. Oznaczone NIE_ZMIERZONO (§5.2).
- Operator nie wykrył dryfu: przyjęte jako błąd procesu. Korekta §5.2.

### Z3. WYSOKI: wiersz 18 (wybór konwertera przez AI, `ai.ts:2339-2346`, `:2726-2728`) = NIE_ZMIERZONO — PRZYJMUJĘ

- Zweryfikowane: `git grep -i odlewnia 5e8b116e8 -- rust-port/engine/src` nie daje trafienia w żadnym pliku `ai*.rs` ani w `ai_resource_needs.rs`. Trafienia: `data/` (`economy_society.rs`, `derived.rs`), `resource_access.rs`, `turn_economy_resources.rs`, `start_position.rs:739` (start, nie AI).
- Status zmieniony na BRAK dla gałęzi odlewni (§5.1 wiersz 18). Dla ogólnej reguły priorytetu i bramki `canAfford` (`ai.ts:2318-2334`): nadal NIE_ZMIERZONO. Zarzut mówił o „jednym grepie”; wynik potwierdzony na pełnym `rust-port/engine/src`.
- Kryterium końca 2 (lista braków) spełnione dla tej pozycji: brak odpowiednika gałęzi odlewni po stronie AI.

### Z4. WYSOKI: wiersz 17 błędnie sklasyfikowany (`economy-upkeep.ts:407` to cap list) — PRZYJMUJĘ

- Zweryfikowane: pin `economy-upkeep.ts:405-409` = `OWNER_CAPPED_RESOURCE_KEYS` (14 kluczy, `zelazo` w linii 407). Rust `turn_economy.rs:1349-1350` = ta sama lista (14 kluczy).
- Wiersz 17 w §5.1: zmiana opisu. Reguła upkeep obywateli żelazem: NIE_ZMIERZONO.
- T2 z §3 (upkeep) zastąpiony tematem T-D (rozpoznanie reguły, 1 runda). Przesłanka „złej listy” usunięta.

### Z5. ŚREDNI: wiersz 14 zawyżony (`ai.ts:2727` vs `auto_improvements.rs:222`) — PRZYJMUJĘ

- Zweryfikowane: `auto_improvements.rs:222` ma tylko `("ruda_zelaza", &["kopalnia_zelaza"])`. Brak wpisu `zelazo`→`odlewnia_zelaza` w `rust-port/engine/src`.
- Pin `ai.ts:2727` (`zelazo: ['odlewnia_zelaza']`) jest mapą zasób→budynek, nie kodem auto-ulepszeń. Czy pin używa jej w auto-ulepszeniach: NIE_ZMIERZONO.
- Status wiersza 14: CZĘŚCIOWO (§5.1).

### Z6. ŚREDNI: wiersze 12, 15, 16 mają JEST tylko dla pól — PRZYJMUJĘ

- Wiersz 12 → CZĘŚCIOWO (struktura, wartości NIE_ZMIERZONO).
- Wiersz 15 → NIE_ZMIERZONO (ścieżka pina nie sprawdzona, wartości nieznane).
- Wiersz 16 → CZĘŚCIOWO (pola istnieją; brak per-era dla brązu; wartości NIE_ZMIERZONO).
- Wiersze 15-16 bez ścieżki pina: zgoda, status poprawiony.

### Z7. ŚREDNI: podział T1–T4 do przeliczenia — PRZYJMUJĘ

- T4 usunięty jako osobny temat: wiersz `converters.ts:102` przeczytany wprost (§5.1 wiersz 10) i zarzut 1 obejmuje go w T-A.
- Dodany T-A (era-brąz, 2 rundy, zależny od decyzji właściciela o wartościach 50/75, REPIN-DRYFT 2 / #15).
- T1 → T-B (AI odlewnie, 2-3 rundy, wymaga rozpoznania ogólnej reguły priorytetu).
- T2 → T-D (upkeep, 1 runda, po rozpoznaniu reguły).
- T3 (wartości liczbowe) → pytanie ABC do właściciela przed T-A, nie osobny temat wykonawczy.
- Szacunki rund: oznaczone jako szacunek (nie pomiar), bez gwarancji.

### Z8. NISKI: nie sprawdzono trackera/rejestru pod kątem etykiety 8I2 — PRZYJMUJĘ (częściowo)

- Sprawdzono repo: tracker #180 nie jest plikiem w repo. Jedyna wzmianka: `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUDYT-PARYTETU-Q1/dowody/05-wip-refs-origin.txt:7` (`origin/rust-port-wip/8I2-r1-op`), czyli nazwa brancha wip, nie definicja zakresu.
- Znaczenie zestawu 8I2: NIE_ZMIERZONO (§5.4).

## Dowody (wyniki poleceń)

- `git show 07d2fbd72:gra/src/game/converters.ts` — linie 85-105 (tabela), 148-152 (zbiór), 178-183, 226 (konsument per-era).
- `git show 5e8b116e8:rust-port/engine/src/domain/turn_economy_resources.rs` — linie 51, 81-114, 149-158, 186.
- `git grep huta_braz_epoka 5e8b116e8 -- rust-port` — 0 trafień.
- `git grep -i odlewnia 5e8b116e8 -- rust-port/engine/src` — trafienia tylko w `data/`, `resource_access.rs`, `turn_economy_resources.rs`, `start_position.rs:739`.
- `git show 07d2fbd72:gra/src/game/economy-upkeep.ts` — linie 405-409 (`OWNER_CAPPED_RESOURCE_KEYS`).
- `git show 5e8b116e8:rust-port/engine/src/domain/turn_economy.rs` — linie 1349-1350.
- `git show 5e8b116e8:rust-port/engine/src/domain/auto_improvements.rs` — linie 218-226.

## Blokady

1. Wartości 50/75 per epoka (REPIN-DRYFT 2, #15): decyzja właściciela (ABC) przed T-A. NIE_ZMIERZONO w pinie econ-params.
2. Ogólna reguła priorytetu konwertera (`ai.ts:2318-2334`) i reguła upkeep żelaza: NIE_ZMIERZONO.
3. Znaczenie etykiety 8I2: NIE_ZMIERZONO.
4. Historia pinu (skąd cytaty Rust): NIE_ZMIERZONO.

## RUNDY

RUNDY: 1/5 (obrona w rundzie 1).

## NASTĘPNY KROK

Orkiestrator: (1) pytanie ABC do właściciela o wartości per-era brązu (REPIN-DRYFT 2); (2) Evaluator r2 na korektę §5 i obronę; (3) po PASS: zlecić T-A, T-D równolegle, T-B po rozpoznaniu.

## DEPLOY/PUSH

NIE WYKONANO. Brak pusha, brak integracji. Push do `rust-port/parity-v2` zakazany dispatchem.
