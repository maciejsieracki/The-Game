# C-OBCE-JEDN-KARTA — Karta jednostki: statusy, koszary, kuźnia, weteran

**Status:** 🟢 **ZAPISANE** — doprecyzowanie Macieja 2026-07-27 (wątek Q1–Q3)  
**Zależność:** `C-OBCE-JEDN-Q1` (A) · `C-OBCE-JEDN-Q2` (TW) · `C-OBCE-JEDN-Q3` (A+B+C)

## Cel

Jedna spójna **karta jednostki** (panel po kliknięciu — własna i obca) + skrót na żetonie mapy. Gracz widzi „z daleka” poziom ulepszeń i weterana; po kliknięciu — pełne statystyki.

## Wzorzec wizualny

Inspiracja: **Total War** — po lewej tabliczki portret władcy / sygnet państwa; u góry w przyszłości generał (poza zakresem teraz).

## Ścieżki budynkowe (źródło: `unit-building-bonuses.ts`)

| Ścieżka | Budynki | Efekt | Ikona na karcie |
|---------|---------|-------|-----------------|
| **B — Parametry** | koszary → akademia_wojskowa → warsztat_oblezniczy | atak, obrona, HP, … | **Symbol koszar** |
| **A — Pancerz** | kuznia → kuznia_zelaza → wielka_kuznia | pancerz | **Symbol kuźni** |

### Poziomy koloru (1 / 2 / 3)

| Poziom | Kolor | Znaczenie |
|--------|-------|-----------|
| 1 | Brąz (miedziany) | pierwszy próg premii na ścieżce |
| 2 | Srebro | środkowy próg |
| 3 | Złoto | najwyższy próg na ścieżce |

Progi liczone **osobno** per ścieżka z `%` zapisanym na jednostce (`pancerzBonusProc` / `parametryBonusProc`), nie jedna suma — zgodnie z intencją Macieja (dwa symbole, nie jedna kropka).

> **Uwaga wdrożeniowa:** `unitUpgradeBadges.ts` dziś sumuje obie ścieżki w jeden poziom kropek u podstawy. Nowy układ **zastępuje** ten skrót na mapie ikonami koszar/kuźnia przy gwiazdkach.

## Layout na żetonie (mapa)

```
[portret władcy | sygnet MP]     ← lewa krawędź tabliczki (Q2)

        (miejsce na generała — przyszłość)

   [🛡 koszary]  ★★★  [⚒ kuźnia]   ← tylko gdy ścieżka > 0; kolory brąz/srebro/złoto
```

- Gwiazdki weterana: środek (`unitVeteranBadges.ts` — dostosować pozycję X).  
- Koszary: **lewo** od gwiazdek. Kuźnia: **prawo** od gwiazdek.  
- Brak premii na ścieżce = brak ikony tej ścieżki.

## Layout w karcie jednostki (pełny)

Sekcje (kolejność do ustalenia przy UI):

1. Nagłówek: nazwa typu, właściciel, relacja (obca)  
2. Punkty Życia, atak, obrona (+ ewent. dystans)  
3. **Wiersz statusów:** ikona koszar (poziom + %) · ikona kuźni (poziom + %) · gwiazdki weterana + opis poziomu  
4. Pozostałe statusy (garnizon, głód, oblężenie, …)  
5. Akcje (własna jednostka) / tylko odczyt (obca)

## Edukacja weterana (Q3)

- Karta: linia „Doświadczenie bojowe: poziom N (X starć)”  
- Pierwsze spotkanie ★≥2: wpis dziennika  
- Hover na ★: krótki tooltip

## Parytet AI

Wszystkie elementy widoczne także na jednostkach AI i miast-państw (bez ukrywania premii wroga).

## Pliki do dotknięcia przy `działaj`

- `gra/src/main.ts` — podgląd obcej jednostki  
- `gra/src/ui/hexContextTooltip.ts` / `unitPanelHud.ts` — karta  
- `gra/src/render/unitUpgradeBadges.ts` — migracja z kropek na ikony  
- `gra/src/render/unitVeteranBadges.ts` — pozycja względem nowych ikon  
- `gra/src/render/units.ts` — portret/sygnet po lewej (Opus)  
- `gra/src/game/veteran.ts` — hint pierwsze spotkanie
