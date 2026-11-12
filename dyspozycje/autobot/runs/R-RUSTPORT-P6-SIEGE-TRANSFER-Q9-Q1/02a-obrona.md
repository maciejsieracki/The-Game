# Obrona Operatora r1 — R-RUSTPORT-P6-SIEGE-TRANSFER-Q9-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TRANSFER-Q9-Q1
GOAL: odpowiedź na zarzuty 1–4 z Evaluatora/Final Control dla commita Operatora def975d2f.
ZMIANY/COMMIT: poprawka testów długu (zarzut 2) w `rust-port/engine/tests/p6_siege_wonder_wrappers.rs` + ten plik; SHA commita obrony: patrz `git log -1` (nie można wpisać SHA commita do jego własnej treści).
TESTY: `rustfmt --check --edition 2021` na zmienionym pliku: exit 0 (po `rustfmt` w miejscu). `git diff --check`: exit 0. Pełne `cargo test`/`clippy` NIE_ZMIERZONO: df / = 6,7 GB wolnego, poniżej progu 8 GB z dispatchu przed bramkami; nie uruchamiałem kompilacji. Oczekiwane wyniki testów zweryfikowane ręcznie na kodzie `siege_wonder_watch.rs` (patrz zarzut 2).
BLOKADY: patrz odpowiedzi poniżej (zarzut 1 wymaga decyzji orkiestratora; zarzut 4 poza allowlistą).
RUNDY: 1/5 (obrona w rundzie 1)
NASTĘPNY KROK: Final Control rundy 2 (po decyzji orkiestratora w sprawie zarzutu 1 i po zwolnieniu dysku do ≥ 8 GB, żeby uruchomić bramki cargo na zmienionych testach).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 (istotny) — dług Q8 „NaN i liczby niecałkowite” zamknięty typem, nie wektorami

**Odpowiedź: PRZYJMUJĘ fakt, NIE rozstrzygam decyzji.**

- Fakt jest prawdziwy: typy wejściowe wrapperów to `i32` (`TransferableWonder`, `WonderTerritoryNode`, `turn`, `me_owner_id`), więc NaN, Infinity i liczby niecałkowite nie mogą wejść do funkcji. Wektory z pinu ich nie zawierają (generator nie emituje NaN/Infinity).
- Test `dlug_wejscia_sa_calkowite_i32` sprawdza tylko, że wektory nie zawierają takich wartości. Nie zamyka długu wektorowo, co dispatch wymagał.
- Operator nie ma kompetencji do wyboru między dwiema opcjami, które zmieniają zakres Q8:
  - (a) orkiestrator jawnie przyjmuje, że `i32` nie reprezentuje NaN/Infinity/niecałkowitych i dług jest zamknięty typem (obecny stan kodu, dokumentowany w komentarzu nagłówka testu, linie 11–13);
  - (b) zlecenie f64 w Q8 (osobny temat, zmiana typów `siege_wonder_watch.rs` i wrapperów).
- Nie zmieniałem kodu w tej sprawie.

### Zarzut 2 (drobny) — słabe testy ręczne `dlug_duplikaty_wonderid_pierwsze_dopasowanie` i `dlug_wartosci_skrajne_i32`

**Odpowiedź: PRZYJMUJĘ — poprawka w tym commicie.**

Potwierdzenie: w wersji def975d2f oba testy asertowały wyłącznie `transferred == 0`, czyli nie wykonywały przeniesienia. Nazwa „pierwsze dopasowanie” nie była pokryta.

Poprawka:
- `dlug_duplikaty_wonderid_pierwsze_dopasowanie`: dwa cuda o tym samym `wonderId` `"dup"`, oba właściciel 1, migawka PRZED z węzłem właściciela 1, PO z węzłem właściciela 2. Asercje: `events.len() == 2` (plan ma wpis dla każdego wystąpienia), `transferred == 1` (apply przenosi tylko pierwsze dopasowanie, zgodnie z `find` w `apply_wonder_transfers` i TS `applyWonderTransfers`), `wonders[0].owner_id == 2`, `wonders[1].owner_id == 1`, `ui_calls.len() == 3`.
- `dlug_wartosci_skrajne_i32`: dodatni przypadek `i32::MAX-1 → i32::MAX` z turą `i32::MAX` i `me_owner_id == i32::MAX`. Asercje: `transferred == 1`, właściciel cudu po przeniesieniu `i32::MAX`, zdarzenie z wariantem `mine`, linia logu zaczyna się od `[Cuda] Tura 2147483647:`. Ujemny przypadek: cud właściciela `i32::MIN` (nie-cywilizacja, `owner_id < 0`) przy niespójnej migawce → `transferred == 0`, właściciel bez zmian.
- Dowód ręczny (bez kompilacji, patrz TESTY): `plan_wonder_transfers` dla dwóch wpisów `dup` z `from=1,to=2` tworzy dwa wpisy planu; `apply_wonder_transfers` dla drugiego wpisu znajduje pierwszy `dup` (już właściciel 2 ≠ from 1) i pomija go. Dla `MAX-1` migawka PRZED = `Some(MAX-1)` = właściciel cudu, PO = `Some(MAX)`, `MAX ≥ 0` (cywilizacja), więc przeniesienie jest wykonane.
- Wektory z pinu (duplikaty z przeniesieniem w 28 przypadkach, skrajne i32 w 64) pozostają bez zmian i nadal pokrywają zgodność z TS.
- Zweryfikować kompilacją i testami w FC (bramki cargo NIE_ZMIERZONO w tej rundzie, patrz TESTY).

### Zarzut 3 (informacyjny) — `territoryOwnerAt` niezportowane, wrappery niewołane, zależność W8 tylko w komentarzu

**Odpowiedź: ODRZUCAM jako wymóg zmiany; fakty przyjmuję jako ograniczenie opisane jawnie.**

Dowody, że nie jest to ukryte:
- Nagłówek `rust-port/engine/src/domain/siege_wonder_wrappers.rs` (linie 9–10): `territory_owner_at` jest wstrzykiwany, port terytorium nie jest w tym klocku, wektory używają deterministycznego stubu z generatora.
- `rust-port/engine/tests/p6_siege_wonder_wrappers.rs` linia 24: stub `stub_owner_at` (opis w komentarzu).
- `rust-port/engine/src/domain/siege_transfer.rs` linie 55–59 i 91: wpisy `beginWonderTransferWatch` / `settleWonderTransfer` są `Ported` z adnotacją „NIE podpięty w apply_transfer”.
- Ta sama adnotacja w 01-operator-r1.md (zależność W8, nie podpinano).
- Dispatch: podpięcie w `apply_transfer` tylko gdy nie zmienia wyników Q3–Q8; w przeciwnym razie zależność W8 jawnie. Operator wybrał zależność jawną (nie podpinał) i odnotował ją w BLOKADACH.
- Wrappery nie są wołane przez kod produkcyjny: `grep` po `src` i `tests` (poza modułem wrapperów i jego testem) nie daje wywołań. Zgodne z opisem w BLOKADACH.

Nic nie zmieniam.

### Zarzut 4 (drobny, poza allowlistą) — nieaktualny wiersz w `siege_surrender.rs:37`

**Odpowiedź: PRZYJMUJĘ fakt; poprawka NIE w tym temacie (poza allowlistą).**

- Potwierdzenie: `rust-port/engine/src/domain/siege_surrender.rs` linia 37 nadal zawiera `| BRAK (wrapper) |` dla `beginWonderTransferWatch / settleWonderTransfer`, podczas gdy wrappery są teraz w `siege_wonder_wrappers.rs`.
- Allowlista dispatchu nie obejmuje `siege_surrender.rs`. Edycja w tym temacie złamałaby allowlistę. Zgodnie z sugestią zarzutu zostawiam poprawkę do osobnego tematu.
- Nie zmieniałem pliku.

## Pliki zmienione w tym commicie obrony

- `rust-port/engine/tests/p6_siege_wonder_wrappers.rs` (zarzut 2)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TRANSFER-Q9-Q1/02a-obrona.md` (ten plik)

Wszystkie pliki mieszczą się w allowliście. Brak zmian w `gra/`, `Cargo.toml`, `Cargo.lock`, `WERSJE.md`. Brak push i integracji.
