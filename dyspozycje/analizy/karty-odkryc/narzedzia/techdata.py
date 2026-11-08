# -*- coding: utf-8 -*-
# Dane turnieju: kandydaci per odkrycie.
# c(id, obj, txt, cel, ev, S, N, B, Z, O, C, sr=False)
#   txt  = sformułowanie dla gracza (<= ~70 znaków)
#   cel  = fraza po „aby …" do sekcji „Co możesz teraz zrobić" (None = kandydat nie jest celem czynności)
#   ev   = dowód plik:linia (aliasy rozwijane w generatorze)
#   S N B Z O C = SKALA, NOWA MECHANIKA, BRAK ZASTĘPNIKA, ZASIĘG, ODCZUWALNOŚĆ, CZYTELNOŚĆ (0-5)
#   sr   = True gdy pewność ŚREDNIA (wartość pewna, ale warunek/stosowanie niezweryfikowane w pełni)

def c(id, obj, txt, cel, ev, S, N, B, Z, O, C, sr=False):
    return dict(id=id, obj=obj, txt=txt, cel=cel, ev=ev, sc=(S, N, B, Z, O, C), sr=sr)

# Czynności (obiekt -> tekst czynności w „Co możesz teraz zrobić")
ACT = {
    'B:stolarnia': 'Zbuduj Stolarnię',
    'B:palisada': 'Zbuduj Palisadę drewnianą',
    'I:tartak': 'Postaw Tartak na polu lasu',
    'U:taran': 'Zrekrutuj Taran',
    'I:posterunek': 'Postaw Posterunek na skraju granic (wymaga też Murarstwa/Obróbki drewna)',
    'B:spichlerz': 'Zbuduj Spichlerz (gdy masz ceramikę)',
    'B:garncarnia': 'Zbuduj Garncarnię przy dostępie do gliny',
    'B:cegielnia': 'Zaplanuj Cegielnię (dostępna od epoki Brązu)',
    'I:glinianka': 'Postaw Gliniankę na złożu gliny',
    'I:warzelnia': 'Postaw Warzelnię soli na wybrzeżu lub złożu soli',
    'I:kamieniolom': 'Postaw Kamieniołom na wzgórzu lub w górach',
    'B:kamieniarski': 'Zbuduj Warsztat kamieniarski',
    'B:stela': 'Postaw Stelę / Pomnik',
    'I:farma': 'Postaw Farmę na łące lub równinie',
    'I:tarasy': 'Postaw Tarasy uprawne na wzgórzu (Chińczycy, Inkowie)',
    'I:oboz': 'Postaw Obóz łowiecki w lesie z Tartakiem',
    'U:lucznik': 'Rekrutuj Łuczników',
    'I:trzoda': 'Postaw Trzodę na łące lub równinie',
    'I:owce': 'Postaw Owce na wzgórzu',
    'I:lama': 'Postaw Lamy w górach (Inkowie)',
    'B:kregi': 'Zbuduj Kamienne kręgi',
    'W:wyrocznia': 'Wznieś cud Wyrocznia',
    'B:targowisko': 'Zbuduj Targowisko',
    'M:handel': 'Wyznacz trasy handlowe między miastami',
    'I:irygacja': 'Postaw Irygację przy rzece',
    'B:studnia': 'Zbuduj Studnię',
    'I:droga': 'Połącz miasta Drogą',
    'U:rydwan_woly': 'Rekrutuj Rydwan (woły)',
    'B:odlewnia_brazu': 'Zbuduj Odlewnię brązu',
    'I:kopalnia_miedzi': 'Postaw Kopalnię miedzi na złożu',
    'I:kopalnia_cyny': 'Postaw Kopalnię cyny na złożu',
    'B:kuznia': 'Zbuduj Kuźnię brązu',
    'U:braz': 'Zbuduj Koszary (Wojskowość) i rekrutuj jednostki z brązu',
    'M:embark': 'Zaokrętuj wojsko lądowe',
    'B:port': 'Zbuduj Port handlowy w mieście nad wodą',
    'I:lodzie': 'Postaw Łodzie rybackie na ławicy',
    'U:galera': 'Zbuduj Galerę w mieście nad wodą',
    'W:hamonga': "Wznieś cud Kamień Ha'amonga",
    'B:biblioteka': 'Zbuduj Bibliotekę',
    'B:spichlerz_ii': 'Rozbuduj Spichlerz do Spichlerza Królewskiego',
    'B:swiatynia': 'Zbuduj Świątynię (obok Kamiennych kręgów)',
    'U:konnica': 'Rekrutuj Konnicę (w mieście z Koszarami)',
    'I:stadnina': 'Postaw Stadninę na złożu koni',
    'B:koszary': 'Zbuduj Koszary',
    'I:fort': 'Postaw Fort na granicy',
    'B:emporion': 'Zbuduj Emporion (obok Targowiska)',
    'B:magazyn': 'Zbuduj Magazyn',
    'B:dwor': 'Rozbuduj Dom Starszyzny do Dworu Zarządcy',
    'B:trybunal': 'Zbuduj Trybunał',
    'B:mury': 'Zbuduj Mury',
    'B:akwedukt': 'Zbuduj Akwedukt (obok Studni)',
    'B:mennica': 'Zbuduj Mennicę w stolicy (z Targowiskiem i dostępem do złota)',
    'I:kopalnia_zlota': 'Postaw Kopalnię złota na złożu',
    'B:odlewnia_zelaza': 'Rozbuduj Odlewnię brązu do Odlewni żelaza',
    'I:kopalnia_zelaza': 'Postaw Kopalnię żelaza na złożu',
    'B:kuznia_zelaza': 'Rozbuduj Kuźnię brązu do Kuźni żelaza',
    'U:zelazo': 'Rekrutuj jednostki z żelaza (w mieście z Koszarami)',
    'B:cytadela': 'Zbuduj Cytadelę (obok Murów)',
    'B:baszta': 'Zbuduj Basztę (obok Murów)',
    'B:port_wielki': 'Rozbuduj Port handlowy do Portu wielkiego',
    'W:brama': 'Wznieś cud Brama wszystkich narodów (z Wojskowością)',
    'U:katapulta': 'Rekrutuj Katapulty',
    'B:warsztat': 'Zbuduj Warsztat oblężniczy (obok Koszar)',
    'B:akademia': 'Zbuduj Akademię (obok Biblioteki)',
    'B:sad': 'Zbuduj Sąd',
    'B:pretorium': 'Rozbuduj Dwór Zarządcy do Pretorium',
    'I:droga_bruk': 'Przebuduj Drogi na Drogi brukowane',
    'B:laznia': 'Zbuduj Łaźnię publiczną (obok Studni)',
    'U:zelazo_nar': 'Rekrutuj jednostki narodowe',
    'B:akademia_wojskowa': 'Zbuduj Akademię wojskową (obok Koszar)',
    'T:next': 'Wybierz kolejne badanie',
}

TECHS = {}

TECHS['Obróbka drewna'] = [
    c('a', 'I:tartak', 'Tartak: +50 drewna na turę do magazynu państwa', 'zasilić magazyn państwa 50 drewna na turę (budowy i rekrutacja)', 'TI:194;TI:204', 4, 4, 5, 5, 5, 5),
    c('b', 'B:palisada', 'Palisada: +100% Obrony obrońców miasta', 'podwoić obronę miasta (+100% Obrony obrońców)', 'B:950;MP:94;CD:63-71', 4, 4, 3, 2, 4, 5),
    c('c', 'B:stolarnia', 'Stolarnia: +5 Pracy w mieście (+3 na poziom, maks. 3)', 'dodać miastu 5 Pracy', 'B:3', 2, 1, 2, 2, 4, 5),
    c('d', 'B:stolarnia', 'Każda Stolarnia: +10% drewna w całym państwie', 'zwiększyć produkcję drewna całego państwa o 10%', 'EP:285;TE:1536', 3, 3, 4, 5, 3, 4),
    c('e', 'U:taran', 'Taran: pierwsza machina oblężnicza (2800 HP)', 'móc oblegać i burzyć umocnienia wroga', 'U:3330', 3, 4, 3, 1, 4, 3),
    c('f', 'I:posterunek', 'Posterunek (z Murarstwem): +50% Obrony, strefa 3 pól', 'zabezpieczyć granicę strefą 3 pól i +50% Obrony obozujących', 'TI:394;IT:46-47', 2, 4, 3, 3, 2, 3),
    c('g', 'T:next', 'Otwiera drogę do Żeglugi i Brązownictwa', 'dojść do Żeglugi (morze) i Brązownictwa (epoka Brązu)', 'T:181;T:166', 2, 2, 3, 5, 2, 4),
]

TECHS['Garncarstwo'] = [
    c('a', 'B:spichlerz', 'Spichlerz: limit ludności miasta 5 → 8', 'podnieść limit ludności miasta z 5 do 8', 'EP:24;EP:31;EC:1053;B:458', 5, 4, 4, 2, 4, 5),
    c('b', 'B:spichlerz', 'Spichlerz: +4 zadowolenia i +2 żywności', 'dać miastu +4 zadowolenia i +2 żywności', 'B:458', 3, 1, 2, 2, 4, 5),
    c('c', 'B:garncarnia', 'Garncarnia: wytwarza ceramikę (glina + drewno)', 'wytwarzać ceramikę potrzebną Spichlerzowi', 'CV:85;B:554', 3, 4, 5, 5, 3, 3),
    c('d', 'B:garncarnia', 'Garncarnia: +10% żywności w mieście', 'zwiększyć żywność miasta o 10%', 'EP:299;EC:1008', 2, 2, 3, 2, 3, 5),
    c('e', 'B:cegielnia', 'Cegielnia (od Brązu): +25% Pracy z terenu miasta', 'zwiększyć Pracę z terenu miasta o 25%', 'EP:271;EC:863-866;PR:966;B:601', 4, 2, 4, 2, 2, 5, True),
    c('f', 'B:cegielnia', 'Cegielnia: cegła (2 glina + 1 drewno → 2 cegły)', 'wytwarzać cegłę i otworzyć badanie Pisma', 'CV:84;T:196;RS:180', 3, 4, 5, 5, 2, 3),
    c('g', 'I:glinianka', 'Glinianka: +50 gliny na turę do magazynu państwa', 'wydobywać 50 gliny na turę', 'TI:118;TI:128', 3, 3, 5, 5, 4, 5),
    c('h', 'I:warzelnia', 'Warzelnia soli: +50 soli na turę', 'wydobywać 50 soli na turę (do Spichlerza Królewskiego)', 'TI:251;TI:262', 2, 3, 5, 5, 3, 5),
    c('i', 'T:next', 'Otwiera Wymianę, Pismo, Religię i Brązownictwo', 'dojść do handlu (Wymiana) i pisma', 'T:124;T:196;T:210;T:166', 2, 2, 4, 5, 2, 4),
]

TECHS['Murarstwo'] = [
    c('a', 'I:kamieniolom', 'Kamieniołom: +50 kamienia na turę do magazynu', 'wydobywać 50 kamienia na turę (mury, świątynie)', 'TI:136;TI:146', 4, 4, 5, 5, 5, 5),
    c('b', 'B:kamieniarski', 'Warsztat kamieniarski: +4 Pracy (+2 na poziom)', 'dodać miastu 4 Pracy', 'B:61', 2, 1, 2, 2, 4, 5),
    c('c', 'B:kamieniarski', 'Każdy Warsztat kamieniarski: +10% kamienia w państwie', 'zwiększyć wydobycie kamienia państwa o 10%', 'EP:292;TE:1539', 3, 3, 4, 5, 3, 4),
    c('d', 'B:stela', 'Stela: +1 Kultury (+1 na poziom), bez utrzymania', 'zyskać Kulturę bez kosztów utrzymania', 'B:1202;SP:446', 1, 1, 2, 2, 4, 4),
    c('e', 'I:posterunek', 'Posterunek (z Obróbką drewna): strefa 3 pól, +50% Obrony', 'zabezpieczyć granicę strefą 3 pól', 'TI:394;IT:46-47', 2, 4, 3, 3, 2, 3),
    c('f', None, 'Cuda narodowe: Piramidy (Egipt) i inne', None, 'W:77-81;W:347-351;W:468-472', 3, 3, 4, 2, 2, 3),
    c('g', 'T:next', 'Otwiera Brązownictwo i Budownictwo (Mury)', 'dojść do epoki Brązu i Murów', 'T:166;T:294', 2, 2, 3, 5, 2, 4),
]

TECHS['Rolnictwo'] = [
    c('a', 'I:farma', 'Farma: +3 żywności, +3 Pracy, +3 handlu na polu', 'zyskać +3 żywności, +3 Pracy i +3 handlu z pola', 'TI:12', 4, 4, 4, 3, 5, 5),
    c('b', 'I:tarasy', 'Tarasy (Chiny, Inkowie): +3 żywności na wzgórzu', 'uprawiać wzgórza (+3 żywności)', 'TI:212', 3, 3, 4, 2, 3, 4),
    c('c', 'T:next', 'Otwiera Gospodarkę wodną (Irygacja +5 żywności)', 'dojść do Irygacji (+5 żywności przy rzece)', 'T:138;TI:29', 3, 2, 4, 3, 2, 3),
    c('d', 'T:next', 'Warunek Wymiany — klucza do tras handlowych', None, 'T:124;TR:1093', 3, 3, 4, 5, 1, 3),
]

TECHS['Łowiectwo'] = [
    c('a', 'I:oboz', 'Obóz łowiecki: +1 żywności, +1 pieniądza, +2 handlu', 'zagospodarować las (+1 żywności, +1 pieniądza, +2 handlu)', 'TI:154', 2, 3, 4, 3, 3, 4),
    c('b', 'T:next', 'Otwiera Łucznictwo (Łucznik)', 'dojść do Łuczników', 'T:82', 3, 3, 4, 2, 3, 4),
]

TECHS['Łucznictwo'] = [
    c('a', 'U:lucznik', 'Łucznik: zasięg 3 pola, Obrona 6 (Oszczepnik: 2 i 4)', 'razić wroga z 3 pól (lepiej niż Oszczepnik)', 'U:225;U:151', 3, 2, 3, 2, 5, 4),
    c('b', 'U:lucznik', 'Łucznicy narodowi Egiptu i Sumeru: 40 HP zamiast 20', 'wystawić wytrzymalszych łuczników narodowych', 'U:1853;U:2223', 3, 1, 3, 1, 4, 3),
    c('c', 'U:lucznik', 'Łucznicy Brązu (nubijski, akadyjski, asyryjski) — z Koszarami', None, 'U:2149;U:2889;U:3968;PR:1075', 2, 1, 3, 1, 1, 3),
]

TECHS['Oswojenie zwierząt'] = [
    c('a', 'I:trzoda', 'Trzoda: +2 żywności, +4 Pracy, +3 handlu, bez złoża', 'zyskać +4 Pracy i +2 żywności z pola bez złoża', 'TI:45', 4, 4, 4, 3, 5, 5),
    c('b', 'I:owce', 'Owce: +1 żywności, +2 Pracy, +2 handlu na wzgórzu', 'zagospodarować wzgórza (+2 Pracy)', 'TI:63', 2, 2, 4, 3, 4, 4),
    c('c', 'I:lama', 'Lama (Inkowie): +3 Pracy także w górach i lesie', 'zagospodarować góry (+3 Pracy)', 'TI:81', 3, 2, 4, 2, 4, 4),
    c('d', 'T:next', 'Otwiera Koło (Drogi, Rydwan)', 'dojść do Dróg i Rydwanów', 'T:152', 3, 3, 4, 4, 2, 3),
    c('e', 'T:next', 'Warunek Wymiany — klucza do tras handlowych', None, 'T:124;TR:1093', 3, 3, 4, 5, 1, 3),
]

TECHS['Mistycyzm'] = [
    c('a', 'B:kregi', 'Kamienne kręgi: +1 Kultury i +1 zadowolenia (na poziom)', 'dać miastu Kulturę i zadowolenie', 'B:649', 2, 2, 3, 2, 4, 5),
    c('b', 'B:kregi', 'Kamienne kręgi: szerzą religię +2% na turę', 'szerzyć swoją religię o 2% na turę', 'SP:588', 2, 4, 3, 2, 3, 4),
    c('c', 'W:wyrocznia', 'Cud Wyrocznia: +3 Kultury, +3 Zaufania, +2 Wpływu', 'zdobyć +3 Zaufania i +2 Wpływu u innych państw', 'W:147-155', 3, 4, 5, 4, 2, 3),
    c('d', 'T:next', 'Otwiera Religię (Świątynia)', 'dojść do Świątyni', 'T:210', 2, 2, 4, 3, 2, 4),
]

TECHS['Wymiana'] = [
    c('a', 'M:handel', 'Otwiera handel: bez Wymiany żadnych tras handlowych', 'zyskać nowe źródło dochodu — bez Wymiany handel szlakowy jest zablokowany', 'TR:1086-1093', 5, 5, 5, 5, 4, 4),
    c('b', 'B:targowisko', 'Targowisko: +5 pieniądza (+3 na poziom, maks. 3)', 'dać miastu +5 pieniądza', 'B:303', 3, 1, 2, 2, 4, 5),
    c('c', 'B:targowisko', 'Targowisko: +50% dochodu z tras handlowych miasta', 'zwiększyć dochód z tras handlowych miasta o 50%', 'EP:278;MN:4192-4196', 4, 3, 4, 2, 3, 5),
    c('d', 'B:targowisko', 'Targowisko: +1 trasa handlowa i premia 5% trasy', 'otworzyć miastu kolejną trasę handlową', 'TR:908-921;TR:1659', 3, 3, 3, 2, 3, 4),
    c('e', 'B:targowisko', 'Targowisko: +2 zdrowia miasta', None, 'SP:24;TE:485', 1, 1, 2, 2, 4, 5),
    c('f', 'B:targowisko', 'Targowisko jest warunkiem Mennicy i Emporionu', None, 'BG:117-119;B:1095', 2, 2, 4, 2, 1, 3),
    c('g', None, 'Cud narodowy: Pałac Weiyang (Chiny, z Murarstwem)', None, 'W:468-472', 3, 3, 4, 2, 2, 3),
    c('h', 'T:next', 'Otwiera Pismo i Matematykę', 'dojść do Pisma i Matematyki', 'T:196;T:252', 3, 2, 4, 5, 2, 3),
]

TECHS['Gospodarka wodna'] = [
    c('a', 'I:irygacja', 'Irygacja: +5 żywności, +2 Pracy, +2 handlu przy rzece', 'zyskać +5 żywności z pola przy rzece', 'TI:29;IT:39', 4, 3, 4, 3, 4, 5),
    c('b', 'B:studnia', 'Studnia: +2 zdrowia i koniec kary −2 za brak wody', 'dać miastu czystą wodę (+2 zdrowia, bez kary −2)', 'SP:17;SP:116;TE:476-498', 3, 3, 4, 2, 4, 4),
    c('c', 'B:studnia', 'Studnia: +1 zadowolenia (+1 na poziom)', 'dodać zadowolenie', 'B:806', 1, 1, 2, 2, 4, 5),
    c('d', 'B:studnia', 'Studnia jest warunkiem Akweduktu (limit 20) i Łaźni', None, 'B:853;B:2034;EP:45', 3, 2, 5, 2, 1, 3),
    c('e', 'B:studnia', 'Studnia w państwie jest warunkiem badania Medycyny', None, 'T:421;RS:180', 2, 2, 5, 5, 1, 3),
]

TECHS['Koło'] = [
    c('a', 'I:droga', 'Droga: ruch po niej 3× szybszy', 'przyspieszyć ruch wojsk między miastami 3×', 'TI:288;RM:14', 5, 5, 4, 4, 4, 5),
    c('b', 'I:droga', 'Droga: +2 handlu na polu', 'dodać +2 handlu na każdym polu drogi', 'TI:288', 2, 1, 3, 3, 4, 5),
    c('c', 'U:rydwan_woly', 'Rydwan (woły): Atak 12, 400 HP, bez Koszar', 'wystawić silną jednostkę uderzeniową już w epoce Kamienia', 'U:521;PR:1071-1076', 4, 4, 4, 1, 4, 4),
    c('d', 'T:next', 'Z Brązownictwem otwiera Jeździectwo (Konnica)', 'dojść do Konnicy', 'T:224', 3, 3, 4, 4, 1, 3),
]

TECHS['Brązownictwo'] = [
    c('a', None, 'Awans do epoki Brązu: nowe budynki i wyższe ich poziomy', None, 'T:178;PS:310-323;PR:252-262;PR:966', 5, 5, 5, 5, 4, 3),
    c('b', None, 'Limit wodzów rośnie z 1 do 2', None, 'GN:2-4', 4, 3, 5, 5, 4, 5),
    c('c', 'B:odlewnia_brazu', 'Odlewnia brązu: wytwarza brąz (ruda + drewno + cyna)', 'wytwarzać brąz — bez niego brak wojska epoki Brązu', 'CV:97;B:156;PR:1092', 4, 5, 5, 5, 2, 3),
    c('d', 'I:kopalnia_miedzi', 'Kopalnia miedzi: +20 rudy na turę, +5 handlu', 'wydobywać 20 rudy miedzi na turę (do brązu)', 'TI:322;TI:331', 3, 4, 5, 5, 3, 4),
    c('e', 'I:kopalnia_cyny', 'Kopalnia cyny: +20 rudy cyny na turę', 'wydobywać cynę do brązu', 'TI:358;TI:367;CV:97', 2, 3, 5, 5, 3, 4),
    c('f', 'B:kuznia', 'Kuźnia brązu: +15% Pancerza jednostek w mieście', 'dać jednostkom +15% Pancerza', 'B:108;UB:15-22;UB:170', 4, 4, 4, 3, 3, 5),
    c('g', 'U:braz', '20 jednostek z brązu, np. Włócznik 160 HP', 'wystawić Włóczników ze 160 HP (Wojownik ma 60 HP)', 'U:373;U:3;PR:1075;PR:1092', 4, 3, 4, 2, 1, 4),
    c('h', None, 'Wieża oblężnicza i Taran okuty', None, 'U:3558;U:3406', 2, 2, 3, 1, 1, 3),
    c('i', 'T:next', 'Otwiera Wojskowość, Hutnictwo żelaza, Jeździectwo', 'dojść do Koszar i żelaza', 'T:238;T:336;T:224', 3, 3, 5, 5, 2, 3),
]

TECHS['Żegluga'] = [
    c('a', 'M:embark', 'Wojsko lądowe może wchodzić na wodę (zaokrętowanie)', 'przerzucić armię przez morze lub rzekę bez budowy floty', 'EM:25;EM:28-36', 5, 5, 5, 5, 5, 4),
    c('b', 'B:port', 'Port handlowy: +5 pieniądza i +1 Pracy', 'zarabiać +5 pieniądza w mieście nad wodą', 'B:361', 3, 1, 3, 2, 4, 5),
    c('c', 'B:port', 'Port: +1 trasa handlowa miasta', 'otworzyć miastu kolejną trasę handlową', 'TR:908-921', 3, 3, 3, 2, 3, 4),
    c('d', 'I:lodzie', 'Łodzie rybackie: +2 żywności, +3 Pracy, +3 handlu', 'wykorzystać morze (+2 żywności, +3 Pracy)', 'TI:234', 3, 4, 5, 3, 4, 5),
    c('e', 'U:galera', 'Galera: okręt wojenny (miasto nad wodą + Koszary)', 'mieć własną flotę wojenną', 'U:669;PR:1075-1083', 3, 4, 5, 1, 1, 3),
    c('f', 'W:hamonga', "Cud Kamień Ha'amonga: +15% dochodu z tras morskich", 'zwiększyć dochód z handlu morskiego o 15%', 'W:247-255', 3, 3, 5, 4, 2, 3),
    c('g', 'T:next', 'Z Pismem otwiera Handel (Emporion, Magazyn)', 'dojść do Handlu', 'T:266', 3, 2, 4, 5, 2, 3),
]

TECHS['Pismo'] = [
    c('a', 'B:biblioteka', 'Biblioteka: +30% Nauki miasta', 'zwiększyć Naukę miasta o 30%', 'EP:320;EC:979-982', 4, 3, 4, 2, 4, 5),
    c('b', 'B:biblioteka', 'Biblioteka: +3 Nauki i +2 Kultury (rośnie z poziomem)', 'dodać miastu +3 Nauki', 'B:744;B:750', 3, 2, 3, 2, 4, 5),
    c('c', 'B:spichlerz_ii', 'Spichlerz Królewski: limit ludności 8 → 12', 'podnieść limit ludności miasta z 8 do 12', 'EP:38;EC:1053;B:505', 4, 2, 3, 2, 3, 5),
    c('d', 'B:spichlerz_ii', 'Spichlerz Królewski: +3 żywności, +4 zadowolenia', None, 'B:505', 2, 1, 2, 2, 3, 5),
    c('e', None, 'Cuda narodowe: Wiszące ogrody, Wielka stela', None, 'W:102-106;W:123-127', 3, 3, 4, 2, 2, 3),
    c('f', 'T:next', 'Otwiera Matematykę, Kodeks, Handel, Filozofię', 'dojść do Matematyki, Kodeksu i Filozofii', 'T:252;T:280;T:266;T:379', 3, 3, 5, 5, 2, 3),
]

TECHS['Religia'] = [
    c('a', 'B:swiatynia', 'Świątynia: szerzy religię +4% na turę', 'szerzyć swoją religię o 4% na turę', 'SP:581', 3, 3, 4, 2, 3, 4),
    c('b', 'B:swiatynia', 'Świątynia: +2 Kultury i +2 zadowolenia', 'dać miastu +2 Kultury i +2 zadowolenia', 'B:696', 2, 1, 2, 2, 4, 5),
    c('c', None, 'Cud narodowy: Stupa w Sanchi (Harappa)', None, 'W:200-204', 3, 3, 4, 2, 2, 3),
    c('d', 'T:next', 'Otwiera Kodeks, Filozofię, Astronomię', 'dojść do Kodeksu i Filozofii', 'T:280;T:379;T:322', 3, 3, 5, 5, 2, 3),
]

TECHS['Jeździectwo'] = [
    c('a', 'U:konnica', 'Konnica: Atak 12, 320 HP, ruch 4 (koszt: brąz i 25 koni)', 'mieć najszybszą jednostkę uderzeniową (ruch 4)', 'U:595;PR:1075;BS:362-369', 4, 3, 4, 1, 1, 4),
    c('b', 'U:konnica', 'Rydwan konny: 360 HP, ruch 4', None, 'U:1779', 3, 2, 3, 1, 1, 3),
    c('c', 'I:stadnina', 'Stadnina: +25 koni/turę — koszt 1 jednostki konnej', 'hodować 25 koni na turę — tyle kosztuje rekrutacja 1 jednostki konnej', 'TI:100;TI:109;BS:362-369', 3, 4, 5, 3, 3, 4),
    c('d', 'U:konnica', 'Rydwany i jeźdźcy narodowi (6 cywilizacji)', None, 'U:1039;U:1927;U:2297;U:2593;U:2815;U:4394', 3, 1, 3, 1, 1, 3),
]

TECHS['Wojskowość'] = [
    c('a', 'B:koszary', 'Koszary: rekrutacja wojska epoki Brązu i Żelaza', 'rekrutować jednostki epoki Brązu i Żelaza (np. Włócznik, Konnica)', 'PR:1071-1076;B:1047', 5, 5, 5, 3, 4, 5),
    c('b', 'B:koszary', 'Koszary: +20% parametrów bojowych jednostek', 'wzmocnić jednostki o +20% parametrów bojowych', 'B:1047;UB:23-33;UB:178', 4, 4, 4, 3, 3, 5),
    c('c', 'B:koszary', 'Koszary: +2 Pracy', None, 'B:1047', 1, 1, 1, 2, 4, 5),
    c('d', 'I:fort', 'Fort: +100% Obrony obozujących i strefa 5 pól', 'lepiej bronić granic (+100% Obrony, strefa 5 pól)', 'TI:270', 4, 4, 4, 3, 3, 4, True),
    c('e', None, 'Cuda: Terakotowa armia, Yerkapı, Brama narodów', None, 'W:371-375;W:491-496;W:440-448', 3, 3, 4, 2, 2, 3),
    c('f', 'T:next', 'Otwiera Oblężnictwo (Katapulta)', 'dojść do Katapult', 'T:365', 3, 3, 5, 4, 2, 3),
    c('g', 'B:koszary', 'Koszary są warunkiem Warsztatu i Akademii wojskowej', None, 'BG:111;BG:115', 2, 2, 4, 2, 1, 3),
]

TECHS['Matematyka'] = [
    c('a', 'T:next', 'Otwiera Budownictwo, Walutę, Astronomię, Oblężnictwo', 'dojść do Murów, Mennicy i Katapult', 'T:294;T:308;T:322;T:365', 4, 3, 5, 5, 1, 3),
    c('b', None, 'Cuda narodowe: Ziggurat (+15% Nauki), Mundo Perdido', None, 'W:326-330;W:347-351', 4, 3, 4, 3, 2, 3),
]

TECHS['Handel'] = [
    c('a', 'B:emporion', 'Emporion: +8 pieniądza (+4 na poziom)', 'dać miastu +8 pieniądza', 'B:1095', 3, 1, 3, 2, 4, 5),
    c('b', 'B:emporion', 'Emporion: +1 trasa handlowa i premia 5% trasy', 'otworzyć miastu kolejną trasę handlową', 'TR:908-921;TR:1659;B:1095', 3, 3, 3, 2, 3, 4),
    c('c', 'B:magazyn', 'Magazyn: +20% pojemności magazynu państwa', 'zwiększyć pojemność magazynu państwa o 20%', 'EP:613;EU:431', 3, 3, 5, 5, 3, 5),
    c('d', 'B:magazyn', 'Magazyn: +1 Pracy i +1 pieniądza', None, 'B:1154', 1, 1, 1, 2, 4, 5),
    c('e', 'T:next', 'Z Matematyką otwiera Walutę (Mennica)', 'dojść do Mennicy', 'T:308', 4, 3, 5, 5, 1, 3),
]

TECHS['Kodeks'] = [
    c('a', 'B:dwor', 'Dwór Zarządcy: 33 pkt Prawa w mieście regionalnym', 'utrzymać porządek w mieście regionalnym (33 pkt Prawa)', 'SP:788;SP:781;B:1838', 3, 2, 4, 2, 3, 4),
    c('b', 'B:dwor', 'Dwór Zarządcy: +2 pieniądza, +3 Kultury, +1 Pracy', None, 'B:1838', 2, 1, 2, 2, 3, 5),
    c('c', 'B:trybunal', 'Trybunał: +17 pkt Prawa w każdym mieście', 'dodać 17 pkt Prawa w dowolnym mieście', 'SP:802', 3, 3, 4, 3, 4, 4),
    c('d', 'B:trybunal', 'Trybunał: +1 pieniądza i +1 zadowolenia', None, 'B:1938', 1, 1, 2, 2, 4, 5),
    c('e', 'T:next', 'Z Filozofią otwiera Prawo (Sąd, Pretorium)', 'dojść do Sądu (−30% korupcji)', 'T:393', 3, 2, 5, 4, 1, 3),
]

TECHS['Budownictwo'] = [
    c('a', 'B:mury', 'Mury: +200% Obrony obrońców miasta', 'potroić obronę miasta (+200% Obrony)', 'MP:79;CD:67-68;B:998', 5, 3, 4, 2, 3, 5),
    c('b', 'B:akwedukt', 'Akwedukt: limit ludności miasta do 20', 'podnieść limit ludności miasta do 20', 'EP:45;EC:1053;B:853', 5, 3, 5, 2, 3, 5),
    c('c', 'B:akwedukt', 'Akwedukt: +4 zdrowia', None, 'SP:10;TE:483', 2, 1, 3, 2, 3, 5),
    c('d', 'B:akwedukt', 'Akwedukt: +2 zadowolenia (+1 na poziom)', None, 'B:853', 2, 1, 2, 2, 3, 5),
    c('e', 'B:mury', 'Mury są warunkiem Cytadeli i Baszty', None, 'B:1498;B:1547', 3, 2, 5, 2, 1, 3),
    c('f', None, 'Cud narodowy: Dur-Sharrukin (Asyria)', None, 'W:417-421', 3, 3, 4, 2, 2, 3),
    c('g', 'T:next', 'Otwiera Inżynierię i Drogi brukowane', 'dojść do Cytadeli i Dróg brukowanych', 'T:351;T:407', 3, 3, 5, 4, 2, 3),
]

TECHS['Waluta'] = [
    c('a', 'B:mennica', 'Mennica: ×1,5 podatku (handlu) w każdym mieście', 'pomnożyć podatek wszystkich miast ×1,5 (pieniądz i nauka)', 'EP:585-591;EC:952-955;EC:962-967;EC:644-653', 5, 5, 5, 5, 3, 5),
    c('b', 'I:kopalnia_zlota', 'Kopalnia złota: +10 handlu i +1 złota na turę', 'zdobyć złoto (+10 handlu) i uruchomić Mennicę', 'TI:376;TI:385', 3, 3, 5, 3, 3, 4),
    c('c', 'B:mennica', 'Mennica: +3 pieniądza (+2 na poziom)', None, 'B:901', 2, 1, 2, 2, 3, 5),
    c('d', 'I:kopalnia_zlota', 'Złoto jest warunkiem Mennicy (zużywa 1 złota/turę)', None, 'BG:75-76;ZA:31;TE:1879-1894', 3, 2, 5, 5, 2, 3),
    c('e', 'I:kopalnia_zlota', 'Złoto w dyplomacji: 50 PN za sztukę', None, 'EP:813', 2, 2, 3, 5, 2, 4),
]

TECHS['Astronomia'] = [
    c('a', 'B:biblioteka', 'Obserwatorium (Biblioteka poz. 6) — dziś niedostępne', None, 'B:797;B:750;PR:252-271', 0, 1, 5, 2, 0, 2),
]

TECHS['Hutnictwo żelaza'] = [
    c('a', None, 'Awans do epoki Żelaza: nowe budynki i wyższe ich poziomy', None, 'T:347;PS:310-323;PR:252-262;PR:966', 5, 5, 5, 5, 4, 3),
    c('b', None, 'Limit wodzów rośnie z 2 do 3', None, 'GN:2-4', 4, 3, 5, 5, 4, 5),
    c('c', 'B:odlewnia_zelaza', 'Odlewnia żelaza: żelazo i brąz, +12 Pracy', 'wytwarzać żelazo do najlepszego wojska', 'CV:98-99;B:204', 4, 5, 5, 5, 2, 3),
    c('d', 'I:kopalnia_zelaza', 'Kopalnia żelaza: +20 rudy żelaza na turę', 'wydobywać 20 rudy żelaza na turę', 'TI:340;TI:349', 3, 4, 5, 5, 3, 4),
    c('e', 'B:kuznia_zelaza', 'Kuźnia żelaza: kolejne +15% Pancerza (razem +30%)', 'podnieść Pancerz jednostek do +30%', 'B:1398;UB:15-22', 3, 2, 4, 3, 2, 5),
    c('f', 'U:zelazo', '19 narodowych jednostek z żelaza, np. Falanga (Obrona 10)', 'wystawić narodową piechotę epoki Żelaza (np. Falanga z Obroną 10)', 'U:743;U:891;PR:1075;PR:1092', 4, 3, 4, 2, 1, 3),
    c('g', 'T:next', 'Z Drogami brukowanymi otwiera Obróbkę żelaza', 'dojść do Obróbki żelaza', 'T:435', 3, 3, 5, 4, 1, 3),
]

TECHS['Inżynieria'] = [
    c('a', 'B:cytadela', 'Cytadela: +100% Obrony ponad Mury (razem +300%)', 'podnieść obronę miasta do +300%', 'MP:84;CD:67-69;B:1498', 4, 2, 4, 2, 3, 5),
    c('b', 'B:baszta', 'Baszta: kolejne +100% Obrony (komplet +400%)', 'podnieść obronę miasta do +400%', 'MP:89;CD:73;B:1547', 4, 2, 4, 2, 3, 5),
    c('c', 'B:port_wielki', 'Port wielki: +10 pieniądza i +1 trasa handlowa', 'podwoić dochód portu (+10 pieniądza)', 'B:409;TR:908-909', 3, 1, 3, 2, 3, 5),
    c('d', 'W:brama', 'Cud Brama narodów: +15% dochodu z tras, +10 Wpływu', 'zwiększyć dochód z tras o 15% i zyskać 10 Wpływu', 'W:440-448', 4, 3, 5, 4, 2, 3),
    c('e', 'T:next', 'Z Budownictwem otwiera Drogi brukowane', 'dojść do Dróg brukowanych (ruch 5×)', 'T:407', 3, 3, 5, 4, 1, 3),
]

TECHS['Oblężnictwo'] = [
    c('a', 'U:katapulta', 'Katapulta: ostrzał z 6 pól, 1000 HP', 'burzyć mury z dystansu 6 pól', 'U:3482', 3, 3, 4, 1, 2, 3),
    c('b', 'B:warsztat', 'Warsztat oblężniczy: +10% parametrów jednostek', 'wzmocnić jednostki o kolejne +10% (razem do +50%)', 'B:1596;UB:23-33;UB:178', 3, 3, 4, 3, 2, 5),
    c('c', 'B:warsztat', 'Warsztat oblężniczy: +4 Pracy, +2 pieniądza', None, 'B:1596', 2, 1, 2, 2, 3, 5),
    c('d', 'T:next', 'Z Obróbką żelaza otwiera Sztukę wojenną', 'dojść do Akademii wojskowej', 'T:449', 3, 3, 5, 4, 1, 3),
]

TECHS['Filozofia'] = [
    c('a', 'B:akademia', 'Akademia: +20% Nauki (z Biblioteką razem +50%)', 'zwiększyć Naukę miasta o kolejne 20%', 'EP:327;EC:979-981;B:1645', 4, 2, 4, 2, 3, 5),
    c('b', 'B:akademia', 'Akademia: +6 Nauki, +5 Kultury, +3 zadowolenia', 'dodać miastu +6 Nauki', 'B:1645', 3, 1, 3, 2, 3, 5),
    c('c', 'T:next', 'Otwiera Prawo i Medycynę', 'dojść do Sądu i Łaźni', 'T:393;T:421', 3, 3, 5, 4, 1, 3),
]

TECHS['Prawo'] = [
    c('a', 'B:sad', 'Sąd: −30% korupcji w mieście', 'obniżyć korupcję w mieście o 30%', 'EC:1225-1235;EC:1247-1249', 4, 3, 3, 2, 3, 5),
    c('b', 'B:sad', 'Sąd: +19 pkt Prawa', None, 'SP:809', 3, 2, 3, 2, 3, 4),
    c('c', 'B:sad', 'Sąd: +5 Kultury, +2 pieniądza, +2 zadowolenia', None, 'B:1742;SP:453', 3, 1, 2, 2, 3, 4),
    c('d', 'B:pretorium', 'Pretorium: −30% korupcji i 38 pkt Prawa w regionie', 'obniżyć korupcję miasta regionalnego o 30%', 'EC:1225-1235;SP:795;B:1888', 4, 3, 3, 2, 3, 4),
    c('e', 'B:pretorium', 'Pretorium: +3 pieniądza, +5 Kultury, +2 Pracy', None, 'B:1888', 2, 1, 2, 2, 3, 5),
]

TECHS['Drogi brukowane'] = [
    c('a', 'I:droga_bruk', 'Droga brukowana: ruch 5× szybszy (Droga: 3×)', 'przyspieszyć ruch po drogach z 3× do 5×', 'TI:303;RM:29', 4, 2, 5, 4, 3, 5),
    c('b', 'I:droga_bruk', 'Droga brukowana: +3 handlu na polu (Droga: +2)', None, 'TI:303', 2, 1, 4, 3, 3, 5),
    c('c', 'T:next', 'Z Hutnictwem otwiera Obróbkę żelaza', 'dojść do Obróbki żelaza', 'T:435', 3, 3, 5, 4, 1, 3),
]

TECHS['Medycyna'] = [
    c('a', 'B:laznia', 'Łaźnia publiczna: +5 zdrowia miasta', 'podnieść zdrowie miasta o 5', 'SP:31;TE:486', 3, 2, 4, 2, 3, 5),
    c('b', 'B:laznia', 'Łaźnia: +3 Kultury, +3 zadowolenia, +1 żywności', 'dodać +3 zadowolenia i +3 Kultury', 'B:2034;SP:460', 3, 1, 3, 2, 3, 4),
]

TECHS['Obróbka żelaza'] = [
    c('a', None, 'Wielka odlewnia (stal) — dziś niedostępna (epoka 4)', None, 'B:253;PR:966;CV:100-102', 0, 2, 5, 2, 0, 2),
    c('b', None, 'Wielka Kuźnia (Pancerz) — dziś niedostępna (epoka 4)', None, 'B:1448;PR:966', 0, 2, 5, 2, 0, 2),
    c('c', 'U:zelazo_nar', 'Jednostki Celtów i Germanów, np. Berserker Atak 10', 'wystawić elitę Celtów i Germanów (np. Berserker z Atakiem 10)', 'U:2963;U:3081;U:3182;U:3256', 3, 1, 3, 1, 1, 3),
    c('d', None, 'Cud narodowy: Posąg Peruna (Słowianie)', None, 'W:517-521', 3, 3, 4, 2, 2, 3),
    c('e', 'T:next', 'Z Oblężnictwem otwiera Sztukę wojenną', 'dojść do Akademii wojskowej', 'T:449', 3, 3, 5, 4, 1, 3),
]

TECHS['Sztuka wojenna'] = [
    c('a', 'B:akademia_wojskowa', 'Akademia wojskowa: +20% parametrów (z Koszarami +40%)', 'wzmocnić jednostki o kolejne +20% (razem do +50%)', 'B:2082;UB:23-33;UB:178', 4, 3, 4, 3, 3, 5),
    c('b', 'B:akademia_wojskowa', 'Akademia wojskowa: +3 Pracy, +2 pieniądza', None, 'B:2082', 1, 1, 1, 2, 3, 5),
]

# Uwagi per odkrycie (luki w karcie, rozjazdy danych)
NOTES = {
    'Obróbka drewna': 'Taran (units.json:3330) jest na karcie, ale nie ma go w tech.json. Palisada nie ma efektu w „Zmiany ekonomiczne" (baza/przyrost = 0) — jej +100% Obrony jest niewidoczne. Posterunek wymaga też Murarstwa (improvement-tech.ts:46-47).',
    'Garncarstwo': 'Cegielnia ma epokaWejscia=2 (buildings.json:601) — production.ts:966 blokuje ją do epoki Brązu. „Odblokowuje surowiec: cegła, glina, sol" to pole wyłącznie opisowe (brak konsumenta w gra/src/game).',
    'Murarstwo': 'Pole tech.json „Odblokowuje surowiec: kamien, ruda" opisowe; ruda faktycznie z Kopalni miedzi (Brązownictwo).',
    'Rolnictwo': 'Tylko 4 realne efekty; Top5 = NIE_USTALONO (brak 5. efektu w danych/kodzie).',
    'Łowiectwo': 'Tylko 2 realne efekty (Obóz łowiecki, droga do Łucznictwa); Top3–Top5 = NIE_USTALONO.',
    'Łucznictwo': 'Brak kolejnych technologii wymagających Łucznictwa (tech.json). 3 efekty — Top4–Top5 = NIE_USTALONO. Łucznik ma epokę Kamień → bez Koszar (production.ts:1075).',
    'Oswojenie zwierząt': '„Sprawdź dostęp do surowca: krowa/byk, owce, bydlo, lama" — surowe klucze, pole opisowe. Trzoda nie wymaga złoża (terrain-improvements.json:45 uwaga).',
    'Mistycyzm': '4 efekty — Top5 = NIE_USTALONO. Cud Wyrocznia (dla wszystkich 15 cywilizacji, maxNaSwiecie=1 — wyścig) nie jest pokazany na karcie.',
    'Wymiana': 'Najważniejszy efekt (bramka całego handlu szlakowego, trade-routes.ts:1086-1093) NIE jest pokazany na karcie. Na karcie: „Targowisko (Rynek): pieniadz +3" — przyrost na poziom zamiast bazy +5.',
    'Gospodarka wodna': 'terrain-improvements.json:29 ma tech „Irygacja", mapowane na Gospodarkę wodną (improvement-tech.ts:39).',
    'Koło': '„Sprawdź dostęp do surowca: krowa/byk" — opisowe. 4 efekty — Top5 = NIE_USTALONO.',
    'Brązownictwo': 'Karta nie pokazuje: awansu epoki, +1 wodza, Kopalni miedzi i cyny (terrain-improvements.json:322,358 mają tech=Brązownictwo, tech.json nie). Jednostki z brązu wymagają Koszar (Wojskowość) i zapasu brązu.',
    'Żegluga': 'Zaokrętowanie (embarkation.ts:25) niepokazane. Badanie wymaga Tartaku w państwie (tech.json:181 „wymagane ulepszenie"; research.ts:224). Galera wymaga Koszar (epoka Brąz).',
    'Pismo': 'Badanie wymaga Cegielni w państwie (tech.json:196; research.ts:180), a Cegielnia jest dostępna od epoki Brązu.',
    'Religia': 'Świątynia wymaga Kamiennych kręgów w mieście. 4 efekty — Top5 = NIE_USTALONO.',
    'Jeździectwo': 'Stadnina (terrain-improvements.json:100, tech=Jeździectwo) niepokazana na karcie. Wszystkie jednostki wymagają Koszar i brązu. Brak kolejnych technologii. 4 efekty — Top5 = NIE_USTALONO.',
    'Wojskowość': 'Fort-ulepszenie ma epoka=3 w danych (terrain-improvements.json:270); w gra/src/game nie znaleziono bramki epoki dla ulepszeń (terrain-improvements.ts:101-105 używa epoki tylko w koszcie) — pewność ŚREDNIA. „Zbuduj Koszary, jeśli spełniasz ich wymagania" — Koszary nie mają wymagań (buildings.json:1047 wymagania="").',
    'Matematyka': 'Brak budynków, jednostek i ulepszeń dla wszystkich; tylko drogi badań + 2 cuda narodowe. Top3–Top5 = NIE_USTALONO.',
    'Handel': 'Emporion wymaga Targowiska w mieście (buildings.json:1095 uwagi).',
    'Kodeks': 'Dwór Zarządcy tylko w mieście regionalnym (upgrade Domu Starszyzny).',
    'Budownictwo': 'Badanie wymaga dostępu do cegły (tech.json:294 — pole opisowe). Mury zastępują bonus Palisady (city-defense.ts:67-72).',
    'Waluta': 'Na karcie: „Mennica: pieniadz +2" (przyrost na poziom) — mnożnik ×1,5 nieobecny. Realny współczynnik: econ-params.json:585-591 (easy 1,62 / normal 1,50 / hard 1,38), liczony w economy.ts:952-955 na podatku miejskim PRZED podziałem suwakami (economy.ts:962-967) — mnoży więc pieniądz, naukę i luksus. Warunki: Waluta + Mennica w stolicy (jedna na państwo) + Targowisko + dostęp do Złota; zużywa 1 Złota/turę (zloto-access.ts:31, turn-economy.ts:1879-1894). Dochód z tras handlowych nie podlega mnożnikowi. civ-matrix meta_mnoznik_waluta (cityTradeMultiplier, mnoznikHandelPieniadzForCivByDifficulty) — brak wywołań w runtime (grep), martwy.',
    'Astronomia': 'Jedyny efekt (poziomTechGate {"6":"Astronomia"} Biblioteki, buildings.json:797) jest nieosiągalny: maksPoziom Biblioteki = 2 (buildings.json:750). Żadna technologia nie wymaga Astronomii. Realnie: brak korzyści — Top2–Top5 = NIE_USTALONO.',
    'Hutnictwo żelaza': 'Badanie wymaga Odlewni brązu (tech.json:336). Wszystkie 19 jednostek z Tech=Hutnictwo żelaza mają przypisaną nację (units.json) — brak ogólnodostępnej jednostki żelaznej. Kopalnia żelaza niepokazana na karcie. Po awansie do epoki 3 jednostki epoki Kamienia znikają z rekrutacji (production.ts:1051).',
    'Inżynieria': 'Cud Brama narodów wymaga też Wojskowości (wonders.json:448; wonder-availability.ts:65) i jest wyścigiem: maxNaSwiecie=1 (wonders.json:440-448 blok cudu) — kto pierwszy, ten zbuduje.',
    'Oblężnictwo': 'Badanie wymaga Koszar. W production.ts nie znaleziono bramki Warsztatu oblężniczego dla Katapulty (cities.ts:844-850: flaga „REZERWA") — Katapulta wymaga tylko technologii, żelaza i Koszar. 4 efekty — Top5 = NIE_USTALONO.',
    'Filozofia': 'Teatr jest na karcie, ale ma suppressed=true (buildings.json:1728) — nie da się go zbudować. Badanie wymaga Biblioteki. 3 efekty — Top4–Top5 = NIE_USTALONO.',
    'Prawo': 'Brak kolejnych technologii.',
    'Drogi brukowane': 'bonus_ruch=2 w danych to martwe pole (terrain-improvements.json:303 uwaga) — ruch liczony stałą 5 (road-movement.ts:29). 3 efekty — Top4–Top5 = NIE_USTALONO.',
    'Medycyna': '„Lazaret" z tech.json nie istnieje w buildings.json (0 trafień). Badanie wymaga Studni. 2 efekty — Top3–Top5 = NIE_USTALONO.',
    'Obróbka żelaza': 'Wielka odlewnia i Wielka Kuźnia mają epokaWejscia=4 (PARKOWANE), a production.ts:966 blokuje budynki z wyższej epoki — w obecnej grze (3 epoki) są niedostępne. Realne efekty: tylko jednostki narodowe, cud narodowy, droga do Sztuki wojennej.',
    'Sztuka wojenna': '„Bramka elit UNITS" z uwag tech.json — brak bramki akademia_wojskowa w production.ts (grep): NIE_USTALONO. 2 efekty — Top3–Top5 = NIE_USTALONO.',
}
