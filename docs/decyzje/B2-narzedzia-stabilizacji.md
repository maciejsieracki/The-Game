# B2 — Narzędzia stabilizacji miasta (podatki, wojsko, budynki)

| Pole | Wartość |
|------|---------|
| **Decyzja Macieja** | 2026-06-27 (w ramach B2-Q12 + model Sz/Prawo) |
| **Status** | **ZAMKNIĘTE** — wdrożenie EKONOMIA + UI + Excel |
| **Powiązane** | `B2-model-szczescie-procent.md`, `B2-porzadek-model.md`, B3 suwaki, B4 Wealth |

---

## Trzy horyzonty (jak myśli gracz)

| Horyzont | Narzędzie | Składnik | Efekt |
|----------|-----------|----------|--------|
| **Natychmiast** | Suwak Handlu → więcej **Luksus / Wealth** | **Szczęście ↑** | Obniż „podatki na rozwój”, ludzie szczęśliwsi |
| **Natychmiast** | **Wojsko w mieście** (garnizon) | **Prawo ↑** (do **100%**) | Tłumienie buntu administracją siły — **nie** duży bonus Sz |
| **Długotermin** | Budynki | Sz + Wealth | Trwała baza Porządku |

Komunikat B2-Q12 ma **nazywać obie dźwignie** (podatki/Wealth vs wojsko).

---

## 1. Bonus Szczęścia od udziału Wealth (Luksus %)

**Wejście:** `city.podzialHandlu.procentLuksus` (suwak Handlu, B3).

**Zasada:** im **wyższy** udział Luksusu (mniej na Naukę i rozwój), tym **wyższy plus** do Szczęścia. Domyślnie 10% Luksus = brak bonusu.

| procentLuksus ≥ | Bonus do Netto Sz (+pkt) | Opis w panelu |
|-----------------|--------------------------|---------------|
| **30%** | **+1** | Niskie podatki / więcej Wealth — delikatny spokój |
| **40%** | **+2** | Umiarkowanie niskie podatki |
| **50%** | **+3** | Niskie podatki |
| **60%** | **+4** | Bardzo niskie podatki |
| **70%** | **+5** | Maksymalny bonus (cap) |

**Kompensata:** istniejąca kara `szczescie_kara_wysokie_podatki` zostaje dla **niskiego** Luksusu / wysokiej Nauki — gracz **płaci** wolniejszą nauką za spokój.

Klucze JSON (propozycja):

```json
"szczescie_bonus_luksus_30": { "normal": 1 },
"szczescie_bonus_luksus_40": { "normal": 2 },
"szczescie_bonus_luksus_50": { "normal": 3 },
"szczescie_bonus_luksus_60": { "normal": 4 },
"szczescie_bonus_luksus_70": { "normal": 5 }
```

W rozpisce Szczęścia: wiersz **„Niskie podatki (Luksus 40%)” +2**.

---

## 2. Wojsko → Prawo (silne, do 100%)

**Nie** podnosi znacząco Szczęścia — podnosi **PrawPct**.

| Źródło | Wpływ na Prawo (normal, draft) |
|--------|--------------------------------|
| **1 jednostka** w mieście | **+20 pkt** PrawNetto |
| **2 jednostki** | +40 |
| **3 jednostki** | +60 |
| **4 jednostki** | +80 |
| **5+ jednostek** | **+100 pkt** → **PrawPct = 100%** (cap) |

Dodatkowo stałe: Ratusz, Pretorium, Sąd (patrz `B2-porzadek-model.md`).

**Panel Prawo:** wiersz „Garnizon (3 jedn.) +60”.

*Balans:* utrzymanie wojska kosztuje — gracz nie trzyma armii w mieście „za darmo”.

Klucze: `prawo_garnizon_per_jednostka`, `prawo_garnizon_cap_jednostek` (=5).

---

## 3. Budynki — Szczęście (już w JSON)

| Budynek | zadowolenie (przyrost) | Rola |
|---------|------------------------|------|
| **Teatr** | +3 / +1 | rozrywka, główny booster Sz |
| **Łaźnia publiczna** | +3 / +1 | komfort |
| **Świątynia** | +2 / +1 | wiara |
| **Sąd** | +2 / +1 | też **Prawo** (administracja) |
| **Studnia / Łaźnie** | +1 / +1 | zdrowie publiczne |
| **Pałac** | +1 / +1 | prestiż |
| **Pretorium** | +1 / +1 | admin + **Prawo** |
| **Lazaret** | +1 / +1 | zdrowie |

---

## 4. Budynki — wzmocnienie Wealth (propozycja v1.0)

Obecnie Wealth rośnie z **puli Luksusu** (D3=A) + budynki dają głównie `pieniadz`/`nauka`. **Propozycja** dopisać w `buildings.json` pole `przyrost.luksus` lub `przyrost.wealthPula` (lane CYWILIZACJE + Excel):

| Budynek | luksus / wealth (prop.) | Uzasadnienie |
|---------|-------------------------|--------------|
| **Pałac** | **+2** luksus | prestiż, dwór |
| **Port handlowy** | **+2** | luksus importowany |
| **Karawanseraj** | **+2** | handel luksusowy |
| **Targowisko** | **+1** | dobrobyt miejski |
| **Teatr** | **+1** | oprócz Sz — kultura luksusu |
| **Łaźnia publiczna** | **+1** | komfort = wealth feel |
| **Stela / Pomnik** | **+1** | prestiż |
| **Świątynia** | **+1** | datki, ozdoby sakralne |

**Priorytet budowy przy kryzysie:** Pałac / Teatr / Targowisko (Sz+Wealth), potem garnizon (Prawo).

Excel: kolumna `przyrost.luksus` w arkuszu Budynki — **eksport targeted** (`export-budynki.py`).

---

## UI — podpowiedź w panelu Porządek

Gdy tier ≥ Niepokój, sekcja Porządek pokazuje skrót:

```
Szybkie działania: [Obniż podatki ↗ Luksus] · [Garnizon → Prawo]
Długoterminowo: Teatr, Pałac, Świątynia…
```

---

## Implementacja

| Lane | Plik |
|------|------|
| EKONOMIA | `computeHappinessBreakdown` — bonus luksus % |
| EKONOMIA | `computeLawBreakdown` — garnizon skala do 100% |
| CYWILIZACJE | `buildings.json` — `przyrost.luksus` (po akceptacji liczb w Excel) |
| UI | wiersze rozpiski + podpowiedź Porządek |

---

## Historia

| Data | Zdarzenie |
|------|-----------|
| 2026-06-27 | Maciej: bonus Sz od Luksus 30–70%; wojsko → Prawo do 100%; lista budynków Wealth |
