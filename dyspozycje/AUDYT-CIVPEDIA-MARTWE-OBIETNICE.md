# AUDYT: martwe parametry budynków w treściach czytanych przez GRACZA
Data: 2026-07-25 · Tryb: read-only · Uzupełnienie `AUDYT-MARTWE-PARAMETRY-BUDYNKOW.md` (tamten objął tylko kod silnika i UI)

## USTALENIE ORGANIZACYJNE
Treść opisowa budynków żyje **w trzech miejscach naraz** i jest generowana z jednego źródła:
`docs/encyklopedia/budynki/*.md` + `docs/PORADNIK-GRACZA/45-katalog-budynkow.md` → (`gra/tools/gen-cyw-encyklopedia.py`,
`bundle-wiki-for-game.cjs`) → **`gra/src/data/wikiBundle.json`** (Civpedia w grze).
→ **Każdy błąd występuje potrójnie.** Poprawiamy źródło i regenerujemy, nie łatamy `wikiBundle.json` ręcznie.
(Uwaga: plik nazywa się `gra/src/data/wikiBundle.json`, nie `gra/data/`.)

## TRZECI KANAŁ — dotąd nieaudytowany
`gra/src/ui/cityPanel.ts:5013-5016` (`buildBuildingDetailCard`) renderuje **wprost pole `uwagi` z `buildings.json`**
w karcie budynku w panelu miasta. Czyli fałszywe zdania o mnożniku trafiają na ekran gracza **bez żadnego filtra**,
niezależnie od Civpedii i Poradnika.

## ZNALEZISKA (ranking pilności z punktu widzenia gracza)

| # | Miejsce | Cytat | Problem |
|---|---|---|---|
| 1 | Civpedia + Poradnik, hasła **Mury** i **Cytadela/Fort** | Mury: „+5 obrony (+3 na poziom)", tabela „Poziom 3 → +11 obrony"; Fort: „+15 obrony (+8 na poziom)", „Poziom 3 → +31 obrony" | **Całkowicie fałszywe.** Obrona miasta jest wyłącznie procentowa. Cały opis „Co robi" najdroższego budynku obronnego to fikcyjna liczba — z wyliczoną tabelką, co uwiarygodnia nieistniejący mechanizm. |
| 2 | `cityPanel.ts:5013` — pole `uwagi` w karcie budynku | wszystkie zdania „Mnoznik % dotyczy…" | Żywy kanał **w samej grze**, nie w dokumentacji. |
| 3 | Civpedia + `docs/PORADNIK-GRACZA/45-katalog-budynkow.md:47, 306-320`, hasło **Wielka Kuźnia** | „odblokowuje się w epoce **Średniowiecze** po technologii Hutnictwo żelaza. Pierwsze wzniesienie kosztuje 90 pracy…" | **Fałszywa obietnica dostępności.** Gra ma 3 epoki (potwierdza to własny Poradnik `09-nauka-epoki.md:18`). Zero adnotacji „niedostępne" — w przeciwieństwie do Lazaretu, który był oznaczony. |
| 4 | Civpedia, 5 haseł: **Kuźnia, Kuźnia żelaza, Koszary, Warsztat oblężniczy, Akademia wojskowa** | np. „Mnoznik % dotyczy sily jednostek zelaznych produkowanych w miescie" | **Całkowicie fałszywe** — kategoria „Wojsko" jest wykluczona z sumy, zero efektu. Naprawiane przez wdrożenie dwóch ścieżek ulepszeń. |
| 5 | Civpedia, hasło **Targowisko** | „+0 % mnożnika handlu (+3 na poziom)" | **Zero efektu na każdym poziomie, na stałe** — opisane jako żywa mechanika kluczowego budynku handlowego. Sam cytat „+0 %" zdradza błąd. |
| 6 | Civpedia, hasła **Akademia / Pretorium / Karawanseraj / Wielka Kuźnia** | Akademia: „Mnoznik % dotyczy globalnej puli nauki"; Pretorium: „mnoznik % do przychodu podatkowego"; Karawanseraj: „handel lądowy (szlaki między miastami)" | **Efekt istnieje, ale ląduje w Pracy** — gracz błędnie planuje ekonomię miasta. |
| 7 | Civpedia, hasło **Pretorium** | „+2 obrony (+1 na poziom)" | Całkowicie fałszywe (decyzja 16A: pole do zera). |
| 8 | **Wszystkie 25 haseł budynków** (Civpedia + encyklopedia + Poradnik) | „Utrzymanie: X ¤/turę (**+1 ¤/poziom**)" | Realnie **flat 1** (lub 2 na trudnym) niezależnie od poziomu — `econ-params.json` nadpisuje. Systemowe, ale małe kwoty. Zależne od **PYTANIA 19**. |
| 9 | `docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md:193` | „Budynki dają stały przyrost … lub **mnożnik %** (kuźnia → silniejsze jednostki z miasta, karawanseraj → handel lądowy)" | Akapit metodyczny powielający oba błędy naraz. |

## LAZARET — czysto
Zero wystąpień w `buildings.json`, `wikiBundle.json`, całym `gra/src`, `docs/encyklopedia/`, `docs/PORADNIK-GRACZA/`.
Usunięcie commitem `3228fb1` jest **kompletne**. Pozostały tylko ślady w wewnętrznej dokumentacji roboczej
(`dyspozycje/*`) — to historia decyzji, nie błąd.

---

# MATERIAŁ OPERACYJNY: wszystkie miejsca występowania KARAWANSERAJU
(decyzja 15B — usunąć z gry; lista dla subagenta wykonującego usunięcie)

## Dane gry / silnik
- `gra/data/buildings.json:336-370` — definicja (`id: karawanseraj`)
- `gra/data/tech.json:255` — `"Odblokowuje budynek": "Karawanseraj; Magazyn"` (technologia **Handel**) ← **uwaga: po usunięciu tech Handel nie może zostać bez budynku, zostaje Magazyn**
- `gra/src/game/trade-routes.ts:22, 455` — stała `TRADE_BUILDING_IDS` zawiera `'karawanseraj'` + komentarz o „potrójnym liczeniu"
- `gra/src/ui/icons/brand/building-icon-map.json:16` — `"karawanseraj": "bld-karawanseraj"`

## UI
- `gra/src/ui/cityPanel.ts:7316, 7395` — „Limit tras miasta" / hint o brakujących trasach
- `gra/src/ui/empireDetailPanel.ts:434` — opis limitu tras w panelu imperium

## Civpedia i dokumentacja gracza
- `gra/src/data/wikiBundle.json` — hasło `budynki/karawanseraj` (wikiS/wikiM/full)
- `docs/encyklopedia/budynki/karawanseraj.md` — plik źródłowy hasła
- `docs/encyklopedia/indeks.md:12` — link w spisie treści
- `docs/PORADNIK-GRACZA/45-katalog-budynkow.md:14, 36, 136-150`
- `docs/PORADNIK-GRACZA/07-miasto-budowa-rekrutacja.md:74, 159, 187, 193`
- `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md:281, 305, 335`

## Do weryfikacji osobno (nie objęte audytem)
- `panele-sterowania/*.xlsx` — pliki binarne, nieprzeszukane (wymagają narzędzia xlsx)
- `gra-robocza/`, `gra-kanon/` — równoległe kopie danych; **nie ruszać bez runbooka promocji**
- `docs/ux/claude-design/**/building-icon-map.json` — kopie mapowań ikon w brand-booku

## Ślad decyzyjny (dokumentacja robocza — NIE czyścić, to historia)
`dyspozycje/REJESTR-PROSB-I-ZADAN.md`, `DECYZJE-MNOZNIK-ABC.md`, `SLEDZTWO-MNOZNIK-BUDYNKOW.md`,
`DECYZJE-SUROWCE-EKONOMIA-2026-07-23.md`, `AUDYT-WERYFIKACJA-53-WERDYKTY.md`, `PAMIEC-ROBOCZA-CIV.md`,
`_handoff/KANAL-PRACA.md`, `WERSJE.md`, `EKONOMIA/EKONOMIA-analiza-surowce-budynki.md`

## Czego audyt nie sprawdził
Paneli Excel (binarne), kopii w `gra-robocza`/`gra-kanon`, makiet w `docs/ux/claude-design/**`,
oraz runtime'owych tooltipów poza `def.uwagi` (gra nie była uruchamiana).
