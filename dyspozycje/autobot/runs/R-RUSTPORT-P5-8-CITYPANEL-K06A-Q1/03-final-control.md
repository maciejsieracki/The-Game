STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K06A-Q1
GOAL: Port 16 jednostek nie-DOM bloku K06 (cityPanel.ts, pin edb8fb56) do `src/ui/cityPanel/k06a-fundament.ts`.
ZMIANY/COMMIT: oceniany stan 6dff6e3a (b9d24387, 39921c3c, 90a3125b, 6dff6e3a; baza a2920ce3 = origin/rust-port/parity-v2, bez dryfu). Final Control nie zmienia kodu; tylko ten plik.
TESTY (powtórzone samodzielnie, pin `git archive edb8fb56` poza repo, `npm ci`, pierwszy plan):
- verify-k06a-copies.mjs: EXIT 0, blocks=16 wybrane=15 lineSubs=9 OK (ORPHAN=0)
- run-k06a-units.mjs: 1323 porównania, 0 różnic, 12 jednostek
- mutate-k06a-units.mjs: 29 zabitych / 0 przeżytych
- npm run typecheck: 0; npm run check: 0 (self-test 33/15, 175 plików 0 trafień, verify-pin-copies 435 plików 0 niezgodnych)
- git show --check każdego z 4 commitów: czyste; drzewo czyste
- Diff do allowlisty: tylko k06a-fundament.ts, tools/dom-harness/*k06a*, PORTING-QUEUE.md, P5-8-K06A.md, runs/<ID>/**. Zero zmian w gra/, WERSJE.md, package.json, viewmodel/, controller/.
- Partie: b9d24387 (8 jednostek), 39921c3c (8) — zgodnie z dispatchem.

ROZSTRZYGNIĘCIE ZARZUTÓW r1 (wszystkie 7 zamknięte w r2):
1. Bramka kopii — ODDAL (zamknięte; wykonana i zweryfikowana niezależnie).
2. headerOrderBadge escape — ODDAL (bramka kopii bajtowo OK, 0 podstawień).
3. Partie ≤8 — ODDAL (8+8, osobne commity).
4. Allowlista z K05A — ODDAL (ZAŁOŻENIE Z-A w §3 dokumentu; akceptuję).
5. wybrane/odroczone — ODDAL (r2-logi z select-k06a --r3: 15 wybranych + K06A-Z6, 21 DOM + 1 R; r1-logi jawnie historia).
6. Wiring kontrolera — ODDAL (ZAŁOŻENIE Z-B: brak konsumenta przed K06B, `dep()` rzuca czytelny błąd; NIE_ZMIERZONO jawnie).
7. Stuby harnessu — ODDAL (NIE_ZMIERZONO w §6).

NOWE ZARZUTY (Final Control):
N1. NAPRAW: `src-tauri/frontend-v2/PORTING-QUEUE.md` (wpis K06A) jest nieaktualny i fałszywy względem r2: nagłówek "runda 1/5", odsyła do `r1-logi/`, a "Otwarte" twierdzi że bramka kopii `verify-k06a-copies.mjs` i partie ≤8 są "NIE ZROBIONE" — oba zrobione. Kolejka porządkuje kolejne tematy, więc fałszywy status jest wadą (reguła: status potwierdzany dowodem). Zaktualizować wpis do stanu r2 (runda, SHA, verify OK, 29/29, otwarte: wiring Z-B, stuby, przeglądarka).
N2. NAPRAW (drobne): komentarz nagłówkowy `k06a-fundament.ts` (linie 2, 5, 12) mówi "runda 1", wskazuje `r1-logi/` i "P5-8-K06A.md §4" — właściwe: runda 2, `r2-logi/`, §3 (założenia). Zmiana wyłącznie w komentarzu; po niej ponowić verify-k06a-copies, typecheck, check.
Obserwacja (bez zarzutu): `verify-k06a-copies.mjs` nie jest w `npm run check` (package.json poza zakresem) — jawnie opisane w §6.

WERDYKT: FAIL (2x NAPRAW, oba dokumentacyjne/komentarzowe; kod, harness, mutacje i bramki wiarygodne i zielone).
BLOKADY: brak technicznych. Evaluator r2: w runie brak pliku 02-* z werdyktem; brak PASS Evaluatora w repo — do potwierdzenia przez orkiestratora. Brak decyzji produktowej (DO DECYZJI CZŁOWIEKA: brak).
RUNDY: 2/5 (r3 wymagana, ten sam ID)
NASTĘPNY KROK: Operator r3 — N1 i N2 (mały commit, jawny git add), potem Evaluator, Final Control. Kod portu nie wymaga zmian. Po PASS: SHA końcowy do integracji = ostatni commit r3 (obecnie kandydat 6dff6e3a + poprawki); kolejność: integracja na origin/rust-port/parity-v2 (a2920ce3) bez konfliktów (K06A dotyka tylko nowych plików k06a-*, tools/dom-harness/*k06a*, dopisku PORTING-QUEUE.md), przed K05B/K02 jeśli już zintegrowane — wtedy rebase wyłącznie PORTING-QUEUE.md.
DEPLOY/PUSH: NIE WYKONANO
