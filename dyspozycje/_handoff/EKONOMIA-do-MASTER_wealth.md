# HANDOFF: EKONOMIA -> MASTER — system WEALTH (gotowy do wpiecia w silnik)
Data: 2026-06-24. Status: logika DOWIEZIONA + przetestowana (25/25). Decyzje balansu: Maciej (czat).

## CO DOSTARCZONE (moj lane, czyste/nowe — zero kolizji)
- **gra/src/game/wealth.ts** — czysty modul (bez DOM/THREE/importow). API: `loadWealthParams(raw,diff)`,
  `wealthCap/Mnoznik/Zadowolenie/Rownowaga/Prog`, `advanceWealth(state, spoleczMoney, miastoMoney, epoka, p)`,
  `freshWealthState()`. Typy: WealthParams, WealthState{poziom,pula}, WealthTickResult{poziom,pula,mnoznik,zadowolenie,awans,spadek}.
- **gra/data/econ-params.json** — nowa grupa `"wealth"` (8 kluczy, easy/normal/hard). Backup: .bak-EKONOMIA.
- **gra/tools/wealth-test.cjs** — 25/25 PASS (mnoznik, zadowolenie, cap, rownowaga, prog, advanceWealth wzrost/spadek, loader).
- Dok: EKONOMIA/EKONOMIA-wealth-projekt.md (model+balans). Panel: EKONOMIA-panel-parametrow.xlsx arkusz "Wealth".

## MODEL (skrot)
Suwak miasta: Skarbiec(podatek) + Nauka + **Wealth/Spoleczenstwo**. Strumien Wealth (= dotychczasowy
`luksus` z economy.ts) ZNIKA do puli Wealth. Pula -> poziomy (jak zywnosc->populacja), cap=epoka*10.
Poziom Wealth **mnozy strumien PODATKU** (skarbiec): mnoznik=max(1,1+(W-1)*k). Utrzymanie poziomu = %
pieniadza miasta rosnacy z poziomem; przy niedoborze pula maleje, potem poziom spada. Per MIASTO.

## KONTRAKT WPIECIA (do petli tury — robisz Ty/master w plastrze EKONOMIA)
Stan per miasto: `WealthState {poziom, pula}` (persist miedzy turami; start `freshWealthState()` = {1,0}).
Co ture, per miasto, PO policzeniu pieniadza miasta:
1. `S` = pieniadz strumienia Wealth/Spoleczenstwo (= economy `luksus` danego miasta). `M` = calkowity pieniadz miasta tej tury.
2. `r = advanceWealth(state, S, M, epoka, params)` ; zapisz `state = {poziom:r.poziom, pula:r.pula}`.
   - `epoka` z playerState (1..10). `params = loadWealthParams(data.econParams, difficulty)`.
3. **Mnoznik na podatek (6B):** strumien Pieniadz->Skarbiec danego miasta pomnoz przez `r.mnoznik`.
   (Tylko podatek; nie nauka, nie spoleczenstwo. economy.ts read-only dla mnie -> Ty wpinasz.)
4. **Zadowolenie:** `r.zadowolenie` -> przekaz do MIASTO (szczescie). To ZASTEPUJE dotychczasowy wklad
   "luksus -> zadowolony" (`szczescie_luksus_na_mieszkanca`): teraz happiness idzie z POZIOMU Wealth
   (W=0 -> kara; co +10 poziomow -> +1 zadowolony). CROSS-LANE: prosze rozdysponuj do MIASTO.

## ZALEZNOSCI / UWAGI
- economy.ts juz zwraca `luksus` (per miasto) i `totalLuksus` — to wejscie S. Nie trzeba zmian w economy do podania S.
- Kolejnosc w turze: Wealth liczymy PO yieldzie miasta (znamy M i S), a mnoznik stosujemy do podatku tej samej tury.
- Parametry strojone w econ-params.json grupa `wealth` (+ panel). Balans zwalidowany symulacja (W10 ~tura 48 na normal; strategia 40% Wealth/60% podatek wygrywa skarbiec, crossover ~tura 48).

## DoD (po wpieciu)
- WealthState trzymany per miasto miedzy turami; mnoznik realnie mnozy podatek; zadowolenie z Wealth widoczne w MIASTO.
- `node tools/wealth-test.cjs` zielony (25/25). Build kanonu bez regresji. (Build tylko `npx vite build`, nie npm run build.)
- HUD/UI (osobno, lane UI): pasek Wealth (poziom/pula/prog/mnoznik) — do rozdysponowania.

Pytania balansowe -> Maciej (czat). Wpiecie/kanon -> Ty. Dzieki!
