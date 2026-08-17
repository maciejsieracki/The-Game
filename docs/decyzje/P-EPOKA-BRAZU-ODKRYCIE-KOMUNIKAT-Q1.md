# P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1

## ECHO — decyzja właściciela (2026-08-17)

**Cytat Macieja:**

> `P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1 = C`.
> Po odkryciu technologii/badań umożliwiających wejście do epoki Brązu ma pojawić
> się modal połączony z pełną kartą technologii: budynki, jednostki, ulepszenia,
> kolejne technologie, wymagania i efekty. To nie jest popup podboju
> miast-państw.

**Decyzja:** **C** — po odkryciu technologii awansu do Brązu pokazujemy modal
pełnej karty tej technologii, korzystający z prawdziwych danych drzewa technologii
i danych odblokowań. Komunikat nie anuluje tury ani badań.

## Zakres wdrożenia

- reużycie istniejącego komunikatu/toastu awansu epoki i realnego `tech.json`;
- karta odkrytej technologii: budynki, jednostki, ulepszenia terenu, następne
  technologie, wymagania i efekty/dane opisowe;
- zamknięcie przyciskiem, tłem i Escape oraz ponowne otwarcie z drzewa;
- odporność na długie listy i brakujące sekcje;
- test realnej produkcyjnej ścieżki odkrycia Brązownictwa oraz starego save;
- bez grafiki Designera, linkowania Civpedii/Wikipedii i bez mieszania z triumfem
  miast-państw.

## Status

**ECHO zapisane — 🔵 W TRAKCIE.**

Implementacja: `gra/src/ui/techDiscoveryNotice.ts`, `gra/src/ui/techTreeView.ts`,
`gra/src/main.ts`; commit `1383c31e` + zgodność bramki `b047ff73`.
Typecheck PASS, `tech-tree-test.cjs` 19/19 i `research-test.cjs` 33/33,
`era-change-toast-defer-test.cjs` 7/7 + 8/8 mutacji PASS. Test produkcyjny
`era-change-toast-live-test.cjs` zbudował bundel PASS, ale wykonanie Chromium
zostało zablokowane brakiem zainstalowanego executable w środowisku (FAIL
środowiskowy, nie wynik funkcjonalny). Deploy, merge i push są poza zakresem.
