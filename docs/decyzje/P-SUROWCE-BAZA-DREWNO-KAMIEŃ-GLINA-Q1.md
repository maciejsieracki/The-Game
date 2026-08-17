# P-SUROWCE-BAZA-DREWNO-KAMIEŃ-GLINA-Q1 — bazowa produkcja terenu

**Status:** 🟡 ZAPISANA — decyzja właściciela, ECHO 2026-08-17  
**Baza:** ROBOCZA FALA 291, `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`

## Cytat / decyzja właściciela

`P-SUROWCE-BAZA-DREWNO-KAMIEŃ-GLINA-Q1 = A`

Zaakceptowana tabela bazowej produkcji z samego terenu, bez ulepszenia, lasu
i rzeki; jednostka: pkt surowca/heks/turę:

| Teren | Drewno (pkt/heks/turę) | Kamień (pkt/heks/turę) | Glina (pkt/heks/turę) |
|---|---:|---:|---:|
| Łąka | 0 | 0 | 5 |
| Równina | 5 | 2 | 0 |
| Wzgórza | 5 | 5 | 5 |
| Góry | 0 | 10 | 0 |

Rzeka pozostaje osobnym modyfikatorem.

## Historia propozycji

Przed tą decyzją dane terenowe zawierały wartości wynikające z wcześniejszego
skalowania surowców (`R-EKONOMIA-SUROWCE-SKALA-5X-Q1`), a bazowa tabela nie
zawierała pola `Glina`; bonus gliny był zapisany wyłącznie w modyfikatorze
`Rzeka`. Powyższa decyzja zastępuje tylko bazowe pola Drewno/Kamień/Glina.
Żywność, Praca, Podatek, las, ulepszenia i modyfikator rzeki pozostają poza
zakresem i nie są przez tę decyzję zmieniane.

## Zakres implementacji

- kanoniczne `gra/data/terrain-yields.json`,
- test dokładnych wartości `tileYield()` bez nakładki, ulepszenia i rzeki,
- test niezależności modyfikatora rzeki,
- bez zmian paneli Excel, bundli, `WERSJE.md` i deployu.
