# C1 — Wejście w walkę (mapa świata → overlay)

**Ekran:** mapa świata (strategiczna), **nie** pole bitwy 3D.  
**Status:** **ZAMKNIĘTE (decyzje)** · **→ SILNIK: GOTOWE** (moduł UI + handoff wpiecia)  
**Było w starym numerowaniu:** brak (fragmenty T7/T8); D5 dotyka deployment.

---

## Most A2 → C1 → C2

```
A2: klik wroga / heks z jednostką
        ↓
C1: overlay preBattle — Auto / Bitwa ręczna / Wycofaj / Zapisz
        ↓
C2: scena 3D battleScene (jeśli „Bitwa ręczna”, deploy → walka)
```

**Wyjątek (C1-Q1 + C3):** atak **miasta z murem** bez szturmu → **tylko oblężenie na mapie** (C3), **bez** preBattle do momentu szturmu.

---

## Decyzje Macieja (zamknięte — nie pytać ponownie)

| Pytanie | Decyzja | Źródło / data |
|---------|---------|---------------|
| **C1-Q1** kiedy preBattle | **A** + wyjątek oblężenie bez szturmu | ABC 2026-06-26 |
| **C1-Q2** layout preBattle | **TW** — mockup OK | akceptacja 2026-06-26 |
| **C1-Q2b** Enter / domyślny | **B** — Enter = **Bitwa ręczna**; Escape = Wycofaj | mockup TW (primary złoty) |
| **C1-Q3** deployment | **A** — ~~zawsze faza rozstawiania na polu bitwy~~ **REWIZJA 2026-06-27 → MAPA** | Maciej: ruch na mapie, nie deploy C2 |
| **C1-Q4** skład na preBattle | **A** — pełny skład **D8=A** (heks + posiłki 1-heks) | **D8=A** + mockup karty L/R |
| **C1-Q5** Wycofaj | **A** — zawsze przed walką, **bez strat**, ruch zachowany | mockup TW + Q1 symetria ataku gracza |

### Implikacje dla SILNIK (`main.ts`)

| Decyzja | Wpięcie |
|---------|---------|
| Q2b=B | `showPreBattle(info, cb, { defaultAction: 'manual' })` |
| Q3=A | ~~`BattleScene({ deploy: true })`~~ → **REWIZJA Maciej 2026-06-27:** `deploy: false` — pozycje z **mapy** (Grupa A) |
| Q4=A | Zbieranie jednostek: heks starcia + własne w promieniu 1 heks → `PreBattleInfo` + skład do `BattleScene` |
| Q5=A | `canRetreat: true`; `onCancel` **nie** zużywa ruchu / przywraca stan ruchu |
| Q2 Zapisz | `onSave` → `doQuickSave`, overlay **zostaje** — **już częściowo** w main.ts |

---

## Deliverable UI (Grupa C — GOTOWE)

| Plik | Stan |
|------|------|
| `UI/Makieta-preBattle.html` | mockup kanoniczny |
| `gra/src/ui/preBattle.ts` | layout TW, API rozszerzone |
| Backup | `preBattle.ts.bak-UI-C1TW-20260626` |

Handoff wpiecia: `dyspozycje/_handoff/C1-do-SILNIK_batch-test.md`

---

## → SILNIK / Grupa F

**GOTOWE DO WPIĘCIA I TESTU:** moduł `preBattle.ts` + decyzje zamknięte.  
**SILNIK:** dokończyć `main.ts` (Q4 multi-unit, Q2b opts, weryfikacja Q3/Q5) → bramka → `Gra-podglad-ROBOCZA.html` → raport **Master** → Opus → kanon.

**NIE pytać Macieja** o C1-Q1…Q5 ponownie.

---

## Powiązane (osobne tematy)

- **C3** oblężenie na mapie (panel, bez preBattle do szturmu)
- Routing Q1: `C1-do-MAPA_oblezenie-bez-preBattle.md`
