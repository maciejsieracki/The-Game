STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-5B-MAP-UI-SEAM-Q1
GOAL: Kontrakt granicy mapa (Rust) ↔ UI (webview): wejście, kursor, kotwice w świecie, picking, reguły „panel czy mapa”, dane dzielone, kamera/minimapa, kadrowanie, zoom UI i pełny ekran, transport prostokątów paneli (UI-Q3=B).
ZMIANY/COMMIT: `dyspozycje/rust-port/p4/P4-5B-MAP-UI-SEAM.md` (NOWY), ten raport. Commit w worktree (SHA w odpowiedzi Operatora).
TESTY: temat dokumentacyjny — brak buildu/testów z założenia (zero kodu). Weryfikacja: twierdzenia o webie z `git show edb8fb56:…`/`git grep … edb8fb56` (plik:linia), o Rust z `origin/rust-port/parity-v2` @ `69f432ba`, o Tauri ze źródeł w cache cargo; `git diff --check` czysty.
BLOKADY: brak. Ustalenie ryzyka: publiczne API Tauri 2.11.5 nie ma zdarzeń myszy/klawiatury okna (`tauri-runtime-2.11.3/src/window.rs:30-85`), a przy D-RR-2=A wejście trafia do webview — UI-Q3=B wymaga kodu platformowego (M1/M2), wykonalność NIE_ZMIERZONO → RR-T1.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO

## Najważniejsze ustalenia
- F1/F2: konflikt D-RR-2=A ↔ UI-Q3=B; mechanizmy M1 (region wejścia webview = prostokąty UI), M2 (odwrócone warstwy), M3 (webview przekazuje — odstępstwo, D-SEAM-5).
- F3: web blokuje mapę stosem DOM + predykatami ramki miasta; słuchacze `window` (edge-pan, koniec drag, klawisze) działają nad całym UI.
- F4: zoom UI nie zmienia kadru mapy (tylko rozdzielczość bufora) → interpretacja D-UI-5; F4a dziwactwo predykatu panelu miasta przy z≠1.
- F5: web nie kadruje pod panele (zamyka P4-5 §7 pkt 4).
- Dane dzielone: 22 pola `CityRenderOptions` podzielone (9 wspólnych z UI / 4 stan UI / 9 tylko renderer).
- Założenia Z1–Z12, punkty dla właściciela D-SEAM-1..5, NIE_ZMIERZONO ×12 (w dokumencie §13–§15).
