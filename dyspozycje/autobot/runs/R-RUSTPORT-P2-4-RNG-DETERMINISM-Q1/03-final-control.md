STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P2-4-RNG-DETERMINISM-Q1
GOAL: Zweryfikować zgodność RNG web (edb8fb56) vs `rust-port/engine` (`parity-v2` 9e33fc77).

RUNDY: 1/5 (Operator → Evaluator 6 zarzutów — niepełny inwentarz [brakujący LCG w `villages.ts`],
błędny opis strumienia `clusters.ts:3401` [bez XOR, nie z XOR], wewnętrznie sprzeczny zakres zgodności
`hashInt3`, zła klasyfikacja [ZGODNE zamiast ZGODNE-EMPIRYCZNIE], brak testu dla pangea/wysp,
niedokładna liczba wywołań dryfu → Obrona 6×PRZYJMUJE → Final Control 6×ODDAL, zweryfikowane
niezależnie w kodzie obu stron).

ZMIANY/COMMIT: nowy plik `dyspozycje/rust-port/p2/P2-4-RNG-DETERMINISM.md`.

**WYNIK — ISTOTNY DLA P4 (model świata/renderer):**
- Prymitywy ZGODNE (matematycznie identyczne, zweryfikowane na 7 seedach × 20000 wartości):
  `mulberry32`, permutacja 256, kolejność 6 offsetów `ShapeParams`.
- `hashInt3` ZGODNE-EMPIRYCZNIE, nie matematycznie — web liczy w JS float (traci precyzję), Rust w
  `u32` wrapping — zgodne dla małych seedów, rozjeżdża się przy ~4e6+ (potwierdzone: 3981/4000
  losowych seedów z zakresu [4e6, 2³²) daje różnicę).
- `mulberry32` web dryfuje od Rust po ~4,9 mln wywołań tego samego strumienia (utrata precyzji JS
  przy `s` > 2^53) — nieistotne praktycznie dla jednej generacji mapy, ale do odnotowania.
- **PEŁNY GENERATOR: NIEZGODNY.** Kontynent „Ziemia": Rust `build_world_centers` dla Earth zwraca
  `Vec::new()` (NIE WOŁA RNG, `map_generator.rs:519`), web generuje przez `buildContinentCenters(rand)`
  (`generator.ts:197`) — **różna liczba wywołań RNG od samego początku**. Po wygenerowaniu centrów
  kontynentów web konsumuje RNG dalej (góry, rzeki, lasy), Rust — NIE (brak tych kroków w ogóle,
  zgodnie z P2.1: rzeki tylko CZĘŚCIOWO zaimplementowane). Dodatkowy generator pomocniczy w web
  (`villages.ts` LCG Numerical Recipes, seed `effectiveSeed^0x5eed`) nie ma odpowiednika w Rust.
  Pangea i wyspy: NIEROZSTRZYGNIĘTY (nie przetestowano liczby/kolejności wywołań, ale ogólny wniosek
  NIEZGODNE jest już ugruntowany przez przypadek Ziemi).

ZNACZENIE: identyczny seed NIE DA tej samej mapy między web a obecnym stanem `rust-port/engine` —
oczekiwane, bo Rust nie implementuje jeszcze pełnego potoku generatora (zgodnie z ustaleniami P2.1 i
P1.8). To NIE jest regresja do naprawienia teraz — to jest dokładnie zakres przyszłej pracy P3/P4.

BLOKADY: brak.
NASTĘPNY KROK: integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
