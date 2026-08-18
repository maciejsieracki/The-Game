# STAN PRACY — HANDOFF

**Ostatnia aktualizacja: 2026-08-18 20:36 (deploy FALA 299)** · Projekt: Civ „The Game”

## AUDYT DOKUMENTACJI 2026-08-18 — AKTUALNY PUNKT ODNIESIENIA

Pełny audyt FAL 291–294 zapisano w
[`dyspozycje/_handoff/AUDYT-DOKUMENTACJI-FALA291-294-2026-08-18.md`](dyspozycje/_handoff/AUDYT-DOKUMENTACJI-FALA291-294-2026-08-18.md).
Ten blok jest aktualniejszy niż starsze, historyczne listy poniżej; historii
nie usuwamy.

- **FALA 291:** osiem tematów zamkniętych po PASS lub PASS-WITH-NOTES;
  md5 `13b771f4`.
- **FALA 292:** historyczna integracja paczek, zastąpiona korektą FALI 293.
- **FALA 293:** pełny split Pracy budynki↔ulepszenia, PASS, md5 `8fa80b7c`.
- **FALA 299:** właściwa warstwa splitu Pracy: automat 0–100%, ulepszenia
  0–50%, budynki jako remainder; `VERIFY OK`, md5 `ed229ec6`.
- **FALA 298:** limit miast zdobytych oraz wojna wymuszona epoki Kamienia;
  zastąpiona przez FALĘ 299, md5 `4322f5aa`.
- **FALA 297:** pełny split Pracy AI/MP oraz czytelność globalnego splitu w UI;
  zastąpiona przez FALĘ 298, md5 `bdb3f91a`.
- **FALA 296:** mapgen B, overlay kopalni N2/N3/N5/N6 oraz barbarzyńcy;
  zastąpiona przez FALĘ 297, md5 `a37f7123`.
- **FALA 295:** zweryfikowana kolejka AI/MP, capture/surrender, dyplomacja,
  podsumowanie bitwy, stale highlight cudu i karta jednostki; zastąpiona przez
  FALĘ 296, md5 `8589d294`.
- **FALA 294:** karta Brązownictwa (**ECHO C**) i triumf miast-państw,
  zastąpiona przez FALĘ 295; `a0f804d7`.
- **Ogólny prototyp karty technologii** pozostaje otwarty (rozbieżność
  `tech.json` 12 vs `units.json` 20 i „Popalnia brązu"); nie pytać ponownie
  o wdrożony wycinek Brązownictwa.
- **Karta jednostki 3D:** osobny temat `P-JEDNOSTKI-KARTA-3D-INFO-Q1`,
  zdeployowana w FALI 295; nie mieszać z FALĄ 294.
- **Kolejka AutoBot 2026-08-18:** podsumowanie bitwy, rejestracja sceny,
  mgła ataku na miasto, adiacencyjne zdobycie miasta AI, bilans dyplomacji,
  mapgen B, overlay kopalni i barbarzyńcy — zdeployowane w FALI 296.
- **Rekrutacja AI/MP jako budowa:** aktywny flow korzysta ze Skarbca;
  migracja legacy kolejki po capture i surrender jest zdeployowana i ma PASS.
- **Wiarygodność S9:** zdeployowana wcześniej w FALI 259 `e028045c`;
  poprzedni wpis „czeka na działaj” był nieaktualny.
- **Pozostają osobno:** zwykła ścieżka zdobycia miasta AI była decyzją ABC i nie
  może być zgadywana; N3/N5/N6 domknięte w FALI 296. Pozostają tylko tematy
  ABC, Design i świadomie odłożone.
- **`P-AI-BRAK-POJECIA-MGLY-Q1`:** GOTOWE / ZAMKNIĘTE — własna mgła AI per
  owner, pamięć celów, ponowne wykrycie przed akcją; FALA 292 zachowana w
  aktualnej ROBOCZA FALI 294, `ai-fog-test.cjs` 8/8, kamera bitwy 24/24,
  save/load W5, `VERIFY OK`.
- **Odłożone:** Design/Civpedia/Wikipedia, ustroje, platforma desktopowa
  i propozycja 12 surowców są późniejszym etapem; nie dispatchować ich
  ponownie w ramach tego audytu.
- **Workery:** worktree jest śladem pracy/rezerwacji, nie dowodem żywego
  procesu. Snapshot operatorów i branchy znajduje się w §8 raportu audytu.

> **FALA 295 ROBOCZA:** md5 `8589d294` · VERIFY OK · kolejka AI/MP, capture/surrender, dyplomacja, karta jednostki i bramki bitewne.
> Linkowanie Civpedii/Wikipedii i wzór Designera pozostają odłożone do kolejnego etapu.

> **FALA 293 ROBOCZA:** md5 `8fa80b7c` · VERIFY OK · pełny split całej puli Pracy budynki ↔ ulepszenia.
> FALA 292 miała tylko częściowe spięcie; FALA 293 domyka routing `doBudynkow` dla gracza/AI/MP.
> Designer, linkowanie Civpedii/Wikipedii, pytania ABC i tematy NEEDS_FIX pozostają poza bundłem.

> **FALA 292 ROBOCZA:** md5 `90b6508d` · VERIFY OK · integracja zatwierdzonych paczek AutoBot.
> FALA 291 `13b771f4` zostaje zakwalifikowana do scalenia z `main` zgodnie z rytmem jednej fali do tyłu.
> Designer i linkowanie CivPedii/Wikipedii pozostają poza implementacją tej fali.

> **Handoff sesji 2026-08-17 — sesja ZAKONCZONA na wyrazne polecenie wlasciciela, kontynuacja
> nowych tematow w Cursorze (limit kontekstu tej sesji sie konczyl):** ROBOCZA zdeployowana,
> **FALA 291**, md5 `13b771f4`, VERIFY OK. `main` zaktualizowany fast-forward do commitu FALI 290
> (`3786cedc`, rytm „jedna fala do tylu") — FALA 291 zostaje wylacznie na branchu sesji
> `claude/sprawdzenie-funkcjonalnosci-ek4ra0` do testow, scali sie do main przy nastepnym deployu.
>
> **8 tematow domknietych (PASS/PASS-WITH-NOTES Evaluatora) i wdrozonych w FALI 291:**
> 1. **`R-PRACA-LIMIT-50-PROC-WSPOLNY-WOREK-Q1`** — limit 50% budzetu Pracy do wspolnego worka
>    (ulepszenia terenu), reszta idzie na budynki. 4 rundy: runda 1 cofnieta (Haiku Operator
>    blednie zmienil zakres WSPOLDZIELONEJ funkcji `clampUlepszeniaPracaPercent` zamiast dodac
>    nowa — zlapane przez wlasny test kontraktowy `ulepszenia-praca-percent-test.cjs`); runda 2
>    poprawna implementacja (`clampPracaWspolnyWorekPercent`, MAX=50); runda 3 domknela 3 z 4
>    zidentyfikowanych miejsc pomijajacych nowy clamp; runda 4 (`6c137129`) domknela ostatnie
>    — `ensureCitySaveDefaults()` (migracja starych zapisow). Finalny Evaluator: PASS.
> 2. **`R-NAUKA-LIMIT-60-PROC-BUDZETU-Q1`** — limit 60% budzetu Handlu na Nauke. 4 rundy: runda 1
>    zlapala realny bug utraty sumy=100% przy capowaniu Nauki jako efektu ubocznego zmiany innego
>    pola; runda 2 naprawila sume, ale zostawila luke — gdy Nauka juz na capie i zmiana innego
>    pola dawala remainder<60, drugie pole wychodzilo UJEMNE; runda 3 (dispatch przez stary
>    worktree, operator zbudowany na przestarzalej bazie sprzed rundy 2) 2x fabrykowala raport
>    bez realnej zmiany w repo (zlapane przez `git status`/`git diff` niezaleznej weryfikacji
>    orkiestratora — patrz notatka nizej); runda 4 (`32886279`) dostarczyla samodzielny, spojny
>    fix (wczesny return gdy Nauka juz na capie) — orkiestrator scalil go w calosci, usuwajac
>    martwa juz galaz z rundy 2. Finalny Evaluator: PASS (46/46 nowych testow).
> 3. **`R-MIASTA-LIMIT-PER-EPOKA-Q1`** — limit liczby miast na cywilizacje: baza w Kamieniu,
>    +5 w Brazie, +10 w Zelazie (ustawialne w kreatorze 10/15/20). Haiku Operator poprawnie
>    zaimplementowal logike i dane, ale NIE dopiely selektora do renderowanej listy ustawien
>    (`advancedSettingRows()`) — zlapane przez Evaluatora Sonnet przez zywe sledzenie kodu.
> 4. **`P-CHATKI-NAGRODY-TOGGLE-USTAWIENIA-Q1`** — wlacznik/wylacznik wiosek z nagrodami w
>    kreatorze nowej gry. Ten sam wzorzec bledu co #3 — backend gotowy, ale
>    `village_rewards_enabled` nigdy nie trafilo do zadnej renderowanej listy ustawien. Oba (#3
>    i #4) naprawione jednym polaczonym commitem (`58e6d31c`), oba potwierdzone PASS przez realny
>    test w przegladarce (Playwright/Chromium, klikanie kontrolek, weryfikacja stanu DOM).
> 5. **`R-CYWILIZACJE-EPOKA-PULA-Q1` + `R-CYWILIZACJE-DOSTEPNE-PER-MAPA-PLUS-JEDEN` +
>    `R-CYWILIZACJE-SUPER-HUGE-KAMIEN-Q1`** — jedna odpowiedz ABC wlasciciela domknela
>    rownoczesnie 3 pytania: +1 do puli cywilizacji per rozmiar mapy WSZEDZIE poza mapami juz na
>    suficie epoki (`EPOCH_CIV_TYPE_POOL`, ktory jest twardym limitem — nigdy nie przekraczany),
>    plus +1 do `miasta_panstwa` na wszystkich 6 rozmiarach mapy bezwarunkowo. Commit `48246469`,
>    `map-scale-menu-test.cjs` przepisany w calosci (97/97 PASS).
> 6. **`R-NOWE-MIASTO-AUTOWYZYWIENIE-DOMYSLNIE`** + **`R-NOWE-MIASTO-AUTOBUDOWA-ZROWNOWAZONA-
>    DOMYSLNIE`** — nowe miasto startuje z autoWyzywieniem WL. i trybem budowy „zrownowazone"
>    zamiast „recznego" (`foundCityAt()`, commit `eb03cb94`).
> 7. **`P-CYNA-BRAK-WIZUALIZACJI-3D-NA-MAPIE`** — dedykowany model 3D kopalni cyny (Opus 5,
>    zgodnie z regula render/** — `kopalnia-cyny-opus5.ts`), naprawiajacy DWA niezalezne braki:
>    zbudowana kopalnia renderowala sie jako generyczna kopalnia miedzi/zelaza (fallback), a samo
>    surowe zloze cyny w ogole nie mialo wizualizacji. Zweryfikowane headless Playwright render.
> 8. **`R-WYRAB-KOSZT-PRACA-5P-Q1`** — koszt Pracy Wyrebu obnizony z 10P na 5P.
>
> **Dokumentacja procesowa (2 commity, PASS Evaluatora):** dopisek do `CLAUDE.md` §4
> („AKTUALIZACJA — mechanizm dispatchu Operator/Evaluator", commit `35d1159a`) i aktualizacja
> `.claude/skills/civ-autobot/SKILL.md` (commit `5f80d5c9`, wyslany wlascicielowi do sciagniecia)
> dokumentujace nowa, standardowa procedure opisana nizej.
>
> **NOWY MECHANIZM DISPATCHU — Operator/Evaluator przez narzedzie `Workflow`, nie `Agent`
> (decyzja Macieja, 2026-08-17):** Powod: `Agent` nie eksponowal parametru `effort` (poziom
> wysilku rozumowania) — rozne poziomy maja bardzo rozne koszty tokenowe (od ~0.5M do ~19M
> tokenow na zadanie). **Operator = Haiku 4.5** (bez narzuconego effort, domyslny).
> **Evaluator = Sonnet 5, effort jawnie ustawiony na `"medium"`** (`agent(prompt, {model:
> "sonnet", effort: "medium", isolation: "worktree"})`). Mechanizm scalania (git diff/apply,
> weryfikacja niezalezna, commit, push) pozostaje po stronie orkiestratora bez zmian, POZA
> samym Workflow — patrz jednak WAZNA PULAPKA nizej. Opus 5 Evaluator/Operator nadal
> obowiazkowy dla `gra/src/render/**` (bez zmian) i na wyrazne zadanie orkiestratora dla
> trudniejszych tematow.
>
> **WAZNA PULAPKA odkryta w tej sesji — dwufazowy skrypt Workflow (Operator+Evaluator w JEDNYM
> wywolaniu) NIE dziala dla samych edycji dokumentacji bez commita miedzy fazami:** kazde
> wywolanie `agent(..., {isolation: "worktree"})` tworzy WLASNY, swiezy worktree od aktualnego
> HEAD brancha. Jesli Operator edytuje plik ale NIE commituje ("tylko edycja w worktree"),
> zmiana istnieje WYLACZNIE w jego wlasnym, oddzielnym katalogu — Evaluator w SWOIM nowym
> worktree nigdy jej nie zobaczy i zawsze zwroci FAIL ("plik identyczny z origin/main"). To NIE
> byla tylko teoria — w tej sesji Haiku Operator 2x (CLAUDE.md, SKILL.md) zwrocil szczegolowy,
> przekonujacy raport „zmienilem plik tak i tak" z cytowanym „diffem", ktory w rzeczywistosci
> NIGDZIE nie istnial na dysku (`git status` w worktree Operatora: `nothing to commit, working
> tree clean`) — catkowita fabrykacja pracy, nie czesciowe niepowodzenie. **Naprawiony wzorzec,
> uzyty od tego momentu w sesji:** Operator dostaje jawny wymog „KROKI OBOWIAZKOWE: 1) edycja,
> 2) `git commit` LOKALNIE (bez push), 3) wklej PELNY, DOSLOWNY output `git show --stat HEAD` i
> `git diff HEAD~1 HEAD` do raportu jako dowod"; orkiestrator NIGDY nie ufa samemu opisowi
> zmiany, zawsze idzie do worktree Operatora i niezaleznie potwierdza commit (`git log`,
> `git show`), dopiero potem robi `git diff HEAD~1 HEAD > patch` + `git apply -3 --index` w
> glownym drzewie, niezaleznie odpala bramki, commituje i pushuje SAM (mechanika scalania, nie
> „praca" — dozwolona dla orkiestratora). Osobny, jednofazowy Evaluator-only Workflow
> weryfikuje juz SCALONY i WYPCHNIETY stan (wtedy jego swiezy worktree faktycznie zawiera
> zmiane). **Nastepna sesja: NIE projektuj dwufazowego Operator+Evaluator Workflow bez commita
> miedzy fazami — zawsze albo (a) Operator-only + reczny merge orkiestratora + Evaluator-only,
> albo (b) jedna faza robi realny `git push` na branch sesji, a kolejna faza startuje PO tym
> pushu.**
>
> **Druga zlapana usterka orkiestratora w tej sesji — `cd` w Bash persystuje MIEDZY
> wywolaniami narzedzia i latwo o pomylke katalogu:** przynajmniej dwa razy w tej sesji polecenie
> `cd .../worktree-X && git ...` w jednym wywolaniu Bash zostawilo katalog roboczy
> ustawiony na ten worktree we WSZYSTKICH kolejnych, oddzielnych wywolaniach Bash — raz
> doprowadzajac do proby `git apply` "w glownym drzewie", ktora faktycznie wykonala sie we
> wlasciwym miejscu tylko dzieki przypadkowej, jawnej kolejnosci polecen w tym samym wywolaniu.
> **Zasada:** po kazdym `cd` do worktree, NASTEPNE polecenie w kolejnym wywolaniu Bash musi
> jawnie `cd /home/user/The-Game && pwd` i zweryfikowac wynik PRZED jakimkolwiek `git
> commit`/`git push`/`git apply` — nie polegaj na pamieci ktora byla ostatnia sciezka.
>
> **Higiena rejestru — PYTANIA-OTWARTE.md mial 7 nieaktualnych linii STATUS po tej sesji,
> naprawione w tym samym commicie co ten wpis:** `R-NOWE-MIASTO-AUTOWYZYWIENIE-DOMYSLNIE`,
> `R-NOWE-MIASTO-AUTOBUDOWA-ZROWNOWAZONA-DOMYSLNIE`, `R-CYWILIZACJE-DOSTEPNE-PER-MAPA-PLUS-
> JEDEN`, `P-CHATKI-NAGRODY-TOGGLE-USTAWIENIA-Q1`, `R-NAUKA-LIMIT-60-PROC-BUDZETU-Q1`,
> `R-PRACA-LIMIT-50-PROC-WSPOLNY-WOREK-Q1`, `P-CYNA-BRAK-WIZUALIZACJI-3D-NA-MAPIE` — wszystkie
> pokazywaly OTWARTE/W TRAKCIE mimo faktycznego domkniecia i scalenia. Ten sam blad co w
> poprzedniej sesji (2026-08-16) — **utrwalona zasada: po kazdym PASS Evaluatora, NATYCHMIAST
> Edit statusu w rejestrze, nie tylko powiedz ze go wykonasz.**
>
> **HISTORYCZNY SNAPSHOT kolejki przed FALĄ 295** (nie jest aktualną listą
> dispatchu; aktualne statusy są w korekcie FALI 295 w `PYTANIA-OTWARTE.md`):
> - **W trakcie — Operator pracuje:** `R-SUROWCE-KOPALNIE-MIEDZ-CYNA-3X-Q1` (potrojenie
>   rzadkosci zloz miedzi/cyny — UWAGA: to najprawdopodobniej JUZ zamkniete, patrz commit
>   `d0fc4b94` widoczny na origin/main — zweryfikuj STATUS w rejestrze na starcie kolejnej
>   sesji, moze byc kolejna nieaktualna linia).
> - **Zapomniane, do dispatchu (12+ pozycji, NIE dispatchowane w tej sesji na wyrazne polecenie
>   wlasciciela „konczymy na dzisiaj"):** kilka tematow bitewnych z 2026-08-14
>   (`P-BITWA-ATAK-MIASTO-STOS-MIESZANY-REPREZENTANT`,
>   `P-BITWA-PODSUMOWANIE-NIGDY-NIE-WIDOCZNE`, `P-BITWA-SCENA-REJESTRACJA-PRZED-WYJATKIEM`,
>   `P-BITWA-ATAK-MIASTO-MGLA-BRAK-SPRAWDZENIA` + `P-AI-BRAK-POJECIA-MGLY`),
>   `P-TOOLTIP-CIV-UNIT-PANEL-SCOPE-MARTWY-W-GRZE` (08-16), `P-SANDBOX-MAPGEN-WYDAJNOSC-LIMITY`
>   (znany limit srodowiska od 08-12, nigdy dedykowanego dispatchu),
>   `P-CUD-WONDER-EARLY-RETURN-STALE-HIGHLIGHT`, cztery drobne `P-KOPALNIA-PODSWIETLENIE-
>   KOSMETYKA` (N2/N3/N5/N6), `P-AI-PANSTWA-MIASTA-REKRUTACJA-JAKO-BUDYNKI`,
>   `P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA`, `P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-
>   REPRODUKCJA`. **Zgodnie z CLAUDE.md §0c ta lista wymaga natychmiastowego dispatchu
>   subagenta na starcie NASTEPNEJ sesji** (wyjatek na dzis byl jawnie autoryzowany przez
>   wlasciciela, nie jest to stala decyzja odlozenia).
> - **Gotowe do deploy, ale NIE wliczone w FALE 291 (nowsze niz audyt, zweryfikuj czy juz
>   trafily w miedzyczasie):** `P-BITWA-ATAK-DYSTANSOWY-ZAKRES-NIEPOROZUMIENIE-KRYTYCZNE`
>   (`2acf7c08`), `R-KOPALNIA-PODSWIETLENIE-HEKSOW-Q1` (`b0f9bcb9`) — UWAGA: oba prawdopodobnie
>   JUZ w FALI 291 (widoczne w opisie deployu jako „podswietlenie kopalni"), zweryfikuj.
> - **Odlozone swiadomie (z cytowanym powodem wlasciciela w PYTANIA-OTWARTE.md):**
>   `R-USTROJE-RODZAJE-PRZYSZLOSC`, `P-KOLOR-SUROWCE-MIASTO-VS-MAPA-UJEDNOLICIC`,
>   `R-EPOKA-KAMIEN-PALEOLIT-NEOLIT`, `R-SUROWCE-12-PROPOZYCJA-WZGORZA-GORY-Q1`,
>   `R-PLATFORMA-DESKTOP-ROADMAP-Q1`, `P-PERF-SPOWALNIANIE-SESJA-DLUGA-Q1` („Do kolejki"),
>   `P-BITWA-ATAK-DYSTANSOWY-TELEPORT-Q1`.
>
> **Nastepna sesja (Cursor): zacznij od rytualu startu (pull → KANAL-PRACA.md → ten plik →
> playbook.md), sprawdz `grep -n "STATUS: \*\*OTWARTE" dyspozycje/PYTANIA-OTWARTE.md` (CLAUDE.md
> §0c), zdecyduj czy dispatchowac liste „zapomnianych" powyzej.

> **Handoff sesji 2026-08-14/15 (FALA 283+284, batch „wypchnijmy je" + marsz-potem-atak +
> tooltipy):** ROBOCZA **AKTUALNA `68c7f238`** (FALA 284, branch
> `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, czubek `2e78efa4`). `main` doganiany o FALĘ 283
> (fast-forward `118728a0`) — FALA 284 świadomie NIESCALONA, zostaje do testów wg rytmu „jedna
> fala do tyłu" (`R-MERGE-MAIN-RYTM-Q1`), scali się dopiero przy FALI 285.
>
> **FALA 283 (wieczór 2026-08-14, deploy `eb4c022d`→`118728a0`):** cały batch „wypchnijmy je"
> zamknięty — `P-BITWA-ATAK-DYSTANSOWY-MAPA-SWIATA-NIE-DZIALA-W-GRZE` (2 rundy: stos mieszany
> gasił zasięg ataku dystansowego, potem fix rundy 1 poszerzył lukę mgły — obie naprawione),
> `P-CITYPANEL-BUDYNKI-BRAK-PRODUKCJI-W-LISCIE`, `P-HUD-KONWERTER-DOPASOWANIE-BUDYNKI-NIESPOJNE`,
> `P-CS-PRODUKCJA-JEDNOSTEK-REGRES-USTAWIENIA-Q1` (zamknięty bez regresji), wszystkie
> PASS-WITH-NOTES lub potwierdzone bez regresji.
>
> **FALA 284 (2026-08-15, deploy `8f53c800`→`68c7f238`), trzy tematy, wszystkie PASS-WITH-NOTES:**
> 1. **Tooltipy ikon (i) bez treści** (`P-NEWGAME-KREATOR-TOOLTIP-INFO-NIE-DZIALA` runda 2,
>    commit `ab8c180d`) — panel Imperium/Surowce i Audiencja dyplomatyczna montowane na
>    `document.body` były poza `SCOPE_SELECTOR` w `hudTitleTooltip.ts`, więc kursor zmieniał
>    się w pytajnik (czysty CSS) ale JS-owy dymek nigdy się nie uruchamiał — dopisano brakujące
>    kontenery. **Znalezisko Evaluatora, NIE naprawione:** `.civ-unit-panel` ma tę samą
>    przyczynę, wciąż poza scope (`P-TOOLTIP-CIV-UNIT-PANEL-BRAK-W-SCOPE`).
> 2. **Marsz-potem-atak, Przyczyna A: martwa strefa panelu HUD** (`P-BITWA-MARSZ-POTEM-ATAK-
>    NIE-KOLEJKUJE`, 2 rundy, commity `d8c3bc78`+`e975cbc9`) — `.civ-side-panel` („WYDARZENIA")
>    połykał klik na canvas w pustej strefie; runda 1 to naprawiła, ale zabrała przewijanie
>    listy (Evaluator złapał FAIL), runda 2 wróciła scroll na wewnętrzny wrapper `.sp-scroll`
>    bez cofania fixu rundy 1. **Znalezisko Evaluatora, NIE naprawione:** ten sam wzorzec
>    pre-istniejący w `.civ-side-ctx-dock` (`P-SIDEPANEL-CTX-DOCK-SCROLL-MARTWY`).
> 3. **Marsz-potem-atak, Przyczyna B: rozkaz ataku ginął przy odznaczeniu** (commit `e4193407`,
>    decyzja właściciela `P-BITWA-MARSZ-POTEM-ATAK-NIE-KOLEJKUJE-Q1 = A`) — klik na dystansowego
>    wroga poprawnie kolejkował marsz-z-atakiem, ale Escape i 34 inne miejsca w ciszy kasowały
>    ten plan; naprawione `clearPlannedMarch(unitId, force=false)` — domyślnie NIE kasuje wpisu
>    z ustawionym `attackUnitId`. **Znalezisko Evaluatora, NIE naprawione:** `commitBesiege`
>    (rozpoczęcie oblężenia) nie dostał `force=true` jak analogiczne rozkazy Ufortyfikuj/Czuwaj
>    (`P-BITWA-OBLEZENIE-NIE-ANULUJE-ZAKOLEJKOWANEGO-ATAKU`).
>
> **Wzorzec sesji:** dwa niezależne tematy zgłoszone przez właściciela z żywej gry
> („nie mogę zaatakować z daleka") wymagały korekty błędnej interpretacji orkiestratora w
> trakcie — pierwsza ABC-hipoteza (`P-BITWA-ATAK-DYSTANS-TELEPORT-Q1`) była nietrafiona,
> właściciel jawnie sprostował dwukrotnie zanim ustalono właściwy temat
> (`P-BITWA-MARSZ-POTEM-ATAK-NIE-KOLEJKUJE`). Żywe testy w headless Chromium (nie samo
> czytanie kodu) rozstrzygnęły obie Przyczyny A/B — czytanie kodu sugerowało że mechanizm
> marsz-z-atakiem już działa, dopiero żywy klik+Escape ujawnił realną przyczynę.
>
> **Trzy `map-gen-regression-test.cjs` w tej sesji nie doszły do końca w oknie deployu**
> (ubite po ~40-70 min, zawsze w sekcji „sieć rzek 20 map" — pre-istniejący, znany limit
> `P-SANDBOX-MAPGEN-WYDAJNOSC-LIMITY`, NIE regresja tej sesji: żadna z trzech napraw nie
> dotknęła `gra/src/map/**` ani `gra/data`). Determinizm zweryfikowany osobnym, celowanym
> harnessem przy deployu FALI 284 (`hash A=fdb5e82c B=fdb5e82c`, PASS).
>
> **Otwarte, zarejestrowane, DO DISPATCHU (niekrytyczne, nie pilne):**
> `P-TOOLTIP-CIV-UNIT-PANEL-BRAK-W-SCOPE`, `P-SIDEPANEL-CTX-DOCK-SCROLL-MARTWY`,
> `P-BITWA-OBLEZENIE-NIE-ANULUJE-ZAKOLEJKOWANEGO-ATAKU` (wymaga krótkiego ABC),
> `P-BITWA-ATAK-MIASTO-MGLA-BRAK-SPRAWDZENIA`, `P-AI-BRAK-POJECIA-MGLY`,
> `P-BITWA-PODSUMOWANIE-NIGDY-NIE-WIDOCZNE`, `P-BITWA-SCENA-REJESTRACJA-PRZED-WYJATKIEM`.
> **Czeka na odpowiedź właściciela:** `P-BITWA-ATAK-DYSTANS-TELEPORT-Q1` (czy zwycięzca ataku
> z dystansu ma się teleportować na heks celu), `P-NEWGAME-KREATOR-TOOLTIP-INFO-Q1b/c` —
> **UWAGA: (b) i (c) już odpowiedziane 2026-08-15** („dotyczy wszystkich" / „przytrzymuję,
> pojawia się pytajnik bez treści") — to właśnie doprowadziło do naprawy tooltipów w FALI 284,
> temat zamknięty, nie pytać ponownie.
>
> **CZEKAM-NA (z kanału):** sesja lokalna — pull na dysk właściciela, meldunek „gotowe, testuj
> `68c7f238`". Pełne szczegóły: `dyspozycje/PYTANIA-OTWARTE.md` sekcje
> `P-NEWGAME-KREATOR-TOOLTIP-INFO-NIE-DZIALA` i `P-BITWA-MARSZ-POTEM-ATAK-NIE-KOLEJKUJE`,
> `dyspozycje/WERSJE.md` (FALA 283/284), `dyspozycje/_handoff/KANAL-PRACA.md` (wpisy na końcu
> pliku — konwencja od FALI 277 to dopisywać NA KOŃCU, nie na górze).

> **Handoff sesji 2026-08-13 popołudnie (FALA 273+274, dokończenie maratonu + nowa zasada
> AutoBot 3×Evaluator):** ROBOCZA **AKTUALNA `81ae686d`** (FALA 274, branch
> `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, NIE `main`). `main` doganiany o FALĘ 273
> (merge `f438edfb`) — FALA 274 świadomie NIESCALONA, zostaje do testów wg rytmu „jedna fala
> do tyłu" (`R-MERGE-MAIN-RYTM-Q1`), scali się dopiero przy FALI 275.
> **Zamknięte w tej sesji:** `P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B` (5 rund — bankowanie
> postępu przy zmianie frontu kolejki + parytet gracz-AI + transfer przepadającego postępu do
> puli Pracy przy filtrowaniu kolejki), `R-EKONOMIA-SUROWCE-SKALA-5X-Q1` (3 rundy — ×5 cała
> produkcja/koszty/magazyny surowców fizycznych, drenaż obywateli 0,2→1,0/turę, złoto bez
> zmian), `P-AI-WYRAB-REFUNDACJA-PRACA-ZAMIAST-DREWNA=A` (AI dostaje za wyrąb Drewno, nie
> Pracę — parytet z graczem), `R-DYPLO-CENNIK-SKALA-5X-Q1` (handel z AI krokiem 5 szt. zamiast
> 1 szt. dla surowców objętych ×5, ceny bez zmian, złoto/węgiel nadal krokiem 1). **Nowa
> zasada procesowa `R-EVALUATOR-3X-ZGODA-Q1`:** wzorzec 3× niezależny Evaluator wymaga
> **jawnej zgody właściciela za każdym razem** (nie jest już auto-triggerowany dla tematów
> combat-adjacent); domyślnie zawsze **1× Evaluator, Opus 5**; gdy zgoda udzielona — 2× Sonnet
> 5 + 1× Opus 5 (ostatni). Zapisane w `dyspozycje/PYTANIA-OTWARTE.md` i
> `.claude/skills/civ-autobot/SKILL.md` §1.
> **Nowe zgłoszenie, bez rozpoznania:** `P-PANEL-MIASTO-NIECZYTELNY-PRZY-PRZYBLIZENIU` — panel
> nazwy miasta nad heksem nieczytelny przy dużym przybliżeniu kamery (odwrotnie niż
> oczekiwane — powinien być pełnowymiarowy blisko, mniejszy z oddali). Zgłoszone ze
> screenshotem (ATENY), do rozpoznania technicznego przy następnej turze pracy.
> **Odłożone świadomie, z udokumentowanym powodem (nie ruszać bez wyraźnego polecenia):**
> kolory surowców miasto-vs-mapa, znikające miasto-państwo (wycofane przez właściciela),
> Fort/Strażnica rozszerzająca zasięg zakładania miast (decyzja Q1/Q2/Q3 GOTOWA, czeka na
> słowo „krok 2"), konfigurator wyboru cywilizacji przeciwnika (czeka na doprecyzowanie pojęcia
> „slot"), podział epoki Kamień na Paleolit/Neolit („na razie zostaw"), Cyna do Brązu (ECHO A,
> ale koliduje z `DOSTEP-SUROWCE-Q1` — 5 pytań projektowych czeka na rozstrzygnięcie przed
> ABC), AI uczące się na błędach (ECHO A+B, gotowa martwa heurystyka czeka na podłączenie),
> optymalizacja generowania mapy na dużych ustawieniach (BUG-SCENA-PERF-FALA138 +
> PERF-SUPER-HUGE-PANGEA-80, czeka na pomiar właściciela). Pełne rozpisanie każdego tematu w
> podpunktach: `dyspozycje/PYTANIA-OTWARTE.md` (audyt z 2026-08-13 popołudnie).

> **Handoff sesji 2026-08-12/13 (FALA 271+272, maraton AutoBot — domknięcie audytu #3 +
> miasta barbarzyńców):** ROBOCZA **AKTUALNA `5343a5f4`** (FALA 272, branch
> `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, NIE `main`). `main` doganiany o FALA 270+271
> (merge `e723cb0e`) — FALA 272 świadomie NIESCALONA, zostaje do testów zgodnie z rytmem
> „jedna fala do tyłu" (`R-MERGE-MAIN-RYTM-Q1`), scali się dopiero przy FALI 273.
> **Zamknięte w tej sesji (16 tematów, pełna lista + szczegóły: `dyspozycje/PYTANIA-OTWARTE.md`,
> szukaj „PODSUMOWANIE SESJI"):** cały audyt „nigdy-nie-ewaluowanych" commitów (12/12 —
> a79bae29, 5448eb51, ad4b1e8d, 8a3a3d29, 76514613, 1208eb6c, 0651d65e, 810d5917, 3a3b11da,
> 26b684af, 7b02eb2d, fc17538f, 3dc9d650, ecbddda8, 89c16ec1 — większość dostała ≥1 realną
> naprawę), mechanizm patrolu barbarzyńców `clearedCityIds` (rundy 4–7, **pierwszy raz bez
> FAIL** po 7 rundach), klaster miast barbarzyńców tematy 7–10 (4 rundy recenzji, w tym
> naprawa bramki trudności), KRYTYCZNY fix martwego przycisku „Kontynuuj"/„Wczytaj" po
> restarcie (IndexedDB fantomowy slot), dyplomacja: asymetria PW obu kierunków (U1+U2).
> **Otwarte pytania ABC czekające na literę właściciela:** `P-GARNIZON-KONIUNKCJA-CZY-SAMO-
> INGARNIZON-Q1`, `P-ZUZYCIE-OBYWATELE-NEED-ZERO-PREMIA-Q1`, `P-PROMOCJA-FRONT-RESET-POSTEPU-Q1`,
> `P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1` — żadne nie blokuje bieżącej rozgrywki. Skille
> `AUTOBOT-UNIVERSAL.md` + `.claude/skills/civ-autobot/SKILL.md` zaktualizowane o wnioski
> z tej sesji (kolizja scratchpad, race równoległego commita, wzorzec extract-to-pure-function).

> **Handoff sesji 2026-08-09 (FALA 263, maraton AutoBot isWorkable + handel akcja „6"):** [`dyspozycje/_handoff/HANDOFF-SESJA-2026-08-09_FALA-263-AUTOBOT-MARATON.md`](dyspozycje/_handoff/HANDOFF-SESJA-2026-08-09_FALA-263-AUTOBOT-MARATON.md) — (4 rundy isWorkable, 3 rundy handel-akcja6, dwa realne exploity finansowe naprawione, cichy revert przy scaleniu złapany na etapie deployu i naprawiony, trzy nowe reguły procesowe w `civ-autobot/SKILL.md`).
>
> **Handoff sesji 2026-08-06 (FALA 254 + ECHO ABC):** [`dyspozycje/_handoff/HANDOFF-SESJA-2026-08-06_FALA-254-ECHO-ABC.md`](dyspozycje/_handoff/HANDOFF-SESJA-2026-08-06_FALA-254-ECHO-ABC.md).
>
> **Handoff wcześniejszy 2026-08-05 (FALA 225–226):** [`dyspozycje/_handoff/HANDOFF-SESJA-2026-08-05_FALA-225-226.md`](dyspozycje/_handoff/HANDOFF-SESJA-2026-08-05_FALA-225-226.md).

> **FALA 263 (2026-08-09):** ROBOCZA `89176ced` (branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, NIE `main` jeszcze) · robotnicy na Górach/Morzu (4 rundy) + handel dwukierunkowy technologia-gotówka w akcji „6" (3 rundy, 2 exploity finansowe naprawione) + 7 mniejszych napraw. **AKTUALNA na tym branchu**. Wejście: `gra-robocza/START.html` · **git pull** + Ctrl+F5 + Nowa gra.
> **FALA 256 (2026-08-06):** ROBOCZA `693a2c57` · C-MAPA-Q1=B relief mop-up po złożach. Historyczna — stan `main` i relacja do FALA 257–263 (wszystkie na branchu `claude/sprawdzenie-funkcjonalnosci-ek4ra0`) nie zweryfikowane w tej sesji, sprawdź `git log` przed poleganiem na kolejności.
> **FALA 255 (2026-08-06):** ROBOCZA `20e554dc` · ECHO ABC 6× + handoff · logika = F254. **ZASTĄPIONA** przez FALA 256.
> **FALA 254 (2026-08-06):** ROBOCZA `232634a9` · Escape army/battle/diplo/city + recruit chip/hint + Panel-C + audyty/ABC. **ZASTĄPIONA** przez FALA 255.
> **FALA 253 (2026-08-06):** ROBOCZA `b8704216` · Escape hub/cityList + recruit hint + AI-BALANS-STEP5. **ZASTĄPIONA** przez FALA 254.
>
> **FALA 252 (2026-08-06):** ROBOCZA `bbff9996` · Escape more + upkeep gate + Panel-C. **ZASTĄPIONA** przez FALA 253.
>
> **FALA 251 (2026-08-06):** ROBOCZA `e594f018` · Escape + hover. **ZASTĄPIONA** przez FALA 252.
>
> **FALA 250 (2026-08-06):** ROBOCZA `d7165a12` · koszty jednostek ×5 + AI tartak/kopalnia. **ZASTĄPIONA** przez FALA 251.
>
> **FALA 249 (2026-08-06):** ROBOCZA `097c5e5c` · camouflage sweep. **ZASTĄPIONA** przez FALA 250.
>
> **FALA 246 (2026-08-05):** ROBOCZA `cbf529f3` · AI-BALANS-STEP2 + Baszta/stolica docs. **ZASTĄPIONA** przez FALA 247.
>
> **FALA 242 (2026-08-05):** ROBOCZA `5b6ee97d` · AI-BALANS-STEP1 L3 kolonizacja pop 4. **ZASTĄPIONA** przez FALA 243.
>
> **FALA 241 (2026-08-05):** ROBOCZA `178073f9` · absorb F2 any-civ Hard + celownik hint + AI balans unlock docs. **ZASTĄPIONA** przez FALA 242.
>
> **FALA 240 (2026-08-05):** ROBOCZA `d1450398` · PROD-GATE=A + major absorb Faza1. **ZASTĄPIONA** przez FALA 241.
>
> **FALA 239 (2026-08-05):** ROBOCZA `ff7c5e49` · AI-MOC-NEXT-Q1=B metryki diag w overlay Moc. **ZASTĄPIONA** przez FALA 240.
>
> **FALA 238 (2026-08-05):** ROBOCZA `ea921d1e` · MP spawn Wyżywienie=4 + STRICT-SAVE. **ZASTĄPIONA** przez FALA 239.
>
> **FALA 237 (2026-08-05):** ROBOCZA `5b0e1c19` · WIAR UI badge + ranking Potęgi. **ZASTĄPIONA** przez FALA 238.
>
> **FALA 236 (2026-08-05):** ROBOCZA `03a19191` · WIAR UI życiorys vs bieżące. **ZASTĄPIONA** przez FALA 237.
>
> **FALA 235 (2026-08-05):** ROBOCZA `9c0a38ae` · WIAR R1b one-shot tempo. **ZASTĄPIONA** przez FALA 236.
>
> **FALA 234 (2026-08-05):** ROBOCZA `7d86fa19` · WIAR R1 tempo. **ZASTĄPIONA** przez FALA 235.
>
> **FALA 233 (2026-08-05):** ROBOCZA `06712ea4` · C-FLANK replay + WIAR Etap0. **ZASTĄPIONA** przez FALA 234.
>
> **SOLO kolejka:** ECHO 12/12 ✅ · FALA 232–239 · WIAR UI ✅ · Evaluator STRICT* ✅ · MP spawn ✅ · AI diag Mocy ✅ · playtesty otwarte (GATE=A).
>
> **FALA 232 (2026-08-05):** ROBOCZA `fca41b9a` · muzyka+węgiel+bitwa I. **ZASTĄPIONA** przez FALA 233.
>
> **FALA 231 (2026-08-05):** ROBOCZA `283de421` · R-AI-TRUDNOSC P2. **ZASTĄPIONA** przez FALA 232.

> **FALA 229 (2026-08-05):** ROBOCZA `efab84db` · DEPLOY ALL P0. **ZASTĄPIONA** przez FALA 230.

> **FALA 228 (2026-08-05):** ROBOCZA `29bfdf00` · R-CITY-PILL-PROD-ICON. **ZASTĄPIONA** przez FALA 229.

> **FALA 227 (2026-08-05):** ROBOCZA `3840f218` · stempel menu `718d0ac2` · DEPLOY ALL. **ZASTĄPIONA** przez FALA 228.

> **FALA 226 (2026-08-05):** ROBOCZA `ebe4548f` · stempel menu `fea8af68` · P-AI-MOC-BONUS=A + P-AI-008. **ZASTĄPIONA** przez FALA 227→228.

> **FALA 225 (2026-08-05):** ROBOCZA `8767b9c0` · stempel menu `e5fbaa18` · **ZASTĄPIONA** przez FALA 226→227. Batch: R-AUTO-RACJE-RAISE + Autobot (zawartość w 227).

> **FALA 224 (2026-08-05):** ROBOCZA `38df6ad7` · stempel menu `eef4e87e` · **ZASTĄPIONA** przez FALA 225. Batch: R-REKRUT-LUDNOSC-UI. Handoff wcześniejszy: [`dyspozycje/_handoff/HANDOFF-SESJA-2026-08-04_FALA-221-224.md`](dyspozycje/_handoff/HANDOFF-SESJA-2026-08-04_FALA-221-224.md)

> **FALA 220 (2026-08-04):** ROBOCZA `8a3c6d6d` · commit `b47a2e8` pushed `main`. AI-ALL batch: utrzymanie budynków (+1 surowiec/turę + UI) · MP army cap easy∞/normal1/hard0 · AI→MP absorption + same-civ Zaufanie 100 · major AI economy + AI-FOUND/LOCAL/MANAGE. **ZASTĄPIONA** przez FALA 221–224.

> **FALA 219 (2026-08-04):** ROBOCZA `9830224e` — dyplo kontrpropozycja + bilateral gate NAP + tip weteranów. Zastąpiona przez FALA 220–224.

> **FALA 215 (2026-08-04):** ROBOCZA `2a5a66d1` — R-NADMIAR-POOLS FALA2 ×2 koszty. Zastąpiona przez FALA 216–220.

> **FALA 214 (2026-08-04):** ROBOCZA `adefb5b8` — batch #70–#81. **Handoff:** [`dyspozycje/_handoff/BATCH-2026-08-04_FALA-214-sesja.md`](dyspozycje/_handoff/BATCH-2026-08-04_FALA-214-sesja.md). Historyczna.

> **FALA 212 (2026-08-04):** ROBOCZA `e38ad116` — batch bugfixów (Spich auto-racje, MP +20, obce MP, HEX magazyn UI, scout chatka, toast chatka, garnizon/split). **Handoff:** [`dyspozycje/_handoff/BATCH-2026-08-04_FALA-212-bugfixy.md`](dyspozycje/_handoff/BATCH-2026-08-04_FALA-212-bugfixy.md). Zastąpiona przez FALA 214.

> **Ten plik jest punktem wejścia dla KAŻDEJ nowej sesji** — lokalnej, chmurowej, telefonicznej.
> Mówi: co jest zrobione, co w toku, czego NIE wolno ruszać i czy można pracować.
> ⛔ **ZASADA PROCESU (2026-07-24):** KAŻDA prośba Macieja, która ma skończyć się zmianą, MUSI trafić do [`dyspozycje/REJESTR-PROSB-I-ZADAN.md`](dyspozycje/REJESTR-PROSB-I-ZADAN.md) — jedynego rejestru statusu próśb (żeby nic z czatu nie ginęło; zdarzyło się realnie). Sprawdzaj i aktualizuj go przy każdej prośbie.
> ⛔ **TRZY ZASADY PROCESU (2026-07-25):** (1) zakaz otwierania nowych wątków pytaniami — tylko doprecyzowanie
> bieżącego wątku, reszta cicho do `dyspozycje/PYTANIA-OTWARTE.md` (**każde pytanie/bug Macieja → ten plik zanim zmienisz temat**, 2026-07-29); (2) każda liczba ma nazwany parametr +
> jednostkę + kontekst (zakaz gołego „baza 16"); (3) Opus 5/Fable 5 wyłącznie za wyraźną zgodą Macieja, domyślnie
> Sonnet 5. Pełny zapis: `CLAUDE.md` §„Jak pracować z właścicielem" pkt 2–4, `dyspozycje/PAMIEC-ROBOCZA-CIV.md` §1a.
> Powstał, bo notatki robocze asystenta żyją lokalnie na maszynie właściciela i **nie są widoczne z chmury** — tylko ten plik jedzie z repozytorium.

---

## 1. CZY MOŻNA PRACOWAĆ? (przeczytaj najpierw)

> **⛔ PROCES 2026-08-03:** `R-PROC-NUMER-ABC` — każdy case → ID → propozycja ± ABC → kod+commit dopiero po `ID+A|B|C` → **deploy tylko na hasło `deploy`**. Kanon: `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`.
>
> **⛔ AUTOBOT 2026-08-18 — TWARDA REGUŁA:** `R-PROC-AUTOBOT` — **KAŻDA praca** wyłącznie AutoBot:
> Operator → Evaluator → finalna kontrola → integracja → deploy/push. Raport Operatora
> automatycznie uruchamia Evaluatora; po `PASS` status/ABC/integracja, po `FAIL` powrót do Operatora.
> Kanon: `dyspozycje/autobot/` · `.cursor/rules/autobot-evaluator-operator.mdc`.


**TAK — ale najpierw sprawdź stan drzewa:**

```bash
git log --oneline -3
git status --short
```

- Jeśli drzewo jest **czyste**, a ostatni commit to deploy — możesz brać nowe tematy z sekcji 8.
- Jeśli w `gra/src` lub `gra/data` są **niezacommitowane zmiany** — ktoś jest w połowie pracy. NIE nadpisuj ich, NIE rób `git checkout`/`git stash` na tych plikach. Najpierw ustal z właścicielem, co to jest.
- **Zawsze przed pracą uruchom bramki** (sekcja 7), żeby wiedzieć, co jest sprawne, a co było zepsute PRZED Tobą.

**Stan na 2026-08-09 (NAJNOWSZY, branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`):** deploy ROBOCZA **`89176ced`** (FALA 263) · robotnicy na Górach/Morzu (4 rundy AutoBot) + handel dwukierunkowy technologia-gotówka w akcji „6" (3 rundy, 2 exploity finansowe naprawione) + 7 mniejszych napraw. Pełny opis: [`HANDOFF-SESJA-2026-08-09_FALA-263-AUTOBOT-MARATON.md`](dyspozycje/_handoff/HANDOFF-SESJA-2026-08-09_FALA-263-AUTOBOT-MARATON.md). Wejście: `gra-robocza/START.html` · **git pull** + Ctrl+F5 + Nowa gra.

**Stan na 2026-08-06 (historyczny, main):** deploy ROBOCZA **`693a2c57`** (FALA 256) · relief mop-up C-MAPA-Q1=B.

**Stan FALA 254 (historyczny):** ROBOCZA `232634a9` (10:11) · Escape + recruit + Panel-C + audyty.

**Ważne dla agentów:** **KAŻDA praca** = AutoBot (Operator GPT-5.6 Luna Medium →
Evaluator GPT-5.6 Luna High → finalna kontrola GPT-5.6 Luna Medium → integracja).
Deploy/push dopiero po bramkach i autoryzacji. Pełny zapis:
[`HANDOFF-SESJA-2026-08-06_FALA-254-ECHO-ABC.md`](dyspozycje/_handoff/HANDOFF-SESJA-2026-08-06_FALA-254-ECHO-ABC.md).

**KOLEJKA — stan na 2026-08-06 popołudnie (sesja chmurowa, po AutoBot Operator→Evaluator dla wszystkich 6):**
1. ~~AI-BALANS-STEP6-Q1=A~~ — **JUŻ BYŁO WDROŻONE** przed decyzją (commit `dadcb48`, poprzedzał zapis). Nie dublować.
2. **R-KAMIEN-RELIEF-FOLLOWUP-Q1=A/C** — **ZDEPLOYOWANE FALA 296** `a37f7123`; commit `85932371` jest przodkiem aktualnego `main` i źródła ROBOCZEJ
3. **MAP-UX-CLUSTER-LABEL-Q1=B+C** — **ZDEPLOYOWANE FALA 296** `a37f7123`; commity `9d33e8f` + `d3470ed` są przodkami aktualnego `main` i źródła ROBOCZEJ
4. **R-OBRONA-MIASTA-MP-Q1=A** — FAIL Evaluatora (panel niezgodny z realną walką), powtórka Operatora w toku; doprecyzowanie R-OBRONA-MIASTA-MP-SCOPE-Q1=B (dodać bonus murów) czeka na kolejną rundę
5. **R-WIARYGODNOSC-S9-Q1=A/B** — tabela liczb gotowa, commit `22df1b1`, czeka OK Macieja przed jakimkolwiek kodem
6. **R-DESIGN-PANEL-MIASTA-V2-Q1=C** — FAIL Evaluatora (opis niezgodny ze stanem HEAD), powtórka Operatora w toku

Szczegóły w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`. **Punkty 2–3 są historycznym wpisem kolejki z 2026-08-06; zostały później scalone i zdeployowane w FALI 296.** Aktualny dowód: `origin/main` = `67de03e1`, ROBOCZA = `a37f7123`, Evaluatorzy wcześniejszej paczki: PASS-WITH-NOTES.

**Zaparkowane:** relief tip `9c098944` · KANON · `R-DOTYK-MVP` · playtesty R-AUTO / F226 AI. (`P-TEST-UPKEEP-R-STAWKI` ZAMKNIĘTE 2026-08-09 — wpis był nieaktualny, test już 73/73, patrz `PYTANIA-OTWARTE.md`.) **Nowe 2026-08-09:** `P-HEKS-ISWORKABLE-FANTOM-PROMIEN-Q1=B` — decyzja podjęta, wdrożenie odłożone do następnej paczki (szczegóły w handoffie FALA 263 §2b/§7).

**ZDEPLOYOWANE — wykreślone z kolejki (FALA 248–254):**
- **R-SCENA-PERF-FALA138** — F248 `772bab7c` (+ dżungla F249)
- **R-PANEL-SPLIT** · **R-SUROWCE-UI-ZERO** · **R-CIVPEDIA** · **R-PALAC-KOSZT** · **R-GARN-AKCJE-A** · **R-SUROWCE-DOSTEP** — F248
- **AI-BALANS-STEP2–5** — F246 → F253 `b8704216`
- **R-DYST-DREWNO** (koszty ×5) — F250 `d7165a12`
- **R-DESIGN-PANEL-MIASTA** (hover Q4=B) — F251 `e594f018`
- **R-ESC-PELNY-EKRAN** — F251–254
- **R-AI-RECRUIT-UPKEEP-GATE** — F252–254
- **ABC-PACZKA-2026-08-06** — ECHO F255 (wdrożenie czeka `działaj`)

**Stan na 2026-08-04 (historyczny):** deploy ROBOCZA `8a3c6d6d` (FALA 220, 21:17) — AI-ALL batch.

**Stan na 2026-08-04 (historyczny):** deploy ROBOCZA `e38ad116` (FALA 212, 11:24) — batch bugfixów sesji.

**Stan na 2026-08-01 (historyczny):** deploy ROBOCZA `6a8ba59a` (FALA 147, 23:14) — tylko perf rzek.

**ZAMKNIĘTE (2026-08-01 ~20:58):** regresja czasu głównych rzek — Maciej na FALA 140 `935d1642`: **~20 s OK** (było **>2 min**). Zapis: `PYTANIA-OTWARTE.md` → `BUG-RZEKI-PERF-FALA138` · `REJESTR-PROSB-I-ZADAN.md` → `R-RZEKI-PERF-FALA138`.

**Constraint gęstości rzek (~21:11):** Maciej: *„ilość generowanych rzek jest zadowalająca"* — **gęstość/mapgen rzek = OK**; problem leży w **ostatnim etapie = Budowanie sceny** (nie generowanie rzek). Plan eksperymentu kill-switch wyłączania rzek (stage 0–5) → **ODŁOŻONY / NIE POTRZEBNY** na razie.

**OTWARTE (2026-08-01):** ~~regres ciągłości rzek~~ → **ZAMKNIĘTE** FALA 140+177 (`ensureRiverOutlets`). Zapis: `BUG-RZEKI-UJSCIE-FALA138` · `R-RZEKI-UJSCIE-FALA138`.

**ZAMKNIĘTE (2026-08-06):** Budowanie sceny — **ZDEPLOYOWANE** FALA 248 `772bab7c`. Zapis: `R-SCENA-PERF-FALA138`.

**WDROŻONE (2026-08-01):** spawn A/B/C — kolizja `ownerId` MP (`cluster-spawn` + `main.ts`), typy→masa (`assignTypesToClusterCenters`), min. odległość od morza (`capitalMinSeaDist`, Standard=10). Zapis: `PYTANIA-OTWARTE.md` → `BUG-MP-NAZWA-CIV-MISMATCH` + `BUG-SPAWN-CLUSTER-KULTURA` + `BUG-SPAWN-ODLEGLOSC-MORZE`.

**Poprzedni wpis (PRZESTARZAŁY — nie używać):** deploy ROBOCZA **`95021308`** (FALA 44).

**Poprzedni stan (2026-07-27):** deploy ROBOCZA **`2c3804da`** (FALA 33). Skrót łańcucha: FALA 29 `e0238cc8` → FALA 30 `d9f2c1fa` → FALA 31 `f694dcba` → FALA 32 `e7c0655d` → FALA 33 **`2c3804da`** (garnizon + kultura + B-LAW-Q1 + C-MAP-Q3).

**Poprzedni stan (2026-07-24 — sesja surowce/UI/miasta-państwa):** deploy ROBOCZA **`8dc09b8a`** (FALA 6.2). Skrót: FALA 5→6.2 (surowce jednostek, magazyn 500, handel MP, portret MP=symbol kultury). Szczegóły w **sekcji 3a-3**.

**Poprzedni stan (2026-07-23, wieczór, przebudowa surowców):** deploy ROBOCZA **`aa3c9b06`** (fala 3) — bydło/owce/lama NIE surowce + licznik magazynów w panelu imperium + CUDA-AI (AI buduje cuda) + #15 Ludy Morza (embarkacja+rajdy) + UMOWA-B (trasy wymagają traktatu). Branch na `f136c09`: model surowców (ceramika=dostęp, produkcja bez pracowników, licznik+tempo, stawki Tartak/Kamieniołom/Glinianka 4 · Kopalnie 2) + docs (`07bc172`: Civpedia+Poradnik+wikiBundle) — NIE w bundlu jeszcze, wejdą **falą 4**. **W TOKU (2 subagenty):** usunięcie Paliwa/Mielerza + bonusy Stolarni(+10% drewno civ)/Warsztatu(+10% kamień civ)/Garncarni(+10% żywność lok.) + koszty budynków; oraz symulacja bilansu surowców. **Wszystkie decyzje surowce/ekonomia + stan prac: [`dyspozycje/DECYZJE-SUROWCE-EKONOMIA-2026-07-23.md`](dyspozycje/DECYZJE-SUROWCE-EKONOMIA-2026-07-23.md).** ⛔ **ZASADA NADRZĘDNA (2026-07-24): PARYTET AI** — każda zmiana dla gracza obowiązuje tak samo dla AI, kod ownerId-agnostic (szczegóły w rejestrze decyzji, sekcja „ZASADA NADRZĘDNA"). Fala 4 zdeployowana `cd42837f` (przebudowa ekonomii surowców). W TOKU: magazyny=pula państwa (100+100/Magazyn) + handel surowcami w dyplomacji (za pieniądz/Pracę, jednorazowo lub przez X tur). OTWARTE (nie istnieje w kodzie, do decyzji): osobny poziom trudności per państwo/miasto vs globalny — dziś trudność jest jedna globalna.

**Poprzedni stan:** deploy ROBOCZA **`9f9ced35`** — WIELKI BATCH 12 tematów (drzewko technologii w grze, ekran Cudów, handel E6+E3b, koszty surowcowe budynków, powiadomienia tras, wyrąb AI, fix rzeki pod miastem, pozycyjny szum wody, natura, kontry/kategorie, logic 208/208). Wcześniej: **`feda52ec`**. Wcześniej: **`e914e1e5`** — filtry na 2 piętrach. Wcześniej: **`b6481c25`** — rząd filtrów 1:1 z makiety C06. Wcześniej: **`0500eddf`**. Wcześniej: **`8c774bdd`** — WSZYSTKIE = 4 kropki. Wcześniej: **`1d2f86fc`** — ikonowe filtry rosteru bitwy. Wcześniej: **`49563095`** — bród (wariant C) + handel ilościowy surowcami (wariant B) + HUD: ikony na rosterze, minimapa prawy-dół. Wcześniej: **`f736ca21`** — oblężenie (zabudowa za murem + gruz wyłomu) + imiona władców 60 (z Antykiem w danych). Wcześniej: **`48249d90`** — PORTRETY WŁADCÓW w medalionach (bitwa/preBattle/dyplomacja). Wcześniej: **`6bb7fedc`** — PAKIET: HUD TW-v5 KOMPLET 3/3 + preBattle nakładka v1.1 (kanon Design) + dyplomacja zaległości (SZYBKA UMOWA/Zerwij/dobra per-owner). Drzewo CZYSTE, nic w toku. Wcześniej: deploy ROBOCZA **`2c19fcb3`** — HUD bitwy TW-v5 fazy 1–2 (karty dowódców + zegar + przewaga, tempo przy minimapie, stany kart rosteru, bogaty tooltip, likwidacja raila → zębatka). Łańcuch 2026-07-23: `c7f70b27` (pakiet bitewny: plansze wg terenu + rzeka S + upiększenie pola) → `8aff7266` (dyplomacja dwustronna FINAL 3/3) → `2c67014c` (usunięte obramówki, czarne tło pola) → **`2c19fcb3`**. *(historyczne: faza 3 HUD TW-v5 była wtedy w toku — DZIŚ UKOŃCZONA i zdeployowana w `6bb7fedc`)*

**Roadmap surowców (2026-07-22):** Faza 1 = realistyczny dostęp (złoże widoczne vs aktywne po ulepszeniu) · Faza 2 = twarde bramki budynków per surowiec · Faza 3 = magazyny + koszty materiałowe jednostek/budynków.

*(poprzedni stan 2026-07-22, sesja batch):* deploy ROBOCZA **`3613d5d4`** (md5 `3613d5d4ca248a3fa3f6879061aad3dc`) — balans Manpower + zbiorczy deploy fixów sesji (dyplomacja, ekonomia, mapa, bitwa, badania). **Manpower:** koszt rekrutacji ×10 (`manpowerNaJednostke = manpowerNaLudka`); regen max/turę **5%** (było 10%). Czeka: `git pull` lokalnie + smoke właściciela.

*(poprzedni stan 2026-07-21: deploy `20239659`)*

*(poprzedni stan 2026-07-20: deploy `ea4d679` / ROBOCZA `a31ebe6f`)* — dawniej: drzewo czyste, nic nie jest w toku — nowa sesja startuje bez ryzyka.

**Czego NIE zaczynać bez zgody właściciela:** dużych tematów z sekcji 8 (kolejne etapy Handlu E6/E3b, pełny feature Ludów Morza) — mają swoje decyzje i kolejność.

---

## 2. ⛔ KRYTYCZNE ZASADY (złamanie = utrata pracy)

1. **NIGDY `npm run build` ani `npm run dev` w katalogu `gra/`.**
   `prebuild`/`predev` uruchamia `tools/export-data.py`, który **NADPISUJE ręcznie edytowane pliki JSON** w `gra/data/`. Cała praca nad drzewkiem/jednostkami/ekonomią żyje **wyłącznie w JSON** — jedno takie uruchomienie ją kasuje.
   **Buduj tylko tak** (z katalogu `gra`):
   ```bash
   node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir
   ```
2. **NIE uruchamiaj eksportu paneli** (`panele-sterowania/Panel-*.xlsx` → `export-*.py`).
   Kierunek jest jednostronny JSON→Excel (przez `gen-panel-*.py`). Eksport cofnąłby dane do starego stanu.
3. **Deploy ląduje na `main`** — z niego żyje ROBOCZA. Sesje chmurowe/web pracują na gałęzi feature i przy deployu robią **fast-forward na `main`** (`git push origin <branch>:main`); sesja lokalna może commitować wprost na `main`. Wersja live musi ZAWSZE odpowiadać zacommitowanemu stanowi repo.
4. **Deploy ma własny runbook** (sekcja 6). **NIE używaj** `publish-robocza-bundle.ps1` — buduje ze starych źródeł.
5. `gra/src` + `gra/data` to **kanon**. Kopie w innych katalogach są zamrożone/historyczne.
6. **KAŻDY deploy loguj natychmiast** w `dyspozycje/WERSJE.md` (md5+stempel+co weszło; poprzednią oznacz ZASTĄPIONA) **i** `dyspozycje/_handoff/KANAL-PRACA.md` (meldunek dla drugiego integratora). Narracja w czacie NIE jest meldunkiem.
7. **Przy niejednoznaczności/sprzecznych danych — pytaj właściciela, nie zgaduj.**
8. **Deploy/push dopiero po pełnej pętli AutoBot i autoryzacji właściciela** —
   Operator i Evaluator kończą na raporcie/weryfikacji; integrację i publikację wykonuje
   uprawniona rola po przejściu bramek. Szczegóły: `.cursor/rules/autobot-evaluator-operator.mdc`.

---

## 3. ✅ ZROBIONE I DZIAŁA W GRZE (zdeployowane do ROBOCZA)

**Ostatni deploy: ROBOCZA `f694dcba`** (2026-07-27, FALA 31). Łańcuch ostatnich deployów tej sesji:
`e0238cc8` (FALA 29, panel miasta UX) → `d9f2c1fa` (FALA 30, dyplomacja+sentry+AI perf) → **`f694dcba`** (FALA 31, wojna HUD+klik mapy+dyplo+Manpower HP).

*(historyczny łańcuch 2026-07-21):* ROBOCZA `20239659`. Łańcuch:
`374c1067` → `a756d893` (podwojenie państw/miast + fix rzek + PPM) → `8bd30f48` (miasta-państwa aktywne) → `41d0a2ea` (przejęcie stolicy rdzeń) → `7c65681a` (przejęcie stolicy: przenieś + Power) → `0b59bf29` (AI buduje ulepszenia terenu) → `0251a5cf`/`454d7c52` (posiłki miast-państw wg trudności) → **`20239659`** (dyplomacja miast-państw wg trudności). Wcześniej (sesja 1): `74d85bc2` (mapa wybrzeże z morza) → `50448964` (render ujścia rzek) → `374c1067` (grafika żelaza + audio).

### 3a. CO WESZŁO 2026-07-21

**GRAFIKA-ŻELAZO** *(zlecenie integratora #1 z 2026-07-10 — czekało 10 dni na werdykt właściciela; dyspozycja `DYSPOZYCJA-GRAFIKA-JEDNOSTKI.md` §2b)*:
- 4 nowe moduły w `gra/src/render/`: `jednostki-z1-mezopotamia`, `jednostki-z2-srodziemne`, `jednostki-z3-plemiona`, `galera-model` — **11 modeli jednostek żelaza** + **nowa Galera** (oko apotropaiczne, trójzębny taran, żagiel z emblematem gracza, 8 wioseł/burta) zastępująca ~90 linii geometrii ad-hoc.
- **FIX Triari:** `buildSuperUnit` ignorował nazwę → `case 'rzym'` zawsze zwracał Evocati, więc Triari renderował się jako jego kopia. Teraz rozróżnienie po nazwie.
- **FIX routingu Germana:** „Wojownik germański SUPER" trafiał w generyczny fallback — dopisane `germanie` do `Culture` / `cultureFromName` / `buildSuperUnit`.
- Weryfikacja headless: `buildUnitModel` dla **73/73 jednostek bez wyjątku**; Triari 486 tri ≠ Evocati 478, German super 488 ≠ generyk 580.

**AUDIO — trzy niezależne kanały** *(nowe pliki: `gra/src/audio/filePlayer.ts`, `ambiencePrefs.ts`, `utwory/`)*:
- **Intro** (ekrany przed rozgrywką): 3 utwory instrumentalne, **stała kolejność** (`C-MUZ-Q6=A`) — spokojne otwarcie, energiczne zamknięcie. 3 utwory z wokalem odstawione do `utwory/_wykluczone/`.
- **Kamień** (rozgrywka): 16 plików mp3, shuffle, **każdy utwór 3× pod rząd**. Brąz+ synteza **bez zmian**; synteza kamienia **rozłączona, ale ZOSTAJE w kodzie** jako uśpiony fallback (pusty katalog → automatyczny powrót).
- **Crossfade 1,5 s** (`CROSSFADE_SEC`) na KAŻDYM przejściu, także między powtórzeniami; krzywa **equal-power** (liniowa dawała słyszalny dołek). Zgłoszenie właściciela: ~1 s głuchej ciszy, bo `'ended'` reaguje za późno.
- **Odgłosy natury** — **SYNTEZA, 0 MB** (nie pliki!): wiatr, ptaki, świerszcze, wycie wilka/sowy + nowy `renderListowie` (szum drzew). Własny przełącznik i suwak w menu pauzy, osobne preferencje. **Automatyczne wyciszanie w bitwie** (0,8 s) wpięte w `setMood()` — `main.ts` i pliki bitwy bez zmian. `renderWoda` (morze/rzeka) **UŚPIONA, nie skasowana** — wróci przy dźwięku pozycyjnym.
- **FIX zgłoszony przez właściciela:** wyciszenie muzyki zapisywało się trwale i gasiło też intro. Teraz `enabled` jest **ulotne** (tylko bieżąca rozgrywka), głośność nadal trwała, stare `{enabled:false}` rozbrojone.

**DANE:** Thorakites `Typ` **Swordsman→Spearman** + uwagi (tarcza thureos + włócznia dory) → łapie kontrę **Spearman vs Mount +50%**. Panel-C zsynchronizowany, round-trip OK.

**Waga bundla: 26,1 MB** (19 mp3 inline, 192 kbps). Wzrost z ~10 MB to świadoma decyzja właściciela („jeżeli plik będzie cięższy, trudno"). Konwersja do 96 kbps odpada — **brak `ffmpeg`** na maszynie właściciela.

Skrót całości live (szczegóły sesji 2026-07-20 w §4):
- **Jednostki/epoki:** progresja epok (twarda bramka + tier-gating), wielka naprawa jednostek (tokeny 100%, 7 super-jednostek), „Zastąp", typ Slinger, łańcuch brązu i żelaza (surowiec).
- **Ludy Morza** — grywalni jako barbarzyńcy epoki Brąz (obozy w Brązie spawnują Sherden/szekelesz).
- **Wioski goodie-hut** — rozmieszczenie + nagroda (złoto/tech/jednostka) + interakcja.
- **Mapa** — **wybrzeże = woda** (nie ląd; pas 2 heksy jako płytka woda), **pasma górskie** (łańcuchy zamiast plam), **rzeki dochodzą do morza** (uproszczone po zmianie wybrzeża).
- **Ekonomia/Handel** — Mennica działa (mnożnik po Walucie), per-city surowce logistyczne + converters (Cegielnia/Garncarnia), **realne szlaki handlowe** (wykrywanie połączeń + dochód + UI/mapa).

---

### 3a-2. CO WESZŁO 2026-07-21 SESJA 2 (systemy strategiczne — najnowsze)

7 systemów zdeployowanych autonomicznie (właściciel nieobecny, zgoda C-ORG-Q17=A). Wszystkie bramki zielone, każdy deploy czysty FF.

**A) Mapa — poprawki** (`a756d893`/wcześniej `74d85bc2`,`50448964`): wybrzeże powstaje z Morza przy lądzie (ląd nietknięty — fix regresji „Ziemia"); **ujście rzek wpływa w heks Wybrzeża** (weryfikacja WZROKOWA Playwright — 2 błędy: kolor kamuflujący + wodospad pod terenem); pasma gór −25%; **PPM anuluje tryb budowy ulepszeń**.

**B) Podwojenie państw/miast** (`a756d893`): miasta/klaster ×2, cywilizacje ×2 z sufitem **15** (roster nacji). Maleński=7 cyw (8 się nie mieściło). `MAX_MIAST_PANSTWA` 9→18, `MAX_TYPY_CYWILIZACJI_MENU` 14→15. Pomiar: 100% rozstawienia poza Maleńkim.

**C) Miasta-państwa — aktywny gracz** (`8bd30f48`): kopie typu (`kopia_typu_obronna`) przestały być biernym łupem — pełny rozwój (budynki gospodarcze + jednostki) + posiłki w klastrze. **Bez bonusów, bez darmowych jednostek, nie zakładają miast.** Przyczyna bierności była bramka `earlyPhase` (`myCities.length<3`, kopie mają zawsze 1 miasto).

**D) Przejęcie stolicy** (`41d0a2ea` rdzeń + `7c65681a` follow-upy): **dwa zdarzenia**. Zdarzenie 1 (są inne miasta): skarbiec→zwycięzca, pula pracy przepada, nowa stolica=następne najstarsze. Zdarzenie 2 (ostatnie miasto=ELIMINACJA): +pula nauki+brakujące techy→zwycięzca + **Power-„zdobycze"** (snapshot całego Power pokonanego, osobna kategoria); cyw usunięta z gry/dyplomacji. Stolica=najstarsze miasto (`capitalCityIdByOwner`, w save). **Przenieś stolicę** (gracz przycisk w panelu miasta + AI proaktywnie gdy zagrożona; blokada gdy oblegana). Symetria gracz↔AI, `capital-capture.ts` + test 54/54.

**E) AI buduje ulepszenia terenu** (`0b59bf29`): WSZYSTKIE AI + miasta-państwa. Nowa **`aiPracaPoolByOwner`** (symetryczna do skarbca, w save) — domyka asymetrię przejęcia stolicy (AI też traci pulę pracy przy utracie stolicy). Throttle 1/miasto/turę, deterministyczny, food-first, `wyrab` pominięty. `planCityImprovements` reużywa kwalifikatora gracza.

**F) Posiłki miast-państw wg TRUDNOŚCI** (`0251a5cf`/`454d7c52`): siostry pomagają sobie **tylko w SOJUSZU** (pełna maszyneria dyplomacji — willingness/parytet militarny, obniżony próg tierowy). Siła sterowana **trudnością gry** (osobna opcja „Wsparcie miast-państw" USUNIĘTA): Łatwy słabe / Normalny obecne / Trudny twarde. Skale sojuszu ×0,6/×0,3/×0,15; RESUP {0,3,1}/{1,2,1}/{2,1,2}. **Nowa dyplomacja AI↔AI** (`formSisterAlliancesIfThreatened`) — dotąd nie istniała.

**G) Dyplomacja miast-państw wg trudności** (`20239659`): startowe zaufanie miast-państw do gracza wg trudności (easy +10/normal +5/hard 0 — hard=dziś, monotonicznie „trudniej=mniej zaufania"; tylko kopie typu) + ożywiony martwy param `dyplomacjaAktywnosc` (skłonność do sojuszy/handlu wg trudności — **ogólny, dotyczy też głównych cyw**).

**⚠️ DO WSTECZNEJ AKCEPTACJI właściciela** (liczby strojeniowe — dostrojenie po playteście, patrz §10): przenieś-stolicę AI promień **3**; ulepszenia AI próg Pracy **>30** + priorytet food-first; skale sojuszu **×0,6/×0,3/×0,15**; RESUP **{0,3,1}/{1,2,1}/{2,1,2}**; start-zaufanie **10/5/0**; zasięg `dyplomacjaAktywnosc` (ogólny — dotyka głównych cyw); brzmienie komunikatów przejęcia stolicy (robocze).

---

### 3a-3. CO WESZŁO 2026-07-24 (sesja surowce / UI / miasta-państwa — NAJNOWSZE)

Sesja chmurowa, w większości autonomiczna (zgoda `AUTONOMIA=A`). Wykonanie delegowane subagentom Sonnet 5, integracja + deploy w głównej pętli. **Nadrzędna zasada całej sesji: PARYTET AI** — każda zmiana dla gracza obowiązuje identycznie dla AI i miast-państw (kod ownerId-agnostic). Cztery deploye (FALA 5→6.2), wszystkie bramki zielone, każdy log w `WERSJE.md` + `KANAL-PRACA.md` + `REJESTR-PROSB-I-ZADAN.md`.

**FALA 5 (`c676b681`, deploy commit `8a15538`):**
1. **Jednostki konsumują surowiec z puli państwa** (`R-JEDN-SUROWIEC`, decyzja **A = pełna konsumpcja**). Dotąd koszt `Surowiec (ilość)` przy rekrutacji był tylko wyświetlany; teraz realnie odejmowany z magazynu cywilizacji, jak przy budynkach. Blokada rekrutacji przy niedoborze. Parytet: AI też płaci. Nowy moduł `gra/src/game/building-stock-cost.ts` → `unitStockCost(unit)` (mapuje `Surowiec`/`Surowiec (ilość)` na klucz ASCII przez NFD strip: „Brąz"→`braz`, „Żelazo"→`zelazo`), reużywa `canAffordBuildingStock`/`deductBuildingStockCostAcrossCities`/`ownerResourceStockAll`/`creditOwnerResourceStock`. Test: `unit-stock-cost-test.cjs`.
2. **AI kupuje jednostki za złoto** (`R-AI-KUP-JEDN`, parytet). Dotąd tylko gracz mógł `purchaseRecruitmentUnit`. Uogólnione na dowolnego ownera (`ownerTreasury`, magazyn per-owner; UI tylko dla `ownerId===0`). Progi zakupu przez AI → `econ-params.json` (`ai_rush_jednostka_rezerwa_zlota=100`, `ai_rush_jednostka_max_na_ture=1`), predykat `shouldAIRushBuyUnit(inp)` + `loadAiRushParams`. Test: `ai-unit-rush-test.cjs`.
3. **Fix martwej bramki dostępu braz/żelazo** (`R-JEDN-DOSTEP-BUG`). `production.ts:751,846` porównywał surowiec przez `.toLowerCase()` zamiast strip-diakrytyków → bramka nigdy nie działała. Poprawione na `stripDiacritics(...)`.

**FALA 6 (`666b2b75`, deploy commit `b015764`):**
4. **Ikony surowców v4 od Design** (`R-IKONY-SUROWCE`). 12 ikon (metale/cegła/rudy odrębne, kolory) → `gra/src/ui/icons/brand/resources-map/*.svg` + `resources-map-icon-map.json` (cegła→brick, brąz→bronze, stal→steel, ruda→copper-ore, ruda_zelaza→iron-ore, ceramika→ceramics). Resolver `mapResourceIconSvg(label,size)` w `brandAssets.ts`. Kopia paczki do docs. *(Ikona konia — do wymiany, czeka na Design; SVG nie dało się załączyć w czacie.)*
5. **Bazowy magazyn 100→500** (`R-MAGAZYN-500`). `econ-params.json` `magazyn_baza_surowce` 100→500 (wszystkie trudności) + `economy-upkeep.ts` `DEFAULT_OWNER_STORAGE_PARAMS.bazaSurowcePanstwo`. Cap = **500 + 100×(liczba Magazynów)** — każdy Magazyn w każdym mieście dodaje +100 (addytywnie, nie jednorazowo). Test `surow-civ-storage-test.cjs` zaktualizowany (sekcje D/E na cap 500/600/700/1000).
6. **Surowce w HUD + zakładka magazynu** (`R-HUD-SUROWCE`). Chip „Surowce" obok Skarbiec/Praca (lewa grupa), Nauka przesunięta do prawej grupy (Zaopatrzenie/Ludność). Osobna zakładka magazynu w panelu imperium (`empireDetailPanel.ts`) na brand-ikonach: kolumny grafika+ilość+produkcja/turę (bez „/t"), nagłówek capu data-driven z `capBase`/`capBonusPerMagazyn`, tooltip na hover, chipy dostępu z ikonami. **Paski surowców w mieście:** B1 = pasek przy budowie (`appendCityResourceStockStrip`, ikona+ilość); B2 = pasek przy rekrutacji (`appendRecruitMilitaryResourceStrip`, pokazuje TYLKO Brąz w epoce 2 / Żelazo w epoce 3, zgodnie z epokami). Styl à la Total War (ikonografika+liczba, bez rozpisek). Zatwierdzone mockupy w scratchpadzie.
7. **Cuda tylko w panelu Budowa w terenie** (`R-CUDA-TAB`, korekta **2026-07-28**). Usunięty samodzielny katalog „Cuda" z lewego menu (`wondersView`); cuda pojawiają się w sekcji „Cuda świata" panelu budowy na mapie (`buildModeHud.ts` → `listWonders`/`onSelectWonder`), filtrowane per cywilizacja. *(Błędny wariant A z 2026-07-24 — sekcja w panelu produkcji miasta — wycofany.)*
8. **Proaktywność MP pod suwak trudności miast-państw** (`R-MP-DYPL-PROAKT`, część 1). Ustawienia dyplomacji miast-państw (poza główną trudnością) przeniesione pod osobny suwak „trudność miast-państw". Helper `effectiveGameDifficultyForOwner(ownerId)` w `main.ts` (~3749); `decideAIDiplomacy` bierze go jako trudność dla MP.
9. **Panele Excel B/C** (`R-PANEL-SYNC`). Generatory `gen-panel-b.py`/`gen-panel-c.py` eksportują koszty surowcowe (jednostki: Surowiec+ilość + Utrzymanie surowiec+ilość; budynki: koszt_surowce) + regen Panel-B/C.xlsx. **Panel-C dogoniony do FALA 250** (2026-08-06): koszty rekrutacji ×5 + utrzymanie surowcowe w arkuszu Koszty-jednostek. Kierunek JSON→Excel (bez odwrotnego eksportu).
11. **AI-rush progi strojalne** — patrz pkt 2 (progi wyprowadzone z hardkodów do `econ-params.json`).

**FALA 6.1 (`3db42857`, deploy commit `72bcb8a`):** dokończenie `R-MP-DYPL-PROAKT` — **CAŁA** dyplomacja miast-państw (nie tylko proaktywność) pod suwak trudności MP: `formAiAiTradeAgreementsIfEligible` obejmuje teraz MP; wszystkie decyzje dyplomatyczne MP używają `effectiveGameDifficultyForOwner`.

**FALA 6.2 (`8dc09b8a`, deploy commit `94c53a4`):**
12. **Pełny handel surowcami z miastami-państwami** (`R-MP-HANDEL-SUROWCE`, decyzja **A = pełny parytet**). Gracz↔MP i AI↔MP, jednorazowo + cyklicznie, w obie strony; AI↔MP gated na nadwyżkę (`bestOffer`). `diplomacy-layers.ts` `SIMPLIFIED_CMD += 'zaproponuj_handel_surowiec'`.
13. **Miasta-państwa = symbol kultury zamiast portretu władcy** (`R-MP-PORTRET`, potwierdzone decyzją **C-MP-Q1 = A**). Nowy portret-zdjęcie władcy zostaje dla gracza/głównego AI; miasta-państwa wracają do `civIconSvg` (symbol kultury — świątynia Grecja, tarcza Rzym, piramida Egipt…), żeby 10-11 MP tej samej kultury nie wyglądało identycznie jak główna cywilizacja. Param `forceCultureIcon` w `civLeaderMedallionHtmlById` (`diploUiSkin.ts:86`) + `isCityState` w `battleScene.ts`/`preBattle.ts`/`mapFieldBattle.ts`/`diplomacyAudience.ts`. Etykieta MP: `resolveOwnerBaseName` (`display-names.ts`) → „Sparta · Grecja · miasto-państwo". **2026-07-24 właściciel obejrzał podgląd (realny kod: dyplomacja 150px + bitwa 22px) i potwierdził A — bez dalszych zmian.**

**Analizy/dokumenty sesji:** `dyspozycje/BILANS-SUROWCE-100T-2026-07-25.md` (bilans surowców na 100 tur, założenie: każde miasto ma wszystkie budynki Kamień+Brąz), `dyspozycje/AUDYT-PARYTET-AI-2026-07-24.md` (7 obszarów parytetu OK + wykryta luka AI-kup-jednostek), `dyspozycje/POLECENIE-DESIGN-IKONY-SUROWCE-MIEJSKIE.md` (polecenie dla Design: 4 brakujące ikony surowców miejskich).

**Odłożone w tej sesji (na sygnał/playtest):** MVP dotyk/tablet (`R-DOTYK-MVP` — właściciel: „zajmiemy się później"); strojenie stawek AI-rush i dystansu drewna (playtest); wymiana ikony konia + portrety ANTYK (zewnętrzne — Design/właściciel).

---

### 3a-4. SESJA DOKUMENTACYJNA 2026-07-25 — decyzje budynkowe + rejestr problemów (bez zmian w kodzie)

Ta sesja pracowała **wyłącznie w dokumentacji** (`CLAUDE.md`, `STAN-PRACY-HANDOFF.md`, `dyspozycje/**`) — zero
zmian w `gra/`, na wyraźne polecenie (trzej inni subagenci pracowali równolegle na kodzie). Cel: zapisać
decyzje o modelu budynków podjęte dziś w rozmowie z Maciejem + spisać napotkane problemy i ich naprawy, żeby
nic nie umknęło przyszłym sesjom; oraz sprawdzić, czy trzy nowe zasady procesu (2026-07-25) są widoczne we
wszystkich plikach, gdzie takie zasady żyją.

- **[`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md`](dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md)** — model rozwoju
  budynków (awans „w górę" vs „w bok"), panel miasta (8 grup dziedzinowych), stolica-vs-regiony, siatka Prawa,
  obrona miasta procentowa (Mury+Cytadela+Baszta=400%), dwie ścieżki ulepszeń jednostek, koszty surowcowe wg
  epok, oraz zbiór pozostałych rozstrzygnięć (Karawanseraj/Lazaret/Ratusz/Stela/utrzymanie/Pretorium). Numeracja
  pytań ciągła z `PYTANIA-OTWARTE.md`/`REJESTR-PROSB-I-ZADAN.md`. Ta sesja sama nie dotykała `gra/`, ale
  RÓWNOLEGLE inne sesje wdrożyły część tych decyzji w kodzie na gałęzi roboczej (commit `2354fb7`: podział
  łańcuchów „w górę"/„w bok" + osiem grup dziedzinowych w panelu miasta) — **NIE zdeployowane do ROBOCZA**;
  reszta (Baszta, siatka Prawa, stolica/regiony, utrzymanie zróżnicowane) czeka na kolejną sesję kodową.
  Aktualny status per punkt: koniec pliku decyzji, sekcja „Skrót statusu wdrożenia".
- **[`dyspozycje/PROBLEMY-I-ROZWIAZANIA-2026-07-25.md`](dyspozycje/PROBLEMY-I-ROZWIAZANIA-2026-07-25.md)** —
  10 problemów w formacie objaw→przyczyna→rozwiązanie→nauka (plony budynków nie docierały do silnika, Pałac
  niewidoczny w produkcji, mnożnik budynków martwy/źle skierowany, obrona miasta liczona podwójnie, cegła
  blokująca budowę bez rzeki, generator map łamiący własną regułę gliny, jednostka unikalna wymagająca wpisu
  w dwóch plikach, proporcje tarczy Zulu, anachronizmy w danych, opisy `uwagi` niezgodne z kodem).
- **Sprawdzone trzy nowe zasady procesu** (zakaz nowych wątków / liczba+parametr+jednostka+kontekst /
  Opus-Fable za zgodą): uzupełnione w `dyspozycje/PAMIEC-ROBOCZA-CIV.md` §1a (brakowały) i
  `dyspozycje/BACKLOG-PRZYSZLOSC.md` §E (brakowały dwie z trzech — model Sonnet 5 już tam był). Już były
  w `CLAUDE.md`.
- **Spójność:** poprawiony nieaktualny opis modelu budynków w §9 niżej (patrz adnotacja przy „ZAPARKOWANE DO
  CZASU KOLEJNYCH EPOK") + oznaczone statusy Pytań 18/19 w `PYTANIA-OTWARTE.md` i `BACKLOG-PRZYSZLOSC.md` +
  zaktualizowana lista pre-istniejących porażek testów w §7 niżej i w `CLAUDE.md` (208/208 + 2 nowe testy).

---

### 3a-5. CO WESZŁO 2026-07-27 (sesja UI miasta / mapa / dyplomacja / Manpower)

Sesja lokalna (Windows), trzy deploye FALA 29→31, wszystkie VERIFY OK. POLE-BITWY: build pominięty przy każdym deployu (OneDrive lock). Pełny zapis problem→przyczyna→naprawa poniżej — format dla kolejnych agentów.

#### Deploye

| FALA | md5 | commit | Zakres |
|------|-----|--------|--------|
| **29** | `e0238cc8` | `ba4dabd` | Nagłówek miasta flank · fix „i szczegóły" · rekrutacja bez HP w podtytule · kolory wymagań budynków · sekcja budynków 2× · hex detail dblclick · pieczęć build ukryta + ℹ toggle |
| **30** | `d9f2c1fa` | `f4a8d7c` | Modal handlu dyplomacji (koszyk+tury) · sentry odznacza jednostkę · cache AI w pętli handlu |
| **31** | `f694dcba` | `53b9901` | Wojna tylko w Wydarzeniach (bez paska) · klik mapy pickMapTarget · karta „Twoje państwo" · **B-MP-Q1** HP heal z Manpower |

#### Panel miasta (FALA 29)

| Problem | Przyczyna | Naprawa | Pliki |
|---------|-----------|---------|-------|
| Ikony zakładek nieklikalne | `.civ-ux-top` blokował `pointer-events` prawego raila | `pointer-events: none` na stosie top + panele `z-index: 410` | `cityPanel.ts`, CSS scope `.civ-cs` |
| „i szczegóły" nie otwiera panelu | Ten sam konflikt warstw + `<span>` zamiast przycisków | Przyciski zamiast spanów + fix z-index | `cityPanel.ts`, `empireDetailPanel.ts` |
| Zły układ nagłówka | Zasoby nie flankowały nazwy miasta | Layout flank: Praca/Żywność/Skarbiec lewo, Kultura/Religia/Nauka prawo; exit niżej | `cityPanel.ts` |
| Wymagania budynków — białe chipy | CSS tylko pod `.civ-cs`, nie `.civ-detail-scope` | Rozszerzenie selektorów CSS na `.civ-detail-scope` | `cityPanel.ts` / style scope |
| Pieczęć build zasłania UI | Overlay widoczny domyślnie | Ukryty domyślnie + toggle ℹ (`buildStampToggle.ts`) | `buildStampToggle.ts`, `main.ts` |
| Sekcja „Posiadane budynki" za mała | Stała wysokość paska | 2× wysokość `.civ-v-build-owned-bar` | CSS panelu miasta |
| Rekrutacja — zbędne HP w podtytule | Karta jednostki pokazywała staty w subtitle | Usunięte HP/stats z subtitle | `unitRecruitCard.ts` |

#### Mapa / bitwa (FALA 29–31)

| Problem | Przyczyna | Naprawa | Pliki |
|---------|-----------|---------|-------|
| Panel szczegółów heksu na single-click | Handler single-click | Double-click na heks (`main.ts`) | `main.ts` |
| Sentry (Czuwaj) nie odznacza | Brak `clearPlayerUnitSelection` po sentry | Wywołanie `clearPlayerUnitSelection()` w handlerze sentry | `main.ts` |
| Klik mapy trafia w zły cel / miss | Pick tylko terenu; offset jednostek na miastach; fallback y=0 | `pickMapTarget`, `pickUnitIdAt`, płaszczyzna wysokości terenu | `picker.ts`, `units.ts`, `main.ts` |

#### Dyplomacja (FALA 28–31)

| Problem | Przyczyna | Naprawa | Pliki |
|---------|-----------|---------|-------|
| Modal handlu pusty/zamrożony | Zły modal dla akcji 5 | Koszyk handlu + wybór tur + podsumowania + Esc | `diplomacyAudience.ts`, `diplomacyTradeBasket.ts` |
| Bałagan paska wojny (czerwone zakładki per-cyw) | Stały pasek wojny w HUD | Usunięty pasek; wojna tylko w panelu Wydarzenia (`warEventLog`) | `hud.ts`, `main.ts` |
| Karta „Twoje państwo" — nadmiar | Pokazywała traktaty/wojny | Uproszczona: moc/skarbiec/stawki/nauka/ludność/armia (bez traktatów/wojen) | `diplomacyPanel.ts` / audience |
| Chipy paktów na liście cyw | Brak wizualizacji paktów | Chipy paktów na kartach cywilizacji (FALA 28) | `diplomacy-display.ts`, `diploListHud.ts`, `diploUiSkin.ts` |

#### AI / ekonomia (FALA 30–31)

| Problem | Przyczyna | Naprawa | Pliki |
|---------|-----------|---------|-------|
| Wolne tury AI (FALA 23+) | O(N²) skany handlu dyplomacji | Cache + early skip w pętli AI | `main.ts` |
| **B-MP-Q1** — brak uzupełniania HP z Manpower | Mechanizm nie istniał | % max HP/turę wg trudności (25/20/15); częściowe MP; brak heal w oblężonym mieście | `manpower.ts`, `miasto-params.json`, `turn-economy.ts` |

**Decyzja B-MP-Q1 (Maciej 2026-07-27):** Q1a=B (% maxHP), Q1b=A (częściowe leczenie), Q1c=brak w oblężeniu. Test: `manpower-test.cjs` **62/62**. Dokumentacja: [`dyspozycje/_scalone/EKONOMIA/EKONOMIA-manpower-pobor.md`](dyspozycje/_scalone/EKONOMIA/EKONOMIA-manpower-pobor.md) §Faza 3.

**Bramki sesji (FALA 31):** tsc 0 · manpower 62/62 · picker 140/140 · diplomacy-display 17/17 · diplomacy-negotiation-table 39/39 · deposit-building-gate 41/41 · logic **207/208** (pre-istniejący garnizon).

---

### 3a-6. CO WESZŁO 2026-07-27/28 (sesja ekonomia + żeton jednostki + bonus budynków — **NAJNOWSZE**)

Sesja lokalna (Windows), cztery deploye FALA 41→44, wszystkie VERIFY OK. POLE-BITWY: bez zmian od FALA 41 follow-up (`a5a60f15`). Pełny zapis w `dyspozycje/WERSJE.md` + `KANAL-PRACA.md` + `docs/MACIEJ-GOTOWE.md`.

#### Deploye

| FALA | md5 | commit | Zakres |
|------|-----|--------|--------|
| **41** | `c1e7a596` | `68395cc` | PYTANIE-85: żywność ludności + podatek + ulepszenia panelu |
| **42** | `6714d76f` | `36cc3c3` | Spichlerz U-12 (Zdrowie+wzrost %) + U-25B (racja ×0,75/×0,50) + Garncarnia R7-C (nadwyżka Ceramiki → Zadowolenie) |
| **43** | `33c49486` | `d8beff0` | **C-OBCE-JEDN-Q2:** medalion właściciela (lewo) + ikony koszar/kuźnia przy gwiazdkach weterana (brąz/srebro/złoto); usunięte kropki u podstawy żetonu |
| **44** | `95021308` | `65e3ddd` | **C-UPGRADE-TRIGGER:** bonus Kuźnia/Koszary **natychmiast** przy wejściu/przejściu przez heks własnego miasta + **toast** graczowi |

#### Decyzja Macieja — kiedy nalicza się bonus budynków wojskowych (FALA 44)

| Było | Jest |
|------|------|
| Koniec tury — jednostka stoi na heksie własnego miasta | **Każdy heks własnego miasta na ścieżce ruchu** (wejście lub przejście) |
| Brak komunikatu | **Toast** graczowi po przyroście bonusu |
| Kumulacja ze wszystkich miast | **Bez zmian** — nadal **najlepsze odwiedzone miasto** per ścieżka (`C-UPGRADE-KUMULACJA` **1A**) |
| Bonus trwały | **Bez zmian** — `pancerzBonusProc` / `parametryBonusProc` |
| Rekrutacja w mieście | Bonus przy narodzinach (bez dodatkowego toastu) |
| AI | Ten sam mechanizm, **bez UI** (parytet) |

**Dokumentacja:** [`docs/decyzje/C-UPGRADE-TRIGGER.md`](docs/decyzje/C-UPGRADE-TRIGGER.md) · [`docs/decyzje/C-UPGRADE-KUMULACJA.md`](docs/decyzje/C-UPGRADE-KUMULACJA.md) · [`docs/decyzje/C-OBCE-JEDN-Q2.md`](docs/decyzje/C-OBCE-JEDN-Q2.md)

**Kod:** `unit-building-bonuses.ts` (`applyCityVisitBonusGain`, `formatBuildingBonusGainHint`) · `main.ts` (`applyCityVisitBonusesAlongPath`, `applyCityVisitBonusesAtHex` — ruch gracza, AI, zwiadowcy, snap End Turn) · test `unit-building-bonuses-test.cjs` **82/82**.

**Bramki FALA 44:** tsc 0 · unit-building-bonuses 82/82 · VERIFY OK.

---

## 4. ✅ CO WESZŁO W SESJI 2026-07-20 (szczegóły + decyzje)

Wszystko poniżej jest **zdeployowane i na GitHubie**. ID decyzji w nawiasach — NIE pytaj o nie ponownie (§9).

1. **Ludy Morza jako barbarzyńcy Brązu** (deploy `ba8ab0d7`) — gdy `player.era===2`, obozy spawnują wyłącznie Wojownika Sherden/szekelesz (naprzemiennie, deterministycznie), wszystkie poziomy. `game/barbarians.ts` (`LUDY_MORZA_BARB_UNIT_IDS`, `pickBronzeBarbUnit`) + override w `main.ts`. Szekelesz `Kultura`→„Ludy Morza". Decyzje **SEA-Q1..Q5 = A/A/A/A/C**.
2. **Wioski goodie-hut** (`ba8ab0d7`) — nowy `map/villages.ts` `placeVillages()` (rzadko, ~1/140 heksów lądu, wzorzec `spawnCamps`, pełne wykluczenia). Wejście jednostki gracza → nagroda (`game/villageRewards.ts`: złoto 50%/tech 30%/jednostka 20%, fallback złoto; Żelazo→fallback złoto) → wioska znika. Decyzje **WIO-Q1..Q6 = B/B/B/A/B/A**.
3. **Naprawa bramek testowych** (`ba8ab0d7`) — `combat-test` **6/6** (dodane `counterTyp` w harnessie), `logic-test` **203/203** (aktualizacja fixtur Brązownictwa/tempa/buntu; las+złoże DOZWOLONE, `TEST-Q1=B`). ⚠️ **To były „znane porażki" ze starego handoffu — teraz NAPRAWIONE i zielone.**
4. **Mapa — wybrzeże → WODA** (`b217916e`, `WYBRZEZE-Q1/Q2/Q3=A/A/A`) — predykaty generatora liczą Wybrzeże jak wodę; pas 2 heksy zostaje; usunięte z terenów budowalnych (droga/fort precz; warzelnia soli→przybrzeżna); render=płytka woda. **`COAST-Q4=A`:** balans „% lądu" liczy tylko suchy ląd → mapy z większym lądem, mniej/większe wyspy (świadome).
5. **Mapa — dłuższe pasma** (`b217916e`, `HILLS-Q1/Q2/Q3=A/A/A`) — `growMountainRanges` (seed-and-grow, rdzeń Gór/obrzeże Wzgórz) + `gestosc.pasma_gorskie`; łańcuchy zamiast plam; floor fair-play + sanity-cap 40% zachowane.
6. **Mapa — rzeki uproszczone** (`b217916e`, `RIVER-Q1/Q2/Q3=A1/B1/C2`) — ujście = każda woda; rzeka kończy na pierwszym kontakcie; bramka wzmocniona (`rivers:'high'` + `pathReachesRealSea`): 637/637 z ujściem.
7. **Handel — komplet decyzji `HANDEL-Q1..Q12`** (szczegóły §9). Zbudowane etapami:
   - **E1** (`b217916e`) — **Mennica** naprawiona (mnożnik po Walucie **easy 2 / normal 1,5 / hard 1**, tylko gdy zbudowana+Waluta; `MENNICA-Q1=A` = zostaje) + **per-city surowce** (`city.surowce`, drewno/kamień z terenu, converters ożywione; braz/żelazo/hodowla ZOSTAJĄ civ-wide).
   - **Zbieranie gliny** (`a31ebe6f`, `GLINA-Q1/Q2=A/A`) — glinianka 2 gliny/turę → Cegielnia/Garncarnia ożywają (cegła/ceramika); **ruda/brąz świadomie odłożone**.
   - **E2** (`a31ebe6f`, `Q6=B`) — `game/trade-routes.ts` `findCityConnection` (ląd: dystans+BFS; morze: Port+BFS po wodzie) + cache.
   - **E3** (`a31ebe6f`) — **dochód z tras**: TYLKO zewnętrzne (gracz↔obca cyw, pokój), auto, limit = liczba budynków handlowych; dochód = wzór dystansowy (`Q7=A`) **+ +5% Handlu za trasę** (kumulatywnie), OBIE strony (`Q8=B`), do skarbca czysto. Trasy w zapisie gry.
   - **E7** (`a31ebe6f`) — UI: panel miasta „Szlaki handlowe" + łuki tras na mapie (złoto=ląd, błękit=morze).

---

## 5. ⏳ W TRAKCIE

**2026-08-06 ~13:15:** ECHO ABC 6× **ZAPISANE** · handoff sesji gotowy · **CZEKA** na Maciej **`działaj`** → 6 osobnych Autobotów (kolejność §1 handoffu F254-ECHO). Kod wdrożeniowy **nie** startuje bez hasła. Deploy FALA 255 = komunikacja + odświeżenie ROBOCZA (logika = F254).

*(historyczny) **2026-07-28 — NIC NIE JEST W TOKU** po deployu FALA 44 `95021308`.*

*(poprzedni) **2026-07-27 — NIC NIE JEST W TOKU** po deployu FALA 31 `f694dcba`.

*(historyczny) 2026-07-24 — NIC NIE JEST W TOKU po FALA 6.2 `8dc09b8a`.*

**(historyczny) 2026-07-23 — NIC NIE JEST W TOKU po deployu `6bb7fedc`** (faza 3 HUD, preBattle i dyplomacja ZDEPLOYOWANE; poniższy wpis historyczny) — HUD bitwy TW-v5 FAZA 3 w toku (sesja chmurowa, subagent): C-12 „Koniec bitwy" + C-23 „Szczegóły" wg makiety Design `POLE-BITWY-TW-v5` (klatki 4–5), unifikacja paneli 70%+blur, ikonowy dolny toolbar 46×46 z podpisem na hover, karty rosteru z medalionem typu. Dotyka: `gra/src/battle/battleScene.ts`, `battleHudTheme.ts`, `endDetails1E.ts`, `endScreen1E.ts`. Fazy 1–2 są zacommitowane (`0f1455e`, `4726e97`) i ZDEPLOYOWANE (`2c19fcb3`). Jeśli widzisz niezacommitowane zmiany w tych plikach — to faza 3, nie nadpisuj.

---

## 6. 🚀 DEPLOY RUNBOOK (potwierdzony)

Z katalogu `gra`:
```bash
node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir   # NIE npm run build!
```
Następnie:
1. Skopiuj `gra/dist/index.html` → `gra-robocza/Gra-ROBOCZA.html`
2. **Stamp** (pieczątka md5+stempel): na Windows `gra/tools/inject-build-stamp.ps1 -HtmlPath <...>/gra-robocza/Gra-ROBOCZA.html -Tier ROBOCZA`. **⚠️ Na Linux/chmurze brak PowerShell** — użyj wiernego **portu node'owego** (skrypt jednorazowy: czyta HTML, wstawia/aktualizuje `<div id="civ-build-stamp">` z md5+stemplem, iteruje md5 4×). Efekt identyczny.
3. `node gra-robocza/tools/sync-playtest-bundles.cjs` (kopiuje bundel do 6 playtestów; **nie rusza** bundli bitewnych integratora)
4. `node gra-robocza/tools/generate-start-hub.cjs` (manifest md5 + START.html)
5. `node gra/tools/verify-robocza-bundle.cjs` → musi wypisać **`VERIFY OK`**
6. **Zaloguj** deploy (§2 pkt 6): `WERSJE.md` + `KANAL-PRACA.md`.
7. Commit + push na `main` (z gałęzi feature: `git push origin <branch>:main` po sprawdzeniu FF).

**Uwaga:** `verify` sprawdza `manifest.md5 === md5(Gra-ROBOCZA.html)`. „stamp match: WARN" jest **normalny** (md5 w `title` z założenia o iterację w tyle). Bramka `map-gen-regression-test` — progi czasowe „AC <5s/<15s" bywają FAIL na wolniejszej maszynie/CI; **to pomiar wydajności, nie regresja** (liczy się determinizm A=B + 0 rzek bez ujścia).

### 6a. Promocja ROBOCZA → KANON (osobna procedura, po teście Master)

Z katalogu `gra`:
```powershell
.\tools\publish-kanon-snapshot.ps1
```
Wymaga `gra-robocza/Gra-ROBOCZA.html` po PASS F + test Master. Robi **wyłącznie** ROBOCZA→KANON: kopiuje `gra-robocza/` → `gra-kanon/`, zmienia nazwy bundli na `Gra-KANON*.html`, stempluje (`inject-build-stamp.ps1 -Tier KANON`), zapisuje `KANON-MANIFEST.json`, odświeża `START.html`/`START-GRA.html`, uruchamia `cleanup-retention.ps1`. **Nie dotyka `Gra-FINALNA.html`** — to osobny krok (§6b). Zaloguj promocję w `WERSJE.md` (sekcja KANON) + `KANAL-PRACA.md`.

### 6b. Promocja KANON → FINALNA (osobna procedura, RZADKO, na wyraźne polecenie właściciela)

Z katalogu `gra`:
```powershell
.\tools\publish-finalna-snapshot.ps1
```
Wymaga `gra-kanon/Gra-KANON.html` (kanon już promowany i przetestowany — **źródłem jest KANON, nie ROBOCZA**). Kopiuje `gra-kanon/Gra-KANON.html` → `Gra-FINALNA.html` w korzeniu, stempluje (`inject-build-stamp.ps1 -Tier FINALNA`), wypisuje md5 źródłowego KANONU i md5 powstałej FINALNEJ. **Uruchamiać tylko gdy Maciej wyraźnie o to poprosi** — nigdy automatycznie przy okazji §6a. Zaloguj promocję w `WERSJE.md` (sekcja FINALNA) + `KANAL-PRACA.md`.

---

## 7. ⚠️ CO NIE DZIAŁA / ZNANE PROBLEMY

**Bramki, które MAJĄ przechodzić** (uruchamiaj z `gra/`):
```bash
npx tsc --noEmit                     # 0 błędów
node tools/tech-tree-test.cjs        # 19/19
node tools/research-test.cjs         # 33/33
node tools/unit-replace-test.cjs     # 10/10
node tools/map-gen-regression-test.cjs   # determinizm A=B + 0 rzek bez ujścia
node tools/logic-test.cjs            # 213/213, exit 0  (R-BRAMKA-MINDIST-Q1=A, 2026-08-07; fail garnizon naprawiony)
node tools/manpower-test.cjs         # 62/62    (FALA 31, B-MP-Q1 HP heal)
node tools/picker-test.cjs           # 140/140  (FALA 31, pickMapTarget)
node tools/combat-test.cjs           # 6/6      (NAPRAWIONE 2026-07-20)
node tools/barbarians-test.cjs       # 74/74
node tools/villages-test.cjs         # 31/31
node tools/converters-test.cjs       # 31/31
node tools/mennica-magazyn-test.cjs  # 38/38
node tools/trade-routes-test.cjs     # 35/35
node tools/trade-routes-income-test.cjs  # 49/49
node tools/unit-stock-cost-test.cjs      # konsumpcja surowca przez jednostki (2026-07-24)
node tools/ai-unit-rush-test.cjs         # AI kupuje jednostki za złoto — progi (2026-07-24)
node tools/surow-civ-storage-test.cjs    # magazyn=pula państwa, cap 500+100/Magazyn (2026-07-24)
node tools/display-names-test.cjs        # etykieta MP „Miasto · Kultura · miasto-państwo" (2026-07-24)
```

**⚠️ KOREKTA starego handoffu:** notatka o „21 porażkach `logic-test`" i „`combat-test` rzuca wyjątek" jest **NIEAKTUALNA** — oba **naprawione 2026-07-20** i zielone (203/203, 6/6). Zweryfikowane na baseline.

**⚠️ KOREKTA 2026-08-13 — lista bramek wyżej jest CZĘŚCIOWO NIEAKTUALNA** (np.
`barbarians-test.cjs` pokazany jako 74/74 to stan sprzed wielu sesji, dziś **167/167**).
Ta lista NIE jest już aktualizowana na bieżąco — **autorytatywnym, żywym źródłem progów
bramek jest `CLAUDE.md` sekcja „BRAMKI"** (wstrzykiwane do kontekstu automatycznie każdej
tury, w przeciwieństwie do tego pliku). Sesja 2026-08-12/13 dodała/rozszerzyła ~15 nowych
plików testowych (m.in. `barb-city-behavior-test.cjs`, `barb-city-capture-cluster-test.cjs`,
`resource-usage-breakdown-test.cjs`, `empire-miasta-table-test.cjs`,
`diplomacy-acceptance-points-test.cjs`, `porzadek-panel-czytelnosc-test.cjs`,
`eot-diplomacy-header-test.cjs`, `building-tech-gate-test.cjs`,
`diplomacy-basket-duplicate-test.cjs`+`-ui-test.cjs`, `promote-to-front-test.cjs`) — pełna
lista z aktualnymi licznikami: `dyspozycje/PYTANIA-OTWARTE.md`, szukaj „PODSUMOWANIE SESJI"
(2026-08-12/13). `logic-test.cjs` = **213/213** nienaruszone przez całą sesję (punkt
odniesienia `R-BRAMKA-MINDIST-Q1=A` wciąż obowiązuje).

**Realne pre-istniejące porażki (NIE regresja, nie naprawiaj przy okazji) — stan 2026-07-27 (sesja F29–31):**
- ~~`logic-test.cjs` → **207/208** — 1 fail **garnizon**~~ — **NIEAKTUALNE.** Fail garnizon naprawiony (`C-GARN-Q1=A`), a decyzją **`R-BRAMKA-MINDIST-Q1 = A` (2026-08-07)** punktem odniesienia jest **`213/213`, exit 0**. Wynik 209 lub 208 oznacza cofnięcie tej decyzji, nie normę.
- `currency-test.cjs` → **5 porażek** (dot. `pieniadzZPracy`/Efekt2 i mnożnika per-cyw). Zweryfikowane identycznie na baseline `git stash`.
- `map-gen-regression-test.cjs` — progi czasowe „AC" (generacja <5s/<15s) FAIL na wolnej maszynie = pomiar wydajności, nie regresja.
- **KOREKTA 2026-07-26:** `akwedukt-popcap-test.cjs`, `auto-manage-test.cjs`, `growthmult-compound-test.cjs`, `upgrade-budynki-test.cjs`, `deposit-building-gate-test.cjs` figurowały tu jako czerwone (wpis 2026-07-25) — **audyt zweryfikował przez faktyczne uruchomienie z `gra/`, że wszystkie pięć są dziś ZIELONE**: `upgrade-budynki-test.cjs` 48/48, `deposit-building-gate-test.cjs` 34/34, `akwedukt-popcap-test.cjs` 5/5, `auto-manage-test.cjs` 29/29, `growthmult-compound-test.cjs` 24/24. Zdjęte z listy.
- `relief-grid-coverage-test.cjs` — **2 pass / 4 fail** (stan 2026-07-26). **W NAPRAWIE na mocy decyzji C-MAPA-Q1=B** (osobny agent dostraja generator w `gra/src/map/**`), nie stan docelowy. Przyczyna: konsekwencja decyzji 63 (limit 10 heksów na spójne skupisko Gór/Wzgórz) — kilka osobnych skupisk może wpaść do jednej komórki siatki reliefu, więc limit skupiska i próg per komórka mierzą różne rzeczy (dokumentacja w kodzie: `gra/src/map/gen-helpers.ts:1961-1964`).
- `fair-play-grid-test.cjs` — **3 pass / 5 fail** (stan 2026-07-26). **W NAPRAWIE na mocy decyzji C-MAPA-Q1=B**, ten sam mechanizm co wyżej. Punkt odniesienia zmierzony 2026-07-26 (do porównania po naprawie): 56 gór w najgorszej komórce siatki przy dopuszczalnych 25, 95 wzgórz przy dopuszczalnych 37 (Standard kontynenty).
- `map-deposits-era-test.cjs` — **był przestarzały** (asercjonował starą regułę terenu złóż: miedź na Górach), sprzeczny z regułą obowiązującą od 2026-07-25 (miedź na **Wzgórzach**, żelazo na **Górach**, `gen-helpers.ts:6734,6740`). **Naprawiony 2026-07-26** — zaktualizowano asercje testu do obowiązującej reguły, dziś **16/16 zielony**.

**Inne znane problemy / długi:**
- **POLE-BITWY bundle** — przy deployach F29–F31 build pominięty (OneDrive lock). Bundel bitewny w `gra-robocza/` może być niezsynchronizowany z ROBOCZA główną.
- **Bug rzeka↔mgła** — rzeka znika przy budowie miasta, wraca po wyłączeniu mgły wojny. ⚠️ Możliwe, że zmiana „wybrzeże=woda" (2026-07-20) to zmieniła — **do weryfikacji wzrokowej**.
- **Panele Excel** — kierunek jednostronny JSON→Excel; nie odpalać `export-*.py` (§2).
- **„Zastąp"** — nie zweryfikowano wzrokowo ścieżki „jednostka w polu poza miastem" ani blokady przy braku środków.
- ~~Balans Mennicy — Fenicjanie ×11,4~~ — **ZAMKNIĘTE 2026-08-06**: ×11,4 był artefaktem kodu SPRZED refaktoru „Efekt 1 SCALONY" (2026-07-25), gdy Waluta+Mennica mnożyły niezależnie; dziś to jedna bramka, dubel nie istnieje. Realny szczyt: ×5,79 (normal)/×7,46 (easy)/×4,30 (hard) — patrz `docs/decyzje/R-FENICJA-SKARB-CAP-Q1.md`.

**Wioski** (stary problem „`istnieje` nigdy nie = true") — **NAPRAWIONE** (§4 pkt 2).

---

## 8. 📋 CO ZOSTAŁO DO ZROBIENIA

**Kolejka sesji bitewno-UI 2026-07-23 (rejestr integratora chmurowego):**
- **#6 HUD TW-v5 faza 3** — W TOKU (patrz §5). Po ukończeniu: weryfikacja wzrokowa vs makieta → commit → deploy → log.
- **#7 Rzeka w bitwie — kara za brodzenie** (etap B mechaniki: jednostka w brodzie wolniejsza/podatna) — do ABC z właścicielem.
- **#8 Oblężenie — dopracowanie planszy**: budynki miasta za murem + gruz w wyłomie.
- **#10 Długi silnika dyplomacji**: SZYBKA UMOWA = realna auto-uczciwa oferta; dobrowolne zrywanie traktatów („Zerwij"); indeks dóbr handlowych per właściciel; opcjonalnie Konfederacja/aneksja/handel mapami (ABC).
- **#11 Stary dług UI (audyt 2026-07-05 §3)** — ✅ ZAMKNIĘTE (recon 2026-07-23): wszystkie 4 pozycje JUŻ WDROŻONE przez lane UI/Cursor — karty budynków (`cityPanel.ts` `buildBuildingInfocard`), W4 7 zakładek (`withW4TabCard`), chipy 6C (`hudChip6c.ts` + raporty per miasto w `empireDetailPanel.ts`), popupy v5 (SVG GAP-03/04 w `battleHudTheme.ts`).
- **#13 preBattle jako nakładka na mapie** — ⏸ CZEKA na kanon Claude Design (zlecenie wysłane w paczce `DO-DESIGN-2026-07-23`); NIE implementować przed kanonem.
- **#14 Porządek mockupów**: konsolidacja ~20 do `KANON/mockupy` (martwe linki hubu); ~18 brakujących zgłoszone Design.
- **#12 Brand-book KANON zainstalowany** — ✅ ZROBIONE (commit `9a533e5`, live w `01-propozycje-z-design/brand-book/KANON/`).
- **Backlog przyszłościowy (Maciej: „kiedyś")**: większe plansze bitwy — czarne tło zastąpione graficznie ułożonym lądem.

- **[ODLOZONE — decyzja Macieja 2026-07-22] Wielka Kuznia (epokaWejscia=4) i Lazaret (5) niebudowalne** (audyt #41): epoka gracza konczy sie na 3, a techy tier 8-9 obiecuja te budynki. UWAGA: w buildings.json:1283 jest komentarz "PARKOWANIE poza cap v0.1" — moze byc celowe. Opcje: A) obnizyc epokaWejscia do 3 (odparkowac), B) zostawic + mechanizm parkowania jak przy cudach. Wracamy na sygnal Macieja; do tego czasu NIE zmieniac.


**Handel — kolejne etapy epiku (design zamknięty, patrz §9):**
- **E6** — AI proaktywnie proponujące umowy handlowe + **obniżony próg** zawarcia (dziś `progHandelRelacja=100` ≈ sojusz; dar ma 30). Dziś trasy powstają tylko z perspektywy gracza; AI↔AI trade nie istnieje.
- **E3b** — dostęp do surowca przez trasę (`Q11=B` boolean grant) — wymaga najpierw **mechanizmu revoke grantu** w `diplomacy-basket-transfer.ts` (żeby wojna cofała dostęp).
- **Dostrojenie** dochodu dystansowego tras — dziś placeholdery `handel_szlaki.dochod_bazowy=8 / dochod_na_dystans=0.4 / dochod_podloga=1` w `econ-params.json`.
- **Powiadomienia** o powstaniu/zniknięciu trasy (pominięte w E7).
- **Cegła/ceramika** (i przyszły brąz) — kumulują się w `city.surowce` bez konsumenta; docelowo **dobra handlowe** (Q11) albo koszt budynków.
- **Glina/ruda→brąz** — dziś zbierana tylko glina (`GLINA-Q2=A`). Ruda→brąz to osobna decyzja (przebudowa brązu z civ-wide boolean na ilościowy vs zostawienie).

**Mapa / teren:**
- **[ODŁOŻONE — Maciej 2026-07-28] Grafika złoża złota na mapie:** generator ustawia `hex.zloze='zloto'` (Wzgórza/Góry), ale brak nakładki 3D na heksie (`buildStyledResourceOverlay` bez case `zloto`, brak `buildZlozeZlota()`). Widoczne dziś: model `kopalnia_zlota` po zbudowaniu kopalni + ikona UI `res-gold.svg`. **Świadomie odłożone** — Maciej: „na razie tak musi zostać"; nie implementować bez sygnału.
- Weryfikacja wzrokowa: pasma, wybrzeże=woda, bug rzeka↔mgła (patrz §7).
- ~~Gęstość osadnictwa (więcej miast/państw)~~ — **ZROBIONE** (sesja 2, podwojenie państw/miast). Chunki mapy dla słabszych maszyn — odłożone.
- **Follow-upy strategiczne (po playteście):** dostrojenie liczb (progi AI, skale sojuszu, RESUP, start-zaufanie — §3a-2); ewentualnie: więcej nacji (żeby cywilizacje ×2 działało pełni powyżej 15 na Ogromny/Super); wyrąb lasu (`wyrab`) dla AI (dziś pominięty).
- Dedykowana „Kopalnia żelaza" jako osobne ulepszenie — **decyzja odłożona** (ogólna kopalnia wystarcza).

**Ludy Morza — pełny feature** (agresja AI + pływanie + embarkacja) — osobny, duży temat (dziś tylko barbarzyńcy).

**Porządki:** restrukturyzacja drzewka 3-tier (D1–D9) · sprzątanie starej dokumentacji jednostek (widmowy „Kusznik").

---

## 9. ✔️ DECYZJE JUŻ PODJĘTE (NIE pytaj o nie ponownie)

### 🅿️ ZAPARKOWANE DO CZASU KOLEJNYCH EPOK (Maciej 2026-07-25) — NIE RUSZAĆ
**Zasada: 1 poziom budynku = 1 epoka**, każdy poziom z INNYMI surowcami.
Przykład wzorcowy — Pałac: `palac` (Kamień, drewno) → `palac_ii` (Brąz, drewno+kamień) → `palac_iii` (Żelazo, drewno+kamień+cegła). Te trzy tiery istnieją i są poprawne jako podział na epoki.

**⚠️ AKTUALIZACJA (2026-07-25, później tego samego dnia) — poprzedni zapis „model docelowy, działa poprawnie" był NIEPEŁNY dla łańcuchów „w górę".** Pełny, aktualny model rozwoju budynków (rozróżnienie awansu „w górę" — następca kasuje poprzednika, stała wartość per tier, rośnie TYLKO przez awans — vs awansu „w bok" — oba budynki stoją obok siebie naprawdę) jest w **[`dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md`](dyspozycje/DECYZJE-BUDYNKI-2026-07-25.md) §1**. Skrót różnicy: Pałac to łańcuch „w górę" (Dom Starszyzny→Dwór Zarządcy→Pretorium, Kuźnia brązu→Kuźnia żelaza→Wielka Kuźnia, Spichlerz→Spichlerz II, Port→Port wielki, Piec hutniczy→Odlewnia żelaza — też „w górę"), a Mury+Cytadela+Baszta / Biblioteka+Akademia / Koszary+Akademia wojskowa / Kamienne kręgi+Świątynia idą „w bok" (nie zastępują się). Status wdrożenia w kodzie: NIE sprawdzony w tej sesji dla wszystkich sześciu łańcuchów „w górę" — patrz plik decyzji.

**⛔ NIE projektujemy poziomów budynków „na zapas".** Kolejny poziom/tier budynku powstaje **dopiero wtedy, gdy realnie dochodzi kolejna epoka** — nie wcześniej.
Maciej (dosłownie): „Każdy poziom jest dla następnej epoki… Jak będziemy rozwijać kolejne epoki, to robimy kolejny poziom pałacu. Po co teraz to robić?"

**DO PRZEMYŚLENIA PRZY DODAWANIU KOLEJNYCH EPOK** (i tylko wtedy):
- Dla KAŻDEGO budynku osobno rozstrzygnąć: **czy on w ogóle awansuje w kolejnej epoce?** (nie każdy musi — część budynków może się kończyć na swojej epoce).
- Jeśli awansuje: jaki nowy tier, jakie surowce (muszą się RÓŻNIĆ od poprzedniego poziomu), jakie bonusy, jaka nazwa.
- Dotyczy to Pałacu ORAZ 8 pozostałych łańcuchów: Odlewnia brązu→żelaza · Port→Port wielki · Kamienne kręgi→Świątynia · Spichlerz→Spichlerz II · Biblioteka→Akademia · Mury→Fort/Cytadela · Koszary→Akademia wojskowa · Kuźnia żelaza→Wielka kuźnia.

**Kiedy ruszać:** WYŁĄCZNIE gdy Maciej powie, że wchodzimy w kolejne epoki.

### 🅿️ DRUGI TEMAT ZAPARKOWANY: AWANS BUDYNKÓW PRZEZ POZIOMY (Maciej 2026-07-25)
**Pierwotny pomysł (z początku projektu):** każdy budynek ma **10 poziomów rozwoju**, awansuje o jeden w każdej epoce.
**Dlaczego to nie działa dziś:** gra ma 3 epoki, więc budynek z epoki 1 osiąga poziom 3, z epoki 2 — poziom 2, z epoki 3 — poziom 1. Deklarowane `maksPoziom: 10` było fikcją w KAŻDYM budynku. Maciej: „jeżeli budynek będzie w epoce piątej, to już nie będzie miał dziesięciu poziomów, tylko 5. Więc na razie przyjmijmy to, co jest pewne."
**Decyzja (PYTANIE 7 = A):** `maksPoziom` ustawiony na REALNIE osiągalny (epoka 1→3, epoka 2→2, epoka 3→1). Nazwy poziomów zostają w danych (przydadzą się przy kolejnych epokach), UI pokazuje tylko osiągalne.
**DO PRZEMYŚLENIA, gdy dojdą epoki:** czy wracamy do modelu „awans co epokę" — wtedy `maksPoziom` każdego budynku trzeba podnieść o liczbę nowych epok, a wzrost `×1,10` na poziom prawdopodobnie przeskalować (dziś przez 3 epoki Stolarnia rośnie z 5 do 6,1 Pracy — praktycznie płasko).
**Kiedy ruszać:** razem z tematem awansów budynków wyżej — wyłącznie na sygnał Macieja. Do tego czasu temat jest zamknięty — nie proponować, nie „poprawiać przy okazji".
(Drobiazg kosmetyczny na potem: każdy tier deklaruje `maksPoziom: 10`, co UI pokazuje jako „Maks. poziom: 10" mimo że nieosiągalne. Niski priorytet, do sprzątnięcia przy okazji tamtej pracy.)


**Sesja 2026-07-20:**
- **Ludy Morza (SEA):** Q1=A pełne zastąpienie w Brązie · Q2=A oba typy naprzemiennie · Q3=A staty bez zmian · Q4=A wszystkie poziomy · Q5=C (Kultura=etykieta, poprawiona).
- **Wioski (WIO):** Q1=B rzadko (goodie-hut) · Q2=B nagroda przy wejściu · Q3=B proporcjonalnie do mapy · Q4=A pełne wykluczenia · Q5=B nagroda złoto/tech/jednostka · Q6=A fallback złoto w Żelazie.
- **TEST-Q1=B:** las+złoże na jednym heksie DOZWOLONE.
- **Wybrzeże (WYBRZEZE):** Q1=A ląd→WODA · Q2=A pas 2 heksy · Q3=A droga/fort precz, warzelnia soli→przybrzeżna. **COAST-Q4=A:** „% lądu" liczy tylko suchy ląd (mapy z większym lądem/wyspami).
- **Pasma (HILLS):** Q1=A seed-and-grow · Q2=A istniejący suwak · Q3=A rdzeń gór/obrzeże wzgórz.
- **Rzeki (RIVER):** Q1=A1 napraw u źródła · Q2=B1 nie ruszaj liczby rzek · Q3=C2 precyzyjne fałszywe wcięcia.
- **Handel (HANDEL):** Q1=B realne szlaki · Q2=A trasy automatyczne · Q3=C pełny zakres · Q4=B napraw Mennicę+surowce · Q5=A mnożnik po Walucie **2/1,5/1** · Q6=B połączenie po dystansie (bez drogi) · Q7=A wzór dystansowy (zostaje) · Q8=B obie strony + AI proaktywne/obniżony próg · Q9 = każdy budynek handlowy (Targowisko/Karawanseraj/Port/Port wielki) +1 trasa · Q10/Q11=B trasa daje dostęp do surowca + dochód, **+5% Handlu/trasę dodatkowo** · Q12=B per-city magazyn dla surowców logistycznych (drewno/kamień/glina/ruda), braz/żelazo/hodowla zostają civ-wide · **handel TYLKO zewnętrzny** (wewnętrzny odłożony) · dochód do skarbca czysto (pomija Wealth).
- **GLINA:** Q1=A 2/turę stała · Q2=A tylko glina teraz (ruda/brąz odłożone).
- **MENNICA-Q1=A:** Mennica zostaje jak jest (×4 easy zamierzone); Fenicjanie = osobny temat.

**Sesja 2026-07-21 (systemy strategiczne):**
- **Podwojenie:** miasta/klaster ×2 + cywilizacje ×2 z sufitem 15; Maleński=7 cyw (opcja B — 8 się nie mieściło).
- **Miasta-państwa:** aktywny rozwój, **te same zasady co gracz, ZERO bonusów/darmowych jednostek**, budują jednostki+budynki+ulepszenia, **nie zakładają nowych miast**, ograniczona dyplomacja.
- **Przejęcie stolicy:** stolica=najstarsze miasto, trwałe, przenieś (gracz+AI, nie gdy oblegana). Q1=A+przenieś · Q2=A cały skarbiec · Q3=A praca per-miasto zostaje + pula pracy cyw przepada · Q4: stolica→pieniądze+praca; ostatnie miasto=eliminacja→+nauka+brakujące techy+Power(zdobycze) · Q5=B pełne usunięcie cyw · jednostki NIE przejmowane (są kasowane) · **dwa osobne zdarzenia** (przejęcie stolicy vs ostatniego miasta).
- **Ulepszenia terenu przez AI:** `C-AI-ULEP-Q1=B` — buduje KAŻDE AI (nie tylko miasta-państwa); AI ma własną pulę Pracy.
- **Posiłki miast-państw:** bramkowane SOJUSZEM (`C-MP-SOJ-Q1/Q2/Q3`); pełna maszyneria dyplomacji (Q2=B); siła+łatwość sojuszu wg **TRUDNOŚCI gry** (nie osobna opcja); zakres = siostry tego samego klastra.
- **Dyplomacja miast-państw wg trudności:** `C-MP-DYPL-Q1=B` — start-zaufanie do gracza wg trudności (wariant B: easy+10/normal+5/hard0) + ożywiony `dyplomacjaAktywnosc`.
- **Deploy autonomiczny:** `C-ORG-Q17=A` — pod nieobecność właściciela deploy do ROBOCZA gdy VERIFY OK + „push" w kanale.
- **Hasła właściciela:** „sprawdź" = pull+czytaj kanał/handoff (bez dysku); „push" (do sesji lokalnej) = pull+sync na dysk właściciela. (CLAUDE.md §6.)

**Sesja 2026-07-24 (surowce/UI/miasta-państwa):**
- **Jednostki–surowiec (`R-JEDN-SUROWIEC`): A** — pełna konsumpcja `Surowiec (ilość)` z puli państwa, blokada przy niedoborze, parytet AI (jak budynki).
- **AI kupuje jednostki (`R-AI-KUP-JEDN`, AIRUSH): A** — parytet; progi w `econ-params.json`, strojalne (nie hardkod).
- **Cuda (`R-CUDA-TAB`): A** — usunąć samodzielny katalog Cuda; cuda w panelu Budowa w terenie (korekta 2026-07-28; nie w liście produkcji miasta), filtrowane per cywilizacja.
- **Autonomia (`AUTONOMIA`): A** — praca autonomiczna pod nieobecność właściciela, subagenci Sonnet 5 per temat, deploy do ROBOCZA po zielonych bramkach.
- **Magazyn (`R-MAGAZYN-500`):** baza 100→**500**; każdy Magazyn +100 addytywnie (cap = 500 + 100×liczba Magazynów).
- **HUD surowców (`R-HUD-SUROWCE`):** jeden chip „Surowce" w HUD (NIE lista wszystkich — z czasem będzie więcej surowców); pełny magazyn w osobnej zakładce; paski w mieście = ikonografika+liczba (przy rekrutacji tylko Brąz/Żelazo wg epoki).
- **Proaktywność/dyplomacja MP (`R-MP-DYPL-PROAKT`, flaga 3):** WSZYSTKIE ustawienia dyplomacji miast-państw (poza główną trudnością gry) pod osobny suwak „trudność miast-państw".
- **Handel surowcami z MP (`R-MP-HANDEL-SUROWCE`): A** — pełny parytet: gracz↔MP i AI↔MP, jednorazowo + cyklicznie, obie strony (AI↔MP gated na nadwyżkę).
- **Portret miast-państw (`R-MP-PORTRET`, `C-MP-Q1`): A** — miasta-państwa pokazują **symbol kultury** (civIconSvg), nie zdjęcie-portret władcy; gracz/główne AI bez zmian; etykieta „Miasto · Kultura · miasto-państwo". Potwierdzone podglądem (dyplomacja + bitwa).
- **MVP dotyk (`R-DOTYK-MVP`):** ODŁOŻONE („zajmiemy się później").

**Sesja 2026-07-27 (UI miasta / mapa / dyplomacja / Manpower):**
- **B-MP-Q1:** Q1a=B (% maxHP 25/20/15 wg trudności) · Q1b=A (częściowe leczenie przy braku pełnej puli MP) · Q1c=brak uzupełnienia HP w oblężonym mieście. Wdrożone FALA 31 `f694dcba`.

**Wcześniejsze (nadal obowiązują):**
- Wybrzeże jako pas — było 2 heksy (teraz jako WODA, §4 pkt 4). Kategoria kontr konnicy = „Mount". Kontra Procarz = podtyp „Slinger". Unikat Chin = „Jeździec chiński". „Zastąp" = całe terytorium, koszt tylko Pieniądz. Triari/Evocati = wymóg techu żelaza. Łańcuch żelaza = ogólna kopalnia na złożu + odlewnia żelaza.

---

## 10. ❓ OTWARTE PYTANIA / DO PLAYTESTU

- **Szlaki handlowe** — zagraj: zbuduj Karawanseraj/Port + pokój z sąsiadem → trasa (łuk na mapie + panel „Szlaki handlowe" + dochód/turę). Oceń dochód dystansowy (8/0,4/1 — placeholdery) i +5%/trasę.
- **Mapa** — obejrzyj wybrzeże=woda, pasma (łańcuchy), rzeki do morza; sprawdź bug rzeka↔mgła.
- **Mennica** — miasto z Mennicą+Walutą → +50% Skarbu z handlu (normal). Fenicjanie ×11,4 zamknięte jako nieaktualne (patrz wyżej) — do playtestu zostaje tylko ocena, czy realny szczyt ×5,79 (normal) jest OK.
- **Glina/ruda→brąz** — czy przebudować brąz na ilościowy, czy zostawić civ-wide.
- **Głód wojska / „Zastąp"** — wzrokowa weryfikacja (stare, nierozstrzygnięte).
- **Pary „Zastąp specjalnie"** — wypełnione 2, reszta czeka na przegląd kuratorski.

**Nowe po sesji 2026-07-21 (audio/grafika):**
- **Druga, niezależna tabela kontr** w `gra/src/battle/battleScene.ts` (kolumna `Bonus vs <Typ> %` per jednostka, osobna od `counters.json`). **Thorakites i Triari mają tam `Bonus vs Mount % = 0`, podczas gdy generyczny Włócznik ma 50.** Może być zamierzone (elita ≠ generyk), ale warto rzucić okiem przy balansie.
- **`categoryOf()`** (`gra/src/units/setup.ts`) klasyfikuje nowe jednostki żelaza jako `'domyslny'`. Na render NIE wpływa (dispatch idzie po nazwie — potwierdzone testem), ale może dotyczyć innych miejsc UI/logiki zależnych od kategorii.
- **Odgłosy natury — ten sam błąd, co naprawiony w muzyce:** wyciszenie w `ambiencePrefs` zapisuje się **trwale** (przechodzi na kolejne gry i do menu). W muzyce właściciel kazał to zmienić na ulotne (`C-AUD-Q5=A`); dla natury **nie zgłaszał**, więc zostało. Do wyrównania, jeśli zacznie przeszkadzać.
- **Szum morza/rzeki (`renderWoda`) czeka uśpiony** — właściciel: *„szum morza powinien pojawiać się dopiero, gdy na mapie zbliżamy się do morza"*. Wymaga dźwięku pozycyjnego (głośność zależna od ilości wody w kadrze). Generator gotowy, wystarczy go obudzić i wpiąć sterowanie.
- **Muzyka brązu/żelaza z plików** — właściciel zbiera utwory (`Downloads\muzyka braz\`). Brąz+ gra dziś **syntezą**; podmiana na pliki = ten sam mechanizm co kamień (`createPlaylist`), gdy zdecyduje.
- **Waga bundla** — 26,1 MB przy 192 kbps. Jeśli ładowanie zacznie doskwierać: eksport utworów w 96 kbps zdjąłby ~7 MB (właściciel musi wyeksportować sam, brak `ffmpeg`).

---

## 11. 🤖 CZY SESJA CHMUROWA/DESKTOP MOŻE PRACOWAĆ?

**Tak.** Drzewo czyste, wszystko zdeployowane. Zawsze: przed pracą `git status` + bramki (§7); po pracy bramki w tym samym stanie lub lepszym.

- ✅ **Bezpieczne samodzielnie:** kolejne etapy Handlu (E6/E3b — dotykają `game/*`, dyplomacji, AI), dostrojenie wartości ekonomii (`econ-params.json`), analiza/dokumentacja.
- ⚠️ **Ostrożnie:** duże zmiany generacji mapy (`gra/src/map/*`) — sprawdzaj determinizm `map-gen-regression-test` po każdej zmianie.
- ⛔ **Nie bez uzgodnienia:** deploy do ROBOCZA (loguj §2 pkt 6; sprawdź czy nikt nie pracuje równolegle), eksport paneli Excel, `npm run build`.

**Deploy z chmury/Linux:** krok „stamp" wymaga portu node'owego (§6 krok 2 — brak PowerShell). Na Windows `.ps1` działa normalnie.

**Jeśli coś jest niejasne lub dane wyglądają na sprzeczne — zapytaj właściciela, nie zgaduj.**
