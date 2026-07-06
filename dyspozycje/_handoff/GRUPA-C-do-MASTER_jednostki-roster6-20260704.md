# Grupa C (Walka) → MASTER — jednostki roster-6 + Celtowie

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **GOTOWE** |
| **Trigger** | Maciej `start · jednostki roster-6 + Celtowie` |
| **Pliki** | `gra/data/units.json` · `gra/tools/combat-test.cjs` (adapter PL→TW) · `gra/tools/roster6-units-patch.cjs` |
| **Backup** | `gra/data/units.json.bak-UNITS-roster6-20260704` |
| **NIE ruszano** | `main.ts` · modele 3D (fallback kategoria) · kanon |

---

## Zrealizowane

### Priorytet 1 — Celtowie

| Akcja | Wynik |
|-------|--------|
| Usunięto | `Wojownik celtycki` (duplikat) |
| `Gaesatae` | Staty z dawnego Wojownika celtyckiego (CELT-Q2=A); `W zamian za: —` |
| **Soldurii** | NOWY · `Nacja: Celtowie` · identyczne staty · `W zamian za: Wojownik` |

### Priorytet 2 — Batch 1 (Asyria + Słowianie)

| Jednostka | Nacja | W zamian za | Epoka |
|-----------|-------|-------------|-------|
| Konnica lancowa asyryjska | Asyria | Konnica | Żelazo |
| Konnica łucznicza asyryjska | Asyria | Konnica | Żelazo |
| Łucznik asyryjski | Asyria | Łucznik | Brąz |
| Drużynnik | Słowianie | Włócznik | Żelazo |
| Jeździec z szczepnikami | Słowianie | Konnica | Żelazo |

**Asyria konnice vs Konnica std (A6/U6/O4/H80):** lancowa A10/U12/O5/H85 · łucznicza A7 + dyst 12 + 20 pocisków.

### Priorytet 3 — Batch 2 (4 cywilizacje × 3 wpisy)

| Nacja | Jednostki |
|-------|-----------|
| Harappa | Strażnik bram Harappy · Piechota induska · Garnizon Harappy |
| Hetyci | Rydwan Kapadokijski · Piechota hetycka · Gwardia hetycka |
| Babilonia | Gwardia Ishtar · Wojownik babiloński · Piechota neobabilońska |
| Fenicjanie | Tyrski miecznik (Żelazo) · Wojownik fenicki · Gwardia Tyr |

**`W zamian za`** zgodne z briefem CYW dla jednostek spec. (Strażnik→Włócznik, Rydwan Kapad.→Rydwan konny, Ishtar→khopesh, Tyrski→miecz+tarcza).

---

## Liczby

- **units.json:** 50 → **67** wpisów (+17 netto; −1 Wojownik celtycki)
- **combat-test:** **6/6** ✅ (po fix adaptera PL→TW w harnessie)

---

## DoD

- [x] Celtowie: Gaesatae + Soldurii
- [x] Batch 1 Asyria + Słowianie
- [x] Batch 2 Harappa, Hetyci, Babilonia, Fenicjanie
- [x] `node tools/combat-test.cjs` — 6/6
- [x] Meldunek + handoff
- [x] Kanon — **MASTER 2026-07-04** md5 `11d23be6…`
- [ ] Modele 3D dedykowane — backlog Design (fallback: `buildUnitModel` kategoria)
- [ ] Batch 0 Wojownik germański — **nie w scope tej dyspozycji** (osobny ticket)
- [ ] Batch 3 oryginalne 7 + Miecznik galijski — **kolejka**

---

## Następny krok MASTER

1. Review statów (playtest Celtowie + Asyria konnice)
2. Opus sign-off
3. Integracja kanon (build `/tmp/civ-dist` + bramka 17 suitów)
4. EKONOMIA: filtr `jednostka_specjalna` + `Nacja` w produkcji (osobny handoff)

**Flaga:** GOTOWE
