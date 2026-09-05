# R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 — Evaluator, runda 2/5

STATUS: ZARZUTY (3) — bez werdyktu PASS/FAIL (§3c; agregat wydaje Final Control)
DOMAIN: GAME
TEMAT: R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1
GOAL: zgodny z ratyfikacją rundy 2 w `00-dispatch.md` (8 kryteriów) — §16a pkt 9 bez zastrzeżeń.
MODEL+EFFORT: Opus 5, effort high.
ZMIANY/COMMIT: oceniany `f24af77b` (baza `d7819ab7` potwierdzona `git log -1`). 6 plików,
wszystkie w allowliście (pkt 1); zero granic §9 (pkt 2); zero sekretów (pkt 5); jedyne usunięcia
to dwie asercje `(0)` zależne od `git show HEAD:`, jawnie uzasadnione (pkt 6); brak nakładania
(pkt 7). Save/load i parytet — nie dotyczy; ścieżki brzegowe zmierzone (pkt 4).
Mój dowód: `05-evaluator-runda2-zrzut-brzeg-A.png`.

TESTY (moje, sekwencyjne): `tsc --noEmit` 0 błędów · `entitycard-sufit-dwoch-kart` **65/65**
(baza **26/39 fail**, czysta lista) · civpedia-caly-wiersz **85/85** (baza 66/85) ·
single-dialog-real-render **25/25** (baza tego pliku 20/25) · nested-overlay 16/24 (baza 14/24) ·
civpedia-karty-nazwa 27/27 · improvement-card-callsites 36/36 · unit-info-card-viewport-height
35/35 · tech-discovery-card-real-click 12/12 · logic 213/213, tech-tree 19/19, research 33/33,
unit-replace 13/13, combat 6/6.

MOJE POMIARY (własny bundle, żywy Chromium, niezależny od bramki Operatora):
(i) 1280×900 dialog A `l=310 t=90 w=660 h=720`, B `l=382 t=146` → pasek 72/56 px; **dowód
pikselowy, którego nie było**: kolor w (346,450) = `[12,16,22]` z backdropem B i `[12,16,22]`
po jego zdjęciu — B niczym brzegu A nie przyciemnia. (iii) Esc ×2, klik w tło ×2, klik w brzeg A —
każdy gest zdejmuje jedną kartę; po Esc #1 A wraca na środek i odzyskuje `rgba(0,0,0,.62)`.
(iv) A→B→C: `[unit/falanga, tech/hutnictwo_zelaza]` → `[tech/hutnictwo_zelaza,
building/odlewnia_zelaza]`, `escDepth=2` — wypada NAJSTARSZA. (v) 29 asercji potwierdzone co do
sztuki: civpedia baza 19 FAIL = 15 `depthAfter===2` + 4 „Wymaga też:" (`:376-379`), wszystkie
zielone na HEAD; nested → zielone dokładnie bloki [4] i [5]; moja sonda `scrollIntoView`
(`:146`,`:213`) daje **24/24**, cofnięta, treści oczekiwań nietknięte; kategoria (c) = 0.
(vi) 16 viewportów (1920×1080…420×880): karta wierzchnia w całości w oknie na każdym,
`scrollWidth<=clientWidth`, próg 732 px potwierdzony (731→dx0, 768→dx18, 800→dx34).
MUTACJE (trzy, każda cofnięta): powrót `renderer.ts` do bazy → 26/39; `dialogStack[0]` →
`dialogStack[length-1]` → **2 FAIL, dokładnie (K2) „zamknięta najstarsza"**; `--ec-stack-dx`→`0px`
→ 7 FAIL. Bramka nie jest tautologiczna.

## ZARZUTY

1. **ECHO 1 (WIĄŻĄCE) literalnie niespełnione: brzeg A JEST zakryty backdropem karty B.**
   Ratyfikacja: „widoczny brzeg A ma być klikalny […] więc **nie może go zakrywać backdrop
   karty B**". Mój pomiar w (346,450): `document.elementFromPoint` → `DIV.entity-card-backdrop`
   karty B, nie karta A. Miejsca: `gra/src/ui/entityCards/renderer.ts:546-548` (w kodzie: „i to
   jest zamierzone") wobec `:480` („brzeg […] widoczny **i klikalny**"), oraz
   `gra/tools/entitycard-sufit-dwoch-kart-test.cjs:362-363`, gdzie zakrycie jest **asertowane
   jako wymagane** (`topIsUpperBackdrop === true`). Skutek z ECHO 2 (klik wraca do A) **działa** —
   zmierzyłem. Ale brzeg A jest martwy dla każdej innej interakcji, a klik w brzeg jest
   nieodróżnialny od kliku w tło. Operator przyjął interpretację godzącą dwa wiążące zdania ECHO
   i **nie zgłosił jej w raporcie jako interpretacji** — rozstrzygnął sam to, co dispatch kazał
   oddawać do decyzji.

2. **Asercja opisana jako „POMIAR WIDOCZNOSCI" nie mierzy widoczności** —
   `entitycard-sufit-dwoch-kart-test.cjs:342-361` („DOWOD WIDOCZNOSCI MOCNIEJSZY NIZ GEOMETRIA")
   i `04-operator-runda2.md:28` („Dowód mocniejszy niż geometria"). `elementsFromPoint` zwraca
   trafienia hit-testu niezależnie od tego, czy coś je zamalowało. Dowód: po mojej mutacji
   `renderer.ts:662` (`transparent` → `rgba(0,0,0,.62)`, brzeg A realnie przyciemniony) bramka
   daje **64 pass / 1 fail** — ta asercja nadal **przechodzi**; czerwienieje wyłącznie sąsiednia
   `backdropBg`. Widoczność niesie pomiar stylu, nie „mocniejszy dowód". Klasa błędu jak zarzut 1
   z rundy 1, ciężar mniejszy: kryterium 1 (`getBoundingClientRect`) jest spełnione, a brakujący
   dowód dostarczyłem (pomiar pikselowy — nadaje się na asercję).

3. **§11 — raport dwa razy dłuższy niż limit:** `04-operator-runda2.md` **776 słów** wobec
   „ok. 400". §11 klasyfikuje to jako `PASS-WITH-NOTES`, nie `FAIL`, ale wymaga skrócenia.

## SPRAWDZONE, BEZ ZARZUTU

- Sufit 2 działa i jest chroniony: moja mutacja „zamknij najnowszą" czerwieni dokładnie (K2).
- Recon poprawny: 8 callsite'ów `openEntityCard(` (`techDiscoveryNotice.ts:716`,
  `cityPanel.ts:7207, 9236`, `buildModeHud.ts:755, 763, 802, 810`, `renderer.ts:458`);
  `= openEntityCard` → 0; `.entity-card-backdrop` poza `renderer.ts` → 0.
- `entity-card-single-dialog-real-render-test.cjs`: 10 asercji zmienionych, każda z komentarzem
  `[ZMIANA R2]` „było → jest"; K3 i K4 nietknięte. Zero cichego osłabienia.
- Komentarze `renderer.ts:412-419` i `:464-482` zgodne z kodem; martwy opis nie odżył.

BLOKADY: brak. Zgłoszenie osobne Operatora (`nested-overlay:146,213`, 8 asercji) potwierdzam
własnym pomiarem — słusznie NIE naprawiane w tym temacie.
RUNDY: 2/5
NASTĘPNY KROK: Obrona Operatora do 3 zarzutów, potem Final Control (osobne wywołanie).
DEPLOY/PUSH: NIE WYKONANO
