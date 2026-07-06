# Maciej — checklist akceptacji mockupów HUD D1B

**Data:** 2026-06-27 · **Decyzja:** ABC1=A — akceptuję mockupy P0+P1  
**Skutek:** Grupa F batch F-HUD · Grupa A nie pyta o sign-off

| | |
|---|---|
| Hub | `UI/Makieta-HUD-D1B-preview.html` |
| Przewodnik | `docs/A1-HUD-KLIKI-MOCKUP-PRZEWODNIK.md` |

Otwórz hub (F5) i odhacz po playteście. **Sign-off** = wpis na dole + MASTER może wpinać `hud.ts`.

---

## Flow startu gry

- [ ] `Gra-podglad-MENU.html` → **Nowa Gra** → `Makieta-flow-nowa-gra.html` (5 kroków)
- [ ] Krok 5 generacja → auto-przejście do **HUD D1B**
- [ ] Z mapy: **☰ Menu** → **Wznów grę** wraca do HUD

---

## [A] Pasek górny

- [ ] Power → modal składników
- [ ] Chipy Sojusz / Pakt / Wojna → dyplomacja z fokusem
- [ ] Menu → pełny ekran menu
- [ ] Zasoby — tooltip (bez panelu) OK?

---

## [C] Panel

- [ ] Miasta → lista → panel miasta
- [ ] Nauka → drzewko tech
- [ ] Kultura / Religia → overlay imperium
- [ ] Cuda → lista cudów
- [ ] Dyplomacja → panel relacji
- [ ] Wojsko → panel armii (od dołu)
- [ ] Budowa → banner + ulepszenia + ghost na mapie

---

## [D] Mapa

- [ ] Ateny → panel miasta
- [ ] Persepolis (obce) → dyplomacja Persja
- [ ] Hoplita → panel [H]
- [ ] Persowie → pre-bitwa (po zaznaczeniu)

---

## [E] / [I]

- [ ] Blocking → pre-bitwa → zamknięcie → **Koniec tury** odblokowany
- [ ] WYKONAJ = to samo co blocking
- [ ] Chipy science / city → właściwe panele

---

## [F2] Warstwy

- [ ] Granice, nazwy, zasięgi kultury/religii — efekt na mapie

---

## Gameplay ABC (tylko jeśli otwarte w karcie decyzji)

Decyzje produktowe → **`docs/MACIEJ-KARTA-DECYZJI.md`** (D1–D15).  
**Nie** decydujesz tu o technice mockupu (iframe, embed, redirect) — to MASTER przy wpiciu.

---

## Sign-off

- [x] **Akceptuję mockupy P0+P1** — MASTER może planować wpiecie `hud.ts` — **Maciej ABC1=A, 2026-06-27**
- [ ] **Wymaga poprawek** — lista poniżej:

_(wpisz uwagi Macieja)_
