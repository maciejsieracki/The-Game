# GRUPA-E → UI: menu główne S0 (ABC 5=C)

> **Status:** **→ INTEGRATOR: GOTOWE** (2026-06-29 · lane UI)  
> **Decyzja Macieja:** 2026-06-27 · **pyt. 5 = C** (hybryda pełna E1 + B)

---

## Spec produktowa (kanon)

### Warstwa wizualna (E1 + **7=A**)

- Hero tła: **wideo** w pętli, wyciszone; branding „Cywilizacja · The Game"
- Tytuł / emblemat na wierzchu wideo (jak mockup — emblemat może pozostać)
- **Asset:** plik wideo — lane UI + Master (ścieżka w `gra/assets/` lub URL); fallback gradient jeśli brak pliku

### Przyciski — ekran główny

| # | Etykieta | Primary | Callback (istniejący kontrakt `MainMenuConfig`) |
|---|----------|---------|--------------------------------------------------|
| 1 | **Rozpocznij grę** | tak | `onNewGame` (dawniej „Nowa Gra") |
| 2 | **Kampania** | nie | placeholder → **6=A** „Wkrótce" |
| 3 | **Multiplayer** | nie | placeholder → **6=A** „Wkrótce" |
| 4 | **Ustawienia** | nie | ekran ustawień (już jest) |
| 5 | **Więcej ▾** | nie | rozwija / przełącza podmenu |

### Podmenu „Więcej" (klasyczne Civ — opcja B)

| Etykieta | Enabled | Callback |
|----------|---------|----------|
| Kontynuuj | gdy `hasSave()` | `onContinue` |
| Wczytaj grę | gdy `hasSave()` | `onLoad` |
| O grze | zawsze | `onAbout` |
| Wyjdź | zawsze | `onQuit` |

**Reguła:** Kontynuuj/Wczytaj **nie** na głównym ekranie — tylko w „Więcej" (zgodnie z 1=A: Nowa gra = reset; kontynuacja tu).

---

## Pliki

| Plik | Akcja |
|------|--------|
| `gra/src/ui/mainMenu.ts` | refaktor layoutu + podmenu |
| `UI/Gra-podglad-MENU.html` | sync mockup (po 6–7 lub razem) |

---

## DoD

- [x] Główny ekran: 4 przyciski E1 + „Więcej"
- [x] Podmenu: 4 przyciski B, poprawne enable/disable zapisu
- [x] „Rozpocznij grę" → ten sam flow co dziś `onNewGame`
- [x] Kampania/Multi — **6=A**: widoczne, toast „Wkrótce"
- [x] Tło **wideo 7=A** (pętla, muted; fallback gradient bez assetu)
- [x] Meldunek `UI-DO-MASTERA.md`

**Flaga:** **→ INTEGRATOR: GOTOWE** · **nie** ruszano `main.ts` · brak nowych callbacków
