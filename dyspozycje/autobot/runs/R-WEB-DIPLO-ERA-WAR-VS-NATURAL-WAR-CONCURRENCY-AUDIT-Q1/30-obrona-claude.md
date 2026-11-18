STATUS: DECISION_REQUIRED (werdykt audytu bez zmian; obrona wykonana, runda 2)
DOMAIN: GAME (audyt, bez zmian logiki gry)
TEMAT: R-WEB-DIPLO-ERA-WAR-VS-NATURAL-WAR-CONCURRENCY-AUDIT-Q1
GOAL: Obrona raportu 10-operator-claude.md (kandydat b34d940f4) wobec zarzutów Evaluatora 0529881c6: przyjąć albo odrzucić z dowodem każdy zarzut.
ZMIANY/COMMIT: raport 30-obrona-claude.md (ten plik) + poprawka probe `gra/tools/era-war-vs-natural-war-concurrency-measure.cjs` (bez unlink, bundle w pamięci). Brak zmian w gra/src. SHA: czubek commita, podany w StructuredOutput.
TESTY:
- Probe przed poprawką i po: `node tools/era-war-vs-natural-war-concurrency-measure.cjs` EXIT 0 w obu przypadkach; wynik identyczny bajtowo (`cmp` = IDENTICAL, 10 wierszy).
- `npm ci --ignore-scripts` w gra/: EXIT 0, 71 pakietów (potrzebne do esbuild; node_modules nieśledzone).
- tsc/logic-test/tech-tree/research/unit-replace/combat: NIE DOTYCZY (brak zmian w gra/src).
- Symulacja 3x150 tur: NIE ZMIERZONO (patrz zarzut 4).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Cytat ai.ts:7483-7486 to komentarz (earlyNoMajorWarWindow), nie warunek. Rzeczywisty warunek wypowiedzenia wojny naturalnej to ai.ts:7501-7511: !stanWojny, !peaceLocked, !hasNapTreaty, !earlyNoMajorWarWindow, willingnessWar>0, zaufanie<PROG_WOJNA_ZAUFANIE (30), aiMaPrzewageMilitarna (progPrzewagiWojnyProc), effAgresja>=effProgWojnaAgresja. Wniosek pozostaje: ai.ts nie sprawdza liczby wojen celu ani tego, czy cel jest w wojnie epoki; jedyna bramka liczby wojen to main.ts:46023-46035 (evaluateInterCivWarGate, wywoływana w pętli dipCmds, main.ts:45991).
2. PRZYJMUJĘ. Uzupełnione ustalenia (dosłowne lub z numerem wiersza REJESTR-PROSB-I-ZADAN.md):
   - FAL 536 (wiersz 9145): Brąz/Żelazo ponownie włączone. Nie dotyczy limitu.
   - FAL 546 (wiersz 9178), R-WEB-ERA-WAR-IGNORE-TREATIES-Q1: „wojna epoki powinna omijać wszelkie umowy między cywilizacjami poza tylko sojuszem".
   - FAL 547 (wiersz 9189), R-WEB-ERA-WAR-DELAYS-Q1: Kamień pod bramką R1 (tura 40); Brąz i Żelazo 20 tur po wejściu w epokę; zwykłe wypowiedzenia nadal pod R1.
   - FAL 558 (wiersz 9309), ERAPOOL: gracz z ≥20 turami w Brązie wchodzi do puli mimo wojny Kamienia; wojna Kamienia gracza liczy się w slocie 0:1.
   - R8 (forced-war-common.ts:202-208): wojna epoki zablokowana przy Relacji ≥100. To nie jest limit liczby wojen.
   - REJESTR wiersz 5012 (R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1): ECHO właściciela „gracz traktowany ... jak każde AI — mechanizm domino ZNIKA"; recon (E): „BRAK limitu jednoczesnych wojen per cywilizacja".
   - REJESTR wiersze 8190-8197: Q1 ABC 2026-09-10 rozszerza bezpiecznik 2 miasta/20 tur na zwykłe wojny AI↔AI. Nie dotyczy liczby wojen.
   Liczby trafień (REJESTR / PYTANIA-OTWARTE / wszystkie runs/*.md): `jedn[aey] wojn` 0 / 0 / 7; `naraz` 34 / 50 / 246; `naturaln` 11 / 26 / 101; `wojn[aey] naturaln` 0 / 0 / 1; `wojn[aey] epoki` 16 / 0 / 69; `COUNTER-Q1` 0 / 0 / 13; `PerCivPerEra` 0 / 0 / 5.
   Wniosek: brak połączonego limitu „jedna wojna epoki + jedna naturalna" od Brązu. Potwierdzone.
3. PRZYJMUJĘ. Źródło zmiany R3: runs/R-WEB-ERA-WAR-COUNTER-Q1/00-dispatch.md:6, wyzwalacz właściciela 2026-10-30: „Każda cywilizacja może dostać tylko jedną wojnę epoki. Także gracz." Ta decyzja dotyczy wyłącznie wojen epoki. Brak wpisu w REJESTR (COUNTER-Q1: 0 trafień) — zgłaszam w UWAGACH.
4. PRZYJMUJĘ. Symulacji 3x150 nie wykonano: harness `gra/tools/ai-economy-measure-run.cjs` wymaga żywego bundla vite i headless Chromium z 450 realnymi endTurn. W tej rundzie nie mieściło się to w limicie 590 s na wywołanie bez tła. Wynik: NIE ZMIERZONO. Probe ma ręcznie wpisane wejścia (targetWarCount:1, eraTag:null), nie czyta stanu gry i nie obejmuje ścieżki decyzji ai.ts. Werdykt „scenariusz dopuszczony" jest więc wnioskiem z kodu i bramki, nie pomiarem. Z probe: Kamień, cel AI z wojną — `stone_limit_target_r2` (t60); Brąz i Żelazo — `ok` (t60). Czy scenariusz zgłoszenia wystąpił w grze właściciela: NIE ZMIERZONO (nie znana epoka ani tura).
5. PRZYJMUJĘ i naprawiam. Probe nie używa już fs.unlinkSync ani pliku tymczasowego: esbuild z write:false, wykonanie przez Module._compile. Wynik bajtowo identyczny z wersją sprzed poprawki.

WNIOSKI (bez zmian wobec 10-operator-claude.md):
- Błąd kodu względem ustaleń: NIE STWIERDZONO. Brak ustalenia: TAK (połączony limit wojen epoki i naturalnej od Brązu).
- Werdykt: status DECISION_REQUIRED, pytanie ABC zostaje jak w 10-operator-claude.md (opcje A/B/C, rekomendacja A).

BLOKADY: brak (decyzja właściciela wymagana w ABC).
RUNDY: 2/5 (Operator r1 = 10-operator; obrona r2 = ten plik).
NASTĘPNY KROK: decyzja właściciela ABC; bez decyzji nie zmieniać kodu. Evaluator r2 może zweryfikować poprawki.

UWAGI-DLA-ORKIESTRATORA:
- Zmiana R3 na licznik per cywilizacja nie ma wpisu w REJESTR (COUNTER-Q1: 0 trafień).
- Poza worktree zostały pliki pomocnicze: /home/user/The-Game/.claude/worktrees/wf_baseline.txt (wynik probe przed poprawką) oraz /tmp/x (log npm ci). Nie usunięto (zakaz rm/unlink w dispatchu); do sprzątania przez orkiestratora.
- gra/node_modules zainstalowane przez npm ci (nieśledzone, ignorowane przez git).

DEPLOY/PUSH: NIE WYKONANO
