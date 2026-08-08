# Jak bezpiecznie edytować sam system AutoBot

Ten dokument nie mówi, jak grać w Civ ani jak kodować grę. Mówi, jak zmieniać **sam
system AutoBot** — jego reguły, mechanizmy, skille — żeby zmiana faktycznie zadziałała
u przyszłego agenta, a nie tylko wyglądała na wprowadzoną w rozmowie z właścicielem.

Spisane 2026-08-08 po pracy nad syntezą `lean-loop` + `civ-autobot` i po wdrożeniu
`R-PROFIL-TURNIEJ-PUNKTACJA-Q1` — każda zasada niżej ma pokrycie w konkretnym incydencie
z tej sesji, nie jest teorią.

---

## 0. Mapa plików — cały mechanizm, nie tylko reguły

Zanim zmienisz jedną regułę, zobacz **cały szkielet**. AutoBot w tym repo to nie jeden
plik — to zestaw plików, z których każdy ma inną rolę i inny cykl życia. Poniższa mapa ma
być kompletna: jeśli odtwarzasz ten mechanizm od zera (nowy projekt, świeży agent bez
pamięci tej sesji), to jest lista tego, co musi powstać i jak się ze sobą łączy.

### Warstwa 1 — wejście (co agent czyta na starcie sesji)

| Plik | Rola |
|---|---|
| `CLAUDE.md` (korzeń) | Zasady krytyczne całego projektu — punkt zero, obowiązuje zawsze |
| `STAN-PRACY-HANDOFF.md` (korzeń) | Żywy stan pracy: co zrobione, co w toku, decyzje już podjęte |
| `.claude/skills/civ-autobot/SKILL.md` | Nakładka projektowa — skrót AutoBota dla tego repo, ładowany na żądanie/wyzwalacz |
| `/root/.claude/skills/lean-loop/SKILL.md` + `references/*.md` | Uniwersalny rdzeń AutoBota — przenośny, poza repo, `civ-autobot` go dziedziczy |
| `.cursor/rules/autobot-evaluator-operator.mdc` | **`alwaysApply: true`** — ładuje się zawsze, niezależnie od tego, czy skill jest wywołany. To realny punkt wejścia, nie skill |
| `.cursor/rules/potrojna-warstwa-weryfikacji.mdc` | **`alwaysApply: true`**, aktywna. Wcześniejsza (2026-08-05), Cursor-owa wersja tej samej pętli (Implementer/adwokat diabła/Grok final, `composer-2.5`) — jawnie **subsumowana**, nie duplikat do osobnej edycji: `autobot-evaluator-operator.mdc` mówi wprost „Potrójna warstwa = wbudowana w kroki 1–3 AutoBot, nie osobny rytuał". Zmieniając kroki 1–3, sprawdź czy ten plik nie zawiera sprzecznej, starszej wersji tych samych progów (FAIL #7/#8/#9) |
| `.cursor/rules/numer-abc-commit-deploy.mdc` | **`alwaysApply: true`**, aktywna. Odpowiednik §2 skillu `civ-autobot` — NUMER→ABC→commit→deploy, ładuje się niezależnie od skillu |
| `.cursor/rules/model-routing.mdc` | **`alwaysApply: true`**, aktywna. Przydział modeli **dla Cursora** (Grok 4.5 + `composer-2.5`) — równoległy do `CLAUDE.md` §4, który dotyczy Claude Code i wprost mówi „NIE dotyczy Cursora". Dwa różne przydziały modeli dla dwóch różnych narzędzi, nie sprzeczność do naprawienia |
| `.cursor/rules/abc-pelna-forma.mdc`, `.cursor/rules/decyzje-echo.mdc` | **`alwaysApply: true`**, ale oba oznaczone w treści „REGUŁA HISTORYCZNA — ładuje się automatycznie, ale NIE OBOWIĄZUJE od 2026-07-06". Ładują się, ale nieaktywne — nie edytuj ich myśląc, że to żywa reguła |

### Warstwa 2 — kanon reguł (co wolno, jak działać; zmienia tylko decyzja właściciela)

| Plik | Rola |
|---|---|
| `docs/decyzje/R-PROC-AUTOBOT.md` | Opis całego procesu, v1/v2, protokół błędu |
| `docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md` | Turniej dwóch Proponentów + Sędzia |
| `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md` | Bazowe SCOPE+regresja Evaluatora |
| `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT.md` | Twardość werdyktów — luka testów/AC/`tsc≠0` → FAIL, nie NOTES |
| `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-EDGE.md` | FAIL #7 — happy-path bez edge/negacji/repro |
| `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-PARITY.md` | FAIL #8 — asymetria gracz/AI/MP bez decyzji/testu |
| `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-SAVE.md` | FAIL #9 — luka save/load nowego pola |
| `docs/decyzje/R-AUTOBOT-EVALUATOR-WARSTWY-MODELI.md` | Podział etapów Evaluatora na warstwy modeli |
| `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md` | Procedura NUMER→ABC→COMMIT→DEPLOY |

### Warstwa 3 — pamięć (żywa, z licznikami — **jedyna warstwa, która się sama aktualizuje**)

| Plik | Rola |
|---|---|
| `playbook.md` (korzeń) | **Źródło prawdy.** Tabela reguł z ID, tekstem, licznikami win/fail, statusem |
| `dyspozycje/autobot/playbook.json` | **Generowany**, nigdy ręcznie edytowany — patrz §2 |
| `dyspozycje/autobot/tools/playbook-md-to-json.cjs` | Generator `.md` → `.json`, jedyna dozwolona droga zapisu do `.json` |

### Warstwa 4 — egzekwowanie w kodzie (guardrails — pilnują reguł programowo)

| Plik | Rola |
|---|---|
| `dyspozycje/autobot/src/guardrails.ts` | `assertActionAllowed` (deny-by-default), `FORBIDDEN_ACTION_IDS`, `assertProdIsolation`, `canDeclareWinner`/`assertEvaluationDelay` |
| `dyspozycje/autobot/src/playbook-manager.ts` | `retireWeakRules` — automatyczne wygaszanie/promocja reguł wg liczników |
| `dyspozycje/autobot/src/feature-pruning.ts` | Usuwanie cech o znikomej korelacji z wynikiem |
| `dyspozycje/autobot/src/logging.ts` | Zapis postmortemów (moduł „Dashboard Logger") |
| `dyspozycje/autobot/src/evaluator-agent.ts` | Logika werdyktu Evaluatora — serce oceny |
| `dyspozycje/autobot/src/operator-agent.ts` | Logika Operatora — wykonanie akcji w granicach guardrails |
| `dyspozycje/autobot/src/hard-metrics.ts` | Twarde metryki (nie self-grade) do postmortemu |
| `dyspozycje/autobot/src/types.ts`, `index.ts`, `shims-node.d.ts` | Typy i punkt wejścia modułu |
| `dyspozycje/autobot/tools/autobot-smoke.cjs` | Bramka dymna scaffoldu — szybka weryfikacja, że mechanizm w ogóle się uruchamia |
| `dyspozycje/autobot/package.json`, `tsconfig.json` | Konfiguracja modułu TS scaffoldu |
| `dyspozycje/autobot/README.md` | Opis scaffoldu |
| `dyspozycje/autobot/PROMPT-AUTOBOT-DLA-AGENTOW.md` | Gotowy prompt wklejany subagentom uruchamianym w roli Operatora/Evaluatora |
| `dyspozycje/autobot/protokol-v1.2/AUTOBOT-PROMPT-v1.2.md` | Specyfikacja protokołu w wersji 1.2 (historyczna referencja, sprawdź czy nadal aktualna względem `R-PROC-AUTOBOT.md` §v2) |
| `dyspozycje/autobot/KOLEJKA-FABLE-5.md` | Kolejka zadań zarezerwowanych dla Fable 5, dziś zablokowana (`R-FABLE-RETENCJA-NASTER=B`) |
| `dyspozycje/autobot/dist-smoke/` | Artefakty bramki dymnej (build scaffoldu) |

### Warstwa 5 — ślad / księgowość (dowód, że pętla faktycznie przeszła)

| Plik | Rola |
|---|---|
| `dyspozycje/autobot/logs/postmortems.jsonl` | Append-only log: run_id, metric before/after, delta%, wniosek, akcja |
| `dyspozycje/REJESTR-PROSB-I-ZADAN.md` | ID każdego case'a/decyzji — **obowiązkowy dla każdej zmiany AutoBota, nie tylko gry** |
| `dyspozycje/PYTANIA-OTWARTE.md` | Pytania ABC czekające na literę właściciela |
| `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md` | Wzorce decyzyjne właściciela — wejście do turnieju (§9 niżej) |
| `dyspozycje/_handoff/KANAL-PRACA.md` | Meldunek dla innych sesji — „czego nie zapiszesz tu, tego dla drugiej sesji nie było" |
| `dyspozycje/WERSJE.md` | Log deployów (md5, co weszło, status) |

**Zasada odtwarzalności:** brakujący plik w którejkolwiek warstwie nie jest kosmetyką —
to dziura, przez którą przyszły agent ominie regułę, bo jej po prostu nigdzie nie
znajdzie. Warstwa 1 (wejście) jest najważniejsza do sprawdzenia jako pierwsza, bo to ona
decyduje, czy agent w ogóle dowie się o istnieniu pozostałych czterech.

---

## 1. AutoBot żyje w wielu plikach naraz — zmiana musi trafić do WSZYSTKICH

Kanoniczny zestaw miejsc do sprawdzenia przy **każdej** zmianie reguły procesu (nie kodu
gry — reguły *jak pracujemy*):

| Plik | Rola | Pułapka |
|---|---|---|
| `docs/decyzje/R-PROC-AUTOBOT*.md` | Kanon, pełny opis z uzasadnieniem | Łatwo zapomnieć zaktualizować przy szybkiej poprawce |
| `.claude/skills/civ-autobot/SKILL.md` | Skrót, który agent czyta na starcie sesji | Musi być skrótem WIERNYM kanonowi, nie własną redakcją |
| `.cursor/rules/autobot-evaluator-operator.mdc` | **`alwaysApply: true`, globs `**/*`** | **Ładuje się PRZED kanonem.** Jeśli go pominiesz, przyszły agent uruchomi STARĄ regułę, nawet gdy kanon mówi co innego — to najważniejszy plik do sprawdzenia, nie ostatni |
| `playbook.md` → `playbook.json` | Pamięć z licznikami | Dwa pliki, jedno źródło prawdy — patrz §2 |

**Dowód:** `R-PROFIL-TURNIEJ-PUNKTACJA-Q1` przeszło 4 rundy Evaluatora, zanim wszystkie 5
plików (dodając wygenerowany `.json`) miały identyczny, kompletny zestaw reguł i
wyjątków. Pierwsza wersja pominęła 3 z 5 plików całkowicie — w tym `.mdc`, czyli plik,
który przyszły agent czyta jako pierwszy.

## 2. `playbook.json` nigdy nie edytuj ręcznie

Zawsze: zmień `playbook.md` (tabela, kolumna „Zasada") → uruchom
`node dyspozycje/autobot/tools/playbook-md-to-json.cjs --write` → sprawdź w wyniku, że
liczniki `win_count`/`fail_count` zostały **zachowane** (nowa treść reguły nie zeruje
historii jej stosowania, chyba że to naprawdę nowa reguła — wtedy 0/0 jest poprawne).
Generator ma tryb **bez** `--write` do sprawdzenia różnic bez zapisu — używaj go do
weryfikacji Evaluatora zamiast zgadywać, czy plik jest aktualny.

## 3. Listy wyjątków/warunków muszą być identyczne SEMANTYCZNIE wszędzie

Nie wystarczy, że każdy plik „ma jakiś wyjątek" — muszą to być **te same** wyjątki, w tej
samej liczbie. Agent czyta zwykle tylko JEDEN z tych plików na starcie sesji (zależnie od
tego, co go tam skierowało) i działa wg tego, co tam znajdzie. Rozjazd = różne zachowanie
zależnie od przypadku, który plik akurat przeczytał — a nie od świadomej decyzji.

**Dowód:** runda 2 i runda 3 Evaluatora tej samej zmiany złapały dokładnie ten błąd
dwukrotnie z rzędu — raz brakowało wyjątku w 2 z 5 plików, raz innego wyjątku w innych 2 —
mimo że każda runda deklarowała naprawę.

## 4. Orkiestrator nie ocenia sam siebie — nawet przy pracy nad SAMYM AutoBotem

Każda zmiana reguł procesu, tak samo jak zmiana kodu gry, przechodzi przez osobnego
Evaluatora (`CLAUDE.md` §0b, playbook `C-017`). Ten dokument sam powstał pod tą regułą —
4 rundy Evaluatora dla jednej zmiany procesu to nie przesada, to dowód, że mechanizm
działa: **każda** runda złapała realny błąd, którego orkiestrator sam by nie zobaczył.

## 5. „Wdrożenie: gotowe" w rejestrze musi być dosłownie prawdziwe

Nie pisz, że coś jest zaimplementowane we „wszystkich miejscach", dopóki nie sprawdziłeś
KAŻDEGO wymienionego miejsca osobno. Fałszywe twierdzenie o kompletności jest osobnym
błędem (`C-016` — sprawdzaj co JEST w plikach, nie co pamiętasz), niezależnym od tego, czy
sama zmiana merytoryczna jest dobra. W tej sesji zdarzyło się **co najmniej trzykrotnie**
przy samej tylko `R-PROFIL-TURNIEJ-PUNKTACJA-Q1`: fałszywe „Wdrożenie" w rundzie 1 (3
kluczowe pliki pominięte, nieujawnione), fałszywe „trzy miejsca" w rundzie 2 (czwarty plik
brakował), plus osobny przypadek przy weryfikacji `civ-autobot` wcześniej tej samej sesji.

## 6. Kompletność jest kryterium sukcesu, nie tylko poprawność

Zasada właściciela („Nic nie usuwamy") dotyczy też edycji samego AutoBota. Przy syntezie
lub migracji materiału źródłowego (np. tworzenie `lean-loop` z Ponytaila i AutoBota) —
nie skracaj, nie pomijaj rzeczy „bo wydają się mało ważne". **Dwie kolejne, niezależne
weryfikacje „100% kompletności" w tej sesji okazały się niekompletne** dopiero przy
trzecim, bardziej wymagającym (adwokat diabła) przebiegu. Nie ufaj własnej pierwszej
ocenie „gotowe", zwłaszcza gdy właściciel wprost prosi o wyczerpującą weryfikację.

## 7. Przy niepewności decyzji syntezy — turniej, nie zgadywanie

Dwie niezależne propozycje + Sędzia, zanim cokolwiek trafi do właściciela jako gotowa
rekomendacja. Dotyczy też decyzji o tym, jak zsyntetyzować sprzeczne fragmenty materiału
źródłowego, nie tylko pytań ABC o grę.

## 8. Nowa reguła procesu = nowy wpis w `REJESTR-PROSB-I-ZADAN.md` z ID

AutoBot rządzi się swoimi własnymi zasadami NUMER → ABC → ECHO, tak samo jak bug w grze.
Zmiana bez ID jest niewidoczna dla przyszłej sesji, która przegląda rejestr, żeby
zrozumieć, co się wydarzyło i dlaczego.

## 9. Żywa rozmowa z właścicielem ≠ automatycznie potrzebuje turnieju C-018

Turniej broni przed ślepym kątem JEDNEGO autora. Gdy właściciel współtworzy projekt w
bezpośrednim dialogu (a nie odpowiada literą na gotowy, cudzy projekt), jest już drugą
parą oczu — turniej nie wnosi nic dodatkowego. **Ale odnotuj to wprost w rejestrze jako
świadomy, uzasadniony wyjątek**, nie jako milczące pominięcie kroku — inaczej wygląda to
jak obejście reguły, nie jak jej prawidłowe zastosowanie.

## 10. Cytuj żywe wartości z plików, nigdy z pamięci

Szczególnie liczby konfiguracyjne (progi, wersje, liczniki) — mogły dryfować od czasu,
gdy je ostatnio czytałeś, albo od czasu, gdy inna sesja coś zmieniła. Przykład z tej
sesji: `minRunsForSignificance` w kanonie mówi „10", żywy `playbook.json` ma dziś „5" —
rozbieżność, którą złapano dopiero przy dosłownym odczycie pliku, nie przy przywołaniu z
pamięci poprzedniej rozmowy.

---

## Skrócona checklista przed commitem zmiany w AutoBocie

1. Czy zmiana mechanizmu jest identyczna (semantycznie) we wszystkich plikach z §1?
2. Czy `.mdc` (`alwaysApply: true`) został zaktualizowany — sprawdzony jako **pierwszy**, nie ostatni?
3. Czy `playbook.json` powstał z generatora (`--write`), nie ręczną edycją?
4. Czy uruchomiłeś generator w trybie bez zapisu, żeby potwierdzić „brak różnic" przed commitem?
5. Czy wpis w rejestrze mówi wyłącznie to, co faktycznie sprawdziłeś w plikach — zero „powinno działać"?
6. Czy osobny Evaluator (nie ty) zweryfikował zmianę, zanim ją uznałeś za zamkniętą?
7. Czy nowa reguła ma ID w `REJESTR-PROSB-I-ZADAN.md`?

**Jeśli którykolwiek punkt to „nie wiem" — sprawdź, zanim skomitujesz.** To dokładnie ta
kolejność pytań, która w tej sesji za każdym razem znajdowała realny, jeszcze niezamknięty
problem.
