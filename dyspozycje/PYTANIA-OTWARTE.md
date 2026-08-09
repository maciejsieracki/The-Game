# PYTANIA OTWARTE — czekają na decyzję Macieja
Aktualizacja: 2026-08-06 (ECHO paczka `ABC-PACZKA-2026-08-06-KOLEJKA` + `R-OBRONA-MIASTA-MP-Q1`). Numeracja ciągła z `REJESTR-PROSB-I-ZADAN.md`.
Zasada: każde pytanie w pełnej formie ABC (opis + min. 2 za + min. 2 przeciw + rekomendacja), zawsze z numerem.

## ⛔ Obieg (Maciej 2026-08-03)
Nowy case → **ID w REJESTR-PROSB** + wpis tu (jeśli ABC) → agent **proponuje, nie koduje** → Maciej: **`ID + A|B|C`** → commit → **`deploy`** osobno.
Kanon: [`PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`](PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md).

---

## ABC-PACZKA-2026-08-06-DOPREC — doprecyzowanie Autobot · STATUS: **NIEAKTUALNE — zastąpione, zamknięte bez odpowiedzi (2026-08-09)**

**Kanon:** [`docs/decyzje/ABC-PACZKA-2026-08-06-DOPREC.md`](../docs/decyzje/ABC-PACZKA-2026-08-06-DOPREC.md)

Audyt 2026-08-09 (na polecenie „wypchnąć wszystkie aktywne pytania i rozwiązać"): wszystkie 6
pytań zostało w międzyczasie rozstrzygnięte lub zdezaktualizowane INNĄ drogą, nie przez wprost
odpowiedź na tę paczkę — status po prostu nigdy nie został zaktualizowany. Sprawdzone w kodzie/
dokumentach, nie z pamięci:
1. **R-DZIALAJ-SCOPE-Q1** (zakres hasła „działaj") — model operacyjny „jedno `działaj` = N
   tematów" zastąpiony przez `C-027` (każde zgłoszenie dispatchowane od razu, osobno, bez
   czekania na zbiorcze hasło). Pytanie nieaktualne strukturalnie.
2. **R-DEPLOY-AUTOBOT-Q1** (rytm deployu) — rozstrzygnięte inną, twardszą regułą: deploy
   WYŁĄCZNIE na hasło `deploy` od właściciela (`CLAUDE.md` §0/§5), nie automatycznie po
   temacie/zbiorczo.
3. **MAP-UX-MARKER-Q1** (marker stolicy) — **wdrożone jako C** (obwódka + korona), potwierdzone
   w kodzie: `gra/src/render/cityMapStatChip.ts` (komentarze „MAP-UX-MARKER-Q1 = C", linie 47/80/650/767).
4. **R-KAMIEN-FUTURE-Q1** (przyszłe kopalnie) — wdrożone, `gra/src/game/relief-preserving-improvements.ts`
   (wydzielone z `main.ts`, gdzie był `PRESERVES_HILL_RELIEF_KEYS`).
5. **R-WIARYGODNOSC-S9-LICZBY-Q1** (liczby §9) — rozstrzygnięte jako A wcześniej
   (`R-WIARYGODNOSC-S9-Q1=A`), tabela liczb gotowa i wdrożona (commit `2e67219`,
   `docs/decyzje/R-WIARYGODNOSC-S9-TABELA-LICZB.md`).
6. **R-DESIGN-V2-KANAL-Q1** (dostarczenie briefu Design v2) — rozstrzygnięte jako C, potwierdzone
   w `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md` (wiersz 53: `R-DESIGN-PANEL-MIASTA-V2-Q1` = C) i w
   `dyspozycje/DO-DESIGN-PANEL-MIASTA-MAPA-2026-07-25.md`.

Nic z tej paczki nie wymaga dziś odpowiedzi — zamykam bez pytania, żeby nie przedstawiać
nieaktualnych pytań jako żywych.

---

## ABC-PACZKA-2026-08-06-KOLEJKA + R-OBRONA-MIASTA-MP-Q1 — STATUS: **ZAMKNIĘTE ECHO** (2026-08-06)

**Kanon:** [`docs/decyzje/ABC-PACZKA-2026-08-06-KOLEJKA.md`](../docs/decyzje/ABC-PACZKA-2026-08-06-KOLEJKA.md) · reguła [`R-ABC-PELNA-LISTA.md`](../docs/decyzje/R-ABC-PELNA-LISTA.md).

| # | ID | Litera | Status |
|---|-----|--------|--------|
| 1 | **AI-BALANS-STEP6-Q1** | **A** | 🟡 ZAPISANA — czeka `działaj` |
| 2 | **R-KAMIEN-RELIEF-FOLLOWUP-Q1** | **A** + reguła | 🟡 ZAPISANA — czeka `działaj` |
| 3 | **MAP-UX-CLUSTER-LABEL-Q1** | **B+C** | 🟡 ZAPISANA — czeka `działaj` |
| 4 | **R-WIARYGODNOSC-S9-Q1** | **A** | 🟡 ZAPISANA — czeka `działaj` |
| 5 | **R-DESIGN-PANEL-MIASTA-V2-Q1** | **C** | 🟡 ZAPISANA — czeka `działaj` |
| 6 | **R-OBRONA-MIASTA-MP-Q1** | **A** | 🟡 ZAPISANA — czeka `działaj` |

Szczegóły ECHO: pliki w `docs/decyzje/` (patrz tabela w paczce ABC).

---

## R-SCOUT-ZWIEDZAJ-PODSWIETLENIE — Zwiedzaj bez złotej ramki · STATUS: **ZDEPLOYOWANE `ee0e7e04`** FALA 223 (2026-08-04)

**ECHO:** `R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q1 A` — zostań na zwiadowcy + złota ramka od razu.  
Szczegóły: [`docs/decyzje/R-SCOUT-ZWIEDZAJ-PODSWIETLENIE.md`](../docs/decyzje/R-SCOUT-ZWIEDZAJ-PODSWIETLENIE.md). W ROBOCZA FALA 223 `ee0e7e04`.

---

---

## R-PILL-TARCZA-BEZ-MURU — szara tarcza bez muru na heksie · STATUS: **ZDEPLOYOWANE `ee0e7e04`** FALA 223 (2026-08-04)

**ECHO:** `R-PILL-TARCZA-BEZ-MURU-Q1 A` — tier wyłącznie z `wallKind` (= model 3D).  
Szczegóły: [`docs/decyzje/R-PILL-TARCZA-BEZ-MURU.md`](../docs/decyzje/R-PILL-TARCZA-BEZ-MURU.md). Bramki: tsc 0 · city-map-badge 19/19. W ROBOCZA FALA 223 `ee0e7e04`.

---

---

## R-AUTO-RACJE-RAISE — Spichlerz ≥ 0 + auto + przełącznik · STATUS: **ZDEPLOYOWANE** · fokus playtest **ODŁOŻONY** (R-AUTO-RACJE-RAISE-PT=B, 2026-08-06)

Kod w ROBOCZA od FALA 225→227. Maciej: bez ABC o playtestach (`R-ABC-BEZ-PLAYTEST`). Werdykt OK/BUG — gdy sam napisze.

**ECHO:** Q1=B · Q2=A · Q3=A · Q4=A · Q5=A. Testy ai-major-economy **32/32**.  
**W ROBOCZA:** FALA 226 `ebe4548f` (zawiera FALA 225).  
Szczegóły: [`docs/decyzje/R-AUTO-RACJE-RAISE.md`](../docs/decyzje/R-AUTO-RACJE-RAISE.md) · handoff: [`_handoff/HANDOFF-SESJA-2026-08-05_FALA-225-226.md`](_handoff/HANDOFF-SESJA-2026-08-05_FALA-225-226.md).  
**PT=B:** bez nękania o playtest; Maciej napisze `OK` / `BUG: …` gdy sam ogrywa.

---

## R-BUDOWA-ZROWNOWAZONE-TRYB — zrównoważony ≠ priorytet typów · STATUS: **ZAMKNIĘTE** Q1=A · ZDEPLOYOWANE FALA 222→223 · playtest OK (2026-08-04)

**ECHO Maciej:** `R-BUDOWA-ZROWNOWAZONE-TRYB-Q1 A` — osobny tryb auto „Zrównoważony” (5 chipów typów z numerami + osobny przełącznik).

Szczegóły: [`docs/decyzje/R-BUDOWA-ZROWNOWAZONE-TRYB.md`](../docs/decyzje/R-BUDOWA-ZROWNOWAZONE-TRYB.md). Playtest Maciej **OK** na `ee0e7e04`.

---

## R-NADMIAR-POOLS — FALA2 ×2 koszty · STATUS: **ZDEPLOYOWANE FALA 215** `2a5a66d1` (2026-08-04)

Decyzja Macieja: dodatkowe ×2 na wybrane koszty (stacking z FALA1). Szczegóły: [`docs/decyzje/R-NADMIAR-POOLS.md`](docs/decyzje/R-NADMIAR-POOLS.md). Wejście: `gra-robocza/START.html` — git pull + Ctrl+F5 + Nowa gra.

---

## FALA 220 — ABC zamknięte (2026-08-04) · ROBOCZA `8a3c6d6d` · commit `b47a2e8`

| ID | Decyzja | Status | Docs |
|----|---------|--------|------|
| **MP-ARMY-Q1** | **A** — cap = łącznie żywe jednostki bojowe (garnizon wliczony); odbudowa do limitu | **WDROŻONE FALA 220** | [`MP-ARMY-Q1.md`](docs/decyzje/MP-ARMY-Q1.md) |
| **MP-GARRISON-Q1** | **A** — Hard: istniejące garnizony zostają, zakaz nowej produkcji wojskowej | **WDROŻONE FALA 220** | [`MP-GARRISON-Q1.md`](docs/decyzje/MP-GARRISON-Q1.md) |
| **MP-DIPLO-Q1** | **A** — ułatwienie tylko AI major→MP; same-civ Zaufanie max ~100; priorytet absorpcji klastra | **WDROŻONE FALA 220** | [`MP-DIPLO-Q1.md`](docs/decyzje/MP-DIPLO-Q1.md) |
| **AI-FOUND-Q1** | **A** — founding AI major pop ≥ 2 (jak gracz) | **WDROŻONE FALA 220** | [`AI-FOUND-Q1.md`](docs/decyzje/AI-FOUND-Q1.md) |
| **AI-LOCAL-Q1** | **A** — faza lokalna ~tura 20 LUB 1 zwiadowca; wioski nie blokują | **WDROŻONE FALA 220** | [`AI-LOCAL-Q1.md`](docs/decyzje/AI-LOCAL-Q1.md) |
| **AI-MANAGE-Q1** | **A** — auto-zarządca dla major AI (nie MP) | **WDROŻONE FALA 220** | [`AI-MANAGE-Q1.md`](docs/decyzje/AI-MANAGE-Q1.md) |

**Ustalenia produktowe (nie ABC):** wzmacniać tylko **AI major** (nie MP); major AI = te same reguły gospodarcie co gracz. Trudność: Easy ≈ dziś MP wojsko/diplo · Normal max1 wojsko + mid absorb · Hard 0 wojska MP + prawie zawsze accept AI→MP.

**Batch FALA 216–220 (wdrożone):** utrzymanie budynków +1 surowiec/turę + UI · dyplo bilateral/NAP gate · edycja kontrpropozycji · tip weteranów · major AI early economy (wzrost/Spichlerz, 60/40, ulepszenia).

---

## P-AI-017 — pasek HP w bitwie pokazywał 100% mimo uszkodzonej jednostki z mapy · STATUS: **ZDEPLOYOWANE** (PR #22 MERGED; w łańcuchu ROBOCZA FALA 202+ / obecna 224)

**Temat:** Jednostka z minimalnym HP/energią na mapie wchodziła do bitwy z pełnym zielonym paskiem HP, ale szybko ginęła (logika walki miała poprawne `u.hp`, kłamała tylko wizualizacja).

**Przyczyna:** Brak `_updateHpBar(ru)` przy spawnie w `battleScene.ts` / `manualBattle.ts` (morale i ammo były syncowane). `preBattleUnitFromRuntime` w `main.ts` ignorował `u.hp` i zawsze ustawiał max.

**Fix:** `_updateHpBar` przy każdym spawnie + `preBattleUnitFromRuntime` jak `runtimeToBattleUnit` + test `battle-hp-display-test.cjs`.

---

## PYTANIE 18 — profil Pretorium po sprzątnięciu · STATUS: **WDROŻONE W DANYCH** (2026-07-25 decyzja · `buildings.json` pretorium)

**Sytuacja.** Po wdrożeniu decyzji 16A (`obrona` → 0) i decyzji 6 (`mnoznik` → 0, jak przy Pałacu) Pretorium zostaje
z bonusami **praca 2 / pieniądz 3 / zadowolenie 1** za cenę 75 pracy + 9 cegły + 3 utrzymania na turę.
Historyczne Pretorium to siedziba namiestnika prowincji — „pałac zamiejscowy", centrum administracji i poboru podatków
w mieście, które nie jest stolicą. Porównanie z Pałacem III (ta sama epoka Żelaza, 90 pracy): kultura 11, zadowolenie 5.

**Cel pytania.** Czy zostawiamy Pretorium takim, jakim będzie po sprzątnięciu, czy dajemy mu profil odpowiadający roli i cenie.

**Dlaczego teraz.** Subagent i tak edytuje ten wpis (obrona + mnożnik + opis) — lepiej jednym przejściem niż wracać po raz trzeci.

**A. Wzmocnić jako „pałac prowincjonalny"** — praca 2, pieniądz 3, **zadowolenie 3** (zamiast 1), bez kultury, bez obrony,
bez mnożnika; opis przepisany na „administracja prowincji: pobór podatków i utrzymanie porządku".
- Za: cena 75 + cegła 9 zaczyna się bronić.
- Za: zadowolenie to realny problem rozrastających się miast — budynek dostaje własną niszę.
- Przeciw: podbicie parametru „na oko", bez rozegranego balansu.
- Przeciw: zadowolenie 3 w każdym mieście może być mocniejsze niż Pałac III (5, tylko w stolicy).

**B. Przypiąć Pretorium do miast niestołecznych** — bonusy jak w A, ale budynek niedostępny w stolicy.
- Za: najbliżej historii — namiestnik nie rezyduje w stolicy.
- Za: eliminuje stackowanie Pałac + Pretorium w jednym mieście.
- Przeciw: nowa mechanika (warunek „nie stolica") — kod, UI, komunikat, parytet AI.
- Przeciw: gracz może odebrać to jako arbitralne, bo w grze nie ma jeszcze widocznego pojęcia „prowincji".

**C. Nie ruszać wartości** — tylko usunąć martwe pola i poprawić opis (praca 2 / pieniądz 3 / zadowolenie 1).
- Za: najmniejsza zmiana, zero ryzyka dla balansu.
- Za: zgodne z zasadą „nie tworzymy problemów, których nie ma".
- Przeciw: budynek zostaje słaby — 75 pracy za +2/+3/+1 to marna oferta w epoce Żelaza.
- Przeciw: różnica wobec Pałacu III jest rażąca.

**REKOMENDACJA: A** — jedno przejście, bez nowej mechaniki, budynek przestaje być atrapą.

**ODPOWIEDŹ MACIEJA (2026-07-25):** Pretorium dostaje **Kultura: 5 pkt/turę** (nowy bonus — budynek to „pałac
zamiejscowy", ma dawać Kulturę jak Pałac); pola `obrona` i `mnoznik` wyzerowane (spójnie z decyzją 16A i decyzją
6 o Pretorium-jak-Pałac). To inne rozwiązanie niż warianty A/B/C wyżej (żaden nie proponował Kultury) —
pełny zapis i uwaga o niedoprecyzowanych `Praca`/`Pieniądz`/`Zadowolenie` w
`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §8. **Status wdrożenia:** ✅ w `gra/data/buildings.json` — Kultura 5, obrona/mnoznik 0, praca 2, pieniądz 3, zadowolenie 0 (łańcuch regionalny). **BRAK ABC** — nie pytać o Praca/Pieniądz/Zadowolenie.

---

## PYTANIE 19 — utrzymanie budynków: zróżnicowane czy płaskie? · STATUS: **WDROŻONE W KODZIE** (2026-07-25 decyzja A · `economy-upkeep.ts`)

**Sytuacja.** Każdy budynek ma w danych własne `utrzymanie` (0–5 na turę). **Silnik tego nie czyta** — `econ-params.json`
ustawia płaską stawkę `utrzymanie_budynek` (łatwy 1 / normalny 1 / trudny 2), która **zawsze** wygrywa z wartością z danych
(`economy-upkeep.ts:511`, `flatOverride` nigdy nie jest czyszczone). Pałac III i najtańszy budynek kosztują dziś tyle samo.
UI pokazuje graczowi zróżnicowane liczby, których silnik nie stosuje. W kodzie opisane jako świadomy placeholder v0.1.

**Cel pytania.** Czy odblokowujemy zróżnicowane utrzymanie, czy przyznajemy wprost, że jest płaskie.

**Dlaczego teraz.** To ostatnie duże pole z rodziny „UI obiecuje, silnik ignoruje" — zostawione, będzie nas mylić przy każdym
kolejnym przeglądzie, dokładnie tak jak mnożnik i `przyrost`.

**A. Włączyć zróżnicowane utrzymanie z danych** (płaska stawka zostaje tylko jako domyślna dla budynków bez wpisu).
- Za: znika kolejny martwy parametr, dane zaczynają znaczyć to, co pokazują.
- Za: realny koszt drogich budynków — decyzja „czy stać mnie na Pałac III" wreszcie coś znaczy.
- Przeciw: zmienia ekonomię wszystkich istniejących zapisów — trzeba przetestować, czy miasta nie wpadną na minus.
- Przeciw: 37 wartości `utrzymanie` nigdy nie było balansowanych (były martwe).

**B. Zostawić płaskie utrzymanie i wyczyścić dane** — usunąć zróżnicowane wartości z JSON i z UI.
- Za: zero ryzyka dla ekonomii, natychmiast usuwa mylące liczby.
- Za: spójne z deklaracją v0.1.
- Przeciw: tracimy przygotowaną (choć niebalansowaną) siatkę wartości.
- Przeciw: utrzymanie przestaje być jakąkolwiek decyzją gracza.

**C. Zostawić jak jest**, dopisać notatkę w dokumentacji.
- Za: zero pracy.
- Za: nic się nie psuje.
- Przeciw: to dokładnie wzorzec, przez który straciliśmy czas na mnożniku i `przyrost`.
- Przeciw: gracz podejmuje decyzje budowlane na podstawie fałszywych liczb.

**REKOMENDACJA: A** — ale jako osobne zadanie z testem ekonomii, nie doklejone do bieżącej paczki.

**ODPOWIEDŹ MACIEJA (2026-07-25):** **A** — utrzymanie budynków ma być zróżnicowane per budynek (z danych),
nie płaska stawka. Zapisane jako osobne zadanie ekonomiczne (z testem) w
`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §8. **Status wdrożenia:** ✅ `buildingUpkeep()` czyta `utrzymanie` z `buildings.json`; `utrzymanie_budynek` tylko fallback gdy brak wpisu. Test: `upkeep-test.cjs`. **BRAK ABC.**

---

## PYTANIE 20 — Targowisko: bonus, którego nigdy nie było · **STATUS: ✅ ZAMKNIĘTE (A, wdrożone 2026-07-26; potwierdzenie Maciej 2026-07-27)**

**Decyzja:** A — `baza.pieniadz` 5, `przyrost.pieniadz` 3, mnożnik=0. Osobno: premia Targowiska **+50% Handlu brutto** (`budynek_targowisko_bonus_handlu`). Mennica = osobny efekt **×1,5 Handlu netto** (nie mylić). `docs/decyzje/PYTANIE-20.md`.

**Sytuacja.** Targowisko (Rynek) ma `baza.mnoznik: 0`, a cały zamierzony efekt handlowy siedzi w `przyrost.mnoznik: 3` —
czyli w polu, którego silnik nie czytał. Efekt wynosił **zero na każdym poziomie, od zawsze**. Gracz widział chip
„+3/poz. mnożnik" i nie dostawał nic. Realnie budynek daje tylko **pieniądz 3 (+2/poziom)** za 25 pracy + 6 drewna.
Mnożniki z budynków gospodarczych i tak usuwamy decyzją właściciela.

**Cel pytania.** Czy zamierzony efekt handlowy przenosimy do działającego parametru, czy Targowisko zostaje przy bazowym pieniądzu.

**Dlaczego teraz.** Przy usuwaniu mnożnika subagent i tak dotknie tego wpisu — bez decyzji cicho skasujemy funkcję, która miała istnieć.

**A. Przenieść zamierzony efekt do bazowego pieniądza** — `baza.pieniadz` 3 → 5, `przyrost.pieniadz` 2 → 3, mnożnik skasować.
- Za: gracz dostaje realnie to, co budynek obiecywał, w strumieniu, który działa.
- Za: zero nowej mechaniki, tylko liczby.
- Przeciw: to nie to samo co procent od handlu — nie skaluje się z wielkością miasta.
- Przeciw: wartości dobrane „na oko".

**B. Zostawić Targowisko z samym bazowym pieniądzem 3 (+2)** — mnożnik znika bez rekompensaty.
- Za: najczystsze — usuwamy martwy parametr i nic nie zmyślamy.
- Za: budynek jest tani (25 pracy, epoka Kamienia), więc nie jest przepłacony.
- Przeciw: budynek handlowy bez bonusu handlowego to słaba tożsamość.
- Przeciw: ma 10 nazw poziomów („Giełda", „Bank centralny") — sugeruje ambitniejszą rolę.

**C. Dać Targowisku realny procent do pieniądza** — nowy, działający strumień: +10% do dochodu miasta.
- Za: realizuje pierwotny zamysł dosłownie.
- Za: procent skaluje się z rozwojem miasta — budynek zachowuje sens w późnych epokach.
- Przeciw: odtwarzamy mechanikę mnożnika, którą właśnie kasujemy jako źródło zamieszania.
- Przeciw: procenty od dochodu łatwo się kumulują i wymykają spod kontroli.

**REKOMENDACJA: A** — efekt zostaje, mechaniki nie przybywa.

---

## PYTANIE 24 — ulepszenia jednostek: co się dzieje przy awansie budynku · STATUS: **ODPOWIEDZIANE — bonusy się sumują**

**Sytuacja.** Dwie ścieżki ulepszeń są wdrożone i działają. Ale awans budynku w tej grze to **podmiana `id`**, nie dodanie
drugiego budynku: Wielka Kuźnia **zastępuje** Kuźnię żelaza, Akademia wojskowa **zastępuje** Koszary. Silnik liczy bonus
tylko z budynków realnie obecnych na liście miasta. Skutek liczbowy:

| Ścieżka | Zakładałeś | Realnie osiągalne |
|---|---|---|
| A — Pancerz (Kuźnia 15 + Kuźnia żelaza 15 + Wielka Kuźnia 15) | +45% | **+30%** (Kuźnia + Wielka Kuźnia; Kuźnia żelaza już nie istnieje) |
| B — Parametry (Koszary 20 + Akademia wojskowa 20 + Warsztat oblężniczy 10) | +50% | **+30%** (Akademia + Warsztat; Koszary już nie istnieją) |

Wdrożyłem wariant zachowawczy (liczy się tylko to, co miasto ma), bo zgadywanie w drugą stronę byłoby zmianą Twojej decyzji.

**Cel pytania.** Ustalić, czy budynek-następca ma przejmować bonus poprzednika, czy sumy mają zostać niższe niż zakładałeś.

**Dlaczego teraz.** Mechanika jest w kodzie i działa; to jedna liczba do zmiany, ale zmienia siłę każdej jednostki w grze.

**A. Następca kumuluje bonus poprzednika** — Wielka Kuźnia daje 30% (15 własne + 15 za zastąpioną Kuźnię żelaza),
Akademia wojskowa daje 40% (20 + 20 za Koszary). Sumy wracają do Twoich +45% i +50%.
- Za: wychodzi dokładnie ta liczba, którą podałeś — +45% pancerza i +50% parametrów.
- Za: spójne z tym, jak awanse działają po stronie ekonomii (budynek wyższego tieru ma wyższe wartości bazowe, nie traci dorobku poprzednika).
- Przeciw: gracz płaci za Akademię wojskową raz, a dostaje bonus za dwa budynki — trudniej to wytłumaczyć w interfejsie.
- Przeciw: zachęca do jak najszybszego awansu, bo poprzednik nigdy nie jest „stracony".

**B. Zostawić wariant zachowawczy** — maksimum +30% na każdej ścieżce.
- Za: prosta, uczciwa zasada: bonus daje budynek, który stoi w mieście.
- Za: awans jest realną decyzją, a nie automatycznym zyskiem.
- Przeciw: sumy są niższe niż zakładałeś — jednostki będą wyraźnie słabsze niż planowałeś.
- Przeciw: awans Koszar na Akademię wojskową daje netto tylko +0% (20 → 20), więc gracz nie widzi zysku z ulepszenia.

**C. Podnieść wartości budynków-następców** — Wielka Kuźnia 30% zamiast 15%, Akademia wojskowa 40% zamiast 20%,
wpisane wprost do danych.
- Za: efekt jak w A, ale widoczny wprost w danych i w interfejsie — bez ukrytej logiki „za zastąpiony budynek".
- Za: łatwiej balansować, bo wartość budynku to jedna liczba w pliku.
- Przeciw: rozjeżdża się z zasadą „każdy budynek kuźniczy daje +15%", którą podałeś.
- Przeciw: przy kolejnych awansach w przyszłych epokach trzeba będzie pamiętać o ręcznym sumowaniu.

**REKOMENDACJA: C** — daje Twoje docelowe sumy, a jednocześnie wartość jest widoczna wprost w danych, bez ukrytej reguły.

**ODPOWIEDŹ MACIEJA (2026-07-25):** „Bonusy muszą się zsumować. Jeżeli jest Upgrade, w jednym wypadku pierwszego poziomu
było 20% a w wypadku drugiego poziomu 20% to dla drugiego poziomu łącznie 40 musi być wykazywane 40 i tak we wszystkim."
→ **Wdrażane jako wariant A uogólniony:** silnik sumuje procenty po całym łańcuchu `upgradeFrom` (rekurencyjnie),
a interfejs pokazuje **sumę skumulowaną**, nie surowy procent budynku. Zasada ogólna — zadziała automatycznie dla
przyszłych łańcuchów w kolejnych epokach, bez ręcznego przeliczania w danych.
Wynikowe sumy: **Ścieżka A (Pancerz) 45%** (Kuźnia 15 + Kuźnia żelaza 15 + Wielka Kuźnia 15) ·
**Ścieżka B (parametry) 50%** (Akademia wojskowa 20+20 za Koszary + Warsztat oblężniczy 10).
Interfejs: Akademia wojskowa pokazuje „+40% Parametry", Wielka Kuźnia „+30% Pancerz".

**Uwaga dodatkowa.** Ścieżka B nie skaluje `Obrażeń broni` ani `Przebicia` — bo istniejące bonusy cywilizacji też ich nie
skalują. Nie wprowadzałem tu nowej asymetrii. Jeśli chcesz, żeby skalowała, to osobna decyzja.

---

# PACZKA 2 — pytania przygotowane, jeszcze nie zadane

## PYTANIE 21 — martwe pole `odblokowuje` · **STATUS: ✅ ZAMKNIĘTE (55B wdrożone)**

Decyzja **B** — pole `odblokowuje` steruje flagami miasta (`production.ts`). `docs/decyzje/PYTANIE-21.md`.

## PYTANIE 22 — Wielka Kuźnia · **STATUS: ✅ ZAMKNIĘTE (56 = B)**

**56 = B** — kategoria i parkowanie do epoki klasycznej. `docs/decyzje/PYTANIE-22.md`.

## PYTANIE 23 — odznaki ulepszeń · **STATUS: ✅ WDROŻONE (57 = A+B)**

**57 = A+B** — kropki na żetonie + kolorowa obwódka (mapa). `docs/decyzje/PYTANIE-23.md`. (Nie 11A tarcza+miecz.)

---

## PYTANIE 25 — awans budynku: zastąpienie czy rozbudowa · STATUS: **ODPOWIEDZIANE 2026-07-25 = B, per łańcuch**

**Sytuacja.** Maciej (2026-07-25): „chciałbym widzieć w grze wybudowanych zarówno nowy upgrade jak i stary budynek…
Przecież nie usuwamy murów, zastępując je basztą, tylko po prostu mamy zarówno mur, jak i basztę."
Dziś awans **podmienia `id`** (`applyCompletedBuildingIds`, `production.ts:575`): miasto z Cytadelą ma wpis `fort`,
a wpisu `mury` już nie ma. Sześć łańcuchów: Mury→Cytadela, Pałac I→II→III, Biblioteka→Akademia,
Koszary→Akademia wojskowa, Kuźnia żelaza→Wielka Kuźnia, Spichlerz→kolejny tier.
**Pułapka:** samo zostawienie obu wpisów spowoduje podwójne liczenie wszędzie — mur 200% + Cytadela 300% = 500% obrony.

**A. Poprzednik zostaje w mieście naprawdę** — lista zawiera i `mury`, i `fort`; silnik wszędzie liczy tylko najwyższy szczebel.
- Za: model szczery — to, co widać na liście, miasto faktycznie ma.
- Za: otwiera osobne burzenie/uszkodzenie muru przy zachowaniu baszty.
- Przeciw: KAŻDE miejsce czytające listę budynków musi znać łańcuchy; przeoczenie = ciche podwójne liczenie.
- Przeciw: istniejące zapisy mają tylko następcę — trzeba migracji.

**B. Poprzednik pokazywany jako zawartość następcy** — silnik trzyma sam `fort`, UI po kliknięciu rozwija listę z łańcucha `upgradeFrom`.
- Za: ten sam efekt wizualny przy zerowym ryzyku podwójnego liczenia.
- Za: działa od razu dla wszystkich zapisów, bez migracji.
- Przeciw: to prezentacja, nie model — muru nie da się osobno zburzyć.
- Przeciw: lista pokaże budynki, których miasto formalnie nie ma.

**C. Budynek jako struktura złożona z części** — mur, baszta, brama jako osobne elementy jednego obiektu obronnego.
- Za: najbogatsze gameplayowo, otwiera wyłom w konkretnym elemencie.
- Za: najbliższe realiom fortyfikacji.
- Przeciw: przebudowa całego systemu budynków, produkcji, obrony i UI.
- Przeciw: mnoży decyzje gracza, zanim ogramy obecne oblężenia.

**REKOMENDACJA: B** — daje żądany efekt natychmiast i bez ryzyka; przejście B→A później jest łatwe, odwrotne już nie.

**ODPOWIEDŹ MACIEJA (2026-07-25):** **wariant B, ale rozstrzygnięty per łańcuch, nie jedną regułą dla
wszystkich budynków.** Łańcuchy „w górę" (następca kasuje poprzednika, wariant B — UI rozwija po kliknięciu):
Pałac I→II→III · Dom Starszyzny→Dwór Zarządcy→Pretorium · Kuźnia brązu→Kuźnia żelaza→Wielka Kuźnia ·
Spichlerz→Spichlerz II · Port handlowy→Port wielki · Piec hutniczy→Odlewnia żelaza. Łańcuchy „w bok" (oba
budynki stoją obok siebie naprawdę — to bliżej wariantu A, ale bez ryzyka podwójnego liczenia, bo to inne
budynki z innymi rolami, nie ten sam bonus liczony dwa razy): Mury+Cytadela+Baszta · Biblioteka+Akademia ·
Koszary+Akademia wojskowa · Kamienne kręgi+Świątynia. Pełny zapis:
`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §1. **Status wdrożenia:** decyzja zapisana, NIE wdrożona w kodzie.

---

## PYTANIE 26 — Pałac III jest SŁABSZY od Pałacu II · STATUS: **ODPOWIEDZIANE = B** (podnieść bazy wyższych tierów)

**Sytuacja.** Po przejściu na model liniowy (`baza + przyrost × (poziom−1)`) kultura Pałacu wychodzi tak:

| Tier | baza | przyrost | maks. poziom | Kultura wg epoki miasta |
|---|---|---|---|---|
| Pałac I | 5 | 3 | 3 | Kamień **5** · Brąz **8** · Żelazo **11** |
| Pałac II | 8 | 5 | 2 | Brąz **8** · Żelazo **13** |
| Pałac III | 11 | 7 | 1 | Żelazo **11** |

W epoce Żelaza: Pałac II daje **13**, a Pałac III — na który trzeba wydać 90 pracy, drewno, kamień i cegłę — daje **11**.
**Awans na najwyższy tier obniża kulturę.** To jest właśnie źródło niejasności „+3, +5, +7" — te liczby to przyrost
NA POZIOM wewnątrz tieru, a poziom rośnie sam z epoką miasta, więc tiery nachodzą na siebie.

**A. Wyzerować `przyrost` we wszystkich tierach Pałacu** — każdy tier ma jedną wartość: I=5, II=8, III=11.
- Za: „1 poziom = 1 epoka" staje się prawdą dosłowną — jeden tier, jedna liczba, zero nakładania.
- Za: awans zawsze opłacalny i czytelny: 5 → 8 → 11.
- Przeciw: Pałac I w epoce Żelaza (gdyby gracz nie awansował) daje tylko 5 zamiast 11 — kara za brak awansu.
- Przeciw: trzeba to zrobić dla wszystkich łańcuchów, nie tylko Pałacu.

**B. Podnieść bazę wyższych tierów tak, by zawsze wygrywały** — np. Pałac III baza 16 zamiast 11.
- Za: zachowuje wzrost wewnątrz tieru (budynek rośnie z epoką nawet bez awansu).
- Za: minimalna zmiana — trzy liczby.
- Przeciw: nakładanie tierów zostaje, tylko przesunięte — przy dokładaniu epok wróci ten sam problem.
- Przeciw: wartości trzeba przeliczać ręcznie przy każdej nowej epoce.

**C. Ograniczyć `maksPoziom` każdego tieru do 1** — tier nie rośnie sam, rośnie wyłącznie przez awans.
- Za: całkowicie usuwa nakładanie; jedna epoka = jeden tier = jedna wartość.
- Za: spójne z decyzją „nie projektujemy poziomów na zapas".
- Przeciw: budynek nie zyskuje nic z rozwoju miasta, dopóki gracz nie zapłaci za awans.
- Przeciw: pole `przyrost` staje się martwe dla całych łańcuchów — znów parametr bez efektu.

**REKOMENDACJA: C** — najczystsze i zgodne z zasadą „1 poziom = 1 epoka", którą sam ustaliłeś.

**DOPRECYZOWANIE (2026-07-25, po decyzji Pytania 25):** odpowiedź B („podnieść bazy wyższych tierów") łączy się
z regułą z Pytania 25 — budynek, który MA następcę w łańcuchu (np. Pałac I, mając Pałac II), ma **stałą wartość
per tier** i nie rośnie sam z epoką; rośnie WYŁĄCZNIE budynek na końcu łańcucha (dziś: Pałac III, bo epoki 4+
jeszcze nie ma). To jest mechanizm, który sprawia, że „podniesienie bazy wyższych tierów" faktycznie rozwiązuje
problem nachodzenia — nie ma już efektu „Pałac I dogania Pałac III samym upływem epok". Pełny zapis:
`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md` §1.

---

## PYTANIE 27 — czy Prawo z Pałacu ma rosnąć z tierem · STATUS: **ODPOWIEDZIANE = A** (35 / 45 / 55)

**Sytuacja.** Prawo **już istnieje** jako pełny system (`society-breakdown.ts`: Szczęście + Prawo → Porządek; przy zbyt
niskim Porządku wybucha bunt). Pałac już jest jego głównym źródłem: **35 pkt** (łatwy 45 / trudny 28) — dla porównania
jedna jednostka garnizonu daje 20, a pięć jednostek to pełne 100%. Ale wartość jest **płaska**: Pałac I, II i III dają
identyczne 35. Skoro zadowolenie (2/3/5) znika z Pałacu, jego progresja przestaje być czymkolwiek odzwierciedlona.

**A. Prawo rośnie z tierem** — Pałac I 35, Pałac II 45, Pałac III 55 (proporcjonalnie do dawnej progresji 2/3/5).
- Za: awans Pałacu wreszcie coś daje poza kulturą.
- Za: odzwierciedla to, co robi prawdziwy pałac — rozbudowana administracja lepiej trzyma porządek.
- Przeciw: Pałac już dziś daje 1,75× garnizonu; 55 pkt to prawie trzy jednostki wojska za darmo.
- Przeciw: może wyłączyć potrzebę trzymania garnizonu w stolicy.

**B. Zostawić płaskie 35** — Pałac daje Prawo niezależnie od tieru, progresja idzie tylko przez kulturę.
- Za: zero ryzyka rozregulowania Porządku, który jest już zbalansowany.
- Za: prostsze — jedna liczba, jedna reguła.
- Przeciw: awans Pałacu daje wtedy tylko kulturę; przy 90 pracy to chuda oferta.
- Przeciw: Twoja intencja („Pałac ma zwiększać Prawo") realizuje się tylko połowicznie.

**C. Prawo rośnie z tierem, ale łagodnie** — 35 / 40 / 45.
- Za: awans widocznie się opłaca, a garnizon dalej ma sens.
- Za: mieści się w istniejącej skali (100% = 5 jednostek).
- Przeciw: różnica 5 pkt może być dla gracza niezauważalna.
- Przeciw: dalej trzeba przetestować wpływ na bunty w stolicy.

**REKOMENDACJA: C** — awans coś daje, a zbalansowany system Porządku nie wywraca się.

---

## PYTANIE 28 — Prawo z Pretorium · STATUS: **ODPOWIEDZIANE = 70% Pałacu III** (50 / 38 / 31)

**Sytuacja.** Prosiłeś, żeby bonus Prawa z Pretorium był „co najmniej pięć". W danych już jest:
**łatwy 6 · normalny 5 · trudny 3**. Czyli na normalnym poziomie warunek jest spełniony, ale na trudnym wynosi 3.

**A. Podnieść trudny do 5** — wartości 6 / 5 / 5.
- Za: warunek „co najmniej pięć" spełniony na każdym poziomie trudności.
- Za: Pretorium staje się realną alternatywą dla garnizonu tam, gdzie jest najtrudniej.
- Przeciw: łamie konwencję całego pliku — na trudnym wszystkie bonusy są niższe.
- Przeciw: osłabia poziom trudny w miejscu, które ma być trudne.

**B. Zostawić 6 / 5 / 3** — „co najmniej pięć" rozumiane jako wartość na poziomie normalnym.
- Za: spójne z całym `society-params.json`, gdzie trudny zawsze daje mniej.
- Za: zero ryzyka dla balansu poziomu trudnego.
- Przeciw: na trudnym Pretorium daje mniej, niż prosiłeś.
- Przeciw: różnica 5 → 3 to spadek o 40%, więc na trudnym budynek robi się mało atrakcyjny.

**C. Podnieść całą skalę** — 8 / 6 / 5.
- Za: warunek spełniony wszędzie, konwencja „trudny daje mniej" zachowana.
- Za: Pretorium zyskuje wyraźną tożsamość jako budynek porządku.
- Przeciw: na łatwym 8 pkt to już blisko połowy jednostki garnizonu za darmo.
- Przeciw: trzeba przetestować, czy nie znika presja na trzymanie wojska w mieście.

**REKOMENDACJA: C** — spełnia Twój warunek na każdym poziomie i nie łamie konwencji pliku.


---

# ODPOWIEDZI MACIEJA 2026-07-25 (pytania 38-41)

## PYTANIE 38 = **A** — Kamienne kręgi i Stela zostają na kamieniu
Wyjątek od zasady „epoka Kamienia = wyłącznie drewno". Kamienne kręgi 8 szt. kamienia, Stela/Pomnik 6 szt. kamienia.
Powód: nazwa i sens obu budowli to dosłownie kamień — warunek zgodności historycznej.
**Stan: już tak zapisane w `SPEC-KOSZTY-SUROWCOWE-BUDYNKOW.md`, nic nie trzeba zmieniać.**

## PYTANIE 39 = **A** — parametry Domu Starszyzny i Dworu Zarządcy zatwierdzone
| Parametr | Dom Starszyzny | Dwór Zarządcy |
|---|---|---|
| Kultura | 2 pkt/turę | 3 pkt/turę |
| Praca | 1 pkt/turę | 1 pkt/turę |
| Pieniądz | 1 pkt/turę | 2 pkt/turę |
| Koszt budowy | 25 pkt Pracy | 45 pkt Pracy |
| Utrzymanie | 1 pieniądz/turę | 2 pieniądze/turę |
| Prawo (łatwy/normalny/trudny) | 36 / 28 / 22 | 43 / 33 / 26 |
**Stan: już wdrożone, nic nie trzeba zmieniać.**

## PYTANIE 40 = **B** — cegła wchodzi do wymiany na szlakach handlowych
Maciej: „warto już glinę wcześniej produkować przed wejściem do żelaza i być gotowym".
Cegła dołącza do `TRADE_ROUTE_RESOURCE_KEYS` obok brązu, żelaza i koni (`gra/src/game/trade-routes.ts:836`).
Miasto bez złoża gliny przestaje być odcięte od budynków epoki Żelaza — brak gliny staje się problemem
do rozwiązania dyplomacją i handlem, a nie wyrokiem przy losowaniu mapy.
Cegielnia jest budynkiem epoki Brązu, więc gracz może produkować cegłę z wyprzedzeniem, zanim wejdzie w Żelazo.
**DO WDROŻENIA.**

## PYTANIE 41 = **B, bonus +100% Obrony** — trzeci budynek obronny w epoce Żelaza
Trzeci budynek obronny miasta, **dokładany** obok Murów i Cytadeli (nie zastępuje ich).
Obrona miasta narasta: Mury +200% → Cytadela +100% → nowy budynek +100% = **łącznie +400%**.
Nazwa **ZATWIERDZONA przez Macieja**: **Baszta** („mury, cytadela i baszta może być") — w epoce Żelaza mury najeżone wieżami to standard
hellenistyczny i rzymski (`turres`), więc nazwa jest historycznie trafna i nie myli się z Fortem terenowym.
Uwaga: identyfikator Cytadeli w danych to `fort`, a osobny **Fort terenowy** to ulepszenie mapy stawiane
robotnikiem — te trzy rzeczy trzeba trzymać rozdzielnie.
**DO WDROŻENIA.**


## NAZWA ZATWIERDZONA (Maciej 2026-07-25)
Łańcuch obronny miasta: **Mury → Cytadela → Baszta**, wszystkie trzy stoją obok siebie (dokładane, nie zastępowane).
Obrona miasta: Mury +200% → Cytadela +100% → Baszta +100% = **łącznie +400%**.

---

# ODPOWIEDZI MACIEJA 2026-07-25 (pytania 42-49)

**42 = A** — Odlewnia żelaza: Praca 8 → **12 pkt/turę**. Awans ma się opłacać sam z siebie, nie tylko przez dostęp do żelaza.

**43 = bez zmian w plonach.** Maciej: „najważniejszym parametrem Spichlerza II jest obniżenie progu awansu na kolejny
poziom z 50% na 30%, czyli 70% żywności nadal zostaje — więc te parametry mogą zostać tak jak są".
→ Żywność 4 i Zadowolenie 2 zostają. **DO SPRAWDZENIA:** czy bufor 70% po wzroście populacji faktycznie działa
(`uwagi` Spichlerza II mówią „bufor 70% po wzroście" — trzeba potwierdzić w kodzie, że nie jest to kolejna martwa obietnica).

**44 = usunąć Ratusz całkowicie.** Maciej: „Ratusz będzie kolejnym etapem rozwoju budynków po Pretorium, ale dopiero
w średniowieczu, także możemy stąd usunąć całkowicie o nim wzmianki".
→ Usunąć `prawo_ratusz` z `society-params.json`, flagę `hasRatusz` z `society-breakdown.ts`, wzmianki w `cityPanel.ts`
(podpowiedzi „Ratusz, Pretorium, Sąd → trwały plus do Prawa") i w dokumentacji. Zapisać na przyszłość: Ratusz = szczebel
po Pretorium w epoce średniowiecza.

**45 = B** — Stela / Pomnik zostaje z utrzymaniem **0**. Pomnik nie wymaga obsługi.

**46 = A** — statystyki Łucznika nubijskiego zatwierdzone (koszt 20 pieniądza, utrzymanie 2, atak 4, uderzenie 2,
obrona 6, pancerz 2, przebicie 2, morale 85, plus podane przez właściciela: zasięg 5, atak dystansowy 7, 16 pocisków,
50 zdrowia, ruch 3).

**47 = B** — pre-istniejące porażki testów sprzątamy jednym przejściem PO domknięciu budynków.

**48 = A** — deploy do wersji roboczej dopiero po naprawie plonów budynków i po grupowaniu, w komplecie.

**49 = A** — dedykowany model 3D Łucznika nubijskiego **do zrobienia teraz**.

---

# KOREKTA 2026-07-25 — bramki surowcowe budynków ZOSTAJĄ

**Błąd Claude, skorygowany przez Macieja.** Z wypowiedzi „większość budynków nie potrzebuje dostępu do surowca,
tylko musi mieć surowce w magazynie" wyciągnąłem wniosek, że należy zdjąć bramkę dostępu z pięciu budynków
przetwórczych. **To było błędne.** Maciej: „Stolarnia, warsztat kamieniarski, kuźnia brązu, garncarnia i cegielnia
potrzebują surowców w terenie, mieć do nich dostęp — czyli najpierw muszą się pojawić ulepszenia, a dopiero można
budować ten budynek. To było jak najbardziej prawidłowe."

**Obowiązująca zasada — trzy różne rzeczy, których nie wolno mylić:**
1. **Koszt budowy** (`koszt_surowce`) — materiał pobierany z magazynu cywilizacji. Dotyczy każdego budynku
   i to właśnie o nim mówił Maciej („musi mieć surowce w magazynie").
2. **Bramka dostępu do surowca w terenie** (`DEPOSIT_LINKED_BUILDING_LABELS`) — dotyczy **zakładów przetwórczych**,
   które bez źródła nie mają czego przerabiać. **ZOSTAJE BEZ ZMIAN:** Stolarnia → Drewno · Warsztat kamieniarski →
   Kamień · Kuźnia brązu → Ruda · Garncarnia → Glina · Cegielnia → Glina · Spichlerz → Ceramika · Spichlerz II → Sól.
3. **Bramka `wymaganySurowiec`** w danych — Kuźnia żelaza → żelazo, Wielka Kuźnia → stal. **ZOSTAJE** (odpowiedź A).

**PYTANIE 50 = A** (Maciej 2026-07-25): bramki dostępu przy obu kuźniach i obu spichlerzach zostają nietknięte.
Uzasadnienie: budynki epoki Żelaza płacą drewnem i cegłą, więc bez tej bramki kuźnię żelaza dałoby się postawić
w cywilizacji, która żelaza nigdy nie widziała.

**Konie** — bramka dotyczy wyłącznie jednostek, żadnego budynku; bez zmian.

## REGRESJA Z DZIŚ — przywracany wymóg kolejności budowania
Usunięcie `upgradeFrom` z czterech par („likwidacja awansu bocznego") skasowało przy okazji wymóg,
że poprzednik musi stać w mieście. Maciej: „musi być budowana najpierw biblioteka, a potem Akademia,
i to trzeba stosować dla wszystkich budynków, które miały awans boczny."
→ Do `CITY_BUILDING_PREREQ` dopisywane: `akademia`←`biblioteka` · `fort`←`mury` ·
`akademia_wojskowa`←`koszary` · `swiatynia`←`kamienne_kregi`.

---

# ODPOWIEDZI MACIEJA 2026-07-25 (pytania 51-62)

**51 = A** — Targowisko: Pieniądz 3 → **5 pkt/turę**, przyrost 2 → 3.
**52 = A** — Targowisko zachowuje **+50% do Handlu brutto** bez zmian.
**53 = B** — szlaki handlowe mają przesyłać **ilość** surowca, nie sam dostęp. WDRAŻANE.
**54a = A** — Baszta wymaga Murów w tym samym mieście.
**54b = A** — Akwedukt wymaga Studni w tym samym mieście.
**54c = A** — Mennica wymaga Targowiska w tym samym mieście.
**55 = B** — pole `odblokowuje` **ożywić**: kod ma czytać flagi z danych zamiast z hardkodu `id === 'mury'`.
**56 = B** — Wielka Kuźnia: kategoria i adnotacja o parkowaniu zostają do czasu budowy epoki klasycznej.
**57 = A + B** — odznaki ulepszeń jednostek: **kropki przy żetonie ORAZ kolorowa obwódka**.
**58 = A** — Biblioteka (i Akademia) mnożą własny plon Nauki; zostaje bez zmian.
**59 = B + Pałac** — Sąd, Pretorium **i Pałac** redukują korupcję, **każdy o 30%**.
  DO POTWIERDZENIA: kumulacja mnożna (3 budynki → ok. 34% korupcji zostaje) czy odejmowanie (30+30+30 = 90%).
**60 = A** — bufor 70% żywności Spichlerza II: sprawdzić i naprawić, jeśli nie działa.
**61 = A** — cały martwy kod usunięty jednym przejściem.
**62 = C, potem A** — najpierw audyt klasyfikujący porażki testów, potem naprawa wszystkich.

## PYTANIE 63 = **modyfikacja generatora, nie testu** (Maciej 2026-07-25)
> „Musimy zmodyfikować to podejście i nie generować wielkich pasm górskich, ewentualnie mniejsze. Przyjmijmy,
> że w jednym skupisku nie może być więcej niż **10 gór oraz 10 wzgórz** przylegających do siebie. Tak, żeby
> komputer miał możliwość bardziej równomiernie rozłożyć pasma górskie, żeby **wszystkie cywilizacje miały
> dostęp do gór**. Bo potem wiemy, że to może tworzyć problemy z dostępem do rud: miedzi, żelaza i złota."

**To odwraca kierunek naprawy.** Audyt zaklasyfikował 4 porażki `fair-play-grid-test` jako „nieaktualny test"
(limit sprzed decyzji HILLS-Q1 o pasmach górskich, 2026-07-20). Właściciel rozstrzygnął odwrotnie: **test miał rację
co do zasady, to generator ma się dostosować.** Powód jest gameplayowy, nie estetyczny — wielkie pasma zabierają
całym cywilizacjom dostęp do rudy, miedzi, żelaza i (od dziś) złota.

**Do wdrożenia:** twardy limit **10 heksów gór** i **10 heksów wzgórz** w jednym **spójnym skupisku**
(przylegające do siebie), w `growMountainRanges` / `ensureReliefGridCoverage` w `gra/src/map/gen-helpers.ts`.
Determinizm generatora (`map-gen-regression-test`: hash A=B, 0 rzek bez ujścia) jest bramką.
**Uwaga metodologiczna:** `fair-play-grid-test` mierzy maksimum **w komórce siatki**, a limit właściciela dotyczy
**spójnego skupiska** — to dwie różne metryki. Limit 10 na skupisko nie gwarantuje automatycznie przejścia testu,
jeśli kilka skupisk wpadnie do jednej komórki. Trzeba zmierzyć obie liczby i zameldować.

**STATUS: zlecenie wstrzymane** — `gen-helpers.ts` trzyma subagent wprowadzający złoto. Start natychmiast po nim.

---

# ODPOWIEDZI MACIEJA 2026-07-25 (pytania 73-77) — runda „domknięcie ekonomii"

## PYTANIE 73 — korupcja · ODPOWIEDŹ: **A + dwa doprecyzowania**
Właściciel zwrócił uwagę, że **pytanie było zbędne — korupcję rozstrzygnął już decyzją 59**
(„Sąd, Pretorium i Pałac redukują korupcję, każdy o 30%"). Jego słowa: *„nie pytaj mnie drugi raz o rzeczy,
gdzie już decydowałem… A to, co już decydowałem, odpalaj subagenta i nad tym pracuj."*
**Zasada na przyszłość: przed zadaniem pytania ABC przeszukaj `PYTANIA-OTWARTE.md`, `REJESTR-PROSB-I-ZADAN.md`
i `DECYZJE-*.md` pod kątem istniejącej decyzji. Pytanie zadane drugi raz to błąd, nie ostrożność.**

Dwa nowe rozstrzygnięcia właściciela z tej rundy:
1. **Korupcja obciąża WYŁĄCZNIE Daninę (po Walucie i Mennicy: Podatek), NIE Pracę.**
   Cytat: *„Korupcja ma dotykać tylko i wyłącznie daniny, a potem podatku, nie pracy."*
2. **Oba współczynniki korupcji obniżone o 50%** — *„zbyt rygorystyczne… mają mieć wpływ, ale nie być druzgocące"*:

| Parametr | jednostka | było (easy/normal/hard) | jest (easy/normal/hard) |
|---|---|---|---|
| Korupcja — współczynnik dystansu | punkty procentowe straty Daniny na każde pole odległości od stolicy | 1 / 2 / 3 | **0,5 / 1 / 1,5** |
| Korupcja — współczynnik liczby miast | punkty procentowe straty Daniny na każde miasto właściciela | 1 / 1 / 2 | **0,5 / 0,5 / 1** |
| Korupcja — sufit straty | % maksymalnej straty Daniny w jednym mieście | 38 / 50 / 62 | **bez zmian** (właściciel obniżył „współczynniki", sufitu nie wymieniał) |

**Sufit stał się praktycznie nieosiągalny** — na normalnym wymaga `Dystans + 0,5 × Liczba_Miast ≥ 50`.

**Doprecyzowanie decyzji 59 (Maciej 2026-07-27, PYTANIE-59-DOP=B):** redukcja jest **addytywna**
(`strata × (1 − suma_redukcji)`), a naturalny sufit to **0,60, nie 0,90** — bo `palac` ma `lokalizacja: "stolica"`,
a `pretorium` ma `lokalizacja: "region"`, więc **żadne miasto nie może mieć obu naraz**. Maksimum w jednym
mieście to Sąd + Pałac (stolica) albo Sąd + Pretorium (region).

## PYTANIE 74 = **A** — domyślny podział Daniny w nowym mieście: **20% Nauka / 60% Skarbiec / 20% Zamożność**
Było 20 / 70 / 10. Powód: 20% Zamożności to dokładnie **próg utrzymania poziomu Zamożności** (20% pieniądza
miasta przy poziomie 0), więc poziom rusza z miejsca bez ręcznej interwencji; w nowej siatce Szczęścia przedział
20–29% daje **+1 pkt Szczęścia na normalnym i 0 na trudnym** zamiast 0 / −1 przy dawnych 10%.
**WDROŻONE w `gra/data/econ-params.json`.**

## PYTANIE 75 = **C** — premia do Nauki: **Biblioteka +30%, Akademia +20%**, obie skalowane trudnością
Powód: dane przeczyły decyzji 4. Dotąd **tańsza i wcześniejsza Biblioteka dawała pięciokrotnie więcej niż
droższa Akademia** (+50% vs +10%) — logika była odwrócona. Akademia dodatkowo jako jedyna nie skalowała się
trudnością.

| Parametr | jednostka | było (easy/normal/hard) | jest (easy/normal/hard) |
|---|---|---|---|
| Premia Biblioteki do Nauki miasta | ułamek (0,30 = +30% Nauki miasta na turę) | 0,62 / 0,50 / 0,38 | **0,37 / 0,30 / 0,23** |
| Premia Akademii do Nauki miasta | ułamek (0,20 = +20% Nauki miasta na turę) | 0,10 / 0,10 / 0,10 | **0,25 / 0,20 / 0,15** |

Stackują **addytywnie** (para „w bok" — stoją obok siebie): łącznie **×1,62 easy / ×1,50 normal / ×1,38 hard**
(było ×1,72 / ×1,60 / ×1,48). **WDROŻONE w `gra/data/econ-params.json`.**

## PYTANIE 76 = **B** — Pieniądz z zamiany Pracy wchodzi **w całości do puli Daniny/Podatku**
Targowisko po odkryciu Waluty zamienia pulę Pracy na Pieniądz (**mnożnik konwersji Pracy na Pieniądz** = ×2,0,
jednakowy na wszystkich poziomach trudności). Dotąd trafiał **wprost do skarbca, z pominięciem suwaka** — ten sam
błąd, który właściciel wytknął przy budynkach (67B). Teraz wchodzi do puli i dzieli się suwakiem na
Naukę / Skarbiec / Zamożność.
**KOREKTA WŁAŚCICIELA (Maciej, 2026-07-25, ta sama sesja).** Moje pierwsze doprecyzowanie było BŁĘDNE — napisałem,
że strumień nie podlega mnożnikowi Waluty i Mennicy. Właściciel poprawił:
> „Pieniądz z konwersji pracy wchodzi do daniny, później do podatku i **jest potem mnożony przez walutę i mennicę
> i wszystkie inne wskaźniki handlu**. Dlatego, że po prostu wystawiamy tę pracę na handel. Zamieniamy na twardą
> walutę, więc to jest po prostu, zwyczajnie zamiast pracy zmieniamy to na równowartość podatku."

**Obowiązująca zasada:** to NIE jest osobny strumień doklejony do puli — to Praca **wystawiona na handel**
i zamieniona na równowartość Daniny. Wchodzi do `handelBrutto` **u źródła**, zanim zadziała którykolwiek mnożnik,
więc obejmuje go **wszystko**, co mnoży Daninę: premia Targowiska do Handlu brutto, mnożnik cywilizacji
`civHandelMult`, premia +5% za każdą aktywną trasę handlową, **korupcja**, **mnożnik Waluty i Mennicy**
(×2,0 easy / ×1,5 normal / ×1,0 hard), a dopiero na końcu podział suwakiem.

**Lekcja proceduralna:** przy niejednoznaczności dotyczącej ekonomii nie przyjmuj założenia „to by dublowało premię"
— to była moja nadinterpretacja. Konwersja Pracy na Pieniądz jest sprzedażą pracy, nie premią budynku.

## PYTANIE 77 = **A** — złoto wchodzi na szlaki handlowe jako surowiec typu **„dostęp"**
Jak koń: szlak z posiadaczem złota **odblokowuje budowę Mennicy, bez przepływu sztuk do magazynu**
(złoto NIE wchodzi do `TRADE_ROUTE_STOCK_FLOW_KEYS`).
Powód: bez tego cywilizacja bez złoża złota w zasięgu **nigdy nie zbuduje Mennicy, nigdy nie dostanie mnożnika
Daniny i nigdy nie wejdzie w etap Podatku** — do końca partii, tak samo gracz jak AI. Złoże złota ma rzadkość
3% pól kwalifikujących się (tylko Góry i Wzgórza) i celowo **nie jest** na liście `FAIR_PLAY_DEPOSIT_IDS`.
To ta sama pułapka, którą właściciel rozstrzygnął dla cegły decyzją 53B.
**DO POTWIERDZENIA przez właściciela:** ~~przyjęto roboczo, że **zerwanie szlaku nie burzy już zbudowanej Mennicy**~~
**Doprecyzowanie PYTANIE-77-DOP=B (Maciej 2026-07-27):** Mennica **nie burzy się**; efekt śpi **1 turę** po utracie dostępu do złota, potem pełne uśpienie (nadpisuje robocze 83=B natychmiast). Zapis: `docs/decyzje/PYTANIE-77-DOP.md`.

## DECYZJA 78 — system weteranów (Maciej 2026-07-25), wdrażana
> „Jednostka, która wchodzi do walki ma statystyki tak jak w JSON-ach. Po pierwszej bitwie ma drugi poziom
> doświadczenia, po drugiej bitwie ma status weterana. Druga gwiazdka daje 10% do wszystkich statystyk oprócz
> armor. Trzecia gwiazdka weterana daje 20% do wszystkich statystyk poza armor. **To będzie trzeci system**
> do tych, które już daliśmy."

| Poziom | Kiedy | Premia |
|---|---|---|
| 1 — rekrut | jednostka nowo wyprodukowana | statystyki dokładnie jak w `gra/data/units.json`, zero modyfikacji |
| 2 — druga gwiazdka | po przeżyciu **1. bitwy** | **+10%** do statystyk bojowych, **oprócz pancerza** |
| 3 — weteran (trzecia gwiazdka) | po przeżyciu **2. bitwy** | **+20%** do statystyk bojowych, **oprócz pancerza** |

**Premie NIE kumulują się** — poziom 3 to +20% względem bazy z JSON-a, nie +30% i nie ×1,1×1,2. Poziom 3 jest
maksymalny; dalsze bitwy nie dają nic (zasada „nie projektujemy na zapas").

**DOPRECYZOWANIE WŁAŚCICIELA — statystyki odwrócone (najważniejsza część efektu).** Zaproponowałem, żeby pominąć
`Morale ucieczki` i `Próg dezercji (% health)`, bo są odwrócone (wyższa wartość = gorzej). Maciej odrzucił:
> „Akurat właśnie poziom weterana powinien wpływać na **morale ucieczki, próg dezercji**, bo to jest najważniejsze."

Więc premia je **obniża**: poziom 2 = baza × 0,90, poziom 3 = baza × 0,80. `Morale bazowe` (wyższe = lepiej) idzie
w drugą stronę: × 1,10 i × 1,20. Sens: doświadczony żołnierz się nie łamie i nie ucieka z pola bitwy.

**Wyłączony wprost przez właściciela:** `armor` / `Pancerz` — bez premii na żadnym poziomie.

**„Bitwa" = jedno rozstrzygnięte starcie, w którym jednostka brała udział i które przeżyła**, liczone raz na bitwę
(nie raz na turę walki, nie raz na cios). Obejmuje starcie na mapie, bitwę na polu bitwy i szturm oblężniczy.

**PARYTET AI** — identycznie dla gracza i AI, bez warunków na `ownerId`. Poziom musi przetrwać zapis i wczytanie
partii; stary zapis bez tego pola daje poziom 1, bez błędu.

**Niezależność:** to TRZECI system, obok dwóch ścieżek ulepszeń z budynków (pancerz + parametry miękkie). Premia
weterana liczona zawsze od bazy z JSON-a, żeby systemy się nie mieszały. Gwiazdki weterana muszą być wizualnie
odróżnialne od odznak ulepszeń budynkowych (decyzja 57: kropki przy żetonie + kolorowa obwódka).

## PYTANIE 79 = **A** — sufit korupcji BEZ ZMIAN (Maciej 2026-07-25)
Sufit zostaje **38% easy / 50% normal / 62% hard** maksymalnej straty Daniny w jednym mieście, mimo że oba
współczynniki korupcji zostały obniżone o 50%.

**Uzasadnienie:** sufit to **bezpiecznik**, a nie pokrętło siły korupcji — regulatorem są współczynniki.
Obniżenie sufitu spłaszczyłoby karę za odległość (miasto 25 pól i miasto 45 pól od stolicy traciłyby tyle samo),
czyli osłabiłoby dokładnie to, po co korupcja istnieje.

**Skutek praktyczny:** po obniżce współczynników sufit jest w normalnej rozgrywce nieosiągalny — na normalnym
wymaga `Dystans [pola] + 0,5 × Liczba_miast ≥ 50`. Realistyczne duże imperium (12 miast, miasto 25 pól od stolicy)
daje `25 + 6 = 31%` straty Daniny. **To świadomy wybór właściciela, NIE martwy parametr do sprzątnięcia.**

---

# LEKCJA PROCEDURALNA (Maciej 2026-07-25, upomnienie powtórzone)
> „Znowu zadajesz mi pytania, nie numerujesz ich i nie robisz w sposób ABC. Muszę wiecznie Cię upominać."

**KAŻDE pytanie do właściciela — także jednozdaniowe, także „przy okazji", także rzucone na końcu raportu —
musi mieć NUMER i PEŁNĄ FORMĘ ABC** (nagłówek `[TEMAT: …]` + ID + Sytuacja + Cel pytania + Dlaczego teraz +
A/B/C z co najmniej dwoma „za" i dwoma „przeciw" + Rekomendacja + formularz Ask na końcu).
**Nie istnieje kategoria „drobne pytanie poza formą".** Zdanie w rodzaju „powiedz, jeśli ma być inaczej"
jest pytaniem i łamie zasadę.

---

## PYTANIE 84 — budynki zależne od złoża · **STATUS: 🟡 ZAPISANA (model hybrydowy Maciej 2026-07-27)**

**Decyzja (hybryda, nie czyste A/B/C):**
- **Dostęp** (Mennica/Złoto, Sól, Konie…): brak dostępu → **natychmiast zasypia** (jak Mennica dziś).
- **Magazyn państwa** (Drewno, Kamień, Glina, Ruda…): **reguła B** — produkcja z zapasu skarbca, zasypia po wyczerpaniu; może działać chwilę po utracie kopalni, jeśli zapas został.

**Kod dziś:** runtime tylko Mennica; reszta — bramka przy budowie. Wdrożenie czeka na `działaj`. `docs/decyzje/PYTANIE-84.md`.

> „Mamy chyba więcej budynków takich, które wymagają surowca do działania. Na przykład gliny i innych.
> Teoretycznie też nie powinny działać w sytuacji, gdy nie mają dostępu. Chyba że działają na tym,
> co mają skumulowane w magazynie."

**Kontekst.** Decyzją 83B **Mennica zasypia** po utracie dostępu do złota — mnożnik znika, budynek zostaje
i budzi się sam. Maciej zauważa, że to nie jest wyjątek: podobnych budynków jest więcej.

**Stan dzisiejszy — w grze istnieją TRZY różne rodzaje bramek surowcowych i tylko jedna z nich działa
po zbudowaniu:**

| Rodzaj bramki | Gdzie w kodzie | Kiedy sprawdzana |
|---|---|---|
| **Dostęp do złoża w terenie** (Stolarnia→Drewno, Warsztat kamieniarski→Kamień, Kuźnia→Ruda, Garncarnia i Cegielnia→Glina, Spichlerz→Ceramika, Spichlerz II→Sól, Mennica→Złoto) | `DEPOSIT_LINKED_BUILDING_LABELS` w `building-resource-gate.ts` | **tylko przy budowie** — poza Mennicą |
| **Wymagany wcześniejszy budynek** | `CITY_BUILDING_PREREQ` | tylko przy budowie |
| **Surowce w magazynie** (`koszt_surowce`) | dane budynku | jednorazowo, przy budowie |
| **Dostęp do złota — DZIAŁANIE** | `zloto-access.ts` + `turn-economy.ts` | **co turę** (decyzja 83B) |

Czyli dziś **tylko Mennica** ma bramkę działania. Pozostałe sześć budynków po zbudowaniu pracuje
w nieskończoność, nawet jeśli cywilizacja straci dostęp do złoża, na którym powstały.

**Do rozstrzygnięcia — trzy warianty, do rozpisania w pełnej formie ABC:**
- **A — jak Mennica:** utrata dostępu usypia budynek (plon 0 albo zmniejszony), odzyskanie budzi.
- **B — praca z magazynu:** budynek działa dopóki ma surowiec w magazynie miasta, zużywając go co turę;
  po wyczerpaniu zasypia. To wariant, który Maciej wprost dopuścił („chyba że działają na tym, co mają
  skumulowane"). **Wymaga rozstrzygnięcia, ile sztuk na turę zużywa każdy budynek** — dziś taki parametr
  nie istnieje.
- **C — zostaje jak jest:** dostęp to warunek budowy, nie działania; Mennica pozostaje świadomym wyjątkiem
  ze względu na siłę mnożnika.

**Uwaga projektowa:** wariant B jest najciekawszy gospodarczo, ale to **nowy mechanizm zużycia surowców
na turę**, którego silnik dziś nie ma — nie mylić z jednorazowym `koszt_surowce` przy budowie.
Wariant A jest najtańszy we wdrożeniu, bo powiela gotowy wzorzec z 83B (`OwnerZlotoAccessResolver`).

**Kto to prowadzi:** temat przekazany przez Macieja do innej sesji/agenta razem z paczką prac
(karta Mennicy v2, mockupy badań i miast, dyplomacja, lokalizacja, muzyka, wiarygodność cywilizacji).
Ten wpis istnieje po to, żeby uwaga nie zginęła w czacie.

---

## DYSPOZYCJA 85 (2026-07-26) — przebudowa paska zasobów i rozdzielenie Handlu od Podatku
**STATUS: ZDECYDOWANE przez właściciela, NIEWDROŻONE. Przekazane do innej sesji razem z paczką prac.**

Słowa Macieja, dosłownie:
> „Handel powinien być przeniesiony za surowcami, czyli skarbiec, praca, surowce i handel.
> W zakładce handlu powinny być te wszystkie informacje, które teraz lądują w mieście w handlu,
> który powinien zajmować się podatkiem. Nazywać się podatkiem. To tam przenieść wszystkie informacje
> o handlu międzynarodowym z innymi cywilizacjami. Nie powinno być żadnych dodatkowych informacji
> w miastach, bo to jest globalne ustawienie dla całej cywilizacji, a nie dla miasta."

### Co z tego wynika — cztery zmiany

**1. Nowa kolejność żetonów w pasku zasobów (górny HUD).**
Dziś: `Skarbiec · Handel · Praca · Surowce`. Ma być: **`Skarbiec · Praca · Surowce · Handel`**.
Handel wędruje na koniec, ZA Surowce.

**2. Zakładka Handel = handel międzynarodowy, i tylko on.**
Wszystkie informacje o wymianie z obcymi cywilizacjami (trasy handlowe, dochód ze szlaków, wymiana
surowców) mają być zebrane w JEDNYM miejscu — w zakładce Handel, a nie rozsiane po panelach miast.

**3. Sekcja w mieście przestaje nazywać się Handel i zajmuje się wyłącznie Podatkiem.**
To domyka decyzje 65B/66B na poziomie układu interfejsu, nie tylko nazewnictwa: miasto pokazuje
Daninę/Podatek (dochód oddawany władcy, dzielony suwakiem), a nie handel.

**4. Zasada rozdziału — najważniejsza z całej dyspozycji.**
> „Nie powinno być żadnych dodatkowych informacji w miastach, bo to jest **globalne ustawienie dla całej
> cywilizacji, a nie dla miasta**."

Handel międzynarodowy jest sprawą IMPERIUM. Powielanie go w każdym panelu miasta jest błędem
konstrukcyjnym, nie tylko nadmiarem. Przy wdrożeniu trzeba przejrzeć panel miasta i **usunąć** stamtąd
to, co dotyczy szlaków z obcymi, zamiast to przenosić i zostawiać kopię.

### Punkt do rozstrzygnięcia przy wdrożeniu
~~Suwak podziału (Nauka / Skarbiec / Zamożność) jest dziś **per miasto**~~ — **ROZSTRZYGNIĘTE 2026-07-27:**
**DYSPOZYCJA-85-SUWAK = C** — globalny domyślny podział Daniny + opcjonalny override per miasto.
Zapis: `docs/decyzje/DYSPOZYCJA-85-SUWAK.md`. Kod: ROZBIEŻNOŚĆ (brak globalnego suwaka gracza).

### Stan wyjściowy dla wdrażającego
- Żetony paska zasobów: `gra/src/ui/hud.ts` (żeton „Handel” z `value: s.handelIncome`, ok. linii 439-444)
- Dochód ze szlaków: `gra/src/game/trade-routes.ts` (`tradeRouteDistanceIncome`), sumowany
  w `gra/src/main.ts` (`handelIncome`, ok. linii 8046)
- Sekcja Daniny/Podatku w mieście: `gra/src/ui/cityPanel.ts`, etykiety przez `game/danina-nazwa.ts`
- Bonus cudów `handel_procent` (5 cudów) zasila Handel, nie Daninę — decyzja z 2026-07-26

---

## ZNALEZISKO 86 (2026-07-26) — „Szczegóły bitwy" nie pokazują poziomu zniszczeń
**STATUS: ✅ ZAMKNIĘTE — ZNALEZISKO-86 = A (Maciej 2026-07-27).** % HP + pasek jak `postBattleSummary`.

**Decyzja:** A — panel „Szczegóły bitwy" ma pokazywać procent HP i pasek (wzorzec `postBattleSummary`), nie tylko liczby bezwzględne.

**Stan kodu:** WDROŻONE — `endDetails1E.ts` (% HP + pasek jak `postBattleSummary`); test `end-details-hp-test.cjs`. Pełny zapis: `docs/decyzje/ZNALEZISKO-86.md`.

~~Diagnoza historyczna (przed częściową naprawą maxHp):~~
- `gra/src/battle/endDetails1E.ts:85-88` renderuje `hpBefore → hpAfter` jako **liczby bezwzględne**,
  a kolumnę podpisuje „ludzi po bitwie".
- **`maxHp` NIGDY nie dociera do tego panelu** — grep po `maxHp` w `endDetails1E.ts` i `endScreen1E.ts`
  daje **zero trafień**. Typ `EndDetailsUnitRow` (linie 26-32) ma tylko `hpBefore`/`hpAfter`.
- Tymczasem **drugi ekran po bitwie już to robi dobrze**: `gra/src/ui/postBattleSummary.ts:239-240`
  pokazuje `HP 62% → 41%` i rysuje pasek o szerokości `hpBeforePct`, bo `gra/src/game/battle-summary.ts:78`
  liczy `pct(snap.hp, snap.maxHp)`.

**Czyli gra UMIE pokazać poziom zniszczeń — tylko na innym ekranie.** To nie brak mechaniki, to brak
przekazania jednej liczby (`maxHp`) do drugiego panelu.

**Powiązanie:** prawdopodobnie ta sama rodzina co stare zgłoszenie **R-BITWA-STRATY**
(`REJESTR-PROSB-I-ZADAN.md`) — „pasek siły/HP w panelu armii świata pokazuje pełny, nie odzwierciedla
strat". Wtedy subagent nie odtworzył objawu i temat utknął na braku repro. Teraz jest konkretny zrzut.

---

## ZNALEZISKO 87 (2026-07-26) — przestarzałe ekrany do przerobienia przez designera
**STATUS: DO PRZEKAZANIA DESIGNEROWI.** Maciej zgłasza kolejno, w trakcie playtestu.

| Ekran | Co jest nie tak |
|---|---|
| **Panel BADANIA** | przestarzały — drzewko technologii zostało dawno wymienione, panel go nie odzwierciedla |
| **Panel widoku miast na mapie głównej** | przestarzały (lista „MIASTA" z jednym wierszem i tekstem pomocy) |
| **Panel dyplomacji** | pod ikoną państwa jest niebieskie kwadratowe tło — **albo je usunąć, albo zamienić na obramówkę w tym kolorze** |
| **„MIASTO ZDOBYTE"** | przestarzałe okno po zdobyciu miasta |
| **Karta Mennicy** | mockup v1 wysłany; kierunek: oczyścić, mniej informacji, szczegóły na tooltipach, minimalizm |

**Rozstrzygnięcia właściciela do karty Mennicy v2** (2026-07-26) — wzorzec także dla pozostałych kart:
1. **„Śpi" sygnalizuje sam mnożnik** — przekreślone ×1,5 → żywe ×1,0. **Nie wygaszać całej karty**,
   bo plon i rozbudowa dalej działają. Wygaszenie zarezerwowane dla stanu „niezbudowana" + kłódka.
2. **Warunki asymetrycznie:** spełnione zwinięte w cichą linię „3 z 4", niespełnione **głośne,
   z podpowiedzią co zrobić**.
3. **Ikona jest już w kanonie:** `gra/src/ui/icons/brand/buildings/bld-mennica.svg` — emoji do wyrzucenia.
4. **Oczyścić kartę** — informacje dodatkowe na tooltipy, wygląd maksymalnie przejrzysty.

---

## ZNALEZISKO 88 (2026-07-26) — głód armii: podwójne złamanie parytetu AI
**STATUS: ✅ ZAMKNIĘTE — C-ARMY-HUNGER-Q1 = A (Maciej 2026-07-27).** Pełny parytet wdrożony.

**Decyzja:** A — Pełny parytet (suwak + głód). AI zarządza suwakiem żywności heurystyką
(`decideAIEconomySliders`, bez UI); utrata HP przy głodzie armii dla **wszystkich** ownerId.

**Dowód wdrożenia:** `docs/decyzje/C-ARMY-HUNGER-Q1.md` · kod `main.ts` (~16473, ~17338) · commit `5ef4c45`.

~~Diagnoza (historyczna, przed naprawą):~~ parytet był złamany w DWÓCH miejscach na korzyść AI
(suwak tylko gracz + atrycja HP tylko ownerId===0). Naprawione.

---

## [ZNALEZIONE PRZY OKAZJI] `ai-improvements-test.cjs` i `food-hodowla-test.cjs` — 2 porażki PRE-ISTNIEJĄCE, potwierdzone na czystym HEAD (sesja C-TARASY-Q1, 2026-07-26)

Przy pracy nad C-TARASY-Q1 (Tarasy uprawne tylko Chińczycy+Inkowie) uruchomiono pełny zestaw bramek
dotykających `game/ai.ts` i `game/terrain-improvements.ts`. Dwa testy SPOZA wymaganych bramek zlecenia
(`tsc`, `logic-test`, `ai-test`, `civ-visual-test` — wszystkie zielone) wykazały porażki:

- `tools/ai-improvements-test.cjs` test #7 „wyrab pominiety dla AI (mapa samego lasu)" — oczekiwano 0
  `buildImprovement`, silnik zwraca 1.
- `tools/food-hodowla-test.cjs` — 2 porażki: „AC-E3: Model B — bydlo w zasięgu → active Trzoda" i
  „AC-E5: bydlo w zasięgu → active Trzoda".

**Zweryfikowane jako NIEZALEŻNE od tej sesji:** odtworzone identycznie w izolowanym `git worktree` na
czystym `HEAD` (`0847205`, bez jakichkolwiek zmian roboczych — ani C-TARASY-Q1, ani równoległych sesji).
Nie są regresją tej pracy; nie były na liście znanych porażek w `CLAUDE.md`/handoffie w chwili startu
sesji — ktoś powinien je tam dopisać albo zbadać przy najbliższej okazji. Nie naprawiano (poza zakresem
zlecenia C-TARASY-Q1).

---

## [ZNALEZIONE PRZY OKAZJI] PYTANIE-84 U-10B × C-GARN-Q1 — podwójny rabat garnizonu w mieście z Solią (2026-07-27)

Po wpięciu follow-up Spichlerza (`militaryFoodConsumptionWithSpichlerz`): garnizon w mieście płacącym Sól
może dostać **dwa** mnożniki ×0,5 — `camping` w `unitFoodPerTurn` (C-GARN-Q1) **oraz**
`isGarrisonInSolCity` w `spichlerzArmyFoodCostMultiplier` (U-10B) → łącznie **0,25×** kosztu żywności
na własnym terytorium. Pytanie do Macieja: U-10B **zastępuje** ogólny rabat garnizonu, czy **stackuje**?
Plik: `turn-economy.ts` · `economy-upkeep.ts`.

---

## [ZNALEZIONE PRZY OKAZJI] Stopka „Surowce w zasięgu” — audyt UI · **STATUS: ✅ WDROŻONE (C, FALA 94 `d776c787`)**

Rekomendacja C: stopka `#cs-surowce-foot` usunięta; kompaktowy pasek Koń/Sól/Złoto w zakładce **Okolica** (`#cs-oksurowce` w `cityPanel.ts`).

---

## [ZNALEZIONE PRZY OKAZJI] Stolarnia bez Tartaku — łańcuch B1 · **STATUS: ↩️ COFNIĘTE (DOSTEP-SUROWCE-Q1, FALA 95)**

FALA 94 B1 (aktywne Drewno/Tartak) cofnięta — kanon: **tylko magazyn państwa** (`docs/decyzje/DOSTEP-SUROWCE-Q1.md`).

---

## HANDEL-SPLIT-Q1 — rozdzielenie handlu: szlaki vs wymiana · STATUS: **ZAMKNIĘTE · B · ZDEPLOYOWANE** (FALA 80 `7d266143`)
Pełna forma ABC: [`docs/decyzje/HANDEL-SPLIT-Q1.md`](../docs/decyzje/HANDEL-SPLIT-Q1.md).

**Skrót:** A = tylko UI · **B** = dwa traktaty w silniku (`umowa_szlakow` + `umowa_wymiany`) · C = jeden traktat, pole `handelTryb`.

Wdrożenie: `diplomacy.ts`, `diplomacy-proposals.ts`, `diplomacy-treaties.ts`. ROBOCZA zweryfikowana 2026-08-06 (`umowa_szlakow` / `umowa_wymiany` w bundle).

---

## [UI/RENDER] Drogi — wygląd/mesh do przebudowy · STATUS: **ODŁOŻONE** (rozmowa jutro, 2026-07-29)

**Screen (mapa):** płaskie jasne prostokąty / belki między Atenami a Argos — drogi wyglądają nieatrakcyjnie.

**Cytat Macieja (2026-07-29 ~02:13):** „Chyba będzie przebudować drogi, bo nie wyglądają zbyt atrakcyjnie. Ale o tym jutro pogadamy."

**Status:** odłożone na jutro — bez ABC, bez wdrożenia w tej sesji.

---

## KOLEJKA — audyt handlu / stołu negocjacji · STATUS: **PO PN ZŁOTO/WĘGIEL** (Maciej 2026-07-29)

**Cytat Macieja:** po PN złoto/węgiel — **później** dokładny audyt całego handlu: czy wszystko spina się z wytycznymi (stół negocjacji), czy nie ma dróg na skróty / sytuacji omijających stół (wszystko na stół → akceptuj/odrzuć).

**Warunek startu:** po zamknięciu PN dla złota i węgla. **Bez skrótów** — pełny przegląd ścieżek handlowych vs kanon stołu.

---

## D-WIAR-KASKADA-Q1 — kara W przy kaskadzie sojuszniczej · STATUS: **ZAMKNIĘTE · W ROBOCZEJ** (Maciej **B**, FALA 111 `e5c1bbed`)

**Sytuacja.** Gdy A atakuje B, sojusznik C ofiary może być zmuszony wypowiedzieć wojnę A — zerwa NAP/sojusz z agresorem.

**Odpowiedź Macieja:** **B** — odwet sojusznika w obronie ofiary: C **nie traci** Wiarygodności (N2) za wymuszone zerwanie NAP/sojuszu z A; traktaty nadal się zrywają; agresor nie dostaje kary W za pośrednie zerwanie z C.

**Wdrożenie:** `docs/decyzje/D-WIAR-KASKADA-Q1.md` · `isDefensiveAllianceWarObligation` · `chargeWarDeclarationCredibility` + `applyAllianceObligationsOnWar`.

**Deploy:** decyzja wieczorem 29.07 — **po** FALA 110 (`1d730ca2`). Kod w `gra/src`, **brak** w `gra-robocza/` do czasu kolejnego deployu.

---

## R-HEX-PLONY-MAGAZYN — plony HEX (`terrain-yields`) vs silnik magazynu · STATUS: **ZAMKNIĘTE** (Maciej 2026-07-29, decyzja **B**)

**Decyzja:** `docs/decyzje/R-HEX-PLONY-MAGAZYN.md` — tileYield z obrabianych heksów (centrum + 👤) → magazyn; ulepszenia `surowiec_ilosc_tura` addytywnie.

**Wdrożenie:** `turn-economy.ts` (`computeWorkedMagazynYieldsByCity`, `tickEmpireResourcePipeline`), `hexContextTooltip.ts`, test `hex-plony-magazyn-test.cjs`.

---

## D-DYPLO-KOSZYK-OD-RAZU — klik z „Możliwe umowy" od razu na stół · STATUS: **ZAMKNIĘTE · WDROŻANE** (Maciej 2026-07-29)

**Cytat Macieja:** „Po wyborze z możliwe umowy (np. Traktat handlowy) — od razu w «My oferujemy», bez modala «Wyślij propozycję». System od razu przelicza Punkty porozumienia."

**Wdrożenie:** `diplomacyAudience.ts` (aid `5` → `onAction` bez `showSzlakiTreatyProposalModal`), `diplomacyNegotiationModal.ts` (usunięty krok 2 „Wyślij propozycję"), usunięty modal `showSzlakiTreatyProposalModal` z `diplomacyTradeBasket.ts`. PN: `handleNegotiatedProposal` → `updateDiplomacyAudience` → `negotiationBalanceBarHtml` / `computePlayerAcceptanceSides`.

---

## R-HEX-PLONY-MAGAZYN (archiwum zgłoszenia) — plony HEX vs silnik magazynu

**Cytaty Macieja (2026-07-29):**
> „Trochę rozjeżdża się to co jest produkowane dzięki tartakowi i tym co jest na HEX-ie. Obawiam się że te informacje z HEX-a są martwe."
> „Z HEX-ów żadne surowce się nie odkładają."
> „Dane są w ustawieniach, ale chyba nie w silniku."

**Kontekst zgłoszenia.** Maciej widzi na HEX-ie plony (np. 5 Drewna + Kamień z `terrain-yields`), buduje Tartak i oczekuje sumy plonów terenu + bonusu budynku (+25 Drewna pkt/turę), a w magazynie widzi tylko +20 — bez śladu surowców z heksów. Wcześniejszy audyt agenta stwierdził „mylące ale działa"; Maciej się **nie zgodził**. Pytanie **nie było** trwale zapisane w pliku.

**Uwaga procesowa (Maciej 2026-07-29):** „każde moje pytanie, każdy błąd jest zapisywany w plikach" — ten wpis domyka lukę.

**Hipoteza robocza z audytu (do potwierdzenia, nie werdykt):**
- **Kamień z terenu** — prawdopodobnie **martwy** w silniku magazynu (dane w `terrain-yields`, brak wpływu na skarbiec).
- **Drewno z terenu** — może działać **tylko przez ulepszenie 👤** (np. Tartak na lesie), nie z gołego plonu HEX-a.
- **Tartak +20** zamiast oczekiwanego +25 — może wynikać z braku sumowania plonów HEX + budynku, albo z innego źródła liczby w UI.

**Czeka na:** twardy werdykt techniczny (ścieżka kodu: `terrain-yields` → `turn-economy` / magazyn państwa) + ewentualna paczka ABC/naprawa po potwierdzeniu.

**Uwaga:** w transkrypcie 29.07 ~18:12 Maciej pisał „w **silniku**" (STT czasem jako „średniku") — **ten sam wątek**, nie osobny temat.

---

## D-DYPLO-KATALOG-AKCJI — brak akcji (sojusz, wojna…) w menu propozycji · STATUS: **ZAMKNIĘTE** (FALA 243 `01f6024a` · Q1=A)

**Cytat:** „Nie widzę tutaj np. sojuszu czy zaatakowania innego państwa. Większość akcji dyplomatycznych, które mieliśmy w kodzie i zaprojektowaliśmy, ich tu nie widzę."

**Czeka na:** audyt katalogu akcji vs UI propozycji/wydarzeń + wdrożenie brakujących lub ABC co pokazać.

---

## D-DYPLO-CELOWNIK-STOLICA — przeskok kamery do stolicy z karty państwa · STATUS: **ZAMKNIĘTE** (FALA 241 `178073f9` · Q1=A)

**Cytat:** Na karcie reprezentanta państwa w dyplomacji brakuje **celownika** — klik przenosi na mapę do stolicy tego państwa.

---

## D-DYPLO-AKCJE-SZARE — niedostępne akcje wyszarzone + tooltip · STATUS: **ZAMKNIĘTE** (FALA 243 `01f6024a` · Q1=B+C)

**Cytat:** Gdy próg nie spełniony — akcja **wyszarzona z tooltipem** (nie znika). Osobno: akcje niemożliwe z **państwem-miastem** — wyszarzone z komunikatem.

---

## BUG-DYPLO-PANEL-OVERLAP — panel dyplomacji nachodzi na panel jednostki („Frank") · STATUS: **ZAMKNIĘTE** (FALA 245 `8b6e0cfe` · `BUG-DYPLO-PANEL-OVERLAP-Q1=A`)

**Cytat:** Po dyplomacji z zaznaczoną jednostką oba panele nachodzą; miało być naprawione.

**Wdrożenie:** `unitCtxDockDiploGate.ts` — ukryj dock jednostki gdy dyplo open. Szczegóły: `docs/decyzje/BUG-DYPLO-PANEL-OVERLAP-Q1.md`.
---

## BUG-DYPLO-NAP-PW-ZERO — karty NAP na stole bez wartości PW · STATUS: **ZAMKNIĘTE** (fix 2026-07-29)

**Cytat:** Karty „Pakt o nieagresji" (My oferujemy / Oni oferują) nie pokazywały żadnej wartości PW — miały mieć swoją wartość z `diplomacy-acceptance-points.json` (baza 200 PW).

**Przyczyna:** `renderTreatyDealItemHtml` wyświetlał tylko etykietę traktatu; panel bilansu brał wyłącznie `offerPn` z koszyka (0 przy pustym payloadzie NAP).

**Fix:** `bilateralTreatyDisplayPw` + `sideDisplayOfferPw` w `diplomacy-acceptance-points.ts`; karty stołu i panel PW pokazują wartość traktatu na obu stronach (dwustronny).

---

## BUG-DYPLO-GIFT-WAR-FALSE — dar pieniędzy blokowany komunikatem o wojnie mimo pokoju · STATUS: **NAPRAWIONE w źródle** (2026-08-02)

**Cytat (screen Macieja):** Modal „Prezent / dar" przy audiencji z Rzymianami (stan POKÓJ, Życzliwy) pokazuje czerwony komunikat „W wojnie pieniądze tylko w ugodzie pokojowej" i wyłącza ZAPROPONUJ — mimo że „Wypowiedzenie wojny" jest dostępne (nie ma wojny).

**Przyczyna:** `validateBasketForm` w `diplomacyTradeBasket.ts` wołał `isCurrencyProposalForbiddenDuringWar(..., true)` z hardkodowanym `atWar: true`, ignorując `ctx.atWar` z audiencji.

**Fix:** trzeci argument = `ctx.atWar ?? false`. Silnik (`diplomacy-proposals.ts`) był poprawny — błąd tylko w walidacji UI koszyka. Testy: `diplomacy-war-gates-test.cjs`, `diplomacy-proposal-test.cjs` §17.

---

## BUG-DYPLO-NAP-FAIRMIN-FALSE — NAP pokazuje fałszywe „Brakuje PW" (fair min handlu) · STATUS: **NAPRAWIONE w źródle** (2026-08-02)

**Cytat (screen Macieja):** NAP @ Rel 52, symetryczne 296/296 PW — panel pokazywał „Brakuje 274 PW" / „Poniżej progu fair min (570 PW)", mimo że koszyk PW jest opcjonalny, a NAP akceptuje się progiem Relacji (≥50).

**Przyczyna:** `treatySummaryHtml` wołał `renderPnBalancePanelFromBasket` dla wszystkich traktatów z bazą PW (nie tylko pokoju) — `diplomacyFairGivePn(296, 52)` dawało fair min 570.

**Fix:** `renderPnBalancePanelForTreaty` (uogólnienie ścieżki pokoju) w `diplomacyAcceptanceBalance.ts`; `treatySummaryHtml` przy `bil > 0` używa panelu traktatowego (bilans = słodzik netto koszyka, meta „Traktat: X PW @ Rel Y"); przy niskiej Relacji komunikat o progu Relacji, nie fair-min handlu. Test: `diplomacy-acceptance-points-test.cjs` (NAP @52/@40 + regresja pokoju).

---

## BUG-DYPLO-TRADE-INCOMING-ACCEPT — Przyjmij zablokowany + fałszywe „Brakuje PW" na propozycji AI · STATUS: **NAPRAWIONE w źródle** (2026-08-02)

**Cytat (screen Macieja):** Traktat handlowy — My: 10 Glina/turę (200 PW), Oni: 8 ¤/turę (80 PW). Panel: Bilans (Oni) **−120**, „Brakuje 120 PW", „Oni nie spełniają progu". Przyjmij disabled (tooltip fair min @ Relacji). Karty statyczne — brak edycji obu stron koszyka.

**Przyczyna:** `canAccept` w `main.ts` wymagał `responderPreview.accepted` z `evaluateProposal` (fair-min proponenta AI); przy korzystnym dla AI dealu zwracało false. Panel PW używał `their.balancePn = offer − fairMin` zamiast netto wymiany. Edycja tylko przez przycisk Kontruj.

**Fix:** Incoming `canAccept = !legacyAccess` (gracz decyduje). `computePlayerAcceptanceSides` + `renderPnBalancePanelHtml`: bilans netto `my−their`, bez „Brakuje" gdy gracz oddaje więcej. Klik w kartę przychodzącej propozycji → koszyk edycji obu stron (jak Kontruj). Test: `diplomacy-acceptance-points-test.cjs` (incoming traktat +120).

---

## BUG-DYPLO-UMOWY-DUPLIKAT — wielokrotne klikanie tej samej umowy na stole · STATUS: **ZAMKNIĘTE** (fix 2026-07-29)

**Cytat:** Można wielokrotnie naciskać tę samą umowę (np. Traktat handlowy) — na stole pojawia się wiele kart i rzędów Przyjmij/Odrzuć.

**Fix:** `hasPendingNegotiationForPair` + `findOwnOutgoingNegotiation` (`diplomacy-proposals.ts`); guard w `handleNegotiatedProposal` (`main.ts`); `blockDuplicateNegotiationClick` + blokada kafelków `active` (`diplomacyAudience.ts`).

---

## R-AI-MIASTA-BUDOWY — państwa-miasta prawie nie budują mimo zasobów · STATUS: **ZAMKNIĘTE** (FALA 244 `0757265a` · FIX-Q1=A)

**Cytat:** „Państwa miasta nie budują praktycznie żadnych budynków, chociaż mają zasoby — trzeba sprawdzić."

---

## BUG-SUROWCE-WIDOCZNE — surowce na mapie widoczne po ulepszeniu (miały być przykryte) · STATUS: **ZAMKNIĘTE** (fix 2026-07-29)

**Cytat:** „Znowu po budowie widać surowce. Miały być przykryte." (Regresja względem wcześniejszej decyzji ukrywania złóż pod ulepszeniem.)

**Root cause:** Wejście w tryb budowy wywoływało `autoEnableWorkerOverlayForBuildMode()` (wymuszało 👤) oraz po postawieniu/cofnięciu ulepszenia pełny `rebuildResourceOverlays()` (skan całej mapy, odsłanianie wszystkich złóż z pominięciem per-hex suppress).

**Fix (`gra/src/main.ts`, `gra/src/ui/minimapHud.ts`, `gra/src/ui/hud.ts`):**
- Usunięto auto-włączanie overlay przy starcie build mode.
- Po budowie/czyszczeniu: `syncResourceOverlayAtHex(hexKey)` zamiast pełnego rebuild.
- Dodano toggle ⛏ `showResourceDepositOverlay` — build mode nie resetuje widoczności; `hexSuppressesResourceOverlay()` nadal ukrywa złoża pod ulepszeniem.
- Podświetlenie kandydatów: `unitRenderer.setHighlight()` (bez resource overlay ON).

---

## BUG-FARMA-GLINA-ZNIKA — ikona gliny znika po postawieniu Farmy · STATUS: **ZAMKNIĘTE** (fix 2026-07-29)

**Cytat:** Po zbudowaniu Farmy znika ikona gliny na heksie — mylące UI (gracz myśli że złoża nie ma). Technicznie Glinianka nadal się buduje (farma i glinianka = różne sektory).

**Przyczyna:** `hexSuppressesResourceOverlay()` ukrywał overlay przy **każdym** ulepszeniu terenu (farma, fort, tartak…), nie tylko przy eksploatacji danego złoża.

**Fix (`gra/src/game/terrain-improvements.ts`, `gra/src/main.ts`):**
- Nowa reguła: `hexSuppressesDepositOverlay()` / `improvementHidesDepositOnHex()` — chowaj ikonę złoża **tylko** gdy na heksie stoi ulepszenie **dedykowane** temu złożu (Glinianka→glina, Kopalnia miedzi→miedź, Owce→owce itd.).
- Farma / Irygacja / Droga / Fort / Tartak / Kamieniołom **nie** chowają ikon złóż.
- Złoże (`nakladka` / `hex.zloze`) **nie jest usuwane** z danych heksa — zmiana wyłącznie wizualna.

**Weryfikacja:** `map-improvement-qualify-test.cjs` (sekcja BUG-FARMA-GLINA).

---

## R-ZAMIEN-ULEPSZENIE-CONFIRM — potwierdzenie zamiany wykluczających ulepszeń · STATUS: **ZAMKNIĘTE (Q1=A)** (Maciej 2026-08-03)

**Cytat pierwotny:** Przy budowie ulepszenia wykluczającego istniejące — dialog „zastąpić?"

**Decyzja:** **A** — zawsze modal przy zastąpieniu. Kod już tak działa (`showImprovementBuildConfirmModal`). Szczegóły: `docs/decyzje/R-ZAMIEN-ULEPSZENIE-CONFIRM.md`.

---

## BUG-ARMIA-BRAK-POLACZ — brak akcji „Połącz" przy wielu jednostkach na heksie · STATUS: **ZAMKNIĘTE · ZDEPLOYOWANE** (FALA 207 `47a2e73b` · domknięcie colocated F249)

**Cytat:** Jest „Rozdziel", brakuje „Połącz" gdy kilka jednostek na polu.

**Wdrożenie:** przycisk Połącz w `armyStackHud.ts`; fix ukrywania docku (`hexDetailHex`); `canMerge`/`onMerge` → `canMergeSelectedStack` + `openMergePanelForSelected` (garnizon↔pole). Audyt R-PUŁKA #13: `docs/decyzje/R-PULKA-FORGOTTEN-AUDIT.md`.

---

## R-PUŁKA-PYTANIA-29-07 — paczka pytań bez odpowiedzi w czacie (29.07 noc) · STATUS: **ZAMKNIĘTE audytem** (2026-08-05)

**Audyt:** `docs/decyzje/R-PULKA-FORGOTTEN-AUDIT.md` — 18/18 + 5 powiązanych domknięte; **0 realnie otwartych**.

Maciej ~01:43: „Zadałem sporo pytań, czekam na odpowiedzi." Źródło pełne: `MASTER-Work_KORESPONDENCJA.md` linie 93062–93505 (transkrypt 29.07 01:24–01:59).

**Pełna lista numerowana (18 pytań + 2 uwagi balansu):**

| # | Temat (skrót) | Odpowiedź z kodu? |
|---|---|---|
| 1 | Farma bez 👤 — czy daje Ż/Pr/Pod? | TAK — tylko z obywatelem lub centrum |
| 2 | Palisada — tech i czy działa? | TAK — Obróbka drewna, **Kamień** (korekta 2026-07-29), +100% Obrony |
| 3 | Lista ulepszeń: surowce **bez** vs **z** 👤 | TAK — dwie listy (archiwum 01:32) |
| 4 | Irygacja vs Farma — nachodzą graficznie? | TAK — logicznie stack OK, jeden mesh `pole_irygowane` |
| 5 | Farma + Trzoda — czy można Irygację? | TAK — **nie** (farma+irygacja **albo** farma+trzoda) |
| 6 | ETA budynku (~N tur przy obecnej Pracy) | TAK — `cityPanel.ts` `etaTurns()` |
| 7 | Skondensować UI rekrutacji (jak budynki, max 5) | WDROŻENIE — decyzja UX Macieja, nie ABC |
| 8 | Ulepszenie kosztuje 1 Pracy? | TAK — **utrzymanie**/turę (tartak, kopalnie…); budowa 15–30 |
| 9 | AI oferuje drewno, którego nie ma | BUG — cap magazynu AI (fix wdrożony, weryfikacja) |
| 10 | Handel wychodzi poza ramkę panelu | BUG — fix layout (wdrożony) |
| 11 | „Handel jednorazowy" + „Runda 1 z 3 · 5 tur" | TAK — copy do uproszczenia (nie ABC gameplay) |
| 12 | Owce w lesie / zastąpienie Tartaku — dialog? | WDROŻENIE — `R-ZAMIEN-ULEPSZENIE-CONFIRM` |
| 13 | Brak „Połącz" przy wielu jednostkach | ZAMKNIĘTE — FALA 207 `BUG-ARMIA-BRAK-POLACZ` |
| 14 | Surowce znów widoczne po budowie | BUG — fix (ZAMKNIĘTE) |
| 15 | Farma chowa ikonę gliny — czy blokuje Gliniankę? | TAK — tylko UI, złoże zostaje (ZAMKNIĘTE) |
| 16 | Tartak → 10 Drewna/t, Glinianka → 15 Glina/t | DECYZJA Macieja 01:39 — wdrożone |
| 17 | Państwa-miasta nie budują mimo zasobów | ZAMKNIĘTE — FALA 244 `R-AI-MIASTA-BUDOWY-FIX-Q1=A` || 18 | Sojusznik zerwie handel gdy broni sojusznika — kto karę? | TAK — wyjaśnione w czacie 01:02 (audyt do potwierdzenia) |

Powiązane osobno (ta sama noc, nie w skróconej tabeli): `D-DYPLO-KATALOG-AKCJI`, `D-DYPLO-CELOWNIK-STOLICA`, `D-DYPLO-AKCJE-SZARE`, `BUG-DYPLO-PANEL-OVERLAP`, `R-HEX-PLONY-MAGAZYN` (ZAMKNIĘTE B).

---

## E-TOOLTIP-ROZMIAR-2X — małe podpisy hover ×2 (nie karty wyjaśnień) · STATUS: **ZAMKNIĘTE** (Maciej 2026-07-28/29)

**Cytat:** „Zwiększyć ciąg tooltipów dwukrotnie" = **rozmiar czcionki/box ×2** przy małych podpisach przy najechaniu (ikony HUD, minimapa, toolbar), **nie** opóźnienie czasu i **nie** karty wyjaśnień (hover-detail dock).

**Wdrożenie:** `hudTitleTooltip.ts` (30px, padding 14×22, blokada natywnego `title=`) · `buildModeHud.ts` lock-tip · `sciencePicker.ts` `.civ-sci-tooltip`.

---

## E-MAP-TOGGLE-DEFAULT-ON — kłódki 👤 i granice domyślnie ON · STATUS: **WDROŻONE** (2026-07-29)

**Cytat:** Przełączniki robotników w terenie (👤) i granic państw na mapie świata — na starcie zawsze włączone; po ręcznym włączeniu nie mogą się same wyłączać (zoom, tura, panel, fog).

**Wdrożenie:** `main.ts` — `territoryBorderVisible` i `showWorkerOverlay` domyślnie `true`; `resetMapOverlayToggleDefaults()` przy nowej grze / load / playtestach; `refreshMapOverlayToggles()` po starcie sesji. Auto-wyłączanie 👤 tylko gdy overlay włączył tryb budowy (`workerOverlayAutoEnabled`) — przy domyślnym ON onboarding nie ustawia flagi auto.

---

## D-DYPLO-AI-OFERTA-ZERO — bilans PW ofert AI wg trudności · STATUS: **WDROŻONE** (Maciej 2026-07-29)

**Decyzja Macieja:** Łatwy = dotychczasowe zachowanie (gratisy / duże plusy OK). Normal (i Trudny) = AI celuje w bilans PW ≈ 0, bez dużych nadwyżek dla gracza.

**Parametr:** `AI_OFFER_PW_BALANCE_TOLERANCE_PN` — easy: ∞ · normal: **5 PW** · hard: **2 PW** (+ `AI_OFFER_PW_UNDERSHOOT_PN` hard: 3 PW na korzyść AI przy handlu surowcem).

**Wdrożenie:** `diplomacy-ai-offer-balance.ts` · `ai.ts` (brak daru ¤ i osłodzika umowy na Normal+) · `diplomacy-proposals.ts` (`generateCounterOffer` — minimalny słodzik) · `diplomacy-pn-engine.ts` (`computeQuickDealBasket` trim) · `main.ts` (korekta zapłaty surowcem). Test: `diplomacy-ai-offer-balance-test.cjs`.

---

## BUG-RZEKI-DOPLYWY — dopływy kończą się na lądzie · STATUS: **WDROŻONE** (2026-07-29)

**Cytat Macieja (2026-07-29 ~23:02):**
> „Jest jeszcze kwestia dopływów, które moim zdaniem nie łączą się z rzekami głównymi. Trzeba coś zrobić, żeby się łączyły — albo niech wpadają do morza. Generalnie rzeki nie powinny się zaczynać i kończyć na lądzie, jeżeli co najmniej nie wpadną do innej rzeki lub nie wpadną do morza."

**Przyczyna:** `pruneOrphanRiverPaths` wołane przed finalnym reliefem/złożami (szczególnie mapa Ziemia) — późniejsze kroki rozłączały sieć bez ponownego przycinania.

**Wdrożenie:** `ensureRiverOutlets()` na końcu `generator.ts` · `finalizeTributaryPath()` odrzuca dopływy bez junction/morza przy generacji · asercje w `map-gen-regression-test.cjs` (0 sierot + `checkTributaryJunctions`).

---

## D-DYPLO-AI-NO-NAG — AI nie powtarza odrzuconej oferty · STATUS: **WDROŻONE** (Maciej 2026-07-29)

**Cytat Macieja:** Po odrzuceniu propozycji AI — nie proponować tego samego w następnej turze (ani 2–3× pod rząd). Ten sam partner + ten sam typ umowy = cooldown.

**Decyzja:** Cooldown **3 pełne tury** (`AI_REJECTED_OFFER_COOLDOWN_TURNS`). Klucz: `partnerOwnerId` + `actionId`. Różne typy (NAP vs handel) — OK.

**Wdrożenie:** `diplomacy-rejection-cooldown.ts` · `main.ts` (Odrzuć → zapis, kolejka AI → filtr, save/load `meta.rejectedOfferCooldowns`) · `diplomacy-rejection-cooldown-test.cjs`. Decyzja: `docs/decyzje/D-DYPLO-AI-NO-NAG.md`.

---

## D-DYPLO-KOSZYK-UX — koszyk wymiany surowców (chipy, czas umowy) · STATUS: **WDROŻONE** (Maciej 2026-07-29)

**Cytat Macieja:** Dropdown „Typ pozycji" + ilość + „+ DODAJ" — nieczytelne. Chce chipy z ikonami gry (HUD/magazyn), wybór czasu umowy (Jednorazowo / Co turę × N tur), przyciski +1/+10/+100 przy ilości.

**Wdrożenie:** `gra/src/ui/diplomacyTradeBasket.ts` — chipy typów (ikony `brandAssets` / `mapResourceIconSvg`: Pieniądze, Praca, Żywność, Surowiec, Technologia), chipy surowców z ikonami mapy, stepper ilości (+1/+10/+100), blok „Czas umowy" (chipy Jednorazowo/Co turę + presety tur 5–20). Silnik PW bez zmian.

**Screenshot:** `docs/ux/preview-dyplomacja/D-DYPLO-KOSZYK-UX-trade-basket.png` (skrypt `gra/tools/capture-trade-basket-preview.cjs`).

---

## BUG-HUD-ZOOM-FULLSCREEN — klik +/− i pełny ekran nie reagują · STATUS: **NAPRAWIONE** (2026-07-29)

**Objaw:** Przyciski zoom UI (85%–150%) i ⛶ pełny ekran nad minimapą — widoczne, ale klik bez efektu.

**Przyczyna (warstwy UI):**
1. `.civ-side-ctx-dock.open` (karta jednostki, z-index 316) miał `pointer-events:auto` na pełnej wysokości kolumny — przykrywał dock zoomu (wewnątrz `.civ-hud` z-index 310).
2. `.civ-minimap-wrap` (z-index 310, montowany po HUD w DOM) przechwytywał kliknięcia w strefie nakładania z dockiem.
3. `.civ-sci-dim-backdrop` (hub badań, dock drzewka) — przezroczysty pełnoekranowy overlay `pointer-events:auto` bez `display:none` w CSS (ryzyko „leave-behind").

**Fix:** `sidePanelHud.ts` — pass-through `pointer-events` na docku karty (auto tylko na `.sp-ctx-card`); `minimapHud.ts` — `pointer-events:none` na wrapie; `hud.ts` — dock zoom/fs na `document.body` z z-index 318 + osobne style; `sciencePicker.ts` — domyślne `display:none` na dim-backdrop; `hudTitleTooltip.ts` — wykluczenie przycisków zoom/fs z przechwytywania title.

**Pliki:** `gra/src/ui/hud.ts`, `sidePanelHud.ts`, `minimapHud.ts`, `sciencePicker.ts`, `hudTitleTooltip.ts`.

---

## BUG-PALISADA-BRAK — Palisada drewniana „wdrożona", niewidoczna w grze · STATUS: **NAPRAWIONE w źródle** (2026-07-29) · **czeka deploy ROBOCZA**

**Korekta epoki (Maciej 2026-07-29):** *„Palisada miała być w epoce KAMIENIA. Korekta nieporozumienia: nie Brąz — epoka Kamienia."* → `epokaWejscia: 1`, tech **Obróbka drewna** (Kamień w `tech.json`). Szczegóły: `docs/decyzje/BUG-PALISADA-BRAK-korekta-epoka.md`.

**Pytanie Macieja (R-PUŁKA #2):** Czy Palisada jest w danych, panelu budowy i działa (+100% Obrony, Mury zastępują)?

**Audyt (źródło `gra/`):**
| Warstwa | Stan | Dowód |
|---|---|---|
| `buildings.json` | **JEST** | `id: palisada`, `techUnlock: Obróbka drewna`, `epokaWejscia: 1` (Kamień), koszt 22 Pracy + 12 drewna |
| `loader.ts` | **OK** | Import `buildings.json` — bez filtra |
| `production.ts` | **OK** | `availableProduction` — epoka Kamień + tech; ukryta gdy `mury`/`fort` |
| `city-defense.ts` | **OK** | +100% (`bonus_obrona_palisada_proc`); Mury +200% bez stacku |
| `production.ts` apply | **OK** | Po `mury` usuwa `palisada` z `cityBuilt` |
| Panel budowy UI | **było źle** | Brak chipa „+100% Obrona" (bonus tylko w silniku, nie w `baza.obrona`) |

**Dlaczego Maciej nie widzi w playteście:** `gra-robocza/Gra-ROBOCZA.html` (md5 `e5c1bbed`, publish 2026-07-29 18:31) **nie zawiera** stringa `Palisada drewniana` w bundlu — kod jest w `gra/src` + `gra/data`, ale **nie był w ostatnim deployu ROBOCZA**.

**Naprawa (bez deployu):** `building-upgrades.ts` + `cityPanel.ts` — chip/infokarta „+100% Obrona"; `eraBuildingCatalog` — ukrywa palisadę po Murach; test `koszty-surowcowe-test.cjs` §J (dostępność w Kamieniu). **Deploy ROBOCZA** — osobno (Grok).

---

## BUG-SKARBIEC-BILANS-DASH — panel ZASOBY IMPERIUM: bilans skarbca same „—" · STATUS: **NAPRAWIONE w źródle** (2026-07-29) · **czeka deploy ROBOCZA**

**Objaw (Maciej + zrzut):** Panel „Grecy · ZASOBY IMPERIUM" — Skarbiec **83** OK, ale Wpływy / Handel ze szlaków / Utrzymanie budynków / jednostek / Netto = **—**; tabela miasta (Ateny): Do skarbca / Utrzymanie = **—**. Wrażenie: „płacę za handel", ale kwota skarbca się nie zmniejsza.

**Root cause (wyświetlanie):**
1. `openEmpireDetailFromHud()` wołało `showEmpireDetailPanel()` **przed** `refreshLiveEmpireRates()` — pierwszy render czytał stale `_lastPieniadzRate` / `_lastPlayerCityEcon` (= 0 po starcie).
2. `signedTxt()` w `empireDetailPanel.ts` zamieniało **0 → „—"** (OK dla surowców, złe dla bilansu ¤).

**Czy ¤ faktycznie schodzi (silnik):**
| Mechanizm | Debit ze skarbca? | Gdzie |
|---|---|---|
| Utrzymanie budynków + jednostek | **TAK** | `main.ts` koniec tury: `player.skarbiec -= playerBalance.utrzymanieRazem` |
| Dochód ze szlaków handlowych | **TAK (kredyt)** | `turn-economy.ts` `pieniadzZTras` → skarbiec |
| Trybut / płatność ¤ z traktatu | **TAK** | `tickDiplomacyPayments()` → `treasury.add(payer, -amount)` |
| Handel surowcowy cykliczny (zaplataTyp=zloto) | **TAK** | `tickCyclicResourceTradeDeals()` → `applyOneShotGoldTransfer()` |
| Handel surowcowy (zaplataTyp=praca) | **NIE ¤** | Odejmuje z **puli Pracy**, nie skarbca |
| Koszt „utrzymania szlaku" jako osobna opłata ¤ | **NIE** | Szlaki dają dochód dystansowy; nie ma osobnego debitu ¤ za trasę |

**Fix:** `main.ts` — `refreshLiveEmpireRates()` przed `showEmpireDetailPanel()`; `empireDetailPanel.ts` — `treasuryBalanceSignedTxt()` / `treasuryDeltaHtml()` (jawne 0); test `gra/tools/empire-skarbiec-bilans-test.cjs`.

**Deploy ROBOCZA** — osobno (Grok).

---

## BUG-CUDY-MAPA-NIE-MIASTO — cuda z panelu ulepszeń trafiały do kolejki miasta zamiast na hex · STATUS: **NAPRAWIONE w źródle** (2026-07-29) · **czeka deploy ROBOCZA**

**Cytat Macieja:** „Budowa ulepszeń obejmuje też cuda, ale cud kładzie się **na mapie świata** (heks), jak ulepszenie terenu. Jak jest źle: klik cudu w panelu ulepszeń na mapie → **dokłada się do kolejki budowy w mieście**."

**Root cause:** `buildModeHud.ts` → `onSelectWonder` → `enqueueWonderForPlayer()` w `main.ts` — cud trafiał do `cityProd` jako `__wonder__:<id>` (kolejka produkcji miasta), a po ukończeniu `pickWonderHexForCity()` losował hex automatycznie.

**Dane:** Cuda **nie są** w `buildings.json` — osobny plik `gra/data/wonders.json` (`cuda[]`, pole `kosztBudowy` w Pracy, `_meta.budowa` = „hex w terytorium (nie slot miasta)").

**Fix (źródło):**
- `activeWonderId` + klik hex → `wonderBuildSites[]` (postęp na mapie, koszt z puli Pracy imperium)
- `wonder-map-build.ts`, rozszerzenie `wonder-placement.ts` (`listQualifyingWonderHexesForOwner`)
- `buildModeHud.ts` — UI: „Kliknij hex w terytorium", nie „Kolejka produkcji"
- AI nadal przez kolejkę miasta (`enqueueWonderForPlayer` zostaje dla AI)

**Test:** `node gra/tools/wonder-map-build-test.cjs`

**Deploy ROBOCZA** — osobno (Grok).

---

## NOTATKA-PALISADA-BISKUPIN — wdrożony wygląd palisady (bez pytania do Macieja) · STATUS: **WDROŻONE w źródle** (2026-07-30) · **czeka deploy ROBOCZA**

**Cytat Macieja (2026-07-29):** „Do palisady wygląda bardzo fajnie, możesz ją wdrażać do gry."

Wdrożone w `gra/src/render/miasto-kamien.ts` (funkcja `wal`) — palisada w stylu Biskupin: skarpa ziemna + żerdzie na skos + ściana z belkami poziomymi + nierówna korona + brama od +x. Podgląd po wdrożeniu: `docs/ux/preview-palisada/wdrozenie-biskupin-kamien.png`.

**Trzy rzeczy do ewentualnej decyzji później (NIE pytam teraz):**

1. **Paleta.** Wdrożony wariant **Kamień** (drewno szare-zwietrzałe, jak `ref-styl-biskupin-kamien.png`). Wariant brązowy (`ref-styl-biskupin-braz.png`) to osobna propozycja — miasto epoki Brązu ma własny mur (`miasto-braz.ts`: mur cyklopowy / wał agger), więc brązowej palisady nikt dziś nie renderuje.
2. **Korekty wobec pliku propozycji.** W `gra/tools/.palisada-biskupin-preview-entry.ts` obroty wokół osi Y były podane w **stopniach zamiast radianów** (płyty skarpy i żerdzie leciały pod losowymi kątami), a nadproże bramy było obrócone w poprzek cięciwy — stąd długa belka wystająca poza obrys heksa na zrzucie referencyjnym. W grze jedno i drugie poprawione: pierścień skarpy stycznie do obwodu, żerdzie pochylone **na zewnątrz**, nadproże wzdłuż cięciwy. Struktura, palety i wysokości bez zmian.
3. **Koszt renderu.** Palisada to teraz **1428–1644 tri (119–137 klocków)** zamiast 288–320 tri (32 klocki). Obrys w normie (0.42 / 0.47 / 0.49 przy rezerwie 0.50 — `gra/tools/.palisada-obrys-entry.ts`), ale miasto z murem to ~135–219 meshy. Jeśli przy wielu miastach na mapie pojawi się spadek FPS — pierwszy kandydat do scalenia geometrii.

**Ikona panelu budowy:** `palisada` miała ikonę `bld-mury` (tę samą co kamienne Mury). Wdrożona dedykowana `gra/src/ui/icons/brand/buildings/bld-palisada.svg` z propozycji UX (`docs/ux/preview-palisada/bld-palisada-proposal.svg`). Powrót do wspólnej ikony = jedna linia w `building-icon-map.json`.

**Deploy ROBOCZA** — osobno (Grok).

---

## NOTATKA TECH (R-KOPALNIA-UNIWERSALNA-Q1=B) — kopalnia na węglu · STATUS: **ECHO custom** (2026-08-05) — węgiel ep.6–7 · `R-KOPALNIA-WEGIEL-Q1` → `R-ZLOZA-EPOKI-GEN-Q1`

Stare save z uniwersalną `kopalnia` na `zloze=wegiel` nie mają docelowego ulepszenia (brak `kopalnia_wegla`). Migracja przy load usuwa taką warstwę (`migrateLegacyKopalniaKey` → null). Do decyzji Macieja: osobne ulepszenie węgla vs inny fallback.

---

## PALISADA-BRAZ-Q1 — wygląd wału w Brązie przy samej palisadzie · STATUS: **ZAMKNIĘTE / WDROŻONE** (Maciej 2026-07-31)

**Decyzja: 7A** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". Drewniany wał/palisada Biskupin też w epoce Brązu (bez kamiennego muru cyklopowego/agger przy samej palisadzie). **WDROŻONE:** `miasto-braz.ts` + `cities.ts` `getWallKind` + `buildPalisadaWal` z `miasto-kamien.ts`.

---

## RELIEF-SEKTOR-Q1 — hodowla na wzgórzu: podnóże czy szczyt kopca · STATUS: **ZAMKNIĘTE** (Maciej 2026-07-31)

**Decyzja: 5A** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". Hodowla zostaje **u podnóża** kopca (obecne zachowanie). Bez zmian kodu.

---

## RELIEF-SEKTOR-Q2 — Kopalnia złota spłaszcza górę, miedzi/żelaza nie · STATUS: **ZAMKNIĘTE / WDROŻONE** (Maciej 2026-07-31)

**Decyzja: 6A** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". `kopalnia_zlota` jak miedź/żelazo — **zostawia górę**. **WDROŻONE:** `PRESERVES_HILL_RELIEF_KEYS` w `main.ts`.

---

## ARMY-STACK-CAP-Q1 — limit jednostek na heksie vs pobór · STATUS: **ZAMKNIĘTE** (Maciej 2026-07-31)

**Decyzja: 1A** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". Bez limitu stosu (jak dziś). Bez zmian kodu.

---

## FORTIFY-POLE-Q1 — fortyfikacja w polu: +50% vs +50 flat · STATUS: **ZAMKNIĘTE / WDROŻONE** (Maciej 2026-07-31)

**Decyzja: 2A** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". Naprawić na prawdziwe **+50% Obrony** (mnożnik ×1.5, nie flat +50). **WDROŻONE:** `fieldFortifyDefenseBonus` w `city-defense.ts`.

**Dopisek 2026-07-31 (FORTIFY-GARNIZON):** garnizon „Ufortyfikuj" (`inGarnizon`) w mieście **bez** budynku obronnego (brak palisady/murów/fort/cytadeli/baszty → `cityWallDefenseBonusPercent === 0`) dostaje **+50% Obrony** (jak `ufortyfikowanyWPolu` / `fortify_obrona_proc`). Gdy miasto ma palisadę, mury lub basztę (bonus budynku > 0) — **0%** od ufortyfikuj, tylko bonus budynku. **WDROŻONE:** `shouldApplyGarrisonFortifyBonus` + `unitGetsFortifyDefenseBonus` w `city-defense.ts`; wpięte w `main.ts` (Auto/taktyczna) i `mapFieldBattle.ts`.

---

## CLIMATE-DESERT-WIDTH-Q1 — szerokość pasa pustyni środkowej · STATUS: **ZAMKNIĘTE / WDROŻONE** (Maciej 2026-07-31)

**Decyzja: 3A** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". Zwęzić pas suchy do **~7 hexów** (było ~15% wysokości mapy). **WDROŻONE:** `CLIMATE_DESERT_HALF_ROWS = 3.5` w `gen-helpers.ts` (`climateBandAt` dynamicznie per wysokość mapy).

---

## WOJNA-PM-GRACZ-Q1 — tempo odbudowy PM po wojnie AI→gracz · STATUS: **ZAMKNIĘTE** (Maciej 2026-07-31)

**Decyzja: 4B** — cytat: „1a, 2a, 3a, 4b, 5a, 6a, 7a". Zostawić **60%/turę** odbudowy Manpower po wojnie wymuszonej przez AI na gracza. Bez zmian kodu.

---

## BUG-RZEKI-PERF-FALA138 — regresja czasu generowania głównych rzek · STATUS: **ZAMKNIĘTE** (2026-08-01 ~20:58)

**Cytat Macieja (~19:00):** generowanie głównych rzek **>2 min** vs wcześniej **~10 s**.

**Fix (kod):** `d2db99c` + `9c4320b` — Pangea bootstrap 22–32 ujść (było 40–60×3), cache mainKeys, stride 3, max 72 komórki grid, fastTrace 2 próby, consecutive-fail break.

**Wynik bench Duży seed 42:** etap 1 (główne) **~146 ms** (było **~295 s** Pangea); traceRiver ×1285 (było ×53246). Gęstość Pangea: **604 rzek** (111 main + 544 medium vs 637 wcześniej).

**Constraint gęstości:** zachowana (~95% liczby rzek Pangea); topUp hardStarts + etap 2 medium bez zmian logiki fill.

**Weryfikacja Macieja (~20:58, FALA 140 `935d1642`):** etap głównych rzek **~20 s OK** — temat zamknięty.

**Powiązane:** `R-RZEKI-PERF-FALA138` · sibling ujścia: `BUG-RZEKI-UJSCIE-FALA138`.

---

## BUG-RZEKI-UJSCIE-FALA138 — regres: rzeki kończą się w środku lądu · STATUS: **ZAMKNIĘTE · ZDEPLOYOWANE** (FALA 140 `935d1642`)
**Cytat Macieja (~19:18):** część rzek urywa bieg na lądzie zamiast ujściem w inną rzekę / ocean.

**Root cause:** `finalizeCoastAndInlandWater` **po** `ensureRiverOutlets` zmieniało wybrzeże → ujścia stawały się „w środku lądu"; brak bramki po topUp.

**Fix (kod):** `9c4320b` — `ensureRiverOutlets` po topUp + **ponownie po** `finalizeCoastAndInlandWater`; `scrubStrayRiverHexMarks`.

**Wynik smoke (12 map):** **0** tras bez ujścia, **0** sierot hex. Deploy FALA 140.

**Powiązane:** `R-RZEKI-UJSCIE-FALA138` · sibling perf: `BUG-RZEKI-PERF-FALA138`.

---

## BUG-RZEKI-MEDIUM-JOIN-FALA180 — średnie / „samotne” nie wpadają do main · STATUS: **✅ NA ROBOCZA — czeka werdykt** (`ab9e6d3c`, 2026-08-02 18:17)

**Cytat / playtest (robocza `13beb5fb`, po FALA 173–180):** nadal samotne odcinki rzek; **większość średnich (drugi rzut) w ogóle nie wpada do głównej**. Screeny w czacie.

**Decyzja wdrożenia (2026-08-02 ~15:13):** Maciej — wstrzymanie zdjęte; **opcja 2** (dopływy od main co 4 boki hex, prostopadle, max dystans aż góry/inna rzeka / soft stop ~3). Tor A* „celuj w sieć” na razie nie.

**Krytyczne wymaganie (Maciej):** średnia musi być połączona z siecią (start z main).

**Wdrożenie:** FALA 181–187 · ROBOCZA `ab9e6d3c` (co 4 L/R, oxbow, centrum 5×5, no-wrap 120°, render bez wybrzeżników).

---

## MAP-PANGEA-SHAPE-FALA187 — Pangea za regularna / prostokąt · STATUS: **✅ NA ROBOCZA — czeka werdykt** (`ab9e6d3c`, 2026-08-02)

**Cytat Macieja:** Pangea wygląda jak regularny prostokąt; chce ~5 zbliżonych kontynentów zlewających się w jeden nieregularny ląd.

**Rozwiązanie:** `buildPangeaBlobCenters` + `landMaskPangea` (suma+max blobów, bez `edgeRect`/`centerBias`). Test `pangea-land-shape-test.cjs`.

---

## BUG-RZEKI-MEDIUM-WRAP-CENTER-FALA187 — dopływy: zawijanie na heksie + kierunek ku centrum · STATUS: **✅ NA ROBOCZA — czeka werdykt** (`ab9e6d3c`, 2026-08-02)

**Cytat Macieja:** dopływy mają wpadać najbliższym połączeniem, bez zawijania na heksie; mają też kierować się ku centrum kontynentu (5×5).

**Root cause zawijania:** detektor szukał skrętu 60°; owijanie heksu = **120°** (Δdir ±2) + chord 1.

**Rozwiązanie:** `isHexWrapTriplet` / `trimMediumBranchHexWrap` / `trimMediumJoinHexWrap`; `pickPerpDirTowardLandCenter` + silniejszy `scoreRiverStepTowardLandCenter` w grow medium; `mediumRiverRenderPath` (widoczność).

---

## SPAWN-CLUSTER-SOLID-FALA185 — równomierny rozkład civ (bryły) · STATUS: **✅ NA ROBOCZA — czeka werdykt** (`ab9e6d3c`, 2026-08-02)

**Problem:** kupki terytoriów + puste ćwiartki mimo sep stolic; MP kleją granice.

**Decyzja:** sep między dowolnymi miastami różnych civ; maximin + bias ćwiartek; bufor MP; 1–2 iteracje wyrównania. **Zakaz:** luzowanie sep stolic, szachownica, samo ↑N bez bufora.

**Wdrożenie:** FALA 185 + fix ćwiartek (`enforceQuarterSpreadOnCenters`, twardy filtr) · ROBOCZA `ab9e6d3c`.

---
## BUG-SCENA-PERF-FALA138 — Budowanie sceny: bardzo długo (~kilkanaście minut) · STATUS: **W TRAKCIE** (FALA 150 — instrumentacja + diagnoza)

**Cytat Macieja (~19:03):** „Rzeki Uzupełnienie to może jedna sekunda natomiast budowanie sceny nadal trwa bardzo długo. Coś jest nie tak. Do zapisania. Jak napiszę Działa i to wtedy zaczniesz to analizować."

**Eskalacja (~19:06):** „budowanie sceny całkowicie chyba zawiesza do weryfikacji i testu" — wstępnie podejrzenie hang/freeze.

**Korekta diagnozy (~19:15):** „OK, przynajmniej wiemy, że to nie jest zwieszanie się, tylko po prostu bardzo długi okres generowania. Na pewno to było teraz kilkanaście minut." — **NIE hang/freeze**, lecz **bardzo długie Budowanie sceny (~kilkanaście minut)**.

**Fix FALA 139 (niewystarczający):** `mergeDecor.ts` (merge bez pełnego updateMatrixWorld); `mapRenderStyle.ts` (`robloxLite` >8000 hex); `scene.ts` (batch medium rzek 32/trasa). Deploy `73c18fc2` — **nie rozwiązał** problemu w grze.

**Weryfikacja Macieja (~20:58, FALA 140 `935d1642`):** rzeki **~20 s OK**; **Budowanie sceny nadal za długo** — „tak nigdy nie było". **Hipoteza:** wąskie gardło to **inne elementy sceny** (nie samych rzek).

**Korekta diagnozy (~21:11):** *„ilość generowanych rzek jest zadowalająca. Problem leży w tym ostatnim etapie."* — **gęstość/mapgen rzek = OK**; problem = **ostatni etap UI = Budowanie sceny** (nie generowanie rzek). Plan eksperymentu kill-switch wyłączania rzek (stage 0–5) → **ODŁOŻONY / NIE POTRZEBNY** na razie.

**Fix FALA 141 (w toku):** coast InstancedMesh + shared geo (`6556fa7`). Deploy `0b70e93f` (21:06) — **W TRAKCIE** (deploy mógł wisieć).

**Fix Pangea-only (kod 2026-08-01 ~22:33):** `isDenseLandmassMap` + skip collapse lasów + batch rzek/yield. **Patch odłożony z deployu** (Maciej): `dyspozycje/_handoff/PATCH-SCENA-PANGEA-PERF-2026-08-01.patch`.

**Fix FALA 145 (kod 2026-08-01 ~22:58):** Maciej — **przyczyna = rzeki** (nie dekoracje). Cofnięto skróty FALA 144: piasek lądu przy brzegu, `blendedTerrainHex`, wydmy 3D, oazy 3D, pełny overlay collapse, pełny coast collect. Flaga `isRiverRenderFast` (ex-`sceneBuildAggressive`) steruje **wyłącznie** tor rzek: batch 96, ribbon 4/5, batch ujść, yield. **Bez deployu** — czeka na pomiar.

**Diagnoza FALA 149 (~23:37, Maciej):** `riverRenderStage=0` (zero meshów rzek w buildScene) — **Budowanie sceny nadal bardzo długo**. Etapy UI „Rzeki — główne" / „Rzeki — uzupełnianie" to **mapgen** (`generator.ts` → `MAP_GEN_PHASE_LABELS.riversMain` / `riversFill`), **nie** render sceny. Wąskie gardło **≠ mesh rzek** — podejrzenie: pętla heksów i/lub overlay collapse (`styledOverlays`).

**Fix FALA 150 (kod 2026-08-01 ~23:40):** instrumentacja `performance.now()` w `buildScene` → `console.info('[civ] buildScene ms', { hexes, coast, overlays, rivers, tail, total })`; overlay UI z fazami: heksy / brzeg / nakładki / rzeki (lub „pomiń rzeki") / finał. **Bez deployu** — czeka na pomiar Macieja (F12).

**Root cause (częściowy, FALA 138):** ~637 ścieżek rzek + ~40k hex; `mapDetail=high` nie włączał `robloxLite`; `collapseToMergedMesh` wołał `updateMatrixWorld(true)` per overlay wybrzeża.

**Objaw:** etap UI „Budowanie sceny" trwa **bardzo długo**; etap „Rzeki — Uzupełnienie" ~**1 s** (OK, **mapgen**); etap „Rzeki — główne" ~**20 s** (OK, **mapgen**).

**Osobny temat:** `BUG-RZEKI-PERF-FALA138` — **ZAMKNIĘTE** (~20 s OK).

**Powiązane:** `REJESTR-PROSB-I-ZADAN.md` → `R-SCENA-PERF-FALA138` · `R-RZEKI-KILLSWITCH-DIAG` (**ZAMKNIĘTE częściowo** — stage 0 nie pomógł; FALA 150 = nowa instrumentacja).

---

## BUG-RZEKI-SETTLE-VIS — rzeki niewidoczne przy zakładaniu pierwszego miasta · STATUS: **✅ ZAMKNIĘTE** (Maciej 2026-08-01 ~23:15: rzeki widać przy starcie / 1. mieście)

**Objaw:** w trybie wyboru miejsca na pierwsze miasto (onboarding settle) rzeki niewidoczne na mapie; po zbudowaniu miasta nagle się pojawiają. Gameplay/mapgen OK — problem renderu + mgły.

**Root cause:** (1) na mapach gęstych (Pangea) główne rzeki trafiały do batch merge bez `pointHex` → reguła „cała wstęga albo nic"; (2) brak wyjątku mgły dla oświetlonego kręgu startu przed pierwszym miastem.

**Fix:** `scene.ts` — główne rzeki zawsze osobny mesh + `pointHex`; `setFog` opcja `riverRevealKeys`; `main.ts` — `startRevealKeysForRiverFog()` w `refreshFog` gdy `isAwaitingFirstPlayerCity()`.

**Powiązane:** historyczny bug rzeka↔mgła (`STAN-PRACY-HANDOFF.md` §7).

---

## BUG-SPAWN-CLUSTER-KULTURA — cywilizacje tego samego typu rozjeżdżają się między kręgami · STATUS: **✅ ZAMKNIĘTE** (Maciej 2026-08-01 ~23:15: rozkład cywilizacji OK)

**Sytuacja.** Po MAP-SPAWN-Q2 (wyspy, quota kontynentów, FALA 138) spawn działa lepiej na poziomie mas lądu, ale Maciej widział regresję **jakości klastrów kulturowych**: cywilizacje jednego typu czasem „przerzucają się" do kręgu innego typu zamiast generować się **wszystkie razem wokół siebie** (stolica + miasta-państwa tego samego typu w jednym skupisku).

**Fix (2026-08-01):** `clusters.ts` → `assignTypesToClusterCenters()` — typy przypisywane do środków **po** finalnych pozycjach i masach lądu (quota `allocateTypyToMasses`), nie shuffle po indeksie. `clusterCohesionMaxHex()` + test spójności MP w `cluster-start-test.cjs`.

**Powiązane:** `REJESTR-PROSB-I-ZADAN.md` → `R-SPAWN-CLUSTER-KULTURA` · kontekst historyczny: MAP-SPAWN-Q2 (FALA 138).

---

## BUG-SPAWN-ODLEGLOSC-MORZE — start cywilizacji za blisko morza · STATUS: **WDROŻONE (kod)** (2026-08-01)

**Sytuacja.** Maciej oczekuje, że cywilizacje (zwłaszcza główna / stolice startowe) na mapie **standardowej** startują **co najmniej ~10 heksów od morza** — miejsce na miasta-państwa, unikanie wysp i dziwnych miejsc, preferencja większych lądów. Parametr ma się **skalować z wielkością mapy** (10 = baza dla Standard; Mała/Duża inne wartości).

**Fix (2026-08-01):** `clusters.ts` → `buildSeaDistanceField` + `capitalMinSeaDist()` (mala=4, srednia=7, **duza/Standard=10**, ogromna=12, super=14) + `capitalMinSeaDistForMap` (clamp do rozmiaru; mapy <80 hex boku → 0 dla harnessów) w pick stolic; końcowa bramka stolicy gracza.

**Powiązane:** `REJESTR-PROSB-I-ZADAN.md` → `R-SPAWN-ODLEGLOSC-MORZE` · sibling: `BUG-SPAWN-CLUSTER-KULTURA`.

---

## BUG-MP-TRYBUT-WOJNA — miasto-państwo: DOW + „Oferta trybutu przyjęta" w jednej turze (Tarent) · STATUS: **WDROŻONE (kod, 2026-08-02)**

**Sytuacja.** Audiencja z Tarent · Rzymianie · miasto-państwo: status WOJNA, czynnik „Wypowiedzenie wojny" oraz „Oferta trybutu przyjęta" (+5) — sprzeczność; akcja 8 w UI = „Niedostępne u miasta-państwa".

**Root cause.** Obcy typ MP (np. Tarent) jest w `typCityCopyOwners` / `isOwnerClusterCityState`, ale NIE w `simplifiedDiplomacyOwners` (tylko rywale tego samego typu). Silnik traktował go jako pełną dyplomację (`full` layer) → `decideAIDiplomacy` generował trybut, `evaluateProposal` akceptował, a w tej samej turze `shouldCityStateRollWarOnPlayer` (PM hard) wypowiadał wojnę.

**Fix (2026-08-02):** Blokada trybutu dla WSZYSTKICH miast-państw (AI + evaluateProposal + gaszenie pending przy DOW). Branch `cursor/fix-cs-war-tribute-contradiction-63a1`.

**Powiązane:** `REJESTR-PROSB-I-ZADAN.md` → `R-MP-TRYBUT-WOJNA`.

---

## BUG-MP-NAZWA-CIV-MISMATCH — miasto-państwo: nazwa miasta ≠ kultura/cyw (Jin vs Argos·Grecy) · STATUS: **✅ ZAMKNIĘTE** (Maciej 2026-08-01 ~23:15: rozkład/etykiety OK w playteście)

**Sytuacja.** Obce miasto-państwo na mapie: tytuł miasta **Jin** (brzmi chińsko), podpis **Argos · Grecy · miasto-państwo**, dyplomacja „Audiencja z Argos · Grecy · miasto-państwo". Drugi screen (~21:14): skupisko miast-państw w czerwonej granicy / przy rzekach — Maciej: *„chińskie państwa miasta system określa jako państwa miasta greckie, coś jest nie tak z Chińczykami"*.

**Fix (2026-08-01):** Rozdzielenie alokacji `ownerId` — obce typy dostają ID 1..N w `cluster-spawn.ts`; rywale tego samego typu **zarezerwowane** w `pendingSameTypeRivalOwnerIds` po obcych; `main.ts` `spawnPendingSameTypeRivals` używa zarezerwowanych ID + **nie nadpisuje** `aiOwnerCivMap` obcego typuna kolizji (fallback wolne ID). Kontrakt: `cluster-start.ts` + test kolizji w `cluster-start-test.cjs`.

**Powiązane:** `REJESTR-PROSB-I-ZADAN.md` → `R-MP-NAZWA-CIV-MISMATCH` · sibling (osobny): `BUG-SPAWN-CLUSTER-KULTURA` (rozmieszczenie typów na mapie).

---

## BUG-DYPLO-AI-LABEL — lista dyplomacji: „AI 32" zamiast nazwy miasta · STATUS: **✅ ZAMKNIĘTE (kod 2026-08-02)**

**Sytuacja.** Panel Dyplomacja / znane cywilizacje: wpisy **AI 32**, **AI 34** (Kamień, Ludność: 0, Neutral) zamiast Sparta/Mykeny/Tarent itd. Egipt i pełne nacje OK.

**Przyczyna.** `resolveOwnerBaseName` fallback `AI ${ownerId}` gdy brak `aiOwnerCivMap` / `ownerDisplayName` / miasta — typowo **duchy po eliminacji** (Q5=B kasuje roster, ale `diplomaticallyDiscoveredOwners` zostawał). Ludność: 0 = ten sam byt (brak miast, nie osobny bug nazewnictwa).

**Fix:** `sanitizeOwnerDisplayBase` + pula `clusterRivalCityName` w `ownerDiploLabel`; `eliminateOwner` czyści `diplomaticallyDiscoveredOwners`; lista filtruje `eliminatedOwners` / nieaktywnych; load sejwu pomija wyeliminowanych w discovered.

**Pliki:** `gra/src/game/display-names.ts`, `gra/src/main.ts`, `gra/tools/display-names-test.cjs`.

---

## BUG-LAND-FRACTION-SLIDER — suwak % lądu prawie nie działa · STATUS: **WDROŻONE FALA 191 (kod, 2026-08-02)** (Maciej 2026-08-01 ~22:25; regres playtest 2026-08-02)

**Sytuacja.** W opcjach nowej gry „Udział lądu na mapie” (20% / 40% / 80%) — mapa wygląda tak samo. Szczególnie Pangea.

**Root cause FALA 191:** UI % dochodzi OK; maska Pangea używała tylko boolean `sparseLand` (≤35%) → 50% i 80% = ten sam footprint. Fix: `pangeaLandLayoutParams(landFraction)` skaluje bloby/ring/clusterFade.

**Otwarte (cicho):** faktyczny % lądu nadal niższy od suwaka (np. 20%→~4%, 80%→~52%) przez ocean brzegowy + wybrzeża — osobny temat kalibracji, nie blokuje różnicy 20 vs 80.

**Cel.** Po generacji suchy ląd wyraźnie rośnie z suwakiem; idealnie ≈ wybrany % (±5 pkt) — kalibracja absolute %.

**Powiązane:** scena Pangea (osobny), spawn MP.

---

## SPAWN-EXPANSION-ARC-Q1 — państwa tylko z jednej strony stolicy · STATUS: **🟢 WDROŻONE (kod)** (Maciej 2026-08-01)

**Decyzja:** **A — półpłaszczyzna (180°)**. MP tego samego typu tylko po jednej stronie stolicy; druga połowa wolna pod własne miasta.

**Plik:** `docs/decyzje/SPAWN-EXPANSION-ARC-Q1.md` · kod: `clusters.ts` + `cluster-spawn.ts` · test `cluster-start-test.cjs`.

---

## UI-LABOR-SLIDER-FOOD-PARITY — podwójny pasek PODZIAŁ PRACY · STATUS: **WDROŻONE (kod)** (2026-08-01)

**Sytuacja.** Panel miasta → PODZIAŁ PRACY: gruby pasek % (złoty/niebieski) + osobny cienki track suwaka pod spodem. Maciej: identycznie jak suwak Wyżywienie (żywność) — jedna kontrolka.

**Fix (2026-08-01):** `cityPanel.ts` → `renderPodzialPracy`: usunięty `praca-split-bar`; jeden `slider-row` + `input[type=range]` jak `renderMagazyn` / Wyżywienie. Chipy + lista szczegółów bez zmian.

---

## SPAWN-SEP-STOLICE — odległość stolic różnych cywilizacji · STATUS: **✅ ZAMKNIĘTE** (Maciej 2026-08-02 ~15:22, korekta ~23:30)

**Decyzja:** Playtest rozkładu civ OK; FALA 182: **+2 hex sep stolic na każdym rozmiarze**. Korekta 2026-08-02 wieczór: **Standard (duza) +1 hex** (14→**15**); Mała/Średnia **12**, Duża **16**, Super **19** bez zmian. Nie rozsuwa MP w klastrze (pierścień 5 hex). `capitalMinSeaDist` bez zmian.

**Kod:** `clusters.ts` LUT + testy `capital-sep-unit-test.cjs`, `capital-sep-pangea-test.cjs`, `cluster-start-test.cjs`. Rejestr: `R-SPAWN-SEP-STOLICE-15`.

## BUG-PANGEA-RECT-FALA188 — Pangea nadal prostokąt po FALA 187 · STATUS: **W TRAKCIE** (playtest `ab9e6d3c`, 2026-08-02 ~18:27)
**Cytat / screen:** ląd jak wypełniony prostokąt + cienka ramka oceanu; 7 civ → widoczne **4**; dużo pustego miejsca.
**Akcja:** diagnoza rebalance/maska + dropy klastrów (bez luzowania sep).


## BUG-RZEKI-COAST-PARALLEL-FALA188 — rzeki wzdłuż boków Pangei, brak dopływów · STATUS: **W TRAKCIE** (playtest `ab9e6d3c`, 2026-08-02 ~18:29)
**Cytat:** miały iść ku centrum; „zabijają się wzdłuż boków prostokąta”; zero widocznych dopływów — regres.
**Hipoteza:** prostokątny ląd → coast-inland równolegle do boku; medium niewidoczne / nie spawn.

## PERF-SUPER-HUGE-PANGEA-80 — gen ~14,6 min wall-clock · STATUS: **W TRAKCIE** (Maciej 2026-08-02 ~20:23)

**Źródło:** `Downloads/civ-perf-super-huge-pangea-20260802-202347.txt` · bundel `ea234151` · Super Huge · Pangea · **319 872 heksów** · ~80% lądu.

| Etap | Czas |
|------|------|
| Ląd i ocean | 14,3 s |
| Relief | **77,0 s** |
| **Rzeki — główne** | **523,0 s (~8,7 min)** ← ~70% generatora |
| Rzeki — uzupełnianie | 113,2 s |
| RAZEM generator | **746 s (~12,4 min)** |
| Scena — heksy | **110,9 s** |
| RAZEM scena | **120,8 s** |
| **WALL-CLOCK** | **873,6 s (~14,6 min)** |

**Porównanie:** Duży Pangea ~40k hex → wall ~13,5 s, rzeki główne ~4,4 s (**~64× wolniej rzeki przy ~8× więcej hexów**).

**Root cause (quota):** `pangeaBootstrapRiverTarget` cap 32 + `maxCellsToProcess=72` + `gridStride=3` → ~32 główne na ~256k hex lądu (~8000 hex/rzekę). Fix w źródłach: skala z `landHexCount`, `pangeaMaxGridCellsToProcess`, obwarzanek radial fill.

**Akcja:** audyt+fix obwarzanek + quota rzek + perf `RiverHexSpatialIndex` (bez cięcia pokrycia). **NIE deploy** do potwierdzenia w źródłach.

## BUG-OBWARZANEK-20PCT — pierścień morza przy 20% lądu · STATUS: **W TRAKCIE** (FALA 195 w deploy)
**Cytat Maciej 2026-08-02 ~21:22:** przy 20% lądu nadal obwarzanek; „jest miejsce na ląd”.
**Root cause:** `valley` w `pangeaLandLayoutParams` było **najwyższe przy niskim %** → dolina między rdzeniem a pierścieniem blobów; `ringPull` tylko przy wysokim %; annular fill za wąski.
**Fix Grok:** valley spłaszczone; ciasne bloby; `ensurePangeaSingleContinent`; test 20% annular=0 / 1 masa.

**Cytat:** „Ustawiłem siedem, a pojawia się pięć” + słabe rozłożenie.
**Fix:** top-up klastrów po dominance/`continue`/HARD sep; dominance nie dropuje. Test: caps **7/7**; spread Q jeszcze słaby na części seedów Standard.

## BUG-ZIEMIA-SCALE — Duża/Huge/SH: ląd „ten sam”, rośnie woda · STATUS: **W TRAKCIE** (cap polar ocean)
**Przyczyna:** `earthPolarOceanRows` skalował liniowo (~52% wysokości = ocean). Cap max ~12% wysokości na biegun.

## BUG-RZEKI-MEDIUM-FOW — rzeki znikają przy wyłączeniu FoW (F) · STATUS: **REGRESJA / FIX v2** (2026-08-04)
**Objaw:** FoW ON — widać cienkie niebieskie rzeki (medium) w oświetlonym obszarze; FoW OFF (F) — brak rzek w okolicy miasta.
**Root cause:** `lastFogSig=0` przy FoW ON (wszystkie punkty odkryte) kolidowało z `fullSig=0` przy FoW OFF → pomijane `setIndex` pełnej wstęgi; dodatkowo `scene.fog` przy FoW OFF gasił ujścia na `coastDeltaMat` (brak `fog:false`).
**Fix v2:** sentinel `RIVER_FOG_SIG_OFF=-1` + helpery w `riverLod.ts` (`needsRiverRibbonIndexUpdate`, `buildRiverRibbonFullIndex`); `coastDeltaMat.fog=false`; test 12/12 `river-fog-visibility-test.cjs`.
**Poprzedni fix:** bed385c (FALA 202) — niewystarczający przy kolizji sig=0.
**Weryfikacja ręczna:** Ctrl+F5 + Nowa gra → okolice miasta → F ON (rzeki widoczne) → F OFF (rzeki nadal widoczne na całej mapie).

## BUG-RZEKI-LODOWCE — brak rzek w pasie lodowców / polarnym na brzegu kontynentu · STATUS: **GOTOWE (kod)** (2026-08-02)
**Objaw:** biały pas polarny przy brzegu — zero ujść/startów rzek; rzeki tylko w zielonym lądzie głębiej.
**Root cause:** `isRiverLandTerrain` (`gen-helpers.ts` ~6596) nie zawierało `TerenBazowy.Polarny` → wykluczenie z kandydatów ujść (`collectCoastMouthCandidates`), grow path, markRiverEdge, medium fill.
**Fix:** dodać `Polarny` do `isRiverLandTerrain` (lodowiec nie blokuje generacji — odpływ może zamarzać wizualnie później).
**Weryfikacja:** `tsc` + `medium-river-test.cjs` + `map-gen-regression-test.cjs` + `polar-river-mouth-diag.cjs`.

## AC-RZEKI-PER-MASA — każda wyspa/masa jak kontynent · STATUS: **ZEBRANE** (Maciej 2026-08-02 ~22:27)
**Cytat:** zasady obowiązujące dla kontynentu mają obowiązywać **dla każdej wyspy** — nie generować masy lądu bez rzek.
**Powiązanie z audytem obwarzanka:** przy 20–60% Pangea zostają **2 masy suchego lądu** rozdzielone korytarzem **Wybrzeża** (nie Morza); rzeki gęste przy brzegu (0–5), interior/„wyspa wewnętrzna” sucha. Kod ma `landMassHasMainRiver` / topUp per masa, ale filtr `m.length >= 8` + ścieżka Pangea coast-only + ensure ślepy na Wybrzeże → luki.
**Wdrożyć razem z fixem obwarzanka (po wyborze A/B/C mostu przez Wybrzeże).** Nie osobny wątek ABC.

## AC-RZEKI-BEZ-LIMITERA — brak cap liczby / czasu siewu · STATUS: **ZEBRANE** (Maciej 2026-08-02 ~22:28)
**Cytat:** „nie powinno być żadnego limitera ilości rzek. Po prostu powinny się generować zgodnie z zasadami bez limitu. Powinny tak długo siewić jak są w stanie siewić, a nie kończyć się np. po jakimś wyznaczonym czasie lub długości."
**Implikacja:** usunąć/wyłączyć twarde capy typu `pangeaBootstrapRiverTarget` (~32), `maxCellsToProcess`, quota `capRiverQuotas` / `mapGenMaxRivers*`, early-stop po budżecie czasu; siew aż reguły (źródło, sep, ujście, masa) nie dadzą kolejnej poprawnej rzeki. `maxLen` trasy = ograniczenie techniczne A* jednej ścieżki — rozróżnić od limitu **liczby** rzek (ten drugi = zakazany).
**Wdrożyć w paczce rzek z AC-RZEKI-PER-MASA + fix obwarzanka.** Uwaga: bez limitu na Super Huge wall-clock mocno urośnie — perf osobno, nie przez cięcie pokrycia.

## BUG-INKOWIE-MP-BRAK — Inkowie bez miast-państw · STATUS: **WDROŻONE ROBOCZA** (FALA 201 `48646cd6`, 2026-08-02)

**Źródło:** Maciej 2026-08-02 — Cusco jako „OBCE MIASTO / Inkowie" bez klastra MP wokół stolicy.

**Root cause (2 warstwy):**
1. **Placement:** po FALA 185 body-sep obce klastry często zostawały capital-only (ciasny Voronoi / pierścień 5 poza lądem / bufory).
2. **Spawn:** deferred `spawnPendingForeignClusters` odrzucał sloty przez `canFoundCity` (dystans do już założonych miast), mimo że plan klastra już je zweryfikował.

**Fix:**
- `repackAllSparseClusterStateCities` po body-sep — pack z pełnego lądu + last-resort (luźniejszy bufor, pierścienie 5→2, desperate bez buforów).
- `clusterStartSlot` w `canFoundCity` / `foundCityAt`; `main.ts` przekazuje `true` przy foreign spawn.
- Test: seeds 1–20 Inkowie 20/20 z MP; seed 25 Cusco+4 MP spawn OK. Diag 1–40: onlyCap=0.

**ID rejestru:** R-INKOWIE-MP-BRAK · branch `cursor/fix-inkowie-mp-missing-63a1`

## BUG-KOLEJKA-ZWROT-SUROWCA — anulowanie budynku nie zwraca koszt_surowce · STATUS: **WDROŻONE ROBOCZA** (FALA 201 `48646cd6`, 2026-08-02)

**Źródło:** Maciej 2026-08-02 — usunięcie budynku z kolejki Pracy nie zwracało surowca pobranego przy enqueue.

**Root cause:** `addItem()` w `cityPanel.ts` pobiera `koszt_surowce` raz przy dodaniu do kolejki (`deductBuildingStockCostAcrossCities`); przyciski ✕/`Usuń` wołały tylko `dequeue()` — bez zwrotu. Rekrutacja miała już `onCancelRecruitment`; kolejka budowy — nie.

**Fix:** `refundBuildingStockCostAcrossCities` + `cancelQueueItem()` (zwrot → dequeue). Praca nie jest pobierana z góry — postęp się gubi (OK).

**Test:** `node tools/building-queue-refund-test.cjs` — 5/5 PASS.
**ID:** R-KOLEJKA-ZWROT-SUROWCA · branch `cursor/fix-queue-cancel-refund-63a1`

## BUG-BARB-GLOD — barbarzyńcy bez głodu + rajd po 2 jednostkach · STATUS: **WDROŻONE (kod)** (2026-08-02)

**Źródło:** Maciej 2026-08-02 — barbarzyńcy nie powinni mieć głodu; gdy obóz ma 2 wojowników, od razu maszerują na najbliższą cywilizację.

**Root cause głodu:** `advanceEmpireFood` zbierał `ownerId` z jednostek na mapie — barbarzyńcy (`BARBARIAN_OWNER_ID=-1`) dostawali tick bez miast/produkcji, koszt armii schodził z pustych zapasów → `glodWojska` + atrycja HP.

**Fix głód:** `empire-food.ts` pomija `isBarbarian(ownerId)`; `isArmyHungry`/`isArmyStarving` zwracają false dla barbarzyńców.

**Fix rajd:** `isCampRaidReady` (>= `unitsPerCamp` wojowników lądowych w `campControlRadius`) → `decideBarbarianMoves` ignoruje `aggroRadius` i maszeruje ku najbliższemu miastu/jednostce cywilizacji; `main.ts` ustawia `campId` przy spawnie i daje `ruchLeft` gdy obóz osiągnie cap.

**Test:** `barbarians-test.cjs` 157/157 · `empire-food-b5-test.cjs` 19/19 PASS.
**ID:** R-BARB-GLOD-ATAK · branch `cursor/fix-barb-no-hunger-attack-63a1`

## BUG-PRACA-OVERFLOW-BUDOWA — pusta kolejka + suwak na budowę · STATUS: **NAPRAWIONE (kod)** (2026-08-02)
**Sytuacja.** Miasto bez budynku w kolejce, suwak PODZIAŁ PRACY 100% budowa / 0% pula → cała Praca miasta powinna trafiać do puli cywilizacji (HUD: Praca +N). HUD pokazywał +0.
**Przyczyna.** Regresja z commit `6e1e0e48` (NAPRAWA HUD-PRACA 2026-07-26): `refreshLiveEmpireRates()` liczył `_lastPracaRate` tylko z `playerEcon.doPuli`, pomijając `doBudynkow` przy pustej kolejce. Tick końca tury (`pracaImperialPoolGain` w main.ts ~19431) był poprawny — dotyczyło głównie podglądu HUD.
**Fix:** `previewPracaPoolBrutto()` w `production.ts` + pętla per-miasto w `refreshLiveEmpireRates()` (main.ts ~11367) z `cityProd` / `frontItem`. Test: `production-overflow-test.cjs` §7 (24/24 PASS).
**Czeka:** deploy FALA 205.

---

## MAP-UX-CLUSTER-LABEL — 4 bliskie etykiety miast (stolica vs MP) · STATUS: **ZASTĄPIONE** (ABC → paczka [`ABC-PACZKA-2026-08-06-KOLEJKA`](../docs/decyzje/ABC-PACZKA-2026-08-06-KOLEJKA.md) **[3/5] MAP-UX-CLUSTER-LABEL-Q1**)

> **⛔ Nie odpowiadać w tej sekcji.** Kanon ABC: [`ABC-PACZKA-2026-08-06-KOLEJKA`](../docs/decyzje/ABC-PACZKA-2026-08-06-KOLEJKA.md) pozycja **[3/5]** (`MAP-UX-CLUSTER-LABEL-Q1`). Poniżej — kontekst historyczny audytu (2026-08-02), bez duplikatu opcji A/B/C.

**Źródło:** Maciej: 4 bliskie etykiety (np. krótkie nazwy ~2–4 hex); pamięta min. ~12 hex między stolicami.
**Audyt:** `dyspozycje/AUDYT-STOLICE-VS-MIASTA-PANSTWA-2026-08-02.md` · **VERDICT: DESIGN_KLASTRA** — sep stolic Standard=14 twarde; skupisko = 1 stolica + MP (pierścień 5 hex). Menu Standard min 4 MP → dokładnie 4 etykiety w klastrze.
**NIE bug bramki** — nie zmieniać sep/pack bez decyzji.

---

## P-AI-MOC-GAP — AI pełne cywilizacje ~10× mniej Mocy niż gracz · STATUS: **ZDECYDOWANE — B (2026-08-08, kodować teraz bez playtestu) — w realizacji** (`dyspozycje/REJESTR-PROSB-I-ZADAN.md`)

**Źródło:** playtest Macieja — gracz 6725 vs Zulusi 536 / Chińczycy 436 (poz. 1/8).
**Werdykt audytu:** gap **REALNY** (nie bug rankingu/mgły). Głównie design + martwe parametry trudności.

**Wdrożone FALA 220 (nie twierdzić „gap zniknął" bez playtestu):**
- `AI-FOUND-Q1=A` — founding major pop≥2 (było ≥5)
- `AI-LOCAL-Q1=A` — faza lokalna tura 20 LUB 1 scout; wioski nie blokują
- `AI-MANAGE-Q1=A` — auto-zarządca major AI
- Major AI early economy (wzrost/Spichlerz, 60/40 archetyp, early ulepszenia)

**Nadal otwarte (root causes):**
1. ~~**BUG martwy kod** — bonusy trudności~~ → **ZAMKNIĘTE** `P-AI-MOC-BONUS` FALA 226 `3840f218`
2. **DESIGN** — `canAfford` → pusta kolejka, surowce rosną (myszkowanie) — `P-AI-MOC-GAP` nadal otwarte
3. ~~**Brak** AI major→major absorpcji~~ → **ZAMKNIĘTE** `P-AI-MAJOR-ABSORB` FALA 240–241

**Kandydaty fix:** podpiąć martwe bonusy trudności; `bonusWalka` w combat; playtest po FALA 220.

---

## OTWARTE POST-FALA 220 (2026-08-04) — nie zamazane

### P-AI-MARTWE-BONUSY — martwe parametry trudności · STATUS: **ZAMKNIĘTE** (`P-AI-MOC-BONUS` FALA 226 `3840f218`)

`startoweJednostki`, `startoweMiasta`, `bonusWalka`, `bonusNauka` — podpięte w `ai-difficulty-bonus.ts` + `main.ts`.

### P-MP-SPAWN-WYZYWIENIE — MP spawn Wyżywienie ~3 · STATUS: **NAPRAWIONE** (`cursor/fix-mp-spawn-wyzywienie-63a1`)

Spawn MP: suwak Wyżywienie startował ~3 zamiast 4 — **root cause:** `foundCity*` bez `poziomRacji` → migrate(100)→6 → auto-racja obniżała. Fix: jawne `poziomRacji: DEFAULT_POZIOM_RACJI` (4) przy founding dla wszystkich ownerów.

### P-AI-PROD-GATE-PER-OWNER — `isProductionAllowed` per-owner difficulty · STATUS: **ZDEPLOYOWANE** (FALA 240 `d1450398` · Q1=A)

`effectiveGameDifficultyForOwner` w `isProductionAllowed` — `docs/decyzje/P-AI-PROD-GATE-PER-OWNER.md`

### P-AI-MAJOR-ABSORB — absorpcja AI major→major · STATUS: **ZDEPLOYOWANE** (FALA 240 Faza1 + FALA 241 Faza2 `178073f9`)

`ai-major-absorb.ts` · `docs/decyzje/P-AI-MAJOR-ABSORB.md`

### P-TEST-UPKEEP-R-STAWKI — upkeep-test 24× fail · STATUS: **ZAMKNIĘTE 2026-08-09** (już naprawione, wpis był nieaktualny)

`upkeep-test.cjs` 49/73 — 24 porażek przez ×2 koszty `R-STAWKI` / `R-NADMIAR-POOLS` (nie regres FALA 220).

**Diagnoza (subagent Sonnet 5, 2026-08-09):** ten wpis był nieaktualny od 2026-08-05 —
test już wtedy naprawiony commitem `12ecd09d` („test(upkeep): zaktualizuj asercje pod
R-STAWKI ×4 i FALA2 ×2", współautor Maciej), a wpis tutaj nigdy nie oznaczony ZAMKNIĘTE.
**Dziś (weryfikacja `node tools/upkeep-test.cjs` z `gra/`): `73 passed, 0 failed`, exit 0.**
Klasyfikacja: **opcja (b) test był przestarzały**, nie bug silnika — asercje testu
zakładały stawki sprzed `R-STAWKI`/`R-NADMIAR-POOLS`; silnik celowo mnoży ×2 utrzymanie
budynków (`R_STAWKI_FALA2_MULT`, `gra/src/game/r-stawki-strojenie.ts:9`, stosowane w
`economy-upkeep.ts:578`) i ×4 utrzymanie jednostek + żywność wojska
(`R_STAWKI_FALA1_FALA2_MULT = R_STAWKI_KOSZT_MULT × R_STAWKI_FALA2_MULT`,
`economy-upkeep.ts:884,979`) — decyzje Macieja z `r-stawki-strojenie.ts:1-4`. Test już
odzwierciedla te mnożniki. Żadna zmiana silnika nie była (i nie jest) potrzebna.
**C-026 (impact 22 testów ekonomii/utrzymania/kosztów, uruchomione z `gra/`):** wszystkie
zielone poza 4 **niezwiązanymi, pre-istniejącymi** (bez ×2/×4 R-STAWKI w komunikacie
błędu, zweryfikowane brakiem zmiany kodu w tej sesji): `upgrade-budynki-test.cjs`
(48 pass/1 fail — „no handel bonus on bruk"), `unit-stock-cost-test.cjs`
(53 pass/4 fail — już zarejestrowane osobno jako `P-UNIT-STOCK-COST-TEST-DLUG`),
`grupy-budynkow-test.cjs` (80 pass/3 fail — rozjazd liczby budynków JSON 41 vs test 40),
`budynek-civ-bonus-u17-test.cjs` (2 pass/4 fail — baza kamienia z mapy 5 vs oczekiwane 4),
`prereq-budynkow-test.cjs` (51 pass/8 fail — status `ready`/`locked` katalogu budynków).
`npx tsc --noEmit` (worktree z symlinkiem `node_modules`, `5.9.3` potwierdzone) — 0 błędów.
Bez zmian w `gra/src/**` ani `gra/data/**` w tej paczce — wyłącznie ten wpis (dokumentacja).

### MAP-UX-CLUSTER-LABEL — **ZASTĄPIONE** → paczka [`ABC-PACZKA-2026-08-06-KOLEJKA`](../docs/decyzje/ABC-PACZKA-2026-08-06-KOLEJKA.md) **[3/5]** (nie duplikować tutaj)

### Dyplo-UX (nadal otwarte)

- `HANDEL-SPLIT-Q1` — patrz sekcja własna (jeśli OTWARTE)

### Znaleziska AutoBot 2026-08-06/07 (do przyszłej rundy, nieblokujące)

- **UNIT-REPLACE-EVOCATI-Q1, N1 — ZAMKNIĘTE 2026-08-07**: budowa kontekstu wyekstrahowana do czystej funkcji `buildReplaceAvailabilityCtx` (`gra/src/game/unit-replace-context.ts`), `empireResourceStock` uczynione polem WYMAGANYM w `ReplaceAvailabilityCtxParams` (pominięcie go w main.ts = błąd `tsc`, nie cichy runtime bug); `main.ts` (`replaceAvailabilityCtxForCity`/`replaceAvailabilityCtxEmpireWide`) to teraz cienkie wrappery. Pokrycie: `unit-replace-test.cjs` sekcja 4 (roundtrip + end-to-end + kontrast bez stoku) — 13/13 PASS. Zweryfikowane mutation-testingiem (usunięcie pola z main.ts → realny błąd `tsc`).
- **MENNICA-GRACE-VERIFY-Q1, N3**: `main.ts:3354-3361` `placedImprovementsWithTradeGrants()` nadal woła deprecjonowany no-op dla złota (`placedImprovementsWithZlotoTradeGrant`), z 11 wołającymi (główne miejsca: 4403/4431/4995/5752/10308/15670/20794/21397/22158/23204). Bramka runtime Mennicy jest bezpieczna (osobna ścieżka `ownerHasZlotoAccessNow`), ale to potencjalny dług — asymetria brąz-vs-złoto w tej funkcji.
- **R-OBRONA-MIASTA-MP-Q1, runda 4 — ZAMKNIĘTE 2026-08-07**: `defenderCivBonusBreakdown` woła teraz pełną `bonusApplies()` (wyeksportowaną z `civ-bonuses.ts`, z `CivCombatContext{side:'defender', terrain, isChargeRound:false}`) zamiast samego `unitMatchesCel` — bonus lasu/wzgórza na terenie, gdzie realnie nie zadziała, jest teraz pomijany w panelu preBattle. `terrain` wstrzykiwany z main.ts (3 miejsca: atak gracza na mapie, atak AI/barbarzyńców, szturm oblężenia). Pokrycie: `defense-breakdown-test.cjs` sekcja G (fikcyjny bonus leśny, gating terenowy) — 44/44 PASS. Świadoma asymetria: panel zawsze zakłada `isChargeRound:false` (konserwatywnie, bo szarża jeszcze się nie odbyła przed bitwą).
- **R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1, notatka Evaluatora rundy 4 (N3) — ZAMKNIĘTE 2026-08-07**: mnożnik chęci handlu (`handelWillingnessMultiplier`) działa też dla par AI↔AI, bo `responderIsPlayer` jest fałszywe dla obu proponentów-AI. Sweep (1728 przypadków) potwierdził kierunek bezpieczny (tylko zaostrzenie, nigdy nowy exploit). Dodano pokrycie testowe: `diplomacy-proposal-test.cjs` — 3 bloki, 8 asercji AI(1)→AI(2) (niska chęć respondenta → odrzucenie z komunikatem „Niechęć"; wysoka chęć → mirror dokładny ulgi gracz→AI, identyczne progi; kontrola strukturalna podłogi parytetu — brak realnej luki, `proposerUnfairToPartnerGate` jest nieobecny dla `'handel'` niezależnie od tożsamości proponenta, `handelFairnessGate` jest proposer-identity-agnostyczny). 107/109 PASS (baseline 99/101 + 8 nowych, zero regresji — te same 2 pre-istniejące fails niezwiązane: „granice reject rel 90 zauf 50", „traktat handlowy bez koszyka @ niska Rel"). Mutation-tested przez Evaluatora (neutralizacja mnożnika / usunięcie podłogi parytetu → 5 z 8 nowych asercji ginie).

**Zamknięte (audyt R-PUŁKA 2026-08-05):** `D-DYPLO-KATALOG-AKCJI` · `D-DYPLO-CELOWNIK-STOLICA` · `D-DYPLO-AKCJE-SZARE` · `BUG-DYPLO-PANEL-OVERLAP` · `R-AI-MIASTA-BUDOWY` · paczka `R-PUŁKA-PYTANIA-29-07`
## P-MAPGEN-PANGEA-OBRYS (2026-08-07) — sekcja „Pangea nieregularna" czerwona; metryka mierzy zły obrys
> ### ⛔ KOREKTA 2026-08-07 — pierwotna wersja tego wpisu była BŁĘDNA w dwóch punktach
> **(1) „Nie liczy się do exit code" — NIEPRAWDA.** Blok porażki inkrementuje nie tylko
> `pangeaShapeFail`, ale też **wspólny licznik `fail`** (`map-gen-regression-test.cjs:214`),
> a `fail === 0` **jest** koniunktem `allOk` (linia 258). Przy 4 porażkach `fail = 4` →
> `allOk = false` → **`process.exit(1)`**. Bramka jest CZERWONA, nie zielona.
> Dodatkowo `stdOk`/`duzyOk` (progi czasowe: standard <7 s, duża <15 s) też są `false` na tej
> maszynie (zmierzone 130,01 s i 1194,15 s) — to znany, udokumentowany artefakt wolnego sprzętu,
> ale **niezależnie wymusza exit 1**.
> **(2) „Do rozstrzygnięcia: regresja czy zbyt ostry próg" — FAŁSZYWA ALTERNATYWA.**
> Metryka mierzy **nie ten obrys**: `TerenBazowy.Wybrzeze` jest **wodą**
> (`gra/src/types/hex.ts:17`, commit `bed3ea1` „wybrzeze jako woda"), ale `groupLandMassKeys`
> (`gra/src/map/gen-helpers.ts:1402`) wyklucza **wyłącznie** `Morze` — więc cały pierścień
> płytkiej wody wchodzi do `landCount` (2 042–2 162 heksów = 15,3–16,2 % rzekomego „lądu"),
> a mierzony obrys to zewnętrzna krawędź pierścienia wody, nie linia brzegowa lądu.
> **Przy poprawnej metryce (woda = Morze + Wybrzeże) `coastRatio` wynosi 5,29–5,89 — wszystkie
> 5 seedów przechodzi z zapasem.** Generator robi dokładnie to, czego chciała FALA 187.

**Skąd:** pełny przebieg `node tools/map-gen-regression-test.cjs` (2026-08-07). Sekcja
`=== Pangea nieregularna (FALA 187, 5 seedów standardowy) ===` raportuje `1 masa + nieregularny obrys:
FAIL (4 fail)`.
**Konkret (2 z 4 zapisanych seedów):**

| seed | masy | dom | bboxFill | coast/√A | który próg złamany |
|---|---:|---:|---:|---:|---|
| 777 | 1 | 1,000 | **0,853** | **3,778** | `coastRatio > 3,8` — jest 3,778 |
| 2026 | 1 | 1,000 | **0,851** | **3,780** | `coastRatio > 3,8` — jest 3,780 |

Progi w teście (linia 210-211): `massCount === 1 && dominantRatio >= 0,97 && bboxFill < 0,87 &&
coastRatio > 3,8`. Oba seedy spełniają trzy pierwsze warunki i przegrywają na czwartym o
**0,020–0,022 jednostki** (coast/√A). Czyli obrys pangei jest **odrobinę zbyt gładki** wobec progu.
**Do rozstrzygnięcia:** czy to regresja generatora po `C-MAPA-Q1=B` (`41eed4d`, `807b177`,
2026-08-06 — jedyne dzisiejsze zmiany w `gra/src/map/**`), czy próg 3,8 był od początku zbyt ostry.
Brak porównywalnego baseline: wcześniejsze przebiegi z 2026-08-06 nie doszły do tej sekcji.
**Merytorycznie nie blokuje deployu** — kryteria wg `CLAUDE.md` to „determinizm A=B + 0 rzek bez
ujścia": determinizm **PASS** (hash A=`85ec40a7` B=`85ec40a7`, IDENTYCZNY), trasy **2124/2124**,
główne rzeki **1235/1235**. Ale **formalnie bramka zwraca exit 1** — patrz korekta wyżej.

---

## BUG-TRAKTAT-KOSZYK-REGRESJA (2026-08-07, playtest Macieja) · STATUS: **ZDECYDOWANE — A (2026-08-08) — w realizacji** (`dyspozycje/REJESTR-PROSB-I-ZADAN.md`)
**Jego słowa:** *„Pamiętam, że zgodnie z zasadami w traktatach handlowych miały nie być wymiany
surowców, tylko temat dotyczący akurat tego traktatu. A jak widać, znowu to nie jest rozłączone."*
**Obowiązująca decyzja:** `HANDEL-SPLIT-Q1 = B`, `docs/decyzje/HANDEL-SPLIT-Q1.md:18` — *„dwa osobne
kafle na stole (akcja 5 = traktat szlaków BEZ KOSZYKA; akcja 14 = umowa wymiany z koszykiem).
Klik traktatu szlaków NIE otwiera koszyka wymiany."* Zdeployowane FALA 80 (`7d266143`),
typy `umowa_szlakow` / `umowa_wymiany` w `diplomacy.ts` / `diplomacy-proposals.ts`.
**Stan faktyczny na zrzucie (bundle `e028045c`, FALA 259):** okno „Traktat handlowy" (partner:
Sparta · Grecy · miasto-państwo) zawiera prawą kolumnę **„Opcjonalnie — dołóż wymianę PW
(nie jest wymagana do zaproponowania traktatu)"** z pełnym koszykiem: tryb wymiany
Jednorazowo / Co turę, oraz kafle **Pieniądze · Praca · Żywność · Technologia · Surowiec**
po obu stronach (MY ODDAJEMY / ONI ODDAJĄ), z ilością i „+ DODAJ PROPOZYCJĘ".
**Do ustalenia w diagnozie:** czy okno na zrzucie to `umowa_szlakow` (wtedy koszyk nie ma prawa
się pokazać) czy `umowa_wymiany` z mylącym tytułem „Traktat handlowy" (wtedy błędem jest
nazewnictwo/etykieta, nie logika). Kotwice: `gra/src/game/diplomacy-proposals.ts`,
`gra/src/ui/**` (okno traktatu), `gra/tools/diplomacy-proposal-test.cjs`.
**Uwaga:** `diplomacy-proposal-test.cjs` ma dziś 2 pre-istniejące porażki, jedna nazwana
„traktat handlowy bez koszyka @ niska Rel" — możliwe, że bramka już to łapie i została uznana
za szum.

## BUG-ETYKIETA-MIASTA-ROZMYTA (2026-08-07, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa (2026-08-07):** *„na przybliżeniu miasta grafika jest okropna."*
**Jego słowa (2026-08-08, powtórka zgłoszenia z nowym zrzutem „NODWENGU"):** „kolejny temat,
który nie stał rozwiązany... coś z tym robiłeś, ale jak zwykle temat w ogóle nie został
popchnięty do przodu."
⛔ **Sprawdzone uczciwie w historii gita:** to prawda — **żaden commit nigdy nie dotknął tego
tematu**. Jedyne dwa wcześniejsze wystąpienia w repo to same wpisy dokumentacyjne (rejestracja
+ audyt), zero pracy w kodzie. Zgłoszenie leżało nietknięte od 2026-08-07.

**Przyczyna znaleziona teraz** (`gra/src/render/cityMapStatChip.ts:563-571`,
`paintCityMapBadgeOntoCanvas`/`makeCityMapBadgeSprite`): hipoteza z pierwotnego zgłoszenia
się potwierdza. `canvas.width`/`canvas.height` liczone są **wyłącznie z treści** (szerokość
tekstu nazwy + sloty ikon, w surowych pikselach CSS, np. `nameFont = '700 22px ...'`) — **bez
żadnego odniesienia do `devicePixelRatio` ani do poziomu zoomu kamery** (sprawdzone grepem:
`devicePixelRatio` — zero trafień w całym pliku). Ten canvas trafia do `THREE.CanvasTexture`
i jest rysowany jako `THREE.Sprite` w przestrzeni 3D. Gdy kamera zbliża się do miasta, sprite
zajmuje więcej pikseli ekranu niż canvas ma natywnej rozdzielczości → **klasyczne rozciąganie
tekstury (texture magnification)**, stąd rozmycie tekstu i medalionu.
**Naprawa (niewdrożona, do zrobienia):** renderować canvas w rozdzielczości pomnożonej przez
`window.devicePixelRatio` (i/lub przez współczynnik zależny od aktualnego zoomu), skalując
z powrotem przez `tex.image.style`/rozmiar sprite'a — standardowy wzorzec „retina canvas" dla
tekstur Three.js. Analogicznie sprawdzić inne plakietki w tym samym pliku (produkcja, portret
władcy) — ten sam mechanizm rysowania, to samo ryzyko rozmycia.
**Kotwice:** `gra/src/render/cityMapStatChip.ts` (`paintCityMapBadgeOntoCanvas`,
`makeCityMapBadgeSprite`).
**Model:** praca w `gra/src/render/**` = **Opus 5** (zgoda stała Macieja, CLAUDE.md §4).

## BUG-IKONA-KULTURY-PLACEHOLDER (2026-08-07, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa:** *„na państwach, miastach są dziwne kwadraty obrócone, a jak się najedzie
przyciskiem, to pojawia się dopiero grafika danej kultury."*
**Objaw:** w kółku po lewej stronie plakietki miasta domyślnie widnieje **obrócony kwadrat
(romb/diament)** — placeholder. Właściwa ikona kultury pojawia się **dopiero po najechaniu
kursorem**. Zrzuty: „TEBY · MIASTO…" — przed najechaniem romb, po najechaniu ikona budowli
klasycznej. Dotyczy państw i miast.
**Hipoteza do sprawdzenia (nie potwierdzona):** ~~ikona kultury ładowana leniwie i podmieniana
dopiero na zdarzeniu hover, zamiast przy tworzeniu plakietki; albo brak fallbacku na czas
ładowania i romb jest kształtem domyślnym.~~
⛔ **PRZYCZYNA POTWIERDZONA W KODZIE (2026-08-08, audyt zgłoszeń):**
`gra/src/render/cityMapStatChip.ts`, funkcja `requestCivSigilImage()` (~linia 353-373):
gdy druga (i każda kolejna) plakietka tej samej cywilizacji prosi o sygnet, podczas gdy
PIERWSZA wciąż go ładuje asynchronicznie, funkcja robi `if (cached === 'loading') return;`
— **porzuca `onReady` bez kolejkowania**. Ta plakietka nigdy nie dostaje callbacku z gotowym
obrazkiem. Tekstura Three.js jest tworzona TYLKO RAZ na unikalny klucz (`if (!tex)`,
~linia 744, `makeCityMapBadgeSprite`) — więc przegrana plakietka zostaje z rombem trwale,
żadnego ponowienia. **Hover naprawia to przypadkiem:** `hoverExpanded` wchodzi do klucza
cache tekstury (`cityMapBadgeKey`, ~linia 714: `` `h${a.hoverExpanded ? 1 : 0}` ``) — hover
tworzy więc CAŁKOWICIE NOWĄ teksturę, która trafia na już wypełniony globalny cache obrazu
(`civSigilImageById`) i rysuje ikonę od razu, synchronicznie.
**Naprawa (niewdrożona, do zrobienia):** `requestCivSigilImage` powinien kolejkować wiele
`onReady` per klucz podczas stanu `'loading'` (np. `Map<string, Array<(img)=>void>>`) i
wywołać wszystkie po dociągnięciu obrazu — ten sam wzorzec do sprawdzenia w
`requestLeaderPortraitImage`/`requestProdIconImage` (analogiczny cache `'loading'`,
niesprawdzony, prawdopodobnie ta sama luka).
**Kotwice:** `gra/src/render/cityMapStatChip.ts` (plakietka miasta, ikony kultur).
**Model:** praca w `gra/src/render/**` = **Opus 5** (zgoda stała Macieja, CLAUDE.md §4).

## BUG-ZWIADOWCA-KOSZT-SUROWCA (2026-08-07, playtest Macieja) · STATUS: **ZDECYDOWANE — A (2026-08-08) — w realizacji** (`dyspozycje/REJESTR-PROSB-I-ZADAN.md`)
**Jego słowa:** *„jednostka zwiadowcy nie miała wymagać żadnych surowców ani nie miała
spożytkowywać podczas… nie powinno być żadnym kosztem ani jedzenia ani surowców — silny błąd
do naprawy."*
**Stan faktyczny — `gra/data/units.json`, wiersz „Zwiadowca" (Epoka: Kamień, Kultura: brak):**
| Parametr | Wartość | Zgodność |
|---|---|---|
| `Surowiec` | **Drewno** | ⛔ NIEZGODNE — ma nie wymagać surowca |
| `Surowiec (ilość)` | **10 szt.** | ⛔ NIEZGODNE |
| `Pieniądz (koszt)` | 8 pkt Pieniądza | ❓ do rozstrzygnięcia — właściciel wymienił żywność i surowce, NIE Pieniądz |
| `Utrzymanie (Pieniądz/turę)` | 0 pkt/turę | ✅ zgodne |
| `żywność/turę` | 0 pkt/turę | ✅ zgodne |
**⛔ KOREKTA 2026-08-07 (właściciel obalił moje pierwsze ustalenie).** Napisałem mu, że
„utrzymanie Zwiadowcy jest już zerowe" — **NIEPRAWDA**. Sprawdziłem tylko kolumny
`Utrzymanie (Pieniądz/turę)` i `żywność/turę` (obie 0) i pominąłem **dwie kolumny utrzymania
surowcowego**, bo wypisałem sztywną listę kolumn zamiast wszystkich. Jego słowa:
*„jak nie jest wprowadzone, jak musiałem wydać 10 sztuk drewna na rekrutację zwiadowcy"*,
potwierdzone zrzutem panelu REKRUTACJA: „Zwiadowca · 32 Pieniądz · **10 Drewno** · **−2 Drewno/t**".
**PEŁNY stan faktyczny — `gra/data/units.json`, wiersz „Zwiadowca":**
| Parametr | Wartość | Zgodność z zasadą |
|---|---|---|
| `Surowiec` / `Surowiec (ilość)` | Drewno / **10 szt.** (koszt rekrutacji) | ⛔ NIEZGODNE |
| `Utrzymanie surowiec` / `Utrzymanie surowiec (ilość)` | Drewno / **2 szt. na turę** | ⛔ NIEZGODNE — POMINIĘTE w pierwszym sprawdzeniu |
| `Utrzymanie (Pieniądz/turę)` | 0 pkt/turę | ✅ zgodne |
| `żywność/turę` | 0 pkt/turę | ✅ zgodne |
| `Pieniądz (koszt)` | 8 pkt (w panelu 32 po przeskalowaniu tempem/trudnością) | ❓ właściciel nie wymienił Pieniądza |
**Realny zakres naprawy:** wyzerować **oba** kanały surowcowe — `Surowiec (ilość)` 10 → 0
ORAZ `Utrzymanie surowiec (ilość)` 2 → 0. Zgłoszenie właściciela obejmowało oba
(*„nie miała wymagać żadnych surowców ANI nie miała spożytkowywać"*).
**DO DECYZJI (ABC):** czy zerujemy same surowce (oba kanały), czy również koszt Pieniądza
(8 pkt → 0), czyli Zwiadowca całkowicie darmowy poza kosztem Ludności = 1.
**LEKCJA (do playbooka):** przy audycie rekordu danych wypisuj **WSZYSTKIE** pola, nigdy sztywną
listę kolumn dobraną z góry — pominięcie kolumny wygląda w raporcie identycznie jak jej zerowa
wartość. Ten błąd trafił do właściciela jako fakt.
**Uwaga na kierunek zmiany:** źródłem prawdy są JSON-y w `gra/data/` (CLAUDE.md §2); panel Excel
dogania JSON przez `gen-panel-*.py`, NIGDY odwrotnie.

## R-ETYKIETA-MIASTA-WZROST-PROCENT (2026-08-07, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest
**Jego słowa:** *„tam jeszcze chciałem procentowy wzrost czyli na przykład 5 i pół procent
o ile wyrośnie populacja a nie W5 bez litery W. na przykład 5 i pół procent albo 5 procent."*
**Stan faktyczny:** plakietka miasta pokazuje **„ATENY · W5 · 1"** — segment `W5` to skrót,
nie procent. Właściciel chce w tym miejscu **tempo wzrostu populacji wyrażone w procentach**,
z częścią ułamkową, np. **5,5 %** albo **5 %**.
**Do ustalenia w diagnozie:** co dziś oznacza `W5` (numer poziomu wzrostu? tura do przyrostu?
wielkość?) i skąd wziąć wartość procentową — czy silnik liczy już przyrost populacji na turę
jako ułamek, czy trzeba go wyprowadzić z bufora żywności i progu wzrostu.
**Do decyzji (ABC):** dokładność zapisu (`5 %` vs `5,5 %` vs `5,5%`), oraz co się dzieje przy
wzroście zerowym lub ujemnym (głód) — czy pokazujemy `0 %`, znak minus, czy inny wskaźnik.
**Kotwice:** plakietka miasta w `gra/src/render/**` / `gra/src/ui/**`; wzrost populacji
w `gra/src/game/turn-economy.ts`.
**Model:** jeśli zmiana dotknie `gra/src/render/**` — **Opus 5** (zgoda stała, CLAUDE.md §4).

**PRÓBA NAPRAWY WYCOFANA (2026-08-08):** pierwsza próba użyła tylko 1 z 6 składników wzoru
wzrostu (`racje` zamiast `computeGrowthPercentV85().total` — panel miasta pokazuje sumę 6
składników: racje+małe miasto+spichlerz+zdrowie+szczęście+cywilizacja), co dałoby na
plakietce INNĄ liczbę niż w panelu tego samego miasta. Operator poprawnie **wycofał** tę
próbę zamiast wysłać złą liczbę. **Prawdziwa przeszkoda (potwierdzona w kodzie):** wartość
z panelu to migawka z KOŃCA tury (`_setLastEmpireFoodTicks`, jedyne wywołanie wewnątrz
`advanceEmpireFood`, jedyne wywołanie na końcu tury) — rozjedzie się z panelem, jeśli gracz
zmieni racje/przydział robotników w trakcie tury. Realna naprawa wymaga albo (a) przeliczenia
na żywo w miejscu renderu plakietki (wymaga dociągnięcia `zdrowie`/`szczęście`/`spichlerz`/
`civKey` do `CityRenderOptions`, dziś ich tam nie ma), albo (b) świadomej decyzji, że
plakietka może pokazywać migawkę z opóźnieniem — do rozstrzygnięcia, nie kodować na ślepo.
**Do decyzji (ABC) pozostaje aktualne**: format zapisu + zachowanie przy głodzie/wzroście
ujemnym, PLUS teraz też: migawka czy przeliczenie na żywo.

**NAPRAWIONE (2026-08-09, subagent Sonnet 5, wariant (a) — przeliczenie na żywo).** Nowy
eksport `cityGrowthLive(city, map)` w `gra/src/ui/cityPanel.ts` woła TEN SAM `computeView()`,
z którego żyje wiersz „WZROST%" w panelu miasta — plakietka i panel pokazują matematycznie tę
samą liczbę (sumę 6 składników), żadnej drugiej reimplementacji wzoru. Przewód:
`CityRenderOptions.getCityGrowth?: (city) => {procentNaTure, nakarmione} | null` (typ
STRUKTURALNY, `render/` nadal nie importuje `ui/`), `_buildBadgeInput` pyta tylko o miasta
gracza, etykieta wchodzi do `cityMapBadgeKey` (zmiana wartości przerysowuje teksturę, stara
NIE jest reużywana). Boot-order guard: `cityGrowthLive` zwraca `null` przy nieskonfigurowanym
panelu zamiast liczyć z zaślepek.

**Format (zgodny z istniejącą konwencją kodu, nie arbitralny wybór — patrz uzasadnienie
Evaluatora niżej):** całkowita `5%`, ułamkowa `5,5%` (przecinek, 1 miejsce), zero `0%`, ujemna
`−2,1%` (U+2212, nie ukrywamy kurczenia), głód (nienakarmione) `—` (parytet z panelem).
`-0` nie powstaje (warunek `< 0` fałszywy dla `-0`).

Evaluator (Opus 5) **PASS-WITH-NOTES**, dowód mutacyjny (3 warianty, w tym mutacja usuwająca
WZROST% z klucza cache — 30/38 fail, złapane end-to-end łącznie z nieaktualizowaniem tekstury).
Bramki zmierzone niezależnie: `tsc` czyste, `city-badge-growth-percent-test` (nowy) 38/38,
`city-map-badge-test` 62/62 (baza 49 + tę naprawę), `logic-test` 213/213 — wszystkie
potwierdzone ponownie w drzewie głównym po scaleniu, identyczne liczby.

**Format NIE wymaga osobnego pytania ABC** (Evaluator, uzasadnienie): rdzeń liczbowy to znak
po znaku ten sam wzorzec co już istniejący w kodzie `formatWyzwienieLabel`
(`population-growth-v85.ts:133-136`) ORAZ niezależnie `formatLiczbaPl` (`ui/formatPl.ts`) —
dwa niezależne precedensy w repo, nie arbitralny wybór Operatora. „—" przy głodzie to parytet
z panelem, nie decyzja. U+2212 ma 64 precedensy w `src/`. Treść żądania Macieja („procent, nie
W5", „5 i pół procent albo 5 procent") jest pokryta obiema formami z jego zdania.

**Cztery noty Evaluatora, żadna nie blokuje:**
1. `cityGrowthLive` (15-liniowa delegacja) nie ma własnego testu jednostkowego — dziś poprawna
   (zweryfikowane czytaniem), ale przyszła regresja (np. zamiana na `rationGrowthPercent`) nie
   zostałaby złapana. Sugestia na przyszłość, niepilne.
2. **Rozjazd separatora, poza zakresem tej naprawy — zarejestrowany osobno:**
   `P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD` (panel „5.5%" kropka, plakietka „5,5%" przecinek).
3. Cztery czerwone testy wzrostu ludności (`population-growth-v85-test` 45/2,
   `population-growth-v85-bonus-test` 18/2, `population-growth-tempo-test` FAIL,
   `growthmult-compound-test` 17/7) potwierdzone **identyczne w worktree na commicie-rodzicu
   sprzed tej zmiany** — nie regresja tej naprawy. Przyczyna: dług testowy po świadomych
   decyzjach balansowych R-STAWKI (×2/×4, 2026-08-03) — `got` = dokładnie 2× `want` w
   komunikatach błędów. Zapis w CLAUDE.md („`growthmult-compound` zielony 24/24") jest
   nieaktualny — do sprostowania przy najbliższej aktualizacji CLAUDE.md, niepilne, nie tu.
4. `formatCityGrowthPercentLabel` duplikuje `formatLiczbaPl` (ta sama logika, jedyna różnica:
   znak minusa U+2212 vs ASCII `-`) — duplikacja wymuszona architektonicznie (`render/` nie
   importuje `ui/`). Rejestrowane jako dług do ewentualnego przyszłego refaktoru wspólnej
   warstwy formaterów, niepilne, nie tu.
**Kotwice:** `gra/src/ui/cityPanel.ts` (`cityGrowthLive`), `gra/src/render/cityMapStatChip.ts`
(`formatCityGrowthPercentLabel`), `gra/src/render/cities.ts` (`getCityGrowth`).

## P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD (2026-08-09, nota Evaluatora R-ETYKIETA-MIASTA-WZROST-PROCENT) · STATUS: **NAPRAWIONE 2026-08-09 (jeden wiersz) — czeka na deploy+playtest**
Panel miasta renderował surowo `${view.wzrostProcent}%` → „5.5%" (kropka, notacja JS), plakietka
mapy → „5,5%" (przecinek, konwencja polska projektu — `formatLiczbaPl`, `formatWyzwienieLabel`).
Ta sama liczba, inny separator w dwóch miejscach UI tego samego miasta.

**NAPRAWIONE (2026-08-09, subagent Sonnet 5, jeden wiersz):** chip „WZROST%" w
`renderMagazyn` (`gra/src/ui/cityPanel.ts`, sekcja „Wyżywienie i wzrost", zawsze widoczna, nie
hover — funkcjonalny odpowiednik plakietki) woła teraz `formatLiczbaPl(view.wzrostProcent)`
zamiast surowego szablonu. Evaluator PASS-WITH-NOTES: potwierdził że to WŁAŚCIWY wiersz
(prześledził przepływ liczby od `cities.ts`/`cityPanel.ts` `computeView` do plakietki — ten sam
`fed`, ta sama liczba źródłowa), dowód mutacyjny (cofnięcie → 20/22, obie asercje lokalizacji
padają). `city-panel-growth-percent-separator-test.cjs` (nowy) 22/22, `city-badge-growth-percent-test.cjs`
38/38 (bez zmian — plakietka nietknięta), `city-map-badge-test.cjs` 62/62, `logic-test.cjs`
213/213, `tsc` 0 błędów.

**C-026 potwierdzone przez Evaluatora mocniej niż deklarował Operator:** 9 wystąpień
`wzrostProcent` w `cityPanel.ts` = 1 naprawione + 8 pozostawionych (detail-cardy na żądanie,
tooltip); jedno z ośmiu (`renderCityHeaderCompact`, linia ~9128) to **martwy kod bez żadnego
call-site w całym repo**. Naprawiony chip jest naprawdę jedynym zawsze widocznym wystąpieniem —
zawężenie zakresu jest w pełni uzasadnione, nie arbitralne.

**Znak minusa (świadomie NIE naprawiony, decyzja Operatora potwierdzona przez Evaluatora z
głębszym uzasadnieniem):** panel ma teraz „5,5%" (przecinek, jak plakietka) ALE „-2,1%" (zwykły
minus) vs plakietka „−2,1%" (U+2212). Operator uzasadnił to jako poza zakresem zlecenia (tylko
separator). Evaluator poszedł głębiej i znalazł PRAWDZIWY powód nie ruszać tego teraz: panel
JUŻ DZIŚ miesza glify minusa między chipami tej samej tabeli (Racje: zahardkodowane U+2212,
Bilans: ASCII przez `signed()`/`signedPl`) — a `signedPl` w `formatPl.ts` ma sprzeczność
dokumentacji z implementacją (docstring obiecuje U+2212, kod zwraca ASCII). Podmiana glifu w
samym chipie WZROST% zamieniłaby jeden rozjazd na inny. Właściwa naprawa jest w `formatPl.ts`,
nie w tym chipie — zarejestrowana osobno.

**Cztery nowe niepilne noty Evaluatora, zarejestrowane osobno:** `P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL`
(sprzeczność `signedPl` docstring vs implementacja + niespójność Racje/Bilans w tej samej
tabeli), `P-ETYKIETA-WZROST-ZAOKRAGLENIE-ROZJAZD` (200 rozbieżnych wartości przy kroku 0,01 —
dziś nieosiągalne, bo krok realny to 0,5), `P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY` (jedna
karta miesza `signed()` dla składników z surowym szablonem dla sumy), `P-BRAMKA-SPICHLERZ-WIDOCZNOSC-CZERWONA`
(pre-istniejący czerwony test, 13 pass/14 fail, niezwiązany, nie był na liście znanych
czerwonych w CLAUDE.md).
**Kotwice:** `gra/src/ui/cityPanel.ts` (wiersz „WZROST%", `renderMagazyn`).
**Model:** Sonnet 5.

## P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL — ZAMKNIĘTE 2026-08-09
`signedPl` (`gra/src/ui/formatPl.ts`) miał sprzeczność docstring vs implementacja: dokumentacja
obiecywała znak U+2212 („−3,5"), implementacja zwracała ASCII `-` (`0x2D`). Panel miasta mieszał
glify w TEJ SAMEJ tabeli chipów: chip „Racje" ma zahardkodowany U+2212, chip „Bilans" (przez
`signed()`→`signedPl`) miał ASCII.

**Naprawa:** `signedPl` post-processuje ASCII minus na U+2212 po wywołaniu `formatLiczbaPl`
(która sama zostaje nietknięta — ma własny, osobny test asercjonujący ASCII z wcześniejszej,
niezwiązanej naprawy). Nowy test `gra/tools/format-pl-signed-minus-glif-test.cjs` (13/13) +
2 zaktualizowane asercje w `empire-skarbiec-bilans-test.cjs` (11/11).

Evaluator (Opus 5) **PASS-WITH-NOTES**: domknięcie tranzytywne importów (29 modułów, 10 wołających
`signedPl`, 5 testów bundlujących) policzone niezależnie — Operator wymienił tylko 2 bezpośrednich
wołających, ale wynik i tak poprawny (żaden pominięty test nie asercjonuje tekstu). Parytet
„Racje"/„Bilans" potwierdzony na realnym kodzie (oba U+2212). Zero konsumentów parsujących ASCII
myślnik na wyjściu `signedPl` (sprawdzone grepem repo-wide). Kontrfaktyczne dowody symetryczne
(nowy test × stary kod = 2 fail; stary test × nowy kod = te same 2 fail).
Zmierzone: `format-pl-signed-minus-glif-test.cjs` 13/13, `empire-skarbiec-bilans-test.cjs` 11/11,
`city-panel-growth-percent-separator-test.cjs` 22/22, `logic-test.cjs` 213/213, `tsc --noEmit` 0
błędów.

**Dwie nowe noty Evaluatora, zarejestrowane osobno:** `P-BRAMKA-MAP-FIELD-BATTLE-PRE-BATTLE-SAVE-CZERWONE`,
`P-ETYKIETA-PODWOJNY-ZNAK-PRACA-BUDYNKI`.
**Kotwice:** `gra/src/ui/formatPl.ts` (`signedPl`).
**Model:** Sonnet 5 (Operator) + Opus 5 (Evaluator).

## P-BRAMKA-MAP-FIELD-BATTLE-PRE-BATTLE-SAVE-CZERWONE (2026-08-09, nota Evaluatora P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL) · STATUS: **OTWARTE — niepilne, pre-istniejące**
`map-field-battle-test.cjs` (`TypeError: import_meta.glob is not a function` — konstrukcja Vite
w bundlu esbuild/CJS, moduł audio `.mp3`) i `pre-battle-save-test.cjs` (`No loader configured for
".svg" files` — `src/ui/icons/brand/menu-emblem.svg?raw`) padają identycznie z fixem i bez niego
(zweryfikowane na baseline przed zmianą `signedPl`) — awarie harnessu testowego (brak loaderów
w skrypcie budującym bundle testu), nie regresja silnika. CLAUDE.md nie wymienia ich w liście
znanych czerwonych bramek — bez tego wpisu następna sesja mogłaby je wziąć za świeżą regresję.
**Kotwice:** `gra/tools/map-field-battle-test.cjs`, `gra/tools/pre-battle-save-test.cjs`.
**Model:** Sonnet 5.

## P-ETYKIETA-PODWOJNY-ZNAK-PRACA-BUDYNKI (2026-08-09, nota Evaluatora P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL) · STATUS: **OTWARTE — niepilne**
`cityPanel.ts:4394` i `:4418` renderują `` `+${signed(praca.doBudynkow)}` `` — dla wartości ujemnych
daje podwójny znak (`"+−5"`, przed naprawą glifu `"+-5"`). Pre-istniejące, nie regresja tej naprawy
(oba warianty były błędne) — ale naprawa glifu uczyniła anomalię bardziej widoczną (`+−` rzuca się
w oczy bardziej niż `+-`). Naprawa: usunąć zbędny `+` przed `signed()` (który już dodaje własny
znak) albo zmienić szablon na samo `signed(...)`.
**Kotwice:** `gra/src/ui/cityPanel.ts:4394,4418`.
**Model:** Sonnet 5.

## P-ETYKIETA-WZROST-ZAOKRAGLENIE-ROZJAZD — ZAMKNIĘTE 2026-08-09 (decyzja B: test/dokumentacja, nie zmiana silnika)
Panel zaokrągla przez `Number(x.toFixed(1))`, plakietka przez `Math.round(x*10)/10` — rozbieżne
przy krokach generujących nieparzyste wielokrotności 0,05 (np. `0.15` → panel „0,1%", plakietka
„0,2%"). Dziś nieosiągalne — krok realny wzoru wzrostu to 0,5.

**Decyzja B (Operator, uzasadniona liczbami, nie tylko oceną):** nie zmieniać kodu produkcyjnego
— przypiąć osiągalność testem + niezmiennikiem w komentarzu. Wyczerpująca enumeracja wszystkich
6 składników `computeGrowthPercentV85` (52 140 543 kombinacji) i parytet cyfr panel↔plakietka na
wielokrotnościach 0,5 w [−100000, 100000] (400 001 wartości) — **0 rozjazdów w obu przypadkach**.
Zmiana kodu produkcyjnego dziś dałaby zero zmian w wyświetlanym tekście przy niezerowym ryzyku
regresji.

Nowy test `gra/tools/city-growth-percent-rounding-parity-test.cjs` (16/16): pin `WYZYWIENIE_STEP
=== 0,5`, parytet na 801 wartościach w realnym zakresie, kanarek dowodzący siły wykrywczej sekcji
[2] (mutacja kroku na 0,25/0,01/0,1 — 2 z 3 łapane, patrz noty). Komentarz-niezmiennik dodany przy
`WYZYWIENIE_STEP` w `population-growth-v85.ts`.

Evaluator (Opus 5) **PASS-WITH-NOTES z blokującą korektą domkniętą przy scaleniu**: dowód
matematyczny potwierdzony niezależnie i mocniejszy (wyczerpująca enumeracja, nie próbkowanie).
Kanarek zweryfikowany mutacyjnie na źródle produkcyjnym (nie tylko symulacją) — sekcja [2] ma
realną siłę wykrywczą (kroki 0,25/0,01 łapane, exit 1). **Komentarz-niezmiennik zawierał
nieprawdziwe zdania** („identyczny wynik TYLKO dla wielokrotności 0,5" — fałsz, krok 0,1 i 0,2
też dają 0 rozjazdów; przykład „0,1" jako rozjazdogenny — błędny, 0,1 nigdy nie rozjeżdża się).
Prawdziwa reguła: rozjazd wymaga NIEPARZYSTEJ wielokrotności 0,05 (0,25/0,05/0,01 tak, 0,1/0,2/0,5
nigdy). **Poprawione przy scaleniu** — komentarz przy `WYZYWIENIE_STEP` przeformułowany zgodnie z
dokładną regułą Evaluatora. Kierunek błędu był zachowawczy (ostrzegał za dużo, nie za mało), test
i commit message nie powielały nieprawdy.
Zmierzone: `city-growth-percent-rounding-parity-test.cjs` 16/16, `city-badge-growth-percent-test.cjs`
38/38, `city-panel-growth-percent-separator-test.cjs` 29/29, `logic-test.cjs` 213/213, `tsc
--noEmit` 0 błędów.
**Kotwice:** `gra/src/game/population-growth-v85.ts` (`WYZYWIENIE_STEP`), `gra/src/ui/cityPanel.ts`,
`gra/src/render/cityMapStatChip.ts` (`formatCityGrowthPercentLabel`).
**Model:** Sonnet 5 (Operator) + Opus 5 (Evaluator) + korekta orkiestratora przy scaleniu.

## P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY — ZAMKNIĘTE 2026-08-09
Karta „Wyżywienie i wzrost — szczegóły" (`buildRacjeWzrostDetailCard`), sekcja „WZROST% —
składniki": 6 składników renderowanych przez `signed()` (przecinek polski), wiersz „Łącznie"
(suma tych samych składników) surowym szablonem `${view.wzrostProcent}%` (kropka JS) — mieszane
separatory w jednej karcie.

**Naprawa:** wiersz sumy też przez `signed()`. C-026: sąsiad „Budynki wpływające na wzrost"
(`bd.spichlerz`) sprawdzony i wykluczony — `spichlerzGrowthBonusPercent()` to trzy literalne
`return 2/1/0`, nieujemność gwarantowana konstrukcją, nie danymi. Rozszerzony
`city-panel-growth-percent-separator-test.cjs` (22→29 asercji).

Evaluator (Opus 5) **PASS-WITH-NOTES z blokującą korektą domkniętą przed scaleniem**: sekcja [6]
testu asercjonowała ASCII myślnik dla ujemnej sumy — po scaleniu równoległej naprawy
`P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL` (`signedPl` → U+2212) ta asercja padłaby po cichu przy
scaleniu obu (różne pliki, git scala bez konfliktu tekstowego). **Poprawione przy scaleniu**:
asercja zmieniona na `'−2,1'` (U+2212), zweryfikowane po fakcie na zmergowanym `signedPl` —
29/29 zielone. Fix produkcyjny sam w sobie zweryfikowany jako nietrywialny (`WYZYWIENIE_GROWTH_PCT`
zawiera wartości ułamkowe, stary szablon realnie renderował kropkę).
Zmierzone (po scaleniu obu zależnych napraw): `city-panel-growth-percent-separator-test.cjs`
29/29, `logic-test.cjs` 213/213, `tsc --noEmit` 0 błędów.

**Nowa nota Evaluatora, zarejestrowana osobno:** `P-ETYKIETA-KARTA-ZYWNOSC-4800-MIESZANE-SEPARATORY`
— analogiczna usterka w sąsiedniej, żywej karcie (`buildTopBarZywnoscDetailCard`).
**Kotwice:** `gra/src/ui/cityPanel.ts` (`buildRacjeWzrostDetailCard`, linia ~4750/4753).
**Model:** Sonnet 5 (Operator) + Opus 5 (Evaluator) + korekta orkiestratora przy scaleniu.

## P-ETYKIETA-KARTA-ZYWNOSC-4800-MIESZANE-SEPARATORY (2026-08-09, nota Evaluatora P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY) · STATUS: **OTWARTE — niepilne**
`buildTopBarZywnoscDetailCard` (linia ~4800, kod żywy — wołany przez `attachTopBarStat('zywnosc')`)
ma dokładnie tę samą usterkę: linia ~4839 renderuje `${view.wzrostProcent}%` surowo, obok
`signed(foodSplit.total)` (linia ~4830) w TEJ SAMEJ karcie. Dodatkowo linia ~4841 renderuje
`racje ${bd.racje}%` surowo (`bd.racje` bywa ułamkowe). Formalnie mieści się w 7 pozycjach
świadomie odłożonych przy naprawie `P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD`, ale to najbliższy
analogiczny przypadek do `P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY` — pominięty przy enumeracji
C-026 tamtego zgłoszenia.
**Kotwice:** `gra/src/ui/cityPanel.ts` (`buildTopBarZywnoscDetailCard`, linie ~4839, ~4841).
**Model:** Sonnet 5.

## P-BRAMKA-SPICHLERZ-WIDOCZNOSC-CZERWONA — ZAMKNIĘTE 2026-08-09 (test przestarzały, silnik poprawny — NIE dopisywać do listy czerwonych bramek CLAUDE.md)
`spichlerz-widocznosc-test.cjs` — 13 pass / 14 fail. Diagnoza Operatora: test NIE odzwierciedlał
dwóch późniejszych decyzji produktowych — `DOSTEP-SUROWCE-Q1` (2026-07-29, bramka etykiety
złoża wymaga `empireStock[klucz] > 0`, nie samej technologii) i `R-STAWKI`/`R-NADMIAR-POOLS` FALA2
(`R_STAWKI_FALA2_MULT = 2`, mnożnik kosztów surowcowych budynków). Silnik jest poprawny, test był
z tyłu za dwiema zmianami danych.

**Naprawa:** test przepisany całkowicie (44/0, ręcznie przeliczone wszystkie 8 wartości
`koszt_surowce × 2`). Kod produkcyjny nietknięty.

Evaluator (Opus 5) **PASS-WITH-NOTES**: diagnoza zweryfikowana niezależnie z dokumentu decyzji
(`docs/decyzje/DOSTEP-SUROWCE-Q1.md`, sekcja „Pliki wdrożenia" nie wymienia tego testu — niezależne
wyjaśnienie dlaczego akurat on został z tyłu), nie tylko ze słów Operatora. Wszystkie 8 przeliczeń
sprawdzone ręcznie, zgadzają się co do jednostki. Jedna nota istotna: pierwotny dowód mutacyjny
`R_STAWKI_FALA2_MULT` pinował mnożnik tylko „z góry" (cofnięcie 2→1 zostawiało test zielony,
mimo że `r-stawki-strojenie.ts` explicite przewiduje taki powrót po playteście: „ustaw 1 aby
cofnąć") — **domknięte przy scaleniu**: dodana asercja graniczna (`drewno:15`, poniżej progu
×2=16, musi zostać `locked`) — zweryfikowana osobiście przez orkiestratora: mutacja MULT 2→1 daje
44 pass/1 fail (łapie), przywrócone → 45/0.
Zmierzone: `spichlerz-widocznosc-test.cjs` 45/45, `deposit-building-gate-test.cjs` 47/47,
`tech-tree-test.cjs` 19/19, `research-test.cjs` 33/33, `logic-test.cjs` 213/213, `tsc --noEmit`
0 błędów.

**Dwie drobne pre-istniejące luki (Evaluator, poza zakresem, nie wymagają osobnych zgłoszeń):**
`spichlerz_ii: ['Sól']` w `DEPOSIT_LINKED_BUILDING_LABELS` nie jest pokryty testem (stary test
też go nie miał); `map-gen-regression-test.cjs` nie zmieścił się w budżecie czasu Evaluatora — nie
uruchomiony do końca, ale logicznie niedotknięty (commit zmienia wyłącznie ten jeden plik testowy,
zero importów gdzie indziej).
**Kotwice:** `gra/tools/spichlerz-widocznosc-test.cjs`.
**Model:** Sonnet 5 (Operator) + Opus 5 (Evaluator) + korekta orkiestratora przy scaleniu.

## BUG-PRZEMARSZ-KOMUNIKAT-OBCY (2026-08-07, playtest Macieja) · STATUS: **ZAMKNIĘTE — SCALONE (kod)** (`BUG-PRZEMARSZ-KOMUNIKAT-OBCY-Q1=C`)
**Jego słowa:** *„jakieś niezautoryzowane niby przemarsze, których ja nie widzę, bo ja nie widzę,
żeby ktoś robił przemarsz przez mój teren, a ja też nie mam jeszcze żadnych jednostek."*
**Objaw:** panel WYDARZENIA pokazuje wielokrotnie „Koniec tury — Nieautoryzowany przemarsz:
−5 Zauf./para", mimo że gracz **nie posiada ani jednej jednostki** i nikt nie wchodzi na jego teren.
**PRZYCZYNA USTALONA — `gra/src/main.ts:3570-3575`:**
```ts
if (penalizedPairs > 0) {
  showHintMessage(`Nieautoryzowany przemarsz: −${borderParams.karaPrzemarszNieautoryzowany_zaufanie_perTura} Zauf./para`, 3500);
}
```
Komunikat leci **bezwarunkowo**, gdy ukarano JAKĄKOLWIEK parę w świecie. Brak filtru na gracza.
Łańcuch: `applyBorderMarchPenaltiesEndTurn()` (`main.ts:3541`) → `collectUnauthorizedBorderPairs`
zbiera pary z **całego** `units` (wszyscy właściciele, także AI↔AI i barbarzyńcy) →
`applyUnauthorizedBorderPenalties` zwraca `penalizedPairs` = liczba wszystkich ukaranych par →
komunikat. **Żaden krok nie sprawdza `ownerId === gracz`.** Gracz dostaje powiadomienie
o przekroczeniach granic między obcymi cywilizacjami.
**Uwaga:** sama KARA jest najpewniej poprawna (relacje AI↔AI mają się psuć niezależnie od gracza)
— defektem jest wyłącznie POWIADAMIANIE gracza o cudzych sprawach. Rozdzielić jedno od drugiego.
**DO DECYZJI (ABC):** kiedy gracz ma widzieć ten komunikat —
(A) tylko gdy ktoś wszedł na TERYTORIUM GRACZA (`territoryOwnerId === gracz`) — informacja
    o naruszeniu jego granic;
(B) tylko gdy to JEGO jednostki naruszyły cudzy teren (`intruderOwnerId === gracz`) — ostrzeżenie
    o karze, którą sam ponosi;
(C) w obu tych przypadkach, ale NIGDY dla par obcy↔obcy; opcjonalnie z rozróżnieniem treści
    („Twoje granice naruszone" vs „Twoja jednostka na cudzym terenie").
**Kotwice:** `gra/src/main.ts:3541-3596` · `gra/src/game/diplomacy-credibility.ts:492`
· `gra/src/game/wiarygodnosc-types.ts:37`. Bramka do rozszerzenia: brak testu na adresata komunikatu.

## BUG-BRAMKA-DREWNO-BRAK (2026-08-07, playtest Macieja) · STATUS: **ZDECYDOWANE — A (2026-08-08) — w realizacji** (`dyspozycje/REJESTR-PROSB-I-ZADAN.md`)
**Jego słowa:** *„miasto, państwo nie ma start-upu, a buduje jednostki. A przecież do pierwszych
jednostek potrzebne jest drewno."*
**PRZYCZYNA — `gra/src/game/production.ts:858-863`:**
```ts
// DOSTEP-SUROWCE-Q1 (2026-07-29): jednostki brązowe/żelazne — tylko zapas w magazynie państwa.
if (surowiec === 'braz'   && !empireStockHas(ctx.empireResourceStock, 'braz'))   continue;
if (surowiec === 'zelazo' && !empireStockHas(ctx.empireResourceStock, 'zelazo')) continue;
```
Bramka dostępu do surowca obejmuje **wyłącznie `braz` i `zelazo`**. **`drewno` nie jest sprawdzane
nigdzie** — analogicznej gałęzi po prostu nie ma.
**Zakres realny — NIE dotyczy tylko miast-państw:** luka obejmuje **każdego właściciela**
(gracz, AI major, miasta-państwa, barbarzyńcy) i **każdą jednostkę epoki Kamienia** wymagającą
Drewna. Przykłady z `gra/data/units.json`: Wojownik (Drewno 10 szt.), Zwiadowca (Drewno 10 szt.).
Miasto-państwo było tylko miejscem, w którym właściciel to zauważył.
**To może być stan ZAMIERZONY, nie regresja:** decyzja `DOSTEP-SUROWCE-Q1` (2026-07-29) jest
w komentarzu zacytowana jako obejmująca *„jednostki brązowe/żelazne"* — czyli zakres mógł być
świadomie zawężony do dwóch surowców epok Brązu i Żelaza, a Kamień celowo zostawiony bez bramki
(żeby start gry nie blokował się na braku drewna). **Do zweryfikowania w oryginale decyzji** —
czy właściciel wykluczył Drewno świadomie, czy temat nigdy nie został postawiony.
**DO DECYZJI (ABC):**
(A) rozszerzyć bramkę na Drewno — jednostka wymagająca Drewna niedostępna bez zapasu w magazynie;
(B) zostawić bez bramki — Drewno jako surowiec „startowy" ma nie blokować pierwszych jednostek;
(C) bramka na Drewno, ale z progiem startowym / zapasem początkowym dla każdego państwa,
    żeby początek gry nie stanął.
**Powiązane, do rozstrzygnięcia razem:** `BUG-ZWIADOWCA-KOSZT-SUROWCA` — jeśli Zwiadowca ma
w ogóle nie kosztować surowca, przy wariancie (A) i tak przestanie podlegać bramce.
**Kotwice:** `gra/src/game/production.ts:845-870` (lista produkcji) i `:950-960` (druga kopia
warunku) · `gra/data/units.json` (kolumny `Surowiec`, `Surowiec (ilość)`).
**Uwaga:** warunek występuje w DWÓCH miejscach (`:859-863` i `:956-957`) — każda zmiana musi
objąć oba, inaczej lista produkcji i faktyczna możliwość budowy się rozjadą.

## BUG-TOOLTIP-MOC-NIEPELNA (2026-08-07) · STATUS: **ZAMKNIĘTE — NAPRAWIONE I WDROŻONE** (FALA 260, `eff727e`; status skorygowany 2026-08-08 przy audycie zgłoszeń — poprzedni zapis „OTWARTE" był przestarzały, fix już istniał w kodzie)
**Źródło:** pętla AutoBot `R-MOC-TABLICZKA-VS-BITWA` — Operator (Sonnet 5) → Evaluator (Opus 5),
werdykt PASS-WITH-NOTES, nota N4.
**Defekt:** `gra/src/ui/hexContextTooltip.ts:661-665` woła `fieldPower({meleeAttack, meleeDefence,
armor, health})` — **cztery pola zamiast ośmiu**. Pomija **4 z 5 składowych Ataku**:
`weaponDamage` (Obrażenia), `piercing` (Przebicie), `chargeBonus` (Szarża), `missileAttack`
(Atak dystansowy).
**Skala (przeliczona przez Evaluatora na całym `units.json`):** rozjazd tabliczka↔tooltip
dotyczy **70 z 71 jednostek nieoblężniczych**, od **+18 do +19,5 pkt Mocy**. Przykłady dla
**REKRUTA** (zero gwiazdek, zero premii weterana): Konnica tabliczka **49** vs tooltip **31,0**;
Medżaj 64,5 → 45,0; Triari 62 → 43,0.
**Kluczowe:** defekt jest **całkowicie niezależny od decyzji `C-MOC-Q1`** i od weteranów —
myli gracza przy KAŻDEJ jednostce od dnia wdrożenia. Nie obejmuje go żadna decyzja, nie ma
o nim śladu w kanonie, nie pilnuje go żaden test.
**Naprawa:** dołożenie brakujących pól do jednego wywołania. **Nie wymaga litery** — to nie jest
wybór produktowy, tylko niepełna implementacja istniejącego wzoru (`unit-power.ts:90-108`).
**Do dołożenia razem:** test pilnujący zgodności wszystkich trzech miejsc liczących Moc.

## R-MOC-TABLICZKA-CO-POKAZYWAC-Q1 (2026-08-07) · STATUS: **ZAMKNIĘTE — SCALONE (kod)** (`304eff9`)
**Ustalenie Evaluatora (nota N5) — decyzja `C-MOC-Q1 = A` jest wewnętrznie sprzeczna.**
Jedyny zapis treści, identyczny w `dyspozycje/WERSJE.md:838` i `dyspozycje/_handoff/KANAL-PRACA.md:5230`:
> `C-MOC-Q1=A (Moc nominalna, ta z auto-bitwy)`
**„Moc nominalna" i „ta z auto-bitwy" to dla weterana DWIE RÓŻNE LICZBY** — 49 vs 58,0 pkt Mocy.
Etykieta, którą właściciel zatwierdził, opisuje wariant jako **brak rozjazdu**, a rozjazd wynosi
**+18,37 %**.
**Czego NIE ma w repozytorium:** oryginalnego pytania ABC (brak `docs/decyzje/C-MOC-*.md`,
brak wpisu w rejestrze, brak w `PYTANIA-OTWARTE.md`). Fraza „Moc efektywna" nie występuje nigdzie
poza komentarzem w kodzie (`armyMerge.ts:521`).
**Chronologia (`git log -S`):** skalowanie weterana w auto-bitwie weszło **2026-07-26** (`16389f7`),
tabliczka z komentarzem „KONKRETNY, ZNANY ROZJAZD" — **2026-07-29** (`0dd5589`). Rozjazd już
istniał, gdy zadawano pytanie, a autor tabliczki o nim wiedział i opisał go w kodzie.
**Werdykt Evaluatora:** czy liczby 49 vs 58 padły w rozmowie — **NIEWERYFIKOWALNE** z repozytorium.
Formuła „właściciel świadomie odłożył" (powtórzona za komentarzem w kodzie) jest **nieuprawniona**
— kod deklaruje świadomość właściciela, na którą nie ma pokrycia.
**PYTANIE DO WŁAŚCICIELA:** czy tabliczka nad żetonem ma pokazywać Moc **nominalną** (dziś)
czy **efektywną** (tę, którą realnie rozstrzyga starcie). Liczby na stole: ★★★ Konnica —
tabliczka **49 pkt Mocy**, starcie **58,0**, panel pre-battle **49**.
**Koszt naprawy znikomy:** podmiana jednego wywołania w `armyMerge.ts::stackFieldPowerM`
(`rosterFieldPowerM` zamiast `sumRosterFieldM`), bez ruszania renderu — decyzja może zapaść
wyłącznie na gruncie rozgrywki, nie kosztu.
**Do domknięcia razem (nota N2):** panel pre-battle (`main.ts:17635`, duplikat
`battle/mapFieldBattle.ts:143`) pokazuje Moc nominalną OBOK prognozy szans liczonej ze skalowanej
— zostałby ostatnim miejscem z wariantem A.

## P-BRAMKA-UNIT-POWER-CZERWONA (2026-08-07) · STATUS: **ZAMKNIĘTE — udokumentowana w CLAUDE.md §BRAMKI**
`node gra/tools/unit-power-test.cjs` → **4 pass, 2 fail, exit 1**:
`FAIL: Hastati M_pole=50 (got 57.5)` · `FAIL: sumArmyFieldPower 3 units (got 167.5)`.
Stan **pre-istniejący** (drzewo bez zmian), przyczyna: zdezaktualizowane wartości oczekiwane
w teście po zmianie danych Hastati — **nie jest to regresja**. Ale **nie figuruje na liście
znanych czerwonych w `CLAUDE.md`**, więc każda sesja odkrywa ją od nowa. Do naprawy albo do
wpisania na listę znanych.

## BUG-RZEKI-MEDIUM-FOW-REGRESJA-2 (2026-08-07, playtest Macieja) · STATUS: **ZAMKNIĘTE — SCALONE (kod)** (`b33a19b`)
**Jego słowa:** *„Znowu pojawił się kolejny regres w zależności czy jest włączony czy wyłączony
FoW to rzeki średnie włączają się lub wyłączają."*
**⛔ KOREKTA WŁASNA (C-016):** ten wpis pierwotnie mówił „sprzeczność z zieloną bramką" —
cytowałem `river-fog-visibility-test.cjs` **12/12 PASS** jako fakt sprawdzony. **To był
fałszywy wynik.** Test w ogóle nie generuje swojego pliku wejściowego (`fs.writeFileSync`);
działał wyłącznie dlatego, że na dysku TEJ sesji leżał przypadkowy, nieśledzony artefakt
z 2026-08-06. Na czystym stanie repozytorium (świeży worktree) ten sam test **nie startuje**
(`exit 1`, nie może rozwiązać modułu). Zweryfikowane dwukrotnie, niezależnie (Operator i
Evaluator, oba Opus 5) — patrz `R-BRAMKI-SAMOGENERUJACE-ENTRY-Q1` niżej.
**Przyczyna prawdziwa (hipoteza (a) potwierdzona, (b) odrzucona):** rzeki średnie/krótkie/
dopływy są rysowane w paczkach po 32–128 tras (`RIVER_BATCH_PATHS`, `scene.ts`). Paczka nigdy
nie miała mapowania punkt→heks, więc widoczność przy mgle wojny działała na zasadzie
wszystko-albo-nic — jeden ciemny heks w paczce gasił CAŁĄ paczkę rzek. Naprawa z 2026-08-04
(„FIX v2") objęła wyłącznie rzeki main, nie paczkowane.
**Naprawa:** `buildMergedRiverFullIndex`/`buildMergedRiverFogIndex`/`computeMergedRiverFogSig`
w `riverLod.ts` (+73 linii, tylko nowe funkcje), dociągnięcie `pointHex` przez łańcuch
batchowania w `scene.ts`. Rzeki main, delty, ujścia — nietknięte. Perf zmierzony: 0,038–0,055 ms
na pełny przebieg `setFog`, także na mapie Ogromny — znikomy koszt.
**Bramka naprawiona przy okazji:** `river-fog-visibility-test.cjs` teraz generuje entry sam
(wzorzec z 286 innych plików w `gra/tools/`); 12 → **31 asercji**, w tym 12 end-to-end na
prawdziwym `generateMap` porównujących zbudowany indeks z REALNYM buforem `mergeGeometries`.
Zweryfikowane od zera po tej korekcie (usunięty zaległy artefakt przed uruchomieniem):
**31/31, exit 0.**
**NIE ZGADUJĘ który wariant — wymaga diagnozy Operator→Evaluator.**
**Kotwice:** `gra/src/render/riverLod.ts` (funkcje `needsRiverRibbonIndexUpdate`,
`buildRiverRibbonFullIndex`, sentinel `RIVER_FOG_SIG_OFF`) · `gra/src/render/river*.ts`
· ewentualnie `gra/src/map/gen-helpers.ts` (generacja rzek średnich) jeśli wariant (b).
**Model:** praca w `gra/src/render/**` = **Opus 5** (zgoda stała, CLAUDE.md §4); jeśli okaże się,
że przyczyna leży w `gra/src/map/**` — zmiana generatora wymaga bramki `map-gen-regression-test`
i pomiaru przed/po (playbook C-011), NIE testu na oko.

## R-PRZEMARSZ-ATRYBUCJA-Q1 (2026-08-07, wynik pętli AutoBot na BUG-PRZEMARSZ-KOMUNIKAT-OBCY) · STATUS: **ZAMKNIĘTE — SCALONE (kod)** (`30d48b8`, runda 2)
**Kontekst:** naprawa `BUG-PRZEMARSZ-KOMUNIKAT-OBCY-Q1=C` scalona — komunikat pokazuje się teraz
tylko gdy gracz jest stroną. Evaluator (nota N1) wskazał lukę, którą ta naprawa NIE zamyka:
właściciel powiedział *„nie widzę, żeby ktoś robił przemarsz przez mój teren"* — o **widoczności**,
nie o **istnieniu** pary. Promień terytorium miasta to 5–15 heksów, a obce jednostki we mgle wojny
są niewidoczne. Obca jednostka może stać na terenie gracza, generować kartę „Twoje granice
naruszone", a gracz nadal uczciwie zaraportuje „nikt tu nie chodził" — bo faktycznie tego nie widzi.
**Dodatkowo:** zbuntowane miasto (`REBEL_FACTION_OWNER_ID`) NIE jest wymuszane na relację
`'wojna'` (w przeciwieństwie do barbarzyńców) — po dzisiejszej naprawie gracz zacznie widzieć
komunikaty o naruszeniach przez własne, zbuntowane miasta, bez wyjaśnienia kto to jest.
**DO DECYZJI (ABC):** czy komunikat ma dodatkowo podawać **kto** narusza granice i **gdzie**
(nazwa cywilizacji, ewentualnie hex/kierunek), żeby gracz mógł to zweryfikować wizualnie zamiast
dostawać gołą liczbę bez punktu odniesienia.
(A) dopisać nazwę naruszającej cywilizacji do istniejącego komunikatu — minimalna zmiana;
(B) jak (A) + link/skok kamery do miejsca naruszenia;
(C) zostawić bez zmian — komunikat jako ostrzeżenie ogólne, szczegóły w panelu Wiarygodności.
**Kotwice:** `gra/src/main.ts:3573-3589` (komunikat), `gra/src/game/diplomacy-border-march.ts`
(`classifyPlayerBorderMarchNotice` — dziś zwraca tylko dwie flagi bool, bez identyfikacji strony).

## R-BRAMKI-SAMOGENERUJACE-ENTRY-Q1 (2026-08-07) — 10 bramek zależne od artefaktu spoza gita · STATUS: **ZAMKNIĘTE — SCALONE (kod)** (`165cd0d`)
**Źródło:** znalezisko Evaluatora (Opus 5) przy okazji `BUG-RZEKI-MEDIUM-FOW-REGRESJA-2`.
**Problem:** `.gitignore:53-56` deklaruje wprost: *„KAŻDA bramka zapisuje [swój plik wejściowy]
sama przy starcie"* — **nieprawda dla 10 plików**. Przeskanowane wszystkie **360** plików
`.cjs` w `gra/tools/`: **286** generują entry samodzielnie (`fs.writeFileSync`, bezpieczne),
**63** nie odwołują się do żadnego entry, **10** odwołują się do pliku, którego SAME NIE
GENERUJĄ — a plik jest ignorowany przez `.gitignore` (`gra/tools/.*-entry.ts`), więc nigdy
nie trafia do repo. Te bramki „działają" wyłącznie na maszynie, na której ktoś już je kiedyś
uruchomił ręcznie i zostawił artefakt; w świeżym worktree albo świeżym klonie **milcząco padają**
(`exit 1`, „nie można rozwiązać modułu"), co łatwo pomylić z brakiem uruchomienia w ogóle.
**Lista 10 plików** (11. — `river-fog-visibility-test.cjs` — już naprawiony w `b33a19b`):
`alliance-war-obligation-test.cjs` · `army-merge-colocated-test.cjs` · `civ-visual-test.cjs`
· `escape-overlay-stack-test.cjs` · `map-gen-phase-profile.cjs` · `merge-decor-no-regress-test.cjs`
· `planned-march-test.cjs` · `scene-perf-diag.cjs` · `science-hub-test.cjs`
· `terrain-hill-movement-test.cjs`.
**Ryzyko sprawdzone i wykluczone:** żaden z 360 plików nie czyta STAREGO `bundle.cjs` bez
przebudowy (co dawałoby cichą zieloność na nieaktualnym kodzie) — to byłby wariant najgorszy.
Dzisiejszy wypadek to „test nie startuje", nie „test kłamie o aktualnym kodzie".
**Dlaczego bez pytania:** to nie decyzja produktowa, tylko dług narzędziowy z jasnym wzorcem
naprawy (286 istniejących przykładów w tym samym repo). Naprawa: dopisać `fs.writeFileSync`
generujący entry przed `esbuild`, identycznie jak w działających plikach.
**Do poprawienia przy okazji:** `.gitignore:53-56` — komentarz twierdzący, że WSZYSTKIE bramki
generują entry same, jest dziś nieprawdziwy; poprawić po naprawieniu 10 plików.

## R-MOC-MUR-PARADOKS-Q1 (2026-08-07, nota N4 Evaluatora) · STATUS: **CZĘŚCIOWO COFNIĘTE (2026-08-08)** — decyzja `=A` z `f94216e` zastąpiona przez `R-MOC-DEFINICJA-Q1` (tabliczka wraca do czystej Mocy bez bonusu muru; `tabliczkaGarnizonScaledDefFor()` usunięta)
**Ustalenie:** po wdrożeniu `R-MOC-TABLICZKA-CO-POKAZYWAC-Q1=B` tabliczka jednostki w garnizonie
pokazuje wyższą Moc **w szczerym polu** niż **za murem miasta** — bo bonus muru (do +400%,
`structBonusPct`) wchodzi dopiero w rozstrzygnięciu bitwy (`effectiveDefenderM`), nie w tabliczce
(`stackFieldPowerM`), podczas gdy bonus fortyfikacji polowej garnizonu (+50%) w tabliczce już jest,
a znika po wybudowaniu palisady/muru (bo `unitGetsFortifyBonus` działa tylko „bez muru").
**Przykład zmierzony (Konnica rekrut, garnizon):** miasto bez murów → tabliczka **52**; to samo
miasto po wybudowaniu murów → tabliczka **spada do 49**, mimo że realna Obrona rośnie z **49
do 95** (mur +200%). Gracz zobaczy liczbę malejącą dokładnie wtedy, gdy buduje obronę.
**Cel pytania:** czy tabliczka ma dociągnąć też mnożniki muru/terenu (uczyniłoby ją zależną od
heksu, na którym jednostka aktualnie stoi), czy zostać przy „weteran + fortyfikacja polowa"
i zaakceptować ten paradoks jako znany, opisany gdzieś w UI (np. tooltip).
**Kotwice:** `gra/src/game/armyMerge.ts::stackFieldPowerM`, `gra/src/game/city-defense.ts`
(`shouldApplyGarrisonFortifyBonus`), `gra/src/main.ts::effectiveDefenderM`.

## R-MOC-RANKING-ROZJAZD-Q1 (2026-08-07, nota N9 Evaluatora) · STATUS: **ZAMKNIĘTE — SCALONE (kod)** (`d1f7b91`, B)
**Ustalenie:** `sumArmyMForOwner` (`main.ts:1581`, panel Mocy imperium + progi decyzji AI
w dyplomacji) NIE zostało objęte decyzją B — pozostaje nominalne, świadomie (zakres decyzji
dotyczył dosłownie „tabliczki nad żetonem"). Skutek: ta sama armia weteranów ma teraz **dwie
różne liczby Mocy widoczne w jednym interfejsie** — wyższą na tabliczce nad żetonem, niższą
w panelu rankingu Mocy imperium.
**Dwa osobne pytania, oba pod tym ID:**
(1) czy panel Mocy imperium (widoczny dla gracza) ma przejść na efektywną, dla spójności
z tabliczką pojedynczej jednostki;
(2) czy progi decyzji dyplomatycznych AI (`militaryRatioFromArmyM`, `progWojnaSila`) mają
przejść na efektywną — to zmiana **rozgrywki** (przesuwa progi, kiedy AI decyduje się na wojnę),
nie tylko wyświetlania, i wymaga osobnej bramki/pomiaru przed wdrożeniem.
**Kotwice:** `gra/src/main.ts:1581` (`sumArmyMForOwner`), `ui/powerOverlayHud.ts` (panel),
`main.ts` linie ~12955/13950/21784/21974 (`militaryRatioFromArmyM`, progi wojny).

## R-PRZEMARSZ-WYGASANIE-Q1 (2026-08-07, noty N-D1/N-D2 Evaluatora, runda 2) · STATUS: **ZAMKNIĘTE — SCALONE (kod)** (`8fe51b3`, A)
**Ustalenie:** naprawa „cel kamery się starzeje" + „dismiss nie działa trwale" (obie z rundy 1)
została zrobiona jednym mechanizmem — stabilne id per kierunek, usuwane i wstawiane na nowo
przy każdym wystąpieniu naruszenia w kolejnej turze. To **wprowadziło nowy defekt**, gorszy
niż stan przed całą tą pracą: symulacja Evaluatora na 20 000 tur pokazała, że **odrzucenie
komunikatu („✕") nigdy nie działa trwale** (34629/34629 przypadków — wraca w następnej turze,
jeśli naruszenie trwa) oraz że **komunikat NIE WYGASA po ustaniu naruszenia** w 79% przypadków
(8926/11327) — gracz widzi trwały wpis z liczbą kary, która już nie jest naliczana.
**Przed tą pracą:** ulotny toast na 3,5 sekundy, znikający sam. **Po tej pracy:** trwały wpis
z potencjalnie nieprawdziwą liczbą, którego nie da się skutecznie odrzucić.
**Cel pytania:** jak ma się zachowywać cykl życia tego komunikatu.
**DO DECYZJI (ABC):**
(A) osobny log czyszczony co turę (jak `villageEventLog`) — wpis znika sam, gdy naruszenie
    ustaje, „✕" działa jak przy innych chipach per-turowych; najprostsze, zgodne z naturą danych;
(B) zostać przy `warEventLog`, ale zapamiętać turę odrzucenia i nie wstawiać ponownie, dopóki
    ten sam kierunek trwa nieprzerwanie + jawnie usuwać wpis, gdy naruszenie ustaje;
(C) wrócić do ulotnego toastu (bez trwałego wpisu w Wydarzeniach) — traci skok kamery i historię,
    ale eliminuje problem najprościej.
**Kotwice:** `gra/src/main.ts` (`applyBorderMarchPenaltiesEndTurn`, ~3578-3640),
`borderMarchEventTargets`, `onEventDismiss`.

## R-MOC-HUD-GLOWNY-Q1 (2026-08-07, nota Evaluatora w R-MOC-RANKING-ROZJAZD-Q1) · STATUS: **ZDECYDOWANE — C (2026-08-08) — Operator złożył pracę, czeka na Evaluatora** (`dyspozycje/REJESTR-PROSB-I-ZADAN.md`)
**Ustalenie:** po `d1f7b91` (panel Mocy imperium na efektywną) Evaluator znalazł **piąty
konsument**, którego nikt nie zgłaszał: główny, stale widoczny licznik Mocy w górnym pasku
HUD (`main.ts:12579`, `buildHudState` → `hud.ts:1022`, `<span class="p-val-num">`) nadal
liczy **nominalnie**. Ten sam licznik to **fizyczny przycisk** (`act==='power'`) otwierający
panel Mocy, który po dzisiejszej zmianie liczy **efektywnie**.
**Skutek:** gracz z armią weteranów widzi w HUD np. „49", klika, i panel pokazuje „58" —
dwie różne liczby dla tej samej rzeczy, jedna otwierająca drugą. Sprawdzone przez Evaluatora
(z-index, przezroczystość backdropu) — licznik NIE jest zasłonięty, tylko przyciemniony,
więc rozjazd jest fizycznie widoczny w jednej klatce.
**DO DECYZJI (ABC):**
(A) HUD też przechodzi na efektywną — pełna spójność, ale to kolejny, szósty punkt zmiany
    tego samego dnia w tym samym obszarze kodu;
(B) HUD zostaje nominalny świadomie, z jasnym uzasadnieniem w UI (np. dopisek „bazowa"),
    żeby rozjazd nie wyglądał jak bug;
(C) cała warstwa UI (HUD + panel + ekran dyplomacji + Empire) naraz, jedną decyzją, zamiast
    punktowo — więcej pracy teraz, zero kolejnych „piątych konsumentów" później.
**Kotwice:** `gra/src/main.ts:12579` (`buildHudState`), `gra/src/ui/hud.ts:1022,1102`.

## Znaleziska poboczne z dzisiejszej pracy nad Mocą (nie blokują, do wiedzy)
- ~~**`openDiplomacyAudience` i `buildPlayerDiploSummary`**~~ → **ROZWIĄZANE** przez
  `R-MOC-HUD-GLOWNY-Q1=C` — `playerPower`/`otherPower`/`militaryPower` przełączone na
  `objectivePowerForOwnerEffective`, `formatPowerRelationLine` porównuje teraz dwie liczby
  efektywne po obu stronach.
- ~~**Pozycja Mocy w rankingu na ekranie dyplomacji** (`buildAbsolutePowerRank`, nominalna)
  może się różnić od pozycji w panelu Mocy~~ → **ROZWIĄZANE** przez `R-MOC-HUD-GLOWNY-Q1=C` —
  `buildAbsolutePowerRank` (wariant nominalny UI) usunięty jako martwy kod, ekran dyplomacji
  czyta teraz `buildAbsolutePowerRankEffective`, tak samo jak panel Mocy/Empire.
- **Mnożnik trudności AI jest częściowo gubiony** (pre-istniejące, nie wprowadzone dziś):
  `applyDifficultyCombatToUnitDef` nie usuwa cache `fieldPower` dla jednostek bez weterana
  i bez fortyfikacji — dla takich jednostek AI mnożnik trudności jest po cichu ignorowany
  w całej ścieżce Mocy (tabliczka, auto-bitwa, teraz też ranking). Dotyczy `R-MOC-*`
  całościowo, nie tego konkretnego commita. Do naprawy: `game/ai-difficulty-bonus.ts`.
- ~~**Garnizon wspierający szturm sąsiedniego miasta bez opuszczania własnego garnizonu**
  (`R-MOC-MUR-PARADOKS-Q1`) — wnosi do bitwy 49 pkt (poprawnie), tabliczka pokazuje 95~~ →
  **NIEAKTUALNE po 2026-08-08** (`R-MOC-DEFINICJA-Q1`, częściowe cofnięcie
  `R-MOC-MUR-PARADOKS-Q1=A`) — tabliczka pokazuje teraz 49, zgodnie z tym co jednostka
  wnosi do bitwy gdziekolwiek. Paradoks wrócił w INNĄ stronę — patrz nowy wpis
  `R-MOC-MUR-PARADOKS-Q2-KIERUNEK-ODWROTNY` niżej.

## R-MOC-KOSZYK-RELACJA-SWIADOME (2026-08-08, nota Evaluatora R-MOC-HUD-GLOWNY-Q1) · STATUS: **DO WIADOMOŚCI WŁAŚCICIELA — pozostawione nominalne przez Evaluatora, ale zakres dekretu C rozstrzyga wyłącznie Maciej**
**Uwaga procesowa (drugi Evaluator, ponowna weryfikacja):** ścisłe czytanie dekretu
`R-MOC-HUD-GLOWNY-Q1=C` — „cała warstwa UI naraz" — może obejmować też liczbę „obecnie: Y"
w koszyku. Pierwszy Evaluator ocenił to jako świadomie poza zakresem (bo koszyk musi pokazywać
liczbę, której realnie używa próg mechaniki), ale o zakresie WŁASNEGO dekretu rozstrzyga
Maciej, nie agent — status obniżony z ZAMKNIĘTE do „do wiadomości", nic więcej nie zmieniono
w kodzie.
**Ustalenie:** `getNegotiationContext.relacjaTotal` (`main.ts`) jest **NOMINALNA** — świadomie,
bo bramkuje realną mechanikę `diplomacyFairGivePn` i progi handlu/daru (patrz punkt „CO ZOSTAJE
NOMINALNE" w `gra/tools/hud-moc-warstwa-test.cjs`, decyzja R-MOC-HUD-GLOWNY-Q1=C). Ta sama
nominalna liczba trafia do koszyka wymiany i tam jest **WYŚWIETLANA** graczowi jako liczba
w komunikatach typu „Handel wymaga Relacji ≥ X (obecnie: Y)"
(`gra/src/ui/diplomacyTradeBasket.ts:~1247,~1458,~1460`) — mechanizm: `diplomacyAudience.ts:~1881`
`mergeBasketCtx` daje pierwszeństwo nominalnej `negCtx.relacjaTotal` nad efektywną `st.relacjaTotal`.
**Efekt widoczny dla gracza:** ekran audiencji pokazuje np. „Relacja 142/200" (EFEKTYWNA,
`audienceRelTotalEffective`), gracz otwiera stamtąd koszyk wymiany i widzi „obecnie: 138"
(NOMINALNA, `audienceRelTotal`) — dwie różne liczby tej samej wielkości na dwóch nakładających
się, kolejno otwieranych ekranach.
**To NIE jest bug do naprawienia w kodzie.** W koszyku poprawnie pokazywana jest liczba, której
naprawdę używa próg mechaniki (`diplomacyFairGivePn`) — przełączenie jej na efektywną wprowadzałoby
gracza w błąd co do realnego progu odblokowania handlu/daru (progi w koszyku muszą zostać zgodne
z tym, co faktycznie sprawdza silnik, nie z liczbą kosmetyczną z panelu Mocy). Rozjazd między
ekranem audiencji (efektywna, kosmetyczna) a koszykiem (nominalna, mechaniczna) jest zamierzoną
konsekwencją decyzji R-MOC-HUD-GLOWNY-Q1=C, nie regresją tej pracy.
**Zapisane, żeby nie zostało odkryte za tydzień jako „nowa regresja".**
**Kotwice:** `gra/src/main.ts` (`getNegotiationContext.relacjaTotal`, `audienceRelTotal`,
`audienceRelTotalEffective`), `gra/src/ui/diplomacyTradeBasket.ts:~1247,~1458,~1460`,
`gra/src/ui/diplomacyAudience.ts:~1881` (`mergeBasketCtx`).

## R-DYPLO-9CC7C76C-ZAKRES-NIEUDOKUMENTOWANY (2026-08-08, nota Evaluatora BUG-TRAKTAT-KOSZYK-REGRESJA) · STATUS: **DO WIEDZY — nie naprawiać teraz, poza zakresem =A**
**Ustalenie:** naprawa `BUG-TRAKTAT-KOSZYK-REGRESJA=A` usunęła z `TRADE_BASKET_ACTION_IDS`
(`gra/src/ui/diplomacyTradeBasket.ts`) wyłącznie akcję `'5'` (traktat szlaków) — zgodnie z
literą decyzji. Przy okazji weryfikacji Evaluator ustalił, że commit `9cc7c76c` (2026-08-05,
„NAP bezterminowy na stole audiencji") wprowadził DWIE inne, nieudokumentowane zmiany zakresu,
poza NAP i poza akcją `'5'`:
1. Skurczył `TREATY_ONLY_FORM_IDS` z 7 pozycji do 1 (`'2','3','4','8','10','12','15'` → `'15'`).
2. Dopisał do `TRADE_BASKET_ACTION_IDS` również akcje `'6'` (propozycja technologii), `'7'`
   (namów na wojnę), `'9'` (ultimatum) — nie tylko `'5'`.
**Czy to zamierzone czy kolejna, dotąd niezauważona regresja tej samej klasy co
`BUG-TRAKTAT-KOSZYK-REGRESJA` — NIEUSTALONE.** Świadomie NIE naprawiane teraz — poza zakresem
decyzji `=A`, która dotyczyła wyłącznie akcji `'5'`. Zapisane, żeby nie zniknęło z pola widzenia.
**Kotwice:** `git show 9cc7c76c` (obie listy w `diplomacyTradeBasket.ts`).

## P-BRAMKA-DANINA-PODATEK-CZERWONA (2026-08-08, nota Evaluatora tooltip-moc) · STATUS: **ZAMKNIĘTE 2026-08-09**
`node gra/tools/danina-podatek-tooltip-ui-test.cjs` → `esbuild failed: No matching export in
"tools/.stubs/brandAssets-stub.ts" for import "unitIconSvg"`, exit 1. Zweryfikowane dwukrotnie
(Operator i Evaluator, niezależnie) że pada identycznie na czystym `HEAD` sprzed prac
`tooltip-moc` — przyczyna: bramka sama nadpisuje współdzielony stub swoją 3-funkcyjną treścią
(bez `unitIconSvg`), po czym bunduje `hexContextTooltip.ts`, który od commita `4504783`
(„FALA 46") importuje `unitIconSvg`. Nie figuruje na liście znanych czerwonych w `CLAUDE.md`.
Naprawa: jedna linia w literale stuba tej bramki. Do naprawy albo do wpisania na listę znanych.

**ZAMKNIĘTE (2026-08-09):** Dedykowany `danina-podatek-brandAssets-stub.ts` (wzorem już
istniejących `pre-battle-brandAssets-stub.ts`/`brandAssets-diplo-treaty-stub.ts`/
`unit-context-card-brandAssets-stub.ts`) z pełnym kompletem 4 eksportów (`brandIconSvg`,
`mapResourceIconSvg`, `terrainIconSvg`, `unitIconSvg`) wymaganych przez cały łańcuch importów
`hexContextTooltip.ts`. Evaluator: PASS, niezależnie zbudował tranzytywny graf importów
(114 plików) i potwierdził kompletność eksportów. `danina-podatek-tooltip-ui-test.cjs` 12/12
(było `esbuild failed`), `tsc` 0 błędów. **Nota Evaluatora (niepilna):** nowy stub jest śledzony
w gicie i jednocześnie nadpisywany dynamicznie przy każdym uruchomieniu (działa dzięki bajtowej
zgodności) — inny precedens (`unit-context-card-brandAssets-stub.ts`) wybrał `.gitignore` +
plik nieśledzony. Rozjazd konwencji do ujednolicenia kiedyś, nie dziś.

## P-BRAMKA-MUR-PARADOKS-REALNA-OBRONA-NIEPOKRYTA (2026-08-08, nota N1 Evaluatora moc-mur-revert) · STATUS: **ZAMKNIĘTE 2026-08-09**
Sekcja 5 `gra/tools/mur-paradoks-test.cjs` (asercja „realna Obrona > tabliczka") liczy
`realDefenseWithMur` z REIMPLEMENTACJI wzoru w samym teście, nie z prawdziwego
`effectiveDefenderM` w `main.ts` — dowód mutacyjny Evaluatora: wstrzyknięcie
`combinedDefPct = 0 * structBonusPct + ...` (zerowanie bonusu muru w REALNEJ bitwie) do
`main.ts` zostawia `mur-paradoks-test.cjs`, `logic-test.cjs` i `combat-test.cjs` w 100%
zielone. `city-defense-terrain-gate-test.cjs` ma tę samą lukę (własna reimplementacja,
linia 227). Żadna bramka w repo nie chroni dziś linii `combinedDefPct = structBonusPct +
(cityTerrMult - 1) * 100` w `effectiveDefenderM`. Naprawa: asercja źródłowa (regex) na
main.ts przypinająca tę linię, wzorem starej (usuniętej dziś) asercji na `scaleField`.

**ZAMKNIĘTE (2026-08-09):** Asercja źródłowa (regex na treść `main.ts`, wyodrębnia ciało
`effectiveDefenderM` żeby jednoznacznie odróżnić od identycznej tekstowo linii w NOWEJ
`combatPowerFullDisplayDefFor`, dzisiejsza zmiana `R-MOC-TABLICZKA-VS-CIVPOWER-Q1`) dodana do
`mur-paradoks-test.cjs` i `city-defense-terrain-gate-test.cjs` (ten drugi wcześniej miał ZERO
kotwicy do `main.ts` — czysta reimplementacja, luka była poważniejsza niż sądzono). Evaluator:
PASS-WITH-NOTES, własny dowód mutacyjny (4 warianty, w tym M2 potwierdzający że regex NIE łapie
przypadkiem `combatPowerFullDisplayDefFor`). `mur-paradoks-test.cjs` 24/24 (było 20/20),
`city-defense-terrain-gate-test.cjs` 34/34 (było 31/31), `logic-test.cjs` 213/213,
`combat-test.cjs` 6/6, `tsc` 0 błędów. **Nowe znalezisko Evaluatora, zarejestrowane osobno:**
`P-BRAMKA-TABLICZKA-STRUKTURA-NIEPOKRYTA` — analogiczna, symetryczna luka w NOWEJ
`combatPowerFullDisplayDefFor` (kod dodany wczoraj, jeszcze nigdy nie miał żadnej bramki).

## P-BRAMKA-TABLICZKA-STRUKTURA-NIEPOKRYTA (2026-08-09, nota N1 Evaluatora P-BRAMKA-MUR-PARADOKS-REALNA-OBRONA-NIEPOKRYTA) · STATUS: **ZAMKNIĘTE 2026-08-09**
Dowód mutacyjny (M2, Evaluator): wyzerowanie bonusu struktury/muru w `combatPowerFullDisplayDefFor`
(nowa funkcja z `R-MOC-TABLICZKA-VS-CIVPOWER-Q1`, karmi tabliczkę nad żetonem) zostawia
`mur-paradoks-test.cjs` i `city-defense-terrain-gate-test.cjs` w 100% zielone — ta sama klasa
luki co dziś naprawiona dla `effectiveDefenderM`, ale w kodzie dodanym dopiero wczoraj, więc
nigdy nie miała żadnej bramki.

**ZAMKNIĘTE (2026-08-09):** analogiczna asercja źródłowa (regex zakotwiczony na unikalnej,
jednoparametrowej sygnaturze `function combatPowerFullDisplayDefFor(u: RuntimeUnit)` — odróżnienie
od 6-parametrowej `effectiveDefenderM` nie wymaga nawet odróżniania treści, sama nazwa+sygnatura
już rozstrzyga) przypinająca linię `combinedDefPct` w ciele `combatPowerFullDisplayDefFor`, plus
asercje że skalowanie dotyczy WYŁĄCZNIE `meleeDefence`/`armor`/`health`, NIE pól Ataku. Evaluator
PASS-WITH-NOTES, własny dowód mutacyjny (6 wariantów: zerowanie bonusu w obu funkcjach osobno —
złapane, brak crosstalku między nimi w żadną stronę; próba przycięcia regexu wstrzykniętym `}` —
manifestuje się na czerwono, nigdy jako cichy PASS). `mur-paradoks-test.cjs` 28/28 (było 24/24),
`city-defense-terrain-gate-test.cjs` 34/34 (bez zmian), `logic-test.cjs` 213/213, `combat-test.cjs`
6/6, `tsc` 0 błędów.

**Nota Evaluatora (niepilna, nie blokuje):** asercja „brak skalowania pól Ataku" sprawdza tylko
BRAK literału `<pole>: scaleField` w dopasowanym tekście — Evaluator dowiódł mutacyjnie że
skalowanie Ataku przez INNY helper (`scaleAtk`) albo inline zostaje niewykryte (28/28 zielone
mimo wstrzykniętego błędu). Ta sama forma słabości jest już konwencją pliku (pre-istniejące
asercje negatywne dla `combatPowerScaledDefFor`/`sumArmyMForOwnerEffective`), nie regresja.
Rekomendacja Evaluatora na przyszłość: zamienić czarną listę helperów na białą listę dozwolonych
kluczy w bloku `return` — zarejestrowane jako `P-BRAMKA-CZARNA-LISTA-HELPEROW-SLABA`, bardzo
niepilne (dług testowy o niskim ryzyku, nie luka w realnej logice gry).
**Kotwice:** `gra/src/main.ts` (`combatPowerFullDisplayDefFor`), `gra/tools/mur-paradoks-test.cjs`.
**Model:** Sonnet 5.

## P-BRAMKA-CZARNA-LISTA-HELPEROW-SLABA — ZAMKNIĘTE 2026-08-09
`mur-paradoks-test.cjs` sprawdzał „brak skalowania pól Ataku" w `combatPowerFullDisplayDefFor`
przez czarną listę nazw helperów (`scaleField`) — skalowanie tego samego pola przez INNY helper
albo inline mnożenie przechodziło niewykryte.

**Naprawa:** nowy mechanizm parsuje prawdziwy blok `return {...}` z ciała funkcji i dla każdej
linii `klucz: wartość` rozpoznaje skalowanie PO KSZTAŁCIE prawej strony (`SCALING_SHAPE_RE` —
dowolne wywołanie funkcji LUB mnożenie), nie po nazwie konkretnego helpera. Każdy tak wykryty
klucz musi być w `ALLOWED_SCALED_KEYS = ['meleeDefence','armor','health']` — prawdziwa biała
lista. Zawężenie zakresu (tylko ta jedna asercja, nie pozostałe dwie w pliku) zweryfikowane przez
Operatora czytaniem całych ciał `combatPowerScaledDefFor`/`sumArmyMForOwnerEffective` — żadna nie
buduje `return {...}` ze skalowanymi polami w tym kształcie.

Evaluator (Opus 5) **PASS-WITH-NOTES**: zawężenie zakresu potwierdzone niezależnie (przeczytane
całe ciała obu funkcji). 8 mutacji własnych (2 powtórzone Operatora + 6 nowych) — złapane: nowy
helper, inline mnożenie, usunięcie skalowania, refaktor na `Object.assign`. Świeżość worktree:
`git rev-list --count` do `origin/main`/`main` = 0 w obie strony, scalenie bezkonfliktowe.
Zmierzone: `mur-paradoks-test.cjs` 29/29, `city-defense-terrain-gate-test.cjs` 34/34,
`combat-test.cjs` 6/6, `logic-test.cjs` 213/213, `tsc --noEmit` 0 błędów.

**Trzy noty Evaluatora (nie blokują, nie wymagają osobnych zgłoszeń — udokumentowane tutaj):**
(1) luka realna, ale wydumana — skalowanie przez zmienną pośrednią (`const s = scaleField(x);
return {meleeAttack: s}`) omija regex badający tylko prawą stronę dwukropka; materialność niska,
naturalny zapis regresji (`meleeAttack: scaleField(...)`) jest łapany; (2) nowy mechanizm nie
jest ścisłym nadzbiorem starego — gołe przypisanie referencji funkcji (`meleeAttack: scaleField,`
bez wywołania) było łapane przez starą czarną listę, nie jest przez nową białą (przypadek
wydumany, inna klasa błędu — korupcja pola, nie skalowanie); (3) sąsiad bez pokrycia poza
zakresem: `fortifyFieldScaledDefFor` (`main.ts:18078`) ma identyczny kształt `return {...
meleeDefence: ...}` bez żadnego testu pinującego źródło — kandydat na osobne zgłoszenie, jeśli
temat zostanie kiedyś podjęty.
**Kotwice:** `gra/tools/mur-paradoks-test.cjs`.
**Model:** Sonnet 5 (Operator) + Opus 5 (Evaluator).

## R-MOC-MUR-PARADOKS-Q2-KIERUNEK-ODWROTNY (2026-08-08, nota N3 Evaluatora moc-mur-revert) · STATUS: **ZASTĄPIONE — `R-MOC-TABLICZKA-VS-CIVPOWER-Q1` (2026-08-09)**
Po częściowym cofnięciu `R-MOC-MUR-PARADOKS-Q1=A` (decyzja `R-MOC-DEFINICJA-Q1`, tabliczka
garnizonu = `combatPowerScaledDefFor(u)` bez bonusu muru) — tabliczka mimo to NADAL zmienia
się po wybudowaniu muru: **51,5 pkt Mocy bez muru → 49,0 pkt Mocy z murem** (dla tego
samego garnizonu, ta sama jednostka). Przyczyna: `unitGetsFortifyDefenseBonus` wyłącza
premię fortyfikacji polowej garnizonu (+50%) właśnie wtedy, gdy miasto ma mur — więc
zasada „Moc wyświetlana nigdy nie zależy od budynku" nie jest spełniona w 100%: tabliczka
nadal reaguje na obecność muru, tylko w dół zamiast w górę. Świadomie zaakceptowane przez
Macieja jako część powrotu do `combatPowerScaledDefFor` (ta sama funkcja żywi realną
bitwę), ale pytanie „czy fortyfikacja polowa garnizonu też ma zniknąć z tabliczki, żeby
Moc była naprawdę niezależna od miejsca postoju" nie zostało zadane wprost.
**Kotwice:** `gra/src/main.ts` (`combatPowerScaledDefFor`, `fortifyFieldScaledDefFor`,
`unitGetsFortifyDefenseBonus`).

**ZASTĄPIONE (2026-08-09):** Pytanie okazało się objawem błędu zakresu w `R-MOC-DEFINICJA-Q1` —
zunifikowała regułę „bez budynków/terenu" dla tabliczki NA MAPIE i dla Mocy CYWILIZACJI, gdy to
dwie różne liczby. Maciej wprost: tabliczka na mapie ma pokazywać REALNĄ Moc ze wszystkimi
bonusami (teren, fortyfikacja, mur, weteran); Moc cywilizacji (ranking/HUD/Empire) ma być BEZ
terenu/fortyfikacji/muru, tylko naturalne wskaźniki + ulepszenia + weteran. Pełna decyzja:
`docs/decyzje/R-MOC-TABLICZKA-VS-CIVPOWER-Q1.md`. Kod w dispatchu.

## R-MOC-TABLICZKA-VS-CIVPOWER-Q1 (2026-08-09, korekta Macieja do R-MOC-DEFINICJA-Q1) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
Rozdział dwóch liczb Mocy, które wcześniejsza decyzja błędnie zunifikowała: tabliczka/tooltip
jednostki na mapie = REALNA Moc ze wszystkimi bonusami (teren/fortyfikacja/mur/weteran); Moc
cywilizacji (panel rankingu, HUD, Empire) = tylko naturalne wskaźniki + ulepszenia + weteran,
BEZ terenu/fortyfikacji/muru. Zamyka jednocześnie `R-MOC-MUR-PARADOKS-Q1` i
`R-MOC-MUR-PARADOKS-Q2-KIERUNEK-ODWROTNY` (obie strony tego samego błędnego założenia „to jedna
liczba"). Pełna decyzja i plan wdrożenia: `docs/decyzje/R-MOC-TABLICZKA-VS-CIVPOWER-Q1.md`.
**Kotwice:** `gra/src/main.ts` (`computeStackDisplay`/`defOf` — tabliczka; `sumArmyMForOwnerEffective`
— civ-power; `combatPowerScaledDefFor`, `veteranScaledDefFor`, `fortifyFieldScaledDefFor`,
`effectiveDefenderM`), `gra/tools/mur-paradoks-test.cjs`.
**Model:** Sonnet 5 (poza `render/**` — to zmiana logiki liczenia, nie renderu).

**NAPRAWIONE (2026-08-09):** Nowa `combatPowerFullDisplayDefFor(u)` w `main.ts` (wskrzeszenie —
potwierdzone identyczne co do bajtu — wcześniej cofniętej `tabliczkaGarnizonScaledDefFor` z
commitu `f94216e9`) karmi tabliczkę nad żetonem/`computeStackDisplay`. `sumArmyMForOwnerEffective`
przełączone na `veteranScaledDefFor(u)` (weteran, bez fortyfikacji/terenu/muru — i bez mnożnika
trudności AI, zgodnie z literalnym brzmieniem decyzji „zamienić na `veteranScaledDefFor`").
Realna bitwa (`effectiveDefenderM`, `rosterFieldPowerM`, `mapFieldBattle.ts`) niedotknięta —
zweryfikowane niezależnie przez Evaluatora (dokładnie 3 wywołania `combatPowerScaledDefFor`
w całym repo, wszystkie ścieżka bitwy). Paradoks zamknięty: tabliczka garnizonu za murem = 95 pkt
== realna Obrona bitwy 95 pkt (wcześniej 49,0 vs prawdziwe 95). STRICT-PARITY POPRAWIONE przy
okazji: usunięcie mnożnika trudności z civ-power zdejmuje wcześniej istniejące zawyżenie rankingu
Mocy AI na wyższych poziomach trudności (`bonusWalka` już nie wchodzi do civ-power).

**Dwa znaleziska, świadomie NIE zaimplementowane w tej rundzie (Evaluator zaakceptował
pozostawienie, wymagał tylko rejestracji):**
1. `hexContextTooltip.ts` „Moc pola" (tooltip jednostki po najechaniu na heks) liczy Moc inną,
   starą ścieżką (`unitCardCombatFor`: bonusy budynków + weteran, ZERO terenu/fortyfikacji/muru)
   — literalnie decyzja obejmuje też „tooltip jednostki na mapie", ale zmiana samej linii „Moc
   pola" bez reszty panelu (Atak/Obrona/Pancerz, spójnie zbudowanego na konwencji `*Effective`)
   stworzyłaby wewnętrzną niespójność panelu. Osobne zlecenie.
2. `RuntimeUnit.pancerzBonusProc`/`parametryBonusProc` (trwałe bonusy zdobyte odwiedzinami
   budynków) nie są dziś wpięte w `unitDefFor`/`veteranScaledDefFor`/żadną formułę Mocy — tylko
   w kartę jednostki i obserwowaną bitwę. Czy to się liczy jako „bonusy z ulepszeń jednostki" dla
   civ-power (decyzja to wspomina) — dwuznaczne, bo trwałe, ale nie zapisane w definicji
   jednostki. Doliczenie dotknęłoby `effectiveDefenderM` (bitwa) — poza zakresem C-025 tej rundy.

Testy: `tsc` 0 błędów, `mur-paradoks-test.cjs` 20/20, `weterani-test.cjs` 79/79,
`moc-ranking-rozjazd-test.cjs` 19/19, `hud-moc-warstwa-test.cjs` 28/28, `logic-test.cjs` 213/213,
`combat-test.cjs` 6/6, `city-defense-terrain-gate-test.cjs` 31/31, `ai-moc-diag-test.cjs` 22/22,
`auto-battle-power-test.cjs` 14/14, `power-objective-test.cjs` 15/15, `power-ranking-test.cjs`
10/10, `power-options-test.cjs` 5/5, `manpower-test.cjs` 62/62.

**Do wiadomości Macieja (widoczne w playteście):** Moc cywilizacji AI w rankingu SPADNIE na
wyższych poziomach trudności — poprawny efekt tej decyzji (civ-power już nie liczy mnożnika
trudności AI), nie regresja.

## P-DREWNO-BRAMKA-RYZYKO-STARTU (2026-08-08, nota N1 Evaluatora zwiadowca-drewno) · STATUS: **DO WIEDZY — świadome ryzyko z decyzji BUG-BRAMKA-DREWNO-BRAK=A**
**Zmierzone:** miasta startują z pustym magazynem surowców (`cities.ts:415`); Drewno
pochodzi wyłącznie z ulepszenia terenu `tartak`. 14 z 75 jednostek w `units.json` wymaga
Drewna. **Przy pustym magazynie państwa jedyną budowalną jednostką w epokach 1-3 jest
Zwiadowca** — dokładnie ryzyko, na które właściciel świadomie się zgodził (odrzucona opcja
C z progiem startowym). AI ma parytet (ta sama bramka, ten sam `empireResourceStock`).
Do potwierdzenia playtestem — czy to realnie blokuje wczesną grę, czy tartak/handel
wystarczająco szybko rozwiązuje brak Drewna.

## P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY (2026-08-08, nota N5 Evaluatora zwiadowca-drewno) · STATUS: **ZAMKNIĘTE 2026-08-09** (wszystkie 4 bramki mają dziś dedykowane stuby)
`gra/tools/.stubs/brandAssets-stub.ts` jest plikiem ŚLEDZONYM w gicie, a co najmniej
4 bramki (`army-merge-dismiss-bounce-test.cjs`, `pre-battle-defender-retreat-test.cjs`,
`unit-context-card-test.cjs`, `danina-podatek-tooltip-ui-test.cjs`) nadpisują go własną
treścią przy każdym uruchomieniu — każde szersze omiatanie testów zostawia fałszywy `M`
na tym pliku w `git status`. Ten sam wzorzec doprowadził już dziś do dedykowanych stubów
w `tooltip-moc` (`unit-context-card-brandAssets-stub.ts`) i `traktat-koszyk`
(`brandAssets-diplo-treaty-stub.ts`). Do rozważenia: systemowa naprawa (każda bramka
dostaje własny, niededykowany katalog stubów) zamiast punktowych obejść przy każdej
kolejnej kolizji.

**ZAMKNIĘTE (2026-08-09):** Ostatnie 2 z 4 bramek na liście (`danina-podatek-tooltip-ui-test.cjs`,
`army-merge-dismiss-bounce-test.cjs`) przepięte na dedykowane stuby — `army-merge-dismiss-bounce-test.cjs`
dostał `army-merge-brandAssets-stub.ts`. Pozostałe dwie (`pre-battle-defender-retreat-test.cjs`,
`unit-context-card-test.cjs`) już miały dedykowane stuby z wcześniejszych napraw — Evaluator
potwierdził niezależnie. `git status --short` na `tools/.stubs/brandAssets-stub.ts` czyste po
pełnym biegu testów — plik jest dziś **osierocony** (śledzony, zero konsumentów, można rozważyć
usunięcie przy okazji). Nota Evaluatora o rozjeździe konwencji (śledzony vs `.gitignore`) — patrz
`P-BRAMKA-DANINA-PODATEK-CZERWONA` wyżej.

## P-UNIT-STOCK-COST-TEST-DLUG (2026-08-08, nota N4 Evaluatora zwiadowca-drewno) · STATUS: **ZAMKNIĘTE 2026-08-09** (asercje zaktualizowane, test 58/58)
`node gra/tools/unit-stock-cost-test.cjs` → 53 pass, **4 fail**, m.in. „Wojownik: brak
kosztu magazynowego (got {drewno:10}, want {})" i „Konnica ... want {braz:2} got {braz:10}".
Zdezaktualizowane oczekiwania po wcześniejszych zmianach `units.json` — dług testowy, nie
regresja. Potwierdzone identyczne na czystym `HEAD` sprzed prac `zwiadowca-drewno`. Nie
figuruje na liście znanych czerwonych w `CLAUDE.md`.

**ZAMKNIĘTE (2026-08-09):** 4 asercje zaktualizowane do dzisiejszego `units.json`: Konnica/Rydwan
(woły) `Brąz 2→10`, Wojownik `brak→Drewno 10` (commit `7d4ad9690`, 2026-08-06, „utrzymanie
surowcowe ×5", **potwierdzony współautor Maciej** w trailerze commita), fixtura `Surowiec='-'`
→ `null` (commit `5682c066`, 2026-08-08). Evaluator: PASS-WITH-NOTES, niezależnie zweryfikował
wszystkie 4 wartości w `units.json` na obu commitach, policzył **11 wywołań `unitStockCost()`
w 5 plikach** (nie 4 jak w raporcie Operatora) — wszystkie czytają na żywo z `units.json`, brak
zahardkodowanych ścieżek/cache rozjeżdżającego się z danymi. `unit-stock-cost-test.cjs` 58/58,
`tsc` 0 błędów, siostrzane bramki (unit-resource-upkeep, pytanie-84-stock-keys, ai-recruit-upkeep-gate,
unit-replace, drewno-gate) zielone. Drobna nota: fixtura `Surowiec===null` węższa niż kontrakt
silnika (`unitStockCost` nadal obsługuje też `'-'`) — ryzyko niskie, `export-c.py` nigdy nie
zapisuje `'-'` dziś.

## P-AUTOBOT-MINRUNS-ROZJAZD-5-VS-10 (2026-08-08, adwokat diabła: audyt skillsa `civ-autobot`) · STATUS: **DO WIEDZY — rozjazd konfiguracji, nie błąd skillsa**
Kanon (`R-PROC-AUTOBOT` §v2, `dyspozycje/autobot/README.md`) mówi, że próg istotności
statystycznej `minRunsForSignificance` został **podniesiony z 5 do 10**. Ale żywy plik
`dyspozycje/autobot/playbook.json` ma dziś **`minRunsForSignificance: 5`** — generator
`dyspozycje/autobot/tools/playbook-md-to-json.cjs` przepisuje sekcję `thresholds` bez
zmian (nie wyprowadza jej z `playbook.md`), więc wartość `5` **realnie obowiązuje** aż do
ręcznej poprawki. Znalezione przy trzecim, adwokackim przeglądzie nowego skillsa
`civ-autobot` (`.claude/skills/civ-autobot/SKILL.md`) — zapisane tam jako uwaga „odczytaj
wartość z pliku, nie z pamięci", ale sam rozjazd wykracza poza zakres skillsa i wymaga
decyzji: albo poprawić `playbook.json` na `10` (zgodnie z kanonem), albo cofnąć kanon do
`5` (jeśli `10` było error/nieaktualną decyzją), albo rozszerzyć generator o pole
`thresholds` w `playbook.md`. Nie blokuje niczego pilnie — czysto informacyjne.

## BUG-ZOOM-ZABLOKOWANY-TRYB-ULEPSZEN (2026-08-08, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa:** *„podczas budowania w trybie budowania ulepszeń, kiedy wybierzemy już coś,
co chcemy ulepszać, nie da się przybliżać i oddalać mapy. Czasem to utrudnia stawianie
ulepszeń."*
**Objaw:** po wejściu w tryb budowania ulepszeń terenu i wybraniu konkretnego ulepszenia
do postawienia, scroll/zoom kamery mapy przestaje działać — nie da się przybliżyć ani
oddalić widoku, co utrudnia precyzyjne wskazanie heksu docelowego.
**Do zbadania:** który handler wejścia (scroll/wheel) jest blokowany w trybie wyboru
celu ulepszenia — czy to celowe zablokowanie zoomu na czas trybu placementu (np. żeby nie
gubić trybu przy scrollu), czy przypadkowy efekt uboczny nasłuchu zdarzeń.
**Kotwice:** `gra/src/render/**` (kamera/zoom), `gra/src/ui/**` (tryb budowania ulepszeń).
**Model:** jeśli zmiana dotknie `gra/src/render/**` — **Opus 5** (zgoda stała, CLAUDE.md §4).

**NAPRAWIONE (2026-08-08):** `gra/src/render/camera.ts` miał jeden warunek (`blockPointerAt`)
blokujący jednocześnie przeciąganie mapy (`_onMouseDown`) i scroll/zoom (`_onWheel`) w trybie
budowania ulepszeń/zakładania miasta — zamierzone dla przeciągania (żeby klik trafiał w
placement, nie w pan), przypadkowy efekt uboczny dla zoomu. Rozdzielone na dwa warunki:
`blockPointerAt` (bez zmian, nadal blokuje przeciąganie) i nowy `blockWheelAt` (blokuje zoom
tylko nad panelem miasta, nie w trybie budowania). Domyślnie każdy inny konsument
`CameraController` bez jawnego `blockWheelAt` zachowuje stare zachowanie (fallback na
`blockPointerAt`) — potwierdzone: 6 miejsc tworzenia `CameraController` w `main.ts`, wszystkie
przez ten sam `cameraControllerOpts()`, żaden inny system (bitwa, drzewko technologii,
podgląd cudu) nie współdzieli tej kamery. Zweryfikowane przez Evaluatora (Opus 5,
PASS-WITH-NOTES po rundzie poprawek — dodano test regresji
`gra/tools/camera-zoom-block-test.cjs`, 4/4: repro, negacja, fallback, brak regresji
przeciągania). `npx tsc --noEmit` czyste.

## R-HUD-MIASTO-STAN-CYWILIZACJI (2026-08-08, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa:** „brakuje danych z całej cywilizacji, jeżeli chodzi o te elementy, które są w
podglądzie miasta. Mówię tu o pracy, żywności, skarbcu, nauce, kulturze i religii. Potrzebny
jest stan całej cywilizacji i plus to, co jest w danym mieście, ale mniejszymi cyframi. Czyli
to, co z cywilizacji pokazujemy jako duże całej cywilizacji, a dodatkowo plus to jest to co
w danym mieście przybywa lub ubywa."
**Stan faktyczny (sprawdzone w kodzie, `gra/src/ui/cityPanel.ts:8692-8768`,
`buildCityOnlyW3FlankChips`):** górny pasek widoku miasta pokazuje **wyłącznie wartości TEGO
miasta** — funkcja jest nazwana dosłownie `CityOnly`, każdy tooltip mówi „tego miasta"/„w tym
mieście". **Nie ma odpowiednika pokazującego sumę całej cywilizacji** — sprawdzone: brak
drugiej, „empire" wersji tej funkcji czy przełącznika. To nie jest regresja — brak dowodu, że
kiedykolwiek pokazywano tu sumę cywilizacji.
**Do zrobienia:** dodać do paska dużą liczbę = suma cywilizacji (Praca/Żywność/Skarbiec/
Nauka/Kultura/Religia z puli państwa) + mniejszą liczbą przyrost/ubytek z TEGO miasta —
dokładnie jak działa już `buildEmpireResourceRows` w `main.ts:2425` dla surowców (stock +
per-lokalizacja), tylko dla tych sześciu wskaźników.
**Kotwice:** `gra/src/ui/cityPanel.ts` (`buildCityOnlyW3FlankChips`), dane cywilizacji z
`gra/src/main.ts`.
**Model:** czysty UI w `cityPanel.ts` — Sonnet 5 wystarczy (nie `render/**`).

**NAPRAWIONE (2026-08-08):** każdy z 6 chipów pokazuje teraz dużą liczbę = agregat
cywilizacji (z tego samego, silnikowego źródła co główny HUD mapy — `buildHudState()`,
`empire-hud-totals.ts`, nowy plik) + małą liczbę `+N`/`−N` = wkład TEGO miasta. Po jednej
naprawie od Evaluatora (błąd kompilacji + reimplementacja agregacji zamiast reużycia
istniejącego, silnikowego źródła prawdy) — Evaluator (Opus 5) PASS-WITH-NOTES. Nowy test
`gra/tools/hud-miasto-stan-cywilizacji-test.cjs`, 20/20. `tsc` czyste.
**⚠️ Do wiedzy przy playteście:** duża liczba jest NETTO (po utrzymaniu ulepszeń, tak jak
główny HUD), mała liczba per-miasto jest BRUTTO — sumy miast NIE zsumują się dokładnie do
liczby cywilizacji dla Pracy/Skarbca/Żywności. Celowe (spójność z głównym HUD), ale może być
odczytane jako błąd, jeśli ktoś spróbuje to zsumować ręcznie.

## R-SPACJA-KOLEJNA-JEDNOSTKA-PETLA (2026-08-08, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa:** „bardzo często jest problem że w kolejce jednostek kiedy naciśniemy spację
zamiast przechodzić do kolejnej która ma wolne ruchy przechodzi do jakiejś kolejnej która nie
wiem jest w kolejce jakiejś zawsze ruch powinien po spacji powinien odbywać się od
najbliższej możliwej jednostki która jeszcze ma ruch. Czasem jest tak, że kręci się wybór
tylko wokół tych jednostek, które już odbyły ruch, a nie przechodzi do jednostek, które
jeszcze ruch mogą odbyć."
**Objaw:** klawisz Spacja (przejście do następnej jednostki z ruchem) czasem zapętla się
wyłącznie na jednostkach, które JUŻ wykonały ruch w tej turze, pomijając te, które nadal mają
ruch dostępny — zamiast zawsze iść do najbliższej jednostki z pozostałym ruchem.
**Do zbadania:** handler klawisza Spacja / logika „następna jednostka" — czy filtr
„ma jeszcze ruch" jest poprawnie stosowany przy budowaniu listy kandydatów, czy kolejność
cyklowania nie gubi/pomija jednostek spełniających warunek.
**Kotwice:** `gra/src/ui/**` (obsługa klawiszy, panel jednostek), `gra/src/main.ts` (stan tury,
lista jednostek z ruchem).
**Model:** Sonnet 5 (logika UI/tury, nie `render/**`).

**⛔ KONFLIKT ZNALEZIONY PRZEZ EVALUATORA (2026-08-08):** naprawa (przywrócenie filtra
„tylko jednostki z ruchem" w `cyclablePlayerArmyLeads()`, `main.ts`) **cofa jawne, wcześniejsze
polecenie Macieja z 2026-07-28** (`docs/archiwum-czatow/.../MASTER-Work_KORESPONDENCJA.md`,
dwukrotnie): *„Danej spacji miało zmieniać jednostki na następną **niezależnie od tego, czy ma
ona ruch, czy nie**."* — dokładnie zaimplementowane w FALA 64 (commit `953e689f`), zalogowane
jako dostarczone w `WERSJE.md:1255`. Dziś (08.08) Maciej mówi coś przeciwnego: cyklowanie ma
iść WYŁĄCZNIE po jednostkach z ruchem. **Dwa jego własne polecenia, w różnym czasie, są ze
sobą sprzeczne** — per CLAUDE.md §7 („nie zgaduj przy niejednoznaczności — pytaj") to
wymaga jego decyzji, nie cichego wyboru przez agenta.
**Dodatkowe ustalenie Evaluatora:** ścisły filtr (tylko z ruchem) ma nieprzetestowany efekt
uboczny na 2 z 4 miejsc użycia tej samej funkcji: gdy WSZYSTKIE jednostki wyczerpią ruch,
Spacja odznacza zaznaczenie zamiast cyklować (`clearPlayerUnitSelection()`), a strzałki
◀▶ w HUD armii (`armyStackHud.ts:226`, dodane 2026-07-27 jako przeglądanie „stylem
miasta") zostają całkowicie wyłączone (`canCycleUnits() → false`). Trzeci punkt: kolejność
cyklowania to globalne sortowanie przestrzenne `(q+r,q,r)`, nie faktycznie „najbliższa" liczona
od aktualnie wybranej jednostki — więc nawet ze ścisłym filtrem fraza „od najbliższej możliwej"
nie jest w pełni spełniona.
**Naprawa GOTOWA W KODZIE (worktree `agent-a268a6afcf89df0e1`, commit `a9efb243`), ale
WSTRZYMANA do decyzji właściciela** — nie scalać bez jego odpowiedzi.

**DECYZJA WŁAŚCICIELA (2026-08-08):** hybryda, doprecyzowana własnymi słowami: *„na starcie
jednostek powinna być strzałka w prawo, w lewo, przejść do następnej jednostki. Przejście
powinno być niezależne już od tego czy jest aktywne czy nie. Powinna być jedna strzałka
przejść do następnej jednostki, oraz przejść do następnej aktywnej jednostki z pulltipem, że
spacja to jest przejście do następnej aktywnej jednostki, a strzałka to jest do następnej
jakiejkolwiek."* Rozstrzyga też konflikt z 28.07 bez sprzeczności — to DWIE różne kontrolki:
- **Spacja** = następna jednostka **z ruchem** (dzisiejsze zgłoszenie) — naprawa `a9efb243`
  zostaje, dotyczy WYŁĄCZNIE klawisza Spacja.
- **Strzałki ◀▶ w HUD** = następna jednostka **niezależnie od ruchu** (polecenie z 28.07,
  FALA 64) — mają wrócić do niefiltrowanej listy, NIE korzystać z tej samej ścisłej funkcji
  co Spacja.
- **Tooltips obowiązkowe**: Spacja → „przejście do następnej aktywnej jednostki"; strzałka →
  „przejście do następnej jakiejkolwiek [jednostki]".
**Status:** zlecone do wdrożenia — rozdzielić `cyclablePlayerArmyLeads()` (dla Spacji, z
filtrem `stackCanMove`) od nowej/przywróconej niefiltrowanej listy dla strzałek HUD, dopisać
tooltips.

## BUG-SUROWCE-DOSTEP-ILOSC-ZNIKLA (2026-08-08, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa:** „surowce które kiedyś były tylko jako surowce które miały mieć sygnalizowany
dostęp powinny być już pełni w surowcach ilości surowców widzę że to jest jakiś regres i
znowu jakaś poprawka sprawiła że to zostało cofnięte."
⛔ **Pierwsza diagnoza tej sesji była błędna** (wskazywała `cityPanel.ts`/`renderSurowce` —
zły panel). Poprawiona po weryfikacji adwokata diabła (Opus 5, zgodnie z nową zasadą C-024):

**Prawdziwy panel:** `empireDetailPanel.ts` (`renderSurowceSection`), sekcja „Dostęp — nie
magazynowane" — dokładnie ten ekran ze zrzutu (Ceramika/Sól/Koń/Złoto, kropka + „masz"/„brak").

**Regres potwierdzony, dokładny commit:** `331aa180` (2026-08-05,
`fix(R-SUROWCE-DOSTEP): access rows cap null for empire panel`). Przed tym commitem
**wszystkie 13 surowców** miały `cap = empireCap` bezwarunkowo — Ceramika/Sól/Koń/Złoto
pokazywały pasek **`stock / cap`, czyli z realną ilością** z magazynu. Ten commit ustawił
`cap = undefined` dla „surowców dostępu" — filtr panelu (`rows.filter(r => r.cap == null)`)
przeniósł je do osobnej sekcji „Dostęp", gdzie liczy się TYLKO boolean masz/brak, **ilość
znika z widoku mimo że silnik nadal ją trzyma** (`empire-resource-access.ts:5-6` mówi to
wprost w komentarzu). Nic nie zginęło w danych — tylko w tym, co panel pokazuje.

**Chronologia sprzeczności:** 2026-07-26 `R-SUROWCE-DOSTEP` (Maciej: „powinno być chociaż
zasugerowane miejsce na surowce, które są dostępem") → 2026-07-29 `DOSTEP-SUROWCE-Q1`
(Maciej: „kwestię dostępu usuwamy CAŁKOWICIE z gry") → 2026-08-05 wdrożenie prośby z 26.07
**3 dni po decyzji, która ją unieważniła**. `DOSTEP-SUROWCE-Q1` wymienia `cityPanel.ts` w
plikach wdrożenia, ale **nie `empireDetailPanel.ts`/`main.ts::buildEmpireResourceRows`** —
panel imperium nigdy nie został dociągnięty do kanonu Q1.
**Do decyzji:** czy sekcja „Dostęp — nie magazynowane" ma wrócić do pokazywania `stock/cap`
(cofnięcie `331aa180`, zgodne z kanonem Q1: liczy się tylko magazyn) — czy zostać jako
czysto informacyjny wskaźnik dostępu geograficznego, oddzielny od ilości (wymaga wtedy
osobnego miejsca na ilość tych samych surowców).
**Kotwice:** `gra/src/main.ts` (`buildEmpireResourceRows`), `gra/src/ui/empireDetailPanel.ts`
(`renderSurowceSection`), `gra/src/game/empire-resource-access.ts`.
**Model:** Sonnet 5 (poza `render/**`).

**NAPRAWIONE (2026-08-08):** pełne cofnięcie `331aa180` — wszystkie 13 surowców liczy teraz
`cap = empireCap` jednolicie, sekcja „Dostęp — nie magazynowane" fizycznie usunięta (nie
ukryta), `gra/src/game/empire-resource-access.ts` skasowany jako martwy kod (zero innych
callerów, sprawdzone grepem całego repo). Tooltip źródła dostępu działa dalej dla wszystkich
4 surowców (niezależna od `cap` ścieżka danych). Evaluator (Opus 5) PASS-WITH-NOTES.
`surowce-dostep-test.cjs` przepisany, 13/13, `tsc` czyste.
**Nota (niska pilność, do osobnej rejestracji):** martwa gałąź w `resTooltipHtml` sprawia,
że komunikat „Dostęp: brak — nie odblokowano" jest dziś nieosiągalny — przy braku dostępu
i zapasie 0 kafelek pokazuje neutralne „0/1200" bez żadnej wzmianki o dostępie (dotyczy
głównie Złota/Mennicy, patrz decyzja). Do rozważenia po playteście, jeśli okaże się mylące.

## R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE (2026-08-08, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa:** „kiedy wymieniamy surowce i na przykład chcemy się wymienić technologiami
powinny być pokazywane tylko technologie te które są niedostępne dla innej cywilizacji
zarówno po jednej jak i po drugiej stronie. Jeżeli jedna i druga cywilizacja ma tą
technologię to nie ma sensu jej pokazywać, bo przecież nie dojdzie do wymiany."
**Objaw (zrzut, koszyk wymiany „DODAJ DO OFERTY" / „DODAJ DO KONTRPROPOZYCJI"):** obie strony
pokazują **identyczną listę technologii** (Obróbka drewna, Rolnictwo, Oswojenie zwierząt,
Łowiectwo, Garncarstwo, Murarstwo) — bez filtrowania po tym, czy druga strona już ją ma.
**Wstępnie sprawdzone w kodzie:** `gra/src/main.ts::getSellableTechForPlayer()` (linia 14137)
filtruje TYLKO po `player.zbadane` (własne zbadane technologie oferującego) — **nie sprawdza
w ogóle, czy odbiorca już tę technologię posiada**. Ten sam wzorzec prawdopodobnie w
`defaultTechOptions()` (`diplomacyTradeBasket.ts:389`), który czyta WSZYSTKIE technologie z
`tech.json` bezwarunkowo — używany jako fallback, gdy `ctx.techOptions` nie jest podany.
**Niezweryfikowane jeszcze:** który dokładnie z tych dwóch (albo trzeci, jeszcze nieznaleziony)
zasila konkretnie ten ekran koszyka ogólnego handlu ze zrzutu — wymaga doczytania, skąd
`ctx.techOptions` pochodzi dla akcji `'6'` (tech) w kontekście `zaproponuj_handel`.
**Kotwice:** `gra/src/main.ts` (`getSellableTechForPlayer`), `gra/src/ui/diplomacyTradeBasket.ts`
(`defaultTechOptions`, budowa `techChips` dla obu stron).
**Model:** Sonnet 5 (poza `render/**`).

**NAPRAWIONE (2026-08-08):** Nowy `gra/src/game/diplomacy-tech-trade.ts`
(`tradeableTechIdsForSide(ownKnown, otherKnown)`), wołany symetrycznie dla obu stron.
`getSellableTechForPlayer(responderOwnerId)` teraz filtruje względem `ownerResearchedTechs
(responderOwnerId)`; nowa `getBuyableTechFromOwner(responderOwnerId)` dla strony „otrzymuję".
`getNegotiationContext` dostarcza osobne `giveTechOptions`/`receiveTechOptions`.
`diplomacyTradeBasket.ts` czyta odpowiednie pole per strona zamiast jednego wspólnego
`ctx.techOptions`. Akcja `'6'` (jednokierunkowa „sprzedaj technologię") celowo nietknięta.
Evaluator: PASS-WITH-NOTES, `tsc` 0 błędów, `diplomacy-tech-trade-test.cjs` 8/8 + pełny pakiet
dyplomacji (29 plików) zielony, w tym `diplomacy-proposal-test.cjs` 126/126,
`diplomacy-locks-test.cjs` 70/70, `diplomacy-test.cjs` 148/148,
`diplomacy-negotiation-table-test.cjs` 54/54, `tech-tree-test.cjs` 19/19, `research-test.cjs` 33/33.
**Trzy noty Evaluatora, niepilne, zarejestrowane osobno poniżej:** pusta lista technologii bez
komunikatu placeholder; `grantTechToOwner` bez sprawdzenia prerekwizytów/epoki (ścieżka nowo
osiągalna po filtrze); `sellableTechCount`/akcja `'6'` może się teraz ukryć, gdy AI zna wszystko
co gracz (świadoma, udokumentowana konsekwencja filtra, nie błąd).

## P-HANDEL-TECH-PUSTA-LISTA-BRAK-KOMUNIKATU (2026-08-08, nota Evaluatora R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest
Po filtrze lista technologii do wymiany bywa realnie pusta (wcześniej nigdy nie była).
`techChips=''`, ale chip „Technologia" nadal klikalny — pusta siatka, „Dodaj" cicho nic nie robi
(`readItemFromForm` zwraca `null`). Miasta mają placeholder „— brak miast (SILNIK) —",
technologie nie mają analogicznego. Do dołożenia tym samym wzorcem.

**ZAMKNIĘTE (2026-08-09):** Pusta lista dostaje placeholder „— brak technologii (SILNIK) —"
analogiczny do miast, chip „Technologia" zostaje klikalny jak chip miasta. Evaluator
PASS-WITH-NOTES, `diplomacy-tech-trade-test.cjs` 24/24, `tsc` 0 błędów.
**Kotwice:** `gra/src/ui/diplomacyTradeBasket.ts` (`buildAddForm`).
**Model:** Sonnet 5.

## P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE (2026-08-08, nota Evaluatora R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest
`gra/src/game/diplomacy-basket-transfer.ts:68-96` (`grantTechToOwner`) sprawdza tylko „nieznana"/
„już zbadana", NIE sprawdza prerekwizytów drzewka ani epoki. Wcześniej ścieżka „gracz dostaje
technologię AI" była praktycznie nieosiągalna (lista `receive` pokazywała własne techy gracza,
`granted` zawsze `false`) — po dzisiejszym filtrze gracz realnie może zdobyć technologię z
pominięciem drzewka. Pre-istniejący dług, nowo odblokowany.

**ZAMKNIĘTE (2026-08-09):** Dwie warstwy (defense in depth): (1) `grantTechToOwner` sprawdza
teraz prerekwizyty drzewka + bramkę epoki/tieru odbiorcy (`research.ts:
prerequisitesOf/epochGateMet/epochTierGateMet`, ta sama logika co `canResearch`, bez bramki
budynku/ulepszenia — świadomie, to inny typ wymogu); (2) lista „dostaje" filtruje się już na
etapie budowania (`techIdsWithPrereqsMetForRecipient`, nowy `gra/src/game/diplomacy-tech-trade.ts`).
STRICT-PARITY potwierdzone przez Evaluatora bezpośrednio w `main.ts:7353` (wywołanie przed
jakąkolwiek gałęzią po `ownerId`) — AI→gracz podlega bramce identycznie jak gracz→AI, bramka
realnie aktywna w produkcji (`syncBasketResearchFromEngine` zasila `techCatalog` przed
transferem, nie jest martwym kodem widocznym tylko w teście). Evaluator PASS-WITH-NOTES,
`diplomacy-tech-trade-test.cjs` 24/24, `diplomacy-basket-transfer-test.cjs` 17/17, `logic-test`
213/213, `tsc` 0 błędów, 31 plików testów dyplomacji zielonych, `vite build` 799 modułów OK.

**Dwa nowe znaleziska Evaluatora, zarejestrowane osobno (oba niepilne):**
`P-BRAMKA-TECH-TIER-NIEPOKRYTA` (luka pokrycia — mutacja usuwająca `tierOk` przeżywa testy) i
`P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA` (nowy filtr zmniejsza listę „daję", więc
`diplomacy-locks.ts:201` blokuje całą akcję częściej dla graczy bez nic do oddania).
**Kotwice:** `gra/src/game/diplomacy-basket-transfer.ts` (`grantTechToOwner`),
`gra/src/game/diplomacy-tech-trade.ts` (`techIdsWithPrereqsMetForRecipient`).
**Model:** Sonnet 5.

## P-BRAMKA-TECH-TIER-NIEPOKRYTA (2026-08-09, nota Evaluatora P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE) · STATUS: **ZAMKNIĘTE 2026-08-09**
Dowód mutacyjny Evaluatora: usunięcie SAMEGO `tierOk` (bramka tieru epoki) z `grantTechToOwner`
zostawia `diplomacy-basket-transfer-test.cjs` w 100% zielone (17/17) — usunięcie `epochOk` jest
złapane, usunięcie `tierOk` nie. Kod jest poprawny (weryfikacja czytaniem), brakuje jednej
asercji. Opis commita `c8ee16f0` deklarował pokrycie „prereq/epoka/tier/parity" — deklaracja
dla warstwy tieru była nieprawdziwa, sprostowane tutaj.

**ZAMKNIĘTE (2026-08-09):** nowy scenariusz testowy (katalog `tierCatalog`: technologia bez
formalnego prerekwizytu, ale wyższego tieru tej samej epoki niż zbadana) izoluje `tierOk` od
`prereqsMet`/`epochOk`. Evaluator PASS-WITH-NOTES, dowód mutacyjny osobisty potwierdził izolację
(mutacja `tierOk=true` → dokładnie 2 nowe asercje padają; mutacje `prereqsMet=false`/`epochOk=false`
nie poruszają nowego scenariusza pozytywnego poza jego rolą zapory ogólnej). Kod produkcyjny
nietknięty (tylko plik testowy). `diplomacy-basket-transfer-test.cjs` 20/20 (baza 17/17),
`diplomacy-tech-trade-test.cjs` 24/24, `logic-test.cjs` 213/213, `tsc` 0 błędów.

**Nowe znalezisko Evaluatora, zarejestrowane osobno:** `P-BRAMKA-TECH-TIER-WARSTWA2-NIEPOKRYTA` —
identyczna luka istnieje w DRUGIEJ warstwie (`techIdsWithPrereqsMetForRecipient` w
`gra/src/game/diplomacy-tech-trade.ts`, filtr na etapie budowania listy), poza kotwicami tego
zgłoszenia (które wskazywały tylko `grantTechToOwner`).
**Kotwice:** `gra/tools/diplomacy-basket-transfer-test.cjs`, `gra/src/game/diplomacy-basket-transfer.ts` (`grantTechToOwner`, `tierOk`).
**Model:** Sonnet 5.

## P-BRAMKA-TECH-TIER-WARSTWA2-NIEPOKRYTA — ZAMKNIĘTE 2026-08-09
Evaluator zmutował `techIdsWithPrereqsMetForRecipient` (`gra/src/game/diplomacy-tech-trade.ts:45`,
filtr listy „dostaje" na etapie budowania koszyka, DRUGA warstwa defense-in-depth obok
`grantTechToOwner`) wyłączając SAMĄ składową tieru (`&& true`) — `diplomacy-tech-trade-test.cjs`
zostaje 24/24 zielone, mutacja przeżywa. Kontrola: wyłączenie CAŁEGO filtra (`return true`) daje
22/24 — czyli filtr jako całość jest pokryty, ale składowa tieru wewnątrz niego nie. Ta sama klasa
luki co `P-BRAMKA-TECH-TIER-NIEPOKRYTA`, jedna warstwa dalej.

**Naprawa:** nowy scenariusz testowy z osobnym katalogiem `tierCatalog` (Epoka/Poziom obecne),
izolujący `tierOk` wewnątrz `techIdsWithPrereqsMetForRecipient` od prereq/epoki — test-only, kod
produkcyjny nietknięty. Evaluator (Opus 5) **PASS-WITH-NOTES**: dowód mutacyjny silniejszy niż
żądany — przy siłowo otwartych `prereqsMet`/`epochOk`, scenariusz nadal odrzuca Garncarstwo2,
jedyną działającą bramką jest `tierOk`. Zmierzone: `diplomacy-tech-trade-test.cjs` 26/26,
`diplomacy-basket-transfer-test.cjs` 20/20, `logic-test.cjs` 213/213, `tsc --noEmit` 0 błędów.
Dwie drobne noty Evaluatora domknięte przed scaleniem: (1) nagłówek testu doprecyzowany o opis
nowego scenariusza; (2) świeżość worktree (2 commity za HEAD, oba niekolidujące) zweryfikowana
przez `git apply --check -3` bez konfliktu.
**Kotwice:** `gra/src/game/diplomacy-tech-trade.ts:45` (`techIdsWithPrereqsMetForRecipient`),
`gra/tools/diplomacy-tech-trade-test.cjs`.
**Model:** Sonnet 5 (Operator) + Opus 5 (Evaluator).

## P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA-Q1 (2026-08-09, nota Evaluatora P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE) · STATUS: **ECHO A (x2) — RUNDA 1 Evaluator FAIL, runda 2 w toku z ROZSZERZONYM zakresem (tech-za-tech)** (`docs/decyzje/R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1.md`)

**Pytanie ABC o zakres B3 (2026-08-09) — MACIEJ ODPOWIEDZIAŁ: A** (via AskUserQuestion) —
„Rozszerzyć teraz o tech-za-tech": runda 2 ma dołożyć wymianę technologia-za-technologię RAZEM
z naprawą exploita B1/B2, nie odkładać jej na osobne zgłoszenie. Orkiestrator rekomendował B
(najpierw exploit, wymiana osobno) — Maciej wybrał A, decyzja wiążąca, praca w toku dostała
korektę zakresu (patrz niżej).
`gra/src/game/diplomacy-locks.ts:201` blokuje całą akcję „6" gdy `sellableTechCount === 0` —
liczy WYŁĄCZNIE stronę „daję", nie „dostaję". Nowy filtr (`P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE`)
zmniejsza listę „dostaje" u odbiorcy, ale to lista „daję" u nadawcy decyduje o blokadzie.

**Subagent dostał zadanie zdiagnozować i naprawić bez pytania TYLKO jeśli jednoznaczne. Zrobił
to (commit `98cfe36c`, dodał `buyableTechCount` do warunku blokady), ale Evaluator werdyktem
**FAIL** odrzucił scalenie** — diagnoza Operatora była błędna na poziomie implementacji, mimo
poprawnego odczytu specyfikacji danych (`data/diplomacy.json` opisuje akcję „6" dwutrybowo:
Sprzedaż/Wymiana).

**Rzeczywisty stan kodu (potwierdzony komentarzem w `main.ts:15122-15125`, dopisanym w TYM
SAMYM commicie `82bdbd92` na który powoływał się Operator):** akcja „6" jest dziś zaimplementowana
JEDNOKIERUNKOWO — gracz zawsze sprzedaje (`techOptions = getSellableTechForPlayer`), pole
`getBuyableTechFromOwner` zasila WYŁĄCZNIE koszyk ogólny (akcja „14"), nie akcję „6". Formularz
akcji „6" (`diplomacyTradeBasket.ts`) i ścieżka legacy (`diplomacyNegotiationModal.ts`) czytają
wyłącznie stronę „daję" — **odblokowanie akcji przez `buyableTechCount` nie zmienia formularza
ani walidacji**, więc gracz bez własnych technologii, po odblokowaniu, i tak dostaje formularz
„Brak technologii do sprzedaży." i walidację blokującą wysyłkę z komunikatem „Wybierz technologię
do sprzedaży" — **gorsze doświadczenie niż dziś** (dziś: uczciwie zablokowany przycisk; po
naprawie: odblokowany przycisk prowadzący do ślepego zaułka).

**[TEMAT: Akcja „6" w dyplomacji — sprzedaż jednokierunkowa czy pełny handel dwukierunkowy]**
**Sytuacja:** dane gry (`diplomacy.json`) opisują akcję „6" jako dwutrybową (Sprzedaż za gotówkę
LUB Wymiana tech-za-tech), ale kod implementuje wyłącznie Sprzedaż (gracz zawsze oddaje, nigdy
nie kupuje). Blokada przycisku jest dziś spójna z faktyczną (jednokierunkową) implementacją.
**Cel pytania:** czy dociągnąć implementację do specyfikacji danych (prawdziwy handel
dwukierunkowy) czy pozostawić jednokierunkową sprzedaż i uznać to za zamierzone uproszczenie.
**Dlaczego teraz:** naprawa blokady bez naprawy formularza tworzy widoczny dla gracza ślepy
zaułek — bezpieczniej rozstrzygnąć kierunek niż zostawić samą blokadę (choć asymetryczną, to
dziś spójną z resztą UI).
- **A — Dociągnąć implementację do specyfikacji (pełny handel dwukierunkowy w akcji „6").**
  Za: gra zgodna z własnym opisem w `diplomacy.json`; gracz bez nic do oddania może faktycznie
  kupić technologię za gotówkę, zgodnie z opisem „Sprzedaż: 50-300 Pieniędzy". Przeciw: realny
  zakres prac — formularz traktatu, walidacja, payload wykonania muszą obsłużyć oba kierunki;
  większe ryzyko regresji w kodzie który dziś działa poprawnie dla jedynego wspieranego kierunku.
- **B — Zostawić jednokierunkową sprzedaż, zamknąć zgłoszenie jako „nie bug".** Za: zero ryzyka,
  zero pracy, kod i UI są dziś wewnętrznie spójne (blokada pasuje do formularza). Przeciw: opis
  w `diplomacy.json` „Wymiana: technologia o zbliżonej wartości" pozostaje niezrealizowaną
  obietnicą wobec gracza czytającego opis akcji.
- **C — Zostawić blokadę jednokierunkową, ale doprecyzować treść komunikatu/opisu akcji „6" w UI
  żeby nie sugerował trybu kupna.** Za: tania poprawka czytelności bez ryzyka kodu; usuwa
  rozbieżność między opisem a zachowaniem. Przeciw: nie realizuje pierwotnego zgłoszenia
  (asymetria formalnie zostaje, tylko lepiej opisana).
**Rekomendacja:** C jako natychmiastowy, tani krok (0 ryzyka), z A jako możliwy przyszły temat
jeśli handel dwukierunkowy okaże się pożądany produktowo — ale to decyzja właściciela, nie
subagenta.

**Stan kodu (przed odpowiedzią A):** commit `98cfe36c` NIE scalony, worktree usunięty.

**MACIEJ ODPOWIEDZIAŁ: A** (via AskUserQuestion, opcja „pełny handel dwukierunkowy") — decyzja
zapisana `docs/decyzje/R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1.md`.

**RUNDA 1 realizacji (worktree `agent-ab7a2baa748c80718`, commit `e0caef33`, NIESCALONY):**
Operator zbudował przełącznik Sprzedaż/Kupno w żywym formularzu (`diplomacyTradeBasket.ts`),
podpiął `receiveTechOptions` do trybu Kupna. **Znalazł i naprawił REALNY, wcześniej istniejący
bug niezwiązany z tym zgłoszeniem:** `executePnDealTransfer` nigdy nie czytał `techId` — stara
„sprzedaż" technologii przelewała WYŁĄCZNIE gotówkę, nigdy nie przekazywała technologii (zmierzone
przez Evaluatora na kodzie bazowym `9d886ced`). Naprawione nowym `executeTechTradeDeal` +
`resolveTechTradeParties`, oba kierunki symetryczne (potwierdzone niezależnie przez Evaluatora).

**Evaluator (Opus 5) werdyktem FAIL — trzy blokery, w tym trywialnie osiągalny exploit:**
1. **B1 (najpoważniejszy — exploit „darmowa technologia"):** `executeTechTradeDeal` przyznaje
   technologię PRZED próbą zapłaty i IGNORUJE zwracaną wartość transferu gotówki
   (`applyOneShotGoldTransfer` jest strict — brak środków = `{ok:false}`, zero transferu, ale
   nic tego nie sprawdza). Zmierzone na realnych modułach: gracz z 0 ¤ w trybie Kupna, cena 50,
   progi Relacji/Zaufania spełnione → **dostaje technologię za darmo**, zloto AI bez zmian. Tryb
   Sprzedaży: AI z 0 ¤ → gracz oddaje technologię i nic nie dostaje. Żadna warstwa wyżej tego nie
   łapie (`evaluateProposal case 'tech'` sprawdza tylko cenę i `techId`, nie skarbiec płatnika).
2. **B2 (zero pokrycia mutacyjnego okablowania):** mutacja Evaluatora w `executeTechTradeDeal`
   (grant zawsze do `responderId`, gotówka zawsze proposer→responder — dokładnie błąd, który ten
   commit ma naprawiać) **przeżywa cały pakiet bramek** (29× `diplomacy-*-test.cjs` zielone,
   `logic-test` 213/213). Testowana jest czysta funkcja `resolveTechTradeParties`, nie to czy
   wynik jest faktycznie używany poprawnie.
3. **B3 (naruszenie pisemnej decyzji, nie tylko specyfikacji danych):** Operator świadomie pominął
   wymianę tech-za-tech („uproszczenie na własną odpowiedzialność") — ale decyzja `R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1.md`
   mówi wprost: „gracz może też otrzymać technologię od AI, płacąc gotówką **LUB oddając inną
   technologię**". To wycięcie połowy zatwierdzonego trybu, nie decyzja do podjęcia przez
   Operatora — wymaga nowego pytania ABC do właściciela (patrz niżej).

**Noty (do naprawy w rundzie 2, nieblokujące same w sobie):** N1 (przycisk Kupna aktywny mimo
pustej listy technologii — `readTreatyStateFromDom` czyta stary DOM przy przełączeniu kierunku,
klik kończy się bez komunikatu), N2 (`techPrice` i `goldOnce` rozjeżdżają się po kontrofercie AI
na trudności Łatwy — etykieta pokazuje jedną liczbę, transfer wykonuje inną), N4 (brak testu
save/load dla nowego pola `techDirection` — strukturalnie bezpieczne, ale nieprzypięte), N5
(worktree 9 commitów za HEAD, realny konflikt tekstowy w `diplomacy-tech-trade-test.cjs` z dziś
scaloną `P-BRAMKA-TECH-TIER-WARSTWA2-NIEPOKRYTA` — rozwiązywalny, ale wymaga ręcznego scalenia
nagłówków, nie automatycznego).

**Runda 2 dispatched** wyłącznie dla B1/B2/N1/N2/N4 (bugi niezależne od odpowiedzi na pytanie
zakresu) — bramka płatności musi być naprawiona niezależnie od wyniku ABC. Osobne pytanie ABC do
Macieja o B3 (zakres tech-za-tech) zadane równolegle.
**Kotwice:** `gra/src/main.ts` (`executeTechTradeDeal` ok. linii 7351-7376),
`gra/src/game/diplomacy-tech-trade.ts` (`resolveTechTradeParties`),
`gra/src/ui/diplomacyTradeBasket.ts` (`readTreatyStateFromDom`, `validateTreatyForm` case '6'),
`gra/src/game/diplomacy-proposals.ts` (`case 'tech'`, `generateCounterOffer`).
**Model:** Sonnet 5 (Operator) + Opus 5 (Evaluator).

## R-HANDEL-SUROWIEC-ILOSC-DOSTEPNA-CHIP (2026-08-08, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa:** „jeżeli chcemy się wymieniać surowcami pod symbolem surowca powinna być
liczba tych surowców, które mamy dostępne i pomyśl o tym, że trzeba będzie przewidzieć, że
tych surowców będzie kiedyś znacznie więcej, więc musi być w jakiś sposób czytelny pokazywania
tej większej ilości surowców."
**Objaw (zrzut, koszyk wymiany, sekcja „Surowiec (pakiety ×10)"):** chipy Drewno/Kamień/Glina
pokazują tylko ikonę i nazwę — **bez liczby posiadanego zapasu**. Gracz musi zgadywać, ile ma,
zanim doda pakiet do oferty.
**Dwa osobne wymagania w zgłoszeniu:** (1) dopisać liczbę dostępnego zapasu pod/przy każdym
chipie surowca — analogicznie do wzorca, który już istnieje w `buildEmpireResourceRows`
(main.ts) i w panelu imperium (`stock`); (2) **zaprojektować układ skalowalny** — dziś 3
surowce w rzędzie, docelowo może być ich znacznie więcej (kolejne epoki/surowce) — sam dopisek
liczby nie wystarczy, trzeba przemyśleć siatkę/scroll/kategorie, żeby nie rozjechało się przy
większej liczbie pozycji.
**Kotwice:** `gra/src/ui/diplomacyTradeBasket.ts` (chipy surowców w koszyku wymiany).
**Model:** jeśli zmiana dotknie układu/renderowania wizualnego — do ustalenia czy to
`render/**` czy czysty DOM/CSS w `ui/**` (prawdopodobnie to drugie, Sonnet 5 wystarczy).

**NAPRAWIONE (2026-08-08):** Widoczna odznaka (nie tylko `title` na hover) z ilością zapasu
pod każdym chipem po stronie „daję" (`side==='give'`), źródło `maxQty` (realne sztuki, nie
pakiety — potwierdzone niezależnie przez Evaluatora w `main.ts:2327-2339`). Kompaktowy format
(`formatCompactQty`: <1000 wprost, ≥1000 → „1.2k"/„1.2M") adresuje wymaganie (2) na dzisiejszą
skalę (13 surowców w katalogu, 3 chipy naraz) — pełna siatka/scroll/kategorie świadomie uznane
za nieproporcjonalne, do rewizji gdyby katalog realnie urósł. Strona „dostaję" bez odznaki
(zgłoszenie mówiło o „które MAMY"). Runda 1: FAIL (worktree stale, `maxPakiety` zamiast
`maxQty` — 10× za niska wartość). Runda 2: PASS-WITH-NOTES, worktree naprawione przed
kodowaniem (fast-forward na aktualny HEAD, zweryfikowane), `tsc` 0 błędów, wszystkie 31 plików
testów dyplomacji zielone. Nota Evaluatora (nieblokująca, poprawiona przy scaleniu): komentarz
w kodzie błędnie sugerował że odznaka na „dostaję" ujawniłaby zapasy AI — `title`/`data-max` już
dziś ujawniają je bezwarunkowo dla obu stron, jedyny realny powód wyłączenia to zawężenie
zakresu zgłoszenia, nie ujawnianie informacji.

## R-PROPOZYCJA-BRAK-EDYCJI (2026-08-08, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa:** „nie ma możliwości edytowania propozycji. Jest tylko możliwość usunięcia.
Przecież miała być możliwość jeszcze edytowania."
**Potwierdzone w kodzie:** `gra/src/ui/diplomacyTradeBasket.ts:1177` renderuje wyłącznie
przycisk „Usuń" (`.cdb-rm`) przy każdym wierszu propozycji — **żaden przycisk „Edytuj" nie
istnieje w tym pliku** (sprawdzone grepem, zero trafień). Nieznane jeszcze: czy edycja była
kiedyś zaplanowana/obiecana w jakimś dokumencie decyzji (do sprawdzenia), czy to od początku
brakująca funkcja.
**Kotwice:** `gra/src/ui/diplomacyTradeBasket.ts` (~linia 1177, render przycisku), panel
propozycji ze zrzutu — prawdopodobnie `diplomacyAudience.ts` / `diplomacyDealDisplay.ts` /
`diplomacyNegotiationModal.ts` (zawierają „wygasa za"/„TWOJA PROPOZYCJA" — niezweryfikowane
który dokładnie renderuje ten konkretny widok kolumnowy).
**Model:** Sonnet 5 (poza `render/**`).

**NAPRAWIONE (2026-08-09):** Przycisk „✎ Edytuj" obok „✕" dla edytowalnych typów pozycji koszyka
(`zloto, praca, zywnosc, tech, surowiec_ilosc`) w `gra/src/ui/diplomacyTradeBasket.ts` — reużywa
`buildAddForm` z nowym `editItem`, pre-wypełnia bieżącą wartość, podmienia pozycję w miejscu.
Zagateowany członkostwem typu w `availableTypes` (wojna blokuje zloto/praca, tech poniżej progu
Relacji na stronie receive — nie pozwala „Zapisz zmiany" po cichu zamienić typu). 3 rundy:
runda 1 FAIL (worktree stale, konflikt niescalalny, zero testów edycji), runda 2 FAIL (bug w
gatingu „Usuń" na karcie traktatu, opisany niżej), runda 3 PASS-WITH-NOTES po rebase na aktualny
HEAD — Evaluator zweryfikował własnym harnessem (nie kopią testu Operatora) że edycja działa dla
wszystkich 5 typów. Nowy test `diplomacy-basket-edit-test.cjs` 25/25. `tsc` 0 błędów.

## BUG-PROPOZYCJA-KASACJA-PUSTEJ-STRONY-KASUJE-CALOSC (2026-08-08, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa:** „jeżeli my dajemy umowę surowców, po drugiej stronie nie musi być umowy
wymiany surowców, jeżeli ta druga strona nic nie daje. I w takiej sytuacji jeżeli usuniemy
u drugiej strony to nic nie daje, usuwa się też cała nasza propozycja. To w ogóle jest
nielogiczne."
**Objaw (zrzut):** kolumna „Oni oferują" pokazuje kartę „Umowa wymiany surowców" z pustą
treścią („—", nic nie oferują) — sparowaną z realną kartą „Umowa wymiany surowców" w „My
oferujemy" (250 Drewno + 5 ¤). Usunięcie **pustej** karty po stronie „Oni oferują" kasuje
też **naszą realną** propozycję po drugiej stronie — kaskada usuwania między niepowiązanymi
(z perspektywy gracza) kartami.
**Do zbadania:** czy te dwie karty są w silniku POŁĄCZONE jako jedna transakcja (co
uzasadniałoby kaskadę, ale wymaga innego UI — np. „usuń całą wymianę" zamiast dwóch osobnych
przycisków „Usuń"), czy to błąd w logice usuwania, który przypadkiem kasuje więcej niż wskazany
indeks/wiersz.
**Kotwice:** te same pliki co `R-PROPOZYCJA-BRAK-EDYCJI` — panel propozycji pokazany na zrzucie,
logika usuwania powiązana z ID/parą propozycji.

**ZDECYDOWANE (2026-08-08):** `R-PROPOZYCJA-KASACJA-UI-Q1=A` (`docs/decyzje/R-PROPOZYCJA-KASACJA-UI-Q1.md`)
— ukryj przycisk „Usuń" na pustej/mirror karcie, zostaw jeden aktywny na karcie z treścią.

**NAPRAWIONE (2026-08-09):** Nowa `negotiationTableDealSideHasContent()`
(`gra/src/ui/diplomacyDealDisplay.ts`), wołana z `negotiationCardActionsHtml`
(`diplomacyAudience.ts`) przez wspólny helper `dealSideTreatyInfo()` — jedno źródło prawdy dla
render i gatingu, żeby nie rozjechały się niezależnie. Runda 2 dostała FAIL: gating dla
traktatów bilateralnych (NAP/sojusz) wymagał dodatkowo `pw > 0`, którego render NIE MA — traktat
z PW=0/undefined widocznie pokazywał treść, ale tracił „Usuń" (odwrotnie niż decyzja A). Runda 3:
naprawione na `treatyFallbackLabel != null`, zgodne z render `if (treatyFallbackLabel)`;
Evaluator rundy 3 znalazł jeszcze jedną drobną niezgodność (`!= null` vs truthy dla edge case
`label===''`, dziś nieosiągalny) — poprawione przy scaleniu na `!!treatyFallbackLabel`, dokładnie
zgodne z renderem. Traktaty bez koszyka zachowują „Usuń", karty z realną treścią też — kontrola
pozytywna zweryfikowana niezależnym harnessem Evaluatora (nie kopią testu Operatora).
Testy: `diplomacy-basket-edit-test.cjs` 25/25, `diplomacy-proposal-test.cjs` 126/126,
`diplomacy-negotiation-table-test.cjs` 54/54, `diplomacy-test.cjs` 148/148,
`hud-moc-warstwa-test.cjs` 28/28, `tsc` 0 błędów. STRICT-PARITY: wyłącznie UI gracza.
**Model:** Sonnet 5 (poza `render/**`).

## R-DYPLO-CENY-SUROWCOW-PW + BUG-PAKIET-BILANS-DODATNI-BLOKADA (2026-08-08, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja

### Część 1 — tabela cen (na żądanie: „wypisz mi wartość surowców jakie mamy przypisane")
**Potwierdzone w kodzie:** „40" pokazane przy 4 pakietach Drewna (pakiet ×10) **to Punkty
Wymiany (PW/PN), nie surowa liczba sztuk** — w tym konkretnym przypadku liczbowo się pokrywa,
bo cena Drewna wynosi dokładnie 1 PN/szt. Źródło: `gra/data/econ-params.json` →
`handel_surowce`, ta sama cena na wszystkich trudnościach (`easy`/`normal`/`hard` identyczne):

| Surowiec | Cena (PN/szt.) |
|---|---:|
| Drewno | 1 |
| Glina | 2 |
| Sól | 2 |
| Kamień | 3 |
| Ruda miedzi | 5 |
| Koń | 5 |
| Cegła | 5 |
| Ceramika | 5 |
| Ruda żelaza | 10 |
| Brąz | 15 |
| Żelazo | 20 |
| Węgiel | 20 |
| Stal | 25 |
| Złoto (surowiec) | 50 |

Pakiet = 10 szt. (`pakiet_wielkosc`). PN pozycji = cena × pakiety × 10.
**Jego obawa („zbyt łatwo przekupić surowcami"):** Drewno przy 1 PN/szt. jest najtańsze i
zwykle najliczniej magazynowane — 250 Drewna (widziane w innym zrzucie tej rozmowy) to **250
PN**, więcej niż baza 80 PW pełnego traktatu handlowego. Temat wart analizy: czy tania,
masowa produkcja Drewna nie omija ekonomicznego sensu droższych surowców w handlu
dyplomatycznym. **Nie zdiagnozowane jeszcze jako bug** — to pytanie balansu do ABC, nie
potwierdzony błąd.

### Część 2 — BUG: pakiet z dodatnim bilansem i tak blokuje akceptację
**Jego słowa:** „co gorsza, chociaż bilans jest na plusie, to i tak nie mogę zaakceptować i
przyjąć tej oferty. Prawdopodobnie to jest jakiś regres z przeszłości."
**Objaw (zrzut, pakiet 2 umów: Traktat handlowy + Umowa wymiany surowców):** panel „PUNKTY
WYMIANY" pokazuje **MY ODDAJEMY 94 PW · BILANS (NETTO) +14 · ONI ODDAJĄ 80 PW** — zagregowany
bilans całego pakietu jest DODATNI. Mimo to poniżej: „Nie spełnia warunków: Brakuje 26 PW do
uczciwej oferty traktatu handlowego @ Relacji (baza 80 PW) — oferta nieuczciwa dla partnera" —
**Przyjmij zablokowany**.
**Przyczyna zlokalizowana w kodzie** (`gra/src/game/diplomacy-proposals.ts:1073-1090`, komentarz
`R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1=A`): bramka uczciwości dla `umowa_handlowa`/`umowa_szlakow`
liczy **WYŁĄCZNIE PW TEGO JEDNEGO traktatu** (`treatyBaseFairnessGap(treatyBasePn, givePn,
receivePn, relTotal)`) — **nie widzi** nadwyżki z innej umowy w tym samym pakiecie
(„Umowa wymiany surowców", 40 PW netto na naszą niekorzyść/korzyść zależnie od strony). To
było **świadome** (komentarz: „traktat handlowy bez koszyka przy niskiej Relacji dalej wymagał
dopłaty zamiast przechodzić za darmo") — ale **UI wprowadza w błąd**, bo panel „Bilans (Netto)"
sugeruje ocenę na poziomie całego pakietu, podczas gdy bramka akceptacji działa per-umowa.
**Powiązane, już znane w tej sesji:** `R-DYPLO-9CC7C76C-ZAKRES-NIEUDOKUMENTOWANY` (nota
Evaluatora BUG-TRAKTAT-KOSZYK-REGRESJA, „nie naprawiać teraz, poza zakresem =A") — ten sam obszar
kodu, już wcześniej oznaczony jako niedomknięty.
**Do decyzji:** czy pakiet wielu umów ma być oceniany zbiorczo (bilans pakietu decyduje) czy
per-umowa (każda musi sama spełnić próg) — dziś jest per-umowa, ale UI pokazuje zbiorczy bilans
jakby to on decydował. Minimum: komunikat/UI powinny być spójne z tym, co faktycznie bramkuje.
**Kotwice:** `gra/src/game/diplomacy-proposals.ts` (`treatyBaseFairnessGap`, linia ~1082),
`gra/src/ui/diplomacyAcceptanceBalance.ts` (panel „Punkty Wymiany", agregacja pakietu).
**Model:** Sonnet 5 (poza `render/**`).

**NAPRAWIONE (2026-08-08):** Decyzja `R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2=A` (`docs/decyzje/R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2.md`).
Przyczyna: bramka uczciwości liczyła PW wyłącznie per-traktat (`umowa_szlakow`/`umowa_handlowa`), nie widząc
nadwyżki z siostrzanej pozycji w tym samym pakiecie („Umowa wymiany surowców"), co dawało niespójność
z panelem „Bilans (Netto)". Naprawa: `ProposalEvalContext` rozszerzony o `packageSiblingGivePn`/
`packageSiblingReceivePn`, liczone przez nową `packageSiblingPn()` w `main.ts` i wpięte WYŁĄCZNIE w gałąź
traktatową (`umowa_szlakow`/`umowa_handlowa`) — `pokoj` i inne akcje bez zmian (zgodnie z zakresem Q2=A).
Naprawiony też błąd kolejności: `handleNegotiationAcceptPackage` i `resolvePendingNegotiationsForOwner`
budują teraz mapę `siblingByTreatyId` JEDNORAZOWO przed pętlą wykonania, zamiast liczyć siostrzaną pozycję
na żywo w trakcie pętli (poprzednia wersja traciła dane o już wykonanej pozycji siostrzanej — pozycje
w `negotiationTable` są usuwane przez `resolveNegotiationEntryAt` w miarę wykonania). Usunięto 3 zduplikowane,
nadmiarowe sprawdzenia `acceptanceTheir.accepted` per-pozycja (2× `diplomacyAcceptanceBalance.ts`,
1× `diplomacyAudience.ts`) na rzecz jednego już pakieto-świadomego `responderPreview`.
Ewaluator: runda 1 PASS-WITH-NOTES (test źródłowy używał słabego sprawdzenia `indexOf()`, które — jak
wykazał Ewaluator wstrzykując realną regresję — nie łapało błędu kolejności mimo zielonego wyniku 17/17;
plus nieścisły komentarz o zakresie wykluczenia `pokoj`). Runda 2 PASS — Ewaluator samodzielnie zweryfikował
przez wstrzyknięcie dokładnej regresji w OBA miejsca (`handleNegotiationAcceptPackage` i
`resolvePendingNegotiationsForOwner`) i potwierdził, że nowy detektor `nearestEnclosingForBlock()` w
`gra/tools/diplomacy-fairness-gate-package-q2-test.cjs` łapie oba przypadki (test spada z regresją, wraca
do zielonego po jej cofnięciu). STRICT-PARITY: potwierdzono, że istniejąca asymetria `treatyPnGate`
(`proposerIsTreatyPlayer`) jest przedwcześniejsza/celowo odłożona, nie wprowadzona tą poprawką.
Testy: `npx tsc --noEmit` 0 błędów · `diplomacy-fairness-gate-package-q2-test.cjs` 24/24 ·
`diplomacy-proposal-test.cjs` 126/126 · `diplomacy-stol-pw-sum-test.cjs` 26/26.
Zakres: dotyka tego samego obszaru kodu co `R-DYPLO-9CC7C76C-ZAKRES-NIEUDOKUMENTOWANY` (nota Evaluatora
BUG-TRAKTAT-KOSZYK-REGRESJA) — ta nota pozostaje osobno śledzona, nie jest tą poprawką zamknięta.

## R-HANDEL-PAKIETY-USUNAC (2026-08-08, decyzja właściciela) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa:** *„ok, zlikwiduj te pakiety, bo to będzie kompletnie niezrozumiałe dla graczy.
Po prostu podajemy sztuki. Jeden, dziesięć, sto i tak dalej. Żadnych pakietów! Usuń dla
wszystkich surowców pakiet."*
**Kontekst:** padło jako decyzja podczas rozmowy o `R-HANDEL-SUROWIEC-ILOSC-DOSTEPNA-CHIP`
(liczba zapasu w chipach koszyka) — właściciel doszedł do wniosku, że sama koncepcja
„pakietu ×10" w koszyku wymiany surowców jest nieintuicyjna niezależnie od tamtego tematu.
**Zakres:** usunąć „pakiet" jako jednostkę wejścia UI dla WSZYSTKICH surowców w koszyku
wymiany (`gra/src/ui/diplomacyTradeBasket.ts`) — zamiast „Liczba pakietów" (krok ×10) wejście
ma być wprost w sztukach, ze steperem +1/+10/+100 (jak podał: „Jeden, dziesięć, sto i tak
dalej"). Cena PN/szt. (`gra/data/econ-params.json:handel_surowce.cena_*`) się nie zmienia —
zmienia się tylko to, co gracz wpisuje i co widzi jako jednostkę.
**Kotwice:** `gra/src/ui/diplomacyTradeBasket.ts` (stepper/pole „Liczba pakietów"),
`gra/src/game/diplomacy-value-catalog.ts` (`DEFAULT_HANDEL_SUROWCE_PAKIET`,
`diplomacyHandelSurowcePakietWielkosc()`), `gra/data/econ-params.json`
(`handel_surowce.pakiet_wielkosc`).
**Model:** Sonnet 5 (poza `render/**`) — zwykły kod UI/logika handlu, nie render.

**NAPRAWIONE (2026-08-08):** `BasketItem.ilosc` dla surowców ilościowych to teraz sztuki
wprost (nie pakiety) w całym łańcuchu — cena, transfer jednorazowy, dostawa cykliczna „co
turę", oferty AI. `pakiet_wielkosc` (10) przetrwał wyłącznie jako próg heurystyki niedoboru
AI, nie jako mnożnik. Evaluator (Opus 5) PASS-WITH-NOTES po 2 rundach — runda 1 złapała 2
zepsute pakiety testów zgłoszone jako naprawione (nie były) i realny błąd: nazwa surowca z
metadanymi przeciekała do wiadomości AI („Drewno — dost. 40" zamiast „Drewno"); runda 2
potwierdziła obie poprawki niezależnie (własna reprodukcja Evaluatora, nie zaufanie
raportowi). 19 pakietów testów, wszystkie zielone, `tsc` czyste.
**Nota do wiedzy (niska pilność):** `computeQuickDealBasket` („Szybka umowa") nie ma żadnego
testu — poprawiona wartość startowa (10 szt., nie 1) jest dziś niczym niechroniona przed
przyszłą regresją.

## BUG-CYWILIZACJA-BEZ-GRANIC + BRAK-WZROSTU-LUDNOSCI (2026-08-08, playtest Macieja) · STATUS: **CZĘŚĆ POPULACJA: ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja (`docs/decyzje/R-AI-FOUNDING-THROTTLE-Q1.md`) · **CZĘŚĆ GRANICE: ZDEPLOYOWANE `ce69cf45` FALA 262 — naprawiona fragmentacja obrysu, do potwierdzenia playtestem czy to wyczerpuje objaw**
**Jego słowa:** *„odkryłem już, dlaczego czasem wydawało się, że cywilizacji nie jest tyle, ile
być powinno. Dlatego, że część cywilizacji w ogóle nie dostaje granic w kolorze. I wygląda
jakby ich nie było. Dodatkowo, te cywilizacje kompletnie się nie rozwijają po czasy. Inne mają
4-5 już ludności, to te mają po jednym. Chyba że się mylę bo to jest jedna cywilizacja Zulusi
być może tak szybko stawiała miasta że zjadała swoją ludność. Nie mniej jednak nie mają granic
wygląda jak by ich nie było na mapie trzeba dopiero odkryć mapę i pojawiają się ale bez
granicy."*
**Objaw (2 zrzuty załączone):** na mapie widoczne liczne miasta cywilizacji „Zulusi"
(Ondini, Nobamba, KwaBulaw…, Umgungun…, Kwadukuza, Isandlwana, Kwagqokli, Mahlabat…,
Nodwengu, Babanango — 10 miast) — **żadne nie ma kolorowego obrysu terytorium** na mapie
(inne cywilizacje w kadrze, np. w tle, mają widoczne granice). Każda etykieta miasta Zulusi
pokazuje populację **„1"**, podczas gdy inne cywilizacje mają 4-5.
**Hipoteza właściciela:** dwa zjawiska mogą być powiązane — cywilizacja tak agresywnie
zakłada nowe miasta (osadnicy), że „zjada" własną ludność zamiast pozwolić jej rosnąć; brak
granic może być tym samym efektem (terytorium nigdy nie „dojrzewa" bo miasta nie rosną) albo
osobnym bugiem renderowania granic niezależnym od populacji.
**WYNIK DOCHODZENIA (2026-08-08, agent Explore, read-only):**

**A) Populacja utknięta na 1 — PRZYCZYNA POTWIERDZONA, dobrze uzasadniona kodem.**
Hipoteza właściciela („zjada swoją ludność") trafna. Łańcuch:
- `gra/src/game/city-founding.ts:31-36` (`foundCityPopulationCost`) — założenie nowego miasta
  kosztuje **1 pkt ludności** (`zaloz_miasto_koszt_ludnosci`, `gra/data/miasto-params.json`),
  pobierane z miasta źródłowego, NIE z produkcji/surowców.
- `city-founding.ts:60-76` (`pickSourceCityForFounding`) — źródłem zawsze jest miasto
  z **najwyższą aktualną populacją** w danej cywilizacji.
- `city-founding.ts:66-68` — próg minimalny dla AI to `AI_FOUNDING_SOURCE_MIN_POP = 2` —
  **każde miasto, które urośnie z 1→2, jest natychmiast kandydatem do zebrania**.
- `gra/src/game/ai.ts:1818-1868` (`planCityFounding`) sprawdza to **co turę AI**, bez żadnego
  „poczekaj aż populacja się odbuduje" — do 2 nowych miast/turę
  (`AI_COLONIZATION_SURGE_MAX_PER_TURN = 2`, `ai.ts:792`).
- **Efekt:** gdy tylko któreś miasto Zulusów urośnie 1→2, AI natychmiast traktuje je jako
  „największe" i zbiera z powrotem do 1, żeby założyć kolejne miasto — samopodtrzymująca się
  pętla 1↔2, widoczna jako trwałe „1" na każdym mieście. Dokładnie zgodne ze zrzutem (10 miast,
  każde „1").
- **Czynniki wzmacniające specyficzne dla Zulusów:** `gra/data/civ-matrix.json` (wiersz
  Zulusi, ~linia 1375) `"lud_wzrost_proc": -0.05` — **jedyna/jedna z niewielu cywilizacji
  z karą do wzrostu ludności** (-5 pkt proc. do tempa wzrostu, `population-growth-v85.ts:171-182`),
  wydłuża czas powrotu 1→2 i zwiększa ekspozycję na kolejne „zbiory". Dodatkowo
  `gra/data/civ-ai.json:51-60` — Zulusi mają `agresywnosc: 9` i `ekspansywnosc: 4`, jedne
  z najwyższych w rejestrze cywilizacji → ta AI trafia w pętlę częściej/mocniej niż spokojniejsze.
- **To NIE jest zepsuty wzrost** (`applyPostCentralPopulationGrowth`,
  `population-growth-v85.ts:319-391` działa jednolicie dla wszystkich właścicieli, brak
  pominięcia per-cywilizacja) — to interakcja projektowego kosztu osadnika (populacja) z
  nieodhamowaną, priorytetową pętlą zakładania miast AI.
- **Do decyzji (ABC potrzebne, wpływa na balans/AI):** dodać throttle w `planCityFounding`
  (np. wymagany odstęp tur od ostatniego „zbioru" tego miasta, albo podniesienie
  `AI_FOUNDING_SOURCE_MIN_POP` powyżej 2, albo wymóg nadwyżki żywności/bufora przed zbiorem).

**B) Brak granic — NIE ZNALEZIONO jednoznacznej przyczyny, dwie hipotezy odrzucone dowodami z kodu.**
- **Odrzucone:** brak „odkrycia"/spotkania cywilizacji jako warunku — taki warunek **nie
  istnieje w kodzie**. Jedyny filtr widoczności granic (`main.ts:8899-8913`,
  `refreshTerritoryBorderOverlay`) to czysta własność heksu + fog-of-war (`vis.has(key) ||
  explored.has(key)`) — mechanika „odkryj mapę i granica się pojawi" jest architektonicznie
  poprawna i powinna działać.
- **Odrzucone:** brak koloru cywilizacji — `civColorForOwner`
  (`gra/src/game/civ-visual.ts:59-70`) zawsze zwraca kolor; Zulusi mają jawny
  `kolorHex: "#2E7D32"` w `gra/data/civs.json:711` (ciemna zieleń — UWAGA: wizualnie zbliżony
  do standardowego „zielonego" koloru gracza/innej cywilizacji, osobny, drobny problem
  czytelności, nie przyczyna zniknięcia).
- **Odrzucone:** populacja 1 zerująca promień terytorium — `cityRangeForPopulation`
  (`gra/src/game/okolica.ts:46-50`) daje promień min. 5 nawet dla populacji 1 (floor
  `CITY_RANGE_MIN=5`), więc samo utknięcie na populacji 1 nie powinno zerować terytorium.
- **Pozostała, niesprawdzona jeszcze hipoteza:** `territoryOwnerAt()`
  (`gra/src/map/territory.ts:106-125`) rozstrzyga remisy „kto jest właścicielem heksu" na
  rzecz węzła wcześniejszego w tablicy `cities` — w połączeniu z bardzo gęstym, ciasno
  skupionym osadnictwem Zulusów (10 miast blisko siebie) może to wchodzić w konflikt z
  `traceTerritoryBoundaryLoops` (`gra/src/map/territory-border.ts:150`, śledzenie krawędzi
  wielokątów) na złożonych/nakładających się zbiorach heksów. **Wymaga weryfikacji na żywym
  zapisie** (np. zalogowanie `byOwner.get(zulusiOwnerId)?.size`), nie da się potwierdzić samą
  lekturą kodu.

**Kotwice:** populacja — `gra/src/game/city-founding.ts` (`foundCityPopulationCost`,
`pickSourceCityForFounding`), `gra/src/game/ai.ts` (`planCityFounding`, ~linia 1818),
`gra/data/civ-matrix.json` (Zulusi `lud_wzrost_proc`), `gra/data/civ-ai.json` (Zulusi
`agresywnosc`/`ekspansywnosc`). Granice — `gra/src/map/territory.ts` (`territoryOwnerAt`),
`gra/src/map/territory-border.ts` (`traceTerritoryBoundaryLoops`) — wymaga dalszej diagnozy
runtime.
**Model:** populacja/AI → Sonnet 5 (`game/**`); jeśli naprawa granic dotknie `render/**` →
Opus 5 per zgoda stała CLAUDE.md §4.

**NAPRAWIONE — CZĘŚĆ POPULACJA (2026-08-08):** `AI_FOUNDING_SOURCE_MIN_POP` z 2 na 3
(`gra/src/game/city-founding.ts`). Evaluator (Opus 5) PASS-WITH-NOTES — potwierdził efekt
uczciwie: **pętla nie znika, tylko przesuwa się z 1↔2 na 2↔3** (świadomie zaakceptowane
ryzyko z `docs/decyzje/R-AI-FOUNDING-THROTTLE-Q1.md`). Jeśli po playteście problem nadal
widoczny — do rozważenia wariant B (cooldown per-miasto) jako dopełnienie. `ai-test.cjs`
274/8 (8 pre-istniejących, niezwiązanych), `tsc` czyste.

**NAPRAWIONA FRAGMENTACJA OBRYSU — CZĘŚĆ GRANICE (2026-08-09, subagent Sonnet 5).** Hipoteza
„pozostała, niesprawdzona" z 2026-08-08 (wyżej) o `territoryOwnerAt()` (remisy właściciela
heksu) **odrzucona po weryfikacji na żywej symulacji** — nie miała znaczenia. Rzeczywista
przyczyna: `borderVertexKey()` w `gra/src/map/territory-border.ts` formatowała współrzędne
wierzchołka `toFixed(5)` bez normalizacji znaku przy zerze. Dwa sąsiednie heksy liczą WSPÓLNY
narożnik z DWÓCH różnych centrów (`hexCornerWorld` dla różnych (q,r)) — matematycznie ten sam
punkt, ale szum zmiennoprzecinkowy (~1e-16, z `Math.sin`/`Math.cos`) dawał z jednej strony
dokładnie `0`, z drugiej np. `-4.44e-16`: `(0).toFixed(5)="0.00000"`,
`(-4.44e-16).toFixed(5)="-0.00000"` — DWA różne klucze dla TEGO SAMEGO wierzchołka świata.
Efekt: `traceTerritoryBoundaryLoops` widziała tam wierzchołek stopnia 1 zamiast 2, przerywała
pętlę w tym miejscu i porzucała resztę obwodu (fragmentacja, gubione krawędzie). Im
gęstszy/bardziej symetryczny klaster miast względem world (0,0), tym więcej wierzchołków ląduje
dokładnie na osi zero — stąd bug ujawniał się przy gęstym osadnictwie (Zulusi, 10 miast, min.
dystans 4 heksy), nie przy pojedynczym izolowanym mieście.

**Fix:** `fixNegativeZeroString()` normalizuje `"-0.00000"` → `"0.00000"` przed użyciem jako
klucz wierzchołka. Zakres wyłącznie `gra/src/map/**` (logika, bez Three.js/render) — nie
wymagał Opus 5. Nowy test regresji `gra/tools/territory-border-dense-settlement-test.cjs`
(15 asercji, 3 scenariusze), zweryfikowany że łapie regresję (7/15 fail na kodzie sprzed
naprawy, 15/15 po naprawie).

Evaluator (Opus 5) **PASS-WITH-NOTES z niezależnym dowodem skuteczności**: zbudował osobny
bundel z wersji sprzed naprawy i porównał 400 losowych, gęstych kształtów terytorium —
**PRZED naprawą 32/400 wadliwe (141 zgubionych segmentów obwodu), PO naprawie 0/400**. Bramki
zmierzone niezależnie: `tsc --noEmit` czyste, `territory-border-test` 9/9,
`territory-border-dense-settlement-test` 15/15, `improvement-territory-gate-test` 6/6,
`border-march-scan-test` 15/15, `border-march-wygasanie-test` 26/26,
`diplomacy-border-march-test` 39/39, `fair-play-grid-test` 8/8, `logic-test` 213/213 —
wszystkie potwierdzone ponownie w drzewie głównym po scaleniu, identyczne liczby.
`fair-play-tier-grid-test` 9/12 (3 fail pre-istniejące — progi gór/wzgórz, C-MAPA-Q1=B,
potwierdzone identyczne w drzewie sprzed naprawy, test importuje wyłącznie `map/gen-helpers`).

**Zastrzeżenie Evaluatora ważne dla playtestu (powód złagodzenia statusu wyżej z „NAPRAWIONE"
na „naprawiona fragmentacja obrysu"):** rozszerzona próba na 4000 gęstych kształtów sprzed
naprawy pokazała że obrys **nigdy nie znikał w całości** (0 przypadków `loops.length === 0`)
— był poszarpany/niepełny (od ~94% do najgorzej ~70% pokrycia obwodu). Zgłoszenie Macieja
brzmiało „część cywilizacji w ogóle nie dostaje granic w kolorze — wygląda jakby ich nie było".
Ten fix naprawia udowodniony, realny błąd fragmentacji, ale zebrany materiał nie dowodzi że
wyczerpuje objaw „granicy nie ma WCALE". **Do potwierdzenia playtestem.** Jeśli objaw wróci,
drugim podejrzanym jest ścieżka w której cywilizacja dostaje zbiór 0 heksów
(`buildTerritoryBorderGroup` pomija takich właścicieli) — niepotwierdzone, tylko hipoteza do
sprawdzenia.

**Do rejestru pre-istniejących, niezwiązanych czerwonych testów:** `budynek-civ-bonus-u17-test`
2 pass / 4 fail (identyczne komunikaty w drzewie sprzed i po naprawie — `kamien got 5, want 4`);
ten sam test był już wymieniony przy `P-TEST-UPKEEP-R-STAWKI` (2026-08-09).

**Poza zakresem (C-025):** populacja pozostaje nietknięta (throttle 2→3 z sekcji wyżej).

## R-HEKS-PLONY-UKRYTE-POD-MIASTEM (2026-08-08, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa:** *„w sytuacji gdy dane pole jest zajęte przez miasto to nie pokazuje się tam ile
jest dokładnie produkowane w tym miejscu surowców żywności i tak dalej."*
**Objaw (zrzut, okolice TEBY):** każdy heks w zasięgu miasta pokazuje trzy liczby z ikonami
(Praca/młotek, Żywność/kłos, Pieniądz/moneta — np. „6 / 3 / 5"), ale heksy zajęte przez samo
miasto (zielone kółko z sylwetką osoby) **nie pokazują żadnych liczb** — puste. Gracz nie
widzi ile dokładnie dany heks miejski produkuje, tylko że jest „aktywny" (zielony).
**Do zdiagnozowania:** kod rysujący nakładkę plonów heksu (prawdopodobnie
`gra/src/render/**` lub `gra/src/ui/**`, warstwa „yields"/„plony") — sprawdzić czy jest
warunek pomijający rysowanie liczb, gdy `hex.cityId`/`hex.owner` wskazuje na zajęcie przez
miasto, i czy dane produkcji dla heksu miejskiego w ogóle istnieją w silniku (być może miasto
zjada/zeruje bazowy plon terenu i faktycznie nic tam nie ma do pokazania — do sprawdzenia
zamiast zakładać).
**Kotwice:** `gra/src/render/cityOkolicaOverlay.ts` (pętla etykiet plonów).
**Model:** Sonnet 5 (przyczyna okazała się w warunku renderu, nie w 3D/geometrii).

**NAPRAWIONE (2026-08-08):** przyczyna (a) — render, nie silnik. Pętla etykiet w
`cityOkolicaOverlay.ts` (dodana w FALA 96, `daacd43a`) pomijała rysowanie liczb dla KAŻDEGO
heksu z „ulepszeniem" terenu (`hexHasCoveringTerrainImprovement`), **w tym także dla heksu
centrum miasta**, gdy ten niósł klasyfikację ulepszenia (częsty przypadek — `auto-improvements.ts`
nie wyklucza współrzędnych centrum miasta z kandydatów do automatycznego ulepszenia). Silnik
zawsze liczy realny, niezerowy plon centrum (`turn-economy.ts`, komentarz „Centrum ZAWSZE
daje plony... bez 👤"). Fix: wyjątek `key !== cityKey` w warunku pomijania — sąsiednie
prawdziwie ulepszone heksy nadal poprawnie pomijane. Evaluator (Opus 5) PASS-WITH-NOTES,
zweryfikowany niezależnie (1 call site funkcji, `tsc` czyste). Dwie notatki Evaluatora do
osobnej rejestracji: (1) render czyta tylko OSTATNIĄ warstwę `hex.ulepszenie`, silnik czyta
WSZYSTKIE warstwy — przy wielowarstwowych ulepszeniach na centrum render może zaniżać plon
(wcześniej niewidoczne, bo każdy ulepszony heks był całkowicie ukryty); (2) do potwierdzenia
na żywym zapisie: zgłoszenie mówiło o „zielonym kółku" (overlay pracy), a centrum miasta
faktycznie renderuje się na niebiesko — jeśli po deployu liczby nadal brakuje na ZIELONYCH
(nie niebieskich) heksach, to inny, nieobjęty tą naprawą problem (celowe pominięcie sąsiadów
z prawdziwym ulepszeniem).

## BUG-KOLEJKA-BUDOWY-PRZYCISKI-ROZJECHANE (2026-08-08, playtest Macieja) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
**Jego słowa:** *„jedno naprawiasz, drugie psujesz. Znowu jest problem, mianowicie coś co
wcześniej działało nagle przestało działać. Przesuwanie góra-dół i usuwanie z kolejki w trybie
budowania zarówno jednostek i budynków nie działa. Trzeba kombinować gdzie kliknąć. Niestety
gdzieś to po prostu jest rozjechane."*
**Objaw (zrzut, kolejka budowy „Pałac"/„Palisada drewniana"):** przyciski ↑ (przesuń w górę),
↓ (przesuń w dół), ✕ (usuń) przy pozycjach kolejki budowy — kliknięcie w widoczny przycisk
często nie trafia w jego handler; trzeba „kombinować gdzie kliknąć" — obszar klikalny (hit
area) najwyraźniej nie pokrywa się z tym, co narysowane (offset/rozjazd CSS).
**Wagę podnosi explicite:** właściciel wprost nazywa to REGRESJĄ świeżej pracy („jedno
naprawiasz, drugie psujesz") — sugeruje, że jakaś niedawna zmiana w tym samym panelu
(kolejka budowy jednostek/budynków) przesunęła layout bez przeliczenia obszarów klikalnych.
**WYNIK DOCHODZENIA (2026-08-08):** dwa niezależne defekty flex-layoutu, oba w
`gra/src/ui/cityPanel.ts`, oba pochodzące z **tego samego, jednego commita sprzed 10 dni**
(`daacd43a`, 2026-07-29, „FALA 96 DEPLOY ALL: DOSTEP-SUROWCE-Q1"), **nie z pracy ostatnich
dni** — mimo że objawiło się dopiero dziś (dopiero teraz kolejka urosła / nazwa budynku była
dość długa, żeby ujawnić bug):
1. **Kolejka BUDYNKÓW — brak guardu przepełnienia etykiety.** Kolejka JEDNOSTEK (linia 6877)
   ma `qLabel.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;
   white-space:nowrap;'`. Kolejka BUDYNKÓW (linia 6957) ma tylko `qLabel.style.flex = '1';` —
   bez `min-width:0`/`nowrap`. Długa nazwa („Palisada drewniana") rozpycha wiersz, kontener ma
   `overflow-x:hidden`, więc część przycisku bywa wizualnie ucięta, choć jego obszar klikalny
   nadal istnieje gdzie indziej.
2. **Oba wiersze — przyciski bez `flex-shrink:0`.** `.civ-cs .btn` (linia 1697) nie ustawia
   `flex-shrink`, więc gdy etykieta+chip kosztu+chip ETA (wszystkie `flex-shrink:0`) zajmą
   miejsce, to WŁAŚNIE przyciski ↑/↓/✕ się kurczą poniżej wygodnego obszaru kliku — dokładnie
   „trzeba kombinować gdzie kliknąć".
**Sprawdzone (`git log`/`git blame`):** żaden commit z ostatnich 2 dni nie dotykał tego
fragmentu — jedyny niedawny commit w `cityPanel.ts` (`a51c364e`, 6 sierpnia) zmieniał tylko
kolorowanie kosztu w chipach rekrutacji, nic layoutowego. To NIE jest regresja świeżej pracy w
sensie „zepsute wczoraj" — to uśpiony bug z 29 lipca, ujawniony dopiero dziś przy dłuższej
nazwie budynku/dłuższej kolejce. Sprawdzone też pod kątem duplikatu: jedyny wcześniejszy wpis
o przyciskach kolejki to `BUG-KOLEJKA-ZWROT-SUROWCA` (WDROŻONE, FALA 201) — inny temat (zwrot
surowców po ✕, nie hitbox) — brak konfliktu/regresji własnej wcześniejszej naprawy.
**Zakres naprawy (wąski, zgodnie z C-025):** WYŁĄCZNIE dwie zmiany CSS w `cityPanel.ts`:
(a) skopiować `min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;` z
`qLabel` kolejki jednostek (linia 6877) do `qLabel` kolejki budynków (linia ~6957); (b) dodać
`flex-shrink:0` do przycisków wewnątrz `.qitem` — per C-026 zawęzić selektor do
`.civ-cs .qitem .btn` (NIE globalnie `.civ-cs .btn`, żeby nie dotknąć przycisków poza kolejką)
i sprawdzić grepem `.civ-cs .btn`/`class="btn` w `cityPanel.ts`, czy selektor rzeczywiście
trafia tylko w te trzy przyciski. Żadnych innych zmian.
**Kotwice:** `gra/src/ui/cityPanel.ts` — kolejka jednostek `qLabel` (linia ~6877), kolejka
budynków `qLabel` (linia ~6957), CSS `.civ-cs .btn`/`.btn-sm` (linie ~1697-1717), `.qitem`
(linia ~1850).
**Model:** Sonnet 5 (UI/CSS, nie render 3D).

**NAPRAWIONE (2026-08-08):** dwie zmiany CSS w `cityPanel.ts` — (1) `qLabel` kolejki budynków
dostał ten sam `min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`, co
kolejka jednostek już miała; (2) nowa, wąsko zawężona reguła `.civ-cs .qitem .btn{flex-shrink:0;}`
(NIE globalnie `.civ-cs .btn`, żeby nie dotknąć 4 innych grup przycisków w pliku poza kolejkami).
Zakres zweryfikowany przez Operatora i niezależnie przez Evaluatora (Opus 5, PASS-WITH-NOTES):
diff = dokładnie te dwie zmiany, żadnej innej linii; `.qitem` istnieje wyłącznie w tym pliku
w dwóch miejscach (obie kolejki); z 14 użyć klasy `.btn` w pliku tylko 6 (po 3 na kolejkę)
leży wewnątrz `.qitem`, pozostałe 8 poza zasięgiem nowej reguły — potwierdzone niezależnym
grepem Evaluatora, nie tylko samooceną Operatora. `npx tsc --noEmit` czyste (exit 0 na
głównym drzewie). Evaluator dodał notatkę: **wymaga playtestu** (długa nazwa budynku w
kolejce, sprawdzić wielokropek i trafialność ↑/↓/✕ za pierwszym kliknięciem) — to zmiana
czysto wizualna, w repo nie ma harnessu DOM/CSS do zautomatyzowania testu.

## R-PORTRET-PRODIKONA-DROPPED-CALLBACK (2026-08-08, znalezisko Operatora przy okazji BUG-IKONA-KULTURY-PLACEHOLDER) · STATUS: **NAPRAWIONE (kod) — czeka na deploy do ROBOCZA + playtest**
Operator naprawiający `BUG-IKONA-KULTURY-PLACEHOLDER` znalazł identyczny wzorzec błędu
(`if (cached === 'loading') return;` gubi callback zamiast go kolejkować) w dwóch innych
miejscach tego samego pliku: `requestLeaderPortraitImage` i `requestProdIconImage`
(`gra/src/render/cityMapStatChip.ts`). Nie powoduje zgłoszonego objawu (placeholder diamentu)
— przegrana wyścigu o portret spada na herb (już naprawiony), a przegrana o ikonę produkcji
gubi tylko glif produkcji do najbliższej zmiany klucza tekstury — ale to ten sam mechanizm
błędu, może dawać własne, niezgłoszone jeszcze objawy. Zostawione świadomie nietknięte
zgodnie z C-025 (zakres tamtego zlecenia = tylko 3 zgłoszone bugi). Do naprawy: taki sam
wzorzec kolejkowania callbacków jak w naprawie `BUG-IKONA-KULTURY-PLACEHOLDER`.
**Kotwice:** `gra/src/render/cityMapStatChip.ts` (`requestLeaderPortraitImage`,
`requestProdIconImage`).
**Model:** Opus 5 (render/**).

**NAPRAWIONE (2026-08-09):** Wzorzec kolejkowania z `requestCivSigilImage` (już 3-krotnie
zweryfikowany) powielony 1:1 na obie funkcje — własna mapa kolejek per zasób, helper
`queue*Callback` dopisujący (nie nadpisujący), `cached==='loading'` → kolejkuj zamiast `return`,
callback pierwszego zamawiającego też trafia do kolejki przed `loadImageInto`. Realny (nie
teoretyczny) wyścig: `_syncStatChip` buduje pigułkę osobno per miasto, więc dwa miasta tej samej
cywilizacji/epoki mogą zamówić ten sam portret w jednej klatce. Evaluator: PASS-WITH-NOTES,
własny dowód mutacyjny (4 warianty wstrzyknięcia regresji, wszystkie złapane), własna sonda
5 miast jednocześnie + przewiązanie w środku serii (kolejka nie ograniczona do pary).
`city-map-badge-test.cjs` 62/62 (baza sprzed naprawy: **49/49** — poprawka liczby z raportu
Operatora, tam błędnie „47", zweryfikowane niezależnie przez Evaluatora), `tsc` 0 błędów.
**Follow-up zarejestrowany osobno:** `P-STATCHIP-KOLEJKA-POWIELONY-WZORZEC` — trzy niezależne
kopie tego samego wzorca współbieżności w jednym pliku (sygnet, portret, ikona produkcji),
świadomie nieuogólnione (C-025, zakres tego zlecenia), do rozważenia przy czwartej kopii.

## P-STATCHIP-KOLEJKA-POWIELONY-WZORZEC (2026-08-09, nota Evaluatora R-PORTRET-PRODIKONA-DROPPED-CALLBACK) · STATUS: **NAPRAWIONE 2026-08-09 (refaktor) — czeka na deploy+playtest**
`gra/src/render/cityMapStatChip.ts` miał TRZY niezależne, strukturalnie identyczne kopie
tego samego wzorca kolejkowania callbacków przy równoległych żądaniach obrazka (sygnet
cywilizacji, portret władcy, ikona produkcji) — każda naprawiona osobno, w osobnym zleceniu,
w innym dniu. Evaluator: „ten bug istniał dokładnie dlatego, że naprawiono jedną kopię, a dwie
zapomniano".

**NAPRAWIONE (2026-08-09, subagent Opus 5, refaktor render/**):** nowy prywatny helper
`createImageRequestQueue()` (fabryka domykająca, `{request(key, resolveSrc, onReady), clearImages()}`)
— wszystkie trzy funkcje przepisane żeby korzystały z jednej instancji tego helpera zamiast
trzech niezależnych implementacji. Zero zmiany zachowania (dowiedzione: wyjście testu bajt w
bajt identyczne z bazą, 0 różnic w 66 liniach). `clearImages()` (nie surowe `.clear()`) wymusza
niezmiennik „czyścimy obrazki, NIGDY kolejki" przez kształt API zamiast tylko powtórzonego
komentarza.

Evaluator PASS-WITH-NOTES z bardzo dokładną weryfikacją: potwierdził linia-po-linii że
wszystkie trzy oryginalne funkcje miały bramkę `!svgFn` w IDENTYCZNYM miejscu (żadnego cichego
ujednolicenia rozjechanych wariantów), zweryfikował 7 wariantów mutacyjnych (3 własne dodatkowe
poza dowodem Operatora) — mutacja rdzenia wywala 16 asercji naraz u wszystkich trzech zasobów
naraz (dowód że logika jest realnie scalona, nie tylko przeniesiona), mutacje specyficzne dla
jednego zasobu (klucz cache, źródło obrazka) trafiają tylko ten jeden zasób — poprawnie, bo ta
logika Z DEFINICJI musi być per-zasób. `tsc` 0 błędów, `city-map-badge-test.cjs` 62/62
(identyczne z bazą), `logic-test` 213/213, `vite build` 799 modułów OK.

**Dwie bardzo niepilne noty Evaluatora (nie blokują, nie wymagają akcji):** (1) umiejscowienie
bramki `!svgFn` nie jest samo w sobie pokryte testem — Operator trafił bo przeczytał oryginał,
nie dlatego że bramka testowa by go poprawiła, jeśli ktoś kiedyś to „posprząta" żadna bramka
nie krzyknie; (2) `requestCivSigilImage`/`requestProdIconImage` nadal niosą identyczny
2-liniowy potok `prepareSvgForCanvas→svgToDataUri` — Evaluator rekomenduje ZOSTAWIĆ (dalsze
zwijanie byłoby nadmiarową abstrakcją, nie usterką).
**Kotwice:** `gra/src/render/cityMapStatChip.ts` (`createImageRequestQueue`,
`requestCivSigilImage`, `requestLeaderPortraitImage`, `requestProdIconImage`).
**Model:** Opus 5 (render/**).

## BUG-PAKIET-INCOMING-CZESCIOWA-AKCEPTACJA (2026-08-08, znalezisko Sędziego przy turnieju ABC R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest Macieja
Dla pakietów PRZYCHODZĄCYCH (`allIncoming`) panel liczy `canAccept = net &gt;= 0` na sumie
całego stołu (`diplomacyAcceptanceBalance.ts:252-254`), więc przycisk „Przyjmij" bywa aktywny
gdy suma jest dodatnia. Ale realne wykonanie (`main.ts:11977`,
`handleNegotiationAcceptPackage` → `handleNegotiationAccept` per `id`) woła
`previewIncomingPlayerAccept` osobno na każdą pozycję i odrzuca tę, która sama nie spełnia
progu — efekt: **pakiet stosuje się częściowo**, z komunikatem w toaście (`showHintMessage`)
zamiast blokadą całości. Niezależny od tego, jak rozstrzygnie się `R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2`.
**Kotwice:** `gra/src/ui/diplomacyAcceptanceBalance.ts:252-254`, `gra/src/main.ts:11977`.
**Model:** Sonnet 5.

**NAPRAWIONE (2026-08-08):** `canAccept`/`blockReason` w `balancePanelDataFromRows` liczone
teraz jednolicie z `row.responderPreview.accepted` dla KAŻDEJ akcjonowalnej pozycji (incoming
ORAZ own+awaitingAiResponse), zamiast osobnej gałęzi sumy netto dla `allIncoming`.
`responderPreview` to ta sama `previewNegotiationEntry`, którą backend woła przy realnym
wykonaniu (`handleNegotiationAccept`) — UI i wykonanie zgodne z definicji, nie przez przypadek.
`net` (suma PW) zostaje wyłącznie jako wyświetlany bilans, nie jako bramka. Evaluator:
PASS-WITH-NOTES, potwierdzone jedno źródło prawdy, brak kolizji z dzisiejszym
`R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2`, STRICT-PARITY OK (wyłącznie ścieżka UI gracza), 28 plików
testów dyplomacji zielonych (m.in. `diplomacy-test.cjs` 148/148, `diplomacy-proposal-test.cjs`
126/126, `diplomacy-acceptance-points-test.cjs` 225/225, `diplomacy-stol-pw-sum-test.cjs` 31/31
z nową reprodukcją dokładnego przypadku ze zrzutu — 94 vs 80, net +14, jedna pozycja
zablokowana). **4 noty niepilne, zarejestrowane osobno poniżej:** wizualna niespójność
panelu przy net ujemnym z przyciskiem mimo to aktywnym; fail-open (`canAccept=true`) przy braku
`responderPreview` (dziś nieosiągalne); rozluźnienie `legacyAccess`-gatingu, zgodne z
wykonaniem ale nietestowane; słaba asercja w jednym teście.

## P-DYPLO-PANEL-WIZUALNA-NIESPOJNOSC-VS-CANACCEPT (2026-08-08, nota Evaluatora BUG-PAKIET-INCOMING-CZESCIOWA-AKCEPTACJA) · STATUS: **CZĘŚCIOWO ZDEPLOYOWANE `ce69cf45` FALA 262 (tryb traktatu) — pozostaje otwarte dla gałęzi own+basket**
Dla traktatu incoming z net ujemnym (np. −20 PW), panel pokazywał klasę „no" (czerwony) i hint
„Brakuje N PW — dopłać do bilansu", ale jednocześnie werdykt „Spełnia warunki — możesz przyjąć"
i przycisk AKTYWNY. Powstawało bo `canAccept` przestał iść za `net` (naprawa wyżej), a cały
display nadal szedł za `net`. Funkcjonalnie poprawne (przycisk odzwierciedlał realną
akceptowalność), wizualnie mylące. Osiągalne przy Relacji &lt;100 (asymetryczne PW traktatu).

**NAPRAWIONE dla trybu traktatu (2026-08-09):** `balCls`/hint w gałęzi `isTreatyMode` idą teraz
za `data.canAccept`, nie za surowym znakiem `netPw`. Fallback (canAccept undefined, jedyny
wiersz „own" nie-awaitingAiResponse poza pakietem) zachowuje stare zachowanie. Evaluator
PASS-WITH-NOTES, `diplomacy-stol-pw-sum-test.cjs` 42/42 (było 26/26), `tsc` 0 błędów.

**Nadal OTWARTE — Evaluator wykazał próbą, że ta sama klasa niespójności jest osiągalna także
w gałęzi `!incomingTrade && !isTreatyMode` (własna oferta + koszyk, poza traktatem)** — zielony
pasek + hint „Nadwyżka N PW" obok werdyktu blokującego poniżej. Ta gałąź NIE została objęta
dzisiejszą naprawą (świadome zawężenie zakresu, C-025 — zlecenie dotyczyło konkretnego
zgłoszenia trybu traktatu).
**Kotwice:** `gra/src/ui/diplomacyAcceptanceBalance.ts` (`balancePanelDataFromRows`, gałąź
`!incomingTrade && !isTreatyMode`).
**Model:** Sonnet 5.

## P-DYPLO-RESPONDERPREVIEW-FAIL-OPEN (2026-08-08, nota Evaluatora BUG-PAKIET-INCOMING-CZESCIOWA-AKCEPTACJA) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest
Gdy `row.responderPreview` był `undefined` (pole opcjonalne w typie), `canAccept` domyślnie
wychodził `true` (bramka otwarta), nie bezpieczne `false`. Dziś `main.ts:12318` zawsze ustawia
preview, więc nieosiągalne w praktyce — ale brak testu i brak jawnego fallbacku na `false`.

**ZAMKNIĘTE (2026-08-09):** `balancePanelDataFromRows` ustawia teraz jawnie `canAccept=false` +
`blockReason` gdy `responderPreview` jest `undefined` na pozycji akcjonowalnej (incoming lub
own+awaitingAiResponse) — fail-closed zamiast fail-open. Evaluator PASS-WITH-NOTES,
`diplomacy-stol-pw-sum-test.cjs` 42/42, `tsc` 0 błędów. Scalone razem z naprawą wyżej (jeden
commit Operatora, `2e56050c`).
**Kotwice:** `gra/src/ui/diplomacyAcceptanceBalance.ts` (`balancePanelDataFromRows`).
**Model:** Sonnet 5.

## P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE (2026-08-08, nota Evaluatora przy R-HEKS-PLONY-UKRYTE-POD-MIASTEM) · STATUS: **ZDEPLOYOWANE `ce69cf45` FALA 262** — czeka na playtest
Render plonów (`yieldOfMapHex`, dziś w `gra/src/game/okolica.ts` — funkcja przeniesiona z
`main.ts` przed tą naprawą, stara kotwica `main.ts:9281` nieaktualna) czytał tylko OSTATNIĄ
warstwę `hex.ulepszenie`, silnik (`hexToWorkedTile` → `improvementKeysForHex`) sumuje WSZYSTKIE
warstwy z `hex.ulepszenia[]`. Wcześniej niewidoczne (każdy ulepszony heks był całkowicie
ukryty), po naprawie `R-HEKS-PLONY-UKRYTE-POD-MIASTEM` centrum miasta z wielowarstwowym
ulepszeniem mogło pokazywać zaniżony plon (mniej niż silnik faktycznie liczy).

**NAPRAWIONE (2026-08-09, subagent Sonnet 5).** `yieldOfMapHex` woła teraz
`improvementKeysForHex(h)` — ten sam helper co silnik — i przekazuje `ulepszenieKey`+
`ulepszeniaKeys` do `tileYield()` identycznie jak `hexToWorkedTile`. Zakres wyłącznie to
rozliczenie warstw, `gra/src/render/**` nietknięte.

Evaluator (Opus 5) **PASS-WITH-NOTES**, parytet `yieldOfMapHex` vs `hexToWorkedTile`
potwierdzony linia po linii (identyczne budowanie kluczy, obsługa `undefined`/pustej tablicy).
Dowód mutacyjny: cofnięcie fixu daje 12 pass/7 fail (dokładnie na przypadkach 2/3-warstwowych),
stałe oczekiwane zweryfikowane ręcznie wobec `terrain-yields.json`/`terrain-improvements.json`.
Własny harness Evaluatora (32/32) pokrył dodatkowe brzegi: brak ulepszeń, `null`/pusta tablica,
duplikat warstwy (dedup przez `Set`, brak podwójnego liczenia), 21 warstw naraz (suma zgodna
z JSON), heks poza mapą. Bramki zmierzone niezależnie w drzewie głównym po scaleniu, identyczne
liczby: `tsc` czyste, `heks-plony-warstwy-test` (nowy) 19/19, `okolica-test` 46/46,
`hex-plony-magazyn-test` 11/11, `plony-budynkow-test` 68/68, `tech-tree-test` 19/19,
`research-test` 33/33, `unit-replace-test` 13/13, `logic-test` 213/213.

**Cztery noty Evaluatora:**
1. Sprostowanie C-026: opis commita mówił „1 wywołanie w `main.ts`" — Evaluator naliczył **2**
   (`okolicaWorkedKeySet` i `yieldOf` do overlaya), suma 6 się zgadza, tylko rozbicie było
   błędne. Sprostowane tutaj.
2. `zloze` (złoże surowca) nie jest przekazywane do `tileYield()` w `yieldOfMapHex`, choć
   `hexToWorkedTile` je przekazuje — dziś nieszkodliwe (render zwraca tylko z/p/h, nie `ruda`),
   ale pułapka na przyszłość dla kogoś kto rozszerzy render o rudę. Zarejestrowane osobno:
   `P-HEKS-RENDER-ZLOZE-NIEPRZEKAZYWANE`.
3. **Ważniejsze niż „uboczne znalezisko" — to DRUGI CZŁON TEGO SAMEGO WZORU:**
   `foodPotentialOfMapHex` w tym samym pliku (`scoreOkolicaTile` łączy `yieldOf` z
   `potentialOf` w jedną liczbę rankingu) ma identyczny, nienaprawiony wzorzec (czyta tylko
   `h.ulepszenie`). Po tej naprawie oba człony wzoru NIE zgadzają się co do warstw — konkretny
   skutek: heks z wielowarstwowym ulepszeniem żywnościowym dostaje teraz poprawny (wyższy) plon
   farmy ORAZ nadal nienależny bonus potencjału, zawyżenie w rankingu auto-przydziału jest
   WIĘKSZE w liczbach bezwzględnych niż przed tą naprawą (nie regresja — oba człony były błędne
   już wcześniej, ale rozjazd teraz szerszy). Evaluator: „najtańszy możliwy follow-up, nie
   parkować bezterminowo" — ten sam jednolinijkowiec (`improvementKeysForHex(h)` zamiast
   ręcznego `[key]`, `okolica.ts:169-170`). Zarejestrowane osobno:
   `P-HEKS-POTENCJAL-ZYWNOSCI-WARSTWA-OSTATNIA` (podniesiona pilność względem pierwotnego
   zapisu Operatora — Evaluator zaleca zrobić przy najbliższej okazji, nie odkładać).
4. Hipoteza NIEZWERYFIKOWANA wykonaniem: `main.ts` (overlay) przekazuje `isWorkable`
   (wyklucza Morze/Góry), `cityWorkedTilesForEconomy` (silnik) nie przekazuje go wcale — overlay
   i ekonomia mogą różnić się co do tego, KTÓRY heks jest obsadzony. Zarejestrowane osobno jako
   hipoteza do sprawdzenia: `P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA`.
**Kotwice:** `gra/src/game/okolica.ts` (`yieldOfMapHex`), silnik `turn-economy.ts`
(`hexToWorkedTile`).

## P-HEKS-POTENCJAL-ZYWNOSCI-WARSTWA-OSTATNIA (2026-08-09, nota N3 Evaluatora P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE) · STATUS: **NAPRAWIONE 2026-08-09 — czeka na deploy+playtest**
`foodPotentialOfMapHex` (`gra/src/game/okolica.ts`) to drugi człon tego samego wzoru rankingu
co `yieldOfMapHex` (`scoreOkolicaTile` łączy oba w `tileAssignScore`) i ma identyczny,
NIEnaprawiony wzorzec: czyta tylko `h.ulepszenie` (ostatnią warstwę), nie
`improvementKeysForHex(h)`. Po naprawie `yieldOfMapHex` oba człony przestały się zgadzać co do
warstw — heks z wielowarstwowym ulepszeniem żywnościowym dostaje teraz poprawny (wyższy) plon
farmy ORAZ nadal nienależny `FARMA_POTENTIAL_FOOD_BONUS`, więc zawyżenie w rankingu
auto-przydziału pól przy `focus:'zywnosc'` jest WIĘKSZE w liczbach bezwzględnych niż przed
naprawą (nie regresja — oba człony były błędne już wcześniej, rozjazd między nimi jest nowy).

**NAPRAWIONE (2026-08-09, subagent Sonnet 5):** ten sam jednolinijkowiec co `yieldOfMapHex` —
`improvementKeysForHex(h)` zamiast ręcznego `[key]` w `okolica.ts` (`foodPotentialOfMapHex`).
Evaluator PASS-WITH-NOTES, dowód mutacyjny (cofnięcie fixu → 21/24, dokładnie 3 nowe asercje
padają, `okolica-test`/`logic-test` pozostają zielone pod mutacją — nowy test jest JEDYNYM który
łapie ten błąd). Osiągalność potwierdzona empirycznie na realnym, codziennym przypadku: heks
Równina z warstwami `['farma','droga']`, legacy `ulepszenie='droga'` (droga nadpisuje legacy przy
budowie) — stary kod dawał nienależne 3 pkt potencjału mimo że farma już stoi, nowy kod 0 pkt.
`heks-plony-warstwy-test.cjs` 24/24 (baza 19/19 + 4 nowe), `okolica-test` 46/46,
`hex-plony-magazyn-test` 11/11, `plony-budynkow-test` 68/68, `logic-test` 213/213,
`auto-manage-test` 45/45, `tsc` 0 błędów. C-026: 3 wywołania (`okolica.ts:191` przydział pól,
`okolica.ts:403` rebalans po zmianie populacji, `auto-manage.ts:334` AI zarządcy) — wszystkie
konsystentne z fixem.

**Nota gameplayowa Evaluatora:** `rebalanceWorkersAfterPopulationChange` może teraz wybrać INNE
pole do odjęcia robotnika przy kurczeniu się miasta z fokusem żywność — kierunek poprawny (fix
usuwa wewnętrzną niespójność, nie wprowadza nowej), ale widoczna zmiana zachowania w playteście.

**Trzeci, NIEnaprawiony człon tej samej rodziny błędu, znaleziony przez Evaluatora i
zarejestrowany osobno:** `P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA` — `cityPanel.ts` (`tileYieldLabel`,
`appendOkolicaYieldLabel`) ma identyczny wzorzec, widoczny graczowi w tooltipach pól i liczbach
na mapce okolicy miasta.
**Kotwice:** `gra/src/game/okolica.ts` (`foodPotentialOfMapHex`).
**Model:** Sonnet 5.

## P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA — ZAMKNIĘTE 2026-08-09
Trzeci człon tej samej rodziny błędu (obok już naprawionych `yieldOfMapHex` i
`foodPotentialOfMapHex`): `tileYieldLabel()` i `appendOkolicaYieldLabel()` w `cityPanel.ts`
budowały `WorkedTile` z tylko JEDNĄ (legacy) warstwą — na heksie testowym silnik liczył 5/5/5,
panel pokazywał graczowi 2/2/2.

**Naprawa:** obie funkcje wołają teraz `improvementKeysForHex(hex)`, identycznie jak silnik
(`hexToWorkedTile`) i poranna naprawa `yieldOfMapHex`. Nowy test `gra/tools/heks-panel-tooltip-warstwa-test.cjs`
(regex na źródło, `cityPanel.ts` nie eksportuje tych funkcji) — 22/22, dowód mutacyjny (`git
stash` fixu → 7 nowych FAIL).

Evaluator (Opus 5) **PASS-WITH-NOTES**: fix zweryfikowany parytetem linia-po-linii ze wzorcem,
4 własne mutacje (w tym częściowy fix tylko jednej z dwóch funkcji) — wszystkie złapane osobno.
C-026 potwierdzone niezależnie: dokładnie 8 wystąpień, wszystkie w `cityPanel.ts`, rodzina
zamknięta (przejrzano wszystkich 9 wywołujących `tileYield(` w `src/`).
Zmierzone: `heks-panel-tooltip-warstwa-test.cjs` 22/22, `heks-plony-warstwy-test.cjs` 24/24,
`logic-test.cjs` 213/213, `tsc --noEmit` 0 błędów.

**Dwie nowe niepilne noty Evaluatora, zarejestrowane osobno:** `P-BRAMKA-TOOLTIP-REGEX-UZASADNIENIE-NIEPRAWDZIWE`
(uzasadnienie „appendOkolicaYieldLabel wymaga DOM" jest nieprawdziwe — jsdom już jest w repo),
`P-HEKS-ZLOZE-PARYTET-NIEDOMKNIETY` (rodzina `zloze` nieprzekazywane, 3 pozostałe miejsca).
**Kotwice:** `gra/src/ui/cityPanel.ts` (`tileYieldLabel`, `appendOkolicaYieldLabel`).
**Model:** Sonnet 5 (Operator) + Opus 5 (Evaluator).

## P-BRAMKA-TOOLTIP-REGEX-UZASADNIENIE-NIEPRAWDZIWE (2026-08-09, nota Evaluatora P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA) · STATUS: **OTWARTE — niepilne, dokumentacyjne**
Operator uzasadnił wybór testu regex-owego (zamiast E2E) tym, że `appendOkolicaYieldLabel`
„wymaga pełnego DOM". Evaluator sprawdził: `jsdom ^29.1.1` jest zadeklarowanym devDependency
tego repo, leży w `node_modules`, a 9 istniejących testów w `tools/*.cjs` już go używa. Zbudował
działający test E2E (~40 linii, esbuild+jsdom, bez nowych zależności), który wywołuje obie
prawdziwe funkcje i odtwarza ticket dokładnie (przed fixem: „2/2/2", po: „5/5/5"). Silniejsze niż
regex — testuje zachowanie, nie tekst źródła, przeżywa refaktor. Nie blokowało scalenia
(obecny test regex jest mutation-proof), ale komentarz w teście i uzasadnienie w commit message
utrwalają fałszywy precedens „`cityPanel.ts` jest nietestowalny E2E" — już raz posłużył jako wzór
(`city-panel-growth-percent-separator-test.cjs`). Warto skorygować komentarz przy najbliższej
okazji edycji tego pliku; nie wymaga osobnego zlecenia.
**Kotwice:** `gra/tools/heks-panel-tooltip-warstwa-test.cjs` (nagłówek/komentarz uzasadnienia).
**Model:** Sonnet 5.

## P-HEKS-ZLOZE-PARYTET-NIEDOMKNIETY (2026-08-09, nota Evaluatora P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA) · STATUS: **OTWARTE — niepilne, dziś nieszkodliwe**
Wzorzec `hexToWorkedTile`/`yieldOfMapHex` (po naprawie `P-HEKS-RENDER-ZLOZE-NIEPRZEKAZYWANE`,
commit `3809d4f4`) przekazuje `zloze` do `tileYield()`. Trzy pozostałe miejsca tego NIE robią:
`cityPanel.ts:8207`, `cityPanel.ts:8225`, `hexContextTooltip.ts:252`. Zweryfikowane: zero wpływu
widocznego dziś (`formatTileYieldShort` czyta tylko żywność/pracę/handel, `cityYieldOnly` zeruje
rudę jawnie) — ta sama „pułapka na przyszłość" co `3809d4f4` już raz zamknął gdzie indziej.
Rodzina NIE jest w pełni zamknięta wbrew wrażeniu poprzednich commit message.
**Kotwice:** `gra/src/ui/cityPanel.ts:8207,8225`, `gra/src/ui/hexContextTooltip.ts:252`.
**Model:** Sonnet 5.

## P-HEKS-RENDER-ZLOZE-NIEPRZEKAZYWANE (2026-08-09, nota N2 Evaluatora P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE) · STATUS: **NAPRAWIONE 2026-08-09 — czeka na deploy+playtest**
`hexToWorkedTile` (silnik) przekazuje `tile.zloze` do `tileYield()`, `yieldOfMapHex` (render,
po dzisiejszej naprawie) go nie przekazuje. Dziś bez wpływu — `yieldOfMapHex` zwraca tylko
`{zywnosc, praca, handel}`, `zloze` wchodzi wyłącznie do `oreYieldFromImprovements` →
`ruda`/`ruda_zelaza`, poza kontraktem zwracanym przez tę funkcję. Pułapka na przyszłość: kto
rozszerzy render o `ruda`, dostanie cichy rozjazd z powrotem.

**NAPRAWIONE (2026-08-09, subagent Sonnet 5):** dodano `zloze: (h as { zloze?: string }).zloze`
do wywołania `tileYield()` w `yieldOfMapHex`, dla pełnego parytetu z `hexToWorkedTile`.
Rzutowanie konieczne bo `zloze` to pole runtime-only, nieobecne w formalnym typie `Hex` —
zweryfikowane przez Evaluatora jako idiom istniejący już w 5 innych miejscach silnika (dług,
nie wymysł Operatora). Zerowa zmiana zachowania (dowiedziona: `heks-plony-warstwy-test.cjs`
19/19 identyczne przed/po). Nowy test `heks-plony-zloze-forward-test.cjs` (5/5) podmienia moduł
`./economy` na szpiega nagrywającego realny argument — konieczne bo sam wynik funkcji nie może
wykryć braku przekazania (nie zwraca `ruda`). Evaluator PASS-WITH-NOTES: zweryfikował szpiega
osobiście (sonda sentinel potwierdzająca że czyta realny argument, nie inny call site),
potwierdził bezpieczne sprzątanie (`finally`), ocenił technikę jako proporcjonalną („jedyna
rzecz która realnie przypina to zachowanie" przy ograniczeniu „nie ruszamy silnika").
`tsc` 0 błędów, `heks-plony-warstwy-test.cjs` 19/19, `okolica-test` 46/46,
`hex-plony-magazyn-test` 11/11, `logic-test` 213/213.

**Trzy drobne noty Evaluatora, żadna nie blokuje:** (1) plik mocka testu
(`.heks-plony-zloze-mock-economy.js`) nie jest w `.gitignore` mimo że analogiczne pliki
`.*-entry.ts`/`.*-bundle.cjs` są, sprzątanie na końcu skryptu zamiast w `finally` — przy
wyjątku mógłby zostać jako untracked; (2) mock eksportuje tylko `tileYield`, nie pozostałe 7
wiązań z `./economy` — dziś nieszkodliwe, mylące gdyby ktoś rozszerzył test o ścieżki silnika;
(3) asercja Testu 2 (`zloze===undefined`) przechodzi z fixem i bez niego, nie niesie sygnału
mutacyjnego sama w sobie (ratuje ją dopiero sonda sentinel Evaluatora). Evaluator zasugerował
też strukturalnie lepszy kierunek na przyszłość (wspólny czysty helper budowania argumentu dla
`okolica.ts`/`turn-economy.ts`, usuwający duplikację u źródła) — poza zakresem tej naprawy,
świadomie nie realizowany teraz.
**Kotwice:** `gra/src/game/okolica.ts` (`yieldOfMapHex`).
**Model:** Sonnet 5.

## P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA (2026-08-09, nota N4 Evaluatora P-HEKS-PLONY-WARSTWA-OSTATNIA-VS-WSZYSTKIE) · STATUS: **POTWIERDZONE i CZĘŚCIOWO NAPRAWIONE — Evaluator FAIL, kontynuacja w toku**
`main.ts:3971` (`okolicaWorkedKeySet`, overlay) przekazuje `isWorkable: okolicaHexWorkable`
(wyklucza Morze/Góry), `cityWorkedTilesForEconomy` (`turn-economy.ts:691`, silnik) NIE
przekazywała `isWorkable` w ogóle; `okolicaTiles` (`okolica.ts:101`) filtruje tylko gdy filtr
podano — brak domyślnego filtra terenu.

**POTWIERDZONE żywą symulacją przez subagenta** (miasto pop=6, focus=produkcja, sąsiedztwo
Gór): silnik przypisywał robotników na Górach (Praca=4, najwyższa wartość terenu w
`terrain-yields.json`), których overlay nigdy by nie pokazał jako możliwe. Naprawa: nowa
`isLandWorkableHex()` w `okolica.ts` jako wspólne źródło prawdy, wstrzyknięta w
`cityWorkedTilesForEconomy` ORAZ `workedHexCoordsForCity` (drugi call site z identycznym
błędem, znaleziony i naprawiony przy okazji — Evaluator ocenił to jako uzasadnione, nie
przekroczenie zakresu). `okolicaHexWorkable` w `main.ts` deleguje do tej samej funkcji.

**Evaluator werdyktem FAIL wstrzymał scalenie — naprawa jest niekompletna i tworzy NOWY,
poważniejszy rozjazd niż naprawiła:**
1. **Bloker gameplayowy:** fix dotknął tylko 2 z 5 miejsc zapisujących przydział pól. Ścieżki
   trybu RĘCZNEGO (`seedReczneFromAuto`, `rebalanceWorkersAfterPopulationChange`,
   `toggleTileWorker`/`adjustTileWorker`) nadal pozwalają przypisać robotnika na Górę/Morze bez
   ostrzeżenia — ale silnik (po fixie) po cichu NIE liczy tej produkcji. Zmierzone na realnej
   mapie: jedno kliknięcie „tryb ręczny" w mieście z Górami w zasięgu = spadek z 27 do 15 pkt
   Pracy/turę, 3 z 6 obywateli bezczynnych, ZERO komunikatu dla gracza. Dodatkowo dotyczy
   ISTNIEJĄCYCH zapisanych gier — wpisy `okolicaReczne` na Górach z przed tej naprawy tracą po
   cichu produkcję przy wczytaniu.
2. Rozszerzona własna symulacja (960 próbek): tryb AUTO to ograniczona korekta (0,9% miast
   dotkniętych, liczba obsadzonych pól nigdy nie spadła, 0 zmienionych pozycji startowych) — nie
   nerf psujący rozgrywkę. Bug szerszy niż w raporcie Operatora: dotyczy TAKŻE fokusu „podatki" z
   Morzem (Podatek=2 &gt; Równina=1), nie tylko Gór pod fokusem „produkcja".
3. Brak fallbacku dla miasta całkowicie otoczonego Morzem/Górami — spada do samego centrum
   (7 pól → 1). Nieosiągalne w 960 próbkach realnego generatora, ale kod nie ma zabezpieczenia.
4. Test regresji ma lukę: asercje dla Morza przechodzą PUSTO (fokus w teście nigdy nie faworyzuje
   Morza) — nie złapałyby przyszłego rozwalenia wykluczenia Morza.
5. Worktree był 6 commitów za HEAD w chwili weryfikacji, 2 z nich dotykały `okolica.ts`.

**ECHO — punkt „co zrobić z ISTNIEJĄCYMI zapisami z robotnikami na Górach":** Maciej — tylko
stare zapisy, bez migracji; mechanizm ręcznego przydziału zostaje bez zmian funkcjonalnych.
Decyzja: `docs/decyzje/R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1.md`.

**RUNDA 2 (2026-08-09, worktree `agent-af2924b405f0dac83`, commit `91088b36`, niescalony)** —
Operator naprawił dokładnie to, co zażądała runda 1: filtr terenu dołożony do WSZYSTKICH 5
ścieżek zapisu (potwierdzone przez Evaluatora niezależną enumeracją 10 miejsc, nie tylko listą
Operatora — zerowa regresja starego bugu, symulacja E2E z pełnym pierścieniem Gór/Morza daje
PARYTET auto/ręczny, dowód mutacyjny na wszystkich 7 punktach filtra). Brak logiki migracji
zgodnie z decyzją. Test 20 przeprojektowany po własnym dowodzie mutacyjnym Operatora (wersja
mieszana nie łapała regresji, deterministyczna łapie zawsze) — Evaluator potwierdził to osobiście.

**Evaluator (Opus 5) werdyktem FAIL wstrzymał scalenie PONOWNIE — z zupełnie INNEGO powodu niż
runda 1 (nowa regresja, nie niedokończone pokrycie):**

1. **B1 (blokujący, sprzeczny z kanonem decyzji `R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1`):** ta
   decyzja mówi wprost „mechanizm ręcznego przydziału zostaje w grze BEZ ZMIAN FUNKCJONALNYCH —
   dotyczy WYŁĄCZNIE danych w starych zapisach". Commit rundy 2 ZMIENIA mechanizm: w
   `toggleTileWorker` bramka `inRange` (teraz z filtrem terenu) stoi PRZED gałęzią zdejmowania
   robotnika, więc robotnik na Górach/Morzu w STARYM zapisie **nie da się zdjąć klikiem** —
   zakleszczenie. Zmierzone (miasto pop=6, 6 wpisów `okolicaReczne`, 3 nielegalne): baza liczy
   6/6 robotników (16 pkt Pracy), commit rundy 2 liczy 3/6 (8 pkt, legalnie byłoby 12) — I klik na
   Górach z robotnikiem zwraca `ok=false, teren_nieobsadzalny`, robotnik zostaje uwięziony,
   podczas gdy komunikaty UI aktywnie mylą gracza („zabierz robotnika z innego pola" — nie da
   się, bo te legalne już pracują). To ten sam obraz co bloker rundy 1, przeniesiony ze świeżej
   gry do starego zapisu. Dodatkowo `cityPanel.ts:8290` liczy `isWorked` z surowego `reczne` bez
   filtra — panel rysuje 👤 na Górach, którego overlay 3D i silnik już nie widzą — NOWY rozjazd
   overlay↔silnik, dokładnie klasa błędu, którą to zgłoszenie miało zlikwidować.
   **Kierunek naprawy zweryfikowany osobiście przez Evaluatora** (5 linii: gałąź zdejmowania
   `reczne[key]>=1 → delete` MUSI iść przed bramką terenu — zdjęcie nigdy nie tworzy nielegalnego
   stanu, więc nie może być przez filtr blokowane) — potwierdzone że naprawia bez regresji
   (`okolica-test` 65/65, `silnik-test` 17/17, `logic-test` 213/213), ale Evaluator NIE zostawił
   zmiany w worktree (zgodnie z rolą — to diagnoza, nie scalenie).
2. **B2 (blokujący, reguła 4 CLAUDE.md — brak asercji dla AC właściciela):** kanon decyzji
   definiuje jawne oczekiwane zachowanie („silnik po prostu nie liczy tej produkcji … bez
   auto-przestawienia") — ŻADEN test tego nie przypina. Ani `okolica-isworkable-silnik-test.cjs`
   (zero przypadków trybu ręcznego), ani `okolica-test.cjs` (Testy 18–20 sprawdzają wyłącznie
   DOKŁADANIE robotnika, nigdy stanu ZASTANEGO z nielegalnym wpisem już obecnym). Ta luka w
   pokryciu jest dokładnie tym, co pozwoliło B1 przejść niezauważone przez Operatora.

**Noty niebokujące:** N1 (nieujawniona zmiana kodu odmowy `obce_terytorium`→`poza_zasiegiem` w
3/4 przypadków, na plus ale niepokryta testem), N2 (`cityOkolicaOverlay.ts:236` ma NIEZALEŻNĄ,
zahardkodowaną kopię predykatu terenu dla etykiet plonów — drugie miejsce poza wspólnym źródłem
prawdy, dziś kosmetyczne), N3 (pominięcie zadania 5 — fallback miasta otoczonego Górami/Morzem —
uzasadnione, nie ukryte niedokończenie).

**Runda 3 dispatched** z pełną listą Evaluatora: B1 (przenieść gałąź zdejmowania przed bramkę
terenu we WSZYSTKICH ścieżkach usuwania, w tym `cityPanel.ts:8290`), B2 (dołożyć jawne przypadki
testowe „stary zapis z nielegalnym wpisem" — nie liczy produkcji, DA SIĘ zdjąć klikiem, bez
auto-migracji), bez logiki migracji starych zapisów.

**KOREKTA (Evaluator rundy 2, po fakcie, §0b — poprawił własne wcześniejsze twierdzenie):**
`map-gen-regression-test.cjs` NIE jest architektonicznie nierelewantny — domknięcie przechodnie
importów generatora (nie tylko bezpośrednie re-eksporty) faktycznie zawiera `okolica.ts` i
`turn-economy.ts` (51-modułowy łańcuch przez ocenę pozycji startowych). Ta bramka miała zostać
uruchomiona przed scaleniem rundy 3 — ale środowisko sesji restartowało kontener co ~7-8 minut
(3 próby, potwierdzone `uptime`/`/proc/uptime` wskazujące świeży boot za każdym razem — zdarzenie
infrastrukturalne, niezależne od obciążenia procesu), a pełny przebieg testu wymaga 20-58 min —
strukturalnie niemożliwe do domknięcia w tym oknie.

**DOMKNIĘCIE (orkiestrator, weryfikacja ostrzejsza niż „domknięcie przechodnie importów"):**
sprawdzone bezpośrednio przez `grep -rn` w `gra/src/map/**` — ŻADNA z funkcji zmienionych w
rundzie 3 (`isLandWorkableHex`, `seedReczneFromAuto`, `rebalanceWorkersAfterPopulationChange`,
`toggleTileWorker`, `adjustTileWorker`, `cityWorkedTilesForEconomy`, `workedHexCoordsForCity`) nie
ma ANI JEDNEGO wywołania w kodzie generatora mapy. `okolica.ts` jest w bundlu wyłącznie dlatego,
że `range-hexes.ts`/`territory.ts`/`improvement-build.ts` importują z niego INNE, nietknięte
funkcje (`citySightRadius`, `cityRangeForPopulation`, `hexKeysWithinRadius`) — potwierdzone że
żadna z nich wewnętrznie nie woła zmienionych funkcji. Domknięcie przechodnie importów (obecność
w bundlu) ≠ osiągalność w runtime (rzeczywiste wywołanie) — korekta Evaluatora była prawdziwa
dosłownie, ale myląca co do ryzyka behawioralnego. **Wniosek: `map-gen-regression-test.cjs` NIE
MOŻE wykryć regresji z tej rundy, bo zmieniony kod nigdy nie jest wołany podczas generowania mapy
— bramka bezpiecznie pominięta dla scalenia rundy 3, na podstawie analizy call-site, nie samej
obecności w bundlu.**
**Kotwice:** `gra/src/game/okolica.ts` (`isLandWorkableHex`, `toggleTileWorker`/`adjustTileWorker`),
`gra/src/ui/cityPanel.ts:8290`, `gra/src/render/cityOkolicaOverlay.ts:236`.
**Model:** Sonnet 5 (Operator) + Opus 5 (Evaluator, x2 rundy).

## DODATEK: R-SPACJA-KOLEJNA-JEDNOSTKA-PETLA — NAPRAWIONE (2026-08-08)
Rozdzielono na dwie kontrolki jak zdecydowałeś: `cyclablePlayerArmyLeadsBase(requireMoves)` —
Spacja i „bęben" po ruchu używają `requireMoves=true` (tylko jednostki z ruchem), strzałki HUD
◀▶ używają `requireMoves=false` (wszystkie jednostki, zgodnie z Twoim poleceniem z 28.07).
Oba tooltips strzałek niosą teraz obie informacje („dowolna — Spacja: aktywna"). Dodatkowo
naprawiony efekt uboczny: gdy jednostka, od której zaczynało się cyklowanie, wypadła z listy
(typowy przypadek po „bębnie"), stare `cur=0` pomijało pierwszą jednostkę na liście przy
cyklowaniu w przód — teraz trafia poprawnie w najbliższą. Evaluator (Opus 5) PASS-WITH-NOTES
po 2 rundach (własna symulacja arytmetyki indeksów, nie zaufanie raportowi). `tsc` czyste,
bramki ruchu/armii zielone.
**Nota (niska pilność):** logika cyklowania nie ma dedykowanego testu regresji (żyje jako
domknięcie wewnątrz `boot()` w `main.ts`, ekstrakcja byłaby refaktorem poza zakresem tej
naprawy) — do rozważenia przy następnym dotknięciu tego kodu.
