STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AGGRESSOR-MARKER-Q1
GOAL: Przy nazwie cywilizacji na liście dyplomacji (HUD) mały znacznik „Agresor (N)", N = pozostałe tury flagi agresora; widoczny tylko przy aktywnej fladze (decyzja właściciela ABC=A, 2026-10-31).

ZMIANY/COMMIT:
- Ustalenie (recon): znacznik „Agresor" bez licznika (tooltip „do tury N") JUŻ istniał na main (R-WEB-WAR-AGGRESSOR-FLAG-Q1: gra/src/ui/diplomacyPanel.ts `agresorBadgeHtml`, wołany w `renderRow`; dane z gra/src/main.ts:7350). Zmiana = licznik pozostałych tur + nowy tooltip + test. Gałąź `web-wip/AGGRESSOR-r2` zawiera tylko starszą wersję mechaniki flagi (a8675d693/7e3d6bc6b, już w main) — niczego z niej nie przenoszono.
- gra/src/ui/diplomacyPanel.ts: pole `DiploRelation.agresorDoTury` -> `agresorPozostaleTury`; `agresorBadgeHtml(pozostaleTury)` renderuje „Agresor (N)" (pusty dla undefined/NaN/Infinity/<1; ułamek obcinany), tooltip „Wypowiedział wojnę — konsekwencje dyplomatyczne przez N tur", `role="note"` + `aria-label="Agresor, pozostało tur: N"`. Styl bez zmian (ta sama czerwień, bez border/outline/position — obwódka/wimpel cywilizacji nietknięte).
- gra/src/main.ts:7350 (minimalnie): `agresorPozostaleTury: (doTuryFlagiAgresora(otherId, turn) ?? turn) - turn || undefined` (flaga aktywna <=> turn < doTury, więc N >= 1).
- gra/tools/diplo-aggressor-wiring-test.cjs, gra/tools/diplo-aggressor-ui-live-test.cjs: dostosowane do nowego formatu.
- Nowe: gra/tools/diplo-aggressor-marker-unit-test.cjs (21), diplo-aggressor-marker-live-test.cjs (24, Chromium), diplo-aggressor-marker-mutation-test.cjs (8 mutacji).
- Zero zmian: gra-robocza/**, WERSJE.md, rust-port/**, auto-improvements.ts, logika flagi agresora (diplomacy*.ts, ai.ts).
- COMMIT: SHA w komunikacie końcowym (commit zawierający ten raport; SHA nie może być zapisany w samym commicie).

TESTY (PRZED = HEAD 0f9f60a10 w kopii archiwum, PO = zmiany; logi `evidence/gate-pre-*.txt`, `gate-po-*.txt`, każdy z linią EXIT=):
- tsc --noEmit: PRZED EXIT=0, PO EXIT=0
- diplomacy 148/0 -> 148/0; war-era-counter 82/0 -> 82/0; ring (unit-owner-emblem-ring-civ-color) 15/0 -> 15/0
- autoimprove-stages-q1 184/0 -> 184/0; auto-improvements 46/0 -> 46/0; ai-improvements 53/0 -> 53/0
- fort-outpost-hard-territory 80/0 -> 80/0; saveload-praca-pool-live 13/0 -> 13/0; defeat-last-city 14/0 -> 14/0
- diplo-aggressor-unit 73/0 -> 73/0; diplo-aggressor-wiring 15/0 -> 15/0 (po dostosowaniu asercji)
- civ-matrix 42/1, ai-test: NIE URUCHAMIANE (znane czerwone, poza zakresem).
- NOWE: marker-unit 21/0; marker-live (Chromium, vite build do scratch poza repo, bez `npm run build`) 24/0 — T0 brak flagi bez znacznika; T1 „Agresor (20)" + tooltip + brak nakładania na nazwę/wimpel; T2 licznik 19/18/17 po realnych końcach tury; T3 zapis/wczytanie (realne buildSaveGameSnapshot -> restoreGameFromSave) zachowuje znacznik z tym samym N; T4 „Agresor (1)" na turę przed końcem, po turze == doTury znacznik znika; T5 casus belli (AI2) bez flagi i znacznika; zero pageerror/console.error. Zaktualizowany stary aggressor-ui-live 7/0.
- MUTACJE: statyczne 8/8 KILLED (`gate-mutacje-statyczne.txt`); live: usunięcie wywołania znacznika z renderRow -> marker-live FAIL (T1 tekst null; `gate-mutacja-live-brak-znacznika.txt`). Źródło przywrócone (git diff potwierdza tylko zamierzone zmiany).
- Zrzuty: evidence/marker-agresor-n20-{ekran,wiersz}.png, marker-agresor-po-turach-*.png (N=17), marker-po-wczytaniu-*.png (N=17). Zrzuty po turach robione z tymczasowo podniesionym z-index panelu (wynik auto-bitwy przykrywał HUD; stan gry nietknięty).

BLOKADY: brak.
NOTATKI (PASS-WITH-NOTES):
1. Testowy setup: `?playtest=mapa` kończy grę dominacją w turze 2, więc test używa istniejącego haka `__rebelProtectionTestDebug.disableVictoryCheckForTest()` (jak forced-war-*-live). Zapis/wczytanie przez istniejący hak `__pracaPoolSaveLoadTestDebug.roundTrip()`; w main.ts nie dodano żadnego nowego haka.
2. Znacznik w układzie renderuje się POD nazwą (zawija się w `.cd-civ-wrap`) — to zachowanie istniejącego wiersza, nie zmieniane; test sprawdza brak nakładania.
3. Zmiana nazwy pola `agresorDoTury` -> `agresorPozostaleTury` dotyka kontraktu `DiploRelation` (tylko main.ts i panel go używają — git grep).
4. Pytania ABC: brak (żadnej kolidującej starej reguły nie znaleziono).
5. Sprzątanie: gra/node_modules i scratch usunięte; stary plik evidence R-WEB-WAR-AGGRESSOR-FLAG-Q1/aggressor-panel.png przywrócony (test go nadpisywał).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5), ten sam ID R-WEB-AGGRESSOR-MARKER-Q1.
DEPLOY/PUSH: NIE WYKONANO
