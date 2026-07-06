# D → MASTER: GOTOWE — sojusz v1.2 · Panel-D progi · handoff UI/F

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **→ MASTER: GOTOWE** · **ACK Master 2026-07-01** · dyspozycja F P1 |
| **Data** | 2026-06-30 |
| **Od** | Grupa D (Cywilizacje / Dyplomacja / AI) |
| **Obieg** | `docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md` |
| **Plik lane** | `docs/obieg/D-cywilizacje.md` |
| **Slack** | `#grupa-d` + `#master` (outbox: `docs/obieg/SLACK-OUTBOX-D-2026-06-30.md`) |

---

## TL;DR dla Mastera

1. **Decyzja produktowa Macieja (bez ABC):** sojusz i pakiety — **silniejszy proponent ma łatwiej**, nie trudniej. Stary algorytm `partnerRw ∈ [0.4, 0.7]` **usunięty** (błąd logiczny).
2. **Kod lane D wdrożony** — `diplomacy.ts`, `diplomacy-proposals.ts`, `ai.ts`, `diplomacy.json`, `ai-params.json`.
3. **Panel-D** — 20+ progów propozycji + 9 progów AI dyplomacji + 5 parametrów premii sojuszu (eksport już w JSON).
4. **Czeka wpięcie F/UI** — `diplomacy-display.ts` (BBBB) + audiencja v2 (🟡 cross).
5. **Testy lane:** proposal **17/17**, diplomacy **140/140**. **NIE** ruszano `main.ts` / kanonu.

---

## 1. Sojusz v1.2 — nowy model (GOTOWE w lane)

| Było (błąd) | Jest (Maciej) |
|-------------|---------------|
| Silny gracz → **odrzucenie** (partnerRw < 0.4) | **Premia siły** obniża progi Zaufania / score / willingnessAlly |
| Tylko „równi” (0.4–0.7) | **Słaby** proponent (mil < 0.5, bez Respektu, score < 120) → odrzucenie |
| Hegemon AI → blokada | AI **3× silniejsze** — sojusz ✅ przy Zauf. 75 (symulacja) |

**API:** `diplomacyProposerStrengthEase()` w `gra/src/game/diplomacy.ts`

**Panel-D (nowe klucze w `diplomacy.json`):**
- `progSojuszPremiaSilniejszyMax`, `progSojuszPremiaMilSkok`, `progSojuszPremiaRespektSkok`
- `progSojuszSlabyProponentMilRatio`, `progSojuszPremiaSilniejszyInny`
- (legacy `progSojuszPartnerRwMin/Max` — deprecated, nie blokują)

**Symulacja:** `gra/tools/diplomacy-alliance-sim.cjs` · pokój: `diplomacy-peace-sim.cjs`

---

## 2. Panel-D — parametry balansu (GOTOWE)

- `getEffectiveDiplomacyParams()` — JSON Panel-D czytany przy bundlu
- `loadDefaultAIDiplomacyProgs()` — progi AI z `ai-params.json`
- Pełna mapa progów propozycji (NAP, trybut, ultimatum, handel…) — patrz meldunek w `CYWILIZACJE-DO-MASTERA.md` 2026-06-30

**Maciej:** strojenie = Panel-D.xlsx → **eksportuj panel** (bez F, dopóki tylko JSON).

---

## 3. Kolejka dla Mastera → F / UI

| Priorytet | Handoff | Warstwa | DoD |
|-----------|---------|---------|-----|
| **P1** | `CYWILIZACJE-do-INTEGRATOR_diplomacy-display-ui-batch.md` | 🟡 | UI audiencja BBBB + `main.ts` getState + build/kanon |
| **P2** | `CYWILIZACJE-do-UI_diplomacy-params-GOTOWE.md` | 🟢 UI | Rozszerzyć `diplomacyAudience.ts` |
| **P3** (opcjonalnie) | Rozszerzyć **premię siły** na NAP/handl/granice (Maciej — ten sam model co sojusz) | 🟢 | Osobny batch D po playteście |

**Sojusz v1.2** — już w modułach lane; **F nie musi pisać logiki**, tylko **zbudować kanon** po review (kod D już w `gra/src/game/*`).

---

## 4. Self-check (ISO-5)

| Check | Status |
|-------|--------|
| `main.ts` | ❌ nie edytowano |
| `Gra-podglad.html` | ❌ nie edytowano |
| `node tools/diplomacy-proposal-test.cjs` | ✅ 17/17 |
| `node tools/diplomacy-test.cjs` | ✅ 140/140 |
| Warstwa handoffu | 🟢 moduły D · 🟡 wpięcie display/UI/F |

---

## 5. Propozycja dyspozycji Mastera

1. **ACK** sojusz v1.2 + Panel-D params (lane D).
2. **Deleguj UI** — audiencja BBBB (równolegle lub przed F).
3. **Deleguj F** — jeden batch: kanon z kodem D + wpięcie `diplomacy-display` w `getState()`.
4. **Review subagent** → ACK kanon → Slack `#master` → Maciej playtest Respekt/sojusz.

**NIE prosić Macieja** o wklejanie tego meldunku w czacie Mastera.

---

**Flaga:** GOTOWE / 🟠 U MASTERA
