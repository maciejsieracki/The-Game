# -*- coding: utf-8 -*-
# Final Control r1 — TRZECI, niezależny turniej (DODATEK 1 pkt 4 dispatchu).
# Zakres: odkrycia ze sporem po Obronie (Prawo — ziarnistość; 7 odkryć ze zmienionym Top1;
# Koło — nowy kandydat) + próbka zgodnych (Waluta, Wymiana, Brązownictwo, Żegluga,
# Wojskowość, Budownictwo). Te same kandydatury i dowody co w techdata.py (ID kandydata),
# WŁASNE oceny FC (S, N, B, Z, O, C), te same wagi, pojedynki „każdy z każdym”, R-K1 i E1.
# Format: FC_SCORES[odkrycie][id_kandydata] = ((S, N, B, Z, O, C), 'uzasadnienie oceny FC').

FC_SCORES = {
    'Prawo': {
        'a': ((4, 3, 3, 2, 3, 5), 'Sąd: −30% strat z korupcji (economy.ts:1225-1249), w mieście, gdzie stoi.'),
        'b': ((3, 2, 3, 2, 3, 4), '19 pkt Prawa (society-params.json:809) — ten sam mechanizm co Trybunał.'),
        'c': ((2, 1, 2, 2, 3, 4), 'Płaskie przyrosty jednego budynku.'),
        'd': ((4, 2, 3, 1, 3, 4), 'Pretorium tylko w mieście regionalnym (lokalizacja region) — ZASIĘG 1.'),
        'e': ((2, 1, 2, 1, 3, 5), 'Płaskie przyrosty, tylko region.'),
    },
    'Łowiectwo': {
        'a': ((2, 3, 4, 3, 2, 4), 'Wymaga Tartaku na tym samym polu (Obróbka drewna) — ODCZUWALNOŚĆ 2.'),
        'b': ((3, 3, 4, 2, 3, 4), 'Droga badań — R-K1 obniża N i O.'),
    },
    'Mistycyzm': {
        'a': ((2, 2, 3, 2, 4, 5), 'Płaskie +1 Kultury, +1 zadowolenia.'),
        'b': ((2, 3, 3, 2, 3, 4), 'Konwersja religijna +2%/turę (society-params.json:588) — mechanika religii.'),
        'c': ((3, 4, 5, 4, 1, 3), 'Cud-wyścig maxNaSwiecie=1 — dostanie go 1 z 15 cywilizacji; E1 wyklucza z Top1.'),
        'd': ((2, 2, 4, 3, 2, 4), 'Droga badań — R-K1.'),
    },
    'Religia': {
        'a': ((3, 3, 4, 2, 3, 4), 'Świątynia +4%/turę konwersji (society-params.json:581).'),
        'b': ((2, 1, 2, 2, 4, 5), 'Płaskie przyrosty.'),
        'c': ((3, 3, 4, 1, 2, 3), 'Cud narodowy jednej cywilizacji — ZASIĘG 1.'),
        'd': ((3, 3, 5, 5, 2, 3), 'Droga badań — R-K1.'),
    },
    'Matematyka': {
        'a': ((4, 3, 5, 5, 1, 3), 'Droga badań do Murów, Mennicy, Katapult — R-K1.'),
        'b': ((4, 3, 4, 1, 2, 3), 'Cuda narodowe 2 z 15 cywilizacji (Sumer, Majowie) — ZASIĘG 1.'),
    },
    'Obróbka żelaza': {
        'a': ((0, 2, 5, 2, 0, 2), 'Martwe: epokaWejscia=4 (production.ts:966).'),
        'b': ((0, 2, 5, 2, 0, 2), 'Martwe: epokaWejscia=4.'),
        'c': ((3, 1, 3, 1, 1, 3), 'Jednostki 2 z 15 cywilizacji.'),
        'd': ((3, 3, 4, 1, 2, 3), 'Cud narodowy Słowian — ZASIĘG 1.'),
        'e': ((3, 3, 5, 4, 1, 3), 'Droga badań — R-K1.'),
    },
    'Inżynieria': {
        'a': ((4, 2, 4, 2, 3, 5), 'Cytadela +100% ponad Mury (miasto-params.json:84, city-defense.ts:67-69).'),
        'b': ((4, 2, 4, 2, 3, 5), 'Baszta +100% (miasto-params.json:89, city-defense.ts:73) — równa Cytadeli; remis → wyżej na liście.'),
        'c': ((3, 1, 3, 2, 3, 5), 'Rozbudowa istniejącego Portu.'),
        'd': ((4, 3, 5, 4, 1, 3), 'Cud-wyścig + wymaga Wojskowości — E1 wyklucza z Top1.'),
        'e': ((3, 3, 5, 4, 1, 3), 'Droga badań — R-K1.'),
    },
    'Oblężnictwo': {
        'a': ((3, 3, 3, 1, 2, 4), 'Katapulta: Atak dystansowy 8, zasięg 6 heksów, wallAttack 16 (units.json:3482-3505) — '
                                  'jedyna jednostka burząca mury zza linii; Taran okuty (Brąz) ma wallAttack 18, ale w zwarciu, stąd B=3.'),
        'b': ((3, 1, 3, 3, 2, 5), 'Warsztat: +10% parametrów (unit-building-bonuses.ts:23-33). NOWA MECHANIKA 1, bo badanie '
                                  'Oblężnictwa WYMAGA Koszar (tech.json „wymagany budynek: Koszary”), a Koszary dają już tę samą '
                                  'ścieżkę parametrów (+20%) — Warsztat tylko ją powiększa (z Koszarami razem +30%).'),
        'c': ((2, 1, 2, 2, 3, 5), 'Płaskie przyrosty.'),
        'd': ((3, 3, 5, 4, 1, 3), 'Droga badań — R-K1.'),
    },
    'Koło': {
        'a': ((5, 5, 4, 4, 4, 5), 'Ruch po drodze ×3 (road-movement.ts:14).'),
        'b': ((2, 1, 3, 3, 4, 5), '+2 handlu na polu drogi.'),
        'c': ((4, 4, 4, 1, 4, 4), 'Rydwan (woły) 400 HP bez Koszar (epoka Kamienia).'),
        'd': ((3, 3, 4, 4, 1, 3), 'Droga badań — R-K1.'),
        'e': ((3, 2, 4, 3, 3, 4), 'Wódz-Rydwan (generals.ts:71-73, main.ts:7304-7305) — tylko w epoce Kamienia; zamiana modelu istniejącej mechaniki wodza, N=2.'),
    },
    # ---- próbka zgodnych (≥ 6, w tym Waluta/Mennica) ----
    'Waluta': {
        'a': ((5, 5, 5, 5, 3, 5), 'Mennica ×1,50 normal (econ-params.json:585-591) na podatku przed suwakami (economy.ts:952-955), w każdym mieście.'),
        'b': ((3, 3, 5, 3, 3, 4), 'Kopalnia złota +10 handlu i Złoto.'),
        'c': ((2, 1, 2, 2, 3, 5), 'Płaskie przyrosty.'),
        'd': ((3, 2, 5, 5, 2, 3), 'Warunek Mennicy.'),
        'e': ((2, 2, 3, 5, 2, 4), 'Złoto w dyplomacji.'),
    },
    'Wymiana': {
        'a': ((5, 5, 5, 5, 4, 4), 'Bramka handlu: TRADE_TECH = Wymiana (trade-routes.ts:1086-1093).'),
        'b': ((3, 1, 2, 2, 4, 5), 'Płaskie przyrosty.'),
        'c': ((4, 3, 4, 2, 3, 5), '+50% dochodu z tras (econ-params.json:278).'),
        'd': ((3, 3, 3, 2, 3, 4), '+1 trasa.'),
        'e': ((1, 1, 2, 2, 4, 5), '+2 zdrowia.'),
        'f': ((2, 2, 4, 2, 1, 3), 'Warunek budynków.'),
        'g': ((3, 3, 4, 1, 2, 3), 'Cud narodowy Chin.'),
        'h': ((3, 2, 4, 5, 2, 3), 'Droga badań — R-K1.'),
    },
    'Brązownictwo': {
        'a': ((5, 5, 5, 5, 4, 3), 'Awans epoki.'),
        'b': ((4, 3, 5, 5, 4, 5), 'Limit wodzów 1→2 (generals.ts:2-4).'),
        'c': ((4, 5, 5, 5, 2, 3), 'Odlewnia brązu — jedyne źródło brązu.'),
        'd': ((3, 4, 5, 5, 3, 4), 'Kopalnia miedzi +20/turę.'),
        'e': ((2, 3, 5, 5, 3, 4), 'Kopalnia cyny.'),
        'f': ((4, 4, 4, 3, 3, 5), 'Kuźnia +15% Pancerza.'),
        'g': ((4, 3, 4, 2, 1, 4), 'Jednostki z brązu — wymagają Koszar (Wojskowość).'),
        'h': ((2, 2, 3, 1, 1, 3), 'Machiny oblężnicze Brązu.'),
        'i': ((3, 3, 5, 5, 2, 3), 'Droga badań — R-K1.'),
    },
    'Żegluga': {
        'a': ((5, 5, 5, 5, 5, 4), 'Zaokrętowanie (embarkation.ts:25).'),
        'b': ((3, 1, 3, 2, 4, 5), 'Płaskie przyrosty.'),
        'c': ((3, 3, 3, 2, 3, 4), '+1 trasa.'),
        'd': ((3, 4, 5, 3, 4, 5), 'Łodzie rybackie.'),
        'e': ((3, 4, 5, 1, 1, 3), 'Galera — wymaga Koszar.'),
        'f': ((3, 3, 5, 4, 1, 3), 'Cud-wyścig.'),
        'g': ((3, 2, 4, 5, 2, 3), 'Droga badań — R-K1.'),
    },
    'Wojskowość': {
        'a': ((5, 5, 5, 3, 4, 5), 'Bramka Koszar dla epoki ≥ 2 (production.ts:1075-1076).'),
        'b': ((4, 4, 4, 3, 3, 5), '+20% parametrów.'),
        'c': ((1, 1, 1, 2, 4, 5), '+2 Pracy.'),
        'd': ((4, 4, 4, 3, 3, 4), 'Fort terenowy.'),
        'e': ((3, 3, 4, 2, 2, 3), 'Cuda.'),
        'f': ((3, 3, 5, 4, 2, 3), 'Droga badań — R-K1.'),
        'g': ((2, 2, 4, 2, 1, 3), 'Warunek budynków.'),
    },
    'Budownictwo': {
        'a': ((5, 3, 4, 2, 3, 5), 'Mury +200% (miasto-params.json:79).'),
        'b': ((5, 3, 5, 2, 3, 5), 'Akwedukt: limit 20 (economy.ts:1049-1053).'),
        'c': ((2, 1, 3, 2, 3, 5), '+4 zdrowia.'),
        'd': ((2, 1, 2, 2, 3, 5), '+2 zadowolenia.'),
        'e': ((3, 2, 5, 2, 1, 3), 'Warunek Cytadeli i Baszty.'),
        'f': ((3, 3, 4, 1, 2, 3), 'Cud narodowy Asyrii.'),
        'g': ((3, 3, 5, 4, 2, 3), 'Droga badań — R-K1.'),
    },
}

# Odkrycia, w których po FC zostaje decyzja produktowa (Q7): żaden kandydat nie spełnia E1.
FC_Q7 = {'Matematyka', 'Obróbka żelaza'}
