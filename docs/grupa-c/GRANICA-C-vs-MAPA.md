# Grupa A vs Grupa C — granica zakresu (decyzja Macieja)

**Data:** 2026-06-27 · **Status:** **KANON** — decyzja Macieja, nadpisuje wcześniejsze „C1 = Grupa C"

---

## Kanon (diagram Macieja)

```
GRUPA A (mapa świata — ten czat)
├── ruch jednostek, A2, A3
├── oblężenie C3 (Q1…Q10)
└── preBattle C1 (Auto / Ręczna / Wycofaj, skład)
         │
         │  wybór: Auto LUB Ręczna
         ▼
GRUPA C (Walka — osobny czat)
├── C2 — pole bitwy 3D
└── C4 — reguły w trakcie walki
```

---

## Zasada (jedno zdanie)

**Grupa A** = mapa strategiczna, ruch (A2, A3), **C3 oblężenie**, **C1 preBattle** — do momentu wyboru **Auto** lub **Ręczna**.

**Grupa C** = **od tego wyboru** — **C2** (pole bitwy 3D) + **C4** (reguły w walce).

---

## Tabela zakresów

| Temat | Maciej decyduje w | Implementacja |
|-------|-------------------|---------------|
| Ruch, jednostka na heksie (A2, A3) | **Grupa A** | MAPA, UI, UNITS |
| **C3** oblężenie na mapie (Q1…Q10) | **Grupa A** | MAPA, UI, EKONOMIA, UNITS, SILNIK |
| **C1 preBattle** (plansza przed walką) | **Grupa A** | UI, SILNIK |
| **C2** pole bitwy 3D | **Grupa C** | UNITS, UI |
| **C4** reguły **w bitwie** | **Grupa C** | UNITS |

---

## Pytania ABC — routing do Macieja

| Paczka | Gdzie zadajesz Maciejowi |
|--------|--------------------------|
| C3-Q1…Q10 | **Grupa A** (`[EKRAN: Mapa świata]`) |
| C1 (preBattle layout, Auto/Ręczna…) | **Grupa A** |
| C2-Q*, C4 balans | **Grupa C** (`[EKRAN: Mapa bitwy]`) |

Pliki pytań C3: `docs/grupa-a/C3-PYTANIA-PACZKA-*.md`

---

## Grupa C — NIE pyta Macieja o

- Ruch po mapie, A2, A3, HUD mapy (A1)
- **C3-Q1…Q10** (oblężenie)
- **C1 preBattle**

## Grupa C — pyta tylko o

- **C2** — pole bitwy 3D
- **C4** — reguły w scenie walki

---

## Uwaga implementacyjna (nie zmienia diagramu)

Rozstawianie jednostek **przed** walką = część **ruchu na mapie** (A2/A3), nie osobna faza na polu bitwy C2. Szczegóły: `docs/decyzje/C1-wejscie-walke.md` (rewizja Q3) · F: `deploy: false` po spec od A.

---

*Obowiązuje wszystkich agentów A–F i Master Silnik.*
