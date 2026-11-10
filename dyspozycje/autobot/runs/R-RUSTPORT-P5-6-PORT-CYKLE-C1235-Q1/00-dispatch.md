STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-6-PORT-CYKLE-C1235-Q1
GOAL: Piąta partia portowania paneli UI do `src-tauri/frontend-v2/` wg `PORTING-QUEUE.md` (po P5.2–P5.5): wszystkie moduły z kolejki, których zależności UI są już w `frontend-v2` ALBO wchodzą w tej samej paczce — w tym CYKLE C1, C2, C3 i C5 (`sidePanelHud.ts`, `sidePanelEventFilter.ts`), `hexContextTooltip.ts`, `preBattle.ts` i pozostałe moduły poziomu 3–5 niewymagające `hud.ts`, `cityPanel.ts`, `newGameFlow.ts` (te trzy + `perfTestPanel.ts`/`sceneTimingReport.ts` zostają na osobne tematy P5.7+). Ustal listę z kolejki sam i zapisz w dokumencie; jeśli cykl zależy od modułu spoza zakresu — pomiń i wylistuj z powodem. Reguły identyczne jak P5.2–P5.5 (markup/CSS/teksty bajtowo poza zastąpionymi importami; typy DTO z `src/viewmodel/types.ts`; kontroler MOCK; reguły gry → pole DTO + wpis do rejestru rozszerzeń z numerem sekcji P5-0; harness DOM porównujący z pinem, resztę NIE_ZMIERZONO z powodem; mutacje harnessu wykrywane; regresja P5.2–P5.5 zielona; zero kopii `gra/data`).
RUNDA: 1/5
MODEL+EFFORT: Operator/Evaluator/Final Control: Opus 5.5 medium (wizualne UI; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2` (≥ `95b91471`; zawiera P5.1–P5.5). Dokumenty z `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`): przeczytaj OBOWIĄZKOWO `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` (§6 DTO, §7 komendy, §8 reguły, §9 brama), `p5/P5-1-UI-SHELL-SKELETON.md`, `p4/P4-5B-MAP-UI-SEAM.md` (kontrakt zdarzeń), LEDGER.md (UI-Q1..3). Rozstrzygnięcia orkiestratora (tymczasowe): D-UI-4 = dane statyczne tylko jako ten sam plik/atrapa; D-UI-3 = miniatura jako obraz z Rust; D-UI-7 = narzędzia deweloperskie bez sond WebGL.
Dozwolone: `npm ci` w `src-tauri/frontend-v2/`, `npx tsc --noEmit`, `npm run check`, `vite build` TYLKO tam; zakaz uruchamiania serwera dev i jakiegokolwiek `npm run build/dev` w `gra/`. Usuń `node_modules`/`dist` po pracy.
DOKUMENTY (NOWE): `dyspozycje/rust-port/p5/P5-6-PORT-CYKLE.md` (tabela modułów: status, zmiany względem pinu (diff), mapowanie import → DTO/kontroler, reguły → pola DTO, wyniki harnessu, NIE_ZMIERZONO; surowe logi z `echo "EXIT=$?"`), `dyspozycje/autobot/runs/R-RUSTPORT-P5-6-PORT-CYKLE-C1235-Q1/**`. Zaktualizuj `PORTING-QUEUE.md` (status portowanych modułów).
ANTY-HALUCYNACYJNA REGUŁA: każde twierdzenie o webie ma plik:linia/komendę; niepewne = NIE_ZMIERZONO. Zakaz „działa w oknie Tauri”. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i nie generuj pytań ABC; luki rozstrzygaj ZAŁOŻENIEM zapisanym w dokumencie.

BINARNE KRYTERIUM SUKCESU
Wszystkie moduły z zakresu (lub wylistowane jako pominięte z powodem) w `frontend-v2/src/ui/`, każdy z tabelą zmian vs pin, `npm ci && tsc --noEmit && npm run check && vite build` EXIT=0, brama 0 trafień na całym `src/`, harness DOM (tam gdzie możliwy) 0 różnic, mutacje harnessu wykrywane, zero zmian poza allowlistą.

ALLOWLISTA
`src-tauri/frontend-v2/**` (bez `node_modules`/`dist`; `package-lock.json` commituj), `dyspozycje/rust-port/p5/P5-6-PORT-CYKLE.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P5-6-PORT-CYKLE-C1235-Q1/**`. Zero zmian w `gra/**`, `src-tauri/frontend/**`, `src-tauri/src/**`, `src-tauri/Cargo.*`, `src-tauri/tauri.conf.json`, `rust-port/**`, `.github/**`.
IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`, NIGDY `-A`; logi `*.log` jawnie `git add -f`), PUSH NIE. Jeśli `git commit` zostanie odrzucony — zostaw zmiany w indeksie i opisz.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
