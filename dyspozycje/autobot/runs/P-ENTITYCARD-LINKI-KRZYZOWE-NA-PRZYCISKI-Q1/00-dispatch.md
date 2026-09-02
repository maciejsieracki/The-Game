TEMAT:  P-ENTITYCARD-LINKI-KRZYZOWE-NA-PRZYCISKI-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat GRAFICZNY/WIZUALNY (R-PROC-AUTOBOT.md §5a) —
Operator Opus 5 effort=medium / Evaluator Opus 5 effort=high / Final Control
Sonnet 5 effort=high.

## WYZWALACZ
Właściciel, zrzut karty technologii (sekcje "Ulepszenia terenu" z linkami
"Szczegóły →" i "Kolejne technologie" z linkiem "Gospodarka wodna"): "A
wszystkie te skróty, które są porobione tekstowe, powinny być zamienione
na przyciski. Czyli przejście do innych kart, innych szczegółów. Przyciski
wyglądają bardziej profesjonalnie niż linki."

## RECON (wykonany, nie powtarzaj)
**UWAGA — ten temat ŚWIADOMIE ODWRACA wcześniejszą, udokumentowaną decyzję
projektową.** Dzisiejszy styl (złoty, podkreślony link) był CELOWYM
wyborem z tematu `P-CIVPEDIA-KARTY-AKCJE-PRZYCISKI-NIEOSTYLOWANE-Q1`,
udokumentowanym wprost w komentarzu kodu (`entityCards/renderer.ts`,
okolice linii 638-658): "Dlaczego INNY jezyk wizualny niz linki
(.entity-card-row-value wyzej): tamte to NAWIGACJA do innej karty (zloty,
podkreslony link). Te sa PRAWDZIWYMI AKCJAMI zmieniajacymi stan gry, wiec
dostaja wypelniony przycisk." Właściciel WPROST poprosił o odwrócenie tej
części (link→przycisk dla nawigacji) — wykonaj to jako świadomą, nową
dyspozycję, ale ZACHOWAJ rozróżnienie wizualne między nawigacją a
prawdziwą akcją (patrz GOAL) — właściciel nie prosił o ujednolicenie
wszystkiego w jeden styl, tylko o zamianę linku na przycisk.

Cztery klasy w `entityCards/renderer.ts` renderują dziś linki-tekstowe
(button-element stylizowany jak link, sterowany przez `row.linkTo`):
`.entity-card-row-value` (`buildGridRowEl`, linia ~119), `.entity-card-row-
action-text` (badge+link, styl "Szczegóły →", linia ~99), `.entity-card-
pill-text` (`buildPillRowEl`, wewnątrz kontenera `.entity-card-pill`,
linia ~164), `.entity-card-civpedia-link` (stopka karty, linia ~359).
Wspólny blok CSS (linie ~580-599) stylizuje wszystkie cztery identycznie:
`appearance:none;background:none;border:0;...text-decoration:underline`.

Istniejący, JUŻ DZIAŁAJĄCY język wizualny przycisku w TYM SAMYM pliku:
`.entity-card-action`/`-primary`/`-secondary` (linie ~659-676), używany
dla `data.actions` (prawdziwe akcje, np. "Rozpocznij badanie"). `-primary`
to pełny złoty gradient (najwyższa waga wizualna), `-secondary` to
stonowany ciemny wariant ze złotą obwódką (mniejsza waga) — WŁAŚNIE TEN
drugi wariant (`-secondary`) jest właściwym punktem odniesienia dla
przycisków nawigacyjnych, żeby zachować hierarchię: akcja zmieniająca stan
gry ("Rozpocznij badanie") ma pozostać WYRAŹNIE cięższa wizualnie niż
zwykłe przejście do innej karty.

Zakres NIE jest jednym współdzielonym plikiem — `cityPanel.ts` utrzymuje
DWIE NIEZALEŻNE kopie tego samego złotego-podkreślonego języka, NIE
podpięte pod `ENTITY_CARD_CSS`: `.civ-detail-scope .detail-card .dc-v-btn`
(linia ~2567-2569) oraz `.entity-card.bld-detail-card .dc-v-btn` (linia
~7212-7217, komentarz wprost: "ten sam zloty, podkreslony jezyk wizualny
co linki krzyzowe w ENTITY_CARD_CSS, zamiast natywnego przycisku"). Obie
wymagają OSOBNEJ, dopasowanej zmiany CSS (nie dedup, chyba że uznasz to za
bezpieczne i w zakresie). Trzeci, ODRĘBNY styl: `.civ-cs .okolica-info-link`
(cityPanel.ts, linia ~2236, przerywane podkreślenie) — sprawdź REALNIE co
robi ten link (czy to nawigacja do innej karty encji, czy inny rodzaj
interakcji) i zdecyduj świadomie, z uzasadnieniem w raporcie, czy wchodzi
w zakres tej zmiany.

`.entity-card-pill` już jest obramowanym, "przyciskopodobnym" kontenerem
wokół `.entity-card-pill-text` — dobry punkt startowy dla tego wariantu,
nie trzeba wymyślać nowego kształtu od zera.

Struktura DOM (elementy `<button>`, atrybuty `data-entity-kind`/`data-
entity-id`, delegowany listener kliknięcia) jest już poprawna i
NIETKNIĘTA tym tematem — to WYŁĄCZNIE reskin CSS, zero zmian w logice
nawigacji/klikania.

## GOAL
Przenieś WSZYSTKIE cztery klasy linków krzyżowych (`.entity-card-row-
value`, `.entity-card-row-action-text`, `.entity-card-pill-text` wraz z
`.entity-card-pill`, `.entity-card-civpedia-link`) z dzisiejszego stylu
"złoty podkreślony link" na styl PRZYCISKU, wzorując się na istniejącym
`.entity-card-action-secondary` (obramowanie + stonowane tło, NIE pełny
złoty gradient `-primary` — ten zostaje zarezerwowany wyłącznie dla
prawdziwych akcji zmieniających stan gry). Zastosuj TĘ SAMĄ zmianę
konsekwentnie w obu niezależnych kopiach w `cityPanel.ts` (`.dc-v-btn`
×2). Zdecyduj i udokumentuj czy `.okolica-info-link` wchodzi w zakres.
Zero zmian w strukturze DOM, atrybutach `data-*`, logice nawigacji/klikania
— wyłącznie CSS (kolor tła/obwódki/tekstu, brak `text-decoration:
underline`, odpowiedni padding/border-radius jak reszta przycisków karty).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywe zrzuty PRZED (`page.screenshot()`, prawdziwe Chromium): karta
   technologii z sekcją "Ulepszenia terenu"/"Kolejne technologie" — dzisiejszy
   złoty podkreślony tekst.
2. Żywe zrzuty PO: te same rzędy renderują się jako przyciski (widoczne
   obramowanie/tło, ZERO `text-decoration:underline`), WYRAŹNIE mniej
   dominujące wizualnie niż `.entity-card-action-primary` (np. otwórz w
   tym samym zrzucie kartę z realną akcją primary obok, dla porównania).
3. Żywy dowód że klik w przekonwertowany element NADAL poprawnie nawiguje
   do docelowej karty (np. klik "Szczegóły →" przy ulepszeniu terenu
   otwiera kartę tego ulepszenia) — zero regresu funkcjonalnego.
4. Żywy zrzut `cityPanel.ts` (np. panel budowy/szczegółów budynku)
   pokazujący że OBIE kopie `.dc-v-btn` też dostały nowy styl przycisku.
5. Jawna decyzja (w raporcie, z uzasadnieniem) czy `.okolica-info-link`
   wszedł w zakres, wraz z żywym zrzutem potwierdzającym wybór.
6. Zero regresu w innych elementach karty: `.entity-card-action-primary`/
   `-secondary` (prawdziwe akcje) i `.entity-card-badge`/`-row-badge`
   (informacyjne, nieklikalne) wizualnie NIEZMIENIONE.
7. Diff ograniczony do reguł CSS w `entityCards/renderer.ts` i
   `cityPanel.ts` (+ nowy/rozszerzony test w `gra/tools/`). Zero zmian w
   funkcjach budujących DOM, adapterach, `gra/data/**`.
8. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu
   + `entity-card-contract-test.cjs`, `entity-card-action-buttons-real-
   render-test.cjs`, `entity-card-cross-links-nested-overlay-test.cjs`,
   `entity-card-wonder-test.cjs`, `entity-card-historia-section-test.cjs`,
   `entity-card-diorama-real-render-test.cjs` bez regresu (dopuszczalna
   aktualizacja asercji stylu KOLORU/OBRAMOWANIA jeśli test wprost sprawdza
   dzisiejszy link-styl — udokumentuj każdą taką zmianę w raporcie) + nowy
   test potwierdzający brak `text-decoration:underline` i obecność
   obramowania/tła na przekonwertowanych elementach.

## ALLOWLISTA — nic poza tym
`gra/src/ui/entityCards/renderer.ts` (WYŁĄCZNIE reguły CSS w
`ENTITY_CARD_CSS` dla czterech wymienionych klas — zero zmian w funkcjach
budujących DOM), `gra/src/ui/cityPanel.ts` (WYŁĄCZNIE reguły CSS
`.dc-v-btn` ×2 i `.okolica-info-link` jeśli w zakresie — zero zmian poza
CSS), nowy/rozszerzony plik testowy w `gra/tools/`. Zakazane bezwzględnie:
adaptery (`unitAdapter.ts`/`buildingAdapter.ts`/`technologyAdapter.ts`/
`improvementAdapter.ts`/`wonderAdapter.ts`), logika nawigacji/klikania
(delegowany listener, `openEntityCard` i pochodne), `gra/data/**`,
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-ENTITYCARD-LINKI-KRZYZOWE-NA-PRZYCISKI-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Temat wizualny/UX — zakaz uznania KTÓREGOKOLWIEK z kryteriów wizualnych za
spełnione bez realnego zrzutu `page.screenshot()` z żywego Chromium. Zakaz
przypadkowego zrównania wizualnego przycisku nawigacyjnego z
`.entity-card-action-primary` (prawdziwa akcja) — muszą pozostać
ODRÓŻNIALNE, inaczej gracz nie odróżni "zmieniam stan gry" od "idę
popatrzeć na coś innego". Zakaz zgadywania czy `.okolica-info-link` jest w
zakresie — sprawdź co realnie robi ten link i zdecyduj świadomie.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator (Opus 5) → Evaluator (Opus 5, zarzuty, lista może być pusta) →
Operator (Obrona, Opus 5, tylko gdy zarzuty niepuste) → Final Control
(Sonnet 5, osobne wywołanie Workflow) → orkiestrator integruje
allowlist-only i cutuje kolejną FALĘ ROBOCZA.
