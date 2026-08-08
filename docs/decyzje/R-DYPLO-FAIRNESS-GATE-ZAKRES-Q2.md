# R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2 — Traktat handlowy blokowany mimo dodatniego bilansu pakietu

**Data:** 2026-08-08 · **Decyzja:** Maciej, `A`

## Sytuacja
Panel „Bilans (Netto)" sumuje cały stół negocjacji (+14 PW), ale bramka Przyjmij
(`treatyBaseFairnessGap`) ocenia każdą umowę osobno — traktat handlowy sam wymaga 80 PW.
Traktat **celowo nie ma własnego koszyka** (decyzja `HANDEL-SPLIT-Q1=B`, 29.07) — jedyny
kanał dopłaty to osobna pozycja na stole, ta której bramka nie widzi. Efekt: **poniżej
Relacji 100 pkt traktatu handlowego nie da się dziś zawrzeć wcale.** Decyzja
`R-DYPLO-STOL-PW-SUM` (04.08) już raz rozstrzygnęła na korzyść sumy stołu dla ofert
przychodzących, ale tylko kosmetycznie — wykonanie nadal jest per-umowa. Pełna diagnoza w
`dyspozycje/PYTANIA-OTWARTE.md`, sekcja `R-DYPLO-CENY-SUROWCOW-PW + BUG-PAKIET-BILANS-DODATNI-BLOKADA`.

## Decyzja
**A — bramka na poziomie pakietu: decyduje suma PW całego stołu**, zawężona do baz
traktatowych (nie przenika do innych umów typu NAP/sojusz na tym samym stole).

## Uzasadnienie (z turnieju ABC)
Domyka `HANDEL-SPLIT-Q1=B` zamiast go cofać — tamta decyzja przeniosła kanał zapłaty za
traktat OBOK traktatu na stół; bramka jako jedyna za tym nie poszła. Przywraca kierunek
`R-DYPLO-STOL-PW-SUM` (04.08) i rozciąga go z samej flagi UI na realne wykonanie. Odblokowuje
traktat handlowy poniżej Relacji 100 pkt jedyną istniejącą drogą, bez cofania niczego z 08.08
(`BUG-TRAKTAT-KOSZYK-REGRESJA=A`).

**Świadomie zaakceptowane ryzyko (Przeciw #1-2 wariantu A):** największy diff z trzech
wariantów — trzeba pogodzić dwie różne bramki (`treatyBaseFairnessGap` dla traktatu,
`handelFairnessGate` dla wymiany surowców), zawężone do baz traktatowych, żeby PW nie
przenikało do niepowiązanych umów na tym samym stole.

## Powiązane, do domknięcia przy okazji (niezależny bug, osobne zgłoszenie)
`BUG-PAKIET-INCOMING-CZESCIOWA-AKCEPTACJA` (znalezisko Sędziego) — dla pakietów przychodzących
panel dziś aktywuje przycisk na sumie, ale wykonanie per-id odrzuca pojedyncze pozycje →
pakiet stosuje się częściowo. Ten sam mechanizm naprawy (agregacja na poziomie stołu) powinien
to naturalnie zamknąć — do potwierdzenia przy implementacji.

## Wdrożenie
`gra/src/game/diplomacy-proposals.ts` (`treatyBaseFairnessGap` i wywołujący go
`evaluateProposal`), `gra/src/main.ts` (`handleNegotiationAcceptPackage` — agregacja PW całego
stołu zamiast per-`id`), `gra/src/ui/diplomacyAcceptanceBalance.ts` (spójność panelu z nową
logiką bramki).

## Status
WDROŻONE w kodzie (patrz `dyspozycje/REJESTR-PROSB-I-ZADAN.md` za commit).
