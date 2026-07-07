# Tempo badań — mnożnik kosztu nauki (2026-07-07)

**Decyzja Macieja:** „Badania idą zdecydowanie za szybko.”

Bazowe wartości `Koszt nauki` w `tech.json` zostają bez zmian — to **tempo szybkie (×1)**. Prędkość gry w kreatorze mnoży wymagane punkty nauki:

| Ustawienie kreatora | Klucz `tempoGry` | Mnożnik kosztu |
|---|---|---|
| Szybka | `szybka` | ×1 |
| Standardowa | `standardowa` | ×2 |
| Długa | `dluga` | ×4 |

Implementacja: `applyTempoKoszt()` w `gra/src/game/tech-tempo.ts`, wywoływana przy ukończeniu tech (`playerState.ts`), HUD, drzewku badań i dyplomacji. `tempoGry` zapisywane w sejwie (`gracz.tempoGry`).

Przykład: **Obróbka drewna** (bazowy koszt 12 PN) → szybka 12 / standardowa 24 / długa 48 PN.
