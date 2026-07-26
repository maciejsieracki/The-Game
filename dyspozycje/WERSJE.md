# WERSJE — jedyny rejestr wersji bundli (prowadzi: publikujący, czyli INTEGRATOR)

ZASADA: md5/stempel wpisuje się TYLKO tutaj, zaraz po publishu. Inne pliki linkują,
nigdy nie kopiują (stary system miał 4 sprzeczne „aktualne" md5 — nigdy więcej).
Format: data · md5 (pełne) · stempel z menu · co weszło (1 linia) · status.

UWAGA: KANON i FINALNA promują się teraz OSOBNYMI skryptami (`gra/tools/publish-kanon-snapshot.ps1`
= ROBOCZA→KANON, `gra/tools/publish-finalna-snapshot.ps1` = KANON→FINALNA, ten drugi tylko na
wyraźne polecenie właściciela) — dlatego są logowane NIEZALEŻNIE, każdy w swojej sekcji, ze
swoim własnym md5/stemplem/statusem; promocja jednego NIE oznacza promocji drugiego.



## ROBOCZA `1636f388` — 2026-07-26 23:38 · FALA 25: KULTURA/RELIGIA + PANEL SKŁAD — **AKTUALNA**
- md5 (pelne): `1636f388b512b008a2b95a6a46d8bdb9` · stempel: `ROBOCZA · 2026-07-26 23:38`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest.
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0).
- **Co nowego:**
  - **Kultura — bez podwójnej kary:** usunięta druga linia „Obca kultura −2"; jedna pozycja **„Kultura"** w rozpisce Szczęścia.
  - **Miasta założone = 100% kultury właściciela** — presja sąsiadów nie obniża udziału.
  - **Podbój tego samego okręgu kulturowego** (np. Ateny→Sparta, obie Grecka) = od razu 100% kultury + religia państwa zdobywcy.
  - **Okręg kulturowy** porównywany po `typCywilizacji`, nie po nazwie państwa.
  - **Presja kultury:** silniejsze imperium podnosi udział własnej kultury (naprawa błędu obu gałęzi spadku).
  - **Panel miasta — Kultura:** sekcja „Skład kultury" (% właściciela / obca + konwersja).
  - **Panel miasta — Religia:** „Religia państwa" + „Skład wyznawców" z %.
- **Bramki:** tsc 0 · manpower-test 44/44 · ai-test 246/246 · map-attack-city 8/8 · society-breakdown 40/40.

## ROBOCZA `4a8745eb` — 2026-07-26 23:28 · FALA 24: MANPOWER IMPERIUM + FALA 23 — **ZASTĄPIONA**
- md5 (pelne): `4a8745eb332dbc9c3bd280e530ce60c7` · stempel: `ROBOCZA · 2026-07-26 23:28`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest.
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0).
- **Co nowego (kumulatywnie od F22):**
  - **Manpower imperium (Maciej 2026-07-26):** werb/anulowanie/rozwiązanie jednostki — tylko pula rekrutów cywilizacji (suma po miastach); **bez** spadku obywateli przy rekrutacji; zwrot MP do puli imperium, nie do miasta rekrutującego.
  - Alert produkcji (warunkowy, ✕ + fingerprint, bez auto-budowy) · baner zasobów miasta 2×3 · klik w miasto przy jednostce → marsz · P-AI-011 + C-AI.
- **Bramki:** tsc 0 · manpower-test 44/44 · ai-test 246/246 · map-attack-city 8/8.

## ROBOCZA `e5972875` — 2026-07-26 23:21 · FALA 23: PRODUKCJA + UI MIASTA + MARSZ + AI HANDEL — **ZASTĄPIONA**
- md5 (pelne): `e5972875918e6e57c67657e2041674d2` · stempel: `ROBOCZA · 2026-07-26 23:21`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest. HEAD roboczy `cba0a39` (lokalne zmiany w `gra/src`, niezacommitowane).
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0).
- **Co nowego:**
  - **Alert „Produkcja: … / Kolejka pusta"** tylko gdy `cityHasActionableProduction` (budynki, jednostki, ulepszenia poziomu, cuda — ta sama logika co panel). ✕ zamyka i zapisuje fingerprint opcji; wraca po zmianie możliwości lub po opróżnieniu kolejki. Lista miast: „Kolejka pusta" tylko wtedy samo. Auto-budowa (`budowaTryb=auto`) — bez alertu.
  - **Panel miasta — baner zasobów 2×3:** Praca/Żywność/Skarbiec nad Kulturą/Religią/Nauką, wyrównane w jednym banerze.
  - **Klik w miasto przy zaznaczonej jednostce:** zawsze `planMarchTo` (także przy 0 ruchu — podgląd trasy); panel miasta tylko bez zaznaczenia. Obcy gród: atak jeśli możliwy, inaczej marsz na sąsiedni heks.
  - **P-AI-011 + pakiet C-AI** (proaktywny handel, audiencja AI, margines ceny, rozwój/wojna/ekspansja) — kod w bundlu.
- **Bramki:** tsc 0 · ai-test 246/246 · map-attack-city 8/8 · logic-test 207/208 (pre: garnizon visibility).

## ROBOCZA `61cd43ad` — 2026-07-26 18:21 · FALA 22: GORZYSTOSC OBNIZONA DO ~12% — **ZASTĄPIONA**
- md5 (pelne): `61cd43ad517642a6bb92494a633871e5` · stempel: `ROBOCZA · 2026-07-26 18:21`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji). HEAD `668229a`.
- Wynik `vite build` sprawdzony PRZED kopiowaniem (exit 0).
- **Co nowego — C-MAPA-Q2 = B, obnizenie gorzystosci:**
  - Nowy nazwany parametr `gestosc.relief_overflow_cap_frac` w `map-gen-params.json`
    (jednostka: **ulamek heksow ladu w komorce siatki fair-play 25x25**):
    low 0,03 Gory / 0,05 Wzgorza · medium 0,04 / 0,06 · high 0,08 / 0,12.
    Dla medium suma = 0,10, czyli dokladnie progi wymagane przez `fair-play-grid-test`.
  - Przywrocony sufit `RELIEF_OVERFLOW_CAP_MULT = 1` (byl wylaczony na nieskonczonosc,
    bo w poprzedniej probie zbijal gorzystosc — teraz to jest CEL). Egzekwowany dwukrotnie:
    przy zasiewaniu reliefu i po rozroscie pasm gorskich.
  - **Naprawa, ktorej brakowalo w poprzedniej probie:** spozniony przebieg domykania reliefu
    dla typu „ziemia" przycinal sufitem heksy z wymuszonymi zlozami fair-play i je KASOWAL.
    Nowa funkcja ochronna — heks ze zlozem nigdy nie jest kandydatem do przyciecia
    (ani w sufitcie gestosci, ani w limicie skupiska z decyzji 63).
- **Zmierzona gorzystosc** (5 ziaren, standard 168x120, kontynenty, relief medium), jednostka:
  **% powierzchni ladu**: przed 25,76–28,37% (srednia **26,64%**) -> po 11,83–12,68%
  (srednia **12,12%**). Ponad dwukrotny spadek. Powyzej idealnych 10%, bo podloga
  2 Gory + 2 Wzgorza na komorke oraz mniejsze komorki brzegowe podnosza efektywna gestosc.
- **⚠️ SKUTEK UBOCZNY DO OCENY PRZEZ WLASCICIELA — spadek liczby zloz** (sumy z 5 ziaren):
  miedz 317 -> 209 (**-34%**), zelazo 339 -> 225 (**-34%**), zloto 150 -> 67 (**-55%**).
  Miedz i zelazo maja gwarancje fair-play (min. 1 na komorke), zloto nie.
- **Bramki:** tsc 0 · relief-grid-coverage **6/6** · fair-play-grid **7/8** · zloto 43/43 ·
  deposit-coast 20/20 · map-quality-forest-parity 101/101 · world-density 30/31 (porazka
  pre-istniejaca, niezwiazana z reliefem) · map-gen-regression: determinizm A=B (hash
  `471f0970`), **0 rzek bez ujscia** (710/710 do realnego morza); FAIL tylko na progach
  czasowych — pomiar wydajnosci kontenera, nie regresja.
- **Jedyna pozostala porazka fair-play** („Standard Ziemia: zloza siatka 25 >=85%", dziś 75%,
  bylo 50%): w jednym ziarnie komorka 21-heksowa nie ma ANI JEDNEGO heksu z rzeka, a regula
  gliny wymaga rzeki (decyzja 2026-07-24) — glina jest tam strukturalnie niemozliwa.
  Przyczyna lezy w generacji RZEK, nie reliefu. Test ani regula gliny nie byly naginane.

## ROBOCZA `3e847677` — 2026-07-26 17:57 · FALA 21: DZWIGNIA 2 WIARYGODNOSCI + TARASY UNIKALNE — **ZASTĄPIONA (61cd43ad)**
- md5 (pelne): `3e847677394e0464c0bd617760941a21` · stempel: `ROBOCZA · 2026-07-26 17:57`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji). HEAD `8e48dec`.
- **Wynik `vite build` sprawdzony PRZED kopiowaniem** (721 modulow, exit 0) — procedura po wpadce z fali 20b.
- **Co nowego:**
  - **Dzwignia 2 Wiarygodnosci (WIAR-9.5b=B)** — limit „max_zaufanie_na_ture" (pkt Zaufania na ture,
    z darow i nadwyzki handlowej) zalezy teraz od Wiarygodnosci TEGO, KTO DAJE:
    W w [0,100] -> 5 pkt/ture (bez zmian) · W w (-40,0) -> 3 pkt/ture ·
    W w (-70,-40] -> 1 pkt/ture · W w [-100,-70] -> 0 pkt/ture (zakup zaufania darem zablokowany).
    Cywilizacja o zlej reputacji nie kupi juz sympatii zlotem.
  - **Nagroda P5 „pomoc sojusznikowi"** (+20 pkt Wiarygodnosci) — naliczana wylacznie wtedy, gdy
    sojusznik FAKTYCZNIE dolacza do wojny na wezwanie obowiazku sojuszniczego.
  - **Kara N4 (odmowa pomocy)** — wpiety seam decyzyjny w AI; dzis zawsze „honoruje sojusz",
    wiec ZERO zmiany w balansie, ale petla kary (-15 pkt Wiarygodnosci + zerwanie traktatu
    wylacznie odmawiajacemu) jest juz podpieta i czeka na heurystyke (decyzja balansowa do ABC).
  - **Tarasy uprawne znowu UNIKALNE kulturowo (C-TARASY-Q1=A)** — buduja je wylacznie Chinczycy
    i Inkowie. Bramka dziala w panelu budowy, na duchach/podswietleniu mapy, przy kliknieciu
    budowy ORAZ w planowaniu AI (parytet, bez rozgalezien per wlasciciel). Uzyto istniejacej
    konwencji z cudow swiata (pole „cywilizacje" w danych) — mechanizm jest ogolny, wiec kolejne
    ulepszenie unikalne to juz tylko wpis w JSON.
  - **Modal wyboru heksa w brandzie gry + maksymalne HP w szczegolach bitwy** — skomitowane
    wczesniej (`b9867b3`), do bundla wchodza dopiero TERAZ (build byl zablokowany).
- **Bramki:** tsc 0 · wiarygodnosc-test 84/84 (bylo 63/63) · tarasy-cywilizacje-test 17/17 (nowy) ·
  ai-test 239/239 · logic-test 208/208 · civ-visual-test 54/54 · diplomacy-layers 14/14 ·
  diplomacy-negotiation-table 39/39 · tech-tree 19/19 · research 33/33 · unit-replace 10/10.
  Porazki `diplomacy-test` 144/146, `diplomacy-proposal` 65/66, `diplomacy-value-catalog` 40/41 —
  identyczne jak bazowo, bez nowych regresji.

## ROBOCZA `856b804b` — 2026-07-26 · FALA 20b: PONOWNY BUILD PO NIEUDANYM DEPLOYU — **ZASTĄPIONA (3e847677)**
- md5 (pelne): `856b804bef0b80fe33e8d59628670235` · VERIFY OK. Zbudowane z commita `6e1e0e4`.
- **ZAWARTOSC IDENTYCZNA z fala 20** (Skarbiec i Praca netto). Nowy md5 wynika wylacznie
  z nowego stempla czasu.
- **⚠️ WPADKA DO ODNOTOWANIA:** bundle `ddcc04c1` (wgrany chwile wczesniej) byl NIEWAZNY —
  build sie NIE POWIODL, a `cp` skopiowal poprzednia zawartosc dist, wiec plik mial nowa
  pieczatke i stara tresc. VERIFY tego nie wykrywa, bo porownuje manifest z plikiem, a nie
  z wynikiem builda. **Wniosek na przyszlosc: sprawdzac wynik `vite build` PRZED kopiowaniem
  do gra-robocza — sam `VERIFY OK` nie jest dowodem, ze build sie udal.**
- **Przyczyna nieudanego builda:** commit `b9867b3` (modal wyboru heksa + maksymalne HP)
  objal `main.ts`, w ktorym byl juz import `diplomacyMaxZaufanieNaTureForWiarygodnosc`
  z NIEDOKONCZONEJ, niezacommitowanej pracy innego zlecenia (Dzwignia 2 Wiarygodnosci).
  `tsc` przechodzi, bo widzi caly katalog roboczy; bundler buduje wylacznie z tego, co
  skomitowane — i pada. Modal i maksymalne HP sa wiec SKOMITOWANE, ale NIE ma ich w tym
  bundlu; wejda razem z Dzwignia 2, gdy tamto zlecenie sie zamknie.

## ROBOCZA `0dc317f2` — 2026-07-26 · FALA 20: SKARBIEC I PRACA NETTO — **ZASTĄPIONA (ta sama zawartosc, nowy stempel: 856b804b)**
- md5 (pelne): `0dc317f28114bcfd86238aa706fc8910` · VERIFY OK, 6 bundli PLAYTEST, manifest 10 pozycji.
- Zbudowane z HEAD `6e1e0e4`.
- **Co nowego:** liczba przy Skarbcu pokazywala WPLYWY BRUTTO (Danina/Podatek + pieniadz
  z budynkow + Handel), a skarbiec rosl o NETTO — po odjeciu utrzymania budynkow i jednostek.
  Stad „+6 na chipie, +1 realnie". Ten sam blad mial chip PRACY (brak odjecia utrzymania
  ulepszen surowcowych). Nauka i Zywnosc sprawdzone — bez tej wady.
  Tooltipy chipow pokazuja teraz pelne rozbicie z nazwami i jednostkami, wiec widac,
  gdzie znika roznica.
- **Bramki:** tsc 0 · hud-skarbiec 7/7 (nowy) · currency 32/32 · upkeep 67/67 ·
  plony-budynkow 68/68 · korupcja 18/18 · logic 208/208 · wire-ekonomia 37/37 · ai 239/239.

## ROBOCZA `ce54be5b` — 2026-07-26 17:22 · FALA 19: DWA BLEDY BLOKUJACE + WIARYGODNOSC — **ZASTĄPIONA**
- md5 (pelne): `ce54be5b062f229cf77871597774573a` · stempel: `ROBOCZA · 2026-07-26 17:22`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji). HEAD `7931364`.
- **Naprawione oba bledy blokujace zgloszone w playtescie:**
  - **Jednostka przenoszona w nieoczekiwane miejsce** — przyczyna NIE byla w garnizonie ani
    fortyfikacji (obie przesledzone i wykluczone), tylko w oknie „Polaczenie armii": klik
    w przyciemnione tlo i Escape dzialaly jak swiadome „Zostaw osobno", a ta akcja FIZYCZNIE
    odsuwa jednostke w strone heksu wyjscia (albo na sasiedni wolny, gdy oryginalny zajety).
    Modal wyskakuje odroczony na przelomie tury — czyli gdy gracz klika w mape po kolejny
    rozkaz. Stad trzy warianty objawu naraz. Blad istnial od 2026-07-22.
  - **Spichlerz niedostepny mimo odkrytej technologii** — bramka byla poprawna (wymaga dostepu
    do Ceramiki), ale katalog budynkow NIGDY nie sprawdzal bramki surowcowej, wiec budynek
    dostawal status „gotowy" i znikal z sekcji „Jeszcze zablokowane" bez zadnego komunikatu.
    Dotyczylo OSMIU budynkow: Garncarnia, Stolarnia, Warsztat kamieniarski, Cegielnia, Kuznia,
    Mennica, Odlewnia brazu/Piec hutniczy, Spichlerz II.
- **Wiarygodnosc cywilizacji — etapy 2-4 wpiete w silnik**: rejestr zdarzen i strumienia
  przechodzacy przez zapis gry, kary N1-N7 (N1/N3 w jedynym wspolnym punkcie rozstrzygania
  potyczki, wiec parytet AI z konstrukcji), nagrody S1-S4/P1-P3/P4, oraz Dzwignia 1 —
  reputacja realnie wplywa na Zaufanie co ture (W/20, poza aktualnym przeciwnikiem wojennym).
  Przy okazji naprawiona atomowosc handlu cyklicznego: walidacja obu stron przed transferem,
  barter jako jedna para, wina liczona wylacznie stronie winnej.
- **Generator map — nowa kolejnosc krokow** (teren → rzeki → lasy → surowce). Zmiana parametrow
  lasu przestaje przestawiac losowanie gor i zloz. Naprawione pokrycie reliefu (test 2/6 → 6/6).
  Gorzystosc 19,16-20,58% (srednia 19,53%), determinizm i ujscia rzek bez zmian.
- **Bramki:** tsc 0 · logic 208/208 · ai 239/239 · wiarygodnosc 63/63 · spichlerz-widocznosc
  45/45 · army-merge-dismiss 16/16 · relief-grid-coverage 6/6 · world-density 31/31 ·
  zloto 43/43 · deposit-coast 20/20 · map-quality-forest-parity 101/101.
- **Znane, NIEROZWIAZANE:** `fair-play-grid-test` 3/8 — udowodniona sprzecznosc arytmetyczna
  miedzy progami testu (~10% sufitu gestosci) a decyzja 80A (gorzystosc 19,3%). Wymaga decyzji
  wlasciciela, nie poprawki kodu.

## ROBOCZA `2f928932` — 2026-07-26 17:05 · FALA 18: NEGOCJACJE NA ZYWO + MUZYKA — **ZASTĄPIONA**
- md5 (pelne): `2f9289326f96147eab74f7403d306924` · stempel: `ROBOCZA · <pre-stamp> · 2026-07-26 17:05`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- Zbudowane z czystego HEAD `a0847fd` w osobnym worktree. Trwajace prace (generator map,
  regresja cofania jednostek, blokada Spichlerza) **NIE** weszly do tego bundla.
- **Co nowego wzgledem `17ca0a4f`:**
  - **Negocjacje dyplomatyczne NA ZYWO** (R-DYP-NEGOCJACJE-NA-ZYWO) — po playtescie wlasciciel
    odrzucil model „propozycja czeka na ture AI". Teraz AI odpowiada natychmiast w tym samym
    oknie audiencji: przyjmuje, odrzuca albo kontruje; gracz odpowiada i domyka rozmowe na
    miejscu. Zadna regula silnika nie ruszona — zmienil sie wylacznie moment rozstrzygania.
    Naprawione przy okazji: przyjecie i odrzucenie nie odswiezaly okna audiencji; komunikaty
    mowia teraz, czego dotyczyla propozycja.
  - **Start muzyki w menu glownym** (R-MUZYKA-OPOZNIENIE) — utwor startuje po gotowosci
    odtwarzacza, ale nie wczesniej niz po 2500 ms (parametr menu.muzyka_opoznienie_startu_ms),
    wiec przegladarka nie scina juz poczatku. Dotyczy wylacznie pierwszego startu po wejsciu
    na strone.
- **Znane, jeszcze NIENAPRAWIONE w tym bundlu** (zgloszenia z playtestu, zlecenia w toku):
  jednostka bywa przenoszona w nieoczekiwane miejsce po zakonczeniu tury; Spichlerz
  niedostepny mimo odkrytej technologii.
- **Bramki:** tsc 0 · diplomacy-negotiation-table 39/39 · ai 239/239 · logic 208/208.

## ROBOCZA `17ca0a4f` — 2026-07-26 16:24 · FALA 17: DECYZJE ABC + PARYTET AI — **ZASTĄPIONA**
- md5 (pelne): `17ca0a4f3ed09a2daf955667a17cf4a1` · stempel: `ROBOCZA · f9125052 · 2026-07-26 16:24`
- **VERIFY OK.** `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- Zbudowane z czystego HEAD `3c17ce5` w osobnym worktree — praca nad generatorem map
  (nowa kolejnosc krokow) trwa i **NIE** weszla do tego bundla.
- **Co weszlo:**
  - **Stol negocjacyjny dyplomacji** (C-DYP-Q1=A) — propozycja nie jest juz rozstrzygana
    natychmiast, laduje na stole; AI odpowiada w swojej turze i moze zlozyc kontroferte
    (limit 3 rundy, waznosc 5 tur). Nowa kolumna „Oczekujace propozycje" w audiencji.
  - **Teren przy obronie miasta tylko z murem** (C-COMBAT-Q2) — miasto bez muru na wzgorzu
    ma 0% bonusu; przy okazji teren i budynki obronne SUMUJA sie w punktach procentowych,
    a nie mnoza (komplet na wzgorzu: 450%, bylo 675%).
  - **Bonus murow wylacznie do Obrony** we wszystkich trzech trybach walki (C-COMBAT-Q1);
    „Pomin" w ogole nie stosowalo murow.
  - **Weterani w bitwie „Auto"** — premia byla ignorowana w kazdym starciu AI-vs-AI
    i przy kazdym kliknieciu „Auto"; przyczyna byl cache fieldPower z eksportu danych.
  - **Teren w bitwie, trzy etapy** (C-TEREN-Q1=A) — Gory +75% Obrony, Delta Zasiegu
    (Las -1, Wzgorza +1 pola), konnica: Las x2 kosztu, Gory niedostepne.
  - **Glod armii** (C-GLOD-Q1=A, C-GLOD-Q2=B) — karencja 3 tury z odliczaniem w HUD,
    zuzycie x1,0 na wlasnym terytorium i x2,0 poza nim, atrycja dziala teraz TAKZE dla AI
    (dotad wylacznie dla gracza — AI mialo darmowa armie).
  - **Ufortyfikowana jednostka zjada polowe zywnosci** — parametr istnial od zawsze
    i byl martwy (flaga camping zahardkodowana na false).
  - **Realna fortyfikacja w polu, takze podczas oblezenia** — zeruje ruch, nie przerywa
    oblezenia, daje +2 pkt Obrony (ozywiony fortify_obrona_bonus). Dotad „Ufortyfikuj"
    poza wlasnym miastem zuzywalo ruch i nie robilo nic.
  - **Parytet AI** (C-AI-SUWAKI=A) — AI rusza suwakami zywnosci/Handlu/Pracy (dotad ani
    razu, przez cala partie), kara za wojne nalicza sie miastom AI (dotad tylko graczowi).
  - **Garnizon** (C-GARN-Q1=A + rozszerzenie) — jednostka ufortyfikowana byla PERMANENTNIE
    niesterowalna; trzy drogi wyjscia, w tym rozkaz ruchu z listy armii zdejmujacy
    fortyfikacje automatycznie.
  - **Odznaki weterana na zetonach** (decyzja 57) — zlote gwiazdki, 2 dla +10%, 3 dla +20%.
  - **Budynki** — 54a Baszta wymaga Murow, 54b Akwedukt wymaga Studni, Targowisko wg
    PYTANIE 20=A (Pieniadz 3->5 pkt, przyrost 2->3 pkt, martwy mnoznik skasowany).
  - **Wersja 0.9** takze na ekranie Nowej Gry (drugie, pominiete miejsce z „v0.1").
- **Bramki:** tsc 0 · logic 208/208 · ai 239/239 · combat 6/6 · battle-roster 7/7 ·
  weterani 55/55 · glod-wojska-karencja 39/39 · fortify-pole 25/25 · garnizon-exit 11/11 ·
  city-defense-terrain-gate 31/31 · structure-defense-bonus 8/8 · teren-walki-etapy 26/26 ·
  diplomacy-negotiation-table 39/39 · ai-slider 37/37 · war-happiness-parity 18/18 ·
  prereq-budynkow 59/59 · administracja-stolica 48/48 · happiness-breakdown 38/38.

## ROBOCZA `290a962b` — 2026-07-26 14:27 · FALA 16: PLAYTEST MACIEJA (10 napraw) — **ZASTĄPIONA**
- md5 (pelne): `290a962b077588ecbbaa1820fc470ae8` · stempel: `ROBOCZA · 69644b2d · 2026-07-26 14:27`
- **VERIFY OK.** Odswiezone: `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest (10 pozycji).
- Zbudowane z **czystego HEAD `6be1355`** w osobnym worktree — w drzewie roboczym trwaly
  rownolegle dwa zlecenia (teren w bitwie, bonus murow), wiec ich niedokonczone zmiany
  NIE trafily do bundla. Swiadoma decyzja, zeby playtest dostal wylacznie skonczone rzeczy.
- **Co weszlo (zgloszenia z playtestu 2026-07-26):**
  - **Trafianie w heks** (`R-RUCH-WZGORZA-2`) — 29,7% klikniec trafialo w zly heks (40,0% na
    wzgorzach i gorach). Przyczyna: `InstancedMesh.raycast()` odsiewa caly mesh po
    boundingSphere liczonej leniwie przy pierwszym raycascie i nigdy nieodswiezanej; mgla wojny
    zawezala ja do odslonietego skrawka na starcie gry. Plus martwa strefa 6 px w `camera.ts`
    (pan zaczynal sie od pierwszego piksela, klik ginal). Po poprawce 0,0%.
  - **Drzewko technologii** — Escape zamyka drzewko przed pelnym ekranem (Keyboard Lock API),
    przycisk `✕` zastapiony wysrodkowana pigulka „← Wroc · ESC".
  - **Panele lewej kolumny** — koniec nachodzenia na przyciski toolbara i na pasek chipow;
    jedno zrodlo offsetow (`ui/sidePanelLayout.ts`, 86 px / 104 px) dla szesciu paneli.
  - **Lista armii** — pasek ruchu niebieski, etykiety „Zdrowie 34/50" i „Ruch 3/3" nad paskami.
  - **Nowa jednostka** (C-TURA-Q1 = A) — jednostka gotowa na przelomie tur ma pelne punkty
    ruchu w tej turze (wczesniej 0 pkt i tracila cala ture) + kamera leci do niej.
  - **Panel surowcow** — wiersze dostepu (Ceramika, Sol, Kon) widoczne zawsze („masz"/„brak"),
    dolozone **Zloto** korzystajace z istniejacej bramki `ownerHasZlotoAccessNow`.
  - **Budynki stolica/region** — karta budynku nie pokazuje sie w miescie, w ktorym nigdy nie
    bedzie dostepny (blokada lokalizacji jest trwala, w odroznieniu od braku technologii).
  - **Model Wojownika (Kamien)** — trafial na stary model miecznika (`Typ = "Swordsman"`
    w `units.json`), nowy model Opus 5 byl martwym kodem. Widoczne glownie na miastach-panstwach.
  - **„Rozegraj ponownie"** — powtorka gubila panel fazy rozstawiania (jedna linia chowala
    `_rosterBar` tuz po jego zbudowaniu).
  - **Barbarzyncy** (C-BARB-Q1 = B) — realna relacja „wojna" i atak przez ta sama bramke co
    reszta AI, zamiast wyjatku. Zamkniety przeciek: barbarzyncy potrafili trafic do listy
    odkrytych cywilizacji i otworzyc audiencje dyplomatyczna.
  - **Liczby na paskach** — koniec `Skarbiec +6.600000000000005`; wspolny `signedPl()`,
    zaokraglenie WYLACZNIE prezentacyjne (silnik liczy dalej na pelnej wartosci).
- **Bramki:** tsc 0 bledow · picker-test 140/140 (nowy) · ai 239/239 · logic 208/208 ·
  combat 6/6 · battle-roster 7/7 · barbarians 148/148 · diplomacy-layers 14/14 ·
  administracja-stolica 48/48 · prereq-budynkow 46/46 · zloto-szlak 45/45 ·
  mennica-uspienie 47/47 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 ·
  map-gen: determinizm A=B PASS, 0 rzek bez ujscia PASS (progi czasowe FAIL — wydajnosc
  kontenera, nie regresja) · build vite + smoke OK.

## ROBOCZA `7c7ae9a0` — 2026-07-26 12:18 · FALA 15: SCALENIE OBU INTEGRATOROW — **ZASTĄPIONA**
- md5 (pelne): `7c7ae9a018b174425ff9e99698f286c9` · stempel: `ROBOCZA · 5755d741 · 2026-07-26 12:18`
- **VERIFY OK.** Odswiezone: `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + manifest.
- **TO PIERWSZY BUNDLE ZAWIERAJACY PRACE OBU INTEGRATOROW.** Do tej pory istnialy dwa rozne
  `gra-robocza/Gra-ROBOCZA.html` — jeden na `main` (drugi integrator), drugi na galezi
  `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (sesja chmurowa). Wlasciciel widzial tylko ten
  z `main`, wiec fale 12-14 sesji chmurowej NIGDY nie trafily do jego playtestu.
- **Z galezi main (drugi integrator):** naprawa suwaka lasu (40/60/80% — przyczyna byla
  zahardkodowanym sufitem 0,18 mniejszym od wszystkich progow, wiec tiery byly nierozroznialne),
  pasek w pelnym ekranie, tlo ikony dyplomacji, HP w liscie armii, dzwiek marszu jednostek,
  menu pauzy, koszt Murarstwa 28.
- **Z galezi sesji chmurowej (fale 12-14):** korupcja ozywiona (byla zahardkodowana na 0%),
  Pieniadz z budynkow i z konwersji Pracy do puli Daniny, domyslny podzial 20/60/20,
  nowa siatka Szczescia z kara ponizej 10%, Biblioteka +30%/Akademia +20%, Mennica tylko
  w stolicy + zasypianie bez zlota, zloto na szlakach, system weteranow, limit 10 heksow
  na skupisko gorskie przy gorzystosci 19,3%, 5 modeli jednostek wpietych, model Kopalni
  zlota, odznaki ulepszen na zetonach, bonus cudow zasilajacy Handel, nazewnictwo
  Danina/Podatek, Wyjdz w menu glownym, wersja 0.9.
- **KONFLIKT MERYTORYCZNY ROZSTRZYGNIETY PRZEZ WLASCICIELA:** obaj integratorzy wdrozyli
  decyzje 65B/66B niezaleznie. Maciej 2026-07-26: „ok twoja glebsza" — obowiazuje wersja
  sesji chmurowej. Powod widoczny w kodzie: bramka z `main` nie sprawdzala ani wymogu
  STOLICY (66B), ani dostepu do ZLOTA (83B).
- **Bramki po scaleniu:** tsc 0 bledow · logic 208/208 · combat 6/6 · currency 32/32 ·
  plony-budynkow 68/68 · korupcja 18/18 · praca-na-pieniadz 23/23 · zloto-szlak 45/45 ·
  weterani 47/47 · mennica-uspienie 47/47 · danina-podatek-nazwa 15/15 · tooltip-ui 13/13 ·
  cuda-handel 26/26 · szczescie-zamoznosc 60/60 · unit-replace 10/10 · dispatch-check OK.

<!-- ===== WPISY DRUGIEGO INTEGRATORA (galaz main) — doklejone przy scaleniu 2026-07-26 ===== -->

## ROBOCZA `c08b5fcc` — 2026-07-26 · naprawy UI z playtestu + lasy wg ustawienia — **AKTUALNA**

- **Pełny ekran naprawiony** — przyczyną paska u dołu NIE był element HUD, tylko canvas 3D zamrożony na rozmiarze z chwili startu (`renderer.setSize()` nadpisywał `canvas.style` pikselami, kasując 100%/100% z main.ts). Edge-pan wyłączał się, bo kursor wyjeżdżał poza obszar canvasu przed prawdziwą krawędzią. Fix w `render/scene.ts` (updateStyle=false + nasłuch `fullscreenchange`). **Efekt uboczny: naprawia też skalowanie przy zwykłej zmianie rozmiaru okna.**
- **Dyplomacja** — niebieskie kwadratowe tło pod godłem państwa → obramówka w tym samym kolorze (`.dip-pennant`, jeden wspólny komponent = poprawione w liście relacji i toolbarze naraz).
- **Lista armii** — dograne HP (suma stosu), widać ranne armie bez wchodzenia w każdą.
- **Modal „CO WYBIERASZ?"** — populacja miasta i % HP jednostki na kaflach.
- **LASY wg ustawienia w kreatorze** — suwak „Las" wreszcie działa: **Mało 38% · Normalnie 58% · Dużo 77%** (było ~15% niezależnie od wyboru). Przyczyna: zahardkodowany cap `0.18` dominował nad parametrem tierów; wyniesiony do `FOREST_OVERLAY_CAP_FRAC=0.95`. Zero nowego kodu, tylko istniejące wartości. ⚠️ Przy „Mało" ryzyko startu bez lasu w promieniu 5 NADAL istnieje (mechanizm gwarancji świadomie niedodany).
- **Bramki:** tsc=0 · map-gen-regression PASS (determinizm) · combat 6/6 · tech-tree 19/0 · research 33/33 · unit-replace 10/10.
- Commity: `f4f6dd9` (4 naprawy UI), `b2f48bc` (lasy).

## ROBOCZA `076e3c0b` — 2026-07-26 · uwagi z playtestu Macieja (BEZ lasów)

- **Zawartość:** dźwięk marszu jednostek (nowy 4. kanał SFX mapy, synteza 0 MB, skalowany wielkością armii, cisza za mgłą wojny, przełącznik „Odgłosy jednostek") · przycisk PEŁNEGO EKRANU w HUD (funkcji wcześniej nie było) · „Podział handlu" → **Danina** / po Mennicy **Podatek** · Murarstwo 5→28 (długa gra 20→112, jak przed 24.07).
- **CELOWO BEZ LASÓW:** commit `e4c3e33` (pokrycie 14→83% + wymóg lasu przy starcie) **wycofany** rewertem `9a86e42` — Maciej: „będziemy je zmieniać inaczej". Praca zachowana w historii, do ponownego użycia.
- **Bramki:** tsc=0 · map-gen-regression PASS · combat 6/6 · tech-tree 19/0 · research 33/33.
- Commity: `0645e92` (Murarstwo+Danina+pełny ekran+dyspozycje), `bfa51c0` (marsz), `9a86e42` (revert lasów).

## ROBOCZA `b1f16a59` — 2026-07-25 · FALA 10.1: fix błędnego „mnożnika" Pałacu

- **Zawartość:** cała FALA 10 (patrz niżej) **+ poprawka danych**: trzy tiery Pałacu miały w `baza.mnoznik` wartość równą DOKŁADNIE swojej kulturze (5/5, 8/8, 11/11, przyrost 0) — pomyłka przy wpisywaniu danych, wykryta przy weryfikacji z Maciejem. Pole `mnoznik` NIE jest konsumowane przez silnik ekonomii (czytane tylko do wyświetlenia chipa „×5 mnożnik" w panelu miasta), więc karta Pałacu obiecywała bonus, którego gra nie stosuje. Wyzerowane dla `palac`/`palac_ii`/`palac_iii` — chip znika, realne bonusy (kultura + zadowolenie, które silnik faktycznie liczy) bez zmian.
- **Potwierdzone przez Macieja koszty i bonusy Pałacu:** I (Kamień) 8 drewna / 40 pracy · kultura 5 (+3/poz.), zadowolenie 2 (+1/poz.) — II (Brąz) 8 drewna+8 kamienia / 60 pracy · kultura 8 (+5), zadow. 3 (+2) — III (Żelazo) 8 drewna+8 kamienia+6 cegły / 90 pracy · kultura 11 (+7), zadow. 5 (+2). Maks. poziom 10, ulepszane kolejno I→II→III.
- **Bramki:** tsc 0 · tech-tree 19/19 · VERIFY OK.
- **md5:** `b1f16a595b17a2cb37955cc8de4b2fc8` · pieczątka `b1f16a59`. Zastępuje `99837b91`.
- **ZNANY DŁUG (do decyzji):** pozostałe 11 budynków też ma niezerowy `mnoznik` (kuźnia 5, karawanseraj 8, koszary 5, wielka kuźnia 23, akademia wojskowa 20, warsztat oblężniczy 10, akademia 10, pretorium 5, lazaret 5, kuźnia żelaza 8, targowisko +3/poz.) — tam wartości NIE są duplikatem kultury (wyglądają na zamierzoną, ale NIGDY NIEZAIMPLEMENTOWANĄ mechanikę). Silnik ich nie konsumuje. Do rozstrzygnięcia: zaimplementować mnożnik jako realną mechanikę czy usunąć z kart.


<!-- ===== WPISY SESJI CHMUROWEJ (galaz claude/sprawdzenie-funkcjonalnosci) ===== -->
## ROBOCZA `3cf111ce` — 2026-07-26 06:02 · FALA 14: jednostki Brazu wpiete + bonus cudow zasila Handel — **AKTUALNA**
- md5 (pelne): `3cf111ced9515fe4263cde7a75ddc692` · stempel z menu: `ROBOCZA · 8c897b6c · 2026-07-26 06:02`
- Odswiezone: `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + `ROBOCZA-MANIFEST.json`. **VERIFY OK.**
- **Co weszlo:**
  - **PIEC MODELI JEDNOSTEK WPIETYCH** (dotad istnialy w repo, ale zaden zywy kod ich nie
    importowal): Wlocznik, Wojownik z mieczem i tarcza, Procarz, Rydwan (woly) — wszystkie
    epoka Brazu — oraz Hastati (epoka Zelaza, Rzym; model zastapil wczesniejszy
    z `hastati-falangita.ts`).
    - **Poprawka Wlocznika przed wpieciem:** wysokosc **0,999 -> 0,870 x HEX_R** (byl o jedna
      trzecia wyzszy od reszty serii i odstawal jak tyczka); tarcza przeniesiona z nadgarstka
      przy biodrze na srodek przedramienia, kryje tors od pasa po bark.
    - **SPROSTOWANIE:** w meldunku FALA 13 napisalem, ze wlocznia siega 0,999 w POZIOMIE
      i wchodzi na sasiednie pola. To byla moja bledna interpretacja pomiaru — 0,999 bylo
      WYSOKOSCIA, maks. promien poziomy wynosil 0,321 przy limicie 0,866.
    - Dopasowanie do jednostek po PELNEJ nazwie, nie po fragmencie. Nowy test
      `wpiecie-dispatch-check` 14/14 ma piec asercji NEGATYWNYCH potwierdzajacych, ze warianty
      kulturowe (Wlocznik sumeryjski, Procarz (Huaracoc), Rydwan egipski, Tyrski miecznik,
      Miecznik galijski) zachowaly wlasne modele.
  - **Bonus cudow `handel_procent` ozywiony** (decyzja wlasciciela 2026-07-26: „handel nie
    danine"). Dotad ZADEN kod go nie konsumowal — czwarta martwa obietnica w tym projekcie.
    Zasila **Handel**, czyli dochod z tras handlowych z obcymi cywilizacjami, a **NIE Danine**
    (dochod miasta oddawany wladcy). Piec cudow: Petra 0,15 · Kamien Ha'amonga 0,15 ·
    Kolos Rodyjski 0,20 · Brama wszystkich narodow 0,15 · Palac Weiyang 0,15.
    Kumulacja **addytywna** (spojnie z premiami budynkow i redukcja korupcji).
    Teksty w Poradniku i encyklopedii poprawione.
- **Bramki:** tsc 0 bledow · logic 208/208 · combat 6/6 · unit-replace 10/10 ·
  wpiecie-dispatch-check 14/14 (NOWY) · cuda-handel 26/26 (NOWY) · trade-grant 60/60 ·
  zloto-szlak 45/45 · currency 32/32 · mennica-uspienie 47/47 · danina-podatek-nazwa 15/15.
- **DO OGLEDZIN WLASCICIELA — dwa zastrzezenia integratora do wpietych modeli:**
  1. **Rydwan (woly) nie czyta sie jako rydwan** pod katem kamery 52 stopni — wyglada jak
     stojaca postac, nie widac ani zaprzegu, ani wozu.
  2. **Procarz jest wyraznie drobniejszy od reszty i nie widac u niego procy** — ta sama wada
     wracala juz trzy razy (proca czytana raz jako pochodnia, raz jako sztywny prostokat).
  Oba przechodza wszystkie pomiary (mieszcza sie w obrysie, stopy na y=0), ale pomiar
  to nie to samo co czytelnosc.

## ROBOCZA `9fc91af8` — 2026-07-26 00:12 · FALA 13: nazewnictwo Danina/Podatek, Mennica ze zlotem, odznaki i Kopalnia zlota — **ZASTAPIONA** (-> `3cf111ce`)
- md5 (pelne): `9fc91af8bec6561fd6d2d2afa4bf2e95` · stempel z menu: `ROBOCZA · c06affa9 · 2026-07-26 00:12`
- Odswiezone: `Gra-ROBOCZA.html` + 6 bundli PLAYTEST + `ROBOCZA-MANIFEST.json`. **VERIFY OK.** 34 250 545 B.
- **Co weszlo (decyzje 55B, 57, 65B, 66B, 81A, 82A, 83B + dlugi techniczne):**
  - **Zmiana nazwy Handel -> Danina -> Podatek.** Jeden wspolny modul `game/danina-nazwa.ts`
    rozstrzyga nazwe; przelacza na **Podatek** dla CALEJ cywilizacji dopiero gdy Waluta odkryta
    ORAZ Mennica stoi **w stolicy**. Strumien z tras handlowych swiadomie zostaje **Handlem**.
    Objelo tez **plon pojedynczego heksu** (decyzja 81A) — tooltip przelacza sie dynamicznie.
  - **Mennica zasypia po utracie dostepu do zlota** (83B): mnoznik Daniny wraca do x1,0,
    nazwa wraca na Danine. Budynek NIE jest burzony i budzi sie sam po odzyskaniu dostepu.
    Panel miasta mowi graczowi, DLACZEGO Mennica nie dziala i co zrobic.
  - **Odznaki ulepszen budynkowych na zetonach** (57 A+B): kropki przy podstawie + kolorowa
    obwodka; skala wyprowadzona z realnych maksimow (Pancerz 45 pkt proc. + Parametry 50 =
    95, trzy tercje: granice 31 i 63). Wizualnie odrozniane od gwiazdek weterana (kule przy
    podstawie vs bryly nad glowa; zloto zarezerwowane dla weterana).
  - **Wlasny model 3D Kopalni zlota** — koniec reuzycia Kopalni miedzi. Odkrywka z plytkim
    szybem, trojnog z koszem, rynna pluczkowa z runem owczym, sadzawka, misa batea.
    Po rundzie korekty czyta sie jako ZLOTO takze w skali mapy (weryfikacja na renderze
    200x200 px, czyli tyle pikseli, ile pole naprawde dostaje w grze).
  - **Pole `odblokowuje` ozywione** (55B): koniec hardkodu `id === 'mury'`, flagi czytane
    z danych. Trzy flagi (maFort/maBaszta/maWarsztatOblezniczy) zostaja jako **rezerwa**
    (decyzja 82A) — jawnie udokumentowana, zeby nikt nie usunal ich jako martwego kodu.
  - **Stala przepustowosci szlaku** przeniesiona do `econ-params.json`
    (`handel_szlaki.handel_ilosc_na_ture_na_szlak` = 4 sztuki surowca na ture na szlak).
  - **Martwy kod usuniety**: `buildingEffectAtLevel`, `formatYieldLine`, `ICON_LABELS_PL`.
  - **Dokumentacja doprowadzona do kanonu**: Poradnik gracza i encyklopedia — 50 wystapien
    zmienionych na Danine (74 swiadomie zostawione jako Handel), przykłady liczbowe
    przeliczone z 70/20/10 na **20/60/20**, dopisane cztery reguly, ktorych Poradnik
    w ogole nie opisywal (korupcja, Mennica/Podatek, pula Daniny z budynkow, weterani).
    Opisy bonusow 5 cywilizacji mowia wreszcie o Daninie, a nie o zlocie z handlu.
- **Bramki:** tsc 0 bledow · logic 208/208 · combat 6/6 · currency 32/32 · plony-budynkow 68/68 ·
  korupcja 18/18 · praca-na-pieniadz 23/23 · zloto-szlak 45/45 · weterani 47/47 ·
  mennica-uspienie 47/47 (NOWY) · mennica-magazyn 41/41 · danina-podatek-nazwa 15/15 (NOWY) ·
  danina-podatek-tooltip-ui 13/13 (NOWY) · szczescie-zamoznosc 60/60 · society-breakdown 40/40 ·
  upgrade-budynki 48/48 · deposit-building-gate 34/34 · trade-grant 60/60.
- **Co NIE weszlo:** 5 modeli jednostek Brazu (istnieja, NIEWPIETE — czekaja na ogledziny
  wlasciciela, material w `dyspozycje/podglad-modeli-braz/`), pomiar FPS, panele Excel.
- **DO OGLEDZIN NA PLAYTESCIE:** (1) czy mapa nie jest za drobno cetkowana po limicie
  10 heksow na skupisko; (2) nowe liczby w panelu miasta — trzy strumienie przestaly omijac
  suwak, wiec Skarbiec dostaje mniej niz dotad, a Nauka i Zamoznosc wiecej.
- **ZNALEZISKO DO DECYZJI:** cuda o bonusie typu `handel_procent` (`wonders.json`) — typ
  NIGDZIE nie jest konsumowany przez kod. Kolejna martwa obietnica; nie wiadomo, czy mialy
  zasilac Danine czy Handel.

## ROBOCZA `0f9ce758` — 2026-07-25 22:33 · FALA 12: domknięcie ekonomii (Danina/korupcja/Mennica), złoto na szlakach, weterani, limit skupisk górskich — **AKTUALNA**
- md5 (pełne): `0f9ce758973fb53490fb79fdecda7bc7` · stempel z menu: `ROBOCZA · 9600d931 · 2026-07-25 22:33`
  (stempel nosi md5 pliku SPRZED wstrzyknięcia stempla — tak jak poprzednie wydania; manifest i VERIFY
  operują na md5 pliku finalnego `0f9ce758`)
- Odświeżone: `Gra-ROBOCZA.html` + 6 bundli PLAYTEST (MAPA, MIASTO, OBLEZENIE-3v3, ODSKOK-OBLEZENIE,
  ODSKOK, WALKA) + `ROBOCZA-MANIFEST.json`. **VERIFY OK.** Rozmiar 34 240 798 B.
- **Co weszło (decyzje właściciela 63, 67B, 73–80):**
  - **Korupcja ożywiona** — dotąd zahardkodowana na 0% w obu miejscach liczących ekonomię tury. Obciąża
    **wyłącznie Daninę/Podatek, NIE Pracę**. Współczynniki obniżone o 50%: dystans 0,5/1/1,5 pkt proc. straty
    na pole od stolicy, liczba miast 0,5/0,5/1 pkt proc. na miasto (easy/normal/hard). Sufit 38/50/62% bez zmian.
    Sąd, Pretorium i Pałac redukują po 30 pkt proc., addytywnie (realne maksimum 60 pkt proc.).
  - **67B — Pieniądz z budynków wchodzi do puli Daniny**, nie wprost do skarbca (budynek 60 pkt Pieniądza/turę:
    było Skarbiec 60/Nauka 0/Zamożność 0, jest 36/12/12 przy suwaku 20/60/20).
  - **76B + korekta właściciela — konwersja Pracy na Pieniądz** (Targowisko + Waluta) wchodzi do Daniny
    **u źródła** i przechodzi przez wszystkie mnożniki handlu, łącznie z Walutą i Mennicą.
  - **74A — domyślny podział Daniny nowego miasta 20% Nauka / 60% Skarbiec / 20% Zamożność** (było 20/70/10);
    poprawione TRZY źródła tej wartości (econ-params.json, game/cities.ts, ui/cityPanel.ts).
  - **Nowa siatka Szczęścia od udziału Zamożności** — 10 przedziałów po 10 pkt proc., z KARĄ poniżej 10%
    (easy +1…+10, normal −1…+8, hard −2…+7 pkt Szczęścia/turę). Usunięty stary mechanizm „wysokie podatki",
    który dublował karę.
  - **75C — premia Biblioteki do Nauki miasta 0,37/0,30/0,23**, premia Akademii **0,25/0,20/0,15** (łącznie ×1,50
    na normalnym; było ×1,60 przy odwróconej logice, gdzie tańsza Biblioteka dawała 5× więcej niż Akademia).
  - **66B/71A — Mennica tylko w stolicy**, mnożnik działa na całe imperium; mnożnik cywilizacji z `civs.json`
    = poziom normal, easy +0,5 / hard −0,5. **Naprawiony rozjazd panel/silnik** (Fenicjanie: panel ×2,6,
    silnik ×1,5 — silnik w ogóle nie czytał mnożnika cywilizacji).
  - **77A — złoto na szlakach handlowych jako surowiec typu „dostęp"** (jak koń, bez przepływu sztuk do
    magazynu). Bez tego cywilizacja bez złoża złota nigdy nie zbudowałaby Mennicy.
  - **78 — system weteranów** (trzeci system rozwoju jednostek): poziom 1 = statystyki z JSON, poziom 2 po
    1. przeżytej bitwie +10%, weteran po 2. bitwie +20%; pancerz wyłączony; Morale ucieczki i Próg dezercji
    **obniżane** ×0,90 / ×0,80.
  - **63 + 80A — limit 10 heksów Gór i 10 heksów Wzgórz w spójnym skupisku** przy przywróconej górzystości
    lądu 19,3% (największe skupisko: 218 → 10 heksów; pokrycie złóż mapa Ziemia z powrotem 75%).
  - **61A/64A — usunięty martwy kod** testowej bitwy (ok. 260 linii, `battle-smoke.cjs`, `facing.ts`,
    `launchTestBattle`).
- **Bramki:** tsc 0 błędów · logic 208/208 · combat 6/6 · currency 32/32 · plony-budynkow 68/68 ·
  korupcja 18/18 · praca-na-pieniadz 23/23 · zloto-szlak 45/45 · weterani 47/47 · szczescie-zamoznosc 60/60 ·
  society-breakdown 40/40 · determinizm generatora PASS (hash A=B), 775/775 rzek z ujściem do realnego morza.
- **Co NIE weszło:** zmiana nazwy Handel→Danina→Podatek (65B/66B, 204 wystąpienia w UI), ożywienie pola
  `odblokowuje` (55B), odznaki ulepszeń na żetonach (57 A+B), 5 modeli jednostek Brązu (istnieją, niewpięte),
  własny model 3D Kopalni złota.
- **DO OGLĘDZIN:** rozkład skupisk Gór (5 map): 953 skupiska 1–2 heksowe, 111 po 3–5, 38 po 6–8, 70 po 9–10.
  Mapa może wyglądać „cętkowanie" — rozsypane pojedyncze szczyty pochodzą z szumu reliefu, nie z limitu.

## ROBOCZA `98b1403a` — 2026-07-25 · FALA 11.1: przywrócony wymóg kolejności budowania — **ZASTĄPIONA** (→ `0f9ce758`)

- **Wymóg „najpierw poprzednik" wrócił.** Likwidacja „awansu bocznego" (FALA 11) usunęła pole `upgradeFrom`
  z czterech par budynków, a **razem z nim zniknął wymóg kolejności budowania** — dało się postawić Akademię
  w mieście, które nigdy nie miało Biblioteki. Dopisane do `CITY_BUILDING_PREREQ`:
  Akademia ← Biblioteka · Cytadela ← Mury · Akademia wojskowa ← Koszary · Świątynia ← Kamienne kręgi.
- **FIX pre-istniejącej luki:** `eraBuildingCatalog` w ogóle nie sprawdzał prerekwizytu budynkowego, więc budynek
  zablokowany brakiem poprzednika **znikał z panelu bez żadnego komunikatu**, zamiast trafić do sekcji
  „Jeszcze zablokowane" z tekstem „🔒 Wybudowana Biblioteka w tym mieście". Dotyczyło to również Warsztatu
  oblężniczego i Łaźni publicznej, czyli było widoczne dla gracza już przed dzisiejszymi zmianami.
- **Bramki:** tsc 0 · nowy prereq-budynkow 42/42 · grupy-budynkow 80/80 · koszty-surowcowe 117/117 ·
  plony-budynkow 47/47 · unit-building-bonuses 76/76 · administracja-stolica 48/48 · prawo-palac-tier 30/30 ·
  society-breakdown 40/40 · logic 208/208 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · VERIFY OK.
- **md5:** `98b1403ac94d335015e5c28411155909` · pieczątka `98b1403a`. Zastępuje `dd1ec38e`.
- **Nie weszło:** modele jednostek epoki Brązu (Włócznik, Miecznik, Procarz, Rydwan na wołach) — pliki istnieją
  w repo, ale **NIE są wpięte do dispatchu**, bo właściciel ocenił serię jako uwstecznienie. Praca przeniesiona
  na subagentów Opus 5 i przerwana na jego prośbę (limit). Gra renderuje te jednostki starymi modelami.

## ROBOCZA `dd1ec38e` — 2026-07-25 · FALA 11: przebudowa systemu budynków + naprawa martwych plonów — ZASTĄPIONA

- **KRYTYCZNA NAPRAWA — plony budynków nigdy nie docierały do silnika.** `cityYieldPerTurn()` była wołana
  z **pustą tablicą budynków** we wszystkich trzech miejscach (`turn-economy.ts` preview i advance,
  `cityPanel.ts` „Bilans plonów"). Od 2026-07-09 **żaden budynek nie dawał Pracy, Pieniądza, Żywności,
  Nauki ani Kultury** — całą gospodarkę niosło wyłącznie pole wokół miasta. Zmierzony skutek naprawy
  (miasto Żelaza, pełna zabudowa): Praca 12→**78**, Pieniądz 8→**98**, Nauka 2→**21**, Kultura 0→**36**,
  Żywność 2→**8**. Zadowolenie NIE dubluje się — pole z tej funkcji nigdy nie było propagowane dalej,
  żywym kanałem pozostaje `sumBuildingHappinessFromBuiltIds`; asercja regresyjna dopisana.
- **Model awansu budynków rozdzielony na dwa rodzaje** (decyzja Macieja):
  **w górę** (następca kasuje poprzednika, stała wartość per tier, `maksPoziom: 1`): Pałac I/II/III ·
  Dom Starszyzny→Dwór Zarządcy→Pretorium · Kuźnia brązu→Kuźnia żelaza→Wielka Kuźnia · Spichlerz→Spichlerz II ·
  Port handlowy→Port wielki · Piec hutniczy→Odlewnia żelaza;
  **w bok** (oba stoją obok siebie, wartości rozdzielone żeby nie liczyć podwójnie): Mury+Cytadela+Baszta ·
  Biblioteka+Akademia · Koszary+Akademia wojskowa · Kamienne kręgi+Świątynia.
  Rozdzielone: Akademia nauka 9→6 i kultura 7→5, Akademia wojskowa praca 5→3, Świątynia kultura 3→2 i zadow. 3→2.
- **Panel miasta: osiem grup dziedzinowych** zamiast płaskiej listy 39 budynków (Prawo i administracja ·
  Wojsko i obrona · Handel i pieniądz · Nauka i kultura · Wiara · Zdrowie · Produkcja surowców · Żywność).
  Przypisanie grupy jest **danymi**, nie hardkodem UI.
- **Stolica kontra regiony:** Pałac I/II/III wyłącznie w stolicy, nowy łańcuch **Dom Starszyzny → Dwór Zarządcy →
  Pretorium** wyłącznie poza stolicą, Trybunał i Sąd wszędzie. **FIX pre-istniejącego buga:** budynki z pustym
  `techUnlock` nie miały obsługi znacznika pustego, przez co **Pałac nigdy nie pojawiał się na liście produkcji**.
- **Prawo — nowa siatka** (pkt Prawa, łatwy/normalny/trudny; skala Kamień 50 = 100%, Brąz 75, Żelazo 100):
  Pałac I 45/35/28 · Pałac II 58/45/36 · Pałac III 71/55/44 · Dom Starszyzny 36/28/22 · Dwór Zarządcy 43/33/26 ·
  Pretorium 50/38/31 · Trybunał 22/17/13 (wcześniej NIE był wpięty w Prawo) · Sąd 25/19/16.
  Zasada: Pretorium = 70% Pałacu III, Dwór Zarządcy 60%, Dom Starszyzny 50%, Sąd 50% Pretorium.
- **Obrona miasta:** nowy budynek **Baszta** (+100%). Mury 200% + Cytadela 100% + Baszta 100% = **400%**.
  Arytmetyka scalona w jednej funkcji `city-defense.ts` dla mapy świata i bitwy interaktywnej
  (wcześniej dublowana osobno w `main.ts` i `battleScene.ts`).
- **Dwie ścieżki ulepszeń jednostek z budynków:** Pancerz (Kuźnia brązu 15% → Kuźnia żelaza 30% → Wielka
  Kuźnia 45%, suma po łańcuchu) i parametry miękkie (Koszary 20 + Akademia wojskowa 20 + Warsztat oblężniczy
  10 = 50%). Jednostka pamięta **najlepsze odwiedzone własne miasto**, bonus trwały, parytet AI.
- **Koszty surowcowe wg epok:** Kamień = drewno (wyjątek: Kamienne kręgi i Stela na kamieniu), Brąz =
  drewno+kamień, Żelazo = drewno+cegła (obrona i port: drewno+kamień). **Brąz i żelazo jako surowiec budowlany
  usunięte z całej gry.** Powód: cegła powstaje tylko z gliny, a glina tylko przy rzece — sześć budynków Brązu
  i wszystkie Żelaza były nieosiągalne dla cywilizacji bez rzeki.
- **Cegła wchodzi na szlaki handlowe** (obok brązu, żelaza, koni). Uwaga: budynki pobierają cegłę **ilościowo**
  z puli cywilizacji, a szlak przekazuje **dostęp**, więc do pełnego zadziałania decyzji brakuje jeszcze bramki
  po stronie budynków — do rozstrzygnięcia z Maciejem.
- **Usunięte z gry:** Karawanseraj (anachronizm — budynek średniowieczny w Brązie), Ratusz (martwy parametr
  Prawa bez budynku; wróci jako szczebel po Pretorium w średniowieczu). Wcześniej tej doby: Lazaret.
- **Jednostki:** **Łucznik nubijski** (Brąz, Egipt — zasięg 5, atak dystansowy 7, 16 pocisków, 50 zdrowia,
  ruch 3) z **dedykowanym modelem 3D** (84 mesh / 1052 tri, długi łuk self-bow, ciemna karnacja, pióro strusia).
  Wpięte modele Opus 5 łuczników Egiptu i Sumeru. Tarcza Zulu przeskalowana z 2,07 na 1,49 wysokości tułowia.
- **Naprawa generatora map:** ścieżka „fair play" wymuszała glinę na heksie bez rzeki, łamiąc własną regułę —
  `logic-test.cjs` wrócił z 207/208 na **208/208**.
- **Bramki:** tsc 0 · koszty-surowcowe 117/117 (nowy) · grupy-budynkow 80/80 (nowy) · plony-budynkow 47/47 (nowy) ·
  unit-building-bonuses 76/76 · administracja-stolica 48/48 (nowy) · prawo-palac-tier 30/30 (nowy) ·
  society-breakdown 40/40 · logic 208/208 · upkeep 58/58 · building-happiness 8/8 · tech-tree 19/19 ·
  research 33/33 · unit-replace 10/10 · combat 6/6 · post-battle-map 25/25 · VERIFY OK.
- **md5:** `dd1ec38e0b277765e710e6ae48601b73` · pieczątka `dd1ec38e`. Zastępuje `b1f16a59`.
- **UWAGA DO PLAYTESTU:** ekonomia zmieniła się skokowo (patrz naprawa plonów) — to jest główna rzecz do ogrania.
  Stare zapisy wczytają się, ale miasta z Akademią bez Biblioteki dostaną mniej Nauki, a budynki z łańcuchów
  „w górę" spadną do wartości jednego poziomu.

## ROBOCZA `b1f16a59` — 2026-07-25 · FALA 10.1: fix błędnego „mnożnika" Pałacu — ZASTĄPIONA

- **Zawartość:** cała FALA 10 (patrz niżej) **+ poprawka danych**: trzy tiery Pałacu miały w `baza.mnoznik` wartość równą DOKŁADNIE swojej kulturze (5/5, 8/8, 11/11, przyrost 0) — pomyłka przy wpisywaniu danych, wykryta przy weryfikacji z Maciejem. Pole `mnoznik` NIE jest konsumowane przez silnik ekonomii (czytane tylko do wyświetlenia chipa „×5 mnożnik" w panelu miasta), więc karta Pałacu obiecywała bonus, którego gra nie stosuje. Wyzerowane dla `palac`/`palac_ii`/`palac_iii` — chip znika, realne bonusy (kultura + zadowolenie, które silnik faktycznie liczy) bez zmian.
- **Potwierdzone przez Macieja koszty i bonusy Pałacu:** I (Kamień) 8 drewna / 40 pracy · kultura 5 (+3/poz.), zadowolenie 2 (+1/poz.) — II (Brąz) 8 drewna+8 kamienia / 60 pracy · kultura 8 (+5), zadow. 3 (+2) — III (Żelazo) 8 drewna+8 kamienia+6 cegły / 90 pracy · kultura 11 (+7), zadow. 5 (+2). Maks. poziom 10, ulepszane kolejno I→II→III.
- **Bramki:** tsc 0 · tech-tree 19/19 · VERIFY OK.
- **md5:** `b1f16a595b17a2cb37955cc8de4b2fc8` · pieczątka `b1f16a59`. Zastępuje `99837b91`.
- **ZNANY DŁUG (do decyzji):** pozostałe 11 budynków też ma niezerowy `mnoznik` (kuźnia 5, karawanseraj 8, koszary 5, wielka kuźnia 23, akademia wojskowa 20, warsztat oblężniczy 10, akademia 10, pretorium 5, lazaret 5, kuźnia żelaza 8, targowisko +3/poz.) — tam wartości NIE są duplikatem kultury (wyglądają na zamierzoną, ale NIGDY NIEZAIMPLEMENTOWANĄ mechanikę). Silnik ich nie konsumuje. Do rozstrzygnięcia: zaimplementować mnożnik jako realną mechanikę czy usunąć z kart.

## ROBOCZA `99837b91` — 2026-07-25 · FALA 10: bugi bitwy + picking + 7 decyzji ABC Macieja — ZASTĄPIONA

- **Zawartość:** (commity `426e587`..`b172d9c`, na `546b0c8`) — dwie duże części:
  **(A) Playtest + audyt sterowania bitwą (12 poprawek):** ROOT-CAUSE **pickingu** — klik trafiał tylko płaski pryzm heksu / model sąsiada, stąd „raz działa raz nie", „zaznacza się inna jednostka", „nie da się ruszyć pojedynczej z grupy", „łucznik nie wchodzi za linię" (mapa: bryły wzgórz w `terrainPickMeshes`; bitwa: `_pickGroundTile` dopasowuje realną wysokość kafla, raycast honoruje trafienie tylko zgodne z kaflem) · liczniki typów jednostek · imiona/portrety władców (było zawsze „Minos/grecy") · usunięty chrome górnych pasków deploy · „START WALKI" nie zostaje osierocony po bitwie · szyk piechota/dystans · karty rosteru (ikona klasy + nazwa spod pasków) · numeracja grup = najniższy wolny (G1→G1, nie G3) · powtórka bitwy nie gubi rozgrupowania · panel armii znika pod dialogiem bitwy · paski strat po walce · barbarzyńcy z własnym sygnetem.
  **(B) Decyzje ABC Macieja (7 zadań):** edge-pan zawsze aktywny · „Formacja" na zaznaczony zakres (jednostka/grupa/armia) · **nowa pula 10 imion władców per cywilizacja** (150 imion, osobne imię per właściciel — koniec dwóch „Minosów") · **UI kolejki badań do 3 tech** (panel „Plan badań", drag&drop, numerki w hubie i drzewku) · **Sentry z auto-budzeniem** na wroga w polu widzenia · **C-FLANK: kierunek natarcia front/bok/tył** w auto-odgrywaniu (jednostki obchodzą wroga BFS-em) · **koszyk-traktat**: słodziki (złoto/surowce) doliczane do decyzji AI przy traktatach + transfer przy akceptacji.
  **Plus wcześniej tej doby:** sól na lądzie przy wybrzeżu (działa na mapie Ziemia) · glina tylko przy rzece · realne bramki 7 budynków + czysta bramka epoki (naprawiony bug blokady budynków) · kamieniołom i kopalnie nie spłaszczają wzgórza · ranking Mocy z pozycją absolutną („jesteś X. z N") + fix niespójności Mocy · żeton Handel · dwuetapowa dyplomacja.
- **Bramki:** tsc 0 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · post-battle-HP 25/25 · battle-roster 7/7 · deposit-coast 20/20 · determinizm mapy PASS (hash `66949c60`) · VERIFY OK.
- **md5:** `99837b91d987752cc19c3311115a0320` · pieczątka `99837b91`. Bundel 34 MB. Zastępuje `084d3827`.
- **Do strojenia w playteście:** przelicznik słodzika dyplomatycznego (25 PN = 1 pkt ease, sufit 20) — PLACEHOLDER.

## ROBOCZA `084d3827` — 2026-07-24 · FALA 9: seria uwag przeglądowych + FIX blokera Pałacu — ZASTĄPIONA

- **Zawartość:** (commity `e49211c`..`7a72b0c`, na `d1f2a49`) — 8 poprawek z playtestu Macieja:
  1. **FIX blokera Pałacu** — bramka B-SUROW-BUD spełniona też ZAPASEM puli państwa (nie tylko aktywnym źródłem); Pałac (i inne budynki epoki) budowalne mimo braku źródła, gdy masz surowiec w puli. Dokładną ilość egzekwuje `koszt_surowce`. Parytet AI (auto-build ctx).
  2. Podgląd startu (kreator) = tylko parametry, bez prozy.
  3. Klik żetonu dochodu (Nauka/Skarbiec/Praca/Religia/Żywność) = tylko jego wiersz.
  4. „Zaopatrzenie" → „Armia" (żywność armii + ludność + rekruci).
  5. Drzewka tech: usunięte stare (niebieskie), „graf epok" → „Drzewo technologii".
  6. Karta budynku: sekcje „Daje" (bonusy) vs „Wymagane" (surowce + dostęp).
  7. Wyrąb: plon 5 Drewna do puli państwa (koszt 5 Pracy zostaje).
- **Bramki:** tsc 0 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · VERIFY OK.
- **md5:** `084d3827d9e569a766e55b0ea6066b01` · manifest. Pieczątka `af64e799` (one-iter quirk). Bundel 34 MB. Zastępuje `0de2599c`.

## ROBOCZA `0de2599c` — 2026-07-24 · stash merge + FALA 8 + B-PALAC-TIER + B-RESEARCH-COST — ZASTĄPIONA

- **Zawartość:** FALA 8 zachowana (blokada 1. miasta · UI surowców · kamień współistnieje · Civpedia · mapa Ziemia) **+** sesja lokalna ze stash: (1) **B-PALAC-TIER** — `palac`→`palac_ii`→`palac_iii`, bramki drewno / drewno+kamień / drewno+kamień+cegła, bonus +50%/tier, `cityHasPalacLine()`; (2) **B-RESEARCH-COST-MODEL** — `GLOBAL_RESEARCH_COST_MULT=1`, koszty ×2 w `tech.json`, Obróbka drewna + Murarstwo JSON=**5** → 5/10/20 PN; (3) **B-TECH-EARLY-COST** wchłonięty w model powyżej.
- **Sync:** stash `sesja-lokalna-pre-pull-2026-07-24` → pop + konflikt `buildings.json` (tiery pałacu wygrały nad FALA-8 „bez surowców") · commit + push main.
- **Bramki:** tsc 0 · research 33/33 · tech-tempo 15/15 · difficulty-cost 22/22 · conquest-stability 27/27 · VERIFY OK.
- **md5:** `0de2599cba16087cbb47cb202fdb616c` · pieczątka `0de2599c`. Bundel 34 MB. Zastępuje `c7e16e51`.

## ROBOCZA `c7e16e51` — 2026-07-24 · SESJA LOKALNA: stash→pull→pop + FALA 8 rebuild — ZASTĄPIONA

- **Zawartość:** FALA 8 (`90263d3`) — Pałac bez surowców · blokada 1. miasta · UI surowców · kamień współistnieje · Civpedia. Lokalny rebuild po bramkach (bez git push).
- **Sync:** main już na `90263d3` (pull FF: already up to date); stash `sesja-lokalna-pre-pull-2026-07-24` → pop częściowy (zmiany już w WT) → drop.
- **Bramki:** tsc 0 · research 33/33 · tech-tempo 12/12 · difficulty-cost 22/22 · conquest-stability 27/27 · build OK.
- **md5:** `c7e16e5172316f181892a5512518f0a4` · pieczątka `c7e16e51`. Zastępuje `e65036fd`.

## ROBOCZA `e65036fd` — 2026-07-24 · SESJA LOKALNA: pull FALA 8 + rebuild weryfikacyjny — ZASTĄPIONA

- **Zawartość:** identyczna jak FALA 8 chmury (`90263d3` / `e9306d7a` przed pieczęcią) — pull 4 commitów FF + lokalny build/publish po bramkach.
- **Sync:** `e9c4c96` → `90263d3` (stash lokalnych zmian pre-pull: `sesja-lokalna-pre-pull-2026-07-24`).
- **Bramki:** tsc 0 · research 33/33 · tech-tempo 12/12 · difficulty-cost 22/22 · build OK.
- **md5:** `e65036fde18cb7eb738d8c78797b2ca8` · pieczątka `e65036fd`. Zastępuje `e9306d7a` (chmura, manifest przed stamp lokalnym).

## ROBOCZA `e9306d7a` — 2026-07-24 · FALA 8: Pałac bez surowców + blokada 1. miasta + UI surowców (widoczność+panel) + kamień współistnienie + Civpedia — ZASTĄPIONA

- **Zawartość:** (commity `42170ea`, `b5ba1b0`, `5cf79a3`) — zbudowana NA mapie Ziemia `58299d6f` (rebase, zawiera ich zmiany):
  1. **Pałac** — usunięty koszt surowcowy (8 drewno+8 kamień); zostaje 40 Pracy (budynek startowy, na starcie pula surowców = 0).
  2. **Blokada pierwszego miasta** — `exitBuildMode` guard (jeden choke-point: Escape/PPM/🔨/dismiss) + blokada „koniec tury" (canEndTurn + klawisz N z podpowiedzią), dopóki gracz nie założy 1. miasta. Parytet: AI nie używa tego UI.
  3. **C-SURUI=A** — UI surowców widoczne od tury 1: pasek miasta pokazuje rdzeń (drewno+kamień) zawsze; magazyn imperium bez placeholdera przy 0 (skip tylko czysty dostęp Sól/Koń/Ceramika).
  4. **C-PANEL=B** — klik żetonu HUD otwiera panel z TYLKO jego blokiem (Surowce=magazyn, nie cała ekonomia).
  5. **Kamień=b** — Kamieniołom na Wzgórza+Góry; własny sektor niewykluczający (współistnieje z kopalniami rudy/glinianką/stadniną — nie blokuje wydobycia ukrytej rudy); grafika rozsunięta (300° vs 0°, zweryfikowane wizualnie — nie nachodzą).
  6. **Civpedia** — rename „Wiki→Civpedia" (toolbar+panel) + aktualizacja treści (magazyn 500+100/Magazyn, konsumpcja surowca przez jednostki, handel z MP, Cuda w liście budowy, suwak trudności MP, Pałac bez kosztu) + regen wikiBundle.json (generated 2026-07-24).
  - Bez zmian kodu: trudność MP=A, ujawnianie żelaza=A (potwierdzone).
- **Bramki:** tsc 0 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · map-gen OK · VERIFY OK.
- **md5:** `e9306d7ad25f8f82cf55f8af3b809c0b` · manifest. Pieczątka w grze `da99aead` (one-iter quirk — manifest miarodajny). Bundel 34 MB. Zastępuje `58299d6f`.

## ROBOCZA `58299d6f` — 2026-07-24 · mapa Ziemia: bufor N+S + Antarktyda wraca (A-MAP-ZIEMIA-1 fix) — ZASTĄPIONA

- **Zawartość:** typ **Ziemia** tylko: ~30 rzędów oceanu u góry **i** u dołu (skalowane); pełny szablon lądu z Antarktydą (bez wycinania); północ bez zmian względem poprzedniego bufora.
- **Fix:** cofnięte błędne wycięcie Antarktydy (`NR_LAND_MAX`); dodany symetryczny bufor południowy.
- **Bramki:** tsc 0 · earth-template-test 0 fail · VERIFY OK.
- **md5:** `58299d6f7d7fd3770a5d603ee08ea7e6` · pieczątka `58299d6f`. Zastępuje `160f0402`.

## ROBOCZA `160f0402` — 2026-07-24 · mapa Ziemia: bufor arktyczny + bez Antarktydy (A-MAP-ZIEMIA-1 B) — ZASTĄPIONA

- **Zawartość:** tylko typ świata **Ziemia** (`ziemia`): ~30 rzędów oceanu arktycznego u góry (skalowane z rozmiarem mapy), wycięcie Antarktydy z mapowania szablonu, końcowy enforce szablonu w generatorze. Proceduralne Kontynenty / Pangea / Wyspy — bez zmian.
- **Pliki:** `earth-land-mask.ts`, `generator.ts`, `earth-template-test.cjs`, `docs/decyzje/A-MAP-ZIEMIA-1.md`.
- **Bramki:** tsc 0 · earth-template-test 0 fail · map-gen-regression PASS · VERIFY OK.
- **md5:** `160f0402c674d448e0d8ae529c765c86` · pieczątka `160f0402`. Bundel 34 MB. Zastępuje `85f0ca70`.

## ROBOCZA `85f0ca70` — 2026-07-24 · menu: O grze → poradnik + cleanup Więcej — ZASTĄPIONA

- **Zawartość:** (1) **O grze** w menu głównym otwiera **Poradnik gracza** (ten sam hub Wikipedia co na mapie, tryb overlay nad menu). (2) Usunięte z menu Więcej: **Playtest mapy** (walka/miasto już wcześniej). (3) Ustawienia menu: tylko Muzyka / Efekty / Język (`ui-params.json` — bez Grafika/Skala/Mgła).
- **Pliki:** `wikiHubHud.ts` (layout overlay), `mainMenu.ts`, `main.ts`, `ui-params.json`.
- **Bramki:** tsc 0 · build OK (699 modułów) · VERIFY OK.
- **md5:** `85f0ca7055d39013e27702375cd3bab2` · pieczątka `85f0ca70`. Bundel 34 MB. Zastępuje `e19e50ff`.

## ROBOCZA `e19e50ff` — 2026-07-24 · FALA 7: 6 utworów muzyki kontekstowej (intro/dyplomacja/pre-battle/bitwa/zwycięstwo/porażka) — ZASTĄPIONA

- **Zawartość:** (commit `af3b293`) 6 nowych utworów mp3 kontekstowych + mechanizm OVERLAY muzyki paneli (`muzyka-antyczna.ts`):
  1. **Intro** — `Prayer_of_the_Sun_Stone` jako PIERWSZY (pozostałe 3 o jedno dalej; `INTRO_KOLEJNOSC` w filePlayer.ts).
  2. **Panel dyplomacji** z inną cyw. — `Gilded_Porticos` (hak w show/hideDiplomacyAudience).
  3. **Nakładka pre-battle** — `Song_of_the_Ancient_Hearth` (hak w show/hidePreBattle).
  4. **Sama bitwa** — `Before_the_Bronze_Gate` (hak w setMood('bitwa'/'mapa') — mapa/oblężenie/najazd).
  5. **Po WYGRANEJ** — `Where_the_Reed_Bends` · 6. **Po PRZEGRANEJ** — `Sun_on_the_Copper_Ridge` (hak w battleScene `_showEndScreen`, flaga playerWon; czysta wymiana utworu; Replay wraca na muzykę bitwy).
  - Overlay: muzyka gry milknie na czas panelu, wraca (mapa) po zamknięciu. Respektuje wyłączoną muzykę (start tylko gdy muzyka gry gra) + suwak głośności obejmuje wszystkie 6 torów.
- **Bramki:** tsc 0 · build OK (699 modułów) · VERIFY OK.
- **md5:** `e19e50ff25cba5bf722b353e9d3aaa02` · manifest. Pieczątka w grze `6e4c23d8` (one-iter quirk — manifest miarodajny). Bundel 34 MB (6 mp3 inline base64). Zastępuje `8dc09b8a`.
- **TODO przyszłość (życzenie właściciela):** osobny utwór dyplomacji per cywilizacja (dziś 1 wspólny; katalog `dyplomacja/` czytany automatycznie).

## ROBOCZA `8dc09b8a` — 2026-07-24 · FALA 6.2: pełny handel surowcami z miastami-państwami + portret miast-państw = symbol kultury — ZASTĄPIONA

- **Zawartość:** (commity `8aacfd3`, `8363a4b`)
  1. **HANDEL SUROWCAMI Z MIASTAMI-PAŃSTWAMI** (decyzja Macieja A, parytet): `zaproponuj_handel_surowiec` w warstwie MP; gracz↔MP i AI↔MP, jednorazowo + cyklicznie, obie strony (AI↔MP bramkowane realną nadwyżką surowca). Inne ograniczenia MP nietknięte.
  2. **PORTRET MIAST-PAŃSTW = SYMBOL KULTURY** (nie zdjęcie władcy): miasta-państwa renderują `civIconSvg` kultury zamiast `portrait-{civ}-{epoka}.jpg` (dyplomacja, audiencja, preBattle, bitwa) — koniec 10-11 identycznych portretów. Gracz/główne AI bez zmian. Etykieta MP: „Miasto · Kultura · miasto-państwo" (np. „Sparta · Grecja · miasto-państwo").
- **Bramki:** tsc 0 · display-names 12/12 · diplomacy-layers 8/8 · cyclic-trade 42/42 · ai-test 233/7 (baseline) · diplomacy 144/2 (baseline) · city-state-alliance 59/59 · tech-tree 19/19 · VERIFY OK.
- **md5:** `8dc09b8ab2f709b567b65489f087e9a6` · manifest. Pieczątka `8dc09b8a`. Bundel 28,2 MB. Zastępuje `3db42857`.
- **FLAGI do decyzji Macieja:** (a) format etykiety MP „Miasto · Kultura · miasto-państwo" — potwierdzić; (b) IMIĘ władcy pod medalionem MP nadal to samo co główna cywilizacja (możliwy follow-up); (c) etykiety miast na heksach mapy niezmienione (tylko dyplomacja/HUD dostały kulturę).

## ROBOCZA `3db42857` — 2026-07-24 · FALA 6.1: cała dyplomacja miast-państw pod suwak trudności MP (dokończenie) — ZASTĄPIONA

- **Zawartość:** nadbudowa FALI 6 (commit `6797402`). `effectiveGameDifficultyForOwner(ownerId)` — dla miast-państw **cała** dyplomacja (progi wojna/handel + dary jednorazowe + agresja/aktywność + posiłki) idzie z suwaka „Trudność miast-państw"; pełne cywilizacje AI bez zmian (globalna trudność). Decyzja Macieja: „przenieś wszystkie ustawienia poza główną trudność".
- **Bramki:** tsc 0 · ai-test 233/7 (baseline) · diplomacy 144/2 (baseline) · city-state-alliance 59/59 · VERIFY OK.
- **md5:** `3db4285743c1e83fac92b879765488a0` · manifest. Pieczątka `3db42857`. Bundel 28,2 MB. Zastępuje `666b2b75`.

## ROBOCZA `666b2b75` — 2026-07-24 · FALA 6: ikony surowców v4 + magazyn 500 + UI surowców + Cuda w mieście + proaktywność MP + AI-rush strojalny — ZASTĄPIONA

- **Zawartość (sesja autonomiczna, commity `1e80e6d`…`ca00246`; branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`):**
  1. **IKONY SUROWCÓW v4 (Design):** 12 odrębnych ikon — koniec interimowego kolorowania. Metale/cegła/rudy rozdzielone (res-bronze zielony, res-iron srebrno-szary, res-brick czerwony, res-copper-ore/res-iron-ore, res-steel, res-ceramics; glina=pomarańczowy placek). Wchodzą wszędzie przez `mapResourceIconSvg` (zakładka + chipy miasta + tooltip heksa).
  2. **BAZA MAGAZYNU 100→500** (`magazyn_baza_surowce`); cap = **500 + 100×Magazyn** (każdy Magazyn w dowolnym mieście addytywnie). Fixtury 44/44.
  3. **UI SUROWCÓW:** zakładka „Magazyn Państwa" na brand-ikonach (karty: ikona·nazwa·pasek·sztuki·produkcja bez „/t", szczegóły na hover; cap data-driven 500); chip „Surowce" w HUD (Nauka przeniesiona w prawo); **pasek surowców przy budowie** i **pasek Brąz/Żelazo wg epoki przy rekrutacji** w panelu miasta.
  4. **CUDA:** usunięty osobny katalog z lewego menu; cuda w **liście budowy miasta**, filtrowane per cywilizacja (AI bez zmian).
  5. **PROAKTYWNOŚĆ MIAST-PAŃSTW** (agresja/aktywność dyplomacji) pod suwak „Trudność miast-państw", nie globalną (pełne AI bez zmian).
  6. **PROGI AI-RUSH** (rezerwa 100/limit 1) przeniesione do `econ-params.json` (strojalne, wartości bez zmian).
  7. **Poza grą:** generatory paneli Excel eksportują koszty surowcowe jednostek/budynków (Panel-B/C).
- **Bramki:** tsc 0 · surow-civ-storage 44/44 · unit-stock-cost 31/31 · ai-unit-rush 8/8 · ai-test 233/7 (baseline) · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · wonder-yields 11/11 · zelazo-gate 23/23 · map-gen determinizm PASS · VERIFY OK.
- **md5:** `666b2b75e42d8375706ecf993a3385c4` · manifest. Pieczątka `86c44282` (one-iter quirk). Bundel 28,2 MB.
- **Test:** panel imperium → Surowce (kolorowe ikony, cap 500, karty) · miasto → budowa (pasek surowców) i rekrutacja (Brąz/Żelazo wg epoki) · budowa cudów z listy miasta (bez zakładki Cuda) · kreator → Trudność miast-państw wpływa też na proaktywność dyplomacji MP.
- **FLAGI do decyzji Macieja:** (a) ikona **konia** do wymiany (Design dośle; SVG nie dało się załączyć); (b) HUD pokazuje pojedynczy chip „Surowce" (nie pełny pasek 9 ikon — świadomie zachowawczo); (c) zakres proaktywności MP — progi/dary jednorazowe nadal globalne (osobny temat); (d) `R-MP-HANDEL-SUROWCE`, `R-STAWKI-STROJENIE` otwarte.

## ROBOCZA `c676b681` — 2026-07-24 · FALA 5: konsumpcja surowca przez jednostki + AI kupuje za złoto + fix bramki dostępu — ZASTĄPIONA

- **Zawartość (commity `3161c79`, `b194539`, `af9fae2`; branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`):**
  1. **JEDNOSTKI KONSUMUJĄ SUROWIEC z puli PAŃSTWA** (decyzja Macieja C-JEDN-SUROWIEC-Q1=A): `Surowiec (ilość)` z units.json pobierane przy budowie/zakupie — gracz (zakup za złoto + zwrot przy anulowaniu) i AI (handler build) — blokada gdy pula nie starcza; UI ma chip kosztu i wyłącza „Rekrutuj". Mapowanie odporne na diakrytyki (Brąz→braz). Parytet AI (test 31/31, ownerId≠0).
  2. **AI KUPUJE JEDNOSTKI ZA ZŁOTO** (parytet R-AI-KUP-JEDN): `purchaseRecruitmentUnit` uogólnione na dowolnego ownera (ta sama ścieżka co gracz → też konsumuje surowiec). AI rush-uje ZACHOWAWCZO: tylko na wojnie, gdy ma Manpower + złoto ≥ rezerwa 100 + koszt, max 1/turę (`shouldAIRushBuyUnit`, stałe PLACEHOLDER do strojenia). Test ai-unit-rush 8/8.
  3. **FIX martwej bramki dostępu brąz/żelazo** (R-JEDN-DOSTEP-BUG): `stripDiacritics` w production.ts (2 miejsca) — jednostki brązowe/żelazne znów WYMAGAJĄ dostępu do surowca (wcześniej `'brąz'!=='braz'` czyniło bramkę martwą). zelazo-gate 23/23.
- **Bramki:** tsc 0 · unit-stock-cost 31/31 · ai-unit-rush 8/8 · surow-civ-storage 44/44 · unit-replace 10/10 · zelazo-gate 23/23 · tech-tree 19/19 · research 33/33 · ai 233/7 (baseline) · VERIFY OK.
- **md5:** `c676b6815625f28b25a0a9926dbaa6c6` · manifest. Pieczątka w grze `271f572b` (one-iter quirk). Bundel 28,3 MB.
- **Test:** miasto → produkcja jednostki brązowej/żelaznej pobiera surowiec z puli (chip kosztu, blokada gdy brak) · jednostka bez dostępu do brązu/żelaza niebudowalna · AI na wojnie kupuje jednostkę za złoto.
- **Poza grą (dokumentacja tej sesji):** analiza bilansu 100 tur (`BILANS-SUROWCE-100T-2026-07-25.md` — wynik: NADMIAR, kamień bez odbiorcy, cap civ-wide nie skaluje się z imperium), audyt parytetu AI (`AUDYT-PARYTET-AI-2026-07-24.md`), sync paneli Excel A/B/C.
- **FLAGI do decyzji Macieja:** (a) próg AI-rush (rezerwa 100 / limit 1) do strojenia po playteście; (b) generatory paneli Excel nie eksportują pól kosztów surowcowych jednostek/budynków (`R-PANEL-SYNC`); (c) strojenie bilansu (sink kamienia / cap per-miasto — `R-STAWKI-STROJENIE`).

## ROBOCZA `ea75f5ba` — 2026-07-24 · FALA 4.1: magazyny=pula państwa + handel surowcami + trudność miast-państw + super-jednostki — ZASTĄPIONA

- **Zawartość (commity `f136c09`…`0d0db35`; nadbudowa fali 4):**
  1. **MAGAZYNY = pula PAŃSTWA** (civ-wide): cap per typ = **100 + 100×Magazyn** (płaskie na easy/normal/hard, addytywnie), nadmiar przepada; surowce wspólne dla imperium (budowa płaci z puli). Parytet AI (test 44/44 z asercją na AI).
  2. **HANDEL SUROWCAMI w dyplomacji:** tryb **jednorazowy** + **cykliczny przez X tur** (za pieniądz/Pracę); AI proponuje/akceptuje/AI↔AI (parytet, test 42/42).
  3. **TRUDNOŚĆ MIAST-PAŃSTW** osobnym suwakiem w kreatorze (Zaawansowane opcje), odpięta od globalnej trudności: zaufanie startowe + sojusze sióstr + posiłki + aiDiffLevel kopii obronnych (naprawiony przeciek `bonusProdukcja`). Domyślnie = główna trudność.
  4. **KOSZTY JEDNOSTEK:** Kamień 0 · Brąz/Żelazo; dystansowe **0** (Procarz + łucznicy brązowi) · I linia 2 · premium 3. **Super-jednostki:** bezpłatne pieniężnie (Triari/Wojownik germański 0) + max 1 + respawn stolica + 3 surowca.
  5. Baza fali 4: ceramika=dostęp · produkcja bez pracowników · paliwo/Mielerz usunięte · bonusy budynków · koszty budynków · −1 Praca upkeep · cegła-A · wonder-bonusy · licznik · docs Civpedia/Poradnik.
- **Bramki (scalone):** tsc 0 · logic 208/208 · ai 233/7 · storage 44/44 · handel-cykliczny 42/42 · diplomacy-layers 8/8 · converters 24/24 · mennica 41/41 · wonder-yields 11/11 · owner-economy 9/9 · trade-routes 51/51 · trade-grant 38/38 · unit-replace 10/10 · tech-tree 19/19 · map-gen determinizm A=B PASS · VERIFY OK.
- **md5:** `ea75f5ba4d49cdc6849e829fc52a1887` · manifest. Pieczątka w grze `fe5049dd` (one-iter quirk). Bundel 28,2 MB.
- **Test:** panel imperium → SUROWCE (pula 100/+100, −Praca za ulepszenia) · dyplomacja → sprzedaj/wymień surowiec (jednorazowo lub co turę, za złoto/Pracę) · kreator → Zaawansowane → „Trudność miast-państw" osobno · jednostki dystansowe darmowe surowcowo.
- **FLAGI do decyzji Macieja:** (a) `decideAIDiplomacy` (proaktywność miast-państw w propozycjach wojna/pokój — `agresjaMnoznik`) NADAL na globalnej trudności; odpiąć też pod suwak miast-państw? (b) placeholdery do strojenia po playteście.

## ROBOCZA `cd42837f` — 2026-07-24 · FALA 4: przebudowa ekonomii surowców + wonder-bonusy + koszty budynków/jednostek — ZASTĄPIONA

- **Zawartość (commity `07bc172`→`bcd818b`; sesja chmurowa, seria subagentów + scalenia):**
  1. **Model surowców:** ceramika = tylko DOSTĘP (Garncarnia nie konwertuje) · produkcja per-ULEPSZENIE bez wymogu pracowników (naprawiony przeciek bazowego plonu) · stawki Tartak/Kamieniołom/Glinianka 4, Kopalnie 2 (`surowiec_ilosc_tura`).
  2. **PALIWO + MIELERZ usunięte** — konwertery biorą drewno 1:1 (DEFAULT_CONVERTER_RECIPES 7→5).
  3. **Bonusy budynków:** Stolarnia +10% drewna civ · Warsztat kamieniarski +10% kamienia civ · Garncarnia +10% żywności lokalnie (placeholdery econ-params).
  4. **Koszty budynków** (28, `koszt_surowce`) wg tabel Kamień/Brąz/Żelazo. **Cegła-A:** Cegielnia 2→3/turę, Glinianka 4→5.
  5. **−1 Praca/turę za ulepszenie surowcowe** (wariant B, z Warzelnią/Stadniną) — limit na spam ulepszeń; **fix deadlocka AI** (konwertery przed konsumentami surowca).
  6. **Koszty jednostek:** Kamień 0 · Brąz→brąz · Żelazo→żelazo; dyst. 1 / I linia 2 / premium 3 (Procarz=0). 73 jednostki.
  7. **Wonder-bonusy realnie w ekonomii** (C-CUDA-BONUS=A): `bonusy.miasto` × każde miasto właściciela + zadowolenie w happiness pipeline (gracz i AI).
  8. **LICZNIK surowców** (wolumen + tempo/turę) w panelu imperium; **docs** Civpedia+Poradnik (wikiBundle 134 hasła).
- **Bramki (scalone):** tsc 0 · logic 208/208 · ai 233/7 (pre-istniejące) · converters 24/24 · mennica 41/41 · wonder-yields 11/11 (NOWY) · owner-economy 9/9 · unit-replace 10/10 · research 33/33 · tech-tree 19/19 · map-gen determinizm A=B PASS · VERIFY OK.
- **md5:** `cd42837fda237aa7bbea31e429900ca8` · manifest. Pieczątka w grze: `5285a7ec` (one-iter-behind, znany quirk). Bundel 28,2 MB. Publikowała sesja chmurowa.
- **Test:** panel imperium → SUROWCE STRATEGICZNE (wolumen+tempo, −N Praca za ulepszenia) · buduj budynki/jednostki i patrz na koszty surowcowe · cuda dają realne yieldy · ceramika = dostęp (Garncarnia).
- **FLAGI do decyzji Macieja:** (a) super-jednostki Triari(18)/Wojownik germański(16) mają koszt PIENIĘŻNY — niespójne z „premium = bezpłatna pieniężnie"; (b) łucznicy brązowi = 1 Brąz (groty) — zostawić czy 0; (c) placeholdery do strojenia po playteście (stawki, bonusy 10%, upkeep, cegła); (d) bonusy cudów teren/hex/specjalne = TODO.

## ROBOCZA `aa3c9b06` — 2026-07-23 · FALA 3: surowce (bydło/owce/lama NIE surowce) + licznik magazynów + CUDA-AI + Ludy Morza + UMOWA-B — ZASTĄPIONA

- **Zawartość (commity `4adefe7`→`6859d9e`; kontynuacja batcha, 1 subagent/temat, trudne=Fable/worktree):**
  1. **SUROWCE — bydło/owce/lama NIE są surowcami (decyzja Macieja, wielokrotna):** usunięte z systemu surowców (resource-access active, resources.json, diplomacy-goods) — zostają ulepszeniami terenu dającymi bonus żywności/produkcji. Surowcem „zwierzęcym" jest tylko Koń.
  2. **LICZNIK SUROWCÓW (BRAZ-ILOSC=B):** panel imperium → sekcja SUROWCE STRATEGICZNE pokazuje realny wolumen magazynów (suma City.surowce) zamiast pustej zaślepki. Sól/Koń=dostęp; Ceramika przejściowo kumuluje; tempo/turę=TODO.
  3. **CUDA-AI (C-CUDA-AI=A):** AI pełnych cywilizacji buduje cuda (priorytet E przed R, max 1 cud/cyw, throttle wg trudności, deterministyczne). Progi ai-params.json §9 = PLACEHOLDERY DO AKCEPTACJI. FLAGA: bonusy cudów nadal NIE wpięte w ekonomię dla NIKOGO (gracz też) — TODO ogólnosystemowe.
  4. **#15 LUDY MORZA (Fable):** embarkacja (RuntimeUnit.embarked, ruch po wodzie koszt 1 z Żeglugą, auto-desant, brak ataku z wody, obrona ×0,5) + obozy nadmorskie i rajdy (epoka Brązu; cel: nadmorskie miasto/ulepszenie). Params §9 PLACEHOLDERY. Render: łódka pod figurką.
  5. **UMOWA-B (C-HANDEL-UMOWA=B):** trasy handlowe WYMAGAJĄ traktatu Umowa Handlowa (nie sam pokój); teksty pomocy zaktualizowane (rekrutacja: Manpower nie ludność).
- **Bramki (stan scalony):** tsc=0 · logic 208/208 · ai 233/7 (pre-istniejące) · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · barbarians 137/137 · trade-grant 38/38 · trade-routes 51/51 · category 73/73 · map-gen determinizm A=B PASS (806/806 rzek z ujściem) · VERIFY OK.
- **md5:** `aa3c9b06c0c22405777c59447a28227d` · stamp `aa3c9b06`. Bundel 28,2 MB. Publikowała sesja chmurowa (autonomicznie, „wypchnij wszystko do roboczej").
- **Test:** panel imperium → SUROWCE STRATEGICZNE pokazuje sztuki w magazynach; dyplomacja NIE pokazuje już bydła/owiec/lamy jako dóbr; z Żeglugą jednostka wchodzi na wodę (łódka); AI może zakolejkować cud; trasy wymagają Umowy Handlowej.
- **FLAGI do decyzji Macieja:** (a) ceramika: zliczana vs tylko-dostęp (koliduje z kosztem 3 budynków w ceramice); (b) czy ulepszenie produkuje bez pracowników (dziś: tak tylko gdy pole obsadzone); (c) stawki produkcji/turę per surowiec — do ustalenia po obejrzeniu licznika; (d) placeholdery CUDA/Ludy Morza do strojenia; (e) docs (Civpedia+Poradnik, regeneracja wikiBundle) w NASTĘPNEJ fali.

## ROBOCZA `9f9ced35` — 2026-07-23 · WIELKI BATCH (12 tematów): drzewko technologii w grze · ekran Cudów · handel E6+E3b · koszty surowcowe budynków · fixy — ZASTĄPIONA

- **Zawartość (commity `98ddefe`→`9450559`; batch zlecony przez Macieja, 1 subagent/temat, trudne=Fable):**
  1. **EKRAN DRZEWKA TECHNOLOGII (#2, Fable):** pełnoekranowy graf wg makiety „siatka v1.1" — pasma epok, 4 stany węzłów z powodami blokad, karta węzła (koszt z tempem ×2, tury, AND ✓/✗, odblokowania), zoom/pan/minimapa; wejście złotym przyciskiem z panelu badań; „pokaż ścieżkę" = TODO.
  2. **EKRAN CUDÓW ŚWIATA (#16):** galeria 19 cudów wg makiety CUDA-v1 (stany z realnego stanu gry, karta z CTA), powiadomienia nasz/cudzy; wejście 6. medalionem toolbara. Fix po drodze: cud w kolejce raportował się jako Dostępny. Obserwacja: AI dziś nie buduje cudów.
  3. **Handel E6 (#3):** AI proaktywnie proponuje Umowy Handlowe (gracz przez skrzynkę propozycji + AI↔AI max 1/turę; próg 40 z decyzji 21.07, cooldowny w save).
  4. **Handel E3b (#4):** dostęp brąz/żelazo/koń przez aktywną trasę (czysta pochodna tras — wojna/zerwanie cofa automatycznie); UI: „szlak handlowy z X"; nowy test 30/30.
  5. **Powiadomienia tras (#5):** toast+WYDARZENIA nowa/zerwana trasa z powodem (+16 asercji).
  6. **Koszty surowcowe budynków (#6):** koszt_surowce w buildings.json (10 budynków Brąz/Żelazo, PLACEHOLDERY), blokada+pobór przy enqueue, chipy w karcie, AI omija.
  7. **Wyrąb dla AI (#8):** ostatni priorytet, min. 3 lasy w promieniu, poprawna „wycinka".
  8. **Fix rzeka↔dekor (#7):** rzeka znikała TRWALE pod miastem/ulepszeniem (decorHiddenHexKeys) — teraz tylko mgła chowa rzekę; potwierdzone zrzutami.
  9. **Pozycyjny szum wody (#23):** renderWoda wg udziału wody w kadrze (morze/rzeka).
  10. **Natura ulotna (#9):** wyciszenie nie zapisuje się trwale (wzorzec muzyki).
  11. **Kontry+kategorie (#10):** Triari/Thorakites vs Mount 0→50 (Typ=Spearman); categoryOf 73/73.
  12. **logic-test (#1):** nie regresja — fixtury po świadomych zmianach balansu; 208/208.
- **Bramki (stan scalony):** tsc=0 · logic 208/208 · combat 6/6 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · trade-routes 51/51 + income 49/49 · trade-grant 30/30 (NOWY) · diplomacy-layers 8/8 · converters 19/19 · ai 233/7 (pre-istniejące) · kategorie 73/73 · VERIFY OK.
- **md5:** `9f9ced355686a82efe0b9a9edfd0944a` · stamp `9f9ced35`. Bundel 27,9 MB. Publikowała sesja chmurowa (autonomicznie, C-ORG-Q17=A).
- **Test:** panel badań → złoty „Drzewko — graf epok"; toolbar mapy → medalion Cuda świata; dyplomacja: AI może zaproponować Umowę Handlową; miasto nad rzeką nie kasuje już rzeki; budynki Brązu+ pokazują koszt cegły/ceramiki; zbliż kamerę do morza → szum wody.
- **FLAGI do decyzji Macieja:** (a) trasy bramkowane POKOJEM (nie Umową) — zgodnie z HANDEL-Q1/Q8, Umowa=relacje+fundament; (b) „pokaż ścieżkę" w drzewku TODO; (c) AI nie buduje cudów (przyszły temat); (d) niespójne Bonus vs Mount u 4 Spearmanów (ABC).

## ROBOCZA `feda52ec` — 2026-07-23 · Równa gwiazdka Generała + Dystansowe = tarcza (zasoby Design) — **ZASTĄPIONA** (→ `9f9ced35`)

- **Zawartość (commit `e5e1c26`):** ★ Generała podmieniona na RÓWNĄ gwiazdkę z eksportu Design (`chip-star-24.svg` — poprzednia z makiety była asymetryczna); filtr Dystansowych = TARCZA STRZELNICZA z torem lotu (`class-ranged.svg` z battle-class-map — decyzja Macieja, przywrócona zamiast łuku).
- **Bramki:** tsc=0 · zrzut potwierdzony · VERIFY OK.
- **md5:** `feda52ecc1b4885b124ba03bca25aa6c` · stamp `feda52ec`. Publikowała sesja chmurowa.

## ROBOCZA `e914e1e5` — 2026-07-23 · FILTRY NA DWÓCH PIĘTRACH (★ obok Wszystkie, grupy niżej) — **ZASTĄPIONA** (→ `feda52ec`)

- **Zawartość (commit `216a3d5`):** układ filtrów wg uwagi Macieja: rząd 1 = ikony klas + Wszystkie + ★ Generał (obok siebie); rząd 2 (piętro niżej) = grupy G1/G2/G3. Oba buildery (deploy + walka/ręczna).
- **Bramki:** tsc=0 · zrzut potwierdzony · VERIFY OK.
- **md5:** `e914e1e52bf5b466c9381ca8849d55f1` · stamp `e914e1e5`. Publikowała sesja chmurowa.

## ROBOCZA `b6481c25` — 2026-07-23 · RZĄD FILTRÓW W CAŁOŚCI 1:1 z makiety C06 + grupy G1/G2/G3 — **ZASTĄPIONA** (→ `e914e1e5`)

- **Zawartość (commit `1d51e09`):** dokładne rysunki ikon klas z makiety (podkowa z gwoździami / skrzyżowane miecze / łuk z cięciwą), obwódki/kolory per klasa 1:1 (konnica NIEBIESKA), grupy jako kompaktowe chipy **G1/G2/G3** w stylu ikon (decyzja Macieja — „samo G"), pełne nazwy w pigułkach. Makieta rzędu filtrów wyczerpana w całości (ekstrakcja wszystkich elementów).
- **Bramki:** tsc=0 · zrzut potwierdzony (podkowa/miecze/łuk/kropki/G1-G3/★) · VERIFY OK.
- **md5:** `b6481c25796e73115a50cd695c795650` · stamp `b6481c25`. Publikowała sesja chmurowa.

## ROBOCZA `0500eddf` — 2026-07-23 · KOMPLET filtrów 1:1 z makietą C06 (★ Generał, style aktywne) — **ZASTĄPIONA** (→ `b6481c25`)

- **Zawartość (commit `3978be4`):** rząd filtrów rosteru w KOMPLECIE 1:1 z makietą „C06 Pole bitwy odswiezenie": Generał = GWIAZDKA (SVG z makiety), Wszystkie = 4 kropki (SVG z makiety, viewBox 24), przyciski 34px/radius 9, **stan aktywny = pełne złoto #e8d88a z ciemną ikoną** (jak w makiecie; było: półprzezroczyste). Korekta po uwadze Macieja o niepełnym wdrażaniu makiet.
- **Bramki:** tsc=0 · zrzut walki potwierdzony (podkowa/miecze/łuk/kropki/★ + GRUPA 1-3 tekstowo) · VERIFY OK.
- **md5:** `0500eddf184033d9b7bfe2d0a7ab998f` · stamp `0500eddf`. Publikowała sesja chmurowa.

## ROBOCZA `8c774bdd` — 2026-07-23 · FILTR „WSZYSTKIE" = ikona czterech kropek — **ZASTĄPIONA** (→ `0500eddf`)

- **Zawartość (commit `277abfd`, na `1d2f86fc`):** czwarty filtr rosteru („Wszystkie") również jako ikona — cztery kropki w kwadracie (uwaga Macieja), pigułka „WSZYSTKIE" na hover; komplet czterech ikon filtrów bez napisów. Inne użycia przycisku (popupy taktyk/linii) bez zmian.
- **Bramki:** tsc=0 · zrzut potwierdzony · VERIFY OK.
- **md5:** `8c774bdde7851a884e17d76ad773ed0d` · stamp `8c774bdd`. Publikowała sesja chmurowa.

## ROBOCZA `1d2f86fc` — 2026-07-23 · FILTRY ROSTERU JAKO IKONY (Konnica/Piechota/Dystansowe) — **ZASTĄPIONA** (→ `8c774bdd`)

- **Zawartość (commit `ff01479`, na `49563095`):** filtry klas jednostek w panelu rosteru bitwy = SAME IKONY 32px (podkowa/skrzyżowane miecze/łuk — te same co na medalionach kart, spójne z makietą C06; ikona „tarczy" z battle-class-map.json Design świadomie odrzucona jako niespójna), polska nazwa TYLKO w pigułce na hover, aktywny = złota obwódka+glow; chipy WSZYSTKIE/GRUPA N/GENERAŁ zostają tekstowe (dynamiczne). Uwaga Macieja „infografiki, nie napisy". Logika filtrowania bez zmian.
- **Bramki:** tsc=0 · smoke deploy+walka 0 błędów konsoli · VERIFY OK.
- **md5:** `1d2f86fc930cc7d132de9ed4322c0da7` · stamp `1d2f86fc`. Publikowała sesja chmurowa.
- **Test:** roster bitwy → trzy ikonki nad listą (hover = KONNICA/PIECHOTA/DYSTANSOWE z licznikiem), klik filtruje jak dotąd.

## ROBOCZA `49563095` — 2026-07-23 · BRÓD (wariant C) · HANDEL SUROWCAMI (wariant B) · HUD: ikony na rosterze + minimapa prawy-dół — **ZASTĄPIONA** (→ `1d2f86fc`)

- **Zawartość (commity `81d0cef`+`dd0f651`+`67e698f`):** trzy decyzje Macieja z 2026-07-23:
  1. **Bród C-BTL-BROD-Q1=C:** ruch ×0,5 w brodzie · −25% obrony walcząc w brodzie (kara ataku −25% już istniała jako `river_attack_mult` — udokumentowana, osobne strojenie) · obrońca brzegu przy brodzie +15% obrony · tooltip jednostki pokazuje aktywny status (wiersz TEREN, czerwony/zielony) · wartości w `combat-params.json` klucz `brod` · AI: kawaleria unika zatrzymania w brodzie · legacy (bez Fordów) bit-for-bit.
  2. **Handel surowcami C-DYP-SUROWCE-Q1=B:** koszyk negocjacji handluje ilościowymi surowcami miast w pakietach po 10 (drewno 2/kamień 3/glina 2/cegła 5/ceramika 6/ruda 4 za szt. — PLACEHOLDERY, sekcja `handel_surowce` w `econ-params.json`, strojenie w panelu) · transfer od największych zapasów dawcy → stolica biorcy · SZYBKA UMOWA dopełnia bilans pakietami przed złotem · AI wycenia przez ten sam katalog.
  3. **HUD bitwy (uwagi Macieja):** pełnoszerokościowy dolny pasek USUNIĘTY; ikony Formacja/Konnica/Linie/Taktyka/Strategia (deploy) i zegar/budynek (walka) = mały rządek 38px NA GÓRZE panelu rosteru z hover-pillami; START WALKI+Reset = pływający klaster prawy-dół; **minimapa+TEMPO przeniesione na prawy-dół**; popupy dropdownów fixed (bez obcięcia).
- **Bramki:** tsc=0 · combat 6/6 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · logic 192/207 (te same 15) · trade-routes 35/35 + income 49/49 · basket-transfer 8/8 · map-gen determinizm A=B PASS · smoke deploy/walka/rzeka 0 błędów konsoli · VERIFY OK.
- **md5:** `49563095b8a5d8552b4368ff4dca9ea3` · stamp `49563095`. Bundel 27,9 MB. Publikowała sesja chmurowa.
- **Test:** bitwa na hexie z rzeką → jednostka w brodzie ma w tooltipie karę, obrońca brzegu bonus; dyplomacja → koszyk z pozycją „Drewno ×10 (pakiet)"; bitwa → ikony nad rosterem (hover = nazwa), minimapa na prawym dole, brak dolnego paska.

## ROBOCZA `f736ca21` — 2026-07-23 · OBLĘŻENIE: zabudowa za murem + gruz wyłomu · IMIONA WŁADCÓW (60, z Antykiem) — **ZASTĄPIONA** (→ `49563095`)

- **Zawartość (commity `115484a`+`8770bdc`, na `48249d90`):**
  1. **Oblężenie (#8):** miasto za murem ma ZABUDOWĘ (do 38 budynków low-poly: 3 rozmiary + 2 „publiczne", dachy dwuspadowe/płaskie, paleta ziemisto-kamienna z jitterem; deterministycznie z `tileJitter`, gęściej przy bramie, korytarz od bramy wolny; InstancedMesh, zero wpływu na pathfinding — tylko w bitwach `siege`). **Gruz wyłomu:** 7 brył (boxy+kamienie) z jitterem pozycji/rozmiaru/koloru per kafel wyłomu (było 4 identyczne).
  2. **Imiona władców (ZAAKCEPTOWANE 2×):** `civs.json` pole `wodzowie` — 15 cyw × 4 epoki = 60 imion (Antyk = zapas, patrz `dyspozycje/DECYZJA-IMIONA-WLADCOW-2026-07-23.md`). W grze: imię przy medalionie na karcie dowódcy bitwy, w preBattle i w dyplomacji (obu kartach), dobór wg epoki z fallbackiem antyk→żelazo→brąz→kamień.
- **Bramki:** tsc=0 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · logic 192/207 (te same 15 pre-istniejących) · map-gen determinizm A=B PASS · smoke oblężenie+legacy 0 błędów konsoli · VERIFY OK.
- **md5:** `f736ca211c25d646cbaadeb4b9824028` · stamp `f736ca21`. Bundel 27,9 MB. Publikowała sesja chmurowa (autonomicznie, C-ORG-Q17=A).
- **Test:** szturm na miasto → za murem domy, przy bramie „ulica"; wyłom katapultami → rumowisko w luce; karty dowódców → portret + IMIĘ władcy (np. Rzym/Kamień = Romulus); dyplomacja → imię pod nazwą cywilizacji.

## ROBOCZA `48249d90` — 2026-07-23 · PORTRETY WŁADCÓW w medalionach (bitwa + preBattle + dyplomacja) — **ZASTĄPIONA** (→ `f736ca21`)

- **Zawartość (commit `2cb3685`, na `6bb7fedc`):** wdrożenie paczki Design PORTRETY-WLADCOW v3/v4 (30 portretów: 15 cywilizacji × Kamień/Brąz, źródło Gemini/Maciej, cięcie Design). Nowy `leaderPortraits.ts` (30×256px JPEG inline, +0,38 MB bundla). Medaliony pokazują portret władcy wg CYWILIZACJI i EPOKI (żelazo→brąz→kamień przy braku; Żelazo TODO — czeka na arkusz): karty dowódców HUD bitwy (obwódki stron bez zmian), karty dowódców preBattle nakładki, medalion rozmówcy i gracza w dyplomacji (hero 150px + 64px). Fallback obowiązkowy: brak portretu → dotychczasowa ikona cywilizacji. `BattleOpts.attackerEra/defenderEra` opcjonalne (legacy=kamień); ery z `empireEpochForOwner` we wszystkich ścieżkach startu bitwy.
- **Bramki:** tsc=0 · zrzut E2E: Rzym/Grecja z portretami w kołach medalionów, cover-fit, obwódki OK · VERIFY OK.
- **md5:** `48249d9089c15bc3967e55365601b719` · stamp `48249d90`. Bundel 27,9 MB. Publikowała sesja chmurowa.
- **Test:** bitwa → karty dowódców z twarzami władców; atak na wroga → preBattle z portretami w rogach; dyplomacja → portret rozmówcy w medalionie. Cywilizacja bez portretu (nie powinno być) → ikona jak dotąd.

## ROBOCZA `6bb7fedc` — 2026-07-23 · PAKIET: HUD TW-v5 F3 (komplet 3/3) + PREBATTLE nakładka v1.1 + DYPLOMACJA zaległości silnika — **ZASTĄPIONA** (→ `48249d90`)

- **Zawartość (commit `bfe377d`):** trzy tematy jednym bundlem:
  1. **HUD TW-v5 FAZA 3 (finał makiety):** C-12 Koniec bitwy 1:1 z klatką 5 (medalion laur/miecze, kafle strat „ludzi", CTA, hint), C-23 Szczegóły bitwy 1:1 z klatką 4 (2 kolumny ATK/OBR, Zniszczone/Rozbite/Ocalałe, „1240→862 ludzi po bitwie") — przepięte z odrzuconego postBattleSummary; dolny toolbar deploy = SAME IKONY 46×46 z pigułką na hover; karty rosteru z nazwą jednostki (medaliony typu); nagłówki grup pasek+chevron (fix nadpisywania stylu); minimapa „rozstawianie" bez Tempo w deploy; panele ~72–86%+blur 7–9; sprzątnięcie martwych pól F1/F2.
  2. **PREBATTLE nakładka v1.1 (kanon Design):** preBattle.ts + cityAttackChoice.ts jako kompaktowe nakładki NAD mapą (mapa widoczna — koniec pełnoekranowych modali): panel dół-środek z kickerem/terenem(ikona+nazwa)/paskiem szans/pigułkami modyfikatorów, karty dowódców w rogach, rostery przy krawędziach (max 8 + „+N"), atak na miasto: karty OBLEGAJ [1]/SZTURM [2], obrona: strony odwrócone + „Wycofanie niedostępne" zamiast Wycofaj. API bez zmian; braki danych (Region, marker hexa, mgła wywiadu, szanse szturmu) = TODO w kodzie.
  3. **DYPLOMACJA zaległości:** SZYBKA UMOWA = realna auto-uczciwa oferta (greedy na progu diplomacyFairGivePn, koszyk edytowalny); „Zerwij" AKTYWNE (modal potwierdzenia, `zerwanie_traktatu` −15 Zaufania, sojusz→pokój); NOWY diplomacy-goods.ts — koszyk pokazuje faktyczne dobra obu stron (city.surowce + brąz/żelazo civ-wide). Wycena ilościowa surowców miejskich odłożona (ABC).
- **Bramki:** tsc=0 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · logic 192/207 (identyczne 15 pre-istniejących) · map-gen determinizm A=B PASS · zrzuty E2E: toolbar ikonowy, walka, C-12, C-23, 8 plansz terenowych — 0 błędów konsoli · VERIFY OK.
- **md5:** `6bb7fedce3ff5e84ae18a22d28169608` · stamp `6bb7fedc`. Bundel 27,5 MB. Publikowała sesja chmurowa (autonomicznie, C-ORG-Q17=A).
- **Test:** bitwa → toolbar z samych ikon (najedź = pigułka), karty rosteru z nazwami, koniec bitwy = nowy ekran Zwycięstwo/Porażka, „Szczegóły bitwy" = 2 kolumny; atak na wroga na mapie → pre-battle jako mała nakładka (mapa widoczna); dyplomacja → SZYBKA UMOWA wypełnia koszyk, „Zerwij" działa z potwierdzeniem.
- *(przejściowa `47be2c02` — ta sama zawartość bez pkt 3, zastąpiona w ~30 min, nie trafiła do playtestu)*

## ROBOCZA `2c19fcb3` — 2026-07-23 · HUD BITWY TW-v5 fazy 1-2 (dowódcy/zegar/przewaga + tempo + stany kart + tooltip + bez raila) — **ZASTĄPIONA** (→ `6bb7fedc`)

- **Zawartość (na `2c67014c`, commity `0f1455e`+`4726e97`):** wdrożenie makiety POLE-BITWY-TW-v5 fazy 1-2: **F1** — karty dowódców obu stron (medalion z pierścieniem HP, liczniki typów) + ZEGAR bitwy + pasek PRZEWAGI ze złotym markerem (górny środek); panel TEMPO (pauza + x1/x2/x4 + AUTO) przy minimapie. **F2** — stany kart rosteru C-09 v5 (puste sloty +, MARTWA ✕/„Padła", ROZBITA „Rout"; FIX: stany były odfiltrowywane i nigdy się nie renderowały), bogaty tooltip jednostki (Postawa z realnych rozkazów/doktryn, Grupa N, Zdrowie/Morale/Amunicja), **prawy rail 56px ZLIKWIDOWANY** (M/MUZ/H/I+Pomoc → popup zębatki ⚙ przy „Wycofaj się"; ›› i WYCOFAJ w prawym-górnym klastrze; skróty klawiszowe bez zmian). Build z czystego commita F2 (worktree — F3 w toku w drzewie roboczym).
- **Bramki:** tsc=0 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · map-gen determinizm PASS · E2E deploy→walka→koniec + tooltip + popup zębatki bez błędów konsoli · VERIFY OK.
- **md5:** `2c19fcb34433c8d14ddc16f62b6e8c14` · stamp `2c19fcb3`. Publikowała sesja chmurowa. **F3 w toku** (C-12/C-23 + panele blur + ikonowy toolbar + medalionowe karty) — osobny deploy po bramkach.

## ROBOCZA `2c67014c` — 2026-07-23 · BITWA: czyste pole na czarnym tle (bez obramówek) — **ZASTĄPIONA** (→ `2c19fcb3`)

- **Zawartość (na `8aff7266`):** usunięte niebieskie/czerwone pasy boczne wokół pola bitwy (decyzja Macieja); tło/mgła/grunt/marginesy → czerń; domyślny kadr ciaśniejszy (pole wypełnia ekran); złota ramka strefy gry zostaje. FIX: przeciek niebieskiego (kolor rzeki w marginesie) przez szparę na krawędziach kafli — marginesy po krawędziach + zakładki, weryfikacja pixel-exact. BACKLOG (decyzja Macieja „kiedyś"): większe plansze — czarne tło zastąpić graficznie ułożonym lądem, strefa walki wydzielona ramką jak obecnie.
- **Bramki:** tsc=0 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · map-gen determinizm+rzeki PASS · zrzuty (rzeka/wzgórza/pustynia/legacy) czyste, 0 błędów konsoli · VERIFY OK.
- **md5:** `2c67014c9ae05e7f86afac445f1ec039` · stamp `2c67014c`. Publikowała sesja chmurowa.

## ROBOCZA `8aff7266` — 2026-07-23 · DYPLOMACJA TW: dwustronny panel + stół negocjacji + blokady (makieta FINAL 3/3) — **ZASTĄPIONA** (→ `2c67014c`)

- **Zawartość (na `c7f70b27`):** pełne wdrożenie ZATWIERDZONEJ makiety DYPLOMACJA FINAL (9 pkt integratora, 3 fazy): **F1 dane** — spójne blokady 13 akcji z progami silnika (notki „zablokowana — wymaga Zaufania 91 (masz X)"), FIX: Żądanie trybutu wcześniej NIE bramkowało Respektu; rejestr czynników relacji per-para (save round-trip) → rozbicie „Za co Cię lubią/nie lubią" z realnych delt. **F2 layout** — dwustronny (karta gracza: medalion/Moc/potencjał sojuszniczy/SKARBIEC/dobra ↔ karta rozmówcy: relacje TYLKO tu + nastawienie), baner statusu formalnego (nazwa+od X tur+kara zerwania), stół negocjacji 3 kolumny (Możliwe/Aktywne/Żądania-Oferty), koszyk PN z bilansem jednorazowo vs /turę + werdykt. **F3 styl** — ikonowy pasek akcji 46px (WOJNA/POKÓJ/SOJUSZ/PAKT/HANDEL/DAR/WASAL, hover-pigułki, disabled wg blokad) + SZYBKA UMOWA, ikonowe „Zerwij", granat 1E + złoty primary z makiety.
- **Bramki:** tsc=0 · diplomacy 144/146 (2 pre-istniejące fixtury progów) · diplomacy-locks 67/67 (nowy) · tech/research/unit-replace/map-gen zielone · logic 192/207 baseline · E2E pokój→pakt→baner→active zweryfikowane · VERIFY OK.
- **md5:** `8aff7266da86e3022d1ddeb52abe74a3` · stamp `8aff7266`. Bundel 27,4 MB. Publikowała sesja chmurowa.
- **Test:** otwórz dyplomację → audiencja = dwustronny panel; zablokowane akcje z notkami progów; zawrzyj pakt → baner + „już zawarta" + Aktywne traktaty; pasek ikon na dole (hover = nazwa); rozbicie relacji nad stopką.

## ROBOCZA `c7f70b27` — 2026-07-23 · BITWA: wizualia sceny + presety terenu wg hexa + rzeka S — **ZASTĄPIONA** (→ `8aff7266`)

- **Zawartość (na `98c4ede1` Cursora, rebase czysty):** uatrakcyjnienie sceny 3D bitwy (ACES tone mapping, HemisphereLight, cieplejsza mgła/tło, MeshStandard kafli + wariacja, wyciszona siatka, banery stron nad oddziałami, kępy trawy 7944 + drobny dekor, gęstszy las, mur oblężniczy: materiały+wieżyczki+wariacja segmentów); **PRESETY plansz bitwy wg terenu hexa świata** (łąka/równina/wzgórza/góry/las/pustynia/wybrzeże/rzeka; wpięte w 4 ścieżki startu bitwy; debug `?bt=`); **rzeka = ciągłe koryto S** przez całe pole z brodami (carve zamienia wodę pod formacjami na Ford — koryto nieprzerwane), jeziorka na łące/równinie; fix czarnych drzew (instanceColor). Legacy bez presetu bit-for-bit. + dostawy Design: POLE-BITWY-TW-v5, DYPLOMACJA v1.1→FINAL (ZATWIERDZONA).
- **Bramki:** tsc=0 · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · manpower 36/36 · map-gen determinizm+rzeki PASS · logic 192/207 — **identycznie jak czysty origin/main** (porażki kultura/Świątynia + koszty badań pre-istnieją z Batch B, nie z tej paczki) · VERIFY OK.
- **md5:** `c7f70b271ceff1f1e711494fb519f1c5` · stamp `c7f70b27`. Bundel 27,4 MB. Publikował: sesja chmurowa (Claude Code) po sygnale Macieja „Cursor skończył".
- **Test:** bitwa na hexie z rzeką → ciągłe S + brody; wzgórza/góry → grzbiety; pustynia → piach; `?bt=rzeka` itd. wymusza planszę; oblężenie → mur z wieżyczkami.

## ROBOCZA `98c4ede1` — 2026-07-23 · AUDYT 9a0ca985 luki: ruda stock + KULT-04 Power + warzelnia — **ZASTĄPIONA** (→ `c7f70b27`)

- **Zawartość:** Stock ruda/ruda_zelaza z kopalni_miedzi/kopalnia → `city.surowce` (2/t, łańcuch konwerterów brąz/żelazo); **KULT-04 A** — składniki Power: kultura imperium (×0,5) + jedność religii (×25/miasto) w `power-objective.ts` + wpięcie `main.ts`; warzelnia_soli teren wybrzeże w JSON; resources.json ruda miedzi vs ruda żelaza; fix palac techUnlock `-`; kuznia wymagania bez legacy cyna.
- **Odłożone:** faza 3 koszty materiałowe budynków/jednostek (B-SUROW-BUD — tylko access gates, nie stock costs); KULT-DYP-01 dyplomacja (osobna decyzja).
- **Bramki:** tsc=0 · power-objective 15/15 · converters 19/19 · culture-religion 65/65 · VERIFY OK.
- **md5:** `98c4ede16e506df393369a49dabe25bb` · stamp `98c4ede1`.

## ROBOCZA `9a0ca985` — 2026-07-23 · FAZA 2: surowce+budynki+spichlerz tier+kultura presja — **ZASTĄPIONA** (→ `98c4ede1`)

- **Zawartość:** B-SUROW-BUD-03 deski wycofane (resources/tech/units/tartak/converters); bramki epok drewno/kamień/cegła w `building-resource-gate.ts` + imperium w `production.ts`/panel; 7 konwerterów (mielerz 2→1, cegielnia 2+1, odlewnia żelaza, wielka kuźnia); Spichlerz II (`spichlerz_ii` upgrade, cap 150, bufor 70%); Sól w resources; KULT-PRESJA tick w turze; KULT-PRESJA-05 capture mix; KULT-DYP-01 dyplomacja AND; fix garncarnia w turn-economy.
- **Odłożone (znane luki):** stock ruda miedzi/żelaza z terenu do magazynu miasta; KULT-04 Power składniki; warzelnia_soli teren wybrzeże w JSON; kamień/cegła jako koszt materiałowy (faza 3).
- **Bramki:** tsc=0 · converters-test 18/18 · conquest-stability 27/27 · vite build OK.
- **md5:** `9a0ca98598c7d89af47dbb10789df868` · stamp `9a0ca985`.

## ROBOCZA `5000ee9f` — 2026-07-22 · FAZA 1: urealnienie dostępu surowców — **ZASTĄPIONA** (→ `9a0ca985`)

- **Zawartość:** `resource-access.ts` — aktywny dostęp wymaga złoże+ulepszenie na heksie (glina, miedź, ruda/żelazo/węgiel, sól, koń); wyjątki: tartak, kamieniołom, warzelnia na wybrzeżu; hodowla Model B (bydło/owce/lama bez złoża). Panel miasta: potencjał vs dostęp aktywny. Pilot bramki budynku: Garncarnia/Cegielnia (glina) — bez rozszerzania.
- **Odłożone (faza 2):** pełne bramki budynków per surowiec; faza 3: magazyny + koszty materiałowe.
- **Bramki:** tsc=0 · deposit-building-gate 24/24 · eko-tech-p5 11/11 · food-hodowla 24/24.
- **md5:** `5000ee9fce6fa0c332303784ff045eb8` · stamp `5000ee9f`.

## ROBOCZA `7e038328` — 2026-07-22 · FIX: suwak żywność→armia per miasto — **ZASTĄPIONA** (→ `5000ee9f`)

- **Bug Macieja:** suwak podziału żywności (wzrost vs armia) w panelu miasta był wspólny dla całego imperium (`EmpireFoodState.procentRozwoj` per ownerId).
- **Fix:** pole `City.procentRozwoj` per miasto; silnik (`turn-economy`, `advanceEmpireFood`) i panel czytają/zapisują per miasto; migracja starych save z `empireFoodStates.procentRozwoj`.
- **Bramki:** tsc=0 · empire-food-b5 25/25 · research GREEN · upkeep 58/58.
- **md5:** `7e038328910eb09f9ca90beaf06a5e59` · stamp `7e038328`.

## ROBOCZA `b6353296` — 2026-07-22 · wycofanie #48 (decyzja gameplayowa Macieja) — **ZASTĄPIONA** (→ `7e038328`)

- **Jedyna zmiana vs `80a32769`:** cofnięta naprawa #48 — Moc wyeliminowanych cywilizacji ZNÓW liczy się w mianowniku dominacji (Maciej: „to była decyzja z gameplayu"). Commity `4fdc0ed` + `773f49c`. Przyszłe audyty: NIE zgłaszać jako błąd.

## ROBOCZA `80a32769` — 2026-07-22 · NAPRAWY AUDYTU: 51 błędów (subagenci Sonnet)

- **Zawartość:** komplet napraw audytu-53 — m.in. KRYTYCZNE: #2 auto-szturm nie kasuje już całej armii (straty proporcjonalne), #1 koszyk „jednostka" wyłączony (etap 1); dyplomacja bez exploitów (zaufanie z pokryciem #16, kursy symetryczne #20, trybut z limitem #21, bramki wasalizacji/przemarszu #19/#46); save/load kompletny (wioski #13, obozy #42, religia #43, skarbce AI #44, profile miast-państw #15); AI buduje budynki #31 i nie atakuje sióstr #24; combat: 25 jednostek odzyskało pancerz #10, super-jednostki max 1 #11; wydajność (#27-30, #56-57); UI-prawda (#17 bilans, #18 HP). Pełny log: `AUDYT-NAPRAWY-LOG.md`.
- **Commity:** A-D `6f11b3f`/`55d7597`/`bb9d264`/`d6837e1` + docs `90369f8` (po incydencie kolizji z integratorem — naprawy uratowane ze stashy, inwentaryzacja 50/51 + odtworzenie #71).
- **Bramki:** tsc=0 · combat 6/6 · tech-tree 19/0 · research GREEN · unit-replace 10/10 · logic-test 6 faili = dług integratora po balansie badania ×2 (94b7f6d; przed naprawami było 14).
- **Poza zakresem:** #41 Wielka Kuźnia (decyzja Macieja), #22 (już naprawione `b1a7a61`).

## ROBOCZA (gra-robocza\Gra-ROBOCZA.html — wskazywana przez START.html)

- 2026-07-22 · stempel: ROBOCZA · **7e038328** · md5 pliku `7e038328910eb09f9ca90beaf06a5e59` · **FIX: suwak żywność→armia per miasto** — na `7238588c`:
  **Bug Macieja:** zmiana suwaka wzrost/armia w jednym mieście zmieniała ustawienie we wszystkich miastach. **Fix:** `City.procentRozwoj` per miasto; panel zapisuje tylko bieżące miasto; silnik sumuje wkłady per miasto do zapasów armii.
  tsc=0 · empire-food-b5 25/25 · publish `gra-robocza/Gra-ROBOCZA.html`. · **AKTUALNA** · Test: stamp `7e038328` · 2 miasta → różne suwaki → każde zachowuje własne %.

- 2026-07-22 · stempel: ROBOCZA · **7238588c** · md5 pliku `7238588c73778b8761ec5bf999268b09` · **FIX: dialog POŁĄCZENIE ARMII odłożony do startu tury gracza** — na `d7ad2f76`:
  **Bug Macieja:** dialog łączenia armii („POŁĄCZENIE ARMII") pojawiał się w trakcie tury przeciwnika (produkcja end-turn: np. Wojownik na heks z Oszczepnikiem). **Fix:** `deferredMergePrompts` — kolejka promptów; `promptMergeIfCoLocated` odłożone gdy `endTurnInProgress`; `flushDeferredMergePrompts()` po „Tura N — twoja kolej" (razem z `flushDeferredPlayerUnitReveals`). Rush-buy / ruch w swojej turze bez zmian (natychmiast).
  tsc=0 · unit-replace 10/10 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `7e038328`) · Test: stamp `7238588c` · Rekrutuj na heks z jednostką → Zakończ turę → dialog dopiero po AI.

- 2026-07-22 · stempel: ROBOCZA · **d7ad2f76** · md5 pliku `d7ad2f76e755e42352bb421a1a19c2fa` · **UI: opisowe nazwy zapisów** — na `c72ab1b8`:
  **Zapis gry (Maciej):** domyślna nazwa sejwu z kontekstu rozgrywki zamiast generycznego „Zapis · tura N". Format: `{stolica} · rok {YYYY} p.n.e. · tura {N} · {rozmiar mapy} · {trudność}`; szybki zapis i autozapis z prefiksem. Moduł `save-label.ts`, pole nazwy max 72 znaki.
  tsc=0 · save-label-test OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `7238588c`) · Test: stamp `d7ad2f76` · Menu pauzy → Zapisz grę → nazwa np. „Ateny · rok 3500 p.n.e. · tura 10 · Standardowy · Normalny".

- 2026-07-22 · stempel: ROBOCZA · **c72ab1b8** · md5 pliku `c72ab1b8c45c61364f754daf085ae41f` · **FIX: widoczność nowych jednostek po end-turn** — na `2f32fbea`:
  **Bug Macieja:** jednostki z produkcji/rekrutacji pojawiały się na mapie od razu po „Zakończ turę", zanim ruch AI. **Fix:** `deferredPlayerUnitRevealIds` — ukryte w renderze do końca fazy AI; `flushDeferredPlayerUnitReveals()` przy starcie nowej tury gracza. Rush-buy w trakcie tury bez zmian (natychmiast).
  tsc=0 · unit-replace 10/10 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `d7ad2f76`) · Test: stamp `c72ab1b8` · Rekrutuj → Zakończ turę → jednostka widoczna dopiero po ruchu AI.

- 2026-07-22 · stempel: ROBOCZA · **2f32fbea** · md5 pliku `2f32fbea89183d908099e984414db2cb` · **UI: Ranking Moc ↔ mgła wojny (FoW)** — na `6a9b8e72`:
  **Ranking Moc (Maciej):** widoczność listy powiązana ze stanem mgły wojny zamiast osobnego przełącznika testowego. **FoW włączony (domyślnie / F):** tylko odkryte pełne cywilizacje + gracz (bez miast-państw). **FoW wyłączony (F / baton minimapy):** wszystkie pełne cywilizacje. Usunięto `debugPowerRankingAll` (URL/localStorage/checkbox [TEST]).
  tsc=0 · power-ranking 10/10 · display-names 11/11 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `c72ab1b8`) · Test: stamp `2f32fbea` · FoW ON → ranking tylko odkryte · F (FoW OFF) → wszystkie pełne nacje.

- 2026-07-22 · stempel: ROBOCZA · **6a9b8e72** · md5 pliku `6a9b8e729d52f1adb2ea556a265b12e0` · **UI: Ranking Moc — bez miast-państw + mgła wojny** — na `cd615c1e`:
  **Ranking Moc (Maciej):** lista pokazywała miasta-państwa (np. „Ur · miasto-państwo") i nieodkryte cywilizacje. **Fix:** `filterOwnersForPowerRanking` — tylko pełne nacje + odkryte (`diplomaticallyDiscoveredOwners`); gracz zawsze widoczny. **TEMP test:** `?debugPowerRankingAll=1` lub `localStorage civ.debugPowerRankingAll=true` + checkbox [TEST] w panelu Moc (ROBOCZA) — pokaż wszystkie pełne cywilizacje bez mgły (miasta-państwa nadal ukryte).
  tsc=0 · power-ranking 10/10 · power-objective 12/12 · display-names 11/11 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `2f32fbea`) · Test: stamp `6a9b8e72` · Nowa gra → Ranking Moc bez „· miasto-państwo" · odkryj AI → pojawia się w rankingu.

- 2026-07-22 · stempel: ROBOCZA · **cd615c1e** · md5 pliku `cd615c1e5a332919b72a183a7f980c60` · **MAPA: FIX spawn cywilizacji — continent-aware + fallback** — na `e5cb5ab6`:
  **Bug Macieja:** suwak 15 cywilizacji → na mapie ~10; puste kontynenty, reszta zatłoczona; „brak miejsca".
  **Przyczyna:** `computeClusters` stawiał środki klastrów greedy-shuffle (bez kontynentów); twardy min 12 hex + brzeg → za mało środków; `buildClusterLayoutWithEdgeCapital` zwracał pusty klaster na małym regionie; `aktywneTypy` raportowało żądaną liczbę zamiast faktycznej.
  **Fix:** rozmieszczenie środków po masach lądu (flood-fill) → po 1 na kontynent, potem round-robin; adaptacyjny min dystans; progresywne luzowanie 12→6; fallback layout gdy edge-capital nie mieści się; `requestedTypy` vs faktyczne `aktywneTypy`.
  tsc=0 · cluster-start 109/109 · map-gen-regression OK · map-scale-menu 32/32 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `6a9b8e72`) · Test: stamp `cd615c1e` · Super Huge 15 typów → 15 klastrów · kontynenty z cywilizacjami.

- 2026-07-22 · stempel: ROBOCZA · **e5cb5ab6** · md5 pliku `e5cb5ab6a5dbe77b618e34ebd767951d` · **MAPA: FIX odstęp 3 hex między miastami-państwami** — na `05d689e3`:
  **Miasta-państwa (Maciej):** `buildSameTypeRivalCandidateHexes` scalało przepustki bez sprawdzania odległości para-po-parze (bug: kandydaci 1 hex od siebie). **Fix:** `tryAdd` wymaga min 3 hex od rdzenia, max 3 hex, i min 3 hex od już zebranych hexów. Pre-plan (`packRivalCitiesAroundCore`) bez zmian — już OK.
  tsc=0 · cluster-start 103/103 · map-gen-regression OK (timing standard 5.12s — znany flake) · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `cd615c1e`) · Test: stamp `e5cb5ab6` · Nowa gra → stolica → państwa min 3 hex od siebie i od stolicy.

- 2026-07-22 · stempel: ROBOCZA · **05d689e3** · md5 pliku `05d689e333d9d29543f1da9e1bebaa9b` · **MAPA: twardy klaster miast-państw 3 hex** — na `4760325c`:
  **Miasta-państwa (Maciej):** spawn w pierścieniu **min 3 / max 3 hex** od stolicy gracza — ciasne skupisko (stałe `CLUSTER_CITY_STATE_MIN_HEX` / `CLUSTER_CITY_STATE_MAX_HEX`). Pre-plan mapgen + runtime spawn (`packRivalCitiesAroundCore`) spójne. AI resupply/konsolidacja: promień 3 hex (`clusterCityStateRadius`).
  tsc=0 · cluster-start 93/93 · map-gen-regression OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `e5cb5ab6`) · Test: stamp `05d689e3` · Nowa gra → załóż stolicę → miasta-państwa w pierścieniu 3 hex (Sparta, Kapua…).

- 2026-07-22 · stempel: ROBOCZA · **4760325c** · md5 pliku `4760325c0191876a107104b75622297b` · **BALANS: Super Huge miasta-państwa 7·8·9** — na `6865baf8`:
  **Super Huge (`superogromny`):** menu miast-państw min **7** · domyślnie **8** · max **9** (było 6·9·9). Panel-E `e-start-params.json` default **8**. `MAX_MIAST_PANSTWA=9` bez zmian.
  tsc=0 · map-scale-menu 32/32 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `05d689e3`) · Test: stamp `4760325c` · Super Huge → kreator MP 7·8·9 · domyślnie 8.

- 2026-07-22 · stempel: ROBOCZA · **6865baf8** · md5 pliku `6865baf802e6ced6a0721e2a1f4d9c0b` · **BALANS: cap miast-państw max 9 + FIX chatki spawn** — na `ae64786b`:
  **(1) Miasta-państwa (Maciej):** za dużo w klastrze (do 18 po ×2 2026-07-20). Przywrócono kanon max **9** (+ stolica = 10); skala: Malenki 3 · Mały 4 · Standard 6 · Duży 7 · Ogromny 8 · Super Huge 9. `clampMiastaPanstwaCount` w spawn/generator/kreator; Panel-E `e-start-params.json`.
  **(2) Chatki:** spacing 3 hex / min od miasta 3 hex — pełny spawn wg `typy×(1+państwa)×trudność` (mniej chat na mniejszej mapie po cap MP).
  tsc=0 · map-scale-menu 32/32 · city-names-pool 12/12 · villages 39/39 · map-gen-regression OK · verify OK. · **ZASTĄPIONA** (→ `4760325c`) · Test: stamp `6865baf8` · Standardowy → kreator max 7 MP · klaster ~7 miast tego typu · chatki proporcjonalne.

- 2026-07-22 · stempel: ROBOCZA · **ae64786b** · md5 pliku `ae64786b05cd77d6dbb8d807ac209b4e` · **FIX: AI/miasta-państwa — farmy dopiero po Rolnictwie (koszt nauki)** — na `59d90c13`:
  **Bug Macieja:** obce cywilizacje mają farmy w turze 2–3, zanim gracz zdąży zbadać Rolnictwo. **Przyczyna:** AI kończyło tech natychmiast (`aiDone.add` co turę), bez puli Nauki i `researchStep`; brak bankowania `aiEcon.nauka`. **Fix:** `aiNaukaPoolByOwner` + `aiBadanaByOwner` + `runAiResearchForOwner` (symetria z graczem: bank nauki → chooseAIResearch → researchStep); usunięto instant-unlock w pętli AI.
  tsc=0 · ai-improvements-test 15/15 · owner-epoch-test 13/13 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `6865baf8`) · Test: stamp `ae64786b` · Nowa gra Kamień → obserwuj miasto-państwo: brak farm w turach 1–3; farmy dopiero po ~koszt Rolnictwa (8 PN szybko / 16 standard).

- 2026-07-22 · stempel: ROBOCZA · **59d90c13** · md5 pliku `59d90c13cf1056f05f669465a760f758` · **FIX: pierścień Nauki wyśrodkowanie + dyplomacja pierwszy kontakt** — na `35fd5449`:
  **(1) Nauka:** pierścień postępu koncentryczny z rantem ikon (`.civ-science-prog-ring`, bez podwójnego ringu).
  **(2) Dyplomacja (Maciej):** Syrakuzy w liście mimo braku miasta w mgle; dar przed kontaktem. **Przyczyna:** kontakt z `explored` (hex widziany kiedyś) ≠ render miasta (`visible`); lista po odkryciu mgły, nie po formalnym kontakcie; AI darowało po samym hexie. **Fix:** `diplomaticallyDiscoveredOwners` (widoczność choć raz) + auto-audiencja; lista tylko po `diplomaticContactEstablished`; dary/handele/trybut/sojusz AI dopiero po audiencji.
  tsc=0 · diplomacy-layers-test 8/8 · diplomacy-proposal 64/64 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `ae64786b`) · Test: stamp `59d90c13` → pierścień Nauki OK · Nowa gra → spotkaj miasto-państwo → auto-audiencja → „Nawiąż kontakt" → wpis w dyplomacji; niewidoczne miasta nie w liście; brak darów przed kontaktem.

- 2026-07-22 · stempel: ROBOCZA · **35fd5449** · md5 pliku `35fd54491f7fda7921bf60e218bac727` · **FIX: epoka startowa miast-państw AI (Kamień, regresja)** — na `43510348`:
  **Bug Macieja:** miasta-państwa / obcy AI wyglądają jak Brąz (megaron) mimo startu w Kamieniu. **Przyczyna:** `fillAiOwnerCivMap` wołało `setupAiOwnerEpoch` na starych ownerId przed regeneracją mapy — ryzyko niespójnego `aiResearchDone` (Brązownictwo → era 2); brak `reconcileAllOwnerErasFromResearch` przed pierwszym `cityRenderer.sync` w klastrze. **Fix:** epoka tylko w `applyClusterStartPlan` / `initAllAiOwnersForNewGame` / rywale; `aiResearchDone.clear()` w klastrze; reconcile przed sync klastra + po `initAllAiOwners`; `repairAiRosterFromMap` → `setupAiOwnerEpoch`.
  tsc=0 · owner-epoch-test 13/13 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `59d90c13`) · Test: Ctrl+F5 START.html → stamp `35fd5449` · Nowa gra Kamień → załóż miasto → miasta-państwa: tipi/ognisko (P1), nie megaron.

- 2026-07-22 · stempel: ROBOCZA · **43510348** · md5 pliku `435103481edfde9081d2207425ac18a3` · **FIX: pierścień Nauki — jeden rant (bez ring-in-ring)** — na `30e510b1`:
  **Przyczyna:** CSS `border:2px gold` na medalionie Nauki + nakładka SVG = podwójny pierścień (złoty w złotym).
  **Fix:** usunięto CSS border na `.tb.science` i chipie z pierścieniem; SVG (`scienceProgressRing.ts`) **jest** rantem postępu (złoto `#a08030` = `--tg-gold-dim`, niebieski rośnie zgodnie z ruchem wskazówek). Toolbar 52px stroke 2px; chip 30px stroke 2px.
  tsc=0 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `35fd5449`) · Test: Ctrl+F5 START.html → stamp `43510348` → ikona Nauki: jeden pierścień; 0% cały złoty, ~50% pół niebieski, 100% cały niebieski.

- 2026-07-22 · stempel: ROBOCZA · **30e510b1** · md5 pliku `30e510b1885bf1da7362f1b45b62b392` · **FIX: Praca — pula imperium bez utraty 1 jednostki (zaokrąglanie)** — na `c254006d`:
  **Przyczyna:** `Math.floor(pracaNetto)` + ułamkowy mnożnik Porządku dawało np. 9 w silniku przy podziale HUD 7+3=10; pula dostawała doPuli+overflow=9 zamiast 10.
  **Fix:** `cityPracaInteger` (Math.round) w `economy.ts`/`turn-economy.ts`; `pracaImperialPoolGain` w `main.ts` — pusta kolejka → całe `doPuli+doBudynkow`, aktywny budynek → tylko `doPuli`.
  tsc=0 · production-overflow-test 20/20 · wire-ekonomia 37/37 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `43510348`) · Test: Ctrl+F5 START.html → stamp `30e510b1` → Ateny bez budynku w kolejce, 10 Pracy (3+7) → pula +10/turę.

- 2026-07-22 · stempel: ROBOCZA · **c254006d** · md5 pliku `c254006dccb94e25a4121b3f377c157a` · **HUD: pierścień postępu badań (Nauka) + hook researchProgress** — na `9b539cb7`:
  **Medalion Nauki** (górny chip 6C + lewy toolbar mapy): złoty pierścień = pozostało; niebieski rośnie zgodnie z ruchem wskazówek. Hook: `researchProgress` z `buildHudState` (`player.nauka / koszt badanej tech`), nie postęp epoki. Moduł `scienceProgressRing.ts`; `resolveResearchProgress` w `hud.ts`.
  tsc=0 · verify OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `30e510b1`) · Test: Ctrl+F5 START.html → stamp `c254006d` → wybierz tech → pierścień rośnie co turę; po odkryciu reset.

- 2026-07-22 · stempel: ROBOCZA · **9b539cb7** · md5 pliku `9b539cb74bfc487a8c1fd7ef5d4af27b` · **UI: pierścień postępu badań na HUD Nauki** — na `c54dae3b`:
  **Lewy toolbar + chip Nauka (górny pasek):** pierścień timer złoto→niebieski (SVG stroke-dashoffset), rośnie zgodnie z ruchem wskazówek od góry; progress = `researchProgress` z `buildHudState` (`player.nauka / koszt badanej tech`), nie postęp epoki. Nowy moduł `scienceProgressRing.ts`; hooki w `mapToolbarHud.ts`, `hudChip6c.ts`, `hud.ts`.
  tsc=0 · verify OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `c254006d`) · Test: Ctrl+F5 START.html → stamp `9b539cb7`; wybierz tech → pierścień złoty z rosnącym niebieskim segmentem; po ukończeniu cały niebieski; nowy cel = reset złoty + mały niebieski.

- 2026-07-22 · stempel: ROBOCZA · **c54dae3b** · md5 pliku `c54dae3be8b3ab1cc0e5eebf7d04f9f0` · **FIX: Zwiadowca 0 Manpower** — na `98889578`:
  **Zwiadowca (`typeId=Zwiadowca`)** nie zużywa puli Manpower przy rekrutacji (zakup złotem + ukończenie kolejki produkcji). Hook: `unitManpowerCostForType` w `manpower.ts`; `tryDeductUnitSpawnCosts` / `canAffordUnitManpower` / `refundUnitSpawnToCity` z opcjonalnym `typeId`; `production.manpowerCostOf`; UI karty rekrutacji pokazuje `0 👤`.
  tsc=0 · manpower-test 36/36 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `9b539cb7`) · Test: Ctrl+F5 START.html → stamp `c54dae3b`; rekrutuj Zwiadowcę przy pustej puli MP → jednostka powstaje, MP bez zmian.

- 2026-07-22 · stempel: ROBOCZA · **98889578** · md5 pliku `98889578644a90da33d1dc45d1a67994` · **BALANS: regen Manpower 5%→2%** — na `a28c034e`:
  **Regen bazowy:** `manpower_regen_proc_max_tura` **5 → 2** (`miasto-params.json`, fallback `DEFAULT_REGEN` w `manpower.ts`). **Rzymianie bez zmian bonusów:** `mnoznik_manpower_max` **2.0** (2× pula max) + `bonus_pobor_regen` **1.0** (2× tempo regen). Ep1 Kamień, 10 ludków: standard max **10k** regen **+200/t** (~50 tur do pełna); Rzym max **20k** regen **+800/t** (4% max = 2%×2 bonus).
  tsc=0 · manpower-test 30/30 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `c54dae3b`) · Test: Ctrl+F5 START.html → stamp `98889578` → ep1 10 ludków: inna cyw. +200/t, Rzym +800/t.

- 2026-07-22 · stempel: ROBOCZA · **a28c034e** · md5 pliku `a28c034e03223ec6fb4cd52401b0d86c` · **CYWIL: bonus Manpower Rzymianie** — na `3613d5d4`:
  **Rzymianie:** `mnoznik_manpower_max` **2.0** (2× pula max per ludek) + `bonus_pobor_regen` **1.0** (2× tempo regen). Hook: `manpower.ts` (`getCivManpowerMaxMultiplier`, `getCivManpowerRegenBonus`) · `turn-economy.ts` · `main.ts` (HUD breakdown). Przykład ep1, 10 ludków: max **20k** MP (vs 10k bazowo); regen **+1000/t** (vs +500).
  tsc=0 · manpower-test 30/30 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `98889578`) · Test: Ctrl+F5 START.html → stamp `a28c034e` → Nowa gra Rzymianie → panel Manpower: wyższy max i szybsza odnowa vs inne cywilizacje.

- 2026-07-22 · stempel: ROBOCZA · **3613d5d4** · md5 pliku `3613d5d4ca248a3fa3f6879061aad3dc` · **BATCH: balans Manpower + sesja 2026-07-22** — na `81e95aaa`:
  **MANPOWER (audyt/balans):** koszt rekrutacji ×10 — `manpowerNaJednostke = manpowerNaLudka` w `epoka-ludnosc-manpower.json` (1 ludek = 1 jednostka przy pełnej puli); regen **10% → 5%** (`manpower_regen_proc_max_tura` w `miasto-params.json`, fallback `DEFAULT_REGEN` w `manpower.ts`). **Sesja (już w poprzednich wpisach, zbiorczy deploy):** dyplomacja (komunikaty AI, etykieta kultury, status formalny vs postawa, ikona wojny); badania ×2 koszt; budynki ÷2 koszt produkcji; granice państwa (ciągłe pętle, grubsze, 30% alpha); nazwy miast-państw (pula 10–18); overflow Pracy → pula cywilizacji; epoka startowa miast-państw Kamień; zwiadowca/wsparcie ATK post-battle; cooldown darów ¤ AI; panel badań lista techów; +1 szczęścia per budynek; cap ofert AI do skarbca.
  tsc=0 · manpower-test 24/24 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `a28c034e`) · Test: Ctrl+F5 START.html → stamp `3613d5d4` → rekrutacja 1 jednostki przy pełnej puli = 1 slot ludek; regen ~20 tur do pełna (ep1, 10 ludków).

- 2026-07-22 · stempel: ROBOCZA · **81e95aaa** · md5 pliku `81e95aaae7cbea9034c0df360ce34845` · **EKONOMIA: +1 szczęścia per budynek** — na `4332ae45`:
  **Decyzja Macieja:** każdy zbudowany budynek daje +1 szczęścia; bonus z `baza.zadowolenie` w JSON **dokładany** (nie zastępuje). **Hook:** `buildingHappinessAtLevel` / `sumBuildingHappinessFromBuiltIds` w `gra/src/game/economy.ts` → `main.ts`, `cityPanel.ts`, `cityYieldPerTurn`. Tooltip: „Budynki (+1/budynek)". Przykład: Świątynia zadowolenie 3 → efekt 4; hipotetyczne 2 → 3.
  tsc=0 · building-happiness-test 8/8 · society-breakdown-test OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `3613d5d4`) · Test: Ctrl+F5 START.html → stamp `81e95aaa` → miasto z 3 budynkami → Sz +3 bazowe + bonusy z JSON.

- 2026-07-22 · stempel: ROBOCZA · **4332ae45** · md5 pliku `4332ae45d7d58b706e5a68a9882f8503` · **MAPA: granice państwa — szersze + bardziej przezroczyste** — na `04f98d66`:
  **Decyzja Macieja:** szerokość pasa ×2,5 (wzrost ~150%); alpha 30%. **Było:** `TERRITORY_BORDER_BAND_WIDTH=0.15`, `TERRITORY_BORDER_OPACITY=0.5`. **Jest:** `0.375` / `0.3` w `gra/src/render/rangeOverlay.ts`.
  tsc=0 · territory-border-test 9/9 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `81e95aaa`) · Test: Ctrl+F5 START.html → stamp `4332ae45` → mapa → granice państwa wyraźnie szersze, delikatniejsze (30% alpha).

- 2026-07-22 · stempel: ROBOCZA · **04f98d66** · md5 pliku `04f98d66da71c76b3880dce7121dc916` · **FIX: zwiadowca sąsiad — domknięcie regresji Teby x3** — na `caa23af3`:
  **Bug (Maciej):** po ataku na miasto zwiadowca sąsiad nadal wchodził/merge'ował mimo fixów 5ce0dfb7 + caa23af3. **Luka:** `isCivilianUnit` tylko po `category` — jednostki ze starym zapisem / `domyslny` przechodziły do rosteru; `applyCityCaptureAfterBattle` używał `atkRoster[0]` zamiast kotwicy; brak guardów cywilów w `moveAtkRosterOntoBattleHex` / capture. **Fix:** `CIVILIAN_TYPE_IDS` fallback (typeId); kotwica zawsze pierwsza w rosterze; cywile nigdy nie relocate/capture/MP poza kotwicą; test Teby A+B vs miasto C.
  tsc=0 · battle-roster-test 7/7 · post-battle-map-test 21/21 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `4332ae45`) · Test: Ctrl+F5 START.html → stamp `04f98d66`; armia 2 hex A + zwiadowca hex B → atak miasta C → wygrana → armia na mieście, zwiadowca na B bez merge.

- 2026-07-22 · stempel: ROBOCZA · **caa23af3** · md5 pliku `caa23af35f45ae9b7b0dbe4d6b2ab561` · **FIX: wsparcie ATK zostaje po zdobyciu miasta** — na `24cdcfe8`:
  **Bug (kanon §14):** po wygranej M×W+ cały roster ATK lądował na hexie miasta (`moveAtkRosterOntoBattleHex`); wspierający z sąsiedniego heksa merge'owali się ze stosem jak zwiadowca (fix 5ce0dfb7 dotyczył tylko cywilów). **Decyzja:** §13a M×W+ / §13b — tylko kotwica wchodzi na hex miasta; wspierający zostają. **Fix:** `post-battle-map.ts` — ruch tylko kotwicy + jednostek ze wspólnego hexu startowego (stos).
  tsc=0 · post-battle-map-test 17/17 · battle-roster-test 5/5 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `04f98d66`) · Test: Ctrl+F5 START.html → stamp `caa23af3`; A atakuje miasto + B wspiera z sąsiedniego heksa → wygrana → A na mieście, B na swoim hexie.

- 2026-07-22 · stempel: ROBOCZA · **24cdcfe8** · md5 pliku `24cdcfe843e8c0b28db7cb3f17ecf7d9` · **FIX: panel badań — lista „Możesz wybrać"** — na `2c72af63`:
  **Bug Macieja:** sekcja MOŻESZ WYBRAĆ pusta („Brak dostępnych technologii"), podczas gdy drzewko pokazywało techy do wyboru. **Przyczyna:** hub budował listę tylko przez `available.has(node.id)` po iteracji `eraNodes` — bez normalizacji slugów (nazwa vs slug) i bez epoki aktywnego celu; hooki pickera konfigurowane po utworzeniu huba. **Fix:** `scienceHubSnapshotLogic.ts` — normalizacja ID, iteracja pickable z silnika, epoka UI = epoka celu; `configureSciencePicker` przed `mountD1bHud`; merge config pickera.
  tsc=0 · science-hub-test 7/7 · research-test 33/33 · tech-tree-test 19/19 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `caa23af3`) · Test: Ctrl+F5 START.html → stamp `24cdcfe8`; Badania → MOŻESZ WYBRAĆ = pełna lista techów Kamienia (niezbadane, spełnione prereq).

- 2026-07-22 · stempel: ROBOCZA · **2c72af63** · md5 pliku `2c72af6335dfc5c456f62b7d23649af1` · **DYPL: cooldown jednorazowych darów ¤ od miast-państw** — na `5ce0dfb7`:
  **Bug Macieja:** miasta-państwa proponowały handel ze złotem co turę (accept → stały dopływ ¤ bez haraczu/trybutu). **Było:** `decideAIDiplomacy` P6 bez cooldownu — warunki spełnione co turę → nowy popup. **Jest:** cooldown per ownerId (easy 15 / normal 25 / hard 35 tur); zapis w save (`aiOneShotGiftLastTurn`); mnożnik kwoty easy ×1.25 / hard ×0.75; trybut per-tura (`zadaj_trybut`) bez zmian.
  tsc=0 · diplomacy-economy-test 16/16 · diplomacy-proposal-test 64/64 · ai-test T2S-b2 PASS · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `24cdcfe8`) · Test: Ctrl+F5 START.html → stamp `2c72af63`; kontakt z miastem-państwem → 1 propozycja handlu → akcept/odrzut → **cisza ~25 tur** (normal); kolejny dar dopiero po cooldownie.

- 2026-07-22 · stempel: ROBOCZA · **5ce0dfb7** · md5 pliku `5ce0dfb7a110e60576de86a4acf4a48b` · **FIX: zwiadowca nie wchodzi w bitwę / nie merge po walce** — na `f8a680cb`:
  **Bug Macieja (Teby x3):** armia 2 jednostek atakuje miasto; sąsiedni zwiadowca włączał się do preBattle i po wygranej dołączał do armii na hexie miasta. **Przyczyna:** `collectBattleRoster` / `collectAtkRosterNearCity` / `collectSiegeDefRoster` zbierały wszystkie jednostki dist≤1 bez filtra cywilów; `moveAtkRosterOntoBattleHex` przenosił cały roster. **Fix:** `shouldIncludeInBattleRoster` — cywil (zwiadowca/osadnik/robotnik) tylko jako kotwica ataku lub obrońca na hexie starcia; `collectDefRosterNearCity` dla obrońców miasta.
  tsc=0 · battle-roster-test 5/5 · post-battle-map-test 15/15 · combat-test 6/6 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `2c72af63`) · Test: Ctrl+F5 START.html → stamp `5ce0dfb7`; armia 2 + zwiadowca sąsiad → atak miasta → preBattle bez zwiadu; po wygranej zwiadowca zostaje na swoim hexie.

- 2026-07-22 · stempel: ROBOCZA · **f8a680cb** · md5 pliku `f8a680cb8139078332c92fac65b4cb89` · **FIX: epoka startowa miast-państw (Kamień, nie Brąz)** — na `4bd22b7b`:
  **Bug Macieja:** państwa-miasta wyglądały jak epoka Brązu (kamienne chatki) mimo startu w Kamieniu. **Przyczyna:** spawn klastra obcych AI używał `initOwnerEra` bez pełnej synchronizacji tech/epoki (`setupAiOwnerEpoch`); render brał epokę z `empireEpochForOwner` — poprawnie, ale dane startowe były niespójne. **Fix:** `applyClusterStartPlan` + `fillAiOwnerCivMap` → `setupAiOwnerEpoch`; `spawnPendingSameTypeRivals` → `reconcileAllOwnerErasFromResearch` przed sync. **Uwaga:** neutralne chat ze skarbami (`wioska`) to osobny model — zawsze 3 chatki, nie epoka.
  tsc=0 · owner-epoch-test 11/11 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `5ce0dfb7`) · Test: Ctrl+F5 START.html → stamp `f8a680cb`; Nowa gra · Epoka Kamienia → załóż miasto → sprawdź miasta-państwa: tipi/ognisko (P1 Kamień), nie megaron (Brąz); chat ze skarbami = neutralne chatki bez etykiety miasta.

- 2026-07-22 · stempel: ROBOCZA · **4bd22b7b** · md5 pliku `4bd22b7b03a0a85de8e5b8e0ba90f629` · **EKO: nadmiar Pracy → pula ulepszeń** — na `27108476`:
  **Bug Macieja:** bez budynku w kolejce do puli cywilizacji szła tylko część z suwaka (np. 4 z 13), reszta (doBudynkow) ginęła. **Fix:** `advanceProduction` — pusta kolejka → `overflowToPool = doBudynkow`; `main.ts` — overflow dolicza do `_lastPracaRate` (HUD).
  tsc=0 · production-overflow-test 12/12 · wire-ekonomia-test 37/37 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `f8a680cb`) · Test: Ctrl+F5 START.html → stamp `4bd22b7b`; miasto bez budynku, 13 Pracy, suwak 70/30 → pula +13/t (nie +4).

- 2026-07-22 · stempel: ROBOCZA · **27108476** · md5 pliku `27108476a220e9029beaf7a02512b0e7` · **START/DYPL: unikalne nazwy miast-państw 10–18** — na `d5a4543e`:
  **Uzupełnienie fixu Rywal N:** `miasta_panstwa` = 10 nazw (9 rywali), kreator do 18. **Było:** rywal 10+ → fallback „Rywal N" (podgląd bez pul) lub zawijanie (Sparta×2). **Jest:** `clusterRivalFromPool` bierze rywali 10–18 z `miasta_cywilizacji` (Grecy: Olimpia…Nafplion); kreator przekazuje `cityNamesPools`; UI `resolveOwnerBaseName` bez zmian (z `d5a4543e`).
  tsc=0 · city-names-pool-test 13/13 · civ-names-test 6/6 · display-names-test 11/11 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `4bd22b7b`) · Test: Ctrl+F5 START.html → stamp `27108476`; Grecy · 16 miast-państw → kreator + mapa + dyplomacja: Olimpia, Efez… (nie „Rywal 10").

- 2026-07-22 · stempel: ROBOCZA · **d5a4543e** · md5 pliku `d5a4543e21e40869cd6fbbd6a7f27671` · **DYPL: nazwy miast-państw w audiencji** — na `248b2622`:
  **Bug Macieja:** audiencja dyplomatyczna pokazywała „Rywal 10 · miasto-państwo" zamiast prawdziwej nazwy (np. Mykeny). **Przyczyna:** cache `ownerDisplayName` z fallbacku `Rywal N` (indeks poza pulą 10 nazw) miał pierwszeństwo przed `city.name`. **Fix:** `resolveOwnerBaseName` + `isTechnicalOwnerLabel` w `display-names.ts`; `ownerDiploLabel` w `main.ts` — miasto-państwo → nazwa z mapy; stolica obcego klastra → nazwa nacji; zawijanie indeksu w `city-names-pool.ts`.
  tsc=0 · display-names-test 11/11 · diplomacy-display-test 14/14 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `27108476`) · Test: Ctrl+F5 START.html → stamp `d5a4543e`; dyplomacja → audiencja miasta-państwa → **Mykeny · miasto-państwo** (nie Rywal N); pełna nacja → **Hetyci** itd.

- 2026-07-22 · stempel: ROBOCZA · **248b2622** · md5 pliku `248b262222701bc1bf5149094e1d277b` · **MAPA: jednostka widoczna na lesie** — na `70aea720`:
  **Bug Macieja:** token jednostki zasłonięty przez kępę drzew (nakładka Las). **Fix (wzorzec B — jak farma na lesie):** `syncForestForUnits` w `scene.ts` — tymczasowo ukrywa instancjonowaną kępę lasu (+ legacy forest mesh + dżungla styledOverlays) na heksach z widocznym tokenem; przywraca po ruchu. Wywołanie z `syncUnitsRender` w `main.ts`. Farmy/hodowle/ulepszenia na lesie bez zmian (`hideDecorAtHex` trwałe).
  tsc=0 · smoke OK · picker-test 136/136 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `d5a4543e`) · Test: Ctrl+F5 START.html → stamp `248b2622`; postaw jednostkę na lesie → token + pierścień właściciela w pełni widoczne; po ruchu z heksa las wraca.

- 2026-07-22 · stempel: ROBOCZA · **70aea720** · md5 pliku `70aea720f1c8697bb77fb97bfadc466f` · **MAPA: więcej chat ze skarbami (miasta × trudność)** — na `7d03bb35`:
  **Decyzja Macieja:** liczba chat = miasta startowe (typy × (1+państwa)) × mnożnik trudności — HART=1 · NORMAL=2 · EZ=3. **Było:** `round(ląd/140)` (~10–65). **Jest:** `targetHuts = cityCount × multiplier` w `villages.ts` + `WorldGenOptions` (difficulty, civTypesCount, cityStatesCount) z kreatora → `generator.ts` / `main.ts`.
  tsc=0 · villages-test 39/39 · map-gen-regression determinizm PASS · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `248b2622`) · Test: Ctrl+F5 START.html → stamp `70aea720`; nowa gra Standard · Normal → więcej chat niż wcześniej; przykład 8 miast Normal → 16 chat.

- 2026-07-22 · stempel: ROBOCZA · **7d03bb35** · md5 pliku `7d03bb35daf68ef86d540b35cf87361b` · **DYPL: oferta AI = faktyczny skarbiec (strict transfer)** — na `826cc00b`:
  **Decyzja Macieja:** państwo/miasto-państwo/cywilizacja proponuje TYLKO tyle ¤/PN, ile ma w skarbcu — nie więcej. **Fix:** `capAiGoldOffer` (min(saldo, max)); `decideAIDiplomacy` + `enrichAiCommandWithTreasury` — brak propozycji gold-only przy 0 ¤; UI dynamiczne („**5** ¤"); akceptacja przez `applyOneShotGoldTransfer` (strict); cofnięty grant bez skarbca (`applyDiplomaticGoldGrant` → strict alias).
  tsc=0 · diplomacy-proposal-test 64/64 · diplomacy-economy-test 11/11 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `70aea720`) · Test: Ctrl+F5 START.html → stamp `7d03bb35`; propozycja handlu AI pokazuje realną kwotę (np. 5 ¤); AKCEPTUJ → skarbiec +dokładnie tyle; AI z 0 ¤ nie wysyła handlu złotem.

- 2026-07-22 · stempel: ROBOCZA · **826cc00b** · md5 pliku `826cc00bda20eccc5392ae3924a7aae0` · **MAPA: granice państwa — ciągły kontur per państwo** — na `f9bd9a75`:
  **Bug:** poprzedni fix (`07beb443`) nadal dawał rozłączone paski — per-heks offset normalnych od środka każdego heksa + błędne mapowanie krawędzi (rog i zamiast rog i+1,i+2). **Fix:** `territory-border.ts` — zbieranie krawędzi granicznych → graf → zamknięte pętle (polyline loops); `rangeOverlay.ts` — pas mesh wzdłuż pętli z joinami w wierzchołkach; alpha **0.5**, szerokość **0.15** world units; per ownerId osobny obwód w kolorze cywilizacji.
  tsc=0 · territory-border-test 9/9 · map-gen-regression determinizm PASS · picker-test 136/136 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `7d03bb35`) · Test: Ctrl+F5 START.html → stamp `826cc00b`; mapa → minimapa → granice państwa ON → każde państwo ma ciągły obwód wokół całego terytorium (Ateny, Mykeny, AI).

- 2026-07-22 · stempel: ROBOCZA · **f9bd9a75** · md5 pliku `f9bd9a7522500410d4340d5deb9acb9d` · **DYPL: akceptacja AI handel → +20 ¤ graczowi** — na `07beb443`:
  **Bug:** po AKCEPTUJ propozycji Mykeny „20 ¤ na rzecz twojego państwa" skarbiec gracza się nie zwiększał. **Przyczyna:** `applyOneShotGoldTransfer` wymagał pełnego salda AI (często 0) + ponowna ocena `evaluateProposal` przy akceptacji. **Fix:** `resolvePlayerAcceptsAiPending` (gracz klika AKCEPTUJ bez re-eval); `applyDiplomaticGoldGrant` — gracz dostaje pełne 20 ¤, AI płaci tyle ile ma; `updateHud()` po transferze.
  tsc=0 · diplomacy-proposal-test 57/57 · diplomacy-economy-test 8/8 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `826cc00b`) · Test: Ctrl+F5 START.html → stamp `f9bd9a75`; poczekaj na propozycję handlu AI → AKCEPTUJ → skarbiec +20 ¤.

- 2026-07-22 · stempel: ROBOCZA · **07beb443** · md5 pliku `07beb443d7efc6dd1bd35efa29bfebae` · **MAPA: granice państwa — widoczny spójny obwód** — na `2e46903e`:
  **Bug:** granica praktycznie niewidoczna (cienka linia WebGL 1px @ 30% alpha) + efekt rozłączonych pasków per heks. **Fix:** `rangeOverlay.ts` — `buildTerritoryBorderMesh`: szeroki pas `TERRITORY_BORDER_BAND_WIDTH=0.10` (world units), flat Y dla całego obwodu, trójkąty w narożnikach łączą segmenty; alpha 0.48. Toggle minimapy bez zmian.
  tsc=0 · map-gen-regression determinizm PASS · picker-test 136/136 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `f9bd9a75`) · Test: Ctrl+F5 START.html → stamp `07beb443`; mapa → minimapa → ikona granic państwa → wyraźny kolorowy obwód wokół terytorium (nie kreski per heks).

- 2026-07-22 · stempel: ROBOCZA · **2e46903e** · md5 pliku `2e46903ef4065678fb24fbfe0475dd0f` · **BITWA: taktyka/strategia per jednostka** — na `77c603d7`:
  **Cel:** wybór Taktyki (Obrona/Atak/Szturm/Ostrzał) i Strategii (priorytety celów) dla pojedynczej jednostki, nie tylko grupy. **Fix:** `battleScene.ts` — pola `unitDoctrine`, `useUnitPriorities` / `unitTargetPriorities` na `RuntimeBattleUnit`; popup Taktyka/Strategia działa na zaznaczeniu (Ctrl+LPM = jedna jednostka); wielokrotne zaznaczenie ustawia wszystkim lub pokazuje „mieszane".
  tsc=0 · auto-battle-power-test 14/14 · battle-smoke harness pre-existing fail · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `07beb443`) · Test: Ctrl+F5 START.html → stamp `2e46903e`; PLAYTEST-WALKA → bitwa ręczna → Ctrl+LPM zaznacz 1 jednostkę → Taktyka → Szturm; druga w grupie → Obrona → różne postawy w tej samej grupie.

- 2026-07-22 · stempel: ROBOCZA · **77c603d7** · md5 pliku `77c603d77fe1346c18d8b5cb52535d3c` · **UI: etykieta kultury w audiencji dyplomatycznej** — na `3d2e4f32`:
  **Cel:** gracz widzi okręg kulturowy rozmówcy (np. „Kultura: Grecka" / „Chetycka") oraz wskazówkę ten sam okręg vs obca kultura. **Fix:** `civCultureLabelForKey` + `sameCultureCircle` w `diplomacy-display.ts`; linia UI w `diplomacyAudience.ts`; stan w `main.ts`.
  tsc=0 · VERIFY OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `2e46903e`) · Test: Ctrl+F5 START.html → stamp `77c603d7`; dyplomacja → audiencja Argos → „Kultura: Grecka · Ten sam okręg kulturowy"; obcy typ → „Obca kultura".

- 2026-07-22 · stempel: ROBOCZA · **3d2e4f32** · md5 pliku `3d2e4f329dc66bc40aadf23c7c4d9623` · **UI: stan dyplomatyczny vs nastawienie w audiencji** — na `40a77974`:
  **Cel:** jednoznaczny formalny stan umów (wojna/pokój/sojusz/pakt/handel/brak kontaktu) odrębny od nastawienia (score). **Fix:** `resolveFormalDiplomaticStatus` + `nastawienieLabelFromScore` w `diplomacy-display.ts`; audiencja — prominentny box „Stan dyplomatyczny" z ikoną mieczy przy wojnie; nastawienie z podpisem wyjaśniającym; usunięto mylące „Pokój (neutralne)" i badge tier w sekcji relacji.
  tsc=0 · diplomacy-display-test 14/14 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `77c603d7`) · Test: Ctrl+F5 START.html → stamp `3d2e4f32`; dyplomacja → audiencja → „Stan dyplomatyczny: Pokój" + osobno „Nastawienie: Neutralny"; przy wojnie → ⚔ Wojna.

- 2026-07-22 · stempel: ROBOCZA · **40a77974** · md5 pliku `40a77974b45d7aedb7bd17bc7abf2dfa` · **BALANS: badania x2, budynki -50% produkcji** — na `345cf8e2`:
  **Decyzja Macieja (flat, bez trudności):** koszty badań ×2 (`GLOBAL_RESEARCH_COST_MULT` w `difficulty-cost.ts` → `scaledResearchCost`); koszt Pracy budynków ×0.5 (`GLOBAL_BUILDING_PROD_MULT` w `production.ts` → `buildingWorkCost`). JSON bez zmian.
  tsc=0 · research-test 33/33 · tech-tree-test 19/19 · difficulty-cost-test 22/22 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `3d2e4f32`) · Test: Ctrl+F5 START.html → stamp `40a77974`; drzewko: Obróbka drewna 12→24 PN (szybka); Świątynia 25→13 Pracy (niski tempo).

- 2026-07-22 · stempel: ROBOCZA · **345cf8e2** · md5 pliku `345cf8e2c9a72fcc45fdb63fc9e62a62` · **UI: etykieta kultury w audiencji dyplomatycznej** — na `e90f27d4`:
  **Cel:** gracz widzi okręg kulturowy rozmówcy (np. „Kultura: Grecka" / „Chetycka") oraz wskazówkę ten sam okręg vs obca kultura. **Fix:** `diplomacy-display.ts` mapowanie typCywilizacji → przymiotnik PL; `diplomacyAudience.ts` linia pod tytułem; `main.ts` przekazuje `otherCultureLabel` + `cultureCircleSame`.
  tsc=0 · VERIFY OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `40a77974`) · Test: Ctrl+F5 START.html → stamp `345cf8e2`; dyplomacja → audiencja Argos → „Kultura: Grecka · Ten sam okręg kulturowy"; obcy typ → „Obca kultura".

- 2026-07-22 · stempel: ROBOCZA · **e90f27d4** · md5 pliku `e90f27d4a8e40d79d19c410d21641ed4` · **FIX: propozycje dyplomacji AI — tekst dla gracza** — na `8b53ffd7`:
  **Bug:** popup propozycji handlu (i innych) pokazywał debug silnika (`willingnessTrade=0.58 …`). **Fix:** `formatAiDiplomacyPlayerMessage` w `diplomacy-proposals.ts` — polskie opisy oferty (złoto/trybut/sojusz/pokój); `cmd.powod` tylko w `console.log`; UI inbox/modal bez współczynników.
  tsc=0 · VERIFY OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `345cf8e2`) · Test: Ctrl+F5 START.html → stamp `e90f27d4`; propozycja handlu od miasta-państwa → „Proponujemy jednorazową wymianę: 20 ¤…” bez willingnessTrade.

- 2026-07-22 · stempel: ROBOCZA · **8b53ffd7** · md5 pliku `8b53ffd7328af8e421b094d5dc290460` · **FIX: picking heksów mapy świata (offset w dół)** — na `0440dbe4`:
  **Bug:** klik w heks na mapie trafiał w sąsiada „w dół" — trzeba było klikać środek kafelka (`95be60fc` raycast terenu nie wystarczył). **Przyczyna:** (1) `camera.aspect`/`setSize` z `innerWidth/innerHeight` vs `getBoundingClientRect` canvas (scrollbar/DPR drift → przesunięcie Y promienia); (2) `worldToAxial` na trafieniu w bok pryzmu zamiast hex z `instanceId`. **Fix:** `scene.ts` — rozmiar kamery z `canvas.clientWidth/Height`; `terrainPickKeys` + `resolveTerrainPick(instanceId)`; `picker.ts` — `updateMatrixWorld`, world-space normal, test `picker-test.cjs`.
  tsc=0 · picker-test 136/136 · VERIFY OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `e90f27d4`) · Test: Ctrl+F5 START.html → stamp `8b53ffd7`; klik krawędzi heksa (nie tylko środek) → właściwy hex / panel kontekstowy.

- 2026-07-22 · stempel: ROBOCZA · **0440dbe4** · md5 pliku `0440dbe4c9b526c4e382d22585168d40` · **FIX: manual battle deploy — raycast terenu 3D** — na `13cb70c2`:
  **Bug:** w fazie rozstawiania (deploy) klik w pole czasem trafiał w sąsiedni hex / wymagał wielu klików — `_pickGroundTile` i `_onDeployClick` używały płaszczyzny y=0 (perspektywa kamery przesuwała trafienie, jak stary bug mapy w `picker.ts`). **Fix:** `_battleGroundPickMeshes` + raycast na meshach terenu; `preferPlacement` przy kliku z zaznaczeniem; feedback „Poza strefą"/„Pole nieprzechodne".
  tsc=0 · battle-smoke harness pre-existing fail · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `8b53ffd7`) · Test: Ctrl+F5 START.html → stamp `0440dbe4`; PLAYTEST-WALKA → bitwa ręczna deploy → zaznacz jednostkę → LPM na docelowy niebieski kafelek → jedna próba, właściwy slot.

- 2026-07-22 · stempel: ROBOCZA · **13cb70c2** · md5 pliku `13cb70c217f2e899a712af962cfb176a` · **FIX: obywatele nie pracują na obcym terytorium + granice państw** — na `d33863ab`:
  **Bug:** w overlapie zasięgów miast gracz widział 👤 i zbierał plony z heksów faktycznie należących do AI (budowa ulepszeń już blokowana). **Fix:** `territoryOwnerAt` filtruje auto/ręczny przydział pól, reconcile co turę i przy założeniu miasta; 👤 overlay tylko na własnych heksach; toggle granic państw (minimapa, sześciokąt) — już podpięty.
  tsc=0 · okolica-test 39/39 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `0440dbe4`) · Test: Ctrl+F5 START.html → stamp `13cb70c2`; overlap przy Sparcie — brak 👤/plonów na lesie AI; minimapa → granice państw ON.

- 2026-07-22 · stempel: ROBOCZA · **d33863ab** · md5 pliku `d33863ab2e47ec6fd8b5b8dcf2cd3a3f` · **FIX: zwiadowca bez głodu + Manpower przy rekrutacji** — na `e1ac8503`:
  **Bug1:** czaszka głodu i utrata HP na zwiadowcy gdy imperium głoduje — overlay per-państwo bez filtra cywilnych + utrzymanie złoto Zwiadowca=1 w JSON. **Fix:** `isCivilianUnit` (zwiadowca/osadnik/robotnik) pomijany w overlay i `applyArmyStarvationHpLoss`; cywilne upkeep/food=0.
  **Bug2:** rekrutacja za złoto nie odejmowała Manpower przy kliknięciu. **Fix:** `purchaseRecruitmentUnit` pobiera MP od razu; anulowanie zwraca MP; kolejka spawn bez ponownego poboru.
  tsc=0 · manpower-test 24/24 · upkeep-test 58/58 · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `13cb70c2`) · Test: Ctrl+F5 START.html → stamp `d33863ab`; zwiadowca bez czaszki przy głodzie wojska; rekrutuj → pula rekrutów spada natychmiast.

- 2026-07-22 · stempel: ROBOCZA · **e1ac8503** · md5 pliku `e1ac85039004206b42257db32921ebac` · **UI: Stos → Armia (etykiety stosu jednostek)** — na `c7301135`:
  **Zmiana Macieja:** `Stos · 2 jedn.` → `Armia — 2 jednostki` (odmiana 1/2–4/5+); tooltip `Zaznacz armię — N jednostek`; spójnie panel stosu, merge, wybór miasto/jednostka.
  Pliki: `gra/src/ui/formatPl.ts`, `main.ts`, `armyListHud.ts`, `armyStackHud.ts`, `armyMergePanel.ts`, `cityUnitPick.ts`. tsc=0 · VERIFY OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `d33863ab`) · Test: Ctrl+F5 START.html → md5 `e1ac8503`; ⚔ lista armii → „Armia — N jednostki", hover „Zaznacz armię — …".

- 2026-07-22 · stempel: ROBOCZA · **a6820979** · md5 pliku `a6820979252257f6df87e881c729509d` · **D3-TRUST-TICK + lista dyplomacji Relacja/Zaufanie** — na `c63dd3f4`:
  **Zaufanie/turę (wykluczające tiery):** sojusz +3 · NAP +2 · pokój +1 · UmowaHandlowa +1 stackuje. **Handel surowców/złóż:** `UmowaHandlowa` trwała, czas umowy **1–20 tur** (koszyk), wygasa bez auto-odnowienia; PN/¤ bez surowców = one-shot. **UI lista dyplomacji:** `Relacja: X · Zaufanie: Y`, bez bonusów cyw.
  tsc=0 · diplomacy-proposal 55/55 · docs `docs/decyzje/D3-TRUST-TICK-2026-07-21.md` · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `e1ac8503`) · Test: Ctrl+F5 START.html → stamp `a6820979`; handel z złożem → wybór 1–20 tur; uścisk dłoni → Relacja+Zaufanie.

- 2026-07-21 · stempel: ROBOCZA · **c7301135** · md5 pliku `c730113537ad8855f07f53a948566f28` · **D3-TRUST-TICK + lista dyplomacji** (push `4a41c43`, kod `eab45c1`) — na `c63dd3f4`:
  Ten sam zakres co `a6820979` — pierwszy publish na `main` po `eab45c1`. · **NA origin/main** (do nowszego lokalnego publishu).

- 2026-07-21 · stempel: ROBOCZA · **c63dd3f4** · md5 pliku `c63dd3f4df7e51f9300f2ba0265d69ac` · **FIX: Farma na lesie (Las) bez wyrębu** — na `41656451`:
  **Bug:** budowa Farmy wymagała wycinki lasu (Wyrąb) albo nie działała na wzgórzach z lasem; kępa drzew zasłaniała model ulepszenia. **Fix:** `isFarmBaseTerrain()` — Łąka/Równina zawsze + Wzgórza gdy nakładka Las; po postawieniu farmy/hodowli/irygacji na lesie schowanie dekoru lasu (nakładka Las zostaje); test `map-improvement-qualify-test.cjs` 54/54.
  tsc=0 · map-improvement-qualify 54/54 · VERIFY OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `a5b836a1`) · Test: Ctrl+F5 START.html → stamp `c63dd3f4`; 🔨 Budowa → Farma → klik heks z lasem bez Wyrębu → postawienie OK, drzewa schowane.

- 2026-07-21 · stempel: ROBOCZA · **41656451** · md5 pliku `41656451acc3344d2863fcdf0375f4e7` · **FIX: Lama ukryta w panelu budowy poza Inkowie** — na `c1b7327a`:
  **Bug:** ulepszenie Lama widoczne dla wszystkich cywilizacji (np. Grecy) jako wyszarzone „Brak heksów w twoim terytorium". **Fix:** `isImprovementVisibleInBuildPanel` filtruje listę 🔨 ULEPSZENIA TERENU; bramka `isLivestockAllowed` w `applyBuildRequest`. Lama tylko `typCywilizacji` inkowie (`isIncaCiv`).
  tsc=0 · map-improvement-qualify lama AC OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `c63dd3f4`) · Test: Ctrl+F5 START.html → stamp `41656451`; Grecy 🔨 → brak Lama; Inkowie → Lama na liście.

- 2026-07-21 · stempel: ROBOCZA · **c1b7327a** · md5 pliku `c1b7327a494fbf0d3e348f0b5b78791e` · **D3-TRUST-TICK: per-turowe Zaufanie + trwały handel surowcami** — na `87d0d359`:
  **Zaufanie/turę:** sojusz +3 · NAP +2 · pokojowy kontakt +1 (tiery wykluczające) · UmowaHandlowa +1 (stackuje). **Handel złoża/surowiec_boolean:** trwały ActiveDeal `umowa_handlowa` 10–20 tur, grant ZlozeGrant z dealId, wygasa z traktatem/wojną; czysty PN/¤ nadal one-shot.
  tsc=0 · diplomacy-proposal 53/53 · diplomacy-test tick OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `41656451`) · Test: Ctrl+F5 START.html → stamp `c1b7327a`; NAP/sojusz buduje Zaufanie szybciej; handel z dostępem do złoża tworzy umowę wieloturową.

- 2026-07-21 · stempel: ROBOCZA · **87d0d359** · md5 pliku `87d0d359f8ccd4275c89e56496dc1c9c` · **FIX: propozycje handlu AI tylko po odkryciu w mgle (D3-Q2)** — na `b1e90a22`:
  **Bug:** miasta-państwa z klastra kulturowego wysyłały `zaproponuj_handel` bez odkrycia gracza i bez akcji „Nawiąż kontakt". **Fix:** `diplomacyLayerForOwner` → `pre_contact` dla wszystkich ownerów bez odkrycia (wcześniej miasta-państwa omijały bramkę przez warstwę `simplified`); `filterDiplomacyCommandsForLayer` blokuje wszystkie propozycje AI.
  tsc=0 · ai-test T10a–c OK (234 pass, 4 pre-existing fail) · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `c1b7327a`) · Test: Ctrl+F5 START.html → stamp `87d0d359`; Nowa gra bez odkrycia państw-miast → brak propozycji handlu; po odkryciu w mgle → propozycje możliwe.

- 2026-07-21 · stempel: ROBOCZA · **b1e90a22** · md5 pliku `b1e90a22570f73e834a6209c6830575a` · **NAP rel-only + fix handel UI (live Respekt)** — na `31bf4a4b`:
  **NAP:** bramka tylko Relacja ≥ progNapRelacja (bez Zaufania); Zaufanie rośnie po zawarciu. **Handel:** UI używało stale `rel.respekt` zamiast live `computeRespekt` → przy Rel 55 na ekranie przycisk szary z mylącym tooltipem; naprawione `audienceRelTotal` + `buildProposalEvalContext`.
  tsc=0 · diplomacy-proposal 47/47 · VERIFY OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `87d0d359`) · Test: Ctrl+F5 START.html → stamp `b1e90a22`; NAP przy Rel≥50 bez Zauf; handel aktywny gdy Rel (Zauf+Respekt mocy) ≥40.

- 2026-07-21 · stempel: ROBOCZA · **31bf4a4b** · md5 pliku `31bf4a4bbe8eea314f7210b9a61f4a1a` · **D3-PROG-DIFF: progi traktatów wg trudności + dual gates NAP/handl** — na `95be60fc`:
  **D3-PROG-DIFF:** skalowanie progów relacji/zaufania/respektu ±10 wg trudności (easy −10 / hard +10). Normal: handel Rel 40, NAP Rel 50 + Zauf 40. Dual gates: NAP wymaga Rel+Zauf (+ tech/granice gdzie dotyczy); sojusz/trybut/handl z osobnymi progami.
  tsc=0 · diplomacy-proposal 48/48 · VERIFY OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `b1e90a22`) · Test: Ctrl+F5 START.html → stamp `31bf4a4b`; normal: NAP przy Rel≥50 i Zauf≥40; handel przy Rel≥40.

- 2026-07-21 · stempel: ROBOCZA · **95be60fc** · md5 pliku `95be60fc79400576b0e82bb15f518174` · **FIX picking heksów — raycast 3D terenu zamiast płaszczyzny y=0** — na `83eadf9a`:
  **Przyczyna:** kamera ~52° + pryzmy terenu podniesione nad y=0 → `pixelToHex` trafiał w płaszczyznę pod spodem, przesuwając wybór w stronę kamery (krawędzie heksów = zły hex). **Fix:** raycast na InstancedMesh terenu (prefer górna ścianka), fallback y=0; `terrainPickMeshes` w SceneResult + `pickHexAt` in main.ts.
  tsc=0 · logic 207/207 · VERIFY OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `31bf4a4b`) · Test: Ctrl+F5 START.html → stamp `95be60fc`; klik w krawędź heksa → panel kontekstowy pokazuje właściwy hex (nie sąsiada „w górę").

- 2026-07-21 · stempel: ROBOCZA · **83eadf9a** · md5 pliku `83eadf9a14a80a6e08db6a2eb8da88ca` · **FIX FoW — jednostki wroga ukryte poza bieżącym zasięgiem** — na `eeace0a7`:
  **Przyczyna:** `syncUnitsRender()` bez jawnej listy mgły synchronizowało wszystkie tokeny jako widoczne (czerwone pierścienie w czerni/shroud). **Fix:** przy `fogOn` domyślna lista = `unitsVisibleOnMap` (obcy tylko w `currentVisible`; gracz zawsze); test logic 207/207 (+4).
  tsc=0 · logic 207/207 · VERIFY OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `95be60fc`) · Test: Ctrl+F5 START.html → stamp `83eadf9a`; brak wrogich jednostek w czarnej mgle i ciemnym shroud poza zasięgiem.

- 2026-07-21 · stempel: ROBOCZA · **eeace0a7** · md5 pliku `eeace0a7477674272f86583795d60826` · **BUGFIX: miasta-państwa atakują gracza tylko w wojnie** — na `5793da54`:
  **Fix:** `canEngageOwner` w AI (ai.ts) + bramka w main.ts — bez statusu `wojna` brak preBattle/ataku na jednostki gracza (riposta przy zwiadowcy obok miasta-państwa). Dyplomacja PRZYJAZNY/neutralni spójna z brakiem walki.
  tsc=0 · diplomacy-test 143/143 · ai-test T7D-g OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `83eadf9a`) · Test: Ctrl+F5 START.html → stamp `eeace0a7`; zwiadowca obok Gamla Uppsala → brak ataku; po wypowiedzeniu wojny → atak dozwolony.

- 2026-07-21 · stempel: ROBOCZA · **5793da54** · md5 pliku `5793da543dc71b9a5ea61f6776f8c241` · **AUDYT 20 POTWIERDZONE + E-START-CS-Q1=C (merge commit)** — na `35a07a49`:
  **Audyt E1–E8:** #3–#9 #34–#39 #59–#65 + fix chatki WYDARZENIA (pełny opis: `dyspozycje/AUDYT-NAPRAWY-LOG.md`). **E-START-CS:** państwa-miasta wokół faktycznej stolicy (już w `35a07a49`, zachowane).
  tsc=0 · tech-tree 19/19 · map-gen-regression OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `eeace0a7`) · Test: Ctrl+F5 START.html → stamp `5793da54`; chatka + AI badania + klaster państw po stolicy.

- 2026-07-21 · stempel: ROBOCZA · **35a07a49** · md5 pliku `35a07a49cd8d393f82b45819ccc1a19c` · **E-START-CS-Q1=C — państwa-miasta wokół faktycznej stolicy gracza** — na `33e7c213`:
  **C:** spawn deferred same-type rivals używa `buildSameTypeRivalCandidateHexes` wokół hexu gracza (nie pre-planu mapgen); backfill przy odrzuceniu `foundCityAt`; pre-plan zostaje tylko do podglądu UI.
  tsc=0 · cluster-start-test 92/95 (3 pre-existing map 50×50) · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `5793da54`) · Test: Ctrl+F5 START.html → stamp `35a07a49`; Nowa gra 10–14 państw → postaw stolicę w innym miejscu niż sugerowane → gęsty klaster ~3 hex wokół Twojej stolicy.

- 2026-07-21 · stempel: ROBOCZA · **33e7c213** · md5 pliku `33e7c2138ee878307b4f0e294b5413e1` · **AUDYT 20 POTWIERDZONE (Maciej OK plan audyt 20)** + fix chatki WYDARZENIA:
  **E1–E8:** #3 dupe ludności rekrut/disband · #4 suwak 0% nie kasuje głodu · #5/#37 AI badania (awans epoki + epoch/tier gates) · #6 zwycięstwo nauka bez rakiety (NAUKA_WYMAGA_RAKIETY) · #7 relief bez Gór na Wybrzeżu · #8/#9/#39/#65 audio intro/awans epoki/natura/crossfade · #34 parametry głodu z ekonomia_miasta · #35 zdrowie nie zeruje deficytu żywności · #36 utrzymanie budynków w upkeep · #38 cuda nie na Wybrzeżu · #59 Praca→¤ po splitPraca · #60/#61 wioska setEra + parser prereków · #62 pangea bez purge jezior · #63 scoring start dist=4 · #64 martwe deposit_rules usunięte · **extra:** chatka znika po turze, WYKONAJ nie blokuje na nagrodzie.
  tsc=0 · tech-tree 33/33 · map-gen-regression OK · publish `gra-robocza/Gra-ROBOCZA.html`. · **ZASTĄPIONA** (→ `35a07a49`) · Test: Ctrl+F5 START.html → stamp `33e7c213`; chatka → komunikat znika po zakończeniu tury; AI bada dalej po awansie epoki.

- 2026-07-21 · stempel: ROBOCZA · **14b3a1b0** · md5 pliku `14b3a1b05833ba24add367ec93b9beb3` · commit `dce32f3` (FF `main`, PUSHNIĘTE) · **TRASA PRZEZ MGŁĘ (fala 4, C-RUCH-Q1=B)** — na `a7e6b012`:
  **B:** `applyFogToPathPlan` nie ucina już trasy na granicy widoczności — można prowadzić marsz **optymalną trasą przez mgłę i nieodkryty teren** do celu. Pathfinding omija teren nieprzejezdny; egzekucja zatrzymuje jednostkę na realnej blokadzie (`shouldStopAtObstacle`). Dawna logika „ślepa" przeniesiona do `_applyFogToPathPlanBlind` (nieużywana).
  tsc=0 · planned-march 18/18 · logic 203/203 · VERIFY OK. Bundel **27,3 MB**. · **ZASTĄPIONA** (→ `33e7c213`) · Deploy sesja lokalna (Maciej: „dokończ falę 4"). Test: zaznacz armię → klik cel za mgłą → trasa prowadzi przez mgłę do celu (nie staje na granicy widoczności); Ctrl+F5 START.html → stamp `14b3a1b0`.

- 2026-07-21 · stempel: ROBOCZA · **a7e6b012** · md5 pliku `a7e6b01281d10853974faa884d79ef5b` · commit `dba6e6e` (branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, PUSHNIĘTE) · **AUTOSAVE ROTACYJNY (fala 3): 10 ostatnich wstecz + ustawienie częstotliwości** — na `38d6fc8b`:
  **M:** automatyczny autozapis co N tur (domyślnie **co turę**) do rotacji 10 slotów (autosave-1…10) — zawsze **10 ostatnich stanów wstecz**. Częstotliwość N (1..20 tur) ustawiana w **menu pauzy** („Autozapis co N tur"). Slot Ctrl+S („autosave") pozostaje osobny. Rotacyjne sloty pojawiają się w oknie Wczytaj. `setLastPlayedSlotId` → „Kontynuuj" wskazuje najnowszy autozapis.
  tsc=0 · logic 203/203 · VERIFY OK. Bundel **27,3 MB**. · **ZASTĄPIONA** (→ `14b3a1b0`) · Deploy AUTONOMICZNY (C-ORG-Q17=A). Test: graj kilka tur → w oknie Wczytaj rośnie lista „Autozapis · tura N"; zmień częstotliwość w menu pauzy.

- 2026-07-21 · stempel: ROBOCZA · **38d6fc8b** · md5 pliku `38d6fc8bebeace3056863e5e225230bb` · commity `c511387` (auto-cykl + feedback chatki) + `b8f0ab2` (status dyplomacji) (branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, PUSHNIĘTE) · **PACZKA UX (fala 2): auto-cykl jednostek + feedback nagród + status dyplomacji** — na `dfe0e817`:
  **C:** auto-cykl „bęben" — po wyczerpaniu ruchu jednostki system automatycznie przechodzi do następnej jednostki gracza z dostępnym ruchem (centruje kamerę); **SPACE** = ręczne przejście; gdy żadna nie ma ruchu → odznaczenie. **D:** nagroda z chatki/wioski pokazywana jako jeden czytelny toast (5 s) ORAZ trwały wpis w panelu WYDARZENIA (wcześniej toast bywał nadpisywany — brak informacji). **J:** panel Audiencji dyplomatycznej ma teraz wyraźną linię **STATUS** odrębną od nastawienia/tier: „W trakcie wojny / Sojusz wojskowy / Pakt o nieagresji / Pokój (neutralne) / Brak kontaktu" — kolorowaną (rozwiewa mylące „WROGI", które jest tylko nastawieniem).
  tsc=0 · diplomacy 143/143 · logic 203/203 · VERIFY OK. Bundel **27,3 MB**. · **ZASTĄPIONA** (→ `a7e6b012`) · Deploy AUTONOMICZNY (właściciel w playteście, C-ORG-Q17=A). 🔜 W toku fala 3: B (trasa przez mgłę 12 tur), M (autosave 10 wstecz). Test: (1) rusz jednostką → auto-skok do następnej + SPACE; (2) wejdź na chatkę → komunikat + wpis w WYDARZENIACH; (3) otwórz dyplomację → linia STATUS.

- 2026-07-21 · stempel: ROBOCZA · **dfe0e817** · md5 pliku `dfe0e8178186fba1d7a4151a81ec3568` · commity `14649e7` (crash walki + cywile + kamera) + `68e8485` (państwa-miasta + rekrutacja + pasek + floaty) (branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, PUSHNIĘTE) · **PACZKA UX/BUGFIX (fala 1): krytyczny crash walki + 7 poprawek** — na `5edc860`:
  **L (KRYTYCZNE):** naprawiony crash walki „Maximum call stack" (nieskończona rekurencja rosteru `_rebuildBattleRosterGrid`↔`_updateRosterBar`) + brak grupowania jednostek na polu bitwy. Przyczyna: silnik walki zakładał gracz=atakujący; gdy gracz BRONI się, roster/grupowanie sięgały `this.atk` zamiast `_playerRoster()`/`_groupRegistryRoster()`. Dodany guard re-entrancy. **H:** rekrutacja NIE zabiera już populacji miasta (`jednostka_koszt_ludnosci=0`) — kosztem tylko pula Manpower (potwierdzony objaw: zwiadowca zdejmował 1 ludność). **G:** państwa-miasta (15 żądanych → było ~1): `canFoundCity` relaksuje próg do 3 hex gdy ZAKŁADANE miasto to państwo-miasto (stolice bez flagi `startCityState` blokowały spawn progiem 5) + `Wybrzeze` wykluczone z puli kandydatów + logi cichych odrzuceń. **I:** cywile (zwiadowca/osadnik/robotnik) nie mogą zdobywać miast. **K:** klik jednostki w panelu ARMIE centruje kamerę na jej heksie. **A:** zielony pasek ruchu (ruchLeft/ruchMax) w liście ARMIE. **F:** `Math.round` na pulach nauki (BADANIA) i zamożności — koniec `14.400000000000002`. **E/F2:** zweryfikowane bez zmian kodu (Zwiadowca 0 utrzymania żywności + obywatel je 1 żywność — już działają end-to-end).
  tsc=0 · manpower 23/23 · logic 203/203 · map-gen A=B (1437e982) + 814/814 rzeki · VERIFY OK. Bundel **27,3 MB**. · **ZASTĄPIONA** (→ `38d6fc8b`) · Deploy AUTONOMICZNY (właściciel w aktywnym playteście, C-ORG-Q17=A). ⚠️ Incydent: kontener przeklonował się w trakcie (limit) i skasował niezacommitowaną pracę — odtworzona z historii i zabezpieczona pushem. Test: (1) OBROŃ się w bitwie → walka startuje, grupowanie działa; (2) 15 państw-miast → znacznie więcej na mapie; (3) zbuduj jednostki → poziom miasta bez zmian; (4) zwiadowcą klik wrogie miasto → komunikat „nie może zdobywać".

- 2026-07-21 · stempel: ROBOCZA · **20239659** · md5 pliku `20239659d422d41617f00cad11e15577` · commit `bfa3ceb` (branch → FF `main`, PUSHNIĘTE) · **DYPLOMACJA MIAST-PAŃSTW wg TRUDNOŚCI (start-zaufanie + dyplomacjaAktywnosc)** — na `454d7c52` (decyzja C-MP-DYPL-Q1=B):
  **Cz.1:** startowe zaufanie miast-państw do gracza wg trudności (tylko kopie typu; główne cyw nietknięte): easy +10 / normal +5 / **hard 0** (wariant B — baza już na dnie skali, więc hard=dzisiejsze zero, monotonicznie „wyższa trudność = mniej zaufania"). **Cz.2:** ożywiony martwy param `dyplomacjaAktywnosc` (easy 0,8/normal 1,0/hard 1,25) — podłączony do skłonności propozycji sojuszu/handlu w `decideAIDiplomacy` (**param OGÓLNY — dotyczy też głównych cywilizacji**). Globalne `DIPLOMACY_PARAMS` nietknięte.
  tsc=0 · city-state-alliance 59/59 · diplomacy 143/143 · ai-test 226/6 baseline · logic 203/203 · capital-capture 54/54 · map-gen A=B + 814/814 · VERIFY OK. Bundel **27,3 MB**. · **ZASTĄPIONA** (→ `dfe0e817`) · Deploy AUTONOMICZNY (właściciel nieobecny). Do akceptacji: delty 10/5/0, ogólny zasięg dyplomacjaAktywnosc. Test: na różnych trudnościach obserwuj nastawienie i skłonność do sojuszy AI.

- 2026-07-21 · stempel: ROBOCZA · **454d7c52** · md5 pliku `454d7c5232878d354241d0245f1aab6b` · commit `ef56a99` (branch → FF `main`, PUSHNIĘTE) · **POSIŁKI MIAST-PAŃSTW wg TRUDNOŚCI + pełna maszyneria sojuszu** — przeróbka na `0251a5cf` (decyzje C-MP-SOJ-Q1/Q2/Q3):
  **USUNIĘTA osobna opcja** „Wsparcie miast-państw" — siła miast-państw wynika teraz z **trudności gry**: Łatwy→słabe (skala sojuszu ×0,6, posiłki {0,3,1}), Normalny→{×0,3, 1,2,1}=obecne, Trudny→twarde (×0,15, {2,1,2}). Wyższa trudność = twardsze, bardziej zwarte miasta-państwa. **Q2=B pełna maszyneria:** siostry zawierają sojusz przez realny `aiDiplomacyStance`/willingness + parytet militarny (jak gracz↔AI), tylko z obniżonym progiem tierowym. Fix przy okazji: `progUmowaMinRelacja` skalowany razem dla sióstr (inaczej twarda podłoga unieważniała obniżkę). Globalna dyplomacja gracz↔AI nietknięta.
  tsc=0 · city-state-alliance 42/42 · diplomacy 143/143 · logic 203/203 · capital-capture 54/54 · ai-improvements 15/15 · map-gen A=B + 814/814 · ai-test 226/6 baseline · VERIFY OK. Bundel **27,3 MB**. · **ZASTĄPIONA** (→ `20239659`) · Deploy AUTONOMICZNY (właściciel nieobecny). Test: wybierz trudność → na Trudnym miasta-siostry szybko się sprzymierzają i mocno wspierają; na Łatwym ledwo (łatwy łup).

- 2026-07-21 · stempel: ROBOCZA · **0251a5cf** · md5 pliku `0251a5cf0d2ae25ef1a69e49d80da701` · commit `3a41391` (branch → FF `main`, PUSHNIĘTE) · **POSIŁKI MIAST-PAŃSTW przez SOJUSZ + opcja setupu + próg -30%** — nabudowane na `0b59bf29`:
  Przeprojektowanie: siostry klastra pomagają sobie **tylko w sojuszu**; zawierają sojusze **łatwiej** (próg 30% dla par sióstr, `Math.max(podłoga, próg×0,3)`; globalny próg gracz↔AI NIETKNIĘTY) i **proaktywnie gdy zagrożone** (nowa pętla AI↔AI `formSisterAlliancesIfThreatened`, dziś dyplomacji AI↔AI nie było). Nowa **opcja gracza w setupie**: „Wsparcie miast-państw: Niskie/Normalne/Mocne" (domyślnie Normalne) → `RESUP_TIERS` (low r0/g3/1 · normal r1/g2/1=obecne · strong r2/g1/2). W save przez `meta.newGameParams`.
  tsc=0 · city-state-alliance 28/28 (nowy) · diplomacy 143/143 · logic 203/203 · capital-capture 54/54 · ai-improvements 15/15 · map-gen A=B + 814/814 · ai-test 226/6 baseline · VERIFY OK. Bundel **27,3 MB**. · **ZASTĄPIONA** (→ `454d7c52`) · Deploy AUTONOMICZNY (właściciel nieobecny, C-ORG-Q17=A). Do akceptacji: skala 30%, liczby RESUP_TIERS, domyślne Normalne. Test: nowa gra → opcja „Wsparcie miast-państw"; zaatakuj miasto-siostrę → sąsiednie siostry zawierają sojusz i dopiero wtedy dosyłają posiłki.

- 2026-07-21 · stempel: ROBOCZA · **0b59bf29** · md5 pliku `0b59bf296b5417b4743ef6694644cee1` · commit `704ed00` (branch → FF `main`, PUSHNIĘTE) · **AI BUDUJE ULEPSZENIA TERENU (wszystkie cywilizacje + miasta-państwa)** — nabudowane na `7c65681a`:
  ULEP-Q1=B: dotąd ulepszenia stawiał tylko gracz; teraz każde AI rozwija teren. **Pula pracy AI** (`aiPracaPoolByOwner`, symetryczna do skarbca, w save) — podpięta pod akcesory przejęcia stolicy, więc **AI też traci pulę pracy przy utracie stolicy** (domknięcie asymetrii). **`planCityImprovements`** reużywa kwalifikatora gracza; throttle 1 ulepszenie/miasto/turę, skip gdy nadwyżka Pracy ≤30; deterministyczny, food-first; wyrąb pominięty; te same reguły dla miast-państw. Wydajność: skan tylko terytorium miasta + typy odblokowane techem.
  tsc=0 · ai-improvements 15/15 (nowy) · capital-capture 54/54 · logic 203/203 · map-gen A=B + 814/814 · cluster-start 143/143 · siege-ai 17/17 · ai-test 226/6 baseline · VERIFY OK. Bundel **27,3 MB**. · **ZASTĄPIONA** (→ `0251a5cf`) · Deploy AUTONOMICZNY (właściciel nieobecny, C-ORG-Q17=A). Do akceptacji: próg nadwyżki Pracy (30), kolejność priorytetów ulepszeń. Test: obserwuj AI/miasta-państwa po kilku turach → stawiają farmy/kopalnie/pastwiska na swoim terytorium.

- 2026-07-21 · stempel: ROBOCZA · **7c65681a** · md5 pliku `7c65681a67c5fbf3060b5819a77c69bb` · commit `b56b815` (branch → FF `main`, PUSHNIĘTE) · **PRZEJĘCIE STOLICY — follow-upy: przenieś stolicę + Power-„zdobycze"** — nabudowane na `41d0a2ea`:
  **(A) Przenieś stolicę** (MOVE-Q1/Q2/Q3 = A/A/A) — stolica jest teraz WYZNACZONYM miastem (`capitalCityIdByOwner`, domyślnie najstarsze, w save); plunder/sukcesja używają wyznaczonej. Gracz: przycisk „Ustaw jako stolicę" w panelu miasta (za darmo, **blokada gdy stolica oblegana**). AI: gdy stolica zagrożona (wróg blisko, przed oblężeniem) przenosi do najbezpieczniejszego miasta. Symetria gracz↔AI.
  **(B) Power-„zdobycze"** (POWER-Q3=A) — przy ELIMINACJI snapshot **całego** Power pokonanego → trwała, osobna kategoria „zdobycze" u zwycięzcy (wpięte w `computeObjectivePower`, w save).
  tsc=0 · capital-capture 54/54 · logic 203/203 · siege-ai 17/17 · cluster-start 143/143 · map-gen A=B + 814/814 · civ-roster/tech-tree/research/unit-replace zielone · VERIFY OK. Bundel **27,3 MB**. · **ZASTĄPIONA** (→ `0b59bf29`) · Deploy AUTONOMICZNY z sesji CHMUROWEJ (właściciel nieobecny 2h, C-ORG-Q17=A). Do akceptacji po powrocie: próg „AI przenosi gdy zagrożona", brzmienie komunikatów. Test: przenieś stolicę przyciskiem w panelu miasta (nie działa gdy oblegana); wyeliminuj cywilizację → skok Twojego Power (kategoria „zdobycze").

- 2026-07-21 · stempel: ROBOCZA · **41d0a2ea** · md5 pliku `41d0a2ea695143515934f34e3ef29564` · commity `adc472e` (rdzeń) + `2966d9a` (fix) (branch → FF `main`, PUSHNIĘTE) · **PRZEJĘCIE STOLICY (rdzeń) + fix najstarszego miasta** — nabudowane na `8bd30f48`:
  **(A) Przejęcie stolicy** — dwa osobne zdarzenia przy zdobyciu stolicy (= najstarsze miasto cywilizacji): **Zdarzenie 1** (pokonany ma inne miasta) — skarbiec → zwycięzca (całość), pula pracy przepada; cyw gra dalej, nowa stolica = kolejne najstarsze. **Zdarzenie 2** (ostatnie miasto = eliminacja) — + pula nauki → zwycięzca + brakujące techy skopiowane; cywilizacja usunięta z gry (dyplomacja/mapy stanu/oblężenia/pętla AI). Miasto-państwo (1 miasto) → zawsze Zdarzenie 2. Pełna symetria gracz↔AI, wpięte w obie ścieżki zdobycia (bitwa/puste + kapitulacja z głodu), stan w save. Nowy `capital-capture.ts` + test 38/38. **Follow-upy (poza rdzeniem):** akcja „przenieś stolicę", Power-„zdobycze".
  **(B) Fix** — `isPlayerCapitalCity` używał `localeCompare` na id miast → przy 10+ miastach mylił kolejność (po podwojeniu zawsze); teraz numeryczny `cityFoundOrder`.
  tsc=0 · capital-capture 38/38 · logic 203/203 · combat 6/6 · map-gen A=B + 814/814 · cluster-start 143/143 · siege-ai 17/17 · tech-tree/research/unit-replace/civ-roster/barbarians/villages/converters/trade-routes zielone · VERIFY OK. Bundel **27,3 MB**. · **ZASTĄPIONA** (→ `7c65681a`) · Deploy z sesji CHMUROWEJ (stamp node). Test: zdobądź stolicę AI → przejmujesz jego skarbiec; zdobądź jego ostatnie miasto → eliminacja + łup (nauka+techy); miasto-państwo → od razu eliminacja.

- 2026-07-21 · stempel: ROBOCZA · **8bd30f48** · md5 pliku `8bd30f4899b9143c2cb331f5d237899b` · commit `9e39b08` (branch → FF `main`, PUSHNIĘTE) · **MIASTA-PAŃSTWA: aktywny rozwój + posiłki w klastrze (bez bonusów)** — nabudowane na `a756d893`:
  Miasta-siostry (profil `kopia_typu_obronna`) przestają być biernym łupem. Przyczyna bierności: bramka `earlyPhase` (`myCities.length<3`) — kopie mają zawsze 1 miasto → wiecznie „wczesna faza" → nigdy nie budowały budynków gospodarczych (Koszary/Tartak/Cegielnia/Huta/Magazyn/Targowisko), tylko w kółko Wojownik/Łucznik. Fix: `earlyPhase` wyklucza defensiveCopy → pełna kolejka mid-game (ten sam scoring co zwykłe AI, **zero bonusu**). + Spichlerz w bloku defensiveCopy (izolowany). + **posiłki w klastrze**: zagrożona siostra (wróg w dist≤1) dostaje posiłek z pobliskiej siostry z nadwyżką garnizonu (progi RESUP: threat=1, min_guard=2, max/turę=1 — **zachowawcze, do dostrojenia po playteście**). **Zero darmowych jednostek, nie zakładają miast, dyplomacja nietknięta.** Handel AI (Q2=B) wydzielony do Handel E6. Ulepszenia terenu przez AI: mechanizm nie istnieje w grze (brak robotnika) — osobna decyzja.
  tsc=0 · ai-test 226/6 (te same 6 pre-istniejących: T2S sojusz/handel, T7D-a przestarzały) · map-gen determinizm A=B + 814/814 z ujściem · tech-tree 19/0 · research 33/33 · unit-replace 10/10 · civ-roster 14/14 · cluster-start 143/143 · siege-ai 17/17 · VERIFY OK. Bundel **27,3 MB**. · **ZASTĄPIONA** (→ `41d0a2ea`) · Deploy z sesji CHMUROWEJ (stamp node). Test: obce państwo (kopia typu) → rozbudowuje się (budynki gospodarcze, nie tylko Wojownik) i broni; zaatakuj miasto-siostrę → sąsiednia siostra dosyła obrońcę; nadal łup, ale z wysiłkiem.

- 2026-07-21 · stempel: ROBOCZA · **a756d893** · md5 pliku `a756d893b60049d21719636014e49520` · commity `7f900ab`+`b778370`+`71733d2`+`00e1311` (rebasowane na `374c1067`, branch → FF `main`, PUSHNIĘTE) · **PODWOJENIE PAŃSTW/MIAST + FIX RZEK (wzrokowy) + PPM anuluje ulepszenie** — nabudowane na audio+grafice lokalnej sesji:
  **(A) Podwojenie setupu** — miasta w klastrze ×2, cywilizacje ×2 z sufitem 15 (roster = 15 nacji). Domyślne per rozmiar: Maleński 8mp/**7cyw** (7, nie 8 — na najmniejszej mapie 8 klastrów czasem się nie mieściło), Mały 10/10, Standardowy 12/12, Duży 14/14, Ogromny 16/15, Super Huge 16/15. `MAX_MIAST_PANSTWA` 9→18, `MAX_TYPY_CYWILIZACJI_MENU` 14→15. Pomiar rozstawienia: wszystkie rozmiary 100% (Maleński=7 mieści się).
  **(B) Fix ujścia rzek (weryfikacja WZROKOWA, Playwright)** — poprzedni fix bramki nie wystarczył; dwie wady w `render/scene.ts` `buildCoastalRiverPointChain`/`renderCoastalRiverExtension`: (1) kolor kamuflujący (coastDeltaMat = kolor terenu Wybrzeża → wstęga niewidoczna), (2) wodospad za wcześnie → płaski odcinek biegł pod bryłą terenu lądu. Naprawione: wstęga **widocznie wpływa w heks Wybrzeża i poszerza się w deltę** (potwierdzone zrzutami przed/po). Dane/generator nietknięte.
  **(C) PPM anuluje tryb budowy ulepszeń** — prawy przycisk (contextmenu + mouseup) woła `exitBuildMode()`, wzorem Escape/lewego-kliku-w-pustkę.
  tsc=0 (na scalonym stanie z audio+grafiką) · map-gen-regression determinizm A=B + **814/814 z ujściem** · map-scale-menu 32/0 · cluster-start 143/0 · start-preview 6/0 · rozmiar-label 13/0 · tech-tree 19/0 · research 33/33 · unit-replace 10/10 · VERIFY OK. Bundel **27,3 MB**. · **ZASTĄPIONA** (→ `8bd30f48`) · Deploy z sesji CHMUROWEJ (stamp node, rebase na `374c1067` bez konfliktów). Test: nowa gra → więcej państw/miast (Standardowy 12 cyw × 13 miast); mapa → rzeki wpływają w wybrzeże; tryb budowy ulepszeń → PPM anuluje.

- 2026-07-21 · stempel: ROBOCZA · **374c1067** · md5 pliku `374c1067975b6ee0d0c9be8b70aa1ddc` · commity `1a73086`…`3f1773e` (branch `main`) · **GRAFIKA-ŻELAZO + KOMPLET AUDIO** — dwa duże tematy w jednym bundlu:
  **(A) GRAFIKA-ŻELAZO** (zlecenie integratora #1 z 2026-07-10, wykonane po 10 dniach oczekiwania na werdykt właściciela; dyspozycja `DYSPOZYCJA-GRAFIKA-JEDNOSTKI.md` §2b): 4 nowe moduły w `gra/src/render/` — **11 modeli jednostek żelaza** (Mezopotamia/Indus: Gwardia hetycka, Piechota neobabilońska, Mur tarcz, Garnizon Harappy · Śródziemnomorze: Tyrski miecznik, Gwardia Tyreńska, Wojownik z żelaznym khopesh, Thorakites · plemiona: Drużynnik, iButho z iklwa, Miecznik galijski) + **nowa Galera** (oko apotropaiczne, trójzębny taran, żagiel z emblematem gracza, 8 wioseł/burta) zastępująca ~90 linii geometrii ad-hoc. **FIX Triari** — `buildSuperUnit` ignorował nazwę, więc `case 'rzym'` zawsze zwracał Evocati (Triari renderował się jako jego kopia). **FIX routingu Germana** — „Wojownik germański SUPER" trafiał w generyczny fallback; dopisane `germanie` do `Culture`/`cultureFromName`/`buildSuperUnit`. Weryfikacja funkcjonalna headless: `buildUnitModel` dla **73/73 jednostek bez wyjątku**; Triari (486 tri) ≠ Evocati (478), German super (488) ≠ generyk (580).
  **(B) AUDIO — trzy niezależne kanały:** *muzyka z plików* (intro: 3 utwory instrumentalne w **stałej kolejności** `C-MUZ-Q6=A`; kamień: 16 utworów shuffle, każdy 3× pod rząd; brąz+ synteza bez zmian, synteza kamienia **uśpiona nie skasowana**) · **crossfade 1,5 s** na każdym przejściu, także między powtórzeniami, krzywa equal-power (zgłoszenie: ~1 s głuchej ciszy, bo `'ended'` reaguje za późno) · *odgłosy natury* = **SYNTEZA, 0 MB** (wiatr, ptaki, świerszcze, wilk/sowa + nowy `renderListowie` = szum drzew), własny przełącznik i suwak, **automatyczne wyciszanie w bitwie** (0,8 s) wpięte w `setMood()` — `main.ts` i pliki bitwy bez zmian. `renderWoda` **uśpiona** (morze/rzeka wróci przy dźwięku pozycyjnym — decyzja właściciela: szum morza bez związku z geografią brzmiał przypadkowo).
  **(C) DANE:** Thorakites `Typ` **Swordsman→Spearman** + uwagi (tarcza thureos + włócznia dory); skutek mechaniczny: łapie kontrę **Spearman vs Mount +50%**. Panel-C zsynchronizowany z JSON, round-trip OK (na kopii).
  **FIX błędu właściciela:** wyciszenie muzyki zapisywało się trwale i gasiło też intro — teraz `enabled` jest **ulotne** (tylko bieżąca rozgrywka), głośność nadal trwała, stare zapisane `{enabled:false}` rozbrojone.
  Bramki: tsc=0 · tech-tree 19/0 · research 33/33 · unit-replace 10/10 · **combat 6/6** · **logic 203/203** · map-gen determinizm A=B · VERIFY OK. Bundel **26,1 MB** (19 mp3 inline). · **ZASTĄPIONA** (→ `a756d893`) · Test właściciela: wygląd 13 modeli + Galery na wodzie · kolejność i przenikanie utworów · szum drzew (las czy drugi wiatr?) · wyciszanie natury w bitwie · wyciszenie muzyki NIE przechodzi na nową grę ani na intro.

- 2026-07-20 · stempel: ROBOCZA · **50448964** · md5 pliku `5044896415a4b298a6701243bccd183e` · commit `39c95a2` (feature) + commit deployu (branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0` → FF `main`, PUSHNIĘTE) · **RZEKI: render ujścia kończy na Wybrzeżu (nie wymaga głębokiego Morza)**:
  Bug był w 100% w RENDERZE (dane rzek poprawne: 96.6% rzek głównych kończy bieg na wodzie, 0% „wisi"; dopływy 97.2% łączą się z inną rzeką). Bramka renderu `pathReachesOpenSeaRender` (`render/scene.ts`) wymagała dotarcia do głębokiego Morza w 1 kroku — a pas Wybrzeża ma 2 heksy — więc ujście rzeki kończącej na wewnętrznym pierścieniu Wybrzeża było CAŁKOWICIE pomijane (wstęga urywała się na lądzie). **Fix wg reguły właściciela** (Wybrzeże JEST morzem, rzeka kończy na Wybrzeżu): (a) bramka przepuszcza, gdy ostatni heks biegu jest wodą lub sąsiaduje z Wybrzeżem/Morzem; (b) `buildCoastalRiverPointChain` wpływa w pierwszy heks Wybrzeża i tam kończy (bez przepychania do Morza), z zachowanym wodospadem/deltą; deterministyczny wybór heksu. **Pomiar render-ujścia: ziemia 8.8%→100%, kontynenty 0%→100%.** Zmiana wyłącznie w `render/scene.ts` (−48 linii netto), dane/gra-data nietknięte.
  tsc=0 · map-gen-regression determinizm A=B (`1437e982`) + **814/814 z ujściem** · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · VERIFY OK · **AKTUALNA** · Deploy z sesji CHMUROWEJ (stamp node). Test: pogeneruj mapy (ziemia + kontynenty) → wstęgi rzek wpływają w wybrzeże (płytką wodę przy brzegu) i tam się kończą; brak rzek urywających się na środku lądu.
- 2026-07-20 · stempel: ROBOCZA · **74d85bc2** · md5 pliku `74d85bc2197de26d7fe47d36cf76420b` · commit `0d11fdd` (feature) + commit deployu (branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0` → FF `main`, PUSHNIĘTE) · **MAPA: wybrzeże z morza (ląd nietknięty) + fix Ziemia + pasma gór -25%**:
  (a) **Wybrzeże — kierunek odwrócony** (COAST-Q1=A) — Wybrzeże powstaje z heksów **Morza sąsiadujących z lądem** (płytka woda), a NIE przez konwersję suchego lądu. Ląd zostaje w 100%. `applyCoastRing`/`applyDoubleCoastRing` iterują teraz po Morzu przy lądzie; `thickenCoastAndSmoothInlets` resetuje Wybrzeże→**Morze** (nie→Łąka — koniec fałszywego lądu z wody); `sanitizeCoastHexes` sierota→Morze (nigdy→ląd). Naprawia regresję „kontynent europejski zamieniony w wybrzeże" na mapie **Ziemia**: wybrzeże/ląd **0.65→0.47**, ląd **+63%** (3488→5691), rzeki 100% z ujściem. Godzi generację ze zmianą Wybrzeże=woda z poprzedniego deployu.
  (b) **Fix fałszywego lądu poza maską Ziemi** — po zachowaniu lądu heurystyki „domykania zatok" zaczęły zalewać lądem cieśnie poza maską Ziemi (do 349 heksów). Nowa `purgeStrayLandOutsideEarthMask` (tylko `typ=ziemia`): suchy ląd poza maską → Morze; `notMaskButLand` **349→0**.
  (c) **Pasma górskie -25%** (GORY-Q2=A) — „aż za dużo gór"; `gestosc.pasma_gorskie.dlugosc_max`: low 15→11, med 18→14, high 22→17 (`max_pasm_na_mase`/`dlugosc_min` bez zmian; logika `growMountainRanges` nietknięta).
  **Ryzyko (do wiadomości):** ten sam mechanizm domykania zatok działa też na kontynenty/wyspy/pangea (brak maski referencyjnej — niemierzalne); jeśli w playteście widać nienaturalnie „zalane" zatoki na innych typach — wrócić do tego.
  tsc=0 · map-gen-regression **833/833 z ujściem** + determinizm A=B · tech-tree 19/19 · research 33/33 · unit-replace 10/10 · VERIFY OK · **ZASTĄPIONA** (→ `50448964`) · Deploy z sesji CHMUROWEJ (stamp node). Test: mapa typu **Ziemia** — kontynenty wypełnione lądem (nie zjedzone wybrzeżem), wybrzeże cienki pas przy brzegu, rzeki z ujściem; góry rzadsze pasma.

> ⚠️ **UZUPEŁNIENIE WSTECZNE 2026-07-19 (integrator #2 / „drugi integrator").** Trzy deploye poniżej (`494598a3`, `ed16d0ea`, `ca3aafa0`) wykonałem **bez wpisu w tym dzienniku i bez meldunku w `_handoff/KANAL-PRACA.md`** — złamanie zasady z nagłówka tego pliku („md5/stempel wpisuje się TYLKO tutaj, zaraz po publishu"). Dokładnie ten sam problem, który integrator #1 zgłaszał przy `d2a346ff`. Wszystkie trzy były na **wyraźne polecenie Macieja**, nie samowolnie — ale przez ~8 dni rejestr wskazywał jako AKTUALNĄ nieaktualną `58182469`. Uzupełniam wstecznie; równolegle meldunek w kanale pracy.

- 2026-07-20 15:58 · stempel: ROBOCZA · **a31ebe6f** · md5 pliku `a31ebe6f6ac72f8349339de7beeb9e24` · commity `bf7aba0` + `ab27149` + `7a3b051` + `a44c446` (branch `main`, PUSHNIĘTE) · **HANDEL: szlaki handlowe (E2+E3+E7) + zbieranie gliny**:
  (a) **E2 — wykrywanie połączeń miast** — nowy `game/trade-routes.ts` `findCityConnection` (ląd: uproszczony dystans + BFS przechodniości; morze: przez Port, BFS po wodzie); cache po mapie+stanie portów. Decyzja Q6=B.
  (b) **Zbieranie gliny** — glinianka na złożu daje **2 gliny/turę** → Cegielnia/Garncarnia ożywają (produkują cegłę/ceramikę); ruda/brąz świadomie odłożone (GLINA-Q1/Q2=A/A; brak martwego licznika brązu).
  (c) **E3 — dochód z tras** — trasy **TYLKO zewnętrzne** (gracz↔obca cyw, w pokoju), automatyczne, limit = liczba budynków handlowych (Targowisko/Karawanseraj/Port/Port wielki); dochód = wzór dystansowy (Q7=A) **+ +5% Handlu za trasę** (kumulatywnie), **OBIE strony** zarabiają (Q8=B), do skarbca czysto (pomija Wealth). Trasy w zapisie gry.
  (d) **E7 — UI** — sekcja „Szlaki handlowe" w panelu miasta (cel, medium, dystans, dochód/turę, bonus) + **łuki tras na mapie** (złoto=ląd, błękit=morze).
  **Odłożone (E3b/E6):** dostęp do surowca przez trasę (Q11) · AI proaktywnie proponujące handel + obniżony próg.
  tsc=0 · determinizm A=B · logic 203/203 · combat 6/6 · trade-routes 35/35 · trade-routes-income 49/49 · mennica-magazyn 38/38 · converters 31/31 · villages 31/31 · barbarians 74/74 · VERIFY OK · **ZASTĄPIONA** (→ `74d85bc2`) · Deploy z sesji CHMUROWEJ (stamp node). Test: zbuduj budynek handlowy + bądź w pokoju z sąsiadem → trasa handlowa (łuk na mapie + sekcja w panelu miasta + dochód/turę do skarbca).
- 2026-07-20 13:57 · stempel: ROBOCZA · **b217916e** · md5 pliku `b217916ec1352988ef9085e63c22f658` · commity `bed3ea1` + `5a7db56` (branch `main`, PUSHNIĘTE) · **MAPA: wybrzeże=woda + dłuższe pasma + rzeki do wody · HANDEL E1: Mennica + per-city surowce**:
  (a) **Wybrzeże przeklasyfikowane LĄD→WODA** (WYBRZEZE-Q1/Q2/Q3 = A/A/A) — predykaty generatora (`isLandOrCoast` itd.) liczą Wybrzeże jak wodę; pas 2 heksy zostaje; usunięte z `TERENY_LADU`/`TARTAK_TERENY` (droga/fort/posterunek precz), warzelnia soli → ulepszenie przybrzeżne (sektor woda); render obniżony do płytkiej wody (`WYBRZEZE_SURFACE_TOP_Y` 0.28→0.20, piasek tylko na brzegu). **Konsekwencja COAST-Q4=A:** balans „% lądu" liczy tylko suchy ląd → więcej lądu, mniej/większe wyspy (świadoma decyzja).
  (b) **Pasma górskie dłuższe/węższe** (HILLS-Q1/Q2/Q3 = A/A/A) — `growMountainRanges` (seed-and-grow, rdzeń Gór/obrzeże Wzgórz) + `gestosc.pasma_gorskie` (dłuższe, mniej pasm, nowy `obrzeze_szansa`) → łańcuchy zamiast plam (~3× dłuższe niż szersze); floor fair-play + sanity-cap 40% zachowane.
  (c) **Rzeki uproszczone** (RIVER-Q1/Q2/Q3 = A1/B1/C2, po zmianie wybrzeża) — ujście = każda woda (Morze∪Wybrzeże); rzeka kończy na pierwszym kontakcie; usunięty martwy kod (`coastTouchingSeaKeys`/`riverSeaGoalKeys`); bramka wzmocniona (`rivers:'high'` + `pathReachesRealSea`): **637/637 z ujściem**.
  (d) **HANDEL E1** (fundament ekonomii, BEZ tras — E2-E7 później) — Mennica po Walucie (mnożnik **easy 2/normal 1,5/hard 1**; działa tylko gdy zbudowana+Waluta → normal +50% Skarbu z handlu); per-city `city.surowce` (drewno/kamień zbierane z terenu + limit magazynu ×5; converters ożywione, bramkowane budynkami; **braz/żelazo/hodowla zostają civ-wide**). Glina/ruda jeszcze nie zbierane (brak pola ilości — do decyzji). Decyzje HANDEL-Q1..Q12.
  tsc=0 · determinizm A=B · logic 203/203 · combat 6/6 · barbarians 74/74 · villages 31/31 · converters 31/31 · mennica-magazyn 26/26 (nowy) · VERIFY OK · **ZASTĄPIONA** (→ `a31ebe6f`) · Deploy z sesji CHMUROWEJ (stamp node, brak PowerShell). Test: wygeneruj mapę (wybrzeże = płytka woda + piasek na brzegu, pasma jako łańcuchy) · miasto z Mennicą+Walutą → +50% Skarbu z handlu (normal).
- 2026-07-20 04:17 · stempel: ROBOCZA · **ba8ab0d7** · md5 pliku `ba8ab0d70e8b010c97808e9540f3bb6b` · commity `496dd53` + `a624ec4` (branch `main`, PUSHNIĘTE) · **LUDY MORZA (barbarzyńcy Brązu) + WIOSKI (goodie-huty) + naprawa bramek testowych**:
  (a) **Ludy Morza jako barbarzyńcy epoki Brąz** — gdy era gracza = Brąz (`player.era===2`), obozy spawnują WYŁĄCZNIE Wojownika Sherden i Wojownika szekelesz (naprzemiennie, deterministycznie), pełne zastąpienie, wszystkie poziomy trudności. Nowe: `game/barbarians.ts` (`LUDY_MORZA_BARB_UNIT_IDS`, `pickBronzeBarbUnit`), override `unitTypeId` w `main.ts` przed `tickCamps`. Decyzje SEA-Q1..Q4 = A/A/A/A. `units.json`: szekelesz `Kultura` „Rzymska"→„Ludy Morza" (tylko etykieta w cityPanel, bez wpływu na mechanikę; SEA-Q5=C zweryfikowane grepem).
  (b) **Wioski „goodie-hut"** — nowy `map/villages.ts` `placeVillages()` (wzorzec `spawnCamps`, deterministyczny LCG, rzadko: 1 wioska/140 heksów lądowych → mała 10 / std 29 / duża 65; wykluczenia: miasto, obóz barbarzyńców, woda/wybrzeże/góry/pustynia). Wejście jednostki gracza na wioskę → nagroda (`game/villageRewards.ts`: złoto 50% / tech 30% / jednostka 20%, kwoty skalowane erą, fallback na złoto; jednostka Kamień=Zwiadowca / Brąz=Włócznik / Żelazo=fallback złoto, decyzja WIO-Q6=A) → wioska znika. Render był gotowy (`syncVillageMeshes`), brakowało wyłącznie ustawienia `istnieje=true`. Decyzje WIO-Q1..Q5 = B/B/B/A/B.
  (c) **Naprawa bramek testowych** (były zepsute PRZED nami, nie regresja) — `combat-test` 6/6 (dodane brakujące pole `counterTyp` w harnessie `adaptUnit`); `logic-test` 203/203 (aktualizacja fixtur Brązownictwa / tempa badań ×2 / ryzyka buntu / start positions; las+złoże na jednym heksie DOZWOLONE — poluzowana asercja, silnik `gen-helpers.ts` NIETKNIĘTY, TEST-Q1=B).
  tsc=0 · tech-tree 19/0 · research 33/33 · unit-replace 10/10 · combat 6/6 · logic 203/203 · barbarians 74/0 · villages 31/31 (nowy) · map-gen determinizm A=B + 0 rzek bez ujścia · VERIFY OK · **ZASTĄPIONA** (→ `b217916e`) · Test: era Brąz → barbarzyńcy = Sherden/szekelesz; jednostka wchodzi na wioskę → nagroda + wioska znika. Deploy z sesji CHMUROWEJ (stamp przez port node'owy — brak PowerShell na Linux).
- 2026-07-19 21:52 · stempel: ROBOCZA · **a44d5350** · md5 pliku `a44d5350e0abadbad7e4ab2acc94fc3e` · commity `f8c004c` + `1ad2204` (branch `main`, PUSHNIĘTE) · **ŁAŃCUCH ŻELAZA + sync paneli Excel**:
  (a) **Jednostki epoki Żelaza wymagają surowca `zelazo`** — nowa mechanika symetryczna do brązu. Nowy `gra/src/game/zelazo-access.ts` → `hasZelazoAccess()`; bramka w `production.ts:717` (`if (surowiec === 'zelazo' && !hasZelazoAccess(...)) continue;`); **25 jednostek Epoka=Żelazo → `Surowiec: "zelazo"`** (w tym 4 konne — „Koń" zdjęty, decyzja `C-SUR-Q14 = B`). Wcześniej silnik egzekwował WYŁĄCZNIE `braz`, więc 16 jednostek żelaznych wymagało brązu, a każda inna wartość pola „Surowiec" była ignorowana. Decyzja `C-SUR-Q13 = A` (pełny łańcuch: kopalnia na złożu żelaza AND Odlewnia żelaza).
  (b) **Sync paneli Excel A–E z JSON** (`1ad2204`) + fix `gen-panel-d` (obsługa tablicy tokenów po zmianie schematu `jednostka_specjalna` na `string[]`). Kierunek JSON→Excel; zdejmuje dług „panele niezsynchronizowane".
  **ZASTĄPIONA** (→ `ba8ab0d7`) · Test: jednostki żelazne niedostępne bez kopalni żelaza + Odlewni żelaza.
- 2026-07-19 21:09 · stempel: ROBOCZA · **ca3aafa0** · md5 pliku `ca3aafa0a072695de1cd48fc7be846e7` · commity `6252736` + `98ffca0` (branch `main`, PUSHNIĘTE `49ab882..98ffca0`) · ZASTĄPIONA (→ `a44d5350`) · **„ZASTĄP" + typ Slinger + wymóg techu Triari/Evocati**:
  (a) **Mechanizm „Zastąp"** — jednostkę można zastąpić dowolną DOSTĘPNĄ jednostką tego samego pola `Typ` (nawet słabszą) + jej unikatem z nowego pola `„Zastąp specjalnie"` (tyrreński→Evocati, mykeński→Hieros Lochos). **Zasięg = CAŁE TERYTORIUM państwa** (nie tylko garnizon; reużyty `isPlayerTerritoryHex` z `map/territory.ts`); bramka koszary/surowce poza miastem = OR po wszystkich miastach gracza. Koszt = `max(0, cena nowej − cena starej)` w Pieniądzu, zużywa turę, HP zachowane procentowo, raz na turę (`replaceUsedThisTurn`), tylko własna nacja. Nowe: `production.ts availableReplacementsFor()`, `ui/unitReplacePicker.ts` (modal), akcja `replace` w ArmyStackHud, `performUnitReplace` w `main.ts`. **Rozliczanie ludności ŚWIADOMIE WYCOFANE** — wszystkie 73 jednostki mają `"Ludność": 1`, więc różnica zawsze = 0 i mechanizm nic nie robił.
  (b) **Procarz → własny typ „Slinger"** + kontry `Slinger→Spearman +50%` i `Mount→Slinger +50%` (zachowana podatność na konnicę) + **nowa kolumna `„Bonus vs Slinger %"` na 73 jednostkach** (skopiowana z „Bonus vs Distance %" — bez niej procarz byłby w bitwie taktycznej odporny na szarże 14 jednostek kawalerii, bo `battleScene.ts` czyta nazwę kolumny dynamicznie).
  (c) **Triari + Evocati wymagają techu „Hutnictwo żelaza"** (jak Hastati) — koniec elity dostępnej za darmo z samej epoki.
  (d) **`STAN-PRACY-HANDOFF.md`** w korzeniu repo — punkt wejścia dla każdej nowej sesji (także chmurowej/telefonicznej).
  tsc=0 · tech-tree 19/0 · research 33/33 · unit-replace 10/10 · map-gen determinizm A=B + 0 rzek bez ujścia · VERIFY OK · weryfikacja wzrokowa Playwright (przycisk „ZASTĄP" + modal renderują się, 0 błędów konsoli) · Test: jednostka na własnym terytorium → „Zastąp" → lista tego samego typu; procarz vs włócznik; Triari/Evocati niedostępne bez „Hutnictwa żelaza".
- 2026-07-11 02:48 · stempel: ROBOCZA · **ed16d0ea** · md5 pliku `ed16d0ea7b6bc8d5cf8ec386727b5e38` · commit `49ab882` (branch `main`, PUSHNIĘTY) · **3 zasady progresji + batch mapy + wielka naprawa jednostek**:
  (a) **Progresja epok** — twarda bramka epoki (`epochGateMet`: cała epoka odkryta przed jakimkolwiek badaniem następnej) + tier-gating T1→T2→T3 wewnątrz epoki (`epochTierGateMet`), w `research.ts` i `playerState.ts` (parytet).
  (b) **Mapa** — „min nie max" (wyłączony cap degradujący wygenerowane góry/wzgórza → +25–29% wzgórz, teren nieregularny); **wybrzeże ≥2 heksy** + eliminacja fałszywych wcięć wyglądających jak ujścia (`dryTouchSea` 13686→0); zmiękczona reguła długości rzeki (krótkie kompletne rzeki +75–116%, wszystkie z ujściem). ⚠ Napięcie zgłoszone Maciejowi: pas 2 heksów zjada 21–29% suchego lądu i redukuje liczbę rzek ~29% — **decyzja Macieja: zostaje 2**.
  (c) **Jednostki** — normalizacja `Typ` PL→EN + migracja `counters.json`; **naprawa tokenów `civs.json`: 28%→100% widocznych jednostek narodowych** (15/53→57/57); fix klucza `sumer` w `production.ts`; **fix bramki em-dash „—"** → 7 super-jednostek (Hieros Lochos, Triari, Evocati, Hu Ben Wei, uThulwana, Medżaj, Gwardia Sumeru) było **niewidocznych od zawsze**; Falanga/Hieros/Evocati→Żelazo; Triari→zamiennik włóczników; **Legion Rzymski usunięty**; Galera→Naval; szekelesz→nacja Ludy Morza.
  tsc=0 · tech-tree 19/0 · research 33/33 · determinizm A=B (`ffb7e787`) · VERIFY OK · ZASTĄPIONA (→ `ca3aafa0`)
- 2026-07-11 00:47 · stempel: ROBOCZA · **494598a3** · md5 pliku `cdf8f252` · commit `1119b45` (branch `main`, PUSHNIĘTY — `gh auth` działa) · **Drzewko 3-tier (dane) + fix miedzi + czaszka głodu** — dane drzewka `a93467` (tech/units/buildings: odwrócenie nazw żelaza „Hutnictwo↔Obróbka", 12 prereków, re-leveling `Poziom` per epoka Kamień 1-3/Brąz 4-6/Żelazo 7-9); **fix miedzi na złym terenie 25,7%→0%** (`gen-helpers.ts`, 6 miejsc — teren degradowany bez czyszczenia `zloze`); **czaszka nad głodującą jednostką** (`starvingRepIds` nigdy nie było wypełniane → sprite istniał, ale się nie renderował); naprawa wiszących referencji po renamie (`wonders.json`, Fort, **`ai.ts:409` hardcoded 'Wojskowosc'** = cicha regresja AI). Bundle zbudowany z całego drzewa → **zawiera też mgłę rzek integratora #1** (`scene.ts`). tsc=0 · tech-tree 19/0 · VERIFY OK · **⚠ NADPISAŁEM `58182469`** (deploy integratora #1) — bez meldunku w kanale, patrz uwaga wyżej · ZASTĄPIONA (→ `ed16d0ea`)
- 2026-07-11 00:06 · stempel menu: ROBOCZA · **f532c453** (lag inject = znane WARN) · **md5 pliku 58182469** `58182469ac58a3bbd0503060fcdc6dcf` · (`scene.ts` w WIP Właściciela — NIEZACOMMITOWANE) · ~~AKTUALNA~~ → **ZASTĄPIONA** (→ `494598a3`, 2026-07-11 00:47; status skorygowany wstecznie 2026-07-19) · **PUSH moich prac do ROBOCZA** (Maciej zdjął HOLD: „drugi integrator zajęty, możesz wpychać do roboczej"). Rebuild z `gra/` (vite-direct) zainline'ował `index-CzZPYNnk.js` = **identyczny JS jak 081e3e79** → potwierdza, że `gra/src` NIE zmieniło się od mojego perf-guard deployu. Zawartość = pełny łańcuch mojej sesji: jednostki `61f05ac` + muzyka `3d0a765` + wyrąb `5b7bbb1` + AI państw-kopii `6da0fbb` (HEAD) + mgła rzek per-heks + strażnik perf (`scene.ts`). tsc=0, VERIFY OK. **⚠ NADPISAŁEM `d2a346ff` (23:42)** — to był deploy drugiego integratora zbudowany z INNEGO drzewa (mój rebuild z gra/src dał inny JS). Jeśli d2a346ff niósł ich pracę spoza `gra/src`, NIE MA jej w tym bundlu → do reconcile (ich źródło bezpieczne po ich stronie; nie było logowane w kanale). · **AKTUALNA** · Test: jak niżej (mgła rzek) + reszta sesji.
- 2026-07-10 21:18 · stempel: ROBOCZA · **081e3e79** · md5 `081e3e7918e387bbf908a1eaa299a55f` · (`scene.ts` w WIP Właściciela — NIEZACOMMITOWANE) · **Mgła rzek per-heks + STRAŻNIK PERF** (na uwagę Macieja o FPS/CPU) — dołożony guard `lastFogSig`: `setIndex` (re-upload indeksu na GPU) odpala się TYLKO gdy hash stanu mgły danej rzeki się zmienił; sam zoom albo `setFog` bez zmiany tej rzeki → tylko tani 32-bit hash (`Math.imul` + `Set.has`), ZERO setIndex/alokacji. Kontekst: pętla rzek jest w `applyZoomLodDecor` — woła ją WYŁĄCZNIE `setFog`/`setZoomLod`, **nigdy render-loop** → 0 kosztu per-klatka; ukryte odcinki = MNIEJ trójkątów do rysowania (render tańszy, nie droższy). Skala ~kilka tys. `Set.has` na zdarzenie mgły — rzędy wielkości poniżej regresji DEKOR (80–150 tys.). Render-only (hash nietknięty), tsc=0, VERIFY OK · ZASTĄPIONA (→ [d2a346ff — deploy drugiego integratora, niezalogowany] → 58182469 = mój re-push) · Test wzrokowy jak niżej + F9 (fog ms) przy ruchu jednostek.
- 2026-07-10 21:05 · stempel: ROBOCZA · **a7219f7d** · md5 `a7219f7dd4cc47fb10d4e50eda02df0c` · (`scene.ts` w WIP Właściciela — NIEZACOMMITOWANE) · **Mgła rzek PER-HEKS** (poprawka linii 1b47b7fe → f6201c00 → a7219f7d) — rzeka NIE świeci na ciemnym (nieodkrytym) polu, ALE odkryty odcinek ZOSTAJE (a całość, gdy brak fog-of-war). Rzeki lądowe (jednowstęgowe, `buildRiverPointsFromHexPath` → `pointHex` = heks per punkt) w `applyZoomLodDecor` rysują tylko quady, których OBA końce są odkryte — **przebudowa INDEKSU geometrii** (pozycje wierzchołków nietknięte → wygląd wstęgi identyczny, 1 draw-call/rzekę). Delty scalone (bez `pointHex`) → fallback „ukryj całość, gdy którykolwiek heks w czerni". `hasFog=false` → indeks pełny → wszystkie rzeki. Render-only (hash nietknięty), tsc=0, VERIFY OK · ZASTĄPIONA (→ 081e3e79 = +strażnik perf) · Test wzrokowy: (1) rzeki daleko w czerni znikają; (2) odkryty kawałek obok startowego miasta widoczny; (3) mapa bez mgły = wszystkie rzeki. Pośredni build **f6201c00** (reguła `allRevealed` = ukryj gdy ≥1 heks ciemny) — przesadzał (chował też odkrytą część rzeki wchodzącej w czerń), zastąpiony per-heksem.
- 2026-07-10 20:35 · stempel: ROBOCZA · **1b47b7fe** · md5 `1b47b7fe4efa8c2ba82f9b00f37ed53f` · (`scene.ts` w WIP Właściciela — NIEZACOMMITOWANE) · **Fix: rzeki nie prześwitują przez mgłę** — korekta A-FOG-RZEKI: rzeka pełny kolor jeśli **≥1 heks odkryty/widoczny**, UKRYTA gdy CAŁA trasa w nieodkrytej czerni (bez znikania na krawędzi FoW). Render-only (hash nietknięty). Zawiera całość `e5c0fe56` (AI + wyrąb + muzyka + jednostki) + WIP Właściciela. tsc=0, VERIFY OK · ZASTĄPIONA (→ f6201c00 „allRevealed" → a7219f7d per-heks) ·
- 2026-07-10 20:25 · stempel: ROBOCZA · **e5c0fe56** · md5 `e5c0fe564b0e6e75695fe207c901ce3a` · commit `6da0fbb` (branch `main`, NIEPUSHNIĘTY) · **AI państw-kopii: aktywna defensywna gospodarka** (wybór Macieja A) — `decideDefensiveCopyTurn` dokłada PRODUKCJĘ: garnizon (Wojownik) najpierw → Mury → budynki/ekonomia; **bez ekspansji** (Osadnik pominięty), ruch nadal defensywny (garnizon/riposta, bez agresji); badania już działały. Koniec „łatwego łupu". Zawiera całość `0e15c2d2` (wyrąb + muzyka + jednostki) + niezacommitowany WIP Właściciela. Logika-only (hashe nietknięte), tsc=0, VERIFY OK · ZASTĄPIONA (→ 1b47b7fe) · Test: zdobądź/obserwuj państwo „swojego typu" — powinno budować obronę/mury/jednostki, nie stać bezczynnie.
- 2026-07-10 20:18 · stempel: ROBOCZA · **0e15c2d2** · md5 `0e15c2d2ab61528b0bc785999280c5af` · commit `5b7bbb1` (branch `main`, NIEPUSHNIĘTY) · **Balans wyrębu: netto zero** (koszt 5 Pracy → yield 5; `terrain-improvements.json` wyrab `praca_per_tura` 20→5, `tury` 3→1; było +20×3=60 windfall, wyrąb teraz 1-turowy). Zawiera całość `3fe20827` (muzyka + jednostki) + niezacommitowany WIP Właściciela. Dane-only (hashe nietknięte), VERIFY OK · ZASTĄPIONA (→ e5c0fe56) · **UWAGA:** Excel Panel-A do sync (JSON→EXCEL) przed najbliższym „eksportuj", inaczej cofnie wyrąb na 20/3.
- 2026-07-10 20:12 · stempel: ROBOCZA · **3fe20827** · md5 `3fe20827d0b937cb8efb2312b2b2943e` · commit muzyki `3d0a765` (branch `main`, NIEPUSHNIĘTY) · **MUZYKA proceduralna** (Web Audio, zero plików audio, +~26 KB): era kamień/brąz, nastrój mapa/bitwa, generatywna; hooki start(gest)/bitwa(arena)/epoka(awans)/opcje(suwak+wyłącznik w menu pauzy, `civ-music-prefs-v1`, domyślnie WŁ/0.7); autoplay-safe. Zawiera całość `2192f8bb` (jednostki) + niezacommitowany WIP Właściciela (rzeki/tech/buildings). Hooki muzyki w `main.ts` NIEZACOMMITOWANE (splecione z WIP). tsc=0, VERIFY OK · ZASTĄPIONA (→ 0e15c2d2) · Test §3: kamień od startu → bitwa gęstnieje/wraca → awans do brązu = lira → suwak/wyłącznik → 15 min.
- 2026-07-10 19:56 · stempel: ROBOCZA · **2192f8bb** · md5 `2192f8bbf37a6634b9d16670e576ed3b` · commit jednostek `61f05ac` (branch `main`, NIEPUSHNIĘTY) · **GRAFIKA-JEDNOSTKI: 9 modeli ROBLOX** (kategorie P1 + named P2/P3/P4/P57 + super P6 + łucznik asyryjski + 4× Bliski Wschód + 4× p8b w tym **Legion Rzymski**; fix Legionu ×2 `units.ts`/`setup.ts`; `applyCultureOverrides` guard dla nowych modeli) · **UWAGA:** bundle zbudowany z CAŁEGO drzewa roboczego (decyzja Macieja „deploy razem") → zawiera też NIEZACOMMITOWANY WIP Właściciela (rzeki grubość-wg-rzędu + pełny-kolor-w-mgle, `tech.json`/`buildings.json`) — źródło tego WIP zostaje niezacommitowane, do domknięcia przez Właściciela. Jednostki render-only (hashe nietknięte), tsc=0, VERIFY OK · ZASTĄPIONA (→ 3fe20827) ·
- 2026-07-10 14:31 · stempel: ROBOCZA · **3dec388b** · commit `3d5da76` (branch `main`, NIEPUSHNIĘTY — gh auth wygasł) · **RZEKI — styl finalny KANCIASTY (wall-tracing, Roblox)** · ZASTĄPIONA (→ 2192f8bb) ·
  Szósta iteracja rzek w ciągu dnia (łańcuch niżej) — powrót do trasowania **krawędziowego** (jak `06faee2`) z `sharp=true`: zero wygładzania (Chaikin/CatmullRom odrzucone), rzeka biegnie wewnętrzną stroną ścianki wzdłuż **≥2 boków/heks** (prosty=3 ścianki, łagodny skręt=2), zniesiony środkowy punkt przejścia przez ściankę (koniec „domków"), fix ujścia z HEAD zachowany (rzeki wpadają do morza). Render-only, determinizm A=B bez zmian. Zawartość bundla = **całość 9c58ebc2 (teren-mozaika `terrainCellBias` ZATWIERDZONY + modele miast kamień/brąz + lasy bez pniaków + fix cienia) + drzewko tech `22bb83a5` + GRAFIKA-TEREN-2 `f7484fe1`** — styl rzek jest jedyną zmianą względem `9c58ebc2`. Dyspozycje: `RZEKI-MODEL-PELNY-PLAN.md` (plan), `STAN-SESJI-RZEKI-DRZEWKO.md` (stan zbiorczy 2026-07-10).
  **UWAGA — ruchomy stan:** audyt dokumentacji 2026-07-10 ~15:00 zastał w drzewie roboczym NIEZACOMMITOWANE zmiany (`tech.json`, `buildings.json`, `loader.ts`, `production.ts`, `main.ts`, `cityPanel.ts`) — praca toczy się równolegle (temat rzek ponownie w iteracji). Ten wpis opisuje wyłącznie stan ZACOMMITOWANY na `3d5da76`; sprawdź `git log -1` przed poleganiem na nim jako ostatecznym.
- 2026-07-10 13:42–13:46 · **9c58ebc2** (+ fix cienia w tym samym paśmie, commit `0c8e37e`) · commit źródła `ec2a186` · **rzeki „naturalny ciek" (splajn CatmullRom, sharp=false) + naprawa ujść (root cause: `coastalRiverRenderPath` dawał łańcuch dł.1 dla 505/507 rzek) + teren per-komórka `terrainCellBias` (ZATWIERDZONE przez Macieja — „równiny/łąki równo pomieszane, plamy rozbite") + modele miast kamień/brąz Grecja-Rzym + lasy bez pniaków (`NL_NATURAL=4`) + fix cienia lewitującego (ocean `receiveShadow=false`)** · ZASTĄPIONA co do STYLU RZEK (→ `3dec388b`: kanciasty); **teren-mozaika, modele miast, lasy i fix cienia POZOSTAJĄ aktualne** (wchłonięte w `3dec388b`) ·
  Autonomiczna partia (Maciej offline ~1h, praca samodzielna) — teren i miasta zaakceptowane, styl rzek odrzucony po powrocie.
- 2026-07-10 11:04 · **f7484fe1** · commit `cee2f6a` · **GRAFIKA-TEREN-2: lasy (5×InstancedMesh, −40% tri), tarasy (kompozyt garb+półki), oaza-pustynia, wioski+obozy barbarzyńców (kolor 0xff4444)** + fixy FORT (usunięte potrójne skalowanie)/OWCE (model spójny z trzodą) · wchłonięta w `3dec388b`, bez zmian treściowych · **DEKOR mikrodekoru łąk/równin nadal OFF** (decyzja Macieja, `DEKOR_ENABLED=false`).
- 2026-07-10 09:19 · **33527d79** · commit `06faee2` · rzeki „wall-hugging + Chaikin 2×" (powrót do krawędzi po odrzuceniu centrolinii) · ZASTĄPIONA (→ `9c58ebc2`: CatmullRom, potem → `3dec388b`: kanciasty — trzecia wersja stylu rzek w ciągu dnia).
- 2026-07-10 08:53 · **22bb83a5** · commit `450394c` · **DRZEWKO TECHNOLOGII: bramka „wymagane ulepszenie" (Żegluga→Tartak), Obróbka żelaza→budynek „Piec hutniczy", pole jawne `awansDoEpoki` (Brązownictwo→2, Obróbka żelaza→3, koniec regexu `/epok/` fałszywie łapiącego Walutę/Sztukę wojenną), 20 jednostek żelaznych przeniesionych pod właściwe techy, Kusznik usunięty, Astronomia→Obserwatorium (nowy tech), Prawo (Kodeks)→Trybunał (nowy budynek)** + grafiki koń (stadnina)/kopalnia miedzi · dyspozycja `DRZEWKO-TECH-FIX.md` · testy: tech-tree 19/0, research 33/0, harness ery 14/0 · **treść wchłonięta w `3dec388b`, bez zmian od tego builda** · OTWARTE: chiński unikat dystansowy niespójny po usunięciu Kusznika (`civs.json`), panele Excel niezsyncowane z JSON.
- 2026-07-10 08:13 · **79eb3159** · commit `8a3d983` · rzeki „centrolinia" (przez środek heksa, punkty przejścia) + Praca `splitPraca` (total=round, reszta nie ginie) + Armia/Zaopatrzenie fix (panel liczył zawyżony pobór) + panel heksa (zamyka się poprawnie na inną akcję/PPM) · ZASTĄPIONA co do STYLU RZEK (centrolinia ODRZUCONA przez Macieja po teście wizualnym — „biegnie przez heksy, nie po ściance"); **Praca/Armia/panel-heksa fixy POZOSTAJĄ aktualne** (niezależne od stylu rzek, wchłonięte w kolejne buildy).
- 2026-07-09 · **bc8b8e38b5c9737e16c53d24ea1d39a2** · stempel: ROBOCZA · bc8b8e38 · **NAPRAWA REGRESJI FOG (dekor mgły diff-based) + całość: FPS + DEKOR + ZASADY-ZWIERZĄT E1–E5** · **PROMOWANA DO KANONU** (gra-kanon bc8b8e38, KANON 39aa2a2c, FINALNA 5ccffe76) ·
  Regresja z DEKOR: `applyTerrainFog` skanował ~80–150k instancji dekoru per setFog → **fog 1,9 → 139,9 ms** (F9 Macieja). Fix: dekor dzieli stan mgły z bazą terenu (`dekorRefByHex`, diff w `setFog` — tylko zmienione heksy, ten sam `sig`); `applyZoomLodDecor` zostawia tylko `dekorGroup.visible`. Oczekiwane fog ~2 ms. tsc=0 · smoke OK · vite-direct · verify OK · **AKTUALNA = KANON** (autonomicznie, Maciej nieobecny — do testu wzrokowego po powrocie; git origin/main zabezpieczony). Log: `dyspozycje/OPTYMALIZACJE-FPS-LOG.md`.
- 2026-07-09 · **f69d1b0bc13c97c83df019e8ceba6ee4** · stempel: ROBOCZA · f69d1b0b · **FPS domknięty + DEKOR + ZASADY-ZWIERZĄT E1–E5** · ZASTĄPIONA (→ bc8b8e38: naprawa regresji fog dekoru; f69d1b0b miało fog 139,9 ms) ·
  Baza = kanon a1dce24d + prace sesji 2026-07-09. DEKOR wprowadził regresję fog (skan dekoru) — naprawione w bc8b8e38. hash mapy nietknięty (55aaa07c). tsc=0 · smoke OK · verify OK.
- 2026-07-09 · **5ff6abe0a97cf8be96cc26ec40944496** · stempel: ROBOCZA · 5ff6abe0 · **EKSPERYMENT B (pomiar): przełącznik `?nobottom=0` — heks bez/z dolnej pokrywy** · ZASTĄPIONA (→ f69d1b0b: B keep + FPS domknięty + DEKOR + ZASADY) ·
  Baza = kanon 2b6c23dd (GRAFIKA-3D + FPS 1+3) + `scene.ts` flaga `B_NO_BOTTOM`: domyślnie B WŁĄCZONE (jak kanon, ~25% mniej tri bazowych), a `?nobottom=0` w URL → pełny pryzm heksa (z dolną pokrywą) do porównania. Maciej mierzy F9 `tri` z-B (domyślnie) vs bez-B (`?nobottom=0`) na nowej bazie → werdykt keep/rewert B. tsc=0 · vite-direct · 9 plików + hub · verify OK · **AKTUALNA (pomiar F9 B)**. Źródło toggle niezacommitowane (czeka na werdykt).
- 2026-07-09 · **97d1b9cb2edfeb4a21205ffd12baae7f** · stempel: ROBOCZA · 97d1b9cb · **FPS lewar 1+3: scalanie dekoracji per-heks → 1 mesh + zamrożone macierze** · ZASTĄPIONA (→ promowana do KANON 2b6c23dd; robocza → 5ff6abe0 eksperyment B) ·
  Atak na anomalię z F9 `mesh 1,3 mln` (CPU: traversal/culling/macierze per obiekt). `render/mergeDecor.ts` `collapseToMergedMesh` scala grupę dekoracji (zwierzęta ~125 boxów/heks, budynki, złoża, wybrzeże/plaże/wydmy/oazy) w JEDEN mesh z vertex colors (fog-dimming zachowany przez własny materiał, jak w terenie). Wpięte: resourceOverlays, improvementMeshes (main.ts), styledOverlays (scene.ts). `matrixAutoUpdate=false` na statycznych (lewar 3). Fail-safe (błąd merge → grupa bez zmian). Oczekiwane: mesh 1,3 mln → ~dziesiątki tys.
  tsc=0 · merge unit-test 12/12 · map-gen determinizm IDENTYCZNY. UWAGA: smoke daje false-negative na instancingu terenu (stage-2) w jsdom — walidacja przez F9 Macieja. **BRAK: lewar 5** (chunking bazowego terenu = `tri 6,7 mln` GPU) — świadomie wstrzymany do potwierdzenia CPU-fixu na F9 (rdzeń renderu+fog, nie do wdrożenia na ślepo). vite-direct · 9 plików + hub · verify OK · **AKTUALNA (test F9 Macieja)**.
- 2026-07-09 · **ab5b8527a5a0912aeca7129948c402e7** · stempel: ROBOCZA · ab5b8527 · **GRAFIKA-3D KOMPLET: partie 1-3B + TEREN oba etapy (podmiana + 10 InstancedMesh) + stadnina quality** · ZASTĄPIONA (→ 97d1b9cb = +FPS lewar 1+3) ·
  Całość 64b633b1 + **TEREN stage 2**: góry/wzgórza (styl roblox) jako **10 InstancedMesh** (5+5 wariantów, wspólny TEREN_MATERIAL) zamiast per-heks styledOverlays — batching FPS. Pełna maszyneria FoW (matrix-hide nieodkryte/miasto + instanceColor-dim explored ×0.175), hide-on-hex, LOD, dispose. **Stadnina wg jakości**: WYSOKA=2 konie, NISKA/NORMALNA=1. FORT 1/3. Wysokości logiczne + hashe mapy nietknięte.
  tsc=0 · smoke OK · **map-gen determinizm IDENTYCZNY** · vite-direct (bez prebuildu) · 9 plików + hub na `ab5b8527` · verify OK · publikował CODE-INTEGRATOR · **AKTUALNA (wielki test Macieja z F9 — rano)**.
- 2026-07-09 · **64b633b1accdb80fd7948f1fd740ed59** · stempel: ROBOCZA · 64b633b1 · **GRAFIKA-3D partie 1-3B + TEREN stage 1** · ZASTĄPIONA (→ ab5b8527 = +TEREN stage 2 InstancedMesh + stadnina quality) ·
  Zawiera całość 27cb7771 (koń+lanca, pastwisko, budynki, osady, woda/wojsko/drogi, złoża) + **partia TEREN stage 1**: 5+5 wariantów sylwetek gór/wzgórz (`teren-gory-wzgorza.ts`, zmergowana geometria+vertex colors), `buildStyleMountainPeak`/`HillBump` roblox → nowy model = **1 mesh/heks zamiast 12-14** (spadek draw calls terenu). tsc=0 · smoke OK · **map-gen determinizm IDENTYCZNY** · verify OK · publikował CODE-INTEGRATOR · **AKTUALNA (test Macieja)**. BRAK: TEREN stage 2 (scene.ts 10 InstancedMesh = pełny batching FPS) — follow-up.
- 2026-07-09 · **27cb77715abf5ba302f5b737edd0cae6** · stempel: ROBOCZA · 27cb7771 · **GRAFIKA-3D partie 1+2+3A+3B (ROBLOX): koń+lanca, pastwisko, budynki, osady, woda/wojsko/drogi, złoża** · ZASTĄPIONA (→ 64b633b1 = +TEREN stage 1) ·
  P1 nowy koń (moduł kon-nowy-model, konnica/rydwan/onager + fix lancy) + pastwisko (krowa/owca/lama) + złoża bydła/owiec/koni. P2 farma/kopalnia/kamieniołom/tartak. P3A wyrąb/obóz/glinianka/warzelnia/łodzie/stadnina (własny model + konie). P3B irygacja/pole/fort(1/3)/posterunek/drogi/złoża mineralne. Bazuje na perf 00a372f4.
  tsc=0 · smoke OK · map-gen determinizm IDENTYCZNY (render-only, gen nietknięty) · vite-direct · 9 plików + hub na `27cb7771` · verify OK · publikował CODE-INTEGRATOR · **AKTUALNA (test Macieja)**. BRAK: partia TEREN (góry/wzgórza + instancing FPS) — follow-up.
- 2026-07-09 · **00a372f495e8f55ee9edaa4bf9a7914f** · stempel: ROBOCZA · 00a372f4 · **WYDAJNOŚĆ B + D4–D13 (zakładanie miasta 30 s→1,67 s, wejście do miasta 60 s→1,4 s) — diagnostyka zdjęta** ·
  lokalne enumeracje zamiast pełnomapowych skanów `Object.keys(map.hexes)`: D5/D6/D9 (wejście), **D13** `getQualifyingHexes` w `map/improvement-build.ts` = kandydaci [terytorium+ring ∪ drogi ∪ placed ∪ pendingUndo] zamiast 19×320k; D7 player-only, D10 event-trigger (dirty-flag), D11 gate minimapy, D12 dedup refreshFog/sync; B = geometria heksa bez dolnej pokrywy (~25% mniej tri). Czerwony box + timery serii D usunięte.
  tsc=0 · smoke OK · owner-economy 9/9 · wire-ekonomia 37/37 · qualify 44/44 · owner-epoch 7/7 · D13 równoważność candidate==full-scan (19/19 typów) · vite-direct (bez export-data.py) · 9 plików + hub na `00a372f4` · verify OK · publikował CODE-INTEGRATOR · **AKTUALNA** (→ promowana do KANON bbcacc13).
- 2026-07-08 21:27 · **dfa3f2e2f747059884aa6d2918250253** · stempel: 2026-07-08 21:27 · e6ba6cd5 · **B (test wydajności): heks bez dolnej pokrywy — ~25% mniej trójkątów bazowych** ·
  `hexPrismNoBottomGeo` w `render/scene.ts` (usunięta niewidoczna dolna pokrywa, boki+góra zostają → pixel-identycznie). tsc=0 · vite-direct
  (bez export-data.py) · 9 plików + hub na md5 `dfa3f2e2` · verify OK. NIEZACOMMITOWANE (build testowy do pomiaru F9: tri przed↔po; kanon 51c2eb24
  bezpieczny na GitHub 32dca78 = fallback). Po pomiarze: commit jeśli OK / rewert jeśli nie · publikował CODE-INTEGRATOR · **ZASTĄPIONA** (→ 00a372f4 = B + D4–D13 zacommitowane; kanon bbcacc13).
- 2026-07-08 19:50 · **51c2eb248aedac4f97a78854ad9b7422** · stempel: 2026-07-08 19:50 · 7fe722e3 · **WYDAJNOŚĆ D1+D3 na KANONIE `gra/src` + fix drzewka technologii przywrócony na live** · ZASTĄPIONA (→ dfa3f2e2 test B; ta wersja = KANON 8adcd682) ·
  Zbudowane z committed `gra/src` @ **865c94e** (wypchnięty na origin/main) — koniec ery deploy-only D1/D3, live=commit. vite-direct
  (bez `npm run build`/`export-data.py` → **balans zachowany**: Falanga=45). WSZYSTKIE 9 plików + hub na tym samym md5 `51c2eb24`
  (spójność). tsc=0 · bundle-gate HOST-verified: **drzew 88 / Nauka 129** (stary live c293647 miał 87/128 = **regres drzewka
  NAPRAWIONY**), viewBox 343, counterTyp 7 · FRESH≥LIVE i ==HEAD · publikował CODE-INTEGRATOR · **AKTUALNA (klucz=stempel)**.
- 2026-07-08 11:40 · stempel: 2026-07-08 11:40 · c293647ccedf · **WYDAJNOŚĆ D1+D3** (kolejka D1→D3→D2, osobno) ·
  D3 = usunięty zbędny `refreshFog()` z `applyCityPanelWorldView` (main.ts) — otwarcie panelu miasta nie zmienia wejść
  mgły (setFog no-op); widoczność miast ustawia `cityRenderer.sync()`; poprawność mgły zapewniają realne zdarzenia.
  `refreshFog();` 27→26 (usunięta dokładnie 1). + D1. Z HEAD bc51a01 (sejwy+HEAD zachowane). tsc=0 · vite OK · pending=0 ·
  10 plików · hub · HOST-verify · publikował INTEGRATOR · ZASTĄPIONA (→ 51c2eb24…, stempel 7fe722e3 · 2026-07-08 19:50 — właściwy build z committed `gra/src` @ 865c94e). D2 następne (osobno, +`?culling=0`).
- 2026-07-08 11:20 · stempel: 2026-07-08 11:20 · 6102654b5d60 · **WYDAJNOŚĆ D1** (kolejka Mastera D1→D3→D2, osobno) · ZASTĄPIONA (→ c293647ccedf) ·
  D1 = lokalna enumeracja heksów (helper `hexKeysWithinRadius`) zamiast pełnomapowych skanów `Object.keys(map.hexes)`
  przy otwarciu miasta — `okolicaTiles`/`hexesInCitySight`/`collectRangeKeys` (320k→~700, ~450×). Zbudowane z HEAD
  **bc51a01** (zawiera moduł sejwów Cursora + plony z Excela + panel B14 + drzewko tech — nic nie nadpisane; D1 dotyka
  tylko okolica.ts/resource-access.ts/cityOkolicaOverlay.ts). tsc=0 · vite OK · pending=0 · 10 plików · hub · HOST-verify ·
  publikował INTEGRATOR · AKTUALNA (klucz=stempel). Uwaga: podniosło live z 3b089468→bc51a01. D3, D2 następne (osobno).
- 2026-07-06 20:41 · stempel build 371151b5544247c1e66f93597770c2f8 · ROBOCZA · 371151b5 · 20:41 · ZASTĄPIONA (→ 6102654b5d60; między nimi buildy Cursora be32d0a8/58e76604/6e3027fe/3b089468 — wciągnięte przez bc51a01) ·
  SAVE/LOAD UX: dialog zapisu (nazwa sejwu) + dialog wczytywania (lista slotów, usuwanie);
  wczytanie z menu regeneruje mapę z seeda zapisu (fix „randomowa gra"); z-index dialog nad menu;
  Kontynuuj → wybór sejwu. tsc=0 · smoke OK · publish Cursor (wyjątek Macieja, bez Integratora)
- 2026-07-06 18:35 · <plik-md5 dryfuje> · stempel: 2026-07-06 18:35 · e4d99a49b659 ·
  FIX duplikatu „SUROWCE W ZASIĘGU" w panelu miasta (usunięte wywołanie `appendW4TabFooter` @6489 w
  `ui/cityPanel.ts`). + całość d744 (balans, countery, rzeki, KONTRAKT #8, UX, roster, obwódki, duże bitwy).
  tsc=0/vite OK · pending=0 · 9/9 · hub · HOST-verify. Build z klonu; do repo po pushu · AKTUALNA (klucz=stempel)
- 2026-07-06 18:10 · <plik-md5 dryfuje> · stempel: 2026-07-06 18:10 · d744cd7956fb · ZASTĄPIONA (→ e4d99a49b659) ·
  COUNTERY po polu `Typ` (counterMultiplier czyta `counterTyp` z def['Typ']) — włócznicy o opisowych
  nazwach dostają +50% vs konnica; `game/combat.ts` + `battle/battleScene.ts`. + całość 7fb9f6d3e8fb
  (balans HP×2/dyst×0.5, rzeki, KONTRAKT #8, UX, roster, obwódki, duże bitwy). tsc=0/vite OK · pending=0 ·
  9/9 · hub · HOST-verify. Build z klonu; do repo po pushu Macieja · publikował INTEGRATOR · AKTUALNA (klucz=stempel)
- 2026-07-06 17:55 · <plik-md5 dryfuje> · stempel: 2026-07-06 17:55 · 7fb9f6d3e8fb · ZASTĄPIONA (→ d744cd7956fb) ·
  BALANS-WALKI (wartości Macieja z uploadu Jednostki-PL0.xlsx): HP×2 + dystans×0.5 dla
  jedn. z polami EN; Falanga=40; 26 jedn. PL0 uzupełnione pola EN + Typ; 3 przemianowania
  (Legionarius→Legion Rzymski itd.); wszystkie 75 z Typ. + całość a9fffc3e (rzeki, KONTRAKT #8,
  UX, roster, obwódki, duże bitwy). tsc=0/vite OK · pending=0 · 9/9 · hub. Build z klonu na
  „wpinaj" Macieja; publikował INTEGRATOR
- 2026-07-06 16:52 · a9fffc3eeeb9 · stempel: 2026-07-06 16:52 · d3a3edb52848 · ZASTĄPIONA (→ 7fb9f6d3e8fb)
  BUILD ZBIORCZY z GitHub HEAD b1b9fed (pierwszy build po migracji na GitHub): rzeki
  „wodospad" (render-only, hash bezpieczny) + KONTRAKT #8 ikony jednostek (⚔️→SVG w
  stosie armii / panelu [H] / scal-rozdziel) + grafiki UX [16:20] (ikony surowców mapy
  + teren) + podmiany UX [16:40] (7× emoji→SVG) + całość d4d667d8 (siatka rostera 6 kol,
  obwódki właściciela, tonięcie, zaznaczenie, duże bitwy, port UX). tsc=0 · HOST-verified
  (stempel + owner-ring + resources-map + menu-save) · pending=0 · 9 plików spójne
  (wewn. stempel d3a3edb52848) · hub odświeżony · publikował INTEGRATOR · AKTUALNA
  (czeka na playtest Macieja). UWAGA: klucz wersji = WEWN. STEMPEL (md5 pliku dryfuje na OneDrive).
- 2026-07-06 13:47 · a76514621f02 · stempel: 2026-07-06 13:47 · bdc95d91be71 · ZASTĄPIONA (→ a9fffc3eeeb9)
  #4 ROSTER bitwy: słupek → SIATKA 6 kolumn (wg kanonu C09 v4 + DESIGN-SPEC v4;
  gridTemplateColumns repeat(6,minmax(0,1fr)) + gap 4 na roster-group-cards). Reszta
  jak 7ffa2859 (port UX + rzeki + obwódki + tonięcie + zaznaczenie + duże bitwy).
  tsc=0 · roster-group-cards HOST-verified · pending=0 · 9 plików · hub odświeżony ·
  publikował INTEGRATOR · AKTUALNA (czeka na playtest Macieja — OBIEG §9)
- 2026-07-06 12:46 · 7ffa28596769 · stempel: 2026-07-06 12:46 · c169df028365 · ZASTĄPIONA (→ a76514621f02)
  PORT UX wpięty (rebuild łączony): buildModeHud emoji→SVG (panel Ulepszeń) +
  brandAssets.improvementIconSvg + improvement-icon-map.json + cityPanel nowsza
  (karty budynków Poziom B + rekrutacja + ramka zakładek W4) + nowe unitRecruitCard.ts
  i unitInfographic.ts. Zawiera też całość d4d667d8 (rzeki+C3+B0.6+zoomLOD+obwódki+
  tonięcie+zaznaczenie+duże bitwy). tsc=0 · markery imp-farm/unitRecruit/owner-ring
  HOST-verified · pending=0 · hub+manifest odświeżone · 9 plików na tym md5 ·
  publikował INTEGRATOR · AKTUALNA (czeka na playtest Macieja — OBIEG §9)
- 2026-07-06 11:34 · d4d667d80ebb · stempel: 2026-07-06 11:34 · e47323c170ab · ZASTĄPIONA (→ 7ffa28596769)
  GŁÓWNA GRA odświeżona do najnowszego bundla (był desync — wisiała na 26730a2a).
  Zawiera: 26730a2a (rzeki+C3+B0.6+zoomLOD+UX) + obwódki właściciela jednostek
  (own=niebieski/wróg=czerwony) + zaznaczenie w kolorze właściciela + fix tonięcia
  na wzgórzach/górach + duże bitwy (arena, deploy:true). tsc=0 · marker civ-owner-ring
  HOST-verified · pending=0 · WSZYSTKIE playtesty na tym samym md5 (spójność) ·
  POLE-BITWY skasowany (niepodpięty do głównej gry) · publikował INTEGRATOR · AKTUALNA
- 2026-07-06 09:12 · 26730a2ab4ec9e11425a8a090d4b1caf · stempel: 2026-07-06 09:12 ·
  3b15f0bab7f6 · ZBIORCZY: rzeki (bezUjscia=0/sieroc=0) + C3 porcjowana scena +
  **B0.6 frustumCulled=false ×12 (zalany ląd)** + zoom LOD A1+A4 + B1-B2 (sanitizeCoast
  BFS + early-exit) + panel „Moc imperium v3" (UX) · tsc=0 · weryfikacja PASS ·
  hash ziemia/42=4284176530 (determinizm) · stempel HOST-side POTWIERDZONY · publikował
  INTEGRATOR (bash-first /tmp/build, srcKopiaMaster=lustro) · ZASTĄPIONA (→ d4d667d80ebb)
- 2026-07-06 01:01 · bc04038ffd30db33d9ed5e1a81c83ee4 · stempel: 2026-07-06 01:01 ·
  fc15d6ca71c4 · RZEKI KOMPLET (każda główna z ujściem, zero sierocych delt,
  pruneOrphanRiverPaths) + całość batchy z wczoraj; UWAGA: UI w wersji sprzed
  batcha T4b-T5 (odtworzenie UI od zera = następny build) · publikował MASTER
  awaryjnie (decyzja Macieja); stempel zweryfikowany HOST-side · ZASTĄPIONA (→ 26730a2ab4ec)
- 2026-07-06 ~03:40 · f199c4c808e6… · stempel: BŁĄD (PENDING — deploy niestemplowanej
  kopii) · rzeki domknięte (bezUjscia=0, sieroc=0) + całość z 22:37 · DO POPRAWKI
  (integrator przestemplowuje — patrz kanał [03:50])
- 2026-07-05 ~22:37 · b04524f11a87ebb65df3871332f301d7 · 2026-07-05 · d3b1aee7f5af ·
  overlay+worker, B0.9, panel wydajności, A5, H1, rzeki I1/I2 · ZASTĄPIONA
- 2026-07-05 17:37 · 23d76157a8e3610b9eaae454bb97bdb5 · (bez stempla w menu) ·
  ostatni publish Cursora sprzed przejęcia · ZASTĄPIONA

## PLAYTESTY-BITWY (osobne pliki testowe w gra-robocza\ — nie główna gra)
- 2026-07-06 10:53 · 486a65094ddb · stempel: 2026-07-06 10:53 · 4771ec9ba9f0 ·
  DWIE DUŻE BITWY jako ARENA taktyczna: `Gra-ROBOCZA-PLAYTEST-BITWA-DUZA.html` (pole) +
  `Gra-ROBOCZA-PLAYTEST-OBLEZENIE-DUZE.html` (mur). Na boot odpalają PROSTO `BattleScene`
  (armia vs armia), z pominięciem mapy świata. Skład/strona: 10 Hastati/Falanga + 10 Łucznik
  + 8 Konnica (konnica na skrzydłach). Oblężenie: defCiv=grecja + machiny u atakującego
  (ensureSiegeMachines). Presety `bitwa_duza_pole`/`oblezenie_duze` + `launchBigPresetBattle`.
  tsc=0 · markery arena HOST-verified · pending=0 · źródło w srcKopiaMaster · AKTUALNA
- 2026-07-06 10:32 · e893f8bfd47c · stempel: 773234ea3a68 · WERSJA MAPOWA (28 jedn./stronę
  rozstawione na MAPIE ŚWIATA) — ZŁY POZIOM, Maciej chciał areny · ZASTĄPIONA (→ 486a65094ddb)

## KANON (gra-kanon\)
- 2026-07-20 · **d4052380684091f18fbc28bb6941aa14** · stempel KANON: **d4052380** (FINALNA **69bef0b2**) · źródło robocza md5 **a31ebe6f** · **PROMOCJA po teście Macieja** („sprawdzone") — pierwszy kanon od 2026-07-09, obejmuje **11 dni pracy**. Zawartość = całość roboczej `a31ebe6f`:
  **Drzewko i jednostki:** drzewko 3-tier + 3 zasady progresji epok (twarda bramka epoki + tier-gating T1→T2→T3) · wielka naprawa jednostek (normalizacja `Typ` PL→EN + migracja counters, **tokeny civs.json 28%→100%** widocznych jednostek narodowych, fix klucza `sumer`, **fix bramki em-dash → 7 super-jednostek niewidocznych od zawsze**, Legion Rzymski usunięty, Galera→Naval) · mechanizm **„Zastąp"** (zamiana na dostępną jednostkę tego samego `Typ` + unikat, zasięg = całe terytorium, koszt = różnica w Pieniądzu) · **typ „Slinger"** dla Procarza + kontry + kolumna „Bonus vs Slinger %" · **łańcuch żelaza** (`zelazo-access.ts`: kopalnia na złożu żelaza AND Odlewnia żelaza; 25 jednostek epoki Żelaza na `Surowiec=zelazo`).
  **Świat:** **Ludy Morza** jako barbarzyńcy epoki Brąz (Sherden/szekelesz) · **wioski goodie-hut** (złoto/tech/jednostka) · mapa: **wybrzeże = woda**, **pasma górskie** (łańcuchy zamiast plam), rzeki uproszczone (**637/637 z ujściem**), „min nie max" reliefu, fix miedzi (0% na złym terenie).
  **Ekonomia:** Mennica naprawiona · per-city surowce logistyczne + zbieranie gliny (Cegielnia/Garncarnia ożywione) · **realne szlaki handlowe** (wykrywanie połączeń + dochód obustronny + UI w panelu miasta i łuki na mapie).
  **Bramki w chwili promocji:** tsc=0 · tech-tree 19/0 · research 33/33 · unit-replace 10/10 · **combat-test 6/6** i **logic-test 203/203** (dawne „znane porażki" — naprawione) · map-gen determinizm A=B. ROBOCZA po promocji nietknięta (`a31ebe6f`, VERIFY OK). Promocja skryptem `publish-kanon-snapshot.ps1` (zastępuje poprzedni kanon bez archiwum w repo). publikował INTEGRATOR #2 · **AKTUALNA**
- 2026-07-09 · **dee7140df6e7012213918913deba7c9e** · stempel KANON: **6a6e9820** (FINALNA 0d5234cd) · źródło robocza md5 **dee7140d** · **ZASTĄPIONA** (→ `d4052380`, 2026-07-20) · re-promocja (decyzja Macieja) — build z **fix #1 z code-review** (gołe ocalałe złoże bydła/owiec pod miastem renderuje się; było znikało). Fog potwierdzony F9 Macieja **2,3 ms** (regresja 139,9 naprawiona). Zawartość = bc8b8e38 + fix #1. Decyzje po review: #2 (fort/droga na złożu konia) — ZOSTAJE (koń współistnieje); #3 marginalne. publikował CODE-INTEGRATOR · **AKTUALNA**
- 2026-07-09 · **bc8b8e38b5c9737e16c53d24ea1d39a2** · stempel KANON: **39aa2a2c** (FINALNA 5ccffe76) · źródło robocza md5 **bc8b8e38** · promocja AUTONOMICZNA (Maciej „wyślij do kanonu", nieobecny) — build BEZ regresji fog. Zawartość = całość a1dce24d + **FPS domknięty** (diff-fog 41→~2 ms · cienie na żądanie · matrixAutoUpdate · minimapa klik→kamera) + **DEKOR** mikrodekor łąk/równin (regresja fog dekoru naprawiona → diff-based) + **ZASADY-ZWIERZĄT E1–E5** (lama wzgórza/góry · koń poza food-gate · Nowy Świat koń · Trzoda · posiew lamy Inków · macierz miasta B). hash mapy nietknięty (55aaa07c) · tsc=0 · smoke OK. **Do testu wzrokowego Macieja** (gameplay ZASAD + core mgły/cieni nietestowane wizualnie). publikował CODE-INTEGRATOR (publish-kanon-snapshot.ps1) · **ZASTĄPIONA** (→ dee7140d: fix #1 gołe złoże pod miastem)
- 2026-07-09 · **a1dce24d80b1ed64e906b9715d11def6** · stempel KANON: **a1dce24d** · źródło robocza md5 **7dd9bb7a46dd** · promocja PO stabilizacji FPS (Maciej „push do kanonu"). Zawartość = całość 2b6c23dd (GRAFIKA-3D KOMPLET + FPS lewar 1+3, F9 **52 FPS**, mesh 1,3mln→39k) + **B sfinalizowane** (heks bez dolnej pokrywy zostaje; toggle ?nobottom=0) + **naprawa smoke** (async-poll, koniec false-negative na instancingu) + **optymalizacja minimapy** (cache getMinimapData + pomijanie mgły w renderze; hitch ~795ms przy zakładaniu miasta). publikował CODE-INTEGRATOR (publish-kanon-snapshot.ps1) · **ZASTĄPIONA** (→ bc8b8e38, 2026-07-09: +DEKOR +ZASADY-ZWIERZĄT +FPS domknięty)
- 2026-07-09 · **2b6c23dd4e15d5caf4941107d2c03a8d** · stempel KANON: **2b6c23dd** · źródło robocza md5 **97d1b9cb2edf** · promocja PO GRAFICE-3D + FPS (decyzja Macieja [12:55]; F9: FPS 25 · draw 835). Zawartość = całość bbcacc13 (B + D4–D13) + GRAFIKA-3D KOMPLET + FPS lewar 1+3. publikował CODE-INTEGRATOR · **ZASTĄPIONA** (→ a1dce24d, 2026-07-09)
- 2026-07-09 · **bbcacc138dde46ec0b0f136e3097c283** · stempel KANON: **bbcacc13** · źródło robocza md5 **00a372f495e8** · promocja PO pracy nad wydajnością (Maciej: „kanon plus git działaj start"). Zawartość = B (geometria heksa) + D4–D13 (zakładanie 30 s→1,67 s, wejście 60 s→1,4 s), diagnostyka zdjęta; **poprawność ekonomii zachowana** (lokalne enumeracje == pełne skany, D13 równoważność 19/19). Bazuje na 51c2eb24 (D1/D3 + drzewko + balans). publikował CODE-INTEGRATOR (publish-kanon-snapshot.ps1) · **ZASTĄPIONA** (→ 2b6c23dd, 2026-07-09)
- 2026-07-08 21:02 · **f2dcbbb8d9e7707d779d310ecff9a643** · stempel KANON: **8adcd682** · źródło robocza md5 **51c2eb248aed** · promocja z roboczej PRZED pracą nad wydajnością (Maciej: „wypchnij obecną wersję do kanonu"). Zawartość = live D1/D3 (miasto szybko + mgła) + fix drzewka NA GÓRZE + balans/countery/plony/rzeki/ikony; źródło `865c94e` na origin. **Bez** eksperymentu B (geometria heksa). publikował CODE-INTEGRATOR (publish-kanon-snapshot.ps1) · **ZASTĄPIONA** (→ bbcacc13, 2026-07-09)
- 2026-07-06 20:17 · **7856d3451a0cb3963bd3c50c032f5ad5** · stempel wewn.: **d744cd7956fb**
  (2026-07-06 18:10) · promocja Cursor Grupa G z roboczej (Maciej: playtest OK + GitHub
  bad0c7f). Zawartość: rzeki wodospad, KONTRAKT #8 ikony, UX emoji→SVG, siatka rostera
  6 kol., obwódki właściciela, duże bitwy arena, port UX W4, balans HP×2/dyst×0.5,
  countery po polu `Typ`, C3/B0.6/Test wydajności/A5/H1. gra/src zsynchronizowane ze
  srcKopiaMaster. tsc=0 · smoke OK · publikował Cursor (publish-kanon-snapshot.ps1) · **ZASTĄPIONA** (→ 51c2eb24 / kanon 8adcd682, 2026-07-08 21:02)
- 2026-07-06 ~03:55 · skopiowany przez Cursora bundle f199c4c8 (ze stemplem PENDING) ·
  **ZASTĄPIONA** (→ 7856d345)

## FINALNA (root)
- 2026-07-20 · **69bef0b26221b5e6087dd28f7fc12722** · stempel FINALNA: **69bef0b2** · zsynchronizowana z kanonem **d4052380** (źródło robocza `a31ebe6f`; drzewko+jednostki+„Zastąp"+żelazo+Ludy Morza+wioski+mapa+szlaki handlowe; `Gra-FINALNA.html`) · promocja po teście Macieja · **AKTUALNA**
- 2026-07-09 · **fae546caae8d3220f18611418ca2efc0** · stempel FINALNA · zsynchronizowana z kanonem a1dce24d (źródło robocza 7dd9bb7a; GRAFIKA-3D + FPS 1+3 + minimapa; Gra-FINALNA.html) · **ZASTĄPIONA** (→ `69bef0b2`, 2026-07-20)
- 2026-07-09 · **3a8dd4bb5c5e8691f37d5fd3d92a9ffa** · stempel FINALNA · zsynchronizowana z kanonem 2b6c23dd (źródło robocza 97d1b9cb; Gra-FINALNA.html) · **ZASTĄPIONA** (→ fae546ca, 2026-07-09)
- 2026-07-09 · **676809f2bdf06d7c5a55bfb45ad1469e** · stempel FINALNA · zsynchronizowana z kanonem bbcacc13 (źródło robocza 00a372f4; Gra-FINALNA.html) · **ZASTĄPIONA** (→ 3a8dd4bb, 2026-07-09)
- 2026-07-08 21:02 · **605761807eb0b79f43c047c4e70916f7** · stempel FINALNA · zsynchronizowana z kanonem 51c2eb24 (Gra-FINALNA.html) · **ZASTĄPIONA** (→ 676809f2, 2026-07-09)
- 2026-07-06 20:17 · **7856d3451a0cb3963bd3c50c032f5ad5** · zsynchronizowana z kanonem
  (Gra-FINALNA.html) · **ZASTĄPIONA** (→ 60576180)
