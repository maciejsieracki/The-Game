# Handoff → Cursor: Popupy toolbara „Deploy" (The Game · 1E · Pole bitwy v5)

## Do czego to jest
To jest **specyfikacja dla developera (Cursor)** do zaimplementowania w kodzie gry
czterech wysuwanych popupów nad przyciskami toolbara **Deploy** na ekranie pola bitwy.
Popupy: **Formacja**, **Konnica**, **Linie**, **Taktyka** (GAP-03 → GAP-06).

Plik zbiera **wszystkie zmiany ustalone dzisiaj** — nazwy opcji (copy) oraz ikony
(SVG). Referencyjny mockup HTML: `The Game - Popupy deploy v5 2026-07-05 (1E).dc.html`.

### Zasady wspólne (dla wszystkich popupów)
- Zaznaczona opcja = **złota ramka** `border:2px solid #e8d88a` + tło `rgba(232,216,138,.08)`.
- Opcja nieaktywna = `border:1px solid rgba(232,216,138,.2)` + tło `rgba(255,255,255,.02)`.
- Kolor ikon / akcentów: **złoto `#e8d88a`**; tekst główny `#e8e0c8`, podpis `#8a8070`.
- Wszystkie ikony: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.5"`.
- Copy taktyki zsynchronizowane z grą: **Obrona · Atak · Szturm · Ostrzał**.

---

## GAP-03 · Formacja (bez zmian dzisiaj — dla kompletu)
| Opcja | Podpis | Ikona |
|---|---|---|
| **Dystans** *(zaznaczone)* | Łucznicy z przodu | celownik / luneta |
| **Piechota** | Zwarta linia z przodu | skrzyżowane miecze |
| **Oblężenie** | Machiny na skrzydłach | katapulta |

---

## GAP-04 · Konnica — ZMIANY DZISIAJ ✅
Dwie opcje. **Obie ikony zostały dziś ustalone od nowa.**

### „Z boku" — *Oskrzydlenie flanki* (zaznaczone)
Strzała oskrzydlająca: schodzi w dół i zahacza hakiem w prawo.
```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M7 4v7a5 5 0 0 0 5 5h5"/>
  <path d="M13 11.5 17.5 16 13 20.5"/>
</svg>
```

### „Z tyłu" — *Uderzenie na tyły*
Ikona okrążenia (spirala/orbita ze strzałką dochodzącą do środka).
```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="13" r="2.2" fill="currentColor" stroke="none"/>
  <path d="M12 4a9 9 0 1 0 8.5 6.2"/>
  <path d="M12 4 8.6 5.4M12 4l1.3 3.4"/>
</svg>
```

> Nagłówek popupu „Konnica" ma ikonę hełmu (obrócony `rotate(180 12 12)`) — bez zmian.

### Ikona HEŁMU — na przycisk toolbara „Konnica" (dla P1 #1)
Ta sama ikona co w nagłówku popupu. Wstaw jako ikonę przycisku toolbara „Konnica"
(`_makeDeployToolbarDropdown` w `battleScene.ts`). **Nie jest już BLOCKED — SVG poniżej.**
```html
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <g transform="rotate(180 12 12)">
    <path d="M7 20c-2-2.6-3-5.6-3-8.2a8 8 0 0 1 16 0c0 2.6-1 5.6-3 8.2M6.6 20.2 6 21.4M17.4 20.2 18 21.4M8.7 8.4v.01M15.3 8.4v.01M6.7 12.2v.01M17.3 12.2v.01"/>
  </g>
</svg>
```

---

## GAP-05 · Linie — ZMIANA DZISIAJ ✅
Dwa rzędy, każdy z wyborem numeru linii 1 / 2 / 3 (zaznaczony = złota ramka).

- Rząd 1: **Piechota** (ikona skrzyżowanych mieczy) — domyślnie linia **1**.
- Rząd 2: **Dystansowe** ← *ZMIANA: było „Łucznicy", jest „Dystansowe"* — domyślnie linia **3**.
  Ikona (celownik) bez zmian:
```html
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <circle cx="13" cy="12" r="7"/><circle cx="13" cy="12" r="2.6"/>
  <path d="M-2 -1 Q9 3 13 12" stroke-dasharray="0.1 3"/>
  <circle cx="13" cy="12" r="1" fill="currentColor" stroke="none"/>
</svg>
```

---

## GAP-06 · Taktyka v2 (copy z gry — bez zmian dzisiaj)
Siatka 2×2. **Obrona** zaznaczona.
| Opcja | Ikona |
|---|---|
| **Obrona** *(zaznaczone)* | tarcza |
| **Atak** | skrzyżowane miecze |
| **Szturm** | strzałka w dół nad podstawą (natarcie) |
| **Ostrzał** | celownik / luneta |

---

## Podsumowanie zmian z dzisiaj (skrót do commita)
1. **Konnica → „Z boku"**: nowa ikona = strzała oskrzydlająca (flanka).
2. **Konnica → „Z tyłu"**: nowa ikona = okrążenie (orbita ze strzałką do środka).
3. **Linie → rząd 2**: rename `Łucznicy` → **`Dystansowe`** (ikona bez zmian).

---

# SVG KANON — KOD (dla P1 #3–#6)
Wszystkie ikony to warianty `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`,
`stroke-width="1.5"`. Ikony w chipie 34×34 (Formacja) są celowo przesunięte w prawo
(`cx≈16`), żeby optycznie siedziały w środku kafla — jeśli renderujesz w innym boxie,
użyj wersji wycentrowanej (podana niżej przy celowniku).

## GAP-03 · Formacja (3 ikony)
**Dystans — celownik / luneta**
```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="16" cy="15" r="6"/><circle cx="16" cy="15" r="2.3"/>
  <path d="M-1 2 Q13 5 16 15" stroke-dasharray="0.1 3"/>
  <circle cx="16" cy="15" r="0.9" fill="currentColor" stroke="none"/>
</svg>
```
**Piechota — skrzyżowane miecze**
```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/>
</svg>
```
**Oblężenie — katapulta**
```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M3 18h14l-3-9H6ZM6 9 5 5h4"/>
  <circle cx="7" cy="20" r="2"/><circle cx="14" cy="20" r="2"/>
</svg>
```

## GAP-06 · Taktyka (4 ikony)
**Obrona — tarcza**
```html
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M12 3 5 5.5v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9v-5Z"/>
</svg>
```
**Atak — skrzyżowane miecze** (ten sam path co Piechota, box 22×22)
```html
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/>
</svg>
```
**Szturm — strzałka w dół nad podstawą**
```html
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M12 3v14M6 11l6 6 6-6M5 20h14"/>
</svg>
```
**Ostrzał — celownik / luneta** (wersja chipowa, `cx≈16`)
```html
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="16" cy="15" r="6"/><circle cx="16" cy="15" r="2.3"/>
  <path d="M-1 2 Q13 5 16 15" stroke-dasharray="0.1 3"/>
  <circle cx="16" cy="15" r="0.9" fill="currentColor" stroke="none"/>
</svg>
```

## GAP-05 · Linie — ikona Piechota w nagłówku sekcji (17×17)
```html
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M4.5 5 14 14.5M14.5 15 17.5 18M15.6 14 13.6 16M19.5 5 10 14.5M9.5 15 6.5 18M8.4 14 10.4 16"/>
</svg>
```
> „Dystansowe" (celownik) — kod już masz w sekcji GAP-05 wyżej.

## Wariant WYCENTROWANY celownika (gdy box nie jest chipem 34×34)
```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2.3"/>
  <path d="M-5 -1 Q9 2 12 12" stroke-dasharray="0.1 3"/>
  <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none"/>
</svg>
```

---

# SYNC DOKUMENTACJI (P1 #7) — do zastosowania w `DESIGN-ZLECENIE-…-v5-GAP`
- GAP-05: „Łucznicy" → **„Dystansowe"**
- Formacja F3: „Machiny z przodu" → **„Machiny na skrzydłach"**
- Domyślna linia Dystansowe = **3**
