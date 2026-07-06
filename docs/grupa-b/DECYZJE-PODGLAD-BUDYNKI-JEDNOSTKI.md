# Decyzje UX — podgląd budynku / jednostki (panel miasta)

**Status:** ✅ **ZATWIERDZONE przez Macieja (2026-06-28)** — w prototypie OKOLICA  
**Decyzja:** **D-BUDYNKI: A** (tooltip na miniaturze) · **D-JEDNOSTKI: B** (mini 3D + staty przy hover)  
**Kontekst:** prototyp `Gra-podglad-OKOLICA-UX.html` · lane UI (`cityPanel.ts`, `unitMiniPreview.ts`, `buildingHoverTooltip.ts`)  
**Powiązane:** layout Civ V lewy panel (produkcja, Buduj/Kup, Rekrutuj) — **zrobione**; brakuje **charakterystyki** przy wyborze.

---

## Co już jest (zrobione)

- Lewy panel: produkcja, kolejka, lista budynków (**Kup** złoty lewo · **Buduj** niebieski prawo)
- Kup budynku = **2×** koszt Pracy (💰)
- Rekrutuj jednostkę (za Pieniądz)
- **Jeden typ budynku na miasto** — znika z listy gdy zbudowany lub w kolejce
- Pasek surowców u góry (Civ V)

---

## D-BUDYNKI — jak pokazać parametry budynku?

**Dane:** `buildings.json` → `baza`, `przyrost`, `utrzymanie`, `wymagania`, `techUnlock`, `uwagi`, `kategoria`.

### **A — Tooltip przy najechaniu** *(szybkie, jak Civ)*

- Najedź na wiersz → po ~0,4 s panel obok kursora
- Tabela bonusów (+🔨 +💰 +🍞…), utrzymanie/turę, wymagania, tech
- **Plus:** szybki przegląd wielu pozycji, bez zmiany layoutu
- **Minus:** mało miejsca na długi opis i poziomy

### **B — Rozsuwana szuflada w wierszu** *(więcej informacji)*

- Klik **ⓘ** (lub wiersz) → rozszerzenie w dół o kartę szczegółów
- Bonusy bazowe + przyrost/poziom, `uwagi`, `nazwyPoziomow`
- **Plus:** dużo tekstu, stabilne na dotyk
- **Minus:** dłuższa lista, trzeba klikać

**Decyzja Macieja:** `D-BUDYNKI: A` lub `D-BUDYNKI: B`

---

## D-JEDNOSTKI — jak pokazać staty i wygląd?

**Dane:** `units.json` (Atak, Obrona, Ruch, HP, zasięg, utrzymanie…).  
**Model 3D:** `buildUnitModel()` — ten sam co mapa / bitwa 3D.

### **A — Karta statystyk w lewym panelu** *(prostsze)*

- Klik nazwy / **ⓘ** → karta pod listą (~200 px)
- Staty z Excela + ikona kategorii (styl preBattle, bez 3D)
- Koszt rekrutacji, utrzymanie, wymagany budynek (Koszary)
- **Plus:** szybka implementacja, lekki UI
- **Minus:** brak podglądu modelu 3D

### **B — Mini-podgląd 3D na mapie + karta statów** *(bliżej kart bitewnych)*

- Klik wiersza → panel w dolnej części **środka mapy** (nad „Wróć na mapę”)
- Mały canvas: model z `buildUnitModel()` (obrót myszą)
- Obok: staty jak w preBattle
- **Plus:** spójność z bitwą 3D, efekt „wow”
- **Minus:** ~1–2 batchy więcej (Three.js, dispose)

**Decyzja Macieja:** `D-JEDNOSTKI: A` lub `D-JEDNOSTKI: B`

---

## Po decyzji — plan implementacji

1. Maciej: np. **`D-BUDYNKI: B, D-JEDNOSTKI: B`**
2. UI lane: prototyp w `cityPanel.ts` + rebuild `Gra-podglad-OKOLICA-UX.html`
3. Playtest Macieja na prototypie
4. Integrator: wpiecie w `main.ts` / kanon po sign-off

**Pliki docelowe:** `gra/src/ui/cityPanel.ts` (+ ewent. `gra/src/ui/buildingDetail.ts`, `unitDetailPreview.ts`)

---

## Historia

| Data | Zdarzenie |
|------|-----------|
| 2026-06-26 | Maciej: propozycja 2 wariantów budynki + jednostki (czat MASTER) |
| 2026-06-29 | Fix Buduj/Kup/kolejka — podglądy **nadal otwarte**; zapis do tego pliku |
