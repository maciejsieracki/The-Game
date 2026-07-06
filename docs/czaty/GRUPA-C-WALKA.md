# Charter — Grupa C — Walka

> **Zakładka Cursor:** `Grupa C — Walka`  
> **Ten czat = od momentu wyboru Auto lub Bitwa ręczna** → pole bitwy 3D (C2) → reguły walki (C4).  
> **NIE ten czat:** mapa strategiczna, ruch, oblężenie (C3), **preBattle (C1)** → **Grupa A**.  
> Granica: `docs/grupa-c/GRANICA-C-vs-MAPA.md`  
> Obowiązuje: `docs/decyzje/DYSPOZYCJA-STALA.md` + ten plik.

---

## Punkt startu (Maciej 2026-06-27 — korekta)

**Walka zaczyna się, gdy gracz na preBattle wybiera walkę automatyczną lub ręczną** — wtedy startuje **C2** (scena bitwy).

**Pre-battle (C1), ruch, oblężenie (C3-Q1…Q10)** = **Grupa A (mapa świata)** — **nie ten czat**.

---

## Zakres tego czatu

| ID | Co |
|----|-----|
| **C2** | UX pola bitwy 3D (minimapa, roster, TW FX…) |
| **C4** | Reguły **w walce** (posiłki D8 w bitwie, balans sceny, katapulta w bitwie…) |

| **NIE ten czat** | **C1 preBattle**, **C3** oblężenie, ruch na mapie → **Grupa A** |

**Moduły:** `combat.ts`, `battle/*`, `siege.ts`, `manualBattle.ts` · **Hub:** `docs/grupa-c/README.md`

---

## Warstwy

```
GRUPA A (mapa świata)
├── ruch jednostek, A2, A3
├── oblężenie C3 (Q1…Q10)
└── preBattle C1 (Auto / Ręczna / Wycofaj, skład)
         │
         │  wybór: Auto LUB Ręczna
         ▼
C2 pole bitwy 3D + C4 w walce         → TEN czat  ◄── START
```

Kanon: `docs/grupa-c/GRANICA-C-vs-MAPA.md`

---

## Prefiks pytań

`C2-Q…`, `C4-Q…` · Ekran: **`[EKRAN: Mapa bitwy]`**

**Nie pytaj:** C3-Q*, C1 (preBattle), A1, A2 — Grupa A.

---

## Przepływ (obowiązkowy)

`docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md` · Maciej: **`działaj`** → **`przekaż do Mastera`**
