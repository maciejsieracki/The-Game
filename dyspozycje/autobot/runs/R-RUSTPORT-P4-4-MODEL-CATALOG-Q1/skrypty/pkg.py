"""Przydział 96 plików inwentarza do paczek §4.2 (albo jawnie poza paczki) + kontrola pokrycia 100%
oraz liczba rekordów units.json na paczkę jednostek (z unitfiles.py).
Uruchom: python3 -I .../skrypty/pkg.py
"""
import os
import sys
from collections import defaultdict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pin import inventory_files  # noqa: E402

R = 'gra/src/render/'
P = {
    '01-CORE': ['hexutil', 'hexShape', 'fogDim', 'zoomLod', 'mergeDecor', 'unitVitalsPalette',
                'mapRenderStyle', 'bronzeCity'],
    '03-TERRAIN-DECOR': ['lasy-modele', 'djungla-modele', 'teren-gory-wzgorza', 'dekor-laki-rowniny', 'oaza-pustynia',
                         'tarasy-model', 'mapRenderStyle', 'riverLod'],
    '04-UNIT-CORE': ['units', 'kon-nowy-model', 'galera-model', 'jednostki-p1-rdzen'],
    '05-UNITS-STONE': ['kamien-bazowe-opus5', 'kamien-inka-opus5', 'kamien-lucznicy-opus5', 'kamien-zulu-taran-opus5'],
    '06-UNITS-BRONZE': ['braz-konnica-opus5', 'braz-lucznik-nubijski-opus5', 'braz-miecznik-opus5', 'braz-procarz-opus5',
                        'braz-rydwan-kapadokijski-opus5', 'braz-rydwan-konny-opus5', 'braz-rydwan-woly-opus5',
                        'braz-taran-opus5', 'braz-wlocznik-opus5', 'jednostki-p2-inka', 'jednostki-p3-dystans',
                        'jednostki-p4-melee', 'jednostki-p57-wlocznie-machiny', 'jednostki-p8a-bliskiwschod',
                        'jednostki-p8b-rozni', 'units'],
    '07-UNITS-IRON': ['hastati-opus5', 'hastati-falangita', 'jednostki-p6-super', 'jednostki-z1-mezopotamia',
                      'jednostki-z2-srodziemne', 'jednostki-z3-plemiona', 'zelazo-jezdziec-oszczepami-opus5',
                      'zelazo-konnica-asyryjska-opus5', 'units'],
    '08-UNIT-OVERLAY': ['unitStatPlate', 'unitOwnerEmblem', 'unitUpgradeBadges', 'unitVeteranBadges'],
    '09-CITIES': ['miasto-kamien', 'miasto-braz', 'bronzeCityRoblox', 'stoneCityRoblox', 'stoneCity', 'settlementModel',
                  'cities', 'cityMapOutline'],
    '10-CITY-CHIP': ['cityMapStatChip', 'cityOkolicaOverlay', 'workerFieldOverlay'],
    '11-IMPROVEMENTS': ['improvements', 'robloxImprovements', 'ulepszenia-modele-p2', 'ulepszenia-modele-p3a',
                        'ulepszenia-modele-p3b', 'kopalnia-cyny-opus5', 'kopalnia-zlota-opus5', 'droga-6-ramion',
                        'pastwisko-modele', 'swinia-trzoda', 'styleResources', 'resources'],
    '12-WONDERS': ['wonderModels', 'wonderRenderer'],
    '13-MISC': ['wioska-oboz', 'siegeCampModels', 'siegeMarker', 'siegeCampSync', 'rangeOverlay', 'tradeRoutesOverlay',
                'robloxCity'],
    '14-BATTLE-3D': ['../battle/battleScene', '../battle/siegeWall'],
    '15-PREVIEWS': ['../ui/unitMiniPreview', '../wonderpreview/main'],
    'P4.3 (architektura, nie paczka modeli)': ['scene', 'camera', '../input/picker', '../main', 'perfDebugOverlay',
                                               '../ui/perfTestPanel'],
    'POZA PORTEM do decyzji (D-MOD-2/D-MOD-7)': ['minecraftScene', 'robloxScene', '../battle/manualBattle',
                                                 'countSceneOverlayCandidates'],
}


def path(x):
    import posixpath
    return posixpath.normpath(R + x + '.ts')


inv = inventory_files()
where = defaultdict(list)
for pk, lst in P.items():
    for x in lst:
        where[path(x)].append(pk)

if __name__ == '__main__':
    missing = [f for f in inv if f not in where]
    extra = [f for f in where if f not in inv]
    multi = {f.replace('gra/src/', ''): v for f, v in where.items() if len(v) > 1}
    print('INVENTORY', len(inv), 'ASSIGNED', sum(1 for f in inv if f in where), 'MISSING', missing, 'EXTRA', extra)
    print('MULTI', multi)
    for pk, lst in P.items():
        print(pk, len(lst))
    # rekordy units.json na paczkę jednostek (plik geometrii -> paczka; units.ts dzielony wg epoki rekordu)
    import unitfiles
    file2pk = {}
    for pk in ('04-UNIT-CORE', '05-UNITS-STONE', '06-UNITS-BRONZE', '07-UNITS-IRON'):
        for x in P[pk]:
            if x != 'units':
                file2pk[x + '.ts'] = pk
    cnt = defaultdict(list)
    for name, ep, tgt, fs in unitfiles.rec_files:
        model_fs = [f for f in fs if f != 'units.ts'] or ['units.ts']
        if tgt == 'decorateChariot':
            pk = '04-UNIT-CORE'
        elif model_fs == ['units.ts']:
            pk = {'Brąz': '06-UNITS-BRONZE', 'Żelazo': '07-UNITS-IRON', 'Kamień': '05-UNITS-STONE'}[ep]
        else:
            pks = {file2pk[f] for f in model_fs}
            pk = pks.pop() if len(pks) == 1 else '+'.join(sorted(pks))
        # model z kon-nowy-model (koń) + jeździec w units.ts -> paczka epoki (koń jest zależnością z paczki 4)
        if pk == '04-UNIT-CORE' and tgt != 'decorateChariot' and 'units.ts' in fs:
            pk = {'Brąz': '06-UNITS-BRONZE', 'Żelazo': '07-UNITS-IRON', 'Kamień': '05-UNITS-STONE'}[ep]
        cnt[pk].append(f'{name}[{ep}]')
    for pk in sorted(cnt):
        print('RECORDS', pk, len(cnt[pk]), '; '.join(cnt[pk]))
    print('RECORDS_TOTAL', sum(len(v) for v in cnt.values()))
