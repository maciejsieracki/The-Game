STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-Q1
GOAL: Odpowiedź Operatora (obrona) na zarzuty Evaluatora r1. Każdy zarzut: PRZYJMUJĘ albo ODRZUCAM, z dowodem.
ZMIANY/COMMIT: Tylko ten plik (02a-obrona.md). Zero zmian kodu Rust, zero zmian w gra/. Baza obrony: 2846a48f2 (raport Operatora r1, BLOCK). SHA commitu obrony: patrz sekcja końcowa.
TESTY: NIE_ZMIERZONO. Brak zmian kodu, więc bramki cargo (fmt, clippy, test --lib, nowy test) nie były uruchamiane. Dowody poniżej to git grep / git show na SHA 23e33793e i 07d2fbd72.
BLOKADY: Brak nowych. Potwierdzony BLOCK z kryterium 5 dispatchu (patrz Z1).
RUNDY: 1/5 (obrona r1)
NASTĘPNY KROK: Orkiestrator decyduje: nowy dispatch z komendą wypowiedzenia wojny gracza w EngineCommand i wołającym declare_war_opts, potem hak P4 (patrz Z6). Ten temat na tym dispatchu nie ma kolejnej rundy kodowej.
DEPLOY/PUSH: NIE WYKONANO

---

## Odpowiedzi na zarzuty

### Z1. BLOCK potwierdzony niezależnie przez git grep na 23e33793e
PRZYJMUJĘ.

Dowody (wykonane na SHA 23e33793e, `git grep` w `rust-port/engine/src` i `rust-port`):
- `declare_war` (diplomacy_truce_flow.rs:239) i `declare_war_opts` (diplomacy_truce_flow.rs:247). Jedyny wołający `declare_war`/`declare_war_opts` poza definicją to `rust-port/engine/tests/p6_repin_rozejm_silnik.rs:223,239,253,264,269,277,282` (testy). Brak wołającego w `engine/src`.
- `EngineCommand` (rust-port/engine/src/bridge.rs:26) ma warianty CreateSession, AddPlayer, SelectUnit, MoveUnit, AdvanceTurn, GetState i kolejne. Brak wariantu wypowiedzenia wojny (grep `declare|wojna|war` w bridge.rs nie trafia nic poza EngineCommand).
- `note_war_entered` (credibility.rs:855) wołany tylko z `turn_war_dipl_steps.rs:895`, czyli w `note_war_declarations` (turn_war_dipl_steps.rs:876). Ta funkcja jest wołana z `turn_war_pipeline.rs:422` (wojna z hamulca AI) i z `war_turn_declare.rs:116` (`declare_forced_wars`).
- `declare_from_assignments` (war_turn_declare.rs:141) wołany wyłącznie z testów (`p6_cred_wojna_forced.rs:58`, `p6_wire_war_declare.rs:99`, `p6_wire_war_declare_peace.rs`). Brak wołającego w produkcji. Stąd `declare_forced_wars` także nie ma produkcyjnego wejścia.
- `charge_war_declaration`: brak trafień w `rust-port`.

Wniosek: kryterium 5 dispatchu jest spełnione. Hak P4 nie został dodany jako martwy wrapper.

### Z2. Pin potwierdzony na 07d2fbd72: wywołania chargeWarDeclarationCredibility
PRZYJMUJĘ, z doprecyzowaniem.

Dowód: `git show 07d2fbd72:gra/src/main.ts` (lokalna kopia, grep `chargeWarDeclarationCredibility`). Trafienia:
- 12176: definicja funkcji
- 13168: `ME(), ownerId` (wypowiedzenie gracza)
- 13205: `attackerId, defenderId` (wypowiedzenie gracza, wariant z truceBreachNow)
- 23806: `allyId, mustDeclareWarOn` (sojusz, w `joinAllyToWar`, linie 23800-23808)
- 40441: `csOwnerId, ME()` (klaster państw-miast, w pętli `clusterDowOwners`)
- 41931: `ownerId, targetId` (wojna AI, `truceBreachAi`)

Doprecyzowanie: w pinie są 5 wywołań, nie 4. Dispatch wymienia 4 miejsca w 3 ścieżkach (gracz 13168/13205, sojusz 23806, klaster 40441). Wywołanie 41931 (wojna AI) nie jest na liście dispatchu, ale ma produkcyjne wejście Rust przez `note_war_declarations`. Numery linii z dispatchu są zgodne z pinem.

### Z3. Bramki cargo nie były uruchamiane; NIE_ZMIERZONO bez kodu
PRZYJMUJĘ jako fakt, odrzucam jako defekt.

Diff obrony względem bazy 23e33793e zawiera wyłącznie `01-operator-r1.md` (raport BLOCK). Nie ma kodu do weryfikacji, więc bramki `fmt`, `clippy`, `test --lib` i nowy test nie mają czego sprawdzać. Zgodnie z kryterium 5 dispatchu BLOCK zapada przed implementacją. Brak `#[ignore]`, brak osłabionych asercji, brak zmian poza allowlistą (zero zmian kodu). Zależność W8 r4 w `siege_transfer.rs:84` jest istniejąca i poza zakresem, zgodnie z oceną Evaluatora.

### Z4. Niespójność terminologii „trzech z czterech ścieżek”
PRZYJMUJĘ.

Poprawne sformułowanie: pin ma cztery ścieżki wojny (gracz, sojusz, klaster, AI) z pięcioma wywołaniami (patrz Z2). Dispatch obejmuje trzy z nich (gracz, sojusz, klaster). Ścieżka AI (41931) ma produkcyjne wołanie haka przez `note_war_declarations`. Zatem w zakresie dispatchu brakuje wołania dla trzech ścieżek: gracz, sojusz, klaster. Raport r1 napisał to niejasno. Bez wpływu na werdykt BLOCK.

### Z5. Słaby dowód braku odpowiednika klastra
PRZYJMUJĘ, z uzupełnionym dowodem.

Polecenia i wyniki na 23e33793e:
- `git grep -n -i -E 'resolve_cluster|cluster_city_state|clusterWarMembers|city_state.*war|ClusterDow|cluster_dow' 23e33793e -- rust-port/engine/src`: trafienia tylko w `domain/mapgen/cluster_compute.rs` i `cluster_layout.rs`, i to wyłącznie jako stałe generatora mapy (`cluster_city_state_max_hex`, `cluster_city_state_radius`). Brak odpowiednika `resolveClusterCityStateWarOnPlayer` (pin: `gra/src/game/city-state-difficulty.ts:116`, wołany w `main.ts` przy 40441).
- `git grep -i -E 'cluster|klaster' ... | grep -i -E 'war|wojn'` w `engine/src`: brak trafień dotyczących wojny klastra.
- Wniosek: w Rust nie ma ścieżki wojny klastra państw-miast. Hak P4 nie ma gdzie zostać podpięty bez nowej funkcji domenowej.

### Z6. Zadanie niewykonalne w obecnej formie (rekomendacja dla orkiestratora)
ODRZUCAM jako zarzut wobec Operatora. PRZYJMUJĘ jako rekomendację dla orkiestratora.

Zarzut nie wskazuje błędu w raporcie r1; wskazuje, że dispatch wymaga elementów, których nie ma w Rust. Zgadzam się z oceną. Dla decyzji orkiestratora potrzebne są osobne tematy:
1. Komenda wypowiedzenia wojny gracza w `EngineCommand` (bridge.rs) i wołający `declare_war_opts` (diplomacy_truce_flow.rs:247), z podpięciem haka P4 (pin 13168/13205).
2. Deklaracja sojusznika (pin 23806, `joinAllyToWar`). Brak po stronie Rust.
3. Wojna klastra państw-miast (pin 40441). Brak w Rust.
4. Wołanie `declare_from_assignments` w produkcji (`war_turn_declare.rs:141`, obecnie tylko testy). Bez tego `declare_forced_wars` nie ma produkcyjnego wejścia.

Kolejna runda Operatora na tym samym dispatchu nie ma sensu, bo kod zależy od tematów 1-4.

### Z7. Commit Evaluatora d9fd22087 (lokalny, bez push)
Nie jest zarzutem wobec Operatora. Potwierdzam, że obiekt istnieje lokalnie (`git cat-file -t d9fd22087` = commit). Nie przeglądałem jego zawartości poza tym.

---

## Podsumowanie
- Z1, Z2, Z4, Z5: PRZYJĘTE, z dowodami w tym pliku.
- Z3: PRZYJĘTE jako fakt (NIE_ZMIERZONO bez kodu), bez zmiany werdyktu.
- Z6: ODRZUCONE jako zarzut wobec Operatora, PRZYJĘTE jako rekomendacja dla orkiestratora.
- Z7: nie dotyczy Operatora.
- Werdykt Operatora r1 (BLOCK bez kodu, kryterium 5) pozostaje bez zmian.
