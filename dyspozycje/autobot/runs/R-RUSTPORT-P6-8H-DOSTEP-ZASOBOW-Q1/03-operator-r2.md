# R-RUSTPORT-P6-8H-DOSTEP-ZASOBOW-Q1 - Operator r2 (odpowiedz na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8H-DOSTEP-ZASOBOW-Q1
GOAL: niezależne potwierdzenie partii A (zloto, cyna, zelazo, kultura miasta w `domain/resource_access.rs`) po odpowiedzi na zarzuty Evaluatora (verdict PASS-WITH-NOTES, 5 zarzutow). Zakres tematu bez zmian: partia A.
BAZA ODTWORZONA Z: `cef80101c` (commit Operatora r1). Pin web: `91dc998a`. Baza parity-v2: `74b81339e`.

## Odpowiedzi na zarzuty

Zarzut 1 (ryzyko trim niepelne: U+FEFF i U+0085) - PRZYJMUJE.
- Poprawka: `is_js_trim_char` = `c.is_whitespace() && c != '\u{0085}' || c == '\u{FEFF}'` (zbior JS `trim`), uzyta w `hex_zloze_normalized` zamiast `trim()`.
- Wektory: w generatorze dodano `HEXES.trimZlozy` (U+FEFF, U+0085, NBSP+FEFF+LS) i `PLACED.trimPlaced`; cztery pliki JSON zregenerowane z `git archive 91dc998a` (Node 22, loader 8J bez zmian). `society.json` bez zmian.
- Dowod pelny, nie tylko wektory: `js_trim_set_matches_v8_for_all_code_points` sprawdza kazdy code point 0..=0x10FFFF bez surogatow (1 112 064 wartosci) przeciw zbiorowi wyliczonemu przez V8 (Node 22): 25 code pointow, 10 przedzialow (0009-000D, 0020, 00A0, 1680, 2000-200A, 2028-2029, 202F, 205F, 3000, FEFF). Ryzyko trim jest zamkniete dla calego Unicode, nie tylko dla U+FEFF/U+0085.
- Mutanty: M49 (Rust trim), M50 (bez FEFF), M51 (bez wykluczenia NEL) - wszystkie zabite (M49 przez 3 testy, w tym test wszystkich code pointow).
- Commit: `2f19b1217` (kod, test, wektory, generator).

Zarzut 2 (`js_clamp_unit` dla -0.0 zwraca -0.0, JS daje +0) - PRZYJMUJE.
- Poprawka: `js_clamp_unit` zwraca `+0.0`, gdy wynik clampu ma wartosc zero (`if v == 0.0 { 0.0 }`).
- Dowod: `node` (V8): `Object.is(Math.max(0, Math.min(1, -0)), 0) === true`. Test `culture_share_clamp_boundaries_and_negative_zero` sprawdza `is_sign_positive()` dla -0.0, -1e-300, -1.0, 0.0 oraz granice 1-EPS / 1 / 1+EPS.
- Mutant M52 (usuniecie normalizacji) zabity przez ten test.
- Wektory JSON nie odroznia -0 od 0 (JSON), dlatego znak zera sprawdza test jednostkowy, a nie wektor.
- Commit: `2f19b1217`.

Zarzut 3 (higiena logow: pusta linia przed `EXIT=0`, pierwszy log bez tresci) - PRZYJMUJE.
- Pusta linia przed `EXIT=` pochodzila z konca wyjscia cargo (linia odstepu przed podsumowaniem doctestow). Logi r1 (`gate-v2-*`) zostawiam jako slad audytowy, ale ich nie zaliczam jako dowodu.
- Logi r2 (`logs/gate-r2-*.txt`) generowane filtrem awk, ktory usuwa wylacznie PUSTE LINIE NA KONCU WYJSCIA przed `EXIT=` (puste linie wewnatrz zostaja). Kazdy plik konczy sie linia `EXIT=<kod>`, bez pustej linii na koncu.
- Pierwszy log r1 (`gate-v2-cargo-test-full-engine.txt`) zawiera 252 wyniki `test result: ok` i cala tresc cargo; to nie jest pusty log. Puste bylo jedynie podsumowanie 0 testow binarki doctestow (zgodnie z wyjsciem cargo).

Zarzut 4 (zakres: otwarte symbole 8H, `resource-access.ts` etykiety i `collectActiveAccess`, `isForeignReligionDominant`, `isPlayerCapitalCity`, `stolicaEasyBonusActive`, wywolujacy w webie, tabela symboli w dokumencie tematu) - ODRZUCAM jako zadanie do tego tematu, PRZYJMUJE jako stan faktyczny.
- Dowod zakresu: GOAL tego tematu to niezalezne potwierdzenie partii A (zalecenie orkiestratora). Symbole 8H-P1b/8H-P2 pozostaja otwarte i wymagaja osobnego dispatchu (Operator r2 z partia 8H-P1b).
- Tabela symboli per status: dokument `P6-8-MIASTA-PODZIAL.md` lezy na `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, a nie na `parity-v2` (ustalone w r1). Nie aktualizuje go tutaj, bo wymaga commitu na galezi zlecenia.
- ZALOZENIE: aktualizacja tabeli §8H nalezy do tematu 8H-P1b, nie do tej partii.

Zarzut 5 (`mutacje/run.py` z zahardkodowana sciezka `-806-1`, skrypt nieodtwarzalny) - PRZYJMUJE.
- `run.py`: sciezka silnika wyliczana wzgledem polozenia skryptu (5 poziomow w gore do korzenia repo) albo z `P6_8H_ENGINE`; kopia oryginalu w `tempfile.mkdtemp`; wynik zapisywany obok skryptu jako `wynik-4-<RUN_TAG>.txt`; sprawdzenie stanu bazowego przed startem (przerwanie, gdy zrodlo nie jest bazowe); obsluga SIGTERM przez `finally` (zrodlo zawsze wraca do oryginalu).
- `mutants_v2.py`: zahardkodowana sciezka zastapiona katalogiem skryptu.
- `mutants_r2.py` (nowy): baza `mutants_v2` z poprawionymi tekstami M25/M26/M35/M36 oraz nowe M49-M52.
- Incydent procesowy (zapisany dla audytu): pierwsze uruchomienie r2 zostalo przerwane przez `timeout` (SIGTERM bez `finally`), co zostawilo w zrodle mutant M30 (`foreign_pct < 0.0`). Wykryte przez porownanie z `git diff`, przywrocone recznie do `<= 0.0`, a wyniki M30-M41 uzyskane przez ten incydent odrzucone i powtorzone na czystej bazie. Wyniki zaliczone: tylko przebiegi z czystej bazy (wynik-4-r2-52.txt, wynik-4-r2f.txt). Naprawa SIGTERM zapobiega powtorzeniu.
- Commit: docs w commicie ponizej (zawiera `run.py`, `mutants_v2.py`, `mutants_r2.py`).

## Testy i bramki (worktree `wf_340cae56-806-4`, HEAD = `2f19b1217` przed commitem dokumentacji)

Target: `CARGO_TARGET_DIR=/dev/shm/p6-8h-r2`, `CARGO_INCREMENTAL=0`, `CARGO_PROFILE_DEV_DEBUG=0`, `CARGO_PROFILE_TEST_DEBUG=0`.

- `logs/gate-r2-fmt-check.txt`: `cargo fmt --check`, EXIT=0.
- `logs/gate-r2-cargo-test-p6-8h-access.txt`: 13 passed, 0 failed, EXIT=0 (w tym `js_trim_set_matches_v8_for_all_code_points` i `culture_share_clamp_boundaries_and_negative_zero`).
- `logs/gate-r2-clippy-all-targets.txt`: `cargo clippy --all-targets -- -D warnings`, EXIT=0.
- `logs/gate-r2-cargo-test-full-engine.txt`: pelny `cargo test` silnika, 252 wyniki `test result: ok`, 0 FAILED, EXIT=0.
- `git diff --cached --check`: EXIT=0 (przed commitem kodu).
- rustfmt na zmienionych plikach: EXIT=0.

## Mutacje (52 mutanty, `mutacje/mutants_r2.py`)

- Zbior r2 (`mutacje/wynik-4-r2-52.txt`, 52 linie): 48 KILLED, 4 SURVIVED (M03, M30, M32, M33), bez duplikatow i bez BLAD-DOPASOWANIA.
- Po dodaniu testu wszechstronnego trim powtorzono: survivory M03, M30, M32, M33 (nadal przezyte, rownowazne) i M49-M52 (zabite) - `mutacje/wynik-4-r2f.txt`.
- Survivory (rownowaznosc z kodu, bez zmian wzgledem r1):
  - M03: `any()` na pustej kolekcji daje `false`.
  - M30: `foreign_pct <= 0.0` zmienione na `< 0.0`. Dla `foreign_pct == 0` obie galezie daja `[owner 100]`; wynik identyczny.
  - M32: pusty klucz nie jest rowny zadnej stalej porownania.
  - M33: przy `hex=None` migracja nie zwraca `kopalnia_cyny` ani `kopalnia_zelaza`.
- Pokrycie galezi sterujacych: kazdy `if`/`match` w `resource_access.rs` ma mutant albo wskazany dowod rownowaznosci (`mutants_v2.py` + `mutants_r2.py`).
- Granice N-1/N/N+1: clamp [0,1] (test granic), trim (wszystkie code pointy), progi kopalni/odlewni w wektorach.

## Tabela statusow (partia A)

| Symbol / grupa | Status |
|---|---|
| zloto (`zloto-access.ts`) - `resolveOwnerZlotoFromStock`, `ownerCanFeedMennica`, `countKopalnieZlota`, grace/deduct | zamkniete, wektory + mutacje |
| cyna (`cyna-access.ts`) - `hasCynaAccess`, kopalnia na zlozu, odlewnia | zamkniete, wektory + mutacje (trim pelny) |
| zelazo (`zelazo-access.ts`) - `hasZelazoAccess`, kopalnia na zlozu, odlewnia | zamkniete, wektory + mutacje (trim pelny) |
| kultura miasta (`society-inputs.ts`) - `resolveOwnCultureShare`, `cultureMixBreakdown` | zamkniete, wektory + mutacje (clamp -0 zamkniety) |
| `resource-access.ts` (etykiety, `collectActiveAccess`, `getCityResourceAccessForCity`, `getResourceAccessForCity`) | OTWARTE - 8H-P1b |
| `isForeignReligionDominant`, `isPlayerCapitalCity`, `stolicaEasyBonusActive`, wywolujacy w webie | OTWARTE - 8H-P1b / 8H-P2 |

## BLOKADY

- Poza partia A (zob. zarzut 4): symbole 8H-P1b i 8H-P2 nieotwarte w tym temacie.
- Tabela §8H w `P6-8-MIASTA-PODZIAL.md` nieaktualizowana (dokument na innej galezi).
- Rezydualne ryzyko trim: zamkniete dla calego Unicode dla zbioru WhiteSpace/LineTerminator w V8 (Node 22). Zalozenie: zbior trim w przegladarce uzytkownika jest ten sam (ECMAScript od ES5 stabilny dla tych code pointow).

## RUNDY

2/5 (r1: pomiary bez FAIL; r2: poprawki zarzutow 1, 2, 3, 5 z dowodem, zarzut 4 jako zakres).

## NASTEPNY KROK

Operator r3 / partia 8H-P1b: reszta `resource-access.ts`, `isForeignReligionDominant`, `isPlayerCapitalCity`, `stolicaEasyBonusActive`, z wektorami z pinu `91dc998a`, mutacjami na kazdej galezi sterujacej, potem clippy, pelny `cargo test`, `git diff --check`. Niezaleznie: Evaluator r2 na commitach `2f19b1217` i commicie dokumentacji.

DEPLOY-PUSH: NIE WYKONANO
