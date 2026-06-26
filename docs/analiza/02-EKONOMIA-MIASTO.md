# 02 — Analiza: EKONOMIA (scalona z MIASTO)

*Wygenerowano autonomicznie: 2026-06-26 | Źródła: EKONOMIA-DO-MASTERA.md, MIASTO-DO-MASTERA.md, EKONOMIA-model-scalony.md, DZIENNIK-MASTERA.md*

---

## 1. Zakres lane'a

**EKONOMIA wchłonęła MIASTO** (decyzja Macieja 2026-06-25). Pliki wyłączności:
- `economy.ts`, `turn-economy.ts`, `upkeep.ts`, `wealth.ts`, `converters.ts`
- `cities.ts`, `production.ts`, `order.ts`, `culture-religion.ts`, `okolica.ts`, `auto-manage.ts`
- `playerState.ts` (przejęty — pula nauki + akumulacje civ-level + skarbiec = EKONOMIA)
- Dane: `buildings.json`/Budynki.xlsx, `society-params.json`/Społeczeństwo-parametry.xlsx, `terrain-improvements.json`, `econ-params.json`/Ekonomia-parametry.xlsx

**NIE moje (granica):** `main.ts`, render/battle, civs/tech/ai, AI wykluczone.

## 2. Stan obecny (~78% EKONOMIA, ~82% MIASTO)

### ZROBIONE (testy zielone, subagenci Sonnet, NIEwpięte częściowo)
- **RDZEŃ TURY** (`turn-economy`/`economy`/`economy-upkeep`):
  - zdrowie WIRE (bonusy + minusy)
  - `splitPraca` (podział Handlu)
  - Luksus→Wealth (+ mnożnik na podatek)
  - growthMult (przed `populationGrowth`)
  - compound +10% (`buildingValue` + `buildingUpkeep`)
  - Waluta ×2 na CAŁĄ pulę Handlu (Skarbiec + Badania + Wealth) — POTWIERDZONE 2026-06-26
  - Praca→Pieniądz z `doPuli` (nadwyżka) × 2 gdy Targowisko+Waluta
- **ETAP 2 RELIGII** (`culture-religion`): `spreadReligion` (był) + nowy `cityTradeMultiplier`
- **DANE**:
  - `terrain-improvements.json` v0.1 (15 ulepszeń + `surowiecOdblokowany` + zasięgi posterunek/fort)
  - Drzewko Żelaza (tech.json +9 techów) + 11 budynków Żelaza (buildings.json → 9 z Warsztatem po korekcie 2026-06-26)
  - Okolica/plony: `cityRangeForPopulation = min(pop, 15)` (radius=pop) + plony TYLKO z pól z przypisanym obywatelem (N=pop, `assignWorkedTiles`), centrum bazowo
  - Default podziału Handlu = 70 Skarbiec / 20 Badania / 10 Wealth (econ-params; "10% podatek" = Wealth)
  - Koszt jednostek = zawsze skarbiec (anulowany wyjątek Kamień=Praca)
  - Oblężenie (turn-economy: flaga `oblegane`, getCityFood) — kontrakt do UNITS
  - Nauka sterowana graczem (w DRZEWKU, nie osobny panel)
- **LAZARET/koszary-gate-test NAPRAWIONE 2026-06-26**: `buildings.json` lazaret `epokaWejscia=5` (Średniowiecze, kanon); test zsynchronizowany. Rebuild kanonu gotowy.
- **WARSZTAT OBLĘŻNICZY = ŻELAZO (epoka 3)** (korekta Macieja 2026-06-26 — cofnięto przeniesienie na Średniowiecze). Zestaw Żelaza = 9 budynków (z Warsztatem). Lazaret = 5, Wielka Kuźnia = 4 — bez zmian.
- **MIASTO** (przejęte): cities, production, order, culture-religion, auto-manage (toggle w cityPanel), panel miasta (UI), maMur (prereq bonusów obrony), foundCityFromVillage

### TESTY (ostatnie zielone)
- logic-test 180/180 (wg EKONOMII 191/191 po naprawie Lazaretu)
- wire-ekonomia 23/23, wealth 25/25, upkeep 51–53/53, growthmult-compound 20/20
- culture-religion 43/43, okolica 16/16, split-output 46/46, happiness 38/38, found-from-village 24/24
- koszary-gate 18/18 (po naprawie — wg EKONOMII; wg DZIENNIK baseline-red akceptowalny)

## 3. Otwarte wątki

| # | Wątek | Status | Czeka na |
|---|-------|--------|----------|
| 1 | Nauka = pula sterowana graczem | ROBI — ENGINE+UI DONE | Finalizacja wyboru celu w ekonomii (UI drzewko gotowe) |
| 2 | Dostęp surowców = boolean (złoże+ulepszenie+przetwórnia) | ROBI | MAPA+EKONOMIA+DANE |
| 3 | Zasięgi terytorium (pop=radius, cap 15; fort+10, posterunek+5) + kultura +0..3 (max r18) | ROBI — decyzja 1B | EKONOMIA eksport + MAPA territory sync (GOTOWE) |
| 4 | Bonusy obrony (mur+200/fort+100/posterunek+50) | ROBI — partial WPIĘTE | Budynek Mury (MIASTO=GOTOWE) + pełne wpiecie siege |
| 5 | Mnożnik Handel→Pieniądz (baza 2, per-cyw) + Mennica | ROBI — ×2 na całą pulę DONE | Wartości per-cyw w civs.json (1.7–2.4, do strojenia Macieja) |
| 8 | Wealth | BLOK | Maciej: W1–W6 (szkielet zbudowany, scope v0.1 = W6) |
| 9 | Ulepszenia terenu + posterunki | BLOK | Maciej: akceptacja listy/wartości |

## 4. Decyzje Macieja zamknięte (2026-06-25/26)

- **1A ZDROWIE** = pełny model (WIRE — podłączyć)
- **2A "rozwój"** = Luksus→Wealth (zastępuje luksus→happiness)
- **3A nastroje** = netto + tier (`getOrderState`, bez rozkładu 3-koszykowego)
- **Waluta ×2** = cała pula Handlu (potwierdzone 2026-06-26)
- **Praca→Pieniądz** = z `doPuli` (nadwyżka) × 2 (potwierdzone 2026-06-26)
- **1A ŻELAZO GO** = 3 epoki w v0.1 (Kamień/Brąz/Żelazo)
- **2A ROBOTNIK USUNIĘTY** = ulepszenia = akcja z mapy (Zwiadowca zostaje)
- **1B terytorium** = bazowy zasięg (min(pop,15)) + zasięg kulturowy (cityBorderRadius +0..3, max r18) — addytywnie
- **Podział Handlu default** = 70 Skarbiec / 20 Badania / 10 Wealth
- **Warsztat oblężniczy** = Żelazo (epoka 3) — korekta 2026-06-26
- **Lazaret** = Średniowiecze (epoka 5) — koszary-gate baseline-red akceptowalny
- **T1–T4 (CYWILIZACJE)** = A/A/A/B (Respekt ratio-share / pełna dyplomacja AI / bonusy strukturalne / spryt od trudności)

## 5. Quick wins / next

| # | Co | Effort | Impact |
|---|-----|--------|--------|
| QW1 | Wpięcie plastra EKONOMIA+UI (#7) — gotowe, czeka "idź" | S | 🔴 Odblokowuje ekonomię miasta |
| QW4 | Realizacja mnożnikHandel per-cyw (pole w civs.json istnieje, 1.7–2.4) | S | 🟡 Balans handlu |
| EP5 | Wealth system (moduł + wpiecie) po decyzji W1–W6 | M | Decyzja Macieja |

## 6. Właściciele

| Rola | Model |
|------|-------|
| Implementacja ( Composer ) | `composer-2.5-fast` subagent |
| Model Wealth / balans ( GLM ) | `glm-5.2-max` subagent |
| Testy regresji ( Opus ) | Opus 4.8 Ask/Agent |
| Decyzje W1–W6, U1, akceptacja | Maciej |

## 7. Ryzyka

- **Surowce żelazo/stal** do `resources.json` = DANE/MAPA (mój tech-handoff flagował)
- **`mnoznikHandelPieniadz` per-cyw** (1.7–2.4) — w nowym modelu Waluta=×2 jest głównym mnożnikiem, per-nacja = opcjonalna wariacja, niski priorytet — czeka na priorytet od Macieja
- **Niespójność epoka-budynek↔tech** dla Warsztatu (techUnlock="Oblężnictwo" Żelazo, ale Katapulta=Średniowiecze) — parked, nieblokujące
