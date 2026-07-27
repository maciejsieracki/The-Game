# R-DYP-STOL-A — pełny stół negocjacyjny dyplomacji

**Status:** 🟢 **ZAMKNIĘTE** (zakres docelowy)  
**Data:** 2026-07-27  
**Odpowiedź:** **B + C**

## Cytat Macieja

> R-DYP-STOL-A: **B + C** — AI inicjuje propozycje w audiencji ORAZ pełny koszyk `diplomacyTradeBasket` dla wszystkich typów traktatów.

## Implikacja

### B — AI inicjuje propozycje w audiencji

- Propozycje AI trafiają na `negotiationTable` i są rozstrzygane **na żywo** w oknie audiencji (bez czekania do tury AI).
- Gracz widzi wpis przychodzący, może przyjąć / odrzucić / składać kontrofertę.
- Powiązane: `R-DYP-NEGOCJACJE-NA-ZYWO` (🟢 wdrożone).

### C — pełny koszyk handlu dla wszystkich traktatów

- Każdy typ traktatu z wymianą warunków (nie tylko umowa handlowa + dar) ma używać **`diplomacyTradeBasket`** zamiast uproszczonych formularzy.
- Dotyczy m.in.: sojusz, pakt o nieagresji, wasalizacja, trybut, handel surowcem cykliczny — o ile akcja niesie payload wymiany.

## Stan kodu (audyt 2026-07-27)

| Element | Stan | Dowód |
|---------|------|-------|
| `negotiationTable` + save/load | ✅ | `main.ts` ~4829, ~15955, ~20335 |
| AI → stół (`enqueueNegotiationFromAiCmd`) | ✅ | `main.ts` ~9074 |
| Rozstrzyganie na żywo w audiencji | ✅ | `resolveNegotiationEntryAt`, `diplomacyAudience.ts` |
| Kontroferta gracza + generator AI | ✅ | `diplomacy-proposals.ts` `generateCounterOffer` |
| Koszyk tylko akcje **5** (handel) i **13** (dar) | ❌ | `diplomacyTradeBasket.ts` `TRADE_BASKET_ACTION_IDS` |
| Sojusz **3**, pakt **2**, wasal **12**, pokój **10**, wojna **11** | ❌ | `diplomacyNegotiationModal.ts` — osobne formularze |
| Quick-deal auto-uczciwa propozycja | ✅ częściowo | `openQuickDealBasket` — tylko handel/dar |

**Werdykt kodu:** **CZĘŚCIOWO** — B w dużej mierze jest; C wymaga rozszerzenia koszyka na pozostałe akcje dyplomatyczne.

## Co dalej

Wdrożenie na **`działaj`**: rozszerzyć `actionUsesTradeBasket` / mapowanie akcji audiencji; ujednolicić payload traktatów przez koszyk; testy `diplomacy-proposals` + smoke audiencji.
