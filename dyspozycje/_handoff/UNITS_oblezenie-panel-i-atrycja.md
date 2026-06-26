# Oblężenie — PANEL oblężenia + ATRYCJA garnizonu (decyzje + spec)

**Data:** 2026-06-25 · **Od:** Civ-UNITS · Dla: UX (panel) + SILNIK (tura oblężenia) + balans

## 1. PANEL OBLĘŻENIA (gdy powstaje plansza oblężenia)
Pojawia się, gdy gracz atakuje miasto **z murem** (bez muru = zdobycie z marszu). Panel zawiera:
- **Budowa machiny oblężniczej** — wybór: Taran / Katapulta / Wieża oblężnicza + ILOŚĆ.
  - **REGUŁA (Naster): 1 machina = 1 tura.** Chcesz 3 machiny → czekasz 3 tury (kolejka budowy).
  - PRZYSZŁOŚĆ: liczba machin/turę zależna od **wielkości armii + umiejętności generała** (na razie sztywno 1/turę).
- **Status oblężenia:** numer tury oblężenia, lista zbudowanych/budowanych machin, HP bramy (i muru), stan garnizonu.
- **Atrycja garnizonu:** podgląd, ile HP traci obrońca za turę oblężenia i ile tur do załamania (model niżej).
- **Akcje:** „Szturm" (wejdź do bitwy taktycznej), „Kontynuuj oblężenie/głodzenie" (kolejna tura, +atrycja, +budowa machiny), „Odwrót".
- Styk z UX: panel = nakładka trybu oblężenia (osobny od HUD bitwy polowej). UNITS dostarcza dane (machiny, HP bramy, atrycja); UX projektuje layout.

## 2. ATRYCJA GARNIZONU — 3 modele + TURNIEJ
Pytanie: ile HP tracą jednostki w mieście w zależności od długości oblężenia. Symulacja (% max HP utracone narastająco, tury 1–8):

| Tura | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 50% strat | zniszczenie |
|---|---|---|---|---|---|---|---|---|---|---|
| **A. Liniowy stały** (−8%/turę) | 8 | 16 | 24 | 32 | 40 | 48 | 56 | 64 | tura 7 | >8 |
| **B. Głodowy/narastający** (strataₜ=3%·t) | 3 | 9 | 18 | 30 | 45 | 63 | 84 | 100 | tura 6 | tura 8 |
| **C. Dwutorowy** (bufor zapasów 3 tury, potem −12%/turę) | 0 | 0 | 0 | 12 | 24 | 36 | 48 | 60 | tura 8 | >8 |

### Turniej (ocena ważona 1–5)
| Kryterium (waga) | A | B | C |
|---|---|---|---|
| Realizm głodu/oblężenia (×3) | 2 | 4 | 5 |
| Czytelność dla gracza (×2) | 5 | 3 | 3 |
| Tempo / decyzyjność „szturm vs głodzenie" (×3) | 2 | 4 | 5 |
| Łatwość implementacji TERAZ (×2) | 5 | 4 | 2 |
| Skalowalność (wielkość miasta/zapasy/generał) (×2) | 2 | 3 | 5 |
| **SUMA ważona** | **36** | **44** | **50** |

### Mój wybór (rekomendacja)
- **Docelowo: C (dwutorowy)** — najlepszy realizm + decyzyjność + skalowalność; bufor zapasów zależny od wielkości miasta/żywności (i w przyszłości generała) wprost realizuje Twoje „uzależnimy od wielkości armii i generała". Wymaga jednak danych o zapasach/wielkości miasta, które nie są jeszcze wpięte.
- **Teraz: wdrożyć B (głodowy/narastający)** — prosty wzór (bez nowych danych), dobre rosnące napięcie w czasie, łatwy do przeskalowania na C, gdy pojawią się dane miasta.
- To jest właśnie podejście **dwutorowe**: start B → ewolucja do C. Parametry (3%/8%/12%, bufor) — do strojenia z balansem.

## 2b. MODEL ZATWIERDZONY (Naster, 2026-06-25) — ZAPASY ŻYWNOŚCI + DROBNA ATRYCJA
Po turnieju Naster zatwierdził syntezę C+A: **zegar głodu na zapasach żywności + stała drobna atrycja**.

**Zegar głodu (główny):**
- Miasto ma magazyn żywności — wartość z **EKONOMII** (zapasy + populacja).
- Oblężenie = blokada → odcina dopływ żywności z okolicy; magazyn już się nie uzupełnia, tylko topnieje.
- Co turę oblężenia magazyn maleje o **zużycie = populacja + liczba jednostek garnizonu** (każda gęba = 1 żywność/turę).
- Dopóki magazyn > 0 → garnizon NIE głoduje (0 strat z głodu).
- Magazyn = 0 → głód: praktycznie następnej tury **kapitulacja** (gwałtowne załamanie morale).

**Drobna ciągła atrycja (oblężniczy ucisk):**
- Niezależnie od żywności: **−8% HP/turę** garnizonowi (zmęczenie, ostrzał z przedpola, choroby).
- Gwarantuje postęp oblężenia nawet przy dużych zapasach; daje wybór szturm vs głodzenie.

**Upadek miasta = co pierwsze:** zapasy żywności = 0 (głód → szybka kapitulacja) **LUB** HP garnizonu ≤ próg osłabienia (rekom. ~30–40% średniego HP).

**Efekt:** dwa zegary — głodowy (długi, skaluje się z wielkością miasta i garnizonu) + atrycyjny (krótki, stały). Małe miasto z dużym garnizonem głodnieje szybko; duże zaopatrzone trzeba długo głodzić albo szturmować. Skalowalne: generał (przyszłość) może zmniejszać atrycję obrońcy lub zużycie żywności.

**Podział pracy:**
- **EKONOMIA**: wystawia zapas żywności miasta + populację + regułę „blokada oblężnicza odcina dochód żywności". (Patrz handoff `UNITS-do-EKONOMIA_zapasy-oblezenie.md`.)
- **SILNIK**: pętla tury oblężenia — odejmowanie żywności (pop+garnizon), naliczanie −8% atrycji, warunek upadku, budowa 1 machiny/turę, przejście do szturmu. (Handoff `UNITS-do-MASTER_oblezenie-tura.md`.)
- **UNITS**: parametry (8%/turę, próg upadku, tempo kapitulacji po głodzie) + podgląd w panelu (żywność, tury do głodu, HP garnizonu).

**Parametry do strojenia:** atrycja 8%/turę; próg upadku HP; kapitulacja po wyzerowaniu zapasów = 1 tura.

## 3. DO ZROBIENIA
- UNITS/UX: panel oblężenia (kolejka 1 machina/turę, status, atrycja, akcje).
- SILNIK: tura oblężenia (żywność pop+garnizon, −8% atrycja, warunek upadku, budowa machiny, szturm).
- EKONOMIA: format danych o zapasach żywności + blokada.
- Balans: 8%/turę, próg upadku HP, koszt/tempo machin.

— Civ-UNITS
