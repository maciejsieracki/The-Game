# Indeks plików podglądu gry (`Gra-podglad*.html`)

**Cel:** mockupy / buildy, które **są grą** (bundel Vite), nie statyczne `UI/Makieta-*.html`.  
Te pliki pokazują UX **dopiero w trakcie gry** (menu → mapa → klik → panele).

**Rejestr grup:** [`REJEST-UX-MASTER.md`](REJEST-UX-MASTER.md) · **Katalog:** [`UI/Katalog-UX-wszystkie-panele.html`](../../UI/Katalog-UX-wszystkie-panele.html)

---

## Kanon i codzienna praca

| Plik | UX zawarte | Uwagi |
|------|------------|--------|
| [`Gra-podglad.html`](../Gra-podglad.html) | **Wszystko** — menu, kreator, HUD, mapa 3D, klik miasto, nauka, walka, dyplomacja | **Kanon** publikacji |
| [`Gra-podglad-ROBOCZA.html`](../Gra-podglad-ROBOCZA.html) | Jak kanon — build dev / integrator | Przed merge do kanonu |
| [`Gra-podglad-OKOLICA-UX.html`](../Gra-podglad-OKOLICA-UX.html) | Panel miasta Civ V + okolica + pasek zasobów miasta | **Kanon UX miasta** (otwórz → klik miasto) |

---

## Playtesty tematyczne (root)

| Plik | Temat | Jak wejść |
|------|-------|-----------|
| [`Gra-podglad-PLAYTEST-MIASTO.html`](../Gra-podglad-PLAYTEST-MIASTO.html) | Panel miasta / ekonomia | Nowa gra → klik miasto |
| [`Gra-podglad-PLAYTEST-MAPA.html`](../Gra-podglad-PLAYTEST-MAPA.html) | Mapa / HUD / ruch | Nowa gra → mapa |
| [`Gra-podglad-PLAYTEST-WALKA.html`](../Gra-podglad-PLAYTEST-WALKA.html) | Walka | Skróty / scenariusz walki w buildzie |
| [`Gra-podglad-MAPA-SWIATA.html`](../Gra-podglad-MAPA-SWIATA.html) | Mapa świata | Start gry |
| [`Gra-podglad-C.html`](../Gra-podglad-C.html) | Grupa C (walka) | Dev build C |

---

## Walka / oblężenie (root)

| Plik | Temat |
|------|--------|
| [`Gra-podglad-BITWA.html`](../Gra-podglad-BITWA.html) | Bitwa 3D (klawisz T / scenariusz) |
| [`Gra-podglad-OBLEZENIE-BITWA.html`](../Gra-podglad-OBLEZENIE-BITWA.html) | C3 oblężenie + bitwa |
| [`Gra-podglad-MUR-BITWA.html`](../Gra-podglad-MUR-BITWA.html) | Bitwa z murem |

---

## Mapa / ulepszenia / hodowla (root + Civ-MAPA)

| Plik | Temat |
|------|--------|
| [`Gra-podglad-ULEPSZENIA.html`](../Gra-podglad-ULEPSZENIA.html) | Tryb ulepszeń |
| [`Gra-podglad-HODOWLA.html`](../Gra-podglad-HODOWLA.html) | Hodowla / żywność |
| [`Civ-MAPA/Gra-podglad-ULEPSZENIA.html`](../Civ-MAPA/Gra-podglad-ULEPSZENIA.html) | Placement ulepszeń A4 |
| [`Civ-MAPA/Gra-podglad-OBLEZENIE.html`](../Civ-MAPA/Gra-podglad-OBLEZENIE.html) | Oblężenie (MAPA lane) |
| [`Civ-MAPA/Gra-podglad-MIASTA.html`](../Civ-MAPA/Gra-podglad-MIASTA.html) | Render miast 3D |
| [`Civ-MAPA/Gra-podglad-JAKOSC-MAPY.html`](../Civ-MAPA/Gra-podglad-JAKOSC-MAPY.html) | Jakość mapy |

---

## Przekierowania / nie używać

| Plik | → |
|------|---|
| `Gra-podglad-ROBOCZA.redirect.html` | redirect |
| `UI/Gra-podglad-MENU.html`, `UI/Gra-podglad-HUD.html` | → `Gra-podglad.html` |
| `gra-kanon/*` | snapshot archiwalny |
| `docs/archiwum-ux/*` | snapshot datowany |

---

## Dla grup A–E (inwentaryzacja)

Przy wypełnianiu `REJEST-UX-MASTER.md` **obowiązkowo** dopisz kolumnę mockup:

- jeśli UX jest tylko w bundlu → `Gra-podglad.html` + **krok playtestu**
- jeśli macie dedykowany playtest → pełna ścieżka `Gra-podglad-PLAYTEST-….html`

**Usunięte (nie linkować):** ~~`UI/Gra-podglad-MIASTO.html`~~, ~~`UI/Gra-podglad-NAUKA.html`~~

---

*2026-06-26 · uzupełnienie po braku podglądów gry w katalogu HTML*
