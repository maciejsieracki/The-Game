# PYTANIE-85 — Nowy model żywności i wzrostu ludności

**Status:** 🔵 W TRAKCIE (wdrożenie 2026-07-27)  
**Data rozpoczęcia:** 2026-07-27  
**Kontekst:** Centralny magazyn żywności, racje 1/2/3, wzrost %, Spichlerz centralny (UI), lokalny bilans miasta.

## Decyzje Macieja

### PYTANIE-85-Q1 — Deficyt przy pustej centrali
**Odpowiedź: A** (2026-07-27)  
Gdy magazyn centralny nie pokrywa importu miasta na minusie: **brak wzrostu** w tej turze; po N turach deficytu **−1 ludność** (min. 1). Parametr N — do ustalenia (paczka 3).

### PYTANIE-85-Q2 — Kolejność przy niedoborze w centrali
**Odpowiedź: A** (2026-07-27)  
Najpierw **dopłaty do miast** (pokrycie bilansów ujemnych), potem **wojsko**, potem zmiana stanu magazynu.

### PYTANIE-85-Q3 — Boost wzrostu z nadwyżki centralnej
**Odpowiedź: A** (2026-07-27)  
Centrala **tylko logistyka**: pokrywa minusy miast + wojsko. **Bez** dodatkowego % wzrostu z nadwyżki centralnej. Wzrost % wyłącznie z racji i bonusów lokalnych/imperium (Szczęście, Zdrowie, Spichlerz, cywilizacja).

### PYTANIE-85-Q4 — Spichlerz bez surowca w turze
**Odpowiedź: A** (2026-07-27)  
Brak opłaconego drainu = **0% wzrostu** ze Spichlerza. Tier II z samą Ceramiką (bez Soli) = **+1%** jak tier I. Pełny II (oba surowce) = **+2%**.

### PYTANIE-85-Q5 — Bonus wzrostu cywilizacji (`lud_wzrost_proc`)
**Odpowiedź: A** (2026-07-27)  
**Addytywnie** do WZROST%: `+0,05` → **+5 p.p.** w panelu (np. racje 5% + cywilizacja 5% = 10%).

### PYTANIE-85-Q6 — Cap magazynu centralnego żywności
**Odpowiedź: A + dopisek Macieja** (2026-07-27)  
Jedna pula centralna z bazowym capem (**500 🍞** + rozszerzenia budynkiem Magazyn jak surowce). **Każdy Spichlerz lokalny** zwiększa cap puli: **+100** (tier I) lub **+150** (tier II) — sumowane po imperium.

---

## Model roboczy (niezatwierdzony w całości)

- Lokalnie: produkcja − racje = bilans miasta (+/−).
- Nadwyżki → centrala; niedobory ← centrala.
- Wzrost: `ludność × WZROST% / 100` (ułamki kumulują się).
- UI: Spichlerz centralny (podsumowanie + tabela miast); batony racji 1/2/3 w panelu miasta.

### PYTANIE-85-Q6 — Cap magazynu centralnego żywności
**Odpowiedź: A + dopisek Macieja** (2026-07-27)  
Jedna pula centralna z bazowym capem (**500 🍞** + rozszerzenia budynkiem Magazyn jak surowce). **Każdy Spichlerz lokalny** zwiększa cap puli: **+100** (tier I) lub **+150** (tier II) — sumowane po imperium.

### PYTANIE-85-Q7 — Ubytek ludności przy deficycie centrali
**Odpowiedź: C** (2026-07-27)  
**1 tura** bez dopłaty z centrali (miasto na minusie, magazyn nie pokrywa) → **−1 ludność** (min. 1). Wzrost w tej turze = 0 (z Q1).

### PYTANIE-85-Q8 — Górny limit łącznego WZROST%
**Odpowiedź: A** (2026-07-27)  
**Brak capa** — wszystkie składniki sumują się w pełni.

### PYTANIE-85-Q9 — Łaźnia publiczna a wzrost
**Odpowiedź: A** (2026-07-27)  
Budynki zdrowia (w tym Łaźnia) dają **pkt Zdrowia**; wzrost tylko przez regułę `floor(Zdrowie ÷ 10) × 1%`. Konkretna wartość Łaźni — przy kalibracji `society-params`.

### Głód wojska — osłabienie w walce (PYTANIE-85)
Gdy zapasy państwa < 0 po koszcie armii (`glodWojska`), jednostki wojskowe walczą przy **75% wszystkich parametrów bojowych oprócz armor** (mnożnik `glod_wojska_stat_mult` w `econ-params.json`). To osobny etap przed atrycją HP (`isArmyStarving`, po karencji).

---

## Podsumowanie kanonu (9/9)

| ID | Temat | Decyzja |
|----|-------|---------|
| Q1 | Deficyt, pusta centrala | Głód: brak wzrostu |
| Q2 | Kolejność centrali | Miasta → wojsko |
| Q3 | Boost wzrostu z centrali | Nie — tylko logistyka |
| Q4 | Spichlerz bez surowca | 0% (II+Ceramika = +1%) |
| Q5 | Cywilizacja | Addytywnie do WZROST% |
| Q6 | Cap magazynu | 500 + Magazyn + Spichlerz +100/+150 |
| Q7 | Ubytek przy głodzie | **1 tura** → −1 ludność |
| Q8 | Soft cap wzrostu | Brak |
| Q9 | Łaźnia | Przez pkt Zdrowia |

## Copy UI — Spichlerz centralny (podsumowanie tury)

Kanon etykiet (Maciej 2026-07-27):

| Etykieta w grze | Znaczenie techniczne |
|-----------------|---------------------|
| **Uprawa i hodowla** | Suma produkcji żywności ze wszystkich miast |
| **Wyżywienie ludności** | Zużycie na racje 1/2/3 (wszystkie miasta) |
| **Nadwyżka** | Produkcja − wyżywienie (saldo po nakarmieniu) |
| **Pomoc miastom** | Dopłaty z magazynu do miast na minusie |
| **Spichlerz stolicy** | Pula po pomocy miastom (przed wojskiem) |
| **Wojsko** | Koszt żywności armii z centrali |
| **Przyrost zapasów** | Zmiana stanu magazynu centralnego w tej turze |

Przykład liczbowy:

```
Uprawa i hodowla        +72 🍞
Wyżywienie ludności     −48 🍞
Nadwyżka                +24 🍞
Pomoc miastom           −16 🍞
Spichlerz stolicy        +8 🍞
Wojsko                   −5 🍞
Przyrost zapasów         +3 🍞
```

Nagłówek stanu: **„W magazynie: 127 / 500 🍞”** (+ rozszerzenia Spichlerzów lokalnych +100/+150).

## Otwarte (kalibracja liczb, nie ABC)

- Wartość pkt Zdrowia z Łaźni publicznej
- Racje 3/5/7% i bonus małego miasta — strojenie
- Koszt wojska z centrali (1 🍞/jedn./t?)
