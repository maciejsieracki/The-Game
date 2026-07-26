# DO DESIGN — modal wyboru „Co wybierasz?" (miasto + wojsko na jednym heksie)

**Kontekst (Maciej, zrzut ekranu 2026-07-25):** modal pojawiający się po kliknięciu heksu,
na którym jest jednocześnie **własne miasto** i **własne wojsko**. Nagłówek „CO WYBIERASZ?",
podtytuł „Na tym heksie jest miasto i wojsko", dwa kafle: „Miasto / Ateny" (ikona budynku,
złoty tekst) i „Jednostka / Zwiadowca / Zaznacz i rozkazuj" (ikona skrzyżowanych mieczy,
niebieski tekst), na dole „Anuluj (Esc)". Maciej: *„to menu też jest do poprawy w designerze."*

**⚠️ To NIE jest nowy problem — to jest niezrealizowane zlecenie sprzed 3 tygodni.**
Dokładnie ten sam modal, z dokładnie tymi samymi wadami (emoji, niebieski label), był już
zlecony Designowi 2026-07-05: `docs/ux/DESIGN-ZLECENIE-A21-CITY-UNIT-PICK-2026-07-05.md`
(ID `A21-CITY-UNIT-PICK-2026-07-05`, priorytet P1). Zlecenie **nigdy nie zostało dostarczone**
— brak w repo jakiegokolwiek pliku `.dc.html`, ZIP-a, `DESIGN-do-UI_A21.md` czy meldunku.
Kod od tamtej pory się nie zmienił wizualnie (jedyna zmiana: treść hinta stosu, patrz §2).
**Ta paczka zastępuje i unieważnia A21-CITY-UNIT-PICK-2026-07-05** — poniżej pełna,
zaktualizowana specyfikacja pod AKTUALNY (nie sprzed 3 tygodni) język wizualny.

---

## 1. Gdzie w kodzie / jak jest zbudowany

| | |
|---|---|
| **Plik komponentu** | `gra/src/ui/cityUnitPick.ts` (182 linie, samodzielny moduł) |
| **Wpięcie (call site)** | `gra/src/main.ts`, ok. linii 11045–11060, w obsłudze kliku miasta |
| **System budowy** | Brak frameworka — czysty DOM (`document.createElement`) + **inline `<style>` wstrzykiwany raz do `<head>`** (`ensureStyles()`, `STYLE_ID = 'civ-city-unit-pick-css'`). To NIE są klasy z globalnego arkusza tokenów, tylko lokalny blok CSS z własnymi zmiennymi (`--gold`, `--gold-dim`, `--muted`, `--text` zdefiniowane od nowa w `.civ-cup`, nie importowane z `UI/design-tokens-brand-v1.css`) |
| **Ikony** | Surowe **emoji Unicode** wpisane w `innerHTML`: `\u{1F3DB}` (🏛, miasto) i `⚔` (⚔, jednostka) — nie SVG, nie `brandIconSvg()` |
| **Animacja** | `@keyframes cup-in` — scale+fade 0.2–0.24s, jedyny ruch w komponencie |
| **Klawiatura** | Esc = anuluj, `1` = miasto, `2` = jednostka (już działa, zachować) |

### Warunek pokazywania (dokładnie, z kodu)

Modal wywołuje się **tylko w jednej sytuacji** — nie ma innych wariantów wyzwalacza:

1. Gracz klika heks z miastem.
2. `resolveEnemyCityClick()` (`gra/src/map/map-attack-city.ts`) klasyfikuje klik. Modal
   pokazuje się wyłącznie gdy wynik to `{ kind: 'not_enemy' }`, czyli **`city.ownerId === playerOwnerId`
   (0) — to zawsze WŁASNE miasto gracza.** Klik na miasto wroga idzie zupełnie inną ścieżką
   (oblężenie / szturm / podpowiedzi — osobne komponenty: `siegeMapPanel.ts`, `cityAttackChoice.ts`,
   `showHintMessage`) i nigdy nie trafia do tego modalu.
3. Dodatkowo na tym samym heksie musi stać ≥1 **własna** jednostka gracza spoza garnizonu
   (`visibleStackOnHex(units, q, r, ownerId=0)`, filtr `ownerId===0 && inGarnizon!==true`).
4. Jeśli warunki 2+3 spełnione → `showCityUnitPick()`. W przeciwnym razie (miasto bez wojska
   na heksie) klik po prostu otwiera panel miasta wprost — bez modalu.

**Wniosek:** modal NIE ma wariantu „obce miasto", „wroga jednostka" ani „wiele miast" —
to zawsze ten sam układ: 1 miasto gracza + 1 reprezentant stosu jednostek gracza.

## 2. Warianty treści (jedyna zmienność, którą ma dostać makieta)

| Pole | Źródło | Zmienność |
|---|---|---|
| `cityName` | `clickedCity.name` | dowolna nazwa miasta gracza |
| `unitLabel` | `rep.typeId` — **reprezentant stosu** (najsilniejsza jednostka wg ataku, `unitAtRepresentative()`) | nazwa typu jednostki, np. „Zwiadowca", „Hoplita" |
| opis pod jednostką | `opts.stackCount` | **jedyna realna gałąź treści:** `stackCount > 1` → `formatArmiaLabel(n)` z `gra/src/ui/formatPl.ts`, czyli **„Armia — 2 jednostki"** (odmiana 1/2–4/5+); `stackCount ≤ 1` lub brak → stały tekst **„Zaznacz i rozkazuj"** |

Uwaga do makiety: stara treść ze zlecenia 07-05 zakładała hint „Stos ×3" — **to już nieaktualne**,
kod od tamtej pory zmienił treść na „Armia — N jednostek" (bez zmiany stylu wizualnego). Makieta
ma pokazywać **aktualną** treść.

Brak w danych: modal dziś **nie pokazuje** populacji miasta ani HP jednostki — patrz pytanie
otwarte w §5.

## 3. Czym ten modal odstaje od aktualnego języka wizualnego gry

Punkt odniesienia: `UI/design-tokens-brand-v1.css` (tokeny 1B/2C/4C/5C/6C) + świeżo zrestylowany
**sąsiedni modal tego samego typu** `gra/src/ui/cityAttackChoice.ts` (KANON v1.1, 2026-07-23 —
dokładnie ta sama sytuacja użytkowa: klik heksu → wybór akcji z 2 kafelkami) + wytyczne
`docs/ux/claude-design/DO-DESIGN-2026-07-23/WYTYCZNE-DESIGN-POLE-BITWY-v5.md` (HUD TW-v5,
medaliony, karty rosteru).

| Cecha | `cityUnitPick.ts` (dziś) | Aktualny standard gry |
|---|---|---|
| **Ikony** | Emoji Unicode 🏛 / ⚔ wpisane w HTML | **Zero emoji** — inline SVG złote (`brandIconSvg()`), reguła powtórzona w każdym nowszym zleceniu Design. Gra ma już gotowe ikony do zapożyczenia: `tb-cities.svg` / `tier2/tb-cities-24.svg` (ikona „miasta" w top-barze) i `tb-army.svg` / `tier2/tb-army-24.svg` (ikona „armii"); jednostka ma nawet mapowanie **per typ**: `unit-icon-map.json` → `"zwiadowca": "unit-scout"`, czyli plik `units/unit-scout.svg` już istnieje i pasuje 1:1 do treści ze zrzutu |
| **Kolor labelu kafla „Jednostka"** | `#a8d4ff` (niebieski) | Jeden akcent — złoto (`--civ-gold-primary: #e8d88a`) na oba kafle. Niebieski w tym systemie jest zarezerwowany semantycznie (np. „Ty" w bitwie = `#3a6ad0`/`#8fb6e0`, nauka = `#5a9bd4`) — użycie go tu jako zwykłego akcentu UI koliduje z tą semantyką |
| **Panel / tło** | Płaski gradient `linear-gradient(165deg, rgba(14,20,36,.98), rgba(8,12,24,.99))`, prosta ramka 1px, cień, brak blura panelu (tylko `backdrop-filter` na overlayu) | Sąsiedni modal `cityAttackChoice.ts` ma bogatszy panel: `backdrop-filter: blur(8px)` NA PANELU, `border: 2px solid`, `inset 0 1px 0 rgba(232,216,138,.12)` (górny highlight), nagłówek z osobnym kickerem (mała etykieta nad tytułem) + gradientowym tłem sekcji |
| **Typografia tytułu** | 10px Georgia, uppercase — najmniejszy z rozmiarów w grze | Sąsiedni modal: tytuł 20px Georgia. Tytuł `cityUnitPick` wygląda jak podpis, nie jak nagłówek decyzji |
| **Zaokrąglenia / odstępy** | panel `border-radius:12px`, kafle `10px`, gap `8px` — spójne z resztą, **to akurat OK** | — |
| **Stan hover** | jest (`border-color` + lekkie tło + `translateY(-1px)`), ale **osobny hover dla kafla „unit"** wprowadza drugi akcent koloru (niebieski) zamiast tylko wzmacniać złoto | Ujednolicić: hover = wzmocnienie złotej ramki, identyczne dla obu kafli |
| **Stan focus (klawiatura)** | **Brak jakiegokolwiek `:focus`/`:focus-visible` stylu** — mimo że modal ma skróty klawiszowe (1/2/Esc), nie widać wizualnie który element ma fokus | 15 innych plików w `gra/src/ui/` ma `focus-visible`/`aria-label`/`role="dialog"` (np. `cityPanel.ts`, `diplomacyNegotiationModal.ts`, `saveLoadDialog.ts`, `gamePauseMenu.ts`). `cityUnitPick.ts` też ma zero `aria-*` i zero `role` — poza tym zestawem |
| **Przycisk „Anuluj"** | Wąski outline, szary tekst, brak wyraźnego stanu hover poza zmianą koloru tekstu | Spójne z resztą (drobna sprawa) — utrzymać, ewentualnie dociągnąć do `.civ-btn-outline` z tokenów |
| **Medalion / karta jednostki** | Brak — tylko ikona + 2 linie tekstu | Nowy standard kart (roster bitwy, TW-v5): ikona + pasek(i) statystyk pod spodem. Modal nie musi kopiować kart bitewnych 1:1, ale dziś nie pokazuje żadnej dodatkowej informacji o tym, między czym gracz wybiera (patrz §5) |

**Podsumowanie:** modal jest wizualnie z innej epoki niż reszta gry — dosłownie sprzed
wdrożenia obowiązującego dziś zestawu tokenów i ikon brandowych. Jego najbliższy sąsiad
funkcjonalny (`cityAttackChoice.ts`, ten sam typ decyzji „klik heksu → wybierz z 2 opcji")
już przeszedł restyling w lipcu i może służyć za wzorzec layoutu — nie trzeba projektować
od zera.

## 4. Zakres zlecenia — co ma dostarczyć Designer

### Deliverable główny
Makieta modalu w aktualnym języku wizualnym (wzorzec: `cityAttackChoice.ts` / KANON v1.1 —
ten sam gradient panelu, blur, typografia kickera+tytułu), **zero emoji**, jeden akcent złoty.

**Układ do zachowania (treść z kodu, nie zmieniać struktury pól):**
```
┌─────────────────────────────────────────┐
│              CO WYBIERASZ?               │
│    Na tym heksie jest miasto i wojsko    │
├──────────────────┬───────────────────────┤
│   [SVG miasto]    │   [SVG jednostka]    │
│      Miasto       │      Jednostka       │
│    {cityName}      │    {unitLabel}       │
│                    │  Zaznacz i rozkazuj  │
│                    │  (lub Armia — N jedn.)│
├──────────────────┴───────────────────────┤
│              Anuluj (Esc)                │
└─────────────────────────────────────────┘
```

### Stany do pokazania (min. 3, jak w oryginalnym zleceniu A21 — nadal aktualne)
1. **Domyślny** — pojedyncza jednostka, hint „Zaznacz i rozkazuj".
2. **Armia ×N** — pod typem jednostki tekst „Armia — 3 jednostki" (gdy `stackCount > 1`,
   patrz odmiana w §2 — 1/2–4/5+ ma różną formę słowną, warto pokazać 2 przykłady liczb).
3. **Hover** — kafelek Miasto ORAZ kafelek Jednostka osobno, oba z tym samym (złotym) traktowaniem.
4. **Focus (klawiatura)** — dodatkowy stan, którego dziś nie ma wcale: widoczna obwódka/ring
   gdy element ma fokus z klawiatury (Tab), zgodnie z resztą UI.

### Ikony — do wykorzystania z istniejącego zestawu brand (nie projektować od zera, jeśli pasują)
- Miasto: `tb-cities.svg` / `tier2/tb-cities-24.svg` lub `tier2/tb-cities-40.svg`
  (`gra/src/ui/icons/brand/`) — do oceny, czy pasuje stylistycznie do kafla 300px, czy potrzebna
  wersja dedykowana (większa, inny kadr).
- Jednostka: system już mapuje typ jednostki na ikonę kategorii — `gra/src/ui/icons/brand/unit-icon-map.json`,
  `"zwiadowca": "unit-scout"` → plik `units/unit-scout.svg`. **Ten modal powinien pokazywać ikonę
  KATEGORII faktycznej jednostki** (np. zwiadowca → `unit-scout`, nie uniwersalny miecz), analogicznie
  do tego jak reszta gry już to robi gdzie indziej. Do decyzji: czy dla stosu wielu różnych typów
  pokazywać ikonę reprezentanta (jak dziś tekst) czy generyczną ikonę „armii" (`tb-army.svg`).
- Jeśli żadna istniejąca ikona nie pasuje wizualnie do rozmiaru kafla — zaprojektować nowe,
  zgodnie ze specyfikacją techniczną poniżej (wzorzec: pliki `res-*.svg` w `resources-map/`).

### Treść przykładowa (realna, po polsku — do makiety)
- Miasto: „Ateny" (jak na zrzucie Macieja) lub inna nazwa z gry (np. „Testpolis" z poprzedniego zrzutu).
- Jednostka: „Zwiadowca" (zrzut Macieja) — pokazać też wariant z inną jednostką bojową, np. „Hoplita",
  żeby było widać dłuższą nazwę.
- Stos: „Armia — 2 jednostki" i „Armia — 5 jednostek" (dwie różne formy odmiany).

## 5. Pytania UX otwarte — do decyzji Macieja, NIE zakładać

**[TEMAT: Modal wyboru heksa — zakres informacji na kaflach]**

Dziś kafle pokazują wyłącznie nazwę (miasto) i typ (jednostka) — żadnych liczb. Dane
techniczne na to pozwalają, ale nie są dziś wpięte do tego modalu:
- `City.population` istnieje (`gra/src/game/cities.ts`) — populację miasta dałoby się pokazać.
- `RuntimeUnit.hp` istnieje (opcjonalne, undefined = pełne HP) — HP reprezentanta dałoby się pokazać.

**Opcje:**
- **A — zostaw jak jest** (tylko nazwa/typ). Za: zero dodatkowej pracy kodowej, modal ma
  ułamek sekundy na decyzję, więcej danych może przeciążyć. Przeciw: gracz z dwoma miastami
  o tej samej nazwie startowej lub kilkoma stosami tego samego typu nie ma jak odróżnić „które".
- **B — dodać 1 liczbę na kafel** (populacja miasta / HP-procent reprezentanta jednostki).
  Za: realna pomoc decyzyjna przy wielu podobnych jednostkach/miastach; dane już istnieją,
  to tylko przekazanie pola przez `CityUnitPickOptions`. Przeciw: wymaga zmiany kontraktu
  (`onCity`/`onUnit` bez zmian, ale `showCityUnitPick()` dostaje 2 nowe pola) — mała, ale
  realna zmiana w `main.ts` poza zakresem Designu.
- **C — pełna karta jak w rosterze bitwy** (pasek HP + ikona kategorii + badge liczby jednostek
  w stosie). Za: pełna spójność z nowym stylem kart (TW-v5). Przeciw: nieproporcjonalnie dużo
  jak na modal, który ma się pojawiać i znikać w ułamku sekundy przy zwykłym kliku mapy.

**Rekomendacja: B** — jedna dodatkowa liczba na kafel, bez pełnej karty bitewnej; wystarczy do
odróżnienia, nie przeciąża prostego kliku. **[ZAŁOŻENIE — do potwierdzenia przez Macieja]**

Druga kwestia otwarta: **czy nowa ikona miasta ma być tożsama z `tb-cities.svg` (spójność z
top-barem), czy dedykowana** (bo top-barowa jest projektowana pod mały rozmiar 24/40px, a tu
kafel ma dużo więcej miejsca). Do oceny przez Designera przy pracy nad makietą.

## 6. Specyfikacja techniczna (tokeny — dokładnie te, z `UI/design-tokens-brand-v1.css`)

| Token | Wartość |
|---|---|
| Złoto primary | `#e8d88a` (`--civ-gold-primary`) |
| Złoto dim | `#a08030` (`--civ-gold-dim`) — **nie** `#c9a84c` używany dziś lokalnie w `cityUnitPick.ts`, ujednolicić |
| Obwódka złota | `rgba(232, 216, 138, 0.22)` zwykła / `0.45` mocna |
| Tekst główny | `#e8e0c8` |
| Tekst wyciszony | `#8a8070` |
| Tytuły | Georgia / Times New Roman, serif |
| UI / body | Segoe UI, Tahoma, sans-serif |
| Panel gradient | `linear-gradient(180deg, rgba(14,18,28,.98), rgba(8,10,16,.95))` (token) — w praktyce sąsiedni modal `cityAttackChoice.ts` używa wariantu z bardziej przezroczystym panelem + `backdrop-filter: blur(8px)`; do makiety wzorować się na `cityAttackChoice.ts`, nie na starym tokenie 1:1 |
| Promień panelu | `8px` (token) / `12–14px` w praktyce modali mapy — zachować obecne `12px` z `cityUnitPick.ts`, jest spójne z resztą modali mapy |
| Cień panelu | `0 12px 40px rgba(0,0,0,.65)` |

**Wzorzec layoutu i interakcji do naśladowania 1:1:** `gra/src/ui/cityAttackChoice.ts`
(kicker nad tytułem, hover kafli, przejścia `.15s`/`.12s`). To jest AKTUALNY wzorzec —
zastępuje odniesienie „C-04/C-05/A-18" ze starego zlecenia z 07-05, które też warto obejrzeć
jako dodatkowy kontekst, ale priorytet ma świeższy `cityAttackChoice.ts`.

## 7. Konwencja dostawy

Zgodnie z formatem poprzednich zleceń w `dyspozycje/` (np. `POLECENIE-DESIGN-IKONY-SUROWCE-MIEJSKIE.md`):

- **Format pliku makiety:** `.dc.html` (jak dotychczasowe makiety Design) lub inny uzgodniony
  format — 1 plik ze wszystkimi stanami z §4 (domyślny / armia ×N / hover / focus).
- **Lokalizacja SVG (jeśli nowe ikony):** `gra/src/ui/icons/brand/` — zachować konwencję
  nazewnictwa z istniejących plików (np. `res-*.svg`, `unit-*.svg`, `tb-*.svg`).
- **Po dostarczeniu (robi integrator, NIE Design):** podmiana `innerHTML` z emoji na SVG w
  `cityUnitPick.ts`, usunięcie `.civ-cup-act.unit .civ-cup-act-lbl { color: #a8d4ff }`,
  dodanie `:focus-visible`, ewentualne dopięcie pól population/HP jeśli Maciej wybierze
  wariant B/C z §5. Kontrakt `CityUnitPickOptions`/`showCityUnitPick()` API zmienia się TYLKO
  jeśli zapadnie decyzja B/C — wariant A (bez zmian danych) nie wymaga zmian w `main.ts`.

### Checklist Design (DoD)
- [ ] Makieta ze wszystkimi 4 stanami (domyślny / armia ×N — min. 2 przykłady liczb / hover / focus)
- [ ] Zero emoji — SVG złote (istniejące `tb-cities`/`unit-scout` albo nowe w tym samym stylu)
- [ ] Oba kafle — jeden akcent złoty, bez niebieskiego labelu
- [ ] Tytuł podniesiony wizualnie (nie najmniejszy tekst w panelu)
- [ ] Panel z blurem + highlightem górnej krawędzi, zgodnie z `cityAttackChoice.ts`
- [ ] Stan `:focus-visible` zaprojektowany (obecnie nie istnieje wcale)
- [ ] Odpowiedź/decyzja Macieja ws. §5 (populacja/HP na kaflach) uwzględniona w finalnej makiecie

---

## Pytania do Macieja

1. **§5 — zakres informacji na kaflach:** A (zostaw jak jest) / **B (Rekomendacja: dodać 1 liczbę
   — populacja miasta, % HP jednostki)** / C (pełna karta w stylu rosteru bitwy)?
2. Ikona miasta: reużyć `tb-cities.svg` (spójność z top-barem, szybciej) czy zlecić dedykowaną
   pod większy kafel modalu?
3. Format dostawy makiety: `.dc.html` jak dotychczas, czy inny (np. Figma link), skoro paczka
   `A21` z 07-05 nigdy nie została dostarczona w tamtym formacie — czy coś w procesie dostawy
   blokowało?
