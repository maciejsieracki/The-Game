# C → MASTER — Playtest oblężenia 3v3 + fan-out pierścienia + preBattle UI

| Pole | Wartość |
|------|---------|
| **Data** | 2026-06-26 |
| **Obieg** | Maciej playtest `PLAYTEST-OBLEZENIE-3v3` · decyzja ABC · **→ MASTER: GOTOWE** |
| **Warstwa** | 🟡 cross (`post-battle-map.ts`, `preBattle.ts`, `playtestOdskok3v3.ts`, `civ-bonuses.ts`) |
| **Nie ruszano** | `main.ts` (monopol MASTER / Integrator F) |
| **Slack** | `docs/obieg/SLACK-OUTBOX-C-2026-06-26.md` · **WYSŁANE** (agent MCP) |
| **Meldunek lane** | `dyspozycje/UNITS-DO-MASTERA.md` · `docs/obieg/C-walka.md` § TERAZ |
| **Maciej** | **Nie wkleja nic do Mastera** — tylko playtest tutaj (`playtest OK` / `BUG: …`) |

---

## 1. Decyzja Macieja (ABC)

**M×W+ — pierścień obrońców po sztur mie:**

| Opcja | Treść |
|-------|--------|
| ~~A~~ | Pierścień **zostaje** (stary zapis 2026-06-30) |
| **B** ✅ | Pierścień **fan-out −1 heks** jak na polu; tylko garnizon na centrum = 100% wipe |
| ~~C~~ | Cały pierścień likwidowany |

Zapis: `docs/AUTO-WALKA-MOC-ALGORYTM.md` §13a / §14 (skorygowany).

---

## 2. Fixy wdrożone (lane C / UI)

| ID | Problem | Fix | Plik |
|----|---------|-----|------|
| **OBL-CAP-01** | Po auto-szturmie znikają **wszystkie** jednostki ATK | Auto-szturm bez `manualSurvivors: []`; gałąź manual tylko gdy `manualSurvivors !== undefined` | `main.ts` (wcześniejszy batch?) · `post-battle-map.ts` |
| **OBL-RING-B** | Pierścień nie odskakiwał po wygranej ATK na mieście | `retreatDefendersAfterAtkWin` — fan-out także przy `cityOnBattleHex` (centrum wykluczone po wipe) | `post-battle-map.ts` |
| **OBL-ROSTER-3** | Szturm pokazywał 2 zamiast 3 Hastati | Preset: 3× Hastati na pierścieniu wokół Aten (`findSiegeRingLayout`) | `playtestOdskok3v3.ts` |
| **C1-BONUS** | preBattle — za dużo bonusów nacji | Tylko **bonusy bojowe** (`isCombatModifierBonus`) | `civ-bonuses.ts`, `preBattle.ts` |
| **C1-UI** | Pionowy słupek „Szanse” między wodzami — nieczytelny, duplikat | Usunięty; zostaje **poziomy** pasek w panelu środkowym | `preBattle.ts`, `UI/Makieta-preBattle.html` |

---

## 3. Testy (self-check C)

| Suite | Wynik |
|-------|-------|
| `post-battle-map-test.cjs` | **10/10** (pole fan-out + miasto fan-out + auto-szturm bez wipe ATK) |
| `civ-bonusy-test.cjs` | **33/33** (sekcja G — bonusy bojowe) |

---

## 4. Build playtest (C publish — NIE kanon)

| Plik | MD5 |
|------|-----|
| `Gra-podglad-PLAYTEST-OBLEZENIE-3v3.html` | `A416D5ECACA0DBF2E2B157FD0D8093C5` |
| (sync) `PLAYTEST-ODSKOK*.html` | ten sam bundle co ostatni vite build |

**Maciej retest:** Ctrl+F5 → szturm (3) → preBattle (1 pasek szans) → Auto → odskok e0/e2, Hastati na mieście.

---

## 5. Co MASTER ma zrobić

1. **ACK** handoff + decyzję B (pierścień fan-out) — spójność z `→MASTER-AUTO-WALKA-v2b` (tam było „pierścień zostaje” — **skorygować**).
2. **Integrator F:** batch C-oblężenie-playtest — bramka (`post-battle-map-test` 10/10 + `civ-bonusy-test` 33/33) → `Gra-podglad.html`.
3. **Opus review** przed kanonem (Ask).
4. **Opcjonalnie** zaktualizować `UNITS-DO-MASTERA.md` / `→MASTER-AUTO-WALKA-v2b-ZAMKNIETE.md` — linia „pierścień zostaje” → **fan-out B**.

**Nie wymaga nowego ABC** — decyzja Macieja już zapisana.

---

## 6. DoD kanonu

- [ ] Szturm 3× Hastati w preBattle (dist≤1 od miasta)
- [ ] Po wygranej auto-szturmu: ATK widoczne, miasto przejęte
- [ ] Boczni obrońcy pierścienia: **−1 heks** od ATK
- [ ] Garnizon centrum: wipe
- [ ] preBattle: jeden poziomy pasek szans M armii
- [ ] Bonusy nacji w preBattle: tylko bojowe

---

**Powiązane:** `C-do-MASTER_odskok-fanout-2026-07-01.md` · `docs/grupa-c/PLAYTEST-WALKA-MACIEJ.md`
