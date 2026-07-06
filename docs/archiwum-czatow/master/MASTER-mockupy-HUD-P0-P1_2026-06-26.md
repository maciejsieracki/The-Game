# MASTER — sesja mockupów HUD (P0+P1)

| Pole | Wartość |
|------|---------|
| **Data** | 2026-06-26 |
| **Tryb** | Autonomiczna praca agenta (bez Macieja) |
| **Zakres** | Mockupy HTML — **NIE** `gra/src`, **NIE** kanon |

---

## Podsumowanie sesji

Zbudowano **pełny hub kliknięć** na mapie strategicznej: każdy interaktywny element otwiera docelowy ekran (FS/MD/DK/MP), plus spięcie flow Menu → Nowa gra → HUD.

---

## Pliki utworzone

| Plik | Opis |
|------|------|
| `UI/Makieta-dyplomacja.html` | Panel dyplomacji FS, fokus `?focus=Nacja` |
| `UI/Makieta-preBattle.html` | Pre-bitwa Grecy vs Persja (kompaktowy overlay) |
| `UI/Makieta-cuda.html` | Lista cudów |
| `UI/Makieta-panel-jednostki.html` | Panel jednostki [H] |
| `docs/A1-FLOW-EKRANY-GRY.md` | Flow S0→S1→S2 |
| `docs/A1-HUD-KLIKI-MOCKUP-PRZEWODNIK.md` | Tabela klik→ekran |
| `docs/MACIEJ-HUD-CHECKLIST-D1B.md` | Checklist akceptacji Macieja |

---

## Pliki zmodyfikowane

| Plik | Zmiana |
|------|--------|
| `UI/Makieta-HUD-D1B-preview.html` | FS/DK/MP warstwy, podpięcie wszystkich klików, hotspoty mapy, tooltips |
| `UI/Gra-podglad-MENU.html` | Link Nowa Gra → flow; embed Wznów grę |
| `UI/Makieta-flow-nowa-gra.html` | Auto redirect do HUD po generacji |
| `docs/A1-HUD-PLAN-MOCKUPY-KLIKNIECIA.md` | Status P0 ZROBIONE |
| `UI/_INDEX.md` | Nowe pliki mockupów |
| `docs/czaty/DO-MASTERA.md` | Wpis handoff |

---

## Decyzje podjęte przez agenta (MOŻNA WYCOFAĆ)

| # | Decyzja | Uzasadnienie | Jak wycofać |
|---|---------|--------------|-------------|
| D-M1 | **iframe FS/DK** zamiast inline HTML | Szybkie podpięcie istniejących mockupów bez duplikacji | Usuń `#fs-layer`/`#dk-layer` w D1B, wróć do toast |
| D-M2 | **Blocking rozstrzyga się** po zamknięciu pre-bitwy LUB kliku akcji w pre-bitwie | Symuluje G1 bez wymuszania Auto | `resolveBlocking` tylko w `closeFS` |
| D-M3 | **Flow auto-redirect** po kroku 5 (0,9 s) | Maciej chciał pełną ścieżkę startu | Usuń `setTimeout` w `startGen()` flow |
| D-M4 | **Miasta [C]**: MD lista → FS miasto | Plan P1, mniej skoków niż od razu FS | `btn-cities` → bezpośrednio `openFS(MIASTO)` |
| D-M5 | **Obce miasto** Persepolis → dyplomacja Persja | Spec A1-KLIKI | Usuń `#hot-enemy-city` |
| D-M6 | **Etykieta Power** (nie Potęga) | Istniejąca decyzja A1-Power | Zmiana etykiety w D1B HTML |
| D-M7 | **Pre-bitwa**: alert demo na przyciskach | Mockup, nie silnik | Zamienić na toast lub ciszę |
| D-M8 | **Nie ruszano** `gra/src/main.ts` ani kanonu | Reguła workflow | — |

---

## Następne kroki (po Macieju)

1. Playtest hub + checklist `docs/MACIEJ-HUD-CHECKLIST-D1B.md`
2. ABC: Power/Potęga, pre-bitwa UX, lista miast
3. Review Opus (Ask) → handoff MASTER `UI-do-MASTER_hud-D1B`
4. P2: panel jednostki A2-Q4, dopracowanie tooltips Excel

---

## Eksport pełny

_(placeholder — Maciej może wkleić eksport z Cursor UI)_
