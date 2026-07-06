# D — roster 6 cywilizacji · paczka REZERWA (Maciej · 2026-07-01)

**Status:** **DECYZJE ZAMKNIĘTE** (Maciej · formularz ABC 2026-07-01) · implementacja **po** Excel Panel-D (Q4B)  
**Draft JSON (nie importować):** [`Civ-CYWILIZACJE/draft/roster-6-REZERWA.json`](../../Civ-CYWILIZACJE/draft/roster-6-REZERWA.json)  
**Powiązane:** [`D-cyw-brakujace-v1.md`](D-cyw-brakujace-v1.md) (tier 1 = pierwsze 3)

---

## Decyzje Macieja (D-ROSTER · 2026-07-01)

| ID | Decyzja | Skutek |
|----|---------|--------|
| **D-ROSTER-Q1** | **A** | Sumer → `sumer` · Babilonia → `babilonia` (osobne typy) |
| **D-ROSTER-Q2** | **A** | Nazwy jednostek spec. z draftu zatwierdzone |
| **D-ROSTER-Q3** | **B** | **Pula losowania = 15 typów** (pełny wybór w danych); **na mapie** nadal tyle, ile pozwala **rozmiar mapy** (E1 bez zmian) — patrz korekta Macieja poniżej |
| **D-ROSTER-Q4** | **B** | Najpierw **Panel-D Excel** → potem eksport JSON |
| **D-ROSTER-Q5** | **A** | Fenicjanie: **Tyrski miecznik** (ląd) |
| **D-ROSTER-Q6** | **A** | Tier 2 **zaraz po Tier 1** (jeden duży sprint danych) |
| **D-ROSTER-Q7** | **A** | **Nowe archetypy** AI/dyplomacji per typ w kodzie |

**Odpowiedź (kanon):** `→ D-ROSTER-Q1=A, Q2=A, Q3=B, Q4=B, Q5=A, Q6=A, Q7=A`

**Następny krok:** wkleić 6 nacji do **Panel-D.xlsx** → Maciej edycja → **eksportuj panel** → migracja Sumer `babilon`→`sumer` + 6 nowych wpisów JSON.

---

## Korekta logiki — D-ROSTER-Q3 (Maciej · 2026-07-01)

**Błąd w opisie pytania:** Q3 **nie** zwiększa liczby cywilizacji **na mapie**.

| Pojęcie | Znaczenie |
|---------|-----------|
| **Pula typów (15)** | Z ilu nacji system **może losować** po dodaniu 6 nowych wpisów do danych |
| **Typów na mapie** | Nadal cap z **rozmiaru mapy** (E1-D-Q1=A — bez zmian): mała mapa = mniej typów, ogromna = więcej |
| **Losowanie** | Jak dotąd: unikalne typy, gracz w puli, seed; z puli do **limitu mapy**, nie „zawsze 15 na mapie" |

**Q3=B poprawnie znaczy:** w danych jest **15 typów do losowania** (nie ucinamy puli do 12). Ile trafi na mapę = **wyłącznie wielkość mapy**.

**Później (osobna decyzja, nie teraz):** opcja wyboru przez gracza, **z którymi typami** chce grać — filtr puli przed losowaniem.

**Implementacja:** `civ-roster.ts` — rozmiar puli 15; **bez** zmiany reguł `aktywneTypyFromMapLabel` / cap per map size.

---

## Podział na fazy

| Faza | Cywilizacje | Epoka startu | Kiedy wdrożyć |
|------|-------------|--------------|---------------|
| **Tier 1 — v1 rozszerzone** | Harappa · Hetyci · Słowianie | kamień · brąz · żelazo | Po sygnale Macieja + domknięciu decyzji ABC poniżej |
| **Tier 2 — rezerwa** | Babilonia · Asyria · Fenicjanie | brąz · brąz · żelazo | Po Tier 1 · osobny sprint |

**Dziś w grze:** 9 typów · **+3 Tier 1** → 12 · **+3 Tier 2** → **15** typów głównych (docelowo).

---

## Zasada jednostek specjalnych (tylko nazwy — bez statów)

Zgodnie z kanonem D4 + `units.json`:

| Reguła | Opis |
|--------|------|
| **Nazwa** | Unikalna jednostka w `civs.json` → `jednostka_specjalna` + bonus `typ: jednostka_specjalna` |
| **Zastępuje** | Pole **`W zamian za`** w `units.json` = jednostka bazowa z drzewka (np. Włócznik, Wojownik z mieczem) |
| **Staty** | **Lane UNITS** — macierz C4 · osobny batch po akceptacji nazw |
| **Tech** | Ta sama epoka co jednostka bazowa (lub +1 epoka — decyzja UNITS) |

**W tej paczce:** wyłącznie **nazwa PL** + **„W zamian za”** (propozycja).

---

## Tier 1 — pierwsze wdrożenie (draft)

### 1. Harappa (Indusowie) · epoka **kamień**

| Pole | Wartość robocza |
|------|-----------------|
| **Styl / charakter** | Miasta-plan; handel wewnętrzny; obrona murów; niska agresja ekspansji |
| **Religia** | Kultura indusko-dolinna (protorytuały, brak kapłanów-jedności) |
| **Archetyp AI** | `chinczycy` (handel) + niska agresja |
| **mnoznikHandelPieniadz** | **2.4** (propozycja — silny handel miejski) |
| **Minusy** | Słabsza kawaleria wczesna; wolniejsza ofensywa poza terytorium |
| **nazwyKlastra[10]** | Harappa · Mohenjo-daro · Dholavira · Rakhigarhi · Ganweriwala · Kalibangan · Lothal · Banawali · Kot Diji · Amri |
| **ikonaId / enum** | `harappa` → **nowy** `TypCywilizacji.Harappa` |

**Bonusy (3 — draft):**

| typ | cel | wartość | realizuje | opis skrót |
|-----|-----|---------|-----------|------------|
| bonus_zloto | handel | 0.15 | ekonomia | Szlaki lokalne: +15% złota z handlu w miastach |
| bonus_obrona | piechota | 0.15 | walka | Obrona murów: +15% obrony piechoty w terytorium własnym |
| jednostka_specjalna | piechota | *(nazwa poniżej)* | walka | — |

**Jednostka specjalna:** **Strażnik bram Harappy** · **W zamian za:** `Włócznik`

**Dyplomacja (`perNacja` draft):** sklonnoscSojusze 7 · lojalnosc 6 · progWojny 2 · otwartoscHandel 8 · nastawienieBazowe 58

**AI (`civ-ai` draft):** agresywnosc 2 · priorytetEkonomia 7 · priorytetNauka 5 · priorytetMilitarny 4 · profilMapy `kopia_typu_obronna`

---

### 2. Hetyci (Hatti) · epoka **brąz**

| Pole | Wartość robocza |
|------|-----------------|
| **Styl / charakter** | Charyotycy; fortyfikacje górskie; dyplomacja traktatów; twardsi w obronie |
| **Religia** | Politeizm hetycki (tysiące bogów, Storm-god) |
| **Archetyp AI** | `rzymianie` (średnia agresja) + bonus obrony |
| **mnoznikHandelPieniadz** | **2.0** |
| **Minusy** | Droższa rekrutacja elit; słabszy handel morski |
| **nazwyKlastra[10]** | Hattusa · Alaca Höyük · Kanesh · Carchemish · Aleppo · Karkemish · Sapinuwa · Sarissa · Kuşaklı · Şapinuva |
| **ikonaId / enum** | `hetyci` → **nowy** `TypCywilizacji.Hetyci` |

**Bonusy (3 — draft):**

| typ | cel | wartość | realizuje |
|-----|-----|---------|-----------|
| bonus_walka | rydwany | 0.20 | walka | Rydwan hetycki: +20% ataku rydwanów (charyotycy) |
| bonus_obrona | piechota | 0.15 | walka | Forteca Anatolii: +15% obrony w terytorium górskim/mur |
| jednostka_specjalna | rydwany | **Rydwan Kapadokijski** | walka |

**Jednostka specjalna:** **Rydwan Kapadokijski** · **W zamian za:** `Rydwan` *(lub `Rydwan bojowy` — decyzja UNITS)*

**Dyplomacja draft:** sklonnoscSojusze 5 · lojalnosc 6 · progWojny 5 · otwartoscHandel 5 · nastawienieBazowe 52

**AI draft:** agresywnosc 5 · priorytetMilitarny 6 · priorytetNauka 4 · profilMapy `kopia_typu_obronna`

---

### 3. Słowianie · epoka **żelazo**

| Pole | Wartość robocza |
|------|-----------------|
| **Styl / charakter** | Osady leśne; liczna piechota; ekspansja na wschód; wspólnota plemienna |
| **Religia** | Pogaństwo słowiańskie (Perun, Weles) |
| **Archetyp AI** | `germanie` / `celtowie` (piechota leśna) |
| **mnoznikHandelPieniadz** | **1.8** |
| **Minusy** | Wolniejsza nauka wczesna; słabsze oblężnictwo |
| **nazwyKlastra[10]** | Kiev · Novgorod · Kraków · Wolin · Gniezno · Pskov · Suzdal · Belgrade · Pliska · Arkona |
| **ikonaId / enum** | `slowianie` → **nowy** `TypCywilizacji.Slowianie` |

**Bonusy (3 — draft):**

| typ | cel | wartość | realizuje |
|-----|-----|---------|-----------|
| bonus_walka | piechota | 0.15 | walka | Horda leśna: +15% ataku piechoty w lesie / terytorium |
| bonus_pobor_regen | rekruci | 0.10 | ekonomia | Wspólnota: +10% regen poboru (vs standard 10%/turę) |
| jednostka_specjalna | piechota | **Drużynnik** | walka |

**Jednostka specjalna:** **Drużynnik** · **W zamian za:** `Włócznik`

**Dyplomacja draft:** sklonnoscSojusze 4 · lojalnosc 5 · progWojny 6 · otwartoscHandel 4 · nastawienieBazowe 48

**AI draft:** agresywnosc 6 · priorytetMilitarny 6 · sklonnoscDoPodboju 3 · profilMapy `kopia_typu_obronna`

---

## Tier 2 — rezerwa (draft — bez wdrożenia)

### 4. Babilonia · epoka **brąz**

| Pole | Wartość robocza |
|------|-----------------|
| **Styl / charakter** | Prawo, astronomia, kapłani; miasto-bóg; dyplomacja i nauka |
| **Religia** | Religia babilońska (Marduk, Ishtar) |
| **Archetyp AI** | `chinczycy` (nauka) + `babilon` legacy |
| **mnoznikHandelPieniadz** | **2.3** |
| **Minusy** | Koszt utrzymania elit; wrażliwość na utratę stolicy |
| **nazwyKlastra[10]** | Babilon · Ur · Sippar · Nippur · Larsa · Isin · Uruk · Eridu · Kish · Akkad |
| **ikonaId / enum** | ⚠️ **`babilonia`** — patrz decyzja **D-ROSTER-Q1** (konflikt z Sumerowie) |

**Bonusy (3 — draft):**

| typ | cel | wartość | realizuje |
|-----|-----|---------|-----------|
| bonus_nauka | nauka | 0.15 | ekonomia | Kapłani-astronomowie: +15% punktów nauki |
| bonus_zloto | handel | 0.10 | ekonomia | Rynek Euphratu: +10% złota |
| jednostka_specjalna | piechota | **Gwardia Ishtar** | walka |

**Jednostka specjalna:** **Gwardia Ishtar** · **W zamian za:** `Wojownik z khopesh` *(lub Włócznik — ABC)*

**Dyplomacja draft:** sklonnoscSojusze 6 · lojalnosc 5 · progWojny 4 · otwartoscHandel 6 · nastawienieBazowe 55

---

### 5. Asyria · epoka **brąz**

| Pole | Wartość robocza |
|------|-----------------|
| **Styl / charakter** | Imperium oblężnicze; łucznicy; terror i podbój; szybka wojna |
| **Religia** | Religia asyryjska (Aszur) |
| **Archetyp AI** | `rzymianie` / `zulusi` (wysoka agresja) |
| **mnoznikHandelPieniadz** | **1.7** |
| **Minusy** | Niskie zaufanie sąsiadów; wysokie utrzymanie armii |
| **nazwyKlastra[10]** | Ninive · Assur · Kalhu · Dur-Sharrukin · Harran · Carchemish · Arpad · Imgur-Enlil · Tushhan · Nineveh |
| **ikonaId / enum** | `asyria` → **nowy** `TypCywilizacji.Asyria` |

**Bonusy (3 — draft):**

| typ | cel | wartość | realizuje |
|-----|-----|---------|-----------|
| bonus_walka | lukownicy | 0.20 | walka | Łucznicy asyryjscy: +20% ataku dystansowego |
| bonus_walka | oblężenie | 0.15 | walka | Machiny oblężnicze: +15% efektywności oblężenia *(cel do potwierdzenia w kodzie)* |
| jednostka_specjalna | lukownicy | **Łucznik asyryjski** | walka |

**Jednostka specjalna:** **Łucznik asyryjski** · **W zamian za:** `Łucznik`

**Dyplomacja draft:** sklonnoscSojusze 2 · lojalnosc 4 · progWojny 9 · otwartoscHandel 3 · nastawienieBazowe 38

**AI draft:** agresywnosc 8 · sklonnoscDoPodboju 5 · priorytetMilitarny 8

---

### 6. Fenicjanie · epoka **żelazo**

| Pole | Wartość robocza |
|------|-----------------|
| **Styl / charakter** | Handel morski; kolonie; barter; unikanie lądowej wojny totalnej |
| **Religia** | Religia fenicka (Ba'al, Tanit) |
| **Archetyp AI** | `grecy` (handel morski) |
| **mnoznikHandelPieniadz** | **2.6** (najwyższy w rosterze) |
| **Minusy** | Słaba piechota lądowa elit; zależność od portów |
| **nazwyKlastra[10]** | Tyr · Sidon · Byblos · Carthage · Utica · Gadir · Motya · Tharros · Kition · Arwad |
| **ikonaId / enum** | `fenicjanie` → **nowy** `TypCywilizacji.Fenicjanie` |

**Bonusy (3 — draft):**

| typ | cel | wartość | realizuje |
|-----|-----|---------|-----------|
| bonus_zloto | handel | 0.25 | ekonomia | Szlaki morskie: +25% złota z portów i handlu |
| bonus_zloto | handel | 0.10 | ekonomia | Purpura: +10% dodatkowe *(stack z mnoznikiem — kalibracja)* |
| jednostka_specjalna | piechota | **Tyrski miecznik** | walka |

**Jednostka specjalna:** **Tyrski miecznik** · **W zamian za:** `Wojownik z mieczem i tarczą`  
*(Opcja B: jednostka morska — decyzja **D-ROSTER-Q5**)*

**Dyplomacja draft:** sklonnoscSojusze 5 · lojalnosc 4 · progWojny 3 · otwartoscHandel 9 · nastawienieBazowe 62

**AI draft:** agresywnosc 3 · priorytetEkonomia 8 · tolerancjaRyzyka 3

---

## Tabela jednostek specjalnych (wszystkie 6)

| Cywilizacja | Nazwa jednostki | W zamian za (propozycja) | Epoka bazowa |
|-------------|-----------------|--------------------------|--------------|
| Harappa | Strażnik bram Harappy | Włócznik | Kamień/Brąz |
| Hetyci | Rydwan Kapadokijski | Rydwan | Brąz |
| Słowianie | Drużynnik | Włócznik | Żelazo |
| Babilonia | Gwardia Ishtar | Wojownik z khopesh | Brąz |
| Asyria | Łucznik asyryjski | Łucznik | Brąz |
| Fenicjanie | Tyrski miecznik | Wojownik z mieczem i tarczą | Żelazo |

---

## Plan wdrożenia (gdy przyjdzie czas — checklist)

### Faza A — decyzje Macieja (ABC)

| ID | Pytanie | Opcje |
|----|---------|-------|
| **D-ROSTER-Q1** | **Sumerowie vs Babilonia** — dziś `Sumerowie` ma `typCywilizacji: "babilon"` i `ikonaId: "babilon"`. Nowa **Babilonia** to: | **A** osobny typ `babilonia` + Sumer dostaje `sumer` · **B** Babilonia zastępuje slot Sumer · **C** tylko Sumer, Babilonia jako alias lore |
| **D-ROSTER-Q2** | Zatwierdzić **nazwy jednostek** z tabeli powyżej? | **A** tak · **B** poprawki (podaj) |
| **D-ROSTER-Q3** | **Pula losowania:** 12 czy **15 typów w danych** (ile może wylosować system — **nie** liczba na mapie) | Wpływa na `civ-roster.ts`; cap na mapie = rozmiar mapy (E1) |
| **D-ROSTER-Q4** | Wartości bonusów (%): | **A** draft jak wyżej · **B** Excel Panel-D · **C** później |
| **D-ROSTER-Q5** | Fenicjanie: jednostka **lądowa** vs **morska** spec.? | **A** Tyrski miecznik · **B** załoga triery (wymaga statków) |
| **D-ROSTER-Q6** | Tier 2 (Babilonia/Asyria/Fenicjanie): | **A** od razu po Tier 1 · **B** osobna wersja gry v1.1+ |
| **D-ROSTER-Q7** | `ARCHETYPE_*` w `diplomacy.ts`: | **A** nowe wpisy per typ · **B** mapowanie na istniejące archetypy (jak w draft) |

### Faza B — lane CYW (dane)

| # | Plik | Akcja |
|---|------|--------|
| 1 | `gra/data/civs.json` | +6 wpisów (bonusy, klastry, epokiStartowe) |
| 2 | `gra/data/civ-ai.json` | +6 profili AI |
| 3 | `gra/data/civ-params.json` | preferowane budynki/jednostki |
| 4 | `gra/data/diplomacy.json` | `perNacja` + ewent. `ARCHETYPE` |
| 5 | `gra/data/ai-params.json` | delty priorytetów per nacja |
| 6 | `gra/src/types/player.ts` | enum `TypCywilizacji` (+5..6 wartości) |
| 7 | `gra/src/game/diplomacy.ts` | `ARCHETYPE_AGGRESSION` / `ARCHETYPE_TRADE` |
| 8 | `Panel-D.xlsx` | sync bonusów · **eksportuj panel** |

### Faza C — lane UNITS

| # | Plik | Akcja |
|---|------|--------|
| 9 | `gra/data/units.json` | +6 wierszy jednostek spec. (staty macierz C4) |
| 10 | `gra/src/game/production.ts` | filtr „W zamian za” per typ |
| 11 | `combat.ts` / bitwa 3D | bonusy walki per cyw |

### Faza D — lane UI + SILNIK

| # | Plik | Akcja |
|---|------|--------|
| 12 | `newGameFlow` / wybór cyw | ikony + opis bonusów |
| 13 | `preBattle.ts` | chip bonusów |
| 14 | `main.ts` | spawn, kolory, `assignAiCivTypes`, roster cap |
| 15 | `civ-roster.ts` | pula 12/15 typów |
| 16 | FIGMA / ikony 3C | 6 nowych ikon cywilizacji |

### Faza E — bramka

| Test | Plik |
|------|------|
| Bonusy | `civ-bonusy-test.cjs` |
| Roster | `civ-roster-test.cjs` |
| Dyplomacja | `diplomacy-test.cjs` |
| Round-trip Panel-D | `test-panel-d-roundtrip.py` |

**Szacunek:** Tier 1 ≈ 1 sprint CYW + 1 batch UNITS + 1 batch SILNIK · Tier 2 ≈ powtórka.

---

## ⚠️ Uwagi techniczne

1. **Enum `Babilon`** istnieje, ale **Sumerowie** go zajmują — Tier 2 Babilonia wymaga **D-ROSTER-Q1** przed kodem.
2. **Jednostki:** w tej paczce **zero statów** — UNITS dostaje handoff z tabelą nazw + „W zamian za”.
3. **Nie importować** `draft/roster-6-REZERWA.json` do `gra/data/` bez sygnału i ABC.
4. **Power / Respekt** — bez zmian definicji; epoka startowa wpływa na mnożnik Power.

---

## Następny krok (Maciej)

1. Przejrzyj charakterystyki 6 nacji — popraw styl/religie/klastry jeśli trzeba.
2. Zamknij **D-ROSTER-Q1…Q7** (można skrótem: „Q1A, Q2A, …”).
3. Tier 1: sygnał **„implementuj 3 cyw”** → lane CYW kopiuje draft → `gra/data`.
4. Tier 2: zostaje w **REZERWIE** do osobnego sygnału.
