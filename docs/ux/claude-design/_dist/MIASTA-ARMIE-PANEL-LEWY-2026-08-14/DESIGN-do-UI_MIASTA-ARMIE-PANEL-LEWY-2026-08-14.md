# DESIGN → UI · panele „Miasta" i „Armie" (lewa lista mapy świata)

**ZLECENIE-ID:** `MIASTA-ARMIE-PANEL-LEWY-2026-08-14`
**Data oddania:** 2026-08-14
**Makieta:** `The Game - Panel Miasta i Armie v1 2026-08-14 (1E).dc.html`
(oraz `Panel Miasta i Armie (standalone).html` — jeden plik, otwiera się offline)
**Zakres:** reskin dwóch paneli wysuwanych z lewej krawędzi mapy świata. 2 klatki, każda ze stanem
z danymi i stanem pustym. Szerokość panelu 340px = `PANEL_W`.

---

## 1. Paleta — potwierdzam 3b, trzecie złoto wypada

Zgodnie z rekomendacją §3 zlecenia oba panele przechodzą na paletę panelu imperium:

| Rola | Było (`cityListHud.ts`/`armyListHud.ts`) | Jest |
|---|---|---|
| Tło kart | `#1e2430` (`--panel`) | `#171e2a` |
| Obramowanie | `#2e3848` (`--border`) | `#2b3543` |
| Akcent złoty | `#e0b24a` (`--gold`) | **`#d9a441`** |
| Tekst wyciszony | `#8b97a8` (`--muted`) | `#7d8798` |
| Róg | `6px` | `7px` |

Powód dokładnie jak w §3: oba panele bywają otwarte jednocześnie z panelem imperium na jednym
ekranie mapy, więc spójność między nimi waży więcej niż spójność z paskiem medalionów.

**Co zostaje bez zmian:** poziomy gradient tła panelu (`90deg`, `rgba(6,10,20,.97)` →
`rgba(8,14,28,.85)`) — to cecha tego panelu, nie dług; podnoszę tylko wartości do 3b. Zostaje też
`'Segoe UI'`, pozycja, szerokość, `z-index`, mechanika Esc/toggle/outside-dismiss.

**Nie w zakresie (§6), nieruszone:** `mapToolbarHud.ts` (pasek medalionów — pokazany w makiecie
tylko jako kontekst styku), `gamePauseMenu.ts`, panel imperium.

---

## 2. Mapowanie makieta → kod

| Region makiety | Klasa dziś | Plik |
|---|---|---|
| Nagłówek panelu (ikona + tytuł + licznik + ✕) | `.ptitle`, `.al-close`/`.cl-close` | oba |
| Karta wiersza | `.al-item`/`.cl-item` | oba |
| Kafelek ikony 26px | `.al-ico`/`.cl-ico` | oba |
| Nazwa | `.al-name`/`.cl-name` | oba |
| Metryka pod nazwą (heks / mieszkańcy) | `.al-hex`/`.cl-pop` | oba |
| Plakietka stanu | `.al-garnizon-badge` → `.al-badge` (+ `.gold`/`.neutral`/`.blue`) | oba |
| Etykieta + wartość paska | `.al-bar-lbl` + `.al-bar-val` | armyListHud |
| Pasek Zdrowia / Ruchu | `.al-hpbar` / `.al-mvbar` | armyListHud |
| Linia produkcji + pasek | `.cl-prod` (dziś jeden string) | cityListHud |
| Pasmo podsumowania (hero + 2 boxy) | **nowe** `.cl-sum`, `.cl-sum-big`, `.cl-sum-box` | cityListHud |
| Zaznaczenie wiersza | `.al-item.on` | armyListHud |
| Stan pusty | `.al-empty`/`.cl-empty` | oba |
| Stopka podpowiedzi | `.al-hint`/`.cl-hint` | oba |

---

## 3. Armie — co się zmienia

1. **Wiersz staje się kartą** — tło `#171e2a`, ramka `#2b3543`, róg 7px. Dziś `.al-item` ma
   przezroczystą ramkę i tło tylko w hoverze, więc pięć armii to pięć bloków tekstu bez granic.
2. **Ikona w kafelku 26px** z tłem `#1d2634` — `brandIconSvg('tb-army', 18)` zostaje, przestaje
   wisieć w powietrzu obok tekstu.
3. **Hierarchia nazwa/heks** — nazwa 14px złota 700 (skracana wielokropkiem), heks i liczba
   jednostek jednym wierszem 11px `#7d8798`.
4. **Paski Zdrowie/Ruch zachowane w całości**, z etykietą i liczbą obok jak dziś. Wysokość 5→6px,
   róg pełny. **Interpolacja hue bez zmian** (`hsl(pct × 1.2, 65%, 45%)`) — jedyny kolor w panelu
   liczony z danych i działa. Liczba HP przy niskim stanie dostaje `#e07a7a`.
5. **Cztery plakietki, trzy kolory — ZATWIERDZONE 2026-08-14.** Dziś wszystkie cztery używają
   jednej klasy w jednym złocie, więc „uśpiona" i „w garnizonie" są nierozróżnialne bez czytania:
   - `#d9a441` **złoto** — stan obronny: „w garnizonie", „ufortyfikowana w polu"
   - `#9aa4b2` **neutralny** — „uśpiona" (jednostka nic nie robi)
   - `#8ec5ff` **błękit** — „auto-eksploracja" (jednostka działa sama)

   Plakietka wchodzi w wiersz nazwy, nie pod niego (−20px na karcie), `white-space: nowrap`.
6. **Zaznaczenie** — do zielonego tła dochodzi lewy pasek 2px `#78c95a` i plakietka „ZAZNACZONA";
   na liście przewijanej sam odcień tła bywa niewidoczny.
7. **Nagłówek** zyskuje ikonę, gradient tła i licznik „5 · 11 jedn." (suma z `unitCount`).
8. **Stan pusty** — ramka przerywana + wyciszona ikona. Komunikat bez zmian.

**Zero nowych pól w `ArmyListEntry`.**

---

## 4. Miasta — co się zmienia

Wszystko z §3 (karta, kafelek, hierarchia, nagłówek, stan pusty) plus:

1. **Oba emoji wypadają** — `🏛️` (linia 146) → `brandIconSvg('tb-cities')` w kafelku,
   `👥` (linia 155) → `res-population.svg` 12px przed liczbą mieszkańców. Ten sam mechanizm, którym
   zniknęły `🍞`/`⚠` w panelu imperium; nowego nie wprowadzam. Trzecie emoji `🔨` wypada wraz z
   rozbiciem `productionLine` (patrz §5.2).
2. **Pasmo podsumowania nad listą** — odpowiednik hero sekcji Moc: „4 miasta" 20px złote 800,
   podpis z sumą mieszkańców i liczbą kolejek w toku, dwa boxy 2×1 (W BUDOWIE / GARNIZONY). To ten
   sam gest co „Moc 181" + boxy Miasta/Rekruci. **Wszystkie trzy liczby to sumy pól, które panel już
   dostaje** (`population`, obecność `productionLine`, liczba z `metaLine`). Pasmo **nie renderuje
   się przy zerze miast** — „0 miast" powtarzałoby komunikat stanu pustego.
3. **Linia produkcji rozbita na trzy elementy** — nazwa budynku, liczba `8/20` wyrównana w prawo,
   pasek postępu pod spodem (złoty gradient, ten sam co paski w panelu imperium). Przy czterech
   miastach postęp da się porównać wzrokiem. **Wymaga zmiany danych — patrz §5.2.**
4. **„Kolejka pusta" dostaje plakietkę** neutralną — miasto, które nic nie produkuje, ma się
   wyróżniać, bo po to gracz otwiera tę listę. Tekst w wierszu zostaje.
5. **Długie nazwy** skracane wielokropkiem, nie łamane — przy 340px i plakietce obok to jedyny
   sposób na stałą wysokość karty.

---

## 5. Zgłoszenia — ROZSTRZYGNIĘTE 2026-08-14

| # | Zgłoszenie | Decyzja |
|---|---|---|
| 1 | Wspólny arkusz stylów `sideListHud.css.ts` | **Tak** — robimy |
| 2 | Rozbicie `productionLine` na 3 pola | **Tak** — dane są już policzone w silniku w tym samym miejscu, gdzie dziś sklejany jest string; fallback z paskiem tekstowym niepotrzebny |
| 3 | Plakietka „stolica" / „nowe" | „stolica" **tak** (koncept istnieje w grze); „nowe" **nie** — próg wieku nie jest zdefiniowany, plakietka wypada z makiety |
| 4 | Emoji w stopce podpowiedzi | **Zostaje** jak jest |
| 5 | Styk złota medalionu (`--tg-*`) i panelu (3b) | **Zaakceptowany** — bez osobnego zlecenia na `mapToolbarHud.ts` |

Szczegóły każdego punktu poniżej — treść z oddania, zachowana jako uzasadnienie.


1. **Wspólny arkusz stylów.** Oba pliki mają dziś kopiuj-wklej `ensureStyles()` różniące się tylko
   prefiksem (`.cl-*` vs `.al-*`). Po tym reskinie realna różnica to już wyłącznie paski
   Zdrowie/Ruch. Proponuję jeden `sideListHud.css.ts` z `.civ-side-list` i wspólnymi
   `.sl-item`/`.sl-name`/`.sl-badge`. Mockup działa w obu wariantach — decyzja Wasza.
2. **Rozbicie `productionLine` — jedyna zmiana danych w całym zleceniu.** Pasek postępu i wyrównana
   liczba wymagają trzech pól (nazwa, postęp, maks) zamiast jednego sklejonego stringa
   („Stolarnia • 8/20 🔨"); parsowania po separatorze `•` nie polecam. Zgłaszam wprost zgodnie z §6.
   **Zatwierdzone bez fallbacku** — dane są już policzone w silniku w tym samym miejscu.
3. **Plakietki.** „kolejka pusta" wynika z braku `productionLine`, więc działa od razu. „stolica"
   wymaga flagi w `CityListEntry` — **zatwierdzona**, koncept stolicy istnieje w grze. „nowe"
   **odrzucone** (brak zdefiniowanego progu wieku) i usunięte z makiety; trzeci odcień plakietki
   (błękit `#8ec5ff`) zostaje zarezerwowany dla Armii.
4. **Emoji w stopce podpowiedzi** („Ponowne 🏛 — zamknij listę", w Armiach „Ponowne ⚔") zostawiam
   bez zmian — to nazwa przycisku w zdaniu, nie ikona interfejsu, a tekstów nie ruszam bez zgody.
   Jeśli chcecie i tam SVG inline, dotyczy obu paneli.
5. **Styk z paskiem medalionów.** Złoty rant aktywnego medalionu (`--tg-*`) i złoty nagłówek panelu
   (3b) leżą teraz na dwóch różnych złotach — widać to na klatce A. Uważam, że da się z tym żyć:
   medalion jest okrągły i mniejszy, panel jest płaszczyzną. Jeśli macie inne zdanie, to osobne
   zlecenie na `mapToolbarHud.ts`.

---

## 6. DoD

- [x] Oba panele pokryte, stan pusty i z danymi dla obu
- [x] Paleta 3b (`#d9a441`, `#141a24`, `#171e2a`, `#2b3543`, `#7d8798`)
- [x] Zero emoji w interfejsie — `🏛️`/`👥`/`🔨` zamienione na SVG z brandu (stopka podpowiedzi: §5.4)
- [x] Wszystkie 4 plakietki stanu armii pokazane, w trzech zatwierdzonych kolorach
- [x] Paski Zdrowie/Ruch z liczbą obok zachowane i wystylowane, interpolacja hue nietknięta
- [x] Menu pauzy i pasek medalionów nieprzerysowane
- [x] `DESIGN-do-UI` + `MANIFEST.txt` + ZIP
- [x] Wszystkie 5 zgłoszeń §5 rozstrzygnięte przez właściciela 2026-08-14
