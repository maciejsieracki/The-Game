# Szczęście

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `szczescie` |
| **tytuł** | Szczęście |
| **kategoria** | Miasto i społeczeństwo |
| **poradnik_ref** | Część VI §35 |
| **decyzja_ref** | `B2-model-szczescie-procent.md` |
| **json_ref** | `society-params.json` |
| **status_v1** | ✅ |

---

## Wiki‑S

**Szczęście** to procent zadowolenia w **jednym mieści** — wynik sumy plusów i minusów dzielonej przez maksimum epoki (Kamień 12 · Brąz 18 · Żelazo 24 pkt). Trzy ikony uśmiechów to tylko obrazek tego procentu, nie licznik ludzi.

---

## Wiki‑M

### Jak liczy gra (normal)

1. **Maksimum epoki** (SzMax): Kamień **12** · Brąz **18** · Żelazo **24** pkt.
2. **Plusy** — suma punktów (świątynia, teatr, luksus, niskie podatki, własna religia/kultura, Osiedle…).
3. **Minusy** — suma kar (wojna, zagęszczenie, obca kultura/religia, wysokie podatki…).
4. **Netto** = plusy − minusy (nie mniej niż 0).
5. **Szczęście %** = zaokr. (100 × netto ÷ SzMax), cap **120%**.

Pełna rozpiska jest w panelu **Miasto** — każda linia to jeden czynnik z JSON.

### Plusy (normal — skrót)

| Czynnik | Pkt |
|---------|-----|
| Świątynia | +1 |
| Teatr / amfiteatr | +1 |
| Luksus (co 5 jedn. w puli) | +1 |
| Zamożność w handlu ≥30/40/50/60/70% | +1…+5 |
| Własna religia ≥50% | +2 |
| Własna kultura ≥80% | +1 |
| Osiedle pop 1→4 | +3/+2/+1/0 |

### Minusy (normal)

| Czynnik | Pkt |
|---------|-----|
| Wojna | −3 |
| Zagęszczenie (pop − próg 4) | −1 × nadmiar |
| Obca kultura dominuje | −1 |
| Obca religia | −2 |
| Wysokie podatki (poziom) | −1 × poziom |

### Strategia

- Podbój → obniż podatki (więcej **zamożności** w suwaku handlu) + świątynia.
- Przed pop 5 → Akwedukt / teatr, inaczej zagęszczenie −1.
- Wojna −3 we **wszystkich** miastach — licz to w planie ekspansji.

**Powiązane:** [[Porządek]] · [[Suwak handlu]] · [[Bunt]]

---

## Przykład liczbowy

**Miasto:** epoka **Brąz** (SzMax = **18**), populacja **5**, trudność **normal**, **wojna** trwa.

| Składnik | Pkt |
|----------|-----|
| Świątynia | +1 |
| Osiedle (pop 5 → brak bonusu Osiedle) | 0 |
| Bonus zamożność 40% w handlu | +2 |
| **Wojna** | **−3** |
| Zagęszczenie (5 − próg 4) × −1 | **−1** |
| **Netto** | 1 + 2 − 3 − 1 = **−1** → traktowane jako **0** |

**Szczęście = 100 × 0 ÷ 18 = 0%** (bardzo niskie — dominują niezadowoleni na ikonach).

**Co zrobić:** podnieś zamożność do **50%** (+3 zamiast +2) → netto 0; zbuduj **Teatr** (+1) → netto **+1** → **100×1/18 ≈ 6%**. Zakończ wojna (+3 netto) → netto **+4** → **22%**. Garnizon (+prawo) podniesie **porządek** (osobna liczba).

**Drugi przykład (spokojne miasto):** Brąz, pop **3**, Osiedle **+2**, świątynia **+1**, brak kar → netto **+3** → **100×3/18 ≈ 17%**. To wciąż nisko — dodaj niskie podatki i teatr, cel **≥50%** (netto ≥9 pkt).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/06-miasto-spoleczenstwo.md` §35

---

## Historia / decyzje

Decyzja **1C + 2A** (2026-06-27): model procentowy z pełną rozpiską.
