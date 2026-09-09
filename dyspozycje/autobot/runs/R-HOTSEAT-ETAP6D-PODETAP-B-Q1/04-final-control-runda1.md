STATUS: FAIL
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-B-Q1
GOAL: Migracja klastra "HUD/panel dyplomacji" (15 funkcji z recon) na isMe()/ME(), Etap 6d.

WERDYKTY (zarzuty Evaluatora, runda 1):

1. Niespójność liczbowa "13 funkcji" (tytuł commitu/pierwsze zdanie) vs faktyczne 12 wymienionych
   poimiennie w treści commita, i "Two" zamiast "Three" dla funkcji pominiętych. ODDAL jako
   samodzielny blocker integracji — Obrona PRZYJĘŁA, defekt czysto redakcyjny w już zapisanym
   commit message, zero wpływu na kod/testy/diff. Do użycia poprawnej liczby ("12 z 15") we
   wszystkich dalszych raportach (Evaluator i Obrona już to zrobiły).

NOWY ZARZUT (znaleziony niezależnie przez Final Control, żaden wcześniejszy raport go nie
zgłosił):

2. **NAPRAW.** Bramka jednostkowa `hotseat-etap6d-podetap-b-exec-test.cjs` NIE czerwienieje przy
   ręcznym przywróceniu pojedynczego literału `0` w co najmniej dwóch z siedmiu objętych nią
   funkcji — dokładnie ta klasa błędu, przed którą ostrzega dispatch (REGUŁA PRZECIW
   SAMOOSZUKIWANIU) i którą złapano w Podetapie E rundzie 1. Dispatch Final Control wprost
   zlecił: "zrob WLASNA mutacje (np. reczne przywrocenie literalu 0 w jednej funkcji) i potwierdz
   ze bramka faktycznie czerwienieje" — zrobiłem to na PIĘCIU niezależnych pojedynczych literałach
   w main.ts (nie w mockach testu, w PRAWDZIWYM źródle main.ts), z dokładnym przywróceniem
   `git diff --stat` do czystego stanu po każdej próbie:

   a) `collectDiploChipCounts`, main.ts:15031 `if (!d.strony.includes(ME())) continue;` →
      przywrócone do `includes(0)` — bramka: **23/23 PASS, brak reddenia**.
   b) `collectDiploChipCounts`, main.ts:15039 `const rel = getDiploRelation(ME(), oid);` →
      przywrócone do `getDiploRelation(0, oid)` (przy (a) NIETKNIĘTYM) — bramka: **23/23 PASS,
      brak reddenia**.
   c) `enqueueNegotiationFromAiCmd`, main.ts:15968
      `const atWarWithPlayer = getDiploRelation(ownerId, ME()).status === 'wojna';` → przywrócone
      do `getDiploRelation(ownerId, 0)` — bramka: **23/23 PASS, brak reddenia**.
   d) `foreignCivsMissingTradeTreatyForCity`, main.ts:14759 → **CZERWIENI SIĘ** poprawnie (test
      pada na pierwszej asercji, potem crash na niezdefiniowanym dostępie — efekt uboczny braku
      early-return w skrypcie testowym po pierwszym FAIL, ale wynik = FAIL/non-zero exit, więc
      bramka technicznie łapie regresję).
   e) `applyBorderMarchPenaltiesEndTurn`, main.ts:4869 → **CZERWIENI SIĘ** poprawnie (1 FAIL na
      dokładnej asercji).
   f) `currentVisibleForOwner`, main.ts:9892 → **CZERWIENI SIĘ** poprawnie (2 FAIL).
   g) `peacefulArchetypeForOwner`, main.ts:18786 → **CZERWIENI SIĘ** poprawnie (1 FAIL, wynik
      22 PASS / 1 FAIL).

   Czyli 5 z 7 funkcji objętych `exec-test.cjs` prawidłowo reaguje na przywrócenie pojedynczego
   literału `0` w main.ts. Dwie funkcje — `collectDiploChipCounts` (oba jej literały, (a) i (b),
   przetestowane osobno) i `enqueueNegotiationFromAiCmd` (co najmniej ten jeden z ~12 miejsc) —
   NIE reagują, mimo że main.ts w tym stanie ma REALNIE zaszyty literał `0` reprezentujący aktywny
   fotel.

   PRZYCZYNA (zweryfikowana czytaniem kodu testu, nie zgadywaniem): w `collectDiploChipCounts` obie
   ścieżki klasyfikacji (`sojuszPartners.has(oid) || rel.status === 'sojusz'`) są w mocku testu
   zaprojektowane tak, że złamanie JEDNEJ z dwóch (sojuszPartners z pierwszej pętli PRZEZ literał
   (a)/(b), albo `rel.status` z drugiej pętli) jest maskowane przez działającą DRUGĄ — asercja
   testu sprawdza wyłącznie zagregowany wynik `sojusze===1`, nie stan pośredni. W
   `enqueueNegotiationFromAiCmd` test w ogóle nie asercjuje wartości `atWarWithPlayer` ani
   argumentów przekazywanych do `getDiploRelation(ownerId, ME())` (4 wystąpienia),
   `priceableTradableGoodOptions(ME())`, `quantityTradableGoodOptions(ME())` (×2),
   `ownerBasketAffordCtx(ME(), …)`, `pnBalanceOpts.playerOwnerId` — wyłącznie 3 z ok. 12 wywołań
   `ME()`/`isMe()` w tej funkcji są faktycznie przechwytywane i sprawdzane (`aiCommandToPendingProposal`
   3. arg, `hasPendingNegotiationForPair` 2. arg, `createNegotiation.responderOwnerId`).

   WAŻNE ROZGRANICZENIE: to NIE jest defekt w main.ts. Punkt (2) dispatchu ("przeczytaj całe ciała
   12 zmigrowanych funkcji, zero pozostałych literałów 0") jest u mnie potwierdzony NIEZALEŻNIE
   przez pełne, ręczne przeczytanie wszystkich 12 ciał funkcji (patrz DOWÓD WŁASNEJ WERYFIKACJI)
   — main.ts w obecnym stanie jest czysty, `tsc` czysty, żywa bramka Chromium (silny dowód
   mutacyjny na 5 z 12 funkcji) zielona. Defekt jest WYŁĄCZNIE w kompletności bramki regresyjnej
   `exec-test.cjs` dla 2 z 7 funkcji, które ta bramka ma chronić na przyszłość — czyli w kryterium
   dowodowym (3)/(reguła przeciw samooszukiwaniu), nie w kryterium (1). Zgodnie z historią tego
   repo (dokładnie ta klasa błędu w Podetapie E rundzie 1, oraz seria wpisów w R-PROC-AUTOBOT.md §6
   o "bramka niewpisana/osłabiona cicho umiera") — cichej akceptacji tu być nie może: gdyby ktoś w
   przyszłej rundzie przypadkiem przywrócił jeden z tych literałów w `collectDiploChipCounts` albo
   w większości miejsc `enqueueNegotiationFromAiCmd`, ta bramka pozostałaby zielona.

   NAPRAWA (dla rundy 2, ten sam ID/branch): wzmocnić asercje w `hotseat-etap6d-podetap-b-exec-
   test.cjs`:
   - `collectDiploChipCounts`: rozdzielić mock `getDiploRelation` tak, by status zależał WYŁĄCZNIE
     od realnego argumentu (np. zwracać 'sojusz' tylko gdy DRUGI arg pasuje do specyficznego AI
     I pierwszy arg === PLAYER, przy jednoczesnym INNYM `activeDeals`, które nie nakłada się z
     `rel.status`), albo asercjonować wprost przechwycone argumenty obu wywołań (`d.strony.includes`
     i `getDiploRelation`) zamiast wyłącznie zagregowanego `sojusze`/`pakty`/`wojny`.
   - `enqueueNegotiationFromAiCmd`: dodać przechwytywanie i asercję dla WSZYSTKICH pozostałych
     wywołań z `ME()` (4× `getDiploRelation(ownerId, ME())`, `priceableTradableGoodOptions(ME())`,
     2× `quantityTradableGoodOptions(ME())`, `ownerBasketAffordCtx(ME(), …)`,
     `pnBalanceOpts.playerOwnerId`) — analogicznie do już istniejących trzech.
   Nie wymaga zmian w main.ts (kod gry jest poprawny) ani w allowliście — poprawka mieści się w
   istniejącym wpisie `gra/tools/*-test.cjs`.

Poza powyższym, WSZYSTKIE pozostałe punkty dispatchu Final Control zweryfikowane bezpośrednio
i potwierdzone:

DOWÓD WŁASNEJ WERYFIKACJI:

(1) `node ./node_modules/typescript/bin/tsc --noEmit` w worktree (`gra/`, z `node_modules`): exit 0,
    zero błędów.

(2) Przeczytane w całości (Read, nie grep) ciała wszystkich 12 zmigrowanych funkcji:
    `playerFormalRelationLabel` (L5586-5604), `buildPlayerDiploRelations` (L6431-6471),
    `buildDiploPairSummaryData` (L6491-6521), `buildAudienceActions` (L20093-20114),
    `buildPendingNegotiationRows` (L16719-16896), `foreignCivsMissingTradeTreatyForCity`
    (L14757-14772), `collectDiploChipCounts` (L15023-15045), `enqueueNegotiationFromAiCmd`
    (L15962-16111), `buildEmpireDetailSnap` (L15286-15615), `applyBorderMarchPenaltiesEndTurn`
    (L4826-4947), `currentVisibleForOwner` (L9885-9896), `peacefulArchetypeForOwner`
    (L18785-18796) — granice ciał wyznaczone programowo (brace-matching), nie ręcznie zgadywane.
    Zero pozostałych literałów `0`/`1` reprezentujących aktywny fotel w żadnej z nich; pozostałe
    liczby to niezwiązane z tożsamością gracza limity/domyślne/indeksy/liczniki. Mapowanie 43
    zmienionych linii diffu → dokładnie te 12 nazw funkcji potwierdzone niezależnie (żadna zmiana
    diffu nie leży poza tymi 12 zakresami brace-matched).

(3) `relationColorFn` (L3481-3484) i `unitRingStanceForPlayer` (L8026-8031): przeczytane w
    całości, już w 100% na `isMe()`/`ME()` — zero zmian potrzebnych, zgodne z uzasadnieniem
    (R-HOTSEAT-ETAP6E-RENDER-Q1). `cityMapOutlineKindForOwner` (L17932-17946): przeczytana w
    całości, zero literałów `0`, używa świadomie `isMeSafe()`/`meNow()` z udokumentowanym w
    komentarzu przy funkcji uzasadnieniem TDZ (wołana wewnątrz pierwszego, bezwarunkowego
    `cityRenderer.sync()` przed inicjalizacją realnego `ME()`) — to jest udokumentowane
    uzasadnienie W KODZIE, nie tylko deklaracja w raporcie.

(4) `hotseat-etap6d-podetap-b-exec-test.cjs` URUCHOMIONY: 23/23 PASS na czystym worktree.
    Kod PRZECZYTANY w całości: `extractFullFunctionSource` wycina ciało funkcji z main.ts przez
    brace-matching, `esbuild.transformSync` zdejmuje wyłącznie adnotacje TS, `new Function(...)`
    wykonuje wynikowy JS nad mockami jako wolnymi zmiennymi — REALNE wykonanie prawdziwego ciała
    z main.ts, nie regex ani reimplementacja (dokładnie odróżnione od błędu Podetapu E rundy 1).
    WŁASNA mutacja main.ts (5 niezależnych prób, patrz WERDYKT 2 wyżej): 5/7 funkcji poprawnie
    reaguje, 2/7 (`collectDiploChipCounts`, częściowo `enqueueNegotiationFromAiCmd`) NIE reaguje —
    stąd NAPRAW. Uwaga metodologiczna dodatkowa: wewnętrzny helper `ok()` w tym pliku ma osobną
    właściwość — gdy `mutationExpected=true`, PRZYJMUJE zarówno `cond===true` jak i
    `cond===false` jako PASS (linia `if (cond) {…} else if (mutationExpected) {…pass…}`), więc
    wewnętrzne bloki "MUTACJA" (BROKEN_isMe/BROKEN_ME) w tym pliku nigdy same z siebie nie mogą
    zwrócić FAIL — to nie jest bramka, tylko log. Realną siłą wykrywającą regresję w tym pliku są
    WYŁĄCZNIE bloki `mutationExpected=false` z `PLAYER=7` (nie licząc mojej zewnętrznej mutacji
    źródła, która jest niezależna od tego mechanizmu). To nie unieważnia 23/23 (bloki
    `mutationExpected=false` są normalnymi, ostrymi asercjami i to one złapałyby np. twardo
    zaszyty `0` zamiast `ME()` GDYBY dotyczyły tego konkretnego wywołania — patrz NAPRAW wyżej,
    gdzie właśnie NIE dotyczą).

(5) `hotseat-etap6d-podetap-b-live-test.cjs` URUCHOMIONY W PEŁNI (nie tylko przeczytany): realny
    `node ./node_modules/vite/bin/vite.js build --outDir <tmpdir> --emptyOutDir` (PO i ZEPSUTY,
    katalogi tymczasowe unikalne per uruchomienie przez `RUN_ID=pid+random`, zgodnie z regułą
    §6 o unikalnym tmpdir), realny `?playtest=mapa`, realne `page.locator(...).click()` przez
    Playwright (`[data-act="diplo"]`, `.dl-item`, `[data-act="dps-audience"]`,
    `[data-act="miasta"]`) — potwierdzone czytaniem kodu (brak `__testDebug` haków na ścieżce
    kliknięć, tylko `prepareContact`/`pickCandidateOwnerId` jako wejście scenariusza, nie efekt
    mierzony). WYNIK: 12/12 PASS. Mutacja `ME()` na sztywno `99` (kopia katalogu `gra/` do
    osobnego tmpdir, podmiana ciała `ME()`, osobny build) poprawnie zaczerwieniła DWA niezależne
    miejsca: panel Miasta "Brak miast" mimo realnych miast gracza (`buildEmpireDetailSnap`) i
    zmieniona linia `.dl-meta` w liście dyplomacji (`buildPlayerDiploRelations`) — potwierdzone z
    logu uruchomienia, nie z deklaracji.

(6) `handleNegotiationReject` (main.ts:16402-16433, 32 linie) i `applyProposalOutcome`
    (main.ts:19461-19636, 176 linii): wyekstrahowane z bazy (`git show 770d0078:gra/src/main.ts`)
    i z HEAD, `diff` całych zakresów — **IDENTYCZNE, zero różnic**. Dodatkowo potwierdzone brakiem
    jakiejkolwiek wzmianki tych dwóch nazw w pełnym `git diff 770d0078 HEAD -- gra/src/main.ts`.

(7) 5 bramek referencyjnych uruchomione świeżo w worktree: logic-test 213/213, tech-tree-test
    19/19, research-test 33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie identyczne
    z wynikiem referencyjnym R-PROC-AUTOBOT.md §6.

(8) `git diff --stat` względem `git merge-base HEAD origin/main` = `770d0078` (origin/main po
    `git fetch` faktycznie na `048da24a`, czyli dokładnie ten dispatch mówił: main poszedł dalej —
    ale tylko o commit dokumentacyjny z raportami 01-03 tego samego tematu, nie o zmiany w main.ts;
    merge-base i tak wciąż `770d0078`): WYŁĄCZNIE `gra/src/main.ts` (86 linii, +43/-43, zero zmiany
    netto długości pliku — spójne z czystą podmianą literałów), `gra/tools/hotseat-etap6d-podetap-
    b-exec-test.cjs` (nowy, 395 linii), `gra/tools/hotseat-etap6d-podetap-b-live-test.cjs` (nowy,
    267 linii) — dokładnie zgodne z allowlistą. `git diff --check` czysty (zero whitespace errors).
    Worktree czysty (`git status` — nothing to commit) po zakończeniu wszystkich prób mutacyjnych
    (każda przywrócona z `/tmp` backupu main.ts natychmiast po pomiarze).

ZMIANY/COMMIT: worktree `/home/user/wt-6d-PODETAP-B`, gałąź
`autobot/R-HOTSEAT-ETAP6D-PODETAP-B-Q1`, commit `5ba21cfa` (bez zmian tej rundy Final Control —
zero zapisu do main.ts, wszystkie mutacje testowe przywrócone). Commit message tytuł/pierwsze
zdanie "13 funkcji" pozostaje błędne w historii (Obrona: nie amendować bez autoryzacji) — przy
integracji używać "12 z 15 funkcji" w opisie orkiestratora (zarzut 1, ODDAL/przyjęte).

TESTY: tsc --noEmit 0 błędów; exec-test 23/23 PASS na czystym main.ts, ALE nie czerwienieje na
mojej własnej mutacji dla `collectDiploChipCounts` (2/2 przetestowanych literałów) i częściowo
`enqueueNegotiationFromAiCmd` (1/1 przetestowany literał spoza już-asercjonowanych trzech) —
patrz WERDYKT 2; live-test Chromium 12/12 PASS, mutacja poprawnie czerwieni (potwierdzone
uruchomieniem, nie lekturą); 5 bramek referencyjnych zielone (213/213, 19/19, 33/33, 13/13, 6/6).

BLOKADY: WERDYKT 2 (NAPRAW) — bramka `exec-test.cjs` niewystarczająco czuła na regresję literału
`0` w `collectDiploChipCounts` i w większości wywołań `enqueueNegotiationFromAiCmd`. Kod main.ts
sam jest potwierdzony poprawny niezależnym czytaniem — blokada dotyczy WYŁĄCZNIE jakości bramki
regresyjnej, nie funkcjonalności tej rundy, ale zgodnie z dyscypliną tego repo (historia P-BRAMKA-*,
Podetap E runda 1) nie może wejść do main jako "zaakceptowana cicho".

RUNDY: 1/5 (ta runda Final Control nie zużywa nowej rundy Operator/Evaluator — zgodnie z §3a,
Obrona nie jest osobną rundą; NAPRAW poniżej otwiera rundę 2 na TYM SAMYM ID i branchu).

NASTĘPNY KROK: Operator, runda 2, WYŁĄCZNIE poprawka `gra/tools/hotseat-etap6d-podetap-b-exec-
test.cjs` (wzmocnienie asercji dla `collectDiploChipCounts` i `enqueueNegotiationFromAiCmd` wg
NAPRAWY w WERDYKCIE 2) — bez zmian w `gra/src/main.ts`, który pozostaje zweryfikowany poprawny.
Po poprawce: ponowne uruchomienie exec-test + powtórzenie mojej sekwencji 5 ręcznych mutacji na
main.ts (a-c powinny teraz czerwienieć, d-g nadal powinny czerwienieć) → Evaluator → Final
Control.

DEPLOY/PUSH: NIE WYKONANO
