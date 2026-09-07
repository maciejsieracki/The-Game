STATUS: PASS
DOMAIN: GAME
TEMAT: R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1
GOAL: Wiersz „Wpływ Relacji na deal" dla POKOJU pokazuje realną relację, nie stałe 100.

ZMIANY-COMMIT: Zweryfikowano SAMODZIELNIE commit `6845b72d` w worktree
`/home/user/wt-dyplo-relacja-etykieta`, gałąź `autobot/R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1`
(2 commity nad aktualnym `origin/main` = `3f7c68e3`, merge-base potwierdzony
`git merge-base HEAD origin/main` = `3f7c68e3`).

TESTY (uruchomione samodzielnie, nie tylko przeczytane z raportu Operatora):
1. `node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`) — 0 błędów, exit 0.
2. `node tools/dyplo-rel-current-etykieta-test.cjs` (z `gra/`) — 5/5 PASS, exit 0,
   w tym kontrola nietautologiczna (mutacja w locie cofająca dokładnie 2 dodane linie
   → `relCurrent` wraca do `undefined`) — potwierdzona odczytem wyjścia, nie samą
   deklaracją Operatora.
3. Uruchomione samodzielnie WSZYSTKIE pozostałe istniejące bramki `gra/tools/dyplo-*.cjs`
   oraz `granice-relacja-dyplomatyczna-test.cjs` (10 plików, pomijając ten z pkt 2):
   `dyplo-bilans-gate-n-e1-reprodukcja-test.cjs` 22/22 PASS,
   `dyplo-bilans-gate-n-e1-reprodukcja-runda2-test.cjs` 24/24 PASS,
   `dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs` 27/27 PASS,
   `dyplo-handel-oferta-ai-blokowana-test.cjs` 20/20 OK,
   `dyplo-kara-granica-realna-test.cjs` 10/10 OK,
   `dyplo-karta-decyzji-bilans-skrot-test.cjs` 13/13 PASS,
   `dyplo-karta-duplikat-komunikat-test.cjs` 15/15 PASS,
   `granice-relacja-dyplomatyczna-test.cjs` 52/52 PASS,
   `dyplo-warunek-niespelniony-czerwony-tooltip-test.cjs` **22/26 PASS (4 FAIL)** —
   ZWERYFIKOWANO że to defekt PRZEDISTNIEJĄCY, niezwiązany z tym tematem: odtworzony
   `git worktree add /tmp/verify-base 3f7c68e3` (baza SPRZED commitu Operatora,
   usunięty po weryfikacji) → ten sam test daje IDENTYCZNIE 22/26 PASS na bazie. Dotyczy
   progu tekstu dla `pakt_nieagresji`/„nap" (oczekiwane „Relacja zbyt niska na pakt" + próg
   130, silnik zwraca „Pakt nieagresji na 15 tur"), zupełnie inny obszar niż
   `computePeaceAcceptanceSides`/pokój dotknięty w tym temacie. Nie jest to regresja
   wprowadzona przez commit `6845b72d` — nie blokuje tego tematu, ale odnotowuję jako
   zastany czerwony stan do osobnego zgłoszenia (poza allowlistą tego tematu).

WERYFIKACJA PUNKTÓW Z ZADANIA EVALUATORA:

(a) `relCurrent` = FAKTYCZNIE ta sama wartość użyta do modyfikatora PW — POTWIERDZONE
źródłowo i ręcznym przeliczeniem. `computePeaceAcceptanceSides(givePn, receivePn, relTotal,
treatyBase, incoming, mode)` (linie 192-292) liczy `playerTreatyPw =
treatyPwForRole(treatyBase, relTotal, 'player')` (linia 200) i `partnerTreatyPw =
treatyPwForRole(treatyBase, relTotal, 'partner')` (linia 201) z TEGO SAMEGO parametru
`relTotal`, a obie dodane linie to `relCurrent: relTotal` (linie 257, 276) — identyczny
parametr, żadna druga ścieżka/przeliczenie.
Ręczne przeliczenie na scenariuszu ze zrzutu (relSigned=-71, treatyBase=500):
relTotal = relSigned + 100 = 29 (`relationSignedFromTotal` w drugą stronę);
modPct = clamp(-71, -90, 90) = -71 (`relationPnModPct`);
playerTreatyPw = round(500 × (1 + (-71)/100)) = round(500 × 0,29) = 145 — zgadza się
DOKŁADNIE z liczbą „145 PW" ze zrzutu właściciela;
partnerTreatyPw = 500 (baza, bez moda — `partnerTreatyPnRequired`);
relCurrent (obie strony) = relTotal = 29 — zgodne z kryterium końca dispatchu (~29, nie 100)
i z liczbami PRZED/PO w raporcie Operatora.

(b) `canAccept`/bramka bilansu PW dla pokoju NIETKNIĘTA — POTWIERDZONE. Diff commitu
`6845b72d` na `diplomacy-acceptance-points.ts` to wyłącznie 2 wstawione linie
(`git diff 3f7c68e3 HEAD -- gra/src/game/diplomacy-acceptance-points.ts`) — pola
`accepted: peaceAccepted && asymBalance >= 0` w `buildPlayerSide`/`buildPartnerSide` oraz
cała reszta funkcji (asymBalance, peaceAccepted, statusLabel) widoczne w diffie jako
KONTEKST, nie zmiana. Realna bramka UI (`gra/src/ui/diplomacyAcceptanceBalance.ts`,
`canAccept = blockReason == null` linia 379) i jej wyjątek dla pokoju
(`row.uiActionId !== '10'` linia 366, komentarz „Pokój bez bramki PW" z rundy 4
P-DYPLO-BILANS-GATE) leżą w pliku SPOZA diffu tego commitu — potwierdzone, że plik
w ogóle nie występuje w `git show 6845b72d --stat` ani w `git diff 3f7c68e3 HEAD --stat`.
Bramka nadal zawsze pomija blokadę dla `uiActionId==='10'` (pokój), niezależnie od bilansu.

(c) Poza allowlistą nic nie zmieniono — POTWIERDZONE, z zastrzeżeniem metodologicznym.
`git diff --stat c469c7b5 HEAD` (baza z 00-dispatch.md SPRZED rebase'u) pokazuje DODATKOWO
`gra/src/ui/cityPanel.ts`, `gra/src/ui/orderPanel.ts`, `REJESTR-PROSB-I-ZADAN.md` i raporty
innego tematu (`R-PORZADEK-PANEL-PUNKTY-ABSOLUTNE-Q1`) — ale to WYŁĄCZNIE efekt tego, że
gałąź została zrebase'owana na `origin/main` @ `3f7c68e3` (jak Operator jawnie zadeklarował
w raporcie), który w międzyczasie wchłonął ten inny, już wcześniej zamknięty temat
(commit `652855db`/`3f7c68e3` widoczny w `git log --oneline -5` PRZED commitami tego
tematu). Właściwe porównanie to `git diff --stat 3f7c68e3 HEAD -- .` (potwierdzony
`git merge-base HEAD origin/main` = `3f7c68e3`) — wynik: WYŁĄCZNIE
`gra/src/game/diplomacy-acceptance-points.ts` (2 linie), nowy
`gra/tools/dyplo-rel-current-etykieta-test.cjs` i pliki raportów/dispatchu tego tematu
w `dyspozycje/autobot/runs/R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1/*`. Zgodne z allowlistą
co do litery. `git diff --check 3f7c68e3 HEAD -- .` czysto (brak whitespace errors).

(d) `tsc --noEmit` i bramki dyplomacji uruchomione SAMODZIELNIE — patrz sekcja TESTY
wyżej; wszystkie czyste poza jednym przedistniejącym, niezwiązanym czerwonym stanem
(`dyplo-warunek-niespelniony-czerwony-tooltip-test.cjs`), zweryfikowanym jako identyczny
na bazie sprzed tego tematu.

ZARZUTY: brak.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator → Final Control.
DEPLOY/PUSH: NIE WYKONANO
