# EKONOMIA — Model scalony (miasto + gospodarka) — v0.1

**Data:** 2026-06-25 · Founding-dokument po scaleniu MIASTO→EKONOMIA. Godzi rozjazdy.
**Decyzje Maciela (2026-06-25):** zdrowie = **WIRE** (1A); „rozwój" = **Luksus→Wealth** (2A); nastroje = **netto + tier** (3A).
**Źródła:** `EKONOMIA-zdrowie-miasta-projekt.md`, `EKONOMIA-rozwoj-4kubelek-projekt.md`, `_handoff/EKONOMIA-do-MASTER_przejecie-miasta.md`.

---

## 1. Zakres lane'u
EKONOMIA = miasto + cała gospodarka + akumulacje cywilizacji (skarbiec, **pula nauki**, surowce) + `playerState.ts`.
NIE moje: koszty techów (`tech.json`) + wybór AI (`chooseAIResearch`) = CYWILIZACJE; stan heksów/mapy = MAPA; render/walka = MAPA/UNITS; wpięcie w `main.ts`/kanon = master.

## 2. Przepływ outputu miasta (KANON)
Miasto produkuje co turę **Pracę** i **Handel** (netto, po korupcji). Dwa suwaki dzielą output:

**SUWAK PRACY** (`podziałPracy`, `production.splitPraca`):
`% budynki` (=„produkcja", kolejka budowy) · `% pula` (teren/ulepszenia/rezerwa)

**SUWAK HANDLU** (`podziałHandlu`, `economy.ts`):
`% Nauka` · `% Pieniądz` · `% Luksus` (=„rozwój")

**4 kubełki w UI** = produkcja (Praca→budynki) + Pieniądz + Nauka + rozwój (Luksus→Wealth).
(Praca→pula = 5. strumień wewnętrzny, na ulepszenia terenu / rezerwę — nie pokazywany jako osobny kubełek.)

## 3. Dokąd trafia każdy strumień
| Strumień | Cel |
|---|---|
| Produkcja (Praca→budynki) | kolejka produkcji miasta (`production.ts`) |
| Praca→pula | ulepszenia terenu / rezerwa |
| **Nauka** | globalna **PULA NAUKI** gracza (`playerState.nauka`) → wydawana na tech (`researchStep`) |
| **Pieniądz** | skarbiec gracza (`playerState.skarbiec`), ×mnożnik Wealth (na podatek) ×Mennica |
| **Luksus („rozwój")** | system **WEALTH** (`wealth.advanceWealth(spoleczMoney = luksus)`) → mnożnik podatku + zadowolenie |

## 4. Magazyn nauki (ROZSTRZYGNIĘTE: mój)
Pula w `playerState` (akumulacja `totalNauka`). `research.ts` (orphan) **KASUJEMY**.
`economy.ts` liczy podział Nauka/Pieniądz **raz**; `playerState` tylko **bankuje** gotowe sumy → **brak dubla** (potwierdzone w kodzie).
Koszty techów + polityka wyboru AI = CYWILIZACJE. SEAM: dzisiejszy auto-pick `cheapestAvailable` docelowo deleguje do `chooseAIResearch`.

## 5. Zdrowie miasta (WIRE)
Param zdrowia w `economy.ts` jest poprawny, ale runtime hardkoduje `zdrowie: 0` (martwy). PODŁĄCZAMY:
źródła zdrowia (budynki kat. Zdrowie: Studnia/Akwedukt +; teren Bagno/zanieczyszczenia −) → wartość zdrowia miasta → istniejąca formuła.
Parametry: `society-params.json` (14 gotowych, easy/normal/hard). Szczegóły: `EKONOMIA-zdrowie-miasta-projekt.md`.

## 6. Nastroje (netto + tier)
`order.evaluateOrder({szczescie, prawo}) → {order, tier, effects}`. Dla UI: `getOrderState`. Bez rozkładu 3-koszykowego (3A).
`szczescie` = budynki (`baza.zadowolenie`) + poziom Wealth (`wealthZadowolenie`) + religia (`religionHappiness`) − kary.

## 7. Co wymaga WPIĘCIA (gap „moduł jest, niewpięty")
1. `splitPraca` → wywołać w `advanceCityEconomy` (dziś NIE wywołane).
2. Luksus→Wealth → `advanceWealth` per miasto w `turn-economy` (dziś NIE wpięte).
3. Zdrowie → policzyć w `toEconomyCity` zamiast hardkodu `0`.
4. `growthMult` (z `order`) → hook w `turn-economy`.
5. Compound +10% → `economy.buildingValue` użyje `production.buildingEffectAtLevel`.

Logika w `turn-economy`/`economy` = moja; instancja + wołanie w `main.ts` = master (po moim handoffie).

## 8. Kolejność realizacji
Najpierw wpięcia 7.1–7.3 (decyzje 1A/2A: zdrowie + splitPraca + Luksus→Wealth) — jeden subagent, wspólne pliki, backup + testy.
Potem 7.4 (growthMult) i 7.5 (compound) — serial (te same pliki). Każdy etap: testy zielone → handoff do mastera na wpięcie.

## 9. Reconciliation: `splitOutput` z sesji MIASTO (2026-06-25)
Sesja MIASTO (przed scaleniem) zrobiła `splitOutput` (`production.ts`) — podział jednego `total` na 4 strumienie (produkcja/Pieniądz/Nauka/rozwój) + `cityScienceOutput`/`cityMoneyOutput`. **Status: NIEWPIĘTY** (tylko test 46/46).
KANON = model 2-suwakowy z sekcji 2: Praca i Handel to RÓŻNE zasoby, dzielone OSOBNO (`splitPraca` + `podziałHandlu`). `splitOutput` zlewa je w jeden `total`, więc **NIE wpinać as-is**. Do zrobienia (moja pozycja, nie blokuje): zdeprecować `splitOutput`, ewentualnie zachować `cityScienceOutput`/`cityMoneyOutput` jako helpery agregacji per-miasto (zgodne z kanonem). Audyt 2026-06-25 potwierdził: brak clobberu MIASTO↔EKONOMIA, wszystko kompiluje, `logic-test 163/163`.

## 10. Waluta (Currency) — Model finalny (2026-06-25)

### Semantyka
„Waluta" i „Pieniądz" = SYNONIMY. Handel netto = podstawa obu efektów.

### Efekt 1 — Handel → Pieniądz ×2 (gate: tech Waluta)
- Po wynalezieniu **Waluty** cały `handelNetto` KAŻDEGO miasta jest automatycznie mnożony przez `walutaMnoznik` (domyślnie **×2**).
- Mnożnik działa na **całą pulę Handlu PRZED podziałem** na Nauka/Pieniądz/Luksus → wzrasta zarówno Pieniądz, jak i Nauka i Wealth z handlu.
- Realizacja: `ctx.walutaOdkryta?: boolean` (opcjonalne, default false); `handelNetto = handelNettoRaw * (walutaOdkryta ? walutaMnoznik : 1)`.
- Param: `waluta_mnoznik` w `econ-params.json > budynki` (easy/normal/hard = **2/2/2**).
- Dotyczy wszystkich miast automatycznie po zbadaniu Waluty. Nie wymaga budynku.

### Efekt 2 — Praca → Pieniądz ×2 (gate: Targowisko w mieście + Waluta)
- Gdy `ctx.maTargowisko === true` **i** `ctx.walutaOdkryta === true`: pula-Praca (`doPuli` = Praca nie idąca na budynki) konwertuje się na Pieniądz: `pieniadzZPracy = floor(doPuli × targowiskoPracaMnoznik)`.
- `doPuli = floor(pracaNetto × (1 − procentBudynki/100))` — obliczane wewnętrznie w `cityYieldPerTurn`.
- Wynik `pieniadzZPracy` trafia do sumy `pieniadz` w `CityYieldResult` i `CityEconomyTick`.
- Param: `targowisko_praca_na_pieniadz_mnoznik` w `econ-params.json > budynki` (domyślnie **2**).
- Gate ŚCISŁY: oba warunki wymagane — Targowisko bez Waluty = 0; Waluta bez Targowiska = 0.

### Targowisko — bonusy bazowe (BEZ ZMIAN)
- **+50% Handel** (mnożnik na `handelTerenu`, param `budynek_targowisko_bonus_handlu = 0.5`): `ctx.maTargowisko` w Step 3.
- **+3 Pieniądz** (z `baza.pieniadz` w buildings.json): naliczany w Step 4 jako każdy inny budynek.
- **`baza.mnoznik = 0`** (naprawiony błąd `mnoznik=10` → brak wpływu na Pracę).

### Kontrakt wpięcia (dla MASTER)
- `ctx.walutaOdkryta` (bool, opcjonalne): master ustawia z `playerState` (czy tech Waluta w `zbadane`).
- `ctx.maTargowisko` (bool): master ustawia per-miasto (budynek 'targowisko' wybudowany).
- `ctx.mennicaMnoznik` = **1** (neutralny, nie zastępuje walutaMnoznik — to osobny mnożnik).
- Martwa flaga `PIENIADZ_MNOZNIK=10` w `playerState` → ustaw **2** lub usuń (Handoff niżej).
- Handoff pełny: `_handoff/EKONOMIA-do-MASTER_currency-final.md` (SUPERSEDUJE `EKONOMIA-do-MASTER_waluta-targowisko-x2.md`).

### Kolejne tiery waluty (przyszłość, poza v0.1)
Następne currency-techy: ×10, potem ×100 (obniżone z ×100/×1000). Mennica = ewent. budynek wyższego tieru (×10) — do ustalenia z Maciejem.

### Inne decyzje z 2026-06-25 (zachowane dla dokumentacji)
- **Naming podziału** [Maciej 2]: kubełek Handlu dzieli się % na **SKARBIEC / WEALTH / BADANIA** (= Pieniądz / Luksus / Nauka — ta sama mechanika, nowe nazwy). **PRACA = OSOBNY suwak** (budynki ↔ pula Pracy).
- **Podatek / default podziału** [Maciej 3]: default = **70 Skarbiec / 20 Badania / 10 Wealth** (`econ-params.json`). Brak osobnej stawki podatku.
- **Nauka** [Maciej 1a]: sterowana graczem (cel wybierany ręcznie, pula akumuluje). Handoff: `_handoff/EKONOMIA-do-MASTER_model-nauki-gracza.md`.
- **Zdrowie** [Maciej 1]: WIRE dostarczone (14 param society-params).
- **Oblężenie** [UNITS]: `turn-economy` obsługuje `city.oblegane` (brak dochodu, magazyn maleje). Kontrakt: `_handoff/EKONOMIA-do-UNITS_zapasy-oblezenie-kontrakt.md`.
- **Okolica / plony** [Maciej 2026-06-25]: zasięg = populacja (min(pop,15)); N najlepszych pól. Centrum = baza zawsze.
- **Koszt jednostek** [Maciej 2026-06-25 — 1A]: jednostki ZAWSZE za skarbiec we KAŻDEJ epoce. Handoff: `_handoff/EKONOMIA-do-MASTER_koszt-jednostek.md`.
- **Bug systemowy `mnoznik`** w economy.ts Krok 5: pole `baza.mnoznik` leci zawsze na Pracę — do decyzji Maciela (rekomendacja: mnoznik per kategoria).
