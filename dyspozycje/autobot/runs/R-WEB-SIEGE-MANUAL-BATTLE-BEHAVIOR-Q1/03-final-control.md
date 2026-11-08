STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-MANUAL-BATTLE-BEHAVIOR-Q1
GOAL: Reczna bitwa oblezeniczna (mur/palisada): tarany do bramy, wieza daje wejscie na mur, konnica i rydwany z boku do wylomu; szarza i "atakuj marszem" bez machin = podejscie poza zasieg ostrzalu.
ZMIANY/COMMIT: weryfikowany tip Obrony `91ccecc95` (baza Operatora `48eda8bd8`, baza repo `910083c97`). Commit FC: tylko ten plik. Bez pusha.

ROZSTRZYGNIECIE ZARZUTOW (Evaluator R1)
1. Zrzut przed-A2 == przed-A1: ODDAL. Naprawione w R2 (kamera za wiezami); md5 przed-A2 6f0642b8 != po-A2 961f0679 != A1; samodzielnie sprawdzone, kazdy <= 58 KB.
2. Brak scenariusza lucznicy->korona: ODDAL. Scenariusz A3 (mur+palisada) dodany; samodzielnie PASS (mur, palisada).
3. Rydwany/move/doktryna/AUTO: ODDAL. Scenariusze D1..D3, E1..E2 dodane; samodzielnie PASS: D1 mur, D3 mur, E2 palisada.
4. Regresja przegladarkowa: ODDAL. Obrona uruchomila testy z chromium (natural-near-range-r6, ranged-approach-regression, attack-move-pointer, natural-chariot-r5: PASS), 6 FAIL identycznych przed/po (nie z tej zmiany). Nie powtarzalem w calosci (NIE_ZMIERZONO przeze mnie).
5. Pinezki tekstowe: ODDAL. Zachowanie dowodzi harness zywy PRZED 0 / PO PASS; test jednostkowy to dodatkowa warstwa okablowania (opisane jako takie). Harness poza CI -- ograniczenie jawne, bez wplywu na poprawnosc.
6. AUTO z murem bez machin: ODDAL. Zmierzone przez Obrone: bitwa nie konczy sie w 39 rundach ani PRZED, ani PO (brak pogorszenia); reguly konca bitwy poza zakresem tematu -> kandydat na osobny temat (nie blokuje).
NAPRAW: brak. DO DECYZJI CZLOWIEKA: brak.

WERYFIKACJA WLASNA (swiezy worktree, detached 91ccecc95)
- `git diff --name-status 910083c97 91ccecc95`: tylko allowlista (battleScene.ts, testBattle.ts, main.ts [tylko hak bitwy: ?bare/?rams/?towers/?chariots], 2 narzedzia gra/tools, runs/<ID>/**). Zero zmian: gra-robocza, WERSJE.md, rust-port, src-tauri, ai.ts.
- `git diff --check`: czysto.
- tsc --noEmit (po npm ci --ignore-scripts): EXIT=0.
- siege-manual-battle-behavior-test.cjs: 40 OK / 0 FAIL.
- Harness zywy na swiezym buildzie (vite build --outDir poza repo, Chromium): PASS A3-mury, A3-palisada, D3-mury, D1-mury-attackMove, E2-palisada. (Evaluator R1 dodatkowo potwierdzil A1, A2, B1, B2, C1.)
- Merge probny z origin/main (95a4b25ab): czysty, bez konfliktow (main.ts auto-merge).
- Posprzatane: gra/node_modules, bundle w scratchpadzie poza repo.

TESTY: jak wyzej. NIE_ZMIERZONO przeze mnie: pozostale scenariusze puli (~14 z ~30), pelna regresja przegladarkowa, miasto z mapy swiata, AUTO-batch poza oblezeniem, wiezyczki palisady osobno, AUTO/rydwany z wiezami.
BLOKADY: brak
RUNDY: Final Control po rundzie 2/5
NASTEPNY KROK: integracja orkiestratora: cherry-pick/merge `91ccecc95` (lacznie z c2b65751e, deaf7c268, 48eda8bd8) na origin/main (95a4b25ab); bez zaleznosci kolejnosci wobec origin/rust-port/parity-v2 (b520768b0, zmiany webowe nie dotykaja rust-port). Po wdrozeniu REPIN Rust (rust-port/renderer/src/battle/**) -- notuje orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
