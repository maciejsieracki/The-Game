STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — cuda świata
TEMAT: R-WEB-WONDER-TRANSFER-ON-CONQUEST-Q1
GOAL: po zmianie właściciela miasta/hexa z wybudowanym cudem zdobywca przejmuje cud wraz z bonusami, poprzedni właściciel je traci (wariant B, decyzja właściciela 2026-11-07).

ZMIANY/COMMIT: baza origin/main ed67d18b3 (zawiera STACKLIM). Commit: patrz SHA w końcowej odpowiedzi orkiestratorowi (commit z kodem + raportem; PUSH NIE).
- NOWY gra/src/game/wonder-transfer.ts (czysta logika: migawka PRZED/PO, plan, zastosowanie).
- gra/src/main.ts (+60 linii, tylko ścieżki zmiany właściciela miasta): import, helpery beginWonderTransferWatch/settleWonderTransfer przy wonderIdsOwnedBy, 5 wpięć: applyCityCaptureToMap (podbój bojowy/szturm/wejście do pustego miasta/odbicie), kapitulacja głodowa, cesja w pokoju (transferCityByTreaty), aneksja miasta-państwa (annexCityStateToOwner), rewolta (REBEL_FACTION_OWNER_ID).
- NOWY gra/tools/wonder-transfer-on-conquest-test.cjs.
- Zero zmian w wonders-data.ts, gra-robocza/**, WERSJE.md, rust-port/**, render/**.

ZASADA (jedna): cud należy do cywilizacji kontrolującej TERYTORIUM jego hexa (territoryOwnerAt: najbliższe miasto w zasięgu; fort/posterunek tylko na terenie wolnym od miast). Cud stoi zawsze w promieniu terytorium jakiegoś miasta (pickWonderHexForCity), więc „hex poza miastem" = hex w terytorium miasta. Zmiana następuje tylko przy zdarzeniu: migawka właściciela terytorium każdego cudu przed i po; cud przechodzi gdy PRZED == pw.ownerId, PO != PRZED i PO != null. Zdobycie miasta A1, gdy hex cudu jest bliżej innego miasta A2 tego samego właściciela, NIE przenosi cudu.

PUNKTY ZGODNOŚCI Z GOAL:
(1) ownerId zmieniany na wszystkich 5 ścieżkach; odbicie/powrót działa symetrycznie (test).
(2) bonusy liczone na żywo z wonderIdsOwnedBy/placedWorldWonders; settle woła syncWonderRender + markCityStateDirty; test: zdobywca dokładnie raz, poprzedni właściciel 0.
(3) UI: istniejący modal showWonderCompletedNoticeDeferred: „Zdobyto cud: X" (variant mine) dla zdobywcy-człowieka, „Utracono cud: X" (variant rival) dla tracącego człowieka; AI-AI tylko console.log. Nagłówek kartki w ui/wonderCompletedNotice.ts jest stały („Cud ukończony"/„Cud rywala") — ui/ poza allowlistą, kosmetyka do ewentualnego tematu UI.
(4) Bonusy cudu liczone wg ownerId bez sprawdzania zdolności zbudowania (tech/epoka/zasób) — cywilizacje, które same nie mogłyby postawić cudu, też je dostają. Nie zmieniano. Uwaga: dostęp „E" (ekskluzywny) cudu dla innej cywilizacji — bonusy specjalne typu kapital_pustynia/dyplomacja są liczone z listy cudów właściciela; czy bonusy ekskluzywne mają działać u obcej cywilizacji — do ABC (nie blokuje).
(5) Ruiny: wonderIsRuin liczone live z epoki NOWEGO właściciela (absolut) — przejęty cud może być ruiną u zdobywcy w późniejszej epoce niż jego absolut; mechaniki zniszczenia nie zmieniano.
(6) MIGRACJA: brak masowego przepisywania. Zapis, w którym ownerId != właściciel terytorium hexa, jest ignorowany przez plan (test „niespójny zapis"). Ewentualna jednorazowa korekta takich zapisów = DECISION_REQUIRED, niewykonana.
(7) Testy: 26/26.

NOTATKI/RYZYKA DO EVALUATORA:
- Rewolta (tylko miasta człowieka) i barbarzyńcy: cud idzie z miastem do frakcji (-99/-1) i wraca przy odbiciu; barbarzyńca zdobywa przez captureCityWithoutBattle -> applyCityCaptureToMap (objęte).
- Budowa cudu w toku (wonderBuildSites) NIE jest przenoszona (zgodnie z GOAL: tylko ukończone); site przejętego terytorium nadal liczy się dawnemu właścicielowi — do ABC jeśli ma wygasać.
- Brama epoki R-EPOKA-CUD-WARUNEK-AWANSU liczy completedWorldWonders+civType, nie ownerId; nie zmieniano.
- Eliminacja cywilizacji nie usuwa cudów (stan sprzed tematu).

TESTY:
- node tools/wonder-transfer-on-conquest-test.cjs: 26/26 PASS (18 logiki: podbój, odbicie, cesja/aneksja wielu miast, dwa cuda, gracz<->AI, rewolta, niespójny zapis, null; 8 bramek strukturalnych main.ts).
- Mutacje: usunięcie `w.ownerId = t.toOwnerId` -> 10 FAIL; usunięcie warunku `b !== w.ownerId` -> 1 FAIL (test łamie mutację).
- logic-test 213/213; tsc --noEmit czysty; wonder-yields 11/11; cuda-handel 26/26; wonder-map-build 6/6.
- ai-test: 274 passed / 20 failed — nie importuje main.ts ani nowego modułu, diff nie dotyka ai*.ts; wynik identyczny z bazą (pre-existing; nie porównywano osobnym przebiegiem bazy, bo zależności testu niezmienione).
- era-cud-main-ts-integracja-test: FAIL (Blok 3c / M4) — zweryfikowane na kopii main.ts z bazy HEAD: FAIL identycznie (pre-existing, niezwiązane).
- NIE WYKONANO: weryfikacja w przeglądarce (temat logiczny; brak zmiany wizualnej poza istniejącym modalem), npm run build.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Obrona -> Evaluator -> Final Control); pytania ABC do orkiestratora: (4) bonusy ekskluzywne obcej cywilizacji, (6) korekta niespójnych zapisów, wygaszanie wonderBuildSites na przejętym terytorium, nagłówek modala.
DEPLOY/PUSH: NIE WYKONANO
