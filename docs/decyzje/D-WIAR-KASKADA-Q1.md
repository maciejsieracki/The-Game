# D-WIAR-KASKADA-Q1 — Kara W przy kaskadzie sojuszniczej w obronie ofiary

**Status:** 🟢 **WDROŻONA** (kod `gra/src`, bez deployu w tej sesji)  
**Grupa:** D (dyplomacja / wiarygodność)  
**Powiązane:** N2 w `WIARYGODNOSC-SPECYFIKACJA.md` · `applyAllianceObligationsOnWar` · C-WIAR-N4=B

## Odpowiedź Macieja

> **B** (2026-07-29) — **Odwet sojusznika:** gdy gracz atakuje B, sojusznik C ofiary wchodzący w obronę (wymuszone wypowiedzenie wojny agresorowi) **nie traci Wiarygodności** za zerwanie NAP/sojuszu z agresorem. Gracz nadal **nie** dostaje kary W za pośrednio zerwane umowy z C.

## Co to znaczy w grze

| Element | Zasada |
|---|---|
| **Scenariusz** | A atakuje B → sojusznik C ofiary (defensywny lub pełny) musi wypowiedzieć wojnę A |
| **N2 (−18 NAP / −25 sojusz)** | **Brak** dla C w tym wymuszonym joinie |
| **Zerwanie traktatów** | Nadal — NAP/sojusz C↔A się zrywa (`breakTreatiesOnWar`) |
| **N4 (−15)** | Bez zmian — odmowa pomocy sojusznikowi nadal karana |
| **Agresor (gracz A)** | Nie dostaje kary W za pośrednie zerwanie umów z C (N2 dotyczy tylko deklarującego wojnę) |
| **Pełny sojusz agresora** | Sojusznik A atakującego B (wojna z B) — **N2 nadal** (nie jest to obrona ofiary) |

## Rozpoznanie w kodzie

`isDefensiveAllianceWarObligation(mustDeclareWarOn, attackerId)` w `diplomacy-treaties.ts`:

- obowiązek z eventu `attacked` → `mustDeclareWarOn === aggressorOwnerId`
- obowiązek z eventu `declared_war` (pełny sojusz agresora) → `mustDeclareWarOn === victimId` → **nie** exempt

`chargeWarDeclarationCredibility(..., { skipN2AllianceDefense })` w `main.ts` — wołane z `applyAllianceObligationsOnWar` przed `breakTreatiesOnWar`.

## Odrzucone warianty

- **A** — kaskada zawsze nalicza N2 (status quo)
- **C** — inna reguła (nie zapisana w tej decyzji)
