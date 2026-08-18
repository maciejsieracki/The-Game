# R-KAMIEN-RELIEF-FOLLOWUP-Q1 — relief wzgórza dla kopalń

**Status:** ✅ **ZDEPLOYOWANA / ZAMKNIĘTA** · **A** + reguła · FALA 296 ROBOCZA `a37f7123` (2026-08-18)
**Cytat Macieja:** „Dodać legacy `kopalnia` do `PRESERVES_HILL_RELIEF_KEYS` **ORAZ** zasada: **wszystkie kopalnie (obecne i przyszłe)** zachowują relief wzgórza — nie tylko legacy"  
**Źródło:** [`ABC-PACZKA-2026-08-06-KOLEJKA.md`](ABC-PACZKA-2026-08-06-KOLEJKA.md) · follow-up po `R-KAMIEN-RELIEF`

## ECHO

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-KAMIEN-RELIEF-FOLLOWUP-Q1** | **A** + reguła | Rozszerzyć whitelistę reliefu o legacy `kopalnia` oraz **utrwalić regułę produktową**: każda kopalnia (istniejąca i przyszła) zachowuje naturalny kopiec wzgórza/góry — jak kamieniołom. |

## Reguła produktowa (obowiązkowa)

> **Wszystkie kopalnie — obecne i przyszłe** — muszą być na whiteliście `PRESERVES_HILL_RELIEF_KEYS` (lub równoważnym mechanizmie). Nowy typ kopalni w danych = automatycznie relief zachowany; **nie tylko** legacy `kopalnia`.

## Skutek (1–3 zdania)

Ulepszenie kopalni na wzgórzu nie spłaszcza terenu — model siada na kopcu jak kamieniołom. Jednolinijkowy fix dla `kopalnia` legacy plus dokumentacja/komentarz reguły „wszystkie kopalnie teraz i przyszłe". Zero zmiany ekonomii; tylko render/sync dekoru heksu.

## Wdrożenie

Zrealizowane w commicie `85932371c8d94be43111b725876fd5f52f26c2a5`:
predykat prefiksu `kopalnia` / `kopalnia_*` zachowuje relief także dla
przyszłych typów kopalń. Commit jest przodkiem aktualnego `main` oraz źródła
FALI 296 (`a6e2967f`), a ROBOCZA FALA 296 ma md5 `a37f7123`.

## Dowód wcześniejszego Evaluatora i wdrożenia (korekta 2026-08-18)

- AutoBot Operator → Evaluator: **PASS-WITH-NOTES** (zapis w commicie
  `85932371`; niezależne zsynchronizowanie statusu w `cd4399df`).
- Zakres bramek z wcześniejszej weryfikacji: `tsc --noEmit` 0,
  `deposit-building-gate-test` 47/47, Vite 792 moduły.
- Po scaleniu/deployu FALI 296 nie ma już statusu „branch roboczy, nie main”:
  wcześniejsza nota z 2026-08-06 jest historyczna, nie opisuje stanu bieżącego.
