# Ulepszenia terenu + Posterunki — spec (lane MIASTO)
> Podział (ustalony 2026-06-24): **MAPA** = placement z mapy strategicznej (klik), stan/render ulepszenia na heksie, panel zasięgów + blokada poza granicą. **MIASTO** (ten dok) = bonusy/efekty + koszt każdego ulepszenia + dane granic/zasięgu + reguła zakładania (≥5). **SILNIK** = przepływ w turze (Praca → postęp zlecenia → ukończenie → flaga na heksie) + check granic przy placemencie.
> Dane tunowalne: `gra/data/terrain-improvements.json` (mój panel). Koszt płacony **z puli Pracy** w skarbcu (Q4).

## 1. Ulepszenia terenu (bonusy do plonów/ekonomii)
Bonus = na każde OBRABIANE pole z ulepszeniem. Koszt w Pracy. Tech = warunek odblokowania.

Źródło tunowalne: `gra/data/terrain-improvements.json`. Panel: `MIASTO/Ulepszenia-terenu.xlsx` (gen-ulepszenia-xlsx.py / export-ulepszenia.py). Ep. = epoka (1=Kamień, 2=Brąz, 3=Żelazo).

| Ulepszenie | Ep. | Bonus | Teren | Warunek / odblokowanie | Koszt | Tech |
|---|---|---|---|---|---|---|
| **Farma** | 1 | +1 żywność | Łąka, Równina | **bez rzeki** (podstawa) | 20 | Rolnictwo |
| **Pastwisko / zagroda** | 1 | +1 żywność, +1 Praca | Łąka/Równina/Wzgórza | zasób Koń/Krowa/Owca/Lama → **odblok. Konie** (rydwany/kawaleria) | 20 | Oswojenie zwierząt |
| **Kopalnia** | 1 | +2 Praca | Wzgórza/Góry/Ruda | → **odblok. Metal/Brąz** (jednostki, mury) | 25 | Murarstwo |
| **Kamieniołom** | 1 | +1 Praca, +1 kamień | Wzgórza, Góry | → **Kamień** (mury/budynki) | 22 | Murarstwo |
| **Obóz łowiecki** | 1 | +1 żywność, +1 Pieniądz | Las / dzika zwierzyna | dzika zwierzyna | 18 | Łowiectwo |
| **Wyrąb (obóz leśny)** | 1 | +1 Praca, +1 drewno | Las | wycinka odsłania teren | 20 | Obróbka drewna |
| **Łodzie rybackie** | 1 | +2 żywność | Wybrzeże, Morze | ławica ryb | 20 | Żegluga |
| **Droga** | 1 | +1 handel, +ruch | dowolny ląd | **tylko miasto↔posterunek** (MAPA pilnuje) | 15 | Koło |
| **Posterunek (Strażnica)** | 1 | — (rozszerza terytorium r=3) | ląd w/na krawędzi zasięgu | nie-miasto; mgła + węzeł dróg | 30 | — |
| **Irygacja** | 2 | +2 żywność | Łąka/Równina/**Pustynia** | **TYLKO pole przy rzece** — BRAK łańcuchów; kluczowa nad Nilem | 30 | Irygacja |
| **Glinianka** | 2 | +1 Praca | złoże Gliny | → **Cegła** (budynki brązu) | 20 | Garncarstwo |
| **Plantacja** | 2 | +2 handel | Łąka/Równina/Las | surowiec luksusowy (+zadowolenie pośrednio) | 22 | Kalendarz |
| **Warzelnia soli** | 2 | +1 Pieniądz, +1 żywność | Sól / Wybrzeże | → **Sól** (konserwacja + handel) | 20 | Garncarstwo |
| **Tarasy uprawne** | 2 | +2 żywność | Wzgórza | unikalne kulturowe (**Inkowie**); bonus żywn., NIE kultura | 25 | — |
| **Fort / umocnienia** | 3 | +obrona terenu | ląd w terytorium | obronne (bez plonów); wartość obrony z UNITS/walką | 25 | Budownictwo |

Decyzje MIASTA (na pytania MAPA): (1) **łodzie rybackie = TAK teraz**; (2) **kamieniołom OSOBNO** od kopalni (różne surowce: ruda→brąz, kamień→mury, glina→cegła); (3) **teren NIE daje +Nauka/+Kultura** — te idą z budynków/specjalistów/suwaka handlu; Tarasy = +żywność (nie kultura).

KLUCZOWA REGUŁA (Maciej): **Irygacja tylko na polu bezpośrednio przylegającym do rzeki** — koniec irygacji ciągniętej przez setki pól bez rzeki (jak w innych Cywilizacjach). Farma jest właśnie po to: daje żywność tam, gdzie irygacji się nie da. MAPA egzekwuje przyległość do rzeki przy placemencie.

## 2. Posterunek (Strażnica) — NOWY element
„Strażnica" = **posterunek** graniczny (NIE miasto). Definicja:
- **Funkcja:** ROZSZERZA zasięg terytorium (granicę) o promień `zasieg_posterunku` (proponuję **3 pola**) — pozwala stawiać ulepszenia i zakładać miasta dalej (z zachowaniem dystansu ≥5 między miastami).
- **Widoczność:** odkrywa mgłę w swoim promieniu.
- **Drogi:** jest węzłem sieci dróg (drogi łączą miasta + posterunki).
- **Plony:** ŻADNE (to nie miasto) — czyste narzędzie ekspansji terytorialnej.
- **Koszt:** ~30 Praca (z puli); ewentualne małe utrzymanie (do decyzji).
- **Placement:** tylko w obrębie / na krawędzi własnego zasięgu (łańcuchowe rozszerzanie), nie w cudzym terytorium.
- **Obrona (opcjonalnie, v0.2):** punkt kontroli / mały bonus widoczności-ostrzegania.

## 3. Granice / zasięg miasta (dane MIASTA dla panelu i ograniczeń)
- **Okolica robocza** (pola na plony) = promień **5 z każdej strony** (~11×11) — param `zasieg_okolicy_miasta`.
- **Zasięg terytorium** (gdzie wolno budować/ulepszać) = granica miast (kultura) + posterunki.
- **Zakładanie miasta:** tylko w terytorium **i** ≥5 pól od innego miasta (cities.canFoundCity: teren + dystans ≥5; check terytorium dostarcza MAPA/SILNIK).

## 4. Styk (kto czego używa)
- **MIASTO:** wartości bonusów/kosztów (`terrain-improvements.json`), reguła irygacji (przy rzece), reguła dystansu ≥5, dane zasięgu okolicy (5) + posterunku (3).
- **MAPA:** placement (klik), egzekwowanie warunków (rzeka dla irygacji, granica dla miast, droga tylko miasto↔posterunek), stan/render na heksie.
- **EKONOMIA:** doliczanie bonusów ulepszeń do plonów obrabianych pól (workedTiles).
- **SILNIK:** Praca z puli → postęp zlecenia ulepszenia → ukończenie → flaga na heksie; check granic przy placemencie.
