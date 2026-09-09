STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-E-Q1
GOAL: Migracja modułu „stołu negocjacyjnego" (`negotiationTable`, 14 funkcji) na
`isMe()`/`ME()` — kontynuacja Etapu 6d.

OBRONA (per zarzut, R-PROC-AUTOBOT §3c):

ZARZUT 1 (brak raportu Operatora) — PRZYJMUJE, naprawione w tej rundzie.
Rzeczywiście `01-operator-runda1.md` nie istniał w chwili zgłoszenia do Evaluatora — błąd
proceduralny, nie merytoryczny (praca kodu i testów rundy 1 była realnie wykonana i
niezmieniona przez tę naprawę). Zapisano teraz `01-operator-runda1.md` z treścią odtworzoną
z `git diff`, zawartości plików testowych i faktycznie wykonanych komend tej rundy — zero
zmian w kodzie produkcyjnym w ramach tej naprawy. Dowód: plik istnieje pod
`dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-PODETAP-E-Q1/01-operator-runda1.md`.

ZARZUT 2 (bramka jednostkowa silnikowa nic nie wykonuje, tylko regex na tekście) —
PRZYJMUJE, naprawione w tej rundzie.
Zarzut trafny: `hotseat-etap6d-podetap-e-source-test.cjs` (pozostawiona bez zmian, nadal
77/77 — pokrywa PRZED/PO na źródle, ale to NIE jest wykonanie) rzeczywiście nigdy nie
importuje ani nie uruchamia main.ts. Dodano NOWY plik
`gra/tools/hotseat-etap6d-podetap-e-exec-test.cjs`, który dla 4 funkcji explicite zwolnionych
przez dispatch z Chromium (`collectTurnEvents`, `collectOpenDiploProposalQueue`,
`resolvePendingNegotiationsForOwner`, `resolveNegotiationEntryAt`) wycina ich PRAWDZIWE ciało
ze źródła main.ts (ten sam brace-matched ekstraktor co source-test.cjs — złe granice funkcji
złapałyby OBA testy, nie tylko ten), transpiluje WYŁĄCZNIE adnotacje TS przez
`esbuild.transformSync` (bez zmiany ani jednej linii logiki) i WYKONUJE realnie przez
`new Function(...)` z mockami jako wolnymi zmiennymi (tablice/Mapy/Sety mutowane PRZEZ
wykonanie, spy zapisujące argumenty) — nie reimplementacją logiki tych funkcji. Każdy blok
uruchamia się dwukrotnie: z PRAWDZIWYM `isMe`/`ME` (musi dać oczekiwany efekt) i z
WSTRZYKNIĘTĄ MUTACJĄ `isMe≡false`/`ME≡0` (musi się zaczerwienić) — dowód nietautologiczności
żądany w dispatchu ("reguła przeciw samooszukiwaniu"), analogiczny do dowodu PRZED/PO w
source-test.cjs, ale na REALNYM wykonaniu, nie na tekście.
TESTY: `node tools/hotseat-etap6d-podetap-e-exec-test.cjs` → 18/18 PASS (rozszerzone do
24/24 po ZARZUCIE 3, patrz niżej). Przykładowy dowód realnego wykonania (nie regexu):
`ownerDeclareWarOn` w `resolveNegotiationEntryAt` wywołane z drugim argumentem `ME()`
realnie policzonym na `7` (sztucznie wybrany PLAYER≠0 w teście — gdyby gdzieś pozostał
hardkod `0`, test by go złapał), nie odczytane z tekstu.

ZARZUT 3 (`handleNegotiationCounter` bez żadnego dowodu wykonania) — PRZYJMUJE częściowo,
częściowo naprawione w tej rundzie, reszta jawnie otwarta.
Zarzut trafny: `hotseat-etap6d-podetap-e-live-test.cjs` nie zawiera ani jednego kliknięcia
kontroferty — potwierdzone `grep -in counter` (tylko wzmianka w nagłówku) i
`grep -n data-negot-act` (tylko accept-package/reject-package). Dispatch nominalnie wymagał
tu Chromium.
Próba naprawy pełnej (żywy klik): `handleNegotiationCounter` wymaga wpisu w stanie
`direction='incoming'` (`awaitingOwnerId` = gracz) PRZY jednoczesnym istnieniu przycisku
kontroferty w audiencji — realnie osiągalne tylko gdy AI samo złoży ofertę LUB skontruje
naszą (`resolveNegotiationAsResponder` → `kind: 'countered'`). Zmierzono empirycznie (żywy
Chromium, domyślne warunki Paktu nieagresji, Relacja 100/100 ustawiona przez istniejący hak
`prepareContact`): AI **przyjmuje** ofertę od razu ("Grecy przyjmuje propozycję: Pakt
nieagresji na 15 tur") — `kind: 'countered'` nie występuje przy domyślnych warunkach, więc
wpis nigdy nie wraca na stół jako `incoming` do skontrowania. Wymuszenie `kind: 'countered'`
wymagałoby albo nowego haka testowego wstrzykującego wpis `negotiationTable` bezpośrednio
(POZA allowlistą tego dispatchu — `main.ts` WYŁĄCZNIE ciała 14 funkcji), albo dobrania
warunków oferty przez próg `evaluateProposal` (deterministyczny, ale nieudokumentowany dla
kombinacji Relacja/PN użytych w tej rundzie) — obie ścieżki przekraczają budżet tej rundy
obrony.
Naprawa faktycznie wykonana teraz: rozszerzono `hotseat-etap6d-podetap-e-exec-test.cjs`
(sekcja 5) o realne wykonanie CIAŁA `handleNegotiationCounter` (tym samym mechanizmem co
ZARZUT 2 — esbuild + `new Function`, nie regex, nie reimplementacja) dla OBU gałęzi: (a)
`awaitingOwnerId`=gracz → `applyCounterOffer` realnie wywołane z `authorOwnerId=ME()`
policzonym na `7` (nie zaszyty `0`), z dowodem mutacji `isMe≡false` czerwieniącym się (guard
blokuje, hint "limit rund" pojawia się zamiast cichego wyjścia); (b) `awaitingOwnerId`=AI →
guard POPRAWNIE blokuje niezależnie od realnego `isMe` (gracz nie może kontrować wpisu, w
którym to AI odpowiada). To jest UZUPEŁNIENIE, nie zamiennik żywego klawisza — jawnie
zaznaczone w nagłówku pliku i tutaj.
TESTY: `exec-test.cjs` po dodaniu sekcji 5 → 24/24 PASS (6 nowych, w tym 2 mutacyjne).
BLOKADA POZOSTAJĄCA (jawnie zgłoszona, nie ukryta): żywy klik przycisku kontroferty w
`.civ-diplo-aud` dla `handleNegotiationCounter` nadal nieosiągnięty. Rekomendacja dla
Final Control: albo zaakceptować unit-exec jako wystarczający dowód dla tej jednej funkcji
(ten sam poziom rygoru co 4 funkcje już zwolnione przez dispatch z Chromium), albo skierować
dedykowany hak testowy (poza allowlistą main.ts obecnego dispatchu, wymaga rozszerzenia
allowlisty lub osobnego mini-tematu) do rundy 2.

TESTY (pełny zestaw, powtórzone niezależnie w tej rundzie obrony):
- `tsc --noEmit`: 0 błędów (niezmienione).
- `hotseat-etap6d-podetap-e-source-test.cjs`: 77/77 PASS (niezmieniony, nadal tylko na tekście
  — ZARZUT 2 adresowany NOWYM plikiem, nie zmianą tego).
- `hotseat-etap6d-podetap-e-exec-test.cjs` (NOWY): 24/24 PASS — realne wykonanie 5 funkcji
  (4 z dispatchu + handleNegotiationCounter jako uzupełnienie), mutacja isMe/ME czerwieni
  każdy blok.
- `hotseat-etap6d-podetap-e-live-test.cjs`: powtórzone niezależnie w tej rundzie —
  patrz wynik dołączony niżej / w logu uruchomienia.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6.
- `git status --short` / `git diff --stat`: `gra/src/main.ts` (28+/28-, niezmieniony od
  rundy 1) + `gra/tools/hotseat-etap6d-podetap-e-exec-test.cjs` (NOWY, ta runda) +
  dwa pliki testowe rundy 1 (source-test.cjs, live-test.cjs, niezmienione) +
  `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-PODETAP-E-Q1/*` (ten raport +
  01-operator-runda1.md). Wszystko w allowlicie. `applyProposalOutcome` potwierdzone
  nietknięta (git diff main.ts nie zawiera tej funkcji).

BLOKADY: ZARZUT 3 częściowo otwarty — patrz wyżej (żywy klik kontroferty).
RUNDY: 1/5
NASTĘPNY KROK: Final Control — orzeczenie per zarzut (NAPRAW/ODDAL/DO DECYZJI CZŁOWIEKA);
jeśli ZARZUT 3 wymaga literalnie żywego kliknięcia, kierować do rundy 2 z rozszerzeniem
allowlisty o hak testowy do wstrzykiwania wpisu negotiationTable (poza main.ts 14 funkcji).
DEPLOY/PUSH: NIE WYKONANO
