# Podział etapów Evaluatora AutoBot na warstwy modeli (Sonnet 5 / Opus 5 / Fable 5)

**Data:** 2026-08-07 · **Powiązane ID:** `R-AUTOBOT-EVALUATOR-MODEL-Q1` (wersja 2)
**Zakres pomiaru:** wyłącznie **tor Claude Code / sesja chmurowa**. Sesja lokalna (Windows) i tor
Cursora są dla tego pomiaru niewidoczne — a `.cursor/rules/model-routing.mdc` (alwaysApply) stanowi,
że w Cursorze adwokatem diabła jest `composer-2.5`, nie Opus 5. Zmiana tamtej reguły wymagałaby
osobnego ID i ABC.

**Metoda:** Workflow `w5tda1hf8` — 3 recony równolegle (kanon AutoBota · empiria 42 transkryptów
podagentów · katalog realnych wyłapań) → synteza (Opus 5) → **adwokat diabła (Opus 5)**.

> ## ⚠️ Werdykt adwokata diabła na tę syntezę: **FAIL** — 19 zastrzeżeń
>
> Dokument nie jest zatwierdzony jako gotowa procedura. Poniżej wersja **po naniesieniu** korekt
> adwokata. Sam werdykt FAIL jest przy okazji najmocniejszym dostępnym dowodem w sprawie, której
> dokument dotyczy: Opus 5 w roli adwokata diabła rozbił dokument wyprodukowany przez Opus 5
> w roli syntezatora, w tym **dwa błędne cytaty z własnego kanonu projektu**.

---

## 1. Trzy jawne kryteria przydziału

| Kryterium | Treść (sprawdzalna) |
|---|---|
| **K1** | Odpowiedź **deterministyczna, weryfikowalna w tym samym kroku**: komenda zwraca exit 0 albo nie, plik jest na liście albo nie. Błąd sam się sygnalizuje. |
| **K2** | Ocena zgodności artefaktu z intencją, **która jest gdzieś zapisana** (AC, decyzja ABC, kanon, kod silnika). Odpowiedź wywnioskowalna z dokumentów, ale nie mechaniczna. **Błąd jest cichy** — PASS wygląda identycznie jak poprawny PASS. |
| **K3** | Wymyślenie **czegoś, czego nikt nie zapisał** — hipotezy ataku, konfiguracji poza domyślną, eksperymentu spoza kanonu. **Nie istnieje lista poprawnych odpowiedzi do porównania.** |

## 2. Podział po korektach adwokata (wariant g)

| Warstwa | Etapy | Udział wolumenu tokenów | Koszt w oknie 23 uruchomień |
|---|---|---:|---:|
| **SONNET 5** | 1a sondowanie środowiska · 2 wykonanie baseline (z bramką `baseline_sha ≠ head_sha`) · 3 wykonanie **wybranych przez Opusa** bramek · 16a pola strukturalne postmortemu | **≈ 4,9 %** | **1,60 USD** |
| **OPUS 5** | 1b wczytanie i normalizacja AC · 4 delta · 5 weryfikacja twierdzeń przez kod · **5a konsekwencje wielopikowe / stare zapisy** · 6+7 SCOPE i NO-SIDE-EFFECT (scalone) · 8 NO-REGRESSION · 9 STRICT · 10 STRICT-EDGE · 11 STRICT-PARITY · 12 STRICT-SAVE · 14 test mutacyjny · 15 werdykt · 16b uzasadnienie postmortemu · 17 protokół błędu | **≈ 85,9 %** | **46,79 USD** |
| **FABLE 5** | 13 niezależna sonda behawioralna (esbuild + własny `probe.cjs`) — **wyłącznie po pozytywnym wyniku eksperymentu z §4** | **9,2 %** | **10,02 USD** |

- Wariant (g) **z** Fable na etapie 13: **58,41 USD/okno**, Δ = **+3,94 USD (+7,2 %)**.
- Wariant (g) **bez** Fable (etap 13 na Opusie): **53,41 USD/okno**, Δ = **−1,07 USD (−2,0 %)**.
- Stan dzisiejszy (całość Opus 5): **54,47 USD/okno**.

### Dlaczego Sonnet dostaje tylko 4,9 %, a nie 26,8 % z pierwszej wersji

Adwokat znalazł **ciche ścieżki awarii** w pięciu etapach, które pierwsza wersja oddawała Sonnetowi:

| Etap | Cicha awaria, której nikt dalej nie złapie |
|---|---|
| **1b wczytanie AC** | Parafraza gubiąca jedną klauzulę AC (np. z „parytet gracz/AI/MP dla `poziomRacji`" zostaje „poprawny `poziomRacji`"). Wszystkie następne etapy — **85,9 % wolumenu** — weryfikują kod wobec **okrojonego celu** i zwracają PASS z solidnymi dowodami. Błąd jest wzmacniany przez mocniejsze modele, bo produkują bardziej przekonujące dowody na źle postawione pytanie. |
| **2 wybór baseline** | `CLAUDE.md` zasada 0: commit następuje **przed** wejściem Evaluatora, więc `git show HEAD:<plik>` zwraca wersję **już zawierającą zmianę**. Baseline = stan po zmianie, delta = 0 % dla każdej metryki, raport wewnętrznie spójny, Operator potwierdza. Nie ma czego wykryć. |
| **3 dobór zestawu bramek** | Uruchomienie `diplomacy-proposal-test.cjs` przy zmianie w `units.json`, bez `unit-replace-test.cjs`, daje raport **w pełni zielony**. Brak liczby zauważa tylko ten, kto zrobił analizę promienia rażenia zmiany. Wykonanie zostaje na Sonnecie, **wybór** idzie do Opusa. |
| **3 zielony jałowy** | `npx tsc --noEmit` z niewłaściwego katalogu zwraca **exit 0** — bajt w bajt tak samo jak po sprawdzeniu ~900 plików. Reguła „Sonnet nie interpretuje czerwieni" chroni wyłącznie ścieżkę czerwoną; **zielona nie ma żadnego strażnika**. |
| **4 delta** | `ai-test.cjs` 261/9 → 271/8: Sonnet policzy Δpassed +10, Δfailed −1 → „poprawa" → PASS. Ten sam agregat powstaje, gdy naprawiono 1 stary błąd i **wprowadzono 1 nowy** wśród 9 nowych testów. Rozróżnienie wymaga porównania **zbiorów nazw testów**, nie liczników. Koszt przeniesienia na Opus: **0,04 USD/okno**. |

**Zasada wynikowa dla warstwy Sonnet:** Sonnet **wykonuje** i **mierzy**, nigdy nie **wybiera** ani nie **interpretuje** — ani czerwieni, ani zieleni. Każdy wynik bramki (zielony też) idzie do Opusa z pełnym stdout albo ze skrótem SHA-256 stdoutu + ścieżką do pełnego wyjścia.

### Dlaczego Fable traci etapy 8 i 10

- **Etap 10 (STRICT-EDGE) NIE jest K3.** `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-EDGE.md` (FAIL #7) wylicza **zamkniętą listę trzech klas**: edge (`0` / `max` / `clamp` / `undefined` / pusta lista / pusty string / brak klucza), negacja (odrzucenie / ścieżka zabraniająca / wartość ujemna / `false`), regresja zgłoszonego buga. Lista poprawnych odpowiedzi **istnieje** — to K2, nie K3. Oszczędność: **3,27 USD/okno**.
- **Etap 8 (NO-REGRESSION)** — patrz §4: jedyny dowód na jego trudność jest jednocześnie dowodem, że Opus 5 sobie z nim radzi.

---

## 3. Dwie korekty faktyczne, które adwokat wymusił

**K1 — kanon rezerwuje dla renderu Opus 5, nie Fable.** Synteza sugerowała, że `CLAUDE.md` „rezerwuje najmocniejszy model" dla renderu 3D, w rubryce uzasadniającej Fable. `CLAUDE.md` zasada 4 mówi coś przeciwnego: *„modele 3D jednostek i cała praca w `gra/src/render/**` idą na **Opus 5**"*, potwierdzenie *„Tak, graficzne wszystkie rendery muszą być robione **opus 5**"*, oraz w tej samej zasadzie: *„**Fable 5 wyłącznie za wyraźną zgodą Macieja**"*.

**K2 — całe okno to 526,11 USD, nie 523,75 USD.** Synteza cofnęła się z zaokrąglonego procentu (54,47 / 0,104). Bezpośredni pomiar jest w rejestrze: **526,11 USD** (główna pętla 192,39 + subagenci 333,72). Udział Evaluatora = **10,354 %**.

---

## 4. Najważniejszy wniosek: nie kupuj modelu, napraw prompt

**Liczba obserwacji Fable 5 w oknie pomiarowym: 0 na 23 uruchomienia.** Zbiór dowodów empirycznych na przewagę Fable jest **pusty**. Wszystkie trzy „dowody" cytowane w pierwszej wersji są dowodami tezy odwrotnej:

| Etap | „Dowód" | Co naprawdę pokazuje |
|---|---|---|
| 8 | pokrycie żelaza **75 %** wobec progu **≥85 %**, mapa Ogromny, seed 99 | Defekt **został złapany** — w oknie, w którym Evaluator działał w 100 % na Opus 5 |
| 10 | brak asercji dla L1 i ścieżki MP w `chooseCityProduction` | Braki **wykrył** Opus 5 |
| 13 | „czysta inwencja Evaluatora", 77 wywołań esbuild | Sondę **wymyślił i wykonał** Opus 5 — dowód wystarczalności, nie niewystarczalności |

**Eksperyment zerowy — koszt 0,00 USD, czas 1 uruchomienie.** Realnym konfundem nie jest klasa modelu, tylko **specyfikacja promptu**. Sukces etapu 8 wynikł z zachowania typu checklista („uruchom też konfigurację poza domyślną"), nie z mocy modelu. Dopisać do promptu Evaluatora twardy punkt: *„wypisz i uruchom 3 konfiguracje poza domyślną — rozmiar mapy, typ, seed"* — i zmierzyć, czy Opus 5 z checklistą osiąga to, co Fable miałby osiągnąć bez niej. **Zanim kupisz model, przetestuj prompt.**

**Dopiero jeśli to nie wystarczy — A/B, koszt jednorazowy 7,81 USD.** N = 10 zamkniętych tematów z okna, identyczne wejście, wyłącznie etapy 8+10 (11,0 % wolumenu). Ramię Opus **2,60 USD**, ramię Fable **5,21 USD**. Metryka: liczba unikatowych prawdziwych znalezisk ramienia Fable nieobecnych w ramieniu Opus. Próg decyzyjny ustalić **przed** eksperymentem.

**Próg opłacalności, którego nikt nie policzył.** Koszt jednego uruchomienia Evaluatora = 54,4731 / 23 = **2,3684 USD**. Wariant pełny (Fable na 3 etapach) kosztuje +5,164 USD/okno = **2,18 uruchomienia**. Przy zaobserwowanej stopie **1 defektu produkcyjnego na okno** wariant ten wymagałby **wzrostu wykrywalności o ≥218 %**, żeby się zwrócić.

---

## 5. Gdzie naprawdę leżą pieniądze

Wszystkie warianty mieszczą się w **±4 USD/okno** wobec stanu dzisiejszego — **wybór modelu jest w tej decyzji szumem**. Dla porównania:

| Dźwignia | Oszczędność na okno |
|---|---:|
| Redukcja prefiksu kontekstu Evaluatora o 30 % | **16,15 USD** (odczyt cache 11,22 + zapis cache 4,93) |
| Cały rozstrzał między najdroższym a najtańszym wariantem podziału | 11,01 USD |
| Wariant (g) bez Fable wobec dziś | 1,07 USD |

Odczyt cache = **32 695 tokenów kontekstu przy KAŻDYM z 2 288 wywołań narzędzi** (99,5 wywołania na uruchomienie). To jest realny koszt, nie klasa modelu.

**Ryzyko odwrotne:** naiwny podział na 3 agentów, w którym każdy odtwarza pełny prefiks, kosztuje
**+42,75 USD/okno** (2 630 689 tok × 3,75 USD/1M dla Sonneta + × 12,50 USD/1M dla Fable) — to
**7,3×** więcej niż jakakolwiek oszczędność z podziału, i to jeszcze **bez** policzonego
zduplikowanego odczytu cache.

---

## 6. Rekomendacja

**Kolejność wdrożenia jest ważniejsza od samego podziału** — to jedyny wniosek, który przeszedł
przez adwokata bez zastrzeżeń:

1. **Najpierw pakiet dowodowy i protokół** (`eval-evidence.json` z exit code, SHA-256 stdoutu,
   kompletem parametrów przebiegu, `baseline_sha`/`head_sha`; obowiązkowy `StructuredOutput` jako
   protokół międzywarstwowy — dziś **88,1 % werdyktów to wolny tekst**, nieparsowalny maszynowo).
   To warunek konieczny każdego podziału i jednocześnie największa dźwignia kosztowa.
2. **Potem eksperyment zerowy z §4** — checklista w promptcie, koszt 0,00 USD.
3. **Dopiero potem, i tylko jeśli 1–2 nie wystarczą**, zmiana modeli wg wariantu (g).

Do tego czasu: **Evaluator zostaje w całości na Opus 5**. Nie dlatego, że podział jest zły, tylko
dlatego, że bez kroku 1 podział kosztuje **7,3× więcej niż oszczędza**, a bez kroku 2 nie wiemy,
czy problem w ogóle leży w modelu.

---

## 7. Braki tego dokumentu (uczciwie, za adwokatem)

| # | Brak | Skutek |
|---|---|---|
| **B1** | Wagi procentowe policzono na populacji **42 transkryptów**, a kwoty USD na **23 uruchomieniach**. Korpus transkryptów rejestruje tylko **16,5 %** rzeczywistej objętości wyjść narzędzi (ucięcie na ~1,5 tys. znaków) — mediana 1 467 znaków ≈ średnia 1 464 znaki, czyli rozkład bez ogona, co dla `tsc`/pełnego suite/esbuild jest niemożliwe. | Wszystkie procenty w §2 są **niepewne**; etapy o długim wyjściu (3, 8, 13) są niedoszacowane. Kwoty traktować jako **dolne ograniczenia**, nie wartości. |
| **B2** | Koszt przypisano proporcjonalnie do udziału w wolumenie, ignorując że kontekst **narasta w trakcie przebiegu**. Etapy Sonneta leżą na początku (tani odcinek), etapy Opus/Fable na końcu (drogi). | Realna oszczędność z Sonneta jest mniejsza, dopłata do Fable większa, niż podano. |
| **B3** | `rule_106`–`rule_109` (fundament etapów 9–12) mają **0 zarejestrowanych zastosowań** przy progu min. 10; `postmortems.jsonl` ma 7 linii, z tego 6 smoke. | Pętla uczenia playbooka **nie działa**. Argumentacja o wartości etapów 9–12 pozostaje niemierzalna, dopóki naliczanie nie ruszy. |
| **B4** | Pomiar obejmuje wyłącznie tor chmurowy. | Tor Cursora dalej odpala adwokata diabła na `composer-2.5` — powstałyby **dwa procesy Evaluatora o różnej twardości** przy jednym rejestrze werdyktów. |
