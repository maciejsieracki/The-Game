# Raport końca dnia — 2026-07-07

**Wersja do sprawdzenia:** `gra-robocza/START.html` → **Ctrl+F5** przed każdą nową grą.

---

## 1. Podsumowanie wykonawcze

- **Największy batch:** naprawy z rejestru playtestu (B1–B10, B3, B4, B6–B8, MAP-Q1, A3) — wdrożone w kodzie i w opublikowanym buildzie roboczym.
- **Mapa i AI:** jeden klaster państw per cywilizacja (~3 hex), founding na krawędzi, faza 1 AI (stolice najpierw przejmują własne państwa w klastrze).
- **Balans kreatora:** osobne suwaki tempa badań (×1/×2/×4), kosztów budynków i kosztów jednostek; naprawiono odwrócone mnożniki badań.
- **Miasta i epoka:** pule nazw 100+10 dla 15 cywilizacji; naprawa epoki kamienia na starcie (B12); twardy cap ludności 5/15 z Akweduktem.
- **Ekonomia mapy:** las daje +1 Praca na hex (Równina+Las: 3→4).
- **Asymetria trudności + tempo wzrostu ludności:** domknięte po sesji (kod, testy, publish) — patrz sekcja 5.
- **Build roboczy:** opublikowany **2026-07-07 ok. 16:45**, md5 **`ae03f50d923a698f644302fdf07e1150`** (`gra-robocza/ROBOCZA-MANIFEST.json`).
- **Niedokończone na koniec dnia:** wasalizacja AI w fazie 1, epoka 4 >15 ludności (tylko szkic ABC), import Excel nazw miast po edycji Macieja.

---

## 2. Tabela zmian

| Temat | Było | Jest | Powód | Efekt |
|-------|------|------|-------|-------|
| **B1 — duplikat surowców** | Blok „Surowce w zasięgu” 2–3× w panelu | Jeden blok w stopce panelu | Decyzja B1-Q1=B | Czytelniejszy panel; suwaki handlu bez zmian |
| **B2 — panel handlu** | Ryzyko zakrycia suwaków przez dubel | Naprawa razem z B1 (B2-Q1 przyjęte domyślnie B, bez osobnej odpowiedzi) | Ten sam patch UX | Suwaki Skarb/Nauka/Zamożność powinny być widoczne |
| **B6 — HUD PAŃSTWO** | Sumy z całej mapy / AI | Tylko imperium gracza (owner 0); tooltip = wkład grodu | B6-Q1=A | Spójne liczby przy jednym mieście |
| **B7 — kolejka rekrutacji** | Na dole panelu Produkcja | Dwie kolejki (budowa + rekrutacja) na górze | B7-Q1=A | Łatwiej zobaczyć co się produkuje |
| **B8 — nawigacja miast** | Tylko wyjście na mapę | Strzałki ‹ › przy nazwie miasta | B8-Q1=B | Przełączanie miast bez wychodzenia |
| **B3 — menu pauzy** | Emoji przy „Wróć do gry” | SVG jak przy pozostałych przyciskach | B3-Q1=A | Spójny wygląd menu |
| **B4 — badania / drzewko** | Klik w drzewku zamykał hub; emoji; przycisk na dole | Klik = cel (drzewko otwarte); SVG; „Pełne drzewko” pod celem | B4-Q1/2/3 | Wybór tech z drzewka działa |
| **B9 — Zebrana Praca** | `22.499999999999996` | Zaokrąglenie w UI (`Math.round`) | B9-Q1=B | Czytelne liczby całkowite |
| **B10 — nadprodukcja pracy** | Nadwyżka przepadała | Przechodzi na kolejny budynek lub pulę imperium | B10-Q1=A | Praca nie ginie po ukończeniu |
| **B5 — koniec tury** | Tylko spinner przeglądarki | Overlay: pasek, faza, „Teraz gra: …” | Wcześniejsza decyzja A; potwierdzone w buildzie | Widać kto teraz gra |
| **B11 — refund rekrutacji** | Anulowanie = strata pieniędzy | Zwrot do skarbca przy anulowaniu z kolejki | Już było w silniku | Bezpieczne cofanie rekrutacji |
| **MAP-Q1 — głód armii** | Brak sygnału na mapie | Chip ☠ na tokenie głodującego stosu | Decyzja Macieja | Od razu widać głodującą armię |
| **A3 — Shift+click marsz** | Tylko 1 hex / turę ręcznie | Podgląd trasy + „X tur” + auto-marsz co turę (MVP) | A3-Q1=A | Szybsze przemieszczanie wojsk |
| **Klaster + AI faza 1** | Państwa rozrzucone; AI od razu ekspanduje | 1 klaster ~3 hex; founding na obwodzie; stolice najpierw przejmują państwa w klastrze | Decyzja gameplay 2026-07-07 | Start bardziej „historyczny”, AI mniej chaotyczne |
| **Tempo badań** | Odwrócone mnożniki (Szybka ×0,2…) | Szybka ×1, Standardowa ×2, Długa ×4 na koszt PN | „Badania za szybko” | Wolniejszy postęp tech przy Standard/Długa |
| **Koszty budynków** | Tylko baza z JSON | Kreator: Niski ×1 / Normalny ×2 / Wysoki ×4 Pracy | Balans budowy | Dłuższe budowy przy wyższym tempie |
| **Koszty jednostek** | Tylko baza z JSON | Kreator: Niski ×1 / Normalny ×2 / Wysoki ×4 złota | Osobny suwak od budynków | Droższa rekrutacja przy wyższym tempie |
| **Asymetria trudności (koszty)** | Symetria zawsze | Łatwa: gracz ×1, AI ×2; Trudna: gracz ×2, AI ×1; Normalna: ×1 | Decyzja Macieja | Łatwiejsza/trudniejsza gra bez zmiany tempa kreatora |
| **Wzrost ludności (tempo)** | Stały próg żywności | Kreator: Wysoki ×1 / Normalny ×2 / Wolny ×4 | Decyzja Macieja | Wolniejszy wzrost przy Normalny/Wolny |
| **Asymetria trudności (wzrost)** | — | Łatwa: AI 2× więcej żywności; Trudna: gracz 2×, AI 0,5× | Cytat Macieja o „tańszym” wzroście AI | AI rośnie inaczej niż gracz na Trudnej |
| **Akwedukt cap 5/15** | Z Akweduktem „bez limitu” | Cap 5 bez / 15 z Akweduktem | Audyt mechaniki | Wzrost zatrzymuje się na 15 |
| **B12 — epoka kamienia** | Państwa-miasta wyglądały na Brąz | Model i logika epoki z epoki startowej gry | Bug render/logiki | Kamienne miasta-państwa na starcie w Kamieniu |
| **Las +1 Praca** | Równina+Las = 3 Pracy | Równina+Las = 4 Pracy | Balans plonów | Las bardziej opłacalny produkcyjnie |
| **Nazwy miast 100+10** | 12 hardcoded nazw AI; pula w JSON bez wiringu | 15 cyw. × 100 founding + 10 państw; auto-nazwy gracza i AI | Rozszerzenie immersji | Brak promptu; historyczne nazwy per cywilizacja |
| **Army merge / głód / bitwa / konie** | Wcześniejsze wdrożenia | Bez zmian dziś; MAP-Q1 i B11 potwierdzone w buildzie | — | Stare fixy nadal w bundle |

---

## 3. Kreator gry — nowe opcje (Zaawansowane opcje, krok 4)

| Opcja | Wartości | Co robi |
|-------|----------|---------|
| **Prędkość badań** | Szybka / Standardowa / Długa | Mnożnik kosztu nauki: ×1 / ×2 / ×4 |
| **Koszty budynków** | Niski / Normalny / Wysoki | Mnożnik Pracy przy budowie: ×1 / ×2 / ×4 |
| **Koszty jednostek** | Niski / Normalny / Wysoki | Mnożnik złota rekrutacji: ×1 / ×2 / ×4 |
| **Wzrost ludności** | Wysoki / Normalny / Wolny | Mnożnik progu żywności na +1 mieszkańca: ×1 / ×2 / ×4 |
| **Trudność** | Łatwa / Normalna / Trudna | Asymetria kosztów budynków, jednostek, badań i progu wzrostu ludności |

Wszystkie tempo-opcje zapisują się w sejwie (`gracz.tempoGry`, `buildingCostPace`, `kosztJednostekPace`, `wzrostLudnosciPace`).

---

## 4. Co sprawdzić w grze (checklist)

**Wejście:** `gra-robocza/START.html` → **Ctrl+F5** → Nowa gra.

### Panel miasta i ekonomia
- [ ] Panel miasta — **jeden** blok „Surowce w zasięgu”; suwaki handlu przeliczają chipy Skarb/Nauka/Zamożność
- [ ] Górny pasek PAŃSTWO — sumy tylko Twojego imperium; tooltip pokazuje wkład otwartego grodu
- [ ] Produkcja — kolejki budowy i rekrutacji **na górze**; „Zebrana Praca” jako liczba całkowita
- [ ] Po ukończeniu budynku nadwyżka pracy idzie na kolejny w kolejce lub do puli imperium
- [ ] Strzałki ‹ › przy nazwie miasta — przełączanie bez wychodzenia na mapę
- [ ] Anulowanie jednostki z kolejki — **zwrot pieniędzy**

### Badania i UI
- [ ] Menu pauzy — ikony SVG (także „Wróć do gry”)
- [ ] Hub badań — klik w węzeł drzewka **ustawia cel** bez zamykania; przycisk drzewka pod aktywnym celem
- [ ] Przy tempie Standardowa/Długa — Obróbka drewna pokazuje **24** lub **48 PN** (nie 12)

### Mapa i AI
- [ ] Hex startowy na **skraju** klastra (nie w środku)
- [ ] Po founding — państwa tego samego typu w jednym skupisku (~3 hex)
- [ ] Obcy typ — stolica na krawędzi; po kilku turach naciera na sąsiednie państwa swego typu
- [ ] Pusty hex w klastrze (slot na kolejne miasto)
- [ ] Państwa-miasta mają **kamienny** model przy starcie w Epokę Kamienia
- [ ] Hex z lasem — tooltip/panel pokazuje **+1 Praca** (np. Równina+Las = 4)

### Wojsko
- [ ] Armia głodząca — chip ☠ na tokenie
- [ ] **Shift+klik** na mapie — trasa wielu tur, etykieta „X tur”, auto-marsz co turę

### Koniec tury
- [ ] „Zakończ turę” — overlay z paskiem i „Teraz gra: …”

### Kreator (nowe suwaki)
- [ ] Zaawansowane opcje — koszty budynków, jednostek, tempo badań, wzrost ludności widoczne w podsumowaniu kroku 5
- [ ] Wojownik przy Normalny koszt jednostek = **20 zł** (baza 10)

### Ludność i Akwedukt
- [ ] Miasto bez Akweduktu — cap **5**; z Akweduktem — cap **15** (nie „bez limitu”)
- [ ] Nazwy miast/państw — historyczne z puli (np. Sparta, Teby dla Grecji; Qin/Qi dla Chińczyków jako państwa)

### Asymetria trudności (w obecnym buildzie)
- [ ] Trudna + Normalny koszt budynków → Ty **40** Pracy, AI państwo **20** (asymetria)
- [ ] Wzrost ludności Normalny → wolniejszy wzrost (2× próg żywności)
- [ ] Trudna + Normalny wzrost → gracz 4× próg, AI 1× (przy pop 3→4: Ty 136 🍞, AI 34 🍞)

---

## 5. NIE ZROBIONE / w kolejce / częściowe

### Domknięte po sesji follow-up (16:45)
| Temat | Status po naprawie |
|-------|-------------------|
| Asymetria trudności (koszty) | ✅ `difficulty-cost.ts` + wiring w `production.ts`, `playerState.ts`, `sciencePicker.ts` — test 22/22 ZIELONY |
| Tempo wzrostu ludności | ✅ `population-growth-tempo.ts` + kreator + save/load `wzrostLudnosciPace` w `main.ts` — test 14/14 ZIELONY |
| Asymetria trudności + wzrost | ✅ `getPopulationGrowthThresholdMultiplier` + `advanceCityEconomy` — testy ZIELONE |
| `tsc --noEmit` | ✅ 0 błędów (GameMap import OK w `turn-economy.ts`) |
| Publish roboczy | ✅ md5 `ae03f50d923a698f644302fdf07e1150` (560 modułów) |

### Nadal otwarte
- **B2-Q1** — Maciej nie odpowiedział wprost; przyjęto **B** (naprawa razem z B1).
- **Epoka 4, ludność >15** — szkic ABC w `docs/decyzje/B-popcap-akwedukt-audit.md` (rekomendacja A: ulepszony Akwedukt); **bez implementacji**.
- **Wasalizacja AI w fazie 1** — nie wdrożona; priorytet to przejęcie wojskiem.
- **A3 MVP** — edge case’y (blokada terenu, koniec ruchu w połowie trasy) **nieweryfikowane**.
- **Excel → gra** dla nazw miast — `generate-city-names-xlsx.py` i `export-city-names.py` gotowe; **import z Excel po Twojej edycji = TODO**.
- **Infografiki/dizajn drzewka badań** (B4 część graficzna) — bez dzisiejszej naprawy.
- **Rozjazd PAŃSTWO vs MIASTO** — naprawiony B6 dla gracza; **pełny audyt agregacji** nie był tematem dnia.

---

## 6. Pliki kluczowe / status buildu

| Element | Status |
|---------|--------|
| **Gra robocza** | `gra-robocza/Gra-ROBOCZA.html` — **aktualna** wg manifestu |
| **MD5** | `ae03f50d923a698f644302fdf07e1150` |
| **Data publish** | 2026-07-07T16:45:09 |
| **Poprzedni build** | `ce2bac5d…` (16:40, bez asymetrii wzrostu) → `ae03f50d…` (16:45, pełny batch) |
| **Moduły w bundle** | 560 (playtest + klastry + nazwy + koszty + tempo badań + asymetria trudności + wzrost ludności + B12 + las + cap 15) |
| **Testy kluczowe** | `difficulty-cost-test.cjs` 22/22 · `population-growth-tempo-test.cjs` 14/14 · `tsc --noEmit` OK |

**Dokumentacja decyzji z dziś:**  
`docs/decyzje/B1-panel-surowce.md`, `B6-hud-panstwo.md`, `B7-B8-produkcja-miasto-nav.md`, `B9-B10-produkcja-praca.md`, `B3-B4-ui-svg-badania.md`, `B5-koniec-tury-feedback.md`, `MAP-Q1-glod-jednostka.md`, `A3-shift-auto-marsz.md`, `CLUSTER-KRAWEDZ-AI-FAZA1-2026-07-07.md`, `B-tempo-badania-2026-07-07.md`, `B-koszty-budynkow-tempo-2026-07-07.md`, `B-koszty-jednostek-tempo-2026-07-07.md`, `B-trudnosc-koszty-asymetria-2026-07-07.md`, `B-wzrost-ludnosci-tempo-2026-07-07.md`, `B-las-produkcja-2026-07-07.md`, `B-city-names-pools-2026-07-07.md`, `D-nazwy-miast-pule-2026-07-07.md`, `B-popcap-akwedukt-audit.md`

**Excel nazw miast:** `panele-sterowania/Nazwy-miast-cywilizacji.xlsx` — do Twojego przeglądu i ewentualnej edycji.

---

**Podsumowanie jednym zdaniem:** Dziś zrobiliśmy duży krok naprzód — playtest fixes, klaster, balans kreatora, nazwy, epoka kamienia, cap 15, asymetria trudności i tempo wzrostu ludności są w `gra-robocza`; na jutro zostaje wasalizacja AI, epoka 4 >15, import Excel i edge case’y A3.
