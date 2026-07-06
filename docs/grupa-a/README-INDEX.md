# Grupa A — Mapa świata (hub plików roboczych)

> **Jeden punkt wejścia** dla lane Grupa A (HUD, jednostka, ruch, budowa, wygląd mapy).  
> Kod gry zostaje w `gra/src/ui/` i `gra/src/map/` — tu tylko **docs, mockupy, handoffy, Excel**.

**Charter:** [`docs/czaty/GRUPA-A-MAPA-SWIATA.md`](../czaty/GRUPA-A-MAPA-SWIATA.md)  
**Audyt (2026-06-27):** [`AUDIT-2026-06-27.md`](AUDIT-2026-06-27.md)  
**Handoffy → SILNIK:** [`HANDOFF-INDEX.md`](HANDOFF-INDEX.md)  
**Decyzje Macieja (routing):** [`docs/decyzje/MAPA-PYTAN-OPEN.md`](../decyzje/MAPA-PYTAN-OPEN.md)

---

## Start playtestu (Maciej)

| Krok | Plik |
|------|------|
| Launcher | [`UI/Makieta-START.html`](../../UI/Makieta-START.html) |
| Menu | [`UI/Gra-podglad-MENU.html`](../../UI/Gra-podglad-MENU.html) |
| Kreator | [`UI/Makieta-flow-nowa-gra.html`](../../UI/Makieta-flow-nowa-gra.html) |
| **Silnik [S2]** | [`Gra-podglad.html`](../../Gra-podglad.html) (alias: [`Makieta-HUD-D1B-preview.html`](../../UI/Makieta-HUD-D1B-preview.html)) |
| Checklist | [`docs/MACIEJ-HUD-CHECKLIST-D1B.md`](../MACIEJ-HUD-CHECKLIST-D1B.md) |

---

## Tematy A1–A5

| ID | Plik decyzji | Status decyzji | Implementacja lane | Wpięcie SILNIK |
|----|--------------|----------------|------------------|----------------|
| **A1** | [`A1-hud-mapy.md`](../decyzje/A1-hud-mapy.md) | **ZAMKNIĘTE** (ABC1=A, Q5–Q12) | Moduły `hud.ts` + D1B | **~40%** — batch F-HUD |
| **A2** | [`A2-jednostka-mapa.md`](../decyzje/A2-jednostka-mapa.md) | **ZAMKNIĘTE** A2-Q4=A | `unitPanelHud.ts` | **CZEKA** F-HUD |
| **A3** | *(brak pliku)* — D6, D8 w KARCIE | CZĘŚCIOWO | `armyStackPrompt.ts` | częściowo |
| **A4** | [`A4-D4-przeglad-ulepszen-terenu.md`](../decyzje/A4-D4-przeglad-ulepszen-terenu.md) | **ZAMKNIĘTE** A4-D4-Q1=A, A4-Q1=A | `buildModeHud.ts`, `improvement-build.ts` | **CZEKA** F-HUD |
| **A-FOG** | [`A-FOG-Q1-widok-jednostki.md`](A-FOG-Q1-widok-jednostki.md) | **ZAMKNIĘTE → B** | `visibility.ts`, `units.json` | **→ SILNIK: GOTOWE** |
| **A5** | *(brak pliku)* — D12 w KARCIE | CZĘŚCIOWO | `bronzeCity.ts`, podgląd MAPA | render OK |

---

## Mockupy aktywne (`UI/`)

| Plik | Rola |
|------|------|
| `Makieta-HUD-D1B-preview.html` | Alias [S2] → ROBOCZA |
| `Makieta-HUD-mapa-swiata.html`, `Gra-podglad-HUD.html` | Redirect → ROBOCZA |
| `Makieta-panel-jednostki.html` | Panel [H] A2-Q4 |
| `Makieta-dyplomacja.html`, `preBattle.html`, `cuda.html`, `panel-armii.html` | P1 po kliku z huba |
| `mockup-embed.js` | iframe helper |
| `Civ-MAPA/Gra-podglad-ULEPSZENIA.html` | Podgląd placementu A4 (lane MAPA) |

**Archiwum (nie używać):** `UI/_archiwum/` — stare mockupy HUD.

---

## Specyfikacje HUD (docs)

| Plik | Rola |
|------|------|
| `A1-revB-uklad-mockup.md` | Układ stref [A]–[I2] |
| `A1-revA-zasoby-pasek.md` | 7 zasobów + Kultura (A1-Q11) |
| `A1-HUD-MAP-KLIKNIEC.md` | Logika 32 klików |
| `A1-HUD-KLIKI-MOCKUP-PRZEWODNIK.md` | Playtest krok po kroku |
| `A1-FLOW-EKRANY-GRY.md` | S0→S1→S2 |
| `MACIEJ-DECYZJE-HUD-MAPA-Q1-Q10.md` | Legacy Q1–Q10 (archiwum decyzyjne) |

---

## Excel / panele decyzyjne

| Plik | Rola | Status |
|------|------|--------|
| [`MIASTO/Ulepszenia-terenu.xlsx`](../../MIASTO/Ulepszenia-terenu.xlsx) | 15 ulepszeń — kolumna **Komentarz Naster** | **Zamknięte** A4-D4-Q1=A; Excel = referencja |
| [`MIASTO/Ulepszenia-terenu-spec.md`](../../MIASTO/Ulepszenia-terenu-spec.md) | Opis bonusów/kosztów | Sync z JSON |
| `Status-projektu-The-Game.xlsx` → arkusz **HUD-mapa-kliki** | Mapa kliknięć HUD | Odniesienie A1-KLIKI |
| Regeneracja Excel ulepszeń | `gra/tools/gen-ulepszenia-xlsx.py` | Po zmianie `terrain-improvements.json` |

---

## Raportowanie lane

| Kierunek | Plik |
|----------|------|
| Lane → Master | `docs/czaty/DO-MASTERA.md` § Grupa A |
| Master → Lane | `docs/czaty/OD-MASTERA.md` § Grupa A |
| UI meldunki | `dyspozycje/UI-DO-MASTERA.md` |
| MAPA meldunki | `dyspozycje/MAPA-DO-MASTERA.md` |

**Komenda Macieja:** `master` → `OD-MASTERA.md` § A.

---

## Otwarte ABC w Grupie A

**C3-Q1…Q10** — oblężenie na mapie (paczki po 5 ABC): `docs/grupa-a/C3-PYTANIA-PACZKA-*.md`  
**C1** preBattle — decyzje **zamknięte** (`C1-wejscie-walke.md`); implementacja/wpięcie w tym czacie.

Granica vs **Grupa C (Walka):** `docs/grupa-c/GRANICA-C-vs-MAPA.md`

Szczegóły A1–A5: [`AUDIT-2026-06-27.md`](AUDIT-2026-06-27.md).
