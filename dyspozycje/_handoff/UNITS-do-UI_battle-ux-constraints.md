# HANDOFF: UNITS → UI — ograniczenia techniczne UX bitwy (D5=B)

**Data:** 2026-06-26 · Od: Grupa C · Do: UI (przez MASTER)  
**Kontekst:** D5=B (gracz steruje + przełącznik AUTO) + faza rozstawiania. Plik `UI-do-UNITS_ux-bitwy-q2-q7-totalwar.md` **nie istnieje** — poniżej ograniczenia wyciągnięte z kodu lane UNITS.  
**Referencje:** `gra/src/ui/preBattle.ts`, `gra/src/battle/battleScene.ts`, `gra/src/battle/manualBattle.ts`, `_handoff/UNITS-do-MASTER_UX-bitwa.md` §5/5a.

---

## 1. Granica lane'ów

| Warstwa | Właściciel | Pliki |
|---|---|---|
| Ekran przed-bitewny (overlay DOM) | **UI** | `gra/src/ui/preBattle.ts` |
| Plansza 3D + logika taktyczna | **UNITS** | `gra/src/battle/battleScene.ts` |
| Prototyp sterowania ręcznego (alternatywa) | **UNITS** | `gra/src/battle/manualBattle.ts` |
| Wpięcie z mapy / `main.ts` | **MASTER** | tylko integracja |

UI **nie edytuje** `battleScene.ts`. UNITS dostarcza kontrakt API + hooki DOM (sloty), UI skinuje i rozszerza.

---

## 2. preBattle.ts — kontrakt (gotowy do skinu)

### API publiczne

```typescript
showPreBattle(info: PreBattleInfo, cb: PreBattleCallbacks): void
hidePreBattle(): void
isPreBattleOpen(): boolean
```

### Typy danych (SILNIK/MAPA muszą dostarczyć)

- `PreBattleInfo`: `{ atakujacy, obronca, teren, szanseAtkPct }`
- `PreBattleSide`: `{ nazwa, cywilizacja?, units: PreBattleUnit[] }`
- `PreBattleUnit`: `{ nazwa, kategoria, hp, maxHp, atak, ilosc? }`

### Callbacki (3 ścieżki — MASTER wpięcie)

| Przycisk UI | Callback | Efekt po stronie UNITS/MASTER |
|---|---|---|
| Auto-rozegranie | `onAuto()` | `resolveCombat` / model siły (kontrakt multi-unit) — bez BattleScene |
| Na pole bitwy | `onBattlefield()` | `new BattleScene({ attacker, defender, teren, deploy: true, siege? })` |
| Wycofaj / Anuluj | `onCancel()` | powrót na mapę, brak strat |

### Ograniczenia techniczne overlay

- **ASCII-only** w źródle; polskie stringi przez `\uXXXX`.
- **Pure DOM** — bez THREE, bez `innerHTML` z polskimi znakami.
- **z-index:** `9900` (fixed fullscreen).
- **CSS:** zmienne `--pb-*` wstrzykiwane raz (`ensureStyles()`).
- **Layout:** grid 3 kolumny (atak \| centrum \| obrona) + topbar + bottombar z 3 przyciskami.
- **Nie blokuje** kliknięć pod spodem po `hidePreBattle()`.

### Co UI może zmieniać bez dotykania UNITS

- Kolory, typografia, ikony przycisków, animacje wejścia.
- Układ chipów jednostek, wykres szans, copy tekstów.
- **Nie zmieniać** nazw callbacków ani kształtu `PreBattleInfo` bez handoffu do MASTER.

---

## 3. battleScene.ts — stan implementacji D5=B

### Wejście (`BattleOpts`)

```typescript
interface BattleOpts {
  attacker: BattleUnit[];
  defender: BattleUnit[];
  teren: string;
  data?: any;
  onCancel?: () => void;
  siege?: SiegeOpts;   // mur/brama oblężnicza
  deploy?: boolean;    // true → faza rozstawiania przed walką
}
```

`BattleUnit`: `{ id, nazwa, kategoria, ownerColor, stats, hp, maxHp }` — `stats` = wiersz z `units.json`.

### Fazy (maszyna stanów)

```
preBattle (UI) → [deploy?] → walka (auto lub ręczna) → ekran końca → onFinish
```

| Faza | Flaga / pole | Zachowanie |
|---|---|---|
| Rozstawianie | `deployPhase=true` (gdy `opts.deploy`) | Gracz przesuwa **tylko atakujących** w strefie startowej (lewa połowa pól); Auto-ustaw / Reset / Start |
| Walka AUTO | `_manualMode=false` | AI obu stron (obecna mechanika) |
| Walka RĘCZNA | `_manualMode=true` (domyślnie **true** po wejściu) | Gracz steruje **stroną atakującą** (`side==='atk'`); obrona = AI |
| Pauza / prędkość | `paused`, `SPEED_STEPS` 1..512 | klawisze P, S; wirtualny zegar |

### Co już jest w HUD (UNITS — do oskinowania przez UI)

- Dolny pasek ikon: prędkość, pauza, pomiń, wyjście, dźwięk, paski H, **AUTO/RECZNE (R)**.
- Baner trybu AUTO/RECZNE (góra).
- Paski morale armii L/R, log 10 starć (prawy-góra).
- **Roster** (`_rosterBar`) — widoczny w trybie ręcznym; grupy Frontalne/Dystans/Mounted (F3).
- Ekran końca + Szczegóły + Zakończ bitwę.
- Faza deploy: overlay `#deploy-overlay` z Auto-ustaw / Reset / **Start bitwy**.

### Ograniczenia planszy (UI minimapa / kamera)

- Siatka: **34×78** kafli (`BF_COLS`×`BF_ROWS`), `TILE_S=1.0`.
- Kamera: pan (drag), zoom (kółko); w trybie ręcznym lewy przycisk = rozkazy, nie pan.
- Billboard paski nad jednostką: HP / morale / amunicja (3 lub 2 dla niestrzelających).
- **Nie zakrywać** dolnego rosteru ani górnego banera trybu — safe area ~80px dół, ~40px góra.

### Rozkazy D5=B — stan vs wymaganie Macieja (§5a)

| Wymaganie Total War | Stan w battleScene | Uwaga dla UI |
|---|---|---|
| Kursor łuk/miecz | **Częściowo** — brak dedykowanych kursorów CSS | UI może podać assety + klasa `cursor-*` na canvas wrapper |
| Ruch / Atak klik | **TAK** (manualMode, strona atk) | — |
| Wycofanie / Odwrót | **Częściowo** — rout istnieje, brak jawnego rozkazu gracza | UI: przycisk → callback do UNITS (do implementacji) |
| Stand by / Broń pozycji | **NIE** | UI zarezerwować slot; UNITS doda flagę `holdPosition` |
| Dystans ON/OFF (kiting) | **NIE** (AI zawsze kite w auto) | UI toggle → flaga per jednostka |
| Strzelanie ON/OFF | **NIE** | UI toggle → flaga `rangedEnabled` |
| Panel zaznaczonej jednostki | **Częściowo** — roster + hint tekstowy | UI: panel boczny ze statami |
| Roster 3 grupy + slot generała | **TAK** (`_buildRosterBar`) | UI skin + **1 pusty slot** na generała (placeholder) |
| Minimapa | **NIE** | UI lane (D15 powiązane) |
| Linie rozkazów żółta/czerwona | **NIE** | UI/UNITS wspólnie — UNITS rysuje linie na scenie lub UI overlay 2D |

### Przełącznik AUTO ↔ RĘCZNE

- Klawisz **R** + przycisk HUD `_manualBtn`.
- AUTO: AI steruje atakującymi jak obrońcą.
- RECZNE: `_manualMode=true`, roster widoczny, input myszy na atakujących.

---

## 4. manualBattle.ts — prototyp alternatywny

- **Osobny moduł** — nie używany w kanonie; pełna kontrola gracza nad `player[]`, AI nad `enemy[]`.
- API: `constructor(ManualBattleOpts)` → `start(onFinish)` → `dispose()`.
- Plansza domyślnie 20×12 (mniejsza niż battleScene).
- **Rekomendacja:** nie integrować równolegle — rozwijać tryb ręczny **w battleScene** (już `_manualMode`). manualBattle = referencja UX/input.

---

## 5. Wymagane rozszerzenia kontraktu (UI ↔ UNITS ↔ MASTER)

### 5a. Nowe callbacki preBattle (propozycja)

Obecnie 3 przyciski. D5=B wymaga na polu bitwy (nie w preBattle):

- Po `onBattlefield()` → `BattleScene` z `deploy:true`, potem `_manualMode` domyślnie **true** (sterowanie).

### 5b. Hooki DOM dla UI (battleScene — do uzgodnienia)

UNITS może wystawić puste kontenery o stałych `id`:

| id | Pozycja | Zawartość UI |
|---|---|---|
| `#battle-hud-top` | góra | tura, prędkość, morale armii, stratniki |
| `#battle-hud-bottom` | dół | roster (obecny `_rosterBar` może migrować tutaj) |
| `#battle-unit-panel` | prawy bok | staty zaznaczonej jednostki + rozkazy |
| `#battle-minimap` | prawy-dół | minimapa (opcjonalnie D15) |

**DoD:** UI wstrzykuje CSS/HTML bez zmiany logiki THREE; UNITS nie usuwa istniejących przycisków do czasu migracji.

### 5c. Typy rozkazów (do implementacji UNITS po mockupie UI)

```typescript
type BattleOrder =
  | { kind: 'move'; targetCol: number; targetRow: number }
  | { kind: 'attack'; targetUnitId: string }
  | { kind: 'hold' }
  | { kind: 'retreat' }
  | { kind: 'rangedMode'; enabled: boolean }
  | { kind: 'shootMode'; enabled: boolean };
```

---

## 6. Oblężenie na planszy (styk UI)

- `BattleOpts.siege?: { civ?, defCiv? }` — aktywuje mur, bramę, logikę Taran/Katapulta.
- Taran → atak bramy; Katapulta → niszczenie kafli muru z dystansu (`battleScene` `_attackWallTile`).
- UI **nie** renderuje muru — THREE mesh w battleScene.
- Panel oblężenia na mapie (kolejka machin 1/turę) = **osobny overlay** (UI + MAPA); poza battleScene.

---

## 7. Checklist dla UI (D5=B)

- [ ] Skin `preBattle.ts` (zachować API + 3 callbacki).
- [ ] Mockup HUD Total War: roster 3+1 generał, panel jednostki, kursory.
- [ ] Safe areas dla canvas 34×78 (minimapa, paski armii).
- [ ] Spec rozkazów §5c — przekazać UNITS po akceptacji Macieja.
- [ ] Q2–Q7 (minimapa, górny pasek, styl) — czeka decyzje; ten dokument = ograniczenia techniczne Q1+B+deployment.

---

## 8. Pliki referencyjne dla playtestu

- `Gra-podglad-BITWA.html` — pełna bitwa testowa (klawisz T).
- `UI/Makieta-preBattle.html` — makieta wizualna preBattle (kanoniczna).
- `Civ-UNITS/Bitwa-parametry.xlsx` — parametry tuningu.

— Grupa C
