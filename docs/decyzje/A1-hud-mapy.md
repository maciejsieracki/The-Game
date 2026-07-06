# A1 — HUD mapy świata

| Pole | Wartość |
|------|---------|
| **ID** | A1 |
| **Ekran** | **Mapa świata** (nie bitwa, nie panel miasta) |
| **Lane** | UI, MAPA |
| **Legacy** | D1, D15, HUD Q1–Q3 (zapis w `docs/MACIEJ-DECYZJE-HUD-MAPA-Q1-Q10.md`) |
| **Status** | **ZAMKNIĘTE decyzje** · wpięcie **F-HUD** (SILNIK) |

---

## Decyzje (zapisane)

| Pytanie | Decyzja | Data |
|---------|---------|------|
| D1 HUD układ | **B** — nowy pasek od zera; **preview first** (mockup przed kodem) | 2026-06-26 |
| Q1 żywność HUD | Hybryda → szczegóły **B5** | 2026-06-26 |
| Q2 bilans +X/turę | **B** — przyrost na górnym pasku, bez panelu lewego | 2026-06-26 |
| Q3 zadowolenie | **C per miasto** → szczegóły **B2** (nie na HUD mapy) | 2026-06-26 |
| D15 minimapa | **B** — siatka heksów | 2026-06-26 |
| **A1-Q5** | **A+C (custom)** — mapa: tylko wojny z nami; Dyplomacja = szczegóły + wojny innych (wywiad) | 2026-06-26 |
| **A1-Q7** | **B (custom Maciej)** — **brak „Idee"** w grze; tylko **Kultura** (+ Nauka itd.) na górnym pasku HUD | 2026-06-26 |
| **A1-Q8** | **A** — wydarzenia z tury: **panel chipów po prawej** (D1B / `sidePanelHud`) | 2026-06-26 |
| **A1-Q9** | **A** — przycisk **WYKONAJ** obok Końca tury + **brama:** bez rozstrzygnięcia chipów wymagających decyzji **nie można** zakończyć tury | 2026-06-26 |
| **A1-Q6** | Toolbar [C]: **Cuda · Budowa** (rev. — 📦 Zasoby OUT); bez Doktryn, Odblokowanych | 2026-06-26 |
| **A1-revA** | **[A] lewa kolumna zasobów:** Żywność · Złoto · Praca · Badania · Bogactwo · Ludność; prawa: Epoka · Nacja · Osiedla · Tura · Dyplomacja | 2026-06-26 |
| **A1-KLIKI** | **Mapa kliknięć** — każdy element HUD/mapy: efekt kliku → `docs/A1-HUD-MAP-KLIKNIEC.md` + Excel **`HUD-mapa-kliki`** | 2026-06-26 |
| **MAPA-F2-Q1** | Toggle zasięgu **kultury** + **religii** obok minimapy → **lane MAPA** (nie Grupa D) | 2026-06-26 |
| **A1-revB** | Mockup: zasoby w rzędzie · Dyplomacja po separatorze · wojna w kafelku [A] · tura przy Końcu tury · bez „Grecy" | 2026-06-26 |
| Nawigacja | Nauka + Dyplomacja → **górny pasek [A]**; dolny [I] = Miasta · WYKONAJ · Koniec · Menu | 2026-06-26 |
| **A1-Q10** | **A+B** — Koniec tury: dolny pasek **oraz** okrąg prawy-dół (oba → ta sama akcja, brama G1) | 2026-06-26 |
| **A1-Q11** | **A** — **Kultura** na pasku [A] (poz. 7): wartość + +X/t; **nie** Wpływ | **2026-06-27** |

| **ABC1** | **A** — akceptacja mockupów D1B P0+P1 | **2026-06-27** |
| **A1-Q13** | **A (korekta)** — wygląd **tylko mockup D1B**; bez okrągu MAPA (nadpisuje A1-Q10 A+B) | **2026-06-27** |
| **A1-Q14** | **C** — ABC teraz → wnętrza mockupów i checklist **na końcu** → SILNIK → ROBOCZA | **2026-06-27** |
| **A1-Q15** | **A** — Power pełny (liczba + overlay); **wyliczanie → Grupa B**; **wyświetlanie → Grupa A**; **dyplomacja → Grupa D** | **2026-06-27** |
| **A1-Q16** | **A** — v1.0: overlay kultura/religia po kliku; **bez** koloru zasięgu na mapie 3D (po v1.0) | **2026-06-27** |
| **A1-Q17** | **C** — ikona Żywności na pasku [A] **bez liczby** (placeholder „—" do B5) | **2026-06-27** |
| **A1-Q18** | **C** — blocking v1.0: **A** (atak + tech + bunt) **+** pusta produkcja miasta **+** obowiązkowa odpowiedź dyplomatyczna | **2026-06-27** |
| **A-OPS-Q1** | **B** — usuń 2 stare pliki HUD (`Makieta-HUD-mapa-swiata.html`, `Gra-podglad-HUD.html`) | **2026-06-27** |
| **A3-Q1** | **B** — bogaty panel łączenia armii przed v1.0 (mockup armii) | **2026-06-27** |
| **A5-Q1** | **custom** — każda cywilizacja: **10 poziomów** miasta + wariant **z murem / bez muru**; dopracować pozostałe civ | **2026-06-27** |
| **A1-MOCKUP-WNETRZA** | **Odłożone na koniec** — ekrany po kliku (Nauka, Dyplomacja, Budowa…) | **2026-06-27** |

Mockup: `UI/Makieta-HUD-D1B-preview.html` · Checklist: `docs/MACIEJ-HUD-CHECKLIST-D1B.md` · Humo-cap: `docs/A1-HUD-HUMO-CAP-SPECYFIKACJA.md` · Schemat: `docs/A1-HUD-SCHEMAT-MAPA-D1B.md` · Hub: `docs/grupa-a/README-INDEX.md`

---

## Wykonanie (lane)

| Element | Stan | Raport |
|---------|------|--------|
| Mockup D1B | **GOTOWY** ABC1=A | `UI-DO-MASTERA.md` |
| Moduły D1B lane | **GOTOWE** (hud, bottomBar, toolbar, build, unit) | batch 2026-06-27 |
| `hud.ts` w main | **CZĘŚCIOWO** (~40%) | Grupa F F-HUD |
| minimapHud + MAPA data | **GOTOWE lane** | `minimap.ts` |
| Q1 zapasy państwa na HUD | **CZEKA** B5 + EKONOMIA | `EKONOMIA-DO-MASTERA` |
| A1-Q5 pasek wojen | **GOTOWE lane** | `hud.ts` + `diplomacyPanel.ts` |

---

## → SILNIK

| Co | Status |
|----|--------|
| Batch F-HUD pełny | **GOTOWE lane** → handoff `UI-MAPA-do-SILNIK_D1B-A4-batch.md` |
| Wpięcie `main.ts` | **CZĘŚCIOWO** (pasek, minimapa, chipy) |
| Kanon publikacja | Czeka ROBOCZA + Opus |

**GOTOWE DO WPIĘCIA (lane):** **TAK** · ABC1=A · moduły 2026-06-27

---

## Otwarte (czat T-A1)

| ID | Temat | Legacy |
|----|-------|--------|
| ~~A1-Q6~~ | ~~Lewy toolbar~~ | **ZAMKNIĘTE → Cuda, Budowa** (📦 Zasoby OUT rev. A1-revA) |
| ~~A1-Q11~~ | ~~Kultura na pasku [A]~~ | **ZAMKNIĘTE → A** (7. pozycja, +X/t) 2026-06-27 |
| ~~A1-Q7~~ | ~~Idee na HUD~~ | **ZAMKNIĘTE → brak idei, tylko Kultura** |
| ~~A1-Q8~~ | ~~Wydarzenia z tury~~ | **ZAMKNIĘTE → A panel chipów po prawej (D1B)** |
| ~~A1-Q9~~ | ~~Przycisk WYKONAJ~~ | **ZAMKNIĘTE → A + brama końca tury** |
| ~~A1-Q10~~ | ~~Koniec tury~~ | **ZAMKNIĘTE → A+B (pasek + okrąg)** |

Opcje ABC: `docs/MACIEJ-DECYZJE-HUD-MAPA-Q1-Q10.md` §5–10.  
Routing: `docs/decyzje/MAPA-PYTAN-OPEN.md` · **A2-Q4** = osobny temat A2.
