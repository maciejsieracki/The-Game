import json, sys
# usage: python3 -I skrypt-03-units-porownanie.py <units_pin.json> <units_rust.json>
pin = json.load(open(sys.argv[1], encoding="utf-8"))
rust = json.load(open(sys.argv[2], encoding="utf-8"))
pm = {x["Jednostka"]: x for x in pin}
rm = {x["Jednostka"]: x for x in rust}
print("jednostki pin:", len(pm), "rust:", len(rm), "te same nazwy:", set(pm) == set(rm))
pk = set(); [pk.update(x.keys()) for x in pin]
rk = set(); [rk.update(x.keys()) for x in rust]
print("klucze pin:", len(pk), "rust:", len(rk), "tylko pin:", sorted(pk - rk), "tylko rust:", sorted(rk - pk))
cells = 0; per = {}; units = 0
for n in pm:
    hit = False
    for k in set(pm[n]) & set(rm[n]):
        if pm[n][k] != rm[n][k]:
            cells += 1; per[k] = per.get(k, 0) + 1; hit = True
    units += 1 if hit else 0
print("komorki (jednostka x pole) z inna wartoscia:", cells, "jednostek z >=1 roznica:", units)
print("wg pola:", sorted(per.items(), key=lambda t: -t[1]))
