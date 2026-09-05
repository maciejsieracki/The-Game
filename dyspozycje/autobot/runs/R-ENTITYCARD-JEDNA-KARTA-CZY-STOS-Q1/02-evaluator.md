# R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 — Evaluator, runda 1/5

STATUS: ZARZUTY (5) — bez werdyktu PASS/FAIL (§3c; agregat wydaje Final Control)
DOMAIN: GAME
TEMAT: R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1
GOAL: zgodny z `00-dispatch.md` (4 punkty) — §16a pkt 9 bez zastrzeżeń.
MODEL+EFFORT: Opus 5, effort high.
ZMIANY/COMMIT: oceniany `a3f68dfb` (baza `5d03bf2a` potwierdzona `git log -1`). Diff: 2 pliki,
oba w allowliście (§16a pkt 1), zero granic §9 (pkt 2), zero sekretów (pkt 5), zero usunięć
ponad GOAL (pkt 6), brak nakładania — `P-ENTITYCARD-LINKI-KRZYZOWE-NA-PRZYCISKI-Q1` jest
ZINTEGROWANY (pkt 7). Save/load, parytet, ścieżki brzegowe — nie dotyczy (pkt 4).
Mój dowód: `02-evaluator-zrzut-mutacja-dwie-karty.png`.

TESTY (uruchomione przeze mnie, sekwencyjnie, wklejone):
- `tsc --noEmit` → 0 błędów.
- `entity-card-cross-links-nested-overlay-test` → `14 pass, 10 fail`.
- `civpedia-caly-wiersz-przyciskiem-test` → `66/85 pass, FAIL: 19`. Razem 29 — zgodne.
- `entity-card-single-dialog-real-render-test` → `21 pass, 5 fail` **na HEAD i na bazie** —
  potwierdzam rekonesans pkt 3 (bramka strukturalnie czerwona, poza allowlistą).
- MUTACJA (usunięty `activeDialog.dismiss()`, `renderer.ts:484-486`, przywrócone
  `git checkout`): nested-overlay → `16 pass, 8 fail`.

## ZARZUTY

1. **`01-operator.md`, „Rekonesans" pkt 2 — teza „ZERO wymaga zmiany, zzielenieją same" jest
   nieprawdziwa i nigdy nie zmierzona** (§16a pkt 3; rejestr wprost: „wymaga sprawdzenia, nie
   założenia"). Pod mutacją emulującą sufit nested-overlay nadal daje 8 faili — cały blok [2]
   (`entity-card-cross-links-nested-overlay-test.cjs:156-198`) i [3] (`:213-215`). Przyczyna
   niezależna od sufitu: ta bramka nie robi `scrollIntoView` przed `page.mouse.click` (robi to
   `civpedia-caly-wiersz-przyciskiem-test.cjs:209-210`); przycisk „Technologia" wypada na
   `y≈869-890` przy viewporcie 900, więc `elementFromPoint` zwraca w kolejnych przebiegach
   `null` / `DIV` / `BUTTON` — klik ślepy w piksel chybia. Kryterium końca 4 jest nieosiągalne
   „samo z siebie"; runda 2 musi tę bramkę naprawić albo jawnie uzasadnić zmianę.
2. **Ta sama teza opisuje treść asercji błędnie** — „wszystkie mają kształt `depthAfter === 2`".
   Nie mają: 4 faile `[5] „…": tekst „Wymaga też:" … NIEinteraktywnym <span>`
   (`civpedia-caly-wiersz-przyciskiem-test.cjs:376-379`) nie asertują głębokości w ogóle —
   czerwienią się, bo `document.querySelector('[data-section-key="next"]')` trafia w kartę
   docelową po zniknięciu źródłowej. Zzielenieją, ale z zupełnie innego powodu niż podany.
   Dispatch żądał dowodu **per asercja**; podano jedno zbiorcze zdanie (§16a pkt 3, pkt 9).
3. **Brakujący rekonesans, który zmienia pytanie ABC: przy dzisiejszym `ENTITY_CARD_CSS`
   karta A NIE będzie widoczna pod B** (`gra/src/ui/entityCards/renderer.ts:592-596`). Oba
   backdropy to `position:fixed;inset:0;z-index:520;background:rgba(0,0,0,.62)`, obie karty
   `width:min(660px,…)` wyśrodkowane — B ląduje dokładnie na A i zaciemnia resztę. Mój pomiar
   pod mutacją: `[unit/falanga @ l=309 w=662][technology/hutnictwo_zelaza @ l=309 w=662]`,
   `elementFromPoint` nad obszarem A nie zwraca nic z A; zrzut w tym katalogu pokazuje wyłącznie
   B. Kryterium końca 6 („A widoczna pod B") jest dziś nieosiągalne bez zmiany układu
   (offset/skala/wygaszenie) — a właścicielowi przedstawia się opcję A jako „wracasz do karty
   pod spodem", której nie byłoby widać.
4. **§16a pkt 8 / §9 poz. 6b — temat WIZUALNY bez zrzutu z żywej przeglądarki i bez mutacji.**
   `01-operator.md` TESTY: „Bramek real-render nie uruchamiano … nie ma czego mierzyć". Było co
   mierzyć: jedna mutacja (10 minut) obala tezę z zarzutu 1, a jeden zrzut ujawnia zarzut 3.
5. **Liczby w rekonesansie pkt 1 nie zgadzają się z kodem** (wniosek jest poprawny, dane nie).
   „12 wywołań" — realnych callsite'ów `openEntityCard(` jest 8: `techDiscoveryNotice.ts:716`,
   `cityPanel.ts:7207, 9236`, `buildModeHud.ts:755, 763, 802, 810`, `renderer.ts:457`; reszta
   trafień to komentarze i definicja. Odsyłacze `:477-479` i `:497-499` wskazują pozycje sprzed
   własnego commitu Operatora — na `a3f68dfb` jest `:484-486` i `:504-506`.

## SPRAWDZONE, BEZ ZARZUTU

- (i) **Trzecia karta**: bramki `entitycard-sufit-dwoch-kart-test.cjs` NIE MA (kryteria 2-3
  niewykonane, przyznane jawnie). Potwierdzam, że w repo nie istnieje żadna asercja na A→B→C.
  Ścieżka do bramki rundy 2 jest realna — pod mutacją zmierzyłem
  `unit/falanga → technology/hutnictwo_zelaza → building/odlewnia_zelaza`, `depth=3`,
  3 backdropy (dowód, że dziś sufitu nie ma i że fixture istnieje).
- (ii) **Żadna z 29 asercji nie została zmieniona** — allowlisty na oba pliki testowe nie użyto
  (`git show --stat a3f68dfb`). Zerowe ryzyko osłabienia bramek; sprawdziłem treść bloków
  [2]/[4]/[5] w nested-overlay i [1]/[2]/[6] w civpedia na bazie: żadna nie żąda głębokości > 2,
  zatem żadna nie utrwala stosu nieograniczonego. Wniosek Operatora trafny, uzasadnienie — nie
  (zarzuty 1-2).
- (iii) **Kompletność dróg zamykania** — przeszukałem sam: `.entity-card-backdrop` powstaje
  wyłącznie w `renderer.ts:488` i znika wyłącznie przez `dismiss` z `openDialog`
  (`:493-499`). Cztery drogi: `openDialog:484-486`, `dismiss` zwracany z `openEntityCard`
  (0 callsite'ów go trzyma — potwierdzam), klik w tło `:504-506`, Escape przez
  `escapeOverlayStack:60-66` (tylko wierzchnia pozycja). Zero `popOverlay()` bez `id` w `src/`,
  zero `body.innerHTML` w ścieżce kart encji. Lista Operatora kompletna — żadna droga nie ominie
  sufitu.
- (iv) **Komentarz `renderer.ts:406-421` zgadza się z kodem** na `a3f68dfb`: „bezwarunkowo woła
  `activeDialog.dismiss()`" ↔ `:484-486`; „zawsze dokładnie jeden `.entity-card-backdrop`" ↔
  zmierzone `backdrops=1` po kliku krzyżowym. GOAL pkt 4 i kryterium końca 5 spełnione.
- **Sam stop `DECISION_REQUIRED` NIE jest zarzutem.** Dispatch (§„PYTANIE…") i rejestr nakazują
  go wprost, a argument „zostawienie `dismiss()` jest wyborem opcji A przez bezwładność" jest
  poprawny: sufit + `pushOverlay` daje semantykę A automatycznie. Zastrzegam natomiast, że
  kryteria 1-2 dispatchu mówią wyłącznie o OTWIERANIU („żyją dwie karty", „zamknięta jest A") —
  czerwona bramka na te dwa punkty (kryterium 3) dała się napisać bez decyzji właściciela,
  z izolacją scenariuszy przez świeżą stronę zamiast Escape.

BLOKADY: pytanie ABC do właściciela nadal otwarte (semantyka zamknięcia B / Escape). Zarzut 3
sugeruje dołożyć do niego drugą część: czy A pod B ma być w ogóle widoczna, a jeśli tak —
jakim kosztem układu.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora do 5 zarzutów, potem Final Control (osobne wywołanie).
DEPLOY/PUSH: NIE WYKONANO
