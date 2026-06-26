# ManualBattle — recznie sterowana bitwa taktyczna

`src/battle/manualBattle.ts` to **samodzielna** klasa `ManualBattle` realizujaca bitwe
sterowana przez gracza: wieksza, w pelni nawigowalna plansza heksow, zaznaczanie wlasnych
jednostek, animowany ruch i atak (przez `resolveCombat`, model SS5l), oraz prosty AI wroga.

Plik **nie modyfikuje** `battleScene.ts` — istnieje obok niego (rozne tryby walki):
- `BattleScene` = auto-bitwa (widz oglada).
- `ManualBattle` = bitwa taktyczna sterowana recznie.

## Publiczne API

```ts
import { ManualBattle } from './battle/manualBattle';
import type { BattleUnit, ManualBattleResult } from './battle/manualBattle';

const battle = new ManualBattle({
  player: playerUnits,   // BattleUnit[] — strona gracza
  enemy:  enemyUnits,    // BattleUnit[] — strona AI
  teren:  'rownina',     // nazwa terenu (kolor podlogi + modyfikatory resolveCombat)
  data:   { terrainData, counters },   // opcjonalne: te same tablice co w combat.ts
  cols:   20,            // opcjonalnie (domyslnie 20)
  rows:   12,            // opcjonalnie (domyslnie 12)
  onCancel: () => { /* gracz nacisnal "Wyjscie" */ },
});

battle.start((result: ManualBattleResult) => {
  // result.winner: 'gracz' | 'wrog' | 'remis'
  // result.survivors: BattleUnit[] (z zaktualizowanym .hp)
  // result.log: string[]
  // battle zostaje na ekranie do dispose():
  battle.dispose();
});
```

`BattleUnit` ma **dokladnie ten sam ksztalt** co w `battleScene.ts`:

```ts
interface BattleUnit {
  id: string; nazwa: string; kategoria: string;
  ownerColor: number; stats: any; hp: number; maxHp: number;
}
```

`kategoria` musi byc jedna z wartosci obslugiwanych przez `buildUnitModel`
(`osadnik, miecznik, wlocznik, lucznik, procarz, oszczepnik, maczuga, topor,
konnica, rydwan, super, domyslny`) — inaczej rysowany jest fallback-avatar.

## Sterowanie (dla gracza)

- **Klik wlasnej jednostki** (podswietlona zlotym pierscieniem) — zaznacza ja;
  pokazuje zasieg ruchu (niebieskie heksy) i mozliwe cele ataku (czerwone).
- **Klik niebieskiego heksu** — ruch (animowany). Zostale punkty pozwalaja jeszcze atakowac.
- **Klik wroga na sasiednim heksie** — ATAK: `resolveCombat` + animacja cios-za-cios
  z paskami HP i liczbami obrazen. Atak konczy ture danej jednostki.
- **Przeciaganie myszka / WASD / strzalki** — pan kamery. **Kolko** — zoom.
- Przyciski u gory: **"Zakoncz ture"** (oddaje ture AI) i **"Wyjscie"** (anuluje bitwe).

Po turze gracza dziala AI: kazda jednostka wroga atakuje sasiada (cel o najnizszym HP)
albo zbliza sie do najblizszej jednostki gracza. Gdy jedna strona zostanie wyeliminowana,
pokazywany jest baner wyniku i po ~1.6 s wywolywany `onFinish(result)`.

## Jak przelaczyc main.ts / battleScene w tryb reczny

Najprosciej dodac przycisk **"Sterowanie reczne"** na ekranie przed-bitewnym
(tam gdzie obecnie startuje `BattleScene`). Zamiast tworzyc `BattleScene`, utworz `ManualBattle`:

```ts
// gdzies tam, gdzie masz zebrane atakujacych/obroncow i teren:
import { ManualBattle } from './battle/manualBattle';

function startManualBattle(attackers, defenders, teren, terrainData, counters) {
  const mb = new ManualBattle({
    player: attackers,            // gracz steruje atakujacymi (lub wlasna strona)
    enemy:  defenders,
    teren,
    data: { terrainData, counters },
    onCancel: () => { /* powrot do mapy */ },
  });
  mb.start((res) => {
    // zastosuj wynik do stanu gry (kto przezyl, HP, kto wygral pole),
    // analogicznie jak po BattleScene:
    applyBattleOutcome(res.winner === 'gracz' ? 'atakujacy' : 'obronca', res.survivors);
    mb.dispose();
  });
}
```

Przyklad podpiecia przycisku obok istniejacego "Rozpocznij bitwe":

```ts
const btnManual = document.createElement('button');
btnManual.textContent = 'Sterowanie reczne';
btnManual.onclick = () => startManualBattle(attackers, defenders, teren, terrainData, counters);
preBattlePanel.appendChild(btnManual);
```

Mapowanie wynikow: `ManualBattleResult.winner` to `'gracz' | 'wrog' | 'remis'`,
podczas gdy `BattleResult.winner` to `'atakujacy' | 'obronca'`. Jesli gracz steruje
atakujacymi, to `'gracz' -> 'atakujacy'`, `'wrog' -> 'obronca'`.

## Uwagi techniczne

- Plansza budowana **identycznie jak `src/render/scene.ts`**:
  `CylinderGeometry(R*0.998, R*0.998, h, 6)` **bez `rotateY`** (CylinderGeometry(6) jest juz
  pointy-top jak `axialToWorld`) — kafelki bez szczelin. Pozycja przez `axialToWorld(q, r, R)`.
- Kamera: wlasny `BattleCamera` (wzorzec z `src/render/camera.ts`) — pan/zoom, staly kat,
  z detekcja "drag vs klik" (przeciagniecie kamery nie wybiera jednostki).
- Paski HP, liczby obrazen i animacja cios-za-cios uzywaja tych samych mechanizmow co
  `battleScene.ts` (PlaneGeometry billboard + HTML overlay `<div>` + lunge/recoil tween).
- `resolveCombat` wolane z `defenderTerrain`, `terrainData`, `counters` (modyfikatory SS5l).
- `dispose()` zwalnia wszystkie materialy/geometrie (per-jednostka `userData['mats']` i
  `userData['perTokenGeos']`, plus wlasne `ownedGeos`/`ownedMats` i podswietlenia) oraz
  usuwa overlay i sluchacze zdarzen.
- `selfTest()` — lekki test (bez WebGL) geometrii heksow i sasiedztwa.

## Walidacja typow

`npx tsc --noEmit` (z `tsconfig.json` projektu): **0 bledow w manualBattle.ts**.
(Uwaga: uruchomienie `tsc <plik>` z jawna nazwa pliku IGNORUJE `tsconfig.json` i daje
falszywe bledy "lib ES5" — to artefakt; wlasciwy check to `npx tsc --noEmit` bez argumentu.)
