# B-SUROW-BUD — bramki surowcowe budynków wg epoki (Maciej 2026-07-23)

| Pole | Wartość |
|------|---------|
| **Data** | 2026-07-23 |
| **Grupa** | B (ekonomia / budynki / surowce) |
| **Status** | 🟡 **ZAPISANA** — czeka `działaj` (brak implementacji kodu w tej sesji) |
| **Kanon powiązany** | `dyspozycje/SUROWCE-KANON-2026-07-22.md` |
| **Dane źródłowe** | `gra/data/buildings.json` · `gra/data/terrain-improvements.json` · `gra/data/tech.json` |

> **Zakres tej sesji:** ECHO decyzji + pełna lista budynków/infrastruktury + checklist zmian. **Bez** wdrożenia bramek w kodzie — handoff do Integratora po `działaj`.

---

## ECHO — cytaty Macieja

### B-SUROW-BUD-01 — Cegła + kamień + drewno (epoka Żelazo)

> „Cegła wymagana przy praktycznie **wszystkich** budynkach epoki **Żelazo**; minimum **Mury**. Zmodyfikować budynki."

**Korekta Macieja 2026-07-23 (sesja weryfikacji):**

> Epoka **Żelazo** — **WSZYSTKIE** budynki wymagają dostępu do **cegła + kamień + drewno** (nie wyłącznie cegły).

> ~~Epoka **Żelazo** — cegła + kamień + **deski**~~ — **SUPERSEDED** przez **B-SUROW-BUD-03 REMOVE-DESKI** (Maciej 2026-07-23).

**Interpretacja (aktualna):** bramka **dostępu** AND dla budynków `epokaWejscia = 3`: aktywna **cegła** (Cegielnia w imperium) **+** aktywny **kamień** (Kamieniołom) **+** aktywne **drewno** (Tartak / las). **Mury** (`mury`, ep. Brąz) — pierwszy obowiązkowy konsument cegły w gameplayu. Koszt materiałowy ze stocku — **później** (faza 3 magazynów); na razie **access gate**.

---

### B-SUROW-BUD-02 — Stal (epoka Klasyczna)

> „Stal potrzebna w **czwartej epoce** — epoka **Klasyczna**, nie mylić z Żelazem."

**Korekta Macieja 2026-07-23 (sesja weryfikacji):**

> **Stal** potrzebna do **produkcji jednostek epoki Klasycznej** — nie tylko budynek **Wielka Kuźnia**.

**Interpretacja:** konsumenci stali = (a) budynki `epokaWejscia = 4` (Klasyczna) — dziś **Wielka Kuźnia** (`wielka_kuznia`, `wymaganySurowiec: stal`); (b) **jednostki epoki Klasycznej** — koszt produkcji `Surowiec: stal` w `units.json` (tech „Obróbka żelaza" odblokowuje Gaesatae, Soldurii, Wojownik germański, Berserker germański — docelowo **stal**, dziś w danych mają `zelazo`). Potwierdza korektę kanonu w `SUROWCE-KANON` (stal ≠ epoka Żelazo). **Niespójność do domknięcia przy wdrożeniu:** tech „Obróbka żelaza" w `tech.json` ma Epoka=Żelazo (3) vs `wielka_kuznia` ep.4; brak epoki „Klasyczna" w `units.json`; brak receptury `wielka_kuznia` w `converters.ts`.

---

### B-SUROW-BUD-03 — REMOVE-DESKI (uproszczenie surowców)

> „Wyrzućmy po prostu te **deski**, zostawmy **drewno**, a **Stolarnia** będzie tylko i wyłącznie dawała bonus postaci **produkcji** (Praca). W **Brązie** wszystkie **budynki** będą potrzebować **drewna** i **kamienia**; w **Żelazie** — **drewna**, **kamienia** i **cegły**. Po prostu uprościmy to, a surowiec **deska wylatuje z gry**. To zbytnie skomplikowanie."

**Interpretacja (kanon po 2026-07-23):**

| Element | Po decyzji |
|---|---|
| **Surowiec `deski`** | **USUNĄĆ** z gry (`resources.json`, magazyn, konwertery, bramki) |
| **Stolarnia** | **Tylko bonus Pracy** (produkcja miasta) — **NIE** konwerter drewno→deski |
| **Tartak** | Bez zmian — produkuje **drewno** z lasu (TYP 1) |
| **Bramka Brąz** (ep.2 budynki) | **drewno** AND **kamień** (dostęp, nie stock) |
| **Bramka Żelazo** (ep.3 budynki) | **drewno** AND **kamień** AND **cegła** |
| **Bramka Kamień** (ep.1) | **drewno** (B-SUROW-BUD-04 — bez zmian) |

**Supersedes:** wcześniejsze bramki z **deskami** (B-SUROW-BUD-01 wersja z deski · stary B-SUROW-BUD-03 Brąz→kamień+deski · B-SUROW-BUD-05 audyt łańcucha desek · wpisy deski w `SUROWCE-KANON`).

**❓ Otwarte doprecyzowanie (bez ABC):** Maciej użył słowa „**jednostki**" w cytacie — kontekst rozmowy dotyczył **budynków** (`B-SUROW-BUD`). Domyślnie stosujemy reguły **budynków** powyżej. Jedyna jednostka z kosztem **Deski** dziś: **Galera** (4×) → przy `działaj` przepiąć na **drewno** (propozycja Integratora). Czy **inne jednostki** mają dostać bramki epokowe — **czeka na potwierdzenie** (nie blokuje ECHO).

---

### ~~B-SUROW-BUD-03a~~ — Kamień + deski (epoka Brąz) — **SUPERSEDED**

> ~~„Epoka Brązu — każdy budynek wymaga dostępu do kamienia i desek."~~

Zastąpione przez **B-SUROW-BUD-03 REMOVE-DESKI**: Brąz → **drewno + kamień**.

---

### B-SUROW-BUD-04 — Drewno (epoka Kamień)

> „Epoka Kamienia — **każdy** budynek wymaga dostępu do **drewna** (nie desek)."

**Interpretacja:** dla wszystkich budynków `epokaWejscia = 1` — bramka **drewno** (Tartak / dostęp las). **Deski** wycofane z gry (**B-SUROW-BUD-03**).

---

### B-SUROW-BUD-05 — Audyt deski / Stolarnia / Tartak — **SUPERSEDED**

> ~~Audyt łańcucha desek w Brązie~~ — **nieaktualne** po **B-SUROW-BUD-03 REMOVE-DESKI**. Stolarnia = bonus Pracy; Tartak = drewno; surowiec deski **wycofany**.

---

### B-SUROW-BUD-06 — Magazyn

> „Magazyn na razie **bez limitu** — rola = składowanie surowców pod **eksport i handel** z innymi cywilizacjami. Pełne limity magazynowe później, z pełnymi regułami surowców."

**Interpretacja:** `magazyn` (`epokaWejscia: 2`) — **nie** wprowadzać capów per typ surowca w v0.1; UI/ekonomia: bufor pod handel dyplomatyczny / eksport. Limity ×5 (faza 3 SUROWCE-KANON) — **odłożone**.

---

### B-SUROW-BUD-07 — Lista budynków pod bonusy Sz/Zd

> „Wypisz **wszystkie** budynki i infrastrukturę wg epoki — przypiszę bonusy Sz/Zd w następnym kroku."

**Dostarczone:** Tabele A–C w tym pliku (pełna lista, bez skrótu).

---

## Mapowanie epok (kanon projektu)

| `epokaWejscia` / `epoka` | Nazwa |
|---|---|
| 1 | Kamień |
| 2 | Brąz |
| 3 | Żelazo |
| 4 | Klasyczna |
| 5 | Średniowiecze (poza cap v0.1) |

Źródło: `dyspozycje/SPADEK-STAREGO-OBIEGU-2026-07-06.md` · `terrain-improvements.json` `_meta.epoka`.

---

## Tabela A — Wszystkie budynki miasta (`buildings.json`)

Kolumna **Tartak/drewno?** = czy łańcuch drewna jest **możliwy** w tej epoce gry.

### Epoka 1 — Kamień (10 budynków)

| ID | Nazwa | Epoka | Obecne wymagania | wymaganySurowiec | Tech | Kategoria | Tartak/drewno? | Uwagi / suppressed |
|---|---|---|---|---|---|---|---|---|
| `stolarnia` | Stolarnia | 1 Kamień | las w zasięgu | — | Obróbka drewna | Produkcja | TAK (od Kamienia) | **bonus Pracy** (B-SUROW-BUD-03); ~~produkuje deski~~ |
| `mielerz` | Mielerz | 1 Kamień | las w zasięgu | — | Obróbka drewna | Produkcja | TAK | drewno→paliwo |
| `kamieniarski` | Warsztat kamieniarski | 1 Kamień | kamien w zasięgu | — | Murarstwo | Produkcja | TAK | |
| `targowisko` | Targowisko (Rynek) | 1 Kamień | — | — | Wymiana | Pieniadz | TAK | |
| `spichlerz` | Spichlerz | 1 Kamień | — | — | Garncarstwo | Zywnosc | TAK | tier II plan B-SPIC |
| `garncarnia` | Garncarnia | 1 Kamień | glina w zasięgu | — | Garncarstwo | Produkcja | TAK | ceramika |
| `kamienne_kregi` | Kamienne kręgi | 1 Kamień | — | — | Mistycyzm | Religia | TAK | upgrade→Świątynia |
| `studnia` | Studnia | 1 Kamień | — | — | Gospodarka wodna | Zdrowie | TAK | |
| `stela` | Stela / Pomnik | 1 Kamień | — | — | Murarstwo | Kultura | TAK | |
| `palac` | Pałac | 1 Kamień | — | — | *(brak)* | Kultura/Administracja | TAK | 1 na miasto; startowy |

**Po Macieju (B-SUROW-BUD-04):** wszystkie + bramka **drewno** (dostęp).

---

### Epoka 2 — Brąz (13 budynków)

| ID | Nazwa | Epoka | Obecne wymagania | wymaganySurowiec | Tech | Kategoria | Tartak/drewno? | Uwagi |
|---|---|---|---|---|---|---|---|---|
| `kuznia` | Kuźnia | 2 Brąz | miedz lub cyna w zasięgu | — | Brązownictwo | Produkcja+Wojsko | **TAK** (łańcuch od Kamienia) | |
| `odlewnia_brazu` | Piec hutniczy | 2 Brąz | Popalnia brązu + ruda + paliwo | — | Brązownictwo | Produkcja | **TAK** | |
| `port` | Port handlowy | 2 Brąz | wybrzeże morskie lub rzeka | — | Żegluga | Pieniadz | **TAK** | |
| `karawanseraj` | Karawanseraj | 2 Brąz | — | — | Handel | Pieniadz | **TAK** | |
| `cegielnia` | Cegielnia | 2 Brąz | glina + paliwo | — | Garncarstwo | Produkcja | **TAK** | produkuje cegłę |
| `swiatynia` | Świątynia | 2 Brąz | upgrade Kamiennych kręgów | — | Religia | Religia | **TAK** | |
| `biblioteka` | Biblioteka | 2 Brąz | — | — | Pismo | Nauka | **TAK** | gate poz.6=Astronomia |
| `akwedukt` | Akwedukt | 2 Brąz | — | — | Budownictwo | Zdrowie | **TAK** | |
| `mennica` | Mennica | 2 Brąz | — | — | Waluta | Pieniadz | **TAK** | |
| `mury` | Mury | 2 Brąz | — | — | Budownictwo | Obrona | **TAK** | odblokowuje maMur |
| `koszary` | Koszary | 2 Brąz | — | — | Wojskowość | Wojsko | **TAK** | |
| `magazyn` | Magazyn | 2 Brąz | — | — | Handel | Produkcja+Pieniadz | **TAK** | B-SUROW-BUD-06: bez limitu; handel/eksport |
| `trybunal` | Trybunał | 2 Brąz | — | — | Kodeks | Administracja | **TAK** | |

**Po Macieju (B-SUROW-BUD-03 REMOVE-DESKI):** wszystkie + bramka **drewno + kamień** (dostęp).

---

### Epoka 3 — Żelazo (11 aktywnych + 1 suppressed)

| ID | Nazwa | Epoka | Obecne wymagania | wymaganySurowiec | Tech | Kategoria | Tartak/drewno? | Uwagi |
|---|---|---|---|---|---|---|---|---|
| `odlewnia_zelaza` | Odlewnia żelaza | 3 Żelazo | upgrade Odlewni brązu | — | Hutnictwo żelaza | Produkcja | TAK | |
| `port_wielki` | Port wielki | 3 Żelazo | upgrade Portu; wybrzeże | — | Inżynieria | Pieniadz | TAK | |
| `kuznia_zelaza` | Kuźnia żelaza | 3 Żelazo | żelazo w zasięgu | **zelazo** | Hutnictwo żelaza | Produkcja+Wojsko | TAK | |
| `fort` | Cytadela | 3 Żelazo | upgrade Murów | — | Inżynieria | Obrona | TAK | upgrade mury |
| `warsztat_oblezniczy` | Warsztat oblężniczy | 3 Żelazo | wymaga Koszary | — | Oblężnictwo | Wojsko | TAK | maWarsztatOblezniczy |
| `akademia` | Akademia | 3 Żelazo | upgrade Biblioteki | — | Filozofia | Nauka | TAK | merge Teatr |
| `teatr` | Teatr | 3 Żelazo | — | — | Filozofia | Kultura | TAK | **suppressed: true** |
| `sad` | Sąd | 3 Żelazo | — | — | Prawo | Administracja | TAK | KULT-BUD-01 |
| `pretorium` | Pretorium | 3 Żelazo | — | — | Prawo | Administracja | TAK | |
| `laznia_publiczna` | Łaźnia publiczna | 3 Żelazo | wymaga Studnia | — | Medycyna | Zdrowie | TAK | |
| `akademia_wojskowa` | Akademia wojskowa | 3 Żelazo | upgrade Koszar | — | Sztuka wojenna | Wojsko | TAK | |

**Po Macieju (B-SUROW-BUD-01 + B-SUROW-BUD-03):** wszystkie + bramka **cegła + kamień + drewno** (dostęp AND); **Mury** = minimum pierwszy konsument cegły.

---

## Audyt łańcuchów produkcji (2026-07-23)

| Chain | Musi być w | Producent | Tech | Werdykt | Uwaga |
|---|---|---|---|---|---|
| **drewno** | Kamień | Tartak (teren) | Obróbka drewna | **PASS** | `terrain-improvements.json` ep.1; dostęp boolean + plon w `turn-economy.ts` |
| ~~**deski**~~ | — | ~~Stolarnia~~ | — | **WYCofane** | **B-SUROW-BUD-03:** surowiec usunięty; Stolarnia = bonus Pracy |
| **kamień** | Kamień | Kamieniołom (teren) | Murarstwo | **PASS** | ep.1; plon `kamienTerenu` co turę |
| **cegła** | **Brąz** (przed bramkami Żelaza) | Cegielnia (miasto) | Garncarstwo | **PASS** | `cegielnia` ep.2 + `glinianka` ep.2; konwerter aktywny gdy budynek w mieście; tech Garncarstwo od Kamienia (badanie), produkcja od Brązu |

### Odpowiedzi weryfikacyjne Macieja

| Pytanie | Odpowiedź | Dowód |
|---|---|---|
| Kamień produkowalny w epoce Kamień? | **TAK** | Kamieniołom ep.1 · Murarstwo |
| ~~Deski produkowalne w epoce Kamień?~~ | **N/A — wycofane** | B-SUROW-BUD-03 REMOVE-DESKI |
| Cegła dostępna/produkowalna w Brązie (przed Żelazem)? | **TAK** | Cegielnia ep.2 · Glinianka ep.2 · Garncarstwo · konwerter `cegielnia` działa |

### Blokery — rekomendowane fixy (po `działaj`)

1. **`converters.ts`:** **USUNĄĆ** recepturę `tartak`→deski; **NIE** dodawać stolarnia→deski; `wielka_kuznia` (żelazo→stal) — bez zmian planu.
2. **`resources.json` + typy:** usunąć wpis **Deski**; wyczyścić `city.surowce.deski` / enum `ResourceKey.Deski`.
3. **`units.json`:** **Galera** — koszt `Deski`×4 → **drewno** (propozycja); tech.json — wyczyścić odblokowanie surowca deski.
4. **`building-resource-gate.ts`:** ep.2 = **drewno AND kamień** · ep.3 = **drewno AND kamień AND cegła** (B-SUROW-BUD-03).
5. **`buildings.json` / `stolarnia`:** potwierdzić bonus **Pracy**; bez konwertera.

---

### Epoka 4 — Klasyczna (1 budynek)

| ID | Nazwa | Epoka | Obecne wymagania | wymaganySurowiec | Tech | Kategoria | Tartak/drewno? | Uwagi |
|---|---|---|---|---|---|---|---|---|
| `wielka_kuznia` | Wielka Kuźnia | 4 Klasyczna | upgrade Kuźni żelaza; stal w zasięgu | **stal** | Obróbka żelaza | Produkcja | TAK | B-SUROW-BUD-02: stal |

---

### Epoka 5 — Średniowiecze (poza cap v0.1)

| ID | Nazwa | Epoka | Obecne wymagania | wymaganySurowiec | Tech | Kategoria | Tartak/drewno? | Uwagi |
|---|---|---|---|---|---|---|---|---|
| `lazaret` | Lazaret | 5 Średniowiecze | — | — | Medycyna | Zdrowie+Wojsko | TAK | placeholder tech |

---

## Tabela B — Infrastruktura / ulepszenia terenu (`terrain-improvements.json`)

| ID | Nazwa | Epoka | Tech | surowiecOdblokowany | Bonus (skrót) | Koszt pracy | Uwagi |
|---|---|---|---|---|---|---|---|
| `farma` | Farma | 1 Kamień | Rolnictwo | — | +3 🍞 | 20 | |
| `wyrab` | Wyrąb | 1 Kamień | — | — | usuwa las | 5 | wycinka |
| `tartak` | Tartak | 1 Kamień | Obróbka drewna | **drewno** | +3 🔨 | 25 | TYP 1 — bez Stolarnii→deski |
| `droga` | Droga | 1 Kamień | Koło | — | +1 handel | 15 | |
| `bydlo` | Trzoda | 1 Kamień | Oswojenie zwierząt | bydlo* | +2🍞 +3🔨 | 20 | *ulepszenie, nie surowiec |
| `owce` | Owce | 1 Kamień | Oswojenie zwierząt | owce* | +1🍞 +2🔨 | 20 | |
| `lama` | Lama | 1 Kamień | Oswojenie zwierząt | lama* | +1🍞 +3🔨 | 20 | tylko Inkowie |
| `oboz_lowiecki` | Obóz łowiecki | 1 Kamień | Łowiectwo | — | +1🍞 +1¤ | 18 | |
| `lodzie_rybackie` | Łodzie rybackie | 1 Kamień | Żegluga | — | +2🍞 +3🔨 | 20 | |
| `kamieniolom` | Kamieniołom | 1 Kamień | Murarstwo | **kamien** | +1 kamień | 22 | |
| `kopalnia` | Kopalnia | 1 Kamień | Murarstwo | **ruda** | +2 🔨 | 25 | ruda żelaza (góry) |
| `glinianka` | Glinianka | 2 Brąz | Garncarstwo | **glina** | +2 glina | 20 | |
| `irygacja` | Irygacja | 2 Brąz | Irygacja | — | +5 🍞 | 30 | przy rzece |
| `stadnina` | Stadnina | 2 Brąz | Jeździectwo | **kon** | +2 🔨 | 28 | |
| `tarasy` | Tarasy uprawne | 2 Brąz | Rolnictwo | — | +3 🍞 | 25 | wzgórza |
| `warzelnia_soli` | Warzelnia soli | 2 Brąz | Garncarstwo | **sol** | +1¤ +1🍞 | 20 | wybrzeże |
| `kopalnia_miedzi` | Kopalnia miedzi | 2 Brąz | Brązownictwo | **ruda** | +2 🔨 | 22 | |
| `posterunek` | Posterunek (Strażnica) | 2 Brąz | Obróbka drewna + Murarstwo | — | +50% obrona | 30 | zasięg 5 |
| `fort` | Fort (mapa) | 3 Żelazo | Wojskowość | — | +100% obrona | 25 | zasięg 10; ≠ Cytadela |
| `droga_brukowana` | Droga brukowana | 3 Żelazo | Drogi brukowane | — | +2 ruch | 25 | upgrade drogi |

**B-SUROW-BUD-06 / B-SPIC-Q5:** infrastruktura — **bez** bonusów Sz/Zd (plan); bonusy pól (🍞/🔨) bez zmian.

---

## Tabela C — Checklist zmian wg Macieja (plan wdrożenia)

| Epoka | Reguła bramki (dostęp, nie stock) | Pliki docelowe | Status |
|---|---|---|---|
| **Kamień** | Każdy budynek ep.1 → **drewno** aktywne (Tartak) | `building-resource-gate.ts` · `buildings.json` | ⏸️ po `działaj` |
| **Brąz** | Każdy budynek ep.2 → **drewno** AND **kamień** aktywne | j.w. | ⏸️ B-SUROW-BUD-03 (bez desek) |
| **Żelazo** | Wszystkie ep.3 → **drewno + kamień + cegła** aktywne; min. **Mury** (cegła) | j.w. · Cegielnia + Kamieniołom + Tartak | ⏸️ B-SUROW-BUD-03 |
| **Klasyczna** | Budynki ep.4 → **stal**; **jednostki ep. Klasyczna** → koszt **stal** | j.w. · `converters.ts` · `units.json` | ⏸️ tech/epoka + brak stal w units dziś |
| **Magazyn** | **Bez limitu**; rola = eksport + handel między cyw. | `economy.ts` / dyplomacja — bez cap fazy 3 | ⏸️ |
| **REMOVE-DESKI** | Usunąć surowiec + konwertery + Galera→drewno; Stolarnia = Praca | `resources.json` · `converters.ts` · `tech.json` · `units.json` | ⏸️ B-SUROW-BUD-03 |
| **Koszty materiałowe** | **Nie teraz** — tylko dostęp (Maciej: „na razie tylko dostęp") | faza 3 SUROWCE-KANON | odłożone |

### Wyjątki do doprecyzowania przy `działaj`

1. **Budynki produkcyjne** (Stolarnia, Cegielnia, Garncarnia) — czy same wymagają bramki swojego produktu, czy tylko wejścia (drewno/glina)?
2. **Pałac** — brak techUnlock; bramka drewno od tury 0?
3. **Upgrade’y** (Świątynia, Cytadela, Akademia…) — bramki na **poziom docelowy** czy tylko pierwszy build?
4. **Teatr** (`suppressed`) — pominąć w gate.

---

## Powiązane decyzje

| ID | Relacja |
|---|---|
| `JEDN-KOSZT-v2-gate` | ten sam model bramki dostępu |
| `B-SPIC-*` | Spichlerz osobno; magazyn ≠ Spichlerz |
| `SUROWCE-KANON-2026-07-22` | łańcuchy surowców A/B |

---

*Plik: `docs/decyzje/B-SUROW-BUD-2026-07-23.md` · v2: B-SUROW-BUD-03 REMOVE-DESKI (Maciej 2026-07-23) · implementacja CZEKA na `działaj`*
