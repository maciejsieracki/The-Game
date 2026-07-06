# MASTER → UI: miasto P0 — orkiestracja (Maciej bezpośrednio z lane UI)

**Data:** 2026-07-04  
**Decyzja Macieja:** wszystkie poprawki miasta robi **lane UI** (Maciej koordynuje UI). **MASTER nie dotyka kodu** — tylko dokumenty, priorytety, promocja kanonu **po** meldunku UI + OK playtestu.

---

## 1. Stan toru miasta

| Element | Status |
|---------|--------|
| **Promocja kanonu miasta** | **STOP** — do werdyktu OK Macieja |
| **Design mockupy stopki / 7. klatka Surowce** | **STOP** |
| **Bitwa / POLE-BITWY** | **NIE mieszać** z P0 miasta |
| **Kanon bundle (walka)** | md5 `5b9abefc1534acfec886c34730765b25` — bez zmian |
| **Baseline Design miasto** | md5 `153fcda2…` — referencja wizualna, nie źródło implementacji |

**Co już działa (nie regresować):** B-27/B-28 wyjście (Mapa, Esc, Wróć) · rail 2+7 · Wiki/Menu semantyka · toolbar okolica 3D · surowce w `civ-v-right-foot` (nie 7. zakładka rail).

---

## 2. Zakres P0 — lane UI (kolejność)

### P0-2 — chrome (regres B-27) · **PRIORYTET 1**

| ID | Objaw | AC (playtest RZYM) |
|----|--------|---------------------|
| **P0-2 góra** | Wiki + Menu zasłaniają chipy miasta (Praca, Skarbiec…) | Wiki **góra-prawo** · chipy miasta **w pełni widoczne i klikalne** · bez nachodzenia HUD imperium/Moc na `civ-ux-top` |
| **P0-2 dół** | „Wróć na mapę” blokuje dolne heksy okolicy (👤 produkcja) | Dolne heksy **klikalne** · exit nadal działa (klik + Esc) · toolbar okolica bez regresu |

**Pliki lane UI (wyłącznie):** `gra/src/ui/hud.ts`, `gra/src/ui/cityPanel.ts` (+ ewent. `cityUxFrame.ts` jeśli konieczne — uzasadnij w meldunku).

**Diagnoza (referencja, nie obowiązek implementacji 1:1):**
- `setMapHudChromeSuppressed(true)` → HUD z-index 404 nachodzi na pasek miasta
- `.civ-v-map-actions` na dole ekranu z `pointer-events:auto` blokuje mapę

**Uwaga:** MASTER wdrożył próbę P0-2 (`is-city-view`, padding-right, exit `top:92px`) — **lane UI decyduje**: utrzymać, poprawić lub wycofać. MASTER **nie** nadpisuje.

---

### P0-1 / P0-1b — stopka surowców · **PRIORYTET 2**

| ID | Objaw | AC |
|----|--------|-----|
| **P0-1 stopka** | Stopka surowców zlane ze Spichlerzem | Osobny pas na dole kolumny · `civ-v-right-foot` oddzielony wizualnie · 7 medalionów w stopce · **nie** pełna klatka rail „Surowce” |

**Plik:** `cityPanel.ts` (CSS + ewent. markup `renderSurowce`).

**Backupy w repo (orientacja):** `cityPanel.ts.bak-UI-2026-07-04-P0-1b`, `…-P0-2-chrome`, `hud.ts.bak-UI-2026-07-04-P0-2`.

---

## 3. Własność i zakazy

| Rola | Robi | Nie robi |
|------|------|----------|
| **Lane UI** | kod w `gra/src/ui/*` · testy lane · bundle **roboczy** do playtestu · meldunek | `main.ts` · `publish-kanon-snapshot` · Design mockupów stopki |
| **MASTER** | dyspozycje · handoffy · DZIENNIK · **po OK Macieja:** build/bramka/promocja | edycja kodu miasta · samodzielne hotfixy P0 |
| **Maciej** | playtest · werdykt OK/FAIL · priorytety | — |
| **Design** | **STOP** do zamknięcia P0 playtestem | 7. klatka Surowce |

---

## 4. Workflow lane UI → MASTER

```
Maciej + lane UI (implementacja)
    → UI-DO-MASTERA.md (append) + handoff UI-do-MASTER_miasto-P0-*.md
    → bundle gra-robocza/Gra-podglad.html + md5
    → Maciej playtest (Ctrl+F5 gra-robocza/START.html · RZYM)
    → OK / FAIL (osobno: P0-2 chrome · P0-1 stopka)
    → FAIL: lane UI poprawka · bez promocji kanonu
    → OK oba P0: MASTER bramka + (opcjonalnie Opus) + publish-kanon-snapshot
```

**Playtest Macieja:** `gra-robocza/START.html` → miasto **RZYM** → zakładka okolica + Spichlerz/Handel (stopka).

---

## 5. Meldunek od Macieja / lane UI (gdy gotowe)

Maciej zgłasza MASTER krótko:

1. **P0-2:** OK / FAIL (+ 1 zdanie jeśli FAIL)
2. **P0-1 stopka:** OK / FAIL (+ 1 zdanie jeśli FAIL)
3. **md5** bundle robocza (jeśli lane UI zbudował)
4. **Handoff** zaktualizowany (flaga `→ MASTER: GOTOWE` w `UI-DO-MASTERA.md`)

MASTER wtedy **tylko:** wpis DZIENNIK · aktualizacja `UI-STAN.md` · ewent. dyspozycja promocji (bez kodu miasta).

---

## 6. Checklist playtestu (Maciej)

**P0-2 chrome**
- [ ] Chipy miasta (Praca, Skarbiec…) nie pod Wiki/Menu
- [ ] Wiki + Menu góra-prawo
- [ ] Dolne heksy okolicy klikalne (👤)
- [ ] „Wróć na mapę” + Esc
- [ ] Toolbar okolica OK

**P0-1 stopka**
- [ ] Stopka oddzielona od Spichlerza
- [ ] 7 medalionów w stopce
- [ ] Handel + stopka (klatka złożona) — wizualnie OK

---

## 7. Referencje

- `_handoff/UI-do-MASTER_miasto-stopka-surowce-P0-2026-07-04.md`
- `_handoff/UI-do-MASTER_miasto-stopka-P0-1b-2026-07-04.md`
- `_handoff/UI-do-MASTER_miasto-P0-2-2026-07-04.md` (próba MASTER — referencja)
- `_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md`
- `dyspozycje/UI-STAN.md`

---

## Status

**→ W TOKU u Macieja + lane UI** · MASTER **CZEKA meldunku** · **STOP kod MASTER**
