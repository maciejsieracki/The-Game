# PYTANIE 84 â€” Magazyn paĹ„stwa i budynki surowcowe

**Status:** 🟢 **WDROŻONE Z LUKAMI ZAMKNIĘTYMI** — rdzeń R1–R10 + U-3…U-25 w kodzie; FALA 41 (c1e7a596) + FALA 94 (d776c787). U-25B (racje Spichlerza), Garncarnia +Zadowolenie (R7-C/U-14b), głód 1 tura (P85-Q7) — zweryfikowane w kodzie 2026-07-29.
**Data:** 2026-07-27 Â· audyt kodu: 2026-07-27 23:10

## Kanon przepĹ‚ywu (Maciej 2026-07-27 â€” nadrzÄ™dny nad wczeĹ›niejszymi paczkami Q1â€“Q6)

> Z kaĹĽdej kopalni surowce **najpierw idÄ… do magazynu paĹ„stwa**, potem budynki **pobierajÄ… z magazynu paĹ„stwa** dokĹ‚adnie tyle, ile majÄ… w recepturze (np. 1 Ruda + 1 Drewno â†’ magazyn maleje â†’ 1 BrÄ…z).

WczeĹ›niejsze odpowiedzi Q1=B (â€žstaĹ‚e X/turÄ™â€ť) i hybryda DOSTÄP/MAGAZYN z poczÄ…tku dnia â€” **zastÄ…pione** tam, gdzie sprzeczne z R1â€“R3 (patrz niĹĽej).

## Status wdroĹĽenia

| Etap | Stan |
|------|------|
| **Decyzje** | R1â€“R10 âś… Â· U-1â€¦U-25 (z wyjÄ…tkami poniĹĽej) âś… |
| **Kod rdzeĹ„** | âś… R1â€“R3 + D1â€“D3 + Q5 â€” `tickEmpireResourcePipeline` |
| **Kod reszta** | âś… R4â€“R10, drain Spichlerza, handel szlakĂłw, Stolarnia/Warsztat, Mennica, +5 Koni |
| **Luki kodu** | đźźˇ U-12 pkt Zdrowia (zastÄ…pione P85 wzrost %) Â· đźźˇ U-25B Â˝ ĹĽywnoĹ›ci ludnoĹ›ci Â· đźźˇ R7-C +Zadowolenie Garncarnia |
| **Deploy** | FALA 41 `c1e7a596` (gĹ‚Ăłwny bundel) |

---

## Rewizja R1â€“R3 (2026-07-27)

| ID | OdpowiedĹş | Skutek w grze |
|----|-----------|---------------|
| **PYTANIE-84-R1** | **A** | **WyĹ‚Ä…cznie magazyn paĹ„stwa** â€” kopalnie/ulepszenia wpĹ‚ywajÄ… do puli imperium; budynki przetwarzajÄ…ce pobierajÄ… wejĹ›cie **tylko stamtÄ…d** i odkĹ‚adajÄ… produkt **tam samo** (jeden skarbiec paĹ„stwa). |
| **PYTANIE-84-R2** | **A** | **KolejnoĹ›Ä‡ tury:** (1) wpĹ‚yw z mapy do magazynu paĹ„stwa, (2) potem budynki pobierajÄ… wg receptury Ă— przepustowoĹ›Ä‡ (w tej samej turze widaÄ‡ Ĺ›wieĹĽÄ… rudÄ™). |
| **PYTANIE-84-R3** | **B** | **Wszystko ze skarbca** â€” budynek z recepturÄ… dziaĹ‚a, dopĂłki w magazynie paĹ„stwa starcza wejĹ›Ä‡; brak kopalni na mapie **nie blokuje**, jeĹ›li jest zapas. |

### Paczka 2/2 (2026-07-27) â€” cytaty Macieja

| ID | OdpowiedĹş | Skutek w grze |
|----|-----------|---------------|
| **PYTANIE-84-R4** | **A** | **ZĹ‚oto, SĂłl, KoĹ„** â€” jak Ruda/Drewno: **magazyn paĹ„stwa**; Mennica / Spichlerz II / konnica ze skarbca (wpĹ‚yw z mapy/handelu â†’ pula). |
| **PYTANIE-84-R5** | **A** (zaktualiz.) | **Stolarnia:** **+10% na wpĹ‚ywie** drewna do magazynu paĹ„stwa z mapy; **kumulacja addytywna** per Stolarnia (D2). Nie pobiera ze skarbca. |
| **PYTANIE-84-R6** | **B** | **Ceramika w magazynie paĹ„stwa** (jak CegĹ‚a): Garncarnia zuĹĽywa GlinÄ™ ze skarbca â†’ **Ceramika +1** w puli; Spichlerz wymaga **Ceramiki > 0** w magazynie (R3=B). |

### Doprecyzowanie magazynu i Stolarni (Maciej 2026-07-27)

| ID | OdpowiedĹş | Skutek w grze |
|----|-----------|---------------|
| **PYTANIE-84-D1** | **B** (doprecyz.) | **Jeden magazyn paĹ„stwa** (suma zapasĂłw imperium) â€” **nie** osobne bufory produkcyjne per miasto. Budynek **Magazyn** w mieĹ›cie **zwiÄ™ksza pojemnoĹ›Ä‡** caĹ‚ej puli paĹ„stwa (+100/szt. Magazynu przy bazie 500 â€” juĹĽ w `economy-upkeep.ts`). |
| **PYTANIE-84-D2** | **kumulacja** | KaĹĽda **Stolarnia** daje **+10% Drewna** (addytywnie: 2â†’+20%, 3â†’+30%) na **wpĹ‚ywie do magazynu paĹ„stwa** z ĹşrĂłdeĹ‚ mapy (**Las, Tartak** â€” nie â€žkopalnia"). Warsztat kamieniarski â€” **analogicznie +10%/szt. na KamieĹ„** (do potwierdzenia przy wdroĹĽeniu). |
| **PYTANIE-84-D3** | **A** | **Koszt budowy** (`koszt_surowce`) i **rekrutacja jednostek** â€” zawsze z **magazynu paĹ„stwa** (pula imperium), jak produkcja konwerterĂłw. |

### Nadal obowiÄ…zuje (jeĹ›li nie sprzeczne z R3=B)

| ID | OdpowiedĹş | Uwaga |
|----|-----------|--------|
| **PYTANIE-84-Q3** | **B** | KuĹşnie **bez** pobierania surowcĂłw â€” tylko bonus Pancerza po zbudowaniu. |
| **PYTANIE-84-Q5** | **A** | Odlewnie w Ĺ‚aĹ„cuchu przetwarzania â€” pobierajÄ… Ruda/Ruda ĹĽelaza/Drewno z magazynu paĹ„stwa wg receptury. |

### ZastÄ…pione (archiwum)

- ~~Hybryda DOSTÄP~~ â†’ **R3=B + R4=A** (wszystko ze skarbca, w tym ZĹ‚oto/SĂłl/KoĹ„)
- ~~Q1 staĹ‚e X/turÄ™~~ â†’ receptura Ă— przepustowoĹ›Ä‡ z magazynu paĹ„stwa
- ~~Ceramika tylko dostÄ™p~~ â†’ **R6=B** (stock) + **R7=B+C** (zuĹĽycie)

### Q7â€“Q8 â€” zuĹĽycie Ceramiki i Soli (Maciej 2026-07-27)

| ID | Pytanie | OdpowiedĹş | Kanon (skutek w grze) |
|----|---------|-----------|------------------------|
| **PYTANIE-84-R7** | **Q7** Ceramika | **B + C** | **B:** **Spichlerz** (I/II) zuĹĽywa CeramikÄ™ z magazynu (B6/B8). **Garncarnia nie zuĹĽywa Ceramiki** â€” tylko produkuje (U-14). **C:** Garncarnia â€” osobne efekty dla ludnoĹ›ci (+Zdrowie/+Zadowolenie), mechanika przy wdroĹĽeniu. |
| **PYTANIE-84-R8** | **Q8** SĂłl | **A** (rozszerz.) | **Produkcja:** Warzelnia soli â†’ **SĂłl/turÄ™** do magazynu paĹ„stwa (stawka do balansu). **ZuĹĽycie:** kaĹĽdy **aktywny** Spichlerz II zuĹĽywa **5 Soli/turÄ™** ze skarbca (gdy brak Soli â†’ Spichlerz II **wygaszony**, brak bonusĂłw). **Bonusy przy dziaĹ‚ajÄ…cym Spichlerzu II** (â‰Ą1 w imperium, nie wygaszony, dostÄ™p do Soli): dotychczasowe (cap armii 150, bufor 70% po wzroĹ›cie ludnoĹ›ci, +Ĺ»ywnoĹ›Ä‡/+Zadowolenie z JSON) **+ nowe:** **+5 Zdrowia** (miasto ze Spichlerzem II) Â· **uchwaĹ‚a cywilizacyjna** w UI (perk imperium widoczny, gdy dziaĹ‚a) Â· **poĹ‚owa zuĹĽycia ĹĽywnoĹ›ci przez ludnoĹ›Ä‡** w miastach (**1 â†’ 0,5** jednostki ĹĽywnoĹ›ci/os./turÄ™) Â· **poĹ‚owa ĹĽywnoĹ›ci armii poza wĹ‚asnym terytorium** (**2 â†’ 1** jednostki ĹĽywnoĹ›ci/jednostkÄ™/turÄ™ â€” dziĹ›: baza 1 Ă— mnoĹĽnik poza terytorium 2,0). Efekt: mniej ĹĽywnoĹ›ci na wojsko i ludzi â†’ szybszy wzrost bufora/miasta. |

**Cytat Macieja (Q8):** â€žSpichlerz II zjada 5 szt na turÄ™ i wtedy dajÄ™ dotychczasowy bonus plus 5 do zdrowia + uchwaĹ‚Ä™ cywilizacyjnÄ…â€¦ armia na zewnÄ…trz nie zuĹĽywa dwĂłch jednostek jedzenia tylko jednÄ…â€¦ ludnoĹ›Ä‡â€¦ pĂłĹ‚ jednostki."

**Otwarte do balansu (nie blokuje zapisu):** stawka Soli z warzelni/turÄ™; stawka Ceramiki/turÄ™ (R7-B); dokĹ‚adny mechanizm R7-C (auto vs suwak); **stawka ZĹ‚ota/turÄ™** z kopalni i **1:1 z MennicÄ…** (R9); **produkcja Koni/turÄ™** ze stadniny (R10).

### Q9â€“Q10 â€” ZĹ‚oto i KoĹ„ (Maciej 2026-07-27)

| ID | Pytanie | OdpowiedĹş | Kanon (skutek w grze) |
|----|---------|-----------|------------------------|
| **PYTANIE-84-R9** | **Q9** ZĹ‚oto | **A** | **Kopalnia zĹ‚ota** â†’ **ZĹ‚oto/turÄ™** do magazynu paĹ„stwa. **Mennica** (Waluta + Targowisko w stolicy + dostÄ™p do zĹ‚ota): zuĹĽywa **ZĹ‚oto/turÄ™** ze skarbca, gdy dziaĹ‚a mnoĹĽnik handluâ†’PieniÄ…dz. UI: **â€žZĹ‚oto (surowiec)"** â‰  **â€žPieniÄ…dz (skarbiec)"**. Stawki produkcji/zuĹĽycia â€” balans przy `dziaĹ‚aj`. |
| **PYTANIE-84-R10** | **Q10** KoĹ„ | **A** (doprecyz.) | **Stadnina** â†’ **KoĹ„/turÄ™** do magazynu paĹ„stwa. Jednostki jezdne (Konnica, rydwany konne, ulepszenia po JeĹşdziectwie): przy rekrutacji **+5 Koni** ze skarbca paĹ„stwa (obok BrÄ…zu/Ĺ»elazo z `units.json`). Bez 5 Koni w puli â€” brak rekrutu (R3=B). |

**Cytat Macieja (Q10):** â€žQ10 A â€” **5 koni za jednostkÄ™** przy rekrutacji."

### UzupeĹ‚nienia przed wdroĹĽeniem â€” U-1â€¦U-3 (Maciej 2026-07-27)

| ID | OdpowiedĹş | Kanon |
|----|-----------|--------|
| **PYTANIE-84-U1** | **B** â†’ **zastÄ…pione U-5â€¦U-12** | Archiwum: Â˝ ĹĽywnoĹ›ci + +5 Zdrowia przy II â€” **zastÄ…pione** modelem Ceramika/SĂłl (U-5â€¦U-12, 2026-07-27). |
| **PYTANIE-84-U2** | **A** | **SĂłl:** zuĹĽycie **5 Soli/turÄ™ Ă— kaĹĽdy Spichlerz II**, ktĂłry **pĹ‚aci SĂłl** (armia). Brak Soli w skarbcu â†’ **brak bonusu wojska** (nie â€žwygaszaâ€ť caĹ‚ego budynku). |
| **PYTANIE-84-U3** | **A** | **Handel (szlaki):** ZĹ‚oto / SĂłl / KoĹ„ (i spĂłjnie z R4=A) â€” szlaki dostarczajÄ… **sztuki do magazynu paĹ„stwa co turÄ™**, nie tylko flagÄ™ dostÄ™pu. WĹ‚asna kopalnia/warzelnia/stadnina nadal produkuje z mapy. |

**Balans (osobno):** stawki produkcji z terenu/miasta i zuĹĽycia w innych budynkach â€” **do dostrojenia** w JSON (`terrain-improvements.json`, `econ-params.json`, `buildings.json`); mechanika wdroĹĽenia â‰  zamroĹĽone liczby w kodzie TS.

### Balans â€” liczby startowe (Maciej 2026-07-27)

| ID | ĹąrĂłdĹ‚o / budynek | Parametr | WartoĹ›Ä‡ |
|----|------------------|----------|---------|
| **PYTANIE-84-B1** | **Glinianka** (teren) | `surowiec_ilosc_tura` glina | **15**/turÄ™ (U-18; było 20 → korekta balansu Maciej 2026-07-29) |
| **PYTANIE-84-B2** | **Warzelnia soli** (teren) | SĂłl do magazynu paĹ„stwa | **10**/turÄ™ |
| **PYTANIE-84-B3** | **Stadnina** (teren) | KoĹ„ do magazynu paĹ„stwa | **1**/turÄ™ |
| **PYTANIE-84-B4** | **Kopalnia zĹ‚ota** (teren) | ZĹ‚oto do magazynu paĹ„stwa | **1**/turÄ™ |
| **PYTANIE-84-B5** | **Garncarnia** (miasto) | przepustowoĹ›Ä‡ konwertera Ceramika | **6**/turÄ™ (receptura: Glina+Drewno â†’ Ceramika, R6=B) |
| **PYTANIE-84-B6** | **Spichlerz I** (miasto) | zuĹĽycie Ceramiki/turÄ™ ze skarbca | **5**/turÄ™ |
| **PYTANIE-84-B7** | **Spichlerz II** (miasto) | zuĹĽycie Soli/turÄ™ | **5**/turÄ™ (Ă— liczba dziaĹ‚ajÄ…cych, U-2=A) |
| **PYTANIE-84-B8** | **Spichlerz II** (miasto) | zuĹĽycie Ceramiki/turÄ™ | **5**/turÄ™ |
| **PYTANIE-84-B9** | **Tartak** (teren) | `surowiec_ilosc_tura` drewno | **10**/turÄ™ (U-18; było 20 → korekta balansu Maciej 2026-07-29) |

**U-4 domkniÄ™te przez B6â€“B8:** Spichlerz **I** = tylko Ceramika; Spichlerz **II** = SĂłl **+** Ceramika (oba drainy co turÄ™).

### Spichlerz â€” model Ceramika / SĂłl (Maciej 2026-07-27, U-5â€¦U-12)

| ID | OdpowiedĹş | Kanon |
|----|-----------|--------|
| **PYTANIE-84-U5** | **model** | **Dwa niezaleĹĽne tory:** **Ceramika** â†’ bonus **ludnoĹ›ci** (tylko w **tym mieĹ›cie**). **SĂłl** â†’ bonus **wojska** (**imperium-wide** â€” wystarczy **â‰Ą1** Spichlerz II pĹ‚acÄ…cy 5 Soli/t). Brak Ceramiki â†’ **zero** bonusu ludnoĹ›ci. Brak Soli â†’ **zero** bonusu wojska. |
| **PYTANIE-84-U10** | **B** | **Wojsko:** gdy â‰Ą1 Spichlerz II pĹ‚aci SĂłl â†’ ĹĽywnoĹ›Ä‡ armii **poza wĹ‚asnym terytorium 2â†’1** (imperium-wide). Garnizon w mieĹ›cie pĹ‚acÄ…cym SĂłl: **Â˝ ĹĽywnoĹ›ci** (jak U-10B). |
| **PYTANIE-84-U11** | **B** | **Awans bez Soli:** Spichlerz II **bez Soli** dziaĹ‚a jak **Spichlerz I** â€” pĹ‚aci 5 Ceramiki/t â†’ bonus ludnoĹ›ci w mieĹ›cie; **bez** bonusu wojska do czasu Soli. |
| **PYTANIE-84-U12** | **zdrowie** | **Spichlerz I** (5 Ceramiki/t): **+5 Zdrowia** + **Â˝ ĹĽywnoĹ›ci ludnoĹ›ci** w mieĹ›cie (U-25B). **Spichlerz II peĹ‚ny** (oba surowce): **+10 Zdrowia** + **Â˝ ĹĽywnoĹ›ci ludnoĹ›ci** w mieĹ›cie. |
| **PYTANIE-84-U13** | **A** | **Mennica:** tylko **stolica** (`lokalizacja: stolica`, jedna na cywilizacjÄ™) â€” **1 ZĹ‚oto/turÄ™** ze skarbca przy dziaĹ‚ajÄ…cym mnoĹĽniku handluâ†’PieniÄ…dz. **Dodatkowe kopalnie zĹ‚ota** â†’ nadwyĹĽka na **handel/eksport** (nie na drain Mennicy). ZĹ‚oto **wysoka wartoĹ›Ä‡** na szlakach â€” do balansu przy wdroĹĽeniu handlu (U-16). |

**Cytat Macieja (U-12):** â€ž5 do zdrowia ze Spichlerza 1 â€” musi mieÄ‡ ceramikÄ™. 10 ze Spichlerza 2 â€” musi mieÄ‡ oba surowce."

**Cytat Macieja (U-13):** â€žMennica tylko w stolicy, potrzebuje jednego zĹ‚ota. KaĹĽda dodatkowa kopalnia na handel i eksport â€” bardzo waĹĽna, sporo warta w handlu."


### Paczka domykajÄ…ca U-14â€¦U-24 (Maciej 2026-07-27)

| ID | OdpowiedĹş | Kanon |
|----|-----------|--------|
| **PYTANIE-84-U14** | **R7-C zostaje** | **Garncarnia nie zuĹĽywa Ceramiki** â€” tylko **produkuje**. **R7-C (U-14b=A):** **auto** z nadwyĹĽki Ceramiki w mieĹ›cie â†’ +Zdrowie / +Zadowolenie. ZuĹĽywa CeramikÄ™ wyĹ‚Ä…cznie **Spichlerz** (B6/B8). |
| **PYTANIE-84-U15** | **A** | Rekrut **+5 Koni:** wszystkie `Typ: Mount`, **oprĂłcz** Rydwan (woĹ‚y). |
| **PYTANIE-84-U16** | **usunÄ…Ä‡ cap szlakĂłw** | **Brak** osobnej â€žprzepustowoĹ›ci szlakĂłw" (`capacityPerRoutePerTurn` itd.) â€” anachronizm. Szlaki (U-3=A) dostarczajÄ… surowce do magazynu wg **nowego modelu handlu** (bez limitu trasy); liczy siÄ™ tylko **produkcja** z mapy/budynkĂłw. ZĹ‚oto â€” **wysoka wartoĹ›Ä‡** wymiany (U-13). |
| **PYTANIE-84-U17** | **A** | **Warsztat kamieniarski:** +10% Kamienia/szt. na wpĹ‚ywie z mapy (kumulacja addytywna, jak Stolarnia). |
| **PYTANIE-84-U18** | **Tartak 10, Glinianka 15** | **Tartak** â†’ **10** Drewna/turÄ™; **Glinianka** â†’ **15** Gliny/turÄ™ (korekta balansu Maciej 2026-07-29; było 20/20). |
| **PYTANIE-84-U19** | **20** | Bilans przy **20/t** ĹşrĂłdĹ‚ach: **Garncarnia 6/t** (B5) zostaje â€” wystarczajÄ…co na Spichlerz (5 Ceramiki/t) + nadwyĹĽka/handl. |
| **PYTANIE-84-U20** | **A** | SĂłl, ZĹ‚oto, KoĹ„ **wliczajÄ… siÄ™** w cap magazynu paĹ„stwa (baza **500** + **100**Ă—Magazyn). |
| **PYTANIE-84-U21** | **A** | Warzelnia: **10 Soli/t** do magazynu **+** dotychczasowy bonus heksa (+1 Ĺ»ywnoĹ›Ä‡, +1 PieniÄ…dz). |
| **PYTANIE-84-U22** | **B** | **+Zadowolenie** (+2 z JSON Spichlerza II): **tylko lokalnie** w mieĹ›cie ze **dziaĹ‚ajÄ…cym** Spichlerzem II (oba surowce). **Cap zapasĂłw ĹĽywnoĹ›ci armii** i **bufor wzrostu** â€” **stare reguĹ‚y imperium** (patrz U-22 opis poniĹĽej). |
| **PYTANIE-84-U23** | **A** | **UchwaĹ‚a cywilizacyjna** w UI imperium, gdy dziaĹ‚a bonus solny (â‰Ą1 Spichlerz II pĹ‚aci SĂłl). |
| **PYTANIE-84-U24** | **B** | Budowa Spichlerza I: **bez** bramki â€žCeramika â‰Ą 1"; po postawieniu **drain 5/t** â€” brak surowca â†’ brak bonusĂłw. |
| **PYTANIE-84-U25** | **B** | **Zdrowie + Â˝ ĹĽywnoĹ›ci ludnoĹ›ci:** Spichlerz I (Ceramika) â†’ +5 Zdrowia **i** Â˝ ĹĽywnoĹ›ci ludnoĹ›ci w mieĹ›cie. Spichlerz II peĹ‚ny (oba surowce) â†’ +10 Zdrowia **i** Â˝ ĹĽywnoĹ›ci ludnoĹ›ci w mieĹ›cie. |
| **PYTANIE-84-U14b** | **A** | **Garncarnia R7-C:** **auto** â€” nadwyĹĽka Ceramiki w mieĹ›cie (po drain Spichlerza) â†’ efekt **+Zdrowie** lub **+Zadowolenie** (ktĂłry efekt â€” do doprecyzowania liczb przy `dziaĹ‚aj`; domyĹ›lnie +Zdrowie jeĹ›li jeden). |

**U-22 â€” co to â€žcap 150" (NIE limit wielkoĹ›ci armii):**

To **pojemnoĹ›Ä‡ zapasĂłw ĹĽywnoĹ›ci paĹ„stwa** (đźŤž w skarbcu imperium na wojsko/wzrost), nie liczba jednostek.

| Tier | WkĹ‚ad na miasto ze Spichlerzem | Bufor po wzroĹ›cie ludnoĹ›ci |
|------|--------------------------------|----------------------------|
| **Spichlerz I** | **+100** đźŤž (param. `spichlerz_pojemnosc_zapasow_panstwa`, normal) | **50%** bufora zachowane (`spichlerz_zachowanie_po_wzroscie`) |
| **Spichlerz II** | **+150** đźŤž na miasto (kod: `empire-food.ts`) | **70%** bufora (tier II w `turn-economy`) |

Suma po imperium: np. 2Ă— Spichlerz II = **300** đźŤž max w zapasach paĹ„stwa. Bez Spichlerza: odkĹ‚adanie **50%** nadwyĹĽki ĹĽywnoĹ›ci armii, **bez** limitu pojemnoĹ›ci.

**Cytaty Macieja (U-14â€¦U-24):** Garncarnia produkuje, nie zuĹĽywa Ceramiki; efekty Garncarni zostajÄ…. Tartak/Glinianka 20. UsunÄ…Ä‡ przepustowoĹ›Ä‡ szlakĂłw.

**âŹ¸ ODĹOĹ»ONE (Maciej 2026-07-27):** przebudowa **mechaniki surowcowej Spichlerza** â€” osobna rozmowa pĂłĹşniej.

**Status paczki U:** U-5â€¦U-25 + U-14b **domkniÄ™te** (oprĂłcz âŹ¸ Spichlerz surowcowy v2).

**Szkic ekonomii (kontrola):** 1 warzelnia (10 SĂłl/t) â‰ ĹĽywi **2** Spichlerze II (2Ă—5 SĂłl); 1 stadnina (1 KoĹ„/t) = **5 tur** na rekrut jezdny; 1 kopalnia = **1 ZĹ‚oto/t** na MennicÄ™; Glinianka+Tartak **20/t** ĹĽywiÄ… CegielniÄ™ (3/t) i GarncarniÄ™ (6/t).

---

## NastÄ™pny krok

**Fala 2** â†’ R4â€“R10 (SĂłl/ZĹ‚oto/KoĹ„ produkcja+drain), Spichlerz Ceramika/SĂłl, handel szlakĂłw (U-3/U-16); testy + deploy ROBOCZA po Integratorze.


### Korekta U-12 + U-25B (Maciej 2026-07-27 wieczór) — **P84-SPICHLERZ-2026-07-27**

**Cytat Macieja:** „Spichlerz może dawać zarówno zdrowie, jak i wzrost — to się nie wyklucza. Działa na wzrost ludności dwojako."

| ID | Było | Teraz (kanon) |
|----|------|----------------|
| **U-12** | Konflikt P84↔P85 (albo Zdrowie, albo %) | **Oba równolegle:** Spichlerz I (Ceramika) → **+5 pkt Zdrowia** + **+1% wzrostu** (P85-Q4). Spichlerz II pełny (Ceramika+Sól) → **+10 pkt Zdrowia** + **+2% wzrostu**. |
| **U-25B** | ½ żywności/osobę/turę | **Obniżka kosztu racji żywnościowej** (nie ogólnej produkcji): Spichlerz I → koszt racji **×0,75** (−25%). Spichlerz II pełny → koszt racji **×0,50** (−50%). Efekt: więcej nadwyżki do puli państwa przy tej samej racji / lepszy bilans lokalny — bez „półtorej racji na wzrost". |

**Implementacja (plan):** `spichlerzHealthBonus` przywrócić +5/+10 · `spichlerzRationFoodCostMultiplier` 0,75/0,50 w `computeCityRationCost` / bilansie P85.
