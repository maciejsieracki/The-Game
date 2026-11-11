STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-WALKA-DYSTANS-MULT-Q1
GOAL: Odpowiedz na zarzuty Evaluatora/Final Control dla r1 (baza kodu: 7be18d597, rekord: e1c4284cc). Rola: Operator (obrona).
ZMIANY/COMMIT: ten plik (dowody obrony) + commit obrony (SHA w sekcji DEPLOY/PUSH / raport). Kod Rust nie zmieniony w tej rundzie.
TESTY: odtworzenie stanu: worktree przełączony detached na e1c4284cc (status czysty). Dowód dla zarzutu 3 (wektory z kodu weba) wykonany ponownie, patrz niżej. Testy cargo nie powtarzane w tej rundzie (Evaluator potwierdził fmt/clippy/testy na e1c4284cc, zgodnie z jego raportem).
BLOKADY: brak nowych. Dług otwarty (nie zamknięty): podpięcie mnożnika do walki i fieldPower (task_909e36a0).
RUNDY: 2/5 (obrona)
NASTEPNY KROK: Final Control na 7be18d597 + e1c4284cc + commit obrony; integracja i decyzja orkiestratora co do zakresu.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1: GOAL tylko częściowo zrealizowany (mnożnik martwy bez podpięcia do walki)
PRZYJMUJĘ (bez zmiany zakresu kodu).
- Potwierdzam: Rust nie ma pętli strzałów ani fieldPower (P6-REPIN-DYSTANS-MULT.md §2, domain/combat.rs:319 resolve_combat to model siły).
- Temat r1 dostarcza formuły i parametr, nie ich zastosowanie w walce. Status tematu: PASS-WITH-NOTES, NIE domknięty w całości.
- Dług: podpięcie do pętli walki i fieldPower -> task_909e36a0 (propozycja, nieuruchomiona). Integracja ma zarejestrować go jako OTWARTY.
- Dowód stanu: `git show 7be18d597 --stat` (8 plików, brak zmian w domain/combat.rs).

### Zarzut 2: src/data/units_combat.rs poza literalną allowlistą
PRZYJMUJĘ jako wyjątek wymagający akceptacji orkiestratora (nie ukrywam).
- Dowód konieczności: rust-port/engine/src/data/units_combat.rs, struct CombatParamsFile ma `#[serde(deny_unknown_fields)]`. Bez pola `ranged_damage_mult` w tej strukturze nowy klucz w combat-params.json wywróciłby parsowanie pliku.
- Zmiana ograniczona do: pole `ranged_damage_mult: RangedDamageMultParams` w CombatParamsFile oraz nowa struktura RangedDamageMultParams (_opis, slinger, lucznik_piesi, i64).
- Zakres diffu: `git diff 43f4064b0 e1c4284cc -- rust-port/engine/data/combat-params.json` (+5) oraz units_combat.rs (+10). Nic poza tym.
- Decyzja o akceptacji wyjątku: orkiestrator.

### Zarzut 3: brak ponownego uruchomienia generatora wektorów z kodu weba
PRZYJMUJĘ — zweryfikowane niezależnie (dowód poniżej). Wynik: zgodność 100%.
- Procedura: `git archive origin/main gra/src gra/data` do katalogu scratch (poza repo), esbuild 0.24.2 bundle eksportów `rangedShotDamage`, `rangedShotAccuracy`, `hitChanceTw` (gra/src/game/combat.ts) i `rangedDamageMultFor` (gra/src/game/unit-power.ts), Node v22.22.0.
- Sprawdzone wartości z plików Rust (`rust-port/engine/tests/p6_repin_dystans_vectors/`) wobec zbundlowanego kodu weba:
  - dystans-mult.json: wszystkie wpisy (19) OK.
  - dystans-shots.json: shots (2400) + halves (80) — 0 rozbieżności.
  - dystans-acc.json: acc (8), hits (6), hitsAcc (4) — 0 rozbieżności.
- Łącznie 2517 wartości, 0 rozbieżności. Skrypty weryfikacyjne w scratch (poza repo), nie commitowane.
- Uwaga: wektory pochodzą z origin/main gra/ (ta sama baza co operator). Zgodność z konkretnym SHA a259012fa nie była sprawdzana osobno; formuły w origin/main są stanem po tej fali.

### Zarzut 4 (nieistotne): hitChanceTw tylko z hitBonus = 0; brak testu ujemnego counter_mult; js_round dla wartości nieujemnych
PRZYJMUJĘ jako znane ograniczenia, bez zmiany kodu.
- hitBonus != 0: NIE_ZMIERZONO (bez zmian; odnotowane w P6-REPIN-DYSTANS-MULT.md §4 pkt 6).
- Ujemny counter_mult: NIE_ZMIERZONO w Rust; web `rangedShotDamage` zwraca max(1, round(...)) także dla ujemnego iloczynu. Dodanie testu wymagałoby zmiany testów i cargo, poza zakresem tej odpowiedzi; zapisane jako dług testowy do kolejnej partii.
- js_round dla ujemnych: nie dotyczy obecnych danych (kontry i mnożniki >= 0), założenie zapisane.

## Stan repo po obronie
- Worktree: detached e1c4284cc (przed commitem obrony). Plik obrony dodany tylko do katalogu runs tematu.
