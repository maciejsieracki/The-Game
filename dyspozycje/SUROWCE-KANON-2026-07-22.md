# SUROWCE — kanon podziału (2026-07-22)

> **Decyzja Macieja:** surowce dzielimy na **(A) wydobywane w terenie** i **(B) produkowane w mieście** — łatwiej kontrolować balans, panel i magazyny.
>
> **Źródła scalone:** kontekst rozmowy 2026-07-22 · wieczorna korekta Macieja 2026-07-22 · `STAN-PRACY-HANDOFF.md` (roadmap 3 faz) · `resource-access.ts` · `braz-access.ts` / `zelazo-access.ts` · `Spec-ekonomia.md` §1.5 · `D-RUDY` · `resources.json` / `terrain-improvements.json` / `buildings.json` / `units.json` / `converters.ts`.
>
> **Zasada nazewnictwa:** **nie ma osobnego surowca „miedź"** — wyłącznie **ruda miedzi** (teren) → **brąz** (miasto). Stary wpis „Ruda" w `resources.json` = legacy; docelowo rozdzielamy na **ruda miedzi** i **ruda żelaza**.

---

## Korekty kanonu (Maciej, 2026-07-22 wieczór)

| # | Temat | Kanon (po korekcie) | Stan w danych / kodzie dziś |
|---|---|---|---|
| 1 | **Bydło, Owce, Lama** | **NIE są surowcami** — tylko **ulepszenia terenu** (Trzoda / Owce / Lama). Dają bonus 🍞/🔨 na polu, nie wpis w magazynie surowców. | `resources.json` nadal ma 3 wpisy „hodowla" — **do usunięcia z tabeli surowców** (legacy). `units.json`: Rydwan (woły) ma koszt `bydlo` — **do przepięcia** na bramkę dostępu Trzody. |
| 2 | **Koń** | **Jest złożem** (`zloze=kon`). Dostęp = złoże + **Stadnina** + tech Jeździectwo → odblokowuje jednostki konne. **Nie** traktujemy jako „hodowli" jak bydło. | Zgodne z `terrain-improvements.json` (`stadnina`). `resources.json` Typ=`hodowla` — **do zmiany etykiety** na złoże. |
| 3 | **Węgiel** | **Odłożony** — epoka XVIII w., **poza zakresem v0.1**. Nie planujemy w Antyku (Kamień–Żelazo). | `map-gen-params.json` nadal spawnuje `wegiel` — **flaga techniczna**, nie gameplay v0.1. |
| 4 | **Sól** | Złoża **wyłącznie na wybrzeżu** (brak soli lądowej / w głębi kontynentu). Warzelnia soli na heksie z złożem soli na wybrzeżu. | `warzelnia_soli` w JSON ma jeszcze „Pustynia/Równina" — **do korekty mapy/DANE**. Brak wpisu „Sól" w `resources.json`. |
| 5 | **Reguła dostępu** | **Każdy surowiec oprócz żywności** wymaga **ulepszenia terenu LUB budynku miasta**, aby być **produkowany / aktywny**. Żywność = wyjątek (plony bazowe lądu). | Faza 1 wdrożona z wyjątkami tartak/kamieniołom; **do domknięcia** wyjątek żywności w kodzie. |
| 6 | **Receptura cegły** | **2 glina + 1 paliwo → 1 cegła** (nie 1+1). | `converters.ts` dziś: `glina:1, paliwo:1` — **do zmiany faza 2**. |
| 7 | **Stal** | Potrzebna dopiero w **epoce Klasycznej** (Antyk wysoki / po Żelazo). **Niespójność do decyzji:** `buildings.json` → `wielka_kuznia` ma `epokaWejscia: 4` (Średniowiecze), tech „Obróbka żelaza" jest w epoce Żelazo (3). | Brak receptury `wielka_kuznia` w `converters.ts`. Żadna jednostka nie ma kosztu `stal`. |
| 8 | **Ceramika → Spichlerz** | **Konsument główny:** budynek **Spichlerz** (`spichlerz`). **Twarda bramka budowy** (Maciej 2026-07-22): **bez ceramiki Spichlerz niedostępny w panelu budowy** — wzorzec jak glina dla Garncarni (`wymagania` / `building-resource-gate`). Efekt zdrowia z Garncarni = **wtórny**. Faza 2: bramka widoczności; faza 3: opcjonalny koszt materiałowy przy budowie (ilość → balans). | `buildings.json` → `spichlerz`: brak bramki ceramiki; `turn-economy.ts`: bug id `ceramika` vs `garncarnia`. **Do wdrożenia faza 2.** |

---

## Zasady ogólne

### Żywność = jedyny wyjątek (Maciej 2026-07-22)

**Żywność** jest **jedynym** surowcem, który **nie wymaga ulepszenia ani budynku**, aby mieć **aktywny dostęp** z terenu.

| Aspekt | Żywność | Wszystkie pozostałe surowce |
|---|---|---|
| **Dostęp bazowy** | Tak — plony z lądu w zasięgu miasta **bez** ulepszenia | Nie — surowiec **potencjalny** do postawienia właściwego ulepszenia **lub** budynku konwertera |
| **Rola ulepszeń** | Tylko **zwiększają ilość** (farma, pastwisko, irygacja…) | **Odblokowują aktywny dostęp** (złoże/teren + ulepszenie) |
| **Uzasadnienie** | Bez budynku nadal jest co jeść (dziko rosnące plony, łowiectwo) | Surowiec przemysłowy wymaga infrastruktury |

### Hodowla zwierząt ≠ surowce (Maciej 2026-07-22)

**Trzoda (bydło), Owce, Lama** to **ulepszenia terenu** z bonusem pól (+🍞, +🔨). **Nie** pojawiają się w magazynie surowców ani w handlu jako osobny typ. Rydwan na wołach wymaga **dostępu do ulepszenia Trzoda** (imperium odblokowane), nie „1 szt. bydła" z magazynu.

---

## A. Surowce wydobywane w terenie (TYP 1)

Surowiec pozyskiwany z heksów w zasięgu miasta. **Nie przechodzi przez budynek miasta**, chyba że jest **wejściem** konwertera (§B).

| Surowiec | Złoże / teren | Ulepszenie | Aktywny gdy… | Uwagi |
|---|---|---|---|---|
| **Żywność** ⚡ | dowolny ląd (plony bazowe) | Farma · Irygacja · Tarasy · Łodzie rybackie · Obóz łowiecki · **Trzoda / Owce / Lama** (+bonus 🍞) | heks lądowy w zasięgu → **aktywny od razu** | **Wyjątek reguły §5.** Ulepszenia hodowli = bonus pól, **nie** osobny surowiec. |
| **Drewno** | **Las** (nakładka) | **Tartak** | tartak w zasięgu na lesie | Alternatywa: **Wyrąb** (+ drewno jednorazowo, usuwa las). |
| **Kamień** | **Wzgórza** lub **Góry** | **Kamieniołom** | kamieniołom w zasięgu | Wyjątek fazy 1: bez złoża na mapie. |
| **Glina** | złoże **glina** | **Glinianka** | złoże + glinianka | **2 gliny/turę** z ulepszenia (GLINA-Q1). |
| **Ruda miedzi** | złoże `miedz` — **Wzgórza** | **Kopalnia miedzi** | złoże + kopalnia (imperium) | Od epoki Brązu. → brąz w mieście. |
| **Ruda żelaza** | złoże `zelazo` — **Góry** | **Kopalnia** | złoże + kopalnia (imperium) | Od epoki Żelaza. → żelazo w mieście. |
| **Sól** | złoże `sol` — **tylko Wybrzeże** | **Warzelnia soli** | złoże soli na wybrzeżu + warzelnia | **Bez** soli lądowej. Brak wpisu w `resources.json` v0.1. |
| **Koń** | złoże `kon` | **Stadnina** + tech Jeździectwo | złoże + stadnina | Jednostki konne; Majowie/Ameryka bez koni. |

**Poza zakresem v0.1 (nie w tabeli A gameplayu):**

| Temat | Status |
|---|---|
| **Węgiel** | Odłożony (XVIII w.). Spawn w generatorze = techniczny, bez mechaniki. |
| **Bydło / Owce / Lama jako surowce** | **Wycofane z kanonu** — tylko ulepszenia (wiersze bonusów w §A Żywność). |

**Potencjał vs aktywny (faza 1):** panel pokazuje złoża jako **potencjał**; **aktywny** po ulepszeniu. Wyjątki techniczne: tartak, kamieniołom, **żywność bazowa**.

---

## B. Surowce produkowane w mieście (TYP 2)

Powstają **wyłącznie w budynku miasta** (konwerter co turę). Wymagają **aktywnego dostępu** do surowców terenowych w magazynie (faza 2+) oraz zbudowanego budynku.

| Surowiec | Budynek | Wejście (surowce) | Wyjście | Konwerter / turę | Uwagi |
|---|---|---|---|---|---|
| **Deski** | **Stolarnia** | 1 drewno | 1 deska | max **2/t** [PT] | W `converters.ts` id receptury = `tartak` (legacy) — docelowo `stolarnia`. |
| **Paliwo** | **Mielerz** | **2 drewno** | 1 paliwo | max **2/t** [PT] | **Kanon: 2→1.** Kod dziś 1→1 — faza 2. |
| **Cegła** | **Cegielnia** | **2 glina + 1 paliwo** | 1 cegła | max **2/t** [PT] | **Kanon Macieja 2026-07-22.** Kod dziś 1+1 — faza 2. |
| **Ceramika** | **Garncarnia** | 1 glina + 1 paliwo | 1 ceramika | max **1/t** [PT] | **Konsument:** bramka **Spichlerz** (`spichlerz`) — bez ceramiki budynek **niedostępny** w panelu (§8). Zdrowie z Garncarni = efekt wtórny. |
| **Brąz** | **Piec hutniczy** (`odlewnia_brazu`) | 1 ruda miedzi + 1 paliwo | 1 brąz | max **1/t** [PT] | AND-gate: kopalnia miedzi (mapa) + piec w mieście. |
| **Żelazo** | **Odlewnia żelaza** | 1 ruda żelaza + 1 paliwo | 1 żelazo | max **1/t** [PT] | AND-gate: kopalnia na złożu + odlewnia. Receptura **brak** w `converters.ts` — placeholder. |
| **Stal** | **Wielka kuźnia** | 1 żelazo + 1 paliwo | 1 stal | max **1/t** [PT] | Epoka **Klasyczna** (decyzja Macieja). **Flaga:** `epokaWejscia:4` w JSON vs tech ep.3. Receptura **brak** w `converters.ts`. |

**Łańcuch brązu:** ruda miedzi (teren) → brąz (miasto).  
**Łańcuch żelaza:** ruda żelaza (teren) → żelazo (miasto) → stal (miasto, epoka Klasyczna).

**Dwa niezależne drzewka budynków żelaza (stan 2026-07-19):**
- `odlewnia_brazu` → `odlewnia_zelaza` (produkcja żelaza)
- `kuznia_zelaza` → `wielka_kuznia` (mnożnik wojska + stal)

### Ceramika → Spichlerz — twarda bramka budowy (Maciej 2026-07-22)

**Reguła:** gracz **nie może** wznieść **Spichlerza** (`spichlerz`), dopóki **nie ma ceramiki** — budynek **nie pojawia się** (lub jest zablokowany) w panelu produkcji miasta.

| Aspekt | Kanon |
|---|---|
| **Konsument główny** | **Spichlerz** (`spichlerz`, `buildings.json` id potwierdzone) |
| **Typ bramki** | **Twarda bramka budowy** — nie „opcjonalny koszt fazy 3" |
| **Wzorzec implementacji** | Jak **Glina → Garncarnia:** `wymagania` w JSON + wpis w `building-resource-gate.ts` |
| **Warunek ceramiki (faza 2)** | **Aktywna produkcja ceramiki** w imperium (Garncarnia + łańcuch glina/paliwo) **lub** zapas `ceramika` w magazynie miasta — dokładny wariant przy wdrożeniu; minimum = bramka katalogu jak u Garncarni |
| **Faza 3 (opcjonalnie)** | Dodatkowy **koszt materiałowy** ceramiki przy budowie Spichlerza (ilość → balans) |
| **Efekt wtórny** | Bonus zdrowia z Garncarni — **zostaje**, nie zastępuje bramki |

**Łańcuch gameplay:** glina (teren) → Garncarnia → **ceramika** → odblokowanie **Spichlerza** → magazyn żywności / bufor wzrostu.

---

## C. Cross-reference — budynki vs surowce terenu

### C.1 Konwertery — zużycie z terenu / miasta

| Budynek | Zużywa | Produkuje |
|---|---|---|
| Stolarnia | drewno | deski |
| Mielerz | drewno (×2 kanon) | paliwo |
| Cegielnia | glina (×2 kanon), paliwo | cegła |
| Garncarnia | glina, paliwo | ceramika |
| Piec hutniczy | ruda miedzi, paliwo | brąz |
| Odlewnia żelaza | ruda żelaza, paliwo | żelazo |
| Wielka kuźnia | żelazo, paliwo | stal |
| **Spichlerz** | **ceramika** (bramka budowy) | magazyn żywności, bufor wzrostu |

### C.2 Ulepszenia terenu — mapa (nie magazyn hodowli)

| Ulepszenie | Efekt | Kategoria |
|---|---|---|
| Tartak | drewno | TYP 1 |
| Kamieniołom | kamień | TYP 1 |
| Glinianka | glina | TYP 1 |
| Kopalnia miedzi | ruda miedzi | TYP 1 |
| Kopalnia | ruda żelaza | TYP 1 |
| Warzelnia soli | sól (wybrzeże) | TYP 1 |
| Stadnina | koń | TYP 1 |
| Trzoda / Owce / Lama | **+żywność / +praca** (bonus pól) | **Ulepszenie, nie surowiec** |
| Farma / irygacja / tarasy / łowiectwo / ryby | **+żywność** | TYP 1 bonus |

---

## D. Roadmap 3 faz

| Faza | Zakres | Status |
|---|---|---|
| **1 — dostęp realistyczny** | potencjał/aktywny; wyjątek żywności; koń=złoże; hodowla≠surowiec | **WDROŻONE** (ROBOCZA); wyjątek 🍞 w kodzie — otwarte |
| **2 — bramki budynków** | receptury 2 drewno→paliwo, **2 glina+1 paliwo→cegła**; pełne zbieranie rud; odlewnia żelaza + wielka kuźnia w `converters.ts`; **Spichlerz wymaga ceramiki** (twarda bramka katalogu) | **KOLEJNY KROK** |
| **3 — magazyny + koszty** | magazyn ×5 per typ; koszty jednostek/budynków z A i B; spichlerz=🍞; opcjonalny koszt materiałowy ceramiki przy budowie Spichlerza | **PLAN** |

---

## E. Otwarte doprecyzowania

1. **Wyjątek żywności w kodzie** — `resource-access.ts` stosuje regułę ulepszenia także dla 🍞.
2. **Stal vs Wielka Kuźnia** — epoka Klasyczna (Maciej) vs `epokaWejscia:4` vs tech ep.3 — **decyzja ABC**.
3. **Legacy `Ruda`** — migracja kluczy `ruda_miedzi` / `ruda_zelaza`.
4. **Sól** — dodać do `resources.json`; generator tylko wybrzeże.
5. ~~**Ceramika**~~ — **✅ rozstrzygnięte:** konsument = **Spichlerz**, twarda bramka budowy (§8). Pozostałe: **Cegła / Kamień / Deski** — konsumentów fazy 3 (§3).
6. **Rydwan (woły)** — koszt `bydlo` → bramka Trzoda (nie surowiec).
7. **Przepustowości [PT]** — po balansie.

---

# SUROWCE-KANON-v2 — audyt i tabele (2026-07-22 wieczór)

> Pełny audyt: `resources.json` · `terrain-improvements.json` · `buildings.json` · `units.json` · `converters.ts` · `turn-economy.ts` · `tech.json`.
>
> **Metoda:** dla każdego wpisu surowca — kto **zużywa** (konwerter, koszt jednostki, bramka budynku, efekt uboczny). „Osierocony" = **brak zużycia materiałowego** w v0.1 (efekt yield OK).

---

## Tabela 1 — TYP 1 Teren / TYP 2 Miasto (po korekcie)

### TYP 1 — teren (magazyn surowców A)

| Surowiec | Źródło | Ulepszenie wymagane | Epoka widoczności | Uwaga |
|---|---|---|---|---|
| **Żywność** | plony lądu | *(brak — wyjątek)* | 1 | Ulepszenia tylko **zwiększają** ilość |
| **Drewno** | las | Tartak | 1 | Wyrąb = jednorazowy |
| **Kamień** | wzgórza/góry | Kamieniołom | 1 | Bez złoża |
| **Glina** | złoże glina | Glinianka | 2 | 2/t z ulepszenia |
| **Ruda miedzi** | złoże miedz (wzgórza) | Kopalnia miedzi | 2 | Klucz legacy: `ruda` |
| **Ruda żelaza** | złoże zelazo (góry) | Kopalnia | 3 | Osobne od miedzi |
| **Sól** | złoże sol (**wybrzeże**) | Warzelnia soli | 2 | Brak w `resources.json` |
| **Koń** | złoże kon | Stadnina + Jeździectwo | 2 | **Złoże**, nie hodowla |

**Ulepszenia terenu (NIE surowce magazynu):**

| Ulepszenie | Bonus pola | Odblokowuje imperium |
|---|---|---|
| **Trzoda** | +2🍞, +3🔨 | pierwsze na złożu trzody → hodowla civ-wide |
| **Owce** | +1🍞, +2🔨 | pierwsze na złożu owiec |
| **Lama** | +1🍞, +3🔨 | tylko Inkowie; pierwsze na złożu lamy |

**Poza v0.1:** Węgiel (XVIII w.) — nie w tabeli.

### TYP 2 — miasto (magazyn surowców B)

| Surowiec | Budynek | Receptura (kanon) | Łańcuch |
|---|---|---|---|
| **Deski** | Stolarnia | 1 drewno → 1 deska | drewno (A) |
| **Paliwo** | Mielerz | **2 drewno → 1 paliwo** | drewno (A) |
| **Cegła** | Cegielnia | **2 glina + 1 paliwo → 1 cegła** | glina (A) + paliwo (B) |
| **Ceramika** | Garncarnia | 1 glina + 1 paliwo → 1 ceramika | glina (A) + paliwo (B) → **Spichlerz** (bramka) |
| **Brąz** | Piec hutniczy | 1 ruda miedzi + 1 paliwo → 1 brąz | ruda miedzi (A) |
| **Żelazo** | Odlewnia żelaza | 1 ruda żelaza + 1 paliwo → 1 żelazo | ruda żelaza (A) |
| **Stal** | Wielka kuźnia | 1 żelazo + 1 paliwo → 1 stal | żelazo (B); epoka **Klasyczna** |

---

## Tabela 2 — Surowce osierocone (audyt v0.1)

| Surowiec | Co go **produkuje** | Co go **zużywa dziś** | Werdykt |
|---|---|---|---|
| **Żywność** | pola, ulepszenia | konsumpcja ludność + jednostki | ✅ używany |
| **Drewno** | tartak | Mielerz, Stolarnia; **5 jednostek** (łucznik, proca…) | ✅ używany |
| **Kamień** | kamieniołom | bramka **Warsztat kamieniarski** (`kamien w zasięgu`); **brak kosztu materiałowego** | ⚠️ **osierocony** jako materiał (faza 3: mury) |
| **Glina** | glinianka | Cegielnia, Garncarnia | ✅ używany |
| **Ruda** (miedź) | kopalnia miedzi | Piec hutniczy (`huta`, `odlewnia_brazu`) | ✅ używany |
| **Koń** | stadnina | **8 typów jednostek** konnych + rydwany konne | ✅ używany |
| **Deski** | stolarnia | **Galera** (1 jednostka, 4 deski) | ⚠️ **słabo używany** — brak innych konsumentów |
| **Paliwo** | mielerz | wejście Cegielni, Garncarni, Huty (łańcuch) | ✅ pośrednik (nie orphan) |
| **Cegła** | cegielnia | **brak** — Pismo wymaga **budynku** Cegielnia, nie surowca cegła | 🔴 **osierocony** |
| **Ceramika** | garncarnia | **bramka Spichlerz** (`spichlerz`) — kanon Macieja 2026-07-22; efekt zdrowia = wtórny (bug: id `ceramika` vs `garncarnia` w `turn-economy.ts`) | ✅ **przypisany** (bramka faza 2 — **nie wdrożone** w kodzie) |
| **Brąz** | piec hutniczy | **19 jednostek** | ✅ używany |
| **Żelazo** | odlewnia żelaza *(brak receptury)* | **25 jednostek**; bramka Kuźnia żelaza | ✅ używany (jednostki); produkcja niepełna |
| **Stal** | wielka kuźnia *(brak receptury)* | bramka Wielka Kuźnia; **0 jednostek** z kosztem stal | 🔴 **osierocony** |
| **Sól** | warzelnia *(brak wpisu resources)* | handel dyplomacyjny (`sol: 50`); **brak konsumenta gameplay** | 🔴 **osierocony** + brak w JSON |
| **Bydło / Owce / Lama** | — (to ulepszenia) | wpisy legacy w `resources.json`; Rydwan: koszt `bydlo` | 🗑️ **wycofać z surowców** |
| **Węgiel** | — | generator mapy only | ⏸️ **poza v0.1** |

**Podsumowanie osieroconych (materiał):** Cegła · Stal · Sól · Kamień (częściowo) · Deski (częściowo). ~~Ceramika~~ → **Spichlerz** (rozstrzygnięte 2026-07-22).

---

## Tabela 3 — Przyszłe użycie (polityka surowcowa, faza 3)

| Surowiec | Konwertery (wejście → wyjście) | Budynki (przyszły koszt materiałowy) | Jednostki (`units.json`) | Brak zastosowania / do decyzji Macieja |
|---|---|---|---|---|
| **Żywność** | — (TYP 1) | Spichlerz (magazyn 🍞; **wymaga ceramiki** — bramka budowy) | utrzymanie wszystkich | — |
| **Drewno** | → deski, paliwo | Stolarnia, Mielerz (bramka las) | Łucznik, Proca, Łucznik kompozytowy, Katapulta… (**5**) | — |
| **Kamień** | — | **Mury**, Warsztat kamieniarski, Kamienne kręgi, Cytadela | *(brak dziś)* | **Przypisać:** koszt murów / fortyfikacji |
| **Glina** | → cegła, ceramika (via paliwo) | Cegielnia, Garncarnia | *(brak dziś)* | — |
| **Ruda miedzi** | → brąz | Piec hutniczy, Kuźnia (bramka) | pośrednio → brąz | — |
| **Ruda żelaza** | → żelazo *(do wdrożenia)* | Odlewnia żelaza | pośrednio → żelazo | — |
| **Sól** | — | konserwacja / handel | *(brak)* | **Przypisać:** żywność+?, luksus, dyplomacja |
| **Koń** | — | Stadnina (bramka) | Konnica, Rydwan konny, Konnica Xiongnu… (**8**) | — |
| **Deski** | drewno → deski | Stolarnia, Port (?) | **Galera** (4) | **Przypisać:** statki, molo, palisada? |
| **Paliwo** | drewno → paliwo | Mielerz | pośrednik | — |
| **Cegła** | 2 glina + 1 paliwo → cegła | **Pismo** (bramka Cegielnia imperium) | *(brak)* | **Przypisać:** mury ceglane, agora, świątynie |
| **Ceramika** | glina + paliwo → ceramika | **Spichlerz** (twarda bramka budowy); Garncarnia (+zdrowie wtórne) | *(brak)* | **✅ Rozstrzygnięte** (Maciej 2026-07-22) |
| **Brąz** | ruda + paliwo → brąz | Piec hutniczy, Kuźnia | Hoplita, Falanga, Khopesh… (**19**) | — |
| **Żelazo** | ruda żelaza + paliwo → żelazo | Odlewnia, Kuźnia żelaza | Legion, Pretorian, Gaesatae… (**25**) | — |
| **Stal** | żelazo + paliwo → stal | Wielka Kuźnia (**epoka?**) | tech zapowiada elitę żelazną — **0 z kosztem stal dziś** | **Decyzja ABC:** epoka Klasyczna vs JSON ep.4; kto zużywa stal? |
| **Trzoda/Owce/Lama** | — (ulepszenia) | — | Rydwan (woły): **przepiąć** na dostęp Trzody | Nie surowce |
| **Węgiel** | — | — | — | **Odłożone** XVIII w. |

### Łańcuchy konwerterów (docelowa kolejność tury)

```
drewno ──→ deski ──→ (statki faza 3)
    └──→ paliwo ──┬→ cegła (2 glina + 1 paliwo)
                  ├→ ceramika ──→ Spichlerz (bramka budowy)
                  ├→ brąz (ruda miedzi)
                  ├→ żelazo (ruda żelaza)
                  └→ stal (żelazo)
```

### Niespójności danych → backlog wdrożenia

| Plik | Problem |
|---|---|
| `resources.json` | Bydło, Owce, Lama jako surowce; brak Soli; Koń Typ=`hodowla` |
| `converters.ts` | Cegła 1+1; Mielerz 1→1; brak odlewnia_zelaza, wielka_kuznia |
| `units.json` | Rydwan koszt `bydlo` (powinno: bramka Trzoda) |
| `buildings.json` | `wielka_kuznia` epoka 4 vs stal epoka Klasyczna; **`spichlerz` brak bramki ceramiki** (kanon: twarda bramka faza 2) |
| `building-resource-gate.ts` | brak wpisu `spichlerz` → ceramika (wzorzec: `garncarnia` → Glina) |
| `terrain-improvements.json` | Sól: warunek nie ogranicza do wybrzeża w tekście terenu |
| `turn-economy.ts` | `builtIds.includes('ceramika')` — powinno `garncarnia` |
| `map-gen-params.json` | Spawn węgla — OK technicznie, gameplay off |

---

## Audyt ceramika / cegła / sól (2026-07-22 — pełna mapa powiązań)

> **Zakres:** read-only · `resources.json`, `buildings.json`, `terrain-improvements.json`, `units.json`, `tech.json`, `converters.ts`, `turn-economy.ts`, `economy.ts`, `production.ts`, `resource-access.ts`, `diplomacy-deposit-trade.ts`, `cityPanel.ts`, `building-resource-gate.ts`, `Spec-ekonomia.md`, `docs/decyzje/*`.  
> **Wniosek wspólny:** w v0.1 **żaden z trzech surowców nie ma konsumenta materiałowego** w `units.json` ani kosztu materiałowego budynków; efekty idą przez **budynki** (Cegielnia, Garncarnia) lub **plon ulepszenia** (warzelnia), nie przez zużycie stocku w magazynie.

### 1. Ceramika

| Warstwa | Połączenie | Status |
|---|---|---|
| **Producent** | Garncarnia (`converters.ts`): 1 glina + 1 paliwo → 1 ceramika, max **1/t** | ✅ |
| **Wejście** | Glina (glinianka 2/t) + Paliwo (Mielerz) | ✅ |
| **Bramka budynku** | Tech Garncarstwo; aktywna Glina (`building-resource-gate.ts`) | ✅ |
| **Magazyn** | `city.surowce.ceramika` — rośnie co turę | ⚠️ bez konsumenta |
| **Konsument materiałowy** | **Brak** w units/buildings/production | 🔴 osierocony |
| **Spichlerz (plan)** | Diagram § łańcuch konwerterów: bramka ceramika → Spichlerz; **kod:** brak wpisu w `building-resource-gate.ts`, brak `wymaganySurowiec` w `buildings.json` | ⏸️ plan faza 2, nie wdrożone |
| **Odlewnia żelaza / stal** | `odlewnia_zelaza`, `kuznia_zelaza`, `wielka_kuznia` — **zero** ceramiki | ❌ hipoteza hutnicza **niepotwierdzona** |
| **Tech Pismo / Religia** | „Dostęp do surowca.: Ceramika" — etykieta; bramka = **Cegielnia** imperium (ABC-8) | ⚠️ mylące |
| **Zdrowie** | `turn-economy.ts`: `builtIds.includes('ceramika')` + `zdrowie_ceramika` (+1 normal) | 🔴 **martwe** — id budynku = `garncarnia` |
| **Szczęście** | Garncarnia `zadowolenie: 0`; `types/city.ts` wymienia ceramikę — brak kodu | 🔴 |
| **Kultura** | Garncarnia `baza.kultura: 1` | ✅ (budynek) |
| **Handel** | D3-W11: przetworzone poza v1.0 | ⏸️ |

### 2. Cegła

| Warstwa | Połączenie | Status |
|---|---|---|
| **Producent** | Cegielnia: kod **1+1** → cegła, max 2/t; kanon **2 glina + 1 paliwo** | ⚠️ rozbieżność |
| **Efekt budynku** | **+25% Pracy** lokalnie (`economy.ts`, `maCegielnia`) — **nie zużywa cegły** | ✅ |
| **Magazyn** | `city.surowce.cegla` — rośnie bez konsumenta | 🔴 osierocony |
| **Tech Pismo / Religia** | `wymagany budynek: Cegielnia` — bramka **budynku**, nie stocku (ABC-8) | ✅ |
| **Tech Budownictwo** | „Dostęp do surowca.: cegła" — etykieta; Mury/Akwedukt **bez kosztu cegły dziś** | ⏸️ faza 3 |
| **Zdrowie / szczęście** | Brak | ❌ |
| **Handel** | D3-W11 — poza v1.0 | ⏸️ |

### 3. Sól

| Warstwa | Połączenie | Status |
|---|---|---|
| **resources.json** | Brak wpisu Sól | 🔴 |
| **Złoże mapy** | `gen-helpers.ts`: Pustynia/Równina (nie wybrzeże w spawnie) | ⚠️ vs kanon „tylko wybrzeże" |
| **Ulepszenie** | `warzelnia_soli`: Garncarstwo, 20 pracy | ✅ |
| **Warunek** | Złoże `sol` **lub** Wybrzeże (`resource-access.ts`, `improvement-build.ts`) | ✅ w kodzie |
| **Plon** | **+1 ¤, +1 🍞** na heksie — **nie** magazyn soli | ✅ yield bezpośredni |
| **Magazyn / konwerter** | Brak | — |
| **Handel dyplomacyjny** | `sol: 50` PN (`diplomacy.json`, `diplomacy-deposit-trade.ts`) | ✅ dostęp do hex |
| **Zdrowie / szczęście** | Brak (pomysł Macieja: konserwacja — nie wdrożony) | 🔴 do decyzji |

### 4. Werdykt A / B / C

| Surowiec | **A** welfare | **B** budynki/jednostki faza 3 | **C** wyciąć |
|---|---|---|---|
| **Ceramika** | Naprawić bug zdrowia na `garncarnia`; opcj. szczęście | Garncarnia + kultura; ceramika = koszt Spichlerz/Mury?; **nie** do hut | Usunąć garncarnia + konwerter |
| **Cegła** | Niski sens | Cegielnia (Pismo, +25% Pracy); cegła = koszt Mury faza 3 | Wymaga przepięcia Pismo |
| **Sól** | Zdrowie+szczęście z warzelni; złoże tylko wybrzeże | Warzelnia = +1🍞/¤ + handel złożem | Usunąć warzelnia + złoże |

### 5. Rekomendacja Mastera

| Surowiec | Jedna linia |
|---|---|
| **Ceramika** | **B** — Garncarnia zostaje; naprawić zdrowie na budynku `garncarnia`; materiał pod Spichlerz/koszty fazy 3; **nie** do hut żelaza. |
| **Cegła** | **B** — Cegielnia zostaje (Pismo, +25% Pracy); cegła = koszt budynków faza 3; zero welfare ze stocku. |
| **Sól** | **A uproszczone** — efekt zdrowie+szczęście z warzelni (bez magazynu soli) + złoże tylko wybrzeże; alt. **B** jeśli wystarczy +1🍞/¤. |

---

*Plik: `dyspozycje/SUROWCE-KANON-2026-07-22.md` · v3 audyt ceramika/cegła/sól: 2026-07-22 · bez implementacji kodu.*
