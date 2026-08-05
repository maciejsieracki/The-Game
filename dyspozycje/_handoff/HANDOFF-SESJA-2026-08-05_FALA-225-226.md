# HANDOFF SESJI — FALA 225–226 + AutoBot + triage (2026-08-05)

**Dla kolejnego agenta:** przeczytaj ten plik + [`STAN-PRACY-HANDOFF.md`](../../STAN-PRACY-HANDOFF.md) §1 + [`WERSJE.md`](../WERSJE.md) (AKTUALNA) + [`KANAL-PRACA.md`](KANAL-PRACA.md) (góra).

**Rola sesji:** Cloud Integrator (Grok 4.5) · AutoBot (Operator/Evaluator = `composer-2.5`) · Maciej: ABC, playtest, hasła.

**⛔ PROCES:** `R-PROC-AUTOBOT` — **KAŻDY** temat (analiza / kod / fix / audyt) wyłącznie Operator → Evaluator → Grok. Deploy ROBOCZA **tylko Grok** na hasło Macieja.

---

## 1. AKTUALNA ROBOCZA

| Pole | Wartość |
|------|---------|
| **FALA** | **226** |
| **md5 pliku** | `ebe4548fb8f8522112bec8eea9d2f8b0` (short **`ebe4548f`**) |
| **Stempel w menu** | `ROBOCZA · fea8af68 · 2026-08-05 11:27` |
| **Commit deploy** | `8a88190` |
| **Tip docs (po deploy)** | patrz `git log` / `KANAL-PRACA.md` |
| **Wejście** | `gra-robocza/START.html` — **git pull** + Ctrl+F5 + **Nowa gra** |

Zawiera FALA 225 (R-AUTO) + FALA 226 (AI MOC + threat).

---

## 2. ŁAŃCUCH DEPLOY (ta sesja)

| FALA | md5 short | Stempel | Batch |
|------|-----------|---------|--------|
| **225** | `8767b9c0` | `e5fbaa18` | R-AUTO-RACJE-RAISE Q1=B Q2–Q5=A + scaffold AutoBot · **ZASTĄPIONA** |
| **226** | `ebe4548f` | `fea8af68` | P-AI-MOC-BONUS-Q1=A + P-AI-008 (jednostki+rozwój zamiast murów) · **AKTUALNA** |

Źródło prawdy md5: **`dyspozycje/WERSJE.md`**.

---

## 3. CO ZROBIONO (chronologicznie, sesja 2026-08-05)

### 3a. FALA 225 — R-AUTO-RACJE-RAISE + AutoBot
- ABC: Q1=**B** · Q2–Q5=**A**
- Spichlerz clamp ≥ 0 · maxSafe suwak · Auto Wyżywienie **per miasto** (default **WYŁ** dla gracza) · AI major zawsze auto, ale bez zejścia Spichlerza < 0 · toast głodu wojska
- ROBOCZA `8767b9c0` · docs: `docs/decyzje/R-AUTO-RACJE-RAISE.md`
- Testy (Operator): m.in. `ai-major-economy` 32/32
- **Playtest Macieja:** **jeszcze bez OK/BUG** (Maciej wybrał fokus „tylko R-AUTO” — czeka wynik)

### 3b. R-PROC-AUTOBOT (twarda reguła) + P0
- Reguła alwaysApply: `.cursor/rules/autobot-evaluator-operator.mdc`
- Scaffold: `dyspozycje/autobot/` · kanon `docs/decyzje/R-PROC-AUTOBOT.md`
- **R-PROC-AUTOBOT-P0** + smoke: merge PR **#108** → `main` (`9068115` + docs) — **bez** deploy gry (tylko scaffold)
- Maciej przypomniał 2026-08-05 ~13:41: **każdy temat analizować/wdrażać AutoBotem** (zapis w kanale)

### 3c. Triage backlogu (zamknięte jako już zrobione / stale)
| ID | Werdykt |
|----|---------|
| **R-GARNIZON-AKCJE** | Już FALA 212 (`onLeaveGarrison`) — zamknięte |
| **R-KOPALNIA-RELIEF** | Już w `PRESERVES_HILL_RELIEF_KEYS` — zamknięte |
| **P-AI-006** | Stale — `civ-ai.json` ma ekspansywność 2–5 — zamknięte |
| **P-AI-010** | Poradnik bez „konkuruj osadnikiem” — zamknięte |

### 3d. ABC Macieja (ECHO)
| ID | Decyzja | Skutek |
|----|---------|--------|
| **P-AI-MOC-BONUS-Q1** | **A** | Podpiąć 4 martwe `DifficultyParams`: startoweJednostki / startoweMiasta / bonusWalka / bonusNauka |
| **P-AI-008** | custom | Pod zagrożeniem: **jednostki + rozwój/budynki**, nie mury; chmury nieistotne; MP `defensiveCopy` bez zmian |
| **R-SCENA-PERF-Q1** | **A** | Najpierw pomiar → potem fix; **nie startować** do sygnału Macieja → potem sygnał (opcja 3 menu) |

### 3e. FALA 226 — P-AI-MOC-BONUS + P-AI-008 (AutoBot)
- Branch: `cursor/fix-ai-moc-bonus-p008-63a1`
- Operator → Evaluator **PASS-WITH-NOTES** → notes closed (manual `difficultyBattleOpts` w `mapFieldBattle.ts`, research bez murów pod threat)
- Testy: `ai-difficulty-bonus-test` **18/18** · `ai-threat-mode-test` **11/11**
- Merge `8bb15b0` → deploy `8a88190` → ROBOCZA **`ebe4548f`**
- Pliki kluczowe: `gra/src/game/ai-difficulty-bonus.ts`, `ai-threat-mode.ts`, `ai.ts`, `combat.ts`, `main.ts`, `battle/mapFieldBattle.ts`
- Docs: `docs/decyzje/P-AI-MOC-BONUS.md`, `P-AI-008.md`
- **Playtest Macieja:** odłożony (wybrał **1+3** = F12+R-AUTO, potem **3** = tylko R-AUTO; FALA 226 playtest nadal w kolejce)

### 3f. R-SCENA-PERF
- Status: **🔵 W TOKU** · Q1=A · sygnał Macieja przyjęty
- Instrumentacja **już w bundlu** FALA 226 (`[civ] buildScene ms` + detail heksy/nakładki w `scene.ts`, od FALA 150–155)
- **Czeka:** 3 linie F12 od Macieja → potem AutoBot kill-switch/fix najdroższego etapu
- **Obecnie wstrzymane** — Maciej fokus na playtest R-AUTO (opcja 3)
- Docs: `docs/decyzje/R-SCENA-PERF.md`

---

## 4. DECYZJE / HASŁA MACIEJA (operacyjne, ta sesja)

| Hasło / wybór | Znaczenie |
|---------------|-----------|
| Deploy „zgodnie z zasadami autobot” | FALA 225 / 226 przez pętlę AutoBot |
| Menu **3** (po FALA 226) | Sygnał na R-SCENA-PERF (pomiar) |
| **1+2 multitasking** | F12 + playtest FALA 226 |
| **1+3** | F12 + playtest **R-AUTO** (FALA 226 AI odłożone) |
| Przypomnienie AutoBot | Każdy temat tylko Operator→Evaluator→Grok |
| **3** (kolejne) | Tylko playtest R-AUTO; F12 wstrzymane |
| **1** | Czeka na treść `OK` / `BUG: …` R-AUTO |

---

## 5. PLAYTESTY — STAN

| Temat | Bundle | Wynik |
|-------|--------|--------|
| FALA 223 / 224 | wcześniejsze | **OK** (sesja poprzednia) |
| **R-AUTO-RACJE-RAISE** | w `ebe4548f` (od 225) | **CZEKA OK/BUG** ← **AKTUALNY FOKUS Macieja** |
| **FALA 226** AI MOC + threat | `ebe4548f` | **CZEKA** (odłożone) |
| **R-BUDYNKI-NIEAKTYWNE** | od FALA 222 | **CZEKA** OK/BUG |
| **R-SCENA-PERF** | pomiar F12 | **CZEKA** liczb (wstrzymane na czas R-AUTO) |

---

## 6. KOLEJKA DLA NASTĘPNEGO AGENTA

### Natychmiast (gdy Maciej wróci)
1. **R-AUTO** — przyjąć `OK` → zamknąć w rejestrze / `BUG: …` → **AutoBot** fix → Evaluator → Grok → deploy na hasło
2. Po R-AUTO: **F12** trzy linie → AutoBot R-SCENA-PERF
3. Playtest **FALA 226** (trudność wyższa: spawn/walka/nauka AI; threat bez murów u major)

### Backlog (nie ruszać bez sygnału / ABC)
- R-BUDYNKI-NIEAKTYWNE (playtest)
- R-WIARYGODNOSC (CZEKA-NA-DECYZJĘ §9)
- R-DESIGN-PANEL-MIASTA (CZEKA-NA-DESIGN)
- R-PANEL-SPLIT / R-SUROWCE-UI-ZERO / R-CIVPEDIA (NOWE)
- R-DOTYK-MVP (ODŁOŻONE)
- P-AI-MOC-GAP (reszta korzeni design — częściowo FALA 220/226)

---

## 7. ZAKAZY / PUŁAPKI

- ❌ `npm run build` / `npm run dev` w `gra/`
- ❌ Omijać AutoBot („drobiazg”)
- ❌ Deploy Composerem / bez hasła Macieja
- ❌ Duży refaktor `scene.ts` bez liczb F12
- ❌ Prosić Macieja o playtest poza bieżącym fokusem — on sam wybiera tor

---

## 8. LINKI

- Rejestr: `dyspozycje/REJESTR-PROSB-I-ZADAN.md`
- Wersje: `dyspozycje/WERSJE.md`
- Kanał: `dyspozycje/_handoff/KANAL-PRACA.md`
- AutoBot: `dyspozycje/autobot/README.md`
- Decyzje: `docs/decyzje/R-AUTO-RACJE-RAISE.md` · `P-AI-MOC-BONUS.md` · `P-AI-008.md` · `R-SCENA-PERF.md` · `R-PROC-AUTOBOT.md`
- Gotowe dla Macieja: `docs/MACIEJ-GOTOWE.md`
