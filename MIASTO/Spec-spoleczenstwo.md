# Spec-społeczeństwo — Mechaniki społeczne miasta

> **Status:** roboczy; gotowy do implementacji M2/M5.  
> **Data:** 2026-06-21.  
> **Źródło liczb:** `Ekonomia-parametry.xlsx` — zakładki Zdrowie, Szczęście, Kultura, Religia, Religie cywilizacji (wszystkie wartości edytowalne przez użytkownika).  
> **Kontekst projektowy:** `PROJEKT-GRY-master.md` §5f; `Schemat-dzialania-miasta.md` §5–6.

---

## Spis sekcji

1. [Zdrowie](#1-zdrowie)
2. [Szczęście](#2-szczęście)
3. [Kultura](#3-kultura)
4. [Religia](#4-religia)
5. [Religie cywilizacji](#5-religie-cywilizacji)

---

## 1. Zdrowie

Zdrowie to wskaźnik sanitarno-epidemiologiczny miasta — mierzy, jak bezpiecznie i higienicznie żyją mieszkańcy. Wynik netto (suma czynników + i −) decyduje bezpośrednio o tempie wzrostu populacji lub jej ubytku.

### Czynniki pozytywne

Miasto zyskuje punkty Zdrowia z infrastruktury wodnej, żywnościowej i urbanistycznej. Rzeka lub dostęp do świeżej wody w pobliżu daje naturalny bonus — miasto nie potrzebuje wtedy osobnej Studni. Studnia pełni tę samą rolę w wczesnych epokach, gdy rzeka jest daleko. Akwedukt to zaawansowana infrastruktura wodna: oprócz bonusu Zdrowia odblokowuje wzrost populacji powyżej 6 mieszkańców (bez niego miasto rośnie do tego progu, po czym staje). Targowisko poprawia dostęp do świeżej żywności i artykułów higienicznych. Ceramika (produkowana w Garncarni) podnosi poziom przechowywania żywności i ogólną higienę. Małe miasto — gdy populacja nie przekracza progu zagęszczenia — zyskuje dodatkowy bonus: łatwiej utrzymać porządek sanitarny przy małej liczbie mieszkańców.

Konkretne wartości punktowe wszystkich bonusów → zakładka **Zdrowie** (`Ekonomia-parametry.xlsx`).

### Czynniki negatywne

Zagęszczenie jest głównym wrogiem Zdrowia: każdy punkt populacji powyżej progu zagęszczenia odejmuje stałą karę (−1 pkt Zdrowia na każdego nadmiarowego mieszkańca). Próg zagęszczenia jest edytowalny — domyślnie 4 mieszkańców. Bagno i dżungla w promieniu miasta generują choroby — obniżają Zdrowie niezależnie od wielkości miasta. Zanieczyszczenie przemysłowe (dym z Huty, Mielerza itp.) pojawia się w późniejszych epokach. Brak wody (gdy miasto nie ma ani Rzeki, ani Studni, ani Akweduktu) skutkuje podwójną karą — najdotkliwszą z negatywnych.

### Wpływ na wzrost populacji

Zdrowie netto przekłada się bezpośrednio na tempo wzrostu populacji przez modyfikator:

- Gdy Zdrowie > 0 → modyfikator wzrostu = 1 + Zdrowie × współczynnik (np. Zdrowie +4 przy współczynniku 0,05 daje mnożnik ×1,20 do szybkości wzrostu).
- Gdy Zdrowie ≤ 0 (próg stagnacji) → wzrost zatrzymany; żywność nadal trafia do magazynu, ale populacja nie rośnie.
- Gdy Zdrowie < progu ubytku (wartość ujemna, domyślnie −5) → co kilka tur (domyślnie co 3 tury) miasto traci 1 punkt populacji.

Wzrost populacji nadal wymaga nadwyżki żywności i Spichlerza — Zdrowie jest tylko mnożnikiem, nie zastępuje jedzenia.

Wszystkie progi i współczynniki opisane powyżej → zakładka **Zdrowie** (`Ekonomia-parametry.xlsx`).

---

## 2. Szczęście

Szczęście (Zadowolenie) mierzy nastroje społeczne mieszkańców. Miasto ma w danej turze określoną liczbę mieszkańców zadowolonych, kontetnych i niezadowolonych — ta proporcja decyduje o stabilności, efektywności produkcji i ryzyku buntu.

### Czynniki pozytywne

Świątynia daje +1 zadowolonego mieszkańca — budynek religijny zaspokaja potrzeby duchowe. Amfiteatr (rozrywka, igrzyska) daje analogiczny efekt. Luksusy poprawiają nastroje według przelicznika: określona liczba jednostek Luksusu w puli handlowej przekłada się na +1 zadowolonego mieszkańca — im więcej luksusów, tym lepiej, lecz zwroty maleją. Ustrój polityczny (republika, demokracja itp.) generuje stały bonus zadowolenia. Dominująca religia w mieście (gdy wyznawcy stanowią ponad połowę mieszkańców) daje bonus — jedność wyznaniowa uspokaja tłum. Nasza kultura dominująca w mieście (udział ≥ 80%) daje bonus analogiczny do religijnego. Małe miasto (poniżej progu zagęszczenia) odczuwa mniejszy tłok — stąd dodatkowy bonus.

### Czynniki negatywne

Każdy punkt populacji powyżej progu zagęszczenia odejmuje od zadowolenia (ten sam próg co w Zdrowiu, domyślnie 4 mieszkańców). Zmęczenie wojną — stan wojenny obciąża całą cywilizację karą zadowolenia. Obca kultura dominująca w mieście (udział naszej kultury < 50%) generuje napięcia. Obca religia dominująca w mieście (np. po podboju) to jeszcze większa kara. Wysokie podatki — każdy poziom stawki podatkowej powyżej bazowej odejmuje punkty zadowolenia.

### Progi i konsekwencje

Gdy liczba niezadowolonych mieszkańców osiągnie próg buntu (domyślnie 3), w mieście wybucha strajk: każdy niezadowolony mieszkaniec w tym stanie przestaje produkować Pracę. Efektywnie miasto traci część swojej produkcji proporcjonalnie do liczby buntujących się.

Gdy liczba zadowolonych mieszkańców osiągnie pierwszy próg (domyślnie 3), miasto zyskuje bonus do tempa wzrostu populacji (+%). Gdy osiągnie wyższy próg (domyślnie 5 zadowolonych), miasto zyskuje bonus do Pracy.

Szczegółowe wartości progów i mnożników → zakładka **Szczęście** (`Ekonomia-parametry.xlsx`).

---

## 3. Kultura

Kultura to miękka siła cywilizacji — wpływa na terytorium, zadowolenie mieszkańców i lojalność podbitych miast.

### Produkcja kultury

Miasto generuje punkty kultury każdą turę ze źródeł: Pałac (stolica), Świątynia, Biblioteka, Amfiteatr, Cuda Świata oraz Specjalista Artysta przypisany do miasta. Punkty kultury kumulują się przez cały czas trwania gry.

### Ekspansja granic

Gdy skumulowana kultura przekroczy kolejne progi, granice miasta rozszerzają się o następne pole (zasięg +1 heks wokół centrum). Trzy progi ekspansji umożliwiają trzyetapowy wzrost terytorium. Gracz nie musi wykonywać żadnej akcji — ekspansja następuje automatycznie. Szczegółowe wartości progów → zakładka **Kultura** (`Ekonomia-parametry.xlsx`).

### Wpływ kultury na zadowolenie

Udział naszej kultury w mieście — wyrażony procentowo (suma kultury wytworzonej przez nasze budynki względem całości) — bezpośrednio kształtuje zadowolenie:

- 100% naszej kultury → wysoki bonus zadowolenia (pełna jedność kulturowa).
- ≥ 75% naszej kultury → niższy bonus.
- Około 50% → wynik neutralny.
- < 50% (obca kultura dominuje) → kara zadowolenia.
- < 25% (wyraźna dominacja obcej kultury) → poważna kara, ryzyko buntu.

Mechanizm działa automatycznie każdą turę: engine zlicza procentowy udział kultury własnej i dobiera odpowiedni bonus lub karę z tabeli progów.

### Konwersja kulturowa podbitych terenów

Po podboju obcego miasta lub terenu trafia on do nas z innym składem kulturowym (np. 0% naszej kultury). Każda tura — bazowo — nasze budynki dodają mały procent naszej kultury do podbitego miasta. Świątynia, Amfiteatr i Biblioteka dodatkowo przyspieszają konwersję. Prędkości konwersji poszczególnych budynków sumują się, ale są ograniczone górnym limitem na turę (cap), niezależnie od liczby budynków.

Celem konwersji jest 100% naszej kultury. W trakcie procesu zadowolenie mieszkańców sukcesywnie rośnie (bo maleje kara za obcą kulturę), a ryzyko buntu maleje. Dopóki konwersja nie zakończy się, podbite miasto pozostaje niestabilne.

Wszystkie prędkości konwersji i limity → zakładka **Kultura** (`Ekonomia-parametry.xlsx`).

---

## 4. Religia

Religia to czynnik spójności wewnętrznej i narzędzie dyplomatyczne. Każde miasto ma religię dominującą — wyznanie, które wyznaje ponad połowa jego mieszkańców.

### Dominacja i szerzenie się religii

Religia uznawana jest za dominującą w mieście, gdy udział wyznawców przekroczy próg procentowy (domyślnie 50%). Bez dominującej religii miasto odczuwa niepokój — kara zadowolenia. Każda tura religia może dotrzeć do sąsiednich miast w zasięgu (wyrażonym w heksach). Świątynia przyspiesza szerzenie się religii: jej obecność w mieście zwiększa liczbę sąsiadów, do których religia dotrze w ciągu jednej tury.

### Zadowolenie i jedność

Gdy nasza religia dominuje w mieście, miasto zyskuje bonus zadowolenia — mieszkańcy czują się zjednoczeni duchowo. Świątynia daje dodatkowego zadowolonego mieszkańca. Gdy ponad 80% miast naszej cywilizacji wyznaje tę samą religię, cała cywilizacja zyskuje bonus do produkcji Pracy — efekt jedności wyznaniowej na skalę państwa.

### Kary za obcą religię

Gdy w mieście dominuje obca religia (po podboju lub skutecznej misji rywala), miasto odczuwa silną karę zadowolenia. Jest ona większa niż kara za obcą kulturę, bo religia wpływa na tożsamość głębiej. Miasto bez żadnej dominującej religii cierpi na mniejszą, ale ciągłą karę.

### Wpływ na dyplomację

Wspólna religia z sąsiednią cywilizacją generuje bonus punktów relacji dyplomatycznych — odpowiednik „wspólnych wartości". Różna religia generuje karę. Wysłanie misjonarza, który podjął działalność w danej cywilizacji, daje dodatkowy bonus dyplomatyczny.

### Konwersja religijna podbitych miast

Analogicznie do kultury: po podboju podbite miasto może mieć obcą dominującą religię. Każda tura bazowo konwertuje pewien procent wyznawców na naszą religię. Świątynia w podbitym mieście przyspiesza ten proces. Celem jest 100% wyznawców naszej religii — do tego momentu kara zadowolenia za obcą religię jest aktywna.

Wszystkie parametry mechaniki religijnej → zakładka **Religia** (`Ekonomia-parametry.xlsx`).

---

## 5. Religie cywilizacji

Każda z 7 głównych cywilizacji ma własne wyznanie z unikalnymi bonusami mechanicznymi. Religia cywilizacyjna jest przypisana na stałe — nie można jej zmienić. Daje cywilizacji charakterystyczny styl gry (bonus kulturowy, militarny, ekonomiczny lub dyplomatyczny).

| Cywilizacja | Religia / wyznanie | Główne bóstwo / idea | Bonusy mechaniczne |
|---|---|---|---|
| Grecy | Politeizm olimpijski | Olimpijscy bogowie (Zeus, Atena, Apollo…) | +2 Kultury/turę w każdym mieście ze Świątynią; +1 zadowolony mieszkaniec podczas świąt (1 tura co 10 tur); +5 pkt relacji dyplomatycznych z cywilizacjami tej samej grupy kulturowej |
| Rzymianie | Religia rzymska / kult państwa | Jowisz / deifikacja cesarza | +1 zadowolony mieszkaniec w każdym mieście ze Świątynią; +2 pkt jedności (lojalność) we wszystkich miastach; −5% kary korupcji; utrata Stolicy = utrata bonusów religijnych na 5 tur |
| Chińczycy | Konfucjanizm / Taoizm | Konfucjusz / Tao (Droga harmonii) | +1 Nauka/turę w każdym mieście z Biblioteką; −1 kara Zadowolenia za zagęszczenie; +2 Zadowolenia z ustroju administracyjnego |
| Inkowie | Kult Słońca Inti | Inti — Słońce, syn boga Viracochy | +2 Żywności/turę w miastach z Farmą/Irygacją; +1 zadowolony mieszkaniec (jedność z bogiem-królem); +5% prędkości wzrostu populacji w stolicy |
| Zulusi | Kult przodków / animizm | Mzimu — duchy przodków; Unkulunkulu — Stwórca | +10 Morale jednostek wojskowych; +1 zadowolony mieszkaniec per 3 jednostki w garnizonie; +2 pkt jedności całej cywilizacji |
| Egipt | Religia egipska — faraon-bóg | Ra / Amun-Ra; faraon jako żywy bóg | +3 Kultury/turę z Pałacu; +1 zadowolony mieszkaniec w stolicy; −10% kosztu Pracy przy budowie Cudów Świata |
| Sumerowie | Religia sumeryjska (mezopotamska) — Enlil/Anu | Enlil/Anu — bogowie sumeryjscy; Enlil — bóg nieba i wiatru | +2 Nauka/turę w miastach z Obserwatorium/Biblioteką; +1 zadowolony mieszkaniec per Świątynia-Zikkurat; +5 pkt relacji dyplomatycznych z cywilizacjami uznającymi Sumerów za lidera |

Wszystkie wartości liczbowe bonusów są propozycją do strojenia → zakładka **Religie cywilizacji** (`Ekonomia-parametry.xlsx`).

---

## Zasada przewodnia

Niniejszy dokument opisuje **jak działa mechanika** — logikę przepływu, warunki wyzwalania efektów i powiązania między wskaźnikami. **Liczby** (wartości punktowe, progi, mnożniki) żyją wyłącznie w `Ekonomia-parametry.xlsx` i są tam edytowalne bez zmiany kodu. Oznaczenia `[PT]` i `[PT — do strojenia]` w Excelu wskazują parametry wymagające kalibracji podczas testów grywalności.

---

*Dokument tworzony 2026-06-21. Następna weryfikacja po M2 (implementacja Zdrowia i Szczęścia) i M5 (Kultura/Religia).*
