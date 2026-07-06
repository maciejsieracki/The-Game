# Maciej — checklist mockup C1 preBattle (Total War)

> **ZAMKNIĘTE 2026-06-26** — mockup zaakceptowany. Hub: `docs/grupa-c/05-MACIEJ-C1-checklist.md`

**Plik mockupu (jedyny kanoniczny):** `UI/Makieta-preBattle.html` (dwuklik lub hub D1B → chip blocking)  
**Decyzja:** C1-Q2 — layout jak Total War (2026-06-26)  
**Po akceptacji:** UI lane portuje do `gra/src/ui/preBattle.ts` (bez `main.ts` w tym kroku)

---

## Co porównać ze screenem Total War

| Element TW | U nas (mockup) | OK? |
|------------|----------------|-----|
| Mapa świata w tle (rozmazana) | `#map-bg` — symulacja | ☐ |
| Portret wodza **lewo** (atak) | `gen-block atk` | ☐ |
| Portret wodza **prawo** (obrońca) | `gen-block def` | ☐ |
| **Pionowy** pasek szans między portretami | `#power-col` 62/38 | ☐ |
| Karty jednostek **lewa** kolumna (siatka 2×) | `unit-grid` atk | ☐ |
| Karty jednostek **prawa** kolumna | `unit-grid` def | ☐ |
| **Środek:** nazwa miejsca + statystyki spotkania | pergamin Kemperbad | ☐ |
| Szanse wygranej / prognoza strat | wiersze + verdict | ☐ |
| **Auto-rozstrzygnij** | przycisk zielony | ☐ |
| **Bitwa ręczna** | przycisk złoty (primary) | ☐ |
| **Wycofaj się** (gdy możliwe) | przycisk czerwony | ☐ |
| **Zapisz grę** przed bitwą | przycisk niebieski (NOWY) | ☐ |

---

## Co dopisać / zmienić (w czacie)

Przykłady:

- „Portrety za duże / za małe”
- „Pasek mocy ma być poziomy, nie pionowy”
- „Brakuje …” / „Usuń zapis gry”
- „Domyślny Enter = Auto / Bitwa ręczna”

Po **mockup OK** napisz: **`C1 mockup OK`**

---

## Powiązania

- C1-Q1: preBattle tylko przy faktycznej bitwie; oblężenie bez szturmu → mapa (C3)
- C2: „Bitwa ręczna” → `battleScene`
- Handoff MAPA: `_handoff/C1-do-MAPA_oblezenie-bez-preBattle.md`
