# R-OKOLICA-ZYWNOSC-SCORE — auto-okolica fokus żywność

**Data:** 2026-08-04 · **Zgłoszenie:** Maciej (playtest Ateny)  
**Status:** WDROŻONE w kodzie (bez deploy)  
**Pliki:** `gra/src/game/okolica.ts`, `gra/src/game/terrain-improvements.ts`, `gra/tools/okolica-test.cjs`

## Problem

Przy auto okolicy w trybie **Żywność** miasto obsadzało **lasy** zamiast łąk/równin, mimo że las dawał mniej żywności (np. 4 vs 6) i gorszy potencjał farmy.

## Przyczyna (root cause)

1. **Wagi fokusu żywność** `{ zywnosc: 3, praca: 0.5, handel: 0.5 }` — przy wysokiej Pracy lasu (np. 7) i dodatkowym Handlu las mógł przebić łąkę w rankingu, zwłaszcza gdy różnica żywności była niewielka lub przy profilu zrównoważonym.
2. **Brak potencjału żywności** — ranking brał wyłącznie bieżące plony; nie premiował otwartej łąki/równiny pod przyszłą farmę ani nie karał lasu jako miejsca fokusu żywności.

Fokus `okolicaFocus` był poprawnie podawany do `assignWorkedTiles` / `resolveWorkedTiles` (nie mylony z `budowaFocus`).

## Rozwiązanie

### Wagi fokusu `zywnosc`

```text
{ zywnosc: 10, praca: 0, handel: 0 }
```

Praca i handel nie wpływają na ranking przy fokusie żywność.

### Potencjał żywności (tylko fokus `zywnosc`)

Dodawany do score przed sortowaniem (`foodPotentialForHex`):

| Teren | Potencjał |
|-------|-----------|
| Łąka / Równina bez ulepszenia żywnościowego | +3 (`farma.bonus.zywnosc`) |
| Nakładka Las | −3 |
| Już farma / irygacja / inne żywnościowe | 0 |

### Tie-break (fokus żywność)

1. Wyższy score (plony × wagi + potencjał)  
2. Wyższa bieżąca żywność  
3. Wyższy potencjał  
4. Bliżej centrum (`dist`)  
5. Klucz `q,r` alfabetycznie  

### Bez zmian

Fokusy `produkcja`, `podatki`, `zrownowazone` — bez drastycznych korekt.

## Wzór score

```text
score = w🌾×żywność + w🔨×praca + w💰×handel + potencjał_żywności

potencjał_żywności (tylko focus=zywnosc):
  +3  — łąka/równina bez farmy/irygacji/…
  -3  — nakładka Las
   0  — już ulepszenie żywnościowe lub inny teren
```

## Testy

`node tools/okolica-test.cjs` — sekcje 15–17:

- łąka 6Ż/3P bije las 4Ż/7P przy fokusie żywność  
- przy równej żywności wygrywa łąka bez lasu (potencjał)  
- zrównoważone: las może wygrać na Pracy przy remisie żywności  
