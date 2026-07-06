# GRUPA-E → UI: sync mockupów (ABC 12=A)

> **Status:** GOTOWE (mockupy HTML 2026-06-27) · `mainMenu.ts` / `main.ts` nadal CZEKA  
> **Decyzja Macieja:** 2026-06-27 · **12=A** — sync **teraz**

---

## Pliki do zsynchronizowania

| Plik | Do czego |
|------|----------|
| `UI/Makieta-flow-nowa-gra.html` | Kreator — source of truth wizualny do E1 |
| `UI/Gra-podglad-MENU.html` | Menu S0 — decyzje **5=C**, **6=A**, **7=A** |

---

## Kreator (`Makieta-flow-nowa-gra.html`) — checklist E1

- [x] 9 cywilizacji (Rzym default `rzymianie`)
- [x] Epoka: Kamień default, Brąz i **Żelazo** wybieralne + notka tech kaskadowych
- [x] Mapa: Standard default; skala rywali ±1
- [x] Typ świata: Kontynenty, Pangea, Wyspy, **Ziemia**
- [x] Trudność, tempo — zgodnie z `ui-params.json` / `E1-nowa-gra.md`
- [x] Layout krok 3: brak pustej przerwy do „Dalej"

---

## Menu (`Gra-podglad-MENU.html`) — checklist 5–7

- [x] Główny ekran: **Rozpocznij grę** · **Kampania** · **Multiplayer** · **Ustawienia**
- [x] **Więcej ▾:** Kontynuuj · Wczytaj · O grze · Wyjdź
- [x] Kampania/Multi: disabled + toast **„Wkrótce"** (**6=A**)
- [x] Placeholder / slot na **wideo tła** (**7=A**)
- [ ] Spójność stylu z `mainMenu.ts` (klasy `.mbtn`, hero) — kod gry CZEKA

---

## DoD

- [x] Oba HTML odzwierciedlają `docs/grupa-e/decyzje/E1-nowa-gra.md`
- [x] Banner podglądu: sync 2026-06-27
- [x] `newGameFlow.ts` — Żelazo + layout epoki (kod kreatora, nie kanon)

**Flaga:** GOTOWE (mockupy) · implementacja `mainMenu.ts` = osobny handoff `GRUPA-E-do-UI_menu-S0-5C.md`
