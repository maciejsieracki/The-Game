# R-DYP-NEGOCJACJE-NA-ZYWO

**Status:** 🟢 **WDROŻONA** (kod; czeka na deploy w bundle innego agenta)  
**Data:** 2026-07-26+ (FALA 18 `2f928932`, potwierdzenie audyt 2026-07-27)

## Decyzja Macieja (playtest 2026-07-26)

Negocjacja ma toczyć się **w oknie audiencji, na bieżąco** — propozycja, odpowiedź AI, kontroferta i decyzja **bez czekania do końca tury**.

## Dowód wdrożenia

- `gra/src/main.ts` (~11188) — `C-DYP-Q1=B` / rozstrzyganie w audiencji
- `gra/src/ui/diplomacyAudience.ts`
- `dyspozycje/WERSJE.md` — Negocjacje NA ZYWO

## Uwaga

REJESTR miał status „PROPOZYCJA DO ZMIAN" — **nieaktualny** po wdrożeniu; zsynchronizowano 2026-07-27.

Pełny **R-DYP-STOL-A** (kontroferty AI-initiated itd.) — osobny, częściowo otwarty zakres.
