# HANDOFF SESJI — 2026-08-06 · FALA 254 + ECHO ABC

**Dla następnego agenta (Grok / Cloud Integrator).**  
**Czytaj najpierw ten plik**, potem `STAN-PRACY-HANDOFF.md` · `KANAL-PRACA.md` · `dyspozycje/autobot/README.md`.

---

## 1. Stan gry (ROBOCZA)

| Pole | Wartość |
|------|---------|
| **AKTUALNA FALA** | **254** |
| **md5** | `232634a96b7bbea7a2147f851510a32f` (label `232634a9`) |
| **Commit deploy** | `a3217572` na `main` |
| **Wejście** | `gra-robocza/START.html` · **git pull** + Ctrl+F5 + Nowa gra |
| **ECHO ABC** | branch `cursor/abc-echo-paczka-2026-08-06-63a1` · tip `4b79cdbc` (+ ten handoff) — **docs only**, jeszcze do merge na `main` |

**Zawartość FALA 254:** Escape (army / battle / diplo koszyk / city-unit picks / cityUxFrame) · chip rekrutacji full-cost + `pickUnitRecruitHint` · Panel-C roundtrip · audyt `R-OBRONA-MIASTA-MP` · paczka ABC (otwarta → potem ECHO).

**Bramki F254:** escape-stack **72/72** · ai-recruit-upkeep-gate **27/27** · tsc 0 · VERIFY OK.

---

## 2. Co ZROBIONE w tej sesji (skrót łańcucha)

| Fala | md5 | Co |
|------|-----|-----|
| 251 | `e594f018` | Escape + hover pigułki (Q4=B) |
| 252 | `bbff9996` | Escape more + `canAffordUnitRecruitFull` + Panel-C |
| 253 | `b8704216` | Escape hub/cityList + recruit hint + **AI-BALANS-STEP5** |
| **254** | **`232634a9`** | Escape pełny stos + chip/hint + Panel-C + audyty + ABC lista |

**Proces:** Maciej wymusił **AutoBot na każdy temat** (Operator `composer-2.5` → Evaluator `composer-2.5` → Grok final). Deploy **tylko Grok** na hasło.

---

## 3. Decyzje ABC — ECHO ZAMKNIĘTE (2026-08-06)

Kanon: [`docs/decyzje/ABC-PACZKA-2026-08-06-KOLEJKA.md`](../../docs/decyzje/ABC-PACZKA-2026-08-06-KOLEJKA.md) · status **🟢 ZAMKNIĘTA (ECHO)**.

| # | ID | Litera | Skutek | Plik |
|---|-----|--------|--------|------|
| 1 | **AI-BALANS-STEP6-Q1** | **A** | Score 2. zwiadowcy **−80** po pierwszym scoutcie (`chooseCityProduction`) | `docs/decyzje/AI-BALANS-STEP6-Q1.md` |
| 2 | **R-KAMIEN-RELIEF-FOLLOWUP-Q1** | **A** + reguła | Legacy `kopalnia` + **wszystkie kopalnie teraz i przyszłe** zachowują relief | `docs/decyzje/R-KAMIEN-RELIEF-FOLLOWUP-Q1.md` |
| 3 | **MAP-UX-CLUSTER-LABEL-Q1** | **B+C** | Stolica = nazwa cywu **+** marker (korona/obwódka); MP = nazwa + dopisek | `docs/decyzje/MAP-UX-CLUSTER-LABEL-Q1.md` |
| 4 | **R-WIARYGODNOSC-S9-Q1** | **A** | Pełna paczka strojenia liczb §9 (JSON + testy) | `docs/decyzje/R-WIARYGODNOSC-S9-Q1.md` |
| 5 | **R-DESIGN-PANEL-MIASTA-V2-Q1** | **C** | Pilne zlecenie Design klatek v2; kod **nie** zamrożony | `docs/decyzje/R-DESIGN-PANEL-MIASTA-V2-Q1.md` |
| 6 | **R-OBRONA-MIASTA-MP-Q1** | **A** | Mechanika bez zmian; **rozbicie bonusów w preBattle** | `docs/decyzje/R-OBRONA-MIASTA-MP.md` §ECHO |

**Status rejestru:** `ECHO ZAPISANA` · czeka **`działaj`** · potem Autobot per ID.  
Źródła: `REJESTR-PROSB-I-ZADAN.md` · `PYTANIA-OTWARTE.md` · `docs/obieg/REJESTR-DECYZJI.md`.

---

## 4. Co robić DALEJ (kolejka Autobot)

Po merge ECHO na `main` + hasło Macieja **`działaj`** (lub „działaj wszystkie”):

**Kolejność rekomendowana (1 Autobot = 1 ID = osobny branch):**

1. **AI-BALANS-STEP6-Q1=A** — `ai.ts` scoring + test (🟢 mała dźwignia)
2. **R-KAMIEN-RELIEF-FOLLOWUP-Q1=A** — `PRESERVES_HILL_RELIEF_KEYS` + reguła przyszłych kopalń (`main.ts` / render)
3. **MAP-UX-CLUSTER-LABEL-Q1=B+C** — `cityMapStatChip` / `cities.ts` / etykiety
4. **R-OBRONA-MIASTA-MP-Q1=A** — UI preBattle rozbicie (🟡 cross)
5. **R-WIARYGODNOSC-S9-Q1=A** — duża paczka JSON §9 + `wiarygodnosc-test.cjs`
6. **R-DESIGN-PANEL-MIASTA-V2-Q1=C** — głównie **zlecenie/handoff Design** (docs), nie duży kod

Po CLEAN tipach → Grok merge → **deploy dopiero na hasło Macieja** (`deploy` / „wdrażaj ROBOCZA”).

### Zaparkowane (Maciej: nie w tej kolejce natychmiast)

| Temat | Notatka |
|-------|---------|
| Relief/fair-play tip `9c098944` | Eval PASS-WITH-NOTES (Ogromny timeout / perf) — osobny Autobot później |
| `P-TEST-UPKEEP-R-STAWKI` | Inżynieria testów po ×2 kosztach — nie ABC |
| Promocja KANON | Tylko sesja lokalna / PowerShell |
| `R-DOTYK-MVP` | ODŁOŻONE Q1=B |

---

## 5. Jak działać — AutoBot (TWARDE)

Kanon: `dyspozycje/autobot/README.md` · `.cursor/rules/autobot-evaluator-operator.mdc` · `docs/decyzje/R-PROC-AUTOBOT.md`.

```
Maciej „działaj” / temat
        ↓
1) OPERATOR  — Task model composer-2.5 · 1 temat · własny branch cursor/<temat>-63a1
        ↓ tip + raport AC
2) EVALUATOR — Task model composer-2.5 · adwokat diabła · SCOPE/STRICT/EDGE/PARITY/SAVE
        ↓ PASS / NEEDS_FIX / FAIL
3) GROK      — weryfikacja · merge CLEAN · NIE deploy bez hasła
        ↓
4) DEPLOY    — tylko Grok · vite bez npm run build · WERSJE.md · KANAL-PRACA.md
```

**Zakazy:**
- ❌ Samemu kodować 6 tematów „bo szybciej”
- ❌ `npm run build` / `npm run dev` w `gra/` (nadpisze JSON)
- ❌ Deploy bez hasła Macieja
- ❌ Równoległe Operatory na te same pliki bez izolacji (kolizje tipów — patrz §6)
- ❌ Max-3 ABC / AskQuestion popupy — reguła `R-ABC-PELNA-LISTA` (pełna lista naraz)
- ❌ `composer-2.5-fast` — tylko `composer-2.5`

**Routing modeli:** Grok = mózg + jedyny deploy · Composer = ręce (kod/audyt).

---

## 6. Problemy / pułapki sesji (żeby nie powtórzyć)

1. **Puste „deploy” na main** — commit `6177988b` był pusty; nadpisany prawdziwym F254 `a3217572`. Zawsze weryfikuj md5 + VERIFY przed meldunkiem.
2. **Kolizje równoległych Operatorów** — tipy branchy się gryzły (army Escape vs cleanup). Preferuj **sek whencyjnie** 1 Op na konfliktujące pliki albo worktree + jasna rezerwacja w KANAL.
3. **City-pick tip `ec35ef9a`** — Eval **NEEDS_FIX** (scope creep diplo docs/test) → fix tip `ce3000e4`.
4. **ABC pack** — Eval NEEDS_FIX (duplikat MAP-UX w PYTANIA) → fix `4b013f46`.
5. **Recruit chip + pick-hint** — konflikt merge: zostaw **oba** helpery w `economy-upkeep.ts` (`canAffordUnitRecruitFull`, `isUnitRecruitStockChipMissing`, `pickUnitRecruitHint`).
6. **Cleanup tip `14d4b80e`** — ma dobre delty REJESTR, ale STAN mówił F253; **nie merguj całego tipa** (regresja STAN F254). Ewentualnie cherry-pick tylko REJESTR.
7. **Relief poza F254** — tip `9c098944` nie wszedł do deployu (świadomie).

---

## 7. Start następnej sesji (checklist)

```bash
git pull --ff-only origin main
# jeśli ECHO jeszcze nie na main:
git fetch origin cursor/abc-echo-paczka-2026-08-06-63a1
git merge origin/cursor/abc-echo-paczka-2026-08-06-63a1   # lub merge PR
```

1. Przeczytaj ten handoff + ostatnie wpisy `KANAL-PRACA.md`.
2. Potwierdź ROBOCZA `232634a9` w `WERSJE.md`.
3. Na **`działaj`**: odpal Autobot #1 (STEP6), potem kolejne — **nie solo**.
4. Po CLEAN tipach: Grok scala; deploy tylko na hasło.
5. Aktualizuj: REJESTR · STAN · KANAL · WERSJE (przy deploy) · MACIEJ-GOTOWE.

---

## 8. Kotwice plików

| Temat | Pliki |
|-------|--------|
| Escape | `gra/src/ui/escapeOverlayStack.ts` + panele |
| Recruit | `economy-upkeep.ts`, `cityPanel.ts`, `main.ts` |
| STEP6 | `gra/src/game/ai.ts` + nowy test |
| Relief kopalń | `PRESERVES_HILL_RELIEF_KEYS` w sync dekoru (`main.ts`) |
| MAP-UX | `cityMapStatChip.ts` / `cities.ts` / `formatCityMapLabel` |
| Obrona preBattle | `preBattle.ts` + `city-defense.ts` (read) |
| WIAR §9 | `diplomacy.json` / params + `wiarygodnosc-test.cjs` |
| Design v2 | `dyspozycje/DO-DESIGN-PANEL-MIASTA-MAPA-2026-07-25.md` |

---

**CZEKAM-NA (stan handoffu):** Maciej **`działaj`** (wdrożenie) · merge ECHO na `main` · ewentualnie `deploy` po CLEAN tipach.
