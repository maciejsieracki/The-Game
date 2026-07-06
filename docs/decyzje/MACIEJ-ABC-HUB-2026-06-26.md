# Maciej — ABC hub (2026-06-26)

| ID | Decyzja | Status | Lane | Uwagi |
|----|---------|--------|------|-------|
| **UI-SPRINT-1** | **Wstrzymanie** zmian UX / brand book w kodzie | ⚪ ODŁOŻONE | E+UI | „Na razie wstrzymujemy się ze zmianami UX" — bez sprintu A/B/C |
| **REMIND-START** | **A** — złoże rezerwuje hex (brak ulepszenia gracza na złożu) | 🟡 ZAPISANA | A+B | → handoff MAPA + EKONOMIA |
| **P-C2** | **B** — pkt za bitwę ważone siłą pokonanego | 🟡 ZAPISANA | B+D | **Gate:** testy + przeliczenie kalibracji 3020 · **P-C2-DEF** osobno |
| **P-ARMIA** | **B** — suma siły bojowej jednostek (jak walka) | 🟡 ZAPISANA | B+D | Po testach P-C2; spójność z formułą oblężenia |
| **D3-CONFIRM** | **A** — potwierdza **pełny Wealth v1.0** (karta D3=A) | 🟡 ZAPISANA | B+UI | Wdrożenie pełnego modelu W, nie minimalny |

---

## UI-SPRINT-1 — wstrzymanie

**Maciej (dosłownie):** „1 na razie wstrzymujemy się ze zmianami ux."

Brak litery A/B/C — **stop** na brand book → kod (menu/HUD/tokeny). Decyzje Warstwa 1 (1B–8A) zostają w docs; implementacja UI **nie startuje**.

---

## REMIND-START — **A**

**Maciej:** `2a` → **A** — twarda separacja: hex ze złożem nie przyjmuje ulepszenia gracza.

---

## P-C2 — **B*** (kierunek + warunki)

**Maciej:** `3 b` — ważone siłą pokonanego, **ale:**

> Trzeba zrobić na tym **testy i przeliczyć**, żeby nie było takich sytuacji, że nagle jedna wygrana bitwa spowoduje jakąś gimnastyczną moc danego gracza.

> Jest też pytanie **co to oznacza wygrana mniejsza/większa armia** — od czego ma zależeć? **Oddzielnie to rozstrzygniemy.**

**Implementacja P-C2=B:** dopiero po:
1. **P-C2-DEF** — osobne ABC definicji „wygranej" (rozmiar armii? siła bojowa? ratio?)
2. **Testy kalibracji** — scenariusze bez skoku Mocy > X% po jednej bitwie; retuning progów Respekt 60/70/90 jeśli trzeba

---

## P-ARMIA — **B**

**Maciej:** `4b` — składnik Armia = suma siły bojowej (spójnie z walką).

Wdrożenie razem z batch P-C2 po teście kalibracji (wspólna formuła siły).

---

## D3-CONFIRM — **A**

**Maciej:** `5a` — **pełny Wealth v1.0** obowiązuje (potwierdzenie karty D3=A).

Pełny model: suwak Społeczeństwo, poziom W, mnożnik Skarbca, wpływ na szczęście — `docs/decyzje/B4-wealth.md`.
