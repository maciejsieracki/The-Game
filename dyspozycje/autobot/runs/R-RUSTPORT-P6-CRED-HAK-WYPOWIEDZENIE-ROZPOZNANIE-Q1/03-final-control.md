# 03-final-control — R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1
GOAL: werdykt końcowy dla rozpoznania parytetu web (pin `07d2fbd72`) ↔ Rust (`a01363d5f`) ścieżki gracza: `playerDeclareWarOnOwner`, `breakTreatyVoluntarily`, `breakTreatiesOnWar`.
ZMIANY/COMMIT: ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1/03-final-control.md`). Zero zmian w `gra/`, `rust-port/engine/`, `rust-port/renderer/`. Zero cargo/npm. Bez push, bez integracji.
TESTY: NIE_DOTYCZY (rozpoznanie, tryb odczytu). Dowody: `git show 07d2fbd72:gra/src/main.ts`, `git show 07d2fbd72:gra/src/game/diplomacy.ts`, `git show/grep a01363d5f:rust-port/...`.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (tylko katalog runu); dispatch wdrożeniowy #171 z warunkami wstępnymi z §3 i erratą z §2.
DEPLOY/PUSH: NIE WYKONANO

## 1. Zakres commitów (zweryfikowane samodzielnie)

- Łańcuch: `807ecebdd` (baza) → `bce250d70` (Operator: 01-rozpoznanie) → `486aad3c3` (Evaluator: 02-evaluator) → `ab7588d58` (Obrona: 02a-obrona). Liniowy; `git merge-base --is-ancestor 807ecebdd ab7588d58` = prawda.
- `git log --stat bce250d70^..ab7588d58`: 3 commity, po jednym pliku każdy, wszystkie w `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1/` (`01-rozpoznanie.md` +133, `02-evaluator.md` +48, `02a-obrona.md` +125).
- `git diff --name-only 807ecebdd ab7588d58` = dokładnie te 3 pliki. Zero `gra/`, zero `rust-port/`. POTWIERDZONE.
- Uwaga integracyjna: `origin/claude/rust-sivvrn` ma już w tym katalogu `00-dispatch.md`, `01-operator-r1.md`, `02a-obrona.md`, `03-final-control.md` (inne treści z wcześniejszej rundy tego samego ID). Ten łańcuch dodaje `01-rozpoznanie.md`, `02-evaluator.md` (nowe nazwy, bez kolizji) oraz `02a-obrona.md` i `03-final-control.md` (kolizja add/add). Integracja nie może nadpisać ślepo; zachować obie wersje (np. stare pod sufiksem `-r0`).

## 2. Orzeczenia na zarzuty (zweryfikowane na pinie i `a01363d5f`)

| # | Zarzut Evaluatora | Moja weryfikacja | Orzeczenie |
|---|---|---|---|
| 1 | Kolejność: web charge nie zmienia relacji, `DeclareWar` po break/alliance; Rust `declare_war_opts` nakłada relację wewnątrz | POTWIERDZONE. Web: `chargeWarDeclarationCredibility` `main.ts:12176–12225` bez `setDiploRelation`; `playerDeclareWarOnOwner` `:13168` charge → `:13169` break → `:13170` alliance → `:13171–13175` relacja. `applyDiploEventTracked` (`:12310–12327`) daje `wiarygodnosc = undefined` przy `cur.status === 'wojna'` (`:12318–12319`), a `breakTreatiesOnWar` czyta `cur` w `:23698` — kolejność zmienia wynik kary. Rust: `diplomacy_truce_flow.rs:269–273` (`apply_diplomatic_event(DeclareWar)` + `set_relation` w `declare_war_opts`). Nie ma wołających w produkcji (tylko `tests/p6_repin_rozejm_silnik.rs:223–282`). Sam `DeclareWar` jest idempotentny (ustawia status, zerowe delty), więc ryzyko to kolejność, nie duplikat. | NAPRAW (errata + zakres #171). Rozdzielić `declare_war_opts` na charge bez relacji i `apply_war_declaration_relation`; wrapper gracza w kolejności webu. Decyzja techniczna do `REJESTR-RUST.md`, nie pytanie ABC. Poprawka A4 z `02a-obrona.md` §Zarzut 1 jest wiążąca. |
| 2 | NIE_ZMIERZONO zawyżone dla `ownerDeclareWarOn` (`main.ts:13197–13235`) | POTWIERDZONE. Funkcja przeczytana w całości: guard tożsamości, `force` czyści `peaceUntilTurn` / bez `force` cichy `return`, charge → break(`isMe(attacker)`) → alliance → relacja → `zarejestrujWypowiedzenie(cause ?? ...)`, porządki warunkowe `isMe(...)`, `void`. Jest 6 trafień `ownerDeclareWarOn(` na pinie, w tym definicja, czyli 5 wołań (zakres do domknięcia w #171). `playerDeclareWarOnOwner` wołane z `:13276`, `:13278`, `:20502`, `:25248`. | NAPRAW. Tabela różnic z `02a-obrona.md` §Zarzut 2 wchodzi do rozpoznania jako §1a; w §5 pkt 1 NIE_ZMIERZONO zostaje tylko `joinAllyToWar` (`:23803–23814`). |
| 3 | Błędne numery linii | POTWIERDZONE co do każdej pozycji: `diplomacy.rs` `is_trade` `:4330`, `trade_treaty_break_penalty_free` `:4329`, stała `TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS` `:4306`, warianty `BrokenPromiseByPlayer` `:553` / `BrokenPromiseByAi` `:555` (atrybuty serde `:552/:554`); `main.ts` `breakTreatiesOnWar` w `ownerDeclareWarOn` `:13206`; P4 `main.ts:12223–12224`. | NAPRAW (redakcyjnie, errata poniżej). Wnioski nietknięte. |
| 4 | `note_war_entered`: jedyny bezpośredni wołający to `note_war_declarations` | POTWIERDZONE `git grep`: `credibility.rs:855` (def) ← `turn_war_dipl_steps.rs:898` w `note_war_declarations` (`:879`) ← `turn_war_pipeline.rs:422` (po hamulcu) i `war_turn_declare.rs:116` (`declare_forced_wars`). `declare_war_opts` nie woła haka; nośnik `TruceDiplomacy` to `credibility_events`, nie `CredibilityRegistry`. | NAPRAW (errata). Nośnik P4 dla gracza (parametr wrappera vs pole w `TruceDiplomacy`) = decyzja techniczna #171. |
| 5 | Brak odczytu N2/N3/N5 i pokrycia wektorów ścieżki gracza | POTWIERDZONE. Pin `diplomacy.ts:327–339` = Rust `data/diplomacy.json:102–108` (N2 nap -18, sojusz -25; N3 -12 / +10 tur; N5 traktat -6, handel -4). `p6_cred_wojna*.rs` nie wołają `declare_war*`; ścieżkę gracza pokrywają tylko testy jednostkowe `p6_repin_rozejm_silnik.rs:220–285`. | ODDAL do dispatchu #171 jako WARUNEK WSTĘPNY (nie błąd rozpoznania; rozpoznanie wolno zamknąć z jawnym NIE_ZMIERZONO). Pytania ABC: 0. |

### Dodatkowa uwaga Final Control (nie była zarzutem Evaluatora, brak w Obronie)

6. Wiersze A7/B10 stwierdzają, że `apply_diplomatic_event` jest „bez wiarygodności”. To prawda dla tej funkcji, ale w Rust istnieje `apply_diplomatic_event_with_params(relation, event, params, credibility: Option<f64>)` (`diplomacy.rs:621`), do której `apply_diplomatic_event` (`:617–619`) deleguje z `DiplomacyParams::default()` i `None`. Odpowiednikiem `applyDiploEventTracked` w części wiarygodności jest więc wołanie wersji `_with_params` z `Some(wiarygodnosc gracza)` gdy `status != wojna` i w parze jest człowiek; BRAK dotyczy wyłącznie wyboru wiarygodności i `recordDiploFactor`. W #171 pilnować też, by wołać `_with_params` z parametrami wczytanymi z `diplomacy.json`, a nie `DiplomacyParams::default()` (zgodność domyślnych z danymi: NIE_ZMIERZONO). Decyzja techniczna, nie ABC.

### Errata wiążąca dla `01-rozpoznanie.md` (01 pozostaje nieedytowany; czytać razem z tą erratą)

1. Wiersz A4: „CZĘŚCIOWO, KOLEJNOŚĆ NIEZGODNA” (tekst z `02a-obrona.md` §Zarzut 1); P4 w webie = `main.ts:12223–12224`.
2. Dodać §1a: tabela `ownerDeclareWarOn` z `02a-obrona.md` §Zarzut 2; §5 pkt 1 zawęzić do `joinAllyToWar`.
3. Linie Rust: B2/B4 `is_trade` `diplomacy.rs:4330`; `trade_treaty_break_penalty_free` `:4329`; stała `:4306`; C5 `BrokenPromiseByPlayer`/`ByAi` `:553/:555`; C6 `ownerDeclareWarOn` → `breakTreatiesOnWar` `main.ts:13206`.
4. §1 A4(c) i §2 pkt 3: łańcuch `note_war_entered` ← `note_war_declarations` ← {`turn_war_pipeline.rs:422`, `war_turn_declare.rs:116`}; gracz nie wywołuje haka.
5. §5 pkt 9: wektory P4 pokrywają hamulec i wojnę wymuszoną, nie ścieżkę gracza.
6. A7/B10: dopisać `apply_diplomatic_event_with_params` (pkt 6 powyżej).

## 3. Próba weryfikacji samodzielnej (co sprawdziłem, nie ufając raportom)

- Web (pin): `playerDeclareWarOnOwner` `:13152–13186`, `chargeWarDeclarationCredibility` `:12176–12225`, `ownerDeclareWarOn` `:13197–13240`, `applyDiploEventTracked` `:12310–12327`, `breakTreatiesOnWar` `:23688–23702` oraz wszystkie 6 wołających `breakTreatiesOnWar` (`:11705`, `:13169`, `:13206`, `:23809`, `:40442`, `:41932`); parametry N2/N3/N5 `diplomacy.ts:327–339`.
- Rust (`a01363d5f`): `declare_war`/`declare_war_opts` `diplomacy_truce_flow.rs:239–273`; numery linii `diplomacy.rs` (zob. zarzut 3); `note_war_entered` / `note_war_declarations` (zob. zarzut 4); `bridge.rs` bez `declare_war`/`break_treat*` (0 trafień); `declare_war*` poza testami bez wołających.
- Żaden wiersz tabeli nie został obalony co do statusu BRAK/CZĘŚCIOWO/OK.

### Warunki wstępne dispatchu wdrożeniowego #171 (przed pierwszą linią kodu)

1. Odczyt pełnej listy `DIPLO_*_THRESHOLD_KEYS` (`diplomacy.ts` ~`:564–578`): czy skalowanie trudnością dotyka kluczy `wiarygodnosc*`.
2. Wektory ścieżki gracza z generatora na pinie (wzór `p6_cred_wojna_gen_r2.mjs`), nie ręcznie; wartości N2/N3/N5 z `diplomacy.json`.
3. Zgrep wszystkich wołań `ownerDeclareWarOn` (5) i `playerDeclareWarOnOwner` (4) na pinie oraz odczyt `joinAllyToWar` `:23803–23814`.
4. Kolejność implementacji: split `declare_war_opts` → hak P4 + N2 sojusz/NAP + `ostatniePrzewinienieWobecNas` → wrapper gracza w kolejności webu → `break_treaties_on_war` z `breaker_is_player`/`bez_kary` i karą (przez `_with_params`) → `ownerDeclareWarOn` (`force`, `cause`, `human`) → `applyAllianceObligationsOnWar` (osobny dispatch).
5. Baza: `git merge-base --is-ancestor a01363d5f HEAD` w worktree implementacyjnym (w tym runie HEAD nie był potomkiem `a01363d5f`; odczyty Rust szły przez `git show a01363d5f`, więc rozpoznanie nie jest tym dotknięte).

## 4. Decyzje człowieka

Brak. Wszystkie punkty rozstrzyga web (CLAUDE.md zasada 11); wybory techniczne (split `declare_war_opts`, nośnik P4, parametry `ownerDeclareWarOn`, `_with_params`) idą do `dyspozycje/rust-port/REJESTR-RUST.md`. Pytania ABC: 0.

## 5. Werdykt

PASS-WITH-NOTES. Rozpoznanie jest rzetelne co do statusów; poprawki redakcyjne i zakresowe z §2 są wiążące i przenoszone do dispatchu #171. Commity dotykają wyłącznie katalogu runu.
