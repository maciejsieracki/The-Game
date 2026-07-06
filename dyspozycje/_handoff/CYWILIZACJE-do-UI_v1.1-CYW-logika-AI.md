# CYWILIZACJE (v1.1): logika akcji + akceptacja AI — zakres lane

> **Status:** **→ UI / SILNIK: GOTOWE (moduł CYW)**  
> **Nie blokuje v1.0**

---

## Co już jest (v1.0/v0.1)

| Moduł | Stan |
|-------|------|
| `applyDiplomaticEvent` | 20+ eventów (wojna, pokój, handel, trybut, pakt…) |
| `aiDiplomacyStance` | willingnessAlly, willingnessTrade, progi Zaufanie/Respekt |
| `decideAIDiplomacy` | wojna, pokój, trybut, **stub** sojusz (komenda bez pełnej gry) |
| `tickDiplomacy` | per-tura Zaufanie (handel, pakt, religia…) **gdy są traktaty** |

---

## Co CYW doda v1.1 ✅ (2026-06-30)

Plik: `gra/src/game/diplomacy-proposals.ts`

Wejście: propozycja gracza (z UI) + relacja + `aiDiplomacyStance` + archetyp z Excela.

| Akcja | Logika akceptacji (propozycja) |
|-------|--------------------------------|
| NAP | Zaufanie ≥ 40; odmowa jeśli wojna lub ekspansja przy granicy |
| Sojusz | `willingnessAlly` + Zaufanie ≥ 60; T2A: tylko jeśli wspólny wróg lub rw 0.4–0.7 |
| Trybut żądanie | AI akceptuje gdy **Respekt partnera > Respekt AI** (słabszy płaci) |
| Trybut oferta | AI akceptuje gdy blisko wojny i kwota ≥ próg |
| Handel | `willingnessTrade`; fair deal ±20% wartości |
| Namów do wojny | Zaufanie ≥ 50 + łapówka ≥ 30¤ × epoka |
| Tech sprzedaż | Zaufanie ≥ 70; cena ≥ min z `tech.json` |
| Granice | Zaufanie ≥ 45; wojskowe wymaga Respekt ≥ 55 |

### 2. AI proaktywne (rozszerzenie `decideAIDiplomacy`)

- Po wpięciu traktatów: komendy `zaproponuj_sojusz`, `zadaj_trybut` → **propozycja oczekująca** (banner w UI/HUD), nie natychmiastowy stan.
- Gracz: audiencja → akceptuj/odrzuć.

### 3. Testy

- `diplomacy-proposal-test.cjs` — 15 scenariuszy accept/reject.

---

## Handoff chain

```
CYW (evaluateProposal + treaties) 
  → UI (modale) 
  → EKO (tick pieniędzy) 
  → SILNIK (storage + save/load + endTurn)
```

**CYW NIE wpina main.ts.**
