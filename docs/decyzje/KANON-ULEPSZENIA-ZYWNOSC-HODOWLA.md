# KANON — ulepszenia terenu: żywność, hodowla, nakładanie

| Pole | Wartość |
|------|---------|
| **Decydent** | Maciej |
| **Data ustalenia** | 2026-06-26 … 2026-06-29 (sesja MASTER) |
| **Status** | **KANON PRODUKTOWY** — źródło prawdy dla designu |
| **Implementacja w kodzie** | **NIE WDROŻONE** — `terrain-improvements.json` i `improvement-build.ts` mają stare wartości |
| **Lane wdrożenia** | EKONOMIA (plony/bonusy) · MAPA (kwalifikacja, render, złoża) · SILNIK (model wielu warstw na heksie) |
| **Powiązane** | `gra/data/terrain-improvements.json` · `docs/decyzje/A4-D4-przeglad-ulepszen-terenu.md` · `docs/decyzje/B1-ulepszenia-plony.md` |

**START TU** przy pracy nad farmami, irygacją, tarasami, hodowlą i połowem.

---

## 1. Słownik

| Termin | Znaczenie |
|--------|-----------|
| **Złoże** | Naturalny zasób na heksie (ikona / nakładka z generatora): sól, ruda, glina, luksus itd. **Wyjątek hodowla:** złoże **bydła / owiec / lamy** = **gotowe ulepszenie** na starcie mapy (bonus plonów od razu; nie budujemy drugi raz bydła/owiec na tym samym heksie). **Farmy na starcie mapy nie występują** — generator stawia co najwyżej krowy/owce. |
| **Płaski ląd** | Łąka, Równina (oraz Pustynia — tylko dla irygacji). |
| **Wzgórze** | Teren bazowy Wzgórza. |
| **Produkcja** | Bonus **pracy** z pola (`bonus.praca` w JSON) — trafia do puli produkcji miasta. |
| **Żywność** | Bonus `bonus.zywnosc` z pola. |
| **Solo / tylko same** | Na heksie **jedno** ulepszenie tej kategorii — **bez** drugiej warstwy (np. tarasy bez owiec). |
| **Odblokowanie hodowli** | Złoże bydła/owiec/lamy w **terytorium imperium** = pastwisko już jest (bonus + dostęp do surowca). Kolejne pastwiska tego typu można stawiać na **zwykłych** polach (bez ikony złoża), w dozwolonym terenie — **bez** ponownej budowy na heksie ze złożem. |

---

## 2. Zasady ogólne

1. **Farma** i **irygacja** — **NIE** na polu ze złożem (żadnym). Złoża obsługują hodowla (pierwsze pastwisko), tarasy (nie na złożu), warzelnia soli, kopalnie itd.
2. **Farma** — tylko **płaski** ląd (Łąka, Równina). **Nie** na Pustyni, **nie** na Wzgórzu.
3. **Irygacja** — tylko teren **płaski**, **bezpośrednio przy rzece** (sąsiad rzeki lub heks z rzeką). **Bez łańcuchów** — nie przedłużamy irygacji od innej irygacji; każde pole musi dotykać rzeki.
4. **Tarasy** — tylko **Wzgórza**, **solo**. Cywilizacje: **Chińczycy + Inkowie** (Egipcjanie/Sumerowie → irygacja nad rzeką).
5. **Pustynia** — **tylko irygacja** (przy rzece). **Zakaz:** farma, bydło, owce, lama.
6. **Pastwisko ogólne** — **usunięte** z panelu budowy. Zamiast tego osobne typy: **Bydło**, **Owce**, **Lama** (oraz **Kon** — osobna decyzja / kawaleria, poza tą tabelą plonów).
7. **Wielowarstwowość** — na jednym heksie może być **więcej niż jedno** ulepszenie, ale tylko tam, gdzie tabela w §4 na to pozwala. W kodzie dziś jest **jedno** `hex.ulepszenie` — wymaga nowego modelu (warstwy / lista).

---

## 3. Reguły nakładania (co może być na **jednym** heksie)

| Teren | Dozwolone | Niedozwolone |
|-------|-----------|--------------|
| **Płaski** | **Farma** + **Irygacja** **LUB** **Farma** + **Bydło** | Farma + irygacja + bydło naraz; owce; lama; tarasy |
| **Płaski** | Sama **Irygacja** (np. Pustynia przy rzece, bez farmy) | Hodowla |
| **Płaski** | Sama **Bydło** (bez farmy) | Irygacja; owce |
| **Wzgórze** | **Tarasy** (solo) | Wszystko inne |
| **Wzgórze** | **Owce** (solo) | Farma, bydło, irygacja, tarasy, lama |
| **Dowolny dozwolony** | **Lama** (solo) | Wszystko obok lamy |

**Farma łączy się wyłącznie z jednym dodatkiem:** **irygacją XOR bydłem.**

**Nie występuje:** Farma + Bydło + Owce — owce są **tylko na wzgórzu**, farma i bydło **tylko na płaskim**.

---

## 4. Tabela plonów — żywność i produkcja

### 4.1 Uprawy

| Klucz | Nazwa | Epoka | Koszt pracy | Teren | Warunki | +żywności | +produkcji | Łączenie |
|-------|-------|-------|-------------|-------|---------|-----------|------------|----------|
| `farma` | Farma | 1 | 20 | Łąka, Równina | nie na złożu | **+3** | 0 | + irygacja **lub** + bydło |
| `irygacja` | Irygacja | 2 | 30 | Łąka, Równina, Pustynia | płasko; przy rzece; nie na złożu | **+5** | 0 | z farmą (płaski) **lub** sama (pustynia) |
| `tarasy` | Tarasy uprawne | 2 | 25 | Wzgórza | nie na złożu | **+3** | 0 | **solo**; Chińczycy + Inkowie |

### 4.2 Hodowla (zastępuje `pastwisko`)

| Klucz | Nazwa | Epoka | Koszt | Teren | Pierwsze postawienie | Kto | +żywności | +produkcji | Łączenie |
|-------|-------|-------|-------|-------|----------------------|-----|-----------|------------|----------|
| `bydlo`* | Bydło | 1 | 20 | Płaski (łąka/równina) | złoże bydła | wszyscy† | **+2** | **+3** | + farma (bez irygacji) **lub** solo |
| `owce`* | Owce | 1 | 20 | **Wzgórza** | złoże owiec | wszyscy† | **+1** | **+2** | **solo** |
| `lama`* | Lama | 1 | 20 | Łąka, Równina, Wzgórza | złoże lamy | **Inkowie** | **+1** | **+3** | **solo** — nic obok |

\* Proponowane klucze JSON (zamiast jednego `pastwisko`). Do synchronizacji z `Ulepszenie` enum i renderem.

† **Inkowie — patrz §5.**

### 4.3 Pożywienie z morza / lasu / soli

| Klucz | Nazwa | Epoka | Koszt | Teren | +żywności | +produkcji | Inne |
|-------|-------|-------|-------|-------|-----------|------------|------|
| `lodzie_rybackie` | Łodzie rybackie | 1 | 20 | Wybrzeże, Morze | **+2** | **+3** | solo |
| `oboz_lowiecki` | Obóz łowiecki | 1 | 18 | Las / zwierzyna | **+1** | 0 | +1 pieniądza |
| `warzelnia_soli` | Warzelnia soli | 2 | 20 | złoże soli | **+1** | 0 | +1 pieniądza; odblokowuje sól |

### 4.4 Poza tym kanonem (bez zmian w tej sesji)

| Klucz | Uwaga |
|-------|--------|
| `plantacja` | +handel, luksus — nie łańcuch farm/tarasów |
| `kon`* | Kawaleria — hodowla osobno; Inkowie §5 |
| kopalnia, kamieniołom, tartak, droga, fort, posterunek, wyrab, glinianka | nie wchodzą w ten kanon żywności |

---

## 5. Inkowie — hodowla i epoki

| Faza | Dostępne ulepszenia zwierzęce |
|------|-------------------------------|
| **Do Średniowiecza** (epoka **3 — Żelazo**, do potwierdzenia w tech) | **Tylko Lama** (solo) |
| **Od Średniowiecza** | Bydło, Owce, Konie — jak inne cywilizacje (po odblokowaniu na złożu) |

Historyczne uzasadnienie: w Ameryce Południowej przed kontaktem brak bydła, owiec i koni; lama jako główna hodowla.

**Lama:** tylko Inkowie, **zawsze solo**, bonus produkcji **+3** (wyżej niż owce).

---

## 6. Sumy na heksie (realne combo)

| Combo | Teren | +żywności | +produkcji |
|-------|-------|-----------|------------|
| **Farma + Irygacja** | Płaski | **+8** | 0 |
| **Farma + Bydło** | Płaski | **+5** | **+3** |
| Farma sama | Płaski | +3 | 0 |
| Irygacja sama | Pustynia (przy rzece) | +5 | 0 |
| Bydło samo | Płaski | +2 | +3 |
| Owce | Wzgórze | +1 | +2 |
| Tarasy | Wzgórze | +3 | 0 |
| Lama | dozwolony teren | +1 | +3 |
| Łodzie rybackie | Morze / wybrzeże | +2 | +3 |

**Maks. żywność (płaski):** Farma + Irygacja = **+8**.  
**Maks. mix żywność + produkcja (płaski):** Farma + Bydło = **+5 / +3**.

---

## 7. Mapa terenu — co wolno

| Teren | Farma | Irygacja | Tarasy | Bydło | Owce | Lama |
|-------|:-----:|:--------:|:------:|:-----:|:----:|:----:|
| Łąka / Równina | tak* | tak* | nie | tak† | nie | Inkowie‡ |
| Pustynia | nie | tak* | nie | nie | nie | nie |
| Wzgórza | nie | nie | tak§ | nie | tak† | nie |
| Heks ze **złożem** | nie | nie | nie | 1. bydło | 1. owce | 1. lama‡ |
| Wybrzeże / Morze | nie | nie | nie | nie | nie | nie |

\* bez złoża; irygacja bezpośrednio przy rzece  
† po pierwszym pastwisku na złożu — potem na zwykłym polu w dozwolonym terenie  
‡ lama solo; Inkowie bez bydła/owiec/koni do Średniowiecza  
§ Chińczycy + Inkowie; tarasy solo

---

## 8. Grafiki (lane MAPA)

| Wariant wizualny | Stan heksa |
|------------------|------------|
| Sama farma | farma bez irygacji |
| Sama irygacja | irygacja bez farmy |
| Farma + irygacja | `pole_irygowane` (stack) |
| Farma + bydło | obie warstwy |
| Bydło / owce / lama / tarasy / łodzie | modele solo (lama zawsze solo) |

**Wzgórze (teren bazowy):** ten sam kształt schodków co tarasy, **kolorystyka zielona** (`mode: natural`).  
**Ulepszenie Tarasy:** identyczna geometria, **brązowe mury** + zielone tarasy (`mode: cultivated`).  
Galeria: `Civ-MAPA/Gra-podglad-ULEPSZENIA-ROBLOX.html` · opis: `docs/obieg/GALERIA-ULEPSZEN-TERENU.md`

---

## 9. Ranking pojedynczych warstw

| Ulepszenie | +żywności | +produkcji |
|------------|-----------|------------|
| Irygacja | 5 | 0 |
| Farma | 3 | 0 |
| Tarasy | 3 | 0 |
| Bydło | 2 | 3 |
| Łodzie rybackie | 2 | 3 |
| Owce | 1 | 2 |
| Lama | 1 | 3 |
| Obóz / warzelnia | 1 | 0 |

---

## 10. Checklist wdrożenia (dla lane’ów)

- [ ] `terrain-improvements.json` — bonusy, tereny, usunięcie `pastwisko`, dodanie `bydlo`/`owce`/`lama`, tarasy +3, irygacja +5, farma +3, łodzie +3 praca
- [ ] `resources.json` — bydło bez „×200%”; owce/lama zgodnie z §4.2
- [ ] `improvement-build.ts` — teren, złoża, nakładanie, bramka Inków, odblokowanie hodowli
- [ ] Model **wielu warstw** na heksie (SILNIK + typ `Hex`)
- [ ] Render — warianty farma / irygacja / farma+irygacja / farma+bydło
- [ ] Testy: `map-improvement-qualify-test.cjs` + plony EKONOMIA
- [ ] Sync `placementpreview`, `mainview`, bundli testowych

**Handoffy wdrożenia (2026-06-29):**
- `dyspozycje/_handoff/MASTER-do-EKONOMIA_kanon-zywnosc-hodowla.md`
- `dyspozycje/_handoff/MASTER-do-MAPA_kanon-zywnosc-hodowla.md`
- `dyspozycje/_handoff/MASTER-do-SILNIK_kanon-zywnosc-hodowla-integracja.md`
- Kolejka Integratora: `docs/obieg/INTEGRATOR-kolejka.md` → **F-FOOD-HODOWLA-01**

---

## 11. Historia zmian

| Data | Zmiana |
|------|--------|
| 2026-06-29 | Pierwszy zapis kanonu (sesja Maciej ↔ MASTER): tarasy, hodowla rozbita, irygacja +5, farma +3, nakładanie, Inkowie, pustynia, łodzie +3 produkcji |

---

*Przy rozbieżności z kodem — obowiązuje **ten dokument** do momentu wdrożenia i review Opus.*
