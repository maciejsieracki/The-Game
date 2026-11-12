# Błędy procesu web i procedury (zapis 2026-11-12)

Ten plik jest obowiązkowo czytany przed każdą zmianą statusu tematu, taska albo raportu.

## Błędy, które popełniłem i których nie powtarzam

1. **Status z tytułu lub z istnienia dispatchu.** Dispatch w docs-branchu nie znaczy, że temat jest wdrożony ani nawet uruchomiony. Oznaczałem taski jako zakończone na podstawie samego dispatchu. Poprawka: status „zrobione" tylko po dowodzie w `origin/main` (commit w linii historii, `git merge-base --is-ancestor`) albo po werdykcie FC z raportem w `runs/<ID>/50-final-control-claude.md`.
2. **Szukanie wdrożenia po tytułach commitów.** Grep po tytułach daje fałszywe braki i fałszywe trafienia. Poprawka: sprawdzać także pełną treść commitów (`git log --grep`) i kod (`git grep` w `gra/src`), a dopiero potem wnioskować.
3. **Wniosek przed weryfikacją.** Ogłosiłem „sprawdziłem, nie ma" zanim przeszukałem kod. Poprawka: najpierw `git grep`, potem zdanie o wyniku, z podaniem zapytania i liczby trafień.
4. **Pusty slot w pętli.** Heartbeat zastał trzy aktywne tematy i tylko to zraportował. Poprawka: przy mniej niż 4 aktywnych tematach uruchamiać następny z `KOLEJKA-WEB.md` w tej samej turze, a nie czekać na właściciela.
5. **Limit 4 vs wznowienie.** Krok „wznów W35" w heartbeat kolidował z limitem 4 aktywnych. Poprawka: wznowienie tylko wtedy, gdy liczba aktywnych jest poniżej 4.
6. **Stalone workflowy po restarcie sesji.** Po restarcie workery stoją z ostatnim zapisem sprzed restartu. Poprawka: aktywny = agent-*.jsonl zmodyfikowany w ciągu 10 minut; stary bez zapisu wznawiać `resumeFromRunId`, nie zakładać, że trwa.
7. **Model Operatora w nagłówku dispatchu.** Dispatch deklarował Sonnet, a skrypt wymusza Haiku bez dwóch porażek. Poprawka: nagłówek dispatchu musi być zgodny z `opModel` przekazywanym do skryptu.
8. **Taski bez aktualizacji po raportach.** Taski zostawały „w toku" albo „zakończone" niezgodnie z raportem. Poprawka: po każdym werdykcie FC i po każdym zgłoszeniu właściciela aktualizować task tego samego dnia.
9. **Diagnoza bez zrzutu i pomiaru.** Pierwsza hipoteza błędu BOOT ERROR była prawdopodobna, ale nie zmierzona. Poprawka: diagnoza z zrzutu, potem pomiar w Chromium, potem zlecenie.
10. **Miejsce na dysku.** Wolne miejsce spadło do 5,5 GB, poniżej progu 6 GB. Poprawka: sprzątanie worktree zakończonych workflowów zanim cokolwiek nowego wystartuje.

## Procedura przed każdą zmianą statusu

- Zakończony temat: commit w `origin/main` + werdykt FC w `runs/<ID>/`. Bez obu — status „w toku" albo „do weryfikacji".
- Zgłoszenie właściciela: task z jego treścią dosłownie, status zgodny z dowodem.
- Pozycja z listy „do zrobienia": sprawdzić `git grep` w kodzie i `git log --grep` w pełnej treści commitów, przed napisaniem, że jest lub jej nie ma.
- Przed wnioskiem o braku: wpisać zapytanie, liczbę trafień i miejsce przeszukania.

## Stan na 2026-11-12 (do weryfikacji przy następnej zmianie)

- Wdrożone i potwierdzone: łupy z miast-państw (`7f5285dd4` w main), panel rekrutacji bez przewijania (`31f517e01`, `4c20910c6`).
- Częściowo: sojusznik dołączający do wojny na wezwanie — brak prośby po ataku na sojusznika (task #296).
- Do potwierdzenia: machiny oblężnicze budowane tylko podczas oblężenia, 1 na 10, koszt z zasobów (task #297).
- W toku: przełącznik trafień (`6fef8773c`, FC PASS-WITH-NOTES, do integracji po zwolnieniu miejsca na dysku).

## Korekta 2026-11-12 (po weryfikacji)

- **Sojusznik wzywa do wojny (task #296): WDROŻONE.** Potwierdzone w kodzie i przez właściciela. Commit `ab0ec32f1` (feat: persist alliance war calls, 11.11) i test `8ee813d7b` są w `origin/main`. Mechanizm: `enqueueAllianceWarCall` (main.ts ~21419) wstawia prośbę do `pendingDiplomacyInbox` z `cmdType: alliance_war_call`; `resolveAllianceWarCall` (~21445) obsługuje Dołącz/Odrzuć; `allianceWarCallHistory` zapisuje joined/refused/expired. Dispatch `eb733306c` został zrealizowany tym commitem, nie osobnym workflow. Błąd procesu: uznałem to za niewdrożone, bo szukałem po słowach „dołącz do wojny” i „wezwanie”, a kod używa nazw `alliance_war_call` i `enqueueAllianceWarCall`. Poprawka: szukać po identyfikatorach z dispatchu i po `git log -S` nad nazwą funkcji, nie po tekście UI.
- **Machiny oblężnicze (task #297): NIE POTWIERDZONE.** Istnieje kolejka budowy (`siegeMachines.ts`, merge `c37106ed0`), ale brak dowodu na reguły „tylko podczas oblężenia, 1 na 10, koszt z zasobów”.

## Korekta 2026-11-12 (machiny oblężnicze, task #297): WDROŻONE

- Budowa tylko w oblężeniu, 1 machina na 10 jednostek na turę, koszt z zasobów: commit `6218f2ab1` w `main`, `game/siege-engine-build.ts`, test `siege-engines-built-during-siege-test.cjs`. Zgłoszenie w rejestrze z 2026-11-09.
- Widoczność machin wg technologii: `visibleSiegeEngineOptions` (`siege-engine-build.ts:106`) używane w `main.ts:18098`. FALA 654 (`af12bab71`): bez machin przycisk Szturm wyłączony. Rejestr: 2026-11-11/12.
- Otwarte: potwierdzenie w żywej grze (Chromium), przy odblokowanej i zablokowanej technologii.
- Błąd procesu: poprzednio napisałem „nie potwierdzono”, bo nie sprawdziłem rejestru i nie znalazłem nazwy „W18” w rejestrze. Zgłoszenie było zapisane pod innymi słowami („Taran wymaga Obróbki drewna”, „bez machin oblężniczych”). Poprawka: przeszukiwać rejestr po kilku sformułowaniach (machin, maszyn, oblęż, taran, technolog) i po dacie.
