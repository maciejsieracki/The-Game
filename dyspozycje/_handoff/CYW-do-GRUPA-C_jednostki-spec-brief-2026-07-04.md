# CYW (cywilizacje) → Grupa C (Walka) — brief jednostek specjalnych

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **GOTOWE** — brief produktowy · **bez statów** |
| **Flaga** | Czeka implementacja **Grupy C** (`units.json` + macierz TW) |
| **Trigger Grupy C** | **`działaj`** (czat Walka) |
| **CYW NIE rusza** | `units.json` · `combat.ts` · modele 3D · macierz fieldPower |

**Powiązane:** [`MASTER-do-GRUPA-C_jednostki-faza2-roster6-2026-07-03.md`](MASTER-do-GRUPA-C_jednostki-faza2-roster6-2026-07-03.md) (szczegóły batchy Asyria/Słowianie) · [`docs/decyzje/D-cyw-roster-6-REZERWA.md`](../../docs/decyzje/D-cyw-roster-6-REZERWA.md) · [`docs/decyzje/D-CELT-JEDNOSTKI-2026-07-04.md`](../../docs/decyzje/D-CELT-JEDNOSTKI-2026-07-04.md)

---

## Zasada podziału ról

| Lane | Odpowiedzialność |
|------|------------------|
| **CYW** | `civs.json` (nazwa spec., bonusy, epoka startu, charakter) · decyzje Macieja ABC · **ten brief** |
| **Grupa C / UNITS** | `units.json` (staty TW v3, `W zamian za`, tech, epoka jednostki) · `combat.ts` · testy · modele |
| **EKONOMIA** | `production.ts` — filtr `Nacja` + token `jednostka_specjalna` (CELT-Q3=A; handoff osobny) |

---

## A. Celtowie — decyzje Macieja 2026-07-04 (CELT-Q1/Q2=A)

**Dane CYW już w kanonie:** `civs.json` → `Jednostka specjalna: Soldurii`, bonus `jednostka_specjalna`.

| Jednostka | Rola w grze | Kiedy w produkcji | W zamian za (propozycja CYW) | Uwagi produktowe |
|-----------|-------------|-------------------|------------------------------|------------------|
| **Soldurii** | Jednostka **specjalna cywilizacji** | Po tech **Brązownictwo** (epoka jednostki: **Żelazo** — jak dziś Celtowie) | **Wojownik** (kamienny bazowy) | Elitarna gwardia wodza; miecz + tarcza + torc; przysięga do śmierci |
| **Gaesatae** | Elitarna piechota **najemna** (nie spec. w sensie „W zamian za") | Po tech **Brązownictwo** | **—** (CELT-Q1=A) | Rename **Wojownik celtycki** → Gaesatae; **staty bez zmian** względem obecnego Wojownika celtyckiego |
| **CELT-Q2=A** | Soldurii vs Gaesatae | — | — | **Identyczne staty walki** (Grupa C kopiuje macierz z Gaesatae / obecnego Wojownika celtyckiego) |

**Charakter cyw (kontekst balansu):** agresywna piechota, brawura szarży (+25% pierwsze uderzenie), słabsza obrona w długiej walce. Bonus Gaesatae: +15% Uderzenia.

**Co Grupa C ma zrobić:**
1. Rename `Wojownik celtycki` → `Gaesatae` (staty bez zmian).
2. Nowy wiersz **Soldurii** (`Nacja: Celtowie`, `W zamian za: Wojownik`).
3. Sync `tech.json` (lista Brązownictwo) jeśli potrzeba.
4. Model 3D: obie → profil celtycki (już częściowo w `render/units.ts`).

---

## B. Roster-6 — 6 cywilizacji (nazwy zatwierdzone D-ROSTER-Q2=A)

**Zasada CYW:** poniżej tylko **nazwa**, **epoka startu cyw**, **kiedy jednostka ma się pojawić**, **co zastępuje**, **charakter** — **zero statów**. Macierz TW = Grupa C.

### Tier 1

#### 1. Harappa · start **kamień** · `typCywilizacji: harappa`

| Pole | Wartość |
|------|---------|
| Charakter | Miasta-plan; handel wewnętrzny; obrona murów; niska agresja |
| Bonus walki | +15% obrony piechoty **w terytorium własnym** |
| **Jednostka spec.** | **Strażnik bram Harappy** |
| **W zamian za** | **Włócznik** |
| **Kiedy** | Epoka **Brąz** (gracz w kamieniu → po Brązownictwie) |
| Tech (prop.) | Brązownictwo (jak Włócznik) |
| Profil (słownie) | Elitarna piechota bram miasta-plan; obrona > atak |

#### 2. Hetyci · start **brąz** · `typCywilizacji: hetyci`

| Pole | Wartość |
|------|---------|
| Charakter | Charyotycy; fortyfikacje; traktaty; silna obrona |
| Bonus walki | +20% ataku **rydwanów** |
| **Jednostka spec.** | **Rydwan Kapadokijski** |
| **W zamian za** | **Rydwan konny** *(w Excelu „Rydwan" — bazowy w grze = Rydwan konny)* |
| **Kiedy** | Epoka **Brąz**, tech **Jeździectwo** |
| Profil (słownie) | Rydwan bojowy Anatolii; mobilna flanka |

#### 3. Słowianie · start **tylko żelazo** · `typCywilizacji: slowianie`

| Pole | Wartość |
|------|---------|
| Charakter | Osady leśne; liczna piechota; ekspansja wschód |
| Bonus walki | +15% piechoty w **lesie / terytorium** |
| **Jednostka spec.** | **Drużynnik** |
| **W zamian za** | **Włócznik** |
| **Kiedy** | Epoka **Żelazo** (start cyw = żelazo; Brąz pomijamy) |
| Tech (prop.) | Brązownictwo lub odpowiednik żelazny — **decyzja Grupy C** |
| Profil (słownie) | Elitarny wojownik drużyny księcia; piechota leśna |

**Uwaga:** Maciej 2026-07-03 doprecyzował też **konnica ze szczepnikami** dla Słowian — patrz batch 1 w handoffie MASTER→C.

### Tier 2

#### 4. Babilonia · start **brąz** · `typCywilizacji: babilonia`

| Pole | Wartość |
|------|---------|
| Charakter | Prawo, astronomia, kapłani; nauka + handel |
| Bonus | +15% nauki |
| **Jednostka spec.** | **Gwardia Ishtar** |
| **W zamian za** | **Wojownik z khopesh** *(lub standardowy wojownik mieczowy — Grupa C wybiera spójnie z drzewkiem)* |
| **Kiedy** | Epoka **Brąz**, tech Brązownictwo |
| Profil (słownie) | Elitarna garda świątynna / pałacowa |

#### 5. Asyria · start **brąz** · `typCywilizacji: asyria`

| Pole | Wartość |
|------|---------|
| Charakter | Armia profesjonalna; oblężenie; łucznictwo |
| Bonus | +20% łuczników; +15% oblężenie *(realizacja oblężenia — osobny batch UNITS)* |
| **Jednostka spec. (nazwa w civs.json)** | **Łucznik asyryjski** |
| **W zamian za** | **Łucznik** |
| **Kiedy** | Epoka **Brąz**, tech Łucznictwo |
| Profil (słownie) | Łucznik imperium; silniejszy od kamiennego Łucznika |

**Uwaga:** Maciej chce też **2 konnice asyryjskie** (lanca + łucznik konny) — **poza** tabelą CYW spec.; szczegóły w `MASTER-do-GRUPA-C_jednostki-faza2-roster6-2026-07-03.md` batch 1.

#### 6. Fenicjanie · start **żelazo** · `typCywilizacji: fenicjanie`

| Pole | Wartość |
|------|---------|
| Charakter | Handel morski; kolonie; flota |
| Bonus | +20% złota z handlu |
| **Jednostka spec.** | **Tyrski miecznik** (D-ROSTER-Q5=A, ląd) |
| **W zamian za** | **Wojownik z mieczem i tarczą** |
| **Kiedy** | Epoka **Żelazo** (start cyw = żelazo) |
| Profil (słownie) | Piechota kolonialna / miejska Fenicji |

---

## C. Źródło prawdy danych CYW (już w repo)

| Plik | Co zawiera |
|------|------------|
| `gra/data/civs.json` | 15 cywilizacji · `bonusy[]` z `jednostka_specjalna` · epoki startu |
| `gra/data/civ-ai.json` | profile AI (6 nowych — draft / do domknięcia D-ROSTER-Q7) |
| `gra/data/diplomacy.json` | `perNacja` |
| `docs/decyzje/D-cyw-roster-6-REZERWA.md` | pełny lore + bonusy draft |

---

## D. DoD Grupy C (acceptance)

- [ ] Wszystkie nazwy z tabeli A+B istnieją w `units.json` ze statami TW v3 (macierz C4).
- [ ] `W zamian za` zgodne z tabelą (lub uzasadniona korekta w meldunku).
- [ ] `Nacja` = nazwa z kolumny cyw (Harappa, Hetyci, …).
- [ ] Produkcja: token z `civs.json` `jednostka_specjalna` + filtr Nacja (EKONOMIA).
- [ ] `node tools/combat-test.cjs` — zielone.
- [ ] Meldunek: `C-walka-DO-MASTERA.md` + handoff do Integratora jeśli potrzeba.

---

## E. Korekta błędu lane (2026-07-04)

Lane CYW **błędnie** wpisał wiersze do `units.json` — **cofnięte**. Jednostki = wyłącznie Grupa C.
