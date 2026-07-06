# RAPORT — KANON 1E vs obecna gra

**Data:** 2026-07-06 · **Autor:** UX (czat 3)
**Źródło prawdy:** `UI\KANON — baza wiedzy 1E.zip` → 38 kanonicznych mockupów `.dc.html` + eksport (tokeny, ~323 SVG, mapy).
**Weryfikacja względem:** drzewa produkcyjnego `gra-robocza\srcKopiaMaster` (z niego złożony bundel `3b15f0bab7f6`) + buildu bitwy `gra\src\battle`.
**Metoda:** audyt kodu host-side (Read/Grep) per ekran; markery nowej skórki = importy z `icons/brandAssets`, tokeny `--tg-*`/`--civ-*`, brak emoji.

**Legenda:** ✅ wpięte (skórka 1E w grze) · 🟡 częściowo (jest, ale niepełne / stara wersja / prowizorka) · ❌ brak w grze · **[u kogo wisi]**

**Skala:** z 38 pozycji KANON → **21 ✅ · 13 🟡 · 2 ❌** (+ 6 funkcji w grze bez mockupu — Część C). Build ze „szalupy" NIE cofnął całego UX — regres jest punktowy (A-08 + karty miasta).

---

## CZĘŚĆ A — ✅ WPIĘTE do gry (21)

| Ekran KANON | Plik gry | Dowód |
|---|---|---|
| Design System (tokeny) | `brandTokenVars.ts` + `tokens.css` | mostek `--tg-*`→`--civ-*` |
| Komponenty (wzorce) | `mapUnitHudSkin/diploUiSkin/hudChip6c` | wspólne klasy 1E |
| Ikony (biblioteka) | `icons/iconRegistry.ts` + `brandAssets.ts` | ładuje `*-icon-map.json` |
| HUD Kit | `hud.ts` | brandAssets + tokeny (16×) |
| Motion | `motion.css` | keyframes `tg-*` FROZEN |
| Menu Hero | `mainMenu.ts` | emblem + menu CSS, brak emoji |
| Intro Hero | `newGameFlow.ts` | `newGameIntroEmblemSvg` |
| Kreator + Kroki | `newGameFlow.ts` | `civIconSvg/epochIconSvg` |
| Koniec — zwycięstwo | `victoryScreen.ts` | „E-15 · 1E cinematic" |
| Koniec — porażka | `victoryScreen.ts` | gałąź `przegrana` |
| Badania (picker+hub) | `sciencePicker.ts` + `scienceHubHud.ts` | `scienceOwlIcon`, drzewko |
| Dyplomacja (panel boczny) | `diplomacyPanel.ts` + `diploListHud.ts` | `diploUiSkin` (uścisk dłoni) |
| HUD layout | `hud.ts` | jw. |
| HUD panele stany | `sidePanelHud/hoverDetailDock/contextPanelHud` | tokeny 1E |
| HUD jednostka wybrana | `unitPanelHud.ts` + `mapUnitHudSkin.ts` | gradient, brak emoji |
| A-04 Panel kontekstu heksu | `hoverDetailDock.ts` | „Hover detail card" 1E |
| C-01 Pre-bitwa | `preBattle.ts` | `battleHudTheme`, `--pb-*` |
| C-07 Pole HUD bitwy | `battle/battleScene.ts` + `battleHudTheme.ts` | `applyTopBar1E/RosterPanel1E` |
| C-04 Atak na miasto | `cityAttackChoice.ts` | brandIconSvg, kompletny |
| A-19 Miasto zdobyte | `cityCaptureNotice.ts` | brandIconSvg, kompletny |
| **Panel Moc imperium v3** | `empireDetailPanel.ts` | świeży reskin, **w buildzie 3b15f0bab7f6** |

---

## CZĘŚĆ B — 🟡/❌ mockup JEST, w grze brak lub stara skórka

To rzeczy do wpięcia po naszej stronie: **[UX koduje w `srcKopiaMaster\ui` → INTEGRATOR 1 rebuild]**.

### P0 — widoczne od razu w rozgrywce
| # | Pozycja | Plik | Stan | Mockup KANON |
|---|---|---|---|---|
| 1 | **A-08 Tryb budowy ulepszeń** | `buildModeHud.ts` | 🟡 **REGRES: emoji zamiast SVG** (`🌾🏛️…`); brak `improvementIconSvg` + `improvement-icon-map.json` | jest (A08) |
| 2 | **Miasto — karty budynków Poziom B** | `cityPanel.ts` | ❌ brak `buildBuildingInfocard` w produkcji | `Budynki infografiki` |
| 3 | **Miasto — rekrutacja / karty jednostek** | `cityPanel.ts` + `unitRecruitCard.ts` + `unitInfographic.ts` | ❌ pliki nieobecne; rekrutacja = lista tekstowa | `C09 Karty jednostek` |
| 4 | **Miasto — wnętrza zakładek W4** | `cityPanel.ts` | 🟡 ramka jest; wnętrza Rekrutacja/Zdrowie/Kultura/Religia/Porządek ≠ mockup | `Miasto Zakładki W4/6-klatek` |

> Zależności do dołożenia razem: helper `improvementIconSvg` (brandAssets.ts) + `improvement-icon-map.json`. **Surowe ikony `imp-*.svg` już są** w produkcji → port mały.

### P1 — bitwa (osobny build POLE-BITWY, skiny częściowe vs v4/v5)
| # | Pozycja | Plik | Stan |
|---|---|---|---|
| 5 | C-09 Roster v4 | `battle/battleScene.ts` | 🟡 baza jest; sloty/„Grupa 1·20" ≠ mockup v4 |
| 6 | C-06 Popup Strategia v4 | `battle/battleScene.ts` | 🟡 treść popupu stub (dropdown/scroll/medaliony) |
| 7 | C-06 Deployment v4 | `battle/battleScene.ts` | 🟡 top-bar VS gap ≠ mockup |
| 8 | Popupy deploy v5 | `battleHudTheme.ts` | 🟡 szkielet ~70% |
| 9 | C-12 Koniec bitwy | `battle/endScreen1E.ts` | 🟡 wpięte **v2**, mockup jest **v3** |

### P2
| 10 | C-05 dolny pasek oblężenia | `siegeMapPanel.ts` | 🟡 oznaczony „nie renderowany" |

---

## CZĘŚĆ C — ❌ BRAK MOCKUPU → do stworzenia przez designera

Funkcje istnieją w kodzie, ale **nie mają odpowiednika wśród 38 ekranów KANON**. **[wisi na Designerze]**

| Funkcja w grze | Plik | Uwaga |
|---|---|---|
| **Panel Wiki boczny** | `wikiHubHud.ts` | jest ikona `ui-wiki.svg` + przycisk, brak mockupu panelu (WIKI-P) |
| **Hub nauki — pełne drzewko technologii** | `scienceHubHud.ts` | picker/hub objęte „Badania", ale pełne drzewko (NAU-01) = HOLD Macieja, brak mockupu |
| **A-06 Panel jednostki (pełny, akcje)** | `unitPanelHud.ts` | HUD wybranej jednostki jest; pełny panel akcji bez mockupu |
| **A-10 Panel armii (pełny)** | `armyListHud.ts` | lista objęta „Wojsko"; pełny panel armii bez mockupu |
| **A-27 Modal dyplomacji blocking** | `diplomacyNegotiationModal.ts` / `diplomacyAudience.ts` | panel boczny objęty; pełna audiencja/negocjacja bez mockupu |
| **C-23 Szczegóły bitwy** | `battle/endDetails1E.ts` | jest na liście KANON, ale realnego mockupu `.dc.html` brak — plik to prowizorka |

Poboczne HUD-y bez kanonicznego ekranu (do decyzji, czy w ogóle potrzebują skórki designera): `armyStackHud`, `armySplitPanel`, `armyMergePanel`, `orderPanel`, `minimapHud`, `leaderBannersHud`, `gamePauseMenu`, `powerOverlayHud` (stary modal Mocy — do wygaszenia).

---

## NASTĘPNE KROKI (rekomendacja UX)

1. **Regresy P0 (mój lane) — mogę cofnąć od razu na „działaj":** A-08 (emoji→SVG) + karty miasta (Poziom B / rekrutacja / W4) w `srcKopiaMaster`, potem INTEGRATOR robi 1 rebuild. To najbardziej widoczne braki.
2. **Bitwa P1** — dopięcie roster/strategia/deploy/koniec do wersji v4–v5 (osobny build POLE-BITWY).
3. **Część C (6 pozycji)** — decyzja Twoja: zlecić Designerowi mockupy (Wiki, drzewko nauki, panel jednostki A-06, panel armii A-10, modal dyplomacji A-27; C-23 = potwierdzić czy wchodzi do v1.0).
4. Gdy przyślesz **pakiet zmian designera** — zderzę go z tym stanem (zaktualizuję Część A/B/C).
