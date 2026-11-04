STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-G-Q1
GOAL: Repin UI-2-G dla #26 `cityPanel.ts`: bloki K01–K09 z pinu `edb8fb56` na web `86d510c66`, potem K09C/K09D, jeśli zmieszczą się w rundzie.

ZMIANY/COMMIT:
- Oceniony branch `rp-ui2g-q1-r2`, HEAD `409046198`. Commity od bazy `2198eaf7e` (= `origin/rust-port/parity-v2`):
  - r1: `84d312c0c`, `dbcee5a5e`, `d049f45a6`;
  - r2: `984694e12` (kod), `0ab54695a` (dokument), `409046198` (raport).
- Ten dokument jest dodatkowym commitem na wierzchu.
- `git diff --name-only 2198eaf7e..409046198`: 100 plików. Wszystkie są z allowlisty:
  - 42 pliki w `src/ui/cityPanel/**`;
  - `tools/**`;
  - `package.json` (2 skrypty dopisane addytywnie);
  - `P5-REPIN-UI-2.md`;
  - pliki runu.
- Zero zmian w `gra/**`, `src/controller/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`.
- `git diff --check`: czysto.

ORZECZENIA (zarzuty Evaluatora r1):
- **Z1 ODDAL.**
  - Zmierzone: 13 weryfikatorów partii (k08d na 2 partiach) jest zielonych na webie i czerwonych na pinie. `npm run check` sprawdza 37 plików, 322 zakresy, 21 bramek treści, wszystkie zgodne.
  - K09C/K09D: dispatch zlecał je warunkowo („jeśli zmieści się”). Podpięcie wymaga `src/controller/**`, który jest poza allowlistą. `showCityPanelFromDto` ma 0 wywołań. Delegat do osobnego ID jest jawny w §7.4.
- **Z2 ODDAL.**
  - `renderBuildList` przekazuje `brakZasobow` (`k06b-kolejki.ts:469`). Kontrola negatywna: podmiana na `[]` daje FAIL w `npm run check` (KBLOK CONTENT k06b).
  - `costMult`: mutant `jedn-rekrut-costmult` jest ZABITY.
  - Braki po stronie kontrolera i silnika (`getManpowerMultipliers`, `wlascicielEra`) mają przypisanych właścicieli w §7.4 (K09C i P6).
- **Z3 ODDAL.** k06b, k07a i k09a są zielone na webie. Na pinie są czerwone (k09a: `--pin-file`, EXIT 1).
- **Z4 ODDAL.** Akceptuję wpis `LINE_SUB pinnedGarrisonCityId string→number`:
  - zmienia wyłącznie adnotację typu, dokładnym tekstem (`verify-k06a-copies.mjs:71`);
  - `why` wskazuje K09B r2 `0a1761d80`, czyli zmianę już zintegrowaną w `parity-v2`.
- **Z5 ODDAL.** `npm run check` uruchamia bramki treści na `git archive 86d510c66`. Moja mutacja treści (k06b) dała EXIT 1.
- **Z6 ODDAL.** `pinFile` daje `(86d510c66)` na webie i `(edb8fb56)` na pinie (`run-k06a-units`).
- **Uwaga własna FC (ODDAL):** PNG w Chromium jest tylko dla bloków z r1. Bloki z r2 są pokryte bramką równości tekstu z webem w `npm run check` oraz harnessami jsdom. Wymóg PNG paneli spełnia `run-repin-ui2g`.

TESTY (odtworzone przez FC, detached `409046198`, `git archive` 86d510c66 i edb8fb56 w mktemp; po bramkach usunięte, razem z node_modules):
- `tsc --noEmit`: 0. `npm run check`: EXIT 0 (433/0; kblocks 37 plików, 322 zakresy, `treść_bramek=21`; UI-2 4/0).
- Weryfikatory k01b, k05a, k05b, k06a, k06b, k07a, k07b, k08a, k08b, k08c, k08d (handel, slider), k08e (magazyn), k09a:
  - na webie: EXIT 0;
  - na pinie: EXIT 1.
- Harnessy na webie:
  - 37 z 38 EXIT 0, m.in. k01a ZIELONE, k05a 4936/0, k06a 1323/0, k06b 28/0, k07a 5296/0, k07b 335/0, k08* i k09* zgodne, k09b-wiring 36/36.
  - `run-k02-styles` jest czerwony. Po podmianie wyłącznie #14 `unitRecruitCard.ts` (UI-2-C) na wersję z pinu daje 14/0. Twierdzenie Obrony potwierdzone.
- `run-repin-ui2g` (Chromium 141):
  - 9216/0, PNG 1280×720 i 360×640 identyczne, DOM równy, ERR 0;
  - sha256 wyniku `c26dc6c3…40437` = fixtura.
- Mutacje na webie:
  - k05b PEŁNE 93/93 (46+47, 0 przeżyło), co zamyka lukę deklarowaną przez Obronę;
  - k06b 8/8;
  - k07a 66 zabitych + 1 równoważna;
  - k07b-units 31/31.
- Regresja na nakładce: cityux 164/0, cycles 6401/0, hud 927/0, newgame 1194/0, c4 EXIT 0.
  - L0, L1A i L2 nie zostały odtworzone (przerwane z powodu limitu czasu). Ich pliki nie importują `src/ui/cityPanel` ani `src/controller`.
- Nie odtwarzałem: mutate k08*/k09*, k01a/k01b/k05a/k06a, `mutate-repin-ui2g`. Zostają na deklaracji Operatora i Evaluatora r1.

BLOKADY:
- Technicznych brak.
- Notatki dla integracji:
  - (1) Po integracji UI-2-C ponownie uruchomić `run-k02-styles` na webie (oczekiwane 14/0).
  - (2) K09C/K09D oraz dostarczenie `getManpowerMultipliers`/`wlascicielEra` przez kontroler (P6) idą osobnym ID według §7.4.
  - (3) Drobne: `verify-k09a-copies` wypisuje etykietę `pin=86d510c66` także przy `--pin-file` pinu. Wynik (problemów=9, EXIT 1) jest poprawny.
- GPU i natywne okno Tauri: NIE_ZMIERZONO.

RUNDY: 2/5

NASTĘPNY KROK: integracja orkiestratora.
- `origin/rust-port/parity-v2` przesunął się w trakcie FC na `af6433757`, po merge'ach UI-2-C, UI-2-D, UI-2-F i UI-2-B. Fast-forward nie jest już możliwy.
- Scalić UI-2-G jako ostatnią partię (merge `--no-ff` SHA końcowego na `af6433757`).
- Próbny merge (przerwany, bez commitu) daje 3 konflikty, wyłącznie addytywne. W każdym trzeba złożyć oba dopiski:
  - `package.json`: skrypty ui2g oraz ui2c/d/f/b;
  - `P5-REPIN-UI-2.md`: 3 hunki, sekcje partii;
  - `verify-repin-ui2-copies.mjs`: 2 hunki. Importy trzeba połączyć: `existsSync, readFileSync, readdirSync, mkdtempSync, rmSync` oraz `execFileSync, spawnSync`. Blok KBLOK i CONTENT z G oraz blok z drugiej strony zostają oba.
- Po scaleniu: `tsc --noEmit`, `npm run check` (oczekiwane `kblocks 37/322, treść_bramek=21` oraz bramki B/C/D/F) i `run-k02-styles --pin-dir <web>`. Wynik k02-styles ma być 14/0, bo UI-2-C jest już w `parity-v2`.

DEPLOY/PUSH: NIE WYKONANO
