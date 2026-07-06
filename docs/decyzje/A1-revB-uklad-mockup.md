# A1 — Rev. B układ [A] i [I] (Maciej, mockup 2026-06-26)

| Pole | Wartość |
|------|---------|
| **ID** | A1-revB |
| **Status** | **ZAMKNIĘTE** (Maciej — feedback mockup) |

---

## Decyzje

| Element | Było | Jest |
|---------|------|------|
| **Zasoby [A]** | 2 kolumny × 3 wiersze | **Jeden rząd** — 6 zasobów obok siebie |
| **Dyplomacja** | Prawa strona [A] / przy zasobach | **Ikona 🤝** w **[C] → Akcje** |
| **Wojsko / armia** | Klaster [I2] / pasek [A] | **Ikona ⚔** w **[C] → Akcje** |
| **Cuda** | Sekcja Akcje [C] | **Ikona 🏛** w **[C] → Imperium** |
| **Miasta / Nauka / Kultura / Religia** | Pasek [A] / minimapa / [I2] | **Ikony** w panelu **[C]** — sekcja „Imperium" |
| **Nacja „Grecy"** | Widoczna | **OUT** — gracz zna swoją cywilizację |
| **Tura + rok** | Górny pasek [A] / obok okręgu | **Wewnątrz** prostokątnego przycisku [I2] |
| **Koniec tury** | Tylko okrąg [I2] | **Prostokątny przycisk** [I2] na pasku [I] — tura + rok + „Zakończ turę" |
| **Wojna (B)** | Osobny pasek pod [A] | **Kafelek w [A]** (czerwony), obok Epoki/Osiedli |
| **Menu** | Dolny pasek [I] | **Prawy górny [A]** — obok wojen / sojuszy / paktów |
| **Power (Potęga)** | — | **Środek [A′]** — klik → składniki; negocjacje via Respekt w dyplomacji |
| **Sojusz / Pakt** | — | Chipy obok **Wojna** na [A] — klik → dyplomacja (fokus nacja) |

---

## Układ [A] (lewo → prawo)

```
[Zasoby ×6] │ [⚜ POWER 62] │ [Epoka] … [Sojusz][Pakt][Wojna][☰ Menu]
                  ↑ środek
```

- **Prawy górny [A]:** aktywne **sojusze**, **pakty o nieagresji**, **wojny** (chipy) + **Menu**
- **Menu** — **OUT** z dolnego paska [I]
- **Dyplomacja / Wojsko** — sekcja **Akcje** w [C]; **Cuda** — sekcja **Imperium**

## Układ [C] — panel sterowania lewy-górny

```
[C]  IMPERIUM              AKCJE
     🏙 Miasta             🤝 Dyplomacja
     🔬 Nauka              ⚔ Wojsko
     🎭 Kultura            🔨 Budowa
     ⛪ Religia
     🏛 Cuda
```

**Imperium** = panele informacyjne (miasta, nauka, kultura, religia, **cuda**).  
**Akcje** = dyplomacja, wojsko, budowa na mapie.
- **Badania [A]** — tylko liczby (+X/t, %); klik drzewka → ikona 🔬 [C]
- **Kultura / Religia** — klik treści w [C]; toggle **Zasięg** zostaje przy minimapie [F]
- **Miasta** — przeniesione z [I2] do [C]

## Układ [I] + [I2] (dolny pasek, prawa strona)

```
[I]  … WYKONAJ │ ┌─────────────────┐
                 │ Tura 15 · 1200  │  [I2]
                 │ ▶ Zakończ turę  │
                 └─────────────────┘
```

- **Menu** → prawy górny [A] (obok wojen / sojuszy / paktów)

- **Jeden prostokątny przycisk** — tura, rok i akcja w środku (bez osobnego okręgu)
- **G1:** szary / disabled gdy blocking w [E]

---

Mockup: `UI/Makieta-HUD-D1B-preview.html`
