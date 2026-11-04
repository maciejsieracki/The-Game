STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-A-Q1
GOAL: Final Control rundy 1. Przedmiot: przepięcie `battle::*` z pinu `edb8fb56` na aktualny web, etap A. Zakres: pomiar dryfu, plan partii A1…A6, port A1 (kolejka rozkazów, atakuj-marszem, natychmiastowe usuwanie zabitych) bit w bit.

ZMIANY/COMMIT:
- Oceniany obiekt: `rust-port/repin-3d-a-q1` @ `481eeed26`. Commity: `c88f96c2c`, `c2f0798e6`, `481eeed26`.
- Baza: `e1c040160`. Jest to bieżący `origin/rust-port/parity-v2` (`git rev-parse`) i jest ona przodkiem gałęzi (`merge-base --is-ancestor`).
- Final Control dokłada tylko ten raport, jako commit nad `481eeed26`.
- Allowlista: `git diff --numstat e1c040160 481eeed26` daje 18 plików, wszystkie w zakresie dispatchu:
  - `battle/{mod,orders,units}.rs`,
  - `tests/repin3d_*`,
  - `P4-REPIN-3D.md`,
  - `runs/<ID>/**`.
- Usunięcia: jedynie 4 linie w `units.rs`.
- Zero zmian w `gra/**`, `rust-port/engine/**`, `src-tauri/**`, `WERSJE.md`, `gra-robocza/**` i `Cargo.*`.

TESTY (odtworzone samodzielnie w worktree FC, detached @ `481eeed26`, CARGO_INCREMENTAL=0, debug=0):
- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0.
- `cargo test --locked --no-fail-fast`: EXIT=0. Wynik: 439 przeszło, 0 błędów, 57 binarek.
  - `repin3d_a1`: 6/6.
  - `battle::orders::tests`: 2/2.
- `git diff --check e1c040160 HEAD`: czysto.
- `sha256sum -c MANIFEST.sha256`: 5×OK.
- Zgodność z webem sprawdzona wyrywkowo, ręcznie: `_activateNext` (`battleScene.ts` @ `c1581619f` :5847-5898) wobec `next_activation`/`consume_on_activation`. Sprawdzone elementy:
  - warunek aktywacji `!dead && !fadingOut && !removed && !acted`,
  - usuwanie z kolejki tylko w trybie ręcznym, dla pominiętych kandydatów,
  - flaga odświeżenia,
  - inkrement `turnIdx` przed testem.
  Odpowiedniość jest 1:1.
- Nie powtarzano: mutacji 35/35 (Operator), niezależnego generatora (Operator ×2 i Evaluator). Oba wyniki są spójne z hashem `a1.json` w MANIFEST.

ORZECZENIA:
- Zarzuty Evaluatora: brak (pusta lista). Nie ma czego naprawiać.
- Uwaga Evaluatora 1: `kill_unit` ustawia tylko `removed`, a `dead`/`occByKey` leżą po stronie wywołującego. ODDAL. Jest to zgodne z podziałem scena/logika P6.13 i udokumentowane.
- Uwaga Evaluatora 2: test jednostkowy nie łapie `swap_remove`. ODDAL. Ten mutant zabijają testy wektorowe, więc pokrycie jest wystarczające.
- Uwaga Evaluatora 3: NIE_ZMIERZONO ocena wizualna i `clippy --features gpu`. ODDAL. Brak `/dev/dri`, a dispatch zwalnia to z blokady. A1 nie dotyka kodu za cechą `gpu`.
- Rozjazd ścieżki i wielkości dryfu względem dispatchu (`gra/src/battle/battleScene.ts`, +872/−200). ODDAL. Operator to zmierzył i jawnie zapisał jako założenie Z-RP-1, a Evaluator potwierdził.
- Prośba właściciela o testy bitew oblężniczych (tarany, wieże, piechota na mury, konnica przy bramie). Jest poza zakresem tego tematu i kieruje się do orkiestratora, do rejestracji jako osobny temat logiki bitwy w webie. Nie wpływa na werdykt.

BLOKADY: brak.
INTEGRACJA:
- SHA końcowy: commit FC nad `481eeed26`; jego SHA jest w raporcie zwrotnym.
- Kolejność: integracja na `origin/rust-port/parity-v2` (`e1c040160`) jako fast-forward. Baza jest identyczna z bieżącym tipem, więc nie trzeba niczego rebase'ować.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora, potem partia A2 (palisada i wieżyczki, `siege_wall` oraz `siege_towers`).
DEPLOY/PUSH: NIE WYKONANO
