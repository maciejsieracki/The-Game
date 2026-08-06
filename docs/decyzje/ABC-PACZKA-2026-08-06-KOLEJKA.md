# ABC-PACZKA-2026-08-06-KOLEJKA — pełna lista pytań do Macieja

**Status:** 🟡 **OTWARTE** — czeka na odpowiedzi `ID=A|B|C`  
**Data:** 2026-08-06  
**Reguła:** [`R-ABC-PELNA-LISTA.md`](R-ABC-PELNA-LISTA.md) — wszystkie pytania naraz, numeracja `[n/N]`, bez limitu 3 · bez popupów AskQuestion  
**Źródła:** `R-AI-TRUDNOSC-AUDYT.md` · `PYTANIA-OTWARTE.md` · `REJESTR-PROSB-I-ZADAN.md` · audyt wiarygodności 2026-08-05

---

## [LISTA ABC — 5 pytań]

| # | ID | Temat |
|---|-----|--------|
| 1 | **AI-BALANS-STEP6-Q1** | Następna dźwignia balansu major AI (po STEP1–5) |
| 2 | **R-KAMIEN-RELIEF-FOLLOWUP-Q1** | Whitelist reliefu: legacy `kopalnia` vs specjalistyczne kopalnie |
| 3 | **MAP-UX-CLUSTER-LABEL-Q1** | Etykiety stolica vs miasto-państwo w klastrze |
| 4 | **R-WIARYGODNOSC-S9-Q1** | Strojenie liczb §9 — teraz vs odłożyć |
| 5 | **R-DESIGN-PANEL-MIASTA-V2-Q1** | Polish wizualny pigułki — czekać na Design vs status quo |

**Odpowiedź Macieja:** litery w kolejności (`A B C A B`) albo `ID=litera` per pozycja → agent ECHO wszystkich naraz.

**Poza paczką (nie ABC gameplay):** `P-TEST-UPKEEP-R-STAWKI` — aktualizacja testów po ×2 kosztach (inżynieria, nie decyzja produktowa). `P-AI-MOC-GAP` — monitoring po łańcuchu STEP + diag Mocy (FALA 239); brak nowego ABC do czasu playtestu.

---

## [1/5] AI-BALANS-STEP6-Q1 — następna dźwignia major AI (po STEP1–5)

**[TEMAT: Balans trudności — major AI]**

### Sytuacja

Wdrożono małe kroki **STEP1–STEP5** z audytu `R-AI-TRUDNOSC-AUDYT.md` (ostatni deploy: STEP5 `bonus_produkcja` → realna Praca, FALA 253). Zasada `AI-BALANS-UNLOCK-Q1=B` pozwala na **jedną małą dźwignię na falę** z testem AutoBot. Audyt wskazuje kolejne kandydaty, które nie były jeszcze wdrożone w torze STEP.

### Cel pytania

Wybrać **jedną** następną dźwignię (**STEP6**) do implementacji — taką, która najbardziej przyspieszy rozwój major AI bez buffowania miast-państw i bez przebudowy systemu.

### Dlaczego teraz

Po STEP5 logiczna kolejność to kolejny mały krok z rankingu przyczyn słabego rozwoju (§B audytu). Bez wyboru operator nie wie, który parametr/scoring ruszyć w następnej fali.

### A — Kara score drugiego zwiadowcy (−80 pkt po pierwszym scoutcie)

Po zbudowaniu **pierwszego** Zwiadowca w major AI: obniżyć score kolejnego Zwiadowca w `chooseCityProduction` o **80 punktów** (audyt P1-2 / §C.2 Q3). Dotyczy wszystkich poziomów trudności lub z priorytetem L3 — implementacja w `ai.ts` + test.

**Za:**
1. Bezpośrednio adresuje rank **#5** audytu (wyścig scoutów blokuje Spichlerz/Koszary).
2. Mała, izolowana zmiana scoringu — zgodna z zasadą jednej dźwigni na falę; łatwy rollback w JSON/stałej.

**Przeciw:**
1. AI może wolniej eksplorować mapę i tracić prezenty z wiosek.
2. Efekt odczuwalny głównie we wczesnej fazie — nie rozwiązuje `canAfford` / pustych tur (rank #3).

### B — Skrócić fazę lokalną ekspansji na Trudnym (tura 20 → 15)

Na poziomie **Trudnym** skrócić `isLocalExpansionPhase` — blokada `planCityFounding` kończy się w **turze 15** zamiast 20 (warunek „brak scouta + cluster” bez zmian). Audyt rank **#6**.

**Za:**
1. Wcześniejsze zakładanie kolonii na L3 — wykorzystuje bonus +1 miasta startowego i łańcuch STEP1 (kolonizacja pop 4).
2. Tylko major AI na Trudnym — nie dotyka MP ani Prostego/Normalnego.

**Przeciw:**
1. Szybsze zapełnianie mapy i snowball terytorialny vs gracz.
2. Mniej czasu na lokalne wioski przed ekspansją — może obniżyć early income z prezentów.

### C — Obniżyć priorytet Zwiadowca na Prostym (score 320 → 220)

Na poziomie **Prostym** (L1) obniżyć bazowy score produkcji **Zwiadowca** z **320** do **220** w `chooseCityProduction` (audyt §C.1 Q1). L2/L3 bez zmian.

**Za:**
1. Prosty AI szybciej buduje Spichlerz i infrastrukturę — zgodne z rolą „słabszego przeciwnika, ale rozwijającego się”.
2. Izolowana dźwignia per poziom — łatwo stroić w `ai-params.json` po wdrożeniu klucza.

**Przeciw:**
1. Nie pomaga Trudnemu — główny problem gapu Mocy dotyczy L3.
2. Gracz na Łatwym może odczuć mniej presji eksploracyjnej ze strony AI.

### Rekomendacja

**A** — najlepszy stosunek efekt/ryzyko po STEP5; bezpośrednio z audytu P1-2 i nie wymaga dotykania mapy/spawnu.

---

## [2/5] R-KAMIEN-RELIEF-FOLLOWUP-Q1 — whitelist reliefu dla kopalni

**[EKRAN: Mapa świata — ulepszenia na wzgórzu/górze]**

### Sytuacja

Po decyzji **R-KAMIEN-RELIEF** kamieniołom na wzgórzu **zachowuje** naturalny kopiec (nie spłaszcza heksu). W kodzie `PRESERVES_HILL_RELIEF_KEYS` (`main.ts`) są już: `kamieniolom`, `kopalnia_miedzi`, `kopalnia_zelaza`, `kopalnia_zlota` (decyzja RELIEF-SEKTOR-Q2 / 2026-07-31). **Legacy** klucz ulepszenia `kopalnia` (uniwersalna kopalnia na starych save / migracje) **nie** jest na whiteliście — nadal może spłaszczać relief.

### Cel pytania

Ustalić, czy rozszerzyć whitelistę o brakujące klucze kopalń, czy uznać temat za domknięty.

### Dlaczego teraz

REJESTR-PROSB nadal wskazuje follow-up jako „czeka na decyzję”. Jednolinijkowa zmiana w `main.ts` — ale wymaga Twojej zgody przed kodem (render, bez wpływu na ekonomię).

### A — Dodać `kopalnia` (legacy) + potwierdzić `kopalnia_miedzi` (już jest)

Rozszerzyć `PRESERVES_HILL_RELIEF_KEYS` o **`kopalnia`**; `kopalnia_miedzi` zostaje (już wdrożone — spójność dokumentacji). Wszystkie typy kopalń na wzgórzu zachowują relief jak kamieniołom.

**Za:**
1. Spójność wizualna — kopalnia w zboczu wzgórza wygląda naturalniej niż płaski heks.
2. Minimalny diff (1 klucz w Set); zero zmiany gameplayu.

**Przeciw:**
1. `kopalnia` to ścieżka legacy — docelowo znika po pełnej migracji na `kopalnia_*`.
2. Model 3D legacy kopalni mógł być zaprojektowany pod płaski teren — możliwa drobna asymetria wizualna.

### B — Tylko ścieżka żelaza (`kopalnia` / `kopalnia_zelaza`)

Traktować jako zamknięte dla miedzi/złota (już na whiteliście); ewentualnie dodać **tylko** `kopalnia` jeśli brakuje, **bez** ruszania miedzi.

**Za:**
1. Żelazo to najczęstszy case na wzgórzu w epoce Brązu/Żelaza.
2. Najmniejszy zakres zmiany.

**Przeciw:**
1. Miedź już jest na whiteliście — opcja B jest w praktyce „tylko legacy `kopalnia`”, co myli nazewnictwo.
2. Niespójność docs vs intencja „obie kopalnie” z zgłoszenia.

### C — Zostawić jak jest (bez `kopalnia` legacy)

Specjalistyczne `kopalnia_*` zostają; legacy `kopalnia` nadal może spłaszczać wzgórze do czasu migracji save.

**Za:**
1. Legacy i tak znika — nie investować w render ścieżki wycofywanej.
2. Zero ryzyka regresji wizualnej na starych mapach.

**Przeciw:**
1. Gracz ze starym save nadal widzi płaski heks przy universalnej kopalni.
2. Niespójność: miedź/żelazo/złoto OK, ale `kopalnia` nie.

### Rekomendacja

**A** — jedna linia kodu, spójność z kamieniołomem; `kopalnia_miedzi` już jest, dopinamy brakujące `kopalnia`.

---

## [3/5] MAP-UX-CLUSTER-LABEL-Q1 — etykiety w klastrze (stolica vs miasto-państwo)

**[EKRAN: Mapa świata — pigułki miast]**

### Sytuacja

Audyt `AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02`: **VERDICT DESIGN_KLASTRA** — ~4 bliskie etykiety to **1 stolica + 3–4 miasta-państwa** w pierścieniu 5 hex (menu Standard min 4 MP). Sep stolic między cywilizacjami = **14 hex** (twarda bramka) — **to nie bug**. Chipy wizualnie nachodzą; nazwy z tej samej puli `nazwyKlastra` wyglądają podobnie. Dziś MP ma dopisek „· miasto-państwo” (`formatCityMapLabel`).

### Cel pytania

Czy poprawiać **czytelność UX** na mapie (jak odróżnić stolicę klastra od MP), bez zmiany sep/spawnu.

### Dlaczego teraz

Temat od 2026-08-02 bez decyzji. Zmiana dotyka tylko `cityMapStatChip` / `cities.ts` — ale **bez ABC nie wdrażamy** (audyt §„Co NIE zmieniamy”).

### A — Zostawić (dopisek „· miasto-państwo” na MP)

Bez zmiany nazw; polegamy na dopisku i wielkich literach na chipie.

**Za:**
1. Zero pracy kodowej; zachowanie zgodne z audytem „nie bug”.
2. Gracz po czasie uczy się czytać dopisek.

**Przeciw:**
1. Nadal wygląda jak „kilka stolic obok siebie” na pierwszy rzut oka.
2. Krótkie nazwy z puli klastra (np. 4–6 liter) są mało rozróżnialne.

### B — Stolica obca = nazwa cywilizacji; MP = nazwa miasta + dopisek

Stolica obcego państwa pokazuje **etykietę cywilizacji** (np. „Chińczycy”); miasto-państwo — **nazwę z puli** + „· miasto-państwo”.

**Za:**
1. Natychmiast widać, która etykieta to stolica państwa.
2. Nie zmienia spawnu ani sep — tylko warstwa prezentacji.

**Przeciw:**
1. Stolica traci „lokalną” nazwę miasta — mniej klimatu.
2. Wymaga mapowania civId → etykieta (edge case: dwie stolice tej samej cywilizacji niemożliwe, ale spójność z własną stolicą gracza).

### C — Marker wizualny stolicy (korona / grubsza obwódka), nazwy bez zmian

Dodać **ikonę lub obwódkę** na chipie stolicy; tekst nazw bez zmian.

**Za:**
1. Nazwy zostają jak dziś — mniej zmian w logice etykiet.
2. Czytelne „na mapie” bez czytania długich stringów.

**Przeciw:**
1. Więcej pracy wizualnej (Design + render); ryzyko clutter przy 4 chipach obok siebie.
2. Bez makiety Design może wyjść „cheap” w porównaniu z resztą UI.

### Rekomendacja

**B** — jeśli w ogóle zmieniać; największy zysk czytelności przy małym zakresie logiki (bez ruszania generatora mapy).

---

## [4/5] R-WIARYGODNOSC-S9-Q1 — strojenie liczb (§9 spec)

**[TEMAT: Dyplomacja — Wiarygodność cywilizacji]**

### Sytuacja

Rdzeń wiarygodności jest **wdrożony** (FALA 233–237: R1/R1b, UI badge, ranking, progi D3, tempo, dryf Z). Audyt `R-WIARYGODNOSC-AUDIT-OPEN-VS-DEPLOYED-2026-08-05`: **0 otwartych ABC produktowych** w §9 — decyzje z 2026-07-26 zamknięte. Pozostaje **strojenie liczb**: wagi kar N1–N7, strumień S1–S4, czasy zapominania, progi w `diplomacy.json` / `DIPLOMACY_PARAMS` — dziś wartości placeholderów z fali wdrożeniowej.

### Cel pytania

Czy teraz otworzyć **paczkę strojenia §9** (zmiany liczb w JSON + testy), czy odłożyć do playtestu dłuższej gry dyplomatycznej.

### Dlaczego teraz

`STAN-PRACY-HANDOFF` i REJESTR nadal listują „strojenie §9 później”. Bez decyzji operator nie wie, czy kolejna fala to liczby wiarygodności, czy inne tematy (AI STEP6, mapa UX).

### A — Paczka strojenia teraz (pełna §9)

Przegląd i dostrojenie **wszystkich** parametrów strojeniowych wiarygodności w JSON (wagi N*, S*, half-life strumienia, progi UI) + testy regresji `wiarygodnosc-test.cjs`.

**Za:**
1. Mechanizm jest kompletny — liczby to ostatni brakujący element „feel” dyplomacji.
2. Zmiany w JSON są odwracalne i izolowane (🟢 warstwa danych).

**Przeciw:**
1. Bez długiego playtestu negocjacji łatwo przesadzić (kary zbyt ostre / łagodne).
2. Konkuruje o uwagę z AI balansem i mapą — rozproszenie fali.

### B — Odłożyć do post-playtest (zalecenie audytu 2026-08-05)

Nie ruszać liczb; zebrać obserwacje z gry (NAP łamany, kary W, tempo Z) i dopiero potem paczka strojenia.

**Za:**
1. Audyt explicite: strojenie = post-playtest, nie ABC blokujące kod.
2. Najpierw domknąć AI/mapę — większy wpływ na v1.0.

**Przeciw:**
1. Placeholdery mogą dawać złe odczucie już dziś (np. zbyt wolny dryf Z).
2. Temat wisi w rejestrze od tygodni — kolejne „później” bez terminu.

### C — Minimalna paczka (2–3 liczby krytyczne)

Tylko najbardziej widoczne parametry (np. `zaufanieDryfOdWiarygodnosci` współczynnik 0,03, `max_zaufanie_na_ture`, jedna waga N1) — reszta po playteście.

**Za:**
1. Szybki tuning „najgorszych” placeholderów bez tygodnia balansu.
2. Mniejsze ryzyko niż pełna paczka A.

**Przeciw:**
1. Częściowe strojenie może być niespójne (np. kary N vs strumień S).
2. Nadal wymaga czasu na testy bez danych z playtestu.

### Rekomendacja

**B** — zgodnie z audytem; pełne strojenie ma sens po sesji dyplomatycznej, gdy masz odczucie „za łagodne / za ostre”.

---

## [5/5] R-DESIGN-PANEL-MIASTA-V2-Q1 — polish wizualny po Q4=B

**[EKRAN: Mapa świata — pigułka miasta]**

### Sytuacja

Decyzje Q1–Q3 i **Q4=B** (2026-08-06): hover produkcji + ostrzeżenie surowców **wdrożone w kodzie** bez makiety Design (`cityMapStatChip.ts`, FALA 251). Zlecenie Design (`DO-DESIGN-PANEL-MIASTA-MAPA-2026-07-25.md`) nadal przewiduje **3 klatki** (baseline, MUST always-on, hover rozszerzony) do ewentualnego polishu wizualnego.

### Cel pytania

Czy **blokować** dalszy polish pigułki do czasu makiety Design v2, czy uznać obecny prototyp za wystarczający do v1.0.

### Dlaczego teraz

Funkcja hover jest już w ROBOCZA; Design może nie wiedzieć, czy ma jeszcze dostarczać klatki. Bez decyzji — ryzyko równoległej pracy UX vs „wystarczy jak jest”.

### A — Czekać na makietę Design v2 przed jakimkolwiek dalszym kodem wizualnym

Kod pigułki **zamrożony** wizualnie; Design dostarcza 3 klatki; dopiero potem integracja wyglądu.

**Za:**
1. Spójność z pierwotnym Q1=A (Design first) — jeden strzał wizualny.
2. Unikamy dwóch iteracji „prototyp → throwaway”.

**Przeciw:**
1. Hover już działa — czekanie blokuje tylko polish, nie funkcję.
2. Design może mieć niższy priorytet niż mapa/AI — pigułka stoi tygodniami.

### B — Status quo: funkcja z Q4=B wystarczy; Design polish **opcjonalny** później

Obecny wygląd zostaje do v1.0; jeśli Design dostarczy klatki — **opcjonalny** polish bez blokady innych zadań.

**Za:**
1. Zgodne z Q4=B i wdrożeniem 2026-08-06 — decyzja już częściowo podjęta.
2. MUST + hover działają; brak blokady gameplayu.

**Przeciw:**
1. Pigułka może wyglądać „prototypowo” vs reszta UI.
2. Design nie ma jasnego deadline — polish może nigdy nie nadejść.

### C — Zlecić Design teraz priorytet v2 (bez blokady kodu)

Design dostaje **pilne** zlecenie klatek v2; kod może lekko dopracowywać layout pod przygotowanie, ale bez dużych zmian przed dostawą.

**Za:**
1. Aktywuje Design z jasnym priorytetem.
2. Kompromis między A a B — harmonogram bez zamrażania kodu.

**Przeciw:**
1. Wymaga uwagi Macieja/Design — kolejny tor równoległy.
2. Ryzyko zmian layoutu po dostawie klatek (druga fala integracji).

### Rekomendacja

**B** — hover bez makiety już wdrożony (Q4=B); polish Design = nice-to-have, nie bloker v1.0.

---

## Po odpowiedzi Macieja

1. **ECHO** — zapis każdego `ID` + litera w `docs/decyzje/<ID>.md` i `REJESTR-DECYZJI.md`.
2. **Wdrożenie** — na hasło `działaj` per temat; deploy osobno.
3. **Paczka** — status → 🟢 ZAMKNIĘTA po ECHO wszystkich pozycji.
