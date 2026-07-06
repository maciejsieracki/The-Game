# KONTRAKT: UNITS → MASTER — walka MULTI-UNIT + AUTO-rozstrzyganie

**Data:** 2026-06-26 · Od: Grupa C · Do: MASTER · Decyzje Naster (1=auto, 4=C/1-hex).

## 1. SKŁAD BITWY (które jednostki biorą udział) — decyzja 4
Do bitwy wchodzą jednostki z heksa ATAKUJĄCEGO + heksa OBROŃCY **oraz wszystkie jednostki w promieniu 1 HEKSA** od każdego z nich (posiłki). Czyli: dla atakującego — jego heks + 6 sąsiednich własnych; dla obrońcy — jego heks + 6 sąsiednich własnych. Dalsze heksy NIE biorą udziału.
- Silnik zbiera te listy i podaje do UNITS.

## 2. DWA TORY ROZSTRZYGANIA
- **AUTO-rozstrzyganie** (decyzja 1 = „auto"): używane dla **AI vs AI**, gdy gracz wybierze „Auto", i dla wszystkich bitew, w których gracz nie gra ręcznie. To ODRĘBNY, dopracowany model (nie 1v1!). Algorytm (propozycja UNITS, do akceptacji):
  1. Dla każdej strony policz **siłę efektywną** = Σ po jednostkach: `f(jedn) = (Atak_eff × HP × morale_factor)` z modyfikatorami: countery typów (Macierz-walki), teren, **struktury obronne** (mur miasta +200%, fort +100%, posterunek +50% — `structureDefenseBonusFor`), flanki/szarża pomijalne w auto (uśrednione).
  2. Stosunek sił `R = siłaAtk / siłaDef` → rozdziel straty proporcjonalnie (strona słabsza traci więcej); rozłóż straty na poszczególne jednostki proporcjonalnie do ich ekspozycji (front bije pierwszy).
  3. Wynik: zwycięzca + **straty per jednostka** (HP po bitwie, padł/rozbity), ocaleli. Deterministycznie (opcjonalnie mały seed-rand dla wariancji).
- **TAKTYCZNA** (gracz wybiera „Pole bitwy"): pełna `BattleScene` (mur/brama/machiny/morale/sterowanie); wynik czytany ze sceny. Ten sam SKŁAD (sekcja 1).

## 3. KONTRAKT DANYCH
- Input (silnik→UNITS): `{ attacker: Unit[], defender: Unit[], teren, struktury:{maMur,fort,posterunek}, isSiege:boolean }`. `Unit = { id, nazwa, typ, Atak, Obrona, Uderzenie, Pancerz, Przebicie, HP, maxHP, morale, bonusyVsTyp }`.
- Output (UNITS→silnik): `{ winner:'atk'|'def', attackerResult: {id, hpPo, padł, rozbity}[], defenderResult: [...], ocaleliAtk, ocaleliDef }`. Silnik aplikuje wynik na mapę (usuwa padłych, aktualizuje HP), a przy mieście → ewentualnie `captureCity`.

## 4. UWAGA
AUTO-rozstrzyganie to świadomie osobny temat „do pełnego przemyślenia" (Naster) — powyższy algorytm to propozycja startowa; zestroimy wagi z `Macierz-walki.xlsx`. Spójność: ten sam model siły dla AI vs AI i dla podglądu „szybki wynik" gracza.

— Grupa C
