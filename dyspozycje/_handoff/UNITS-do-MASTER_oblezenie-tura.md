# HANDOFF: UNITS → MASTER/SILNIK — PĘTLA TURY OBLĘŻENIA

**Data:** 2026-06-25 · **Od:** Civ-UNITS · **Do:** SILNIK (pętla tury) · Zatwierdzone przez Naster.

## Stan oblężenia (gdy armia oblega miasto Z MUREM)
Miasto bez muru = zdobycie z marszu (bez tego). Z murem → stan „oblężenie", obsługiwany co turę:

### Każda TURA oblężenia (kolejność)
1. **Żywność (zegar głodu):** `magazyn_żywności -= (populacja + liczba_jednostek_garnizonu)`. Dane magazynu/populacji z EKONOMII (patrz `UNITS-do-EKONOMIA_zapasy-oblezenie.md`). Blokada odcina dochód żywności (magazyn tylko maleje).
2. **Atrycja garnizonu:** każdej jednostce garnizonu `HP -= 8% maxHP` (zmęczenie/ostrzał/choroby). Niezależne od żywności.
3. **Budowa machiny (atakujący):** **1 machina / turę** (Taran/Katapulta/Wieża — wybór gracza w panelu oblężenia). Kolejka: 3 machiny = 3 tury. PRZYSZŁOŚĆ: limit/turę wg wielkości armii + generała.
4. **Warunek UPADKU (sprawdź po krokach 1–2):** miasto pada/kapituluje, gdy **co pierwsze**:
   - `magazyn_żywności <= 0` → głód → kapitulacja (rekom. natychmiast lub w następnej turze), LUB
   - HP garnizonu ≤ próg osłabienia (rekom. ~30–40% średniego HP garnizonu).
5. **Szturm:** w dowolnej turze atakujący może przejść do **bitwy taktycznej oblężniczej** (scena UNITS: mur+brama, machiny rozbijają bramę/wchodzą na mur). To moment startu mojej sceny.

### Po bitwie/upadku
- Wynik wraca do SILNIKA: zdobycie miasta (transfer właściciela — jest w `game/siege.ts captureCity`) lub odparcie.

## Parametry (UNITS, do strojenia)
- Atrycja: **8% maxHP / turę** garnizonu.
- Próg upadku HP: ~30–40% (do balansu).
- Kapitulacja po wyzerowaniu zapasów: 1 tura.
- Mur miasta: +200% obrony broniących (`miasto-params.json bonus_obrona_mur_proc=200`; w scenie bitwy obrońca na koronie = ×3.0).

## Powiązane handoffy
- Reguły/mapy oblężenia: `UNITS-do-MASTER_oblezenie-mapy-bitwy.md`.
- Panel oblężenia + turniej atrycji: `UNITS_oblezenie-panel-i-atrycja.md`.
- Dane zapasów: `UNITS-do-EKONOMIA_zapasy-oblezenie.md`.

— Civ-UNITS
