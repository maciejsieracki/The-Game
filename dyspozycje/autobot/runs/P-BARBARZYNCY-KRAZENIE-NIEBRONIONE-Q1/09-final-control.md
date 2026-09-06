# P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1 — Final Control, runda 1/5

MODEL+EFFORT: **Opus 5, effort high** · DATA: 2026-09-06 · ROLA: Final Control (sędzia §3c).
IZOLACJA: worktree `/home/user/wt-barbarzyncy`, gałąź `autobot/P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1`.
Guard §2b: `git merge-base --is-ancestor 022b82aa HEAD` = **0** (HEAD `d98b8f78` = baza + 3 commity rund),
drzewo czyste przed i po pracy (`git diff --quiet` = 0). Kodu nie zmieniałem. Wszystkie mutacje
weryfikacyjne wykonane w **klonach poza worktree** (`scratchpad/basecheck` @ `022b82aa`,
`scratchpad/headmut` @ `d98b8f78`), przywrócenie potwierdzone md5 po każdej.

Każda liczba niżej pochodzi z **mojego własnego uruchomienia**, nie z raportów etapów.

## 1. ODTWORZENIE OBJAWU I NAPRAWY — WŁASNA SYMULACJA 300 TUR (kryterium 1)

Konfiguracja **produkcyjna**: `turn` przekazywany w każdym wywołaniu (jak `main.ts:32209-32212`),
ŻYWY obóz raid-ready (`campId` istniejącego obozu + 2 jednostki `inGarnizon` w `campControlRadius`),
BASE `022b82aa` vs HEAD `d98b8f78` z osobnych bundli esbuild.

| reżim | BASE (normal/hard) | BASE (easy / `difficulty` pominięty) | HEAD (wszystkie 4 warianty) |
|---|---|---|---|
| **2 niebronione** + 1 bronione | cykl **okres 22**, `attack` NIGDY, **14 przyjazdów do każdego miasta**, md5 `93d70635` | parkuje (okres 1), 3 realne ruchy, md5 `48f4ed7a` | **`attack` w turze 58**, 0 cykli, każde miasto raz, md5 `ed48a024` |
| **3 niebronione** + 1 bronione | cykl **okres 44**, NIGDY | parkuje | **`attack` w turze 59**, md5 `1182c498` |
| 4 niebronione + 1 bronione | cykl **okres 66**, NIGDY | parkuje | **`attack` w turze 60**, md5 `2790f273` |

**Okres 22 (2 miasta) i 44 (3 miasta) — dokładnie objaw z ECHO właściciela — odtworzyłem sam na
ścieżce z przekazanym `turn`.** BASE daje ten sam log z `turn` i bez `turn` (md5 `93d70635` w obu),
bo `raidReady` bierze się tu z żywego obozu, nie z osierocenia — potwierdzone wykonawczo.

Druga, **niezależna geometria** (plansza 50×24, miasta niewspółliniowe `(10,4)/(18,19)/(28,6)`,
bronione `(46,12)`, start `(4,12)`): BASE normal/hard cykl **okres 46** (2 miasta) / **66** (3),
`attack` NIGDY, 7+6 / 5+4+9 przyjazdów; HEAD `attack` w turze **58** / **69**, każde miasto raz,
0 tur bez komendy. Naprawa działa niezależnie od geometrii.

## 2. JEDNA REGUŁA NA WSZYSTKICH POZIOMACH TRUDNOŚCI (kryterium 2)

- **Grep strukturalny (mój):** w całym ciele `decideBarbarianMoves` (linie 1732–2445) `difficulty`
  pada **wyłącznie w sygnaturze (linia 1730)**. Zero wystąpień `difficulty|easy|normal|hard` w
  liniach kodu wyboru celu. `turnNum` używane wyłącznie w gałęzi `orphaned`.
- **Dowód wykonawczy (mój):** logi komend easy = normal = hard = pominięty są **bit-identyczne**
  (md5 wyżej) w obu geometriach i przy `turn` przekazanym oraz pominiętym. Na BASE — rozjazd.
- **Dowód mutacyjny (mój, FC-M5):** przywrócenie warunku per trudność
  (`skipDefenselessCities = difficulty !== 'easy'`) **czerwieni** `barbarzyncy-krazenie` **205/42**.

Warunek per trudność = NAPRAW: **nie występuje**.

## 3. TABELA CZTERECH OSI — kompletność i „błąd za błąd"

`01-operator-runda1-tabela-4-osi.txt` ma **120 wierszy** = niebronione {0,1,2,3} × bronione {0,1,2}
× osiągalność {OSIĄG, NIEOS} × raidReady {raid, obóz} × trudność {easy, normal, hard}, z pominięciem
niemożliwej kombinacji (0 bronionych × NIEOS). Krzyż jest **kompletny**.

Zweryfikowałem samodzielnie najbardziej ryzykowny reżim (bariera `morze`, bronione na innej wyspie,
jednostka raid-ready, 300 tur) — moje liczby **co do bitu** zgadzają się z liczbami wpisanymi do
komentarza produkcyjnego po obronie:

| reżim | BASE | HEAD |
|---|---|---|
| 1 nieb. + 1 bron. NIEOSIĄG | md5 `c11f299bdd`, 3 realne ruchy, **296/300 tur bez komendy** | md5 `7d234f1a96`, 3 ruchy, **0** bez komendy |
| 2 nieb. + 1 bron. NIEOSIĄG | md5 `cd7cef7e70`, **241** realnych ruchów, 29 bez komendy, **15+15 przyjazdów** | md5 `00e2ab78d0`, **11** ruchów, 0 bez komendy, **1+1 przyjazd**, 1 unikalna pozycja w ostatnich 60 turach |
| 3 nieb. + 1 bron. NIEOSIĄG | md5 `b9314d677b`, 260 ruchów, 13 bez komendy | md5 `c73be52345`, 22 ruchy, 0 bez komendy |

Mutacja **FC-M8** (usunięcie listy „ostatniej deski ratunku"): **287/300 tur bez komendy** w reżimie
2 niebronione — **dokładnie liczba deklarowana w komentarzu produkcyjnym**, i bramka to łapie
(`barbarzyncy-krazenie` 237/11). W reżimie z bronionym OSIĄGALNYM ta sama mutacja daje log
**bit-identyczny** — co również jest dokładnie tym, co komentarz twierdzi („skutek ściśle DODATKOWY").

**Zamiana błędu na błąd — orzeczenie:** w reżimie NIEOSIĄGALNYM naprawa zamienia krążenie na
„odwiedź każde raz, potem stój" (bezruch z komendą, 1 unikalna pozycja). To NIE jest nowy defekt:
reszta bezruchu to `if (raidReady) continue`, który dispatch (pkt 2 pięciu punktów oraz F3) nazywa
**świadomie poza zakresem** i wymaga wyłącznie **jawnego udokumentowania** — co jest zrobione,
z moimi liczbami się zgadza, a zdanie „zamrożenia znikają" zostało z komentarza usunięte.
Jedyny wiersz „w drugą stronę" to `2/0` i `3/0` na easy (0 bronionych): parkowanie → krążenie —
to jest wprost ECHO właściciela (jedna reguła; „barbarzyńcy groźniejsi na łatwym"), a przy
0 bronionych nie istnieje inny cel, więc zachowanie easy zrównało się z normal/hard.
**Żaden wiersz nie przechodzi z „dociera" na „nie dociera".**

## 4. ODPOWIEDZI NA PYTANIA WSPÓLNE

**A. Czy jakaś asercja została osłabiona/usunięta/pozbawiona zdolności czerwienienia?**
Diff dotyka **dwóch** plików bramek. Policzone po obu stronach:

| plik | BASE `022b82aa` | HEAD `d98b8f78` |
|---|---|---|
| `gra/tools/barbarzyncy-krazenie-test.cjs` | **nie istnieje** | NOWY, **249/0** (611 linii) |
| `gra/tools/barb-city-behavior-test.cjs` (uruchomienie) | **178 passed / 0 failed** | **177 passed / 0 failed** |
| ⤷ `assert(` / `eq(` (statycznie) | 70 / 51 | 69 / 53 |
| ⤷ `expectSelfCheckFails(` (żywe dowody mutacyjne) | **8** | **7** |
| ⤷ `expectSelfCheckPasses(` (wymóg „mutant zielony") | 0 | **0** — wycofany, helper usunięty |

Trzy ustalenia:
1. **Sekcja 6d — odwrócenie, nie osłabienie.** `resetIdx !== -1` → `eq(resetIdx,-1)`, `n >= 2` →
   `eq(n, 1)`, plus dwie **nowe** asercje behawioralne (monotoniczny spadek dystansu do bronionego).
   Stare asercje żądały krążenia, które wiążące ECHO każe usunąć — utrzymanie ich zielonymi jest
   niemożliwe. Odwrócone asercje czerwienieją (moje FC-M1/M4/M6/M7).
2. **Sekcja 13 — ubyło jeden ŻYWY dowód mutacyjny** (8 → 7) i netto jedna asercja (178 → 177).
   Zastąpiony trzema asercjami PRZESŁANKI na tekście źródła. Sprawdziłem, czy czerwienieją:
   **FC-M1 (`[clearedSet[…]!]` → `[]`) czerwieni** — jedyna łapiąca linia to
   `FAIL: USTERKA 1 (przeslanka b)`, czyli **żadna asercja behawioralna w całej rodzinie tego
   mutanta nie widzi**. Sprawdziłem też, czy jakaś mogłaby: **własna sonda równoważności — 36
   przebiegów × 400 tur, 3 geometrie (w tym ciasna 20×10, gdzie reset odpala kilkadziesiąt razy:
   16/31/15 przyjazdów), 1–4 miast, 3 trudności — logi `[ostatnie]` i `[]` są IDENTYCZNE co do
   bitu.** Mutant jest zachowaniowo martwy, więc dowodu killującego przywrócić się nie da.
   Nie jest to więc „asercja, która nie może już zaczerwienić" — ale **jest** to ubytek jednego
   żywego dowodu mutacyjnego w bramce STAŁEJ, przy allowliście „wyłącznie dodanie asercji;
   zakaz usuwania i osłabiania". Patrz W1.
3. **Żaden inny plik bramki nie został dotknięty** — `git diff --name-only` daje dokładnie 7 plików.

**B. Czy zakres wyciekł poza allowlistę?** `git diff 022b82aa..HEAD --name-only`:
`gra/src/game/barbarians.ts` ✓ · `gra/tools/barbarzyncy-krazenie-test.cjs` (NOWY) ✓ ·
`gra/tools/barb-city-behavior-test.cjs` ✓ (allowlista: istniejące bramki barbarzyńców) ·
4 artefakty runu w `dyspozycje/autobot/runs/P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1/` ✓.
**Zero** zmian w `gra/src/main.ts`, `gra/src/game/ai.ts` (§2b, temat równoległy), `gra/data/*.json`,
`docs/decyzje/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`, `playbook.json`. **Zakres czysty.**

**C. `tsc --noEmit` i pięć bramek referencyjnych — moje uruchomienia:**
`node ./node_modules/typescript/bin/tsc --noEmit` → **0 błędów** (exit 0).
logic **213/213** · tech-tree **19/19** · research **33/33** · unit-replace **13/13** · combat **6/6**.
Wszystkie zielone.

**D. Czerwone bramki w rodzinie tematu.** Grep `barb|raid|oboz` po `gra/tools/*-test.cjs` daje
**16** bramek. Moje uruchomienia na HEAD: 12 zielonych (m.in. `barb-city-behavior` 177/0,
`barbarians-test` 213/0, **`barbarzyncy-krazenie` 249/0**), **4 czerwone**:
`barb-camp-destruction` 82/2 · `barb-city-capture-cluster` 92/1 · `oboz-lowiecki-las` 72/19 ·
`oboz-lowiecki-las-znika-render` 26/1. Zmierzyłem te same cztery na **czystym klonie bazy
`022b82aa`** (przodek `origin/main`, sprawdzone `git merge-base --is-ancestor`) **poza worktree** —
**identyczne liczby**. Wszystkie cztery są pre-istniejące, **zero regresji**, brak bramki
nieusprawiedliwionej pomiarem.

## 5. REGUŁA PRZECIW SAMOOSZUKIWANIU — DZIEWIĘĆ WŁASNYCH MUTACJI

Inne niż mutacje z raportów (9a–9e Operatora, M-E1/M-E2/M-E3 Evaluatora). Każda na kopii repo poza
worktree, każda cofnięta, md5 źródła po każdej zgodne z oryginałem; `git diff --quiet` w worktree = 0.

| # | mutacja | wynik |
|---|---|---|
| FC-M1 | `unit.clearedCityIds = [clearedSet[…]!]` → `= []` | **złapana** — `barb-city-behavior` 176/**1** (tylko asercja przesłanki, patrz A.2) |
| FC-M2 | `revisitTargets.sort(a.d-b.d)` → `b.d-a.d` | **złapana** — `krazenie` 246/**3** |
| FC-M3 | usunięcie dedupu `if (consideredCityIds.has(c.id)) continue;` | **NIEZŁAPANA** (5 bramek bez zmian) — patrz W2 |
| FC-M4 | warunek resetu `=== 0` → `<= 1` | **złapana** — `krazenie` 99/**148**, `barb-city-behavior` 158/**13** |
| FC-M5 | przywrócenie warunku per trudność | **złapana** — `krazenie` 205/**42** |
| FC-M6 | próg dotarcia `<= 1` → `<= 2` | **złapana** — `barb-city-behavior` 173/**4** |
| FC-M7 | `targets.push(...revisit)` → `unshift` | **złapana** — `krazenie` 119/**130**, `barb-city-behavior` 158/**14** |
| FC-M8 | usunięcie listy „ostatniej deski ratunku" | **złapana** — `krazenie` 237/**11**; 287/300 tur bez komendy |
| FC-M9 | `continue` → `break` w pętli kandydatów | **złapana** — `krazenie` 243/**3** (przed tą rundą ta mutacja była NIEZŁAPANA) |

**Tautologii nie znalazłem.** Sekcja 4 i 10 nowej bramki porównują logi z **osobnych przebiegów**
(na BASE ta asercja jest czerwona — sprawdzone). Sekcja 5 jest jawnie oznaczona jako uzupełnienie
strukturalne, nie zamiennik dowodu wykonawczego, i FC-M5 ją czerwieni. Dowody mutacyjne wymagają
**niezerowego exitu ORAZ linii `FAIL:` pasującej do numeru sekcji** — awaria kompilacji nie liczy
się jako „mutant złapany".

## 6. WERDYKTY PER ZARZUT (§3c)

| # | Zarzut | Werdykt | Podstawa (mój pomiar) |
|---|---|---|---|
| 1 | Dowód kryterium 1 nie pokrywa ścieżki produkcyjnej — `turn` pominięty | **ODDAL** | Pokrycie domknięte sekcją 10 (realny test, `turn` w każdym wywołaniu, żywy obóz). Teza „naprawa nie działa na ścieżce produkcyjnej" **obalona**: BASE z `turn` = cykl 22/44/66, `attack` NIGDY; HEAD z `turn` = `attack` w 58/59/60. Reżim sondy Evaluatora (osierocona po `orphanedChaseTurnLimit`, cel 40+ heksów przy `aggroRadius=6`) **nie zawiera objawu także w BASE**, więc nie jest odniesieniem |
| 2 | Fałszywe „logi PRZED/PO są BIT-IDENTYCZNE" w komentarzu produkcyjnym | **ODDAL** | Przyjęty i naprawiony. Wszystkie wpisane liczby odtworzyłem co do md5: `cd7cef7e70` 241/29 → `00e2ab78d0` 11/0; `b9314d677b` 260/13 → `c73be52345` 22/0; `c11f299bdd` 3/296 → `7d234f1a96` 3/0 |
| 3 | `idle === 0` nie dowodzi ruchu — bezczynność zamieniona na komendę bez skutku | **ODDAL** | Przyjęty. Sekcja 6 przepisana na trzy rozłączne asercje z jawnym zastrzeżeniem, komentarz sprostowany. Potwierdziłem bezruch (1 unikalna pozycja w ostatnich 60 turach) — i to, że wytwór **już tego nie ukrywa** |
| 4 | `break` → `continue` bez pokrycia | **ODDAL** | Przyjęty. Sekcja 11 + dowód 9e. **FC-M9**: `break` czerwieni `krazenie` 243/3 (przed rundą: komplet zielony) |
| 5 | Guard `civCitiesBase.length > 0` bez pokrycia, komentarz przypisywał mu skutek | **ODDAL** | Przyjęty. Komentarz (linie 1927–1931 PL / 2014–2018 EN) przepisany na „guard OBRONNY, nie behawioralny". Twierdzenie zgodne z pomiarem |
| 6 | Osłabienie istniejącej bramki — `expectSelfCheckPasses` żądał ZIELONEGO mutanta | **ODDAL** | Przyjęty. `expectSelfCheckPasses` wycofany (grep = 0), martwa gałąź `: []` usunięta z produkcji. Zamiennik **czerwienieje** (FC-M1). Niemożność przywrócenia dowodu killującego potwierdzona **moją** sondą: 36 × 400 tur, 3 geometrie — `[ostatnie]` ≡ `[]` co do bitu. Nazwany defekt nie istnieje. Ubytek pokrycia jako taki → osobne znalezisko **W1** |
| 7 | Rozjazdy liczbowe w raporcie (3 vs 4 czerwone, 14 vs 16 bramek) | **ODDAL** | Przyjęty i sprostowany. Moje uruchomienia: **16** bramek rodziny, **4** czerwone, wszystkie pre-istniejące na czystej bazie |

**Własne znaleziska Final Control:**

| # | Znalezisko | Werdykt |
|---|---|---|
| **W1** | Bramka STAŁA straciła jeden **żywy dowód mutacyjny** (`expectSelfCheckFails` 8 → 7) i netto jedną asercję (178 → 177) w `barb-city-behavior-test.cjs`, przy allowliście dispatchu: „istniejące bramki — **wyłącznie dodanie asercji; zakaz usuwania i osłabiania**". Ubytek jest **wymuszony** (mutant stał się zachowaniowo martwy przez naprawę nakazaną ECHO) i **udokumentowany** (nota N1/N2 Operatora, obrona), a zamiennik czerwienieje — ale kultura tego repo jest w tym punkcie jednoznaczna: §6 `R-PROC-AUTOBOT.md` przy dwóch weryfikatorach stałych zapisuje wprost „nie usuwaj i nie osłabiaj … bez ECHO właściciela" i „`A7` nie wolno osłabiać". ECHO z 2026-09-05 dotyczy zachowania barbarzyńców, **nie** pokrycia bramki — nie pokrywa tej zmiany. Nie jest to pozycja z §9 (brak automatycznego `FAIL`), a rozstrzygnięcie zależy od intencji właściciela, nie od wytworu | **DO DECYZJI CZŁOWIEKA** |
| **W2** | Dedup segmentu „ostatniej deski" (`if (consideredCityIds.has(c.id)) continue;`, linia 2196) jest **bez pokrycia** — FC-M3 nie czerwieni żadnej bramki. Zmierzone: zachowaniowo neutralny (identyczne wyniki 5 bramek), a komentarz **nie** przypisuje mu skutku behawioralnego. Ta sama klasa co guard z zarzutu 5, już jawnie opisany jako obronny | **ODDAL** |
| **W3** | Dowód strukturalny (sekcja 5) skanuje wyłącznie zakres `const skipDefenselessCities` → `const nearestCity`; **nowy** fragment naprawy (lista „ostatniej deski", linie 2142–2200, i pętla kandydatów, 2414) leży poza tym oknem. Warunek per trudność wstawiony tam nie zostałby złapany strukturalnie — ale zostałby złapany wykonawczo (sekcje 4 i 10). Dziś: mój grep całego ciała funkcji (1732–2445) daje **zero** odwołań do `difficulty`. Brak defektu, luka do zawężenia przy okazji | **ODDAL** |

## 7. WARUNKI INTEGRACJI (nie werdykty — do wykonania ręką orkiestratora)

1. **§6 `R-PROC-AUTOBOT.md` — wpis nowej bramki** `gra/tools/barbarzyncy-krazenie-test.cjs`
   (wynik referencyjny **249/0**). §6 dosłownie: „Nowa bramka istnieje dopiero wtedy, gdy jest
   w tej tabeli … wpis do tabeli jest **częścią integracji** tematu, który bramkę stworzył".
   `docs/decyzje/**` jest poza allowlistą tematu — nota N3 Operatora jest **słuszna**.
2. **Rozjazd dokumentów (README, „Jeśli dokumenty się różnią").**
   `dyspozycje/PYTANIA-OTWARTE.md:16636` nadal niesie
   `ECHO P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1 = A (2026-08-13)`: „Akceptowalne … **ZAMKNIĘTE**.
   Zero kodu do zmiany", co **wprost przeczy** wiążącemu ECHO z 2026-09-05 („NAPRAWIĆ"), a
   `:16180` trzyma ABC tematu jako `STATUS: **OTWARTE**` mimo odpowiedzi właściciela
   (`REJESTR-PROSB-I-ZADAN.md:5721`). Plik jest poza allowlistą tematu — Operator nie mógł tego
   ruszyć. Bez oznaczenia starego wpisu jako zdezaktualizowanego kolejna sesja może w dobrej
   wierze cofnąć tę naprawę.
3. **Higiena bramek (do zarejestrowania jako osobny temat, §16b pkt 4).**
   `gra/tools/barb-karencja-czas-trwania-real-render-test.cjs` (oraz dwie bramki
   `barbarian-cooperation-grace*`) zapisują dowody PNG do **śledzonego** katalogu runu innego
   tematu (`dyspozycje/autobot/runs/R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1/dowody/`). Samo
   uruchomienie bramki brudzi drzewo i łamie guard §2b „czyste drzewo". Zaobserwowane przeze mnie
   podczas przebiegu rodziny; plik przywrócony kopią blobu z `HEAD` (nie `git checkout`), drzewo
   czyste. **Nie jest to defekt tej rundy** — bramki nie były w tym temacie zmieniane.

## 8. CHECKLISTA §16b

1. `00-dispatch.md` istnieje; `GOAL` w dispatchu = `GOAL` w raportach Operatora, Evaluatora
   i Obrony — **zgodny**, bez dryfu. ✓
2. ID `P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1` identyczne we wszystkich etapach i w nazwie gałęzi. ✓
3. **Każdy** z 7 zarzutów ma odpowiedź Obrony (7/7, każda z dowodem z wytworu) i werdykt wyżej. ✓
4. `PASS-WITH-NOTES` Obrony nie ukrywa uwagi o GOAL/dowodzie/zakresie/§9 — nota o granicy
   allowlisty jest podniesiona jawnie (W1), uwagi niekosmetyczne wypisane w §7. ✓
5. Licznik rund **1/5**, nie zresetowany; Obrona poprawnie zadeklarowana jako **druga faza tej
   samej rundy 1**, nie runda 2. ✓
6. `REJESTR-PROSB-I-ZADAN.md:5721` odzwierciedla stan faktyczny (ECHO „NAPRAWIĆ", cykl 22/44);
   `PYTANIA-OTWARTE.md` — **nie** (§7 pkt 2). ✗ → warunek integracji
7. Temat niedzielony na węzły. Najsłabszy węzeł procesu w tej rundzie: **dowód pokrycia
   ścieżki produkcyjnej** (zarzut 1) — trafnie wskazany przez Evaluatora i domknięty w tej samej
   rundzie sekcją 10.
8. Agregat: **zero `NAPRAW`**, jeden `DO DECYZJI CZŁOWIEKA` (W1) → **`DECISION_REQUIRED`**.
   Temat **nie wraca** do Operatora; do właściciela idzie wyłącznie pozycja W1, reszta stoi
   gotowa do integracji po jego odpowiedzi (po dopięciu warunków z §7).

## PYTANIE DO WŁAŚCICIELA (jedyna pozycja `DO DECYZJI CZŁOWIEKA`)

**W1.** Naprawa nakazana Twoim ECHO z 2026-09-05 sprawiła, że jeden ze stałych dowodów mutacyjnych
w istniejącej bramce `barb-city-behavior-test.cjs` przestał cokolwiek odróżniać — zmutowany wariant
zachowuje się **identycznie** co do bitu (zmierzone: 36 przebiegów × 400 tur, 3 geometrie).
Operator zastąpił go trzema asercjami pilnującymi przesłanki (czerwienieją — sprawdzone), ale bilans
tej bramki to **178 → 177 asercji i 8 → 7 żywych dowodów mutacyjnych**, przy allowliście dispatchu
„zakaz usuwania i osłabiania". **Akceptujesz ten udokumentowany ubytek, czy żądasz innego
rozwiązania** (np. zachowania zabitego dowodu w formie jawnie oznaczonej jako historyczna)?
Wytwór sam tego nie rozstrzyga — to decyzja o priorytecie, nie o faktach.

## KONTRAKT

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1
GOAL: barbarzyńca stojący przed wyborem celu podejmuje decyzję i ją realizuje; oscylacja bez
dotarcia do żadnego celu znika; jedna reguła na wszystkich poziomach trudności
ZMIANY/COMMIT: bez zmian w kodzie gry ani w bramkach; wyłącznie ten raport w
`dyspozycje/autobot/runs/P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1/09-final-control.md`
TESTY: własna symulacja 300 tur BASE vs HEAD w konfiguracji produkcyjnej (`turn` przekazany, żywy
obóz raid-ready) w DWÓCH geometriach — objaw odtworzony (cykl 22 / 44 / 66, `attack` NIGDY),
naprawa potwierdzona (`attack` w turze 58 / 59 / 60, każde miasto raz, logi bit-identyczne dla
easy/normal/hard/pominiętego) · własna sonda reżimu NIEOSIĄGALNEGO potwierdzająca co do md5 wszystkie
liczby z komentarza produkcyjnego · własna sonda równoważności 36 × 400 tur · tsc **0** ·
5 referencyjnych **213/19/33/13/6** · rodzina barbarzyńców **16** bramek, 4 czerwone potwierdzone
jako pre-istniejące na czystym klonie bazy poza worktree · **9 własnych mutacji, 8 złapanych,
1 niezłapana (zachowaniowo neutralna)** · asercje policzone po obu stronach diffu
BLOKADY: W1 (`DO DECYZJI CZŁOWIEKA`) · warunki integracji: wpis bramki do §6 `R-PROC-AUTOBOT.md`,
sprostowanie zdezaktualizowanego ECHO=A i statusu ABC w `PYTANIA-OTWARTE.md`, rejestracja higieny
bramek zapisujących PNG do cudzego katalogu runu
RUNDY: 1/5
NASTĘPNY KROK: odpowiedź właściciela na W1; po niej integracja orkiestratora wraz z warunkami z §7
DEPLOY/PUSH: NIE WYKONANO
