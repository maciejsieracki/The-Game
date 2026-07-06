# Charter — Grupa E — Start / Meta / UI

> **Zakładka Cursor:** `Grupa E — Start / Meta / UI`  
> **Katalog roboczy (decyzje, audyt, handoff):** [`docs/grupa-e/README.md`](../grupa-e/README.md)  
> **Ten czat = menu główne, kreator nowej gry, defaulty startu, warunki zwycięstwa (meta), globalny shell UI.**  
> **NIE ten czat:** AI rywali, archetypy, barbarzyńcy → **Grupa D**.  
> Obowiązuje: `docs/decyzje/DYSPOZYCJA-STALA.md` + ten plik.

## Przepływ i raportowanie

**Obieg:** `docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md` · `docs/obieg/_ZASADY.md`

1. Implementacja modułów Grupy E — **bez** `main.ts`, **bez** `Gra-podglad.html`.
2. Raport: `docs/obieg/E-start.md` · `REJESTR-DECYZJI.md`.
3. Maciej: **`przekaż do Mastera`** → handoff + Slack → Master → Integrator F → kanon → **REJESTR §2** (lane milczy · playtest = Master).

**Hasła Macieja:** `działaj` · `przekaż do Mastera` · A/B/C · `format`

---

## Za co odpowiadacie

| Obszar | Odpowiedzialność |
|--------|------------------|
| **Nowa gra** | Menu startu, wybór cyw, mapSize, defaulty (D13) |
| **Meta / zwycięstwo** | Warunki wygranej, cele gry (E2 — bez AI rywali) |
| **Surowce epok** | Dostępność surowców per epoka na mapie (D14) |
| **Globalny shell UI** | Menu, kreator, overlay startowy — **NIE** panel miasta, **NIE** HUD mapy |

**Moduły:** `ui/mainMenu`, `ui/newGameFlow`, `victory.ts` (+ handoff do Grupy A przy defaultach generatora mapy).

---

## Tematy w tym czacie (E1–E3)

| ID | Nazwa | Plik | Pytania do Macieja | Status |
|----|-------|------|-------------------|--------|
| **E1** | Nowa gra | `docs/grupa-e/decyzje/E1-nowa-gra.md` | **E1-Q9…Q12** · Q6–Q8 · D13 | CZĘŚCIOWO |
| **E2** | Zwycięstwo (meta) | `docs/grupa-e/decyzje/E2-ai-zwyciestwo.md` | **E2-Q*** (warunki wygranej — nie AI rywali) | OTWARTE |
| **E3** | Surowce epoki | `docs/grupa-e/decyzje/E3-surowce-epoki.md` | **E3-Q*** · D14 | CZĘŚCIOWO |

**Ekran:** `[EKRAN: Menu]`, `[EKRAN: Logika]`, `[EKRAN: Mapa świata]` (tylko defaulty generatora — nie HUD).

---

## Jakie pytania ABC wolno Maciejowi (tylko ta grupa)

**WOLNO pytać o:**
- Ekran nowej gry: opcje, defaulty, wybór cywilizacji (E1)
- Warunki zwycięstwa, cele gry (E2 — meta, nie zachowanie AI)
- Które surowce w której epoce na mapie (E3)

**ZAKAZ pytań w tym czacie:**

| Temat | Gdzie |
|-------|--------|
| HUD w trakcie gry, minimapa | **Grupa A** |
| Panel miasta, ekonomia tury, drzewko nauki | **Grupa B** |
| UX bitwy, oblężenie | **Grupa C** |
| Dyplomacja tier, bonusy nacji, AI rywali, barbarzyńcy | **Grupa D** |

---

## Pytania do Mastera

`docs/grupa-e/decyzje/E1-PYTANIA-DO-SILNIKA.md` · indeks: `E1-pytania-abc.md`

Raport: `docs/obieg/E-start.md` · handoff `E-do-MASTER_*.md` · **`przekaż do Mastera`**

---

## Kolejność

1. **E1** (defaulty startu odblokowują testy) → **E3** → **E2**
