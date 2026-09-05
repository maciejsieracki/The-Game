# R-PRAWO-PRZEBUDOWA-SKALI-Q1 — dispatch

TEMAT: `R-PRAWO-PRZEBUDOWA-SKALI-Q1`
RUNDA: 1/5
DATA: 2026-09-05
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high.

## WYZWALACZ (właściciel)

> „Podobnie jak szczęście, przeanalizujmy kwestię prawa, aby lepiej zbalansować ten element."

Analiza odbyła się w głównym czacie. **Wszystkie liczby poniżej pochodzą OD WŁAŚCICIELA.**
Pełny wywód i uzasadnienie każdej decyzji: [`dyspozycje/BALANS-PRAWO-PRZEBUDOWA.md`](../../../BALANS-PRAWO-PRZEBUDOWA.md)
— **przeczytaj ten plik W CAŁOŚCI, zanim cokolwiek napiszesz.** Ten dispatch jest listą
wykonawczą, nie wykładem; powody są tam.

## CO BYŁO ZŁE — diagnoza w trzech zdaniach

Prawo nigdy nie spadało poniżej 91%, bo budynki administracyjne wysycały skalę, a garnizon
wojskowy (+20/jednostkę, do pięciu jednostek) dokładał kolejne 100 punktów ponad to.
Skutek: **samo Szczęście nie mogło wywołać buntu** — `PorPct = 0,5×szPct + 0,5×prawPct`,
więc miasto z zerowym Szczęściem i saturowanym Prawem lądowało na 45,5% (Niepokój), a Bunt
wymaga `prawPct < 24%`. Prawo było martwą połową Porządku.

## DECYZJE WŁAŚCICIELA — WIĄŻĄCE, NIE PODLEGAJĄ PONOWNEJ OCENIE

### D1. Jednostki wojskowe NIE WCHODZĄ do skali `prawMax`

Garnizon wojskowy (+20/jednostkę) **zostaje w grze bez zmian** jako doraźny ratunek ponad
skalą. Właściciel powiedział wprost: *„zostawiamy dalej garnizon wojskowy pod kątem
normalnego wojska, które może stacjonować dalej na prawo. Ja tylko mówiłem, że nie powinien
być potrzebny przy normalnej rozbudowie budynku."*

**Konsekwencja dla `prawMax`: kalibracja liczy WYŁĄCZNIE budynki.** Właściciel powtarzał to
wielokrotnie, ostatni raz ostro: *„Mówiłem ci po raz dziesiąty, nie liczymy tutaj, nie
dokładamy jednostek wojskowych w tym wyliczeniu. To jest ostateczność, ratowanie sytuacji;
to nie jest stałe rozwiązanie."* **Wciągnięcie jednostek do kalibracji = FAIL.**

### D3/D3a/D3b. `prawo_max_epoka` — nowa tabela, zależna od trudności

| | Epoka 1 | Epoka 2 | Epoka 3 |
|---|---|---|---|
| **easy** | **35** | **55** | **75** |
| **normal** | **40** | **65** | **85** |
| **hard** | **45** | **75** | **100** |

Kalibracja: **miasto ZWYKŁE (nie stolica)** z kompletem budynków epoki, wliczając nowy
budynek Garnizon. Sumy z budynków: **53 / 85 / 121**.

`prawo_max_epoka` jest **celowo NIŻSZE** niż suma budynków — dzięki temu małe miasto
z kompletem administracji przebija 100%, a nadwyżka jest widoczna pod sufitem 170.

**Dlaczego per trudność (D3a):** po D4 (współczynnik 0,04 płasko) Prawo nie miałoby już
ANI JEDNEGO parametru różnicującego trudność, więc połowa Porządku przestałaby reagować
na wybór poziomu. Zasada jak w G13 Szczęścia: **trudność wyrażana WYŁĄCZNIE mianownikiem.**

**Dlaczego epoka 2 z 75 na 65 i epoka 3 ze 100 na 85 (D3b):** przy starych liczbach epoki
nie tworzyły rosnącego ciągu (9,2 → 5,2 → 6,9 obywatela). Po poprawce: **9,2 → 8,8 → 11,0**.

### D4. `prawo_max_pop_wspolczynnik` = **0,04** na wszystkich trzech poziomach

Było 0,033 / 0,041 / 0,049. Ten sam współczynnik co dla Szczęścia — wielkość miasta ma
obciążać oba filary Porządku identycznie.

`prawMax_miasta = prawo_max_epoka[epoka] × 1,04 ^ max(0, pop − prawo_max_pop_odniesienia)`,
gdzie `prawo_max_pop_odniesienia` = 2 (BEZ ZMIAN).

### D5. Dwie kary USUNIĘTE NA STAŁE

- `prawo_kara_brak_garnizonu` (−2)
- `prawo_kara_podboj_bez_garnizonu` (−3)

Właściciel: *„Tak, te kary można usunąć."* Powód: brak Garnizonu jest już ukarany tym, że
budynek nie daje swoich punktów — druga kara za to samo jest podwójnym liczeniem.

**Usuń je NA STAŁE:** z `gra/data/society-params.json`, z typów, ze wszystkich miejsc
użycia w kodzie. Zostawienie martwego klucza „na wszelki wypadek" jest zabronione — ten
projekt ma już za sobą siedem martwych parametrów Szczęścia, których nikt nie umiał wyjaśnić.

### D6. `prawo_bonus_osiedle_pop` = **28 / 20 / 14 / 8** — BEZ ZMIAN

Właściciel rozstrzygnął jawnie: zostawić. Nie ruszaj.

### D7. `prawo_pct_cap` = **170** (było 100)

Zapas nad setką jest potrzebny, żeby nadwyżka pałacu i małych miast była widoczna zamiast
ścinana do 100%. **Uwaga:** `computePorPct` używa tego samego capa co składowa — sprawdź,
czy podniesienie go do 170 nie przepuszcza `PorPct` powyżej sensownej granicy, i **zgłoś
pomiar w raporcie**. Jeśli okaże się, że `PorPct` potrafi teraz przekroczyć 120% (cap
Szczęścia), to jest `DECISION_REQUIRED`, nie samodzielna korekta.

## CZEGO TEN TEMAT NIE ROBI

- **Nie tworzy budynku Garnizon** — robi to `R-BUDYNEK-GARNIZON-NOWY-Q1` (osobny temat,
  osobna gałąź). Ten temat **zakłada**, że Garnizon istnieje z wagami Prawa 25/35/47.
  Jeśli w bazie go nie ma — **zatrzymaj się ze statusem `BLOCK`**, nie dodawaj go sam.
- **Nie rusza obrony cywilnej / Milicji** — to `P-MILICJA-OBRONA-CYWILNA-Q1` (D8).
- **Nie rusza niczego po stronie Szczęścia.** `szczescie_*` zamknął
  `R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`. Jeśli zobaczysz tam coś podejrzanego — zgłoś
  w OBSERWACJACH, nie poprawiaj.
- **Nie zmienia wag `porzadek_waga_szczescie`/`_prawo`** (0,5/0,5 na normal). Poza zakresem.

## KRYTERIA KOŃCA (binarne)

1. `gra/data/society-params.json`: `prawo_max_epoka` = `[35,55,75]` / `[40,65,85]` /
   `[45,75,100]`; `prawo_max_pop_wspolczynnik` = 0,04 ×3; `prawo_pct_cap` = 170 ×3;
   `prawo_bonus_osiedle_pop` NIETKNIĘTY.
2. Klucze `prawo_kara_brak_garnizonu` i `prawo_kara_podboj_bez_garnizonu` **nie występują
   w całym repo** — ani w danych, ani w kodzie, ani w typach. Udowodnij grepem, wynik
   wklej do raportu (ma być zero trafień poza dokumentacją i tym dispatchem).
3. **Nowa bramka `gra/tools/prawo-przebudowa-skali-test.cjs`** z asercjami:
   - **3a** — tabela `prawo_max_epoka` co do cyfry, wszystkie 9 wartości, per trudność;
     plus asercja, że wartości **różnią się między trudnościami** (inaczej bramka nie
     odróżni „wczytano z JSON" od „wzięto fallback z TS");
   - **3b** — „ilu obywateli epoka umie rządzić na 100%" = `2 + ln(budynki/prawMax)/ln 1,04`
     dla trzech epok i trzech trudności; wartości normalne **9,2 / 8,8 / 11,0** (±0,15).
     **Policz je sam z danych, nie przepisuj z tego dispatchu** — i zgłoś rozbieżność,
     jeśli ją znajdziesz, zamiast dopasowywać test do tabeli;
   - **3c** — ciąg „ilu obywateli" jest **rosnący od epoki 2 do 3** na każdej trudności
     (to jest sedno D3b — bez tej asercji siodło wróci przy następnej epoce);
   - **3d** — `prawMax` miasta pop 12 i pop 20 w każdej epoce, na każdej trudności;
   - **3e** — suma Prawa z budynków miasta ZWYKŁEGO = 53/85/121, przy zwiniętych łańcuchach
     ulepszeń. **UWAGA — pułapka:** ulepszenie USUWA poprzednika z `builtIds`
     (`building-resource-gate.ts:357`). Miasto z kompletem ma `dom_starszyzny` ALBO
     `dwor_zarzadcy` ALBO `pretorium`, nigdy wszystkie trzy. Orkiestrator sam się na tym
     pomylił i musiał korygować całą analizę;
   - **3f** — Pałac jest `lokalizacja: stolica`, urzędy `lokalizacja: region` — rozłączne.
     Kalibracja dotyczy miasta zwykłego, więc pałac NIE wchodzi do 53/85/121;
   - **3g** — skan negatywny: dwa usunięte klucze kar nie występują w źródle;
   - **3h** — `prawo_pct_cap` = 170 i pomiar, do ilu realnie dochodzi `PorPct` w mieście
     wzorowo zarządzanym;
   - **3i** — **parytet panel ↔ silnik**: `cityPanel.ts` i `society-breakdown.ts` dają dla
     tego samego wejścia identyczną rozpiskę Prawa, linia po linii. Nie porównuj funkcji
     z samą sobą — zbuduj panel i URUCHOM go (wzorzec: `szczescie-przebudowa-skali-test.cjs`
     sekcja 2i(8), która robi dokładnie to przez esbuild + jsdom).
4. `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
5. Pięć bramek referencyjnych zielonych: `logic-test.cjs` 213/213, `tech-tree-test.cjs`
   19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6.
6. **Cała rodzina Prawa/Porządku zielona.** Wyznacz ją sam grepem po `gra/tools/`
   (`prawo`, `porzadek`, `order`, `society`, `law`, `garnizon`, `conquest`), wypisz listę
   i wynik każdej. Bramkę asertującą uchyloną mechanikę **przepisz, nie usuwaj** — liczba
   asercji w żadnym pliku nie może spaść bez uzasadnienia per pozycja.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Tryb pierwszy — STROJENIE LICZB WŁAŚCICIELA.** Wszystkie liczby są jego, żadna nie jest
do „poprawienia". Jeśli uznasz którąkolwiek za błędną — `DECISION_REQUIRED` z pomiarem,
nigdy samodzielna zmiana. To jest najcięższe naruszenie w tym temacie.

**Tryb drugi — WCIĄGNIĘCIE WOJSKA DO KALIBRACJI.** Najłatwiejsza droga do „ładnych" liczb
Prawa prowadzi przez doliczenie garnizonu wojskowego. Właściciel odrzucił to dziesięć razy.
Kalibracja `prawMax` = **wyłącznie budynki**.

**Tryb trzeci — ŁAŃCUCHY ULEPSZEŃ.** Patrz kryterium 3e. Sumowanie `dom_starszyzny`
+ `dwor_zarzadcy` + `pretorium` daje zawyżone liczby i wygląda wiarygodnie.

**Tryb czwarty — STOLICA ZAMIAST MIASTA ZWYKŁEGO.** Pałac daje 35–55 Prawa i jest
`lokalizacja: stolica`. Kalibracja na stolicy zawyża wszystko o kilkadziesiąt punktów.
Orkiestrator popełnił dokładnie ten błąd i właściciel go poprawił.

**Tryb piąty — TEST TAUTOLOGICZNY.** Dla KAŻDEJ z sekcji 3a–3i pokaż mutację, która
czerwieni dokładnie tę sekcję, podaj liczbę faili, cofnij (przez KOPIĘ pliku, nie
`git checkout`) i udowodnij `git diff --quiet`.

## ALLOWLISTA

- `gra/data/society-params.json`
- `gra/src/game/society-breakdown.ts`
- `gra/src/game/order.ts`
- `gra/src/game/post-capture-law.ts` (wyłącznie usunięcie kary z D5)
- `gra/src/game/conquest-stability.ts` (j.w.)
- `gra/src/ui/cityPanel.ts` (wyłącznie tor Prawa — parytet z silnikiem, kryterium 3i)
- `gra/tools/prawo-przebudowa-skali-test.cjs` (NOWY)
- `gra/tools/*` — bramki asertujące uchyloną mechanikę Prawa, **wyłącznie przepisanie
  asercji na nowy kontrakt**; zakaz usuwania i osłabiania
- `dyspozycje/autobot/runs/R-PRAWO-PRZEBUDOWA-SKALI-Q1/` (raporty etapów)

Zakazane bezwzględnie: `gra/src/main.ts`, `gra/data/buildings.json` (trzyma go
`R-BUDYNEK-GARNIZON-NOWY-Q1`), wszystkie klucze `szczescie_*`, pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`.
Zakaz `git add -A` i `git add .` — dodawaj po jawnych ścieżkach.

## BLOKADA — ten temat NIE startuje przed `R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1`

**Decyzja właściciela z 2026-09-05: „Naprawić listę AI PRZED wejściem Prawa."**

Powód, zmierzony: AI nie zbuduje **19 z 41** budynków, a **cała grupa „Prawo i administracja"
jest dla niego niewidzialna** (`dwor_zarzadcy`, `trybunal`, `palac_ii`, `palac_iii`,
`pretorium`, `sad`). W epoce 3 AI zna **3 z 13** budynków. Gdyby Prawo weszło pierwsze,
miasta AI wylądowałyby w epokach 2-3 na `prawPct` rzędu 30-40% — w paśmie Niepokoju,
blisko Buntu — **nie z powodu balansu, tylko z powodu tej luki**. Właściciel zobaczyłby
w playteście bunty u rywali i szukałby przyczyny w liczbach, których nie ma sensu ruszać.

## IZOLACJA

Worktree `/home/user/wt-prawo-skala`, gałąź `autobot/R-PRAWO-PRZEBUDOWA-SKALI-Q1`,
baza wskazana jawnie przy zakładaniu worktree — **musi zawierać zintegrowane Szczęście,
Garnizon ORAZ `R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1`** (§2b: wszystkie trzy trzymają
pliki, których ten temat dotyka, i muszą wejść pierwsze).

PRZED jakąkolwiek pracą: `git -C /home/user/wt-prawo-skala log -1 --oneline` i
`git status --short`. Oczekiwana baza i czyste drzewo. Rozbieżność → `BLOCK`, bez zapisu
(§2b, reguła jednego pisarza na worktree).

C-001 (bariera CHRONIONA), brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/`
(export-data nadpisuje JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js
build --outDir dist --emptyOutDir". Jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`. `--outDir` poza drzewem repo,
z UNIKALNYM sufiksem (PID albo losowy).
**SZCZEGÓLNA OSTROŻNOŚĆ:** ten temat zmienia plik danych, a `export-data` nadpisuje JSON-y.
Po każdej serii zmian: `git diff --stat gra/data/`.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 idzie na TYM SAMYM
ID i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Przy decyzji produktowej zatrzymujesz się
ze statusem `DECISION_REQUIRED`. Raport ok. 400 słów, destylat.

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.
