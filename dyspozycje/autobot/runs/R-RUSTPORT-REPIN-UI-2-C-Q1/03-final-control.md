STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-C-Q1
GOAL: Port DOM partii UI-2-C (`P5-REPIN-UI-2.md` §1 #10–#14: `hud`, `empireDetailPanel`, `empireDetailTypes`, `armyStackHud`, `unitRecruitCard`) z `origin/main` `86d510c66` do `src-tauri/frontend-v2`. Sprawdzony harnessem web↔port w Chromium, mutacjami i regresją.

## Kontekst
- Final Control (Opus 5.5), runda 1/5.
- Oceniany stan: `op/R-RUSTPORT-REPIN-UI-2-C-Q1`, kod `aaf1d4966`, raport `aa30e458c`. Baza `2198eaf7e` = `origin/rust-port/parity-v2`.
- Evaluator: PASS-WITH-NOTES, bez zarzutów (pliku `02-*` nie ma w runie; werdykt przekazał orkiestrator). Obrony nie było.

## Weryfikacja własna
- **Allowlista:** `git diff --name-only 2198eaf7e..aa30e458c` daje 22 pliki, wszystkie w allowliście.
  - Zero zmian w `gra/`, `rust-port/`, `src-tauri/src`, `Cargo.*`, `WERSJE.md`.
  - `git diff --check`: czysty.
  - `git log 86d510c66..origin/main -- gra/src/ui`: pusty (0).
- **Pliki w `ui2c.json`:** sha256 i rozmiar 6 wpisów są równe `git archive 86d510c66` (hud 90402 B, empireDetailPanel 272126 B, empireDetailTypes 36484 B, armyStackHud 20050 B, unitRecruitCard 19354 B, work-tax 5515 B).
  - `taxForWorkAmount` w porcie jest równy 1:1 z `gra/src/game/work-tax.ts:8-12`.
- **`P5-REPIN-UI-2.md`:** usunięto 11 linii, wyłącznie wiersze #10–#14 i wiersz partii UI-2-C.
- **`tsc --noEmit`:** EXIT=0.
- **`npm run check`:** EXIT=0. `verify-pin-copies` 433/0. `verify-repin-ui2-copies` 4/0, `porty_nakładki=6`.
- **`run-repin-ui2c`** (Chromium 141, świeży `git archive 86d510c66`): EXIT=0.
  - 10 grup, 752 wektory, 8 PNG, 0 różnic, ERR=0.
  - `webVectorsSha256=d69070ce…a93df0`, równy wynikom Operatora i Evaluatora.
  - `--out` ma ten sam sha256 co fixtura z commita (`adcacfbb1720023e…`).
  - 8 PNG webu jest bajtowo równych PNG z commita.
- **Mutacje Operatora (próbka):** #1–3, #13–16, #29–30. Wykryte 9/9 (8 przez harness EXIT=1, #29 przez `tsc`).
  - Próba #1–12 w jednym wywołaniu przekroczyła timeout i została przerwana. Pozostawioną mutację `hud.ts` cofnąłem przez `git checkout`.
- **Mutacje własne spoza listy:** obie wykryte, EXIT=1.
  - `brak N` → `brak: N` (`unitRecruitCard.ts:233`): 25 różnic.
  - Zamiana kolejności `blockedReasons` (`:357`): 8 różnic.
  - Plik przywrócony; `git status` czysty.
- **Regresja na nakładce pin + A + C** (`repin-ui2-overlay`, `portów=6`, `niezgodnych=0`):
  - `hud`: 899/0. Wartość 927 sprzed zmiany jest udokumentowana w `R-RUSTPORT-REPIN-UI-2-A-Q1/01-operator-r1.md:16`.
  - `cycles`: 6401/0.
  - Pozostałe (L0, L1A, L2, C4, newgame, cityux) przyjmuję z dwóch zgodnych, niezależnych pomiarów Operatora i Evaluatora.

## Orzeczenia
- **Zarzuty Evaluatora:** brak.
- **N1.** Kopia `taxForWorkAmount` leży między instrukcjami `import` (`empireDetailPanel.ts:94-98`). Działa (importy są hoistowane, `tsc` = 0), to tylko kwestia stylu. **ODDAL.**
- **N2.** `verify-repin-ui2-copies`: gdy brakuje obiektu git, wpis portu dostaje NIE_ZMIERZONO bez FAIL. Zachowanie jest takie samo jak istniejący wzorzec UI-2-A/B, a obiekt `86d510c66` jest dostępny i zmierzony (6/6). **ODDAL.**
- **N3.** Hooki C-Z1…C-Z4 nie są podpięte w kontrolerze. W działającej aplikacji nic się nie pogarsza; podpięcie to P6, poza allowlistą. **ODDAL.**
- **N4.** Scalenie z UI-2-B (`operator/R-RUSTPORT-REPIN-UI-2-B-Q1` `6462b89a6`): `git merge-tree` pokazuje konflikty tekstowe w 4 wspólnych plikach (`P5-REPIN-UI-2.md`, `package.json`, `repin-ui2-overlay.mjs`, `verify-repin-ui2-copies.mjs`).
  - Obie partie dopisują w tych samych miejscach, więc konflikt jest nieunikniony i nie jest wadą tej partii.
  - Rozwiązanie: suma obu stron.
  - B wprowadza `portDomRefs` w manifeście, C wprowadza `repin-ui2-overlay-ports/*.json`. Pliki są rozłączne, więc oba mechanizmy mogą działać razem.
  - Ujednolicenie do jednego mechanizmu to porządki na później, nie warunek PASS. **ODDAL.**
- **DO DECYZJI CZŁOWIEKA:** brak.

Brak NAPRAW, więc wynik to PASS.

## Integracja
- **SHA do integracji:** `fc/R-RUSTPORT-REPIN-UI-2-C-Q1` (commit tego raportu, nad `aa30e458c` ← `aaf1d4966` ← `2198eaf7e`).
- **Kolejność:**
  1. UI-2-C jako pierwsze: fast-forward `origin/rust-port/parity-v2` (`2198eaf7e`) do SHA tego raportu.
  2. UI-2-B po swoim Final Control: merge albo rebase na nowy `parity-v2` z ręcznym scaleniem 4 plików (suma obu stron).
  3. Po scaleniu B ponownie: `npm run check` (oczekiwane `porty_nakładki=6` i `portDomRefs` B) oraz regresja nakładki.

TESTY: jak wyżej. GPU i natywne okno Tauri: NIE_ZMIERZONO.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (fast-forward `parity-v2`).
DEPLOY/PUSH: NIE WYKONANO
