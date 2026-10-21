STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-4-MODEL-CATALOG-Q1
GOAL: Katalog modeli 3D (render/** + 8 plików three poza nim) do odtworzenia w Rust: inwentarz, pokrycie danymi, helpery i graf, wycena, paczki, ocena wizualna, D-MOD-n.
ZMIANY/COMMIT: dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md (NOWY), ten raport. Commit lokalny w worktree, SHA w odpowiedzi Operatora.
TESTY: brak kodu, więc brak testów. Kontrole: inwentarz 96 wierszy = 88 render/** + 8 poza (ls-tree → 88, git grep three → 80 + 8). Suma LOC kategorii render = 59 319. Sumy R3 zgodne z git grep -c (Box 1450, Mesh 2394). git diff --check czysty.
BLOKADY: brak. Uwaga: rust-port/engine/data nie istnieje na dc4cfdb4, więc pokrycie policzono z gra/data/*.json @ edb8fb56 (P4-4 §0.3).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium)
DEPLOY/PUSH: NIE WYKONANO

Najważniejsze ustalenia:
- 75/75 rekordów units.json ma dedykowany model albo wariant, 67 różnych tras routingu; do tego 2 jednostki cywilne, razem 77 typów. 5 modeli nazwanych bez rekordu w danych.
- W grze działa tylko styl `roblox` (stała `mapRenderStyle.ts:40`). Klasyczne buildery miast i ulepszeń są nieosiągalne (D-MOD-1).
- Cuda 19/19, ulepszenia 22/22 (24 klucze modeli). Budynki nie mają modeli. Miasta brązu mają tylko 2 zestawy (Rzym, Grecja jako fallback). Żelazo nie ma modelu miasta.
- `buildRobloxCity`/`buildRobloxRomeCity` są martwe w praktyce (doprecyzowanie P4-0 §1.2).
- 14 paczek implementacyjnych z kolejnością, 8 punktów D-MOD, 9 pozycji NIE_ZMIERZONO.
