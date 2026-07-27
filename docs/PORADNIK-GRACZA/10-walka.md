# Część X — Walka

> **Poradnik gracza (Pełny)** · preBattle · auto-walka · bitwa 3D · countery · teren  
> Powiązane: [`57-katalog-jednostek.md`](57-katalog-jednostek.md) · Część IV (ruch, armie) · Część XI (oblężenie) · spis §57–65

Walka zaczyna się, gdy twoja jednostka wchodzi w kontakt z wrogiem lub atakuje miasto. Gra oferuje **szybką symulację** na mapie strategicznej albo **bitwę ręczną 3D**. Ten rozdział opisuje decyzje przed walką, macierz typów, teren i powrót na mapę. Pełne statystyki 50 jednostek — w katalogu jednostek.

---

## 57. Wejście w walkę (preBattle)

### 57.1. Ekran przed bitwą — cztery opcje

Po starcie starcia (bitwa polowa) pojawia się **preBattle**:

| Opcja | Efekt |
|-------|-------|
| **Auto-walka** | Szybka symulacja na mapie, wynik w sekundach |
| **Bitwa ręczna** | Przejście do pola 3D z pełną kontrolą |
| **Wycofaj** | Anuluj atak — **zero strat**, ruch zachowany |
| **Zapisz grę** | Quick save przed decyzją |

### 57.2. Skróty klawiaturowe

- **Enter** — potwierdź wybór (domyślnie Auto lub ostatni wybór).
- **Escape** — wycofaj się bez strat.

### 57.3. Wycofanie bez strat

**Wycofaj** działa **przed** rozpoczęciem walki: jednostka zostaje na mapie i **nie traci ruchu**. Po wyborze Auto lub Bitwa ręczna decyzja jest nieodwracalna w tej turze.

### 57.4. Miasto z murem — inny flow

Przy wrogim mieście **z murem** nie wchodzisz od razu w preBattle polową. Menu: **Oblężaj** / **Szturm** / **Anuluj** (Część XI §66). **Oblężaj** — panel oblężenia bez 3D. **Szturm** — preBattle jak bitwa polowa.

### 57.5. Pozycje startowe

**Brak fazy rozstawiania** — armie stoją tam, gdzie na mapie strategicznej. Posiłki w promieniu **1 heks** dołączają automatycznie (Część IV §26). Teren heksu bitwy przenosi bonusy na pole (§62–63).


### Przykład liczbowy

Piechota **10** vs włócznik **8**, bonus terenu **+15%** → efektywne **11,5** vs **8**.
Auto-walka: straty ~**30%** słabszej strony przy przewadze **×1,4** mocy.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 58. Atak wrogiego miasta z mapy

### 58.1. Warunki

Jednostka **zaznaczona**, **obok** miasta (1 heks), w stanie wojny lub z casus belli. Garnison wroga wchodzi do obrony. Klik miasta — menu kontekstowe.

### 58.2. Miasto z murem

**Oblężaj** (długa gra), **Szturm** (natychmiast), **Anuluj**. Machiny oblężnicze — Część XI §69.

### 58.3. Miasto bez muru

Przy słabej obronie miasto może paść szybciej; przy silnej — preBattle lub auto jak bitwa polowa. Po zdobyciu: zmiana właściciela, populacja, budynki (wg reguł v1).

### 58.4. Checklist przed atakiem

- Siła garnizonu i muru (zwiad).
- **Żywność wojska** — głód osłabia przed walką (Część VIII §50).
- Posiłki wroga w promieniu 1.
- Katapulta / taran przy murach (epoka Żelaza).


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 20 + N × 16; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 60% skarbiec · 20% nauka · 20% zamożność.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 59. Auto-walka (mapa strategiczna)

### 59.1. Jak działa

Silnik liczy straty wg wzoru **coef v2b**: moc jednostek (M), countery, teren, liczebność. Podsumowanie strat obu stron; ocalałe wracają na mapę (§65).

### 59.2. Kiedy Auto

- Przewaga liczebna i korzystne countery.
- Drobne potyczki, słabsze AI.
- Szybki test przed bitwą ręczną o kluczową armię.

### 59.3. Kiedy ryzykowne

- Równy skład, wroga kawaleria vs twoja piechota.
- Jednostki **oblężnicze w polu** — M=0 w sumie armii (§62.2).
- Unikalne super-jednostki — lepiej 3D.

### 59.4. Auto a siła państwa

Wygrana auto dodaje sumę mocy pokonanego wroga do **siły państwa** (§52.2). Oblężanie **nie** używa auto-walki polowej — osobny tryb (Część XI).


### Przykład liczbowy

Piechota **10** vs włócznik **8**, bonus terenu **+15%** → efektywne **11,5** vs **8**.
Auto-walka: straty ~**30%** słabszej strony przy przewadze **×1,4** mocy.

### Strategia gracza

Sprawdź **macierz typów** przed atakiem — włócznik vs kawaleria to inna matematyka niż vs piechota.

### Typowe błędy

- Atak **bez** sprawdzenia terenu — równina vs wzgórze to **±15–25%** mocy.
- Pułapka auto-walki przy **2×** przewadze wroga.

---

## 60. Bitwa ręczna 3D — HUD TW-v5

### 60.1. Layout (kompletny, 2026-07-23)

HUD przeszedł pełne przeprojektowanie na makietę **POLE-BITWY-TW-v5** (3 fazy, dziś w komplecie):

| Element | Gdzie | Co pokazuje |
|---------|-------|-------------|
| **Karty dowódców** | Górne rogi (obie strony) | Medalion z **portretem władcy** (wg cywilizacji + epoki, fallback żelazo→brąz→kamień→ikona) + pierścień HP + liczniki typów jednostek |
| **Zegar bitwy + pasek przewagi** | Górny środek | Czas starcia; złoty marker przesuwa się w stronę silniejszej armii |
| **Roster jednostek** | Krawędź ekranu, karty z medalionem typu | Puste sloty „+", jednostka **martwa** = „✕ Padła", **rozbita** = „Rout" |
| **Filtry rosteru** | Rząd ikon nad kartami, dwa piętra | Rząd 1: ikony klas (podkowa=Konnica z niebieską obwódką, skrzyżowane miecze=Piechota, tarcza=Dystansowe) + **Wszystkie** (4 kropki) + **★ Generał**; rząd 2: grupy **G1/G2/G3** jako kompaktowe chipy |
| **Minimapa + panel TEMPO** | **Prawy dolny róg** (jeden wspólny panel) | Minimapa bitwy nad rzędem przycisków Pauza / ×1 / ×2 / ×4 / AUTO |
| **Toolbar dolny** | Ikony 46×46, bez podpisów | Formacja/Konnica/Linie/Taktyka/Strategia (rozstawianie) lub zegar/budynek (walka) — pełna nazwa w pigułce **na hover** |
| **Start walki / Reset / Wycofaj** | Pływający klaster prawy-dół (osobno od minimapy) | — |
| **Zębatka ⚙** | Przy „Wycofaj się" | Popup z dawnym prawym railem (Muzyka/Historia/Info/Pomoc) — sam rail 56px zlikwidowany |

Nazewnictwo dokładnych etykiet może się nieznacznie różnić w buildzie — szukaj wg **funkcji z tabeli**, nie dosłownego tekstu.

### 60.2. Sterowanie

- **Mysz** — zaznaczanie, ruch, atak.
- **S / P / H / M** — formacje / postawy (wg buildu).
- **Ctrl+M** — menu / mapa.
- Przeciąganie z listy — wybór wielu jednostek.
- Klik ikony filtra rosteru — zawęża listę do klasy/grupy/Generała; hover pokazuje pełną nazwę w pigułce.

### 60.3. Efekty i wizualia (2026-07-23)

Scena 3D ma dziś: **plansze wg terenu hexa** (§63.0), tonację ACES + światło + mgła, kępy trawy i dekor z bliska, banery stron nad oddziałami, mur oblężniczy z wieżyczkami. Odróżnienie łuku i miecza, **linie rozkazów**, uproszczone trafienia (bez pełnej fizyki).

### 60.4. Wynik strategiczny — ekrany Koniec bitwy i Szczegóły

Po starciu: **ekran Koniec bitwy** (karta Zwycięstwo złota/laur lub Porażka czerwona/złamane miecze, 3 kafle strat, CTA „Powrót na mapę" + „Rozegraj ponownie" + „Szczegóły bitwy"). **Szczegóły bitwy** — dwie kolumny ATK/OBR, rozbicie Zniszczone/Rozbite/Ocalałe, licznik ludzi przed→po (np. „1240→862 ludzi po bitwie"). Zwycięstwo — wróg znika lub ucieka; Porażka — straty na mapie.


### Przykład liczbowy

Piechota **10** vs włócznik **8**, bonus terenu **+15%** → efektywne **11,5** vs **8**.
Auto-walka: straty ~**30%** słabszej strony przy przewadze **×1,4** mocy.

### Strategia gracza

Sprawdź **macierz typów** przed atakiem — włócznik vs kawaleria to inna matematyka niż vs piechota.

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 61. Macierz typów i countery

### 61.1. Role (pięć typów)

| Rola | Przykłady |
|------|-----------|
| **Wręcz** | Wojownik, falanga, gwardia |
| **Dystans** | Łucznik, procarz |
| **Kawaleria / flanka** | Konnica, rydwan |
| **Oblężnicza** | Katapulta, taran, wieża |
| **Wsparcie** | Zwiadowca |

Pełna lista jednostek (73, nie 50 — roster urósł 2026-07-21): [`57-katalog-jednostek.md`](57-katalog-jednostek.md).

### 61.2. Counter ×1,5 i włócznia vs Mount +50%

Atak **skuteczny** vs słaby typ wroga — ok. **×1,5** obrażeń plus bonus procentowy z definicji jednostki. Tooltipy pokazują ikony „silny vs słaby". Konkretny, potwierdzony przykład: **każda** jednostka uzbrojona we włócznię/pikę (12 jednostek — typ `Spearman` **i** `Falangite`, kryterium to broń, nie etykieta) ma **+50% obrażeń vs Mount** (kawaleria/rydwany) — pełna lista w katalogu jednostek §„Bonus vs Mount".

### 61.3. Balans Panel-C

Macierz eksportowana z Excela do gry — **w toku** sign-off. Nie polegaj na starych liczbach spoza rejestru decyzji.

### 61.4. Taktyka gracza

- Łucznicy **z tyłu**, piechota z przodu.
- Kawaleria na flankę dystansu.
- Oblężnicze tylko z eskortą.
- Unikalne jednostki kulturowe — te same countery (Część XIII §85).


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 62. Moc jednostki (M) i straty

### 62.1. Składniki M

**Zdrowie**, **Charge** (kawaleria), **Missile** (dystans) — suma **M_pole** w auto-walka i sile państwa.

### 62.2. Oblężnicze w polu

**M = 0** w sumie armii na mapie. W oblężeniu — osobne reguły (§64, Część XI).

### 62.3. Obrażenia i karta [H]

Każdy typ ma bazowe obrażenia w danych; skalowanie epoką/tech. Karta jednostki **[H]** na mapie — podgląd statów (Część IV §22).

### 62.4. Morale i głód

Utrzymanie w ¤ nie wpływa **w trakcie** bitwy, ale **głód wojska** przed starciem osłabia. Jednostki unikalne często wyższe M.


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 63. Teren na polu bitwy

### 63.0. Plansze wg terenu hexa świata (2026-07-23)

Pole bitwy 3D **odzwierciedla teren heksu**, na którym starcie się rozgrywa — 8 presetów: **łąka** (jeziorka, gęstsza trawa), **równina** (rzadszy las), **wzgórza** (grzbiety, skały brzegowe), **góry** (mocniejsze wzniesienia niż wzgórza), **las** (nakładka gęstego lasu na dowolnej bazie), **pustynia** (paleta piasku, bez lasu), **wybrzeże** (pas wody wzdłuż jednej krawędzi), **rzeka** (patrz §63.1). Tryb debug `?bt=<nazwa>` w URL wymusza konkretną planszę do testów. Bitwy „legacy" (bez informacji o hexie źródłowym) renderują się dokładnie jak dawniej.

### 63.1. Rzeka — koryto ciągłe + brody

Rzeka na polu bitwy to dziś **ciągłe koryto w kształcie litery S** przez całe pole (nie porozrzucane kałuże) — z **brodami** (Ford) w kilku miejscach, gdzie przejście jest możliwe. Mechanika brodu (wariant C, `combat-params.json` klucz `brod`):

| Efekt w brodzie | Wartość |
|-------------------|---------|
| **Ruch** | **×0,5** (dwa razy wolniej) |
| **Kara ataku** walcząc w brodzie | **−25%** |
| **Bonus obrońcy** stojącego na brzegu (broniącego brodu) | **+15%** obrony |

Tooltip jednostki w brodzie pokazuje aktywny status w wierszu TEREN (kolor czerwony/zielony wg tego, czy to ty atakujesz, czy bronisz). Atak przez/z rzeki poza brodem (starcie światowe, nie taktyczna plansza 3D) — osobna, numerycznie podobna kara ok. **×0,75** obrażeń atakującego (`river_attack_mult`) — dwa niezależne parametry, strojone osobno.

### 63.2. Wzgórze i góra

**Wzgórze** — obrona ×1,5; **góra** — obrona ×1,75 (wartości w `terrain-combat.json`). Piechota na Górach: koszt ruchu **2** (jak na lądzie); konnica/rydwan — niedostępne. Atak z dołu trudniejszy. Na planszy „góry"/„wzgórza" (§63.0) wzniesienia są też **gęściej rozmieszczone i wyższe** niż na pozostałych presetach — łatwiej o naturalną osłonę.

### 63.3. Las, miasto, morze, pustynia, wybrzeże

Las — cover dla dystansu (gęściej na presecie „las"). Miasto/mur — wysoka obrona w szturmie, zabudowa za murem i gruz w wyłomie (Część XI §70). Morze — jednostki morskie. Pustynia — brak lasu, twardszy teren otwarty. Wybrzeże — pas wody wzdłuż krawędzi planszy.

### 63.4. Strategia vs taktyka

Auto bierze teren **heksu startowego**. W 3D plansza generuje się **automatycznie** wg presetu tego heksu (§63.0) — wybieraj heks pod kątem tego, jaki teren chcesz mieć w starciu (np. wciągnij kawalerię wroga w bród, zanim odpalisz kontratak włócznikami).


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 64. Jednostki specjalne i machiny

### 64.1. Katapulta (epoka Żelazo)

Niszczy mury w **oblężeniu**. W polu słaba, M=0 w sumie armii.

### 64.2. Taran i wieża

Budowane w kontekście oblężenia; przepadają przy odwrocie (Część XI §72).

### 64.3. Koszt rekrutacji

**Złoto + ludność + tech** — jak w Części VII §47. Skala z epoką.

### 64.4. Unikalne cywilizacji

Falanga, rydwan egipski, Impi… — [`57-katalog-jednostek.md`](57-katalog-jednostek.md) § po epokach.


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 65. Powrót z bitwy

### 65.1. Ocalałe jednostki

Wracają na **heks bitwy**. Ranni — obniżone HP; zniszczone — znikają z mapy i siły państwa.

### 65.2. Podsumowanie

Lista strat, ewentualny łup/XP (wg buildu). **Kontynuuj** — powrót na mapę.

### 65.2a. Doświadczenie i weterani (trzy poziomy)

Jednostka, która **przeżywa** bitwę, awansuje w doświadczeniu — system niezależny od Pancerza i od parametrów miękkich budynków:

| Poziom | Próg (przeżyte bitwy) | Premia do statystyk bojowych |
|--------|------------------------|-------------------------------|
| **1 — Rekrut** | 0 | 0% (dokładnie baza z karty jednostki) |
| **2 — Doświadczony** | 1 przeżyta bitwa | **+10%** |
| **3 — Weteran** (sufit) | 2+ przeżyte bitwy | **+20%** |

**Premie liczone od bazy, nie kumulują się między poziomami** — poziom 3 to baza ×1,20, nie baza ×1,10 → ×1,20 (czyli nie ×1,32).

**Co rośnie (+10%/+20%):** atak wręcz, obrona wręcz, obrażenia broni, przebicie, bonus szarży, zdrowie, atak dystansowy.

**Co jest wyłączone:** **Pancerz** — na żadnym poziomie doświadczenia się nie zmienia.

**Dwa pola odwrócone — niższa wartość jest lepsza dla jednostki, więc premia je OBNIŻA:**
- **Morale ucieczki** — doświadczony żołnierz łamie się **później**, nie wcześniej.
- **Próg dezercji (% zdrowia)** — doświadczony żołnierz dezerteruje przy **niższym** progu HP niż rekrut.

**Przykład liczbowy:** Wojownik bazowy: atak wręcz **10**, zdrowie **50**, próg dezercji **30%** HP.
Po 1. przeżytej bitwie (poziom 2, +10%): atak wręcz **11**, zdrowie **55**, próg dezercji **27%** HP (30% × 0,90).
Po 2. przeżytej bitwie (poziom 3, +20%, sufit): atak wręcz **12**, zdrowie **60**, próg dezercji **24%** HP (30% × 0,80) — **nie** 8 (baza ×0,90×0,80), bo premie nie kumulują się.

### 65.3. Fan-out — pierścień

Jednostki rozkładają się na **pierścieniu** wokół heksu bitwy (reguła M×W+) — unika stosu wielu armii.

### 65.4. Po bitwie

Zdobyte miasto — przejęcie lub oblężenie. Ruch jednostki mógł zostać zużyty wejściem w walkę. Quick save z preBattle — **przed** walką, nie po.


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Poradnik‑L · Część X · rev. G · 2026-07-26 (§65.2a: dopisany system doświadczenia/weteranów, 3 poziomy, nieopisany wcześniej) · rev. F 2026-07-23 (HUD TW-v5 komplet, plansze wg terenu hexa, bród, ekrany Koniec/Szczegóły bitwy, Bonus vs Mount) · pierwotnie rev. E 2026-07-03 · dane: `units.json`, `counters.json`, `combat-params.json`, `battle-terrain.ts`, `veteran.ts` · katalog: [`57-katalog-jednostek.md`](57-katalog-jednostek.md)*
