# P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1 — karta odkrycia technologii

**Status:** ECHO `A` ZAPISANE (Maciej, 2026-08-21) — RECON ZAMKNIĘTY, naprawa wydzielona do
`R-TECH-ULEPSZENIA-TERENU-SYNC-Q1` (patrz `dyspozycje/PYTANIA-OTWARTE.md` →
`P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1` i ECHO poniżej). Prototyp zaakceptowany jako wzorzec;
rozbieżność źródeł danych (sekcja 4 niżej) rozstrzygnięta przez recon Operatora.
**Zakres tej notatki:** jedna karta demonstracyjna i propozycja UX. **Bez implementacji, bez zmian w `gra/src` i `gra/data`.**
**Data:** 2026-08-17

**ECHO P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1=A (Maciej, 2026-08-21, w czacie orkiestratora):**
zaakceptowany prototyp/UX jako wzorzec (§3 niżej); przed jakimkolwiek dalszym wdrożeniem
ogólnego wzorca dla WSZYSTKICH technologii — recon rozbieżności źródeł z §4 (12 vs 20
jednostek, status „Popalnia brązu”). WAŻNE: od czasu spisania tej notatki (2026-08-17)
`gra/src/ui/techDiscoveryNotice.ts` został ogólnie przeprojektowany i wdrożony dla
WSZYSTKICH technologii w FALI 300 (`R-TRZY-KARTY-WDROZENIE-Q1`, 2026-08-20) — bez
uprzedniego zamknięcia recon z tej notatki. Recon musi teraz w pierwszej kolejności
ustalić, czy ten już-wdrożony kod nadepnął na te same rozbieżności (np. czy pokazuje
nazwę „Popalnia brązu” mimo braku odpowiadającego wpisu w `terrain-improvements.json`)
zamiast zakładać, że wdrożenie jeszcze nie miało miejsca. Temat izolowany na branchu
`autobot/P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1`.

**Ograniczenia zakresu prototypu:**
- Wzór graficzny popupu/karty pozostaje osobnym etapem przygotowywanym przez Designera po akceptacji prototypu Brązownictwa.
- Linkowanie jednostek, budynków, ulepszeń i technologii do Civpedii/Wikipedii jest kolejnym etapem po akceptacji prototypu i briefu Designera; nie jest częścią obecnej implementacji.

## 1. Wybór przykładu

Wybrano **Brązownictwo**, ponieważ jest technologią o największej liczbie jawnie zapisanych typów odblokowań spośród dwóch rozważanych przykładów:

- `tech.json` deklaruje: **2 budynki**, **12 jednostek** w polu „Odblokowuje budynek”, **1 ulepszenie terenu**, dostęp do brązu i **3 technologie zależne**.
- `Rolnictwo` deklaruje: **0 budynków**, **0 jednostek**, **2 ulepszenia terenu** i brak bezpośrednio deklarowanych technologii zależnych w polu `Wymaga (prereq)` innych technologii.

Brązownictwo jest więc lepszym prototypem karty wielosekcyjnej: obejmuje budynki, jednostki, teren, zasób, awans epoki i dalsze gałęzie drzewa.

## 2. Karta demonstracyjna — Brązownictwo

### Nazwa i etap

- **Technologia:** Brązownictwo
- **Epoka w definicji technologii:** Kamień
- **Poziom:** 3
- **Koszt bazowy:** 90 PN
- **Awans:** `awansDoEpoki: 2`; definicja oznacza kamień milowy przejścia do epoki Brązu
- **Wymagania technologiczne:** Garncarstwo **+** Murarstwo **+** Obróbka drewna
- **Wymagany budynek/ulepszenie do rozpoczęcia:** brak wpisu w `wymagany budynek` i `wymagane ulepszenie`

Koszt 90 PN jest bazą dla tempa szybkiego. Istniejący system mnoży koszt przez ×1 (szybka), ×2 (standardowa) albo ×4 (długa); karta powinna pokazywać koszt wynikający z bieżącego tempa, a nie udawać, że zawsze wynosi 90 PN.

### Krótki efekt

Odkrycie daje **dostęp do brązu** oraz otwiera produkcję brązu, budynki i jednostki opisane poniżej. Samo odkrycie nie oznacza jeszcze, że budynek zostaje zbudowany ani że gracz otrzymuje darmowy zapas brązu.

### Odblokowane budynki

Z `gra/data/tech.json`:

1. **Odlewnia brązu**
2. **Kuźnia brązu**

Fakty z `gra/data/buildings.json`:

- **Odlewnia brązu:** `epokaWejscia: 2`, `kosztBudowy: 28`, utrzymanie `2`; wymaga rudy w magazynie państwa; opis danych mówi o konwersji `ruda + drewno → brąz`; koszt surowcowy budowy: Drewno 30, Kamień 40.
- **Kuźnia brązu:** `epokaWejscia: 2`, `kosztBudowy: 30`, utrzymanie `2`; baza: Praca 6, Pieniądz 1, mnożnik 15; wymaga dostępu do rudy miedzi w imperium; koszt surowcowy budowy: Drewno 30, Kamień 30. Uwagi budynku opisują mnożnik 15 jako **+15% Pancerza** dla jednostek, które odwiedziły miasto.

Jednostka pola `kosztBudowy` nie jest opisana w JSON-ie — karta nie powinna dopisywać do niej nazwy waluty bez potwierdzenia w istniejącym UI.

### Odblokowane jednostki

`tech.json` wymienia przy Brązownictwie 12 nazw: Włócznik, Wojownik z mieczem i tarczą, Impi, Wojownik z toporem, Wojownik z khopesh, Włócznik sumeryjski, Wojownik mykeński, Wojownik Sherden, Halabardnik Shang, Wieża oblężnicza, Wojownik tyrreński, Wojownik szekelesz.

**Ważna niespójność danych do pokazania właścicielowi, nie do ukrycia w karcie:** `gra/data/units.json` zawiera obecnie **20 wierszy z `Tech: "Brązownictwo"`**, w tym dodatkowo: Taran okuty, Strażnik bram Harappy, Piechota induska, Piechota hetycka, Gwardia Ishtar, Wojownik babiloński, Wojownik fenicki i Gwardzista z champi. Loader importuje oba pliki statycznie, ale źródła nie prezentują tej samej listy.

Lista 20 wierszy z `units.json` to:

Włócznik; Wojownik z mieczem i tarczą; Impi; Wojownik z toporem; Wojownik z khopesh; Włócznik sumeryjski; Wojownik mykeński; Wojownik Sherden; Halabardnik Shang; Taran okuty; Wieża oblężnicza; Wojownik tyrreński; Wojownik szekelesz; Strażnik bram Harappy; Piechota induska; Piechota hetycka; Gwardia Ishtar; Wojownik babiloński; Wojownik fenicki; Gwardzista z champi.

Wspólny fakt ekonomiczny z `units.json`: wszystkie te wiersze mają surowiec rekrutacji **Brąz**; ilość wynosi 50 albo 75, a koszt Pieniądza wynosi 14, 15, 16, 18 albo 20 zależnie od jednostki. Utrzymanie surowcowe jest zapisane jako Brąz 10 albo 15 na turę. Karta nie powinna zastępować tej listy własnym opisem „jednostki brązowe” bez rozstrzygnięcia rozbieżności 12 vs 20.

### Ulepszenia terenu

Występują dwa różne sygnały danych:

- `tech.json` deklaruje **Popalnia brązu**.
- `terrain-improvements.json` ma dwa wpisy z `tech: "Brązownictwo"`:
  - **Kopalnia miedzi:** epoka 2, koszt 22 Pracy, bonus pola Praca 2 i Handel 5, produkcja `ruda` 20/turę, tylko na złożu miedzi/rudy.
  - **Kopalnia cyny:** epoka 2, koszt 22 Pracy, bonus pola Praca 2 i Handel 5, produkcja `ruda_cyny` 20/turę, na złożu cyny.

W `gra/data` nie ma wpisu `Popalnia brązu` poza polem technologii i uwagą w `tech.json`. Dlatego karta powinna oznaczyć Popalnię jako **deklarację wymagającą synchronizacji**, a nie przedstawiać ją jako pewne, dostępne ulepszenie.

### Technologie następne

Bezpośrednie zależności od Brązownictwa w `tech.json`:

1. **Jeździectwo** — wymaga Koło + Brązownictwo.
2. **Wojskowość** — wymaga Brązownictwo.
3. **Hutnictwo żelaza** — wymaga Brązownictwo oraz wymaga budynku Odlewnia brązu.

To są następne węzły zależności, nie obietnica, że wszystkie stają się natychmiast dostępne: nadal obowiązują ich pozostałe wymagania i bramki.

### Co gracz może teraz zrobić

Po odkryciu, przy spełnieniu osobnych bramek budowy i zasobów, gracz może:

- uzyskać i przetwarzać brąz przez łańcuch Kopalnia miedzi / Kopalnia cyny → ruda w magazynie → Odlewnia brązu;
- budować Odlewnię brązu i Kuźnię brązu;
- budować wskazane kopalnie na odpowiednich złożach;
- korzystać z jednostek, których `units.json` wskazuje Brązownictwo jako `Tech` i Brąz jako surowiec rekrutacji;
- kierować dalsze badania w stronę Jeździectwa, Wojskowości lub Hutnictwa żelaza, po spełnieniu ich pełnych wymagań;
- doprowadzić do spełnienia kamienia milowego awansu, przy czym awans epoki jest osobną bramką runtime.

### Czego jeszcze nie może zrobić wyłącznie dzięki tej technologii

- Nie otrzymuje automatycznie zbudowanej Odlewni, Kuźni ani kopalni.
- Nie otrzymuje automatycznie brązu w magazynie.
- Nie dostaje automatycznie wszystkich jednostek z wpisów `units.json`.
- Nie odblokowuje bezpośrednio Żelaza, Jeździectwa ani Wojskowości bez ich własnych zależności.
- Nie przechodzi do epoki Brązu wyłącznie na podstawie samego pola `awansDoEpoki`: `owner-epoch.ts` wymaga wszystkich technologii bieżącej epoki, a jeśli cywilizacja ma przypisany cud epoki — także spełnienia bramki cudu.
- Nie należy obiecywać Popalni brązu, dopóki nie ma jej odpowiadającego wpisu w `terrain-improvements.json`.

### Zmiany ekonomiczne

Karta może pokazać tylko efekty wynikające z danych:

- dostęp do łańcucha brązu i magazynowania/przetwarzania rudy;
- Kopalnia miedzi i Kopalnia cyny produkują po 20 jednostek odpowiedniego surowca na turę (`surowiec_ilosc_tura`);
- Odlewnia brązu i Kuźnia brązu mają koszty budowy i utrzymania zapisane powyżej;
- jednostki z `units.json` mają koszty Brązu, Pieniądza i utrzymania surowcowego.

Karta nie powinna dopisywać premii do Nauki, Kultury, Zadowolenia ani Skarbca — dla samego Brązownictwa takie bezpośrednie premie nie są zapisane w `tech.json`.

## 3. Propozycja UX prototypu

1. **Moment:** po faktycznym ukończeniu badania, w tym samym miejscu, w którym dziś pojawia się informacja o zmianie epoki. Popup nie powinien otwierać się przy samym ustawieniu celu ani przy najechaniu węzła.
2. **Priorytet informacji:** najpierw nazwa + epoka + jednozdaniowy efekt; następnie „Możesz teraz”; dalej budynki/jednostki/ulepszenia; na końcu następne technologie, wymagania i ograniczenia.
3. **Zamknięcie:** wyraźny przycisk „Zamknij” oraz `Esc`. Zamknięcie nie anuluje zakończonego badania.
4. **Brak blokowania tury:** karta jest informacyjna; gracz może ją zamknąć i kontynuować turę. Nie wymusza wyboru następnego badania.
5. **Ponowne otwarcie:** kliknięcie odkrytej technologii w istniejącym drzewie powinno otwierać tę samą kartę w trybie „podgląd”, bez ponownego toastu.
6. **Istniejące wzorce:** obecny `techTreeView.ts` ma kartę węzła na hover z epoką, wymaganiami, odblokowaniami i dependents; `sciencePicker.ts` ma tooltip z kosztem, wymaganiami, budynkami, surowcami i ulepszeniami; `scienceHubHud.ts` pokazuje skróconą linię odblokowań. Prototyp powinien być rozwinięciem tych informacji, nie drugim niezależnym słownikiem.

## 4. Otwarte rozstrzygnięcia przed wdrożeniem

- Które źródło jest kanoniczne dla listy jednostek: 12 nazw z `tech.json` czy 20 rekordów `units.json`?
- Czy „Popalnia brązu” jest nazwą historyczną/starym wpisem, czy ma zostać dodana do aktualnego katalogu ulepszeń?
- Czy w karcie pokazywać pełne koszty wszystkich jednostek, czy tylko typ surowca i link/podgląd szczegółów jednostki?
- Czy akceptowana jest jedna karta prototypowa w tym układzie, zanim powstanie kontrakt danych dla wszystkich technologii?

## 5. Źródła

- `gra/data/tech.json` — definicja technologii, prerekwizyty, epoka, koszt i deklarowane odblokowania.
- `gra/data/units.json` — faktyczne rekordy jednostek z `Tech: "Brązownictwo"` i koszty.
- `gra/data/buildings.json` — budynki, koszty, utrzymanie, bonusy i bramki.
- `gra/data/terrain-improvements.json` — ulepszenia terenu przypisane do technologii.
- `gra/src/data/loader.ts` — statyczne importy JSON.
- `gra/src/ui/techTreeView.ts` — istniejąca karta węzła/tooltip i zależności.
- `gra/src/ui/sciencePicker.ts` — istniejący tooltip badań.
- `gra/src/ui/scienceHubHud.ts` — skrócone odblokowania w hubie.
- `gra/src/game/owner-epoch.ts` — runtime bramka awansu epoki.
- `docs/decyzje/B1-tech-MACIEJ-2026-06-29.md` — zamknięte decyzje o źródłach bramek ulepszeń.
- `docs/decyzje/B3-B4-ui-svg-badania.md` — istniejący kanon UI drzewka i kart.
