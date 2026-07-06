# MASTER → Grupa F — playtest walki na mapie (C1+C2)

**Data:** 2026-06-27 · **Priorytet:** **P0** (Maciej zablokowany — ma tylko bitwę bez mapy)  
**Spec:** `docs/master/PLAYTEST-WALKA-MAPY-SPEC.md`

## Co przesyłam

Maciej potrzebuje **mapy świata z gotowym setupem**, nie podglądu samej bitwy (`T`, `Gra-podglad-BITWA.html`, `OBLEZENIE-BITWA`).

**Dwa testy w jednym pliku:**
- **A** — atak **jednostki** wroga (sąsiedni hex) → preBattle → bitwa 3D
- **B** — atak **miasta** wroga (jeśli C3 nie ma w main — skoordynuj z Grupą A; preset miasta + mur + garnizon i tak wymagany)

## Co zrób

1. Funkcja `startPlaytestWalkaMapy()` (nazwa dowolna) — preset po starcie:
   - ~15 jednostek gracza w klastrze
   - miasto AI + **1 słaba jednostka** w zasięgu ataku hex=1
   - seed stały, fog odkryty w strefie
2. Wejście: przycisk menu **„Playtest walki”** lub `location.search` `?playtest=walka`
3. Publish: **`Gra-podglad-PLAYTEST-WALKA.html`** (root Civ) — ten sam bundle co ROBOCZA, inna ścieżka startu OK
4. Bramka → raport `→ MASTER: GOTOWE-ROBOCZA` + md5

## DoD

Patrz spec § Kryteria akceptacji (7 punktów).

## Nie ruszaj

- `advanceEmpireFood` (stub B5)
- Kanon `Gra-podglad.html` bez dyspozycji Mastera po playteście

## Lane pomocnicze

- Kamera przy starcie → możesz poprosić A o `getPlaytestWalkaCamera()` jeśli wolisz moduł MAPA
