# P6-REPIN-ROZEJM — tabela luk: rozejm 5/10/15 (REPIN web FALA 605)

Temat: R-RUSTPORT-REPIN-DYPLOMACJA-ROZEJM-5-10-15-Q1, runda 1.
Baza: `rust-port/parity-v2` = 43f4064b0. Web (wzorzec): `origin/main` = 638e90bea (FALA ≤606, kod e7bf8acc8).
Źródło weba: `gra/src/game/diplomacy-peace-lock.ts` (sekcje rozejmu r3–r6), próg siły: `gra/data/diplomacy-war-peace-params.json` → `przewagaMilitarna` (prog 0.20, epsilon 1e-9).

## 1. Tabela luk (pomiar 2026-11-11)

| # | Element weba | Odpowiednik w porcie (plik:linia) | Status | Uwagi |
|---|---|---|---|---|
| L1 | `TRUCE_DURATION_OPTIONS` 5/10/15, `TRUCE_DEFAULT_TURNS` 10 | `rust-port/engine/src/domain/diplomacy_truce.rs:31-33` | ZGODNE | stałe identyczne |
| L2 | `normalizeTruceDuration` (Z9: długość spoza 5/10/15 → null) | `diplomacy_truce.rs:142` (`normalize_truce_duration`) | ZGODNE (moduł) | NIE podpięte w ścieżce propozycji (patrz L9) |
| L3 | `truceUntilTurn` / `isTruceActive` / `truceExpiryAction` / `isTruceBreach` | `diplomacy_truce.rs:155-189` | ZGODNE | testy: `tests/p6_dyplomacja_truce_aggressor.rs` (14 passed) |
| L4 | `truceEndAiAccepts` — przyjęcie pokoju wg SIŁY (proponujący ≤ 80% adresata; 0 vs 0 = odmowa; adresat ≤0 = odmowa) | brak w porcie → NOWE: `rust-port/engine/src/domain/diplomacy_truce_end.rs` (`truce_end_ai_accepts`, `truce_end_ai_accepts_default`) | DODANE w tej rundzie | granica 20% włącznie (`<=`), eps 1e-9 jak w webie |
| L5 | `truceEndOfferTarget` (adresat = strona NIE-inicjator; brak inicjatora → brak) | NOWE: `diplomacy_truce_end.rs` (`truce_end_offer_target`) | DODANE | |
| L6 | `truceEndOfferExpired` (timeout = `currentTurn > offerTurn`) | NOWE: `diplomacy_truce_end.rs` (`truce_end_offer_expired`) | DODANE | |
| L7 | `isTruceWindowBreach` (aktywny rozejm LUB oferta pokoju) | NOWE: `diplomacy_truce_end.rs` (`is_truce_window_breach`) | DODANE | przyjmuje `has_end_offer: bool` zamiast obiektu meta (ZAŁOŻENIE: adaptacja typu) |
| L8 | (C) rozejm = 0 Zaufania (pokój stały +5 bez zmian) | NIE_ZMIERZONO w porcie (nie szukano ścieżki zmiany Zaufania przy zawarciu) | OTWARTE | do weryfikacji w kolejnej rundzie |
| L9 | Z8 kara w oknie oferty; Z9 zła długość = odrzucenie propozycji; zawarcie rozejmu (`startTruce`) w ścieżce `apply_accepted_proposal` | NIE_ZMIERZONO (brak wywołań `truce_until_turn`/`normalize_truce_duration` poza modułem `diplomacy_truce.rs`; `grep` po `rust-port/engine/src`) | OTWARTE | wymaga podpięcia w `diplomacy.rs` (poza zakresem r1 — allowlista addytywna) |
| L10 | (E) AI wybiera tryb rozejm vs pokój (`aiTruceOrPeaceMode`: zmęczenie, willingness, zaufanie, słabszy) | NIE_ZMIERZONO w porcie (grep `ai_truce_or_peace` — brak) | OTWARTE | |
| L11 | (G) kontroferta zmienia długość 5/10/15 | NIE_ZMIERZONO (UI/main; poza domeną) | OTWARTE | |
| L12 | Moc wojskowa = `sumArmyMForOwner` (nominalna) | parametr `proposer_army_m` / `addressee_army_m` podawany przez wywołującego | ZAŁOŻENIE | port nie liczy armii; wartości wchodzą jako `f64` (ZAŁOŻENIE-R5-A z webu) |

## 2. Wektory testowe

Plik: `rust-port/engine/tests/p6_repin_rozejm_koniec.rs` (9 testów, wszystkie PASS).
Wektory wyprowadzone z formuły weba, NIE z uruchomienia weba: próba `node --experimental-strip-types` na
`diplomacy-peace-lock.ts` nie powiodła się (import bez rozszerzenia `.ts` w `diplomacy-war-peace-profile`) →
**uruchomienie weba = NIE_ZMIERZONO**. Do zrobienia w rundzie 2 (bundler/esbuild, generator w katalogu runu).

Pokryte przypadki: 0 vs 0 (odmowa), adresat 0 (odmowa), granica 80% (przyjęcie) / 80.001% (odmowa) / 100% (odmowa),
NaN/Infinity/ujemne (odmowa), adresat propozycji (dwie strony + brak inicjatora), timeout oferty (`>`),
okno złamania (rozejm aktywny / oferta / brak), długości 5/10/15 i zła 7 (Z9 na poziomie modułu).

## 3. Odstępstwa i ZAŁOŻENIA

- ZAŁOŻENIE-P1: moduł `diplomacy_truce_end.rs` jest addytywny (allowlista `diplomacy*.rs`), nie zmienia `diplomacy.rs`.
- ZAŁOŻENIE-P2: prog/epsilon przepisane jako stałe `PRZEWAGA_PROG = 0.20`, `PRZEWAGA_EPSILON = 1e-9` (zgodne z JSON weba).
- ZAŁOŻENIE-P3: `truce_end_offer_target` / `is_truce_window_breach` używają generycznych typów zamiast `PlayerId`/`DiploPairMeta` (logika bez zmian).
- Panel web używa wariantu Effective (`sumArmyMForOwnerEffective`), decyzja używa nominalnej — port wybiera wartości przez parametr (rozbieżność do akceptacji, jak w webie).

## 4. Następny krok (runda 2 / kolejne tematy)

1. Podpiąć L2/L9 (Z9, Z8, zawarcie rozejmu) w ścieżce propozycji `diplomacy.rs` — wymaga poszerzenia allowlisty lub osobnego tematu.
2. L8 (Zaufanie 0 przy rozejmie), L10 (wybór trybu AI), L11 (kontroferta) — osobne tematy po decyzji właściciela (ABC nie zadawane przez Operatora).
3. Wygenerować wektory z uruchomionego weba (NIE_ZMIERZONO w tej rundzie).
