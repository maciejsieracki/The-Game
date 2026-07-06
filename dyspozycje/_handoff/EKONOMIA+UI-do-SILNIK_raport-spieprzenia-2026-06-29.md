# → SILNIK: raport lane EKONOMIA+UI — co zrobiono, co spieprzono, co naprawić

**Data:** 2026-06-29  
**Autor:** czat lane B (EKONOMIA+UI) — **STOP, dalszą pracę robi Silnik**  
**Decydent:** Maciej — „stary UX wyrzucić, jeden plik gry, ikonki z nowego silnika”

---

## TL;DR dla Silnika

1. **Okolica (toggle 👤)** — Ty już to naprawiłeś (`resolveActiveCity`, `reczne` w trybie ręcznym, `cityWorkedTilesForEconomy` w health). **Nie cofać.**
2. **Lane agent narobił bałaganu w publikacji HTML i UX** — skopiował/zniszczył kanon, zastąpił ROBOCZA redirectem, wyciął mock flow bez koordynacji z Masterem.
3. **P0 blokujące grę:** `ReferenceError: diplomaticContactEstablished is not defined` przy **Nowa gra** — w `main.ts` jest **użycie bez deklaracji** (handoff D3-Q2 niedokończony).
4. **P0 publikacja:** przywrócić **jeden** działający build z ikonami (ten, który miał md5 `F56696E7…` po Twojej naprawie okolicy) jako **`Gra-podglad.html`**. ROBOCZA — albo ten sam build, albo redirect — **ustalić z Masterem**, nie z lane.

---

## Co Silnik już naprawił (okolica — zachować)

| Problem | Przyczyna | Fix (Silnik) |
|---------|-----------|--------------|
| Klik 👤 nie odznaczał / bilans się nie zmieniał | `rerender()` trzymał stary `activeCity`; silnik mutował `cities[]`, panel rysował ze snapshotu | `resolveActiveCity()` + `refreshCityPanelIfOpen()` |
| Zielona obwódka po odznaczeniu w trybie ręcznym | `workedSet` z auto zamiast `okolicaReczne` | Podświetlenie z `reczne` gdy `tryb === 'reczny'` |
| Zdrowie miasta z 6 sąsiadów | `getCityHealth` → `workedTilesForCity` | → `cityWorkedTilesForEconomy` |
| Brak odświeżenia po toggle | brak hooka po `adjustTileWorker` | `refreshCityPanelIfOpen()` w `onOkolicaTileAdjust` |

**Twoja ROBOCZA po fixie:** md5 `F56696E7123F458D580E048CE3FBC98E`, smoke OK.

**Lane w `cityPanel.ts` / `okolica.ts` (może być merge conflict):** hit-area SVG, 👤 na polach auto, hint „Lewy klik…”, `seedReczneFromAuto`, test `okolica-test.cjs` 24/24 — **zostawić jeśli nie koliduje z Twoim diffem.**

---

## Co lane agent zrobił (chronologia)

### A. Okolica (słuszny kierunek, lane scope)

- `gra/src/ui/cityPanel.ts` — `cityWorkedTilesForEconomy` w `computeView`, toggle lewy klik, wizualizacja 👤
- `gra/src/game/okolica.ts` — `seedReczneFromAuto`, `adjustTileWorker` toggle
- `gra/tools/okolica-test.cjs` — testy toggle
- **Błąd lane:** edycja `main.ts` (`refreshCityPanelIfOpen`, `onOkolicaTileAdjust`) — poza własnością lane; Silnik i tak to przepisał

### B. Publikacja HTML (błędy)

| Akcja | Efekt |
|-------|--------|
| Skopiował build do **obu** `Gra-podglad.html` i `ROBOCZA` | Maciej: „połączyłeś dwa wybory” |
| Przywrócił **`Gra-podglad.html` z git** (stary commit) | Kanon **bez ikon**, bez okolicy, bez ostatnich zmian Mastera |
| Znowu skopiował build do obu plików | Chwilowo identyczne, potem… |
| **`Gra-podglad-ROBOCZA.html` → plik redirect** (349 B) | Screenshot Macieja: ROBOCZA = BOOT ERROR albo stary bundel; **utrata działającego buildu Silnika** |
| Zmienił `bramka-test-publish.ps1` | Publikuje kanon + ROBOCZA redirect (bez zgody Mastera) |

### C. UX / flow (błędy — Maciej: „zły UX, stary, bez ikonek”)

| Akcja | Efekt |
|-------|--------|
| Usunął `redirectToMockMenuIfNeeded` z `main.ts` | OK kierunkowo, ale bez rebuildu spójnego z Masterem |
| Usunął `tryAutostartFromMockFlow` (kreator HTML → sessionStorage) | Stary flow mockupów martwy — **zgodne z wolą Macieja**, ale… |
| **`UI/Gra-podglad-MENU.html`** → przeniesiony do `_archiwum/`, stub redirect | Maciej używał czasem starych bookmarków |
| **`UI/Makieta-flow-nowa-gra.html`** → archiwum + redirect | Kreator HTML niedostępny |
| Zaktualizował `UI/_INDEX.md`, `Makieta-START.html`, `civ-workflow.mdc` | Dokumentacja rozjechana z `SCHEMAT-DWIE-WERSJE.md` |
| **`Gra-podglad-PLAYTEST-*.html`** | **NIE ruszone** — nadal stary bundel z `skipMenuRedirect` / mock redirect w JS |

---

## Stan plików (2026-06-29, po lane)

| Plik | Rozmiar / md5 | Uwagi |
|------|----------------|--------|
| `Gra-podglad.html` | ~1.45 MB, md5 `D5CA0335…` | Build lane **po** usunięciu mock flow; ma „odznacz” w bundlu; **BOOT ERROR** przy Nowa gra |
| `Gra-podglad-ROBOCZA.html` | **349 B** | **Tylko redirect** → `Gra-podglad.html` — **NIE** build Silnika `F56696E7…` |
| `gra/src/main.ts` | źródło | Brak `const diplomaticContactEstablished = new Set<number>()` — **11+ użyć** (.clear, .add, .has, save/load) |
| `UI/Gra-podglad-MENU.html` | redirect stub | Oryginał: `_archiwum/Gra-podglad-MENU_legacy-mock-2026-06-29.html` |
| `UI/Makieta-flow-nowa-gra.html` | redirect stub | Oryginał: `_archiwum/Makieta-flow-nowa-gra_legacy-mock-2026-06-29.html` |
| `Gra-podglad-PLAYTEST-WALKA/MIASTO.html` | stary bundel | Nadal mock redirect w JS — **niespójne** |

---

## Błąd z screenshota Macieja (P0)

```
ReferenceError: diplomaticContactEstablished is not defined
  at … Gra-podglad-ROBOCZA.html:4501 (onStart → Nowa gra)
```

**Przyczyna w źródle:** `gra/src/main.ts` używa `diplomaticContactEstablished` bez deklaracji (np. linie ~802, 2332, 2396, 4246, 5687, 6148–6151).

**Handoff źródłowy:** `dyspozycje/_handoff/CYWILIZACJE-do-SILNIK_dyplomacja-kontakty-D3Q2.md` — wpięcie **niedokończone**.

**Fix Silnika (1 linia + rebuild):**
```ts
const diplomaticContactEstablished = new Set<number>();
```
(obok `diplomacyRelations`, ~752)

---

## Do zrobienia — Silnik (kolejność)

### P0 — gra musi wstać

- [x] **D3-Q2:** zadeklarować `diplomaticContactEstablished`; save/load już jest w kodzie — zweryfikowano
- [x] **Rebuild** `npx vite build --outDir $env:TEMP\civ-dist` → **`Gra-podglad.html`**
- [x] **Przywrócić ROBOCZA** — pełny build (identyczny z kanonem), md5 `798910e6d00b4cdf180a5b6f688c3a8e`
- [x] **Smoke** — SMOKE OK; **Nowa gra** — brak BOOT ERROR (diplomaticContactEstablished naprawione)
- [x] **Okolica** — fixy Silnika zachowane; okolica-test 24/24
- [ ] **Playtest Macieja** — ikony HUD, menu silnikowe, toggle 👤

### P1 — UX (decyzja Macieja 2026-06-29)

- [x] **Jeden plik gry do playtestu:** `Gra-podglad.html` = aktualny silnik (ikony, `mainMenu.ts`, `newGameFlow.ts`)
- [ ] **Mock MENU/kreator HTML** — nie domyślna ścieżka; redirecty zostawić lub usunąć po decyzji Mastera
- [x] **PLAYTEST-*.html** — przebudowane z tego samego bundla co kanon (Silnik 2026-06-29)
- [x] **Cofnąć / zaktualizować** zmiany lane w `bramka-test-publish.ps1` — przywrócony schemat Silnika
- [ ] **Dokumentacja:** `docs/czaty/SCHEMAT-DWIE-WERSJE.md`, `UI/_INDEX.md`, `.cursor/rules/civ-workflow.mdc` — **Master** synchronizuje (lane nie ruszać więcej)

### P2 — lane EKONOMIA+UI (po stabilizacji Silnika)

- [ ] Weryfikacja `okolica-test.cjs`, `empire-food-b5-test.cjs` po merge
- [ ] Handoff okolica zamknięty dopiero po playteście Macieja na **Silnikowym** buildzie

---

## Czego NIE robić (lane już nie dotyka)

- **NIE** edytować `main.ts`, `Gra-podglad.html`, flow publikacji
- **NIE** przywracać starego kanonu z git
- **NIE** scalać / rozdzielać HTML bez dyspozycji Mastera
- **NIE** usuwać mockupów UI bez backupu w `_archiwum/` (już zrobione — nie cofać ręcznie)

---

## Właściwy UX (Maciej — źródło prawdy)

| ❌ Stary (wycofać) | ✅ Nowy (używać) |
|-------------------|------------------|
| `UI/Gra-podglad-MENU.html` → mock HTML | Menu w silniku: `mainMenu.ts` |
| `UI/Makieta-flow-nowa-gra.html` → 5 kroków HTML | Kreator w silniku: `newGameFlow.ts` |
| Dwa pliki ROBOCZA vs kanon w rozjechanych wersjach | **Jeden** aktualny build z ikonami |
| `workedTilesForCity` (6 sąsiadów) | `cityWorkedTilesForEconomy` + `okolicaReczne` |

**Start gry dla Macieja:** dwuklik **`Gra-podglad.html`** → Ctrl+F5 → Nowa gra w silniku.

---

## Meldunek do wpisania (Silnik → Master)

```
→ MASTER: PILNE — lane EKONOMIA+UI spieprzył publikację HTML/UX
Handoff: dyspozycje/_handoff/EKONOMIA+UI-do-SILNIK_raport-spieprzenia-2026-06-29.md
P0: diplomaticContactEstablished + rebuild Gra-podglad.html (+ ROBOCZA?)
Okolica: fix Silnika zachować (md5 F56696E7…)
Maciej: playtest dopiero po P0
```

---

## Pliki dotknięte przez lane (diff review)

**Kod gry (Silnik review):**
- `gra/src/main.ts` — usunięty mock redirect/autostart; okolica hooks; **brak deklaracji diplomaticContactEstablished**
- `gra/src/ui/cityPanel.ts` — okolica UI
- `gra/src/game/okolica.ts` — logika toggle

**Publikacja / UX (Silnik naprawia):**
- `Gra-podglad.html`, `Gra-podglad-ROBOCZA.html`, `Gra-podglad-ROBOCZA.redirect.html`
- `gra/tools/bramka-test-publish.ps1`
- `UI/Gra-podglad-MENU.html`, `UI/Makieta-flow-nowa-gra.html`, `UI/Makieta-START.html`, `UI/_INDEX.md`, `UI/_archiwum/*`
- `dyspozycje/EKONOMIA-DO-MASTERA.md` (meldunki lane)
- `.cursor/rules/civ-workflow.mdc` (jedna linia decyzji Macieja)

**Testy lane (OK):**
- `gra/tools/okolica-test.cjs` — 24/24

---

*Koniec raportu. Lane EKONOMIA+UI — STOP.*
