# DISPATCH R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1 (runda 1) — rozpoznanie wejść fazy zwarcia `resolveCombat` (#135 / #167) i zależności COMBAT-RESOLVE-PAIR

DOMENA: GAME (odczyt). MODEL: HAIKU (Operator, Obrona), SONNET (Evaluator, Final Control) — reguła projektu dla silnika.
TRYB: WYŁĄCZNIE ODCZYT. Nie pisz kodu, nie uruchamiaj cargo, nie zmieniaj `rust-port/` ani `gra/`. Jedyny zapis: `dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1/` (jawny `git add`).
BAZA: `origin/rust-port/parity-v2` = `474487792` (zapisz SHA w raporcie). Pin: `07d2fbd72` (`gra/src/battle/combat.ts`, `gra/src/battle/battleScene.ts`, tylko odczyt, `git show 07d2fbd72:<plik> | sed -n 'A,Bp'`).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## CEL
Dwa tematy czekają na to samo: #135/#167 (wejścia fazy zwarcia przed pętlą dystansu) oraz `R-RUSTPORT-COMBAT-RESOLVE-PAIR` (produkcyjny resolver pary dla ścieżki E4 „Pomiń”, dziś wstrzyknięty traitem `InstantPairResolver`; odblokowuje #113, #246, #248). Zanim cokolwiek zostanie zaplanowane, potrzebna jest mapa: co `resolveCombat` robi przed pętlą dystansu i jakie ma wejścia/wyjścia.

## ZAKRES
1. `gra/src/battle/combat.ts` `resolveCombat` (pin ok. `:842-1251`): wypisz kolejność kroków **przed** pętlą dystansu i pętlą zwarcia, z plik:linia każdego kroku i wejściem/wyjściem.
2. Dla każdego kroku: odpowiednik w Rust (`rust-port/engine/src`, `git grep`), klasyfikacja PORT-JEST / BRAK / UI.
3. Opisz sygnaturę wejścia (struktury jednostek, opcje, log) potrzebną, by `combat::resolve` (`rust-port/engine/src/domain/combat.rs:381`, model z HP u32, bez opcji i bez logu — stwierdzony w FC `ce433a07f`) mógł zostać zastąpiony portem `resolveCombat`. Zaproponuj typy.
4. Wskaż, które wektory pinu są już pokryte (`tests/` z `combat`/`harness`, nazwy plików) i które brakują dla #135/#137.
5. Zaproponuj podział na tematy (#135 wejścia, #137 NaN/Inf w amunicji, RESOLVE-PAIR) z allowlistami.

## KRYTERIA KOŃCA
1. Raport `01-rozpoznanie.md` z tabelą kroków (pin plik:linia | klasyfikacja | odpowiednik Rust plik:linia | uwagi).
2. Odtwarzalne polecenia `git grep` w raporcie.
3. Sekcja „Propozycja podziału” z kolejnością, allowlistami i jawnym wskazaniem, czy RESOLVE-PAIR może ruszyć przed #135.
4. Commit tylko w `dyspozycje/autobot/runs/R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZP-Q1/`, bez push do parity.
