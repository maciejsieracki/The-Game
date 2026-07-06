# MAPA → MASTER: obwódka miast na mapie świata

**Status:** GOTOWE · **Maciej:** **OK** · **Data:** 2026-07-03  
**Decyzja Macieja:** delikatna obwódka heksu — czytelność miast w terenie; kolory wg dyplomacji.

## Co przesyłam

| Plik | Zmiana |
|------|--------|
| `gra/src/render/cityMapOutline.ts` | **NOWY** — podwójna obwódka heksu (wewnętrzna + zewnętrzna miękka) |
| `gra/src/render/cities.ts` | `syncMapOutlines`, callback `getMapOutlineKind`, mgła |
| `gra/src/main.ts` | `cityMapOutlineKindForOwner`, odświeżanie po `setDiploRelation` |

## Reguły kolorów (względem gracza, owner 0)

| Relacja | Kolor | Hex |
|---------|--------|-----|
| **Nasze miasto** | jasnoniebieski | `#7EC8E8` |
| **Wojna** | czerwony | `#FF4444` |
| **Neutralni** | zielony | `#5CB85C` |
| **Sojusznik** | ciemnoniebieski | `#1A4A8A` |

Sojusz = `rel.status === 'sojusz'` **lub** aktywny traktat sojuszowy (`sojusz_pelny` / `sojusz_defensywny` / `SojuszWojskowy`).

## Zachowanie

- Obwódka na **heksie miasta** na mapie 3D — **nie** dotyczy overlay okolicy w panelu miasta.
- Widoczna tylko gdy miasto widoczne (mgła / `isVisible`).
- Po zmianie dyplomacji: `setDiploRelation` → `syncMapOutlines`.

## DoD / playtest Macieja

1. Ctrl+F5 · mapa świata — własne miasto ma jasnoniebieski pierścień.
2. Wojna z AI — miasta wroga czerwone.
3. Neutralny kontakt — zielony.
4. Sojusz — ciemnoniebieski.
5. Obwódka znika w mgle dla niewidocznych obcych miast.

## MASTER

- Build kanonu po OK playtestu Macieja (+ Opus przed sign-off).
- Brak zmian w `main.ts` poza już wpiętym callbackiem — ten batch MAPA+SILNIK hook jest domknięty.
