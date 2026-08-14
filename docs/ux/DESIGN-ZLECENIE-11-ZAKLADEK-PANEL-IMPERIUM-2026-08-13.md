# ZLECENIE Design — 11 zakładek panelu imperium (reskin do kanonu 1E)

**Od:** Lane UI / Maciej
**Do:** Designer zewnętrzny (dostęp do GitHuba, czyta kod)
**Data:** 2026-08-13
**ZLECENIE-ID:** `11-ZAKLADEK-PANEL-IMPERIUM-2026-08-13`
**Priorytet:** P1 — brak reskinu, gra grywalna, ale wygląd niespójny z resztą HUD
**Kontekst decyzji:** `dyspozycje/PYTANIA-OTWARTE.md`, grep `R-DESIGN-11-ZAKLADEK` (ABC właściciela, decyzja Q1=A/Q2=B, zatwierdzona lista zawartości Miasto/Obywatele, notatka o samodzielnej próbie reskinu Skarbca przez orkiestratora — wynikowa zmiana wizualna okazała się zbyt mała, żeby stanowić realny redesign, stąd pivot na to zlecenie dla człowieka)

---

## 0. Cel (1 zdanie)

Jedenaście zakładek panelu bocznego imperium (Skarbiec, Praca, Spichlerz, Nauka, Surowce, Handel,
Armia, Miasto, Obywatele, Kultura, Religia) nigdy nie dostały właściwego reskinu — mają wyglądać
tak, jak wygląda już wdrożona sekcja **Moc**, jedyny fragment tego panelu, który naprawdę
reprezentuje kanon projektowy gry.

---

## 1. Gdzie to żyje w kodzie (WAŻNE — przeczytaj przed czymkolwiek innym)

**Jeden plik, prawie wszystko:** [`gra/src/ui/empireDetailPanel.ts`](https://github.com/maciejsieracki/The-Game/blob/main/gra/src/ui/empireDetailPanel.ts)
(1655 linii). To panel boczny (slide-in z prawej, `min(404px, 94vw)`) otwierany kliknięciem
chipów górnego paska HUD mapy świata. Renderuje się jako string HTML wstrzykiwany przez
`innerHTML` — CSS jest wstrzykiwany raz, w `<style>` przez funkcję `ensureStyles()` (linie
235–443 tego samego pliku), klasy `civ-emp-*`.

**Mapowanie chip HUD → sekcja panelu:** [`gra/src/ui/empirePanelSectionMap.ts`](https://github.com/maciejsieracki/The-Game/blob/main/gra/src/ui/empirePanelSectionMap.ts)
(82 linie), funkcja `empireSectionFromHudAct`:

| Chip HUD (`data-act`) | Sekcja panelu | Blok top-level (`empirePanelBlockForSection`) |
|---|---|---|
| `skarbiec` | `econ-skarbiec` | `ekonomia` (filtrowany wiersz) |
| `praca` | `econ-praca` | `ekonomia` (filtrowany wiersz) |
| `nauka` | `econ-nauka` | `ekonomia` (filtrowany wiersz) |
| `zywnosc` / `spichlerz` | `spichlerz` | `spichlerz` (osobny blok) |
| `surowce` | `surowce` | `surowce` (osobny blok) |
| `handel` | `handel` | `handel` (osobny blok) |
| `armia` | `armia` | `armia` (osobny blok) |
| `kultura` | `kultura` | `kultura` (osobny blok) |
| `religia` | `econ-religia` | `ekonomia` (filtrowany wiersz — **brak dedykowanego bloku**, patrz §2.9) |
| `miasta` / `ludnosc` | `econ-miasta` | `ekonomia` (filtrowany wiersz — **Miasto i Obywatele dzielą tę samą sekcję dziś**, patrz §2.10–2.11) |
| `power` / `moc` | `moc` | `moc` — **już zreskinowany, wzorzec do naśladowania** |

**Ta struktura ma znaczenie dla reskinu:** trzy sekcje (Spichlerz, Surowce, Handel — plus Moc i
Armia i Kultura) mają **własny, odizolowany blok top-level** w `render()` — łatwo je stylować
osobno. Skarbiec, Praca, Nauka, Religia, Miasto/Obywatele **nie mają własnego bloku** — są
wierszami wewnątrz jednej wspólnej sekcji „ZASOBY IMPERIUM" (`zasoby`, `data-section="ekonomia"`),
filtrowanymi przez `onlyEconId`. To ograniczenie architektoniczne (nie tylko wizualne) — reskin
Skarbca/Pracy/Nauki dzieje się dziś wewnątrz tego samego kontenera co reszta „Zasobów imperium".
Jeśli docelowy wygląd wymaga, żeby np. Skarbiec miał **własny, w pełni odizolowany layout** (tak
jak Moc), to jest to zmiana struktury kodu, nie tylko CSS — **zgłoś to wprost w handoffie do
integratora**, nie zakładaj że wystarczą nowe klasy CSS na istniejącym markupie.

---

## 2. Wzorzec, który już wygląda jak kanon — sekcja MOC

**Kod:** `render()` w `empireDetailPanel.ts`, linie ~1328–1390 (blok `moc`).
**Komentarz w nagłówku pliku:** *„Wygląd: mockup «Panel Moc imperium v3» (1E, 2026-07-06) —
RESKIN, nic nie usunięte."*

To **jedyny fragment tego panelu z realnym, zamierzonym stylem wizualnym**. Wszystko inne w tym
pliku jest surowe — generyczne tabelki `civ-emp-mini`/`civ-emp-zrow` bez akcentu, bez hierarchii,
bez dużego „hero number" na start sekcji. Struktura sekcji Moc, do naśladowania koncepcyjnie:

1. Duża liczba na górze: **„Moc {N}"**, złota, 20px, pogrubiona (`civ-emp-moc-big`).
2. Podpis pod nią: skąd się bierze suma (`civ-emp-moc-sub`).
3. Dwa boxy 2×1 (`civ-emp-two` / `civ-emp-box`): skrót Miast i Rekrutów.
4. Tabela 5-kolumnowa z paskami udziału % (`civ-emp-tbl`, `civ-emp-tbl-h`, `civ-emp-tbl-r`):
   SKŁADNIK · ILOŚĆ · × WSP. · = PKT · % — kolumna „PKT" wyróżniona złotym kolorem i pogrubieniem.
5. Przełącznik trybu widoku (`civ-emp-mocview`, przyciski `civ-emp-mocview-btn`, stan `.active`
   podświetlony złotym tłem `rgba(217,164,65,.16)`).
6. Ranking cywilizacji (`civ-emp-rank`), wiersz gracza wyróżniony (`civ-emp-rank .you`, złoty,
   pogrubiony, ze strzałką `▸`).
7. Callout Respekt (`civ-emp-resp`) — box z zaokrąglonymi rogami, tło `#1c2431`.

**Jeśli chcesz zobaczyć to naprawdę, nie tylko przeczytać** — otwórz
`docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/mockupy/The Game - Panel Moc imperium v3 (1E).dc.html`
**bezpośrednio w przeglądarce** (zobacz §5 — ten konkretny plik jest w formacie bundlera, nieczytelnym jako
zwykły tekst) albo uruchom grę (§4) i kliknij chip **Moc** na górnym pasku HUD.

---

## ⚠️ 3. Rozbieżność palety — przeczytaj PRZED rysowaniem czegokolwiek

W repozytorium **istnieją dwie różne, niezgodne ze sobą wersje palety kolorów** dla tego samego
systemu 1E. Zweryfikowane bezpośrednio w plikach, nie z pamięci:

### 3a. „Zamrożony" kanon oficjalny (`tokens.css` / `tokens.json` + wszystkie mockupy `.dc.html`)

Plik: `docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/eksport/tokens.css`
(nagłówek: *„❄ FROZEN v1.0 · 2026-07-01 · decyzje 1B–8A zamknięte. NIE zmieniać wartości bez
nowej dyspozycji"*).

| Token | Wartość | Rola |
|---|---|---|
| `--tg-bg-deep` | `#080a12` | tło pełnych ekranów |
| `--tg-gold-primary` | `#e8d88a` | tytuły, ranty, akcenty (JASNE złoto) |
| `--tg-gold-dim` | `#a08030` | ornamenty, ramki drugorzędne |
| `--tg-text-primary` | `#e8e0c8` | tekst „pergaminowy" |
| `--tg-text-muted` | `#8a8070` | podtytuły, stopki |
| `--tg-panel-bg` | `#121820` | tło paneli |
| `--tg-science-blue` | `#5a9bd4` | nauka, linki info |
| `--tg-green` | `#50b070` | sukces, przyrost |
| `--tg-red` | `#c84040` | wojna, alert |
| `--tg-orange` | `#d08030` | ostrzeżenia |
| Czcionka nagłówków | `Georgia, 'Times New Roman', serif` | tytuły, nazwy |
| Czcionka UI | `'Segoe UI', Tahoma, sans-serif` | liczby, przyciski, treść |
| Border panelu | `2px solid rgba(232,216,138,.45)` | ramka złota |
| Promień rogów panelu | `12px` (niektóre mockupy używają `14px`) | |

Policzone bezpośrednio: w mockupie `The Game - Design System v1 (1E).dc.html` `#e8d88a` (jasne
złoto) pojawia się **74 razy**, w mockupie `The Game - Panel boczny Badania v1 (1E).dc.html` —
**23 razy**; oba pliki w ogóle nie zawierają `#d9a441`. Ten sam wzorzec (`#e8d88a`, `#080a12`,
Georgia dla nagłówków, ramka 2px, róg 12–14px) widać też w czytelnym mockupie
`The Game - Miasto Zakladki W3 6klatek (1E).dc.html` (patrz §7).

### 3b. Paleta faktycznie wdrożona w kodzie (sekcja Moc, `empireDetailPanel.ts`)

Ta sama sekcja, opisana przez właściciela jako *„jedyna, która naprawdę wygląda jak kanon"*,
**nie używa tokenów z 3a**. Zweryfikowane wprost w `ensureStyles()`:

| Rola | Wartość faktyczna w kodzie | Odpowiednik z 3a |
|---|---|---|
| Tło panelu | `#141a24` | `#080a12` / `#121820` |
| Tło kart/boxów | `#171e2a` | — (brak odpowiednika w 3a) |
| Obramowanie | `1px solid #2b3543` | `2px solid rgba(232,216,138,.45)` |
| Akcent złoty | **`#d9a441`** (przygaszone, bardziej brązowe złoto) | `#e8d88a` (jasne, żółte złoto) |
| Tekst główny | `#e8ebf0` (chłodna biel/szarość) | `#e8e0c8` (ciepły „pergamin") |
| Tekst wyciszony | `#7d8798` | `#8a8070` |
| Zielony (dodatnie) | `#78c95a` | `#50b070` |
| Czerwony (ujemne/alert) | `#e07a7a` | `#c84040` |
| Niebieski (info/nauka) | `#8ec5ff` | `#5a9bd4` |
| Czcionka | **wyłącznie** `'Segoe UI', system-ui, sans-serif` (13px/1.45) — **brak Georgii w ogóle** w tym pliku | Georgia (nagłówki) + Segoe UI (treść) |
| Promień rogów | `7–8px` (karty/boxy — `.civ-emp-chip`/`.civ-emp-box`/`.civ-emp-res-card` mają `8px`, `.civ-emp-mini`/`.civ-emp-colfilter` mają `7px`; `9px` nigdzie nie występuje), panel bez zaokrąglenia (przyklejony do prawej krawędzi ekranu) | `12–14px` |

**Rekomendacja dla tego zlecenia:** traktuj **paletę 3b (faktycznie wdrożoną) jako praktyczny,
wiążący cel** dla reskinu tych 11 zakładek — to ta wersja została uznana przez właściciela za
gotową i to z nią te zakładki muszą być spójne wizualnie (siedzą w TYM SAMYM oknie panelu, bez
przerwy w scrollu). Traktuj `tokens.css`/mockupy (3a) jako **dokumentację długoterminowego
zamiaru systemu**, nie jako coś do dosłownego wdrożenia teraz obok 3b — dwie różne złote w jednym
oknie panelu wyglądałyby gorzej niż dzisiejszy brak stylu. Jeśli uważasz, że powinno być
odwrotnie (dogonić 3a, a Moc dostosować wstecznie) — **napisz to wprost w handoffie zamiast
cichej decyzji**, to zmienia zakres dużo szerzej niż tych 11 zakładek.

---

## 4. Jak zobaczyć dzisiejszy stan w grze

```bash
cd gra
node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir
```

**NIGDY** `npm run build` ani `npm run dev` w `gra/` — `prebuild`/`predev` uruchamia
`tools/export-data.py`, który nadpisuje ręcznie edytowane pliki JSON w `gra/data/` (to nie ma
znaczenia dla samej pracy graficznej, ale zepsuje dane innym, którzy pracują na tym samym
repozytorium równolegle — nie ryzykuj tego).

Po zbudowaniu: otwórz `gra-robocza/START.html` (najświeższy zbudowany bundle w repo, nie trzeba
nawet własnego builda żeby zobaczyć AKTUALNY stan ROBOCZA) → hub playtestów.

**Szybkie wejście bez przechodzenia menu/kreatora** — dopisz do URL-a parametr, który stawia od
razu stan gry z założonym miastem na mapie świata:

```
...?playtest=mapa
```

(zaimplementowane w `gra/src/game/playtestMapaSwiata.ts` — konsumowane przez `gra/src/main.ts`,
funkcja `buildPlaytestMapaSwiata` importowana ~linia 388, wywoływana ~linia 28942).

Stamtąd: kliknij dowolny chip zasobu na górnym pasku HUD (Skarbiec / Praca / Nauka / Żywność /
Surowce / Handel / Armia / Kultura / Religia / Miasta) albo przycisk „Moc" — panel wysuwa się z
prawej. Zamknięcie: ✕ w nagłówku panelu albo klik w tło (backdrop).

---

## 5. Format plików `.dc.html` — dwa różne warianty w repo

W `docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/mockupy/` są pliki `.dc.html` w
**dwóch różnych formatach**, sprawdzonych bezpośrednio:

- **Format „bundler" (nieczytelny jako tekst)** — np. `The Game - Panel Moc imperium v3 (1E).dc.html`.
  Otwarcie w edytorze tekstu pokazuje tylko szkielet strony ładującej („Unpacking...", SVG-miniaturkę
  jako placeholder) — właściwa treść jest spakowana/zakodowana w JS wewnątrz pliku i renderuje się
  dopiero w przeglądarce. **Jedyny sposób obejrzenia:** otwórz plik bezpośrednio w przeglądarce
  (podwójny klik / `file://` / lokalny serwer statyczny), nie próbuj czytać go jako źródła.
- **Format czytelny (zwykły HTML + inline style, wrapper `<x-dc>` + `support.js`)** — np.
  `The Game - Miasto Zakladki W3 6klatek (1E).dc.html`, `The Game - Ekran Miasto W3 v3 (1E).dc.html`,
  `The Game - Komponenty (1E).dc.html`, `The Game - Design System v1 (1E).dc.html`,
  `The Game - Panel boczny Badania v1 (1E).dc.html`. Te da się czytać wprost jako tekst/HTML —
  wykorzystane w tym dokumencie do wyciągnięcia konkretnych wartości hex (§3a, §7).

Dla każdego pliku `.dc.html`, który chcesz wykorzystać jako referencję: **najpierw spróbuj otworzyć
go w przeglądarce** — to działa niezależnie od formatu. Jeśli chcesz też czytać źródło (np. żeby
skopiować wartości CSS), sprawdź pierwsze ~10 linii pliku — obecność `__bundler_loading` / „Unpacking…”
oznacza format bundlera (czytaj tylko w przeglądarce); obecność `<x-dc>` + `support.js` bez tych
napisów oznacza format czytelny wprost.

---

## 6. Wzorzec klas CSS — czym dysponujesz już dziś

Prefiks `civ-emp-*`, wszystko w jednym bloku `<style>` (`ensureStyles()`, `empireDetailPanel.ts`
linie 235–443). Gotowe komponenty do ponownego użycia (nie wymyślaj nowych odpowiedników, chyba że
żaden z nich pasuje):

| Klasa | Rola |
|---|---|
| `.civ-emp-sect` (+ `.sep` = z górną linią-separatorem) | kontener jednej sekcji panelu |
| `.civ-emp-eyebrow` | mała etykieta sekcji, 11px, litery rozstrzelone, kolor wyciszony |
| `.civ-emp-title` | alternatywny nagłówek sekcji, 14px, złoty, pogrubiony (używany przez Handel, Kulturę i Moc — nagłówek rankingu „Ranking {Moc}", linia ~1361 — zamiast eyebrow) |
| `.civ-emp-chip` / `.civ-emp-meta` (grid 2 kol.) | karty klucz-wartość (sekcja Parametry globalne) |
| `.civ-emp-box` / `.civ-emp-two` (grid 2 kol.) | dwie karty podsumowania obok siebie (Moc: Miasta/Rekruci) |
| `.civ-emp-tbl` / `.civ-emp-tbl-h` / `.civ-emp-tbl-r` | tabela 5-kolumnowa z wyróżnioną kolumną PKT (jedyna tabela z „ciężką" stylistyką — używana tylko w Mocy) |
| `.civ-emp-mini` / `.civ-emp-mini-h` / `.civ-emp-mini-r` | generyczna kompaktowa tabela (używana wszędzie indziej — Skarbiec, Praca, Nauka, Spichlerz, Handel, Kultura, Miasta) |
| `.civ-emp-zrow` (+ `.brd` = z linią pod spodem) | wiersz etykieta ↔ wartość (blok „Zasoby imperium") |
| `.civ-emp-bar` / `.fill` / `.warn` / `.low` | pasek postępu z gradientem (zielony/bursztynowy/czerwony) |
| `.civ-emp-res-grid` / `.civ-emp-res-card` | siatka kart surowców (tylko sekcja Surowce) |
| `.civ-emp-note` / `.civ-emp-foot` | tekst pomocniczy / stopka objaśniająca |
| `.civ-emp-resp` | wyróżniony callout-box (Respekt w Mocy) |
| `.civ-emp-mocview` / `.civ-emp-mocview-btn` (+ `.active`) | zakładki-przełączniki wewnątrz sekcji (dziś tylko w Mocy — wzorzec do powielenia, jeśli Miasto/Obywatele mają dostać wewnętrzne pod-zakładki) |
| `.civ-emp-colfilter` / `.civ-emp-colchk` | checkboxy widoczności kolumn nad tabelą Miasta — **to jest już gotowy mechanizm „zaznacz i zobacz sumę"**, patrz §2.10 |

**Konwencja nazewnictwa:** nowe klasy dla elementów specyficznych dla danej zakładki powinny
zachować prefiks `civ-emp-` i sufiks nawiązujący do nazwy sekcji (np. istniejące
`.civ-emp-res-*` dla Surowców, `.civ-emp-moc-*` dla Mocy) — nie wprowadzaj osobnego systemu nazw.

---

## 7. Dodatkowe referencje mockupów (per-miasto, nie per-imperium — ale ta sama rodzina 1E)

Dwa czytelne pliki w `docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/mockupy/`
pokazują **panel MIASTA** (nie panel imperium, czyli inny ekran w grze), ale w tej samej rodzinie
stylu 1E i z bezpośrednim tematycznym pokryciem części tych 11 zakładek:

- **`The Game - Miasto Zakladki W3 6klatek (1E).dc.html`** — 6 „klatek" (kart 410px szerokości)
  dla per-miejskiego: **Handel** (podział %), **Praca** (podział %), **Porządek** (Szczęście —
  odpowiednik „Szczęście/Zadowolenie" z listy Obywatele), **Zdrowie**, **Kultura**, **Religia** +
  osobna karta „Surowce w zasięgu". Każda karta: nagłówek UPPERCASE + link „i szczegóły" w rogu,
  chipy podsumowania nad treścią, paski postępu z okrągłym „uchwytem" na suwakach, tabelka
  wynik/etykieta na dole. Paleta: `#e8d88a` (złoto), tło karty
  `linear-gradient(180deg, rgba(16,20,30,.98), rgba(8,10,16,.98))`, ramka `2px solid
  rgba(232,216,138,.4)`, róg `14px`.
- **`The Game - Ekran Miasto W3 v3 (1E).dc.html`** — pełny ekran panelu miasta (chrome + zakładki).

**Jak z tego korzystać:** to NIE jest layout do skopiowania 1:1 (inny kontekst — panel miasta na
środku ekranu vs slide-in panelu imperium z prawej, inna paleta niż wdrożona sekcja Moc, patrz
§3), ale dobra referencja **stylistyczna** dla kart/chipów/pasków przy projektowaniu zakładek
Obywatele (Kultura, Religia, Zdrowie, Szczęście pokrywają się tematycznie 1:1 z kartami z tego
mockupu, tylko w skali imperium zamiast pojedynczego miasta) i Handel/Praca (też pokrywają się
tematycznie, choć te dwie już dziś MAJĄ swoje miejsce w panelu imperium, patrz §8.1/§8.2).

Dla Nauki: istnieje też `The Game - Panel boczny Badania v1 (1E).dc.html` (48KB, czytelny, panel
boczny szerokości 312px, ta sama paleta `#e8d88a`) — **ale to ekran drzewka technologii/hub
badań** (osobny przycisk na lewym pasku gry), funkcjonalnie inny widok niż wiersz „Bank nauki" w
panelu imperium opisany w §8.4. Traktuj go wyłącznie jako referencję stylu panelu bocznego 312px,
nie jako layout tej konkretnej zakładki.

---

## 8. Stan dzisiejszy i kierunek docelowy — per zakładka

### 8.1 Skarbiec

- **Kod:** funkcja `cityEconMiniSkarbiec()`, `empireDetailPanel.ts` linie 501–538. Wywołana z
  `detailFor.skarbiec` w `render()`, wewnątrz wspólnego bloku „ekonomia" (§1).
- **Trigger:** chip HUD „Skarbiec" → `data-act="skarbiec"` → sekcja `econ-skarbiec` → filtr
  `onlyEconId === 'skarbiec'` pokazuje TYLKO wiersz „Skarbiec" z listy `econRows` + jego detal.
- **Nagłówek dzisiejszy:** wiersz „Skarbiec" żyje pod wspólnym eyebrow „ZASOBY IMPERIUM (STAN +
  PRZYROST)"; rozwinięty detal ma własny mini-nagłówek tabeli: **„SKARBIEC IMPERIUM — bilans /
  turę"**.
- **Dane pokazywane:**
  - Tabela bilansu (6 wierszy): Wpływy brutto (podatek + budynki) · Handel ze szlaków ·
    Utrzymanie budynków · Utrzymanie surowców budynków · Utrzymanie jednostek · **Netto skarbiec**
    (pogrubione).
  - Tabela per miasto: MIASTO · DO SKARBCA · UTRZYMANIE.
  - Suwak „DOMYŚLNY PODZIAŁ {DANINA}" (Skarb / Nauka / Zamożność, %) — to jest **próba
    reskinu, którą orkiestrator podjął samodzielnie zgodnie z Q1=A; wynikowa zmiana wizualna
    okazała się zbyt mała, żeby stanowić realny redesign** — dokładnie ta próba jest powodem
    tego zlecenia.
- **Stylowanie dziś:** wyłącznie generyczne `.civ-emp-mini`/`.civ-emp-zrow` — brak dużej liczby
  „hero" na start (jak „Moc {N}"), brak wizualnego wyróżnika najważniejszej liczby (Netto
  skarbiec). To jest DOKŁADNIE typ problemu, który reskin ma naprawić.
- **Kierunek:** duża liczba „Netto: {N}/turę" na starcie sekcji (analogicznie do `.civ-emp-moc-big`),
  reszta bilansu jako karty/wiersze z wyraźną hierarchią (pozytywne/negatywne pozycje — kolory
  `.d.pos`/`.d.neg` już istnieją i są używane, tylko bez żadnej otoczki wizualnej wokół nich).

### 8.2 Praca

- **Kod:** funkcja `cityEconMiniPraca()`, linie 540–550. `detailFor.praca`, filtr
  `onlyEconId === 'praca'`.
- **Trigger:** chip HUD „Praca" → `econ-praca`.
- **Dane:** tabela MIASTO · DO PULI · DO BUDYNKÓW (3 kolumny) + stopka o utrzymaniu ulepszeń +
  suwak „DOMYŚLNY PODZIAŁ PRACY" (Budynki % / Do puli imperium %).
- **Stylowanie dziś:** czysto generyczna 3-kolumnowa `.civ-emp-mini` tabela, zero wyróżnika.
  Najuboższa wizualnie sekcja obok Nauki i Religii.
- **Kierunek:** ta sama logika co Skarbiec — hero-liczba (np. suma „Do budynków" imperium na
  start), wizualne rozróżnienie dwóch strumieni (Budynki / Pula imperium) np. dwoma kolorowymi
  paskami tak jak w referencyjnej karcie „Praca" mockupu `Miasto Zakladki W3 6klatek` (§7) — tam
  jest już gotowy wzorzec dwukolorowego paska 70/30 z etykietami procentowymi.

### 8.3 Spichlerz (Żywność)

- **Kod:** funkcja `renderSpichlerzCentralnySection()`, linie 819–897. **Osobny blok top-level**
  `spichlerz` w `render()` (nie filtr wiersza jak Skarbiec/Praca/Nauka) — łatwiej stylować
  niezależnie.
- **Trigger:** chip HUD „Żywność" / „Spichlerz" → sekcja `spichlerz`.
- **Eyebrow dzisiejszy:** „SPICHLERZ CENTRALNY".
- **Dane:** duża liczba zapasów + limit magazynu, pasek zapełnienia (`.civ-emp-bar`), ostrzeżenie
  o realnym niepokrytym deficycie żywności (czerwony tekst + ⚠), podsumowanie ostatniej tury (7
  wierszy: Uprawa i hodowla · Wyżywienie ludności · Nadwyżka · Pomoc miastom · Spichlerz stolicy ·
  Wojsko · Przyrost zapasów), tabela per miasto (MIASTO · PRODUKCJA · KOSZT RACJI · BILANS ·
  WZROST%), suwak „DOMYŚLNE WYŻYWIENIE".
- **⚠️ Do naprawienia przy reskinie (nie tylko kosmetyka):** ta sekcja jest **jednym z kilku
  miejsc (🍞 występuje 9× w całym pliku, w tym w sekcji Armia — patrz §8.7) łamiących regułę
  „zero emoji"** z kanonu — używa dosłownie znaku 🍞 (emoji chleba) w kilkunastu miejscach
  (`foodSignedTxt()`, linie ~790–813) zamiast ikony SVG. Kod ma już gotowe rozwiązywanie ikon
  surowców przez `mapResourceIconSvg()`/`brandIconSvg()` (używane w Surowcach, §8.5) — reskin tej
  sekcji powinien zamienić 🍞 na tę samą rodzinę ikon SVG, nie tylko przemalować kolory dookoła.
- **Stylowanie dziś:** ma najwięcej danych ze wszystkich 11 zakładek, ale wszystko w tych samych
  generycznych klasach `.civ-emp-mini`/`.civ-emp-zrow`/`.civ-emp-bar` — brak hierarchii wizualnej
  między „stan magazynu" (najważniejsze) a resztą.

### 8.4 Nauka

- **Kod:** funkcja `cityEconMiniNauka()`, linie 552–559. `detailFor.nauka`, filtr
  `onlyEconId === 'nauka'`.
- **Trigger:** chip HUD „Nauka" → `econ-nauka`.
- **Dane:** WYŁĄCZNIE tabela MIASTO · NAUKA (2 kolumny) + stopka + (dzieli suwak podatku ze
  Skarbcem, bo Nauka jest finansowana % z tego samego suwaka Skarb/Nauka/Zamożność — nie ma
  własnego suwaka).
- **Stylowanie dziś:** to jest **najuboższa treściowo** z 11 zakładek — jedna prosta 2-kolumnowa
  tabela, nic więcej.
- **Kierunek:** minimalnie hero-liczba (suma Nauki imperium/turę) + ta sama tabela, ostylowana
  spójnie z resztą. Nie myl z osobnym ekranem „Panel boczny Badania" (§7, drzewko technologii) —
  to inny widok w grze, tylko podobna paleta.

### 8.5 Surowce

- **Kod:** funkcja `renderSurowceSection()`, linie 1104–1145. **Osobny blok top-level** `surowce`.
- **Trigger:** chip HUD „Surowce" → sekcja `surowce`.
- **Eyebrow dzisiejszy:** „Magazyn państwa" (napisane zwykłą wielkością liter w źródle, nie
  UPPERCASE ręcznie jak większość innych eyebrow — CSS samo nie robi text-transform, więc wygląda
  wizualnie inaczej niż np. „ARMIA" czy „SPICHLERZ CENTRALNY"; ujednolić przy reskinie).
- **Dane:** siatka kart surowców (`.civ-emp-res-grid`/`.civ-emp-res-card`), każda karta: ikona SVG
  (`mapResourceIconSvg`), nazwa, tempo (produkcja / netto z dyplomacją jeśli aktywna wymiana),
  ilość/limit, pasek zapełnienia kolorowany wg stanu (dobry/pełny-warn/spada-bad), opcjonalna
  plakietka „Obywatele: POKRYTE/NIEDOBÓR", rozwijane „Zobacz szczegóły zużycia" (natywny
  `<details>`/`<summary>`, rozbicie na Budynki/Obywatele/Wojsko).
- **Stylowanie dziś:** to **najbardziej rozbudowana wizualnie** z 11 zakładek (karty z paskami,
  kolorowe stany) — ale nadal bez spójnego złotego akcentu jak w Mocy, bardziej „dashboard
  techniczny" niż „imperialny" w duchu 1E. Istnieje dedykowany mockup kanonu:
  `docs/ux/claude-design/01-propozycje-z-design/brand-book/SUROWCE-IKONY-MAKIETA-2026-07-24/brand-book/KANON/mockupy/The Game - Surowce magazyn i formy v1 (1E).dc.html`
  (wg mapy w `CANON.md`) — sprawdź
  format przed czytaniem (§5), nie zweryfikowano w tym przeglądzie czy jest czytelny jako tekst
  czy w formacie bundlera.

### 8.6 Handel

- **Kod:** funkcja `renderHandelSection()`, linie 1154–1229. **Osobny blok top-level** `handel`.
- **Trigger:** chip HUD „Handel" → sekcja `handel`.
- **Nagłówek dzisiejszy:** `.civ-emp-title` „Handel — szlaki handlowe" (inny wzorzec niż eyebrow —
  ta sama niekonsekwencja co Kultura, §8.9).
- **Dane:** tabela aktywnych umów handlowych (PARTNER · POZOSTAŁO · ZAUFANIE · TRASA), linia
  dochodu sumarycznego imperium, tabela tras handlowych (TWOJE MIASTO · PARTNER · MEDIUM·DYSTANS ·
  DOCHÓD/TURĘ), bonus cudów świata do handlu (jeśli aktywny), tabela surowców pozyskanych przez
  wymianę handlową.
- **Stylowanie dziś:** generyczne tabelki, brak wyróżnika.
- **⚠️ Rozgraniczenie zakresu:** istnieje osobny ekran „Umowa wymiany surowców" / koszyk
  dyplomacji handlowej (`D-DYPLO-KOSZYK-UX-trade-basket.png` w `docs/ux/preview-dyplomacja/`) —
  **to jest INNY temat, POZA zakresem tego zlecenia**. Nie myl go z sekcją Handel opisaną tutaj
  (szlaki handlowe wewnątrz panelu imperium).

### 8.7 Armia

- **Kod:** inline w `render()`, linie 1451–1476. **Osobny blok top-level** `armia`.
- **Trigger:** chip HUD „Armia" → sekcja `armia`.
- **Eyebrow dzisiejszy:** „ARMIA".
- **Dane:** wiersz „Wojsko na mapie" (liczba jednostek), wiersz „Rekruci (pula werbu)" +
  rozwinięty detal `cityPoborMiniRekruci()` (tabela MIASTO · REKRUCI · MAX · ODNOWA · JEDN. +
  wiersz RAZEM + pasek zapełnienia puli rekrutów), sekcja „Zaopatrzenie wojska" (koszt żywności
  armii/turę, stan magazynu państwa, ostrzeżenie „Głód wojska" jeśli aktywny), uchwały
  cywilizacyjne aktywne (jeśli są).
- **Stylowanie dziś:** generyczne, bez wyróżnika.
- **⚠️ Ta sama poprawka emoji co §8.3:** sekcja zawiera znak 🍞 w dwóch miejscach (linie
  ~1466–1467, „Koszt żywności armii: −X 🍞" / „W magazynie państwa: … 🍞") — do usunięcia jako
  część tego samego zlecenia (zamiana na ikonę SVG z tej samej rodziny co Surowce, §8.5).

### 8.8 Kultura

- **Kod:** inline w `render()`, linie 1479–1495. **Osobny blok top-level** `kultura`.
- **Trigger:** chip HUD „Kultura" → sekcja `kultura`.
- **Nagłówek dzisiejszy:** `.civ-emp-title` „Kultura imperium" (14px, złoty, pogrubiony — nie
  eyebrow, inny wzorzec niż większość reszty).
- **Dane:** linia sumy imperium (wartość · przyrost/turę · liczba miast), progi zasięgu granic w
  mieście, procent do najbliższego progu (dla najsilniejszego miasta), notatka o wpływie na
  szczęście, tabela per miasto (MIASTO · KULTURA · ZASIĘG).
- **Stylowanie dziś:** generyczne.
- **Referencja stylistyczna:** karta „Kultura" w mockupie `Miasto Zakladki W3 6klatek` (§7) — ma
  gotowy wzorzec: chipy podsumowania (Wpływ/Zgromadzono), pasek postępu do progu z etykietą
  „X / Y do rozszerzenia", listę źródeł (Świątynia +1, Pomnik +2) zakończoną wierszem „Dominacja".
  Ten sam koncept w skali imperium (suma zamiast jednego miasta) pasuje niemal 1:1 do dzisiejszej
  zawartości kodu.

### 8.9 Religia

- **Kod:** **BRAK dedykowanej funkcji/sekcji.** Kliknięcie chipa „Religia" ustawia sekcję
  `econ-religia`, która w `empirePanelBlockForSection()` trafia w gałąź `section.startsWith('econ-')`
  → zwraca blok `ekonomia` (ten sam co Skarbiec/Praca/Nauka/Miasta). Filtr `onlyEconId ===
  'religia'` pokazuje **wyłącznie jeden wiersz** z tablicy `econRows`: `{ lbl: 'Wierni religii',
  stock: e.religionStock, rate: e.religionRate }` — `detailFor` **nie ma klucza `religia`**, więc
  `detail` jest `undefined` i wiersz renderuje się jako zwykły `.civ-emp-zrow.brd` bez żadnego
  rozwinięcia. To jest **dosłownie jedna linijka tekstu**, najuboższa z 11 zakładek — praktycznie
  nieistniejąca jako osobna sekcja.
- **⚠️ Niejednoznaczność architektoniczna do wyjaśnienia z właścicielem, nie do zgadywania przez
  Designera:** zatwierdzona lista zawartości „Obywatele" (§8.11 niżej) zawiera pozycję „Religia
  (dominująca religia, wyznawcy, własna vs obca)". Dzisiejszy kod ma jednak **osobny chip HUD
  „Religia"**, niezależny od chipów „Miasta"/„Ludność" (które dziś prowadzą do wspólnej sekcji
  Miasto/Obywatele, §8.10–8.11). Nie jest jasne z samej decyzji właściciela, czy: (a) chip
  „Religia" ma zniknąć i jego zawartość przenieść się całkowicie do zakładki Obywatele, czy (b)
  chip „Religia" zostaje jako dodatkowy, niezależny skrót, a Obywatele tylko go **duplikują/
  streszczają**. To pytanie o architekturę UI (jakie chipy istnieją na górnym pasku), nie tylko o
  wygląd — **nie decyduj tego sam jako Designer; zgłoś to jako pytanie w handoffie do integratora/
  właściciela**, razem z proponowanym mockupem obu wariantów jeśli to możliwe.
- **Referencja stylistyczna (niezależnie od odpowiedzi na pytanie wyżej):** karta „Religia" w
  mockupie `Miasto Zakladki W3 6klatek` (§7) ma już gotowy, ładny wzorzec: medalion z ikoną SVG
  (44px, obwódka złota), nazwa religii (Georgia, złoto), podpis „Religia państwowa", chipy
  Wyznawcy/Wiara, lista efektów (Porządek +2, Zadowolenie +1, Świątynie: 1).

### 8.10 Miasto

- **Kod dzisiaj:** Miasto **nie ma dziś własnej sekcji** — dzieli funkcję `cityMiastaMiniDetail()`
  (linie 623–725) z Obywatelami pod wspólną sekcją `econ-miasta` (chip HUD `miasta`/`ludnosc`).
  To jedna gęsta tabela z filtrem widoczności kolumn (checkboxy `.civ-emp-colfilter`/
  `.civ-emp-colchk`, funkcja `wireMiastaColFilter()`) nad tabelą: MIASTO · OBYW · LUDNOŚĆ · WZROST
  · PRACA · PIENIĄDZ · ŻYWNOŚĆ · SUROWCE, zakończoną wierszem podsumowania „SUMA / ŚREDNIA".
  **To dokładnie ta tabela, którą decyzja właściciela dzieli na dwie osobne zakładki** — dzisiejsza
  mieszanka danych produkcyjnych (Praca, Pieniądz, Surowce) i społecznych (Ludność, Wzrost) w
  jednym miejscu jest tym, co ma się rozdzielić.
- **Mechanizm „zaznacz i zobacz sumę cywilizacyjną" — JUŻ ISTNIEJE, jako punkt startowy:** dzisiejszy
  filtr kolumn (`miastaHiddenCols`, checkboxy nad tabelą) to gotowy, działający wzorzec „włącz/
  wyłącz widoczność" — wiersz podsumowania na dole (`computeMiastaSummaryRow()`,
  `gra/src/ui/empireMiastaTable.ts`) już sumuje/uśrednia każdą widoczną kolumnę. Rozszerzenie tego
  mechanizmu (a nie wymyślanie nowego) na budynki/surowce pogrupowane wg poniższej listy jest
  prawdopodobnie najprostszą ścieżką realizacji „zaznacz i zobacz ile w sumie w całej cywilizacji".

**ZATWIERDZONA ZAWARTOŚĆ (lista przedstawiona właścicielowi w czacie 2026-08-13, zatwierdzona z
jedną korektą do listy Miasto — potwierdzenie zatwierdzenia w `dyspozycje/PYTANIA-OTWARTE.md`
§`R-DESIGN-11-ZAKLADEK`):**

> Zakładka Miasto (kąt produkcyjno-ekonomiczny — wszystko co miasto PRODUKUJE, z możliwością
> zaznaczenia i zobaczenia sumy w całej cywilizacji):
> - Budynki i ich produkcja (pogrupowane wg istniejących w grze 8 kategorii budynków: Prawo i
>   administracja, Wojsko i obrona, Handel i pieniądz, Nauka i kultura, Wiara, Zdrowie, Produkcja
>   surowców, Żywność — stała `BUILDING_GROUP_ORDER` w `gra/src/game/building-upgrades.ts`)
> - Wpływy do skarbca (bilans miasta: podatek, handel na szlakach, utrzymanie budynków — BEZ
>   kosztu utrzymania jednostek, bo to koszt całej cywilizacji, nie per-miasto)
> - Produkcja Nauki (miasto vs suma cywilizacji)
> - Produkowane surowce fizyczne (drewno, glina, kamień, rudy, cegła, ceramika itd. — każdy z
>   opcją zaznaczenia i podglądu sumy cywilizacyjnej)
> - Kolejka produkcji (co miasto buduje, ile tur zostało)
> - Handel (szlaki handlowe do/z tego miasta)
> - Obrona miasta (mury, garnizon, bonusy)
> - Populacja i teren (liczba mieszkańców, tempo wzrostu, obrabiane pola)

**Uwaga o korekcie właściciela (ważna dla treści, nie tylko designu):** *„w zakładce Miasto NIE
pokazywać kosztu utrzymania jednostek — utrzymanie wojska jest kosztem całej cywilizacji (schodzi
z głównego skarbca/magazynu imperium), nie kosztem per-miasto."* Reszta listy zatwierdzona bez
zmian.

**8 kategorii budynków (do grupowania „Budynki i ich produkcja"), z `BUILDING_GROUP_ORDER`
(`gra/src/game/building-upgrades.ts`, linie 202–211), w tej dokładnej kolejności:**
Prawo i administracja · Wojsko i obrona · Handel i pieniądz · Nauka i kultura · Wiara · Zdrowie ·
Produkcja surowców · Żywność.

### 8.11 Obywatele

- **Kod dzisiaj:** identycznie jak Miasto (§8.10) — dzieli tę samą sekcję `econ-miasta` i tę samą
  funkcję `cityMiastaMiniDetail()`. Zero osobnej treści społecznej wydzielonej dziś w kodzie.

**ZATWIERDZONA ZAWARTOŚĆ (lista przedstawiona właścicielowi w czacie 2026-08-13, ta sama sekcja
rejestru, zatwierdzona bez korekt — potwierdzenie zatwierdzenia w `dyspozycje/PYTANIA-OTWARTE.md`
§`R-DESIGN-11-ZAKLADEK`):**

> Zakładka Obywatele (kąt społeczny — aspekty wpływające na mieszkańców):
> - Kultura (poziom, przyrost, próg rozszerzenia granic)
> - Religia (dominująca religia, wyznawcy, własna vs obca)
> - Zdrowie (kategoria budynków „Zdrowie")
> - Szczęście/Zadowolenie (poziom + rozbicie źródeł, w tym wpływ kultury/religii)
> - Prawo i administracja (poziom, budynki tej kategorii)
> - Wyżywienie (poziom racji, wpływ na wzrost i zadowolenie)
> - Podział pracy obywateli (ilu w polu, ilu w budynkach)
> - Rekruci (pula do powołania)
> - Zużycie surowców przez obywateli, per miasto (mechanika już istnieje,
>   `gra/src/game/citizen-resource-upkeep.ts`, 1 szt./obywatela/surowiec/turę)

**Zatwierdzona w całości, bez korekt** — cytat właściciela: *„jeżeli w przyszłości będzie czegoś
brakować to zawsze jeszcze dopowiem."*

**O ostatniej pozycji (zużycie surowców przez obywateli):** stawka aktualna na dziś (2026-08-13,
po `R-EKONOMIA-SUROWCE-SKALA-5X-Q1`) to **1,0 sztuki surowca na obywatela na turę**
(`CITIZEN_UPKEEP_RATE_PER_CITIZEN` w `citizen-resource-upkeep.ts` — stawka miała burzliwą historię
zmian tego samego dnia, 1,0 → 0,2 → z powrotem 1,0; jeśli projektujesz layout z przykładowymi
liczbami, licz od aktualnej stawki 1,0, nie 0,2).

**Uwaga o rozgraniczeniu Miasto vs Obywatele — dwie pozycje pojawiają się koncepcyjnie w obu
listach** (Kultura jest w Obywatelach, ale jest też osobnym chipem HUD dziś, §8.8; podobnie
Religia, §8.9). To zamierzone przez właściciela („kąt produkcyjny" vs „kąt społeczny" tego samego
miasta) — Miasto i Obywatele to **dwa różne przekroje tych samych miast**, nie rozłączny podział
danych. Nie próbuj eliminować pozornego powielenia — to nie jest błąd w liście.

---

## 9. Deliverables i format oddania

Wzorem poprzednich zleceń designu w tym repo (zobacz `docs/ux/DESIGN-GITHUB-HASLA.md` dla pełnej
konwencji):

| # | Plik | Opis |
|---|------|------|
| 1 | `The Game - Panel Imperium 11 zakladek v1 {DATA} (1E).dc.html` | Mockup — minimum jedna klatka na zakładkę (11 klatek), stany „pusto"/„z danymi" gdzie ma to sens (np. Skarbiec na minusie, Spichlerz z deficytem) |
| 2 | `DESIGN-do-UI_11-ZAKLADEK-PANEL-IMPERIUM-{DATA}.md` | Handoff: mapowanie region mockupu → funkcja/sekcja kodu (§1, §8), **odpowiedź na pytanie o Religię (§8.9)**, decyzja paleta 3a vs 3b jeśli inna niż rekomendacja §3 |
| 3 | `MANIFEST.txt` | Lista plików |
| 4 | ZIP | `11-ZAKLADEK-PANEL-IMPERIUM-{DATA}.zip` |

**Kolejność pracy zalecana przez właściciela** (z historii tego tematu w `PYTANIA-OTWARTE.md`):
zacząć od jednej zakładki (np. Skarbiec, bo to ta, którą orkiestrator już samodzielnie próbował
reskinować — wynik uznano za zmianę zbyt małą), pokazać zrzut ekranu / mockup, poczekać na
potwierdzenie przed przejściem do kolejnych
10 — nie oddawać wszystkich 11 na raz bez feedbacku po pierwszej.

**Po stronie integratora (nie Designera):** port CSS/markupu do `empireDetailPanel.ts`,
ewentualne rozbicie sekcji `econ-miasta` na dwa bloki `miasto`/`obywatele` w
`empirePanelSectionMap.ts` (zmiana struktury, nie tylko stylu — patrz §1), rebuild ROBOCZA.

---

## 10. DoD checklist

- [ ] Wszystkie 11 zakładek pokryte (Skarbiec, Praca, Spichlerz, Nauka, Surowce, Handel, Armia,
      Miasto, Obywatele, Kultura, Religia)
- [ ] Paleta spójna z sekcją Moc już wdrożoną w kodzie (§3b), nie z `tokens.css` wprost (§3),
      chyba że handoff jawnie proponuje inaczej i to jest wyraźnie zaznaczone
- [ ] Zero emoji (w tym zamiennik dla 🍞 w Spichlerzu, §8.3)
- [ ] Zawartość Miasto/Obywatele zgodna z zatwierdzoną listą dosłownie (§8.10/§8.11), BEZ kosztu
      utrzymania jednostek w Mieście
- [ ] Pytanie o architekturę chipa Religia (§8.9) zgłoszone w handoffie, nie rozstrzygnięte
      samodzielnie
- [ ] Mechanizm „zaznacz i zobacz sumę cywilizacyjną" dla Miasta nawiązuje do istniejącego filtra
      kolumn (§8.10), nie wymyśla nowego wzorca od zera bez uzasadnienia
- [ ] `DESIGN-do-UI` + `MANIFEST.txt` + ZIP, zgodnie z konwencją nazewnictwa repo

**Po gotowości pierwszej klatki (Skarbiec):** „Klatka Skarbiec gotowa do przeglądu — 11-ZAKLADEK-PANEL-IMPERIUM".
