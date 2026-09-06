# P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1 — Operator, runda 1

MODEL+EFFORT: Opus 5, effort high (Ścieżka A — Workflow, zgodnie z `00-dispatch.md`).
GUARD §2b: `094be1db`, drzewo czyste — zgodne z oczekiwaną bazą.

## N1 — rdzeń tematu. WERDYKT: **(b) bramka opisywała stan, którego już nie ma**

Dowód z kodu, nie z domysłu. `render()` (`empireDetailPanel.ts:3974-4014`) urósł po napisaniu
bramki: między `bodyEl.innerHTML = body` a gałęzią scrolla woła dziś także
`queueMicrotask(wireMiastaColFilter)` (:3985) oraz `wireMiastoScopeButtons()`/`wireMiastoResFilter()`
(:3997-3998), dołożone przez późniejsze, niezwiązane tematy. Harness miał **zamrożoną** listę
zaślepek `new Function` (`wireMocViewButtons`/`requestAnimationFrame`/`scrollToSection`), więc
wycięty fragment przerywał się na `ReferenceError: wireMiastaColFilter is not defined` **zanim**
dobiegał do `if (scrollTarget) / else if (resetScrollOnNextRender) / else`. Wszystkie 9 czerwonych
asercji miało tę jedną przyczynę: 6 to komunikaty „wykonanie nie rzuciło wyjątku" z identycznym
tekstem błędu, 3 to ich kaskada (S1/S4/MUTANT R2 mierzyły `scrollTop` po przerwanym przebiegu).
Żadna z trzech dołożonych funkcji nie dotyka `scrollTop` (sprawdzone w ich ciałach), więc
zachowanie panelu było poprawne przez cały czas — **`empireDetailPanel.ts` nie był zmieniany**.
Bramka i panel są bit-w-bit identyczne na commicie-rodzicu (`git diff 094be1db~1 094be1db` pusty
dla obu plików), co potwierdza pre-istniejącość 38/9.

Naprawa (tabela „co sprawdzała przed / przez co jest sprawdzane po" — dotyczy wszystkich 9):
zaślepki są teraz **wyprowadzane z kodu** (identyfikator użyty w wycinku, który jest funkcją
modułową panelu), więc kolejne wywołanie dołożone do `render()` nie zaczerwieni bramki fałszywie.
Żadna asercja nie została usunięta ani osłabiona — wszystkie 9 sprawdza dziś dokładnie to samo co
przed naprawą, tyle że na przebiegu, który faktycznie dobiega do gałęzi scrolla. Żeby udogodnienie
nie stało się furtką do fałszywej zieleni, doszły trzy asercje: **E1** (żaden identyfikator wycinka
nie zostaje nierozwiązany — funkcja z innego modułu byłaby nazwana wprost), **E2** (auto-zaślepka
nie może przykryć nazwy nośnej dowodu: `scrollTarget`, `prevScrollTop`…), **E3** (każda
auto-zaślepiona funkcja NIE dotyka `scrollTop` — to jedyny powód, dla którego wolno ją zastąpić
no-opem). `safeRun()` asertuje ZAWSZE, więc liczba asercji nie zależy już od wyniku bramki
(wcześniej: 47 gdy czerwona, 46 gdy zielona).

**Asercje: 47 → 57, zielone.** Nietautologiczność — mutacje PRAWDZIWEGO `empireDetailPanel.ts`
(cofane KOPIĄ pliku, nigdy `git checkout`; po każdej `git diff --quiet` czysty):
usunięcie przywracania `prevScrollTop` → **23/25 czerwono**; usunięcie gałęzi
`else if (resetScrollOnNextRender)` → **45/11 czerwono**; `bodyEl.scrollTop = 0` dorzucone do
`wireMiastoResFilter()` → **E3 czerwone (56/1)**.

## N12 / N11 — ROZJAZD DISPATCHU ZE STANEM KODU (do decyzji orkiestratora)

Obie naprawy **już są w bazie tego tematu** — commit `24456a72` z 2026-08-21
(„fix(empire-panel): napraw N5/N9/N11/N12"), `git merge-base --is-ancestor 24456a72 094be1db`
→ prawda (C-056). Dispatch z 2026-09-05 opisuje je jako niewykonane. To rozjazd faktu w
dispatchu, nie sprzeczność wymagająca kodowania — stan docelowy już zachodzi, więc weryfikuję
go dowodem zamiast pisać zmianę, której nie ma czego dotyczyć.

- **N11** — komentarz przy `cityPoborMiniRekruci()` (:2508-2526) jest zgodny z faktem:
  `skipHero` bramkuje wyłącznie notatkę + pasek, a tabela (`civ-emp-armia-rekr-tbl`, wiersz
  RAZEM `.civ-emp-mini-summary`) jest emitowana bezwarunkowo w OBU wywołaniach (:3679, :3799).
  Sprawdzone w ciele funkcji, nie w treści komentarza.
- **N12** — potwierdzone **zrzutami z żywego Chromium** (`dowody/`, harness
  `dowody/n12-zrzuty-zywy-chromium.cjs`): realny `vite build` (binarka `vite`, `--outDir` poza
  drzewem repo), realny `doStartGame`, realne założenie pierwszego miasta, otwarcie zakładki
  **realnym klikiem w chip HUD** `[data-act=…]`. Pomiar DOM scopowany do sekcji zakładki
  (`dowody/N12-pomiar.json`): **PRZED — ikona tylko w Surowcach; PO — ikona w Surowcach,
  Handlu, Armii i Kulturze** (SVG 14×14 w każdej). Wariant PRZED zbudowany z LUSTRA `gra/`
  w `os.tmpdir()` — worktree nie był mutowany ani przez chwilę.
- Kryterium 4 (mutacja) — **istniejąca bramka to łapie**, nie trzeba dokładać asercji:
  usunięcie ikony z Handlu / Armii / Kultury → `empire-panel-drobiazgi-runda2-test` 31/2,
  z Surowców → 32/1 (mutacje cofane kopią pliku).

## N5 i N9 — świadomie bez zmian

Nie ruszam ich: to zachowania niemylące i poza zakresem tego tematu (C-025), a N9 dotyka
formatowania liczb w całym panelu — ruszenie go byłoby naruszeniem zakresu; dodatkowo obie
pozycje zostały już zmienione commitem `24456a72`, więc „naprawa przy okazji" nie miałaby
nawet przedmiotu.

## Bramki

- `empire-panel-moc-scroll-preserve-test` — **OK (57/57)**, exit 0 (było 38/9).
- `tsc --noEmit` (5.9.3, `node_modules` dowiązane) — **0 błędów**.
- Referencyjne: logic **213/213**, tech-tree **19/19**, research **33/33**, unit-replace **13/13**,
  combat **6/6**.
- Rodzina panelu (grep `empire`/`panel` w `gra/tools/` — 43 pliki, z czego
  `preview-unit-side-panel-screenshots.cjs` nie jest bramką; pełna lista i wynik każdej:
  `dowody/rodzina-panelu.md`): **37 zielonych / 5 czerwonych pre-istniejąco**.

## Blokady / noty

1. **Kryterium 7 („cała rodzina zielona") nie jest spełnione** i nie da się go spełnić w tej
   allowliście: czerwone są `empire-food-b5` (25/3), `empire-panel-econ-slider-visibility` (57/3),
   `empire-panel-miasto-obywatele-content` (113/2), `empire-panel-sliders-always-visible` (6/2,
   plik sam opisuje się jako SUPERSEDED) oraz `hint-toast-zindex-empire-panel`, który przerywa się
   własnym warunkiem („`origin/main` już zawiera naprawę — BEFORE bundle nie byłby »przed«",
   DOMAIN INFRA). Wszystkie pre-istniejące: mój diff to jeden plik bramki
   (`git diff 094be1db --stat`). Naprawa każdej z nich to osobny temat (C-025).
2. Ani `empire-panel-moc-scroll-preserve-test`, ani `empire-panel-drobiazgi-runda2-test` nie są
   wpisane do tabeli §6 `R-PROC-AUTOBOT.md` — zgłaszam, nie poprawiam (`docs/decyzje/**` jest
   w zakazach dispatchu).

---

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1
GOAL: `empire-panel-moc-scroll-preserve-test.cjs` zielony (≥47 asercji) z jawnym werdyktem
(a)/(b); ikona eyebrow spójna w czterech zakładkach z dowodem z żywego Chromium; komentarz przy
`cityPoborMiniRekruci()` zgodny z faktem; N5/N9 bez zmian.
ZMIANY/COMMIT: `gra/tools/empire-panel-moc-scroll-preserve-test.cjs` — `5b7c592c`;
`dyspozycje/autobot/runs/P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1/` (raport + `dowody/`) — RAPORT_SHA.
`gra/src/ui/empireDetailPanel.ts` NIE zmieniany (werdykt (b) + naprawy N11/N12 obecne od `24456a72`).
TESTY: moc-scroll-preserve 57/57 (było 38/9) · tsc 0 błędów · logic 213/213 · tech-tree 19/19 ·
research 33/33 · unit-replace 13/13 · combat 6/6 · drobiazgi-runda2 33/33 · mutacje: 23/25, 45/11,
56/1 (N1) oraz 31/2 ×3 i 32/1 (N12) · rodzina panelu 37 zielonych / 5 czerwonych pre-istniejąco (42 uruchomione) · N12 w żywym Chromium: PRZED 1/4 zakładek z ikoną, PO 4/4
BLOKADY: kryterium 7 niespełnialne w tej allowliście (5 pre-istniejąco czerwonych bramek rodziny,
lista wyżej); rozjazd dispatchu ze stanem kodu dla N5/N9/N11/N12 (naprawione `24456a72`, przodek bazy)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5, effort high)
DEPLOY/PUSH: NIE WYKONANO
