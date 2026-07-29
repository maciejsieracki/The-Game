# D-DYPLO-PW-NAZWA — nazwa „punkty wymiany” (PW)

**Status:** ZAMKNIĘTE (Maciej 2026-07-29)  
**Cytat:** „punkty wymiany”

## Decyzja

W UI dyplomacji (stół negocjacji, koszyk handlu, statusy bilansu) widoczna nazwa:

- **Punkty wymiany** (nagłówek panelu bilansu)
- skrót **PW** (zamiast PN) przy wartościach liczbowych

Wewnętrzne nazwy kodu (`pn`, `acceptancePoints`, `offerPn`) **bez zmian** — tylko etykiety gracza.

## Tooltip (nagłówek + skrót PW)

Po najechaniu na „Punkty wymiany” / „PW”:

- Punkty wymiany mierzą bilans oferty na stole negocjacji.
- „My oddajemy” vs „Oni oddają” — dodatni bilans = możesz coś wyciągnąć / przyjąć; ujemny = trzeba dopłacić (surowce, ¤, ustępstwa).
- Nie mylić z walutą ¤ ani złotem-surowcem.

## Zakres UI

`diplomacyAcceptanceBalance.ts`, `diplomacy-acceptance-points.ts` (statusLabel), `diplomacyTradeBasket.ts`, `diplomacy-display.ts`, `diplomacy-proposals.ts` (reason), `diplomacyNegotiationModal.ts`, `main.ts` (hinty stołu).

**Poza zakresem:** PN nauki (drzewko technologii) — inna mechanika.

## Powiązane

- `docs/decyzje/HANDEL-PUNKTY-AKCEPTACJI.md` (katalog wartości — historycznie „PN akceptacji”)
