# AI-BALANS-STEP2 — smoke metryczny (Trudny)

**Data:** 2026-08-05 · **Tip SHA:** `27b07a5` · **Wynik:** **PASS**

Automatyczny pomiar `chooseCityProduction` major AI mid-game — kara L3 pokój −40 score Wojownika (STEP2).

Uruchomienie: `cd gra && node tools/ai-balans-step2-smoke.cjs`

## Tabela metryk

| Scenariusz | L2 pokój pick | L3 pokój pick | L3 threat pick | Wojownik L2 | Wojownik L3 pokój | Δ pokój | Łucznik L3 | stolarnia L3 | Wojownik L3 threat |
|---|---|---|---|---:|---:|---:|---:|---:|---:|
| baseline-5-5-5 | Wojownik | Łucznik | Wojownik | 270 | 230 | −40 | 265 | 240 | 400 |
| military-8-5-5 | Wojownik | Łucznik | Wojownik | 371 | 331 | −40 | 366 | 220 | 440 |
| economy-5-8-5 | stolarnia | stolarnia | stolarnia | 234 | 194 | −40 | 229 | 325 | 380 |

## Bramki smoke

- Kara stała: `40` pkt
- L3 + pokój: score Wojownika o 40 niższy niż L2 (identyczne inputy)
- L3 + underThreat: brak kary (−40 nie stosowane)
- L2: brak kary
- Unit test regresji: `node tools/ai-balans-step2-test.cjs` (9/9)

## Odniesienia

- Decyzja: `docs/decyzje/AI-BALANS-STEP2.md`
- Deploy FALA 246: md5 `cbf529f3`
