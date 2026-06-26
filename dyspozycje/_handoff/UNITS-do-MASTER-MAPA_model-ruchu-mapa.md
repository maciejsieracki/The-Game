# HANDOFF: UNITS → MAPA + SILNIK — model RUCHU PO MAPIE (specyfikacja)

**Data:** 2026-06-25 · **Od:** Civ-UNITS · **Do:** MAPA (render/UI heksów) + SILNIK (pętla tury, pathfinding)
**Ustalenie z Naster:** rozdzielamy „reguły" (UNITS) od „wykonania" (MAPA/SILNIK).

## 0. GRANICA LANE'ÓW — kiedy zaczyna się praca UNITS
- **Dopóki jednostka/armia jest na MAPIE** (ruch, pathfinding, mgła wojny, kolejka tury, klik-by-iść) → **MAPA + SILNIK**.
- **Praca UNITS zaczyna się w momencie ROZPOCZĘCIA BITWY** — gdy gracz kliknie „atak" na wrogą jednostkę/miasto i powstaje plansza taktyczna (np. pierwsza plansza oblężenia). Od tego momentu: scena bitwy, jednostki 3D, mur/brama, machiny, morale, rozstawienie, AI starcia = **UNITS**. Po zakończeniu bitwy wynik (kto przeżył, zdobycie miasta) wraca do **SILNIKA**.
- UNITS dostarcza dodatkowo: **wartości i reguły ruchu jednostki** (sekcje niżej) + **UX armii/statystyk na mapie** (panel jednostki, staty). MAPA/SILNIK to KONSUMUJĄ.

## 1. PUNKTY RUCHU (źródło: `data/units.json` — własność UNITS)
- `Ruch` = punkty ruchu **na mapie** / turę (np. Robotnik 2, Wojownik 2, konnica 3–4, machiny oblężnicze 1).
- `Ruch w bitwie (heksy)` = OSOBNY, tylko scena bitwy (UNITS) — NIE używać na mapie.
- Jednostka wydaje punkty na wchodzenie w pola wg kosztu terenu (sekcja 2). Ruch kończy się, gdy zabraknie punktów.
- Rekom.: zasada „minimum 1 pole" — jeśli jednostka ma ≥1 pkt, może wejść w 1 sąsiednie pole nawet gdy koszt > pozostałych punktów (standard 4X). DO DECYZJI.

## 2. KOSZT WEJŚCIA W TEREN (źródło: `terrain-combat.json` / `terrain-movement.json` — uzgodnić z MAPA/EKONOMIA)
- Płaskie/równina **1**, Las **2**, Wzgórza **2**, Góry **3–4** (lub niedostępne dla konnicy/rydwanów/machin), Pustynia **1–2**.
- **Rzeka**: wejście kończy turę (przeprawa); po przeprawie −25% Atak w bitwie (już w terrain-combat). 
- **Droga**: obniżony koszt (rekom. 0,5 / pole) — premiuje sieć dróg (łączy miasta i posterunki).
- **Głęboka woda/morze**: tylko jednostki morskie (Galera) lub zaokrętowanie (przyszłość) — piechota nie wchodzi.
- Modyfikatory per typ: **Konnica/Rydwany** brak Gór, Las/Wzgórza droższe; **Machiny (Siege)** bardzo wolne (1 pkt/turę), brak Gór.

## 3. STREFA KONTROLI (ZoC)
- Wejście w pole sąsiadujące z wrogą jednostką **zatrzymuje ruch** (zużywa resztę punktów) — standard 4X. DO DECYZJI: czy wszystkie jednostki rzucają ZoC, czy tylko bojowe.

## 4. STACK / ARMIA
- Ile jednostek na polu (stack) i czy armia porusza się grupą z prędkością **najwolniejszej** jednostki — DO DECYZJI (rekom.: armia = grupa, tempo najwolniejszej; machiny spowalniają).
- UX armii (panel składu/statystyk na mapie) = UNITS.

## 5. FORTYFIKACJA / OBOZOWANIE
- Rozkaz „Stand by"/obozowanie: jednostka nie rusza się, dostaje +obronę; na polu **posterunku/fortu** aktywuje bonus +50%/+100% (wymaga trybu obozowania — patrz `UNITS-do-MASTER_bonusy-obronne-mapa.md`). Tryb obozowania pochodzi z rozkazów jednostki (UNITS), zużycie na mapie = SILNIK.

## 6. WEJŚCIE W BITWĘ (styk z UNITS)
- Gdy ruch jednostki wchodzi na pole wrogiej jednostki/miasta → SILNIK uruchamia **scenę bitwy UNITS** z właściwym presetem:
  - pole otwarte → bitwa polowa;
  - miasto **bez muru** → zdobycie z marszu (bez sceny lub krótka scena);
  - miasto **z murem** → bitwa **oblężnicza** (mur+brama, machiny) — patrz `UNITS-do-MASTER_oblezenie-mapy-bitwy.md`.
- Po bitwie: SILNIK przyjmuje wynik (ocaleli/zdobycie) i wraca na mapę.

## 7. PODZIAŁ ODPOWIEDZIALNOŚCI (skrót)
| Element | Lane |
|---|---|
| Wartości ruchu jednostki (`Ruch`), reguły per typ, ZoC/przeprawa/stack jako cechy | **UNITS** |
| UX armii/statystyk na mapie | **UNITS** |
| Pathfinding po heksach, zużycie punktów w turze, mgła, animacja, klik-by-iść, podgląd ścieżki | **MAPA + SILNIK** |
| Koszty terenu (dane) | MAPA/EKONOMIA (UNITS konsultuje) |
| Scena bitwy/oblężenia | **UNITS** |

## 8. OTWARTE DECYZJE (Naster/zespół)
- Zasada „min. 1 pole"; ZoC dla wszystkich czy tylko bojowych; model stacku/armii (grupa vs pojedyncze); zaokrętowanie (kiedy).

— Civ-UNITS
