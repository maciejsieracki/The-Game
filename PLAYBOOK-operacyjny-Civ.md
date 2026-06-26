# PLAYBOOK OPERACYJNY — The Game (Civ) / Multi-agent
*Wersja 1.0 | 2026-06-24 | Język: polski | Zalążek przyszłego skilla*

---

## 1. FILOZOFIA: OŚ KONTROLA ↔ AUTONOMIA

Projekt Civ działa na osi „świadomy dobór narzędzia do zadania". Po lewej stronie osi jest pełna kontrola (Maciej zatwierdza każdy krok), po prawej — pełna autonomia (agent sam zamyka cel). Nikt nie siedzi domyślnie po jednej stronie: wybór trybu zależy **wyłącznie od rodzaju zadania**, nie od nastroju chwili.

Dwa kluczowe reframe:
- **Pamięć = workflow = koszt tokenów.** Każdy self-check (świeży agent bez historii sesji) ma jako „mózg" tylko pliki, które przeczyta na starcie. Ile musi przeczytać przy zimnym starcie — tyle kosztuje.
- **Master ma być chudy.** Master deleguje i koordynuje; nie wciąga wszystkiego do swojego okna kontekstu. Im mniej master czyta przy każdym shadow-checku, tym taniej.

---

## 2. REGUŁA DOBORU TRYBU

| Typ zadania | Narzędzie | Dlaczego | Koszt |
|---|---|---|---|
| Rutynowa praca lane (kod, JSON, analiza pliku) | **Plikowy Ralph loop** — self-check co godzinę | Świeży agent czyta tylko swój `<LANE>.md` (~12–30 linii) + opcjonalnie `<LANE>-STAN.md`; zero gadania, zero koordynacji | Najniższy — 1 zimny start/godz., wąski kontekst |
| Research, kilka niezależnych zagadnień równolegle | **Sub-agenci Haiku** | Każdy w izolacji, żaden nie widzi drugiego, raport wraca do mastera; idealny do eksploracji bez ryzyka kolizji | Niski — Haiku = 20× tańszy od Sonnet |
| Zderzanie perspektyw, code review, decyzja sporna | **Agent Team** (celowo, krótko) | Kilku agentów **gadam ze sobą** i konfrontuje znaleziska (np. security vs. wydajność vs. testy); wciąż eksperymentalne | Drogi — 3 agenci × kontekst × czas; używać RZADKO i KRÓTKO |
| Masowy batch: audyt wszystkich JSON, sweep spójności 165 tasków | **Dynamic Workflow** (JS-skrypt) | Plan trzyma plik JS, nie sesja; działa bez człowieka w pętli; Haiku jako workery | Bardzo drogi — zawsze PILOT 2 itemów przed pełnym biegiem + budżet tokenów |
| „Dopchnij, aż czysto" (build/testy/balans) | **/goal** (pętla until done) | Agent sam zapętla się, aż warunek sukcesu jest spełniony; max-iteracji jako bezpiecznik | Średni/drogi — zależy od głębokości pętli |
| Dwie lane'y edytują TEN SAM plik | **Worktree isolation** | Każdy agent pracuje na osobnym branchu; merge po zakończeniu; eliminuje kolizje i dehydrację OneDrive | Koszt konfiguracji jednorazowy; eliminuje drogi manual-merge |

### Szybka heurystyka decyzyjna

```
Czy praca mieści się w 1 oknie kontekstu i należy do 1 lane?
  TAK → Ralph loop (self-check godzinny)
  NIE → Czy rozpada się na kawałki działające niezależnie?
    TAK → Workflow (batch) lub Sub-agenci (research)
    NIE → Czy trzeba zderzać perspektywy kilku ekspertów?
      TAK → Agent Team (krótko)
      NIE → Czy to pętla „aż czysto"?
        TAK → /goal
        NIE → Standardowy prompt (najtaniej)
```

---

## 3. ZASADY KOSZTU TOKENÓW

### 3.1 Główny lewar: zimne starty, nie ilość tekstu

Koszt = **liczba zimnych startów agenta × objętość kontekstu każdego startu.**
Tekst per se jest tani. Drogi jest każdy nowy agent, który musi załadować cały kontekst od zera.

Konsekwencje:
- **Event-driven > polling.** Zamiast shadow-checku co 1 min — co 10 min (master) i co godzinę (lane). Zmiana z co-10-min na co-godzinę na 6 lane'ach = ~6× mniej zimnych startów.
- **Haiku dla workerów.** Sub-agenci wykonujący rutynowe taski (JSON-audit, sweep) startują na Haiku, nie na Sonnet/Opus.
- **Budżet tokenów.** Przy każdym workflowie i batch'u podać agentowi limit tokenów eksplicytnie (`max_tokens: N`); bez tego pętle nie mają hamulca.

### 3.2 Progressive disclosure — trójwarstwowy kontekst lane'a

Zamiast czytać cały `<LANE>.md` przy każdym self-checku, warstwuj:

| Warstwa | Plik | Kiedy self-check czyta | Zawartość | Docelowy rozmiar |
|---|---|---|---|---|
| **STAN** | `<LANE>-STAN.md` | ZAWSZE (na starcie) | Obecny krok, status (BLOK/OK/CZEKA), ostatnie 2 zdarzenia | ≤ 12 linii |
| **Dyspozycja** | `<LANE>.md` | Gdy STAN sygnalizuje nowe zadanie | Pełny plan lane'a, reguły, ścieżki plików | ~60–100 linii |
| **Historia** | `<LANE>-DO-MASTERA.md` | Tylko na żądanie mastera lub przy eskalacji | Pełny log Q&A, raporty | rosnący → decay |

**Dziś:** pliki `<LANE>-STAN.md` jeszcze nie istnieją — to punkt wdrożenia numer 1 (patrz sekcja 7).

### 3.3 Decay logów DO-MASTERA

Reguła: `<LANE>-DO-MASTERA.md` trzyma **ostatnie ~10 wpisów** widocznych na górze. Starsze wpisów (> 2 tygodnie lub > 20 wpisów) przesuwa się do `<LANE>-DO-MASTERA-arch.md`. Self-check **nigdy nie czyta archiwum** — tylko bieżący plik.

Kto archiwizuje: master (shadow-check) robi decay przy regularnym przeglądzie, nie lane.

---

## 4. ARCHITEKTURA KOMUNIKACJI (jak to działa TERAZ)

```
Maciej
  └── Master (shadow-check co 10 min, chudy)
        ├── pisze: dyspozycje/<LANE>.md     [master → lane]
        └── czyta: dyspozycje/<LANE>-DO-MASTERA.md  [lane → master]
              + DZIENNIK-MASTERA.md  [log zbiorczy dla Maciej]

Lane (self-check co godzinę):
  1. Czyta swój <LANE>.md (dyspozycja)
  2. Wykonuje najnowszy krok
  3. Dopisuje raport do <LANE>-DO-MASTERA.md (append-only, NIE kasuje)
  4. To samo w czacie (transparentność dla Maciej)
  5. Czyta plik od nowa → jeśli kolejny krok → bierze od razu (łańcuch)
  6. Zatrzymuje się TYLKO przy blokadzie lub wyczerpaniu planu

Handoff między lane'ami:
  Przez _handoff/<NADAWCA>-do-<ODBIORCA>_<temat>.md
  NIGDY bezpośrednia edycja cudzego lane'a
```

### Własność plików (twarda reguła)

| Lane | Pliki kodu (wyłączne) | Uwaga |
|---|---|---|
| SILNIK | `src/main.ts`, `Gra-podglad.html` | JEDYNY publisher kanonu |
| EKONOMIA | `economy.ts`, `turn-economy.ts`, `upkeep.ts` | |
| MIASTO | `cities.ts`, `production.ts`, `order.ts`, `culture-religion.ts` | |
| UNITS | `units.ts`, `battle/` (wewnętrzne) | |
| UI | `src/ui/` | |
| DANE | `src/data/`, JSON-y, Excele → JSON export | |
| AI | `ai.ts` | |
| DYPLOMACJA | `diplomacy.ts` | |
| MAPA | `map.ts`, generator mapy | |
| MASTER | `dyspozycje/*.md`, DZIENNIK | Żaden lane nie pisze do cudzego `.md` |

---

## 5. ZASADY AUTONOMII I RAPORTOWANIA

### WDRAŻANIE DYSPOZYCJI
To, co master wpisze do `<LANE>.md` → wdraż od razu, bez pytania. Pytaj tylko gdy: brak danych do decyzji, blokada techniczna, lub master wprost prosi o potwierdzenie.

### RAPORTOWANIE WĄTKU
Gdy zadasz pytanie i master odpowie — zaraportuj **trzy rzeczy** (w czacie i w `<LANE>-DO-MASTERA.md`):
1. Jakie pytanie zadałeś
2. Co master odpowiedział
3. Jaką metodę/decyzję przyjąłeś

Maciej musi zawsze widzieć pełny wątek.

### KANAŁ PYTAŃ
Pytania ZAWSZE zwykłym tekstem w czacie + wpis do `<LANE>-DO-MASTERA.md`. **Nigdy** `AskUserQuestion` ani popup.

---

## 6. BEZPIECZNIKI

### 6.1 Max-iteracji w pętlach
Każda pętla agenta (Ralph loop, /goal, workflow) musi mieć jawny bezpiecznik maksymalnej liczby iteracji. Domyślne wartości:
- Self-check godzinny: max 8 kroków per uruchomienie (potem zatrzymaj i raportuj)
- /goal: max 20 iteracji, potem eskalacja do mastera
- Workflow batch: max 50 sub-agentów per bieg; zacznij od pilota 2 itemów

### 6.2 Pilot przed pełnym biegiem
**Twarda reguła:** każdy workflow i każdy batch NIE startuje od razu na pełnej skali. Najpierw:
1. Pilot 2 itemów → weryfikacja przez Maciej lub mastera
2. Dopiero po OK → pełny bieg

### 6.3 Izolacja worktree przy kolizjach
Gdy 2 lub więcej lane'ów musi ruszyć ten sam plik równolegle:
- Użyj `isolation: "worktree"` w Agent tool
- Każdy agent na osobnym branchu
- Merge po zakończeniu (master lub SILNIK w przypadku `main.ts`)

To jest odpowiedź na problem dehydracji OneDrive + clobber przy równoległej edycji.

### 6.4 Build zawsze przez /tmp
`npx vite build --outDir /tmp/civ-dist` (NIE `npm run build`, NIE `npx vite build` bez outDir — OneDrive blokuje `dist/`). Kanon publikuje **tylko SILNIK**, zawsze po przejściu testów smoke + battle-smoke + logic + combat.

### 6.5 Reguła eksportu JSON
Zmiany parametrów → Excel (panel Maciej) → targeted export TYLKO tego JSON-a (celowany skrypt na 1 arkusz). NIGDY `export-data.py` ani `npm run build` (regenerują wszystkie JSON-y → kasują cudzą pracę).

---

## 7. WSPÓŁPRACA MIĘDZY LANE'AMI

### Kiedy przez pliki (standard)
Większość handoffów: MIASTO pisze kontrakt do `_handoff/MIASTO-do-UI_kontrakt-produkcji.md`, SILNIK pobiera i wpina. Master koordynuje kolejność. Zero bezpośredniego gadania agentów.

Wzorzec handoff:
```
_handoff/<NADAWCA>-do-<ODBIORCA>_<temat>.md
  - Co przesyłam (API, typy, kontrakt)
  - Co Odbiorca ma z tym zrobić
  - Kiedy handoff jest gotowy (flaga: GOTOWE/CZEKA)
```

### Kiedy Agent Team (wyjątek)
Użyj Agent Team **tylko** gdy zadanie wymaga realnego zderzenia perspektyw w czasie rzeczywistym:
- Code review z kilku kątów (security + wydajność + testy jednocześnie)
- Decyzja projektowa z konfliktującymi trade-offami (np. balans units: szybkość vs. koszt vs. moc)
- Wykrycie niespójności między 2–3 lane'ami (np. EKONOMIA vs. MIASTO vs. SILNIK mają sprzeczne założenia)

Reguły Agent Team:
- Krótko (< 30 min sesji)
- Max 3 agentów naraz (koszt rośnie kwadratowo)
- Wynik → syntetyczny wpis do DZIENNIKA-MASTERA
- Nie używaj do rutynowych zleceń (to zwykły sub-agent)

### Kiedy Adversarial Verification (osobny weryfikator)
Dla ważnych deliverables (nowy kanon Gra-podglad.html, nowa wersja mechaniki walki):
- ODDZIELNY agent-sceptyk sprawdza wynik wg rubryki/DoD
- NIE ten sam, co tworzył (bije self-preference)
- Rubryka: lista checkboxów (testy przeszły / brak regresji / zachowane reguły lane)

---

## 8. SPECYFIKA ŚRODOWISKA (zagrożenia znane)

### OneDrive + dehydracja
OneDrive potrafi w sandbox-mount pokazywać ucięte pliki (plik cały w chmurze, mount zamrożony). Objawy: `Unexpected end of file`, plik ma N linii zamiast M.

Zasady obrony:
- Przed każdym buildem: `Read` (hydracja) → wait 3–5 s → retry
- Jeśli 3 próby nie pomagają → **nie rekonstruuj ręcznie** → zgłoś blokadę masterowi
- Długofalowo: folder `gra/` → „Always keep on this device" (zielony ptaszek w OneDrive)
- Build i testy zawsze przez `/tmp` (nie przez folder OneDrive)

### Self-checki a kolejkowanie
6 self-checków co 10 min = 7 zadań w kolejce → opóźnienia + wyższy koszt. Rozwiązanie przyjęte: self-checki co godzinę, rozłożone w godzinie (np. min 13, 25, 34, 42, 48, 55). Nie zmieniać bez decyzji mastera.

### Kolizja append na DO-MASTERA
`<LANE>-DO-MASTERA.md` jest append-only. Dwa agenty mogą pisać jednocześnie (rzadkie, bo lane mają osobne pliki). Przy wątpliwości: pisz z timestampem ISO na każdym wpisie.

---

## 9. PRZEPŁYW DECYZJI: KROK PO KROKU (self-check lane'a)

```
[START — co godzinę]
  1. Wczytaj <LANE>-STAN.md (12 linii) — czy jest coś nowego?
     NIE → zapisz „brak zmian" + exit (1 zimny start, minimalne tokeny)
     TAK → wczytaj pełny <LANE>.md
  2. Znajdź najnowszą sekcję START / DO ZROBIENIA TERAZ / ODPOWIEDZ MASTERA
  3. Wdroż krok (bez pytania)
  4. Dopisz raport do <LANE>-DO-MASTERA.md (timestamp + treść)
  5. To samo w czacie
  6. Wczytaj <LANE>.md od nowa → kolejny krok? → idź do 3
  7. Brak kolejnego kroku → zaktualizuj <LANE>-STAN.md → exit
  BLOKADA w kroku 3 → raport + wpisz stan BLOK do <LANE>-STAN.md → exit
```

---

## 10. CO WDROŻYĆ NASTĘPNIE (mapa priorytetów)

| Priorytet | Co | Gdzie | Efekt |
|---|---|---|---|
| 1 (wysoki) | Warstwa `<LANE>-STAN.md` (12 linii) dla każdego lane | `dyspozycje/` | Self-check czyta ~12 linii gdy nic nowego → ~80% tańszy polling |
| 2 (wysoki) | Jawny `MAX_ITER` w każdym self-checku | Prompt self-checka | Eliminuje nieskończone pętle |
| 3 (średni) | Decay logów `<LANE>-DO-MASTERA.md` (ostatnie 10 wpisów widoczne, reszta do arch.) | Master shadow-check | Zapobiega rosnącemu kontekstowi |
| 4 (średni) | Self-checki dla DYPLOMACJA, AI, MAPA (teraz brak) | Scheduled tasks | Pełne pokrycie lane'ów |
| 5 (niski) | Adversarial verification dla każdego nowego kanonu (osobny agent-sceptyk wg rubryki) | Przy każdym SILNIK→publish | Eliminuje self-preference w code review |
| 6 (niski) | Workflow template dla batch-auditów (audyt JSON, sweep 165 tasków) | `/workflows` + pilot | Powtarzalne, tanie batch'e na żądanie |

---

## ZAŁĄCZNIK: Szybka ściąga dla Maciej

```
CHCĘ:                              → UŻYJ:
─────────────────────────────────────────────────
Rutynowy krok w kodzie             → self-check (godzinny, tani)
Kilka zagadnień naraz bez zależności → Sub-agenci Haiku (tanie, równoległe)
Code review / decyzja sporna       → Agent Team (drogi, krótko, celowo)
Audyt 100+ elementów               → Workflow + pilot 2 + Haiku
„Buduj aż przejdą testy"           → /goal + max-iter
2 lane'y, 1 plik                   → Worktree isolation
Pytanie lane → master              → czat + <LANE>-DO-MASTERA.md (tekst, nie popup)
Wynik lane → SILNIK → kanon        → _handoff/<NADAWCA>-do-SILNIK_<temat>.md
```


## 11. BEZPIECZNIKI ITERACJI (twarde limity — chronia tokeny)
Kazda petla MA twardy limit. Po przekroczeniu: STOP + zglos blokade do mastera (nie miel dalej).
- Loop-until-done (build/testy „az zielone"): **MAX 3 przebiegi**. Po 3 nieudanych -> STOP + raport blokady.
- Verify-loop (worker -> sedzia -> poprawka): **MAX 2 cykle poprawek** (3 wersje workera). Potem STOP + eskalacja.
- Fan-out (rownolegle subagenty): ZAWSZE **pilot 2 itemy** najpierw; potem **MAX 10 rownoleglych**. Subagent = 1 przebieg, bez wlasnych petli.
- Twardy bezpiecznik na ZADANIE: **MAX 12 wywolan subagentow** na jedno zadanie bez zgody mastera. Powyzej -> STOP + pytaj.
- Tournament: **MAX 6 rund**.
- Subagenty robocze na HAIKU (chyba ze master wskaze inaczej).

## 12. WSPOLPRACA I PRZEKAZYWANIE PLIKOW
- Kanal master<->dzial: dyspozycje/<LANE>.md (master->dzial) + <LANE>-DO-MASTERA.md (dzial->master, APPEND-ONLY, nigdy nie nadpisuj).
- Dzial<->dzial: NIGDY bezposrednio. Przekazujesz przez handoff: dyspozycje/_handoff/<OD>-do-<DO>_<temat>.md + meldunek masterowi w <LANE>-DO-MASTERA.md. Master decyduje o wpieciu.
- Wlasnosc plikow = twarda: edytujesz TYLKO pliki swojego dzialu. Cudzy plik -> handoff + master.
- Dane wspoldzielone (czyta >1 dzial) = definiowane RAZ w warstwie danych (DANE/JSON), reszta CZYTA. Nie duplikuj (Respekt, Profil AI cyw.).
- Integracja do silnika/kanonu = WYLACZNIE master. Dzial dostarcza modul + handoff z instrukcja wpiecia + DoD.
- Kolizja 2 agentow na 1 pliku -> worktree isolation, potem merge.
- Pytania do mastera: w tresci czatu + dopis do <LANE>-DO-MASTERA.md (NIGDY popup/AskUserQuestion).

## 13. 6 TECHNIK — KIEDY DZIAL MOZE UZYC
| Technika | Kiedy | Limit |
|---|---|---|
| classify & act | NIE dzial — to master (routing) | — |
| fan-out & synthesize | masz >1 niezalezny kawalek (audyt wielu plikow) | pilot 2 -> max 10, Haiku |
| adversarial verification (sedzia) | deliverable wysokiej stawki: do silnika/kanonu lub cross-lane | max 2 cykle |
| generate & filter | decyzje smakowe (nazwy, warianty); generator != sedzia | — |
| tournament | rankingi/balans (starcia jednostek, warianty parametrow) | max 6 rund |
| loop until done | „dopchnij az zielone" (build/testy) | max 3 przebiegi |

Domyslnie rutyna = BEZ technik (zwykle wykonanie + wlasne testy). Techniki = do wiekszych/spornych zadan, z budzetem.

## 14. SAMOWERYFIKACJA (sedzia) — ZAKRES
- TYLKO wysoka stawka: deliverable wpinany do silnika/kanonu ORAZ zmiana cross-lane -> osobny SWIEZY agent-sedzia sprawdza wg jawnego DoD ZANIM zostanie przyjete.
- Rutyna w obrebie dzialu -> wystarcza obiektywne testy wlasne (build/tsc/unit), bez sedziego.
- Sedzia != tworca. Wynik: PASS albo lista konkretnych usterek -> poprawka (max 2 cykle) -> STOP/eskalacja.
- Bramke do kanonu trzyma master.


## 15. ZASADA BACKUPU (rolling — 1 backup = ostatnia ZIELONA wersja)
Przed KAZDA zmiana pliku: NAJPIERW backup pliku, ktory zmieniasz, POTEM edytuj.
- `cp <plik> <plik>.bak-<DZIAL>` — backup = OSTATNIA ZIELONA wersja (przeszla testy + sedzia OK).
- Pracujesz na pliku roboczym; backup zostaje nietkniety jako punkt przywrocenia.
- Raportuj „zrobione" DOPIERO gdy: testy ZIELONE **I** sedzia OK (przy wysokiej stawce). Backup zawsze zostaje.
- Nastepny cykl: backup NADPISUJESZ swiezym (z aktualnej dobrej wersji); nowe zmiany ida ZAWSZE do pliku roboczego — **NIGDY** nie pisz nowych zmian do backupu.
- Cos padnie: `cp <plik>.bak-<DZIAL> <plik>` (revert do ostatniej dobrej) + zdiagnozuj roznice.
- Trzymamy **1 rolling backup per plik** (ostatnia dobra) — zeby nie mnozyc plikow. Wyjatek: kanon (`Gra-podglad.html`) ma datowane lifeline-backupy w `gra/_backup/` i ich NIE nadpisujemy.


## 14a. SEDZIA — DOPRECYZOWANIE (Maciej 2026-06-24)
Bramka sedziego jest U MASTERA i obejmuje DWA przypadki:
1. KAZDY deliverable dostarczony masterowi przez dzial (modul, plik, zadanie zakonczone) -> master odpala sedziego (osobny SWIEZY agent wg jawnego DoD) ZANIM zaraportuje Maciej i ZANIM wpnie/wdrozy.
2. WLASNE decyzje i dzialania mastera (integracja, wpiecia, zmiany silnika, publikacja kanonu) -> tez przez sedziego.
Zasada: nic nie trafia do Maciej ani do kanonu bez przejscia przez sedziego. Rutyna WEWNATRZ dzialu (przed dostarczeniem) = wlasne testy dzialu; sedzia wchodzi na BRAMCE mastera.


## 12a. KANAL PYTAN (korekta 2026-06-24)
Pytania DZIALU ida do MACIEJ w oknie tego dzialu (nie do mastera). Master nie rozstrzyga pytan projektowych dzialow.
Tylko gdy Maciej sam nie zna odpowiedzi, przekazuje pytanie masterowi (lub miedzy dzialami przez mastera).
Do mastera od dzialu ida: raporty statusu + handoffy gotowych modulow do wpiecia. Master = integracja + sedzia + kanon.


## 12b. ROUTING — GDZIE CO (definicja)
- PYTANIA dzialu -> MACIEJ w oknie dzialu (czat). Nie do mastera.
- RAPORT ZMIAN/postepu -> MACIEJ w oknie dzialu (czat).
- GOTOWE DO WPIECIA (handoff) -> MASTER: dyspozycje/_handoff/<DZIAL>-do-MASTER_<temat>.md + wpis w <LANE>-DO-MASTERA.md (tylko handoffy + status, nie pytania).
Master = integracja + sedzia + kanon.


## 12c. PROTOKOL ZAKLADKI (trigger + routing)
TRIGGER: Maciej pisze "SPRAWDZ" / "przeczytaj dyspozycje" -> dzial czyta swoj <LANE>.md (nowe zadania + zmiany priorytetow) i dziala. Brak auto-petli.
ROUTING: pytania wlasne/rozwojowe -> Maciej (w oknie); skierowanie do innej zakladki -> przez MASTER (handoff); gotowe do wpiecia/integracja -> MASTER. Master = przepinanie + spinanie w silnik + sedzia + kanon.


## 12-ROUTING (FINAL — zastepuje 12,12a,12b,12c)
Trzy tory pytan/komunikacji dzialu:
1. OGOLNE / PROJEKTOWE / DECYZJE -> MACIEJ (w oknie dzialu).
2. DO INNEGO DZIALU -> przez MASTERA (handoff); master rozdysponowuje.
3. SPIECIE / INTEGRACJA SILNIKA -> MASTER (handoff + DO-MASTERA); master wpina + sedzia + kanon + rozdziela dalej.
Raport postepu -> Maciej. Trigger re-czytania: "SPRAWDZ".
Master = router miedzy dzialami + silnik + sedzia + kanon; nie rozstrzyga pytan projektowych.


## 16. TRYB MODELU
Dzialy = SONNET (domyslnie). Eskalacja "POTRZEBNY OPUS do <co>" tylko gdy Sonnet nie daje rady; Maciej przelacza okno recznie.
Master = Opus (strategia/routing/werdykty); ciezka robota i tak idzie tanimi Sonnet-subagentami.


## 16a. TRYB WYKONANIA (gdy okna nie da sie przelaczyc na Sonnet)
Dzial deleguje KAZDA istotna prace do SUBAGENTA na Sonnecie (Agent model:"sonnet"). Sesja-dzial = chuda (brief + odbior + raport). Drobiazgi inline. Eskalacja "POTRZEBNY OPUS do <co>" gdy Sonnet nie daje rady. Master juz tak robi (plastry integracji = Sonnet-subagenci).

## 17. PROTOKOL DECYZJI: MASTER SUGERUJE -> MACIEJ POTWIERDZA (ABC)
Dzialy nie maja big picture i dzialaja bez kontekstu (minus rozbicia na taski). Big picture trzyma MASTER (REJESTR PRZEPLYWOW) + Maciej.
Gdy master ma temat (komu oddac zadanie / jak zrouterowac / co zrobic cross-lane) -> NIE decyduje sam. PROPONUJE Maciejowi z wlasna rekomendacja, ZAWSZE w formacie ABC. Maciej potwierdza/koryguje. Dopiero potem master rozsyla POTWIERDZONE dyspozycje do dzialow z pelnym kontekstem.
Najpierw zrozum model gry, potem proponuj (nie wymyslaj rozwiazania bez kontekstu — patrz blad "nauka -> EKONOMIA" zamiast "nauka = MIASTO").
WYJATEK: czysto inzynierskie wpiecie JUZ zatwierdzonego modulu (build/test/kanon) — to robi master bez pytania.

## 17a. ROZSZERZENIE (Maciej 2026-06-25): KAZDA decyzja przez ABC -> akceptacja -> dopiero do dzialow
Dotyczy KAZDEJ decyzji mastera, nie tylko routingu: design, zalozenia, wartosci, kto-co-robi, jak cos zrobic.
SEKWENCJA: master proponuje ABC (z rekomendacja) -> Maciej AKCEPTUJE/koryguje -> DOPIERO WTEDY master rozsyla do dzialow.
ZADNA decyzja nie idzie do zakladki przed akceptacja Macieja. Powod: master czasem sie myli; ABC = bramka, ktora to lapie.
(Nadal wyjatek: czysto inzynierskie WPIECIE juz zatwierdzonego modulu = execution, nie decyzja.)
