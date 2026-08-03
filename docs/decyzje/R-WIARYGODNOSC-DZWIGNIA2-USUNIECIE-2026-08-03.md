# R-WIARYGODNOSC-DZWIGNIA2-USUNIECIE — decyzja A (2026-08-03)

## Decyzja

**R-WIARYGODNOSC-DZWIGNIA2-Q1 = A** — brak Dźwigni 2. Limit Zaufania z darów/nadwyżki handlu
**nie** zależy od Wiarygodności (W) sprawcy.

## Co zostało (nie jest Dźwignią 2)

- Flat `max_zaufanie_na_ture = 5` — anty-kupowanie Zaufania darem/handlem
- `diplomacyClampTrustGainNaTure` — egzekwuje ten flat limit
- Tempo / strumień W→Z (Dźwignia 1), bramki D3, pierwszy kontakt D4 — bez zmian

## Co usunięto (2026-08-03)

| Obszar | Usunięte |
|--------|----------|
| `gra/src/main.ts` | Wiring `pnRelacjaParams` + `diplomacyMaxZaufanieNaTureForWiarygodnosc(getWiarygodnosc(proposerId))` |
| `gra/src/game/diplomacy-value-catalog.ts` | Funkcja `diplomacyMaxZaufanieNaTureForWiarygodnosc`; pola `PnRelacjaParams` i loader dla `wiarygodnosc_limit_*` |
| `gra/data/diplomacy.json` | `_opis_wiarygodnosc_limit`, `wiarygodnosc_limit_zaufanie_chwiejny`, `wiarygodnosc_limit_zaufanie_wiarolomny`, `wiarygodnosc_limit_zaufanie_dno`, `wiarygodnosc_limit_prog_dno` |
| `gra/tools/wiarygodnosc-test.cjs` | Sekcja testów Dźwigni 2; zastąpiona krótkim testem flat clamp |
| Komentarze | Odniesienia WIAR-9.5b=B / Dźwignia 2 w `diplomacy-pn-engine.ts` |

## Branch

`cursor/wiarygodnosc-usun-dzwignia2-63a1`

## Deploy

Brak deployu w tej paczce — czeka na zlecenie Macieja.
