---
name: civ-autobot-cursor-automations
description: >
  Trzecia ścieżka dispatchu AutoBot dla Civ: Cursor Automations — zawsze-włączeni
  agenci uruchamiani zdarzeniem (PR, Slack, webhook, Linear/Sentry/PagerDuty) lub
  harmonogramem, bez człowieka w pętli przy każdym uruchomieniu. Używaj WYŁĄCZNIE
  gdy pracujesz jako skonfigurowana w Cursorze Automation tego repo. Zakres pracy:
  wyłącznie recon i poziom Operatora, zakończony otwarciem PR. NIGDY samodzielna
  integracja, merge, deploy ani push do `main`.
---

# Civ — AutoBot dispatch przez Cursor Automations (Ścieżka C)

Ten skill jest **w pełni samodzielny** — dotyczy WYŁĄCZNIE Cursor Automations i
celowo żyje osobno od reguł współdzielonych przez pozostałe sesje pracujące nad
tym repo (Claude Code, Cursor w trybie interaktywnym). Właściciel (Maciej)
zdecydował wprost: to, co projektowane dla Cursora, nie ma wpływać na to, czego
używają pozostałe sesje — dlatego cała specyfika tej ścieżki (limity, rejestracja,
checklist) jest tu, w jednym pliku, nie rozproszona po wspólnym kanonie. Możesz
używać tego skilla w izolacji, bez czytania niczego innego.

Dla orientacji (opcjonalny kontekst, nie wymagana lektura): pozostałe sesje w
tym repo rozróżniają Ścieżkę A (Workflow, `civ-autobot-workflow/SKILL.md`) i
Ścieżkę B (prompt-only, `civ-autobot/SKILL.md` / `autobots/SKILL.md`) —
patrz `playbook.md` C-061. Ten skill jest wobec nich nieformalnie „Ścieżką C",
ale nie jest wpisany do tamtej wspólnej tabeli reguł ani do wspólnego dokumentu
normy procesu (`docs/decyzje/R-PROC-AUTOBOT.md`) — świadomie, na życzenie
właściciela. Różni się od obu tamtych ścieżek tym, że nie ma żadnego człowieka
(właściciela) inicjującego temat w głównym czacie — Automation startuje sama, z
zewnętrznego zdarzenia.

**Incydent źródłowy (2026-08-21):** właściciel zapytał o funkcję Cursor
Automations po researchu dotyczącym orkiestracji agentów w tym projekcie i
zdecydował: zakres tej ścieżki to WYŁĄCZNIE recon + praca na poziomie Operatora,
zakończona otwarciem PR — nigdy samodzielna integracja, merge, deploy ani push
do `main`. To ograniczenie jest twarde i nie podlega interpretacji przez samą
Automation.

## 0. Warunki wstępne — sprawdź PRZED użyciem tego skilla

1. Pracujesz jako **Cursor Automation skonfigurowana dla tego repo** (nie sesja
   interaktywna z właścicielem w czacie). Jeśli to sesja interaktywna — wróć do
   `civ-autobot/SKILL.md` albo `civ-autobot-workflow/SKILL.md`, ten plik nie
   dotyczy Ciebie.
2. Automation jest **ograniczona do repo/branchy tego projektu** — nie ma
   uprawnień poza tym repozytorium (multi-repo scope tej Automation, jeśli
   istnieje, musi być jawnie znany i nie obejmować niepowiązanych projektów).
3. Automation ma skonfigurowany dostęp do GitHub wystarczający do otwarcia PR
   (nie do mergowania — merge nie jest jej rolą, patrz §2).
4. Jeśli Automation działa w trybie „no-repo" (tylko Slack/webhook/MCP, bez
   edycji kodu) — ten skill w części dotyczącej PR jej nie dotyczy, ale **krok 0
   (rejestracja) obowiązuje zawsze**, niezależnie od trybu.

## 1. Krok 0 — rejestracja PRZED jakąkolwiek pracą (obowiązkowy, bez wyjątków)

Cały istniejący kanon AutoBot (C-043 „JEDEN KANAŁ DLA WŁAŚCICIELA", C-027 „każde
zgłoszenie rejestrowane w tej samej turze") zakłada, że temat zaczyna się przez
właściciela w głównym czacie orkiestratora. Automation z definicji NIE MA
głównego czatu — uruchamia się z zewnętrznego zdarzenia (nowy PR, wiadomość
Slack, webhook, cron), bez wiadomości Macieja. To nie jest powód, żeby ominąć
rejestrację z C-027 — jest to namiastka rejestracji zgodna z jej duchem mimo
braku czatu.

**Zanim tkniesz jakikolwiek kod, wykonaj oba zapisy:**

1. `dyspozycje/autobot/runs/<ID>/00-dispatch.md` — ten sam kształt co przy
   dispatchu ręcznym (`STATUS`, `TEMAT`, `GOAL`, `KRYTERIA KOŃCA`, `ALLOWLISTA`,
   `IZOLACJA`, `PLAN TESTÓW`, `DEPLOY/PUSH: NIE WYKONANO` — to pole zostaje
   `NIE WYKONANO` przez cały cykl życia tematu w tej ścieżce, patrz §2), plus
   nowe pole `TRIGGER` opisujące dokładnie zdarzenie, które uruchomiło tę
   Automation.
2. Wpis w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`, w tym samym formacie co inne
   tematy (`## <ID> — <tytuł> (<data>)`, potem `**Zgłoszenie właściciela:**`,
   `**GOAL:**`, `**STATUS:**`), z JEDNĄ różnicą: polem **„Zgłoszenie
   właściciela"** jest OPIS ZDARZENIA WYZWALAJĄCEGO, nie fikcyjna wypowiedź
   Macieja. Przykład: „Automation `nazwa-automation`, trigger: PR #123 na
   `github.com/<org>/<repo>`, otwarty przez `<autor>`, 2026-08-21." — nigdy nie
   wymyślaj ani nie parafrazuj tego jako gdyby to była prośba właściciela
   wypowiedziana wprost.

Dopiero PO obu zapisach Automation robi recon albo jakąkolwiek pracę na
plikach. Kolejność jest sztywna: rejestracja → recon → praca — nie odwrotnie,
nawet jeśli zdarzenie wygląda na trywialne.

## 2. Dozwolony zakres pracy — recon + Operator, TWARDA granica

Automation w tej ścieżce wolno:

- **Recon** — czytanie kodu, dokumentacji, historii, uruchamianie bramek/testów
  READ-ONLY (nie zmieniają stanu repo).
- **Praca na poziomie Operatora** — te same zasady co Operator w Ścieżce B:
  zakres = allowlista zapisana w `00-dispatch.md`, izolacja (worktree/branch
  dedykowany dla tego tematu), plan testów wykonany i udokumentowany w raporcie.
- **Otwarcie Pull Requestu** jako JEDYNE wyjście pracy kodowej. Nie bezpośredni
  commit do głównej gałęzi, nie push bez PR, nawet jeśli Automation technicznie
  ma do tego uprawnienia.

Automation w tej ścieżce **NIGDY** nie wolno:

- Samodzielnie mergować/scalać PR do `main` (ani do żadnej gałęzi integracyjnej
  traktowanej jak `main`).
- Deployować — ROBOCZA, KANON ani FINALNA nie są w jej gestii.
- Pushować bezpośrednio do `main` z pominięciem PR.
- Wystawiać `READY_FOR_DEPLOY` — ten status wymaga Final Control i integracji
  orkiestratora (C-042, C-044), których Automation strukturalnie nie ma.

Pole `DEPLOY/PUSH` w `00-dispatch.md` i w raporcie końcowym Automation zostaje
`NIE WYKONANO` przez cały czas jej udziału w temacie — zmienia je dopiero
orkiestrator/właściciel PO scaleniu PR, poza tym skillem.

Otwarty PR jest strukturalnym **STOP** tej ścieżki: przegląd treści i decyzja
o scaleniu są wyłącznie w rękach Macieja. Może się to odbyć w rozmowie z
orkiestratorem (nie musi być literalnie „główny czat", skoro Automation to
inny kanał niż interaktywna sesja) — ale integracja i deploy nigdy nie dzieją
się automatycznie ani przez samą Automation, ani przez kolejne, niezależne
uruchomienie tej samej Automation.

**Kryterium FAIL** (dla przeglądu przez właściciela/orkiestratora, niezależnie
od jakości samego kodu): Automation, która scaliła/zmergowała lub zdeployowała
cokolwiek bez przeglądu właściciela, jest uznawana za nieudaną — bez wyjątków,
bez względu na to, jak dobry byłby wynik.

## 3. Rola „Evaluator" w tej ścieżce — recenzja PR, nie subagent

W Ścieżce A i B, Evaluator jest osobnym dispatchem (subagent albo faza
Workflow) uruchamianym automatycznie po raporcie Operatora, w tej samej pętli
AutoBot (C-044). **W Ścieżce C tego nie ma** — Automation nie ma dostępu do
wielo-agentowej orkiestracji (Workflow) tak jak sesja Claude Code, więc nie
udaje adwersaryjnego Evaluatora wewnątrz siebie ani nie deklaruje fałszywego
`PASS` bez niezależnej weryfikacji.

Rolę Evaluatora dla pracy tej Automation pełni **zwykła, ludzka lub
AI-wspomagana recenzja otwartego PR przez właściciela albo orkiestratora**,
wykonana PO tym jak Automation skończyła pracę i otworzyła PR — nie równolegle,
nie w środku tej samej Automation. Automation może (i powinna) zostawić w opisie
PR i w `00-dispatch.md`/raporcie wszystko, co ułatwi tę recenzję: allowlistę,
plan testów, wynik bramek, znane ryzyka — ale sama nie wydaje werdyktu
`PASS`/`FAIL` w znaczeniu C-044.

## 4. Raport końcowy Automation

Raport (w PR i/lub w `dyspozycje/autobot/runs/<ID>/01-operator.md`) zawiera te
same pola co raport Operatora w Ścieżce B (`STATUS`, `DOMAIN`, `TEMAT`, `GOAL`,
`ZMIANY/COMMIT`, `TESTY`, `BLOKADY`, `NASTĘPNY KROK`, `DEPLOY/PUSH`), plus:

- `TRIGGER` — dokładny opis zdarzenia wyzwalającego (skopiowany z `00-dispatch.md`).
- `PR` — link do otwartego Pull Requestu; brak PR = temat nie jest zamknięty w
  tej ścieżce, niezależnie od stanu kodu.
- Jawne stwierdzenie: „dispatch przebiegł Ścieżką C (Cursor Automations),
  zakres = recon + Operator, integracja/merge/deploy NIE zostały wykonane
  przez tę Automation" — analogicznie do wymogu C-061 dla Ścieżek A/B.

## 5. Checklist przed zamknięciem uruchomienia Automation

- [ ] `00-dispatch.md` (z polem `TRIGGER`) zapisany PRZED jakąkolwiek pracą na kodzie.
- [ ] Wpis w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` z polem „Zgłoszenie
      właściciela" = opis zdarzenia wyzwalającego, nie fikcyjna wypowiedź.
- [ ] Praca ograniczona do allowlisty i izolowanej gałęzi/worktree tego tematu.
- [ ] Jedyne wyjście kodowe = otwarty PR — brak bezpośredniego commita/push do `main`.
- [ ] Brak jakiejkolwiek próby merge/deploy przez tę Automation.
- [ ] Pole `DEPLOY/PUSH` pozostaje `NIE WYKONANO`.
- [ ] Raport końcowy zawiera `TRIGGER`, link do PR i jawne stwierdzenie Ścieżki C.
- [ ] Rola Evaluatora pozostawiona przeglądowi PR przez właściciela/orkiestratora
      — Automation nie deklaruje własnego `PASS`/`FAIL`.

## 6. Powiązane

Ten skill jest kompletny sam w sobie — poniższe to wyłącznie dodatkowy
kontekst/inspiracja formatu dla kogoś, kto chce zrozumieć skąd wzięły się te
konwencje we wspólnym kanonie repo; nic z tego nie trzeba czytać, żeby
poprawnie uruchomić Automation w tej ścieżce.

- `playbook.md` C-043 (jeden kanał dla właściciela), C-027 (rejestracja w tej
  samej turze), C-044 (kanon routingu), C-059 (integracja allowlist-only —
  dotyczy orkiestratora PO scaleniu PR), C-061 (dwie ścieżki dispatchu z
  `effort`, dla sesji Claude Code/Cursor interaktywnego — kontrast dla tej,
  osobnej ścieżki Automations)
- `docs/decyzje/R-PROC-AUTOBOT.md` §5a — format ról Operator/Evaluator, na
  którym wzorowany jest checklist/raport w tym pliku
- `.claude/skills/civ-autobot-workflow/SKILL.md` — Ścieżka A (Workflow),
  używana w sesjach Claude Code z autoryzowanym Workflow
- `.claude/skills/civ-autobot/SKILL.md` i `.claude/skills/autobots/SKILL.md` —
  Ścieżka B (prompt-only), używana w sesjach interaktywnych bez Workflow
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — format wpisu tematu
- `dyspozycje/autobot/runs/<ID>/00-dispatch.md` — wzór pól dispatchu
