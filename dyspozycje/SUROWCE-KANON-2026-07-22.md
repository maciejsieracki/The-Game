# SUROWCE — kanon podziału (2026-07-22)

> **Decyzja Macieja:** surowce dzielimy na **(A) wydobywane w terenie** i **(B) produkowane w mieście** — łatwiej kontrolować balans, panel i magazyny.
>
> **Źródła scalone:** kontekst rozmowy 2026-07-22 · `STAN-PRACY-HANDOFF.md` (roadmap 3 faz) · `resource-access.ts` (faza 1 wdrożona) · `braz-access.ts` / `zelazo-access.ts` · `Spec-ekonomia.md` §1.5 · `D-RUDY` (DZIENNIK 2026-07-03) · `resources.json` / `terrain-improvements.json`.
>
> **Zasada nazewnictwa:** **nie ma osobnego surowca „miedź"** — wyłącznie **ruda miedzi** (teren) → **brąz** (miasto). Stary wpis „Ruda" w `resources.json` = legacy; docelowo rozdzielamy na **ruda miedzi** i **ruda żelaza**.

---

## Zasady ogólne

### Żywność = wyjątek (decyzja Macieja, 2026-07-22)

**Żywność** jest **jedynym** surowcem kategorii A, który **nie wymaga ulepszenia ani budynku**, aby mieć **aktywny dostęp** z terenu.

| Aspekt | Żywność | Pozostałe surowce A (drewno, kamień, glina, rudy, sól, koń, hodowla…) |
|---|---|---|
| **Dostęp bazowy** | Tak — plony z lądu w zasięgu miasta **bez** ulepszenia | Nie — surowiec **potencjalny** do momentu postawienia właściwego ulepszenia |
| **Rola ulepszeń** | Tylko **zwiększają ilość** (farma, pastwisko, irygacja…) | **Odblokowują aktywny dostęp** (reguła fazy 1: złoże/teren + ulepszenie) |
| **Uzasadnienie** | Bez budynku nadal jest co jeść z terenu (dziko rosnące plony, łowiectwo, pastwiska naturalne) | Surowiec przemysłowy wymaga infrastruktury wydobywczej |

**Implikacja:** panel miasta pokazuje żywność jako **aktywną** już z plonów bazowych heksów lądowych w zasięgu; ulepszenia dodają wiersze bonusowe, nie przełączają dostępu z „potencjalny" na „aktywny".

---

## A. Surowce wydobywane w terenie

Surowiec pozyskiwany z heksów w zasięgu miasta: plony terenu, złoża + ulepszenie, hodowla (Model B). **Nie przechodzi przez budynek miasta**, chyba że jest **wejściem** konwertera (patrz sekcja C).

| Surowiec | Złoże / teren | Ulepszenie | Aktywny gdy… | Uwagi |
|---|---|---|---|---|
| **Żywność** ⚡ | dowolny ląd (plony bazowe + nakładki) | Farma · Irygacja · Pole irygowane · Tarasy · Pastwisko · Trzoda · Owce · Lama · Łodzie rybackie · Obóz łowiecki | heks lądowy w zasięgu miasta → **aktywny od razu** (plony bazowe); ulepszenie **+ pracownicy** → dodatkowa ilość | **Wyjątek:** jedyny surowiec A bez wymogu ulepszenia na dostęp. Ulepszenia tylko **zwiększają** 🍞, nie odblokowują. Magazyn docelowo: **Spichlerz** (faza 3). |
| **Drewno** | **Las** (nakładka) | **Tartak** (las zostaje) | tartak w zasięgu na lesie | Alternatywa jednorazowa: **Wyrąb** (+ drewno, usuwa las). Wejście do Mielerza / Stolarni. |
| **Kamień** | **Wzgórza** lub **Góry** | **Kamieniołom** | kamieniołom w zasięgu na wzgórzach/górach | Bez wymogu złoża (wyjątek fazy 1). Warsztat kamieniarski zużywa kamień (miasto). |
| **Glina** | złoże **glina** (łąka / przy rzece) | **Glinianka** | złoże gliny na heksie **+** glinianka na tym heksie | **2 gliny/turę** (GLINA-Q1). Widoczność złoża od epoki 1. |
| **Ruda miedzi** | złoże `miedz` — **tylko Wzgórza** | **Kopalnia miedzi** | złoże miedzi **+** kopalnia miedzi (imperium) | Widoczne od **epoki Brązu**. Render: grudki miedziane (D-RUDY). **Nie** „miedź" jako osobny surowiec. |
| **Ruda żelaza** | złoże `zelazo` — **tylko Góry** | **Kopalnia** (ogólna, typ ze złoża) | złoże żelaza **+** kopalnia na tym heksie (imperium) | Widoczne od **epoki Żelaza**. Odrębne ulepszenie niż kopalnia miedzi (zamierzone). |
| **Węgiel** | złoże `wegiel` — **Góry** | **Kopalnia** | złoże węgla **+** kopalnia | Luksus / paliwo alternatywne — do doprecyzowania w fazy 2–3. |
| **Sól** | złoże `sol` **lub** Wybrzeże | **Warzelnia soli** | złoże soli **+** warzelnia **albo** warzelnia na wybrzeżu bez złoża | Wyjątek fazy 1: wybrzeże bez złoża OK. |
| **Koń** | złoże konia | **Stadnina** (+ tech Jeździectwo) | złoże **+** stadnina; odblokowanie imperium po pierwszej stadninie | Jednostki konne; Majowie/Ameryka bez koni (kanon civ). |
| **Bydło** (krowa/świnia) | **Model B:** bez złoża na mapie | **Trzoda / Pastwisko** | pierwsze pastwisko w imperium odblokowuje hodowlę; aktywne ulepszenie w zasięgu | Hodowla civ-wide po odblokowaniu. Bonus pól +2🍞 / +3🔨. |
| **Owce** | Model B | **Owce** (solo wzgórze) | jak bydło — odblokowanie imperium + ulepszenie | +1🍞 / +2🔨. Inkowie od epoki 3. |
| **Lama** | Model B | **Lama** (solo; tylko Inkowie) | jak wyżej | +1🍞 / +3🔨. Bez rydwanu. |

**Potencjał vs aktywny (faza 1 — wdrożone ROBOCZA `5000ee9f`):** panel miasta pokazuje złoża w zasięgu jako **potencjał**; **aktywny** dopiero po postawieniu właściwego ulepszenia. **Wyjątki od reguły „ulepszenie = odblokowanie":**
- **Żywność** — aktywna z plonów bazowych lądu **bez** ulepszenia; ulepszenia tylko zwiększają ilość (patrz § Zasady ogólne).
- **Tartak, kamieniołom, warzelnia na wybrzeżu, hodowla Model B** — osobne wyjątki techniczne fazy 1 (brak złoża lub specjalna reguła terenu).

---

## B. Surowce produkowane w mieście

Surowiec powstaje **wyłącznie w budynku miasta** (konwerter co turę). Wymaga **aktywnego dostępu** do surowców terenowych w magazynie miasta (faza 2+) oraz zbudowanego budynku.

| Surowiec | Budynek | Wejście (surowce) | Wyjście | Konwerter / turę |
|---|---|---|---|---|
| **Deski** | **Stolarnia** | 1 drewno | 1 deska | max **2/t** [PT] — w kodzie receptura id `tartak` (do ujednolicenia na `stolarnia`) |
| **Paliwo** (węgiel drzewny) | **Mielerz** | **2 drewno** | 1 paliwo | max **2/t** [PT] — **kanon Macieja: 2→1**; w `converters.ts` dziś 1→1 (do zmiany faza 2) |
| **Cegła** | **Cegielnia** | 1 glina + 1 paliwo | 1 cegła | max **2/t** [PT] |
| **Ceramika** | **Garncarnia** | 1 glina + 1 paliwo | 1 ceramika | max **1/t** [PT] |
| **Brąz** | **Piec hutniczy** (`odlewnia_brazu`) | 1 ruda miedzi + 1 paliwo | 1 brąz | max **1/t** [PT]; **AND-gate:** kopalnia miedzi (mapa, imperium) **+** piec w mieście |
| **Żelazo** (przetworzone) | **Odlewnia żelaza** (`odlewnia_zelaza`) | 1 ruda żelaza + 1 paliwo | 1 żelazo | max **1/t** [PT]; **AND-gate:** kopalnia na złożu żelaza (imperium) **+** odlewnia w mieście |
| **Stal** | **Wielka kuźnia** (`wielka_kuznia`) | 1 żelazo + 1 paliwo | 1 stal | max **1/t** [PT]; tech **Obróbka żelaza**; łańcuch niezależny od odlewni (do scalenia w faza 2?) |

**Budynki wspierające (nie konwertery):** Kuźnia (bonus % jednostek, wymaga dostępu do rudy miedzi w zasięgu — do przepisania z „miedź/cyna"), Warsztat kamieniarski (kamień → produkcja murów — koszty faza 3).

**Łańcuch brązu (kanon):** ruda miedzi (teren) → brąz (miasto). Popalnia brązu na mapie = **historyczna nazwa**; dziś: **Kopalnia miedzi** (`braz-access.ts`).

**Łańcuch żelaza (kanon):** ruda żelaza (teren) → żelazo (miasto) → stal (miasto).

---

## C. Cross-reference — budynki miasta vs surowce terenu

### C.1 Budynki, które **ZUŻYWAJĄ** surowce terenowe (wejście konwertera)

| Budynek miasta | Zużywa z terenu | Produkuje (miasto) | Bramka aktywna |
|---|---|---|---|
| Stolarnia | drewno | deski | tartak w zasięgu + drewno w magazynie |
| Mielerz | drewno (×2) | paliwo | tartak + drewno |
| Cegielnia | glina, paliwo* | cegła | glinianka + mielerz (*paliwo z miasta) |
| Garncarnia | glina, paliwo* | ceramika | glinianka + mielerz |
| Piec hutniczy | ruda miedzi, paliwo* | brąz | kopalnia miedzi (imp.) + piec |
| Odlewnia żelaza | ruda żelaza, paliwo* | żelazo | kopalnia na złożu żelaza (imp.) + odlewnia |
| Wielka kuźnia | żelazo*, paliwo* | stal | odlewnia + żelazo w magazynie (* miasto) |

\* Paliwo i pośrednie produkty miasta — łańcuch zaczyna się od **drewna** z tartaka.

### C.2 Budynki, które **TYLKO PRODUKUJĄ** (pierwszy krok z terenu)

| Budynek | Pierwszy surowiec terenowy | Produkt miasta |
|---|---|---|
| Mielerz | drewno | paliwo |
| Stolarnia | drewno | deski |

### C.3 Budynki zależne od dostępu terenowego (bez konwertera ilościowego w v0.1)

| Budynek | Wymaga aktywnego dostępu | Rola |
|---|---|---|
| Kuźnia | ruda miedzi (zasięg) | bonus produkcji wojska brązowego |
| Warsztat kamieniarski | kamień | murarstwo / produkcja |
| Kuznia (produkcja+wojsko) | ruda miedzi | mnożnik % jednostek |

### C.4 Ulepszenia terenu — mapa na surowce (nie miasto)

| Ulepszenie | Daje / odblokowuje | Kategoria |
|---|---|---|
| Tartak | drewno | A — teren |
| Kamieniołom | kamień | A — teren |
| Glinianka | glina (ilość/t) | A — teren |
| Kopalnia miedzi | ruda miedzi | A — teren |
| Kopalnia | ruda żelaza / węgiel | A — teren |
| Warzelnia soli | sól | A — teren |
| Stadnina | koń | A — teren |
| Farma / pastwiska / hodowla | **+** żywność (bonus ilości; dostęp bazowy bez ulepszenia) | A — teren |

---

## D. Roadmap 3 faz — implikacje podziału A / B

| Faza | Zakres | Kategoria A (teren) | Kategoria B (miasto) | Status |
|---|---|---|---|---|
| **1 — dostęp realistyczny** | złoże widoczne vs aktywne po ulepszeniu; panel potencjał/aktywny; wyjątki tartak/kamieniołom/wybrzeże/hodowla; **żywność aktywna bez ulepszenia** | wszystkie wiersze tabeli A: reguła **złoże + ulepszenie** — **oprócz żywności** (bazowy dostęp z lądu) | brąz/żelazo: AND-gate mapa+budynek (boolean) | **WDROŻONE** (`5000ee9f`); **do wdrożenia:** wyjątek żywności w kodzie |
| **2 — bramki budynków** | każdy konwerter wymaga **aktywnego** surowca terenowego + budynku; receptury 2 drewno→1 paliwo; pełne zbieranie rud miedzi/żelaza do magazynu miasta; Garncarnia/Cegielnia rozszerzone z pilota | ilościowe zbieranie: drewno, kamień, glina, **ruda miedzi**, **ruda żelaza**, sól | wszystkie wiersze tabeli B; spójność id `stolarnia` vs `tartak` w `converters.ts` | **KOLEJNY KROK** |
| **3 — magazyny + koszty** | **Magazyn surowców terenowych** (×5 per typ A); Spichlerz = żywność osobno | jednostki/budynki: koszty z kolumny A (drewno, kamień, glina, ruda…) | koszty z kolumny B (deski, cegła, brąz, żelazo, stal); nadwyżka przepada | **PLAN** |

**Organizacja panelu (propozycja UX):** dwie sekcje — „Z terenu" (A) i „Produkcja miejska" (B) — zamiast jednej listy „Surowce".

**Handel / dyplomacja:** kategoria A = dostęp do złoża (cennik D3); kategoria B = **nie handlujemy** gotowych budynków ani przetworzonego brązu/stali (Maciej 2026-06-30).

---

## E. Otwarte doprecyzowania (nie blokują dokumentu)

0. **Wyjątek żywności w kodzie** — `resource-access.ts` (faza 1) stosuje dziś regułę „ulepszenie = aktywny" także dla 🍞; kanon wymaga: plony bazowe lądu = aktywne bez ulepszenia, ulepszenia = bonus ilości. Wdrożenie: faza 2 lub osobny batch.
1. **Węgiel** — surowiec luksusowy czy substytut paliwa w epoce Żelaza?
2. **Scalenie łańcuchów** Odlewnia żelaza vs Kuźnia żelaza / Wielka kuźnia — dziś dwa niezależne drzewka w `buildings.json`.
3. **Legacy `Ruda`** w `resources.json` — migracja na `ruda_miedzi` / `ruda_zelaza` w kluczach ASCII.
4. **Przepustowości [PT]** — strojenie po playteście (Spec-ekonomia §1.5).

---

*Plik: `dyspozycje/SUROWCE-KANON-2026-07-22.md` · autor: sesja 2026-07-22 · bez implementacji kodu.*
