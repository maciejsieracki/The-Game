# B4 — Wealth i skarbiec

| Pole | Wartość |
|------|---------|
| **ID** | B4 |
| **Czat** | Civ — T-B4 Wealth |
| **Ekran** | **Panel miasta** + **HUD mapy świata** (skrót) |
| **Status** | **ZAMKNIĘTE** (D3=A + UI Wealth 2026-06-26; **B4-Q1=A**, **B4-Q2=A** 2026-06-27) |
| **Było w „10”** | T6 |

---

## Co decydujesz — rozstrzygnięte

| Temat | Decyzja | Uwaga |
|--------|---------|-------|
| **D3 Wealth scope** | **A** — pełny model (pula luksusu → poziom W → mnożnik) | KARTA, wpięte częściowo w main |
| **Suwak Społeczeństwo / Wealth** | **A** — żywe suwaki, % per miasto | `MACIEJ-DECYZJE-WEALTH-UI` #1 |
| **Panel Wealth w mieście** | **A** — pełny blok: W, pula, próg, mnożnik, wpływ na szczęście | #4 |
| **HUD mapy** | Skrót / placeholder — **nie mylić z „Złotem” na pasku** | Złoto = skarbiec imperium; Wealth = osobna warstwa D3 |
| **Kultura w panelu (B4-Q1)** | **A** — pełna sekcja v1.0: suma, +/turę, progi granic, źródła |
| **Religia w panelu (B4-Q2)** | **A** — w tej samej sekcji co kultura: wyznawcy, dominacja, wpływ na Sz |

---

## Rozróżnienie (ważne dla Macieja)

| Na ekranie | Co to |
|------------|-------|
| **Złoto / Pieniądz** (górny pasek mapy) | Skarbiec imperium, przyrost/turę (Q2=B) |
| **Wealth (W)** | Luksus → pula → poziom → mnożnik na dochód; głównie **panel miasta** |
| **Wpływ** | Osobny zasób polityczny na HUD |

---

## Lane / pliki

- `gra/src/game/wealth.ts`, `turn-economy.ts`, `cities.wealthState`
- `cityPanel.ts` — sekcja Wealth
- `hud.ts` — placeholder D3 (po akceptacji mockupu D1B)

## Powiązania

- `docs/MACIEJ-DECYZJE-WEALTH-UI_2026-06-26.md`
- `docs/MACIEJ-KARTA-DECYZJI.md` — D3=A
