# Analiza balansu jednostek – Skala 0–100 (v2.0)
*Wygenerowano automatycznie | Model Total War | Deterministyczny (wartość oczekiwana)*

---

## Zasady skalowania 0–100

- **Każdy parametr osobno**: najsilniejsza jednostka epoki brązu = 100 w danym parametrze.
- **Atak > Obrona** w obrębie epoki → gwarantuje hit% > 35% między porównywalnymi jednostkami.
- **Nowe staty**: `Masa` (kawaleria/rydwany high, piechota mid, łucznik low), `Morale` (0–100), `Przebicie` (AP, ignoruje Pancerz).
- **Uderzenie** = szarża: bonus do hit% ORAZ do obrażeń w **rundzie 1** (tylko atakujący).
- **dmg_scale = /10**: w formule walki Obrażenia/Przebicie/Uderzenie(dmg) dzielone przez 10, by bitwy trwały 5–50 rund zamiast kończyć się w 1 rundzie (staty wyświetlane w skali 0–100, Health = HP punkty użyte bezpośrednio).

---

## Model walki (Total War)

```
hit = clamp(35 + Atak_ATK + (Uderzenie_ATK if runda==1 else 0) − Obrona_OBR, 8, 90) / 100
dmg = (Obrażenia/10 + (Uderzenie/10 if runda==1 else 0)) × (1 − Pancerz_OBR/200) + Przebicie/10
E[dmg/rundę] = hit × dmg   →   odejmij od HP obrońcy

Jeśli HP_obrońca ≤ 0 → Atakujący wygrywa (ATA t.r)
Potem Obrońca bije Atakującego (bez bonus szarży)
Jeśli HP_atakujący ≤ 0 → Obrońca wygrywa (OBR t.r)
Limit 200 rund → remis
```

---

## Staty jednostek 0–100 (finalne)

| Jednostka         | Atak | Obrona | Obrażenia | Przebicie | Pancerz | Uderzenie | Masa | Health | Morale |
|-------------------|-----:|-------:|----------:|----------:|--------:|----------:|-----:|-------:|-------:|
| Osadnik           |    0 |      5 |         0 |         0 |       0 |         0 |   20 |     20 |     10 |
| Robotnik          |    0 |      5 |         0 |         0 |       0 |         0 |   20 |     20 |     10 |
| Zwiadowca         |    5 |     10 |         0 |         0 |       0 |         0 |   15 |     20 |     30 |
| Łucznik           |   30 |     20 |        35 |        15 |      10 |        10 |   15 |     30 |     40 |
| Wojownik          |   45 |     38 |        45 |        10 |      20 |        20 |   40 |     45 |     50 |
| Wojownik z brązu  |   60 |     48 |        65 |        20 |      35 |        35 |   45 |     55 |     60 |
| Legionista        |   88 |     70 |       100 |        40 |      90 |        80 |   50 |     75 |     85 |
| Konnica           |   80 |     55 |        80 |        60 |      40 |       100 |  100 |     65 |     70 |
| Włócznik          |   50 |     80 |        50 |        20 |      55 |        40 |   45 |     65 |     65 |
| Rydwan (woły)     |   65 |     40 |        70 |        30 |      25 |        90 |   80 |     80 |     55 |
| Falanga           |   48 |    100 |        45 |        15 |      85 |        70 |   50 |    100 |     75 |

**Maksima per parametr (= 100):**
- Atak: Legionista 88 (celowo nie 100 — zostawia przestrzeń dla jednostek z przyszłych epok)
- Obrona: Falanga 100 ✓
- Obrażenia: Legionista 100 ✓
- Przebicie: Konnica 60 (celowo umiarkowane — silne AP w następnych epokach)
- Pancerz: Legionista 90 ✓
- Uderzenie: Konnica 100 ✓
- Masa: Konnica 100 ✓
- Health: Falanga 100 ✓
- Morale: Legionista 85 (celowo nie 100 — zostawia przestrzeń)

---

## Macierz walki 1v1

| ATA ↓ \ OBR → | Osad | Robn | Zwiad | Łucz | Wojow | Woj.Br | Legion | Konn | Włócz | Rydwan | Falang |
|---------------|------|------|-------|------|-------|--------|--------|------|-------|--------|--------|
| Osadnik       | –    | remis | remis | OBR t.7 | OBR t.5 | OBR t.3 | OBR t.2 | OBR t.2 | OBR t.4 | OBR t.3 | OBR t.5 |
| Robotnik      | remis | – | remis | OBR t.7 | OBR t.5 | OBR t.3 | OBR t.2 | OBR t.2 | OBR t.4 | OBR t.3 | OBR t.5 |
| Zwiadowca     | remis | remis | – | OBR t.8 | OBR t.6 | OBR t.3 | OBR t.2 | OBR t.2 | OBR t.4 | OBR t.3 | OBR t.5 |
| Łucznik       | ATA t.7 | ATA t.7 | ATA t.7 | – | OBR t.10 | OBR t.5 | OBR t.3 | OBR t.3 | OBR t.7 | OBR t.4 | OBR t.9 |
| Wojownik      | ATA t.5 | ATA t.5 | ATA t.5 | ATA t.9 | – | OBR t.11 | OBR t.5 | OBR t.5 | OBR t.15 | OBR t.8 | OBR t.19 |
| Woj. z brązu  | ATA t.3 | ATA t.3 | ATA t.3 | ATA t.5 | ATA t.9 | – | OBR t.6 | OBR t.7 | OBR t.25 | OBR t.13 | OBR t.31 |
| Legionista    | ATA t.2 | ATA t.2 | ATA t.2 | ATA t.2 | ATA t.4 | ATA t.6 | – | ATA t.7 | ATA t.12 | ATA t.7 | ATA t.40 |
| Konnica       | ATA t.1 | ATA t.1 | ATA t.1 | ATA t.2 | ATA t.4 | ATA t.6 | OBR t.8 | – | ATA t.13 | ATA t.8 | OBR t.46 |
| Włócznik      | ATA t.3 | ATA t.3 | ATA t.3 | ATA t.6 | ATA t.13 | ATA t.23 | OBR t.14 | OBR t.16 | – | ATA t.26 | OBR t.171 |
| Rydwan (woły) | ATA t.2 | ATA t.2 | ATA t.2 | ATA t.3 | ATA t.7 | ATA t.10 | OBR t.8 | OBR t.9 | OBR t.28 | – | OBR t.35 |
| Falanga       | ATA t.3 | ATA t.3 | ATA t.3 | ATA t.7 | ATA t.15 | ATA t.26 | OBR t.45 | ATA t.40 | ATA t.153 | ATA t.31 | – |

---

## Ranking

| # | Jednostka         | Score | W-ATK | W-DEF | Remis | Porażki | Śr. runda wygranej | Flaga     |
|---|-------------------|------:|------:|------:|------:|--------:|-------------------:|-----------|
| 1 | Legionista        |    30 |    10 |    10 |     0 |       0 |                8.4 | 🔴 OP     |
| 2 | Falanga           |    27 |     9 |     9 |     0 |       1 |               31.2 | 🔴 OP     |
| 3 | Konnica           |    24 |     8 |     8 |     0 |       2 |                4.5 |           |
| 4 | Włócznik          |    21 |     7 |     7 |     0 |       3 |               11.0 |           |
| 5 | Rydwan (woły)     |    18 |     6 |     6 |     0 |       4 |                4.3 |           |
| 6 | Wojownik z brązu  |    15 |     5 |     5 |     0 |       5 |                4.6 |           |
| 7 | Wojownik          |    12 |     4 |     4 |     0 |       6 |                6.0 | 🔵 SŁABA  |
| 8 | Łucznik           |     9 |     3 |     3 |     0 |       7 |                7.0 | 🔵 SŁABA  |
| 9 | Osadnik           |     0 |     0 |     0 |     2 |       8 |               999  | CYWIL     |
|10 | Robotnik          |     0 |     0 |     0 |     2 |       8 |               999  | CYWIL     |
|11 | Zwiadowca         |     0 |     0 |     0 |     2 |       8 |               999  | CYWIL     |

---

## Flagi balansowe

### 🔴 OP – jednostki zbyt dominujące

**Legionista (score=30, 0 porażek)**
- Jedyna jednostka wygrywająca WSZYSTKIE pojedynki bojowe.
- Natura problemu: kombinacja najwyższego Ataku (88), Pancerza (90) i Obrażeń (100) czyni go praktycznie bez kontrpozycji w epoce.
- Ocena: częściowo intencjonalne (elita epoki brązu = drogie), ale brak hard countera jest ryzykiem dla balansu ekonomicznego.

**Falanga (score=27, 1 porażka – tylko Legionista)**
- Wygrywa Konnicę (ATA t.40) i Rydwan (ATA t.31) jako tank z wysoką Obroną.
- Przegrywa tylko z Legionistą (OBR t.45 – bardzo długa walka, ~45 rund).
- Natura problemu: zbyt wysoka Obrona (100) w połączeniu z Health=100 czyni ją prawie niepokonalną przez niższe jednostki.

### 🔵 SŁABE – jednostki niedostatecznie silne

**Wojownik (score=12)**
- Przegrywa z wszystkimi jednostkami brązowymi. Jako jednostka kamienna to OK, ale warto sprawdzić koszt relatywny.
- Sugestia: rozważyć specjalizację (np. bonus w terenie, obrona osady), by miał niszową rolę.

**Łucznik (score=9)**
- Najsłabsza jednostka bojowa. Traci ze wszystkim w zwarciu, co jest zgodne z projektem.
- WAŻNE: model nie ma jeszcze mechaniki dystansowej – Łucznik powinien bić z zasięgu PRZED starciem, co dramatycznie zmieni jego wartość.

---

## Propozycje korekt

### Priorytet 1 – Legionista (OP, brak kontrpozycji)
**Problem:** Wygrywa WSZYSTKO. Koszt produkcji musi być prohibicyjnie wysoki, lub…  
**Korekta A (statystyczna):** Zmniejszyć Atak 88→80. Wtedy Konnica (Uderzenie=100 w rundzie 1) może zagrozić.  
**Korekta B (mechaniczna):** Dodać bonus Włócznika vs Legionista: Obrona Włócznika +20 gdy broni się przed piechotą ciężką → Włócznik staje się hard counterem.  
**Preferowana:** Korekta B – zachowuje charakter jednostki bez naruszania skali.

### Priorytet 2 – Falanga vs Włócznik (153/171 rund)
**Problem:** Dwie jednostki wysokiej obrony walczą przez 150+ rund — prawie remis, model "ugrzązł".  
**Korekta:** Zwiększyć Atak Falangi 48→55 LUB zmniejszyć Health Włócznika 65→55.  
Opcja B (Health Włócznika 65→55) lepiej — Włócznik jest szybszy (mniej masywny) niż Falanga.  
Po korekcie: Falanga wygra w ~80 rundach, co jest realistyczne.

### Priorytet 3 – Łucznik (rola dystansowa)
**Problem:** Bez mechaniki zasięgu Łucznik jest bezużyteczny w modelu melee.  
**Korekta (krótkoterminowa):** Dodać pre-battle salwę: Łucznik zadaje 1 rundę obrażeń ZANIM wróg się zbliży, gdy DEFENDER atakuje Łucznika.  
Implementacja: `if rnd==1 and defender==Łucznik: łucznik strzela jako pierwszy`.  
**Korekta (długoterminowa):** Mechanika zasięgu z osobnym traktem walki.

### Priorytet 4 – Konnica vs Falanga (ATA t.40 / OBR t.46)
**Ocena:** Poprawna dynamika! Konnica nie może sforsować Falangi na wprost (co jest historycznie właściwe), ale walka trwa 40-46 rund — przy determinizmie to "powolna" wygrana Falangi.  
**Bez korekty** – zachować jako element systemu kontr-jednostek.

### Priorytet 5 – Rydwan (woły) vs Włócznik (OBR t.28)
**Ocena:** Poprawne – Włócznik odpiera szarżę rydwanu. OBR t.28 = Włócznik wygrywa jako obrońca.  
**Bez korekty** – dobre counter-play.

---

## System kontr-jednostek (po analizie)

```
Legionista ──beats──► WSZYSCY  (problem: brak countera)
Falanga ──beats──► Konnica, Rydwan, Włócznik
Konnica ──beats──► Wojownicy, Łucznik, Rydwan
Włócznik ──beats──► Konnica (jako obrońca), Rydwan, Wojownicy
Rydwan ──beats──► Wojownicy, Łucznik
Wojownik z brązu ──beats──► Wojownik, Łucznik, Cywile
```

**Proponowany zdrowy system tri-counter (do wdrożenia po korekcie Legionistaów):**
```
Legionista ←pokonuje← Konnica (po korekcie Ataku Legionistaów)
Konnica ←pokonuje← Włócznik (już działa)
Włócznik ←pokonuje← Legionista (po dodaniu bonusu vs ciężka piechota)
```

---

## Uwagi techniczne

- **dmg_scale=/10**: kluczowy parametr. Przy /5 bitwy trwają 2-8 rund (za szybko). Przy /15 — 20-80 rund (realistycznie). Wartość /10 daje 4-45 rund dla typowych par bojowych.
- **Cywile (Obrażenia=0)**: zawsze remis między sobą (zdeterminowane przez brak dmg), zawsze przegrywają z bojownikami — celowe.
- **Deterministyczny model (wartość oczekiwana)**: brak losowości oznacza, że ta sama para ZAWSZE ma ten sam wynik. Dla gry z mechaniką napięcia rozważyć dodanie ±15% losowości do dmg_scale.
- **Przyszłe epoki**: Atak max=88, Morale max=85 — zostawia przestrzeń do skalowania bez naruszania zasady "=100".

---

*Plik generowany przez skrypt Python | model v2.0 | 2026-06-20*
