TEMAT:  R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1
RUNDA:  1/5
DATA:   2026-08-29
DOMAIN: GAME
ŚCIEŻKA: A (Workflow) — opt-in „Autobots workflow" tej sesji, osobny Operator per temat (żądanie właściciela 2026-08-29)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high / Final Control Sonnet 5 effort=high (osobne wywołanie Workflow) — baza R-PROC-AUTOBOT.md §5a

## WYZWALACZ
Recon `P-DYPLOMACJA-BILANS-NIEPRAWIDLOWY-Q1` (2026-08-29) potwierdził BUG (nie
świadomy projekt) — nawrót znanego, dwukrotnie już „naprawianego" wzorca
`P-DYPLO-BILANS-GATE-NIESPOJNY` (2026-08-14 runda 1 FAIL/runda 2 PASS-WITH-NOTES,
kontynuacja `-N-E1-REPRODUKCJA` 2026-08-16 ZDEPLOYOWANE FALA 295 PASS-WITH-NOTES,
nigdy w pełni domknięte). Właściciel: „Zgodzono się, że jeśli bilans wynosi
zero, deal może zostać zaakceptowany" oraz (drugi zrzut, AI startowa oferta):
„System ma wyliczyć mniej więcej propozycję, która jest równoważna i możliwa
do zaakceptowania." To są wiążące kryteria naprawy z żywej rozmowy — nie
wymaga turnieju ABC (wyjątek 3).

## GOAL
Dwie rzeczy, obie muszą być prawdą:
(a) Liczba pokazywana graczowi jako „Bilans (netto)" — dla WSZYSTKICH ścieżek
    (pojedyncza pozycja handlu przychodzącego, koszyk wielopozycyjny/traktat)
    — jest ZAWSZE dokładnie tą samą wartością, której bramka akceptacji
    (`evaluateProposal`, `diplomacy-proposals.ts:853`, pole odpowiadające
    `responderPreview.pwBalance`/`accepted`) faktycznie używa do decyzji
    „czy przyjąć" — nigdy osobno liczonym „surowym netto". Skutek: bilans
    wyświetlony jako 0 ZAWSZE odpowiada `accepted=true` (brak ukrytej
    dodatkowej przeszkody).
(b) Generator startowej oferty AI (`gra/src/game/diplomacy-ai-offer-balance.ts`,
    `trimProposalForZeroBalance`, wołany z `main.ts:14562-14567`/`14527-14551`)
    dolicza — oprócz już stosowanego `diplomacyFairGivePn` (mnożnik relacji) —
    także bazę traktatu (`treatyBaseFairnessGap`/`treatyBaseAcceptancePn`) i
    mnożnik chęci partnera (`handelWillingnessMultiplier`) tam, gdzie dotyczą
    danego typu propozycji, tak żeby AI proponowało układ bliski bilansowi≈0
    WEDŁUG TEJ SAMEJ, ZUNIFIKOWANEJ formuły z (a) — nie osobnego podzbioru.

## ZNANE PUNKTY KODU (recon 2026-08-29, zweryfikuj przed edycją, nie ufaj bezkrytycznie)
- `gra/src/ui/diplomacyAcceptanceBalance.ts` — `incomingTradeNetBalancePw`
  (linia ok. 380-382, dziś `myOfferPn - theirOfferPn` surowe), etykieta
  „Bilans (netto)" (linia ok. 519, 762), `renderPnBalancePanelFromBasket`
  (linia ok. 649-650, komentarz 645-648 — udokumentowany pozostały gap „N-E1"),
  `balancePanelDataFromRows` (linia ok. 229-350, `canAccept` już źródłowany z
  `responderPreview.accepted` — WZÓR do naśladowania dla (a), nie wynajdywać
  nowego mechanizmu).
- `gra/src/game/diplomacy-proposals.ts` — `evaluateProposal` (linia ok. 853),
  `handelFairnessGate`/`handelRequiredPn`/`handelWillingnessMultiplier`
  (linia ok. 1093-1121), `treatyBaseFairnessGap` (linia ok. 670-681).
- `gra/src/game/diplomacy-value-catalog.ts` — `diplomacyFairGivePn`
  (linia ok. 608-611).
- `gra/src/game/diplomacy-ai-offer-balance.ts` — moduł „D-DYPLO-AI-OFERTA-ZERO",
  `responderPwSurplus` (linia ok. 68-78), wołany z `main.ts` (`enqueueNegotiationFromAiCmd`,
  linia ok. 14527-14567) jako `trimProposalForZeroBalance`.
- `dyspozycje/PYTANIA-OTWARTE.md:26004-26020` — jawny, udokumentowany opis gapu
  „chęć partnera nigdy nie dociera do podglądu UI".

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Dla incoming trade (pojedyncza pozycja) I dla koszyka wielopozycyjnego/traktatu:
   wartość zwracana do UI jako „Bilans (netto)" jest bit-identyczna z wartością
   użytą przez `evaluateProposal` do wyznaczenia `accepted`/blokady — dowiedzione
   testem jednostkowym na co najmniej 3 scenariuszach (w tym oba scenariusze z
   zgłoszenia właściciela: 355/260 PW przy Relacji 63,3 dający dziś błędne
   „+95"/blokadę; 60/86 PW przy Relacji 69,5 dający dziś „-26"/blokadę) — po
   naprawie oba scenariusze albo pokazują SPÓJNY bilans z akceptowalnością,
   albo (jeśli naprawdę nieuczciwe) blokują z bilansem faktycznie ≠ 0, nigdy
   sprzeczność „bilans=0 ale zablokowane" ani „bilans≠0 ale zaakceptowane".
2. Syntetyczny test: gdy zunifikowany bilans wynosi dokładnie 0 → `accepted`
   jest `true` (żaden inny, niepowiązany blocker) — sprawdzone jawnym testem,
   nie tylko obserwacją na dwóch zrzutach.
3. `trimProposalForZeroBalance`/generator oferty AI: dla co najmniej 2
   syntetycznych scenariuszy z niezerową bazą traktatu i niezerowym
   `handelWillingnessMultiplier`, wygenerowana oferta AI, oceniona TĄ SAMĄ
   zunifikowaną funkcją z pkt 1, daje bilans bliski 0 (w granicach zaokrąglenia
   do PW całkowitych) — nie tylko bliski 0 wg starego, częściowego wzoru
   (sam mnożnik relacji).
4. `node ./node_modules/typescript/bin/tsc --noEmit` (z gra/) → 0 błędów.
5. Pięć bramek referencyjnych zielone bez pogorszenia: logic-test (213/213),
   tech-tree-test (19/0), research-test (33/33), unit-replace-test (13/13),
   combat-test (6/6). Znany regres ai-praca-split-parity-test 21/1 bez zmian.
6. Wszystkie istniejące testy dyplomacji (`diplomacy-*-test.cjs`,
   `adjust-handel-split-suma-test.cjs`, `cuda-handel-test.cjs`) zielone bez
   pogorszenia — jeśli któryś zakładał STARY, niespójny bilans jako "poprawne"
   zachowanie, zaktualizować jego oczekiwaną wartość zgodnie z NOWĄ, zunifikowaną
   regułą, z jawnym uzasadnieniem w raporcie (nie cichym dopasowaniem).
7. To jest NOWE SPRAWDZENIE tematu: test jednostkowy „bilans UI == bilans bramki"
   — nazwij plik docelowy jawnie w raporcie Operatora (np.
   `gra/tools/diplomacy-bilans-unifikacja-test.cjs`), zgodnie z R-PROC-AUTOBOT.md §12.

## ALLOWLISTA — nic poza tym
`gra/src/ui/diplomacyAcceptanceBalance.ts`, `gra/src/game/diplomacy-proposals.ts`,
`gra/src/game/diplomacy-value-catalog.ts`, `gra/src/game/diplomacy-ai-offer-balance.ts`,
`gra/src/main.ts` (WYŁĄCZNIE wywołania `trimProposalForZeroBalance`/
`enqueueNegotiationFromAiCmd`, żadna inna zmiana w tym pliku), nowy plik testu
z pkt 7 kryteriów, aktualizacja oczekiwanych wartości w istniejących testach
dyplomacji jeśli wymagane przez pkt 6.
Zakazane bezwzględnie: `docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1`, baza
JAWNIE `origin/main` (aktualny). Sparse-checkout bez `gra-robocza/`,
`gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Tryb „Test tautologiczny" (tabela `civ-autobot/SKILL.md`) w wariancie lokalnym:
zakaz uznania tematu za zamknięty na podstawie samej deklaracji „bilans jest
teraz spójny" bez wklejonego do raportu WYNIKU testu jednostkowego z pkt 1-3
kryteriów, na KONKRETNYCH liczbach z obu zrzutów właściciela — nie na
wymyślonych, wygodnych przykładach. Dodatkowo: zakaz cichego „naprawienia"
przez rozluźnienie bramki akceptacji (np. zawsze zwracanie `accepted=true`
przy bilansie bliskim zeru bez faktycznego ujednolicenia formuł) — Evaluator
ma jawnie sprawdzić, że POPRAWKA polega na unifikacji źródła prawdy, nie na
wyłączeniu warunku.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje dokładny plik/funkcję z błędem; runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Jeśli w rundzie 1 okaże się, że zakres jest za duży na
jeden dispatch (Evaluator/Final Control stwierdzą to jawnie) — dozwolony
podział na węzły: `-a` (unifikacja wyświetlanego bilansu z bramką akceptacji,
kryteria 1-2) i `-b` (generator oferty AI, kryterium 3), jedna fala węzłów =
jedna runda (R-PROC-AUTOBOT.md §12). Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator → Final Control (osobne wywołanie Workflow) → integracja
orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push.
