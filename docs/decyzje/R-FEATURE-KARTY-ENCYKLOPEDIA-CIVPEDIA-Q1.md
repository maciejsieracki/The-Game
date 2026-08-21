# R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1 — ABC

Kontekst i pełny recon: `dyspozycje/autobot/runs/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1/01-operator-recon.md`.

## Pytanie 1 — Źródło prawdy treści kart

Dziś `unitInfoCard.ts`, `cityPanel.ts` (karty budynku/jednostki) i `techDiscoveryNotice.ts`
to TRZY niezależne implementacje, każda czyta bezpośrednio z `*.json` i buduje własny DOM.

- **A. Zostaw jak jest, tylko dopisz linki.** Każde miejsce nadal czyta JSON samodzielnie;
  dodajemy tylko `onClick`/routing między istniejącymi kartami i do CivPedii.
  Za: dużo mniejsze ryzyko regresji (nie ruszamy działającego kodu trzech kart); szybciej
  widoczny efekt. Przeciw: trwały dług — cztery miejsca do aktualizacji przy każdej zmianie
  treści; niespójny wygląd kart (różne layouty) zostaje na zawsze.
- **B. Scal w jeden wspólny renderer/kontrakt**, z którego korzystają wszystkie miejsca
  (mapa, panel miasta, hub badań, CivPedia). Za: jedno źródło prawdy, spójny wygląd,
  łatwiejsze utrzymanie długoterminowo. Przeciw: duży refaktor obecnie działających,
  przetestowanych kart (`unitInfoCard`, `cityPanel` cards) — ryzyko regresji w kodzie który
  dziś działa; znacznie dłuższy czas realizacji.
- **C. Hybryda: nowy wspólny kontrakt TYLKO dla nowych kart** (ulepszenia terenu,
  technologia-w-CivPedii), istniejące trzy karty zostają nietknięte i tylko linkują do
  siebie/nowych kart. Za: nie ryzykujemy działającego kodu, a nowy kod od razu jest spójny.
  Przeciw: dwa standardy karty współistnieją w kodzie na stałe (stary dla 2 typów, nowy dla 2).

**Rekomendacja: A** na start (linki nad istniejącym stanem), z jawną notatką że B/C zostają
opcją na Etap 2 jeśli właściciel uzna niespójność wizualną za problem po zobaczeniu efektu A.

## Pytanie 2 — CivPedia jako jedyne źródło opisu, czy dwa równoległe kanały?

Dziś CivPedia (proza z `.md`, generowana do `wikiBundle.json`) i żywe karty (liczby z `.json`)
to dwa odrębne kanały o różnej treści dla tego samego obiektu (potwierdzone przez oba
wcześniejsze audyty treści — regularnie się rozjeżdżają).

- **A. Klik „więcej informacji" w żywej karcie otwiera wpis CivPedii OBOK** (dwa kanały,
  żywa karta = liczby/mechanika bieżącego stanu gry, CivPedia = proza/kontekst/lore).
  Za: małe ryzyko, natychmiastowa wartość (link zamiast scalania treści). Przeciw: rozjazdy
  treści między kanałami nadal będą się zdarzać (nieusunięty problem u źródła).
- **B. Scal w jeden tekst** — żywa karta ZAWIERA treść CivPedii (bez osobnego wpisu do
  odwiedzenia). Za: koniec rozjazdów, jedna prawda. Przeciw: wymaga też odpowiedzi na
  Pytanie 1 w stronę B/C (bo scalanie treści to część tego samego refaktoru); większy zakres.

**Rekomendacja: A** — spójne z rekomendacją Pytania 1 (mniejszy, szybszy pierwszy krok).

## Pytanie 3 — Zakres przycisku info na ikonach hubu badań

`scienceHubHud.ts` i `techTreeView.ts` JUŻ otwierają kartę podglądu technologii na klik
całego wiersza/węzła, z osobnym przyciskiem „Rozpocznij badanie" WEWNĄTRZ tej karty —
to dokładnie mechanizm „klik = karta, osobno = wybór do badania", o jaki prosił właściciel,
zaimplementowany na poziomie całego elementu (nie osobnej ikonki).

- **A. To już spełnia wymaganie** — nic więcej do zrobienia poza (opcjonalnie) zamianą
  martwego `techIconHintSpan()` w `cityPanel.ts` na klikalny link do tej samej karty
  podglądu (małe, niezależne domknięcie). Za: zero dodatkowej pracy UX, mechanizm już
  działa i jest przetestowany. Przeciw: brak WIDOCZNEJ, stałej wskazówki że wiersz jest
  klikalny — gracz może nie wiedzieć, że kliknięcie otwiera kartę zamiast wybierać badanie.
- **B. Dodać osobną, zawsze widoczną małą ikonkę „ⓘ"** obok/na każdej ikonie technologii,
  niezależną od kliknięcia całego wiersza — wymaga rozdzielenia stref kliknięcia w
  `buildEntryRow()` (`scienceHubHud.ts:574`) i węzłach `.civ-ttv-tn` (`techTreeView.ts`).
  Za: jawna, widoczna afordancja dla gracza. Przeciw: dodatkowa złożoność UI (dwie strefy
  kliknięcia w jednym elemencie), ryzyko przypadkowych kliknięć trafiających złą strefę.

**Rekomendacja: B**, ponieważ właściciel powtórzył tę prośbę TRZYKROTNIE w różnych
wiadomościach — silny sygnał, że obecne zachowanie (całe-wiersz-klikalne) nie jest dla
niego wystarczająco czytelne/widoczne, niezależnie od tego że mechanicznie już działa.

## Pytanie 4 — Skąd otwierać kartę ulepszenia terenu?

Dziś nie istnieje ŻADNE miejsce w UI gdzie gracz klika na ulepszenie terenu jako obiekt
(poza samą mapą/trybem budowy — `buildModeHud.ts` nie było w zakresie tego recon).

- **A. Tylko z trybu budowy** (`buildModeHud.ts`, tam gdzie gracz dziś wybiera co budować)
  — najbliżej naturalnego miejsca decyzji. Za: kontekstowo trafne, gracz i tak tam jest przy
  budowaniu. Przeciw: nie pomaga gdy gracz chce sprawdzić ulepszenie z popupu odkrycia technologii.
- **B. Tylko z panelu miasta** (lista już zbudowanych/dostępnych ulepszeń na danym polu).
  Za: spójne z tym jak działają karty budynku/jednostki (oba z panelu miasta). Przeciw: nie
  pokrywa trybu budowy ani popupu odkrycia.
- **C. Wszędzie tam gdzie nazwa ulepszenia się dziś pojawia** (popup odkrycia technologii,
  tryb budowy, panel miasta) — wymaga wspólnej funkcji otwierającej kartę z dowolnego miejsca.
  Za: kompletne pokrycie, spójne z duchem oryginalnego zlecenia właściciela („klik z popupu
  odkrycia"). Przeciw: największy zakres z trzech opcji, zależny od Pytania 1.

**Rekomendacja: C** — to dosłownie to, o co poprosił właściciel w pierwszej wiadomości
(klikalność z popupu odkrycia), więc A/B same w sobie nie spełniłyby oryginalnego zlecenia.

---

## ECHO

_(czeka na odpowiedź właściciela)_
