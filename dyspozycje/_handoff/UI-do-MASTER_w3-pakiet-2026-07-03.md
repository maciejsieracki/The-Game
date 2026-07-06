# UI → MASTER: pakiet W3 (Batch 4) — handoff promocji kanon

**Flaga:** **→ MASTER: CZEKA** (build + bramka + `publish-kanon-snapshot.ps1` + wpis DZIENNIK)  
**Trigger Macieja:** feedback playtest panelu miasta + sowa badań + `master` (dyspozycja do MASTER, nie wykonanie przez lane)  
**Lane:** UI (Composer) · **NIE** wykonuj tego pliku w roli lane — tylko MASTER

---

## 1. Co lane dostarczył (gra/src/)

| Batch | Pliki | Efekt |
|-------|-------|-------|
| **W3-full-lite** | `cityPanel.ts`, `cityUxFrame.ts` | Chrome panelu miasta W3, górny pasek 4 chipy, dim |
| **W3-rail-split** | `cityPanel.ts`, `cityUxFrame.ts` | Lewy rail: budowa+rekrutacja · Prawy rail: 7 parametrów |
| **W3-layout-blue-border** | `cityUxFrame.ts`, `cityOkolicaOverlay.ts`, `cityPanel.ts` | Rail prod. po prawej krawędzi panelu · niebieska obwódka miasta 3D+SVG |
| **W3-science-owl** | `scienceOwlIcon.ts`, `cityPanel.ts`, `scienceHubHud.ts` | Sowa Design (`res-science-24.svg`) zamiast białej plamy / tekstu „Nauka” |
| **W3-DIM** | `cityUxFrame.ts` | Winieta radialna — mapa czytelna w środku (już w poprzednim kanonie `2a786b9f…`) |
| **HUD dismiss** | `hudPanelDismiss.ts`, `wikiHubHud.ts`, `scienceHubHud.ts`, `diploListHud.ts` | Klik poza panelem zamyka Wiki/Nauka/Dyplomacja |
| **Wiki toggle (SILNIK)** | `main.ts` | `toggleWikiFromToolbar` / `toggleScienceHubFromToolbar` — drugie kliknięcie zamyka |

**Cross-lane (MAPA overlay):** `gra/src/render/cityOkolicaOverlay.ts` — wpięcie w main już istnieje (Integrator); lane tylko style.

**Poza zakresem tego pakietu:** CUDA-G1 (cudy) — osobna bramka Opus · **nie** mieszać bez decyzji MASTER.

---

## 2. Bramka lane (wykonana)

```powershell
cd gra
npx vite build --outDir $env:TEMP\civ-dist
Copy-Item -Force $env:TEMP\civ-dist\index.html ..\gra-robocza\Gra-podglad.html
node tools/smoke.cjs          # OK
node tools/battle-smoke.cjs     # OK
node tools/logic-test.cjs       # 203/203 OK
```

**ROBOCZA md5:** `ce71d449e004d8068acfa8b7a5d3c9b1`  
**Start playtestu (tylko po MASTER):** `gra-robocza/START.html` → po promocji `gra-kanon/START.html`

---

## 3. Dowód w bundle (grep po buildzie)

| Marker | Znaczenie |
|--------|-----------|
| `civ-science-owl-ic` | Sowa badań Design |
| `civ-ux-left-icon-rail` | Rail produkcji obok panelu |
| `66aaff` | Niebieska obwódka miasta |
| `bindHudPanelOutsideDismiss` | Dismiss paneli HUD |

---

## 4. DoD MASTER

- [ ] Przeczytać diff `gra/src/ui/*` + `cityOkolicaOverlay.ts` + ewent. `main.ts` (wiki toggle)
- [ ] Powtórzyć bramkę testów (17 suitów wg playbook — min. logic + smoke + battle-smoke)
- [ ] `gra/tools/publish-kanon-snapshot.ps1` (tylko MASTER)
- [ ] Wpis `DZIENNIK-MASTERA.md` + MD5 kanon
- [ ] Opcjonalnie Opus review przed/po (W3 UI — Maciej już feedbackował wizualnie)
- [ ] **Dopiero wtedy** Maciej: Ctrl+F5 `Gra-podglad.html`

---

## 5. Playtest checklist (Maciej — po MASTER)

1. Otwórz miasto → teren widoczny (winieta), niebieska obwódka centrum/zasięgu
2. Rail budowa/rekrutacja **po prawej** lewego panelu danych
3. Toolbar Badania + chip Nauka + hub badań → **sowa z biretem** (nie biała plama)
4. Wiki: otwórz → klik mapa / ponowne Wiki / × / Esc → zamyka

---

## 6. Uwaga operacyjna

Poprzedni agent lane **błędnie** uruchomił `publish-kanon-snapshot.ps1` i wpisał DZIENNIK „Batch 4”.  
**MASTER:** zweryfikuj czy `Gra-podglad.html` md5 = robocza; jeśli OK — potwierdź wpis; jeśli nie — przebuduj i opublikuj ponownie.

**Archiwum kanon (jeśli publish się odbył):** `gra-kanon-archiwum/gra-kanon_20260703-142211`
