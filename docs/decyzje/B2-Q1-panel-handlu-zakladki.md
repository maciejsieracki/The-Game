# B2-Q1 — Panel handlu: układ zakładek vs szkielet designera

**Data:** 2026-07-07  
**Decyzja Macieja:** **B**  
**Cytat:** „b"

## Opcje (skrót)

| Opcja | Treść |
|-------|--------|
| **A** | Powrót do niezakładkowego panelu designera (suwaki inline przy Zamożności) |
| **B** | Zostać przy systemie zakładek — poprawić tylko czytelność (scroll, overflow, odstępy) |
| **C** | Przenieść suwaki inline do karty Zamożność |

## Ustalenie

Maciej wybrał **B**:

- Suwaki Skarb / Nauka / Zamożność pozostają na zakładce **„Podział handlu i zamożność"** (ikona handlu w prawym railu).
- Naprawa wyłącznie czytelności: scroll w karcie zakładki, brak przycinania przez `overflow:hidden`, odstępy między suwakami a sekcją Zamożność.
- **NIE** przywracać starego szkieletu designera (A).
- **NIE** przenosić suwaków inline do karty Zamożność (C).
- Surowce tylko w stopce panelu (B1 — już wdrożone).

## Wdrożenie (2026-07-07)

Plik: `gra/src/ui/cityPanel.ts`

- Klasa `civ-w4-tab-card--scroll` + `civ-w4-tab-body--scroll` na zakładce `handel` — przewijanie treści zamiast ucięcia.
- Hint pod tytułem zakładki + rozszerzony `title` ikony railu.
- Odstępy: `.civ-handel-sliders-host`, `.civ-handel-wealth-host`, `.civ-handel-tab-hint`.
- Dedup surowców bez zmian (stopka `#cs-surowce-foot`).

**Status:** ✅ WDROŻONE
