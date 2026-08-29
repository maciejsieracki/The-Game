---

# 02 — EVALUATOR (runda 1)

```
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T5
GOAL: Audytować i podnieść do standardu serii Opus 5 (zmierzona geometria, sekcja
      historyczna ze źródłami, real-render dowód) cztery jednostki mezopotamskie
      epoki Żelaza: Garnizon Harappy, Gwardia hetycka, Mur tarcz (Sargonid),
      Piechota neobabilońska.
ZMIANY/COMMIT: zweryfikowane `47416068`, merge-base `559227b9`. Diff od merge-base
      (§9 poz.9 — NIE naiwny origin/main..): 4 pliki, +1581/−24, wszystkie w allowliście.
TESTY (własne uruchomienie, nie odczyt raportu): temat 72/72 · tsc 5.9.3 EXIT=0 ·
      vite build (binarka, --outDir poza repo) EXIT=0 · logic 213/213 · tech-tree 19/19 ·
      research 33/33 · unit-replace 13/13 · combat 6/6 · T1 29/29 · T2 40/40 ·
      T3 38/38 · T4 55/55 · zelazo-gate 24/24
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control (osobny subagent, Sonnet 5 High)
DEPLOY/PUSH: NIE WYKONANO. `git merge-base --is-ancestor 47416068 origin/main` → NIE.
      `main` = afbd3b8d, nietknięty. `git merge-tree` od merge-base: 0 konfliktów.
```

**MODEL WYKONUJĄCY MNIE: Opus 5, ID `claude-opus-5[1m]`**, `CLAUDE_EFFORT=high` — odczytane ze środowiska tej sesji (rząd 1 wg §13a). Dispatch wymaga Opus 5 High dla Evaluatora (§5a, wyjątek graficzny) — **zgodne**.

---

## Metoda — nie ufałem ani jednej liczbie Operatora

Własny worktree `/home/user/wt-eval-ZELAZO-AUDYT-T5` + drugi, kasowalny, na merge-base (usunięty po użyciu, §9 poz.10 sprawdzone). **Własny harness real-render**, niezależny od testu Operatora: własna implementacja SAT na OBB (15 osi), własne liczenie normalnych z trójkątów w układzie świata — a części identyfikuję **po wymiarach `BoxGeometry` i kolorze materiału, nigdy po `name`**. To celowe: nazwy dodał Operator, więc pomiar po nazwach nie zmierzyłby wersji PRZED audytem. Mój harness mierzy oba stany tym samym kodem.

## Trzy znaleziska — potwierdzone WŁASNYM pomiarem

| # | Co | Mój pomiar PRZED | Mój pomiar PO | Operator |
|---|---|---|---|---|
| A1 | włócznia w **własnym ramieniu** Muru tarcz | `UPARM ↔ drzewce = 0,0365`; `FOREARM ↔ drzewce = 0,0295` | wpis UPARM **znika**; zostaje `FIST 0,0325` + `FOREARM 0,0244` (chwyt) | 0,0365 / 0,0295 → 0,0244 / 0,0325 / ramię 0,0000 |
| A2 | przedramię **na wylot przez tarczę** | `FOREARM ↔ deska = 0,0373`; `FOREARM ↔ pole gracza = 0,0303` | oba wpisy **znikają całkowicie** | 0,0373 / 0,0303 |
| A3 | tarcza jednostki 10/7 mniejsza niż tarcza 8/5 | pole gracza 0,170×0,340; **nie przecina osi ciała** (minX=+0,045), pokrywa **25%** szerokości torsu | 0,230×0,380; przecina oś (minX=−0,073), pokrywa **90,6%** | 94% (mierzone na pudełku tarczy, nie na płycie — różnica celu pomiaru, nie rozbieżność) |

**Zgodność co do czwartego miejsca po przecinku.** A1 i A2 są realnymi błędami, nie kosmetyką — i A2 widać gołym okiem: na moim zrzucie PRZED z kamery gry blada, cielista płyta przedramienia sterczy **przed** tarczą, a tarcza stoi obok tułowia zamiast go zasłaniać; na zrzucie PO obie rzeczy są naprawione.

## Czego Operator NIE zepsuł — dowód, nie deklaracja

Zbudowałem w żywym Chromium **cały roster przez faktyczny dispatch**: 75 nazw PL + 75 EN = 150 wpisów, odcisk = liczba mesh + posortowane światowe AABB każdego mesh.

```
WPISÓW: 150     RÓŻNIĄCYCH SIĘ: 5
  PL::Mur tarcz (Sargonid)   35:b4ddd55a -> 35:b52351f2   <- JEDYNA zmiana geometrii
  EN::Hittite Guard          28:586900dc -> 34:6c30d999
  EN::Neo-Babylonian Infantry 28:586900dc -> 37:d3472cfb
  EN::Shield Wall (Sargonid) 28:586900dc -> 35:b52351f2   <- ten sam odcisk co PL
  EN::Harappan Garrison      28:586900dc -> 37:274c55a9
```

Trzy rzeczy naraz: (1) geometria ruszyła się **dokładnie tam, gdzie pomiar pokazał błąd, i nigdzie indziej** — pozostałe 74 jednostki PL mają odcisk co do cyfry identyczny; (2) nowe rdzenie `shield wall`/`hittite guard` **nie przechwyciły żadnej innej jednostki** (realne ryzyko, sprawdzone, nie założone); (3) alias EN prowadzi do **tego samego modelu** co PL, nie do innego.

Dodatkowo, po stronie diffu: **każda usunięta linia niekomentarzowa leży wewnątrz `buildMurTarcz`**. Zero usuniętych plików, zero sekretów (trafienia grepa to `perTokenGeos`), zero plików procesu/`WERSJE.md`/`playbook.json` w diffie.

## Błąd klasy T2 — sprawdzony niezależnie, nie ma go

`camera.ts:132` elewacja 52°, `camera.ts:123` `this.yaw = 0` z komentarzem „fixed angle" (rząd 2, nie pamięć) → kierunek patrzenia `(0; −0,7880; −0,6157)`. Policzyłem normalne z **faktycznych trójkątów** pól w kolorze gracza:

```
Gwardia hetycka   n=(−0,199; 0; 0,980)  dot=−0,604   ZWRÓCONA DO KAMERY
Piechota neobab.  n=(−0,179; 0; 0,984)  dot=−0,606   ZWRÓCONA DO KAMERY
Mur tarcz         n=( 0;     0; 1    )  dot=−0,616   ZWRÓCONA DO KAMERY
Garnizon Harappy  n=(−0,179; 0; 0,984)  dot=−0,606   ZWRÓCONA DO KAMERY
```

Liczby Operatora (−0,603/−0,606/−0,616/−0,606) potwierdzone. Pozostałe trzy jednostki: **zero** przenikania broni przez ciało — jedyne styki broni to `FIST↔rękojeść` (0,011–0,035), w paśmie zaakceptowanego modelu Falangi z T3 (pięść 0,0335). `maxR` 0,270–0,666 przy limicie heksu 0,866. Nowa, większa tarcza Muru tarcz **nie** wchodzi w nogi ani w ziemię (dół na y=0,008 przy minY=0,000).

## Nietautologiczność — uruchomiłem macierz sam

72/72, `EXIT=0`. Macierz ablacyjna przeszła u mnie w całości: 11 osobnych bundli, w każdym jedna podmieniona linia, każda z H1–H11 czerwienieje **pod swoją** mutacją; sprzężenia M1→H3, M8→H7, M9→H1 są fizycznie wymuszone, nie przypadkowe. (D) osobno: bez czterech aliasów EN padają A5–A8, A1–A4 zostają zielone. Sprawdziłem też, czy wyłączenie pięści/przedramienia z H1 nie oślepia testu na błąd A1 — **nie oślepia**: A1 był w RAMIENIU, którego H1 nie wyłącza, a mutacja M1 to potwierdza empirycznie.

## C-001 i granice §9

Uruchomiłem build **własnym poleceniem**: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/... --emptyOutDir` → `EXIT=0`, 848 modułów. Po nim i po teście tematu (który też buduje): `git status --porcelain` **pusty**, `gra/dist` **nie istnieje**, `gra/data/*.json` bez zmian. Zero `npm run`, zero `npx`, zero `git add -A`. Poz. 1/2/3/4/5/7/8/9/10 czyste.

## Sekcje historyczne — sprawdzone własną wiedzą, źródło po źródle

Rzetelne i nietypowo uczciwe. Zweryfikowałem punktowo: upadek Hattusy ok. 1180 p.n.e. i aneksja Karkemisz przez Sargona II w **717 p.n.e.** ✓; KBo 1.14 jako list o żelazie z Kizzuwatny ✓; Woolley, „Carchemish" II–III ✓; państwo nowobabilońskie 626–539, Nabuchodonozor II 605–562 ✓; **Brama Isztar nie nosi gwiazd, tylko muszchuszu i tury** — to jest detal, na którym większość opracowań się myli, i jest tu poprawnie rozstrzygnięty ✓; „Sargonid" = ostatnia dynastia asyryjska 722–609, nie Sargon Akkadzki ✓; Stela Sępów ok. 2450 ✓, Sztandar z Ur ok. 2600 ✓, Lakisz 701 ✓; Harappa dojrzała 2600–1900, żelazo w Azji Płd. 1800–1200 (Malhar, Raja Nala ka Tila, Dadupur), upowszechnienie ok. 1000 z Painted Grey Ware ✓; teza Wheelera o „masakrze"/najeździe aryjskim odrzucona, odczyt Kenoyera ✓; Arrian „Indike" 16 (szeroki miecz, tarcza ze skóry) ✓; Herodot VII.65 („wełna drzewna", trzcinowe łuki, żelazne groty) ✓; „Kapłan-Król" z Mohendżo-Daro, Karaczi ✓; karneol harappański w Grobach Królewskich w Ur ✓; bawełna z Mehrgarh ✓.

**Trzy twarde anachronizmy są NAZWANE, nie zamiecione** — hetycki (imperium upada na progu epoki), sargonidzki (Sumerowie + Sargonid = ~1300 lat rozjazdu), harappański (epoka brązu z definicji). Rozstrzygnięte jako decyzja badawcza Operatora zgodnie z §10, `units.json` poza allowlistą i **nietknięty** — potwierdzam, że nie został ruszony. To jest właściwe zastosowanie §10, nie unik.

---

## UWAGI — klasyfikacja wg §3b

### Uwaga 1 (istotna, ale NIE blokująca — dowód motywacji, nie dowód wykonania)

**Uzasadnienie znaleziska A3 nie broni się.** Operator napisał — w raporcie, w komentarzu `units.ts` i w nagłówku pliku — że ścieżka angielska jest „**realna, nie teoretyczna**", cytując `battleScene.ts: modelName = stats['Jednostka'] ?? bu.nazwa`. Prześledziłem wszystkie żywe miejsca budowy modelu:

- `testBattle.ts:372` → `stats: row` (pełny wiersz `units.json`),
- `main.ts:21954` → `stats: def` (`unitDefFor(u)`, też pełny wiersz), `nazwa: u.typeId` = nazwa **PL**,
- `unitMiniPreview.ts:90` → `buildUnitModel(cat, color, u.Jednostka)` — PL,
- `units.ts:5418/5436` → `typeId` z mapy świata — PL.

W każdym z nich `stats['Jednostka']` **istnieje**, więc fallback po `??` jest nieosiągalny; a tam, gdzie `bu.nazwa` w ogóle wchodziłoby w grę, jest to `u.typeId` (PL), nie „Nazwa EN". **Sam mechaniczny fakt jest prawdziwy i go odtworzyłem** (nazwa EN → 28-mesh generyk, po naprawie 34/37/35/37) — ale to jest **utwardzenie defensywne, nie naprawa żywego błędu**. Zmiana jest bezpieczna (dowód: odcisk 150 wpisów wyżej) i mieści się w allowliście, więc **kod zostaje**. Poprawić należy **opis**.

### Uwaga 2 (istotna z tego samego powodu — fałsz zapisany do repo)

Komentarz w `units.ts` twierdzi, że te cztery linie miały rdzeń wyłącznie polski „**jako jedyne w całej rodzinie modeli nazwanych**", a nagłówek pliku dodaje „Cała reszta rodziny … ma oba rdzenie". **To jest nieprawda.** Przeszedłem wszystkie 78 linii dispatchu w `buildNamedUnit()` i skonfrontowałem z kolumną „Nazwa EN":

```
L1486  Tyrski miecznik   (EN: Tyrian Swordsman)  rdzenie=["tyrski miecznik"]
L1487  Gwardia Tyreńska  (EN: Tyre Guard)        rdzenie=["gwardia tyrensk"]
L1492  Drużynnik         (EN: Druzhinnik)        rdzenie=["druzynnik"]
```

Trzy kontrprzykłady leżą **3–6 linii niżej, w tej samej funkcji**. To nie jest drobiazg redakcyjny: **T6 audytuje dokładnie `Tyrski miecznik` i `Gwardia Tyreńska`**, a jego Operator przeczyta w tym samym pliku zdanie mówiące, że problemu tam nie ma — czyli dokładnie ten tryb porażki, który punkt C1 tego pliku sam opisuje („nikt tego nie sprawdził, bo…").

**Klasyfikacja Uwag 1–2 wg §3b:** nie dotyczą `GOAL` (audyt wykonany i to wzorowo), nie dotyczą zakresu (zakres jest wzorcowy — 1 zmiana geometrii na 150 wpisów), nie dotyczą granic §9, nie dotyczą gotowości do integracji (kod jest poprawny i bezpieczny), i nie dotyczą „dowodu wykonania" w rozumieniu §3b (bramki i testy tematu — wszystkie zielone, odtworzone niezależnie). **Nie wymuszają więc powrotu do Operatora.** Ale nie są też kosmetyczne. **Rekomendacja: orkiestrator poprawia dwa bloki komentarza przy integracji** (ten sam plik, ten sam, już zatwierdzony fragment allowlisty — tańsze i bezpieczniejsze niż runda 2), zmieniając „realne, nie teoretyczne" na „utwardzenie ścieżki dziś nieosiągalnej" i wykreślając „jako jedyne w całej rodzinie" wraz z „Cała reszta rodziny ma oba rdzenie". Alternatywa zgodna z §3b: zapis jako osobny temat w `REJESTR-PROSB-I-ZADAN.md` **przed** zamknięciem — Final Control ma to sprawdzić jawnie (§16b pkt 4).

### Uwaga 3 (kosmetyczna)
`K9` Muru tarcz mówi o „miedzianym hełmie typu Meskalamdug". Hełm Meskalamduga z Ur jest **z elektrum/złota**, nie z miedzi (miedziane/brązowe były hełmy szeregowe). Wniosek — wykluczenie go jako zabytku epoki brązu — pozostaje słuszny.

### Uwaga 4 (kosmetyczna, wprost przewidziana kontraktem)
`01-operator.md` ma **1060 słów** wobec orientacyjnych ~400 z §11. §11 klasyfikuje to jako `PASS-WITH-NOTES`, nie `FAIL`. Łagodzę: §11 sam wskazuje `runs/<ID>/` jako miejsce na materiał szczegółowy, a znaczna część objętości to pomiary i macierz, których dispatch wymagał.

### Uwaga 5 (orkiestracyjna, nie wada pracy)
T5 dokłada 9 linii do `units.ts` **powyżej** regionów wskazanych w allowlistach T6–T11. Numery linii w ich `00-dispatch.md` (T6: „ok. 1477-1480", T10: „ok. 1483-1484") **przesuną się po integracji T5**. Wszystkie te tematy dzielą `units.ts` → §2b: idą **sekwencyjnie**, nie równolegle. Dziś konfliktu nie ma (T6–T11 są tylko zadyspozycjonowane), ale orkiestrator powinien odświeżyć numery przed dispatchem T6.

### Uwaga 6 (provenance, DOMAIN: PROCESS — nie wada tej pracy)
Stopka commita brzmi `Co-Authored-By: Claude Sonnet 5`, a Operator raportuje wykonanie na Opus 5. **Potwierdzam wyjaśnienie Operatora niezależnie:** szablon środowiska **mojej** sesji narzuca dokładnie tę samą stopkę, mimo że mnie wykonuje `claude-opus-5[1m]`. Stopka jest więc artefaktem szablonu, nie dowodem modelu — ale sama deklaracja modelu przez Operatora pozostaje rzędem 5 (§13a) i nie mam sposobu, by ją zweryfikować rzędem 1. Klasa C-062, do rejestru jako osobny temat procesowy.

### Znalezisko Operatora poza zakresem — potwierdzam i podtrzymuję
`units.json` dla „Mur tarcz (Sargonid)" ma `Kultura: Sumerowie`, `Nacja: Sumer` przy nazwie wskazującej dynastię asyryjską 722–609 p.n.e. Sprawdziłem w danych — rozjazd jest realny. Plik poza allowlistą, nietknięty, opisany w kodzie. **Do rejestru jako osobny temat, decyzja właściciela.**

---

## Werdykt

**`PASS-WITH-NOTES`.** Praca merytoryczna jest bardzo dobra: dwa realne, niewidoczne w kodzie błędy geometrii znalezione **pomiarem**, naprawione wzorcem z T3, potwierdzone moim niezależnym pomiarem co do czwartego miejsca po przecinku i widoczne na zrzucie z kamery gry; trzy pozostałe jednostki zmierzone i **udokumentowane jako poprawne z dowodem**, nie pozostawione bez potwierdzenia; brak błędu klasy T2 wykazany, nie założony; sekcje historyczne rzetelne, ze źródłami właściwego rzędu i z trzema anachronizmami nazwanymi wprost; nietautologiczność udowodniona macierzą per-asercja, którą uruchomiłem sam; zakres wzorcowy — 1 zmieniony odcisk geometrii na 150 wpisów rosteru.

Uwagi 1 i 2 dotyczą **fałszywych zdań uzasadniających zapisanych do repozytorium**, nie kodu i nie dowodu wykonania. Pod §3b nie wymuszają rundy 2, ale **nie wolno ich zostawić w raporcie jako wolnej uwagi** — muszą trafić albo do poprawki komentarza przy integracji, albo do rejestru jako osobny temat. Uwagi 3–4 kosmetyczne, 5 orkiestracyjna, 6 procesowa.

**Gotowość do integracji: TAK**, warunkowo — pod warunkiem domknięcia Uwag 1 i 2 jedną z dwóch wskazanych dróg.

**Artefakty mojego pomiaru:** harness `/tmp/claude-0/evalt5/measure.cjs`, `/tmp/claude-0/evalt5/shields.cjs`, `/tmp/claude-0/evalt5/roster.cjs` · dane `/tmp/claude-0/evalt5/{BEFORE,AFTER,SHIELDS-AFTER,ROSTER-BEFORE,ROSTER-AFTER}.json` · zrzuty z kamery gry `/tmp/claude-0/evalt5/shots-before/`, `/tmp/claude-0/evalt5/shots-after/` · logi bramek `/tmp/claude-0/evalt5/{gates5,t1t4,topic}.log` · worktree `/home/user/wt-eval-ZELAZO-AUDYT-T5` (zostawiony dla Final Control).