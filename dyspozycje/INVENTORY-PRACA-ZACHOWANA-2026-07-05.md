# Inwentaryzacja pracy — co jest zachowane (2026-07-05 wieczór)

**Dla Macieja:** ta praca **nie przepadła** — siedzi w plikach źródłowych `.ts` / `.svg`.
Chaos wynikał z **wielu bundli HTML** (root kanon vs START vs pole bitwy), nie z braku kodu.

## Gdzie testować

**Jeden punkt wejścia:** `gra-robocza/START.html` — hub z linkami do wszystkich bundli (md5 przy każdym).

| Tor | Plik | Co zawiera |
|---|---|---|
| **Mapa + miasto + gra** | `Gra-podglad.html?skipMenuRedirect=1` | B0.9 plony, overlay mapy, panel miasta W3, cała gra |
| **Playtesty** | `Gra-podglad-PLAYTEST-*.html` | Ten sam bundel co gra — **nazwa pliku** włącza auto-start (walka, mapa, miasto, odskok, oblężenie) |
| **Pole bitwy / free battle** | `Gra-podglad-POLE-BITWY.html` | Osobny entry `gra/src/oblezenie/` |
| **NIE testować** | root `Gra-podglad.html` | Stary/mylący kanon |

## Źródła (prawda — tu jest praca)

| Obszar | Pliki | Stan |
|---|---|---|
| **Walka / oblężenie** | `gra/src/battle/battleScene.ts`, `siegeHud1E.ts`, `gra/src/oblezenie/main.ts` | C-04/C-05, `player-roster-bar`, `wallDeltaPerTurn: 0`, bez dolnego mockupu C-05 |
| **Miasto W3** | `gra-robocza/src/ui/cityPanel.ts` (+ sync `gra/src/`) | Rail `cp-*` tier3, chipy Praca/Budowa SVG (`cityPanelChipIcon`, `res-work`, `cp-buildings`) |
| **Infografiki** | `gra-robocza/src/ui/icons/brand/**` (~200+ SVG) | `bld-*` budynki, tier1–7, chipy, cywilizacje — w bundlu jeśli importowane |
| **Mapa B0.9** | `main.ts` bak B0.9, `map/generator.ts`, `render/scene.ts`, overlay | W START po merge z `main.ts.bak-SILNIK-B0.9-showYields-2026-07-05` |

## Bundle (odświeżone tej sesji)

- **START** `gra-robocza/Gra-podglad.html` — pełna gra (~10 MB); markery: overlay, showYields, cp-labor, player-roster-bar (walka w grze).
- **POLE-BITWY** — przebudowany z `npx vite build --config vite.oblezenie-bitwa.config.ts` (gra/) → skopiowany do `gra-robocza/Gra-podglad-POLE-BITWY.html`.

## Co jeszcze nie jest „100% W3” w mieście

Emoji mogą zostać w sekcjach bilansu / okolicy / kartach pomocy — to kosmetyka, osobny batch UI.
Rail i zakładka Praca = już SVG.

## Reguła na przyszłość

1. Kod → zawsze `gra/src` **lub** `gra-robocza/src` (sync 1:1 po merge).
2. Playtest Macieja → **`gra-robocza/START.html`** (hub: gra + playtesty + pole bitwy).
3. Pole bitwy → osobny build (`vite.oblezenie-bitwa.config.ts`), nie wchodzi w START automatycznie.
4. Przed ogłoszeniem „gotowe”: md5 bundla + który HTML.

## Powiązane

- `dyspozycje/KRYZYS-COFNIETE-PLIKI-2026-07-05.md`
- `gra-robocza/ROBOCZA-MANIFEST.json` (START — aktualizować przy publish)
