# R-PRAWO-SIATKA-V2 — siatka Prawa (Dom/Dwór vs Pałac III)

**Data audytu:** 2026-08-05  
**Operator:** AutoBot Tor 3  
**Źródło decyzji:** `dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §4

## Zmiana względem wcześniejszej siatki

| Budynek | Stara reguła (ZASTĄPIONA) | Nowa reguła |
|---------|---------------------------|-------------|
| Dom Starszyzny | 70% Pałacu I → 31/24/20 | **50% Pałacu III** → 36/28/22 |
| Dwór Zarządcy | 70% Pałacu II → 41/31/25 | **60% Pałacu III** → 43/33/26 |
| Pretorium | (bez zmiany formuły) | **70% Pałacu III** → 50/38/31 |

Parametr: **Prawo (pkt Prawa na turę)** per poziom trudności (łatwy / normalny / trudny).

## Audyt `society-params.json` (2026-08-05)

| Klucz | easy | normal | hard | Status |
|-------|------|--------|------|--------|
| `prawo_palac` | 45 | 35 | 28 | PASS |
| `prawo_palac_ii` | 58 | 45 | 36 | PASS |
| `prawo_palac_iii` | 71 | 55 | 44 | PASS |
| `prawo_dom_starszyzny` | 36 | 28 | 22 | PASS |
| `prawo_dwor_zarzadcy` | 43 | 33 | 26 | PASS |
| `prawo_pretorium` | 50 | 38 | 31 | PASS |
| `prawo_trybunal` | 22 | 17 | 13 | PASS |
| `prawo_sad` | 25 | 19 | 16 | PASS |
| `prawo_garnizon_per_jednostka` | 25 | 20 | 15 | PASS |

**Wniosek:** wartości w JSON były już zgodne z tabelą §4 — brak zmian liczbowych w tej sesji.

## Wyniki testów

| Suite | Wynik |
|-------|-------|
| `npx tsc --noEmit` | PASS |
| `prawo-palac-tier-test.cjs` | PASS |
| `prawo-siatka-v2-test.cjs` | PASS (nowy) |
| `society-breakdown-test.cjs` | PASS |

## Zmiany w tej sesji

- `gra/tools/prawo-siatka-v2-test.cjs` — asercje tabeli §4 + relacji 50/60/70% Pałac III + regresja starych liczb
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — status WDROŻONE
- `dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §4 — status wdrożenia
- Ten plik — dowód audytu

**Kod gameplay / JSON:** bez zmian wartości — audyt potwierdził zgodność.
