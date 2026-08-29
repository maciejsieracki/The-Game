All verification complete. Writing the report.

# 02 — EVALUATOR (runda 1)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ZELAZO-MODELE-BRAKUJACE-Q1-T2
GOAL: Rozróżnić wizualnie Soldurii i Gaesatae (epoka Żelazo, kultura Celtowie) — dziś obie
      jednostki renderują się identycznym modelem buildCeltWarrior(), mimo że to historycznie
      bardzo różne jednostki.
ZMIANY/COMMIT: 1af2a413 na origin/autobot/ZELAZO-T2-Q1; 3 pliki, +873/-29 (weryfikacja własna)
TESTY: wszystko uruchomione samodzielnie z własnego worktree — wyniki niżej, wklejone nie streszczone
BLOKADY: brak blokad technicznych; 2 uwagi wymagające decyzji orkiestratora przed integracją (N1, N2)
RUNDY: 1/5
NASTĘPNY KROK: Final Control (Sonnet 5 High) — z rozstrzygnięciem N1 i N2
DEPLOY/PUSH: NIE WYKONANO
```

## Model wykonawczy tego Evaluatora (§5a, C-062)

**Opus 5, dokładne ID `claude-opus-5[1m]`** — odczytane z opisu środowiska tej sesji („You are powered by the model named Opus 5 (1M context). The exact model ID is claude-opus-5[1m]"). Sprawdziłem `env`: **`ANTHROPIC_MODEL` jest w tej sesji nieustawione**, więc deklaracja środowiska jest jedynym dostępnym źródłem rzędu 1. Wymóg dispatchu („Opus 5 High dla Operatora i Evaluatora", §5a / §9 poz. 6b) — spełniony. Effort nie jest odczytywalny maszynowo; raportuję go zgodnie z promptem dispatchu (High).

## Izolacja weryfikacji

Własne, niezależne worktree — **nie pracowałem w drzewie Operatora**:
- `/home/user/wt-eval-ZELAZO-T2` @ `1af2a413` (detached, gałąź do oceny)
- `/home/user/wt-eval-ZELAZO-T2-main` @ `d504492f` (detached, `origin/main` — baseline regresji)

`gra/node_modules` podlinkowane symlinkiem (C-029: `tsc` bez `node_modules` daje niewiarygodny wynik w obie strony; `tsc --version` = **5.9.3**, wersja projektu). Oba worktree po zakończeniu: `git status --porcelain` **pusto**.

---

## 1. Zakres (§16a p.1, §9 poz. 9)

`git merge-base origin/main origin/autobot/ZELAZO-T2-Q1` = `d504492f` = **dokładnie wierzchołek `origin/main`** — gałąź jest prostym następcą, `git diff origin/main..HEAD` i `git diff $(merge-base)..HEAD` dają identyczny wynik (sprawdzone obie formy, §9 poz. 9):

```
 .../R-ZELAZO-MODELE-BRAKUJACE-Q1-T2/01-operator.md |  97 ++++
 gra/src/render/units.ts                            | 318 ++++++++++++--
 ...celtowie-soldurii-gaesatae-real-render-test.cjs | 487 +++++++++++++++++++++
 3 files changed, 873 insertions(+), 29 deletions(-)
```

Trzy pliki, wszystkie w allowliście **na poziomie pliku**. Odchylenie na poziomie *fragmentu* pliku — patrz **N1**.

`git diff --check` czysto. Skan sekretów (`api_key|secret|password|token[ =:]|BEGIN (RSA|OPENSSH|PRIVATE)|ghp_|sk-`) — jedyne trafienie to polskie słowo „token gry" w komentarzu; **zero sekretów** (§16a p.5). Zero usunięć niewymaganych przez GOAL — jedyne usunięcia to zastąpione linie dispatchu i przepisane ciało `buildGaesatae()` (§16a p.6).

**§2b — nakładanie się tematów:** przeskanowałem wszystkie 30 niezintegrowanych gałęzi zdalnych. `gra/src/render/units.ts` dotyka **wyłącznie `origin/autobot/ZELAZO-T2-Q1`**. Brak konfliktu równoległego, brak podstaw do `INTEGRATION_PENDING`.

**§16a p.9 — zgodność GOAL:** GOAL w `01-operator.md` jest zdaniem z `00-dispatch.md`, kryteria 1–6 pokryte co do jednego. **Brak przesunięcia kontekstu.**

**§9 — granice nienaruszalne:** poz. 1 nie naruszona (`vite` wyłącznie binarką z `node_modules`, `--outDir` poza drzewem repo; `tsc` binarką; brak `npm run *`), poz. 2 — commit zawiera 3 pliki, brak śladu `git add -A`, poz. 3 — brak sekretów, poz. 4 — zero zmian procesowych w paczce produktowej, poz. 5 — `WERSJE.md` i `ROBOCZA-MANIFEST.json` nietknięte, poz. 6a — spełniona (niżej), poz. 7 — `playbook.json` nietknięty, poz. 8 — deploy niewykonany, poz. 10 — worktree nie usuwałem.

**§16a p.4 (trzy twarde FAIL-e domeny gry):** nie dotyczą. Temat jest czysto prezentacyjny — `buildUnitModel(kategoria, ownerColor, modelName)` buduje bryłę przy renderze, nic nie trafia do zapisu stanu (**brak luki save/load**). Parytet gracz/AI/MP: sprawdziłem wszystkie 4 wywołania w `battleScene.ts` (4105, 4273, 4990, 15652) — `const modelName = String((bu.stats as any)?.['Jednostka'] ?ap bu.nazwa)` jest **identyczne dla każdej strony**, model wybiera się po nazwie jednostki, nie po właścicielu. **Zero asymetrii.** Ścieżki brzegowe: sweep 75/75 jednostek zbudował się bez wyjątku (niżej), zero błędów JS w konsoli.

---

## 2. Bramki i budowa — uruchomione przeze mnie, nie odczytane z raportu (§16a p.3)

| Bramka | Komenda (moja) | Wynik | Odniesienie §6 |
|---|---|---|---|
| TypeScript | `node ./node_modules/typescript/bin/tsc --noEmit` | **0 błędów**, exit 0 | 0 ✔ |
| `vite build` (C-001) | `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-eval-zelazo-t2-dist --emptyOutDir` | **OK**, 847 modułów, 37 370,92 kB, exit 0 | ✔ |
| Logika | `node tools/logic-test.cjs` | **LOGIC OK (213/213)** | 213/213 ✔ |
| Drzewo technologii | `node tools/tech-tree-test.cjs` | **19 pass, 0 fail** | 19/19 ✔ |
| Badania | `node tools/research-test.cjs` | **PASSED: 33 / FAILED: 0 — ALL GREEN** | 33/33 ✔ |
| Wymiana jednostek | `node tools/unit-replace-test.cjs` | **WSZYSTKIE ZIELONE (13/13)** | 13/13 ✔ |
| Walka | `node tools/combat-test.cjs` | **COMBAT TEST: 6/6 pass** | 6/6 ✔ |
| Test tematu | `node tools/zelazo-celtowie-…-real-render-test.cjs --dist …` | **42 pass, 0 fail**, exit 0 | — |
| Test sąsiedni T1 | `node tools/zelazo-konnica-asyryjska-real-render-test.cjs --dist …` | **31 pass, 0 fail**, exit 0 | — |
| Bramka żelaza (dodatkowo) | `node tools/zelazo-gate-test.cjs` | **WSZYSTKIE ZIELONE (24/24)** | — |

Wszystkie liczby Operatora **potwierdzone co do jednej**. Rozbieżność 29 vs 31 w teście T1 wyjaśniona: `--skip-vite` pomija asercje (G1)/(G2); z `--dist` wychodzi 31/31.

---

## 3. Własny real render — nie ufałem testowi Operatora

Napisałem **własny, niezależny skrypt** (`/tmp/claude-0/…/scratchpad/eval-render.cjs`, 25 asercji), który buduje **dwa bundle esbuild z dwóch fizycznych worktree** (gałąź i `origin/main`) i porównuje je w żywym Chromium. To mocniejszy dowód nietautologiczności niż mutacja w locie: baselinem jest **realny kod sprzed zmiany**, nie syntetyczna podmianka.

```
PASS: (Z1) units.json NIE zmieniony przez temat (dane gry nietknięte)
PASS: (R0) wszystkie 75 jednostek buduje się bez wyjątku
PASS: (R1) DOKŁADNIE 2 jednostki zmieniły geometrię wobec origin/main
PASS: (R2) zmienione to Soldurii i Gaesatae
PASS: (R3) Miecznik galijski bajtowo identyczny
PASS: (R4) Rydwan celtycki bajtowo identyczny
  [kategorie] Soldurii=miecznik, Gaesatae=miecznik
PASS: (W1) „Wojownik celtycki" ma TĘ SAMĄ liczbę mesh co przed zmianą
  [Wojownik celtycki] mesh: 28, linie różniące się: 3
PASS: (W2) „Wojownik celtycki" zmienia się WYŁĄCZNIE w 3 mesh (tarcza: lico+spina+umbo)
PASS: (W3) „Wojownik celtycki" — identyczna paleta barw (zmiana czysto orientacyjna)
PASS: (W4) „Wojownik celtycki" NIE występuje w units.json (dispatch nieosiągalny z danych)
PASS: (P0) obie jednostki mają niepustą sylwetkę z kamery gry
PASS: (P1) sylwetki Soldurii i Gaesatae różnią się > 10% pikseli
PASS: (P2) rozkład barw NA SYLWETCE różni się > 40%
FAIL: (P3) …(próg 2,5× — mój błąd kalibracji, rozstrzygnięte osobnym pomiarem, patrz niżej)
PASS: (P4) sam obrys Soldurii zmienił się względem origin/main (tarcza wchodzi w sylwetkę)
PASS: (O1) kolczuga Soldurii wystaje PRZED tors (widoczna, nie tkwi w środku)
PASS: (O2) hełm Soldurii nie zasłania oczu
PASS: (O3) guz hełmu siedzi NA czaszy (styka się, nie wisi)
PASS: (O4) karczek hełmu jest Z TYŁU głowy (ujemne Z)
PASS: (O5) tarcza i miecz Soldurii po PRZECIWNYCH stronach
PASS: (O6) drzewce gaesum stoi na ziemi — poza wręcz, nie zamach
PASS: (O7) grot gaesum przylega do drzewca (brak przerwy)
PASS: (O8) naramiennik Gaesatae obejmuje ramię
PASS: (O9) przepaska Gaesatae okracza linię bioder (AV_Y_TORSO_BOT = 0.20 × HEX_R)
PASS: (F0) zero błędów JS w trakcie wszystkich renderów
```

Jedyny `FAIL` to **mój** źle dobrany próg, nie wada kodu: liczyłem piksele barwy właściciela na Soldurii, gdzie kolczuga jednocześnie zasłania część szarfy — wzrost wyszedł 1,91× przy progu 2,5×. **Rozstrzygnąłem to pomiarem izolującym**: wziąłem „Wojownika celtyckiego", którego JEDYNĄ zmianą jest orientacja tarczy:

```
origin/main  Wojownik celtycki -> sylwetka=21161  piksele barwy właściciela=1917
gałąź        Wojownik celtycki -> sylwetka=22817  piksele barwy właściciela=4345   (2,27×)
```

To jest twardy, izolowany dowód, że diagnoza Operatora („kamera widziała tarczę krawędzią") była prawdziwa, a poprawka działa. Sprawdziłem też analitycznie: `getGeoOvalShield()` to walec o osi Y; przy `rotation.z=π/2` skala (1.0, 0.92, 1.85) daje bryłę światową **[0.0166, 0.160, 0.296]** (pomiar Operatora: [0.0166, 0.156, 0.296] — różnica z 14-kąta, nie z błędu), przy `rotation.x=π/2` daje **[0.160, 0.296, 0.0166]**. `camera.ts:131` faktycznie mówi „elewacja ~50°, azymut 0", a `this.yaw = 0` jest ustawione na sztywno. **Diagnoza potwierdzona niezależnie.**

### Dowód nietautologiczności — cztery WŁASNE mutacje w źródle (§9 poz. 6a)

Nie poprzestałem na sekcji (B) Operatora. Zmutowałem **fizycznie plik w moim worktree** i uruchomiłem jego test:

| Mutacja | Skutek |
|---|---|
| M1: hełm Soldurii `+0.020` → `+0.012` | `FAIL: (H8) … {"helmMinY":0.527,"goraOczu":0.5325}` — **dokładnie liczby z raportu Operatora** |
| M2: gaesum `0.62` → `0.50` | `FAIL: (H6) … {"grotMaxY":0.5655,"czubekGlowy":0.58}` — **dokładnie liczby z raportu** |
| M3: `SH_Z 0.046` → `0.012` | `FAIL: (H5/soldurii)` **i** `FAIL: (H5/gaesatae)` `{"tarczaMinZ":0.0037,"ramieMaxZ":0.03}` |
| M4: nogawka `1.02` → `0.98` | `FAIL: (H9) … {"nakladka":[0.002,0.198],"nogawka":[0,0.2]}` |

Test **nie jest tautologiczny** — mierzy relacje geometryczne (orientacja lica wobec osi kamery, spina wobec obrysu tarczy, umbo wobec lica, tarcza wobec przedramienia, grot wobec czubka głowy, hełm wobec oczu), a punkty odniesienia bierze z `userData.anchors` samego modelu, nie z wpisanych liczb. To jest dokładnie ta klasa asercji, której brakowało w rundzie 1 tematu T1. Po mutacjach przywróciłem plik; `git status --porcelain` **pusto**.

### Zrzuty z żywej przeglądarki (§9 poz. 6a — obowiązek Evaluatora na Opus 5)

Wyrenderowałem obie jednostki **z kamery gry** (elewacja 52°, azymut 0) własnym kodem, nie kodem Operatora:

- `…/scratchpad/eval-kamera-gry.png` — Soldurii i Gaesatae obok siebie, kamera gry.
- `…/scratchpad/eval-skala-tokena.png` — **cztery jednostki celtyckie w realnej skali tokena (~55 px wysokości)**, żeby sprawdzić kryterium 1 na wielkości, którą faktycznie widzi gracz, a nie na powiększeniu.

Werdykt wzrokowy: **Soldurii i Gaesatae są nie do pomylenia nawet w skali tokena.** Soldurii — brązowy hełm z guzem, zielona tunika, szara kolczuga, niebieska tarcza, uniesiony miecz, spodnie i buty. Gaesatae — cała sylwetka w barwie skóry, złoty torc i naramienniki, tarcza z surowych desek, długie gaesum sterczące ponad głowę, bose stopy. Zrzut PRZED (`origin/main`) pokazuje dwie **identyczne** figury z tarczą widoczną jako pionowy pasek — obie zmierzone wady widać gołym okiem.

---

## 4. Weryfikacja kryteriów sukcesu z dispatchu

| # | Kryterium | Werdykt | Dowód |
|---|---|---|---|
| 1 | Wyraźnie różne, potwierdzone real renderem obok siebie | **SPEŁNIONE** | (P1) sylwetki, (P2) rozkład barw na sylwetce > 40%, dwa własne zrzuty, w tym w skali tokena |
| 2 | Sekcja historyczna dla obu | **SPEŁNIONE** | K1-K7 (Gaesatae, przebudowana), S1-S8 (Soldurii, nowa) — audyt merytoryczny w §5 |
| 3 | Zero regresji dla Miecznika galijskiego, Rydwanu celtyckiego i „Wojownika celtyckiego" | **SPEŁNIONE dla dwóch pierwszych, z zastrzeżeniem dla trzeciego** | (R3)/(R4) bajtowa identyczność; „Wojownik celtycki" — patrz N1 |
| 4 | Real render Playwright/Chromium, proporcje wobec `HEX_R` | **SPEŁNIONE** | test 42/42 + mój test 24/25 + 4 własne mutacje |
| 5 | `tsc`, `vite build`, testy + 5 bramek | **SPEŁNIONE** | tabela w §2, wszystko uruchomione przeze mnie |
| 6 | `DECISION_REQUIRED` zamiast własnej interpretacji przy decyzji produktowej | **SPEŁNIONE** | patrz §6 — Operator nie interpretował, oparł się na ECHO właściciela; sporne dane zgłosił zamiast naprawiać |

Dodatkowo zmierzyłem, czego dispatch nie żądał, a co odróżnia dobry model od poprawnego:

- **Wysokość i promień** (limit heksu 0.866×HEX_R): Soldurii **0.660**, Gaesatae **0.687**, `maxR` obu **0.253**. Najwyższa jednostka w grze to Oszczepnik (Estólica) 0.928. **Żadna z 75 jednostek nie wychodzi poza limit heksu.** Nowe modele nie są odstające.
- **Czytelność barwy właściciela na mapie**: Soldurii **9,1% → 16,9%** sylwetki (najlepszy wynik wśród Celtów), Gaesatae **9,1% → 7,6%** (Miecznik galijski dla porównania: 15,3%). Patrz **N5**.
- **Rozbiórka udziału tarczy** (Soldurii): tarcza odpowiada za **4531 z 5181** pikseli barwy właściciela i **13% całej sylwetki**. Tarcza jest realnym, dominującym nośnikiem barwy — kryterium czytelności przynależności spełnione z zapasem.

---

## 5. Audyt historyczny — własną wiedzą, z kwestionowaniem szczegółów

Sprawdziłem **każdy** punkt K1-K7 i S1-S8. **Nie znalazłem żadnego anachronizmu.** Poświadczenia:

- **K1 nagość** — Polibiusz II 28: Insubrowie i Bojowie w spodniach i płaszczach, Gaesatae z brawury zrzucili odzienie i stanęli nago w pierwszym szeregu. ✔ dokładnie tak, jak opisano.
- **K3 złoty torc i naramienniki** — Polibiusz II 29: nadzy w pierwszych szeregach byli bogato zdobieni **złotymi** naszyjnikami i naramiennikami; łupy trafiły do Rzymu (II 31). ✔ Złoto jest tu poświadczone wprost, brąz byłby zubożeniem źródła. Potwierdziłem pomiarem, że rozróżnienie metali faktycznie istnieje w geometrii: torc Gaesatae `e0b53a` (`COLOR_GOLD_BR`), torc Soldurii `cf9234` (`COLOR_BRONZE`).
- **K6 wąsy** — Diodor Sycylijski V 28: możni golą policzki, ale zapuszczają wąsy tak, że zakrywają usta. ✔ trafna lokalizacja ustępu.
- **K7 wąska tarcza** — Polibiusz II 30 krytykuje celtycką tarczę jako niezdolną osłonić całego ciała, tym groźniejsze dla nagich. ✔ uboga tarcza jest tu **zgodna** ze źródłem, nie wbrew niemu.
- **S1 soldurii** — Cezar, *De Bello Gallico* III 22, Sotiaci w Akwitanii, 600 *soldurii*, wspólnota dóbr za życia i obowiązek śmierci z panem, „w ludzkiej pamięci nikt nie odmówił". ✔ Operator poprawił nawet dispatch, który mówił ogólnie „celtyberyjski/galijski" — Cezar lokuje ich u Akwitanów.
- **S3 kolczuga** — wynalazek celtycki, najstarsze znaleziska III w. p.n.e., grób wodza w Ciumeşti (ten sam, co słynny hełm z krukiem) zawierał fragmenty kolczugi; Rzymianie przejęli ją od Galów. ✔ Zgodne z konsensusem.
- **S4 Montefortino** — typ wywodzący się z celtyckich hełmów w Italii (nekropola Montefortino, Senonowie), brązowy dzwon z guzem na szczycie i karczkiem, przejęty przez armię rzymską. ✔ Geometria (czasza + karczek z tyłu + guz) odpowiada typowi.
- **S8 bracae** — Polibiusz II 28 przeciwstawia wprost spodnie Insubrów nagości Gaesatów; kontrast jest źródłowy, nie wymyślony. ✔

**Dwa szczegóły, które kwestionuję** (obie uwagi dotyczą wyłącznie tekstu komentarza, zero wpływu na geometrię i rozgrywkę — ujęte w N6):

1. **K4, etymologia.** Operator pisze, że nazwa jednostki pochodzi od *gaisos* (włócznia). To dziś dominujące odczytanie filologiczne, ale **Polibiusz II 22 twierdzi wprost coś innego** — że nazywają się Gaesatae, bo służą za żołd, i że takie jest właściwe znaczenie słowa. Skoro cała reszta sekcji opiera się na Polibiuszu, warto tę rozbieżność nazwać zamiast podawać jedno odczytanie jako pewnik. Sprzeczności praktycznej nie ma — nagłówek funkcji i K7 nazywają ich najemnikami, więc oba czytania są w kodzie obecne.
2. **S5, długość ostrza.** „Ostrze ok. 0,75–0,90 m" to raczej **całkowita długość** późnolateńskiego miecza; same głownie mieszczą się typowo w 0,60–0,80 m. Wartość jest u górnej granicy przedziału.

Weryfikowalne twierdzenie Operatora o poprzednim kodzie też sprawdziłem: stara `buildGaesatae()` miała zmienną `mBronz` przypisaną do `COLOR_GOLD_BR` i komentarz „bronze torc" — **komentarz był nieprawdziwy, geometria dobra**, dokładnie jak Operator napisał.

---

## 6. Decyzje projektowe — ocena

- **Ścieżka (b) dla Soldurii** (własna `buildSoldurii()`) — trafna. Dispatch dopuszczał obie; ECHO właściciela żąda modeli *bespoke*. Zweryfikowałem twardo, że `buildCeltWarrior()` **jest nietknięty**: wyekstrahowałem ciało funkcji z obu wersji i porównałem — **identyczne**.
- **Poza włóczni oparta o ziemię (K5)** — to jest ta „świadoma decyzja dot. pozy", której żądał dispatch, i jest oparta na danych, nie na guście: potwierdziłem w `units.json`, że Gaesatae ma `Atak dystansowy: 0` i `missileAttack: 0` oraz `Rola (linia): "Wręcz"`. Poza zamachu do rzutu obiecywałaby graczowi zdolność, której jednostka nie ma. **Zgadzam się z rozstrzygnięciem.**
- **Nagość Gaesatae** — nie jest interpretacją Operatora. Zweryfikowałem cytat w `docs/decyzje/R-ZELAZO-MODELE-BRAKUJACE-Q1.md:35`: „najemnicy słynący z walki nago/półnago, uzbrojeni w gaesum". Decyzja właściciela, nie Operatora. Kryterium 6 nie zostało obejście — nie było otwartej decyzji produktowej do zadania.

---

## 7. Uwagi — z jawną klasyfikacją wg §3b

### N1 — ZAKRES (§3b: dotyczy zakresu; wymaga rozstrzygnięcia, nie kolejnej rundy Operatora)

Allowlista mówi: `gra/src/render/units.ts` — **WYŁĄCZNIE** (a) linia dispatchu, (b) `buildGaesatae()`, (c) opcjonalnie `buildCeltWarrior()`. Operator zmienił dodatkowo **`addTallOvalShield()`** (naprawa orientacji) oraz dodał opcjonalny parametr `namePrefix` do `addLongSwordRight()` i `addSpearRight()`. Formalnie **jest to poszerzenie allowlisty w biegu**, czego §14 zabrania.

Zmierzyłem promień rażenia, zamiast go oszacować:

- **75/75 jednostek z `units.json`**, każda budowana **realną kategorią z `categoryOf()`** (tą samą, której używa gra), porównanie pełnego odcisku geometrycznego (typ geometrii + parametry + bbox + macierz świata + barwa + nazwa, per mesh) wobec `origin/main`: **zmieniły się dokładnie 2 — Soldurii i Gaesatae.** Miecznik galijski i Rydwan celtycki **bajtowo identyczne**.
- `namePrefix` ma domyślne `''` i zerowy wpływ na geometrię — udowodnione powyższym sweepem, nie deklaracją.
- Jedyny nie-tematyczny dispatch dotknięty przez `addTallOvalShield` to **„Wojownik celtycki"**: **28 mesh przed i po**, różnią się **3 mesh** (lico, spina, umbo tarczy), **identyczna paleta barw**. Potwierdziłem osobno, że nazwa ta **nie występuje w `units.json`** — została przemianowana na Gaesatae, więc **dispatch jest nieosiągalny z danych gry**.
- `units.json` **niezmieniony** (porównanie bajtowe obu worktree).

**Moja ocena.** Odchylenie jest realne, ale: mieści się w allowlistowanym *pliku*, zostało **zgłoszone jawnie i w całości** przez Operatora (to nie jest cichy scope creep, przed którym broni §14), a jego zmierzony wpływ na jakąkolwiek jednostkę osiągalną z danych gry wynosi **zero**. Bez tej naprawy oba modele tematu weszłyby do `main` ze sztandarowym elementem — wysoką owalną tarczą — ustawionym **krawędzią do kamery o stałym azymucie**, co jest udokumentowanym, mierzalnym defektem (1917 → 4345 pikseli po naprawie na izolowanym przypadku).

**Cofnięcie tej poprawki byłoby regresją, nie przywróceniem zgodności.** Dlatego **nie rekomenduję powrotu do Operatora** — nie ma czego poprawiać. Rekomenduję, by **orkiestrator jawnie ratyfikował poszerzoną allowlistę w `00-dispatch.md`/`03-…` przed integracją**, tak żeby ślad procesu nie zawierał niezaadresowanej rozbieżności. Formalna dyspozycja tej uwagi wg §3b należy do Final Control — sygnalizuję ją wprost, nie chowam w raporcie.

### N2 — GOTOWOŚĆ INTEGRACYJNA (§3b: musi być domknięte przed zamknięciem tematu)

Operator zgłosił dwa realne rozjazdy **danych**, świadomie ich nie naprawiając (poza allowlistą — słusznie). Potwierdziłem oba w `units.json`:

1. **`Uwagi` Gaesatae są nieaktualne**: „Rename Wojownik celtycki → Gaesatae; elitarna piechota najemna; długi miecz sieczny + owalna tarcza; **tunika + torc**" — opisuje jednostkę **sprzed** rename i przeczy decyzji właściciela o nagości oraz uzbrojeniu w gaesum.
2. **`Typ: "Swordsman"` przy jednostce z włócznią**, z konsekwencją w tabelach kontr (`Bonus vs Spearman %: 15`). To dziedzictwo tego samego rename; decyzja danych/balansu, nie modelu.

§3b jest tu jednoznaczny: uwagi kosmetyczne kończą proces **wyłącznie wtedy, gdy zostały zapisane jako osobny temat w rejestrze**, a nie zostawione w raporcie. Sprawdziłem `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — **tych dwóch zgłoszeń tam nie ma**. Allowlista tematu uniemożliwiała Operatorowi ich dopisanie, więc **to zadanie orkiestratora**: zarejestrować oba (naturalnie jako `related_to: R-ZELAZO-MODELE-BRAKUJACE-Q1`) **zanim** temat zostanie zamknięty. Do tego czasu temat nie jest gotowy do domknięcia — choć kod jest gotowy do integracji.

### N3 — KOSMETYCZNA: tolerancja hełmu Soldurii jest ciasna

Dolna krawędź czaszy `y = 0.535`, góra oczu `y = 0.5325` — **zapas 0.0025 × HEX_R** (0,4% wysokości tokena). Kryterium spełnione, ale każda przyszła zmiana proporcji awatara zje ten margines. Test to złapie (M1 potwierdziła), więc ryzyko jest kontrolowane — odnotowuję jako świadomość, nie żądanie.

### N4 — KOSMETYCZNA: szarfa właściciela ledwo wychodzi przed kolczugę

Szarfa bazowego awatara sięga `z = 0.059`, przód kolczugi `z = 0.057` — **prześwit 0.002 × HEX_R**. Renderuje się deterministycznie (sprawdziłem przy `near/far` 0.05/20 **i** 0.1/1000 — identyczne 5181 pikseli, **brak z-fightingu**), a jej wkład to 650 pikseli. Działa; margines jest jednak minimalny. Uboczny wniosek: komentarz K2 („przepaska niesie przy okazji barwę właściciela, czego naga sylwetka sama z siebie by nie dała") jest lekko nieścisły — bazowy awatar ma **własną** szarfę w barwie właściciela, niezależnie od przepaski.

### N5 — KOSMETYCZNA: Gaesatae niesie mniej barwy właściciela niż celtyccy sąsiedzi

Udział barwy właściciela w sylwetce: Soldurii **16,9%**, Miecznik galijski **15,3%**, **Gaesatae 7,6%** (przed zmianą: 9,1%). To bezpośrednia konsekwencja świadomej i historycznie uzasadnionej decyzji K7 (uboga tarcza z desek, barwę niesie tylko spina + przepaska + szarfa). Nie jest to regresja blokująca — wartość jest zbliżona do stanu sprzed zmiany, a jednostka pozostaje rozpoznawalna. Gdyby właściciel uznał czytelność przynależności na mapie za priorytet, tanim ruchem byłoby poszerzenie spiny tarczy. **Decyzja właściciela, nie moja i nie Operatora.**

### N6 — KOSMETYCZNA: dwa doprecyzowania historyczne

Etymologia *Gaesatae* wobec Polibiusza II 22 oraz długość głowni la Tène — opisane w §5. Wyłącznie tekst komentarza.

### Uwagi Operatora, które potwierdzam i klasyfikuję

- **Broń nie dotyka pięści** — zmierzyłem: dłoń kończy się na `x = 0.1545`, rękojeść zaczyna na `x = 0.160` → **przerwa 0.0055 × HEX_R**. Dokładnie jak zgłoszono. Defekt **pre-istniejący** w `addLongSwordRight`/`addSpearRight`, dotyczy wielu jednostek, poza allowlistą. Poprawnie zgłoszony zamiast naprawiony — do rejestru razem z N2.
- **Stopka commita mówi „Co-Authored-By: Claude Sonnet 5", a wykonawcą był Opus 5** — potwierdzam z `git log`. Tekst stopki jest narzucony przez harness sesji, więc **nie jest to wina ani wybór Operatora**, a faktyczny model jest zapisany jawnie w `01-operator.md`. Rozjazd provenance jest jednak realny (to ta sama klasa, która wywaliła rundę 1 tematu T1). **DOMAIN: PROCESS**, nie GAME — nie wpływa na kod ani na wynik tego tematu, ale zasługuje na osobny wpis procesowy.
- **`buildGermanWarrior()` ma dokładnie ten sam nienaprawiony błąd orientacji tarczy** (`mShield.rotation.z = Math.PI/2`, `units.ts:2759`) — znalazłem to sam. **Poza zakresem i nieszkodliwe**: `docs/decyzje/R-ZELAZO-MODELE-BRAKUJACE-Q1.md` klasyfikuje `buildGermanWarrior` jako martwy kod, a mój sweep 75/75 potwierdza, że żadna jednostka z `units.json` do niego nie dociera. Odnotowuję jako znalezisko do rejestru, nie jako wadę tej paczki.

---

## 8. Werdykt

**`PASS-WITH-NOTES`.**

Praca merytorycznie jest bardzo dobra. Operator nie zaufał istniejącemu kodowi, zmierzył go w żywym silniku i znalazł cztery realne wady geometryczne — **wszystkie cztery potwierdziłem własnymi mutacjami, co do liczby**. Test tematu mierzy relacje, nie nazwy mesh, i faktycznie czerwienieje po każdej z czterech niezależnych mutacji, które zadałem. Dokumentacja historyczna jest rzetelna, bez anachronizmów, oparta na właściwych ustępach Polibiusza, Diodora i Cezara. Wszystkie bramki i oba testy tematyczne są zielone na moim własnym uruchomieniu. Regresja jest zerowa: 75/75 jednostek zbudowanych, zmieniły się dokładnie te dwie, o które chodziło.

Uwagi **N1 (zakres)** i **N2 (gotowość integracyjna)** są w rozumieniu §3b **niekosmetyczne** — dlatego jawnie stwierdzam: **ten raport nie zamyka tematu.** Nie rekomenduję jednak zwracania go Operatorowi (§3b, zdanie o powrocie jak przy `FAIL`), bo **nie ma w kodzie niczego do poprawienia** — cofnięcie kwestionowanego fragmentu byłoby regresją. Domknięcie należy do orkiestratora i wymaga dwóch czynności administracyjnych, nie kolejnej rundy inżynierskiej:

1. **ratyfikacja poszerzonej allowlisty** (`addTallOvalShield` + `namePrefix`) jawnym zapisem w śladzie runu, z odnotowanym pomiarem 75/75 i statusem „Wojownika celtyckiego" jako nieosiągalnego z danych;
2. **wpisanie do `REJESTR-PROSB-I-ZADAN.md`** czterech znalezisk pobocznych: nieaktualne `Uwagi` Gaesatae, `Typ: "Swordsman"` przy jednostce z włócznią, przerwa broń–pięść w `addLongSwordRight`/`addSpearRight`, oraz nienaprawiona orientacja tarczy w martwym `buildGermanWarrior()`; osobno, w domenie `PROCESS`, rozjazd stopki commita wobec faktycznego modelu wykonawczego.

**Gotowość kodu do integracji: TAK.** **Gotowość tematu do zamknięcia: NIE — do czasu wykonania punktów 1 i 2 wyżej.**

Artefakty dowodowe (do wglądu Final Control): `/home/user/wt-eval-ZELAZO-T2` (gałąź, czysty), `/home/user/wt-eval-ZELAZO-T2-main` (baseline `origin/main`, czysty), `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/eval-render.cjs` (mój niezależny test), `…/scratchpad/eval-kamera-gry.png`, `…/scratchpad/eval-skala-tokena.png`, `…/scratchpad/shots-op/{przed,po}-*.png`.