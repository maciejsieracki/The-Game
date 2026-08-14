# ZLECENIE Design — panele „Miasta" i „Armie" (lewa lista mapy świata, reskin do kanonu 1E)

**Od:** Lane UI / Maciej
**Do:** Designer zewnętrzny (dostęp do GitHuba, czyta kod)
**Data:** 2026-08-14
**ZLECENIE-ID:** `MIASTA-ARMIE-PANEL-LEWY-2026-08-14`
**Priorytet:** P1 — brak reskinu, gra grywalna, ale te dwa panele nigdy nie dostały uwagi projektowej (w przeciwieństwie do panelu imperium po prawej, `11-ZAKLADEK-PANEL-IMPERIUM-2026-08-13`, już w realizacji)
**Kontekst zgłoszenia:** Maciej, w czacie 2026-08-14, patrząc na dwa zrzuty ekranu (panel „Miasta" i panel „Armie"): *„To zmienię surowy panel po lewej stronie: miasta i Armie są przestarzałe i nie były nigdy zmienione."* Prośba wprost nawiązuje do wcześniejszego zlecenia reskinu (Skarbiec/Praca/Nauka itd.) jako wzorca procesu — ten sam Designer, ta sama metoda pracy.

---

## 0. Cel (1 zdanie)

Dwa panele wysuwane z lewej strony mapy świata — lista miast i lista armii, otwierane kliknięciem
medalionów na pionowym pasku ikon — mają dostać reskin do tego samego poziomu wizualnego co reszta
HUD gry (paleta, hierarchia, akcent złoty), zamiast dzisiejszego surowego, generycznego wyglądu.

---

## 1. Gdzie to żyje w kodzie

**Dwa niemal identyczne pliki, ten sam wzorzec strukturalny:**

- [`gra/src/ui/cityListHud.ts`](https://github.com/maciejsieracki/The-Game/blob/main/gra/src/ui/cityListHud.ts) (261 linii) — panel „Miasta", otwierany kliknięciem medalionu 🏛 na pasku [C] (`gra/src/ui/mapToolbarHud.ts`, `onOpenCities`).
- [`gra/src/ui/armyListHud.ts`](https://github.com/maciejsieracki/The-Game/blob/main/gra/src/ui/armyListHud.ts) (357 linii) — panel „Armie", otwierany kliknięciem medalionu ⚔ na tym samym pasku (`onOpenArmy`).

Oba renderują się jako string HTML wstrzykiwany przez `innerHTML`, styl wstrzyknięty raz w
`ensureStyles()` na początku każdego pliku (klasy `.civ-city-list-hud`/`cl-*` i
`.civ-army-list-hud`/`al-*` — prefiksy różne, ale identyczna struktura CSS, kopiuj-wklej z
drobnymi różnicami). Panel: stały pasek po lewej krawędzi ekranu, `width: min(24vw, 340px)`,
pełna wysokość między paskiem toolbara u góry a paskiem dolnym gry, zamykany krzyżykiem/Esc/
ponownym kliknięciem tej samej ikony.

**Trzeci, POKREWNY plik — pasek ikon, który te panele otwiera:**
[`gra/src/ui/mapToolbarHud.ts`](https://github.com/maciejsieracki/The-Game/blob/main/gra/src/ui/mapToolbarHud.ts)
— pionowa kolumna okrągłych medalionów 52px po lewej krawędzi ekranu (Miasta, Nauka, Kultura,
Religia, Dyplomacja, Armia, Budowa). **Ten pasek NIE jest w zakresie tego zlecenia** (już używa
tokenów `--tg-*`/`--civ-*`, patrz §3) — wymieniony tylko jako kontekst wizualny: Designer powinien
zobaczyć go razem z panelami w mockupie, żeby ocenić czy nowy styl paneli z nim współgra, ale nie
przerysowuje samych medalionów.

---

## 2. Stan dzisiejszy — dlaczego to „surowe"

Oba zrzuty ekranu Macieja pokazują dokładnie ten problem: prosta ciemna karta z tytułem UPPERCASE,
zwykłym tekstem info, bez żadnego akcentu, hierarchii czy „ciężaru" wizualnego. Zweryfikowane
bezpośrednio w kodzie:

- **Panel „Miasta" pusty stan:** jeden wiersz miasta — ikona emoji 🏛️ (dosłowny znak Unicode, nie
  SVG z brandu), nazwa, „👥 N mieszk." (też emoji), linia produkcji („Kolejka pusta" albo nazwa
  budynku), stopka kursywą z podpowiedzią klawiszy. Zero hierarchii — nazwa miasta i „Kolejka
  pusta" mają niemal tę samą wagę wizualną.
- **Panel „Armie" pusty stan:** jeszcze uboższy — sam tytuł „ARMIE" + jedno zdanie
  „Brak jednostek na mapie — zrekrutuj wojsko w mieście." Kiedy armie ISTNIEJĄ, panel jest
  faktycznie najbogatszy funkcjonalnie z całego HUD (patrz §4) — ale ta bogatość nie ma dziś
  żadnej wizualnej otoczki, tylko surowe paski i etykiety.
- **Ikony:** panel Armie już korzysta z prawdziwej ikony SVG z brandu (`brandIconSvg('tb-army', 18)`)
  — dobry precedens do skopiowania. Panel Miasta wciąż używa emoji 🏛️/👥 (`cityListHud.ts` linie
  146, 155) — **do wymiany na SVG z tej samej rodziny brandu**, analogicznie do niedawnej naprawy
  emoji 🍞/⚠ w panelu imperium (`R-DESIGN-11-ZAKLADEK`, §8.3/§8.7 tamtego zlecenia — ten sam wzorzec
  `mapResourceIconSvg()`/`brandIconSvg()` już istnieje w kodzie, użyj go zamiast wprowadzać nowy
  mechanizm ikon).

---

## ⚠️ 3. Paleta — TRZECI, jeszcze inny zestaw kolorów niż w dwóch już zbadanych miejscach

Repozytorium ma już udokumentowaną rozbieżność między paletą „zamrożonego kanonu" (`tokens.css`,
`#e8d88a`) i paletą faktycznie wdrożoną w panelu imperium (`empireDetailPanel.ts`, `#d9a441`) —
pełny opis w `docs/ux/DESIGN-ZLECENIE-11-ZAKLADEK-PANEL-IMPERIUM-2026-08-13.md`, §3. **Te dwa
pliki (`cityListHud.ts`/`armyListHud.ts`) używają JESZCZE INNEJ, trzeciej wersji**, zweryfikowanej
wprost w `ensureStyles()` obu plików (identyczne wartości w obu):

| Rola | Wartość w `cityListHud.ts`/`armyListHud.ts` | Panel imperium (3b) | Kanon zamrożony (3a) |
|---|---|---|---|
| Tło panelu | gradient `rgba(6,10,20,.97)` → `rgba(8,14,28,.85)` | `#141a24` | `#080a12`/`#121820` |
| Tło kart | `#1e2430` (`--panel`) | `#171e2a` | — |
| Obramowanie | `#2e3848` (`--border`) | `#2b3543` | `rgba(232,216,138,.45)` 2px |
| Akcent złoty | **`#e0b24a`** (`--gold`) | `#d9a441` | `#e8d88a` |
| Tekst wyciszony | `#8b97a8` (`--muted`) | `#7d8798` | `#8a8070` |
| Czcionka | `'Segoe UI',Tahoma,sans-serif` | `'Segoe UI', system-ui` | Georgia (nagłówki) + Segoe UI |
| Róg | `6px` (`.panel`) | `7–8px` | `12–14px` |

Trzy blisko siebie leżące, ale **nie identyczne** złota (`#e0b24a` / `#d9a441` / `#e8d88a`) w tej
samej grze to dokładnie ten sam problem, który zlecenie 11-zakładek już raz nazwało („dwie różne
złote w jednym oknie panelu wyglądałyby gorzej niż brak stylu") — z tą różnicą, że tu chodzi o
**dwa osobne okna panelu** (lewy vs prawy), więc użytkownik nie widzi ich jednocześnie w kadrze —
ryzyko rozjazdu jest mniejsze niż w 11-zakładkach, ale nadal warto ujednolicić.

**Rekomendacja:** dostosuj te dwa panele do **palety 3b** (`#d9a441`, `#141a24`, `#171e2a`,
`#7d8798`) — tej samej, którą dogania już trwający reskin panelu imperium. Oba panele (lewy:
Miasta/Armie, prawy: panel imperium) są częścią tego samego ekranu mapy świata, widoczne obok
siebie gdy oba otwarte naraz — spójność między nimi ma większe znaczenie niż spójność z paskiem
medalionów (`mapToolbarHud.ts`), który żyje w osobnym systemie tokenów i nie jest w zakresie tej
zmiany. Jeśli uważasz inaczej — napisz to wprost w handoffie, nie decyduj cicho.

**Coś, co NIE wymaga zmiany — dla kontrastu, żeby nie przerysowywać bez potrzeby:** menu pauzy gry
(`gra/src/ui/gamePauseMenu.ts`, „Menu gry" — Maciej pokazał to jako osobny zrzut, pytając czy było
już projektowane) **JEST już dopracowane** — gradient tła, złoty akcent `#e0b24a` spójny z
suwakami, hover states, hierarchia przycisków (`.civ-pause-primary`/`.civ-pause-danger`). To NIE
jest w zakresie tego zlecenia — zostaje bez zmian, wymieniony tylko jako punkt odniesienia „to już
wygląda dobrze, to nie".

---

## 4. Co trzeba pokazać w mockupie — dane, nie tylko layout

Oba panele mają bogatszą zawartość niż widać na zrzutach Macieja (oba zrzuty pokazują stan **pusty**
lub **niemal pusty** — jedno miasto, zero armii). Mockup musi pokazać też stan **z danymi**, bo
tam jest większość informacji do wystylowania:

### 4.1 Panel Miasta (`cityListHud.ts`)

Per wiersz miasta: ikona, nazwa (`.cl-name`), liczba mieszkańców (`.cl-pop`), linia produkcji —
np. „Stolarnia • 8/20 🔨" (`.cl-prod`, `productionLine`), opcjonalna linia meta — np. „Garnizon: 2"
(`.cl-meta`). Stan pusty: „Brak miast w imperium — załóż pierwsze miasto na mapie."

### 4.2 Panel Armie (`armyListHud.ts`) — najbogatszy z obu, priorytet dla mockupu

Per wiersz armii/stosu: nazwa, heks + liczba jednostek w stosie, **cztery możliwe plakietki stanu**
(wzajemnie wykluczające się — pokaż WSZYSTKIE cztery warianty w osobnych wierszach mockupu):
„w garnizonie", „ufortyfikowana w polu", „uśpiona" (sentry), „auto-eksploracja". Dwa paski danych
z etykietą i wartością liczbową obok (nie tylko pasek — liczba typu „14/20" jest dziś obok paska):
**pasek Zdrowia** (kolor interpolowany czerwień→zieleń wg %, `hue = pct × 1.2` w HSL) i **pasek
Ruchu** (niebieski gradient). Wiersz podświetlony na zielono gdy zaznaczony na mapie (`.al-item.on`).
Stan pusty: „Brak jednostek na mapie — zrekrutuj wojsko w mieście."

**Pokaż w mockupie minimum:** 1 wiersz pusty (dla obu), 3-4 wiersze miast/armii z różnymi
kombinacjami danych (miasto z pełną kolejką vs pustą; armia zdrowa vs ranna vs w garnizonie vs
uśpiona), żeby było widać jak system się skaluje, nie tylko pojedynczy „ładny" przypadek.

---

## 5. Wzorzec do naśladowania — sekcja Moc panelu imperium

Tak jak w zleceniu 11-zakładek: **sekcja Moc panelu imperium** (`empireDetailPanel.ts`, ~linie
1328–1390) to jedyny fragment gry z realnym, zamierzonym stylem tej rodziny 1E — duża liczba
„hero" na start, boxy podsumowania, tabela z wyróżnioną kolumną, akcent złoty konsekwentnie użyty.
Zobacz ją w grze (`?playtest=mapa`, klik „Moc" na górnym pasku) albo w mockupie
`docs/ux/claude-design/.../mockupy/The Game - Panel Moc imperium v3 (1E).dc.html` (format bundlera,
otwórz w przeglądarce, nie w edytorze tekstu — patrz §5 zlecenia 11-zakładek dla wyjaśnienia
formatu). **Do tej wiadomości dołączony jest też bezpośredni zrzut ekranu z żywej gry** (nie
mockup) jako dodatkowy, wygodniejszy punkt odniesienia — pokazuje dokładnie tę hierarchię
wizualną: „Moc 181" jako hero, dwa boxy (Miasta/Rekruci), tabelę 5-kolumnową z paskami % i
wyróżnioną kolumną PKT, oraz zakładki rankingu na dole. Nie chodzi o kopiowanie layoutu 1:1 do
paneli Miasta/Armie (Moc jest tabelą podsumowującą, te panele to listy kart) — chodzi o ten sam
poziom dopracowania.

**Zastosowanie do tych dwóch paneli:** nie chodzi o kopiowanie layoutu 1:1 (Moc jest tabelą
podsumowującą, te panele to listy przewijalne kart) — chodzi o ten sam **poziom dopracowania**:
wyraźna hierarchia (nazwa miasta/armii jako „najważniejsza" rzecz w wierszu, reszta drugorzędna),
konsekwentny akcent złoty na kluczowych liczbach, karty z realną „wagą" (cień, obramowanie,
niewielkie tło różne od reszty panelu) zamiast płaskich wierszy tekstu.

---

## 6. Poza zakresem

- **Panel imperium (prawy, 11 zakładek)** — osobne, już trwające zlecenie (`11-ZAKLADEK-PANEL-IMPERIUM-2026-08-13`), nie duplikuj pracy.
- **Menu pauzy** (`gamePauseMenu.ts`) — już dopracowane, patrz §3.
- **Pasek medalionów ikon** (`mapToolbarHud.ts`) — osobny system tokenów (`--tg-*`), nie w zakresie; pokaż go w mockupie tylko jako kontekst obok otwartego panelu.
- **Logika/dane** — oba pliki mają już bogatą, działającą logikę (plakietki stanu armii, paski, filtr pustych stanów) — to NIE zmienia się, tylko wygląd. Nie proponuj nowych pól danych ani zmian w treści komunikatów bez wyraźnego zaznaczenia w handoffie.

---

## 7. Deliverables i format oddania

Ta sama konwencja co poprzednie zlecenia (`docs/ux/DESIGN-GITHUB-HASLA.md`):

| # | Plik | Opis |
|---|------|------|
| 1 | `The Game - Panel Miasta i Armie v1 {DATA} (1E).dc.html` | Mockup — minimum: Miasta puste + Miasta z 3-4 wierszami, Armie puste + Armie z 3-4 wierszami pokazującymi wszystkie 4 plakietki stanu (§4.2) |
| 2 | `DESIGN-do-UI_MIASTA-ARMIE-PANEL-LEWY-{DATA}.md` | Handoff: mapowanie region mockupu → klasa CSS/plik kodu, decyzja paleta (potwierdzenie 3b albo uzasadniona alternatywa, §3) |
| 3 | `MANIFEST.txt` | Lista plików |
| 4 | ZIP | `MIASTA-ARMIE-PANEL-LEWY-{DATA}.zip` |

**Kolejność pracy:** jak poprzednio — zacznij od panelu Armie (bogatszy funkcjonalnie, więcej
przypadków do rozwiązania), pokaż do przeglądu, poczekaj na potwierdzenie przed dopracowaniem
panelu Miasta (prostszy, prawdopodobnie odziedziczy te same decyzje wizualne).

**Po stronie integratora (nie Designera):** port CSS/markupu do `cityListHud.ts`/`armyListHud.ts`,
zamiana emoji 🏛️/👥 na SVG z brandu w `cityListHud.ts`, rebuild ROBOCZA.

---

## 8. DoD checklist

- [ ] Oba panele pokryte (Miasta, Armie), stan pusty i z danymi dla obu
- [ ] Paleta spójna z panelem imperium 3b (`#d9a441` itd.) — chyba że handoff jawnie uzasadnia inaczej
- [ ] Zero emoji (zamiennik SVG dla 🏛️/👥 w Miastach)
- [ ] Wszystkie 4 plakietki stanu armii (garnizon/ufortyfikowana/uśpiona/auto-eksploracja) pokazane w mockupie
- [ ] Paski Zdrowie/Ruch (z liczbą obok, nie tylko wizualnie) zachowane i wystylowane, nie usunięte
- [ ] Menu pauzy i pasek medalionów NIE przerysowane (poza zakresem, §6)
- [ ] `DESIGN-do-UI` + `MANIFEST.txt` + ZIP, zgodnie z konwencją nazewnictwa repo

**Po gotowości pierwszej klatki (Armie):** „Klatka Armie gotowa do przeglądu — MIASTA-ARMIE-PANEL-LEWY".
