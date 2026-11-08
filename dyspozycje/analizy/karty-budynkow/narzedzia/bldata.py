# -*- coding: utf-8 -*-
# Dane turnieju kart budynków (R-WEB-BUILDING-CARDS-TOP5-ANALYSIS-Q1, Operator r1).
# c(id, kind, tytul, tekst, cel, ev, S, N, B, Z, O, C, sr=False, old=(), akcja=None)
#   kind  = 'own'  — efekt samego budynku, działa od ukończenia budowy (kandydat do Top1, reguła E1-B)
#           'next' — budynek jest warunkiem/odblokowaniem czegoś dalej (rozbudowa, inny budynek, badanie);
#                    reguła R-B1: NOWA MECHANIKA = 0, ODCZUWALNOŚĆ ≤ 1, nie może być Top1
#   tytul = tytuł pozycji TOP 5 z liczbą (format właściciela: tytuł + jedno zdanie)
#   tekst = jedno zdanie wyjaśnienia
#   cel   = fraza po „aby …” do „Co możesz teraz zrobić” (None = nie jest celem czynności)
#   ev    = dowód plik:linia (aliasy rozwijane w generatorze)
#   S N B Z O C = SKALA, NOWA MECHANIKA, BRAK ZASTĘPNIKA, ZASIĘG, ODCZUWALNOŚĆ, CZYTELNOŚĆ (0–5)
#   sr    = True → pewność ŚREDNIA (wartość pewna, warunek/zasięg niezweryfikowany w pełni)
#   old   = numery pozycji dzisiejszego top3 (1–3), które opisują TEN SAM efekt (do porównania)
#   akcja = czynność następcza (tylko kind='next'), np. „Rozbuduj go do …” — wchodzi do CMZ
# d(tytul, ev, powod, old=()) — efekt martwy/niedostępny: NIE w TOP 5, lista „ukryć do czasu naprawy”.

#   war   = True → wartość efektu zależy od stanu gry, którego budynek sam nie zapewnia (np. „0 bez aktywnej
#           trasy handlowej”, „0 bez nadwyżki Pracy i decyzji gracza”); reguła E1-B2 (Obrona r1): nie może być Top1, gdy budynek ma efekt własny bez warunku
def c(id, kind, tytul, tekst, cel, ev, S, N, B, Z, O, C, sr=False, old=(), akcja=None, war=False):
    return dict(id=id, kind=kind, tytul=tytul, tekst=tekst, cel=cel, ev=ev, sc=(S, N, B, Z, O, C), sr=sr, old=tuple(old), akcja=akcja, war=war)

def d(tytul, ev, powod, old=()):
    return dict(tytul=tytul, ev=ev, powod=powod, old=tuple(old))

LVL = 'PR:252-271'          # poziom budynku = epoka miasta − epokaWejscia + 1, ograniczony maksPoziom
HAP = 'EC:509-535'          # Szczęście: +1 ryczałt + baza.zadowolenie, tylko dajeSzczescie=true
PRE = 'BG:110-121'          # CITY_BUILDING_PREREQ (wymóg budynku w tym samym mieście)
RSG = 'RS:154-180'          # bramka „wymagany budynek” badania

# Czynność budowy per budynek (pierwsze zdanie „Co możesz teraz zrobić”)
ACT = {
    'stolarnia': 'Zbuduj Stolarnię',
    'kamieniarski': 'Zbuduj Warsztat kamieniarski',
    'kuznia': 'Zbuduj Kuźnię brązu',
    'odlewnia_brazu': 'Zbuduj Odlewnię brązu',
    'odlewnia_zelaza': 'Rozbuduj Odlewnię brązu do Odlewni żelaza',
    'wielka_odlewnia': None,
    'targowisko': 'Zbuduj Targowisko',
    'port': 'Zbuduj Port handlowy w mieście nad wodą',
    'port_wielki': 'Rozbuduj Port handlowy do Portu wielkiego',
    'spichlerz': 'Zbuduj Spichlerz',
    'spichlerz_ii': 'Rozbuduj Spichlerz do Spichlerza Królewskiego',
    'garncarnia': 'Zbuduj Garncarnię',
    'cegielnia': 'Zbuduj Cegielnię',
    'kamienne_kregi': 'Zbuduj Kamienne kręgi',
    'swiatynia': 'Zbuduj Świątynię',
    'biblioteka': 'Zbuduj Bibliotekę',
    'studnia': 'Zbuduj Studnię',
    'akwedukt': 'Zbuduj Akwedukt',
    'mennica': 'Zbuduj Mennicę w stolicy',
    'palisada': 'Zbuduj Palisadę drewnianą',
    'mury': 'Zbuduj Mury',
    'koszary': 'Zbuduj Koszary',
    'emporion': 'Zbuduj Emporion',
    'magazyn': 'Zbuduj Magazyn',
    'stela': 'Postaw Stelę',
    'palac': 'Zbuduj Pałac w stolicy',
    'palac_ii': 'Rozbuduj Pałac do Pałacu II',
    'palac_iii': 'Rozbuduj Pałac II do Pałacu III',
    'kuznia_zelaza': 'Rozbuduj Kuźnię brązu do Kuźni żelaza',
    'wielka_kuznia': None,
    'fort': 'Zbuduj Cytadelę',
    'baszta': 'Zbuduj Basztę',
    'warsztat_oblezniczy': 'Zbuduj Warsztat oblężniczy',
    'akademia': 'Zbuduj Akademię',
    'teatr': None,
    'sad': 'Zbuduj Sąd',
    'dom_starszyzny': 'Zbuduj Dom Starszyzny w mieście regionalnym',
    'dwor_zarzadcy': 'Rozbuduj Dom Starszyzny do Dworu Zarządcy',
    'pretorium': 'Rozbuduj Dwór Zarządcy do Pretorium',
    'trybunal': 'Zbuduj Trybunał',
    'garnizon': 'Zbuduj Garnizon w mieście regionalnym',
    'laznia_publiczna': 'Zbuduj Łaźnię publiczną',
    'akademia_wojskowa': 'Zbuduj Akademię wojskową',
}

B = {}      # kandydaci per id budynku
DEAD = {}   # efekty martwe per id budynku
NOTES = {}  # uwagi per id budynku
COST_EXTRA = {}  # koszty bieżące poza utrzymaniem w złocie (cena korzyści)

# ---------------------------------------------------------------- Produkcja
B['stolarnia'] = [
    c('a', 'own', '+10% drewna w całym państwie', 'Każda Stolarnia w dowolnym mieście zwiększa wydobycie drewna całego państwa o 10% (Stolarnie sumują się).',
      'zwiększyć wydobycie drewna całego państwa o 10%', 'EP:285-291;TE:1536', 3, 3, 4, 5, 3, 4),
    c('b', 'own', '+5 Pracy w mieście (8 w Brązie, 11 w Żelazie)', 'Daje miastu 5 Pracy, a z każdą kolejną epoką o 3 więcej.',
      'dodać miastu 5 Pracy', 'B:3;' + LVL, 2, 1, 2, 2, 4, 5, old=(1,)),
]
NOTES['stolarnia'] = 'Dzisiejszy top3 pomija główny efekt (+10% drewna w państwie). Pozycje 2–3 to warunek i wymaganie technologii.'

B['kamieniarski'] = [
    c('a', 'own', '+10% kamienia w całym państwie', 'Każdy Warsztat kamieniarski zwiększa wydobycie kamienia całego państwa o 10% (warsztaty sumują się).',
      'zwiększyć wydobycie kamienia całego państwa o 10%', 'EP:292-298;TE:1539', 3, 3, 4, 5, 3, 4),
    c('b', 'own', '+4 Pracy w mieście (6 w Brązie, 8 w Żelazie)', 'Daje miastu 4 Pracy, a z każdą kolejną epoką o 2 więcej.',
      'dodać miastu 4 Pracy', 'B:61;' + LVL, 2, 1, 2, 2, 4, 5, old=(1,)),
]
NOTES['kamieniarski'] = 'Dzisiejszy top3 pomija główny efekt (+10% kamienia w państwie).'

B['kuznia'] = [
    c('a', 'own', '+15% Pancerza jednostek (na stałe)', 'Jednostka zrekrutowana w tym mieście albo wchodząca do niego dostaje trwale +15% Pancerza.',
      'dać jednostkom trwale +15% Pancerza', 'B:108;UB:9-21;UB:171-176', 4, 4, 4, 3, 3, 5, old=(2,)),
    c('b', 'own', '+6 Pracy i +1 pieniądza w mieście', 'Stały dochód miasta niezależny od epoki.',
      'dodać miastu 6 Pracy', 'B:108', 2, 1, 2, 2, 4, 5, old=(1,)),
    c('c', 'next', 'Rozbudowa do Kuźni żelaza: Pancerz do +30%', 'Po Hutnictwie żelaza rozbudowa do Kuźni żelaza podnosi premię do +30% Pancerza.',
      'podnieść Pancerz jednostek do +30%', 'B:1398;UB:9-21', 3, 2, 4, 3, 3, 5, akcja='Rozbuduj ją do Kuźni żelaza (Hutnictwo żelaza)'),
]
DEAD['kuznia'] = [d('„maksymalnie do +45%” z Wielką Kuźnią', 'B:1448;PR:966', 'Wielka Kuźnia ma epokaWejscia=4 — w grze z 3 epokami niedostępna; realny sufit to +30%.', old=(2,))]
NOTES['kuznia'] = 'Pole przyrost (praca 3) martwe przy maksPoziom=1 (uwagi buildings.json:108). Pozycja 3 dzisiejszego top3 to warunek (ruda).'

B['odlewnia_brazu'] = [
    c('a', 'own', 'Wytapia brąz: do 50 sztuk na turę', 'Zamienia rudę miedzi, drewno i cynę w brąz (50 cykli na turę, więcej w kolejnych epokach); brąz to koszt wojska epoki Brązu.',
      'wytwarzać brąz potrzebny do wojska epoki Brązu', 'CV:13;CV:97;EP:362-368', 4, 5, 5, 5, 3, 4, old=(2,)),
    c('b', 'own', '+5 Pracy w mieście', 'Stały dodatek Pracy miasta.', 'dodać miastu 5 Pracy', 'B:156', 2, 1, 2, 2, 4, 5, old=(1,)),
    c('c', 'next', 'Warunek badania Hutnictwa żelaza', 'Bez Odlewni brązu w państwie nie zbadasz Hutnictwa żelaza (epoka Żelaza).',
      None, 'T:340;' + RSG, 4, 3, 5, 5, 2, 4),
    c('d', 'next', 'Rozbudowa do Odlewni żelaza: żelazo i +12 Pracy', 'Po Hutnictwie żelaza rozbudowa daje drugi konwerter — żelazo.',
      'wytwarzać także żelazo', 'B:204;CV:98-99', 4, 3, 5, 5, 2, 3, old=(3,), akcja='Rozbuduj ją do Odlewni żelaza (Hutnictwo żelaza)'),
]
NOTES['odlewnia_brazu'] = 'Pole przyrost martwe (maksPoziom=1). Konwerter wymaga też cyny (0,1 na cykl, converters.ts:97).'

B['odlewnia_zelaza'] = [
    c('a', 'own', 'Wytapia żelazo: do 50 sztuk na turę (i nadal brąz)', 'Zamienia rudę żelaza i drewno w żelazo dla wojska epoki Żelaza, a obok dalej wytapia brąz.',
      'wytwarzać żelazo dla wojska epoki Żelaza', 'CV:13;CV:98-99;EP:369-375', 4, 5, 5, 5, 3, 4, old=(2,)),
    c('b', 'own', '+12 Pracy i +1 pieniądza w mieście', 'Dwa razy więcej Pracy niż Odlewnia brązu.', 'dodać miastu 12 Pracy', 'B:204', 3, 1, 2, 2, 4, 5, old=(1,)),
]
DEAD['odlewnia_zelaza'] = [d('„Krok ku Wielkiej odlewni”', 'B:253;PR:966', 'Wielka odlewnia ma epokaWejscia=4 — dziś niedostępna.', old=(3,))]

B['wielka_odlewnia'] = []
DEAD['wielka_odlewnia'] = [
    d('Cały budynek (stal, +18 Pracy, +3 pieniądza)', 'B:253;PR:966;CV:100-102', 'epokaWejscia=4 (PARKOWANE), production.ts:966 blokuje budynki z epoki wyższej niż epoka miasta — w grze z 3 epokami nie da się go zbudować.', old=(1, 2, 3)),
]
NOTES['wielka_odlewnia'] = 'Budynek niedostępny — karta do ukrycia (Q4). Odkrycie Obróbka żelaza nie powinno go pokazywać.'

B['garncarnia'] = [
    c('a', 'own', 'Wytwarza ceramikę: do 50 sztuk na turę', 'Zamienia glinę i drewno w ceramikę; każdy Spichlerz zużywa jej 25 na turę.',
      'wytwarzać ceramikę dla Spichlerzy', 'CV:85;EP:383-389;EP:390-396', 3, 4, 5, 5, 3, 3, old=(2,)),
    c('b', 'own', '+10% żywności w mieście', 'Premia procentowa do żywności miasta, w którym stoi.', 'zwiększyć żywność miasta o 10%', 'EP:299-305;EC:1008', 2, 2, 3, 2, 3, 5),
    c('c', 'own', '+3 Pracy w mieście (5 w Brązie, 7 w Żelazie)', 'Daje miastu 3 Pracy, a z każdą epoką o 2 więcej.', 'dodać miastu 3 Pracy', 'B:554;' + LVL, 2, 1, 2, 2, 4, 5, old=(1,)),
    c('d', 'next', 'Otwiera Spichlerz w każdym mieście (limit 5 → 8)', 'Jedna Garncarnia gdziekolwiek spełnia bramkę ceramiki Spichlerza w całym państwie.',
      'podnieść limit ludności miast z 5 do 8', 'B:458;EP:31-37', 4, 3, 4, 5, 2, 4, akcja='Zbuduj w miastach Spichlerze'),
]
NOTES['garncarnia'] = 'Pozycja 3 dzisiejszego top3 („Wymaga gliny i otwiera Garncarstwo”) to warunek + wymaganie. Brak +10% żywności na karcie.'

B['cegielnia'] = [
    c('a', 'own', '+25% Pracy z terenu miasta', 'Pola obrabiane przez miasto dają o jedną czwartą więcej Pracy (+31% łatwy, +19% trudny).',
      'zwiększyć Pracę z terenu miasta o 25%', 'EP:271-277;EC:863-866', 4, 2, 4, 2, 4, 5),
    c('b', 'own', 'Wytwarza cegłę: 50 cykli × 2 cegły na turę', 'Zamienia 2 gliny i 1 drewno w 2 cegły; od epoki Brązu +50% bazy na epokę — cegła buduje budynki epoki Żelaza.',
      'wytwarzać cegłę na budynki epoki Żelaza', 'CV:11;CV:84;EP:355-361', 3, 4, 5, 5, 3, 3, old=(2,)),
    c('c', 'next', 'Warunek badania Pisma i Religii', 'Bez Cegielni w państwie nie zbadasz Pisma (Biblioteka) ani Religii (Świątynia).',
      None, 'T:200;T:214;' + RSG, 4, 3, 5, 5, 2, 4, old=(3,)),
    c('d', 'own', '+4 Pracy w mieście (6 w Żelazie)', 'Daje miastu 4 Pracy, w epoce Żelaza 6.', 'dodać miastu 4 Pracy', 'B:601;' + LVL, 2, 1, 2, 2, 4, 5, old=(1,)),
]
NOTES['cegielnia'] = 'Dzisiejszy top3 pomija +25% Pracy z terenu (econ-params.json:271). epokaWejscia=2 przy technologii z epoki Kamienia (production.ts:966) — budowa dopiero od Brązu.'

# ---------------------------------------------------------------- Handel / pieniądz
B['targowisko'] = [
    c('a', 'own', '+50% dochodu z tras handlowych miasta', 'Każda trasa handlowa tego miasta przynosi o połowę więcej (+62% łatwy, +38% trudny).',
      'zwiększyć dochód z tras handlowych miasta o 50%', 'EP:278-284;MN:4194-4198', 4, 3, 4, 2, 3, 5, war=True),
    c('b', 'own', 'Zamiana Pracy na podatek 1:1 w całym państwie', 'Pierwsze Targowisko pozwala przelewać nadwyżkę Pracy na podatek w panelu państwa (tylko gracz).',
      'przelewać nadwyżkę Pracy na podatek', 'WT:14-22;EP:341-347;MN:25922-25927', 1, 3, 4, 5, 4, 3, war=True),
    c('c', 'own', '+1 trasa handlowa i premia 5% trasy', 'Miasto może utrzymać o jedną trasę więcej, a jedna jego trasa dostaje +5% dochodu.',
      'otworzyć miastu kolejną trasę handlową', 'TR:908-921;TR:925-945;TR:1659', 3, 3, 3, 2, 3, 4, war=True),
    c('d', 'own', '+5 pieniądza w mieście (8 w Brązie, 11 w Żelazie)', 'Stały dochód, rośnie o 3 z każdą epoką.', 'dać miastu 5 pieniądza', 'B:303;' + LVL, 3, 1, 2, 2, 4, 5, old=(1,)),
    c('e', 'own', '+2 zdrowia i +1 Szczęścia w mieście', 'Lepsze zaopatrzenie poprawia zdrowie i nastroje mieszkańców.', None, 'SP:24-30;TE:476-485;' + HAP, 1, 1, 2, 2, 4, 5),
    c('f', 'next', 'Warunek Mennicy (stolica) i Emporionu', 'Bez Targowiska w tym samym mieście nie zbudujesz Mennicy ani Emporionu.',
      'pomnożyć podatek wszystkich miast ×1,5', PRE, 4, 3, 4, 2, 2, 3, akcja='Zbuduj w stolicy Mennicę (Waluta)'),
]
NOTES['targowisko'] = 'Pozycje 2–3 dzisiejszego top3 („Niski koszt wejścia”, „Otwiera Wymianę”) to masło maślane. Zamiana Pracy na podatek działa tylko dla gracza (work-tax.ts:20 isHumanOwner). Obrona r1 (zarzut Evaluatora 3): +50% z tras i slot trasy są warte 0 bez aktywnej trasy (dochód lądowej trasy 1–8 wg dystansu, econ-params.json dochody_ladowe) → reguła E1-B2; to samo dotyczy zamiany Pracy na podatek (0 bez nadwyżki Pracy i decyzji gracza, AI nie korzysta) → Top1 = +5 pieniądza. +2 zdrowia (turn-economy.ts:420,485) zostaje poza TOP 5 (29:27 z „Warunkiem Mennicy”); wchodzi automatycznie, jeśli właściciel w Q2 wybierze B.'

B['port'] = [
    c('a', 'own', '+1 trasa handlowa i premia 5% trasy', 'Miasto portowe utrzymuje o jedną trasę więcej, a jedna trasa dostaje +5% dochodu.',
      'otworzyć miastu kolejną trasę handlową', 'TR:908-921;TR:1659', 3, 3, 3, 2, 3, 4, war=True),
    c('b', 'own', '+5 pieniądza i +1 Pracy w mieście', 'Stały dochód miasta nad wodą.', 'dać miastu 5 pieniądza', 'B:361', 3, 1, 3, 2, 4, 5, old=(1,)),
    c('c', 'own', '+1 pieniądza za każdą trasę morską ponad pierwszą', 'Premia morska należy się tylko miastu z Portem.', 'zarabiać na kolejnych trasach morskich', 'TR:1755-1772', 1, 3, 5, 2, 3, 4, war=True),
    c('d', 'own', '+1 Szczęścia w mieście', 'Ryczałt Szczęścia za budynek szczęściodajny.', None, HAP, 1, 1, 1, 2, 4, 5),
    c('e', 'next', 'Rozbudowa do Portu wielkiego: +10 pieniądza', 'Po Inżynierii rozbudowa podwaja dochód portu.', 'podwoić dochód portu (+10 pieniądza)', 'B:409', 3, 2, 3, 2, 2, 5, old=(3,), akcja='Rozbuduj go do Portu wielkiego (Inżynieria)'),
]
NOTES['port'] = 'Pole przyrost martwe (maksPoziom=1). Pozycja 2 dzisiejszego top3 to warunek (woda).'

B['port_wielki'] = [
    c('a', 'own', '+10 pieniądza i +2 Pracy w mieście (Port: +5)', 'Podwaja dochód Portu handlowego, który zastępuje.', 'podwoić dochód portu (+10 pieniądza)', 'B:409', 3, 1, 3, 2, 4, 5, old=(1,)),
    c('b', 'own', 'Zachowuje trasę handlową i premię morską Portu', 'Po rozbudowie miasto nie traci slotu trasy ani +1 pieniądza za trasę morską.', None, 'TR:908-921;TR:208;TR:1755-1772', 2, 1, 3, 2, 5, 3),
    c('c', 'own', '+1 Szczęścia w mieście', 'Ryczałt Szczęścia za budynek szczęściodajny.', None, HAP, 1, 1, 1, 2, 4, 5),
]
NOTES['port_wielki'] = 'Port wielki nie daje drugiego slotu trasy — zastępuje Port w liście budynków (trade-routes.ts:900-903). Pozycje 2–3 dzisiejszego top3 to warunek i wymaganie.'

B['mennica'] = [
    c('a', 'own', '×1,5 podatku w każdym mieście państwa', 'Mnoży podatek z handlu wszystkich miast przed podziałem na naukę, pieniądz i luksus (×1,62 łatwy, ×1,38 trudny); nie obejmuje tras.',
      'pomnożyć podatek wszystkich miast ×1,5', 'EP:585-591;EC:644-653;EC:952-955;EC:962-967', 5, 5, 5, 5, 3, 5),
    c('b', 'own', '+3 pieniądza w stolicy (5 w Żelazie)', 'Mały stały dochód stolicy.', None, 'B:901;' + LVL, 2, 1, 2, 2, 3, 5, old=(1,)),
]
COST_EXTRA['mennica'] = 'zużywa 1 Złota na turę (zloto-access.ts:31, turn-economy.ts:1879-1894)'
DEAD['mennica'] = [d('budynek_mennica_mnoznik / waluta_mnoznik (parametry legacy)', 'EP:313-319;EP:334-340', 'Opis w econ-params: „nieużywany przez bieżący kod” — nie pokazywać jako efektu.')]
NOTES['mennica'] = 'Realny współczynnik: econ-params.json:585-591 (easy 1,62 / normal 1,50 / hard 1,38), economy.ts:952-955 (handelNetto × mnożnik) przed podziałem suwakami (economy.ts:962-967). Warunki: Waluta + stolica + Targowisko w stolicy + dostęp do Złota. Dzisiejszy top3 nie wspomina o mnożniku.'

B['emporion'] = [
    c('a', 'own', '+1 trasa handlowa i premia 5% trasy', 'Miasto utrzymuje o jedną trasę więcej, a kolejna trasa dostaje +5% dochodu.',
      'otworzyć miastu kolejną trasę handlową', 'TR:908-921;TR:1659', 3, 3, 3, 2, 3, 4, old=(2, 3), war=True),
    c('b', 'own', '+8 pieniądza w mieście', 'Większy dochód niż Targowisko (+5).', 'dać miastu 8 pieniądza', 'B:1095', 3, 1, 3, 2, 4, 5, old=(1,)),
]
NOTES['emporion'] = 'Pole przyrost (4) martwe przy maksPoziom=1. Pozycje 2 i 3 dzisiejszego top3 opisują ten sam efekt (slot + 5%).'

B['magazyn'] = [
    c('a', 'own', '+20% pojemności magazynu państwa', 'Każdy Magazyn zwiększa limit każdego surowca w całym państwie o 20% bazy (np. 50 000 → 60 000 w Kamieniu).',
      'zwiększyć pojemność magazynu państwa o 20%', 'EP:613-619;EU:398;EU:431', 3, 3, 5, 5, 3, 5),
    c('b', 'own', '+1 Pracy i +1 pieniądza (po 2 w Żelazie)', 'Drobny dochód miasta, rośnie z epoką.', None, 'B:1154;' + LVL, 1, 1, 1, 2, 4, 5, old=(1,)),
]
NOTES['magazyn'] = 'Dzisiejszy top3 pomija główny efekt (+20% pojemności). „Niski koszt utrzymania” i „Otwiera Handel” to masło maślane.'

# ---------------------------------------------------------------- Żywność / zdrowie
B['spichlerz'] = [
    c('a', 'own', 'Limit ludności miasta 5 → 8', 'Bez Spichlerza (i Akweduktu) miasto nie urośnie ponad 5 mieszkańców.',
      'podnieść limit ludności miasta z 5 do 8', 'EP:24-37;EC:1053', 5, 4, 4, 2, 4, 5, old=(3,)),
    c('b', 'own', '+1000 pojemności spichlerza państwa', 'Każdy Spichlerz zwiększa centralny zapas żywności państwa o 1000 (×2 na epokę).',
      'zwiększyć zapas żywności państwa o 1000', 'EF:175-192;BG:548', 3, 3, 4, 5, 4, 4),
    c('c', 'own', '−25% kosztu racji żywnościowej w mieście', 'Mieszkańcy tego miasta zjadają o jedną czwartą mniej żywności ze spichlerza państwa (racje ×0,75).',
      'obniżyć koszt racji miasta o 25%', 'BG:486-491;PG:206-223;TE:1671', 3, 3, 4, 2, 3, 4),
    c('d', 'own', '+2 żywności i +5 Szczęścia w mieście', 'Najwyższy ryczałt Szczęścia wśród budynków Kamienia.', None, 'B:458;' + HAP, 3, 1, 2, 2, 4, 5, old=(1,)),
    c('e', 'next', 'Rozbudowa do Spichlerza Królewskiego: limit 12', 'Po Piśmie i z dostępem do soli limit ludności rośnie do 12.',
      'podnieść limit ludności miasta z 8 do 12', 'B:505;EP:38-44', 4, 2, 3, 2, 2, 5, akcja='Rozbuduj go do Spichlerza Królewskiego (Pismo, sól)'),
    c('f', 'own', '+5 zdrowia w mieście', 'Lepsze zdrowie przyspiesza wzrost ludności miasta.', None, 'BG:472-477;TE:2023', 2, 1, 2, 2, 3, 5),
    c('g', 'own', '+1% wzrostu ludności na turę', 'Składnik „Spichlerz” w procencie wzrostu miasta.', None, 'BG:479-484;PG:262-277', 1, 1, 3, 2, 2, 4),
]
COST_EXTRA['spichlerz'] = 'zużywa 25 Ceramiki na turę (econ-params.json:390-396, building-resource-gate.ts:335)'
DEAD['spichlerz'] = [d('„pojemność zapasów armii 100 na Spichlerz”', 'EP:171-177', 'Klucz spichlerz_pojemnosc_zapasow_panstwa nie ma konsumenta w gra/src (grep) — nie pokazywać.'),
                     d('„po wzroście miasto zachowuje 50% zapasu żywności”', 'EC:1099;EC:1150-1155;PG:306-342',
                       'Obrona r1: działa tylko w populationGrowth (economy.ts:1107), które nie ma wywołania w gra/src (grep „populationGrowth(”); żywy wzrost to applyFractionalGrowthV85 — ułamek wzrostu bez bufora, nic się nie zeruje ani nie zachowuje — nie pokazywać.')]
NOTES['spichlerz'] = 'Pole przyrost martwe (maksPoziom=1). Pozycja 3 dzisiejszego top3 mówi o limicie ludności bez liczby. Obrona r1: premie −25% racji, +5 zdrowia, +1% wzrostu oraz plony działają tylko w turze, w której Ceramika jest opłacona (building-resource-gate.ts:451-470).'

B['spichlerz_ii'] = [
    c('a', 'own', 'Limit ludności miasta 8 → 12', 'Spichlerz Królewski podnosi sufit miasta bez Akweduktu do 12 mieszkańców.',
      'podnieść limit ludności miasta z 8 do 12', 'EP:38-44;EC:1053', 4, 2, 3, 2, 3, 5, old=(3,)),
    c('b', 'own', '+1500 pojemności spichlerza państwa (zamiast 1000)', 'Większy wkład w centralny zapas żywności państwa.', None, 'EF:187;BG:549', 2, 1, 3, 5, 4, 4),
    c('c', 'own', '+3 żywności i +5 Szczęścia w mieście', 'O 1 żywności więcej niż Spichlerz.', None, 'B:505;' + HAP, 2, 1, 2, 2, 4, 5, old=(1,)),
    c('d', 'own', '−50% kosztu racji żywnościowej (Spichlerz: −25%)', 'Mieszkańcy tego miasta zjadają o połowę mniej żywności ze spichlerza państwa (racje ×0,5).',
      'obniżyć koszt racji miasta o połowę', 'BG:486-491;PG:206-223;TE:1671', 3, 2, 4, 2, 3, 4),
    c('e', 'own', '+10 zdrowia w mieście (Spichlerz: +5)', 'Lepsze zdrowie przyspiesza wzrost ludności miasta.', None, 'BG:472-477;TE:2023', 2, 1, 2, 2, 3, 5),
    c('f', 'own', '+2% wzrostu ludności na turę (Spichlerz: +1%)', 'Składnik „Spichlerz” w procencie wzrostu miasta.', None, 'BG:479-484;PG:262-277', 1, 1, 3, 2, 2, 4),
]
COST_EXTRA['spichlerz_ii'] = 'zużywa 25 Soli i 25 Ceramiki na turę (econ-params.json:397-410)'
DEAD['spichlerz_ii'] = [d('„po wzroście miasto zachowuje 70% zapasu żywności”', 'EC:1150-1155;PG:306-342',
                          'Obrona r1 (zarzut Evaluatora 1): stała 0,7 żyje tylko w populationGrowth (economy.ts:1107), które nie ma wywołania w gra/src (grep „populationGrowth(”); żywy wzrost to applyFractionalGrowthV85 bez bufora — nie pokazywać.')]
NOTES['spichlerz_ii'] = 'Dzisiejsza pozycja 3 mówi „limit populacji i armii” bez liczb; limit armii nie ma pokrycia w kodzie (uwagi „cap armii 150” → realnie +1500 pojemności spichlerza państwa). Obrona r1: premie −50% racji, +10 zdrowia, +2% wzrostu działają tylko przy opłaconej Ceramice i Soli; bez Soli budynek daje premie Spichlerza (building-resource-gate.ts:465-469).'

B['studnia'] = [
    c('a', 'own', '+2 zdrowia i koniec kary −2 za brak wody', 'Miasto bez rzeki dostaje czystą wodę: +2 zdrowia zamiast −2.',
      'dać miastu czystą wodę (+2 zdrowia, bez kary −2)', 'SP:17-23;SP:116-122;TE:476-498', 3, 3, 4, 2, 4, 4),
    c('b', 'own', '+2 Szczęścia w mieście (rośnie z epoką)', 'Ryczałt +1 i +1 zadowolenia na poziom.', None, 'B:806;' + HAP + ';' + LVL, 1, 1, 2, 2, 4, 5, old=(1,)),
    c('c', 'next', 'Warunek Akweduktu (limit 20) i Łaźni', 'Bez Studni w mieście nie zbudujesz Akweduktu ani Łaźni publicznej.',
      'podnieść limit ludności miasta do 20', PRE + ';B:853', 4, 2, 5, 2, 2, 4, old=(2,), akcja='Zbuduj obok Akwedukt (Budownictwo)'),
    c('d', 'next', 'Warunek badania Medycyny', 'Bez Studni w państwie nie zbadasz Medycyny (Łaźnia publiczna).', None, 'T:425;' + RSG, 2, 2, 5, 5, 1, 4),
]
NOTES['studnia'] = 'Dzisiejszy top3 pomija zdrowie. Pozycja 3 to wymaganie technologii.'

B['akwedukt'] = [
    c('a', 'own', 'Limit ludności miasta do 20', 'Najwyższy próg drabinki: bez budynku 5 → Spichlerz 8 → Spichlerz Królewski 12 → Akwedukt 20.',
      'podnieść limit ludności miasta do 20', 'EP:45-51;EC:1053', 5, 3, 5, 2, 3, 5),
    c('b', 'own', '+4 zdrowia w mieście', 'Akwedukt liczy się też jako dostęp do świeżej wody.', None, 'SP:10-16;TE:476-498', 2, 1, 3, 2, 3, 5),
    c('c', 'own', '+3 Szczęścia w mieście (rośnie z epoką)', 'Ryczałt +1 i +2 zadowolenia.', None, 'B:853;' + HAP, 2, 1, 2, 2, 3, 5, old=(1,)),
]
NOTES['akwedukt'] = 'Dzisiejszy top3 NIE wspomina o limicie ludności 20 — główny powód budowy. Pozycje 2–3 to warunek i wymaganie.'

B['laznia_publiczna'] = [
    c('a', 'own', '+5 zdrowia w mieście', 'Najsilniejsze źródło zdrowia z budynku (+6 łatwy, +4 trudny).', 'podnieść zdrowie miasta o 5', 'SP:31-37;TE:476-498', 3, 2, 4, 2, 3, 5),
    c('b', 'own', '+3 Kultury, +4 Szczęścia i +1 żywności', 'Termy poprawiają nastroje i kulturę miasta.', 'dodać miastu 4 Szczęścia i 3 Kultury', 'B:2034;' + HAP, 3, 1, 3, 2, 3, 4, old=(1, 2)),
    c('c', 'own', 'Asymilacja kultury +1% na turę', 'Podbite miasto szybciej przyjmuje twoją kulturę.', None, 'SP:460-466;CR:459;CS:63-72', 1, 2, 3, 1, 3, 4),
]
NOTES['laznia_publiczna'] = 'Dzisiejszy top3 nie podaje liczb ani zdrowia (+5). Pozycja 3 to warunek.'

# ---------------------------------------------------------------- Religia / kultura / nauka
B['kamienne_kregi'] = [
    c('a', 'own', 'Religia +2% na turę w mieście', 'Przyspiesza szerzenie twojej religii w mieście (+3% łatwy, +1% trudny).',
      'szerzyć swoją religię o 2% na turę', 'SP:588-594;CR:550', 2, 4, 3, 2, 3, 4, old=(2,)),
    c('b', 'own', '+1 Kultury i +2 Szczęścia (rośnie z epoką)', 'Po 1 Kultury i zadowolenia więcej z każdą epoką.', None, 'B:649;' + HAP + ';' + LVL, 2, 2, 3, 2, 4, 5, old=(1,)),
    c('c', 'next', 'Warunek Świątyni (+4% religii na turę)', 'Świątynię zbudujesz tylko w mieście z Kamiennymi kręgami.', 'szerzyć religię o kolejne 4% na turę',
      PRE, 3, 2, 5, 2, 2, 4, akcja='Zbuduj obok Świątynię (Religia)'),
]
NOTES['kamienne_kregi'] = 'Pozycja 3 dzisiejszego top3 to wymaganie technologii.'

B['swiatynia'] = [
    c('a', 'own', 'Religia +4% na turę w mieście', 'Dwa razy szybsze szerzenie religii niż Kamienne kręgi (+6% łatwy, +2% trudny).',
      'szerzyć swoją religię o 4% na turę', 'SP:581-587;CR:549', 3, 3, 4, 2, 3, 4, old=(2,)),
    c('b', 'own', '+2 Kultury i +3 Szczęścia (rośnie z epoką)', 'W epoce Żelaza +3 Kultury i +4 Szczęścia.', None, 'B:696;' + HAP + ';' + LVL, 2, 1, 2, 2, 4, 5, old=(1,)),
    c('c', 'own', 'Religia sięga 2 sąsiednich miast na turę (zamiast 1)', 'Dominująca religia miasta co turę zyskuje wyznawcę w kolejnym mieście w zasięgu 3 heksów (+2 łatwy, 0 trudny).',
      'szerzyć swoją religię na sąsiednie miasta', 'SP:504-510;CR:1064;MN:37700-37712', 2, 3, 4, 3, 2, 4, sr=True),
]
NOTES['swiatynia'] = 'Pozycja 3 dzisiejszego top3 to warunek (Kamienne kręgi). Obrona r1 (zarzut Evaluatora 2): dodano premię szerzenia na sąsiednie miasta — działa tylko, gdy religia jest w mieście dominująca (culture-religion.ts:1050-1053); na poziomie trudnym premia = 0 (society-params.json:507).'

B['stela'] = [
    c('a', 'own', '+1 Kultury i +1 Szczęścia, bez utrzymania', 'Kultura rośnie o 1 z każdą epoką (do +3), a budynek nic nie kosztuje co turę.',
      'zyskać Kulturę bez kosztów utrzymania', 'B:1202;' + HAP + ';' + LVL, 1, 1, 2, 2, 4, 4, old=(1, 2)),
    c('b', 'own', 'Asymilacja kultury +0,5% na turę', 'Podbite miasto nieco szybciej przyjmuje twoją kulturę.', None, 'SP:446-452;CR:457;CS:63-72', 1, 2, 2, 1, 3, 4),
]
NOTES['stela'] = 'Pozycja 3 dzisiejszego top3 to wymaganie technologii.'

B['biblioteka'] = [
    c('a', 'own', '+30% Nauki miasta', 'Procentowa premia do całej nauki miasta (+37% łatwy, +23% trudny).', 'zwiększyć Naukę miasta o 30%', 'EP:320-326;EC:979-982', 4, 3, 4, 2, 4, 5),
    c('b', 'own', '+3 Nauki i +2 Kultury (5 i 3 w Żelazie)', 'Płaski dodatek, rośnie z epoką.', 'dodać miastu 3 Nauki', 'B:744;' + LVL, 3, 2, 3, 2, 4, 5, old=(1, 2)),
    c('c', 'own', 'Asymilacja kultury +2% na turę', 'Podbite miasto szybciej przyjmuje twoją kulturę.', None, 'SP:432-438;CR:455;CS:63-72', 2, 3, 3, 1, 3, 4),
    c('d', 'own', '+1 Szczęścia w mieście', 'Ryczałt Szczęścia za budynek szczęściodajny.', None, HAP, 1, 1, 1, 1, 4, 5),
    c('e', 'next', 'Warunek Akademii i badania Filozofii', 'Bez Biblioteki nie zbudujesz Akademii (+20% Nauki) ani nie zbadasz Filozofii.',
      'zwiększyć Naukę miasta o kolejne 20%', PRE + ';T:383;' + RSG, 4, 2, 5, 2, 2, 4, akcja='Zbuduj obok Akademię (Filozofia)'),
]
DEAD['biblioteka'] = [d('Obserwatorium (poziom 6, wymaga Astronomii)', 'B:750;B:797;' + LVL, 'maksPoziom Biblioteki = 2 — poziom 6 nieosiągalny; Astronomia nic nie odblokowuje.')]
NOTES['biblioteka'] = 'Dzisiejszy top3 pomija +30% Nauki. Pozycja 3 to wymaganie technologii.'

B['akademia'] = [
    c('a', 'own', '+20% Nauki miasta (z Biblioteką razem +50%)', 'Druga premia procentowa do nauki, sumuje się z Biblioteką (+25% łatwy, +15% trudny).',
      'zwiększyć Naukę miasta o kolejne 20%', 'EP:327-333;EC:979-981', 4, 2, 4, 2, 3, 5),
    c('b', 'own', '+6 Nauki, +5 Kultury i +4 Szczęścia', 'Płaski dodatek ponad wkład Biblioteki.', 'dodać miastu 6 Nauki', 'B:1645;' + HAP, 3, 1, 3, 2, 3, 5, old=(1, 2)),
    c('c', 'own', 'Asymilacja kultury +1% na turę', 'Akademia działa jak dawny Amfiteatr/Teatr dla konwersji kultury.', None, 'SP:425-431;CR:454;CS:63-66', 1, 2, 3, 1, 3, 4),
]
DEAD['akademia'] = [d('baza.mnoznik 10 (+3 na poziom)', 'B:1645;UB:9-33', 'Akademia nie należy do żadnej ścieżki mnożnika (unit-building-bonuses.ts) ani do premii nauki (ta idzie z econ-params.json:327) — pole martwe.')]
NOTES['akademia'] = 'Dzisiejszy top3 nie podaje liczb. Pozycja 3 to warunek.'

B['teatr'] = []
DEAD['teatr'] = [d('Cały budynek (+4 Kultury, +3 zadowolenia)', 'B:1693;B:1735', 'suppressed=true — nie da się go zbudować; asymilację kultury „Teatru” daje dziś Akademia (conquest-stability.ts:65).', old=(1, 2, 3))]
NOTES['teatr'] = 'Budynek niedostępny — karta do ukrycia (Q4); Filozofia nie powinna go pokazywać.'

# ---------------------------------------------------------------- Obrona
B['palisada'] = [
    c('a', 'own', '+100% Obrony obrońców miasta', 'Pierwsza fortyfikacja: podwaja obronę jednostek broniących miasta.', 'podwoić obronę miasta (+100% Obrony)',
      'MP:94;CD:60-75', 4, 4, 3, 2, 4, 5, old=(1,)),
    c('b', 'own', 'Miasto trzeba oblegać — wróg nie wejdzie z marszu', 'Miasto z umocnieniem przechodzi w tryb oblężenia; pustego miasta nie da się zająć jednym ruchem.',
      'zmusić wroga do oblężenia zamiast zdobycia z marszu', 'B:992;PR:854-861;MS:50-62;CH:55-62', 4, 4, 3, 2, 4, 3),
]
NOTES['palisada'] = 'Pozycja 2 dzisiejszego top3 („Zastępowana przez Mury”) to strata, nie korzyść; pozycja 3 to wymaganie technologii.'

B['mury'] = [
    c('a', 'own', '+200% Obrony obrońców miasta', 'Trzykrotna obrona jednostek broniących miasta; zastępuje +100% Palisady.', 'potroić obronę miasta (+200% Obrony)',
      'MP:79;CD:60-75', 5, 3, 4, 2, 3, 5, old=(1,)),
    c('b', 'own', 'Miasto trzeba oblegać — wróg nie wejdzie z marszu', 'Mury włączają tryb oblężenia (także gdy w mieście nie ma wojska).', None,
      'B:1040;PR:854-861;MS:50-62;CH:55-62', 3, 2, 3, 2, 4, 3),
    c('c', 'next', 'Warunek Cytadeli i Baszty (razem +400%)', 'Bez Murów w mieście nie zbudujesz Cytadeli ani Baszty.', 'podnieść obronę miasta do +400%',
      PRE + ';CD:60-75', 4, 2, 5, 2, 2, 4, old=(2,), akcja='Zbuduj Cytadelę i Basztę (Inżynieria)'),
]
NOTES['mury'] = 'Tryb oblężenia daje już Palisada — dla Murów to kontynuacja (N=2). Pozycja 3 dzisiejszego top3 to wymaganie technologii.'

B['fort'] = [
    c('a', 'own', '+100% Obrony ponad Mury (razem +300%)', 'Cytadela stoi obok Murów i dokłada kolejne +100% obrony.', 'podnieść obronę miasta do +300%',
      'MP:84;CD:60-75', 4, 2, 4, 2, 3, 5, old=(1,)),
]
NOTES['fort'] = 'Flaga maFort nie jest czytana przez kod (cities.ts:828-842) — bez dodatkowego efektu. Pozycje 2–3 dzisiejszego top3 to warunek i wymaganie.'

B['baszta'] = [
    c('a', 'own', '+100% Obrony (z Murami i Cytadelą razem +400%)', 'Trzecia, niezależna budowla obronna dokłada +100% obrony.', 'podnieść obronę miasta do +400%',
      'MP:89;CD:60-75', 4, 2, 4, 2, 3, 5, old=(1, 3)),
]
NOTES['baszta'] = 'Flaga maBaszta nie jest czytana (cities.ts:837-842). Pozycja 2 dzisiejszego top3 to warunek.'

# ---------------------------------------------------------------- Wojsko
B['koszary'] = [
    c('a', 'own', 'Rekrutacja wojska epoki Brązu i Żelaza', 'Bez Koszar w mieście nie zrekrutujesz tam żadnej jednostki epoki Brązu ani Żelaza.',
      'rekrutować wojsko epoki Brązu i Żelaza', 'PR:1068-1076', 5, 5, 5, 3, 4, 5),
    c('b', 'own', '+20% parametrów bojowych jednostek (na stałe)', 'Jednostka zrekrutowana lub odwiedzająca miasto dostaje trwale +20% ataku, obrony i zdrowia (bez Pancerza).',
      'wzmocnić jednostki o +20% parametrów', 'B:1047;UB:23-33;UB:179-184', 4, 4, 4, 3, 3, 5, old=(2,)),
    c('c', 'own', '+2 Pracy w mieście (3 w Żelazie)', 'Drobny dodatek Pracy.', None, 'B:1047;' + LVL, 1, 1, 1, 2, 4, 5, old=(1,)),
    c('d', 'next', 'Warunek Warsztatu, Akademii wojskowej i 2 badań', 'Bez Koszar nie zbudujesz Warsztatu oblężniczego ani Akademii wojskowej i nie zbadasz Oblężnictwa ani Sztuki wojennej.',
      'wzmocnić jednostki o kolejne +20%', PRE + ';T:369;T:453;' + RSG, 4, 2, 5, 3, 2, 4, akcja='Zbuduj obok Akademię wojskową (Sztuka wojenna)'),
]
NOTES['koszary'] = 'Dzisiejszy top3 NIE wspomina, że Koszary są bramką rekrutacji wojska Brązu i Żelaza (production.ts:1075). Pozycja 3 to wymaganie technologii.'

B['warsztat_oblezniczy'] = [
    c('a', 'own', '+10% parametrów jednostek (z Koszarami +30%)', 'Trzecia warstwa ścieżki parametrów — sumuje się z Koszarami i Akademią wojskową (maks. +50%).',
      'wzmocnić jednostki o kolejne +10%', 'B:1596;UB:23-33;UB:179-184', 3, 3, 4, 3, 2, 5, old=(2,)),
    c('b', 'own', '+4 Pracy i +2 pieniądza w mieście', 'Drobny dochód miasta.', None, 'B:1596', 2, 1, 2, 2, 3, 5),
]
DEAD['warsztat_oblezniczy'] = [d('„Odblokowuje Katapultę w tym mieście”', 'B:1631;CT:843-850;PR:1068-1076', 'Flaga maWarsztatOblezniczy to REZERWA (cities.ts:845) — production.ts jej nie sprawdza; Katapulta wymaga tylko technologii, żelaza i Koszar.', old=(1,))]
NOTES['warsztat_oblezniczy'] = 'Pozycja 1 dzisiejszego top3 jest NIEPRAWDZIWA (efekt martwy). Pozycja 3 to warunek.'

B['akademia_wojskowa'] = [
    c('a', 'own', '+20% parametrów jednostek (z Koszarami +40%)', 'Sumuje się z Koszarami wprost; z Warsztatem oblężniczym razem +50%.',
      'wzmocnić jednostki o kolejne +20%', 'B:2082;UB:23-33;UB:179-184', 4, 3, 4, 3, 3, 5, old=(1,)),
    c('b', 'own', '+3 Pracy i +2 pieniądza w mieście', 'Drobny dochód miasta.', None, 'B:2082', 1, 1, 1, 2, 3, 5, old=(2,)),
]
DEAD['akademia_wojskowa'] = [d('„bramka elit UNITS” (uwagi)', 'B:2082;PR:1068-1076', 'production.ts nie ma bramki akademia_wojskowa dla jednostek (grep) — nie pokazywać.')]
NOTES['akademia_wojskowa'] = 'Pozycja 3 dzisiejszego top3 to warunek.'

B['kuznia_zelaza'] = [
    c('a', 'own', 'Pancerz jednostek do +30% (brąz + żelazo)', 'Przejmuje +15% Kuźni brązu i dokłada własne +15% — trwale dla jednostek z miasta.',
      'podnieść Pancerz jednostek do +30%', 'B:1398;UB:9-21;UB:171-176', 3, 2, 4, 3, 3, 5, old=(2,)),
    c('b', 'own', '+8 Pracy i +2 pieniądza w mieście', 'Więcej niż Kuźnia brązu (+6 i +1).', None, 'B:1398', 2, 1, 2, 2, 4, 5, old=(1,)),
    c('c', 'next', 'Warunek badania Obróbki żelaza', 'Bez Kuźni żelaza w państwie nie zbadasz Obróbki żelaza.', None, 'T:439;' + RSG, 2, 2, 5, 5, 1, 4),
]
DEAD['kuznia_zelaza'] = [d('„maksymalnie do +45%” z Wielką Kuźnią', 'B:1448;PR:966', 'Wielka Kuźnia ma epokaWejscia=4 — niedostępna.', old=(2,))]
NOTES['kuznia_zelaza'] = 'Pozycja 3 dzisiejszego top3 to warunek (żelazo).'

B['wielka_kuznia'] = []
DEAD['wielka_kuznia'] = [d('Cały budynek (+15% Pancerza, +20 Pracy, +5 pieniądza)', 'B:1448;PR:966', 'epokaWejscia=4 (PARKOWANE) — w grze z 3 epokami nie do zbudowania.', old=(1, 2, 3))]
NOTES['wielka_kuznia'] = 'Budynek niedostępny — karta do ukrycia (Q4).'

# ---------------------------------------------------------------- Administracja
B['palac'] = [
    c('a', 'own', '+35 pkt Prawa w stolicy', 'Główne źródło Prawa stolicy (+45 łatwy, +28 trudny).', 'zapewnić stolicy 35 pkt Prawa', 'SP:816-822;SB:858-867', 4, 3, 3, 2, 3, 4),
    c('b', 'own', '−30% korupcji w stolicy', 'Zmniejsza straty z korupcji w mieście z Pałacem.', 'obniżyć korupcję stolicy o 30%', 'EC:1225-1250', 3, 3, 3, 2, 3, 5),
    c('c', 'own', '+5 Kultury i +3 Szczęścia w stolicy', 'Stały dodatek kultury i nastrojów.', None, 'B:1249;' + HAP, 3, 1, 2, 2, 3, 5, old=(1,)),
    c('d', 'own', 'Asymilacja kultury +2% na turę', 'Szybsza konwersja kultury w mieście z Pałacem.', None, 'SP:439-445;CR:456;CS:63-72', 2, 3, 3, 1, 3, 4),
    c('e', 'next', 'Rozbudowa do Pałacu II: Prawo 45, Kultura 8', 'W epoce Brązu Pałac rośnie do drugiego stopnia.', 'podnieść Prawo stolicy do 45 i Kulturę do 8',
      'B:1298;SP:823-829', 3, 2, 3, 2, 2, 4, old=(3,), akcja='Rozbuduj go do Pałacu II (epoka Brązu)'),
]
NOTES['palac'] = 'Pozycja 2 dzisiejszego top3 to warunek lokalizacji. Dzisiejszy top3 pomija Prawo i korupcję.'

B['palac_ii'] = [
    c('a', 'own', 'Prawo stolicy 35 → 45 pkt', 'Wyższy stopień Pałacu daje więcej Prawa (+58 łatwy, +36 trudny).', 'podnieść Prawo stolicy do 45 pkt', 'SP:823-829;SB:858-867', 4, 2, 3, 2, 3, 4),
    c('b', 'own', '+8 Kultury i +4 Szczęścia w stolicy', 'Półtora raza więcej niż Pałac I.', None, 'B:1298;' + HAP, 3, 1, 2, 2, 3, 5, old=(1,)),
    c('c', 'own', 'Asymilacja kultury +2% na turę (zachowana)', 'Premia Pałacu do konwersji kultury działa dalej.', None, 'CS:63-72;CR:456', 2, 1, 3, 1, 5, 4),
    c('d', 'next', 'Rozbudowa do Pałacu III: Prawo 55, Kultura 11', 'W epoce Żelaza ostatni stopień Pałacu.', 'podnieść Prawo stolicy do 55 i Kulturę do 11',
      'B:1348;SP:830-836', 3, 2, 3, 2, 2, 4, old=(3,), akcja='Rozbuduj go do Pałacu III (epoka Żelaza)'),
]
DEAD['palac_ii'] = [d('−30% korupcji Pałacu I znika po rozbudowie', 'EC:1226;PR:820-838', 'KORUPCJA_REDUKCJA_BUDYNKI zawiera tylko id „palac”, a rozbudowa usuwa je z listy budynków — Pałac II/III traci redukcję korupcji (prawdopodobny błąd, osobny temat).')]
NOTES['palac_ii'] = 'Pozycja 2 dzisiejszego top3 to warunek. Utrata −30% korupcji po rozbudowie — zgłoszone jako błąd do osobnego tematu.'

B['palac_iii'] = [
    c('a', 'own', 'Prawo stolicy 45 → 55 pkt', 'Najwyższy stopień Pałacu w obecnych epokach (+71 łatwy, +44 trudny).', 'podnieść Prawo stolicy do 55 pkt', 'SP:830-836;SB:858-867', 4, 2, 3, 2, 3, 4),
    c('b', 'own', '+11 Kultury i +6 Szczęścia w stolicy', 'Ponad dwa razy więcej niż Pałac I.', None, 'B:1348;' + HAP, 3, 1, 2, 2, 3, 5, old=(1,)),
    c('c', 'own', 'Asymilacja kultury +2% na turę (zachowana)', 'Premia Pałacu do konwersji kultury działa dalej.', None, 'CS:63-72;CR:456', 2, 1, 3, 1, 5, 4),
]
DEAD['palac_iii'] = [d('−30% korupcji Pałacu I znika po rozbudowie', 'EC:1226;PR:820-838', 'jak Pałac II — redukcja liczy tylko id „palac”.')]
NOTES['palac_iii'] = 'Pozycje 2–3 dzisiejszego top3 to warunek i „koniec łańcucha” (masło).'

B['dom_starszyzny'] = [
    c('a', 'own', '+28 pkt Prawa w mieście regionalnym', 'Główne źródło Prawa miasta poza stolicą (+36 łatwy, +22 trudny).', 'zapewnić miastu 28 pkt Prawa',
      'SP:781-787;SB:838-841', 4, 3, 4, 2, 4, 4, old=(1,)),
    c('b', 'own', '+1 Pracy, +1 pieniądza i +2 Kultury', 'Drobny dochód miasta.', None, 'B:1790', 1, 1, 1, 2, 4, 5, old=(2,)),
    c('c', 'next', 'Rozbudowa do Dworu Zarządcy: 33 pkt Prawa', 'Po Kodeksie Dom Starszyzny rośnie do Dworu Zarządcy.', 'podnieść Prawo miasta do 33 pkt',
      'B:1838;SP:788-794', 3, 2, 3, 2, 2, 4, old=(3,), akcja='Rozbuduj go do Dworu Zarządcy (Kodeks)'),
]
NOTES['dom_starszyzny'] = 'Brak technologii — dostępny od startu, tylko w mieście regionalnym (lokalizacja „region”).'

B['dwor_zarzadcy'] = [
    c('a', 'own', 'Prawo miasta regionalnego 28 → 33 pkt', 'Zastępuje Dom Starszyzny i daje więcej Prawa (+43 łatwy, +26 trudny).', 'podnieść Prawo miasta do 33 pkt',
      'SP:788-794;SB:842-845', 3, 1, 3, 2, 3, 4, old=(1,)),
    c('b', 'own', '+2 pieniądza, +3 Kultury i +1 Pracy', 'Więcej niż Dom Starszyzny (+1/+2/+1).', None, 'B:1838', 2, 1, 2, 2, 3, 5, old=(2,)),
    c('c', 'next', 'Rozbudowa do Pretorium: −30% korupcji i 38 Prawa', 'Po Prawie ostatni stopień administracji regionalnej.', 'obniżyć korupcję miasta o 30%',
      'B:1888;EC:1225-1250;SP:795-801', 4, 2, 3, 2, 2, 4, akcja='Rozbuduj go do Pretorium (Prawo)'),
]
NOTES['dwor_zarzadcy'] = 'Pozycja 3 dzisiejszego top3 to warunek.'

B['pretorium'] = [
    c('a', 'own', '−30% korupcji w mieście regionalnym', 'Jedyny — obok Sądu — budynek zmniejszający korupcję poza stolicą.', 'obniżyć korupcję miasta o 30%', 'EC:1225-1250', 4, 3, 3, 2, 3, 5),
    c('b', 'own', 'Prawo miasta 33 → 38 pkt', 'Najwięcej Prawa w łańcuchu administracji regionalnej (+50 łatwy, +31 trudny).', None, 'SP:795-801;SB:846-849', 2, 1, 3, 2, 3, 4, old=(1,)),
    c('c', 'own', '+3 pieniądza, +5 Kultury i +2 Pracy', 'Największy dochód w łańcuchu.', None, 'B:1888', 2, 1, 2, 2, 3, 5, old=(2,)),
]
NOTES['pretorium'] = 'Dzisiejszy top3 pomija −30% korupcji. Pozycja 3 to warunek.'

B['trybunal'] = [
    c('a', 'own', '+17 pkt Prawa w mieście', 'Dowolne miasto, także stolica (+22 łatwy, +13 trudny).', 'dodać miastu 17 pkt Prawa', 'SP:802-808;SB:850-853', 3, 3, 4, 3, 4, 4),
    c('b', 'own', '+1 pieniądza i +2 Szczęścia (rośnie z epoką)', 'W epoce Żelaza +2 pieniądza i +3 Szczęścia.', None, 'B:1938;' + HAP + ';' + LVL, 1, 1, 2, 2, 4, 5, old=(1,)),
]
DEAD['trybunal'] = [d('„Ogranicza korupcję jeszcze zanim miasto zbuduje Sąd”', 'EC:1225-1250', 'Trybunału nie ma w KORUPCJA_REDUKCJA_BUDYNKI (economy.ts:1226) — nie zmniejsza korupcji; realny efekt to Prawo +17.', old=(2,))]
NOTES['trybunal'] = 'Pozycja 2 dzisiejszego top3 jest NIEPRAWDZIWA. Pozycja 3 to wymaganie technologii.'

B['sad'] = [
    c('a', 'own', '−30% korupcji w mieście', 'Zmniejsza straty z korupcji w mieście, w którym stoi.', 'obniżyć korupcję w mieście o 30%', 'EC:1225-1250', 4, 3, 3, 2, 3, 5, old=(2,)),
    c('b', 'own', '+19 pkt Prawa w mieście', 'Dodatkowe Prawo ponad administrację (+25 łatwy, +16 trudny).', 'dodać miastu 19 pkt Prawa', 'SP:809-815;SB:854-857', 3, 2, 3, 2, 3, 4),
    c('c', 'own', '+5 Kultury, +2 pieniądza i +3 Szczęścia', 'Stały dochód kultury i nastrojów.', None, 'B:1742;' + HAP, 3, 1, 2, 2, 3, 4, old=(1,)),
    c('d', 'own', 'Asymilacja kultury +2% na turę', 'Podbite miasto szybciej przyjmuje twoją kulturę.', None, 'SP:453-459;CR:458;CS:63-72', 2, 3, 3, 1, 3, 4),
]
NOTES['sad'] = 'Pozycja 3 dzisiejszego top3 to wymaganie technologii.'

B['garnizon'] = [
    c('a', 'own', 'Milicja: 1 obrońca na mieszkańca przy ataku', 'Przy każdym ataku na miasto staje milicja w liczbie mieszkańców (połowa wręcz, połowa dystans), odnawia się po 5 turach.',
      'bronić miasta milicją (1 obrońca na mieszkańca)', 'CP:51-58;SD:84-90;SG:279-291', 4, 5, 5, 2, 3, 3),
    c('b', 'own', '+25 pkt Prawa (35 w Brązie, 47 w Żelazie)', 'Stałe Prawo niezależne od wojska stacjonującego w mieście.', 'zapewnić miastu stałe Prawo (25–47 pkt)',
      'SP:837-843;SB:879-882', 4, 3, 4, 2, 4, 4, old=(1,)),
]
NOTES['garnizon'] = 'Dzisiejszy top3 nie wspomina o Milicji (combat-params.json:51). Pozycja 2 („Poza łańcuchem”) to masło; pozycja 3 („Przetrwa podbój”) to korzyść zdobywcy, nie właściciela.'
