# UI → UNITS: Propozycje UX bitwy Q2–Q7 (D5=B, wzór Total War: Pharaoh)

**Data:** 2026-06-26  
**Od:** Grupa A  
**Do:** UNITS (przez MASTER)  
**Status:** GOTOWE — domyślne odpowiedzi do implementacji; Maciej zatwierdził D5=B  
**Decyzja Macieja:** D5=B — UI proponuje, Maciej zatwierdza (Total War: Pharaoh jako referencja)

---

## Kontekst

Q1 już rozstrzygnięte (B + AUTO + faza deploymentu). Poniżej domyślne odpowiedzi UI na Q2–Q7 wg ergonomii **Total War: Pharaoh** — do implementacji przez UNITS/battleScene + istniejący `preBattle.ts`.

Maciej może odrzucić pojedyncze punkty; bez sprzeciwu = przyjmujemy jako spec v1.0.

---

## Q2 — Minimapa w bitwie

**Odpowiedź UI: TAK — minimapa w dolnym lewym rogu pola bitwy.**

| Element | Spec |
|---|---|
| Pozycja | Lewy-dolny róg (nad rosterem), ~180×120 px, półprzezroczyste tło ciemne + złota obwódka |
| Zawartość | Całe pole bitwy (top-down); heksy/uproszczony teren; kropki jednostek (kolor frakcji) |
| Viewport | Biały prostokąt = widok kamery; przeciąganie = pan kamery |
| Klik | Klik na minimapie = skok kamery do tego miejsca |
| Aktualizacja | Co klatkę symulacji (pozycje jednostek) lub co 0.5 s (wystarczy v1.0) |

**UNITS dostarcza:** `getBattleMinimapData()` → `{ cols, rows, terrain[], units[{q,r,color}], viewport }`.  
**UI dostarcza (opcjonalnie v1.1):** wspólny renderer minimapy z `minimapHud.ts` (ten sam kontrakt co mapa świata).

---

## Q3 — Tooltipy i panel jednostki

**Odpowiedź UI: TAK — hover tooltip + klik otwiera panel boczny.**

| Warstwa | Zachowanie |
|---|---|
| **Hover (tooltip)** | Po 0.3 s nad jednostką: nazwa, typ (Frontalne/Dystans/Mounted), HP (pasek), morale (%), atak/obrona skrót |
| **Klik (panel)** | Prawy panel (~220 px): pełne staty, bonus vs typ, przyciski rozkazów (Wycofaj, Stand by, Dystans ON/OFF, Strzał ON/OFF) |
| **Styl** | Ciemne tło rgba(12,18,35,0.92), złote nagłówki, ikony typu jednostki |

Referencja: panel zaznaczonej jednostki TW:Pharaoh (§5a UNITS handoff).

---

## Q4 — Górny pasek w bitwie

**Odpowiedź UI: Pasek górny — tura/symulacja + morale armii + straty + pauza.**

Układ (lewo → prawo):

1. **Numer fazy** — „Deployment" / „Bitwa — tura N" (lub czas symulacji)
2. **Prędkość** — „×1 / ×2 / ×4 …" (skrót S)
3. **Morale armii** — dwa paski (%): atakujący (czerwony) | obrońca (niebieski) — już częściowo w battleScene
4. **Liczniki strat** — zabici / uciekli / pozostali per strona (kompaktowe liczby)
5. **Pauza** — badge „‖ PAUZA" gdy aktywna (skrót P)
6. **Prawy róg** — przycisk „Pomiń → wynik" + „Wyjście"

Wysokość ~48 px, ten sam motyw ciemny+złoto co `preBattle.ts`.

---

## Q5 — Ekran przed-bitwą (preBattle layout)

**Odpowiedź UI: Dwukolumnowy podgląd sił + 3 akcje — rozszerzyć istniejący `preBattle.ts`.**

| Sekcja | Layout |
|---|---|
| **Nagłówek** | „Starcie" + teren bitwy + szanse atakującego (%) |
| **Lewa kolumna** | Atakujący: nazwa cywilizacji, lista kart jednostek (nazwa, typ, HP, ilość, atak) |
| **Prawa kolumna** | Obrońca: j.w. |
| **Dół (3 przyciski)** | **[Auto-rozstrzygnij]** · **[Pole bitwy]** (manual + deployment) · **[Wycofaj się]** |
| **Styl** | Dark + gold (jak obecny preBattle); pełnoekranowy overlay, bez THREE |

Istniejący moduł `gra/src/ui/preBattle.ts` + API `PreBattleInfo`/`PreBattleCallbacks` — **bez zmian kontraktu**, tylko dopracowanie layoutu wg powyższego.

---

## Q6 — Styl wizualny HUD bitwy

**Odpowiedź UI: Ciemny półprzezroczysty + złote akcenty (antyczny/egejski klimat TW:Pharaoh).**

| Parametr | Wartość |
|---|---|
| Tło paneli | `rgba(12,18,35,0.88–0.92)` |
| Akcent | Złoto `#e8d88a` / `#C9A84C`, obwódki `rgba(232,216,138,0.30)` |
| Tekst | `#d4cba0` (główny), `#7a7055` (dim) |
| Frakcje | Atakujący czerwony `#c84040`, obrońca niebieski `#4090c8` |
| Czcionka UI | `'Segoe UI', Tahoma, sans-serif` (spójnie z resztą HUD) |
| Linie rozkazów | Żółta = ruch, czerwona = atak (billboard na ziemi) |
| Banery jednostek | Ikona typu + pasek HP/morale nad modelem 3D |

**NIE** jasny/pergaminowy styl — ciemny jak mapa świata + preBattle.

---

## Q7 — Sterowanie

**Odpowiedź UI: Mysz-first + skróty klawiszowe na dolnym pasku ikon.**

| Akcja | Mysz | Klawisz |
|---|---|---|
| Zaznaczenie jednostki | LPM na jednostkę / kartę w rosterze | — |
| Ruch | LPM na pole (z zaznaczoną jednostką) | — |
| Atak | LPM na cel (kursor: łuk=dystans, miecz=wręcz) | — |
| Zaznaczenie wielu | LPM drag prostokąt | — |
| Anuluj rozkaz | PPM | — |
| Prędkość symulacji | Ikona ± na dolnym pasku | **S** (cykl 1→512) |
| Pauza | Ikona | **P** |
| Paski HP/morale | Ikona | **H** |
| Dźwięk | Ikona | **M** |
| Scalanie rannych (deployment/roster) | Drag karty na kartę | **M** / **Ctrl+M** |
| Kamera | Kółko zoom, drag pan | **+/-** opcjonalnie |

Dolny pasek = ikony z legendą skrótów (nie sam tekst). Roster na dole = 3 grupy (Frontalne / Dystans / Mounted) + slot generała (§5a UNITS).

---

## Podsumowanie Q2–Q7 (tabela)

| # | Pytanie | Odpowiedź UI (TW:Pharaoh) |
|---|---|---|
| Q2 | Minimapa? | **TAK** — lewy-dolny róg, kropki jednostek, viewport, klik=pan |
| Q3 | Tooltip + panel? | **TAK** — hover skrót, klik = panel rozkazów |
| Q4 | Górny pasek? | **TAK** — faza, prędkość, morale×2, straty, pauza, pomiń |
| Q5 | Ekran przed-bitwą? | **TAK** — 2 kolumny sił + Auto/Pole/Wycofaj (preBattle.ts) |
| Q6 | Styl? | **Ciemny + złoto** (antyczny/egejski, spójny z HUD mapy) |
| Q7 | Sterowanie? | **Mysz-first** + skróty S/P/H/M + ikony na dolnym pasku |

---

## DoD (UNITS)

- [ ] battleScene respektuje layout Q4 (górny pasek) i Q7 (mysz + skróty)
- [ ] Minimapa Q2: dane z UNITS, render w battleScene lub reuse minimapHud
- [ ] Tooltip/panel Q3: hover + panel rozkazów z §5a
- [ ] preBattle Q5: layout 2-kolumnowy (UI lane może dopracować preBattle.ts po kontrakcie UNITS)
- [ ] Styl Q6: kolory zgodne z tabelą powyżej

## Zależności

- Q1 (sterowanie + AUTO + deployment) — już w spec UNITS
- §5a (kursor łuk/miecz, roster, rozkazy) — UNITS handoff UX-bitwa
- `preBattle.ts` — lane UI (gotowy moduł, layout Q5)

— Grupa A
