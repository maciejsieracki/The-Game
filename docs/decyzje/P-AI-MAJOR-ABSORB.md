# P-AI-MAJOR-ABSORB — absorpcja AI major → major

**Status:** 🔵 W TRAKCIE (ECHO 2026-08-05) → Faza 1 wdrożenie  
**Powiązane:** `MP-DIPLO-Q1` · `R-AI-MP-WASAL-WCHLONIECIE` · `P-AI-MOC-GAP`

## ECHO (Maciej 2026-08-05)

> P-AI-MAJOR-ABSORB-Q1 c / P-AI-MAJOR-ABSORB-Q2 c / P-AI-PROD-GATE-Q1 a

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **Q1** | **C** | Tylko **Trudny** + warunek siły (Ł/N bez zmian) |
| **Q2** | **C** | **Faza 1:** tylko same-civ · **Faza 2:** dowolny major (osobna decyzja / późniejsza fala) |

## Faza 1 (teraz) — AC

1. Tylko gdy trudność gry = **hard**.
2. Tylko para **major AI ↔ major AI** (nie gracz, nie MP, nie barb).
3. Tylko **ta sama kultura / typ cywilizacji** (`sameCiv`).
4. Warunek siły: stosunek Mocy (lub military ratio — spójnie z istniejącym helperem) ≥ próg (propozycja startowa **1,25**, jak `instantAnnexIfRatio` hard MP; parametryzuj).
5. Min. tura (propozycja **10**, jak MP hard).
6. Akcja: **instant annex / wchłonięcie** miast ofiary do agresora (jak `annexCityStateToOwner`, ale major→major) — **bez** pełnej ścieżki trybut/wasal na Faza 1.
7. **ZAKAZ** wchłaniania gracza · **ZAKAZ** na easy/normal.
8. Pure helper + testy (happy / edge: easy=no, different civ=no, weak ratio=no, player=no) · STRICT-PARITY: nie `ownerId===0` w logice absorb (gracz wykluczony predykatem major).
9. STRICT-SAVE: jeśli nowe mapy stanu (np. cooldowns) — snapshot/restore + default; preferuj zero nowych pól jeśli wystarczy runtime.

## Faza 2 (NIE teraz)

Dowolny major AI — wymaga osobnego ABC / sygnału Macieja.

## Po PASS

Deploy FALA (razem z PROD-GATE jeśli w tym samym batchu).
