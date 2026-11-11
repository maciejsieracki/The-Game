STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1 (W6, Operator r3, dodatek r3: zarzuty 1 i 4 z FC r2)
GOAL: podpiac w `ai_diplomacy_turn.rs` helpery z zarzutu 1 i zrobic adapter `tick_pair` -> relationScore (zarzut 4), z wektorami z pinu 07d2fbd72.
BAZA: `4c92ee0a7` (kod obrony r1). Worktree detached, bez zmian w kodzie. Pin webu: `07d2fbd72f758705f8e1d59cc4968027ffbafe75`.
SHA: brak commita z kodem (ten raport jest jedyna zmiana). SHA raportu: patrz nazwa commita na gałęzi roboczej.
LOC: `ai_diplomacy_turn.rs` = 234 (bez zmian).

## Zarzut 1 — BLOCK (przeslanka dispatchu nieprawdziwa w webie)

Dispatch zaklada, ze lock / brame oblezenia / cooldown `miasto_za_pokoj` / oferte miasta za pokoj wola sie w fazie tury
`runDiplomacyTurnTick` (galaz brake). W pinie `07d2fbd72` tak nie jest. Zmierzone `git grep` / `git show`:

- `runDiplomacyTurnTick` = `gra/src/main.ts:24229`. W zakresie 24229–24400 (sprawdzony) NIE MA wywolan
  `resolveDiplomacyActionLock`, `siegeAllowedBetween`, `autoSiegeCandidateForScan`, `isOfferRejectedOnCooldown`,
  `recordRejectedOffer`, `decideAIDiplomacy`.
- Faktyczne miejsca uzycia w pinie:
  - `resolveDiplomacyActionLock`: `gra/src/game/diplomacy-audience-actions.ts:83` (akcje audiencji), komentarz `main.ts:25124` (blokady akcji stolu, sciezka gracza).
  - `isOfferRejectedOnCooldown`: `main.ts:20272`; `recordRejectedOffer`: `main.ts:20656` (obsluga ofert, nie tura brake).
  - `siegeAllowedBetween` / `autoSiegeCandidateForScan`: `main.ts:17504, 17984, 18027, 18045, 18156, 18209, 36735` (oblezenie / walka / skan auto-oblezenia).
  - oferta miasta za pokoj (`AI_MIASTO_*`, `decide_city_offer`): blok `decideAIDiplomacy` w `gra/src/game/ai.ts:6818` (okolice 6714–6794), nie tura brake.
- Numery z dispatchu (`11115`, `19371`, `19749`, `40413`) nie wskazuja tych funkcji w pinie (11115 = rozmieszczenie rywali, 40413 = snapshot panelu imperium).

Wniosek: podpiecie czterech helperow do `run_brake_phase` zmieniloby zachowanie wzgledem webu (nie byloby 1:1 z `runDiplomacyTurnTick`).
Zrobienie tego po cichu = zmiana zakresu, czego dispatch zabrania. Nie wprowadzono zmian.

Propozycja do decyzji orkiestratora (nie moja):
- (a) wyjac z GOAL W6 te cztery punkty i przydzielic je osobnym tematom: blokady/cooldown/oferta miasta -> sciezka AI-propozycji (`ai.ts decideAIDiplomacy` + `main.ts` obsluga ofert), bramka oblezenia -> temat walki/oblezenia. Kazdy z osobna transkrypcja i wektorami z pinu;
- (b) albo zapisac W6 jako zakres „faza brake + tick pary” i przeniesc reszte do W8 (z jawnym wpisem zaleznosci).

## Zarzut 4 — NIE ZREALIZOWANO w tej rundzie (wymaga osobnej rundy z wektorami)

- Web: `tickDiploAiAiPairsWithBrake` = `main.ts:11734`; tick pary to `main.ts:11738`:
  `tickDiplomacy(cur, buildDiplomacyTickCtxForPair(a, b))`, potem `diploBrakeCrisisStep(a, b)`.
  Tick dotyczy par AI<->AI; pary gracz<->AI maja tick w innym miejscu (`main.ts:41361`, poza zakresem W6).
- `buildDiplomacyTickCtxForPair` = `main.ts:22849` czyta stan swiata: `activeDeals` (handel szlakowy, pokoj tier), kontakt,
  religie i krag kulturowy, wiarygodnosc (`getWiarygodnosc`), flagi brake (`diploBrakeBonusFlags`). Faza Rust nie ma tych
  danych na wejsciu, wiec pelny TickContext nie da sie zbudowac w `ai_diplomacy_turn.rs` bez nowego adaptera swiata (poza zakresem W6 albo W8).
- Adapter wąski (mozliwy w tym temacie): `relation_after_tick` z `DiplomacyState::tick_pair` (`diplomacy.rs:1658`) + `relation_score_with_params` (`diplomacy.rs:508`), TickContext podany przez wywolujacego.
- Wektory: `tickDiplomacy` to `gra/src/game/diplomacy.ts:1810`. Modul importuje `data/diplomacy.json`, `diplomacy-aggressor-params.json`,
  `difficulty-cost`, `civ-matrix`, `barbarians`, `diplomacy-credibility`, `diplomacy-war-peace-profile`. Generator z pinu dla tego modulu NIE zostal zbudowany
  i NIE jest zweryfikowany. Dlatego nie dopisano kodu adaptera (kod bez wektorow weba = niedozwolony wg kryterium 1).

## TESTY

- `cargo fmt --check`, `cargo clippy`, `cargo test --lib`, `cargo test --test p6_wire_war_diplo`: NIE_ZMIERZONO.
  Powod: nie zmieniono kodu Rust, wiec bramki nie byly uruchamiane w tej rundzie. Build nie był potrzebny do tej decyzji.
- Weryfikacja przeslanek: `git grep` i `git show 07d2fbd72:...` (wyniki powyzej).

## ALLOWLISTA / ZAKAZY

- Zmienione pliki: wylacznie `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1/02b-operator-r3.md`.
- Nie dotykano `gra/**`, `origin/main`, `rust-port/parity-v2`, `Cargo.toml`, `Cargo.lock`, `WERSJE.md`, `REJESTR-PROSB-I-ZADAN.md`.
- Nie pushowano, nie integrowano.

## BLOKADY

1. Zarzut 1: przeslanka dispatchu niezgodna z pinem (dowody powyzej). Wymagana decyzja orkiestratora: (a) lub (b).
2. Zarzut 4: brak generatora wektorow `tickDiplomacy` z pinu i brak zrodla danych dla `buildDiplomacyTickCtxForPair` w fazie Rust.
3. Numery linii w dispatchu dla wektorow (`11115, 19371, 19749, 40413`) nie odpowiadaja wskazanym funkcjom w pinie.

RUNDY: 3/5 (Operator r3, zuzyte rundy 1–3 tematu; ostatni werdykt FC r2 = FAIL, zarzuty 1 i 4)
NASTĘPNY KROK: decyzja orkiestratora o podziale zakresu (zarzut 1, opcje a/b) i osobna runda dla adaptera tick_pair z generatorem wektorow `tickDiplomacy` z pinu. Nie wznawiac Operatora na obecnym GOAL bez zmiany zakresu.
DEPLOY/PUSH: NIE WYKONANO
