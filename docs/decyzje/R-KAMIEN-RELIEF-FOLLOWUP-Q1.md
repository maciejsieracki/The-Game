# R-KAMIEN-RELIEF-FOLLOWUP-Q1 — relief wzgórza dla kopalń

**Status:** 🟡 **ZAPISANA** · **A** + reguła (2026-08-06)  
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

Czeka na hasło **`działaj`** → AutoBot Operator (🟢 izolowana warstwa renderu).
