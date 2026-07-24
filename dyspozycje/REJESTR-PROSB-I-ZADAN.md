# REJESTR PRÓŚB I ZADAŃ — jedyne miejsce śledzenia próśb Macieja

## ⛔ ZASADA PROCESU (Maciej 2026-07-24, obowiązkowa dla KAŻDEJ sesji)
**KAŻDA prośba Macieja, która powinna skończyć się jakąkolwiek zmianą w grze/kodzie/danych,
MUSI zostać natychmiast zapisana TUTAJ** — nawet jeśli padła mimochodem w czacie i nie jest
od razu realizowana. Powód: prośby z samego czatu giną (potwierdzony przypadek: „osobny poziom
trudności per państwo/miasto" — poproszona dawno, nigdzie nie zapisana, nie wdrożona, nikt tego
nie pilnował). Narracja w czacie NIE jest śledzeniem. Ten plik jest jedynym rejestrem statusu.

**Format wiersza:** ID · data zgłoszenia · prośba (zwięźle) · STATUS (`NOWE` / `W TOKU` / `WDROŻONE` / `ZDEPLOYOWANE` / `ODRZUCONE` / `CZEKA-NA-DECYZJĘ`) · commit/deploy · uwagi.
Przy zamknięciu tematu: aktualizuj STATUS + wpisz commit/md5. Szczegóły decyzji ekonomicznych → `DECYZJE-SUROWCE-EKONOMIA-2026-07-23.md`.

---

## OTWARTE / DO DECYZJI

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-TRUDNOSC-1 | „jakiś czas temu" (odtworzone 2026-07-24) | **Osobny suwak „Trudność miast-państw" w kreatorze gry**, niezależny od głównej trudności. Steruje 3 mechanizmami miast-państw: (1) startowe zaufanie do gracza, (2) skala sojuszu sióstr, (3) posiłki obronne (RESUP). | **ZDEPLOYOWANE `ea75f5ba`** | Suwak w Zaawansowanych opcjach; domyślnie=główna trudność. Recon 2026-07-24: te 3 elementy są pochodną globalnej `_menuDifficulty` (trust easy+10/normal+5/hard0; sojusz sióstr ×0,6/0,3/0,15; RESUP low/normal/strong) **ORAZ przeciek: `bonusWalka` +5% siły walki AI na hard (`trudnosc_poziom3_bonus_walka`) — miasta-państwa też go dostają z globalnej trudności.** Nowa opcja setupu odpina WSZYSTKO (3 mechanizmy + siłę walki miast-państw) od globalnej. Domyślnie = główna trudność (zero regresji). Główna `_menuDifficulty` steruje resztą (ekonomia/AI/mapa). Musi respektować parytet AI. |
| R-UNIT-KOSZT-ŁUCZ | 2026-07-24 | Łucznicy brązowi = 1 Brąz czy 0? | **WDROŻONE (redeploy 4.1)** | Decyzja: **0** (jednolicie — wszystkie dystansowe darmowe surowcowo, jak Procarz). Łucznik akadyjski/asyryjski 1→0. Reguła kosztów: dystansowe = 0. |
| R-STAWKI-STROJENIE | 2026-07-24 | Docelowe stawki/koszty po obejrzeniu licznika w playteście | CZEKA-NA-PLAYTEST | Placeholdery: stawki wydobycia, bonusy 10%, upkeep −1 Praca, progi CUDA/Ludy Morza, cap magazynu 100/+100, proporcje capa trudności 120/100/80 vs płaskie 100. |
| R-DYST-DREWNO | 2026-07-24 | Rozważyć wymóg DREWNA dla jednostek dystansowych (łucznicy) | CZEKA-NA-PLAYTEST (pomysł na przyszłość) | Dziś dystansowe = 0 surowca (Kamień: groty krzemienne/kościane; Brąz/Żelazo też 0). Ewentualnie wymusić drewno TYLKO jeśli playtest pokaże nadwyżki drewna. Blokada dziś: trudno na starcie postawić ulepszenia (brak produkcji drewna) + timing technologii (tech łuczników vs tech drewna mogą się wykluczać). NIE ruszać bez sygnału Macieja. |
| R-AI-KUP-JEDN | 2026-07-24 | AI NIE ma ścieżki „kup jednostkę za złoto" (`purchaseRecruitmentUnit` main.ts:2054 zablokowane do `ownerId===0`). Maciej 2026-07-24: „działać" = **naprawić parytet**. | **WDROŻONE w kodzie `b194539` (czeka na deploy)** | `purchaseRecruitmentUnit`/`cancelRecruitmentPurchase` uogólnione na dowolnego ownera (ownerTreasury, koszt surowcowy z puli ownera, UI tylko gracz). Czysty predykat `shouldAIRushBuyUnit` (ai.ts). AI kupuje za złoto gdy: wojna + Manpower + złoto ≥ rezerwa(100)+koszt + <1 zakup w turze. Rezerwa/limit = PLACEHOLDER strojenia. Test ai-unit-rush 8/8, ai-test baseline 233/7 (0 regresji). **Do strojenia w playteście:** czy AI powinno rush-ować agresywniej/inny próg. |
| R-JEDN-DOSTEP-BUG | 2026-07-24 | Pre-istniejący bug: bramka dostępu brąz/żelazo dla jednostek jest MARTWA — `production.ts:751` porównuje `surowiec === 'braz'` po samym `.toLowerCase()`, a dane to `'Brąz'` (z ą) → `'brąz' !== 'braz'`, więc jednostki brązowe/żelazne budują się BEZ wymaganego dostępu do surowca. | CZEKA-NA-DECYZJĘ | Wykryte przy Zadaniu 1 (recon). Fix = dodać `stripDiacritics` w porównaniu (production.ts:751-759 oraz 846-849 availableReplacementsFor). Osobny temat — nie ruszany przy okazji. Do decyzji: naprawić teraz czy z osobną paczką? |
| R-MP-DYPL-PROAKT | 2026-07-25 | Czy proaktywność miast-państw w dyplomacji (`agresjaMnoznik`/`dyplomacjaAktywnosc` w decideAIDiplomacy — propozycje wojna/pokój) też odpiąć od globalnej trudności pod suwak miast-państw? | CZEKA-NA-DECYZJĘ | Dziś globalne (wcześniejsza decyzja „ogólny parametr dla wszystkich AI", D-MP-DYPL Q1 cz.2). 3 mechanizmy (zaufanie/sojusze/posiłki) + aiDiffLevel JUŻ odpięte; to jest 4. potencjalny element. |

## W TOKU

| ID | Data | Prośba | Status | Uwagi |
|---|---|---|---|---|
| R-PARYTET-AUDYT | 2026-07-24 | Audyt: czy wszystkie reguły gracza dotyczą też AI (spisać luki) | **RAPORT GOTOWY** → `dyspozycje/AUDYT-PARYTET-AI-2026-07-24.md` | 7 obszarów ✅ pełny parytet (magazyn=pula państwa, koszty budynków, upkeep Pracy, handel surowcami, cuda, bonusy Stolarnia/Warsztat, trudność miast-państw). Luki: ❌ **R-AI-KUP-JEDN** (AI nie kupuje jednostek za złoto); ❌ jednostki nie konsumują surowca (=R-PROD-POOL-TEST, decyzja A); ⚠️ wyrąb lasu AI natychmiastowy vs gracz wieloturowy (ekonomicznie zbilansowane). **Uwaga wdrożeniowa dla decyzji A:** dotknąć symetrycznie `cityPanel.ts addItem` + oba miejsca AI w `main.ts` (~L4218, ~L14829) tym samym wzorcem co budynki. |
| R-PANEL-SYNC | 2026-07-24 | Synchronizacja paneli Excel z JSON (JSON→Excel) | **CZĘŚCIOWO — panele zregenerowane, ale GENERATOR NIEKOMPLETNY (do decyzji)** | Zregenerowane: `panele-sterowania/Panel-A.xlsx` (terrain-improvements), `Panel-B.xlsx` (econ-params/buildings/resources), `Panel-C.xlsx` (73 jednostki). **LUKA GENERATORA:** `gen-panel-c.py` (`COST_FIELDS`) NIE eksportuje `units.json` → `Surowiec`/`Surowiec (ilość)`; `gen-panel-b.py` (`flatten_building()`) NIE mapuje `buildings.json` → `koszt_surowce` (ani `wymagania`/`uwagi`). Czyli mimo regeneracji panele NIE pokazują tegorocznych kosztów surowcowych jednostek/budynków. Do decyzji Macieja: rozszerzyć oba generatory o te klucze (zmiana kodu .py). Panel D/E bez zmian (poza zakresem). |
| R-PROD-POOL-TEST | 2026-07-25 | Przetestować, czy produkcja BUDYNKÓW poprawnie zaciąga surowce z puli cywilizacji ORAZ czy produkcja JEDNOSTEK robi to prawidłowo. | **WDROŻONE w kodzie `3161c79` (czeka na deploy)** — budynki ✅ były OK, jednostki teraz konsumują | Recon kodu: **Budynki ✅** — `addItem` (gracz, cityPanel.ts:4304-4308) i AI (main.ts:14358-14367, 14831-14833) pobierają z `ownerResourceStockAll` przez `deductBuildingStockCostAcrossCities` (pula państwa, ownerId-agnostic). **Jednostki ❌ LUKA** — `addItem` odejmuje pulę TYLKO dla `budynek`; jednostki nie zaciągają NIC. Pole `Surowiec (ilość)` (1/2/3, R-KOSZT-JEDN) jest tylko WYŚWIETLane (cityPanel.ts:4882); `Surowiec` = bramka DOSTĘPU (braz/zelazo, production.ts:751-759). **Decyzja Macieja C-JEDN-SUROWIEC-Q1 = A (pełna konsumpcja z puli państwa, blokada gdy brak, parytet AI).** Wdrożenie do zrobienia (kod, bez deployu) — Maciej wyłączył się, potwierdzenie „wdrażaj?" nie padło; realizacja jutro lub na sygnał. |
| R-BILANS-100T | 2026-07-25 | Ponowna analiza bilansu surowców na 100 tur z UWZGLĘDNIENIEM wszystkich zmian tej sesji; założenie: każde miasto ma WSZYSTKIE budynki epoki Kamień+Brąz. Nadmiar czy niedobór? | **ANALIZA GOTOWA** → `dyspozycje/BILANS-SUROWCE-100T-2026-07-25.md` | Wynik: **NADMIAR** (duży, rośnie z liczbą miast). Cap civ-wide płaski 200 → imperium 4-miejskie marnuje setki–tysiące/100t. Kamień bez odbiorcy. Drewno/glina jedyne napięte i tylko w chudym mieście. Implikacje strojenia → R-STAWKI-STROJENIE. |
| R-MAGAZYN-PANSTWO | 2026-07-24 | Magazyn = pula PAŃSTWA: 100 + 100/Magazyn, nadmiar przepada, surowce wspólne dla imperium | **ZDEPLOYOWANE `ea75f5ba`** | Cap płaski 100/100/100. Parytet AI 44/44. |
| R-HANDEL-SUROWCE | 2026-07-24 | Handel surowcami w dyplomacji: za pieniądz/Pracę; jednorazowy i przez X tur; AI też | **ZDEPLOYOWANE `ea75f5ba`** | Parytet AI (AI↔AI) 42/42. |

## ZAMKNIĘTE (ta sesja, 2026-07-23/24)

| ID | Prośba | Status | Commit/Deploy |
|---|---|---|---|
| R-BYDLO | Bydło/owce/lama = NIE surowce (tylko koń) | ZDEPLOYOWANE | `d6c4f33` / `aa3c9b06` |
| R-LICZNIK | Licznik surowców w panelu imperium | ZDEPLOYOWANE | `d6c4f33` / `cd42837f` |
| R-CERAMIKA | Ceramika = tylko dostęp (Garncarnia); koszt 3 budynków→cegła | ZDEPLOYOWANE | `f136c09` / `cd42837f` |
| R-PROD-BEZ-PRAC | Produkcja per-ulepszenie bez wymogu pracowników | ZDEPLOYOWANE | `f136c09` / `cd42837f` |
| R-PALIWO | Usunąć Paliwo + Mielerz (konwertery→drewno) | ZDEPLOYOWANE | `2d9f173` / `cd42837f` |
| R-BONUSY-BUD | Stolarnia/Warsztat +10% civ, Garncarnia +10% lokalnie żywność | ZDEPLOYOWANE | `2d9f173` / `cd42837f` |
| R-KOSZT-BUD | Koszty surowcowe 28 budynków (Kamień/Brąz/Żelazo) | ZDEPLOYOWANE | `2d9f173` / `cd42837f` |
| R-CEGLA-A | Cegła-A: Cegielnia 3, Glinianka 5 | ZDEPLOYOWANE | `2d9f173`,`bcd818b` / `cd42837f` |
| R-UPKEEP-PRACA | −1 Praca/turę za ulepszenie surowcowe (wariant B) | ZDEPLOYOWANE | `bcd818b` / `cd42837f` |
| R-DEADLOCK-AI | Fix kolejności budowy AI (konwertery przed konsumentami) | ZDEPLOYOWANE | `bcd818b` / `cd42837f` |
| R-KOSZT-JEDN | Koszty jednostek (Kamień 0/Brąz/Żelazo, 1/2/3; Procarz 0) | WDROŻONE (redeploy 4.1) | `aff3435`,`2b0cd14` |
| R-SUPER-ARCHE | Super-jednostki: bezpłatne pieniężnie + max1/stolica + 3 surowca | WDROŻONE (redeploy 4.1) | `c2d77fe` |
| R-CUDA-AI | AI buduje cuda | ZDEPLOYOWANE | `d6c4f33` / `aa3c9b06` |
| R-CUDA-BONUS | Wonder-bonusy realnie w ekonomii (gracz+AI) | ZDEPLOYOWANE | `b5e7110` / `cd42837f` |
| R-LUDY-MORZA | #15 Ludy Morza (embarkacja+rajdy) | ZDEPLOYOWANE | `6859d9e` / `aa3c9b06` |
| R-PARYTET-AI | ZASADA: zero uproszczeń dla AI, kod ownerId-agnostic | ZAPISANE (obowiązuje) | `318ed6c` |
| R-X2-OBSADA | Reguła ×2 przy obsadzie ludnością | ODRZUCONE | — (dublowałoby upkeep) |
