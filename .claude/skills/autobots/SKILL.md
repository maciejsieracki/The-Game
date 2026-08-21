---
name: autobots
description: >-
  Wprowadza agenta w proces AutoBot projektu Civ: źródła prawdy, routing Operator →
  Evaluator → Final Control → integracja, GOAL, ABC/ECHO, izolację, artefakty,
  watchdog, statusy, READY_FOR_DEPLOY i osobną bramkę deploy/push. Używaj przy
  rozpoczęciu pracy w projekcie, przejęciu tematu, dispatchu subagentów, kontroli
  statusu lub przygotowaniu integracji.
---

# Autobots — wejście do procesu Civ

Ten skill jest wariantem uniwersalnego punktu startowego dla narzędzi ze wsparciem
mechanizmu Skills. Prawdziwym, niezależnym od narzędzia źródłem jest
[`README.md`](../../../README.md) w korzeniu repo — przeczytaj go najpierw, w całości,
nawet jeśli ten skill został wywołany automatycznie. Ten plik nie zastępuje kanonu
procesu ani bieżącego handoffu. Jeżeli dokumenty się różnią, nie wybieraj po cichu:
zatrzymaj interpretację, porównaj najnowszy handoff, ECHO i faktyczny stan Git,
a rozjazd zgłoś w głównym czacie.

## 1. Zasada nadrzędna

Każdy temat ma jeden pełny identyfikator, jeden jawny `GOAL`, mierzalne kryteria końca,
allowlistę plików, izolację i plan testów.

Cel procesu to **READY_FOR_DEPLOY**: faktycznie sprawdzona i zintegrowana wersja,
gotowa do oddania do ROBOCZEJ. Sam raport, `PASS`, branch, worktree, commit albo
widoczny status subagenta nie oznacza zakończenia. Po `READY_FOR_DEPLOY` deploy/push
pozostaje osobną bramką i wymaga wyraźnego polecenia właściciela.

## 2. Start nowej sesji — kolejność obowiązkowa

Przed analizą kodu, dispatchiem lub edycją przeczytaj:

1. [`README.md`](../../../README.md) — uniwersalny punkt startowy, pełna kolejność jest tam opisana krok po kroku;
2. `docs/procesy/INDEX-PROCESU.md` — mapę źródeł prawdy i artefaktów (krok 2 z `README.md`);
3. `docs/decyzje/R-PROC-AUTOBOT.md` — aktywną normę procesu: role, ABC, bramki, bariery, hasła właściciela;
4. `playbook.md` **w całości** — zasady, błędy „nigdy więcej", wnioski i sprawy otwarte;
5. `dyspozycje/_handoff/HANDOFF-AKTUALNY.md` — jedyny bieżący stan przejęcia;
6. końcówkę `dyspozycje/_handoff/KANAL-PRACA.md` — ostatnie przekazania;
7. rejestr tematu, aktywne ABC/ECHO, decyzję właściciela i run danego ID;
8. dopiero na końcu faktyczny Git, diff, testy i kod.

Nie zaczynaj od starego handoffu, płaskiego logu, samego czatu ani archiwum.
`docs/archiwum-procesu/` jest historią, nie aktywnym routingiem.

**Zmieniasz reguły samego AutoBota (nie kod gry)?** Najpierw przeczytaj
`dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md` — mapa wszystkich warstw
mechanizmu.

Po starcie zamelduj krótko: jakie źródła zostały przeczytane, jaki jest bieżący stan,
jakie tematy są aktywne i czy istnieje blokada.

## 3. Hierarchia i przeznaczenie najważniejszych plików

Pełna, aktualna tabela jest w `docs/procesy/INDEX-PROCESU.md` §3 — nie powtarzam jej
tutaj, żeby nie rozjeżdżała się w dwóch miejscach. Skrót ról:

| Plik / katalog | Rola |
|---|---|
| `README.md` | uniwersalny punkt startowy |
| `docs/procesy/INDEX-PROCESU.md` | mapa źródeł prawdy i miejsc zapisu artefaktów |
| `docs/decyzje/R-PROC-AUTOBOT.md` | pełna norma: role, pętla, ABC, bramki, bariery, hasła |
| `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT*.md`, `-SCOPE.md` | trzy twarde FAIL-e Evaluatora (happy-path, parytet gracz/AI, save/load) |
| `docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md` | obowiązkowy turniej dwóch niezależnych projektów przed nowym ABC |
| `docs/decyzje/R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1.md` | format odpowiedzi na hasło `raport` |
| `dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md` | mapa warstw przy zmianie samego AutoBota |
| `playbook.md` | kanon pamięci procesu; aktualizuj po pracy |
| `dyspozycje/REJESTR-PROSB-I-ZADAN.md` | wszystkie tematy i status kanoniczny |
| `dyspozycje/PYTANIA-OTWARTE.md` | aktywne ABC, ECHO, odsyłacze decyzji |
| `docs/decyzje/<ID>.md` | literalna decyzja właściciela |
| `dyspozycje/autobot/runs/<ID>/` | `00-dispatch` do `04-integration`, kanoniczny ślad |
| `dyspozycje/_handoff/HANDOFF-AKTUALNY.md` | jedno bieżące źródło stanu |
| `dyspozycje/_handoff/KANAL-PRACA.md` | krótkie przekazania, `CZEKAM-NA:` |
| `dyspozycje/WERSJE.md` | faktycznie opublikowane wersje, aktualizuj dopiero po deployu |
| `dyspozycje/autobot/src/guardrails.ts` | mechaniczne, deny-by-default zakazy w kodzie — ostatnia linia obrony |

## 3a. Narzędzie orkiestracji wieloagentowej — używaj, gdy dostępne

Jeśli masz dostęp do narzędzia agentic workflow (przypisanie modelu/effort per
rola, `pipeline()`/`parallel()`) **i** właściciel dał jawną, opt-in zgodę na
multi-agent orchestration w tej sesji — używaj go zawsze do dispatchu Operatora
i Evaluatora, nie pojedynczych wywołań `Agent`. Dla sesji Claude Code: **Operator =
Sonnet 5, effort Medium; Evaluator = Sonnet 5, effort High** — pełne
uzasadnienie w `docs/decyzje/R-PROC-AUTOBOT.md` §5a.

Gotowy, wcześniej przygotowany szkielet skryptu Workflow (Operator→Evaluator,
`agent()`/`phase()`, effort per rolę) jest w
[`.claude/skills/civ-autobot-workflow/SKILL.md`](../civ-autobot-workflow/SKILL.md)
— użyj go zamiast pisania dispatchu ad-hoc. Bez obu warunków wyżej (Workflow
niedostępny, brak zgody, albo narzędzie inne niż Claude Code z Workflow — np.
Cursor, GPT) zostań w TYM pliku: pojedynczy `Agent` nie ma parametru
`effort`/`reasoning_effort` w schemacie, więc role różnicujesz WYŁĄCZNIE treścią
promptu. Pełne uzasadnienie dwóch ścieżek i incydent źródłowy: playbook C-061.

## 4. Routing modeli i ról

```text
Operator GPT-5.6 Luna High
  → Evaluator GPT-5.6 Luna High
  → Final Control GPT-5.6 Luna High (osobny subagent)
  → integracja głównego orkiestratora GPT-5.6 Luna Medium
  → READY_FOR_DEPLOY
  → osobna bramka deploy/push
```

- **Operator** wykonuje jeden temat w izolacji, wyłącznie w allowliście. Nie ocenia
  własnej pracy, nie integruje i nie deployuje.
- **Evaluator** jest niezależnym adwokatem diabła. Sprawdza diff, SCOPE, regresje,
  testy, dowody, save/load i blokady — dla kodu dodatkowo trzy twarde FAIL-e z
  `R-PROC-AUTOBOT.md` §Evaluator. Nie integruje ani nie publikuje.
- **Final Control** kontroluje kompletność śladu, GOAL, bramki i gotowość do integracji.
  Nie wystawia samodzielnie `READY_FOR_DEPLOY`.
- **Orkiestrator** działa w głównym czacie, integruje wyłącznie zatwierdzoną allowlistę
  i jako jedyny wystawia `READY_FOR_DEPLOY`.
- **Właściciel** odpowiada na ABC tylko w głównym czacie orkiestratora. Subagenty są
  kanałami technicznymi; nie prowadź z nimi osobnych decyzji produktowych.

## 5. Pętla bez końca aż do celu

Temat zachowuje to samo pełne ID we wszystkich rundach:

```text
dispatch → Operator → Evaluator → Final Control → integracja → READY_FOR_DEPLOY
                 ↑          ↑             ↑
                 └──────────┴─────────────┘
          FAIL / BLOCK / TIMEOUT / INFRA / ZWIS / brak dowodu
```

1. Przed dispatchiem zapisz `00-dispatch.md`: pełne ID, GOAL, kryteria końca, zakres,
   allowlistę, izolację, bazę worktree i plan testów.
2. Gdy Operator zakończy terminalnym raportem, natychmiast zamknij ten przebieg i
   uruchom Evaluatora dla tego samego ID.
3. `PASS` uruchamia Final Control bez czekania na dodatkową zgodę.
4. Po pozytywnym Final Control orkiestrator sprawdza faktyczny Git, diff, testy,
   raporty i allowlistę, a następnie integruje.
5. Dopiero po faktycznej integracji orkiestrator może zapisać `READY_FOR_DEPLOY`.
6. Każdy `FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA`, `ZWIS`, brak artefaktu,
   błąd izolacji lub niegotowość Final Control wraca automatycznie do Operatora,
   potem Evaluatora i Final Control z tym samym ID wyłącznie po wywołaniu wspólnego
   guarda `authorizeDispatch` z bieżącą liczbą rund i `lastVerdict`. Dozwolone są tylko
   rundy 1–5; próba 6 zatrzymuje się statusem `LIMIT-5-EXCEEDED` i raportem. Manual
   resume wymaga jawnej decyzji oraz zachowuje ID, licznik i `lastVerdict`.
7. Jedyna normalna pauza to `ABC-OCZEKUJE`. Pauzuje tylko temat wymagający decyzji;
   pozostałe niezależne tematy pracują dalej.

`PASS-WITH-NOTES` nie kończy procesu, jeśli uwagi dotyczą kryterium GOAL, testów,
zakresu, bezpieczeństwa, dowodu lub gotowości do integracji.

## 6. ABC i ECHO

ABC jest obowiązkowe, gdy zmiana dotyka balansu gry, kosztów, mnożników, progów,
walki, ekonomii, zachowania AI lub innej decyzji produktowej/architektonicznej.
Każde NOWE pytanie (bez wcześniejszej odpowiedzi literą) przechodzi przez obowiązkowy
turniej dwóch niezależnych projektów — `R-PROC-AUTOBOT-ABC-TURNIEJ.md`.

Każde pytanie musi mieć:

- pełne ID tematu i unikalne pełne ID pytania, np. `R-TEMAT-Q8` — nigdy samo `Q1`;
- sytuację, cel pytania i powód „dlaczego teraz";
- warianty A/B/C;
- co najmniej dwa argumenty ZA i dwa PRZECIW dla każdego wariantu;
- rekomendację, konsekwencje implementacyjne i testowe.

**Nie zamieniaj odpowiedzi „chyba", luźnej rozmowy ani rekomendacji agenta w formalną
decyzję ABC.** Po odpowiedzi właściciela zapisz literalne ECHO, np. `R-TEMAT-Q8 = B`, w
`dyspozycje/PYTANIA-OTWARTE.md` i właściwym `docs/decyzje/<ID>.md`. Dopiero potem
kontynuuj ten sam ID. Nie przyjmuj odpowiedzi za właściciela i nie numeruj ponownie
pytań tak, aby kolidowały z wcześniejszymi.

## 7. Artefakty i kontrakt raportu

Nowy przebieg zapisuj w `dyspozycje/autobot/runs/<ID>/`:

```text
00-dispatch.md
01-operator.md
02-evaluator.md
03-final-control.md
04-integration.md
```

Każdy raport musi zawierać:

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA | LIMIT-5-EXCEEDED | DECISION_REQUIRED | INTEGRATION_PENDING
DOMAIN: GAME | PROCESS | INFRA | INFORMATIONAL
TEMAT: <pełne ID>
GOAL: <cel końcowy>
ZMIANY/COMMIT: <allowlista, artefakt, SHA albo brak zmian>
TESTY: <dokładne wyniki albo powód pominięcia>
BLOKADY: <jawna lista albo brak>
NASTĘPNY KROK: <kolejna bramka>
DEPLOY/PUSH: WYKONANO albo NIE WYKONANO
```

Status rejestru pochodzi z zamkniętej listy w indeksie procesu. Nie zmieniaj go na
podstawie samej nazwy worktree, UI, deklaracji agenta albo nieistniejącego raportu.
`not_found` bez artefaktu nie jest dowodem zakończenia. `DECISION_REQUIRED` (playbook C-054)
sygnalizuje konflikt dispatch/kod/testy — nie zwiększa licznika rund, nie jest `BLOCK`.
`INTEGRATION_PENDING` (playbook C-059) sygnalizuje kod gotowy, którego integracja czeka na
rozdzielenie współdzielonego pliku — integracja jest zawsze allowlist-only, per plik i per
hunk, zakaz `git add -A`/`git add .` z brudnego drzewa współdzielonego z inną pracą.

## 8. Bramki i hasła właściciela

Konkretne komendy testowe i punkty odniesienia są w `docs/decyzje/R-PROC-AUTOBOT.md`
§Bramki — nie kopiuj ich tutaj, sprawdzaj tam (liczby się zmieniają z każdą falą).
Tabela haseł właściciela (`sprawdź`, `push`, `deploy`, `format`/`ABC`, `raport`,
`co nowego` — pokazuje wyłącznie sekcję „Co nowego w regułach AutoBota" z `README.md`,
bez pełnego audytu) jest tamże §Hasła właściciela.

## 9. Watchdog i wykorzystanie subagentów

- Jeden temat ma jeden aktywny przebieg Operatora.
- Brak ruchu przez około 7 minut oznacza `ZWIS`: sprawdź transcript, Git, worktree
  i artefakty. Nie anuluj i nie restartuj w ciemno; orkiestrator przejmuje temat.
- Po terminalnym raporcie zwolnij zakończony slot i uruchom następny etap.
- Limit aktywnej puli projektu wynosi 6 subagentów. Gdy istnieje niezablokowana praca,
  obsadzaj dostępne sloty; nie zostawiaj wolnego zasobu przez przeoczenie.
- `sprawdź` oznacza audyt całej puli: aktywnych przebiegów, raportów, historycznych
  `not_found`, statusów runów, Git i artefaktów. Po audycie zamknij zakończone sloty
  i uruchom wymagane następne etapy.

## 10. Twarde bariery projektu Civ

- Nie używaj `git add -A` przy cudzej lub nieznanej pracy.
- Operator pracuje w izolowanym worktree i nie dotyka plików poza allowlistą.
- Przed kodowaniem wykonaj recon: rejestr, decyzje, handoff, Git i wyszukiwanie po repo.
- Przed integracją przejrzyj diff także pod kątem usunięć, overlapu i regresji.
- Dla kodu wymagaj typechecku, testów tematu, testów sąsiednich i baseline'u; przy
  zmianach trwałego stanu sprawdź save/load i wartość domyślną dla starych zapisów.
- Przy zmianie mapy sprawdź właściwy test deterministyczności; przy UI obejrzyj realny
  render/zrzut ekranu.
- Nie uruchamiaj `npm run build` ani `npm run dev` w Civ. Stosuj komendę builda
  wskazaną przez aktualny playbook/README runtime.
- `playbook.md` jest kanonem, `playbook.json` jest generowany — nie edytuj JSON ręcznie.
- Nie aktualizuj `WERSJE.md` przed faktycznym deployem.
- Operator, Evaluator i Final Control nie wykonują deployu ani pushu. Deploy/push jest
  osobną bramką po `READY_FOR_DEPLOY` i wyraźnym poleceniu właściciela.
- Bariery powyżej są dodatkowo wymuszane mechanicznie w kodzie
  (`dyspozycje/autobot/src/guardrails.ts`, deny-by-default) — nie zastępuje to ich
  czytania, ale jest ostatnią linią obrony, gdy pętla zawiedzie.

## 11. Meldunek startowy do właściciela

Po lekturze agent powinien napisać krótko:

```text
Przeczytałem źródła wejściowe AutoBot: README.md, INDEX-PROCESU.md, R-PROC-AUTOBOT.md,
playbook.md, HANDOFF-AKTUALNY.md, KANAL-PRACA.md. Zidentyfikowałem bieżące tematy,
ich statusy, blokady i następne bramki. Nie zaczynam zmian, dopóki nie potwierdzę
właściwego ID, GOAL, allowlisty i decyzji ABC. Pracuję wyłącznie w bieżącym, czystym
worktree.
```
