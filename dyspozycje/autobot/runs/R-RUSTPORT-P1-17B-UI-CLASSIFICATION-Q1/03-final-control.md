STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-17B-UI-CLASSIFICATION-Q1
GOAL: Klasyfikacja 117 plików `.ts` `gra/src/ui` vs `src-tauri/frontend/` (`autobot/real24-staging`).
RUNDY: 1/5 (4 zarzuty o dokładności dowodów/liczby — nie o błędne etykiety — Obrona poprawiła, Final
Control ODDAL po weryfikacji)

ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-17B-UI-CLASSIFICATION.md`.

**WYNIK: REUSE=0 | ADAPT=6 | REPLACE=4 | UNKNOWN=107 | suma=117.**

Kluczowe znalezisko: `src-tauri/frontend/` (jedyny istniejący szkielet UI Tauri, identyczny na
`real24-staging`/`handoff`) to tylko **2 pliki** (`index.html` 261 linii, `main.js` 810 linii) +
`lib.rs` (61 linii, 1 komenda). Sam plik nazywa się "vertical slice" — sztywne listy epok/cywilizacji,
mapa jako siatka DOM, stub karty jednostki ("Wojownik"). To wąski grywalny szkic, nie port UI 1:1.
Potwierdza: faza P5 (frontend/UI 1:1) również wymaga pracy praktycznie od zera, podobnie jak P2/P6
(domena) — żadna z trzech dużych warstw portu (domena, UI, hot-seat) nie ma gotowego zamiennika.

BLOKADY: brak. Zero zapisu w `gra/**`/`src-tauri/**`.
NASTĘPNY KROK: integracja orkiestratora. Materiał wejściowy dla przyszłej fazy P5.
DEPLOY/PUSH: NIE WYKONANO
