---
name: autobots
description: >-
  Uniwersalny szkielet procesu AutoBot: routing ról Operator → Evaluator →
  Final Control → integracja → READY_FOR_DEPLOY → osobna bramka deploy/push,
  dyscyplina ABC/ECHO, GOAL + allowlista + izolacja + plan testów, watchdog i
  kontrakt raportu. Bez konkretów jednego projektu — używaj jako punkt startowy
  przy rozpoczęciu pracy, przejęciu tematu, dispatchu subagentów, kontroli
  statusu lub przygotowaniu integracji; konkretne wiązania (ścieżki, modele,
  bariery) trzymaj w towarzyszącym skillu specyficznym dla projektu.
---

# Autobots — uniwersalny szkielet procesu

Ten skill opisuje METODOLOGIĘ procesu AutoBot niezależnie od konkretnego
projektu: role, pętlę, dyscyplinę decyzyjną, watchdog i kontrakt raportu.
Nie zawiera nazw plików, katalogów ani modeli żadnego konkretnego repo —
ma być kopiowalny 1:1 do dowolnego projektu programistycznego.

## 1. Zasada nadrzędna

Każdy temat ma jeden pełny identyfikator, jeden jawny `GOAL`, mierzalne
kryteria końca, allowlistę plików, izolację (osobny worktree/branch/sandbox)
i plan testów.

Cel procesu to **READY_FOR_DEPLOY**: faktycznie sprawdzona i zintegrowana
zmiana, gotowa do oddania dalej. Sam raport, `PASS`, branch, worktree, commit
albo widoczny status subagenta nie oznacza zakończenia. Po `READY_FOR_DEPLOY`
deploy/push pozostaje **osobną bramką** i wymaga wyraźnego polecenia właściciela.

## 2. Start nowej sesji

Zanim zaczniesz analizę, dispatch albo edycję, przeczytaj punkt startowy
projektu — jego odpowiednik `README.md`/`CLAUDE.md`/`AGENTS.md` lub inny
dokument, który sam projekt wskazuje jako źródło prawdy dla procesu. Ten
dokument opisuje własną, właściwą sobie kolejność czytania (mapę źródeł,
normę procesu, bieżący handoff, rejestr tematów). Nie zaczynaj od starego
handoffu, płaskiego logu, samego czatu ani archiwum procesu — to historia,
nie aktywny routing.

Jeżeli projekt ma osobny dokument opisujący, jak bezpiecznie zmieniać sam
mechanizm AutoBota (a nie kod produktu) — przeczytaj go najpierw, gdy to
właśnie robisz.

Po starcie zamelduj krótko: jakie źródła przeczytałeś, jaki jest bieżący
stan, jakie tematy są aktywne i czy istnieje blokada.

## 3. Narzędzie orkiestracji wieloagentowej — używaj, gdy dostępne

Jeśli masz dostęp do narzędzia agentic workflow pozwalającego przypisać
model/effort per rolę (`pipeline()`/`parallel()` lub odpowiednik) **i**
właściciel dał jawną, opt-in zgodę na multi-agent orchestration w tej sesji —
używaj go do dispatchu Operatora i Evaluatora zamiast pojedynczych wywołań
agenta. Konkretne przypisanie modelu/effort per rolę ustal per projekt —
`<model per rola, ustal per projekt>` jest tu placeholderem, nie normą.

Bez obu warunków (narzędzie niedostępne, brak zgody, albo agent bez
parametru effort w schemacie) różnicuj role wyłącznie treścią promptu.

## 4. Routing ról

```text
Operator <model per rola, ustal per projekt>
  → Evaluator <model per rola, ustal per projekt>
  → Final Control <model per rola, ustal per projekt> (osobny subagent)
  → integracja głównego orkiestratora
  → READY_FOR_DEPLOY
  → osobna bramka deploy/push
```

- **Operator** wykonuje jeden temat w izolacji, wyłącznie w allowliście. Nie
  ocenia własnej pracy, nie integruje i nie deployuje.
- **Evaluator** jest niezależnym adwokatem diabła. Sprawdza diff, zakres,
  regresje, testy i dowody. Nie integruje ani nie publikuje.
- **Final Control** kontroluje kompletność śladu, GOAL, bramki i gotowość
  do integracji. Nie wystawia samodzielnie `READY_FOR_DEPLOY`. Jest zawsze
  osobnym subagentem (nigdy główny agent sam), zwykle na tym samym modelu
  co Evaluator.
- **Orkiestrator** działa w głównym czacie, integruje wyłącznie zatwierdzoną
  allowlistę i jako jedyny wystawia `READY_FOR_DEPLOY`.
- **Właściciel** odpowiada na decyzje tylko w głównym czacie orkiestratora.
  Subagenty są kanałami technicznymi; nie prowadź z nimi osobnych decyzji
  produktowych.

## 5. Pętla bez końca aż do celu

Temat zachowuje to samo pełne ID we wszystkich rundach:

```text
dispatch → Operator → Evaluator → Final Control → integracja → READY_FOR_DEPLOY
                 ↑          ↑             ↑
                 └──────────┴─────────────┘
          FAIL / BLOCK / TIMEOUT / INFRA / ZWIS / brak dowodu
```

Ustal limit rund pętli na ten sam temat — liczba jest przykładowa i
konfigurowalna per projekt (np. 5); po przekroczeniu orkiestrator zgłasza
właścicielowi zamiast kontynuować bez końca, zamiast cichego resetu licznika.

1. Przed dispatchiem zapisz dispatch: pełne ID, GOAL, kryteria końca,
   zakres, allowlistę, izolację, bazę worktree i plan testów.
2. Gdy Operator zakończy terminalnym raportem, natychmiast zamknij ten
   przebieg i uruchom Evaluatora dla tego samego ID.
3. `PASS` uruchamia Final Control bez czekania na dodatkową zgodę.
4. Po pozytywnym Final Control orkiestrator sprawdza faktyczny stan
   repozytorium, diff, testy, raporty i allowlistę, a następnie integruje.
5. Dopiero po faktycznej integracji orkiestrator może zapisać
   `READY_FOR_DEPLOY`.
6. Każdy `FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA`, `ZWIS`, brak
   artefaktu lub błąd izolacji wraca do Operatora, potem Evaluatora i Final
   Control z tym samym ID, w ramach ustalonego limitu rund. Manual resume
   wymaga jawnej decyzji i zachowuje ID, licznik i ostatni werdykt.
7. Jedyna normalna pauza to oczekiwanie na decyzję właściciela. Pauzuje
   tylko temat, który jej wymaga; pozostałe niezależne tematy pracują dalej.

`PASS-WITH-NOTES` nie kończy procesu, jeśli uwagi dotyczą kryterium GOAL,
testów, zakresu, bezpieczeństwa, dowodu lub gotowości do integracji.

## 6. Dyscyplina decyzyjna (ABC/ECHO)

Formalna decyzja jest obowiązkowa, gdy zmiana dotyka decyzji
produktowej/architektonicznej z realnym kompromisem — nie każdej drobnej
implementacji.

Każde pytanie decyzyjne musi mieć:

- pełne ID tematu i unikalne ID samego pytania — nigdy samo „Q1" bez
  kontekstu;
- sytuację, cel pytania i powód „dlaczego teraz";
- warianty A/B/C;
- co najmniej dwa argumenty ZA i dwa PRZECIW dla każdego wariantu;
- rekomendację, konsekwencje implementacyjne i testowe.

**Nie zamieniaj odpowiedzi „chyba", luźnej rozmowy ani rekomendacji agenta
w formalną decyzję.** ECHO — literalny zapis odpowiedzi właściciela (np.
„Temat-Q8 = B") — zapisuje się dopiero PO jednoznacznej odpowiedzi literą,
w miejscu, które projekt wskazuje jako rejestr decyzji. Dopiero potem
kontynuuj ten sam ID. Nie przyjmuj odpowiedzi za właściciela i nie numeruj
ponownie pytań tak, aby kolidowały z wcześniejszymi.

## 7. Kontrakt raportu

Każdy raport etapu powinien zawierać ten szkielet pól (nazwy domen i
statusów dostosuj do projektu):

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA | DECISION_REQUIRED | ...
DOMAIN: <domeny per projekt, np. PRODUCT/PROCESS/INFRA/INFORMATIONAL>
TEMAT: <pełne ID>
GOAL: <cel końcowy>
ZMIANY/COMMIT: <allowlista, artefakt, SHA albo brak zmian>
TESTY: <dokładne wyniki albo powód pominięcia>
BLOKADY: <jawna lista albo brak>
NASTĘPNY KROK: <kolejna bramka>
DEPLOY/PUSH: WYKONANO albo NIE WYKONANO
```

Status nie zmienia się na podstawie samej nazwy worktree, UI, deklaracji
agenta albo nieistniejącego raportu — brak artefaktu nie jest dowodem
zakończenia.

## 8. Watchdog

- Jeden temat ma jeden aktywny przebieg Operatora.
- Brak ruchu przez ustalony (per projekt) czas oznacza `ZWIS`: sprawdź
  transcript, repozytorium, worktree i artefakty zamiast zgadywać. Nie
  anuluj i nie restartuj w ciemno; orkiestrator przejmuje temat.
- Po terminalnym raporcie zwolnij zakończony slot i uruchom następny etap.
- Ustal limit aktywnej puli subagentów per projekt (przykładowa wartość,
  nie sztywna) — gdy istnieje niezablokowana praca, obsadzaj dostępne
  sloty, nie zostawiaj wolnego zasobu przez przeoczenie.

## 9. Dobre praktyki ogólne

- `git add -A`/`git add .` jest niebezpieczne przy cudzej lub nieznanej
  pracy w drzewie współdzielonym — integruj allowlist-only, per plik i per
  hunk.
- Przed kodowaniem wykonaj recon: rejestr tematów, decyzje, handoff, stan
  repozytorium i wyszukiwanie po kodzie.
- Przed integracją przejrzyj diff także pod kątem usunięć, overlapu i
  regresji z inną równoległą pracą.
- Deploy/push jest zawsze osobną bramką po `READY_FOR_DEPLOY` i wyraźnym
  poleceniu właściciela — Operator, Evaluator i Final Control jej nie
  wykonują.

## 10. Meldunek startowy do właściciela (wzór)

Po lekturze źródeł wejściowych projektu agent powinien napisać krótko:

```text
Przeczytałem źródła wejściowe procesu AutoBot dla tego projektu.
Zidentyfikowałem bieżące tematy, ich statusy, blokady i następne bramki.
Nie zaczynam zmian, dopóki nie potwierdzę właściwego ID, GOAL, allowlisty
i decyzji wymaganych od właściciela. Pracuję wyłącznie w bieżącym, czystym
worktree.
```

---

To jest uniwersalny szkielet — konkretne wiązania (ścieżki plików, modele,
terminologia, twarde bariery) dla TEGO projektu, jeśli istnieją, są w
towarzyszącym mu skillu specyficznym dla projektu (np. `civ-autobot` dla
Civ).
