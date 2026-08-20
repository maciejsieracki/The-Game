# PAKIET 2 — archiwum aktywnych reguł Cursor przed skróceniem

> Status: HISTORYCZNE SNAPSHOTY zachowane dla informacji. Poniższe treści nie są aktywnym routingiem; aktywne reguły znajdują się w `.cursor/rules/*.mdc`, a proces w [`INDEX-PROCESU.md`](../../docs/procesy/INDEX-PROCESU.md) i [`R-PROC-AUTOBOT.md`](../../docs/decyzje/R-PROC-AUTOBOT.md).


---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/abc-pelna-forma.mdc`

```text
---
description: ABC do Macieja — pełny kontekst, pełne nazwy, Za/Przeciw, zawsze rekomendacja. Grupy A–E + Master.
globs:
  - "**/*"
alwaysApply: true
---

> ⛔ REGUŁA HISTORYCZNA — ładuje się automatycznie, ale NIE OBOWIĄZUJE od 2026-07-06.
> Ignoruj procedury ról/publish/komend/Slack/AskQuestion/eksportu opisane niżej.
> Aktualny ład: dyspozycje/START-TU.md + OBIEG-KOMUNIKACJI-2026-07-06.md + ROLE-I-ZAKRESY-2026-07-06.md.
> Produkcja: 3 czaty Cowork (MASTER/INTEGRATOR/UX) na gra-robocza; roboczą publikuje WYŁĄCZNIE
> INTEGRATOR; kanon/finalną WYŁĄCZNIE Grupa G Cursor (pakiety DO-KANONU). Pytania do Macieja:
> tekstem w kanale, max 3, format A/B/C, BEZ popupów. Wersje: tylko dyspozycje/WERSJE.md.

# ABC do Macieja — format obowiązkowy (NIE negocjowalne)

> ## ⛔ STOP — ZANIM ZADASZ MACIEJOWI JAKIEKOLWIEK PYTANIE
> Dotyczy **Grup A–E** i **Mastera**. **Grupa F** — bez ABC gameplay.
> **NIE MA** pytań poza formatem ABC. Sam formularz Ask, skróty, tak/nie, „A/B/C?" = **odrzucone**.
> Maciej: **`format`** / **`ABC`** → natychmiast przepisz pytanie w pełnej formie.
> **Kanon Macieja:** `docs/decyzje/ABC-FORMAT-KANON-MACIEJ.md` · **Obieg lane:** `docs/obieg/_ABC-JAK-PYTASZ.md`

---

## Kanon Macieja (2026-06-26) — każde pytanie

Maciej musi dostać **kontekst + cel + opcje z za/przeciw + rekomendację**. Pełne nazwy, zero skrótów.

| Krok | Sekcja | Co piszesz |
|------|--------|------------|
| **1** | **Sytuacja** | Opis sytuacyjny — pełne nazwy; **bez** skrótów (P2, lane, same ID techniczne) |
| **2** | **Cel pytania** | Po co pytamy — jaki efekt ma mieć decyzja Macieja (1–2 zdania) |
| **3** | **Dlaczego teraz** | Czemu akurat w tym momencie (1–3 zdania) |
| **4** | **Opcje A / B / C** | Każda: **opis decyzji w grze** + **Za** (≥2) + **Przeciw** (≥2) |
| **4b** | **Rekomendacja** | **Zawsze** litera **A**, **B** albo **C** + jedno zdanie dlaczego |
| **5** | **Formularz Ask** | **Jeden** `AskQuestion` na końcu — **krótkie** etykiety A/B/C (bez Za/Przeciw) |

**Nagłówek:** `[EKRAN: …]` (gameplay) lub `[TEMAT: …]` (operacyjne) + **pełne ID** (`R-AUTO-BUDOWA-LISTA-Q2`, `P-SCOUT-EXPLORE-Q1`).
**ZAKAZ gołego `Q1`/`Q2`/`Q3`** — Maciej 2026-08-03 (`R-PROC-ABC-FULL-ID`): wiele wątków → agent sam nie wie, do którego Q1 odpowiedź.

**Szablon:** `docs/decyzje/SZABLON-PYTANIA-ABC.md`

---

## Paczki / lista ABC — **pełna lista naraz** (Maciej 2026-08-06 · `R-ABC-PELNA-LISTA`)

> **Wycofane:** limit „max 3 pytania na paczkę” (2026-07-04).

| Reguła | Wartość |
|--------|---------|
| Ile pytań w jednej wiadomości | **Wszystkie** z bieżącej pełnej listy |
| Numeracja | **Obowiązkowa:** `[1/N]`, `[2/N]`, … + pełne ID |
| Nagłówek | `[LISTA ABC — N pytań]` + spis ID |
| Formularz Ask / popup | **BEZ** (ład 2026-07-06 — tekst w kanale) |
| Po odpowiedziach | **ECHO** wszystkich → wdrażaj / `działaj` |

**ZAKAZ:** sztucznie dzielić na paczki po 3 „żeby było bezpiecznie”, gdy lista jest gotowa.

Kanon: `docs/decyzje/R-ABC-PELNA-LISTA.md`.

---

## Pełne nazwy — ZAKAZ skrótów

- **TAK:** „Panel-C (macierz jednostek)", „Auto-walka na mapie świata", „ekran przed bitwą (preBattle)"
- **NIE:** samo „Panel", „Auto", „3D", „F", „lane" bez kontekstu przy pierwszym użyciu
- Nazwy ekranów, paneli, mechanik — **jak w grze**, nie jak w kodzie wewnętrznym

---

## Podział treść ↔ formularz (kanon Macieja)

> **Pełen kontekst w tekście · krótkie pytania w formularzu Ask.**

| Gdzie | Co |
|-------|-----|
| **Czat (najpierw)** | Sytuacja · Cel · Dlaczego teraz · A/B/C pełne · Rekomendacja |
| **AskQuestion (na końcu)** | Krótkie etykiety A/B/C — **bez** kontekstu, **bez** Za/Przeciw |

**ZAKAZ:** sam formularz · długie opisy w Ask.

---

## SELF-CHECK (wszystkie TAK przed wysłaniem)

1. Nagłówek `[EKRAN: …]` lub `[TEMAT: …]` + **pełne ID** pytania?
2. Osobne sekcje **Sytuacja**, **Cel pytania**, **Dlaczego teraz**?
3. **Pełne nazwy** — bez niejasnych skrótów?
4. Dokładnie **3 opcje A, B, C** — każda: opis decyzji + **Za** (≥2) + **Przeciw** (≥2)?
5. **Rekomendacja** — **zawsze** litera A/B/C + jedno zdanie?
6. **Pełna lista** wypisana naraz z numeracją `[k/N]` (`R-ABC-PELNA-LISTA`) — nie sztuczny limit 3?
7. Tekst w kanale — **BEZ** popupów AskQuestion?
8. Po odpowiedzi → **ECHO** → `działaj` / AKCJA?

**Choć jedno NIE → nie wysyłaj.**

---

## Formularz Ask

**Wycofane / nieużywane** w ładzie 2026-07-06 — pytania **tylko tekstem** w kanale. Nie twórz `AskQuestion`.

---

## ZAKAZY (Maciej odrzuca)

- Sam `AskQuestion` bez tekstu w czacie (jak na screenie „C-BAL-Q1")
- Brak **Celu pytania** lub **opisu sytuacyjnego**
- Skróty zamiast pełnych nazw (`ep. 7+`, `¤`, `P1` bez kontekstu)
- Brak **Rekomendacji** (A, B albo C) **jako osobnej sekcji**
- **Rekomendacja wklejona w opcję A** (np. „← rekomendacja MASTERa") — **ZAKAZ**
- Opcje bez **Za** i **Przeciw** (min. 2+2) — sam opis A/B/C **odrzucone** (wzorzec błędu: **D-CUD2**)
- „Kontekst + Pytanie" zamiast Sytuacja + Cel + Dlaczego teraz
- „O co chodzi" jako jeden zlep
- Za/Przeciw w formularzu Ask
- Pytanie do Macieja bez self-check 8× TAK — **nie wysyłaj**; kanon gotowy: `docs/decyzje/D-CUD2-pytanie-KANON.md` (wzór naprawy)

---

## Po odpowiedzi Macieja

1. **ECHO** — zapis (`.cursor/rules/decyzje-echo.mdc` §1)
2. **START** — `AskQuestion`: **Tak — wdrażaj teraz** / **Jeszcze doprecyzujmy**
3. Po **Tak** → **AKCJA** w tej samej sesji

---

## Kiedy czytać ponownie

- Start sesji grupy · przed **każdą** paczką ABC
- Otwórz: `ABC-FORMAT-KANON-MACIEJ.md` + `SZABLON-PYTANIA-ABC.md`
- Maciej: **`format`** / **`ABC`**

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/autobot-evaluator-operator.mdc`

```text
---
description: TWARDA REGUŁA — AutoBot: Operator → Evaluator → finalna kontrola → integracja → READY_FOR_DEPLOY. Maciej 2026-08-19.
globs:
  - "**/*"
alwaysApply: true
---

# AutoBot — KAŻDA PRACA TYLKO TĘDY (NIENEGOCJOWALNE)

**Decyzja Maciej 2026-08-18 (`R-PROC-AUTOBOT`):**
**Każda praca, którą wykonuje agent (kod, fix, docs procesu, audyt, deploy-prep), MUSI iść przez system AutoBot.**
Bez wyjątku „to tylko drobiazg” / „zrobię sam poza pętlą”.

Kanon: `docs/decyzje/R-PROC-AUTOBOT.md` · scaffold: `dyspozycje/autobot/` · playbook: `dyspozycje/autobot/playbook.json`

**Nadrzędny obieg:** `Operator → Evaluator → finalna kontrola → integracja → READY_FOR_DEPLOY`.
Raport Operatora automatycznie uruchamia Evaluatora; orkiestrator nie czeka na ponowne
popychanie właściciela. `FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA` i `ZWIS` oznaczają:
natychmiast `Operator → Evaluator`, bez czekania, z tym samym pełnym ID tematu. ABC może
spauzować wyłącznie temat wymagający decyzji właściciela. `READY_FOR_DEPLOY` jest końcem
procesu przygotowania paczki, nie wykonanym deployem ani pushem.

## C-043 — kanał komunikacji właściciela (Maciej 2026-08-19)

Właściciel komunikuje się wyłącznie w głównym czacie orkiestratora. Subagenci są
kanałami technicznymi: ich raporty wracają do orkiestratora, który przekazuje
właścicielowi status, pytania i decyzje w głównym czacie.

## Sygnalizacja zakończenia i sloty subagentów

Subagent nie kończy pracy samym komunikatem „gotowe” ani wskaźnikiem UI `działa`.
Zakończenie musi być przekazane jako raport terminalny z jednoznacznym statusem:

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA
TEMAT: pełne ID zgłoszenia
ZMIANY: pliki i commity albo „brak zmian”
TESTY: dokładne wyniki albo „nie uruchomiono — powód”
BLOKADY: jawna lista albo „brak”
NASTĘPNY KROK: Evaluator / poprawka / ABC / finalna kontrola
DEPLOY/PUSH: wykonano albo nie wykonano
```

Raport `Operator` jest przekazaniem do `Evaluatora`, nie końcem procesu.
Po zakończeniu dowolnej roli orkiestrator zamyka niepotrzebnego subagenta, aby zwolnić slot.
Limit wynosi **6 otwartych subagentów**; zakończeni, lecz niezamknięci subagenci nadal zajmują slot.
Brak ruchu w transcriptcie przez 7 minut oznacza `ZWIS`: orkiestrator weryfikuje transcript,
przerywa zawieszony przebieg i przejmuje temat samodzielnie.
Jeżeli istnieją niezablokowane tematy, wszystkie dostępne sloty mają być stale wykorzystane.
Po każdym terminalnym raporcie zamknij zakończonego subagenta i natychmiast uruchom właściwy
następny etap albo kolejny niezależny temat. Wolny slot bez uzasadnionej blokady jest błędem
operacyjnym; nie utrzymuj rezerwy „na później”.

## Ciągła pętla domknięcia tematu

AutoBot działa jako pętla stanów, a nie jako jednorazowe zlecenie. Dla każdego tematu
orkiestrator prowadzi ten sam `ID` przez kolejne rundy aż do osiągnięcia celu z zadania
lub zgłoszonego błędu. Nie wolno zatrzymać tematu po samym raporcie Operatora, po
`FAIL`, po `BLOCK` możliwym do usunięcia ani po błędzie infrastruktury.

| Wynik etapu | Obowiązkowe działanie | Stan procesu |
|---|---|---|
| Operator `PASS` | natychmiast uruchom Evaluatora | Nie |
| Evaluator `PASS` | finalna kontrola → ABC albo integracja | Aktywny |
| Evaluator `FAIL` | przekaż Operatorowi konkretną listę usterek i uruchom kolejną rundę | Nie |
| Evaluator `BLOCK` techniczny | natychmiast Operator → Evaluator, ten sam ID | Aktywny |
| Evaluator `BLOCK` wymagający decyzji właściciela | ABC; pauza tylko tego tematu | Spauzowany przez ABC |
| `TIMEOUT`/`INFRA`/`ZWIS` | natychmiast Operator → Evaluator, ten sam ID; przy ZWIS przejmuje orkiestrator | Aktywny |
| finalna kontrola `FAIL` lub konflikt integracji | wróć do Operatora z zakresem poprawki i ponów Operator → Evaluator | Nie |
| finalna kontrola `PASS` + integracja | przygotuj zintegrowaną, izolowaną wersję `READY_FOR_DEPLOY` | Koniec procesu; deploy/push niewykonany |

Po `FAIL` nie czekaj na ponowne polecenie właściciela i nie twórz nowego ID dla tej samej
usterki. Zachowaj historię rund (`Operator → Evaluator → Operator → ...`) i kontynuuj,
dopóki Evaluator nie wyda `PASS`, finalna kontrola nie potwierdzi zakresu, a integracja nie
przygotuje wersji `READY_FOR_DEPLOY`. `READY_FOR_DEPLOY` wymaga czystego/izolowanego
pakietu, allowlisty plików, braku niezwiązanych zmian oraz przejścia wszystkich wymaganych
testów i bramek. Jeśli przygotowanie deployu, izolacja lub integracja nie są prawidłowe,
temat pozostaje aktywny i wraca do Operatora. Jedynym powodem pauzy pojedynczego tematu jest
oczekiwanie na odpowiedź właściciela w ABC; anulowanie wymaga jego wyraźnego polecenia.
Deploy/push nie jest częścią wykonania tej pętli i wymaga osobnej autoryzacji.
Zatrzymanie jednego tematu nie zatrzymuje kolejki niezależnych tematów. Status
`READY_FOR_DEPLOY` może wystawić wyłącznie główny orkiestrator po finalnej kontroli i
integracji; Operator ani Evaluator nie mogą samodzielnie ogłaszać nim zakończenia.

---

## Obowiązek (od tej pory — zawsze)

| Krok | Rola AutoBot | Kto u nas | Wymagane |
|------|----------------|-----------|----------|
| **1** | **Operator** | **GPT-5.6 Luna High** | Czyta `playbook.json` + zadanie → wykonuje akcję w guardrails i składa raport z artefaktem; zapisuje liczbę rund i poprawek |
| **2** | **Evaluator** | **GPT-5.6 Luna High** | Niezależny adwokat diabła: twarde metryki, SCOPE, regresja, postmortem, werdykt |
| **3** | **Finalna kontrola** | **GPT-5.6 Luna Medium** | Kontrola raportów i zakresu; po `PASS` kieruje temat do statusu, ABC albo integracji |
| **4** | **Integracja** | główny orkiestrator / uprawniony Integrator | Wpięcie zatwierdzonej paczki po bramkach; bez samowolnego deployu |
| **5 (poza obiegiem przygotowania)** | **Deploy/push** | uprawniona rola po autoryzacji właściciela | Publikacja dopiero po `READY_FOR_DEPLOY`, bramkach i wyraźnym sygnale deployu |

**ZAKAZ:**

- ❌ Wykonać paczkę kodu / docs bez Operatora — **wyjątek doprecyzowany (Maciej 2026-08-08,
  R-SKILL-LEAN-LOOP-CIVAUTOBOT=B):** dozwolone bez osobnego Operatora WYŁĄCZNIE 1–3 linie
  czysto tekstowe, WYŁĄCZNIE w plikach dokumentacji/notatek (NIGDY w `gra/src`), i WYŁĄCZNIE
  jako dopisek do paczki, która już przeszła przez Evaluatora w tej samej sesji — nie jako
  samodzielna, nieoceniona zmiana. Zawsze z wpisem w `KANAL-PRACA.md` lub treści commita.
- ❌ Zamknąć „gotowe” / skierować do integracji / prosić o `deploy` bez Evaluatora i finalnej kontroli
- ❌ Omijać `playbook.json` / guardrails „na skróty”
- ❌ Self-grade bez twardej metryki (testy, typecheck, playtest OK/BUG, md5)

**Wyjątek wąski (tylko):** czysta rozmowa ABC / zapis decyzji Macieja bez zmiany `gra/src` — wtedy Operator nie koduje, ale główny orkiestrator nadal trzyma reguły playbooka (NUMER→ABC, deploy gate).

---

## Dwa rdzenie (przypomnienie)

| Agent | Robi | Nie robi |
|-------|------|----------|
| **Operator** | Task + playbook + akcja (kod/testy/docs) | Merge `main`, deploy, kanon/finalna |
| **Evaluator** | Hard metrics → delta → postmortem → update playbook + **SCOPE/regresja** | Ocena „na czuja” / 10/10 bez KPI · PASS bez sprawdzenia diffu |

Potrójna warstwa (`R-PROC-POTROJNA-WARSTWA`) = **wbudowana** w kroki 1–3 AutoBot — nie osobny opcjonalny rytuał.

---

## Pytanie ABC — obowiązkowy turniej dwóch projektów (Maciej 2026-08-08)

Kanon: `docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md` · playbook `C-018` (`playbook.md`) / `rule_126` (`dyspozycje/autobot/playbook.json`)

**Każde NOWE pytanie ABC** (temat, na który właściciel jeszcze nie odpowiedział literą) — zanim trafi do właściciela:

1. Proponent 1 (orkiestrator/Operator, kto natrafił na temat) pisze pełny projekt ABC **oraz wskazuje własny „typ"** (którą literę uważa za najlepszą) z uzasadnieniem odwołującym się do `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md`.
2. Proponent 2 — NIEZALEŻNY agent, bez podglądu projektu 1, pisze własny osobny projekt, z własnym „typem" na tych samych zasadach.
3. Sędzia (rola Evaluatora) ocenia dwuwarstwowo: Warstwa 1 (dominująca) — trafność zastosowania wzorca z profilu w uzasadnieniu „typu"; Warstwa 2 (niuanse, tiebreaker) — zgodność z danymi, kompletność wariantów. Wydaje werdykt lub syntetyzuje finalną wersję. Do właściciela idzie zwycięska/zsyntetyzowana wersja **z jawną adnotacją „wg profilu: typowana X, bo …"** przy Rekomendacji — zawsze obok pełnego A/B/C, nigdy jako zamiennik wyboru (`R-PROFIL-TURNIEJ-PUNKTACJA-Q1`, Maciej 2026-08-08).

**Gdy profil nie ma dziś wzorca pasującego do kategorii tematu** (np. temat spoza §3.1–3.5 `PROFIL-DECYZYJNY-MACIEJ.md`): „typ" pozostaje obowiązkowy, ale uzasadnienie wprost stwierdza „profil nie ma dziś pasującego wzorca — typ oparty wyłącznie na analizie inżynierskiej tematu". To nie blokuje turnieju.

**„Typ" a „Rekomendacja":** to nie dwa osobne pola — „typ" JEST literą wpisaną w pole `Rekomendacja` projektu ABC; adnotacja „wg profilu: …" to dopisek uzasadnienia tej samej rekomendacji, nie druga, konkurencyjna wskazówka.

**Nie dotyczy:** tematów, na które właściciel już odpowiedział literą (tylko ECHO + zapis), czysto inżynierskich decyzji bez wpływu na gameplay/UX/dane gracza, ani bezpośrednich ustaleń wypracowanych żywą rozmową z właścicielem (właściciel sam kształtuje projekt w dialogu, turniej broni przed ślepym kątem jednego autora — tu autorów efektywnie jest już dwóch).

---

## Evaluator — obowiązkowy SCOPE + regresja (Maciej 2026-08-05)

Kanon: `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md` · playbook `rule_105`
**Twardość werdyktów (od 2026-08-05):** `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT.md` · playbook `rule_106`
**STRICT-EDGE (happy-path-only → FAIL):** `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-EDGE.md` · playbook `rule_107`
**STRICT-PARITY (asymetria gracz/AI/MP → FAIL):** `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-PARITY.md` · playbook `rule_108`
**STRICT-SAVE (luki save/load → FAIL):** `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-SAVE.md` · playbook `rule_109`

**Evaluator MUSI** przed werdyktem sprawdzić:

1. **SCOPE** — każda zmiana w diffie wynika wprost z problemu / błędu / AC tematu (nie „przy okazji”).
2. **NO-SIDE-EFFECT** — paczka nie rusza niezwiązanych plików/funkcji bez uzasadnionego kontraktu.
3. **NO-REGRESSION** — fix nie cofa wcześniejszych usprawnień ani nie psuje innych tematów.
4. **STRICT (R-PROC-AUTOBOT-EVAL-STRICT)** — luki testów / brak asercji AC / czerwone testy tematu / `tsc≠0` / SCOPE gameplay bez handoffu → **FAIL** (nie NOTES).
5. **STRICT-EDGE (R-PROC-AUTOBOT-EVAL-STRICT-EDGE)** — testy tematu tylko happy-path bez edge/negacji/repro buga → **FAIL #7** (nie NOTES).
6. **STRICT-PARITY (R-PROC-AUTOBOT-EVAL-STRICT-PARITY)** — asymetria gracz/AI/MP (`ownerId === 0` / `isPlayer`) bez decyzji ABC lub bez testu parytetu → **FAIL #8** (nie NOTES).
7. **STRICT-SAVE (R-PROC-AUTOBOT-EVAL-STRICT-SAVE)** — nowe trwałe pole bez snapshot/restore lub restore bez `?? default`; Operator bez roundtrip → **FAIL #9** (nie NOTES).

**PASS-WITH-NOTES** tylko wąska lista: pre-existing baseline poza tematem (dowód `main`), docs drift nieblokujący, cross-lane z handoffem, GATE=A wizual, drobny drift procesu.

**Przy NIE (SCOPE lub STRICT):** **FAIL** — **ZAKAZ** czystego PASS i PASS-WITH-NOTES „bo brakuje testu, ale wygląda OK”.

Główny orkiestrator wkleja do promptu Evaluatora szablon 5 pytań z decision doc
(sekcja „SCOPE + regresja + STRICT”), a po raporcie Operatora uruchamia Evaluatora
automatycznie.

---

## Playbook + pruning + guardrails

- Reguły: `win_count` / `fail_count` / `win_rate`; próg **min. 10 zastosowań** (v2, 2026-08-07); `< 30%` → `RETIRED`, `30–60%` → `QUARANTINE` (nadal stosowana), `> 60%` → `ACTIVE`, `PROTECTED` (CHRONIONA) nadaje wyłącznie Maciej — poza licznikami
- Feature pruning: atrybuty z \|corr\| < 0.05 poza kontekstem Operatora
- Guardrails w **kodzie**: bez merge→main; deploy tylko hasło Macieja; HITL; delay 48h **lub** N≥1000 przed winnerem

**Protokół błędu (v2, R-PROC-AUTOBOT-BLAD)** — po KAŻDYM błędzie (Maciej poprawił/odrzucił, liczba nie przeszła weryfikacji, coś do przeróbki): NAPRAW → przyczyna nie winny → sprawdź wstecz inne miejsca → zapisz do `errorLog` w `playbook.json` → przekuj w regułę (`ACTIVE`, licznik 0/0). Recydywa (powtórka z `errorLog`) = incydent krytyczny, zgłoś Maciejowi wprost. Kanon: `docs/decyzje/R-PROC-AUTOBOT.md` §„v2 — Protokół AutoBot".

## Weryfikacja odpowiedzi na pytania właściciela (C-023, C-024 — Maciej 2026-08-08)

Nie tylko zmiana w repo wymaga pętli — **każda odpowiedź orkiestratora na pytanie
właściciela też**, po incydencie z przestarzałym statusem `BUG-TOOLTIP-MOC-NIEPELNA`
(plik mówił „OTWARTE", naprawa była wdrożona od FALA 260).

- **C-023** — pytanie „czy jest jeszcze coś do zrobienia/nienaprawionego" → ZAWSZE świeży
  przegląd `PYTANIA-OTWARTE.md` + `REJESTR-PROSB-I-ZADAN.md` + realny stan w kodzie dla
  pozycji oznaczonych jako naprawione. Status w pliku bywa przestarzały — sama etykieta
  „zamknięte" bez sprawdzenia kodu to wciąż odpowiadanie z pamięci pliku, nie ze stanu
  faktycznego.
- **C-024** — KAŻDA odpowiedź na pytanie właściciela (nie tylko zmiana w repo) przechodzi
  przed wysłaniem przez osobnego Evaluatora, który sprawdza jej poprawność wobec realnego
  stanu plików/kodu. Jego słowa: *„jeżeli o coś pytam i Ty odpowiadasz, to ponownie
  sprawdzić sobie przez ewaluatora, czy Twoja odpowiedź jest prawidłowa."*

## Zakres naprawy błędu — zero regresji „przy okazji" (C-025, C-026 — Maciej 2026-08-08)

Po serii regresji, gdzie naprawa jednego miejsca psuła inne bez wykrycia przed playtestem
(`BUG-KOLEJKA-BUDOWY-PRZYCISKI-ROZJECHANE`, `BUG-TRAKTAT-KOSZYK-REGRESJA`,
`BUG-RZEKI-MEDIUM-FOW-REGRESJA`, 4-rundowa naprawa `R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1`).
Jego słowa: *„70% mojego czasu to jest spędzanie nad poprawkami które już kiedyś były
naprawione... kompletnie tego nie rozumiem."*

- **C-025** — zlecenie Operatora naprawiającego zgłoszony błąd ma zakres = **TYLKO ten błąd**.
  Zakaz „przy okazji"/„skoro już tu jestem": refaktorów, sprzątania stylu, zmian poza tym, co
  wynika wprost z przyczyny błędu — nawet jeśli wyglądają jak ulepszenie. Prompt zlecenia MUSI
  wypisać granicę zakresu (konkretne pliki/funkcje) i wprost zakazać zmian poza nią. Jego
  słowa: *„jeżeli jest jakiś błąd, to agent powinien się zająć tylko i wyłącznie poprawieniem
  tego błędu, a nie kopać w kodzie i psuć czegoś innego."*
- **C-026** — gdy naprawa MUSI dotknąć kodu współdzielonego z innymi ekranami/funkcjami (bo to
  jedyny poprawny zakres), Operator PRZED zmianą wypisuje wszystkie miejsca użycia (grep) i PO
  zmianie weryfikuje KAŻDE z osobna — „to powinno nadal działać" bez sprawdzenia jest
  zakazane. Evaluator sprawdza, czy ta lista w ogóle powstała, nie tylko czy diff wygląda
  bezpiecznie. Jego słowa: *„jeżeli zmienia daną rzecz, a ma ona wpływ na inne kwestie, to
  powinien to przemyśleć i przewidzieć."*

## Rejestracja → ABC lub natychmiastowy subagent — zero zaległości (C-027 — Maciej 2026-08-08)

Po skardze, że zgłoszenia „siedzą w rejestrze" bez ruchu: *„a myślisz, że po co Ci zgłaszam te
problemy? Żeby sobie siedziały w rejestrze?"* i *„tak właśnie gubią się tematy, które ci
zgłaszam. To jest jeden z głównych mechanizmów. Zgłaszam coś, a wy nie robicie z tym nic."*

**C-027** — każde zgłoszenie, w tej samej turze, bez przerwy:
1. rejestracja w `PYTANIA-OTWARTE.md` + `REJESTR-PROSB-I-ZADAN.md`;
2. wymaga realnego wyboru kompromisu (balans/gameplay/UX z alternatywami) → **pytanie ABC od
   razu**, nie odłożone na później;
3. NIE wymaga ABC (błąd do naprawienia, prośba z jasno opisanym oczekiwanym zachowaniem) →
   **odpal Operatora GPT-5.6 Luna High od razu, w tej samej turze**, w pętli Operator → Evaluator —
   „zarejestrowane, zajmę się później" jest zakazane. Jego słowa: *„jeżeli coś jest zgłoszone
   rejestrujesz dane zadanie, jeżeli trzeba zadać pytanie ABC to zadajesz, jeżeli nie to
   odpalasz subagenta Sonet od razu do rozwiązania tego problemu... to jest najważniejsze,
   żeby sprawy szły do przodu i nic nie zostało zapomniane."*

## Dwie techniczne pułapki wykryte w tej sesji (C-028, C-029 — Maciej 2026-08-08)

Po jego pytaniu „to wszystkie błędy, które zauważyłeś, warto dołożyć do autobota" —
dwa konkretne, powtarzalne mechanizmy zawodne w tej sesji, nie jednorazowe pomyłki:

- **C-029 (recydywa ≥5×)** — worktree bez `gra/node_modules` sprawia, że `npx tsc` po cichu
  uruchamia globalny, niepinowany TypeScript zamiast wersji projektu (5.9.3), dając mylący
  wynik w obie strony (fałszywe „0 błędów" albo fałszywy błąd kompilacji niebędący błędem
  projektu). Przed zaufaniem KAŻDEMU wynikowi `tsc` w worktree: symlink `node_modules` z
  drzewa głównego + `npx tsc --version` musi pokazać `5.9.3`. Symlink nigdy nie trafia do
  commita (usuwać po pracy, `git add -A` by go złapał mimo `.gitignore` — nazwa katalogu
  zgodna z wpisem, ale symlink to nie katalog).
- **C-028** — `git add` z listą kilku ścieżek, gdy jedna nie istnieje (typowo: plik usunięty
  przez `git apply`, jeszcze nie w indeksie) — kończy się `fatal: ... did not match any
  files`, a pozostałe ścieżki z TEGO SAMEGO wywołania mogą zostać po cichu pominięte.
  `git status --short` PRZED każdym commitem po `git add` z więcej niż jedną ścieżką;
  usunięte pliki dodawać osobnym wywołaniem.

## C-030 — przegląd całej listy, nie tylko najnowszego zgłoszenia (Maciej 2026-08-08)

C-027 mówi „każde zgłoszenie od razu do subagenta" — ale w praktyce stosowane było punktowo
(dla zgłoszenia właśnie rejestrowanego), nie jako przegląd całej listy. Skutek: 4 zgłoszenia
z jednego dnia zostały zarejestrowane, ale nigdy nie dostały subagenta — wykryte dopiero na
pytanie właściciela wprost. **Po KAŻDEJ serii rejestracji w `PYTANIA-OTWARTE.md`, przed
przejściem do innego tematu**: `grep` całego pliku po dzisiejszej dacie + `STATUS: **OTWARTE**`
(sam status, nie „ZDECYDOWANE"/„W REALIZACJI"/„NAPRAWIONE") i potwierdzić dla każdego trafienia
subagenta w locie, pytanie ABC, albo jawny powód odłożenia. Jego słowa: *„to jest jakaś
notoryczna skleroza… co mam kazać ci gdzie zapisać żebyś nie zapominał o błędach, które
zgłaszam, i wszystkie od razu realizował przez subagentów."*

## C-031 — krytyczna komenda żyje TAKŻE w CLAUDE.md, nie tylko tutaj (Maciej 2026-08-08)

C-030 istniała jako reguła od godzin tej samej sesji, a mimo to nie została zastosowana
proaktywnie ani razu, dopóki właściciel wprost nie zapytał, gdzie to zapisać, żeby się nie
powtarzało. Przyczyna: ten plik i `playbook.md` NIE są wstrzykiwane do kontekstu automatycznie
w Claude Code (w Cursorze ten plik JEST auto-ładowany dzięki `alwaysApply: true` — zastrzeżenie
dodane po rundzie 1 Evaluatora) — wymagają świadomego `Read`, a po kompaktowaniu długiej sesji
znikają z pola widzenia bez świadomej decyzji o pominięciu. `CLAUDE.md` NATOMIAST jest ładowany
do kontekstu KAŻDEJ tury w Claude Code — ale jako migawka z początku sesji, nie odczyt co turę;
zmiana w `CLAUDE.md` w trakcie bieżącej sesji zaczyna realnie działać dopiero w NOWEJ sesji.
**Poprawka:** sama komenda z C-030, BEZ kotwicy `^## ` (kotwica gubi nagłówki `### ` — realna
utrata trafienia wykazana przez Evaluatora rundy 1: `grep -n 'STATUS: \*\*OTWARTE'
dyspozycje/PYTANIA-OTWARTE.md`) zduplikowana w `CLAUDE.md` §0c — nie tylko odwołanie do reguły,
tam gdzie orkiestrator ją faktycznie zawsze zobaczy. Druga, niezależna od pamięci warstwa:
**[2026-08-08, ZASTĄPIONE tego samego dnia]** druga warstwa BYŁA stałym godzinowym Routine —
usunięta na polecenie Macieja po ~20+ jałowych wywołaniach/dobę niezależnie od realnej pracy.
Zastąpiona jednorazowym, samo-uzbrajającym się `run_once_at` triggerem: uzbrajany TYLKO gdy nowe
zgłoszenie nie da się domknąć w tej samej turze, odpala tę samą komendę za ~1h, re-uzbraja
kolejny jeśli coś nadal czeka, kończy się cicho bez re-uzbrojenia gdy wszystko domknięte. Pełny
opis: `CLAUDE.md` §0c.
Ryzyko rozjazdu 4 kopii tej samej komendy (CLAUDE.md/playbook.md/.mdc/SKILL.md) świadomie
zaakceptowane na razie, bez mechanicznego zabezpieczenia (jak generator `playbook.json`) — do
rozważenia później. Zasada ogólna: każda reguła oznaczona jako krytyczna (0/0a/0b/0c) powinna
mieć swoją mechaniczną komendę zduplikowaną w pliku zawsze ładowanym do kontekstu, nie tylko w
playbooku/regułach `.cursor`. Jego słowa: *„przygotuj rozwiązanie żeby o takich rzeczach nie
zapominać, gdzie to powinno być zapisane, procedura żeby to się już nie powtarzało."*

## C-032 — sprzątaj dysk PRZED każdą nową partią Operatorów, nie tylko po zamknięciu zlecenia (Maciej 2026-08-09)

RECYDYWA C-014/C-015 (worktree usuwaj jako ostatni krok zamknięcia zlecenia; zakładaj przez
sparse-checkout). Reguła istniała, ale stosowana była punktowo — dla zlecenia właśnie zamykanego,
nie jako okresowy audyt całego `.claude/worktrees/`. W wielogodzinnej sesji z dziesiątkami zleceń
26 martwych worktree (dawno scalona/porzucona praca, ~770-830 MB każdy, razem ~24 GB) uśpiło się
bez sprzątania, aż dysk doszedł do 99% (485 MB wolnego) — 4 z 6 równolegle wysłanych Operatorów
padło natychmiast z `No space left on device`, zanim zaczęli pracę.

**Poprawka mechaniczna:** PRZED wysłaniem KAŻDEJ nowej partii Operatorów (nie tylko po zamknięciu
jednego zlecenia) — `git worktree list` + `du -sh .claude/worktrees/*`; usuń KAŻDY worktree bez
blokady (`locked`), który nie jest przypisany do aktualnie działającego (`running`) agenta. Kod
scalonej pracy jest bezpieczny w historii gita/GitHubie po `commit`+`push` — lokalna kopia robocza
ma wtedy zerową wartość i jest czystym marnotrawstwem miejsca.

Jego słowa (2026-08-09): *„zawsze po zdeployowaniu danych zagadnień powinieneś czyścić drzewa i
dysk"* oraz *„kiedy zrobisz commit, zabezpieczasz go na GitHubie. Nie ma potrzeby już chyba
trzymania tych danych"* — potwierdzone jako reguła stała, nie jednorazowa uwaga.

## Integracja z Ultracode/Workflow (Maciej 2026-08-12)

Polecenie Macieja: *„przeczytaj jeszcze raz całe zasady autobots i dostosuj je do pracy
ultracode tak żeby się uzupełniały i razem usprawniały pracę oraz generowało jak najmniej
błędów."*

**Zasada nadrzędna tej sekcji:** Workflow (Ultracode) to **NARZĘDZIE wykonawcze** — skrypt
orkiestrujący subagentów z wbudowaną współbieżnością, izolacją i wzorcami weryfikacji.
AutoBot (ta reguła + cały kanon powyżej) to **REGUŁY procesu** — kto co robi, w jakiej
kolejności, jakie warunki muszą być spełnione przed „gotowe"/`deploy`. Workflow ma
**automatyzować i egzekwować** istniejące reguły AutoBota — **NIE zastępuje** ani Operatora,
ani Evaluatora, ani żadnego z zakazów wyżej. Skrypt Workflow, który pomija Evaluatora albo
commituje/deployuje sam, łamie tę regułę dokładnie tak samo jak ręczny dispatch, który to robi.

### Kiedy Workflow zamiast ręcznego dispatchu (Agent tool)

Używaj Workflow, gdy: **≥3 niezależne tematy naraz** (Workflow ma wbudowany limit
współbieżności ~10–16 agentów i kolejkuje resztę — adresuje realny incydent tej sesji:
ręczne odpalanie kilkunastu subagentów naraz przez orkiestratora prowadziło do chaosu i
wyczerpania zasobów) **LUB** użytkownik/tryb ultracode tego wprost wymaga. Dla 1–2 tematów
ręczny dispatch (`Task`/`Agent` z `isolation:"worktree"`) pozostaje w pełni poprawny —
Workflow nie jest obowiązkowe dla każdej pojedynczej paczki.

### Mapowanie ról AutoBot → Workflow

| Rola AutoBot | Krok Workflow | Model |
|---|---|---|
| **Operator** | `phase('Operator')` → `agent(prompt, opts)` | GPT-5.6 Luna High |
| **Evaluator** | `phase('Evaluator')` → `agent(prompt, {model:'gpt-5.6-luna-high'})` | GPT-5.6 Luna High |

**WYMÓG TWARDY:** obie fazy żyją w **JEDNYM skrypcie Workflow**, Operator → Evaluator jako
dwa kroki sekwencyjne tego samego przebiegu — **NIGDY jako dwa osobne, niezależnie
zlecane uruchomienia**. Powód wprost: incydent tej sesji, w którym orkiestrator scalił i
skomitował serię ~11 zmian Operatora **bezpośrednio, bez pośredniego Evaluatora**, łamiąc
regułę 0a/0b — wykryte dopiero na wyraźne pytanie właściciela. Faza Evaluate zaszyta w tym
samym skrypcie co faza Operatora strukturalnie utrudnia to pominięcie (nie eliminuje —
patrz „Co zostaje poza Workflow" niżej, scalanie ręczne wymaga tego samego reżimu mimo że
nie idzie przez Workflow).

### `pipeline()` zamiast ręcznego sekwencjonowania

`pipeline(items, stageOperator, stageEvaluator)` przepuszcza KAŻDY temat przez obie fazy
**niezależnie** — temat A może być już u Evaluatora, gdy temat B jeszcze pracuje u
Operatora, bez ręcznego zarządzania kolejnością przez orkiestratora. To zastępuje dzisiejsze
ręczne „poczekaj na Operatora → scal → dopiero teraz zleć Evaluatora" jednym wywołaniem,
bez utraty gwarancji, że KAŻDY temat przeszedł przez obie warstwy przed „gotowe".

### KROK 0 — weryfikacja bazy worktree (obowiązkowy pierwszy akapit KAŻDEGO promptu `agent()` z `isolation:'worktree'`)

Recydywa tej sesji (dziesiątki wystąpień): worktree zakładany przez `isolation:'worktree'`
(czy to `Agent` tool, czy Workflow) czasem opiera się na starym/złym commicie (np. `main`
sprzed setek commitów zamiast czubka gałęzi roboczej) — subagent widzi kod „sprzed" jakiejś
funkcji i błędnie raportuje, że „funkcja nie istnieje" (patrz też C-035 w `playbook.md`,
identyczny mechanizm). Wklej dosłownie jako pierwszy akapit KAŻDEGO promptu `agent()` z
`isolation:'worktree'`, w Workflow i poza nim jednakowo:

```
KROK 0 — WERYFIKACJA BAZY WORKTREE (wykonaj PRZED jakąkolwiek analizą):
Uruchom: grep -rn "<SYMBOL_KTÓRY_MUSI_ISTNIEĆ>" <ścieżka/do/pliku>
(podstaw za <SYMBOL_KTÓRY_MUSI_ISTNIEĆ> nazwę funkcji/typu/stałej dodanej NAJPÓŹNIEJ na
gałęzi roboczej — musi być widoczna, jeśli worktree stoi na właściwej bazie).
Jeśli grep NIE znajdzie trafienia: ZATRZYMAJ SIĘ. NIE próbuj ręcznie odtwarzać brakującego
kodu, NIE zgaduj że „pewnie jeszcze nie scalone". Zgłoś dokładnie: jakiego symbolu
szukałeś, w jakim pliku, i że baza worktree wygląda na nieaktualną — czekaj na decyzję
orkiestratora. Dopiero po potwierdzeniu obecności symbolu przechodź do właściwego zadania.
```

Gdy się zdarzy: orkiestrator ręcznie zakłada poprawny worktree
(`git worktree add ... origin/<branch>` albo bieżąca gałąź sesji) i redispatchuje —
nie próbuje naprawiać tego wewnątrz złego worktree.

### Adversarialna weryfikacja (N niezależnych Evaluatorów) — kiedy 1, kiedy 3

Domyślnie **1 Evaluator wystarcza** (GPT-5.6 Luna High, adwokat diabła jak w reszcie
tej reguły). **3 niezależnych Evaluatorów głosujących (większość musi się zgodzić, żeby
werdykt PASS przetrwał)** dla zmian wysokiego ryzyka — dotykających:
- silnika bitwy (`gra/src/**/combat*`, `battle*`, moc jednostek, wynik starcia),
- zapisu/wczytania gry (save/load, snapshot/restore, migracja formatu zapisu),
- migracji/zmiany struktury danych kanonicznych (`gra/data/**`, format pól przetrwałych
  między turami).

Ten wzorzec to dokładnie to, co Evaluator AutoBota dziś robi ręcznie w roli „adwokata
diabła" (Warstwa 2 potrójnej warstwy) — Workflow go automatyzuje jako wbudowany wzorzec
(„adversarial verify"/„judge panel"), nie wprowadza nowej reguły procesu.

### Co ZOSTAJE poza Workflow — zawsze ręczne, zawsze orkiestrator

Workflow może automatyzować pełną ścieżkę aż do **`READY_FOR_DEPLOY`** po finalnej kontroli
i integracji — nigdy nie wykonuje deployu ani pushu. Poza bramką przygotowania, zawsze ręką
uprawnionej roli, pozostają publikacyjne operacje:
- `git commit` / `git push`,
- wpisy do `dyspozycje/PYTANIA-OTWARTE.md` / `dyspozycje/WERSJE.md` /
  `dyspozycje/REJESTR-PROSB-I-ZADAN.md` / `dyspozycje/_handoff/KANAL-PRACA.md`,
- CAŁY deploy (hasło `deploy`, po bramkach i autoryzacji właściciela).

**Reguła 0b obowiązuje TAKŻE przy ręcznym scalaniu konfliktów.** Gdy orkiestrator sam
rozwiązuje konflikt scalenia (`git apply -3` z konfliktem, ręczny merge trójstronny), to
**TEŻ jest zmiana zapisana do repozytorium** — idzie do kolejki Evaluatora jak każda inna,
„to tylko scalanie" nie jest zwolnieniem. Dokładnie to zostało przeoczone realnie w tej
sesji (reguła 0b istniała, a mimo to konflikt rozwiązany ręcznie przeszedł bez Evaluatora) —
traktować jako pełnoprawny incydent klasy C-0xx, nie wyjątek proceduralny.

## Logging

Każda domknięta paczka → wpis postmortem w `dyspozycje/autobot/logs/` (run_id, metric_before/after, delta%, postmortem_reasoning, action_taken), gdy scaffold na to pozwala; minimum: raport Evaluator w czacie + KANAL.

## Self-check przed „gotowe”

1. Czy był **Operator** (osobny przebieg implementacji / jasny przebieg AutoBot)?
2. Czy był **Evaluator** (adwokat + metryki), uruchomiony po raporcie bez dodatkowego popychania?
3. Czy główny orkiestrator wykonał **finalną kontrolę** i skierował temat do statusu, ABC albo integracji?
4. Czy playbook / guardrails uszanowane oraz czy deploy/push ma wymaganą autoryzację?

**Choć jedno NIE → nie zamykaj paczki.**

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/chat-export-auto.mdc`

```text
---
description: Automatyczny eksport pełnej korespondencji czatu Civ — start sesji, ≥60% kontekstu, koniec sesji
alwaysApply: true
---

> ⛔ REGUŁA HISTORYCZNA — ładuje się automatycznie, ale NIE OBOWIĄZUJE od 2026-07-06.
> Ignoruj procedury ról/publish/komend/Slack/AskQuestion/eksportu opisane niżej.
> Aktualny ład: dyspozycje/START-TU.md + OBIEG-KOMUNIKACJI-2026-07-06.md + ROLE-I-ZAKRESY-2026-07-06.md.
> Produkcja: 3 czaty Cowork (MASTER/INTEGRATOR/UX) na gra-robocza; roboczą publikuje WYŁĄCZNIE
> INTEGRATOR; kanon/finalną WYŁĄCZNIE Grupa G Cursor (pakiety DO-KANONU). Pytania do Macieja:
> tekstem w kanale, max 3, format A/B/C, BEZ popupów. Wersje: tylko dyspozycje/WERSJE.md.

# Eksport korespondencji (automatyczny — bez Macieja)

**Maciej nie eksportuje ręcznie.** Agent uruchamia `gra/tools/sync-chat-export.py` zgodnie z `docs/archiwum-czatow/ARCHIWIZACJA-AUTO.md`.

## Slot → plik

| Czat | `--slot` | Plik |
|------|----------|------|
| Master Silnik | `MASTER-Silnik` | `docs/archiwum-czatow/eksport-pelny/MASTER-Silnik_KORESPONDENCJA.md` |
| Grupa A–F | `GRUPA-A` … `GRUPA-F` | `docs/archiwum-czatow/eksport-pelny/GRUPA-{X}_KORESPONDENCJA.md` |

Chat ID: `docs/archiwum-czatow/eksport-pelny/REJESTR-CZATOW.md` lub `transcript_location` w metadanych sesji.

## OBOWIĄZKOWO — pierwsza odpowiedź sesji

Po `master`, `czaty` lub wklejce `DYSPOZYCJA`:

```powershell
python gra/tools/sync-chat-export.py --slot <SLOT> --chat-id <UUID> --mode auto
```

1. Uruchom sync **przed** inną pracą (chyba że Maciej wyraźnie pilnuje innego P0).
2. Nowy chat ID → zaktualizuj `REJESTR-CZATOW.md`.
3. Dopisz `SYNC-EKSPORT: …` do `dyspozycje/DZIENNIK-MASTERA.md`.

## Kontekst ≥60%

```powershell
python gra/tools/sync-chat-export.py --slot <SLOT> --chat-id <UUID> --mode delta --context-pct <N>
```

- Tworzy `{SLOT}_HANDOFF-KONTEKST.md`.
- W czacie: jedna linia — korespondencja zarchiwizowana, ścieżka pliku.
- Przy **>85%**: zaproponuj nowy czat z tą samą `DYSPOZYCJA`.

## Zakazy

- Nie proś o ⋯ → Export w UI.
- Nie wklejaj pełnej korespondencji do `DO-MASTERA` / `OD-MASTERA`.
- Pliki `eksport-pelny/` = tylko historia; operacyjne = `docs/czaty/`, `dyspozycje/`.

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/civ-workflow.mdc`

```text
---
description: Workflow Civ — Master Orkiestrator (hub, bez kodu); Grupa F main.ts; review subagent; Slack trigger. Token rules + STAN.
globs:
  - "**/*"
alwaysApply: true
---

> ⛔ REGUŁA HISTORYCZNA — ładuje się automatycznie, ale NIE OBOWIĄZUJE od 2026-07-06.
> Ignoruj procedury ról/publish/komend/Slack/AskQuestion/eksportu opisane niżej.
> Aktualny ład: dyspozycje/START-TU.md + OBIEG-KOMUNIKACJI-2026-07-06.md + ROLE-I-ZAKRESY-2026-07-06.md.
> Produkcja: 3 czaty Cowork (MASTER/INTEGRATOR/UX) na gra-robocza; roboczą publikuje WYŁĄCZNIE
> INTEGRATOR; kanon/finalną WYŁĄCZNIE Grupa G Cursor (pakiety DO-KANONU). Pytania do Macieja:
> tekstem w kanale, max 3, format A/B/C, BEZ popupów. Wersje: tylko dyspozycje/WERSJE.md.

# Civ (The Game) — Workflow Cursor

> ⚙️ **NOWY OBIEG (2026-06-30) — ma pierwszeństwo:**
> - **Role (KANON):** [`docs/obieg/ROLE-2026-06-30.md`](docs/obieg/ROLE-2026-06-30.md) · **Zasady:** `docs/obieg/_ZASADY.md` · **Cała gra:** `docs/ROADMAP.md`
> - **Master Orkiestrator (hub)** = plan + weryfikacja + dyspozycje · **NIE kod** · **NIE `main.ts`**
> - **Grupa F (osobny czat)** = jedyny editor `main.ts` + bramka + build
> - **Nazewnictwo (KANON, jedyny słownik):** `docs/obieg/NAZEWNICTWO-GRUP.md`. Używaj **wyłącznie `Grupa A–F`**; ZAKAZ `UX/UI/MIASTO/EKONOMIA/DANE/DYPLOMACJA/UNITS/MAPA/Silnik` jako etykiet grup. „Silnik" = **Integrator (Grupa F)**, orkiestrator = **Master**.
>   - **A** = Mapa świata (+HUD mapy) · **B** = Miasto/Ekonomia/**Technologia** · **C** = Walka · **D** = Cywilizacje/Dyplomacja/**AI**+barbarzyńcy · **E** = Start/Meta/**UI-shell** · **F** = Integrator.
>   - Gdziekolwiek niżej padają stare nazwy lane'ów/ról — czytaj je wg słownika wyżej (ten baner ma pierwszeństwo).
> - **Komunikacja bieżąca:** `docs/obieg/<grupa>.md` (A–E) + `docs/obieg/INTEGRATOR-kolejka.md`. Stare `DO/OD-MASTERA`, `*-STAN`, kolejki dyspozycji → archiwum.
> - **Obieg (akceptacja):** `docs/obieg/OBIEG-AKCEPTACJA-2026-06-30.md` · **Slack:** `docs/obieg/SLACK-OBIEG.md`
> - Sekcje niżej zostają jako referencja techniczna (build, token rules, własność plików).

**Decyzja Maciej 2026-07-01:** **Dwie wersje gry (izolacja katalogów)** — F publikuje **`gra-robocza/`** (po bramce); Master promuje **`gra-kanon/`** po review. Lane A–E **ZAKAZ** dotykać finalnej. Szczegóły: `docs/obieg/DWIE-WERSJE-GRY.md` · plan: `docs/obieg/PLAN-DWIE-WERSJE-IZOLACJA.md` · zadania Master: `docs/obieg/MASTER-ZADANIA.md`.
**Decyzja Maciej 2026-06-29 (częściowo):** menu w silniku — finalna = `Gra-podglad.html` / `gra-kanon/START.html`.
Pełny playbook operacyjny: `PLAYBOOK-operacyjny-Civ.md` (root projektu) — źródło prawdy technik multi-agent.
Source of truth stanu: `dyspozycje/DZIENNIK-MASTERA.md`.
Pełny audyt + backlog: `docs/CURSOR-ARCHITEKTURA.md`, `docs/CURSOR-BACKLOG.md`, `docs/CURSOR-RAPORT-KONCOWY.md`.

## 0. Złote reguły (zawsze)

**Pełna reguła (obieg 2026-06-30):** `docs/czaty/_DYSPOZYCJA-WSPOLNY-OBIEG.md` · `docs/obieg/_ZASADY.md` §7

1. **Maciej = DECYDENT GAMEPLAY ONLY.** ABC · **`działaj`** · **`przekaż do Mastera`**. **Playtest:** `gra-robocza/START.html` (D1A) — tylko gdy Master poprosi + md5. **`gra/src/` ≠ to, co widzi Maciej** — lane **nie** prosi o weryfikację wizualną przed publish F.
2. **Grupy A–E** = lane → po **`przekaż do Mastera`**: handoff + pliki obiegu + Slack → **Master** dyspozycjonuje → **F**. **NIGDY `main.ts`.** **Kod TYLKO `gra/src/`** — **ZAKAZ** `gra-robocza/src/`, `gra-kanon/src/` ([`OBOWIAZ-SCIEZKA-KODU.md`](docs/obieg/OBOWIAZ-SCIEZKA-KODU.md) · trigger **`ścieżka`**).
3. **Grupa F** = jedyny editor `main.ts` + bramka + publikacja **`gra-robocza/`**. Meldunek → **`→ MASTER: GOTOWE-ROBOCZA`** + Slack. **ZAKAZ** `gra-kanon/`.
4. **Master Orkiestrator** = dyspozycja F · weryfikacja F · review subagent · **promocja finalnej**. **Zasada:** krok 1 przyjmij · krok 2 wykonaj (ta sama tura). **NIE** kod · **NIE** `main.ts`.
5. **Przepływ:** Lane → Master → F → Master (review + kanon) → **Master prosi Macieja** → playtest · BUG → Lane.
6. **Review** = subagent readonly (Master) · **Opus wycofany.**
7. **Decyzje ABC** → ECHO → BALANS? → **`działaj`** → **`przekaż do Mastera`** (`.cursor/rules/decyzje-echo.mdc`).
8. **Slack** = trigger po handoffie · pliki = prawda · `docs/obieg/SLACK-OBIEG.md`.

## 1. Role i modele (2026-06-27)

| Rola | Model | Tryb | `main.ts`? |
|---|---|---|---|
| **Master Orkiestrator** | Composer 2.5 | Agent (hub) | **NIE** — plan + weryfikacja · [`MASTER-WATCH.md`](docs/obieg/MASTER-WATCH.md) |
| **Grupa F** | **Composer 2.5** | Agent (osobna zakładka) | **TAK** |
| **Lane A–E** | **Composer 2.5** (`composer-2.5`) | Agent / Task | **NIE** |
| **Subagent testów** | **composer-2.5** | Task w **czacie Master** (hub) | **NIE** |
| **Review przed ACK** | **Subagent readonly** (Master wywołuje) | APPROVE/BLOCK — **bez Opus** |
| **Decydent** | Maciej | — | **NIE** |

- **Master Orkiestrator (hub):** plan, dyspozycje, `MASTER-WATCH.md`, Slack MCP, review subagent.
- **Grupa F (osobny czat):** patch `main.ts` → bramka → **`gra-robocza/`** → meldunek Master.
- **Review:** subagent readonly w hub Master — **nie** osobny czat Opus · **nie** GLM + main.ts (archiwum `docs/archiwum/master-legacy/`).

## 2. Mapowanie grup A–F (SUPERSEDED — szczegóły w obiegu)

> **Kanoniczne nazwy i domeny:** [`docs/obieg/NAZEWNICTWO-GRUP.md`](docs/obieg/NAZEWNICTWO-GRUP.md) · **Role:** [`docs/obieg/ROLE-2026-06-30.md`](docs/obieg/ROLE-2026-06-30.md)
> Stara tabela lane'ów (MAPA/UNITS/Opus) = historia w `docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md` §2–5.

## 3. Własność plików (twarda reguła — NIE ruszaj cudzego)

| Lane | Wyłączne pliki |
|---|---|
| **Grupa F** | `gra/src/main.ts`, **`gra-robocza/`** (publish po bramce) — tylko czat Grupa F · **ZAKAZ** `gra-kanon/` |
| **Grupy A–E** | moduły lane · graj/testuj **`gra-robocza/START.html`** · **ZAKAZ** `gra-kanon/` |
| **Master Orkiestrator (ops)** | **`gra-kanon/`** (promocja) · `gra-robocza-kopia/` · `MASTER-WATCH.md`, `DZIENNIK-MASTERA.md`, `_handoff/*`, `docs/obieg/*` — **bez kodu źródłowego** |
| EKONOMIA (+ex-MIASTO) | `economy.ts`, `turn-economy.ts`, `upkeep.ts`, `converters.ts`, `wealth.ts`, `cities.ts`, `production.ts`, `order.ts`, `culture-religion.ts`, `auto-manage.ts` |
| UNITS | `units/setup.ts`, `combat.ts`, `battle/*`, `siege.ts`, `manualBattle.ts` |
| UI | `gra/src/ui/*` (cityPanel, preBattle, sciencePicker, mainMenu, newGameFlow, diplomacyPanel, hud) |
| CYWILIZACJE (+ex-DANE/AI/DYPLO) | `gra/data/*`, `loader.ts`, `export-*.py`, `ai.ts`, `barbarians.ts`, `victory.ts`, `diplomacy.ts` |
| MAPA | `map/*` (generator, territory), `render/*` (scene, camera, hexutil, units, cities, resources) |

Cross-lane: `dyspozycje/_handoff/<OD>-do-<DO>_<temat>.md`. **NIGDY bezpośrednia edycja cudzego pliku.** Kolizja 2 agentów na 1 plik → worktree isolation.

## 4. Kiedy edytować `main.ts` (KRYTYCZNE)

- **`main.ts` = Grupa F only.** Master **nie** edytuje — dyspozycja w `_handoff/` + `MASTER-WATCH.md`.
- **Inne grupy NIE ruszają `main.ts`** — handoff → `→ INTEGRATOR: GOTOWE` → Grupa F.
- **Każda zmiana `main.ts` = 1 batch** + build + bramka testów.
- **Backup:** `cp gra/src/main.ts gra/src/main.ts.bak-SILNIK-<data>`.
- **Po zmianie:** build `/tmp` → bramka → **review subagent** (Master) → ACK.

## 5. Token rules (chronią kontekst i koszty)

Koszt = liczba zimnych startów × objętość kontekstu. Tekst tani; drogi nowy agent ładujący kontekst od zera.

### 5.1 One lane per subagent invocation (w czacie MASTER)
- **1 lane = 1 wywołanie subagenta (Task) = 1 zadanie z AC.** Nie ładuj 3 zadań na jednego workera.
- Lane worker czyta: swój `<LANE>-STAN.md` (≤12 linii) + kontrakt `_handoff/` + AC. **NIE czyta całego `main.ts`** (~2827 l. — monopol **Grupy F**).
- Lane worker czyta TYLKO pliki swojego lane'a + `data/` + `types/`. Cross-lane koordynacja przez kontrakty, nie przez czytanie cudzego kodu.

### 5.2 STAN files (progressive disclosure — do wdrożenia Faza A)
| Warstwa | Plik | Kiedy czyta | Rozmiar |
|---|---|---|---|
| **STAN** | `dyspozycje/<LANE>-STAN.md` | ZAWSZE na starcie | ≤ 12 linii |
| **Dyspozycja** | `dyspozycje/<LANE>.md` | Gdy STAN sygnalizuje nowe zadanie | ~60–100 linii |
| **Historia** | `dyspozycje/<LANE>-DO-MASTERA.md` | Tylko na żądanie / eskalacja | ostatnie 10 wpisów → decay do `-arch.md` |

Efekt: ~80% tańszy self-check lane'a. Dziś tylko `EKONOMIA-STAN.md` — pozostałe lane'y wdrożyć w Fazie A (zadanie S1.6).

### 5.2a Routing modeli — drogi decyduje, tani wykonuje (Maciej 2026-06-28)
**Reguła szczegółowa:** `.cursor/rules/model-routing.mdc` (alwaysApply).
- **Mocny model (Master):** diagnoza, decyzje, projekt mechanizmu, weryfikacja, routing.
- **Subagent `composer-2.5`:** każda mechaniczna robota wieloplikowa (masowe edycje, wpięcia wg wzoru, refaktory, eksporty), gdy nie wymaga decyzji. **NIE** `composer-2.5-fast` (Maciej 2026-07-27).
- **Próg delegacji (OBOWIĄZKOWO subagent):** > 3 pliki „wg wzoru" **lub** > ~50 linii czystego wykonania **lub** zadanie samodzielne/odizolowane. Wyjątek: 1–3 drobne edycje splecione z myśleniem, pliki już w kontekście.

### 5.3 Kiedy subagent, kiedy który czat (model 2026-06-30)

- **Maciej ↔ hub Master** — ABC, playtest, `raport`, `status` (rola minimalna: `MACIEJ-ROLA-MINIMAL.md`).
- **Maciej ↔ czat A–E** — ABC w temacie lane (format 5 kroków · `abc-pelna-forma.mdc`).
- **Master ↔ Grupy** — dyspozycje, Slack MCP, review subagent — **Master nie koduje**.
- **Grupa F (osobny czat)** — `start` → `INTEGRATOR-kolejka.md` → wpięcie + bramka → **`gra-robocza/`** → `→ MASTER: GOTOWE-ROBOCZA`.
- **`gra-kanon/` (finalna)** — promocja **Master** po review (`publish-kanon-snapshot.ps1` z `gra-robocza/`).
- **Master przy `start`:** `backup-grywalna-dzien.ps1` (kopia dzienna `gra-robocza/` → `gra-robocza-kopia/dzien_*`).

### 5.4 Twarde limity (bezpieczniki)
- Loop-until-done (build/testy): **MAX 3 przebiegi** → STOP + raport.
- Verify-loop (worker→sędzia→poprawka): **MAX 2 cykle** → STOP + eskalacja.
- Fan-out (równolegle subagenci): **pilot 2 itemy** → max 10 równoległych.
- **MAX 12 wywołań subagentów** na jedno zadanie bez zgody MASTER → STOP + pytaj.
- Tournament (balans): **MAX 6 rund**.

### 5.5 Handoff format (między lane'ami i do MASTER)
`dyspozycje/_handoff/<NADAWCA>-do-<ODBIORCA>_<temat>.md`:
- **Co przesyłam** (API, typy, kontrakt, pliki).
- **Co Odbiorca ma z tym zrobić** (wpiąć / zaimplementować / zweryfikować).
- **Kiedy handoff jest gotowy** (flaga: GOTOWE / CZEKA).
- **DoD** (kryteria akceptacji — Master + review subagent).
Nadawca dopisuje meldunek do pliku obiegu grupy. **Grupa F** wpinia po `→ INTEGRATOR: GOTOWE`.

### 5.6 Meldunki Figma redesign (Warstwa 1 — OBOWIĄZKOWE, tylko makiet DS v1)

- **Zakres:** wyłącznie Figma w pliku DS v1 — **nie** zastępuje `*-DO-MASTERA` innych lane’ów (walka, ekonomia, integrator…).
- **Grupy A–E:** każdy POSTĘP / STOP / GOTOWE → append `docs/ux/figma/grupa-{X}/RAPORT-FIGMA.md` § Meldunki (`[YYYY-MM-DD]`, 5–15 linii: co · frame’y **N/M** · blokery).
- **Skrót lane UI:** `dyspozycje/UI-DO-MASTERA.md` — wpis **OD GRUPY X** gdy ważne dla Grupy 0.
- **Maciej czyta repo** — nie przekleja z czatu. **W czacie:** *„Zapisane w RAPORT-FIGMA.md § [data]”*.
- Pełna reguła: `docs/ux/figma/STATUS-FIGMA.md` § Reguła meldunków.

## 6. Build commands (KRYTYCZNE: /tmp, NIE dist/ — OneDrive blokuje)

```bash
# Build kanonu (ZAWSZE /tmp/, NIE dist/, NIE npm run build)
cd gra
npx vite build --outDir /tmp/civ-dist   # Windows: $env:TEMP\civ-dist
# wynik: /tmp/civ-dist/Gra-podglad.html → skopiować do root projektu

# Typecheck
npx tsc --noEmit

# Dev server (do iteracji)
npm run dev   # vite dev server

# Testy (node w PATH; Cursor terminal lub worktree Composer)
node tools/logic-test.cjs
node tools/combat-test.cjs
node tools/smoke.cjs
node tools/battle-smoke.cjs
# wszystkie: for %t in (tools\*.cjs) do node %t   (PowerShell)
```

**Bramka publish:** suite'y ZIELONE + smoke OK. **Publikuje Grupa F.** **ACK** po review subagent + wpis Master (`MASTER-WATCH`).

## 7. Bezpieczniki (PLAYBOOK)

- Build: `npx vite build --outDir /tmp/civ-dist` — **NIE** `npm run build`, **NIE** `dist/` w OneDrive.
- Export JSON: **targeted script per arkusz** — NIGDY pełny `export-data.py` (ryzyko nadpisania cudzych). MIASTO: `export-budynki.py` (tylko `buildings.json`).
- Backup: `cp plik plik.bak-<LANE>-<data>` przed każdą zmianą (rolling — 1 backup = ostatnia ZIELONA).
- Kolizja 2 agentów na 1 plik → worktree isolation.
- Loop until done: **MAX 3 przebiegi** build/test.
- Adversarial review: **subagent readonly** wywoływany przez Master — nie Opus, nie self-preference.
- `buildings.json` schema `przyrost` ZOSTAJE (czytane przez `economy.ts` + `siege.ts`).

## 8. OneDrive (dehydratacja)

- Dehydratacja → `Read` plik → wait 3-5s → retry. Po 3× → **zgłoś blokadę, NIE rekonstruuj ręcznie**.
- `gra/` → „Always keep on this device" (Settings → OneDrive → zarządzaj miejscem).
- Testy i build przez `/tmp/civ-dist` (NIE `gra/dist/`).
- Po touch/dehydrate: rebuild + bramka testów przed publikacją kanonu.

## 9. Protokół decyzji (PLAYBOOK §17a)

- **KAŻDA decyzja produktowa** przez format ABC → Maciej akceptuje/koryguje → DOPERO MASTER rozsyla dyspozycje do lane'ów.
- **Pełna forma ABC (Grupy A–E):** reguła `.cursor/rules/abc-pelna-forma.mdc` + szablon `docs/decyzje/SZABLON-PYTANIA-ABC.md`. Skrócone pytania = **odrzucone** przez Macieja — agent musi przepisać paczkę.
- Wyjątek: czysto inżynierskie wpicie JUŻ zatwierdzonego modułu (build/test/kanon) — execution bez pytania.
- Pytania lane → **Maciej w oknie lane'a** (NIE popup AskUserQuestion). Zwykły tekst + wpis do `<LANE>-DO-MASTERA.md`.
- Otwarte decyzje Macieja: `docs/MACIEJ-KARTA-DECYZJI.md` + `docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md` §8 (D1-D15).

## 10. Workflow sesji (zalecane)

1. **Maciej:** ABC (hub lub czat A–E) · playtest gdy Master ogłosi kanon.
2. **Grupy A–E:** moduł → handoff + `→ INTEGRATOR: GOTOWE` + Slack `#grupa-X`.
3. **Master (hub):** dyspozycja do F · Slack `#master` · **bez kodu**.
4. **Grupa F:** wpięcie `main.ts` → bramka → publish → `→ MASTER: GOTOWE-ROBOCZA` + md5 w `INTEGRATOR-kolejka.md`.
5. **Master:** checklist read-only + **review subagent** → APPROVE/BLOCK → ACK (`MASTER-WATCH` + DZIENNIK + Slack).
6. **Maciej:** opcjonalny playtest finalnej (`playtest OK` / `BUG`).

### 10.1 Grupa F — szczegóły (Maciej 2026-06-27)

**Charter:** `docs/czaty/GRUPA-F-SILNIK.md`

Przed wpięciem F **sam** sprawdza: kompletność handoffu, zgodność z gameplayem, zależności cross-lane, wykluczenia, braki. Jeśli OK — wpinaj; jeśli konflikt techniczny — `→ MASTER: BLOK` (bez ABC do Macieja o zamknięte tematy).

Maciej w czacie F: **tylko raporty** (co wykonano). Decyzje produktowe = zakładki A–E.

## 11. Język

Dokumentacja i komunikacja z Maciejem: **polski**. Komentarze w kodzie: polski (istniejący styl projektu). Sekcje dla Macieja: prosty język, bez żargonu (patrz `MACIEJ-KARTA-DECYZJI.md`).

## 12. Kanon gameplay — Spichlerz i wzrost (Maciej 2026-06-29)

**Pełny opis:** `docs/decyzje/B5-spichlerz-wzrost-ludnosci.md` · handoff: `dyspozycje/_handoff/MACIEJ-do-EKONOMIA_spichlerz-wzrost-ludnosci.md`

- **Termin UI:** **Spichlerz** (nie „magazyn żywności”).
- **Bufor wzrostu:** kumuluje się zawsze (część suwaka „Rozwój miast”); próg `10 + pop × wsp`.
- **Bez Spichlerza:** po awansie ludności bufor **→ 0**; żywność wojska **nie kumuluje** (nadwyżka przepada co turę); **rekrutacja nie blokowana**.
- **Ze Spichlerzem:** po awansie bufor **→ 50%**; **zapasy państwa** kumulują nadwyżkę na wojsko.
- **Implementacja:** Grupa B → Integrator (batch po kolejnych ustaleniach Macieja). **Nie wdrażać ad hoc** bez handoff `→ INTEGRATOR: GOTOWE`.

## 12a. Rejestr playtestów — jedno miejsce (Maciej 2026-07-02)

**Plik:** `docs/master/REJESTR-PLAYTESTOW.md` · procedura: `docs/obieg/OBOWIAZ-PLAYTEST-REJESTR.md`
**Reguła alwaysApply:** `.cursor/rules/obowiaz-playtest-master-only.mdc` · komunikacja lane: `docs/obieg/KOMUNIKACJA-PLAYTEST-LANE.md`

- **Maciej:** o playtestach (**w tym zaległych**) informuje **wyłącznie Master** (hub).
- **Grupy A–E + F:** po batchu → **dopisz §2** · **ZAKAZ** jakiejkolwiek wzmianki o playtest w czacie z Maciejem · trigger **`rejestr`**.
- **Master:** zbiera §2 · po ~100% gry otwiera §0 i **sam** prosi (`SZABLON-PROŚBA-PLAYTEST.md`) · wyniki → **§3**.
- **`start`/`raport`/`status`/`raport2` (lane → Maciej):** **bez** playtestu. Maciej: **`playtest lista`** → tylko Master.

## 13. Zakaz w sesjach dokumentacyjnych

**NIE modyfikuj `gra/src` game code** bez wyraźnej dyspozycji implementacyjnej. Dokumentacja i rules only, chyba że user wprost prosi o kod. Wyjątek: trivial fix w dokumentacji/komentarzu.

## 13. Archiwum czatów (OBOWIĄZKOWE — automatyczny eksport pełny)

Cursor **kompresuje** długą historię czatu. **Maciej NIE eksportuje ręcznie** — agent synchronizuje **pełną korespondencję** skryptem.

**Reguła szczegółowa:** `.cursor/rules/chat-export-auto.mdc` (alwaysApply)
**Zasady:** `docs/archiwum-czatow/ARCHIWIZACJA-AUTO.md`
**Rejestr slotów:** `docs/archiwum-czatow/eksport-pelny/REJESTR-CZATOW.md`
**Skrypt:** `gra/tools/sync-chat-export.py`

### Dwa światy plików
| Świat | Gdzie | Co |
|-------|-------|-----|
| **Historyczny** | `docs/archiwum-czatow/eksport-pelny/{SLOT}_KORESPONDENCJA.md` | Pełna treść rozmowy 1:1 (wyszukiwanie, analiza) |
| **Operacyjny** | `DO-MASTERA`, `OD-MASTERA`, `DZIENNIK`, `STATUS` | Meldunki, dyspozycje — **bez** pełnej korespondencji |

Podsumowania sesji (skróty): `docs/archiwum-czatow/master/`, `lane/` — obok eksportu, nie zamiast.

### Kiedy synchronizować (agent)
1. **Start sesji** — pierwsza odpowiedź po `master` / `czaty` / wklejce `DYSPOZYCJA`
2. **Kontekst ≥60%** — delta + `{SLOT}_HANDOFF-KONTEKST.md` + komunikat w czacie
3. **Koniec sesji** — delta
4. Hasło: **`archiwizuj czat`**

### Po sync ≥60% (uwolnienie kontekstu)
Pełna historia w `eksport-pelny/`; przy >85% zaproponuj nowy czat z tą samą `DYSPOZYCJA`. **Nie** proś o Export z UI Cursor.

### DZIENNIK
Jedna linia: `SYNC-EKSPORT: <slot> → eksport-pelny/<plik>`

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/decyzje-echo.mdc`

```text
---
description: Decyzja Macieja = ECHO (zapis) + AKCJA (wdrożenie w tej samej sesji). Bez zaległych ZAPISANA.
globs:
  - "**/*"
alwaysApply: true
---

> ⛔ REGUŁA HISTORYCZNA — ładuje się automatycznie, ale NIE OBOWIĄZUJE od 2026-07-06.
> Ignoruj procedury ról/publish/komend/Slack/AskQuestion/eksportu opisane niżej.
> Aktualny ład: dyspozycje/START-TU.md + OBIEG-KOMUNIKACJI-2026-07-06.md + ROLE-I-ZAKRESY-2026-07-06.md.
> Produkcja: 3 czaty Cowork (MASTER/INTEGRATOR/UX) na gra-robocza; roboczą publikuje WYŁĄCZNIE
> INTEGRATOR; kanon/finalną WYŁĄCZNIE Grupa G Cursor (pakiety DO-KANONU). Pytania do Macieja:
> tekstem w kanale, max 3, format A/B/C, BEZ popupów. Wersje: tylko dyspozycje/WERSJE.md.

# Decyzje Macieja — ECHO → AKCJA (NIENEGOCJOWALNE)

**Problem:** Maciej odpowiada ABC → agent zapisuje w rejestrze → **nic nie robi**. Koniec.

**Rozwiązanie:** decyzja = **zapis + natychmiastowa praca w tej samej sesji**. Status 🟡 ZAPISANA **nie może** zostać ostatnim krokiem.

Pełne zasady: `docs/obieg/_ZASADY.md` §7 · Rejestr: `docs/obieg/REJESTR-DECYZJI.md`

---

## 1. ECHO — pierwsza czynność (Grupy A–E + Master przy ABC)

Gdy Maciej **odpowie ABC** lub **zaproponuje rozwiązanie**, **ZAKAZ** kodu/analizy/kolejnych pytań, dopóki nie:

1. Nadasz **ID** (`B1-Q3` / `DEC-RRRRMMDD-NN`).
2. Dopiszesz decyzję + **cytat** do `docs/obieg/<grupa>.md` (sekcja „DECYZJE MACIEJA").
3. Dopiszesz wiersz w `REJESTR-DECYZJI.md` → 🟡 **ZAPISANA**.
4. Potwierdzisz: `Zapisałem jako <ID>, status ZAPISANA.`

---

## 2. START — obowiązkowy AskQuestion **tuż po ECHO** (Maciej 2026-06-26)

**Nie musisz nic dopisywać w czacie** (np. „start", „wdrażaj") — agent **sam pyta od razu** formularzem.

Po zapisie ECHO, **w tej samej turze**, **ZAKAZ** kończyć rozmowę — wywołaj **jedno** `AskQuestion`:

| ID | Etykieta |
|----|----------|
| **act-now** | **Tak — wdrażaj teraz** *(rekomenduj)* |
| **hold-clarify** | **Jeszcze doprecyzujmy** |

**Treść wiadomości przy formularzu (krótko):**
*„Zapisałem `<ID>` → `<A|B|C>`. Mam od razu wdrożyć w `<plik/moduł>`?"*

- **act-now** → natychmiast §3 AKCJA (ta sama sesja).
- **hold-clarify** → faza **BALANS** (§2b) — dyskusja, liczby, panel; **ZAKAZ kodu** do hasła Macieja §2c.

**ZAKAZY:**

- ❌ ECHO i koniec czatu **bez** AskQuestion §2.
- ❌ Po **hold-clarify** / długiej dyskusji o balansie — **stać i czekać** na kolejne pytania od Macieja (§2c).
- ❌ Zapomnieć o wdrożeniu (sam zapis w rejestrze = błąd procesu).

---

## 2b. BALANS — po „Jeszcze doprecyzujmy" lub długiej dyskusji po ABC

Status rejestru: 🟡 **ZAPISANA** (doprecyzowanie). Agent:

- zapisuje **każdą** ustaloną liczbę/regułę (ECHO mini — cytat + rejestr),
- **nie koduje**,
- **nie kończy** sesji pytaniem „co dalej?" — czeka na **hasło Macieja §2c**.

**ZAKAZ:** udawać, że temat zamknięty, dopóki Maciej nie powie §2c.

---

## 2c. DOMKNIĘCIE — hasła Macieja (OBOWIĄZKOWA reakcja agenta)

Gdy Maciej w czacie grupy napisze (dowolny alias):

| Hasło Macieja | Aliasy | Agent **natychmiast** (ta sama sesja) |
|---------------|--------|----------------------------------------|
| **`obowiaż`** | — | Stosuj [`OBOWIAZ-PLAYTEST-GATE.md`](../docs/obieg/OBOWIAZ-PLAYTEST-GATE.md) + [`KOMUNIKACJA-PLAYTEST-LANE.md`](../docs/obieg/KOMUNIKACJA-PLAYTEST-LANE.md) · **ZAKAZ** prosić o playtest · potwierdź 3 linie |
| **`rejestr`** | — | Dopisz [`REJESTR-PLAYTESTOW.md`](../docs/master/REJESTR-PLAYTESTOW.md) **§2** · potwierdź: „playtest = Master, lane milczy w czacie" |
| **`zakres`** | — | Stosuj [`OBOWIAZ-ZAKRES-RAPORTU.md`](../docs/obieg/OBOWIAZ-ZAKRES-RAPORTU.md) · raport **tylko własny lane** · potwierdź 3 linie |
| **`działaj`** | `wdrażaj`, `temat zamknięty`, `OK działaj` | Rejestr → 🔵 W TRAKCIE · sekcja tematu → **ZAMKNIĘTE (dyskusja)** · **§3 AKCJA** (kod / eksport panelu) |
| **`przekaż do Mastera`** | `przekaż dalej`, `OK przekaż`, `OK` | Jeśli brak kodu → najpierw §3 AKCJA · testy lane PASS · meldunek **`→ MASTER: GOTOWE`** w pliku obiegu grupy + handoff `_handoff/` + wpis `INTEGRATOR-kolejka.md` (Master dyspozycjonuje F) · rejestr 🟠 **U MASTERA** · **§2d SLACK** (obowiązkowo) |

**Adresat meldunku Macieja:** **Master Orkiestrator** (pliki + Slack `#master`). Master → kolejka → **Integrator F**. Maciej **nie** jest listonoszem między czatami.

**ZAKAZY po §2c:**

- ❌ Odpowiedzieć „OK, czekam na dalsze ustalenia" — **musisz** ruszyć §3 lub handoff.
- ❌ `→ MASTER: GOTOWE` **bez** §2d SLACK (chyba że MCP Slack niedostępny — wtedy dopisz `Slack: BLOK MCP` w pliku obiegu).
- ❌ Wpinać `main.ts` / publikować kanon (to robi tylko Integrator po dyspozycji Master).

Potwierdzenie Maciejowi (jedna linia):
`Przyjąłem «działaj» — wdrażam w <moduł>.` albo
`Przyjąłem «przekaż do Mastera» — pliki + Slack #master; Master → Integrator.`

---

## 2d. SLACK — po **`przekaż do Mastera`** (OBOWIĄZKOWE, Grupy A–E)

**Maciej nie pisze na Slacku.** Agent grupy **w tej samej sesji** po zapisie plików:

1. MCP **`slack_send_message`** → **`#master`** (trigger Mastera)
2. MCP **`slack_send_message`** → **`#grupa-<X>`** (log lane — ten sam tekst lub skrót)

**Mapowanie kanałów:** `docs/obieg/SLACK-OBIEG.md` (ID kanałów).

**Szablon (krótko, ≤8 linii):**

```
[GRUPA-<X>] → MASTER: GOTOWE
Temat: <ID-tematu> — jedno zdanie
Handoff: dyspozycje/_handoff/<plik>.md
Plik: docs/obieg/<grupa>.md
Testy lane: <np. combat 6/6 · smoke OK>
Playtest: → rejestr §2 (Master informuje Macieja)
```

**Master** czyta Slack MCP (`slack` / start sesji) **przed** dyspozycją F. **Pliki = prawda** — Slack = trigger.

**ZAKAZ:** kończyć odpowiedź Maciejowi blokiem „Wklej w czacie MASTER" / „skopiuj do hubu" — Maciej **nie** jest kurierem (`docs/obieg/_ZASADY.md` §7.1e).

**Gdy MCP Slack fail:** dopisz w pliku obiegu `Slack: BLOK MCP — <błąd>` · meldunek plikowy **i tak obowiązuje**.

---

## 3. AKCJA — po kliknięciu „Tak — wdrażaj teraz" **lub** hasle **`działaj`** (§2c)

W **tej samej sesji** (kolejne kroki narzędzi, bez nowego czatu):

1. Rejestr → 🔵 **W TRAKCIE** (+ pierwszy plik w „Dowód").
2. **Pierwszy krok wdrożenia:** odczyt → edycja **lub** test **lub** eksport.
3. Kontynuuj aż do dowodu albo realnej blokady technicznej.

**ZAKAZY:**

- ❌ Zostawić 🟡 ZAPISANA po wyborze **act-now**.
- ❌ „Wrócę przy `start`".
- ❌ Kolejne ABC o ten sam temat (→ sekcja **ZAMKNIĘTE**).

Wieloetapowa implementacja OK — **pierwszy krok w tej samej sesji** po **act-now**.

---

## 4. HOLD techniczny (bez Macieja)

Gdy **bez** doprecyzowania nie wiesz *co* wdrożyć (sprzeczność z ZAMKNIĘTE, cross-lane) → **`→ MASTER: BLOK`**, nie drugie ABC o zamknięty temat.
To **nie** zastępuje §2 START — najpierw zapis + pytanie Macieja o start wdrożenia.

---

## 4. DOMKNIĘCIE — „gotowe" tylko z dowodem

- `→ INTEGRATOR: GOTOWE` dopiero z **dowodem** (plik+funkcja / test) + statusem 🟠 **U INTEGRATORA** w rejestrze.
- Integrator → 🟢 **WDROŻONA** + md5.
- ✅ **ZWERYFIKOWANA** — tylko Master.

---

## 5. Nadzór Master

- **`status`** / **`czego nie wdrożono?`** → 🟡 **ZALEGŁE** (= ZAPISANA **bez** AskQuestion §2 **lub** bez 🔵 po **act-now**).
- **Start sesji Master** → skan ZALEGŁE → dyspozycja / eskalacja do grupy.
- Właściciel: `REJESTR-DECYZJI.md`, `ROADMAP.md`.

---

## 6. Zakazy (skrót)

- NIE: kod przed ECHO.
- NIE: ECHO bez §2 START (AskQuestion) w tej samej turze.
- NIE: **act-now** bez §3 AKCJI w tej samej sesji.
- NIE: „gotowe" bez dowodu.
- NIE: kasować wierszy rejestru.
- NIE: ✅ jako grupa/Integrator.
- NIE: prosić Macieja o **playtest** / checklistę gameplayu — tylko **Master** ([`KOMUNIKACJA-PLAYTEST-LANE.md`](../docs/obieg/KOMUNIKACJA-PLAYTEST-LANE.md) · trigger **`obowiaż`** · **`rejestr`**).
- NIE: raportować Maciejowi **status całej gry** / innych grup — tylko **własny lane** ABC + wdrożenie + przekaz Master ([`OBOWIAZ-ZAKRES-RAPORTU.md`](../docs/obieg/OBOWIAZ-ZAKRES-RAPORTU.md) · trigger **`zakres`**).
- **TAK:** po przygotowaniu paczki (kod, handoff, eksport) — **napisz Maciejowi na czacie** **`✅ Gotowe:`** / **`⏸️ Czeka:`** **oraz dopisz** [`MACIEJ-GOTOWE.md`](../docs/MACIEJ-GOTOWE.md) ([`OBOWIAZ-POWIADOM-MACIEJA.md`](../docs/obieg/OBOWIAZ-POWIADOM-MACIEJA.md)) — nie tylko dziennik.

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/gotow-do-testu.mdc`

```text
---
description: Po deployu/paczce do playtestu — obowiązkowy banner GOTÓW DO TESTU (Maciej 2026-08-02)
alwaysApply: true
---

# ✅ GOTÓW DO TESTU — sygnał dla Macieja (NIENEGOCJOWALNE)

**Problem:** subagent kończy w tle / UI pokazuje „Working”, a Maciej nie wie, że już może testować — marnuje czas czekając albo testuje za wcześnie.

**Decyzja Macieja (2026-08-02):** gdy jest coś do przetestowania w grze, agent **zawsze** daje w czacie **wyraźny znak tekstowy** (banner). Bez bannera Maciej **zakłada, że jeszcze nie testuje**.

**Decyzja Macieja (2026-08-02 wieczór):** skończyłeś pracę **w źródłach** (jeszcze bez ROBOCZA) → **natychmiast** napisz **`✅ Gotowe w źródłach`** + pytanie **„Wrzucić na ROBOCZA?”**. **ZAKAZ** milczeć i czekać na popchnięcie. Po tak/deploy → publish → **od razu** banner niżej (bez osobnego „a mogę testować?”).

## Kiedy obowiązkowo

### A) Źródła gotowe, jeszcze nie na ROBOCZA
1. `✅ Gotowe w źródłach` + 1 linia co
2. Pytanie: **Wrzucić na ROBOCZA?**
3. **Nie** dawaj jeszcze bannera GOTÓW DO TESTU

### B) Paczka już w `gra-robocza/` (po deployu)

Po **każdym** z poniższych, gdy wynik jest w `gra-robocza/` (lub Maciej ma otworzyć konkretny plik HTML):

1. Deploy / publish ROBOCZA (FALA, md5 w manifeście)
2. Zamknięcie subagenta, który zrobił deploy lub zostawił gotowy bundle do Ctrl+F5
3. Fix, który Maciej ma **obejrzeć / zmierzyć** w Nowej grze

**Nie** wystarczy: samo „md5 …”, samo „Ctrl+F5”, wpis w `WERSJE.md` / kanale bez bannera w czacie.

## Format (kopiuj 1:1)

```
╔══════════════════════════════╗
║   ✅ GOTÓW DO TESTU          ║
╚══════════════════════════════╝
```

**Od razu pod bannerem (obowiązkowe 3 linie):**

1. **md5** (skrót 8 znaków z `gra-robocza/ROBOCZA-MANIFEST.json`)
2. **Wejście:** `Ctrl+F5` → `gra-robocza/START.html` → …
3. **Co sprawdzić:** 1–3 punkty (konkret)

Opcjonalnie potem: `### Playtesty` + `### Następny krok` (reguła `maciej-nastepny-krok.mdc` — **rozdzielone**).

## Zakazy

- ❌ Skończyć kod w źródłach i **milczeć** (bez „Gotowe w źródłach” + pytanie o ROBOCZA)
- ❌ Kończyć sesję / odpowiedź po subagencie **bez** bannera, gdy jest paczka do testu
- ❌ Liczyć na to, że Maciej zobaczy zniknięcie „1 Working” w UI
- ❌ Prosić o test **zanim** banner (i md5) są w czacie
- ❌ Mieszać z historycznym „playtest tylko Master” — tu chodzi o **sygnał gotowości roboczej**, nie o rejestr PT-

## Relacja z innymi regułami

| Reguła | Rola |
|---|---|
| Ten plik | **Kiedy wolno testować** — banner + md5 |
| `maciej-nastepny-krok.mdc` | **Co dalej** po odpowiedzi (pełna lista; bez limitu 3) |
| `docs/obieg/OBOWIAZ-POWIADOM-MACIEJA.md` | `✅ Gotowe:` + wpis `MACIEJ-GOTOWE.md` |
| `obowiaz-playtest-master-only.mdc` | Nie mylić z oficjalnym playtestem kanonu |

Po deployu typowa kolejność w jednej wiadomości: banner **GOTÓW DO TESTU** → md5/co sprawdzić → (opcjonalnie) `✅ Gotowe:` / `MACIEJ-GOTOWE` → `### Następny krok`.

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/komendy-raport.mdc`

```text
---
description: Komendy Macieja (raport / status / pytania / co dalej / sprawdź) — stały format odpowiedzi w każdym czacie.
globs:
  - "**/*"
alwaysApply: true
---

> ⛔ REGUŁA HISTORYCZNA — ładuje się automatycznie, ale NIE OBOWIĄZUJE od 2026-07-06.
> Ignoruj procedury ról/publish/komend/Slack/AskQuestion/eksportu opisane niżej.
> Aktualny ład: dyspozycje/START-TU.md + OBIEG-KOMUNIKACJI-2026-07-06.md + ROLE-I-ZAKRESY-2026-07-06.md.
> Produkcja: 3 czaty Cowork (MASTER/INTEGRATOR/UX) na gra-robocza; roboczą publikuje WYŁĄCZNIE
> INTEGRATOR; kanon/finalną WYŁĄCZNIE Grupa G Cursor (pakiety DO-KANONU). Pytania do Macieja:
> tekstem w kanale, max 3, format A/B/C, BEZ popupów. Wersje: tylko dyspozycje/WERSJE.md.

# Komendy Macieja — stałe hasła, stały format (NIENEGOCJOWALNE)

Gdy Maciej wpisze jedno z poniższych haseł, agent **natychmiast** odpowiada w zdefiniowanym formacie — bez dopytywania. Źródła: pliki obiegu (`docs/obieg/`), `REJESTR-DECYZJI.md`, `ROADMAP.md`, handoffy (`dyspozycje/_handoff/`).

**Zasada zakresu:** w czacie grupy (A–E) komenda dotyczy **tej grupy**. W czacie Master — **zbiorczo wszystkie grupy** (per grupa).

---

## `raport` — aktywny kanon 10 kategorii

**Gdzie:** czat **Master** (orkiestracja). **Hasło Macieja:** wpisz **`raport`**.
Pełny kanon: [`R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1`](../../docs/decyzje/R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1.md).
**Procedura krok po kroku (obowiązkowa):** ten sam plik, **§4** — zakres
(najnowsza ROBOCZA + aktywna kolejka), kolejność źródeł, dowody Operatora/
Evaluatora, checklista przed wysłaniem, sekcja „Brak dowodu / nie zgaduję".
Poprzedni układ 7 kategorii (`R-RAPORT-7-KATEGORII-ABC-PLAYTESTY-Q1`) pozostaje
w historii gita — nie używać go w odpowiedzi `raport`.

**Zakres:** najnowsza ROBOCZA (`WERSJE.md`) + aktywna kolejka — **nie** cała
historia commitów, starszych FAL ani pełnej kolejki PT.

Odpowiedz **zawsze** w dziesięciu nagłówkach, w tej kolejności (pusta sekcja →
`— (brak)`), **plus** sekcja **„Brak dowodu / nie zgaduję"** pod kategorią 10:

1. **Gotowe do integracji/deployu** — w tym już zdeployowane, z jawnym statusem.
2. **W trakcie — Operator.**
3. **Operator zakończony — czeka na Evaluatora.**
4. **W trakcie — Evaluator.**
5. **Evaluator zakończony — czeka na finalną kontrolę/integrację.**
6. **Czeka na Operatora — gotowe do dispatchu** — pełny kontrakt/ECHO/ABC, Operator
   jeszcze nie uruchomiony; podaj plik decyzji/rejestru jako dowód.
7. **Zapomniane — do dispatchu** — brak kompletnego kontraktu albo brak śladu
   procesu; odróżnij od kategorii 6.
8. **Świadomie odłożone.**
9. **Otwarte ABC.**
10. **Playtesty.**

Każdy punkt ma format **`ID — status — dowód — następny gate`**. **Sam status
w rejestrze nie wystarcza** — wymagany konkretny dowód (commit SHA, raport,
werdykt, wynik testu). Worktree, branch ani ukryte powiadomienie nie są dowodem
żywego procesu.

**Dowody w kategoriach 1–5 (skrót obowiązkowy):**

| Kat. | Co musi być w polu „dowód" |
|------|----------------------------|
| **1** | artefakt + commit/test/handoff lub wpis ROBOCZEJ; przy deployu: werdykt Evaluatora + md5/FALA |
| **2** | **dispatch Operatora** (`KANAL-PRACA.md`/handoff: kto, kiedy, ID, zakres) — brak raportu końcowego |
| **3** | **raport/commit Operatora** (SHA, testy); przy **WSTRZYMANY**: dowód blokady zewnętrznej |
| **4** | **dispatch Evaluatora** (kanał/handoff) — brak werdyktu PASS/FAIL |
| **5** | **werdykt Evaluatora** (PASS/PASS-WITH-NOTES) + zakres oceny |

**Brak werdyktu Evaluatora = brak wpisu w kategoriach 1 i 5** (jako gotowe do
integracji/deployu). ECHO A/B/C zamyka ABC (kat. 9), ale **nie** oznacza
automatycznie gotowości do Operatora (kat. 6) — sprawdź wdrożenie/odłożenie/blokadę
oraz pełny kontrakt (§3 kanonu).

**Nadrzędny obieg AutoBot:** `Operator → Evaluator → finalna kontrola → integracja →
deploy/push`. Raport Operatora nie kończy procesu: po jego otrzymaniu Evaluator jest
uruchamiany automatycznie, bez czekania na ponowne popychanie właściciela. Po `PASS`
finalna kontrola rozstrzyga następny krok: aktualizacja statusu dla tematu zamkniętego,
pełne ABC z pełnym ID, gdy potrzebna jest decyzja, albo skierowanie gotowego tematu do
integracji. `FAIL` wraca do Operatora. Deploy/push dopiero po bramkach i autoryzacji.

Źródła czytaj w kolejności (§2 kanonu): `dyspozycje/WERSJE.md`,
`dyspozycje/_handoff/KANAL-PRACA.md`, `dyspozycje/REJESTR-PROSB-I-ZADAN.md`,
`dyspozycje/PYTANIA-OTWARTE.md`, `docs/decyzje/<ID>.md`, handoff/audyt,
na końcu git/worktree (weryfikacja, nie pierwsze źródło). Przed wysłaniem —
checklista §4 Faza F (10 nagłówków, md5, test kat. 6 vs 7, brak zgadywania).
Raport **tylko czatowy** nie wymaga `git diff --check`; zapis w pliku repo — tak.

Kategoria 10 korzysta wyłącznie z najnowszej ROBOCZEJ pozycji
`Playtest — na co patrzeć` w `dyspozycje/WERSJE.md`; nie wolno dopisywać
historycznej kolejki PT ani starszych fal.

### ARCHIWUM — SUPERSEDED: poprzedni raport 4-sekcyjny

Poniższy układ zachowujemy wyłącznie jako historię i nie używamy go dla komendy
`raport`:

- **A — Grupy (do uzupełnienia)** — per Grupa A…E, co ma wdrożyć/dokończyć.
- **B — Integrator F (wisi u F)** — batchy bez meldunku `F-do-MASTER*`.
- **C — Master (wisi u Mastera)** — review, promocja i dyspozycje.
- **4 — Playtesty** — dawny wpis oparty o historyczny rejestr; zastąpiony
  filtrem najnowszej ROBOCZEJ opisanym powyżej.

---

## `raport2` — czaty grup A–E (3 sekcje, NIE Master)

**Hasło Macieja w czacie grupy:** **`raport2`** (alias: `audyt wdrożenia`).

**OBOWIĄZ-ZAKRES:** tylko wpisy **tej grupy** z rejestru · **bez** statusu całej gry / innych lane'ów ([`OBOWIAZ-ZAKRES-RAPORTU.md`](docs/obieg/OBOWIAZ-ZAKRES-RAPORTU.md) · trigger **`zakres`**).

Odpowiedz dokładnie w trzech sekcjach (krótkie punkty, bez lania wody):

### 1. ✅ ABC wdrożone
ID z `REJESTR-DECYZJI.md` tej grupy (🟢/✅) + dowód: plik/funkcja/test/md5.

### 2. 🔜 Nie wdrożone / w toku
ID + status rejestru + co blokuje.

### 3. 📤 Przekazane Masterowi
TAK/NIE: handoff `_handoff/*-do-MASTER*` · flaga `→ MASTER: GOTOWE` · Slack §7.1d.

**Końcówka:** 1 linia `Gotowe u Mastera: TAK/NIE · brakuje: …`

**ZAKAZ:** kończyć „wklej do Mastera". Brak handoffu → agent dopisuje sam.

**Master hub:** `gra/tools/audyt-abc-handoff.ps1` · spec: `docs/obieg/RAPORT2-INSTRUKCJA.md`.

---

## `pytania` — otwarte ABC u Macieja (hub Master)

**Gdzie:** czat **Master**. **Hasło Macieja:** wpisz **`pytania`**.

**Format odpowiedzi (zawsze):**
1. **Liczba** — ile realnie czeka (np. „0 pilnych · 2 odłożone post-v1.0”).
2. **Lista** — tylko **OTWARTE** pytania: **ID** · **Grupa** · **jedno zdanie** · link `docs/decyzje/<ID>.md` jeśli jest.
3. **Nie licz** — decyzji już zapisanych (🟡 ZAPISANA z literą A/B/C), wdrożenia w toku, playtestów, zadań operacyjnych Mastera/F.

**Źródła (kolejność):**
1. Sekcja **`❓ PYTANIA DO MACIEJA`** w `docs/obieg/<grupa>-*.md` (A–E)
2. `docs/decyzje/MAPA-PYTAN-OPEN.md` — wiersze **OTWARTE** (po weryfikacji!)
3. **`OBOWIĄZKOWO`** przed wpisem: `docs/decyzje/<ID>.md` — jeśli **ZAMKNIĘTE** → **nie pokazuj**

**W czatach grup A–E:** to samo hasło **`pytania`**, ale tylko pytania **tej grupy**. **ZAKAZ** wymieniać ABC innych lane'ów ([`OBOWIAZ-ZAKRES-RAPORTU.md`](docs/obieg/OBOWIAZ-ZAKRES-RAPORTU.md)).

**Powiązane:** **`format`** — gdy pytanie źle sformułowane · **`A`/`B`/`C`** — Twoja odpowiedź.

---

## `status` — wdrożenie Twoich decyzji

**Grupy A–E:** tylko ABC + wdrożenie **tego lane'u** z `REJESTR-DECYZJI.md` (ZAPISANE / W TRAKCIE / WDROŻONE / **ZALEGŁE**). **Bez** playtestu — to Master (`playtest lista`).

**Master (hub):** pełny status + opcjonalnie kolejka playtestów z REJESTR §1.

Alias: `czego nie wdrożono?` = tylko otwarte (nie 🟢/✅). Patrz `.cursor/rules/decyzje-echo.mdc`.

## `pytania` — co czeka Twojej decyzji
Tylko **realnie** otwarte ABC. Źródło: „❓ PYTANIA DO MACIEJA" z pliku obiegu (+ `ROADMAP.md` w Master). **OBOWIĄZKOWO przed pokazaniem pytania jako otwartego — zweryfikuj w `docs/decyzje/<ID>.md`, że NIE ma statusu „ZAMKNIĘTE".** Nie ufaj samej liście (bywa nieaktualna). Jeśli zamknięte → nie pokazuj jako pytania; jeśli czeka tylko wdrożenia → to nie jest pytanie do Macieja. Każde realne: ID + jedno zdanie o co chodzi. Gdy zadajesz ABC — pełna forma `.cursor/rules/abc-pelna-forma.mdc` (**max 3 pytania**/paczka, jeden `AskQuestion`).

**Hub Master:** pełna spec sekcji **`pytania`** w `.cursor/rules/komendy-raport.mdc` (format listy + źródła weryfikacji).

## `co dalej` — rekomendacja priorytetu
Master/agent podaje **1 najważniejszą rzecz** do zrobienia teraz + dlaczego (z „🎯 TERAZ" / blokad / kolejności w ROADMAP). Max 3 pozycje.

## `sprawdź <temat>` — weryfikacja konkretu
Agent sprawdza wskazany temat: czy zrobione, gdzie (plik/funkcja), jaki status w rejestrze, czy coś blokuje. Odpowiedź: stan + dowód + następny krok.

---

## `audyt wdrożenia` — alias `raport2`

To samo co **`raport2`**. Preferuj **`raport2`** (krótsze).

## `eksportuj panel` — Maciej zmienił Excel, agent aktualizuje grę
Maciej wpisuje w czacie grupy po zmianie wartości w `panele-sterowania/Panel-X.xlsx`. Agent:
1. Sam odpala `panele-sterowania/export-<x>.py` (instaluje `openpyxl`/zależności po cichu, jeśli trzeba) → aktualizuje `gra/data/*.json`.
2. Jeśli zmiana wymaga odczytu w `.ts`/`main.ts` → handoff do Integratora; inaczej 🟢 izolowana.
3. Raportuje **jedną linią**: „panel X wyeksportowany, gra zaktualizowana". **Nigdy** nie podaje Maciejowi komend terminala (`python`, `pip`, ścieżek, `--dry-run`). To łamie „Maciej zero terminala" → zakazane.

## Hasła Macieja (A–E) — `.cursor/rules/decyzje-echo.mdc`

| Hasło | Agent |
|-------|-------|
| **A / B / C** | ECHO → AskQuestion wdrażaj? / doprecyzujmy |
| **`działaj`** | Wdrażaj u siebie (koniec balansu) |
| **`przekaż do Mastera`** | Handoff + pliki + Slack #master + #grupa-X |
| **`obowiaż`** | Stosuj [`KOMUNIKACJA-PLAYTEST-LANE.md`](docs/obieg/KOMUNIKACJA-PLAYTEST-LANE.md) — **ZERO** playtest w czacie Macieja |
| **`rejestr`** | Dopisz [`REJESTR-PLAYTESTOW.md`](docs/master/REJESTR-PLAYTESTOW.md) §2 · potwierdź ciszę w czacie |
| **`rejestr`** | Dopisz [`REJESTR-PLAYTESTOW.md`](docs/master/REJESTR-PLAYTESTOW.md) §2 · cisza w czacie |
| **`zakres`** | Stosuj [`OBOWIAZ-ZAKRES-RAPORTU.md`](docs/obieg/OBOWIAZ-ZAKRES-RAPORTU.md) — raport **tylko własny lane** ABC + wdrożenie + Master |
| **`raport2`** | 3 sekcje: ABC wdrożone · w toku · u Mastera (`RAPORT2-INSTRUKCJA.md`) |
| **`format`** | Przepisz ABC (5 kroków) |
| **`reguły`** | **Start dnia** — checklist obiegu (Slack, archiwum, ABC, handoff) · `komendy-raport.mdc` §`reguły` |
| **`reguły mapa`** | Kanon gameplay MAPA (brzeg 10 hex, ląd od środka, rzeki) · **≠ `reguły`** |

**ZAKAZ w czatach grup A–E (i Design):**

- ❌ **`master`** od Macieja **≠** „przyjmuj rolę MASTER" — **nie** buduj kanonu, **nie** `publish-kanon-snapshot.ps1`, **nie** `Gra-podglad.html` root ([`LANE-NIE-MASTER.md`](docs/obieg/LANE-NIE-MASTER.md))
- ❌ Flaga **`→ MASTER: master`** w meldunku = **adresat hub Master**, nie polecenie dla agenta lane
- ✅ Po meldunku: **`→ MASTER: GOTOWE`** + handoff · **STOP** · Master w hubie robi resztę

**ZAKAZ:** prosić Macieja o wklejanie meldunku w hubie Mastera.

## `master` — TYLKO hub Master (orkiestracja)

**Gdzie działa:** czat **Master Orkiestrator (hub)** — **nie** Grupa A–E, **nie** Design, **nie** F jako zamiennik `przekaż`.

| Czat | Maciej wpisuje `master` | Agent |
|------|-------------------------|-------|
| **Hub Master** | ✅ | Skan meldunków → dyspozycja F → review → promocja kanon ([`MASTER-ZADANIA.md`](docs/obieg/MASTER-ZADANIA.md)) |
| **Grupa A–E / Design** | ⚠️ pomyłka czatu | **NIE** orkiestruj · odpowiedz szablonem z [`LANE-NIE-MASTER.md`](docs/obieg/LANE-NIE-MASTER.md) · meldunek już w pliku |

**Flaga w pliku `→ MASTER: master`** = „Master odbierz w hubie" — **nie** „teraz jesteś Masterem" (lane).

---

## `start` / `zadanie` — agent (Master dyspozycjonuje; NIE hasło Macieja w A–E)

Master wpisuje **`start`** w czacie grupy **lub** grupa czyta 🎯 TERAZ po onboardingu. Agent:
1. Czyta `docs/obieg/<litera>-*.md` — **🎯 TERAZ** + decyzje + handoff.
2. Implementuje w swoich plikach (**nigdy** `main.ts`).

**`zadanie panel`** / **`zadanie <temat>`** — tylko wskazany temat z obiegu (panel → `PANEL-STEROWANIA-SPEC.md`).

Po **`przekaż do Mastera`** (Maciej): self-check PASS → `→ MASTER: GOTOWE` + warstwa 🟢/🟡/🔴 + Slack (§2d decyzje-echo).

## `format` (alias: `ABC`) — wymuś poprawne pytanie
Maciej pisze to, gdy grupa zadała pytanie **źle** (skrót, brak Sytuacja/Dlaczego/Cel, gołe opcje w Ask). Agent **natychmiast** przepisuje w **formacie 5 kroków** (`.cursor/rules/abc-pelna-forma.mdc`): **Sytuacja → Dlaczego → Cel → A/B/C pełne → krótki AskQuestion**. Bez tłumaczeń.

## `zasady` (alias: `sprawdź zasady`) — czy grupa ma AKTUALNE reguły
Aktualna wersja reguł zmian: **ISO v1 (2026-06-28)** — źródło: `.cursor/rules/zmiany-izolacja.mdc`.
- W czacie grupy: agent czyta swój plik obiegu, sprawdza czy zawiera blok „📦 WŁASNA WERSJA TESTOWA (ISO-5)" + linię „POTWIERDZENIE ZASAD: ISO v1". Odpowiada: **stosuję ISO v1** (z literą grupy) lub czego brakuje.
- W czacie Master: zbiorczo per grupa — która ma `POTWIERDZENIE ZASAD: ISO v1`, która nie (czyli wymaga ponownej wklejki/onboardingu).
- Gdy grupa potwierdza po raz pierwszy — wpisuje `POTWIERDZENIE ZASAD: ISO v1 — stosuję (RRRR-MM-DD)` w swoim pliku obiegu (sekcja na górze).

---

## `reguły` (aliasy: `reguly`, `obieg`, `przypomnij zasady`) — **START DNIA / przypomnienie całego obiegu**

**Hasło Macieja:** wpisz **`reguły`** na początku pracy w czacie (Grupa A–F **lub** Master hub).

Agent **natychmiast** (bez dopytywania, przed inną pracą):

1. **Checklist obiegu** — odpowiedź w formacie 8 punktów z [`AUDYT-OBIEG-PAMIEC-SLACK-2026-07-04.md`](docs/obieg/AUDYT-OBIEG-PAMIEC-SLACK-2026-07-04.md) §6 (PASS/FAIL per punkt).
2. **Archiwum** — uruchom `python gra/tools/sync-chat-export.py --slot <SLOT> --chat-id <UUID> --mode auto` (slot z `REJESTR-CZATOW.md` lub transcript); dopisz `SYNC-EKSPORT:` do `DZIENNIK-MASTERA.md`.
3. **Slack (Master hub):** odczyt MCP `#master` (hasło pomocnicze **`slack`**) · lane: potwierdź obowiązek §2d po `przekaż do Mastera`.
4. **ABC Maciej:** potwierdź sekwencję ECHO → AskQuestion → `działaj` → `przekaż` (`.cursor/rules/decyzje-echo.mdc`).
5. **Koniec:** jedna linia `→ Gotowy do pracy. Czekam na: działaj / przekaż / start / master`.

**Rytuał dnia Macieja:** **`reguły`** w każdym aktywnym czacie → potem właściwe hasło pracy.

**Różnica vs `zasady`:** `zasady` = tylko ISO testów · **`reguły` = Slack + archiwum + ABC + zakres + playtest gate + handoff.**

**NIE mylić z `reguły mapa`** — to osobne hasło (kanon gameplay generatora, patrz niżej).

---

## `reguły mapa` (alias: `reguły rzeki`) — kanon MAPA (gameplay)

**Hasło Macieja:** **`reguły mapa`** — przypomnienie **ustaleń generatora/renderu brzegu**, nie obiegu.

Agent odpowiada **natychmiast** (skrót; pełny tekst: `docs/obieg/MAPA-KANON-GENERATOR.md`):

| Temat | Reguła |
|-------|--------|
| Brzeg | min. **10 hex** oceanu od krawędzi mapy |
| Ląd | od **środka**, równomiernie; kontynenty: centrum (0.5,0.5) + pierścień |
| Rzeki | źródło: **Góry/Wzgórza** · A* do morza · **opływa** relief · meandry, nie długa prosta |
| Quota rzek | per kontynent; tier Mało ~72 / Normalnie ~36 / Dużo ~22 hexów lądu na rzekę |
| Wybrzeże | jasnoniebieskie `#82C8E0`; piasek tylko na **lądzie** przy brzegu |
| Morze | płaska tafla, bez klifu w dół |
| Playtest | **Ctrl+F5** + **Nowa gra** |

**ZAKAZ:** odpowiadać tym formatem na samo **`reguły`** (bez „mapa").

---

## Zasady wspólne
- Odpowiadaj **w czacie** (Maciej nie czyta plików). Zwięźle.
- **Master hub — `raport`:** **10 kategorii** + sekcja **„Brak dowodu / nie zgaduję"**
  (kanon: [`R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1`](../../docs/decyzje/R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1.md),
  procedura §4). Pusta sekcja → `— (brak)`.
- **Master hub — `start` / `master`:** krótki skan operacyjny; pełny status stanu pracy
  na żądanie → **`raport`** (10 kategorii, nie układ A/B/C/4).
- **ARCHIWUM — SUPERSEDED:** dawny format **`raport`** w **4 sekcjach** A·B·C·4
  (Maciej 2026-07-02) — patrz sekcja ARCHIWUM powyżej; **nie** używać dla aktywnej
  komendy `raport` od 2026-08-18.
- Nie mieszaj z formatem **`raport2`** grup A–E (3 sekcje: wdrożone / w toku / u Mastera).
- Jeśli sekcja pusta — napisz „— (brak)", nie pomijaj nagłówka.
- Nie myl warstw: „przekazane" = u kogoś innego; „nie ruszone" = u tej grupy.
- Po komendach **`raport` / `status` / `pytania` / `co dalej`** — najpierw raport, potem ewentualne pytanie „działać?".
- Po **`start`** (Master) — od razu praca z 🎯 TERAZ.
- Po Macieju **`działaj`** / **`przekaż do Mastera`** — reguła `decyzje-echo.mdc` §2c–2d.
- Po Macieju **`plot code`** (Master hub) — skan dyspozycji → kod/handoff → **OBOWIĄZKOWO** na czacie: **`✅ Gotowe:`** / **`⏸️ Czeka:`** + wpis w [`MACIEJ-GOTOWE.md`](../docs/MACIEJ-GOTOWE.md) ([`PLOT-CODE-WORKFLOW.md`](../docs/obieg/PLOT-CODE-WORKFLOW.md), [`OBOWIAZ-POWIADOM-MACIEJA.md`](../docs/obieg/OBOWIAZ-POWIADOM-MACIEJA.md)).
- **Po każdej przygotowanej paczce pracy** — Maciej: **`✅ Gotowe:`** w czacie **oraz** dopisek w **`docs/MACIEJ-GOTOWE.md`** (nie tylko dziennik).
- Ściąga dla Macieja: `docs/obieg/KOMENDY-MACIEJA.md`.

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/maciej-nastepny-krok.mdc`

```text
---
description: Po każdym zakończonym kroku — Playtesty osobno, Następny krok pełna lista kodu (Maciej 2026-08-01/06)
alwaysApply: true
---

# Następny krok — obowiązek po każdej paczce (Maciej 2026-08-01 · split 2026-08-06 · pełna lista)

**Problem:** Maciej musi dopytywać „nad czym pracujesz?” / „co dalej?” — albo playtest miesza się z kodem i zamydla obraz — albo agent ucina listę do 3 pozycji i chowa resztę kolejki.

**Zasada:** po **każdym** zamknięciu sensownej jednostki pracy agent **sam** kończy wiadomość **dwoma blokami**.

## Format (zawsze na końcu odpowiedzi)

```
### Playtesty
- **…** — co sprawdzić w grze (wejście / md5 / konkretny ekran)
- (albo „— (brak)” jeśli nic do ogrania)

### Następny krok
1. **…** — rekomendacja (najpilniejsza)
2. **…**
…
N. **…** — wszystkie widoczne dalsze prace (kod/dane/docs), bez limitu 3
Napisz: działaj / 1 / 2 / … / N (albo inną dyspozycję).
```

Kanon: `docs/decyzje/R-NASTEPNY-KROK-SPLIT.md` · pełna lista: `docs/decyzje/R-NASTEPNY-KROK-PELNA-LISTA.md` · zakaz ABC o playtestach: `R-ABC-BEZ-PLAYTEST.md`.

## Reguły

1. **Playtesty** ≠ **Następny krok** — nigdy w jednym numerowanym menu.
2. **Następny krok** = tylko rzeczy do zrobienia przez agenta (kod/dane/docs/deploy na hasło).
3. **Pełna lista** — wszystkie widoczne kolejne prace z rejestru / ewaluacji / handoffu; **ZAKAZ** ucinać do 3. (Limit „max 3” dotyczył tylko ABC i jest wycofany — `R-ABC-PELNA-LISTA`.)
4. Pierwsza pozycja = rekomendacja.
5. Propozycje **konkretne** — nie „mogę pomóc dalej”.
6. **Nie czekaj** aż Maciej zapyta „co dalej?”.
7. Wyjątek: Maciej kończy sesję („stop”, „na dziś”) — krótki status bez menu.
8. Nie mylić z ABC gameplay — to kolejka operacyjna.

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/master-silnik-orchestration.mdc`

```text
---
description: Obieg gry — F publikuje gra-robocza/; Master promuje gra-kanon/; review subagent. Opus wycofany.
globs:
  - "**/*"
alwaysApply: true
---

> ⛔ REGUŁA HISTORYCZNA — ładuje się automatycznie, ale NIE OBOWIĄZUJE od 2026-07-06.
> Ignoruj procedury ról/publish/komend/Slack/AskQuestion/eksportu opisane niżej.
> Aktualny ład: dyspozycje/START-TU.md + OBIEG-KOMUNIKACJI-2026-07-06.md + ROLE-I-ZAKRESY-2026-07-06.md.
> Produkcja: 3 czaty Cowork (MASTER/INTEGRATOR/UX) na gra-robocza; roboczą publikuje WYŁĄCZNIE
> INTEGRATOR; kanon/finalną WYŁĄCZNIE Grupa G Cursor (pakiety DO-KANONU). Pytania do Macieja:
> tekstem w kanale, max 3, format A/B/C, BEZ popupów. Wersje: tylko dyspozycje/WERSJE.md.

# Schemat obiegu — źródło prawdy

> **Obieg:** `docs/obieg/OBIEG-AKCEPTACJA-2026-06-30.md` · **Dwie wersje:** `docs/obieg/DWIE-WERSJE-GRY.md` · **Plan izolacji:** `docs/obieg/PLAN-DWIE-WERSJE-IZOLACJA.md`
> **Zadania Master:** `docs/obieg/MASTER-ZADANIA.md` · **Opus wycofany** — review = subagent readonly (Master hub).

| Katalog | Kto | Start |
|---------|-----|-------|
| **`gra-robocza/`** | **Grupa F** po bramce · A–E test · Master (test) | `gra-robocza/START.html` |
| **`gra-kanon/`** | **Master** po APPROVE (`publish-kanon-snapshot.ps1`) | `gra-kanon/START.html` |

**Lane A–E + F: ZAKAZ `gra-kanon/`.** Kod źródłowy wspólny: `gra/`.

## Podział ról

| Etap | Grupa F (Integrator) | Master (hub) |
|------|----------------------|--------------|
| Kod wdrożenia lane | ✅ build · bramka · `gra-robocza/` | ❌ **nie koduje · nie builduje** |
| `main.ts` | ✅ jedyny editor | ❌ |
| ① Przekaż batch | odbiera dyspozycję od Mastera | **dyspozycja F** + uruchom F (Task / czat F) |
| Bramka + `gra-robocza/` | ✅ `publish-robocza-snapshot.ps1` | ❌ **ZAKAZ** `vite build` / `publish-robocza` u Mastera |
| ② Sprawdź wykonanie | meldunek `→ MASTER: GOTOWE-ROBOCZA` | weryfikacja md5 + testy (pliki, nie terminal) |
| ③ Grywalna część | ❌ | review → APPROVE → **`publish-kanon-snapshot.ps1`** → `gra-kanon/` |
| Kopia dzienna | ❌ | `backup-grywalna-dzien.ps1` przy `start` |

> **Maciej 2026-07-04:** wdrożenia z lane'ów → **Integrator F** → odsyła Masterowi. Master **nie robi wdrożenia sam**.

## Zasada kanon (2026-07-01): dyspozycja → wykonanie

**Krok 1:** przyjmij (ACK, pliki). **Krok 2:** wykonaj w tej samej turze. Szczegóły: [`MASTER-ZADANIA.md`](MASTER-ZADANIA.md).

## Pętla Mastera (skrót)

Meldunek lane → **krok 1** dyspozycja → **krok 2** uruchom F (Task) → F `gra-robocza/` → **krok 2** Master: weryfikacja + review + promocja.

## Slack (trigger)

Lane GOTOWE → `#grupa-X` · F ROBOCZA → `#grupa-f` · Master promocja → `#master` · Maciej: **`slack`**

## Zasady

1. Grupy A–E: **`przekaż do Mastera`** → `→ MASTER: GOTOWE` + handoff · graj **`gra-robocza/START.html`**.
2. Master → **natychmiast dyspozycja Integratora F** (handoff `MASTER-do-INTEGRATOR_*` + kolejka) — **nie** build/test/publish roboczej u Mastera.
3. **Integrator F** → build · bramka · **`→ MASTER: GOTOWE-ROBOCZA`** + md5 z `gra-robocza/ROBOCZA-MANIFEST.json` — **nie** `GOTOWE-KANON`, **nie** `gra-kanon/`.
4. Master → weryfikacja meldunku F (pliki, md5, scope) → review → APPROVE → **tylko** `publish-kanon-snapshot.ps1` (kopia `gra-robocza/` → `gra-kanon/`).
5. BLOCK → grupa źródłowa (nie F „dopnij" bez kontekstu lane).

**ZAKAZ Master (hub):** `npx vite build` · `publish-robocza-snapshot.ps1` · edycja `gra/src/**` · integracja batchy lane — to rola **F**.

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/model-routing.mdc`

```text
---
description: Aktywny routing modeli — główny orkiestrator GPT-5.6 Luna Medium, Operator i Evaluator GPT-5.6 Luna High.
globs:
  - "**/*"
alwaysApply: true
---

# Routing modeli — aktywny kanon (NIENEGOCJOWALNE)

**Źródło:** decyzja właściciela z **2026-08-19**. Dotyczy bieżącej bazy ROBOCZEJ.

| Rola | Aktywny model | Zakres |
|---|---|---|
| **Główny orkiestrator / final** | **GPT-5.6 Luna Medium** | plan, kontrola, synteza, decyzje procesowe oraz finalna bramka |
| **Operator AutoBot** | **GPT-5.6 Luna High** | wykonanie zleconej pracy w izolacji i guardrails |
| **Evaluator AutoBot** | **GPT-5.6 Luna High** | niezależny adwokat, metryki, SCOPE i regresja |

Render/Designer pozostaje istniejącym wyjątkiem: modele 3D jednostek i cała praca
w `gra/src/render/**` używają **Opus 5** dla Operatora i Evaluatora.

Operator nie wykonuje merge/deployu. Finalna kontrola należy do głównego orkiestratora;
po integracji wystawia `READY_FOR_DEPLOY`. Deploy/push jest osobną bramką i wymaga
wyraźnego polecenia właściciela; sam routing nie zmienia plików `WERSJE.md`, bundli
ani środowiska deployu.

## C-043 — kanał komunikacji właściciela (Maciej 2026-08-19)

Właściciel komunikuje się wyłącznie w głównym czacie orkiestratora. Subagenci są
kanałami technicznymi: ich raporty wracają do orkiestratora, który przekazuje
właścicielowi status, pytania i decyzje w głównym czacie.

## Historia zastąpiona

Wcześniejsze wpisy o Grok 4.5, `composer-2.5`, Haiku 4.5, Sonnet 5 i Opus 5 jako
domyślnym Operatorze/Evaluatorze są archiwalne. Zachowujemy je w historii commitów i
dokumentach decyzji, ale nie są aktywnym routingiem od 2026-08-18.

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/numer-abc-commit-deploy.mdc`

```text
---
description: Numer tematu → ABC → commit; deploy tylko na hasło Macieja
alwaysApply: true
---

# Numer → ABC → commit → deploy (Maciej 2026-08-03)

**Kanon:** `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`
**ID:** `R-PROC-NUMER-ABC`

## Obowiązek

1. **Każdy** case Macieja (pytanie o konkret, bug, poprawka, zmiana, innowacja) → **natychmiast numer (ID)** + wpis w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (bugi też `REJESTR-PROBLEMOW-AI.md` / `P-AI-###`).
2. Po rozpoznaniu tematu: **NIE** edytuj `gra/src` ani `gra/data` od razu — **przedstaw rozwiązanie** (± pełne ABC). STOP i czekaj.
3. Kod + **`git commit`** dopiero po decyzji w formie **`pełne-ID + A|B|C`** (np. `R-AUTO-BUDOWA-LISTA-Q2 A`, `R-STAWKI-STROJENIE B`).
4. **Deploy** do `gra-robocza/` **tylko** gdy Maciej napisze **`deploy`** / „deploy do robocza” / „publish robocza”. Sam commit ≠ deploy. Autonomia C-ORG-Q17 **nie** nadpisuje tej reguły.

## Pełne ID pytań (`R-PROC-ABC-FULL-ID`)

- **ZAKAZ** gołego `Q1` / `Q2` / `Q3` w paczkach ABC, Ask i ECHO (wiele wątków naraz).
- **WYMAGANE:** `R-<TEMAT>-Qn` (np. `R-AUTO-BUDOWA-LISTA-Q3`).
- Nagłówek paczki wymienia pełne ID; ECHO powtarza `ID=litera` dla każdego.

## Checklist

```
ID + rejestr → propozycja (±ABC) → czekaj → ECHO + kod + commit → deploy tylko na hasło
```

## Wyjątki

- Wyraźne „zapisz do plików” / dokumentacja procesu (bez zmian gry).
- Literówka w docs właśnie tworzonych dla tego tematu.

Nie wspominaj tej reguły w odpowiedzi, chyba że Maciej pyta o proces — stosuj milcząco.

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/obowiaz-playtest-master-only.mdc`

```text
---
description: Playtest u Macieja — informuje WYŁĄCZNIE Master. Lane milczy w czacie; dopis REJESTR §2.
globs:
  - "**/*"
alwaysApply: true
---

> ⛔ REGUŁA HISTORYCZNA — ładuje się automatycznie, ale NIE OBOWIĄZUJE od 2026-07-06.
> Ignoruj procedury ról/publish/komend/Slack/AskQuestion/eksportu opisane niżej.
> Aktualny ład: dyspozycje/START-TU.md + OBIEG-KOMUNIKACJI-2026-07-06.md + ROLE-I-ZAKRESY-2026-07-06.md.
> Produkcja: 3 czaty Cowork (MASTER/INTEGRATOR/UX) na gra-robocza; roboczą publikuje WYŁĄCZNIE
> INTEGRATOR; kanon/finalną WYŁĄCZNIE Grupa G Cursor (pakiety DO-KANONU). Pytania do Macieja:
> tekstem w kanale, max 3, format A/B/C, BEZ popupów. Wersje: tylko dyspozycje/WERSJE.md.

# OBOWIĄZ — playtest informuje tylko Master (2026-07-02)

**Decyzja Macieja:** zaległe playtesty, checklisty, prośby o test = **tylko Master** w hubie.

Pełna procedura: `docs/obieg/OBOWIAZ-PLAYTEST-REJESTR.md` · rejestr: `docs/master/REJESTR-PLAYTESTOW.md`

---

## Role

| Rola | Playtest w czacie z Maciejem |
|------|------------------------------|
| **Grupy A–E** | **ZAKAZ** — zero słów |
| **Integrator F** | **ZAKAZ** — meldunek techniczny bez playtestu |
| **Master** | **Jedyny** informuje Macieja (po ~100% gry lub na prośbę `playtest lista`) |
| **Maciej** | Odpowiada `playtest OK`/`BUG:` **tylko Masterowi** |

---

## Lane — po batchu w kanonie (cicho)

1. Dopisz wiersz **`docs/master/REJESTR-PLAYTESTOW.md` §2** (⏸ KOLEJKA).
2. W handoff do Mastera (Maciej nie czyta): `PLAYTEST-KANDYDAT: PT-XXX → rejestr §2`
3. **NIE** dopisuj playtestu do Slacka jako zadania dla Macieja.

---

## ZAKAZY w odpowiedzi do Macieja (A–E, F)

**Nigdy nie pisz** (ani wariantów):

- playtest · przetestuj · sprawdź w grze · gotowe do testu
- zaległy playtest · czeka playtest · OTWARTY · checklist PT-
- F-AC7 · PT-F01 · scenariusz 1–5 · `playtest OK`?

**W `start` / `raport2` / `status` / meldunku GOTOWE:** **brak sekcji Playtest**.

**Dozwolone u grupy:** ABC · wdrożenie · **`przekaż do Mastera`** · **`raport2`** (3 sekcje bez playtestu).

---

## Master — w czacie z Maciejem

- **`start` / `raport`:** **pomiń** sekcję playtest (chyba że Maciej pyta).
- **`playtest lista`:** czytaj REJESTR §1.
- **Prośba o test:** szablon `docs/master/SZABLON-PROŚBA-PLAYTEST.md` (tylko po §0).

---

## Self-check przed wysłaniem (lane A–F)

Przeskanuj swoją odpowiedź: czy zawiera słowo **playtest**, **PT-**, **test w grze**, **scenariusz** gameplayu?

→ **Usuń.** Playtest = tylko wpis §2 + Master.

Trigger w czacie grupy: **`obowiaż`** · **`rejestr`**

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/potrojna-warstwa-weryfikacji.mdc`

```text
---
description: Warstwa AutoBot — Operator + Evaluator + finalna kontrola + integracja. Maciej 2026-08-19.
globs:
  - "**/*"
alwaysApply: true
---

# Warstwa AutoBot: Operator → Evaluator → finalna kontrola → integracja → READY_FOR_DEPLOY

**Decyzja Maciej 2026-08-19:** raport Operatora automatycznie uruchamia Evaluatora;
po `PASS` główny orkiestrator wykonuje finalną kontrolę, aktualizuje status albo
przygotowuje pełne ABC z pełnym ID, albo kieruje temat do integracji. Integracja
kończy przygotowanie na `READY_FOR_DEPLOY`; deploy/push jest osobną bramką,
wyłącznie po bramkach i autoryzacji. **Nie zatrzymuj procesu po raporcie Operatora.**

## C-043 — kanał komunikacji właściciela (Maciej 2026-08-19)

Właściciel komunikuje się wyłącznie w głównym czacie orkiestratora. Subagenci są
kanałami technicznymi: ich raporty wracają do orkiestratora, który przekazuje
właścicielowi status, pytania i decyzje w głównym czacie.

## Trzy warstwy (kolejność obowiązkowa)

| # | Rola | Kto | Co robi |
|---|------|-----|---------|
| **1** | **Operator** | **GPT-5.6 Luna High** | Kod, testy, docs i raport z artefaktem. **Bez deployu.** |
| **2** | **Evaluator** | **GPT-5.6 Luna High** — osobny przebieg | Niezależna kontrola, SCOPE, regresja, twarde metryki i werdykt. |
| **3** | **Finalna kontrola** | **GPT-5.6 Luna Medium** (główny orkiestrator) | Kontrola raportów, status/ABC albo skierowanie do integracji. |
| **4** | **Integracja → READY_FOR_DEPLOY** | uprawniony orkiestrator/Integrator | Wpięcie po bramkach i przygotowanie paczki; bez publikacji. |

**ZAKAZ:** raportować „gotowe” / kierować do integracji / robić deploy po samym #1 —
bez #2 i #3.

## Checklista adwokata diabła (#2)

Agent #2 **musi** odpowiedzieć na:

1. **AC / decyzja** — czy każda litera Q/ABC jest spełniona w plikach (nie tylko w opisie)?
2. **SCOPE** — czy diff dotyczy **ściśle** zgłoszonego problemu/błędu (nie „przy okazji” innych tematów)? → kanon `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md` · playbook `rule_105` · **STRICT** `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT.md` · `rule_106`
3. **Regresja** — czy coś wcześniej działającego zostało usunięte, wyłączone lub osłabione (np. SPICH-AUTO lower, Q1=B, karencja głodu wojska, parytet AI/MP)?
4. **Skutki uboczne** — czy fix w module A psuje B (inne ownerId, save/load, UI, EOT order)?
5. **Testy** — czy asercje naprawdę łapią bug, czy tylko happy-path? **Luka testów / czerwone testy tematu / tsc≠0 → FAIL** (nie NOTES) — `R-PROC-AUTOBOT-EVAL-STRICT`. **Tylko happy-path bez edge/negacji/repro → FAIL #7** — `R-PROC-AUTOBOT-EVAL-STRICT-EDGE` · `rule_107`. **Asymetria gracz/AI/MP bez decyzji lub test tylko ownerId=0 → FAIL #8** — `R-PROC-AUTOBOT-EVAL-STRICT-PARITY` · `rule_108`. **Luka save/load nowego pola → FAIL #9** — `R-PROC-AUTOBOT-EVAL-STRICT-SAVE` · `rule_109`.
6. **Werdykt** — `PASS` / `FAIL` / `PASS-WITH-NOTES` + konkretne pliki:linie + co poprawić (bez wdrażania). **ZAKAZ** czystego PASS przy znanym naruszeniu SCOPE. **ZAKAZ** NOTES „brakuje testu, ale wygląda OK”.

## Kiedy obowiązuje

- Każda paczka kodu po `działaj` / implementacji z Task.
- Bugfix, feature, refaktor > ~50 linii lub > 1 plik silnika/UI.
- **Wyjątek wąski:** 1–3 linie czysto dokumentacyjne (bez `gra/src`) — wtedy #2 opcjonalne; finalna kontrola nadal obowiązuje.

## Jak odpalać (#2)

```
Evaluator · model GPT-5.6 Luna High · prompt: „ADWOKAT DIABŁA — nie implementuj.
Branch / commit / lista plików / AC decyzji.
Przeczytaj diff i powiązany kod (przed/po zachowania).
Szukaj regresji i luk. Raport: PASS|FAIL + lista usterek.”
```

Główny orkiestrator po #2: jeśli FAIL → fix (kolejny #1 lub sam drobny patch) →
**ponów #2** na delcie fixu → #3 → integracja.

## Powiązane

- Routing modeli: `.cursor/rules/model-routing.mdc`
- Opis dla Macieja: `dyspozycje/POTROJNA-WARSTWA-WERYFIKACJI.md`

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/subagent-watchdog.mdc`

```text
---
description: Watchdog — 1 temat=1 agent, cisza 7 min=ZWIS→orkiestrator przejmuje (Maciej 2026-08-02, aktualizacja 2026-08-19)
alwaysApply: true
---

# Watchdog subagentów (Maciej 2026-08-02, limit zaktualizowany 2026-08-19)

## 1. Jeden temat = jeden subagent

- Każdy temat → **osobny** subagent.
- Zakaz dwóch agentów na ten sam temat.
- Maksymalnie **6 otwartych** subagentów równolegle; tematy muszą być niezależne.
- Subagent zakończony, ale niezamknięty, nadal zajmuje slot i musi zostać zamknięty przez orkiestratora.
- Gdy istnieją niezablokowane tematy, wszystkie 6 slotów mają być wykorzystane. Po zakończeniu
  jednego subagenta jego slot natychmiast przechodzi do kolejnej wymaganej fazy.

## 1a. Obowiązkowy sygnał zakończenia

Raport końcowy musi zawierać `STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA`, pełne ID tematu,
zmiany/commity, dokładne wyniki testów, blokady i następny krok. Samo `gotowe` ani UI
`działa` nie jest dowodem zakończenia. Raport Operatora uruchamia Evaluatora; po terminalnym
raporcie rola jest zamykana albo przechodzi do następnej fazy. Raport musi również zawierać
`DEPLOY/PUSH: wykonano albo nie wykonano`. `PASS-WITH-NOTES` nie kończy procesu; przechodzi
dalej tylko z jawnymi, nieblokującymi uwagami zaakceptowanymi przez finalną kontrolę.
`READY_FOR_DEPLOY` jest zastrzeżone dla orkiestratora po finalnej kontroli i integracji;
Operator i Evaluator raportują wynik swojej roli, nie końcową gotowość publikacyjną.

## 1b. Pętla bez zatrzymania

`FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA` i `ZWIS` zawsze uruchamiają bez czekania
`Operator → Evaluator` z tym samym pełnym ID; Operator dostaje konkretną listę poprawek.
Tylko `BLOCK` wymagający decyzji właściciela uruchamia ABC i pauzuje wyłącznie ten temat.
`PASS` przechodzi do finalnej kontroli.
Pętla trwa dla tego samego ID aż do `PASS` Evaluatora, pozytywnej finalnej kontroli i
rzeczywistego przygotowania izolowanej paczki `READY_FOR_DEPLOY`. Paczka z cudzymi zmianami,
niepełną allowlistą, nieprzejściem bramek albo nierozwiązanym konfliktem nie jest zakończona;
wraca do Operatora.

## 2. Cisza 7 minut = ZWIS → orkiestrator przejmuje (nie restart)

| Sygnał | Próg | Akcja |
|--------|------|--------|
| Brak ruchu w transcriptcie (mtime / nowe linie) | **7 min** | **ZWIS** → interrupt + orkiestrator przejmuje temat |
| UI „Working” bez ruchu w pliku | **7 min** | to samo |

**Decyzja Macieja (2026-08-02 wieczór):** nawet **1×** zawieszenie subagenta → **STOP delegacji**, orkiestrator **sam doprowadza temat do końca**.
**ZAKAZ:** restartować tego samego tematu kolejnym subagentem po ZWIS. Orkiestrator przejmuje
wykonanie i uruchamia dalszą pętlę `Operator → Evaluator` z tym samym ID.

**ZAKAZ:** traktować ZWIS jako „Stop All / anuluj / odpuszczamy temat”.
**ZWIS = temat nadal żywy** → orkiestrator kontynuuje w czacie głównym.

Wyjątek anulowania: tylko gdy Maciej **wyraźnie** kasuje temat albo temat był czysto informacyjny i odpowiedź już padła.

**Obowiązek orkiestratora:** po starcie zadania w tle — **po 7 min** sprawdź transcript **sam**. Nie czekaj, aż Maciej zapyta.

Hasło: **`status agentów`** / **`czy zwisł?`** → tabela: temat · ostatni ruch · pracuje/ZWIS.

Komunikat przy ZWIS: `1× ZWIS → orkiestrator przejmuje temat.`

## 3. Prompt (żeby mniej wieszać)

- Shell / mapgen wall-clock **max ~3 min**.
- Zakaz ciężkiej Pangea × wiele seedów w tle.
- Sygnał pośredni: `GOTÓW DO TESTU` + md5 albo `STOP: …` / `✅ Gotowe w źródłach — wrzucić na ROBOCZA?`.
  Nie zastępuje obowiązkowego raportu terminalnego i nie oznacza `READY_FOR_DEPLOY`.

## 4. Nie wprowadzaj Macieja w błąd (status procesu)

## 4a. Znaczenie komendy właściciela „sprawdź”

Gdy właściciel pisze `sprawdź`, orkiestrator wykonuje pełny audyt: obejmuje całą bieżącą pulę
oraz historyczne `not_found` do reconciliacji. Sprawdza status terminalny i
ostatni ruch, czyta każdy dostępny raport, klasyfikuje wynik (`PASS`, `PASS-WITH-NOTES`,
`FAIL`, `BLOCK`, `TIMEOUT`, `INFRA`, `READY_FOR_DEPLOY` albo niepewne), zamyka zakończonych i uruchamia
obowiązkowy następny etap dla każdego wyniku. `not_found` bez raportu wymaga odtworzenia
statusu z transcriptu/logu albo zgłoszenia braku dowodu.

**ZAKAZ** mówić „READY_FOR_DEPLOY” bez **twardej weryfikacji w tej turze**. Ten status
oznacza koniec procesu przygotowania, nie wykonany deploy/push.

Przed statusem „gotowe” sprawdź dowody (nie pamięć, nie UI „Working”):
1. transcript: `turn_ended` + `success` **albo** brak końca = **nie gotowe**,
2. efekt w repo: WERSJE md5 / diff / test PASS / plik zmieniony,
3. jeśli nie sprawdziłeś → status tylko: **„niepewne — sprawdzam”** / **„w toku”** / **„ZWIS — przejmuję”**.

**ZAKAZ:** zgadywać z podtytułu UI („Deployed…”) że temat zamknięty.
**ZAKAZ:** potem robić twarde sprawdzenie i zmieniać wersję historii („jednak niedokończone”) — najpierw sprawdź, **potem** mów.

## 5. Routing modeli i odpowiedzialności

- `Operator` = **GPT-5.6 Luna High**: wykonuje jeden temat w izolacji, zgodnie z playbookiem,
  i składa raport terminalny.
- `Evaluator` = **GPT-5.6 Luna High**: niezależnie sprawdza zakres, regresje, testy, artefakt
  i blokady; nie zastępuje Operatora i nie integruje paczki.
- `Finalna kontrola/integracja` = główny orkiestrator na **GPT-5.6 Luna Medium**: czyta raport,
  weryfikuje stan repozytorium, obsługuje ABC, integruje wyłącznie zatwierdzony zakres i może
  wystawić `READY_FOR_DEPLOY`.
- `deploy`/`push` są osobną bramką po `READY_FOR_DEPLOY` i wymagają wyraźnej autoryzacji;
  żaden subagent nie wykonuje ich samowolnie.

## C-043 — kanał komunikacji właściciela (Maciej 2026-08-19)

Właściciel komunikuje się wyłącznie w głównym czacie orkiestratora. Subagenci są
kanałami technicznymi: ich raporty wracają do orkiestratora, który przekazuje
właścicielowi status, pytania i decyzje w głównym czacie.

Po każdym terminalnym raporcie orkiestrator: (1) odczytuje raport i weryfikuje artefakt,
(2) zamyka zakończonego subagenta, (3) natychmiast uruchamia wymagany następny etap albo
kolejny niezależny temat. Gdy istnieje niezablokowana praca, wszystkie 6 slotów musi być
wykorzystane; wolny slot bez blokady jest błędem routingu.

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/testy-tlo-kontrol.mdc`

```text
---
description: Testy — uruchamiaj, czekaj na wynik, raportuj PASS/FAIL/TIMEOUT. Zakaz wiszących node i „odpal w tle i zapomnij”.
globs:
  - "**/*"
alwaysApply: true
---

# Testy — kontrola wykonania (NIENEGOCJOWALNE)

**Powód:** Maciej 2026-07-28 — 7× `cluster-start-test` w tle ~4 h, zero efektu, ~0,6–1 GB RAM × 10 node. Doprecyzowanie: *„testy wolno i trzeba — ale wiedzieć, że się wykonały i co dowiozły."*

## Zasada główna

- Testy **wolno i trzeba** uruchamiać — to normalna praca.
- Agent **musi** doczekać wyniku (`Await` / foreground `block_until_ms`) i wiedzieć: **zakończone** vs **timeout** vs **hung**.
- W raporcie do Macieja / parenta: **`PASS` / `FAIL` / `TIMEOUT`** + **1 linia** co dowiozły (albo że nic).
- **ZAKAZ** „odpal w tle i zapomnij".

## ZAKAZY

- **NIE** odpalać w tle (`block_until_ms: 0` / background) długich suite’ów bez limitu — szczególnie **więcej niż 1 kopię naraz**.
- Dotyczy m.in.: `cluster-start-test.cjs`, `map-gen-regression-test.cjs` (full), łańcuchy „pełny tsc + cluster”, diplomacy fan-out.
- **NIE** fan-out 3–7 równoległych długich testów „na wszelki wypadek" (subagenci włącznie).

## Wymagane

| Zasada | Wartość |
|--------|---------|
| Preferuj | krótkie, celowane testy lane’u |
| Długie suite’y | **jeden** na raz, foreground + jawny timeout |
| Typowy `.cjs` | max **~3–5 min** (`block_until_ms` / `Await`); dłużej tylko gdy Maciej każe |
| Po limicie | **zabij** proces → raportuj **TIMEOUT** — **nie** zostawiaj orphaned `node` |
| Koniec sesji / przed deploy | sprawdź brak wiszących `node tools/*-test.cjs` |

## Raport (szablon)

```
combat-test.cjs — PASS (6/6) — kontrata typów bez regresji
cluster-start-test.cjs — TIMEOUT 5 min — zabity, brak wyniku
```

## Przykład

```
❌ block_until_ms: 0 × 5× cluster-start-test → zapomniane
❌ „uruchomiłem testy" bez PASS/FAIL/TIMEOUT
✅ node tools/combat-test.cjs — block_until_ms: 180000 → PASS 6/6
✅ timeout → kill → TIMEOUT — cluster-start, nic nie dowiózł
```

```

---

## HISTORYCZNY SNAPSHOT: `.cursor/rules/zmiany-izolacja.mdc`

```text
---
description: Bezpieczne zmiany — izolacja grup, 3 warstwy zmian, mapa połączeń, bramka wizualna. Żeby grupy nie psuły sobie nawzajem.
globs:
  - "**/*"
alwaysApply: true
---

> ⛔ REGUŁA HISTORYCZNA — ładuje się automatycznie, ale NIE OBOWIĄZUJE od 2026-07-06.
> Ignoruj procedury ról/publish/komend/Slack/AskQuestion/eksportu opisane niżej.
> Aktualny ład: dyspozycje/START-TU.md + OBIEG-KOMUNIKACJI-2026-07-06.md + ROLE-I-ZAKRESY-2026-07-06.md.
> Produkcja: 3 czaty Cowork (MASTER/INTEGRATOR/UX) na gra-robocza; roboczą publikuje WYŁĄCZNIE
> INTEGRATOR; kanon/finalną WYŁĄCZNIE Grupa G Cursor (pakiety DO-KANONU). Pytania do Macieja:
> tekstem w kanale, max 3, format A/B/C, BEZ popupów. Wersje: tylko dyspozycje/WERSJE.md.

# Bezpieczne zmiany — izolacja + warstwy + mapa połączeń (NIENEGOCJOWALNE)

> **Wersja reguł: ISO v1 (2026-06-28).** Weryfikacja na grupie: komenda `zasady` (`.cursor/rules/komendy-raport.mdc`).

**Problem:** grupa zmienia swój kawałek, nie wie o ukrytych połączeniach (wspólny stan / render / `main.ts`) i psuje coś innego (np. zmiana w mieście wykrzacza mapę). Poniższe to likwiduje, bez spowalniania drobnych poprawek.

Decyzje ISO-1…4 (2026-06-28) → `docs/obieg/REJESTR-DECYZJI.md`. Mapa połączeń → `docs/obieg/MAPA-POLACZEN.md`.

## 1. Podział sprawdzania (ISO-5 + SIMP-1) — kto co testuje

> Cel jest jeden: **grupa nie psuje gry innym.** Środki dobrane realnie — bez obciążania Macieja (zero terminala) i bez wąskiego gardła na Masterze.

- **Grupa A–E (agent w SWOIM czacie) — lekki self-check przed handoffem:**
  - uruchamia **kompilację (`typecheck`) + testy swojego obszaru** (sam, w swoim terminalu),
  - sprawdza, że nie ruszył `main.ts` ani plików innych grup,
  - zgłasza `→ INTEGRATOR: GOTOWE` z: warstwą (🟢/🟡/🔴) + krótkim „co sprawdzić po wpięciu".
  - To łapie „rozwaliłem kod/logikę". **Pełnego buildu całej gry grupa NIE musi robić.**
- **Integrator (Grupa F) — test całości + wizualny (właściciel, jego stały obowiązek):** standardowymi komendami (bez specjalnego skryptu): typecheck + testy + `npx vite build --outDir %TEMP%\civ-dist` (build BEZ publikacji) → **otwiera i patrzy** na mapę/miasto/HUD (regresje wizualne) → dopiero zielono+wygląd OK publikuje `Gra-podglad-ROBOCZA.html`.
- **Master:** weryfikuje raport Integratora, routing. **Nie** odpala kodu/testów sam.
- **Maciej:** tylko czat + finalny playtest. **Zero terminala.**
- **Duża/ryzykowna** zmiana → warstwa 🔴: najpierw kontrakt z Masterem + osobna gałąź.
- Grupa **NIE** edytuje `main.ts` ani plików innych grup. Nigdy.

## 2. Trzy warstwy zmian (ISO-2) — klasyfikuje grupa, weryfikuje Integrator

| Warstwa | Kryterium | Ścieżka |
|---|---|---|
| 🟢 **Izolowana** | tylko własny moduł, **zero** wpływu na wspólny stan/render/`main.ts` | grupa robi → self-build → bramka logiczna → handoff; Integrator **scala zbiorczo (batch)** |
| 🟡 **Cross / współdzielona** | dotyka wspólnego stanu, renderu, save/load, lub innej grupy | **obowiązkowo** przez Integratora: sprawdza `MAPA-POLACZEN.md` + rozszerzone testy + bramka wizualna |
| 🔴 **Duża / ryzykowna** | przebudowa, nowy system, zmiana struktury stanu | **najpierw kontrakt z Masterem** + worktree; potem Integrator wpina |

**Zasada szybkości:** drobne 🟢 nie idą pojedynczo — Integrator bierze je **batchem**. Tylko 🟡/🔴 wymagają pełnej kontroli.

## 3. Integrator — świadomość połączeń (ISO-3)

- Prowadzi `docs/obieg/MAPA-POLACZEN.md` (co dzieli wspólny stan / render / `main.ts`).
- Przy KAŻDYM handoffie: sklasyfikuj warstwę, sprawdź względem mapy połączeń, czy zmiana nie dotyka czegoś poza deklaracją grupy.
- Po wpięciu aktualizuje mapę połączeń, jeśli pojawił się nowy coupling.

## 4. Bramka wizualna (ISO-4)

- Przed publikacją `Gra-podglad-ROBOCZA.html`: oprócz testów logicznych — **render/visual smoke** (screenshot mapy + miasta + HUD), porównanie z odniesieniem.
- „Mapa się wykrzaczyła" = bramka **czerwona**, nie publikujemy. (Zadanie wdrożeniowe: `INTEGRATOR-kolejka.md`.)

## 5. Self-check grupy PRZED handoffem (wszystkie TAK)
1. `typecheck` przechodzi (kod się kompiluje)?
2. Testy mojego obszaru zielone?
3. Sklasyfikowałem warstwę (🟢/🟡/🔴) w handoffie?
4. Nie ruszyłem `main.ts` ani cudzych plików?
5. Napisałem „co sprawdzić po wpięciu" dla Integratora?

Jeśli choć jedno NIE → nie oddawaj; popraw albo eskaluj (🟡/🔴 → Integrator/Master).
Test wizualny całej gry **nie jest** zadaniem grupy — robi go Integrator.

```
