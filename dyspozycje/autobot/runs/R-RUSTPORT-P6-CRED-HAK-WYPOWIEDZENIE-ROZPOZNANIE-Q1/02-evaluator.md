# 02-evaluator — R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1
GOAL: adwersarialna weryfikacja raportu Operatora `01-rozpoznanie.md` (tabela web ↔ Rust dla `playerDeclareWarOnOwner`, `breakTreatyVoluntarily`, `breakTreatiesOnWar`).
ZMIANY/COMMIT: tylko ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1/02-evaluator.md`). Zero zmian w `gra/`, `rust-port/`. Zero cargo/npm. Bez push.
TESTY: NIE_DOTYCZY (tryb odczytu). Metoda: `git show 07d2fbd72:...` (web) i `git show` / `git grep a01363d5f` (Rust), zrzuty do scratchpadu.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Final Control; zarzuty 1–2 do uwzględnienia w dispatchu wdrożeniowym (#171), zarzuty 3–5 to poprawki redakcyjne raportu.
DEPLOY/PUSH: NIE WYKONANO

## 1. Zakres commitu Operatora

`git show --stat bce250d70` = dokładnie 1 plik: `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1/01-rozpoznanie.md` (+133). Nic poza katalogiem runu; zero `gra/`, `rust-port/`. Treść commitu bez nazwy modelu, ostatnia linia `Claude-Session`. POTWIERDZONE. (Commit leżał na gałęzi innego worktree; w tym worktree wciągnięty `git merge --ff-only`, rodzic = `807ecebdd`, bez rozjazdu.)

## 2. Próba 5+ wierszy tabeli (otwarte linie web i Rust)

| Wiersz | Web | Rust (a01363d5f) | Werdykt |
|---|---|---|---|
| A1–A3 (guardy gracza) | `main.ts:13152–13163`: `isPeaceLockedBetween` (def. `:11817`) → `diplomacyLayerForOwner` → `playerDiplomacyActionAllowed(layer,'war')`; `diplomacy-layers.ts:272` i `:399` istnieją | `is_peace_locked_between` `brake_inputs.rs:35`, jedyny produkcyjny wołający `peace_locked_set` `:54` (→ `turn_war_pipeline.rs:325`); `git grep` po `diplomacy_layer\|player_diplomacy_action\|diplomacyLayerForOwner` w `rust-port` = 0 trafień; `bridge.rs` bez `diplo/war/treaty/peace` | POTWIERDZONE |
| A4 (`chargeWarDeclarationCredibility`) | `main.ts:12176–12225`: N2 sojusz/NAP, N1 okno rozejmu, `ostatniePrzewinienieWobecNas`, P4 (`:12222–12223`) | `declare_war_opts` `diplomacy_truce_flow.rs:247`; `CREDIBILITY_EVENT_TRUCE_BREACH = "zlamanie_paktu_nap"` `:43`; brak N2 sojusz/NAP z umów, brak przewinienia, brak P4; `declare_war`/`declare_war_opts` bez wołających w produkcji (grep) | POTWIERDZONE (z zastrzeżeniem, zarzut 1) |
| A5 + C (`breakTreatiesOnWar`) | `main.ts:23688–23702`, `bezKary` `:23697`, `zlamana_obietnica(_ai)` `:23698`; wołający `:11705` (bezKary), `:13169`, `:13206`, `:23809`, `:40442`, `:41932` | `break_treaties_on_war` `diplomacy.rs:1690` (doc „poza zakresem: kara, bezKary"); `BrokenPromiseByPlayer/Ai` w enumie; 0 wołających | POTWIERDZONE (C6 off-by-one: `ownerDeclareWarOn` → `breakTreatiesOnWar` jest w `:13206`, raport `:13207`) |
| A8 | `diplomacy.ts:1899`, `:2017`, `:2022` (przyczyna / maCasusBelliAktywne / zarejestruj) | `diplomacy_aggressor.rs:104`, `:304`, `:309`; 0 wołających (grep) | POTWIERDZONE |
| B4 (`voluntaryTreatyBreakPlan`) | `diplomacy-penalty-preview.ts:192–200`: `openN3Window = !penaltyFree && wygasaTura===null`, `n5Charged = !penaltyFree && wygasaTura!==null` | `voluntary_treaty_break_plan` `diplomacy.rs:4336`: ta sama formuła; `isHandelTreatyKind` (Handlowa/Szlaków/Wymiany) ↔ `TradeRoute\|Exchange` (alias `umowa_handlowa` → `TradeRoute` `:1404`) — równoważne | POTWIERDZONE (numery linii pomocnicze błędne, zarzut 3) |
| B9 (`zerwanie_handlu_bez_kary`) | `main.ts:22788`, `diplomacy.ts:891`, `:1075`, `diplomacy-factors.ts:79` | `DiplomaticEvent` ma tylko `zerwanie_handlu` (`:586`) i `zerwanie_traktatu` (`:588`); brak wariantu | POTWIERDZONE |
| B1–B3, B5–B8, B11–B14 | `main.ts:22741–22803` przeczytane w całości; N3 `:22762`, N5 `:22768`, karencja `:22785`, fallback `pokoj` `:22791`; wołający `:24774`, `:25579` | `break_treaty_voluntarily` `diplomacy.rs:1708` (doc „poza zakresem" N3/N5/relacja/karencja); `N3Window` `diplomacy_truce.rs:37–49` | POTWIERDZONE |
| „P4 wołane" | — | `note_war_entered` `credibility.rs:855` woła tylko `note_war_declarations` (`turn_war_dipl_steps.rs:898`), a ten `run_war_turn` (`turn_war_pipeline.rs:422`) i `declare_forced_wars` (`war_turn_declare.rs:116`); nie woła go `declare_war_opts` | POTWIERDZONE (pośrednio, nie bezpośrednio jak w raporcie) |

Żadnego wiersza nie obalono co do istoty (BRAK/CZĘŚCIOWO). Zarzuty poniżej dotyczą pominięć i nieścisłości.

## 3. Zarzuty (ponumerowane)

1. **Kolejność i podwójne zastosowanie relacji (A4/A7, istotne dla dispatchu #171).** W webie `chargeWarDeclarationCredibility` NIE zmienia relacji (`main.ts:12176–12225`); `DeclareWar` jest nakładane dopiero PO `breakTreatiesOnWar` i `applyAllianceObligationsOnWar` (`:13169–13175`). `declare_war_opts` (`diplomacy_truce_flow.rs:247–269`) nakłada `DiplomaticEvent::DeclareWar` i `set_relation` WEWNĄTRZ funkcji, przed jakimkolwiek zerwaniem traktatów. Raport w A4 wpisuje to jako „zrobione: relacja DeclareWar", a §2 pkt 4 podaje web-ową kolejność, ale nigdzie nie flaguje, że wpięcie `declare_war_opts` 1:1 zmieni kolejność (kara `zlamana_obietnica` liczona od relacji, która już jest wojną) lub zdubluje `DeclareWar` (A7 wymaga osobnego `apply_diplo_event_tracked`). Brakuje rekomendacji: rozdzielić efekt relacji z `declare_war_opts` albo nie wołać A7 drugi raz — decyzja techniczna do REJESTR-RUST, ale trzeba ją nazwać.
2. **NIE_ZMIERZONO zawyżone: `ownerDeclareWarOn` (§5 pkt 1, A13 „Różnica strukturalna").** Funkcja ma 40 linii (`main.ts:13197–13235`) i jest w pełni czytelna statycznie: `force` czyści `peaceUntilTurn`, bez `force` cichy guard `isPeaceLockedBetween`, potem TEN SAM łańcuch co u gracza (charge → break(`isMe(attacker)`) → alliance → relacja → `zarejestrujWypowiedzenie(cause ?? przyczyna…)`), a porządki (prune/record) są warunkowe `isMe(...)`. Dispatch #120 obejmuje wprost `declare_forced_wars`/klaster, więc ścieżka AI/force jest częścią tematu; raport zostawia ją jako „nie analizowano". Różnice względem gracza (brak guardu warstw, `cause` wstrzykiwana, warunkowe porządki) powinny być w tabeli, nie w NIE_ZMIERZONO.
3. **Błędne numery linii w Rust (`diplomacy.rs`).** B2 cytuje `:4300` dla `is_trade` — faktycznie `:4330`; B4 cytuje `trade_treaty_break_penalty_free` `:4326` — faktycznie `:4329`; stała `TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS` `:4319` — faktycznie `:4306`. `:4336` (plan), `:4272`, `:4292`, `:1690`, `:1708` poprawne. `BrokenPromise*` cytowane `:552/:554` to linie atrybutów serde, warianty są w `:553/:555`. Wniosek nietknięty, ale implementator zgubi się przy skoku do linii.
4. **Sformułowanie „0 wołających" bez rozróżnienia (§2 pkt 9, A4c).** Raport podaje, że `note_war_entered` jest wołane „z `turn_war_dipl_steps.rs:898` i `war_turn_declare::declare_forced_wars`". Pierwsze to ciało pętli w `note_war_declarations`, drugie wywołuje `note_war_declarations` (`war_turn_declare.rs:116`), nie `note_war_entered` bezpośrednio. Poprawna wersja: jedyny bezpośredni wołający = `note_war_declarations`; ścieżki: hamulec (`turn_war_pipeline.rs:422`) i `declare_forced_wars`. Nie wpływa na wynik, ale w dispatchu implementacyjnym ma znaczenie, gdzie dopiąć wywołanie dla gracza.
5. **Pytania ABC = 0 bez zbadania rozbieżności typowo-technicznych (§4).** Teza „web rozstrzyga wszystko" jest słuszna dla zasad gameplay, ale raport nie sprawdził, czy P4 w ścieżce gracza ma wektory pinu (§5 pkt 9, `p6_cred_wojna*`) ani wartości N2/N3/N5 (§5 pkt 2). Skoro to rozstrzygalne `git show` na pinie (`_diplomacyParams`, `diplomacy-params`), pozostawienie jako NIE_ZMIERZONO jest dopuszczalne dla rozpoznania, ale powinno wejść do dispatchu implementacyjnego jako warunek wstępny (bez wartości liczbowych nie da się napisać testu wektorowego). Nie zarzut o błędzie, tylko o niedomknięciu.

## 4. Czego NIE znaleziono

- Nie znaleziono wiersza z błędnym statusem BRAK/OK. Zero trafień dla `diplomacyLayerForOwner`, `playerDiplomacyActionAllowed`, `pruneTributeNegotiationsBetween`, `recordWarDeclarationEvent`, `pruneInvalidNegotiations`, `applyDiploEventTracked`, `chargeWarDeclarationCredibility` (snake_case) w `a01363d5f:rust-port` potwierdzone `git grep`.
- Nie znaleziono naruszenia granic: tylko `dyspozycje/autobot/runs/…`, bez `gra/`, bez `rust-port/engine`, bez `rust-port/renderer`, bez push.

## 5. Werdykt

PASS-WITH-NOTES: tabela jest rzetelna co do statusów (5+ wierszy zweryfikowanych na liniach web i Rust, żaden obalony); commit czysty. Zarzuty 1–2 powinny trafić do dispatchu implementacyjnego, 3–4 to poprawki redakcyjne, 5 to warunek wstępny.
