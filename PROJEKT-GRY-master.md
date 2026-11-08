# PROJEKT GRY „The Game" — dokument główny (żywy)

> **Jedyne źródło prawdy.** Aktualizowany na bieżąco przy każdej zmianie. Zasady mojej pracy: `ZASADY-WSPOLPRACY.md`.
> Ostatnia aktualizacja: 2026-06-21.

## 0. Status / dziennik zmian (najnowsze u góry)
- **2026-07-09** — Zwierzęta/ulepszenia + **MACIERZ MIASTA (B)** + Trzoda (decyzje 1abc Macieja). **Reguły budowy:** lama tylko **Wzgórza/Góry** (było Łąka/Równina/Wzgórza); **farma** współistnieje wyłącznie z krową(trzodą) **albo** irygacją (farma+owce/lama nielegalne — owce/lama solo); **koń = surowiec-dostęp poza systemem food** — stadnina współistnieje ze wszystkim (krowy/owce/lama/farma/irygacja), złoże konia NIE rezerwuje heksa i NIE blokuje farmy; **Nowy Świat** (Inkowie, funkcja po TYPIE): start bez koni/owiec/krów — bydło/owce od epoki 3, **koń po uzyskaniu dostępu do złoża koni** (było: blokada na zawsze); **posiew lamy** przy starcie Inków (2–3 złoża na wzgórzach/górach regionu, deterministycznie z ziarna mapy, POZA generatorem — hash mapy nietknięty). **TRZODA:** zasób „Bydło" → **„Trzoda"** (krowa+świnia; klucz techniczny `bydlo` zostaje); rydwan wymaga dostępu do trzody. **MACIERZ B — założenie miasta na heksie:** ZOSTAJE (na obrzeżu, środek pod miasto): farma·krowy/trzoda·owce·lama·koń+stadnina·złoża naturalne·kopalnia/kamieniołom/glinianka/warzelnia·drogi; ZNIKA: las·wyrąb·obóz łowiecki·tartak·irygacja·pole irygowane·tarasy·fort/posterunek; **WYJĄTEK GÓRY**: kasuje wszystkie ulepszenia (zostaje miasto + bonusy terenu). **Opisy:** tooltip heksa generowany z faktycznej zawartości (Trzoda/Owce/Lama/Konie (dostęp)/Farma…) — koniec rozjazdu opis↔grafika (`buildPastwiskoZwierzeta` wycofany; `bydlo`→`buildTrzoda`). **Mikrodekor** łąk/równin (styl Roblox, 8 InstancedMesh/8 draw calli, LOD 0–1, ~45% heksów pustych). Wykonanie: `improvement-build.ts`, `livestock-unlock.ts`, `inca-llama-seed.ts`, `city-hex-clear.ts`, `swinia-trzoda.ts`, `dekor-laki-rowniny.ts`.
- **2026-06-21** — Armie/UI: dodano **§6b Generał, wygląd armii i interakcja** — zasady: brak osobnej jednostki Generała (jednostki poruszają się indywidualnie); widok armii na mapie = model najmocniejszej jednostki stosu; hover = zminiaturyzowana lista składu; klik „Szczegóły” = pełny widok (makieta `Podglad-armii.html`); ROZWAŻANE M3: bitwa 3D (styl Roblox).
- **2026-06-21** — Styl wizualny, Porządek, Milicja, kultury przyszłe, szpieg/zabójca, mapowania: dodano **§9a Styl jednostek** (Roblox; min. jakość wizualna), **§9b Porządek (semantyka)** (Porządek = Szczęście + Prawo; zamiana nazw Zadowolenie→Porządek / Porządek→Prawo), **§9c Milicja wieśniaków** (obrona miasta ~20% mieszkańców, siła ~1/2 wojownika Ep. Kamienia), **§9d Przyszłe kultury** (Galowie i Germanie), **§9e Jednostka zabójca/szpieg** (eliminuje generałów/jednostki; do sprecyzowania przy module dyplomacji), **§9f Mapowania** (Jaguar→Aztekowie topornik/maczugowiec; Nieśmiertelni→Sumerowie/kolejne epoki). Zaktualizowano odwołania „Zadowolenie" w §5f i §5f-religia na „Porządek". Dodano bibliotekę referencji wizualnych: `Civ/Referencje-jednostek/`.
- **2026-06-21** — Religia: dodano **§5f-religia Konwersja religijna przez świątynie**. Zasada: tylko Świątynia stopniowo wypiera religię podbitego narodu; tempo konwersji zależy od poziomu i liczby świątyń (parametr tunable w Społeczeństwo-parametry / Religia); bez świątyni obca religia utrzymuje się i może obniżać zadowolenie (spójnie z istniejącą zasadą o różnicach religijnych); Świątynia daje też kulturę i zadowolenie.
- **2026-06-21** — Ekonomia miast/budynki: dodano **§8e Ekonomia miast i budynków — model dużego miasta** (potwierdzone zasady). (1) Preferujemy JEDNO duże miasto o dużym zasięgu zarządzające całym terenem zamiast dzielić pola między nakładające się miasta. (2) Miasto-córka (założone na terenie matki) NIE dostaje bazowych plonów pól matki — buduje TYLKO BUDYNKI, a jej wynik pochodzi z bazowej produkcji/pieniędzy budynków (np. tartak +5 produkcji). (3) Budynki są samodzielnym źródłem Pracy i Pieniądza (płaska baza): produkcyjne → bazowa Praca; handlowe/pieniężne → bazowy Pieniądz. (4) Wczesne epoki: surowce z terenu; późne epoki: miasto (jego budynki) = kluczowy motor produkcji i pieniędzy — jak historyczne miasta-państwa żyjące z handlu. (5) Miasto-córka może zarządzać TYLKO polami nieobsługiwanymi przez matkę (pustymi z braku ludności lub poza zasięgiem matki).
- **2026-06-21** — Społeczeństwo: dodano **`Spec-spoleczenstwo.md`** — kompletna specyfikacja mechanik społecznych: Zdrowie (czynniki +/−, modyfikator wzrostu, próg stagnacji/ubytku populacji), Szczęście (czynniki +/−, progi buntu/strajku i bonusów), Kultura (produkcja, ekspansja granic, wpływ udziału kultury na zadowolenie, konwersja podbitych terenów), Religia (dominacja, szerzenie, zadowolenie/jedność, kary za obcą religię, dyplomacja, konwersja), Religie cywilizacji (tabela 7 cywilizacji z unikalnymi bonusami). Liczby w `Ekonomia-parametry.xlsx` (zakładki Zdrowie, Szczęście, Kultura, Religia, Religie cywilizacji) — edytowalne. Gotowe do implementacji M2/M5.
- **2026-06-21** — Walka: rozbudowano **model flanki** (§5e, §5g, §5l). Zamiast jednej ogólnej kary −50% Obrony wprowadzono **dwie kary zależne od kierunku ataku i od typu jednostki**: FLANKA (z boku) i TYŁ (zawsze dotkliwszy). Kary zróżnicowane per typ — miecznicy/elastyczna piechota wręcz tracą najmniej (flanka −15%, tył −30%), włócznicy średnio (−30% / −50%), falanga i jednostki dystansowe tracą najwięcej (flanka −50%, tył −80%). Kawaleria/rydwany: −25% / −40%; super-jednostki: −15% / −30%. Konkretne wartości per jednostka: `Jednostki.xlsx`, kolumny „Kara obrony z flanki (%)" i „Kara obrony z tyłu (%)". Historyczny kontekst: legiony pokonywały falangę oskrzydleniem, nie frontalnie.
- **2026-06-21** — Warunki zwycięstwa: dodano **§8d Warunki zwycięstwa**. (1) **Dominacja własnego typu** (cel startowy): eliminacja ~10 rywali tego samego typu = likwidacja WSZYSTKICH ich miast (nie tylko stolicy); zdobycie stolicy przejmuje skarbiec, ale rywal przenosi stolicę i odradza super-jednostkę — eliminacja następuje dopiero przy utracie WSZYSTKICH miast. (2) **Zwycięstwo naukowe/kosmiczne**: w Epoce Robotów (koniec drzewka technologii) gracz buduje statek kosmiczny → koniec gry. Szczegóły technologii ostatniej epoki do uzupełnienia. (3) **Super-jednostki** równoważone wyłącznie counterami, flanką, przewagą liczebną i terenem (bez hard-counterów); testy: super pada po ~33–56 rundach vs. ciąg Legionistów, ubijając 2–4. Sprawdzanie warunków co turę → trigger ekranu zwycięstwa/przegranej.
- **2026-06-21** — Miasta/Ekonomia: doprecyzowano **zakładanie miast z wiosek** (§8a): kliknięcie heksu okolicy daje dwie akcje — przydziel/zabierz pracownika LUB załóż miasto (tylko gdy na heksie jest wioska I dystans ≥5 pól od innego naszego miasta; osadnik wyłącznie poza zasięgiem). Dodano mechanikę **Podziału Pracy suwakiem** (§2/§8a): Praca netto dzielona suwakiem na BUDYNKI (kolejka produkcji) i PRACE W TERENIE (ulepszenia heksów: kopalnie, farmy, irygacje, drogi, tartaki). Zaktualizowano `Schemat-dzialania-miasta.md` (§1.6, §3.1, §7.4, §9).
- **2026-06-21** — Walka: dodano **§5l KANONICZNY MODEL WALKI** — potwierdzony wzór szansy trafienia (50 + (Atak−Obrona)×5, clip [10,90]), wzór obrażeń (max(1, Atak−Pancerz+Przebicie) + Uderzenie w R1), kolejność faz (dystansowa→szarża→zwarcie), countery, teren, próg dezercji, przykład Gwardia Sumeru vs Chaska. — Auto-rozegranie: uzupełniono §5h-auto o podgląd bitwy oraz o zasadę, że AI prowadzi OBIE strony (gracza i komputer) tym samym kanonicznym wzorem.
- **2026-06-21** — Bitwa: dodano **Auto-rozstrzygnięcie** jako alternatywę dla ręcznej bitwy heksowej. Przycisk ⚡ Auto-rozegraj w topbarze ekranu bitwy → popup z wynikiem (Zwycięzca, straty obu stron, liczba rund, nota „auto: bez kontroli taktycznej"). Ręczna bitwa taktyczna pozostaje domyślna. Mechanika auto opisana w §5h-auto. (`Ekran-bitwy.html` zaktualizowany.)
- **2026-06-21** — Cywilizacje: rozszerzono liczbę **typów głównych z 5 do 7** — dodano **Egipt** i **Sumerowie** (§8b, §8c). Liczba ~50 cywilizacji startowych na mapie pozostaje bez zmian; zmienia się wyłącznie liczba typów głównych. Uwaga: `Spec-generator-mapy.md` wymaga drobnej korekty liczby typów. — Armie: dodano mechaniki **Łączenia jednostek w armię (Połącz/merge)**, **obozu/odpoczynku** (1 tura = uzupełnienie do max Health), **amunicji** (zerowana po każdej bitwie, uzupełnia się automatycznie w następnej turze, bez osobnej komendy) oraz **obozowania a żywności** (obozująca armia zużywa połowę żywności) — §6b.
- **2026-06-20** — §5k Countery: **Falanga potwierdzona jako zamiennik Włócznika** (wchodzi do trójkąta na miejscu Włócznika). Z dodatkowych counterów przyjęto wyłącznie **Maczuga/Topór +50% vs opancerzeni** (przeniesiono do POTWIERDZONE). Odrzucono: Miecznik +50% vs Włócznik oraz jednostki dystansowe −50% w zwarciu. Dodano definicję **„opancerzeni"** = jednostki z pancerzem/tarczą (ciężka piechota): Legionista, Falanga, Włócznik, Wojownik z brązu z mieczem.
- **2026-06-20** — Walka: **Countery (przewagi typów) i zasięgi dystansowe** (§5k). Klasyczny trójkąt potwierdzony: Włócznik anty-kawaleria (+50% Atak i Obrona vs Konnica/Rydwan); Konnica/Rydwan +50% Atak vs jednostki dystansowe; Procarz +50% Atak vs Włóczników. Propozycje do potwierdzenia: Miecznik/Legionista +50% vs Włócznik; Maczuga/Topór +50% vs opancerzeni; dystansowi −50% w zwarciu. Zasięgi: Oszczepnik 2 heksy, Łucznik 3, Procarz 4. Macierz liczbowa: `Jednostki.xlsx`, arkusz „Countery".
- **2026-06-20** — Jednostki: **System typów standardowych i nazwanych zamienników cywilizacyjnych** (§6a). Typy standardowe (włócznik, łucznik, procarz itp.) i nazwane zamienniki (Falanga, Legionista, Impi, Chaska…) w kolumnie „W zamian za" w `Jednostki.xlsx`. Jednostki dystansowe (procarz, oszczepnik, łucznik) **dostępne od Epoki Kamienia** z parametrem „Ilość pocisków". Inkowie: brak łuczników standardowych, lama = zwierzę (nie jednostka wojskowa). **SUPER-JEDNOSTKA:** każda cywilizacja ma 1 unikalną super-jednostkę w Epoce Brązu (max 1 szt., bezpłatna, stacjonuje w stolicy, odradza się w nowej stolicy po utracie poprzedniej, lepsze parametry niż zwykłe jednostki); Inkowie: Królewska Gwardia; pozostałe 4 cywilizacje — super-jednostki do zaproponowania.
- **2026-06-20** — Walka: **Morale powiązane ze startowym Health** — w trakcie bitwy morale spada (straty, flanka, szarża, przewaga wroga). Gdy morale spadnie **poniżej progu procentowego startowego Health (domyślnie ~25%, edytowalne)** → jednostka **ucieka z pola bitwy (rout)**. Wszystkie wskaźniki morale w procentach (§5e, §5g). — Jednostki dystansowe: nowy parametr **„Ilość pocisków"** (limit ostrzałów na bitwę). — **Kusznik (Chiny) przeniesiony do Epoki Żelaza** (na razie informacyjnie; w Brązie zastępuje go Kusznik Brązu). — **Cywilizacja Majowie → Inkowie**: pełna zmiana nazwy i opisu; brak koni, rydwanów i konnicy; mocna piechota + dystans (procarze, oszczepnicy, łucznicy); lamy jako zwierzę pakowe (Andy); jednostka z maczugą gwiaździstą (Chaska) i Królewska Gwardia jako elita; usunięto odniesienia do macuahuitl/Jaguar dla tej cywilizacji (§8b, §8c).
- **2026-06-20** — Walka: **Atak dystansowy** — nowy parametr dla jednostek dystansowych (zasięg w heksach, atakują z odległości; melee = brak tego parametru). Powiązano z ekranem bitwy (§5e, §5g, §5i).
- **2026-06-20** — Walka: **Modyfikatory teren ↔ jednostki** — wzgórza +Obrona; las +Obrona / −Ruch; rzeka −Ruch i −Atak przy przekraczaniu; wysokość = bonus do Ataku dystansowego (§5j).
- **2026-06-20** — Teren: **Las jako nakładka (model dwuwarstwowy)** — las (i surowce mapowe) to nakładka na terenie bazowym; wycinka odkrywa teren i daje drewno; plony = baza + mod. nakładki (§3a).
- **2026-06-20** — Cywilizacje: **Ograniczenia zwierzęce** — Zulusi bez rydwanów; Inkowie/Aztekowie bez koni/wołów/konnicy/rydwanów; **lamy** jako substytut wołu (mniejszy bonus); konie/woły dopiero po podboju terenu/technologii (§8b, §8c).
- **2026-06-20** — Jednostki specjalne (pełny zestaw 1+ na cywilizację): Grecy — Falanga; Rzym — Legion; Chiny — Kusznik Brązu (Brąz) + mocna konnica, Kusznik właściwy → Żelazo; Zulusi — lepsi łucznicy/oszczepnicy (bez rydwanów); Inkowie — Chaska (maczuga gwiaździsta) + Królewska Gwardia jako elita; brak koni/rydwanów/konnicy; procarze, oszczepnicy, łucznicy. Dane: `Jednostki.xlsx` (§8b).
- **2026-06-20** — Bitwa: plansza docelowo **~250 heksów** (§5h).
- **2026-06-20** — KOREKTA modelu startowego: gracz zaczyna z **1 osadnikiem** (nie ~10); na mapie startuje **50 cywilizacji** — **5 głównych typów** (Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi) + drobne **cywilizacje początkowe**; wokół gracza klaster **~10 rywali tego samego typu** (AI); **cel startu = pokonać rywali własnego typu**; uproszczona dyplomacja z początkowymi — osobny, późniejszy wątek. Zsynchronizowano: §8b, `Spec-generator-mapy.md`, `Cywilizacje.xlsx` (arkusz „Start gry").
- **2026-06-20** — Rozgrywka i cywilizacje: **ludność rodzi się w terenie** (każdy zamieszkiwalny heks = 1 wioska/ludność; góry/jałowe = 0), przejmowana z terenem jako **obywatele** (nie niewolnicy), wzrost ograniczony żywnością. Start: **~10 osadników**, **~50 wiosek/miast** (10 nasze). **5 cywilizacji** (Grecy/Falanga, Rzymianie/Legion, Chińczycy/łucznicy+konnica, Inkowie/Chaska+Królewska Gwardia, Zulusi/Impi), po 1 jednostce specjalnej. Dane: `Cywilizacje.xlsx`.
- **2026-06-20** — Model „dużych miast": zasięg miasta **10×10** w Ep.1, **+1/epokę** (~20×20 w ostatniej); widok okolicy min. **100 pól**. **Wioski** (przydziel ludność do regionu → wioska → przekształć w miasto) zastępują osadnika W ZASIĘGU; **osadnik tylko poza zasięgiem**. **Min. odległość miast ≥ 5 pól**. Więcej miast = więcej równoległej produkcji.
- **2026-06-20** — Referencje wizualne ekranu bitwy (heks): styl fantasy (Songs of Conquest — panele dowódców, paski Health/Morale) + klasyczny wargame heksowy (Panzer/People's General — żetony jednostek z siłą, roster armii, minimapa, licznik tury, pogoda/prognoza, panel wybranej jednostki: ruch, zasięg widzenia, zasięg ataku, Atak/Obrona). Teren wpływa na walkę.
- **2026-06-20** — Pole bitwy (wariant heksowy): plansza ≥100 heksów, do 20 jednostek na stronę, 1 jednostka = 1 heks, turowo wg modelu walki. Z modelu usunięto potwory i lordów (styl Warhammer).
- **2026-06-20** — Pełny system walki TW: Warhammer w masterze. **Skala 0–100** (najmocniejsza brązowa jednostka = 100/param); Atak lekko > Obrona epoki; staty: Atak/Obrona→szansa trafienia, Siła broni (baza+przebicie), Pancerz, Tarcza, Masa (+odpieranie szarży), Uderzenie=szarża, Health, Morale/Dyscyplina, odporności (max 90%), premie vs typ, typy jednostek.
- **2026-06-20** — Walka: przyjęto **wierny model Total War**. Atak/Obrona = **szansa trafienia** (35%+(A−O), 8–90%), NIE obrażenia; osobny stat **Obrażenia** (siła ciosu) i **Pancerz** (redukcja = Pancerz/200); **Uderzenie (szarża)** podbija i celność, i obrażenia w 1. rundzie. To rozwiązuje przypadek Atak=Obrona.
- **2026-06-20** — Nowe parametry **Kultura** i **Religia** (miasto + państwo): kultura → granice/terytorium, ustroje, presja na sąsiadów; religia → zadowolenie/jedność, dyplomacja, konwersje. Wpływ na zadowolenie, wzrost, lojalność podbitych miast.
- **2026-06-20** — Model walki na bazie Total War: trafienie = 35%+(Atak−Obrona) [10–90%]; **Uderzenie = szarża** (tylko 1. runda, +do Ataku i obrażeń; negowana przez braced włócznik/falangę); **flanka = −50 do Obrony** (falanga/włócznik wrażliwe, miecznik/legionista nie); Morale → ucieczka. Plan: dwa warianty bitwy (heks turowy + RTS).
- **2026-06-20** — Do jednostek dodano stat **Uderzenie** (znaczenie do ustalenia — siła pierwszego ciosu lub obrażenia na trafienie). Konnica i Galera domergowane do wersji użytkownika (epoka Brązu).
- **2026-06-20** — Decyzje: **Konnica → epoka Brązu** (tech Jeździectwo); dodano **Galerę** (morska, Żegluga). Surowce: dodano **Owce** i **Bydło (krowa/wół)**; poprawiono „Wytwórnia ceramiki"→**Garncarnia**; **Ceramika = +zadowolenie +Zdrowie**. (Koszty/balans jednostek — do potwierdzenia przez użytkownika.)
- **2026-06-20** — Pastwisko (modyfikacja terenu) hoduje bydło (krowa/wół) i/lub owce; warunek: min. 1 sztuka ze złoża lub z handlu (zarodek), potem produkcja co turę. Bydło→+produkcja, owce→+żywność (tylko łąki/równiny/wzgórza).
- **2026-06-20** — Walka = system własny (Atak/Obrona/Health/Morale/Widok), do zaprojektowania. Pastwisko = modyfikacja terenu, Pasterstwo = technologia. Dane rozbite na 3 pliki: Budynki.xlsx, Jednostki.xlsx, Surowce.xlsx (stary plik łączony usunięty).
- **2026-06-20** — Synchronizacja z drzewkiem: zwierzęta hodowlane (bydło/krowa-byk, owce, koń) z Pasterstwa; budynki Garncarz, Pasterstwo, Port; jednostki Konnica i Galera; technologia może wymagać budynku (np. Żegluga→Tartak); przeniesienia techów (Cegielnia/Garncarz/Spichlerz←Garncarstwo, Akwedukt←Budownictwo).
- **2026-06-20** — Zasada doprecyzowana: z jednego surowca powstają osobne budynki (z gliny: **Cegielnia** = cegła, **Garncarnia** = ceramika).
- **2026-06-20** — Zasada: jeden budynek = jeden produkt (osobna Wytwórnia ceramiki). Nowe surowce: Wół (+produkcja, Rydwan na wołach) i Koń (konnica/rydwany konne, ep. Żelaza). Budynki skalują zużycie surowców w górę.
- **2026-06-20** — Przeprojektowano arkusz Budynki: każdy budynek ma teraz **Zużycie/turę** i **Produkcja/turę**; zakładka Surowce uproszczona do katalogu.
- **2026-06-20** — Ilościowe koszty materiałów budynków (po epokach) + mechanika produkcji przetworzonych (wejście→wyjście 1:1, przepustowość/turę, auto z przełącznikiem, pauza przy braku wejścia/pełnym magazynie). Nowy arkusz **Surowce**.
- **2026-06-20** — Magazyny lokalne (pojemność, nadwyżka przepada, łączna pojemność państwa, przenoszenie); Pieniądz w **centralnym skarbcu** (stolica); utrata miasta = utrata jego surowców; utrata/zdobycie stolicy = skarbiec do 0 / przejęty przez zdobywcę; podbój miasta przejmuje magazyn.
- **2026-06-20** — Utrzymanie jednostek płatne w **Pieniądzu/turę** (tak jak ich zakup).
- **2026-06-20** — Ekonomia uściślona: 1 Pieniądz = 1 Praca; Handel = substytut pieniądza → po Walucie zamiana na Pieniądz ×mnożnik; Pieniądz też z podatków; **lokalne mnożniki budynków** (Młyn +Praca, Mennica Handel→Pieniądz); jednostki **tylko za Pieniądz**, budynki za Pracę lub Pieniądz. Pełne dane: `Budynki-i-jednostki.xlsx`.
- **2026-06-20** — Uściślenie ekonomii: **Praca** = prace w terenie (farmy, irygacja, tartaki…) + budynki; **Pieniądz** = kupno i utrzymanie jednostek (oraz zakup Pracy od innych graczy); **Handel** dzielony suwakiem na Naukę i Skarbiec; każde miasto ma swój **zasięg/terytorium**.
- **2026-06-20** — Zdrowie miast: czynniki podnoszące (budynki, świeża woda) i stale obniżające (zagęszczenie, zanieczyszczenie, trudność); wpływa na wzrost. Uporządkowano pliki: zostają master + ZASADY + Excel + gra.
- **2026-06-20** — Model **ludności** (inny niż Civ): 1 ludność = 1 jedzenie/turę; wojsko też je 1 jedzenie (utrzymanie); każda jednostka = **−1 ludność**; wzrost miasta = wartość bazowa + współczynnik zależny od jedzenia i **zdrowia**. Nowa zasada (`ZASADY`): pytania numerowane z opcjami A/B/C.
- **2026-06-20** — v0.1 (Kamień + Brąz) gotowe i przetestowane: `civ-gra-v0.1.html`. Ustalone: model **dostępu** (v0.1), tereny wg Excela (wartości użytkownika), ekonomia v0.2 (role Praca/Handel/Pieniądz/Ludzie), **magazynowanie** (Spichlerz = żywność, Magazyn = surowce), licznik „Bilans/turę". Pliki przeniesione do folderu `Gry\Civ`.

## 1. Czym jest gra
4X w stylu Cywilizacji, w przeglądarce (HTML + JS, Canvas, heksy, prosta grafika). Baza = sprawdzone mechaniki Civ; **wyróżnik = realistyczna, ewoluująca ekonomia.**

## 2. Rdzeń ekonomii (wyróżnik)
- Waluta bazowa = **Praca**. Wynalazki pieniężne mnożą jej wartość ×10: **Pieniądz ×10 → Pieniądz fiducjarny ×100 → Energia ×1000**.
- **Role (uściślone):**
  - **Praca** — głównie **prace w terenie** (farmy, irygacja, kopalnie, tartaki, drogi, usprawnienia) oraz **budowa budynków**. Gracz ustala **suwakiem PROCENT Pracy** podział Pracy netto na dwa strumienie: **BUDYNKI** (kolejka produkcji miasta) i **PRACE W TERENIE** (ulepszenia heksów na mapie świata). Oba zadania korzystają z tego samego źródła — Pracy netto — i są zarządzane jednym suwakiem.
  - **Handel** — gracz **suwakiem** ustala podział na **Naukę** i **Skarbiec (Pieniądz)**.
  - **Pieniądz** — **kupno i utrzymanie jednostek**; może też kupić budynki; oraz **kupno Pracy od innej cywilizacji/gracza** (handel międzycywilizacyjny).
  - **Ludzie** (populacja) — każda jednostka = −1 ludność.
  - Budynki: za **Pracę** (głównie) lub Pieniądz. Jednostki: za **Pieniądz** (+ −1 ludność).
- **Magazynowanie:** bez **Spichlerza** żywność się nie odkłada (brak wzrostu z zapasu); bez **Magazynu** surowce się nie odkładają (gospodarka „z dnia na dzień").
- **Popyt/podaż** (v0.2): cena surowca spada przy nadprodukcji.
- **Model dostępu (v0.1):** mając dostęp do surowca (złoże w zasięgu lub budynek przetwórczy) można budować to, co go wymaga; **liczbowe ilości od v0.2**.
- **Licznik „Bilans / turę":** produkcja na turę (Praca; Handel→Nauka/Pieniądz; Żywność netto; materiały) + czy się odkłada.

## 2a. Ekonomia — uściślenia (lokalność, Handel→Pieniądz, podatki)
- **Kurs:** 1 Pieniądz = 1 Praca.
- **Handel jako substytut pieniądza:** w epoce 1 (przed Walutą) Handel pełni rolę pieniądza — za niego kupuje się jednostki. Po wynalezieniu **Waluty** Handel jest zamieniany na **Pieniądz** z **mnożnikiem** (współczynnik mnożnika).
- **Pieniądz z podatków:** Pieniądz można też generować przez **opodatkowanie ludności**.
- **Lokalność (per-miasto):** Praca i Pieniądz są **lokalne**. Budynki dają **lokalne mnożniki**: **Młyn** → +Praca; **Mennica** → Handel→Pieniądz ×mnożnik; **Biblioteka** → +Nauka; **Targowisko** → +Handel.
- **Płatności:** **Budynki** — za **Pracę** lub **Pieniądz**. **Jednostki** — **tylko za Pieniądz** (w epoce 1 za Handel-substytut).
- Wszystkie współczynniki i koszty zebrane w `Budynki-i-jednostki.xlsx` (budynki, jednostki) i `Plony-terenow.xlsx` (tereny).

## 2b. Magazyny, skarbiec i podbój
- **Skarbiec (Pieniądz) — centralny, jeden, w stolicy.** Budynki generują Pieniądz lokalnie, ale **cały trafia do centralnego skarbca** w stolicy.
- **Magazyny surowców — lokalne, z pojemnością.** Każde miasto składuje surowce lokalnie; po **zapełnieniu** magazynu nadwyżka **przepada**.
- **Pojemność globalna:** magazyn w mieście **zwiększa łączną pojemność magazynową państwa**; surowce można **przenosić między magazynami** (gdy jeden pełny). Istnieje globalna suma surowców i łączna pojemność.
- **Praca — lokalna:** budynki **lokalnie** zwiększają Pracę (mnożnik).
- **Utrata miasta:** surowce zmagazynowane w utraconym mieście **przepadają**.
- **Utrata stolicy:** skarbiec **zeruje się**; nowy skarbiec powstaje w nowej stolicy.
- **Podbój miasta:** zdobywca **przejmuje magazyn i jego surowce**; przy zdobyciu **stolicy** przejmuje także **skarbiec i cały Pieniądz**.

## 3. Mapa i tereny (plony / turę z obrabianego pola)
Wartości robocze — edytowalne w `Plony-terenow.xlsx`:

| Teren | Żywn | Praca | Handel | Drewno | Kamień |
|---|---|---|---|---|---|
| Łąka | 4 | 1 | 1 | 1 | 0 |
| Równina | 2 | 1 | 1 | 2 | 1 |
| Las | 1 | 1 | 1 | 4 | 0 |
| Wzgórza | 1 | 2 | 0 | 2 | 2 |
| Góry | 0 | 0 | 0 | 2 | 5 |
| Wybrzeże | 3 | 2 | 2 | 0 | 0 |
| Morze | 2 | 0 | 2 | 0 | 0 |
| Pustynia | 0 | 0 | 1 | 0 | 0 |

**Modyfikator: Rzeka** = +3 żywność / +2 praca / +2 handel, **dodawany do dowolnego pola z rzeką** (nie jest terenem). Kamień/Ruda na wzgórzach/górach dostępne po **Kopalni**. Góry nieprzechodnie.

## 3a. Teren — model dwuwarstwowy (teren bazowy + nakładki)
- **Las (i surowce mapowe) NIE są typem terenu — są nakładką** nałożoną na teren bazowy. Pod lasem jest konkretny teren bazowy (np. wzgórza, równina).
- **Dwie warstwy:**
  1. **Teren bazowy** — Łąka, Równina, Wzgórza, Góry, Pustynia, Wybrzeże, Morze itp. (jak w §3).
  2. **Nakładka** — Las, złoża surowców (glina, ruda, kamień na powierzchni), rzeka, w przyszłości inne modyfikatory.
- **Plony pola = plony bazy + modyfikator nakładki.** Tabela w §3 i `Plony-terenow.xlsx` dotyczy bazy; nakładka dodaje własny modyfikator (np. las +Drewno, −Żywność).
- **Wycinka lasu:** usunięcie nakładki „las" odsłania teren bazowy (i daje drewno). Teren bazowy jest potem dostępny do uprawy / budowy ulepszeń jak normalnie.
- **Aktualizacja `Plony-terenow.xlsx`** pod kątem nakładek (osobna kolumna/zakładka) należy do lidera odpowiedzialnego za ten plik.

## 4. Surowce
- **Surowe (z mapy):** żywność, drewno, kamień, glina, ruda, węgiel, konie, (ropa, uran — późne epoki).
- **Paliwo:** drewno → węgiel drzewny → węgiel → ropa → energia.
- **Przetworzone:** deski (Tartak) · paliwo (Mielerz) · **cegła** (Cegielnia: glina+paliwo) · brąz (Huta: ruda+paliwo) · stal (późn.).

## 4a. Produkcja surowców i koszty materiałów
- **Koszty budynków = Praca/Pieniądz + materiały (ilościowo).** Materiały zależą od epoki (E1: drewno, kamień, deski, cegła; E2: + brąz). Pełne liczby: `Budynki-i-jednostki.xlsx` (arkusz **Budynki**, podzielony na epoki).
- **Produkcja przetworzonych (mechanika):** budynek przetwarza **wejście → wyjście 1:1**, do **przepustowości/turę** (np. Tartak: 1 drewno → 1 deska, maks. 2/turę). Produkuje **automatycznie**, gdy jest wejście i miejsce w magazynie; gracz może **włączyć/wyłączyć**. Brak wejścia lub pełny magazyn → **pauza** (bez marnowania). Przepustowość rośnie z ulepszeniem/współczynnikiem.
- **Surowce:** zbierane z mapy (żywność, drewno, kamień, glina, ruda, konie) lub produkowane w budynkach (deski, paliwo, cegła, brąz). Szczegóły: arkusz **Surowce** w `Budynki-i-jednostki.xlsx`.
- **Zużycie i produkcja na turę — przy każdym budynku:** arkusz **Budynki** ma kolumny **Zużycie/turę** i **Produkcja/turę** (np. Cegielnia: 1 glina + 1 paliwo → 1 cegła; Huta: 1 ruda + 1 paliwo → 1 brąz).

## 5. Budynki
Tartak · Mielerz · Kopalnia · Cegielnia · **Spichlerz** (magazyn żywności → wzrost) · **Magazyn** (magazyn surowców) · Mury · Koszary · Huta · Świątynia · Biblioteka · Targowisko (uruchamia Pieniądz) · **Młyn** (+Praca lokalnie) · **Mennica** (Handel→Pieniądz) · **Akwedukt** (+zdrowie/wzrost). Koszt = Praca + materiały [+ utrzymanie/turę po Walucie].

## 5a. Zasady budynków i nowe surowce
- **Jeden budynek = jeden produkt.** Każdy budynek przetwórczy wytwarza dokładnie jeden typ produktu (Cegielnia → cegła; osobna **Wytwórnia ceramiki** → ceramika). Nie mieszamy produktów w jednym budynku.
- **Przykład (jeden surowiec → osobne budynki):** z **gliny** powstają **Cegielnia** (→ cegła) oraz **Garncarnia** (→ ceramika) — dwa osobne budynki, każdy z jednym produktem.
- **Progresja:** kolejne budynki (odblokowane przez lokalne technologie) wytwarzają kolejne, bardziej złożone surowce i wymagają **coraz większych i bardziej zróżnicowanych ilości** surowców.
- **Nowe surowce:**
  - **Wół** — przypisywany w mieście **zwiększa produkcję (Pracę)**; wymagany do wczesnego **Rydwanu na wołach**. Hodowany w Pastwisku.
  - **Koń** — potrzebny do rekrutacji **konnicy i rydwanów konnych** (epoka Żelaza i później).
- **Rydwany — dwa typy:** **Rydwan na wołach** (wcześnie, epoka Brązu) oraz **Rydwan na koniach + Konnica** (później, epoka Żelaza).

## 5b. Aktualizacja z drzewka technologii (zwierzęta, budynki, jednostki)
- **Zwierzęta hodowlane — z Pasterstwa (tech Oswojenie zwierząt):** **Bydło (krowa/byk)** → przypisane w mieście **+produkcja**; napędza **Rydwan (na bydle/wołach)**. **Owce** → wełna / żywność. **Koń** (tech **Jeździectwo**) → **Konnica** i rydwany konne.
- **Nowe / zmienione budynki:** **Garncarnia** (glina → ceramika; dawna „Garncarnia"), **Pasterstwo** (hodowla bydła i owiec), **Port** (tech Żegluga; morze → handel/żywność, statki).
- **Nowe jednostki (epoka Brązu):** **Konnica** (koń), **Galera** (Żegluga); **Rydwan** używa bydła/wołów.
- **Przypisania technologii (wg drzewka):** Cegielnia, Garncarnia i Spichlerz ← **Garncarstwo**; Akwedukt ← **Budownictwo**.
- **Nowa mechanika — technologia może wymagać budynku:** drzewko ma kolumnę „wymagany budynek" (np. **Żegluga wymaga Tartaku**). Niektóre technologie wymagają istnienia konkretnego budynku, nie tylko wcześniejszej technologii.

## 5c. Walka, ulepszenia terenu, podział danych
- **Walka — system własny (nie jak klasyczne Civ):** jednostki mają **Atak, Uderzenie, Obrona, Health, Morale, Widok pola**. Mechanikę bitwy trzeba osobno zaprojektować (jak Health i Morale wpływają na wynik, czy są tury starć, wycofanie itp.). DO ZAPROJEKTOWANIA.
- **Ulepszenia terenu vs budynki miejskie:** **Pastwisko** to **modyfikacja terenu** (ulepszenie pola budowane Pracą przez Robotnika), a **Pasterstwo** to **technologia**, która je odblokowuje. Ogólnie: ulepszenia pól (np. Farma, Irygacja, Droga, Pastwisko) są oddzielne od budynków miejskich.
- **Dane rozbite na 3 pliki:** `Budynki.xlsx`, `Jednostki.xlsx`, `Surowce.xlsx` (zamiast jednego `Budynki-i-jednostki.xlsx`, który usunięto). Każdym zajmuje się osobny wątek/subagent.

## 5d. Hodowla zwierząt na Pastwisku
- **Pastwisko** (modyfikacja terenu) pozwala hodować **bydło (krowa/wół)** i/lub **owce** — jedno, drugie albo oba naraz.
- **Warunek startowy (zarodek):** aby zacząć hodowlę danego zwierzęcia, trzeba mieć dostęp do **co najmniej 1 sztuki** — ze **złoża na mapie** albo zdobytej przez **wymianę handlową**. Minimum 1 krowa/wół lub 1 owca uruchamia hodowlę.
- Po zdobyciu zarodka Pastwisko **co turę produkuje** więcej tego zwierzęcia.
- **Efekty (gdy przypisane do pola):** bydło/wół → **+produkcja (×200%)**; owce → **+żywność (+2)**. Pastwisko możliwe tylko na **łąkach, równinach i wzgórzach**.
- **Katalog Surowce:** dodać **Owce**; **Bydło (krowa/wół)** jako surowiec hodowlany; źródło obu = złoże/handel (zarodek) + Pastwisko (hodowla).

## 5e. Model walki (wzorzec: Total War)
Staty jednostek: **Atak** (celność), **Obrona** (unik), **Obrażenia** (siła pojedynczego ciosu), **Pancerz** (redukuje obrażenia), **Uderzenie** (bonus szarży), **Health** (HP), **Morale**, **Widok pola**.
- **Trafienie:** szansa = **35% + (Atak − Obrona)**, ograniczone do **10–90%**.
- **Szarża (Uderzenie):** w **1. rundzie starcia** atakujący dostaje **+Uderzenie do Ataku (celność) oraz do obrażeń**; od 2. rundy znika. Jednostki stojące w obronie, które **nie ruszały się** (włócznik, falanga), **negują szarżę** (bracing).
- **Flanka / Tył:** kara Obrony obrońcy zależy od **kierunku ataku** i od **typu jednostki**. Tył jest zawsze groźniejszy od flanki.

  | Typ jednostki | Flanka (z boku) | Tył |
  |---|---|---|
  | Miecznicy / elastyczna piechota wręcz (Legionista, miecznicy, topór, maczuga, wojownik) | −15% Obrony | −30% Obrony |
  | Włócznicy | −30% Obrony | −50% Obrony |
  | Falanga oraz łucznicy / jednostki dystansowe | −50% Obrony | −80% Obrony |
  | Kawaleria / Rydwany | −25% Obrony | −40% Obrony |
  | Super-jednostki | −15% Obrony | −30% Obrony |

  **Uzasadnienie historyczne:** falanga i szyk strzelecki rozsypują się przy ataku z boku/tyłu; miecznik/legionista walczą równo z każdej strony — dlatego legiony pokonywały falangę **oskrzydleniem**, a nie frontalnie (gdzie falanga długo się broni). Konkretne wartości per jednostka: `Jednostki.xlsx`, kolumny **„Kara obrony z flanki (%)"** i **„Kara obrony z tyłu (%)"**. → potrzebna własność jednostki „wrażliwość na flankę/tył".
- **Obrażenia na trafienie (wg Total War):** trafienie zdejmuje **Obrażenia × (1 − Pancerz_obrońcy / 200)** punktów Health (Pancerz 0–200 → redukcja 0–100%; opcjonalne „przebicie/AP" ignorujące pancerz — do dołożenia później). **Atak i Obrona decydują wyłącznie o SZANSIE trafienia, nie o obrażeniach** — dlatego przy Atak = Obrona (35%) jednostka i tak co jakiś czas trafia i zdejmuje Health.
- **Morale:** spada od strat HP (łącznych i nagłych), flankowania i bycia szarżowanym; **poniżej progu → chwiejność → ucieczka**; po kilku ucieczkach jednostka się rozsypuje. Szarża i aura dowódcy **podnoszą** Morale. Kary flanki/tyłu per typ jednostki — patrz tabela powyżej (§5e, Flanka/Tył).
- **Model Morale powiązany ze startowym Health (próg ucieczki):** Morale jednostki spada w trakcie bitwy wskutek strat, flanki, szarży wroga i przewagi liczebnej/statystycznej przeciwnika. Gdy aktualne Morale **spadnie poniżej procentowego progu liczonego od startowego Health** (domyślnie **~25% startowego Health**, wartość edytowalna w konfiguracji) → jednostka natychmiast **ucieka z pola bitwy (rout)**. Wskaźnik Morale i próg wyrażane są w procentach (0–100%). Przykład: jednostka ze startowym Health = 100 ucieka, gdy Morale spadnie poniżej 25. Próg można regulować globalnie lub per jednostkę (np. elity mają niższy próg = walczą dłużej; milicja — wyższy). Jednostki z cechą **„Niezłomny"** ignorują próg i walczą do śmierci.
- **Dwa warianty bitwy (plan):** (1) **heksagonowa, turowa**; (2) **w stylu Total War (RTS)**. Reguły (trafienie, szarża, flanka, morale) mają działać w obu.
- **Skala statów** (na bazie Total War): lekka piechota — niski Atak/Uderzenie; kawaleria — niska Obrona, wysokie Uderzenie (siła w pierwszym kontakcie); elita — wysokie wszystko.

## 5f. Kultura i religia (miasto + państwo)
Nowe parametry na poziomie **miasta** i **państwa**, z reperkusjami na inne elementy.
- **Kultura — miasto:** gromadzona z budynków (Świątynia, Biblioteka, później cuda) i dzieł; **rozszerza granice/terytorium miasta** (więcej pól do obrabiania); podnosi **Zadowolenie**.
- **Kultura — państwo:** suma kultury odblokowuje **ustroje/polityki**; tworzy **presję kulturową** na sąsiadów (asymilacja, ryzyko buntów w podbitych miastach o obcej kulturze). Reperkusje: większe terytorium, łatwiejsze utrzymanie podbitych miast przy dominacji kulturowej, bonusy dyplomatyczne.
- **Religia — miasto:** miasto ma religię dominującą; budynki religijne dają **Zadowolenie/jedność**; religia **rozprzestrzenia się** na sąsiednie miasta.
- **Religia — państwo:** religia państwowa; **jedność** miast tej samej religii = bonus do Zadowolenia i stabilności; obce religie → napięcia, ryzyko buntów. Reperkusje: dyplomacja (wspólna religia = lepsze relacje, różna = gorsze), możliwość konwersji wrogich miast, późniejsze konflikty/wojny religijne.
- **Wspólne reperkusje:** Kultura i Religia wpływają na **Zadowolenie → wzrost i stabilność miast**, na **dyplomację**, oraz na **lojalność podbitych miast**. Do dopięcia: konkretne współczynniki (ile kultury na próg granicy, ile zadowolenia z religii) — w arkuszach/specyfikacji.

## 5f-religia. Konwersja religijna przez świątynie

> Zasada uzupełnia §5f (Kultura i religia) oraz istniejące zasady o różnicach religijnych wpływających na szczęście.

- **Tylko Świątynia stopniowo wypiera religię podbitego narodu na rzecz naszej religii.**
  Po zdobyciu miasta o obcej religii budowa (lub istnienie) Świątyni w tym mieście uruchamia proces konwersji.

- **Mechanika konwersji turowej:**
  Z każdą turą Świątynia zwiększa udział naszej religii w populacji miasta, aż do pełnej konwersji.
  Wizualizacja: pasek procentowy udziału naszej religii w danym mieście (0 % → 100 %).

- **Tempo konwersji** zależy od:
  - poziomu Świątyni (wyższa = szybciej),
  - liczby Świątyń w mieście (kumulatywnie),
  - parametru tunable — do dodania w arkuszu **Społeczeństwo-parametry**, zakładka **Religia**
    (np. `swiatynia_konwersja_na_ture` — bazowa liczba punktów konwersji na turę na poziom świątyni).

- **Bez Świątyni:**
  Religia podbitego narodu utrzymuje się bez zmian — a zgodnie z istniejącą zasadą (§5f) różnica religijna może **obniżać Zadowolenie** w mieście i generować napięcia/ryzyko buntów.

- **Świątynia — efekty łączone (spójność z §5 Budynki):**
  Świątynia daje jednocześnie:
  - **Kulturę** (wkład do puli kultury miasta, jak Biblioteka),
  - **Zadowolenie** (bonus religijny dla wyznawców naszej religii),
  - **Konwersję** (jak opisano powyżej — pasywna, turowa).

> Konkretne wartości (punkty konwersji/turę, bonusy kultury i zadowolenia per poziom)
> → edytowalne w `Budynki.xlsx` (wiersz: Świątynia) i `Społeczeństwo-parametry` (zakładka Religia).


## 5g. Walka — pełny system statystyk (wzorzec: Total War: Warhammer)
**Skala: wszystkie staty 0–100. Najmocniejsza jednostka epoki Brązu = 100 dla danego parametru** (reszta proporcjonalnie) — dzięki temu skala pasuje do wzorów TW. **Atak ma być lekko wyższy niż Obrona danej epoki**, żeby jednostki realnie traciły Health.

**Typy jednostek:** piechota (front: trzyma linię / zadaje obrażenia) · kawaleria i rydwany (szybkie: flankowanie i szarża) · jednostki dystansowe i artyleria (rażą z odległości). (Bez potworów i lordów w stylu Warhammer — u nas ich nie ma.)

**Statystyki:**
- **Atak** — szansa trafienia (porównywana z Obroną wroga), NIE obrażenia.
- **Obrona** — unik/blok; obniża szansę trafienia atakującego.
- **Szansa trafienia** = `clamp(35 + (Atak − Obrona), 8, 90) %`.
- **Siła broni (Obrażenia)** — realne obrażenia na trafienie; dzieli się na **bazowe** (redukowane Pancerzem) + **przebicie pancerza / AP** (ignoruje Pancerz). Plus **premie vs typ** (np. +vs piechota, +vs duże cele).
- **Pancerz** — redukuje obrażenia bazowe (nie AP): `obrażenia = Baza × (1 − Pancerz/200) + Przebicie`.
- **Tarcza** — blokuje **pociski tylko od przodu** (brąz 35% / srebro 55% / złoto 80%); nie chroni przed artylerią.
- **Masa** — skuteczność szarży, przebijanie szyków i możliwość wycofania; kawaleria i potwory = „duże". **Odpieranie szarży** (włócznik/falanga/halabardnik w postawie) niweluje bonus masy/prędkości szarżującego.
- **Uderzenie (szarża)** — bonus 1. kontaktu: +do celności (Atak) i +do obrażeń (oraz +Morale szarżującego); znika po 1. rundzie; negowany przez odpieranie szarży.
- **Health (HP)** — łączne zdrowie oddziału (suma żołnierzy), nie pojedynczego.
- **Morale / Dyscyplina** — jak długo jednostka walczy, zanim ucieknie; **spada stopniowo** (straty, flankowanie, Strach/Terror); poniżej progu → chwiejność → ucieczka; **Niezłomne** walczą do śmierci. Różne jednostki = różne Morale. **Próg ucieczki (rout):** domyślnie ~25% startowego Health (edytowalny); Morale mierzone w % (0–100%); elity = niższy próg; milicja = wyższy próg (patrz §5e — Model Morale). Atak z flanki i z tyłu powoduje dodatkowe trafienie w Morale (zależy od wielkości kary Obrony — im większa kara, tym silniejszy efekt na Morale).
- **Ilość pocisków** — parametr wyłącznie dla **jednostek dystansowych** (łucznicy, kusznicy, procarze, oszczepnicy, artyleria): maksymalna liczba ostrzałów na bitwę. Po wyczerpaniu amunicji jednostka dystansowa nie może strzelać (może walczyć wręcz, jeśli pozwalają jej staty). Wartość per jednostka: `Jednostki.xlsx`. Przykład: Łucznik = 15 pocisków, Procarza = 20, Kusznik = 10.
- **Odporności** (fizyczna / na ostrzał) — redukują dany typ obrażeń, **max 90%**.

## 5h-auto. Rozstrzyganie bitwy: ręczne ALBO automatyczne

- **Ręczne (domyślne)** = taktyczne na heksach, pełna kontrola gracza nad ruchem i akcjami jednostek.
- **Auto-rozstrzygnięcie** = silnik liczy wynik wg modelu walki (jak macierz 1v1): faza dystansowa → szarża/Uderzenie → zwarcie; uwzględnia countery, Pancerz/Przebicie, Morale/próg dezercji, teren. Wynik: **Zwycięzca**, **straty obu stron** (jednostki i HP), **liczba rund**.
- **Auto = szybkie, ale BEZ kontroli taktycznej** — zwykle gorszy wynik niż dobre ręczne dowodzenie; dobre do trywialnych/szybkich starć, gdzie przewaga jest bezdyskusyjna.
- W UI: przycisk **⚡ Auto-rozegraj** w topbarze → otwiera popup z wynikiem; gracz zatwierdza wynik i zamyka (lub wraca do ręcznego).
- **Podgląd bitwy podczas auto-rozegrania:** gracz widzi skrócony **podgląd przebiegu** (runda po rundzie: kto trafił, ile obrażeń, który próg dezercji przekroczony), nie musi tylko patrzyć na suchy wynik — animacja/log opcjonalna, ale wymagany jest czytelny zapis rund.
- **AI prowadzi OBIE strony:** w trybie auto **AI zarządza zarówno jednostkami komputera, jak i jednostkami gracza** — gracz nie wydaje rozkazów. Wynik jest liczony tym samym **kanonicznym wzorem walki** (§5l) co bitwa ręczna, więc matematyka jest identyczna; różnica polega wyłącznie na braku decyzji taktycznych gracza (ustawienie, flanki, priorytety celów).

## 5h. Pole bitwy (wariant heksagonalny, turowy)
- **Plansza:** duże pole **heksagonalne, docelowo ~250 heksów** (wcześniej ustalono min. ~100 — podwyższone dla lepszej taktyki; zachować min. 100 heksów jako wartość startową, cel docelowy = ~250).
- **Armie:** każda strona wystawia **do 20 jednostek**.
- **Zajmowanie pól:** **jedna jednostka = jeden heks** (jedno pole zajmuje dokładnie jedna jednostka).
- **Rozgrywka turowa:** jednostki poruszają się w **zasięgu ruchu** (podświetlone heksy) i atakują dosięgalne cele; obowiązuje pełny model walki (Atak/Obrona → szansa trafienia, Siła broni/Pancerz, Uderzenie = szarża, flanka −50 Obrony, Morale, Health).
- **HUD bitwy:** panele **dowódców armii** z boków (staty zbiorcze), **roster jednostek** u góry, paski **Health/Morale** przy każdej jednostce, podświetlony zasięg ruchu/ataku. Wzór wizualny: taktyczna bitwa heksowa (referencja od użytkownika).
- **Drugi wariant:** alternatywnie bitwa w stylu **RTS (Total War)** — ten sam zestaw statów, inny tryb sterowania.

## 5i. Walka — Atak dystansowy
- **Atak dystansowy** — nowy parametr jednostek dystansowych (łucznicy, kusznicy, proca, artyleria).
- **Zasięg ataku** — wyrażony w heksach (np. Łucznik = 2 heksy, Kusznik = 3 heksy). Widoczny w panelu jednostki na ekranie bitwy (podświetlony zasięg ataku obok zasięgu ruchu).
- **Działanie:** jednostka dystansowa może atakować cel w swoim zasięgu bez konieczności wejścia na sąsiedni heks. **Melee (piechota, kawaleria) = brak parametru Atak dystansowy / Zasięg ataku** — mogą atakować wyłącznie sąsiedni heks.
- **Obrona przed ostrzałem:** Tarcza blokuje pociski tylko od frontu (§5g). Leśna nakładka na celu daje bonus do Obrony przed ostrzałem (patrz §5j).
- **Ilość pocisków:** każda jednostka dystansowa ma parametr **„Ilość pocisków"** — limit ostrzałów na bitwę; po wyczerpaniu nie może strzelać. Widoczny w panelu jednostki (licznik przy ikonie strzały). Pełne wartości: `Jednostki.xlsx`.
- **Kusznik (Chiny) — przeniesiony do Epoki Żelaza** (informacyjnie): właściwy Kusznik Chiński jest jednostką Epoki Żelaza. W Epoce Brązu Chiny operują **Kusznikiem Brązu** (słabszy ekwiwalent). Zmiana wyłącznie informacyjna na tym etapie.
- **Zasięg w HUD bitwy:** panel wybranej jednostki pokazuje: Ruch, Zasięg widzenia, Zasięg ataku (w heksach), Ilość pocisków (pozostałe/startowe). Podświetlanie zasięgu ataku na planszy — osobny kolor niż zasięg ruchu.
- Pełne liczby (zasięg, Atak dystansowy, Ilość pocisków per jednostka): `Jednostki.xlsx`.

## 5j. Walka — modyfikatory teren ↔ jednostki (proste)
Obowiązują w obu wariantach bitwy (turowy heks i RTS). Stosowane automatycznie gdy jednostka stoi na/obok danego terenu.

| Sytuacja | Efekt |
|---|---|
| Jednostka stoi na **wzgórzach** | **+Obrona** (wartość do ustalenia w `Jednostki.xlsx`) |
| Jednostka stoi w **lesie** (nakładka) | **+Obrona** przed atakami melee i ostrzałem |
| Jednostka porusza się przez **las** | **−Ruch** (nakładka lasu spowalnia) |
| Jednostka **przekracza rzekę** (modyfikator terenu z §3) | **−Ruch** w tej turze; **−Atak** do następnej tury po przekroczeniu |
| Jednostka dystansowa **strzela z wyższego terenu** (wzgórze → nizina) | **+Atak dystansowy** (bonus wysokości; szczegółowy współczynnik do ustalenia) |

- **Bonus wysokości** działa wyłącznie na Atak dystansowy — nie na melee.
- Wartości liczbowe modyfikatorów (ile +Obrony, ile −Ruchu, ile +Ataku) do uzgodnienia przez lidera prowadzącego `Jednostki.xlsx`.

## 5k. Countery (przewagi typów) i zasięgi dystansowe

### Klasyczny trójkąt (potwierdzone)

- **Włócznik** +50% Atak i +50% Obrona przeciw **Konnicy i Rydwanom** (anty-kawaleria).
- **Konnica / Rydwan** +50% Atak przeciw **jednostkom dystansowym** (łucznik / oszczepnik / procarz).
- **Procarz** +50% Atak przeciw **Włócznikom**.

Wynikający łańcuch: **włócznia > konnica > dystans > włócznia**.

### Dodatkowe countery (potwierdzone)

- **Maczuga / Topór** (Chaska, Wojownik z toporem) **+50% Atak przeciw jednostkom opancerzonym**.

> **„Opancerzeni"** = jednostki z pancerzem/tarczą (ciężka piechota): **Legionista, Falanga, Włócznik, Wojownik z brązu z mieczem**.

### Zasięgi dystansowe

| Jednostka | Zasięg (heksy) |
|---|---|
| Oszczepnik | 2 |
| Łucznik | 3 |
| Procarz | 4 |

Jednostki dystansowe chowają się za piechotą pierwszej linii; piechota wręcz trzyma front i chroni łuczników/procarzy przed szarżą kawalerii.

> Dane liczbowe i pełna macierz counterów: `Jednostki.xlsx`, arkusz **„Countery"**.

## 5l. KANONICZNY MODEL WALKI (potwierdzony wzór — jedyne źródło prawdy)

> Ten paragraf jest **kanonem**. Wszelkie wcześniejsze opisy walki w §5e, §5g, §5h itp. opisują tło i kontekst; jeśli pojawi się sprzeczność — §5l ma pierwszeństwo.

### Wzory podstawowe

**Szansa trafienia %**
```
trafienie% = clamp(50 + (Atak_atakującego − Obrona_obrońcy) × 5, 10, 90)
```
- Wynik zawsze w przedziale **[10, 90]** — nikt nigdy nie chybia w 100% ani nie trafia w 100%.

**Obrażenia za trafienie**
```
obrażenia = max(1, Atak_atakującego − Pancerz_obrońcy + Przebicie_atakującego)
```
- **Minimum 1** — każde trafienie zadaje co najmniej 1 punkt obrażeń.
- **W 1. rundzie zwarcia** atakujący dostaje **dodatkowy bonus: + Uderzenie** (szarża) do puli obrażeń.

### Kolejność faz starcia

1. **Faza dystansowa** — jednostki dystansowe **strzelają** zanim dojdzie do zwarcia. Zasięg (w heksach) decyduje kto może strzelać. Każdy strzał zużywa 1 pocisk (limit: parametr „Ilość pocisków"). Obrażenia od strzału: `Atak dystansowy − Pancerz celu` (min 1).
2. **Szarża (R1 zwarcia)** — w pierwszej rundzie kontaktu atakujący dodaje **Uderzenie** do obrażeń (patrz wzór powyżej). Jednostki w postawie odpierającej (włócznik, falanga — nie ruszyły się) **negują Uderzenie**.
3. **Zwarcie (R2+)** — co rundę **obie strony** jednocześnie rzucają na trafienie i zadają obrażenia wg wzoru (bez premii Uderzenia).

### Modyfikatory (nakładane na wierzch wzoru)

| Sytuacja | Efekt |
|---|---|
| Counter wg trójkąta | **+50% do obrażeń** zadawanych przez faworyzowaną jednostkę |
| **Flanka (atak z BOKU)** | Kara Obrony obrońcy **zależna od typu jednostki** (patrz §5e): miecznicy/elastyczna piechota −15%; włócznicy −30%; falanga/dystansowi −50%; kawaleria −25%; super-jednostki −15% |
| **Tył (atak z TYŁU)** | Kara Obrony obrońcy **zawsze większa niż flanka** (patrz §5e): miecznicy −30%; włócznicy −50%; falanga/dystansowi −80%; kawaleria −40%; super-jednostki −30%. **Historyczny powód zwycięstw Legionu nad Falangą: oskrzydlenie, nie frontalny atak.** |
| Wzgórza / las / rzeka / wysokość | Patrz arkusz **Teren** i §5j (np. wzgórze +Obrona, rzeka −Atak przy przekroczeniu) |
| Broń obuchowa (maczuga, topór) | Działa przez **Przebicie** — +Przebicie_atakującego wchodzi do wzoru obrażeń |

> Konkretne wartości kary flanki/tyłu per jednostka: `Jednostki.xlsx`, kolumny **„Kara obrony z flanki (%)"** i **„Kara obrony z tyłu (%)"**.

**Trójkąt counterów (przyp. §5k):** włócznia/falanga > konnica/rydwan > dystans > włócznia/falanga. Maczuga/Topór +50% vs opancerzeni.

### Koniec walki (próg dezercji)

Jednostka **ucieka z pola bitwy (rout)** gdy jej **Health spadnie poniżej Progu dezercji**, gdzie:
```
Próg dezercji = Próg_% × Health_startowe
```
- Domyślnie **Próg_% = 25%** (edytowalny globalnie i per jednostkę).
- Elity (Legionista, Królewska Gwardia) mają niższy próg (walczą dłużej); milicja — wyższy (uciekają wcześniej).
- Jednostka z cechą **„Niezłomny"** ignoruje próg i walczy do śmierci.

### Przykład: Gwardia Sumeru (atak) vs Chaska Inków (obrona)

Założenia (wartości przykładowe):

| Stat | Gwardia Sumeru | Chaska |
|---|---|---|
| Atak | 70 | 55 |
| Obrona | 50 | 45 |
| Uderzenie (szarża) | 15 | 8 |
| Przebicie | 5 | 10 |
| Pancerz | 30 | 20 |
| Health startowe | 120 | 80 |
| Próg dezercji | 25% → 30 HP | 25% → 20 HP |

**Runda 0 — faza dystansowa:** Chaska nie ma jednostek dystansowych wspierających; Gwardia też nie. Brak ostrzału → przechodzi bezpośrednio do zwarcia.

**Runda 1 — szarża Gwardii:**
- Szansa trafienia Gwardii: `clamp(50 + (70−45)×5, 10, 90) = clamp(175, 10, 90) = 90%`
- Obrażenia: `max(1, 70 − 20 + 5) + 15 (Uderzenie) = 55 + 15 = 70` → ale sprawdzamy losowanie trafienia → **trafienie (90%)**; Chaska traci **70 HP** (startuje 80, zostaje 10).
- Kontra Chaska: trafienie `clamp(50 + (55−50)×5, 10, 90) = clamp(75, 10, 90) = 75%` → zakładamy trafienie (75%); obrażenia `max(1, 55−30+10) = 35`; Gwardia traci **35 HP** (startuje 120, zostaje 85).

**Runda 2:**
- Chaska ma 10 HP, próg dezercji = 20 HP → Chaska **poniżej progu** → **ucieczka (rout) przed R2**.
- **Wynik: Gwardia Sumeru wygrywa w ok. 1 rundzie zwarcia** (+ ewentualna faza dystansowa); Gwardia ze stratą ~35 HP (85/120 HP), Chaska ucieka z 10 HP.

> W rzeczywistej grze wyniki są losowe (rzut na trafienie). Podany przykład zakłada że oba trafienia padają w R1. Przy braku trafienia w R1 walka może przeciągnąć się do R2–R3, wynik jest jednak zdeterminowany przez przytłaczającą przewagę Gwardii.

## 6. Jednostki
Kamień: Osadnik, Robotnik, Wojownik, Łucznik, Zwiadowca. Brąz: Włócznik, Falanga, Wojownik z brązu (wymagają brązu), Rydwan (konie). **Koszt = Praca + 1 ludność (każda jednostka = −1 populacja) + surowiec.** Każda jednostka (też wojskowa) zjada 1 jedzenie/turę. **Jednostki kupuje się wyłącznie za Pieniądz** (w epoce 1 za Handel-substytut). **Utrzymanie jednostek również płatne w Pieniądzu/turę.**

## 6a. System jednostek — typy standardowe, nazwane zamienniki i super-jednostki

### Typy standardowe i nazwane zamienniki cywilizacyjne

Istnieją **standardowe TYPY jednostek** wspólne dla wszystkich cywilizacji. Cywilizacja może posiadać **NAZWANEGO ZAMIENNIKA** danego typu — własną jednostkę o unikalnej nazwie i nieco innych parametrach. W `Jednostki.xlsx` kolumna **„W zamian za"** wskazuje, jaki typ standardowy dany zamiennik zastępuje.

Jeśli cywilizacja nie ma zamiennika danego typu — używa standardowego.

**Przykłady nazwanych zamienników:**

| Cywilizacja | Nazwa zamienna | Typ standardowy (zastępuje) |
|---|---|---|
| Grecy | Falanga | włócznik |
| Rzym | Legionista | wojownik z mieczem |
| Zulusi | Impi | włócznik |
| Inkowie | Wojownik z maczugą (Chaska) | wojownik |
| Inkowie | Wojownik z toporem | wojownik z mieczem |
| Chiny | Jeździec chiński | konnica |

**Typy standardowe (przykładowa lista):** włócznik · łucznik · procarz · oszczepnik · wojownik · wojownik z mieczem · konnica · rydwan · galera.

### Jednostki dystansowe (procarz, oszczepnik, łucznik)

Dostępne **od Epoki Kamienia** (od startu gry). Parametr **„Ilość pocisków"** (limit ostrzałów na bitwę) dotyczy wyłącznie tych jednostek — szczegóły w §5g i §5i.

### Inkowie — specyfika

- **Brak łuczników** w standardowym sensie; Inkowie mają własne nazwane zamienniki dla procarza i oszczepnika.
- **Lama** = zwierzę pakowe (substytut wołu w transporcie i produkcji) — **NIE jest jednostką wojskową**.

### Super-jednostka

Każda cywilizacja posiada **jedną unikalną super-jednostkę** dostępną w **Epoce Brązu**. Zasady:

- **Maksymalnie 1 sztuka** w całej grze (limit bezwzględny).
- **Bezpłatna** — nie wymaga Pieniądza ani Pracy do rekrutacji.
- **Stacjonuje w stolicy** — pojawia się (lub jest rekrutowana) w mieście-stolicy.
- **Odradza się po utracie stolicy:** jeśli stolica zostanie zdobyta przez wroga, super-jednostka **odradza się automatycznie w nowej stolicy** (gdy gracz ustanowi nową stolicę).
- **Lepsze parametry** niż analogiczne jednostki standardowe — elita cywilizacji.

| Cywilizacja | Super-jednostka (Epoka Brązu) |
|---|---|
| Inkowie | Królewska Gwardia |
| Grecy | do zaproponowania |
| Rzym | do zaproponowania |
| Chiny | do zaproponowania |
| Zulusi | do zaproponowania |
| Egipt | do zaproponowania |
| Sumerowie | do zaproponowania |

> Pełne staty super-jednostek: `Jednostki.xlsx`. Propozycje dla pozostałych 6 cywilizacji — osobny wątek.

## 6b. Armie — mechaniki zarządzania

### Łączenie jednostek (Połącz / merge)

- Jednostki mogą stać na tym samym polu osobno (np. dwie naraz na jednym heksie).
- Komenda **„Połącz"** scala wybrane jednostki stojące na polu w **armię** (stos dowodzony przez generała).
- Po wejściu do armii jednostka **przestaje być osobnym żetonem na mapie** — liczy się wyłącznie jako część stosu.
- Na jednym polu może stać **maksymalnie 1 żeton armii danej nacji** (jedna armia = jeden heks).

### Obóz / odpoczynek

- Armia, która spędza **1 turę obozując** (bez ruchu i walki), uzupełnia wszystkie swoje jednostki do **maksymalnej mocy (Health)**.
- Obozowanie to aktywna komenda lub stan bezczynności przez całą turę.

### Amunicja

- Amunicja jednostek dystansowych jest **zerowana po każdej bitwie**.
- Uzupełnia się **automatycznie** — bez osobnej komendy „uzupełnij amunicję".
- Uzupełnienie następuje w **następnej turze** po bitwie (możliwe, że ładowanie pełnej amunicji trwa więcej niż 1 turę — do doprecyzowania w balancie).

### Obozowanie a żywność

- Armia w stanie obozowania zużywa **połowę normalnej ilości żywności** (zamiast standardowego 1 jedzenie/turę na jednostkę).

### Generał, wygląd armii na mapie i interakcja (zasady UI)

- **BRAK osobnej jednostki Generała:** nie tworzymy jednostki generała jako osobnego bytu na mapie. Wszystkie jednostki poruszają się po mapie **indywidualnie**.
- **Armia (stos jednostek):** gdy łączymy kilka jednostek w armię, jej widok na **mapie głównej** = model **NAJMOCNIEJSZEJ jednostki** w stosie (reszta ukryta pod spodem).
- **Hover na armię (najechanie kursorem):** pokazuje **zminiaturyzowaną, uproszczoną listę** jednostek znajdujących się w armii (czego i ile tam jest).
- **Klik „Szczegóły” na armii:** otwiera pełny **szczegółowy widok armii** (już przygotowany jako makieta `Podglad-armii.html`) — z dokładnym składem.
- **ROZWAŻANE (do decyzji, M3): bitwa 3D** — taktyczna plansza 3D wykorzystująca modele jednostek (styl Roblox) stworzone do gry, zamiast/obok ekranu 2D.


## 7. Technologie / 10 epok
Kamienia → **Brązu** (kończy: Pieniądz) → Żelaza (Bankowość ×100) → Prochu → Pary → Prądu → Komputerów → Internetu → SI → Robotów (Energia ×1000). (pełna rozpiska epok scalona w tym dokumencie i w grze). **Zakres v0.1 = Kamień + Brąz** (cel: wynaleźć Pieniądz).

## 8. Miasta i ludność / walka / tury / UI
**Ludność (model inny niż Civ):** 1 ludność zjada **1 jedzenie/turę**; każda **jednostka wojskowa też zjada 1 jedzenie/turę**. Stworzenie **dowolnej** jednostki = **−1 ludność**. **Wzrost miasta = wartość bazowa (stała) + współczynnik wzrostu** zależny od ilości jedzenia i **poziomu zdrowia**.
**Zdrowie:** każde miasto ma poziom zdrowia. **Podnoszą** je budynki (akwedukt, łaźnie, szpital) oraz świeża woda (rzeka). **Stale obniżają** je: zagęszczenie/wielkość miasta, zanieczyszczenie i trudność. Zdrowie wpływa na **współczynnik wzrostu** (wysokie → szybszy wzrost; niskie → stagnacja lub spadek populacji).
Każde miasto ma swój **zasięg/terytorium** (granice), w którym obrabia pola i pozyskuje surowce (zasięg DUŻY — patrz **§8a**). Wzrost z zapasu żywności (wymaga Spichlerza). Walka: `atak/(atak+obrona)` + losowość; premie terenu. Tura: plony → wzrost → produkcja → nauka → rynek. UI: mapa (Canvas) + panele: Stan, Miasto, Jednostka, **Bilans/turę**, Dziennik.

## 8a. Zasięg miast, wioski i zakładanie (model „dużych miast")
- **Duży zasięg miasta** — celowo, by nie zmuszać gracza do budowy i mikrozarządzania wieloma miastami.
- **Skala zasięgu:** w **Epoce 1** miasto obejmuje nawet **10×10 (≈100 pól)**; zasięg rośnie **+1 co epokę**, sięgając ok. **20×20 w ostatniej epoce**.
- **Widok okolicy miasta:** minimum **100 pól (10×10)**.
- **Każdy zajęty przez nas teren ma wioskę** (wcześniej zdobytą lub przyłączoną). Wioska jest warunkiem koniecznym, by na danym heksie założyć miasto.
- **Kliknięcie heksu w siatce okolicy miasta daje dwie akcje:**
  1. **Przydziel / zabierz pracownika** — standardowa akcja zarządzania ludnością; przypisuje lub odpisuje mieszkańca pracującego na tym terenie (wpływa na plony).
  2. **Załóż nowe miasto** — możliwe TYLKO gdy na heksie jest **wioska** (nasz teren) ORAZ odległość od każdego innego naszego miasta wynosi **≥ 5 pól**. Budowa miasta jest możliwa praktycznie wszędzie, gdzie mamy wioskę i zachowany dystans — bez potrzeby osadnika.
- **Osadnik** potrzebny **tylko** do założenia miasta **poza zasięgiem** istniejących miast (czyli tam, gdzie nie mamy jeszcze wiosek w naszym zasięgu).
- **Minimalna odległość między miastami:** **≥ 5 pól**.
- **Produkcja a liczba miast:** każde miasto produkuje **niezależnie** → **więcej miast = więcej równoległej produkcji**. Duży zasięg zmniejsza KONIECZNOŚĆ wielu miast, ale zakładanie kolejnych wciąż się opłaca dla mocy produkcyjnej.

## 8b. Start gry, ludność w terenie i cywilizacje
- **Ludność rodzi się w terenie (model historyczny):** najpierw wioski, potem miasta. **Każdy zamieszkiwalny heks (≥1 żywność) startuje z 1 jednostką ludności** (wioska). **Góry/jałowe pola (0 żywności) — bez ludności.**
- **Przejmowanie:** odkrywając/zajmując teren przejmujesz tamtejszą **wioskę i jej ludność** — to nasi **obywatele** (nie niewolnicy), przypisani do najbliższego miasta. **Ekspansja = szybki przyrost ludności**, ale **ograniczony żywnością** (najpierw zdobądź tereny rolne, by wyżywić).
- **Miasta** startują z małą ludnością; ludność rośnie i można ją **rozprowadzać** na inne tereny (wioski → miasta, patrz §8a).
- **Start rozgrywki:** gracz zaczyna z **1 osadnikiem**. Na mapie startuje łącznie **50 cywilizacji**: **7 głównych typów** (Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi, Egipt, Sumerowie) + drobne **cywilizacje początkowe** (pozostałe). Wokół gracza klaster **~10 rywali tego samego typu** (AI, sterowanych przez AI) — wszyscy w jednym regionie mapy. **Cel startu: pokonać rywali własnego typu**, zanim napotkasz inne typy. Na początku spotykamy głównie **swój typ**, potem stopniowo inne nacje. Liczby skalują się z wielkością mapy.
- **Dyplomacja z cywilizacjami początkowymi:** uproszczona, możliwa z drobnymi cywilizacjami początkowymi — **osobny, późniejszy wątek; NIE rozwijać teraz**.
- **7 typów głównych:** **Grecy** (Falanga), **Rzymianie** (Legion), **Chińczycy** (Kusznik Brązu + konnica specjalna; Kusznik właściwy → Żelazo), **Inkowie** (Chaska / maczuga gwiaździsta + Królewska Gwardia; brak koni/rydwanów/konnicy; mocna piechota + dystans: procarze, oszczepnicy, łucznicy; lamy jako zwierzę pakowe), **Zulusi** (lepsi łucznicy/oszczepnicy), **Egipt** (do sprecyzowania), **Sumerowie** (do sprecyzowania) — każda z **jednostką specjalną (po co najmniej 1)** i **bonusami/minusami** (szczegóły: §8c). Pełne dane: `Cywilizacje.xlsx`.
- **UWAGA:** `Spec-generator-mapy.md` wymaga drobnej korekty — zaktualizować liczbę typów głównych z 5 na 7.

## 8c. Cywilizacje — jednostki specjalne i ograniczenia zwierzęce

### Jednostki specjalne (po 1+ na cywilizację, epoka Brązu jeśli nie podano inaczej)

| Cywilizacja | Jednostka specjalna | Wyróżnik |
|---|---|---|
| **Grecy** | Falanga | Silna od frontu; neguje szarżę (bracing); wrażliwa na flankę |
| **Rzym** | Legion | Brak kary za flankę; dobry w defensywie i ofensywie |
| **Chiny** | Kusznik Brązu (Brąz); Kusznik → Żelazo | Dystansowy z wyższym Atakiem dystansowym; + mocna konnica specjalna; Kusznik właściwy przeniesiony do Epoki Żelaza |
| **Zulusi** | Lepsi łucznicy / oszczepnicy | Wyższy Atak/Obrona niż standardowi; **brak rydwanów** (patrz ograniczenia) |
| **Inkowie** | Chaska (maczuga gwiaździsta) · Królewska Gwardia (elita) | Brak koni, rydwanów i konnicy. Mocna piechota + jednostki dystansowe (procarze, oszczepnicy, łucznicy). Lamy jako zwierzę pakowe (Andy) — substytut wołu. Chaska = wysoka siła uderzenia wręcz; Królewska Gwardia = elita piechoty z wysokim Morale i Obroną |
| **Egipt** | do zaproponowania | do sprecyzowania |
| **Sumerowie** | do zaproponowania | do sprecyzowania |

> Pełne staty (Atak, Obrona, Uderzenie, Health, Morale, Zasięg) — `Jednostki.xlsx`. Aktualizuje osobny lider.

### Ograniczenia zwierzęce

- **Zulusi:** **brak rydwanów** (ani na wołach, ani na koniach). Jednostki konne niedostępne.
- **Inkowie:** **brak koni, wołów, konnicy i rydwanów**. Zamiast wołu — **lamy** jako zwierzę pakowe (Andy; mniejszy bonus produkcji i transportu niż wół, ale dostępny od początku). Konie i woły stają się dostępne dopiero **po zdobyciu odpowiednich terytoriów lub technologii** (event / podbój); bez nich cywilizacja funkcjonuje normalnie, tyle że bez tych jednostek i bonusów. Siła Inków leży w piechocie i dystansie: procarze, oszczepnicy, łucznicy; jednostki specjalne: **Chaska** (maczuga gwiaździsta — silna piechota wręcz) i **Królewska Gwardia** (elita — wysokie Morale, Obrona, Health).
- **Lama (Inkowie):** surowiec / jednostka transportowa (Andy); bonus +produkcja mniejszy niż wół (konkretny współczynnik: `Surowce.xlsx`); substytut wołu w recepturach wymagających „zwierzęcia pociągowego".

## 8d. Warunki zwycięstwa

Warunki sprawdzane **co turę**. Spełnienie dowolnego → ekran zwycięstwa (lub przegranej, jeśli warunek dotyczy gracza).

---

### 1. Dominacja własnego typu (cel startowy — Epoka Kamienia / Brązu)

**Cel:** wyeliminuj wszystkich ~10 rywali **tego samego typu** co gracz (AI-e z klastra startowego).

**Definicja eliminacji rywala:**
- „Pokonać rywala" = **zlikwidować WSZYSTKIE jego miasta** (nie tylko stolicę).
- Zdobycie stolicy **nie** oznacza eliminacji — przejmujesz jej skarbiec, ale rywal **przenosi stolicę** do kolejnego ocalałego miasta, a jego super-jednostka **odradza się w nowej stolicy**. Rywal walczy dalej.
- Rywal jest eliminowany dopiero, gdy **nie ma żadnego miasta**. Wówczas jest usuwany z gry (bez możliwości odrodzenia).

**Wygrana:** gdy wszyscy rywale tego samego typu zostaną w ten sposób wyeliminowani → ekran zwycięstwa etapu (dalsza gra toczy się z innymi typami).

---

### 2. Zwycięstwo naukowe / kosmiczne (ostatnia epoka)

**Cel:** dotrzeć do **końca drzewka technologii** (Epoka Robotów) i zbudować **statek kosmiczny**.

- Warunek odblokowania: gracz musi posiadać **wszystkie technologie ostatniej epoki** (Robotów; szczegółowa lista technologii tej epoki — do uzupełnienia gdy epoka zostanie zaprojektowana).
- Po spełnieniu warunku pojawia się projekt **„Statek kosmiczny"** w kolejce produkcji stolicy.
- Ukończenie budowy statku → **zwycięstwo naukowe/kosmiczne** — koniec gry, ekran końcowy.

> Dane technologiczne epok Żelaza i późniejszych (w tym Epoki Robotów) — **do uzupełnienia w przyszłości** gdy odpowiednie epoki zostaną zaprojektowane.

---

### 3. Super-jednostki a warunki zwycięstwa

Super-jednostki są równoważone **wyłącznie przez countery, flankę, przewagę liczebną i teren** — bez dodatkowych hard-counterów.

- Testy potwierdzają: super-jednostka pada po **~33–56 rundach** walcząc z nieprzerywanym ciągiem Legionistów, uśmiercając przy tym **2–4 z nich** — nie jest niepokonana, ale wymaga nakładu sił.
- Fakt odrodzenia super-jednostki w nowej stolicy (po zdobyciu poprzedniej) jest celowym elementem mechaniki eliminacji: rywal nie jest wyeliminowany, dopóki ma chociaż jedno miasto.

---

### Sprawdzanie warunków (implementacja)

Po każdej zakończonej turze silnik gry sprawdza:
1. Czy **każdy rywal tego samego typu** ma 0 miast? → jeśli tak → ekran zwycięstwa etapu (Dominacja własnego typu).
2. Czy **gracz ma 0 miast**? → ekran przegranej.
3. Czy gracz ukończył **budowę statku kosmicznego** (Epoka Robotów)? → ekran zwycięstwa finalnego.

> Warunki dodatkowe (dominacja ogólna, zwycięstwo dyplomatyczne, kulturowe itp.) — **do zaprojektowania w przyszłości**.

## 

## 8e. Ekonomia miast i budynków — model dużego miasta

Zasady potwierdzone w projekcie (obowiązują przy implementacji ekonomii miast):

### 1. Model dużego miasta (preferowany)
- Preferujemy **JEDNO duże miasto o dużym zasięgu**, które zarządza całym terenem, zamiast dzielić pola między nakładające się miasta.
- Duży zasięg (patrz §8a) sprawia, że jedno miasto obejmuje rozległy obszar — nie ma potrzeby zakładania kolejnych miast wyłącznie w celu „zajęcia" pobliskich pól.

### 2. Miasto-córka — zasady ekonomiczne
- **Miasto-córka** (założone w granicach terytorium miasta-matki, np. na heksie wewnątrz jej zasięgu) **NIE dostaje bazowych plonów z pól matki**.
- Miasto-córka **buduje TYLKO BUDYNKI** i jej wynik ekonomiczny pochodzi wyłącznie z **bazowej produkcji / Pieniądza tych budynków** — np. tartak daje +5 Pracy/turę bezpośrednio.
- Dzięki temu miasto-córka pełni rolę „centrum przemysłowego" lub „centrum handlowego" niezależnego od terenu.

### 3. Budynki jako samodzielne źródło zasobów (płaska baza)
- **Budynki są samodzielnym źródłem Pracy i Pieniądza** — nie tylko mnożnikiem plonów terenowych.
  - **Budynki produkcyjne** (tartak, kuźnia, warsztat…) → dają **bazową Pracę/turę** (liczba stała, niezależna od pól).
  - **Budynki handlowe / pieniężne** (targowisko, mennica, bank…) → dają **bazowy Pieniądz/turę** (liczba stała).
- Wartości bazowe budynków — w `Budynki.xlsx`; eksportowane do `gra/data/buildings.json`.

### 4. Rola epoki — teren vs. miasto
- **Wczesne epoki (Kamień, Brąz):** dominują **surowce z terenu** — plony pól, złoża, las. Budynki są uzupełnieniem.
- **Późne epoki (Żelazo, Industrializacja, Robotów):** **miasto (jego budynki) staje się kluczowym motorem** produkcji i pieniędzy — na wzór historycznych miast-państw o małym terytorium (Wenecja, Genua, Tyr) żyjących z handlu i rzemiosła, nie z ziemi.
- Ten podział jest celowy: zmusza gracza do inwestowania w budynki w miarę postępu epok.

### 5. Pole ekspansji miasta-córki w terenie
- Miasto-córka może **zarządzać polami wyłącznie nieobsługiwanymi przez matkę**:
  1. **Pustymi z braku ludności matki** — pola w zasięgu matki, ale nieprzydzielone żadnemu pracownikowi (matka ma za mało ludności, by je obsadzić).
  2. **Poza zasięgiem matki** — heksy poza strefą zasięgu matki, ale w zasięgu córki.
- To jej „pole do rozwoju w terenie" — nie wchodzi w konflikt z matką, tylko zagospodarowuje resztę.

> Streszczenie reguły: matka = pan terenu; córka = mistrz budynków + ekspansja na resztkę terenu.

## 9. Styl wizualny, Porządek, Milicja i jednostki specjalne

## 9a. Styl jednostek (minimum akceptowalnej jakości wizualnej)

> Styl Roblox jest **wzorcem obowiązkowym** dla wszystkich jednostek w grze. Odchylenia poniżej tego standardu są nieakceptowane w kodzie produkcyjnym.

**Definicja stylu Roblox:**
- **Klockowy awatar (humanoid z prostych brył):** bazowe ciało jednostki składa się z uproszczonych geometrycznych brył (sześciany, walce) — jak humanoidalny avatar w stylu Roblox.
- **Szczegółowy pancerz, hełm, broń i peleryna nałożone na bazowe ciało:** na prostą bazę nakładane są bardziej szczegółowe elementy identyfikujące jednostkę (pancerz płytowy, hełm z wizjerem, miecz, oszczep, peleryna/płaszcz).
- **Czyste teksturowanie:** tekstury płaskie lub low-poly; brak realistycznych map normalnych w stylu AAA. Styl czytelny, zrozumiały z odległości (widok z góry/izometryczny).

**Referencje:** `Civ/Referencje-jednostek/` — folder z obrazami wzorcowymi (patrz `README-referencje.md` dla pełnej listy i opisów). Priorytety: ref-01 (Legionista römski), ref-04 (Wojownik z mieczem/piechota chińska).

---

## 9b. Semantyka Porządku (zmiana nazewnictwa)

> Ten paragraf **zastępuje** wcześniejsze nazewnictwo „Zadowolenie" i „Porządek" (stary system). Aktualizuje §5f, §5f-religia i `Spec-spoleczenstwo.md`.

**Nowa semantyka parametru miasta:**

| Parametr | Nowa nazwa | Stara nazwa (wycofana) | Składniki |
|----------|------------|------------------------|-----------|
| Główny parametr dobrostanu | **Porządek** | Zadowolenie | Szczęście + Prawo |
| Składnik emocjonalny | **Szczęście** | (część dawnego Zadowolenia) | — |
| Składnik prawny/strukturalny | **Prawo** | Porządek (stary) | — |

**Zasady działania:**
- **Porządek = Szczęście + Prawo.** Oba składniki są wymienne — miasto może mieć niski Porządek przy słabym Szczęściu kompensowanym silnym Prawem (np. twardą administracją) i odwrotnie.
- **Próg T1 (niski Porządek):** ludność gorzej pracuje — obniżony output Pracy z terenu i budynków.
- **Próg T2 (bardzo niski Porządek):** bunt — destabilizacja miasta, ryzyko utraty kontroli.
- Wartości progów T1/T2 oraz mnożniki kary Pracy — edytowalne w `Społeczeństwo-parametry.xlsx`, zakładka **Porządek**.

**Aktualizacja odwołań:**
Wszędzie w dokumentach, kodzie i arkuszach, gdzie pojawia się „Zadowolenie" jako główny parametr dobrostanu lub „Porządek" jako parametr strukturalny — stosuj nową terminologię:
- Stare „Zadowolenie" → **Porządek**
- Stare „Porządek" → **Prawo**
- Stare „Szczęście" → **Szczęście** (bez zmiany, jeśli używane jako składnik)

---

## 9c. Milicja wieśniaków (obrona pasywna miast)

> Zasada uzupełnia §5 (Walka) i §8 (Miasta i ludność). Dotyczy każdego miasta w grze.

**Mechanika:**
- Gdy miasto jest **atakowane** (wróg wchodzi na pole bitwy miasta lub oblęga miasto), **~20% mieszkańców** automatycznie staje do obrony jako jednostki milicji.
- Milicjanci to **chłopi z widłami** (referencja: `Civ/Referencje-jednostek/ref-22.png`).
- **Parametry milicji:** siła bojowa ~**1/2 Wojownika Epoki Kamienia** (konkretne staty: `Jednostki.xlsx`, wiersz „Milicja / Chłop z widłami").
- Milicja **nie jest rekrutowana** przez gracza — pojawia się automatycznie przy obronie miasta.
- Milicja **nie istnieje poza polem bitwy** — nie maszeruje, nie pojawia się na mapie świata.

**Cel projektowy:** każde miasto ma minimalną obronę obywatelską — miasta nie można łatwo zdobyć nawet bez regularnej armii. Wymaga to od atakującego przewagi liczebnej lub jakościowej ponad milicję.

**Balans (edytowalny):**
- Odsetek mieszkańców tworzących milicję: domyślnie **20%**, parametr w `Społeczeństwo-parametry.xlsx`.
- Przelicznik siły milicji względem Wojownika Ep. Kamienia: domyślnie **0.5** (= 50% statów).

---

## 9d. Przyszłe kultury: Galowie i Germanie

> Zasada dodaje dwie przyszłe cywilizacje/kultury do wdrożenia w kolejnych epokach (po Epoce Brązu/Żelaza).

**Galowie:**
- Cywilizacja oparta na silnej piechocie z bronią sieczną.
- Jednostka referencyjna: **Miecznik galijski** (`Civ/Referencje-jednostek/ref-17.png`).
- Szczegóły jednostek, bonusów i historycznego kontekstu — do zaprojektowania przy implementacji tej kultury.

**Germanie:**
- Cywilizacja pokrewna Galom (planowane razem w tym samym wdrożeniu).
- Szczegóły — do zaprojektowania.

**Status:** obie kultury planowane w kolejnych iteracjach projektu (po wdrożeniu cywilizacji v0.1). Referencje wizualne w `Civ/Referencje-jednostek/`.

---

## 9e. Jednostka zabójca / szpieg

> Zasada wstępna — do sprecyzowania przy projekcie modułu dyplomacji/szpiegostwa.

**Opis:**
- Specjalna jednostka zdolna do **eliminowania generałów** i **wybranych jednostek** na mapie lub polu bitwy.
- Operuje przez **działania specjalne** (nie standardowe uderzenie w zwarciu).
- Referencje wizualne: `Civ/Referencje-jednostek/ref-07.png` (szpieg), `ref-20.png` (jednostka zabójca).

**Do doprecyzowania przy module dyplomacji/szpiegostwa:**
- Koszt rekrutacji i utrzymania.
- Lista dostępnych akcji specjalnych (zabójstwo generała, dezinformacja, sabotaż, kradzież technologii, itp.).
- Zasięg i mechanika wykrycia.
- Czy generał to osobna jednostka na mapie czy cecha armii.

**Status:** zasada przyjęta; implementacja odłożona do wdrożenia modułu szpiegostwa/dyplomacji.

---

## 9f. Mapowania jednostek (referencje → mechanika gry)

Tabela przypisania obrazów referencyjnych do konkretnych ról w mechanice gry:

| Referencja | Jednostka / Rola | Cywilizacja | Epoka |
|------------|-----------------|-------------|-------|
| ref-18 (Jaguar) | **Topornik / Maczugowiec** — jednostka Azteków (Mezoameryka) | Aztekowie / Inkowie | Brąz |
| ref-08 (Nieśmiertelni) | **Nieśmiertelni** — elita Sumerów lub jednostka kolejnych epok | Sumerowie / ogólna | Brąz+ |
| ref-07 (Szpieg) | **Szpieg / Zabójca** — jednostka specjalna (patrz §9e) | Wszystkie | TBD |
| ref-20 (Zabójca) | **Zabójca** — eliminacja generałów/jednostek (patrz §9e) | Wszystkie | TBD |
| ref-17 (Miecznik Galów) | **Miecznik galijski** — Galowie (przyszła kultura, patrz §9d) | Galowie | Żelazo+ |
| ref-22 (Chłop z widłami) | **Milicja wieśniaków** — obrona pasywna miast (patrz §9c) | Wszystkie | Ep. Kamienia |

> Pełna lista referencji z opisami: `Civ/Referencje-jednostek/README-referencje.md`.
