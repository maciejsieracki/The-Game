# R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 — obrona Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1
GOAL: zwycięska armia w bitwie AUTO/SKIP ściga rozbitego wroga pełnym zasięgiem ruchu własnej jednostki (kod bez zmian w tej rundzie; odpowiedź na zarzuty 20-evaluator-claude.md).
ZMIANY/COMMIT: brak zmian kodu w tej rundzie. Kod operatora = 80c31eb96 (baza fef330d84). Commit tej rundy zawiera wyłącznie ten plik raportu. SHA: patrz pole sha w odpowiedzi strukturalnej (commit obrony nad 80c31eb96).

## Odpowiedzi na zarzuty Evaluatora

Zarzut 1 (cel niepełny; UWAGA-1, kolizja w `_resolveAutoBatchMovement`): ODRZUCAM jako zakres tego tematu, z dowodem.
- Dispatch ETAP 2b: jeśli przyczyna jest INNA niż sufity tempa, opisać ją i zaproponować poprawkę jako DECISION_REQUIRED, bez zmiany reguł gameplay bez zgody właściciela. Dane z `evidence/pp-scen1-fix.json` pokazują, że po poprawce sufit konnicy = +inf (pc = None) od tury 3, a mimo to 1–3 kroki przy puli 7 i zaplanowanych 2–7. Sufit tempa przestał więc być przyczyną; zostaje blokada ścieżki przez zajęte hexy (`occupant !== ru`), co jest mechanizmem ruchu, nie regułą tempa.
- Uczciwie: cel właściciela („nie dziobać”) jest osiągnięty tylko częściowo, w scenariuszu z kolizjami wśród własnych jednostek dziobanie może pozostać. Stan zapisany jako DECISION_REQUIRED.

Zarzut 2 (test (a) na atrapie sceny, nie sprawdza faktycznego ruchu): ODRZUCAM jako błąd testu, z dowodem.
- Test `gra/tools/battle-pace-latch-test.cjs` sprawdza to, co dotyczy zatrzasku: wartość `_paceCapFor` i `_lineAdvanceCap` po zerwaniu kontaktu oraz mutację. Ruch faktyczny nie jest objęty tym testem i nie był deklarowany jako objęty; dowód ruchu to pomiar przeglądarkowy (`pp-scen1-fix.json`), wprost opisany w raporcie operatora jako jeden seed.
- Scenariusz integracyjny z prawdziwą sceną w pętli testowej wymagałby nowego harnessu przeglądarkowego; nie dodano go w tej rundzie. Zapisane jako NIE_ZMIERZONO na poziomie testu jednostkowego.

Zarzut 3 (zatrzask nie reaguje na wzwarcie jednostek z `rangedBase = true`): ODRZUCAM, z dowodem.
- Predykat `!u.rangedBase && !isSiegeUnit(u.bu)` istnieje już w bazie fef330d84 (`git show fef330d84:gra/src/battle/battleScene.ts`, linia 8234 w `_meleeContactNow` ustawionym na ten sam predykat co wcześniejszy kontakt tempa; w bazie także linie 6832 i 8333). Zatrzask używa dokładnie tej samej definicji wzwarcia co dotychczasowy sufit tempa (`cache.contact`, `_paceCapFor`). Zmiana predykatu zmieniłaby moment „do pierwszego wzwarcia” przed kontaktem, czyli regułę właściciela z 2026-11-13, której dispatch zakazuje zmieniać. Ta sprzeczność to UWAGA-2 (DECISION_REQUIRED): czy wzwarcie ma liczyć walkę piechoty z zasięgiem ≥2. Skutku w scenariuszu, gdzie kontakt tworzą wyłącznie rangedBase, nie mierzono (NIE_ZMIERZONO), i nie jest to zmieniane w tej rundzie.

Zarzut 4 (NIE_ZMIERZONO: tryb watch, seedy 2–3, scen. 2, zatrzask przy zapisie/wznowieniu; ryzyko rozjazdu AUTO vs SKIP):
- Część dotycząca NIE_ZMIERZONO przyjmuję jako prawdziwą: tryb watch, seedy 2–3 i scen. 2 nie były mierzone w tej rundzie, bo wymagają kolejnych przebiegów przeglądarkowych, a dispatch tej rundy nie nakazuje ich na tym etapie. Pozostaje NIE_ZMIERZONO.
- Argument o determinizmie ODRZUCAM w zakresie „nowego” ryzyka: `_meleeLatched` jest ustawiany w `_refreshMeleeLatch()` na początku każdej tury (`_beginTurn`, linia 5682) oraz w `_paceCapFor` dokładnie w tym samym miejscu, gdzie powstaje `cache.contact` (linie 8258–8261). Zatrzask zmienia wynik tylko po tym, jak `cache.contact` już był prawdziwy w tej samej rundzie, więc ta sama kolejność obliczeń, która wcześniej determinowała sufit AUTO/SKIP, determinuje zatrzask. Brak jest nowego, niezależnego momentu zapisu. Nie jest to dowód; to uzasadnienie kodowe. Test determinizmu 42/42 (`battle-skip-equals-auto-resolve-test`) nie obejmuje scenariusza z zerwaniem kontaktu i to pozostaje NIE_ZMIERZONO.
- Zapis/wznowienie: `_meleeLatched` nie jest w stanie zapisu; zapis w bitwie jest wyłączony (W27, zgodnie z dyspozycją ABC), co potwierdza wpis w rejestrze tematów.

Zarzut 5 (dług Rust zapisany tylko w raporcie operatora, bez wpisu w rejestrze): ODRZUCAM.
- Kryterium (4) dispatchu brzmi „dług Rust: REPIN reguły zatrzasku (zapisz)”. Zapis istnieje w `10-operator-claude.md`, UWAGA-3, z opisem flagi `melee_latched`, resetu i sufiksów.
- Rejestr `dyspozycje/REJESTR-PROSB-I-ZADAN.md` leży poza allowlistą tematu (`runs/<ID>/**`, `gra/src/battle/**`, `gra/tools/*pace*|*line-advance*|*battle-move*`, docs encyklopedii). Wpis do rejestru wykonuje orkiestrator po FC. Wskazuję to jako NASTĘPNY KROK orkiestratora.
- Hasło encyklopedii: operator stwierdził brak hasła o tempie (UWAGA-4). Weryfikacja: w tej rundzie nie uruchamiano ponownego grep na `docs/encyklopedia/**` (node_modules nie ma w worktree obrony; grep nie był wymagany do odpowiedzi). NIE_ZMIERZONO w tej rundzie, zgodnie z zarzutem Evaluatora 5.

Zarzut 6 (trzy pliki evidence JSON, ~40 tys. linii): ODRZUCAM jako zmianę. Dispatch wymaga zrzutów/logów w `runs/<ID>/evidence/`; usunięcie ich naruszyłoby kryterium (1) i (2). Nie zmieniano.

## TESTY (ta runda)

- Kod nie był zmieniany, więc bramki nie były uruchamiane ponownie na nowym kodzie. Bramki z 80c31eb96 odtworzone przez Evaluatora (wynik z jego raportu, nie z pamięci operatora): tsc EXIT 0; battle-pace-latch-test 5/5 pass, mutacja wykryta; czerwone na bazie (a), (a2), (a3) FAIL, 2/5 pass; battle-pace-equal-line-live-test 23/0; battle-line-advance-uniform EXIT 0; battle-skip-equals-auto-resolve-test 42 ok, 0 fail; battle-skip-siege-parity 17/0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6.
- Próba ponownego uruchomienia `node tools/battle-pace-latch-test.cjs` w worktree obrony: MODULE_NOT_FOUND (brak `gra/node_modules`; worktree obrony nie ma zainstalowanych zależności). NIE_ZMIERZONO w tej rundzie. Nie instalowano zależności, żeby nie zwiększać zużycia dysku ponad dispatch.
- `git diff --check`: nie dotyczy (commit zawiera tylko plik raportu).

## BLOKADY

Brak blokad technicznych. Otwarte decyzje właściciela (DECISION_REQUIRED, bez zmian w kodzie):
- UWAGA-1: blokada ścieżki przez zajęte hexy w `_resolveAutoBatchMovement` (konnica 1–3 kroki przy puli 7 po usunięciu sufitu).
- UWAGA-2: predykat wzwarcia a `rangedBase` (Hastati).

## RUNDY

2/5 w sensie zarzutów (runda obrony 1 tego tematu). Ostatni werdykt Evaluatora: PASS-WITH-NOTES, 6 zarzutów; nie wystawiono werdyktu końcowego przez Evaluatora.

## NASTĘPNY KROK

Evaluator/Final Control (SONNET) na 80c31eb96 + commit obrony (tylko raport): ocenić odpowiedzi 1–6. Orkiestrator: decyzja właściciela o UWAGA-1 i UWAGA-2; wpis REPIN do rejestru po FC; osobny temat na tryb watch i scenariusz integracyjny z zerwanym kontaktem.

UWAGI-DLA-ORKIESTRATORA: brak nowych znalezisk poza zakresem tematu. Repozytorium worktree obrony było w stanie detached na 80c31eb96 przed commitem raportu.

DEPLOY/PUSH: NIE WYKONANO
