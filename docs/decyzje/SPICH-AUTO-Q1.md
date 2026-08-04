# SPICH-AUTO-Q1 — Auto-obniżenie racji żywności przy deficycie Spichlerza

| Pole | Wartość |
|------|---------|
| **ID** | SPICH-AUTO-Q1 |
| **Czat** | Grupa B (Miasto / ekonomia) |
| **Ekran** | Panel miasta (racje / fed) + HUD mapy (Spichlerz) + panel wydarzeń |
| **Status** | 🟢 **WDROŻONE w kodzie** — zamknięta dyskusja (Maciej 2026-08-04) |
| **Decyzja** | **B** (z doprecyzowaniem) |
| **Data** | 2026-08-04 |

---

## Cytat Macieja

> Wojsko NIE jest warunkiem wyżywienia cywilizacji przy bilansie Spichlerza.
> Brak żywności w Spichlerzu dla wojska → wojsko **głoduje** i tyle.
> Koniec tury **zawsze dozwolony** (bez blokady).
> Na koniec tury **automatycznie** obniżyć próg/poziom racji żywnościowych w miastach tak, by **realny bilans całej cywilizacji** wyszedł na **zero**.
> Na początku **następnej** tury: komunikat w **wydarzeniach**, że auto-obniżenie racji zostało dokonane.

**Doprecyzowanie UI (2026-08-04):**

> „takie negatywne wydarzenia powinny się też na czerwono zaznaczać.”

Dotyczy komunikatu o auto-obniżeniu racji **oraz ogólnie** wydarzeń negatywnych tego typu (deficyt żywności / głód / przymusowe cięcie racji).

---

## Kontekst (wcześniejszy wątek)

Przy Spichlerzu = 0 gracz **nie powinien** móc „jeść na kredyt” — ustawić max racji z pełnym wzrostem w UI, gdy deficyt jest realny. Deficyt miast musi być **spójny** ze stanem Spichlerza (zapasy państwa). Model B5 (`B5-spichlerz-wzrost-ludnosci.md`) pozostaje kanonem dla bufora wzrostu i kumulacji zapasów; ten temat dotyczy **automatycznej korekty racji** przy ujemnym bilansie imperium.

---

## Reguła gameplay (kanon)

| Obszar | Ustalenie |
|--------|-----------|
| **Wojsko vs cywilizacja** | Wojsko **nie blokuje** wyżywienia cywilizacji w sensie „musisz najpierw nakarmić armię, żeby miasta jadły”. Brak żywności w Spichlerzu dla wojska → **głód wojska** (istniejący mechanizm −8% max HP/turę), bez innych kar na cywilizację. |
| **Koniec tury** | **Zawsze dozwolony** — brak blokady EOT z powodu deficytu żywności. |
| **Auto-racje (EOT)** | Gdy **realny bilans żywności całej cywilizacji** (miasta + wojsko + podział imperium) jest ujemny: na **końcu tury** silnik **automatycznie obniża** poziom racji żywnościowych w miastach (kolejność / algorytm do ustalenia przy implementacji), aż bilans **= 0** (nie „na kredyt”). |
| **Komunikat (następna tura)** | Na **początku następnej** tury: wpis w panelu **Wydarzenia** — informacja, że racje zostały auto-obniżone (które miasta / o ile — szczegóły przy implementacji). |
| **UI racji (panel miasta)** | Przy Spichlerzu = 0 / deficycie: suwak racji i podgląd wzrostu **nie mogą** sugerować pełnego wzrostu przy nierealnym bilansie (spójność z zapasami). |

---

## Implikacje implementacyjne (dla lane B + Integrator)

### 1. `empire-food.ts` / ekonomia tury

- Wykrycie deficytu netto imperium po ticku żywności (lub przed zamknięciem tury).
- Funkcja auto-obniżenia racji per miasto do bilansu = 0.
- **Nie** zmieniać reguły: wojsko głoduje osobno przy braku zapasów państwa (C-ARMY-HUNGER-Q1 / B5).

### 2. `cityPanel.ts` — fed / racje / UI wzrostu

- Spójność deficytu miasta ze Spichlerzem (brak „kredytu” wizualnego).
- Po auto-obniżeniu EOT: suwaki racji odzwierciedlają nowy stan od następnej tury.

### 3. Auto-racje EOT (`main.ts` lub moduł ekonomii)

- Hook na **koniec tury** gracza (EOT): uruchomienie auto-obniżenia **przed** przejściem do AI / następnej tury.
- Zapamiętanie faktu auto-obniżenia do komunikatu start-of-turn.

### 4. Wydarzenie — następna tura

- `SidePanelEvent` w `collectTurnEvents()` (lub dedykowany log) na **starciu tury gracza**, jeśli w poprzedniej turze wykonano auto-obniżenie.
- Treść przykładowa (do doprecyzowania): *„Automatycznie obniżono racje żywnościowe — bilans imperium wyrównany do zera."* + ewentualny subtitle z listą miast.

---

## UI wydarzeń — styl negatywny (czerwony)

**Wymóg Macieja:** wydarzenie o auto-obniżeniu racji (i analogiczne negatywne wydarzenia żywnościowe) ma być **wyróżnione na czerwono** w panelu Wydarzenia.

### Istniejący wzorzec w projekcie

| Element | Ścieżka | Opis |
|---------|---------|------|
| **Panel wydarzeń** | `gra/src/ui/sidePanelHud.ts` | `SidePanelEvent` + CSS `.sp-event` |
| **Klasa czerwona** | `sidePanelHud.ts` L136–146 | Domyślny `.sp-event`: `border-left: 3px solid var(--tg-red)`, tło `rgba(200,64,64,.12)`. Jawne czerwone: `.sp-enemy`, `.sp-blocking` → `border-left-color: var(--tg-red)` |
| **Kind semantyczny** | `SidePanelEventKind` | `'enemy'` → klasa `sp-enemy` (czerwony akcent) |
| **Przykład użycia** | `gra/src/main.ts` ~5838–5844 | Wydarzenia wojny: `kind: 'enemy'`, tytuł/subtitle, ikona ⚔ |
| **Token koloru** | `gra/src/ui/brandTokenVars.ts` | `--civ-danger` / `--tg-red` |

**Rekomendacja przy wdrożeniu:** dla wydarzenia auto-obniżenia racji użyć `kind: 'enemy'` (lub nowy dedykowany kind tylko jeśli `enemy` jest mylący semantycznie — wtedy rozszerzyć `SidePanelEventKind` + CSS na wzór `sp-enemy`). **Nie** używać `kind: 'city'` (zielony akcent) ani `kind: 'info'` bez weryfikacji wizualnej.

**Uwaga:** część istniejących wydarzeń krytycznych (np. bunt miasta) dziś ma `kind: 'city'` (zielony) — to **niespójność** względem nowego wymogu; auto-racje i nowe negatywne eventy żywnościowe **muszą** iść czerwonym wzorcem (`enemy` / `sp-blocking`).

---

## Powiązania

- `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md` — Spichlerz, bufor wzrostu, zapasy państwa
- `docs/decyzje/C-ARMY-HUNGER-Q1.md` — głód wojska (−8% HP), parytet AI
- `gra/src/game/empire-food.ts` — bilans żywności imperium
- `gra/src/ui/sidePanelHud.ts` — panel Wydarzenia (styl czerwony)

---

## Status wdrożenia

| Etap | Stan |
|------|------|
| Decyzja + ECHO | ✅ ZAPISANA 2026-08-04 |
| Kod `gra/src` | ✅ **WDROŻONE w kodzie** (2026-08-04) — czeka `deploy` |
| Deploy `gra-robocza` | ⏸ — po implementacji + hasło `deploy` |
