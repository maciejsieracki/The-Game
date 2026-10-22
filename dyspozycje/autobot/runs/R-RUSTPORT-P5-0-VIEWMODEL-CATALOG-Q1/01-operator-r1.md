STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1
GOAL: Katalog modelu widoku dla 49 modułów `gra/src/ui/**` importujących logikę/dane gry: co UI czyta/liczy lokalnie + docelowe DTO z Rust (nazwa, pola, typy, konsument, reguły do przeniesienia wg P5.13), przy decyzjach UI-Q1=A, UI-Q2=A, UI-Q3=B, D-UI-9.
ZMIANY/COMMIT: `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` (NOWY), ten raport. SHA — w komunikacie zwrotnym Operatora (commit w worktree, bez push).
ZMIANY/COMMIT — uzupełnienie r2 (zarzut 10 Evaluatora r1): commit r1 = `85cbd531` (baza `88df6493`).
TESTY: Temat dokumentacyjny — brak buildu/testów kodu (zakaz z dispatchu). Weryfikacja liczb: parser importów na `edb8fb56` (git archive do scratch) → 49 plików / 212 linii (game 142, dane 41, map 13, render 8, units 6, battle 2) — zgodne z P4-5 §2.4; 496 symboli sklasyfikowanych (R181 M11 IO6 F56 K46 S42 X26 T128). `git diff --check` czysty.
BLOKADY: brak. Luki rozstrzygnięte jako ZAŁOŻENIA Z1–Z10 (§10 dokumentu); 8 pozycji NIE_ZMIERZONO.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium) → Final Control → integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

Kluczowe ustalenia:
- `cityPanel.ts` = 97/181 R i 7/11 M; UI mutuje stan gry (pobór/zwrot surowców `:6277`/`:6131`, kolejka `enqueue`/`dequeue`/`promoteToFront`/`setPaused`, lokalna `localProd` `:633-643`).
- Podgląd akceptacji AI w dyplomacji liczony w UI z udokumentowaną resztkową luką (`diplomacyAcceptanceBalance.ts:773-788`) → zapytanie Rust tą samą funkcją co bramka.
- Reguła w UI bez importu: `siegeMapPanel.ts:219-220` (brama „zero importów” jej nie wykryje).
- Pola dzielone renderer↔UI (D-UI-9): WZROST%+nakarmione, etykieta miasta, front produkcji, ostrzeżenie surowców, stolica.
- 6 importów typów inline `import('../game/…')` poza 142 liniami — brama P5.1 musi je łapać.
