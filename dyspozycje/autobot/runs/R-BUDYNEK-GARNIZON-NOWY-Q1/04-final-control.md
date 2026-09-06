# R-BUDYNEK-GARNIZON-NOWY-Q1 — Final Control, werdykt końcowy (rundy 1+2)

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-BUDYNEK-GARNIZON-NOWY-Q1
GOAL: Nowy budynek Garnizon — kompletny, na równi z każdym innym budynkiem w grze (bez wpinania do Prawa i bez obrony cywilnej).
MODEL+EFFORT: Opus 5, effort high.
ZMIANY-COMMIT: zero zmian w `gra/` i `docs/` — Final Control orzeka, nie modyfikuje. Oceniony zakres `e1bc77b6..281f61f5` = 13 plików, wszystkie w allowliście rundy 1+2. Raport: ten plik.
TESTY: własne uruchomienia — `tsc --noEmit` exit 0 · `budynek-garnizon-test` **80/0** · `grupy-budynkow-test` **84/0** · `civpedia-budynki-historia-test` **138/3** · pięć referencyjnych zielonych (213/213, 19/0, 33/0, 13/0, combat OK) · **siedem własnych mutacji FC1–FC7**, każda cofnięta kopią pliku, `git diff --quiet` czysto po każdej.
BLOKADY: 3 × NAPRAW + 2 × DO DECYZJI CZŁOWIEKA (tabela niżej). Dodatkowo dwie blokady rundy 1 wciąż otwarte i zgubione z pola BLOKADY rundy 2.
RUNDY: 2/5
NASTĘPNY KROK: Operator, runda 3/5 — pozycje NAPRAW. Pozycje DO DECYZJI idą do właściciela osobno i nie czekają na rundę 3.
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja izolacji

Drzewo **czyste** przed pracą i po niej, gałąź `autobot/R-BUDYNEK-GARNIZON-NOWY-Q1`.
HEAD = `281f61f5`, nie `e1bc77b6` — ale `e1bc77b6` jest **bazą** (`git merge-base --is-ancestor` = TAK,
baza + 7 commitów rundy 1+2). Warunek „HEAD ma pokazać `e1bc77b6`" w moim prompcie jest przeniesiony
z promptu rundy 1; wykonany dosłownie dałby pozorny `BLOCK` na poprawnym drzewie. **Nie zgłaszam BLOCK.**

## WERDYKTY

| # | Zarzut (miejsce) | Werdykt |
|---|---|---|
| 1 | Kryterium 3 — martwy klik „Więcej informacji" dla **wszystkich 42** budynków (`renderer.ts:378-382` ustawia atrybuty, listener `:434` łapie tylko `button[data-entity-kind]`, `openEncyEntry` = 0 wywołań w `gra/src`) | **DO DECYZJI CZŁOWIEKA** |
| 2 | REGRES `civpedia-budynki-historia-test` 136/0 → **138/3** (trzy zaszyte `25` w `:75`, `:123`, `:126`) | **NAPRAW** |
| 3 | Pole BLOKADY rundy 2 zgubiło dwie przyjęte, wciąż otwarte blokady rundy 1 | **NAPRAW** |
| 4 | Kryterium 4 — `infraOrder` w gałęzi `if (opts.defensiveCopy)` (`ai.ts:1455`) = **państwa-miasta**, cywilizacje AI nadal Garnizonu nie widzą | **DO DECYZJI CZŁOWIEKA** |
| 5 | Brak `decision-abc.md` przy `DECISION_REQUIRED` (C-054) + temat **nieobecny w rejestrze** | **NAPRAW** |
| 6 | §11 — raport rundy 2 ma 2120 słów przy limicie ~400, bez noty wyjątku | **ODDAL** |
| W1 | *(własne)* Łatka AI jest bezczynna **także dla państw-miast** w typowej ścieżce | **DO DECYZJI CZŁOWIEKA** |
| W2 | *(własne)* Etykieta asercji `[AI3]` twierdzi „bez tego AI nigdy go nie zbuduje" — nieprawda po zarzucie 4 | **NAPRAW** |
| W3 | *(własne)* Brak Obrony rundy 2 — §16b pkt 3 wymaga odpowiedzi Obrony do **każdego** zarzutu | **NAPRAW** |
| W4 | *(własne)* Rozjazd modelu: dispatch i C-062 mówią „Final Control = Sonnet 5", prompt zlecił Opus 5 | **DO DECYZJI CZŁOWIEKA** |

**Agregat: choć jeden `NAPRAW` → `FAIL`** (§3c pkt 3, §16b pkt 8).

### Dlaczego 1 i 4 to nie NAPRAW

Oba zarzuty są **faktycznie prawdziwe** — potwierdziłem je w kodzie, nie z raportów. Ale w obu Operator
wykonał **dokładnie** to, co zlecała ratyfikacja, a rozbieżność zgłosił zamiast improwizować (D1, D3).
Kryterium 3 w brzmieniu dosłownym jest **niewykonalne w allowliście** i jego spełnienie naprawiałoby
defekt całej rodziny kart. Przy zarzucie 4 ratyfikacja mówi wprost „ani jednej innej zmiany w tym pliku";
druga linia byłaby złamaniem zlecenia. Czego wytwór **nie rozstrzyga**: czy ECHO „dopisać do listy AI
od razu" znaczyło państwa-miasta, czy wszystkie AI, i czy Garnizon może wyjść przed tematem Prawa.
To zakres, kolejność prac i priorytet — właściciel (§10), nie Final Control (§3c pkt 3).

### Dlaczego 6 to ODDAL

Zarzut jest prawdziwy co do liczby (2120 słów, brak noty; runda 1 notę miała). Ale §11 **sama** klasyfikuje
przekroczenie: „Przekroczenie to `PASS-WITH-NOTES`, **nie `FAIL`**". Zwrot tematu za to byłby sprzeczny
z normą — tym bardziej, że raport Evaluatora ma **3144 słowa**, też bez noty. Zarzut zamknięty jako
uwaga kosmetyczna; §16b pkt 4 wymaga zapisania jej osobno — idzie razem z pozycją 5 do rejestru.

## Cztery pytania — odpowiedzi dowodem z wytworu

**1. Czy Garnizon jest KOMPLETNY, na równi z sąsiadami?** TAK — i w dwóch miejscach **wyżej** niż wzorce.
Nie ma ani jednego miejsca z reconu G1, które mają `dom_starszyzny`/`dwor_zarzadcy`/`trybunal`, a którego
Garnizonowi brakuje:

| Miejsce | Garnizon | dom_starszyzny / dwor_zarzadcy / trybunal |
|---|---|---|
| Rekord danych, historia, grupa, produkcja, kolejka, karta | pełne (bramka 80/0) | pełne |
| Ikona | **własny** `bld-garnizon.svg` + wpis w mapie | brak własnego SVG; `trybunal` **bez wpisu w mapie** (heurystyka) |
| Hasło CivPedii | **jest** | **żaden nie ma** |
| Lista AI | 1 wystąpienie | `dom_starszyzny` 1, `dwor_zarzadcy` 0, `trybunal` 0 |

Martwy przycisk CivPedii **nie jest** brakiem Garnizonu — dotyczy identycznie wszystkich 42 budynków.
Tryb „budynek-widmo" wykluczony: obejrzałem zrzuty sam. `garnizon-civpedia-klik-panel.png` pokazuje
Garnizon z **aktywnym** przyciskiem „Buduj" w sekcji „Dostępne do budowy" i kompletną kartę. Zrzut
**sam się dyskwalifikuje** jako dowód kryterium 3 — pomarańczowa ramka na obrazie mówi wprost:
„MOST KLIK→PANEL DOKŁADA TEN TEST, NIE GRA… przycisk jest martwy dla wszystkich 42 budynków".
To jest uczciwość dowodowa, nie przykrywka.

**2. Czy liczby właściciela są te i czy są zamrożone?** TAK. `30 / 6 / 2 / 1 / drewno 30 / maksPoziom 1`
co do cyfry, zgodne z R2-A. Zamrożenie sprawdziłem **mutacjami, nie lekturą**:

| # | Mutacja | Bramka | Czerwone |
|---|---|---|---|
| FC1 | `kosztBudowy` 30 → `"30"` (string) | 80/0 → **78/2** | `[R2-A] kosztBudowy`, `[N] liczba całkowita` |
| FC2 | `przyrostUtrzymania` 1 → 2 | → **79/1** | `[R2-A] przyrostUtrzymania` |
| FC3 | `koszt_surowce` + `kamien: 10` | → **78/2** | `[R2-A] koszt_surowce`, `[N] reguła epoki Kamienia` |
| FC4 | `upgradeFrom: "dom_starszyzny"` (pułapka) | → **76/4** | `[U]`, `[U-silnik]`, **`[D1]`+`[D4]` — Garnizon ZNIKA z żywej listy budowy** |
| FC5 | usunięta linia `'garnizon'` z `infraOrder` | → **79/1** | `[AI3]` (parsuje realne źródło) |
| FC6 | `grupy`: `TOTAL` 42 → 43 bez licznika grupy | 84/0 → **81/3** | w tym **nowa** `suma expectedCounts === TOTAL` |
| FC7 | `dajeSzczescie` false → true | → **79/1** | `[B] NIE daje szczęścia` |

Bramka **nie jest tautologiczna**: FC4 czerwieni się w żywym DOM — Garnizon faktycznie wypada z listy
„Dostępne do budowy", a nie tylko z asercji na JSON. FC6 potwierdza, że guard dodany w R2-B łapie
dokładnie ten dług, który trzymał tę bramkę czerwoną przez półtora miesiąca.

**3. Czy zmiana w `ai.ts` to naprawdę jedna linia i czy nie koliduje?** TAK, i nie koliduje.
`git diff e1bc77b6..HEAD -- gra/src/game/ai.ts` = **1 wstawienie / 0 usunięć**, jeden hunk `@@ -1476,6 +1476,7 @@`.
Temat równoległy `P-AI-BRAK-SCIEZKI-…-ADIACENCJA-Q1` ma w tym pliku hunki `@@ 2793 @@` i `@@ 2896 @@` —
ponad 1300 linii dalej. Rejon `ai.ts:2517` **nietknięty**. Scalenie trywialne.

**4. Czy `grupy-budynkow-test` jest zielona?** TAK — **84 pass / 0 fail** z mojego uruchomienia.
Zero pozostałych faili, więc nie ma czego wypisywać. Pre-istniejący dług „Wojsko i obrona" 6→7,
spoza tego tematu, też naprawiony zgodnie z R2-B.

## Co dokładnie poprawić (pozycje NAPRAW)

- **(2)** `gra/tools/civpedia-budynki-historia-test.cjs` — `25` → `26` w liniach **75, 123, 126** +
  komentarz wymuszający bump, dokładnie jak w R2-B. **Wymaga rozszerzenia allowlisty o ten plik.**
  To technika bez skutku dla rozgrywki → decyduje orkiestrator, nie właściciel (§10).
  Weryfikacja: bramka **141/0**. Bez tego gałąź niesie do integracji bramkę, która **przed** rundą 2
  była zielona — a dowodem zakończenia jest stan z **zielonymi** bramkami (§1b, §3b).
- **(3)** Pole `BLOKADY` raportu rundy 3 ma nieść **obie** blokady rundy 1, przyjęte i wciąż otwarte:
  (a) twardą zależność kolejności deployu (Garnizon przed tematem Prawa = koszt bez korzyści),
  (b) kolizję `prawo_garnizon*` / `society-breakdown.ts:638-647` (`id: 'garnizon'` już zajęte w `lines[]`).
  Dziś żyją **wyłącznie** w `03-obrona-runda1.md`; w rundzie 2 `prawo_garnizon` i `society-breakdown`
  nie padają **ani razu**. Orkiestrator pracuje na destylacie z pola BLOKADY (§11) — blokada poza tym
  polem jest blokadą zgubioną.
- **(5)** Założyć `dyspozycje/autobot/runs/R-BUDYNEK-GARNIZON-NOWY-Q1/decision-abc.md` (C-054 nazywa
  ten plik imiennie; siedem innych runów w repo go ma). **Osobno, po stronie orkiestratora:** temat
  **nie występuje ani razu** w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — a C-054 wymaga ustawienia
  ledgera `DECISION_REQUIRED` i statusu `ABC-OCZEKUJE` **razem, nigdy rozjechane**, co jest niemożliwe,
  gdy tematu w rejestrze nie ma. §16b pkt 6 nie przechodzi. Dziesięć trafień „GARNIZON"
  w `PYTANIA-OTWARTE.md` to **inny temat** (`P-GARNIZON-KONIUNKCJA…`, ufortyfikowanie jednostki) —
  sprawdziłem, nie zaliczam ich.
- **(W2)** `gra/tools/budynek-garnizon-test.cjs` — etykieta `[AI3]` „bez tego AI nigdy go nie zbuduje"
  jest nieprawdziwa: `infraOrder` obsługuje państwa-miasta. Poprawić opis, żeby przyszła runda nie
  cytowała jej jako dowodu parytetu. W allowliście, koszt jednej linii.
- **(W3)** Uruchomić Obronę rundy 2 albo zapisać powód odstąpienia: zarzuty 3, 5 i 6 **nie mają
  żadnej odpowiedzi Operatora** (1, 2 i 4 są przedodpowiedziane przez D1/D2/D3 napisane wcześniej).
  §16b pkt 3: zarzut bez Obrony **i** werdyktu nie jest zamknięty.

## DO DECYZJI CZŁOWIEKA

**A. Martwy przycisk CivPedii (zarzut 1).** Klik „Więcej informacji" nie działa w tej grze dla **żadnego**
budynku — brakuje dwóch linii wiring `.entity-card-civpedia-link` → `openEncyEntry`. Garnizon jest tu
na równi z resztą (a jako jeden z 26 z hasłem — lepiej niż 16 pozostałych). Pytanie: przyjmujesz kryterium 3
w wersji dostarczonej i wiring idzie osobnym tematem naprawiającym wszystkie karty naraz, czy Garnizon
czeka na ten wiring?

**B. Zasięg Garnizonu u AI (zarzut 4 + W1).** Dopisana linia działa **tylko dla państw-miast**. Co więcej —
i tego nie zgłosił nikt przede mną — nawet tam jest w praktyce bezczynna: blok chroni warunek
`infraBootstrap = built.length < 6` (`ai.ts:1467`), a `garnizon` jest **siódmą, najniżej punktowaną**
pozycją listy (`450 − 6×12 = 378`), więc żeby po niego sięgnąć, trzeba mieć zbudowane sześć wcześniejszych —
a wtedy `built.length >= 6` wyłącza cały blok. Realnie Garnizon wybierze się tylko wtedy, gdy któraś
z wcześniejszych pozycji jest zablokowana produkcyjnie. Pytanie: czy „dopisać do listy AI od razu" ma
znaczyć **wszystkie cywilizacje AI** (druga linia, lista `ai.ts:~1415`), czy zostaje przy państwach-miastach,
a resztę bierze `P-AI-LISTA-BUDYNKOW-ZASZYTA-NIE-Z-PRODUKCJI-Q1`?

**C. Kolejność deployu (blokada rundy 1, wciąż otwarta).** Wydany przed `R-PRAWO-PRZEBUDOWA-SKALI-Q1`
Garnizon jest dla gracza czystym kosztem: 60 pkt Pracy + 60 Drewna jednorazowo, 4 Pieniądza + −5 Drewna
na turę, na karcie „Efekty —". Wchodzi do `main`/na ROBOCZĄ przed tematem Prawa, czy po nim?

**D. Model Final Control (W4).** Dispatch tego runu i C-062 mówią „Final Control = Sonnet 5 High";
ten werdykt wydał **Opus 5 High**, bo tak zlecił prompt. Zgłaszam rozjazd zamiast wybierać po cichu
starszy tekst (README, §„Jeśli dokumenty się różnią"). C-062 wrócił do playbooka po Twoim audycie,
więc nie zmieniam go sam.

## Obserwacje

- **§2b, potwierdzone i bez szkody.** Commit `e633a65c` zabrał cudzy `03-obrona-runda1.md` (+86 linii).
  Sprawdziłem sam: md5 wersji w commicie i na dysku **identyczne** (`d52942b2…`), plik kończy się własną
  notą §11 — kompletny, nic nie obcięte. Przyczyna (C-047: `git commit` bez ścieżek w drzewie dzielonym)
  jest zgłoszona przez samego Operatora. Trzy role w jednym worktree to jednak realne naruszenie §2b.
- **Regeneracja `wikiBundle.json` czysta — zweryfikowana przeze mnie programowo**, nie z raportu:
  encyklopedia 168 → 169, **dodany dokładnie jeden** wpis (`budynki/garnizon`), **zero** zmienionych,
  **zero** usuniętych, `poradnik` bajt w bajt identyczny; jedyna inna zmiana to stempel `generated`.
  Wpis trzyma konwencję (`folder: budynki`, `id: budynki/garnizon`, `slug: garnizon`) i zgadza się
  z tym, czym linkuje karta (`buildingAdapter.ts:252`). **Nie uruchamiałem** `civpedia-gra-id-mostek-test`
  (brudzi śledzony plik) — drzewo po mojej pracy czyste.
- Trzy niespójności R2-E potwierdzone i nietknięte; `trybunal` nadal bez wpisu w mapie ikon.
- Sprzątałem po sobie: mutacje cofane **kopią pliku** ze scratchu, nigdy `git checkout`; nie ubijałem
  cudzych procesów. Pierwsze uruchomienie bramki tematu padło na starcie Chromium (43 równoległe procesy
  chrome w środowisku) — powtórzone w pojedynkę dało 80/0; **nie cytuję wyniku z padniętego przebiegu.**

**Nota §11:** limit ~400 słów przekroczony świadomie. §3c pkt 3 wymaga werdyktu **z dowodem z wytworu**
dla każdego z 6 zarzutów i 4 znalezisk własnych, a prompt zamawia osobno odpowiedzi na cztery pytania
i tabelę mutacji. Kontrakt, blokady i werdykty są skondensowane; obszerne są wyłącznie sekcje zamówione.
Nie integruję, nie wystawiam `READY_FOR_DEPLOY`.
