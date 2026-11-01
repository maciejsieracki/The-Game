#!/usr/bin/env python3
"""P6.8I: scala wyniki mutacji (przebieg 1 + rerun r2 + rerun r3) do pick-wynik-final.txt.

Status mutanta = OSTATNI wynik z kolejnosci plikow pick-wynik.txt, pick-wynik-r2.txt, pick-wynik-r3.txt (pozniejsze
wektory/poprawione mutanty nadpisuja wczesniejsze). Do statusu SURVIVED/NOOP/COMPILE_ERROR dopisywana jest klasyfikacja
z tabeli EKWIWALENTY (dowod w dokumencie tematu, sekcja "Mutanty ekwiwalentne") albo NIE_ZABITY.
Uzycie: python3 merge-wyniki.py   (w katalogu mutacje/)
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FILES = ['pick-wynik.txt', 'pick-wynik-r2.txt', 'pick-wynik-r3.txt']

# Mutanty ekwiwalentne: klucz = prefiks ID, wartosc = skrot dowodu (pelny dowod plik:linia w dokumencie tematu).
EKWIWALENTY = {
    'C15': 'wyrab: kazdy pick wyrab ma bramke civ w hex_phases (step0, FAZA2); river_krok0_ok tylko steruje bramkami, ktore koncza sie na picku',
    'C16': 'wyrab nie ma bramki technologicznej (test wyrab_has_no_tech_gate_like_web)',
    'C21': 'qualifies() odrzuca klucz juz obecny na heksie (improvement_build.rs:1152) - guard w hill_tartak_pending redundantny',
    'C49': 'effective_city_cap = min(city_cap, imperium_cap), imperium_cap <= pula => gorny clamp procentu redundantny',
    'C60': 'pod demand_active base_priority nie zawiera fort/posterunek (filtr demand w build_city_env) => defense_priority puste',
    'C69': 'step0 i tak wymaga wyrab_wlaczony w obu galeziach; rzeki_do_zagospodarowania steruje tylko step0',
    'C73': 'tartak_dozwolony == true gdy !demand_active; koniunkcja !demand_active && tartak_dozwolony redundantna',
    'C89': 'qualifies() odrzuca klucz juz obecny (improvement_build.rs:1152); RIVER_DEVELOPMENT_KEYS nie zawiera droga',
    'C97': 'hex_dist uzywane wylacznie w komparatorach sortowania; skalowanie stala zachowuje porzadek',
    'H02': 'pusta defense_priority => petla for bez iteracji',
    'H06': 'koszt > 0: wewnetrzny warunek global_spent + koszt > cap lapie rownosc',
    'H07': 'wewnetrzny warunek placed >= max_items lapie rownosc',
    'H08': 'koszt > 0: wewnetrzny warunek praca_left - koszt < rezerwa lapie rownosc',
    'H12': 'po pierwszym pickingu nastepuje break; wewnetrzny placed>=max osiagany tylko w 1. iteracji po warunku zewnetrznym',
    'H21': 'podwojny straznik: koncowy warunek praca_left <= rezerwa petli ustawia te same flagi',
    'H22': 'warunek w petli kluczy (spent >= cap) ustawia te same flagi',
    'H25': 'wyrab nie ma bramki technologicznej',
    'H34': 'koszt > 0: sprawdzenie kosztu w petli kluczy pomija wszystkie klucze; FAZA 2 wymaga spent < cap',
    'H42': 'river_krok0_ok => heks w river_hex_keys => has_river_access => key_blocked_on_hex(tartak/oboz)=true; obie galezie to continue',
    'H43': 'jak H42',
    'H49': 'podwojny straznik (patrz H21)',
    'H50': 'FAZA 2 sama sprawdza te same trzy predykaty (spent<cap, placed<max, praca>rezerwa)',
    'H53': 'wolno_karczowac_poza_rzeka juz zawiera (off || lesne)',
    'H55': 'kazdy koniunkt river_krok0_ok albo wystepuje w drugiej galezi, albo jest sprawdzany przy picku (tech/civ/qualifies)',
    'H65': 'FAZA 2 sama sprawdza te same trzy predykaty',
    'H69': 'wyrab nie ma bramki technologicznej',
    'H74': 'wewnetrzny warunek spent + koszt > cap lapie rownosc',
    'H88': 'sonda tylko ustawia any_candidate=true (idempotentne)',
    'H89': 'jak H88',
    'S09': 'rownosc pula==rezerwa: petla miast przerywa na wejsciu, brak pickow; surplus nie zmienia sie (demand_active=false)',
    'S11': 'zewnetrzny max(0, ..) w imperium_budget_cap redundantny z wewnetrznym',
    'S12': 'zewnetrzny min(pula, ..) i city_cap<=pula',
    'S13': 'wewnetrzny clamp procentu >= 0',
    'S14': 'city_cap = pct%*pula <= pula; picki ograniczone praca_left <= pula',
    'S20': 'researched_techs czytane tylko w create_improvement_build_api (improvement_build.rs:1580), nie w Qualifier',
    'F06': 'wezel fortu lezy w wlasnym okregu fort_circles (odleglosc 0) - kandydat odrzucony wczesniej',
    'F07': 'jak F06',
    'F09': 'duplikat wezla miasta: seen i min(dist) idempotentne',
    'F12': 'puste keys => wewnetrzna petla bez iteracji, best None',
    'F13': 'koszt > 0: praca_left - koszt < rezerwa lapie rownosc',
    'F16': 'ponowna ocena tego samego kandydata daje ten sam wynik, better jest scisle',
    'F21': 'heks z fortem w warstwach ma okrag w fort_circles (odleglosc 0) - odrzucony przez rozlacznosc okregow',
    'F34': 'zysk monotoniczny w promieniu; remis nie jest better (scisle)',
    'F38': 'okrag nowego fortu juz wyklucza ten heks i qualifies nie jest potrzebne dla kolejnych miast',
    'F41': 'rozlacznosc okregow gwarantuje brak nakladania sie obszaru zysku',
    'P03': 'improvement_budget_cap = max(0, total - spent) w after() klampuje ujemne',
    'P09': 'po niepustym etapie flagi pending nie sa czytane (kazdy konsument wymaga staged_picks.is_empty())',
    'P31': 'memo tylko wydajnosc; stan identyczny w obu wywolaniach',
    'P32': 'pass z pustymi miastami zwraca []',
    'P34': 'pass fortow na pustych miastach zwraca []',
    'P46': 'osiagniecie przebiegu drog wymaga braku celow zywnosciowych; lista bez override zwraca te same picki',
    'P48': 'osiagniecie przebiegu drog implikuje fort_spent == 0',
    'P61': 'max_items tylko zmniejsza liczbe pickow; istnienie celu nie zalezy od limitu (dla max>=1)',
    'P62': 'pula sondy = MAX_SAFE_INTEGER, rezerwa nie ogranicza',
    'P66': 'przy braku territoryNodes kazdy przebieg zwraca [] (pojedynczy i etapowy)',
    'A16': 'NaN zawsze jako 2. argument js_max w kodzie (wynik identyczny bez jawnego sprawdzenia)',
}
NIE_ZABITE = {
    'F40': 'tie-break dist po dopisaniu nowego fortu do own_nodes: brak scenariusza z remisem zysku (NASTEPNA-PARTIA)',
    'P24': 'sciezka non-demand z cityLimitExhausted: wymaga mapy bez celow zapasowych, osiagalnej tylko przy blokadzie techow (NIE_ZMIERZONO)',
    'P36': 'wymaga kosztu fortu < kosztu ulepszenia niedoboru (dane: fort/posterunek >= 60 > kamieniolom 22/tartak 25) - nieosiagalne w danych pinu',
    'P38': 'propagacja pickow fortu do przebiegu innych miast: wymaga geometrii fort->heks obronny innego miasta (NIE_ZMIERZONO)',
}


def main():
    final = {}
    order = []
    for fn in FILES:
        path = os.path.join(HERE, fn)
        if not os.path.exists(path):
            continue
        for line in open(path, encoding='utf-8'):
            line = line.strip()
            if not line or ':' not in line:
                continue
            mid, res = line.split(': ', 1)
            if mid not in final:
                order.append(mid)
            final[mid] = res
    out = []
    counts = {'KILLED': 0, 'EKWIWALENT': 0, 'NIE_ZABITY': 0, 'INNE': 0}
    for mid in order:
        res = final[mid]
        pref = mid.split('_')[0]
        if res.startswith('KILLED'):
            counts['KILLED'] += 1
            out.append(f'{mid}: {res}')
        elif pref in EKWIWALENTY:
            counts['EKWIWALENT'] += 1
            out.append(f'{mid}: EKWIWALENT ({res}) - {EKWIWALENTY[pref]}')
        elif pref in NIE_ZABITE:
            counts['NIE_ZABITY'] += 1
            out.append(f'{mid}: NIE_ZABITY ({res}) - {NIE_ZABITE[pref]}')
        else:
            counts['INNE'] += 1
            out.append(f'{mid}: {res} (NIESKLASYFIKOWANY)')
    out.append(f'SUMA: {len(order)} mutantow; KILLED={counts["KILLED"]} EKWIWALENT={counts["EKWIWALENT"]} '
               f'NIE_ZABITY={counts["NIE_ZABITY"]} NIESKLASYFIKOWANE={counts["INNE"]}')
    with open(os.path.join(HERE, 'pick-wynik-final.txt'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')
    print(out[-1])


if __name__ == '__main__':
    main()
