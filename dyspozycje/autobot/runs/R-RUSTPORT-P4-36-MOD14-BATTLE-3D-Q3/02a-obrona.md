STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3
GOAL: MOD-14 cz. 3 (jednostki i nakładki bitwy 3D), port 1:1 do `rust-port/renderer/src/battle/`. Obrona Operatora wobec `02-evaluator.md` (`6516fdd93`, PASS-WITH-NOTES, 7 zarzutów).
ZMIANY/COMMIT: baza `6516fdd93` (rodzic `015defe7f` → `5c767337d` → `95930b446` = `origin/rust-port/parity-v2`; `git merge-base --is-ancestor 7817ef0c HEAD` → 0). Pliki wyłącznie w `runs/…-Q3/`: `02a-obrona.md` (nowy), `dowody/obrona-15-11.txt` (nowy, surowe wyniki), `01b-operator-pomiary.md` (korekty zarzutów 3, 4, 6). Kod, wektory, `MANIFEST`, README fixtur i dokument P4-36 bez zmian. Commit z jawnym `git add`, bez push.
RUNDY: 1/5 (Obrona)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

**1. [PROCES] Dispatch nie ma nowego GOAL — PRZYJMUJĘ (zgoda, bez poprawki po stronie Operatora).** To jest teza mojego BLOCK z `01-operator-impl.md`. Poprawka kodu nie jest możliwa ani potrzebna: ponowny port z pinu `edb8fb56` cofnąłby REPIN-3D A1/A2/A4 (`c88f96c2c`, `026d5b45d`, `8db7a9d04`). Commity `5c767337d`, `015defe7f`, `6516fdd93` i ten commit to wyłącznie raporty. Ich integracja nie jest wymagana, a włączenie jako ślad jest opcjonalne. Decyzja należy do orkiestratora: zamknąć temat w rejestrze (FC PASS `bb74ff9db` jest w `parity-v2`) albo wydać nowy dispatch z GOAL, którego baza nie spełnia.

**2. [GOAL a baza] `units.json` z `86d510c66`, nie z `edb8fb56` — PRZYJMUJĘ (informacyjnie, bez zmiany).** Niezależnie potwierdziłem, że plik w repo pochodzi z `86d510c66` (punkt 5 niżej: odtworzony bit w bit po normalizacji pola `node`). Jeśli temat wróci, nowy dispatch powinien wskazać pin `86d510c66` albo nowszy.

**3. [POMIAR] Rozmiar katalogu fixtur — PRZYJMUJĘ, poprawione.** Pomiar ponowiony w tym wywołaniu: `find . -type f -printf '%s\n'` z sumą daje 11 975 966 B dla 26 plików, `du -sb --apparent-size` daje to samo. Liczba 11 983 553 B z `01b` była błędna. W `01b-operator-pomiary.md` poprawiłem ją z adnotacją. Surowego logu `dowody/gates-pomiary-15-11.txt` nie zmieniam, bo to zapis historyczny. Przyczyna różnicy 7 587 B: NIE_ZMIERZONO. Limity są spełnione: ≤ 12 MB oraz największy plik `siege_wall.json` 7 228 812 B ≤ 8 MB.

**4. [RAPORT] Dryf `battleScene.ts` zapisany jako „+1517” — PRZYJMUJĘ, poprawione.** Pomiar: `git diff --numstat 86d510c66 origin/main -- gra/src/battle/battleScene.ts` daje `1290 227`, a `origin/main` = `807ecebdd` (ten sam co w `01b`). W `01b` jest teraz „+1290/−227, czyli 1517 zmienionych linii”. Pozostałe liczby (38 plików +4709/−687, 23 pliki +3065/−433) potwierdzone ponownie.

**5. [ODTWARZALNOŚĆ] Zależność od wersji node — PRZYJMUJĘ dla `units.json`, ODRZUCAM dla bundla.** Odtworzyłem generator dokładnie wg README fixtur (sekcja REPIN-3D A4). Środowisko: node v22.23.4, `three@0.169.0`, `esbuild@0.24.0`, `git archive 86d510c66`, układ `$S/{ref,websrc,refscript,out}`, `node_modules` jako symlink do `../ref`. Wyniki:
- wydruk `ctor=11 units=1230 bars=10 arrows=12 preview=11 ghosts=16`;
- **`gen_units.mjs` SHA-256 = `2a35e6f4…7684d8`, tyle samo co w README**. Zmiana wersji node nie zmienia więc bundla.
- `units.json` przed normalizacją ma `9d734c74…` (`"node":"v22.23.4"`). Po podmianie pola na `v22.22.0` ma `4242bc10…5e54`, a `cmp` z plikiem w repo daje IDENTICAL.

Kontrola: te same pliki w innym układzie (`node_modules` jako katalog, nie symlink `../ref`) dają bundel `ff0a4e26…`. README (sekcja części 2) mówi, że komentarze ścieżek esbuild zależą od układu. Najbardziej prawdopodobna przyczyna `62ece649…` u Evaluatora to więc inny układ katalogów, a nie node. Jego dokładnego układu nie znam: NIE_ZMIERZONO. Uwagę o normalizacji pola `node` w README przyjmuję, ale jej nie wprowadzam. README jest w `MANIFEST.sha256`, więc zmiana wymagałaby nowego manifestu i integracji kodu w temacie, który ma BLOCK. Proponuję ją jako punkt nowego dispatchu.

**6. [FORMAT] Podwójny STATUS w `01b` — PRZYJMUJĘ, poprawione.** Pierwsza linia `01b-operator-pomiary.md` to teraz `STATUS: BLOCK`, a komentarz HTML wyjaśnia korektę. Pomiary są dowodem pomocniczym.

**7. [POKRYCIE WERYFIKACJI] Mutacje 7/43, MSRV, `--features gpu` — PRZYJMUJĘ, luki domknięte pomiarem.** Uruchomiłem sam na `6516fdd93` (cargo 1.97.0, target poza repo, usunięty po przebiegu; surowe wyniki w `dowody/obrona-15-11.txt`):
- `python3 -I tests/fixtures/battle3d/mutate_units.py`, pełny przebieg od 09:46:17Z do 10:00:23Z: **KILLED 43/43, EXIT=0**. Zgadza się z `01b` i obejmuje także 36 mutantów, których nie zmierzył Evaluator. Po przebiegu `src/battle/units.rs` przywrócony, a `git status` bez zmian w kodzie.
- **MSRV:** toolchain 1.87.0 jest teraz zainstalowany (`rustup toolchain list`). `cargo +1.87.0 test --locked --all-targets` daje EXIT=0, 62 przebiegi, 466 passed / 0 failed / 0 ignored.
- `cargo test --locked --all-targets --features gpu` daje EXIT=0, 62 przebiegi, 469 passed / 0 failed / 1 ignored. Pominięty test `upload_and_read_back_every_level` to `tests/atlas_gpu.rs:101` (atlas P4-31, wymaga adaptera GPU), a nie test battle3d.
- Ocena wzrokowa: nadal NIE_ZMIERZONO (brak GPU w kontenerze; do oceny u właściciela po RR-T5).

TESTY: jak w punkcie 7. Dodatkowo fixtury mają 26 plików, 11 975 966 B. Bramek fmt/clippy nie powtarzałem, bo kod się nie zmienił; Evaluator i Operator mają EXIT=0 na tym samym drzewie kodu.
BLOKADY: zarzut 1, czyli decyzja orkiestratora (zamknięcie tematu albo nowy GOAL). Blokad technicznych brak.
NASTĘPNY KROK: Final Control, potem decyzja orkiestratora.
