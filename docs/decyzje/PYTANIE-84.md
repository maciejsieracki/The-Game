# PYTANIE 84 — Magazyn państwa i budynki surowcowe

**Status:** 🔵 **W TRAKCIE** — rdzeń R1–R3 + D1 + D3 + Q5 wdrożony w `turn-economy.ts` / `converters.ts` / `building-stock-cost.ts` / `building-resource-gate.ts` (2026-07-27); R4–R10 / U-5…U-25 czekają kolejnych fal  
**Data:** 2026-07-27

## Kanon przepływu (Maciej 2026-07-27 — nadrzędny nad wcześniejszymi paczkami Q1–Q6)

> Z każdej kopalni surowce **najpierw idą do magazynu państwa**, potem budynki **pobierają z magazynu państwa** dokładnie tyle, ile mają w recepturze (np. 1 Ruda + 1 Drewno → magazyn maleje → 1 Brąz).

Wcześniejsze odpowiedzi Q1=B („stałe X/turę”) i hybryda DOSTĘP/MAGAZYN z początku dnia — **zastąpione** tam, gdzie sprzeczne z R1–R3 (patrz niżej).

## Status wdrożenia

| Etap | Stan |
|------|------|
| **Decyzje** | R1–R8 ✅ · **R9–R10 (Q9–Q10)** ✅ |
| **Kod rdzeń** | ✅ R1–R3 + D1 + D3 + Q5 — pipeline magazynu państwa (`tickEmpireResourcePipeline`) |
| **Kod reszta** | ❌ R4–R10, Spichlerz drain, handel szlaków — kolejne fale |
| **Deploy** | FALA 40 bez pełnego 84 |

---

## Rewizja R1–R3 (2026-07-27)

| ID | Odpowiedź | Skutek w grze |
|----|-----------|---------------|
| **PYTANIE-84-R1** | **A** | **Wyłącznie magazyn państwa** — kopalnie/ulepszenia wpływają do puli imperium; budynki przetwarzające pobierają wejście **tylko stamtąd** i odkładają produkt **tam samo** (jeden skarbiec państwa). |
| **PYTANIE-84-R2** | **A** | **Kolejność tury:** (1) wpływ z mapy do magazynu państwa, (2) potem budynki pobierają wg receptury × przepustowość (w tej samej turze widać świeżą rudę). |
| **PYTANIE-84-R3** | **B** | **Wszystko ze skarbca** — budynek z recepturą działa, dopóki w magazynie państwa starcza wejść; brak kopalni na mapie **nie blokuje**, jeśli jest zapas. |

### Paczka 2/2 (2026-07-27) — cytaty Macieja

| ID | Odpowiedź | Skutek w grze |
|----|-----------|---------------|
| **PYTANIE-84-R4** | **A** | **Złoto, Sól, Koń** — jak Ruda/Drewno: **magazyn państwa**; Mennica / Spichlerz II / konnica ze skarbca (wpływ z mapy/handelu → pula). |
| **PYTANIE-84-R5** | **A** (zaktualiz.) | **Stolarnia:** **+10% na wpływie** drewna do magazynu państwa z mapy; **kumulacja addytywna** per Stolarnia (D2). Nie pobiera ze skarbca. |
| **PYTANIE-84-R6** | **B** | **Ceramika w magazynie państwa** (jak Cegła): Garncarnia zużywa Glinę ze skarbca → **Ceramika +1** w puli; Spichlerz wymaga **Ceramiki > 0** w magazynie (R3=B). |

### Doprecyzowanie magazynu i Stolarni (Maciej 2026-07-27)

| ID | Odpowiedź | Skutek w grze |
|----|-----------|---------------|
| **PYTANIE-84-D1** | **B** (doprecyz.) | **Jeden magazyn państwa** (suma zapasów imperium) — **nie** osobne bufory produkcyjne per miasto. Budynek **Magazyn** w mieście **zwiększa pojemność** całej puli państwa (+100/szt. Magazynu przy bazie 500 — już w `economy-upkeep.ts`). |
| **PYTANIE-84-D2** | **kumulacja** | Każda **Stolarnia** daje **+10% Drewna** (addytywnie: 2→+20%, 3→+30%) na **wpływie do magazynu państwa** z źródeł mapy (**Las, Tartak** — nie „kopalnia"). Warsztat kamieniarski — **analogicznie +10%/szt. na Kamień** (do potwierdzenia przy wdrożeniu). |
| **PYTANIE-84-D3** | **A** | **Koszt budowy** (`koszt_surowce`) i **rekrutacja jednostek** — zawsze z **magazynu państwa** (pula imperium), jak produkcja konwerterów. |

### Nadal obowiązuje (jeśli nie sprzeczne z R3=B)

| ID | Odpowiedź | Uwaga |
|----|-----------|--------|
| **PYTANIE-84-Q3** | **B** | Kuźnie **bez** pobierania surowców — tylko bonus Pancerza po zbudowaniu. |
| **PYTANIE-84-Q5** | **A** | Odlewnie w łańcuchu przetwarzania — pobierają Ruda/Ruda żelaza/Drewno z magazynu państwa wg receptury. |

### Zastąpione (archiwum)

- ~~Hybryda DOSTĘP~~ → **R3=B + R4=A** (wszystko ze skarbca, w tym Złoto/Sól/Koń)
- ~~Q1 stałe X/turę~~ → receptura × przepustowość z magazynu państwa
- ~~Ceramika tylko dostęp~~ → **R6=B** (stock) + **R7=B+C** (zużycie)

### Q7–Q8 — zużycie Ceramiki i Soli (Maciej 2026-07-27)

| ID | Pytanie | Odpowiedź | Kanon (skutek w grze) |
|----|---------|-----------|------------------------|
| **PYTANIE-84-R7** | **Q7** Ceramika | **B + C** | **B:** **Spichlerz** (I/II) zużywa Ceramikę z magazynu (B6/B8). **Garncarnia nie zużywa Ceramiki** — tylko produkuje (U-14). **C:** Garncarnia — osobne efekty dla ludności (+Zdrowie/+Zadowolenie), mechanika przy wdrożeniu. |
| **PYTANIE-84-R8** | **Q8** Sól | **A** (rozszerz.) | **Produkcja:** Warzelnia soli → **Sól/turę** do magazynu państwa (stawka do balansu). **Zużycie:** każdy **aktywny** Spichlerz II zużywa **5 Soli/turę** ze skarbca (gdy brak Soli → Spichlerz II **wygaszony**, brak bonusów). **Bonusy przy działającym Spichlerzu II** (≥1 w imperium, nie wygaszony, dostęp do Soli): dotychczasowe (cap armii 150, bufor 70% po wzroście ludności, +Żywność/+Zadowolenie z JSON) **+ nowe:** **+5 Zdrowia** (miasto ze Spichlerzem II) · **uchwała cywilizacyjna** w UI (perk imperium widoczny, gdy działa) · **połowa zużycia żywności przez ludność** w miastach (**1 → 0,5** jednostki żywności/os./turę) · **połowa żywności armii poza własnym terytorium** (**2 → 1** jednostki żywności/jednostkę/turę — dziś: baza 1 × mnożnik poza terytorium 2,0). Efekt: mniej żywności na wojsko i ludzi → szybszy wzrost bufora/miasta. |

**Cytat Macieja (Q8):** „Spichlerz II zjada 5 szt na turę i wtedy daję dotychczasowy bonus plus 5 do zdrowia + uchwałę cywilizacyjną… armia na zewnątrz nie zużywa dwóch jednostek jedzenia tylko jedną… ludność… pół jednostki."

**Otwarte do balansu (nie blokuje zapisu):** stawka Soli z warzelni/turę; stawka Ceramiki/turę (R7-B); dokładny mechanizm R7-C (auto vs suwak); **stawka Złota/turę** z kopalni i **1:1 z Mennicą** (R9); **produkcja Koni/turę** ze stadniny (R10).

### Q9–Q10 — Złoto i Koń (Maciej 2026-07-27)

| ID | Pytanie | Odpowiedź | Kanon (skutek w grze) |
|----|---------|-----------|------------------------|
| **PYTANIE-84-R9** | **Q9** Złoto | **A** | **Kopalnia złota** → **Złoto/turę** do magazynu państwa. **Mennica** (Waluta + Targowisko w stolicy + dostęp do złota): zużywa **Złoto/turę** ze skarbca, gdy działa mnożnik handlu→Pieniądz. UI: **„Złoto (surowiec)"** ≠ **„Pieniądz (skarbiec)"**. Stawki produkcji/zużycia — balans przy `działaj`. |
| **PYTANIE-84-R10** | **Q10** Koń | **A** (doprecyz.) | **Stadnina** → **Koń/turę** do magazynu państwa. Jednostki jezdne (Konnica, rydwany konne, ulepszenia po Jeździectwie): przy rekrutacji **+5 Koni** ze skarbca państwa (obok Brązu/Żelazo z `units.json`). Bez 5 Koni w puli — brak rekrutu (R3=B). |

**Cytat Macieja (Q10):** „Q10 A — **5 koni za jednostkę** przy rekrutacji."

### Uzupełnienia przed wdrożeniem — U-1…U-3 (Maciej 2026-07-27)

| ID | Odpowiedź | Kanon |
|----|-----------|--------|
| **PYTANIE-84-U1** | **B** → **zastąpione U-5…U-12** | Archiwum: ½ żywności + +5 Zdrowia przy II — **zastąpione** modelem Ceramika/Sól (U-5…U-12, 2026-07-27). |
| **PYTANIE-84-U2** | **A** | **Sól:** zużycie **5 Soli/turę × każdy Spichlerz II**, który **płaci Sól** (armia). Brak Soli w skarbcu → **brak bonusu wojska** (nie „wygasza” całego budynku). |
| **PYTANIE-84-U3** | **A** | **Handel (szlaki):** Złoto / Sól / Koń (i spójnie z R4=A) — szlaki dostarczają **sztuki do magazynu państwa co turę**, nie tylko flagę dostępu. Własna kopalnia/warzelnia/stadnina nadal produkuje z mapy. |

**Balans (osobno):** stawki produkcji z terenu/miasta i zużycia w innych budynkach — **do dostrojenia** w JSON (`terrain-improvements.json`, `econ-params.json`, `buildings.json`); mechanika wdrożenia ≠ zamrożone liczby w kodzie TS.

### Balans — liczby startowe (Maciej 2026-07-27)

| ID | Źródło / budynek | Parametr | Wartość |
|----|------------------|----------|---------|
| **PYTANIE-84-B1** | **Glinianka** (teren) | `surowiec_ilosc_tura` glina | **20**/turę (U-18/U-19) |
| **PYTANIE-84-B2** | **Warzelnia soli** (teren) | Sól do magazynu państwa | **10**/turę |
| **PYTANIE-84-B3** | **Stadnina** (teren) | Koń do magazynu państwa | **1**/turę |
| **PYTANIE-84-B4** | **Kopalnia złota** (teren) | Złoto do magazynu państwa | **1**/turę |
| **PYTANIE-84-B5** | **Garncarnia** (miasto) | przepustowość konwertera Ceramika | **6**/turę (receptura: Glina+Drewno → Ceramika, R6=B) |
| **PYTANIE-84-B6** | **Spichlerz I** (miasto) | zużycie Ceramiki/turę ze skarbca | **5**/turę |
| **PYTANIE-84-B7** | **Spichlerz II** (miasto) | zużycie Soli/turę | **5**/turę (× liczba działających, U-2=A) |
| **PYTANIE-84-B8** | **Spichlerz II** (miasto) | zużycie Ceramiki/turę | **5**/turę |
| **PYTANIE-84-B9** | **Tartak** (teren) | `surowiec_ilosc_tura` drewno | **20**/turę (U-18) |

**U-4 domknięte przez B6–B8:** Spichlerz **I** = tylko Ceramika; Spichlerz **II** = Sól **+** Ceramika (oba drainy co turę).

### Spichlerz — model Ceramika / Sól (Maciej 2026-07-27, U-5…U-12)

| ID | Odpowiedź | Kanon |
|----|-----------|--------|
| **PYTANIE-84-U5** | **model** | **Dwa niezależne tory:** **Ceramika** → bonus **ludności** (tylko w **tym mieście**). **Sól** → bonus **wojska** (**imperium-wide** — wystarczy **≥1** Spichlerz II płacący 5 Soli/t). Brak Ceramiki → **zero** bonusu ludności. Brak Soli → **zero** bonusu wojska. |
| **PYTANIE-84-U10** | **B** | **Wojsko:** gdy ≥1 Spichlerz II płaci Sól → żywność armii **poza własnym terytorium 2→1** (imperium-wide). Garnizon w mieście płacącym Sól: **½ żywności** (jak U-10B). |
| **PYTANIE-84-U11** | **B** | **Awans bez Soli:** Spichlerz II **bez Soli** działa jak **Spichlerz I** — płaci 5 Ceramiki/t → bonus ludności w mieście; **bez** bonusu wojska do czasu Soli. |
| **PYTANIE-84-U12** | **zdrowie** | **Spichlerz I** (5 Ceramiki/t): **+5 Zdrowia** + **½ żywności ludności** w mieście (U-25B). **Spichlerz II pełny** (oba surowce): **+10 Zdrowia** + **½ żywności ludności** w mieście. |
| **PYTANIE-84-U13** | **A** | **Mennica:** tylko **stolica** (`lokalizacja: stolica`, jedna na cywilizację) — **1 Złoto/turę** ze skarbca przy działającym mnożniku handlu→Pieniądz. **Dodatkowe kopalnie złota** → nadwyżka na **handel/eksport** (nie na drain Mennicy). Złoto **wysoka wartość** na szlakach — do balansu przy wdrożeniu handlu (U-16). |

**Cytat Macieja (U-12):** „5 do zdrowia ze Spichlerza 1 — musi mieć ceramikę. 10 ze Spichlerza 2 — musi mieć oba surowce."

**Cytat Macieja (U-13):** „Mennica tylko w stolicy, potrzebuje jednego złota. Każda dodatkowa kopalnia na handel i eksport — bardzo ważna, sporo warta w handlu."


### Paczka domykająca U-14…U-24 (Maciej 2026-07-27)

| ID | Odpowiedź | Kanon |
|----|-----------|--------|
| **PYTANIE-84-U14** | **R7-C zostaje** | **Garncarnia nie zużywa Ceramiki** — tylko **produkuje**. **R7-C (U-14b=A):** **auto** z nadwyżki Ceramiki w mieście → +Zdrowie / +Zadowolenie. Zużywa Ceramikę wyłącznie **Spichlerz** (B6/B8). |
| **PYTANIE-84-U15** | **A** | Rekrut **+5 Koni:** wszystkie `Typ: Mount`, **oprócz** Rydwan (woły). |
| **PYTANIE-84-U16** | **usunąć cap szlaków** | **Brak** osobnej „przepustowości szlaków" (`capacityPerRoutePerTurn` itd.) — anachronizm. Szlaki (U-3=A) dostarczają surowce do magazynu wg **nowego modelu handlu** (bez limitu trasy); liczy się tylko **produkcja** z mapy/budynków. Złoto — **wysoka wartość** wymiany (U-13). |
| **PYTANIE-84-U17** | **A** | **Warsztat kamieniarski:** +10% Kamienia/szt. na wpływie z mapy (kumulacja addytywna, jak Stolarnia). |
| **PYTANIE-84-U18** | **Tartak 20, Glinianka 20** | **Tartak** → **20** Drewna/turę; **Glinianka** → **20** Gliny/turę (m.in. na Cegielnię + Garncarnię). |
| **PYTANIE-84-U19** | **20** | Bilans przy **20/t** źródłach: **Garncarnia 6/t** (B5) zostaje — wystarczająco na Spichlerz (5 Ceramiki/t) + nadwyżka/handl. |
| **PYTANIE-84-U20** | **A** | Sól, Złoto, Koń **wliczają się** w cap magazynu państwa (baza **500** + **100**×Magazyn). |
| **PYTANIE-84-U21** | **A** | Warzelnia: **10 Soli/t** do magazynu **+** dotychczasowy bonus heksa (+1 Żywność, +1 Pieniądz). |
| **PYTANIE-84-U22** | **B** | **+Zadowolenie** (+2 z JSON Spichlerza II): **tylko lokalnie** w mieście ze **działającym** Spichlerzem II (oba surowce). **Cap zapasów żywności armii** i **bufor wzrostu** — **stare reguły imperium** (patrz U-22 opis poniżej). |
| **PYTANIE-84-U23** | **A** | **Uchwała cywilizacyjna** w UI imperium, gdy działa bonus solny (≥1 Spichlerz II płaci Sól). |
| **PYTANIE-84-U24** | **B** | Budowa Spichlerza I: **bez** bramki „Ceramika ≥ 1"; po postawieniu **drain 5/t** — brak surowca → brak bonusów. |
| **PYTANIE-84-U25** | **B** | **Zdrowie + ½ żywności ludności:** Spichlerz I (Ceramika) → +5 Zdrowia **i** ½ żywności ludności w mieście. Spichlerz II pełny (oba surowce) → +10 Zdrowia **i** ½ żywności ludności w mieście. |
| **PYTANIE-84-U14b** | **A** | **Garncarnia R7-C:** **auto** — nadwyżka Ceramiki w mieście (po drain Spichlerza) → efekt **+Zdrowie** lub **+Zadowolenie** (który efekt — do doprecyzowania liczb przy `działaj`; domyślnie +Zdrowie jeśli jeden). |

**U-22 — co to „cap 150" (NIE limit wielkości armii):**

To **pojemność zapasów żywności państwa** (🍞 w skarbcu imperium na wojsko/wzrost), nie liczba jednostek.

| Tier | Wkład na miasto ze Spichlerzem | Bufor po wzroście ludności |
|------|--------------------------------|----------------------------|
| **Spichlerz I** | **+100** 🍞 (param. `spichlerz_pojemnosc_zapasow_panstwa`, normal) | **50%** bufora zachowane (`spichlerz_zachowanie_po_wzroscie`) |
| **Spichlerz II** | **+150** 🍞 na miasto (kod: `empire-food.ts`) | **70%** bufora (tier II w `turn-economy`) |

Suma po imperium: np. 2× Spichlerz II = **300** 🍞 max w zapasach państwa. Bez Spichlerza: odkładanie **50%** nadwyżki żywności armii, **bez** limitu pojemności.

**Cytaty Macieja (U-14…U-24):** Garncarnia produkuje, nie zużywa Ceramiki; efekty Garncarni zostają. Tartak/Glinianka 20. Usunąć przepustowość szlaków.

**⏸ ODŁOŻONE (Maciej 2026-07-27):** przebudowa **mechaniki surowcowej Spichlerza** — osobna rozmowa później.

**Status paczki U:** U-5…U-25 + U-14b **domknięte** (oprócz ⏸ Spichlerz surowcowy v2).

**Szkic ekonomii (kontrola):** 1 warzelnia (10 Sól/t) ≈ żywi **2** Spichlerze II (2×5 Sól); 1 stadnina (1 Koń/t) = **5 tur** na rekrut jezdny; 1 kopalnia = **1 Złoto/t** na Mennicę; Glinianka+Tartak **20/t** żywią Cegielnię (3/t) i Garncarnię (6/t).

---

## Następny krok

**Fala 2** → R4–R10 (Sól/Złoto/Koń produkcja+drain), Spichlerz Ceramika/Sól, handel szlaków (U-3/U-16); testy + deploy ROBOCZA po Integratorze.
