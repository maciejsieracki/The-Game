STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — UI panel „POŁĄCZENIE ARMII", widoczność listy jednostek
TEMAT: R-WEB-ARMY-MERGE-PANEL-LIST-VISIBILITY-Q1
GOAL: Panel zawsze pokazuje, ile jednostek jest łącznie i ile jest jeszcze pod spodem listy; logika łączenia bez zmian.

## Odtworzenie (PRZED, Chromium, baza f568e1ed3, `gra/src/ui/armyMergePanel.ts`)
Pomiar testem `army-merge-panel-list-visibility-test.cjs` (metryki w jego logu): panel PRZED nie ma stałego licznika ani wskaźnika „ile poniżej".
- 1280x720, 18+Skład(2): panel 538 px, body bez scrolla (wszystko się mieści) — ucięcia nie ma, ale brak licznika „Na polu/Dołącza/Razem".
- 1280x720, 44+1: panel 672 px (= vh−48), scrolluje CAŁE `.civ-amp-body` (scrollHeight 783 / client 485); własny suwak `.civ-amp-scrollbar` obejmuje całe body, kolumny „Na polu" i „Przybywa" przewijają się razem; brak informacji o liczbie poniżej.
- 360x640: body scrollHeight 1068 (20 jedn.) / 2316 (45) przy clientHeight 405 — ten sam wzorzec.
- Nagłówek i przyciski w PRZED są już poza scrollem (`.civ-amp-foot` flex 0 0 auto) — przewija się tylko body. Liczba „20" w pasku = existing.length + arrivingCount, a kolumna „Przybywa" pokazuje 1 kafel „Skład (2)" — stąd wrażenie niezgodności 18+1≠20 (dane z main.ts, poza allowlistą).

## Zmiany (allowlista)
- `gra/src/ui/armyMergePanel.ts` (v1.1): panel 640 px, tokeny `--tg-*` jak armySplitPanel; lista „Na polu" w siatce 3 kol. x 5 rzędów (46 px) z własnym scrollem (clamp wysokości do 100dvh−430 px, min 2 rzędy); „Przybywa (N)" w osobnej widocznej sekcji; licznik `Na polu: 18 · Dołącza: 2 · Razem: 20` (jedno źródło fieldN+arriveN=total, wspólne z paskiem „Armia — N jednostek"); wskaźnik „▼ jeszcze N jednostek" (przycisk, przewija do końca; znika na końcu; gradient u dołu listy); a11y: role=dialog/aria-modal, lista role=list + aria-label + tabindex=0 (PageDown działa), role=status; mobile 2 kol. (≤559 px) / 1 kol. (≤359 px), bez poziomego overflow. Usunięto własny suwak range. Enter na sfokusowanym przycisku wykonuje jego akcję (wcześniej Enter zawsze = Połącz); domyślny fokus na „Połącz armie". Zabezpieczenia `typeof ResizeObserver/requestAnimationFrame` — przy okazji naprawia pre-existing FAIL `army-merge-dismiss-bounce-test` (jsdom).
- NOWY `gra/tools/army-merge-panel-list-visibility-test.cjs`: 101 PASS; PRZED budowane z `git show f568e1ed3` (18 asercji RED-PRE); 3 viewporty (1280x720, 1920x1080, 360x640) x 20/45 jedn.; 5/5 uruchomień zielone po usunięciu flake (czekanie 2 klatek zamiast stałego timeoutu).
- Testy zaktualizowane z uzasadnieniem: `army-merge-panel-scroll-real-render-test.cjs` (usunięte asercje suwaka/thumbu/body-scroll i regexowy mutant PRZED pod stary CSS; zastąpione kontraktem listy; margines 24 px, portal 150%, CTA, negatywna kontrola montażu zachowane; 27/27) oraz `army-merge-panel-production-mount-test.cjs` (suwak -> wskaźnik; 9/9).
- Nie zmieniono: onMerge/onSeparate, `armyMergePickPanel.ts` (osobny panel wyboru, poza objawem), main.ts.

## Wyniki PO
1280x720, 20 jedn.: panel 625 px ≤ 672; 15 kafelków widocznych w całości; „▼ jeszcze 3 jednostki". 360x640: „jeszcze 10 jednostek". 45 jedn.: „jeszcze 29" (1280) / 36 (360). Zrzuty: `przed-/po-1280x720.png`, `przed-/po-360x640.png` (łącznie < 1 MB; ikony ze stubu, bo brandAssets wymaga Vite).

## TESTY (logi gate-*.txt w tym katalogu; pre = PRZED, post = PO)
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- Regresja *army-merge*/*armyMerge*/*merge-panel*/*army-split*: PRZED — EXIT=1 dla `army-merge-dismiss-bounce-test` (ResizeObserver) i `army-split-panel-scroll-grid-test` (2 asercje RED-PRE „PRZED"); PO — wszystko EXIT=0 poza `army-split-panel-scroll-grid-test` (identyczne 2 FAIL RED-PRE, plik nietknięty; przyczyna NIE_ZMIERZONO, wzorzec taki sam PRZED i PO, więc niezwiązany z tematem).
- Bez `npm run build/dev`.

BLOKADY: brak.
UWAGI: (1) army-split FAIL pre-existing; (2) „Skład (2)" nadal 1 kafel (main.ts poza allowlistą), licznik wyjaśnia 2 jednostki; (3) zrzuty z ikonami-stubami.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (to samo ID) — weryfikacja w Chromium i ocena UX.
DEPLOY/PUSH: NIE WYKONANO
