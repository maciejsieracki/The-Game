# A1-Q12 — Ikony Kultura / Religia obok minimapy

| Pole | Wartość |
|------|---------|
| **ID** | A1-Q12 (+ **MAPA-F2-Q1** toggle zasięgu) |
| **Ekran** | `[EKRAN: Mapa świata]` |
| **Data** | 2026-06-26 |
| **Status** | **CZĘŚCIOWO** — routing ZAMKNIĘTY · **A1-Q12a/b = A (Maciej 2026-06-26)** |

---

## Decyzja Maciej (routing lane'ów)

> Lane **Nauka / Grupa D** zajmował się **wyglądem** elementu — **poza zakresem**. Maciej odpisał: wygląd toggle przy minimapie = **MAPA**; **treść po kliknięciu** = **Grupa A** (ten czat).

| Warstwa | Właściciel | Co robi | Czego **NIE** robi |
|---------|------------|---------|---------------------|
| **Toggle zasięgu na mapie** | **MAPA** (+ pozycja ikon obok [F]) | Obok minimapy: **włącz/wyłącz** podgląd **zasięgu kultury** i **zasięgu naszej religii** na heksach [D] | Treść panelu · ekonomia kultury |
| **Klik ikony → „w środku"** | **Grupa A** (A1-Q12) | Spec: **co się otwiera**, jakie dane, akcje gracza, zamknięcie (overlay/modal) | Render heksów zasięgu · CSS ikony toggle |
| **Szczegóły per miasto** | **Grupa B** (B4.2) | Kultura/religia w **panelu miasta** | HUD minimapy |

---

## MAPA-F2-Q1 — toggle zasięgu (ZAMKNIĘTE)

**Q1 na mapie świata:** przy **[F] minimapie** (obok, nie w toolbarze [C]) — **tylko** możliwość **ON/OFF**:

| Ikona | Toggle | Efekt na [D] gdy ON |
|-------|--------|---------------------|
| **Kultura** | zasięg kultury | Overlay heksów w zasięgu kultury imperium (tint/obrys — styl MAPA) |
| **Religia** | zasięg **naszej** religii | Overlay heksów w zasięgu religii państwa gracza |

- **Klik toggle:** **nie** otwiera panelu treści — tylko zmienia widoczność warstwy na mapie.
- Stan persystuje w sesji (localStorage — opcjonalnie później).
- Handoff implementacji: `dyspozycje/_handoff/MAPA-do-UI_kultura-religia-zasieg-minimapa.md`

---

## A1-Q12 — klik ikony → treść (**ZAMKNIĘTE 2026-06-26**)

**Grupa A** definiuje overlay/panel po **kliku** ikony (osobna akcja od toggle zasięgu — doprecyzować w mockupie: np. przycisk „i", long-press).

### A1-Q12a — ikona **Kultura** → **A** (Maciej, 2026-06-26)

Gracz widzi **wszystkie parametry**, które mają wpływ na **kulturę** i **zasięg kultury** (imperium + per miasto w jednym panelu).

**Minimum v1.0 (lista dla UI):**

| Obszar | Co pokazać |
|--------|------------|
| Imperium | Suma kultury, przyrost/turę, progi zasięgu (prog 1/2/3 z `society-params`) |
| Zasięg | Aktualny promień granicy per miasto, % do następnego progu |
| Presja / konwersja | Udział własnej kultury na kafelkach, tempo konwersji (baza + bonusy: świątynia, amfiteatr, biblioteka, cap/turę) |
| Szczęście | Bonus/kara kultury (100% / ≥75% / 50% / <50% / <25%) |
| Źródła | Budynki i cuda dające kulturę (Pałac, Świątynia, Biblioteka, Amfiteatr, Artysta…) |
| Miasta | Lista miast z kluczowymi liczbami + link „szczegóły → panel miasta" (B4.2) |

Źródło danych: `culture-religion.ts` + `society-params.json` blok `kultura`.

### A1-Q12b — ikona **Religia** → **A** (Maciej, 2026-06-26)

**To samo co kultura:** gracz widzi **wszystkie parametry** wpływające na **religię** i **zasięg religii**.

**Minimum v1.0 (lista dla UI):**

| Obszar | Co pokazać |
|--------|------------|
| Imperium | Religia państwa gracza (z `religie_cywilizacji` / civ) |
| Zasięg | Heksy/miasta pod wpływem wiary, max dystans szerzenia |
| Szerzenie | Bazowa szybkość, bonus świątyni, konwersja bazowa + bonus świątyni |
| Dominacja | Próg dominacji (%), miasta z dominującą / obcą / brak religii |
| Szczęście | Bonus dominująca wiara, kara obca wiara, kara brak religii |
| Miasta | Lista: dominująca wiara, % wyznawców, presja na sąsiadów + link do panelu miasta |

Źródło danych: `culture-religion.ts` + `society-params.json` blok `religia`.

**Decyzja Macieja:** `A1-Q12a=A, A1-Q12b=A` (pełne parametry, nie skrót).

---

## A1-Q12 — archiwum opcji (referencja)

<details>
<summary>Poprzednie opcje ABC (przed decyzją Macieja)</summary>

### A1-Q12a — opcje

| | Opcja |
|---|--------|
| **A** | Panel imperium — **WYBRANE** (rozszerzone: wszystkie parametry kultury i zasięgu) |
| **B** | Tylko skrót suma + przyrost |
| **C** | Bez panelu — tylko toggle |

### A1-Q12b — opcje

| | Opcja |
|---|--------|
| **A** | Panel imperium — **WYBRANE** (wszystkie parametry religii i zasięgu) |
| **B** | Skrót + link |
| **C** | Bez panelu |

</details>

---

## Pozycja UI (ASCII)

```
┌─ [F] Minimapa ─────┐  🎭 Kultura   ⛪ Religia
│  (canvas 2D)       │     ↑              ↑
└────────────────────┘  toggle zasięgu   toggle zasięgu  ← MAPA (F2-Q1)
                        klik → panel?    klik → panel?  ← Grupa A (Q12)
├─ [F2] Granice · Nazwy · … ──────────── (pod minimapą, bez duplikatu)
```

---

## Powiązania

- `docs/A1-HUD-MAP-KLIKNIEC.md` — mapa kliknięć (po zamknięciu Q12)
- `docs/decyzje/D2-kultura.md` — redirect; treść kliku → **A1-Q12**, nie D2
- Excel: `Status-projektu-The-Game.xlsx` → `HUD-mapa-kliki`
