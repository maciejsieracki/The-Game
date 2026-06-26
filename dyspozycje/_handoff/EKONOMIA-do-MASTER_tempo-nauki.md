# EKONOMIA → MASTER → CYWILIZACJE : referencja "tempo nauki"

Data: 2026-06-25 | Od: **EKONOMIA** | Dla: **CYWILIZACJE** (przez mastera) | Status: **HANDOFF**

---

## 1. Wzór nauki / turę — miasto

```
Nauka_miasta = floor(
  (floor(Handel_netto × %Nauka) + Nauka_budynkow)
  × (maBiblioteka ? (1 + bonus_biblioteki) : 1)
)
```

### Składniki krok po kroku

| Składnik | Skąd pochodzi | Wartość domyślna (normal) |
|---|---|---|
| **Handel_brutto** | Σ Handel z obrabianych pól (centrum + 6 sąsiadów); ×1.5 jeśli Targowisko | zależy od terenu |
| **Handel_netto** | `Handel_brutto × (1 − strata_korupcja)` | strata=0 dla stolicy; dla miast odległych: `min(50%, dystans×2 + liczbaMiast×1)` |
| **%Nauka (suwak)** | `podziałHandlu.procentNauka / 100` | **60%** (`suwak_handel_nauka_domyslnie`) |
| **naukaZHandlu** | `floor(Handel_netto × %Nauka)` | główny strumień |
| **Nauka_budynkow** | Σ `buildingValue(b, level, 'nauka')` dla budynków miasta | 0 (brak budynków) |
| **bonus_biblioteki** | `budynek_biblioteka_bonus_nauki` | **0.5** (normal), tj. ×1.5 |

### Wartości terenu (Handel/pole — hardcoded w economy.ts)

| Teren | Handel bazowy/turę |
|---|---|
| Łąka | 1 |
| Równina | 1 |
| Wzgórza | 0 |
| Góry | 0 |
| Wybrzeże | 2 |
| Morze | 2 |
| Pustynia | 1 |
| + Rzeka (nakładka) | +2 |
| + Las (nakładka) | −1 |

Centrum miasta obrabia: **własny heks + max 6 sąsiadów** (workedTilesForCity).
Typowe miasto = 7 pól, ale część może być niedostępna (brzeg mapy, brak heksu).

---

## 2. Rzędy wielkości — wczesna gra (epoka Kamień)

**Założenia bazowe:** korupcja ≈ 0 (stolica lub 1 miasto), brak Targowiska, brak Biblioteki, suwak Nauka = domyślne 60%.

### Handel_brutto — skrajne scenariusze terenu

- **Słabe miasto** (4–5 obrobionych pól, teren lądowy bez rzek, mix Łąka/Równina/Wzgórza): Handel_brutto ≈ **3–4**
- **Przeciętne miasto** (6–7 pól, mix z Wybrzeżem lub Rzeką): Handel_brutto ≈ **5–8**
- **Bogate miasto** (7 pól, Wybrzeże + Rzeki): Handel_brutto ≈ **9–14**

### Tabela: Nauka/turę [PT — zależy od terenu i suwaka]

| Scenariusz | Handel_brutto/miasto | Nauka/miasto | 1 miasto | 3 miasta | 5 miast |
|---|---|---|---|---|---|
| Słabe tereny, %Nauka=60% | 3–4 | floor(3–4 × 0.6) = **1–2** | 1–2 | 3–6 | 5–10 |
| Przeciętne tereny, %Nauka=60% | 5–8 | floor(5–8 × 0.6) = **3–4** | 3–4 | 9–12 | 15–20 |
| Dobre tereny, %Nauka=60% | 9–14 | floor(9–14 × 0.6) = **5–8** | 5–8 | 15–24 | 25–40 |
| Przeciętne tereny, %Nauka=100% | 5–8 | floor(5–8 × 1.0) = **5–8** | 5–8 | 15–24 | 25–40 |
| Przeciętne + Biblioteka (×1.5), 60% | 5–8 | floor(3–4 × 1.5) = **4–6** | 4–6 | 12–18 | 20–30 |
| Przeciętne + Biblioteka, 100% | 5–8 | floor(5–8 × 1.5) = **7–12** | 7–12 | 21–36 | 35–60 |

> **[PT]** — wszystkie liczby do strojenia. Główne dźwignie: terrain (×2–4 różnica), suwak %Nauka, Biblioteka (×1.5), Targowisko (+50% handlu → proporcjonalnie więcej nauki).

### Szybkie widelki dla CYWILIZACJE (zapamiętywalne)

- **Wczesna gra (1–3 miasta, brak budynków nauki):** ~2–15 Nauki/turę globalnie
- **Średnia gra (3–5 miast, Biblioteki):** ~15–60 Nauki/turę globalnie
- **Wpływ Biblioteki:** mnożnik ×1.5 na całą naukę miasta (handel + budynki)
- **Wpływ suwaka na 100%:** +~67% nauki vs domyślne 60% (kosztem Pieniądza/Luksusu)

---

## 3. Globalny mnożnik tempa nauki — czy istnieje?

**NIE istnieje.** Przeszukano:
- `economy.ts` — funkcja `cityYieldPerTurn`: nauka per miasto, mnożnik Biblioteki działa tylko lokalnie
- `turn-economy.ts` — funkcja `advanceCityEconomy`: `totalNauka = Σ yld.nauka` per miasto — prosta suma, brak globalnego współczynnika

### Rekomendacja: gdzie go dodać (dla CYWILIZACJE, gdyby chcieli stroić)

**Opcja A — param w `econ-params.json` (najprostsza):**
```json
"globalne": {
  "nauka_tempo_mnoznik": {
    "easy": 1.2,
    "normal": 1.0,
    "hard": 0.8,
    "jednostka": "×",
    "opis": "Globalny mnożnik całkowitej nauki gracza/turę. [PT]"
  }
}
```

**Opcja B — hook w `turn-economy.ts` przy agregacji `totalNauka`:**
```typescript
// W advanceCityEconomy, po pętli per-miasto, przed return:
const naukaMnoznik = /* czytaj z params lub z GameData */ 1.0;
result.totalNauka = Math.floor(result.totalNauka * naukaMnoznik);
```

Opcja A + B razem: param w JSON, odczyt w `buildEconParams`, zastosowanie w `advanceCityEconomy` przy finalizacji `totalNauka`. Nie rusza logiki per-miasto.

---

## Ścieżki kodu (do weryfikacji przez CYWILIZACJE)

- `gra/src/game/economy.ts` — linia ~471: `naukaZHandlu = floor(handelNetto × pctNauka)`; linia ~479: `naukaLokalna = floor((naukaZHandlu + naukaBudynkow) × naukaBonusFactor)`
- `gra/src/game/turn-economy.ts` — linia ~373: `result.totalNauka += yld.nauka` (prosta suma, brak mnożnika)
- `gra/data/econ-params.json` — sekcja `budynki.budynek_biblioteka_bonus_nauki` = 0.5 (normal); sekcja `ekonomia_miasta.suwak_handel_nauka_domyslnie` = 60

