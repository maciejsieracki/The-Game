# INDEX PROCESU — mapa źródeł prawdy i artefaktów AutoBot

Ten dokument jest mapą „co gdzie jest" — nie punktem startowym. Uniwersalny,
niezależny od narzędzia punkt startowy to [`README.md`](../../README.md); ten
indeks czyta się jako jego krok 2. Nie przechowuje bieżących statusów,
decyzji ABC ani wyników runu. Aktualny stan przejęcia jest zawsze w
[`dyspozycje/_handoff/HANDOFF-AKTUALNY.md`](../../dyspozycje/_handoff/HANDOFF-AKTUALNY.md).

## 1. Start sesji

Pełna kolejność czytania jest w [`README.md`](../../README.md) — ten indeks jej
nie powtarza, żeby nie rozjeżdżała się w dwóch miejscach. Skrót: `README.md` →
ten indeks → `R-PROC-AUTOBOT.md` → `playbook.md` w całości → `HANDOFF-AKTUALNY.md`
→ `KANAL-PRACA.md` → rejestr/ABC/decyzja → dopiero na końcu Git i kod.

Jeśli temat jest zmianą samego AutoBota, dodatkowo przeczytaj mapę warstw
[`dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md`](../../dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md).

Nie zaczynaj od starego handoffu, płaskiego logu ani samego czatu. Nie czytaj i nie
zmieniaj `gra/` dla paczki dokumentacyjnej.

## 2. Hierarchia źródeł prawdy

| Zakres | Źródło aktywne | Zapis / dowód |
|---|---|---|
| Norma procesu | ten indeks + `R-PROC-AUTOBOT.md` + reguła `alwaysApply` | korekta w kanonie procesu |
| Stan przejęcia | `HANDOFF-AKTUALNY.md` wskazany także przez `STAN-PRACY-HANDOFF.md` | bieżący handoff |
| Temat i status | `dyspozycje/REJESTR-PROSB-I-ZADAN.md` | jeden status z listy zamkniętej |
| Aktywne ABC | `dyspozycje/PYTANIA-OTWARTE.md` | pełne ABC; po odpowiedzi ECHO i odsyłacz decyzji |
| Decyzja właściciela | `docs/decyzje/<ID>.md` | wariant, data, kryteria i konsekwencje |
| Przebieg AutoBot | `dyspozycje/autobot/runs/<ID>/` | `00-dispatch` → `01-operator` → `02-evaluator` → `03-final-control` → `04-integration` |
| Przekazanie | `dyspozycje/_handoff/KANAL-PRACA.md` | krótki wpis + `CZEKAM-NA:` |
| Publikacja | `dyspozycje/WERSJE.md` | tylko po wykonanym deployu: fala, md5, stempel, commit, zakres, status |
| Pamięć procesu | `playbook.md`; `playbook.json` jest generowany | zmieniaj Markdown, JSON tylko generatorem |
| Historia | `docs/archiwum-procesu/` i oznaczone snapshoty | nie nadpisuje aktywnego routingu |
| Audyt procesu | `dyspozycje/autobot/tools/process-docs-audit.cjs` | linki, statusy, runy, stare routingi i zakaz zmian w `gra/` |

Przy konflikcie nie wybieraj po cichu starszego tekstu. Zatrzymaj interpretację,
porównaj najnowsze ECHO, handoff i dowód na dysku, a rozjazd zapisz do korekty.

## 3. Gdzie zapisywać każdy artefakt

| Artefakt | Obowiązkowe miejsce | Minimalna zawartość |
|---|---|---|
| Zgłoszenie / pełne ID | `REJESTR-PROSB-I-ZADAN.md` | ID, data, GOAL, status kanoniczny, dowód/następny gate |
| Otwarte pytanie ABC | `PYTANIA-OTWARTE.md` | pełne ID, sytuacja, cel, powód, A/B/C, za/przeciw, rekomendacja |
| Odpowiedź właściciela | ECHO w `PYTANIA-OTWARTE.md` + `docs/decyzje/<ID>.md` | literalna decyzja, wariant, data, kryteria i konsekwencje |
| Dispatch | `runs/<ID>/00-dispatch.md` | GOAL, SCOPE, allowlista, worktree, plan i kryteria |
| Raport Operatora | `runs/<ID>/01-operator.md` | zmiany, testy, commit, status, blokady, następny krok |
| Raport Evaluatora | `runs/<ID>/02-evaluator.md` | niezależny diff/scope, testy, werdykt i warunki poprawki |
| Final Control | `runs/<ID>/03-final-control.md` | kompletność śladu, bramki, „gotowość do integracji: TAK/NIE” |
| Integracja | `runs/<ID>/04-integration.md` | faktyczny zakres, commit, testy, `READY_FOR_DEPLOY` i deploy/push |
| Handoff bieżący | `dyspozycje/_handoff/HANDOFF-AKTUALNY.md` | stan, pakiety, blokady, następny krok |
| Kanał pracy | `dyspozycje/_handoff/KANAL-PRACA.md` | ≤ krótki meldunek między sesjami, `CZEKAM-NA:` |
| Publikacja | `dyspozycje/WERSJE.md` | dopiero po deployu/pushu; nie wpisuj samego READY |
| Postmortem | `dyspozycje/autobot/logs/postmortems.jsonl` | append-only JSONL zgodny z playbookiem |
| Kryteria STRICT Evaluatora | `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT*.md`, `-SCOPE.md` | happy-path, parytet gracz/AI, save/load — trzy twarde FAIL-e domeny gry |
| Turniej ABC | `docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md` | obowiązkowy dla każdego NOWEGO pytania ABC; `playbook.md` → C-018 |
| Format raportu „raport" | `docs/decyzje/R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1.md` | dziesięć kategorii statusu, wyzwalane hasłem `raport` |
| Bezpieczna edycja AutoBota | `dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md` | mapa wszystkich warstw mechanizmu; czytaj przed zmianą reguł samego AutoBota |

`dyspozycje/autobot/logs/` pozostaje miejscem historycznych raportów legacy. Nowego
raportu nie zapisuj wyłącznie w logu ani w czacie; run jest kanonicznym śladem.

Po zmianach dokumentacyjnych uruchom `node dyspozycje/autobot/tools/process-docs-audit.cjs`.
Audyt nie zastępuje Evaluatora ani Final Control; jest powtarzalną bramką techniczną
spójności dokumentacji.

## 4. Obowiązujący obieg i ten sam ID

```text
Operator GPT-5.6 Luna High
  → Evaluator GPT-5.6 Luna High
  → Final Control GPT-5.6 Luna High (osobny subagent)
  → integracja orkiestratora GPT-5.6 Luna Medium
  → READY_FOR_DEPLOY
  → osobna autoryzacja deploy/push
```

`FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA`, `ZWIS`, błąd izolacji, brak dowodu
albo niegotowość Final Control wracają bez czekania do Operatora → Evaluatora → Final
Control. Zawsze zachowaj pełne ID; poprawka nie tworzy nowego tematu. `ZWIS` nie
anuluje pracy — watchdog sprawdza Git i artefakty, a orkiestrator przejmuje temat.

Jedyną pauzą jest `ABC-OCZEKUJE` wymagające decyzji właściciela. Decyzje prowadzi się
wyłącznie w głównym czacie orkiestratora (C-043), a zapisuje plikowo. `READY_FOR_DEPLOY`
może wystawić wyłącznie orkiestrator po faktycznej integracji. Deploy/push jest osobną
bramką i nie wynika z raportu, commita ani samego READY.

## 5. Statusy kanoniczne

Rejestr używa dokładnie jednej wartości dla bieżącego tematu:

`NOWE` · `ABC-OCZEKUJE` · `OPERATOR` · `EVALUATOR` · `FINALNA-KONTROLA` ·
`DO-INTEGRACJI` · `ZINTEGROWANE` · `DEPLOY-ROBOCZA` · `ZAMKNIĘTE` · `BLOCK` ·
`ODŁOŻONE` · `ODRZUCONE` · `DUPLIKAT`.

Stare etykiety w historycznych sekcjach pozostają historią. Nie uznawaj statusu bez
raportu/dowodu za zakończenie. `READY_FOR_DEPLOY` jest bramką procesu, nie zamiennikiem
statusu rejestru i nie oznacza wykonanego deployu.

## 6. Kontrakt raportu i integracji

Każdy etap zapisuje:

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA
TEMAT: <pełne ID>
GOAL: <cel końcowy>
ZMIANY/COMMIT: <allowlista, artefakt, SHA albo brak zmian>
TESTY: <dokładne wyniki albo powód pominięcia>
BLOKADY: <jawna lista albo brak>
NASTĘPNY KROK: <kolejna bramka>
DEPLOY/PUSH: WYKONANO albo NIE WYKONANO
```

Przed integracją orkiestrator sprawdza wszystkie trzy raporty, GOAL, allowlistę,
faktyczny diff, commit, testy, blokady, run i brak zmian w `gra/` dla docs-only. Po
integracji zapisuje wynik w `04-integration.md`; `WERSJE.md` dopiero po publikacji.

## 7. Historia i zakres indeksu

Pakiet 2 zachował snapshoty aktywnych dokumentów i reguł w
[`docs/archiwum-procesu/`](../archiwum-procesu/). Starsze procedury, handoffy i płaskie
raporty są referencyjne lub historyczne, jeśli nie są wskazane w tabeli powyżej.
Ten indeks nie wpisuje statusów, nie podejmuje decyzji właściciela, nie integruje,
nie deployuje, nie pushuje i nie dotyka `gra/`.
