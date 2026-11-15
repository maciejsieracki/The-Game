# R-RUSTPORT-P4-1D-Q1-STACK-REPIN — Evaluator (adwersarialny), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1D-Q1-STACK-REPIN
GOAL: reprezentant stosu (`pickStackLeader`) i `StackVitals.has_commander` zgodne z pinem `07d2fbd72`.
ZMIANY/COMMIT: oceniany kod `04b773b37` (raport Operatora `b6645c63d`), baza Operatora `c3e3617b2`. Ten raport: commit tylko z tym plikiem, bez push.
RUNDY: 1/5
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Bramki odtworzone niezależnie (checkout `b6645c63d`, CARGO_TARGET_DIR w scratchpadzie poza repo)

| Bramka | Wynik | EXIT |
|---|---|---|
| `cargo fmt --check` | czysto | 0 |
| `cargo clippy --all-targets -- -D warnings` | czysto | 0 |
| `cargo test --lib` | 118 passed, 0 ignored | 0 |
| `cargo test --test p6_5a_display` | 13 passed (7 starych + 6 nowych @07), 0 ignored | 0 |
| `p6_5a_stack/ruch/cost/tables`, `p6_5b_tables` | 10/8/4/2/6 passed | 0 |
| `gen.mjs` na `git archive 07d2fbd72 gra/src gra/data` (node v22.23.4) | sha256 `875ef35f…` = commitowany `vectors.json` (bajt w bajt) | 0 |
| `git merge-tree` z aktualnym `origin/rust-port/parity-v2` = `2f9a12786` | bez konfliktów; parity nie zmieniła `recruitment.rs` ani `p6_5a_*` od `c3e3617b2` | 0 |

Pełny `cargo test` (wszystkie testy integracyjne): NIE_ZMIERZONO (ani przez Operatora, ani tu).

## Weryfikacja merytoryczna

- Pin: `stack-leader.ts:28-41` (`pickStackLeader`: pula = `filter(!isNonCombatStackMember)`, gdy niepusta; `reduce` z `a !== b ? (a > b ? u : best) : (u.id < best.id ? u : best)`); `armyMerge.ts:530` deleguje; `setup.ts:203` `isCivilianUnit` = kategoria ∈ {osadnik, robotnik, zwiadowca} LUB typeId ∈ {Zwiadowca, Osadnik, Robotnik}. Rust: filtr `!has_combat || is_combat(u)` + istniejący `reduce`; `is_civilian_unit` czyta `manpower-params.json` `cywilne` = te same zbiory. Zgodne.
- `hasCommander: stack.some(unit => unit.isGeneral === true)` (`armyMerge.ts:1153`) → `stack.iter().any(|u| is_true(u.is_general))`. Zgodne (false/undefined → false).
- Odwołania linii `@07` sprawdzone `git grep` na pinie: `:21`, `:530`, `:579`, `:584`, `:649`, `:908`, `:976`, `:1093`, `:1103`, `:1129`, `:1137`, `:1153` — wszystkie trafne.
- Generator wykonuje PRAWDZIWE moduły pinu (`import` `armyMerge.ts`, `stack-leader.ts`, `setup.ts`, `auto-battle-power.ts`, `unit-building-bonuses.ts`, `veteran.ts`), bez stubów; strażniki SHA-256 na 12 fragmentach. Wektory nie są ręczne.
- Niezależny skrypt (Python, poza repo): `repinChanged` == zbiór indeksów, gdzie wynik @07 ≠ wynik `display.json` (pick 34, display 19, unitAt 1, vitals 0 — wszystkie cztery listy równe). W każdym zmienionym przypadku pick/unitAt stary reprezentant jest cywilem, a nowy — jednostką bojową. Żaden stary wektor nie niesie `isGeneral`; każdy niesie `category`. `display.json` niezmieniony (diff = 0).
- Własna mutacja (poza listą Operatora): `is_civilian_unit(&u.category, "")` (pominięcie fallbacku po `typeId`) → 3 testy FAILED (EXIT 101). Przywrócono `git checkout`. Mutacje Operatora (4/4 FAIL) potwierdzone logiem `mutate-q1-r1.log`.
- `#[ignore]`: brak. Osłabionych asercji brak: stare progi (`ties > 10`, `with_vitals > 50`, `stacked > 20`, `found > 20 && missing > 5`, `nonempty > 50`, `empty == 1`) zachowane; dodane sumy kontrolne `checked + skip == total` (pick, display); `assert_vitals` przy braku pola `hasCommander` w wektorze wymaga `false`.
- Allowlista: zmienione tylko `recruitment.rs` (wyłącznie moduł `army_merge`: import, 2 pola, `new`, filtr puli, `has_commander`, komentarze), `p6_5a_display.rs`, `p6_5a_vectors/{common.rs,gen.mjs,vectors.json}`, `dyspozycje/autobot/runs/<ID>/**`. Literały `StosJednostka {`: jedyny to `Self { … }` w `StosJednostka::new` (pozostałe trafienia `git grep` to typy zwracane / definicja). `Cargo.lock` nie w commicie.
- Wołający w Rust: produkcyjnego wołającego `compute_stack_display` / `pick_stack_representative` brak; jawna zależność — producent DTO P4-1D-Q4 UNIT-VIEW (`P4-1D-UNIT-ROZPOZNANIE.md` §3), wskazana też w raporcie Operatora („Producent (P4-1D-Q4) musi podać prawdziwą kategorię”). Zgodne z zakresem Q1.

## Zarzuty (nieblokujące)

1. Stary test `unit_at_representative_matches_web` nie ma sumy kontrolnej `found + missing + skip == total` (pick i display ją dostały). Pominięcie nie jest zabezpieczone licznikiem w tym jednym teście; obecnie skip = 1, a przypadek jest sprawdzony w `repin`.
2. Lista pomijanych starych przypadków (`repinChanged`) pochodzi z wyjścia generatora, Rust jej nie przelicza. Wadliwy generator mógłby ukryć przypadek przed starym testem. Ryzyko jest ograniczone, bo `repin` sprawdza wszystkie wejścia z wynikiem @07 (test asertuje równość `units` ze starymi), a tutejszy niezależny przelicznik potwierdził listy. Do rozważenia: asercja w Rust, że dla indeksów spoza `repinChanged` `repin.out == display.out`.
3. Dispatch mówi o „nowym teście wektorów”. Operator dopisał 6 testów w `p6_5a_display.rs` zamiast nowego pliku, co zgadza się z allowlistą (nowy plik testu nie był dozwolony). Odnotowane, bez skutku.
4. Baza parity przesunęła się z `c3e3617b2` na `2f9a12786`. Merge-tree jest czysty, ale bramki na nowej bazie i pełny `cargo test` to NIE_ZMIERZONO, do zrobienia przy FC lub integracji.
5. `StosJednostka::new` ustawia `category = ""`. Do czasu P4-1D-Q4 cywil rozpoznawany jest wyłącznie po `type_id` (zgodnie z webem dla kategorii spoza zbioru). To dług zależności, nie błąd Q1.

## Sprzątanie

Usunięto `CARGO_TARGET_DIR` (scratchpad), rozpakowany pin i `rust-port/engine/Cargo.lock` (nieśledzony). Brak push.
