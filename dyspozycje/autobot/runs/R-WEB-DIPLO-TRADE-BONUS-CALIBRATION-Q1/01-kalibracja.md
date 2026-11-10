STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRADE-BONUS-CALIBRATION-Q1
GOAL: Kalibracja liczbowa reguły P7 (bonus Zaufania za wymianę handlową "na plusie" ze ścianami) z `R-WEB-DIPLO-TICK-WAR-BRAKE-Q1/00-dispatch.md`. Analiza, bez zmian kodu.
ZMIANY/COMMIT: tylko ten dokument (kod i dane bez zmian).
TESTY: nie dotyczy (analiza rachunkowa). Symulacja headless gry (3 seedy x 60 tur): NIE_ZMIERZONO — w worktree brak `node_modules`, zakaz `npm run dev`, dysk ograniczony. Zamiast niej: model rachunkowy wzoru P7 (skrypt poza repo, wyniki w §4), liczby wejściowe z JSON i kodu.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: decyzja właściciela w §7 (2 pytania), potem wpisanie liczb do dispatchu `R-WEB-DIPLO-TICK-WAR-BRAKE-Q1` (punkt P7).
DEPLOY/PUSH: NIE WYKONANO

Baza: `origin/main` @ `00fe8dc4`. Skróty: `cat.ts` = `gra/src/game/diplomacy-value-catalog.ts`, `pn.ts` = `gra/src/game/diplomacy-pn-engine.ts`, `dip.json` = `gra/data/diplomacy.json`, `econ.json` = `gra/data/econ-params.json`, `terr.json` = `gra/data/terrain-improvements.json`. Przyjęta nazwa liczby: PN = punkt negocjacji (1 PN = 1 ¤, `dip.json:158-160`).

# 1. Wynik w skrócie

Właściciel pyta: "ile Zaufania daje stała wymiana na plusie, tak żeby nie było dużo i była ściana". Proponowane liczby (szczegóły i rachunek niżej):

| Parametr | Propozycja | Co to znaczy po ludzku |
|---|---|---|
| `zaufaniePerNadwyzkaPn` | **0,03** (1 Zaufania na ok. 33 PN nadwyżki) | tyle Zaufania za każdy PN, który strona dostarcza ponad to, co dostaje |
| `wymianaRefPn` | **150** | po 150 PN dostarczonych w ostatnich 10 turach bonus spada o połowę |
| `wymianaMaxPerTura` (ściana 1) | **0,4** Zaufania na turę na parę | twardy limit; razem z istniejącym +1 za szlaki najwyżej +1,4 z handlu |
| `wymianaSufitZaufania` (ściana 3) | **60** | wymiana nie podniesie Zaufania ponad 60; dalej tylko pakt, sojusz, dary |
| `wymianaMinTurDostaw` | **2** kolejne tury | bonus liczy się od 2. tury dostaw z rzędu; jednorazowa przesyłka nie liczy się |
| `wymianaOknoTur` | **10** | okno do sumy dostaw (jak w dispatchu) |

Wzór (jak w dispatchu, doprecyzowany): `efektywna = nadwyżka / (1 + suma_nadwyżek_poprzednich_10_tur / 150)`; `bonus_tury = min(0,4 ; 0,03 x efektywna)`; bonus dodaje się do Zaufania pary tylko, gdy Zaufanie < 60 (i nie przeskakuje 60).

Czy te liczby spełniają warunki właściciela (dowody w §4):

| Warunek | Wynik |
|---|---|
| (i) mała stała dostawa daje odczuwalny, umiarkowany bonus | dostawa ok. 25 PN/turę (np. 1 blok Żelaza + 5 bloków Drewna) daje ok. 0,28 Zaufania/turę, w 40 turach ok. +11,8; to mniej niż 1/3 stałego +1/turę za umowę szlaków |
| (ii) 10x większa dostawa daje < 2x bonusu | prawda dla dostaw od ok. 15 PN/turę wzwyż (stan ustalony: 15 do 150 PN = x1,78; 25 do 250 PN = x1,42; 50 do 500 PN = x1,16). Poniżej 15 PN/turę bonus jest i tak mniejszy niż 0,22/turę (10 do 100 PN = x2,17) |
| (iii) samą wymianą nie przekroczy się sufitu | tak: sufit 60 jest ścianą nr 3; przy tempie max 0,4/turę dojście z 20 do 60 samą wymianą trwa min. ok. 102 tury |
| (iv) jednorazowy duży dar/przesyłka nie obchodzi ściany | tak: przesyłka 1 tura = 0 bonusu; 1000 PN przez 2 tury = max 0,4 (limit tury); dar jednorazowy idzie osobną regułą (§5) |

# 2. Skale z kodu i danych

## 2a. Ile PN jest warta jednostka surowca

Wycena PN surowca ilościowego = (liczba sztuk / krok) x cena za blok (`cat.ts:413-420`, `diplomacyPnSurowiecIlosc`). Krok handlu: 10 szt. dla Drewna, Kamienia, Gliny, Rudy, Cegły, Soli, Konia, Ceramiki, Brązu, Żelaza, Stali (`cat.ts:308-322`); 1 szt. dla Złota i Węgla. Ceny za blok są takie same na wszystkich trudnościach (`econ.json:729-830`).

| Towar | Cena (PN za blok) | Blok | PN za 1 szt. | Źródło |
|---|---|---|---|---|
| Drewno | 1 | 10 szt. | 0,1 | `econ.json:729` |
| Kamień | 3 | 10 szt. | 0,3 | `econ.json:743` |
| Brąz | 15 | 10 szt. | 1,5 | `econ.json:799` |
| Żelazo | 20 | 10 szt. | 2,0 | `econ.json:806` |
| Stal | 25 | 10 szt. | 2,5 | `econ.json:813` |
| Złoto (surowiec w magazynie) | 50 | 1 szt. | 50 | `econ.json:820` |
| Pieniądze ¤ | 1 | 1 ¤ | 1 | `dip.json:158-160` |
| Praca | 1 | 1 Praca | 1 | `dip.json:162-164` |
| Żywność | 1 | 1 szt. | 1 | `dip.json:197-200` |

Ceny NIE zależą od epoki (jedna cena w JSON, brak pola epoki). Epoka (Kamień/Brąz/Żelazo) zmienia tylko to, ile towaru da się wyprodukować (§2c). Dlatego "ile PN warta jest jednostka w każdej epoce" ma jedną odpowiedź: tyle, ile w tabeli. Brąz i Żelazo pojawiają się w grze od epoki 2 i 3 (`terr.json` pole `epoka`; budynki `buildings.json` `epokaWejscia` 2 i 3).

Ile towaru kupuje 100 PN (czyli 1 Zaufania z daru, §2b): Drewno 1000 szt., Kamień ok. 340 szt., Brąz 70 szt., Żelazo 50 szt., Złoto 2 szt., ¤ 100.

Dodatkowe mnożniki PN przy negocjacji: strona "My oddajemy" gracza x1,5 (łatwy) / x1,0 / x0,5 (trudny), strona "My dostajemy" odwrotnie (`cat.ts:136-150`). To są modyfikatory targowania, nie wartość towaru; dla bonusu P7 proponuję je pominąć (patrz §6, N3).

## 2b. Jak dziś rośnie Zaufanie z daru (D3-G3-B)

| Element | Wartość | Źródło |
|---|---|---|
| Przelicznik | 100 PN nadwyżki = +1 Zaufania, zaokrąglenie w dół (99 PN = 0) | `dip.json:211`, `cat.ts:636-646` |
| Dar = cała wartość jako nadwyżka | tak | `cat.ts:686-692` |
| Limit na parę na turę (handel i dary razem) | +5 | `dip.json:212`, `cat.ts:649-657` |
| Dobra wola po nadwyżce >= 100 PN | +1 Zaufania na turę przez 3 tury (nie sumuje się, odświeża max) | `dip.json:215-218`, `cat.ts:699-712`, `pn.ts:252-285`, tick `pn.ts:287-302` |
| Minimalna Relacja na dar | 30 (skalowana trudnością) | `dip.json:214`, `pn.ts:202-204` |
| Wartość "dar_zaufanie: 6" w `params` | martwa — zdarzenie `dar` zwraca 0, Zaufanie liczy się z PN | `dip.json:6`, `gra/src/game/diplomacy.ts:945-948` |

Czyli skala "ile Zaufania daje X PN": dar 100 PN = +1 teraz i +3 z dobrej woli (razem +4 w 4 turach); dar 500 PN lub więcej w jednej turze = +5 (limit) i +3; stały strumień 100 PN/turę = ok. +2/turę; strumień 500 PN/turę = ok. +6/turę (5 limitu + 1 dobrej woli). Gdyby ktoś dawał dary co turę, Zaufanie dochodzi do 100 bez sufitu.

## 2c. Typowe wielkości produkcji (z danych)

Produkcja surowców jest "na ulepszenie w terytorium", niezależnie od obsadzenia (`terr.json` `_meta.pole_surowiec_ilosc_tura`).

| Źródło | Surowiec | Szt./turę | Epoka 1 / 2 / 3 | PN/turę (epoka 1 / 2 / 3) | Źródło |
|---|---|---|---|---|---|
| Tartak (1 szt.) | Drewno | 200 w epoce 1, x1,5 za każdą kolejną epokę | 200 / 300 / 450 | 20 / 30 / 45 | `terr.json:194-204`, `terrain-improvements.ts:219-233` |
| Kamieniołom (1 szt.) | Kamień | jak wyżej | 200 / 300 / 450 | 60 / 90 / 135 | `terr.json:136-146` |
| Odlewnia brązu (konwerter) | Brąz | max 25 (płasko, bez skalowania epoką) | — / 25 / 25 | — / 37,5 / 37,5 | `econ.json:355-360` |
| Odlewnia żelaza (konwerter) | Żelazo | max 25 (płasko) | — / — / 25 | — / — / 50 | `econ.json:362-367` |
| Kopalnia złota (1 szt.) | Złoto | 1 | — / 1 / 1 | — / 50 / 50 | `terr.json:376-385` |
| Skarbiec | ¤ | NIE_ZMIERZONO | | | |

Uwaga: komentarze w `terr.json` (`_meta`) wciąż piszą "Tartak 50/turę", ale pole liczbowe `surowiec_ilosc_tura` wynosi 200 (zmiana H-KAMIENIOLOM/H-TARTAK, commit `9175f031`); do kalibracji użyto POLA, nie komentarza. Brąz i Żelazo wymagają też Rudy i Drewna jako wsadu (`econ.json:360`), więc realna dostawa jest mniejsza niż limit przepustowości (zużycie netto: NIE_ZMIERZONO).

Typowa cykliczna dostawa AI: AI proponuje najwyżej 30 szt./turę (`gra/src/game/diplomacy-economy.ts:284`, stała `AI_RESOURCE_TRADE_MAX_PAKIETY_PER_TURA = 30`, użyta w `main.ts:19632`) przez domyślnie 10 tur (`diplomacy-economy.ts:275`, użyte w `main.ts:19782`). To jest 3 bloki: Drewno 3 PN, Brąz 45 PN, Żelazo 60 PN na turę. Czas umowy gracza ogranicza `clampDealTurns` do 1..20 tur (`diplomacy-proposals.ts:423-425`), więc 40 tur to minimum dwie umowy po sobie.

Co z tego wynika dla zakresu liczb: realistyczna stała dostawa jednej cywilizacji to **ok. 3 do 60 PN na turę** (jedno-dwa źródła produkcji); 150 PN i więcej na turę to już 4+ odlewnie albo 3+ kopalnie złota, czyli tylko cywilizacja mocno nastawiona na handel.

## 2d. Skala Zaufania i istniejące wpływy co turę

Zaufanie 0..100, start 20 (`dip.json:37`). Sojusz wymaga Zaufania >= 91 (`dip.json:30`). Istniejące wpływy co turę (`dip.json:19-28`, analiza `R-WEB-DIPLO-RELATIONS-ANALYSIS-Q1/01-analiza.md` §A2):

| Wpływ | Wartość /turę |
|---|---|
| Umowa szlaków | +1 |
| Pakt o nieagresji | +2 |
| Sojusz | +3 |
| Wspólna religia | +0,5 |
| Dryf Wiarygodności W=+20 (start Normalny) | +0,6 |
| Wspólna granica lądowa | −2 |
| Odmienna religia | −0,5 (dziś nieaktywna w ticku) |
| Dobra wola po darze | +1 x 3 tury |

Umowa wymiany surowców (akcja 14) NIE daje dziś nic co turę (analiza §A2, ostatni wiersz tabeli plusów). To jest luka, którą zamyka P7.

Jak nowy bonus wpisuje się w tę skalę (stan ustalony, wartości z modelu analizy §B6, mnożnik tempa Wiarygodności pominięty):

| Para (model z analizy §B6, z proponowanym wychładzaniem −0,5) | Suma/turę bez wymiany | Z wymianą 25 PN/turę (+0,28) | Z wymianą 150 PN/turę (+0,40) |
|---|---|---|---|
| Sąsiedzi, bez umów | −1,9 | −1,6 | −1,5 |
| Sąsiedzi + szlaki | −0,4 | −0,1 | 0,0 |
| Sąsiedzi + pakt (NAP) | +0,6 | +0,9 | +1,0 |
| Nie-sąsiedzi, bez umów | +0,1 | +0,4 | +0,5 |

Wniosek: wymiana nie "przykrywa" kary za granicę (−2) ani nie dominuje nad paktem (+2), ale jest widoczna: potrafi zrównoważyć sąsiadów ze szlakami do zera. Na to właśnie wskazuje sufit 0,4 (§3).

# 3. Propozycja liczb z rachunkiem

Definicje użyte w rachunku (ZAŁOŻENIA, bo dispatch ich nie rozstrzyga; patrz §6):

- Nadwyżka tury (PN) = wartość netto dostarczona w tej turze przez jedną stronę pary drugiej stronie, po kursie 1:1 i bez mnożników trudności, w PN z katalogu (§2a): `max(0, dostarczone − otrzymane)`. Wymiana uczciwa 1:1 daje 0. Dostawa liczy się tylko, gdy jest faktycznie wykonana (flaga `delivered` w `main.ts:20267-20290`; brak środków u dostawcy = zerwanie jak dziś, bez bonusu).
- Zaufanie w grze jest jedną liczbą na parę (klucz "a_b"), więc bonus podnosi tę jedną liczbę.
- `suma_nadwyżek_poprzednich_10_tur` liczona z nadwyżek netto (nie brutto), z poprzednich 10 tur, bez bieżącej; trzymana na parę, nie na umowę (odnowienie umowy jej nie zeruje).

| Parametr | Wartość | Uzasadnienie rachunkowe |
|---|---|---|
| `zaufaniePerNadwyzkaPn` | **0,03** | Dispatch dopuszcza 1 Zaufania na 25 do 50 PN (0,02 do 0,04) i cel 0,3 do 0,6/turę dla typowej dostawy. Typowa pojedyncza dostawa to 15 do 60 PN/turę (§2c: tartak 20-45 PN, odlewnia 37-50 PN, kopalnia złota 50 PN). Przy 0,03 dostawa 25 PN daje w stanie ustalonym 0,28/turę, a 45 PN daje 0,42 przed limitem. Wartość 0,02 dawałaby 0,19 przy 25 PN (poniżej "odczuwalnego"), a 0,04 obniżałaby cenę punktu do ok. 64 PN przy dostawie 25 PN/turę. Cena punktu z wymiany wychodzi 54 do 85 PN za punkt przy dostawach 10 do 25 PN/turę (§5), czyli nie taniej niż dar ze strumienia (ok. 50). |
| `wymianaRefPn` | **150** | Wzór `nadwyżka/(1+S10/150)`. Przy stałej dostawie d: S10 = 10 d, więc bonus = 0,03 d/(1+d/15). Dla d dużego dąży do 0,03 x 15 = 0,45/turę — to granica, której nie przebije żadna ilość towaru. 10x większa dostawa daje < 2x bonusu, gdy d > 0,08 x 150 = 12 PN/turę (rachunek: x2 granicznie przy 12 PN; tabela §4.2). Mniejsze Ref (np. 100) zjadałoby bonus typowej dostawy 25 PN o 24% (0,21 zamiast 0,28), większe (np. 300) przesuwałoby próg "10x < 2x" do 24 PN i psuło warunek (ii) dla małych dostaw. |
| `wymianaMaxPerTura` (ściana 1) | **0,4** | Granica 0,45 ze ściany 2 jest już niska; 0,4 odcina ją tuż przed asymptotą, więc ściana 1 zaczyna działać od stałej dostawy 120 PN/turę (0,03 x 120/(1+8) = 0,40). Razem z istniejącym +1 za umowę szlaków: najwyżej +1,4/turę z samego handlu (dispatch dopuszcza +2,0). Dispatch proponował 1,0; przy wzorze ściany 2 limit 1,0 byłby nieosiągalny (martwa ściana), więc obniżono go do poziomu realnie działającego. |
| `wymianaSufitZaufania` (ściana 3) | **60** | Jak w dispatchu. 60 leży w paśmie "Życzliwość" (50-69) z analizy §B4, poniżej "Przyjaźń" (70) i dużo poniżej progu sojuszu 91 (`dip.json:30`). Zaufanie z samej wymiany nie przeskakuje 60; wyżej awansuje się paktem, sojuszem, darami. |
| `wymianaMinTurDostaw` | **2** kolejne tury | Jak w dispatchu (a). Pierwsza tura dostawy nie daje bonusu (zapisuje tylko nadwyżkę do okna), bonus startuje od 2. tury. Przerwa w dostawie zeruje licznik kolejnych tur, ale NIE okno 10 tur (patrz próba "serii" niżej). |
| `wymianaOknoTur` | **10** | Jak w dispatchu (d). 10 tur to połowa maksymalnej umowy (20 tur, `diplomacy-proposals.ts:423-425`). |

Dodatkowe sprawdzenie "serii" (próba obejścia ściany 2 przez dostawy na przemian z przerwami, model 120 tur, `d` w PN/turę):

| Wzorzec | d=25: bonus/turę (średnio) | d=25: PN za punkt | d=100: bonus/turę | d=100: PN za punkt |
|---|---|---|---|---|
| ciągle | 0,286 | 88 | 0,389 | 257 |
| 10 tur dostaw / 10 przerwy | 0,167 | 75 | 0,180 | 278 |
| 5 / 10 | 0,107 | 78 | 0,107 | 312 |
| 5 / 5 | 0,160 | 78 | 0,160 | 313 |
| 2 / 3 | 0,080 | 125 | 0,080 | 500 |
| 2 / 1 | 0,117 | 143 | 0,133 | 500 |

Wniosek: żaden wzorzec nie jest szybszy niż dostawa ciągła i żaden nie obniża ceny punktu poniżej ok. 75 PN. Przerwy nie "resetują" ściany na korzyść gracza.

# 4. Scenariusze: dostawa x liczba tur

Model: start Zaufania 20, sama wymiana (bez innych wpływów), parametry z §3. Jednostki dostawy: dla Drewna, Brązu i Żelaza "1 jednostka" = 1 blok handlu = 10 szt. (krok handlu, `cat.ts:321`; mniejsza ilość nie jest możliwa); dla Złota 1 jednostka = 1 szt. (krok 1). Dostawy 1/3/5/10/30 jednostek na turę. Kolumna "Źródeł produkcji" = ile tartaków (epoka 1) / odlewni / kopalni złota potrzeba, żeby taką dostawę utrzymać co turę (§2c); duże wartości są teoretyczne.

Legenda ścian: **W1** = limit 0,4 na turę (podana tura, od której działa), **W2** = malejące zyski (o ile % mniejsza nadwyżka efektywna w ostatniej turze), **W3** = sufit 60 (podana tura), "bez ściany" = dostawa za mała, żeby ściany coś odcięły. Tury dostaw 1 daje 0, bo minimum to 2 kolejne tury. Czas 40 tur wymaga dwóch umów po sobie (limit umowy 20 tur).

## 4.1 Tabele scenariuszy

**Drewno** (blok = 10 szt., 1 PN). Komórka: Zaufanie w ostatniej turze / suma Σ / ściana.

| Dostawa na turę | PN/turę | Źródeł produkcji | 1 tur | 5 tur | 10 tur | 20 tur | 40 tur |
|---|---|---|---|---|---|---|---|
| 1 bl. (10 szt.) | 1 | 1 | 0 (min. 2 tury) | 0,03 / Σ0,1 / bez ściany | 0,03 / Σ0,3 / bez ściany | 0,03 / Σ0,5 / bez ściany | 0,03 / Σ1,1 / bez ściany |
| 3 bl. (30 szt.) | 3 | 1 | 0 (min. 2 tury) | 0,08 / Σ0,3 / bez ściany | 0,08 / Σ0,7 / bez ściany | 0,07 / Σ1,5 / bez ściany | 0,07 / Σ3,0 / bez ściany |
| 5 bl. (50 szt.) | 5 | 1 | 0 (min. 2 tury) | 0,13 / Σ0,6 / bez ściany | 0,12 / Σ1,2 / W2 −23% | 0,11 / Σ2,3 / W2 −25% | 0,11 / Σ4,5 / W2 −25% |
| 10 bl. (100 szt.) | 10 | 1 | 0 (min. 2 tury) | 0,24 / Σ1,0 / W2 −21% | 0,19 / Σ2,1 / W2 −38% | 0,18 / Σ3,9 / W2 −40% | 0,18 / Σ7,5 / W2 −40% |
| 30 bl. (300 szt.) | 30 | 2 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −44% | 0,32 / Σ3,4 / W2 −64% | 0,30 / Σ6,4 / W2 −67% | 0,30 / Σ12,4 / W2 −67% |

**Brąz** (blok = 10 szt., 15 PN). Komórka: Zaufanie w ostatniej turze / suma Σ / ściana.

| Dostawa na turę | PN/turę | Źródeł produkcji | 1 tur | 5 tur | 10 tur | 20 tur | 40 tur |
|---|---|---|---|---|---|---|---|
| 1 bl. (10 szt.) | 15 | 1 | 0 (min. 2 tury) | 0,32 / Σ1,4 / W2 −29% | 0,24 / Σ2,8 / W2 −47% | 0,22 / Σ5,0 / W2 −50% | 0,22 / Σ9,5 / W2 −50% |
| 3 bl. (30 szt.) | 45 | 2 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −55% | 0,36 / Σ3,6 / W2 −73% | 0,34 / Σ6,9 / W2 −75% | 0,34 / Σ13,7 / W2 −75% |
| 5 bl. (50 szt.) | 75 | 2 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −67% | 0,40 / Σ3,6 / W1@2, W2 −82% | 0,38 / Σ7,3 / W2 −83% | 0,38 / Σ14,8 / W2 −83% |
| 10 bl. (100 szt.) | 150 | 4 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −80% | 0,40 / Σ3,6 / W1@2, W2 −90% | 0,40 / Σ7,6 / W1@2, W2 −91% | 0,40 / Σ15,6 / W1@2, W2 −91% |
| 30 bl. (300 szt.) | 450 | 12 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −92% | 0,40 / Σ3,6 / W1@2, W2 −96% | 0,40 / Σ7,6 / W1@2, W2 −97% | 0,40 / Σ15,6 / W1@2, W2 −97% |

**Żelazo** (blok = 10 szt., 20 PN). Komórka: Zaufanie w ostatniej turze / suma Σ / ściana.

| Dostawa na turę | PN/turę | Źródeł produkcji | 1 tur | 5 tur | 10 tur | 20 tur | 40 tur |
|---|---|---|---|---|---|---|---|
| 1 bl. (10 szt.) | 20 | 1 | 0 (min. 2 tury) | 0,39 / Σ1,6 / W2 −35% | 0,27 / Σ3,2 / W2 −55% | 0,26 / Σ5,7 / W2 −57% | 0,26 / Σ10,9 / W2 −57% |
| 3 bl. (30 szt.) | 60 | 2 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −62% | 0,39 / Σ3,6 / W2 −78% | 0,36 / Σ7,2 / W2 −80% | 0,36 / Σ14,4 / W2 −80% |
| 5 bl. (50 szt.) | 100 | 2 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −73% | 0,40 / Σ3,6 / W1@2, W2 −86% | 0,39 / Σ7,5 / W2 −87% | 0,39 / Σ15,3 / W2 −87% |
| 10 bl. (100 szt.) | 200 | 4 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −84% | 0,40 / Σ3,6 / W1@2, W2 −92% | 0,40 / Σ7,6 / W1@2, W2 −93% | 0,40 / Σ15,6 / W1@2, W2 −93% |
| 30 bl. (300 szt.) | 600 | 12 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −94% | 0,40 / Σ3,6 / W1@2, W2 −97% | 0,40 / Σ7,6 / W1@2, W2 −98% | 0,40 / Σ15,6 / W1@2, W2 −98% |

**Złoto (surowiec)** (1 szt., 50 PN). Komórka: Zaufanie w ostatniej turze / suma Σ / ściana.

| Dostawa na turę | PN/turę | Źródeł produkcji | 1 tur | 5 tur | 10 tur | 20 tur | 40 tur |
|---|---|---|---|---|---|---|---|
| 1 szt. | 50 | 1 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −57% | 0,38 / Σ3,6 / W2 −75% | 0,35 / Σ7,0 / W2 −77% | 0,35 / Σ14,0 / W2 −77% |
| 3 szt. | 150 | 3 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −80% | 0,40 / Σ3,6 / W1@2, W2 −90% | 0,40 / Σ7,6 / W1@2, W2 −91% | 0,40 / Σ15,6 / W1@2, W2 −91% |
| 5 szt. | 250 | 5 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −87% | 0,40 / Σ3,6 / W1@2, W2 −94% | 0,40 / Σ7,6 / W1@2, W2 −94% | 0,40 / Σ15,6 / W1@2, W2 −94% |
| 10 szt. | 500 | 10 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −93% | 0,40 / Σ3,6 / W1@2, W2 −97% | 0,40 / Σ7,6 / W1@2, W2 −97% | 0,40 / Σ15,6 / W1@2, W2 −97% |
| 30 szt. | 1500 | 30 | 0 (min. 2 tury) | 0,40 / Σ1,6 / W1@2, W2 −98% | 0,40 / Σ3,6 / W1@2, W2 −99% | 0,40 / Σ7,6 / W1@2, W2 −99% | 0,40 / Σ15,6 / W1@2, W2 −99% |

## 4.2 Dowody na cztery warunki właściciela

**Stan ustalony (stała dostawa d PN/turę przez wiele tur), Zaufanie/turę z samej wymiany:**

| d (PN/turę) | 10 | 15 | 20 | 25 | 30 | 50 | 75 | 100 | 120 i więcej |
|---|---|---|---|---|---|---|---|---|---|
| Bonus/turę | 0,18 | 0,23 | 0,26 | 0,28 | 0,30 | 0,35 | 0,38 | 0,39 | **0,40 (ściana 1)** |

**(i) Mała stała dostawa = odczuwalny, ale umiarkowany bonus.** d = 25 PN/turę (np. 1 blok Żelaza + 5 bloków Drewna = 25 PN, albo 1 blok Brązu + 10 bloków Drewna = 25 PN): 0,28/turę, Σ po 10 turach 3,3; po 20 turach 6,2; po 40 turach 11,8 (Zaufanie 20 -> ok. 32). Dla porównania: umowa szlaków daje stałe +1/turę (40 tur = +40), pakt +2/turę.

**(ii) 10x większa dostawa daje mniej niż 2x bonusu:**

| d -> 10 d (PN/turę) | Bonus/turę (stan ustalony) | Krotność | Σ po 40 turach | Krotność |
|---|---|---|---|---|
| 10 -> 100 | 0,18 -> 0,39 | x2,17 (powyżej 2; patrz uwaga) | 7,5 -> 15,3 | x2,06 |
| 15 -> 150 | 0,23 -> 0,40 | x1,78 | 9,5 -> 15,6 | x1,64 |
| 20 -> 200 | 0,26 -> 0,40 | x1,56 | 10,9 -> 15,6 | x1,43 |
| 25 -> 250 | 0,28 -> 0,40 | x1,42 | 11,8 -> 15,6 | x1,32 |
| 30 -> 300 | 0,30 -> 0,40 | x1,33 | 12,4 -> 15,6 | x1,25 |
| 50 -> 500 | 0,35 -> 0,40 | x1,16 | 14,0 -> 15,6 | x1,12 |
| 100 -> 1000 | 0,39 -> 0,40 | x1,02 | 15,3 -> 15,6 | x1,02 |

Uwaga: warunek (ii) jest spełniony od ok. 15 PN/turę wzwyż (granica teoretyczna 12 PN/turę). Dla dostawy 10 PN/turę (np. 100 szt. Drewna) 10x więcej daje x2,17, ale w liczbach bezwzględnych to różnica 0,2 Zaufania na turę. Nie da się spełnić tej reguły dla dowolnie małych dostaw przy wzorze z dispatchu, bo przy d bliskim 0 wzór jest liniowy.

**(iii) Samą wymianą nie da się przekroczyć sufitu 60.** Start 20, brak innych wpływów, stała dostawa: sufit osiągany najwcześniej w turze **102** (d >= 120 PN/turę), przy d = 50 w turze 116, przy d = 25 w turze 141. Po osiągnięciu 60 bonus wynosi 0, a ostatnie podniesienie jest przycięte do 60. Nie ma żadnej wielkości dostawy dającej szybciej niż ok. 102 tury, bo każdy strumień dostaje się pod limit 0,4/turę. W grze realne Zaufanie wzrośnie szybciej dzięki paktowi i szlakom, ale wymiana nie doda nic powyżej 60.

**(iv) Jednorazowa duża przesyłka nie obchodzi ściany:**

| Scenariusz | Bonus z reguły P7 |
|---|---|
| Przesyłka 1000 PN (lub 10 000 PN) w jednej turze | 0 (minimum 2 kolejne tury) |
| 1000 PN w 2 kolejnych turach (2 x 1000 PN) | 0,4 (jedna tura bonusu, limit ściany 1) |
| 1000 PN/turę przez 3 / 20 tur | 0,8 / 7,6 (0,4/turę, ściana 1) |
| Ten sam dar jednorazowy 1000 PN | idzie osobną regułą daru: +5 (limit 5/turę) i +3 z dobrej woli (§2b), nie podlega P7 |

# 5. Porównanie z istniejącym bonusem darów

"Opłacalne obejście" = sposób, w którym ktoś za mniej PN dostaje więcej Zaufania niż drogą, którą gra już dopuszcza. Liczby: dar (§2b) i wymiana P7 (§4).

| Sposób | Wartość oddana | Zaufanie | PN za 1 punkt | Tempo | Sufit |
|---|---|---|---|---|---|
| Dar jednorazowy 100 PN | 100 | +1 teraz, +3 z dobrej woli = +4 | 25 | 4 tury | brak (do 100) |
| Dar jednorazowy 500 PN | 500 | +5 (limit), +3 = +8 | 63 | 4 tury | brak |
| Dar jednorazowy 1000 PN | 1000 | +5 (limit), +3 = +8 | 125 | 4 tury | brak |
| Dar co turę 100 PN | 100/turę | ok. +2/turę | 50 | +2/turę | brak |
| Dar co turę 500 PN | 500/turę | ok. +6/turę | 83 | +6/turę | brak |
| Wymiana P7, stała 10 PN/turę, 40 tur | 400 | Σ7,5 | 54 | max 0,18/turę | 60 |
| Wymiana P7, stała 25 PN/turę, 40 tur | 1000 | Σ11,8 | 85 | 0,28/turę | 60 |
| Wymiana P7, stała 50 PN/turę, 40 tur | 2000 | Σ14,0 | 143 | 0,35/turę | 60 |
| Wymiana P7, stała 100 PN/turę, 40 tur | 4000 | Σ15,3 | 261 | 0,39/turę | 60 |
| Wymiana P7, stała 500 PN/turę, 40 tur | 20 000 | Σ15,6 | 1282 | 0,40/turę | 60 |

Wnioski:

1. Wymiana P7 nigdy nie jest tańsza niż dar: najtańszy punkt z wymiany (54 PN przy małych dostawach) jest tak samo drogi jak dar ze stałego strumienia (50 PN) i drogi w porównaniu z darem z dobrą wolą (25 PN). Dla dostaw powyżej 50 PN/turę punkt z wymiany jest 3 do 25 razy droższy niż z daru.
2. Dar jest też wielokrotnie szybszy (do +6/turę wobec 0,4/turę) i nie ma sufitu. Czyli kto chce "kupić" przyjaźń 100, robi to darami (jak dziś), a nie wymianą; wymiana kończy się na 60 i 0,4/turę. To jest dokładnie to, o co prosi właściciel: "nie surowcami, a darami".
3. Brak tańszego obejścia przez przerwy w dostawach (tabela "serii" w §3).
4. UWAGA, istniejąca luka poza P7 (N1 w §6): przy zawarciu umowy cyklicznej Zaufanie z PN naliczane jest od razu od CAŁEGO cyklu (`main.ts:20800-20818`, `cat.ts:516-520`), więc umowa "25 PN/turę przez 20 tur" daje na starcie +5 i +3 (jak dar 500 PN), zanim cokolwiek dostarczono. P7 dodane na wierzch dałoby razem ok. +14 za 500 PN, czyli 36 PN za punkt — taniej niż dar. Dlatego decyzja 1 (§7).

# 6. Niejasności z kodu i proponowane wartości domyślne

| Nr | Niejasność | Dowód | Proponowany domyślny wybór |
|---|---|---|---|
| N1 | Umowa cykliczna (`per_turn` x `turns`) płaci Zaufanie z PN od razu za cały cykl, także gdy potem nie dojdzie do dostaw (kara za niedotrzymanie to tylko -2 Wiarygodności co 3 tury) | `main.ts:20800-20818` (wywołanie `applyPnTrustForPair`), `cat.ts:516-520` (mnożenie przez `turnsMultiplier`), `main.ts:20267-20330` (brak zwrotu) | Liczyć przy zawarciu tylko 1 turę dostawy (`turnsMultiplier = 1`). Decyzja 1 |
| N2 | Jednostka "1/3/5/10/30 sztuk surowca" z dispatchu: Drewno, Brąz i Żelazo mają krok handlu 10 szt., więc 1-9 szt. nie da się wymienić | `cat.ts:308-322`, `cat.ts:343-352` | "Jednostka" = 1 blok (10 szt.) dla Drewna/Brązu/Żelaza; 1 szt. dla Złota |
| N3 | Mnożniki trudności PN (x0,5 do x1,5 po stronie gracza) mogłyby zawyżyć lub zaniżyć nadwyżkę | `cat.ts:136-150`, `cat.ts:511-512` (zastosowanie `applyBasketSideDifficultyPn`) | Nadwyżka z cennika bazowego, bez mnożników trudności (AI i gracz tak samo) |
| N4 | Dziś nadwyżka handlu liczona jest z kursem Relacji (`otrzymane x 100/Rel`, bez ograniczenia Rel do 100) | `cat.ts:617-638`; w `pn.ts:191-200` akceptacja AI ogranicza Rel do 100 | Dla P7 kurs 1:1 (uczciwa wymiana = 0 bonusu), niezależnie od Relacji |
| N5 | Zaufanie jest jedną liczbą na parę, a P7 mówi o "Zaufaniu Y do X" | `main.ts:8385`, `main.ts:8561` (klucz pary) | Bonus podnosi wspólną liczbę pary; kierunek nadwyżki nieistotny. Przy dostawach w obie strony liczy się nadwyżka netto kierunku wypadkowego (zabezpieczenie przed kółkiem A->B->A) |
| N6 | "Suma dostaw ostatnich 10 tur" w dispatchu: brutto czy netto | dispatch P7 (d) | Suma nadwyżek netto poprzednich 10 tur, per para, bez bieżącej tury |
| N7 | Dobra wola (+1 x 3 tury za nadwyżkę >= 100 PN) i limit 5/turę z PN | `cat.ts:699-712`, `cat.ts:649-657` | Bonus P7 NIE uruchamia dobrej woli i NIE zużywa limitu 5/turę (osobna pula, ściana 1 = 0,4) |
| N8 | Analiza proponowała też płaskie +1/turę za "wymianę wykonaną" (§B2) | `R-WEB-DIPLO-RELATIONS-ANALYSIS-Q1/01-analiza.md` §B2 | P7 zastępuje to +1; nie dodawać obu naraz (inaczej sufit "z samego handlu" byłby przekroczony) |
| N9 | Ceny nie zależą od epoki, a produkcja rośnie x1,5 za epokę tylko dla Drewna i Kamienia | `terrain-improvements.ts:219-233`, `econ.json:729-830` | Bez skalowania epoką. W epoce 3 ta sama dostawa PN jest łatwiejsza, ale ściany (limit i sufit) pilnują sumy |
| N10 | Złoto w magazynie (50 PN/szt.) i ¤ (1 PN) to różne towary; "złoto/Pieniądze" w dispatchu | `econ.json:820`, `dip.json:158-160` | Oba w katalogu PN wg tabeli §2a; ¤ w scenariuszach = kolumna "PN/turę" 1:1 |
| N11 | Wymiany AI-AI i wymiana z samym sobą | `main.ts:20267-20290` (`sellerOkOf` odrzuca `seller == buyer`) | Wymiana z samym sobą już odrzucona. AI-AI liczy się tym samym wzorem po wdrożeniu P3 (tick par AI-AI) |
| N12 | Umowa wymiany trwa 1 do 20 tur, a scenariusz 40-turowy to dwie umowy | `diplomacy-proposals.ts:423-425` | Okno 10 tur trzymać na parze, nie na umowie, żeby odnowienie nie zerowało ściany 2 |

# 7. Decyzje do właściciela (max 2)

**Decyzja 1. Czy umowa cykliczna ma nadal dawać "zaliczkę" Zaufania za cały cykl w dniu zawarcia?** Dziś tak: do +5 i +3 z dobrej woli, nawet jeśli dostawy potem nie dojdą (N1).
- A (rekomendacja): naliczać przy zawarciu tylko za pierwszą turę dostawy; resztę Zaufania zapewnia dopiero bonus P7 tura po turze. Wtedy dar cykliczny 25 PN/turę przez 20 tur = 0 na starcie i ok. 6 w ciągu 20 tur (81 PN za punkt).
- B: zostawić jak dziś (umowa "25 PN/turę x 20 tur" = +8 od razu, razem z P7 ok. +14 za 500 PN, czyli taniej niż dar).

**Decyzja 2. Tempo bonusu: wersja z propozycji czy ostrożniejsza?**
- A (rekomendacja): `0,03 / 150 / 0,4` — dostawa 25 PN/turę = 0,28/turę, 40 tur = +11,8.
- B (ostrożna): `zaufaniePerNadwyzkaPn = 0,01`, `wymianaRefPn = 150`, `wymianaMaxPerTura = 0,15` — wymiana nigdy tańsza niż dar z dobrą wolą nawet przy małych dostawach: 25 PN/turę = 0,09/turę, 40 tur = +4,0 (250 PN za punkt); 10 PN/turę = 0,06/turę. Sufit 60 osiągany po ok. 276 turach. Bonus ledwo widoczny, ale wciąż niezerowy.

# 8. Czego nie zmierzono

| Rzecz | Powód |
|---|---|
| Produkcja surowców AI na turę w epokach kamień/brąz (3 seedy x 60 tur) | NIE_ZMIERZONO — brak zainstalowanych zależności w worktree, zakaz `npm run dev`, dysk ograniczony. Użyto górnej granicy z danych (§2c) i stałej `AI_RESOURCE_TRADE_MAX_PAKIETY_PER_TURA = 30` |
| Rzeczywista, netto dostępna dostawa (zużycie surowców przez obywateli, wsad do konwerterów) | NIE_ZMIERZONO |
| Dochód ¤ na turę cywilizacji AI | NIE_ZMIERZONO |
| Liczba umów cyklicznych, które AI faktycznie zawiera w 60 turach | NIE_ZMIERZONO |
| "Wartość jednego szlaku" w PN (cel dispatchu "dostawa ok. 1 szlaku = 0,3 do 0,6") | NIE_ZMIERZONO — w danych nie ma ceny szlaku w PN; zamiast tego użyto zakresu 15 do 60 PN/turę z §2c |

Model rachunkowy: stała dostawa d, skrypt poza repozytorium (Python), pętla po turach z regułami z §3; wyniki dla wszystkich komórek §4.1 odtwarzalne z podanych wzorów. Katalog w kodzie nie jest zmieniany.
