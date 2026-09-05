# R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1 — dispatch

TEMAT: `R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1`
RUNDA: 1/5
DATA: 2026-09-05
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Opus 5, effort high; Evaluator — Opus 5, effort high;
Final Control — Sonnet 5, effort high.

## WYZWALACZ (dosłownie, właściciel)

> „Czas sprawdzić wszystkie cywilizacje, ich pierwsze miasto i czy czasem nie ma wśród
> listy miast nazw cywilizacji."

Wynikło ze zgłoszenia etykiety „CHIŃCZYCY"/„SUMEROWIE" na mapie (temat
`R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1`, już zintegrowany).

## RECON — AUDYT PROGRAMOWY WYKONANY, NIE POWTARZAJ GO OD ZERA

Orkiestrator przeszedł **cały** `gra/data/city-names-pools.json`, nie próbkę. Wyniki:

**(A) Pierwsze miasto każdej z 15 cywilizacji jest historycznie sensowne** — Grecy→Ateny,
Rzymianie→Rzym, Chińczycy→Xi'an, Inkowie→Cusco, Zulusi→uMgungundlovu, Egipcjanie→Memfis,
Sumerowie→Uruk, Celtowie→Bibracte, Germanie→Mattium, Harappanie→Harappa, Hetyci→Hattusa,
Słowianie→Kijów, Babilończycy→Babilon, Asyryjczycy→Ninive, Fenicjanie→Tyr. Każda ma
komplet 100 + 10 nazw.

**(B) Obawa właściciela „nazwa cywilizacji na liście miast" — sprawdzona, jedno trafienie
i jest POPRAWNE.** `Harappa` u `harappa` to **eponim**: cywilizacja harappańska nazywa się
OD miasta, nie odwrotnie. **Nie zmieniaj tego.** Jedyny taki przypadek w pliku.

**(C) Dwie pierwsze pozycje historycznie dyskusyjne — ZATWIERDZONE DO ZMIANY przez właściciela.**

**(D) SKALA ROZDZIELENIA LIST, zmierzona: 126 ze 150 nazw państw-miast pokrywa się z listą
miast tej samej cywilizacji.** Pełne pokrycie 10/10: Grecy, Rzymianie, Inkowie, Zulusi,
Egipcjanie, Sumerowie, Celtowie, Germanie, Harappanie. Częściowe: Babilonia 9, Fenicjanie 8,
Asyria 7, Hetyci 6, Słowianie 6. **Zero kolizji ma wyłącznie `chinczycy`** — i to jest
**wzorzec do naśladowania**: nazwy państw-miast jako mniejsze ośrodki i państwa zależne
(`Qin`, `Qi`, `Chu`), nie powtórki stolic. Skutek dzisiejszy: greckie państwo-miasto może
nazywać się **Ateny**, dokładnie jak stolica Grecji.

**(E) POZA ZAKRESEM — nie ruszaj:** 118 nazw powtarza się MIĘDZY cywilizacjami, przeważnie
zasadnie (Sumer i Babilonia dzielą miasta Mezopotamii; Teby greckie i egipskie; Lugdunum
rzymskie i celtyckie; Wolin germański i słowiański). To świadome dziedzictwo historyczne.

## GOAL — trzy pozycje, wszystkie z ECHO właściciela

1. **Asyria: pierwsza pozycja `Ninive` → `Aszur`.** Uzasadnienie: Aszur był pierwotną
   stolicą i **od niego pochodzi sama nazwa Asyrii**; Niniwa dopiero za Sennacheryba.
2. **Fenicja: pierwsza pozycja `Tyr` → `Byblos`.** Byblos i Sydon są starsze; Byblos uchodzi
   za najstarsze stale zamieszkane miasto fenickie.
   **W OBU wypadkach dotychczasowa nazwa ZOSTAJE na liście dalej** — zmienia się wyłącznie
   pierwsza pozycja, nie skład listy.
3. **Rozdzielenie list państw-miast od list miast — ~126 nowych nazw.** Dla każdej
   cywilizacji lista `miasta_panstwa` ma przestać powtarzać nazwy z `miasta_cywilizacji`.
   Nowe nazwy mają być **historycznie osadzone w kręgu kulturowym danej cywilizacji**,
   wzorem chińskiego: mniejsze ośrodki, państwa zależne, miasta prowincjonalne.

## KRYTERIA KOŃCA (binarne)

1. `miasta_cywilizacji[0]` dla `asyryjczycy` to `Aszur`, dla `fenicjanie` to `Byblos`.
   `Ninive` i `Tyr` **nadal obecne** na swoich listach, tylko na dalszych pozycjach.
2. **Przecięcie `miasta_panstwa` z `miasta_cywilizacji` jest PUSTE dla każdej z 15
   cywilizacji.** Bramka liczy to programowo, nie na próbce.
3. Każda cywilizacja ma nadal **dokładnie 100** nazw w `miasta_cywilizacji` i **dokładnie 10**
   w `miasta_panstwa`. Żadna lista się nie skurczyła ani nie urosła.
4. **Brak duplikatów wewnątrz jednej listy** i brak duplikatów między `miasta_panstwa`
   a `miasta_cywilizacji` tej samej cywilizacji.
5. Nowa bramka `gra/tools/nazwy-miast-rozlaczne-pule-test.cjs` sprawdza punkty 1-4
   i **czerwienieje po cofnięciu zmiany** — pokaż wynik po mutacji.
6. `tsc --noEmit` zielone; `city-names-pool-test`, `city-names-pools-test`, `civ-names-test`,
   `mapa-etykieta-stolicy-test`, `display-names-test` zielone.
7. Pięć bramek referencyjnych zielonych: logic 213/213, tech-tree 19/19, research 33/33,
   unit-replace 13/13, combat 6/6.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

**Zakaz wymyślania nazw „brzmiących podobnie".** Każda z ~126 nowych nazw ma być **realnym
toponimem** z kręgu kulturowego danej cywilizacji albo nazwą poświadczoną historycznie
jako ośrodek zależny. Wymyślona nazwa fonetycznie pasująca do reszty listy przejdzie
bramkę na rozłączność i **nikt jej nie wyłapie** — dlatego w raporcie podaj, **skąd wzięta
jest każda grupa nazw** (region, epoka, typ ośrodka), a dla wątpliwych pozycji dopisz notę.

**Drugi tryb: rozwiązanie problemu przez usunięcie.** Rozłączność da się osiągnąć trywialnie,
skracając listę państw-miast. Kryterium 3 (dokładnie 10 pozycji) jest po to, żeby to
wykluczyć — nie obchodź go.

**Trzeci tryb: `uMgungundlovu` i inne długie nazwy.** Temat etykiety mapy został właśnie
zamknięty przy budżecie 305 px, dobranym do NAJDŁUŻSZEJ nazwy pierwszej pozycji. Jeśli
którakolwiek NOWA nazwa jest dłuższa niż `uMgungundlovu` (213,9 px przy `700 22px Georgia`)
**i trafia na pierwszą pozycję** — zgłoś to, bo cofa świeżo zamknięty temat. Na dalszych
pozycjach długość nie ma znaczenia (przycięcia poza pierwszą piętnastką są poza zakresem).

## ALLOWLISTA

- `gra/data/city-names-pools.json`
- `gra/tools/nazwy-miast-rozlaczne-pule-test.cjs` (NOWY)
- istniejące bramki nazw — wyłącznie aktualizacja zaszytych wartości, jawnie uzasadniona
- `dyspozycje/autobot/runs/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1/`

Zakazane bezwzględnie: `gra/src/main.ts`, `gra/src/**` (temat jest wyłącznie danymi —
jeśli okaże się, że potrzebna jest zmiana w kodzie, **zatrzymaj się na `DECISION_REQUIRED`**),
pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA

Worktree `/home/user/wt-nazwy-miast`, gałąź `autobot/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1`,
baza jawnie: `origin/main` na SHA podanym przy zakładaniu worktree.

C-001 (bariera CHRONIONA), brzmienie dosłowne z `playbook.md`: „Zakaz `npm run build`/`dev`
w `gra/` (export-data nadpisuje JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js
build --outDir dist --emptyOutDir". **Ta bariera jest w tym temacie szczególnie istotna:
`export-data` NADPISUJE pliki JSON, a Ty edytujesz właśnie plik JSON.** Jedyna dozwolona
kompilacja: `node ./node_modules/typescript/bin/tsc --noEmit`.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i konkretną poprawkę. Runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

Nie integrujesz, nie deployujesz, nie pushujesz. Zakaz `git add -A` i `git add .`.
Raport maksymalnie ok. 400 słów. **Raport commituj OD RAZU po zapisaniu** — dwa restarty
kontenera w tej sesji skasowały pracę trzymaną w pamięci procesu.

## OBIEG

Operator → Evaluator → (Obrona, jeśli lista zarzutów niepusta) → koniec skryptu.
Final Control osobnym wywołaniem Workflow. Integracja i deploy — ręką orkiestratora.

---

# RATYFIKACJA ORKIESTRATORA (2026-09-05)

## Zarzut 1 — ALLOWLISTA ROZSZERZONA o `gra/data/civs.json`

Rozszerzenie **przyznane**. `validateCityNamesPools` (`gra/src/game/civ-names.ts:167-172`)
wymaga `nazwyKlastra === miasta_panstwa`, więc bez zmiany `civs.json` kryterium 6 jest
**mechanicznie nieosiągalne** — nie jest to poszerzanie zakresu, tylko konsekwencja
walidatora, którego dispatch nie przewidział. To **plik danych**, nie kod; `gra/src/**`
pozostaje zakazane bez zmian.

Zakres dopuszczony wąsko: **wyłącznie pole `nazwyKlastra`**, wyłącznie dla tych cywilizacji,
którym zmieniono `miasta_panstwa`. Evaluator potwierdził, że zmiana jest chirurgiczna
(14× `nazwyKlastra`) — ma taka pozostać.

## Zarzut 2 — obrona (b) PRZYJĘTA, sprawa idzie do OSOBNEGO tematu

Obrona wykazała dowodem, że **ścieżka produkcyjna jest nietknięta**:
`playerStartCityName(civs,'grecy',pools) === 'Ateny'` stoi zielone i niezmienione
(`city-names-pool-test.cjs:56`). Zmieniona asercja (`civ-names-test.cjs:53`) testuje
**wyłącznie fallback bez puli**, a `civ-names.ts:48-52` opisuje ten defekt jako **znany
i naprawiony tylko na ścieżce z pulą**. Zarzut „bramka błogosławi regresję" nie stoi:
bramka nadal pilnuje ścieżki, którą realnie chodzi gra.

**Ale znalezisko jest realne i nie znika.** Po rozdzieleniu pul awaryjna stolica bez puli
to dla 14 cywilizacji drugorzędny ośrodek (Grecy `Sykion`, Rzymianie `Nola`, Egipt `Tinis`,
Asyria `Ekallatum`) zamiast stolicy właściwej. **Wcześniej ta ścieżka działała tylko dlatego,
że pule się pokrywały** — czyli opierała się na defekcie, który ten temat właśnie usuwa.
To jest ta sama klasa błędu co „stolica nazwana od państwa", tylko w martwej ścieżce.

**Orkiestrator zakłada osobny temat** `P-CIV-NAMES-FALLBACK-BEZ-PULI-Q1` (wymaga
`gra/src/game/civ-names.ts`, poza allowlistą tematu danych). **Nie jest to brak węzła
bieżącego** i nie ma być tak orzekane.

## Zarzuty 4, 5, 6 — TRAFIONE I NAPRAWIONE, dokładnie ta warstwa, o którą chodziło

`Antinoupolis` (fundacja Hadriana, 130 n.e.), `Karanis` (ptolemejska, III w. p.n.e.)
i `Meklemburg` (spolszczona nazwa niemiecka zamiast grodu obodryckiego) to **dokładnie
te błędy, których żadna bramka nie wykryje** — dispatch mówił wprost, że weryfikacja
historyczna jest jedyną niezautomatyzowaną warstwą kontroli tego tematu, i ta warstwa
zadziałała. Podmiany (`Hebenu`, `Tjebu`, `Uznam`) przyjęte; przy okazji udział form
greckich na liście egipskiej spadł z 6/10 do 4/10, co jest poprawą samą w sobie.

## Zarzut 7 — ODRZUCENIE OBRONY PRZYJĘTE

`Assur` → `Aszur` to **ta sama nazwa w dwóch transliteracjach**, a nie zmiana składu listy.
Trzy binarne kryteria (1: dosłownie `Aszur` na pozycji 0; 3: dokładnie 100 pozycji;
4: brak duplikatów) wymuszają dokładnie tę operację. Zdanie dispatchu „zmienia się wyłącznie
pierwsza pozycja, nie skład listy" dotyczyło **zachowania `Ninive` i `Tyru`** — i one
zostały. Obrona ma rację.

## Do wiadomości Final Control

Zmierzona liczba kolizji przed zmianą to **125**, nie 126 jak podawał mój recon
(`celtowie` 9, bo `Závist` ≠ `Zavist` różnią się diakrytykiem). Wymieniono i tak wszystkie
140 pozycji, bo warianty transliteracji (`Kanesh`/`Kanesz`, `Kiev`/`Kijów`,
`Carchemish`/`Karkemisz`) to duplikaty faktyczne. **Rozbieżność 125 vs 126 jest po mojej
stronie, nie po stronie wykonawcy** — nie stawiaj z tego zarzutu.
