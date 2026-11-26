# DODATEK (runda 1/5, Operator HAIKU 5.5)
## Fakty
main.ts: breakTreatiesOnWar (≈25149) — suspendZlozeOnWar, treatiesBrokenByWar, removeTreatiesById; gdy opts.bezKary → return BEZ zdarzenia relacji; wywołania ≈12508 (bezKary), ≈14099, ≈14136, ≈25270 (sojusznik dołącza), ≈30167 (bunt/ochrona). Uwaga z ALLYCLEAN/ALLYMEAS (dyspozycje/analizy/*ALLY*): „breakTreatiesOnWar nie koryguje statusu relacji przed zdarzeniem wojny”. Reguła właściciela (FALA 913): relacja „sojusz” znika razem z umową (reconcileAllianceStatusAfterDeals); pary AI-major↔to samo państwo-miasto zachowują status. Wojna = status „wojna” pary musi być ustawiony przez ścieżkę wypowiedzenia.
## Zadanie
1. Zmapuj każde wywołanie breakTreatiesOnWar: co ustawia status relacji PO nim (declareWar/ownerDeclareWarOn/…), czy istnieje ścieżka, w której po wojnie para ma status ≠ „wojna” albo żywą umowę sojuszu/handlu (activeDeals) mimo wojny. Wypisz tabelę ścieżek z dowodem (linia kodu + wynik testu).
2. Napisz test na silniku (gra/tools/break-treaties-status-test.cjs, wzorzec: istniejące testy diplomacji źródłowe/silnikowe) z mutacją czerwoną: po wojnie status „wojna”, brak umów pary, brak „sojusz”.
3. Jeśli znajdziesz błąd — minimalna poprawka w main.ts (tylko ta ścieżka) lub raport DECISION_REQUIRED z jednym zdaniem skutku dla gry per wariant. Brak błędu → raport „brak błędu” z tabelą (to też wynik).
## Allowlista
gra/src/main.ts (tylko miejsca breakTreatiesOnWar i jego wywołań, jeśli błąd potwierdzony), gra/src/game/diplomacy-treaties.ts (tylko jeśli konieczne), nowy gra/tools/break-treaties-status-test.cjs, dyspozycje/analizy/BREAKTREATIES-2026-11-26.md, dyspozycje/autobot/runs/R-WEB-BREAK-TREATIES-STATUS-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build do testów live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir), zmiana wartości balansu, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash. Dysk >= 6 GB; usuń node_modules/tmp po pracy. Nie pytaj właściciela (zwróć DECISION_REQUIRED).
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; war-limit-truce-count 19/0; alliance-label-clean-test; testy tematu. Zacommituj i zwróć SHA.
## Binarne kryterium
Tabela ścieżek z dowodem; test z mutacją czerwoną; błąd naprawiony albo jawnie „brak błędu”/DECISION_REQUIRED; bramki zielone.
