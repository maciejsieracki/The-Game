# R-FENICJA-SKARB-CAP-Q1 — mnożnik Skarbu Fenicjan ×11,4

**Status:** 🟢 **ZAMKNIĘTA — FAŁSZYWY ALARM** (2026-08-06, analiza AutoBot Operator→Evaluator)

## Sytuacja

Łańcuch bonus handlu × Waluta × Mennica dla Fenicjan może dać ×11,4, znacznie powyżej standardowego ×4
uznanego gdzie indziej za zamierzone maksimum (`civs.json`, `STAN-PRACY-HANDOFF.md:499,614`).

## ECHO

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-FENICJA-SKARB-CAP-Q1** | **A** | Najpierw zbadać realny scenariusz w grze (czy ×11,4 wymaga wszystkich warunków naraz w praktyce nieosiągalnych, czy jest łatwo osiągalne) — ZERO zmian w kodzie/danych na tym etapie. Wynik badania wraca jako podstawa do kolejnej decyzji (cap czy nie). |

## Wynik analizy (2026-08-06)

**×11,4 to nieaktualny artefakt kodu SPRZED refaktoru „Efekt 1 SCALONY" (2026-07-25, `4ecb8683` vs stan po
refaktorze).** Przed refaktorem Waluta i Mennica mnożyły NIEZALEŻNIE (dwa osobne mnożniki:
`1,62 × 1,35 × 2,6 (Waluta) × 2,0 (Mennica, osobno, easy) = 11,37 ≈ ×11,4`) — dokładnie odtworzone z historii
gita, commit `5a7db56`. Refaktor 2026-07-25 połączył Walutę+Mennicę w JEDNĄ bramkę AND z jedną wartością
mnożnika — dubel już nie istnieje w dzisiejszym kodzie. `STAN-PRACY-HANDOFF.md` po prostu nie zostało
zaktualizowane po tej zmianie.

**Realny szczyt dziś:** ×5,79 (normal) / ×7,46 (easy) / ×4,30 (hard) — osiągalny w normalnym toku gry
(Waluta = tier 6/6 epoki Brąz, środek-koniec epoki, nie exploit turn-1). Fenicjanie są wyraźnie #1 wśród
15 cywilizacji (+27% nad 2. miejscem, Harappa), ale to realna, umiarkowana przewaga balansowa unikalnej
cywilizacji — nie exploit.

**Wdrożenie:** brak — zero zmian w kodzie/danych. Jedyna pozostała kwestia (kosmetyczna, opcjonalna):
czy przyciąć `civHandelMult` Fenicjan (1,35→np. 1,20) dla wyrównania z Harappa/Grecy — osobna, niepilna
decyzja balansowa, nie naprawa buga.
