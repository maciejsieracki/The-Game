# A3 — Spec wdrożenia marszu jednostki (checklist AC)

**Status:** SPEC (implementacja — Integrator F)  
**Data:** 2026-07-07  
**Decyzje źródłowe:** A3-P0-REDESIGN · A3-P0-2 · A3-P0-3  
**Warstwa:** 🟡 cross (A render + E UI + F `main.ts` + save)

---

## Skrót decyzji (jedna strona)

| ID | Temat | Decyzja |
|----|-------|---------|
| **A3-P0-REDESIGN** | Wejście + podgląd + przeszkody | Klik **bez Shift** → ścieżka + markery końca każdego ruchu; **STOP** przy przeszkodzie (bez obejścia); przerwanie = **nowy cel** lub **Stop/Zatrzymaj** |
| **A3-P0-2** | Save/load | **B** — marsz w save (`leaderId`, `destQ`, `destR`); po wczytaniu **kontynuuje** |
| **A3-P0-3** | Timing ruchu | Cel **planowany** bez natychmiastowego ruchu; segment wykonany po **„Zakończ turę"** lub po **„Kontynuuj"** w bieżącej turze |

**Deprec:** [`A3-shift-auto-marsz.md`](A3-shift-auto-marsz.md) (Shift+click MVP) — usunąć/zastąpić po wdrożeniu.

---

## Stany jednostki (maszyna stanów)

```
[Brak celu]
    │ klik na hex (zasięg dowolny)
    ▼
[Cel zaplanowany] ── podgląd trasy aktywny, jednostka stoi
    │
    ├─► Kontynuuj ──► [Segment w toku] ──► animacja ──► [Cel zaplanowany] lub [STOP] lub [Cel osiągnięty]
    │
    ├─► Zakończ turę ──► (end-turn) ──► segment dla wszystkich z [Cel zaplanowany]
    │
    ├─► Nowy cel (klik) ──► [Cel zaplanowany] (nowy dest)
    │
    └─► Stop/Zatrzymaj ──► [Brak celu]

[STOP] — przeszkoda / wróg / brak ruchu
    │ nowy cel LUB Stop
    └─► jak wyżej
```

| Stan | Opis | Podgląd trasy | Przyciski HUD |
|------|------|---------------|---------------|
| **Brak celu** | Jednostka bez zaplanowanego marszu | Brak (hover pokazuje podgląd hipotetyczny — opcjonalnie) | — |
| **Cel zaplanowany** | `destQ/destR` ustawione, jednostka **nie ruszyła** w tej fazie | Pełna trasa + markery tur | **Kontynuuj**, **Stop/Zatrzymaj** |
| **Segment w toku** | Animacja ruchu po Kontynuuj / end-turn | Trasa aktualizowana | Kontynuuj **disabled**, Stop **disabled** (do końca animacji) |
| **STOP** | Napotkano przeszkodę — stoi, czeka | Trasa do punktu STOP | **Stop** (wyczyść) · nowy klik = nowy cel |
| **Cel osiągnięty** | Dotarła do `dest` | — | — → **Brak celu** |

---

## UX — wejście gracza

### Klik na mapę (bez Shift)

- [ ] **AC-1** Zwykły klik na hex docelowy **planuje marsz** — jednostka **nie wykonuje ruchu** od razu.
- [ ] Podgląd: linia ścieżki A* + **markery** na hexach kończących segment każdej tury (1, 2, 3…).
- [ ] Cel poza zasięgiem bieżącej tury: podgląd **pełnej** trasy; pierwszy segment dopiero po end-turn lub Kontynuuj.
- [ ] **Usunąć** wymóg `e.shiftKey` z hover, kliku i `beginMoveSelectedUnitTo`.

### Hover (jednostka zaznaczona)

- [ ] Podgląd trasy do hexu pod kursorem (informacyjny, bez commitu celu).

### Przeszkoda na trasie

- [ ] **AC-2** Napotkanie przeszkody (wróg, blokada, brak ruchu): jednostka **STOP** w ostatnim legalnym hexie — **bez** kontynuacji, **bez** szukania obejścia.
- [ ] Stan marszu: **czeka** (cel nadal zapisany lub wyczyszczony — implementacyjnie: cel pozostaje, jednostka stoi w STOP do decyzji gracza).

### Przerwanie marszu

- [ ] **AC-3** **Nowy cel** (klik na inny hex) → zastępuje poprzedni plan; podgląd od nowa; bez ruchu do triggera.
- [ ] **AC-4** **Stop/Zatrzymaj** na pasku jednostki → `clearAutoMarch()` + zniknięcie podglądu + **Brak celu**.

---

## Timing — kiedy jednostka idzie

### End-turn („Zakończ turę")

- [ ] **AC-5** Po naciśnięciu end-turn: **wszystkie** jednostki gracza z aktywnym zaplanowanym celem wykonują **jeden segment** marszu (max punkty ruchu na turę).
- [ ] Kolejność segmentów end-turn: deterministyczna (np. kolejność `units[]` lub id) — udokumentować w kodzie.
- [ ] Po segmencie: jeśli dotarła do celu → **Cel osiągnięty**; jeśli przeszkoda → **STOP**; jeśli dalej droga → **Cel zaplanowany** (kontynuacja następnej tury).

### Kontynuuj (alternatywa w bieżącej turze)

- [ ] **AC-6** Przycisk **„Kontynuuj"** na pasku zaznaczonej jednostki z zaplanowanym celem.
- [ ] Naciśnięcie → jednostka wykonuje **kolejny segment** natychmiast (w ramach **tej samej** tury), o ile ma punkty ruchu.
- [ ] Widoczny tylko gdy: jednostka zaznaczona + cel zaplanowany + ma ruch + nie w animacji + nie w STOP wymagającym decyzji.
- [ ] Wielokrotne Kontynuuj do wyczerpania ruchu w turze lub osiągnięcia celu / STOP.

### Brak Kontynuuj

- [ ] **AC-7** Cel wskazany, Kontynuuj **nie** naciśnięty → po end-turn jednostka idzie **na tyle, na ile może** (jeden segment).

---

## Save / load

- [ ] **AC-8** Pole opcjonalne `autoMarch: { leaderId, destQ, destR }` w `SaveGame` ([`A3-P0-2-save-marsz.md`](A3-P0-2-save-marsz.md)).
- [ ] `serializeGame` — zapis aktywnego marszu; brak marszu → pole pominięte.
- [ ] `deserializeGame` + load hook — walidacja `leaderId`, przywrócenie stanu **Cel zaplanowany**; podgląd trasy opcjonalnie.
- [ ] Po load: **kontynuacja** wg timing A3-P0-3 (nie czekać na end-turn jeśli jednostka ma ruch w bieżącej turze — szczegół przy wpięciu F; domyślnie: cel zaplanowany, segment przy następnym end-turn lub Kontynuuj).
- [ ] Stare sejwy bez `autoMarch` → brak marszu po load (tolerancja wersji).

---

## Podział lane (implementacja)

| Lane | Pliki / zakres | Odpowiedzialność |
|------|----------------|------------------|
| **A** (render) | `gra/src/render/units.ts` | `setPathRoute` — markery per-tura; podgląd bez side-effectu; aktualizacja po STOP/nowym celu |
| **E** (UI) | pasek jednostki / HUD (`hud.ts`, panel jednostki) | Przyciski **Kontynuuj**, **Stop/Zatrzymaj**; stany disabled/enabled; etykiety PL |
| **F** (Integrator) | `gra/src/main.ts`, `gra/src/game/save.ts` | Planowanie celu vs wykonanie segmentu; end-turn hook; Kontynuuj handler; usunięcie Shift; save/load; wpięcie render + UI |

**Kolejność wpięcia F:** A (render API) → E (callbacki UI) → F (`main.ts` + save) → test regresji.

---

## Checklist AC (8 punktów — skrót dla implementera)

| # | Kryterium akceptacji |
|---|---------------------|
| **AC-1** | Klik bez Shift **planuje** cel — **bez** natychmiastowego ruchu; podgląd trasy + markery tur |
| **AC-2** | Przeszkoda na trasie → **STOP**, bez obejścia i bez auto-kontynuacji |
| **AC-3** | Nowy cel (klik) zastępuje poprzedni plan |
| **AC-4** | **Stop/Zatrzymaj** czyści marsz i podgląd |
| **AC-5** | **End-turn** wykonuje jeden segment marszu dla wszystkich jednostek z zaplanowanym celem |
| **AC-6** | **Kontynuuj** wykonuje segment w bieżącej turze (wielokrotnie do limitu ruchu) |
| **AC-7** | Bez Kontynuuj: segment dopiero po end-turn |
| **AC-8** | Save/load: `autoMarch` zapisany; po wczytaniu marsz kontynuuje |

---

## Testy regresji (Integrator F)

1. Klik cel → jednostka stoi → end-turn → przesuwa się o 1 segment.
2. Klik cel → Kontynuuj → przesuwa się w tej turze → end-turn → kolejny segment jeśli jeszcze cel daleko.
3. Trasa z przeszkodą → STOP → nowy cel / Stop działa.
4. Zapis w marszu → load → cel nadal zaplanowany → end-turn lub Kontynuuj kontynuuje.
5. Brak regresji: Shift nie wymagany nigdzie w flow marszu.

---

## Powiązane dokumenty

- [`A3-marsz-sciezka-2026-07-07.md`](A3-marsz-sciezka-2026-07-07.md) — A3-P0-REDESIGN
- [`A3-P0-2-save-marsz.md`](A3-P0-2-save-marsz.md) — persistencja
- [`A3-P0-3-timing-marszu.md`](A3-P0-3-timing-marszu.md) — timing
- [`A3-shift-auto-marsz.md`](A3-shift-auto-marsz.md) — MVP do usunięcia
