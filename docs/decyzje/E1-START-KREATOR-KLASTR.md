# E1 / D-START — Start gry w kreatorze (wybór cywilizacji)

**Status:** **ZAMKNIĘTE** (spec + UI + kontrakt silnika) · 2026-06-27  
**Lane UI:** `newGameFlow.ts` · **Lane SILNIK:** `doStartGame` + `applyClusterStartPlan`  
**Grupa D:** runtime AI/gospodarka — **poza** kreatorem (patrz `OD-MASTERA-D-START-HANDOFF.md`)

---

## Cel

Cały **start rozgrywki** (klaster, nazwy, model miast-kopii typu) musi być **widoczny i przewidziany już przy wyborze cywilizacji** w kreatorze — zanim silnik generuje mapę.

Gracz rozumie:
- jaką **stolicę** dostanie (`nazwyKlastra[0]`);
- ilu **rywali tego samego typu** w klastrze (skala mapy);
- że **obce typy** to osobne klastry miast-kopii do podbicia;
- że to **nie** są losowe „50 nacji”.

---

## Przepływ kreatora (5 kroków)

| Krok | UI | Start / klaster |
|------|-----|-----------------|
| 1 Intro | Tekst o narodzie i klastrze | Wzmianka o klastrze typu |
| 2 **Cywilizacja** | Panel boczny: **Stolica**, lista nazw klastra, model | `buildStartPreview(civId)` — mapa domyślna |
| 3 Epoka | bez zmian | epoka → `player.era` |
| 4 **Ustawienia** | Blok **„Twój start”** (live) | preview z `mapSize` + `rivals` |
| 5 Generowanie | Wiersze: Stolica, Rywale, Typy, Model | `NewGameParams.startPreview` → `onStart` → SILNIK |

---

## Kontrakt `NewGameParams`

```typescript
import type { StartPreview } from '../game/start-preview';

interface NewGameParams {
  civId: string;           // ikonaId — wybór krok 2
  mapSize: string;
  rivals: string;
  // … pozostałe pola …
  /** Podgląd startu klastra — SILNIK loguje / weryfikuje przy doStartGame */
  startPreview?: StartPreview;
}
```

**SILNIK:** `applyClusterStartPlan(_menuCivId, seed, _menuRivals)` musi być **spójny** z `startPreview` (ta sama stolica, ta sama N).

---

## Moduły

| Plik | Rola |
|------|------|
| `gra/src/game/start-preview.ts` | Pure: preview z civs + map defaults |
| `gra/src/game/civ-names.ts` | nazwyKlastra[0..N] |
| `gra/src/game/cluster-start.ts` | Plan startu (SILNIK) |
| `gra/src/ui/newGameFlow.ts` | UI kreatora |
| `gra/src/map/newGameMapDefaults.ts` | skala rywali / typów |

---

## Teksty UI (kanon)

- **Stolica:** „Twoje pierwsze miasto: **{playerCapitalName}** (stała nazwa startu).”
- **Rywale:** „W klastrze: **{N}** miast tego samego typu ({lista}). Cel: pokonać rywali własnego typu.”
- **Obce typy:** „Na mapie także **{foreignTypes}** obcych typów — własne klastry; pełna dyplomacja po kontakcie.”
- **Model:** „Miasta AI = kopie typu (ta sama gospodarka co ty), nie osobne nacje.”

---

## Co NIE jest w kreatorze (→ Grupa D)

- AI defensywne w turze
- Pełny spawn wszystkich miast obcych klastrów (MAPA+SILNIK)
- Excel AI-zachowanie

Kreator **przewiduje miejsce** na te elementy w podsumowaniu i w `startPreview` — implementacja runtime = Grupa D / MAPA / SILNIK.

---

## DoD kreatora startu

- [x] `buildStartPreview()` + testowalne pure API
- [x] Krok 2: panel klaster przy wybranej cywilizacji
- [x] Krok 4: live podgląd przy zmianie mapy/rywali
- [x] Krok 5: wiersze w Generowaniu + `startPreview` w params
- [x] SILNIK: `cluster-start` w `doStartGame` (osobny batch)

**Playtest Macieja:** wybierz Grecy → widać Ateny + rywali; Start → mapa z klastrem.
