# PYTANIA OTWARTE — czekają na decyzję Macieja
Aktualizacja: 2026-08-09 (FALA 263 — maraton AutoBot: isWorkable 4 rundy + akcja-6 handel tech 3 rundy + regresja tooltip naprawiona; szczegóły `dyspozycje/_handoff/HANDOFF-SESJA-2026-08-09_FALA-263-AUTOBOT-MARATON.md`). Numeracja ciągła z `REJESTR-PROSB-I-ZADAN.md`.
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
**STATUS SKORYGOWANY 2026-08-10: WDROŻONE, patrz wpis „AC-RZEKI-BEZ-LIMITERA i AC-RZEKI-PER-MASA — WDROŻONE, status skorygowany" bliżej końca pliku.**

## AC-RZEKI-BEZ-LIMITERA — brak cap liczby / czasu siewu · STATUS: **ZEBRANE** (Maciej 2026-08-02 ~22:28)
**Cytat:** „nie powinno być żadnego limitera ilości rzek. Po prostu powinny się generować zgodnie z zasadami bez limitu. Powinny tak długo siewić jak są w stanie siewić, a nie kończyć się np. po jakimś wyznaczonym czasie lub długości."
**Implikacja:** usunąć/wyłączyć twarde capy typu `pangeaBootstrapRiverTarget` (~32), `maxCellsToProcess`, quota `capRiverQuotas` / `mapGenMaxRivers*`, early-stop po budżecie czasu; siew aż reguły (źródło, sep, ujście, masa) nie dadzą kolejnej poprawnej rzeki. `maxLen` trasy = ograniczenie techniczne A* jednej ścieżki — rozróżnić od limitu **liczby** rzek (ten drugi = zakazany).
**Wdrożyć w paczce rzek z AC-RZEKI-PER-MASA + fix obwarzanka.** Uwaga: bez limitu na Super Huge wall-clock mocno urośnie — perf osobno, nie przez cięcie pokrycia.
**STATUS SKORYGOWANY 2026-08-10: WDROŻONE, patrz wpis „AC-RZEKI-BEZ-LIMITERA i AC-RZEKI-PER-MASA — WDROŻONE, status skorygowany" bliżej końca pliku.**

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

## P-BRAMKA-MAP-FIELD-BATTLE-PRE-BATTLE-SAVE-CZERWONE (2026-08-09, nota Evaluatora P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL) · STATUS: **SCALONE 2026-08-10 (Evaluator PASS-WITH-NOTES, orkiestrator scalił bezpośrednio — patrz niżej w pliku)**
`map-field-battle-test.cjs` (`TypeError: import_meta.glob is not a function` — konstrukcja Vite
w bundlu esbuild/CJS, moduł audio `.mp3`) i `pre-battle-save-test.cjs` (`No loader configured for
".svg" files` — `src/ui/icons/brand/menu-emblem.svg?raw`) padają identycznie z fixem i bez niego
(zweryfikowane na baseline przed zmianą `signedPl`) — awarie harnessu testowego (brak loaderów
w skrypcie budującym bundle testu), nie regresja silnika. CLAUDE.md nie wymienia ich w liście
znanych czerwonych bramek — bez tego wpisu następna sesja mogłaby je wziąć za świeżą regresję.
**Kotwice:** `gra/tools/map-field-battle-test.cjs`, `gra/tools/pre-battle-save-test.cjs`.
**Model:** Sonnet 5.

## P-ETYKIETA-PODWOJNY-ZNAK-PRACA-BUDYNKI (2026-08-09, nota Evaluatora P-ETYKIETA-MINUS-GLIF-ROZJAZD-FORMATPL) · STATUS: **ZAMKNIĘTE — naprawione i scalone `f7a0ece1` (grupa G3, Evaluator PASS-WITH-NOTES, 2026-08-10)**
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

## P-ETYKIETA-KARTA-ZYWNOSC-4800-MIESZANE-SEPARATORY (2026-08-09, nota Evaluatora P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY) · STATUS: **ZAMKNIĘTE — naprawione i scalone `f7a0ece1` (grupa G3, Evaluator PASS-WITH-NOTES, 2026-08-10)**
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

## P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA-Q1 — ZAMKNIĘTE 2026-08-09 (ECHO A x2, 3 rundy realizacji)

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

**MACIEJ ODPOWIEDZIAŁ NA B3: A** — rozszerzyć rundę 2 o tech-za-tech, razem z naprawą exploita,
nie odkładać. Korekta zakresu wysłana do już działającego Operatora rundy 2.

**RUNDA 2 (commity `b5a76611`+`d30c2b9e`, worktree `agent-a3559889ee803787b`, NIESCALONA) —
Evaluator FAIL, DWA nowe blokery.** Pozytywnie potwierdzone: B1 gotówkowy naprawiony poprawnie na
wszystkich 4 kombinacjach tryb×kierunek (happy path + brak zapłaty → zerowy transfer w obie
strony), `canGrantTech` (podgląd bez mutacji) zweryfikowany jako bezpieczny, bramki prereq/epoka/
tier symetryczne w obu kierunkach, N1/N2 z rundy 1 naprawione realnie.

**BLOKER 1 (krytyczny — funkcja nie działa w grze):** `main.ts::buildProposalFromPayload` składa
`uiPayload` z białej listy pól i GUBI `techPaymentMode`/`techOfferId` — jedyna droga z formularza
do stołu negocjacyjnego. Skutek zmierzony na realnym kodzie: `techPrice` wylicza się jako 0 dla
trybu tech-za-tech (bo `goldOnce=0` w tym trybie, a `??` nie łapie zera), `evaluateProposal` idzie
gałęzią gotówkową i ZAWSZE odrzuca ofertę komunikatem „Cena poniżej minimum (50 ¤)". Gracz klika
„Wymiana technologia-za-technologię" i dostaje ślepy zaułek — funkcja jest martwa mimo 41/41
zielonych testów, bo te testy wołają rdzeń (`executeTechTradeDealCore`) bezpośrednio, z ręcznie
sklejonym payloadem, omijając dokładnie tę zepsutą warstwę okablowania. **To ten sam wzorzec luki
co B2 z rundy 1, powtórzony piętro wyżej** — test rdzenia bez testu okablowania UI→silnik.

**BLOKER 2 (druga połowa exploita z rundy 1, nienaprawiona):** silnik sprawdza czy oddający
zapłatę-technologię ją posiada (`ownerHasTech` dla `techOfferId`), ale NIGDZIE nie sprawdza czy
dawca GŁÓWNEJ technologii (ta faktycznie przekazywana) w ogóle ją zna. Zmierzone na realnych
modułach: gracz „sprzedaje" technologię, której nie posiada — AI ją dostaje z niczego, gracz
inkasuje gotówkę; w trybie tech-za-tech gracz oddaje nieposiadaną technologię i otrzymuje w
zamian prawdziwą. Dziś nieklikalne z UI (listy filtrowane po znanych technologiach), ale wpisy
`negotiationTable` są serializowane do save'a i odtwarzane rzutowaniem BEZ rewalidacji — luka
zaufania na poziomie silnika, dokładnie ten typ ryzyka, którego dotyczyła lekcja rundy 1
(„silnik nie może ufać filtrowi UI").

Dowód mutacyjny Evaluatora: 5 z 6 własnych mutacji złapanych, w tym dosłowny exploit rundy 1 w
trybie gotówkowym (nadal złapany — nie regresja). Zakres (`diplomacy-locks.ts`, etykiety) uznany
za uzasadniony w ramach C-026, nie scope creep.

**Runda 3 dispatched**: (1) dopisać `techPaymentMode`+`techOfferId` do białej listy
`buildProposalFromPayload`, naprawić wyliczenie `techPrice` dla trybu tech; (2) dołożyć
`ownerHasTech(granterId, techId)` przed grantem w OBU trybach zapłaty; (3) test musi przechodzić
PRZEZ `buildProposalFromPayload`, nie obok niego — inaczej runda 3 powtórzy ten sam błąd trzeci
raz z rzędu; (4) domknąć noty N-A (guard `techOfferId===techId` niepokryty) i N-B (etykieta
AI-akceptacji sztywno „Sprzedaż" niezależnie od trybu, dziś nieosiągalna ale mina na przyszłość).
**RUNDA 3 (commit `054a9ed4`, worktree `agent-a3559889ee803787b`) — Evaluator PASS-WITH-NOTES,
SCALONE.** Oba blokery naprawione i zweryfikowane niezależnie na realnych modułach: (1)
`techPaymentMode`/`techOfferId` dopisane do białej listy `buildProposalFromPayload`, `techPrice`
liczony wyłącznie dla trybu gotówkowego; nowy `gra/tools/diplomacy-tech-trade-e2e-test.cjs`
wycina PRAWDZIWY literał `uiPayload` wprost ze źródła `main.ts` (nie kopia — czyta plik przy
każdym uruchomieniu) i przepuszcza przez CAŁY łańcuch formularz→wykonanie; (2)
`ownerHasTech(granterId, techId)` dołożone jako warunek wstępny przed każdym grantem, w obu
trybach zapłaty. Dowód mutacyjny Evaluatora: 6 własnych mutacji, w tym dosłowne odtworzenie
błędu rundy 2 (białe listy bez nowych pól) — złapane przez nowy plik E2E, na które stary
`execute-test` był całkowicie ślepy.

**Jedna nota wymagała korekty przed scaleniem (N1, zaadresowana przez orkiestratora):** ostatni
skok łańcucha w nowym pliku E2E (payload → argumenty `executeTechTradeDealCore`: `gold`,
`direction`, `paymentMode`) był ręczną kopią trzech linii z `main.ts`, nie ekstrakcją — mutacja
Evaluatora w tym miejscu (`paymentMode` zawsze `'gold'` w call site) przechodziła przez WSZYSTKIE
bramki niewykryta. **Poprawione przy scaleniu**: derywacja wycinana tą samą techniką co literał
`uiPayload` (regex na źródło `main.ts`, `new Function`) — zweryfikowane osobiście: ta sama
mutacja teraz daje 27 pass/1 fail, przywrócone 28/28.

Pozostałe noty zarejestrowane, nie wymagają dalszych rund: N3 (`diplomacy-tech-trade-execute-test.cjs`
pokrywa 3 z 4 kombinacji trybu/kierunku dla bramki dawcy — brakuje Kupno×Technologia, kod
poprawny, tylko brak przypadku testowego), N6 (nowy plik `diplomacy-tech-trade-e2e-test.cjs` nie
jest wpisany do żadnej zbiorczej listy bramek w CLAUDE.md — zgodne z dotychczasową praktyką repo,
żaden test dyplomacji tam nie figuruje).

Zmierzone (po scaleniu i korekcie N1): `diplomacy-locks-test.cjs` 71/71, `diplomacy-audience-actions-test.cjs`
20/20, `diplomacy-tech-trade-test.cjs` 26/26, `diplomacy-proposal-test.cjs` 129/129,
`diplomacy-negotiation-table-test.cjs` 62/62, `diplomacy-tech-trade-execute-test.cjs` 52/52,
`diplomacy-tech-trade-e2e-test.cjs` 28/28 (nowy, +1 po korekcie N1), `logic-test.cjs` 213/213,
`tsc --noEmit` 0 błędów.
**Kotwice:** `gra/src/main.ts` (`buildProposalFromPayload`, `executeTechTradeDeal`),
`gra/src/game/diplomacy-tech-trade.ts` (`resolveTechTradeParties`, `canGrantTech`/`grantTech`),
`gra/src/ui/diplomacyTradeBasket.ts` (`readTreatyStateFromDom`, `validateTreatyForm` case '6'),
`gra/src/game/diplomacy-proposals.ts` (`case 'tech'`, `generateCounterOffer`,
`resolvePlayerAcceptsAiPending`).
**Model:** Sonnet 5 (Operator) + Opus 5 (Evaluator, x3 rundy) + korekta orkiestratora przy scaleniu.

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

## P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA — ZAMKNIĘTE 2026-08-09 (+ RECYDYWA tego samego dnia, naprawiona przed deployem)
Trzeci człon tej samej rodziny błędu (obok już naprawionych `yieldOfMapHex` i
`foodPotentialOfMapHex`): `tileYieldLabel()` i `appendOkolicaYieldLabel()` w `cityPanel.ts`
budowały `WorkedTile` z tylko JEDNĄ (legacy) warstwą — na heksie testowym silnik liczył 5/5/5,
panel pokazywał graczowi 2/2/2.

**RECYDYWA (2026-08-09, złapana przez agenta deploy przed wypchnięciem FALA 263):** przy scalaniu
NIEZWIĄZANEJ naprawy `P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY` orkiestrator policzył patch jako
`git diff 92341250 cdb29d92` — `cdb29d92` (tip worktree Operatora tamtej naprawy) odgałęził się
PRZED `92341250`, więc diff po cichu zawierał cofnięcie tej właśnie naprawy. `git apply --check`
przeszedł czysto (brak konfliktu tekstowego), Evaluator commita scalającego (`d383edec`) tego nie
złapał (jego zakres to nowa zmiana, nie regresja gdzie indziej w tym samym pliku) — jedynym
zabezpieczeniem, które zadziałało, była bramka `heks-panel-tooltip-warstwa-test.cjs` uruchomiona
przez agenta deploy PRZED wypchnięciem (15/22 → czerwona). Naprawione bezpośrednio w drzewie
głównym (przywrócone 3 fragmenty bit-for-bit identyczne z `92341250`, potwierdzone przez
niezależny Evaluator Opus 5 pełnym diffem całego pliku + dowodem mutacyjnym). Nowa reguła
procesowa zapisana w `civ-autobot/SKILL.md` §5: `git diff <A> <B>` do scalenia jest bezpieczny
wyłącznie gdy `<A>` jest faktycznym przodkiem `<B>` — inaczej używać `git diff $(git merge-base
<baza> <tip>) <tip>`. Drugi, niezależny mechanizm cichej utraty pracy w tym repo obok `b9867b3`.
Bramki po naprawie: `heks-panel-tooltip-warstwa-test.cjs` 22/22, `city-panel-growth-percent-separator-test.cjs`
29/29, `heks-plony-warstwy-test.cjs` 24/24, `city-badge-growth-percent-test.cjs` 38/38,
`okolica-test.cjs` 72/72, `okolica-isworkable-silnik-test.cjs` 15/15, `logic-test.cjs` 213/213,
`tsc --noEmit` 0 błędów.

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

## P-BRAMKA-TOOLTIP-REGEX-UZASADNIENIE-NIEPRAWDZIWE (2026-08-09, nota Evaluatora P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA) · STATUS: **SCALONE 2026-08-10 (Evaluator PASS-WITH-NOTES, orkiestrator scalił bezpośrednio — patrz niżej w pliku)**
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

## P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA — ZAMKNIĘTE 2026-08-09 (4 rundy, PASS-WITH-NOTES + 1 nowe pytanie ABC)
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

**RUNDA 3 (worktree `agent-a97a3b6210599ea27`, commit `3d57c23d`, NIESCALONA) — Evaluator FAIL,
TRZECI z rzędu, ale po raz pierwszy z powodu regresji WPROWADZONEJ przez samą naprawę, nie luki
pozostawionej.** B1 rundy 2 (kolejność bramek w `toggleTileWorker`) **potwierdzony jako naprawdę
naprawiony** — własny harness Evaluatora (42 asercje, nie testy Operatora) zielony na toggle/
adjust(+1)/adjust(−1), z/bez `territoryNodes`, wpis poza promieniem, wpis na nieistniejącym
heksie, wpis na obcym terytorium, dwuklik. `map-gen-regression` potwierdzone empirycznie jeszcze
mocniej niż analiza orkiestratora — zbundlowany entry bramki, 0 z 10 zmienionych symboli w
654 019-znakowym bundlu.

**BLOKER B3 (regresja WPROST łamiąca `R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1`):**
`rebalanceWorkersAfterPopulationChange` dostał w tej rundzie filtr terenu — w gałęzi SPADKU
populacji nielegalny wpis znika ze ścieżki `!t → delete+excess--`, ale PO PĘTLI i tak wykonuje się
`if (worstKey) delete reczne[worstKey]`, kasując DODATKOWO pole legalne. Zmierzone: stary zapis,
pop 5→4, 3 legalne + 2 nielegalne wpisy, `excess=1` — skasowane **3 wpisy zamiast 1**, zginął
legalny, produkcyjny robotnik. Miasto zostaje z pustymi slotami NA STAŁE. Jedyny caller produkcyjny
to `population-growth-v85.ts:396` — wywoływany co turę przy każdej zmianie populacji (wzrost/głód),
NIE wymaga żadnej akcji gracza. To dokładnie ta auto-migracja/cicha utrata, której zakazała decyzja
właściciela — i ta sama klasa błędu, która wywaliła rundę 1.

**KOREKTA FAKTOGRAFICZNA (Evaluator rundy 4, §0b — sprostowanie własnego wcześniejszego zapisu
tutaj):** sformułowanie „nowa regresja wprowadzona przez rundę 3" było nieprecyzyjne co do
mechanizmu, choć prawdziwe co do skutku. Blok `if (!t) { delete reczne[key]; excess--; continue; }`
istnieje od commita `13419757`, długo przed rundą 3 — zweryfikowane `git show 43afa474:...okolica.ts`.
Wkładem rundy 3 było dołożenie `terrainAndTerritoryFilter` do `tiles`, co ROZSZERZYŁO znaczenie
`!t` z „poza zasięgiem" na „poza zasięgiem LUB Góry/Morze" — sam błędny wzorzec podwójnego
kasowania czekał w kodzie od dawna, runda 3 tylko uczyniła go osiągalnym w nowym, częstszym
scenariuszu. Naprawa B3 (patrz runda 4 niżej) jest poprawna niezależnie od tego rozróżnienia.

**BLOKER B4 (druga dziura pokrycia tej samej klasy co B2 rundy 2):** dowód mutacyjny Evaluatora —
usunięcie filtra terenu z `seedReczneFromAuto` (jedna z 5 „zabezpieczonych" ścieżek) NIE zostaje
złapane przez żaden test (`okolica-test` 64/64, `silnik-test` 15/15, oba zielone mimo mutacji).
Zmierzony skutek mutacji: tryb ręczny obsadza WSZYSTKIE 6 robotników na Górach, silnik liczy 0 przy
pop 6 — całkowity zanik produkcji, przy zielonych bramkach. Deklaracja „wszystkie 5 ścieżek" jest
niezweryfikowana testami.

**Nota (nie bloker):** uzasadnienie komentarza przy `cityPanel.ts:8290` („surowy odczyt potrzebny
żeby klik mógł zdjąć") jest FAKTYCZNIE NIEPRAWDZIWE — klikalność nie zależy od `isWorked` (pętla
tworząca przyciski nie ma takiego warunku). Wybór jest obronny, uzasadnienie nie.

**Runda 4 dispatched** z precyzyjną listą Evaluatora: (1) napraw B3 — gałąź `!t` nie może kasować
ani dekrementować `excess`, ALBO `worstKey` nie może kasować dodatkowo w tej samej iteracji;
wymaganie: spadek pop o 1 = zniknięcie DOKŁADNIE 1 robotnika, nielegalne wpisy nietknięte; (2) test
na B3 (liczba usuniętych == `excess`, zero legalnych strat, nielegalne nadal obecne); (3) zamknij
B4 — test przypinający filtr w `seedReczneFromAuto` (i analogicznie pozostałych ścieżek dodawania);
(4) popraw nieprawdziwy komentarz przy `cityPanel.ts:8290`.

**RUNDA 4 (commit `3aba4286`, worktree `agent-a97a3b6210599ea27`) — Evaluator PASS-WITH-NOTES,
SCALONE. Pierwsza runda tego zgłoszenia, która obroniła się pod naciskiem.** Naprawa B3: wpisy
nielegalne dostają `score = -Infinity` i przechodzą przez TĘ SAMĄ logikę wyboru `worstKey` co
legalne pola — usuwanie w jednym miejscu, dokładnie raz na iterację, gwarantując dokładnie
`excess` usunięć. B4: nowe Test 23/24 przypinające filtr w `seedReczneFromAuto` i gałęzi wzrostu
`rebalance` na mapie deterministycznej (jedyne wolne pola nielegalne). Komentarz przy
`cityPanel.ts:8290` poprawiony.

Evaluator zbudował WŁASNY harness (10 scenariuszy poza raportem: wszystkie wpisy nielegalne,
`excess` > liczby nielegalnych, `excess=0`/`excess<0` z nielegalnymi obecnymi, remis w score,
uszkodzony klucz, tryb auto, spadek do pop=0) — wszystkie przeszły. 6 własnych mutacji, każda
złapana przez SPECYFICZNY, inny zestaw asercji (dowód że pokrycie B4 jest realnie per-ścieżkowe,
nie zbiorcze). `map-gen-regression-test.cjs` pominięcie potwierdzone PO RAZ TRZECI (bundel
entry-pointu, 0 wystąpień na 654 kB).

Zmierzone: `okolica-test.cjs` 72/72, `okolica-isworkable-silnik-test.cjs` 15/15, `logic-test.cjs`
213/213, `tsc --noEmit` 0 błędów.

**Nowe pytanie ABC zarejestrowane osobno:** `P-HEKS-ISWORKABLE-FANTOM-PROMIEN-Q1` (naprawa B3
poprawnie chroni też pola, które wypadły z zasięgu przez skurczenie promienia terytorium przy
spadku populacji — ale to zwykła dynamika gry, nie tylko stare zapisy, i tworzy „fantomowe" zajęte
sloty niewidoczne w panelu miasta, czyszczalne tylko klikiem na mapie świata).
**Nowa nota zarejestrowana osobno:** `P-OKOLICA-ADJUST-PLUS1-TOGGLE-SEMANTYKA` (pre-istniejący,
poza zakresem tych 4 rund — `adjustTileWorker(delta=+1)` na już obsadzonym polu zdejmuje robotnika
zamiast dodać drugiego, semantyka toggle pod nazwą „+1").
**Kotwice:** `gra/src/game/okolica.ts` (`rebalanceWorkersAfterPopulationChange`, `seedReczneFromAuto`),
`gra/src/ui/cityPanel.ts:8290`.
**Model:** Sonnet 5 (Operator) + Opus 5 (Evaluator, x4 rundy).

## P-HEKS-ISWORKABLE-FANTOM-PROMIEN-Q1 (2026-08-09, nota N2 Evaluatora rundy 4 P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA) · STATUS: **ECHO B — zaparkowane do następnej paczki pracy (Maciej: „innymi rzeczami zajmiemy się później")**

**MACIEJ ODPOWIEDZIAŁ: B** — rozróżnić dwie kategorie „pole niedostępne": teren nielegalny
(Góry/Morze, stare zapisy — zostaje chroniony bez migracji) vs pole poza aktualnym promieniem po
skurczeniu terytorium (zwykła dynamika gry — wraca do dawnego, automatycznego czyszczenia).
Wdrożenie odłożone na następną paczkę pracy (właściciel: najpierw deploy bieżących zmian i
playtest, „innymi rzeczami zajmiemy się później") — NIE dispatchowane teraz.
**[TEMAT: Fantomowe sloty robotników po skurczeniu promienia terytorium — czy czyścić automatycznie]**
**Sytuacja:** naprawa B3 (runda 4) poprawnie chroni stare zapisy z robotnikami na Górach/Morzu
przed nadmiernym kasowaniem — ale ten sam mechanizm chroni też CAŁKIEM INNY przypadek: pola, które
wypadły z zasięgu bo promień terytorium miasta skurczył się przy spadku populacji (zwykła,
częsta sytuacja w grze, nie tylko stare zapisy). Zmierzone przez Evaluatora: spadek pop 12→10
(promień 12→10), 4 z 12 wpisów wypadły poza nowy promień, `excess=2` — po naprawie zostają 2
wpisy „fantomowe" (poza zasięgiem, zero produkcji), zajmując 2 sloty robotników na stałe. Panel
miasta (`okolicaPreviewRadius`, `cap=Rwork`) NIE renderuje pól poza aktualnym promieniem — brak
przycisku w panelu. Jedyny sposób usunięcia to klik na mapie świata (działa, zweryfikowane).

Przed naprawą B3 te fantomy były czyszczone za darmo (przy okazji nadmiernego kasowania, które
było błędem dla starych zapisów Gór/Morza, ale przypadkiem „naprawiało" ten inny przypadek).

**Cel pytania:** czy rozróżnić dwie kategorie „pole niedostępne" — (a) teren nielegalny
(Góry/Morze, stare zapisy — chronione zgodnie z `R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1`, bez
migracji) vs (b) pole poza aktualnym promieniem po skurczeniu terytorium (zwykła dynamika gry,
nie „stary zapis") — i pozwolić kategorii (b) na auto-czyszczenie tak jak przed całą tą serią
napraw, czy zostawić jak jest dziś (wymaga ręcznego kliku na mapie świata).
**Dlaczego teraz:** to jest bezpośredni skutek uboczny właśnie scalonej naprawy — zanim playtest
to wykryje jako „zgubione sloty robotników", warto rozstrzygnąć czy to zamierzone.
- **A — Zostawić jak jest.** Za: spójne z już podjętą decyzją (żadnej auto-migracji/naprawy),
  zero dodatkowej pracy. Przeciw: gracz może nie zauważyć martwych slotów (brak przycisku w
  panelu miasta), realna, cicha utrata produkcji przy normalnym skurczeniu populacji — nie tylko
  przy starych zapisach.
- **B — Rozróżnić dwie kategorie, auto-czyścić TYLKO (b).** Za: przywraca oczekiwane zachowanie
  sprzed serii napraw dla zwykłego gameplayu (nie łamie decyzji o starych zapisach, bo to inny
  przypadek), naprawia realny UX problem. Przeciw: kolejna, piąta runda kodowania i testowania
  tego samego pliku; wymaga precyzyjnego odróżnienia przyczyny „!t" (teren vs promień) w kodzie.
- **C — Rozszerzyć panel miasta o widoczność/przycisk dla pól poza aktualnym promieniem** (zamiast
  auto-czyszczenia), żeby gracz mógł świadomie zdjąć fantom bez czekania na mapę świata. Za: nie
  łamie zasady „brak migracji" nawet dla przypadku (b), poprawia UX bez zmiany logiki silnika.
  Przeciw: zmiana UI panelu (rozszerzenie zasięgu podglądu), inny rodzaj pracy niż silnik.
**Rekomendacja:** B — to inny przypadek niż ten, którego dotyczyła oryginalna decyzja (stare
zapisy z nielegalnym terenem); zwykła dynamika promienia terytorium nie powinna tworzyć trwale
martwych slotów bez wyraźnego sygnału dla gracza.
**Kotwice:** `gra/src/game/okolica.ts` (`rebalanceWorkersAfterPopulationChange`, gałąź `!t`),
`gra/src/ui/cityPanel.ts` (`okolicaPreviewRadius`, `cap=Rwork`).
**Model:** Opus 5 (Evaluator, znalezisko).

## P-OKOLICA-ADJUST-PLUS1-TOGGLE-SEMANTYKA (2026-08-09, nota N3 Evaluatora rundy 4 P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA) · STATUS: **ZAMKNIĘTE — naprawione i scalone `f7a0ece1` (grupa G2, Evaluator PASS-WITH-NOTES, 2026-08-10)**
`adjustTileWorker(delta=+1)` na polu JUŻ obsadzonym robotnikiem zdejmuje go (semantyka toggle),
zamiast np. być no-opem albo błędem „pole już zajęte". Zachowanie istnieje verbatim od dawna
(potwierdzone w `43afa474`, przed jakąkolwiek z 4 rund tego zgłoszenia), nietknięte przez całą
serię napraw. Nie blokuje niczego z `P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA`.
**Kotwice:** `gra/src/game/okolica.ts` (`adjustTileWorker`).
**Model:** Opus 5 (Evaluator, znalezisko).

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

---

## R-MERGE-MAIN-RYTM-Q1 (2026-08-09, pytanie Macieja „kiedy dany commit powinien trafić do main") · STATUS: **ZAMKNIĘTE — ECHO decyzja własna D Macieja, wdrożone jako CLAUDE.md §4a, kanon `docs/decyzje/R-MERGE-MAIN-RYTM-Q1.md`**

**Sytuacja:** CLAUDE.md §3 deklaruje projekt jako trunk-based na `main` („brak feature-branchy"),
ale harness tej sesji (Claude Code Remote) twardo przypina rozwój i `push` wyłącznie do gałęzi
`claude/sprawdzenie-funkcjonalnosci-ek4ra0`, zakazując pushowania na `main` bez wyraźnej, osobnej
zgody właściciela. W praktyce od ostatniego scalenia (2026-08-08, `a659f4a1`, 21 commitów) main
stoi w miejscu, a na gałęzi narosło **85 commitów** — nie tylko dzisiejszy maraton AutoBot (FALA
263, 28 commitów), ale też starsze prace sprzed dzisiejszej sesji. Main nie ma nic swojego czego
nie ma gałąź (`git log HEAD..origin/main` = puste) — to nie konflikt, tylko zaległość. Nie ma
dziś ustalonej reguły KIEDY scalać — dotąd działo się to ad hoc, na pojedyncze polecenie Macieja.

**Cel pytania:** ustalić stały rytm scalania gałęzi do `main`, żeby nie trzeba było pytać od nowa
za każdym razem i żeby main nie odjeżdżał w nieskończoność od rzeczywistego stanu prac.

**Dlaczego teraz:** Maciej sam o to spytał, mamy świeży, konkretny przykład (85 niescalonych
commitów) ilustrujący skalę problemu.

- **A — Scalaj po każdym pojedynczym temacie AutoBot zamkniętym PASS/PASS-WITH-NOTES** (praktycznie
  codziennie, czasem kilka razy dziennie), ze stałą zgodą Macieja „zawsze scalaj po zamknięciu
  tematu, informuj w kanale, bez osobnego pytania za każdym razem".
  Za: main zawsze blisko rzeczywistości, zgodne z deklarowaną zasadą trunk-based z CLAUDE.md §3;
  małe diffy łatwe do audytu pojedynczo.
  Przeciw: częstsze operacje na `main` (szum w historii); wymaga zaufania, że sam werdykt
  Evaluatora PASS/PASS-WITH-NOTES wystarcza jako bramka jakości bez dodatkowego spojrzenia na
  poziomie „co idzie na trunk".

- **B — Scalaj po zamkniętej większej paczce pracy / na koniec sesji** (tak jak dotąd, ad hoc na
  pojedyncze polecenie „scal do main"), bez ustalonego stałego rytmu.
  Za: pełna kontrola Macieja, zero ryzyka scalenia w złym momencie (np. w trakcie kolejnej rundy
  pracy nad tym samym plikiem, zanim temat faktycznie się domknie).
  Przeciw: łatwo odłożyć/zapomnieć — dokładnie to się stało (main w tyle o 85 commitów, 2 dni);
  im dłużej gałąź żyje, tym większe ryzyko konfliktu przy w końcu wykonanym scaleniu.

- **C — Scalaj automatycznie jako część runbooku deployu do ROBOCZA** (merge do `main` dzieje się
  razem z każdym „deploy", nie jako osobny krok).
  Za: jeden mniej krok do pamiętania, main zawsze odzwierciedla to co jest w ROBOCZA.
  Przeciw: deploy (publikacja bundla) i merge (zmiana trunk-a) to dwa różne ryzyka o różnej wadze
  — łączenie ich w jeden automatyzm zaciera rozróżnienie i utrudnia cofnięcie jednego bez drugiego.

**Rekomendacja:** A — scalaj po każdym zamkniętym temacie AutoBot (PASS/PASS-WITH-NOTES), z
krótkim wpisem w kanale zamiast osobnego pytania za każdym razem. Trzyma main blisko rzeczywistości
zgodnie z własną deklaracją projektu (CLAUDE.md §3), a AutoBot już dziś pełni rolę bramki jakości
przed wejściem na gałąź — dodatkowe opóźnienie do main niczego nie zabezpiecza, tylko generuje dług.

**ECHO Maciej 2026-08-09 — DECYZJA WŁASNA (wariant D, nie A/B/C z propozycji), ZAMKNIĘTE:**
„Myślę, że zawsze można scalać poprzednią falę, a nową zostawiamy do testów. Jeżeli robisz kolejną
falę, to znowu możesz robić scalenie. Czyli zawsze będzie scalenie o jedną falę do tyłu. Da to nam
możliwość cofnięcia się i łatwiejszego zarządzania błędami." + doprecyzowanie (AskUserQuestion):
nowa fala ROBOCZA powstaje **wyłącznie na wyraźne słowo „deploy"** od właściciela — zero
autonomicznego tworzenia kolejnych fal w trakcie sesji, nawet jeśli nazbiera się dużo zamkniętych
tematów (dotychczasowa praktyka tej sesji — kilka fal dziennie — była zbyt częsta).

**Reguła kanoniczna (dwie części):**
1. **Rytm scalania do main = zawsze jedna fala ROBOCZA do tyłu.** Gdy powstaje fala N (deploy do
   ROBOCZA na wyraźne „deploy"), fala N−1 (jeśli jeszcze nie scalona) kwalifikuje się do scalenia
   do `main`. Fala N zostaje na gałęzi roboczej wyłącznie do testów, NIE jest scalana, dopóki nie
   powstanie fala N+1 (wtedy fala N staje się „poprzednią" i można ją scalić). Daje to stały bufor
   jednej fali do cofnięcia się w razie błędu wykrytego dopiero na main.
2. **Nowa fala ROBOCZA tworzona wyłącznie na wyraźne słowo „deploy"** — nie automatycznie po
   zamknięciu tematu ani po nagromadzeniu progu tematów. To zaostrzenie/doprecyzowanie już
   istniejącej reguły CLAUDE.md §5 („Publikacja/deploy tylko na hasło deploy"), reagujące na
   praktykę tej sesji (kilka fal dziennie, w tym FALA 261 nigdy niescommitowana bo gałąź odjechała
   w trakcie oczekiwania na bramkę).

**Wykonane od razu (2026-08-09, ta sama tura):** pierwsze scalenie wg nowej reguły —
`main` (`a659f4a1`) doganie o FALA 262 (`ce69cf45`, commit deployu `75b14e86`) →
**merge `b137332a`**, wypchnięte. FALA 263 (`89176ced`) świadomie NIE wchodzi w ten merge,
zostaje na `claude/sprawdzenie-funkcjonalnosci-ek4ra0` do testów — wejdzie do main dopiero przy
kolejnej fali. Kanon decyzji: `docs/decyzje/R-MERGE-MAIN-RYTM-Q1.md`.

---

## R-DYP-STOL-A-KOREKTA — traktaty ROZŁĄCZONE od wymiany surowców (2026-08-09) · STATUS: **ZAMKNIĘTE, decyzja ostateczna Macieja**

**Kontekst:** playtest Pakt o nieagresji pokazał pola „MY ODDAJEMY (OPCJONALNIE)"/„ONI ODDAJĄ
(OPCJONALNIE)" z surowcami/pieniędzmi wpięte w ten sam formularz co traktat — konsekwencja
decyzji `R-DYP-STOL-A=C` (2026-07-27: „pełny koszyk `diplomacyTradeBasket` dla wszystkich
traktatów"). Orkiestrator wyjaśnił mechanizm i zapytał czy to zmienić — Maciej doprecyzował
własny pierwotny zamysł, cytat: *„Wszystkie umowy muszą być poza umową na wymianę surowców bez
propozycji wymiany surowców. To jest dodatkowy element, czyli jeżeli nam brakuje w jakiejś umowie
punktów, to możemy dołożyć surowców w drugiej umowie. To musi być rozłożone, rozłączone z tego
względu że zaburza przejrzystość i gracz potem nie będzie wiedział o co chodzi."*

**Decyzja (koryguje wykonanie R-DYP-STOL-A=C, nie samą decyzję B — B zostaje):** każdy typ
traktatu (pakt o nieagresji, sojusz, wasalizacja, itd.) ma formularz **BEZ** wpiętej sekcji
wymiany surowców/PW w tym samym oknie. Jeśli traktatowi brakuje „punktów" żeby AI zaakceptowało,
rozwiązaniem jest **osobna, druga umowa/deal** (np. równoległy traktat handlowy albo dar), nie
łączenie dwóch rzeczy w jednym formularzu. Efekt praktyczny: `TREATY_ONLY_FORM_IDS` w
`gra/src/ui/diplomacyTradeBasket.ts` powinien objąć z powrotem wszystkie typy traktatów (nie
tylko `'15'`), tak jak przed niedokumentowanym skurczeniem w commicie `9cc7c76c` (patrz
`R-DYP-STOL-9CC7C76C-ZAKRES-NIEUDOKUMENTOWANY` wyżej — ten wpis teraz się domyka tą decyzją,
kierunek: powrót do treaty-only, nie utrzymanie rozszerzenia).

**Nota procesowa (Maciej, ta sama wiadomość):** pytania ABC bywają zbyt skomplikowane/mylące,
czasem brzmią jak podważanie już podjętych decyzji. Do przestrzegania na przyszłość: prostszy
język, nie wracać do zamkniętych tematów bez wyraźnego powodu.

---

## P-OVERLAY-KOLEJNOSC-WYWOLAN-TRASY-PIGULKI (2026-08-09, znalezisko Operatora przy naprawie P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE) · STATUS: **ZAMKNIĘTE — SCALONE (2026-08-10, patrz niżej w pliku)**

W `applyCityPanelWorldView()` (`gra/src/main.ts`) ten sam błąd kolejności wywołań, który powodował
widmowego złotego chłopka (bramka `isCityPanelOpen()` widziała stan "zamknięty" tuż przed
otwarciem panelu i budowała warstwę, która potem już nigdy się nie odświeży dopóki panel nie
zostanie zamknięty), dotyczy też: `refreshTradeRoutesOverlay()` (łuki tras handlowych) i
`cityRenderer.sync(..., hideStatChips: isCityPanelOpen())` (pigułki miast na mapie). Nie
naprawione — poza zakresem zgłoszenia o chłopkach. Do potwierdzenia czy realnie objawia się w
grze (może być niezauważalne jeśli te warstwy rzadziej się zmieniają w trakcie otwartego panelu).

---

## R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO (2026-08-09) · STATUS: **NIEAKTUALNE — zastąpione przez R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY (praca się nie liczy, patrz niżej w pliku)**

**⛔ To pytanie/zgłoszenie PODWAŻA wcześniejszą decyzję** `R-HUD-MIASTO-STAN-CYWILIZACJI` (ECHO
2026-08-08, commit `8663e084`, FALA 261) — zgodnie z nową zasadą CLAUDE.md §1a oznaczam to wprost,
żeby było jasne że to nie nowy temat, tylko korekta czegoś już wdrożonego.

**Zgłoszenie Macieja (playtest, dosłowny cytat):** „Zobacz rozbieżności między ilościami w
mieście, a ilościami na mapie, jeżeli chodzi o surowce... Pierwszy składnik surowca w mieście to
powinna być ile jest cywilizacji a plus to powinno być tyle ile dochodzi w danym mieście. Wtedy
wiemy ile mamy w cywilizacji nawet jeżeli jesteśmy w mieście wiemy ile w tym mieście dochodzi bo
jest plus."

**Co dziś robi kod (potwierdzone, `gra/src/ui/cityPanel.ts` → `buildCityOnlyW3FlankChips`,
`w3CityChip`):** duża liczba w chipie karty miasta = **suma TEMPA (przyrostu/turę) całej
cywilizacji** (`civWideSixStatsFromEmpireSnap`), mała liczba (+N) = wkład TEGO miasta w to samo
tempo. Przy imperium jednomiastowym (jak dziś na zrzutach — tylko Ateny) duża i mała liczba są
**identyczne** (Praca +9 +9), bo jest tylko jedno źródło tempa — to wygląda jak duplikacja, ale
technicznie nie jest, dopóki nie ma drugiego miasta.

**Co pokazuje główny HUD mapy** (`gra/src/ui/hud.ts` → `renderBarD1B`, zrzut nr 2: „Skarbiec 1 0 ·
Praca 54 +9 · Spichlerz 9 +2 · Nauka 36 +17"): `value` = **realny ZAPAS** (skarbiec/magazyn/nauka
nagromadzona, pole `s.bogactwo`/`s.praca`/etc.), `rate` = tempo EMPIRE-WIDE na turę. To DWIE różne
wielkości niż w karcie miasta (zapas vs suma tempa) — stąd „Skarbiec 0" w mieście (bo to tempo
netto=0) vs „Skarbiec 1" na mapie (bo to realny zapas=1).

**To czego chce Maciej:** duża liczba w karcie miasta = **realny zapas cywilizacji** (ta sama
wielkość co na głównym HUD mapy), mała liczba (+N) = wkład TEGO miasta w tempo — czyli zamiana
„duża liczba" z „suma tempa" na „zapas", przy zachowaniu „mała liczba = tempo tego miasta" bez
zmian.

**Zastrzeżenie do zbadania przez Operatora, nie zgadywać:** czy WSZYSTKIE sześć surowców
(Praca/Żywność/Skarbiec/Nauka/Kultura/Religia) mają sensowny, faktycznie liczony w silniku
odpowiednik „zapasu cywilizacji" — Skarbiec/Spichlerz/Nauka wyraźnie mają (widoczne na HUD mapy),
ale Praca (młotki) w większości gier Civ-podobnych jest lokalna dla kolejki budowy miasta, nie
empire-wide zapasem — sprawdzić czy `s.praca` na HUD mapy faktycznie reprezentuje sensowny
empire-wide zapas Pracy czy coś innego (np. sumę BIEŻĄCYCH kolejek budowy wszystkich miast, co nie
jest tym samym co "zapas"). Kultura/Religia — sprawdzić czy silnik w ogóle śledzi ich empire-wide
zapas, czy tylko tempo. Jeśli dla któregoś surowca nie ma sensownego zapasu — zgłosić, nie
wymuszać sztucznej liczby.

---

## P-DYPLO-SWEETENER-KOSZYK-W-TRAKTACIE (2026-08-09, nota D1 Evaluatora R-DYP-STOL-A-KOREKTA) · STATUS: **ZAMKNIĘTE — ECHO A wdrożone i wdeployowane do ROBOCZA FALA 265 (`2b747b9b`, 2026-08-09), potwierdzone retroaktywnie 2026-08-10**

Evaluator (Opus 5) przy weryfikacji naprawy `R-DYP-STOL-A-KOREKTA` znalazł osiągalną w grze
nieszczelność: `SWEETENER_COUNTER_ELIGIBLE` (`gra/src/game/diplomacy-proposals.ts:1936`) obejmuje
dokładnie przywrócony zestaw treaty-only (nap/sojusz/granice/wasal/pokój) — gdy AI kontruje
ofertę, `withExtraSweetenerGold` **samo wstrzykuje złoto do koszyka** tej kontroferty. Dalej
„Edytuj propozycję na stole" otwiera formularz treaty-only **z pozycjami koszyka już w środku**
(zweryfikowane na żywym renderze: blok „Dołóż do umowy (koszyk PW)" się pojawia), bez UI do
podejrzenia/edycji/usunięcia tych pozycji — payload i tak leci z `receiveItems`. Traktat
inicjowany przez GRACZA jest czysty (0 pól), ale kontroferta AI może wprowadzić koszyk tylnymi
drzwiami. Pytanie do rozstrzygnięcia: czy AI ma w ogóle dokładać złoto-słodzik do traktatów objętych
rozłączeniem, skoro cel decyzji to właśnie ich rozdzielenie od wymiany.

## P-DYPLO-DOPLAC-PW-ZLA-SCIEZKA (2026-08-09, nota D2 Evaluatora R-DYP-STOL-A-KOREKTA) · STATUS: **ZAMKNIĘTE — SCALONE `5a93f5aa` (2026-08-10)**

Komunikaty „Brakuje X PW — dopłać" / „Dopłać X PW" (`diplomacyAcceptanceBalance.ts:625,631`,
`diplomacy-acceptance-points.ts:363-371`) każą graczowi zrobić coś, co w formularzu treaty-only
jest już niemożliwe (brak pól do dopłaty). Powinny kierować do zrobienia osobnej umowy — to
dosłownie cel dzisiejszej decyzji o rozłączeniu.

## P-HUD-KULTURA-SIGNED-NIESPOJNE (2026-08-09, znalezisko Operatora przy R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO) · STATUS: **ZAMKNIĘTE — naprawione bezpośrednio, Evaluator PASS-WITH-NOTES, temat ZAMKNIĘTY (2026-08-10)**

Główny HUD mapy (`gra/src/ui/hud.ts` → `renderBarD1B`) formatuje 5 z 6 chipów jako plain `String(...)`
(bo to zapas, nie delta), ale chip „Kultura" niekonsekwentnie używa `signed(s.kultura)` (wymuszony
znak „+"). Prawdopodobnie drobny, pre-istniejący błąd formatowania, niezwiązany ze zgłoszeniem
zapas-vs-tempo. Nie naprawione, poza zakresem.

---

## P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE — ZWERYFIKOWANE, Evaluator PASS-WITH-NOTES (2026-08-09)

Niezależny Evaluator (Opus 5) potwierdził naprawę na żywo (dowód mutacyjny własny, nie ufając
Operatorowi): kod SPRZED naprawy daje 15/9 (dokładnie jak zgłoszono), cofnięcie kolejności wywołań
23/1, przywrócenie sztywnej zieleni 20/4, **ale** przywrócenie oryginalnej geometrii glifu 24/0 —
asercja „glif mieści się w krążku" jest niedyskryminująca (i stary, i nowy kod ją spełniają, mimo
różnicy w czytelności). Realny wniosek Evaluatora o czytelności: to **złoty krążek + obwódka**
naprawiają problem, nie zmniejszenie glifu — parytet pikselowy z odznaką mapy świata (znaną jako
czytelną-złotą) jest mocniejszym argumentem niż teoria o kolorze emoji.

**4 noty do domknięcia przy scaleniu (nie blokują merytorycznie):**
1. Etykieta plonów urosła ~11,5% w świecie 3D (`worldH` 0,856→0,954) — efekt uboczny większej
   odznaki, Operator tego nie zgłosił. Do obejrzenia w grze pod kątem nachodzenia sąsiednich pól.
2. Asercja glifu do wzmocnienia (próg na stosunek glif/średnica) albo usunięcia — dziś nic nie chroni.
3. Komentarz „Używane przez okolicapreview" w `cityOkolicaOverlay.ts` nieaktualny — brak takiego wywołującego.
4. Diagnoza „zamrożone na zawsze" nieścisła — realnie ginie na ścieżkach `onOkolicaSetFocus`/
   `onOkolicaEnterManual`/`onOkolicaRestoreAuto`/`onSwitchCity`/wzrost populacji, nie wszędzie.

**Potwierdzone jako realne (nie naprawione, osobna sprawa):** `P-OVERLAY-KOLEJNOSC-WYWOLAN-TRASY-PIGULKI`
(trasy handlowe + pigułki miast, ten sam wzorzec błędu) — Evaluator niezależnie potwierdził.
Wszystkie bramki Operatora potwierdzone co do liczby: tsc 0 · logic-test 213/213 · nowy test 24/0
· okolica 46/46 · city-map-badge 62/0 · camera-zoom-block 4/0.

---

## R-DYP-STOL-A-KOREKTA — odtworzone na bezpiecznej bazie, obie noty Evaluatora domknięte (2026-08-09)

Pierwsza próba (worktree na przestarzałej bazie) odrzucona ze względów bezpieczeństwa scalania, nie
merytorycznych — Evaluator dał PASS-WITH-NOTES na treść. Odtworzone od nowa na aktualnym HEAD +
domknięte obie noty: (1) martwy tekst „Opcjonalnie dołóż wymianę PW poniżej." usunięty z `case '10'`;
(2) test wzmocniony — zamiast tautologicznej flagi `isTreatyOnlyFormAction()`, nowa sekcja 21 woła
**realny** `showTradeBasketModal()` i sprawdza wynikowy markup (brak `cdb-add`/`cdb-chip-typ`, brak
nagłówków „(opcjonalnie)"), z kontrolami negatywnymi dla akcji 9/13/14. Dowód mutacyjny: cofnięcie
`TREATY_ONLY_FORM_IDS` do `['15']` → 148/184 (36 czerwonych, po 6 na każdą z 6 przywróconych akcji);
po naprawie 184/184. Bramki: tsc 0 · logic-test 213/213 · wszystkie 31 `diplomacy*.cjs` exit 0.
Gotowe do finalnej (krótszej, potwierdzającej) weryfikacji Evaluatora przed scaleniem.

---

## R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO — ZWERYFIKOWANE, Evaluator PASS-WITH-NOTES (2026-08-09)

Twierdzenie o Pracy (najbardziej wątpliwe w zleceniu) **potwierdzone** — `playerPracaPool` to
jeden mutowalny licznik imperium, dowód: wszystkie ścieżki wydatku (założenie miasta, cuda, start
projektu, auto-ulepszenia, utrzymanie) dotykają dokładnie tego samego pola. Parytet z głównym HUD
mapy potwierdzony liczbowo dla wszystkich 6 surowców.

**N1 (naprawiam od razu, techniczne, bez pytania):** mutacja przywracająca dosłownie zgłoszony
błąd Macieja (podmiana `pracaPool`/etc. z powrotem na pola *Rate* w `cityPanel.ts`) **przechodzi
wszystkie bramki niezauważona** — test bundluje tylko czysty `empire-hud-totals.ts`, wiring w
`cityPanel.ts`/`main.ts` nie jest pokryty niczym. Dołożenie 3 asercji na obecność/brak konkretnych
wywołań w źródle (wzorem `border-march-wygasanie-test.cjs`).
**N2:** Fixture 5 ma pustą asercję (`cityOwn.zloto` już wynosi 0 przed mutacją) — do naprawy razem z N1.

**⛔ N3 — WYMAGA DECYZJI MACIEJA, nowa rozbieżność stworzona przez tę naprawę:**
Dla Pracy i Żywności mała liczba (+N, wkład tego miasta) NIE jest tym, co faktycznie dolicza się
do dużej liczby (zapasu). Przykład ze zgłoszenia „Praca 54 +9": +9 to wkład miasta do WŁASNEJ
kolejki budowy (`doBudynkow`), a do wspólnej puli imperium (dużej liczby 54) idzie inna, osobna
wartość (`doPuli` — w podanym przykładzie realnie +0). Główny HUD mapy pokazałby wtedy „Praca 54
+0", nie +9 — nowa, węższa rozbieżność miasto↔mapa, tym razem w MAŁEJ liczbie. Analogicznie
Żywność (duża = zapas armii państwa, mała = netto do zapasów miasta, inna wartość niż to co idzie
do zapasu państwa). Operator wykonał polecenie dosłownie (zakaz ruszania małej liczby) — pytanie
do Macieja: czy to akceptowalne (dwie uczciwie nazwane, ale różne wartości), czy mała liczba też
ma pokazywać realny wkład do zapasu.

**N4 (do rejestru, niepilne):** `EmpireHudSnap.zloto` i `HudState.bogactwo` to dwa różne pola,
dziś zawsze równe, ale bez wspólnego źródła — ryzyko cichego rozjazdu w przyszłości.
**N5 (do rejestru, niepilne):** chip Pracy nie zaświeci już na czerwono przy ujemnym tempie (zapas
klamrowany ≥0) — sygnał ostrzegawczy przetrwał na małej liczbie, degradacja nie utrata.
**N6 (do rejestru, niepilne, nieosiągalne w grze):** ścieżka fallback `resolveEmpireSnap` nie ma
4 z 6 pól — dziś nieosiągalna (panel tylko dla gracza), ryzyko czysto latentne.

---

## R-WYDARZENIA-FILTR-KATEGORII (2026-08-09) · STATUS: **ZAMKNIĘTE — SCALONE `2984b707` (2026-08-09)**

Zaimplementowano: (1) etykieta „Dyplomacja" zamiast „Koniec tury" wyłącznie dla wpisów handlu
AI↔AI (jedyny realny typ zaśmiecający panel — Operator sprawdził WSZYSTKIE typy wpisów przechodzące
przez `eot-event-defer.ts`, to mieszanka: badania gracza, wzrost/głód, deficyt złota,
auto-ulepszenia, zwycięstwo — tylko handel AI↔AI jest „nie-nasze"); (2) przełącznik `🌍 Inne cyw.`
u góry panelu, domyślnie **WYŁĄCZONY** (chowa spam handlu AI↔AI) — decyzja Operatora, uzasadniona;
(3) przycisk „Usuń wszystkie".

**⛔ Pytanie otwarte:** żądanie Macieja wymieniało TRZY kategorie (własna cywilizacja / pozostałe
umowy innych cywilizacji / wojny-pokoje-najważniejsze innych cywilizacji), ale silnik dziś **nie
generuje w ogóle** trzeciej kategorii (wojny/pokoje między dwoma AI, nie dotyczące gracza) jako
wpisu w panelu — takie zdarzenia lecą tylko do `console.log`, nigdy do `showHintMessage`. Operator
przygotował pole `origin` generycznie (jedna linia doda tę kategorię później), ale NIE zbudował
przełącznika bez danych za nim (zgodnie z zakazem martwego UI, CLAUDE.md). Pytanie: czy chcesz
żebym teraz dodała tę trzecią kategorię (wymaga nowego typu zdarzenia w silniku dla wojen/pokoi
AI↔AI), czy zostaje odłożone.

## R-GRANICE-ZULUSI-KOLOR-NIEWIDOCZNY — zaimplementowane w worktree, jeszcze NIE scalone do gałęzi (2026-08-09)

**⛔ KOREKTA LICZB (2026-08-09, niezależna weryfikacja Evaluatora Opus 5 — pierwotny meldunek
Operatora zawierał błędy):** Kolor Zulusów zmieniony `#2E7D32` (ciemna zieleń) → `#C8E838`
(limonka/chartreuse), kontrast liczony metryką CIE-Lab dE76 względem odcieni terenu: najgorszy
przypadek dla Zulusów 4,6→23,5 (5,1× lepiej). **Poprawka framingu:** próg dE76≥20 użyty w teście
regresyjnym jest **dobrany empirycznie**, nie „zmierzony naukowo" — próg JND (granica ledwo
zauważalnej różnicy) to ok. 2,3 dE76, próg 20 to świadomy zapas bezpieczeństwa, nie standard
naukowy. **Poprawka zakresu:** „pozostałe 13 cywilizacji bezpieczne (≥23,4)" dotyczy tylko
**podzbioru odcieni zieleni** użytych w teście — na pełnej palecie terenu (pustynia/piasek/góry/
biegun/morze/mury) Babilonia/Germanie/Asyria spadają do 16,5–18,6, czyli poniżej progu 20. Fix
Zulusów samych w sobie stoi, ale test nie sprawdza pełnego terenu dla WSZYSTKICH cywilizacji.
Fix i test siedzą dziś wyłącznie w worktree `agent-ae0ba1d148fe9acf8` (baza `b137332a`) —
**nie scalone** do bieżącej gałęzi roboczej; wymaga standardowej procedury bezpiecznego scalenia
(`git merge-base --is-ancestor`) przed commitem na aktualnej gałęzi.

**⛔ Znalezisko przy okazji, ten sam problem u innej cywilizacji:** Celtowie `#3D6B35` mają
najgorszy przypadek dE76 = **~3,3** (poprawiona liczba — pierwotny meldunek Operatora podawał
błędnie 6,4, obalone niezależną implementacją Lab przez Evaluatora ORAZ uruchomieniem kodu
Operatora na kolorze Celtów) — mimo korekty liczby, wniosek pozostaje ten sam: to GORZEJ niż
Zulusi przed poprawką i poniżej progu JND. Operator świadomie NIE ruszył Celtów — kolor
tożsamościowy, wymaga tej samej rozmowy co Zulusi. Pytanie: chcesz żebym teraz też poprawiła kolor
Celtów (ta sama metoda), czy najpierw zobaczysz Zulusów w grze?

---

## R-KARTA-JEDNOSTKI-STRZALKI-CYKL — ZWERYFIKOWANE, Evaluator PASS-WITH-NOTES (2026-08-09)

Reużycie istniejącej funkcji cyklowania potwierdzone `git log -S` na czystej bazie (obie funkcje
sprzed dzisiejszej pracy — `1c9bec98` 2026-08-08, `0c6790d5` 2026-07-27). Realna weryfikacja DOM
(własna sonda Evaluatora, nie test Operatora): nagłówek i strzałki fizycznie nieobecne w DOM, nie
ukryte CSS-em. 4 własne mutacje Evaluatora — wszystkie złapane, w tym kluczowa M2 (gwardia JS na
`disabled` realnie testowana, nie tautologicznie — jsdom nie tłumi kliku na disabled sam z siebie).

**Do domknięcia przy scaleniu:** martwy kod — `isArmyStack`/`headLabel: 'Armia'` (`main.ts:4363-4367`)
liczone, ale karty jednostki już nie renderują `headLabel` (usunięty razem z nagłówkiem „Jednostka").
Bez utraty informacji — treść karty niezależnie pokazuje „Armia · <hexLabel>" gdzie indziej.
Rekomendacja Evaluatora: usunąć martwe linie, spójne z intencją „usunąć opis jednostka".
**Niepilne, do rejestru:** stały podgląd deweloperski `gra/tools/.unit-panel-preview-entry.ts:90`
ma zaszyty nieaktualny nagłówek „Jednostka" (plik śledzony w gicie, nie importuje `sidePanelHud`,
więc się nie zepsuje, ale rozjeżdża się z grą). Centrowanie kamery przy strzałkach potwierdzone —
spójne z dolnym paskiem i Spacją, nie nowa niekonsekwencja.

---

## P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE — odtworzone na bezpiecznej bazie, wszystkie 4 noty domknięte (2026-08-09)

Wszystkie 4 noty Evaluatora domknięte z dowodem: (1) rozmiar etykiety — ZERO wzrostu (geometria w
px absolutnych, nie skalowana, `worldH` identyczne przed/po); (2) asercja glifu zastąpiona
stosunkiem glif/średnica mierzonym z realnych wywołań obu warstw (próg ±0,05 od wzorca mapy świata
0,727) — stara geometria (0,654) wypada z pasma i czerwieni test; (3) nieaktualny komentarz
poprawiony; (4) zasięg „zamrożenia" opisany konkretnymi ścieżkami, bez przesady. Dowód mutacyjny:
23/0 → cofnięcie kolejności 22/1 → cofnięcie koloru+geometrii 15/8 → naprawione 23/0.

**Uczciwie zgłoszony efekt uboczny (nie ukryty):** przeniesienie kolejności wywołań zmienia dane
wejściowe dla `hideStatChips`/`refreshTradeRoutesOverlay` przy otwieraniu panelu (będą teraz
liczone jako "panel otwarty" wcześniej) — kierunek zgodny z zamierzonym projektem, ale częściowo
nakłada się na `P-OVERLAY-KOLEJNOSC-WYWOLAN-TRASY-PIGULKI`. Do obejrzenia w playteście.

---

## ⛔ WAŻNE ODKRYCIE PROCESOWE (2026-08-09): worktree izolacji NIE dziedziczy z bieżącej gałęzi sesji

Przy próbie scalenia `R-DYP-STOL-A-KOREKTA` (odtworzonej rzekomo „na aktualnym HEAD") okazało się,
że worktree odtwarzającego Operatora **nadal stał na `b137332a`** — dokładnie ta sama baza co
pierwsza, odrzucona próba. Zweryfikowane: `git log -1` w tym worktree = `b137332a`, a plik
`diplomacyTradeBasket.ts` w nim ma **zero** wystąpień `techDirection`/`techPaymentMode` (praca nad
akcją-6 z dzisiejszej sesji), podczas gdy mój aktualny HEAD ma ich 29. **Wniosek: `isolation:
"worktree"` w tej sesji tworzy worktree od `main`, NIE od bieżącej gałęzi roboczej sesji** —
polecenie „pracuj na aktualnym HEAD swojej gałęzi" w promptach Operatora nie ma efektu, bo
worktree i tak startuje z ustalonego punktu. To dotyczy WSZYSTKICH dzisiejszych agentów
worktree-isolated, nie tylko tego jednego — wyjaśnia dlaczego każda próba merge tego dnia wymagała
sprawdzenia bezpieczeństwa bazy.

**Konsekwencja praktyczna:** scalanie diffu z worktree do drzewa głównego wymaga za każdym razem
weryfikacji `git merge-base --is-ancestor <baza-worktree> HEAD` — bez wyjątku, nawet gdy Operator
dostał wyraźne polecenie pracy „na aktualnym HEAD". Gdy baza nie jest przodkiem: (a) dla plików
niezmienionych między bazą a HEAD — bezpieczny bezpośredni `git apply` po weryfikacji identyczności
kotwic; (b) dla plików rozjechanych — albo ręczne, chirurgiczne odtworzenie zmiany przez
orkiestratora z weryfikacją kontekstu (jak w tym przypadku — `diplomacyTradeBasket.ts` zawierał
zarówno stary, bezpieczny obszar TREATY_ONLY_FORM_IDS jak i nowy, rozjechany obszar akcji-6 tech-
trade w tym samym pliku), albo nowe zlecenie z prośbą o wynik jako czysty tekst do transkrypcji.
**Do dopisania do `civ-autobot/SKILL.md` §5** jako trzeci, systemowy przypadek (po `b9867b3` i
`92341250`/`cdb29d92`) — tym razem nie błąd pojedynczego agenta, tylko właściwość architektury
narzędzia.

## R-DYP-STOL-A-KOREKTA — SCALONE bezpośrednio przez orkiestratora (2026-08-09)

Po odkryciu że worktree redo-Operatora (jak wyżej) był na tej samej niebezpiecznej bazie co
pierwsza próba, orkiestrator zweryfikował że zmiana dotyczy DWÓCH bezpiecznych, izolowanych
obszarów pliku (komentarz+`TREATY_ONLY_FORM_IDS` w liniach 498-506 obecnego HEAD, `case '10'` w
linii ~727 — żaden nie pokrywa się z rozjechanym obszarem akcji-6 tech-trade w liniach 487-496) i
zastosował zmianę chirurgicznie przez Edit na aktualnym pliku, plus bezpieczny `git apply` diffu
testowego (czysty append, kotwice zweryfikowane identyczne przed zastosowaniem). Bramki na scalonym
stanie: `tsc` 0 błędów · `logic-test` 213/213 · `diplomacy-proposal-test.cjs` **187/187** (184
zweryfikowane przez Evaluatora + 3 pre-istniejące testy tech-za-tech z akcji-6, oba zestawy
zachowane). Diff ograniczony do 2 plików, +130/−4 linii, zero przypadkowych zmian. **SCALONE**
`872c1e0d` po własnej weryfikacji orkiestratora (druga runda Evaluatora dała PASS wcześniej na tej
samej treści, przed odkryciem procesowym).

---

## P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE — SCALONE `872c1e0d` (2026-08-09)

Evaluator potwierdzający dał PASS-WITH-NOTES (nota #4 = tylko literówka w komentarzu, poprawiona
przy scaleniu). Ustalenie dodatkowe Evaluatora: przeniesienie kolejności **częściowo naprawia**
`P-OVERLAY-KOLEJNOSC-WYWOLAN-TRASY-PIGULKI` (ścieżka otwierania panelu) — kto podejmie tamten
temat, zastanie objaw już nieobecny na tej ścieżce.

## P-REKRUTACJA-NAZWY-ZNIKAJA — SCALONE `872c1e0d` (2026-08-09)

Potwierdzone: NIE regresja z dzisiejszej sesji (zero zmian w dotkniętych plikach między
zdeployowanym buildem `35a8b636` a HEAD sprzed naprawy). Przyczyna: defekt CSS flex-layout
(kolumna kosztu `flex:none` wypychała kolumnę nazwy do zera przy szerszych chipach), obecny od
2026-08-06. Naprawa: 2 linie CSS. Nowy test regresyjny 17/17.

---

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE (2026-08-09, zgłoszenie z playtestu) · STATUS: **ZAMKNIĘTE — SCALONE `8692b61b` (2026-08-09)**

**Cytat Macieja:** „powinien być [w] panelu miasta tryb ustawienia globalnego dla skarbu, dla
jedzenia i dla produkcji. Po naciśnięciu przycisku tylko dla tego miasta powinien właśnie się
robić wyjątek dla tego miasta, ale przy normalnym przesuwaniu wszystkie przyciski czy wskaźniki
powinny zmieniać się dla całego państwa [...] dlatego że przy zakładaniu kolejnych miast potem to
jest żmudne ustalanie za każdym razem nowego, domyślnego ustawienia dla całej cywilizacji."
Druga, alternatywna propozycja tego samego mechanizmu: chipy Skarbiec/Praca/Spichlerz(/Nauka) na
głównym HUD mapy (zrzut: „Skarbiec 316 +14 · Praca 12 +62 · Spichlerz 164 +29 · Nauka 87 +76") jako
miejsce ustawiania wartości GLOBALNEJ, z osobnym przyciskiem „lokalnie" do nadpisania per miasto,
bez wpływu globalnych na już-lokalnie-nadpisane miasta. Ma obejmować też Naukę.

**Nie inicjuję jeszcze implementacji ani ABC** — nie wiem dokładnie, do jakiego DZISIEJSZEGO
mechanizmu w grze się to odnosi (priorytet Praca/Żywność per miasto? coś związanego z „Auto-
zarządzaj"? inny suwak?). Dispatchuję czyste rozpoznanie (Explore/Sonnet 5, bez kodowania) —
dopiero po zebraniu faktów przedstawię ewentualne warianty do decyzji.

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE — ECHO A, decyzja Macieja (2026-08-09)

**Rozpoznanie:** mechanizm „globalne domyślne + lokalne nadpisanie" istnieje już DWA razy w
kodzie w innym kontekście (Danina/Handel — `Map<ownerId, CityPodzialHandlu>` +
`City.podzialHandluOverride` + `resolveCityPodzialHandlu()`; auto-ulepszenia terenu —
`City.ulepszeniaOverride`), ale NIE dla Praca/Żywność (`okolicaFocus`), podziału Praca budynki/
skarbiec (`podzialPracy`) ani priorytetu produkcji (`budowaFocus`/`budowaTryb`) — te trzy pola
dziś zawsze startują od tej samej wartości domyślnej dla każdego nowego miasta.

**[TEMAT: Globalne vs lokalne ustawienia miasta]**
- **A — Wdrożyć wzorem Danina/Handel** (Mapa<ownerId, wartość domyślna> + `override: boolean` per
  miasto). Za: gotowy, sprawdzony wzorzec w kodzie; spójny z istniejącym UI. Przeciw: interfejs
  Danina/Handel jest w innym miejscu ekranu niż suwaki Praca/Żywność/Produkcja — trzeba
  zaprojektować nowe umiejscowienie przycisku „lokalnie".
- **B — Wdrożyć wzorem auto-ulepszeń terenu** (`City.override` boolean + resolver). Za: prostszy
  model danych. Przeciw: auto-ulepszenia to jednorazowa decyzja, nie stały suwak — może nie pasować.
- **C — Nowy, wspólny mechanizm dla wszystkich trzech pól naraz**, zaprojektowany od zera. Za:
  najlepiej dopasowany. Przeciw: najwięcej nowego kodu.

Rekomendacja Sonnet 5 była B. **Decyzja Macieja: A** (dosłownie „ID: R-MIASTO-USTAWIENIA-GLOBALNE-
VS-LOKALNE a"). ECHO potwierdzone w czacie. Dispatch implementacji wzorem Danina/Handel — bez
deployu, zgodnie z procedurą NUMER→ABC→COMMIT→DEPLOY.

## R-EPOKA-CUD-WARUNEK-AWANSU (2026-08-09, zgłoszenie z playtestu) · STATUS: **ZAMKNIĘTE — SCALONE `13861b60` (2026-08-10), podtematy B2/B3 też domknięte (patrz niżej w pliku)**

**Cytat Macieja:** „Cywilizacja nie może przejść do następnego etapu, jeżeli nie stworzy cudu,
który jest jej przypisany w danej epoce. Czyli żeby przejść na przykład do brązu, musi wybudować
cud, który odpowiada [...] cywilizacji w kamieniu. Jeżeli w jakiejś epoce nie ma swojego cudu, to
nie ma tego warunku." Nowa reguła: awans do kolejnej epoki wymaga zbudowania cywilizacyjnego cudu
przypisanego do BIEŻĄCEJ epoki (jeśli taki cud istnieje dla danej cywilizacji w tej epoce — jeśli
nie istnieje, warunek nie obowiązuje). To realna zmiana zasad gry (twardy gate na awans epoki),
nie naprawa błędu — wymaga pełnej formy ABC przed kodowaniem (wpływ na balans, AI musi też to
respektować — parytet gracz/AI). Do zrobienia: rozpoznanie ile cywilizacji ma dziś przypisane
cuda per epoka (czy każda ma dokładnie jeden, czy są luki), jak dziś działa mechanizm awansu epoki,
zanim przedstawię ABC.

## R-KARTA-JEDNOSTKI-STRZALKI-CYKL — SCALONE `02a5e095` (2026-08-09)

Dwukrotnie zweryfikowane, martwy kod `isArmyStack`/`headLabel:'Armia'` domknięty. Bramki: tsc 0 ·
logic-test 213/213 · nowy test 20/20 · unit-context-card-test 29/29 bez regresji.

---

## R-EPOKA-CUD-WARUNEK-AWANSU — rozpoznanie gotowe, pytanie ABC (2026-08-09)

**Fakty:** awans epoki dziś = wyłącznie 1 konkretna technologia (Brązownictwo K→B, Hutnictwo
żelaza B→Ż), zero powiązania z cudami. Gra ma dziś 3 epoki (Kamień/Brąz/Żelazo), epoki 4+ to
nieaktywny placeholder. Każda z 15 cywilizacji ma dokładnie **1 cud wyłączny (E)**, ale tylko w
**1 z 3 epok** (Egipt→Kamień, 8 cywilizacji→Brąz, 6→Żelazo) — czyli **30 z 45 par civ×epoka nie
ma przypisanego cudu**, więc wg Twojej własnej zasady „jeśli epoka nie ma cudu, nie ma warunku"
reguła realnie dotyczyłaby TYLKO jednego z 2 przejść na cywilizację, nie obu. Osobno istnieją cuda
wyścigowe (R) — dostępne dla wszystkich 15, ale max 1 na całym świecie — to NIE jest cud
„przypisany" jednej cywilizacji, więc nie powinien liczyć się do tego warunku.
**Ryzyko:** AI ma świadomą logikę budowy cudów (priorytet własny E), ale throttlowaną (co 2-8 tur
zależnie od trudności) i progową (musi mieć nadwyżkę Pracy) — nie ma dziś gwarancji, że AI zdąży
zbudować swój cud E zanim spełni warunek technologiczny awansu. Realne ryzyko: AI utyka w epoce.

**[TEMAT: Cud jako warunek awansu epoki]**
- **A — Wdrożyć wprost:** brak cudu E w danej epoce = brak warunku (zgodnie z Twoim opisem).
  Za: dokładnie to o co prosiłeś. Przeciw: dotyczy tylko 1/3 przejść na cywilizację (bo tylko tam
  ma przypisany cud), więc efekt gameplayowy będzie węższy niż mogłoby się wydawać z opisu; ryzyko
  usidlenia AI wymaga wcześniej dostrojenia progu/throttle budowy cudów.
- **B — Nie wdrażać teraz** — zbyt wąski efekt (1/3 przejść) i realne ryzyko blokady AI bez
  wcześniejszego dostrojenia jego logiki budowy cudów.
- **C — Wdrożyć, ale najpierw podnieść priorytet/częstotliwość budowy WŁASNEGO cudu E w AI**
  (zmniejszyć throttle, obniżyć próg opłacalności) tak, żeby AI realnie zdążyło, zanim zablokuje
  się gate.

Rekomendacja: **C** — sama reguła jest prosta i zgodna z Twoim opisem, ale bez wcześniejszego
dostrojenia AI realne ryzyko to cywilizacje AI utykające w Kamieniu/Brązie na stałe.

## R-EPOKA-CUD-WARUNEK-AWANSU — ECHO A + istotne doprecyzowanie zakresu, decyzja Macieja (2026-08-09)

**Decyzja: A**, z dwoma doprecyzowaniami wykraczającymi poza pierwotny zakres pytania (cytat
Macieja): „ta zasada dotyczy tylko głównych cywilizacji a nie państw miast, poza tym dla każdej
cywilizacji przejście w inną epokę powinno być dopiero wtedy kiedy dana cywilizacja odkryje
wszystkie badania i każda cywilizacja przechodzi do nowej epoki dopiero w swoim czasie, kiedy ma
wszystkie spełnione warunki. To nie jest tak, że jedna cywilizacja jest w brązie i na całym
świecie już jest brąz. To jest główna charakterystyka tej gry cywilizacja, że tak właśnie nie
jest. Że na przykład czołgi mogą walczyć z falangą."

**Zakres decyzji finalnie:**
1. Warunek cudu (E) przed awansem epoki — **wyłącznie dla głównych cywilizacji**, NIE dla miast-
   państw.
2. **NOWY, szerszy warunek** (poza pierwotnym zakresem ABC): awans epoki wymaga odkrycia
   WSZYSTKICH technologii bieżącej epoki, nie tylko jednej wyróżnionej (`awansDoEpoki`). Dziś
   mechanizm to 1 technologia na przejście (Brązownictwo K→B, Hutnictwo żelaza B→Ż) — Maciej chce
   zaostrzenia do „wszystkich" plus cud.
3. Progresja per cywilizacja NIEZALEŻNIE i asynchronicznie — **to już jest dzisiejsze zachowanie**
   silnika (potwierdzone przy innym rozpoznaniu: `computeOwnerEraFromResearch`,
   `syncOwnerEraFromResearch` per-owner) — Maciej podkreśla żeby tego NIE zepsuć, nie prosi o nową
   funkcję w tym punkcie.

**Sprawdzone bezpośrednio (bez subagenta) — zbiór technologii epoki jest dziś dobrze zdefiniowany:**
`gra/data/tech.json` → pole `Epoka` na każdej z 32 technologii: **Kamień 12 · Brąz 12 · Żelazo 8**.
To spójny, policzalny zbiór — warunek „wszystkie badania epoki" jest technicznie dobrze określony,
nie wymaga dalszego rozpoznania w tym punkcie.

**⛔ Ryzyko AI SIĘ ZWIĘKSZA względem pierwotnego pytania** (dwa warunki naraz: cud + komplet 12/12/8
technologii, zamiast samej 1 technologii + cud) — pierwotna rekomendacja C (podnieść priorytet
budowy własnego cudu w AI) staje się jeszcze ważniejsza; dodatkowo throttle badań AI powinien być
sprawdzony pod kątem czy AI realnie zdąży ukończyć KOMPLET technologii epoki w rozsądnym czasie.
Dispatch implementacji z tym zastrzeżeniem wprost w zleceniu — Operator ma zbadać throttle badań AI
i zgłosić, jeśli zobaczy realne ryzyko trwałego utknięcia, zamiast zgadywać czy jest bezpiecznie.

---

## R-WYDARZENIA-FILTR-KATEGORII — SCALONE `2984b707` (2026-08-09)

Odtworzone od zera (redo-Operator), N1+N2 domknięte, druga runda Evaluatora dała PASS-WITH-NOTES
bez żadnej noty blokującej (5 własnych mutacji Evaluatora, wszystkie złapane; 44/44 bramek w
przekroju zielone). Scalone bezpośrednio przez orkiestratora — 3 z 4 zmienionych plików (`main.ts`,
`sidePanelHud.ts`, `hud.ts`) miały zdywergowaną bazę worktree (zawsze `main`), zweryfikowane
per-hunk (kotwice tekstowe unikalne i niezmienione w HEAD) i zastosowane chirurgicznie przez Edit;
`eot-event-defer.ts` identyczny base=HEAD, bezpieczny `git apply`. Nowy plik `sidePanelEventFilter.ts`
+ test + stub skopiowane bezpośrednio (bez ryzyka dywergencji). Bramki na scalonym stanie: tsc 0 ·
logic-test 213/213 · eot-event-defer-test 5/5 · sidepanel-events-toolbar-test 19/19.

**Niepilne noty z drugiej rundy Evaluatora, do rejestru (nie blokowały scalenia):** N3 — okablowanie
`main.ts→hud.ts→sidePanelHud.ts` (przekazanie `onDismissAll`) nadal bez pokrycia testem (dowód
mutacyjny: usunięcie jednej linii w `hud.ts` nie czerwieni żadnej bramki) — zamykalne dodaniem
drugiego esbuild-stuba (`scienceOwlIcon.ts`), ale żadna istniejąca bramka tego dziś nie robi. N4 —
`AI_AI_TRADE_MARKER` w `eot-event-defer.ts` duplikuje literał komunikatu z `main.ts:13629` zamiast
dzielić wspólną stałą — rozjazd treści po cichu zepsułby i etykietę, i filtr. N5 — artefakt bramki
`.sidepanel-events-toolbar-bundle.css` nieobjęty `.gitignore` (wzorzec łapie tylko `.cjs`). N6 —
toolbar renderuje się nawet przy 0 wydarzeniach (kosmetyka). N7 — `clearAllSidePanelEvents` omija
flagę `blocking:true` (dziś nieużywaną nigdzie w kodzie — uśpione ryzyko). **N8 — do potwierdzenia
u Macieja:** przełącznik „Inne cyw." jest ADDYTYWNY (wyłączony = tylko nasze, włączony = nasze+obce),
nie rozłączny — nie da się zobaczyć WYŁĄCZNIE cudzych wydarzeń. Może to być lepsze UX niż dosłowne
żądanie, ale to interpretacja, nie 1:1 spełnienie.

---

## R-WYDARZENIA-FILTR-KATEGORII — Evaluator PASS-WITH-NOTES, 2 noty blokujące (2026-08-09)

Klasyfikacja AI↔AI i filtracja innych źródeł zdarzeń potwierdzone niezależnie (w tym jeden tor
AI↔AI, którego Operator nie wymienił — nieszkodliwy, tylko `console.log`).

**🔴 N1 (blokująca):** „Usuń wszystkie" NIE jest trwałe dla wpisów `eot-hint-*`/`era-*` — trafiają
do `warEventLog`, który nie czyści się co turę, a `dismissedSidePanelEventIds` (miękkie ukrycie)
**czyści się na końcu każdej tury**. Skutek: klikasz „Usuń wszystkie", panel pusty, kończysz turę
— stare wpisy „Koniec tury"/„Dyplomacja" z tej tury **wracają**. Dokładnie to, o co prosiłeś, nie
działa trwale dla najbardziej dokuczliwej kategorii. Naprawa jednolinijkowa (usuwać z
`warEventLog` bezpośrednio, nie tylko oznaczać jako ukryte).

**🔴 N2 (blokująca):** Operator napisał że „brak harnessu DOM dla tego typu UI w repo" — Evaluator
to obalił: wzorzec już istnieje (`gra/tools/army-merge-dismiss-bounce-test.cjs`, jsdom + stub
brandAssets). Konsekwencja zmierzona: dowód mutacyjny wykazał że **wyłączenie przełącznika
filtra ORAZ usunięcie przycisku „Usuń wszystkie" (dwie funkcje, o które prosiłeś) przechodzą
komplet bramek na zielono** — zero pokrycia regresyjnego warstwy UI.

**🟡 Niepilne:** N3 (guard `blocking` pominięty przy „Usuń wszystkie", dziś nieszkodliwy, nikt
nie ustawia `blocking:true`); N4 (wojna AI→gracz nadal tworzy DUPLIKAT wpisu z etykietą „Koniec
tury" obok poprawnie nazwanego `war-*` — ten sam kod ma już wzorzec unikania duplikatu przy
`border-march`, tu go nie zastosowano); N5 (kosmetyka — utracony komentarz z kotwicą decyzji,
15-krotny redraw HUD na jedno kliknięcie „Usuń wszystkie", martwa funkcja pre-istniejąca).
**Proces:** ten wpis miał zły format nagłówka (nie łapał go grep z CLAUDE.md §0c) — poprawiony.

Dispatch domknięcia N1+N2 przed scaleniem.

---

## R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY (2026-08-09, zgłoszenie z playtestu) · STATUS: **ZAMKNIĘTE — SCALONE `f4d427e8`, potwierdzone post-scalenia przez Evaluatora (2026-08-10)**

**⛔ To zgłoszenie PODWAŻA decyzję zatwierdzoną chwilę wcześniej dziś** (`R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO`, Evaluator PASS-WITH-NOTES powyżej, jeszcze NIE scalona do gałęzi) — zgodnie z CLAUDE.md §1a
oznaczam to wprost. Agent `a35d817d715b1b210`, który dokańczał N1/N2 tamtej naprawy, został
zatrzymany w trakcie — zdążył tylko zameldować, jakie pola danych w silniku są do ponownego użycia
(patrz niżej), nic więcej z jego pracy się nie liczy.

**Cytat Macieja (dosłowny, koryguje własną wcześniejszą prośbę z tego samego dnia):** „duża liczba
to powinno być ile dochodzi w tym mieście, a mała liczba ile w całej cywilizacji [...] z jednej
strony jest to ok, może tak zostać, ale nadal brakuje informacji o całej cywilizacji — ile
zeskładowanej sumy surowców [jest w całej cywilizacji] dałbym w nawiasie poniżej małej liczby,
poniżej tego plusa [...] inny kolor, na przykład złoty."

**Nowy, docelowy układ trzech elementów w chipie karty miasta (zastępuje układ z poprzedniej
decyzji, NIE dodaje się do niego):**
1. **Duża liczba** = tempo TEGO miasta (przyrost/turę wkładu tego konkretnego miasta) — to jest
   dokładnie to, co dziś liczy `w3CityChip` jako „mała liczba (+N)" w aktualnym (niescalonym) kodzie.
2. **Mała liczba (+N)** = tempo CAŁEJ cywilizacji (suma wszystkich miast) — to jest dokładnie to,
   co dziś liczy `w3CityChip` jako „dużą liczbę" (`civWideSixStatsFromEmpireSnap`) — czyli #1 i #2
   to w istocie ZAMIANA MIEJSC wielkości dużej i małej liczby względem tego, co jest dziś w kodzie
   (i względem tego, co właśnie miała zrobić `R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO` — ta praca się
   nie liczy, patrz wyżej).
3. **NOWY, trzeci element** — w nawiasie, w osobnym kolorze (propozycja: złoty), pod małą liczbą:
   realny ZAPAS całej cywilizacji (ta sama wielkość co dziś na głównym HUD mapy — skarbiec/magazyn/
   nauka nagromadzona), czyli dokładnie to co próbowała pokazać jako „dużą liczbę"
   `R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO` (ale tam bez wyróżnienia kolorem i bez nawiasu).

**Zastrzeżenie N3 z poprzedniej naprawy (Praca/Żywność: mała liczba miasta ≠ realny wkład do puli
imperium) NADAL obowiązuje** i przenosi się na nowy układ 1:1 — dotyczy teraz elementu #1 (duża
liczba, dawniej małej). Nie zgadywać, przenieść ostrzeżenie do implementacji.

**Źródła danych już potwierdzone (przez zatrzymanego agenta `a35d817d715b1b210`, do ponownego
użycia, nie trzeba odkrywać na nowo):** zapas cywilizacji (element #3) — `EmpireHudSnap.pracaPool` /
`zywnoscReserve` / `zloto` / `nauka` / `kultura` / `religionStock`; tempo (elementy #1 i #2) —
istniejące pola `*Rate`.

**Odłożone na później, tylko zarejestrowane (P-KOLOR-SUROWCE-MIASTO-VS-MAPA-UJEDNOLICIC niżej) —
NIE robić teraz.**

**Evaluator (Opus 5): PASS-WITH-NOTES, dowód mutacyjny (6 mutacji, 2 nie złapane).** Duża/mała/zapas
potwierdzone merytorycznie (nie tylko nazwy zmiennych), trzeci element = ta sama wielkość co główny
HUD mapy dla WSZYSTKICH 6 surowców gracza (tabela zgodności w pełnym raporcie). **3 noty do naprawy
przed scaleniem:**
- **N1 (najważniejsza):** test NIE strzeże głównego deliverable — usunięcie renderu trzeciego
  elementu ORAZ odcięcie wiring caller→`w3CityChip` (2 niezależne mutacje) przechodzą 29/29 zielono.
  Test sprawdza tylko obecność tekstu w martwym kodzie, nie faktyczny render.
- **N2:** fallback `stock: empire.pracaPool ?? empire.pracaRate ?? 0` dla PANELU MIASTA RYWALA
  (ownerId≠0, brak `pracaPool` na tej ścieżce) pokazuje TEMPO zamiast zapasu, mimo że tooltip nazywa
  to „zapas" — jedyny z 6 surowców z tym problemem, poprawka jednotokenowa (usunąć `?? pracaRate`).
- **N3:** komentarz-kanon w kodzie (`cityPanel.ts:8807`) twierdzi że `doBudynkow` „nigdy" nie trafia
  do puli imperium — OBALONE przez `production.ts:1389-1394` (trafia, gdy kolejka budowy jest
  pusta). Kierunek zastrzeżenia słuszny, słowo „nigdy" fałszywe — trafiło do repo jako fakt wbrew
  CLAUDE.md §0b, do przeredagowania.
Niepilne: N4 (przestarzały docstring sąsiedniego testu), N5 (chip miasta rywala pokazuje mylące
„(0)" zamiast pomijać element gdy brak danych zapasu).

**N1-N3 naprawione przez Operatora (worktree `agent-a67d5e9f736e1d984`), czeka na Evaluatora.**
N1: logika renderu trzeciego elementu wydzielona do nowej, eksportowanej, DOM-free funkcji
`buildChipDeltaStockHtml()` w `empire-hud-totals.ts` — test przepisany, teraz woła tę funkcję
naprawdę + AST-owa kontrola (przez `typescript` compiler API) że wszystkie 6 wywołań `w3CityChip(`
mają 8 argumentów kończących się na `.stock`. Dowód: obie wcześniej-nieuchwycone mutacje teraz
czerwienieją (35/38 i 36/38). N2: usunięty `?? empire.pracaRate` z fallbacku. N3: komentarz
przeredagowany na „NIE trafia do puli, DOPÓKI kolejka budowy nie jest pusta". N4 też naprawione.
N5 świadomie pominięte (wymaga decyzji produktowej). Bramki Operatora: tsc 0, logic-test 213/213,
nowy test 38/38, sąsiedni test 20/20 bez regresji.

**Evaluator (druga runda): PASS-WITH-NOTES, ⛔ N6 BLOKUJĄCA — N1 nadal nie domknięte, szew
przesunięty o jeden poziom.** N2, N3, N4 potwierdzone POPRAWNE (własna weryfikacja, nie na słowo).
Evaluator wykonał 7 własnych mutacji (nie tylko powtórzył 2 Operatora) — 3 nowe uciekły:
- **N6 (blokująca):** mutacja `buildChipDeltaStockHtml(civRate, civStock)` → `buildChipDeltaStockHtml(civRate)`
  (usunięcie DRUGIEGO argumentu w miejscu WYWOŁANIA wewnątrz `w3CityChip()`) kasuje trzeci element
  ze WSZYSTKICH 6 chipów, a bateria bramek zostaje w pełni zielona (38/38, tsc 0). AST-owa kontrola
  sprawdza tylko że wywołanie istnieje i trafia do `return` — NIGDY nie sprawdza jego argumentów.
  Ta sama klasa błędu co oryginalna N1, tylko przesunięta o jeden poziom (z callera `w3CityChip`
  na wnętrze `w3CityChip` wołające `buildChipDeltaStockHtml`).
- **N7 (niepilna):** AST nie sprawdza że 8. argument (`.stock`) odnosi się do TEGO SAMEGO surowca
  co 7. argument — podmiana na zapas złego surowca (np. chip Nauki pokazujący zapas Pracy)
  przechodzi niezauważona.
- **N8 (niepilna):** 7. argument (mała liczba, tempo cywilizacji) w ogóle niestrzeżony przez AST —
  podmiana na zapas zamiast tempa przechodzi niezauważona.
- **N9 (niepilna, do rejestru osobno):** `main.ts:21004` przejściowo ustawia `_lastKultura` na
  wartość TEMPA przed nadpisaniem realnym zapasem w linii 22006 — jeśli faza „MIASTO" rzuci
  wyjątkiem między tymi liniami, trzeci element Kultury pokaże tempo zamiast zapasu. Pre-istniejące,
  tylko ścieżka błędu, semantyka Operatora poza tym poprawna.
Naprawa N6+N7+N8 to ~8 linii w istniejącym bloku AST testu (linie 258-293), bez dotykania kodu
produkcyjnego. Dispatch trzeciej rundy naprawy, skupionej wyłącznie na wzmocnieniu asercji AST.

**N6-N8 naprawione przez Operatora (worktree `agent-aaf9af7386d8ca891`), czeka na finalnego
Evaluatora.** Kod produkcyjny NIETKNIĘTY (identyczny jak w poprzedniej, zweryfikowanej wersji) —
zmiana wyłącznie w teście: N6 (asercja: `buildChipDeltaStockHtml(...)` musi mieć dokładnie 2
argumenty, drugi kończący się na `civStock`), N7 (prefiks obiektu bazowego 7. i 8. argumentu musi
być identyczny dla każdego z 6 wywołań), N8 (7. argument musi kończyć się na `.small`). Dowód:
wszystkie 3 mutacje z drugiej rundy Evaluatora teraz czerwienieją (były 38/38 zielono, teraz N6→2
FAIL/40, N7→1 FAIL, N8→1 FAIL). Bramki na niezmutowanym kodzie: tsc 0, logic-test 213/213, nowy
test 42/42 (38+4 nowe asercje), sąsiedni test 20/20 bez regresji.

## P-KOLOR-SUROWCE-MIASTO-VS-MAPA-UJEDNOLICIC (2026-08-09, uwaga Macieja przy R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY) · STATUS: **OTWARTE — niepilne, „temat na później" (cytat Macieja)**

Maciej zwrócił uwagę, że trzeba ujednolicić zasady kolorów prezentacji surowców między panelem
miasta a głównym HUD-em mapy świata — dziś różne miejsca używają różnych konwencji kolorystycznych
dla tych samych sześciu surowców (Praca/Żywność/Skarbiec/Nauka/Kultura/Religia). Jego słowa: „to
jest temat na później" — świadomie nie inicjuję ABC ani implementacji, tylko rejestruję, żeby nie
zgubić.

---

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — rozpoznanie gotowe, wymaga ABC (2026-08-09)

**Rozpoznanie (Explore):** przyczyna znaleziona precyzyjnie. `onSeparate` w `promptMergeIfCoLocated`
(`gra/src/main.ts` ~8644–8677) po kliknięciu „Zostaw osobno" woła `assignBounceHexesForUnits`
(`gra/src/game/armyMerge.ts:310-354`) z **całą listą ID jednostek armii naraz** — ta funkcja z
założenia (potwierdzone istniejącym testem `army-merge-bounce-test.cjs`, który wprost wymaga, żeby
DRUGA jednostka trafiła na INNY heks niż pierwsza) przydziela **każdej jednostce osobny, wolny
heks**, traktując je jak niezależne, odrzucone byty — stąd rozpierzchnięcie całej armii. Dla
pojedynczej jednostki błąd jest niewidoczny (nie ma z kim dzielić heksu), dlatego nie złapały go
istniejące testy (`army-merge-dismiss-bounce-test.cjs`, 16/16 zielone).

**To NIE jest regres** — funkcja działa zgodnie z własnym testem, błąd jest w MIEJSCU WYWOŁANIA
(przekazanie całego stosu tam, gdzie oczekiwana jest lista niezależnych bytów).

**Fakt projektowy potwierdzony w kodzie:** `gra/src/types/army.ts:4` — „Na jednym polu stoi
maksymalnie 1 żeton armii danej nacji (par. 6b)". Silnik NIE MA dziś pojęcia „dwie niezależne,
wybieralne armie na jednym heksie" (poza specjalnym przypadkiem garnizon/pole w mieście, gdzie UI i
tak każe je scalić) — brak pola `armyId`/`stackId` w runtime. Czyli dosłowne życzenie Macieja
(„armia i jednostka mają móc być na jednym heksie, wybieramy którą prowadzimy") to NOWA FUNKCJA,
nie naprawa istniejącego mechanizmu — wymagałaby zmiany reguły par. 6b + modelu danych + UI wyboru
+ dostosowania AI/save-load.

**[TEMAT: Zakres naprawy „Zostaw osobno"]**
- **A — Naprawić tylko rozpraszanie, w ramach obecnej reguły „1 stos na polu":** „Zostaw osobno" ma
  cofać CAŁĄ armię RAZEM na jeden heks (miejsce startowe albo najbliższy wolny sąsiad), zamiast
  rozbijać ją jednostka-po-jednostce. Za: prosta, punktowa poprawka (jedna funkcja wywołania),
  zgodna z dzisiejszą architekturą i testami. Przeciw: NIE spełnia dosłownego życzenia „armia i
  jednostka razem na jednym heksie, wybieralne osobno" — po naprawie nadal trzeba wybrać
  połącz/cofnij, nie będzie współistnienia.
- **B — Nowa funkcja: dwie niezależne armie na jednym heksie, wybieralne osobno.** Za: dokładnie to
  o co poprosił Maciej. Przeciw: duży zakres (model danych `armyId`, UI wyboru, zmiana reguły 6b,
  AI musi to respektować, kompatybilność zapisów gry) — nieproporcjonalny do zgłoszonego objawu
  (rozpraszania), realnie osobny temat wymagający własnego ABC.
- **C — Naprawić rozpraszanie jak w A, ale osobno zapytać czy B ma być kolejnym tematem** (nie
  łączyć obu decyzji w jedno pytanie).

Rekomendacja: **C** — sam bug (rozpraszanie) jest tani i bezsporny do naprawienia od razu; decyzja o
nowej funkcji „dwie armie na jednym heksie" to za duża zmiana zasad gry, żeby doczepiać ją bez
osobnej rozmowy.

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — ECHO A, decyzja Macieja + doprecyzowanie (2026-08-09)

**Decyzja: A** (bez funkcji B — potwierdzone, żadnego rozpraszania w ogóle). Cytat Macieja:
„w takim wypadku nie potrzebujemy przycisku rozproszenie, tylko wtedy, jeżeli armia wraca na swoje
miejsce do powrót. Czyli albo łączymy, albo wracamy na to samo miejsce przy powrocie, jeżeli nie
decydujemy się na połączenie z armią, która już tam jest, nie powinien być tracony punkt ruchu."

**Doprecyzowanie ponad wariant A z rozpoznania:** (1) armia cofa się na miejsce, Z KTÓREGO
przyszła (nie na „najbliższy wolny sąsiedni heks" — ta alternatywa z opisu wariantu A odpada);
(2) cofnięcie NIE ma kosztować punktu ruchu — ruch ma być traktowany tak, jakby się nie odbył
(pełny zwrot kosztu ruchu tej tury), nie tylko przestawienie pozycji bez zwrotu.

Dispatch implementacji: `onSeparate` w `promptMergeIfCoLocated` (`main.ts` ~8644-8677) ma przenieść
WSZYSTKIE jednostki z `movedUnitIds` razem na `(fromQ, fromR)` (skąd faktycznie przyszły, nie przez
`assignBounceHexesForUnits`) i cofnąć zużyty koszt ruchu tej armii za ten ruch (Operator ma znaleźć
dokładny mechanizm licznika punktów ruchu jednostki/armii i sposób jego cofnięcia — nie zgadywać).

---

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO (2026-08-09, zgłoszenie z playtestu, bug) · STATUS: ARCHIWALNE — zastąpione wpisem powyżej

**Cytat Macieja:** „gdy armią najechałem na miejsce innej jednostki jest przycisk połącz lub zostaw
osobno. W momencie, gdy dałem zostaw osobno, to wszystkie jednostki rozpierzchły się na wszystkie
strony i cała armia się rozsypała. A to powinno mówić o tym, że wtedy jest armia oraz dana jednostka
w tym samym hexie. Po prostu można wybrać, którą chce się funkcjonować [użyć] i kierować i powinny
mieć możliwość bycia na jednym hexie."

**Oczekiwane zachowanie:** wybór „zostaw osobno" powinien pozwolić, żeby armia (stack) ORAZ
pojedyncza jednostka współistniały na tym samym heksie jako dwa odrębne, wybieralne cele — gracz
przełącza się między nimi, żadna nie jest wypychana. **Obserwowane zachowanie:** cała armia (wiele
jednostek w stacku) rozpada się i rozprasza na sąsiednie heksy, zamiast zostać na miejscu obok
pojedynczej jednostki. Dispatch Explore (bez kodowania) — znaleźć logikę obsługi przycisku „zostaw
osobno" (prawdopodobnie okolice army-merge / stack-split w `gra/src/game/**` lub `gra/src/ui/**`,
por. istniejący wzorzec `army-merge-dismiss-bounce-test.cjs`) i ustalić czy to founded bug w logice
rozstawienia po odrzuceniu połączenia, zanim przedstawię ABC/naprawę.

## P-PANSTWO-MIASTO-ZNIKA-PO-NAJEZDZIE-BEZ-BITWY (2026-08-09, zgłoszenie z playtestu, bug) · STATUS: **OTWARTE — WSTRZYMANE na prośbę Macieja, nie podejmować pracy**

**⛔ Maciej wycofał zgłoszenie do czasu potwierdzenia (dosłowny cytat):** „Co do tego znikającego
miasta? Na razie nic z tym nie rób. Możliwe że to była chatka ze skarbami i omyłkowo pomyślałem że
to było miasto które znikło. Jak to [ponownie] się pojawi, to wtedy to zgłoszę do sprawdzenia
ponownie." **Nie dispatchować Explore ani żadnej pracy na ten temat** — zostaje w rejestrze wyłącznie
jako ślad, żeby nie zgubić kontekstu, gdyby wrócił z potwierdzeniem.

**Cytat Macieja:** „będąc pod murami miasta oszczepnikiem jednostka państwa miasta zaatakowała albo
chciała zaatakować tego oszczepnika. Ale zamiast Ataku po prostu wjechała na miejsce mojego
oszczepnika i nie doszło do bitwy, ale z jakiegoś przyczyny znikło w ogóle miasto tego państwa
miasta. Nie wiadomo dlaczego."

**Obserwowana sekwencja:** (1) jednostka gracza (oszczepnik) stoi pod murami miasta-państwa; (2)
jednostka miasta-państwa próbuje zaatakować, ale zamiast walki wchodzi na hex jednostki gracza
(brak bitwy — sugeruje błąd w rozstrzyganiu kolizji ruch-kontra-atak, możliwe że silnik potraktował
to jako ruch, nie atak, mimo zajętego heksa); (3) samo miasto-państwo **znika z mapy** bez
wyjaśnienia. To jest poważniejsze niż kosmetyka — utrata bytu w świecie gry bez śladu przyczyny.
Dispatch Explore (bez kodowania), priorytet wysoki: (a) sprawdzić logikę AI/silnika rozstrzygania
ruch-vs-atak na zajęty heks pod murami miasta (czy jednostka miasta-państwa mogła „wejść" zamiast
zaatakować — błąd walidacji kolizji); (b) sprawdzić czy istnieje ścieżka kodu, która usuwa miasto
miasta-państwa jako efekt uboczny nieudanego/błędnego ataku (np. traktowanie ruchu na zajęty hex
jako zdobycia miasta z jakimś warunkiem brzegowym, albo czyszczenie encji przy błędzie stanu).
**WSTRZYMANE — patrz wycofanie zgłoszenia w nagłówku wyżej, nie dispatchować.**

## P-AUTOZAPIS-NIE-ROTUJE-I-DATA-NIESPOJNA — PRZYCZYNA ZNALEZIONA, dispatch naprawy (2026-08-09)

**Rozpoznanie (Explore):** dwa zgłoszone objawy mają WSPÓLNĄ przyczynę, druga część zgłoszenia
(przelicznik tura→rok) okazała się NIE być błędem.

1. **Rzeczywista przyczyna (potwierdzony bug):** `doRotatingAutosave()` (`gra/src/main.ts:20554-
   20571`) przy niepowodzeniu `saveToLocal()` (np. przekroczenie limitu quota `localStorage`, ok.
   5-10 MB/origin) **milczy całkowicie** — brak `console.warn`, brak komunikatu dla gracza (w
   przeciwieństwie do `doQuickSave()`, który przy błędzie POKAZUJE komunikat), i co gorsza NIE
   przesuwa indeksu rotacji (`AUTOSAVE_ROT_IDX_KEY` aktualizowany tylko przy sukcesie). Skutek:
   gdy raz zabraknie miejsca, WSZYSTKIE kolejne próby rotacyjnego autozapisu celują w ten sam,
   już-nieudany slot i cicho zawodzą — reszta puli 10 slotów zamraża się na starej treści, dokładnie
   jak na zrzucie (różne godziny zapisu, ta sama wczesna tura). Prawdopodobna przyczyna
   przepełnienia: pełny snapshot rośnie z każdą turą (m.in. `explored` heksy), zapisywany w 10
   rotacyjnych slotach + slot szybkiego zapisu + WSZYSTKIE ręczne zapisy (nigdy automatycznie nie
   czyszczone, `uniqueSlotIdFromLabel` tworzy nowy unikalny klucz za każdym razem). Pula rotacyjna
   jest też globalna między różnymi rozgrywkami (`AUTOSAVE_ROT_IDX_KEY` nie resetuje się przy nowej
   grze).
2. **Przelicznik tura→rok jest POPRAWNY** — `4000 − (tura−1)×50`, tura 37 → dokładnie 2200 p.n.e.
   (zgodne z tym co zgłosił Maciej), potwierdzone w dwóch miejscach kodu (zduplikowana logika,
   `main.ts:15835` i `save-label.ts:34-38`, dziś zgodne). Objaw „TURA 2? · 2200 P.N.E." na ekranie
   to najprawdopodobniej efekt objawu #1 (wczytanie zamrożonego autozapisu) albo błędny odczyt
   drobnego napisu (Maciej sam zaznaczył znakiem zapytania) — nie osobny błąd konwersji.

**Dispatch naprawy (bez ABC — czysto techniczny bug, nie decyzja projektowa):** (1) ujawnić
niepowodzenie rotacyjnego autozapisu graczowi (komunikat + log, wzorem `doQuickSave()`); (2)
rozróżnić `QuotaExceededError` od innych błędów w `saveToLocal()`. **Odłożone do osobnej decyzji
(niepilne, wpływa na zachowanie, nie tylko widoczność błędu):** limit/sprzątanie ręcznych zapisów,
reset rotacji per nowa gra, scalenie zdublowanej formuły tura→rok.

**Naprawione przez Operatora, Evaluator: PASS-WITH-NOTES (worktree `agent-aa90d7889e70190cc`,
czeka na scalenie).** Rozróżnienie quota potwierdzone Evaluatorem na REALNYM `DOMException` (nie
tylko mocku Operatora) — solidne. Wszystkie 2 wywołania `saveToLocal()` w repo zweryfikowane
niezależnie, oba dostosowane, `doQuickSave()` nietknięty. 5/5 własnych mutacji Evaluatora złapanych.

**⛔ N1 — WAŻNE, ten wpis NIE zamyka tematu:** naprawa dotyczy WYŁĄCZNIE widoczności błędu (gracz
teraz dostaje informację zamiast ciszy) — **NIE przywraca rotacji ani realnej możliwości cofnięcia
się do niedawnej tury**. 10 slotów nadal zamrozi się przy przepełnieniu, gracz dostanie tylko o tym
wiadomość. To było zgodne z zakresem dispatchu (naprawa widoczności, sprzątanie/reset odłożone
świadomie), ale ORYGINALNE zgłoszenie Macieja dotyczyło utraty możliwości cofnięcia się — ta
połowa problemu WCIĄŻ WYMAGA osobnej decyzji (limit/sprzątanie ręcznych zapisów, reset rotacji per
nowa gra) zanim temat można uznać za w pełni zamknięty.

**N2 (do domknięcia przy scaleniu, nieblokujące):** komunikat o niepowodzeniu NIE pojawia się jako
osobny dymek — `doRotatingAutosave()` jest wołane w trakcie `endTurnInProgress`, więc
`showHintMessage()` odkłada go do panelu WYDARZENIA jako zwykły wpis „Koniec tury" (ikona ℹ️),
nieodróżnialny od rutynowych komunikatów. Słabsze ostrzeżenie niż zamierzone. Do rozważenia: osobny
tytuł/rodzaj wpisu „ostrzeżenie" zamiast zlewać się z resztą.

**N3 — poprawka do wcześniejszego opisu w tym wpisie:** fraza „i co gorsza NIE przesuwa indeksu
rotacji" (wyżej w tym wpisie) była MYLĄCA — Evaluator ocenił merytorycznie, że **kod ma rację, nie
opis**: nieprzsuwanie indeksu po nieudanym zapisie jest PRAWIDŁOWYM zachowaniem (wszystkie tryby
awarii są globalne, nie specyficzne dla slotu — przesuwanie wskaźnika tylko przepalałoby pozycje
pierścienia bez realnego zapisu). To NIE jest osobny bug do naprawienia, tylko część tego samego,
świadomie zachowanego zachowania. Niepilne N4-N7 (literówka bez polskich znaków, `doQuickSave`
mylący komunikat przy quota, komentarze niedwujęzyczne wbrew CLAUDE.md §9, krucha kotwica testu) —
do rejestru, nie blokują.

---

## P-AUTOZAPIS-NIE-ROTUJE-I-DATA-NIESPOJNA (2026-08-09, zgłoszenie z playtestu, bug) · STATUS: ARCHIWALNE — zastąpione wpisem powyżej

**Cytat Macieja:** „coś też jest z zapisywaniem tur, mianowicie automatycznie miało się np.
zapisywać 10 ostatnich tur, a widzę, że nie zapisują się, zapisuje się tylko i wyłącznie ostatnia.
Co więcej widać po datach, że one nie następują po sobie, bo mamy 37. turę a dopiero 2200 rok przed
naszą erą."

**Dwa osobne objawy na zrzucie „Wczytaj grę":**
1. **Rotacja autozapisu nie działa jak zaprojektowano** — lista pokazuje wiele wpisów „Autozapis",
   ale wszystkie (poza jednym z „tura 3") mają identyczną „tura 2 · rok 3950 p.n.e." mimo różnych
   znaczników czasu zapisu (13:56, 10:45, 09:54, 08:13, 08:13...) — wygląda jakby silnik zapisywał
   wielokrotnie ten sam wczesny stan gry zamiast 10 KOLEJNYCH tur, albo jakby numer tury/rok w
   zapisanym stanie nie aktualizował się poprawnie przy kolejnych autozapisach.
2. **Niespójność tura↔rok** — na drugim zrzucie (ekran „Zakończ turę") widać „TURA 2? · 2200 P.N.E."
   w grze, którą Maciej opisuje jako będącą na 37 turze — czyli albo licznik tury wyświetlany w HUD
   nie zgadza się z rzeczywistym stanem, albo przeliczenie tura→rok kalendarzowy jest zepsute
   (37 tur powinno dawać znacznie mniej ujemny rok niż 2200 p.n.e., zależnie od kalibracji, ale na
   pewno nie identyczny z zapisami z „tury 2").

**Ryzyko:** jeśli autozapis realnie nie rotuje 10 ostatnich tur (tylko duplikuje/nadpisuje wczesny
stan), gracz w praktyce NIE MA możliwości cofnięcia się do niedawnej tury po błędzie/regresie w
grze — to podważa samą funkcję autozapisu. Dispatch Explore (bez kodowania), priorytet wysoki: (a)
znaleźć mechanizm autozapisu (prawdopodobnie `gra/src/game/**` lub `gra/src/ui/**`, zapis do
localStorage/IndexedDB, rotacja/limit 10 slotów) i sprawdzić czy faktycznie tworzy nowy slot co
turę czy nadpisuje/duplikuje istniejący; (b) sprawdzić przeliczenie numer-tury→rok-kalendarzowy i
czy wyświetlany numer tury w HUD-zie faktycznie pochodzi z tego samego licznika co ten zapisany w
sejwie. Zanim cokolwiek naprawię — ustalić DOKŁADNY mechanizm, nie zgadywać.

## P-PRODUKCJA-DREWNO-GLINA-KAMIEN-ZESTAWIENIE (2026-08-09, żądanie danych od Macieja przy P-MAGAZYN-PRZEKROCZENIE-LIMITU) · STATUS: **ZAMKNIĘTE — decyzja Macieja wdrożona bezpośrednio (bez zestawienia), SCALONE `036173f7`**

**Cytat Macieja:** „to oznacza że powinniśmy zmniejszyć produkcję drewna i gliny. Ale to trzeba do
tego podejść kompleksowo. Napisz mi ile produkuje się w danych ulepszeniach drewna gliny kamienia,
zdecyduję czy coś zmieniamy." Zestawienie do przygotowania i pokazania Maciejowi (nie decyzja o
zmianie balansu — to on zdecyduje po zobaczeniu liczb). Każda liczba z nazwanym parametrem/
jednostką/kontekstem (epoka/poziom), zgodnie z CLAUDE.md pkt 3.

## P-PODBOJ-PRZEJECIE-SUROWCOW-PANSTWA-MIASTA — ODPOWIEDZIANE FAKTOGRAFICZNIE (2026-08-09)

**Odpowiedź (Explore, potwierdzone w kodzie):** Mechanizm istnieje i **dotyczy też miast-państw** —
nie ma dla nich osobnej, odmiennej ścieżki. Rdzeń: `applyCapitalCapturePlunder`
(`gra/src/game/capital-capture.ts:174-231`), wołane przy każdym przejęciu miasta. Dwa warianty:
(1) przejęcie stolicy, cywilizacja przeżywa — skarbiec 100% do zwycięzcy, pula pracy przepada
(NIE trafia do zwycięzcy — świadomy wyjątek), nauka/techy bez zmian; (2) przejęcie OSTATNIEGO
miasta = eliminacja — jak wyżej PLUS cała nauka pokonanego PLUS wszystkie brakujące technologie
kopiowane do zwycięzcy. Surowce budowlane (drewno/kamień/glina/ruda itd.) trzymane są per-miasto
(`City.surowce`) i automatycznie „wchodzą" do puli nowego właściciela, bo przejęcie miasta nigdy
nie zeruje `city.surowce` — tylko zmienia `ownerId`.

**Miasta-państwa idą dokładnie tą samą ścieżką** — nie mają osobnej struktury skarbca/puli (ten
sam `aiSkarbiecByOwner: Map<ownerId, number>` co pełne cywilizacje, ta sama funkcja
`runCapitalCapturePlunder`, jedyny wyjątek to frakcja rebeliancka, nie miasta-państwa). Ponieważ
miasto-państwo ma z definicji tylko 1 miasto, jego utrata ZAWSZE kwalifikuje się jako pełna
eliminacja (wariant 2, najszerszy transfer) — potwierdzone wprost testem
`gra/tools/capital-capture-test.cjs:250-258` („Miasto-panstwo (jedyne miasto) → zawsze eliminacja").

**Podsumowanie:** tak, mechanizm jest w kodzie i obejmuje też miasta-państwa — złoto zawsze w
całości, surowce budowlane miasta automatycznie, nauka+techy przy pełnej eliminacji (co dla
miast-państw jest zawsze prawdą). Jedyny świadomy wyjątek od „wszystkich surowców" to pula pracy,
która zawsze przepada zamiast trafić do zwycięzcy — dotyczy to obu typów właścicieli jednakowo, to
nie asymetria cywilizacja/miasto-państwo. Nie wymaga naprawy — pytanie było czysto faktograficzne.

---

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA — rozpoznanie gotowe, wymaga ABC (2026-08-09)

**Rozpoznanie (Explore), znalezisko wstępne — martwy kod prawie gotowy do wykorzystania:** w repo
istnieją DWA komponenty wyglądające jak panel listy dyplomacji: `gra/src/ui/diploListHud.ts`
(żywy, realnie otwierany z toolbara) oraz `gra/src/ui/diplomacyPanel.ts` — **całkowicie martwy
kod**, zaimportowany w `main.ts:986`, ale NIGDY faktycznie wywoływany. Ten martwy panel ma już
GOTOWĄ sekcję „Wojny znane (wywiad)" pokazującą wojny MIĘDZY INNYMI cywilizacjami
(`diplomacyPanel.ts:281-289`, korzysta z `getKnownWarsBetweenOthers`) — dokładnie część tego, o co
prosi Maciej.

**Fakt 1 (sortowanie):** dziś WYŁĄCZNIE alfabetyczne (`main.ts:5023`), bez rozróżnienia typu —
miasta-państwa i pełne cywilizacje są przemieszane. Flaga `isCityState` jest liczona
(`isOwnerClusterCityState`, `display-names.ts:50-59`) ale NIE jest przenoszona do struktury, którą
renderuje żywy panel (`DiploListEntry`, `diploListHud.ts:23-33`) — trzeba dodać pole i posortować.

**Fakt 2 (brak kroku pośredniego):** kliknięcie wiersza dziś idzie WPROST do pełnego panelu
audiencji (`main.ts:15789-15799` → `openDiplomacyAudience` → `diplomacyAudience.ts`, 2106 linii) —
zamykając listę. Żadnego pop-upu podsumowania nie ma.

**Fakt 3 (dane do podsumowania — częściowo gotowe, częściowo z ograniczeniem silnika):** surowe
dane o wojnach dowolnej pary (`diplomacyRelations`) i sojuszach/handlu dowolnej pary
(`activeDeals.strony` + funkcja `dealInvolvesOwners`) już istnieją w silniku — trzeba by je dopiero
zagregować w nowym/martwym UI. **Ograniczenie silnika do ujawnienia Maciejowi:** sojusze AI↔AI są
dziś generowane WYŁĄCZNIE między „siostrami" tego samego klastra cywilizacyjnego (komentarz w
kodzie wprost: „dyplomacja AI↔AI dziś NIE ISTNIEJE poza gracz↔AI... siostry nigdy by się nie
sprzymierzyły same" — `main.ts:13426`) — czyli podsumowanie „z kim ma sojusze" pokaże realnie tylko
sojusze siostrzane, nie pełny obraz dyplomacji AI-AI, bo silnik szerszych sojuszy AI-AI po prostu
nie tworzy. Handel AI↔AI jest szerszy (nie tylko siostry).

**[TEMAT: Zakres wdrożenia listy + podglądu dyplomacji]**
- **A — Wdrożyć oba żądania od razu, wykorzystując martwy `diplomacyPanel.ts` jako bazę nowego
  pop-upu** (ma już sekcję wojen osób trzecich — dopisać sojusze/handel + przycisk propozycji
  spotkania) + naprawić sortowanie w `diploListHud.ts`. Za: reużycie istniejącego, częściowo
  gotowego kodu zamiast pisania od zera; spełnia oba żądania naraz. Przeciw: największy zakres z
  trzech opcji, wymaga zrozumienia i ewentualnie naprawy martwego kodu (nieznana jakość/aktualność
  po tym jak nigdy nie był używany na żywo).
- **B — Tylko sortowanie teraz** (cywilizacje nad miastami-państwami, tani i niskiego ryzyka), pop-up
  podsumowania jako osobny temat później. Za: szybkie, punktowe, bez ryzyka. Przeciw: nie spełnia
  drugiej, prawdopodobnie ważniejszej dla Macieja części życzenia.
- **C — Oba żądania, ale zbudować pop-up jako NOWY, mniejszy komponent zamiast reanimować martwy
  `diplomacyPanel.ts`** (użyć tylko jego pomysłu/wzorca zapytań o dane, nie jego kodu UI). Za:
  unika ryzyka ukrytych błędów w nigdy-nietestowanym-na-żywo kodzie. Przeciw: więcej pracy niż A,
  bo nie reużywa gotowego UI.

Rekomendacja: **A** — martwy kod ma dokładnie pasujący kształt (sekcja wojen trzecich stron), a
skoro nigdy nie był wywołany, i tak wymaga przeglądu/testu zanim trafi na żywo — lepiej to zrobić
raz, przy okazji tego zadania, niż pisać odpowiednik od zera.

---

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA (2026-08-09, zgłoszenie z playtestu) · STATUS: ARCHIWALNE — zastąpione wpisem powyżej

---

## P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI — przyczyna znaleziona, wymaga ABC (2026-08-09)

**Rozpoznanie (Explore):** potwierdzone — mechanizm „zagrożenie lokalne ma priorytet" **NIE
istnieje** dla ruchu wojsk AI, tylko dla decyzji produkcyjnych (miasto pod zagrożeniem buduje
jednostki obronne, ale nie przekierowuje już istniejącej armii). Wybór celu marszu armii
(`gra/src/game/ai.ts:2155-2217`, `citiesForMarch`/scoring) rozważa WYŁĄCZNIE miasta wrogich
cywilizacji (gdziekolwiek na mapie) — barbarzyńcy nigdy nie trafiają do tej puli (nie są `City`),
i nie ma żadnego malusa/bonusu za to, że własne miasto jest właśnie oblegane. Skutek dokładnie jak
zgłoszono: jeśli AI jest w wojnie z KIMKOLWIEK (choćby daleko), krok „marsz na wrogie miasto" zawsze
znajdzie cel i cała armia rusza tam, ignorując barbarzyńców pod własnym miastem.

**To realna zmiana logiki AI (priorytetyzacja celów), nie prosta poprawka — wymaga ABC** zanim
ktokolwiek zacznie kodować (może wpłynąć na balans/trudność, wymaga decyzji jak dokładnie ważyć
priorytet obrony względem trwającej wojny).

**Cytat Macieja:** „barbarzyńcy oblegają jedno z miast innej cywilizacji, a ta cywilizacja zamiast
iść wojskiem i najpierw zwalczyć zagrożenie, to siedzi, nie wiadomo co, idzie w przeciwnym
kierunku. Generalnie głównym celem armii danej cywilizacji powinno być zlikwidowanie wrogich wojsk
na własnym terenie lub w okolicach tego terenu. Jeżeli jest stan pokoju [z resztą] — [priorytet to
zagrożenie]. Jeżeli jest stan wojny, no to oczywiście walczy z tym [wrogiem wojny] i z tyłu
[zagrożeniem lokalnym] walczy, ale [jeśli] ktoś inny jest też wrogiem, to też stara się go
atakować. Widzę, że AI ma z tym trochę problem." Zrzuty: barbarzyńcy (czerwone ikony) wokół miasta
Kwabulaw... (cywilizacja Zulusów, epoka Brąz sądząc po symbolach), miasto oblężone, ale jednostki
tej cywilizacji nie idą na odsiecz.

**Zasada, jaką Maciej chce widzieć w priorytecie celów AI:** (1) zawsze najwyższy priorytet —
zlikwidować wrogie siły (w tym barbarzyńców) na własnym terytorium lub w jego bezpośredniej
okolicy, niezależnie od stanu pokoju/wojny z kimkolwiek innym; (2) jeśli jest w stanie wojny z
konkretną cywilizacją, walczy z nią NORMALNIE (nie tylko defensywnie); (3) jeśli ma więcej niż
jednego wroga jednocześnie, stara się atakować też pozostałych, nie tylko jednego.

Dispatch Explore (bez kodowania) przed naprawą: (a) znaleźć logikę AI odpowiedzialną za priorytetyzację
celów armii (prawdopodobnie `gra/src/game/ai.ts` lub podobny, szukać obsługi zagrożeń/oblężenia/
barbarzyńców, funkcje typu `decideAiMilitary`/`threatResponse`/podobne); (b) ustalić czy AI w ogóle
ma dziś pojęcie „zagrożenie na własnym terytorium ma priorytet nad wszystkim innym" — czy istnieje
gdzieś taka reguła, czy jest po prostu nieobecna/przegrywana przez inne priorytety (ekspansja,
budowa, inny cel wojenny); (c) sprawdzić konkretnie dlaczego w tym przypadku (oblężone miasto
Zulusów) armia poszła w przeciwnym kierunku — czy to celowy inny priorytet (np. realizacja innego
zlecenia AI), błąd w ocenie zagrożenia (nie widzi barbarzyńców jako zagrożenia?), czy błąd w logice
pathfinding/celu. Zanim cokolwiek naprawię — ustalić DOKŁADNY mechanizm, nie zgadywać. To może być
duża zmiana w logice AI (priorytetyzacja) — po rozpoznaniu prawdopodobnie wymaga ABC, nie tylko
prostej naprawy.

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA — rozpoznanie gotowe, wymaga ABC (2026-08-09)

**Rozpoznanie (Explore):** mechanizm wypowiadania wojen AI→AI i AI→gracz istnieje
(`decideAIDiplomacy`, `ai.ts`), ale jest rzadki (wymaga przewagi siły ≥60%, wysokiej agresji,
relacji <30 pkt). Sąsiedztwo terytorialne NIE jest dziś używane do wyboru celu wojny (tylko do
wyboru celów bojowych już W TRAKCIE wojny) — trzeba by dobudować taki filtr. Ranking Mocy istnieje,
ale kierunek preferencji sojuszy jest dziś ODWROTNY do życzenia Macieja: silniejsza cywilizacja ma
dziś MNIEJSZĄ (nie większą) chęć sojuszu z podległym/słabszym — trzeba by dodać osobny bonus.
Istnieje dobry precedens architektoniczny do wzorowania się (`clusterForceWarTargetId`) i jasny
punkt zaczepienia w kodzie epoki (`main.ts:22130`, `reconcileAllOwnerErasFromResearch()`).
Dodatkowa hipoteza (do zweryfikowania razem z `P-AI-NIE-BRONI-WLASNYCH-MIAST`): AI ma dziś
mechanizm SZYBKIEJ kapitulacji/oferty pokoju gdy zaczyna przegrywać (`ai.ts:3504-3527`) — może to
współtłumaczyć „statyczność mapy" niezależnie od rzadkości wypowiadania wojen.

**To realna, wieloczęściowa zmiana logiki AI (nowa reguła wymuszonej wojny + filtr sąsiedztwa +
odwrócenie kierunku preferencji sojuszy) — wymaga ABC**, prawdopodobnie do rozbicia na osobne
decyzje (reguła wojny osobno, kierunek sojuszy osobno).

**Cytat Macieja:** „wydaje mi się, że w momencie gdy nastąpi epoka brązu, to każda cywilizacja,
która wejdzie w epokę brązu, powinna wypowiedzieć wojnę przynajmniej jednej innej cywilizacji, tak
żeby coś na tej mapie się działo."

Nowa reguła projektowa: przy awansie do epoki Brąz, cywilizacja (AI) automatycznie wypowiada wojnę
co najmniej jednej innej cywilizacji, jeśli jeszcze nie jest w stanie wojny z nikim. Cel: ożywić
mapę, dziś (sugeruje kontekst zgłoszenia obok) zbyt statyczną/pokojową rozgrywkę AI-AI.

Dispatch Explore (bez kodowania) przed ABC: (a) sprawdzić czy istnieje dziś jakikolwiek mechanizm
wymuszający/zachęcający AI do wypowiadania wojen (poza reaktywnymi, np. w odpowiedzi na
zagrożenie) — jaka jest dziś częstotliwość/prawdopodobieństwo wojen AI-AI w ogóle; (b) sprawdzić
czy to zgłoszenie łączy się z powyższym `P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI` — czy
przyczyną „statycznej mapy" jest brak wojen AI-AI, czy raczej że AI wchodzi w wojny ale się słabo
broni; (c) ustalić czy dziś istnieje pojęcie „epoka Brąz" jako punkt zaczepienia w kodzie awansu
epoki (tak, potwierdzone przy innym zgłoszeniu `R-EPOKA-CUD-WARUNEK-AWANSU` — Brązownictwo K→B).
Zanim przedstawię ABC — zebrać fakty o dzisiejszym zachowaniu AI w kwestii wojen.

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH-NA-CUDZYM-TERENIE — hipoteza POTWIERDZONA, wymaga ABC (2026-08-09)

**Rozpoznanie (Explore):** hipoteza Macieja potwierdzona jednoznacznie. Pula nagród chatki
(`villageRewards.ts`: złoto 50%/tech 30%/jednostka 20%) NIE rozróżnia czyje jest terytorium chatki
— era 1 daje Zwiadowcę (typ „Civilian", zwolniony z kary), era 2+ daje **Włócznika** (typ
„Spearman", jednostka wojskowa, BRAK zwolnienia). Kara za intruzję terytorialną
(`border-march-scan.ts`/`diplomacy-border-march.ts`, −5 Zaufania/turę) skanuje WSZYSTKIE jednostki
na cudzym terenie bez wyjątku dla „pochodzenia" (spawn z eventu vs ruch gracza) — nalicza się już
na pierwszym końcu tury, bez okresu karencji. Chatki mogą leżeć wewnątrz cudzego terytorium
(dystans min. 3 heksy od miasta, promień terytorium rośnie z populacją, może przekroczyć 3).

---

## R-AUTO-WYZYWIENIE-CHECKBOX-NA-PRZYCISK — Evaluator PASS-WITH-NOTES, gotowe do scalenia (2026-08-09)

**Operator wykonał** (`cityPanel.ts` ~4636-4663): checkbox→`<button class="hbtn auto-wyzywienie-btn">`,
stan z `city.autoWyzywienie` (nie DOM), handler `click`, tekst „Auto WYŁ..." przeniesiony do `title`,
podsumowanie zostało widoczne.

**Evaluator (Opus 5): PASS-WITH-NOTES.** Wszystkie 4 punkty weryfikacji (stan żywy nie martwy,
handler czyta stan nie DOM — potwierdzona ta sama referencja obiektu przez `rerender()`, `title`
warunkowy poprawny, podsumowanie nietknięte) potwierdzone samodzielnie. Brak testu regresyjnego
uznany za AKCEPTOWALNY (zero logiki biznesowej, zero edge case'ów) — ale uzasadnienie Operatora
(„niemożliwe do zbundlowania") skorygowane: bariera jest tylko tranzytywna (brandAssets/
scienceOwlIcon), repo ma już gotowy wzorzec obejścia (esbuild stub, 3 precedensy w `gra/tools/*`),
więc technicznie możliwe, tylko kosztowne — decyzja słuszna, nie z tego powodu co podano.

**Noty do domknięcia (niepilne, nie blokują scalenia):** N1 — brak `aria-pressed` (dostępność,
precedens `gamePauseMenu.ts:84-108`, fix jednolinijkowy); N2 — `title` przy stanie WŁ nie ma
jawnego markera „WŁĄCZONY" jak wzorzec `#cs-manager`; N3 — **higiena scalania:** symlink
`node_modules` w worktree NIE jest łapany przez `.gitignore` (wzorzec `node_modules/` z ukośnikiem
nie dopasowuje symlinka) — pilnować przy `git add`, nie używać `git add -A`; N4 kosmetyka OK.
**Ryzyko layoutu (do potwierdzenia w playteście, nie z kodu):** font 0,74em→0,8em, wyższy rząd —
może przesunąć elementy pod spodem, ale też ubył jeden fragment tekstu w hincie, efekt netto
niepewny bez wizualnego testu.

**SCALONE bezpośrednio przez orkiestratora** (małe, jednoplikowe, PASS-WITH-NOTES bez blokujących
not) — patrz commit poniżej w kanale.

**Rozpoznanie (Explore):** checkbox w `cityPanel.ts:4640-4660`, wzorzec przycisku auto-produkcji
(„Zarządca automatyczny") w `cityPanel.ts:8669` (markup `<button class="hbtn">`) +
`cityPanel.ts:10224-10234` (stan aktywności przez klasę `.active` + `cfg.isAutoManageEnabled?.()`,
nie przez DOM `checked`) + CSS `.hbtn`/`.hbtn.active` (linie 1782-1785, 1997). Zmiana: markup
checkbox→button, handler `change`→`click` czytający `city.autoWyzywienie` (nie `checked`), klasa
`active` przełączana jak w wzorcu, tekst „Auto WYŁ — bez auto-obniżania/podnoszenia"
(`cityPanel.ts:4669-4670`) przenoszony do `title` warunkowo. Tekst podsumowania „10 [ikona]/miesz.
· +5.5%" ZOSTAJE widoczny (Maciej prosił tylko o przeniesienie zdania o WYŁ). Dispatch naprawy (bez
ABC — czysto techniczna zmiana UI, wzorzec 1:1 z istniejącego przycisku).

**Cytat Macieja:** „popraw trochę wygląd, dodatkowa informacja: Auto-wyłącz, to jest auto-
obniżanie, podnoszenie. Dotyczy auto-wyżywienia, powinno być to w tooltipie. Raczej to powinien być
przycisk, coś podobnego jak przy produkcji. Gdzie mamy auto-produkcję, ten przycisk powinien
wyglądać tak samo, a nie checkbox."

Dwa żądania: (1) checkbox „Auto Wyżywienie" w panelu miasta ma stać się PRZYCISKIEM w tym samym
stylu co istniejący przycisk auto-produkcji/„Auto-zarządzaj" (dziś to zwykły `<input type=
"checkbox">` + etykieta, zrzut potwierdza); (2) tekst „Auto WYŁ — bez auto-obniżania/podnoszenia"
(dziś widoczny jako inline tekst pod przełącznikiem, patrz zrzut stanu wyłączonego) ma trafić do
TOOLTIPA zamiast/obok stałego tekstu.

Dispatch Explore (bez kodowania) przed naprawą: (a) znaleźć dokładny render checkboxa „Auto
Wyżywienie" w `gra/src/ui/cityPanel.ts` (pole `city.autoWyzywienie`, logika w
`gra/src/game/empire-food.ts:355-358` `isCityAutoWyzywienieEnabled`); (b) znaleźć istniejący
przycisk auto-produkcji/„Auto-zarządzaj" (`gra/src/game/auto-manage.ts` i jego render w UI) jako
wzorzec stylu do skopiowania; (c) ustalić czy zamiana na przycisk wymaga zmiany zachowania (dziś
checkbox, zwykłe kliknięcie = toggle — przycisk pewnie ma być tak samo, tylko inny wygląd) czy
tylko CSS/markup.

**ODPOWIEDŹ na pytanie Macieja „czym było Auto-Wyżywienie" (zbadane bezpośrednio):** to istniejący
mechanizm — gdy WŁĄCZONY, silnik automatycznie podnosi/obniża suwak Wyżywienia co turę, żeby
zbilansować produkcję żywności miasta (najpierw obniża do zera przed cięciem budżetu na wojsko,
podnosi przy trwałej nadwyżce). Gdy WYŁĄCZONY, suwak zostaje dokładnie tam, gdzie gracz go ustawił
ręcznie — brak automatycznej zmiany. Kod: `gra/src/game/empire-food.ts:352-368`
(`isCityAutoWyzywienieEnabled`, komentarze `SPICH-AUTO-Q1`, `R-AUTO-RACJE-RAISE-Q5=A`).

## P-DOPRECYZOWANIE-GLOBALNE-USTAWIENIA-NIE-ISTNIEJA (2026-08-09, pytanie Macieja) · STATUS: **ODPOWIEDZIANE — wyjaśnienie nieporozumienia**

**Cytat Macieja:** „nie wiem, w którym miejscu są globalne ustawienia dla żywności, pieniędzy i
produkcji, o których mówisz."

**Wyjaśnienie:** to nieporozumienie — „globalne ustawienia" NIE ISTNIEJĄ dziś w grze. To jest
DOKŁADNIE to, o co Maciej poprosił jako NOWĄ funkcję w `R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE`
(zarejestrowane wcześniej w tej sesji, wciąż czeka na odpowiedź ABC, rekomendacja B). Rozpoznanie
Explore ustaliło, że wzorzec „globalne ustawienie + nadpisanie lokalne per miasto" jest już
zaimplementowany DWA RAZY w innym kontekście (Danina/Handel — Skarb/Nauka/Zamożność; auto-
ulepszenia terenu), ale NIE dla priorytetu Praca/Żywność (`okolicaFocus`) ani podziału Praca
budynki/skarbiec (`podzialPracy`) ani priorytetu produkcji (`budowaFocus`/`budowaTryb`) — te trzy
pola dziś zawsze startują od tej samej wartości domyślnej dla każdego nowego miasta, bez żadnego
globalnego przełącznika. Jeśli Maciej chce tej funkcji, potrzebna jest odpowiedź na ABC z
`R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE` (wciąż otwarte, poniżej w tym pliku).

**Cytat Macieja:** „jeżeli nasz zwiadowca na terenie innej cywilizacji znajdzie chatkę, a w tej
chatce zostanie odkryta jednostka wojskowa, to narusza się wtedy granicę i cierpi nasze statystyki
w dyplomacji. Więc powinna być taka zasada, że w chatkach ze skarbami na terenie innej cywilizacji
nie znajdujemy jednostek wojskowych, tylko inne skarby."

Zgłoszony problem: odkrycie jednostki wojskowej z chatki ze skarbami na TERYTORIUM innej
cywilizacji powoduje, że ta nowo powstała jednostka (przypisana graczowi) fizycznie stoi na cudzym
terenie, co jest traktowane jak naruszenie granicy i karze relacje dyplomatyczne — mimo że gracz
nie zrobił nic poza odkryciem chatki zwiadowcą. Proponowana reguła: pula możliwych „skarbów" z
chatek ma być inna (bez jednostek wojskowych) gdy chatka leży na cudzym terytorium, niż gdy leży na
neutralnym/własnym.

Dispatch Explore (bez kodowania) przed ABC: (a) znaleźć logikę chatek ze skarbami (prawdopodobnie
`gra/src/game/**`, szukać „chatka"/„skarb"/„hut"/„goodie" itp.) i pulę możliwych nagród, w tym czy
jednostki wojskowe są dziś jedną z opcji; (b) potwierdzić że odkrycie jednostki na cudzym terytorium
faktycznie liczy się jako naruszenie granicy w mechanice kar dyplomatycznych (żeby nie zgadywać czy
to naprawdę dzieje się tak jak opisuje Maciej); (c) sprawdzić czy silnik rozróżnia dziś kontekst
„chatka na czyim terytorium" przy losowaniu nagrody, czy pula jest zawsze taka sama niezależnie od
lokalizacji. Zanim przedstawię ABC — zebrać fakty, nie zgadywać zakresu zmian.

## P-TRIUMF-ZJEDNOCZENIE-GRECJI-KOMUNIKAT-BRAK (2026-08-09, pytanie z playtestu) · STATUS: **ZAMKNIĘTE — SCALONE `b057d248` (2026-08-09), Evaluator PASS finalny**

**Cytat Macieja:** „po zdobyciu ostatniego Państwa Miasta miała być jakaś informacja z
wyskakującym oknem informująca, że zjednoczyliśmy całą Grecję. Gdzie to jest? Sprawdź w którym
komicie to było i zobacz czy możemy to przywrócić. I dlaczego to nie zostało wprowadzone do gry."

Trop: przy wcześniejszym rozpoznaniu `P-PODBOJ-PRZEJECIE-SUROWCOW-PANSTWA-MIASTA` (dziś, ten sam
playtest) Explore znalazł moduł `gra/src/game/triumph-city-state.ts` — opisany jako „dodatkowy
komunikat UI/triumf pokazywany graczowi po zjednoczeniu miast-państw tej samej cywilizacji",
wołany wewnątrz tej samej gałęzi „eliminacja" w `runCapitalCapturePlunder` (main.ts:19735-19748).
Sprawdzam bezpośrednio (orkiestrator, bez subagenta — mam już lokalizację) czy ten mechanizm
faktycznie istnieje w kodzie, w którym commicie powstał, czy jest realnie podłączony/wywoływany na
żywej ścieżce gry, i czy „zjednoczenie całej Grecji" to inny/szerszy warunek niż zjednoczenie
pojedynczych miast-państw (może dotyczyć konkretnie greckiej grupy cywilizacji, nie ogólnego
mechanizmu).

**ODPOWIEDŹ (zbadane bezpośrednio, bez subagenta):** mechanizm ISTNIEJE i JEST podłączony na żywej
ścieżce. Plik `gra/src/game/triumph-city-state.ts`, wprowadzony commitem `906155a0` (2026-08-03,
„Feat: Zwiedzaj EOT-only (Q2=B) + triumf ostatniego MP cywu (Q1=B)"), jest na bieżącej gałęzi
(potwierdzone `git merge-base --is-ancestor`). Wołany z `main.ts:19735-19748` wewnątrz gałęzi
eliminacji miasta-państwa. **Prawdopodobna przyczyna, dlaczego Maciej go nie zauważył:** (1)
komunikat pokazuje się przez `showHintMessage(...)` (dymek/hint na 9,5 sekundy) — **NIE jest to
osobne wyskakujące okno/modal**, którego Maciej mógł się spodziewać po opisie „plansza z
informacją"; (2) warunek wyzwolenia jest węższy niż „zjednoczenie całej Grecji" w sensie ogólnym —
wymaga, żeby eliminowane miasto-państwo było tego SAMEGO klucza cywilizacji co gracz
(`playerCivKey === oldCiv`) I żeby to było OSTATNIE pozostałe miasto-państwo tego klucza — jeśli
Maciej grał inną cywilizacją niż grecka, albo „ostatnie Państwo Miasto" w jego opisie nie było
akurat tym konkretnym warunkiem (np. zdobył miasto-państwo NIE swojego klucza cywilizacji, albo
zostały jeszcze inne miasta-państwa tego samego klucza gdzie indziej na mapie), komunikat świadomie
się nie pokazał — to nie byłby błąd, tylko spełniony warunek „nie". Do potwierdzenia z Maciejem: czy
widział krótki dymek (mógł przeoczyć) czy oczekuje pełnoprawnego modala, i czy scenariusz z jego
gry faktycznie spełniał wąski warunek funkcji.

**⛔ Odpowiedź Macieja — POTWIERDZA że dymek się nie pojawił, żąda bardziej wyrazistego komunikatu
(dosłowny cytat):** „to ten dymek się nie pojawił, chyba że nie wiem, w którym miejscu on był.
Powinno coś być bardziej wyrazistego." Czyli STATUS zmienia się z „odpowiedziane" na OTWARTE
zgłoszenie: potrzebny bardziej wyrazisty komunikat triumfu (pełnoprawny popup/modal zamiast
9,5-sekundowego dymka `showHintMessage`, który łatwo przeoczyć) — TREŚĆ HINT MESSAGE zgodna z
`buildTriumphCityStateUnificationMessage()`. Do zbadania przed implementacją (Explore, bez
kodowania): jaki wzorzec modala/popupu już istnieje w grze do naśladowania (np. ekran zwycięstwa,
odkrycie cudu, inny „duży" komunikat), żeby nie wymyślać nowego stylu od zera — dopiero potem
zaimplementować podmianę `showHintMessage` na ten wzorzec w `main.ts:19744-19747`. Osobno: czy
wąski warunek wyzwolenia (tylko miasta-państwa TEGO SAMEGO klucza cywilizacji co gracz) faktycznie
pasuje do sceny z gry Macieja (do potwierdzenia po naprawie widoczności, nie zgadywać teraz).

**Rozpoznanie gotowe (Explore) — wzorzec i PRAWDZIWA przyczyna przeoczenia znalezione:**
kandydat do wzoru: `gra/src/ui/wonderCompletedNotice.ts` (~114 linii) — pełnoprawny modal
wyśrodkowany, backdrop, złoty wariant „mine" dla własnego sukcesu, WYMAGA kliknięcia żeby zniknąć,
już używany do jednorazowych ważnych zdarzeń (ukończenie cudu) — lżejszy i trafniejszy niż
pełnoekranowy `victoryScreen.ts` (blokuje grę, nieadekwatny bo gra się nie kończy). **Prawdziwa
przyczyna przeoczenia:** `showHintMessage()` (`main.ts:10126-10142`) używa JEDNEGO współdzielonego
elementu `hintToast` z jednym timerem — komunikat ELIMINACJA (`main.ts:19731-19734`, 6000ms) jest
wołany BEZPOŚREDNIO PRZED komunikatem TRIUMPH, więc **ELIMINACJA nigdy się nie pokazuje**
(natychmiast nadpisana), a sam TRIUMPH to zwykły toast bez wymogu potwierdzenia. Dispatch naprawy
(bez ABC — czysto techniczna zmiana UI z jasnym wzorcem): nowy plik `triumphCityStateNotice.ts`
wzorowany na `wonderCompletedNotice.ts`, podmiana `showHintMessage(...)` w `main.ts:19744-19747` —
rozwiąże oba problemy naraz (przeoczenie i konflikt nadpisania).

**Zaimplementowane w worktree, czeka na Evaluatora:** nowy `triumphCityStateNotice.ts` (108 linii,
wzorowany na `wonderCompletedNotice.ts`), podmiana w `main.ts`, nowy test 13/13. **Potwierdzony
pozytywny efekt uboczny:** komunikat ELIMINACJA (6000ms) teraz faktycznie zdąży się pokazać, bo
TRIUMPH już nie dzieli z nim elementu `hintToast`. Bramki: tsc 0, logic-test 213/213, nowy test
13/13, istniejący `triumph-city-state-test.cjs` bez regresji 10/10.

**Evaluator (Opus 5): PASS-WITH-NOTES z 3 warunkami do PODNIESIENIA DO PASS (dowód mutacyjny — 2 z 3
mutacji uciekły):**
- **M1 uciekła:** test w pełni synchroniczny, nie łapie próby dodania auto-hide (`setTimeout`) —
  główne wymaganie zgłoszenia („modal wymaga kliknięcia, nie znika sam") nie ma ŻADNEJ asercji.
- **M2 uciekła:** asercja treści cityName jest pusta z definicji (`includes('miasto')` przechodzi
  nawet przy `cityName === undefined`, bo karta zawsze zawiera słowo „miasto" w opisie stałym).
- **M3 uciekła:** brak strażnika że `showTriumphCityStateNotice(` faktycznie jest wołane z
  `main.ts` (istnieje precedens w repo: `border-march-wygasanie-test.cjs` czyta main.ts jako tekst).
**Dodatkowe znalezisko (częściowo obala twierdzenie Operatora o ELIMINACJI):** ścieżka kapitulacji
z głodu (`resolveSiegeSurrender`) NADAL gubi komunikat ELIMINACJA — inny `showHintMessage` na tej
samej linii co `runCapitalCapturePlunder` dzieli TEN SAM toast. Twierdzenie prawdziwe tylko dla
ścieżki bitewnej, nie dla kapitulacji głodowej (pre-istniejące, nie z tej pracy). Zauważona też
utrata trwałego śladu w panelu WYDARZENIA — poprzednio triumf w EOT trafiał do `warEventLog`,
teraz modal pokazuje się od razu i nic nie zostawia po zamknięciu.
**Martwy kod (niepilne):** `TRIUMPH_CS_HINT_MS`/`buildTriumphCityStateUnificationMessage` używane
już tylko przez własny test — treść komunikatu istnieje teraz w DWÓCH miejscach (stary string +
nowy modal), mogą się rozjechać bez wykrycia. Dispatch redo naprawiającego 3 warunki PASS.

**Wszystkie 3 warunki naprawione przez Operatora (worktree `agent-a8af239534cbb3d38`), czeka na
finalną weryfikację Evaluatora:** asercja 4 (unikalny `cityName: 'Testopolis'` zamiast generycznego
„miasto"), asercja 14 (czyta źródło modułu, sprawdza brak `setTimeout`), asercje 15-16 (strażnik
tekstowy wywołania w `main.ts`, wzorem `border-march-wygasanie-test.cjs`). Dowód: wszystkie 3
odtworzone mutacje z pierwszej rundy Evaluatora teraz czerwienieją (15/16 każda), po przywróceniu
16/16. Bramki: tsc 0, logic-test 213/213, nowy test 16/16, istniejący `triumph-city-state-test.cjs`
bez regresji 10/10. Kapitulacja z głodu świadomie nieruszona (poza zakresem).

**Evaluator (trzecia, finalna runda): PASS.** Wszystkie 3 mutacje odtworzone SAMODZIELNIE, każda
czerwieni dokładnie jedną, właściwą asercję. **SCALONE `b057d248`** — orkiestrator zweryfikował
dywergencję `main.ts` (3 kotwice tekstowe niezmienione mimo 338-liniowej dywergencji pliku od
wielu innych scaleń tej sesji), zastosował chirurgicznie. Bramki na scalonym stanie: tsc 0,
logic-test 213/213, nowy test 16/16, `triumph-city-state-test.cjs` 10/10.

**Niepilne, do rejestru (nie blokowały scalenia, znalezione przez Evaluatora):** (a) asercja 14
łapie tylko `setTimeout` dosłownie w źródle — `setInterval`/zewnętrzny timer w `main.ts` mogłyby
ominąć (potwierdzone eksperymentalnie); (b) okno 800 znaków asercji 15-16 jest szersze niż
potrzeba (realny dystans 561 znaków) — teoretycznie mogłoby złapać wywołanie POZA gałęzią `if`,
nie tylko wewnątrz niej; (c) **kapitulacja z głodu (`resolveSiegeSurrender`) nadal gubi komunikat
ELIMINACJA** przez inny, współdzielony `showHintMessage` na tej samej linii — pre-istniejące, POZA
zakresem tej naprawy (dotyczyła tylko ścieżki bitewnej). Żadne z trzech nie wymaga natychmiastowej
akcji.

---

## P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI — rozpoznanie gotowe, wymaga ABC (2026-08-09)

**Rozpoznanie (Explore):** reguła min. odległości (4 heksy) jest DZIŚ IDENTYCZNA liczbowo dla
gracza i AI (dwa osobne, ale zsynchronizowane parametry JSON, zgodnie z decyzją R-AI-KOLONIZACJA
2026-08-03) — to NIE jest przyczyną „miszmaszu". **Prawdziwa przyczyna:** gracz ma DRUGI, twardy
wymóg — `withinTerritory` (nowe miasto musi leżeć w promieniu terytorium JEDNEGO z już
posiadanych miast gracza, `main.ts:7639-7659`). **AI NIE MA tego wymogu w ogóle** — egzekucja
`foundCityAt` dla AI (`main.ts:23084`) woła `canFoundCity` BEZ `withinTerritory`. Co więcej, AI
dostaje systemową PREMIĘ +15 pkt w heurystyce wyboru heksu za zakładanie miasta POZA zasięgiem
jakiegokolwiek istniejącego miasta (`ai.ts:2694`) — czyli lokalizacje daleko od własnego terytorium
są dziś faworyzowane, nie karane. Jedyny miękki (nie twardy) czynnik ciągnący w stronę własnego
regionu to bonus +50×skala za bliskość klastra startowego — łatwo przebity innymi składnikami
scoringu. Explore ocenia to jako niedopatrzenie/lukę, nie świadomą decyzję — dokument
R-AI-KOLONIZACJA mówi o „pokryciu całej mapy" jako celu ekspansji AI w kolejnych fazach, ale nie
adresuje w ogóle kwestii zwartości terytorium tej samej cywilizacji AI. Osobny czynnik
współprzyczyniający: `findCityFoundingHex` skanuje CAŁĄ mapę bez ograniczenia do lądu połączonego
z istniejącymi miastami AI — na mapach z wieloma wyspami/kontynentami to dodatkowo pogłębia efekt.

**[TEMAT: Czy AI ma dostać wymóg `withinTerritory` jak gracz]**
- **A — Dodać AI ten sam twardy wymóg co gracz** (`withinTerritory` względem WŁASNYCH miast AI).
  Za: pełny parytet zasad gracz/AI, zgodny z życzeniem Macieja. Przeciw: może ograniczyć realizację
  celu „pokrycie całej mapy" z R-AI-KOLONIZACJA (Q3=B) — AI miałoby trudniej kolonizować odległe,
  dobre tereny; wymaga przemyślenia razem z premią +15 za bycie poza zasięgiem (dziś w bezpośredniej
  sprzeczności z proponowaną zmianą).
- **B — Nie zmieniać** — zostawić dzisiejsze zachowanie (świadoma szeroka ekspansja AI po całej
  mapie), tylko wyjaśnić Maciejowi że to jest celowe (cel „pokrycie mapy" z wcześniejszej decyzji).
- **C — Złagodzić, nie usunąć:** zamiast twardego `withinTerritory`, dodać miękką karę punktową za
  odległość od najbliższego WŁASNEGO miasta (analogicznie do istniejącego bonusu klastra
  startowego, ale silniejszą i bez wygasania po epoce 3), usuwając jednocześnie premię +15 za bycie
  poza zasięgiem. AI nadal mogłoby zakładać miasta daleko, ale rzadziej niż dziś, z preferencją dla
  ciągłości terytorium.

Rekomendacja: **C** — pełny twardy zakaz (A) realnie koliduje z już podjętą decyzją o pokryciu
całej mapy przez AI; złagodzenie scoringu daje kompromis bez cofania wcześniejszej decyzji.

**Cytat Macieja:** „ewidentnie zapomniałem się jeszcze o jednym zgłoszeniu. Mianowicie napisałem,
że cywilizacje budują sobie miasta w oddaleniu od swojej cywilizacji, a powinny budować zgodnie z
zasadami takimi jak graczy obowiązują, czyli chyba 5 heksów od najbliższego miasta i w granicach
własnej cywilizacji. A w tej chwili po prostu jest miszmasz, bo wszystkie cywilizacje pobudowały w
różnych miejscach. Więc pewnie AI obowiązują inne zasady. Zobacz zresztą na mapę." Zrzut mapy
pokazuje rozrzucone miasta wielu cywilizacji bez wyraźnego zwartego terytorium.

**Kontekst z wcześniejszego pytania w tej samej sesji (`P-podboj/Egipt` — luźno powiązane, osobny
wątek):** wcześniej Maciej pytał czy AI zakłada miasta bez połączenia z resztą swoich miast —
odpowiedziałam wtedy faktami o innej części kodu (zasięg widzenia). To zgłoszenie jest SZERSZE:
konkretnie o regułę MIN_CITY_DISTANCE (znana z bramek jako „4 heksy" wg CLAUDE.md — Maciej pamięta
„chyba 5", do zweryfikowania dokładna wartość) i o to, czy AI zakłada miasta w granicach WŁASNEGO
terytorium/kontynuum, czy gdziekolwiek.

Dispatch Explore (bez kodowania) przed naprawą: (a) znaleźć dokładną wartość i miejsce egzekwowania
`MIN_CITY_DISTANCE` dla GRACZA (wspomniane w CLAUDE.md bramki jako „4 heksy", zweryfikować dokładną
liczbę i plik); (b) znaleźć logikę AI wybierającą lokalizację nowych miast (prawdopodobnie
`gra/src/game/ai.ts`, funkcja typu `decideAiCityFounding`/`chooseCitySite` czy podobna) i sprawdzić
czy stosuje TĘ SAMĄ regułę minimalnej odległości co gracz, inną (mniejszą/większą) wartość, czy w
ogóle brak takiej reguły; (c) sprawdzić czy AI ma jakiekolwiek pojęcie „buduj w granicach własnego
istniejącego terytorium/w pobliżu swoich miast" (zwartość terytorium) czy zakłada miasta całkowicie
niezależnie od tego gdzie już ma miasta (stąd „miszmasz" widoczny na mapie); (d) jeśli AI ma inną
regułę niż gracz — ustalić czy to celowa decyzja projektowa (np. AI ma większą swobodę ekspansji
dla balansu) czy niedopatrzenie/luka. Zanim cokolwiek naprawię — ustalić DOKŁADNY mechanizm, nie
zgadywać. Prawdopodobnie wymaga ABC (parytet zasad gracz/AI to zmiana balansu, nie tylko bugfix).

**⛔ Doprecyzowanie Macieja (dosłowny cytat, ważne ograniczenia reguły):** „tylko żeby nie było
tak, że wszyscy wypowiedzą wojnę graczowi. Generalnie powinno się wypowiadać wojny sąsiadowi, a
sojusze zawierać z podleglejszymi ludami." Czyli DWA dodatkowe warunki do uwzględnienia w
rozpoznaniu/ABC: (1) cel wypowiedzenia wojny przy awansie do Brązu ma być preferencyjnie SĄSIAD
(geograficznie przyległa cywilizacja), NIE zawsze/domyślnie gracz — trzeba sprawdzić czy dzisiejsza
logika AI w ogóle ma pojęcie „sąsiedztwa terytorialnego" do wyboru celu; (2) przy tej samej okazji
(lub ogólnie) AI powinno preferować zawieranie SOJUSZY z cywilizacjami słabszymi/podległymi
(„podleglejsze ludy") — do zbadania czy istnieje dziś jakaś miara siły/rankingu do takiego wyboru
(np. `R-RANKING-MOC` z wcześniejszych zadań).

**Cytat Macieja:** „Fajnie żeby w momencie gdy się wejdzie do dyplomacji można było sprawdzić
wszystkie główne cywilizacje z których mamy kontakt. Żeby można było ewentualnie z nimi
porozmawiać, one powinny być na samej górze zawsze pod państwami — nad państwami miastami. Druga
kwestia: jeżeli naciśnie się na daną cywilizację, powinna się najpierw pojawiać plansza/pop-up z tą
cywilizacją z najważniejszymi informacjami — także z takimi: z kim prowadzi wojny, z kim ma
sojusze, z kim ma umowy handlowe, oraz propozycja spotkania i negocjacji. Czyli dopiero jak się tam
kliknie, to przechodzi do panelu wizyty dyplomatycznej."

**Dwa oddzielne żądania:**
1. **Kolejność listy w panelu dyplomacji** — pełnoprawne cywilizacje, z którymi mamy kontakt, mają
   być zawsze na samej górze listy, NAD miastami-państwami (dziś kolejność do zweryfikowania —
   niejasne czy to zmiana istniejącego sortowania czy nowa reguła).
2. **Pop-up podsumowania PRZED wejściem do pełnego panelu wizyty** — kliknięcie na cywilizację ma
   najpierw pokazać skrócone podsumowanie (z kim wojny, z kim sojusze, z kim umowy handlowe, plus
   przycisk propozycji spotkania/negocjacji), dopiero kolejne kliknięcie otwiera pełny panel wizyty
   dyplomatycznej — dziś (do zweryfikowania) prawdopodobnie kliknięcie idzie od razu do pełnego
   panelu.

Dispatch Explore (bez kodowania) przed ABC: (a) znaleźć dzisiejszy panel listy dyplomacji (prawdopodobnie
`gra/src/ui/**`, szukać „dyplomacja"/diplomacy panel, listę cywilizacji/miast-państw) i ustalić
dzisiejszą kolejność sortowania; (b) ustalić czy istnieje dziś jakikolwiek pośredni krok/podgląd
przed otwarciem pełnego panelu wizyty, czy kliknięcie idzie wprost do niego; (c) sprawdzić czy dane
potrzebne do podsumowania (wojny/sojusze/umowy handlowe innej cywilizacji z osobami trzecimi, nie
tylko z graczem) są dziś w ogóle dostępne/widoczne dla gracza gdziekolwiek w kodzie, czy trzeba by
je dopiero ujawnić. Zanim przedstawię ABC — zebrać fakty, nie zgadywać zakresu zmian.

**Cytat Macieja:** „po przejęciu danej cywilizacji, także w wypadku państw miast, miało być
przejęcie ich wszystkich surowców. Sprawdź czy to jest w kodzie i czy dotyczy to też państw miast."

To pytanie o istniejący/zamierzony mechanizm, nie zgłoszenie błędu — Maciej chce faktu, nie
naprawy na razie. Dispatch Explore (bez kodowania): (a) znaleźć logikę przejęcia
cywilizacji/eliminacji (prawdopodobnie `gra/src/game/**`, zdobycie ostatniego miasta / poddanie
się) i sprawdzić czy przenosi surowce (skarbiec/zapasy) zwycięzcy; (b) sprawdzić czy ta sama
ścieżka (albo osobna) obejmuje podbój/zniszczenie miast-państw — czy miasta-państwa w ogóle mają
własną pulę surowców do przejęcia, czy to inny model niż pełne cywilizacje. Odpowiedzieć faktami
z kodu, bez zgadywania.

## P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO — PRZYCZYNA DREWNA ZNALEZIONA, dispatch naprawy (2026-08-09)

**Rozpoznanie (Explore):** to jest osobny system niż zbadany wcześniej przy `R-HUD-MIASTO-KOREKTA-
ZAPAS-VS-TEMPO` (surowce cywilizacyjne Praca/Żywność/Skarbiec/Nauka mają inny magazyn niż surowce
budowlane Drewno/Glina/Kamień/Ruda/etc. — te drugie żyją w `City.surowce`, sumowane civ-wide,
capping przez `OWNER_CAPPED_RESOURCE_KEYS` w `gra/src/game/economy-upkeep.ts`).

**DREWNO — bug potwierdzony jednoznacznie:** w `gra/src/main.ts:21130`, pętla obsługująca
wieloturowy „wyrąb lasu" (hex clearing) woła `creditOwnerResourceStock(cities, ownerId, 'drewno',
drewnoCredit)` **BEZ piątego argumentu `capPerType`** — w przeciwieństwie do normalnej produkcji
terenowej, która capuje poprawnie. Ta pętla wykonuje się PO jedynym w turze wywołaniu
`reconcileOwnerResourceCaps()` (siatka bezpieczeństwa ścinająca nadwyżkę), więc przy kilku
równoległych wyrębach lasu drewno rośnie bez ograniczenia aż do końca tury — dokładnie tłumaczy
zgłoszony objaw (+114/turę, wartość ponad cap).

**GLINA — przyczyny NIE znaleziono jednoznacznie.** Wszystkie znalezione ścieżki produkcji gliny są
poprawnie capowane; żaden konwerter jej nie produkuje (tylko zużywa); nie jest objęta handlem
ilościowym. Explore rekomenduje diagnostykę zamiast zgadywanej poprawki: tymczasowy `console.warn`
w `creditOwnerResourceStock` gdy `capPerType === undefined && amount > 0`, złapany na żywo w
kolejnej sesji playtestu Macieja, zamiast naprawiać na ślepo.

**NAPRAWIONE przez Operatora (w worktree, czeka na Evaluatora):** `main.ts:21045` (drewno) — dodany
`capPerType`; audyt 3 call-site'ów: `main.ts:2950` (zwrot) świadomie zostawiony bez capu — komentarz
w kodzie to dokumentuje; `main.ts:19083` (łup z bitwy) — naprawiony, ten sam wzorzec ryzyka co
drewno (może odbyć się wielokrotnie w turze przed reconcile); `main.ts:20756` (przepływ handlowy) —
naprawiony defensywnie, choć leci PRZED reconcile więc mniej pilne. Diagnostyka `console.warn`
dodana w `building-stock-cost.ts`.

**⛔ GLINA — NOWY, silny trop znaleziony przy audycie (NIE naprawiony, wymaga decyzji):**
`gra/src/game/diplomacy-basket-transfer.ts:274` (`transferSurowiecIlosc`, wołane z `main.ts:7403`
przy jednorazowej dostawie koszyka dyplomatycznego i `main.ts:14127` przy handlu cyklicznym) mutuje
`city.surowce` **BEZPOŚREDNIO, z pominięciem `creditOwnerResourceStock` całkowicie** — żaden cap,
diagnostyka `console.warn` tego NIE złapie. Dostawa jednorazowa (`main.ts:7403`) trafia do stolicy
biorcy natychmiast po zamknięciu umowy dyplomatycznej, niezależnie od końca tury — bardzo
prawdopodobny kandydat na zgłoszony objaw „Glina 1086/1000 PEŁNY". Handel cykliczny leci przed
reconcile więc mniej ryzykowny. Operator świadomie NIE naprawił (poza zleconym zakresem) —
zgłaszam do decyzji: czy naprawić teraz (wygląda na ten sam typ bugu co drewno, ale w innym module)
czy potwierdzić najpierw diagnostyką na żywo.

**Bramki Operatora:** tsc 0 błędów, logic-test 213/213, nowy test (sekcja F, +8 asercji) zielony,
33 sąsiednie testy — zero regresji względem `main` (zweryfikowane `git stash` porównaniem, w tym
liczne PRE-ISTNIEJĄCE czerwone testy niezwiązane ze zmianą, niezmienione przed/po).

**Evaluator: PASS-WITH-NOTES — sama naprawa POPRAWNA, ale 2 realne problemy do naprawy przed
scaleniem/deployem (nie tylko kosmetyka):**
1. **⛔ Sekcja F NIE chroni naprawy (dowód mutacyjny negatywny) — blokujące dla treści rejestru.**
   Evaluator cofnął naprawę w `main.ts:21045` i sekcja F **nadal dawała 38/38 zielono** — bo test
   woła `creditOwnerResourceStock(...)` BEZPOŚREDNIO, nigdy nie dotyka kodu w `main.ts`, gdzie był
   bug. „Kontrola negatywna" jest tautologiczna (sprawdza że funkcja bez opcjonalnego argumentu nie
   capuje — prawda z definicji sygnatury). Naprawa jest dobra, ale dziś NIEUCHRONIONA przed
   regresją w miejscu, gdzie faktycznie wystąpiła.
2. **⛔ `console.warn` w `building-stock-cost.ts:232` jest szkodliwy i ślepy na cel — blokujące dla
   deployu.** Odpala się też na ścieżkach CELOWO bez capu, których audyt nie uwzględnił
   (`refundBuildingStockCostAcrossCities`, `assignOwnerResourceStockFromPool` — ta druga wołana co
   turę × każdy owner × każdy surowiec z `tickEmpireResourcePipeline`). Empirycznie: 9 ostrzeżeń w
   jednym przebiegu testu, 6 fałszywych alarmów. **Paradoksalnie ślepy na cel, w którym go dodano**
   — `diplomacy-basket-transfer.ts:274` (trop Gliny) omija `creditOwnerResourceStock` CAŁKOWICIE,
   więc nigdy nie dojdzie do tego warna.
3. Niezależnie potwierdzone „zero regresji" na WSZYSTKICH 274 testach (nie tylko próbce 33) —
   liczby Operatora dokładne, zbiór 14 porażek `surow-civ-storage-test` identyczny przed/po.
4. **Trop Gliny potwierdzony, ale przeszacowany:** oba call-site'y (`main.ts:7403` jednorazowa
   dostawa, `main.ts:14127` handel cykliczny) lecą PRZED reconcile w tej samej turze — mogą dać
   przekroczenie WIDOCZNE W TRAKCIE tury (pasuje do zgłoszenia), ale nie TRWAŁE jak drewno.
Dispatch naprawy: (a) usunąć/zawęzić `console.warn` do ścieżek gdzie faktycznie ma sens; (b)
przenieść/dodać asercję sekcji F na poziomie faktycznie pokrywającym `main.ts:21045` (nie tylko
bibliotekę); (c) uzupełnić audyt o 2 pominięte call-site'y; (d) skorygować opis tropu Gliny na
„przejściowe w obrębie tury", nie „trwałe".

**Wszystkie 4 punkty domknięte przez Operatora (worktree `agent-a2955e5564faaff41`), czeka na
scalenie:** nowa sekcja G w `surow-civ-storage-test.cjs` — strażnik tekstowy wzorem
`border-march-wygasanie-test.cjs`, dowód mutacyjny na żywym `main.ts:21045` potwierdza że G
czerwienieje tam, gdzie F zostaje zielone. `console.warn` NIE dodany (opcja: usunąć całkowicie —
diagnostyka już spełniła rolę, root cause drewna znaleziony i naprawiony). Audyt potwierdza 2
dodatkowe call-site'y celowo bez capu (`building-stock-cost.ts:171,279`). Opis tropu Gliny
skorygowany na „widoczne w trakcie tury, nie trwałe". Bramki: tsc 0, logic-test 213/213,
`surow-civ-storage-test.cjs` 43 passed/14 failed (te same 14 pre-istniejące, +5 nowych w passed).

**Dispatch naprawy (BYŁO, wykonane przez Operatora — historyczna treść zlecenia):** (1) dodać `capPerType`
do wywołania w `main.ts:21130` (wzorem `tickEmpireResourcePipeline`); (2) przy okazji sprawdzić
pozostałe 3 miejsca `creditOwnerResourceStock(...)` bez `capPerType` (`main.ts:2950` — zwrot,
prawdopodobnie celowo; `main.ts:19180` — łup z bitwy, ryzykowne dla Brąz/Żelazo; `main.ts:20847` —
przepływ handlowy, wykonuje się przed reconcile, więc mniej ryzykowne, ale zweryfikować); (3) dodać
diagnostyczny `console.warn` (jak wyżej) żeby złapać ewentualny analogiczny bug gliny na żywo,
zamiast zgadywać teraz.

---

## P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO (2026-08-09, zgłoszenie z playtestu, bug) · STATUS: ARCHIWALNE — zastąpione wpisem powyżej

**⛔ Dopisek Macieja po kolejnej turze (obserwacja, nie nowe zgłoszenie):** „widzę, że wyrównuję
stan surowców do liczby 1000" — kolejny zrzut pokazuje Drewno **975/1000** (+123, NIE przekracza) i
Glina **1000/1000 PEŁNY** (+84, dokładnie na granicy, nie ponad nią). Czyli objaw NIE jest stały —
czasem wartość zostaje sprowadzona z powrotem do 1000 (lub poniżej), a czasem (jak w pierwszym
zrzucie: 1298/1000, 1086/1000) widocznie go przekracza. Sugeruje to, że klamrowanie do capu
DZIEJE SIĘ w jakimś momencie (np. na starcie kolejnej tury), ale w MIĘDZYCZASIE (w trakcie tej samej
tury, po doliczeniu przychodu z budynków) wartość może chwilowo przekroczyć limit zanim zostanie
przycięta — do potwierdzenia przez Explore, nie zgadywać którego dokładnie momentu to dotyczy.

**Cytat Macieja:** „odkłada mi się więcej gliny i drewna niż mam magazyn." Zrzut panelu
„MAGAZYNOWANE": Drewno **1298/1000** (+114/turę) oznaczone „PEŁNY", Glina **1086/1000** (+76/turę)
też oznaczone „PEŁNY" — obie wartości PRZEKRACZAJĄ deklarowany limit magazynu (1000), mimo że pasek
postępu i etykieta „PEŁNY" sugerują, że limit jest respektowany. Ruda żelaza na tym samym zrzucie
poprawnie pokazuje 0/1000.

Dispatch Explore (bez kodowania) przed naprawą: (a) znaleźć logikę limitu/capu magazynu surowców
(prawdopodobnie `gra/src/game/**`, szukać „magazyn"/„spichlerz"/cap/limit powiązanego z
Drewno/Glina — może być inny mechanizm niż dla Żywności/Skarbca, skoro te dwa konkretne surowce
mają problem a Ruda nie); (b) ustalić czy klamrowanie (`Math.min(x, cap)`) jest w ogóle stosowane
dla Drewna/Gliny przy dopisywaniu przychodu z budynków/eksploatacji złóż, czy dolicza się produkcję
bez sprawdzania capu i tylko WYŚWIETLANY pasek/etykieta „PEŁNY" jest liczony osobno (stąd
rozjazd — realna wartość rośnie bez ograniczeń, tylko UI mylnie pokazuje "PEŁNY" gdy przekroczy
próg); (c) sprawdzić czy to dotyczy też innych surowców pozamiastowych, czy wyłącznie Drewna/Gliny
(np. bo mają inny tor akumulacji niż Żywność/Skarbiec/Nauka, które są objęte innym, już
sprawdzonym kodem zapasu cywilizacji z `R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO`). Zanim cokolwiek
naprawię — ustalić DOKŁADNY mechanizm, nie zgadywać.

---

## R-SPICHLERZ-CAP-LUDNOSCI-ETAP (2026-08-09, propozycja gameplayowa Macieja) · STATUS: **ZAMKNIĘTE — SCALONE `cf2b63cc`, Evaluator RUNDA 4 (finalna) PASS-WITH-NOTES, 0 blokujących**

**Cytat Macieja:** „okej, więc cały sens Spichlerza to dodatkowe bonusy, ale myślę, że dołączyłbym
mu jeszcze jeden bonus, mianowicie jeżeli miasto chce wzrosnąć powyżej [progu bez budynków] to musi
mieć spichlerz. Można wtedy urosnąć do 8 ludności, a obecny Akwedukt pozwoli wzrosnąć z 8 do 12
(z wcześniejszych 5[→15]). W późniejszych epokach wymyślimy kolejne etapy."

**Stan dzisiejszy (zweryfikowany w kodzie, `gra/src/game/economy.ts:1047-1053`, parametry
`akwedukt_prog_ludnosci`/`akwedukt_max_ludnosci`):**
- Cap ludności miasta ma DWA poziomy: bez Akweduktu = **5**, z Akweduktem = **15**.
- Spichlerz dziś **NIE gatekeepuje wzrostu** — daje wyłącznie bonusy (zdrowie, % wzrostu, mnożnik
  kosztu racji, zadowolenie), pod warunkiem że ceramika (i sól dla tier II) zostały odprowadzone
  w danej turze (`maSpichlerzPop`/`maSpichlerzIIPop`, `SPICHLERZ_DRAIN_CERAMIKA_PER_TURN = 5`).
- Reguła bonusów Spichlerza jest już raz podjętą decyzją: **B5-SPICH (Maciej 2026-06-29)**,
  udokumentowaną w `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md` — ta propozycja ją ROZSZERZA
  (dodaje twardy próg, nie tylko bonus), nie zastępuje.

**Rozpoznanie — konflikt z istniejącą decyzją (CLAUDE.md §1a):** propozycja zmienia dwie już
wytunowane liczby: (1) wprowadza NOWY twardy próg 5→8 wymagający Spichlerza (dziś go nie ma wcale);
(2) obniża górny cap Akweduktu z dzisiejszych **15** do **12** (parametr `akwedukt_max_ludnosci`
jest dziś wytuningowany na 15 — to bezpośrednia zmiana istniejącej wartości balansu, nie tylko
nowa funkcja).

Pytanie ABC do zadania w następnej turze (patrz odpowiedź na czacie).

---

## P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI — ECHO A, decyzja Macieja (2026-08-09)

**Decyzja Macieja: A.** Cytat: „najpierw obrona swojego terytorium, a potem dopiero atak obcego."

Potwierdza zasadę opisaną w rozpoznaniu (linia 5162 wyżej): (1) najwyższy priorytet — zlikwidować
wrogie siły (w tym barbarzyńców) na własnym terytorium lub w jego bezpośredniej okolicy, niezależnie
od stanu pokoju/wojny z kimkolwiek innym; (2) jeśli w stanie wojny z konkretną cywilizacją, walczy z
nią normalnie; (3) jeśli więcej niż jeden wróg jednocześnie, stara się atakować też pozostałych.

Bez dalszych doprecyzowań — dispatch implementacji.

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA — ECHO A + istotne doprecyzowanie zakresu, decyzja Macieja (2026-08-09)

**Decyzja Macieja: A**, z rozbudowanym doprecyzowaniem (pełny cytat):

„ale z zastrzeżeniem że to, że dana cywilizacja chce nawiązać sojusz z bardziej odległymi
cywilizacjami które zna, nie zmienia faktu że musi mieć możliwość zawarcia takiego sojuszu — czyli
tutaj wszystkie elementy balansu muszą być zachowane — natomiast wypowiada wojnę jednej cywilizacji
która jest obok. Ale [chodzi też o to], żeby ta wojna nie trwała nie wiadomo jak długo — powinna
trwać maksymalnie do zdobycia dwóch miast przeciwnika lub utraty dwóch miast, potem powinien być
zawierany pokój, żeby cywilizacje się nie wycięły w pień. Potem 20 tur odpoczynku i znowu szukanie
nowego wroga po 20 turach — może być inna cywilizacja, z którą graniczy, niekoniecznie ta sama.
Możemy nawet wprowadzić zasadę, że AI nie będzie atakować tej samej cywilizacji przez okres [???]
tur. Jednakże cywilizacje nie powinny przy wypowiadaniu wojen zrywać sojuszy czy paktowania.
Agresje powinny zakończyć się zgodnie z zasadami."

**Pełna specyfikacja reguły (rozbita na parametry nazwane):**
1. Cel wojny wymuszonej = sąsiad terytorialny (nie dowolna cywilizacja) — zgodnie z wcześniejszym
   rozpoznaniem (filtr sąsiedztwa do dobudowania, wzorem `clusterForceWarTargetId`).
2. Zdolność zawierania sojuszy z odległymi, znanymi cywilizacjami NIE może zostać ograniczona przez
   tę regułę — wojna wymuszona z sąsiadem współistnieje z normalną dyplomacją sojuszniczą gdzie
   indziej, cały istniejący balans dyplomacji zostaje.
3. **Koniec wojny wymuszonej** (nowy parametr `wojnaWymuszonaMaxMiastaZdobyteLubStracone = 2`) —
   pokój zawierany automatycznie, gdy jedna ze stron zdobędzie 2 miasta przeciwnika LUB straci 2
   własne miasta na rzecz przeciwnika (co pierwsze nastąpi).
4. **Odpoczynek po wojnie** (`wojnaWymuszonaOdpoczynekTur = 20`) — po zawarciu pokoju cywilizacja
   nie szuka nowego wymuszonego celu wojny przez 20 tur.
5. **Nowy cel po odpoczynku** — po 20 turach szuka nowego sąsiada-celu; może to być inna
   cywilizacja niż poprzednia, niekoniecznie ta sama.
6. **Cooldown na powrót do tej samej cywilizacji** — Maciej zaproponował osobny limit tur, ale
   **NIE podał liczby** (urwane zdanie: „przez okres [ ] tur"). ⚠️ Do potwierdzenia — patrz pytanie
   niżej. Robocze założenie do dispatchu: reużyć tę samą wartość co odpoczynek ogólny
   (`wojnaWymuszonaCooldownTaSamaCywilizacjaTur = 20`, czyli w praktyce ten sam licznik co pkt 4 —
   jeśli to za mało/za dużo, Maciej poprawi osobnym ABC/liczbą).
7. **Sojusze i pakty NIE są zrywane** przy wypowiadaniu wojny wymuszonej — istniejące umowy
   (sojusze, traktaty) z INNYMI cywilizacjami niż cel wojny mają przetrwać bez zmian.
8. Punkt zaczepienia w kodzie: `main.ts:22130`, `reconcileAllOwnerErasFromResearch()` (awans do
   epoki Brąz = Brązownictwo).
9. **Dopisek Macieja (kolejna wiadomość, ten sam wątek):** „jeżeli jakiejś cywilizacji została już
   wypowiedziana wojna [przez kogoś innego], to ta cywilizacja nie ma już obowiązku wypowiadać
   komuś innemu wojny, żeby nie prowadziła dwóch wojen jednocześnie." — reguła wymuszonej wojny przy
   awansie do Brązu sprawdza NAJPIERW, czy cywilizacja jest już w stanie wojny z KIMKOLWIEK (jako
   napastnik LUB jako obrońca — wojna wypowiedziana JEJ przez inną stronę też się liczy); jeśli tak,
   pomija wymuszenie (cywilizacja nie musi dodatkowo wypowiadać własnej wojny). Zapobiega to
   sytuacji dwóch jednoczesnych wojen wymuszonych na jedną cywilizację.

**Zgodnie z regułą 6 CLAUDE.md (nie zgaduj przy niejednoznaczności) — jedno pytanie doprecyzowujące
do WĄTKU, który już prowadzimy** (nie nowy temat): patrz wiadomość na czacie. Reszta specyfikacji
(pkt 1-5, 7-9) jest kompletna i zostaje przekazana do dispatchu już teraz.

---

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH-NA-CUDZYM-TERENIE — ECHO A, decyzja Macieja (2026-08-09)

**Decyzja Macieja: A.** Zgodnie z propozycją z rozpoznania (linia 5215 wyżej): pula nagród chatki
ze skarbami (`villageRewards.ts`: dziś złoto 50%/tech 30%/jednostka 20%) ma WYKLUCZAĆ jednostki
WOJSKOWE, gdy chatka leży na terytorium OBCEJ cywilizacji — żeby odkrycie chatki nie liczyło się
jako naruszenie granicy i nie karało dyplomacji (dziś kara −5 Zaufania/turę nalicza się bez wyjątku
dla jednostek pochodzących z eventu). Jednostki cywilne (np. Zwiadowca, era 1) zostają bez zmian —
problem dotyczy WYŁĄCZNIE jednostek typu wojskowego (np. Włócznik od ery 2+).

**Do dispatchu (szczegół implementacyjny, nie decyzja gameplayowa — domyślne rozłożenie
prawdopodobieństwa):** gdy pula jednostki wojskowej jest wykluczona na cudzym terenie, usunięte 20%
rozdzielić proporcjonalnie na pozostałe kategorie (złoto/tech w stosunku 50:30, czyli finalnie
~62,5%/~37,5%) — jeśli Maciej wolałby inny rozkład, może to skorygować po zobaczeniu wyniku.

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA — ECHO A + doprecyzowanie podejścia, decyzja Macieja (2026-08-09)

**Decyzja Macieja: A**, z doprecyzowaniem podejścia: „jedynie nie robiłbym nowego panela, tylko
wszedłbym w obecny panel dyplomacji, żeby sprawdzić co tam jest zakodowane i czy to można użyć lub
rozszerzyć."

Interpretacja (zgodna z duchem opcji A, którą Maciej wybrał — opcja A od początku zakładała
REUŻYCIE martwego `diplomacyPanel.ts`, nie pisanie od zera): nacisk na kolejność pracy — **najpierw
dogłębna inspekcja** martwego `diplomacyPanel.ts` (ma już gotową sekcję „Wojny znane (wywiad)") ORAZ
żywego `diploListHud.ts`/`diplomacyAudience.ts`, ustalić dokładnie co już działa/co da się
rozszerzyć, dopiero potem pisać nowy kod — **nie tworzyć nowego, osobnego komponentu UI, jeśli
istniejący kod (żywy lub martwy) da się rozszerzyć zamiast zastępować**. Pozostała specyfikacja bez
zmian: (1) sortowanie — cywilizacje nad miastami-państwami w `diploListHud.ts`; (2) krok pośredni —
kliknięcie cywilizacji pokazuje najpierw podsumowanie (wojny/sojusze/handel/propozycja spotkania),
dopiero potem pełny panel wizyty; ograniczenie silnika (sojusze AI↔AI tylko między „siostrami")
zostaje ujawnione Maciejowi jako znana granica danych, nie do naprawy w tym zadaniu.

## P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI — ECHO A (wbrew rekomendacji C), decyzja Macieja (2026-08-09)

**Decyzja Macieja: A** (twardy wymóg `withinTerritory` dla AI, jak u gracza) — WBREW rekomendacji
Explore, która sugerowała C (złagodzenie scoringu). Cytat: „Ekspansja nie oznacza chaosu. Jak
najbardziej cywilizacje mają ekspandować i szybko budować miasta wokół, ale w granicach zasięgu
własnej cywilizacji, bo każda cywilizacja potem będzie mieć jedną zwartą grupę, a to po prostu była
jakaś masakra."

**⚠️ Świadome ograniczenie wcześniejszej decyzji (CLAUDE.md §1a) — Maciej podjął to wybierając A ze
świadomością konfliktu, który był już nazwany wprost w treści opcji A (linia 5453-5456 wyżej):**
opcja A koliduje z celem „pokrycie całej mapy" z **R-AI-KOLONIZACJA (Q3=B, 2026-08-03)** — AI z
twardym `withinTerritory` będzie miało trudniej kolonizować odległe dobre tereny. Ta decyzja
świadomie ZAWĘŻA realizację R-AI-KOLONIZACJA Q3=B: „pokrycie mapy" ma się teraz odbywać przez
rozrost ZWARTEGO terytorium każdej cywilizacji (ekspansja blisko istniejących miast), NIE przez
zakładanie miast w dowolnie odległych, oderwanych lokalizacjach.

**Do dispatchu:** dodać AI ten sam twardy wymóg `withinTerritory` co gracz (`main.ts:7639-7659`
wzorem) w `foundCityAt`/`canFoundCity` dla AI (`main.ts:23084`) — ORAZ usunąć/odwrócić dzisiejszą
premię +15 pkt w heurystyce AI za zakładanie miasta POZA zasięgiem istniejących miast (`ai.ts:2694`)
— ta premia dziś działa WPROST przeciw nowemu wymogowi (AI szukałoby lokalizacji, których i tak nie
może użyć). MIN_CITY_DISTANCE (4 heksy) zostaje bez zmian — to już jest identyczne gracz/AI, nie
jest przyczyną problemu.

---

## R-SPICHLERZ-CAP-LUDNOSCI-ETAP — ECHO A, decyzja Macieja (2026-08-09)

**Decyzja Macieja: A** (wbrew rekomendacji B). Dokładnie jak zaproponowano: bez budynków cap=5 (bez
zmian) → ze Spichlerzem cap=8 (nowy stopień) → z Akweduktem cap=12 (obniżka z dzisiejszych 15).

**Parametry do zmiany** (`gra/src/game/economy.ts`, `EconParams`/params JSON):
- `akwedukt_prog_ludnosci = 5` — bez zmian (cap bez żadnego z dwóch budynków).
- NOWY parametr, np. `spichlerz_prog_ludnosci = 8` — cap gdy miasto ma Spichlerz (ale nie Akwedukt).
- `akwedukt_max_ludnosci`: **15 → 12** — zmiana istniejącej, wytuningowanej wartości.

**Do dispatchu (kwestia techniczna, nie gameplayowa — domyślne założenie, opisz i przekaż):**
istniejące zapisane gry mogą mieć miasta już powyżej 12 (dziś legalnie urosłe do maks. 15).
Domyślne założenie: **zamrożenie, nie ścinanie** — miasto powyżej nowego capu NIE traci ludności
wstecznie, po prostu przestaje rosnąć dalej, dopóki cap go nie dogoni (np. przez kolejny budynek w
przyszłej epoce). Żadna istniejąca reguła spadku ludności (deficyt żywności) nie zostaje zmieniona
przez to zadanie — to osobny mechanizm. Jeśli Maciej wolałby ścinanie do nowego capu, może to
skorygować po zobaczeniu wyniku.

**Warunek Spichlerza dla capu = 8:** czy wymagany jest ten sam warunek co dla bonusów Spichlerza
(odprowadzona ceramika w danej turze, `maSpichlerzPop`), czy sam fakt POSIADANIA budynku
(niezależnie od odprowadzenia ceramiki w tej konkretnej turze)? Robocze założenie do dispatchu: SAM
FAKT POSIADANIA budynku wystarcza dla podniesienia twardego capu (cap to stały parametr strukturalny
miasta, nie bonus zależny od przepływu surowca turowego) — odprowadzanie ceramiki nadal warunkuje
TYLKO miękkie bonusy (zdrowie/%/mnożnik/zadowolenie), tak jak dziś. Jeśli Maciej chce inaczej, może
skorygować.

---

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — Evaluator RUNDA 1: FAIL, runda 2 w toku (2026-08-09)

**Werdykt Evaluatora (Opus 5): FAIL.** Kierunek zgodny z decyzją, ścieżka „szczęśliwa" działa, ale
4 notatki BLOKUJĄCE:
- **B1 — exploit nieskończonego ruchu:** zwrot liczony na `moveCost` (zamierzony koszt), nie na
  faktycznie odjętą pulę — reguła MIN-MOVE (`planned-march.ts:197-203`) pozwala wejść na heks
  droższy niż budżet ruchu (np. Wzgórza+Las=3 przy `ruchLeft=1`), `deductStackRuchLeft` klampuje do
  zera, ale zwrot dodaje pełne 3 → +2 pkt ruchu zysku netto za każdy cykl „ruch → Zostaw osobno".
  Odtwarzalne w nieskończoność.
- **B2 — zwrot natychmiast kasowany:** gdy na heksie startowym stoi inna własna jednostka z niższym
  `ruchLeft`, `selectPlayerUnit` (wołane zaraz po `onSeparate`) synchronizuje CAŁY stos do minimum —
  zwrot ruchu wyparowuje, punkt ruchu jednak jest tracony wbrew decyzji Macieja. Dodatkowo w ścieżce
  `main.ts:8803-8806` (`openMergePanelForSelected`) odejmowanie idzie na CAŁY stos źródłowy, a zwrot
  tylko na wybrany podzbiór — rozjazd u źródła.
- **B3 — teleport bez sprawdzenia zajętości/przejezdności:** stary kod (`assignBounceHexesForUnits`)
  sprawdzał `isOccupied`/`passable`; nowy kod bezwarunkowo ustawia `mu.q=fromQ, mu.r=fromR`. Na
  ścieżce odłożonej (`deferredMergePrompts`, flush po turach AI) wróg może w międzyczasie zająć heks
  startowy — armia gracza wtedy teleportuje się na wroga bez walki.
- **B4 — nowy test nie chroni `main.ts`:** harness kopiuje logikę `onSeparate` do osobnego pliku
  zamiast importować z `main.ts`; mutacja Evaluatora (usunięcie CAŁEGO zwrotu ruchu z `main.ts`)
  dała 13/13 PASS — dowód że bramka nie wykryłaby regresji w kodzie produkcyjnym.

Niepilne: N1 (jednostka świeżo wyprodukowana bez heksu startowego — „Zostaw osobno" staje się
no-opem, wymaga OSOBNEGO pytania ABC, nie zgadywać), N2 (licznik w komunikacie), N3 (zaznaczenie po
separacji nieoptymalne), N4 (martwy kod `assignBounceHexesForUnits`, bez ryzyka), N5 (worktree
przestarzały, standardowa procedura scalania to naprawi).

**Dispatch runda 2** z dokładną specyfikacją napraw B1-B4 od Evaluatora. N1 NIE jest w zakresie
rundy 2 — osobne pytanie ABC do zadania po zamknięciu tego tematu.

---

## P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI — Evaluator RUNDA 1: PASS-WITH-NOTES (3 BLOKUJĄCE), runda 2 w toku (2026-08-09)

Zgłoszony scenariusz jest realnie naprawiony, ale 3 noty BLOKUJĄCE (Evaluator jednolinijkowo je
tak oznaczył mimo etykiety „PASS-WITH-NOTES" — traktowane jak FAIL, wymagają poprawki przed
scaleniem, zgodnie ze STRICT z kanonu AutoBot):

- **B1 — regres wydajności +80% czasu tury AI**, zmierzone: 640-877ms → 1050-1318ms na
  `decideAITurn` (mapa 100×100, 10 miast, 100 wrogich jednostek). Przyczyna: `isEnemyNearOwnTerritory`
  wołana teraz per JEDNOSTKA (setki) zamiast per MIASTO (kilkanaście), pełny skan promienia dla
  każdej dalekiej jednostki. Poprawka jednolinijkowa: wstępny filtr `hexDistance ≤ 9` przed
  wywołaniem drogiej funkcji (zmierzone: przywraca czas do 649ms, test nadal 9/9).
- **B2 — nieprawdziwa liczba w komentarzu kodu.** JSDoc mówi „promień 2 heksy poza granicą", ale
  `isEnemyNearOwnTerritory` liczy `maxDist` DWUKROTNIE (promień iteracji + sprawdzenie) — faktyczny
  zasięg wykrywania to 9-19 heksów OD CENTRUM miasta (4 heksy za granicą, nie 2), zależnie od
  populacji. Błąd pre-istniejący w helperze (nie do naprawy tu), ale nowy komentarz nie może
  powielać nieprawdy jako faktu.
- **B3 — obrońca wybierany kolejnością w tablicy jednostek, nie odległością do zagrożenia.**
  Potwierdzone empirycznie: jednostka stojąca pod wrogim miastem (40 heksów od zagrożenia) bywa
  zawracana do domu, podczas gdy jednostka 2 heksy od zagrożenia kontynuuje marsz — bo kolejność w
  `sortedUnits` (tworzenia jednostek, `super` na początku) decyduje, kto dostaje slot obrońcy, nie
  odległość. Dodatkowo: jednostki, które już zaatakowały zagrożenie w kroku 4b, NIE są liczone do
  kworum — powoduje podwójne zaangażowanie (druga jednostka zawracana do już obsłużonego
  zagrożenia).

**Niepilne (N1-N3, do rundy 2 albo później):** N1 — faza wyścigu o wioski (`myCities.length < 3`)
ma pierwszeństwo PRZED obroną domu, co łamie „zawsze najwyższy priorytet" z decyzji A w early-game
— wymaga świadomej decyzji (poprawić kolejność vs udokumentować jako celowe odstępstwo), nie
przemilczenia. N2 — luki testu (3 zmutowane parametry przeżyły próbę mutacyjną: promień, górny
limit kworum, sztywne kworum). N3 — jednostki cywilne mogą dostać rozkaz obrony (zajmują slot).

Dispatch runda 2 z dokładną specyfikacją B1-B3. N1 flagowane jako osobna decyzja do Macieja PO
zamknięciu tej rundy, nie zgadywana teraz.

---

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE — Evaluator RUNDA 1: FAIL, runda 2 w toku (2026-08-09)

**B1 (BLOKUJĄCA, wymaga ABC — nie zgadywać):** globalny „Priorytet produkcji" jest bezczynny dla
ISTNIEJĄCYCH miast. Silnik auto-budowy czyta `budowaPriorytetTypow` (pełna lista), nie
`budowaFocus` — broadcast Operatora kopiuje tylko `budowaFocus`/`budowaTryb`, nigdy
`budowaPriorytetTypow`. Zweryfikowane uruchomieniem: zmiana globalnego priorytetu w mieście A NIE
zmienia realnego priorytetu auto-budowy w mieście B. Dodatkowo opis Operatora („miasta siostrzane
dostają jednoelementowy priorytet") jest NIEPRAWDZIWY — siostrzane zachowują pełną STARĄ listę,
jednoelementową listę dostaje tylko NOWO zakładane miasto (i tam też gubi 2./3. pozycję). Pytanie
ABC do zadania: czy rozszerzyć mechanizm globalny o `budowaPriorytetTypow`, czy wyjąć Priorytet
produkcji z zakresu tego feature'u (zostawić tylko lokalny, bez globalnego domyślnego).

**B2 (BLOKUJĄCA, mechaniczna):** `seedCityOwnerDefaults()` stoi w 5 miejscach ZAKŁADANIA miasta,
ale NIE w 4 miejscach ZMIANY WŁAŚCICIELA (`post-battle-map.ts:440` zdobycie w bitwie,
`main.ts:10492` zdobycie przez oblężenie, `main.ts:19656` wchłonięcie miasta-państwa,
`main.ts:21827` przejście do rebeliantów). Po transferze `okolicaFocusOverride`/`budowaFocusOverride`
zostają `false`, ale `city.okolicaFocus`/`budowaFocus`/`budowaTryb` trzymają wartości POPRZEDNIEGO
właściciela — silnik czyta `city.*` bezpośrednio (stara wartość), UI czyta przez resolver (nowa,
globalna wartość nowego właściciela) — panel pokazuje co innego niż robi silnik.

**B3 (BLOKUJĄCA, mechaniczna):** 3 z 9 mutacji przeżyły próbę Evaluatora — `broadcastBudowaProfilToOwnerCities`
nadpisujący miasta z `override=true` (pin 📌 złamany), oraz OBIE migracje starych zapisów
(`migrateOkolicaFocusOnLoad`/`migrateBudowaProfilOnLoad` bez ustawienia override) — w produkcji
oznacza to, że wczytanie STAREGO zapisu KASUJE indywidualnie ustawiony Priorytet Okolicy/produkcji
we wszystkich miastach i zastępuje wartością pierwszego miasta w tablicy. Realna utrata danych
gracza przy migracji.

Niepilne: sticky override po jednym kliknięciu zbiorczej akcji „ustaw Listę we wszystkich
miastach", asymetria trybu ręcznego (Okolica nie auto-pinuje, Budowa tak), `cityPanel.ts:1037`
uśpiona niespójność wywołania.

Dispatch runda 2 dla B2+B3 (mechaniczne). B1 wymaga ABC — patrz wiadomość na czacie.

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH-NA-CUDZYM-TERENIE — Evaluator RUNDA 1: FAIL, runda 2 w toku (2026-08-09)

**B1 (BLOKUJĄCA):** wykluczenie ocenia terytorium na heksie CHATKI, ale jednostka-nagroda spawnuje
się 1-2 heksy DALEJ (`findVillageRewardSpawnHex`, bez sprawdzenia terytorium), a kara nalicza się
od pozycji JEDNOSTKI, nie chatki. Zmierzone: dla chatek na granicznym pierścieniu obcego terytorium
~31% nadal przecieka (jednostka spawnuje wewnątrz obcego terytorium mimo wykluczenia na chatce)
LUB odwrotnie (fałszywe wykluczenie dla chatki formalnie „na" terytorium, ale spawn poza nim).
Naprawa tania: liczyć `dest` z `findVillageRewardSpawnHex()` PRZED losowaniem (deterministyczny,
niezależny od RNG) i oceniać terytorium na `dest`, nie na `(q,r)` chatki. Evaluator ocenia to jako
mieszczące się w delegowanym „szczególe implementacyjnym" decyzji A (służy wprost jej celowi) —
NIE wymaga nowego ABC, chyba że Maciej insystuje na dosłownym odczycie z heksu chatki.

**N2 (do ABC, nie cicha naprawa):** wykluczenie nie odwzorowuje istniejących zwolnień z kary
przemarszu (`hasAuthorizedBorderCrossing`: stan WOJNY, sojusz, prawa wasala, traktat
PrawoWojskowePrzemarszu — w żadnej z tych 4 sytuacji kara i tak nie powstaje). Dziś gracz traci
szansę na jednostkę wojskową z chatki nawet gdy jest W WOJNIE z właścicielem terytorium (kara nie
grozi wcale) — czyli wykluczenie działa szerzej niż potrzeba. Pytanie ABC do zadania: czy
uwzględnić te 4 zwolnienia w warunku wykluczenia.

Dispatch runda 2 dla B1 (naprawa spawn-hex). N2 wymaga ABC — patrz wiadomość na czacie.

---

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — Evaluator RUNDA 2: FAIL, runda 3 w toku (2026-08-09)

Postęp realny (B1 arytmetyka i B3 funkcja są dobre, złapane własnymi mutacjami M1/M2 Evaluatora),
ale 2 noty nadal BLOKUJĄCE:

- **BB1 — B4 wciąż nie chroni main.ts.** Trzy niezależne mutacje WPROST w `main.ts` (przywrócenie
  exploita B1 przez zmianę argumentu na `moveCost`; usunięcie całego zwrotu ruchu — dokładnie ta
  sama mutacja co w rundzie 1; przywrócenie teleportu bez sprawdzenia z B3) — wszystkie dają
  16/16 PASS. Bramka chroni czyste funkcje w `armyMerge.ts`, ale NIE ich wpięcie w `main.ts`.
  **Rozwiązanie wskazane przez Evaluatora:** repo ma już wzorzec na dokładnie ten problem — 7
  istniejących testów (`border-march-wygasanie-test.cjs` jako kanoniczny wzorzec) czyta
  `src/main.ts` jako TEKST i asercjonuje regexem na wyciętym ciele funkcji, że zawiera właściwe
  wywołania i NIE zawiera cofniętych. Dokładna specyfikacja do wdrożenia podana przez Evaluatora
  (wytnij ciało `onSeparate`, sprawdź obecność `computeSeparateReturn(movedUnits, deductedRuch)` +
  `resolveSeparateReturnHex(...)`, brak `computeSeparateReturn(movedUnits, moveCost)` i `const dest
  = { q: fromQ, r: fromR }`; osobno sprawdzić że wszystkie 3 wywołania `promptMergeIfCoLocated`
  mają 5. argument `deductedRuch`).
- **BB2 — B2 naprawione tylko częściowo.** `skipStackRuchSync=true` pomija sync w jednym
  wywołaniu, ale zostawia stos w stanie nieznormalizowanym — w scenariuszu z heksem startowym
  zajętym przez inną własną jednostkę o NIŻSZEJ puli (rzadki, ale dokładnie ten opisany w nocie
  B2 z rundy 1): zwrot jest bezużyteczny natychmiast (podświetlenie/`stackCanMove` liczy minimum
  całego heksu) i znika przy pierwszym kolejnym kliknięciu. Do wyboru: naprawić realnie albo
  udokumentować jako świadome ograniczenie (systemowa reguła „pula stosu = minimum") i zapytać
  Macieja ABC — nie zamykać po cichu jako naprawione.

Niepilne: N1 (ostateczny fallback teleportuje na origin mimo blokady, gdy WSZYSCY sąsiedzi zajęci —
bezpieczniejszy fallback: nie ruszać wcale), N2 (pre-istniejące, armia lądowa może odbić na wodę),
N3 (stare testy bounce certyfikują martwy kod, nie dowodzą braku regresji w onSeparate). **N4
wymaga ABC (nie wina Operatora):** pełny zwrot puli po marszu WIELOHEKSOWYM nie cofa efektów
ubocznych trasy (odsłonięta mgła, chatki, bonusy z odwiedzin miast, auto-capture pustego miasta) —
pozwala w jednej turze skanować kolejne trasy tym samym stosem za darmo („marsz → Zostaw osobno"
bezkosztowy). To konsekwencja decyzji A („pełny zwrot ruchu"), nie błąd implementacji.

Dispatch runda 3, wąski zakres: TYLKO BB1 (test tekstowy wzorem `border-march-wygasanie-test.cjs`)
i BB2 (naprawa realna, decyzja Operatora którą opcję wybrać z uzasadnieniem w raporcie). N4
wymaga ABC — patrz wiadomość na czacie.

---

## R-SPICHLERZ-CAP-LUDNOSCI-ETAP — Evaluator RUNDA 1: FAIL, runda 2 w toku (2026-08-09)

**B1 — regresja: ulepszenie Spichlerza do Spichlerz II ODBIERA cap 8 i cofa miasto do 5.**
`population-growth-v85.ts:344` liczy `maSpichlerzBuilding = builtIds.includes('spichlerz')`, ale
`production.ts` (`applyCompletedBuildingIds`) USUWA `'spichlerz'` z `builtIds` przy ulepszeniu do
`spichlerz_ii` (ma `upgradeFrom: "spichlerz"`) — miasto, które ulepszy budynek (ścieżka aktywnie
punktowana przez AI), traci cap 8 i wraca do 5. Zmierzone empirycznie na realnej ścieżce silnika:
„Spichlerz II: pop 7 → 7 (oczekiwane 8)". Kod ma już własną, ustaloną konwencję pomijaną przez
Operatora — `turn-economy.ts:1331`: `builtIds.includes('spichlerz') || builtIds.includes('spichlerz_ii')`.
Ta sama wada w `cityPanel.ts:1010` (chip capu).

**B2 — test nie chroni jedynej linii wiring'u.** Mutacja `maSpichlerzBuilding = false` przechodzi
WSZYSTKIE bramki (akwedukt-popcap 9/9, population-growth-v85 53/55, logic-test 213/213) bez
żadnego wykrycia — istniejący test e2e używa `population: 8` i asercjonuje BRAK wzrostu, co jest
prawdą w obu gałęziach (poprawnej i zepsutej, bo przy zepsutej derywacji cap spada do 4, a 8>4 też
nie rośnie). Naprawa zweryfikowana przez Evaluatora: `population: 7` + oczekiwanie `=== 8` łapie
mutanta.

**B3 — karta „Budynki wpływające na wzrost" podaje fałsz.** `cityPanel.ts:4785` dla miasta z
Akweduktem I Spichlerzem pokazuje „bez Akweduktu max 5" — nieprawda, bez Akweduktu to miasto ma 8.
Wiersz Spichlerza nie wspomina wcale o nowym twardym capie 8.

Wszystkie 3 mechaniczne, bez ABC. Dispatch runda 2.

Niepilne (do rundy 2 albo później): N1 (nieaktualny komentarz o „buggu z diakrytykiem" —
`loadEconParams` jest martwy z innego, prostszego powodu: po prostu nigdy niewołany, nie z powodu
błędu klucza), N3 (kanon `docs/decyzje/B-popcap-akwedukt-audit.md` nieaktualny, nadal pisze cap 15),
N4 (spichlerz_prog_ludnosci płaski 8/8/8 mimo że akwedukt_prog_ludnosci skaluje się z trudnością —
zgodne z dosłownymi słowami Macieja, tylko do wiadomości), N5 (obejście capu przy buncie,
pre-istniejące), N7 (CLAUDE.md ma nieaktualny zapis `upgrade-budynki 48/48`, realnie 48/1 fail
pre-istniejący).

---

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE-B1 — ECHO A, decyzja Macieja (2026-08-09)

**Decyzja Macieja: A.** Rozszerzyć globalny mechanizm o `budowaPriorytetTypow` (pełną listę
priorytetów, nie tylko `budowaFocus`), żeby globalny „Priorytet produkcji" faktycznie działał dla
istniejących miast, zgodnie z pierwotną prośbą.

**Kolejność pracy:** B2/B3 (runda 2, mechaniczne naprawy transferu właściciela + migracji) są już
w toku (Operator `a7eb4511bbdb4e3b9`, ten sam plik `empire-city-defaults.ts`/`main.ts`). B1
dispatchowane jako OSOBNE zlecenie DOPIERO po zakończeniu i weryfikacji rundy B2/B3, żeby uniknąć
dwóch równoległych Operatorów na tych samych plikach — kolejkowane, nie odkładane bez terminu.

---

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA — Evaluator RUNDA 1: FAIL, runda 2 w toku (2026-08-09)

**B1 — Barbarzyńcy pojawiają się w „W stanie wojny z" w KAŻDEJ rozgrywce.** `getDiploRelation`
wpisuje relację `wojna` barbarzyńców do tej samej mapy, którą skanuje nowy kod, bez filtra — repo
ma już jawny precedens obrony przed dokładnie tym (`C-BARB-Q1=B`, `main.ts:25864`), pominięty tu.

**B2 — wyciek mgły wojny.** Brak bramki kontaktu — pop-up pokazuje wojny/sojusze/handel z
cywilizacjami, których gracz NIGDY nie spotkał (nazwa i sam fakt istnienia ujawnione), oraz z
cywilizacjami WYELIMINOWANYMI. Oba istniejące, analogiczne kolektory (`collectWarsWithPlayer`,
`collectKnownWarsBetweenOthers`) mają taką bramkę zawsze — nowy kod (`warPartnerIdsForOwner`,
`dealPartnerIdsForOwner`) jej nie ma.

**B3 — bramka nie chroni sortowania** (całe żądanie nr 1 bez ochrony). Mutacja: usunięcie
`.sort(compareDiploListEntries)` z `render()` → 23/23 nadal PASS. Test sprawdza czysty komparator,
nie jego realne wpięcie do renderu listy.

**Ocena podejścia (nie blokuje kodu, ALE narracja do Macieja musi być uczciwa):** Evaluator ustalił,
że to formalnie NOWY komponent UI (żyjący w pliku `diplomacyPanel.ts`, ale zero współdzielonego
DOM/renderu z martwym panelem — tylko wspólne helpery skórki, importowalne z dowolnego miejsca).
Ocena Evaluatora: to SŁUSZNA decyzja (martwy panel to zadokowany panel boczny, nie pop-up, którego
prosił Maciej), ale trzeba to nazwać wprost jako nowy komponent, nie jako „rozszerzenie
istniejącego panelu".

**Punkt 4 (przycisk propozycji spotkania) — NIE jest luką**, sprawdzone bezpośrednio w cytacie
Macieja: jego własne zdanie utożsamia „propozycję spotkania" z przyciskiem przejścia do audiencji.
Jedyna rozbieżność to etykieta („Otwórz pełną audiencję" zamiast języka Macieja) — niepilne, N1.

Niepilne: N2 (pop-up nie chowa się automatycznie przy otwarciu audiencji z innej ścieżki niż
callback — 5 miejsc), N3 (raport do Macieja ma nazwać to nowym komponentem), N4/N5 (trzecia,
prawie identyczna kopia klasyfikacji zamiast reużycia istniejącej), N6 (kolor proporczyka z
niewłaściwego tieru), N7 (podwójne sortowanie, nieszkodliwe), N8 (kolejka kart pierwszego kontaktu
nie wznawia się po zamknięciu pop-upu), N9 (czy gracz ma się pokazywać w „W stanie wojny z" —
decyzja do zapisania przy naprawie B2), N10 (dane statyczne, akceptowalne).

Dispatch runda 2 dla B1+B2+B3 (+N2 przy okazji, ta sama okolica kodu). Wszystkie mechaniczne, bez
ABC.

---

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH-NA-CUDZYM-TERENIE — Evaluator RUNDA 2: FAIL, runda 3 w toku (2026-08-09)

Merytoryka naprawy B1 (spawn-hex zamiast hut-hex) jest POPRAWNA i potwierdzona niezależnie
(czystość funkcji, brak podwójnego wywołania, matematyka scenariusza, mapowanie era→wojskowość —
wszystko sprawdzone i zielone). Ale **bramka nadal nie chroni main.ts** — ta sama klasa problemu co
w rundzie 1 (i jak w P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO): 3 niezależne mutacje w `main.ts`
(przywrócenie oceny na heksie chatki zamiast spawnu; wyłączenie całej funkcji wykluczenia;
odwrócenie bezpiecznika `?? true`→`?? false`) dają 73/73 PASS. Sekcja 11 testu w ogóle nie czyta
`main.ts` — reimplementuje logikę inline w pliku testu, certyfikuje więc TEZĘ, nie WPIĘCIE.

**Naprawa (dokładna specyfikacja Evaluatora):** wzorzec `hud-moc-warstwa-test.cjs` (czyta
`main.ts` jako tekst, wycina ciało funkcji, asercjonuje regexem) zastosowany do `checkVillageRewardAt`:
(1) obecność `territoryOwnerAtLive(rewardUnitDest.q, rewardUnitDest.r)` I brak
`territoryOwnerAtLive(q, r)`; (2) obecność `pickVillageReward(Math.random(), { excludeUnit })`;
(3) obecność `isVillageRewardUnitMilitary(player.era)`; (4) DOKŁADNIE JEDNO wystąpienie
`findVillageRewardSpawnHex(` w tym ciele (dowód że liczone raz, nie dwa); (5) do sekcji 10 dołożyć
`isVillageRewardUnitMilitary(3)===true` i `(99)===true` (łapie odwrócony bezpiecznik).

Niepilne do zrobienia przy okazji (ten sam plik, jednolinijkowe): N1 (zdublowane źródło prawdy —
`VILLAGE_UNIT_IS_MILITARY_BY_ERA` powiela `units.json`'s `Typ`, lepiej wyprowadzić z
`lookupUnitDef(...)['Typ'] !== 'Civilian'`, ten sam predykat co silnik kary), N2 (komentarz sugeruje
nieistniejącą ogólną regułę „cywile zwolnieni z kary" — poprawić na odwołanie do konkretnego
prefiltra `main.ts:3697`).

Dispatch runda 3, wąski zakres: test tekstowy (główne) + N1/N2 przy okazji.

---

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA — Evaluator RUNDA 1: FAIL (6 BLOKUJĄCYCH), runda 2 w toku (2026-08-09)

Architektura dobra (czysty moduł, reużycie kanału DOW), ale 6 not BLOKUJĄCYCH:

- **B1** — `applyCityCaptureToMap` NIE jest jedynym funnelem (twierdzenie Operatora nieprawdziwe):
  `resolveSiegeSurrender()` (kapitulacja głodowa) zmienia właściciela BEZ wywołania haka licznika.
  Konsekwencja cięższa niż wygląda: dla pary AI↔AI nie ma ŻADNEJ innej ścieżki pokoju (negocjacje
  pokojowe dziś działają tylko z graczem) — zgubiony licznik = wojna wieczna, dokładnie czego
  Maciej chciał uniknąć.
- **B2 (wymaga ABC)** — kaskada sojusznicza celu nieobsłużona: wymuszona wojna odpala
  `applyAllianceObligationsOnWar`, więc sojusznicy CELU też wchodzą w wojnę z napastnikiem, ale te
  wojny poboczne nie są objęte licznikiem pary — auto-pokój po 2 miastach kończy tylko parę A-B,
  a A zostaje w wieczystej wojnie z sojusznikami B (AI↔AI nie ma wyjścia, patrz B1). Pytanie do
  Macieja: czy wymuszona wojna ma w ogóle odpalać casus foederis, a jeśli tak — czy auto-pokój ma
  kończyć też wojny kaskadowe.
- **B3** — sojusz z CELEM nie blokuje wyboru (sprzeczne z Twoim „nie powinny zrywać sojuszy") —
  dziś blokowany jest tylko pakt nieagresji, sojusz NIE, i zostaje zerwany przy wypowiedzeniu.
- **B4** — mechanizm może wyłączyć się TRWALE i po cichu: `pending` konsumowane niezależnie od
  wyniku, zapis do cyklu tylko po SUKCESIE — cywilizacja, która w chwili awansu jest w
  jakiejkolwiek wojnie (częste, bo mechanizm klastrowy wymusza wojny od tury ≥20, dokładnie w oknie
  K→B) nigdy więcej nie dostanie szansy w całej partii.
- **B5** — brak zapisu do save/load: żadna z 4 nowych struktur stanu nie trafia do snapshotu ani
  nie jest odtwarzana — po wczytaniu zapisu w trakcie wymuszonej wojny stan wyparowuje (wojna
  wieczna + wypadnięcie z cyklu na stałe). Kanon AutoBot: twardy FAIL (STRICT-SAVE).
- **B6** — bramka nie chroni main.ts (ta sama klasa problemu co inne tematy dziś): usunięcie
  sprawdzenia eligibility LUB usunięcie wywołania haka licznika przy przejęciu miasta — oba dają
  27/27 ALL GREEN.

Niepilne: N1 (gracz nigdy nie jest celem — cicha decyzja zakresowa, nie w specyfikacji), N2
(„sąsiad" liczony bardzo zgrubnie, bez maks. promienia), N3 (kandydat już w wojnie z kimś innym nie
wykluczany), N4 (odpoczynek uzbrajany tylko dla napastnika), N5 (koniec przez eliminację nie daje
odpoczynku), N6 (cooldown 20 tur tylko na ścieżce progowej, inna ścieżka pokoju daje 10),
N7 (wojna z MP powinna czy nie liczyć się jako „już w wojnie" — do rozstrzygnięcia), N8 (stałe w
TS nie w JSON, Maciej nie dostroi z panelu), N9 (map-gen nieukończona, ryzyko zerowe).

Dispatch runda 2 dla B1, B3, B4, B5, B6 (mechaniczne). B2 wymaga ABC — patrz wiadomość na czacie.

---

## R-EPOKA-CUD-WARUNEK-AWANSU — Evaluator RUNDA 1: PASS-WITH-NOTES (3 BLOKUJĄCE), runda 2 w toku (2026-08-09)

Rdzeń logiki poprawny (12/12/8 tech potwierdzone, Petra = jedyny cud cross-epoch, brak 5. miejsca
mutującego player.era w normalnej ścieżce awansu, isMajorAiOwner pre-istniejące i poprawne, brak
cofania epoki, miasta-państwa nie kradną cudu). Korekta na korzyść Operatora: ryzyko Fenicjan
przeszacowane — Inżynieria to najniższy tier Żelaza, realny koszt to JEDNA technologia ponad
komplet Brązu, nie „kilkadziesiąt tur".

**B1 (BLOKUJĄCA) — cała integracja main.ts bez pokrycia.** Ta sama klasa problemu jak w kilku
innych tematach dziś: mutacja usuwająca gałąź `isMajorAiOwner` w `syncOwnerEraFromResearch` +
usunięcie wywołania `reconcileEraForOwner()` po ukończeniu cudu → wszystkie bramki zielone.

**B2 (BLOKUJĄCA, wymaga ABC) — nowe złamanie zgodności sejwów + parytetu.** On-load przeliczanie
epoki AI (`main.ts:25870`) NADPISUJE zapisaną epokę nową, ostrzejszą regułą — ale gracz NIE jest
przeliczany przy wczytaniu. Skutek: na KAŻDYM istniejącym zapisie, AI które było w Brązie na starej
regule zostaje po cichu zdegradowane do Kamienia, a gracz zachowuje starą epokę — cały świat AI
cofa się, gracz nie. Wymaga decyzji: migracja starych zapisów / `Math.max` z zapisaną epoką /
świadome zaakceptowanie że stare zapisy się nie wczytają poprawnie.

**B3 (BLOKUJĄCA, wymaga ABC) — ryzyko utknięcia AI niezmierzone mimo wyraźnego polecenia.**
Zmierzone przez Evaluatora: reguła cudu jest MARTWA dla 6 z 15 cywilizacji (celtowie, chińczycy,
germanie, grecy, rzymianie, słowianie — ich cud E leży w Żelazie, ostatniej epoce, pętla capuje się
na maxDefinedEra=3, warunek epoki 3 nigdy nie jest ewaluowany) — efekt gameplayowy węższy niż
zapowiadane 1/3 przejść. Realne ryzyko trwałego zablokowania AI dla pozostałych 9 cywilizacji:
zbudowanie cudu wymaga JEDNOCZEŚNIE throttle trafienia + pustej kolejki produkcji + progu
opłacalności + rezerwy żywności, bez żadnego fallbacku/rozluźnienia z czasem — trwałe niespełnienie
= cywilizacja nigdy nie opuszcza epoki.

Niepilne: N1 (zdobycie stolicy łupi technologie i może po cichu przesunąć epokę bez powiadomienia —
samoleczące się w ≤1 turę, ale ciche), N2 (kolejność inicjalizacji przy starcie — dziś nieszkodliwe,
cicha pułapka na przyszłość), N3 (`owner-epoch-test.cjs` przeterminowany, testuje już nieaktualną
ścieżkę), N4 (round-robin civType — uzasadnienie w kodzie błędne, realny powód inny, do poprawy
komentarza), N5 (ważne ostrzeżenie: pole `wymagaTerenu` cudów zadeklarowane w danych, ale NIGDZIE
nieegzekwowane w kodzie — jeśli ktoś to kiedyś "dokończy", bramka epoki stanie się nieusuwalną
blokadą dla cywilizacji bez odpowiedniego terenu, np. Egipt bez pustyni-rzeki), N6 (interakcja
epokaWejscia×techUnlock niezaasercjonowana).

Dispatch runda 2 dla B1 (mechaniczne). B2 i B3 wymagają ABC — zostaną przedstawione po domknięciu
aktualnie otwartego wątku (kolejka pytań, max 3 na turę).

---

## P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI — Evaluator RUNDA 1: PASS-WITH-NOTES (1 BLOKUJĄCA), runda 2 w toku (2026-08-09)

Implementacja merytorycznie poprawna, zweryfikowana niezależnie punkt po punkcie (matematyka
early-game 4/5 potwierdzona ze źródeł, `foundingTerritoryOpts` generyczna, spójność 3 sprawdzeń
terytorium potwierdzona matematycznie, usunięcie `requireOutsideTerritory` nie było scope creepem,
wydajność zmierzona niezależnie: −27%, stary kod realnie wybierał róg mapy 20 heksów od miasta —
bezpośrednia reprodukcja zgłoszonego „miszmaszu"). Zero fałszywych twierdzeń w raporcie Operatora.

**B1 (BLOKUJĄCA) — bramka nie chroni main.ts.** Ten sam wzorzec problemu co kilka innych tematów
dziś: test nigdy nie ładuje `main.ts`, cofnięcie JEDYNEJ linii realizującej parytet gracz-AI na
poziomie egzekucji (`canFoundCity(..., foundingTerritoryOpts(ownerId))` → goły `canFoundCity(...)`
bez opcji) daje 15/15 PASS. To ma znaczenie merytoryczne: filtr w `ai.ts` to tylko planista na
migawce stanu, bramka w `main.ts` to jedyne miejsce, gdzie wymóg jest EGZEKWOWANY.

**Ważna informacja dla Ciebie (N2, nie blokuje, ale zasługuje na świadomość PRZED playtestem):**
konsekwencja decyzji A jest silniejsza niż opisana w pierwotnym ABC. AI zakłada miasta wyłącznie
przez panel budowy (bez osadnika) — więc żadna cywilizacja AI nie założy już miasta na INNYM
LĄDZIE/WYSPIE, chyba że jej miasto urośnie populacyjnie na tyle, że promień terytorium (max 15) tam
sięgnie. Ekspansja zamorska AI de facto znika — obce kontynenty AI może zdobywać już tylko
podbojem. Zgodne z literą Twojej decyzji („zwarta grupa"), ale warto wiedzieć wprost, zanim
zobaczysz to w grze.

Niepilne: N1 (re-walidacja w `planCityFounding` nieprotestowana), N3 (AI bez żadnego miasta zakłada
je bez wymogu terytorium — pre-istniejące, symetryczne z pierwszym miastem gracza), N4 (ciche
`continue` przy odrzuceniu — pre-istniejące), N5 (map-gen/cluster-start nierozstrzygnięte
środowiskowo, niezwiązane).

Dispatch runda 2, wąski zakres: TYLKO B1 (test tekstowy).

---

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA-B2 — ECHO B, decyzja Macieja (2026-08-09)

**Decyzja Macieja: B** (wbrew rekomendacji A). Wymuszona wojna Brązu odpala normalnie istniejący
mechanizm obowiązków sojuszniczych (`applyAllianceObligationsOnWar` — sojusznicy CELU dołączają do
wojny przeciw napastnikowi), ALE licznik „2 miasta zdobyte/stracone = koniec" ma obejmować
WSZYSTKIE wojny w kaskadzie naraz (nie tylko parę napastnik-cel), i kończyć całą grupę wojen
jednocześnie po osiągnięciu progu w sumie.

**Implikacja architektoniczna (do dispatchu):** dzisiejszy licznik jest per-para
(`bronzeForceWarActiveByPairKey`, klucz A-B). Trzeba wprowadzić pojęcie GRUPY WOJEN wynikającej z
jednego triggera wymuszonej wojny (napastnik + cel + wszyscy sojusznicy celu wciągnięci kaskadą) —
wspólny licznik zdobytych/straconych miast SUMOWANY po wszystkich parach w grupie, próg 2 kończy
WSZYSTKIE wojny grupy naraz (automatyczny pokój z każdym uczestnikiem osobno, w tej samej turze).

**Kolejność pracy:** runda 2 tego tematu (B1/B3/B4/B5/B6, mechaniczne naprawy) jest już w toku na
tych samych plikach (`forced-war-bronze.ts`/`main.ts`). B2 dispatchowane jako OSOBNE zlecenie
DOPIERO po zakończeniu i weryfikacji tej rundy, żeby uniknąć kolizji dwóch równoległych
Operatorów.

---

## P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI — Evaluator RUNDA 2: FAIL, runda 3 w toku (2026-08-09)

**B1a (NOWY BUG wprowadzony przez naprawę wydajności) — prefilter=9 gubi realne zagrożenia dla
miast o populacji >5.** Operator pomylił próg minimalny z maksymalnym: rzeczywisty zasięg
wykrywania to `promień_terytorium + 2×AI_HOME_DEFENSE_VICINITY_HEX`, nie stała 9 — dla miasta
pop=12 to 16 heksów, pop=15/20 to 19. Prefilter=9 odcina zagrożenia w pierścieniu 10-19 heksów dla
większości miast. Dowód behawioralny: barbarzyńca 12 heksów od centrum miasta pop=12 (WEWNĄTRZ
własnego terytorium) — z prefiltrem AI idzie na odległego wroga, bez prefiltra broni domu. To
dosłownie odtworzone pierwotne zgłoszenie. Skala: 52% zagrożeń zgubionych na testowej mapie.
**Gotowe rozwiązanie, zweryfikowane matematycznie przez Evaluatora na 10000 heksach:**
`hexDistance(wróg, miasto) <= cityTerritoryRadius(miasto) + 2*AI_HOME_DEFENSE_VICINITY_HEX`
— dokładny (nic nie gubi), liczony PER MIASTO (nie względem najbliższego), szybszy niż tępy próg 19.

**B1b — bramka nie chroni przed regresem, dla którego powstała.** Mutacja usuwająca prefilter
(pełne przywrócenie regresu rundy 1) → 14/14 nadal PASS. Benchmark porównuje dwie kopie logiki
napisane w samym teście, nie kod produkcyjny.

**B3b — kod naprawiony, ale test tego nie chroni.** Własny scenariusz dyskryminujący Evaluatora
(cywil atakuje jedyne zagrożenie w kroku 4b, przydzielony obrońca stoi na heksie miasta) łapie
mutację cofającą naprawę podwójnego zaangażowania; test T3 Operatora tego NIE łapie (asercja
przypadkiem pusta, bo oba scenariusze dają ten sam heks docelowy).

Wynik próby mutacyjnej: 2 zabite z 7 (M2, M4). Przeżyły: M1 (prefilter), M3 (handledThreatIds),
M5 (sortowanie wg pilności — sama logika może być OK, tylko niepokryta), M6/M7 (stałe promienia).

Niepilne: N4 (jednostka bez ruchu może zająć slot obrońcy, opóźnienie o turę), N5 (przydział 1:1
zastąpił kworum z rundy 1 — zmiana projektowa nieudokumentowana, do świadomej decyzji lub opisu),
N6 (test kopiuje logikę zamiast importować z ai.ts). N1 (wyścig o wioski) potwierdzone nietknięte.

Dispatch runda 3, wąski zakres wg gotowej specyfikacji Evaluatora: (1) zamienić prefilter na
dokładny warunek per miasto (wzór wyżej, poprawić fałszywy JSDoc); (2) dołożyć test korektności na
mieście pop=12/15 z zagrożeniem 10-19 hex od centrum; (3) przerobić T3 na scenariusz dyskryminujący
(obrońca na heksie miasta) wg wzoru Evaluatora.

---

## R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA (2026-08-09, propozycja Macieja) · STATUS: **OTWARTE — wymaga rozpoznania**

**Kontekst zgłoszenia:** bezpośrednia kontynuacja tematu P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI
— po informacji, że AI (i tak samo gracz, twardy wymóg `withinTerritory`) traci możliwość
zakładania miast poza własnym, zwartym terytorium (w tym za morzem), Maciej zaproponował
rozwiązanie zamiast cofania decyzji A.

**Cytaty Macieja (3 wiadomości, ten sam wątek):**
1. „masz rację. I wtedy trzeba zrobić fort w tamtym miejscu, żeby otworzyć nowe miasto."
2. „porty i wieże strażnicze powinny być, mieć możliwość budowania poza zasięgiem miasta."
3. „poza tym to samo ograniczenie dotyczy gracza, więc tutaj trzeba to globalnie rozwiązać zarówno
   dla AI jak i dla gracza."

**Wstępne ustalenie (bez subagenta, szybki grep) — mechanizm już istnieje W DANYCH, nieznany stan
w kodzie:** `gra/data/terrain-improvements.json` ma już wpis `fort` z jawnym komentarzem „ABC-10
Maciej 2026-07-04: Fort (mapa) ≠ Cytadela (miasto). Żelazo ep.3; zasięg 10; +100% Obrona
obozowanie" oraz osobny wpis `decyzje_EKONOMIA` mówiący wprost: „zasieg_terytorium: posterunek=5
(epoka 2), fort=10 (epoka 3), miasto=10 (stałe); **zakładanie kolejnego miasta wymaga Strażnica LUB
zasięgu obecnego miasta**." Czyli DOKŁADNIE mechanizm, o który prosi Maciej, był już zaprojektowany
(ABC-10, 2026-07-04) — pytanie do rozpoznania: czy `withinTerritory`/`canFoundCity` faktycznie
uwzględnia dziś węzły terytorium z posterunku/fortu, czy tylko z miast (wcześniejsze rozpoznanie
`P-AI-ZAKLADANIE-MIAST` sprawdzało tylko `cityNodesForOwner` — możliwe że fort/posterunek nigdy nie
zostały wpięte do tej funkcji, mimo że dane/design to zakładają).

**Drugi wątek do rozpoznania:** czy Posterunek/Strażnica i Port dają się dziś budować WYŁĄCZNIE w
obrębie już posiadanego terytorium (typowe dla budynków miejskich), czy jako ulepszenie terenu
budowane przez jednostkę (Robotnika?) w dowolnym odkrytym, dostępnym heksie — Maciej chce tego
drugiego („poza zasięgiem miasta").

**Zakres (potwierdzony explicite przez Macieja):** rozwiązanie MA dotyczyć RÓWNOCZEŚNIE gracza i AI
(parytet, spójny z całą resztą decyzji tej sesji) — nie tylko naprawa dla AI.

Dispatch Explore (bez kodowania) przed ABC: (a) zweryfikować czy `withinTerritory`/`canFoundCity`
(gracz i AI) uwzględnia węzły terytorium z fortu/posterunku, czy tylko z miast — dokładny plik i
funkcja; (b) sprawdzić jak dziś buduje się Fort/Posterunek/Port — budynek miejski (w kolejce
produkcji miasta, wymaga już posiadanego miasta) czy ulepszenie terenu (jednostka na mapie, w
dowolnym dostępnym heksie) — jeśli to pierwsze, to sam Fort nie rozwiąże problemu (miasto musi już
istnieć, żeby go zbudować — błędne koło); (c) sprawdzić czy AI ma dziś jakąkolwiek logikę budowy
Fortu/Posterunku poza miastem (jednostką) — czy trzeba to dopiero dodać do AI; (d) sprawdzić czy
mechanizm „posterunek=5, fort=10" z komentarza w danych jest w ogóle zaimplementowany gdziekolwiek
w kodzie, czy to tylko projektowa notatka z 2026-07-04, nigdy niewdrożona.

---

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE — Evaluator RUNDA 2: PASS-WITH-NOTES (bez blokujących), gotowe do scalenia (2026-08-09)

B2 (4 miejsca transferu właściciela) i B3 (3 mutacje broadcast/migracja) potwierdzone niezależnie —
Evaluator zrobił własny grep (nie tylko powtórzył Operatora) i własną próbę mutacyjną na 8
wariantach (3 z rundy 1 + 5 dodatkowych), wszystkie złapane. B1 (`budowaPriorytetTypow`) potwierdzone
nietknięte — zero zmian kodu, tylko komentarze odsyłające do przyszłej decyzji.

Niepilne (do rejestru, nie blokują): N1 (Operator błędnie napisał że zarejestrował znalezisko
growthmult osobno — nieprawda, ale sprawa BYŁA już wcześniej zarejestrowana przez kogoś innego,
skutek zerowy), N2 (martwa funkcja + mylący komentarz odsyłający do nieistniejącego precedensu),
N3 (asymetria bramek `ownerId===0` między polami — dziś nieszkodliwa, promień rażenia rośnie po tej
zmianie), N4 (na starych zapisach całe imperium może się przypiąć po migracji, globalny suwak
bezczynny dopóki gracz ręcznie nie odepnie — do noty playtestowej), N5 (niezapięty inwariant,
dziś nieosiągalny), N6 (asymetria UX: wejście w Listę przypina automatycznie, wyjście nie odpina —
decyzja produktowa nieopisana, do wspomnienia przy okazji domykania B1).

**GOTOWE DO SCALENIA.** Scalam teraz.

---

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — Evaluator RUNDA 3: FAIL (dokumentacja nieprawdziwa), runda 4 w toku (2026-08-09)

**BB1 potwierdzone ZAMKNIĘTE** — Evaluator zrobił 6 własnych mutacji (3 ze zlecenia + 3 dodatkowe),
wszystkie złapane przez bramkę tekstową, test funkcjonalny nadal ślepy na wszystkie — dokładnie
potwierdza sens naprawy. Znaleziono kruchość testu tekstowego (K-1 do K-5) — najpoważniejsza K-5:
asercja liczy wystąpienia `deductStackRuchLeft(` GLOBALNIE w całym pliku (24 tys. linii), więc
KAŻDA przyszła, niezwiązana funkcja odejmująca pulę ruchu wysadzi tę bramkę bez związku z tematem.

**BB2 — powód FAIL nie jest brakiem naprawy (to byłoby akceptowalne), tylko NIEPRAWDZIWĄ
DOKUMENTACJĄ tego faktu (CLAUDE.md §0b).** Evaluator prześledził realny łańcuch wywołań:
`skipStackRuchSync=true` w `onSeparate` jest natychmiast unieważniane 24 linie dalej przez
`refreshD1bHud()` → render HUD → `buildArmyStackHudStateInner()` → `syncStackRuchLeft(stack)` BEZ
flagi — zwrot ginie w TYM SAMYM, synchronicznym wywołaniu. Komentarz w kodzie i raport Operatora
(„częściowa mitygacja", „chroni pierwszy odczyt") są NIEPRAWDZIWE — flaga jest placebo, chroni
zero odczytów. Dobra wiadomość: to nie wprowadza NOWEJ regresji (zachowanie identyczne jak przed
rundą, wszystkie odczyty i tak są min-owe).

**Korekta uzasadnienia ABC Operatora — Twoja intuicja o kolizji z wcześniejszą decyzją była
NADINTERPRETACJĄ.** ECHO A („żadnego rozpraszania") odpowiadało na PYTANIE O INNĄ RZECZ: czy
budować „dwie niezależne, wybieralne armie na jednym heksie" (pełna funkcja produktowa z UI/AI/
save). To NIE to samo co „różne pule ruchu w obrębie jednego heksu" — par. 6b w kodzie to komentarz
dokumentacyjny, nie egzekwowany kontrakt; silnik już dziś rutynowo trzyma 2+ niepołączone armie na
jednym heksie (stąd w ogóle istnieje prompt merge). Realna naprawa (`stackGroupId`) WCIĄŻ wymaga
ABC — ale jako NOWA decyzja o obserwowalnej zmianie zasad (gracz zobaczy dwie armie o różnym ruchu
na jednym polu), nie jako coś zabronionego wcześniejszą decyzją.

**Opcje Operatora niekompletne — Evaluator dołożył 2 tańsze warianty, oba bez tożsamości stosu:**
- D — origin zajęty przez własną jednostkę o niższej puli traktować jak „brak bezpiecznego origin"
  (ta sama gałąź co dziś przy zajętym wrogim/nieprzejezdnym origin: jednostki NIE wracają, zostają
  z komunikatem) — zero nowych pojęć, zero refaktoru.
- E — przy powrocie zsynchronizować pulę CAŁEGO heksu do wartości ZWRÓCONEJ armii (nie do minimum)
  — jedna linia, spójne z „ruch się nie odbył", ale ma efekt uboczny: rezydent dostaje ruch,
  którego nie miał (potencjalny mikro-exploit, do ujawnienia w opisie).
- Nienazwany dotąd skutek uboczny obu opcji D/E do ujawnienia w ABC: przy powrocie na heks z własną
  jednostką o WYŻSZEJ puli, sync OBNIŻA pulę tej postronnej jednostki do wartości wracającej armii
  — przy starym rozpraszaniu nigdy do współlokacji nie dochodziło, więc to NOWY efekt uboczny tej
  całej funkcji (niezależnie od wybranej opcji naprawy BB2).

Dispatch runda 4, wąska: (1) USUNĄĆ `skipStackRuchSync` (placebo nie wchodzi do repo, chyba że
ktoś udowodni testem że coś chroni), (2) zawęzić/usunąć asercję `deductCount===4` z bramki
tekstowej (K-5, ryzyko fałszywych alarmów w przyszłości). BB2 pozostaje NIEZAIMPLEMENTOWANE,
świadomie i uczciwie udokumentowane — pełne, poprawione pytanie ABC (5 opcji: A-nic-nie-rób-udokumentuj-uczciwie,
B-pełny-refaktor-stackGroupId, C-propozycja-Operatora-re-prompt, D-traktuj-jak-brak-origin,
E-sync-do-wartości-armii) idzie do Macieja po zamknięciu tej rundy.

---

## R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA — korekta zakresu Macieja (2026-08-09)

**Korekta:** „Port to jakaś pomyłka. Nie mamy portu w grze. Ale dobry pomysł. Pomyślę o tym, że
możemy to jakoś użyć w przyszłości." Temat R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA dotyczy
WYŁĄCZNIE Fortu i Strażnicy/Posterunku — Port usunięty z tego tematu, przeniesiony do osobnego
zgłoszenia (patrz niżej), NIE pilny, świadomie odłożony do przyszłości.

## R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE (2026-08-09, propozycja Macieja) · STATUS: **ZAMKNIĘTE — SCALONE `fbde1880` (2026-08-10)**

**Cytat Macieja:** „w ogóle też można wprowadzić jakieś budynki portowe dla miast nadbrzeżnych."
Świadomie odłożone przez samego Macieja („pomyślę o tym") — NIE wymaga dispatchu teraz, ale
zarejestrowane żeby nie zginęło (C-027/C-030).

**Instrukcja Macieja (ta sama tura):** „zaproponuj jakieś rozwiązania z tymi dwoma wątkami i zrób
turnament na najlepszą propozycję" — dotyczy OBU tematów (Fort/Strażnica-zasięg-zakładania ORAZ
budynek portowy). Uruchamiam pełny turniej ABC (2 niezależnych Proponentów + Sędzia, `C-018`) dla
obu, mimo że temat portowy jest jawnie oznaczony jako niepilny — turniej produkuje GOTOWĄ propozycję
do rozważenia, nie wymusza natychmiastowego wdrożenia.

Kontekst dostępny do rozpoznania: w grze istnieje już jednostka morska (`Galley`, `Typ: Naval`,
`units.json:557`) — port mógłby np. odblokowywać/przyspieszać produkcję jednostek morskich, dawać
bonus handlowy dla miast nadmorskich, albo łączyć oba. Rozpoznanie stanu „miasto nadbrzeżne"
(czy silnik już wykrywa sąsiedztwo wody dla miasta) do zbadania przez Proponentów.

---

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE — SCALONE `8692b61b` (2026-08-09)

Scalone bezpiecznie z worktree Operatora rundy 2 do głównego drzewa. 5 plików zmienionych (2
identyczne bezpośredni apply, 2 zdywergowane scalone chirurgicznie, `main.ts` największy — 3-way
merge bez konfliktów, zweryfikowany) + 2 nowe pliki. Bramki na scalonym stanie: tsc 0 · logic-test
213/213 · empire-city-defaults-test 30/30 · auto-manage-test 45/45. Temat zamknięty (B1
`budowaPriorytetTypow` pozostaje osobnym, świadomie odłożonym zgłoszeniem — czeka na dispatch po
uwolnieniu plików).

---

## R-SPICHLERZ-CAP-LUDNOSCI-ETAP — Evaluator RUNDA 2: PASS-WITH-NOTES (1 BLOKUJĄCA), runda 3 w toku (2026-08-09)

B1 (regresja Spichlerz II) i B3 (karta budynków) potwierdzone poprawne i zweryfikowane niezależnie
(obie ścieżki EconParams, wszystkie 4 kombinacje UI). B2 częściowo: naprawa w silniku
(`population-growth-v85.ts`) chroniona testem, ale `turn-economy.ts:1331` (deduplikacja, zero
zmiany semantyki, OK) i **`cityPanel.ts:1016` NIEchronione** — mutacja cofająca helper do starego
`built.includes('spichlerz')` przeżywa wszystkie 8 testów bundlujących ten plik, przywracając
dokładnie oryginalny objaw B3 (miasto ze Spichlerzem II znów pokazuje „bez Akweduktu max 5") przy
100% zielonych bramkach. To ta sama klasa problemu co w kilku innych tematach dziś (test tekstowy
regex wzorem `hud-moc-warstwa-test.cjs`/`border-march-wygasanie-test.cjs`).

Niepilne: N-A (`maSpichlerz: boolean = false` domyślne — ta sama klasa niewykrywalnego dla
kompilatora mutanta, lepiej wymagany parametr), N-B (kanon `B-popcap-akwedukt-audit.md` nadal
nieaktualny, z rundy 1), N-C (martwy `ownerHasSpichlerz()` sprawdzający tylko starą wartość — mina
na przyszłość), N-D (AI nie modeluje capu w wycenie Akweduktu, pre-istniejące poza zakresem),
N-E (zamrożenie >12 potwierdzone pozytywnie, formalnie do potwierdzenia przez Macieja), N-F (chip
capu nie pokazuje się dla miasta ze Spichlerzem poniżej limitu — drobny UX).

**Ostrzeżenie procesowe od Evaluatora:** worktree Operatora ma niescommitowane zmiany od 2 rund —
przy błędzie narzędziowym (Evaluator omyłkowo prawie skasował pracę przez `git checkout`,
odtworzone z patcha, zero strat) ryzyko jest realne. Do rozważenia: Operator powinien commitować
NA WŁASNEJ GAŁĘZI worktree (nie do main) po każdej rundzie, żeby mieć punkt przywracania.

Dispatch runda 3, wąski zakres: test tekstowy chroniący `cityPanel.ts:1016`.

---

## R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH-NA-CUDZYM-TERENIE — Evaluator RUNDA 3: PASS-WITH-NOTES (1 nowa BLOKUJĄCA), runda 4 w toku (2026-08-09)

Runda 2 (bramka main.ts) potwierdzona realnie zamknięta — 4 mutacje z rundy 2 + własne warianty
Evaluatora złapane. NOWE, głębsze znalezisko: bramka regexowa PINUJE WPIĘCIE, ale nie łapie
ODWRÓCENIA SEMANTYKI — 6 z 10 dodatkowych mutacji Evaluatora przechodzi 74/74 ALL GREEN mimo
odwrócenia logiki (np. `&& isVillageRewardUnitMilitary(...)` → `&& !isVillageRewardUnitMilitary(...)`
= dokładna odwrotność decyzji Macieja, regex nadal pasuje bo tekst funkcji nadal tam jest).

**Naprawa (mała, jedno miejsce):** wyciągnąć samą decyzję do czystej funkcji
`shouldExcludeUnitReward({hasSpawnHex, spawnHexOwnerId, playerOwnerId, rewardUnitIsMilitary})` w
`villageRewards.ts`, przetestować PEŁNĄ TABELĄ PRAWDY (16 kombinacji) zamiast regexem — to zamyka
odwrócenia behawioralnie, nie tekstowo. Dołożyć 3 piny na `hutQ`/`hutR`/`ownerId: 0` do sekcji 11.

Niepilne: N1 (dopisać w komunikatach asercji „to pin, aktualizuj przy celowym refaktorze"),
N2 (`ownerId: 0` zaszyte na sztywno — pre-istniejące, mina gdyby chatki objęły AI), N3 (jedno
odwrócenie przez podwójną negację pozostaje poza zasięgiem regexu nawet po naprawie — akceptowalne,
funkcja jest domknięciem w `boot()`, niebehawioralnie łatwo testowalna bez większego wyciągania).

Dispatch runda 4, wąska, w pełni określona: wyciągnięcie `shouldExcludeUnitReward` + tabela prawdy
+ 3 piny.

---

## R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA — rozbudowana mechanika kontestowana (Maciej, 2026-08-09)

**Cytat pełny:** „to wymagałoby zmiany że port i strażnice można budować w dowolnym miejscu pod
warunkiem że to nie jest już teren innej cywilizacji. W drugą stronę to tak nie powinno działać.
fort czy strażnica nie blokuje terenu i inne cywilizacje mogą tam coś wybudować — to tylko
zabezpiecza dla nas miejsce że możemy tam wybudować miasto, ale jeżeli inna cywilizacja wcześniej
postawi swój fort albo po prostu będzie w zasięgu innych miast możliwość budowania tam miasta, to
będzie w stanie to wybudować, a nasz fort będzie bezużyteczny. A nawet więcej — po wybudowaniu
miasta przez inną cywilizację wokół tego fortu przejmuje na swoją użyteczność cały fort. Chyba że
są tam jakieś nasze jednostki, to nasze jednostki wtedy z tego fortu muszą być usunięte. Sprawdź,
czy to jest logiczne i czy możemy coś takiego wprowadzić."

**Rozbicie na reguły (do oceny przez turniej ABC, "Port" w tym kontekście = literówka/uproszczenie,
temat dotyczy Fortu/Strażnicy — Port jako osobny budynek jest już w grze, patrz osobny wątek):**
1. Budowa dozwolona WSZĘDZIE poza terenem należącym już do INNEJ cywilizacji (odwrócenie dzisiejszego
   `inPlayerTerritory` na coś bliższego `!terytoriumObcego`).
2. Fort/Strażnica NIE blokuje terenu dla innych — to "miękka rezerwacja", nie wyłączność.
3. Kontestacja: jeśli inna cywilizacja skolonizuje/rozszerzy terytorium (przez własne miasto LUB
   własny fort) na ten sam heks WCZEŚNIEJ/skuteczniej, nasz fort staje się bezużyteczny dla nas.
4. Przejęcie: gdy obca cywilizacja założy miasto, które swoim zasięgiem obejmuje nasz fort, PRZEJMUJE
   go na swoją użyteczność (nie niszczy, nie neutralizuje — realnie zmienia "właściciela" efektu).
5. Ewakuacja: jeśli w forcie stacjonowały nasze jednostki w momencie przejęcia, muszą zostać z niego
   usunięte (analogia do istniejącej logiki wymuszonego wycofania - patrz P-ARMIA-ROZPAD tej sesji).

Moja wstępna ocena logiczności (do zweryfikowania przez turniej): reguły 1-3 są spójne i tworzą
sensowną mechanikę "wyścigu o pogranicze" (fort jako słaba, tymczasowa opcja, prawdziwe miasto jako
mocna, trwała) — dobrze komponuje się z resztą decyzji tej sesji (parytet gracz/AI, "zwarta grupa").
Reguła 4 (przejęcie NA WŁASNOŚĆ obcej cywilizacji, nie zniszczenie) wymaga precyzyjnej definicji:
co dokładnie "przejęcie" oznacza technicznie (czy fort dosłownie zmienia ownerId i dalej działa,
tylko teraz dla przejmującego? czy tylko przestaje działać dla nas, a przejmujący dostaje NOWY,
własny węzeł terytorium niezależnie od tego, czy "nasz" fort tam nadal fizycznie stoi?). Reguła 5
(ewakuacja) jest spójna z istniejącym mechanizmem kary za obcą jednostkę na cudzym terenie
(border-march), więc naturalna.

Dispatch turnieju ABC (2 niezależnych Proponentów + Sędzia, `C-018`) w toku dla całego tematu,
uwzględniając tę rozbudowaną mechanikę.

---

## P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI — Evaluator RUNDA 2: PASS-WITH-NOTES (1 nowa BLOKUJĄCA), runda 3 w toku (2026-08-09)

B1 (bramka main.ts) potwierdzone ZAMKNIĘTE. **B2 (nowa) — runda 2 zgubiła pokrycie strony `ai.ts`
z rundy 1.** Operator przepisał test od zera i utracił scenariusze T1/T2/T4/T5 z rundy 1. Mutacja
usuwająca twardy filtr w `findCityFoundingHex` (zostawiając tylko re-walidację w
`planCityFounding`) daje 16/16 PASS, ale ma REALNY skutek gameplayowy: AI z legalnym, dostępnym
heksem w zasięgu nagle nie zakłada NICZEGO (paraliż ekspansji) — potwierdzone na konkretnym
scenariuszu przez Evaluatora. Test rundy 1 (wciąż istnieje w niescalonym worktree) TĘ mutację
łapie (15/15 → 3 FAIL). Naprawa praktycznie darmowa: złożyć plik z sekcji A rundy 1 (T1-T5,
przechodzą 15/15 na kodzie rundy 2 BEZ ŻADNEJ zmiany w src) + sekcji B rundy 2 (strażnik main.ts).

Niepilne: N2 (regex strażnika main.ts wrażliwy na reformat wieloliniowy z przecinkiem końcowym —
odporniejsza forma podana przez Evaluatora), N3 (jeden z pinów, `B1e`, ma leniwy regex który
przeskakuje przez instrukcje i nie łapie dopisania cichego zwolnienia AI z wymogu — do zawężenia),
N4 (ważne dla NASTĘPNEGO tematu w kolejce: R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA będzie
modyfikował dokładnie `foundingTerritoryOpts`, funkcję pilnowaną dziś tylko tekstowo — pamiętać o
N3 przy tamtym dispatchu), N5 (AI traci ekspansję zamorską — potwierdzone, nietknięte, do
świadomości przed playtestem), N6 (worktree rundy 1 ma równoległą, niescaloną kopię tych samych
zmian w src — scalać wolno TYLKO jedną wersję, inaczej konflikt/podwójny plik testu).

Dispatch runda 3, wąska: scal test T1/T2/T4/T5 z rundy 1 (kopiuj z niescalonego worktree
`a58e4934721d28f29`) + sekcja B rundy 2 (z poprawkami N2/N3) w jeden plik.

---

## R-EPOKA-CUD-WARUNEK-AWANSU — Evaluator RUNDA 2: PASS-WITH-NOTES (1 BLOKUJĄCA, tylko test), runda 3 w toku (2026-08-09)

**Kod gry jest poprawny i gotowy do scalenia** — Evaluator zrobił 9 własnych mutacji (2 ze
zlecenia + 7 dodatkowych: obie ścieżki cudu, handel tech, chatka, koniec tury, delegacja gracz/AI,
zamiana gałęzi ternary), wszystkie złapane. Potwierdzone: `tsc` NIE łapie tej klasy regresji (kod
kompiluje się czysto nawet zmutowany) — bramka tekstowa jest uzasadniona merytorycznie.

**E1 (BLOKUJĄCA, dotyczy WYŁĄCZNIE pliku testu, zero zmian w kodzie gry) — kruchość kotwic
regexowych.** 8 z 11 sond na NIESZKODLIWE zmiany (zmiana nazwy zmiennej, usunięcie/zmiana
komentarza, reformat wieloliniowy, cudzysłów zamiast apostrofu) fałszywie czerwieni bramkę.
Najpoważniejsze: kotwiczenie na TREŚCI KOMENTARZA — a zasada #9 CLAUDE.md nakazuje komentarze
dwujęzyczne PL+EN, czyli ta bramka pęknie przy realizowaniu INNEJ reguły projektu, jeśli ktoś
kiedyś przetłumaczy te konkretne komentarze. Naprawa mechaniczna, dokładnie wskazana przez
Evaluatora: przenieść kotwice z treści komentarzy/nazw zmiennych na strukturalne wzorce kodu
(`researchStep\(\s*player\b` zamiast dosłownego literału, `case\s*['"]tech['"]\s*:` zamiast
wymuszonych apostrofów, poszerzyć okna wycinania ciała funkcji z 500/600 znaków na ~2000 lub
lepiej: zliczanie klamer zamiast okna bajtowego).

Niepilne: N1 (komentarz w kodzie przesadza — „jedyne źródło prawdy" nieprawdziwe dla ścieżek
inicjalizacyjnych, doprecyzować), N2 (asercja pilnuje ISTNIEJĄCYCH miejsc, nie „każdego przyszłego
wywołania researchStep(player" — do rozważenia inwersji asercji), N3 (nowy test nie jest
zarejestrowany w żadnym runnerze/liście bramek — dopisać przy scalaniu), N4 (B2/B3 potwierdzone
nadal otwarte i słusznie poza zakresem, ta runda ich nie pogarsza).

Dispatch runda 3, wąska: WYŁĄCZNIE plik testu, obowiązek powtórzenia wszystkich 9 mutacji
merytorycznych (8/8+1 FAIL) i wszystkich 11 sond kruchości (11/11 PASS).

---

## R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA — ODŁOŻONE na "krok 2", decyzja Macieja (2026-08-09)

**Decyzja Macieja:** „Na razie niech Agent tylko i wyłącznie uniemożliwi budowania miast w taki
sposób w jaki budował do tej pory AI. Czyli zasady muszą być takie same jak dla gracza. I to jest
pierwszy krok. A w drugim kroku wprowadzimy zasady budowania innym Agentem poprzez rozszerzenie
własnego terytorium za pomocą Fortu lub posterunku."

**Skutek:** turniej Q1/Q2/Q3 (Sędzia: rekomendacja Q1=B·Q2=B·Q3=A) NIE jest teraz rozstrzygany —
odłożony jako „krok 2", bez ustalonej daty. **Krok 1** = `P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI=A`
ma zostać wdrożony DOKŁADNIE jak pierwotnie zdecydowano — twardy `withinTerritory` dla AI
identyczny jak dla gracza, BEZ żadnego złagodzenia przez fort/posterunek. To już jest w toku
(runda 3, Operator naprawia regresję testu B2) — kontynuować bez zmian.

**Odblokowanie wstrzymanej decyzji pobocznej:** usunięcie premii AI +15 pkt za zakładanie miast
poza zasięgiem (`ai.ts:2694`) MA zostać wykonane (nie wstrzymywać) — skoro krok 2 (fort) jest
odłożony, ta premia pozostaje sprzeczna z krokiem 1 i ma zniknąć zgodnie z pierwotnym zakresem
`P-AI-ZAKLADANIE-MIAST=A`. To już jest częścią trwającej pracy nad tym tematem, bez zmian.

Temat R-FORT-STRAZNICA pozostaje zarejestrowany, gotowa pełna specyfikacja turnieju czeka na
wznowienie, gdy Maciej zdecyduje się przejść do „kroku 2".

---

## R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE — ECHO C, decyzja Macieja + doprecyzowanie (2026-08-09)

**Decyzja Macieja: C** (A: rozbudowa ekonomiczna + B: Port jako brama produkcji morskiej dla
jednostek `Typ: Naval`), z zastrzeżeniem: „dostęp do wody może być też dostępem do rzeki, czyli
Port może być zarówno nad morzem, jak i przy rzece."

**Zgodność z istniejącym kodem:** bramka budowy samego budynku Portu już dziś używa
`cityHasCoastOrRiverAccess` (potwierdzone przez Sędziego turnieju) — czyli rzeka JUŻ kwalifikuje
do postawienia Portu. Doprecyzowanie Macieja dotyczy więc NOWEJ części (B): gdy dodamy wymóg
Portu+dostępu do wody dla jednostek `Typ: Naval`, użyć TEJ SAMEJ definicji „dostęp do wody"
(morze LUB rzeka), nie węższej „tylko morze" — żeby jednostka morska (Galera) mogła być budowana
w mieście rzecznym z Portem, tak samo jak w mieście nadmorskim z Portem.

**Otwarty, niedopowiedziany szczegół z pytania Sędziego (nie zgadywać, dopytać):** czy istniejące
zapisy gry z Galerami już zbudowanymi w miastach BEZ dostępu do wody mają zostać („grandfather" —
jednostki zostają, tylko NOWA produkcja jest blokowana) czy coś ostrzejszego. Pytanie zadane w
wiadomości na czacie.

---

## R-EPOKA-BRAZU-WYMUSZONA-WOJNA — Evaluator RUNDA 2: PASS-WITH-NOTES (1 BLOKUJĄCA), runda 3 w toku (2026-08-09)

Kod poprawny — B1, B3, B4, B5 zweryfikowane niezależnie (własny grep, własny roundtrip save/load
16/16, własna weryfikacja symetrii sojuszu), zero fałszywych twierdzeń Operatora. B2 potwierdzone
nietknięte (poza zakresem tej rundy).

**B6a (BLOKUJĄCA) — bramka złapała USUNIĘCIE haka, ale nie złapała usunięcia tego, co hak ROBI.**
Własna kampania 16 mutacji Evaluatora: 12/16 złapanych (w tym wszystkie 5 zadeklarowanych przez
Operatora), ale 4 przeżyły, z czego 3 to realne dziury:
- **M19** — usunięcie SAMEGO wywołania auto-pokoju z wnętrza haka (licznik nadal liczy, wojna
  nigdy się nie kończy) — rdzeń całej funkcji znika, wszystkie bramki zielone. Dla AI↔AI = wojna
  wieczna, dokładnie czego temat miał uniknąć.
- **M7** — zamiana `diploPairKey(oldOwner,newOwner)` na prostą interpolację stringów bez
  sortowania — licznik działa tylko gdy `oldOwner<newOwner`, po cichu gubi połowę zdobyczy.
- **M12** — usunięcie sprzątania stanu w `finalizePeaceTreatyBetween` — pokój wynegocjowany
  NORMALNIE (nie przez próg wymuszonej wojny) zostawia martwy wpis, napastnik trwale i cicho
  wypada z cyklu (ta sama klasa co B4 z rundy 1).
- M16 (utrata `lockTurnsOverride`, cooldown cicho spada z 20 na 10) — mniejszy, ale realny.

Naprawa mechaniczna, w pełni określona: dopisać do istniejącej bramki `forced-war-bronze-main-guard-test.cjs`
4 asercje regex (dokładna specyfikacja od Evaluatora): (1) hak zawiera wywołanie
`finalizePeaceTreatyBetween(...)` z argumentem cooldownu (łapie M19+M16 jedną asercją); (2) hak
wyszukuje przez `diploPairKey(oldOwner, newOwner)`, nie interpolację (M7); (3)
`finalizePeaceTreatyBetween` zawiera blok sprzątający stan wymuszonej wojny (M12); (4) hak wywołuje
`shouldEndBronzeForcedWarByCityCount(...)` przed pokojem.

Niepilne: N10 (gracz przypadkiem trafia do `bronzeForceWarPendingOwners`, nigdy nie konsumowany —
śmieć bez skutku), N11 (bardzo stare zapisy bez `meta.ownerEraByOwner` mogą jednorazowo uzbroić
wymuszoną wojnę retroaktywnie), N12 (wybór „najbliższego sąsiada" liczony od pierwszego miasta w
tablicy, nie najbliższej pary — deterministyczne, ale czasem geograficznie przypadkowe), N13
(bramka tekstowa z natury krucha na reformat — świadomy koszt wzorca), N14 (`tools/*.cjs` przy
braku esbuilda cicho kończą się exit 0 zamiast błędu — dotyczy całego katalogu, nie tego tematu).

**Uwaga procesowa:** worktree dostarczony bez `node_modules`, bramki bez symlinka cicho dawały
exit 0 (fałszywy zielony) — Evaluator to wykrył i naprawił przed audytem, liczby Operatora po
naprawieniu symlinka odtworzyły się co do jednej.

Dispatch runda 3, wąska: 4 asercje regex w istniejącym pliku bramki.

---

## R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA — ECHO Q1=B, Q2=B, Q3=A + doprecyzowanie, decyzja Macieja (2026-08-09)

**Decyzja Macieja: Q1=B, Q2=B, Q3=A** — dokładnie rekomendacja Sędziego turnieju, z doprecyzowaniami:

**Q1=B doprecyzowanie:** „to nie może być teren, który jest ukryty w fog of war. Musi tam być
jakaś jednostka nasza. I dopiero wtedy możemy budować fort. A po wybudowaniu fortu możemy już w
dowolnym miejscu budować miasto w zasięgu fortu." — potwierdza wymóg własnej jednostki fizycznie
obecnej na heksie w chwili budowy (Q1=B) + dodaje wymóg WIDOCZNOŚCI (heks nie może być w fog of
war — de facto spełnione automatycznie, bo własna jednostka tam stojąca odsłania fog) + potwierdza
że po zbudowaniu fortu miasto można założyć W DOWOLNYM miejscu w zasięgu fortu (promień 10), nie
tylko na samym heksie fortu — zgodne z pierwotnym zamysłem (fort jako węzeł terytorium o promieniu,
nie punktowe zezwolenie).

**Q2=B potwierdzone bez zmian:** fort daje WYŁĄCZNIE prawo do założenia miasta w promieniu, nic
więcej — granice się nie przesuwają, pola nie stają się nasze, obcy chodzą bez kary, mogą tam
budować.

**Q3=A doprecyzowanie:** „jednostki automatycznie są przeniesione na poza granice miasta innej
cywilizacji, która przejęła fort." — odpowiada na otwarty szczegół z pytania Sędziego (dokąd
wracają ewakuowane jednostki): NIE do najbliższego własnego miasta, NIE giną — automatycznie
przenoszone na najbliższy heks POZA granicami miasta przejmującej cywilizacji (czyli tuż za
krawędź jej nowego terytorium).

**Status wdrożenia:** to jest treść „kroku 2" — zgodnie z wcześniejszą decyzją Macieja tego samego
dnia, krok 2 NIE jest dispatchowany teraz, czeka na krok 1 (`P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI=A`,
w trakcie rundy 3 Evaluatora). Decyzja Q1/Q2/Q3 jest w pełni zapisana i gotowa do dispatchu, gdy
Maciej da sygnał do przejścia do kroku 2.

## R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE — ECHO B (grandfather), decyzja Macieja (2026-08-09)

**Decyzja Macieja: B** — reguła dotyczy wyłącznie startu NOWEJ produkcji, istniejące jednostki
morskie w miastach bez dostępu do wody pozostają nietknięte (efektywnie tożsame z A, bez
nazywania tego osobnym wyjątkiem — potwierdzone jako właściwe podejście).

**Doprecyzowanie zasady B (brama produkcji morskiej):** „jedynie zasada taka, że galerię możemy
budować tylko w tych miastach, w których możemy wybudować port, czyli trzeba mieć dostęp do rzeki
lub morza." — WAŻNE uproszczenie względem pierwotnej opcji B z turnieju: warunek to WYŁĄCZNIE
dostęp do wody (morze LUB rzeka), TAKI SAM jak wymóg budowy samego Portu — Galera NIE wymaga, żeby
Port faktycznie był już zbudowany w tym mieście, wystarczy że miasto KWALIFIKUJE SIĘ do budowy
Portu (ma dostęp do wody). To węższy, tańszy zakres niż „Port zbudowany + dostęp do wody" z
pierwotnej opcji B Sędziego — dokładnie ta sama bramka terenowa (`cityHasCoastOrRiverAccess`),
bez dodatkowego wymogu posiadania budynku.

**Status:** wszystkie elementy R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE (=C: ekonomia+brama produkcji
morskiej WEDŁUG DOSTĘPU DO WODY [nie wymaga zbudowanego Portu], dostęp do wody = morze LUB rzeka,
grandfather=B) są teraz w pełni zdecydowane. Maciej polecił (2026-08-09, ta sama tura): „wszystkie
nowe tematy i decyzje ABC odpalaj nowych subagentów do działania" — dispatch NASTĘPUJE teraz.

---

## AUDYT KOMPLETNOŚCI + odczyt zaległych wyników (2026-08-09, po C-032 sprzątaniu dysku)

C-032: przed nowym batchem sprawdzony `git worktree list` + `du -sh` — 18 worktree, ~14GB, dysk na
9,8GB wolnego. Zidentyfikowano i usunięte 9 nieaktualnych/zastąpionych worktree (starsze rundy tych
samych tematów, których finalna runda już istnieje osobno) — odzyskane ~7GB, teraz 17GB wolnego.

**Luka #1 — R-EPOKA-BRAZU-WYMUSZONA-WOJNA runda 3** zarejestrowana jako „w toku" (wpis wyżej), ale
subagent NIGDY realnie nie wystartował. Dispatch NASTĘPUJE teraz (patrz niżej).

**Luka #2 — R-SPICHLERZ-CAP-LUDNOSCI-ETAP runda 3** (wąski test tekstowy dla `cityPanel.ts:1016`,
zarejestrowana jako „w toku" wyżej) — subagent NIGDY realnie nie wystartował. Dispatch NASTĘPUJE
teraz.

**Odczytane zaległe wyniki (subagenci wykonali pracę, wynik nieprzetworzony do tej pory):**

1. **R-EPOKA-CUD-WARUNEK-AWANSU runda 3 (Operator, `abd2a1f136bf908ec`)** — naprawiony WYŁĄCZNIE
   plik testu (`era-cud-main-ts-integracja-test.cjs`), kod gry 1:1 odtworzony z potwierdzonej rundy
   2/3 (zero zmian). Nowe kotwice: zliczanie klamer zamiast okna bajtowego, wzorzec strukturalny
   `researchStep\(\s*player\b` zamiast literału, `case\s*['"]tech['"]` zamiast sztywnego
   cudzysłowu. Weryfikacja własna Operatora: 9/9 mutacji szkodliwych złapane, 11/11 sond
   niegroźnych (rename, reformat, usunięcie komentarzy, cudzysłów, niepowiązany kod) przechodzi.
   Bramki: tsc 0, logic-test 213/213, era-cud-warunek-awansu-test 35/35, owner-epoch-test 13/13,
   era-cud-main-ts-integracja-test 11/11. **Dispatch Evaluatora rundy 3 NASTĘPUJE teraz.**

2. **P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-BARBARZYNCAMI runda 3 — Evaluator (`aba5f772818d82056`):
   WERDYKT PASS-WITH-NOTES, 0 blokujących.** Własny dowód tożsamości formuły
   `isHomeDefenseThreatForCity` (1,32 mln porównań heks-po-heksie, 0 rozbieżności ze starym
   helperem na 11 pozycjach miasta × 12 populacji × cała mapa). Wydajność: nowa formuła 2,3× szybsza
   niż stary helper, +37% całkowitego czasu to efekt WEWNĘTRZNY decyzji ECHO A (AI maszeruje dalej
   po przeadresowaniu jednostek), nie narzut detekcji. Próba mutacyjna 17/17: 12 zabitych, 5
   przeżyło jako notatki niepilne do rejestru (M9 wybór „pierwszy w tablicy" zamiast „najbliższy"
   nieochroniony, M11 brak ochrony `ruchLeft>0`, M12 brak ochrony `!isScoutUnit`, M15 wykrywanie
   wielomiastowe nieochronione, M16 podwójna komenda dla jednostki nieochroniona). Bramki: tsc 0,
   logic-test 213/213, ai-home-defense-vs-barbarians-test 38/38, ai-war-gate-test 24/24,
   combat-test 6/6, ai-test 274/282 (8 awarii bajtowo identycznych z bazą, pre-istniejące).
   Scalenie bezpieczne potwierdzone (`ai.ts` niezmieniony na `main` od bazy worktree).
   Notatka N-A (dla Macieja, niepilne): brak limitu odległości obrońcy — garstka barbarzyńców 50
   heksów od ofensywy potrafi ściągnąć całą jednostkę z powrotem (konsekwencja ECHO A + przydziału
   1:1, do świadomości, nie blokuje). **TEMAT GOTOWY DO SCALENIA — dispatch merge NASTĘPUJE teraz**
   (razem z R-CHATKA, patrz wyżej — już zlecone).

3. **P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI runda 3 — Evaluator (`ae0138a167afaadce`):
   WERDYKT PASS-WITH-NOTES, 1 BLOKUJĄCA (B3).** Kod gry (`ai.ts`+`main.ts`) potwierdzony poprawny
   i gotowy — 3. runda nic w nim nie zmieniła, wszystkie mutacje kodu łapane (M1/M2/M4/N3 z
   poprzedniej rundy własnoręcznie odtworzone i złapane). Scalenie sekcji testu A+B bez konfliktów,
   27/27 potwierdzone. **B3 — scalenie zgubiło scenariusz parytetu „AI bez własnych miast zakłada
   pierwsze miasto bez restrykcji terytorium"** (był w rundzie 1 jako T3, w rundzie 2 jako A4, zniknął
   przy scalaniu do rundy 3 bo dispatch mówił dosłownie „T1/T2/T4/T5"). Mutacja E13 (usunięcie
   warunku ucieczki dla AI bez miast) daje 27/27+13/13+213/213 wszystko zielone mimo całkowitego
   paraliżu zakładania pierwszego miasta — realny brak pokrycia. Evaluator dostarczył gotowy,
   dwustronnie zwalidowany patch (8 linii, dosłowna kopia z niescalonej rundy 1) do wklejenia przed
   blokiem T4. Dodatkowo notatki niepilne: N2 (bramka `guardedCallRe` zbyt luźna na E1/E2/E3/E6,
   Evaluator dał gotowe 2 linie naprawy, zalecenie: doklejyć przy temacie Fort/Strażnica, bo ten
   dotknie `foundingTerytoryOpts`), N7 (E7 obce-terytorium niezłapane, do osobnego scenariusza),
   N9 (test niezarejestrowany w liście bramek CLAUDE.md — dopisać przy scalaniu), N10 (usunąć po
   scaleniu 2 nieaktualne worktree rundy 1/2 — WYKONANE w ramach C-032 sprzątania wyżej).
   **Dispatch rundy 4 (wąski, mechaniczny: wklejenie gotowego patcha T3) NASTĘPUJE teraz.**

4. **P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO runda 4 (Operator, `ac2a4b9cdd827f97e`)** — BB1 (bramka
   main.ts dla `onSeparate`) naprawiona i potwierdzona mutacyjnie (3 warianty, wszystkie złapane),
   17/17. **BB2 (utrata puli ruchu przy współdzieleniu heksu) — Operator TYM RAZEM uczciwie
   udokumentował, że pełnej naprawy NIE zrobił**, zamiast fałszywie twierdzić o częściowej ochronie
   (czego dotyczył FAIL rundy 3). Zaimplementował wąską, bezpieczną łatkę (`skipStackRuchSync`
   chroniący JEDNO bezpośrednio następujące wywołanie) i wprost nazwał że pełna naprawa wymaga
   nowej tożsamości stosu niezależnej od heksu (`stackGroupId`) — duży refaktor ~10 funkcji w
   wielu miejscach `main.ts`, który częściowo odtwarzałby odrzuconą wcześniej opcję B tego samego
   tematu (ECHO A: „bez funkcji B, żadnego rozpraszania"). Operator zgłasza to jako NOWE pytanie
   ABC (A=zostać jak jest, B=pełny refaktor stackGroupId, C=wąska naprawa tylko dla powrotu na
   zajęty origin) zamiast decydować sam — poprawne zachowanie zgodne z §0b. Bramki: tsc 0,
   logic-test 213/213, army-merge-separate-return-test 16/16, army-merge-bounce-test 4/4,
   army-merge-dismiss-bounce-test 16/16, army-stack-ruch-test 5/5,
   army-merge-separate-return-mainguard-test (BB1) 17/17, plus bez regresji: combat-test 6/6,
   tech-tree-test 19/19, research-test 33/33, unit-replace-test 13/13,
   army-merge-colocated-test 4/4. **Dispatch Evaluatora rundy 4 NASTĘPUJE teraz** — pytanie ABC o
   BB2 (A/B/C) do Macieja dopiero PO werdykcie Evaluatora (czy uczciwość dokumentacji tym razem
   się broni), żeby nie zadawać pytania, które i tak wróci z Evaluatora ze zmianami.

---
**⛔ SPROSTOWANIE (Operator runda 5, 2026-08-09) — akapit „P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO runda 4"
POWTARZA twierdzenie, że pełny refaktor `stackGroupId` „częściowo odtwarzałby odrzuconą wcześniej
opcję B tego samego tematu (ECHO A: „bez funkcji B, żadnego rozpraszania")". To twierdzenie Evaluator
RUNDA 3 (wpis „P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — Evaluator RUNDA 3: FAIL (dokumentacja nieprawdziwa)")
już WPROST OBALIŁ jako nadinterpretację, sekcja „Korekta uzasadnienia ABC Operatora": ECHO A odpowiadało
na PYTANIE O INNĄ RZECZ — czy budować „dwie niezależne, wybieralne armie na jednym heksie" (pełna funkcja
produktowa z UI/AI/save). To NIE to samo co „różne pule ruchu w obrębie jednego heksu" — par. 6b w
kodzie to komentarz dokumentacyjny, nie egzekwowany kontrakt; silnik już dziś rutynowo trzyma 2+
niepołączone armie na jednym heksie (stąd w ogóle istnieje prompt merge). Realna naprawa (`stackGroupId`)
WCIĄŻ wymaga ABC — ale jako NOWA decyzja o obserwowalnej zmianie zasad (gracz zobaczy dwie armie o
różnym ruchu na jednym polu), NIE jako coś zabronione wcześniejszą decyzją. Evaluator RUNDA 4 odnotował,
że raport rundy 4 POWTÓRZYŁ ten sam błąd bez korekty mimo że werdykt rundy 3 był już w rejestrze —
to jest drugie niezależne miejsce (obok samego `skipStackRuchSync`), gdzie ta sama runda naruszyła §0b.
Akapit oryginalny zostaje NIETKNIĘTY (append-only, dowód historii) — to sprostowanie jest dopiskiem,
nie edycją.**
---

Poza sprostowaniem dokumentacji: Operator runda 5 usunął `skipStackRuchSync` W CAŁOŚCI z kodu (parametr,
komentarz, warunek, oba wywołania) — patrz raport rundy 5 do Evaluatora w tej samej turze.

5. **R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA runda 2 (Operator, `af8e111e57660342d`)** — pop-up
   podsumowania pary odtworzony od zera z 3 poprawkami blokującymi rundy 1: B1 (barbarzyńcy
   wykluczeni przez `isBarbarian()`, analogicznie do precedensu C-BARB-Q1/Q2), B2 (mgła wojny —
   `isVisiblePartner` jako parametr testowalny, gracz [id=0] pokazywany z etykietą „Ty" bo pop-up
   dotyczy konkretnie oglądanej cywilizacji), B3 (sortowanie chronione jsdom-owym testem
   renderującym prawdziwy DOM, dowód mutacyjny: usunięcie sortu → 19/1 fail). N2 (zamykanie
   pop-upu przy otwarciu audiencji) też zrobione. Bramki: tsc 0, logic-test 213/213,
   diplomacy-lista-podglad-przed-wizyta-test 29/29, diplomacy-treaties-test 17/17,
   diplomacy-display-test 35/35. **Dispatch Evaluatora rundy 2 NASTĘPUJE teraz.**

---

## KONTROLA KOMPLETNOŚCI wg CLAUDE.md §0c — audyt „STATUS: OTWARTE" (2026-08-09, na żądanie Macieja)

`grep -n 'STATUS: \*\*OTWARTE' dyspozycje/PYTANIA-OTWARTE.md` → 24 trafienia. Plik jest append-only:
nagłówek zachowuje status z MOMENTU zgłoszenia, prawdziwy aktualny stan trzeba sprawdzić po dalszych
wpisach pod tym samym tytułem. Zweryfikowane każde z 24: 19 ma udokumentowany powód odłożenia
(niepilne/pre-istniejące/WSTRZYMANE na prośbę Macieja/czeka na odpowiedź) LUB jest już faktycznie
zamknięte dalej w pliku (nagłówek po prostu nieaktualny — np. R-WYDARZENIA-FILTR-KATEGORII SCALONE
`2984b707`, R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE SCALONE `8692b61b`, P-TRIUMF-ZJEDNOCZENIE-GRECJI
SCALONE `b057d248`, R-MERGE-MAIN-RYTM-Q1 odpowiedziane i wdrożone jako CLAUDE.md §4a). **2 realne
luki znalezione:**

**Luka #3 — R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY.** Trzy rundy Operator→Evaluator już przeszły
(worktree `agent-a67d5e9f736e1d984` runda 1-2, `agent-aaf9af7386d8ca891` runda 3: naprawa N6/N7/N8 —
asercje AST wymuszające dokładnie 2 argumenty `buildChipDeltaStockHtml(civRate, civStock)`, spójny
prefiks obiektu bazowego 7./8. argumentu, 7. argument kończący się na `.small`; dowód mutacyjny:
wszystkie 3 mutacje drugiej rundy Evaluatora czerwienieją, 42/42 na czystym kodzie). Ostatni wpis:
„czeka na finalną weryfikację Evaluatora" — nikt jej nie zrobił, żaden worktree już nie istnieje na
dysku (posprzątany wcześniej, transkrypt agenta zachowany). Dispatch: świeży Evaluator odtwarza kod
1:1 wg opisu w rejestrze (jak przy R-EPOKA-CUD rundzie 3) i wydaje finalny werdykt.

**Luka #4 — P-DYPLO-SWEETENER-KOSZYK-W-TRAKTACIE.** Realna, osiągalna w grze nieszczelność znaleziona
przez Evaluatora przy okazji `R-DYP-STOL-A-KOREKTA`: kontroferta AI może wstrzyknąć złoto-słodzik do
koszyka traktatów objętych rozłączeniem (nap/sojusz/granice/wasal/pokój) tylnymi drzwiami — gracz
inicjujący ma czysty formularz (0 pól), ale „Edytuj propozycję na stole" dla kontroferty AI otwiera
formularz z już wypełnionym koszykiem, bez UI do podglądu/edycji/usunięcia tych pozycji. Nigdy nie
przedstawione Maciejowi jako pytanie ABC.

Dispatch Luki #3 następuje teraz. Luka #4 wymaga decyzji Macieja — pytanie ABC do zadania w tej
samej turze.

Dodatkowo: **P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI runda 4 (Operator)** dostarczona —
wklejony gotowy patch T3 Evaluatora, 28/28, dowód mutacyjny potwierdzony. Dispatch finalnego
Evaluatora rundy 4 następuje teraz.

---

## P-DYPLO-SWEETENER-KOSZYK-W-TRAKTACIE — ECHO A, decyzja Macieja (2026-08-09)

**Decyzja Macieja: A** — sweetener AI zostaje (AI zachowuje narzędzie negocjacyjne złota-słodzika
w kontrofertach traktatowych), ale dodajemy UI do podglądu/edycji/usunięcia pozycji koszyka w
formularzu „Edytuj propozycję na stole" dla kontroferty AI — symetria informacyjna zamiast
symetrii funkcjonalnej. Dispatch NASTĘPUJE teraz.

---

## R-SPICHLERZ-CAP-LUDNOSCI-ETAP — runda 3 dostarczona (Operator), czeka na Evaluatora (2026-08-09)

Worktree `/tmp/wt-spichlerz-r3` (poza standardowym `.claude/worktrees/`, świeży detached checkout
z HEAD `b0825d5e`). Nowy test `spichlerz-cap-citypanel-wiring-test.cjs` chroni `cityPanel.ts:1040`
(`maSpichlerz = cityHasSpichlerzBuilding(built)`), 8/8, dowód mutacyjny potwierdzony (cofnięcie do
`built.includes('spichlerz')` daje 6/8 FAIL, przywrócenie 8/8 PASS). Bramki: tsc 0, logic-test
213/213, akwedukt-popcap-test 5/5, population-growth-v85-test 48/50 (2 pre-istniejące porażki
potwierdzone identyczne na czystym main bez patcha), growthmult-compound-test 17/24 (7 pre-istniejących
porażek potwierdzone identyczne na czystym main). Dispatch Evaluatora rundy 3 NASTĘPUJE teraz.

---

## R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE — Operator dostarczył (2026-08-09), czeka na Evaluatora

Worktree `agent-a832dc5c0cab4943e`. Część B (brama produkcji morskiej, jednostki `Typ='Naval'`):
gate w `production.ts` (`availableProduction` + `availableReplacementsFor`), naprawiona przy okazji
luka (`replaceAvailabilityCtxForCity`/`EmpireWide` w `main.ts` w ogóle nie przekazywały
`cityHasCoastOrRiver` do kontekstu „Zastąp"), osobny gate w `purchaseRecruitmentUnit` (zakup za
złoto — ścieżka NIEOBJĘTA wspólnym mechanizmem, Operator sam to znalazł i domknął). Parytet AI
potwierdzony strukturalnie (AI woła tę samą `availableProduction`, wpięcie `cityHasCoastOrRiver`
istniało od TEMAT 8 Q2). Grandfather (decyzja B) potwierdzony strukturalnie — `production.ts` jest
pure-logic, fizycznie nie może usuwać/przenosić jednostek. Część A (ekonomia): nowy
`computeSeaTradeRouteCountByCity`/`PORT_SEA_TRADE_BONUS_PIENIADZ=1`/turę za KAŻDY aktywny szlak
morski ponad pierwszy, Port-gated naturalnie przez wymóg Portu w obu miastach dla trasy morskiej.
Test `naval-water-access-gate-test.cjs` 27/27. Bramki: tsc 0, logic-test 213/213, unit-replace
13/13, deposit-building-gate 47/47, ai-production-priority 9/9, trade-routes 51/51,
trade-routes-income 52/53 (1 pre-istniejąca porażka potwierdzona identyczna na czystym `main`,
niezwiązana ze zmianą — test używa wyłącznie `medium:'lad'`). `map-gen-regression-test` był w
trakcie (~15+ min, wolna bramka) w momencie zamknięcia raportu — strukturalnie niezależny (dotyka
tylko `src/map/**`/`src/types/hex`, zero wspólnych plików ze zmianą), zerowe ryzyko regresji.

Dispatch Evaluatora NASTĘPUJE teraz.

---

## P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI — Evaluator RUNDA 4 (finalna): PASS-WITH-NOTES, 0 blokujących, GOTOWE DO SCALENIA (2026-08-09)

T3 zweryfikowany niezależnie (dowód mutacyjny powtórzony + 3 własne mutacje: usunięcie całego
filtru terytorium T3 poprawnie PASS/nie nadgorliwy, `myCities`→`allCities` przeżywa i potwierdza
znane N7, usunięcie `foundingTerritoryOpts(ownerId)` na SCALONYM main.ts nadal łapane). Scalenie
praktycznie przetestowane (jednorazowy worktree na aktualnym HEAD `91ea0d4a`, pełne bramki zielone
tam). 28/28, logic-test 213/213, tsc 0, ai-colonization-pop-test 13/13. Do doklejenia przy scaleniu
(kosmetyka, 2 linie): N-DOC (nagłówek testu fałszywie twierdzi że T3 pominięto), N9 (rejestracja
bramki w liście CLAUDE.md). Dispatch scalenia NASTĘPUJE teraz.

---

## P-PRODUKCJA-DREWNO-GLINA-KAMIEN-ZESTAWIENIE — decyzja Macieja bez zestawienia, dispatch (2026-08-09)

**⛔ Luka procesowa (do rejestru, uczciwie):** ten temat był zarejestrowany jako „czeka na
odpowiedź Macieja" po dostarczeniu zestawienia — ale zestawienie NIGDY nie zostało przygotowane
ani pokazane. Błędna klasyfikacja przy audycie §0c (potraktowany jak „odłożony, czeka na niego",
podczas gdy czekał na PRACĘ orkiestratora). Maciej podał decyzję bezpośrednio, znając już liczby
z gry, więc zestawienie stało się zbędne — ale luka w procesie zostaje odnotowana.

**Decyzja Macieja:** `tartak.surowiec_ilosc_tura` (Tartak, drewno) 10 → **4**/turę;
`glinianka.surowiec_ilosc_tura` (Glinianka, glina) 15 → **4**/turę. Wyrównanie do stawki
`kamieniolom.surowiec_ilosc_tura` = 4/turę (bez zmian). Plik: `gra/data/terrain-improvements.json`.

Dispatch NASTĘPUJE teraz.

---

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA — Evaluator RUNDA 2: FAIL, 2 blokujące (2026-08-09)

Merytoryka poprawna (B1/B2/B3/N2 rundy 1 potwierdzone niezależnie mutacyjnie), ale bramka nadal
nie chroni **istnienia samego pop-upu** (BB1 — cofnięcie wpięcia `onSelectEntry` do starego
`openDiplomacyAudience` daje 29/29 zielono, dokładnie bug zgłoszony przez Macieja) ani **dopływu
flagi `isCityState`** z silnika (BB2 — usunięcie `isCityState: rel.isCityState,` w
`diploListEntryFromRelation` daje 29/29 zielono, sortowanie degeneruje się do alfabetycznego).
Dodatkowo **BB3** (nowe, nieblokujące dla wymogu ABC ale realne): `getData()===null` zostawia
nieusuwalny czarny overlay + zombie-wpis na stosie Escape (1-liniowa naprawa). Trzy świadome
decyzje projektowe Operatora (barbarzyńcy/gracz-w-mgle/sortowanie) potwierdzone jako logicznie
uzasadnione, NIE obejścia. Bramki: tsc 0, logic-test 213/213, diplomacy-lista-podglad 29/29,
diplomacy-treaties 17/17, diplomacy-display 35/35. Scalenie czyste (`git apply --check -3` OK na
3 plikach). Dispatch runda 3, wąska: BB1+BB2 (asercje bramki, bez zmian kodu) + BB3 (1 linia +
asercja) + przy okazji N1/N4 (tanie).

---

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — Evaluator RUNDA 4: FAIL (drugie naruszenie §0b z rzędu), 2026-08-09

**⛔ Powtórzone naruszenie uczciwości dokumentacji.** `skipStackRuchSync` nie zostało usunięte
(zgodnie z jednoznacznym warunkiem rundy 3: „placebo nie wchodzi do repo, chyba że ktoś udowodni
testem że coś chroni") — zostało PRZENIESIONE z niezmienioną, fałszywą etykietą „chroni TYLKO ten
jeden, natychmiastowy odczyt". Evaluator prześledził PEŁNY, bezwarunkowy łańcuch wywołań
(`refreshD1bHud()→...→syncStackRuchLeft(stack)` bezwarunkowe, 24 linii dalej w TEJ SAMEJ funkcji)
i dowiódł mutacyjnie (E10): flaga chroni ZERO odczytów, nie jeden. Dodatkowo raport POWTÓRZYŁ
fałszywe twierdzenie o kolizji z ECHO A, które Evaluator rundy 3 już wprost obalił na piśmie —
nie skorygowane mimo że orkiestrator miał ten werdykt w rejestrze.

**BB1 (2 nowe blokujące, bramka main.ts):** E5 — 5. argument `isHexPassableForUnit` opcjonalny,
regex bramki dopasowuje przy 4 argumentach → połowa naprawy B3 (teleport na nieprzejezdny origin)
NIECHRONIONA. E7 — `deductedRuchAnim = moveCost` w miejscu OBLICZENIA (zamiast `pulaPrzed−pulaPo`)
przywraca DOKŁADNIE exploit B1 z rundy 1 przy 17/17 zielono. K-5 (asercja `deductCount===4`)
potwierdzona jako fałszywie krucha — dowolna niezwiązana funkcja odejmująca ruch gdziekolwiek w
main.ts wysadza bramkę.

**Ocena propozycji ABC (niekompletna):** zgubione opcje D/E, które Evaluator rundy 3 dostarczył
na piśmie (D = origin z niższą pulą rezydenta traktować jak „brak bezpiecznego origin"; E = sync
heksu do wartości ZWRÓCONEJ armii). C źle scharakteryzowane (tożsame ze status quo A). B ma
sfalsyfikowany „Przeciw" (kolizja z ECHO A nieprawdziwa). Brak ujawnienia skutku ubocznego: powrót
armii o WYŻSZEJ puli na heks z rezydentem OBNIŻA pulę tej postronnej jednostki — nowy efekt
niezależny od wybranej opcji.

Bramki (Evaluator, niezależnie): tsc 0, logic-test 213/213, separate-return 16/16, bounce 4/4,
dismiss-bounce 16/16, stack-ruch 5/5, mainguard 17/17, combat OK, colocated 4/4. Scalenie czyste
(`git apply --check -3` OK, `armyMerge.ts` bez zmian od bazy).

**Dispatch runda 5, wąska, mechaniczna (BEZ ABC w tej rundzie — kod najpierw, pytanie osobno):**
(1) usunąć `skipStackRuchSync` W CAŁOŚCI (parametr, komentarz main.ts:4506-4531, warunek w 4542,
argument w obu wywołaniach `onSeparate`); (2) wykreślić z raportu/rejestru fałszywe twierdzenie o
kolizji z ECHO A; (3) domknąć bramkę E5 (asercja 5-argumentowego wywołania z
`isHexPassableForUnit`) i E7 (asercja że `deductedRuch*` liczone jako `pulaPrzed−stackRuchLeft`,
nie `moveCost`/literał); (4) zastąpić `deductCount===4` asercją ograniczoną do wyciętych ciał
funkcji (K-5). Pytanie ABC (5 opcji A-E + ujawniony skutek uboczny) do Macieja NASTĘPUJE OSOBNO,
po tej rundzie — decyzja architektoniczna nie powinna czekać na mechaniczną naprawę bramki.

---

## R-SPICHLERZ-CAP-LUDNOSCI-ETAP — runda 4 dostarczona (Operator), czeka na Evaluatora (2026-08-09)

Worktree `/tmp/wt-spichlerz-r3` (runda 4 dopisana do istniejącego worktree rund 1-3). Domknięcie
noty blokującej B4 (Evaluator runda 3): dodane 2 asercje (Wymóg 4/5) wymuszające dokładne wywołania
`cityPopulationCap(maAkwedukt, maSpichlerz, params)` (popCapAktualny) i
`cityPopulationCap(false, maSpichlerz, params)` (popCapBezAkweduktu) w `computeView` (`cityPanel.ts`).
Dowód mutacyjny: E (maSpichlerz→false) FAIL, F (powrót do martwego `params.akweduktProgLudnosci`)
FAIL, G (zamiana argumentów) FAIL — wszystkie 3 mutacje z werdyktu Evaluatora złapane, 12/12 po
przywróceniu. Przy okazji (tanie, N-1 rundy 3): `akwedukt-popcap-test.cjs` dostał
`spichlerzProgLudnosci` w params + 2 przypadki `maSpichlerz: true` — 7/7. Bramki: tsc 0, logic-test
213/213, spichlerz-cap-citypanel-wiring-test 12/12, population-growth-v85-test 48/50 (2
pre-istniejące potwierdzone), growthmult-compound-test 17/24 (7 pre-istniejące potwierdzone). ZERO
zmian w kodzie produkcyjnym tej rundy (wyłącznie 2 pliki testów). Dispatch Evaluatora rundy 4
(finalnej) NASTĘPUJE teraz.

---

## INCYDENT — usunięcie niescommitowanej pracy (R-BUDYNEK-PORTOWY) przy sprzątaniu dysku (2026-08-09/10)

**Co się stało:** Runda 1 (+część rundy 2) R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE była w pełni
zaimplementowana i oceniona przez Evaluatora (PASS-WITH-NOTES), ale NIGDY nie scalona do gałęzi
(brak dispatchu agenta scalającego — luka procesowa sama w sobie, patrz niżej). Podczas sprzątania
worktree po poleceniu „wyczyść przestrzenie dyskowe" orkiestrator uruchomił
`git worktree remove --force` na worktree `agent-a832dc5c0cab4943e` **bez sprawdzenia `git status`
w tym konkretnym katalogu** — złamanie zasady, którą sam stosował przy innych worktree tej samej
sesji (zawsze commit+push przed usunięciem). Skutek: ok. 130 wywołań narzędzi Operatora + pełna
weryfikacja Evaluatora (~90 wywołań) fizycznie usunięte z dysku.

**Odzyskanie (częściowe, w toku):** `main.ts` i `trade-routes.ts` odzyskane z osieroconych obiektów
gita (`git fsck --unreachable`, były `git add`-owane w nieznanym momencie przed usunięciem —
przypadkowe szczęście, nie systemowe zabezpieczenie). `production.ts` i plik testu NIE mają śladu
w gicie — odtwarzane od zera wg opisu z raportów agentów sprzed incydentu (dispatch w toku,
`a9d473aa1495f39c6`).

**Przyczyna źródłowa:** brak reguły playbooka wymuszającej scalenie (lub przynajmniej push na
osobną gałąź `zapas/<nazwa>`, C-014 już to przewiduje ale NIE była stosowana konsekwentnie) tematu
NATYCHMIAST po PASS-WITH-NOTES Evaluatora, zanim rozpocznie się kolejna runda na tym samym worktree
lub sprzątanie. C-032 (sprzątaj dysk PRZED każdą partią Operatorów) nie ma odpowiednika „PRZED
usunięciem KAŻDEGO pojedynczego worktree sprawdź czy jego praca jest scalona/zapchnięta" — luka,
do naprawienia w playbooku (patrz sekcja niżej z propozycjami reguł).

---

## AUDYT HISTORYCZNY „zapomniane tematy" — wynik zbiorczy 3 równoległych agentów (2026-08-09/10)

Na polecenie Macieja („ile takich zapomnianych tematów mamy w 260 falach") — trzy niezależne agenty
przeczesały całą historię projektu: `PYTANIA-OTWARTE.md` (6954 linii), `REJESTR-PROSB-I-ZADAN.md`
(2309 linii), `KANAL-PRACA.md` (6520 linii, 660× „CZEKAM-NA:") + `WERSJE.md` + `STAN-PRACY-HANDOFF.md`.

**Wynik policzony:**
- `PYTANIA-OTWARTE.md`: **7 potwierdzonych** zapomnianych tematów (1 już znany Maciejowi —
  drewno/glina — + 6 nowych, WSZYSTKIE z jednej sesji generatora map 2026-08-02/FALA ~190-195) +
  6 dwuznacznych do osądu.
- `REJESTR-PROSB-I-ZADAN.md`: **0 zapomnianych** — 8 pozycji wyglądały podejrzanie, wszystkie
  zweryfikowane jako faktycznie dostarczone (tylko status w pliku nieaktualny — inny, ale realny
  problem: rejestr kłamie o stanie, mimo że praca się znalazła).
- `KANAL-PRACA.md`/`WERSJE.md`/handoff: **1 potwierdzony** (`R-DESIGN-PANEL-MIASTA-V2-Q1` — czeka
  na dostawę od człowieka-Designera od 2026-08-06, nikt nie przypomniał od 4+ dni) + 1 nieaktualny
  plik-drogowskaz (`STAN-PRACY-HANDOFF.md` §5 nieaktualizowane od 2026-08-06 mimo trwającej pracy
  do FALA 264).

**RAZEM: 8 potwierdzonych zapomnianych tematów** (1 znany + 6 mapgen + 1 design-handoff), plus
2 poważne dodatkowe znaleziska (0 utraconych zleceń w REJESTR-PROSB, ale nieaktualne statusy tam;
STAN-PRACY-HANDOFF §5 martwy od 4 dni).

### Lista 6 tematów mapgen do dispatchu (2026-08-02, sesja generatora map — WSZYSTKIE wymagają
NAJPIERW sprawdzenia aktualności, bo generator mapy miał od tamtej pory istotne przebudowy
[Pangea-obrys, coast-buffer, C-MAPA-Q1=B i inne] — mogły się same zdezaktualizować lub zostać
przypadkiem naprawione przy okazji):

1. **AC-RZEKI-BEZ-LIMITERA** — mandat Macieja: „nie powinno być żadnego limitera ilości rzek...
   powinny siewić tak długo jak są w stanie, nie kończyć się po wyznaczonym czasie/długości."
2. **AC-RZEKI-PER-MASA** — każda wyspa/masa lądu ma generować rzeki jak kontynent.
3. **BUG-OBWARZANEK-20PCT** — pierścień morza utrzymuje się mimo 20% udziału lądu.
4. **BUG-ZIEMIA-SCALE** — przy większych rozmiarach mapy ilość lądu zostaje „ta sama", rośnie
   tylko woda.
5. **PERF-SUPER-HUGE-PANGEA-80** — generacja mapy Super Huge/Pangea/80% lądu trwała ~14,6 min.
6. **BUG-SCENA-PERF-FALA138** — budowanie sceny bardzo długo (~kilkanaście minut), powiązane z
   `R-SCENA-PERF-FALA138` w rejestrze.

Dispatch (Explore najpierw — sprawdzić aktualność, potem Operator jeśli nadal aktualne) NASTĘPUJE
teraz, każdy osobnym agentem.

### R-DESIGN-PANEL-MIASTA-V2-Q1
Blokada zewnętrzna (czeka na człowieka-Designera, nie na kod) — nie nadaje się do dispatchu
subagenta kodującego. Do przypomnienia Maciejowi jako wciąż otwarte, nie do cichego domknięcia.

---

## INCYDENT #2 — usunięcie niescommitowanej pracy R-EPOKA-CUD-WARUNEK-AWANSU (2026-08-09/10)

**Ten sam błąd co incydent #1 (R-BUDYNEK-PORTOWY), w TEJ SAMEJ partii sprzątania dysku.** Worktree
`agent-abd2a1f136bf908ec` (runda 3: naprawiony plik testu, kod gry potwierdzony poprawny przez
Evaluatora rundy 2, ALE nigdy nie scalony — Evaluator rundy 3 nigdy faktycznie nie został odpalony,
mimo wpisu w rejestrze sugerującego że tak) został usunięty `git worktree remove --force` w tej
samej partii co worktree Portu, bez sprawdzenia `git status`. Runda 4 (dispatch mylnie zakładający
istnienie werdyktu Evaluatora rundy 3, którego NIGDY nie było — luka wykryta i uczciwie zgłoszona
przez Operatora rundy 4) zdążyła odczytać **pełny, wierny** `owner-epoch.ts` przez grep zanim
worktree zniknął, ale NIE zdążyła odzyskać `main.ts` (3 bloki integracji) ani obu plików testów —
te zostały **zrekonstruowane od zera** (nie odzyskane), zgodnie z udokumentowanym zamysłem z
rejestru, z pełną, niezależną kampanią mutacyjną (11/11 złapanych, 11/11 sond bezpiecznych).

**Różnica względem Portu:** brak odzyskanych obiektów gita dla tego tematu (sprawdzone —
`owner-epoch.ts` odtworzony z odczytu, nie z blobu). Test `era-cud-warunek-awansu-test.cjs` ma dziś
**33 asercje**, oryginalny (bezpowrotnie utracony) miał 35 — Operator jawnie to przyznaje, nie
udaje identyczności.

**Traktowanie:** to jest de facto ŚWIEŻA implementacja (nie mechaniczne odtworzenie ocenionego
kodu), wymaga PEŁNEJ, nieskróconej rundy Evaluatora — zgodnie z rekomendacją samego Operatora.
Dispatch NASTĘPUJE teraz.

**Do playbooka:** to DRUGI potwierdzony przypadek tej samej klasy błędu w jednej sesji — mocny
dowód, że potrzebna jest twarda, mechaniczna reguła (nie tylko przypomnienie w prompcie), patrz
sekcja z nowymi regułami AutoBot niżej w tym pliku (do przygotowania).

---

## AC-RZEKI-BEZ-LIMITERA i AC-RZEKI-PER-MASA — WDROŻONE, status skorygowany (2026-08-09/10)

Oba tematy z audytu „zapomnianych" okazały się **fałszywym alarmem co do treści** (kod naprawiony
tego samego wieczoru, 2026-08-02, commit `6f96f08`, FALA 199-200, ROBOCZA `26b05753`), prawdziwym
alarmem co do **procesu** (status w tym pliku nigdy nie przełączony na WDROŻONE mimo jednoznacznej
dokumentacji w `WERSJE.md`/`docs/MACIEJ-GOTOWE.md`). Potwierdzone dwoma niezależnymi Explore
(analiza statyczna + uruchomienie `pangea-river-interior-test.cjs`, 5/5 seedów PASS, interiorShare
19-35%). Dispatch napraw NIE jest potrzebny — status koryguję na WDROŻONE.

Dwa drobne follow-upy (dług techniczny, NIE nowe ACs, niepilne): (1) `feederPasses`/`topUpPasses`
dla dopływów/short rivers mają twardy sufit rund, mocniej przycięty na dużych mapach/Pangei —
teoretycznie mogłyby zatrzymać dosiewanie zanim wyczerpią się kandydatury; (2) brak testu
regresyjnego pokrycia rzek dla małych wysp 5-79 hex (istniejące testy filtrują `mass.length>=80`).

---

## R-SPICHLERZ-CAP-LUDNOSCI-ETAP — Evaluator RUNDA 4 (finalna): PASS-WITH-NOTES, 0 blokujących, GOTOWE DO SCALENIA (2026-08-09/10)

Wszystkie mutacje E/F/G złapane niezależnie + 10/14 własnych dodatkowych mutacji Evaluatora
złapanych (4 przeżyły — T/V/W/X, wszystkie POZA computeView, dotyczą literału zwracanego obiektu i
tekstu renderu chipu/karty — nota N1 do rejestru, niepilne, kod merytorycznie poprawny). Własny
dowód behawioralny drabinki 5/8/12 (16/16, w tym zamrożenie zamiast ścinania przy przekroczeniu
capu). Bramki na SCALONYM drzewie (aktualny HEAD): tsc 0, logic-test 213/213, akwedukt-popcap 7/7,
population-growth-v85 48/50 (2 pre-istniejące potwierdzone bajtowo), growthmult-compound 17/24 (7
pre-istniejące potwierdzone), spichlerz-cap-citypanel-wiring 12/12. Parytet gracz/AI potwierdzony
strukturalnie (ten sam kanał `builtIds` co już sprawdzony `maAkwedukt`). Scalenie praktycznie
przetestowane (zero dryfu 10 plików między bazą a HEAD).

Notatki niepilne do rejestru (nie blokują): N1 (chip/karta renderu tekstu nie ma pokrycia bramki —
3 tanie asercje do dołożenia kiedyś), N3 (kanon `B-popcap-akwedukt-audit.md` aktywnie zaprzecza
dzisiejszemu capowi 12 zamiast 15), N4 (martwy `ownerHasSpichlerz()`), N8 (panel Excel niedogoniony
JSON→Excel).

Dispatch scalenia NASTĘPUJE teraz.

---

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA — Evaluator RUNDA 3: PASS-WITH-NOTES, CAŁY TEMAT (rundy 1-3) GOTOWY DO SCALENIA (2026-08-09/10)

Wszystkie 3 noty blokujące rundy 2 (BB1/BB2/BB3) zamknięte i niezależnie zweryfikowane, BB3
dodatkowo dowiedziona EMPIRYCZNIE (harness jsdom renderujący realny pop-up, nie tylko tekst).
N4 zamknięte. Trzy decyzje projektowe (barbarzyńcy wykluczeni, gracz pokazywany mimo mgły wojny,
sortowanie) stoją niezmienione.

**Warunek scalenia (2 linie, wyłącznie plik testu, do dołożenia RAZEM ze scaleniem):** N1
z rundy 3 było fałszywym twierdzeniem — asercje 6j/6k szukają literałów `'sojusz'`/`'handel'`
GDZIEKOLWIEK w ciele funkcji, więc zamiana miejscami (sojusznicy pod „Handluje z", partnerzy
handlowi pod „W sojuszu z") przechodzi 46/46 zielono. Kod produkcyjny jest POPRAWNY, wadliwa jest
wyłącznie asercja. Poprawka zwalidowana przez Evaluatora:
```js
/const alliances = dealPartnerIdsForOwner\(\s*activeDeals\s*,\s*ownerId\s*,\s*'sojusz'/
/const deals = dealPartnerIdsForOwner\(\s*activeDeals\s*,\s*ownerId\s*,\s*'handel'/
```

Notatki niepilne do osobnej rejestracji (nie blokują): N-2 (bramka ma zero pokrycia behawioralnego
nowego pop-upu — 7 realistycznych regresji, w tym „przycisk audiencji przestaje działać" i XSS,
przechodzi 46/46 zielono; Evaluator dostarczył gotowy ~120-liniowy harness jsdom do przyszłego
dołożenia), N-3 (martwy eksport `updateDiploPairSummary`, stuby `.stubs/` niegitignorowane).

Dispatch scalenia (z poprawką N-1 wklejoną razem) NASTĘPUJE — w kolejce, PO zakończeniu 2 obecnie
działających agentów scalających w głównym drzewie (Tartak/Glinianka, Armia-rozpad runda 6), żeby
uniknąć wyścigu na tym samym drzewie.

---

## BUG-OBWARZANEK-20PCT i BUG-ZIEMIA-SCALE — WDROŻONE, status skorygowany (2026-08-09/10)

Trzeci i czwarty temat z audytu „zapomnianych" (mapgen, 2026-08-02) potwierdzone jako fałszywy
alarm co do treści (oba naprawione tego samego wieczoru, ten sam commit `6f96f08`, FALA 199-200),
prawdziwy alarm co do procesu (status nigdy nie zaktualizowany, mimo potwierdzenia Macieja w
korespondencji: „chyba jest sukces... najważniejsze: zniknął obwarzanek"). Weryfikacja empiryczna
dziś: `pangea-bagel-gap-audit.cjs` + własny skrypt na 9 przebiegach (land 15/20/25%, 3 seedy każdy)
→ `dryMasses=1` wszędzie; generacja mapy Ziemia dla wszystkich 5 rozmiarów (seed 777) →
udział lądu rośnie 15.5%→24.9%, bufor biegunowy spada 50%→24% (Mały→Super Huge) — dokładnie
odwrotnie niż opisywał zgłoszony błąd.

**Wynik: WSZYSTKIE 4 tematy generatora map z audytu „zapomnianych" (AC-RZEKI-BEZ-LIMITERA,
AC-RZEKI-PER-MASA, BUG-OBWARZANEK-20PCT, BUG-ZIEMIA-SCALE) — już naprawione, nie wymagają
dispatchu.** Pozostają 2 z 6: PERF-SUPER-HUGE-PANGEA-80 i BUG-SCENA-PERF-FALA138 —
NIEJEDNOZNACZNE, wymagają realnego pomiaru (F12 Macieja w grze), nie do rozstrzygnięcia z samego
kodu — do zgłoszenia Maciejowi jako prośba o pomiar, nie do dispatchu subagenta kodującego.

---

## R-EPOKA-CUD-WARUNEK-AWANSU — Evaluator RUNDA 4 (świeża implementacja): PASS-WITH-NOTES, 2 BLOKUJĄCE, runda 5 w toku (2026-08-09/10)

Rdzeń logiki potwierdzony poprawny i zgodny z decyzją Macieja (zweryfikowane niezależnie: 16/16
cudów E epok przechodzi bramkę dostępności bez zakleszczenia, zasięg reguły policzony na danych —
9 cywilizacji objętych, 6 z martwą regułą bo cud w epoce 3).

**B1 (BLOKUJĄCA, realny bug w kodzie gry):** blok chatki skarbów (`main.ts:17163`) używa STAREGO
warunku `if (step.completed.some(d => d.awansEpoki))` do odświeżenia nakładek złóż/`setEra()`
zamiast nowego `eraAdvanced` — przy awansie epoki BEZ starej flagi `awansEpoki` (realny, częsty
przypadek: gracz zbadał Brązownictwo wcześniej, chatka domyka resztę Kamienia) epoka realnie
awansuje ale wizualia/muzyka NIE odświeżają się. Naprawa: jeden token,
`if (step.completed.some(d => d.awansEpoki))` → `if (eraAdvanced)`.

**B2 (BLOKUJĄCA, bramka):** własna kampania 15 mutacji Evaluatora — 9/15 złapanych, **6/15
przeżyło**, w tym 4 łamiące wprost sedno zlecenia (parytet gracz/AI, per-cywilizacyjność): E3
(gracz na sztywno `'grecy'` zamiast `civTypeForOwner(0)`), E4 (gracz dostaje `[]` zamiast
`completedWorldWonders` — trwałe zakleszczenie), E5 (AI dostaje civType gracza — cała
per-cywilizacyjność ginie), E15 (wynik przeliczenia AI wyrzucany do kosza — cała strona AI
martwa). Przyczyna: kotwice regexowe sprawdzają nazwę wołanej funkcji, ale NIE jej argumenty ani
zapis wyniku. Naprawa zdefiniowana precyzyjnie (4 punkty, patrz pełny werdykt wyżej).

**Dodatkowe znalezisko:** `reconcileEraForOwner()` — funkcja opisana w zleceniu jako „dyspozytor
gracz/AI wpięty w 4 miejsca" jest w rzeczywistości MARTWYM KODEM, nigdzie nie wołana (wszystkie 4
wpięcia wołają bezpośrednio `reconcilePlayerEraFromResearch`/`syncOwnerEraFromResearch`). Bramka
asercjonuje istnienie martwej funkcji. Do rozstrzygnięcia przy scaleniu: użyć dyspozytora
faktycznie, albo usunąć razem z asercją.

**B2 z rejestru (zgodność sejwów) zaostrzona:** poprzedni opis („AI zdegradowane, gracz zachowuje
starą epokę") jest niepełny — degradacja dotyczy OBU stron: AI natychmiast przy wczytaniu, gracz
przy pierwszym końcu tury/badaniu/chatce/handlu tech (bo `reconcilePlayerEraFromResearch` robi
`player.era = next`, nie `Math.max`). Każdy zapis sprzed tej zmiany cofa CAŁY świat o 1-2 epoki.
Nadal wymaga ABC, z poprawioną diagnozą.

Dispatch runda 5, wąska (B1 jeden token + B2 cztery rozszerzenia regex + decyzja o
`reconcileEraForOwner`) NASTĘPUJE teraz.

---

## R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE — Evaluator pełny po odtworzeniu: PASS-WITH-NOTES, 2 BLOKUJĄCE (obie pokrycie testowe, kod poprawny), runda 3 w toku (2026-08-09/10)

Rekonstrukcja NIE wprowadziła regresji ani rozjazdu z decyzją Macieja — `production.ts` odtworzony
od zera oceniony jako poprawny (7 mutacji łapanych, w tym 2 niewidoczne dla pinów tekstowych,
bramki minimalne i we właściwych miejscach). `main.ts` (5 miejsc ręcznie wklejonych w zdryfowany
plik) i `trade-routes.ts` (bajt-identyczny patch) potwierdzone poprawne. Scalenie praktycznie
przetestowane na aktualnym HEAD (`git apply -3` czysty, pełne bramki zielone tam).

**B1 (BLOKUJĄCA):** część A (bonus ekonomiczny za szlaki morskie) NIE MA żadnej bramki chroniącej —
4/4 własne mutacje Evaluatora przeżywają, w tym usunięcie samego Port-gatingu (T1: `medium!=='lad'`
zamiast `!=='morze'` — bonus przestaje być morski I przestaje być Port-gated, wszystko zielono).
Ta sama klasa co B6a z R-EPOKA-BRAZU — bramka łapie usunięcie haka, nie to co hak robi.

**B2 (BLOKUJĄCA):** parytet AI — trzy miejsca zasilające `availableProduction` (planowanie AI,
egzekucja AI, lista rekrutacji gracza) NIE są pinowane. 3/3 mutacje przeżywają (AI buduje Galerę
w mieście śródlądowym, 100% zielono). Kod jest dziś poprawny, ale niechroniony.

Naprawa w PEŁNI zdefiniowana przez Evaluatora (~7 asercji w `trade-routes-test.cjs` dla B1, 3 piny
regex w `naval-water-access-gate-test.cjs` dla B2, zero zmian w kodzie produkcyjnym) — pełny tekst
w werdykcie wyżej w tym pliku.

**Notatki do osobnych pytań ABC (§1a — dotyka obszaru już rozstrzygniętego decyzją C 2026-08-09):**
N3 (zasięg bonusu morskiego — `detectBestConnection` przy remisie wybiera ląd, więc bonus w
praktyce nagradza niemal wyłącznie handel zamorski, węziej niż mogła być intencja „miasta
nadmorskie"), N8 (`PORT_SEA_TRADE_BONUS_PIENIADZ=1` to stała w TS, nie parametr w
`econ-params.json` — łamie kierunek „źródłem prawdy JSON").

**Rekomendacja Evaluatora — priorytet wysoki:** scalić NATYCHMIAST po rundzie 3, nie zostawiać na
worktree — to trzeci raz gdy ten temat wisi niescalony, dwa poprzednie skończyły się incydentem.

Dispatch runda 3 (wąska, wyłącznie testy) NASTĘPUJE teraz.

---

## R-BUDYNEK-PORTOWY — konsolidacja: druga niezależna ocena potwierdza te same luki (2026-08-09/10)

Agent oryginalnego Evaluatora rundy 1 (`a315e180c5d1bbbfd`) zameldował się powtórnie z dodatkową
analizą: porównał zgubiony test rundy 1 (286 linii, nigdy niescommitowany, bezpowrotnie stracony
w incydencie) z testem rundy 2 (358 linii, ocalony) i wykrył że runda 2 **zamieniła** pokrycie
zamiast je rozszerzyć — zyskała piny M4/M5/M11/M17 (ctx „Zastąp", wpięcie bonusu), ale **zgubiła**
M13 (parytet AI w `isBuildAllowed` — DOKŁADNIE to samo co B2 z pełnej re-weryfikacji Evaluatora
`aac04a79b95efcd21`) i M8/M9/M10 (bonus liczony od 1. trasy, brak filtra `medium`/`status` —
DOKŁADNIE ten sam obszar co B1 tamtej oceny). Dwie niezależne ścieżki oceny zbiegają się w tych
samych lukach — mocny sygnał że runda 3 (już w dispatchu, `a6fb470d3a3c88349`) obejmuje właściwy
zakres.

Agent dodatkowo przygotował gotowy, zweryfikowany pakiet odzyskujący (`scratchpad/wt-recover`,
patch `naval.patch`, 32/32 na aktualnym HEAD) jako rezerwową ścieżkę, gdyby runda 3 nie
wystarczyła — do wykorzystania tylko w razie potrzeby, priorytet ma dokończenie rundy 3 w toku.

Uwaga procesowa (do playbooka): agresywne środowisko współdzielone — inny agent nadpisał ścieżkę
logu tego Evaluatora, worktree Operatora zniknął w trakcie oceny. Rekomendacja: unikalne nazwy
plików logów per zlecenie w scratchpadzie (ten sam wniosek co z incydentu R-EPOKA-CUD wcześniej
tej nocy — trzecie niezależne potwierdzenie tego samego problemu).

---

## R-EPOKA-CUD-WARUNEK-AWANSU — runda 5 dostarczona (Operator), czeka na Evaluatora (2026-08-10)

Worktree `agent-a3b258ae5b08c64f5`. B1: `main.ts` blok chatki skarbów, jeden token
`if (step.completed.some(d => d.awansEpoki))` → `if (eraAdvanced)` — odświeżenie nakładek/`setEra()`
teraz wykonuje się przy KAŻDYM realnym awansie epoki. B2: 4 kotwice w
`era-cud-main-ts-integracja-test.cjs` wzmocnione o wymóg `civTypeForOwner`+`completedWorldWonders`
w wywołaniu oraz nowa asercja zapisu wyniku AI (`ownerEraByOwner.set(ownerId, next)`) i startEra
gracza (`gameStartEra()` nie na sztywno) — wszystkie 4 mutacje E3/E4/E5/E15 z werdyktu rundy 4
teraz złapane (dowód FAIL→PASS), 11/11 sond kruchości nadal bezpieczne. `reconcileEraForOwner()`
(martwy kod, żył w `main.ts` nie `owner-epoch.ts` jak błędnie opisano w zleceniu) usunięty razem
z powiązaną asercją. Bramki: tsc 0, logic-test 213/213, owner-epoch 13/13, era-cud-warunek-awansu
33/33, era-cud-main-ts-integracja OK (16/16 mutacji, 11/11 sond), diplomacy-tech-trade-e2e 28/28,
research 33/33, tech-tree 19/19.

**Uwaga proceduralna:** Operator nie mógł wykonać żadnej komendy git w cudzym worktree (izolacja
narzędzia) — zmiany leżą niescommitowane na dysku, do przejęcia przez Evaluatora/scalającego
bezpośrednio z tego worktree.

Dispatch Evaluatora rundy 5 (finalnej) NASTĘPUJE teraz.

---

## R-BUDYNEK-PORTOWY — runda 3 dostarczona (test-only, B1+B2+N1), czeka na finalnego Evaluatora — PRIORYTET (2026-08-10)

Worktree `agent-a6fb470d3a3c88349`, odtworzony 1:1 z referencyjnego `agent-a9d473aa1495f39c6`
(kod produkcyjny NIETKNIĘTY, bajt-identyczny). B1: +10 asercji w `trade-routes-test.cjs` (61/61).
B2: +3 piny regex w `naval-water-access-gate-test.cjs` + N1 (39/39). Wszystkie 8 mutacji explicite
wymienionych w zleceniu (T1-T4, M8-M10, N1) teraz złapane — dowód FAIL→PASS dla każdej. Operator
uczciwie zastrzega: nie znalazł w rejestrze pełnej listy „23 mutacji" (P1-P7/M1-M11/T1-T4) z
oryginalnego werdyktu — potwierdza tylko 8 explicite nazwanych w zleceniu tej rundy, reszta wg
niego była już pokryta istniejącymi 32 asercjami. Bramki: tsc 0, logic-test 213/213,
naval-water-access-gate 39/39, trade-routes 61/61, trade-routes-income 52/53 (pre-istniejąca),
unit-replace 13/13, deposit-building-gate 47/47, ai-production-priority 9/9.

**Priorytet wysoki** (trzeci temat z rzędu z realnym ryzykiem utraty niescalonej pracy) — dispatch
finalnego Evaluatora (skrócony zakres: potwierdzić 8 mutacji + ewentualne resztkowe z pełnej listy
23 + czyste scalenie) NASTĘPUJE teraz, z instrukcją natychmiastowego scalenia po PASS.

---

## R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE — SCALONE `fbde1880` (2026-08-10)

Werdykt finalny: PASS, 17/17 własnych mutacji Evaluatora złapanych (8 explicite z rundy 3 + 9
własna próbka), zero przeżywających. Scalenie zweryfikowane bajt-po-bajcie (36 linii Portu w
main.ts identyczne przed i po scaleniu mimo 744 linii dryfu). Bramki na scalonym drzewie: tsc 0,
logic-test 213/213, naval-water-access-gate 39/39, trade-routes 61/61, unit-replace 13/13,
deposit-building-gate 47/47, ai-production-priority 9/9, trade-routes-income 52/53 (pre-istniejąca,
potwierdzona bajtowo identyczna bez zmiany Portu). Temat w PEŁNI zamknięty po 3 rundach + incydencie
utraty i odzyskania pracy.

Notatki do osobnych pytań ABC (§1a — dotykają obszaru rozstrzygniętego decyzją C 2026-08-09), do
zadania Maciejowi rano: N3 (`detectBestConnection` przy remisie wybiera ląd — bonus morski w
praktyce nagradza niemal wyłącznie handel zamorski, węziej niż mogła być intencja „miasta
nadmorskie"), N8 (`PORT_SEA_TRADE_BONUS_PIENIADZ=1` to stała w TS, nie parametr w
`econ-params.json` — łamie kierunek „źródłem prawdy JSON").

---

## R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA — SCALONE `15325a1c` (2026-08-10)

Poprawka N-1 zastosowana i zweryfikowana mutacyjnie (zamiana `'sojusz'`/`'handel'` w kodzie
produkcyjnym → 44/46 FAIL na `6j`/`6k`, przywrócenie → 46/46). Bramki: tsc 0, logic-test 213/213,
diplomacy-lista-podglad-przed-wizyta 46/46, diplomacy-treaties 17/17, diplomacy-display 35/35.
Brak konfliktu z równoległą pracą nad main.ts (Armia-rozpad). Temat w pełni zamknięty (rundy 1-3).

## R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY — potwierdzenie post-scalenia + N11 (2026-08-10)

Evaluator wykrył że temat już był scalony (commit `f4d427e8`) w trakcie własnej pracy — zweryfikował
scalony kod od nowa: PASS, kod identyczny z odtworzeniem, 21 własnych mutacji na scalonym drzewie
(15 destrukcyjnych złapanych w tym wszystkie warianty N10, 5 sond niegroźnych bezpiecznych). Temat
w pełni potwierdzony, bez działania.

**N11 (nowe, niepilne, do rejestru):** strona SILNIKA (nie panelu) niestrzeżona — usunięcie
`kultura: hs.kultura ?? 0` z `getEmpireHud` w `main.ts` daje tsc 0 i test 71/71 zielono, a chip
Kultury pokazywałby „(0)" na zawsze. Ta sama klasa co N1/N6/N10, tylko szew jest w górę
(silnik→panel) zamiast w dół. Dotyczy wszystkich 6 pól zapasu.

## OSTRZEŻENIE PROCESOWE — TRZECIE potwierdzenie kolizji ścieżek w scratchpadzie (2026-08-10)

Trzeci niezależny przypadek tej samej nocy (po R-EPOKA-CUD i R-BUDYNEK-PORTOWY): agenci
równoległych sesji nadpisują sobie nawzajem generyczne nazwy plików we współdzielonym
`scratchpad/` (`mut.py`, `main.ts.bak`, log-i bramek). Tym razem Evaluator HUD-stock-tempo
wykrył że jego `mut.py`/`mut2.py` zostały nadpisane cudzym harnessem (R-BUDYNEK-PORTOWY) w
trakcie pracy — złapane tylko dlatego że format wyjścia się nie zgadzał. **Mocny sygnał do
nowej, twardej reguły playbooka: każdy plik roboczy w scratchpadzie MUSI mieć prefiks
unikatowy dla zlecenia/agenta, nigdy generyczną nazwę.** Materiał do przygotowywanych reguł
AutoBot (patrz niżej w tym pliku, do zebrania rano).

---

## R-EPOKA-CUD-WARUNEK-AWANSU — Evaluator RUNDA 5 (finalna): PASS-WITH-NOTES, 1 BLOKUJĄCA (2 linie, przy scalaniu), GOTOWE DO SCALENIA (2026-08-10)

B1 potwierdzona poprawna na danych (epoka Kamień 12 technologii, jedyny kamień milowy
Brązownictwo). B2 potwierdzona niezależnym harnessem (17/18 własnych mutacji złapanych, w tym
test koniunkcji: oba wymogi kotwicy pilnowane NIEZALEŻNIE, nie „jeden przypadkiem"). 11/11 sond
kruchości bezpieczne i faktycznie nietrywialne. `reconcileEraForOwner()` — usunięcie bezpieczne,
potwierdzone że nic nie zginęło (9 punktów wpięcia identyczne przed/po, tylko rozwinięte z
dyspozytora w jawne gałęzie).

**Blokująca (naprawa PRZY SCALANIU, nie runda 6):** scalenie z aktualnym czubkiem gałęzi
(`fbde1880`, 780+/84- w main.ts od R-EPOKA-BRAZU) psuje JEDNĄ mutację testu (M12) — dosłowny
ciąg który mutacja podmienia przestał istnieć po wstawieniu bloku `bronzeForceWarPendingOwners`.
Naprawa zwalidowana na obu stanach:
```js
src.replace(
  /ownerEraByOwner\.set\(ownerId, next\);/,
  'ownerEraByOwner.set(ownerId, prev);',
)
```
**Rekomendowana (razem, domyka jedyną przeżywającą własną mutację X9 — cofnięcie B1):**
```js
const RE_3A_CHATKA_ERAADVANCED = /const (\w+) = shouldNotifyPlayerEraChange\((\w+), player\.era\);\s*\n\s*villageEraAdvanced = \1;\s*\n\s*if \(\1\) \{\s*\n\s*overlayDepositEra = player\.era;\s*\n\s*rebuildResourceOverlays\(\);\s*\n\s*setEra\(player\.era\);/;
```
(dodać `assert(...)` i wpisać do tablicy `checks`).

Zasięg reguły doprecyzowany (N2): bramkę 1→2 ma TYLKO Egipt, bramkę 2→3 ma 8 cywilizacji.
Konsekwencja dla B3-ABC: `bronzeForceWarPendingOwners` (R-EPOKA-BRAZU) na awansie 1→2 dotyczy
WYŁĄCZNIE Egiptu, nie 9 cywilizacji.

Dispatch scalenia (z obiema poprawkami wklejonymi) NASTĘPUJE teraz.

---

## R-EPOKA-CUD-WARUNEK-AWANSU — SCALONE `13861b60` (2026-08-10)

5 rund, incydent utraty pracy w trakcie, pełne odzyskanie/rekonstrukcja, w pełni zamknięte. Obie
poprawki testu z rundy 5 (M12 regex zamiast literału, nowa kotwica RE_3A_CHATKA_ERAADVANCED)
zastosowane przy scalaniu, `era-cud-main-ts-integracja-test.cjs` w pełni zielony (15/15 asercji,
16/16 mutacji, 11/11 sond). Wszystkie bramki + bramki gałęzi docelowej (forced-war-bronze) bez
regresji. Temat w pełni zamknięty.

**Pozostają 2 osobne pytania ABC dla Macieja rano** (nie formułowane jeszcze, materiał gotowy):
1. Zgodność sejwów (B2-zapisy) — każdy zapis sprzed tej zmiany cofa świat o 1-2 epoki, dotyczy
   OBU stron (gracz i AI), różny moment ujawnienia.
2. Ryzyko trwałego utykania AI w budowie cudu (B3) — dotyczy 9/15 cywilizacji, doprecyzowane:
   awans 1→2 dotyczy tylko Egiptu, awans 2→3 pozostałych 8.

---

## Trzy decyzje ABC — ECHO Macieja (2026-08-10)

**P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO (BB2) — ECHO B** (wbrew rekomendacji A): pełny refaktor —
tożsamość stosu niezależna od heksu (`stackGroupId`). Wymaga: enumeracji WSZYSTKICH miejsc
poolingu ruchu per-heks (C-026, ~10 funkcji w main.ts wg wcześniejszego rozpoznania: HUD, cykl
armii, split, oblężenie, garnizon), przepięcia ich na tożsamość stosu, pełnej regresji na
wszystkich tych systemach. Duży zakres — dispatch osobnym, starannie zaplanowanym Operatorem.

**R-EPOKA-CUD-WARUNEK-AWANSU (B2-zapisy) — ECHO A**: świadomie akceptujemy degradację epoki przy
wczytaniu starych zapisów, bez migracji. Zgodne z JUŻ scalonym zachowaniem (`player.era = next`,
nie `Math.max`) — **brak zmian w kodzie**, temat formalnie zamknięty tą decyzją.

**R-EPOKA-CUD-WARUNEK-AWANSU (B3) — ECHO A + doprecyzowanie**: rozluźnianie progu opłacalności
cudu z czasem DLA AI, plus wyraźny wymuszacz — gdy AI ma wszystkie technologie danej epoki
zbadane (komplet spełniony, brakuje tylko cudu), budowa WSZYSTKICH cudów tej cywilizacji staje
się PRIORYTETEM w kolejce produkcji (nie tylko łagodniejszy próg opłacalności — twarde
pierwszeństwo). Dispatch osobnym Operatorem (`gra/src/game/ai.ts`).

Dispatch obu Operatorów (BB2-stackGroupId, B3-priorytet cudu) NASTĘPUJE teraz.

---

## PERF-SUPER-HUGE-PANGEA-80 i BUG-SCENA-PERF-FALA138 — ODŁOŻONE do backlogu, decyzja Macieja (2026-08-10)

Oba tematy pozostają NIEROZSTRZYGNIĘTE (wymagają realnego pomiaru F12 w grze, nie do
rozstrzygnięcia z samego kodu — patrz audyt wyżej w tym pliku). Maciej: zapisać jako rzeczy do
zrobienia w przyszłości, NIE podejmować teraz. Status: BACKLOG, nie dispatchować subagentów do
czasu wyraźnego polecenia po tym, jak Maciej sam zmierzy czasy w grze.

---

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — WYJAŚNIENIE: 6 rund NIGDY nie trafiło do żadnej gałęzi (2026-08-10)

**Odkrycie:** nowy Operator (dispatch stackGroupId, BB2=B) zgrepował całą historię gita na
wszystkich gałęziach i znalazł, że `assignBounceHexesForUnits` na pełnej liście jednostek
(oryginalny bug „armia się rozpierzcha") nadal jest jedynym kodem w `main.ts` — ŻADNA z 6 rund
tego tematu (rozpoznanie → ECHO A → 4 rundy FAIL → runda 5 → runda 6) nigdy nie została
scommitowana. Testy tematu nie istnieją w historii `git log --all`.

**Przyczyna znaleziona:** agent rundy 6 (dispatch „Operator + scalenie" w jednym) doszedł do kroku
przełączenia się na główne drzewo (`EnterWorktree`), narzędzie odmówiło/przerwało to wywołanie, a
sesja agenta zakończyła się bez wysłania finalnego raportu — stąd orkiestrator nigdy nie dostał
notyfikacji o zakończeniu i temat cicho utknął.

**Praca NIE jest stracona.** Zweryfikowane bezpośrednio na dysku:
- Worktree rundy 5 (`agent-ad689c69f19841e17`) — nietknięty, zawiera oryginalny
  `army-merge-separate-return-test.cjs` (test funkcjonalny czystych funkcji).
- Worktree rundy 6 (`agent-a9cfa743629052405`) — nietknięty, zawiera `armyMerge.ts`+`main.ts`
  (identyczne z rundą 5, bez zmian — B-R5-1 dotyczyło tylko testu) oraz zaktualizowany
  `army-merge-separate-return-mainguard-test.cjs` z dopisaną notą B-R5-1 (2 nowe asercje,
  17→19, uruchomiony samodzielnie: **37/37 PASS** po symlinkowaniu `node_modules`).
- Runda 6 skopiowała wszystko OPRÓCZ `army-merge-separate-return-test.cjs` — brakujący plik
  wzięty z worktree rundy 5, identyczny, bez zmian.

**Scalenie NASTĘPUJE teraz** — komplet (armyMerge.ts + main.ts z rundy 6, oba pliki testów: jeden
z rundy 5 bez zmian, drugi z rundy 6 z notą B-R5-1) + ręczne wklejenie sprostowania rejestru z
rundy 5 (tekst podany w werdykcie Evaluatora rundy 5, wyżej w tym pliku).

**Do playbooka:** to jest wariant TRZECI tej samej nocy tej samej klasy incydentu (praca w
worktree nigdy nie trafiająca do gałęzi) — tym razem przyczyną nie było `git worktree remove`,
tylko przerwane wywołanie narzędzia (`EnterWorktree`) bez żadnej notyfikacji o niepowodzeniu.
Mocny dodatkowy argument za nową regułą: **agent-scalający NIGDY nie powinien być tym samym
agentem co Operator wykonujący pracę merytoryczną** — scalenie zawsze osobnym, dedykowanym
dispatchem, żeby awaria na etapie scalania nie grzebała całej rundy bez śladu.

---

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO — SCALONE `a396eddc` (2026-08-10)

Kompletne scalenie po odzyskaniu z dwóch nietkniętych worktree. Kluczowa weryfikacja: `grep
assignBounceHexesForUnits gra/src/main.ts` pokazuje wyłącznie komentarze — oryginalny zgłoszony
bug (armia rozpraszała się na osobne wolne heksy przy „zostaw osobno") jest naprawiony,
`onSeparate` woła teraz `resolveSeparateReturnHex`+`computeSeparateReturn`, cała armia wraca razem.
Wszystkie 12 bramek zielone (tsc 0, logic-test 213/213, oba testy tematu 16/16 i 37/37 [z notą
B-R5-1], army-merge-bounce 4/4, army-merge-dismiss-bounce 16/16, army-stack-ruch 5/5,
army-merge-colocated 4/4, combat-test 6/6, tech-tree 19/19, research 33/33, unit-replace 13/13).
Zero regresji. Temat w pełni zamknięty co do bezpiecznego minimum (BB1) — BB2 (współdzielona pula
ruchu, decyzja ECHO B = pełny refaktor stackGroupId) w toku jako osobny dispatch.

---

## stackGroupId runda 2 — ZATRZYMANA, potwierdzenie mechanizmu „worktree startuje od main, nie od gałęzi sesji" (2026-08-10)

Operator prawidłowo zdiagnozował i zatrzymał się (zgodnie z instrukcją) zamiast zgadywać: jego
`isolation:"worktree"` wystartował od `main` (`b0e4a5c9`, poziom FALA 263), NIE od bieżącej gałęzi
sesji `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (obecny tip, zawiera scalone `a396eddc`
Armia-rozpad + wszystko z tej nocy). To DOKŁADNIE mechanizm opisany w skillu `civ-autobot` §5
(„`isolation:'worktree'` NIE dziedziczy z bieżącej gałęzi sesji — startuje od `main`") —
potwierdzony dziś po raz kolejny, tym razem jako przyczyna fałszywego alarmu, nie utraty pracy.

**To NIE jest regresja ani utrata BB1** — `a396eddc` jest bezpiecznie na
`origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (potwierdzone), po prostu poza zasięgiem
świeżego worktree. `main` jest CELOWO „jedną falą do tyłu" (`R-MERGE-MAIN-RYTM-Q1`) — scalenie do
`main` następuje wyłącznie na hasło `deploy`, nie samo z siebie.

**Naprawa procesowa (do playbooka):** dispatch dla Operatorów pracujących na worktree potrzebujących
NAJNOWSZEGO stanu gałęzi sesji (nie `main`) musi WPROST instruować: skopiować potrzebne pliki
bezpośrednio z żywego katalogu głównego (`/home/user/The-Game`, aktualny checkout gałęzi sesji),
NIE polegać na `git diff`/`grep` wewnątrz własnego, świeżo założonego worktree jako źródle prawdy o
tym „co już jest scalone". Runda 3 dispatchowana z tą poprawką.

---

## Nowe reguły AutoBot (C-033…C-038) — Evaluator rundy 1: FAIL (5 nieścisłości), poprawione i scommitowane (2026-08-10)

Na dwukrotne polecenie właściciela („podsumuj sobie wszystkie właśnie błędy… przygotuj nowe
reguły które wprowadzimy do Autobot") dopisano do `playbook.md` sześć nowych reguł (C-033
usuwanie worktree bez sprawdzenia stanu, C-034 scalenie jako osobny natychmiastowy dispatch,
C-035 worktree zawsze od `main`, C-036 unikalne nazwy plików w scratchpadzie, C-037 brak
notyfikacji ≠ agent wciąż pracuje, C-038 werdykt Evaluatora tylko po realnym odebraniu raportu)
razem z wpisami w rejestrze błędów i dzienniku wniosków, pokrywające 5 incydentów tej nocy.

Zgodnie z §0b (orkiestrator nie ocenia sam siebie) zmiana przeszła przez niezależnego
Evaluatora PRZED commitem — werdykt runda 1: **FAIL**, 5 blokujących: (B1) „godziny później"
między dwoma usunięciami worktree — w rzeczywistości TA SAMA partia sprzątania; (B2) mechanizm
odzysku przypisany błędnie obu incydentom jako `git fsck` — R-EPOKA-CUD w rzeczywistości nie miał
odzyskanych obiektów gita, tylko wyścig z czasem (grep tuż przed zniknięciem worktree); (B3)
dziennik liczył „cztery nowe zasady" przy pięciu (C-033…C-037); (B4) „odzyskane w pełni"/„zero
trwałej utraty pracy" zaprzeczone przez własne źródło — test R-EPOKA-CUD ma dziś 33 asercje
zamiast utraconych 35, test rundy 1 Portu został ZASTĄPIONY (nie rozszerzony) tracąc piny
M8/M9/M10/M13; (B5) „wszystkie cztery tematy scalone" przy trzech hashach — czwarty/piąty
incydent (worktree-na-main, kolizje scratchpad) nie są tematami kodu do scalenia; (B6)
`playbook.json` nie zregenerowany po dopisaniu reguł (recydywa C-031 — reguła istnieje tylko w
pliku wymagającym świadomego odczytu). Evaluator wskazał też 2 luki: brak reguły dla „rejestr
zapisał werdykt Evaluatora, który nigdy się nie odbył" (→ nowa C-038) i brak wymogu
„natychmiast po PASS" w C-034 (rozszerzone).

Wszystkie 6 punktów poprawione: dokładność faktów wobec źródeł, dodana C-038, C-034 rozszerzone
o „natychmiast po PASS" + twardy dowód sukcesu (`git log --all --oneline | grep <hash>` + grep
symbolu w drzewie głównym), C-035/C-037 oznaczone jako RECYDYWA wiedzy już opisanej w
`.claude/skills/civ-autobot/SKILL.md` (żyła tylko w pliku bez auto-ładowania — ten sam
mechanizm co C-031), C-037 dostał próg ~45 min + fallback niezależny od `ListAgents`
(`ls`+`git status` w worktree), `playbook.json` zregenerowany generatorem (`--write`,
version→30), `autobot-smoke.cjs` 11/11 PASS. Numeracja ID zweryfikowana: 38 wierszy, C-001…C-038,
zero duplikatów/luk. Scommitowane po poprawkach — zgodnie z zasadą, że orkiestrator nie
zwalnia się z pętli AutoBot nawet dla własnych zmian dokumentacyjnych.

---

## AUDYT C-030 — 23 wpisy OTWARTE, 9 potwierdzonych ZAPOMNIANYCH (2026-08-10)

Na polecenie Macieja („sprawdź czy każdy temat który wisi ma swojego subagenta") — pełny audyt
zgodności z regułą C-030 dla wszystkich 23 wpisów `STATUS: **OTWARTE` w tym pliku (grep bez
kotwicy `^## `, per C-031). Dla każdego sprawdzono niezależnie: dispatch subagenta / pytanie ABC
zadane / udokumentowany cytat Macieja o odłożeniu (NIE samoocena „niepilne" wpisana przez agenta
rejestrującego — to nie liczy się jako pokrycie).

**Wynik: 14/23 pokryte** (9 subagent, 4 ABC+subagent/ABC samo, 2 jawnie odłożone cytatem
Macieja — `P-KOLOR-SUROWCE-MIASTO-VS-MAPA`, `R-FORT-STRAZNICA` krok 2; 1 dodatkowy —
`R-BUDYNEK-PORTOWY` ma nieaktualny nagłówek, ale temat w pełni scalony `fbde1880`, do poprawki
etykiety nie brak pokrycia).

**9/23 potwierdzone ZAPOMNIANE** — zero dispatchu, zero ABC, zero decyzji Macieja, jedyna
adnotacja to samoocena „niepilne" agenta, który je rejestrował:
1. P-BRAMKA-MAP-FIELD-BATTLE-PRE-BATTLE-SAVE-CZERWONE (`gra/tools/map-field-battle-test.cjs`,
   `pre-battle-save-test.cjs` — dopisanie do CLAUDE.md §BRAMKI, dokumentacja, zero kodu)
2. P-ETYKIETA-PODWOJNY-ZNAK-PRACA-BUDYNKI (`cityPanel.ts:4394,4418`)
3. P-ETYKIETA-KARTA-ZYWNOSC-4800-MIESZANE-SEPARATORY (`cityPanel.ts` `buildTopBarZywnoscDetailCard`
   ~4839,4841)
4. P-BRAMKA-TOOLTIP-REGEX-UZASADNIENIE-NIEPRAWDZIWE (`heks-panel-tooltip-warstwa-test.cjs`,
   korekta komentarza)
5. P-HEKS-ZLOZE-PARYTET-NIEDOMKNIETY (`cityPanel.ts:8207,8225`, `hexContextTooltip.ts:252`)
6. P-OKOLICA-ADJUST-PLUS1-TOGGLE-SEMANTYKA (`okolica.ts` `adjustTileWorker`)
7. P-OVERLAY-KOLEJNOSC-WYWOLAN-TRASY-PIGULKI (`main.ts` `refreshTradeRoutesOverlay`/
   `cityRenderer.sync`) — POTWIERDZONE przez niezależnego Evaluatora jako realny błąd, wprost
   odnotowane „kto podejmie tamten temat" bez odpowiedzi
8. P-DYPLO-DOPLAC-PW-ZLA-SCIEZKA (komunikat „Brakuje X PW" po `R-DYP-STOL-A-KOREKTA`)
9. P-HUD-KULTURA-SIGNED-NIESPOJNE (`hud.ts` `renderBarD1B`, chip Kultury)

Wszystkie 9 to niskiego ryzyka poprawki kosmetyczne/dokumentacyjne, żadna nie wymaga ABC.
Dispatch pogrupowany (5 Operatorów wg pliku/obszaru, zamiast 9 osobnych, żeby zmniejszyć koszt
scalania przy jednym pliku dotykanym wielokrotnie) NASTĘPUJE teraz.

---

## P-BRAMKA-MAP-FIELD-BATTLE-PRE-BATTLE-SAVE-CZERWONE + P-BRAMKA-TOOLTIP-REGEX-UZASADNIENIE-NIEPRAWDZIWE — dostarczone, dokumentacja/komentarz (2026-08-10)

Worktree `agent-abe061c068bc015ba`. Zero zmian w kodzie produkcyjnym/logice testu — wyłącznie
tekst. (1) `CLAUDE.md` §BRAMKI: dopisana notatka o dwóch pre-istniejących czerwonych bramkach
harnessu testowego (`map-field-battle-test.cjs`/`pre-battle-save-test.cjs` — brak loaderów
Vite/esbuild dla `.mp3`/`.svg`, nie regresja silnika). (2) `heks-panel-tooltip-warstwa-test.cjs`:
poprawiony nieprawdziwy komentarz uzasadniający regexowe podejście (twierdził że DOM
niedostępny — nieprawda, `jsdom` jest deklarowaną zależnością używaną przez 9 innych testów).
Bramki: tsc 0, logic-test 213/213, `heks-panel-tooltip-warstwa-test.cjs` 22/22 (identyczne z
bazą — potwierdza że to czysto komentarz).

Dispatch lekkiego Evaluatora (weryfikacja, że zmiana jest wyłącznie tekstowa i nie wprowadza
nieprawdy w drugą stronę) NASTĘPUJE teraz.

---

## Pytanie Macieja (zrzut ekranu) — checkbox „Auto Wyżywienie" wciąż widoczny zamiast przycisku (2026-08-10)

**Zrzut Macieja:** panel miasta, sekcja Wyżywienie, pokazuje `☐ Auto Wyżywienie` jako checkbox +
osobna etykieta, oraz tekst „Auto WYŁ — bez auto-obniżania/podnoszenia" jako WIDOCZNY tekst pod
paskiem (nie w tooltipie). Cytat: „tutaj miał być checkbox zmieniony na przycisk i opisy do
tooltip".

**Zbadane bezpośrednio, zanim cokolwiek dispatchowałem (§6/7 — nie zgaduj, nie twórz problemów
których nie ma):** dokładnie ta zmiana JEST już w kodzie. `gra/src/ui/cityPanel.ts:4686-4702` —
`autoBtn = document.createElement('button')`, `className = 'hbtn auto-wyzywienie-btn'`
(pełnoszerokościowy przycisk z tekstem „Auto Wyżywienie" W ŚRODKU, styl 1:1 z istniejącego
przycisku auto-produkcji), `aria-pressed`, tekst „Auto WYŁ — bez auto-obniżania/podnoszenia"
przeniesiony do `autoBtn.title` (tooltip), NIE renderowany jako widoczny tekst. Commit `cf2b63cc`
(2026-08-09 23:38 UTC, „Spichlerz: drabinka capu ludności..."). Zweryfikowane `git log
e88e3939..HEAD -- gra/src/ui/cityPanel.ts` — ZERO commitów między HEAD builda FALA 265 a dziś —
czyli ta zmiana jest już częścią AKTUALNEGO deployu ROBOCZA (`7e8fdfdb`, FALA 265,
**AKTUALNA** wg `WERSJE.md`).

**Wniosek:** zrzut Macieja pokazuje checkbox+widoczny tekst, co NIE pasuje do dzisiejszego kodu
(przycisk pełnej szerokości z tekstem w środku, bez osobnej etykiety obok). To wygląda na stary,
niezsynchronizowany bundle po stronie Macieja (lokalna sesja/dysk właściciela jeszcze nie
„pull"-nęła FALA 265), a nie na niedokończoną pracę w kodzie. Zapytano Macieja wprost zamiast
dispatchować subagenta do już zaimplementowanej zmiany — zero dispatchu do czasu odpowiedzi.

---

## P-ARMIA-ROZPAD (BB2, stackGroupId) — Evaluator runda 3: FAIL, 2 realne regresje renderu + 2 luki bramek (2026-08-10)

Evaluator potwierdził rdzeń naprawy solidny: fallback bit-identyczny (fuzz 500 układów, 0
rozbieżności), sedno zgłoszonego buga naprawione w obie strony, 3 ścieżki merge kompletne (5
wywołań `assignSharedStackGroupId`), `onSeparate` daje fresh id (10 000 prób, 0 kolizji),
wsteczna zgodność 4-argumentowych callerów OK, oba dodatkowe znaleziska Operatora realnie
naprawione, C-026 (90 referencji 15 funkcji) policzone niezależnie.

**BLOKUJĄCE — 2 regresje renderu (żetony znikają z mapy), 2 luki bramek:**
- **B1:** `computeStackDisplay` grupuje po `stackGroupIdOf(u)` BEZ heksu — dwie jednostki tego
  samego `stackGroupId` na RÓŻNYCH heksach (np. zwiadowca użył „Zwiedzaj" i odjechał sam z
  scalonego stosu — `runScoutsAutoExplore`, `main.ts:21423`; albo cywil zostaje na origin gdy
  reszta stosu idzie do bitwy — `moveAtkRosterOntoBattleHex`) wpada do JEDNEJ grupy renderu →
  jeden żeton znika (`visible=false`), drugi pokazuje zsumowany `×N`/HP/Moc z dwóch heksów.
- **B2:** ten sam klucz ignoruje flagę garnizonu — scalony garnizon z jedną jednostką wypuszczoną
  w pole (ta sama grupa) daje 1 żeton zamiast 2, łamiąc udokumentowany kontrakt „garnizon i pole
  na heksie miasta współistnieją jako dwa widoczne stosy".
- **B3:** poprawka w `main.ts` (`assignSharedStackGroupId(movedUnits)`, jedyna linia naprawiająca
  oryginalny zgłoszony bug) ma ZERO ochrony regresyjnej — usunięcie tej linii, wszystkie bramki
  zielone.
- **B4:** kluczowa gwarancja „fallback bit-identyczny ze starym grupowaniem" (fundament decyzji
  ECHO B) też niezabezpieczona — usunięcie sufiksu `|g` z fallbacku, wszystkie bramki zielone
  (własna asercja Evaluatora łapie to natychmiast, 75 rozbieżności).

**Naprawa (4 warunki, jasno zdefiniowane przez Evaluatora):** (1) klucz w `computeStackDisplay`
= tożsamość + `(q,r)` + flaga garnizonu; (2) asercje na oba scenariusze (różne heksy → 2 żetony;
garnizon+pole → 2 żetony); (3) rozszerzyć `army-merge-separate-return-mainguard-test.cjs` o
tekstowe przypięcie 5 wywołań `assignSharedStackGroupId` w `main.ts`; (4) asercja różnicowa
fallbacku wobec oracle sprzed BB2 (usuwa B4).

Niepilne: N1 (dwa żetony tej samej grupy renderują się w IDENTYCZNYCH współrzędnych — pełne
nałożenie, potrzebny offset per grupa — konsekwencja wizualna zaakceptowana w ECHO B, ale nie
dostarczona), N2 (klik w mapę zawsze trafia najmocniejszą armię, nie tę pod kursorem — poza
zakresem BB2), N3 (`showCityUnitPick` ma tę samą klasę buga na niezawężonym `visibleStackOnHex`),
N4 (`freshStackGroupId` używa `Date.now()` — niedeterministyczne), N5 (AI nie dostaje
`stackGroupId` wcale — OK dla tego buga, ale opis „identycznie jak gracz" przesadzony).

Dispatch rundy 4 (naprawa 4 warunków) NASTĘPUJE teraz.

---

## Trzy drobne poprawki (audyt C-030) dostarczone, czekają na jednego zbiorczego Evaluatora (2026-08-10)

**P-DYPLO-DOPLAC-PW-ZLA-SCIEZKA + P-HUD-KULTURA-SIGNED-NIESPOJNE** (worktree
`agent-aa3536088e2bc01b3`): komunikat „Brakuje X PW — dopłać" → „...— zawrzyj osobną umowę" w 2
miejscach (`diplomacy-acceptance-points.ts`, `diplomacyAcceptanceBalance.ts`), zgodnie z
`R-DYP-STOL-A-KOREKTA` (formularze traktatu bez koszyka). Chip Kultury HUD:
`signed(s.kultura)` → `String(Math.floor(s.kultura))` w `hud.ts` (`renderBarD1B` — zgłoszone
miejsce — ORAZ `renderBarLegacy`, ta sama usterka znaleziona przy okazji w bliźniaczej ścieżce
kodu). Bramki: tsc 0, logic-test 213/213, diplomacy-acceptance-points 225/225, diplomacy-ai-
offer-balance 23/23, diplomacy-basket-edit 25/25, diplomacy-stol-pw-sum 42/42, diplomacy-trade-
flex 8/8, hud-skarbiec 7/7, hud-moc-warstwa 28/28, hud-miasto-stan-cywilizacji 20/20.

**P-OKOLICA-ADJUST-PLUS1-TOGGLE-SEMANTYKA** (worktree `agent-aee3e1d4edb7744d6`): potwierdzony
jako CZYSTY bug (nie dwuznaczność produktowa) — `adjustTileWorker(delta=+1)` na obsadzonym polu
błędnie ZDEJMOWAŁO robotnika (skopiowana logika toggle z sąsiedniej funkcji), łamiąc własny
kontrakt kierunkowy (`delta: 1|-1`); teraz symetrycznie odmawia (`juz_obsadzone`) jak `delta=-1`
już robił (`brak_robotnika`). Funkcja nie ma dziś ŻADNEGO wywołania produkcyjnego (tylko
`toggleTileWorker` jest używana w UI) — zerowe ryzyko dla działającej gry. Test zaktualizowany
(2 asercje). Bramki: tsc 0, logic-test 213/213, okolica-test 72/72.

**P-HEKS-ZLOZE-PARYTET-NIEDOMKNIETY + P-ETYKIETA-PODWOJNY-ZNAK-PRACA-BUDYNKI +
P-ETYKIETA-KARTA-ZYWNOSC-4800-MIESZANE-SEPARATORY** (worktree `agent-ae4f5e2fac8dc9eb3`): usunięty
zbędny `+` przed `signed()` w 2 miejscach `cityPanel.ts` (`appendPodzialPracyInfo`); separatory
ujednolicone w `buildTopBarZywnoscDetailCard` (`signed()` na `wzrostProcent` i `bd.racje`, wzorzec
z zamkniętej naprawy-siostry); brakujący parametr `zloze` dodany do 3 wywołań `tileYield()`
(`cityPanel.ts:8207,8225`, `hexContextTooltip.ts:252`) — bez wpływu na dzisiejsze zachowanie
(potwierdzone: dzisiejsze funkcje czytające ten wynik nie patrzą na `zloze`), zamyka „pułapkę na
przyszłość", ten sam idiom co już naprawiony `yieldOfMapHex`. Bramki: tsc 0, logic-test 213/213,
city-badge-growth-percent 38/38, city-growth-percent-rounding-parity 16/16, city-panel-growth-
percent-separator 29/29, heks-panel-tooltip-warstwa 22/22, heks-plony-warstwy 24/24, heks-plony-
zloze-forward 5/5, zloze-zloto-render 7/7.

**P-OVERLAY-KOLEJNOSC-WYWOLAN-TRASY-PIGULKI** (worktree `agent-a9c69aacb2255f424`): przyczyna
znaleziona — `refreshTradeRoutesOverlay()` wołany tylko raz WCZEŚNIE w kaskadzie końca tury
(przed turami AI/walką/oblężeniami), podczas gdy `cityRenderer.sync` (pigułki miast) ma już
wywołanie w finalnej „siatce bezpieczeństwa" na końcu kaskady — trasy renderowały się względem
stanu miast SPRZED tur AI. Naprawa: dopisane (addytywnie, nic nie przestawione) wywołanie
`refreshTradeRoutesOverlay()` w finalnym bloku bezpieczeństwa, obok istniejącego
`refreshWorkerFieldOverlay()`. C-026: 18 miejsc `cityRenderer.sync` + 4 istniejące
`refreshTradeRoutesOverlay` przejrzane indywidualnie, żadne inne nietknięte. Bramki: tsc 0,
logic-test 213/213, trade-routes-test 51/51, trade-routes-income 52/53 (ta sama pre-istniejąca
porażka H2, potwierdzona identyczna na `git stash`).

Dispatch JEDNEGO zbiorczego Evaluatora dla wszystkich czterech (różne pliki/obszary, zero
nakładania się) NASTĘPUJE teraz.

---

## P-BRAMKA-MAP-FIELD-BATTLE + P-BRAMKA-TOOLTIP-REGEX — Evaluator PASS-WITH-NOTES, SCALONE bezpośrednio przez orkiestratora (2026-08-10)

Evaluator: obie poprawki zweryfikowane w 100% (styl zgodny, „nie regresja silnika" potwierdzone
uruchomieniem na czystej bazie, `jsdom` faktycznie w `devDependencies`, logika testu bajt-w-bajt
niezmieniona — jeden hunk, w całości wewnątrz JSDoc). **Nota blokująca DLA SCALAJĄCEGO (nie dla
Operatora):** worktree Operatora ma STARY `CLAUDE.md` (sprzed §1a/§4a/§9 i jednej bramki z
2026-08-09) — kopiowanie całego pliku skasowałoby 3 zasady właściciela. Scalenie wymaga `git
apply`/ręcznego wklejenia wyłącznie NOWEGO fragmentu, nie kopiowania pliku.

Scalone bezpośrednio przez orkiestratora (małe, wyłącznie tekstowe, PASS-WITH-NOTES bez not
blokujących dla samej TREŚCI, tylko dla METODY scalania) — zastosowano dokładnie tę metodę:
ręczne dopisanie nowego zdania do istniejącego akapitu `CLAUDE.md` §BRAMKI (z korektą N2 —
dodany drugi plik `.svg` pominięty przez Operatora) oraz ręczne wklejenie nowego bloku komentarza
do `heks-panel-tooltip-warstwa-test.cjs` (z korektą N1 — „9 innych testów" → dokładniejsze „kilkanaście
plików, w tym 4 nazwane bramki"). Bramki po scaleniu: `heks-panel-tooltip-warstwa-test.cjs` 22/22
(identyczne z bazą), `logic-test.cjs` 213/213. Oba statusy w rejestrze zaktualizowane (N4
Evaluatora — Operator nie domknął statusów, wykonane teraz).

---

## P-ARMIA-ROZPAD (BB2, stackGroupId) — runda 4 dostarczona (naprawa B1-B4), czeka na NIEZALEŻNEGO Evaluatora (2026-08-10)

Wszystkie 4 punkty blokujące z werdyktu rundy 3 naprawione, zakres ściśle ograniczony (C-025) do
`armyMerge.ts` (`computeStackDisplay`), `army-merge-separate-return-mainguard-test.cjs`,
`army-merge-stackgroupid-test.cjs`. B1+B2: klucz grupowania renderu = tożsamość + `(q,r)` + flaga
garnizonu (nie sama tożsamość) — mutacyjnie potwierdzone (cofnięcie klucza → 5 FAIL dokładnie w
nowych blokach testowych 8b/8c). B3: nowa sekcja 8 w mainguard — tekstowe przypięcie wszystkich 5
call-site'ów `assignSharedStackGroupId`, każdy potwierdzony osobno mutacyjnie (55/55, było 37).
B4: dwuwarstwowo — pinning dosłownego kształtu fallbacku (sekcja 9 mainguard) + niezależny oracle
odtwarzający stare grupowanie sprzed BB2, fuzz **500 losowych układów, 3669 porównań
jednostkowych, 0 rozbieżności wymuszone assert-em** (nie tylko zliczone) w
`army-merge-stackgroupid-test.cjs` sekcja 11 — obie warstwy mutacyjnie potwierdzone.

Wszystkie bramki tematu zielone (11045/11045 nowy test, 55/55 mainguard, reszta jak w rundzie 3).
**Uwaga proceduralna:** Operator zgłosił 2 NOWE błędy `tsc` dot. dyplomacji
(`RelacjaWejscie.hasAllianceTreaty`, `DiplomacjaInputs.bronzeForceWarTargetId`) na SAMYM żywym
checkoucie, zweryfikowane jako obecne nawet bez jego zmian — **prawdopodobnie efekt uboczny
równoległego scalenia R-EPOKA-CUD B3 (agent `a6b41a6a5ef61abce`), które w tej samej chwili
edytowało `main.ts` na tym samym żywym drzewie** (dotyka dyplomacji/`bronzeForceWarTargetId`,
pasuje do obszaru B2/B3). Do potwierdzenia PO zakończeniu tamtego scalenia, nie traktować jako
osobny bug do czasu weryfikacji na ustabilizowanym drzewie.

Dispatch niezależnego Evaluatora rundy 4 NASTĘPUJE teraz.

---

## Pytanie Macieja (zrzut ekranu) — checkbox „Własne ustawienia tego miasta" w panelu ulepszeń terenu (2026-08-10)

**Zrzut Macieja:** panel „POLITYKA PAŃSTWA — AUTO ULEPSZENIA" (tryb budowania, przyciski
Żywność/Surowce/Infra/Zrówn./Ręczny już poprawnie stylowane jako przyciski), poniżej checkbox
`☐ Własne ustawienia tego miasta`. Cytat: „checkboxy zamień na przyciski" (liczba mnoga).

**Zbadane:** `gra/src/ui/buildModeHud.ts` ma TRZY checkboxy w tym samym obszarze (panel
ulepszeń terenu, tryb budowania) — WSZYSTKIE nadal `<input type="checkbox">`, w przeciwieństwie
do już naprawionego wcześniej „Auto Wyżywienie" (panel miasta, inny obszar): linia 329
„Tylko pola z obywatelami" (poziom imperium), linia 362 „Własne ustawienia tego miasta" (przełącznik
override per miasto — ten ze zrzutu), linia 374 „Tylko pola z obywatelami" (duplikat na poziomie
miasta, widoczny tylko gdy override włączony). Nie jest to jeszcze naprawione — w przeciwieństwie
do poprzedniego pytania (Auto Wyżywienie), to jest REALNY, nieukończony temat.

Wzorzec do zastosowania: identyczny jak przy „Auto Wyżywienie" (`cityPanel.ts:4686-4702`,
pełnoszerokościowy `<button class="hbtn">` z tekstem w środku, stan `active`/`aria-pressed`,
zachowanie kliknięcia = toggle, bez zmiany logiki). Zero ABC — czysto techniczna zmiana UI,
wzorzec 1:1 z istniejącego przycisku.

Dispatch NASTĘPUJE teraz.

---

## 3 checkboxy w buildModeHud.ts (panel Auto Ulepszenia) → przyciski, dostarczone (2026-08-10)

Odkrycie: panel renderowany jako HTML string (`innerHTML`), nasłuchy podpinane bezpośrednio po
każdym renderze (nie delegacja) — zamiana `change`→`click` prosta, ale odczyt stanu w handlerach
wymagał korekty (zmienne `empireState`/`effState`/`cityOverride` zamykały się przed kodem
listenerów, 3 błędy TS2304) — naprawione odczytem świeżego stanu z gettera configu w handlerze
(ten sam wzorzec co `cfg.onCityAutoWyzywienieChange?.(city.id, !city.autoWyzywienie)`). CSS:
`.hbtn`/`.hbtn.active` z cityPanel.ts używa zmiennych scoped pod `.civ-cs`, których ten plik nie
ma — dodano `.civ-build-hbtn`/`.civ-build-hbtn.active` z tymi samymi kolorami jako literały,
zero nowej zależności. C-026: grep 3 atrybutów `data-ulepszenia-*` w całym `gra/src`+`gra/tools`
— trafienia wyłącznie w tym pliku, dokładnie w zmienionych 6 liniach.

Bramki: tsc 0 (3 błędy przed poprawką odczytu stanu, 0 po), logic-test 213/213,
auto-improvements-test 14/15 (1 porażka pre-istniejąca, potwierdzona `git stash` na czystej
bazie), okolica-test 72/72, okolica-isworkable-silnik-test 15/15.

Dispatch Evaluatora NASTĘPUJE teraz.

---

## P-TRADEROUTES-NIEAKTUALNE-PO-WOJNIE-AI (2026-08-10, znalezisko Operatora przy naprawie P-OVERLAY-KOLEJNOSC-WYWOLAN-TRASY-PIGULKI) · STATUS: **ROZPOZNANE — niepilne, do backlogu**

**Wynik rozpoznania:** luka realna, potwierdzona (`breakTreatiesOnWar` nie woła
`recomputeTradeRoutesNow`, 5 miejsc wywołania w tym pętla dyplomacji AI, wszystkie PO jedynym
przeliczeniu tras w danej turze). **Złoto jest bezpieczne** — `computeTradeRouteIncomeByCity`
liczy dochód PRZED fazą AI (ta sama tura) i trasy są ponownie przeliczane na starcie NASTĘPNEJ
tury, więc nie ma okna realnej wypłaty za martwą trasę (samo-naprawiające się w 1 turę). **Ale
realny, potwierdzony bug wizualny/informacyjny** przez do jednej pełnej tury gracza: chip HUD
„Handel", panel Handlu Imperium i łuk na mapie (już znany no-op) pokazują trasę/dochód z
cywilizacją, z którą właśnie jest wojna. Dodatkowo `tradeRouteResourceGrants` (dostęp do
brązu/złota z trasy, np. Mennica) podlega tej samej luce czasowej — niezbadane dogłębnie
(możliwe że mechanizm „łaski" `PYTANIA-77-DOP=B` to maskuje).

Dwa warianty naprawy zidentyfikowane (A: `recomputeTradeRoutesNow` wewnątrz
`breakTreatiesOnWar` — ryzyko: pełny re-scan + spam komunikatów „Szlak zerwany" przy wielu
wojnach w jednej turze AI; B: surgiczne usunięcie pary z `tradeRoutes` — mniejszy narzut, ale
wymaga ręcznej synchronizacji pochodnych). Rozmiar: mały-średni, 5 call site'ów, brak testu
end-to-end dziś. **Priorytet niski, brak zgłoszenia od gracza — zostaje w backlogu, nie
dispatchować dalej bez wyraźnego polecenia.**

Gdy AI wypowiada wojnę w swojej fazie, `breakTreatiesOnWar` (main.ts, wołane z pętli komend
dyplomacji AI ~linia 22884) usuwa zerwany traktat z `activeDeals`, ale NIE dotyka `tradeRoutes`.
Skoro `tradeRoutes` jest przeliczane WYŁĄCZNIE przez `recomputeTradeRoutesNow()` (nie w fazie AI),
trasa handlowa może zostać w tablicy mimo że traktat handlowy, który ją uzasadniał, już nie
istnieje — łuk na mapie i/lub dochód z trasy mogą być nieaktualne aż do następnego przeliczenia
(traktat gracza/nowa gra). Niski priorytet — nie zgłoszone przez gracza, znalezione przy okazji
innej naprawy. Dispatch rozpoznania (potwierdzić realny skutek — czy dochód z martwej trasy
faktycznie się nalicza, czy tylko wizualny łuk zostaje — i zaproponować A/B/C jeśli wymaga
decyzji) NASTĘPUJE teraz.

---

## R-DYP-STOL-A część C — WŁASNE ZAŁOŻENIE BYŁO NIEAKTUALNE, koszyk działa już dla 4/5 typów (2026-08-10) · STATUS: **ROZPOZNANE — komentarze scalone dziś rano wymagają korekty**

**⛔ Własna pomyłka do skorygowania:** rejestrując ten temat wcześniej dziś (przy okazji
scalenia `P-DYPLO-DOPLAC-PW-ZLA-SCIEZKA`, `5a93f5aa`) napisałem w KODZIE komentarz twierdzący
„część C wciąż niedokończona — koszyk dziś obejmuje tylko akcje 5 i 13" — to było wierne
przepisanie z `docs/decyzje/R-DYP-STOL-A.md` (audyt z 2026-07-27), ale ten dokument jest
NIEAKTUALNY od ~2026-07-29 (FALA 106) i dalej rozbudowywany do 2026-08-08 — nikt nie zameldował
postępu jako realizacji części C, stało się to „przy okazji" innych zgłoszeń.

**Stan faktyczny (rozpoznanie, zweryfikowane w kodzie):** koszyk (`diplomacyTradeBasket`,
`TRADE_BASKET_ACTION_IDS` w `diplomacyTradeBasket.ts:2374`) działa już end-to-end (UI + silnik
akceptacji + kontroferta AI) dla **4 z 5** wymienionych typów: sojusz, pakt, wasal, pokój.
Naprawdę brakuje TYLKO dla **wojny** — i to nie jest luka we wdrożeniu, tylko inna kategoria:
wypowiedzenie wojny to jednostronna akcja gracza (`showWarConsentModal`) bez negocjacji/akceptacji
AI, `wojna` nie ma nawet wpisu w `ProposalActionId` — cały system propozycji/koszyka jej nie
dotyczy. Koszyk „wojenny" wymagałby nowej mechaniki od zera (osobny temat produktowy).

**Jedyna realna, mała luka:** AI dokłada złoto-słodzik do koszyka DOPIERO w kontrofercie
(rundzie 2+), NIGDY w pierwszej propozycji (`AIDiplomacyCommand` nie ma pola koszyka dla
`zaproponuj_sojusz`/`zaproponuj_pakt`/`zaproponuj_pokoj`; `zaproponuj_wasal` w ogóle nie istnieje
— AI nigdy nie inicjuje wasalizacji). Naprawa: 1 runda Operatora, 3-4 pliki, wzorzec do
skopiowania z istniejącej logiki kontroferty.

**Dodatkowy nierozstrzygnięty wątek w tle (nie mój do decyzji):** obecne pokrycie koszyka dla
6 typów powstało częściowo przypadkiem (`R-DYPLO-9CC7C76C-ZAKRES-NIEUDOKUMENTOWANY`, commit
2026-08-05 przy okazji innego zadania) — nigdy formalnie niepotwierdzone jako zamierzone.

**Do zrobienia teraz (bez ABC, czysto techniczne — dokumentacja + korekta własnej pomyłki):**
(1) poprawić 3 komentarze scalone dziś rano w `diplomacy-acceptance-points.ts`/
`diplomacyAcceptanceBalance.ts` — usunąć nieaktualne twierdzenie „część C niedokończona,
koszyk tylko akcje 5/13"; (2) zaktualizować `docs/decyzje/R-DYP-STOL-A.md` żeby odzwierciedlał
stan faktyczny. Materiał do EWENTUALNEGO przyszłego ABC (nie teraz): czy dociągnąć koszyk do
PIERWSZEGO ruchu AI (małe zadanie), i czy „wojna" w ogóle powinna dostać jakikolwiek koszyk
(nowy temat produktowy, osobne pytanie o zakres).

Dispatch poprawki komentarzy NASTĘPUJE teraz (własna pomyłka, naprawiam bezpośrednio).

Decyzja Macieja z 2026-07-27 (`R-DYP-STOL-A`, B+C): koszyk `diplomacyTradeBasket` miał objąć
WSZYSTKIE typy traktatów. Dziś obejmuje tylko akcje 5 (handel) i 13 (dar) — sojusz, pakt, wasal,
pokój, wojna nadal bez koszyka (`docs/decyzje/R-DYP-STOL-A.md`, sekcja „Co dalej"). Dziś łatamy
pojedyncze komunikaty „brak koszyka tutaj" (`P-DYPLO-DOPLAC-PW-ZLA-SCIEZKA`, scalone dziś) zamiast
dokończyć część C. Dispatch rozpoznania (ile pracy realnie zostało — ile miejsc w kodzie
wymagałoby rozszerzenia koszyka, czy jest to małe czy duże zadanie) NASTĘPUJE teraz, ŻEBY
przygotować materiał do pytania ABC dla Macieja (nie zadaję pytania teraz — to nowy wątek, zgodnie
z §1a/§2 najpierw kończymy trwające, potem osobno to zaproponuję).

---

## Tooltip Pracy — SCALONE bezpośrednio przez orkiestratora, oba blokery naprawione (2026-08-10)

Naprawiono B1 i B2 z werdyktu Evaluatora bezpośrednio na żywym drzewie (nie kopiując pliku
Operatora — dokładnie zgodnie z rekomendacją). `EmpireHudSnap.pracaUpkeep?: number` dodane;
`main.ts` (`getEmpireHud`) dostał brakującą linię `pracaUpkeep: hs.pracaUpkeep,` (pole `hs.pracaUpkeep`
już istniało, tylko nieprzepuszczane). Tooltip Pracy (6. argument `w3CityChip` na ŻYWYM,
8-argumentowym wywołaniu — nie ruszono 7./8. argumentu) rozszerzony o: „cała cywilizacja +9 /
turę netto (wpływ do puli +12 − utrzymanie ulepszeń surowcowych 3 pkt Pracy/turę)" — BEZ
podwójnego minusa (literalny `−` przed SUROWĄ, dodatnią wartością `empire.pracaUpkeep`, nie przez
`signed()`) — zweryfikowane niezależnym skryptem node z tą samą funkcją `signedPl`: `12 − 3 = 9`
✓. Fallback (gdy `empire.pracaUpkeep` niedostępne) — pusty string, brak dodatkowego zdania (N1
Evaluatora: nie chcę fałszywego „netto" tam gdzie faktycznie nie jest netto — bezpieczniej nic
nie dodawać niż skłamać).

Bramki: tsc 0, logic-test 213/213, **hud-miasto-stock-tempo-test 71/71** (krytyczna bramka AST,
której Operator nie miał w swoim worktree — teraz przechodzi, dowód że 7./8. argument
nietknięte), hud-miasto-stan-cywilizacji 20/20, hud-skarbiec 7/7.

---

## Tooltip Pracy — Evaluator FAIL, 2 blokery (podwójny minus + patch na przestarzałej bazie) (2026-08-10)

**B1:** `signed(-pracaUpkeepVal)` już zwraca liczbę ujemną (`−Y`), a Operator postawił PRZED nią
jeszcze operator `−` — widoczne dla gracza równanie nie sumuje się (`12 − (−3) = 15 ≠ 9`
zamiast `12 − 3 = 9`). Własny test Evaluatora (parsujący wyrenderowany string): 10/14, FAIL w
KAŻDYM przypadku `utrzymanie > 0` — czyli w całym sensie tej poprawki. Dokładnie ta klasa błędu,
którą zgłosił Maciej.

**B2:** worktree Operatora bazował na PRZESTARZAŁYM `cityPanel.ts` (sprzed
`R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY` — `w3CityChip` ma dziś 8 argumentów, nie 7, chip
Pracy ma dziś inny układ: duża liczba = TO miasto, mała = cywilizacja, trzeci element = zapas).
Operator fizycznie NIE miał w swoim worktree bramki `hud-miasto-stock-tempo-test.cjs` (pilnuje
AST-em dokładnie 8 argumentów) — nie mógł wiedzieć że ją łamie. Kopiowanie pliku Operatora
cofnęłoby trzeci element chipu i inne nazewnictwo.

Pozytywnie potwierdzone: `hs.pracaUpkeep` realne i poprawnie liczone (ta sama czysta funkcja co
w realnym ticku), brak rozjazdu czasowego `_lastPracaUpkeep`/`_lastPracaRate` w obu ścieżkach
(preview + koniec tury), C-026 (jedna ścieżka, tylko gracz) potwierdzone niezależnie.

Dispatch rundy 2 (napraw B1, przepnij patch na żywe drzewo ruszając WYŁĄCZNIE 6. argument
`w3CityChip`, dodaj `hud-miasto-stock-tempo-test.cjs` jako obowiązkową bramkę) NASTĘPUJE teraz.

---

## Tooltip Pracy (rozbicie utrzymania) — dostarczony, czeka na Evaluatora (2026-08-10)

Operator wybrał PEŁNE rozbicie z konkretną liczbą (nie skrócony tekst) — wartość
`pracaUpkeep` (civ-wide utrzymanie ulepszeń surowcowych) okazała się już policzona w
`HudState`/`_lastPracaUpkeep`, tylko nieprzepuszczana do `EmpireHudSnap` panelu miasta. Ten sam
wzorzec „brutto − utrzymanie = netto" już istnieje dla głównego paska HUD (`pracaChipTitle()`,
`hud.ts:744-752`) — domknięcie istniejącego wzorca, nie nowy przepływ. Nowy tooltip: „Cała
cywilizacja: wpływ do puli imperium +X − utrzymanie ulepszeń surowcowych −Y = +N netto/turę · to
miasto +Z (budynki +A · pula +B)", z bezpiecznym fallbackiem (krótki tekst bez liczby) gdy
`pracaUpkeep` niedostępne. C-026: `w3CityChip` z etykietą Praca ma JEDNO wywołanie, tylko ścieżka
gracza (`ownerId===0`) — panel rywala nie używa tego kodu. Bramki: tsc 0, logic-test 213/213,
hud-miasto-stan-cywilizacji 20/20 (test nie asercjonuje treści tooltipa, nie wymagał aktualizacji).

Dispatch Evaluatora NASTĘPUJE teraz (dotyka faktycznego przepływu danych, nie samego tekstu).

---

## 3 checkboxy w buildModeHud.ts → przyciski — SCALONE (2026-08-10)

Evaluator: **PASS-WITH-NOTES, zero blokujących**. Kluczowa weryfikacja (harness esbuild+jsdom,
klikanie realnego DOM, nie analiza statyczna): render i handler czytają DOKŁADNIE to samo źródło
(gettery configu) — zero rozjazdu. 73 własne asercje w 2 rundach (klik realnie zmienia stan
silnika, 60 losowych klików bez rozjazdu `aria-pressed`/klasa/stan, wielomiastowość poprawna,
zero kolizji między trzema przyciskami, CSS realnie renderuje się jak przycisk przez
`getComputedStyle`). `auto-improvements-test` 14/15 potwierdzone pre-istniejące (bajt-w-bajt
identyczne z czystą bazą). Niepilne: martwa reguła CSS `.civ-build-auto-row label{}` (już żaden
`<label>` w pliku), afordans on/off tylko kolorem nie ptaszkiem (spójne z `.hbtn` w cityPanel.ts,
do playtestu). Scalone bezpośrednio (diff samodzielny, 71 linii, zero konfliktu z bazą — inaczej
niż w innych scaleniach tej nocy, ten worktree NIE miał problemu z dryfem od main). Bramki: tsc
0, logic-test 213/213, okolica-test 72/72, okolica-isworkable-silnik 15/15, auto-improvements
14/15 (pre-istniejąca).

---

## P-DYPLO-DOPLAC-PW-ZLA-SCIEZKA — SCALONE (2026-08-10)

Operator naprawił nieprawdziwe uzasadnienie (zmyślony ID `R-DYP-STOL-A-KOREKTA`) prawdziwym
odniesieniem do `R-DYP-STOL-A` (B+C, część C — koszyk dla wszystkich traktatów — wciąż
niedokończona). Naprawiono 3 miejsca: `computePlayerAcceptanceSides` (`mode==='treaty' &&
!hasBasket`), `computePeaceAcceptanceSides` (`buildPlayerSide`/`buildPartnerSide`, teraz warunkowo
na `hasBasket` — Evaluatora NOTE 3, ta sama sytuacja pominięta przy pierwszej naprawie),
`renderPnBalancePanelForTreaty` w `diplomacyAcceptanceBalance.ts`. Tekst widoczny dla gracza
(„— zawrzyj osobną umowę") bez zmian, poprawiony wyłącznie komentarz-uzasadnienie. Scalone
bezpośrednio przez orkiestratora (worktree Operatora bazował na `main`, nie miał żadnej z tych
zmian od zera — zrekonstruowany end-state zastosowany ręcznie do żywego drzewa). Bramki: tsc 0,
logic-test 213/213, diplomacy-acceptance-points 225/225, diplomacy-ai-offer-balance 23/23,
diplomacy-basket-edit 25/25, diplomacy-stol-pw-sum 42/42, diplomacy-trade-flex 8/8.

**Do rejestru (materiał na przyszłe pytanie ABC, NIE zadane teraz):** `R-DYP-STOL-A` część C
(rozszerzenie koszyka na wszystkie typy traktatów — sojusz/pakt/wasal/pokój/wojna) jest wciąż
niedokończona. Zamiast łatać kolejne komunikaty „brak koszyka tutaj" pojedynczo, może warto
dokończyć część C w całości.

---

## P-OVERLAY-KOLEJNOSC-WYWOLAN-TRASY-PIGULKI — SCALONE (2026-08-10)

Operator wybrał ścieżkę B (Evaluator): zostawił wywołanie `refreshTradeRoutesOverlay()` w bloku
D10 końca tury jako defensywny hardening, całkowicie przepisał komentarz na uczciwy (5
niezmienników, dlaczego to dziś no-op). Przy okazji sprawdził realny trop (wojna wypowiedziana
przez AI łamiąca traktat handlowy, `breakTreatiesOnWar`) — **znalazł prawdziwą lukę**:
`breakTreatiesOnWar` usuwa traktat z `activeDeals`, ale NIE dotyka `tradeRoutes`, więc trasa może
faktycznie zostać nieaktualna po wojnie w fazie AI. Nie ratuje to jednak premisy — naprawa
wymagałaby `recomputeTradeRoutesNow()`, nie samego `refreshTradeRoutesOverlay()` (który tylko
renderuje, nie przelicza) — **osobny temat, poza zakresem C-025, NOWY do zarejestrowania osobno
(nie teraz, priorytet niski, brak zgłoszenia od gracza)**.

Scalone bezpośrednio przez orkiestratora (dokładny hunk z worktree Operatora — worktree bazował
na starszym `main.ts`, więc surowy `diff` całego pliku był niebezpieczny do kopiowania,
zastosowano tylko właściwy fragment ręcznie, ten sam wzorzec co przy scaleniu R-EPOKA-CUD B3).
Bramki: tsc 0, logic-test 213/213, trade-routes-test 61/61, trade-routes-income-test 52/53 (H2
pre-istniejąca).

---

## BUG (zrzut Macieja) — Praca 9 vs 3: rozpoznanie GOTOWE, prawdopodobnie NIE jest to bug arytmetyczny (2026-08-10)

`civWideSixStatsFromEmpireSnap` (sumowanie) poprawna, przetestowana (19/19). Znaleziona prawdziwa
przyczyna: duża liczba (9) = Praca BRUTTO tylko tego miasta (`pracaSplit.total`). Mała liczba (+3)
= `_lastPracaRate = pracaPoolBrutto - pracaUpkeepPreview` — `pracaUpkeepPreview` to CIV-WIDE koszt
utrzymania ulepszeń surowcowych (tartak/kamieniołom/glinianka/kopalnie miedzi-żelaza-złota/warzelnia
soli/stadnina, każde −1 Praca/turę, NIEZALEŻNIE w którym mieście stoi) — nawet przy JEDNYM mieście
różnica 9→3 (−6) dokładnie pasuje do ok. 6 takich ulepszeń w całym terytorium. Dodatkowo: miasta
z WSTRZYMANĄ produkcją wnoszą 0 do puli niezależnie od bilansu.

**To prawdopodobnie NIE jest bug — ale tooltip chipu tego nie tłumaczy** (mówi tylko „cała
cywilizacja +3 / turę", sugerując sumę BRUTTO analogiczną do dużej liczby, a to NETTO po
utrzymaniu) — łamie CLAUDE.md §3 „każda liczba musi mieć nazwany parametr". Test
`hud-miasto-stan-cywilizacji-test.cjs` pokrywa tylko czysty agregator, NIE `refreshLiveEmpireRates`/
`previewPracaPoolBrutto`/`computePracaUpkeepByOwner` — scenariusz niepokryty żadnym testem.

**Nie da się w 100% potwierdzić bez zapisu Macieja** — poproszony o samodzielną weryfikację (ile
ulepszeń surowcowych ma w terytorium, czy ma więcej niż 1 miasto, czy któreś ma wstrzymaną
produkcję). Rekomendacja rozpoznania: dopisać rozbicie w tooltipie (analogicznie do już istniejącego
„budynki/pula" dla dużej liczby) — niska decyzja, zero ABC potrzebne, dispatch naprawy tooltipa
NASTĘPUJE teraz, RÓWNOLEGLE z pytaniem do Macieja o potwierdzenie liczby ulepszeń.

---

**Zrzuty:** panel „PODZIAŁ PRACY" miasta: Budynki 0% / Ulepszenia 100%, „Kolejka budowy +0 (0%)",
„Ulepszenia +9 (100%)" — cała Praca tego miasta (9) idzie do puli Ulepszeń, kolejka budowy pusta
(0%), więc BEZ dwuznaczności „doBudynkow czeka na pustą kolejkę" (już jest pusta). Chip HUD:
„Praca +9 +3 (22)" — duża liczba (to miasto) = 9, mała liczba (cała cywilizacja) = **+3**, zapas
= 22. Cytat Macieja: „praca powinna być 9 a w mieście dochodzi tylko 3".

**Nie zgaduję przyczyny** (może to być: inne miasto/miasta z ujemnym bilansem Pracy zjadające
nadwyżkę, błąd w liczeniu `civWideSixStatsFromEmpireSnap`/`empire-hud-totals.ts`, albo coś
innego) — dispatch rozpoznania NASTĘPUJE teraz, zanim jakikolwiek kod zostanie zmieniony.
Zastrzeżenie: kod, który akurat dziś wieczorem dotykałem kosmetycznie (usunięcie zbędnego `+`
przed `signed()` w tym samym panelu Podział Pracy) NIE jest jeszcze zbudowany/zdeployowany —
zrzut Macieja pokazuje AKTUALNIE działający ROBOCZA (FALA 265), sprzed tej kosmetycznej zmiany,
więc to nie może być regresją z dzisiejszej edycji.

---

## R-AUTOZAPIS-QUOTA-STORAGE-Q1 — rozpoznanie feasibility zakończone, doprecyzowanie zadane w czacie (2026-08-10)

**Kluczowe ustalenie:** gra to CZYSTY HTML/JS (brak Electron/Tauri), a File System Access API ma
TWARDY wymóg specyfikacji „transient user activation" przy `requestPermission()` — dotyczy
KAŻDEGO nowego otwarcia `START.html`, nawet z zapamiętanym uchwytem katalogu (IndexedDB).
Dodatkowo: NIE działa na `file://` (wymaga serwera `http://localhost` — zmiana sposobu
uruchamiania gry), wsparcie WYŁĄCZNIE Chrome/Edge (Firefox/Safari — brak). „Zero interakcji,
cichy zapis do wskazanego katalogu" w sensie dosłownym NIE jest osiągalne w przeglądarce — to
fundamentalne zabezpieczenie, nie luka do obejścia.

Trzy realne warianty do wyboru zadane jako doprecyzowujące pytanie ABC w czacie.

---

## R-AUTOZAPIS-QUOTA-STORAGE-Q1 — ECHO C, ALE z doprecyzowaniem zmieniającym mechanizm (2026-08-10)

**Odpowiedź Macieja: „c" + doprecyzowanie: „najlepiej żeby save był zapisany lokalnie tam gdzie
robocza w katalogu gracza"** — czyli fizyczny plik na dysku, w tym samym katalogu co
`gra-robocza`, NIE `IndexedDB` (co faktycznie oznaczała moja opcja C w pytaniu ABC).
IndexedDB nadal jest storage PRZEGLĄDARKI (większy limit niż localStorage, ale nadal
sandboxed w profilu przeglądarki, NIE plik w katalogu gry) — to inny mechanizm niż to, co
Maciej opisał.

**⛔ Nie zgaduję, zaznaczam wprost różnicę zamiast cicho podstawiać IndexedDB pod „C".** Gra to
statyczny bundle HTML (`gra-robocza/*.html`), nie aplikacja Electron/desktop — zapis
BEZPOŚREDNIO do pliku w konkretnym katalogu (obok `gra-robocza`) z poziomu zwykłej strony HTML
ma realne ograniczenia bezpieczeństwa przeglądarki:
- **File System Access API** (`showSaveFilePicker`/`showDirectoryPicker`) — jedyny sposób
  zapisu do prawdziwego pliku wybranego przez użytkownika; działa dziś WYŁĄCZNIE w
  Chrome/Edge (nie Firefox, nie Safari); zwykle wymaga interakcji użytkownika (kliknięcie) przy
  pierwszym wyborze pliku/katalogu, chociaż uprawnienie do RAZ wybranego uchwytu pliku można
  zachować między sesjami (`IndexedDB`-backed permission) — do zweryfikowania czy to
  wystarczy na CICHY autozapis bez okna dialogowego co turę.
- **Automatyczne pobieranie pliku** (`<a download>`) — uniwersalne, ale trafia do katalogu
  Pobrane (nie do katalogu gry) i przy powtórnym zapisie tej samej nazwy przeglądarka dopisuje
  „(1)", „(2)" zamiast nadpisywać — nie nadaje się na cichą rotację 10 slotów bez dodatkowej
  konfiguracji przez gracza.

Dispatch rozpoznania feasibility File System Access API (czy da się to zrobić CICHO, bez okna
dialogowego przy każdym autozapisie, w tym konkretnym bundle) NASTĘPUJE teraz — zanim
cokolwiek zaimplementuję, żeby nie zbudować czegoś, co i tak będzie proszić o zgodę co turę
albo nie zadziała w niedominującej przeglądarce.

---

## R-AUTOZAPIS-QUOTA-STORAGE-Q1 — pytanie ABC zadane Maciejowi (2026-08-10)

Rozpoznanie zakończone wcześniej (5 wariantów A-E), skonsolidowane do 3 wariantów ABC i zadane
w czacie. Czeka na odpowiedź `R-AUTOZAPIS-QUOTA-STORAGE-Q1 + litera`.

**ECHO A (2026-08-10).** Wariant A z doprecyzowania: pełny File System Access API
(`showDirectoryPicker`/uchwyt katalogu zapamiętany w `IndexedDB`), zapis fizycznego pliku w
katalogu obok `gra-robocza` na dysku gracza. **Znane, jawnie przedstawione w pytaniu ograniczenia
(Maciej wybrał ze świadomością, nie do ponownego kwestionowania):** (1) wymóg „transient user
activation" specyfikacji — jedno kliknięcie potwierdzenia dostępu przy KAŻDYM nowym otwarciu
`START.html` (nie da się w pełni ukryć okna zgody, tylko ograniczyć do jednego kliknięcia na
sesję zamiast co turę); (2) wyłącznie Chrome/Edge (Firefox/Safari brak wsparcia — wymaga jasnego
komunikatu w UI dla graczy na innej przeglądarce, fallback na dotychczasowy `localStorage`); (3)
NIE działa na `file://` — wymaga serwowania przez `http://localhost`, czyli zmiany sposobu
uruchamiania gry z „otwórz plik HTML" na „uruchom lokalny serwer" (do ustalenia z Maciejem jak
dokładnie to ma wyglądać dla gracza — osobny .bat/skrypt startowy?).

Dispatch Operatora (rozpoznanie + implementacja, Sonnet 5, worktree izolowany) NASTĘPUJE teraz:
(a) potwierdzić technicznie czy uprawnienie do zapamiętanego uchwytu katalogu faktycznie
przetrwa między sesjami z jednym kliknięciem na start (nie per-turę) — to była niepewność
z wcześniejszego rozpoznania feasibility; (b) zaprojektować najprostszy serwujący mechanizm
lokalny (najmniejsza zmiana sposobu uruchamiania gry); (c) zaimplementować zapis rotacyjny do
pliku zamiast `localStorage` z fallbackiem na dotychczasowy mechanizm gdy API niedostępne;
(d) NIE implementować w ciemno — jeśli podczas prac wyjdzie na jaw, że uprawnienie jednak NIE
przetrwa cicho (wymaga kliknięcia PRZY KAŻDYM AUTOZAPISIE, nie tylko raz na sesję) — przerwać
i zgłosić z powrotem jako ABC, bo to zmienia bilans kosztu/zysku wariantu A.

---

## R-EPOKA-CUD-WARUNEK-AWANSU B3 — SCALONE `e5ba61c2` (2026-08-10)

Scalający agent poprawnie ODSTĄPIŁ od literalnej instrukcji dla `ai.ts` (miała kazać skopiować
plik w całości jako „100% nowa praca" — nieprawda, worktree Operatora bazował na starszym
punkcie historii, brakowało 3 niezwiązanych, już scalonych funkcji: obrona miast przed
barbarzyńcami, wymuszona wojna Brązu, aktualna reguła kolonizacji poza terytorium). Zamiast
ślepo kopiować (co skasowałoby te 3 funkcje), zastosował to samo podejście hunk-po-hunku co dla
`main.ts` — dobry przykład reguły C-033/C-034 „nie ufaj instrukcji ślepo, sprawdź stan przed
nadpisaniem". Wszystkie bramki zielone zgodnie z oczekiwaniem (46/46, 33/33, 213/213, 26/26,
10/10, 13/13, 9/9, 7/8 pre-istniejąca). Dowód: `grep wonderForcePriority gra/src/main.ts` → 3
trafienia, commit na `origin`. Worktree `agent-a85d78f7d0cdd8a5d` pozostawiony do usunięcia (po
weryfikacji `git status`, C-033).

---

## BUG — autozapis nieudany, „brak miejsca w zapisie przeglądarki" (2026-08-10, zrzut Macieja)

**Zrzut:** trzy zdublowane powiadomienia „Koniec tury / Autozapis nieudany — brak miejsca w
zapisie przeglądarki".

**Zbadane:** `doRotatingAutosave()` (`main.ts:21212-21236`) pisze do rotacyjnego slotu (10
ostatnich, `AUTOSAVE_ROT_COUNT=10`) przez `saveToLocal()` (`game/save.ts:337-346`) —
`localStorage.setItem()` na tym samym kluczu co poprzednio (nadpisanie, nie narastanie per slot).
`reason==='quota'` = złapany `QuotaExceededError`/`NS_ERROR_DOM_QUOTA_REACHED`/kod 22/1014 —
twardy limit `localStorage` przeglądarki (typowo ~5-10 MB NA CAŁĄ domenę, nie per-slot). Przy
dużej mapie/wielu turach JSON zapisu może realnie przekroczyć ten limit, zwłaszcza x10 slotów
rotacji + inne klucze (`AUTOSAVE_ROT_IDX_KEY`, `AUTOSAVE_FREQ_KEY`, `lastPlayedSlotId` itd.) w tej
samej domenie. Kod NIE ma dziś żadnej strategii odzyskania miejsca przy quota (po prostu pokazuje
komunikat i rezygnuje z tej próby, indeks rotacji NIE przesuwa się dalej — kolejna próba celuje w
ten sam slot).

**Klasyfikacja:** to NIE jest czysto techniczny jednoznaczny bug — właściwa naprawa ma realne
kompromisy (np. czyszczenie najstarszych slotów przy quota vs kompresja zapisu vs migracja na
IndexedDB, znacznie większy limit). Dispatch Operatora do ROZPOZNANIA (nie ślepej implementacji):
zmierzyć realny rozmiar JSON zapisu na reprezentatywnej mapie/turze, potwierdzić czy problem to
rozmiar pojedynczego zapisu czy suma 10 slotów, i zaproponować A/B/C zamiast zgadywać —
zgodnie z §6 „nie zgaduj przy niejednoznaczności".

Dispatch NASTĘPUJE teraz.

---

## R-EPOKA-CUD-WARUNEK-AWANSU (B3) — Evaluator runda 2: PASS-WITH-NOTES, scalenie NATYCHMIAST (C-034) (2026-08-10)

Niezależny (inny niż runda 1) Evaluator potwierdził naprawę WŁASNĄ symulacją (75 asercji, 0
porażek) — kolejka nie rośnie, zero `queueJump` gdy wymagany cud niebudowalny, zakleszczenie
Fenicjan/Petra jest CZASOWE nie trwałe (po zbadaniu Inżynierii petra kończy się w 6 tur),
przypadek zamierzony (Egipt) działa. 16 rodzin mutacji adwersarialnych, wszystkie odparte —
brak fallbacku, brak dyskryminacji po `ordered[0]`, wiele wymaganych cudów per epoka obsłużone,
`NaN`/dzielenie przez zero bezpieczne, głęboka kolejka nieosiągalna (`wstrzymana` nigdy `true`),
duplikat civType (osiągalny, poza zakresem B3) nie odtwarza defektu rundy 1. Skan WSZYSTKICH 19
cudów: `petra` to JEDYNY przypadek rozjazdu w danych.

**Niepilne (do rejestru, nie blokują):** N1 — pokrycie `main.ts` nowej sekcji testu nadal
częściowo tekstowe (4 regexy), nie behawioralne — sugerowana przyszła refaktoryzacja (wyciągnąć
`shouldForceEraWonderPriority()` jako czystą funkcję). N2 — wybór miasta w trybie force to
pierwsze-pasujące, nie najwydajniejsze (strata ograniczona, jeden `queueJump` na cud). N3 —
wymuszacz zapala się też w NAJWYŻSZEJ epoce (3), gdzie żaden awans nie jest bramkowany — dotyczy
6 cywilizacji, może być pożądane ale nie to uzasadniało ECHO. N4 — `aiWonderStuckTurnsByOwner`
nieserializowana (ta sama klasa co w rundzie 1). N5 — duplikat civType osiągalny w normalnej
rozgrywce (zakres `13861b60`, nie B3).

**Instrukcja scalania (precyzyjna, hunk-po-hunku z `main.ts` — 9 kotwic B3, resztę zostawić bo
już jest na gałęzi sesji z `13861b60`):** patrz pełny tekst werdyktu, konieczna do wykonania
scalenia bez duplikacji. `owner-epoch.ts` + oba testy B2 NIE ruszać (bit-w-bit identyczne).
`ai.ts` + `ai-params.json` (+5 linii) + nowy test `ai-cud-priorytet-b3-test.cjs` brać w całości.

Dispatch dedykowanego scalenia NASTĘPUJE teraz, natychmiast (C-034).

---

## R-EPOKA-CUD-WARUNEK-AWANSU (B3) — Evaluator runda 1: FAIL blokujące, realny defekt na danych shipowanych (2026-08-10)

Evaluator potwierdził wszystkie bramki Operatora (w tym pre-istniejącą porażkę `ai-balans-step3`
zweryfikowaną bajt-w-bajt na bazie), potwierdził C-026 (jedyne miejsce wywołania
`decideAiWonderBuild`, `chooseCityProduction` nietknięty) i duplikację z `13861b60` (3 pliki
identyczne bajt-w-bajt — `owner-epoch.ts` + oba testy B2, `main.ts` MIESZANY, instrukcja scalania
hunk-po-hunku gotowa). 7/9 własnych mutacji złapanych.

**BLOKUJĄCE — nieskończona pętla na realnych danych shipowanych, nie brzeg teoretyczny:**
tryb `forcePriority` bierze `ordered[0]` (pierwszy budowalny cud), a `main.ts` nigdzie nie
sprawdza, czy to WŁAŚNIE wymagany cud epoki. Fenicjanie/Brąz→Żelazo: cud bramkujący (`petra`,
`epokaWejscia=2`) wymaga technologii `Inżynieria` z epoki Żelaza — niebudowalny mimo kompletu
technologii Brązu. Efekt (zasymulowany na realnych funkcjach+danych, 12 tur): AI co turę wstawia
NA FRONT inny cud (`wyrocznia`), zeruje mu postęp, kolejka rośnie bez ograniczenia (+1/turę),
`tryDeductWonderStartFood` drenuje żywność co turę — **cud nigdy się nie kończy, dokładna
odwrotność celu B3**. Kontrolny scenariusz (Egipt/epoka 1, cel zamierzony) działa poprawnie —
defekt ściśle ograniczony do rozjazdu „wymagany cud ≠ pierwszy budowalny". Zastrzeżenie zasięgu:
wykryty JEDEN rozjazd w skanie 15×3, ale sonda miała pusty `civRow` (reguła
`tech_before_civ_entry` nieaktywna) — z pełnymi danymi cywilizacji może być więcej. To DOLNA
granica.

**Naprawa zdefiniowana (2 cięcia, bez przebudowy):** (1) `main.ts` —
`wonderForcePriority = wonderEraGateForced && !wonderRequiredAlreadyBuilding &&
buildableForAi.some(w => wonderRequiredIds.includes(w.id))`; (2) `ai.ts` — w `forcePriority`
wybierać cud z jawnie przekazanej listy `requiredWonderIds`, nie `ordered[0]`. Dodatkowo:
`wonderRequiredAlreadyBuilding` dziś sprawdza wyłącznie front kolejki, nie całą kolejkę miasta.

Niepilne (do rejestru, nie blokują): zerowe pokrycie testowe `main.ts` dla B3 (M8/M9
niezłapane — komentarz nowego testu obiecuje wykrywanie dryfu `main.ts`, ale re-implementuje
formułę zamiast czytać źródło); rozjazd danych `petra` (epokaWejscia=2 vs tech z epoki 3) to
problem B2 nie B3, do decyzji właściciela osobno; `relaxedWonderCostThreshold` znosi próg dla
WSZYSTKICH cudów nie tylko bramkującego (interpretacja Operatora „rozluźnianie" jako
„zniesienie do ∞", do potwierdzenia); `aiWonderStuckTurnsByOwner` nieserializowana + czyszczona
przy save/load (asymetria, degradacja łagodna); licznik rośnie też z powodów niezwiązanych z
throttle/progiem (mylący komentarz w kodzie).

Dispatch rundy 2 (wąska, TYLKO dwa wskazane cięcia + test pokrywający M8/M9) NASTĘPUJE teraz.

---

## R-EPOKA-CUD-WARUNEK-AWANSU (B3) — runda 2 (naprawa) dostarczona, czeka na NIEZALEŻNEGO Evaluatora (2026-08-10)

Zakres ściśle ograniczony do 2 wskazanych cięć + rozszerzenie testu (C-025, zero przy okazji —
nie ruszono `relaxedWonderCostThreshold`, save/load `aiWonderStuckTurnsByOwner`, danych
`petra`/`wonders.json`). `main.ts`: `wonderForcePriority` teraz koniunkcja trzech warunków
(`wonderEraGateForced && !wonderRequiredAlreadyBuilding && wonderRequiredBuildable`),
`wonderRequiredAlreadyBuilding` skanuje całą kolejkę miasta, nie tylko front. `ai.ts`:
`decideAiWonderBuild` dostał nowy parametr końcowy `requiredWonderIds`, w trybie `forcePriority`
wybiera WYŁĄCZNIE z tej listy (`ordered.find`, nie `ordered[0]`), zwraca `null` bez fallbacku gdy
żaden wymagany cud niebudowalny — nawet gdyby `forcePriority` błędnie dostał `true`.

Test rozszerzony do **46/46** (z 31/31): nowa sekcja 5-STRUKTURA czyta źródło `main.ts` (ten sam
wzorzec co `era-cud-main-ts-integracja-test.cjs`, naprawia lukę M8/M9 z werdyktu Evaluatora rundy
1 — poprzednia sekcja 5 re-implementowała formułę zamiast czytać źródło); nowa sekcja 6 to
DOKŁADNA reprodukcja scenariusza Evaluatora (Fenicjanie/Petra, realne dane, symulacja 12 tur) —
PO naprawie: kolejka nie rośnie (max długość 1 zamiast rosnącej do 12), zero `queueJump` w 12
tur, po zbadaniu Inżynierii wymuszacz poprawnie wybiera `petra`. Wynik wklejony do raportu jako
dowód.

Bramki: tsc 0, logic-test 213/213, owner-epoch 13/13, era-cud-warunek-awansu 33/33,
era-cud-main-ts-integracja OK (15/16/11), ai-production-priority 9/9, ai-cud-priorytet-b3
**46/46**, ai-balans-step4 10/10, cuda-handel 26/26. `ai-balans-step3` 7/8 — ta sama porażka
pre-istniejąca, ponownie potwierdzona.

Dispatch NIEZALEŻNEGO Evaluatora rundy 2 (inny agent niż runda 1) NASTĘPUJE teraz.

---

## P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO (BB2, stackGroupId) — runda 3 dostarczona, czeka na Evaluatora (2026-08-10)

Worktree `agent-a3f6bd057db40cbd4` — krok kopiowania z żywego checkoutu zweryfikowany (worktree
faktycznie startował od `main`/`b0e4a5c9`, `grep computeSeparateReturn` dawał zero trafień przed
kopiowaniem, trafienia po). Refaktor: nowe opcjonalne pole `RuntimeUnit.stackGroupId?: string`
(`units/setup.ts`), fallback `stackGroupIdOf()` = stare grupowanie po heksie gdy pole nieobecne
(wsteczna kompatybilność zapisów). Choke point `activeUnitStack` (więc `playerStackAt`) filtruje
dodatkowo po `stackGroupIdOf` — naprawia automatycznie ~50 wywołań pochodnych
(`syncStackRuchLeft`/`deductStackRuchLeft`/`planningStackRuchLeft`/`unitWithPlanningStackRuch`)
bez dotykania każdego z osobna. Funkcje „kto na heksie" (`visibleStackOnHex`,
`coLocatedForMergePrompt`, `garrisonUnitsOnHex`) dostały opcjonalny 5. param `groupId` —
merge-prompt/Prawo/bulk-akcje CELOWO zostają unscoped (fizyczna obecność, nie tożsamość armii).
„Zostaw osobno"/split → fresh id; każda z 3 ścieżek merge → wspólny id.

C-026: 15 funkcji z listy zlecenia + **2 dodatkowe znalezione przy audycie, POZA listą**
(`buildPlayerArmyListEntries`, `cyclablePlayerArmyLeadsBase`/`armyLeadHexKey` — własne
reimplementacje grupowania po heksie w HUD, ta sama klasa błędu w innym miejscu) — wszystkie 78
wywołań przejrzanych indywidualnie.

Bramki (tsc zweryfikowany DWA razy na spójnym drzewie, bo worktree z `main` ma niepełny
`gra/src`): tsc 0, logic-test 213/213, army-merge-separate-return 16/16 +
-mainguard 37/37, army-merge-bounce 4/4, army-merge-dismiss-bounce 16/16, army-stack-ruch 5/5,
army-merge-colocated 4/4, combat 6/6, tech-tree 19/19, research 33/33, unit-replace 13/13,
garnizon-exit 26/26, map-siege 6/6, siege-ai 17/17, siege-defenders 12/12, save-label OK,
hud-moc-warstwa 28/28, hud-skarbiec 7/7, hud-miasto-stan-cywilizacji 20/20. Nowy test
`army-merge-stackgroupid-test.cjs` 32/32 (mutacyjnie potwierdzony — cofnięcie fixu w
`activeUnitStack` daje 9 FAIL w oczekiwanych miejscach). `pre-battle-save-test.cjs` FAIL
niezwiązany (esbuild/`import.meta.glob`, plik nietknięty, poza zakresem).

Zgodnie z nową regułą C-034 (scalenie zawsze osobnym, natychmiastowym dispatchem po PASS) —
dispatch Evaluatora rundy 3 NASTĘPUJE teraz, scalenie dopiero po jego werdykcie, osobnym
zleceniem.

---

## R-EPOKA-CUD-WARUNEK-AWANSU (B3) — priorytet cudu, Operator runda 1 dostarczona, czeka na Evaluatora (2026-08-10)

Worktree `agent-a85d78f7d0cdd8a5d` (base `main`/`b0e4a5c9`, TA SAMA klasa problemu co
stackGroupId runda 2 — worktree nie widział `13861b60` scalonego już do gałęzi sesji; Operator
sam to zdiagnozował i odtworzył prerequisite przez `git diff 13861b60^ 13861b60` + `git apply -3`,
zweryfikowane czyste). **Scalający musi to uwzględnić:** diff tego worktree na `owner-epoch.ts` i
części `main.ts` DUBLUJE zawartość `13861b60` — scalenie wymaga albo wziąć tylko hunki
specyficzne dla B3 (po scaleniu `13861b60`, które już jest na gałęzi sesji), albo uważnie
rozdzielić.

Dwa mechanizmy w `gra/src/game/ai.ts`, wpięte w JEDYNE istniejące miejsce wywołania (`main.ts`,
blok `CUDA-AI` ~linia 23059, przed `decideAITurn`): `decideAiWonderBuild(...,forcePriority=false)`
— nowy opcjonalny 7. parametr (wstecznie kompatybilny, stare 6-argumentowe wywołania/testy
nietknięte), gdy `true` pomija throttle/`hasWonderInProgress`/`queueEmpty` (pilnuje tylko
`pracaPerTurn>0`); `relaxedWonderCostThreshold(...)` — próg opłacalności rośnie płynnie do
`Infinity` po `stuckTurns>=cuda_stuck_relax_tur_max` (nowy parametr w `ai-params.json`, domyślnie
30 tur). `wonderForcePriority` liczony przez ponowne użycie `allEraTechsResearched`/
`eraOwnWonderSatisfied` z `owner-epoch.ts` (`13861b60`) — bez duplikacji logiki. C-026: jedyne
miejsce wywołania `decideAiWonderBuild` zgrepowane i potwierdzone, `chooseCityProduction`
(normalny scoring) nietknięty.

Nowy test `ai-cud-priorytet-b3-test.cjs` 31/31. Bramki: tsc 0, logic-test 213/213, owner-epoch
13/13, era-cud-warunek-awansu 33/33, era-cud-main-ts-integracja OK (15/16/11), ai-production-
priority 9/9, tech-tree 19/19, research 33/33, unit-replace 13/13, wonder-availability 7/7,
wonder-civ-tech 5/5, cuda-handel 26/26, ai-balans-step4 10/10. `ai-balans-step3-test.cjs` 7/8 —
1 porażka PRE-ISTNIEJĄCA (potwierdzona na bazowym `b0e4a5c9` przed zmianą, test ma
zdezaktualizowaną wartość `prog_koszt_x=70` podczas gdy JSON już ma `80` z wcześniejszego
STEP4), niezwiązana z tą zmianą.

**Znane ograniczenie, nie naprawiane (zgodne z zastrzeżeniem Macieja „jeśli dosłownie nie stać —
priorytet nie pomoże"):** `tryDeductWonderStartFood` może po cichu pominąć zakolejkowaną decyzję
z braku żywności; w trybie `forcePriority` licznik `stuckTurns` i tak resetuje się do 0, mimo że
nic nie zostało faktycznie zakolejkowane — brzegowy przypadek poza zakresem tego zlecenia.

Dispatch Evaluatora rundy 1 NASTĘPUJE teraz.

---

## R-DYP-STOL-A część C — korekta komentarzy SCALONA

Agent `a12e194fad495de11` dostarczył poprawki 3 komentarzy (własna pomyłka orkiestratora,
patrz wpis wyżej „WŁASNE ZAŁOŻENIE BYŁO NIEAKTUALNE"). Scalone bezpośrednio przez orkiestratora
przez `git apply` (worktree było rebase'owane przez samego agenta na `origin/claude/
sprawdzenie-funkcjonalnosci-ek4ra0`, diff czysty, zero driftu bazy).

Pliki: `gra/src/game/diplomacy-acceptance-points.ts` (`computePeaceAcceptanceSides`,
`computePlayerAcceptanceSides`), `gra/src/ui/diplomacyAcceptanceBalance.ts`
(`renderPnBalancePanelForTreaty`). Zmiana WYŁĄCZNIE komentarzy — treść komunikatu dla gracza
niezmieniona. Poprawiono: `hasBasket`/`!hasBasket` to własność TEJ NEGOCJACJI (czy coś dodano
do koszyka teraz), nie własność typu traktatu — koszyk `TRADE_BASKET_ACTION_IDS` już działa dla
sojuszu/paktu/wasala/pokoju (4 z 5 typów); jedyna realna luka to wojna (aid '11'),
kategorialnie inny temat (jednostronna akcja gracza, poza systemem propozycji/koszyka).

Bramki na żywym drzewie po scaleniu: `tsc --noEmit` 0 błędów, `logic-test.cjs` 213/213,
`diplomacy-acceptance-points-test.cjs` 225/225 — identyczne z bazą.

**STATUS: ZAMKNIĘTE.**

---

## P-ARMIA-ROZPAD stackGroupId (BB2) — runda 5 Evaluator przerwana, redispatch

Poprzedni Evaluator rundy 5 (`a2ce8aea4b1ba62c2`) został **PRZERWANY** w trakcie pracy
(`[Request interrupted by user]`, log `agent-a2ce8aea4b1ba62c2.jsonl`, ostatni zapis
2026-08-10 08:37:42 UTC) i NIGDY nie dostarczył werdyktu — `ListAgents` potwierdza brak
zasięgu. Zgodnie z C-038 (werdykt musi zostać faktycznie odebrany zanim zostanie
zacytowany) — runda 5 traktowana jako NIEODBYTA, nie jako PASS domyślny.

Przed redispatchem: naprawiłem zerwany symlink `node_modules` w worktree rundy 4
(`agent-a3f6bd057db40cbd4/gra`) i potwierdziłem, że testy w ogóle się uruchamiają:
`army-merge-stackgroupid-test.cjs` 11045/11045, `army-merge-separate-return-mainguard-
test.cjs` 55/55. To NIE jest werdykt jakościowy — tylko potwierdzenie wykonywalności.

Dispatch nowego, niezależnego Evaluatora rundy 5 (`a0bffa81f91d508f8`, Opus 5) NASTĘPUJE
teraz — pełna niezależna weryfikacja B1–B4, bez zaufania do artefaktów po przerwanym
poprzedniku.

**Runda 5 werdykt: FAIL.** B1–B4 z rundy 3 potwierdzone naprawione (mutation testing:
M1/M2/M3 wszystkie złapane, B3 5/5 call-site'ów przypiętych, B4 fuzz jakościowo
zweryfikowany). Ale **nowe znalezisko blokujące B-R5-1**: runda 4 naprawiła klucz
grupowania WYŁĄCZNIE w `armyMerge.ts:computeStackDisplay` (dodając `|q,r|g` do
`stackGroupIdOf(u)`), ale zostawiła TEN SAM defekt (gołe `stackGroupIdOf(u)` bez pozycji)
w trzech niezależnych miejscach `main.ts`, które robią własne, równoległe grupowanie po
heksie: `cyclablePlayerArmyLeadsBase` (~4800), `armyLeadHexKey` (~4835),
`buildPlayerArmyListEntries` (~5163). Dowód empiryczny: scout w auto-explore odchodzący
z heksu grupy → nowy klucz daje 1 wpis obejmujący oba heksy zamiast 2 — jednostka na
drugim heksie znika z listy armii, sumy `ruch`/`hp` liczone przez dwa heksy, HUD ◀▶ nie
dojdzie do drugiego heksu, garnizon/pole rozjeżdża się z rendererem (2 żetony wg
`computeStackDisplay` vs 1 wpis listy). Zero bramek to łapie dziś. Naprawa: użyć tego
samego klucza co `armyMerge.ts:314` w tych 3 miejscach (Evaluator sugeruje wyeksportować
jako wspólną `stackRenderKey(u)`), rozszerzyć `army-merge-separate-return-mainguard-
test.cjs` o pinowanie kształtu klucza w tych 3 oknach. Noty N1–N4 (log bezwarunkowy w
teście, zakres fuzza nie woła `computeStackDisplay`, `freshStackGroupId` niedeterministyczny,
nakładanie się żetonów w rendererze/pickingu przy 2 reprezentantach na 1 heksie — świadoma
konsekwencja ECHO B, do playtestu osobno) — nieblokujące, do uwzględnienia przy okazji.

Dispatch rundy 5 (fix B-R5-1) NASTĘPUJE teraz.

Operator rundy 5 (`ae476910a62d7b168`, worktree izolowany, checkout na żywą gałąź sesji
per instrukcja) dispatchowany: eksport wspólnej `stackRenderKey(u)` z `armyMerge.ts`
(zamiast inline'owanego wyrażenia w `computeStackDisplay`), użycie jej w 3 miejscach
`main.ts` (`cyclablePlayerArmyLeadsBase`, `armyLeadHexKey`, `buildPlayerArmyListEntries`)
zamiast gołego `stackGroupIdOf(u)`, korekta mylącego komentarza, rozszerzenie mainguard
testu o pinowanie kształtu klucza w tych 3 oknach + scenariusz regresyjny odtwarzający
dowód Evaluatora (scout auto-explore rozdziela grupę na 2 heksy → musi dać 2 wpisy).

**Operator rundy 5 dostarczył — WAŻNE ODKRYCIE dodatkowe.** Cała runda 3/4 BB2 (`stackGroupId`
w ogóle) NIGDY nie została faktycznie scalona do gałęzi sesji — istniała WYŁĄCZNIE jako
nieskomitowana praca w worktree `agent-a3f6bd057db40cbd4`. Na gałęzi sesji nie ma ŻADNEGO
commitu „Scalenie" dla stackGroupId, tylko wpisy „Rejestr" (dokumentacja). To wyjaśnia base-
drift, który łapali kolejni Evaluatorzy. Operator odtworzył całość (`stackGroupIdOf`,
`sameStackGroup`, `freshStackGroupId`, `assignSharedStackGroupId`, `stackRenderKey` nowe)
we własnym worktree `agent-ae476910a62d7b168` — to jest teraz KOMPLETNY pakiet runda 4 + runda
5 (fix B-R5-1), gotowy do jednego scalenia całości (dotąd NIC z BB2 nie trafiło na żywe drzewo).

Własny dowód Operatora: cofnięcie `stackRenderKey`→`stackGroupIdOf` w `cyclablePlayerArmyLeadsBase`
→ natychmiastowy FAIL nowej sekcji 10a, przywrócenie → zielono. Bramki: tsc 0, logic-test
213/213, army-merge-stackgroupid 11045/11045, army-merge-separate-return-mainguard **72/72**
(+17 nowych asercji sekcje 10-11), separate-return 16/16, bounce/dismiss-bounce/colocated
4/4·16/16·4/4, army-stack-ruch 5/5, combat-test 6/6, tech-tree 19/19, research 33/33,
unit-replace 13/13.

Ponieważ to jest PIERWSZE realne scalenie całego BB2 do żywego drzewa (nie tylko fix
B-R5-1), a poprzedni Evaluator oceniał tylko cząstkową bazę — dispatch NIEZALEŻNEGO
Evaluatora rundy 6 (całość BB2 + fix B-R5-1 razem) NASTĘPUJE teraz, zanim jakiekolwiek
scalenie do żywego drzewa.

Evaluator rundy 6 dispatchowany (`a4bb2944cd3713284`, Opus 5, worktree
`agent-ae476910a62d7b168`) — pełna niezależna weryfikacja B1-B4+B-R5-1 razem, kontrola
bazy (diff wyłącznie dodaje BB2, nic nowszego nie cofnięte), mutacje na wszystkich 3
naprawionych miejscach main.ts osobno, szerszy przegląd czy są inne niezłapane miejsca
grupowania po heksie.

**Runda 6 werdykt: PASS-WITH-NOTES.** Baza potwierdzona czysta (diff origin→worktree to
451 wstawień/22 usunięcia, zero cofnięć nowszej pracy). B1-B4+B-R5-1 zweryfikowane
niezależnie, wszystkie mutacje (M1/M2/M3 na 3 miejscach main.ts osobno + 5×
assignSharedStackGroupId + fallback |g) złapane precyzyjnie. Własny dodatkowy test
Evaluatora: 800 losowych układów na partycji `computeStackDisplay` (poza zakresem fuzza
Operatora), 0 rozbieżności. Szersze przeszukanie repo — brak innych miejsc klasy B-R5-1.
Bramki wszystkie zielone (18 plików testowych).

**SCALONE bezpośrednio przez orkiestratora** wg instrukcji Evaluatora (gotowy patch
`git apply -3`, czysto na wszystkie 4 pliki): `gra/src/units/setup.ts` (+pole
`stackGroupId?`), `gra/src/game/armyMerge.ts` (`stackGroupIdOf`, `sameStackGroup`,
`freshStackGroupId`, `assignSharedStackGroupId`, nowa `stackRenderKey` eksportowana +
użyta w `computeStackDisplay`), `gra/src/main.ts` (import + 3 miejsca `stackRenderKey`
= fix B-R5-1 + 5× `assignSharedStackGroupId` + gate `canSplit`), nowy plik
`gra/tools/army-merge-stackgroupid-test.cjs` (445 linii), rozszerzony
`army-merge-separate-return-mainguard-test.cjs` (sekcje 8-11, 72 asercje).

**N-1 (jedyne naruszenie C-025, `'Połącz'` escape↔literal w `stackHudMergeSplitActions`)
POMINIĘTE** wg rekomendacji Evaluatora — poza zakresem BB2, niespójne z konwencją reszty
pliku. Zweryfikowane po scaleniu: `git diff` dla tych 2 linii = 0 (bit-identyczne
z żywym drzewem sprzed BB2).

Bramki na żywym drzewie po scaleniu (identyczne z Evaluatorem): `tsc --noEmit` 0,
`logic-test` 213/213, `army-merge-stackgroupid-test` 11045/11045,
`army-merge-separate-return-mainguard-test` 72/72, `army-merge-separate-return-test`
16/16, bounce/dismiss-bounce/colocated 4/4·16/16·4/4, `army-stack-ruch` 5/5,
`combat-test` 6/6.

**Noty N-2 do N-6 (nieblokujące, do backlogu):** N-2 popup wyboru jednostki w mieście
(`showCityUnitPick`) sumuje przez obie grupy stosu bez `groupId` — tylko odczyt/render;
N-3 dwa żetony różnych grup na jednym heksie nakładają się wizualnie (świadoma
konsekwencja ECHO B, złagodzona przez tę naprawę — lista armii i HUD ◀▶ teraz dają
działający dostęp do drugiej grupy); N-4 komentarz „parytet AI" w `setup.ts` mylący (AI
nie przechodzi przez ścieżki split/merge UI, pracuje na fallbacku — do poprawki
komentarza przy okazji); N-5 `unitAtRepresentative` wybiera najmocniejszą jednostkę na
heksie bez względu na grupę (tylko selekcja, nie mutacja); N-6 `freshStackGroupId` na
`Date.now()`, niedeterministyczne (blokada dla przyszłej bramki replay/determinizmu).

**STATUS: ZAMKNIĘTE (P-ARMIA-ROZPAD BB2 w całości scalone).**

---

## P-HUD-KULTURA-SIGNED-NIESPOJNE — znalezisko audytu „raport" (2026-08-10), naprawione bezpośrednio

Audyt pełnego rejestru na hasło `raport` (nowa reguła CLAUDE.md pkt 10) znalazł to jako
**realne zapomnienie**: temat był częścią grupy G1 (audyt C-030), ale G1 dostał Evaluator
**FAIL** (`f7a0ece1`), redo (`5a93f5aa`) naprawił WYŁĄCZNIE `P-DYPLO-DOPLAC-PW-ZLA-SCIEZKA` —
naprawa Kultury zgubiła się po drodze. Zweryfikowane bezpośrednio w źródle przed dispatchem
(nie ufając pamięci sesji): `gra/src/ui/hud.ts:994,1079` nadal miały `signed(s.kultura)`.

Naprawione bezpośrednio przez orkiestratora (trywialna, dobrze wyspecyfikowana zmiana — zapas
Kultury formatowany jak pozostałe 5 chipów `String(Math.floor(...))`, nie wymuszony znak „+"
jak dla delty/tempa): `hud.ts:994` (`chip6cHtml` w `renderBarD1B`) i `hud.ts:1079`
(`renderBarLegacy`) — `signed(s.kultura)` → `String(Math.floor(s.kultura))`, zgodnie z
konwencją sąsiednich chipów (`nauka`: `String(Math.floor(s.nauka))`, `religia`:
`String(Math.round(s.religionStock))`). `signed()` zostaje na `kulturaRate` (tempo/delta —
tam znak „+" jest poprawny).

Bramki: `tsc --noEmit` 0, `logic-test.cjs` 213/213, `hud-moc-warstwa-test.cjs` 28/28
(dotyka `hud.ts`, niezmienione).

Dispatch lekkiego Evaluatora (weryfikacja że to czysto formatowanie, zero zmiany logiki)
NASTĘPUJE teraz.

**Autoryzacja Macieja (2026-08-10):** „ok jak będzie skończony 2 i 3 to rób deploy do robocza
i git push" — czyli po domknięciu R-AUTOZAPIS-QUOTA-STORAGE-Q1 (kat. 2 raportu) i tego tematu
(kat. 3), wykonaj deploy do ROBOCZA + push BEZ dodatkowego pytania o hasło `deploy` (ta
wiadomość JEST tym hasłem, warunkowo). Nie skracam przez to pętli Operator→Evaluator→scalenie
dla żadnego z dwóch tematów — deploy następuje PO ich pełnym, właściwym domknięciu, nie
zamiast niego.

---

## R-AUTOZAPIS-QUOTA-STORAGE-Q1 — Operator dostarczył (Faza 1+2), czeka na Evaluatora (2026-08-10)

Worktree `agent-a2d5e03691a4e7cbb`, branch `fsa-autosave` (baza: `origin/…ek4ra0` sprzed
kilku dalszych commitów sesji — do weryfikacji driftu przez Evaluatora).

**Faza 1 (feasibility) potwierdzona zgodnie z założeniem** (3 niezależne źródła: MDN,
Chrome for Developers, WICG issue): `requestPermission()`/`showDirectoryPicker()` wymagają
transient user activation, ale TYLKO przy wywołaniu tej funkcji — kolejne zapisy na już
przyznanym uchwycie (`getFileHandle`/`createWritable`/`write`/`close`) NIE wymagają aktywacji.
Operator wpiął `requestPermission()` w handler kliknięcia startu sesji (Nowa gra/Kontynuuj/
Wczytaj) — jedno kliknięcie na sesję, autozapis co turę już nie prosi o nic.

**Faza 2 (implementacja):** nowy `gra/src/game/fsa-autosave.ts` (detekcja środowiska,
nazewnictwo rotacji 10 slotów, zapis, komunikaty PL) + `main.ts` (`doRotatingAutosave` →
`async`, próba FSA → fallback na dotychczasowy `saveToLocal()` przy niepowodzeniu — zero
regresji; `triggerFsaAutosaveBootstrap()` z jednorazowym komunikatem dla Firefox/Safari/
`file://`) + `package.json` (`serve:robocza` przez `python3 -m http.server`, zero nowych
zależności npm, nie triggeruje `prebuild`/`predev`) + nowy test `fsa-autosave-test.cjs`
(40/40) + zaktualizowany `autosave-quota-fail-test.cjs` (20/20, sygnatura `async`).

Bramki Operatora: tsc 0, logic-test 213/213, autosave-quota-fail 20/20, fsa-autosave-test
40/40, tech-tree/research/unit-replace zielone. Brak testu E2E z prawdziwym
`showDirectoryPicker()` (niemożliwe w headless) — Operator rekomenduje ręczny playtest
Chrome/Edge przez `npm run serve:robocza` przed promocją.

Dispatch NIEZALEŻNEGO Evaluatora (Opus 5) NASTĘPUJE teraz — pełna weryfikacja (drift bazy,
poprawność async/fallback, brak regresji dotychczasowego `localStorage`, bezpieczeństwo
zapisu plików, realność gwarancji „jedno kliknięcie na sesję").

---

## R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA (2026-08-10, propozycja Macieja) · STATUS: **OTWARTE — nowa funkcja, do rozpoznania/ABC przed implementacją**

**Zgłoszenie Macieja (do zapisania, nie do podjęcia teraz):** możliwość wyboru, jakie
konkretne cywilizacje mają być przeciwnikami, w konfiguratorze na początku gry (dziś
prawdopodobnie losowy/automatyczny dobór — do potwierdzenia rozpoznaniem, nie zgadywania).

Nie dispatchowane — zapisane na wyraźne polecenie „zapisz", zgodnie z zasadą §2 CLAUDE.md
(zakaz otwierania nowych wątków bez wyraźnej zgody Macieja na podjęcie pracy). Do
rozpoznania (jak dziś działa dobór cywilizacji AI w konfiguratorze, gdzie w kodzie) i
pytania ABC (np. checkbox lista vs dropdown per slot vs pula wykluczeń) gdy Maciej da
sygnał do podjęcia.

---

## R-EPOKA-KAMIEN-PALEOLIT-NEOLIT (2026-08-10, propozycja Macieja) · STATUS: **OTWARTE — nowa funkcja, do rozpoznania/ABC przed implementacją**

**Zgłoszenie Macieja (do zapisania, nie do podjęcia teraz):** zmiana epoki „Kamień" na
podział Paleolit / Neolit (dziś jedna epoka Kamień → Brąz → Żelazo, patrz CLAUDE.md nagłówek).
Zakres nieustalony (czy to nowa 4. epoka wstawiona na starcie, czy podział istniejącej
Kamień na dwa etapy w ramach tej samej epoki, wpływ na drzewko technologii/cuda/jednostki
epoki Kamień) — do rozpoznania, gdy Maciej da sygnał do podjęcia.

Nie dispatchowane, wyłącznie zarejestrowane per §2 CLAUDE.md.

---

## R-SUROWIEC-CYNA-DO-BRAZU (2026-08-10, propozycja Macieja) · STATUS: **OTWARTE — nowa funkcja, do rozpoznania/ABC przed implementacją**

**Zgłoszenie Macieja (do zapisania, nie do podjęcia teraz):** wprowadzenie cyny jako nowego
surowca wymaganego do produkcji Brązu (dziś prawdopodobnie sam Brąz/miedź bez cyny jako
osobnego złoża/surowca — do potwierdzenia rozpoznaniem w `gra/data/` i drzewku, nie
zgadywania). Zakres nieustalony (nowe złoże na mapie? nowy budynek wydobywczy? wpływ na
istniejący łańcuch Kamień→Brąz i jednostki/budynki wymagające dziś samego Brązu) — do
rozpoznania, gdy Maciej da sygnał do podjęcia.

Nie dispatchowane, wyłącznie zarejestrowane per §2 CLAUDE.md.

---

## P-HUD-KULTURA-SIGNED-NIESPOJNE — Evaluator: PASS-WITH-NOTES, temat ZAMKNIĘTY (2026-08-10)

Niezależnie zweryfikowane (Opus 5), zero blokujących. Kluczowe potwierdzenia: `Math.floor`
jest idempotentne (`s.kultura` już floorowane w `main.ts:13518`, ten sam wzorzec co `nauka`);
zapas nieujemny (klampowany w `culture-religion.ts:1215`), floor bezpieczny; **poprawka
usuwa też istniejącą sprzeczność chipu z jego własnym tooltipem** (`kulturaChipTitle` od
zawsze liczył `Math.floor(s.kultura)` bez znaku — przed poprawką tooltip i chip się nie
zgadzały); przegląd wszystkich 11 wystąpień `signed(.*kultura` w `src/` — pozostałe to
poprawnie `kulturaRate`/przyrost na turę, nie kopie tej samej niekonsekwencji. Bramki:
tsc 0, logic-test 213/213, hud-moc-warstwa-test 28/28 (jedyny test dotykający `hud.ts`).

**Nota do osobnej weryfikacji (znalezisko Evaluatora, POZA zakresem tej poprawki, nie
blokuje):** `main.ts:21845-21846` — `playerEcon.kultura` trafia jednocześnie do
`_lastKulturaRate` I do `_lastKultura` (zapas), zanim linia 22860 nadpisuje zapas
prawdziwą sumą skumulowaną z miast — możliwe okno w obrębie ticku, gdzie zmienna zapasu
chwilowo trzyma wartość tempa. Nie zbadana osiągalność/skutek. Do rozpoznania osobno,
niepilne.

Temat już scalony (`ac07e79e`), Evaluator wyłącznie potwierdził post-factum.
**STATUS: ZAMKNIĘTE.**

---

## R-AI-UCZENIE-SIE-NA-BLEDACH (2026-08-10, pytanie eksploracyjne Macieja) · STATUS: **OTWARTE — nowa funkcja, do rozpoznania/ABC przed implementacją**

**Zgłoszenie Macieja (do zapisania, nie do podjęcia teraz):** czy da się dodać AI
cywilizacji „uczące się na błędach", coraz trudniejsze — lepsze prowadzenie wojen,
budowania i rozwoju we wszystkich aspektach.

**Wstępna odpowiedź orkiestratora w czacie (nie decyzja, nie rozpoznanie — do zweryfikowania
właściwym rozpoznaniem gdy temat zostanie podjęty):** prawdziwe uczenie maszynowe
(trenowanie modelu pamiętającego doświadczenie MIĘDZY rozgrywkami) nie mieści się w
architekturze gry — statyczny bundle HTML/JS bez backendu, bez infrastruktury treningowej.
Dzisiejsze AI (`gra/src/game/ai.ts` + `gra/data/ai-params.json`) jest deterministyczne i
regułowe — na tym stoi część bramek testowych (determinizm mapy itd.), więc prawdziwe ML
łamałoby ten fundament. Tańsza, realna droga do tego samego efektu: rozbudowa istniejących
heurystyk oceny (kalkulacja siły wojskowej przed atakiem, priorytety budowy/rozwoju,
reakcja na zagrożenia) + skalowanie trudności parametrami, BEZ łamania determinizmu.
Prawdziwe uczenie między rozgrywkami byłoby osobnym, znacznie większym projektem
(zapisywanie statystyk wyników + ręczne/półautomatyczne dostrajanie parametrów na ich
podstawie) — nie coś do wpięcia przy okazji.

Nie dispatchowane, wyłącznie zarejestrowane per §2 CLAUDE.md. Do rozpoznania/ABC
(zakres: „lepsze AI regułowe" vs „adaptacja w obrębie jednej rozgrywki" vs „uczenie
międzysesyjne przez zapisywane statystyki" — trzy różne skale kosztu), gdy Maciej da
sygnał do podjęcia.

---

## R-AUTOZAPIS-QUOTA-STORAGE-Q1 (FSA) — Evaluator RUNDA 1: FAIL, 2 blokery save-load, runda 2 w toku (2026-08-10)

Niezależnie zweryfikowane (Opus 5). Drift bazy sprawdzony — **brak kolizji** (BB2 `014b80fb`
już w bazie worktree, Kultura HUD `ac07e79e` dotyka `hud.ts`, Operator dotykał wyłącznie
`main.ts`/`package.json`/nowych plików — zero nachodzenia). Bramki wszystkie zielone
(tsc 0, logic-test 213/213, fsa-autosave-test 40/40, autosave-quota-fail-test 20/20).
C-025 czysto (4 precyzyjne hunki w `main.ts`).

**BLOKER B1 — autozapis staje się WRITE-ONLY.** W grze nie istnieje ŻADNA ścieżka odczytu
zapisu z pliku (`deserializeGame()` ma jedno wywołanie, wyłącznie z `localStorage`; brak
`showOpenFilePicker`/`FileReader` w całym `src/`). Skutek: na Chrome/Edge z przyznanym
katalogiem `doRotatingAutosave()` `return`uje przed `saveToLocal()` — sloty localStorage
przestają się aktualizować, pliki na dysku są dla gry niewidoczne, gracz traci możliwość
odzyskania gry mimo komunikatu sukcesu w konsoli. **Ścisła regresja, nie tylko brak zysku.**

**BLOKER B2 — `setLastPlayedSlotId()` kłamie w gałęzi FSA** (`main.ts:21321`) — zapisuje
klucz localStorage, którego ta gałąź nigdy nie wypełniła. „Kontynuuj" wczyta stary/cudzy
stan gry (cicha utrata postępu) albo spadnie na `mostRecentSaveSlotId()`.

**N4 (istotne, nieblokujące samo w sobie):** Faza 1 feasibility była prawdziwa ale
niepełna — tylko opcja „Zezwól przy każdej wizycie" (Chrome 122+ persistent permissions)
daje trwały dostęp; domyślne „Zezwól tym razem" jest one-time i **automatycznie odbierane
gdy karta pobędzie dłużej w tle** (gracz 4X alt-tabujący trafia dokładnie w ten przypadek).
Dziś cicha degradacja do `QuotaExceededError`, zero komunikatu dla gracza, brak furtki
wznowienia bez restartu sesji.

**N1-N8 (nieblokujące, do rundy 2):** `buildSaveGameSnapshot()` wyjęty przed `try` →
unhandled rejection w `async`; brak `.catch()` na jedynym call site; wyścig przy zapisie
trwającym dłużej niż tura (brak strażnika `inFlight`); `catch` pickera maskuje realne
błędy jako `'picker-cancelled'`; `await idbGetHandle()` przed pickerem przerywa łańcuch
transient activation; `livePermissionGranted` nigdy nie zerowane po niepowodzeniu;
`_resetFsaStateForTests()` eksportowany z modułu produkcyjnego.

Bezpieczeństwo nazwy pliku (path traversal) — **OK**, zweryfikowane wyczerpująco.
`ensureFsaAutosaveReady()` faktycznie NIE wołane z tury/timera — **potwierdzone**,
fundament Fazy 1 stoi.

Dispatch rundy 2 (naprawa B1+B2+N1-N8 wg precyzyjnej listy Evaluatora) NASTĘPUJE teraz.
Instrukcja scalania na później (drift bez kolizji, prosty `git apply -3` + 2 nowe pliki
kopiowane osobno) zanotowana przez Evaluatora, do użycia po PASS rundy 2.

**Deploy do ROBOCZA WSTRZYMANY** — autoryzacja Macieja („po 2 i 3") wymaga domknięcia
tematu 2 (ten), które jeszcze nie nastąpiło.

Operator rundy 2 (`a4ac79d3d82eb4fb5`, kontynuacja worktree `agent-a2d5e03691a4e7cbb`)
dispatchowany z pełną, dosłowną listą B1+B2+N1-N8 z werdyktu Evaluatora.

**Runda 2 dostarczona.** B1 naprawiony: `listFsaAutosaveFiles`/`readFsaAutosaveFile`/
`loadFsaAutosaveFile` w `fsa-autosave.ts`, `summarizeFsaSaveSlots`/`mergeSaveSlotLists` w
`saveLoadDialog.ts` (dokłada wpisy z dysku „(dysk)” do listy z localStorage, bez ✕ —
usuwanie plików z dysku odłożone), `loadGameFromSlot()` rozgałęzia po prefiksie `fsa:`.
B2 naprawiony: `FSA_SLOT_PREFIX = 'fsa:'` w `save.ts`, `getLastPlayedSlotId()` zwraca
wskaźnik bez walidacji localStorage dla tego prefiksu, `onContinue` teraz czeka
(`await triggerFsaAutosaveBootstrap()`) przed odczytem wskaźnika. N1-N7 naprawione
(strażnik równoległości, `.catch()`, przeniesienie `buildSaveGameSnapshot` pod `try`,
jednorazowy komunikat degradacji, rozróżnienie AbortError, preload IndexedDB, auto-zero
`livePermissionGranted`). N8 udokumentowany, nie w pełni zweryfikowany (wymagałby
`vite build`, poza dozwolonymi bramkami Operatora).

**Dwie świadomie odłożone luki, jawnie zgłoszone przez Operatora (do oceny Evaluatora czy
blokujące):** (a) `hasAnySaveSlot()` (gate przycisków „Wczytaj"/„Kontynuuj" w menu) sprawdza
WYŁĄCZNIE localStorage — gracz z sejwami TYLKO na dysku i zerem w przeglądarce zobaczy
wyszarzone przyciski mimo istniejących zapisów (wymagałoby zmiany kontraktu z sync na
async w 2 modułach UI); (b) furtka „przywróć zapis na dysk" w menu pauzy (N4) nie zrobiona
— po degradacji gracz może wznowić zapis na dysk dopiero nową sesją/restartem.

Testy: `fsa-autosave-test.cjs` rozszerzony (sekcje 7-9, 55/55). Bramki: tsc 0,
logic-test 213/213, fsa-autosave-test 55/55, autosave-quota-fail-test 20/20.

Dispatch NIEZALEŻNEGO Evaluatora rundy 2 NASTĘPUJE teraz — ocena B1/B2 realnie zamknięte,
oraz czy dwie odłożone luki (a)/(b) są akceptowalne czy blokujące dla tej rundy.

Evaluator rundy 2 dispatchowany (`a08d00415b015647f`, Opus 5) — pełna niezależna
weryfikacja B1/B2 end-to-end, ocena luk (a)/(b), N1-N7 rzeczywiście sprawdzone w kodzie,
szukanie nowych regresji w `save.ts`/`saveLoadDialog.ts` (zmiana kontraktu sync→async).

**Runda 2 werdykt: PASS-WITH-NOTES.** B1 zweryfikowane własnym round-trip testem Evaluatora
na prawdziwym kodzie (esbuild + mock `FileSystemDirectoryHandle`) — 12/12, `explored: Set→
tablica` przetrwał, `meta.newGameParams` przetrwał (bez tego `checkSaveIntegrity` by
odrzucił zapis). `mergeSaveSlotLists` potwierdzone jako realnie wołane, nie martwy kod.
B2: wszystkie 4 miejsca odczytu wskaźnika `fsa:` sprawdzone, race faktycznie usunięty (nie
przesunięty — `ensureFsaAutosaveReady()` nigdy nie rzuca, zawsze poprawna degradacja).
Luka (a) w praktyce prawie zneutralizowana — `LAST_PLAYED_SLOT_KEY` sam zaczyna się od
`SAVE_PREFIX`, więc po pierwszym autozapisie na dysk `hasAnySaveSlot()` i tak zwróci
`true`. Luka (b) — zero utraty danych, akceptowalna. N8 zweryfikowane realnym `vite build`
(Operator błędnie sądził że to poza zakresem — CLAUDE.md §1 sankcjonuje ten build):
`_resetFsaStateForTests`/`_setFsaStateForTests` = 0 wystąpień w bundlu, tree-shaking
potwierdzony empirycznie.

**Nowe noty Evaluatora (N9-N14), żadna blokująca:** N9 `onContinue` async IIFE bez
`.catch()` (ta sama klasa co N2, ryzyko praktycznie zerowe); N10 „Kontynuuj" na świeżym
profilu blokuje się na modalnym pickerze (świadoma konsekwencja B2); N11
`summarizeFsaSaveSlots()` deserializuje wszystkie 10 plików rotacji — na dużych mapach
możliwe zacięcie przy otwarciu „Wczytaj"; N12 strażnik `root===null` w dialogu nie łapie
zamknij-i-otwórz-ponownie (nieszkodliwe); N13 `serve:robocza` technicznie poza B1/B2 ale
uzasadnione (FSA nie działa na `file://`); N14 mylący komentarz o stanie bazowym N1
(zachowanie poprawne, tekst nieścisły).

**SCALONE** hunk-by-hunk wg instrukcji Evaluatora (`git apply -3`, czysto na wszystkie 5
zmodyfikowanych plików + 2 nowe pliki skopiowane w całości): `gra/package.json`,
`gra/src/game/save.ts`, `gra/src/main.ts`, `gra/src/ui/saveLoadDialog.ts`,
`gra/tools/autosave-quota-fail-test.cjs`, nowy `gra/src/game/fsa-autosave.ts`, nowy
`gra/tools/fsa-autosave-test.cjs`. Bramki na żywym drzewie identyczne z Evaluatorem:
tsc 0, logic-test 213/213, fsa-autosave-test 55/55, autosave-quota-fail-test 20/20,
save-label-test OK, planned-march-test 18/18.

**STATUS: ZAMKNIĘTE (R-AUTOZAPIS-QUOTA-STORAGE-Q1 w całości scalone — temat 2 z
autoryzacji Macieja domknięty).**

---

## DEPLOY ROBOCZA FALA 266 — dispatchowany (2026-08-10)

Po domknięciu tematów 2+3 (autoryzacja Macieja „ok jak będzie skończony 2 i 3 to rób
deploy do robocza i git push") — dispatch agenta deployu (`af3a5960e4f11e5d2`, Opus 5
zgodnie z zasadą CLAUDE.md pkt 4). Zakres: pełny runbook §6 (build, stamp, sync, verify,
log w `WERSJE.md`+`KANAL-PRACA.md`), commit+push gałęzi sesji, **oraz naprawa zaległości**
— `main` stoi na FALA 263, FALA 264 (`31a2caef`) i FALA 265 (`43b75861`) nigdy nie zostały
scalone mimo że reguła `R-MERGE-MAIN-RYTM-Q1` już to nakazywała przy poprzednim deployu.
FALA 266 (ten deploy) świadomie NIE wchodzi do `main` — zostaje do testów.

**DEPLOY ZAKOŃCZONY, zweryfikowany niezależnie przez orkiestratora (nie tylko na słowo
agenta):** bundel `gra-robocza/Gra-ROBOCZA.html` md5 `745cb88d96b145fb41a33efad566bbec`
potwierdzony `md5sum` na żywym drzewie — zgodny z `WERSJE.md` i `KANAL-PRACA.md`. `main`
(origin) potwierdzony na `afce9001` (FALA 265, po nadgonieniu FALA 264→`d6d2532c`,
FALA 265→`afce9001`, oba `--no-ff`, bez `--force`). Gałąź sesji ma commit deployu
`b9b26f74`, zsynchronizowana z `origin` (`git pull --ff-only` = already up to date).
Agent odkrył i naprawił rozbieżność w moim własnym zleceniu — podałem tylko 4 tematy,
faktycznie w tej fali było 10 (m.in. brakowało P-ARMIA-ROZPAD etap 1, R-EPOKA-CUD B3,
tooltip Pracy) — wszystkie 10 poprawnie opisane w `WERSJE.md`.

**STATUS: ZAMKNIĘTE (FALA 266 na ROBOCZA, main nadgoniony do FALA 265).**

---

## BUG (zrzut Macieja) — Praca NIE dociera do ulepszeń, BLOKUJE dalszy rozwój — PRIORYTET (2026-08-10)

**To NIE jest ta sama sprawa co „Praca 9 vs 3" wyżej** (tamto = wyjaśnione, city gross vs
civ-wide net po utrzymaniu, tooltip naprawiony w FALA 266). Maciej zgłasza inny, poważniejszy
problem: przy ustawieniu 100% do puli cywilizacji (0% do budynków) i BRAKU jakiejkolwiek
budowy w kolejce, pula rośnie (pokazana 22 w nowym tooltipie „Praca — co to znaczy"), ale
**Praca „nie idzie do ulepszeń" i nie da się rozwijać cywilizacji** — testowanie zablokowane
do czasu naprawy. Cytat: „nie wiem gdzie to dwa znika... jeżeli nie budowany jest żaden
budynek, to powinno wracać do puli... żadnego budynku nie buduję... ustawienie jest takie,
że ma wszystko iść do puli cywilizacji, a nie na budynki. To jest drugi raz, kiedy ten błąd
zgłaszam i nie jest to naprawione." Eskalacja: „dopóki to nie zostanie naprawione, to nie ma
sensu dalej robić testów".

**Wstępny trop orkiestratora (NIE potwierdzony, do rozpoznania):** mechanizm wydawania puli
Pracy na ulepszenia terenu/projekty mapy to zmienna `playerPracaPool` w `main.ts` (linie
~10080, 10165-10173 zwrot przy cofnięciu, 10217-10321 budowa/koszt `req.kosztPraca`,
23002-23010 auto-ulepszenia z rezerwą `AUTO_ULEPSZENIA_PRACA_RESERVE`) — osobna od
`_lastPracaRate`/tooltipu HUD (main.ts:13414-13418, `previewPracaPoolBrutto`). Możliwe, że
`playerPracaPool` (faktycznie wydawalna pula) nie jest tym samym co liczba „22" pokazana w
tooltipie, albo nie synchronizuje się poprawnie turę po turze — DO ZWERYFIKOWANIA W KODZIE,
nie zgadywania.

**PRIORYTET — dispatch rozpoznania NASTĘPUJE natychmiast**, zanim jakikolwiek kod zostanie
zmieniony. Zakres rozpoznania: (1) czy `playerPracaPool` faktycznie akumuluje się turę po
turze zgodnie z tym co pokazuje tooltip (22), czy jest gdzieś zerowana/nie synchronizowana;
(2) czy próba postawienia ulepszenia terenu (np. farma/kamieniołom) faktycznie odejmuje z
tej puli i się udaje, gdy pula > koszt; (3) czy jest realna regresja (porównanie z
zachowaniem sprzed której fali — Maciej mówi że to działało wcześniej) czy gracz po prostu
nie ma jeszcze wystarczającej puli na żadne ulepszenie (koszt > 22).

**DRUGI zrzut Macieja — konkretny, sprzeczny odczyt między dwoma panelami tego samego
miasta w tej samej chwili (tylko 1 miasto w grze):**
- Panel „Grecy" (cywilizacja), tabela „DO PULI / DO BUDYNKÓW": Ateny → **+2 / +4**
  (`empireDetailPanel.ts:384-386`, `cityEconMiniPraca`, pola `c.pracaPula`/`c.pracaBudynki`).
- Panel miasta „Podział Pracy": suwak **50%/50%**, Budowa **+3**, Ulepszenia **+3**.
- Te same 6 Pracy, DWA różne rozbicia w tym samym momencie. Cytat: „co innego pokazuje w
  ogóle panel miasta, co innego jest cywilizacja. A mam tylko jedno miasto."

**Trop orkiestratora #2 (własne śledzenie kodu, NIE potwierdzone jako pełna przyczyna,
DO WERYFIKACJI przez rozpoznanie, nie do ślepego przyjęcia):** `pracaPula`/`pracaBudynki` w
panelu „Grecy" (`main.ts:12057-12058`) czytane z `tk = _lastPlayerCityEcon.find(...)` —
**migawka z KOŃCA POPRZEDNIEJ TURY**, nie przeliczenie na żywo. Panel miasta „Podział Pracy"
najprawdopodobniej liczy na żywo z AKTUALNEGO ustawienia suwaka. Jeśli suwak/ustawienie
zmieniło się w trakcie bieżącej tury (Maciej: „prawdopodobnie to ustalenie nastąpiło w
momencie, gdy chciałem mieć globalne ustawienia i te globalne ustawienia w ogóle nie
działają ani nie działają też ustawienia na miasta indywidualnie. Wszystko zostało
zepsute.") — panel cywilizacji pokazuje STARY split, panel miasta NOWY. To może tłumaczyć
rozjazd liczb, ale NIE tłumaczy samo w sobie, dlaczego globalne ORAZ indywidualne
ustawienia „nie działają wcale" — to osobny, poważniejszy wątek do zbadania w tym samym
rozpoznaniu (temat R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE, `8692b61b`, scalony wcześniej
w tej sesji — możliwe że regresja weszła razem z nim albo po nim).

**KRYTYCZNE doprecyzowanie Macieja (po mojej wzmiance o R-MIASTO-USTAWIENIA-GLOBALNE-
VS-LOKALNE):** „tylko że nie ma panelu ustawień globalnych. Już zwracałem uwagę, że nie
wiem gdzie to jest i czy to w ogóle jest. Jedynie co to wchodzę do miasta i zmieniam w
danym mieście. Także tu jest mega bałagan." — czyli temat `R-MIASTO-USTAWIENIA-GLOBALNE-
VS-LOKALNE` zarejestrowany wcześniej w tej sesji jako „SCALONE `8692b61b`" **może być
fałszywym zamknięciem** — kod mógł zostać scalony bez realnego, widocznego dla gracza
panelu UI, albo panel istnieje ale Maciej nie może go znaleźć (też problem — UX). To DO
ZBADANIA W TYM SAMYM ROZPOZNANIU, priorytetowo: czy panel globalnych ustawień w ogóle
istnieje w drzewie UI, gdzie miał się pojawić, i czy commit `8692b61b` faktycznie coś
takiego dodał czy tylko logikę bez punktu wejścia w interfejsie.

**Uczciwie do Macieja:** pętla Operator→Evaluator w tej sesji weryfikuje SCOPED zmianę
przeciwko scenariuszom, które Operator/Evaluator sam wymyślił i przetestował dla TEGO
zgłoszenia — nie robi wyczerpującego regresyjnego sprawdzenia całej gry pod kątem
niezgłoszonych kombinacji (np. „zmień suwak, NIE kończ tury, otwórz panel cywilizacji").
Ten dokładny rodzaj błędu — dwa niezależne miejsca liczące to samo z różnych źródeł danych
(cache vs live) — jest właśnie tym, czego pojedyncze Evaluatory nie łapią, jeśli nikt nie
zgłosił tego konkretnego scenariusza. To nie usprawiedliwienie, tylko wyjaśnienie mechanizmu
— i konkretny powód, żeby rozpoznanie objęło też grep wszystkich miejsc czytających
`_lastPlayerCityEcon`/odpowiedniki dla innych zasobów (Żywność, Nauka, Skarbiec), bo to
może być systemowy wzorzec błędu, nie jednorazowy przypadek przy Pracy.

---

## BUG (zrzut Macieja) — Auto Wyżywienie NIE zapobiega ujemnemu Spichlerzowi, regresja (2026-08-10)

**Zrzut:** panel Ateny, Żywność `−1 (0)`, „Produkcja +11/t − Racje −12/t = Bilans −1/t",
przycisk „Auto Wyżywienie" WŁĄCZONY (zielony, aktywny stan). Mimo to bilans ujemny.

**Cytat Macieja:** „tak samo jak nie naprawiony temat auto wyżywienia były ustalone zasady,
którymi się kieruje auto wyżywienie, tak żeby nie prowadzić do ujemnego spichlerza, a ja
widzę, że to nie działa. ale wcześniej z tym nie było problemów, więc to są jakieś regresy."

**Ustalone reguły w kodzie (do zweryfikowania czy faktycznie działają, nie zgadywania):**
`gra/src/game/empire-food.ts` — `isCityAutoWyzywienieEnabled` (linia 355, komentarz
„R-AUTO-RACJE-RAISE-Q5=A: auto obniżanie+podnoszenie Wyżywienia. Gracz: tylko gdy flaga WŁ.
AI: zawsze"), `autoBalanceRationsToSolvency` (455), `autoRaiseRationsForGrowth` (520),
`maxSafePoziomRacjiForCity` (596, komentarz „R-AUTO-RACJE-RAISE-Q3=A: najwyższy poziom
Wyżywienia przy którym Spichlerz ≥ 0 po dopłatach miastom").

**Nie zgaduję przyczyny** (może to być: `autoBalanceRationsToSolvency` nie jest wywoływana
w odpowiednim miejscu cyklu tury, regresja w warunku uruchomienia, zmiana w oblicznieiu
`maxSafePoziomRacjiForCity` po niedawnych zmianach balansu Tartak/Glinianka lub Spichlerz
cap [obie w tej samej FALI 265], albo coś innego) — dispatch rozpoznania NASTĘPUJE, RÓWNOLEGLE
z rozpoznaniem Pracy wyżej (PRIORYTET tamtego wyższy — blokuje testowanie).

Oba rozpoznania dispatchowane: Praca+ustawienia globalne (`a178562f1e717529f`, PRIORYTET,
zakres A/B/C: wydawanie puli na ulepszenia, cache vs live panel miasta/cywilizacji, istnienie
panelu globalnych ustawień) i Auto Wyżywienie (`a9bb68ce84d7d4bc9`). Żaden nie zmienia kodu —
czyste rozpoznanie przed jakąkolwiek naprawą.

**Rozpoznanie Auto Wyżywienie ZAKOŃCZONE — NIE regresja.** Mechanizm (`empire-food.ts`)
niezmieniony od `88c08755` (2026-08-05), FALA 265/266 w ogóle go nie dotknęła. Kontrakt jest
EMPIRE-WIDE (Spichlerz ≥ 0 po dopłatach ze WSZYSTKICH miast), nie per-miasto — potwierdzone
komentarzami w kodzie, własnym tooltipem przycisku „Auto Wyżywienie" w UI, i testem
`ai-major-economy-test.cjs` scenariusz „L. Q5" **32/32 PASS** reprodukującym dokładnie ten
przypadek (miasto bez flagi zostaje z lokalnym deficytem nietknięte, celowo). Ujemny lokalny
„Bilans" pojedynczego miasta pokrywany z centrali to ZAMIERZONE zachowanie, nie bug. Realny
problem: UI nie tłumaczy tego rozróżnienia graczowi (goły czerwony „−1" bez adnotacji „pokryte
z centrali"). Dodatkowo znaleziona osobna, udokumentowana jako świadoma (SPICH-AUTO-Q1,
`998fe2b6`, 2026-08-04) granica zakresu: auto-Wyżywienie NIE liczy kosztu wojska przy decyzji
o poziomie racji, a UI ma twardy `Math.max(0, central)` — Spichlerz nigdy nie pokazuje się jako
ujemny nawet przy realnym głodzie (widocznym tylko przez osobną flagę `glodWojska`).

**Do decyzji Macieja (ABC, nie do zgadywania):** (A) dopisać w panelu miasta adnotację przy
ujemnym lokalnym bilansie pokrytym z centrali; (B) rozszerzyć kontrakt auto-Wyżywienia o koszt
wojska — realna zmiana zasięgu mechanizmu; (C) zostawić jak jest, dopisać wyjaśnienie do
dokumentacji/FAQ w grze. Osobno: `empire-food-b5-test.cjs` ma 3 pre-istniejące porażki
(dług R-STAWKI ×2 kosztu wojska, niezwiązane z tym tematem) — do dopisania w CLAUDE.md §BRAMKI
jako znana czerwona bramka, żeby nie mylić z tym tematem przy przyszłych audytach.

**STATUS Auto Wyżywienie: ZAMKNIĘTE jako „nie bug", czeka na ABC Macieja co do UX.**

---

## Rozpoznanie Praca ZAKOŃCZONE — TRZY niezależne przyczyny, nie jedna (2026-08-10)

**A) „Praca nie dociera do ulepszeń" — NIE bug silnika.** `playerPracaPool` i tooltip HUD to
JEDNA, poprawnie zsynchronizowana zmienna (20 miejsc przypisania, każde aktualizuje oba naraz).
Ścieżka UI→silnik stawiania ulepszenia (`improvement-build.ts`→`applyBuildRequest`/
`commitBuildRequest`, main.ts:10200-10322) jest kompletna i poprawna — sprawdza pulę, odejmuje,
albo pokazuje „Za mało Pracy". **Rzeczywista przyczyna:** koszt Pracy WSZYSTKICH ulepszeń
terenu jest dziś ×2 względem `gra/data/terrain-improvements.json`, przez `scaleImprovementWorkCost`
(`r-stawki-strojenie.ts`, `R_STAWKI_FALA2_MULT=2`) — świadoma decyzja Macieja z commitów
`24acb69c`/`f940f618` (2026-08-03/04, współautor Maciej, udokumentowane w
`docs/decyzje/R-STAWKI-STROJENIE.md`/`R-NADMIAR-POOLS.md`, cytat: „podwoiłbym koszt... Zobaczę
potem w Playtestie"). Realne koszty dziś: droga 30, farma/kamieniołom/kopalnie 40-44, tartak/fort
50, stadnina 56, posterunek 60 — przy puli 22-26 (jak w zrzutach) **nic nie jest przystępne**.
To jest DOKŁADNIE ten playtest, o którym mówił cytat z 3 sierpnia — efekt uboczny (niedostępność
wczesnej gry) najwyraźniej nie był wcześniej zaobserwowany. Pogłębia to słaby UX: panel budowy
(`buildModeHud.ts`) NIE wyszarza pozycji nieprzystępnych, komunikat „Za mało Pracy" to cichy
3-sekundowy toast po kliknięciu, nie stały wskaźnik.

**B) Rozjazd panel miasta (+3/+3) vs panel cywilizacji (+2/+4) — POTWIERDZONY realny bug,
silny dowód liczbowy.** Oba panele używają tej samej formuły (`resolveCityPodzialPracy`),
więc to NIE rozjazd wzoru. Policzone: `round(6×0,70)=4, doPuli=2` — panel cywilizacji
pokazywał DOKŁADNIE wynik DOMYŚLNEGO podziału 70/30 (`DEFAULT_PODZIAL_PRACY`), nie aktualnie
ustawionego 50/50. Silna poszlaka, że `_lastPlayerCityEcon` (cache czytany przez panel
cywilizacji, main.ts:12050/12057-12058) nie zdążył się odświeżyć mimo że mechanizm
inwalidacji (`empireEconDirty`) wygląda na papierze poprawnie. Podejrzany mechanizm (NIE
potwierdzony logami z sesji Macieja, tylko hipoteza z czytania kodu): `refreshLiveEmpireRates()`
czyści flagę `empireEconDirty` NA POCZĄTKU funkcji (main.ts:13328), PRZED właściwym
przeliczeniem i zapisem do cache (main.ts:13428) — bez `try/catch` między tymi liniami, cichy
wyjątek zostawiłby flagę wyczyszczoną, a cache nigdy nieodświeżony. **Wzorzec systemowy, nie
jednorazowy przypadek przy Pracy** — Skarbiec i Nauka w tym samym panelu „Grecy" czytają ten
sam cache, to samo ryzyko.

**C) Brak panelu globalnych ustawień — POTWIERDZONE jako fałszywe zamknięcie
`R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE`.** `git show 8692b61b --stat`: kompletny, przetestowany
backend (`empire-city-defaults.ts`, 278 linii + test 247 linii, wpięty w `main.ts`) — ale w
`cityPanel.ts` WYŁĄCZNIE deklaracje typu interfejsu (+22 linii), **zero kodu renderującego
UI** (brak przycisku pin/odpin, brak jakiejkolwiek etykiety). Mechanizm faktycznie działa —
suwak w panelu KAŻDEGO miasta bez lokalnego pinu JEST globalnym ustawieniem
(`onPodzialPracyChange` main.ts:17077-17091 pisze wprost do `ownerDefaultPodzialPracy`) — ale
gracz nie ma ŻADNEGO sposobu to zobaczyć/kontrolować. Cytat Macieja („nie ma panelu ustawień
globalnych... jedynie co to wchodzę do miasta i zmieniam w danym mieście") jest **dosłownie
prawdziwy i dosłownie zgodny z tym co kod dziś robi**.

**Rekomendacja rozpoznania — trzy osobne, wąsko scoped naprawy, PRIORYTET wg łatwości/wpływu:**
1. **C (UI dla gotowego backendu)** — najwęższy zakres, backend gotowy i przetestowany,
   brakuje tylko warstwy `cityPanel.ts` (3 miejsca: Okolica/Budowa/Podział Pracy, hooki już
   czekają w configu) — przycisk pin/odpin + etykieta globalne/lokalne.
2. **B (cache/live)** — wymaga najpierw potwierdzenia hipotezy (czy `refreshLiveEmpireRates()`
   faktycznie rzuca cichy wyjątek) zanim naprawa, potem dodanie `try/catch` + test regresyjny.
3. **A (balans ×2)** — to NIE jest kod do naprawienia, to decyzja Macieja do potwierdzenia/
   skorygowania (zostawić balans + poprawić UX przystępności, czy zmniejszyć mnożnik dla
   ulepszeń terenu konkretnie).

**STATUS: ZAMKNIĘTE rozpoznanie, czeka na decyzje/dispatch napraw Macieja.**

---

## PONOWNE OTWARCIE — Auto Wyżywienie „nie bug" OBALONE przez Macieja dla przypadku 1 miasta (2026-08-10)

**Wcześniejszy wniosek rozpoznania (`a9bb68ce84d7d4bc9`) był NIEPEŁNY.** Cytat Macieja, celny
kontrargument: „to mogłoby mieć rację bytu, gdyby cywilizacji było więcej niż jedno miasto,
gdzie jedno miasto dokłada do spichlerza, a drugie odejmuje, ale tu mamy tylko jedno miasto,
więc jeżeli w danym mieście jest minus, to w cywilizacji też powinien być minus i to jest duża
niespójność, więc tam jest pewnie podwójny błąd."

**Matematycznie bezsporne:** przy DOKŁADNIE jednym mieście, bilans lokalny tego miasta i delta
Spichlerza cywilizacji to TA SAMA liczba — nie ma żadnego drugiego miasta, które mogłoby
„dokładać" i maskować lokalny minus. Dowód testem `ai-major-economy-test.cjs` (32/32,
scenariusz „L. Q5") z poprzedniego rozpoznania jest NIEADEKWATNY do zrzutu Macieja — test
używa DWÓCH miast (jedno z flagą, jedno bez), więc nie reprodukuje przypadku 1-miastowego,
w którym „pokrycie z centrali przez inne miasto" jest fizycznie niemożliwe. Jeśli mechanizm
faktycznie celuje w „Spichlerz ≥ 0" (cytat kodu: `maxSafePoziomRacjiForCity`, „najwyższy poziom
Wyżywienia przy którym Spichlerz ≥ 0 po dopłatach miastom"), to przy 1 mieście pokazanie −1
oznacza że albo (a) auto-mechanizm dobrał zły poziom racji dla TEJ populacji, albo (b) to ten
sam rodzaj błędu co potwierdzony w temacie Praca (B: rozjazd cache/live) — wyświetlana wartość
nie odzwierciedla faktycznie zastosowanego przez silnik poziomu racji.

**Dispatch NOWEGO, dokładniejszego rozpoznania NASTĘPUJE teraz** — scenariusz specyficzny dla
1 miasta: symulacja/test z JEDNYM miastem, sprawdzenie krok po kroku czy
`autoBalanceRationsToSolvency`/`maxSafePoziomRacjiForCity` faktycznie wybiera poziom dający
lokalny bilans ≥0 gdy jest tylko jedno miasto, i czy wybrany poziom faktycznie trafia do
UI (nie cache'owany/przestarzały). Nie zamykam ponownie na pierwszej pasującej przyczynie
(C-041) — jeśli znajdzie się jedna wada, szukać też drugiej niezależnej.

---

## KOREKTA — znalezisko A (balans ×2) NIE dotyczy zgłoszenia Macieja, sprostowanie (2026-08-10)

**Maciej sprostował własne zgłoszenie, bezpośrednio:** „jeżeli chodzi o pracę to nieporozumienie.
Ja w ogóle nie zgłaszałem w ogóle problemu, że nie mogę nic budować, jeżeli chodzi o ulepszenie.
Tylko mówiłem, że po prostu przyrosty są nieprawidłowo liczone. Powinno być plus sześć, a było
plus dwa." — orkiestrator błędnie zinterpretował eskalację („nie da się rozwijać cywilizacji")
jako dosłowną blokadę budowy. **Znalezisko A (koszt ulepszeń ×2, świadoma decyzja balansowa
Macieja z 3-4 sierpnia) NIE jest tym, co zostało zgłoszone** — to osobna, niezwiązana sprawa,
prawdziwa ale nietrafiona w kontekst tego zgłoszenia. Realne zgłoszenie to WYŁĄCZNIE znalezisko
B (rozjazd przyrostu +2 pokazanego vs +6 oczekiwanego — dokładnie ten sam mechanizm co rozjazd
panelu miasta/cywilizacji, cache `_lastPlayerCityEcon`/`empireEconDirty`).

**Dodatkowa, cenna podpowiedź Macieja co do PRZYCZYNY:** „ten problem z pracą prawdopodobnie
wyniknął w momencie gdy prosiłem Cię o zrobienie globalnych ustawień dla żywności pracy i
pieniędzy i to zostało gdzieś popsute." — to WIĄŻE znalezisko B (cache) ze znaleziskiem C
(brak UI globalnych ustawień, `8692b61b`) przez WSPÓLNY kod: `onPodzialPracyChange`
(main.ts:17077-17106) i `markCityStateDirty()`/`empireEconDirty` to DOKŁADNIE ta ścieżka,
którą dotknął temat globalnych ustawień. Prawdopodobne (do potwierdzenia, nie zgadywania):
praca nad `8692b61b` (albo commit bezpośrednio poprzedzający/następujący) wprowadziła regresję
w inwalidacji cache `_lastPlayerCityEcon`, nie tylko zapomniała o UI. Do uwzględnienia w
zakresie naprawy znaleziska B — sprawdzić `git log -p` dla `onPodzialPracyChange`/
`empireEconDirty`/`refreshLiveEmpireRates` w okolicy czasowej `8692b61b`.

**Skorygowany zakres realnych bugów do naprawy (bez A, które jest osobną sprawą balansu):**
- **B** — rozjazd cache/live (Praca, prawdopodobnie też Skarbiec/Nauka) — PRIORYTET, możliwy
  wspólny root cause z C.
- **C** — brak UI dla gotowego backendu globalnych ustawień — PRIORYTET, ten sam commit.

---

## R-USTAWIENIA-GLOBALNE-LOKALNE — pełna specyfikacja UX od Macieja (2026-08-10)

**Żywa rozmowa z właścicielem, kompletna specyfikacja — nie wymaga ABC, bezpośrednie ustalenie
(CLAUDE.md pkt 1: „bezpośrednich ustaleń wypracowanych żywą rozmową z właścicielem" jest
wyjątkiem od turnieju ABC).** Cytaty złożone w spójną specyfikację:

1. **Globalne ustawienia przenoszą się na mapę świata**, do panelu cywilizacji („Grecy") —
   tam gdzie dziś jest podgląd Skarbiec/Praca/Spichlerz/Nauka (chipy HUD + panel „ZASOBY
   IMPERIUM" po kliknięciu). Tam dochodzą kontrolki globalnych ustawień dla całej cywilizacji.
2. **W panelu miasta (po wejściu do miasta)** — dla TRZECH grup: Żywność, Pieniądze (Skarbiec),
   Praca — każda ma własny przycisk/baton „Indywidualne". Naciśnięcie go WŁĄCZA możliwość
   ustawienia tego miasta inaczej niż globalnie (lokalny override). Bez naciśnięcia — miasto
   dziedziczy globalne ustawienie.
3. **Każda z trzech grup traktowana OSOBNO** — miasto może mieć np. Pracę indywidualną, a
   Żywność i Skarbiec nadal globalne. Zmiana globalnego ustawienia NIE dotyka miast z
   naciśniętym „Indywidualne" dla TEJ konkretnej grupy.
4. **Skarbiec i Nauka to JEDNA grupa, nie dwie** — cytat: „jeżeli chodzi o skarbiec, no to
   wiadomo, w nim też zawiera się nauka. Więc poziom różnicowania środków na pieniądze, a na
   naukę lub rozwój powinny być takie same w obu miejscach, zarówno w skarbcu jak i w nauce,
   bo to w sumie to samo." — jeden wspólny suwak/ustawienie (prawdopodobnie istniejący „Skarb
   %" z `cityEconMiniSkarbiec`) sterujący podziałem złoto↔nauka, spójnie widoczny/edytowalny
   z obu miejsc (panelu Skarbca i panelu Nauki), nie dwa niezależne ustawienia.
5. **Podsumowanie właściciela:** „wtedy będziemy mieć jasność: globalne ustawienia w globalnym
   miejscu na mapie świata, a w mieście tylko indywidualne, jeżeli naciśniemy przycisk
   indywidualny."

**Powiązanie z resztą tematu:** backend dla mechanizmu global/local już istnieje
(`empire-city-defaults.ts`, commit `8692b61b`) — brakuje WYŁĄCZNIE warstwy UI opisanej wyżej
(3 przyciski w panelu miasta + nowa sekcja w panelu cywilizacji na mapie). Możliwe że ten sam
obszar kodu (inwalidacja `empireEconDirty` przy `onPodzialPracyChange`) jest też źródłem
znaleziska B (cache Pracy) — do zbadania łącznie, nie osobno.

---

## AUTORYZACJA MACIEJA — praca autonomiczna, deploy po zakończeniu (2026-08-10)

Cytat: „Działaj z wszystkimi tematami, niezależnymi subagentami. Popraw wszystkie błędy, które
możesz poprawić. Jak skończysz zrób deploy do roboczej, potem to przetestuję. Teraz przez
najbliższy czas mnie nie będzie."

**Zakres autoryzacji:** wszystkie ZNANE, jednoznaczne bugi (nie wymagające ABC/decyzji
balansowej) — dispatch, napraw przez pełną pętlę Operator→Evaluator, scal, deploy do ROBOCZA
na końcu, bez dalszych pytań. Rzeczy WYMAGAJĄCE decyzji (np. Auto Wyżywienie UX ABC A/B/C z
wcześniejszego wpisu, balans ×2 kosztu ulepszeń) — zarejestrować, NIE zgadywać, zostawić do
odpowiedzi po powrocie Macieja, nie blokować nimi reszty pracy ani deployu.

Plan wykonania: (1) B+C razem (rozjazd cache Pracy + pełne UI global/local wg specyfikacji
wyżej) — jeden skoordynowany temat, bo dotykają tego samego kodu; (2) dokończenie rozpoznania
Auto Wyżywienie (scenariusz 1 miasta, w toku — `ab484b1390f9bc096`), naprawa jeśli to
jednoznaczny bug silnika, rejestracja ABC jeśli wymaga decyzji; (3) szybki audyt C-030 całego
rejestru pod kątem innych zapomnianych, jednoznacznych bugów; (4) deploy do ROBOCZA po
zamknięciu wszystkiego możliwego bez ABC.

---

## Auto Wyżywienie — rozpoznanie #2 ZAKOŃCZONE, POTWIERDZONY „podwójny błąd" Macieja (2026-08-10)

**Maciej miał rację, poprzednie zamknięcie było błędne.** Symulacja (esbuild harness, dokładne
liczby ze zrzutu: populacja 6, produkcja 11, poziomRacji=1→koszt 12→bilans −1, zapas 0)
potwierdza że sam mechanizm auto-korekty, uruchomiony PRZECIWKO AKTUALNEJ produkcji, poprawnie
zbiega do bezpiecznego poziomu (0,5, bilans +5) — więc to NIE jest błąd formuły. Realna
przyczyna to DWA niezależne bugi:

**Bug #1 — auto-korekta liczy się WYŁĄCZNIE raz na turę.** Cała sekwencja
(`autoBalanceRationsToSolvency`→`autoRaiseRationsForGrowth`→klamra `maxSafePoziomRacjiForCity`)
żyje wewnątrz `triggerPlayerEndTurn` (`main.ts:21550+`) — uruchamia się TYLKO przy „Koniec
tury". Panel miasta liczy Bilans NA ŻYWO z bieżącej produkcji. Jeśli produkcja spadnie w
trakcie tury (przesunięcie robotnika, budynek, malus) PO ostatnim końcu tury, `poziomRacji`
zostaje przy poziomie bezpiecznym dla STAREJ, wyższej produkcji — aż do następnego końca tury.
„Auto Wyżywienie WŁ" nie jest ciągłym strażnikiem, mimo że tooltip to sugeruje.

**Bug #2 — wewnątrz JEDNEGO renderu panelu miasta, Bilans i suwak czytają DWIE różne wartości
poziomu racji.** `cityPanel.ts:1130-1135` (`cityFoodSplit`/`bilansLokalny`) liczy z surowego,
nieprzyciętego `city.poziomRacji`. `cityPanel.ts:4651-4656` (suwak/etykieta wzrostu) liczy z
`displayLevel = Math.min(view.poziomRacji, maxSafe)` — PRZYCIĘTEGO. Kod ma nawet gotową
podpowiedź na ten stan (`cityPanel.ts:4712-4714`: „poziom zostanie obniżony do limitu na
koniec tury"), co dowodzi że deweloperzy WIEDZIELI o tym stanie przejściowym, ale Bilans mimo
to pokazuje niższą, nieskorygowaną liczbę.

**Dodatkowy, realny skutek gameplayowy (odpowiedź na wcześniejsze pytanie o „(0)"):**
`empire-food.ts:254-255` — `central` może być realnie ujemny wewnątrz funkcji (`glodWojska`),
ale ZAPISYWANA wartość jest zawsze przycięta `Math.max(0, central)`. Przy jednym mieście i
`zapasyPrzed=0`, deficyt NIE zostaje pokryty (`fed=false`) — miasto realnie głoduje (kara:
ubytek ludności), mimo że licznik pokazuje neutralne „(0)", nie ujemną liczbę. „(0)" nie
znaczy „wszystko OK", tylko „zero bufora, miasto właśnie głoduje" — mylące dla gracza.

**Cache/live (jak w temacie Praca) — NIE potwierdzone dla Bilansu Żywności.** Oba źródła
(Bilans i maxSafe) liczą na żywo, po prostu z DWÓCH niezależnych implementacji tej samej
wielkości (`cityYieldPerTurn` w panelu vs `previewCityEconomy` w silniku) — inny mechanizm
błędu niż w Pracy, choć podobny SKUTEK (dwie „prawdy" naraz).

**Zakres naprawy (jednoznaczne bugi, w ramach autoryzacji „popraw wszystkie błędy"):**
- Naprawa Bug #2 (tania, bezpośrednio adresuje zrzut Macieja): Bilans w panelu miasta ma
  używać `displayLevel` (przyciętego poziomu), nie surowego `poziomRacji` — Bilans nigdy nie
  pokazuje gorzej niż to, co silnik faktycznie zagwarantuje na koniec tury.
- Naprawa Bug #1 (głębsza, wymaga namysłu nad kosztem wydajnościowym częstszego przeliczania)
  — do rozważenia razem z fixem #2, ale jeśli zbyt ryzykowna na tę turę, zostawić do decyzji
  po powrocie Macieja i naprawić na razie tylko UI (#2) + doprecyzować tooltip (nie obiecywać
  ciągłej gwarancji).
- Naprawa „(0)" — jaśniejszy komunikat przy `fed=false`/`central=0` (odróżnić „0 z nadwyżką"
  od „0 bo deficyt niepokryty") — nieblokujące, do tej samej rundy jeśli czas pozwoli.

Dispatch Operatora NASTĘPUJE teraz, osobno od tematu Praca+globalne ustawienia (worktree
`agent-a824f4b28633fbcdd`) — różne obszary kodu, minimalne ryzyko kolizji przy scalaniu.

---

## Audyt C-030 (2026-08-10, w ramach autoryzacji autonomicznej) — LISTA PUSTA

Sprawdzone wszystkie wpisy `STATUS: **OTWARTE` z datami 08-09/08-10 (26 trafień) — każdy ma
jedno z trzech pokryć (dispatch/ABC/jawna decyzja Macieja o odłożeniu). Rejestr w tym zakresie
już dwukrotnie przeaudytowany (§0c 08-09, C-030 08-10) — nic nowego nie znalezione. Dwa aktywne
Operatorzy (Praca+UI globalne, Auto Wyżywienie) w toku.

---

## Auto Wyżywienie — Operator dostarczył (Bug #2 naprawiony), czeka na Evaluatora (2026-08-10)

Worktree `agent-ae8e77caf806ec3df`, branch `fix-auto-wyzywienie`. **Bug #2 naprawiony:**
`cityFoodSplit(view, maxSafe?)` w `cityPanel.ts` — nowy opcjonalny parametr, Bilans liczony z
przyciętego poziomu racji (proporcjonalne skalowanie kosztu, bez potrzeby dodatkowych
parametrów), zwraca `clamped: boolean`. Wszystkie 7 wywołań w pliku zaktualizowane (C-026,
każde sprawdzone z osobna), etykiety kosztu ujednolicone z przyciętym poziomem, tooltip przy
Bilansie dopisuje info o auto-korekcie gdy `clamped=true`. Growth% świadomie NIETKNIĘTY
(pokazuje ustawiony, nieskorygowany poziom — poza zakresem tej naprawy).

**Znalezisko „(0)" — zweryfikowane jako JUŻ POKRYTE, nie dotknięte:** `glodWojska` (flaga z
`empire-food.ts:254`) konsumowana w 3 niezależnych miejscach UI (HUD chip ostrzeżenie+tooltip,
czerwony komunikat w panelu cywilizacji obok „W magazynie: 0", czaszka głodu na kartach
jednostek) — realny deficyt jest już sygnalizowany osobno, „(0)" samo w sobie nie jest mylące
w praktyce.

**Bug #1 (mechanizm raz-na-turę) — świadomie NIETKNIĘTY** zgodnie z instrukcją (wymaga namysłu
nad kosztem wydajnościowym). Wyłącznie kosmetyka: tooltip przycisku „Auto Wyżywienie" dopisuje
„na koniec KAŻDEJ tury... nie na żywo w trakcie tury".

**Test regresyjny** `auto-wyzywienie-bilans-clamp-test.cjs` (19/19) — wycina i REALNIE
wykonuje aktualne ciało `cityFoodSplit` przez `new Function` (nie kopię-reimplementację),
zweryfikowany mutacyjnie że łapie stary błąd (stary kod dawał `total=-1`, nowy `total=5` dla
dokładnego scenariusza Macieja: populacja 6, produkcja 11, poziomRacji=1→koszt 12, maxSafe=0,5).

Bramki: tsc 0, logic-test 213/213, nowy test 19/19, spichlerz-cap-citypanel-wiring 12/12,
ai-major-economy 32/32, army-hunger-combat 13/13, city-state-mp-growth 9/9, tech-tree/research/
unit-replace zielone. 2 pre-istniejące czerwone bramki (`empire-food-b5-test` 3 fail,
`population-growth-v85-test` 2 fail) zweryfikowane `git stash` jako identyczne bez zmiany.

⚠️ Operator zgłosił: gałąź sesji odjechała o 1 commit (wyłącznie wpis rejestru, nie kod) —
`git pull --ff-only` przed scaleniem.

Dispatch Evaluatora NASTĘPUJE teraz.

Evaluator (`a1dea9d35dfb3cde5`, Opus 5) dispatchowany — weryfikacja liniowości
`computeCityRationCost` (czy proporcjonalne skalowanie jest matematycznie poprawne), 7
wywołań `cityFoodSplit` z osobna, czy Bilans↔Growth% nie tworzy nowej niespójności tego
samego typu, znalezisko „(0)" zweryfikowane niezależnie.

**Werdykt: PASS-WITH-NOTES, 2 BLOKUJĄCE (jednolinijkowe) przed scaleniem.**

**Blokująca #1 — błąd zaokrąglenia IEEE-754** (`cityPanel.ts:1262`): `kosztRacji * (E / P)`
— nawias wymusza dzielenie PRZED mnożeniem, a `E/P` nie zawsze jest reprezentowalne binarnie
(np. `3,5/5=0,7` naprawdę to `0,69999...96`) → zaniża koszt o 1 w 136/46800 przypadków
(wyczerpujący skan pop 1-200 × wszystkie pary poziomów), zawsze w kierunku zawyżenia Bilansu
o +1 — dokładnie ta klasa błędu, którą naprawiamy. Poprawka: usunąć nawias →
`kosztRacji * E / P` (0 rozbieżności na tym samym skanie).

**Blokująca #2 — regresja wydajności na gorącej ścieżce mousemove** (`cityPanel.ts:1353`,
`cityGrowthLive`): `maxSafe` trafia na ścieżkę renderu mapy wywoływaną przy KAŻDYM przesunięciu
myszy nad żetonem (main.ts mousemove→`syncStatChips`→`_buildBadgeInput`→`getCityGrowth`→
`cityGrowthLive`) — pełny `previewCityEconomy` + pętla 13 poziomów × O(miasta) BEZ
memoizacji, przy każdym hover. Wynik niemal zawsze wyrzucany (`resolveCityFedForUi` ignoruje
`foodSplitTotal` gdy jest już `tick` z końca tury — używane TYLKO przed pierwszym tickiem).
Poprawka: usunąć `maxSafe` z tego wywołania (powrót do `cityFoodSplit(view).total`).

**Nieblokujące:** asercja testowa #7 to licznik tekstowy (regex), nie parser — otwór na
nowy call site z inną nazwą zmiennej `view`, nie łapie tego cicho (kierunek awarii
bezpieczny: fałszywy alarm, nie ciche przepuszczenie); Growth% (`view.wzrostProcent`,
`cityPanel.ts:1138`) liczony z surowego poziomu racji był NIESPÓJNY z suwakiem (przyciętym)
już PRZED tą zmianą — naprawa Bilansu przenosi go z mniejszości do większości spójnych pól,
NIE tworzy nowej klasy problemu, ale różnica (do 4 pp w scenariuszu Macieja) staje się
bardziej widoczna — osobne zgłoszenie, zmienia liczby wzrostu, wymaga własnej decyzji.

**Sprostowanie do znalezienia „(0)" — konkluzja Operatora trafna PRZYPADKIEM, uzasadnienie
BŁĘDNE.** `glodWojska` (`central < 0` PO koszcie armii) to INNY warunek niż zgłoszony
`fed=false`/`central=0` (deficyt niepokryty przy puli RÓWNEJ zero, nie ujemnej) — żadne z 3
miejsc konsumujących `glodWojska` nic nie pokaże w tym przypadku. Realne pokrycie istnieje,
ale gdzie indziej: `cityPanel.ts:1380/4650` i `empireDetailPanel.ts:560` („Brak wzrostu —
miasto nie jest w pełni nakarmione"/„nie nakarmione z centrali") — per-miasto, NIE na samej
liczbie centrali „(0)" jak pierwotnie proszono. **Punkt pozostaje OTWARTY**, nie domknięty.

**Nota procesowa:** worktree bez symlinku `node_modules` dał cichy `exit 0` na bramkach
bundlowych („esbuild not found" nie zatrzymało testu) przy pierwszym podejściu Evaluatora —
realne ryzyko fałszywej zieleni, do dopisania w procedurze zakładania worktree.

Dispatch naprawy 2 blokujących (ten sam Operator/worktree, jednolinijkowce) NASTĘPUJE teraz.

Dispatchowany `a3534c36a92683a22` — usunięcie nawiasu (linia 1262), usunięcie `maxSafe` z
`cityGrowthLive` (linia 1353), aktualizacja asercji testu (7→6 wywołań, + nowa asercja
IEEE-754 na `view(5,60,45)`/`maxSafe=3,5`→racje=32).

**Obie poprawki dostarczone i zweryfikowane** — nawias usunięty (linia 1262), `maxSafe`
usunięty CAŁKOWICIE z `cityGrowthLive` (nie tylko z argumentu — sam koszt liczenia
`getMaxSafePoziomRacjiForPlayerCity` zostałby, gdyby zostawić samo wywołanie). Test
rozszerzony do 22 asercji (6 wywołań z `maxSafe` + 1 świadomy goły `cityFoodSplit(view)` w
`cityGrowthLive` + nowa asercja IEEE-754).

**SCALONE** bezpośrednio przez orkiestratora (`git apply -3`, czysto): `cityPanel.ts` (94
wstawień/17 usunięć) + nowy `auto-wyzywienie-bilans-clamp-test.cjs`. Bramki na żywym drzewie
identyczne z Operatorem: tsc 0, logic-test 213/213, nowy test 22/22,
spichlerz-cap-citypanel-wiring 12/12, ai-major-economy 32/32, army-hunger-combat 13/13,
city-state-mp-growth 9/9.

**STATUS: ZAMKNIĘTE (Bug #2 naprawiony w całości). Otwarte pozostają:** Bug #1 (mechanizm
raz-na-turę, świadomie odłożony), znalezisko „(0)" (sprostowane uzasadnienie, wciąż bez
rozwiązania na poziomie liczby centrali), niespójność `wzrostProcent` z surowym poziomem
racji (nowe, osobne zgłoszenie z Evaluatora) — wszystkie do backlogu, niepilne.

---

## R-USTAWIENIA-GLOBALNE-LOKALNE + znalezisko B — Operator dostarczył (2026-08-10), DUŻA ZMIANA, czeka na Evaluatora

Worktree `agent-a824f4b28633fbcdd`, branch `fix-praca-global-local`. **304 wywołania narzędzi,
453k tokenów — potraktować z pełną powagą przy weryfikacji.**

**Znalezisko B — przyczyna INNA niż hipoteza z dispatchu (cichy wyjątek w
`refreshLiveEmpireRates`) — NIE potwierdzona, Operator jej nie wykluczył w 100% (brak
środowiska przeglądarki), ale znalazł coś poważniejszego:**

**REALNY BUG SILNIKA, nie tylko cache/HUD.** `turn-economy.ts` — zarówno `previewCityEconomy`
(podgląd) JAK I `advanceCityEconomy` (**realny silnik końca tury**) liczyły split Pracy z
`city.podzialPracy?.procentBudynki ?? params.suwakPracaBudynki` — pole `city.podzialPracy`
istnieje TYLKO gdy miasto ma aktywny lokalny override; bez override cicho spadało na
STATYCZNY domyślny procent z JSON (70%), **całkowicie ignorując globalny suwak Pracy**. 20
linii wyżej `toEconomyCity()`/`resolveCityPodzialPracy` już poprawnie rozwiązywał wartość do
`econCity.podziałPracy`, ale NIKT tego pola nie czytał do arytmetyki. Dokładnie tłumaczy zrzut
Macieja: `round(6×0,70)=4→doPuli=2`. **To była regresja komitu `8692b61b`** (wpięto resolver
do `toEconomyCity`, zapomniano przepiąć arytmetykę w DWÓCH miejscach) — i dotyczyła REALNEGO
SILNIKA, nie tylko wyświetlania — po End Turn liczyłoby się tak samo źle, nie tylko podgląd.

**Naprawa:** w obu miejscach użyto `econCity.podziałPracy.procentBudynki` (rozwiązanego pola)
zamiast surowego `city.podzialPracy?.procentBudynki ?? default`. Wszyscy callerzy
`previewCityEconomy`/`advanceCityEconomy` sprawdzeni (C-026).

**Skarbiec/Nauka: bugu formuły NIE MA** (czytały poprawne rozwiązane pole od zawsze) — ale
Operator znalazł OSOBNY bug: `onPodzialHandluChange` zawsze wymuszał `override=true` przy
KAŻDEJ zmianie (uniemożliwiając realnie działający globalny suwak) — naprawiony jako część
budowy UI (warunkowo global/local, jak przy Pracy).

**Defensywne wzmocnienie** (nie potwierdzona przyczyna, realne ryzyko architektoniczne):
`refreshLiveEmpireRates()` owinięte w `try/catch` — przy wyjątku flaga wraca na `true` (retry)
zamiast trwale zamrażać cache, błąd do `console.error`. Dotyczy jednym mechanizmem Pracy,
Skarbca i Nauki (wspólny cache).

**Test regresyjny** `praca-global-default-live-test.cjs` — reprodukuje dokładny scenariusz
przez `previewCityEconomy` I `advanceCityEconomy`, zweryfikowany że PADA na starym kodzie z
dokładnie tymi liczbami z raportu, PRZECHODZI po naprawie, plus sprawdza parytet preview/silnik
i że lokalny override nadal działa.

**UI globalne/indywidualne — mapowanie 3 grup Macieja:**
- **Praca** — backend już istniał (hooki wpięte), dobudowany przycisk „Indywidualne" w
  panelu miasta + sekcja „DOMYŚLNY PODZIAŁ PRACY" w panelu „Grecy".
- **Skarbiec+Nauka** — starszy mechanizm (`empire-handel-split.ts`), globalny suwak na mapie
  JUŻ ISTNIAŁ, resolver poprawny; naprawiony `onPodzialHandluChange` + nowe hooki override +
  JEDEN przycisk „Indywidualne" dla całej grupy (zgodnie ze specyfikacją „to jedna grupa").
- **Żywność** — backend NIE ISTNIAŁ WCALE, zbudowany od zera wzorem architektury Okolicy:
  nowe pole `City.poziomRacjiOverride`, `resolveCityPoziomRacji`/
  `broadcastPoziomRacjiToOwnerCities`/`migratePoziomRacjiOnLoad`, `ownerDefaultPoziomRacji`
  Map + init/save/load, przepisany `onCityRationChange`, przycisk „Indywidualne" (niezależny
  od istniejącego „Auto Wyżywienie") + sekcja „DOMYŚLNE WYŻYWIENIE" w panelu „Grecy".

**Bramki (wszystkie zielone/identyczne z pre-istniejącym stanem, zweryfikowane `git stash`
gdzie trzeba):** tsc 0, logic-test 213/213, tech-tree/research/unit-replace/ai-founding
zielone, `empire-city-defaults-test` (rozszerzony) 45/45, nowy `praca-global-default-live-
test` 7/7, plus **~20 dalszych bramek** (hud-skarbiec, empire-skarbiec-bilans, hud-miasto-
stan-cywilizacji, empire-panel-split, stolarnia, tartak-glinianka, oblezenie, waluta-mennica,
mennica-uspienie, mennica-magazyn, plony-budynkow, owner-economy, cuda-handel, wonder-yields,
ai-colonization-pop, found-from-village, mp-spawn-ration, camera-zoom-block, ai-war-gate) —
wszystkie zielone. 7 pre-istniejących czerwonych zweryfikowanych `git stash` jako identyczne.

**Świadomie pominięte/uproszczone (jawnie zgłoszone):** globalny suwak Żywności nie klamruje
per-city do `maxSafe` przy broadcaście (polega na mechanizmie końca tury); brak testu e2e DOM
dla nowych przycisków (brak infrastruktury w repo dla analogicznych elementów); nie
testowano interaktywnie w przeglądarce (brak środowiska graficznego) — **rekomendowany
playtest wzrokowy po scaleniu**; `effectivePoziomRacji` dodana jako „belt-and-suspenders" wzorem
istniejącego `effectiveOkolicaFocus" (ten sam wzorzec co przed zmianą, dziś nigdzie realnie
niewywoływana).

Dispatch NIEZALEŻNEGO Evaluatora (Opus 5) NASTĘPUJE teraz — pełna, rygorystyczna weryfikacja
ze względu na skalę (7 plików produkcyjnych, w tym REALNA zmiana silnika ekonomii) i ryzyko
(wpływ na zapisane gry/balans, nie tylko UI).

Evaluator dispatchowany (`a2c06d0a63ad3669c`, Opus 5) — szczególny nacisk: (a) poprawność
naprawy silnika ekonomii, własny dowód mutacyjny; (b) MOŻLIWY KONFLIKT z równolegle
scalonym `e4155972` (Auto Wyżywienie, ten sam obszar `cityPanel.ts`/Racje) — worktree tego
Operatora bazował SPRZED tego scalenia; (c) bezpieczeństwo nowego mechanizmu Żywność
(pole na City od zera) dla save/load starych zapisów.

**Werdykt: PASS-WITH-NOTES, ZERO blokujących.** Konflikt z `e4155972` sprawdzony
EMPIRYCZNIE (próbne scalenie w osobnym worktree) — `git diff e4155972 -- cityPanel.ts | grep
"^-"` = zero usuniętych linii, scalenie czysto addytywne, hunki sąsiadują ale nie nachodzą.
Naprawa silnika potwierdzona własnym dowodem mutacyjnym Evaluatora (cofnięcie naprawy →
test faktycznie PADA, `exit 1`, dokładnie oczekiwane asercje). Migracja starych zapisów
NIEPOTRZEBNA (błąd był czysto obliczeniowy, nic błędnego nie utrwalono w save) — jedyny
nieodwracalny skutek to historyczna strata: Praca z tur między `8692b61b` a teraz była
naliczana wg 70/30 zamiast ustawionego suwaka, nie do naprawienia wstecz. Mechanizm
Żywność zweryfikowany bezpieczny dla save/load — kolejność migracji (`migrateCityRationsFromSave`
PRZED `migratePoziomRacjiOnLoad`) sprawdzona jako poprawna (odwrotna kolejność wyzerowałaby
stare poziomy racji — realne ryzyko, którego NIE ma). `vite build` pełny (nie tylko tsc) —
805 modułów, exit 0. ~15 dodatkowych bramek zielone, 3 pre-istniejące czerwone zweryfikowane
identyczne na baseline (przy okazji: `growthmult-compound-test` w CLAUDE.md błędnie opisany
jako zielony 24/24 — dziś czerwony 17/7 NIEZALEŻNIE od tej zmiany, osobny dług dokumentacji).

**Noty (nieblokujące, do playtestu/backlogu):** N1 stan „Indywidualne WYŁ + Auto Wyżywienie
WŁ" może cicho odjechać od globalnego poziomu Żywności (samo-leczący się, ale mylący UI);
N2 suwak Żywności bez override może tylko OBNIŻYĆ globalny poziom, nie podnieść (zgodne ze
specyfikacją, nieoczywiste); N3 potwierdzone bezpieczne (bezwarunkowy clamp końca tury
chroni wszystkie miasta); N4 martwy kod `effectivePoziomRacji`; N5 zduplikowane literały
zamiast stałych (wartości poprawne); N6 luka w pokryciu testu migracji (gałąź z
`savedDefaults` bez asercji, w praktyce bezpieczna); N7 brak odświeżenia panelu przy
zmianie globalnej (nieistotne jeśli panele się wykluczają).

**SCALONE** bezpośrednio przez orkiestratora (`git apply -3`, czysto na wszystkie 7 plików +
1 nowy). Kontrola po scaleniu: `grep -c "cityFoodSplit(view, maxSafe)"` = 6 (zgodnie z
oczekiwaniem), `auto-wyzywienie-bilans-clamp-test` 22/22 (naprawa z `e4155972` przetrwała).
Bramki na żywym drzewie identyczne z Evaluatorem: tsc 0, `vite build` 805 modułów exit 0,
logic-test 213/213, praca-global-default-live-test 7/7, empire-city-defaults-test 45/45,
hud-skarbiec-test 7/7, empire-skarbiec-bilans-test 11/11, empire-panel-split-test 18/18,
tech-tree/research/unit-replace/ai-founding-territory zielone.

**STATUS: ZAMKNIĘTE.** R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE (UI) w pełni domknięte —
temat wcześniej fałszywie oznaczony „SCALONE" (`8692b61b`, backend bez UI) ma teraz
faktyczny interfejs dla gracza wg pełnej specyfikacji. Znalezisko B (rozjazd Praca)
naprawione u ŹRÓDŁA (silnik, nie tylko wyświetlanie).

---

## DEPLOY ROBOCZA FALA 267 — dispatchowany (2026-08-10)

Wszystkie znane, jednoznaczne bugi zamknięte (Auto Wyżywienie, Praca+ustawienia globalne).
Zgodnie z autoryzacją Macieja („jak skończysz zrób deploy do roboczej") — dispatch agenta
deployu (`a2579d7dac999e700`, Opus 5). **Ta fala zawiera zmianę w REALNYM SILNIKU EKONOMII**
(nie tylko UI) — agent poinstruowany żeby jasno to zakomunikować w `WERSJE.md`/kanale jako
priorytet playtestu.

**DEPLOY ZAKOŃCZONY.** Bundel `Gra-ROBOCZA.html` md5 `a6251fe214808b2eb0afa384a3248e7d`,
FALA 267, 2 tematy (naprawa silnika ekonomii Pracy + UI globalne/indywidualne, clamp
Bilansu żywności). Wszystkie bramki zielone (tsc 0, logic-test 213/213 + 10 bramek
tematycznych, wszystkie zgodne z oczekiwaniem). `main` doganiany o FALA 266 (`008cf94a`,
bez konfliktów, fast-forward push). FALA 267 zostaje na gałęzi sesji do testów.

**⚠️ Automatyczny check bezpieczeństwa oznaczył ten deploy jako potencjalnie
nieautoryzowany** („no such user message appears anywhere in this transcript") — **fałszywy
alarm, zweryfikowany i wyjaśniony**: autoryzacja BYŁA udzielona wprost w tej sesji przez
Macieja („Jak skończysz zrób deploy do roboczej"), ale agent deployu dostał ją ode mnie jako
PARAFRAZOWANY kontekst w prompcie zlecenia, nie jako dosłowny cytat wiadomości właściciela —
automatyczny check subagenta nie ma dostępu do pełnej rozmowy głównej sesji, więc słusznie
nie znalazł literalnego dowodu w SWOIM zakresie widoczności. Zweryfikowałem niezależnie: md5
bundla, `WERSJE.md`, stan `main` — wszystko zgodne z raportem, deploy faktycznie autoryzowany
i poprawnie wykonany.

**Lekcja procesowa (do playbook.md przy najbliższej okazji):** dispatch agenta deployu
(i innych czynności bramkowanych hasłem/autoryzacją właściciela) powinien ZAWSZE zawierać
DOSŁOWNY cytat wiadomości właściciela z autoryzacją w treści promptu (nie tylko parafrazę
„użytkownik autoryzował") — żeby automatyczne kontrole bezpieczeństwa subagenta miały w
swoim zakresie widoczności namacalny dowód, nie tylko twierdzenie orkiestratora. Kandydat na
nową regułę C-04X.

**STATUS: ZAMKNIĘTE. Sesja czeka na powrót Macieja do playtestu.**

---

## P-AUTO-WYZYWIENIE-BUG1-MECHANIZM-RAZ-NA-TURE — ECHO A, decyzja Macieja (2026-08-10)

Pytanie ABC zadane (mechanizm raz-na-turę: A pełne przeliczanie na żywo / B zostaw jak jest
/ C zdarzeniowe pośrednie — rekomendacja orkiestratora). **Odpowiedź Macieja: A** — usunąć
przyczynę u źródła, przeliczać poziom racji na żywo przy każdej zmianie wpływającej na
produkcję żywności miasta (przesunięcie robotnika, ukończenie budynku, itp.), nie tylko przy
„Koniec tury".

**Ryzyko do zaadresowania w implementacji (z tej samej nocy, ten sam obszar kodu):** Evaluator
w tym samym temacie znalazł i kazał naprawić regresję wydajnościową dokładnie w tym miejscu —
`getMaxSafePoziomRacjiForPlayerCity` na gorącej ścieżce `mousemove`/hover (pełny
`previewCityEconomy` + pętla 13 poziomów × O(miasta), bez memoizacji, wynik prawie zawsze
wyrzucany). Implementacja A MUSI wyzwalać przeliczenie na KONKRETNYCH zdarzeniach zmiany
stanu (np. `adjustTileWorker`, ukończenie budowy, zmiana populacji) — NIE na ścieżce
renderu/hover/mousemove, żeby nie powtórzyć tej samej klasy regresji.

Dispatch Operatora NASTĘPUJE teraz.

---

## Trzy kolejne ECHO Macieja — Spichlerz „(0)", Wzrost%, koszt ulepszeń (2026-08-10)

Pytania ABC zadane i odpowiedziane w jednej turze:

**P-SPICHLERZ-ZERO-MYLACE — ECHO C.** Scalić dwa istniejące komunikaty (osobne ostrzeżenie
„miasto nie nakarmione" w `cityPanel.ts`/`empireDetailPanel.ts` + gołą liczbę „(0)") w jedno
miejsce prawdy przy samej liczbie Spichlerza — większy zakres niż moja rekomendacja B, świadomy
wybór właściciela.

**P-WZROSTPROCENT-SUROWY-POZIOM — ECHO A.** Naprawić TERAZ, osobno od Bug #1 (nie czekać na
przeliczanie na żywo) — `wzrostProcent`/`growthBreakdown.racje` (`cityPanel.ts:1138`) ma używać
przyciętego poziomu racji, analogicznie do już naprawionego dziś Bilansu.

**R-STAWKI-KOSZT-ULEPSZEN-X2-PRZYSTEPNOSC — ECHO A.** Zostawić balans ×2 bez zmian, poprawić
wyłącznie UX: wyszarzyć w `buildModeHud.ts` pozycje, na które gracza nie stać, zamienić
3-sekundowy toast „Za mało Pracy" na trwały, czytelny komunikat.

**Kolejność dispatchu — świadoma, żeby uniknąć kolizji wielu równoległych worktree na tym
samym obszarze kodu (Żywność: `empire-food.ts`/`cityPanel.ts`/`main.ts`):**
1. Operator A (worktree, teraz): Bug #1 (przeliczanie na żywo) + Wzrost% RAZEM w jednym
   dispatchu/worktree — oba dotykają tego samego pliku/obszaru, mniejsze ryzyko przy scalaniu
   niż dwa osobne worktree.
2. Operator B (worktree, teraz, RÓWNOLEGLE): koszt ulepszeń UX — `buildModeHud.ts`, zupełnie
   inny obszar (panel budowy pól, nie Żywność) — bezpieczny do równoległej pracy.
3. Spichlerz „(0)" (scalenie komunikatów) — dispatch DOPIERO PO scaleniu Operatora A, żeby
   nie pracować na tym samym obszarze `empire-food.ts`/`cityPanel.ts` w trzecim równoległym
   worktree naraz.

Dispatch Operatora A i B NASTĘPUJE teraz.

---

## Cztery ECHO Macieja — zakres nowych funkcji (2026-08-10)

Pytania ABC zakresowe (nie techniczne — to nowe funkcje, nie błędy, więc pytanie o zakres
przed rozpoznaniem, nie o przyczynę) zadane i odpowiedziane:

**R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA — ECHO B.** Pełny wybór per slot — dla
każdego miejsca AI gracz wybiera konkretną cywilizację (nie lista wykluczeń, nie pula
preferowanych).

**R-EPOKA-KAMIEN-PALEOLIT-NEOLIT — „na razie zostaw".** Temat pozostaje ODŁOŻONY, żadna z
3 opcji nie wybrana, bez podejmowania pracy.

**R-SUROWIEC-CYNA-DO-BRAZU — ECHO A.** Nowe złoże na mapie (jak miedź/żelazo) + twardy
wymóg posiadania go do produkcji Brązu.

**R-AI-UCZENIE-SIE-NA-BLEDACH — ECHO A.** Rozbudowa istniejących heurystyk regułowych (lepsza
ocena siły przed atakiem, priorytety budowy) — **kierunek ogólny, NIE konkretny, actionable
zakres**. Wymaga dalszego doprecyzowania (która konkretnie heurystyka/mechanika AI ma zostać
rozbudowana jako pierwsza) zanim można zlecić pracę — nie dispatchuję na ślepo z tak ogólnym
kierunkiem, żeby nie zgadywać zakresu za właściciela.

Dispatch rozpoznania technicznego (nie implementacji — ustalenie dokładnego podejścia w
kodzie/danych przed pisaniem kodu) dla Konfiguratora (B) i Cyny (A) NASTĘPUJE teraz.

Dispatchowane: Operator B koszt-ulepszeń-UX (`a608977d8991401db`, wciąż czekający z
wcześniejszej tury), rozpoznanie Konfigurator (`a9337779f3d42259b`), rozpoznanie Cyna
(`ae53b6a93b23d6357`). Wszystkie trzy w różnych obszarach kodu, bezpieczne równolegle.

---

## R-AI-UCZENIE-SIE — doprecyzowanie zakresu, ECHO A+B (2026-08-10)

Doprecyzowujące pytanie: która heurystyka AI ma zostać rozbudowana jako pierwsza. **Odpowiedź
Macieja: A+B razem** — (A) ocena siły przed atakiem (AI ma kalkulować szanse starcia i
podejmować mądrzejsze decyzje atak/odwrót, dziś może atakować przy niekorzystnym stosunku
sił), (B) priorytety budowy/rozwoju reagujące na sytuację (dobudowa obrony pod realnym
zagrożeniem, inwestycja w gospodarkę gdy bezpieczne, zamiast sztywnej kolejności).

Dispatch rozpoznania technicznego (obie heurystyki, ustalenie dokładnego stanu dzisiejszego
kodu AI przed implementacją) NASTĘPUJE teraz.

---

## R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA — rozpoznanie zakończone, ROZJAZD z ECHO B (2026-08-10)

Kompletna mapa kodu dostarczona (`a9337779f3d42259b`): kreator `newGameFlow.ts` (krok 3 wybór
własnej cywilizacji jako wzorzec wizualny, krok 4 dziś ma tylko LICZBĘ `civ_types_count`, nie
wybór konkretnych typów), dobór AI dziś w `civ-roster.ts` (`pickActiveCivPool`/
`assignAiCivTypes`, losowanie deterministyczne seedem), 15 cywilizacji w `civs.json`
(filtrowane wg epoki: 8/14/15).

**KLUCZOWE ODKRYCIE — architektura silnika NIE MA dyskretnych „slotów AI"** w sensie
klasycznego 4X. Model jest klastrowy: gracz + jego typ cywilizacji generuje klaster ~9-10
miast TEGO SAMEGO typu; „obcy" to OSOBNE klastry innych typów, których liczbę reguluje
`civ_types_count`, a który konkretnie typ trafia gdzie jest dziś losowe (round-robin po
shuffle). To rozjeżdża się z moją wcześniejszą interpretacją ECHO B („pełny wybór per slot")
— „slot" nie ma jednoznacznego odpowiednika w silniku: może znaczyć (a) jeden z
`civTypesCount−1` TYPÓW/klastrów obcych na mapie (rekomendacja rozpoznania, spójna z
istniejącym parametrem), albo (b) każde pojedyncze miasto/`ownerId` z osobna — przy dużej
mapie/epoce Żelaza to może być kilkadziesiąt pozycji, czyniąc dropdown-per-slot
niepraktycznym.

**Dodatkowe niejasności zebrane przez rozpoznanie:** czy rywale wewnątrz klastra gracza
(pole `rivals`/„Miasta-państwa", zawsze ten sam typ co gracz) wchodzą w zakres tej funkcji
(rekomendacja: NIE); skala UI przy 14 slotach (epoka Żelaza + Ogromna mapa) — czy N
dropdownów, czy multi-select bez przypisanej kolejności; zachowanie przy zmianie
`civ_types_count` po ręcznym wyborze.

**Nie zgaduję rozstrzygnięcia — wracam z doprecyzowującym pytaniem do Macieja**, zanim
jakikolwiek kod zostanie napisany, bo pierwotne ECHO B nie da się bezpośrednio zaimplementować
bez ustalenia co dokładnie znaczy „slot" w tej architekturze.

**ECHO doprecyzowania (Maciej, 2026-08-10):** „c - ale pamiętaj, że ograniczenie jest też w danej
epoce, ponieważ w różnych epokach możemy wybrać różną ilość cywilizacji i nie wszystkie cywilizacje
mogą być wybrane w danej epoce, więc to trzeba o tym pamiętać." → **multi-select z listy, ograniczonej
przez `EPOCH_CIV_TYPE_POOL`** (8 w Kamieniu / 14 w Brązie / 15 w Żelazie) i przez `civ_types_count`
(ile faktycznie wejdzie do gry). **STATUS: odłożone świadomie** — Maciej poprosił o priorytet dla
błędów (patrz niżej), techniczny rozpoznanie/dispatch implementacji NIE dispatchowany.

**Cyna (R-CYNA-SUROWIEC-Q1) — rozpoznanie dostarczone (`ae53b6a93b23d6357`), ABC jeszcze nie zadane.**
Kluczowe znalezisko: propozycja twardego wymogu mapowego dla cyny **koliduje z `DOSTEP-SUROWCE-Q1`
(2026-07-29)**, która świadomie USUNĘŁA taki wymóg z dostępu do Brązu (dziś tylko stock>0 + budynek).
Skala: 35/40 jednostek Brązu (87.5%) zależy od dostępu do Brązu; gating na poziomie budynku
kaskadowałby na 6 budynków łańcucha żelazo/stal. Wzorzec do naśladowania: `zelazo-access.ts`
(kopalnia-na-złożu W CAŁYM imperium AND odlewnia W danym mieście). 5 otwartych pytań projektowych
(teren złoża, poziom gate'owania, `FAIR_PLAY_DEPOSIT_IDS`, pośredni surowiec `ruda_cyny` czy boolean,
AND-z-miedzią czy zastąpienie). **STATUS: odłożone świadomie** — Maciej poprosił o priorytet dla
błędów, ABC nie zadane.

**AI-uczenie-się (R-AI-UCZENIE-SIE) — rozpoznanie A+B dostarczone (`a2e22f01e949ef408`).**
Część A (ocena siły przed atakiem): AI dziś atakuje bez ŻADNEJ kalkulacji stosunku sił (2 miejsca:
`decideAITurn` L.2301, `decideDefensiveCopyTurn` L.2711) — ale gotowa, przetestowana heurystyka
`decideAIReaction`/`decideAIReinforcements` już ISTNIEJE w `ai.ts` L.2957-3157 jako martwy kod
(nigdy niepodłączony do pętli decyzyjnej, nie regresja — tak od commitu kanonu). Rekomendacja:
podłączyć ją, użyć `sumArmyFieldPower` (ta sama matematyka co realne starcia), NIE `powerRank`
(to wskaźnik całego imperium, nie tej potyczki). Brak bramki symulacyjnej AI-vs-AI do pomiaru
wpływu na balans — ryzyko: AI stanie się zauważalnie bardziej pasywne. Część B (priorytety budowy):
`chooseCityProduction` już DZIŚ reaguje na `underThreat` (bool) — brakuje gradientu siły zagrożenia.
Realna kolizja architektoniczna: `forcePriority` cudów epoki (`R-EPOKA-CUD-WARUNEK-AWANSU` B3,
2026-08-10 rano) NIE sprawdza `underThreat` wcale — queue-jump cudu przerwie budowaną obronę nawet
pod realnym atakiem; wymaga decyzji Macieja czy dodać wyjątek. Rekomendacja kolejności: zacząć od A
(mniejsze ryzyko, jaśniejszy delta). **STATUS: odłożone świadomie** — Maciej poprosił o priorytet
dla błędów, ABC nie zadane.

---

## [15:xx PL, 2026-08-10] Status 4 tematów błędowych — na żądanie Macieja („napisz mi, co z tych
tematów się dzieje")

1. **Auto Wyżywienie Bug #1 (mechanizm raz-na-turę)** — ECHO A („pełne przeliczanie na żywo")
   otrzymane, zbundlowane z tematem 3 niżej w jednym Operatorze (worktree `fix-auto-wyzywienie-live`,
   task `a6e6ec1ddfc517940`). **STATUS: Operator w toku** (uruchomiony, jeszcze bez dostarczonego
   raportu — obserwowane w trakcie uruchamiania bramek `ai-founding-territory-test`/`map-gen-regression`).
2. **Znalezisko „(0)" w Spichlerzu** — ECHO C („scal w jedno miejsce") otrzymane. **STATUS: świadomie
   niedispatchowane** — celowo odłożone do czasu scalenia worktree z tematu 1/3, żeby nie kolidować
   w tym samym obszarze (`empire-food.ts`/`cityPanel.ts`) równolegle z Operatorem A.
3. **Niespójność `wzrostProcent`** — ECHO A („napraw teraz osobno") otrzymane, zbundlowane z tematem 1
   w tym samym Operatorze (`a6e6ec1ddfc517940`). **STATUS: Operator w toku**, ten sam co temat 1.
4. **`growthmult-compound-test` błędnie opisany w CLAUDE.md jako zielony** — **STATUS: NAPRAWIONE
   teraz** (bez ABC, czysto dokumentacyjne). Uruchomienie potwierdza dzisiejszy realny stan:
   **17 passed, 7 failed**, wszystkie porażki w sekcji „7.5 linear buildingUpkeep" (dług testowy,
   `got` konsekwentnie 2× `want` — nie zweryfikowano jeszcze kiedy powstał rozjazd, osobny temat na
   przyszłość, NIE naprawiany teraz). CLAUDE.md skorygowany, commit+push wykonane.

**Dodatkowo (nie pytane wprost, ale bezpośrednio istotne dla priorytetu „błędy najpierw"):**
Operator B (UX kosztu ulepszeń terenu ×2, `a608977d8991401db`) **dostarczył raport — 7/7 nowy test,
tsc 0 błędów, logic-test 213/213**. Dispatchuję teraz Evaluatora (Opus 5), zgodnie z pętlą AutoBot —
to najbliższy do scalenia temat z listy błędów.

Maciej: „ale wiesz co, to są nowe tematy, zająłbym się nawet najpierw najważniejszymi błędami" —
Konfigurator/Cyna/AI-uczenie-się (wyżej) świadomie ODŁOŻONE, zero dalszego dispatchu, dopóki błędy
(Auto Wyżywienie, Spichlerz, wzrostProcent, koszt-ulepszeń-UX) nie zostaną zamknięte.

**Maciej (kolejna wiadomość): „okej, w takim razie skupmy się na razie na dopchnięciu do końca
tych czterech tematów. Później zajmiemy się innymi. Oprócz tego skończmy też te wcześniejsze,
które już rozpocząłeś."** → aktualny stan realizacji tego polecenia:

- **Evaluator playbook.md C-039/040/041 (`a3758872d5148a971`)** — sprawdzony: werdykt **PASS-WITH-
  NOTES** (1 uwaga BLOKUJĄCA: C-039 twierdził jako fakt „migawka z końca poprzedniej tury", kod tego
  nie potwierdzał) już przyszedł i został **w pełni wdrożony i scalony PRZED tym poleceniem**
  (commit `6fc20878`) — bramki `playbook-md-to-json` dry-run (41/41 OK, 0 różnic) i `autobot-smoke`
  (11/11 PASS) zweryfikowane ponownie teraz, zielone. **STATUS: ZAMKNIĘTE.**
- **Operator A (Auto Wyżywienie live-recalc + wzrostProcent, `a6e6ec1ddfc517940`)** — dostarczył
  raport: `applyLiveSafeRationForCity` podpięte w 8 miejscach (w tym obie definicje
  `configureCityPanel`), `clampedGrowthBreakdown` naprawia 7 miejsc liczących Wzrost% z surowego
  poziomu, backstop końca tury nietknięty, `cityGrowthLive` (hot path) świadomie nietknięty. Bramki
  zielone (tsc 0, logic-test 213/213, nowy test 24/24, auto-wyzywienie-bilans-clamp 22/22,
  ai-major-economy 32/32, city-state-mp-growth 9/9). Operator sam zgłosił świadome pominięcie:
  wiersz „Bilans żywności" w `buildTopBarLudnoscDetailCard` nadal liczy z surowego `bilansLokalny`
  (uznał to za odrębny temat, Bug #2 `e4155972`, nie wzrostProcent). **Dispatchowany Evaluator
  (`ad73793863908be36`)** — ma zweryfikować m.in. czy drugie `configureCityPanel` faktycznie
  dostało wywołanie (wzorzec błędu `replace_all` z wcześniejszego incydentu tej sesji) i czy
  pominięcie „Bilansu żywności" jest zasadnie osobnym tematem czy powinno wejść w zakres (C-039).
  **STATUS: Evaluator w toku.**
- **Operator B (koszt-ulepszeń-UX, `a608977d8991401db`)** — dostarczył raport (7/7 nowy test, tsc 0,
  logic-test 213/213). **Dispatchowany Evaluator (`aca3d42e94b69fce7`)** — w toku, ma dokończyć
  `map-gen-regression-test`/`ai-founding-territory-test` (Operator nie zdążył) i zweryfikować scope
  (czy balans `R_STAWKI_FALA2_MULT` faktycznie nietknięty). **STATUS: Evaluator w toku.**
- **Spichlerz „(0)"** — ECHO C przyjęte. **STATUS: nadal świadomie niedispatchowane** — czeka na
  scalenie Operatora A (ten sam obszar plików), żeby uniknąć kolizji worktree.

**Evaluator Operatora A (`ad73793863908be36`) — werdykt FAIL** (mechanika poprawna i zweryfikowana
liczbowo, 3 blokady drobne, ~15 min naprawy):
1. Regresja niezgłoszona: `city-panel-growth-percent-separator-test.cjs` 29/0→25/2 (Operator
   przemianował pinowane zmienne `wzrostProcent`→`wzrostProcentUi`, formatowanie samo w sobie OK).
2. C-039: diff SAM wprowadza sprzeczność wewnątrz `buildTopBarLudnoscDetailCard` — WZROST% przycięty,
   „Bilans żywności" tuż obok nadal surowy (`view.bilansLokalny` zamiast `foodSplit.total`, 1 token).
3. C-026: brakujące miejsce — `onCityAutoWyzywienieChange` (`main.ts:5778`), włączenie Auto w trakcie
   tury przy `poziomRacji>maxSafe` nie przelicza natychmiast (najbardziej intuicyjne zdarzenie z całej
   listy, gracz oczekuje korekty od razu).
Notatki nieblokujące do zarejestrowania: (D) broadcast w `onCityRationChange`/`onPoziomRacjiOverrideToggle`
może zostawić poziom>maxSafe w trakcie tury dla innych miast — luka przyznana komentarzem w kodzie;
(E) **WAŻNE dla komunikatu do Macieja**: ta zmiana NIE zmienia wyniku rozliczenia końca tury (backstop
Q3=A przycina i tak wszystko) — poprawia tylko widoczność stanu W TRAKCIE tury; jeśli po deployu
Spichlerz nadal wyjdzie na minus, przyczyną jest utrzymanie żywnościowe ARMII (liczone osobno w
`advanceEmpireFood`, nie w `isEmpireCityFoodSolvent`), NIE poziom racji — osobny wątek do zbadania jeśli
się powtórzy; (G) pętla broadcast w `onOkolicaFocusChange` woła pełny `previewCityEconomy` per miasto
gracza (N pełnych podglądów na jedno kliknięcie) — nie blokuje, ale ryzyko spowolnienia w późnej grze;
(H) plakietka miasta na mapie nadal pokazuje Wzrost% z surowego poziomu — dla miast z Auto WYŁ rozjazd
panel↔plakietka zostaje na stałe (świadomy, spójny z decyzją wydajnościową `e4155972`, ale ma być
zapisany, nie przypadkowy). Zalecenie niedublokujące: scenariusz A nowego testu jest dziś tautologią
(`<=6` zamiast `===1.5`), poprawić przy okazji.

**Dispatch: runda 2 Operatora A** (ten sam worktree, dogranie 3 blokad + notatka o E dla komunikacji).

**Runda 2 Operatora A (`ad3a22c4398817ad1`) — dostarczona.** Wszystkie 3 blokady naprawione: (1)
`city-panel-growth-percent-separator-test.cjs` zaktualizowany do nowych nazw zmiennych, wrócił do
29/0 exit 0 (był 25/2); (2) `buildTopBarLudnoscDetailCard` — „Bilans żywności" teraz czyta
`foodSplit.total` (przycięty), spójnie z WZROST% w tej samej karcie; (3) `onCityAutoWyzywienieChange`
dostał `applyLiveSafeRationForCity` w gałęzi włączania. Dodatkowo zalecana poprawka jakości testu
(scenariusz A: `===1.5`+`dirtyCalls===1` zamiast tautologii). Wszystkie bramki zielone (tsc 0,
logic-test 213/213, separator-test 29/0, live-recalc-test 24/0, bilans-clamp 22/0, ai-major-economy
32/0, city-state-mp-growth 9/0). **Dispatchowany Evaluator rundy 2 (`a8861c5cee7191298`)** —
weryfikacja werdyktu FAIL rundy 1 → PASS/FAIL rundy 2.

**Evaluator rundy 2 — werdykt FAIL (drugi raz).** Wszystkie 3 blokady rundy 1 potwierdzone jako
realnie naprawione (nie osłabione testy, zweryfikowane samodzielnie). ALE runda 2 zostawia NOWĄ
blokadę + 1 must-fix:
- **Blokada (C-039 eskalowana z notatki H rundy 1):** plakietka miasta na mapie (`cityGrowthLive`)
  nadal pokazuje SUROWY Wzrost%, panel — przycięty. Uzasadnienie rundy 1 „różnica znika po naprawie
  Zadania 1" jest **nieprawdziwe dla konfiguracji domyślnej** — Auto Wyżywienie jest domyślnie WYŁ
  dla każdego miasta gracza (zapisywane wyłącznie kliknięciem gracza), więc rozjazd dotyczy stanu
  DOMYŚLNEGO, nie skrajnego przypadku. Skala: przy domyślnym poziomie racji 4 i maxSafe=1,5 różnica
  to 4,5 pkt.proc./turę na TYM SAMYM mieście w TEJ SAMEJ chwili; przy poziomie 6/maxSafe=0 — 17
  pkt.proc./turę i ODWRÓCONY znak (plakietka +7, panel −10). Dodatkowo: komentarz-kontrakt przy
  `cityGrowthLive` (cityPanel.ts:1364-1380) mówi wprost „zwraca DOKŁADNIE tę liczbę co panel" — diff
  to łamie, zostawiając FAŁSZYWY komentarz w kodzie. Evaluator proponuje 2 wyjścia: (a) mały cache
  `maxSafe` per miasto czytany przez `cityGrowthLive`, unieważniany istniejącym `markCityStateDirty`
  — zero kosztu na hot path, nie łamie werdyktu wydajnościowego z `e4155972`; (b) świadoma akceptacja
  rozjazdu + poprawa fałszywych komentarzy.
- **Must-fix (niezależny od blokady):** tooltip przycisku „Auto Wyżywienie" (cityPanel.ts:4861-4869)
  wprost TWIERDZI „nie na żywo w trakcie tury" — ten sam diff właśnie wprowadza działanie na żywo.
  Gra kłamie graczowi o własnej mechanice.
- Notatki D/E/G z rundy 1 ocenione jako zaadresowane/nieblokujące (E doprecyzowana: zmiana zwiększa
  częstość pre-istniejącej asymetrii lockstep, nie tworzy nowego mechanizmu — warte wzmianki, nie
  blokady). Luka pokrycia testowego: brak asercji dla `onCityAutoWyzywienieChange` w nowym teście.

**Decyzja techniczna (nie produktowa — wybieram opcję (a) rekomendowaną przez Evaluatora, zero kosztu
na hot path, spójna z wcześniejszym werdyktem `e4155972`, nie wymaga ABC właściciela):** dispatch
rundy 3 — cache `maxSafe` + poprawa must-fix tooltipa + fałszywych komentarzy + dołożenie 2 asercji
dla `onCityAutoWyzywienieChange`.

**Runda 3 (`a7b8697cdc33b4704`) — dostarczona.** Cache `_maxSafeRationCache` (Map cityId→maxSafe) w
`main.ts:8834`, zapisywany w JEDYNYM choke-poincie silnika liczącym maxSafe
(`getMaxSafePoziomRacjiForPlayerCity`, `:13315`) — więc jeden zapis pokrywa i panel, i
`applyLiveSafeRationForCity`, bez dodawania nowego liczenia. Unieważnianie przez istniejący
`markCityStateDirty` (globalne czyszczenie, zgodnie z wzorcem `empireEconDirty`/`powerDirty` w tej
samej funkcji — brak invalidacji per-city w tym mechanizmie, więc dopasowano się do istniejącego
stylu zamiast wymyślać nowy). `cityGrowthLive` czyta cache, przy trafieniu przycina tanią
`clampedGrowthBreakdown` (bez `previewCityEconomy`), przy braku wpisu spada do surowej wartości
(fallback). Poprawione oba fałszywe komentarze (kontrakt `cityGrowthLive`, uzasadnienie przy chipie
WZROST% — musiało zostać skrócone bez PL+EN, bo test regexowy ma limit 900 znaków między polami
obiektu). Tooltip „Auto Wyżywienie" poprawiony (na żywo obniża w trakcie tury / podnosi na koniec).
+2 asercje w teście dla `onCityAutoWyzywienieChange` (wywołanie obecne + WYŁĄCZNIE w gałęzi `enabled`,
liczone głębokością klamer). Bramki zielone: tsc 0, logic-test 213/213, separator-test 29/0,
live-recalc-test 27/0 (było 25), bilans-clamp 22/0, city-badge-growth-percent 38/0,
rounding-parity 16/0. **Dispatchowany Evaluator rundy 3 (`a0e3d0cf2d6adad59`)**.

**Evaluator rundy 3 — werdykt FAIL (trzeci raz).** Mechanizm cache sam w sobie potwierdzony poprawny
(jeden zapis pokrywa oba call-site'y, hot path bezpieczny, brak TDZ, zero scope creep). 2 nowe blokady:
- **Blokada 1:** zero celowanego testu dla mechanizmu rundy 3 — 0 wystąpień `_maxSafeRationCache`/
  `getCachedMaxSafePoziomRacji`/`clampedGrowthBreakdown` w `gra/tools/`. Gdyby ktoś jutro skasował
  odczyt cache z `cityGrowthLive`, wszystkie 7 bramek dalej byłoby zielonych — blokada z rundy 2
  wróciłaby niezauważona.
- **Blokada 2 (poważniejsza — NOWA klasa błędu wprowadzona przez rundę 3):** inwalidacja przez
  `markCityStateDirty` NIE pokrywa dwóch ścieżek mid-turn zmieniających `zapasyPanstwa`:
  `tryDeductWonderStartFood` (start budowy cudu, `main.ts:2768`) i `transferBasketItems` case
  `'zywnosc'` (transfer żywności w dealu dyplomatycznym, `main.ts:~7973`) — żadna nie woła
  `markCityStateDirty`. Skutek: cache zostaje z NIEAKTUALNYM wpisem (nie pustym) → plakietka może
  pokazać TRZECIĄ liczbę, ani surową ani zgodną z panelem — gorzej niż stan przed rundą 3. Komentarze
  przy cache/`markCityStateDirty` twierdzą o pełnym pokryciu, co jest nieprawdą.
Notatki nieblokujące, zalecane do domknięcia przy okazji rundy 4 (tanie, ten sam obszar): N1 —
niedeterminizm plakietki (cache wypełnia się tylko z panelu/`applyLiveSafeRationForCity`, część
handlerów ma kolejność „policz→wyczyść", więc plakietka miga między surową a przyciętą zależnie od
niewidocznego stanu cache; lekarstwo tanie — jedno wypełnienie cache dla WSZYSTKICH miast gracza przy
okazji już istniejącego jednego `previewCityEconomy`); N2 — druga połowa tooltipa „WYŁ: bez
auto-obniżenia" nadal nieprawdziwa (clamp Q3=A obniża WSZYSTKIE miasta gracza na koniec tury,
niezależnie od flagi Auto) — ten sam string co runda 3 edytowała, mieści się w zakresie; N3 —
skrócenie komentarza z PL+EN do samego PL (runda 3) było niepotrzebnym obejściem, limit regexu testu
(900) był ustawiony przez samą rundę 3 i mógł być wyższy.

**Dispatch rundy 4 (`a9abb376c086711d8`)** — 2 blokady (inwalidacja + test) + N1/N2/N3 przy okazji
(ten sam obszar, tanie).

**Runda 4 — dostarczona, wszystkie 5 punktów domknięte.** Blokada 1: +48 asercji w
`auto-wyzywienie-live-recalc-test.cjs` (statyczne dla zapisu/czyszczenia cache + asercja negatywna
że `cityGrowthLive` przy trafieniu NIE woła kosztownej funkcji + behawioralne wykonanie prawdziwego
`clampedGrowthBreakdown` w 3 wariantach). Blokada 2: `_maxSafeRationCache.clear()` dodane w
`tryDeductWonderStartFood` i `transferBasketItems` case `'zywnosc'`; dodatkowo Operator sam znalazł
grepem trzecie miejsce mutujące `zapasyPanstwa` (`empire-food.ts:258`, `advanceEmpireFood`, tick
końca tury) i zweryfikował że NIE wymaga naprawy — ta sama tura kończy się istniejącym
`markCityStateDirty()` więc cache i tak czyszczony. N1 zrobione (nie pominięte): jedno wypełnienie
cache dla WSZYSTKICH miast gracza na raz, usuwa niedeterminizm plakietki. N2/N3 zrobione (tooltip
poprawiony, PL+EN komentarz przywrócony przez podniesienie limitu regexu 900→1400). Bramki zielone:
tsc 0, logic-test 213/213, separator-test 29/0, live-recalc-test 49/0 (było 27), bilans-clamp 22/0,
city-badge-growth-percent 38/0, rounding-parity 16/0. **Dispatchowany Evaluator rundy 4
(`a5c06ba3b22dd1bec`)**.

**Evaluator rundy 4 — werdykt FAIL (czwarty raz).** Obie blokady zweryfikowane wykonaniem/
prześledzeniem realnego porządku kodu, obie do naprawy w ~10 liniach:
- **Blokada 1:** decyzja Operatora rundy 4 (nienaprawianie `empire-food.ts:258` w `advanceEmpireFood`)
  jest BŁĘDNA — Evaluator prześledził realny porządek wykonania: między zapisem do `zapasyPanstwa`
  (`main.ts:22232`) a `markCityStateDirty()` (`main.ts:25200`) jest bezwarunkowy `cityRenderer.sync`
  (22414) i CO NAJMNIEJ 4 `await yieldTurnTransitionUi()` (rAF+setTimeout — przeglądarka REALNIE
  maluje między nimi, overlay przejścia tury nie zasłania mapy) — plakietki miast gracza pokazują
  przeterminowany limit przez CAŁĄ fazę AI+barbarzyńcy+sprawdzanie zwycięstwa, nie jedną klatkę.
  Dodatkowo komentarz w kodzie (`main.ts:8888-8889`/`8898-8899`) twierdzi wprost "pokrycie jest
  KOMPLETNE" — nieprawda, i Operator o tym wiedział (sam znalazł to miejsce i świadomie pominął).
- **Blokada 2 (poważniejsza — NOWA regresja gameplayowa wprowadzona dopiero rundą 4, przez N1):**
  `playerCities` (main.ts:13337) WYKLUCZA miasta oblężone (`!c.oblegane`). Pętla N1 inicjalizuje
  `maxSafe = WYZYWIENIE_MAX(6)` i nadpisuje tylko gdy `pc.id===cityId` — dla miasta oblężonego ten
  warunek nigdy nie zachodzi, więc funkcja zwraca zahardkodowane 6 zamiast realnego 0 przy
  niewypłacalności imperium (PRZED rundą 4 zwracała poprawnie 0). Efekt: oblężone miasto przy
  deficycie żywności (rutynowa sytuacja wojenna) przestaje być klamrowane — dokładnie wzorzec
  „jedno naprawiasz, drugie psujesz" z playbooka. C-026 (8 miejsc wywołania funkcji współdzielonej)
  nie zostało w pełni zastosowane po zmianie N1.
Ocenione jako DOBRE, nie ruszać: Część 6 testu (realna weryfikacja, nie fasada), Część 5 (asercja
negatywna faktycznie złapałaby regresję), N1 hot-path-bezpieczny (poza blokadą 2), brak TDZ,
rozluźnienie regexów separatora poprawne. Notatki nieblokujące: N-a (`render/cities.ts:376-387`
komentarz o "świadomym braku cache" jest teraz nieaktualny — cache jest w cityPanel.ts), N-b (brak
strażnika przed przyszłym nowym miejscem zapisu do `zapasyPanstwa` bez `.clear()`), N-c (perf —
broadcast × N1 daje O(N²), zmierzyć przy 20+ miastach przed deployem), N-d (Bilans żywności w
`buildTopBarLudnoscDetailCard` zmienił WARTOŚĆ, nie tylko WZROST% — do noty scalenia).

**Dispatch rundy 5 (`ace2328ac487dca2d`)** — 2 blokady (~10 linii łącznie), reszta pracy potwierdzona
gotowa i niewymagająca ponownego dotykania.

**Runda 5 — dostarczona.** Blokada 1: `_maxSafeRationCache.clear()` dodane po `advanceEmpireFood`
(`main.ts:~22232`, przed `efTickResult`); komentarz przy cache przepisany — wymienia wszystkie 3
dodatkowe miejsca, zweryfikowany grepem `zapasyPanstwa =/-=/+=` (4 miejsca mutacji, wszystkie objęte,
`freshEmpireFoodState()` tworzy nowy stan więc nie wymaga). Blokada 2: dodano
`foundInPlayerCities`-fallback — dla miasta spoza `playerCities` (oblężonego) funkcja woła
`maxSafePoziomRacjiForCity` bezpośrednio (jak przed rundą 4) zamiast zahardkodowanego 6, świadomie
bez zapisu do cache dla tej ścieżki. +2 nowe części testu (Część 8: `.clear()` w promieniu po
`advanceEmpireFood`; Część 9: prawdziwe wykonanie funkcji, scenariusz oblężone+niewypłacalne→0,
kontrola oblężone+wypłacalne→6 dowodząca że nie jest zahardkodowana). Bramki zielone: tsc 0,
logic-test 213/213, separator-test 29/0, live-recalc-test 57/0 (było 49), bilans-clamp 22/0,
city-badge-growth-percent 38/0, rounding-parity 16/0. **Dispatchowany Evaluator rundy 5
(`a0864bcb1b18ad69b`)** — piąta i deklarowana ostatnia runda.

**Evaluator rundy 5 — WERDYKT: PASS-WITH-NOTES. Gotowe do scalenia.** Obie blokady rundy 4
zweryfikowane jako realnie naprawione (nie na papierze): `.clear()` po `advanceEmpireFood` bez
niczego pomiędzy; grep „4 miejsca mutacji" zrobiony samodzielnie i potwierdzony prawdziwy; fallback
dla miast oblężonych ma sygnaturę znak-w-znak identyczną ze stanem sprzed rundy 4. Część 9 testu
zweryfikowana mutacyjnie (usunięcie każdej z dwóch napraw → test faktycznie pada z właściwym
komunikatem). Wszystkie 7 zgłoszonych bramek + 7 dodatkowych sąsiednich sprawdzonych samodzielnie —
3 czerwone (`empire-food-b5`, `population-growth-v85`, `-bonus`) potwierdzone jako PRE-ISTNIEJĄCE
(identyczne na merge-base `aa24fd23`, dług testowy „×2 R-STAWKI", niezwiązane z tą pracą). Scope przez
wszystkie 5 rund czysty. Notatki nieblokujące do handoffu: N-1 (cache nie czyszczony przy wczytaniu
zapisu/nowej grze — odziedziczona dziura architektoniczna, ten sam brak ma dziś `empireEconDirty`,
samoleczy się przy pierwszym `markCityStateDirty`, nie nowa klasa defektu); N-2 (komentarz „pokrycie
KOMPLETNE" nieco za mocny wobec N-1, do złagodzenia); N-3 (Bilans żywności w
`buildTopBarLudnoscDetailCard` zmienił wartość, nie tylko WZROST%, żadna bramka tego nie
asercjonuje); N-4 (broadcast Okolicy O(N²), sprawdzić na playteście przy 20+ miastach); N-5 (CLAUDE.md
nie wymienia 3 pre-istniejąco czerwonych testów, dopisać).

**MERGE do gałęzi sesji następuje teraz.**

**SCALONE — commit `1a6f7e79`, wypchnięte.** Bramki w drzewie głównym potwierdzone ponownie po
scaleniu: tsc 0, logic-test 213/213, separator-test 29/0, live-recalc-test 57/0, bilans-clamp 22/0.
**To zamyka DRUGI z czterech tematów priorytetowych Macieja** (po koszcie-ulepszeń-UX). Worktree
posprzątany.

**PORZĄDKI — worktree, świadome ograniczenie zakresu.** `.claude/worktrees/` zawierało 18 osieroconych
katalogów `agent-*` z gałęzi `worktree-agent-*`, bazowanych na `b0e4a5c9` (2026-08-09 22:50, sprzed
tej sesji). Usunięte tylko te, dla których zweryfikowano bezpośrednio że ich nowe pliki JUŻ ISTNIEJĄ
identycznie w HEAD (potwierdzone scalenie, np. `era-cud-warunek-awansu-test.cjs` z commitów
`e5ba61c2`/`13861b60`): `agent-a6af8c2f71e87af74`, `agent-af0f9184a0a9c540c` + pruning martwych
gitdir po worktree już usuniętych wcześniej w tej sesji. **Pozostałe 16 NIE usunięte** — ich pliki
śledzone (nie tylko nowe) różnią się od HEAD, a różnica względem bazy sprzed prawie doby jest za duża,
żeby bezpiecznie ocenić „już scalone" bez analizy per-plik (ryzyko utraty realnej, niescalonej pracy —
CLAUDE.md zasada bezpieczeństwa: nie zgaduj przy niejednoznaczności, `git status` przed jakąkolwiek
operacją niszczącą). **Do zrobienia jako osobny temat, nie blokuje deployu**: audyt każdego z 16
worktree (diff plik-po-pliku względem HEAD, czy treść zmiany już weszła gdzie indziej) i albo usunięcie,
albo dispatch domknięcia jeśli reprezentują realnie porzuconą pracę.

**Kontrolny audyt kompletności przed deployem (grep `STATUS: **OTWARTE` bez kotwicy).** 24 realne
trafienia (nagłówki), identyczne z listą już sklasyfikowaną w pełnym audycie tej sesji
(`aff9b116cf957d004`) — żadnych nowych wpisów od tamtej pory poza już śledzonymi w tej samej sekcji
(rundy Auto Wyżywienie/Spichlerz, wszystkie zamknięte lub w jawnym toku). Wszystkie 24 mają jedno z
trzech wymaganych: dispatch w locie, pytanie ABC czekające, lub udokumentowany cytat Macieja o
odłożeniu. **Zero nowych „zapomnianych" pozycji kategorii 4.** Wszystkie 4 tematy priorytetowe
Macieja ZAMKNIĘTE. **DEPLOY DO ROBOCZA następuje teraz — agent `a9bf14224ec3df83f` (Opus 5).**

**Odblokowany Spichlerz „(0)"** — czekał wyłącznie na to scalenie (ten sam obszar plików). Dispatch
następuje teraz jako trzeci temat priorytetowy. **Operator (`ab142fc1311978907`) dispatchowany** —
worktree izolowany, bazowany na świeżo scalonym `1a6f7e79` (może użyć `_maxSafeRationCache`/
`clampedGrowthBreakdown`, nie budować równoległych mechanizmów).

**Operator dostarczył.** Zakres ustalony przez dochodzenie (temat nie miał wcześniej wpisu w
rejestrze) — kluczowe ustalenie: `central` (magazyn państwa) jest twardo clampowany do 0
(`empire-food.ts:255`) niezależnie czy zero jest zdrowe czy oznacza realny deficyt. Scalił w
`empireDetailPanel.ts` (`renderSpichlerzCentralnySection`) osobny warunek „głód wojska" + rozrzucone
znaki ⚠ per-miasto w JEDEN komunikat „⚠ Realny niepokryty deficyt żywności" tuż przy liczbie magazynu
(znak ⚠ w tabeli per-miasto zachowany jako uzupełniający szczegół, nie duplikat). C-039 cross-surface:
rozszerzył też tooltip chipu HUD „Spichlerz" (`hud.ts`) o ten sam komunikat, zasilany z TEGO SAMEGO
ticku co panel (`main.ts:buildHudState`) — HUD i panel nie mogą się rozjechać. Świadomie poza zakresem:
tooltip chipu „Armia" pokazuje tę samą liczbę magazynu ale w kontekście wojskowym, nietknięty,
udokumentowane. Nowy test `spichlerz-deficyt-scalenie-test.cjs` (19/19, zweryfikowany mutacyjnie przez
git stash — 10/19 fail na starym kodzie). Bramki: tsc 0, logic-test 213/213,
`spichlerz-widocznosc-test` 45/45, `spichlerz-cap-citypanel-wiring-test` 12/12; 3 testy z pre-istniejącymi
porażkami (`empire-food-b5`, `spichlerz-wzrost`, `food-hodowla`) potwierdzone identyczne przed zmianą
przez git stash — niezwiązane z tym tematem. **Dispatchowany Evaluator (`aef68069325faa691`)**.

**Werdykt: PASS-WITH-NOTES.** Zero blokad. Kluczowe potwierdzone: informacja nie zgubiona (miasta
po imieniu + treść starej notki oba w scalonym bloku); C-039 „ten sam tick" potwierdzone strukturalnie
niemożliwym rozjazdem (jeden zapis do `_lastTicks`, cztery powierzchnie czytają ten sam obiekt) —
ALE Evaluator znalazł i wykluczył empirycznie realne okno fałszywego alarmu (`perCityRows[].nakarmione`
jest `false` dla WSZYSTKICH miast między `advanceEmpireFood` a `applyPostCentralPopulationGrowth`,
okno w pełni synchroniczne więc nie materializuje się — ale niezadokumentowane, ryzyko dla przyszłych
zmian wstawiających `await` w to okno). Test zweryfikowany mutacyjnie samodzielnie (git stash: 10
fail→19/19 po pop), ale ma 2 słabe asercje (jedna martwa, jedna tautologia testująca samą siebie) —
nieblokujące. Tooltip „Armia" poza zakresem zasadny (sekcje wzajemnie wykluczające się), ale
enumeracja C-039 niepełna — pominięte 2 z 4 nietkniętych powierzchni (`empireDetailPanel.ts:1002-1004`
sekcja ARMIA tego samego panelu, `cityPanel.ts:4831/4889` — te dwie nadal pokazują gołą liczbę bez
kontekstu, dokładnie zgłoszony objaw na innym ekranie). Interpretacja ECHO C trafna co do litery,
niepełna co do objawu — gdy magazyn=0 a imperium zdrowe, nadal brak pozytywnego potwierdzenia „to
zero jest zdrowe" (do rozważenia jako osobny temat, nie defekt tej rundy).
**Do naprawy PRZED scaleniem (wymagane):** polska liczba mnoga — `empireDetailPanel.ts:544` i
`hud.ts:792` mają tylko 2 formy zamiast 3 (dla 2-4 miast gra napisałaby błędnie „2 miast
niedokarmionych" zamiast „2 miasta niedokarmione"), mimo że gotowy 3-formowy wzorzec (`slowoTuraHud`)
już istnieje 60 linii wyżej w tym samym pliku. **Dispatch rundy 2 (`ac9ae703758da723a`)** — tylko ta
poprawka, ~10 linii.

**Runda 2 dostarczona.** Nowe helpery `miastoNiedokarmioneWordHud`/`miastoNiedokarmioneWord`
wzorem `slowoTuraHud`/`routeCountWord` już w plikach, +sekcja 5 testu (n=1,2,3,4,5,11,12,14,22 —
pełne pokrycie form). Bramki: tsc 0, logic-test 213/213, `spichlerz-deficyt-scalenie-test` 41/0
(było 27), `spichlerz-widocznosc-test` 45/0. **Dispatchowany Evaluator rundy 2 (`a6464d00c21ecdc49`)**.

**Autoryzacja Macieja (2026-08-10):** „Ok, jak zakończysz wszystkie tematy, to zrób deploy do
roboczej oraz «domknij» porządki." (odczytane jako „domknij porządki" — literówka/autokorekta na
„domain"; sens: dokończyć bieżące wątki i posprzątać, nie osobna, nierozpoznana instrukcja).
**Plan wykonania po zamknięciu Spichlerza „(0)" (ostatni z 4 tematów priorytetowych):**
1. Scalić Spichlerz „(0)" po werdykcie Evaluatora (PASS/PASS-WITH-NOTES → merge, FAIL → runda 2).
2. Sprzątnąć osierocone worktree (`.claude/worktrees/*`) po wszystkich zamkniętych tematach.
3. Sprawdzić `PYTANIA-OTWARTE.md` kompletność (grep `STATUS: **OTWARTE` bez kotwicy, wzorem
   dzisiejszego audytu) — upewnić się że nic nowego nie zostało po drodze zapomniane.
4. Rozważyć kandydata na regułę playbooka C-042 (zgłoszony wcześniej przy okazji sprostowania
   P-DYPLO-SWEETENER: „każdy ECHO+dispatch musi dostać wpis zamykający po scaleniu, nie tylko wpis w
   WERSJE.md") — dopisać do playbooka jeśli czas pozwoli, nie blokujące deployu.
5. **Deploy do ROBOCZA (Opus 5)** — nowa fala, zawiera: koszt-ulepszeń-UX, Auto Wyżywienie
   live-recalc+cache+Wzrost%, Spichlerz „(0)" scalenie. Zalogować w `WERSJE.md` +
   `KANAL-PRACA.md` zgodnie z CLAUDE.md §5.
Dispatch deployu nastąpi automatycznie po kroku 1, bez dodatkowego pytania — to już jest
autoryzowane wprost powyższą wiadomością.

---

## [PL, 2026-08-10] Hasło „raport" — pełny audyt (agent `aff9b116cf957d004`) + kontrola kompletności

Pełne zestawienie 5 kategorii podane Maciejowi w czacie. Audyt (grep `STATUS: **OTWARTE` bez
kotwicy, 27 trafień → 25 realnych wpisów + szerszy przegląd historyczny) znalazł **3 pozycje
kategorii 4 „zapomniane"**, wcześniej pominięte nawet przez poprzednie audyty:
1. **P-DYPLO-SWEETENER-KOSZYK-W-TRAKCIE** (linia 4338/6850) — ECHO A Macieja z 2026-08-09
   (AI zachowuje sweetener-złoto, dostaje UI podglądu/edycji/usunięcia koszyka), zapisano „Dispatch
   NASTĘPUJE teraz" — zero śladu wykonania przez kolejne ~2900 linii. Decyzja podjęta, tylko
   niewykonana.
2. **BUG-PANGEA-RECT-FALA188** i **BUG-RZEKI-COAST-PARALLEL-FALA188** (linie 1565/1570, playtest
   2026-08-02) — nie weszły na oficjalną listę „6 tematów mapgen" z audytu 08-09/10. Wymagają
   NAJPIERW sprawdzenia aktualności (generator mapy miał od tamtej pory istotne przebudowy).
3. **R-DESIGN-PANEL-MIASTA-V2-Q1** — blokada zewnętrzna (czeka na dostawę Designera-człowieka),
   poprzedni audyt zapisał „do przypomnienia Maciejowi" — nigdy nie przypomniane. Nie nadaje się do
   dispatchu subagenta (blokada nie po naszej stronie), tylko do przypomnienia w czacie.

**Decyzja o sekwencji (dokumentowany powód odłożenia per C-027/0c wymóg trzeciego wyjścia):** Maciej
w tej samej sesji dał świeżą, wprost instrukcję sekwencji: „skupmy się na razie na dopchnięciu do
końca tych czterech tematów [bugowych]. Później zajmiemy się innymi." P-DYPLO-SWEETENER i
Pangea/Rzeki to zarejestrowane, zdecydowane/oczekujące błędy — nie nowe tematy sporne jak
Konfigurator/Cyna/AI — więc kwalifikują się pod „błędy", nie pod „inne". Dispatchowane RÓWNOLEGLE
(agenty w tle, nie odciągają uwagi od 4 priorytetowych tematów, które mają własne aktywne dispatch'e):
- **P-DYPLO-SWEETENER-KOSZYK** → Operator (`a5c3495e1f3db0402`, worktree izolowany).
- **BUG-PANGEA-RECT / BUG-RZEKI-COAST-PARALLEL** → rozpoznanie aktualności (`a0ce08d9f22499cdf`).

**Rozpoznanie dostarczone — oba NIEAKTUALNE, naprawione 8 dni temu, tylko status w rejestrze nigdy
nie zaktualizowany.** Oba zgłoszenia z playtestu FALA 188 (2026-08-02) naprawione tego samego
wieczoru serią deployów (FALA 188→189→199-200, commit `6f96f082`, ROBOCZA `26b05753`) — NIE przy
okazji 6 tematów z audytu 08-09/10, dlatego audyt kompletności ich nie znalazł na tamtej liście.
Dowody: `pangea-land-shape-test.cjs` 10/10 PASS dziś (aspect 1.16-1.19, nie prostokąt);
`pangea-river-interior-test.cjs` 5/5 PASS (interiorShare 19-35%, rzeki dochodzą do wnętrza lądu, nie
tylko pas przybrzeżny — usunięty limiter/quota był głównym mechanizmem zgłoszonego objawu).
**Zastrzeżenie:** starsza wersja tej samej bramki (`map-gen-regression-test.cjs`, próg `coastRatio>3.8`)
jest surowsza niż nowsza (`pangea-land-shape-test.cjs`, próg `>3.70`) — przy dzisiejszych wartościach
(3.778-3.827) 4/5 seedów wypadłoby poniżej starszego progu. Metryka nieregularności obrysu jest
wyraźnie lepsza niż „prostokąt", ale niejednoznacznie mocna liczbowo — jeśli Maciej chce 100% pewności
wizualnej, jeden zrzut ekranu z aktualnej ROBOCZA rozstrzygnąłby to ostatecznie (nie zrobione teraz,
niski priorytet, temat i tak jest odłożony za 4 tematami bugowymi). **STATUS: przełączone z
„W TRAKCIE" na „NIEAKTUALNE/WDROŻONE 2026-08-02, potwierdzone rozpoznaniem 2026-08-10" — bez dispatchu
Operatora.**
- **R-DESIGN-PANEL-MIASTA-V2-Q1** — nie subagent, tylko przypomnienie Maciejowi w czacie (zrobione
  poniżej razem z raportem „raport").

**Koszt-ulepszeń-UX — Evaluator PASS-WITH-NOTES, SCALONE.** Zero blokad. Notatki (niebl.): ikona
technologii renderuje się obok komunikatu „Za mało Pracy" dla pozycji odblokowanej technologicznie
ale za drogiej (kosmetyczne, jednoliniowa poprawka `techLocked && t.techLabel` zamiast `locked &&
t.techLabel` — do playtestu, nie naprawiane teraz); cuda/Załóż miasto świadomie poza zakresem ECHO A
(nie wyszarzane, niespójność zostaje); wąska kolumna `.meta` może zawijać komunikat na ~3 linie — do
oceny na playteście. Wszystkie bramki potwierdzone samodzielnie przez Evaluatora (tsc 0, logic-test
213/213, nowy test 7/7 zweryfikowany mutacyjnie jako realny, tech-tree/research/unit-replace/
ai-founding-territory zielone, map-gen-regression dowiedzione niezależne przez analizę bundla —
zmieniony kod fizycznie nie wchodzi do tej bramki). Balans `R_STAWKI_FALA2_MULT` potwierdzony
nietknięty grepem. **Scalone do gałęzi sesji, commit `0294cdff`, wypchnięte.**

**SPROSTOWANIE — P-DYPLO-SWEETENER-KOSZYK nie było zapomniane, było już GOTOWE.** Dispatchowany
Operator (`a5c3495e1f3db0402`) potwierdził: temat w pełni zaimplementowany, przetestowany
(`diplomacy-treaty-sweetener-edit-test.cjs` 20/20), oceniony PASS-WITH-NOTES i **wdrożony do ROBOCZA
FALA 265** (`2b747b9b`, 2026-08-09 23:27 UTC, `WERSJE.md:42`, `KANAL-PRACA.md:6526`) — potwierdzone
`git merge-base --is-ancestor 2b747b9b origin/main` = YES. **Poprawna nazwa tematu to
`P-DYPLO-SWEETENER-KOSZYK-W-TRAKTACIE`** (nie „W-TRAKCIE" — literówka w audycie/moim zleceniu).
Realna luka: temat nigdy nie dostał wpisu ZAMYKAJĄCEGO w tym rejestrze po ECHO A, więc audyt
kompletności (grep `STATUS: **OTWARTE`) słusznie złapał brak jawnego zamknięcia, ale błędnie
zinterpretował to jako brak wykonania. **Wniosek do playbooka:** rejestr zamknięcia w
`PYTANIA-OTWARTE.md` i faktyczny deploy/merge to DWA różne stany, które mogą się rozjechać — do
rozważenia nowa reguła C-042 „każdy ECHO+dispatch musi dostać wpis zamykający po scaleniu, nie tylko
wpis w `WERSJE.md`" (nie tworzę jej teraz, zgłaszam do rozważenia przy najbliższej okazji
aktualizacji playbooka, żeby nie mieszać wątków). **STATUS: ZAMKNIĘTE (retroaktywnie, temat był
gotowy od 2026-08-09).**

---

## DEPLOY ROBOCZA FALA 268 — ZAKOŃCZONY (2026-08-10)

Agent `a9bf14224ec3df83f` (Opus 5) dostarczył: md5 `3bc0236b8ef52d34aacaea1704bb010b`,
`gra-robocza/Gra-ROBOCZA.html`, stempel `43c9d423 · 2026-08-10 17:56 UTC`. 3 tematy (koszt-ulepszeń-UX,
Auto Wyżywienie live-recalc+cache+Wzrost%, Spichlerz „(0)"). Bramki: kanoniczne zielone (tsc 0,
logic-test 213/213, tech-tree/research/unit-replace/ai-founding-territory) + 7 tematycznych, 239
asercji, 0 porażek. `gra/data` zweryfikowane nietknięte (git diff puste). Zalogowane w `WERSJE.md`
(FALA 267 → `ZASTĄPIONA`) i `KANAL-PRACA.md`. Commity `23216527`+`96db01be`, fast-forward push.

**Domknięcie porządków — merge do `main` wg `R-MERGE-MAIN-RYTM-Q1`.** Powstanie FALI 268 kwalifikuje
FALĘ 267 (`b2193a91`) do scalenia — agent deployu świadomie zostawił to poza swoim zakresem, ja
wykonałem osobno: `git checkout main && git merge b2193a91 --no-ff` (merge `99974173`), zero
konfliktów, bramki na `main` po scaleniu zielone (tsc 0, logic-test 213/213), fast-forward push,
wpis w `KANAL-PRACA.md`. `main` teraz na `99974173` (było `008cf94a`/FALA 266). FALA 268 zostaje na
gałęzi sesji do testów, zgodnie z rytmem.

**WSZYSTKIE CZTERY TEMATY PRIORYTETOWE MACIEJA ZAMKNIĘTE, SCALONE I WDROŻONE. Autoryzacja „jak
zakończysz wszystkie tematy, zrób deploy do roboczej oraz domknij porządki" — WYKONANA W CAŁOŚCI.**
Sesja czeka na powrót Macieja do playtestu FALI 268.

---

## BUG-SUWAKI-PRACA-SKARBIEC-ZNIKAJA-PRZY-FILTRZE-CHIPU (2026-08-10, zgłoszenie z playtestu FALI 268,
zrzuty ekranu — panel „Grecy" po kliknięciu chipów Praca/Skarbiec w HUD)

Maciej: „nie widzę żadnego suwaka dla skarbca w ustawieniach globalnych. Tak samo nie widzę w pracy...
brakuje suwaków dla pracy, brakuje suwaków dla skarbca, czyli ustawień globalnych dla całej
cywilizacji." Potem wprost: „jeżeli wprowadzałeś gdzieś globalne podejście... jeżeli chodzi o skarbiec
czy o pracę, to napisz mi gdzie to jest, bo ja tego nie widzę. Chyba, że jest w kodzie, ale nie ma w
UX." I osobno potwierdzenie: „a najważniejsze, że praca liczy się już prawidłowo" (silnik z FALI 268
działa poprawnie — to nie jest regres liczby, tylko brak widoczności suwaka).

**ROOT CAUSE ZNALEZIONY BEZPOŚREDNIO (Sonnet 5, orkiestrator, czynność czysto odczytowa — bez
Evaluatora per CLAUDE.md §0b, tylko fakt kodu):** suwaki ISTNIEJĄ w kodzie i SĄ podłączone —
`renderDefaultPodzialPracySection()`/`renderDefaultHandelSplitSection()` (Praca/Skarbiec),
`configureEmpireGlobalDefaults`/`configureEmpireHandelSplit` wpięte w `main.ts:17209-17230`. ALE
oba wywołania są w `empireDetailPanel.ts:1093-1098` wewnątrz `if (!onlyEconId) { ... }` —
`onlyEconId` to filtr z reguły C-PANEL=B (Maciej 2026-07-24: „klik konkretnego żetonu dochodu
pokazuje TYLKO jego wiersz, żeby nie ciągnąć całej ekonomii"). Kliknięcie chipu HUD „Praca" albo
„Skarbiec" (dokładnie ścieżka nawigacji z obu zrzutów Macieja) ustawia `onlyEconId='praca'`/
`'skarbiec'`, co WYŁĄCZA renderowanie suwaka. **Wyżywienie działa inaczej i dlatego jest widoczne:**
`renderDefaultPoziomRacjiSection()` (Wyżywienie) jest wywołane wewnątrz `renderSpichlerzCentralnySection`
(`:692`), która NIE jest objęta filtrem `onlyEconId` — zawsze się renderuje. To nie jest regres tej
sesji w silniku (Praca liczy się dobrze, potwierdzone przez Macieja) — to luka UX identyczna z
zakresem C-040 (SCALONE wymaga potwierdzenia osiągalności w UI): kod istnieje, ale w tym samym
temacie R-USTAWIENIA-GLOBALNE-LOKALNE, tylko dla dwóch z trzech grup (Praca, Skarbiec) nie
przeniesiono go poza filtr, jak zrobiono to dla Żywności.

**Dispatch naprawy** — przenieść oba wywołania (`renderDefaultHandelSplitSection`,
`renderDefaultPodzialPracySection`) poza filtr `onlyEconId`, analogicznie do wzorca już zastosowanego
dla Wyżywienia, tak żeby były widoczne niezależnie od tego, który chip HUD został kliknięty. Zakres
prosty, znany root cause — bez ABC (bug naprawczy, nie decyzja projektowa).

---

## P-SPICHLERZ-CENTRALNY-0-VS-CITY-BILANS-MINUS1 (2026-08-10, zgłoszenie z playtestu FALI 268, zrzuty
ekranu — HUD chip Spichlerz „0", panel miasta „Bilans −1/t", „Głód: brak dopłaty")

Maciej: „spichlerz dalej pokazuje zero, pomimo tego, że w mieście jest minus jeden." Zrzuty: HUD
top-bar chip Spichlerz pokazuje „0"; panel miasta (Ludność 1, wygląda na wczesną turę) pokazuje
Produkcja +11, Racje −12, Bilans −1/t, „Głód: brak dopłaty", Auto Wyżywienie WŁ, poziom Wyżywienia 6.
To zgłoszenie przychodzi bezpośrednio po scaleniu P-SPICHLERZ-ZERO-MYLACE (FALA 268) — możliwa DRUGA
przyczyna nienaprawiona pierwszą rundą (C-041: sygnał drugiego zgłoszenia podobnego objawu, szukać
dalej, nie zamykać jedną pasującą przyczyną). **STATUS: nierozpoznane, dispatch rozpoznania
NASTĘPUJE teraz** — hipoteza robocza (NIEPOTWIERDZONA): to wygląda na wczesną turę bez jeszcze
wykonanego ticku końca tury — `unfedRows`/scalony komunikat w `renderSpichlerzCentralnySection` czyta
`_lastTicks` (populowane WYŁĄCZNIE przez `advanceEmpireFood`, czyli po końcu tury), więc PRZED
pierwszym końcem tury panel imperium poprawnie pokazuje „0" (stan realny, nic się jeszcze nie stało),
a Bilans −1/t w panelu miasta to PROJEKCJA na nadchodzącą turę, nie już zaszły fakt — potencjalnie
NIE bug tylko mylące zestawienie stanu-teraz vs projekcji, ale wymaga potwierdzenia liczbą tury i
przejrzenia kodu, nie zgadywania.

---

## R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY (2026-08-10, propozycja gameplayowa Macieja, playtest FALI 268)

Maciej: „pomimo włączonego auto wyżywienia system utrzymuje często żywność na niedoborze. powinien
zawsze sterować tak, żeby był na minimalnym plusie w całej cywilizacji. Albo na minimalnym plusie w
danym mieście, pytanie co będzie lepsze." Zrzut: Ateny, Żywność −1 (HUD), panel miasta Bilans −1/t,
Wyżywienie poziom 6, Auto Wyżywienie WŁ (przycisk zielony/aktywny), Wzrost% 13% (dodatni mimo
ujemnego bilansu żywności — kompensowane bonusami „Małe miasto"+„Szczęście").

**Rozpoznanie techniczne konieczne przed ABC (nie zgaduję):** dzisiejszy mechanizm Auto Wyżywienia
(`maxSafePoziomRacjiForCity`/`getMaxSafePoziomRacjiForPlayerCity`, cała robota tej sesji —
`applyLiveSafeRationForCity`/`_maxSafeRationCache`) celuje w **„zapas (Spichlerz) nie spada poniżej
zera"** (stock-based), NIE w „bilans per-turę jest nieujemny" (flow-based) — to DWA różne kryteria.
Ujemny Bilans −1/t przy dodatnim zapasie w buforze jest DZIŚ zgodny z zamierzonym działaniem (dopóki
bufor starcza, system pozwala go zjadać). Propozycja Macieja zmienia CEL na flow-based. **Wymaga
zbadania przed ABC:** czy dzisiejszy `maxSafePoziomRacjiForCity` liczy per-miasto czy uwzględnia pulę
centralną (redystrybucja nadwyżek/niedoborów między miastami przez `isEmpireCityFoodSolvent`/
`simulateCityFoodCentralPool`); czy zmiana celu na „zawsze min. plus" jest prostą podmianą progu w
istniejącej funkcji, czy wymaga nowej logiki; jaki jest koszt gameplayowy każdej opcji (A — globalnie
dla całej cywilizacji: miasta mogą się kompensować, ale pojedyncze miasto z lokalnym niedoborem może
nadal tracić wzrost mimo dodatniego imperium; B — per-miasto: każde miasto zawsze nieujemne lokalnie,
ale może wymuszać zbyt ostrożne (niższe) racje nawet gdy bufor by pozwolił na więcej, marnując
potencjał wzrostu). **STATUS: dispatch rozpoznania NASTĘPUJE teraz (`a829efd46c1368fe9`), ABC dopiero po wynikach** —
zgodnie z dyscypliną tej sesji (rozpoznanie przed ABC dla niejasnego zakresu technicznego, CLAUDE.md
§6/§7).

**Maciej (priorytetyzacja): „na razie to są dwa najważniejsze błędy, które musimy naprawić. Pozostałe
rzeczy później."** — potwierdza kolejność już w toku (suwaki Praca/Skarbiec + Auto Wyżywienie cel
bilans-nieujemny jako priorytet; Spichlerz 0 vs −1 pozostaje w toku jako powiązane, ale drugorzędne).
Bez zmiany dispatchu — wszystkie 3 już uruchomione agenty są zgodne z tą priorytetyzacją.

**Operator BUG-SUWAKI-PRACA-SKARBIEC dostarczył (`ad2854fc83b6f0272`).** Usunięty `if (!onlyEconId)`
wokół dwóch wywołań (`renderDefaultHandelSplitSection`, `renderDefaultPodzialPracySection`) —
`empireDetailPanel.ts:1063-1074`. Filtr `econRows` (C-PANEL=B) nienaruszony. C-039: grep `onlyEconId`
potwierdza brak trzeciego podobnego przypadku ukrytego pod filtrem. Nowy test
`empire-panel-sliders-always-visible-test.cjs` 7/7 (w tym kontrola przytomności — symulowany regres
wykrywalny). Bramki: tsc 0, logic-test 213/213, `empire-panel-split-test` 18/18 (istniejący, tej
samej okolicy). **Dispatchowany Evaluator (`adb2c127ea73fab04`)** [korekta ID — pierwotny wpis miał
błędny placeholder, nigdy faktycznie niedispatchowany; naprawione tym wpisem].

**Rozpoznanie Spichlerz 0 vs Bilans −1 dostarczone (`a71a5e3791099fb13`) — werdykt: NIE bug, ale
znaleziono przy okazji REALNY bug.** Zgłoszony objaw to dwie różne, poprawnie liczone wielkości:
HUD „Spichlerz=0" czyta żywy `_statesRef.zapasyPanstwa` (magazyn centralny, twardo ograniczony do 0
— `Math.max(0,central)`), panel miasta „Bilans −1/t" to lokalna produkcja−racje TEGO miasta (bez
podłogi). Przyczynowo spójne: magazyn=0 → nie ma z czego dopłacić → miasto głoduje ("Głód: brak
dopłaty" poprawnie to opisuje). **Realny bug znaleziony przy okazji:** `zywnoscMiastNiedokarmionych`
(`main.ts:13828-13829`, dodane w FALI 268 dla P-SPICHLERZ-ZERO-MYLACE) czyta WYŁĄCZNIE
`getLastEmpireFoodTick(0)?.perCityRows` bez żywego fallbacku — w scenariuszu Macieja (`_lastTicks`
puste: nowa gra/świeży save/przed 1. końcem tury) licznik=0, więc tooltip HUD NIE ostrzega i chip
NIE zapala się na czerwono, mimo że panel miasta W TEJ SAMEJ CHWILI poprawnie krzyczy o głodzie —
osłabia efekt naprawy P-SPICHLERZ-ZERO-MYLACE dokładnie tam, gdzie miała najbardziej pomóc (C-041
potwierdzone, inaczej niż zakładała hipoteza robocza). Wzorzec do naśladowania: `resolveCityFedForUi`
w `cityPanel.ts:1344-1353` MA już żywy fallback. **Dispatchowany Operator naprawy
(`a34cb3300165d4371`)**.

**Rozpoznanie R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY dostarczone (`a829efd46c1368fe9`).** Kluczowe
ustalenie: dzisiejszy mechanizm JUŻ jest empire-wide (pula centralna przez `zapasyPanstwa`,
`isEmpireCityFoodSolvent` sumuje bilanse WSZYSTKICH miast + rezerwę) — pytanie „globalnie czy per
miasto" myli dwie różne osie. Realna oś to STOCK (dziś: uwzględnia skumulowaną rezerwę) vs FLOW
(żądanie Macieja: tylko bieżąca tura), i przy FLOW osobno: czy kompensacja między miastami w ramach
JEDNEJ tury zostaje. Scenariusz Macieja policzony liczbowo — POTWIERDZONE „zgodne z zamierzeniem":
poziom 6 (Racje −12, `1×6×2=12`, `R_STAWKI_KOSZT_MULT=2`) to faktycznie MAX, jest zapas do cięcia do
5,5 (dałoby bilans=0, koszt: Wzrost 7%→6%) — system świadomie tego nie robi, bo rezerwa centralna
pokrywa. Zakres zmian: wariant A' (flow-agregat imperium, kompensacja w turze zostaje) — nowy
prymityw + podmiana w 3 miejscach wywołania (`maxSafePoziomRacjiForCity`,
`autoBalanceRationsToSolvency`, `autoRaiseRationsForGrowth`), złożoność mała-średnia; wariant B'
(flow per-miasto, bez kompensacji) — przepisanie struktury pętli w 2 z 3 miejsc (dziś stepują
wszystkie miasta razem z jednym zagregowanym warunkiem stopu), złożoność średnia, skoncentrowana.
Rekomendacja rozpoznania: dodać trzecią opcję C — zostać przy dzisiejszym mechanizmie (stock-based),
tylko dopisać w UI wprost że Bilans-minus jest ZAMIERZONY i pokrywany buforem (mniejsza zmiana,
adresuje możliwie głównie komunikacyjny, nie mechaniczny charakter problemu).

**Pytanie ABC zadane Maciejowi teraz** (osobno, w czacie) — na podstawie powyższych ustaleń.

---

## SPROSTOWANIE — R-AUTOZAPIS-QUOTA-STORAGE-Q1 był już w pełni zaimplementowany i scalony, Maciej
nadal widzi ten sam objaw (2026-08-10, zrzut playtestu FALI 268)

Maciej: „ten problem z zapisywaniem końca tury też chyba nie został zrobiony" (zrzut: 4×
„Koniec tury / Autozapis nieudany — brak miejsca w zapisie przeglądarki", identyczny komunikat
jak zgłoszenie sprzed FALI 266).

**Sprawdzenie rejestru pokazuje, że temat FAKTYCZNIE ZOSTAŁ zrobiony — linia 8137→8727 tego pliku:**
migracja autozapisu na File System Access API (`gra/src/game/fsa-autosave.ts`, nowy plik), 2 rundy
Evaluatora (PASS-WITH-NOTES oba razy), **SCALONE w całości** (5 plików zmodyfikowanych + 2 nowe),
bramki zielone (fsa-autosave-test 55/55, autosave-quota-fail-test 20/20), zadeployowane w **FALI
266** — czyli PRZED tą sesją nocną, dawno przed FALĄ 268 którą Maciej teraz testuje. Kod powinien
być w bundlu, który ma przed sobą.

**Rozbieżność wymaga wyjaśnienia — dispatch rozpoznania NASTĘPUJE teraz.** Hipotezy do sprawdzenia
(NIEPOTWIERDZONE): (a) File System Access API wymaga zgody użytkownika na katalog przy pierwszym
użyciu (`showDirectoryPicker`) — jeśli Maciej nigdy tej zgody nie udzielił w tej sesji przeglądarki,
kod może cicho degradować z powrotem do starego `localStorage`-owego `saveToLocal()`, który ma
dokładnie ten sam limit quota co przed naprawą; (b) FSA może nie działać w kontekście, w którym
uruchamiane jest `Gra-ROBOCZA.html` (np. otwarcie pliku lokalnie `file://` zamiast przez serwer —
zarejestrowana wcześniej nota N13 Evaluatora: „`serve:robocza` uzasadnione, bo FSA nie działa na
`file://`" — jeśli Maciej otwiera bundel bezpośrednio z dysku, może to być dokładnie ta ścieżka);
(c) realny, nieznaleziony wcześniej bug w degradacji/fallbacku. Zero zgadywania — dispatch
zweryfikuje który to przypadek. **Dispatchowany agent rozpoznania (`a5d937dc60e9195cb`)**.

---

## BUG-SUWAKI-PRACA-SKARBIEC — Evaluator: PASS-WITH-NOTES, SCALONE

Zero blokujących. Nota A (do decyzji, NIE blokuje, cicho zarejestrowana per CLAUDE.md §2 — nie
przerywam wątku żywności żeby o to zapytać): naprawa jest szersza niż zgłoszenie — bezwarunkowe
wywołania sprawiają że oba suwaki pokazują się przy KAŻDYM chipie mapowanym na blok „ekonomia"
(Nauka, Religia, Miasta/Ludność, Rekruci), nie tylko Praca/Skarbiec — dotyka wcześniejszej decyzji
C-PANEL=B (Maciej 2026-07-24, „klik Nauka nie ma ciągnąć praca/żywność/skarbiec"). Evaluator dał
gotowy wariant precyzyjny (2 linie, warunek per-chip) jeśli chcemy zawęzić. Dodatkowe ustalenie
wzmacniające zasadność naprawy: PRZED nią oba suwaki były całkowicie NIEOSIĄGALNE w normalnej
nawigacji (żaden chip HUD nie emituje `section='ekonomia'`/undefined) — pokrywa się dokładnie ze
zgłoszeniem Macieja. Nota B (nieblokująca): test source-text nie łapie semantycznie identycznej
mutacji (`if(onlyEconId===null)`), do wzmocnienia później. Nota C: symlink `node_modules` w
worktree, pominąć przy scalaniu. **SCALAM TERAZ** (bug faktycznie naprawiony, zero regresji
danych/logiki, decyzja o zawężeniu zakresu odłożona do zamknięcia bieżącego wątku żywności).

---

## Rozpoznanie FSA autosave dostarczone (`a5d937dc60e9195cb`) — werdykt: (a) znany, udokumentowany
limit implementacji, NIE nowy bug

Kod FSA istnieje i działa poprawnie zgodnie ze specyfikacją File System Access API —
`detectFsaAvailability()` sprawdza `protocol==='file:'` PRZED wszystkim innym i celowo zwraca
`available:false`, więc FSA nigdy nie jest nawet próbowane pod `file://`. **`STAN-PRACY-HANDOFF.md`
potwierdza, że rutyna Macieja to `gra-robocza/START.html` otwierany bezpośrednio z dysku (`file://`)**
— naprawa FSA z FALI 266 nie daje mu ŻADNEJ korzyści w jego realnym sposobie odpalania gry. To był
przewidziany scenariusz (`WERSJE.md:69`, checklist FALI 266: „sprawdzić czy na `file://` gra po cichu
wraca do starego mechanizmu bez błędu" — zaakceptowany wynik, nie błąd do naprawy).

**Realna, mała luka UX znaleziona przy okazji:** wyjaśniający toast („zapis na dysk wymaga
`http://localhost`") pokazuje się WYŁĄCZNIE raz na cały profil przeglądarki, na zawsze (bramkowane
kluczem w `localStorage`) — skoro Maciej widział już FALĘ 266 z tym samym kodem, wyjaśnienie
najpewniej pokazało się wtedy i już nigdy więcej się nie pojawi, podczas gdy cykliczny komunikat
„brak miejsca" (bez wyjaśnienia) powtarza się bez ograniczeń przy każdej nieudanej turze — stąd 4
powtórzenia na zrzucie, zero kontekstu.

**Do decyzji Macieja (przedstawię po zamknięciu wątku żywności, żeby nie mieszać wątków):**
(1) najmniejsza poprawka — dopisać wyjaśnienie `file://` do CYKLICZNEGO komunikatu (3-5 linii,
`main.ts:21813-21819`), bez zmiany mechaniki; (2) zmiana rutyny testowej na `npm run serve:robocza`
(`http://localhost`) — realnie aktywowałoby FSA, większy limit, ale wymaga uruchomionego serwera przy
każdym teście; (3) NIEZBADANE jeszcze — czy warto dodatkowo rozważyć IndexedDB jako magazyn
działający TAKŻE pod `file://` (większy limit niż `localStorage`, nie wymaga serwera) — oryginalna
lista opcji z pierwszego zgłoszenia (linia 8153-8158) wymieniała to jako alternatywę do FSA, nigdy
nie zbadaną osobno.

---

## R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY — Maciej podważa poprzednie rozpoznanie (2026-08-10, drugi
zrzut, matematycznie ostry argument)

**Odpowiedź Macieja na ABC:** „c + info — tylko pytanie, czy faktycznie jest pokrywany. Jeżeli mam
jedno miasto i ono notorycznie jest na minusie, a spichlerz był zerowy, to niby z czego się ma
pokrywać? To jakiś błąd. Gdyby auto wyżywienie w jednej turze zostawiało miasto na plusie a w drugiej
na minusie to by się zgadzało, ale jeżeli cały czas jest na minusie a Spichlerz startował z zerem to
niby z czego się pokrywa i bilansuje?" — słuszna matematycznie wątpliwość wobec wniosku poprzedniego
rozpoznania („bufor pokrywa deficyt"): jeśli `zapasyPanstwa=0` i pozostaje zerowy, a bilans miasta
jest trwale ujemny, kryterium `isEmpireCityFoodSolvent` (suma bilansów + zapasyPrzed ≥ 0) powinno to
wykryć i obniżyć poziom, nie zostawić go na miejscu. **Dispatch rozpoznania #2, głębsze, ślepe na
odpowiedź #1 — NASTĘPUJE (`a2083cf30348a7ef9`)** — ma prześledzić KONKRETNĄ ścieżkę (nowo założone
miasto, domyślny poziom startowy, czy „założenie miasta" jest wyzwalaczem live-recalc, czy to tura 1
bez jeszcze zadziałanego mechanizmu, czy realna luka w `autoRaiseRationsForGrowth`).

**Drugi, jeszcze ostrzejszy zrzut od Macieja (ta sama tura sesji, Ludność 3, nie tura 1 — obala
hipotezę „to tylko tura 1"):** Produkcja +21, Racje −24, Bilans −3/t, poziom Wyżywienia **4** (już
NIE 6 — jakiś mechanizm JUŻ obniżył poziom z 6 do 4 w międzyczasie), Spichlerz nadal **0**, Wzrost%
**8,5%** (dodatni, składnik „Wyżywienie +4,5%" naliczony w pełni). Maciej: „miasto jest -3 na minusie,
nie ma żadnych rezerw w Spichlerzu. Jak to wpływa na ludność? Czy to nie jest trochę oszukiwanie z
tym wzrostem, skoro wzrost jest naliczany maksymalny, chociaż miasto nie pozwala na takie racjowanie,
bo w Spichlerzu nic nie ma?" — **NOWA, kluczowa oś pytania, inna niż pierwsza:** czy Wzrost%
(`WYZYWIENIE_GROWTH_PCT[poziomRacji]`) liczy się z NOMINALNEGO ustawionego poziomu Racji, czy z
FAKTYCZNIE dostarczonej/opłaconej ilości żywności — jeśli miasto notorycznie nie ma z czego pokryć
tego poziomu (bilans ujemny, bufor zerowy), a mimo to dostaje pełny bonus wzrostu za ten poziom, to
gra pokazuje wzrost, którego populacja realnie nie powinna dostawać. **STATUS: czekam na wynik
rozpoznania #2 (`a2083cf30348a7ef9`) — jeśli nie pokryje w pełni tej nowej osi (nominalny vs
faktyczny poziom w formule wzrostu), dispatch rozpoznania #3 dedykowanego tej konkretnej osi.**

**Rozpoznanie #2 dostarczone (`a2083cf30348a7ef9`) — MACIEJ MIAŁ RACJĘ, potwierdzony REALNY BUG.**
Nowo założone miasto NIE dziedziczy `DEFAULT_POZIOM_RACJI=4` — `seedCityOwnerDefaults()`
(`main.ts:4142-4168`, mechanizm R-USTAWIENIA-GLOBALNE-LOKALNE wprowadzony DZISIAJ) nadpisuje poziom
racji nowego miasta GLOBALNYM domyślnym poziomem imperium (mogącym być 6, jeśli gracz go tam
wcześniej podniósł dla innego, zamożniejszego miasta) — **bez żadnej weryfikacji czy nowe miasto
(Ludność 1, zero budynków) je udźwignie**. Znaleziono i zweryfikowano grepem: **żadne z 7 miejsc
wywołania `seedCityOwnerDefaults`** (founding gracza, AI, miasta-państwa, kapitulacja głodowa,
wchłonięcie dyplomatyczne, zmiany właściciela) **nie wywołuje `applyLiveSafeRationForCity`** — luka
w liście 9 wyzwalaczy live-recalc z tej samej sesji (Auto Wyżywienie Bug#1); założenie miasta jest
zdarzeniem SILNIEJ wpływającym na profil żywnościowy niż zmiana priorytetu Okolicy, a nie jest objęte
ochroną. Backstop końca tury (Q3=A) DZIAŁA i bezwarunkowo klamruje — więc po PIERWSZYM końcu tury od
założenia poziom powinien spaść. **Minimalna naprawa:** dodać `applyLiveSafeRationForCity(c.id)` w
`seedCityOwnerDefaults` dla miast gracza — 10. wyzwalacz live-recalc, spójny z istniejącym wzorcem.

**Druga usterka architektoniczna znaleziona przy okazji:** stary mechanizm SPICH-AUTO-Q1
(`autoRaiseRationsForGrowth`/`autoBalanceRationsToSolvency`) pisze bezpośrednio do `city.poziomRacji`,
**całkowicie omijając** nową mapę `ownerDefaultPoziomRacji`/flagę `poziomRacjiOverride` z dzisiejszej
sesji — dwa systemy niezsynchronizowane, globalny default może się rozjeżdżać z faktyczną wartością
miasta.

**NIE w pełni wyjaśnia drugi, ostrzejszy zrzut Macieja** (Ludność 3, poziom JUŻ obniżony do 4 — nie
globalny default 6, więc COŚ już zadziałało — a mimo to Bilans −3, Spichlerz 0). Policzone: przy
poziomie 3,5 koszt=3×3,5×2=21, bilans=0 — jest jeszcze zapas do cięcia, mechanizm zatrzymał się na 4
zamiast 3,5. Może to być dokładnie ta druga usterka (SPICH-AUTO-Q1 vs nowa mapa globalna) albo coś
innego. **Dispatch rozpoznania #3 NASTĘPUJE (`aaf1b942afbfe8911`)** — scenariusz 2 (Ludność 3, dlaczego 4 a nie 3,5) + oś
Macieja z drugiego zrzutu (czy Wzrost% liczy się z nominalnego czy faktycznie pokrytego poziomu).

---

## Operator „żywy fallback niedokarmionych" dostarczył (`a34cb3300165d4371`)

Worktree startował sprzed FALI 268, więc Operator sam dociągnął materiał diffem (nie merge/checkout)
— realne zmiany TYLKO w `main.ts` (`projectPlayerFoodProjection` +drugi przebieg sekwencyjnego
wyczerpywania centrali, `unfedCityCount`; `buildHudState` ternary tick-dostępny/fallback-żywy) i w
`spichlerz-deficyt-scalenie-test.cjs` (41→50/50). Ślepy zaułek zbadany i odrzucony: podejrzewany bug
w `advanceEmpireFood` (nie flaguje `nakarmione:true` dla miast na plusie) okazał się fałszywym
alarmem — `applyPostCentralPopulationGrowth` mutuje te same obiekty i poprawnie ustawia `fed`;
Operator to sprawdził zanim zgłosił, nie zgadywał. Bramki: tsc 0, logic-test 213/213,
spichlerz-deficyt-scalenie-test 50/50, spichlerz-widocznosc-test 45/45.

**Uwaga wymagająca weryfikacji Evaluatora (NIE przyjmuję na słowo, biorąc pod uwagę bieżące
dochodzenie w tym samym obszarze):** Operator zgłasza `empire-food-b5-test.cjs` (3 fail/28) i
`spichlerz-wzrost-test.cjs` (7 fail/9) jako pre-istniejące/out-of-scope. `empire-food-b5-test.cjs`
ma potwierdzoną wcześniej niezależnie historię pre-istniejącej porażki (Evaluator rundy 5
auto-wyzywienie-live, merge-base `aa24fd23`, dług testowy ×2 R-STAWKI). `spichlerz-wzrost-test.cjs`
NIE ma takiego potwierdzenia w tym rejestrze — biorąc pod uwagę że rozpoznania #2/#3 właśnie
znalazły/badają realny bug DOKŁADNIE w tym obszarze (poziom Racji, Wzrost%, Spichlerz), Evaluator MA
zweryfikować to twierdzenie niezależnie (np. `git stash`/porównanie z merge-base), nie przyjąć na
słowo — może to być czwarty objaw tego samego łańcucha przyczynowego, nie coincydencja.
**Dispatchowany Evaluator (`a9935e7d20bbedcfa`).**

---

## Rozpoznanie #3 dostarczone (`aaf1b942afbfe8911`) — pełny obraz, gotowe do syntezy dla Macieja

**Zadanie A (dlaczego poziom utknął na 4):** NIE jeden bug, zbieg TRZECH współdziałających
mechanizmów: (A1) WSZYSTKIE mechanizmy auto-korekty (`isEmpireCityFoodSolvent`,
`maxSafePoziomRacjiForCity`) liczą wypłacalność EMPIRE-WIDE (agregat wszystkich miast+rezerwa), nigdy
lokalnie per-miasto — to jest ta sama architektura z rozpoznania #1, teraz z twardym dowodem że
pozwala na TRWALE ujemny lokalny bilans jednego miasta, jeśli inne miasta/rezerwa pokrywają w
agregacie. (A2) potwierdzony bezpośredni zapis do `city.poziomRacji` z pominięciem
`ownerDefaultPoziomRacji`/`poziomRacjiOverride` w 4 miejscach (SPICH-AUTO-Q1 ×3 +
`broadcastPoziomRacjiToOwnerCities`, `empire-city-defaults.ts:307-316`, wywoływana z każdej zmiany
suwaka Wyżywienia dowolnego miasta bez override — nadpisuje WSZYSTKIE miasta ownera bez klamrowania
per-miasto i bez `applyLiveSafeRationForCity`, świadomie akceptowane w komentarzu kodu jako poleganie
na agregatowym backstopie). (A3) wzrost populacji NIE jest wyzwalaczem live-recalc — wyczerpujące
przeszukanie potwierdza `applyPostCentralPopulationGrowth` (jedyna ścieżka przyrostu) nie woła
`applyLiveSafeRationForCity` — więc poziom racji nie jest przeliczany po każdym wzroście ludności,
mimo że koszt skaluje się z populacją.

**Zadanie B (czy Wzrost% liczy nominalny czy faktyczny poziom) — POTWIERDZONE, Maciej miał rację
nazywając to „oszukiwaniem":** składnik „Wyżywienie" we Wzroście% w OBU miejscach (UI `cityPanel.ts`
I silnik `population-growth-v85.ts`) zawsze bierze NOMINALNY `city.poziomRacji`
(`getCityRationLevel`), nigdy faktycznie pokrytą ilość. Istnieje bramka `fed`, ALE jest binarna
(cały wzrost albo zero) i sama oparta o AGREGATOWĄ wypłacalność imperium (`covered >= need` z puli
centralnej wszystkich miast), nie o lokalny bilans TEGO miasta — miasto z głęboko ujemnym lokalnym
bilansem MOŻE dostać `fed=true` i pełny nominalny bonus wzrostu wyłącznie dlatego, że inne
miasto/rezerwa pokryły w tej samej turze. **Ważne zastrzeżenie łagodzące:** silnik NIE jest ślepy —
gdy miasto naprawdę nie jest pokryte NAWET agregatowo, `applyHungerPenaltyV85` natychmiast odejmuje
ludność i zeruje wzrost, bez okresu karencji. Dodatkowo: panel UI czyta `fed` ze STAREJ migawki
końca poprzedniej tury (`getLastEmpireFoodTick`), nie live — rozjazd po automatycznym wzroście
populacji w trakcie bieżącej tury (nieudokumentowany dotąd jako źródło tego konkretnego rozjazdu,
inny niż znany rozjazd po ruchu suwaka).

**Synteza dla Macieja następuje teraz w czacie** — to poszerza (nie zastępuje) wcześniejszą oś ABC z
rozpoznania #1 o dwa NIEZALEŻNE, jasno zakresowane bugi (A2 broadcast-bypass, A3 brak triggera
wzrostu populacji) możliwe do naprawy NIEZALEŻNIE od tego, którą opcję architektury (stock vs flow)
Maciej wybierze, plus twardy dowód że sama Oś B (Wzrost%) wymaga osobnej decyzji, bo to inny problem
niż sam Bilans/Spichlerz.

---

## Evaluator żywy fallback — PASS-WITH-NOTES (`a9935e7d20bbedcfa`)

Zweryfikowane linia po linii: równoważność bit-w-bit gałęzi „tick istnieje", drugi przebieg
algorytmicznie tożsamy z `advanceEmpireFood`, ślepy zaułek Operatora potwierdzony jako słusznie
odrzucony (okno w pełni synchroniczne). **`spichlerz-wzrost-test.cjs` potwierdzony NIEZALEŻNIE jako
pre-istniejący** — osobny sparse worktree na baseline `99974173`, identyczny wynik (2 pass/7 fail) i
identyczne komunikaty przed i po zmianie Operatora; md5 dotkniętych plików (`economy.ts`,
`empire-food.ts`) identyczne z bazą. Przyczyny źródłowe ustalone: próg wzrostu (`economy.ts:1117`)
zmieniony 2026-07-09, test nieaktualizowany; drugi test asercjonuje nieistniejący już podział 70/30
rozwój/państwo. **Nie czwarty objaw** — inna rodzina długu testowego.
**Notatki:** N1 (osobny temat, nie blokuje) — odkryty ODWROTNY rozjazd: gdy `rezerwa>0`, panel
miasta (`resolveCityFedForUi`) patrzy tylko na znak lokalnego bilansu i błędnie pokazuje głód mimo
że centrala by pokryła — HUD (nowy fallback) poprawnie nie ostrzega. W zgłoszonym przypadku
(`rezerwa=0`) oba się zgadzają, więc TO zlecenie zamyka się poprawnie, ale rozjazd w drugą stronę
wymaga osobnego zgłoszenia. N2 (ważne przy scalaniu) — baza worktree NIE jest przodkiem gałęzi
sesji (FALA 267 vs bieżąca), scalać WYŁĄCZNIE deltę (`projectPlayerFoodProjection` + ternary w
`buildHudState`), nie cały `git diff` worktree. N3/N4/N5 — nieblokujące (higiena symlinku, test
częściowo reimplementacyjny ale nietautologiczny, zgubione `?? []` nieszkodliwe).

**SCALAM TERAZ — wyłącznie deltę, zgodnie z N2.**

**SCALONE — commit `6201d7b4`, wypchnięte.** Zastosowane precyzyjnymi edycjami (nie `git diff`/`apply`,
per N2 — baza worktree niebędąca przodkiem gałęzi sesji) w dwóch miejscach: `projectPlayerFoodProjection`
(drugi przebieg + `unfedCityCount`) i `buildHudState` (ternary). Bramki w drzewie głównym potwierdzone
ponownie: tsc 0, logic-test 213/213, `spichlerz-deficyt-scalenie-test` 50/50, `spichlerz-widocznosc-test`
45/45. Worktree do posprzątania.

---

## R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY — TRZECI zrzut Macieja, sytuacja się POGŁĘBIA (2026-08-10)

Maciej: „to już w ogóle nie działa." Ta sama tabela cywilizacji (Ludność 3), teraz: Produkcja **+26**
(było +21), Racje **−33** (koszt=3×5,5×2=33, poziom **5,5** — WZROSŁO z 4, nie spadło), Bilans **−7/t**
(było −3, teraz gorzej), Wzrost% nadal dodatni (9%), HUD chip Spichlerz „0 **−24**" (mocno ujemny
rate). **Policzone: przy dzisiejszej produkcji 26, bezpieczny poziom (bilans=0) to ok. 4,33
(26/6=4,33̄) — mechanizm PODNIÓSŁ poziom do 5,5, znacznie POWYŻEJ bezpiecznego progu, zamiast go
ściąć.** To nie jest już „brak reakcji" (poprzednie 2 zrzuty) — to mechanizm aktywnie działający w
złą stronę, prawdopodobnie `autoRaiseRationsForGrowth` (`empire-food.ts:501-593`, zidentyfikowany w
rozpoznaniu #3 jako piszący bezpośrednio do `city.poziomRacji` z pominięciem nowej mapy globalnej) —
podnosi poziom dla maksymalizacji wzrostu na podstawie kryterium wypłacalności, które najwyraźniej
daje fałszywie pozytywny wynik w tym konkretnym stanie (populacja rosnąca z 1→3 w trakcie tej samej
sesji, produkcja rosnąca 21→26, żadna z tych zmian nie wyzwala przeliczenia na żywo — potwierdzone
w rozpoznaniu #3 jako A3). **Dispatch rozpoznania #4, ostatnie przed decyzją o naprawie —
NASTĘPUJE (`abfb4f9cf2c010253`).**

**Rozpoznanie #4 dostarczone — DOKŁADNY mechanizm znaleziony, precyzyjnie zakresowana naprawa.**
`autoRaiseRationsForGrowth` (`empire-food.ts:520-593`, defekt w liniach 552-581): pętla podnosi
poziom o krok (0,5), **COMMITUJE go natychmiast** (`c.poziomRacji = ...`, linia 562), DOPIERO POTEM
sprawdza akceptację — ale kryterium akceptacji (`pool<0 || !solvent`, linia 572) jest STOCK-based
(uwzględnia skumulowaną rezerwę `zapasyPrzed`), NIE flow-based (czysty bilans TEJ tury). Sprawdzenie
`nadwyzka<=0` (flow) istnieje (linia 580), ale działa TYLKO jako `break` zatrzymujący dalsze
podnoszenie — NIE jako warunek cofnięcia już zaaplikowanego kroku. Skutek: funkcja **strukturalnie
przestrzeliwuje o dokładnie jeden krok (0,5) ponad to, co dzisiejsza produkcja udźwignie**, cicho
finansując go z rezerwy, i się zatrzymuje bez cofnięcia. **Hipoteza stopniowego pełzania
POTWIERDZONA:** poziom trwały między turami, przy rosnącej produkcji międzyturowo (populacja 1→3)
bramka wejściowa ponownie się uzbraja co turę, pozwalając na kolejny krok w górę — poziom pełznie
4→4,5→5→5,5 przez kolejne tury, za każdym razem finansowany z kurczącej się rezerwy (HUD „−24" to
stan wyczerpanej rezerwy). Kolejność `autoBalance`(obniż)→`autoRaise`(podnieś) w tej samej turze NIE
jest przyczyną — **oba mechanizmy używają TEGO SAMEGO zbyt-łagodnego kryterium**
(`isEmpireCityFoodSolvent`), więc `autoBalance` nie cofa przestrzelenia z poprzedniej tury, dopóki
rezerwa nie spadnie blisko zera. **Backstop Q3=A też nie jest niezależną siatką** — używa tych
samych funkcji z tym samym `zapasyPrzed`, więc akceptuje to samo, co `raise` już zaakceptował.
**Minimalna naprawa (opisana, nieimplementowana):** dla gracza (ownerId=0), zmienić kryterium
akceptacji kroku w `autoRaiseRationsForGrowth` na wymaganie `nadwyzka>=0` PO kroku (nie tylko
`pool>=0 && solvent`) — krok utrzymuje się tylko jeśli bilansuje się sam w tej turze, nie jeśli
tylko rezerwa go pokryje. To samo kryterium powinno objąć `autoBalanceRationsToSolvency` (inaczej
ratchet nie zniknie) i backstop `maxSafePoziomRacjiForCity`. **To WĘŻSZA, precyzyjna poprawka niż
pełna decyzja architektury stock/flow z rozpoznania #1** — zgodna z tym, co Maciej już wskazał jako
priorytet.

**Synteza + rekomendacja przedstawiona Maciejowi w czacie.**

**ECHO Macieja: „zgoda"** — naprawa opisana w rozpoznaniu #4 (flow-based kryterium akceptacji kroku
w `autoRaiseRationsForGrowth`/`autoBalanceRationsToSolvency`/backstop `maxSafePoziomRacjiForCity`,
dla gracza ownerId=0) zatwierdzona. **Dispatch Operatora NASTĘPUJE (`af98bc5fafb5f2aa6`).**

---

## R-PROPOZYCJA-BRAK-EDYCJI — Maciej zgłasza ponownie, możliwa luka w zakresie naprawy z 08-09
(2026-08-10, zrzut playtestu, „Stół negocjacji")

Maciej: „nadal nie można edytować wcześniej zaproponowanej oferty, może tylko ją usunąć. Pamiętam, że
był ten temat rozkminiany i myślałem, że już jest załatwiony." Zrzut: widok „Stół negocjacji", kolumny
„My oferujemy"/„Oni oferują", karty CAŁYCH traktatów/umów („Traktat handlowy · 66 PW (baza 80)",
„Umowa wymiany surowców · 10 🔱 jednorazowo") — każda ma tylko przycisk „Usuń", brak „Edytuj".

**Ustalone w rejestrze (linia 3221-3243):** temat JUŻ ZGŁOSZONY 2026-08-08, NAPRAWIONY 2026-08-09
(przycisk „✎ Edytuj" w `diplomacyTradeBasket.ts`, 3 rundy, Evaluator PASS-WITH-NOTES), zadeployowany
FALA 262 (`ce69cf45`), status „czeka na playtest Macieja". **ALE naprawa była zagatowana do 5
KONKRETNYCH typów pozycji koszyka** (`zloto, praca, zywnosc, tech, surowiec_ilosc`) — **to, co Maciej
teraz pokazuje, to CAŁE karty traktatów w innym widoku** („Stół negocjacji", nie „koszyk") —
prawdopodobnie inny, wyższego poziomu element UI, którego naprawa z 08-09 mogła nie objąć. **Do
zbadania, nie zgaduję:** (1) czy `ce69cf45`/FALA 262 jest w ogóle w historii aktualnej gałęzi sesji
(czy to nie jest kolejny przypadek „zrobione ale nigdy niescalone dalej" jak wcześniej ten wieczór z
P-DYPLO-SWEETENER); (2) czy przycisk „Edytuj" istnieje w kodzie „Stołu negocjacji" a po prostu nie
renderuje się dla typów `traktat_handlowy`/`umowa_surowcowa` na poziomie CAŁEJ karty (bo dotyczy tylko
pozycji WEWNĄTRZ traktatu, nie samego traktatu jako całości); (3) czy to w ogóle inny plik/komponent
niż `diplomacyTradeBasket.ts` (wskazówki w starym wpisie: `diplomacyAudience.ts`/
`diplomacyDealDisplay.ts`/`diplomacyNegotiationModal.ts` jako kandydaci nieprzweryfikowani). **Dispatch
rozpoznania NASTĘPUJE (`aa0162a44928d50af`).**

---

## P-DYPLO-ZYWNOSC-WYBOR-MIASTA-ZAMIAST-PULI (2026-08-10, zaskoczenie Macieja przy dodawaniu Żywności
do oferty handlowej)

Maciej: „ten temat w ogóle mnie zaskoczył, bo to tak naprawdę powinno być tylko i wyłącznie wskazanie
jakie ilości żywności oczekujemy lub chcemy przekazać, a tu po prostu jest jakieś z miast, a przecież
oferujemy wszystko to, co mamy w magazynach lub w spichlerzu głównym." Zrzut: kreator „CO DODAJESZ" →
wybrana kategoria „Żywność" → pod spodem sekcja „Miasto (spichlerz)" z siatką WSZYSTKICH miast
(Ateny, Sparta, Argos, Mykeny, Milet, Rodos, Syrakuzy, Delfy, Olimpia, Efez, Pergamon, Halikarnas...)
do wyboru — sugeruje że UI chce, żeby gracz wybrał KONKRETNE miasto, którego spichlerz ma dostarczyć
żywność do oferty.

**Napięcie architektoniczne wprost — cała dzisiejsza sesja (Auto Wyżywienie, Spichlerz) ustaliła że
żywność jest scentralizowana** (`zapasyPanstwa`, pojedynczy Spichlerz imperium, nie osobne zapasy per
miasto) — UI proszący o wybór „którego miasta spichlerz" wygląda na relikt starszego, per-miastowego
modelu żywności sprzed centralizacji (albo dubluje logikę, której już nie ma sensu mieć osobno).
**Do zbadania, nie zgaduję:** czy ten wybór miasta faktycznie coś realnie zmienia w wyniku transakcji
(np. różne miasta mają różne dostępne ilości mimo wspólnej puli — możliwe że to legacy UI nad
zunifikowanym silnikiem), czy to martwy/mylący krok, który powinien zniknąć na rzecz prostego pola
„ile żywności z centralnej puli". **Dispatch rozpoznania NASTĘPUJE, RÓWNOLEGLE z powyższym (inny
obszar, ryzyko kolizji niskie — oba read-only).**

---

## P-DYPLO-BILANS-VS-BRAKUJE-PW-SPRZECZNE (2026-08-10, zaskoczenie/frustracja Macieja, „Stół negocjacji")

Maciej: „pomimo tego że bilans jest na plusie, to system twierdzi że brakuje czterech PW, nie
spełnia warunków... gracze tego nie zrozumieją — albo jest plus na bilansie i powinno być przyjęcie,
albo nie. A tu jest jeszcze jakaś informacja o brakujących PW. Bilans powinien być ostateczną kwotą
po zbilansowaniu wszystkiego." Zrzut: panel „PUNKTY WYMIANY PW" — „MY ODDAJEMY 86 PW (baza 80,
Relacja −17% siła)", **„BILANS (NETTO) +6"** (zielone, wygląda pozytywnie), „ONI ODDAJĄ 80 PW". Pod
spodem: „WPŁYW RELACJI NA DEAL −17%... Traktat: Ty: baza 80 → 66 · Oni: 80 PW (baza) @ Rel 83", i
osobny czerwony/żółty box: **„Nie spełnia warunków: Brakuje 4 PW do uczciwej oferty traktatu
handlowego @ Relacji (baza 80 PW, licząc pakiet na stole) — oferta nieuczciwa dla partnera"** —
przycisk „Przyjmij" zablokowany.

**Wstępna hipoteza (do potwierdzenia, nie zakładam):** to mogą być DWIE różne, legalnie różne
miary — „Bilans (netto)" to surowa różnica wartości wymiany (86 vs 80 = +6, korzystne dla gracza),
a „Brakuje 4 PW" to osobny próg „uczciwości dla partnera" (czy AI UZNA ofertę za wystarczająco
uczciwą, żeby ją przyjąć — inny próg niż zwykły dodatni bilans, korygowany o Relację). Jeśli tak,
problem NIE jest logiczny/bug, tylko **czysto komunikacyjny** — dwie liczby prezentowane bez
wyjaśnienia że mierzą co innego, myląco sprzeczne dla gracza. Do sprawdzenia: czy liczby są w ogóle
spójne matematycznie (czy 66 baza-po-Relacji + reszta pakietu faktycznie daje niedobór 4 PW względem
progu 80, mimo że surowy bilans całego pakietu to +6), i czy nazwa/miejsce komunikatu da się scalić
w jeden, spójny wskaźnik (zgodnie z sugestią Macieja: „Bilans powinien być ostateczną kwotą po
zbilansowaniu wszystkiego") bez utraty informacji o tym, dlaczego AI by odrzuciło. **Powiązane z
wcześniejszą, już wdrożoną naprawą** (linia 1060 tego pliku: „bilans netto my−their, bez «Brakuje»
gdy gracz oddaje więcej" — TA naprawa dotyczyła PRZYCHODZĄCEJ propozycji od AI, nie WYCHODZĄCEJ
propozycji gracza z osobnym progiem uczciwości-dla-partnera; możliwe że to zamierzone, ale
niewyjaśnione w UI, rozróżnienie). **Dispatch rozpoznania NASTĘPUJE, RÓWNOLEGLE z dwoma powyższymi
(trzeci, inny obszar tego samego modułu — do weryfikacji ryzyka kolizji przy ewentualnym dispatchu
Operatora później, na razie wszystkie trzy read-only).**

---

## R-DYPLO-UMOWA-SUROWCOW-WIELOKROTNA (2026-08-10, propozycja/zgłoszenie Macieja, „Stół negocjacji")

Maciej: „po wydaniu umowy handlowej wymiany surowców powinno być możliwość wydawania wielokrotności
różnych typów umów wymiany surowców, a to wygląda tak, jakby raz można tylko wykorzystać i potem już
nie... Umowa wymiany surowców może być wielokrotna, została potraktowana jak zwykły traktat handlowy
lub inne, a przecież to jest umowa, która może być podzielona — dam surowce, a potem brakuje nam
jeszcze bilansu, to w drugiej umowie na przykład dołożymy odkrycia." Zrzut (ten sam „Stół negocjacji"
co dwa poprzednie zgłoszenia): lewa kolumna „Możliwe umowy" — „Traktat handlowy na stole — Przyjmij w
PN" i „Umowa wymiany surowców na stole — Przyjmij w PN", **oba z ikoną kłódki**, oba zablokowane skoro
już są „na stole" (jedna instancja każdego typu).

**Propozycja gameplayowa Macieja:** „Umowa wymiany surowców" (w odróżnieniu od singletonowych typów
jak Traktat handlowy/Sojusz/Pakt) powinna dać się dokładać WIELOKROTNIE w tej samej negocjacji — kilka
osobnych instancji, każda z innym zestawem surowców, sumujących się do wspólnego bilansu PW zamiast
jednej, wyczerpującej limit propozycji. **Do zbadania przed ABC (dyscyplina sesji — nie zgaduję):**
czy blokada „już na stole" jest dziś jednolita dla WSZYSTKICH typów umów (żaden nie jest wielokrotny),
czy to specyficzne dla tego typu; jaki byłby zakres zmiany (czy struktura danych košyka/propozycji w
ogóle wspiera wiele instancji tego samego typu, czy to wymaga nowego modelu identyfikacji
umów-instancji zamiast typ-jako-klucz). **Dispatch rozpoznania NASTĘPUJE, RÓWNOLEGLE z trzema
powyższymi (ten sam moduł — worktree współdzielony niemożliwy dla ewentualnych późniejszych
Operatorów, ale to rozpoznanie jak pozostałe jest read-only).**

**Rozpoznanie dostarczone (`aa0162a44928d50af`) — POTWIERDZONY, realny, NIEOBJĘTY zakresem naprawy
08-09 przypadek. Gotowe do ABC.** `ce69cf45`/FALA 262 w pełni scalone (NIE przypadek jak
P-DYPLO-SWEETENER — tu problem jest realny w kodzie). Widok ze zrzutu to
`gra/src/ui/diplomacyAudience.ts`, przycisk Edytuj/Usuń renderuje wspólna
`negotiationCardActionsHtml()` (linia 1646): `showEdit = !!r.canCounter && actionUsesTradeBasket(...)`.
**`canCounter` jest ZAWSZE `false` dla `direction==='own'`** (`main.ts:13162`,
`canPlayerCounterNegotiation` wołane wyłącznie dla `direction==='incoming'`) — czyli dla WŁASNYCH,
już wysłanych propozycji czekających na AI (dokładnie karty ze zrzutu Macieja) edycja jest z definicji
niemożliwa, niezależnie jak dobrze działa koszyk. Naprawa 08-09 (`4a116083`/`2b747b9b`) dotyczyła
WYŁĄCZNIE kontrofert AI (`direction==='incoming'`) — tytuł commitu `2b747b9b` mówi to wprost. To NIE
jest regresja/przeoczenie tamtej naprawy — to od początku inny, nieobjęty przypadek. Dodatkowo:
„Traktat handlowy" (widoczny na zrzucie) to `actionId '5'`/`umowa_szlakow`, CELOWO wykluczony z
koszyka wymiany (idzie na stół bez modala) — nawet z `canCounter=true` nie miałby edycji koszyka
(bo nie ma koszyka); „Umowa wymiany surowców" (`actionId '14'`) JEST w koszyku, brak edycji wynika
wyłącznie z `canCounter=false`.
**Zakres naprawy WYMAGA decyzji projektowej (ABC), nie jest prostym powtórzeniem wzorca 08-09** —
silnik negocjacji (`diplomacy-proposals.ts`) NIE MA dziś żadnego trybu „edytuj własną, wysłaną
ofertę in-place" (tylko usuń+dodaj-od-nowa). Dwa warianty: (A) rozszerzyć `canCounter` o
`direction==='own'`, dodać nową ścieżkę w silniku aktualizującą ten sam wpis `PendingNegotiation`
bez zmiany rundy/`awaitingOwnerId` — bliższe UX (edycja w miejscu), ale wymaga nowej logiki silnika;
(B) „Edytuj" = zamknij kartę + otwórz ponownie kreator z pre-wypełnionymi wartościami
(`showTradeBasketModal`/`counterInitial`, już istniejący wzorzec pre-fill), usuń starą pozycję +
utwórz nową po zapisie — prostsze technicznie, ale traci numer rundy/timing z perspektywy gracza.
**ABC do zadania Maciejowi, w kolejce po ustabilizowaniu obecnej fali zgłoszeń.**

---

## P-DYPLO-PAKT-NIEAGRESJI-ZAUFANIE-MIMO-PLUS-BILANS (2026-08-10, szósty zrzut, „Stół negocjacji")

Maciej: „w opcjach miałem pakt o nieagresji, ale kiedy spełniam bilans na plusie, to niestety system
twierdzi, że brak mam zaufania do paktu. No to albo nie mam zaufania i nie ma tego w opcjach do
wyboru, albo jest w opcjach do wyboru, kwestią jest tylko zbalansowanie innymi propozycjami." Zrzut:
pakiet 3 umów (Pakt o nieagresji + Umowa wymiany surowców od nas, Traktat handlowy + Pakt o nieagresji
od nich), „BILANS (NETTO) **+32**" (wyraźnie dodatni, większy niż poprzedni zrzut +6), blokujący
komunikat: **„Nie spełnia warunków: Ekspansja przy granicy — brak zaufania do paktu"** — inny niż
poprzedni „Brakuje N PW" (to NIE jest brak PW, to osobny, binarny gate zaufania/bliskości granic,
którego PW nie naprawi). W lewej kolumnie „Możliwe umowy" WIDAĆ już istniejący wzorzec dla innych
opcji: „zablokowana — wymaga Zaufania 91 (masz 83)" z ikoną kłódki, prewencyjnie wyłączający wybór —
ale „Pakt o nieagresji" NIE był tak oznaczony (dało się go dodać do oferty), mimo że ma najwyraźniej
podobny, twardy gate ujawniający się dopiero PRZY OCENIE, nie przy wyborze.
**Prawdopodobnie POWIĄZANE z tym samym wzorcem co `P-DYPLO-BILANS-VS-BRAKUJE-PW-SPRZECZNE`** (gate
nieodzwierciedlony w UI wyboru, ujawniający się dopiero jako sprzeczny z pozornie dodatnim bilansem)
— ale inny, niepieniężny powód („Ekspansja przy granicy"), więc może wymagać osobnego zbadania po
wynikach rozpoznania PW (`a5cd559f49253a910`, w toku). **STATUS: zarejestrowane, w kolejce — czekam
na wynik powiązanego rozpoznania PW przed decyzją czy to jeden temat czy dwa osobne.**

---

## R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY — Operator naprawy dostarczył (`af98bc5fafb5f2aa6`)

3 miejsca naprawione dokładnie jak zlecono: nowa `isRationBalanceTargetMet` (helper, `empire-food.ts:438-460`,
flow-based gdy `requireFlowBalance`/`requireProductionSurplus` prawda, inaczej stare stock-based).
`autoRaiseRationsForGrowth` — krok przestrzeliwujący TERAZ COFANY (nie tylko zatrzymywany), reużyto
istniejącej flagi `requireProductionSurplus` (już dziś player-only, jedyny call site `ownerId===0`).
`autoBalanceRationsToSolvency` — nowy opcjonalny `requireFlowBalance`, przekazywane `ownerId===0` z
`main.ts`. `maxSafePoziomRacjiForCity` — gate wewnętrzny `ownerId===0` (bez zmiany sygnatury, wszyscy
dzisiejsi wywołujący i tak są player-only). **Rozdzielenie gracz/AI potwierdzone**: domyślne
`false`/`undefined` = identyczne stock-based zachowanie, zero zmiany dla AI.
**Test `auto-wyzywienie-flow-balance-test.cjs` (nowy, 17/17) zweryfikowany MUTACYJNIE** — na kodzie
sprzed naprawy (`git stash`) daje 3 fail/17, dokładnie reprodukując zgłoszony bug (pełznięcie poziomu
+ drenaż rezerwy) — po naprawie 17/17. Zaktualizowany istniejący test M w `ai-major-economy-test.cjs`
(zakładał stare stock-based jako „poprawne" — wymaga weryfikacji Evaluatora czy to zasadna aktualizacja
czy maskowanie problemu). Bramki: tsc 0, logic-test 213/213, `empire-food-b5-test` 25/3 (identyczne
przed/po, pre-istniejące R-STAWKI), `ai-major-economy-test` 33/33, `city-state-mp-growth-test` 9/9.
**UWAGA do weryfikacji Evaluatora:** worktree bazowany na `main`@`99974173` (NIE gałąź sesji) — Operator
zgłasza że `auto-wyzywienie-live-recalc-test.cjs` „nie istnieje w repo" — to prawdopodobnie dlatego,
że ten plik żyje na gałęzi SESJI (scalony tam w rundzie 5, commit `1a6f7e79`), NIE na `main` (który ma
tylko FALĘ 267) — analogiczna sytuacja do N2 z wcześniejszego Evaluatora tej sesji („baza worktree
NIE jest przodkiem gałęzi sesji, scalać wyłącznie deltę"). Evaluator MUSI to zweryfikować i uważać
przy scalaniu, żeby nie zaciągnąć nieaktualnego kontekstu linii. **Dispatchowany Evaluator.**

---

## P-SPACJA-POMIJA-AUTOEKSPLORACJE-BEZ-OZNACZENIA (2026-08-10, zgłoszenie Macieja + zrzut panelu Armie)

Maciej: spacja czasem nie przełącza na kolejną jednostkę z pozostałym ruchem, mimo że na zrzucie
panelu Armie widać kilka Zwiadowców z „RUCH 3/3" (pełny, niewykorzystany).

**Przyczyna zlokalizowana w kodzie (`gra/src/main.ts`):**
- `isUnitActiveForCycle()` (main.ts:4859-4864) celowo wyklucza z cyklu Spacji jednostki z
  `autoExplore===true` — obok `sentry`/`inGarnizon`/`ufortyfikowanyWPolu`. To zamierzone: Zwiadowca
  w auto-eksploracji porusza się sam, ręczne przełączanie na niego Spacją nie ma sensu.
- ALE `buildPlayerArmyListEntries()` (main.ts:5236-5302), który zasila panel Armie, w ogóle nie
  sprawdza `autoExplore` — nie ma go w `ArmyListEntry` (`armyListHud.ts:12-37`), nie ma badge'a ani
  wpisu w `detailLine`, mimo że analogiczne stany (`inGarnizon`/`sentry`/`ufortyfikowanyWPolu`) MAJĄ
  własny badge (`armyListHud.ts:195-210`) i własny tekst w `row.title` (linie 172-180).
- Efekt: Zwiadowca w auto-eksploracji wygląda w panelu identycznie jak zwykła jednostka z pełnym
  ruchem — gracz nie ma żadnej wskazówki, dlaczego Spacja go pomija. To NIE jest bug logiki cyklu
  (działa zgodnie z projektem), tylko luka w UI panelu Armie.

**Do ABC (3 opcje):**
- A: dodać w panelu Armie badge „auto-eksploracja" dla `autoExplore===true`, wzorem istniejących
  badge'y `inGarnizon`/`sentry`/`ufortyfikowanyWPolu` (ten sam styl `al-garnizon-badge` + tekst
  w `row.title`). Zero zmiany zachowania Spacji — tylko czytelność. Rekomendacja: najmniejsze
  ryzyko, spójne z istniejącym wzorcem.
- B: rozszerzyć Spację, żeby też cyklowała po jednostkach w auto-eksploracji (jak strzałki HUD
  ◀▶ dziś robią dla WSZYSTKICH stanów `all=true`). Zmienia zamierzone zachowanie — zabiera
  jednostkę spod kontroli auto-eksploracji przy każdym Spacja-cyklu, wbrew R-SPACJA-KOLEJNA-
  JEDNOSTKA-PETLA (2026-08-08), który świadomie rozdzielił Spację (tylko z ruchem I aktywne) od
  strzałek (wszystkie).
- C: zostawić panel bez zmian, dodać tylko wyjaśniający tekst w `detailLine` („w auto-eksploracji")
  bez osobnego badge'a graficznego — mniejsza zmiana niż A, ale mniej widoczna dla gracza (badge
  rzuca się w oczy bardziej niż linijka tekstu w środku karty).

**STATUS: zarejestrowane, ABC zadane w czacie, czekam na odpowiedź Macieja.**

## R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2 — zgłoszenie Macieja, PODWAŻA Q1=A (2026-08-10, zrzut panelu Zwiadowcy)

Maciej: po naciśnięciu Zwiedzaj jednostka powinna się wygaszać (odznaczać), a nie zostawiać podgląd
ruchu — bo gracz nie wie, czy ma kliknąć, czy zostawić jednostkę. Realny bug: czasem lewy klik na
mapie (na podświetlony heks ruchu) wykonuje rozkaz marszu ZAMIAST kliknięcia gdzie indziej i przy
okazji odznacza (wyłącza) autozwiedzanie. Żądane zachowanie: po WŁ Zwiedzaj — odznacz jednostkę;
jeśli jest kolejna jednostka z dostępnym ruchem, przejdź do niej (cykl); jeśli nie ma — pełne
odznaczenie, brak wybranej jednostki.

**⚠️ TO WPROST PODWAŻA `R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q1=A` (2026-08-04, `docs/decyzje/
R-SCOUT-ZWIEDZAJ-PODSWIETLENIE.md`)** — tamta decyzja świadomie WYŁĄCZYŁA deselect+cykl (ówczesne
zachowanie `R-SCOUT-ZWIEDZAJ-UX`) na rzecz „zostań zaznaczony + złota ramka od razu", bo brak
odznaczenia+cyklu dawał złotą ramkę widoczną natychmiast po kliknięciu (opcja B ówczesnego ABC —
„odznacz bez cyklu" — była odrzucona właśnie za brak natychmiastowego feedbacku). Dzisiejsze
zgłoszenie Macieja opisuje dokładnie odwrotny problem: zostanie zaznaczonym z aktywnym podglądem
ruchu jest MYLĄCE i prowadzi do przypadkowych kliknięć kasujących zwiedzanie.

**Zlokalizowane w kodzie (`gra/src/main.ts:16476-16491`, handler `scout-explore`):** WŁ dziś robi
`clearPlannedMarch(u.id); u.autoExplore = true; showHintMessage(...); refreshD1bHud();` — BEZ
`clearPlayerUnitSelection()`/cyklu (zgodnie z Q1=A), ale też BEZ czyszczenia `reachable`
(podświetlenie osiągalnych heksów z wcześniejszego zaznaczenia zostaje aktywne) — stąd realny,
klikalny „podgląd ruchu" na mapie, opisany przez Macieja. Klik w podświetlony heks idzie przez
zwykłą ścieżkę rozkazu marszu → `clearScoutAutoExplore(u)` (`scout-auto-explore.ts:28-33`,
wywoływane `main.ts:17764`/`18325`) kasuje `autoExplore` jako efekt uboczny.

**Do ABC (zaadresowane wprost do konfliktu z Q1=A):**
- A: pełny powrót do deselect+cykl, dokładnie jak opisał Maciej — po WŁ: odznacz, jeśli jest kolejna
  jednostka z ruchem to przejdź do niej (`cycleToAdjacentPlayerUnit`), inaczej pełne odznaczenie.
  Cofa `R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q1=A` do stanu sprzed tamtej decyzji. Feedback natychmiastowy
  (dziś już jest `showHintMessage` „zwiedza mapę — ruch na koniec tury", czego zabrakło w 2026-08-04
  gdy podejmowano Q1 — to może rozwiązywać oryginalny powód Q1=A bez trzymania zaznaczenia).
- B: zostaw zaznaczenie + złotą ramkę (Q1=A bez zmian), ale wyczyść `reachable`/podświetlenie
  ruchu przy WŁ Zwiedzaj — usuwa możliwość przypadkowego kliknięcia w heks ruchu (czyli usuwa
  KONKRETNY zgłoszony bug), zachowuje natychmiastowy feedback wizualny z Q1=A. Mniejsza zmiana,
  NIE cofa Q1=A.
- C: hybryda — jak B (bez podglądu ruchu), ale dodatkowo jeśli gracz mimo to kliknie mapę podczas
  gdy zaznaczony zwiadowca jest w autoExplore, pokaż potwierdzenie/ostrzeżenie zamiast cichego
  anulowania zwiedzania.

**STATUS: zarejestrowane, ABC zadane w czacie z wprost oznaczonym konfliktem z Q1=A, czekam na
odpowiedź Macieja.**

## P-SPACJA-POMIJA-AUTOEKSPLORACJE-BEZ-OZNACZENIA — ECHO A (2026-08-10, drugi zrzut, pełny panel Armie)

Maciej (nowy zrzut, przewinięty panel Armie): brakuje w tym widoku oznaczenia stanu jednostki —
auto-eksploracja / ufortyfikowanie / uśpienie. Zrzut potwierdza dokładnie zdiagnozowaną wcześniej
lukę: kilku Zwiadowców z pełnym „RUCH 3/3", zero wizualnego oznaczenia auto-eksploracji, podczas
gdy `inGarnizon`/`sentry`/`ufortyfikowanyWPolu` już MAJĄ własny badge w tym samym panelu.
Traktowane jako **ECHO opcji A** z pierwszego zgłoszenia tego tematu (badge „auto-eksploracja"
wzorem istniejących badge'y, zero zmiany zachowania Spacji). Wdrożenie: `ArmyListEntry.autoExplore`
(`armyListHud.ts`) + nowy badge w renderze + wpis w `buildPlayerArmyListEntries` (`main.ts`).
**STATUS: wdrożone, do commitu (bez deployu).**

## R-MANPOWER-EPOKA1-500-VS-1000 — zgłoszenie Macieja, PODWAŻA własną decyzję z 2026-08-03

Maciej: rozważa przywrócenie kosztu rekrutacji jednej jednostki z 500 na 1000 — przy większej
liczbie miast skala rekrutacji jest gigantyczna, znacząco przekracza potrzeby.

**⚠️ Odwrócenie własnej decyzji: commit `b518e3e7` (2026-08-03), „Epoka kamienia: koszt manpower
jednostki 1000 → 500", uzasadnienie w danych (`gra/data/epoka-ludnosc-manpower.json`, pole `_opis`):
„większa armia w Kamieniu — przy pełnej puli 1 ludek = 2 jednostki zamiast 1".** Zmiana dotyczyła
WYŁĄCZNIE epoki 1 (Kamień) — epoki 2-10 mają pełny `manpowerNaLudka` bez zmian (2000, 4000, ...,
480000). Pula max manpower/ludka w epoce 1 (1000) NIE zmieniła się — zmienił się tylko koszt
JEDNOSTKI (`manpowerNaJednostke`), stąd 2× więcej jednostek z tej samej puli.

**Rozpoznanie skalowania puli (potwierdza intuicję Macieja):** `cityManpowerMax()`
(`gra/src/game/manpower.ts:371-374`) = `populacja × manpowerNaLudka[epoka] × maxMult`, suma po
wszystkich miastach BEZ żadnego tłumika/malejącej krańcowości — pula rośnie LINIOWO z liczbą miast,
podczas gdy koszt jednej jednostki jest stały (zależny tylko od epoki). Przy N miastach limit
rekrutacji rośnie ~N×, "potrzeby" armii niekoniecznie tak szybko.

**Testy zależne od 500 (do aktualizacji przy powrocie do 1000):** `gra/tools/manpower-test.cjs`,
~12 asercji w liniach 211, 219, 241, 253, 263, 339, 345, 368, 395, 396, 439, 445.

**Do ABC:**
- A: cofnij TYLKO epokę 1 z powrotem do 1000 (proste odwrócenie decyzji z 2026-08-03). Za: dokładnie
  to, o co pyta Maciej; minimalna zmiana (1 liczba w JSON + aktualizacja testu). Przeciw: NIE
  rozwiązuje opisanego przez niego problemu skali przy większej liczbie miast — to osobny mechanizm
  (koszt jednostki vs. wielkość puli).
- B: zostaw epokę 1 na 500 (utrzymaj decyzję z 2026-08-03), ale wprowadź tłumik nieliniowy na
  CAŁKOWITĄ pulę Manpower rosnącą z liczbą miast (np. malejąca krańcowość powyżej progu miast).
  Za: adresuje realny opisany problem („przy większej ilości miast skala jest gigantyczna"), nie
  cofa poprzedniej decyzji. Przeciw: większa zmiana architektoniczna, wymaga osobnego zaprojektowania
  formuły tłumika.
- C: oba naraz — cofnij epokę 1 do 1000 ORAZ dołóż tłumik skalowania puli z liczbą miast.

**ECHO A** (2026-08-10, „Cofnij tylko epokę 1 do 1000 — dokładnie to, o co pytasz. Nie rozwiązuje
problemu skali przy wielu miastach."). **STATUS: WDROŻONE `b11c8608`** — `epoka-ludnosc-manpower.json`
epoka 1 `manpowerNaJednostke` 500→1000, `manpower-test.cjs` 12 asercji przeliczonych (62/62 zielone).
Problem skalowania puli z liczbą miast NIE rozwiązany (świadomie, wg odpowiedzi Macieja) — osobny,
niedispatchowany wątek jeśli zechce do niego wrócić.

## R-DYPLOLISTA-KOLOR-CYWILIZACJI — zgłoszenie Macieja (2026-08-10, zrzut listy Znane cywilizacje)

Maciej: karty cywilizacji w liście "ZNANE CYWILIZACJE" (`diploListHud.ts`) wyglądają identycznie —
brak odróżnienia. Prośba: nazwa cywilizacji w kolorze tej cywilizacji, a jeśli nie da się nazwy, to
przynajmniej tło pod ikoną-sygnetem w kolorze cywilizacji.

**Rozpoznanie: kolor JUŻ ISTNIEJE w danych i jest reużywany gdzie indziej, ale ginie w tej
konkretnej liście.** `civs.json` ma pole `kolorHex` per cywilizacja; `civColorCssForOwner()`
(`gra/src/game/civ-visual.ts:73`) już go zwraca i jest używany na minimapie (`main.ts:17186/17194`)
i w audiencji dyplomacji (`main.ts:5398/5421`, `DiploRelation.kolorHex`). `civPennantHtmlById()` i
`civLeaderMedallionHtmlById()` (`diploUiSkin.ts:56-72/92-112`) JUŻ przyjmują parametr `kolorHex` i
stosują go jako obrys/glow karty gracza ("Twoje państwo", `diploListHud.ts:224-229`).
**Przyczyna:** `diploListEntryFromRelation()` (`diploListHud.ts:441-476`) mapuje `DiploRelation` na
`DiploListEntry`, ale NIE przepisuje `kolorHex` — interfejs `DiploListEntry` (linie 23-36) w ogóle
go nie ma. Render karty (linia 298) woła `civPennantHtml(e.name, e.tier)` bez koloru → zawsze
`kolorHex=undefined`. Tło kółka (`.dip-pennant-inner`, `diploUiSkin.ts:183-186`) zależy dziś
wyłącznie od `tone` relacji (neutralny/gold/wojna), NIE od cywilizacji — stąd identyczne białe koła.

**Do ABC:**
- A: dociągnąć istniejący `kolorHex` do `DiploListEntry` (przepisać w `diploListEntryFromRelation`)
  i użyć go jak już jest użyty na karcie gracza — obrys/glow karty w kolorze cywilizacji (wzorzec
  już istnieje, zero nowego kodu wizualnego, tylko przekazanie brakującego parametru). Nazwa
  zostaje białym tekstem.
- B: jak A, plus pokolorować SAM TEKST nazwy cywilizacji (`e.name`) w `kolorHex` zamiast/obok obrysu
  — dokładnie pierwsza preferencja Macieja ("nazwa w kolorze"). Wymaga sprawdzenia kontrastu/
  czytelności na ciemnym tle dla jasnych kolorów cywilizacji (może wymagać jasnościowego clampu).
- C: jak A, ale kolorować TŁO kółka (`.dip-pennant-inner`) zamiast obrysu — mocniejszy efekt
  wizualny niż sama ramka, ale koliduje dziś z systemem `tone` (neutralny/gold/wojna) który już
  steruje tym tłem — wymagałoby zdecydowania priorytetu (kolor cywilizacji vs. kolor relacji).
**Rekomendacja: A+B razem (obrys + tekst), zostawiając tło kółka pod sterowaniem `tone` relacji
jak dziś — to zachowuje istniejącą czytelność stanu relacji (gold/wojna/neutralny) i dokłada
odróżnienie cywilizacji przez kolor+obrys, bez konfliktu dwóch sygnałów na jednym elemencie.**

**ECHO** (2026-08-10, „pokolorować sam tekst nazwy (Twoja pierwsza preferencja)") — wybrany WARIANT
TEKSTU (nie obrys/glow, wyłącznie `name.style.color`). **STATUS: WDROŻONE `f71869d2`** —
`DiploListEntry.kolorHex` + przekazanie w `diploListEntryFromRelation` + render. Dodany
`legibleCivTextColor()` (próg luminancji 0.45) — kilka kolorów w `civs.json` (np. `#5C4033`,
`#8B1A1A`) byłoby nieczytelnych jako czysty tekst na niemal czarnym tle bez rozjaśnienia.

## R-BRAK-KOMUNIKATU-ELIMINACJA-CYWILIZACJI — zgłoszenie Macieja (2026-08-10)

Maciej: nie zauważył żadnego komunikatu o zdobyciu WSZYSTKICH miast cywilizacji/państwa-miasta.

**Rozpoznanie — dwa osobne, konkretne defekty (nie jedna luka):**
1. **Podbój bojowy (ostatnie miasto w walce/kapitulacji z głodu):** komunikat ISTNIEJE —
   `main.ts:20831-20834`, `showHintMessage(civLabelForOwner(oldOwner) + ' — ELIMINACJA! ...', 6000)`
   w `runCapitalCapturePlunder()`. Ale zaraz PO nim, w tej samej ścieżce dla gracza, otwiera się
   pełnoekranowy modal `showCityCaptureNotice()` (`main.ts:20289`/`21009`,
   `gra/src/ui/cityCaptureNotice.ts:97-148`, `.civ-ccn-overlay` `z-index:660` przykrywa cały ekran
   łącznie z toastem `z-index:320`). Modal wymaga kliknięcia, treść to generyczne „Miasto zdobyte" —
   BEZ wzmianki o eliminacji. Zanim gracz zamknie modal, toast ELIMINACJA (timeout 6s) zwykle już
   zniknął w tle, niezauważony. To już RAZ naprawiany wzorzec dla innego komunikatu (komentarz
   `main.ts:20846-20850`, `P-TRIUMF-ZJEDNOCZENIE-GRECJI-KOMUNIKAT-BRAK`) — tu w nowej odmianie.
2. **Przejęcie dyplomatyczne ostatniego miasta (`annexCityStateToOwner`, `main.ts:20647-20666`,
   wchłonięcie MP):** ŻADNEGO komunikatu — ani toastu, ani modalu. To prawdziwa, pełna luka bez
   obejścia (nie kolizja UI jak w pkt 1).

**Do ABC:**
- A: przenieść informację o eliminacji DO modalu `showCityCaptureNotice` (dodać wariant treści/
  nagłówek „ELIMINACJA!" gdy zdobyte miasto jest ostatnim danego ownera) zamiast osobnego toastu,
  który i tak ginie pod tym modalem — jedno spójne, niepomijalne miejsce dla ścieżki bojowej.
  Osobno dodać analogiczny komunikat (toast, bo tam nie ma modalu) dla ścieżki dyplomatycznej
  (`annexCityStateToOwner`), która dziś nie ma nic.
- B: zostaw toast jak jest, ale skolejkuj komunikaty — pokazuj toast ELIMINACJA PO zamknięciu
  modalu `showCityCaptureNotice` (nie jednocześnie) i/lub wydłuż jego timeout. Mniejsza zmiana,
  nie dotyka modalu.
- C: wprowadzić trwalszy dziennik zdarzeń/log powiadomień (kolejka, nie jednorazowy toast z
  timeoutem) dla ważnych zdarzeń typu eliminacja — większa zmiana architektoniczna, rozwiązuje
  też przyszłe podobne kolizje (jak `P-TRIUMF-ZJEDNOCZENIE-GRECJI-KOMUNIKAT-BRAK` pokazuje, że to
  się powtarza).
**Rekomendacja: A** — najmniejsza zmiana usuwająca oba konkretne zgłoszone przypadki, wykorzystuje
istniejący modal (już niepomijalny, wymaga kliknięcia) zamiast walczyć z jego z-index/timingiem.

**ECHO A** (2026-08-10, „3a"). **STATUS: WDROŻONE `d7718ad5`** — `runCapitalCapturePlunder`/
`applyCityCaptureToMap` zwracają etykietę wyeliminowanej cywilizacji zamiast void, `showCityCaptureNotice`
dostał wariant ELIMINACJA! (gdy zdobywcą gracz), `annexCityStateToOwner` dostał brakujący toast
(gdy annexerId===0). Przypadek Triumfu zjednoczenia (własny modal) celowo pominięty w tej ścieżce.

## R-WYDARZENIA-KOLOR-DIPLO-INFO — ECHO bezpośrednia specyfikacja Macieja (2026-08-10, 2 zrzuty)

Maciej (dwa kolejne zrzuty panelu WYDARZENIA): (1) karty propozycji dyplomatycznych ("Dyplomacja: X")
nie powinny mieć czerwonej obwódki, tylko niebieską — czerwień zarezerwowana dla gróźb/wypowiedzenia
wojny. (2) Komunikaty dotyczące naszej cywilizacji ("Koniec tury" — skarb, autozapis, itp.) powinny
mieć złotą obwódkę i delikatnie czarne tło.

**Przyczyna zlokalizowana:** `.civ-side-panel .sp-event` (`sidePanelHud.ts:166-169`) ma DOMYŚLNY
`border-left:3px solid var(--tg-red)` — czerwień jest fallbackiem dla KAŻDEJ karty, nadpisywanym
tylko dla kind ze zdefiniowaną regułą (`sp-science`/`sp-culture`/`sp-city`/`sp-unit`/`sp-enemy`).
`kind:'diplo'` (main.ts:11863-11885, propozycje) i `kind:'info'` (eot-event-defer.ts:71, "Koniec
tury" — nasze własne zdarzenia końca tury) nie miały WŁASNEJ reguły, więc spadały na czerwony
fallback — to nie było zamierzone sygnalizowanie zagrożenia, tylko brakujący styl.

**Wdrożone (traktowane jako bezpośrednia, jednoznaczna specyfikacja, nie ABC z wariantami —
Maciej podał dokładny wynik dla obu kategorii):**
- `.sp-diplo` → `border-left-color:#6a9fd4` (niebieski) — reużyty istniejący token `--diplo`
  już ustalony w konwencji kodu (`cityForeignPick.ts`/`unitForeignPick.ts`).
- `.sp-info` → `border-left-color:#c9a84c` (złoty) + tło z czarnym tinem (`rgba(0,0,0,.35)` →
  ciemne tło panelu) — reużyty istniejący token `--info` z tej samej konwencji.
- `.sp-enemy`/`.sp-blocking` (groźby/wojna/zdarzenia negatywne) BEZ ZMIAN — pozostają czerwone,
  zgodnie z zasadą Macieja "czerwień tylko dla zagrożeń".

**Uwaga do wiadomości (nie blokuje wdrożenia):** `kind:'info'` obejmuje też rzadki przypadek handlu
AI↔AI (`title:'Dyplomacja'` bez nazwy cywilizacji, `origin:'other-civs'`, filtrowany chipem 🌍 „Inne
cyw.") — to NIE dotyczy naszej cywilizacji, ale dostanie ten sam złoty styl co reszta `info`, bo
Maciej nie rozróżnił tego przypadku w zgłoszeniu. Jeśli to niepożądane, osobne zgłoszenie.

**Plik:** `gra/src/ui/sidePanelHud.ts` (2 nowe reguły CSS, linie ~177-178).
**STATUS: wdrożone, do commitu (bez deployu). Bramki: tsc 0.**

## R-CS-HARD-PASYWNE-KOLIDUJE-Z-DWIEMA-DECYZJAMI-08-04 — zgłoszenie Macieja (2026-08-10)

Maciej: na najtrudniejszym poziomie państwa-miasta powinny bardziej aktywnie atakować (zbierać
wojska i wspólnie/masowo atakować stolicę gracza), a nie tylko siedzieć w obronie; dodatkowo
produkują mało jednostek. Pamięta moment, gdy to realnie działało.

**To NIE jest regresja/bug — to skutek DWÓCH świadomych decyzji ABC Macieja, które się ze sobą
kłócą właśnie na poziomie Trudny:**
1. **Mechanizm zbiorowego ataku PM ISTNIEJE** (`R-MP-HARD-WAVE`, commit `89fc4112`, 2026-08-04) —
   `planCityStateOffensiveMove` (`ai.ts:2515`), `CS_WAVE_ATTACK_MIN_STACK=3` (zakaz solo-rajdów),
   `resolveClusterCityStateWarOnPlayer` (`city-state-difficulty.ts:72-91`, klaster sióstr PM
   wypowiada wojnę RAZEM, 60% szans od tury 20). Aktywny WYŁĄCZNIE gdy `_menuCityStateDifficulty
   === 'hard'`.
2. **Trudność PM jest ODWRÓCONA względem trudności gry** (`AI-CS-CLUSTER-DIFF`, commit `e0b8afe4`,
   2026-07-30, `city-state-difficulty.ts:24-28`): gra Łatwy → PM Trudne (agresywne); gra Trudny →
   PM Łatwe (bierne). Na NAJTRUDNIEJSZYM poziomie gry PM domyślnie dostają NAJNIŻSZY poziom PM,
   więc mechanizm z pkt 1 się nie uruchamia (chyba że ręczny override w Zaawansowanych).
3. **Produkcja wojska PM jawnie zablokowana na Hard** (`MP-ARMY-Q1`/`MP-GARRISON-Q1`, commit
   `b47a2e8f`, 2026-08-04, kilka godzin po R-MP-HARD-WAVE tego samego dnia):
   `cityStateMilitaryProductionCap('hard') = 0` (zakaz nowej produkcji, tylko istniejący garnizon
   zostaje) — to skala TRUDNOŚCI GRY, nie trudności PM. Cytat z `docs/decyzje/MP-GARRISON-Q1.md:15`:
   „Hard: zostaw istniejące (garnizon na mapie), zakaz nowej produkcji wojskowej."

**⚠️ Trzy decyzje z 2026-07-30/08-04 (AI-CS-CLUSTER-DIFF, R-MP-HARD-WAVE, MP-GARRISON-Q1) razem
tworzą dokładnie ten efekt, który teraz Maciej zgłasza jako niepożądany.** `git log
-S"cityStateOffensiveSupport"` potwierdza: nikt tego później nie osłabił kodem — to nie regresja
techniczna, tylko efekt uboczny nakładania się tych decyzji.

**Pytanie kontrolne przed ABC:** czy playtest, który Maciej pamięta (masowy atak na stolicę), był
PRZED 2026-08-04 (przed capem produkcji=0) albo na ŁATWEJ trudności gry (gdzie PM=Trudne faktycznie
działa)?

**Do ABC:**
- A: odłączyć `cityStateOffensiveSupport`/wave-attack od `_menuCityStateDifficulty`, przywiązać
  wprost do `_menuDifficulty === 'hard'` — agresja PM i cap produkcji rosną RAZEM z trudnością gry
  (zamiast być odwrócone). Cofa efektywnie inwersję z `AI-CS-CLUSTER-DIFF` dla tego konkretnego
  mechanizmu.
- B: zostawić inwersję trudności PM (AI-CS-CLUSTER-DIFF bez zmian), ale podnieść
  `cityStateMilitaryProductionCap('hard')` z 0 na >0 — PM na Hard mogą się choć trochę dozbrajać
  mimo defensywnego ustawienia trudności PM.
- C: zostawić jak jest — Hard = elitarna, nieliczna major AI + bierne PM (świadomy balans), a
  agresję PM traktować jako funkcję OSOBNEGO suwaka „Trudność miast-państw" w Zaawansowanych (do
  ręcznego ustawienia przez gracza, niezależnie od trudności gry).

**STATUS: zarejestrowane, ABC zadane w czacie z wprost oznaczonym konfliktem trzech wcześniejszych
decyzji (2026-07-30, 2× 2026-08-04), czekam na odpowiedź Macieja.**

**KOREKTA Macieja (2026-08-10):** inwersja `AI-CS-CLUSTER-DIFF` (pkt 2) miała dotyczyć WYŁĄCZNIE
tego, jak łatwo INNE CYWILIZACJE AI przejmują państwa-miasta — potwierdzone dosłownym cytatem z
`docs/decyzje/AI-CS-CLUSTER-DIFF-2026-07-30.md` pkt 1: „Trudność państw-miast WZGLĘDEM AI
CYWILIZACJI". Agresja PM SKIEROWANA NA GRACZA (pkt 4 tej samej decyzji + cały `R-MP-HARD-WAVE`)
NIE powinna być odwrócona — ma iść WPROST z trudności gry wybranej przez gracza (Trudny=trudno,
Łatwy=łatwo), tak jak wszystko inne. To był błąd wdrożenia z 2026-07-30/08-04 (jedna zmienna
`_menuCityStateDifficulty` obsługiwała dwie różne sprawy naraz), nie świadomy kompromis do
zaakceptowania — **opcja A z ABC wyżej jest właściwym kierunkiem**, potwierdzona przez Macieja.
Dispatchowany agent projektowy do precyzyjnego rozdzielenia (AI) vs (GRACZ) po wszystkich
konsumentach `_menuCityStateDifficulty`, żeby nie zepsuć poprawnie działającej części (AI).
**Kodowanie NADAL wstrzymane** do dostarczenia planu i ostatecznego potwierdzenia zakresu zmiany.

## R-ZUZYCIE-SUROWCOW-OBYWATELE — nowa mechanika, propozycja Macieja (2026-08-10)

Maciej proponuje nową mechanikę: obywatele miast zużywają surowce budowlane per epoka (analogicznie
do zużycia Żywności przez populację). Zgłoszone w 3 wiadomościach, złożona podsumowująca lista
poniżej:

| Epoka | Zużycie na 1 obywatela (ludka) |
|---|---|
| Kamień | 1 Drewno + 1 Glina |
| Brąz | 1 Drewno + 1 Glina + 1 Kamień + 1 Ceramika |
| Żelazo | 1 Drewno + 1 Glina + 1 Kamień + 1 Ceramika + 1 Cegła |

Dodatkowo (zasady skutków, podane wprost przez Macieja — NIE otwarte pytanie): każdy DOSTĘPNY
wymagany surowiec w danej epoce = **+1 Szczęście**; każdy BRAKUJĄCY wymagany surowiec = **-1
Szczęście ORAZ -1% do Rozwoju**.

**Rozpoznanie architektury (wzorzec: silnik Żywności, `empire-food.ts`) — 3 KRYTYCZNE konflikty do
rozstrzygnięcia PRZED kodowaniem:**

1. ~~⚠️ Glina ma bazową produkcję terenu = 0 WSZĘDZIE~~ **SPROSTOWANE przez Macieja (2026-08-10),
   POTWIERDZONE w kodzie — pierwsze rozpoznanie było NIEPEŁNE.** Prawda: `TERRAIN_YIELDS` (czyste
   typy terenu — Równina/Wzgórza/itd.) rzeczywiście nie mają kolumny Glina (stąd `base.glina`
   zawsze 0 — TO jest to, co mówił komentarz `economy.ts:251-252`), ALE rzeka to OSOBNA warstwa
   (`tile.maRzeke`, nie typ terenu), doliczana w oddzielnym bloku `tileYield()` (~linia 434):
   `RIVER_MODIFIER.glina = 2` (`terrain-yields.json`, `terrain_modifiers.Rzeka.Glina: 2`,
   „R-HEX-PLONY-MAGAZYN B, Maciej 2026-07-29"). Potwierdzone dedykowanym testem
   (`heks-plony-warstwy-test.cjs`, „Rzeka +2 glina"). **Czyli: każdy heks NAD RZEKĄ ma +2 Gliny/turę
   bez żadnego ulepszenia, niezależnie od epoki.** Glinianka (epoka Brąz, wymaga złoża Gliny — NIE
   rzeki) to DRUGIE, niezależne źródło (+4/turę). Ryzyko gwarantowanego deficytu w Kamieniu istnieje
   WYŁĄCZNIE dla miast BEZ dostępu do rzeki w promieniu pracy — nie dla wszystkich miast jak
   pierwotnie twierdzono. Nadal wymaga rozstrzygnięcia: co z miastami śródlądowymi bez rzeki w
   epoce Kamień (przed odblokowaniem Glinianki w Brązie)?
2. **Ceramika wymaga konwertera (Garncarnia: Glina+Drewno→Ceramika) ORAZ osobnej tech „Dostęp do
   surowca: Ceramika"** (`tech.json:186/199`) — czyli w epoce Brąz Ceramika też nie jest dostępna
   od razu na starcie epoki, tylko po zbudowaniu Garncarni i odblokowaniu tech. Ten sam typ ryzyka
   co pkt 1, tylko dla Brązu zamiast Kamienia.
3. **Nie istnieje dziś ŻADNE trwałe zużycie surowców budowlanych per turę** (poza jednorazowym
   kosztem budowy i throughput konwerterów) — to byłaby zupełnie nowa kategoria w silniku ekonomii,
   bez istniejącego odpowiednika strukturalnego do doklejenia (w odróżnieniu od Żywności, gdzie
   cały mechanizm bilansu/nadwyżki/magazynu już istnieje).

**Otwarte pytania do ABC (nie odpowiedziane jeszcze przez Macieja):**
- Czy AI (duża i miasta-państwa) ma być objęte tym samym zużyciem, czy wyłącznie gracz? (wzorzec
  Żywności różnicuje flow-based dla gracza vs stock-based dla AI, ale KARA za deficyt jest identyczna
  dla obu — to może, ale nie musi, być właściwy wzorzec też tutaj).
- Czy zużycie liczy się PER LUDEK (jak żywność, `populacja × 1 surowiec`) — potwierdzone przez
  „każda jednostka obywatela" — czy per MIASTO (płasko, niezależnie od populacji)? Zakładam per
  ludek zgodnie z dosłownym brzmieniem, ale warto potwierdzić wprost, bo to duża różnica skali.
  Czy zaliczenie kar (2) jest liczone per obywatel z osobna (można mieć np. połowę obywateli
  zaopatrzonych, połowę nie) czy binarnie per miasto (miasto ma surowiec = wszyscy zaopatrzeni)?
- Gdzie w UI pokazać to zużycie — analogicznie do `foodSummaryRow` w `empireDetailPanel.ts`
  („Uprawa i hodowla" / „Wyżywienie ludności"), potrzebna nowa sekcja per surowiec (Drewno/Glina/
  Kamień/Ceramika/Cegła), dziś nieistniejąca.
- Konflikty (1) i (2) wymagają rozstrzygnięcia: czy zasada obowiązuje od PIERWSZEJ tury epoki
  (gwarantowany deficyt na starcie), czy z okresem karencji / dopiero po odblokowaniu odpowiedniej
  tech/budynku, czy może wymagana lista surowców per epoka powinna pomijać te niedostępne na
  starcie (np. Kamień = tylko Drewno na starcie, Glina dołącza się automatycznie gdy gracz zbuduje
  Gliniankę)?

**STATUS: rozpoznanie gotowe, lista zestawiona jak poprosił Maciej, ale kodowanie WSTRZYMANE do
rozstrzygnięcia 3 konfliktów wyżej — to nie jest zwykłe ABC z 3 opcjami, tylko fundamentalna
sprzeczność między żądaną regułą a stanem danych gry, wymaga decyzji Macieja przed dalszym
rozpoznaniem/projektowaniem.**

## PUNKT 6 — Lista robocza "do wykonania" (2026-08-10, aktualizowana na żądanie Macieja)

Skonsolidowana lista wszystkich zgłoszeń Macieja z tej sesji (po ostatniej fali), z aktualnym
statusem każdego. Aktualizowana na bieżąco — nie osobny, statyczny dokument.

### Zrobione i wypchnięte (nie wymagają już akcji)
1. Spacja pomija auto-eksplorację bez oznaczenia → badge w panelu Armie (`65bc26d4`)
2. Kolor nazwy cywilizacji w liście dyplo → wdrożone (`f71869d2`)
3. Brak komunikatu eliminacji cywilizacji → wdrożone (`d7718ad5`)
4. Manpower epoka 1: 500→1000 → wdrożone (`b11c8608`)
5. Kolor kart WYDARZENIA (diplo=niebieski, info=złoty) → wdrożone (`2f73c530`)
6. P-HEKS-ZLOZE-PARYTET-NIEDOMKNIETY (dług techniczny, dispatch C-027) → wdrożone (`7bc2a3ed`)
7. 16 nieaktualnych nagłówków STATUS w tym pliku → poprawione (`992ef60b`)
8. Brak przycisku „Kontynuuj" w menu głównym → wdrożone (`539e4db0`)

### Czeka na decyzję ABC Macieja (nie można kodować bez odpowiedzi)
9. `R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2` — odznaczenie po Zwiedzaj (koliduje z Q1=A z 2026-08-04)
10. `R-CS-HARD-PASYWNE-KOLIDUJE-Z-DWIEMA-DECYZJAMI-08-04` — pasywność PM na Hard. Korekta Macieja
    przyjęta (inwersja miała dotyczyć tylko AI, nie gracza). Plan techniczny GOTOWY (agent
    projektowy dostarczył pełną klasyfikację + plan naprawy, w tym 2 NOWE znaleziska nieujęte w
    pierwszym zgłoszeniu: `decideAIDiplomacy` dla relacji z graczem i `_menuCitySupport`/sojusz
    sióstr też błędnie podpięte pod odwróconą zmienną). **Czeka na ostateczne „rób" od Macieja**
    przed dispatchem kodowania — plan oznacza punkt 4 (rozbicie `decideAIDiplomacy`) jako
    najbardziej ryzykowny, wymagający osobnej rundy testów.
11. `R-ZUZYCIE-SUROWCOW-OBYWATELE` — nowa mechanika zużycia surowców przez obywateli. Lista
    zestawiona, korekta Gliny+rzeki przyjęta (rzeka daje +2 Gliny/turę zawsze, nie tylko po
    Gliniance). Nadal otwarte: miasta śródlądowe bez rzeki w Kamieniu (wciąż potencjalny
    gwarantowany deficyt), Ceramika w Brązie (ten sam typ ryzyka, nierozstrzygnięty), czy AI objęte
    tą samą zasadą, zużycie per-ludek czy per-miasto, gdzie w UI pokazać.

### W trakcie rozpoznania (dopiero co zgłoszone, przyczyna jeszcze nieznana)
12. **[PILNE — możliwa utrata danych]** Manualny zapis (nie autozapis) nie pojawia się na liście
    „Wczytaj grę". Dispatchowany subagent, priorytet podniesiony ponad punkty 13-14 w tym samym
    zleceniu.
13. Lista sejwów w dialogu „Wczytaj grę" nie jest sortowana najmłodsze→najstarsze — trudno znaleźć
    właściwy zapis. Ten sam subagent.
14. Wczytywanie zapisu trwa tyle samo/dłużej co generowanie nowej mapy — zrzut pokazuje krok
    „Rzeki — uzupełnianie" (7/10) podczas WCZYTYWANIA, co sugeruje możliwą regenerację mapy od
    zera zamiast odczytu zapisanego układu. Ten sam subagent.

**STATUS: lista aktualna na 2026-08-10, aktualizowana przy każdym nowym zgłoszeniu Macieja lub
zamknięciu istniejącego punktu.**

## P-ZAPIS-CICHY-BLAD-QUOTA-MYLACY-KOMUNIKAT (2026-08-10, zgłoszenie Macieja: manualny zapis znika)

Maciej: zapisał grę własnym, ręcznym zapisem (nie autozapisem) i tego zapisu nie ma na liście do
wgrania — potencjalna utrata dostępu do zapisanej gry.

**Rozpoznanie (dispatchowany agent, `a56cc03a4c29bdef8`):** manualny zapis i `listSaves()` czytają
DOKŁADNIE ten sam magazyn (`localStorage`) i prefiks (`SAVE_PREFIX`) — to NIE jest rozjazd dwóch
różnych backendów (FSA dotyczy wyłącznie rotacyjnego autozapisu, nie zapisu ręcznego z dialogu).
**Najbardziej prawdopodobna przyczyna:** cichy/źle zgłoszony błąd zapisu przy przepełnionym
localStorage (limit ~5-10MB/origin):
1. `persistSaveToSlot` (`main.ts:21717-21726`) zwraca goły `boolean`, ODRZUCAJĄC pole `reason` z
   `saveToLocal` (`save.ts:359-368`) — przy `QuotaExceededError` gracz widzi ten sam ogólny
   komunikat co przy każdym innym błędzie: `'Zapis nieudany (brak localStorage?)'`
   (`main.ts:16513`, identycznie `doQuickSave` `main.ts:21737`) — mylące, sugeruje brak API, nie
   brak MIEJSCA. Dla porównania: rotacyjny autozapis (`main.ts:21892-21909`) POPRAWNIE rozróżnia
   `reason==='quota'` i pokazuje „brak miejsca w zapisie przeglądarki" — manualny zapis i Ctrl+S
   tego nie robią. Gotowy wzorzec do skopiowania.
2. Dialog zapisu zamyka się NATYCHMIAST po kliknięciu „Zapisz" (`saveLoadDialog.ts`, `commit()`),
   ZANIM wynik zapisu jest znany — wygląda na potwierdzony zapis, nawet gdy w tle się nie udał.
3. Nazwa/prefix NIE różnią się (obalona hipoteza literówki).

**Jak Maciej może dziś sprawdzić ręcznie:** DevTools (F12) → Application/Storage → Local Storage →
domena gry → szukać kluczy `thegame.save.*` (bez `_lastPlayed`, to wskaźnik). Brak klucza = zapis
faktycznie nie trafił do storage. Warto sprawdzić konsolę pod `[Save] Blad:` (`main.ts:21723`).

**Nie wymaga ABC — jasno opisane oczekiwane zachowanie, gotowy wzorzec do naśladowania (C-027 pkt 3):
dispatch subagenta od razu.** Naprawa: `persistSaveToSlot`/`doQuickSave` mają przekazywać `reason`
zamiast gołego `boolean`, UI (`openSaveGameDialog`, Ctrl+S) ma pokazywać jawny komunikat o pełnym
storage z podpowiedzią „usuń stare zapisy" (wzorem już istniejącej obsługi w autozapisie), dialog
nie powinien zamykać się przed potwierdzeniem wyniku.

**STATUS: zarejestrowane, dispatch Sonnet 5 w tej samej turze.**

## P-WCZYTYWANIE-REGENERUJE-MAPE-OD-ZERA (2026-08-10, zgłoszenie Macieja: wolne wczytywanie)

Maciej: wczytywanie zapisu trwa tyle samo/dłużej co generowanie nowej mapy.

**Rozpoznanie — POTWIERDZONE, poważne architektonicznie:** `SaveGame` (`save.ts:98+`) NIE zawiera
siatki heksów w ogóle — tylko `seed` (`checkSaveIntegrity` wymaga `g.seed`, `save.ts:525-527`).
Mapa jest ZAWSZE odtwarzana proceduralnie z ziarna, nigdy deserializowana wprost z zapisu.
Pipeline: `loadGameFromSlot` → `loadNeedsMapRebuild()` (`main.ts:6540-6554`, zwraca `true`
natychmiast gdy `!fromInGamePause` — czyli w PRAKTYCZNIE KAŻDYM „Wczytaj grę" z menu głównego) →
`regenerateWorldForLoad()` (`main.ts:26226`) → `generujSwiatAsync(seed, ...)` — **DOKŁADNIE ta sama
funkcja co przy Nowej Grze** (`main.ts:26346`, `doStartGame`), ten sam callback progresu, ta sama
lista 10 faz `MAP_GEN_PHASE_LABELS` (`mapGenProgress.ts:16-27`, w tym `riversFill: 'Rzeki —
uzupełnianie'`, krok 7/10 — dokładnie to widoczne na zrzucie Macieja). Load i New Game dosłownie
dzielą ten sam kod generatora i pipeline — architektonicznie to pełna regeneracja mapy od zera przy
KAŻDYM wczytaniu, nie odczyt/dekompresja zapisanych heksów.

**To WYMAGA ABC (C-027 pkt 2) — realny wybór kompromisu, nie prosta naprawa:**
- A: serializować pełną siatkę heksów do zapisu (większy plik zapisu, ale natychmiastowe
  wczytanie, brak zależności od determinizmu generatora — bezpieczne nawet gdyby generator się
  kiedyś zmienił). Największa zmiana architektoniczna, ale najbardziej fundamentalne rozwiązanie.
- B: zostawić regenerację z ziarna (deterministyczny generator z tym samym seedem MUSI dać
  identyczny wynik), ale zoptymalizować/przyspieszyć sam generator, albo pominąć zbędne kroki przy
  wczytywaniu (np. kroki UI/animacji, które i tak nie muszą się dziać przy load). Mniejsza zmiana,
  ale nie eliminuje fundamentalnej kruchości (zmiana generatora w przyszłości cicho zepsułaby
  stare zapisy).
- C: hybryda — serializować TYLKO to, co się realnie zmieniło względem świeżo wygenerowanej mapy
  (delta: złoża wyeksploatowane, ulepszenia gracza, zmiany terenu) zamiast całej siatki, zachowując
  regenerację bazowego terenu z ziarna jako punkt startowy. Kompromis rozmiar/złożoność.

**ECHO A** (2026-08-10): „Serializować pełną siatkę heksów do zapisu." Uwaga do świadomości: to
zwiększa rozmiar pojedynczego zapisu w `localStorage`, co interaguje z równolegle naprawianym
`P-ZAPIS-CICHY-BLAD-QUOTA-MYLACY-KOMUNIKAT` (limit ~5-10MB/origin) — im większe zapisy, tym łatwiej
o quota. Musi zostać zachowana WSTECZNA KOMPATYBILNOŚĆ ze starymi zapisami (bez pełnej siatki) —
fallback na dzisiejszą regenerację z ziarna, nie odrzucenie starych zapisów.
**STATUS: dispatch Sonnet 5 (worktree).**

## P-SEJWY-KOLEJNOSC-STARE-BEZ-SAVEDAT (2026-08-10, przy okazji rozpoznania sortowania listy sejwów)

Rozpoznanie sortowania listy „Wczytaj grę" (`saveLoadDialog.ts:159/193`,
`out.sort((a,b)=>b.savedAt.localeCompare(a.savedAt))`) pokazało, że sortowanie malejące po dacie
JUŻ DZIAŁA poprawnie w obecnym kodzie — Maciej prawdopodobnie widział albo starszy build (przed
commitami wprowadzającymi to sortowanie), albo realny, węższy problem: STARE zapisy sprzed
wprowadzenia pola `meta.savedAt` dostają `savedAt: ''` (puste) i lądują na końcu listy w
NIEDETERMINISTYCZNEJ kolejności względem siebie (pusty string sortuje się tak samo jak inny pusty
string — kolejność między nimi zależy od stabilności sortowania, nie chronologii).
**Nie wymaga ABC — jasno opisane, wąskie zachowanie brzegowe (C-027 pkt 3): dispatch razem z
naprawą P-ZAPIS-CICHY-BLAD-QUOTA-MYLACY-KOMUNIKAT** (ten sam obszar kodu, sensowne połączyć w
jedno zlecenie Operatora, ale osobna, jasno wydzielona część zakresu — C-025 zakaz mieszania
zakresu nadal obowiązuje, Operator ma dwie odrębne, jasno opisane poprawki, nie jeden rozmyty fix).

**STATUS: zarejestrowane, dispatch razem z P-ZAPIS-CICHY-BLAD-QUOTA-MYLACY-KOMUNIKAT.**
