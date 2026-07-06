# AUDYT Grupa D — Nauka, dyplomacja, cywilizacje

**Data audytu:** 2026-06-26 (sesja autonomiczna, Maciej nieobecny ~2h)  
**Zakres:** decyzje D1–D4, dane lane CYWILIZACJE, Excel/panele, kod `gra/`, handoffy, delegacja do Mastera  
**Hub plików roboczych:** `Civ-CYWILIZACJE/` (patrz `README.md`)

---

## 1. Executive summary

| Obszar | Decyzje | Implementacja | Blokada |
|--------|---------|---------------|---------|
| **D1 Nauka** | ZAMKNIĘTE | CZĘŚCIOWO — brak filtra epoki D1-Q1 | Grupa F / UI |
| **D2 Kultura** | ZAMKNIĘTE (routing) | Delegowane → Grupa A + MAPA + B | nie Gr-D |
| **D3 Dyplomacja** | T1–T4 ZAMKNIĘTE; **D3-Q1 OTWARTE** | CZĘŚCIOWO — AI tick OK, panel bez akcji | D3-Q1 ABC |
| **D4 Bonusy** | ZAMKNIĘTE | W TOKU — ekonomia OK, walka częściowo | UNITS bitwa 3D |

**Jedyna otwarta decyzja ABC w Gr-D:** **D3-Q1** (potwierdzenie wojny w panelu dyplomacji).

---

## 2. Historia decyzji Macieja (zbiorczo)

### Paczka 1 (2026-06-26, wcześniejsza sesja)

| # | Temat | Decyzja |
|---|-------|---------|
| 1 | Drzewko nauki | **B** — pełne drzewko (port makiety) |
| 2 | Koszty + tempo | **A** — propozycja CYWILIZACJI |
| 3 | Kultura toggle | → **MAPA** (MAPA-F2-Q1) |
| 4 | Dyplomacja panel | **B** — pełny panel z akcjami |
| 5 | Bonusy cyw | **A+B** — stopniowo + Excel do review |

### Decyzje szczegółowe

| ID | Decyzja | Plik |
|----|---------|------|
| **D1-Q1** | Tylko bieżąca epoka na drzewku; stany: researched / available / gray-in-epoch / hidden-future | `docs/decyzje/D1-nauka.md` |
| **D1-Q2** | **A** — jedno kliknięcie = cel badania | j.w. |
| **D2** | Toggle zasięgu → MAPA; treść kliku → **A1-Q12a/b=A** | `D2-kultura.md`, `A1-Q12-*.md` |
| **D3-Q1** | Potwierdzenie wojny | **OTWARTE** | `D3-dyplomacja.md` |
| **T1–T4** | T1=A Respekt, T2=A pełna dypl. AI, T3=A bonusy[], T4=B spryt | `PROPOZYCJA-dyplomacja-AI-v0.1.md`, `SPEC-Respekt.md` |
| **D4-Q1** | Najpierw Excel → **korekta:** wdrażaj efekty, Excel poprawi później | `D4-bonusy-cyw.md` |
| **D10/A, D13/A, D14/A** | Katapulta, defaulty startu, żelazo/stal | handoffy CYW → UNITS/MAPA/E1 |

---

## 3. Co wykonano w tej sesji (Grupa D)

### Kod i dane

| Element | Plik | Status |
|---------|------|--------|
| Kontrakt bonusów | `gra/src/game/civ-bonuses.ts` | **NOWY** |
| Walka auto-resolve | `gra/src/game/combat.ts` + `main.ts` | **WDROŻONE** |
| Ekonomia bonusów | `economy.ts`, `turn-economy.ts`, `production.ts` | **WDROŻONE** |
| Panel miasta (koszty) | `cityPanel.ts` + `getCivBonusy` | **WDROŻONE** |
| Testy | `gra/tools/civ-bonusy-test.cjs` | **ROZSZERZONE** |
| Eksport bonusów | `gra/tools/export-bonusy-cyw.py` | **NOWY (2026-06-26)** |
| Sync panel ← JSON | `gra/tools/sync-panel-efekty-from-json.py` | **NOWY** |
| Generator wide Excel | `gra/tools/gen-bonusy-cyw-xlsx.py` | istnieje |

### Dokumentacja i delegacja

| Element | Plik |
|---------|------|
| Hub plików roboczych | `Civ-CYWILIZACJE/README.md` |
| Delegacja do Mastera | `_handoff/CYWILIZACJE-do-MASTER_bonusy-RDY01-delegacja.md` |
| Handoff UNITS | `…-do-UNITS_bonusy-walka-bitwa-jednostki-spec.md` |
| Handoff EKONOMIA | `…-do-EKONOMIA_bonusy-ekonomia-miasto.md` |
| Handoff UI | `…-do-UI_bonusy-wyswietlanie.md` |
| Raport Master | `docs/czaty/DO-MASTERA.md` § D4-RDY01 |

---

## 4. Co jeszcze do wykonania (backlog Gr-D)

### CYWILIZACJE (ten lane)

- [ ] **Maciej „Excel OK”** → `export-bonusy-cyw.py` → `civs.json`
- [ ] Religie 9/9 w `society-params.json` (dziś 7/9 — `CYWILIZACJE-STAN`)
- [ ] `civ-ai.json` / `civ-params.json` — arkusze szkieletowe w `Cywilizacje.xlsx` (plan, nie wdrożone)

### UNITS (delegacja Master)

- [ ] `battleScene.ts` + `manualBattle.ts` — bonusy w bitwie 3D
- [ ] Jednostki specjalne — filtr produkcji (Falanga/Hastati/Impi per cyw)
- [ ] Testy: `battle-smoke.cjs`, rozszerzenie `combat-test.cjs`

### UI (delegacja Master)

- [ ] `newGameFlow.ts` — lista `bonusy[]` z JSON (nie tylko stringi)
- [ ] `preBattle.ts` — sekcja bonusów obu stron
- [ ] `diplomacyPanel.ts` — przyciski akcji (po D3-Q1)

### SILNIK / Grupa F

- [ ] `sciencePicker.ts` — filtr epoki **D1-Q1**
- [ ] Dokończenie wiązań ownerId→bonusy w bitwie pełnej

### EKONOMIA

- [ ] Regresja `civ-bonusy-test.cjs` po re-export Excelu — **bez zmian kodu**

---

## 5. Pliki Excel — stan i kanon

| Plik | Lokalizacja | Rola | Aktualny? |
|------|-------------|------|-----------|
| **Panel-efekty-cyw-dyplomacja.xlsx** | `Civ-CYWILIZACJE/` | **KANON review bonusów** | TAK — edytuj tutaj |
| Panel-CYWILIZACJE.xlsx | `Civ-CYWILIZACJE/` | Dashboard lane (pogląd) | TAK — nie eksportuje |
| Bonusy-cywilizacji-9x3.xlsx | `Civ-CYWILIZACJE/` | Wide 9×3 (generowany) | TAK — wtórny |
| Cywilizacje.xlsx | root | Klastry, mnożnik, ikonaId | TAK — `export-civs.py` |
| Technologie-drzewko.xlsx | root | Tech + tempo | TAK — `export-tech.py` |
| Dyplomacja/Dyplomacja.xlsx | `Dyplomacja/` | Params dyplomacji | TAK |
| AI-parametry.xlsx | `Civ-AI/` | AI | TAK |

**Uwaga sesji audytu:** `Panel-efekty-cyw-dyplomacja.xlsx` był **zablokowany** (otwarty u Macieja) — regeneracja wide/sync odłożona. Po zamknięciu Excela:

```powershell
cd gra
python3 tools/sync-panel-efekty-from-json.py    # JSON → panel (opcjonalnie)
python3 tools/gen-bonusy-cyw-xlsx.py              # JSON → wide 9×3
python3 tools/export-bonusy-cyw.py --dry-run      # panel → JSON (po edycji)
```

---

## 6. Mapowanie lane → pliki gry (implementacja bonusów)

```
civs.json[bonusy[]]
    ├─ realizuje=ekonomia → turn-economy.ts (handel, nauka)
    │                     production.ts (rekrutacja, budynki)
    ├─ realizuje=walka    → combat.ts (auto-resolve) ✅
    │                     battleScene.ts ❌ TODO
    ├─ realizuje=miasto   → production.ts (koszt budynków) ✅
    └─ jednostka_specjalna → units.json + production filter ❌ TODO (UNITS)
```

---

## 7. Kandydaci do archiwum / usunięcia

Szczegóły: `PLIKI-DO-USUNIECIA.md`. **Decyzja usunięcia = Maciej.**

| Plik | Rekomendacja |
|------|--------------|
| `Civ-CYWILIZACJE/.~lock.Panel-CYWILIZACJE.xlsx#` | Usuń (lock sesji) |
| `PROPOZYCJA-dyplomacja-AI-v0.1.md` | → `_archiwum/` (superseded przez SPEC + kod) |
| `Bonusy-cywilizacji-9x3.xlsx` | Zachować lub nie commitować (regenerowalny) |
| `Civ-DANE/DOKUMENTACJA-DANE-cywilizacje.md` | Link only — superseded przez DOKUMENTACJA-DEV |
| `dyspozycje/_scalone/{DANE,AI,DYPLOMACJA}/` | Archiwum — nie edytować |
| `gra/tools/export-data.py` | Nie usuwać — oznaczyć DEPRECATED w docs |

---

## 8. Testy (do uruchomienia lokalnie)

```powershell
cd gra
python3 tools/export-bonusy-cyw.py --dry-run
node tools/civ-bonusy-test.cjs
node tools/diplomacy-test.cjs
node tools/ai-test.cjs
node tools/research-test.cjs
node tools/tech-tempo-test.cjs
```

Agent Cursor: **Node brak w PATH shellu** — Maciej uruchamia lokalnie.

---

## 9. Następne kroki (po powrocie Macieja)

1. Zamknij Excel → opcjonalnie `sync-panel-efekty-from-json.py` + `gen-bonusy-cyw-xlsx.py`
2. Edytuj bonusy w **Panel-efekty** → napisz „Excel OK” → `export-bonusy-cyw.py`
3. **D3-Q1** — ABC potwierdzenia wojny (jedyna otwarta decyzja Gr-D)
4. Master: rozdał dyspozycje UNITS/UI — śledź `DO-MASTERA.md`

---

*Audyt przygotowany przez Grupa D / CYWILIZACJE, 2026-06-26*
