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
