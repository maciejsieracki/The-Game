# R-RUSTPORT-P4-1I4-BATTLE-CONSUMER: Evaluator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I4-BATTLE-CONSUMER (P4-1I4 / PRIO-3D-9 #277, #248)
GOAL: konsument `BattleActionDto` → wywołania sceny 3D (kolejność = kolejność akcji) i `BattleFrameDto` → paski, bez zmiany kształtu DTO z I2/I3.
ZMIANY/COMMIT: oceniany kod `84bfcfe84` + raport `2fd81ed76` (rodzic = baza `0deb9a075`, `merge-base --is-ancestor` = prawda). Ten raport to jedyna zmiana Evaluatora (commit lokalny, bez push).
TESTY: odtworzone samodzielnie w `rust-port/renderer` (CARGO_INCREMENTAL=0, DEBUG=0, `CARGO_TARGET_DIR=/tmp/claude-0/eval-1i4-target`, katalog usunięty po bramkach):
- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `cargo test --all-targets --no-fail-fast` → EXIT 0; 68 zestawów, 557 passed, 0 failed, 0 ignored (zgodne z raportem Operatora)
- `battle_playback`: 7/7 passed
- `df -h /` przed bramkami: 17 GB wolnego
BLOKADY: brak blokujących (uwagi niżej)
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora / Final Control
DEPLOY/PUSH: NIE WYKONANO

## Allowlista i granice (sprawdzone)

`git diff --stat 0deb9a075 2fd81ed76`: `battle/playback.rs` (NOWY), `battle/mod.rs` (+1 linia `pub mod playback;`, sprawdzone w diffie), `tests/battle_playback.rs` (NOWY), `01-operator-r1.md`. Fikstury, `gra/`, engine, view-model i `Cargo.lock` są bez zmian (0 plików). `#[ignore]` występuje 0 razy w obu nowych plikach. Testy nie mają osłabionych asercji: pozycje są porównywane bit w bit (`to_bits`), scena jest porównywana jako całe drzewo `BattleScene3`, a ślad wywołań ma dokładną długość i kolejność.

## Weryfikacja wobec pinu `07d2fbd72` (`gra/src/battle/battleScene.ts`)

- `_singleBlow` `:8991-8992` ustawia HP i woła `_updateHpBar` przy KAŻDYM ciosie. `_spawnDamageLabel` tworzy etykietę tylko dla żywego celu (`:9125`, `:9142`) i nie tworzy jej w trybie FF (`:9943`). Producent I3 emituje `Damage` dokładnie w tych warunkach (`siege_tactics_loop.rs:1366`, `:1553`, `:1981`, filtr FF `:1213`). Przy zabiciu emituje `Kill` bez `Damage` (`start_fade` `:1890`, wieża `:1343`). Konsument ustawia pasek HP w `Damage` (nowe HP) i w `Kill` (HP = 0). Dla ścieżek I3 bez FF daje to ten sam ciąg wywołań `_updateHpBar` co pin.
- `_startFade`/`_removeUnitFromScene` `:9910-9938`: działa strażnik idempotencji (`removed`). Konsument powtarza go (`KillUnit{removed:false}`).
- `stepAnim` `:9119-9157` najpierw rozstrzyga cios, potem ustawia pozę lunge. Pozę pomija, gdy atakujący jest martwy. Konsument najpierw wykonuje elementy kolejki `<= now`, potem `step_animations` z `alive = !removed`. To ta sama kolejność.

## Własne mutacje Evaluatora (poza (a)–(c) Operatora)

Wykonane skryptem na kopii `playback.rs`; plik przywrócony (porównanie z oryginałem: identyczny).

| mutacja | wynik |
|---|---|
| (a) powtórzona: brak `labels.push` w `Damage` | FAIL 3/7 (`melee_playback…`, `tower_shot…`, `one_batch…`), potwierdza raport |
| (d) `Kill` bez `set_hp_bar(0)` | FAIL 2/7 (`killing_counter…`, `melee_playback…`) |
| (e) `step_animations` przed kolejką w `play_until` | FAIL 2/7 (`melee_playback…`, `one_batch…`) |
| (f) HP w `Damage` liczone od `spawn.hp` zamiast od śledzonego HP | FAIL 1/7 (`melee_playback…`) |

Testy wykrywają zmiany zachowania. Mutacje (b) i (c) Operatora nie zostały powtórzone. Ich opis jest spójny z kodem testów.

## Zarzuty (ponumerowane)

1. **[UWAGA, parytet FF] Pasek HP rozjeżdża się po przewijaniu bez jawnego resync.** W FF pin nadal woła `_updateHpBar` przy każdym ciosie (`:8992`), ale producent I3 nie emituje `Damage` (`:1213`). `Kill` w FF nadal przychodzi. Śledzone HP konsumenta zostaje więc stare. Pierwszy `Damage` po FF policzy `max(0, stareHP - dmg)`, czyli zły pasek, chyba że wywołujący wcześniej zawoła `apply_snapshot`. DTO nie niesie flagi FF, a wymóg „po FF wołaj `apply_snapshot`" opisuje tylko komentarz. Do rejestru jako kontrakt sterownika P5. Warto rozważyć test, który pokazuje rozjazd bez snapshotu.
2. **[UWAGA, brak wołającego] `BattlePlayback` nie ma produkcyjnego wołającego.** Renderer nie zależy od `civ-engine`, więc testy budują listy akcji ręcznie wg kolejności `ProdBody` (sprawdziłem zgodność kolejności Log → Clash → Damage oraz Log → Kill → Clash z `siege_tactics_loop.rs:1330-1370` i `_resolveBlowOutcome` `:9044-9052`). Strumienia z prawdziwego silnika nie odtworzono (NIE_ZMIERZONO, zgodnie z raportem). Jawna zależność: sterownik bitwy P5 albo test integracyjny na poziomie workspace. Trzeba ją wpisać w rejestrze, żeby moduł nie został osierocony.
3. **[UWAGA, wyrocznia testu] Porównanie P == Q to w dużej części porównanie dwóch sekwencji tych samych funkcji Rust.** `pin_melee` w teście to ręczny zapis kolejności wywołań pinu. Z fiksturą `dynamics.json` porównywane są wprost tylko pozycja atakującego, moment ciosu, koniec lunge oraz etykiety (pozycja, start, czas, wznoszenie). Pasków HP/morale i widoczności zabitego nie da się porównać z fiksturą, bo generator stubuje `_singleBlow` (Operator to ujawnia). Dispatch wymagał „porównania drzewa `Scene` z istniejącymi fiksturami". Spełnione częściowo. Pełne porównanie wymaga fikstury z niestubowanym `_singleBlow` (poza allowlistą tej rundy; dopisanie fikstury było dozwolone, ale wymagałoby zmiany generatora).
4. **[UWAGA, DTO] `TowerShot` nie niesie rodzaju pocisku.** Wywołujący podaje go w `PlaybackOpts::tower_projectile`, a jedna wartość obowiązuje na całą bitwę. W pinie `projectileKind` strzelca wieży zależy od wpisu `'wieza:'+row` (`:4238-4245`). Jeśli wieże jednej bitwy mogą mieć różne rodzaje, jedna opcja nie wystarczy. Decyzja należy do I5 albo `BattleSetupDto.fort` (Operator to zgłasza).
5. **[UWAGA, I5] `Kill` zawsze ustawia HP = 0.** To poprawne dla wszystkich producentów `Kill` w I3 (oba przechodzą przez `hp <= 0`). Śmierć bez ciosu (katapulta na murze przy wyłomie, zejście uciekiniera z pola w `_fleeStep`) to I5 i tam trzeba to zrewidować. Do tego `apply_frame` pomija pola `dead`/`removed` ramki. Jednostka usunięta bez akcji `Kill` zostanie na scenie do I5.
6. **[DROBNE] `play_until` przy błędzie** zwraca przed `step_animations`. Animacje w tej klatce nie postępują, a elementy kolejki sprzed błędu zostają zastosowane. Jest to udokumentowane („items before it are applied"), ale wywołujący musi wiedzieć, że po błędzie trzeba ponowić `play_until`. Nie blokuje.

Żaden zarzut nie narusza kryteriów końca dispatchu. Zarzuty 1–5 to luki kontraktu lub zakresu wskazane jawnie (część zgłosił już sam Operator). Zarzut 3 częściowo nie spełnia literalnie punktu WEKTORY, ale ograniczenie wynika z fikstury pinu, a nie z pracy Operatora.

## Werdykt

PASS-WITH-NOTES. Bramki są odtworzone z EXIT 0. Allowlista jest czysta. Testy są czułe na mutacje (7 mutacji, wszystkie dają FAIL). Kolejność wywołań jest zgodna z pinem dla ścieżek I3. Uwagi 1–3 (kontrakt FF, wołający P5, wyrocznia fikstury) trzeba przenieść do rejestru `REJESTR-RUST.md` przy integracji.
