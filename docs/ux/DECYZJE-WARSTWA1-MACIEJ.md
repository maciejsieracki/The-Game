# Decyzje Warstwa 1 — Maciej (Design System)

**Data:** 2026-06-26  
**Źródło:** `UI/Warstwa1-Design-System-podglad.html`  
**Odpowiedź Macieja:** `1B, 2C, 3C, 4C, 5C, 6C, 7A, 8A`

---

## Podsumowanie (do wklejenia w Figmie / lane UI)

```
Decyzje Warstwa 1: 1B, 2C, 3C, 4C, 5C, 6C, 7A, 8A
```

---

## Tabela decyzji

| # | Temat | Wybór | Co to znaczy w praktyce |
|---|--------|-------|-------------------------|
| **1B** | Paleta kolorów | Cieplejsze złoto / pergamin | Tło ciemne, akcent `#e8d88a` → cieplejsze złoto; panele jak stary pergamin; mniej chłodnego niebieskiego |
| **2C** | Czcionki | Georgia dominuje | Tytuły, nazwy miast, nagłówki paneli = **Georgia**; UI pomocnicze (liczby, przyciski) = Segoe UI / sans |
| **3C** | Ikony | Minimal line (obrys) | Cienkie linie, bez wypełnień; **obowiązkowa lista semantyki** → [`FIGMA-SPEC-IKONY.md`](FIGMA-SPEC-IKONY.md) |
| **4C** | Przyciski | Obrys (outline) | Przyciski akcji: przezroczyste tło + złoty obrys 2px; wypełnienie tylko hover/active |
| **5C** | Ramka panelu | Mocna, premium | Gruba obwódka złota (2px), wyraźny cień, wyraźny nagłówek |
| **6C** | Chip HUD | Większy + etykieta tekstowa | Ikona + liczba + **widoczna etykieta** (np. „Złoto”, „Praca”, „Badania”) — nie tylko emoji |
| **7A** | Figma | Pełny plik od razu | Design System + strony ekranów A–E w jednym pliku (nie etapami) |
| **8A** | Wdrożenie | Tak, kolejność E→A→B→D→C | Po Figmie: menu → HUD → panel miasta → dyplomacja → walka |

---

## Warunek Macieja przy 3C

Ikony **nie mogą być „dowolne line-art”**. Każda ikona ma **konkretny przedmiot** z listy w [`FIGMA-SPEC-IKONY.md`](FIGMA-SPEC-IKONY.md).

Przykład: zasób **Praca** = **młotek** (nie siekiera, nie klucz, nie koło zębate).

---

## Następne kroki (lane UI)

1. Utworzyć plik Figmy **„The Game — Design System v1”** wg decyzji powyżej.
2. Strony: `00 Tokens` · `01 Components` · `02 Icons` · `03–07 Screens A–E`.
3. Ikony rysować **wyłącznie** z [`FIGMA-SPEC-IKONY.md`](FIGMA-SPEC-IKONY.md).
4. Baseline PNG jako tło referencyjne: `docs/ux/baseline/{A..E}/`.
5. Dyspozycja dla grup: [`DYSPOZYCJA-FIGMA-DESIGN-SYSTEM.md`](DYSPOZYCJA-FIGMA-DESIGN-SYSTEM.md).

---

## Status workflow

| Faza | Status |
|------|--------|
| 0 Baseline screenshoty | ✅ |
| **1 Decyzje Warstwa 1** | **✅ (ten plik)** |
| 2 Figma Design System | ⏳ lane UI |
| 3 Ekrany A–E w Figmie | 🔒 po 2 |
| 4 Eksport tokenów + SVG | 🔒 po 3 |
| 5 Wdrożenie E→A→B→D→C | 🔒 po 4 |

---

*Append-only · nie nadpisywać bez nowej decyzji Macieja*
