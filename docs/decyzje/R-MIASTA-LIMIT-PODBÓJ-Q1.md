# R-MIASTA-LIMIT-PODBÓJ-Q1 — limit zakładania a miasta zdobyte

**Status:** 🟢 **ECHO A — zamknięte bez zmiany kodu**
**Data:** 2026-08-18

## Decyzja właściciela

**A** — limit liczby miast dotyczy wyłącznie miast założonych. Miasta zdobyte
w wojnie nie zużywają tej puli i nie są przez nią blokowane.

## Dowód rozpoznania

- `canFoundCity()` stosuje limit przy zakładaniu miasta gracza i AI.
- Ścieżki podboju `applyCityCaptureToMap`, `captureCityWithoutBattle` oraz
  kapitulacji nie używają tego limitu jako bramki.

## Kontrakt

- nie dodawać limitu miast do ścieżek podboju;
- nie tworzyć osobnej puli miast zdobytych bez nowej decyzji;
- UI powinno nazywać obecny parametr limitem **miast zakładanych**;
- ewentualny problem z podbojem diagnozować osobno: obrońcy, mury, widoczność,
  zasięg, ścieżka AI lub inna bramka capture.
