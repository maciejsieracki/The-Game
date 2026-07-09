# SCHEMAT: sektory heksa + współistnienie ulepszeń (DO POTWIERDZENIA)

Maciej 2026-07-09. Przed przebudową reguł. Zasada: **każde ulepszenie ma swoje miejsce (bok) na
heksie**, dowolne mogą współistnieć, a jedynym twardym ogranicznikiem jest **teren** (+ tech + cyw).
Balans żywności trzyma **próg wzrostu miasta** (wartości finalne), NIE ograniczanie liczby ulepszeń.

## 1. MAPA SEKTORÓW (bok heksa → typ)

| Bok | Kąt | Zawartość | Klucze |
|---|---|---|---|
| **1** | 0° (N) | Surowce + ich ulepszenia | **kopalnia żelaza** (ruda żelaza) / **kopalnia miedzi** (ruda miedzi) · kamieniolom (TYLKO góry) · glinianka · warzelnia_soli · stadnina · (las:) wyrab · tartak · oboz_lowiecki |
| **2** | 60° | Pole uprawne (food-teren) | **farma** (płaski) / **tarasy** (wzgórza) · + **irygacja** jako nakładka |
| **3** | 120° | Hodowla | pastwisko(bydlo) · owczarnia(owce) · zagroda lam(lama) |
| **4** | 180° | Militaria | fort · posterunek (mocno mniejsze) |
| **5** | 240° | REZERWA | — (przyszłe) |
| **6** | 300° | REZERWA | — (przyszłe) |
| — | obwódka | **Droga** wokół heksa | droga · droga_brukowana (na razie pierścień; docelowo łączenie) |
| — | osobno | Woda | lodzie_rybackie (heks wody — sam, bez sektorów lądu) |

**Zasada środka:** okrąg r<0.40 ZAWSZE wolny — rezerwa pod miasto (przeżywa macierz B).

## 2. MACIERZ TERENÓW (co gdzie WOLNO — twardy ogranicznik)

| Ulepszenie | Łąka | Równina | Wzgórza | Góry | Pustynia | Wybrzeże/Morze | uwaga |
|---|---|---|---|---|---|---|---|
| farma | ✓ | ✓ | — | — | — | — | pole na płaskim |
| tarasy | — | — | ✓ | — | — | — | „farma wzgórz" |
| irygacja | ✓ | ✓ | — | — | ✓ | — | przy rzece; nakładka na pole |
| pastwisko (bydlo) | ✓ | ✓ | — | — | — | — | hodowla płaska |
| owczarnia (owce) | — | — | ✓ | — | — | — | hodowla wzgórz |
| zagroda lam (lama) | — | — | ✓ | ✓ | — | — | tylko cyw. Inkowie |
| stadnina (koń) | ✓ | ✓ | — | — | — | — | na złożu konia |
| kopalnia żelaza | — | — | ✓ | ✓ | — | — | na złożu rudy żelaza |
| kopalnia miedzi | — | — | ✓ | ✓ | — | — | na złożu rudy miedzi (dawn. popalnia_brazu) |
| kamieniolom | — | — | — | ✓ | — | — | **tylko GÓRY, bez złoża** |
| glinianka (glina) | ✓ | ✓ | ✓ | — | — | — | na złożu gliny |
| warzelnia (sól) | — | ✓ | — | — | ✓ | — | na złożu soli |
| wyrab/tartak/obóz | ✓las | ✓las | ✓las | — | — | — | na lesie (nakładka Las) |
| lodzie_rybackie | — | — | — | — | — | ✓ | woda |
| droga / brukowana | ✓ | ✓ | ✓ | ✓ | ✓ | (wybrzeże?) | obwódka |
| fort | ✓ | ✓ | ✓ | ✓ | ✓ | — | dowolny ląd |
| posterunek | ✓ | ✓ | ✓ | ✓ | ✓ | — | krawędź terytorium |

## 3. MACIERZ WSPÓŁISTNIENIA (wynika z terenu + sektorów)

Teren wybiera zbiór; w obrębie zbioru **wszystko współistnieje**, każde w swoim boku:

- **Płaski bez surowca:** farma(2) + pastwisko(3) + irygacja(2-nakł.) + fort/posterunek(4) + droga(obw.).
- **Płaski + koń:** stadnina(1) + farma(2) + pastwisko(3) + irygacja + fort + droga.
- **Płaski + sól:** warzelnia(1) + farma(2) + pastwisko(3) + fort + droga.
- **Płaski + glina:** glinianka(1) + farma(2) + pastwisko(3) + fort + droga.
- **Wzgórza + ruda:** kopalnia(1) + tarasy(2) + owczarnia(3) + fort + droga.
- **Wzgórza bez surowca:** kamieniolom(1?) / tarasy(2) + owczarnia(3) + fort + droga.
- **Góry + ruda:** kopalnia(1) + zagroda lam(3, Inca) + fort + droga.
- **Las:** wyrab/tartak/obóz(1) + fort + droga. (las BLOKUJE farma/pastwisko do wycięcia — wyrab czyści).
- **Woda:** lodzie_rybackie (sam).

Kluczowe: **jeden surowiec/nakładka na heks** (koń XOR ruda XOR glina XOR sól XOR las) → bok 1 zawsze ma max jedno „surowcowe".

## 4. ZALEŻNOŚCI PRZEMYŚLANE (też te nieomawiane)

1. **Irygacja** — nakładka na pole (bok 2), współistnieje z farmą i z surowcem. Wymaga sąsiedztwa rzeki (zostaje).
2. **Tarasy** — odpowiednik farmy na wzgórzach → bok 2 (na wzgórzach zamiast farmy). Nie na płaskim.
3. **Droga brukowana** — ulepszenie drogi (wymaga drogi). Ta sama obwódka.
4. **Las vs pole/hodowla** — las (nakładka) blokuje farmę/pastwisko. Wyrab CZYŚCI las → potem hex wolny na pole. Więc na lesie: tylko surowce-lasu (bok 1) + fort + droga, DOPÓKI las nie wycięty.
5. **Łodzie rybackie** — heks wody, brak sektorów lądu — renderuje się osobno (sam na heksie).
6. **Fort vs posterunek** — militaria (bok 4). **JEDEN na heks** (fort ALBO posterunek). Mocno mniejsze.
7. **Kamieniołom** — **tylko GÓRY, bez złoża** (kamień z terenu górskiego) → bok 1.
8. **Ruda: żelazo XOR miedź** (jeden typ na heks — hex.zloze). Ulepszenie dopasowane: ruda żelaza → **kopalnia żelaza**, ruda miedzi → **kopalnia miedzi**. „Brąz" NIE jest surowcem — dawne `popalnia_brazu` staje się **kopalnią miedzi** (miedź to surowiec, brąz to wytop miedzi).
9. **Miasto (macierz B)** — po założeniu: ocalałe ulepszenia zostają w swoich bokach, ZNIKA (las/wyrąb/obóz/irygacja/tarasy/fort/posterunek) usuwane, GÓRY kasują wszystko. Spójne z bokami.

## 5. ZMIANY REGUŁ W KODZIE (co usuwamy/luzujemy)

- **`improvement-build.ts` bramka rezerwy (397):** złoża NIE rezerwują heksa → inne ulepszenia współistnieją (dziś tylko koń; rozszerzyć na rudę/glinę/sól/las).
- **`SOLO_FOOD_KEYS` / `canAddFoodLayer`:** zdjąć „solo" z owiec/lamy i limity par — food współistnieje swobodnie (balans = próg wzrostu).
- **Bramka warstw (411-421):** zdjąć „non-food solo" — surowce-ulepszenia współistnieją z food (dziś wyjątek tylko stadnina).
- **ZOSTAJE:** teren (TERRAIN_ALLOW), tech, cywilizacja (lama=Inca), „jeden surowiec/heks", brak duplikatów.

## DECYZJE POTWIERDZONE (Maciej 2026-07-09)
1. **Ruda** = żelazo XOR miedź na heks. Kopalnia żelaza / kopalnia miedzi (wg rudy). `popalnia_brazu` → **kopalnia miedzi** (brąz nie jest surowcem).
2. **Kamieniołom** = tylko GÓRY, bez złoża.
3. **Boki 5-6** = puste (rezerwa). Tarasy dzielą bok 2 z farmą (wykluczają się terenem).
4. **Fort/posterunek** = jeden na heks.

## ZŁOŻA UJAWNIANE PER EPOKA (Maciej 2026-07-09)
Zasada: nie wszystkie złoża istnieją od startu — **część ujawnia się dopiero przy zmianie epoki**
(generowana wtedy na mapie). Na TYM etapie **węgla nie ma w ogóle**; węgiel pojawi się dopiero w
**epoce przemysłowej** (wtedy złoże `wegiel` + kopalnia węgla). Mechanizm: rozszerzyć istniejące
`deposit-era.ts`. Start gry: tylko rudy podstawowe (żelazo/miedź), koń, glina, sól, las.

## BRĄZ / MIEDŹ / ŻELAZO — ROZSTRZYGNIĘTE (Maciej, pierwsza runda pytań)
- Surowiec na mapie: **ruda miedzi XOR ruda żelaza** (jeden typ/heks). Brąz NIE jest surowcem (to stop miedzi).
- Ulepszenia dopasowane do rudy: **ruda miedzi → `kopalnia miedzi`** (dawna `popalnia_brazu`), **ruda żelaza → `kopalnia żelaza`**.
- **Brąz nadal POWSTAJE z miedzi**: łańcuch zostaje, źródłem jest miedź — `kopalnia miedzi` (mapa) + `Piec hutniczy` (miasto) → brąz → jednostki brązowe.
- Implementacja: `braz-access.ts` — bramka `empireHasPopalniaBrazu` → `empireHasKopalniaMiedzi` (miedź zamiast popalni). Rename klucza `popalnia_brazu` → `kopalnia_miedzi`; generyczna `kopalnia` → dopasowana do rudy (miedź/żelazo).
- Węgiel: brak teraz, dopiero epoka przemysłowa (złoża per epoka).

**→ Brak pytań otwartych. Schemat i macierze GOTOWE do implementacji reguł.**
