# Draft: konkretne instrukcje dla agentów AutoBot (na bazie aneksu z 2026-08-20/21)

Status: **SCALONE DO KANONU 2026-08-21** jako `playbook.md` C-054–C-060 (numeracja C-051 zachowana bez zmian — dopełniona, nie nadpisana). Ten plik pozostaje jako pełny zapis procesu decyzyjnego i uzasadnień; źródłem prawdy jest teraz `playbook.md`/`civ-autobot/SKILL.md`/`autobots/SKILL.md`/`R-PROC-AUTOBOT.md`.

Źródło: 9 wniosków z retrospektywy + 11-punktowy aneks zaproponowany przez inną sesję, zweryfikowany i uzupełniony w tej rozmowie.

## Dla Operatora

1. Zanim zaczniesz kolejną rundę na tym samym ID, sprawdź czy dispatch/kod/testy wymagają tego samego zachowania. Jeśli NIE — STOP, nie koduj dalej, nie licz tego jako rundy, ustaw status ledgeru `DECISION_REQUIRED` **i jednocześnie** status tematu `ABC-OCZEKUJE` w `REJESTR-PROSB-I-ZADAN.md`/`PYTANIA-OTWARTE.md` (to ta sama rzecz na dwóch warstwach — ledger dispatchu i rejestr tematów — ustawiane zawsze razem, nigdy osobno). Zapisz notatkę wykrycia konfliktu jako `dyspozycje/autobot/runs/<ID>/decision-abc.md` (exact-ID, opis konfliktu — po jednym zdaniu co mówi dispatch/kod/testy, timestamp, agent_id) — **to jest tylko zgłoszenie wykrycia, NIE zastępuje pytania ABC dla właściciela.**
   - Jeśli konflikt jest **czysto inżynierski, bez wpływu na gameplay/UX/dane gracza** (wyjątek już zdefiniowany w C-018) — dalej lekka ścieżka: jedna propozycja do `PYTANIA-OTWARTE.md`.
   - Jeśli konflikt **wpływa na gameplay/balans/UX** (jak incydent źródłowy 0/9 vs 5/4) — **obowiązuje pełny turniej C-018**: orkiestrator pisze własny projekt A/B/C z "typem" wg `PROFIL-DECYZYJNY-MACIEJ.md`, niezależny drugi agent pisze osobny projekt, Evaluator sędziuje dwuwarstwowo. `decision-abc.md` w runs/<ID>/ jest tylko wyzwalaczem tego turnieju, nie jego substytutem — nie wolno scalić uproszczonego szablonu A/B/C jako zamiennika C-018.
   Po decyzji właściciela routing wraca do TEGO SAMEGO Operatora, oba statusy (`DECISION_REQUIRED` i `ABC-OCZEKUJE`) są zdejmowane razem.
2. Zanim zgłosisz temat jako zablokowany, rozstrzygnij czy blokada jest FUNKCJONALNA (gra działa źle) czy PROCESOWA (brudny worktree, obcy hunk, brak/niespójny wpis w ledgerze, limit wątków). Oznacz domenę w raporcie: `GAME` / `PROCESS` / `INFRA` / `INFORMATIONAL`. Błąd provenance/worktree/ledgeru NIE jest automatycznie błędem gry. **Wymaga zmiany kontraktu raportu** (`autobots/SKILL.md` §7, obecnie `STATUS/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/NASTĘPNY KROK/DEPLOY-PUSH`): dopisać pole `DOMAIN:` — bez ustalonego miejsca w kontrakcie to oznaczenie będzie się różnić agent od agenta.
3. Do sprawdzenia „czy to już wdrożone w tej Fali" używaj `git merge-base --is-ancestor <commit_funkcji> <commit_release>`, nie porównania z pamięci co jest w najnowszej Fali. Jeśli commit funkcji jest przodkiem aktualnego HEAD — temat jest zintegrowany, nie wymaga ponownego wdrożenia.
4. **[WYMAGA DECYZJI WŁAŚCICIELA PRZED AKTYWACJĄ — infrastruktura jeszcze nie istnieje]** Docelowo: przed otwarciem tematu sprawdź rejestr pod kątem duplikatu tej samej funkcji pod inną nazwą; jeśli istnieje, oznacz relację `duplicate_of` / `related_to` / `supersedes` i nie prowadź niezależnego retry. Dziś `REJESTR-PROSB-I-ZADAN.md` NIE MA pola na taką relację (sprawdzone: brak kolumny/tagu). Propozycja minimalna: dopisać do wiersza tematu w tabeli rejestru wolnotekstowy tag `[duplicate_of: <ID>]` w kolumnie `Dowód`, zamiast nowej kolumny/pliku. Dopóki to nie zostanie zatwierdzone i dodane, ta instrukcja jest deklaracją intencji, nie egzekwowalną regułą — nie cytować jej jako obowiązującej.
5. Nie odtwarzaj sztucznie brakujących historycznych liczników/wyników (np. luk w rejestrze rund). Zanotuj brak jako notę i oprzyj decyzję na aktualnym, reprodukowalnym teście — nie na domysłach o przeszłości.

## Dla Integratora (rola odrębna od Operatora — do jawnego rozróżniania w dispatchu)

6. Brudny worktree NIE oznacza automatycznie błędu tematu. Integracja = analiza diffu per plik i per hunk, staging WYŁĄCZNIE plików/hunków z zatwierdzonej allowlisty tematu. Zakaz `git add -A`, `git add .`, czyszczenia worktree. Obce zmiany pozostają nietknięte.
7. Jeśli nie da się wiarygodnie rozdzielić współdzielonego pliku — status `INTEGRATION_PENDING` (nie `BLOCK`). `BLOCK` tylko gdy rozdzielenie faktycznie niemożliwe. **Właściciel odblokowania:** orkiestrator — dostaje temat w `INTEGRATION_PENDING` jako kandydata do ręcznego rozdzielenia hunków (lub do decyzji, że współdzielony plik wymaga wspólnego dispatcha z drugim tematem); temat nie czeka biernie — orkiestrator adresuje go przy najbliższym wolnym slocie, tak samo jak `BLOCK` wymagający decyzji.
8. `PASS-WITH-NOTES` z kompletną macierzą testów i allowlist-only = gotowość do integracji, NIE automatyczna porażka.

## Dla Evaluatora / Final Control

9. Status końcowy musi rozróżniać co najmniej: `BLOCK` (realna blokada techniczna/funkcjonalna, potwierdzona) / `DECISION_REQUIRED` (konflikt kontraktów — nie zwiększa licznika rund, nie odpala kolejnego Operatora automatycznie, Evaluator i Final Control wstrzymują temat) / `INTEGRATION_PENDING` (kod gotowy, integracja czeka na rozdzielenie zakresu) / `READY_FOR_DEPLOY` / `INTEGRATED` / `DEPLOYED` jako statusy odrębne.
10. Limit prób = realne dispatch Operatora dla tego samego pełnego ID (runda początkowa + każda korekta liczą się osobno; oczekiwanie na decyzję właściciela w `DECISION_REQUIRED` NIE zużywa rundy). Po wyczerpaniu limitu — stop, raport `LIMIT-...-EXCEEDED` do orkiestratora/właściciela z liczbą rund i ostatnim werdyktem, żadnego automatycznego kolejnego dispatcha bez jawnej zgody.

## Dla Watchdoga

11. Watchdog liczy własny proces jako zajęty slot, jeśli korzysta z tego samego limitu wątków/procesów co Operatorzy/Evaluatorzy. **Relacja z pulą 6 subagentów** (`autobots/SKILL.md` §9, limit 6 otwartych subagentów): jeśli Watchdog dzieli tę samą pulę, efektywna pojemność na tematy to 5, nie 6 — orkiestrator obsadza maksymalnie 5 slotów tematami, szósty jest zarezerwowany dla Watchdoga. Jeśli Watchdog działa poza tą pulą (osobny limit/proces) — pula 6 zostaje bez zmian, ale to musi być jawnie zapisane, żeby nie było domysłów. Raportuj rozjazd `ledger_free_slot` vs `runtime_thread_limit` jako osobny, jawny sygnał — nie milcz o nim; rozjazd wstrzymuje nowe dispatch'e do wyjaśnienia, nie jest tylko notatką w raporcie.
12. Brak raportu/notyfikacji zakończenia NIGDY nie jest interpretowany jako pusty/nieistniejący przebieg — zawsze klasyfikacja `TIMEOUT` / `ZWIS` / `BLOCK`, z timestampem i uzasadnieniem. Nieznany status blokuje dispatch duplikatu do czasu rozstrzygnięcia.

## Dla orkiestratora (kontrola końcowa)

13. `READY_FOR_DEPLOY` wystawiane wyłącznie po pełnym łańcuchu: Operator PASS → Evaluator PASS → Final Control PASS → integracja allowlist-only → weryfikacja manifestu. `INTEGRATED` i `DEPLOYED` to statusy odrębne od `READY_FOR_DEPLOY`, każdy zapisywany osobno z commitem bazowym / manifestem / hashem artefaktu.

## Ledger dispatchu — rozszerzone pola (aktualizacja C-051, nie nowy numer)

```
dispatch_id, agent_id, topic_id, domain (GAME|PROCESS|INFRA|INFORMATIONAL),
rola, model, reasoning_effort, cycle_id, round, started_at,
expected_report, expected_artifact, status, finished_at,
status_reason, parent_dispatch_id, decision_id
```

Status końcowy/przejściowy (zastępuje starszą, węższą listę z C-051 — patrz uwaga na dole):
```
DISPATCHED, RUNNING, COMPLETED, INTERRUPTED, TIMEOUT, NOT_FOUND,
FAIL, BLOCK, DECISION_REQUIRED, INTEGRATION_PENDING,
READY_FOR_DEPLOY, INTEGRATED, DEPLOYED, CLOSED
```
Każdy status końcowy ma `finished_at` i `status_reason`. Nieznany status blokuje dispatch duplikatu do czasu rozstrzygnięcia (nie tworzy nowego runu „na wszelki wypadek").

**Otwarta niespójność do rozstrzygnięcia przy scalaniu (nie moja jednostronna decyzja):** obecny ledger w `civ-autobot/SKILL.md` używa małych liter (`completed`, `interrupted`, `timeout`, `not_found`, `BLOCK`, `CLOSED`), aneks proponuje wielkie litery i szerszy zestaw. Trzeba wybrać jedną konwencję przy migracji, nie utrzymywać obu równolegle.

## Szablon `dyspozycje/autobot/runs/<ID>/decision-abc.md` (zgłoszenie wykrycia — NIE substytut C-018)

To jest **notatka Operatora sygnalizująca konflikt**, nie gotowe pytanie ABC. Kieruje dalej do jednej z dwóch ścieżek zdefiniowanych w instrukcji 1 (lekka — czysto inżynierska bez wpływu na gameplay, albo pełny turniej C-018 — z wpływem na gameplay/balans/UX). Nie zawiera samodzielnych opcji A/B/C z rekomendacją jednego agenta — to byłoby dokładnie to, czego C-018 zakazuje ("nie jako pojedyncza propozycja").

```
# decision-abc (zgłoszenie): <exact-ID tematu>
agent_id: <id>
timestamp: <ISO>
ledger_status: DECISION_REQUIRED
rejestr_status: ABC-OCZEKUJE

## Konflikt
<co dokładnie mówi dispatch / kod / testy — po jednym zdaniu na źródło,
tak żeby sprzeczność była widoczna bez interpretacji, bez proponowania rozwiązania>

## Klasyfikacja (wymagana, decyduje o dalszej ścieżce)
- Wpływ na gameplay/UX/dane gracza: TAK / NIE
- Jeśli NIE: → lekka ścieżka, jedna propozycja do `PYTANIA-OTWARTE.md`
- Jeśli TAK: → pełny turniej C-018 (`docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md`), ten plik jest tylko wyzwalaczem
```

## Rejestr duplikatów — przykład docelowego zastosowania (patrz zastrzeżenie w instrukcji 4)

`R-PRACA-MIASTO-LIMIT-50-Q1` → `duplicate_of: R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1` (ta sama funkcja, inna nazwa; retry prowadzony tylko na jednym ID). Nieaktywne do czasu dodania pola w rejestrze.

## Przykłady domen (do wpisania wprost do reguły, nie tylko do tego draftu)

- rekrutacja bez upkeep — `GAME`, z ewentualną blokadą integracji osobno.
- limit wątków / rozjazd ledger vs runtime — `INFRA`.
- limit rund/prób — `PROCESS`.
- pytanie o mechanikę handlu bez dispatchu kodu — `INFORMATIONAL`.

## Egzekwowalność — kryterium FAIL dla Evaluatora/Final Control per instrukcja

Żadna z instrukcji 1–8 nie jest samoegzekwująca się — to był największy strukturalny zarzut niezależnej weryfikacji tego draftu (patrz `EVALUATOR-RAPORT` niżej). Evaluator/Final Control traktuje brak poniższego jako `FAIL`, nie jako notatkę:
- instr. 1: brak `decision-abc.md` w runs/<ID>/ mimo widocznego konfliktu kontraktu w raporcie Operatora → FAIL.
- instr. 2: raport bez pola `DOMAIN:` → FAIL kontraktu raportu (po wdrożeniu zmiany w §7).
- instr. 3: raport „już wdrożone/nieaktualne" bez wklejonego wyniku `git merge-base --is-ancestor` → FAIL, nie wystarczy twierdzenie.
- instr. 6: commit/staging integracji zawierający pliki spoza allowlisty tematu → FAIL niezależnie od wyniku testów.
- instr. 9/10: Evaluator odrzuca każdy raport terminalny bez jednoznacznego statusu z ustalonej listy.

## Uwaga do wdrożenia (redakcja, nie treść)

- Punkt 9 (rozszerzony ledger/lista statusów) i pkt 3 aneksu źródłowego to aktualizacja **C-051** (już `CHRONIONA`), NIE nowy numer reguły obok — inaczej powstaną dwie sprzeczne definicje ledgeru w `playbook.md`.
- **Instrukcja 1 / `decision-abc.md` NIE zastępuje C-018** (obowiązkowy turniej A/B/C dwóch niezależnych agentów dla decyzji z wpływem na gameplay/UX/dane gracza) — patrz poprawiona wersja instrukcji 1 i szablonu wyżej. Pierwsza wersja tego draftu miała tu realną lukę (wyłapaną przez niezależną ocenę): pojedynczy uproszczony szablon A/B/C mógłby stać się cichym obejściem turnieju dla dokładnie tych decyzji, które C-018 miał chronić.
- Konwencja wielkości liter w statusach (patrz sekcja ledger wyżej) wymaga jawnej decyzji przy migracji, nie cichego wyboru przez kolejnego edytora.
- Instrukcja 4 (rejestr duplikatów) jest deklaracją intencji do czasu dodania pola w `REJESTR-PROSB-I-ZADAN.md` — nie cytować jako aktywnej reguły przed tą decyzją.
- Ten plik jest draftem roboczym do przeniesienia przez sesję edytującą `playbook.md`, `civ-autobot/SKILL.md` i `autobots/SKILL.md`; nie jest samodzielnym źródłem prawdy protokołu, dopóki nie zostanie scalony.

## EVALUATOR-RAPORT (niezależna weryfikacja tego draftu, 2026-08-21)

Status pierwszej wersji: **PASS-WITH-NOTES**, nie gotowa do scalenia bez poprawek. Znalezione i naprawione powyżej: (1) kolizja `decision-abc.md` z C-018 — GŁÓWNY problem, naprawiony; (2) niejasna relacja `DECISION_REQUIRED` vs `ABC-OCZEKUJE` — rozstrzygnięte jako dwie warstwy tego samego stanu, ustawiane razem; (3) rejestr duplikatów bez infrastruktury — oznaczone jako nieaktywne do decyzji właściciela; (4) brak ścieżki pliku dla decyzji ABC — rozstrzygnięte jako `runs/<ID>/decision-abc.md` (zgłoszenie) + istniejące `PYTANIA-OTWARTE.md`/`docs/decyzje/<ID>.md` (decyzja), bez trzeciego równoległego kanału; (5) brak mechanicznej egzekwowalności — dodana sekcja kryteriów FAIL wyżej; (6) domena bez miejsca w kontrakcie raportu — dopisane wymaganie zmiany §7; (7) watchdog vs pula 6 — doprecyzowane; (8) właściciel odblokowania `INTEGRATION_PENDING` — dopisany (orkiestrator).
