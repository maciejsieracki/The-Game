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

## P-OKOLICA-ADJUST-PLUS1-TOGGLE-SEMANTYKA (2026-08-09, nota N3 Evaluatora rundy 4 P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA) · STATUS: **OTWARTE — pre-istniejące, poza zakresem**
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

## R-MERGE-MAIN-RYTM-Q1 (2026-08-09, pytanie Macieja „kiedy dany commit powinien trafić do main") · STATUS: **OTWARTE — ABC, czeka na literę**

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

## P-OVERLAY-KOLEJNOSC-WYWOLAN-TRASY-PIGULKI (2026-08-09, znalezisko Operatora przy naprawie P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE) · STATUS: **OTWARTE — niepilne, ten sam wzorzec błędu**

W `applyCityPanelWorldView()` (`gra/src/main.ts`) ten sam błąd kolejności wywołań, który powodował
widmowego złotego chłopka (bramka `isCityPanelOpen()` widziała stan "zamknięty" tuż przed
otwarciem panelu i budowała warstwę, która potem już nigdy się nie odświeży dopóki panel nie
zostanie zamknięty), dotyczy też: `refreshTradeRoutesOverlay()` (łuki tras handlowych) i
`cityRenderer.sync(..., hideStatChips: isCityPanelOpen())` (pigułki miast na mapie). Nie
naprawione — poza zakresem zgłoszenia o chłopkach. Do potwierdzenia czy realnie objawia się w
grze (może być niezauważalne jeśli te warstwy rzadziej się zmieniają w trakcie otwartego panelu).

---

## R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO (2026-08-09) · STATUS: **OTWARTE — koryguje wykonanie R-HUD-MIASTO-STAN-CYWILIZACJI (2026-08-08), dispatch Sonnet 5**

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

## P-DYPLO-SWEETENER-KOSZYK-W-TRAKTACIE (2026-08-09, nota D1 Evaluatora R-DYP-STOL-A-KOREKTA) · STATUS: **OTWARTE — realna luka, do decyzji**

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

## P-DYPLO-DOPLAC-PW-ZLA-SCIEZKA (2026-08-09, nota D2 Evaluatora R-DYP-STOL-A-KOREKTA) · STATUS: **OTWARTE — niepilne, kosmetyka komunikatu**

Komunikaty „Brakuje X PW — dopłać" / „Dopłać X PW" (`diplomacyAcceptanceBalance.ts:625,631`,
`diplomacy-acceptance-points.ts:363-371`) każą graczowi zrobić coś, co w formularzu treaty-only
jest już niemożliwe (brak pól do dopłaty). Powinny kierować do zrobienia osobnej umowy — to
dosłownie cel dzisiejszej decyzji o rozłączeniu.

## P-HUD-KULTURA-SIGNED-NIESPOJNE (2026-08-09, znalezisko Operatora przy R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO) · STATUS: **OTWARTE — niepilne, kosmetyka**

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

## R-WYDARZENIA-FILTR-KATEGORII (2026-08-09) · STATUS: **OTWARTE — zaimplementowane w worktree, 2 noty blokujące + 1 pytanie przed scaleniem**

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

## R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE (2026-08-09, zgłoszenie z playtestu) · STATUS: **OTWARTE — wymaga rozpoznania przed decyzją**

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

## R-EPOKA-CUD-WARUNEK-AWANSU (2026-08-09, zgłoszenie z playtestu) · STATUS: **OTWARTE — nowa reguła gry, wymaga ABC**

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

## R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY (2026-08-09, zgłoszenie z playtestu) · STATUS: **OTWARTE — koryguje dopiero co zatwierdzoną R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO, dispatch Sonnet 5**

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

## P-PRODUKCJA-DREWNO-GLINA-KAMIEN-ZESTAWIENIE (2026-08-09, żądanie danych od Macieja przy P-MAGAZYN-PRZEKROCZENIE-LIMITU) · STATUS: **OTWARTE — czyste zestawienie danych, decyzja o zmianie balansu odłożona do odpowiedzi Macieja**

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

## P-TRIUMF-ZJEDNOCZENIE-GRECJI-KOMUNIKAT-BRAK (2026-08-09, pytanie z playtestu) · STATUS: **OTWARTE — pytanie faktograficzne + regresja do potwierdzenia, badam bezpośrednio**

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

## R-SPICHLERZ-CAP-LUDNOSCI-ETAP (2026-08-09, propozycja gameplayowa Macieja) · STATUS: **OTWARTE — wymaga ABC**

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
