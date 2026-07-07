# A3-P0-3 — Timing marszu jednostki (kiedy wykonuje ruch)

**Status:** ZAMKNIĘTE  
**Data:** 2026-07-07  
**Grupa:** A (mapa świata + ruch jednostek) → Integrator F (`main.ts`)  
**Nadrzędne:** [`A3-marsz-sciezka-2026-07-07.md`](A3-marsz-sciezka-2026-07-07.md) (A3-P0-REDESIGN)  
**Powiązane:** [`A3-P0-2-save-marsz.md`](A3-P0-2-save-marsz.md) (persistencja save/load) · [`A3-SPEC-WDROZENIA.md`](A3-SPEC-WDROZENIA.md) (checklist AC implementera)

---

## Cytat Macieja (pełny)

> - A — sama idzie co turę; podgląd tylko informuje
> - Reguła jak w grach tego typu: na początku tury jednostka ma wskazane miejsce docelowe, ale jeszcze NIE wykonuje ruchu
> - Wszystkie jednostki wykonują zaplanowany ruch po „Zakończ turę"
> - ALTERNATYWA w tej samej turze: po naciśnięciu jednostki — przycisk np. „Kontynuuj" — wtedy w ramach bieżącej tury jednostka idzie dalej
> - Jeśli Kontynuuj nie naciśnięte, a cel wskazany — po zakończeniu tury jednostka dojdzie na tyle, na ile może

---

## Pytanie (kontekst)

Po [`A3-P0-REDESIGN`](A3-marsz-sciezka-2026-07-07.md) gracz wskazuje cel zwykłym klikiem i widzi podgląd trasy z markerami tur. **Kiedy** jednostka faktycznie wykonuje ruch po wskazaniu celu?

| Opcja | Opis |
|-------|------|
| **A** | **Auto-marsz co turę** — cel zapisany; ruch wykonywany po end-turn; podgląd tylko informuje; opcjonalnie „Kontynuuj" w bieżącej turze ← decyzja Macieja |
| **B** | Ruch natychmiast po kliknięciu celu (jak dziś MVP Shift+marsz) |
| **C** | Gracz musi klikać cel **co turę** — brak auto-kontynuacji |

---

## Decyzja

**A** — model **zaplanowanego marszu** zgodny z grami tego typu (Civilization-like):

### Faza 1 — wskazanie celu (bez ruchu)

1. Gracz **klika cel** na mapie (bez Shift) → podgląd trasy + markery końca każdego ruchu (tur).
2. Jednostka **nie rusza się od razu** — cel jest **zaplanowany** (`autoMarch` / odpowiednik).
3. Podgląd **tylko informuje** — nie jest akcją ruchu.

### Faza 2 — wykonanie ruchu

| Trigger | Zachowanie |
|---------|------------|
| **„Zakończ turę"** | Wszystkie jednostki z zaplanowanym celem wykonują **jeden segment ruchu** (tyle hexów, ile pozwala ruch w tej turze). Po end-turn AI i reszta tury — standardowy flow. |
| **Przycisk „Kontynuuj"** (pasek jednostki, po zaznaczeniu) | **Alternatywa w bieżącej turze** — jednostka idzie **kolejny segment** natychmiast, bez czekania na end-turn. Można użyć wielokrotnie, o ile jednostka ma jeszcze punkty ruchu. |
| **Brak „Kontynuuj" + cel wskazany** | Po end-turn jednostka dojdzie **na tyle, na ile może** w tej turze (jeden segment marszu). |

### Reguły wspólne z A3-P0-REDESIGN

- **STOP przy przeszkodzie** — jednostka stoi, czeka; bez obejścia, bez auto-detour.
- **Przerwanie marszu:** (1) wskazanie **nowego celu** LUB (2) **Stop/Zatrzymaj** na pasku jednostki.
- **Save/load** ([`A3-P0-2`](A3-P0-2-save-marsz.md)): zaplanowany cel (`leaderId`, `destQ`, `destR`) w save; po wczytaniu kontynuuje wg tej samej logiki timing.

### Czego NIE robimy

- Ruch **natychmiast** po samym kliknięciu celu (bez Kontynuuj / end-turn).
- Wymuszanie **ponownego kliknięcia celu co turę** (opcja C).
- Auto-szukanie obejścia przy przeszkodzie.

---

## Implikacje techniczne (skrót)

1. **`main.ts`** — rozdzielić *ustawienie celu* od *wykonania segmentu ruchu*; end-turn hook wykonuje segment dla wszystkich jednostek z aktywnym marszem.
2. **`main.ts`** — nowa akcja `continueMarchSegment(leaderId)` dla przycisku Kontynuuj (w ramach bieżącej tury, respektuje punkty ruchu).
3. **UI paska jednostki** (Grupa E) — przyciski **Kontynuuj** i **Stop/Zatrzymaj**; widoczność: cel zaplanowany / jednostka zaznaczona.
4. **`render/units.ts`** (Grupa A) — podgląd trasy bez side-effectu ruchu; markery per-tura.
5. **`save.ts`** — bez zmian schematu względem A3-P0-2; timing nie dodaje pól save.

**Warstwa:** 🟡 cross — `main.ts` + `render/units.ts` + HUD paska jednostki.

---

## Powiązane pliki

| Plik | Rola |
|------|------|
| [`A3-marsz-sciezka-2026-07-07.md`](A3-marsz-sciezka-2026-07-07.md) | UX ścieżki, STOP, przerwanie |
| [`A3-P0-2-save-marsz.md`](A3-P0-2-save-marsz.md) | Persistencja marszu |
| [`A3-SPEC-WDROZENIA.md`](A3-SPEC-WDROZENIA.md) | Pełna spec + checklist AC |
| [`A3-shift-auto-marsz.md`](A3-shift-auto-marsz.md) | MVP Shift+marsz (deprec) |
| `gra/src/main.ts` | `autoMarch`, end-turn hook, ruch jednostek |
| `gra/src/render/units.ts` | `setPathRoute`, markery tur |
| `gra/src/game/save.ts` | pole `autoMarch` w `SaveGame` |

---

## Następny krok

Decyzja zapisana — **bez wdrożenia kodu** w tej sesji. Implementacja wg [`A3-SPEC-WDROZENIA.md`](A3-SPEC-WDROZENIA.md) → handoff A (render) + E (przyciski) + Integrator F (`main.ts`).
