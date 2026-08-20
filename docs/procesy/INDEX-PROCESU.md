# INDEX PROCESU — mapa nawigacyjna AutoBot

**Cel dokumentu:** jeden indeks wejściowy dla agentów pracujących w repozytorium
Civ „The Game”. Ten plik mówi, **co czytać, gdzie zapisywać i jak sprawdzać
dowody**. Nie jest rejestrem tematów, nie przechowuje statusów tematów ani
decyzji ABC.

**Zakres:** routing AutoBot, hierarchia źródeł, rejestry, artefakty raportów,
bramki integracji i deployu oraz rozróżnienie źródeł aktywnych od historycznych.

**Poza zakresem:** zmiany w `gra/`, przenoszenie lub archiwizowanie istniejących
plików, wpisywanie bieżącej kolejki, statusów tematów albo treści decyzji
właściciela.

---

## 1. Start sesji — kolejność czytania

Przy przejęciu tematu nie zaczynaj od czatu ani od nazwy worktree. Czytaj w tej
kolejności:

1. [`CLAUDE.md`](../../CLAUDE.md) — skrót zasad krytycznych i punkt wejścia.
2. [`STAN-PRACY-HANDOFF.md`](../../STAN-PRACY-HANDOFF.md) — żywy opis stanu,
   decyzji już podjętych i znanych blokad; dokument wskazuje najnowszy handoff.
3. Najnowszy handoff wskazany przez `STAN-PRACY-HANDOFF.md`, obecnie katalog
   [`dyspozycje/_handoff/`](../../dyspozycje/_handoff/), w szczególności plik
   `HANDOFF-FALA-299-2026-08-19.md`. Handoff czytaj jako punkt odniesienia dla
   przejęcia, nie jako zamiennik dowodu w repozytorium.
4. Najnowsze wpisy w
   [`dyspozycje/_handoff/KANAL-PRACA.md`](../../dyspozycje/_handoff/KANAL-PRACA.md),
   ze szczególnym uwzględnieniem `CZEKAM-NA:` i ostatnich przekazań między
   sesjami.
5. Aktywne reguły `.cursor/rules/`: przede wszystkim
   [`autobot-evaluator-operator.mdc`](../../.cursor/rules/autobot-evaluator-operator.mdc),
   [`model-routing.mdc`](../../.cursor/rules/model-routing.mdc),
   [`potrojna-warstwa-weryfikacji.mdc`](../../.cursor/rules/potrojna-warstwa-weryfikacji.mdc),
   [`subagent-watchdog.mdc`](../../.cursor/rules/subagent-watchdog.mdc),
   [`numer-abc-commit-deploy.mdc`](../../.cursor/rules/numer-abc-commit-deploy.mdc)
   i [`zmiany-izolacja.mdc`](../../.cursor/rules/zmiany-izolacja.mdc). Reguły z
   `alwaysApply: true` są obowiązującymi barierami operacyjnymi.
6. [`.claude/skills/civ-autobot/SKILL.md`](../../.claude/skills/civ-autobot/SKILL.md)
   — skrót nakładki Civ.
7. [`docs/decyzje/R-PROC-AUTOBOT.md`](../decyzje/R-PROC-AUTOBOT.md) oraz powiązane
   `R-PROC-AUTOBOT*.md` — pełny opis procesu i bramek.
8. [`playbook.md`](../../playbook.md) **w całości** — aktywne reguły,
   obserwacja, reguły chronione i rejestr błędów. Następnie odczytaj
   [`dyspozycje/autobot/playbook.json`](../../dyspozycje/autobot/playbook.json)
   jako wygenerowany obraz operacyjny.
9. Rejestry tematu: `REJESTR-PROSB-I-ZADAN.md`, `PYTANIA-OTWARTE.md`,
   właściwy `docs/decyzje/<ID>.md`, raporty w `dyspozycje/autobot/logs/` oraz
   właściwy handoff.
10. Dopiero na końcu sprawdź faktyczny stan Git/worktree i artefaktów integracji:
    `WERSJE.md`, `KANAL-PRACA.md`, commit, diff, testy i — jeśli dotyczy —
    manifest/verify deployu.

Jeśli temat jest zmianą samego AutoBota, dodatkowo przeczytaj mapę warstw
[`dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md`](../../dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md).

Nie czytaj `gra/` jako części tego indeksu. Ten dokument nie zmienia i nie
weryfikuje plików gry.

---

## 2. Pierwszeństwo źródeł przy konflikcie

Nie ma jednego pliku, który jednocześnie opisuje normę procesu, stan bieżący,
decyzje właściciela i dowody wdrożenia. Stosuj poniższą hierarchię zakresową:

| Zakres konfliktu | Pierwszeństwo | Co zrobić z niższym źródłem |
|---|---|---|
| Decyzja właściciela | Najnowsze, jednoznaczne ustalenie właściciela zapisane plikowo: ECHO w `PYTANIA-OTWARTE.md` oraz właściwe `docs/decyzje/<ID>.md`, z pełnym ID i datą | Starszy opis oznacz jako historyczny w interpretacji; nie zgaduj nowej decyzji |
| Aktywna norma procesu | Najnowszy aktywny zapis `docs/decyzje/R-PROC-AUTOBOT*.md`, egzekwowany przez `.cursor/rules/*.mdc` z `alwaysApply: true` | Nie wybieraj po cichu sprzecznej kopii; zgłoś rozjazd do korekty źródła |
| Stan przejęcia | Najnowszy handoff wskazany w `STAN-PRACY-HANDOFF.md` oraz najnowszy kanał pracy | Starsze sekcje handoffu są historią i nie nadpisują nowszego punktu odniesienia |
| Pamięć AutoBota | `playbook.md` jest źródłem treści reguł; `playbook.json` jest generowanym obrazem | Nie edytuj JSON ręcznie; nie przywracaj starej reguły z pamięci lub czatu |
| Dowód integracji/deployu | Faktyczny artefakt, commit, test, manifest/verify, `WERSJE.md` i `KANAL-PRACA.md` | Sam status, nazwa worktree, stary plik, UI ani wiadomość nie wystarczają |

Źródło decyzji właściciela: właściwe ECHO w `dyspozycje/PYTANIA-OTWARTE.md`
oraz powiązany dokument `docs/decyzje/<ID>.md`. Ten indeks zawiera wyłącznie
odsyłacz do źródeł, nie treść decyzji ani jej status.

Ten indeks jest mapą. Nie zastępuje źródła normatywnego, nie rozstrzyga za
właściciela i nie legalizuje sprzecznego zapisu w innym pliku.

---

## 3. Aktywny routing AutoBot i odpowiedzialności

Obowiązujący łańcuch przygotowania paczki:

```text
Operator GPT-5.6 Luna High
    → Evaluator GPT-5.6 Luna High
    → Final Control GPT-5.6 Luna High (osobny subagent)
    → integracja przez głównego orkiestratora GPT-5.6 Luna Medium
    → READY_FOR_DEPLOY
    → osobna bramka deploy/push na wyraźne polecenie właściciela
```

| Etap | Rola/model | Odpowiedzialność | Czego etap nie robi |
|---|---|---|---|
| 1 | Operator — GPT-5.6 Luna High | Wykonuje jeden temat w izolacji, zgodnie z kontraktem, i zapisuje artefakt oraz raport | Nie ocenia własnej pracy, nie integruje, nie deployuje i nie pushuje |
| 2 | Evaluator — GPT-5.6 Luna High | Niezależnie sprawdza zakres, regresję, metryki, testy, artefakt i blokady; wydaje werdykt | Nie zastępuje Operatora, nie integruje, nie deployuje/pushuje |
| 3 | Final Control — GPT-5.6 Luna High, osobny subagent | Kontroluje kompletność śladu Operatora i Evaluatora, zgodność z celem, bramki i gotowość do integracji; raportuje **gotowość do integracji** | Nie integruje, nie deployuje, nie pushuje i nie wystawia samodzielnie `READY_FOR_DEPLOY` |
| 4 | Główny orkiestrator — GPT-5.6 Luna Medium | Po pozytywnym Final Control weryfikuje stan, integruje wyłącznie zatwierdzony zakres i potwierdza zintegrowaną paczkę | Nie omija raportów ani bramek; `READY_FOR_DEPLOY` wystawia dopiero po faktycznej integracji |
| 5 | Deploy/push — osobna bramka | Publikuje dopiero zintegrowaną paczkę po `READY_FOR_DEPLOY` i wyraźnym poleceniu właściciela | Nie wynika automatycznie z żadnego raportu ani z samego commita |

Raport Operatora uruchamia Evaluatora bez dodatkowego popychania właściciela.
Raport Evaluatora nie kończy tematu. Raport Final Control także nie kończy
tematu: jest dowodem gotowości do integracji, po którym orkiestrator Medium
wykonuje integrację. Dopiero zintegrowana paczka może otrzymać
`READY_FOR_DEPLOY`.

Wyjątki modelowe dla pracy w `gra/src/render/**` pozostają osobną regułą domenową
i nie zmieniają podstawowego routingu tego indeksu. Przy konflikcie zawsze wróć
do sekcji 2 i do najnowszego ustalenia właściciela.

---

## 4. GOAL — obowiązkowy cel końcowy

Każdy temat musi przed dispatchiem mieć jawnie zapisany cel końcowy:

```text
GOAL: <co ma istnieć po zakończeniu procesu>
KRYTERIA KOŃCA: <mierzalne warunki i artefakty dowodowe>
```

Cel nie może brzmieć tylko „przygotuj raport”, „sprawdź”, „zrób diff” albo
„doprowadź do PASS”. Raport jest etapem, nie celem.

Dla procesu naprawczego cel brzmi co najmniej:

> **Przygotowana i zintegrowana paczka `READY_FOR_DEPLOY`, z pełnym ID,
> allowlistą plików, dowodem testów/bramek i bez niezwiązanych zmian.**

Dlatego nie kończą procesu:

- raport Operatora;
- `PASS` lub `PASS-WITH-NOTES` Evaluatora;
- raport Final Control o gotowości do integracji;
- sam commit, branch, worktree, „gotowe”, „działa” albo `GOTÓW DO TESTU`;
- sama informacja z czatu lub interfejsu.

Po osiągnięciu `READY_FOR_DEPLOY` deploy i push pozostają osobną bramką.
Nie wykonuj ich bez wyraźnego polecenia właściciela i wymaganych kontroli.

---

## 5. Pętla domknięcia — ten sam ID aż do celu

Jeden temat zachowuje to samo pełne ID przez wszystkie rundy. Nie twórz nowego
ID tylko dlatego, że Operator dostał poprawki.

```text
Operator → Evaluator → Final Control
      ↑         │             │
      └─────────┴─────────────┘  po FAIL/BLOCK/konflikcie/braku gotowości

Final Control: gotowość do integracji
      → główny orkiestrator Medium: integracja
      → READY_FOR_DEPLOY
```

Wyniki wymagające natychmiastowej kolejnej rundy:

- `FAIL` — wraca do Operatora z konkretną listą poprawek, potem do Evaluatora;
- techniczny `BLOCK` — wraca do Operatora i Evaluatora z tym samym ID;
- `TIMEOUT`, `INFRA`, `ZWIS` — wraca do tej samej pętli bez czekania;
- niegotowość lub konflikt wykryty przez Final Control — wraca do Operatora,
  następnie przez Evaluatora i ponownie przez Final Control;
- nieprawidłowa izolacja, allowlista, testy albo artefakt integracji — temat
  pozostaje aktywny i wraca do pętli.

Jedyną pauzą procesu jest **ABC wymagające decyzji właściciela**. Taki temat
czeka w rejestrze ABC, ale niezależne tematy nadal pracują. Po odpowiedzi
właściciela wróć do tego samego ID i kontynuuj.

`ZWIS` nie oznacza anulowania. Po przekroczeniu progu watchdogu orkiestrator
przejmuje temat i odtwarza dalszy obieg. Anulowanie wymaga wyraźnego polecenia
właściciela.

---

## 6. Gdzie rejestrować temat, ABC i decyzję właściciela

### Zgłoszenie i ID

Każde zgłoszenie, bug, prośba, audyt i zmiana reguły procesu dostaje pełne ID
w [`dyspozycje/REJESTR-PROSB-I-ZADAN.md`](../../dyspozycje/REJESTR-PROSB-I-ZADAN.md).
Rejestr jest punktem startowym pracy i jedynym rejestrem śledzenia próśb, ale
sam wpis nie jest dowodem wykonania.

### Aktywne ABC

Pełne, otwarte pytania ABC przechowuj w
[`dyspozycje/PYTANIA-OTWARTE.md`](../../dyspozycje/PYTANIA-OTWARTE.md): pełne ID,
sytuacja, cel pytania, powód, A/B/C, za/przeciw i rekomendacja. Nie przechowuj
aktywnego ABC wyłącznie w czacie ani w tym indeksie.

### Decyzja właściciela

Po odpowiedzi właściciela zapisz ECHO w `PYTANIA-OTWARTE.md`, a kontrakt decyzji
w [`docs/decyzje/<ID>.md`](../decyzje/). W rejestrze zachowaj odwołanie do
decyzji i właściwy dowód. Nie zamieniaj odpowiedzi „chyba”, luźnej rozmowy ani
rekomendacji agenta w decyzję ABC.

Pytania i odpowiedzi właściciela prowadź w głównym czacie orkiestratora.
Poboczne czaty Operatora, Evaluatora i Final Control są kanałami technicznymi;
nie są drugim miejscem decyzji ani źródłem kontekstu dla właściciela.

---

## 7. Gdzie zapisywać raporty i dowody etapów

Raport terminalny każdej roli zapisuj jako artefakt w
[`dyspozycje/autobot/logs/`](../../dyspozycje/autobot/logs/), z pełnym ID w nazwie
i treści. Konwencja nawigacyjna:

```text
dyspozycje/autobot/logs/<ID>-operator.md
dyspozycje/autobot/logs/<ID>-evaluator.md
dyspozycje/autobot/logs/<ID>-final-control.md
```

Raport musi zawierać co najmniej:

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA
TEMAT: <pełne ID>
GOAL: <jawny cel końcowy>
ZMIANY: pliki, artefakt i commit albo „brak zmian”
TESTY: dokładne wyniki albo powód nieuruchomienia
BLOKADY: jawna lista albo „brak”
NASTĘPNY KROK: Evaluator / poprawka / Final Control / integracja / ABC
DEPLOY/PUSH: wykonano albo nie wykonano
```

Raport Final Control ma dodatkowo jasno powiedzieć, czy istnieje **gotowość do
integracji**. Nie może używać tej deklaracji do samodzielnego wystawienia
`READY_FOR_DEPLOY`.

Wnioski i postmortemy zapisuj w append-only
[`dyspozycje/autobot/logs/postmortems.jsonl`](../../dyspozycje/autobot/logs/postmortems.jsonl),
zgodnie z formatem playbooka. Meldunek przekazania między sesjami zapisuj w
[`dyspozycje/_handoff/KANAL-PRACA.md`](../../dyspozycje/_handoff/KANAL-PRACA.md),
ale kanał jest wskaźnikiem i śladem obiegu — nie zastępuje raportu artefaktowego.

---

## 8. Gdzie sprawdzać integrację i deploy

### Integracja i `READY_FOR_DEPLOY`

Przed potwierdzeniem gotowości główny orkiestrator sprawdza niezależnie:

1. raport Operatora, raport Evaluatora i raport Final Control w `dyspozycje/autobot/logs/`;
2. pełne ID, jawny GOAL i zgodność z `docs/decyzje/<ID>.md`;
3. allowlistę plików, diff, commit i brak zmian niezwiązanych;
4. wyniki testów/bramek oraz ewentualne noty `PASS-WITH-NOTES`;
5. stan faktyczny worktree/Git — nie opis agenta;
6. zapis integracji w artefakcie/commicie oraz odpowiedni meldunek w `KANAL-PRACA.md`.

Final Control raportuje gotowość do integracji. Integrację wykonuje dopiero
główny orkiestrator GPT-5.6 Luna Medium. Po faktycznym wpięciu zatwierdzonego
zakresu i przejściu bramek orkiestrator może wystawić `READY_FOR_DEPLOY`.

### Deploy/push

Po `READY_FOR_DEPLOY` sprawdzaj:

- [`dyspozycje/WERSJE.md`](../../dyspozycje/WERSJE.md) — jedyny rejestr opublikowanych
  wersji/bundli: md5, stempel, źródłowy commit, zakres i status;
- [`dyspozycje/_handoff/KANAL-PRACA.md`](../../dyspozycje/_handoff/KANAL-PRACA.md) —
  meldunek między sesjami i `CZEKAM-NA:`;
- najnowszy handoff oraz faktyczny stan Git, aby nie publikować starego lub
  obcego artefaktu.

`WERSJE.md` nie jest dowodem samego `READY_FOR_DEPLOY`; rejestruje publikację
dopiero po wykonanym deployu. Deploy/push to osobna bramka, wymaga wyraźnego
polecenia właściciela i nie może być wykonywany przez Operatora, Evaluatora ani
Final Control.

---

## 9. Playbook, źródła aktywne i historia

- [`playbook.md`](../../playbook.md) — źródło treści aktywnych reguł playbooka,
  reguł obserwowanych, chronionych i rejestru błędów.
- [`dyspozycje/autobot/playbook.json`](../../dyspozycje/autobot/playbook.json) —
  wygenerowany obraz operacyjny; nie edytuj ręcznie. Aktualizację zaczyna się w
  `playbook.md`, a zgodność sprawdza generatorem
  `dyspozycje/autobot/tools/playbook-md-to-json.cjs`.
- Raporty i logi są pamięcią dowodową przebiegów, nie normą zastępującą decyzję
  właściciela ani aktywny kanon.

Za aktywne uznawaj wyłącznie źródła oznaczone jako bieżące/obowiązujące albo
potwierdzone najnowszym handoffem, aktualną decyzją właściciela i faktycznym
artefaktem. Za historyczne uznawaj sekcje i pliki oznaczone `ARCHIWUM`,
`SUPERSEDED`, `ZASTĄPIONA`, dawne routingi modeli, stare fale oraz raporty
opisujące poprzedni stan.

Samo położenie pliku w katalogu, świeży timestamp, nazwa `latest`, gałąź,
worktree, status w tabeli lub nieprzekreślony stary akapit nie dowodzi aktywności.
Przy nieoznaczonym konflikcie zatrzymaj interpretację, porównaj datę i ECHO,
sprawdź artefakt oraz skieruj rozjazd do korekty źródła.

---

## 10. Zasada dowodowa — czat nie wystarcza

Czat główny jest miejscem komunikacji właściciela i przekazania wyniku przez
orkiestratora, ale **czat nie jest jedynym dowodem**. Nie wolno uznać tematu za
wykonany na podstawie:

- samego komunikatu „gotowe”;
- samego raportu Operatora, Evaluatora lub Final Control;
- samego statusu w rejestrze;
- samego worktree, brancha, UI `działa` albo `GOTÓW DO TESTU`;
- `not_found` bez raportu i artefaktu;
- starego pliku lub starej wersji `WERSJE.md`.

Minimalny ślad procesu to pełne ID + GOAL + raporty ról + artefakt/commit +
wyniki testów/bramek + zapis integracji. Dla publikacji dochodzą `WERSJE.md`,
`KANAL-PRACA.md`, md5/stempel i weryfikacja właściwego bundla. Jeśli któregoś
dowodu nie ma, status dowodowy brzmi „brak dowodu / niepewne”, a nie „gotowe”.

---

## 11. Czego ten indeks nie robi

- Nie dopisuje ani nie zamyka zgłoszeń w rejestrach.
- Nie przechowuje listy aktywnych tematów ani ich statusów.
- Nie przechowuje liter ABC ani nie podejmuje decyzji właściciela.
- Nie zastępuje `R-PROC-AUTOBOT.md`, reguł `alwaysApply`, handoffu, logów,
  rejestru próśb, dokumentu decyzji ani `WERSJE.md`.
- Nie wykonuje integracji, deployu ani pushu.
- Nie dotyka `gra/`.
