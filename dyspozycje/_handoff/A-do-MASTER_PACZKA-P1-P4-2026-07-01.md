# GRUPA A → MASTER: Paczka P1–P4 + PANEL-MERGE

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **→ MASTER: GOTOWE** · **ACK Master 2026-07-01** · dyspozycja F P2 |
| **Data** | 2026-07-01 |
| **Obieg** | `_DYSPOZYCJA-WSPOLNY-OBIEG.md` · Maciej: **Master** (= przekaż do Mastera) |
| **Plik obiegu** | `docs/obieg/A-mapa.md` |
| **Slack outbox** | `docs/obieg/SLACK-OUTBOX-A-2026-07-01.md` |

---

## 1. Co przesyłam (lane A / MAPA)

| Batch | Temat | Warstwa | Status lane |
|-------|--------|---------|-------------|
| **P1** | Panel-A audyt PANEL-AUDYT | 🟢 | ✅ GOTOWE · tracker A-M1…M3 |
| **P2** | FOOD-HODOWLA M1–M7 + Panel-A hodowla | 🟡 | ✅ GOTOWE |
| **P3** | E2 generator `worldDensity` | 🟡 | ✅ GOTOWE · test 28/28 |
| **P4** | A1-Q12 overlay + MAPA-F2 toggle minimapy | 🟡 | ✅ GOTOWE UI · **wymaga rebuild kanonu F** |
| **B2-Q5** | Ikona 🔥 buntu na hex miasta | 🟡 | ✅ lane render · chip→kamera w kanonie F |

---

## 2. Handoffy szczegółowe

| Handoff | Rola |
|---------|------|
| `A-do-INTEGRATOR_A1-Q12-minimap-dblclick.md` | **F** — wpięcie UI P4 do kanonu |
| `MAPA-do-SILNIK_kanon-zywnosc-hodowla.md` | P2 — już → SILNIK |
| `MAPA-do-SILNIK_E2-world-opts.md` | P3 — API generatora |
| `MAPA-do-SILNIK_B2-Q5-bunt-hex.md` | B2-Q5 render |
| `MAPA-do-UI_kultura-religia-zasieg-minimapa.md` | MAPA-F2 spec (DoD odhaczone) |
| `MASTER-do-MAPA_E2-gestosc-generator.md` | DoD P3 odhaczone |

---

## 3. Pliki kodu (P4 — nowe od ostatniego kanonu)

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/hud.ts` | Klik 🎭/⛪ [A] → overlay · auto dblclick minimapa |
| `gra/src/ui/minimapHud.ts` | dblclick ikon → panel imperium |
| `gra/src/ui/empireOverlayHud.ts` | Rozszerzone pola A1-Q12a/b |

**Kanon dziś:** md5 `AB471657…` (E2-PLAYTEST-B2Q5) — **nie zawiera** P4 UI → batch F przed playtestem.

---

## 4. Bramka lane (self-check)

| Test | Wynik |
|------|-------|
| `world-density-test.cjs` | **28/28** |
| PANEL-MERGE A-M1…M3 | ✅ tracker 2026-06-30 |
| `main.ts` | **NIE ruszany** (lane A) |
| typecheck | pre-existing errors w `cityPanel.ts` — poza diffem P4 |

---

## 5. Co MASTER ma zrobić

1. **ACK** paczkę P1–P4 w `MASTER-WATCH.md`
2. **Deleguj F:** batch **A1-Q12-UI** — rebuild kanonu + opcjonalnie bogatsze `buildCultureOverlayData()`
3. **Kolejka lane A:** **P5 C3 oblężenie** — dyspozycja implementacji (`docs/decyzje/C3-obleczenie.md`, decyzje zamknięte 27.06)
4. **Nie deleguj ponownie:** Panel-A · FOOD-HODOWLA · E2 API · B2-Q5 render
5. **Blokery Maciej:** A5/D12 bronzepreview · Figma STOP (0/8 — czeka UI 00–02)

---

## 6. DoD Master

- [ ] ACK w `MASTER-WATCH.md`
- [ ] Slack `#master` ACK (szablon w SLACK-OUTBOX-A)
- [ ] Dyspozycja F: batch A1-Q12-UI
- [ ] Dyspozycja lane: C3 P5 (kiedy priorytet)

**Playtest Macieja:** ⏸ poza priorytetem (2026-06-30)
