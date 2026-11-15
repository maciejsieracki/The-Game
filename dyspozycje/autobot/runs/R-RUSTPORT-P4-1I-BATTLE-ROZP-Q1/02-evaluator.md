# 02 — Evaluator r1 — R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (DTO renderera, zdarzenia bitwy; rozpoznanie tylko do odczytu)
TEMAT: R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1 (P4-1I / #218)
GOAL: weryfikacja adwersarialna rozpoznania producenta zdarzeń bitwy (Operator r1, `ed07607c4`).
BAZA: `origin/rust-port/parity-v2` = `c3e3617b2aaaede5f708d2c425b0222c4af78549` (zgodna z dispatchem i raportem Operatora). Pin: `07d2fbd72`.
ZMIANY/COMMIT: tylko ten plik (commit na `ed07607c4`, bez push).
TESTY: patrz §1.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona / Final Control; zarzuty Z1–Z2 przenieść do dispatchu I1 (albo poprawić dokument w r2).
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone

| Bramka | Wynik |
|---|---|
| `git diff --stat c3e3617b2 ed07607c4` | 2 pliki, oba z allowlisty (`dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` NOWY, `.../01-operator-r1.md`) |
| `git diff --check c3e3617b2 ed07607c4` | exit 0 |
| `git diff --name-only c3e3617b2 ed07607c4 -- rust-port` | 0 plików → zero zmian kodu (wymóg dispatchu) |
| `git diff ... -- gra/` | 0 plików |
| `cargo fmt -- --check` w `engine`, `view-model`, `renderer` | exit 0 / 0 / 0 |
| `cargo clippy -D warnings`, `cargo test --lib` | NIE URUCHOMIONO: drzewo `rust-port/**` identyczne bajtowo z bazą `c3e3617b2` (0 plików różnicy), więc wynik = wynik bazy; wolne 7,6 GB < 8 GB (zasada 5 orkiestratora dla buildów Rust). Dispatch nie podaje testu. |
| `#[ignore]`, osłabione asercje, wołający w Rust, wektory pinu | NIE DOTYCZY — brak kodu i testów w diffie. |

## 2. Weryfikacja treści (próbka realnie sprawdzona)

- Pin: sprawdzono ~70 cytatów `battleScene.ts` (m.in. `:8685`, `:8751`, `:8334`, `:9096`, `:9104`, `:9122`, `:9134`, `:9179`, `:9190-9194`, `:9221`, `:8962`, `:8991`, `:9940/:9943`, `:9695/:9707/:9722/:9743`, `:9799`, `:9845`, `:9910`, `:9927`, `:9047`, `:7704`, `:4194/:4199/:4208/:4216/:4223`, `:7540/:7552/:7561/:7563`, `:7638/:7648/:7649`, `:7310/:7323/:7329`, `:7757`, `:8056/:8074`, `:9550/:9569`, `:9636/:9652/:9671`, `:7814/:7833`, `:10153`, `:9467`, `:9493`, `:10666`, `:10257`, `:588-604`, `:10720-10729`, `:10246`, `:9415`, `:5865`, `:5936`, `:11043`, `:68`, `:597`), `wc -l` = 20 771, `units/battleRoster.ts:21-39`, `game/post-battle-map.ts:96-113`. Zgodne.
- Teza główna potwierdzona: w `battleScene.ts` brak `emit(`/`dispatchEvent`; `addEventListener` występuje wyłącznie dla wejścia UI (`:3329`, `:3499-3512`), nie dla zdarzeń bitwy. `BattleEventLog` = dwie listy ID (`battleRoster.ts:21-39`), budowane w `onFinish` (`:10724-10727`), konsumowane w `post-battle-map.ts:96-113`. Rozróżnienie od wpisu `REJESTR-RUST.md:1534` (`claude/rust-sivvrn`) — słuszne.
- Rust (baza): sprawdzono `siege_tactics_loop.rs` (`:293`, `:326-327`, `:523`, `:529`, `:538-541`, `:552-556`, `:626`, `:646`, `:697-704`, `:802-818`, `:837-849`, `:869`, `:876`, `:935`, `:1029-1031`, `:1247`, `:1252`, `:1266`, `:1312`, `:1324`, `:1360`, `:1371`, `:1413`), `siege_tactics_breach.rs` (`:24-27`, `:92`, `:108`, `:131`, `:142`), `siege_tactics_blow.rs` (`:19`, `:123-141`), `siege_tactics_turnseq.rs` (`SetHint`/`Banner`), `siege_tactics_clock.rs:50-51`, `siege_tactics_endcheck.rs:17`, `:202`, `siege_tactics_tower.rs:119`, `:399`, `:431`, `siege_tactics_fastforward.rs:131`, `combat.rs:160-178`, renderer `dynamics.rs`/`units.rs`/`siege_towers.rs` (wszystkie funkcje z kolumny „render”). `git grep -i "event_log\|BattleEventLog" c3e3617b2 -- rust-port` → tylko `war_event_log` (panel wojny), brak logu bitwy — zgodnie z dokumentem.
- Kontrakt `P4-1-RENDER-DTO-CONTRACT.md @ f2b246ff3` §3.8 (l.326-329), l.413, l.440 (D-DTO-7), l.460 — zgodne; brak pliku w drzewie bazy potwierdzony.
- Kryteria końca 1–4 dispatchu: spełnione (tabela 30 wierszy, §2a–2c, §4 I1–I5, §5 NIE_ZMIERZONO).

## 3. Zarzuty

1. **Z1 (istotny, §2a i wiersz #27 + I1): producent `survivors` jest niepełny, a teza o `CombatResult` błędna.** `BattleResult.survivors` to `this._endSurvivors` (`battleScene.ts:10722`), ustawiane w czterech miejscach o różnej semantyce: `_checkEnd` — tylko strona zwycięzcy (`:10222-10237`), `_finishDraw` — OBIE strony (`:9473-9477`), PAT z przewijania — strona zwycięzcy (`:9494-9495`), `_skipInstantFallback` (`:3715`) — `result.survivors` z `computeInstantResult` (`:3723`, w środku `resolveCombat`, `:20534`) (`:3746`), gdzie też `wallEverBreached = true` przy obecności machiny oblężniczej (`:3720-3722`) i `log` z `result.log` (`:3744`). Dokument podaje jedno źródło (`_battleUnitsForMapExport` z `TurnSeqState`) i w #27 twierdzi, że `CombatResult` (`combat.rs:160-178`) „nie dotyczy bitwy taktycznej” — a scena bitwy używa go w ścieżce „Pomiń”. I1 w obecnym kształcie zbuduje `survivors`/`wall_breached` źle dla remisu i dla „Pomiń”. Wymagane: rozpisać 4 ścieżki w §2a i wektory I1 (remis = obie strony; skip = wynik `resolveCombat`; wyłom przy machinie).
2. **Z2 (średni, §2a): `survivors: Vec<{id, hp}>` zawęża typ webu bez uzasadnienia.** Web eksportuje pełny `BattleUnit` (`{...u.bu, hp: Math.max(0, u.bu.hp)}`, `:10248-10249`), a `u.bu` jest mutowane w bitwie (np. `armyLeaderMoraleBonusFrac = 0`, `:9999`). Dokument nie sprawdza, które pola `bu` zmieniają się w bitwie i czy mapa je czyta po powrocie → zawężenie do `{id, hp}` jest niezweryfikowane. Wymagane: lista mutacji `u.bu.*` w `battleScene.ts` albo jawne NIE_ZMIERZONO w §5.
3. **Z3 (drobny, precyzja cytatów):** `BlowRecord.def_hp_after` to `siege_tactics_loop.rs:844` (`:843` = `dmg`); `"atak-muru"` to `:810` (nie `:809`, które = `"taran-wieza"`); `BattleUnitSpawnDto.id` to `view-model/src/battle.rs:85` (nie `:88`); morale wyłomu muru `:7745-7750` i bramy `:7804-7810` (przesunięte o 1–2). Nie zmienia wniosków.
4. **Z4 (drobny, §0 pkt 1):** zdanie „nie znajduje … `dispatchEvent` ani subskrypcji” — `addEventListener` istnieje (`:3329`, `:3499-3512`), ale dotyczy wejścia UI. Doprecyzować „brak subskrypcji zdarzeń bitwy”.
5. **Z5 (proces, informacyjnie):** bramki `clippy`/`cargo test --lib` nieodtworzone z powodu dysku (7,6 GB) i zerowej różnicy w `rust-port/**`; dla tematu dokumentacyjnego bez kodu — akceptowalne.

## 4. Werdykt

PASS-WITH-NOTES. Teza główna (brak strumienia zdarzeń w pinie, `eventLog` = tożsamość rosterów, snapshot pokrywa wynik/paski, akcje przejściowe wymagają listy w kroku) jest prawdziwa i udokumentowana. Z1 musi trafić do dispatchu I1 (albo r2 dokumentu) przed jakimkolwiek wdrożeniem `BattleOutcomeDto`; Z2 jako NIE_ZMIERZONO.
