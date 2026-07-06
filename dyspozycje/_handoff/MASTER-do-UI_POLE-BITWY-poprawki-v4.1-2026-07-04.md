# MASTER → UI: POLE-BITWY poprawki v4.1 (popup Strategia 1E + skin)

**Status:** **ZAMKNIĘTE · KOMPLET** — kanon v4.1 · MD5 końcowy `9eb46ad1…` · 2026-07-04  
**Data:** 2026-07-04  
**Trigger:** Design dostarczył paczkę **`POLE-BITWY-poprawki-v4.1-2026-07-04`**

---

## Paczka Design

| Pole | Wartość |
|------|---------|
| **Nazwa ZIP** | `POLE-BITWY-poprawki-v4.1-2026-07-04.zip` |
| **Docelowa ścieżka w repo** | `docs/ux/claude-design/_dist/POLE-BITWY-poprawki-v4.1-2026-07-04/` |
| **Handoff MUST** | `DESIGN-do-UI_POLE-BITWY-poprawki-v4.1.md` |
| **Mockup główny** | `The Game - C06 Popup Strategia v4 2026-07-04 (1E).dc.html` |

**Baseline kodu:** kanon POLE-BITWY v4b (`POLE-BITWY-20260704-design-v4b-topbar`) · `Gra-podglad-POLE-BITWY.html`

---

## Scope lane UI (P0)

### 1. Popup Strategia — port 1E (główna poprawka)

Z mockupu C06 Popup Strategia v4 (1E):

- [x] Dropdowny w **złotej szacie** (koniec z natywnym granatowym `<select>` przeglądarki)
- [x] **Mini-medaliony typów** przy opcjach (koń / łuk / tarcza)
- [x] **Złota strzałka SVG** (chevron) zamiast domyślnej
- [x] **Stała wysokość + scroll** zgodnie z 1E (panel nie „skacze”)
- [x] **Sticky** „Skopiuj z priorytetów armii” u dołu popupu
- [x] **Checkbox** w stylu 1E (złota obwódka / stan aktywny)

**Pliki kodu (szacunek):**

| Plik | Region |
|------|--------|
| `gra/src/battle/battleScene.ts` | `_buildDeployStrategyPopup` / popup Strategia deploy + walka |
| `gra/src/battle/battleHudTheme.ts` | tokeny dropdown 1E, checkbox 1E, medaliony typów |

**NIE** zmiana logiki priorytetów — tylko skin + UX scroll/sticky.

---

## Scope lane UI (P1 — drobny skin, notatki w handoff Design)

W `DESIGN-do-UI_POLE-BITWY-poprawki-v4.1.md` (bez osobnych mockupów):

| # | Temat | Uwaga |
|---|--------|--------|
| 2 | **Top-bar cluster** | dopasowanie odstępów / wyrównania chipów K/P/Ł vs mockup |
| 3 | **Nagłówki grup** | etykieta **`Grupa N · liczba`** (zamiast dwulinii „N / cnt”) |
| 4 | **Puste sloty** | wizualne placeholdery w siatce rosteru (gdy mniej jednostek niż komórek) |

Można zrobić w **tym samym batchu** co P0, jeśli ≤1 przebieg build; inaczej P1 osobno po playteście Strategii.

---

## Poza scope

- Balans / tempo walki
- `main.ts` · `combat.ts`
- Oblężenie C-19/C-20
- Fix funkcjonalny grupowania deploy (UNITS — osobny batch w `battleScene.ts`, jeśli jeszcze nie w kanonie)

---

## Build / DoD

```powershell
cd gra
npx vite build --config vite.oblezenie-bitwa.config.ts
# → root: Gra-podglad-POLE-BITWY.html
```

- [x] Popup Strategia wizualnie zgodny z mockupem 1E (dropdown/checkbox/sticky/scroll)
- [x] P1 (top-bar / nagłówki grup / puste sloty)
- [x] Fix grupowania deploy (podział konnicy)
- [x] Marker buildu w kanonie: `POLE-BITWY-20260704-poprawki-v4.1` — **promote MASTER 2026-07-04**
- [x] Meldunek append `UI-DO-MASTERA.md` → **`→ MASTER: GOTOWE`**

---

## Test Macieja

Ctrl+F5 `Gra-podglad-POLE-BITWY.html` · otwórz **Strategia** (deploy + faza R) · porównaj z mockupem obok siebie · sprawdź scroll + sticky „Skopiuj z priorytetów armii”.

*Lane UI · The Game · POLE-BITWY poprawki v4.1 · 2026-07-04*
