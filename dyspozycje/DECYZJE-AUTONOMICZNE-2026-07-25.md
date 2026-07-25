# DECYZJE AUTONOMICZNE — noc 2026-07-25 (sesja chmurowa)

**Kontekst:** Maciej: „Podejmuj decyzję samodzielnie, ale później zreferuj mi pytaniami ABC jakie decyzje podjąłeś, żebym mógł sprawdzić. Najwyżej je zmienię. A jeżeli nie będzie zmienione, to będziesz miał już gotowe."

Poniżej KAŻDA decyzja, którą podjąłem sam, w formie ABC z **zaznaczonym wyborem**. Jeśli któryś wybór jest zły — powiedz „zmień <ID> na <litera>", poprawię. Wszystko **zintegrowane w gałęzi roboczej, tsc 0, bramki zielone, ale NIEZDEPLOYOWANE** (czeka na Twój sygnał „deploy").

---

## C-KAMIEN-KOPALNIE — kopalnie a relief wzgórza
**Sytuacja:** Kamieniołom spłaszczał wzgórze (naprawione). Ten sam bug dotyczy kopalni żelaza i kopalni miedzi.
- **A — Rozszerzyć fix na kopalnie** ✅ WYBRANE. *Za:* kopalnia wkomponowana w zbocze wzgórza jest logiczniejsza niż płaski heks; spójne z kamieniołomem; 1 linia. *Przeciw:* nie prosiłeś wprost o kopalnie.
- **B — Tylko kamieniołom** (kopalnie zostają płaskie). *Za:* ściśle w zakresie zgłoszenia. *Przeciw:* niespójność wizualna, ten sam bug zostaje.

## C-MAP-SOL-ZIEMIA — sól na mapie „Ziemia"
**Sytuacja:** Po „sól tylko Wybrzeże" mapa typu Ziemia (0 heksów Wybrzeża) nie ma soli.
- **A — Akceptuj** ✅ WYBRANE; generator Wybrzeża-Ziemi jako osobny dług. *Za:* zero ryzyka, poza zakresem; naprawi też łodzie/warzelnię później. *Przeciw:* luka na Ziemi.
- **B — Napraw generator Wybrzeża Ziemi** (osobne, duże). *Przeciw:* ryzyko zmiany wyglądu map Ziemia.
- **C — Fallback sól na Pustynię/Równinę** gdy brak Wybrzeża. *Przeciw:* łamie regułę „tylko Wybrzeże".

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
- **A — FIFO + usuwanie** ✅ WYBRANE (przycisk „×", bez przestawiania). *Za:* najprościej przy max 3. B — strzałki góra/dół · C — drag&drop.

## C-RES-Q3 — ETA kolejki
- **C — ETA skumulowane per pozycja + ostrzeżenie o niespójnej kolejności** ✅ WYBRANE. *Za:* ciche pomijanie przez silnik bez ostrzeżenia wygląda jak bug. A — tylko aktywny cel · B — ETA bez ostrzeżenia.

## C-RES-Q4 — kolejka dla AI
- **A — AI bez kolejki** ✅ WYBRANE (zostaje heurystyka co turę — AI i tak nigdy nie stoi). *Za:* zero ryzyka regresji balansu AI. B/C — formalna kolejka AI (martwy kod / ryzyko).

## C-EDGEPAN-Q1 — kiedy działa przesuwanie mapy przy krawędzi
- **A — Tylko gdy zaznaczona jednostka** ✅ WYBRANE (dokładnie jak opisałeś). *Za:* nie porywa mapy przy biernym oglądaniu. *Przeciw:* niespójne z „zawsze aktywnym" w 4X. B — zawsze · C — też w trybie budowy. (Przełączenie = 1 linia.)

## C-RANK-Q1 — prezentacja nieodkrytych w rankingu Mocy
- **B — „Jesteś X. z N cywilizacji (uwzględnia nieodkryte)"** ✅ WYBRANE (bez osobnych wierszy „???"). *Za:* dokładnie o to prosiłeś; zero info-leaku o nieodkrytych. A — pełna lista z „???" · C — zbiorczy „+K nieodkrytych".

## C-SENTRY-Q1 — zakres Sentry (czuwanie)
- **B — Proste „uśpij/obudź" ręcznie** ✅ WYBRANE (bez auto-budzenia na wroga). *Za:* bez ryzykownej logiki auto-wake w silniku tur/AI. A — pełne auto-budzenie na wroga w zasięgu wzroku (większa mechanika) · C — tylko wizualny znacznik. **Ikona Sentry = półksiężyc** (do ewentualnej korekty Design).

## C-BITWA-WLADCA — imię władcy gdy obie strony to ta sama cywilizacja
**Sytuacja:** Portret/ikona władcy naprawione (było zawsze „Minos/grecy" — teraz poprawnie per cywilizacja). ALE gdy dwaj gracze to ta sama kultura (np. dwóch Greków / Grek vs greckie miasto-państwo), dzielą jedno imię władcy per cywilizacja+epoka („Minos" po obu stronach).
- **A — Zostaw per-cywilizacja** ✅ WYBRANE (imiona 15×3 są z definicji per-civ). *Za:* zgodne z Twoją decyzją o 15×3; proste. *Przeciw:* dwaj Grecy = dwa „Minosy".
- **B — Odrębne imię per gracz/właściciel** (pula imion, miasta-państwa dostają wariant). *Przeciw:* nowa mechanika przydziału imion; wykracza poza 15×3.

## C-BITWA-FORMACJA — zakres przycisku „Formacja/szyk"
**Sytuacja:** Bug: „szyk piechota/dystans" działał tylko na zaznaczenie (mylące). Naprawione.
- **A — Formacja zawsze na CAŁĄ armię** ✅ WYBRANE. *Za:* intuicyjne, znika „nie działa". *Przeciw:* brak szybkiego ustawiania szyku pojedynczej grupy tym przyciskiem (osobny mechanizm postawy grupy zostaje).
- **B — Formacja na zaznaczenie gdy coś zaznaczone** (z jawnym komunikatem zakresu). *Przeciw:* wraca dwuznaczność.

---

## ⏸ NIE decyduję sam — czekam na Ciebie (genuine wybór produktowy)

## C-BITWA-FACING — flankowanie/kierunek (główny wniosek audytu)
**Sytuacja:** Facing (front/flank/rear) jest w 100% AUTOMATYCZNY — gracz nie ustawia kierunku jednostki; jedyny feedback to tekst w logu PO starciu. Audyt wskazuje to jako główne źródło wrażenia „ciężko sterować, nielogiczne".
- **A — Minimalny wskaźnik kierunku** na pierścieniu zaznaczenia PRZED rozkazem (widać, w którą stronę jednostka „patrzy"), bez zmiany mechaniki. *Za:* tanie, bez refaktoru silnika; rozwiązuje czytelność. *Przeciw:* nadal brak realnej KONTROLI nad facingiem.
- **B — Realna kontrola facingu** (komenda „obróć się") + wskaźnik. *Za:* pełna taktyka oskrzydlania. *Przeciw:* nowa mechanika + UI + parytet AI, większa praca.
- **C — Zostaw jak jest** (tylko log po fakcie). *Przeciw:* zostaje główna bolączka.
- **MOJA REKOMENDACJA: A** — ale to Twoja decyzja projektowa (czy w ogóle dawać kontrolę). Czekam.

## Pomniejsze z audytu (do decyzji, nie pilne)
- **Ctrl+klik multi-select**: jest tylko w bitwie, brak na mapie świata (złamany nawyk) — ujednolicić?
- **Dwa różne „Auto"**: auto-rozstrzygnięcie mocą (pomija pole) vs auto-odgrywanie na polu — przemianować jedno?
