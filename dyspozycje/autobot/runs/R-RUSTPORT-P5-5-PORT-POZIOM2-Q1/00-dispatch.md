STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-5-PORT-POZIOM2-Q1
GOAL: Czwarta partia portowania paneli UI do `src-tauri/frontend-v2/` wg `PORTING-QUEUE.md` (po P5.2, P5.3, P5.4): WSZYSTKIE moduły z kolejki, których KAŻDA zależność UI jest już w `frontend-v2` (poziom 1–2 niecykliczne, np. `unitPanelHud.ts`, `contextPanelHud.ts`, `armyStackHud.ts`, `unitActionBarHtml.ts`, `buildModeHud.ts`, `techTreeView.ts`, `unitInfoCard.ts` itd. — ustal listę z kolejki sam i zapisz w dokumencie), z wyłączeniem: `newGameFlow.ts`, `perfTestPanel.ts`/`sceneTimingReport.ts` (D-UI-7), `cityPanel.ts`, `hud.ts`, `hexContextTooltip.ts` i cyklu C5 (`sidePanelHud.ts`, `sidePanelEventFilter.ts`) — to osobne tematy P5.6+. Reguły identyczne jak w P5.2–P5.4 (markup/CSS/teksty bajtowo poza zastąpionymi importami; typy DTO z `src/viewmodel/types.ts`; kontroler MOCK; reguły gry liczone w module → pole DTO + wpis do rejestru rozszerzeń z numerem sekcji P5-0; harness DOM porównujący z pinem, resztę NIE_ZMIERZONO z powodem; mutacje harnessu wykrywane; regresja P5.2/P5.3/P5.4 zielona). Jeśli modułu nie da się przenieść — pomiń i wylistuj z powodem. Port zacznij od modułów z największą liczbą dependentów.
RUNDA: 1/5
MODEL+EFFORT: Operator/Evaluator/Final Control: Opus 5.5 medium (wizualne UI; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2` (≥ `98e11c25`; zawiera P5.1–P5.4). Dokumenty z `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`): przeczytaj OBOWIĄZKOWO `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` (§6 DTO, §7 komendy, §8 reguły, §9 brama), `p5/P5-1-UI-SHELL-SKELETON.md`, `p4/P4-5B-MAP-UI-SEAM.md` (kontrakt zdarzeń), LEDGER.md (UI-Q1..3). Rozstrzygnięcia orkiestratora (tymczasowe): D-UI-4 = dane statyczne tylko jako ten sam plik/atrapa; D-UI-3 = miniatura jako obraz z Rust; D-UI-7 = narzędzia deweloperskie bez sond WebGL.
Dozwolone: `npm ci` w `src-tauri/frontend-v2/`, `npx tsc --noEmit`, `npm run check`, `vite build` TYLKO tam; zakaz uruchamiania serwera dev i jakiegokolwiek `npm run build/dev` w `gra/`. Usuń `node_modules`/`dist` po pracy.
DOKUMENTY (NOWE): `dyspozycje/rust-port/p5/P5-5-PORT-POZIOM2.md` (tabela modułów: status, zmiany względem pinu (diff), mapowanie import → DTO/kontroler, reguły → pola DTO, wyniki harnessu, NIE_ZMIERZONO; surowe logi z `echo "EXIT=$?"`), `dyspozycje/autobot/runs/R-RUSTPORT-P5-5-PORT-POZIOM2-Q1/**`. Zaktualizuj `PORTING-QUEUE.md` (status portowanych modułów).
ANTY-HALUCYNACYJNA REGUŁA: każde twierdzenie o webie ma plik:linia/komendę; niepewne = NIE_ZMIERZONO. Zakaz „działa w oknie Tauri”. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i nie generuj pytań ABC; luki rozstrzygaj ZAŁOŻENIEM zapisanym w dokumencie.

BINARNE KRYTERIUM SUKCESU
Wszystkie moduły z zakresu (lub wylistowane jako pominięte z powodem) w `frontend-v2/src/ui/`, każdy z tabelą zmian vs pin, `npm ci && tsc --noEmit && npm run check && vite build` EXIT=0, brama 0 trafień na całym `src/`, harness DOM (tam gdzie możliwy) 0 różnic, mutacje harnessu wykrywane, zero zmian poza allowlistą.

ALLOWLISTA
`src-tauri/frontend-v2/**` (bez `node_modules`/`dist`; `package-lock.json` commituj), `dyspozycje/rust-port/p5/P5-5-PORT-POZIOM2.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P5-5-PORT-POZIOM2-Q1/**`. Zero zmian w `gra/**`, `src-tauri/frontend/**`, `src-tauri/src/**`, `src-tauri/Cargo.*`, `src-tauri/tauri.conf.json`, `rust-port/**`, `.github/**`.
IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`, NIGDY `-A`; logi `*.log` jawnie `git add -f`), PUSH NIE. Jeśli `git commit` zostanie odrzucony — zostaw zmiany w indeksie i opisz.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
