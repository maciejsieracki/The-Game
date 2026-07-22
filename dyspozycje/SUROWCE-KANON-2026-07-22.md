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
| 8 | **Ceramika** | Pierwszy kandydat **osierocony**: produkowana w Garncarni, **nic jej dziś nie zużywa** jako materiał (tylko efekt uboczny zdrowia — patrz audyt §2). | `turn-economy.ts` sprawdza budynek `ceramika` (id nie istnieje — powinno `garncarnia`). |

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
| **Ceramika** | **Garncarnia** | 1 glina + 1 paliwo | 1 ceramika | max **1/t** [PT] | **Osierocona** jako materiał (§2). |
| **Brąz** | **Piec hutniczy** (`odlewnia_brazu`) | 1 ruda miedzi + 1 paliwo | 1 brąz | max **1/t** [PT] | AND-gate: kopalnia miedzi (mapa) + piec w mieście. |
| **Żelazo** | **Odlewnia żelaza** | 1 ruda żelaza + 1 paliwo | 1 żelazo | max **1/t** [PT] | AND-gate: kopalnia na złożu + odlewnia. Receptura **brak** w `converters.ts` — placeholder. |
| **Stal** | **Wielka kuźnia** | 1 żelazo + 1 paliwo | 1 stal | max **1/t** [PT] | Epoka **Klasyczna** (decyzja Macieja). **Flaga:** `epokaWejscia:4` w JSON vs tech ep.3. Receptura **brak** w `converters.ts`. |

**Łańcuch brązu:** ruda miedzi (teren) → brąz (miasto).  
**Łańcuch żelaza:** ruda żelaza (teren) → żelazo (miasto) → stal (miasto, epoka Klasyczna).

**Dwa niezależne drzewka budynków żelaza (stan 2026-07-19):**
- `odlewnia_brazu` → `odlewnia_zelaza` (produkcja żelaza)
- `kuznia_zelaza` → `wielka_kuznia` (mnożnik wojska + stal)

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
| **2 — bramki budynków** | receptury 2 drewno→paliwo, **2 glina+1 paliwo→cegła**; pełne zbieranie rud; odlewnia żelaza + wielka kuźnia w `converters.ts` | **KOLEJNY KROK** |
| **3 — magazyny + koszty** | magazyn ×5 per typ; koszty jednostek/budynków z A i B; spichlerz=🍞 | **PLAN** |

---

## E. Otwarte doprecyzowania

1. **Wyjątek żywności w kodzie** — `resource-access.ts` stosuje regułę ulepszenia także dla 🍞.
2. **Stal vs Wielka Kuźnia** — epoka Klasyczna (Maciej) vs `epokaWejscia:4` vs tech ep.3 — **decyzja ABC**.
3. **Legacy `Ruda`** — migracja kluczy `ruda_miedzi` / `ruda_zelaza`.
4. **Sól** — dodać do `resources.json`; generator tylko wybrzeże.
5. **Ceramika / Cegła / Kamień / Deski** — przypisać konsumentów fazy 3 (§3).
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
| **Ceramika** | Garncarnia | 1 glina + 1 paliwo → 1 ceramika | glina (A) + paliwo (B) |
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
| **Ceramika** | garncarnia | **brak kosztu materiałowego**; efekt zdrowia przez budynek (bug: id `ceramika` vs `garncarnia`) | 🔴 **osierocony** (materiał) |
| **Brąz** | piec hutniczy | **19 jednostek** | ✅ używany |
| **Żelazo** | odlewnia żelaza *(brak receptury)* | **25 jednostek**; bramka Kuźnia żelaza | ✅ używany (jednostki); produkcja niepełna |
| **Stal** | wielka kuźnia *(brak receptury)* | bramka Wielka Kuźnia; **0 jednostek** z kosztem stal | 🔴 **osierocony** |
| **Sól** | warzelnia *(brak wpisu resources)* | handel dyplomacyjny (`sol: 50`); **brak konsumenta gameplay** | 🔴 **osierocony** + brak w JSON |
| **Bydło / Owce / Lama** | — (to ulepszenia) | wpisy legacy w `resources.json`; Rydwan: koszt `bydlo` | 🗑️ **wycofać z surowców** |
| **Węgiel** | — | generator mapy only | ⏸️ **poza v0.1** |

**Podsumowanie osieroconych (materiał):** Ceramika · Cegła · Stal · Sól · Kamień (częściowo) · Deski (częściowo).

---

## Tabela 3 — Przyszłe użycie (polityka surowcowa, faza 3)

| Surowiec | Konwertery (wejście → wyjście) | Budynki (przyszły koszt materiałowy) | Jednostki (`units.json`) | Brak zastosowania / do decyzji Macieja |
|---|---|---|---|---|
| **Żywność** | — (TYP 1) | Spichlerz (magazyn osobno) | utrzymanie wszystkich | — |
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
| **Ceramika** | glina + paliwo → ceramika | Garncarnia (+zdrowie) | *(brak)* | **Decyzja:** luksus, handel, happiness, tech? |
| **Brąz** | ruda + paliwo → brąz | Piec hutniczy, Kuźnia | Hoplita, Falanga, Khopesh… (**19**) | — |
| **Żelazo** | ruda żelaza + paliwo → żelazo | Odlewnia, Kuźnia żelaza | Legion, Pretorian, Gaesatae… (**25**) | — |
| **Stal** | żelazo + paliwo → stal | Wielka Kuźnia (**epoka?**) | tech zapowiada elitę żelazną — **0 z kosztem stal dziś** | **Decyzja ABC:** epoka Klasyczna vs JSON ep.4; kto zużywa stal? |
| **Trzoda/Owce/Lama** | — (ulepszenia) | — | Rydwan (woły): **przepiąć** na dostęp Trzody | Nie surowce |
| **Węgiel** | — | — | — | **Odłożone** XVIII w. |

### Łańcuchy konwerterów (docelowa kolejność tury)

```
drewno ──→ deski ──→ (statki faza 3)
    └──→ paliwo ──┬→ cegła (2 glina + 1 paliwo)
                  ├→ ceramika
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
| `buildings.json` | `wielka_kuznia` epoka 4 vs stal epoka Klasyczna |
| `terrain-improvements.json` | Sól: warunek nie ogranicza do wybrzeża w tekście terenu |
| `turn-economy.ts` | `builtIds.includes('ceramika')` — powinno `garncarnia` |
| `map-gen-params.json` | Spawn węgla — OK technicznie, gameplay off |

---

*Plik: `dyspozycje/SUROWCE-KANON-2026-07-22.md` · v2 audyt: 2026-07-22 wieczór · bez implementacji kodu (tylko dokumentacja).*
