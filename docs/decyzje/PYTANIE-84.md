# PYTANIE 84 — Budynki zależne od złoża / dostępu

**Status:** 🟡 **ZAPISANA** (model hybrydowy — czeka wdrożenie)  
**Data:** 2026-07-27

## Status wdrożenia (dla innych agentów)

| Etap | Stan |
|------|------|
| **Sesja** | 🔧 **Czat ABC** — decyzja zapisana; **czeka `działaj`** na kod |
| **Kod `gra/src`** | ❌ **brak** — runtime gate dostęp vs magazyn |
| **Deploy `gra-robocza`** | — |
| **Indeks** | `STATUS-WDROZEN-AGENT-2026-07-27.md` |

## Pytanie (oryginał ABC)

Czy budynki powiązane ze złożem zasypiają bez dostępu jak Mennica (A), zużywają magazyn państwa (B), czy zostają jak dziś (C)?

## Odpowiedź Macieja

> **hybryda** (2026-07-27) — nie czyste A/B/C:

> Część surowców jest odkładana w skarbcu państwa — te budynki działają wg **reguły B** (czerpią z magazynu, zasypiają gdy zapas się skończy; mogą pracować chwilę po utracie kopalni, dopóki jest zapas).  
> Tam gdzie budynek ma **tylko dostęp** (jak Mennica, Sól, Konie) — przy braku dostępu **natychmiast zasypia** (reguła dostępu / jak Mennica dziś).  
> Po zerwaniu dostępu: **brak produkcji od razu** dla dostępu; dla magazynowanych — produkcja trwa do wyczerpania zapasu.

### Reguła **DOSTĘP** (uśpienie natychmiast)

- Mennica (Złoto)
- Spichlerz II / Sól
- Koń (stadnina / dostęp — jak w grze)
- Inne etykiety `ACCESS_ONLY` (dziś w kodzie: **Sól**, **Złoto**)

### Reguła **MAGAZYN PAŃSTWA** (reguła B)

- Stolarnia → Drewno
- Warsztat kamieniarski → Kamień
- Kuźnia → Ruda
- Garncarnia / Cegielnia → Glina
- Spichlerz → Ceramika (jeśli magazynowana — do doprecyzowania przy wdrożeniu)
- Surowce trafiające do `ownerResourceStock` / skarbca państwa

**Zużycie:** budynek może produkować, dopóki w magazynie państwa jest wystarczający surowiec (tabela zużycia/turę — **do ustalenia przy implementacji**). Po wyczerpaniu — uśpienie.

## Stan kodu dziś

| Element | Stan |
|---------|------|
| Bramka **budowy** deposit-linked | `building-resource-gate.ts` — `empireLabelSatisfied` (zapas OK przy budowie dla magazynowanych) |
| `ACCESS_ONLY_RESOURCE_LABELS` | Sól, Złoto — bez zapasu przy bramce |
| Runtime **Mennica** | `ownerHasZlotoAccessNow` — działa co turę (pytanie 83B) |
| Runtime **pozostałe budynki** | **brak** — tylko bramka przy budowie |

## Następny krok

Wdrożenie po `działaj`: runtime gate per typ (dostęp vs magazyn) + ewent. zużycie X/turę dla reguły B.
