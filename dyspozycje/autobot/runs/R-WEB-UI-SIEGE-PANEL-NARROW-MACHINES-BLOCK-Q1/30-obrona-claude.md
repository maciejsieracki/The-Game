STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-SIEGE-PANEL-NARROW-MACHINES-BLOCK-Q1
GOAL: w oknie 1280x800 i 1366x768 blok „Zbuduj machinę w oblężeniu” ma być w całości widoczny bez przewijania wewnątrz bloku dla 1, 2 i 4 typów; przyciski akcji widoczne i klikalne, dolny pasek i dock niezasłonięte; logika budowy bez zmian (kryterium zawężone przez Operatora do: blok w całości widoczny po przewinięciu treści panelu do dołu, ZAL-1).
BAZA/KANDYDAT: f5125ef165015152ed06e6a77bd15078403920fd (obrona startuje od tego SHA; kod siegeMapPanel.ts bez zmian).

ODPOWIEDZI NA ZARZUTY EVALUATORA (raport 20-evaluator-claude.md, report_sha 470833750):

ZARZUT 1 (literalne „bez wewnętrznego przewijania”, przy scrollTop=0 blok poza widocznym obszarem): ODRZUCAM jako wymóg tej rundy, PRZYJMUJĘ jako fakt.
- Fakt potwierdzony pomiarem (surowe wyjście testu, pole _probeTop, mierzone PRZED przewinięciem, scrollTop=0):
  1280x800: blockTop=502, bodyBottom=497 (1/2/4 typy). 1366x768: blockTop=502, bodyBottom=465 (1/2/4 typy). blockFullyVisibleAtTop=false we wszystkich 6 konfiguracjach.
- Dowód arytmetyczny: treść nad blokiem (stan, kolejka, statystyki, atakujący) zajmuje ok. 289 px wobec 284 px widocznej treści przy 800 px. Blok 4-typowy ma 186 px. Aby blok był widoczny przy scrollTop=0, treść nad nim musiałaby mieścić się w ok. 98 px (284-186), czyli usunięcie lub przeniesienie sekcji stanu/kolejki/statystyk. To zmiana produktowa (co gracz widzi na starcie panelu), nie poprawka układu bloku machin; wymaga decyzji właściciela (ABC). Zmiana wykraczałaby też poza zakres zawężenia GOAL z decyzji właściciela (dotyczyło bloku machin).
- Stąd nie zmieniam kodu w tej rundzie. Proponowane pytanie ABC: patrz UWAGI-DLA-ORKIESTRATORA.

ZARZUT 2 (test nie ma asercji „osiągalne bez przewijania przy scrollTop=0”): PRZYJMUJĘ CZĘŚCIOWO.
- Dodano w gra/tools/siege-panel-machines-block-fit-test.cjs pomiar informacyjny _probeTop (scrollTop, blockFullyVisibleAtTop, blockTop, bodyBottom), wykonywany przed przewinięciem. Pomiar NIE wchodzi do verdictu (bez zmiany checks, żeby nie zmieniać zawężonego kryterium ZAL-1 bez decyzji).
- Twardą asercję „osiągalne bez przewijania” dopiszę dopiero po decyzji ABC: przy obecnym kodzie dałaby FAIL we wszystkich 6 konfiguracjach (to jest treść zarzutu 1).

ZMIANY/COMMIT:
- gra/tools/siege-panel-machines-block-fit-test.cjs: dodany pomiar informacyjny _probeTop (bez zmiany checks/verdict).
- dyspozycje/autobot/runs/R-WEB-UI-SIEGE-PANEL-NARROW-MACHINES-BLOCK-Q1/30-obrona-claude.md (ten raport).
- Kod gry (gra/src/ui/siegeMapPanel.ts) bez zmian względem f5125ef16.
- SHA: patrz pole sha w odpowiedzi StructuredOutput (commit na detached HEAD worktree; nie wypchnięto).

TESTY (uruchomione w tej rundzie; liczby z surowego wyjścia):
- node --check gra/tools/siege-panel-machines-block-fit-test.cjs: SYNTAX_OK.
- npm ci w gra/ (added 71 packages, exit 0); po testach usunąć gra/node_modules.
- npx vite build --outDir <scratchpad>/obrona/dist --emptyOutDir: built in 23.81s, exit 0 (poza repo; bez npm run build/dev).
- siege-panel-machines-block-fit-test.cjs (wynik z dist kandydata + zmiana testu): "verdict": "PASS", exit 0 (6/6 konfiguracji wg obecnego zawężonego kryterium).
- Pomiar informacyjny _probeTop (przed przewinięciem, scrollTop=0): blockTop=502 we wszystkich konfiguracjach; bodyBottom=497 (1280x800) i 465 (1366x768); blockFullyVisibleAtTop=false x6.
- Pozostałe bramki (tsc, 5 referencyjnych, istniejący bottom-clip) NIE uruchamiane ponownie w tej rundzie: kod gry nieruszony, a Operator i Evaluator podali wyniki dla f5125ef16 (tsc exit 0; logic 213/213; tech-tree 20/0; research ALL GREEN; unit-replace 21/21; combat All sanity checks passed). NIE_ZMIERZONO w tej rundzie.

BLOKADY: brak blokad technicznych. Jedyna blokada merytoryczna: decyzja ABC o literalnym wymogu (zarzut 1).

RUNDY: 1/5 (obrona r1). Ostatni werdykt Evaluatora: PASS-WITH-NOTES (zarzut 1 — decyzja ABC albo FC; zarzut 2 — drobny).

NASTĘPNY KROK: Final Control (SONNET) z jawnym pytaniem do właściciela o zakres zarzutu 1 (ABC). Jeśli właściciel wybierze wariant B (dosłowny), osobny temat na przebudowę górnej części panelu; jeśli wariant A, FC przyjmuje bieżący stan i dopisuje twardą asercję po decyzji.

UWAGI-DLA-ORKIESTRATORA:
1. Proponowane pytanie ABC do właściciela (opcje z rekomendacją):
   A (rekomendowana): zaakceptować zawężone kryterium — blok machin w całości widoczny po przewinięciu panelu, bez wewnętrznego przewijania bloku (stan obecny, PASS 6/6).
   B: wersja dosłowna — blok widoczny bez przewijania przy scrollTop=0 — wymaga usunięcia lub przeniesienia sekcji stanu/kolejki/statystyk nad blokiem (ok. 289 px treści nad blokiem wobec 98 px wolnego miejsca dla 4 typów); osobny temat z decyzją, co zostaje widoczne na starcie.
2. Dispatch główny 00-dispatch.md nie istnieje w origin/main (tylko DODATEK na claude/sprawdzenie-funkcjonalnosci-ek4ra0; ten sam stan co w rundzie 1).
3. Zakres poza tematem nie zgłaszany; nie zakładano sesji, zadań ani triggerów.

NIE_ZMIERZONO: Chromium-owy test siege-storm-needs-machines, recruit-reset-close-and-siege-visibility, live-verify-w18-w24 (nie uruchamiane w tej rundzie).

DEPLOY/PUSH: NIE WYKONANO
