# D3-TRUST-TICK — naturalne budowanie Zaufania + trwały handel surowcami (2026-07-21)

**Decydent:** Maciej  
**Status:** ZAMKNIĘTE — wdrożone  
**Lane:** D (dyplomacja) + Integrator (main.ts)

## Cytat decyzji

> Per-turowe Zaufanie: sojusz **+3**, NAP **+2**, pokojowy kontakt **+1** (wzajemnie wykluczające tiery).  
> Umowa handlowa z dostępem do surowców/złóż = **trwały** ActiveDeal (+1 Zaufanie/turę stackuje z tierem pokoju).  
> Jednorazowy handel ¤/PN bez surowców — bez zmian (one-shot).

## Stacking (implementacja)

| Warstwa | Δ Zaufanie/turę | Warunek | Wyklucza |
|---------|-----------------|---------|----------|
| **Sojusz** | +3 | aktywny sojusz defensywny/pełny | NAP, pokój |
| **NAP** | +2 | aktywny PaktNieagresji | pokój |
| **Pokój** | +1 | kontakt nawiązany, brak wojny, brak NAP/sojuszu | — |
| **UmowaHandlowa** | +1 | aktywny RodzajTraktatu.UmowaHandlowa | **stackuje** z tierem pokoju |

Helper: `resolvePokojTrustTier()` w `diplomacy-treaties.ts` · tick: `tickDiplomacy()` w `diplomacy.ts`.

## Handel surowcami — pełne vs stub

| Element | Status |
|---------|--------|
| Ocena propozycji z `zloze` / `surowiec_boolean` → UmowaHandlowa | ✅ pełne |
| Czas trwania 10–20 tur (jak NAP) | ✅ pełne → **1–20 tur** (dowolnie, Maciej 2026-07-21) |
| +1 Zaufanie/turę przez `aktywnyHandel` | ✅ pełne |
| Grant `ZlozeGrant` przy akceptacji (hex + dealId) | ✅ pełne |
| Wygaszenie grantów przy expire/war/break deal | ✅ pełne |
| Jednorazowy transfer ¤/Praca/żywność w tej samej umowie | ✅ przy akceptacji |
| **Per-turowe odnowienie dostępu** (np. żywność co turę) | ⏸ stub — brak silnika recurring basket |
| **surowiec_boolean** w produkcji miasta | ⏸ częściowe — grant istnieje, integracja z `resource-access.ts` jak wcześniej |
| Czysty handel PN/¤ bez surowców | one-shot (bez zmian) |

## Czas trwania umowy handlowej (Maciej 2026-07-21, dopisek)

- Gracz wybiera **1–20 tur** (koszyk handlu, gdy w ofercie jest dostęp do surowców/złóż).
- `wygasaTura = turn + clampDealTurns(payload.turns)` — brak auto-odnowienia; po wygaśnięciu re-negocjacja.
- UI: `diplomacyTradeBasket.ts` (pole „Czas umowy"); hint w `diplomacyNegotiationModal.ts`.

## Pliki

- `gra/data/diplomacy.json` — `sojusz_zaufanie_perTura`, `nap_zaufanie_perTura`, `pokoj_zaufanie_perTura`
- `gra/src/game/diplomacy.ts` — `TickCtx.pokojTrustTier`, `tickDiplomacy`
- `gra/src/game/diplomacy-treaties.ts` — `handelPayload`, `resolvePokojTrustTier`
- `gra/src/game/diplomacy-proposals.ts` — `proposalHasResourceAccess`, handel → UmowaHandlowa
- `gra/src/main.ts` — tickCtx, applyProposalOutcome, expire grantów
- Testy: `diplomacy-test.cjs`, `diplomacy-proposal-test.cjs`

## Powiązane

- `docs/decyzje/D3-PROG-DIFF-2026-07-21.md`
