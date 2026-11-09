STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ALLIANCE-THRESHOLD-130-TRUST-90-Q1
GOAL: sojusz wymaga Relacji >= 130 (było 151) i Zaufania >= 90 (było 91 w kodzie/JSON; dispatch podawał 100); przy spełnieniu obu progów bramki siły nie blokują sojuszu
ZMIANY/COMMIT: BAZA origin/main 12fa64c97 (zawiera 138ed3e47). Pliki: gra/data/diplomacy.json (progSojuszRelacja 130, progUmowaMinRelacja 130, progSojuszZaufanie 90), gra/data/diplomacy-acceptance-points.json (prog_relacja sojuszy 130), gra/src/game/diplomacy.ts (domyślne DIPLOMACY_PARAMS + nowa allianceCoreMet), gra/src/game/diplomacy-proposals.ts (case sojusz_*), gra/src/game/diplomacy-locks.ts i gra/src/ui/diplomacyAudience.ts (tylko komentarze), testy w gra/tools/. SHA: patrz odpowiedź końcowa.

## Co zrobiono
1. Progi: Relacja 151 -> 130, Zaufanie 91 -> 90. Dispatch pisał "z 100"; faktyczna wartość bazowa to 91 (zmierzone w JSON i kodzie) - ustawiono 90 zgodnie z decyzją właściciela.
2. progUmowaMinRelacja: używany WYŁĄCZNIE przez ścieżki sojuszu (diplomacyTreatyMinRelacja woła tylko: diplomacy.ts aiDiplomacyStance/sojusz, diplomacy-proposals.ts sojusz, ai.ts zaproponuj_sojusz; plus bramka "słaby proponent"). Inne umowy (NAP 110/30, granice 100/45, handel 0, tech 70) NIE zmienione. Parametr obniżony razem z progSojuszRelacja do 130 (jak dotąd równe).
3. Rdzeń sojuszu "130/90": nowa funkcja allianceCoreMet(zaufanie, score, relThreshold, params, zaufanieEase). Gdy Zaufanie >= progSojuszZaufanie (po słodziku) i Relacja >= progSojuszRelacja (po słodziku i delcie agresora, nie poniżej progUmowaMinRelacja), evaluateProposal dla sojusz_pelny/sojusz_defensywny POMIJA: hegemona (milRatio <= 0.42), karę siły respondenta (penaltyZ/penaltyScore), bramkę "za słaby proponent" oraz bramkę gotowości AI (willingnessAlly >= progSojuszWillingnessMin). Zostają: Wiarygodność >= wiarygodnoscProgSojuszMin, wojna, duplikat traktatu, delta flagi agresora (wliczona do progu Relacji).
4. Komunikat blokady PL w silniku: "Sojusz wymaga Relacji 130 i Zaufania 90 (masz Zaufanie 89)" / "(masz Relację 129)". Kafelek akcji w UI (dualGate) pokazuje już "wymaga Zaufania 90 (masz X) i Relacji 130 (masz Y)" z progów silnika - bez zmian kodu, zmienia się przez dane.

## Które bramki siły odrzucały sojusz mimo Zaufania >= 90 i Relacji >= 130 (przed zmianą, po obniżeniu progów)
- Hegemon (AI >= ok. 2,4x silniejsze od proponenta): odrzut bezwarunkowy. Teraz pomijany przy rdzeniu.
- Kara siły respondenta: podnosi wymagane Zaufanie (do +ok. 38) i Relację (do +44) gdy proponent słabszy. Teraz pomijana przy rdzeniu.
- Gotowość AI (willingnessAlly >= 0.68): przy 130/90 wynosi ok. 0.54-0.60 (scoreFactor = 0 na progu), więc BEZ pominięcia sojusz przy samych 130/90 byłby niemal zawsze odrzucony (poza civ z bonusem lojalności). Teraz pomijana przy rdzeniu.
- Słaby proponent: pokryty progiem 130 (score < progUmowaMinRelacja).

## Zgłoszenia / ryzyka (decyzja produktowa dla ABC - NIE rozstrzygnięte przez Operatora)
A. Pominięcie bramki gotowości AI i hegemona to REALNA zmiana balansu: każde AI zaakceptuje sojusz od gracza przy 130/90 niezależnie od siły. Zgodne z interpretacją dispatchu ("bramka siły NIE może blokować"); jeśli właściciel woli zachować gotowość AI, alternatywa: zostawić tylko pominięcie hegemona i kary siły.
B. AI->gracz / AI<->AI (ai.ts, Priorytet 5 zaproponuj_sojusz): używa tych samych progów JSON (progSojuszRelacja, progUmowaMinRelacja, progSojuszZaufanie przez diplomacyAllianceMinZaufanie), ale rdzeń NIE jest tam wprowadzony - AI nadal proponuje wg własnej gotowości/kary siły/hegemona (tylko progi niższe). Akceptacja propozycji AI->AI idzie przez tę samą evaluateProposal, więc rdzeń tam działa.
C. Efekt uboczny: ai.ts:6967 `napIndefinite = score >= progSojuszRelacja` (NAP bezterminowy zamiast 15 tur) spada z 151 do 130 - pakt proponowany bezterminowo od Relacji 130. Zgłaszam do akceptacji; nie zmieniałem (brak osobnego parametru).
D. Siostrzane miasta-państwa (sisterAllianceDiplomacyParams): skala x0.3 zastosowana do nowych progów (Zaufanie 27, Relacja 39); rdzeń tam nie działa (idzie przez aiDiplomacyStance). Zachowanie względne bez zmian.
E. Przesunięcie progów zależne od trudności (+-10) działa jak dotąd na nowych wartościach.
F. Dług poza allowlistą: gra/src/data/wikiBundle.json i dokumentacja wiki nadal podają "Relacja 151 / Zaufanie 91" - wymaga osobnego odświeżenia (generowany bundle).

## Testy (uruchomione w worktree z symlinkiem node_modules do /tmp/claude-0/nm, usuniętym po testach)
- diplomacy-test 148/0, diplomacy-locks-test 88/0, diplomacy-proposal-test 0 FAIL (część jsdom: NIE_URUCHOMIONE - jsdom missing), diplo-alliance-gate-test 18/0 (nowe: 128/130, 89/90, 90+40), city-state-alliance-test 74/0, diplo-aggressor-unit-test 73/0, diplo-aggressor-mutation-test 19/19 KILLED, diplo-aggressor-wiring-test 15/0, diplo-nap-trust-30 25/25, diplo-nap-border-threshold 14/0, diplomacy-acceptance-points 304/0, diplomacy-audience-actions 20/0, diplomacy-ai-balance 36/36, diplomacy-treaties 17/17, diplomacy-war-gates 22/0, diplomacy-display 35/0, diplomacy-negotiation-table 62/62, diplomacy-sensible-deals 63/0, wiarygodnosc 270/0, handel-wymiana-tech-gate 35/0, diplomacy-relacje-ai-ai-audiencja 20/20, ai-test 289/0.
- Nowe przypadki progu 130/90 (w diplomacy-proposal-test.cjs): granice 129/130 i 89/90, hegemon przy 100/175 accept, hegemon przy zaufaniu 89 reject, hegemon przy relacji 129 reject, dokładnie 90+130 accept, komunikaty PL, słaby proponent 0.4 accept, AI 2x accept.
- Zmienione oczekiwania testów: literały 151/91 -> 130/90 (diplomacy-test, diplomacy-locks-test, city-state-alliance-test, ai-test komentarz); diplo-aggressor-unit-test: pomiar progu przy Respekcie 50/50 (wcześniej minimum po wszystkich Respektach łapało ulgę z różnicy Respektu); 3 testy "reject przy Relacji 150" przesunięte na 129; 2 testy odrzutu (hegemon 100/175, AI 2x 100/167) odwrócone na accept zgodnie z nowym GOAL.
- tsc --noEmit: zero błędów w src/game/diplomacy*; pozostałe błędy to brak @types/three (środowisko, niezwiązane).
- NIE_URUCHOMIONE: testy jsdom (diplomacy-treaty-sweetener-edit, diplomacy-lista-podglad-przed-wizyta, część proposal), testy live/Chromium. Weryfikacja wizualna kafelka w przeglądarce: NIE_ZMIERZONO (zmiana wartości progów w istniejącym komponencie).
- PRE-EXISTING FAIL (nie z tej zmiany, zweryfikowane na pliku bazowym HEAD): dyplo-bilans-gate-n-e1-reprodukcja-runda2-test (mutacja A liczy 30 zamiast 29 pól pwBalance) - dług testowy do osobnego tematu.

## LEDGER (REPIN Rust)
rust-port dyplomacja: progSojuszRelacja 151->130, progUmowaMinRelacja 151->130, progSojuszZaufanie 91->90, acceptance-points prog_relacja sojusz_pelny/defensywny 151->130, nowa reguła allianceCoreMet (pominięcie hegemon/kara siły/słaby proponent/willingness przy rdzeniu 130/90 w evaluateProposal sojusz_*), nowy tekst odrzutu "Sojusz wymaga Relacji N i Zaufania M (masz ...)". Wymaga REPIN po integracji.

BLOKADY: brak (DECISION_REQUIRED nie wystawiono; punkty A-C do ABC orkiestratora)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator R1
DEPLOY/PUSH: NIE WYKONANO
