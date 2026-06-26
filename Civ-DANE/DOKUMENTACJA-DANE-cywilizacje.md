# DOKUMENTACJA DEWELOPERSKA — Moduł CYWILIZACJE i RELIGIE (zakres Civ-DANE)

> Autor: sesja **Civ-DANE** (dane cywilizacji). Wersja: 2026-06-23. Projekt: gra 4X „The Game" (Civ), stack HTML+TypeScript+Three.js (Vite).
> Ten dokument opisuje CAŁY zakres danych, reguł i zależności wytworzonych przez Civ-DANE — od źródła (Excel) po JSON konsumowany w kodzie. Pisany dla dewelopera wpinającego te dane do gry.

---

## 0. TL;DR (dla zabieganych)
- **Roster gry = 9 TYPÓW głównych cywilizacji** (nie 50 nacji). Liczby „50/70/90" to liczba MIAST na mapie ze spawnu (klastry), NIE liczba nacji.
- Źródło prawdy: **`Cywilizacje.xlsx`** → (celowany eksport) → **`gra/data/civs.json`**. Religie cyw.: **`Spoleczenstwo-parametry.xlsx` → „Religie cywilizacji"** → `gra/data/society-params.json` (`religie_cywilizacji`).
- Każda cywilizacja ma: styl, jednostkę specjalną, bonus/minus, **religię**, flagę **`Typ główny`**.
- System jednostek: typy standardowe + **nazwane zamienniki** („W zamian za") + **super-jednostka (≡ jednostka specjalna, 1/nację)**. Reguła per-epoka: Kamień brak; Brąz ≥1 zamiennik + super; Żelazo ≥1 zamiennik. **Staty jednostek = lane Civ-UNITS** (`Jednostki.xlsx`), nie DANE.
- **NIGDY** `npm run build` ani `export-data.py` (regenerują WSZYSTKIE JSON-y → kasują pracę innych). Zawsze eksport CELOWANY (tylko `civs.json`).

---

## 1. Zakres modułu

### 1.1 Co OBEJMUJE Civ-DANE
- Definicje **9 typów cywilizacji** (nazwa, charakter, bonus/minus, jednostka specjalna, religia, `Typ główny`).
- **Religie cywilizacji** (przypisanie + propozycje bonusów mechanicznych) — w arkuszu „Religie cywilizacji".
- **Warunki startowe i model klastra mapy** jako PARAMETRY (arkusz „Start gry") — wartości; sama implementacja spawnu należy do map-gen.
- **Kierunek historyczny jednostek** specjalnych (nazwy, role, broń/styl, „W zamian za", epoka) — jako INPUT dla Civ-UNITS.

### 1.2 Czego Civ-DANE NIE robi (granice lane)
- NIE ustala statystyk jednostek (Atak/Obrona/Health/Morale/Zasięg) — to **Civ-UNITS** (`Jednostki.xlsx` → `units.json`).
- NIE pisze kodu (`src/*`), nie rusza `main.ts`, nie publikuje `Gra-podglad.html` — to **Civ-SILNIK**.
- NIE implementuje generatora mapy / spawnu — to **Civ-MAPA / Civ-SILNIK**.
- NIE regeneruje cudzych JSON-ów (np. `society-params.json` poza sekcją źródłową w Excelu) — patrz §11.

---

## 2. Pliki i pipeline danych

```
Cywilizacje.xlsx                      (ŹRÓDŁO PRAWDY — edytowalne)
  ├─ arkusz "Cywilizacje"  ──┐
  └─ arkusz "Start gry"    ──┤  [celowany skrypt eksportu — TYLKO civs.json]
                             └────────────────────────────────────────────►  gra/data/civs.json
                                                                                   │
Spoleczenstwo-parametry.xlsx                                                       │ import (Vite, statyczny)
  └─ arkusz "Religie cywilizacji" ──[eksport sekcji society]──► gra/data/society-params.json
                                                                                   │
                                                                                   ▼
                                                                      src/data/loader.ts  →  loadGameData()
                                                                                   │
                                                                                   ▼
                                                                      main.ts / moduły logiki (SILNIK)
```

### 2.1 Reguły pipeline (ŻELAZNE)
1. **Edycja TYLKO w Excelu (źródło)**, potem eksport do JSON. Nie edytować JSON ręcznie „na czysto" (rozjazd ze źródłem).
2. **Eksport CELOWANY**: skrypt czyta wyłącznie `Cywilizacje.xlsx` i zapisuje wyłącznie `gra/data/civs.json`. Logika identyczna jak `export_cywilizacje` w `tools/export-data.py` (patrz §2.2).
3. **ZAKAZ** `export-data.py` (regeneruje WSZYSTKIE JSON-y, ma zaszytą ścieżkę sandboxa) i **ZAKAZ** `npm run build` (odpala prebuild = export-data.py). Build do testów: `npx vite build --outDir /tmp/civ-dist` (pomija prebuild).
4. Po zmianie `civs.json`: sprawdzić, że `loader.ts` kompiluje się bez błędu (`tsc`).

### 2.2 Format eksportu (zgodny z `tools/export-data.py`)
- `json.dump(..., ensure_ascii=False, indent=2)` — polskie znaki zachowane.
- Struktura: `{ "<nazwa_arkusza_lower_underscore>": [ {rekordy} ] }`. Arkusze: „Cywilizacje" → klucz `cywilizacje`; „Start gry" → klucz `start_gry`.
- Nagłówek = 2. wiersz arkusza (index 1). Wiersz tytułowy (1.) pomijany.
- `clean_value`: pusty string → `null`; float całkowity → int; reszta bez zmian. Wiersze puste i „etykiety sekcji" (tekst tylko w 1. kolumnie) pomijane.

---

## 3. Schemat danych — `gra/data/civs.json`

```jsonc
{
  "cywilizacje": [ CivRecord, ... 9 sztuk ],
  "start_gry":   [ StartParam, ... ]
}
```

### 3.1 CivRecord (1 cywilizacja) — pola i znaczenie
| Pole (klucz JSON) | Typ | Znaczenie |
|---|---|---|
| `Cywilizacja` | string | Nazwa typu (np. „Grecy"). Klucz biznesowy, unikalny. |
| `Styl / charakter` | string\|null | Krótki opis stylu gry (np. „defensywna piechota"). |
| `Jednostka specjalna` | string\|null | Nazwa **ikonicznej** jednostki cyw. (patrz §7.4 — uwaga o rozjeździe z super w `units.json`). |
| `Bonus startowy` | string\|null | Opis bonusów (jakościowy; kwantyfikacja = przyszły pas balansu). |
| `Bonusy/minusy (do dopracowania)` | string\|null | Opis słabości/minusów. |
| `Uwagi` | string\|null | Notatki (epoka, „Stary Świat" itp.). |
| `Religia` | string\|null | **NOWE.** Nazwa wyznania (np. „Politeizm olimpijski"). Bonusy mechaniczne religii → `society-params.json` (§6). |
| `Typ główny` | bool | **NOWE (addytywne).** Dla wszystkich 9 = `true`. Pod przyszłe sub-nacje (satelity tego samego typu = `false`/parametr nadrzędny). |

### 3.2 StartParam (warunki startu i model mapy)
Rekord: `{ "Parametr": string, "Wartość": string, "Uwagi": string|null }`. Aktualne wartości w §5.2.

### 3.3 Relacja z kodem — `src/data/loader.ts`
- `loader.ts` importuje `civs.json` i rzutuje: `civsRaw as CivsData` (interfejs `CivDef`).
- **`CivDef` ma obecnie 6 pól** (Cywilizacja, Styl/charakter, Jednostka specjalna, Bonus startowy, Bonusy/minusy (do dopracowania), Uwagi). Pola `Religia` i `Typ główny` są w JSON jako **nadmiarowe** — rzutowanie TS je toleruje, `loader.ts` czyta bez błędu (potwierdzone `tsc` EXIT=0).
- **ZADANIE dla Civ-SILNIK:** przy wpinaniu dodać do `CivDef`:
  ```ts
  Religia: string | null;
  'Typ główny': boolean;
  ```
  Dopóki logika ma czytać te pola typowo. (Civ-DANE nie rusza `src/*`.)

---

## 4. Roster — 9 typów głównych

> **REGUŁA NACZELNA:** roster = **TYPY**, nie pojedyncze nacje. „50/70/90" = liczba MIAST/instancji na mapie (klastry tego samego typu), NIE 50 osobnych nacji. (Geneza pomyłki: pierwotnie 5 typów × 10 miast = 50; po rozszerzeniu do 9 typów × 10 = 90.)

| # | Cywilizacja | Styl / charakter | Jednostka specjalna (ikoniczna) | Religia | Typ główny |
|---|---|---|---|---|---|
| 1 | Grecy | defensywna piechota | Falanga (Hoplita) | Politeizm olimpijski | true |
| 2 | Rzymianie | ofensywna piechota + inżynieria | Legion (Legionista) | Religia rzymska / kult państwa | true |
| 3 | Chińczycy | dystans + kawaleria | Kusznik (lepszy łucznik) | Konfucjanizm / Taoizm | true |
| 4 | Inkowie | nauka/kultura + elitarna piechota | Chaska (maczuga gwiaździsta) + Królewska Gwardia (elita) | Kult Słońca Inti | true |
| 5 | Zulusi | szybka, agresywna piechota | Impi | Kult przodków / animizm | true |
| 6 | Egipt | rydwany + łucznicy dystansowi | Medżaj (Gwardia Faraona) | Religia egipska — faraon-bóg | true |
| 7 | Sumerowie | ciężka piechota + łucznicy + rydwany | Gwardia Królewska Sumeru | Religia sumeryjska (mezopotamska) — Enlil/Anu | true |
| 8 | Celtowie | agresywna piechota sieczna; szarża | Miecznik galijski | Religia celtycka (druidyzm) | true |
| 9 | Germanie | piechota leśna; zasadzki, furia | Wojownik germański (framea) | Religia germańska (Wotan/Odyn) | true |

Pełne bonusy/minusy każdej cyw. — w `Cywilizacje.xlsx`/`civs.json` (pola `Bonus startowy`, `Bonusy/minusy`). Celtowie i Germanie to byłe „przyszłe kultury" §9d (Celtowie ≈ Galowie; ikona = „Miecznik galijski", ref-17 §9f).

### 4.1 Ograniczenia zwierzęce (wpływ na dostępne jednostki — §8c)
- **Inkowie:** brak koni, wołów, konnicy i rydwanów; lama = zwierzę pakowe (nie jednostka). Brak kucia żelaza (kultura brązu/miedzi).
- **Zulusi:** brak rydwanów.

---

## 5. Model mapy (klastry) — PARAMETRY (impl. = map-gen)

### 5.1 Reguła klastra
- Główna cywilizacja gracza ląduje w regionie; wokół niej spawnuje się **9 rywali tego samego typu** (AI) → **klaster = 10 miast/typ** (1 gracz + 9 rywali).
- **9 typów × 10 = 90 miast** na mapie łącznie. Miasta w klastrze min. ~9 pól od siebie. Skaluje się z wielkością mapy.
- **Cel startowy:** pokonać wszystkich ~9 rywali własnego typu (eliminacja = utrata wszystkich ich miast), zanim napotka się inne typy.

### 5.2 Parametry „Start gry" (aktualne wartości w `civs.json → start_gry`)
| Parametr | Wartość | Uwaga |
|---|---|---|
| Osadnicy na start (gracz) | 1 | gracz startuje z 1 osadnikiem |
| Cywilizacje na mapie | 90 | 9 typów × 10 (1 gracz + 9 rywali) |
| Główne cywilizacje (typy) | 9 (Grecy…Germanie) | lista 9 |
| Cywilizacje początkowe | miasta tego samego typu (klaster) | to NIE osobne nacje |
| Rywale tego samego typu wokół gracza | ~9 (AI) | klaster 10 miast |
| Cel startu | pokonać rywali własnego typu | eliminacja przez utratę miast |
| Ludność w terenie / Przejmowanie / Wzrost | (jak w arkuszu) | mechanika ludności |

> **Granica:** wartości są parametrami DANE; **algorytm spawnu (rozmieszczenie klastrów, dystanse) implementuje Civ-MAPA/Civ-SILNIK.**

---

## 6. Religia

### 6.1 Zasada
- Każda z 9 cyw. ma **1 religię przypisaną na stałe** (nie do zmiany w grze). Nazwa religii → `civs.json` (`Religia`). Bonusy mechaniczne → `society-params.json` (`religie_cywilizacji`), źródło: `Spoleczenstwo-parametry.xlsx` → arkusz „Religie cywilizacji".
- Kolumny tabeli: `Cywilizacja | Religia / wyznanie | Główne bóstwo / idea | Wpływ na parametry (bonusy) [propozycja, edytowalne]`.

### 6.2 Bonusy religijne (propozycja, edytowalne)
| Cyw. | Religia | Bonusy (skrót) |
|---|---|---|
| Grecy | Politeizm olimpijski | +2 Kultura/turę (Świątynia); +1 Zadowolony na igrzyska; +5 relacji z grupą kulturową |
| Rzymianie | Religia rzymska / kult państwa | +1 Zadowolony (Świątynia); +2 jedność; −5% korupcji; utrata stolicy = −bonusy na 5 tur |
| Chińczycy | Konfucjanizm / Taoizm | +1 Nauka/turę (Biblioteka); −1 kara zagęszczenia; +2 Zadowolenie z ustroju |
| Inkowie | Kult Słońca Inti | +2 Żywność/turę (Farma/Irygacja); +1 Zadowolony; +5% wzrostu populacji w stolicy |
| Zulusi | Kult przodków / animizm | +10 Morale jednostek; +1 Zadowolony per 3 jedn. w garnizonie; +2 jedność |
| Egipt | Religia egipska — faraon-bóg | +3 Kultura/turę z Pałacu; +1 Zadowolony w stolicy; −10% Pracy przy Cudach |
| Sumerowie | Religia sumeryjska — Enlil/Anu | +2 Nauka/turę (Obserwatorium/Biblioteka); +1 Zadowolony per Zikkurat; +5 relacji |
| **Celtowie** | **Religia celtycka (druidyzm)** | **+10 Morale piechoty przy szarży; +2 Kultura/turę (Świątynia/gaj); +1 Zadowolony na święta sezonowe (1 tura co 10)** |
| **Germanie** | **Religia germańska (Wotan/Odyn)** | **+15% Atak w lesie (zasadzka); +2 jedność (drużyna/komitat); +5 relacji z pokrewnymi** |

> Wszystkie liczby = propozycja do strojenia (kolumna „edytowalne"). Mechanika religii (dominacja, szerzenie, konwersja przez świątynie, kary za obcą religię, dyplomacja) — opisana w `Spec-spoleczenstwo.md` + arkusz „Religia" (`Spoleczenstwo-parametry.xlsx`); to obszar **Civ-MIASTO/SILNIK**, nie DANE.

### 6.3 ⚠ Stan synchronizacji
`Spoleczenstwo-parametry.xlsx` ma już **9** wpisów (dodano Celtów i Germanów). `society-params.json` ma jeszcze **7** — wymaga **re-eksportu sekcji `religie_cywilizacji` (7→9)**. To poza lane DANE (society-params.json nie jest plikiem DANE) → **zadanie dla Civ-SILNIK/society** (eksport CELOWANY, nie `export-data.py`).

---

## 7. System jednostek (KIERUNEK — staty robi Civ-UNITS)

### 7.1 Typy standardowe + nazwane zamienniki (§6a)
- Istnieją **standardowe typy** wspólne dla wszystkich: włócznik, łucznik, procarz, oszczepnik, wojownik, wojownik z mieczem i tarczą, konnica, rydwan (woły/konny), galera (+ Kamień: Wojownik, Procarz, Oszczepnik, Łucznik, Zwiadowca, Osadnik, Robotnik).
- Cywilizacja może mieć **nazwany zamiennik** danego typu — kolumna **„W zamian za"** w `Jednostki.xlsx` wskazuje zastępowany typ. Brak zamiennika → używa standardowego.

### 7.2 Super-jednostka (≡ „jednostka specjalna")
- **1 na nację**, bezpłatna, stacjonuje w stolicy, odradza się po utracie stolicy, lepsze staty. **Super-jednostka i „jednostka specjalna" to to samo pojęcie** (decyzja Maciej).

### 7.3 Reguła per-epoka (decyzja Maciej)
- **Kamień:** brak nazwanych zamienników (jednostki standardowe).
- **Brąz:** ≥1 nazwany zamiennik **+ 1 super-jednostka**.
- **Żelazo:** ≥1 nazwany zamiennik.

### 7.4 Stan istniejący (z `units.json`, lane Civ-UNITS) + propozycje
- **Pełny przegląd:** `Jednostki-specjalne-przeglad.xlsx` (zakładki Kamień/Brąz/Żelazo) — tylko jednostki RÓŻNE od standardowych, z kolumną „W zamian za" (standardowa lub poprzednia specjalna).
- **Brąz + super są dla wszystkich 7** (Falanga/Hieros Lochos, Legionista/Evocati, Jeździec chiński/Hu Ben Wei, Impi/uThulwana, Wojownik z toporem/Królewska Gwardia, khopesh/Medżaj, włócznik sum./Gwardia Królewska). Celtowie/Germanie — do zbudowania (PROPOZYCJA).
- **Żelazo (propozycja, 1 wyjątkowa/cyw., FINAŁ DANE):** Grecy=Thorakites, Rzym=Principes, Chiny=Kusznik powtarzalny (+Halabardnik z ji), Inkowie=Gwardzista z champi (brąz/miedź — bez żelaza), Zulusi=iButho z iklwa, Egipt=khopesh żelazny (+Łucznik nubijski), Sumer=Mur tarcz (+Łucznik z pawężnikiem), Celtowie=Miecznik galijski, Germanie=Berserk. 2. jednostka przyjęta dla **Chiny/Egipt/Sumer**.
- Opis broni/stylu + handoff: `PACZKA-DLA-UNITS-od-DANE.md`.

### 7.5 ⚠ Rozjazd nazw (do świadomości UI/SILNIK)
Pole `civs.json → Jednostka specjalna` trzyma jednostkę **ikoniczną** (Falanga, Legion, Kusznik, Impi…), a **mechaniczny super** w `units.json` (kolumna „Super-jednostka"=TAK) bywa inną nazwą (Hieros Lochos, Evocati, Hu Ben Wei, uThulwana). Decyzja (8C): zostawić nazwy w civs.json; przy wyświetlaniu „jednostki specjalnej" konsument ma wiedzieć, że to nazwa ikoniczna, nie zawsze == mechaniczny super.

---

## 8. CONTROL PANEL — parametry sterowalne

| Parametr / dane | Plik źródłowy (Excel) | Arkusz / komórka | Pole JSON (po eksporcie) | Konsument |
|---|---|---|---|---|
| Definicje 9 cyw. (styl, bonus, minus, jedn. spec., religia, Typ główny) | `Cywilizacje.xlsx` | „Cywilizacje" (wiersze 3–11) | `civs.json → cywilizacje[]` | SILNIK/MIASTO/AI/UI |
| Warunki startu + model klastra (90, ~9, typy) | `Cywilizacje.xlsx` | „Start gry" | `civs.json → start_gry[]` | MAPA/SILNIK/AI |
| Bonusy religijne 9 cyw. | `Spoleczenstwo-parametry.xlsx` | „Religie cywilizacji" | `society-params.json → religie_cywilizacji[]` | MIASTO/EKONOMIA/DYPLOMACJA |
| (mechanika religii — progi, szerzenie, konwersja) | `Spoleczenstwo-parametry.xlsx` | „Religia" | `society-params.json → religia` | MIASTO/SILNIK (nie DANE) |

**Jak zmienić parametr:** 1) edytuj komórkę w Excelu (źródło), 2) odpal CELOWANY eksport danego JSON, 3) sprawdź `tsc` loader, 4) commit. Nigdy `export-data.py`/`npm run build`.

---

## 9. PEŁNA LISTA REGUŁ (R1–R15)
- **R1.** Roster = 9 TYPÓW głównych (nie 50 nacji).
- **R2.** „50/70/90" = liczba miast ze spawnu (klastry tego samego typu), nie liczba nacji.
- **R3.** Klaster = 1 gracz + 9 rywali tego samego typu = 10 miast/typ; 9 typów × 10 = 90.
- **R4.** Każda cyw. ma dokładnie 1 religię, przypisaną na stałe (nie do zmiany w grze).
- **R5.** Nazwa religii → `civs.json`; bonusy religii → `society-params.json` (źródło: arkusz „Religie cywilizacji"). Brak duplikacji bonusów w civs.json.
- **R6.** Jednostki: typy standardowe + nazwane zamienniki („W zamian za"); brak zamiennika → standard.
- **R7.** Super-jednostka ≡ jednostka specjalna; 1/nację; Brąz; bezpłatna; stolica; odradza się.
- **R8.** Per-epoka: Kamień brak; Brąz ≥1 zamiennik + super; Żelazo ≥1 zamiennik.
- **R9.** Żelazo: 1 wyjątkowa jednostka/cyw.; 2. dla Chiny/Egipt/Sumer; Inkowie = elita brąz/miedź (bez żelaza).
- **R10.** Inkowie: brak koni/wołów/konnicy/rydwanów (lama=pakowe). Zulusi: brak rydwanów.
- **R11.** `Typ główny` = pole addytywne; wszystkie 9 = true; pod przyszłe sub-nacje.
- **R12.** Nazwa kultury celtyckiej = „Celtowie" (= Galowie, ref-17). „Germanie" bez zmian.
- **R13.** Staty jednostek = Civ-UNITS (`Jednostki.xlsx`); DANE daje tylko kierunek (nazwa/rola/broń/epoka/„W zamian za").
- **R14.** Edycja w Excelu → eksport CELOWANY do jednego JSON. ZAKAZ `export-data.py` i `npm run build`.
- **R15.** Po zmianie danych: `loader.ts` musi się kompilować (`tsc` EXIT=0); żaden inny JSON nie nadpisany.

---

## 10. Zależności (graf)

```
Cywilizacje.xlsx ──► civs.json ──► loader.ts (CivDef, StartGryDef) ──► main.ts/moduły
Spoleczenstwo-parametry.xlsx ──► society-params.json ──► loader.ts (societyParams) ──► moduły religii/miasta
Jednostki.xlsx (UNITS) ──► units.json ──► loader.ts (UnitDef) ──► walka/render
   ▲
   └── DANE dostarcza KIERUNEK (nazwy/role) jednostek specjalnych → UNITS implementuje staty
```
- **civs.json zależy od:** `Cywilizacje.xlsx` (źródło). 
- **Od civs.json zależą:** loader.ts → SILNIK (pętla tury), MIASTO (religia/bonusy per miasto), AI (typy rywali), UI (wyświetlanie), MAPA (start_gry/klaster).
- **Sprzężenie nazewnicze:** `civs.json.Jednostka specjalna` ↔ `units.json` (nazwa) — patrz §7.5.

---

## 11. Interakcje z innymi działami (sesje potwierdzone)

> Sesje projektu (z listy Maciej): **Civ - Master, Civ-EKONOMIA, Civ-Dyplomacja, Civ - Dane Cywilizacji (=DANE/ja), Civ - Units / Battle, Civ MAPA, Civ - Silnik, Civ-UI, Civ-MIASTO, Civ - AI opponent intelligence.** Uwaga: **Units i Battle = JEDNA sesja**; AI = „opponent intelligence".

| Dział (sesja) | Co konsumuje z DANE | Punkt styku / kierunek | Otwarte |
|---|---|---|---|
| **Civ - Silnik** | `civs.json` (cały) przez `loader.ts` | DANE dostarcza dane; SILNIK wpina bonusy cyw./religii do pętli tury; właściciel `main.ts` | dodać `Religia`+`Typ główny` do `CivDef`; re-eksport `society-params.json` (religie 7→9) |
| **Civ - Units / Battle** | `civs.json.Jednostka specjalna` + KIERUNEK z DANE (zamienniki/super/Żelazo) | DANE=kierunek (nazwa/rola/broń/epoka/„W zamian za"); UNITS=staty (`Jednostki.xlsx`); BITWA=cechy bojowe wynikające z charakteru cyw. | zbudować jednostki Celtów/Germanów + Żelazo; spójność nazw §7.5 |
| **Civ-MIASTO** | `society-params.json` (religie_cyw. + religia) + bonusy cyw. | religia per miasto (dominacja/szerzenie/konwersja/zadowolenie/jedność); per-miasto bonusy | czeka na religie 7→9 |
| **Civ-EKONOMIA** | bonusy religijne/cyw. (Kultura/Nauka/Żywność/Pieniądz per turę) | konsumuje liczby bonusów; tu kwantyfikacja bonusów (pas balansu) | kwantyfikacja (wspólnie z DANE) |
| **Civ-Dyplomacja** | religia cyw. + typ | religia → relacje (wspólna +pkt, różna −pkt, misjonarze); relacje rywali tego samego typu | — |
| **Civ - AI opponent intelligence** | typ cyw., bonusy, jednostki specjalne, `start_gry` | steruje ~9 rywalami tego samego typu (klaster); „cel startu = pokonać własny typ"; dobiera bonusy/jedn. spec./religię w decyzjach | — |
| **Civ MAPA** | `civs.json.start_gry` (90 / ~9 / klaster) | implementuje spawn 90 miast / klaster 10 / dystans ~9 pól; rozmieszcza 9 klastrów typów w regionach | impl. algorytmu spawnu |
| **Civ-UI** | nazwa cyw., religia, jednostka specjalna, bonusy | wyświetlanie; uwzględnia rozjazd §7.5 (jedn. ikoniczna vs mechaniczny super) | — |
| **Civ - Master** | — (koordynacja) | recenzja dostaw, dyspozycje (`DANE.md` ↔ `DANE-DO-MASTERA.md`); nie konsument runtime | — |

**Cechy bojowe per cyw. (DANE→Units/Battle, kierunek):** Grecy/Falanga — bracing, neguje szarżę, wrażliwa na flankę; Rzym/Legion — brak kary flanki; Celtowie — premia szarży, kara morale po długiej walce; Germanie — bonus w lesie/zasadzka; Zulusi — szybkie agresywne zwarcie; Egipt/Sumer — rydwany + dystans. Staty = Units/Battle.

---

## 12. Status i otwarte punkty
- ✅ 9 typów + religie + bonus/minus + jednostka specjalna + `Typ główny:true` w `civs.json`; `loader.ts` tsc=0.
- ✅ Religie Celtów/Germanów w źródle `Spoleczenstwo-parametry.xlsx` („Religie cywilizacji" = 9).
- ✅ Kierunek jednostek (Celtowie/Germanie + Żelazo) → `PACZKA-DLA-UNITS-od-DANE.md` + `Jednostki-specjalne-przeglad.xlsx`.
- ⏳ **Civ-SILNIK/society:** re-eksport `society-params.json` (religie_cywilizacji 7→9).
- ⏳ **Civ-SILNIK:** dodać `Religia` + `Typ główny` do `CivDef`.
- ⏳ **Civ-UNITS:** zbudować jednostki Celtów/Germanów + jednostki Żelaza (staty).
- ⏳ **Civ-MAPA/SILNIK:** implementacja spawnu klastrów (90/10/~9 pól).
- ⏳ (opc.) Kwantyfikacja bonusów cyw. (pas balansu, z EKONOMIĄ/SILNIK).

## 13. Historia decyzji (dlaczego tak jest)
- Korekta **7→50→9**: „50" błędnie zinterpretowane jako 50 nacji; faktycznie roster = typy (5→7→9), a 50/70/90 = klastry.
- **1B:** nazwa „Celtowie" (= Galowie, ref-17).
- **8C:** naprawiono stałą jednostkę Inków („Wojownik Jaguar (Holkan)" → „Chaska + Królewska Gwardia"); pozostałe nazwy bez zmian.
- **KOREKTA Q3:** dodano addytywne pole `Typ główny` (wszystkie 9 = true).
- **Jednostki Żelaza:** podejście „1 wyjątkowa/cyw. (+2. dla wybranych)"; Inkowie bez żelaza (elita brązu).
- **super ≡ jednostka specjalna**, nazewnictwo zostawione (bez osobnego pola super w civs.json).

## 14. Konwencje
- Polskie znaki w danych zachowane (`ensure_ascii=False`). Klucze JSON = nagłówki Excela (dosłownie, z diakrytykami).
- Pliki kanału DANE: `dyspozycje/DANE.md` (wsad) + `dyspozycje/DANE-DO-MASTERA.md` (raporty/Q&A).
- Backups źródeł robione przy każdej istotnej zmianie (kopie w outputs sesji).
