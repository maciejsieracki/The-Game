STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1
GOAL: Port jednostek K01 bez DOM (cityPanel.ts, pin edb8fb56) do src-tauri/frontend-v2/src/ui/cityPanel/k01a-fundament.ts.
ZMIANY/COMMIT: kod do integracji = 3e4f661e (baza 2c2f58f8 = origin/rust-port/parity-v2, bez rozjazdu). Allowlista czysta, brak zmian w gra/**, WERSJE.md, package.json, .rs. Ten plik: commit FC osobno.
TESTY (powtórzone samodzielnie na 3e4f661e, pin z git archive edb8fb56, npm ci):
- run-k01a.mjs: EXIT 0. A 82/82 (622 linii), B 0 bez export, C 0/0/0, S OK (82/622, odroczone 57/738, K01 139/1360), T OK, I OK (v2 6, pin 233, 0 niezgodnych), D OK (2x DIFF opisane ADAPT), V OK, E OK, F OK (72 eksporty, 1098 porównań, 0 rozbieżności, notMeasuredAllThrow 0).
- mutate-k01a.mjs: EXIT 0, linia zielona, 9/9 wykrytych.
- npm run typecheck: EXIT 0. npm run check: 147 plików, trafień 0; verify-pin-copies 435, niezgodnych 0.
- git diff --check 2c2f58f8..3e4f661e: czysto.
- cargo clippy/test: NIE_ZMIERZONO (blokada GTK, brak zmian .rs).
WERDYKT ZARZUTÓW:
1. Skrypt selekcji w repo, gate S zielona: ODDAL (naprawione w r3).
2. PH, stałe i focus przeniesione (+8 jednostek); "import type z game/" nie jest dozwolone: probe import type z ../../data/loader daje [CORE:data], więc odroczenie typów obiektowych jest poprawne: ODDAL.
3. PORTING-QUEUE.md zaktualizowany (r3/5, 82/57); package.json poza allowlistą: ODDAL.
4. Importy pinu literalne (gate I), notMeasuredAllThrow 0, brak pomiaru pokrycia jawnie NIE_ZMIERZONO: ODDAL.
5. D jest bramką, V porównuje wartości; brak producenta uiParams w Rust = NIE_ZMIERZONO, poza zakresem: ODDAL.
Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA.
BLOKADY: brak.
RUNDY: 3/5, decyzja wymagana: NIE
NASTĘPNY KROK: integracja orkiestratora 3e4f661e (cherry-pick/merge na origin/rust-port/parity-v2 2c2f58f8), potem READY_FOR_DEPLOY. Później: DTO dla 57 odroczonych (T 29, R 12, F 6, DOM 10) w K01B; dopisek skryptów npm wymaga rozszerzenia allowlisty.
DEPLOY/PUSH: NIE WYKONANO
