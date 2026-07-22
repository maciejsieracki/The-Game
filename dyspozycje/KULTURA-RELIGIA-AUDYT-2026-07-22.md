# Audyt: Kultura i religia — stan dziś + propozycja wzmocnienia

| Pole | Wartość |
|------|---------|
| **Data** | 2026-07-22 |
| **Autor** | sesja audytu (read-only) |
| **Trigger** | Maciej: „kultura i religia praktycznie nie wpływają na nic" |
| **Zakres** | `gra/src/game/culture-religion.ts`, `economy.ts`, `turn-economy.ts`, `main.ts`, `society-params.json`, `buildings.json`, `civs.json`, `diplomacy.json`, `victory.ts`, UI/HUD |

---

## 1. Executive summary

**Diagnoza:** System ma **bogaty moduł logiki** (`culture-religion.ts`, 43 testy zielone) i **częściowe wpięcie w turę**, ale kluczowe obietnice designu (ekspansja terytorium, konwersja po podboju, bonus handlu z religii, dyplomacja wyznaniowa, zwycięstwo kulturowe) **nie działają w runtime** albo dają efekt tak mały / tak rzadki, że gracz ich nie odczuwa.

**Rekomendacja:** Paczka **„Wpięcie + feedback"** (🟡 cross-lane, ~2–3 sprinty lane B + F) zanim nowe systemy. Priorytet: (1) granice terytorium z kultury, (2) konwersja po podboju, (3) widoczny feedback UI, (4) opcjonalnie handel z religii.

---

## 2. Co istnieje dziś — mapa plików

| Warstwa | Pliki | Rola |
|---------|-------|------|
| **Logika czysta** | `gra/src/game/culture-religion.ts` | Kumulacja kultury, progi zasięgu, szczęście, szerzenie/konwersja religii, mnożnik handlu |
| **Testy** | `gra/tools/culture-religion-test.cjs` | 43 asercje — moduł stabilny |
| **Dane** | `gra/data/society-params.json` (bloki `kultura`, `religia`, `szczescie`) | Progi, bonusy, kary — data-driven |
| **Budynki** | `gra/data/buildings.json` | `kamienne_kregi`, `swiatynia`, `biblioteka`, `palac`, `akademia`, `teatr` (suppressed) |
| **Cywilizacje** | `gra/data/civs.json` | `Religia` + `mnoznikHandelPieniadz` (np. Grecy 2.3) |
| **Tech** | `gra/data/tech.json` | Mistycyzm → kręgi; Religia → świątynia; Filozofia → akademia/teatr |
| **Ekonomia** | `gra/src/game/economy.ts`, `turn-economy.ts` | Plon `kultura` z budynków; mnożnik porządku `kulturaMult` |
| **Społeczeństwo** | `gra/src/game/society-breakdown.ts`, `order.ts` | `haKult`, `haRel` w % Szczęścia → Porządek |
| **Silnik** | `gra/src/main.ts` (~12030+) | Pętla tury: accumulateCulture, religionHappiness, spreadReligion |
| **UI** | `hud.ts`, `empireOverlayHud.ts`, `cityPanel.ts`, `rangeOverlay.ts` | Chipy, overlay A1-Q12, zasięg na mapie |
| **Dyplomacja** | `diplomacy.ts` | Zdarzenia „Wspólna religia" w JSON — **API gotowe, wywołanie wyłączone** |
| **Zwycięstwo** | `gra/src/game/victory.ts` | Tylko dominacja + nauka + przegrana — **brak zwycięstwa kulturowego** |
| **Dokumentacja gracza** | `docs/PORADNIK-GRACZA/15-kultura-religia-cuda.md` | Opisuje mechaniki **szersze niż silnik** (presja per hex, konwersja) |

---

## 3. Co **faktycznie** wpływa na gameplay (WPIĘTE)

### 3.1 Kultura — działające

| Mechanizm | Jak działa | Siła efektu |
|-----------|------------|-------------|
| **Plon `/t` z budynków** | `economy.ts` sumuje `baza.kultura` × poziom budynku | Kręgi +1/t, Świątynia +3/t (+przyrost), Pałac +5/t, Akademia +7/t |
| **Kumulacja** | `accumulateCulture()` w `main.ts` co turę | Rosnąca liczba w `city.kultura` |
| **Bonus szczęścia (kultura własna)** | `cultureHappiness()` → `evaluateOrderFromBreakdown` | +2 pkt (100% własnej) / +1 (≥75%) / 0 / −1 / −2 |
| **Zasięg mgły** | `citySightRadius(pop, kultura)` = okolica + `cityBorderRadius` | +0…+3 hex widzenia — **jedyny realny efekt „progu zasięgu"** |
| **HUD** | Suma kultury imperium, `/t`, panel overlay | Informacja — bez mechanicznego payoffu przy progach |
| **Porządek T1** | `order.ts` `karaKulturaT1` −10% plonu kultury przy niepokoju | Pośredni — przez niski Porządek, nie przez samą kulturę |

**Typowe tempo:** miasto z Kręgami (+1/t) → pierwszy próg 100 pkt ≈ **100 tur**. Ze Świątynią (+3–5/t) ≈ **20–33 tury** — ale przekroczenie progu **nie poszerza terytorium roboczego**.

### 3.2 Religia — działające

| Mechanizm | Jak działa | Siła efektu |
|-----------|------------|-------------|
| **Religia startowa miasta** | `defaultCityReligionState(pop, religia cywilizacji)` | 100% wyznawców wiary właściciela od T0 |
| **Bonus szczęścia** | `religionHappiness()` | +2 (nasza dominuje) / −2 (obca) / −1 (brak dominacji + świątynia) |
| **Szerzenie** | `spreadReligion()` — +1 wierny/t do sąsiada w zasięgu 3 hex | Wolne; sens tylko między **różnymi** religiami |
| **Świątynia → szczęście budynku** | `baza.zadowolenie` + globalne +1 per budynek | +4 zadowolonych przy Świątyni lvl1 — **silniejsze niż sama religia** |
| **HUD religia** | Suma wiernych, `/t` szerzenia | Liczby bez wyraźnej konsekwencji |

### 3.3 Budynki kulturowe (JSON → ekonomia)

| Budynek | Kultura baza | Zadowolenie baza | Uwagi |
|---------|-------------|------------------|-------|
| Kamienne kręgi | 1 | 1 | Mistycyzm, upgrade → Świątynia |
| Świątynia | 3 | 3 | Religia, przyrost +2/+2 |
| Biblioteka | 1 | 0 | Nauka >> kultura |
| Pałac | 5 | 2 | Stolica, mnożnik prawa |
| Akademia | 7 | 3 | Merge Biblioteka+Teatr; Filozofia |
| Teatr | 4 | 3 | **`suppressed: true`** — niewidoczny w produkcji |

---

## 4. Co jest **martwe / UI-only / niewpięte**

| Element | Status | Dowód |
|---------|--------|-------|
| **`convertCulture()`** | ❌ Nigdy wywołane | Brak wywołań poza `culture-religion.ts` |
| **`ownCultureShare` / `kulturaOwnShare`** | ❌ Nigdy zapisywane | Zawsze domyślnie **1.0** → gracz **zawsze** dostaje bonus +2, nigdy kary |
| **Ekspansja granic z kultury → terytorium** | ❌ | `territory.ts`: promień = **tylko populacja** (`max(5,pop)`); `buildTerritoryNodesFromCities` **ignoruje kulturę** |
| **`convertViaTemple()`** | ❌ | Podbite miasto zachowuje stary skład w `cityRelig`, ale brak konwersji/turę |
| **`cityTradeMultiplier()`** | ❌ | Grecy 2.3× handel przy dominującej religii — funkcja istnieje, **zero wywołań** |
| **Dyplomacja: wspólna/obca religia** | ❌ | `main.ts` ~12545: `wspolnaReligia: false`, `odmiennaReligia: false` **na sztywno** |
| **`religia_jednosc_bonus_produkcja`** | ❌ | Parametr w JSON, brak kodu |
| **`kultura_palac`, `kultura_swiatynia`…** | ❌ (osobne od budynków) | Plon kultury idzie z `buildings.json`, nie z tych wierszy society-params |
| **Presja kultury per hex** | ❌ | Opisana w poradniku §91 — **brak implementacji mapowej** |
| **Zwycięstwo kulturowe** | ❌ | `victory.ts`: tylko `dominacja` \| `nauka` \| `przegrana` |
| **Artysta (specjalista)** | ❌ | Parametr `kultura_specjalista_artysta` — brak jednostki/assign |
| **Panel miasta: kultura własna** | ⚠️ Bug UI | `cityPanel.ts` ~2023: `ownCultureShare: 1` **na sztywno** w podglądzie szczęścia |
| **Toast / event przy progu kultury** | ❌ | `granicaRozszerzona` liczone, **nie pokazywane graczowi** |

---

## 5. Dlaczego gracz tego nie czuje

### 5.1 Obietnica ≠ implementacja

Poradnik i `A1-Q12` mówią o **ekspansji granic miasta** i **presji na heksach**. W silniku progi 100/250/500 rosną licznik i **mgłę**, ale **nie dodają pól do pracy / terytorium** — główny powód „po co budować teatr/świątynię dla kultury?".

### 5.2 Liczby za małe vs inne dźwignie

- Bonus kultury/religii do szczęścia: **±1…±2 pkt** przy skali `szMax` epoki 1 = **14** → ~7–14% paska Sz.
- Ta sama Świątynia daje **+4 zadowolonych** z samego budynku — gracz buduje ją dla **Spichlerza/welfare**, nie dla religii.
- Akademia (+7 kultury) to późno, drogo, i konkuruje z **nauką** (+9 nauki).

### 5.3 Warunki rzadkie / wyłączone

- Kary za obcą kulturę/religię wymagają **mieszanego składu** — ale `ownCultureShare` nie spada, a po podboju religia często zostaje stara bez konwersji (brak `convertViaTemple`).
- Szerzenie +1 wierny/t to **kropla** przy populacji 5+.
- Bonus handlu Grecy/Rzym **nie działa**.
- Dyplomacja religijna **wyłączona**.

### 5.4 Brak celu końcowego

Bez **zwycięstwa kulturowego** ani mocnego bonusu imperium kultura to **statystyka HUD**, nie strategia.

### 5.5 Feedback

Brak komunikatów: „Granica miasta X +1 hex", „Obca wiara w Y", „Handel religijny aktywny". Console.log dla szerzenia religii — niewidoczne dla Macieja.

---

## 6. Propozycja wzmocnienia (mały scope, duży efekt odczuwalny)

> Zasada: **najpierw wpiąć istniejący kod**, potem stroić liczby w `society-params.json`. Bez nowego systemu hex-presji w v1.

### Paczka A — „Wpięcie kontraktu" (🟡 Integrator + B, ~1 batch)

| # | Zmiana | Effort | Efekt dla gracza |
|---|--------|--------|------------------|
| A1 | **`cityTerritoryRadius` += `cityBorderRadius(kultura)`** (albo osobny cap) | M | Więcej pól = więcej plonów — kultura ma sens |
| A2 | **`convertCulture()` co turę** w podbitych miastach (`ownCultureShare` < 1) | S | Kary/bonusy kultury realne po wojnie |
| A3 | **`convertViaTemple()`** gdy jest świątynia + obca religia | S | Świątynia = narzędzie integracji |
| A4 | **`cityTradeMultiplier()`** w `turn-economy` (gate: Waluta+Mennica) | S | Unikalność cywilizacji (Grecy!) |
| A5 | **Dyplomacja:** ustaw `wspolnaReligia` / `odmiennaReligia` z `civReligionForKey` | S | ±0.5 Zaufanie/t — widać w panelu dyplomacji |
| A6 | **Fix UI:** `cityPanel` czyta realny `ownCultureShare`; toast przy `granicaRozszerzona` | S | Feedback |

### Paczka B — „Strojenie bez nowych systemów" (🟢 po A)

| Obszar | Propozycja |
|--------|------------|
| **Progi zasięgu** | 100/250/500 → **60/150/300** (normal) albo +50% plonu kultury z budynków kategorii Kultura |
| **Szczęście** | Podwoić `kultura_zadowolenie_*` i `religia_zadowolenie_*` w society-params **albo** dodać linię „Kultura imperium" (+1 Sz na każde 50 skumulowanej kultury) |
| **Świątynia** | Rozdzielić: zadowolenie z budynku vs bonus **tylko gdy dominuje nasza wiara** (uniknąć dublowania) |
| **Teatr** | Odkryć w produkcji (usunąć `suppressed`) jako tańsza alternatywa przed Akademią |
| **Kręgi → Świątynia** | Quest/tutorial: pierwszy próg kultury = komunikat „Możesz poszerzyć granice" |

### Paczka C — opcjonalnie później (🔴 większy scope)

- Zwycięstwo kulturowe (np. X% światowej populacji + Y kultury imperium).
- Presja kultury per hex (jak w poradniku).
- Misjonarz / artysta jako specjalista.
- `religia_jednosc_bonus_produkcja` (>80% miast jedna wiara → +5% pracy).

### Powiązania z istniejącymi systemami

| System | Powiązanie |
|--------|------------|
| **Spichlerz / welfare (B5)** | Wysokie Sz z kultury → łatwiejszy wzrost ludności (growthMult T2) |
| **Porządek / bunt** | Obca religia już w `foreignReligionDominant` → po A2/A3 będzie częstsze |
| **Surowce / luksus** | Religia+handel → więcej ¤ na niskie podatki |
| **Dyplomacja** | Wspólna wiara + overlay zasięgu = decyzja „buduj świątynie na granicy" |
| **Power / dominacja** | Kultura w Power może dostać wagę — osobna decyzja |

---

## 7. Pytania ABC do Macieja (paczka 1/1 — 5 pytań)

---

### [TEMAT: Kultura i religia] **B-KULT-REL-Q1** — Ekspansja granic z kultury

**Sytuacja**  
Moduł `culture-religion.ts` liczy progi 100/250/500 pkt kultury w mieście i zwiększa `cityBorderRadius` (+0…+3). Dziś ten promień wpływa **tylko na zasięg mgły** (`citySightRadius`), **nie** na terytorium państwa (`territory.ts` używa wyłącznie populacji).

**Cel pytania**  
Ustalić, czy kultura ma realnie **dawać więcej pól do pracy** — główny powód budowania budynków kulturowych.

**Dlaczego teraz**  
Bez tego decyzja „kultura niewidoczna" nie da się naprawić samymi liczbami szczęścia.

**Opcje**

**A — Kultura poszerza terytorium (rekomendacja)**  
Promień terytorium miasta = baza z populacji **+ pierścienie z kultury** (z capem np. +3 hex).  
- **Za:** zgodne z poradnikiem i A1-Q12; natychmiastowy payoff ekonomiczny; kod `cityBorderRadius` już jest.  
- **Za:** nie wymaga presji per hex.  
- **Przeciw:** może zwiększyć overlap miast — trzeba testu balansu.  
- **Przeciw:** późne miasta z dużą populacją i tak mają duży zasięg.

**B — Kultura tylko mgła + szczęście (status quo + strojenie liczb)**  
Progi zostają kosmetyczne; wzmacniamy tylko bonusy do Sz/Porządku.  
- **Za:** najmniejszy diff techniczny.  
- **Za:** brak ryzyka „za dużo landu".  
- **Przeciw:** gracz nadal nie widzi powodu inwestować w kulturę.  
- **Przeciw:** rozjazd z dokumentacją gracza.

**C — Osobny mechanizm: kultura kupuje hex (jak w Civ)**  
Spend kultury imperium na claim jednego heksa.  
- **Za:** bardzo czytelne.  
- **Przeciw:** nowy UI + nowa pętla — **większy scope**.  
- **Przeciw:** duplikuje osadników/terytorium populacji.

**Rekomendacja:** **A**

---

### [TEMAT: Kultura i religia] **B-KULT-REL-Q2** — Podbój: co z religią miasta?

**Sytuacja**  
Po zdobyciu miasta `cityRelig` **zachowuje** stary skład wyznawców, ale `convertViaTemple()` **nie jest wywoływane** — obca wiara może dominować latami bez narzędzi gracza. Jednocześnie `religionHappiness` daje **−2 Sz** przy obcej dominacji.

**Cel pytania**  
Ustalić, jak szybko podbite miasto ma stać się „nasze" w sensie religii.

**Dlaczego teraz**  
To jedyny moment, gdy religia **powinna** być dramatyczna — dziś jest martwa.

**Opcje**

**A — Stopniowa konwersja (rekomendacja)**  
Wpiąć `convertViaTemple()` co turę (+ szybciej ze Świątynią); podbój **nie** zeruje od razu wiernych.  
- **Za:** kod gotowy + testy; decyzje „postaw świątynię w kolonii".  
- **Za:** spójne z poradnikiem §92.4.  
- **Przeciw:** wolniejsze stabilizowanie imperium.  
- **Przeciw:** wymaga komunikatu UI „Konwersja 12%/turę".

**B — Natychmiastowa zmiana religii przy podboju**  
`cityRelig` → 100% religia nowego właściciela.  
- **Za:** proste, zero niepokoju religijnego.  
- **Przeciw:** religia staje się **dekoracją** nazwy cywilizacji.  
- **Przeciw:** marnuje `spreadReligion` i świątynie graniczne.

**C — Hybryda: natychmiast tylko stolica, reszta konwersja**  
- **Za:** kompromis.  
- **Przeciw:** dwa reguły do wyjaśnienia graczowi.

**Rekomendacja:** **A**

---

### [TEMAT: Kultura i religia] **B-KULT-REL-Q3** — Bonus handlu cywilizacji (Grecy 2.3×)

**Sytuacja**  
W `civs.json` każda cywilizacja ma `mnoznikHandelPieniadz` (np. Grecy 2.3). Funkcja `cityTradeMultiplier()` ma to włączyć **tylko** gdy dominuje religia państwa **i** odblokowano Walutę+Mennicę — **funkcja nie jest nigdzie wywołana**.

**Cel pytania**  
Czy unikalność cywilizacji ma być odczuwalna przez **religię + handel**.

**Dlaczego teraz**  
Gotowy kontrakt z handoff `EKONOMIA-do-MASTER_religia-etap2.md`.

**Opcje**

**A — Wpiąć `cityTradeMultiplier` jak w spec (rekomendacja)**  
Gate tech + dominująca wiara → mnożnik na `pieniadz` miasta.  
- **Za:** 1 wywołanie w `turn-economy`; testy gotowe.  
- **Za:** Grecy/Rzym mają tożsamość mechaniczną.  
- **Przeciw:** może być mocne — strojenie w JSON.

**B — Uproszczony bonus: stały % cywilizacji bez religii w mieście**  
Np. Grecy zawsze +15% handlu po tech Waluta.  
- **Za:** prostsze do zrozumienia.  
- **Przeciw:** religia znowu boczna.  
- **Przeciw:** ignoruje gotowy moduł.

**C — Nie teraz — zostawić mnożnik wyłączony**  
- **Za:** zero ryzyka inflacji ¤.  
- **Przeciw:** kolejny rok martwego kodu.

**Rekomendacja:** **A** (z capem w playteście Mastera)

---

### [TEMAT: Kultura i religia] **B-KULT-REL-Q4** — Cel gry: zwycięstwo kulturowe?

**Sytuacja**  
Aktywne warunki zwycięstwa: **dominacja** (Power) i **nauka** (tech + rakieta). Kultura nie ma ścieżki wygranej mimo rozbudowanego systemu.

**Cel pytania**  
Czy dodać trzecią ścieżkę w horyzoncie v1.

**Dlaczego teraz**  
Bez celu kultura pozostaje „statystyką opcjonalną".

**Opcje**

**A — Tak, prosty próg v1 (rekomendacja na później)**  
Np. **5000 kultury imperium skumulowanej** + **≥70% miast z własną kulturą** → zwycięstwo kulturowe (alternatywa w kreatorze gry).  
- **Za:** daje strategię „kultura zamiast rakiety".  
- **Za:** wykorzystuje istniejące liczniki.  
- **Przeciw:** wymaga UI ekranu zwycięstwa + kreator — **🟡 scope**.  
- **Przeciw:** balans vs dominacja/nauka.

**B — Nie — tylko wzmocnić bonusy pośrednie (terytorium, Sz, handel)**  
- **Za:** mniejszy diff; wystarczy Paczka A.  
- **Przeciw:** brak „big win" dla gracza kulturowego.

**C — Kultura jako mnożnik Power (soft win)**  
Kultura imperium wliczana do Power — dominacja i tak ją nagradza.  
- **Za:** bez nowego ekranu końca.  
- **Przeciw:** gracz nie rozróżni „gram kulturą".

**Rekomendacja:** **B na teraz**, **A w kolejnej iteracji** po Paczce A

---

### [TEMAT: Kultura i religia] **B-KULT-REL-Q5** — Skala bonusów szczęścia

**Sytuacja**  
Bonus kultury/religii to **±1…±2 pkt** na skali Sz (~14–28 max w epoce). Świątynia jako budynek daje **+4** z samej kategorii budynku — religia „ginie".

**Cel pytania**  
Czy podbić wpływ **po** wpięciu mechanik (Paczka A), czy zostawić liczby.

**Dlaczego teraz**  
Strojenie przed wpięciem granic/konwersji może przesadzić lub niedosadzić.

**Opcje**

**A — Podwoić bonusy/kary w `society-params` + osobna linia w panelu Sz (rekomendacja po Paczce A)**  
Np. +4 / +2 / −2 / −4 dla progów kultury; religia ±3.  
- **Za:** widoczne w breakdown Porządku.  
- **Za:** tylko JSON + ewentualnie 1 linia UI.  
- **Przeciw:** ryzyko „za łatwe" Sz.

**B — Zostawić liczby; liczyć na terytorium i handel**  
- **Za:** mniej balansu.  
- **Przeciw:** panel Sz nadal pokazuje „Kultura +2" obok „Świątynia +4".

**C — Scalić: bonus religii tylko gdy **nie** ma już bonusu budynku świątynia**  
- **Za:** eliminuje dublowanie.  
- **Przeciw:** trudniejsze do komunikacji.

**Rekomendacja:** **A**, ale **dopiero po** B-KULT-REL-Q1=A i Q2=A

---

## 8. Proponowana kolejność wdrożenia (po ABC)

1. **Integrator F:** A1 + A6 (terytorium + toasty) — handoff 🟡  
2. **Grupa B:** A2 + A3 + fix `cityPanel` share — 🟡  
3. **Grupa B + D:** A4 + A5 (handel + dyplomacja) — 🟡  
4. **Balans:** Q5 strojenie JSON  
5. **Opcjonalnie:** Q4 zwycięstwo kulturowe, Teatr unsuppressed  

**Self-check lane po wdrożeniu:** `node tools/culture-religion-test.cjs` · typecheck · overlay kultura/religia w `gra-robocza` · co sprawdzić: podbój miasta obcej wiary, próg 100 kultury = +1 hex terytorium.

---

## 9. Załącznik — szybkie liczby referencyjne (normal)

| Parametr | Wartość |
|----------|---------|
| Progi zasięgu kultury | 100 / 250 / 500 |
| `cultureHappiness` max | +2 |
| `religionHappiness` max | +2 |
| Szerzenie religii | 1 miasto/t (+1 ze świątynią), zasięg 3 hex, +1 wierny |
| Konwersja religii (niewpięta) | 2%/t + 2%/t ze świątynią |
| Konwersja kultury (niewpięta) | 1%/t + bonusy budynków, cap 5%/t |
| Terytorium bazowe | max(5, pop), cap 15 hex |
| Zwycięstwa | dominacja, nauka — **bez kultury** |

---

*Koniec audytu · następny krok: decyzje ABC Macieja → dyspozycja lane B + Integrator.*
