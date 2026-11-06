# Emporion

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `emporion` |
| **tytuł** | Emporion |
| **kategoria** | Miasto — budowa |
| **poradnik_ref** | `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` |
| **json_ref** | `buildings.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Emporion** — budynek (Pieniądz), epoka Brąz. Koszt budowy **50** pracy, utrzymanie **2** ¤/t. Technologia **Handel**. Wymaga **Targowiska w tym samym mieście**. Maks. 1 poziom. Daje **8 ¤** na turę, daje dodatkowy slot linii handlowej i kwalifikuje trasę do premii **5%** handlu.

---

## Wiki‑M

### Co robi
Emporion to większy odpowiednik Targowiska, ośrodek handlu dalekosiężnego:

| Poziom | Pieniądz/t |
|--------|------------|
| 1 (Emporion) | **+8** |

- **Dodatkowa linia handlowa:** Emporion daje miastu o **jeden slot** więcej na trasy handlowe. Razem z Targowiskiem miasto ma dwa sloty wymiany (plus slot bazowy na trasę istnienia).
- **Premia 5%:** trasa handlowa miasta, która dostaje kwalifikację z Emporionem, otrzymuje premię **5%** do dochodu z tej trasy. Premia jest liczona **za trasę**, a nie za każdy budynek, więc Emporion nie dubluje stawki na tej samej trasie.
- Emporion nie daje osobnej premii procentowej do dochodu z tras, jaką ma Targowisko dla swojego miasta.

### Koszty
- **Budowa:** 50 pracy + 80× drewno + 60× kamień
- **Utrzymanie:** 2 ¤/turę
- Technologia **Handel**; w mieście musi stać **Targowisko**

### Strategia gracza
Emporion ma sens w mieście z już działającym Targowiskiem i kilkoma trasami handlowymi, których nie da się obsłużyć dwoma slotami. Przy samym Targowisku miasto ma mniej slotów niż tras do obsadzenia.

### Typowe błędy
- Budowanie Emporionu bez Targowiska w mieście: budynek jest wtedy niedostępny na liście budowy.
- Oczekiwanie dwóch osobnych premii 5% na jednej trasie: premia jest jedna, na trasę.

**Powiązane:** Targowisko · Handel · Pieniądz · Port handlowy

---

## Przykład liczbowy

**Scenariusz:** miasto z Targowiskiem i Emporionem, utrzymanie Emporionu 2 ¤/t.

- Przyrost: **+8 ¤/t** → netto **+6 ¤/t**
- Koszt 50 pracy przy 10/t ≈ **5 tur**

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`

---

## Historia / decyzje

R-WEB-BUILDING-EMPORION-Q1 (decyzja właściciela 2026-11-05): nowy budynek handlowy, badanie Handel, wymaga Targowiska w tym samym mieście, +1 slot linii handlowej, kwalifikacja do premii 5% per trasa.

---

## Rys historyczny

Emporion to rozległy ośrodek handlu dalekosiężnego, do którego sprowadzano towary z odległych krain. W greckich miastach-portach, takich jak Naukratis w Egipcie, obcy kupcy mieli wyznaczone dzielnice i składy, a wymiana odbywała się pod nadzorem urzędników. Emporion łączył funkcję składu, kantoru i miejsca spotkań kupców z różnych ludów, a jego działalność pozwalała miastu zdobywać surowce i wyroby niedostępne w okolicy. Dzięki sieci takich ośrodków antyczne miasta budowały bogactwo i kontakty sięgające daleko poza własny horyzont.
