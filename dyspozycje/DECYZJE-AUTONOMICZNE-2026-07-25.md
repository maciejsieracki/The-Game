# DECYZJE AUTONOMICZNE — noc 2026-07-25 (sesja chmurowa)

**Kontekst:** Maciej: „Podejmuj decyzję samodzielnie, ale później zreferuj mi pytaniami ABC jakie decyzje podjąłeś, żebym mógł sprawdzić. Najwyżej je zmienię. A jeżeli nie będzie zmienione, to będziesz miał już gotowe."

Poniżej KAŻDA decyzja, którą podjąłem sam, w formie ABC z **zaznaczonym wyborem**. Jeśli któryś wybór jest zły — powiedz „zmień <ID> na <litera>", poprawię. Wszystko **zintegrowane w gałęzi roboczej, tsc 0, bramki zielone, ale NIEZDEPLOYOWANE** (czeka na Twój sygnał „deploy").

---

## C-KAMIEN-KOPALNIE — kopalnie a relief wzgórza
**Sytuacja:** Kamieniołom spłaszczał wzgórze (naprawione). Ten sam bug dotyczy kopalni żelaza i kopalni miedzi.
- **A — Rozszerzyć fix na kopalnie** ✅ WYBRANE. *Za:* kopalnia wkomponowana w zbocze wzgórza jest logiczniejsza niż płaski heks; spójne z kamieniołomem; 1 linia. *Przeciw:* nie prosiłeś wprost o kopalnie.
- **B — Tylko kamieniołom** (kopalnie zostają płaskie). *Za:* ściśle w zakresie zgłoszenia. *Przeciw:* niespójność wizualna, ten sam bug zostaje.

## C-MAP-SOL-ZIEMIA — sól na mapie „Ziemia"
**Sytuacja:** Po „sól tylko Wybrzeże" mapa typu Ziemia (0 kafli typu Wybrzeże) nie miała soli.
- ~~A — Akceptuj~~ (moja pierwotna) — **ZMIENIONE przez Macieja na B.**
- **B — Napraw definicję wybrzeża** ✅ WYBRANE PRZEZ MACIEJA (2026-07-25). Maciej: „przecież jest wybrzeże. Wybrzeże to miejsce, gdzie łączy się płytkie morze z lądem, więc po prostu ląd najbliższy wybrzeża." → **sól = ląd graniczący z płytkim morzem (`isCoastalLandHex`), NIE osobny kafel Wybrzeże.** Działa też na Ziemi (ląd przy Morzu istnieje). ZAIMPLEMENTOWANE (gen-helpers.ts: `requiresCoastalLand` w regule soli + rewert wyjątków „sól na Wybrzeżu").
- C — Fallback Pustynia/Równina (odrzucone).

## C-DYP-STOL-Q1 — zakres stołu dyplomatycznego
**Sytuacja:** Dwuetapowa dyplomacja (propozycja → podgląd wstępnej zgody AI → akcept/zmień).
- **A — MVP: dwuetapowy podgląd+akcept, bez scalania koszyka** ✅ WYBRANE (tyle zaimplementował subagent). *Za:* najszybciej daje wartość, niskie ryzyko. *Przeciw:* nie można jeszcze dołożyć surowców do paktu w jednym oknie.
- **B — Pełny koszyk-traktat** (scalić `diplomacyTradeBasket` z traktatami). *Przeciw:* duży refaktor, nietestowalny na sucho.
- **C — Tylko złoty „słodzik"**. *Przeciw:* wąskie.

## C-DYP-STOL-Q2 — forma
- **A — Modal** ✅ WYBRANE. *Za:* prostsze, zgodne z obecnym flow. **B — Stały panel-stół.** *Przeciw:* więcej pracy.

## C-RES-Q1 — gdzie zaznaczać kolejkę badań (do 3 tech)
- **C — Oba miejsca współdzielą kolejkę** ✅ WYBRANE (hub-lista + drzewko; numeracja 1/2/3 wszędzie). *Za:* spójne, wykorzystuje oba UI. *Przeciw:* najwięcej pracy UI.
- A — tylko hub-lista · B — tylko drzewko.

## C-RES-Q2 — kolejność kolejki
- **C — drag & drop** ✅ WYBRANE PRZEZ MACIEJA (2026-07-25, zmiana z mojego A). Przeciąganie pozycji. A — FIFO+usuwanie „×" · B — strzałki góra/dół.

## C-RES-Q3 — ETA kolejki
- **A — tylko aktywny cel** ✅ WYBRANE PRZEZ MACIEJA (2026-07-25, zmiana z mojego C). ETA liczone tylko dla aktualnie badanej tech, bez ETA kolejki i bez ostrzeżeń. B — ETA bez ostrzeżenia · C — ETA + ostrzeżenie.

## C-RES-Q4 — kolejka dla AI
- **A — AI bez kolejki** ✅ WYBRANE (zostaje heurystyka co turę — AI i tak nigdy nie stoi). *Za:* zero ryzyka regresji balansu AI. B/C — formalna kolejka AI (martwy kod / ryzyko).

## C-EDGEPAN-Q1 — kiedy działa przesuwanie mapy przy krawędzi
- **B — Zawsze aktywny** ✅ WYBRANE PRZEZ MACIEJA (2026-07-25, zmiana z mojego A). Edge-pan działa w każdej chwili (konwencja 4X). DO PRZERÓBKI: predykat `edgePanActive` w `cameraControllerOpts()` (main.ts) → true zawsze. A — tylko gdy zaznaczona jednostka · C — też w trybie budowy.

## C-RANK-Q1 — prezentacja nieodkrytych w rankingu Mocy
- **B — „Jesteś X. z N cywilizacji (uwzględnia nieodkryte)"** ✅ WYBRANE (bez osobnych wierszy „???"). *Za:* dokładnie o to prosiłeś; zero info-leaku o nieodkrytych. A — pełna lista z „???" · C — zbiorczy „+K nieodkrytych".

## C-SENTRY-Q1 — zakres Sentry (czuwanie)
- **A — Pełne auto-budzenie na wroga** ✅ WYBRANE PRZEZ MACIEJA (2026-07-25, zmiana z mojego B). Jednostka śpi/pomija tury i BUDZI SIĘ automatycznie, gdy wróg wejdzie w pole widzenia. DO ZBUDOWANIA: nowa logika w silniku tur (wykrywanie wroga w zasięgu wzroku jednostki + wybudzenie) + parytet AI. Obecnie wdrożone B (ręczne) — trzeba dobudować auto-wake. B — proste uśpij/obudź · C — tylko znacznik. **Ikona = półksiężyc.**

## C-BITWA-WLADCA — imię władcy gdy obie strony to ta sama cywilizacja
- **B — Odrębne imię per gracz/właściciel** ✅ WYBRANE PRZEZ MACIEJA (2026-07-25, zmiana z mojego A). WYMAGANIE Macieja: każda z 15 cywilizacji dostaje PULĘ ≥9–10 imion władców (= max graczy/miast-państw tej samej kultury na mapie); każdy właściciel (państwo LUB miasto-państwo) dostaje OSOBNE imię z puli; imiona mogą być jednakowego rodzaju dla WSZYSTKICH epok (nie muszą różnić się per epoka — uproszczenie). Zadanie treść+kod: ~150 imion (10×15, kulturowo pasujących) + logika przydziału per właściciel (deterministycznie wg indeksu). Domyślnie: zachować istniejące 15×3 + dopełnić do ~10. DO ZBUDOWANIA.

## C-BITWA-FORMACJA — zakres przycisku „Formacja/szyk"
- **B — Formacja na aktualnie ZAZNACZONY zakres** ✅ WYBRANE PRZEZ MACIEJA (2026-07-25, zmiana z mojego A). Doprecyzowanie Macieja: „niezależnie czy wybierzemy jedną jednostkę, formację czy całą armię — zasady obowiązują wszystkich [zaznaczonych]". Czyli szyk stosuje się dokładnie do zaznaczonego zbioru, SPÓJNIE na każdym poziomie (1 jednostka / grupa / cała armia), z jasnym wskazaniem zakresu. Obecnie wdrożone A (zawsze cała armia) — PRZEROBIĆ na respektowanie zaznaczenia na każdym poziomie.

---

## ⏸ NIE decyduję sam — czekam na Ciebie (genuine wybór produktowy)

## C-BITWA-FACING → PRZEFORMUŁOWANE na C-FLANK (Maciej 2026-07-25)
**Moja pierwotna wersja (ręczne sterowanie kierunkiem w bitwie taktycznej) — ODRZUCONA.** Maciej: flankowanie to mechanika **trybu autonomicznego (auto-rozgrywki), NIE ręcznej gry**, głównie dla KONNICY (konnica obchodzi bokiem i uderza na skrzydła/tyły; ewentualnie rozszerzyć na wszystkie jednostki: front/bok/tył). Ręcznej gry nie zmieniamy.
**C-FLANK-Q1 — który tryb autonomiczny:** A=auto-odgrywanie na polu (silnik realnie manewruje konnicą) · B=auto-rozstrzygnięcie mocą (modyfikator w formule). REKOMENDACJA B.
**C-FLANK-Q2 — zakres:** A=tylko konnica · B=wszystkie jednostki (front/bok/tył). REKOMENDACJA A.
**C-FLANK-Q3 — zachowanie konnicy:** A=okrążenie do tyłu (bok→tył) · B=uderzenie w same boki. REKOMENDACJA A.
**STATUS: czeka na decyzję Macieja (Q1/Q2/Q3).**

## Pomniejsze z audytu (do decyzji, nie pilne)
- **Ctrl+klik multi-select**: jest tylko w bitwie, brak na mapie świata (złamany nawyk) — ujednolicić?
- **Dwa różne „Auto"**: auto-rozstrzygnięcie mocą (pomija pole) vs auto-odgrywanie na polu — przemianować jedno?

---

## C-RES-UI-TIMING — kiedy zrobić UI kolejki badań (dopisane w nocy)
**Sytuacja:** Silnik kolejki (temat 10) zintegrowany. UI wymaga rozbudowanej zmiany RDZENIOWEGO ekranu nauki (`scienceHubHud.ts` + `sciencePicker.ts` + helpery `main.ts`): klik=enqueue w obu miejscach, panel „Plan badań (n/3)" z odznakami 1/2/3, ETA skumulowane, ostrzeżenie o niespójnej kolejności, przyciski usuwania. Subagenty nie mogą tego zrobić (ich worktree są izolowane na `546b0c8` — nie widzą zintegrowanego silnika; subagent słusznie przerwał). Zostaje główna pętla.
- **A — Odłożyć UI, zrobić jako osobny dopięty krok** ✅ WYBRANE. *Za:* nie wciskam nietestowalnej (przeze mnie) zmiany rdzeniowego ekranu do dużego nocnego batcha; silnik zintegrowany jest nieszkodliwy (kolejka pusta = zachowanie jak dziś); pełny recon+plan spisany. *Przeciw:* funkcja „kolejka do 3" nie będzie w porannym deployu do przetestowania.
- **B — Zaimplementować w nocy w głównej pętli.** *Za:* funkcja gotowa do porannego testu. *Przeciw:* rozbudowana zmiana rdzeniowego ekranu bez mojego playtestu, w dużym batchu — podnosi ryzyko całego deploya.
- **MOJA REKOMENDACJA: A** (jakość > pośpiech na rdzeniowym ekranie). Powiedz „rób UI kolejki" jeśli wolisz B.

**Plan gotowy do wdrożenia (recon):** helpery `enqueueOrSetPlayerResearchSlug`/`dequeuePlayerResearchSlug`/`buildResearchPlanSnapshot` obok `selectPlayerResearchSlug` (main.ts:3445); przepiąć `onSelectTech` (main.ts:9396) i `onSelectTarget` (main.ts:9760) na enqueue; dodać do `ScienceHubHudConfig` haki `getQueue`/`onRemoveFromQueue` + render panelu „Plan badań"; odznaki 1/2/3 w `sciencePicker.ts`. API silnika: `enqueueResearchTarget`/`dequeueResearchTarget`/`getResearchPlanSnapshot`/`researchPlanLength`/`RESEARCH_QUEUE_MAX`=3.

---

## C-DYP-STOL-Q1 = B (Maciej zmienił z A) — RECON + plan
**Ustalenie z reconu (ważne):** silnik ocenia DZIŚ **jedną akcję na propozycję** — `buildProposalFromPayload` (main.ts:8689) bierze JEDEN `actionId` z `proposalActionIdFromPayload(payload)`, a `evaluateProposal` ocenia tę jedną akcję. Payload NIESIE już `giveItems/receiveItems` (koszyk) obok pól traktatu, ALE proposal ma jeden actionId — więc „traktat + surowce jako słodzik" NIE jest dziś oceniane łącznie.
**Wniosek:** dyplomacja-B to realny refaktor 3-warstwowy, NIE sam UI:
1. **Silnik** — pozwolić, by propozycja traktatu niosła „słodziki" (give/receive items + złoto) i by `evaluateProposal` wliczał ich wartość do decyzji AI.
2. **Balans (AI)** — jak bardzo X złota / Y drewna „dosładza" np. sojusz. To decyzja balansowa, którą **weryfikuje tylko playtest** (jak inne stawki — patrz R-STAWKI-STROJENIE).
3. **UI** — sekcja „Dołóż do umowy" w oknie traktatu + podgląd oceniający złożony deal.
**MOJA REKOMENDACJA (do Twojej akceptacji):** zbuduję mechanizm złożonego dealu z **placeholderową wyceną słodzików** (oznaczoną do strojenia w playteście, zgodnie z konwencją projektu), warstwami 1→3. To osobne, ostrożne zadanie na rdzeniowym systemie — robię je dedykowanym przebiegiem (najlepiej z Twoją pętlą playtestu), nie doklejam po cichu do nocnego batcha. Jeśli wolisz inny model wyceny/interakcji — powiedz; inaczej ruszam na tym.
