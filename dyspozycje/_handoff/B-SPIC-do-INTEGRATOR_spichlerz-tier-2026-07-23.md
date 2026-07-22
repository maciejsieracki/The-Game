# B → INTEGRATOR — Spichlerz two-tier (B-SPIC-Q1…Q5)

| Pole | Wartość |
|------|---------|
| **Data** | 2026-07-23 |
| **Decyzje** | `docs/decyzje/B-SPIC-2026-07-23.md` |
| **Kanon** | `dyspozycje/SUROWCE-KANON-2026-07-22.md` § Spichlerz two-tier |
| **Warstwa** | 🟡 cross (buildings.json, production, turn-economy, cityPanel) |
| **Status handoffu** | 🟡 ZAPISANE — **nie wdrażać** bez `działaj` od Macieja |

## Co przesyłam

Maciej zamknął paczkę Spichlerz (literki **myliły się** z B-KULT-REL — korekta w rejestrze):

| ID | Maciej | Skrót |
|---|---|---|
| B-SPIC-Q1 | **C** | Tier II: cap **150** + bufor **70%** + Zd/Sz lokalnie |
| B-SPIC-Q2 | **A** | Bonus soli tylko miasto ze **Spichlerzem II** |
| B-SPIC-Q3 | **A** | Budynki lokalnie; surowce z aktywnego dostępu imperium |
| B-SPIC-Q4 | **A** | Upgrade II przez **kolejkę produkcji** |
| B-SPIC-Q5 | **B** | Infrastruktura bez Sz/Zd; reszta z bonusami |

## Co Odbiorca ma zrobić (plan — po `działaj`)

1. **Dane:** rozdzielić `spichlerz` → tier I / II w `buildings.json`; bramka I = ceramika, II = upgrade + sól aktywna.
2. **Ekonomia:** cap 100→150, bufor 50%→70% per tier II; bez zmiany % odkładania armii (100%).
3. **Produkcja:** upgrade I→II jako pozycja kolejki (B-SPIC-Q4).
4. **Bonusy:** Q2/Q3/Q5 — lokalne vs imperium wg tabeli w `B-SPIC-2026-07-23.md`.
5. **UI:** etykiety „Spichlerz — zbór" / „konserwowany".

## DoD

- Testy spichlerz / empire-food zielone po tierach.
- Brak regresji B5-SPICH (rekrutacja nie blokowana).
- `REJESTR-DECYZJI` → 🟢 po wdrożeniu.

## Flaga

**CZEKA** — dokumentacja skorygowana 2026-07-23; implementacja **nie** w tej sesji.
