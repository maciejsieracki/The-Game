# DYSPOZYCJA-85-SUWAK — globalny podział Daniny vs override per miasto

**Status:** 🟢 **ZAMKNIĘTE**  
**Data:** 2026-07-27  
**Odpowiedź:** **C** — globalny domyślny podział Daniny/Handel + opcjonalny override per miasto

## Cytat Macieja

> DYSPOZYCJA-85-SUWAK: **C** — globalny domyślny podział Daniny/Handel + opcjonalny override per miasto.

## Implikacja

- Gracz ustawia **jeden domyślny** podział Skarb / Nauka / Zamożność na poziomie **imperium** (cywilizacji).
- Nowe miasta dziedziczą ten podział.
- Każde miasto może mieć **opcjonalny override** (własny suwak) — gdy brak override, obowiązuje globalny.
- Dotyczy podziału **Daniny/Podatku** (dawny „Handel" z pól), nie handlu międzynarodowego ze szlaków (osobna dyspozycja 85).

## Stan kodu (audyt 2026-07-27 → wdrożenie)

| Element | Stan | Dowód |
|---------|------|-------|
| Suwak per miasto + override | ✅ | `cityPanel.ts` — checkbox „Własny podział…" |
| **Stan globalny gracza** | ✅ | `main.ts` — `ownerDefaultPodzialHandlu` + save/load |
| **Panel imperium** — domyślny podział | ✅ | `empireDetailPanel.ts` — `configureEmpireHandelSplit()` |
| **Flaga override per miasto** | ✅ | `cities.ts` — `podzialHandluOverride` |
| Resolve efektywny podział | ✅ | `empire-handel-split.ts` — `resolveCityPodzialHandlu()` |
| Ekonomia z mapą owner defaults | ✅ | `turn-economy.ts` — `ownerDefaultPodzialHandluByOwner` |
| AI: polityka imperium | ✅ | `main.ts` — `decideAIEconomySliders` |

**Werdykt kodu:** ✅ **ZGODNY** z opcją C (subagent [DYSPOZYCJA-85 suwak C](efcb9c89-61c0-408b-a2da-b20b49699ce9)).

**Deploy:** ⏸ lokalnie gotowe — wire `main.ts` + fix `empireDetailPanel.ts` **niecommitowane**; wejdzie w **FALA 38** po sygnale Macieja.

## Co dalej

Wdrożenie na **`działaj`** (lane B/E): stan `ownerDefaultPodzialHandlu` + UI (panel imperium lub miasta „użyj domyślnego"); migracja zapisów; nowe miasta = kopia globalnego.
