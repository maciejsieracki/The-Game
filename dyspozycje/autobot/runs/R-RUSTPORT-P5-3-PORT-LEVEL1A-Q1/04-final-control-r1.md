STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-3-PORT-LEVEL1A-Q1
GOAL: Final Control r1. Orzeczenie w sprawie portu 17 modułów UI poziomu 1 bez cyklu do `src-tauri/frontend-v2/src/ui/`. Podstawą są: commit Operatora `663ac6dd`, zarzuty Evaluatora r1 (`e92803ee`) i Obrona r1 (`c98eee29`).

ZMIANY/COMMIT:
- Ten raport jest commitem nad `c98eee29`. Łańcuch: `0a1569c0` → `663ac6dd` → `c98eee29` → FC.
- Kod nie został zmieniony.
- Commit Obrony `c98eee29` istnieje (`git cat-file -t` daje `commit`), więc nie trzeba go odtwarzać.

KOLEJNOŚĆ INTEGRACJI:
- `origin/rust-port/parity-v2` przesunął się na `d405b0d7`.
- Od `0a1569c0` doszło 7 commitów: P3-23 i P4-23. Wszystkie dotyczą `rust-port`, czyli kodu Rust i dokumentów.
- `git diff --name-only 0a1569c0 origin/rust-port/parity-v2 -- src-tauri/frontend-v2 dyspozycje/rust-port/p5` daje pusty wynik, więc zakresy plików się nie nakładają.
- Integracja: scalić albo przebazować łańcuch `663ac6dd` → `c98eee29` → FC na `d405b0d7`. Konfliktów nie oczekuję. Po integracji trzeba powtórzyć bramy.

WERYFIKACJA WŁASNA (detached checkout `c98eee29` w worktree `wf_259a8c04-548-4`; pin z `git archive edb8fb56 gra/src gra/data` w scratch):
- Allowlista: wszystkie 57 ścieżek z `git diff --name-only 0a1569c0 c98eee29` są w allowliście.
- `git diff --check 0a1569c0 HEAD`: EXIT=0 na checkoucie z `.gitattributes`.
  - Uwaga: bez checkoutu dawałoby trafienia w `r1-logi/diffs/*.diff`. Wyłącza je `.gitattributes` w katalogu runu (`-whitespace`). Integrator musi uruchamiać tę bramę na checkoucie, nie w trybie „między commitami z obcego drzewa”.
- `npm ci`: EXIT=0.
- `npx tsc --noEmit`: EXIT=0.
- `npm run check`: EXIT=0. Self-test 33+/15−; 83 pliki, 0 trafień; pin `edb8fb56`, 411 plików, 0 niezgodnych.
- `npx vite build`: EXIT=0.
- SHA-256 dziesięciu kopii bajtowych zgodne z pinem (10/10): `diploUiSkin`, `icons/iconRegistry`, `mapUnitHudSkin`, `armyMergePanel`, `icons/wikiBookIcon`, `powerOverlayHud`, `bottomBarHud`, `cityListHud`, `empireOverlayHud`, `battle/battleHudTheme`.
- Diff 8 modułów zmienionych względem pinu (liczba linii różnic): 31/57/25/39/2/11/41/20. Zgadza się z raportem Evaluatora.
- Harness P5.3: 17 modułów, 3618 przypadków, 0 różnic, 0 błędów jsdom, EXIT=0.
- Mutacje: 19 z 19 wykrytych, EXIT=0, w tym L17 (78 różnic), L18 (16) i L19 (3).
- Regresja P5.2: 3861 przypadków, 0 różnic, EXIT=0.
- Mutacja własna FC (`armyListHud.ts:153`, licznik jednostek +1 dla listy 1-elementowej): 17 różnic, czyli wykryta.
  - Wykryły ją wyłącznie nowe przypadki Obrony: lista 1-elementowa i 16 kombinacji flag.
  - Plik przywrócony, `git status` czysty.
- `node_modules` i `dist` usunięte.

ORZECZENIA:
1. Zarzut 1 (harness ślepy na `label` w `unitRecruitCard.ts:195`): **ODDAL**, bo naprawiony w Obronie.
   - Fikstury mają `label` różny od `id` (`run-level1a.mjs` w diffie `663ac6dd..c98eee29`).
   - Mutacja L17 wykryta, 78 różnic, powtórzone przeze mnie.
   - Kod `src/ui/**` bez zmian.
2. Zarzut 2 (cienkie pokrycie `cityListHud`, `armyListHud`, `cityAttackChoice`): **ODDAL**, bo naprawiony.
   - Liczba przypadków: `cityListHud` 7, `armyListHud` 23.
   - `cityAttackChoice` porównuje teraz DOM w stanie otwartym, potwierdza to asercja v2 i mutacja L18 (16 różnic).
   - Kopie bajtowe pilnuje dodatkowo manifest SHA.
   - `DOM_puste=12/16` dotyczy stanu końcowego, więc jest zgodne z opisem.

Żadnego zarzutu nie oceniłem jako NAPRAW ani DO DECYZJI CZŁOWIEKA. Kryterium binarne z dispatchu jest spełnione.

TESTY: wszystkie wyniki są wyżej i zostały uzyskane samodzielnie.
BLOKADY: brak.
NIE_ZMIERZONO (bez zmian względem Operatora):
- realny WebView i okno Tauri,
- komendy Rust dostarczające DTO,
- Escape i zdarzenia wskaźnika w harnessie.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora na `origin/rust-port/parity-v2` (`d405b0d7`), potem powtórzenie bram i READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
