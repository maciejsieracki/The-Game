STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1
GOAL: (A) Karta technologii — sekcje "Ulepszenia terenu" i "Zmiany ekonomiczne" domyślnie
ROZWINIĘTE. (B) `.entity-card-dialog` ma TRWALE WIDOCZNY pasek przewijania.
(Zgodne z `00-dispatch.md` — bez rozbieżności, pkt 9 checklisty §16a spełniony.)

ZMIANY/COMMIT: zweryfikowano niezależnie w `/home/user/wt-entitycard-rozwiniete-scrollbar`,
commit `a391307f` (baza `e29a772f`), `git diff e29a772f --stat`:
- `gra/src/ui/entityCards/technologyAdapter.ts` (+2/-2) — dokładnie dwie linie
  `openDefault: false` → `true` (improvements, econ), reszta pliku nietknięta.
- `gra/src/ui/entityCards/renderer.ts` (+11/-1) — wyłącznie blok CSS `.entity-card-dialog`
  rozszerzony o `scrollbar-gutter:stable`, `scrollbar-width:thin`, `scrollbar-color` +
  `::-webkit-scrollbar`/`-track`/`-thumb`/`-thumb:hover`; mechanizm `buildSectionEl`
  (linie 256-280, akordeon) nietknięty.
- `gra/tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs` — nowa bramka.
- `dyspozycje/autobot/runs/R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1/*` — artefakty runu.
Diff mieści się w allowliście `00-dispatch.md` co do pliku i co do zakresu w plikach
współdzielonych (pkt 1 §16a spełniony). Brak `git add -A` (commit niesie wyłącznie pliki
z allowlisty), brak sekretów w diffie (pkt 5), brak usunięć spoza GOAL (pkt 6) —
mechanizm zwijania jawnie zachowany i zweryfikowany żywym testem (K2 niżej).

TESTY (uruchomione niezależnie, nie przepisane z raportu Operatora):
- `npx tsc --noEmit` w `gra/` → 0 błędów (zgodne z raportem).
- 5 bramek referencyjnych z §6, uruchomione osobno:
  `logic-test.cjs` → LOGIC OK (213/213); `tech-tree-test.cjs` → 19 pass, 0 fail;
  `research-test.cjs` → PASSED: 33/FAILED: 0; `unit-replace-test.cjs` → 13/13 ZIELONE;
  `combat-test.cjs` → 6/6 pass. Wszystkie zgodne z wynikiem referencyjnym z
  `R-PROC-AUTOBOT.md` §6 i z raportem Operatora.
- Nowa bramka `entitycard-rozwiniete-scrollbar-real-render-test.cjs`, uruchomiona
  `xvfb-run -a node tools/...cjs` (zgodnie z udokumentowanym w kodzie testu wymogiem —
  Playwright `headless:true` doklejałby `--hide-scrollbars` i unieważniał K3) →
  **21/21 PASS**, zgodne z raportem. Obejmuje K1 (obie sekcje `data-open="1"`, body
  bez `hidden`, bez klikania), K2 (klik w nagłówek "Ulepszenia terenu" nadal zwija →
  `data-open="0"`, drugi klik przywraca → `data-open="1"` — akordeon działa w obie
  strony, mechanizm NIE usunięty), K3 (pasek przewijania zarezerwowany w layoucie,
  `offsetWidth-clientWidth=12px`, bez interakcji scrolla), K4 (kontrola negatywna na
  zmutowanym w pamięci kodzie sprzed tematu daje odwrotny wynik — dowód
  nietautologiczności).
- Żywe zrzuty Chromium zweryfikowane bezpośrednio (odnalezione w `/tmp/ec-shots/`,
  wygenerowane przez tę samą bramkę): `po-01-karta-otwarta.png` pokazuje złoty,
  stylowany pasek przewijania widoczny natychmiast po otwarciu karty "Gospodarka
  wodna", bez żadnej interakcji; `po-01b-scroll-do-improvements-econ.png` pokazuje
  obie sekcje ("Ulepszenia terenu" z "Irygacja", "Zmiany ekonomiczne" z wierszami
  "Studnia") rozwinięte z widocznymi wierszami i chevronem "▾"; `przed-01-karta-
  otwarta-zwiniete.png` pokazuje kontrastowo domyślny, niestylowany, szary pasek
  przeglądarki na kodzie sprzed tematu — wizualne potwierdzenie K4, zgodne z
  wymogiem pkt 8 §16a (zrzut z żywej przeglądarki + dowód nietautologiczności).

BLOKADY / ZARZUTY:

1. **§9 pkt 6b (granica nienaruszalna) — brak jawnej klasyfikacji tematu jako
   graficzny/wizualny i niezgodny model roli Evaluatora.** Ten temat GOAL-em
   dotyczy wyłącznie wyglądu/UX — (A) domyślny stan rozwinięcia sekcji karty,
   (B) stylowanie CSS paska przewijania (`scrollbar-width`, `::-webkit-scrollbar`,
   kolorystyka) — a więc pasuje wprost pod definicję z `R-PROC-AUTOBOT.md` §5a
   „Wyjątek graficzny/wizualny": *„CSS, layout, ikony, pozycjonowanie tooltipów...
   — nie logika/dane/ekonomia"*. Dla sesji Claude Code reguła ta wymaga: **Operator
   I Evaluator → Opus 5** (Final Control zostaje na Sonnet 5/High). Ani
   `00-dispatch.md`, ani `01-operator-runda1.md` nie zawierają wymaganej jawnej
   klasyfikacji tematu (graficzny vs. logika/dane) — sprawdzone grepem po całym
   katalogu `dyspozycje/`, zero wystąpień „Opus"/„Sonnet"/klasyfikacji przy tym ID.
   Dodatkowo mój własny dispatch jako Evaluatora tej rundy niesie jawnie
   `MODEL+EFFORT: Sonnet 5, effort high` — czyli **nie Opus 5**, mimo że temat
   spełnia definicję wizualnego. §9 określa to wprost jako pozycję listy granic,
   których naruszenie „oznacza natychmiastowy FAIL niezależnie od tego, jak dobra
   jest reszta pracy" — nie jest to więc uwaga kosmetyczna do odłożenia na inny
   temat, tylko potencjalne naruszenie tej samej listy, którą Evaluator ma
   sprawdzać (pkt 2 §16a). Nie wiem, na jakim modelu faktycznie pracował Operator
   (raport tego nie deklaruje — sam brak deklaracji jest już niezgodny z wymogiem
   zapisania klasyfikacji). Zostawiam to jako kandydata do `DO DECYZJI CZŁOWIEKA`/
   orkiestratora: albo (a) temat zostaje jawnie sklasyfikowany jako niewymagający
   Opus 5 mimo pozornego dopasowania do definicji (np. bo zmiana jest trywialna —
   dwie flagi boolean + standardowy CSS scrollbara, nie „Sonet 5 sobie nie poradził"
   w duchu uzasadnienia Maćka), z zapisem tej decyzji w rejestrze na przyszłość, albo
   (b) runda wymaga powtórzenia Operator+Evaluator na Opus 5 przed integracją.
   Nie jest to zarzut dotyczący jakości samego diffu — treść zmiany (kod, testy,
   zrzuty) jest poprawna i w pełni zweryfikowana niezależnie, patrz TESTY wyżej.

Poza powyższym — bez zastrzeżeń: wszystkie pozostałe punkty checklisty §16a (1, 3,
4, 5, 6, 8, 9 — 10 nie dotyczy, temat nie jest dzielony na węzły) sprawdzone i
spełnione, patrz ZMIANY/COMMIT i TESTY wyżej. Punkt 7 (nakładanie z drugim aktywnym
tematem) — kilka historycznych gałęzi `autobot/*` dotyka tych samych plików, ale
każda ma już zamknięty katalog runu w `dyspozycje/autobot/runs/` (zakończone tematy,
nie równoległa aktywna praca) — bez sygnału nakładania.

RUNDY: 1/5
NASTĘPNY KROK: Final Control (Opus 5 nie jest wymagany dla tej roli nawet przy
temacie wizualnym) — orzeczenie zarzutu #1: NAPRAW (powtórz rundę na Opus 5) /
ODDAL (klasyfikacja "nie wymaga Opus 5" z zapisanym uzasadnieniem) /
DO DECYZJI CZŁOWIEKA. Jeśli ODDAL lub po ewentualnej powtórce — integracja
allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
