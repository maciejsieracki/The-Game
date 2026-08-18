# P-SUROWCE-BAZA-DREWNO-KAMIEŃ-GLINA-Q1 — bazowa produkcja terenu

**Status:** ✅ ZAMKNIĘTE — ZDEPLOYOWANE w ROBOCZA FALA 294 `a0f804d7` —
Evaluator **PASS-WITH-NOTES**
**Dowód:** źródło `gra/data/terrain-yields.json`; implementacja `4d40d0f8`;
test korekty pustej puli `3ee0c52f`; ROBOCZA md5
`a0f804d7593333e34c989dc3565cb0c6` (`gra-robocza/ROBOCZA-MANIFEST.json`)

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
- bez zmian paneli Excel; wartości są bundlowane statycznie z `gra/data`.

## Weryfikacja statusu — audyt 2026-08-18

- Tabela w źródle i w runtime ROBOCZA jest zgodna z decyzją:
  Łąka `0/0/5`, Równina `5/2/0`, Wzgórza `5/5/5`, Góry `0/10/0`
  (Drewno/Kamień/Glina, pkt/heks/turę).
- `node tools/terrain-base-resource-yields-test.cjs` — **PASS 9/9**:
  cztery wartości bazowe, niezależność rzeki, niezależność lasu oraz
  przejście realnej produkcji centrum miasta do magazynu.
- Rzeka jest osobnym modyfikatorem: dodaje **+10 pkt Gliny/heks/turę**
  i nie zmienia Drewna ani Kamienia. Potwierdzenie: `economy.ts`
  (`tile.maRzeke`) oraz trzy asercje rzeki w teście.
- ROBOCZA używa statycznie zbundlowanego `gra/data/terrain-yields.json`;
  historyczny katalog `gra-robocza/data — kopia/` nie jest źródłem runtime
  i nie jest dowodem regresji.
