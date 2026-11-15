# 02a OBRONA OPERATORA — R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1 (etap a, #104)
GOAL: odpowiedź na 5 zarzutów Evaluatora (02-evaluator.md, commit lokalny 97e88fbc7).
ZMIANY/COMMIT: BRAK zmian kodu w tej rundzie. Kod Operatora nietknięty: **4b2cdd8a4** (wip/R-RUSTPORT-P6-ZLOZE-WIRE-WAR-BREAK-A-Q1). Ten plik jest jedyną zmianą obrony.
TESTY: NIE_ZMIERZONO w tej rundzie (brak zmian kodu; bramki EXIT 0 z 01-operator-r1.md i odtworzone przez Evaluatora zgodnie z 02-evaluator.md).
BLOKADY: pozycje odłożone do etapu b opisane niżej w pkt 1, 2, 4; decyzja orkiestratora w pkt 4 i 5.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o pkt 4 (karencja WspolnaWalkaBarbarzyncy: dług etapu b albo nowe pole stanu w tym etapie) i o pkt 5 (Co-Authored-By); potem FC.
DEPLOY/PUSH: NIE WYKONANO.

Wszystkie odwołania do pina: `07d2fbd72`. Ścieżki pina podane jako plik:linia po sprawdzeniu w tym SHA.

---

## Zarzut 1 — rozbieżność `formed_turn` vs `zawartaTura` (wiek nieznany) — PRZYJMUJĘ jako dług etapu b (bez zmiany kodu)

Dowód pina:
- `gra/src/game/diplomacy-penalty-preview.ts:~158` `treatyAgeTurns`: gdy `zawartaTura` brak lub `turn` nieznany, zwraca `undefined`.
- `tradeTreatyBreakPenaltyFree` (ten sam plik) zwraca `false` przy wieku `undefined` — stara umowa bez pola jest traktowana Z karą.

Dowód Rust:
- `rust-port/engine/src/domain/diplomacy.rs:1484-1485`: `#[serde(rename = "zawartaTura", alias = "formed_turn")] pub formed_turn: u32`. Brak `#[serde(default)]` na polu i brak `#[serde(default)]` na strukturze `ActiveDeal` (linia ~1477).
- `rust-port/engine/src/` nie zawiera domyślnej wartości dla `formed_turn` (grep: tylko `diplomacy.rs` linie 1484-1485, 1515-1530 (konstruktor `ActiveDeal::new`), 3947, 4331).

Wniosek: Evaluator opisał ryzyko „Rust uzna starą umowę za bez kary". W tym diffie to NIE zachodzi: brak pola w zapisie daje błąd deserializacji, a nie cichy wiek 0 ani 10+. Realna rozbieżność jest inna i jest zgodna z zarzutem w części „pin nie": pin ładuje umowę z nieznanym wiekiem i nalicza karę; Rust tego stanu nie reprezentuje (zawsze ma `formed_turn`, a brak pola odrzuca load). Polityka migracji starych zapisów bez `zawartaTura` nie jest zdefiniowana w tym etapie.

Decyzja: dług etapu b, wpis do rejestru (proponowany tekst do `dyspozycje/rust-port/REJESTR-RUST.md` przez orkiestratora, bo ten plik poza allowlistą):
> ZLOZE-WIRE-WAR-BREAK-A: `ActiveDeal.formed_turn` (`diplomacy.rs:1485`) jest nieopcjonalne, pin `treatyAgeTurns` (`diplomacy-penalty-preview.ts:~158`) ma wiek nieznany (`undefined` → kara). Stary zapis bez `zawartaTura` w Rust = błąd load, w pinie = kara. Do rozstrzygnięcia w etapie b (migracja zapisu albo `Option<u32>` + gałąź kary) z wektorem dla przypadku wieku nieznanego.

Dlaczego nie dodaję teraz testu: test „brak pola → błąd" utrwaliłby zachowanie, którego polityka nie jest jeszcze ustalona. Wektor wieku nieznanego wymaga zmiany typu pola, czyli zmiany poza tym etapem.

---

## Zarzut 2 — generator pomija rozejm; trzy rodzaje handlowe złączone w Rust — PRZYJMUJĘ część 2 jako notatkę, ODRZUCAM część o rozejmie jako defekt tej funkcji

**Rozejm (ODRZUCAM jako defekt):**
- Pin `gra/src/game/diplomacy-treaties.ts:392-403` (`BREAK_ON_WAR`) nie zawiera żadnego rodzaju rozejmu. Grep `rozejm|truce` w `gra/src/game/diplomacy-treaties.ts`: 0 trafień.
- Rozejm w pinie to osobny mechanizm: `gra/src/game/diplomacy-pn-engine.ts:86-95` pole `truceUntilTurn` (pary, nie wpis w `activeDeals`). `treatiesBrokenByWar` (`diplomacy-treaties.ts:417-424`) iteruje wyłącznie po `activeDeals` dla pary, więc rozejm nigdy nie trafia do tej ścieżki również w pinie.
- Rust: rozejm to `ProposalAction::Truce` (`diplomacy.rs:2857`, `:3195`, `:3275`), nie `TreatyKind`. Nie wchodzi do `break_treaties_on_war`.
- Wniosek: wektory bez rozejmu są kompletne dla tej funkcji. Brak pokrycia „wojny z rozejmem" dotyczy bramki wypowiedzenia wojny (`truceUntilTurn`, N1/N6), która jest poza etapem a. Odnotowuję jako pozycję etapu b (bramka wojny przy aktywnym rozejmie), nie jako błąd generatora.

**Trzy rodzaje handlowe (PRZYJMUJĘ jako notatkę o równoważności):**
- Pin `BREAK_ON_WAR` (`diplomacy-treaties.ts:400-402`): `UmowaHandlowa`, `UmowaSzlakow`, `UmowaWymiany` — identycznie.
- Pin `isHandelTreatyKind` (`diplomacy-penalty-preview.ts:65-70`): te same trzy — identycznie dla kary.
- Rust: alias `umowa_handlowa` → `TradeRoute` (`diplomacy.rs` enum `TreatyKind`, ~1407); `breaks_on_war` obejmuje `TradeRoute | Exchange` (`alliance_war_obligation.rs:245-246`); `trade_treaty_break_penalty_free` używa `TradeRoute | Exchange` (`diplomacy.rs:4329-4332`).
- Wektory generatora zawierają wszystkie trzy rodzaje (Evaluator). Złączenie jest zachowaniem równoważnym dla obu funkcji. Ryzyko: przy przyszłej zmianie pina rozdzielającej te rodzaje Rust trzeba będzie rozbić. Notatka do rejestru, bez zmiany kodu.

---

## Zarzut 3 — 117 przypadków dobrowolnych z `turn < zawartaTura` — ODRZUCAM (brak defektu)

- Pin `treatyAgeTurns` (`diplomacy-penalty-preview.ts:~158`): `Math.max(0, turn - zawarta)` → wiek 0.
- Rust `trade_treaty_break_penalty_free` (`diplomacy.rs:4331`): `turn.saturating_sub(deal.formed_turn)` → 0.
- Oba dają wiek 0 dla `turn < formed`, więc wynik jest identyczny. Granice 9/10 pokryte: `rust-port/engine/tests/p6_zloze_break_war_a.rs:231-257` (`trade_penalty_free_boundary_is_ten_turns`).
- Zarzut sam oznacza „nieblokujące". Bez zmian.

---

## Zarzut 4 — karencja `WspolnaWalkaBarbarzyncy` po dobrowolnym zerwaniu — PRZYJMUJĘ jako znany brak etapu a; decyzja orkiestratora

Dowód pina:
- `gra/src/main.ts:22741-22774` (`breakTreatyVoluntarily`): po `removeTreatiesById` i `deactivateZlozeGrantsForDeal` blok R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1 wywołuje `recordBarbarianCooperationGrace` (`gra/src/game/diplomacy-barbarian-cooperation.ts:104`).
- Wykrycie traktatu: `d.wspolnaWalkaBarbarzyncy === true` (`gra/src/game/diplomacy-border-march.ts:146-147`) lub rodzaj `WspolnaWalkaBarbarzyncy`.
- Rust: brak odpowiednika. Grep `barbarian.*grace|karencj` w `rust-port/engine/src` nie trafia w domenę dyplomacji (tylko `BarbarianCooperation` w `alliance_war_obligation.rs:244`). Nie ma pola stanu karencji w `DiplomacyState`.

Ocena: to odstępstwo od GOAL, bo karencja to stan gry, a nie zdarzenie UI (GOAL wyłącza tylko kary wiarygodności i zdarzenia UI). Operator zadeklarował je jako NIE_ZROBIONE w BLOKADACH 01-operator-r1.md, ale zakres GOAL-u to dopuszcza tylko częściowo.

Koszt przyjęcia do etapu b: brak pola stanu, więc nowe pole w `DiplomacyState` i nowy zapis stanu są poza allowlistą etapu a (allowlista: tylko nowe metody w `diplomacy.rs`).

Decyzja do orkiestratora (rekomendacja: A):
- A (rekomendowane): zaakceptować jako dług etapu b z wpisem do rejestru. Uzasadnienie: etap a pozostaje czysty i bez zmian stanu; karencja wymaga pola i wiringu, czyli etapu b, który i tak musi dotknąć stanu produkcyjnego.
- B: otworzyć rundę 2 z jawnym dopuszczeniem pola `barbarian_cooperation_grace` w `DiplomacyState` i testem wektorowym dla pina. Wada: poszerza allowlistę już w etapie a i miesza domenę z wiringiem.

---

## Zarzut 5 — procesowo: commit bez Co-Authored-By — ODRZUCAM jako defekt operatora (zgodne z dispatchem); konflikt do rozstrzygnięcia

- Dispatch (00-dispatch.md, „RAPORT I COMMIT"): „Treść commita bez nazwy modelu; ostatnia linia `Claude-Session: ...`". Commit `4b2cdd8a4` jest zgodny z tą instrukcją.
- Konflikt: nagłówek sesji wymaga linii `Co-Authored-By` z nazwą modelu. Dispatch tego zakazuje. Oba nie dają się pogodzić w jednym commicie.
- Nie zmieniam commita `4b2cdd8a4`: przepisanie zmieniłoby SHA, na którym Evaluator zbudował `97e88fbc7`, i złamałoby kontrolę `git merge-base --is-ancestor`.
- Ten plik (commit obrony) również nie zawiera nazwy modelu, zgodnie z dispatchem. Decyzja, która reguła wygrywa, należy do orkiestratora.

---

## Podsumowanie

| # | Zarzut | Odpowiedź | Zmiana kodu |
|---|---|---|---|
| 1 | formed_turn vs wiek nieznany | PRZYJMUJĘ jako dług etapu b | brak |
| 2 | rozejm / trzy rodzaje handlowe | rozejm ODRZUCAM jako defekt funkcji; złączenie PRZYJMUJĘ jako notatkę | brak |
| 3 | turn < zawartaTura | ODRZUCAM (wynik identyczny) | brak |
| 4 | karencja barbarzyńska | PRZYJMUJĘ; decyzja orkiestratora (rek. A: dług etapu b) | brak |
| 5 | Co-Authored-By | ODRZUCAM jako defekt (zgodne z dispatchem); konflikt do decyzji | brak |

Kod Operatora: **4b2cdd8a4**. Bramki: bez zmian od 01-operator-r1.md (EXIT 0), NIE_ZMIERZONO ponownie w tej rundzie.
