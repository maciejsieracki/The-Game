# HANDOFF: UNITS → MASTER — bonusy obronne za mapę/budowle

**Data:** 2026-06-25 · **Od:** Civ-UNITS · **Do:** Master (silnik/mapa/oblężenia)
**Decyzja Naster.** Dane już wpisane przez UNITS; wymaga WPIĘCIA w kod combat/siege.

## Wartości (źródło prawdy = panel `Civ-UNITS/Bitwa-parametry.xlsx` → sekcja „Bonusy obronne za mapę/budowle")

| Budowla | Epoka | Zasięg terytorium | Bonus Obrony | Warunek |
|---|---|---|---|---|
| **Posterunek (Strażnica)** | Brąz (2) | **5 pól** | **+50%** | jednostka w trybie OBOZOWANIA na polu |
| **Fort / umocnienia** | Żelazo (3) | **10 pól** | **+100%** | jednostka w trybie OBOZOWANIA na polu |
| **Miasto z murem** | — | — | **+200%** | broniące się jednostki w mieście z murem |

## Co UNITS już zrobił (dane)
- `gra/data/terrain-improvements.json`:
  - `posterunek`: `epoka:2`, `zasieg_pol:5`, `bonus_obrona_proc:50`, `bonus_wymaga_obozowania:true` (było epoka 1, bez bonusu).
  - `fort`: `zasieg_pol:10`, `bonus_obrona_proc:100` (było 25), `bonus_wymaga_obozowania:true`.
- `gra/data/miasto-params.json`: `bonus_obrona_mur_proc: 200` (nowy klucz).
- `Civ-UNITS/Bitwa-parametry.xlsx`: nowa sekcja z tymi wartościami.

## Do zrobienia (kod — Master + ewentualnie UNITS po stronie battleScene)
1. **Konsumpcja bonusu w obronie**: przy liczeniu obrażeń/obrony bronionej jednostki dodać mnożnik z budowli: posterunek +50%, fort +100%, miasto z murem +200% (kumulacja z terenem — do ustalenia: addytywnie czy multiplikatywnie; proponuję mnożnik na finalnej Obronie, max jeden „budowlany" bonus naraz, najwyższy wygrywa).
2. **Tryb OBOZOWANIA**: bonus posterunku/fortu działa tylko gdy jednostka stoi na polu budowli w trybie obozowania (stand-by/garrison). Ten tryb dopiero powstanie przy sterowaniu graczem (patrz `BRIEF-UX_mapa-bitwy.md` §3 — rozkaz „Stand by"). Do czasu jego wdrożenia: bonus = dla jednostki stojącej na polu budowli we własnym terytorium.
3. **Zasięg (5/10 pól)**: rozszerzenie terytorium/widoczności wokół posterunku/fortu — domena MAPY (Master).
4. **Mur miasta**: potrzebny stan „miasto ma mur" (budynek/upgrade — brak dziś dedykowanego budynku „Mury"; jest tylko tech „Murarstwo" przy Warsztacie kamieniarskim). Master decyduje, jak reprezentować mur miasta i wpiąć +200% w `game/siege.ts` + obronę bitewną.

## Założenie do potwierdzenia
- Przyjąłem, że bonus fortu też wymaga trybu obozowania (spójnie z posterunkiem). Naster wprost powiedział o obozowaniu tylko przy posterunku — jeśli fort ma dawać +100% każdej jednostce na polu (bez obozowania), zmienię `fort.bonus_wymaga_obozowania` na `false`.

— Civ-UNITS
