# A3-P0-2 — Marsz w zapisie gry (save/load)

**Status:** ZAMKNIĘTE  
**Data:** 2026-07-07  
**Grupa:** A (mapa świata + ruch jednostek) → Integrator F (`main.ts`, `save.ts`)  
**Nadrzędne:** [`A3-marsz-sciezka-2026-07-07.md`](A3-marsz-sciezka-2026-07-07.md) (A3-P0-REDESIGN)  
**Poprzednik UX marszu:** [`A3-shift-auto-marsz.md`](A3-shift-auto-marsz.md) (A3-Q1 — deprec)

---

## Cytat Macieja

> **A3-P0-2 = B** — Zapisujemy marsz w save; po wczytaniu kontynuuje.

---

## Pytanie (kontekst)

Gdy gracz ma aktywny **auto-marsz** (jednostka idzie w kierunku celu, ewentualnie wieloturowo) i zapisze grę albo wczyta zapis — co robimy ze stanem marszu?

| Opcja | Opis |
|-------|------|
| **A** | Nie zapisujemy marszu — po wczytaniu jednostka stoi bez zaplanowanego celu |
| **B** | **Zapisujemy marsz w save; po wczytaniu kontynuuje** ← decyzja Macieja |
| **C** | Zapisujemy cel w save, ale po wczytaniu gracz musi wznowić ręcznie (np. ponowny klik / Stop) |

---

## Decyzja

**B** — stan `autoMarch` trafia do snapshotu `SaveGame`. Po `deserializeGame` + odtworzeniu mapy i jednostek Integrator przywraca marsz i **kontynuuje** go tak jak po zwykłym end-turn (`continueAutoMarchAfterTurn` lub odpowiednik po A3-P0-REDESIGN).

Gracz nie traci zaplanowanej trasy przez zapis/wczytanie. Wyjątki runtime (przeszkoda, wróg, brak ruchu) nadal obowiązują wg A3-P0-REDESIGN — save nie „omija" STOP przy blokadzie.

---

## Implikacje techniczne (bez wdrożenia w tej sesji)

### Save schema (`gra/src/game/save.ts`)

1. **Nowe pole opcjonalne** w `SaveGame`, np. `autoMarch`:
   - `leaderId: string` — id jednostki-wodza stosu w marszu
   - `destQ: number` — współrzędna q docelowa
   - `destR: number` — współrzędna r docelowa
   - Brak aktywnego marszu → pole `undefined` / pominięte (nie `null` w JSON, chyba że integrator woli jawne czyszczenie)
2. **Wersja formatu** — przy dodaniu pola: bump `SAVE_VERSION` (obecnie `1`) lub tolerancja w `deserializeGame` (stare sejwy bez `autoMarch` = brak marszu po load).
3. **`serializeGame`** — main.ts zbiera bieżący `autoMarch` (lokal w `main.ts` ~6593) do snapshotu.
4. **`deserializeGame` + load hook** — po odtworzeniu `units[]`:
   - walidacja: `leaderId` istnieje, jednostka należy do gracza (`ownerId === 0`), cel różny od pozycji
   - przywrócenie lokalnego `autoMarch`; opcjonalnie podświetlenie trasy (render)
   - **kontynuacja:** wywołanie tej samej ścieżki co po end-turn (nie czekać na kolejną turę gracza, jeśli jednostka ma jeszcze ruch w bieżącej turze — szczegół do doprecyzowania przy wpięciu F)

### Runtime (`main.ts`)

- `AutoMarchState` już istnieje: `{ leaderId, destQ, destR }` — **1:1** z polem save (bez dodatkowych pól na MVP save).
- Po load **nie** czyścić `autoMarch` w `clearAutoMarch()` przy starcie load pipeline.
- Regresja: zapis w trakcie animacji ruchu — zalecenie implementacyjne: serializować stan **po** zakończeniu animacji lub zapisać pozycję hexową z `units[]` (marsz i tak liczy trasę od bieżącej pozycji).

### Powiązanie z A3-P0-REDESIGN

- Decyzja **A3-P0-2** dotyczy **persistencji**, nie UX ścieżki (Shift vs klik, markery tur, Stop).
- Po refactorze marszu bez Shift pole save **nadal** `{ leaderId, destQ, destR }`; ewentualny przyszły stan „czeka na przeszkodzie" może wymagać rozszerzenia schematu (osobna decyzja).

**Warstwa:** 🟡 cross — `save.ts` + `main.ts` (serialize/load hook).

---

## Powiązane pliki

| Plik | Rola |
|------|------|
| [`A3-marsz-sciezka-2026-07-07.md`](A3-marsz-sciezka-2026-07-07.md) | UX marszu — nadrzędny redesign |
| [`A3-shift-auto-marsz.md`](A3-shift-auto-marsz.md) | MVP Shift+marsz (do deprecacji) |
| `gra/src/game/save.ts` | `SaveGame`, `SAVE_VERSION`, serialize/deserialize |
| `gra/src/main.ts` ~6592–6628 | `AutoMarchState`, `continueAutoMarchAfterTurn`, `clearAutoMarch` |

---

## Następny krok

Decyzja zapisana — **bez wdrożenia save/load** w tej sesji. Handoff: Integrator F — pole `autoMarch` w `SaveGame` + hook load + test regresji (zapis w marszu → load → jednostka idzie dalej).
