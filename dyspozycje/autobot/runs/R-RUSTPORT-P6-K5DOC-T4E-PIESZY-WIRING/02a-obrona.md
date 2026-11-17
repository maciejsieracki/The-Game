STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING (T4e-0, runda 2, obrona Operatora HAIKU)
GOAL: obrona Operatora wobec zarzutów Evaluatora r2 (BLOCK INFRA / brak kodu / poza allowlistą / wektory / brak e2e).
BAZA: origin/rust-port/parity-v2 = 760be5187 (worktree wf_da078251-322-3 przełączony detached na 760be5187; wcześniej stał na d44d5b982, czyli NIE na bazie r2 — stan z r2 był nieprawdziwy).
ZMIANY/COMMIT: tylko ten plik (02a-obrona.md). Kod nie został zaaplikowany do drzewa ani skompilowany. Patch wip-r2-nieskompilowane.patch sprawdzony `git apply --check` na 760be5187: OK (bez zapisu do drzewa).
TESTY: NIE_ZMIERZONO (bramki fmt/clippy/test/--all-targets i mutacje a/b/c nie uruchomione: dysk poniżej progu, patrz zarzut 1).

## Odpowiedzi na zarzuty

1. BLOCK INFRA, dysk 6,5 GB < 8 GB.
   PRZYJMUJĘ. Stan sprawdzony teraz: `df -h /` → Avail 5.0G (Size 252G, Used 34G, Use% 88%). Stan jest gorszy niż podano w zarzucie (6,5 GB) i poniżej progu 8 GB z dispatchu. Bramek nie uruchamiałem (zgodnie z dispatchem: bez uruchamiania na pół). Poprawka po mojej stronie niemożliwa bez zwolnienia miejsca; orkiestrator decyduje o sprzątaniu (nie kasuję cudzych katalogów; /tmp/claude-0 należy do innych sesji).

2. Brak kodu w drzewie (commit a60791ba2 zawiera tylko raport i patch).
   PRZYJMUJĘ jako fakt. Kod istnieje wyłącznie jako patch `wip-r2-nieskompilowane.patch` (+493). Dowód: `git apply --check` na 760be5187 przechodzi, czyli patch jest spójny z bazą. Kompilacja i testy nie zostały wykonane. Poprawka w r3: `git apply` + bramki (wymaga ≥ 8 GB).

3. Mutacje a/b/c nie wykonane.
   PRZYJMUJĘ. Wykonanie wymaga kompilacji (dysk, pkt 1). Dodatkowo mutacja (c) w obecnej formie nie ma sensu do czasu naprawy pkt 8 (koszt per mounted nie jest zaimplementowany).

4. Zmiana poza allowlistą: trait `MoveTerrain` w `siege_tactics_move_effects.rs`.
   ODRZUCAM jako naruszenie zakazu, PRZYJMUJĘ jako odstępstwo formalne od literalnej allowlisty wymagające zgody orkiestratora.
   Dowód: dispatch D1 wprost nakazuje „wprowadź trait `MoveTerrain` w `siege_tactics_move_effects.rs`”, a sekcja NIE ROBIĆ zabrania zmian w tym pliku tylko „poza ich publicznym API”. Patch dla tego pliku ma wyłącznie dodania (hunk `@@ -49,6 +49,22 @@`: 6 linii kontekstu, +16, bez usunięć). Zakres: nowy trait, bez zmiany istniejących sygnatur `MoveWorld`/`do_move_effects`.
   Prośba do orkiestratora: potwierdzić zgodę na dodanie tej jednej definicji traitu do allowlisty r3 (wpis w REJESTR-RUST.md).

5. Wektory wpisane ręcznie, brak generatora `p6_k5doc_t4e_gen.mjs` i katalogu `p6_k5doc_t4e_vectors/`; wartości niezweryfikowane z pinem.
   PRZYJMUJĘ częściowo. Brak generatora i katalogu wektorów to fakt (allowlista r1/r2 je przewidywała jako NOWE, nie zostały dodane). Sprawdziłem wartości z pinem `07d2fbd72`:
   - klamp kosztu kroku `Math.max(1, Math.min(_moveCostForUnit(...), 99))` — pin `battleScene.ts` ok. :8704 i :8737 (linie w komentarzu patcha `:8699-8700` / `:8726-8728` są przesunięte; poprawię w r3);
   - `moveLeft = Math.max(0, moveLeft - stepCost)` — pin ok. :8746;
   - bród: `wadingFord = isFordTile(old) || isFordTile(new)`, `stepCost = enterCost / BROD_RUCH_MULT`, `BROD_RUCH_MULT = BROD.ruchMult = 0.5` (pin :983). Patch zgodny (`do_move_effects` sprawdza `is_ford(old) || is_ford(new)`), więc wartość /0,5 jest poprawna.
   - koszt 10−2 = 8 i Infinity→99: zgodne z klampem pinu.
   W r3: wektory przenieść do pliku `p6_k5doc_t4e_vectors/*.json` z generatorem `p6_k5doc_t4e_gen.mjs` (generator odczytuje wartości wpisane z `plik:linia` pinu) albo jawnie uzasadnić brak generatora w rejestrze.

6. `update_facing` w adapterze no-op (#107).
   PRZYJMUJĘ jako fakt i ograniczenie. Dowód: w patchu `fn update_facing(&mut self, _unit_id: &str) {}` w `ProdMoveWorld`. Test kolejności (`kolejnosc_occ_przed_facing`) używa własnego `TestWorld` z rejestrem wywołań, więc sprawdza kolejność wewnątrz `do_move_effects`, nie efekt w produkcji. Mutacja (c) jest wykrywalna na poziomie `do_move_effects` przez ten test; efekt facing w ProdBody pozostaje do #107 (poza zakresem T4e-0). Opisane w raporcie r3.

7. Brak wiringu `AdvanceDecision::Move` → `move_step` i brak testu end-to-end tury pieszego.
   PRZYJMUJĘ. Dowód: patch ma `ProdBody::move_step` → `do_move_effects`, ale nie ma ścieżki z `advance_step_decide` (`AdvanceDecision::Move`). Kryterium końca 1 wymaga testu e2e, którego brak. Uwaga do decyzji orkiestratora: r2 pisze „wiring AdvanceDecision::Move to T4e-1”, a D4 mówi „wiring ruchu w jednej ścieżce (krok → do_move_effects)”. Te dwa zapisy są sprzeczne; r3 wykona wiring, o ile orkiestrator potwierdzi, że D4 obejmuje go w T4e-0. Jeśli nie — trzeba zmienić zakres kryteriów końca.

8. Koszt ruchu per jednostka (mounted vs piechota) nie zaimplementowany.
   PRZYJMUJĘ. Dowód: pin `_moveCostForUnit` (`battleScene.ts:7436-7443`): `if (!ru.mounted) return base; mult = cavalryTerrainMultiplier(...); if (!isFinite(mult)) return Infinity; return base * mult`. Patch: `MoveWorld::move_cost(col,row)` nie dostaje jednostki, a `ProdMoveWorld::move_cost` zwraca tylko `self.terrain.move_cost(col,row)`. Trait `MoveTerrain::cavalry_mult` istnieje, ale nie jest wołany — koszt kawalerii = piechoty. To błąd względem decyzji orkiestratora „koszt per jednostka”.
   Poprawka w r3: `ProdMoveWorld` dostaje pole `mounted: bool` (ustawiane z jednostki przy każdym ruchu); `move_cost` zwraca `base * cavalry_mult` dla mounted, `Infinity` gdy mnożnik nieskończony. Testy: ta sama komórka dla piechoty i kawalerii daje różny koszt; mutacja (c) = koszt stały bez rozróżnienia mounted.

9. Brak `#[ignore]` i osłabionych asercji nie dało się ocenić.
   PRZYJMUJĘ częściowo. Dowód: `grep '#\[ignore\]'` na patchu — 0 trafień (potwierdzone). Asercje nie zostały ocenione, bo kod nie był skompilowany; ocena po kompilacji w r3.

10. Następny krok: zwolnienie dysku do ≥ 8 GB, potem r3.
    PRZYJMUJĘ. Decyzja orkiestratora (sprzątanie). Plan r3 po zwolnieniu dysku: na 760be5187 `git apply` patcha → poprawki z pkt 5, 7, 8 → fmt, clippy `-D warnings`, `cargo test --test p6_k5doc_t4e`, `--all-targets` w tle → mutacje a/b/c z kopią i zerowym diffem → commit jawnym `git add` bez `Cargo.lock`, bez push do parity.

## Dodatkowe ustalenia
- Worktree przed tą obroną stał na d44d5b982 (nie na 760be5187 jak w r2). Przełączony detached na 760be5187 bez zmian w plikach.
- Trailery commitów: bez nazwy modelu (decyzja #289 / dispatch), mimo ogólnej reguły sesji o Co-Authored-By.
- Brak push. Brak zmian w `gra/`, `renderer/`, `view-model/`, `Cargo.lock`.

## Wnioski dla orkiestratora (do zgody)
1. Zgoda na dodanie `MoveTerrain` w `siege_tactics_move_effects.rs` do allowlisty r3 (pkt 4).
2. Rozstrzygnięcie granicy T4e-0/T4e-1 dla wiringu `AdvanceDecision::Move` (pkt 7).
3. Koszt per jednostka wchodzi do T4e-0 (pkt 8), bo D4 go wymaga.

RUNDY: 2/5 (obrona r2 → przejście do r3 po zwolnieniu dysku).
NASTĘPNY KROK: zwolnić dysk ≥ 8 GB; wtedy runda r3 tego samego ID na bazie 760be5187.
DEPLOY/PUSH: NIE WYKONANO.
