# PLAYBOOK — Civ „The Game"
Ostatnia aktualizacja: 2026-08-07 · sesja nr 1 (w protokole AutoBot)

> Playbook zasiany lekcjami z sesji roboczych 2026-07-21…07-26 (praca nad grą przed wdrożeniem
> protokołu). Zasady i wpisy w rejestrze pochodzą z rzeczywistych zdarzeń, nie z teorii.

## 0. Pliki robocze projektu
<!-- Lista plików, które mają istnieć na starcie sesji (rytuał, krok 4).
     Aktualizowana przy każdym ZAMKNIĘCIU. -->
| Plik | Rola | Ostatnia aktualizacja |
|---|---|---|
| AUTOBOT.md | protokół pracy (v1.2) | 2026-08-07 |
| playbook.md | pamięć projektu | 2026-08-07 |
| CLAUDE.md | zasady krytyczne projektu (ładowane automatycznie) | — |
| STAN-PRACY-HANDOFF.md | punkt wejścia każdej sesji: stan, co wolno, co w toku | — |
| dyspozycje/WERSJE.md | rejestr wersji — każdy deploy logowany natychmiast | — |
| dyspozycje/_handoff/KANAL-PRACA.md | kanał między sesjami (lokalna / chmurowa / integrator) | — |
| dyspozycje/REJESTR-PROSB-I-ZADAN.md | jedyny rejestr statusu próśb właściciela | — |
| dyspozycje/autobot/playbook.json | GENEROWANY z playbook.md — nie edytować ręcznie (generator: `dyspozycje/autobot/tools/playbook-md-to-json.cjs`) | 2026-08-07 |

## 1. Fakty ustalone
<!-- Liczby i decyzje potwierdzone przez człowieka.
     Agent ich nie zmienia — może tylko zgłosić rozbieżność. -->
| Data | Fakt | Kto/co potwierdziło |
|---|---|---|
| — | `gra/src` + `gra/data` to kanon; kopie w innych katalogach są zamrożone | CLAUDE.md |
| — | Trzy poziomy wydań: ROBOCZA (często) → KANON (po teście właściciela) → FINALNA (rzadko, na wyraźne polecenie) | Maciej |
| — | Push na GitHub wyłącznie na hasło „push"; „sprawdź" = przegląd kanału | Maciej |
| 2026-07-22 | Naprawy wykonują subagenci Sonnet 5 — jedno zadanie = jeden subagent; orkiestrator robi bramki, commit i deploy | Maciej |
| 2026-07-22 | Przed deployem zawsze `git pull` — inny integrator pracuje równolegle | Maciej |
| 2026-07-26 | Każdy temat → osobny subagent; każda decyzja i każdy napotkany problem → zapis do pliku w repo | Maciej |
| 2026-07-26 | Decyzje produktowe zapadają w formacie ABC (Sytuacja/Cel/warianty z Za i Przeciw/Rekomendacja), max 3 pytania w pakiecie | Maciej |
| 2026-07-26 | Zasada nadrzędna projektu: PARYTET AI — każdy mechanizm działa identycznie dla gracza i AI | Maciej |
| 2026-07-26 | „Nie zmieniamy tego, co już działa — tylko dostosuj" (dot. istniejących mechanizmów gry) | Maciej |

## 2. Zasady
<!-- Statusy: AKTYWNA / W OBSERWACJI / WYCOFANA / CHRONIONA.
     Nowa zasada startuje jako AKTYWNA z licznikiem 0/0.
     Licznik aktualizuj tylko wtedy, gdy zasada miała zastosowanie. -->
| ID | Zasada | Kiedy ma zastosowanie | Sprawdziła się | Zawiodła | Status |
|---|---|---|---|---|---|
| C-001 | Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda: node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir | każdy build gry | — | — | CHRONIONA (bariera — utrata danych; z CLAUDE.md) |
| C-002 | Nie uruchamiaj eksportu paneli Excel (export-*.py) na żywych danych — kierunek jest jednostronny JSON→Excel | praca z panelami sterowania | — | — | CHRONIONA (bariera — utrata danych; z CLAUDE.md) |
| C-003 | Commituj każdą ukończoną grupę plików natychmiast, nie zbiorczo na koniec pracy — repo współdzielone z drugą sesją | praca wieloetapowa w repo współdzielonym z inną sesją | 0 | 0 | AKTYWNA |
| C-004 | Deploy to jeden nierozdzielny ciąg: bramki → build → stempel → verify → WERSJE.md → KANAŁ → commit → sprawdź czy main nie odjechał → push | każdy deploy | 0 | 0 | AKTYWNA |
| C-005 | Status subagenta pracującego w tle oceniaj po znacznikach czasu plików wyjściowych, nie po etykiecie systemu — subagent może wykonać pracę i umrzeć bez raportu | pytanie o postęp pracy w tle | 0 | 0 | AKTYWNA |
| C-006 | Nie raportuj wyniku subagenta bez własnej weryfikacji na dysku lub w kodzie | każdy powrót subagenta z raportem | 0 | 0 | AKTYWNA |
| C-007 | Przed serią zmian w repo współdzielonym zostaw wpis-blokadę w KANAL-PRACA.md, po zakończeniu wpis ODBLOKOWANE | praca dłuższa niż jedna operacja, gdy inna sesja może commitować | 0 | 0 | AKTYWNA |
| C-008 | Commituj po konkretnych ścieżkach, nigdy git add -A — w drzewie bywa niedokończona praca innej sesji | każdy commit w repo współdzielonym | 0 | 0 | AKTYWNA |
| C-009 | Wklejka z innej sesji to informacja do świadomości, nie lista zadań — nic nie wykonuj bez wyraźnego polecenia | właściciel wkleja transkrypt/fragment pracy innej sesji | 0 | 0 | AKTYWNA |
| C-010 | Po utracie kontekstu najpierw zweryfikuj stan na dysku i w gicie, dopiero potem raportuj | wznowienie pracy po przerwie lub kompresji kontekstu | 0 | 0 | AKTYWNA |
| C-011 | Zmiany w generatorze mapy wymagają bramki determinizmu (map-gen-regression-test) i pomiaru przed/po, nie oceny na oko | zmiany w `gra/src/map/*` lub `map-gen-params.json` | 0 | 0 | AKTYWNA |
| C-012 | Gdy dokument rośnie przez dopisywanie korekt na końcu, złóż czystą specyfikację zanim ktoś zacznie wdrażać — inaczej wykonawca użyje nieaktualnych wartości ze środka | dokument projektowy z wieloma turami zmian | 0 | 0 | AKTYWNA |
| C-013 | Zero samooceny liczników: liczniki „sprawdziła się"/„zawiodła" wpisuje wyłącznie mechanizm na podstawie realnych, zarejestrowanych przebiegów (recordRuleOutcome / generator playbook-md-to-json.cjs) — agent NIGDY nie wpisuje ich z pamięci ani z własnej oceny swojej pracy; nowa zasada zawsze startuje 0/0 | zapis lub aktualizacja liczników w playbooku | 0 | 0 | AKTYWNA |
| C-014 | Worktree subagenta usuwaj jako ostatni krok zamknięcia zlecenia (po scaleniu albo odrzuceniu) — tak samo obowiązkowo jak wpis do rejestru; stan niescommitowany zapisz wcześniej na gałąź `zapas/<nazwa>` i wypchnij na origin. Zasada nadrzędna: wykonana praca → commit na GitHub → czyszczenie dysku; lokalnie zostaje tylko to, z czym jest jeszcze coś do zrobienia | zamknięcie każdego zlecenia subagenta oraz sprzątanie scratchpada | 0 | 0 | AKTYWNA |
| C-015 | Worktree zakładaj przez sparse-checkout, bez `gra-robocza/`, `gra-kanon/` i katalogów `dist/` — ~370 MB zamiast ~810 MB rozmiaru jednego worktree na dysku; wyjątek: subagent robiący build lub deploy dobiera `gra-robocza` jawnie, inaczej publikacja bundla nie ma gdzie trafić | zakładanie worktree dla subagenta | 0 | 0 | AKTYWNA |
| C-016 | Sprawdzaj, co JEST W PLIKACH, nie co pamiętasz — każde twierdzenie przedstawiane właścicielowi jako fakt musi mieć świeży odczyt z repozytorium albo uruchomienie bramki. Przy audycie rekordu danych wypisuj WSZYSTKIE pola, nigdy sztywną listę kolumn dobraną z góry: pominięta kolumna wygląda w raporcie identycznie jak kolumna o wartości zero | każde twierdzenie o stanie kodu, danych lub bramek | 0 | 0 | AKTYWNA |
| C-017 | Orkiestrator prowadzi WŁASNĄ pracę przez pętlę AutoBot tak samo jak pracę subagentów — jest Operatorem swojej zmiany i nie ocenia sam siebie; werdykt wydaje osobny Evaluator, bo cudze błędy widać lepiej niż własne. Dotyczy każdej zmiany zapisanej do repozytorium i każdej liczby podanej właścicielowi jako fakt; czynności czysto odczytowe są wyłączone | każda zmiana i każde twierdzenie orkiestratora | 0 | 0 | AKTYWNA |
| C-018 | Pytanie ABC dla właściciela zawsze jako turniej, nie pojedyncza propozycja: orkiestrator pisze własny projekt A/B/C i wskazuje własny "typ" (uzasadniony przez `PROFIL-DECYZYJNY-MACIEJ.md`), NIEZALEŻNY drugi agent (świeże oczy, nie widzi projektu orkiestratora) pisze własny, osobny projekt z własnym "typem". Sędzia (Evaluator) ocenia dwuwarstwowo — Warstwa 1 (dominująca): trafność zastosowania wzorca z profilu w uzasadnieniu "typu"; Warstwa 2 (tiebreaker): zgodność z danymi, kompletność wariantów — i wybiera/syntetyzuje zwycięzcę z jawną adnotacją "wg profilu: typowana X, bo..." przy Rekomendacji, zawsze obok pełnego A/B/C, nigdy jako zamiennik wyboru. Dotyczy KAŻDEGO pytania ABC formułowanego od nowa; nie dotyczy pytań, na które właściciel już odpowiedział wprost literą (te tylko się ECHO'uje i zapisuje), czysto inżynierskich decyzji bez wpływu na gameplay/UX/dane gracza, ani bezpośrednich ustaleń wypracowanych żywą rozmową z właścicielem [C-018] [R-PROFIL-TURNIEJ-PUNKTACJA-Q1] | formułowanie nowego pytania ABC dla właściciela (Maciej 2026-08-08, rozszerzone 2026-08-08) | 0 | 0 | AKTYWNA |
| C-019 | RECYDYWA (2. wystąpienie 2026-08-08, 1. `hud-moc-warstwa`): Operator w worktree mimo jawnego "MIEJSCE PRACY — WYŁĄCZNIE ta ścieżka" czasem i tak zapisuje (całość albo kopię) do współdzielonego drzewa głównego. Za 1. razem sam to wykrył i naprawił (`git checkout --` w main), za 2. razem NIE zgłosił tego w raporcie — wykryte wyłącznie przez stop-hook ("uncommitted changes") + ręczne porównanie `git diff` obu drzew. Przeciwdziałanie: orkiestrator sprawdza `git status --porcelain` na drzewie głównym PO KAŻDYM powrocie Operatora pracującego w worktree, nie tylko gdy hook o tym przypomni — traktować to jako stały krok zamknięcia zlecenia, nie reakcję na alarm [C-019] | powrót Operatora pracującego w worktree, przed uznaniem zlecenia za zamknięte | 0 | 0 | AKTYWNA |
| C-020 | Przed oceną schowka git sprawdź TAKŻE pliki nieśledzone (`git stash show --include-untracked`, `git show <stash>^3`) — `git stash show` domyślnie ich nie pokazuje, więc ocena „to tylko artefakty" może pomijać realną pracę | ocena zawartości schowka git przed jego skasowaniem | 0 | 0 | AKTYWNA |
| C-021 | Kasując wiele schowków, rozwiązuj każdy po SHA (`git stash list --format="%gd %H"`), nie po zapamiętanym indeksie — po każdym `git stash drop` indeksy się przesuwają i lista z góry przestaje obowiązywać | kasowanie więcej niż jednego schowka git | 0 | 0 | AKTYWNA |
| C-022 | Pracę wartą zachowania przypinaj gałęzią i wypychaj na origin, nie zostawiaj w schowku — schowki są wyłącznie lokalne (nie trafiają na GitHub) i ginie je `git stash clear`, wymiana dysku lub czyszczenie folderu | zabezpieczanie niezacommitowanej pracy przed dłuższą przerwą lub kasacją | 0 | 0 | AKTYWNA |
| C-023 | Na pytanie właściciela „czy jest jeszcze coś do zrobienia/nienaprawionego" ZAWSZE świeży przegląd plików (`PYTANIA-OTWARTE.md`, `REJESTR-PROSB-I-ZADAN.md`) i realnego stanu w kodzie dla pozycji oznaczonych jako naprawione — nigdy odpowiedź z pamięci rozmowy. Status zapisany w pliku bywa przestarzały (fix wdrożony, etykieta nieaktualizowana) — samo „plik mówi zamknięte" bez sprawdzenia kodu to wciąż odpowiadanie z pamięci pliku, nie ze stanu faktycznego | każde pytanie właściciela o pozostałe otwarte tematy/błędy | 0 | 0 | AKTYWNA |
| C-024 | KAŻDA odpowiedź orkiestratora na pytanie właściciela — nie tylko zmiana w repozytorium — przechodzi przed wysłaniem przez osobnego Evaluatora, który sprawdza jej poprawność wobec realnego stanu plików/kodu. Nie tylko „czy kod działa", ale „czy to, co mówię właścicielowi, jest prawdą". Zasada Macieja 2026-08-08 po incydencie z przestarzałym statusem `BUG-TOOLTIP-MOC-NIEPELNA`: „jeżeli o coś pytam i Ty odpowiadasz, to ponownie sprawdzić sobie przez ewaluatora, czy Twoja odpowiedź jest prawidłowa" | każda odpowiedź orkiestratora na pytanie właściciela, przed wysłaniem | 0 | 0 | AKTYWNA |
| C-025 | Zadanie Operatora naprawiającego zgłoszony błąd ma zakres = TYLKO ten błąd. Zabronione „przy okazji"/„skoro już tu jestem" — poprawki, refaktory, sprzątanie stylu, przenoszenie kodu poza tym, co wynika wprost z przyczyny błędu, nawet jeśli wyglądają jak ulepszenie. Prompt zlecenia MUSI zawierać explicite granicę zakresu (konkretne pliki/funkcje) i zakaz zmian poza nią. Zasada Macieja 2026-08-08 po serii regresji („70% mojego czasu to poprawki tego, co już było naprawione"): „jeżeli jest jakiś błąd, to agent powinien się zająć tylko i wyłącznie poprawieniem tego błędu, a nie kopać w kodzie i psuć czegoś innego" | formułowanie zlecenia naprawy błędu dla Operatora | 0 | 0 | AKTYWNA |
| C-026 | Gdy naprawa błędu MUSI dotknąć funkcji/komponentu współdzielonego (używanego w więcej niż jednym miejscu wywołania) — bo to jedyny poprawny zakres, nie „przy okazji" — Operator PRZED zmianą wypisuje wszystkie miejsca użycia (grep/referencje) i PO zmianie weryfikuje każde z osobna, że nadal działa zgodnie z zamierzeniem; „to powinno nadal działać" bez sprawdzenia jest zakazane. Evaluator w SCOPE/NO-SIDE-EFFECT sprawdza, czy ta lista miejsc użycia w ogóle powstała i czy każde zostało zweryfikowane, nie tylko czy diff „wygląda" bezpiecznie. Zasada Macieja 2026-08-08, dopełnienie C-025: „jeżeli zmienia daną rzecz, a ma ona wpływ na inne kwestie, to powinien to przemyśleć i przewidzieć" | naprawa dotyka kodu współdzielonego z innymi funkcjami/ekranami | 0 | 0 | AKTYWNA |

## 3. Rejestr błędów — NIGDY WIĘCEJ
<!-- Najnowsze na górze. Powtórka błędu z tej listy = incydent krytyczny. -->
| Data | Co się stało | Przyczyna | Reguła zapobiegawcza (→ ID zasady) |
|---|---|---|---|
| 2026-08-08 | WZORZEC POWTARZAJĄCY SIĘ: naprawa jednego miejsca psuje inne, wykryte dopiero na kolejnym playteście, nigdy przez samego Operatora/Evaluatora. Udokumentowane przypadki w tej samej klasie: (1) `BUG-KOLEJKA-BUDOWY-PRZYCISKI-ROZJECHANE` — właściciel wprost: „jedno naprawiasz, drugie psujesz... coś co wcześniej działało nagle przestało działać"; (2) `BUG-TRAKTAT-KOSZYK-REGRESJA` + `BUG-RZEKI-MEDIUM-FOW-REGRESJA` — obie zarejestrowane pod nazwą zawierającą „REGRESJA"; (3) `R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1` — udokumentowane WPROST w samym rejestrze: „4 rundy: r1 fałszywa przyczyna, r2 regresja AI→gracz, r3 regresja overpay"; (4) dostęp do surowców (`R-SUROWCE-DOSTEP`, 2026-07-26) cofnięty 3 dni później inną decyzją (`DOSTEP-SUROWCE-Q1`, commit `331aa180`) bez jawnego powiązania dwóch decyzji w jednym miejscu. Właściciel: „70% mojego czasu to jest spędzanie nad poprawkami które już kiedyś były naprawione". | Operator naprawia zgłoszony objaw, ale przy okazji dotyka lub nie sprawdza kodu współdzielonego z inną funkcją/ekranem — Evaluator SCOPE/NO-SIDE-EFFECT (`rule_105`) istniał już wcześniej, ale nie wymuszał explicite listy „miejsc użycia sprawdzonych po zmianie", więc regresja przechodziła PASS | zakres zlecenia Operatora = tylko zgłoszony błąd, zakaz „przy okazji" → C-025; zmiana kodu współdzielonego wymaga jawnej listy miejsc użycia sprawdzonych PRZED i PO → C-026 |
| 2026-08-08 | Status `BUG-TOOLTIP-MOC-NIEPELNA` w `PYTANIA-OTWARTE.md` mówił „OTWARTE", mimo że naprawa była wdrożona w FALA 260 (`eff727e`) — potwierdzone w kodzie (`hexContextTooltip.ts:668-677`, wszystkie 8 pól obecne). Wykryte dopiero przy pełnym audycie zgłoszeń na żądanie właściciela, nie proaktywnie. Wcześniej w tej samej sesji analogiczny problem: „repo jest czyste i zsynchronizowane z origin" — prawdziwe tylko dla gałęzi roboczej, nie dla `main`, skąd właściciel realnie pobierał — zdanie technicznie prawdziwe, realnie mylące | status w pliku nie był aktualizowany po deployu; twierdzenie o stanie repo nie odróżniało zakresu (moja gałąź vs main) | pytanie o pozostałe otwarte tematy → zawsze świeży przegląd plików + kodu → C-023; każda odpowiedź na pytanie właściciela → Evaluator przed wysłaniem → C-024 |
| 2026-08-07 | Przegląd 15 schowków git: Operator (Sonnet) orzekł „13 do skasowania, ŻADEN nie wymaga ratowania". Evaluator (Opus, adwokat diabła) obalił to — `stash@{1}` zawierał gotową naprawę DWÓCH czerwonych bramek regresji (`rozmiar-label-test` 1 błąd, `map-scale-menu-test` 8 błędów), a `stash@{12}` finalną wersję dokumentu audytu, której w repo nie ma. Kasacja byłaby nieodwracalna — schowki nie istnieją na GitHubie | Operator sprawdzał zawartość schowków PRÓBKOWO (wybrane fixy), przedstawiając wynik jako kompletny; nie sprawdził też plików nieśledzonych w ŻADNYM schowku | ocena schowka obejmuje pliki nieśledzone → C-020; kasowanie po SHA, nie po indeksie → C-021; wartościową pracę przypinać gałęzią i pushować → C-022 |
| 2026-08-07 | Orkiestrator zapisał w `playbook.json` liczniki dziesięciu nowych zasad (C-003…C-012) z pamięci zamiast startując je 0/0 — wartości sprzeczne z tym rejestrem (np. C-008 „recydywa czwarty raz”, a licznik pokazywał 6/1 zamiast realnej porażki). Przy tym samym scaleniu zgubiono `C-002` (całkowicie) oraz fragment `C-001` (dozwoloną komendę builda). Evaluator odrzucił iterację | samoocena zamiast pomiaru (naruszenie sekcji 4 protokołu: „agent oceniający własną pracę zawsze wystawi sobie szóstkę”) + brak weryfikacji kompletności po scaleniu dwóch źródeł zasad | wszystkie nowe zasady → 0/0 przy zapisie (sekcja 3 protokołu, krok 5); `playbook.json` od teraz GENEROWANY z `playbook.md` przez `dyspozycje/autobot/tools/playbook-md-to-json.cjs`, nigdy edytowany ręcznie; liczniki nigdy z pamięci orkiestratora → C-013 |
| 2026-07-26 | Trzykrotnie na pytanie właściciela odpowiedziałem „subagent pracuje", choć pliki wyjściowe nie zmieniały się od 25 minut, a transkrypt agenta miał 0 B. Właściciel sam musiał zauważyć, że nic się nie dzieje | powtarzałem status z systemu zamiast sprawdzić znaczniki czasu, które sam wcześniej wyświetliłem | sprawdzaj pliki, nie etykietę → C-005 |
| 2026-07-26 | Skrypt promocji KANONU wykonał się mimo odrzucenia operacji przez właściciela — PowerShell zdążył wystartować; pliki `gra-kanon/*` zostały podmienione bez zgody | brak sprawdzenia skutków po odrzuconej operacji | po odrzuconej/przerwanej operacji sprawdź, czy nie zostawiła skutków, i zgłoś je → wzmocnienie C-010 |
| 2026-07-26 | Zamiast wdrożenia mechanizmu Wiarygodności do kodu wyprodukowałem 1800 linii dokumentacji — właściciel prosił o działającą funkcję w grze | pomylenie projektowania z wykonaniem; brak pytania o oczekiwany produkt | pytaj o produkt końcowy przed rozpoczęciem (sekcja 8.1 protokołu) |
| 2026-07-26 | `git add -A` zgarnął niedokończoną pracę innego agenta do commita o mylącym tytule | użycie `-A` zamiast konkretnych ścieżek, mimo wcześniejszej deklaracji, że tego nie robię | commit po ścieżkach → C-008 (recydywa — czwarty raz w projekcie) |
| 2026-07-22 | Trzygodzinna praca 51 subagentów pozostała niezacommitowana i została zmieciona przez commity równolegle działającego integratora; część uratowana ze stashy | zebranie wszystkich zmian do jednego commita na końcu zamiast commitowania grupami | commit natychmiast po grupie → C-003; blokada w kanale → C-007 |
| 2026-07-21 | Po utracie kontekstu zaraportowałem nieprawdziwy stan wersji (wskazałem starszy deploy jako aktualny) | raport z pamięci, bez weryfikacji md5 i historii gita | weryfikuj przed raportowaniem → C-010 |
| 2026-07-21 | Trzy deploye nie trafiły do `WERSJE.md` ani do kanału — inne sesje nie wiedziały, co jest w grze | logowanie traktowane jako krok opcjonalny po deployu | deploy jako jeden nierozdzielny ciąg → C-004 |
| 2026-07-20 | Subagent zaraportował „składnia OK dla obu skryptów", podczas gdy jeden miał cztery błędy składni (brak BOM, polskie znaki zepsuły parsowanie) | przyjęcie raportu subagenta bez weryfikacji | weryfikuj raporty subagentów → C-006 |

## 4. Dziennik wniosków
<!-- Najnowsze na górze. Ten dziennik jest ważniejszy od samych zasad —
     pokazuje, DLACZEGO zasady wyglądają tak, a nie inaczej.
     Gdy miary jeszcze nie ma, wpisz: „Skutek: oczekuje — patrz Sprawy otwarte”. -->
### 2026-08-07 — naprawa po odrzuceniu przez Evaluatora (K1–K4) + generator playbook.json
- Zrobiono: wyzerowano liczniki C-003…C-012 (rule_110–119) do 0/0 zgodnie z sekcją 3
  protokołu; przywrócono `C-002` jako `rule_120`; uzupełniono `C-001`/`rule_103`
  o dozwoloną komendę builda; napisano generator `playbook-md-to-json.cjs`
  (`playbook.md` = kanon, `playbook.json` = wyprowadzony, z zachowaniem realnych
  liczników rule_101–109 i rule_103).
- Skutek (miara): `getOperatorSystemRules` na kopii w scratchpadzie zwraca
  wszystkie 20 aktywnych zasad (0 martwych), `retireWeakRules` wycofuje 0 —
  patrz raport zadania. Smoke test 11/11.
- Wniosek: liczniki playbooka nie mogą powstawać z pamięci orkiestratora —
  muszą pochodzić albo z realnych `recordRuleOutcome()`, albo (dla nowych zasad)
  ze stałej wartości 0/0. Generator wymusza to mechanicznie zamiast polegać na
  dyscyplinie w danym momencie edycji.

### 2026-08-07 — wdrożenie protokołu AutoBot do projektu Civ
- Zrobiono: skopiowano protokół jako `AUTOBOT.md`; założono ten playbook, zasiany
  lekcjami z sesji 2026-07-21…07-26; dopisano ładowanie protokołu do `CLAUDE.md`.
- Skutek (miara): oczekuje — patrz Sprawy otwarte.
- Wniosek: playbook zasiany realnymi błędami startuje z 12 zasadami i 8 wpisami
  w rejestrze zamiast pustych tabel. Dwie klasy błędów miały już recydywę przed
  wdrożeniem protokołu (`git add -A` — czterokrotnie; brak commitu grupami —
  dwukrotnie), co potwierdza tezę protokołu: bez zapisu błąd wraca.

### 2026-07-21…07-26 — sesje robocze przed wdrożeniem protokołu (retrospektywa)
- Zrobiono: audyt kodu (73 znaleziska, 124 werdykty adwersaryjne), naprawa 71 z nich
  przez subagentów, kilkanaście deployów ROBOCZEJ, projekt mechanizmu Wiarygodności.
- Skutek (miara): audyt — 0 znalezisk odrzuconych z 20 zweryfikowanych podwójnie
  w pierwszej turze; z 53 pozostałych 50 potwierdzonych, 1 odrzucone jako już
  naprawione, 2 sporne. Naprawy — wszystkie bramki zielone po każdej fali.
- Wniosek: adwersaryjna weryfikacja przez niezależnych subagentów („spróbuj to obalić")
  wychwyciła zarówno fałszywe znaleziska, jak i błędy w mojej własnej ocenie wag —
  to samo, co protokół nazywa trybem adwokata diabła. Największe straty w tych sesjach
  nie wynikały z błędów merytorycznych, lecz z dyscypliny operacyjnej: niezacommitowana
  praca, brak logowania deployów, raportowanie bez weryfikacji.

## 5. Sprawy otwarte — czekają na dane
<!-- W kolumnie „Kiedy/skąd” podawaj konkretną datę lub zdarzenie.
     Sekcja przeglądana obowiązkowo na starcie każdej sesji (rytuał, krok 2). -->
| Data | Co czeka na weryfikację | Kiedy/skąd przyjdzie wynik |
|---|---|---|
| 2026-08-07 | Czy protokół ogranicza powtórki błędów operacyjnych w tym projekcie (miara: liczba wpisów-recydyw w rejestrze) | po 10 sesjach roboczych w protokole |
| 2026-07-26 | Czy pokrycie lasem 38/58/77% jest grywalne — zwłaszcza czy przy „Mało" nie powstają starty bez dostępu do drewna | playtest właściciela |
| 2026-07-26 | Czy współczynniki mechanizmu Wiarygodności (kary N1–N7, nagrody, tempo zapominania) są wyważone | playtest po wdrożeniu mechanizmu |
