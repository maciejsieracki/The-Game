STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-4-RNG-DETERMINISM-Q1
GOAL: Zweryfikować zgodność RNG web (edb8fb56) z rust-port/engine (parity-v2 9e33fc77). Wynik: NIEZGODNE dla pełnej sekwencji generatora (ziemia potwierdzona). Prymitywy mulberry32, permutacja i offsety ZGODNE. hashInt3 ZGODNE-EMPIRYCZNIE. Pangea i wyspy NIEROZSTRZYGNIĘTE.

OBRONA:
- 1 -> PRZYJMUJE. Web `villages.ts:92-93` (`lcgNext`, `(state*1664525+1013904223)>>>0`) jest seedowany `(effectiveSeed ^ 0x5eed)>>>0` i wywoływany z `generator.ts:675`. Dodano do inwentarza w P2-4 §4. Rust `map_generator.rs` nie ma odpowiednika (grep: brak). Dla `state < 2^32` iloczyn jest < 2^53, więc JS jest dokładny. Status NIEROZSTRZYGNIĘTY w ścieżce mapy; werdykt bez zmian.
- 2 -> PRZYJMUJE. Potwierdzone `clusters.ts:3321`: `const rand = mulberry32(seed);` (seed = `opts.seed ?? 42`), bez XOR. R1 podawała 3401 i „XOR", oba błędne. `clusters.ts:1927` (`mulberry32((seed ^ 0x9e3779b9)>>>0)`) było poprawne. Skorygowano w P2-4 §4.
- 3 -> PRZYJMUJE. Reprodukcja: seedy 4000000, 4000001, 4010000, 4100000 dają 0/216 różnic. Seedy 4100001, 4200001, 4294967295 dają 216/216. Zakres jest niemonotoniczny, a 4100000 zgadza się tylko przez końcowe zera binarne. Sekcja 2 i 3 przepisane, „≤ 4 100 000" usunięte.
- 4 -> PRZYJMUJE. hashInt3 (float×ToInt32 vs u32 wrapping) oznaczono ZGODNE-EMPIRYCZNIE w statusie, tabeli §1 i §3.
- 5 -> PRZYJMUJE. Pangea i wyspy oznaczono NIEROZSTRZYGNIĘTE, z odwołaniami do `generator.ts:193/195` i `map_generator.rs:565/617`. Nie testowano liczby wywołań. Werdykt NIEZGODNE opiera się na ziemi: Rust `build_world_centers` dla `Earth` zwraca `Vec::new()` (`map_generator.rs:519`, zweryfikowane), web konsumuje `rand`. Oraz na braku RNG po centrach w Ruście.
- 6 -> PRZYJMUJE. Reprodukcja 1-based: seed 42 → 4917759, 43/1/999999 → 4917760, 4000000/4100000 → 4917759, 4294967295 → 4917758. Liczba 4917757 z R1 była błędna. Skorygowano w §2 i w run 01.

ZMIANY-COMMIT: Zmodyfikowano dwa pliki, oba w allowliście: `dyspozycje/rust-port/p2/P2-4-RNG-DETERMINISM.md` i `dyspozycje/autobot/runs/R-RUSTPORT-P2-4-RNG-DETERMINISM-Q1/01-operator.md`. Brak zmian w `gra/**` i w kodzie Rust. Brak commita. Nowy skrypt `scratchpad/rng/verify-r2.js` leży poza repo.

TESTY: Node 22, skrypt `scratchpad/rng/verify-r2.js` (poza repo). Wyniki: patrz OBRONA 3 i 6. Zweryfikowano też linie kodu Rust i web przytoczone w sprostowaniach. Nie powtarzano testu 20 000 wartości mulberry32 ani permutacji, bo wynik R1 nie został zakwestionowany.

BLOKADY: brak. Niezmierzone pozostają liczba i kolejność wywołań RNG dla pangea i wysp, oraz pełna liczba wywołań przed dryfem 4.9M.

RUNDY: 2/5 (druga tura rundy 1/5 zgodnie z dispatchem, Operator).

NASTĘPNY KROK: Evaluator (Haiku 5.5 medium) ponowna kontrola P2-4 po korektach, potem Final Control (Sonnet 5.5 medium).

DEPLOY/PUSH: NIE WYKONANO