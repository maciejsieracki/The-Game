# A1 — Mapa kliknięć HUD mapy strategicznej (D1=B)

| Pole | Wartość |
|------|---------|
| **ID** | A1-KLIKI |
| **Data** | 2026-06-26 |
| **Status** | **ZAMKNIĘTE** (Maciej — wymóg specyfikacji) |
| **Excel** | `Status-projektu-The-Game.xlsx` → arkusz **`HUD-mapa-kliki`** |

> **Zasada:** każdy element **interaktywny** na ekranie mapy ma jednoznaczny opis: co robi klik (lub brak kliku).  
> Elementy **tylko informacyjne** — jawny wpis „brak akcji".

---

## [A] Pasek górny

| Element | Klik | Efekt / cel |
|---------|------|-------------|
| **Żywność** | **NIE** | Tylko tooltip (zapasy B5, +X/t, alert głodu) |
| **Złoto** | opcj. | Tooltip bilansu; **bez** osobnego panelu v1.0 |
| **Praca** | opcj. | Tooltip bilansu; **bez** panelu v1.0 |
| **Badania** | **NIE** (liczby na [A]) | Tylko podgląd +X/t i %; **klik → ikona 🔬 [C]** → `sciencePicker` |
| **Bogactwo** | opcj. | Tooltip (Wealth/D3); szczegóły suwaku w **panelu miasta** |
| **Ludność** | opcj. | Tooltip (suma ludności + przyrost/t); **bez** panelu v1.0 |
| **Power [A′]** (środek) | **TAK** | → overlay **Potęga** — 6 składników, ranking; używane w negocjacjach (Respekt per nacja w dyplomacji) |
| **Epoka** (pasek %) | **NIE** | Tylko podgląd postępu epoki (składnik Power — patrz overlay) |
| ~~**Osiedla** N/max~~ | — | **OUT** — szczegóły w ikonie **Miasta** [C] |
| **Wojna** — chip wroga **⚔ Nazwa** | **TAK** | → **`diplomacyPanel`** z **fokusem na tej cywilizacji** (A1-Q5) |
| **Sojusz** — chip **🤝 Nazwa** | **TAK** | → **`diplomacyPanel`** (fokus sojusznika) |
| **Pakt** — chip **🕊️ Nazwa** | **TAK** | → **`diplomacyPanel`** (fokus paktu o nieagresji) |
| Etykiety „WOJNA" / „SOJUSZ" / „PAKT" | **NIE** | Dekoracja |
| **☰ Menu** | **TAK** | → **`mainMenu`** — zapis, wczytaj, ustawienia, wyjście |

---

## [C] Panel sterowania (lewy-górny)

| Element | Klik | Efekt / cel |
|---------|------|-------------|
| **🏙 Miasta** | **TAK** | → lista miast / **`cityPanel`** |
| **🔬 Nauka** | **TAK** | → **`sciencePicker`** — drzewko technologii (G3) |
| **🎭 Kultura** | **TAK** | → overlay imperium: kultura, +X/t, presja (**A1-Q12a**) |
| **⛪ Religia** | **TAK** | → overlay imperium: religia państwa, zasięg (**A1-Q12b**) |
| **🏛️ Cuda** | **TAK** | → overlay lista cudów + postęp budowy |
| **🤝 Dyplomacja** | **TAK** | → **`diplomacyPanel`** |
| **⚔ Wojsko** | **TAK** | → panel armii / jednostek + aktywne wojny |
| **🔨 Budowa** | **TAK** | → tryb budowy [D]; banner **G2** ESC |

Sekcja **Imperium** (5 ikon): Miasta · Nauka · Kultura · Religia · **Cuda**.  
Sekcja **Akcje** (3 ikony): Dyplomacja · Wojsko · Budowa.

---

## (B) Pasek wojen — **OUT** (revB)

Wojna przeniesiona do kafelka **skrajnie prawego** w [A] — patrz wiersze **Wojna** w sekcji [A].

---

## [D] Mapa 3D — klik na terenie

| Cel kliknięcia | Warunek | Efekt / cel |
|----------------|---------|-------------|
| **Hex miasta** (własnego) | zawsze | → **`cityPanel`** pełny ekran tego miasta (G3) |
| **Hex miasta** (obcego) | zawsze | → **`diplomacyPanel`** lub tooltip „miasto X" (v1.0: dyplomacja jeśli znane) |
| **Własna jednostka** | brak zaznaczenia / zmiana wyboru | → zaznaczenie jednostki + **panel [H]** (A2-Q4 — szczegóły UX OTWARTE) |
| **Własna jednostka** | już zaznaczona ta sama | → panel [H] (toggle / utrzymanie wyboru) |
| **Wroga jednostka** | własna jednostka zaznaczona | → **`preBattle`** → po potwierdzeniu bitwa manualna / auto |
| **Wroga jednostka** | brak własnej zaznaczonej | → tylko podświetlenie / tooltip (bez ataku) |
| **Pusty hex** | własna jednostka zaznaczona, ruch OK | → **ruch jednostki** na hex (pathfinding) |
| **Pusty hex** | brak jednostki / poza zasięgiem | → zaznaczenie hexu (pod przyszłą budowę / B zakładanie miasta) |
| **Hex w trybie Budowa [C]** | aktywny typ ulepszenia | → **postaw ulepszenie** (D4) lub komunikat błędu (teren, tech, koszt) |
| **Przeciągnięcie (LMB drag)** | — | **Pan kamery** — **nie** traktować jako klik (próg drag) |
| **Scroll** | — | Zoom kamery — bez nawigacji panelowej |

---

## [E] Panel wydarzeń (prawy)

| Element | Klik | Efekt / cel |
|---------|------|-------------|
| Chip **informacyjny** (✕ widoczne) | chip | → akcja kontekstowa (`onEventClick`): skok do miasta / jednostki / drzewka |
| Chip informacyjny | **✕** | → zamknij chip (`onEventDismiss`) — **nie** blokuje tury |
| Chip **blocking** (bez ✕) | chip | → rozstrzygnięcie: **`preBattle`**, **`sciencePicker`**, **`cityPanel`**, **`diplomacyPanel`** wg `kind` |
| Chip blocking | **✕** | **NIE** — brak dismiss (A1-Q9) |

**Routing wg `kind` (blocking i WYKONAJ):**

| kind | Typowa akcja po kliku / WYKONAJ |
|------|----------------------------------|
| `enemy` | → **`preBattle`** lub dyplomacja |
| `science` | → **`sciencePicker`** (wybór tech) |
| `city` | → **`cityPanel`** (miasto z wydarzenia) |
| `unit` | → kamera na jednostkę + panel [H] |
| `culture` | → **`cityPanel`** zakładka kultura |
| `info` | → opcjonalny skok / zamknięcie |

---

## [F] Minimapa

| Element | Klik / gest | Efekt / cel |
|---------|-------------|-------------|
| **Hex na minimapie** | klik | → **kamera skacze** na ten hex na mapie [D] (`onMinimapClick`) |
| **Ramka VIEW** | przeciągnięcie | → przesuwa widok kamery (opcj. v1.0+) |
| Etykieta „Minimapa" | **NIE** | — |

---

## [F2] Warstwy mapy — kolumna obok minimapy

Jeden styl: **ikona + pill** (`Widok ○/●` lub `Zasięg ○/●`). Bez osobnego panelu pod minimapą.

| Element | Klik | Efekt / cel |
|---------|------|-------------|
| **🗺️ Granice** | **TAK** | ON/OFF granic terytorium na [D] |
| **🏷️ Nazwy** | **TAK** | ON/OFF nazw miast na [D] |
| **🎭 Zasięg** | **TAK** | ON/OFF zasięgu kultury na [D] |
| **⛪ Zasięg** | **TAK** | ON/OFF zasięgu religii na [D] |

Treść kultury/religii → panel **[C]**; tutaj tylko warstwa wizualna.

---

## (G) Legenda granic

| Element | Klik | Efekt / cel |
|---------|------|-------------|
| Cała legenda | **NIE** | Podgląd gdy 🗺️ Granice = ON |

---

## (H) Panel jednostki

| Element | Klik | Efekt / cel |
|---------|------|-------------|
| Przyciski Ruch / Atak / … | **TAK** | Akcje na mapie [D] — **A2-Q4 OTWARTE** (pełna lista) |
| Tło panelu / poza | **NIE** / ESC | Zamknięcie panelu, jednostka pozostaje zaznaczona |

---

## [I] Dolny pasek

| Element | Klik | Efekt / cel |
|---------|------|-------------|
| **WYKONAJ** | **TAK** (gdy ON) | → **`onExecutePending`**: rozstrzyga **pierwsze blocking** z [E] |
| **WYKONAJ** | disabled | Gdy brak blocking — szary, brak akcji |

~~**Menu**~~ — przeniesione na **[A]** prawy górny (obok wojen).

Skróty: **Enter / N** = Koniec tury (ta sama brama G1) — przycisk **[I2]** na pasku [I].

---

## [I2] Przycisk „Zakończ turę” (prawy koniec paska [I])

| Element | Klik | Efekt / cel |
|---------|------|-------------|
| **Cały przycisk** | **TAK** (gdy ON) | → **`onEndTurn()`** — następna tura |
| **Tura** / **rok** (wewnątrz) | **NIE** | Informacja — część etykiety przycisku |
| Przycisk | disabled | Gdy **G1** (blocking w [E]) — przygaszony, brak akcji |

---

## Overlaye — zamknięcie

| Overlay | Zamknięcie | Powrót |
|---------|------------|--------|
| `sciencePicker` | ESC / przycisk Zamknij | HUD mapy aktywny |
| `diplomacyPanel` | ESC / Zamknij | HUD mapy |
| `cityPanel` | ESC / „Mapa" | HUD mapy |
| `preBattle` | Anuluj / Rozpocznij | mapa lub bitwa |
| `mainMenu` | Wznów grę | HUD mapy |
| Cuda / Budowa [C] | ESC (Budowa = G2) | HUD mapy |

---

## Powiązane pliki

- `docs/A1-HUD-HUMO-CAP-SPECYFIKACJA.md` — sekcja per strefa + ten dokument
- `docs/decyzje/A1-revA-zasoby-pasek.md` — układ [A]
- `Status-projektu-The-Game.xlsx` → **`HUD-mapa-kliki`**
