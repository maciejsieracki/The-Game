# MASTER → GRUPY A–E — dyspozycja PILNA (2026-07-02)

> **Od:** Master Orkiestrator · **Priorytet:** 🔴 PILNE  
> **Kanon:** md5 **`de9b53e43997d8ec195f209054f46d3a`** · F **IDLE** — czeka na Wasze moduły  
> **Trigger w czacie grupy:** **`działaj`** (czytaj swój plik obiegu · sekcja 🔴 PILNE)

---

## Wspólne reguły (OBOWIĄZ)

- **NIE** proś Macieja o playtest — kończysz na **`przekaż do Mastera`**
- **NIE** raportuj całej gry — tylko **swój lane** (trigger: `zakres`)
- **NIE** `main.ts` — handoff → Master → F
- Po **`przekaż do Mastera`:** Slack §7.1d (`#master` + `#grupa-X`)

---

## Grupa A — `docs/obieg/A-mapa.md`

| Pri | Temat | DoD |
|-----|--------|-----|
| **P1** | **F-P1-01** — spec ataku wrogiego miasta z mapy (klik) | Handoff `A-do-INTEGRATOR_map-attack-city-P1.md` lub `A-do-C_map-attack-spec.md` · test self-build |
| **P2** | Panel-A: dokończyć checklist PANEL-AUDYT (drobne) | Round-trip OK · `→ MASTER: GOTOWE` gdy dotyka eksportu |

---

## Grupa B — `docs/obieg/B-ekonomia.md`

| Pri | Temat | DoD |
|-----|--------|-----|
| **P1** | **B1-Q3** — drzewko **liniowe** (decyzja Macieja **B** już jest) | `economy.ts` / `tech.json` · testy lane · REJESTR 🔵→🟠 |
| **P2** | Panel-B: arkusze **Budynki · Technologie · Surowce** (B-M5/M6/M3) | `export-b.py` · **`eksportuj panel`** · bez duplikatu FOOD z Panel-A |
| **P3** | Po P1+P2 | **`przekaż do Mastera`** + handoff `EKONOMIA-do-MASTER_B1-Q3-panel-B-*.md` |

---

## Grupa C — `docs/obieg/C-walka.md`

| Pri | Temat | DoD |
|-----|--------|-----|
| **P1** | **F-P1-01** — czeka **spec od Grupy A** | Gdy handoff A: implementacja w lane C (preBattle/map entry) · testy combat |
| **P2** | Panel-C balans (opcjonalnie po P1) | Excel → `eksportuj panel C` — kanon ma JSON; zmiany balansu = nowy handoff |

**Status Panel-C w kanonie:** ✅ KANON-BATCH-3 — **IDLE** dopóki A nie dostarczy P1.

---

## Grupa D — `docs/obieg/D-cywilizacje.md`

| Pri | Temat | DoD |
|-----|--------|-----|
| **P1** | **E-P0-06** — ekran zwycięstwa (wspólnie z **E**) | Kontrakt UI z E · `victory.ts` + handoff do F |
| **P2** | Panel-D: pierwszy **`eksportuj panel`** (Excel→JSON) | Round-trip · `diplomacy.json` / `ai-params.json` zsynchronizowane |
| **P3** | Sojusz v1.2 | ✅ w kanonie — **nie duplikuj** · tylko P1+P2 |

---

## Grupa E — `docs/obieg/E-start.md`

| Pri | Temat | DoD |
|-----|--------|-----|
| **P1** | **E2 kreator dopięcie** — miasta-państwa zamiast jakości mapy · `buildParams()` pełne | Handoff `UI-do-INTEGRATOR_E2-kreator-gestosc.md` · self-test kreator |
| **P2** | **E-P0-06** — pełny ekran warunków zwycięstwa (z **D**) | UI shell · handoff cross-lane |
| **P3** | Panel-E checklist (E-M1…) | Po P1 · **`przekaż do Mastera`** |

---

## Master — po Waszym `przekaż do Mastera`

1. ACK + dyspozycja F (batch)  
2. Bramka + promocja kanonu  
3. Playtest Macieja — **tylko Master** (OBOWIĄZ-PT)

---

*Slack outbox:* `docs/obieg/SLACK-OUTBOX-MASTER-PILNE-2026-07-02.md`
