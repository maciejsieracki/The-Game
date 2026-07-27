# C-OBCE-JEDN-Q2 — Znak właściciela nad żetonem jednostki

**Status:** 🟢 **WDROŻONA** — FALA 43 `33c49486` (2026-07-27)  
**Grupa:** C + render (`gra/src/render/`)  
**Ekran:** [EKRAN: Mapa świata — żeton jednostki]

## Odpowiedź Macieja

> Wzorzec **Total War**: po **lewej stronie tabliczki** mały symbol frakcji.  
> - **Pełna cywilizacja** → **głowa władcy** (portret)  
> - **Miasto-państwo** → **sygnet państwa**  
> - **U góry** symbol generała — **na razie nie mamy generałów; można kiedyś**, poza zakresem v1 tego pakietu.

Barbarzyńcy: ikona frakcji (jak w oryginalnej opcji A) — do doprecyzowania przy wdrożeniu renderu.

## Layout żetonu na mapie (Maciej 2026-07-27)

```
        [generał — PRZYSZŁOŚĆ, nie teraz]

[portret/sygnet]  [★ weteran ★]     ← wiersz nad głową
 [koszary]    ★ ★ ★    [kuźnia]     ← symbole po bokach gwiazdek (gdy występują)

              [figurka]
```

- **Lewy róg tabliczki / żetonu:** portret władcy lub sygnet miasta-państwa  
- **Nad głową, między gwiazdkami:** ikona koszar (lewo) i kuźni (prawo) — tylko skrót poziomu (brąz/srebro/złoto)  
- **Szczegóły** (pełne % pancerza/parametrów, wszystkie statusy) → **tylko w karcie jednostki** (Q1)

## Uwaga techniczna

Wdrożone w FALI 43: osobne ikony koszar/kuźnia po bokach gwiazdek (`unitPathFlankBadges.ts`); kolory brąz/srebro/złoto per poziom ścieżki (`tintBuildingSvg` — naprawa złotego `#e8d88a` w SVG). Stare kropki u podstawy usunięte.

## Status wdrożenia

| Etap | Stan |
|------|------|
| **Właściciel** | ✅ FALA 43 `33c49486` |
| **Portret/sygnet po lewej** | ✅ `unitOwnerMedallion.ts` |
| **Ikony koszar/kuźnia przy gwiazdkach** | ✅ `unitPathFlankBadges.ts` (brąz/srebro/złoto) |
| **Generał u góry** | ⏸ poza zakresem |
| **Deploy** | ✅ FALA 43 · VERIFY OK · `gra-robocza/START.html` |
