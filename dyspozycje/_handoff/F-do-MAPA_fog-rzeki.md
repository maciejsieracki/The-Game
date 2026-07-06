# HANDOFF: Fog of war nie przykrywa rzek (F → MAPA)

Data: 2026-06-27  
Status: **GOTOWE** (2026-06-27, Grupa A) — fix w `scene.ts`  
Priorytet: **P1 wizualny** (nie blokuje walki, psuje wiarygodność mgły)

## Objaw (playtest)

Na mapie 3D w grze (**Gra-podglad-ROBOCZA.html**, flow MENU → kreator):

- Teren pod mgłą wojny wygląda poprawnie (ciemny / explored przyciemniony).
- **Rzeki pozostają widoczne** na heksach, które powinny być ukryte (unknown) — „prześwitują” przez fog.

Maciej: fix przypisuje **lane MAPA** (mapa świata / render terenu), nie SILNIK.

## Gdzie szukać

| Plik | Co |
|------|-----|
| `gra/src/render/scene.ts` | `setFog(visible, explored)` — logika mgły terenu + nakładek + **rzek** |
| `gra/src/map/generator.ts` | `riverPaths` — trasy rzek (dane wejściowe) |
| `gra/src/main.ts` | wywołanie `scene.setFog(...)` — **NIE naprawiać w F** bez zmiany kontraktu |

### Hipoteza techniczna (do weryfikacji MAPA)

W `setFog` (~1153–1158):

```typescript
for (const entry of riverEntries) {
  const show = Array.from(entry.hexKeys).some(k => visible.has(k) || explored.has(k));
  entry.waterMesh.visible = show;
  entry.bankMesh.visible  = show;
}
```

Segment rzeki jest **widoczny**, gdy **choć jeden** hex z jego `hexKeys` jest `visible` **lub** `explored`.

Możliwe przyczyny buga:

1. **Segment zbyt długi** — jeden mesh obejmuje wiele hexów; wystarczy jeden explored na końcu trasy → cała rzeka świeci w mgle.
2. **`hexKeys` za szerokie** — deltaKeys / merge ścieżek obejmuje hexy poza faktyczną wstęgą.
3. **Brak per-hex clip** — rzeki to osobne `Mesh`, nie `InstancedMesh`; nie da się ukryć fragmentu jak lasu (skala 0) — może trzeba podzielić segmenty per hex lub maskować materiał.
4. **Rzeka na krawędzi hex** — mesh leży między hexami; klucz przypisany tylko do jednego sąsiada → widoczność z explored sąsiada odsłania wstęgę na hidden hex.

## Co MAPA ma zrobić

1. **Odtworzyć:** nowa gra, mała mapa, jednostka widoczności ograniczona — zobaczyć rzekę w strefie unknown.
2. **Zdiagnozować** który z powyższych przypadków występuje (log `hexKeys` / długość segmentów / screenshot).
3. **Naprawić** w `scene.ts` (ew. generator jeśli trasy/klucze błędne) tak, aby:
   - na hexach **unknown** (nie visible, nie explored) **żaden fragment rzeki** nie był renderowany;
   - na **explored** rzeka może być widoczna przyciemniona lub ukryta — **zachowaj spójność z terenem** (explored = factor 0.45 lub ukrycie — decyzja wizualna MAPA, bez ABC jeśli oczywiste).
4. **Nie ruszać `main.ts`** — jeśli potrzebna zmiana kontraktu `setFog`, handoff do MASTER.

## DoD (MAPA)

- [ ] Playtest wizualny: rzeki niewidoczne w strefie unknown (Maciej / ROBOCZA).
- [ ] Rzeki nadal OK na visible + explored (bez regresji F1).
- [ ] `Gra-podglad-MAPA.html` harness — ten sam fix (ten sam `scene.ts`).
- [ ] Meldunek w `MAPA-DO-MASTERA.md` + ewentualny handoff `MAPA-do-MASTER_*` jeśli wymaga wpiecia.

## Flaga

**CZEKA** — lane MAPA.
