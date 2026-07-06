# A4 / D4 — Przegląd ulepszeń terenu (dla Macieja)

| Pole | Wartość |
|------|---------|
| **ID** | A4-D4-przegląd |
| **Data** | 2026-06-27 (rev. 2 — warunki placementu) |
| **Status** | **ZAMKNIĘTE** — Maciej 2026-06-27 |
| **Decyzja wstępna** | **D4=B** — przegląd listy + warunków przed ABC |
| **A4-D4-Q1** | **A** — cała lista 15 ulepszeń + warunki placementu (tabela poniżej) |
| **A4-Q1 (= B1.1)** | **A** — budowa **tylko z mapy** (tryb 🔨 Budowa); panel miasta = podgląd okolicy, bez stawiania ulepszeń |

**Źródła:**
- Dane: `gra/data/terrain-improvements.json`
- Excel: `MIASTO/Ulepszenia-terenu.xlsx`
- Spec: `MIASTO/Ulepszenia-terenu-spec.md`
- **Kwalifikacja heksów (kod MAPA):** `gra/src/map/improvement-build.ts`
- Model heksa: `gra/src/types/hex.ts` (teren bazowy, nakładka, rzeka)
- Podgląd: **`Civ-MAPA/Gra-podglad-ULEPSZENIA-ROBLOX.html`** · opis: `docs/obieg/GALERIA-ULEPSZEN-TERENU.md`

**Koszt:** Praca ze skarbca imperium · **bez Robotnika** · placement **tylko z mapy** (A4-Q1=A).

**Epoki:** 1 = Kamień · 2 = Brąz · 3 = Żelazo

---

## Wspólne warunki (prawie każde ulepszenie)

| Warunek | Opis |
|---------|------|
| **Terytorium** | Heks w **Twoim** zasięgu terytorialnym (miasto + posterunki/forty). Wyjątek: **Posterunek** — na **krawędzi** zasięgu (w zasięgu lub bezpośredni sąsiad zasięgu). |
| **Brak ulepszenia** | Heks **nie może** mieć już innego ulepszenia (droga = wyjątek w łańcuchu dróg). |
| **Tech** | Odblokowana technologia z kolumny „Tech" (puste = bez wymogu tech). |
| **Epoka** | Numer epoki ≥ wymaganej w JSON. |
| **Widoczność** | Heks odkryty (fog) — do dopięcia w UI. |

**Nakładki / złoża na heksie** (generator mapy):

| Nakładka (`hex.nakladka`) | Znaczenie na mapie |
|---------------------------|-------------------|
| `las` | Las na polu (drewno, wyrąb, obóz łowiecki) |
| `zloze_rudy` | Złoże rudy (kopalnia) |
| `zloze_gliny` | Złoże gliny (glinianka) |
| `zloze_konia` | Konie |
| `zloze_owiec` | Owce |
| `zloze_bydla` | Bydło (krowa/wół) |
| `zloze_lamy` | Lama (region Inków / Ameryka) |
| `brak` | Brak złoża (farma, irygacja na „gołym" terenie) |

**Rzeka:** heks ma `rzeka.obecna` **lub** jest **sąsiadem** heksa z rzeką (środek trasy w `riverPaths`) — wymagane dla **Irygacji**.

---

## Pełna lista — teren, złoże, warunki

Legenda terenu: **Ł**=Łąka · **R**=Równina · **Wz**=Wzgórza · **G**=Góry · **Wy**=Wybrzeże · **M**=Morze · **P**=Pustynia

| # | Ulepszenie | Ep. | **Teren bazowy** (musi być) | **Nakładka / złoże** (musi być) | **Warunki dodatkowe** | Bonus | Koszt | Tech |
|---|------------|-----|-----------------------------|----------------------------------|------------------------|-------|-------|------|
| 1 | **Farma** | 1 | **Ł**, **R** | Brak wymogu złoża | W terytorium; **nie** wymaga rzeki (farma = bez rzeki) | +1 żywn. | 20 | Rolnictwo |
| 2 | **Pastwisko** | 1 | **Ł**, **R**, **Wz** | **Spec:** złoże **Konie / Bydło / Owce / Lama** na heksie *(JSON)* | W terytorium; odblokowuje hodowlę danego zwierzęcia | +1 żyw., +1 Praca | 20 | Oswojenie zwierząt |
| 3 | **Kopalnia** | 1 | **Wz**, **G** | **Lub** nakładka **`zloze_rudy`** (nawet na łące z rudą) | W terytorium | +2 Praca | 25 | Murarstwo |
| 4 | **Kamieniołom** | 1 | **Wz**, **G** | Kamień w terenie (góry/wzgórza) | W terytorium | +1 Praca, +1 kamień | 22 | Murarstwo |
| 5 | **Obóz łowiecki** | 1 | Ląd w terytorium | **`las`** **LUB** złoże zwierzęce (kon/owce/bydło/lama) | „Dzika zwierzyna" = las lub złoże hodowlane na heksie | +1 żyw., +1 Pieniądz | 18 | Łowiectwo |
| 6 | **Wyrąb** | 1 | Dowolny ląd w terytorium | **`las`** (obowiązkowo) | Po wybudowaniu las znika (MAPA) | +1 Praca, +1 drewno | 20 | Obróbka drewna |
| 7 | **Łodzie rybackie** | 1 | **Wy**, **M** | Brak (ławica = sam teren morski/wybrzeże) | **Nie** wymaga terytorium w kodzie dziś — *do doprecyzowania* | +2 żywn. | 20 | Żegluga |
| 8 | **Droga** | 1 | Dowolny **ląd** | Brak | **Sąsiad** miasta, posterunku **lub** istniejącej drogi (łańcuch miasto↔posterunek) | +1 handel, +ruch | 15 | Koło |
| 9 | **Irygacja** | 2 | **Ł**, **R**, **P** | Brak złoża | W terytorium + **przy rzece** (heks z rzeką lub 1 heks od rzeki); **bez** ciągnięcia bez rzeki | +2 żywn. | 30 | Irygacja |
| 10 | **Glinianka** | 2 | Dowolny w terytorium | **`zloze_gliny`** (obowiązkowo) | — | +1 Praca | 20 | Garncarstwo |
| 11 | **Plantacja** | 2 | **Ł**, **R** (+ Las w JSON) | **Spec:** surowiec **luksusowy** na heksie (winogrona/oliwki…) | W terytorium; klucz `luksus` w JSON — **złoże luksusu na mapie do dopięcia w generatorze** | +2 handel | 22 | Kalendarz |
| 12 | **Warzelnia soli** | 2 | **Wy** (wybrzeże) | **Spec JSON:** złoże **Soli**; w kodzie dziś = tylko teren Wybrzeże | W terytorium | +1 Pieniądz, +1 żyw. | 20 | Garncarstwo |
| 13 | **Tarasy uprawne** | 2 | **Wz** | Brak | **Tylko cywilizacja Inkowie** (unikalne kulturowe) | +2 żywn. | 25 | — |
| 14 | **Posterunek** | 2 | Dowolny **ląd** | Brak | **Krawędź terytorium** (w zasięgu lub sąsiad zasięgu); brak plonów; +50% obrony w obozie; **zasięg +5** | — | 30 | — |
| 15 | **Fort** | 3 | Dowolny **ląd** | Brak | W **środku** terytorium; brak plonów; +100% obrony; **zasięg +10** | — | 25 | Budownictwo |

---

## Mapowanie złoże → pastwisko / hodowla

| Złoże na heksie | Zwierzę | Uwagi regionalne |
|-----------------|---------|------------------|
| `zloze_owiec` | Owce | Globalnie (Stary + Nowy Świat) |
| `zloze_bydla` | Bydło | **Brak** u Majów / części Nowego Świata |
| `zloze_konia` | Konie | **Brak** u Majów / Ameryki (konie wyginęły) |
| `zloze_lamy` | Lama | **Inkowie** / Andy; substytut bydła |

**Pastwisko** na heksie z danym złożem = odblokowujesz **hodowlę** tego zwierzęcia (model boolean v0.1).

---

## Weryfikacja: spec JSON vs kod MAPA (`improvement-build.ts`)

**Zaktualizowano 2026-06-29 (MAP-P1-04 audit — ZAMKNIĘTE).**

| Ulepszenie | JSON / spec | Kod MAPA | Status |
|------------|-------------|----------|--------|
| **Pastwisko** | Złoże zwierzęce | `hasAnimalDeposit(nakladka)` | ✅ |
| **Plantacja** | `zloze=luksus`, Ł/R | zgodne | ✅ |
| **Warzelnia** | `zloze=sol` (Pustynia/Równina) | `zloze === 'sol'` | ✅ JSON poprawiony |
| **Tarasy** | Tylko Inkowie | `playerCivArchetype === 'inkowie'` | ✅ |
| **Łodzie** | Wybrzeże/Morze | bez terytorium | 🟡 celowe — ABC Macieja |
| **Tartak** | Osobny typ (wyrąb ≠ tartak) | `tartak` case w build API | ✅ |
| **Kamieniołom** | Wz/G | default path | ✅ |

Test: `node gra/tools/map-improvement-qualify-test.cjs` → 18/18 pass.

Handoff: `dyspozycje/_handoff/MAPA-do-INTEGRATOR_ulepszenia-audit-P1-04.md`

---

## Grupy (skrót decyzyjny)

| Grupa | Ulepszenia |
|-------|------------|
| **Żywność** | Farma, Irygacja, Pastwisko, Łodzie, Tarasy, Warzelnia |
| **Surowce / Praca** | Kopalnia, Kamieniołom, Glinianka, Wyrąb, Obóz |
| **Handel** | Plantacja, Droga |
| **Ekspansja / obrona** | Posterunek, Fort, Droga |

**Propozycja skrótu v1.0 (D4 opcja C):** Droga · Posterunek · Fort · Irygacja.

---

## Decyzje Macieja (2026-06-27)

| ID | Pytanie | Decyzja |
|----|---------|---------|
| **A4-D4-Q1** | Akceptacja listy 15 ulepszeń + warunków z tabeli | **A** — pełna lista |
| **A4-Q1** | Skąd budować ulepszenia (= B1.1) | **A** — tylko mapa (tryb Budowa) |

**Work (MASTER → lane):**
1. **MAPA** — dopiąć luki kwalifikacji (pastwisko, plantacja, tarasy/Inkowie, warzelnia) wg tabeli + sekcja „Weryfikacja"
2. **UI** — tryb 🔨 Budowa: wybór typu → podświetlenie kwalifikujących heksów → klik
3. **SILNIK** — wpiecie akcji `buildImprovement` + koszt Pracy / tura (`MAPA-do-MASTER_ulepszenia-D4A.md`)

Handoff: `dyspozycje/_handoff/MAPA-do-MASTER_ulepszenia-D4A.md` (już GOTOWE).
