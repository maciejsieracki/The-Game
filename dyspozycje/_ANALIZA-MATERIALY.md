# Analiza materialow -> najlepszy tryb pracy (subagenci: szybko + wspolpraca + tanio)
Cel finalny (po "OK skonczylem"): model pracy lane'ow, ktory godzi:
(1) szybkosc, (2) wspolprace miedzy subagentami, (3) niski koszt tokenow.
Notatnik roboczy mastera. Wnioski zbiorcze dopiero na sygnal Maciej.

## MATERIAL #1 — film "Master ALL 7 Levels of Claude Code Memory"
CO BIERZEMY (pasuje do nas):
- Progressive disclosure: laduj najpierw rzecz najwazniejsza (maly STAN), reszte
  tylko gdy trzeba. -> u nas: kazdy self-check (swiezy agent bez pamieci) czyta
  najpierw malutki <LANE>-STAN.md; pelny plik tylko gdy jest nowe zadanie.
- Decay: stare wpisy degraduj/archiwizuj. -> DO-MASTERA.md trzymac ostatnie ~10,
  reszta do archiwum; self-check nie czyta archiwum.
- Warstwy pamieci: tozsamosc/kontekst (staly naglowek lane), working memory
  (biezaca dyspozycja), episodic (DO-MASTERA = "dlaczego"), long-term (archiwum).
- "READ <plik>" w promptcie = deterministyczny zastrzyk (nasz odpowiednik hooka).
CO ODRZUCAMY (atomowka na bojke dla nas):
- wektorowe bazy (mem0), ChromaDB, semantyczny lookup, Obsidian. Mamy 10 sztywnych
  lane'ow z jasnym wlascicielem plikow -> markdown wystarcza.
KLUCZOWY REFRAME DLA NAS:
- Kazdy self-check to swiezy agent bez pamieci sesji -> jego caly mozg = pliki,
  ktore przeczyta na starcie. Czyli pamiec = workflow = koszt tokenow (jedno).
  Najwiekszy lewar kosztu: ile musi przeczytac przy zimnym starcie.
OGRANICZENIE:
- Brak dostepu do hookow CLI (session-start / pre-compact) w tym srodowisku.
  Ekwiwalent: prompt self-checka ("READ X") + auto-load MEMORY.md co sesje.
OTWARTE DO DECYZJI (na koniec):
- pilot tieringu na 1 lane (SILNIK/MIASTO) i pomiar; potem reszta.

## MATERIAL #2 — film "Master All 6 Claude Code Dynamic Workflows"
PO CO TO ISTNIEJE (diagnoza, ktora potwierdza nasz podzial na sesje):
- dlugie sesje psuja sie: agent laziness (robi 7 z 15), self-preference (chwali
  wlasna robote), goal drift (gubi pierwotny cel po kompaktacjach). Rozwiazanie:
  rozbic na agentow ze swiezym, osobnym kontekstem. <- to dokladnie czemu mamy
  10 lane'ow + master.
6 WZORCOW (i nasze zastosowanie):
1. Classify & act (recepcjonista/router): klasyfikuj zadanie -> kieruj do agenta.
   U nas = rola mastera + shadow-check (klasyfikuje pytanie taska, kieruje).
2. Fan-out & synthesize: rozbij na rownolegle pod-zadania -> barrier -> scal.
   Uzywalismy (remote agenci). Szybkie, ale drogie; tylko do duzych one-offow.
3. Adversarial verification: ODDZIELNY agent-sceptyk sprawdza wynik wg rubryki
   (nie ten sam, co tworzyl — bije self-preference). U nas = wlasciwy sposob na
   moj master-review DoD: osobny weryfikator vs lane audytujacy sam siebie.
   Wysoka wartosc, ale tylko do waznych deliverables (drogie).
4. Generate & filter (+ judge): nadprodukuj pomysly -> sedzia ocenia wg rubryki.
   Generator != sedzia. U nas: decyzje smakowe (nazwy, balans jednostek).
5. Tournament (pairwise, swiezy agent/mecz): ranking bez bloatu kontekstu.
   U nas: rankingi (super vs N legionistow, balans) — juz to robilismy recznie.
6. Loop until done (jak /goal): "nie koncz, az osiagniesz wynik". U nas: flaky
   bug, "buduj az vite przejdzie czysto", zielone testy.
META / KOSZTY (wazne dla naszego celu):
- Workflows sa TOKENOZERNE. Przewodnik wprost: uzywac OSZCZEDNIE, do duzych/
  zlozonych zadan; NIE do prostych (zmiana koloru przyciskow = zwykly prompt).
- Mozna zadac agentowi BUDZET tokenow.
- Workflow = plik JS + skill folder, mozna zapisac (/workflows) i wspoldzielic.
- Sila = STACKOWANIE: fan-out -> adversarial verify -> loop until done.
WNIOSEK ROBOCZY (do syntezy):
- Te wzorce = szybkosc + jakosc, ale drogie. Dla nas regula doboru: rutynowa
  praca lane = tani tryb plikowy (self-check godzinny); a fan-out/tournament/
  adversarial odpalac CELOWO tylko na duze decyzje/weryfikacje, z budzetem.
- Najlepszy kandydat do wdrozenia u nas: adversarial verification jako moj
  master-review (osobny weryfikator wg rubryki/DoD).

## MATERIAL #3 — "Dynamic Workflows Clearly Explained"
DRABINA ZLOZONOSCI/KOSZTU (w gore = wiecej mocy, ryzyka, $):
  glowna sesja -> skille -> sub-agenci -> agent teams -> workflows.
ROZNICE (wazne dla "wspolpracy subagentow"):
- Sub-agent: rownolegly, czysty kontekst, NIE gada z innymi — tylko raport do
  glownej sesji. (To = nasze remote agenty + self-checki.)
- AGENT TEAM: zaloga, ktora GADA ZE SOBA, wspolna lista zadan, wlasne konteksty
  — "grupowy czat / war room / rada / debata". Drogie. <- to jest najblizsze
  temu, o co pytasz: realna WSPOLPRACA miedzy lane'ami (a nie przez pliki).
- Workflow: Claude pisze skrypt JS, ktory odpala dziesiatki-setki sub-agentow
  pracujacych SAMOTNIE; wyniki scalane na koncu. Plan trzyma plik JS, nie sesja.
- /goal = GLEBIA (petla "az done==true", 1 agent wiele przebiegow, moze 24h+).
- Workflow = SZEROKOSC (50+ agentow rownolegle wg stalego planu, bez petli-kryt.).
KOSZT: 41 agentow Haiku -> 5 MLN tokenow input; 1 prompt = pol planu $200/mc, 30min.
  Kazdy agent = pelne wywolanie (wlasny system prompt+kontekst). Sub-agentow dawac
  na HAIKU. Ograniczac zakres, nazywac deliverable. Mostly input tokens.
HEURYSTYKA: "Czy to rozpada sie na wiele kawalkow dzialajacych niezaleznie naraz?"
  TAK -> workflow. Pojedyncze edycje/pytania/knowledge work -> NIE.
- Workflow zawsze pyta o zgode (nie odpali sie przypadkiem). /deep research =
  wbudowany workflow (rownolegly research, glosowanie na claimy, cytowany raport).

## MATERIAL #4 — "Dynamic Workflows for Beginners"
- Skala: 351 agentow naraz (pomysly na tytuly per transkrypcja). Tez NIE-kod
  (maile, tickety, audyty).
- Wywolanie: explicit "use a workflow for the following" (+ ultracode).
BEST PRACTICES (bierzemy do regul):
- NIE do prostych/jedno-sesyjnych (drogie). TAK do POWTARZALNEJ akcji na skale.
- ZAWSZE PILOT: "zacznij od malej partii (np. 2 itemy), zebym zweryfikowal
  workflow" przed pelnym biegiem. <- przyjmujemy jako twarda regule.
- Podaj FORMAT wyniku (raporty do folderu / PR-y / pliki .md).
- BEZ human-in-the-loop: workflow leci BEZ pytania o zgode w trakcie. Wszystko
  musi byc jasne z gory. Zle do zadan wymagajacych Twojej decyzji w srodku.
- KONTENCJA: 100 agentow edytujacych ten sam kod = konflikty. Rozwiazanie:
  branch/worktree per agent, potem merge. <- POTWIERDZA nasz model wlasnosci
  lane'ow + pomysl na izolacje (worktree) przy rownoleglej edycji tego samego
  pliku (nasz problem OneDrive single-file).
- Zapis: /workflows -> S -> nazwa -> .claude/workflows; rerun + share ("uzyj
  workflow OWASP-audit").

## WNIOSKI ROBOCZE NARASTAJACE (do finalnej syntezy)
- Mamy 4 narzedzia o roznym koszcie: sub-agent (tani, brak gadania) / agent team
  (drogi, gada) / workflow (b.drogi, szeroki batch) / /goal (gleboka petla).
- Dla nas regula doboru wg zadania:
  * rutyna lane = tani tryb plikowy (self-check godzinny) — bez zmian.
  * realna wspolpraca kilku lane'ow nad 1 problemem = rozwazyc AGENT TEAM
    ad-hoc (drogie, wiec krotko i celowo).
  * masowy batch (audyt wszystkich JSON/jednostek/165 taskow, sweep spojnosci)
    = WORKFLOW z budzetem + pilot 2 itemy + Haiku.
  * "dopchnij az czysto" (build/testy/balans) = /goal.
- Twarde reguly do przyjecia: pilot-malej-partii; budzet tokenow; izolacja
  (worktree) przy rownoleglej edycji; Haiku dla workerow.

## CEL KONCOWY (potwierdzony przez Maciej)
Po analizie + ustaleniu planu: zapisac wynik jako:
(1) SKILL wielokrotnego uzytku do KOLEJNYCH projektow, oraz
(2) ogolny REGULAMIN "jak wszystkie subagenty maja dzialac w tym projekcie"
    (operating spec lane'ow: kanaly, self-checki, reguly doboru trybu,
     budzety tokenow, pilot, izolacja, raportowanie).

## MATERIAL #5 — "Multi-agentowe kodowanie: Subagents, Worktrees, Agent Teams, Ralph"
(4 techniki na osi: KONTROLA <-> AUTONOMIA; swiadomie dobierac, nie wszystko naraz)
KONTEKST "smart/dump zones": jakosc modelu spada gdy okno sie zapelnia. Nie zapychaj
  dobrej czesci researchem — offloaduj do subagentow. <- potwierdza: master ma byc
  CHUDY (delegowac, nie wciagac wszystkiego do swojego okna).

1. SUBAGENCI: glowny agent spawnuje, wlasne okno, praca w izolacji, do glownego
   wraca TYLKO wynik. Super do researchu / zadan bez interakcji. HACZYK: subagenci
   NIE widza siebie -> dwoch edytujacych ten sam plik = clobber. (Nasz dokladny
   problem kolizji lane'ow -> stad sztywna wlasnosc plikow.) Robia 1 problem naraz.

2. GIT WORKTREES: praca w 1 repo na osobnych branchach, nawet te same pliki, bez
   konfliktow na dysku. To ODPOWIEDZ na nasz problem OneDrive single-file: gdy 2
   agentow musi ruszyc ten sam plik -> osobne worktree, potem merge. (Agent tool
   ma isolation:"worktree".) Koszt: konfiguracja (paczki, sekrety, wiele instancji
   serwera). CZYNNIK LUDZKI: ile watkow naprawde ogarniesz — wiecej != lepiej.

3. AGENT TEAMS: Team Lead spawnuje teammate'ow, ktorzy SIE KOMUNIKUJA, wspolna
   lista taskow, kazdy wlasne okno, mozna z nimi gadac. Najlepsze gdy: zderzyc
   KILKA PERSPEKTYW albo sztywne scope. Przyklad: code review — security/wydajnosc/
   testy -> konfrontuja znaleziska -> synteza. Koszt: 3 agenci x 1h = masa tokenow.
   Wciaz EKSPERYMENTALNE — "obietnica na przyszlosc", nie pewne narzedzie na dzis.
   <- to jest ta "wspolpraca subagentow", o ktora pytasz; uzywac celowo i krotko.

4. RALPH LOOP: skrypt odpala agenta w PETLI; agent czyta liste zadan + plik
   postepu, bierze taska (maly, miesci sie w 1 oknie), implementuje, AKTUALIZUJE
   oba pliki, potem SWIEZY agent bierze kolejny. MAX iteracji = bezpiecznik.
   Plus: dziala gdy Ciebie nie ma. Minus: wymaga szczegolowej specyfikacji, zre
   tokeny, trzeba zadbac o bezpieczenstwo/orkiestracje. /goal dziala podobnie.
   <<< KLUCZOWE: MY JUZ ZBUDOWALISMY RALPH LOOP. Self-check = swiezy agent +
   <LANE>.md (lista zadan) + DO-MASTERA/STAN (plik postepu) + bierze taska +
   aktualizuje. Brakuje nam tylko: jawnego MAX-iteracji/bezpiecznika i malych,
   1-oknowych taskow. To dostrajamy w finalnym modelu.

## WNIOSKI ROBOCZE — uzupelnienie
- Mamy juz: Ralph loop (self-checki) + subagentow (remote). Doborowo brakuje:
  worktree przy kolizjach na 1 pliku, agent-team do zderzania perspektyw,
  bezpiecznik max-iteracji.
- Mapowanie "control<->autonomia" na nasze zadania bedzie rdzeniem finalnego modelu.
