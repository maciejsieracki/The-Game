# Maciej → lane: delegacja pracy (2026-06-28)

**Od:** Maciej (decydent) · **Przekazuje:** Grupa F (SILNIK) w imieniu Macieja  
**Powód:** sesja pilna zakończona po stronie silnika — reszta **nie jest robota SILNIK**.

**Kanon do testów:** `Gra-podglad.html` (md5 `0a049ccc2d195459a73a619b62a9b325`)

---

## Instrukcja dla Macieja

| Co | Kto | Akcja |
|----|-----|--------|
| Otwórz czat lane | Ty | Nowa zakładka → wklej dyspozycję z `docs/czaty/DYSPOZYCJA-*.md` lub napisz **`start`** |
| Opus review | Ty | Cursor → **Opus 4.8 Ask** → `docs/decyzje/OPUS-REVIEW-QUEUE.md` |
| HUD D1 / minimapa | Ty | Osobny czat (wcześniejsza decyzja) → `docs/czaty/GRUPA-A-MAPA-SWIATA.md` |
| B1 tech Q1–Q5 | Ty | Litery ABC w `docs/decyzje/B1-tech-ABC-OTWARTE.md` — dopiero potem CYW+EKONOMIA |

---

## Zlecenia lane (wykonaj bez pytania SILNIK)

### Civ-UI — `dyspozycje/UI.md`

| ID | Temat | ABC | Handoff |
|----|-------|-----|---------|
| **E-P0-01…03** | Menu S0 hybryda, Kampania Wkrótce, wideo | 5=C, 6=A, 7=A | `_handoff/GRUPA-E-do-UI_menu-S0-5C.md` |

**Po GOTOWE:** `UI-DO-MASTERA.md` + `→ SILNIK: GOTOWE` w `DO-MASTERA.md`

---

### Civ-MAPA — `dyspozycje/MAPA.md`

| ID | Temat | ABC | Handoff |
|----|-------|-----|---------|
| **OBL-S6** | Obóz oblężniczy 3D | Q10=C | `_handoff/MASTER-do-MAPA_oboz-3D-OBL-S6.md` |
| **E-P0-04/05** | Złoża miedź/żelazo epok | 8=B*, 9=B | `_handoff/GRUPA-E-do-MAPA_zloza-epoki-8B-star.md` |
| **MAP-S1** | 10 poziomów miast + mury (P2) | A5 | `_handoff/A5-do-MAPA_miasta-10poziomow-mury.md` |
| **E1 presety** | 3 wyglądy mapy | E1 spec | `docs/grupa-e/SPEC-jakosc-render-i-mapa.md` |

**Po GOTOWE:** `MAPA-DO-MASTERA.md` + `→ SILNIK: GOTOWE` jeśli kontrakt cross-lane

---

### Civ-CYWILIZACJE — `dyspozycje/CYWILIZACJE.md`

| ID | Temat | ABC | Handoff |
|----|-------|-----|---------|
| **D-P0-01…03** | Excel AI kopie typu | Grupa D 5A | `MASTER-do-CYWILIZACJE_D-START-kopie-pilne.md` · `P0-KOLEJKA-LUKI.md` § Grupa D |
| **E-P0-06** | Zwycięstwo Power+rakieta | 10=A* | `_handoff/GRUPA-E-do-CYWILIZACJE_victory-10A-star.md` |
| **E2-11** | Barbarzyńcy reguła epok | 11=C* | `docs/grupa-e/decyzje/PACZKA-ABC-BLOKERY.md` |
| **diplomacy-test** | 3 FAIL regresji (132/135) | — | lane DYPLO/CYW — eskalacja od SILNIK 28.06 |

**Po GOTOWE (victory):** moduł lane → `→ SILNIK: GOTOWE` → F wpina `main.ts` jeśli trzeba

---

### Civ-EKONOMIA — `dyspozycje/EKONOMIA.md`

| ID | Temat | Handoff |
|----|-------|---------|
| **EKO-P2-01** | Pełny tick żywności imperium B5 | `_handoff/EKONOMIA-do-SILNIK_B5-empire-food.md` |
| **B1 tech** | Drzewko ↔ ulepszenia | `docs/decyzje/B1-tech-ABC-OTWARTE.md` — **CZEKA ABC Macieja** (wspólnie z CYW) |

**HUD B5 wyświetlanie = już w silniku** — lane tylko logika ticku.

---

## NIE lane (Maciej / proces)

| Temat | Kto |
|-------|-----|
| Opus → kanon HUD-S7 | **Opus Ask** (Ty, ręcznie) |
| Playtest checklist sesji | **Ty** — handoff test SILNIK |
| Decyzje D1–D15 karta | **Ty** — gdy chcesz |

---

## Flow po wykonaniu

```
Lane kończy → → SILNIK: GOTOWE → Grupa F (bramka + ROBOCZA) → Master → Opus → Gra-podglad.html
```

**Potwierdzenie przekazania:** wpisy w `*-DO-MASTERA.md` + `DO-MASTERA.md` § A/B/D/E · `DZIENNIK-MASTERA.md`
