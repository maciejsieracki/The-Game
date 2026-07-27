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

## Stan kodu (audyt 2026-07-27)

| Element | Stan | Dowód |
|---------|------|-------|
| Suwak per miasto `city.podzialHandlu` | ✅ | `cities.ts`, `cityPanel.ts` |
| Domyślne wartości z `econ-params` przy normalizacji | ✅ | `turn-economy.ts` `suwaakHandel*Default` |
| Stałe `DEFAULT_PODZIAL_HANDLU` (20/60/20) przy founding | ✅ | `cities.ts` ~61 |
| **Stan globalny gracza** (edytowalny suwak imperium) | ❌ | brak w `main.ts` / HUD / panelu imperium |
| **Flaga override per miasto** | ❌ | każde miasto ma własny zapis bez „użyj globalnego" |
| AI: polityka imperium na wszystkich miastach | ✅ | `main.ts` ~17368 (wzór do naśladowania dla gracza) |

**Werdykt kodu:** **ROZBIEŻNOŚĆ** — jest tylko per-miasto + stałe z JSON; brak globalnego domyślnego suwaka gracza z opcjonalnym override.

## Co dalej

Wdrożenie na **`działaj`** (lane B/E): stan `ownerDefaultPodzialHandlu` + UI (panel imperium lub miasta „użyj domyślnego"); migracja zapisów; nowe miasta = kopia globalnego.
