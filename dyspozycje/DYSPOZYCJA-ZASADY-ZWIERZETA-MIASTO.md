# DYSPOZYCJA: zasady zwierząt/ulepszeń + macierz miasta
(MASTER, 2026-07-09 · decyzje Macieja z formularza 1abc · wykonawca: CODE-INTEGRATOR · NA PÓŹNIEJ — po tematach FPS, na osobne „start ZASADY-ZWIERZĄT")

## A. Reguły zwierząt i farmy (decyzje: 1b+, 2a, 3a, 4-szablon)

1. **Jeden typ zwierzęcia hodowlanego na heks** (krowy XOR owce XOR lama) — JUŻ obowiązuje w generatorze; nie ruszać.
2. **Owce: tylko wzgórza** — już obowiązuje (generator+budowa+dane); nie ruszać.
3. **LAMA: tylko wzgórza ORAZ góry** (ZMIANA — dziś budowa dopuszcza Łąka/Równina/Wzgórza): `improvement-build.ts` TERRAIN_ALLOW.lama → {Wzgórza, Góry} + `terrain-improvements.json` opis.
4. **FARMA może współistnieć WYŁĄCZNIE z:** krową (jak dziś) ALBO irygacją (FoodStack farma+irygacja). **Farma+owce i farma+lama pozostają NIELEGALNE** (status solo owiec/lamy bez zmian — decyzja 1b).
5. **KOŃ = czysty surowiec-dostęp (decyzja 2a):** zero produkcji; **współistnieje ze wszystkim** (krowy/owce/lama/farma/irygacja). Zmiana reguł budowy: stadnina/koń nie blokuje i nie jest blokowany przez food-gate (`canAddFoodLayer`/SOLO_FOOD_KEYS — koń poza systemem „food"); farma może stanąć na heksie ze złożem konia. Render: znacznik konia (model bez jeźdźca, sektor E) dokłada się do każdej kompozycji — wdrożone w GRAFIKA-3D, zweryfikować po zmianie reguł.
6. **LAMA — naprawa luki (decyzja 3a — POSIEW, bez zmiany hasha):** generator NIE jest dotykany. Po wygenerowaniu mapy, przy przydziale startu Inków, gra DOSTAWIA złoża lamy (`Nakladka.ZlozeLamy`) na wzgórzach/górach regionu startowego Inków (np. 2–3 złoża w promieniu startowym; deterministycznie z ziarna mapy + pozycji startu, NIE z rand() generatora). Jeśli Inków nie ma w rozgrywce — lam nie ma.
7. **Nowy Świat — szablon ograniczeń (decyzja 4; dziś dotyczy tylko Inków):** na starcie ZAKAZ koni, owiec i krów (nie występują tam). Odblokowania: bydło/owce od epoki 3 (jak w obecnym kodzie), **koń — po uzyskaniu dostępu do złoża koni** (ZMIANA: dziś kod blokuje konia Inkom NA ZAWSZE — poprawić na warunek dostępu). Gdy dojdą kolejne cywilizacje amerykańskie (Majowie itd.) — te same ograniczenia (funkcja po typie „Nowy Świat", nie po nazwie Inków).

## B. MACIERZ MIASTA — co zostaje/znika przy budowie miasta na heksie
(**ZAAKCEPTOWANA W CAŁOŚCI przez Macieja 2026-07-09** — „Punkty 1 do 15 się zgadzają", łącznie z pozycjami *; wprowadzić do zasad gry i dokumentacji: `terrain-improvements.json` opisy + logika zakładania miasta)

ZOSTAJE: farma · krowy · owce · lama · koń+stadnina · złoża naturalne (miedź/żelazo/węgiel/sól/glina)* · kopalnia/kamieniołom/glinianka/warzelnia soli* · drogi (obie)*.
ZNIKA: las (teren) · wyrąb · obóz łowiecki · tartak* · irygacja · pole irygowane · tarasy* · fort/posterunek*.
WYJĄTEK GÓRY: miasto na heksie górskim kasuje WSZYSTKIE ulepszenia (zostaje miasto + bonusy terenu).
N/D: łodzie rybackie (woda).
Wykonanie: logika zakładania miasta filtruje ulepszenia/nakładki heksa wg macierzy (najpierw AUDYT co robi dziś — nie zakładać); las → usunięcie nakładki lasu.

## C. Zasada layoutu render (obowiązuje wszystkie ulepszenia)
Wszystkie modele ulepszeń: MAŁE, przy bokach heksa (pierścień ~0.50–0.80 R), **środek heksa ZAWSZE wolny pod przyszłe miasto**. Korekta: farma-solo (P2) stoi dziś na środku → przesunąć na pierścień. Miasto po wybudowaniu zajmuje środek, ocalałe ulepszenia z macierzy B zostają na obrzeżu heksa.

## D. GRAFIKA I OPISY — mapowanie macierzy na GOTOWE modele (nic nowego nie rysujemy)

**Przydział sektorów pierścienia (0.50–0.80 R; środek ZAWSZE wolny pod miasto):**
| Sektor | Azymuty | Zawartość |
|---|---|---|
| N-NE | −25°..70° | KROWY (buildKrowa ×2, pozy/warianty z modelu) |
| E | 70°..120° | KOŃ-dostęp (buildHorse bez jeźdźca ×1–2 wg jakości) |
| S-SW | 155°..250° | OWCE (buildOwca ×2) **ALBO** LAMA (×1–2; lama nigdy z owcami — sektor współdzielony bezkolizyjnie) |
| W-NW | 250°..335° | FARMA (buildFarma wariant mały) + ew. zagroda-dodatki przy niej |

**Doprecyzowanie zasady środka:** elementy z klasy **ZOSTAJE** (macierz B) MUSZĄ mieszkać na pierścieniu (przeżywają miasto, które zajmie środek). Elementy z klasy **ZNIKA** (irygacja, pole irygowane, tarasy, fort/posterunek) MOGĄ zajmować środek — i tak są kasowane przy budowie miasta. Kopalnia/kamieniołom/glinianka/warzelnia (ZOSTAJE) — na pierścień, jeśli dziś stoją centralnie: przesunąć.

**15 kombinacji = czysta kompozycja slotów** (przykłady): krowy → 2 krowy N-NE · krowy+farma → +farma W-NW · krowy+farma+koń → +koń E · owce → 2 owce S-SW · lama → lama(y) S-SW · farma solo → farma W-NW (poletka przycięte do sektora) · farma+irygacja → farma W-NW + kanały irygacji (mogą przez środek — klasa ZNIKA) · sam koń → koń E. Model pokazowy `buildPastwiskoZwierzeta` NIE jest używany nigdzie.

**OPISY W GRZE (naprawa systemowa zgłoszenia Macieja „opis mówi bydło, a widać wszystko"):** tooltip/opis heksa jest GENEROWANY z faktycznej zawartości heksa i wymienia dokładnie to, co widać, np. „Bydło (złoże) · Farma · Konie (dostęp)". Nazwy elementów: Bydło / Owce / Lama / Konie (dostęp) / Farma / Irygacja / Pole irygowane / Tarasy / [reszta jak w terrain-improvements.json]. Zakaz rozjazdu opis↔grafika: jedna funkcja składa listę i dla tooltipa, i dla wyboru modeli.

## E. ZADANIA DLA CODE — krok po kroku (po FPS, na „start ZASADY-ZWIERZĄT")
1. **Reguły budowy** (`improvement-build.ts` + `terrain-improvements.json`): lama→{Wzgórza,Góry}; farma współistnieje tylko z krową albo irygacją; koń poza food-gate (współistnieje ze wszystkim); Nowy Świat: koń po zdobyciu dostępu do złoża koni (zamiast „nigdy"), bydło/owce od epoki 3 (bez zmian), funkcja po typie „Nowy Świat".
2. **Posiew lamy** przy starcie Inków: 2–3 złoża `ZlozeLamy` na wzgórzach/górach regionu startowego, deterministycznie (ziarno mapy + pozycja startu), POZA generatorem. Bramka: hashe kontrolne map bez zmian.
3. **Logika miasta:** najpierw AUDYT co dziś robi zakładanie miasta z nakładkami → wdrożyć filtr wg macierzy B (ZOSTAJE/ZNIKA + wyjątek GÓRY + las znika).
4. **Render:** przydział sektorów wg tabeli D (zweryfikować stan po GRAFIKA-3D); farma-solo i budynki klasy-ZOSTAJE na pierścień; klasa-ZNIKA może środek; `buildPastwiskoZwierzeta` wycofany z użycia.
5. **Opisy:** jedna funkcja „zawartość heksa" → tooltip = lista widocznych elementów (D); aktualizacja tekstów w `terrain-improvements.json`; aktualizacja dokumentacji zasad (PROJEKT-GRY-master.md sekcja zwierzęta/miasto — dopisać macierz B).
6. Commit per krok, jeden deploy na końcu, meldunek ze stemplem.

## Bramki
tsc=0 · vite bez prebuildu · hashe mapy NIETKNIĘTE (posiew lamy poza generatorem — zweryfikować hashe kontrolne po zmianie!) · test Macieja: (a) owce/lama tylko wzgórza (lama też góry), (b) farma+krowa i farma+irygacja legalne, farma+owce NIE, (c) koń dokłada się wszędzie, (d) start Inkami → lamy w regionie, bez koni/owiec/krów, (e) budowa miasta na heksie z farmą+krową → zostają; na lesie z wyrębem → znikają; na górze → znika wszystko, (f) opis każdego heksa = dokładnie to, co widać.
