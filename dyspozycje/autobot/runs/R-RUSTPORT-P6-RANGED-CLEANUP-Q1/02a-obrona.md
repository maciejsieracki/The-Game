# 02a — Obrona Operatora — R-RUSTPORT-P6-RANGED-CLEANUP-Q1 (runda 1/5)

STATUS: PASS-WITH-NOTES (obrona; kod bez zmian)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-RANGED-CLEANUP-Q1
GOAL: obrona zarzutów Evaluatora wobec commita 1943362b8 (baza a8210a4f2).
SHA kodu broniony: 1943362b8c932228c73732d04717a2f496ba7739
ZMIANY/COMMIT: ten plik (02a-obrona.md) to jedyna zmiana tej rundy; kod nie zmieniony.
TESTY: dowody statyczne (git show / git grep / git ls-tree na 1943362b8), bez ponownej kompilacji.
BLOKADY: brak.
RUNDY: 1/5 (obrona Operatora, HAIKU).
NASTĘPNY KROK: Final Control (Evaluator: PASS bez poprawek kodu).
DEPLOY/PUSH: NIE WYKONANO.

## Odpowiedzi na zarzuty

### Z1 (drobny): p6_repin_dystans_formulas.rs „spoza dispatchu”
ODRZUCAM jako naruszenie; PRZYJMUJĘ uwagę o nieprecyzyjnym opisie.
- Dowód: dispatch, linia „Allowlista”, wprost wymienia `rust-port/engine/tests/{p6_repin_dystans_petla.rs, p6_repin_dystans_formulas.rs, p6_ranged_damage_nan.rs, p6_combat*.rs}`. Plik JEST na allowliście.
- Dowód: zmiany w formulas są wyłącznie typowe (import i wywołanie na `ranged_shot_damage_f64`, `as f64` na wartościach oczekiwanych z JSON, literały `9` -> `9.0`). Żadna wartość oczekiwana nie została zmieniona (`git diff a8210a4f2 1943362b8 -- rust-port/engine/tests/p6_repin_dystans_formulas.rs`: wszystkie hunki zachowują wartości liczbowe).
- Uwaga procesowa: zdanie dispatchu „ZMIENIONE ASERCJE tylko w p6_repin_dystans_petla.rs i p6_ranged_damage_nan.rs” dotyczy zmian WARTOŚCI asercji. W formulas zmieniona jest tylko forma typu. Zatem zmiana jest zgodna z celem, a w 01-operator-r1.md wystarczy czytać „plik spoza dwóch wymienionych w zdaniu o zmianie wartości”; sam plik jest na allowliście.

### Z2 (drobny): usunięte asercje wariantu i64 (NaN -> 1, Infinity -> i64::MAX), usunięta pętla „wariant i64”; zmiana wartości NaN w polu damage (0 -> is_nan)
PRZYJMUJĘ opis zmian; ODRZUCAM zarzut „osłabienia pokrycia”.
- Asercje NaN -> 1 i Infinity -> i64::MAX testowały funkcję `ranged_shot_damage(i64)`, którą GOAL nakazuje usunąć. Mapowanie NaN -> 1 było właśnie rozjazdem z pinem (pin: NaN propaguje). Nie ma odpowiednika do zachowania, bo wariant przestaje istnieć.
- Pokrycie f64 zostaje: w `p6_ranged_damage_nan_wektory_z_pinu_zgodne` wektory pinu (asercje startowe `rows.len() >= 200`, `nan_expected >= 20`, `inf_expected >= 20`) są sprawdzane przez `ranged_shot_damage_f64`: gałąź `exp.is_nan()` -> `got.is_nan()`, gałąź `else` -> `assert_eq!(got, exp)`. Ta druga obejmuje Infinity i wartości skończone. Dodatkowo `p6_ranged_damage_nan_jawne_przypadki_js` zachowuje asercję f64: `ranged_shot_damage_f64(None, None, f64::INFINITY, 0.0, 1.0) == f64::INFINITY`.
- Pętla „wariant i64” (`got_i as f64 == exp` dla skończonych |exp| < 9e18) była duplikatem gałęzi `assert_eq!(got, exp)` dla tych samych wektorów: stary `ranged_shot_damage` = `ranged_shot_damage_f64` rzutowane na i64, więc dla całkowitego `exp` w zakresie i64 `got_i as f64 == got`. Brak utraty pokrycia.
- Zmiana wartości NaN (pole damage: 0 -> is_nan): pole zmieniło typ na f64 i przenosi wartość pinu (dawne `damage_exact`). Dawna asercja „NaN -> 0” testowała właśnie zniekształcenie, które ma usunąć `damage_exact_to_i64`. Asercja `s.damage_exact.is_nan()` z tego samego testu zostaje jako `s.damage.is_nan()`. Zmiana uzasadniona typem, opisana w 01-operator-r1.md (punkt „ZMIANA WARTOŚCI”).
- Asercja w teście miss: `s.damage == 0` -> `s.damage == 0.0` (typ; wartość była już 0.0 w `damage_exact`).

### Z3 (informacyjny): p6_combat_harness bez targetu = NIE_ZMIERZONO; brak #[ignore] w zmienionych plikach; jedyny #[ignore] w engine poza diffem; brak zależności od W8 i innych użyć
PRZYJMUJĘ jako stan faktyczny (bez zmian w kodzie).
- Dowód: `git ls-tree -r --name-only 1943362b8 | grep -i p6_combat` -> brak plików. Bramka p6_combat_harness pozostaje NIE_ZMIERZONO, nie PASS.
- Dowód: `git grep -n '#\[ignore' 1943362b8 -- rust-port` -> w rust-port/engine tylko `tests/p6_order_lane.rs:1530` (poza diffem); pozostałe w rust-port/renderer (poza zakresem).
- Dowód: `git grep 'ranged_shot_damage('` oraz `damage_exact` w 1943362b8 -> brak pozostałych wołań poza testami; jedyne trafienie to nazwa testu `p6_repin_dystans_petla_uses_ranged_shot_damage`. `git grep 'RangedShot\b|resolve_ranged_phase'` -> użycia tylko w combat.rs i w testach.
- Zakres: „brak zależności od W8” sprawdzone wyłącznie dla tych symboli; inne moduły nie były badane.

### Z4 (informacyjny): routing HP bez zmian
PRZYJMUJĘ; potwierdzone.
- Dowód: w `rust-port/engine/src/domain/combat.rs` (1943362b8, ok. linii 1184 i 1216) `defender.hp -= damage_exact;` oraz `attacker.hp -= damage_exact;` pozostają bez zmian; hunk diffu dotyka tylko literału `RangedShot { damage: ... }`, nie logiki HP.

### Z5 (informacyjny): bramki odtworzone przez Evaluatora
PRZYJMUJĘ jako potwierdzenie. Brak zarzutu do obrony.

## Wynik obrony
- Żaden zarzut nie został uznany za naruszenie dispatchu. Z1 odrzucony (plik na allowliście); uwagi o opisie przyjęte i wyjaśnione powyżej.
- Kod nie zmieniony. SHA kodu do integracji (FC): 1943362b8c932228c73732d04717a2f496ba7739.
