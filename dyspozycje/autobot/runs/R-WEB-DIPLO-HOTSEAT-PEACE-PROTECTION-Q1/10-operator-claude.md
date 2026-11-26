STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-HOTSEAT-PEACE-PROTECTION-Q1
GOAL: pokój między dwoma fotelami (hotseat) ma tę samą ochronę czasową co pokój z AI (10 tur).
ZMIANY/COMMIT: gra/src/main.ts (tylko humanPeaceRejectReason, +8/-2), gra/tools/hotseat-peace-protection-test.cjs (nowy), gra/tools/diplo-human-peace-no-war-test.cjs (dodana atrapa bramki czasu w deps; asercje bez zmian), dyspozycje/autobot/runs/R-WEB-DIPLO-HOTSEAT-PEACE-PROTECTION-Q1/10-operator-claude.md (nowy). Baza: b1e4e04ab. Zero zmian w gra/data, WERSJE.md, gra-robocza, gra-kanon, rust-port.

## Ustalenia z kodu (premisa dispatchu sprawdzona)

1. POST-POKOJOWA OCHRONA 10 TUR JUŻ DZIAŁA dla pary człowiek↔człowiek. Akceptacja pokoju z fotela (`respondToHumanProposal`, gałąź `zaproponuj_pokoj`) i wszystkie inne ścieżki zawarcia pokoju wołają `finalizePeaceTreatyBetween` (main.ts ok. 12957), które ustawia `startPeaceTreatyLock` z domyślnym `PEACE_TREATY_LOCK_TURNS = 10` (diplomacy-peace-lock.ts:13). Wypowiedzenie wojny blokują `playerDeclareWarOnOwner` (`isPeaceLockedBetween(ME(), ownerId)`) i `ownerDeclareWarOn` (`isPeaceLockedBetween`). Sekcja DODATEK o „braku 10 tur po pokoju w hotseat” jest więc NIEZGODNA z kodem; nie zmieniano logiki po pokoju.
2. LUKA P21b, która była realna (zgodnie z dyspozycją analizy WOJNA-WASALIZACJA-I-POKOJ-MIEDZYLUDZKI-2026-11-26 §3.2/§5): dla pary dwóch fotelów NIE było bramki PEACE_PROPOSAL_MIN_WAR_TURNS (10 pełnych tur wojny przed pokojem), którą ma pokój z AI (`peaceProposalIsTooEarly`). Przyjęto odpowiedź właściciela 4A jako „ta sama reguła i licznik co z AI” (pytanie §3.3 analizy, wariant A).

## Zmiana

`humanPeaceRejectReason` (używane przez `proposeToHuman` i przez `respondToHumanProposal` przy accept): po sprawdzeniu „brak wojny” dodano bramkę `peaceProposalIsTooEarly(from, to, 'pokoj')` z komunikatem identycznym jak dla AI: „Pokój i rozejm będą dostępne po 10 pełnych turach wojny”. Brak nowej stałej (`PEACE_HUMAN_MIN_TURNS` nie istnieje; wartość z `PEACE_PROPOSAL_MIN_WAR_TURNS`). Rozejm (`rozejm`) i handel nie są objęte, bo ścieżka hotseat dla nich nie ma bramki również po stronie AI (poza zakresem tej rundy).

## Test

`gra/tools/hotseat-peace-protection-test.cjs` (nowy):
- zachowanie: wyciąga PRODUKCYJNE ciało `humanPeaceRejectReason` z main.ts; stałe czytane z plików src; przypadki: pokój bez wojny (powód „brak wojny”), wojna 0 tur i 9 tur (odrzucone z komunikatem), 10 tur i 15 tur (dopuszczone),
- kontrakt źródłowy: bramka w `humanPeaceRejectReason`, strażnik przed `finalizePeaceTreatyBetween` w `respondToHumanProposal`, `startPeaceTreatyLock(…, turn, lockTurnsOverride)` w `finalizePeaceTreatyBetween`, `PEACE_TREATY_LOCK_TURNS = 10`, strażniki `isPeaceLockedBetween` w `playerDeclareWarOnOwner` i `ownerDeclareWarOn`, brak osobnej stałej hotseat,
- mutacja: usunięcie bramki czasu z kopii źródła MUSI dać czerwone (zachowanie i kontrakt).
Wynik: PASS=4 FAIL=0 (zachowanie 0 odchyleń, kontrakt 0 odchyleń, mutant: 2 odchylenia w zachowaniu, 1 w kontrakcie).

`gra/tools/diplo-human-peace-no-war-test.cjs`: istniejący test stał się wymagający nowej zależności (`peaceProposalIsTooEarly`); dodano atrapę `() => false` tylko dla strażnika „brak wojny” (osobny test wyżej pokrywa bramkę czasu). Wynik: PASS=13 FAIL=0 (przed zmianą także 13/0 po poprawce deps; bez poprawki wykonanie padało na braku funkcji).

## Bramki (liczby z surowego wyjścia, tree = worktree po zmianie)

- `npx tsc --noEmit`: exit 0, 0 linii błędów
- logic-test: exit 0; ostatnia linia PASS [213]
- tech-tree-test: exit 0 (bez linii podsumowania w wyjściu)
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- combat-test: exit 0, „All sanity checks passed.”
- ai-test: 297 passed, 0 failed
- war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
- unit-replace-test: exit 0; unit-replace-army-multi-select-test: exit 0; unit-replace-full-cost-test: 40/0; unit-replace-multitype-walk-test: 25 OK/0 FAIL; unit-replace-promotion-table-test: PASS, brak cykli; unit-replace-archer-slinger-test: 51 OK/0 FAIL
- diplo-war-tribute-once-test: PASS=8 FAIL=0
- diplo-human-peace-no-war-test: PASS=13 FAIL=0
- hotseat-peace-protection-test (nowy): PASS=4 FAIL=0
- hotseat-etap6d-diplomacy-engine-test, hotseat-etap6d-podetap-a-test, hotseat-etap6d-podetap-e-source-test, war-end-vassal-human-probe-test: exit 0 (wyjście bez linii WYNIK)
- peace-vazne-always-test: CZERWONE (1): mutant M1 „fragment nie istnieje w main.ts” — wzorzec z 10 spacjami wcięcia, a w bazie b1e4e04ab `grep -c "^          logPeaceVazne($"` daje 0. Błąd istnieje w bazie PRZED zmianą (moja zmiana nie dotyka tego miejsca). NIE NAPRAWIANO (poza allowlistą tematu).

## Niewykonane / NIE ZMIERZONO

- hotseat-etap8-dyplomacja-dane-test i hotseat-etap8-dyplomacja-ui-test: scenariusz przeglądarkowy (Chromium) nie dochodzi do ekranu startu (`.civ-newgame .start` timeout, BLOCK infra). Nie zmierzono w bazie; nie uruchomiono ponownie.
- hotseat-etap6d-podetap-b-exec-test, hotseat-etap6d-podetap-d-exec-test: po `npm ci` w worktree nie uruchomiono (nie było czasu/wyjścia w tej rundzie); nie zmierzono.
- hotseat-etap6d-podetap-b-live-test: nie uruchomiono (live).
- Żywa gra w przeglądarce (hotseat, pokój przed 10. turą): NIE ZMIERZONO.
- Lista propozycji w HUD (`interHumanDiplomacyHud.ts`) nie pokazuje licznika „dostępne za N tur” — komunikat pojawia się dopiero po próbie (jak w zwykłym UI AI przy wiadomości). Brak licznika = świadomie poza zakresem.

## Uwagi dla orkiestratora

- Dispatch zawiera sprzeczność: GOAL mówi o ochronie PO pokoju (już istnieje), a odp. 4A dotyczy bramki PRZED pokojem (wprowadzona). Przyjęto powyższe założenie. Jeśli właściciel miał na myśli inne zachowanie, wymagane potwierdzenie.
- Nie dotknięto gałęzi wojny wymuszonej (force=true, ownerDeclareWarOn, ownerDeclareWarOn z rebelią) — bramka dotyczy wyłącznie `humanPeaceRejectReason`.
- Node_modules w gra/ tworzone przez `npm ci` w worktree; usunięte po bramkach.

NASTĘPNY KROK: Final Control: przegląd zmiany w humanPeaceRejectReason i testu nowego; decyzja orkiestratora co do peace-vazne-always M1 (pre-existing).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
