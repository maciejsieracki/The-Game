# The-Game — AGENT START HERE

> **Jeden dokument wejściowy dla każdego nowego agenta.**
>
> Ten plik jest indeksem, nie zastępuje dokumentów źródłowych. Przeczytaj go w
> całości, a następnie dokumenty w podanej kolejności. Status Kanbana, Git,
> worktree, branchy i procesów zawsze sprawdzaj na żywo — nie ufaj liczbom ani
> podsumowaniom zapisanym tutaj.
>
> **Status publikacji:** ta wersja jest bieżącym indeksem przekazanym z OVH na
> osobną gałąź GitHub. Pełny audyt i uzgodnienie wszystkich plików Markdown
> między OVH a GitHubem jest odłożone na osobny krok; brakujący w GitHubie plik
> jest oznaczony jawnie zamiast udawać działający link.

## 0. Zasada nadrzędna

Pracujesz w projekcie Civ „The Game”. Obowiązuje obieg:

```text
Operator → Evaluator → Defense tylko przy konkretnych zarzutach
         → Final Control → integracja/staging → READY_FOR_DEPLOY
         → osobna autoryzacja push/deploy
```

Nie skracaj tej ścieżki. Raport `PASS`, commit, nazwa brancha ani status UI
nie oznaczają integracji do `main` ani wdrożenia do `gra-robocza`.

## 1. Tożsamość i bieżący zakres

| Pole | Wartość |
|---|---|
| Repozytorium | `/home/ubuntu/projects/The-Game` |
| Kanban | `the-game-real24` |
| Historyczny/wykonawczy profil kart | `the-game` — nie zmieniaj istniejących kart bez readbacku |
| Kontroler/receiver serwerowy | `autobotmonitor` |
| Główna ścieżka kodu starej gry | `gra/src/**`, `gra/data/**` |
| Ścieżka portu Rust | `rust-port/engine/**` |
| Artefakt roboczy starej gry | `gra-robocza/**` — artefakt, nie źródło kodu |
| Główny workspace | `/home/ubuntu/projects/The-Game` |

Jeżeli profil, projekt, board, workspace albo provider się nie zgadza, zatrzymaj
zależny temat jako `INFRA/ROUTING_ERROR`. Nie twórz profilu zastępczego i nie
przypisuj karty do `default` tylko dlatego, że jest dostępny.

### Hierarchia, gdy dokumenty się różnią

1. świeży, uwierzytelniony readback Kanbana/Git oraz jawna decyzja właściciela;
2. aktywne `R-PROC-AUTOBOT.md`, `R-PROC-AUTOBOT-HERMES-KANBAN.md`, polityka
   modeli AutoBot Monitor i ten indeks;
3. `README.md`, `playbook.md`, `CLAUDE.md` i bieżące rejestry;
4. pliki oznaczone `historyczny`, `referencyjny`, `kompatybilność` lub archiwum.

Nie wybieraj po cichu starszej wersji. W szczególności historyczne wpisy
`Operator High → ... → Final Control High/Medium` nie zastępują aktualnego
routingu z sekcji 4 tego pliku: dla nowych kart obowiązuje jawne
`max/priority`, a dla Final Control `ultra/priority`.

## 2. Obowiązkowa kolejność czytania

### A. Kanoniczna kolejność startowa — dokładnie z `README.md`

1. [`README.md`](README.md) — jedyny uniwersalny punkt wejścia, niezależny od
   narzędzia.
2. [`docs/procesy/INDEX-PROCESU.md`](docs/procesy/INDEX-PROCESU.md) — mapa:
   co gdzie jest i gdzie zapisywać artefakty.
3. [`docs/decyzje/R-PROC-AUTOBOT.md`](docs/decyzje/R-PROC-AUTOBOT.md) — pełna
   norma procesu: role, ABC/ECHO, bramki i bariery.
4. [`playbook.md`](playbook.md) — przeczytaj cały plik: aktywne reguły C-0XX,
   rejestr błędów „nigdy więcej” i sprawy otwarte.
5. [`dyspozycje/_handoff/HANDOFF-AKTUALNY.md`](dyspozycje/_handoff/HANDOFF-AKTUALNY.md)
   — bieżący stan przejęcia.
6. Końcówka [`dyspozycje/_handoff/KANAL-PRACA.md`](dyspozycje/_handoff/KANAL-PRACA.md)
   — ostatnie przekazania; nie czytaj całej historii bez związku z tematem.
7. [`dyspozycje/REJESTR-PROSB-I-ZADAN.md`](dyspozycje/REJESTR-PROSB-I-ZADAN.md)
   — rejestr tematów, duplikatów oraz statusów ZINTEGROWANE/PORZUCONE.
8. [`dyspozycje/PYTANIA-OTWARTE.md`](dyspozycje/PYTANIA-OTWARTE.md) — aktywne
   ABC/ECHO i decyzje właściciela oczekujące na odpowiedź.

Ta kolejność jest obowiązkowa i ma pierwszeństwo przed skrótami narzędziowymi.
`STAN-PRACY-HANDOFF.md` jest tylko wskaźnikiem kompatybilności i nie zastępuje
`HANDOFF-AKTUALNY.md`.

Po każdej serii rejestracji sprawdź wszystkie otwarte wpisy dokładną komendą:

```bash
grep -nE 'STATUS:[[:space:]]*\*{0,2}OTWARTE' dyspozycje/PYTANIA-OTWARTE.md
```

Dla każdego trafienia musi istnieć subagent w toku, zadane ABC albo jawny,
trwały powód odłożenia.

### B. Łączniki specyficzne dla narzędzia — po sekcji A

9. [`CLAUDE.md`](CLAUDE.md) — automatycznie ładowany w Claude Code; zawiera
   dodatkowo audyt kompletności §0c/C-031.
10. [`gra-robocza/CLAUDE.md`](gra-robocza/CLAUDE.md) — publikacja do
    `gra-robocza/`; wykonuje ją wyłącznie Integrator.
11. `.cursor/rules/*.mdc` — wszystkie aktualne reguły `alwaysApply` (sprawdź
    świeży katalog; jego liczba może się zmienić).
    Szczególnie: `komendy-raport.mdc`, `autobot-evaluator-operator.mdc`,
    `civ-workflow.mdc`, `decyzje-echo.mdc`, `numer-abc-commit-deploy.mdc`,
    `zmiany-izolacja.mdc` i `subagent-watchdog.mdc`.
12. [`.claude/skills/autobots/SKILL.md`](.claude/skills/autobots/SKILL.md),
    a następnie [`.claude/skills/civ-autobot/SKILL.md`](.claude/skills/civ-autobot/SKILL.md)
    — uniwersalny szkielet, potem konkrety Civ.
13. [`.claude/skills/civ-autobot-workflow/SKILL.md`](.claude/skills/civ-autobot-workflow/SKILL.md)
    — alternatywna Ścieżka A z jawnym effort per rolę; używaj tylko, gdy ta
    ścieżka jest jawnie aktywna.
14. [`.claude/skills/civ-autobot-cursor-automations/SKILL.md`](.claude/skills/civ-autobot-cursor-automations/SKILL.md)
    — trzecia ścieżka Cursor Automations, ograniczona do reconu i PR.

[`AUTOBOT.md`](AUTOBOT.md) i [`AUTOBOT-UNIVERSAL.md`](AUTOBOT-UNIVERSAL.md) są
dokumentami referencyjnymi/historycznymi; czytaj je po kanonicznej kolejności,
gdy potrzebujesz ich kontekstu. Nie mogą nadpisać aktywnej normy Hermes z sekcji
A i C.

### C. Hermes Kanban i dokumentacja mechanizmu AutoBota

15. `docs/decyzje/R-PROC-AUTOBOT-HERMES-KANBAN.md` — graf, receipt, izolacja i
    lifecycle Hermes. **OVH-only w tej wersji: plik istnieje w bieżącym
    worktree serwera, ale nie jest jeszcze w `origin/main`; nie traktuj braku
    linku na GitHubie jako braku dokumentu.**
16. [`dyspozycje/autobot/README.md`](dyspozycje/autobot/README.md) — mapa
    artefaktów AutoBota.
17. Wspólny kontrakt serwerowego kontrolera:
    `/home/ubuntu/projects/Autoboot-Monitor/AUTOBOT-KANBAN.md`. Zastosuj zasady
    ogólne, ale wartości boardu/profilu AutoBot Monitor nie zastępują wartości
    The-Game.
18. [`dyspozycje/AUTOBOT-SCHEMAT-DZIALANIA.md`](dyspozycje/AUTOBOT-SCHEMAT-DZIALANIA.md)
    — skrót referencyjny; aktywne reguły Hermes z tego indeksu i
    `R-PROC-AUTOBOT-HERMES-KANBAN.md` mają pierwszeństwo.
19. Dla zmiany reguł AutoBota, routingu, Crona lub receivera najpierw:
    [`dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md`](dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md),
    potem `dyspozycje/autobot/README.md`,
    `dyspozycje/autobot/SZABLON-00-DISPATCH.md`,
    `dyspozycje/autobot/PROMPT-AUTOBOT-DLA-AGENTOW.md` oraz
    `dyspozycje/autobot/KOLEJKA-FABLE-5.md`.
20. Dla routingu modeli i Fast/priority:
    `/home/ubuntu/projects/Autoboot-Monitor/docs/AUTOBOT-MODEL-EFFORT-FAST-POLICY.md`
    oraz `/home/ubuntu/projects/Autoboot-Monitor/docs/ABM-MODEL-REPAIR-PLAN.md`.
    Dla helpera dodatkowo czytaj
    `/home/ubuntu/.hermes/profiles/autobotmonitor/skills/the-game-kanban-helper/SKILL.md`.

Ślady per temat czyta się punktowo, po pełnym ID — nie hurtem:

- `dyspozycje/autobot/runs/<PEŁNE-ID>/*.md`: `00-dispatch`, raport Operatora,
  Evaluatora, Defense i Final Control; nazwy mogą różnić się między procesami;
- `docs/decyzje/<ID>.md`: decyzja kanoniczna konkretnego tematu.

### D. Równoległe procesy i świeży readback

Git potwierdza ślady commitów autora `AutoBot Orkiestrator <autobot@nagents.local>`
powiązanych z boardem `the-game-real24`; załącznik właściciela wskazuje, że
ten proces może równolegle zmieniać `playbook.md`, `R-PROC-AUTOBOT.md`,
`civ-autobot/SKILL.md` i `autobot-evaluator-operator.mdc`. Traktuj to jako
aktywną granicę współbieżności: przed edycją tych plików wykonaj świeże
`git status`, `git log` i odczyt treści; nie nadpisuj cudzych zmian, nie stashuj,
nie resetuj i nie rebazuj. Jeśli treść zmieni się podczas pracy, zatrzymaj
zależny zapis i wykonaj ponowny readback zamiast scalać po cichu.

### E. Wyraźnie nie na start

Nie zaczynaj od starego handoffu, płaskiego logu, samego czatu,
`docs/archiwum-procesu/` ani dawnych plików lane’owego modelu współpracy
(`MASTER-do-INTEGRATOR_*`, `UI-do-MASTER_*`, `CYWILIZACJE-do-*`). To historia,
nie aktywny routing. Wracaj do niej tylko po konkretnym ID lub incydencie.

Dla każdego odczytu używaj jawnego boardu:

```bash
hermes -p autobotmonitor kanban --board the-game-real24 stats
hermes -p autobotmonitor kanban --board the-game-real24 list --json
hermes -p autobotmonitor kanban --board the-game-real24 diagnostics
hermes -p the-game project list
hermes -p the-game project show the-game
```

Natywny lifecycle Kanbana jest źródłem statusu i zależności. Terminalny event
oraz readback task/run/report/workspace są wymagane; sam tekst „zrobione” nie
wystarcza.

### F. Praca nad kodem i jakość

21. Dla Evaluatora i Final Control, gdy temat tego wymaga:
    - `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT.md`
    - `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-EDGE.md`
    - `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-PARITY.md`
    - `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-SAVE.md`
    - `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md`
22. Dla tematów Rust przeczytaj dodatkowo opis konkretnego tematu w
    `dyspozycje/autobot/runs/<PEŁNE-ID>/00-dispatch.md` oraz wszystkie terminalne
    raporty jego rodziców.

### G. Integracja, staging, deploy i publikacja

23. [`dyspozycje/START-TU.md`](dyspozycje/START-TU.md) — procedura pracy
    integratora.
24. [`dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`](dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md)
    — obowiązkowa procedura commit/push/deploy.
25. [`dyspozycje/WERSJE.md`](dyspozycje/WERSJE.md) — rejestr wersji; nie aktualizuj
    go przed faktycznym deployem według runbooka.
26. [`dyspozycje/_handoff/KANAL-PRACA.md`](dyspozycje/_handoff/KANAL-PRACA.md)
    — wpis po zakończeniu integracji/deployu.

Hasło właściciela **„deploy do roboczej”** oznacza pełną procedurę:

```text
readback → testy → build → stempel → manifest → hashe → commit
→ git push branch → git push main, jeśli wymaga runbook
→ remote readback → porównanie artefaktów → wpis WERSJE/KANAŁ
```

Bez tego hasła worker nie wykonuje merge, push, deployu ani restartu gatewaya.

## 3. Reguły bez wyjątków

- Nie uruchamiaj `npm run dev` ani `npm run build` w starej grze.
- Do builda starej gry używaj wyłącznie komendy zatwierdzonej w `CLAUDE.md`.
- Nie używaj `git add -A`, `git add .`, `git reset`, `git clean`, `git stash`,
  `git rebase` ani force-push.
- Nie przykrywaj brudnego drzewa przez pull/reset/clean. Najpierw readback
  `git status`, worktree, branch i HEAD.
- Nie modyfikuj karty `running` i nie reclaimuj aktywnego workera.
- Nie uruchamiaj Defense bez niepustej, numerowanej listy konkretnych zarzutów
  Evaluatora. Istniejącą kartę warunkową pozostaw w grafie; nie twórz duplikatu.
- Nie wznawiaj ukończonego Operatora, Evaluatora, Defense ani Final Control tylko
  dlatego, że istnieje starsza karta historyczna.
- Nie zmieniaj kodu produktu w roli supervisora Kanbana.
- Nie zapisuj haseł, tokenów, connection stringów ani sekretów w repozytorium,
  raporcie, komentarzu Kanbana lub handoffie.
- `gra/src/**` i `gra/data/**` to osobna linia od `rust-port/engine/**`.
  PASS portu Rust nie oznacza deployu starej gry.
- Lokalny commit/staging nie oznacza `origin/main`, `gra-robocza` ani publikacji.
- Przy niejednoznaczności zapisz `DECISION_REQUIRED`/`OWNER_HOLD` na konkretnej
  karcie i kontynuuj niezależne tematy.

## 4. Routing modeli dla nowych kart

Dla nowych lub naprawianych kart obowiązuje jawny routing:

```text
Operator       gpt-5.6-luna / openai-codex / max    / priority
Evaluator      gpt-5.6-luna / openai-codex / max    / priority
Defense        gpt-5.6-luna / openai-codex / max    / priority
Final Control  gpt-5.6-luna / openai-codex / ultra  / priority
```

`reasoning_effort` i `service_tier` są niezależne. Brak jawnej wartości jest
`INFRA/ROUTING_ERROR`, nie domyślnym sukcesem. Istniejące historyczne karty
zachowują swoje ustawienia, chyba że wykonywana jest jawna, wspierana naprawa
karty nieuruchomionej.

## 5. Startowa checklista agenta

Przed pierwszą zmianą lub dispatchem potwierdź:

```text
[ ] Przeczytane źródła z sekcji 2A–2C.
[ ] Zidentyfikowane pełne ID tematu i duplikaty w rejestrze.
[ ] Odczytany board `the-game-real24`, profil i projekt.
[ ] Odczytane wszystkie parents/children i terminalne runy rodziców.
[ ] Sprawdzony workspace, branch, HEAD, status i allowlista.
[ ] Sprawdzony model, provider, effort, Fast i process_phase.
[ ] Istnieje 00-dispatch oraz raport/journal/receipt wymagany przez temat.
[ ] Wiadomo, czy następny krok jest Operator, Evaluator, Defense, Final Control
    czy staging.
[ ] Wiadomo, czego nie wolno wykonać bez decyzji właściciela.
```

Po każdej terminalnej fazie wykonaj dwa readbacki:

1. **techniczny:** task, run, event, raport, artefakt, hash, workspace, Git,
   usage, diagnostics i notify/wake;
2. **kontekstowy:** GOAL, allowlista, rodzice/dzieci, decyzje właściciela,
   wcześniejsze werdykty, idempotency key i następna bramka.

Dopiero wtedy uruchom istniejącego następcę albo zapisz trwałą blokadę.

## 6. Zasada aktualizacji tego pliku

Ten indeks można rozszerzać, gdy zmieni się kanoniczna kolejność dokumentów lub
pojawi się nowa chroniona bariera. Nie wpisuj tu bieżących liczników Kanbana,
chwilowych PID-ów, commitów ani statusów tematów — takie dane starzeją się i
muszą pochodzić z live readbacku.
