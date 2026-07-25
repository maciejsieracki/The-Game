# DECYZJE ABC — pole `mnoznik` w budynkach (11 budynków)

**Data:** 2026-07-25. **Zadanie:** kontynuacja `R-MNOZNIK-BUDYNKI` — decyzja ABC dla każdego z 11 budynków z niezerowym `mnoznik`. Tryb: analityczny, zero zmian w `gra/src`/`gra/data`. Punkt wyjścia: `dyspozycje/SLEDZTWO-MNOZNIK-BUDYNKOW.md` (archiwalne śledztwo tej samej sesji) — poniższy dokument **potwierdza** większość jego ustaleń, ale dorzuca jedno **istotne uzupełnienie** (rozdz. 1), które zmienia ocenę ryzyka dla 4 z 11 budynków.

Budynki poza zakresem: Pałace (mnoznik już wyzerowany, `019f6a2`).

---

## 1. USTALENIE PONAD ARCHIWALNE ŚLEDZTWO: pole `mnoznik` NIE jest wszędzie martwe

Archiwalne śledztwo twierdziło „nigdy nie był zaimplementowany w silniku". To prawda dla **6 z 11** budynków, ale **fałsz dla 4 z 11** — dla nich `mnoznik` **działa dziś**, tyle że wpływa na **zupełnie inny plon niż deklaruje `uwagi`**.

Silnik (`gra/src/game/economy.ts:738-747`, funkcja `cityYieldPerTurn`, „Step 5"):

```ts
// --- Step 5: Sum non-combat mnoznik% and apply to combined Praca ---
let totalMnoznikProc = 0;
for (const { record, level } of cityBuildings) {
  const kat = record.kategoria;
  if (!kat.includes('Wojsko') && !kat.includes('Obrona')) {
    totalMnoznikProc += buildingValue(record, level, 'mnoznik');
  }
}
const mnoznikFactor = 1 + totalMnoznikProc / 100;
const pracaBruttoLacznie = (pracaBruttoTerenu + pracaBudynkow) * mnoznikFactor;
```

Ten kod **sumuje `mnoznik` KAŻDEGO budynku, którego `kategoria` NIE zawiera „Wojsko" ani „Obrona", i dolicza go jako % bonus do PRACY (labor)** miasta — niezależnie od tego, co budynek miał robić wg `uwagi`. Filtr kategorii to jedyna bariera; nie ma żadnej listy dozwolonych/wykluczonych ID budynków.

**Skutek dla naszych 11 budynków — który jest dziś realnie martwy, a który realnie działa (błędnie):**

| Budynek | `kategoria` | Zawiera Wojsko/Obrona? | Status DZIŚ |
|---|---|---|---|
| kuznia | Produkcja+Wojsko | tak | **martwy** (wykluczony) |
| kuznia_zelaza | Produkcja+Wojsko | tak | **martwy** (wykluczony) |
| **wielka_kuznia** | **Produkcja** | **nie** | **ŻYWY — dolicza się do Pracy** |
| koszary | Wojsko | tak | **martwy** (wykluczony) |
| akademia_wojskowa | Wojsko | tak | **martwy** (wykluczony) |
| warsztat_oblezniczy | Wojsko | tak | **martwy** (wykluczony) |
| **pretorium** | **Administracja** | **nie** | **ŻYWY — dolicza się do Pracy** |
| lazaret | Zdrowie+Wojsko | tak | **martwy** (wykluczony) |
| **karawanseraj** | **Pieniadz** | **nie** | **ŻYWY — dolicza się do Pracy** |
| targowisko | Pieniadz | nie | w puli, ale `baza.mnoznik=0` → **liczbowo 0** (nieaktywny w praktyce, ale JEDNA zmiana `baza` w JSON go aktywuje jako Praca-bonus, nie jako Handel) |
| **akademia** | **Nauka** | **nie** | **ŻYWY — dolicza się do Pracy** |

**Realna wielkość dzisiejszego (niezamierzonego) bonusu Pracy** — licząc rzeczywistą formułę skalowania poziomu silnika (rozdz. 2, **nie** liniowy `baza+przyrost`, tylko `baza × 1.10^(poziom-1)`):

| Budynek | Poziom 1 | Poziom 10 (maks) |
|---|---|---|
| Wielka Kuźnia | +23% Pracy | **+54,2% Pracy** |
| Akademia | +10% Pracy | +23,6% Pracy |
| Karawanseraj | +8% Pracy | +18,9% Pracy |
| Pretorium | +5% Pracy | +11,8% Pracy |

To znaczy: **rozbudowanie Wielkiej Kuźni do poziomu 10 dziś cicho podnosi Pracę miasta o +54%**, mimo że karta budynku, `uwagi` i cała dokumentacja mówią o „mnożniku wojska". To nie jest wina UI (chip „×N mnożnik" jest tylko kosmetyczny) — to realny, policzony w silniku efekt ekonomiczny, którego nikt świadomie nie zaprojektował na Pracę.

**Prawdopodobna przyczyna:** Wielka Kuźnia ma `kategoria: "Produkcja"` (bez „+Wojsko"), podczas gdy jej poprzednik w łańcuchu, Kuźnia żelaza, ma `"Produkcja+Wojsko"`. To wygląda na niespójność danych (Wielka Kuźnia to upgrade militarnej linii Kuźnia→Kuźnia żelaza→Wielka Kuźnia, powinna dziedziczyć „+Wojsko"), a nie świadomą decyzję.

**Konsekwencja dla decyzji ABC:** dla tych 4 budynków (Wielka Kuźnia, Pretorium, Karawanseraj, Akademia) opcja „usuń pole" (B) **NIE jest już neutralna kosmetycznie** — to realny nerf Pracy miasta, bo coś faktycznie usuwamy z rozgrywki, a nie tylko z UI. Odwrotnie: opcja „zaimplementuj zgodnie z `uwagi`" (A) oznacza **przekierowanie** istniejącego efektu z Pracy na właściwy plon (Handel/Nauka/Podatki), co też jest zmianą balansu, tylko w innym miejscu. **Status quo (C) tutaj oznacza dalsze utrzymywanie niezamierzonego bonusu Pracy** — to inny status quo niż dla pozostałych 6 budynków (które są faktycznie w 100% martwe).

---

## 2. Realna formuła skalowania poziomu (nie ta, którą pokazuje UI)

Karta budynku i `uwagi` sugerują liniowe skalowanie `baza + przyrost×(poziom−1)` (ten sam wzór co dla praca/pieniądz/etc.). **To NIE jest wzór faktycznie używany przez silnik.** Prawdziwa, jedyna formuła konsumowana w grze (`gra/src/game/economy.ts:424-444`, funkcja `buildingValue`):

```ts
// Compound scaling per spec/decyzja Naster: baza * 1.10^(level-1)
// The legacy `przyrost` field is no longer used for yield scaling.
export function buildingValue(b: BuildingRecord, level: number, key: BuildingYieldKey): number {
  return Math.floor(buildingEffectAtLevel(b.baza[key], level));
}
```

`buildingEffectAtLevel` (`gra/src/game/production.ts:209-211`) = `baza × BUILDING_LEVEL_FACTOR^(poziom-1)`, gdzie `BUILDING_LEVEL_FACTOR = 1.10` (`gra/data/miasto-params.json:7-10`, „Decyzja Naster = +10%/poziom"). **Pole `przyrost` jest martwe dla WSZYSTKICH ośmiu wymiarów** (praca/pieniądz/.../mnoznik), nie tylko dla mnoznika — potwierdzone brakiem JAKIEGOKOLWIEK odczytu `.przyrost[` w `gra/src/game/*.ts`. To dotyczy całego budynku, nie jest specyficzne dla tego zadania, ale **zmienia formułę, jaką trzeba by przyjąć dla mnoznika, gdyby go implementować** — patrz rozdz. 4.

**Wniosek:** jeśli wdrażamy mnoznik „zgodnie z konwencją silnika", właściwy wzór to `wartość(poziom) = baza × 1,10^(poziom−1)`, **nie** `baza + przyrost×(poziom−1)`. Kolumna `przyrost` w Excelu/UI/uwagach dla mnoznika (jak dla wszystkich innych pól) jest kosmetyczna i myląca niezależnie od decyzji o samym mnożniku — osobny, szerszy temat poza zakresem tego zadania, tylko odnotowany tutaj bo bezpośrednio wpływa na „konkretną formułę" wymaganą w zadaniu.

---

## 3. Tabela zbiorcza (skrót do szybkiego przeglądu)

| Budynek | Domniemana mechanika (`uwagi`) | Hak w silniku? | Dziś realnie | Koszt/ryzyko implementacji | Dotyka walki/ekonomii | Rekomendacja |
|---|---|---|---|---|---|---|
| **Kuźnia** | Siła jednostek produkowanych w mieście | Brak — jednostki nie mają referencji do miasta pochodzenia (`RuntimeUnit`, `gra/src/units/setup.ts:52-84`); `combatUnitFromDef` (`combat.ts:161-197`) liczy staty czysto z `units.json` | Martwy (kategoria zawiera „Wojsko") | Średnie-wysokie — nowe pole na jednostce + wybór „zamrożony czy żywy" bonus | WALKA | **C** |
| **Kuźnia żelaza** | j.w. + wymaga żelaza | j.w. | Martwy | j.w. | WALKA | **C** |
| **Wielka Kuźnia** | j.w. (suma Kuźni+Kuźni żelaza) | j.w. | **ŻYWY — dziś +23…54% Pracy niezamierzenie** (rozdz. 1) | j.w. + trzeba ZDECYDOWAĆ co z istniejącym bonusem Pracy | WALKA + EKONOMIA (już dziś!) | **C, ale z osobną notatką o istniejącym leaku** |
| **Koszary** | Siła + EXP jednostek szkolonych | Siła: brak (jw). EXP: **zero systemu w całej grze** — brak pola `xp`/rangi na jednostce, jedyny ślad to kosmetyczny string „Awans → Weteran" na ekranie końca bitwy (`battleScene.ts:8792`), bez żadnego licznika za nim | Martwy | Wysokie — trzeba zbudować CAŁY system EXP/weteranów od zera, ZANIM mnoznik cokolwiek przyspieszy | WALKA (+ nowa mechanika) | **C** |
| **Akademia wojskowa** | j.w. (wszystkie jednostki, elity) | j.w. | Martwy | j.w. | WALKA | **C** |
| **Warsztat oblężniczy** | **Brak jakiejkolwiek udokumentowanej intencji** | n/d | Martwy | Nieznany — nie da się kosztorysować bez ustalenia CO ma robić | WALKA (domniemanie) | **C (pytanie otwarte, nie kosztorys)** |
| **Pretorium** | Mnożnik % do przychodu podatkowego | **TAK — Wealth** (`gra/src/game/wealth.ts:104-107`, `wealthMnoznik`, już mnoży strumień podatku per miasto, poziomowo) — gotowy wzorzec, tylko sterowany dobrobytem (Luksus), nie Pretorium | **ŻYWY — dziś +5…12% Pracy niezamierzenie** | Niskie — dopisać osobny czynnik obok `wt.mnoznik` w `turn-economy.ts:1469-1470` | EKONOMIA | **A** |
| **Lazaret** | Regeneracja HP jednostek stacjonujących | **Brak — regeneracja HP NIE ISTNIEJE w całej grze** (żaden tick leczenia; jedyne `hp +=`/`-=` to obrażenia/atrycja/zastąp) | Martwy | Wysokie — trzeba zbudować CAŁY mechanizm regeneracji, budynek i tak poza cap epoki v0.1 (epokaWejscia=5) | WALKA (nowa mechanika) + budynek „zaparkowany" | **C** |
| **Karawanseraj** | Mnożnik % do handlu lądowego (szlaki) | **Częściowo TAK** — Karawanseraj już strukturalnie działa: daje +1 do limitu tras handlowych miasta (`trade-routes.ts:454-468`), co przekłada się na +5%/aktywną trasę Handlu (`economy.ts:714-719`) | **ŻYWY — dziś +8…19% Pracy niezamierzenie** + już ma inny, działający mechanizm (limit tras) | Średnie — ryzyko POTRÓJNEGO liczenia (limit tras + własny mnoznik% + dzisiejszy Praca-leak) | EKONOMIA | **A/C hybrydowo — patrz ABC** |
| **Targowisko** | Mnożnik % do przychodów z handlu (lokalnie) | **TAK, ale JUŻ DZIAŁA INACZEJ** — flat +50% Handlu przy samej obecności budynku (`economy.ts:703-706`, `budynekTargowiskoBonusHandlu`), + osobny flat „Praca→Pieniądz ×2" po odkryciu Waluty (`economy.ts:786-789`) — **żaden nie skaluje się z poziomem** | W puli Step5, ale `baza=0` → liczbowo 0 dziś | Średnie — implementacja „jak w `uwagi`" oznacza ZASTĄPIENIE istniejącego flat-bonusu poziomowym, nie dodanie nowego | EKONOMIA | **B/C — patrz ABC** |
| **Akademia** | Mnożnik globalnej puli nauki | **TAK — `civNaukaMult`** (`economy.ts:775-778`) już mnoży lokalną Naukę per miasto, ownerId-agnostycznie (civ-wide bonus), + Biblioteka ma analogiczny flat bonus (`economy.ts:772-774`) — gotowy wzorzec do skopiowania | **ŻYWY — dziś +10…24% Pracy niezamierzenie** | Niskie-średnie — dopisać czynnik analogiczny do `civNaukaMult` w tym samym miejscu | EKONOMIA | **A** |

---

## 4. Grupowanie mechanizmów + formuła proponowana (wariant „implementujemy")

### Grupa WOJSKO-SIŁA (Kuźnia, Kuźnia żelaza, Wielka Kuźnia)
**Brakujący element:** jednostka nie niesie żadnej informacji o mieście, w którym powstała. Trzeba: (1) dodać pole np. `originCombatBonusPct?: number` do `RuntimeUnit` (`gra/src/units/setup.ts`), wypełniane w momencie tworzenia jednostki (miejsce tworzenia: `main.ts` ok. linii 2043-2052) sumą `mnoznik` budynków kategorii Wojsko w tym mieście; (2) przekazać tę wartość do `combatUnitFromDef`/`resolveCombat` analogicznie do już istniejącego `civCombatStatMultipliers`/`applyMultiplier` (`gra/src/game/civ-bonuses.ts:206-223`, `base*(1+addFrac)`).
**Proponowana formuła:** `bonusPct(poziom) = baza × 1,10^(poziom−1)` (rozdz. 2); zastosowanie: `meleeAttack *= (1+bonusPct/100)` (**PLACEHOLDER do strojenia**: czy dotyczy tylko ataku, czy ataku+obrony+pancerza — patrz `R-STAWKI-STROJENIE`).
**Kluczowa decyzja projektowa (nie tylko liczbowa):** bonus **zamrożony w momencie stworzenia jednostki** (prostsze, tańsze) czy **żywy** (śledzi bieżący poziom Kuźni nawet po opuszczeniu miasta — dużo droższe, wymaga przeliczeń co turę). Rekomendacja: zamrożony.

### Grupa WOJSKO-SIŁA+EXP (Koszary, Akademia wojskowa)
Wymaga **najpierw** zbudowania od zera systemu EXP/weteranów (pole `xp`/ranga na `RuntimeUnit`, przyznawanie EXP po walce, tabela bonusów per ranga) — to osobny, duży epik, niezależny od samego pola `mnoznik`. Dopiero potem `mnoznik` mógłby np. dawać jednostkom start z niezerowym EXP: `expStart(poziom) = baza × 1,10^(poziom−1)` punktów (**PLACEHOLDER**: skala EXP, próg awansu na Weterana — dziś nie istnieją nawet jako liczby robocze).

### Warsztat oblężniczy
Brak `uwagi`, brak śladu w poradniku archiwalnym, brak jakiegokolwiek tropu. **To nie jest pytanie kosztorysowe, tylko pytanie o intencję** — nie da się zaproponować formuły, dopóki właściciel nie powie, co budynek miał robić.

### Podatki (Pretorium)
**Formuła:** dopisać czynnik `pretoriumMnoznik = 1 + buildingValue(pretorium,poziom,'mnoznik')/100` w `turn-economy.ts:1469-1470`, obok istniejącego `wt.mnoznik` (Wealth): `pieniadzPoWealth = Math.floor(yld.pieniadz * wt.mnoznik * pretoriumMnoznik)`. Mnożenie (nie dodawanie) z Wealth jest bezpieczne — to dwa koncepcyjnie różne źródła bonusu (dobrobyt społeczeństwa vs sprawność administracji), więc brak ryzyka podwójnego liczenia TEGO SAMEGO efektu. Poziom 1 = +5% skarbca miasta, poziom 10 ≈ +12% (**PLACEHOLDER do strojenia**).

### Nauka (Akademia)
**Formuła:** dopisać czynnik analogiczny do `civNaukaMult` w `economy.ts` obok linii 775-778: `akademiaMnoznik = 1 + buildingValue(akademia,poziom,'mnoznik')/100`, pomnożyć razem z `civNaukaMult` w jednym kroku (kolejność mnożenia skalarów nie wpływa na wynik — bezpieczne). Poziom 1 = +10% lokalnej Nauki, poziom 10 ≈ +24% (**PLACEHOLDER**).

### Handel-lokalny (Targowisko) — UWAGA na podwójne systemy
Targowisko ma DWA już działające, płaskie (nie poziomowe) mechanizmy: `budynekTargowiskoBonusHandlu` (+50% Handlu, samo posiadanie budynku) i `targowiskoPracaMnoznik` (Praca→Pieniądz ×2, po Walucie). Implementacja „mnoznik jak w `uwagi`" oznacza w praktyce **zastąpienie** flat +50% czymś poziomowym: `bonus(poziom) = buildingValue(targowisko,poziom,'mnoznik')/100` zamiast stałej z `econ-params.json`. Ponieważ dziś `baza.mnoznik=0`, trzeba by najpierw ustawić sensowną wartość startową (np. `baza=50` żeby poziom 1 odpowiadał dzisiejszemu stanowi) — **to migracja istniejącego mechanizmu, nie dodanie nowego obok niego**.

### Handel-szlaki (Karawanseraj) — UWAGA na potrójne liczenie
Karawanseraj już strukturalnie działa (+1 limit tras → +5%/aktywną trasę Handlu, skumulowane z Targowiskiem/Portem). Dodanie WŁASNEGO % z pola `mnoznik` OBOK tego byłoby trzecim, nakładającym się czynnikiem Handlu na tym samym budynku — dokładnie to, przed czym ostrzega komentarz w kodzie (`trade-routes.ts:29-31`, „NIE łączyć z Targowiskiem/civHandelMult, żeby uniknąć podwójnego liczenia"). Jeśli implementować, **rekomendacja: mnoznik zastępuje płaskie +5%/trasę wartością poziomową tej samej trasy**, a nie dokłada osobny mnożnik.

---

## 5. Pełne ABC — 11 budynków

### C-MNOZ-KUZNIA
**[TEMAT: Mnożnik siły jednostek — Kuźnia]**

**Sytuacja:** Kuźnia (`gra/data/buildings.json:91-128`, kategoria Produkcja+Wojsko, epoka Brąz) ma pole `mnoznik` z wartością bazową 5 (i „przyrost" 2, ale to pole jest martwe dla skalowania poziomu — patrz rozdz. 2). `uwagi` budynku brzmi dosłownie: „Mnoznik % dotyczy sily jednostek produkowanych w miescie". Dziś to pole nie robi NIC w grze poza kosmetycznym chipem „×5 mnożnik" w karcie budynku (`cityPanel.ts:4610-4612`) — jest wykluczone nawet z ubocznego mechanizmu opisanego w rozdz. 1, bo kategoria zawiera „Wojsko".

**Cel pytania:** Zdecydować, czy dopisać rzeczywisty bonus siły do jednostek produkowanych w mieście z Kuźnią, czy porzucić ten zamiar.

**Dlaczego teraz:** To pierwszy z trzech budynków tej samej linii (Kuźnia → Kuźnia żelaza → Wielka Kuźnia); decyzja tutaj determinuje podejście dla całej trójki i dla Koszar/Akademii wojskowej (ta sama rodzina mechaniki).

**A. Zaimplementować** — dodać pole „miasto pochodzenia" jednostce (nowe pole na `RuntimeUnit`), zsumować `mnoznik` budynków Wojska w tym mieście w momencie produkcji jednostki, zastosować jako `+bonusPct%` do ataku/obrony w walce (wzór `baza×1,10^(poziom−1)`, patrz rozdz. 4).
**Za:** przywraca zamierzony, spójny design linii Kuźni; karta budynku przestaje kłamać.
**Za:** to jedyny sposób, żeby budynki „Produkcja+Wojsko" faktycznie różniły się od czysto ekonomicznych budynków produkcji.
**Przeciw:** dotyka WALKI — ryzykowna zmiana balansu bez pełnej gwarancji testów (`combat-test.cjs` jest już dziś zepsuty, trudno zweryfikować regresję).
**Przeciw:** wymaga nowego pola na jednostce + decyzji „zamrożony czy żywy bonus" — nie jest to „kilka linii", tylko mała nowa podsystemowa funkcja.

**B. Usunąć pole** (wyzerować `baza`/`przyrost.mnoznik`, ukryć chip z UI).
**Za:** zero ryzyka regresji — pole i tak dziś nic nie robi.
**Za:** upraszcza kartę budynku do faktycznie działających 7 wymiarów, koniec z mylącym chipem.
**Przeciw:** rezygnuje trwale z zamierzonego bonusu wojskowego linii Kuźni.
**Przeciw:** trzeba by to zrobić spójnie dla całej grupy (Kuźnia+Kuźnia żelaza+Wielka Kuźnia+Koszary+Akademia wojskowa), inaczej powstanie niespójność „część budynków ma pole, część nie".

**C. Zostawić dane, oznaczyć chip jako „planowane"/ukryć z UI, rozstrzygnąć CAŁĄ grupę Wojsko-siła jedną decyzją później.**
**Za:** nie blokuje bieżącej pracy, nie wymusza decyzji o walce pod presją czasu.
**Za:** pozwala rozstrzygnąć 3 budynki (Kuźnia/Kuźnia żelaza/Wielka Kuźnia) jednym pytaniem zamiast trzech.
**Przeciw:** kontynuuje (złagodzone) mylące UI.
**Przeciw:** odkłada dług — Wielka Kuźnia w tej samej grupie ma DODATKOWY problem (dziś żywy Praca-leak, rozdz. 1), więc „poczekać" nie jest neutralne dla całej grupy.

**Rekomendacja: C** — razem z Kuźnią żelaza i Wielką Kuźnią, jako jedna decyzja „Wojsko-siła" (PACZKA 2, rozdz. 6). Nie warto rozstrzygać pojedynczego ogniwa łańcucha osobno.

---

### C-MNOZ-KUZNIA-ZELAZA
**[TEMAT: Mnożnik siły jednostek żelaznych — Kuźnia żelaza]**

**Sytuacja:** Kuźnia żelaza (`buildings.json:1053-1091`, kategoria Produkcja+Wojsko, epoka Żelazo, wymaga żelaza) ma `mnoznik` baza 8. `uwagi`: „Mnoznik % dotyczy sily jednostek zelaznych produkowanych w miescie; wymaga dostepu do zelaza". Dziś martwe z tego samego powodu co Kuźnia (kategoria zawiera „Wojsko" → wykluczone nawet z ubocznego Praca-leaku).

**Cel pytania:** Jak wyżej, w kontekście środkowego ogniwa łańcucha Kuźnia→Kuźnia żelaza→Wielka Kuźnia.

**Dlaczego teraz:** Ta sama mechanika co Kuźnia; różni się tylko warunkiem dostępu do surowca (żelazo) i wyższą bazą (8 vs 5).

**A. Zaimplementować** — identycznie jak dla Kuźni, tyle że bonus dotyczy specyficznie „jednostek żelaznych" (byłaby to jedyna militarna mechanika w grze filtrowana po TYPIE surowca jednostki, nie tylko po mieście pochodzenia — dodatkowa złożoność).
**Za:** spójne z Kuźnią, kontynuuje sens linii.
**Za:** daje realny powód budowania Kuźni żelaza zamiast tylko Kuźni (dziś różnica to tylko wyższe praca/pieniądz).
**Przeciw:** dotyka WALKI + dodaje filtr „czy jednostka jest żelazna" do logiki bonusu — więcej przypadków brzegowych niż zwykły bonus miejski.
**Przeciw:** to samo ryzyko regresji balansu co Kuźnia, bez możliwości pełnej weryfikacji przez zepsuty `combat-test.cjs`.

**B. Usunąć pole.**
**Za:** zero ryzyka regresji (dziś martwe).
**Za:** spójne uproszczenie razem z resztą grupy.
**Przeciw:** rezygnuje z zamierzonego bonusu.
**Przeciw:** j.w. — niespójność, jeśli robione osobno od reszty grupy.

**C. Zostawić, rozstrzygnąć razem z grupą Wojsko-siła.**
**Za/Przeciw:** identyczne jak dla Kuźni.

**Rekomendacja: C** — jedna decyzja z Kuźnią i Wielką Kuźnią.

---

### C-MNOZ-WIELKA-KUZNIA
**[TEMAT: Mnożnik siły jednostek — Wielka Kuźnia (UWAGA: dziś żywy Praca-leak)]**

**Sytuacja:** Wielka Kuźnia (`buildings.json:1093-1128`, kategoria **Produkcja** — bez „+Wojsko", w odróżnieniu od Kuźni żelaza), epoka Żelazo→Średniowiecze, upgrade Kuźni żelaza, wymaga stali. `mnoznik` baza 23 (najwyższa z całej grupy). `uwagi` dziś: „Upgrade Kuźnia żelaza → Wielka Kuźnia; suma bonusów w JSON" (pierwotny, zaginiony tekst mówił o „sile i koszcie produkcji wszystkich jednostek"). **Kluczowa różnica od pozostałych dwóch Kuźni: ponieważ kategoria NIE zawiera „Wojsko", pole `mnoznik` JEST dziś wciągane do generycznej puli Step5 (`economy.ts:738-747`) i dolicza się do Pracy miasta — poziom 1 = +23% Pracy, poziom 10 ≈ +54% Pracy, NIEZAMIERZENIE.** To prawdopodobnie niespójność danych (brakujące „+Wojsko" w kategorii), a nie świadoma decyzja.

**Cel pytania:** Zdecydować los mnożnika ORAZ naprawić (albo świadomie zaakceptować) dzisiejszy niezamierzony bonus Pracy.

**Dlaczego teraz:** To jedyny z 11 budynków, gdzie „nic nie robić" oznacza **utrzymanie żywego, niezaprojektowanego wpływu na balans ekonomii** — każda tura z rozbudowaną Wielką Kuźnią realnie zawyża produkcję miasta wbrew intencji.

**A. Zaimplementować zgodnie z `uwagi` (siła wojska) I jednocześnie poprawić `kategoria` na `Produkcja+Wojsko`** (usuwa Praca-leak, przenosi efekt na walkę.
**Za:** usuwa niezamierzony bonus ekonomiczny I realizuje zamierzony bonus wojskowy — jedna zmiana naprawia dwa problemy.
**Za:** przywraca spójność z resztą łańcucha (Kuźnia→Kuźnia żelaza→Wielka Kuźnia, wszystkie „Produkcja+Wojsko").
**Przeciw:** to NERF Pracy miasta (usuwa dziś działający +23…54% bonus) — gracze/AI, którzy dziś polegają na tym niezamierzonym efekcie, odczują regresję, mimo że „poprawną" w rozumieniu designu.
**Przeciw:** dotyka WALKI (nowy bonus) I EKONOMII (usunięcie starego) jednocześnie — podwójne ryzyko regresji w jednej zmianie.

**B. Tylko poprawić `kategoria` na `Produkcja+Wojsko` (usuwa Praca-leak), mnoznik zostaje wyzerowany/nieaktywny jak reszta grupy Wojsko-siła — bez implementacji bonusu wojskowego teraz.**
**Za:** natychmiast usuwa niezamierzony, niezaprojektowany wpływ na ekonomię — czysta poprawka błędu danych, zero ryzyka nowej mechaniki.
**Za:** spójne z resztą 5 budynków „martwych" w grupie Wojsko — jedna, spójna kategoria.
**Przeciw:** to i tak NERF Pracy (efekt dziś realny znika) — wymaga świadomej zgody właściciela na zmianę balansu, nawet bez nowej mechaniki wojskowej w zamian.
**Przeciw:** odracza realizację zamierzonego bonusu wojskowego (jak w opcji C dla reszty grupy).

**C. Zostawić jak jest — świadomie zaakceptować dzisiejszy Praca-leak jako *de facto* balans (traktować jako „niezamierzony, ale już wliczony w playtesty" bonus), rozstrzygnąć docelowy sens razem z resztą grupy Wojsko-siła później.**
**Za:** zero natychmiastowej zmiany balansu — jeśli dotychczasowe playtesty już „przyzwyczaiły się" do tego bonusu Pracy, usunięcie go bez ostrzeżenia mogłoby zaskoczyć.
**Za:** nie wymusza decyzji pod presją — można to rozstrzygnąć spokojnie razem z Kuźnią/Kuźnią żelaza.
**Przeciw:** świadomie utrzymuje udokumentowany bug (kategoria niespójna z resztą łańcucha, efekt niezgodny z `uwagi`).
**Przeciw:** im dłużej to trwa, tym trudniej będzie odróżnić „zamierzony balans" od „przypadkowy bug", jeśli ktoś zacznie balansować wokół tego +54%.

**Rekomendacja: B** — to jedyny budynek z tej trójki, gdzie *nic nie robić* ma realny koszt (aktywny bug ekonomiczny). Naprawa kategorii to czysty, tani fix niezależny od dalszej decyzji o mechanice wojskowej. Wdrożenie A można zostawić do wspólnej decyzji grupy Wojsko-siła później.

---

### C-MNOZ-KOSZARY
**[TEMAT: Mnożnik siły i EXP jednostek — Koszary]**

**Sytuacja:** Koszary (`buildings.json:813-851`, kategoria Wojsko, epoka Brąz) mają `mnoznik` baza 5. `uwagi`: „Mnoznik % dotyczy sily i exp jednostek szkolonych w miescie". Dziś martwe (kategoria zawiera „Wojsko", wykluczone z Step5). **Krytyczne: w całej grze NIE ISTNIEJE żaden system EXP/weteranów** — brak pola na jednostce, brak przyznawania punktów, jedyny ślad to kosmetyczny napis „Awans → Weteran" na ekranie końca bitwy (`battleScene.ts:8792`), bez żadnego licznika za nim.

**Cel pytania:** Zdecydować, czy budować system EXP od zera (żeby połowa tego bonusu — „exp" — miała się do czego przyczepić), czy ograniczyć zamiar do samej siły (jak Kuźnia), czy porzucić w całości.

**Dlaczego teraz:** To budynek z NAJWIĘKSZYM rozjazdem między deklarowaną intencją a stanem silnika spośród całej grupy Wojsko — połowa opisanej mechaniki (EXP) wymaga nowego systemu, nie tylko nowego hooka.

**A. Zaimplementować w pełni** — zbudować system EXP/weteranów (pole `xp`/ranga na jednostce, przyznawanie po walce, tabela bonusów per ranga) JAKO OSOBNY epik, a potem dopiąć Koszary jako „przyspieszacz" tego systemu (start z bonusowym EXP i/lub bonus siły jak Kuźnia).
**Za:** realizuje pełną, oryginalną intencję — najbardziej „kompletne" rozwiązanie.
**Za:** system EXP/weteranów sam w sobie byłby wartościową mechaniką 4X niezależnie od Koszar (typowy element gatunku, którego dziś brakuje).
**Przeciw:** to NIE jest implementacja pola `mnoznik` — to osobny, duży epik (nowy stan na jednostce, UI do pokazywania rangi, balans progów awansu), z mnożnikiem jako drobny dodatek na końcu.
**Przeciw:** dotyka WALKI i wymaga nowej mechaniki ocenianej osobno od tego zadania — wysoki koszt/ryzyko nieproporcjonalny do „naprawy jednego pola w JSON".

**B. Usunąć pole (i zdjąć „exp" z `uwagi`, zostawić samą wzmiankę potencjalnego bonusu siły do rozstrzygnięcia razem z grupą Wojsko-siła).**
**Za:** zero ryzyka regresji, koniec z obiecywaniem mechaniki (EXP), która nie istnieje i nie jest planowana w tej turze.
**Za:** jeśli system EXP i tak nie wchodzi w grę w najbliższym czasie, trzymanie martwego pola tylko myli.
**Przeciw:** porzuca ideę systemu EXP na stałe (nawet jako przyszły epik) bez osobnej dyskusji o jego wartości dla gry.
**Przeciw:** rozdziela Koszary/Akademię wojskową od reszty (być może nadal chcianej) grupy Wojsko-siła.

**C. Zostawić dane, rozstrzygnąć razem z Akademią wojskową jako jedna decyzja „Wojsko-siła+EXP", osobna od czystego „Wojsko-siła" (Kuźnie) — bo koszt jest inny (nowy system, nie tylko hook).**
**Za:** oddziela dwie różne skale kosztu (Kuźnie = hook; Koszary/Akademia = nowy system) zamiast traktować je jako jedną grupę.
**Za:** nie wymusza decyzji o całym systemie EXP pod presją tego zadania.
**Przeciw:** nadal odkłada dług — karta budynku dalej obiecuje EXP, którego nie ma.
**Przeciw:** jeśli system EXP nigdy nie powstanie, ta decyzja i tak kiedyś wróci do B.

**Rekomendacja: C** — to zbyt duża decyzja (cały system EXP), żeby rozstrzygać ją przy okazji porządkowania jednego pola JSON. Osobna grupa/pytanie od czystego „Wojsko-siła".

---

### C-MNOZ-AKADEMIA-WOJSKOWA
**[TEMAT: Mnożnik siły i EXP wszystkich jednostek — Akademia wojskowa]**

**Sytuacja:** Akademia wojskowa (`buildings.json:1476-1514`, kategoria Wojsko, epoka Żelazo, upgrade Koszar, „bramka elit UNITS") ma `mnoznik` baza 20 — najwyższą wartość spośród budynków Wojska. `uwagi` dziś: „Upgrade Koszary → Akademia wojskowa; suma bonusów w JSON; bramka elit UNITS" (pierwotny zaginiony tekst mówił o „sile i exp WSZYSTKICH jednostek szkolonych w mieście", nie tylko nowo produkowanych). Dziś martwe (kategoria Wojsko, wykluczone z Step5).

**Cel pytania:** Ten sam problem co Koszary (brak systemu EXP), plus dodatkowa niejasność: „wszystkich jednostek" (istniejących) vs „produkowanych" (nowych) — inny zakres niż Kuźnia/Koszary.

**Dlaczego teraz:** Najdroższy budynek tej grupy (baza 20 = 4× Kuźni) — jeśli grupa Wojsko-siła+EXP zostanie zaimplementowana, ten budynek ma z natury największy wpływ na balans.

**A. Zaimplementować w pełni, razem z Koszarami, jako „przyspieszacz" nowego systemu EXP + bonus siły dla WSZYSTKICH jednostek stacjonujących w mieście (nie tylko nowo produkowanych) — czyli żywy, nie zamrożony bonus.**
**Za:** realizuje najbogatszą wersję pierwotnej intencji („wszystkich jednostek", nie tylko nowych).
**Za:** daje jasny, silny powód do budowania Akademii wojskowej ponad Koszary (dziś różnica to tylko wyższe praca/pieniądz + „brama do elit", cokolwiek to znaczy dziś w danych).
**Przeciw:** „żywy bonus dla wszystkich jednostek w mieście" (nie tylko nowo tworzonych) to jeszcze droższa wersja niż zamrożony bonus Kuźni — wymaga przeliczania stacjonujących jednostek co turę, nie tylko w momencie tworzenia.
**Przeciw:** dotyka WALKI + wymaga systemu EXP (jak Koszary) — najwyższy koszt/ryzyko ze wszystkich 11 budynków.

**B. Usunąć pole.**
**Za:** zero ryzyka, koniec z obiecywaniem nieistniejącej mechaniki.
**Za:** spójne z resztą grupy, jeśli decyzja o Koszarach to też B.
**Przeciw:** porzuca sens najdroższego upgrade'u linii Koszar — dziś i po B różnica Koszary→Akademia wojskowa to tylko liczby praca/pieniądz, żadnej jakościowej zmiany.
**Przeciw:** j.w., decyzja o całym systemie EXP nie powinna zapadać tu niejako „przy okazji".

**C. Zostawić dane, rozstrzygnąć JEDNĄ decyzją razem z Koszarami (grupa Wojsko-siła+EXP).**
**Za/Przeciw:** jak w C-MNOZ-KOSZARY.

**Rekomendacja: C** — nierozerwalnie związane z decyzją o Koszarach; jedno pytanie dla obu.

---

### C-MNOZ-WARSZTAT-OBLEZNICZY
**[TEMAT: Mnożnik bez udokumentowanej intencji — Warsztat oblężniczy]**

**Sytuacja:** Warsztat oblężniczy (`buildings.json:1171-1209`, kategoria Wojsko, epoka Żelazo, wymaga Koszar/Akademii wojskowej) ma `mnoznik` baza 10 (+3/poziom w danych, martwe dla skalowania — rozdz. 2). `uwagi` dzisiejsze: „Odblokowuje budowę Katapulty w mieście (maWarsztatOblezniczy). Taran i Wieża = in-siege przy oblężeniu — styk UNITS" — **ani słowa o mnożniku**. Ani archiwalne śledztwo, ani zamrożona migawka dokumentacji z 2026-07-03 nie zawierają żadnego śladu intencji dla tego konkretnego pola. To jedyny z 11 budynków, dla którego nie da się nawet zgadywać na podstawie tekstu — tylko na podstawie analogii do reszty kategorii Wojsko.

**Cel pytania:** Ustalić, czy właściciel PAMIĘTA/CHCE nadać temu polu sens (i jaki), zanim jakikolwiek koszt implementacji da się oszacować.

**Dlaczego teraz:** To jedyne pytanie w całym zestawie, które NIE jest pytaniem „czy wdrożyć znaną mechanikę", tylko „czym ta mechanika w ogóle miała być" — musi paść przed jakąkolwiek analizą kosztu.

**A. Przyjąć hipotezę „ten sam wzorzec co reszta Wojska" (siła jednostek oblężniczych: Katapulta/Taran/Wieża) i traktować razem z grupą Wojsko-siła.**
**Za:** spójne z resztą kategorii Wojsko — Warsztat oblężniczy przestaje być wyjątkiem bez logiki.
**Za:** nie wymaga wymyślania nowej, odrębnej mechaniki — korzysta z tego samego hooka co Kuźnia/Koszary, jeśli ten kiedyś powstanie.
**Przeciw:** to CZYSTE zgadywanie — nie ma żadnego dowodu (uwagi, dokumentacja, historia gita), że o to chodziło; ryzyko wymyślenia funkcji, której nikt nigdy nie chciał.
**Przeciw:** jednostki oblężnicze (Katapulta/Taran/Wieża) mają już własną, specyficzną mechanikę „in-siege" (styk UNITS, poza zakresem) — dorzucanie do tego jeszcze mnożnika siły komplikuje osobny, już złożony temat.

**B. Usunąć pole — brak dowodu na intencję, więc brak podstaw do utrzymywania danych.**
**Za:** najprostsze rozwiązanie zgodne z zasadą „nie twórz problemów, których nie ma" — skoro nie wiadomo co to miało robić, nie ma czego bronić.
**Za:** zero ryzyka (pole i tak dziś martwe, jak cała reszta kategorii Wojsko).
**Przeciw:** jeśli właściciel jednak PAMIĘTA intencję (a po prostu nie została spisana), usunięcie danych ją bezpowrotnie kasuje.
**Przeciw:** wartość akurat niezerowa i konkretna (10/+3) — mogła zostać wpisana świadomie, tylko z zapomnianym opisem, tak jak stało się z Wielką Kuźnią/Akademią (rozdz. B śledztwa archiwalnego).

**C. Zapytać wprost właściciela „co to miało robić", zanim zdecydujemy A czy B.**
**Za:** jedyna opcja, która nie zgaduje ani nie kasuje bezpowrotnie niepewnych danych.
**Za:** zgodne z zasadą #7 CLAUDE.md („przy niejednoznaczności pytaj, nie zgaduj").
**Przeciw:** nie daje natychmiastowego rozstrzygnięcia — zostaje jeszcze jedno pytanie w kolejce.
**Przeciw:** właściciel może po prostu nie pamiętać (dane sprzed importu do gita) — pytanie może wrócić bez odpowiedzi i tak wylądować na B.

**Rekomendacja: C** — to jedyny budynek w zestawie, gdzie zgadywanie (A) byłoby dosłownie wymyślaniem mechaniki od zera bez żadnego oparcia w danych; zanim licytujemy koszt, trzeba wiedzieć, co licytujemy.

---

### C-MNOZ-PRETORIUM
**[TEMAT: Mnożnik do przychodu podatkowego — Pretorium]**

**Sytuacja:** Pretorium (`buildings.json:1327-1363`, kategoria Administracja, epoka Żelazo) ma `mnoznik` baza 5. `uwagi`: „Centrum administracji prowincji; bonus do utrzymania porzadku (garnizon); mnoznik % do przychodu podatkowego". **Dziś to pole JEST żywe, ale w złym miejscu**: bo kategoria „Administracja" nie zawiera „Wojsko"/"Obrona", `mnoznik` wpada do generycznej puli Step5 (`economy.ts:738-747`) i dolicza się do PRACY miasta — poziom 1 = +5% Pracy, poziom 10 ≈ +12% Pracy — **zamiast do podatków, jak deklaruje `uwagi`**. Silnik ma już gotowy, działający mechanizm mnożnika podatkowego per miasto: system **Wealth** (`gra/src/game/wealth.ts:104-107`, `wealthMnoznik(poziom,p) = max(1, 1+(poziom-1)×k)`), konsumowany w `turn-economy.ts:1469-1470` (`pieniadzPoWealth = Math.floor(yld.pieniadz * wt.mnoznik)`) — dziś sterowany dobrobytem społeczeństwa (Luksus), nie przez Pretorium.

**Cel pytania:** Przekierować już istniejący, żywy bonus z Pracy na podatki (Skarbiec), zgodnie z pierwotną intencją, korzystając z gotowego haka Wealth.

**Dlaczego teraz:** To jeden z najtańszych budynków do naprawy w całym zestawie — hak (Wealth) już istnieje, ryzyko dotyczy WYŁĄCZNIE ekonomii (nie walki), a status quo oznacza kontynuowanie niezamierzonego wpływu na Pracę.

**A. Zaimplementować zgodnie z `uwagi`** — dopisać osobny czynnik `pretoriumMnoznik = 1 + buildingValue(pretorium,poziom,'mnoznik')/100` w `turn-economy.ts:1469-1470`, mnożony razem z `wt.mnoznik` (Wealth): `pieniadzPoWealth = yld.pieniadz × wt.mnoznik × pretoriumMnoznik`. Formuła: poziom 1 = +5% Skarbca miasta, poziom 10 ≈ +12% (**PLACEHOLDER do strojenia**). Jednocześnie usunąć Pretorium z puli Step5 (albo dodać wyjątek, albo — prościej — dodać „Administracja" do filtra wykluczeń obok „Wojsko"/„Obrona").
**Za:** naprawia ISTNIEJĄCY bug (Praca-leak) I realizuje zamierzoną mechanikę jednym posunięciem, korzystając z gotowego wzorca (Wealth) — najniższy koszt implementacyjny z całego zestawu.
**Za:** dotyka WYŁĄCZNIE ekonomii, nie walki — brak ryzyka dla `combat-test.cjs`/balansu wojska.
**Przeciw:** to i tak zmiana balansu — miasta z Pretorium tracą dzisiejszy (przypadkowy) bonus Pracy i zyskują bonus Skarbca zamiast; efekt netto na wynik gracza zależy od tego, co ceni bardziej (Praca vs złoto).
**Przeciw:** mnożenie z Wealth (zamiast dodawania) oznacza, że efekt Pretorium rośnie wykładniczo z dobrobytem miasta — wymaga przemyślenia, czy to pożądane sprzężenie, czy Pretorium powinno działać niezależnie od Wealth.

**B. Usunąć pole (i tym samym usunąć dzisiejszy Praca-leak, bez dawania niczego w zamian).**
**Za:** najprostsze — jedna zmiana (wyzerowanie) usuwa zarówno mylące dane, jak i przypadkowy efekt ekonomiczny.
**Za:** zero ryzyka nowej mechaniki (Wealth zostaje nietknięty).
**Przeciw:** to czysty NERF Pracy miast z Pretorium bez zamiennika — psuje balans w drugą stronę bez realizacji zamierzonego bonusu podatkowego.
**Przeciw:** marnuje gotowy, tani hak (Wealth), który akurat idealnie pasuje do tego budynku.

**C. Zostawić jak jest (żywy Praca-leak trwa), rozstrzygnąć później razem z resztą ekonomicznych budynków.**
**Za:** zero natychmiastowej zmiany — jeśli dotychczasowe playtesty już wliczają ten bonus Pracy, nic się nie psuje teraz.
**Za:** nie wymusza decyzji pod presją.
**Przeciw:** świadomie kontynuuje udokumentowany bug (efekt niezgodny z `uwagi`, budynek administracyjny podbija Pracę zamiast podatków).
**Przeciw:** to najtańsza naprawa w całym zestawie — odkładanie jej nie ma dobrego uzasadnienia kosztowego.

**Rekomendacja: A** — najniższe ryzyko/koszt z całego zestawu, gotowy hak (Wealth), dotyka wyłącznie ekonomii, i naprawia aktywny bug przy okazji.

---

### C-MNOZ-LAZARET
**[TEMAT: Mnożnik tempa regeneracji HP — Lazaret]**

**Sytuacja:** Lazaret (`buildings.json:1441-1474`, kategoria Zdrowie+Wojsko, epoka wpisana jako 5 w polu `epokaWejscia`, choć `uwagi` mówi o epoce 4 — drobna niespójność danych, poza zakresem tego zadania) ma `mnoznik` baza 5. `uwagi`: „Regeneracja HP jednostek stacjonujacych w miescie; mnoznik % do tempa regeneracji - styk UNITS. PARKOWANIE: budynek epoki Sredniowiecze; poza cap v0.1 (max epoka=3=Zelazo) -- nie usuwamy, aktywuje sie w pozniejszej epoce." Dziś martwe (kategoria zawiera „Wojsko", wykluczone z Step5) — i to jedyny budynek z tej grupy, gdzie autorzy danych SAMI zaznaczyli w `uwagi`, że to świadomie odłożone na później.

**Cel pytania:** Potwierdzić, że Lazaret pozostaje odłożony razem z resztą epoki Średniowiecze, i że mnożnik nie wymaga osobnej decyzji teraz.

**Dlaczego teraz:** To najmniej pilny budynek z całego zestawu — sam budynek jest poza aktualnym zakresem gry (cap epoki v0.1 = Żelazo), więc jego mnożnik nie może dziś wpływać na rozgrywkę niezależnie od decyzji.

**A. Zaimplementować od razu, razem z całym mechanizmem regeneracji HP** — dziś **regeneracja HP jednostek stacjonujących NIE ISTNIEJE w całej grze** (żaden tick leczenia; wszystkie istniejące `hp +=`/`-=` to obrażenia głodowe, atrycja oblężenia, albo przeliczenie przy „Zastąp jednostkę" — żadne z nich to nie leczenie w garnizonie). Trzeba by zbudować: (1) bazowy tick regeneracji (np. +10% max HP/turę dla jednostek w garnizonie, **PLACEHOLDER**), (2) dopiero potem mnożnik Lazaretu na tempo tego ticku.
**Za:** realizuje kompletną, wcześniej zaplanowaną mechanikę zdrowia wojsk — przydatną niezależnie od Lazaretu.
**Za:** `RuntimeUnit.inGarnizon` (`setup.ts`) już istnieje, więc „kto się kwalifikuje do regeneracji" jest łatwe do ustalenia.
**Przeciw:** to nowy, w pełni greenfieldowy system (nie ma NIC do rozbudowania) na budynku, który i tak jest poza zasięgiem gry w obecnej epoce — praca „na zapas" bez natychmiastowej wartości dla gracza.
**Przeciw:** dotyka WALKI (żywotność jednostek w oblężeniach/starciach) — wymaga przemyślenia interakcji z istniejącą atrycją głodową/oblężniczą, żeby oba mechanizmy się nie „przeciągały".

**B. Usunąć pole.**
**Za:** zero ryzyka — Lazaret i tak nie wchodzi do gry w obecnym capie epoki.
**Za:** upraszcza dane budynku, który i tak czeka na własną epokę.
**Przeciw:** kasuje dobrze udokumentowaną, spójną intencję (jedyny budynek w zestawie, gdzie autorzy SAMI napisali „nie usuwamy, aktywuje się później") — usunięcie kłóciłoby się z tą własną wcześniejszą decyzją.
**Przeciw:** żadnej korzyści teraz — budynek i tak jest poza zasięgiem, więc usunięcie pola nic nie przyspiesza ani nie upraszcza w bieżącej rozgrywce.

**C. Zostawić bez zmian, razem z całym budynkiem, do czasu aż epoka Średniowiecze wejdzie do zakresu gry.**
**Za:** zgodne z jawną, już podjętą decyzją zapisaną we własnych `uwagi` budynku — nie trzeba nic decydować teraz.
**Za:** brak jakiegokolwiek ryzyka — Lazaret nie wpływa na dzisiejszą rozgrywkę niezależnie od tej decyzji.
**Przeciw:** dług (brak systemu regeneracji HP) zostaje nienazwany aż do momentu, gdy epoka Średniowiecze wejdzie do zakresu — wtedy trzeba będzie zrobić i regenerację, i mnożnik naraz.
**Przeciw:** jeśli kiedyś ktoś zdecyduje się na system regeneracji HP niezależnie od epok (np. dla epoki Żelaza też), Lazaret i jego mnożnik i tak będą czekać osobno.

**Rekomendacja: C** — budynek sam siebie już „zaparkował" w danych; nie ma powodu rozstrzygać czegokolwiek teraz, poza potwierdzeniem że to podejście się utrzymuje.

---

### C-MNOZ-KARAWANSERAJ
**[TEMAT: Mnożnik handlu lądowego — Karawanseraj (UWAGA: dziś żywy Praca-leak + już ma inny działający mechanizm)]**

**Sytuacja:** Karawanseraj (`buildings.json:336-370`, kategoria Pieniadz, epoka Brąz) ma `mnoznik` baza 8. `uwagi`: „Mnoznik % dotyczy handlu ladowego (szlaki miedzy miastami)". **Dwie rzeczy dzieją się już dziś, żadna zgodnie z `uwagi` dosłownie:** (1) kategoria „Pieniadz" nie zawiera Wojsko/Obrona, więc `mnoznik` wpada w pulę Step5 i dolicza się do PRACY — poziom 1 = +8%, poziom 10 ≈ +19% (rozdz. 1); (2) Karawanseraj JEST już wpisany do `TRADE_BUILDING_IDS` (`trade-routes.ts:454-456`) — samo jego posiadanie daje +1 do limitu tras handlowych miasta, co przekłada się na +5% Handlu ZA KAŻDĄ aktywną trasę (`economy.ts:714-719`, kumulatywnie z Targowiskiem/Portem). To drugie DZIAŁA zgodnie z duchem `uwagi` („handel lądowy, szlaki między miastami"), ale nie skaluje się z poziomem budynku — to efekt binarny (masz/nie masz), nie procentowy.

**Cel pytania:** Zdecydować, czy pole `mnoznik` ma dołożyć TRZECI czynnik handlu (ryzyko potrójnego liczenia), zastąpić istniejący system tras wartością poziomową, czy zostać usunięte skoro budynek i tak ma już działającą rolę.

**Dlaczego teraz:** Karawanseraj jest jedynym budynkiem w całym zestawie, który ma JUŻ DZIAŁAJĄCĄ, zamierzoną (choć inną niż `mnoznik`) mechanikę handlową — więc „nic nie robić z mnoznikiem" nie oznacza, że budynek jest bezużyteczny, tylko że jego prawdziwa rola żyje gdzie indziej w kodzie.

**A. Zaimplementować mnoznik jako ZAMIENNIK dzisiejszego płaskiego +5%/trasę** — poziom Karawanseraju decyduje o sile KAŻDEJ trasy dotykającej miasto (`bonusPct(poziom) = buildingValue(karawanseraj,poziom,'mnoznik')/100` zamiast stałych 5%), jednocześnie usuwając go z puli Step5 (dodać „Pieniadz"+ID budynku do wykluczeń, albo osobny wyjątek).
**Za:** naprawia Praca-leak I nadaje sens rosnącym poziomom Karawanseraju (dziś poziom budynku wpływa TYLKO na praca/pieniądz bazowe, nie na siłę tras) — realna wartość rozbudowy.
**Za:** unika POTRÓJNEGO liczenia (limit tras + osobny mnożnik + Praca-leak) przez zastąpienie, nie dodanie.
**Przeciw:** to zmiana istniejącej, działającej mechaniki E3 (tras handlowych) — dotyka kodu współdzielonego z Targowiskiem/Portem, większe ryzyko efektów ubocznych niż punktowa poprawka jednego budynku.
**Przeciw:** wymaga przeliczenia balansu tras handlowych całościowo (dziś płaskie +5%/trasa jest łatwe do przewidzenia dla gracza; poziomowe zależne od Karawanseraju danego miasta jest mniej przejrzyste w UI).

**B. Usunąć pole `mnoznik`, zostawić Karawanseraj z jego DZISIEJSZĄ, realną rolą (limit tras handlowych) bez zmian — to wystarczająca, działająca mechanika handlowa.**
**Za:** natychmiast usuwa Praca-leak, zero ryzyka nowej mechaniki, Karawanseraj i tak ma sensowną, działającą rolę (limit tras).
**Za:** unika ryzyka potrójnego liczenia raz na zawsze — prostsze rozwiązanie zgodne z zasadą „najprostsze wygrywa".
**Przeciw:** to NERF Pracy miast z Karawanserajem (usuwa dzisiejszy przypadkowy +8…19% bonus) bez zamiennika.
**Przeciw:** poziomy Karawanseraju powyżej 1 nadal nie dają NIC poza praca/pieniądz bazowym (limit tras to efekt binarny za samo posiadanie, nie za poziom) — rozbudowa budynku pozostaje mało atrakcyjna.

**C. Zostawić jak jest (Praca-leak trwa), rozstrzygnąć razem z Targowiskiem jako grupa „Handel" — bo obie decyzje są ze sobą powiązane (ten sam system tras E3, ten sam ryzyko podwójnego liczenia).**
**Za:** pozwala rozpatrzyć Targowisko i Karawanseraj razem — spójna decyzja o całym systemie Handlu zamiast łatania budynek-po-budynku.
**Za:** nie wymusza decyzji pod presją dla akurat tego budynku.
**Przeciw:** kontynuuje żywy Praca-leak (mniejszy koszt odłożenia niż Wielka Kuźnia, ale wciąż realny +8…19%).
**Przeciw:** odkłada naprawę taniego, dobrze zrozumianego problemu.

**Rekomendacja: B** — Karawanseraj już ma sensowną, żywą rolę (limit tras); dokładanie kolejnego, poziomowego mnożnika ryzykuje właśnie to potrójne liczenie, przed którym ostrzega komentarz w samym kodzie. Usunięcie pola to najczystsze rozwiązanie, o ile właściciel nie chce inwestować w przebudowę systemu tras (opcja A).

---

### C-MNOZ-TARGOWISKO
**[TEMAT: Mnożnik przychodów z handlu — Targowisko (UWAGA: koliduje z DWOMA już działającymi mechanizmami)]**

**Sytuacja:** Targowisko (`buildings.json:209-251`, kategoria Pieniadz, epoka Kamień) ma `mnoznik` baza **0** (jedyny budynek w zestawie z bazą 0 na poziomie 1; +3/poziom w danych, ale to pole martwe dla skalowania — rozdz. 2). `uwagi`: „Mnoznik % dotyczy przychodow z handlu w miescie". Targowisko JUŻ ma DWA w pełni działające, ale PŁASKIE (nie poziomowe) mechanizmy handlowe: (1) +50% do Handlu miasta za samo posiadanie budynku (`economy.ts:703-706`, `budynekTargowiskoBonusHandlu`, wartość z `econ-params.json` różna per trudność: 0,62/0,50/0,38); (2) konwersja nadwyżki Pracy na Pieniądz ×2 po odkryciu technologii Waluta (`economy.ts:786-789`, `targowiskoPracaMnoznik`). Żaden z nich nie rośnie z poziomem budynku — Targowisko poziom 10 daje dokładnie ten sam % bonus co poziom 1, różni się tylko bazowym praca/pieniądz.

**Cel pytania:** Zdecydować, czy pole `mnoznik` ma zastąpić dzisiejszy PŁASKI bonus wartością SKALUJĄCĄ się z poziomem (dając sens rozbudowie Targowiska), czy zostać usunięte jako zbędny trzeci mechanizm na tym samym budynku.

**Dlaczego teraz:** Targowisko to najstarszy budynek handlowy w grze (epoka Kamień) i jedyny, gdzie „implementacja zgodnie z `uwagi`" oznaczałaby w praktyce PODNIESIENIE `baza` z 0 na wartość dodatnią — czyli włączenie NOWEGO efektu, a nie „odmrożenie" istniejącej liczby.

**A. Zaimplementować — zastąpić płaski `budynekTargowiskoBonusHandlu` (dziś ~50%) wartością poziomową z pola `mnoznik`, wymaga NAJPIERW podniesienia `baza` z 0 na sensowną wartość startową (np. 50, żeby poziom 1 odpowiadał dzisiejszemu stanowi), potem dawać przyrost z poziomem wg wzoru rozdz. 2.**
**Za:** daje realny sens rozbudowie Targowiska do wyższych poziomów (dziś poziom nie wpływa na % bonusu wcale) — spójne z resztą budynków, gdzie poziom coś zmienia.
**Za:** upraszcza docelowo do jednego, poziomowego mechanizmu zamiast dwóch nakładających się flat-bonusów.
**Przeciw:** to migracja istniejącego, działającego mechanizmu ekonomicznego (Targowisko to jeden z najczęściej budowanych budynków w grze) — ryzyko regresji balansu dla WSZYSTKICH miast z Targowiskiem, nie tylko nowych.
**Przeciw:** wymaga decyzji o wartości startowej `baza` (dziś 0 — trzeba wybrać liczbę tak, by poziom 1 nie był ani nerfem, ani nagłym buffem względem dzisiejszych 50%) — dodatkowa runda strojenia przed jakimkolwiek wdrożeniem.

**B. Usunąć pole `mnoznik` — Targowisko zostaje z dwoma dzisiejszymi, płaskimi mechanizmami handlowymi bez zmian; trzeci, poziomowy mechanizm jest zbędny.**
**Za:** zero ryzyka regresji (dzisiejsze dwa mechanizmy nietknięte), Targowisko i tak ma jasną, działającą rolę ekonomiczną.
**Za:** unika sytuacji trzech osobnych „przełączników" Handlu na jednym budynku, co utrudniałoby graczowi zrozumienie, skąd bierze się jego dochód.
**Przeciw:** rezygnuje z pomysłu, żeby poziom Targowiska w ogóle coś znaczył dla % bonusu Handlu (dziś i po B — poziom wpływa tylko na praca/pieniądz bazowe budynku, jak każdy inny budynek).
**Przeciw:** `mnoznik` bazowe 0 sugeruje, że ten budynek nigdy nie miał być głównym nośnikiem tej mechaniki (może dlatego baza=0!) — usunięcie w praktyce nic nie zmienia poza porządkiem danych.

**C. Zostawić jak jest (bez zmian, `baza=0` więc liczbowo nieaktywne), rozstrzygnąć razem z Karawanserajem jako grupa „Handel".**
**Za:** zero ryzyka natychmiastowego (pole i tak dziś liczbowo nie robi nic, `baza=0`).
**Za:** pozwala rozpatrzyć całą mechanikę Handlu (Targowisko+Karawanseraj+trasy E3) jedną, spójną decyzją zamiast łatać budynek po budynku.
**Przeciw:** karta budynku dalej pokazuje mylący chip „+0/+3 na poziom mnożnik", sugerujący nieistniejący, rosnący efekt.
**Przeciw:** odkłada uporządkowanie najstarszego, najczęściej używanego budynku ekonomicznego w grze.

**Rekomendacja: C**, ale połączone z Karawanserajem w jedno pytanie „Handel" — obie decyzje zależą od tego samego pytania nadrzędnego („czy system Handlu ma trzeci, poziomowy mnożnik na budynkach, czy zostaje przy dzisiejszych płaskich/strukturalnych mechanizmach").

---

### C-MNOZ-AKADEMIA
**[TEMAT: Mnożnik globalnej puli nauki — Akademia (UWAGA: dziś żywy Praca-leak, gotowy hak civNaukaMult)]**

**Sytuacja:** Akademia (`buildings.json:1211-1244`, kategoria Nauka, epoka Żelazo, upgrade Biblioteki + merge Teatru) ma `mnoznik` baza 10. `uwagi` dziś: „ABC-21 B: merge Biblioteka+Akademia+Teatr — suma w JSON; Teatr ukryty z produkcji" (pierwotny, zaginiony tekst mówił o „mnożniku globalnej puli nauki, nadbudówce nad Biblioteką"). **Dziś to pole JEST żywe, ale w złym miejscu**: kategoria „Nauka" nie zawiera Wojsko/Obrona, więc `mnoznik` wpada do puli Step5 i dolicza się do PRACY — poziom 1 = +10%, poziom 10 ≈ +24% Pracy, **zamiast do Nauki**. Silnik ma już gotowy, działający wzorzec: `civNaukaMult` (`economy.ts:775-778`) — civ-wide mnożnik Nauki, konsumowany ownerId-agnostycznie w tej samej funkcji (`turn-economy.ts:1126-1129`, jeden wspólny wzorzec dla gracza i AI), plus analogiczny flat bonus Biblioteki (`economy.ts:772-774`, `maBiblioteka`).

**Cel pytania:** Przekierować już istniejący, żywy bonus z Pracy na Naukę, korzystając z gotowego wzorca (`civNaukaMult`/Biblioteka), zamiast obecnego, przypadkowego celu.

**Dlaczego teraz:** Analogicznie do Pretorium — jeden z najtańszych, najmniej ryzykownych budynków do naprawy: gotowy hak, wyłącznie ekonomia (nie walka), a status quo oznacza kontynuację niezamierzonego wpływu na Pracę.

**A. Zaimplementować zgodnie z `uwagi`** — dopisać czynnik `akademiaMnoznik = 1 + buildingValue(akademia,poziom,'mnoznik')/100` w `economy.ts` obok linii 775-778, mnożony razem z `civNaukaMult` (kolejność mnożenia skalarów nie zmienia wyniku — bezpieczne, w odróżnieniu od Handlu). Formuła: poziom 1 = +10% lokalnej Nauki, poziom 10 ≈ +24% (**PLACEHOLDER do strojenia**). Jednocześnie wykluczyć Akademię z puli Step5 (dodać „Nauka" do filtra wykluczeń, albo wyjątek per-ID).
**Za:** naprawia ISTNIEJĄCY Praca-leak I realizuje zamierzoną mechanikę jednocześnie, korzystając z gotowego, już przetestowanego wzorca (`civNaukaMult`) — bardzo niski koszt implementacyjny.
**Za:** dotyka WYŁĄCZNIE ekonomii (Nauka), zero ryzyka dla walki.
**Przeciw:** to zmiana balansu — miasta z Akademią tracą dzisiejszy (przypadkowy) bonus Pracy, zyskują bonus Nauki zamiast; może zmienić tempo rozwoju technologicznego całej rozgrywki (Nauka jest często wąskim gardłem w 4X).
**Przeciw:** „globalna pula nauki" z pierwotnej `uwagi` sugerowała efekt IMPERIALNY (wszystkie miasta), a nie lokalny; zaimplementowanie tylko lokalnie (jak proponuje ten wzór) jest słabszą wersją pierwotnej intencji — do wyjaśnienia z właścicielem, czy to wystarcza.

**B. Usunąć pole (i tym samym usunąć dzisiejszy Praca-leak, bez zamiennika).**
**Za:** najprostsze, jedna zmiana usuwa i mylące dane, i przypadkowy efekt ekonomiczny.
**Za:** zero ryzyka nowej mechaniki.
**Przeciw:** czysty NERF Pracy miast z Akademią bez rekompensaty w Nauce.
**Przeciw:** marnuje gotowy, tani hak (`civNaukaMult`), wyjątkowo dobrze pasujący do tego budynku.

**C. Zostawić jak jest (żywy Praca-leak trwa), rozstrzygnąć później razem z resztą ekonomicznych budynków (Pretorium/Karawanseraj/Targowisko).**
**Za:** zero natychmiastowej zmiany balansu, jeśli dotychczasowe playtesty już wliczają ten bonus Pracy.
**Za:** pozwala rozpatrzyć wszystkie 4 „żywe" budynki (Wielka Kuźnia/Pretorium/Karawanseraj/Akademia) jedną falą decyzji.
**Przeciw:** to jeden z dwóch najtańszych budynków do naprawy (obok Pretorium) — odkładanie ma słabe uzasadnienie kosztowe.
**Przeciw:** kontynuuje bug niezgodny z `uwagi` (budynek Nauki podbija Pracę).

**Rekomendacja: A** — tak jak Pretorium: niski koszt, gotowy hak, czysto ekonomiczne ryzyko, i naprawia aktywny bug przy okazji. Jedyna różnica od Pretorium: warto dopytać właściciela, czy „lokalnie" (jak proponuje formuła) wystarcza, czy zależy mu na prawdziwie IMPERIALNYM mnożniku Nauki (droższe — wymagałoby zmiany w miejscu sumowania `player.nauka`, `main.ts:10519`, a nie per-miasto).

---

## 6. Proponowany podział na paczki (≤3 pytania/turę)

11 budynków redukuje się do **8 realnych pytań** (3 pary budynków dzielą dokładnie tę samą mechanikę i opcje ABC, więc mogą być rozstrzygnięte jednym pytaniem/formularzem, jeśli właściciel się zgodzi — patrz adnotacje):

| # | Pytanie | Budynki | Dlaczego w tej kolejności |
|---|---|---|---|
| **PACZKA 1/3** | | | Najtańsze, najpilniejsze — dziś ŻYWY, niezamierzony wpływ na ekonomię; gotowe haki w silniku; zero ryzyka dla walki |
| 1 | C-MNOZ-PRETORIUM | Pretorium | Najniższy koszt (hak Wealth gotowy), naprawia aktywny bug |
| 2 | C-MNOZ-AKADEMIA | Akademia | Jak wyżej (hak civNaukaMult gotowy) + pytanie o zasięg (lokalnie/globalnie) |
| 3 | C-MNOZ-WIELKA-KUZNIA | Wielka Kuźnia | Największy dzisiejszy leak (+54% Pracy na max poziomie) — pilna naprawa kategorii niezależnie od dalszej decyzji o mnożniku wojskowym |
| **PACZKA 2/3** | | | Dokończenie ekonomii (Handel) + wejście w grupę Wojsko-siła (droższe, dotyka walki) |
| 4 | C-MNOZ-KARAWANSERAJ + C-MNOZ-TARGOWISKO | Karawanseraj, Targowisko | Jedno pytanie nadrzędne „system Handlu" — obie decyzje są ze sobą sprzężone (ten sam system tras E3, to samo ryzyko potrójnego liczenia) |
| 5 | C-MNOZ-KUZNIA + C-MNOZ-KUZNIA-ZELAZA | Kuźnia, Kuźnia żelaza | Grupa Wojsko-siła (bez Wielkiej Kuźni, już rozstrzygniętej w Paczce 1 co do kategorii) — jedna decyzja o kierunku (wdrażać/nie), szczegóły do playtestu |
| 6 | C-MNOZ-KOSZARY + C-MNOZ-AKADEMIA-WOJSKOWA | Koszary, Akademia wojskowa | Grupa Wojsko-siła+EXP — DROŻSZA niż zwykłe Wojsko-siła (wymaga całego systemu EXP), więc osobne pytanie mimo pokrewieństwa |
| **PACZKA 3/3** | | | Najbardziej niepewne/odległe — brak intencji albo brak jakiegokolwiek mechanizmu bazowego |
| 7 | C-MNOZ-WARSZTAT-OBLEZNICZY | Warsztat oblężniczy | Pytanie o INTENCJĘ, nie o koszt — musi paść osobno, bo nie da się go połączyć z żadną inną grupą bez zgadywania |
| 8 | C-MNOZ-LAZARET | Lazaret | Najmniej pilne — budynek już „zaparkowany" przez samych autorów danych, poza cap epoki v0.1; wymaga całego, nieistniejącego systemu regeneracji HP |

**Uwaga o łączeniu pytań 4-6:** instrukcja zadania wymaga pełnej formy ABC dla KAŻDEGO budynku osobno (sekcja 5 wyżej spełnia to w całości) — łączenie w tabeli paczek dotyczy tylko TEGO, ile osobnych „kart do kliknięcia" właściciel dostanie na raz, nie skraca merytorycznej analizy. Jeśli właściciel wolałby jednak każdy budynek osobno, to 11 pytań zamiast 8 — do niego należy wybór formatu.

---

## 7. Błąd dokumentacji — etykieta „% mnożnika handlu"

Znaleziony przy okazji, **niezależny od powyższych decyzji** (naprawialny od razu, niezależnie od tego, co stanie się z mechaniką):

**Główny winowajca:** `tools/generate-encyklopedia.cjs:42` — generator kart Wiki (`docs/encyklopedia/budynki/*.md`) ma zahardkodowaną etykietę dla klucza `mnoznik`:

```js
const labels = {
  praca: 'pracy',
  pieniadz: 'złota',
  zywnosc: 'żywności',
  nauka: 'nauki',
  kultura: 'kultury',
  zadowolenie: 'pkt szczęścia',
  obrona: 'obrony',
  mnoznik: '% mnożnika handlu',   // <-- linia 42, ta sama etykieta dla WSZYSTKICH budynków
};
```

Efekt: KAŻDY budynek z niezerowym `mnoznik` dostaje w encyklopedii etykietę „X % mnożnika handlu" — łącznie z Lazaretem (regeneracja HP), Pretorium (podatki), Akademią (nauka), Koszarami (siła+EXP wojska) — mimo że żaden z nich nie ma nic wspólnego z handlem. Potwierdzone w wygenerowanych plikach, np. `docs/encyklopedia/budynki/lazaret.md:25`: „**+5 % mnożnika handlu**" i `docs/encyklopedia/budynki/pretorium.md:25`: „**+5 % mnożnika handlu**".

**Drugi, POPRAWNY generator (dla porównania):** `gra/tools/gen-poradnik-batch.py:90-92` (poradnik gracza, `docs/PORADNIK-GRACZA/45-katalog-budynkow.md`) używa neutralnej etykiety „(+N% mnożnik)" — bez fałszywego dopisku „handlu". Ten plik NIE wymaga naprawy, tylko `generate-encyklopedia.cjs`.

**Naprawa** (niezależna od decyzji ABC powyżej — sama etykieta jest błędna niezależnie od tego, co finalnie mnożnik ma robić): zmienić linię 42 na neutralne „% mnożnik" (jak w `gen-poradnik-batch.py`), albo — jeśli/gdy zapadną decyzje o implementacji per budynek — na etykiety per-kategorię zgodne z faktyczną mechaniką każdej grupy.

---

## 8. Drobne uwagi poboczne (znalezione przy okazji, poza zakresem decyzji)

1. **Niespójność `epokaWejscia` Lazaretu:** pole `epokaWejscia` w `buildings.json` ma wartość **5**, ale `uwagi` tego samego budynku mówi „budynek epoki Sredniowiecze (epokaWejscia=4)". Kosmetyczna rozbieżność tekst/dane, nie wpływa na nic w tym zadaniu, ale warto sprzątnąć przy najbliższej okazji edycji tego budynku.
2. **Pole `przyrost` jest martwe dla WSZYSTKICH ośmiu wymiarów budynku** (nie tylko `mnoznik`) — silnik używa wyłącznie `baza × 1,10^(poziom−1)` (rozdz. 2). To dotyczy każdego budynku w grze, nie tylko tych 11 — sygnalizowane tu, bo bezpośrednio ujawnione przy weryfikacji formuły dla zadania, ale to osobny, znacznie szerszy temat (dotyczyłby całej karty budynku, UI kart, i prawdopodobnie generatorów paneli Excel) — **nie rozstrzygać przy okazji tego zadania**.
3. **Wielka Kuźnia ma `kategoria: "Produkcja"`** zamiast oczekiwanego (po wzorcu reszty łańcucha) `"Produkcja+Wojsko"` — to prawdopodobna przyczyna Praca-leaku (rozdz. 1), potraktowana jako osobna mikro-decyzja w ABC Wielkiej Kuźni (opcja B), niezależna od głównej decyzji o mnożniku wojskowym.
