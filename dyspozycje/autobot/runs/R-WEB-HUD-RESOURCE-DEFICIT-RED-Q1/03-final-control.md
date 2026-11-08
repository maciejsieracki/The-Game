STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-HUD-RESOURCE-DEFICIT-RED-Q1
GOAL: Czerwona czcionka zamiast złotej w górnym panelu HUD przy niedoborze pieniędzy (Skarbiec), żywności (Spichlerz) lub surowca (Surowce). Tylko prezentacja.

WERDYKTY NA ZARZUTY (Final Control, runda 2/5, kod: 8d31f1354):
1. Fałszywy alarm przy zapasie 0: ODDAL. runwayShort() w 8d31f1354: zapas<0 alarm; bilans>=0 brak alarmu (także zapas 0); zapas<=0 przy bilansie<0 alarm. Testy goldZero/foodZero (brak alarmu) i goldZeroNeg/foodZeroNeg/goldNegStock (alarm) obecne. Nie zmierzone na żywej grze (zakaz build/dev w gra/).
2. Kontrast: ODDAL. Kolor #ee6c6c; mój przelicznik WCAG: ~5,8:1 na (20,26,38), ~4,9:1 na (34,40,52). Test wymaga >=5,0. Liczby Operatora r2 (5,67/4,81) różnią się nieistotnie, wszystkie >= AA.
3. Hot-seat surowców: ODDAL. main.ts liczy niedobór z buildEmpireResourceRows(ownerId) dla ownerId!=0 (read-only), kompiluje się (tsc EXIT=0). Złoto/żywność z singletonów (istniejący dług, jawnie opisany). Nie zweryfikowane żywo.
4. Karty/panel: ODDAL. empireDetailPanel.ts ma własny stan 'bad'; karty TopBar w cityPanel.ts to karty lokalne miasta bez logiki koloru niedoboru. Brak zrzutu chipa Surowce (zasłonięty mockiem) potwierdzony tylko asercją DOM. Próg N=5 = ZAŁOŻENIE, do akceptacji właściciela (nie blokuje).
Brak NAPRAW -> PASS-WITH-NOTES.

WERYFIKACJA WŁASNA:
- Allowlista: git diff --name-only b89ecee44 8d31f1354 = hud.ts, hudChip6c.ts, main.ts, nowy test, run-dir. Brak gra-robocza, WERSJE.md, rust-port, src-tauri. git diff --check czysty.
- hud-resource-deficit-red-test.cjs na 8d31f1354: 41 pass / 0 fail, EXIT=0.
- tsc --noEmit: EXIT=0.
- Nie powtórzono: mutacji, regresji 28 testów (opieram się na gate-*.txt).

INTEGRACJA: SHA kodu do integracji = 8d31f1354 (baza Operatora 19229db5d, kod r1 8ef220a0e), plus commit raportu FC na nim. Baza b89ecee44; origin/main = a4eda2b7e (tylko deploy(robocza) powyżej bazy, brak kolizji w gra/src/ui/hud.ts, hudChip6c.ts - zweryfikować przy cherry-pick). Kolejność względem origin/rust-port/parity-v2 (b520768b0): najpierw integracja weba do main, potem REPIN UI (hud.ts i hudChip6c.ts mają kopie bajtowe w Rust, partie UI-2-A i UI-2-C) z wpisem w LEDGER; Rust nie ruszany w tym temacie.
DEPLOY/PUSH: NIE WYKONANO
