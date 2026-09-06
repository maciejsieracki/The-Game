---
name: civ-autobot-workflow
description: >
  Dispatch Operator/Evaluator/Final Control AutoBot dla Civ przez narzędzie
  orkiestracji wieloagentowej Workflow, z jawnym model+effort per rolę. Używaj
  WYŁĄCZNIE gdy Workflow jest dostępny w tej sesji Claude Code ORAZ właściciel
  dał jawną, opt-in zgodę na multi-agent orchestration w tej sesji. Bez obu
  warunków użyj `civ-autobot`/`autobots` zamiast tego skilla.
---

# Civ — AutoBot dispatch przez Workflow (Ścieżka A)

Ten skill jest **Ścieżką A** z playbook C-061: dispatch Operator/Evaluator z jawnie
ustawionym `effort` per rolę, możliwy WYŁĄCZNIE przez narzędzie orkiestracji
wieloagentowej (Workflow), nigdy przez pojedynczy dispatch `Agent`.

## 0. Warunek wstępny — sprawdź PRZED użyciem tego skilla, nie zgaduj

1. Narzędzie Workflow jest faktycznie dostępne w tej sesji (nie zakładaj z pamięci
   poprzedniej sesji — dostępność jest per sesja).
2. Właściciel dał **jawną, opt-in zgodę na multi-agent orchestration w TEJ sesji**.
   Workflow nie uruchamia się bez tego i zgoda nie przenosi się automatycznie
   z wcześniejszej sesji ani z ogólnej zgody na AutoBot.

Jeśli którykolwiek warunek nie jest spełniony — **nie używaj tego skilla**. Wróć do
`.claude/skills/civ-autobot/SKILL.md` (albo `autobots/SKILL.md`) i różnicuj role
Operator/Evaluator wyłącznie przez treść promptu, bez parametru effort — to jest
Ścieżka B, w pełni poprawna i dziś aktywnie używana.

## 1. Dlaczego to jest osobna ścieżka, nie warunek w istniejącym skillu

Narzędzie `Agent` (podstawowy dispatch subagentów Claude Code) ma w swoim schemacie
parametr `model`, ale **nie ma** parametru `effort`/`reasoning_effort` — sprawdzone
bezpośrednio w schemacie narzędzia, nie z dokumentacji z pamięci. Różnicowanie
Operator (Sonnet 5, effort Medium) / Evaluator (Sonnet 5, effort High) zgodnie z
`docs/decyzje/R-PROC-AUTOBOT.md` §5a jest więc fizycznie możliwe wyłącznie przez
narzędzie z `opts.effort` per agent (Workflow) — nie przez `Agent`. Pełny opis
incydentu, który to ujawnił: `playbook.md` C-061.

## 2. Co ten skrypt Workflow NIE robi (kanon C-042, nie zmienia się w tej ścieżce)

- Nie wystawia `READY_FOR_DEPLOY`.
- Nie integruje kodu do drzewa głównego poza zatwierdzonym zakresem/allowlistą.
- Nie commituje, nie pushuje, nie deployuje.
- **Final Control od 2026-09-06 należy DO skryptu** (ECHO właściciela — patrz §2a niżej).
  Integracja (allowlist-only, per plik i per hunk — C-059), `READY_FOR_DEPLOY` i cały
  deploy/push dzieją się **poza** tym skryptem, ręką orkiestratora.
- Nie resetuje ani nie prowadzi samodzielnie licznika rund (C-050) ani ledgeru
  dispatchu (C-051) — to prowadzi orkiestrator, poza samym skryptem.

**Od 2026-08-29 (`R-PROC-AUTOBOT.md` §3c) skrypt ma TRZY fazy, nie dwie, gdy
Evaluator zwróci zarzuty:** Operator → Evaluator (zarzuty, lista może być pusta)
→ Operator, ta sama rola, drugie wywołanie `agent()` (Obrona — TYLKO gdy lista
niepusta) → **Final Control, w tym samym skrypcie** (zmiana z 2026-09-06, §2a niżej)
→ koniec skryptu. Obrona NIE zwiększa licznika rund — jest częścią tej
samej rundy Operator→Evaluator. Gdy lista zarzutów jest pusta, skrypt kończy się
po dwóch fazach jak w wersji sprzed 2026-08-29.

## 2a. Final Control JEST w skrypcie — zmiana z 2026-09-06 (ECHO właściciela)

**Było:** skrypt kończył się po Obronie, a Final Control szedł osobnym wywołaniem Workflow,
ręką orkiestratora. **Jest:** skrypt ma cztery fazy i kończy się dopiero werdyktem Final Control.

**Powód — zmierzony, nie teoretyczny.** W nocy z 5 na 6 września sześć tematów skończyło
Obronę między 23:15 a 03:05 i **czekało 3,5–7,5 godziny** na Final Control, bo orkiestrator
go nie odpalił. Kontener zrestartował się o 06:36, ale to nie było przyczyną — praca była
skończona wiele godzin wcześniej. **Wąskim gardłem był jeden brakujący ruch orkiestratora
między dwoma fazami, które i tak następują po sobie automatycznie.**

**Niezależność Final Control jest zachowana** — i to jest warunek, bez którego ta zmiana
byłaby regresem. Każda faza to osobne wywołanie `agent()` z **własnym, czystym kontekstem**;
bycie w tym samym skrypcie nie daje Final Control dostępu do rozumowania Operatora ani
Evaluatora. Dostaje dokładnie to, co dostawał przy osobnym wywołaniu: raporty z worktree
i własne uruchomienia bramek. Orkiestrator nadal ma obowiązek składać mu zarzuty i obronę
**bez etykiet ról** (§3c).

**Czego ta zmiana NIE dotyka.** Integracja, `READY_FOR_DEPLOY` i deploy/push zostają poza
skryptem, wyłącznie ręką orkiestratora (C-042, C-044). Skrypt nadal niczego nie integruje
i nie pushuje.

**Bramki zostają per rola** — ECHO właściciela z tego samego dnia, świadomie przyjęty koszt.
Zmierzone przy trzech falach naraz: pięć bramek referencyjnych **84 s**, `tsc --noEmit`
**65 s**, load average **23 na 4 rdzeniach**. Każda rola uruchamia komplet, bo niezależna
weryfikacja Evaluatora i Final Control jest warta tego procesora. Nie „optymalizuj" tego
bez ECHO.

## 3. Szkielet skryptu — PRZYBLIŻONY, wymaga potwierdzenia w realnym środowisku

**Zastrzeżenie:** dokładna składnia narzędzia Workflow (nazwa modułu do importu,
kształt `agent()`/`pipeline()`/`phase()`, nazwy pól w `opts`, dokładny identyfikator
modelu Sonnet 5 akceptowany przez `effort`) **nie została dziś zweryfikowana wprost**
względem aktualnej wersji narzędzia dostępnego w tej sesji. Fragmenty oznaczone
`// POTWIERDŹ:` są zamierzenie przybliżone — sprawdź je w realnym środowisku (pomoc
narzędzia, przykład z dokumentacji Workflow) PRZED pierwszym prawdziwym użyciem tego
skryptu. Nie traktuj ich jako pewnik i nie kopiuj bez weryfikacji do produkcyjnego
dispatchu.

```js
// POTWIERDŹ: dokładny import/nazwa modułu Workflow w wersji dostępnej w tej sesji.
import { phase, agent } from "workflow"; // POTWIERDŹ

export const meta = {
  id: "civ-autobot-operator-evaluator",
  description:
    "Operator -> Evaluator dla jednego pełnego ID AutoBot (Civ), effort per rola, Ścieżka A (playbook C-061).",
};

// Wywoływane per temat. Pełne ID/GOAL/allowlista/izolacja/plan testów są już
// ustalone przez orkiestratora w `00-dispatch.md` PRZED wywołaniem tego skryptu
// (kanon C-044, C-051) — ten skrypt ich nie wymyśla, tylko wykonuje dispatch.
export default async function autobotOperatorEvaluator(input) {
  const { fullId, goal, allowlist, testPlan, worktreeBase, round } = input;

  // Guard rundy (C-050): licznik rośnie PRZED dispatchem Operatora i jest
  // prowadzony przez orkiestratora, nie przez ten skrypt — tu tylko sprawdzamy,
  // że w ogóle wolno dispatchować.
  if (round > 5) {
    throw new Error(
      "LIMIT-5-EXCEEDED — nie dispatchuj przez Workflow; wymagana jawna decyzja właściciela/orkiestratora (playbook C-050, C-053)."
    );
  }

  const operatorReport = await phase("Operator", async () => {
    return agent({
      role: "operator",
      model: "sonnet-5", // POTWIERDŹ: dokładny identyfikator modelu wymagany przez Workflow
      effort: "medium", // Sonnet 5, effort Medium — kanon R-PROC-AUTOBOT.md §5a
      isolation: "worktree", // wymaga weryfikacji bazy PRZED pracą (playbook C-035, C-042)
      prompt: buildOperatorPrompt({ fullId, goal, allowlist, testPlan, worktreeBase }),
      // Operator NIE ocenia własnej pracy, NIE integruje, NIE deployuje, NIE pushuje (C-044).
    });
  });

  // Evaluator startuje automatycznie po raporcie Operatora, bez czekania na
  // dodatkowy sygnał właściciela (C-044) — ALE Operator i Evaluator są dwiema
  // sekwencyjnymi fazami W JEDNYM skrypcie, nigdy dwoma osobnymi, niezależnymi
  // dispatchami — to strukturalne zabezpieczenie przed powtórką incydentu
  // "zmiany scalone bez Evaluatora" (naruszenie C-017), patrz playbook.md sekcja
  // "Integracja z Ultracode/Workflow".
  const evaluatorReport = await phase("Evaluator", async () => {
    return agent({
      role: "evaluator",
      model: "sonnet-5", // POTWIERDŹ
      effort: "high", // Sonnet 5, effort High — adwersaryjne rozumowanie, R-PROC-AUTOBOT.md §5a
      isolation: "worktree",
      prompt: buildEvaluatorPrompt({ fullId, goal, operatorReport }),
      // Evaluator NIE zastępuje Operatora, NIE integruje, NIE publikuje (C-044).
    });
  });

  // FAIL / techniczny BLOCK / TIMEOUT / INFRA / ZWIS: guard rundy (C-050, C-051)
  // działa POZA tym skryptem — orkiestrator decyduje o kolejnym dispatchu (runda
  // N+1, max 5) po odebraniu wyniku, ten skrypt się NIE re-dispatchuje sam w pętli.
  if (isNegativeVerdict(evaluatorReport.status)) {
    return {
      status: evaluatorReport.status, // FAIL | BLOCK | TIMEOUT | INFRA
      domain: evaluatorReport.domain, // GAME | PROCESS | INFRA | INFORMATIONAL (C-055)
      round,
      operatorReport,
      evaluatorReport,
      nextStep:
        "Orkiestrator decyduje o kolejnej rundzie poza tym skryptem (guard C-050, max 5 rund).",
    };
  }

  // PASS / PASS-WITH-NOTES: skrypt Workflow KOŃCZY SIĘ TUTAJ.
  // Integracja, READY_FOR_DEPLOY i deploy/push są POZA tym skryptem (Final Control JEST w nim)
  // (C-042, C-044) — Workflow ich nie wystawia i nie wykonuje.
  return {
    status: "PASS_TO_FINAL_CONTROL",
    domain: evaluatorReport.domain,
    round,
    operatorReport,
    evaluatorReport,
    nextStep:
      "Orkiestrator dispatchuje Final Control osobno (poza tym skryptem Workflow) i dopiero po pozytywnym wyniku integruje (allowlist-only, C-059).",
  };
}

// POTWIERDŹ: czy Workflow w tej sesji faktycznie eksponuje phase()/agent() z tym
// kształtem argumentów, czy inny (np. parallel(), task(), inne nazwy pól opts,
// inny sposób przekazania modelu/effortu). Sprawdzić w dokumentacji/pomocy
// narzędzia PRZED pierwszym realnym użyciem — nie zakładać z tego szkieletu.
```

## 4. Checklist przed użyciem

- [ ] Workflow dostępny w tej konkretnej sesji (zweryfikowane, nie zgadywane).
- [ ] Właściciel dał jawną, opt-in zgodę na multi-agent orchestration w TEJ sesji.
- [ ] `00-dispatch.md` zapisany przed wywołaniem: pełne ID, GOAL, allowlista, izolacja,
      plan testów (C-044, C-051), plus trzy składniki pętli — **wyzwalacz**, zadanie,
      binarne kryterium (`R-PROC-AUTOBOT.md` §2a). „Bo była kolej" nie jest wyzwalaczem.
- [ ] Szerokość fali policzona komendą `nproc`, nie z pamięci (§5) — nadmiar zadań
      połączony w grubsze paczki, nie rozbity na cienkich agentów.
- [ ] Prompt każdego wywołania ma komplet czterech pól, w tym **regułę przeciw
      samooszukiwaniu** dobraną z tabeli obserwowanych trybów (§6, §6a).
- [ ] Temat dotykający tych samych plików co inny aktywny temat — dispatchowany
      **sekwencyjnie**, nie w tej samej fali (`R-PROC-AUTOBOT.md` §2b).
- [ ] Licznik rund (C-050) i ledger (C-051) prowadzone przez orkiestratora — nie
      polegaj na tym, że skrypt Workflow sam je aktualizuje.
- [ ] **Poprzedni skrypt tego samego tematu ZWRÓCIŁ wynik.** Skrypt ma TRZY fazy, nie dwie
      — Obrona pracuje w tym samym worktree co Operator. Runda N nie jest zamknięta po
      Evaluatorze, tylko gdy skrypt zwróci. Dispatch rundy N+1 wcześniej sadza dwa procesy
      w jednym drzewie i na jednej gałęzi (`R-PROC-AUTOBOT.md` §2b, incydent 2026-09-05:
      trzy wystąpienia w jednym temacie, praca ocalała tylko dzięki ostrożności agentów).
- [ ] Prompt KAŻDEJ roli niesie guard wstępny `git -C <wt> log -1 --oneline` +
      `git -C <wt> status --short`, z jawną instrukcją `BLOCK` przy rozbieżności — oraz
      zakaz cofania mutacji przez `git checkout` (tylko przez kopię pliku).
- [ ] Model i effort per rola zapisane w raporcie etapu, jak przy dispatchu ręcznym
      (analogicznie do C-052 dla Codex `multi_agent_v1`).
- [ ] Skrypt zawiera CZTERY fazy: Operator → Evaluator → (Obrona) → **Final Control** (§2a).
- [ ] Po zakończeniu skryptu: integracja allowlist-only (C-059),
      `READY_FOR_DEPLOY` i deploy/push wykonuje orkiestrator, nie ten skrypt.
- [ ] Raport końcowy jawnie stwierdza, że dispatch przebiegł Ścieżką A (Workflow),
      nie Ścieżką B (prompt) — patrz playbook C-061.

## 5. Szerokość fan-outu — policz limit, zanim zaplanujesz falę

Workflow uruchamia równolegle **najwyżej `min(16, liczba_CPU − 2)`** agentów.
Nadmiar czeka w kolejce. **Sprawdź limit komendą, nie z pamięci ani z tego
dokumentu** — jest własnością maszyny, na której akurat działa orkiestrator,
i zmienia się między kontenerami:

```bash
nproc        # limit = min(16, nproc - 2)
```

| Rdzenie | Rdzenie − 2 | Sufit | **Limit** |
|---|---|---|---|
| 4 | 2 | 16 | **2** |
| 8 | 6 | 16 | **6** |
| 16 | 14 | 16 | **14** |
| 18 i więcej | ≥16 | 16 | **16** |

Wzór czyta się jako „mniejsza z dwóch liczb": sufit 16 oraz rdzenie minus 2
rezerwy dla orkiestratora i systemu. Sufit zaczyna cokolwiek znaczyć **dopiero
od 18 rdzeni** — poniżej wiąże człon z procesorów. Przeskok z 4 na 8 rdzeni
**potraja** liczbę równoległych agentów.

**Limit nie zależy od obciążenia maszyny.** Rezerwa dwóch rdzeni jest odejmowana
z góry, niezależnie od tego, czy cokolwiek je zajmuje. Czekanie na „spokojniejszą
porę" niczego nie zmieni — zmienia to wyłącznie większy kontener.

**Reguła planowania:** liczba równoległych wywołań w jednej fali ma odpowiadać
limitowi. Gdy zadań jest więcej niż miejsc, **łącz je w grubsze paczki** zamiast
mnożyć cienkich agentów. Cztery paczki przy limicie dwóch kończą się szybciej niż
siedem drobnych — każdy agent powtarza wstęp/kontekst promptu, a ten narzut się
sumuje (patrz `civ-autobot/SKILL.md` §Koszt).

**To nie jest ta sama liczba co pula tematów.** Limit fan-outu wynika z mocy
maszyny; pula 6 subagentów (efektywnie 5 tematów, **jeśli** watchdog dzieli z nią
limit wątków — C-060) wynika z pojemności
przeglądu właściciela. Przy zmianie którejkolwiek sprawdź, czy druga nadal ma
sens — zbieżność obu liczb bywa przypadkowa.

### 5a. `ZWIS`, `TIMEOUT` i `INFRA` przy dispatchu przez Workflow

Skrypt Workflow **nie prowadzi watchdogu** — robi to orkiestrator poza skryptem,
dokładnie jak przy dispatchu ręcznym (C-051). Progi i klasyfikacja są te same:
brak ruchu ok. 7 minut = `ZWIS`, brak artefaktu przy `not_found` = `BLOCK`,
przekroczony czas = `TIMEOUT`. Przy `ZWIS` sprawdź przebieg, worktree i artefakty
**zamiast anulować w ciemno**.

**`INFRA` jest osobną kategorią od `FAIL`** i wymaga innej reakcji: nie poprawia
się jej ponownym dispatchem tego samego zlecenia. Typowe przyczyny w tym
projekcie: brak miejsca na dysku po nagromadzeniu worktree oraz `WorktreeIsolationError`
przy zakładaniu izolacji. Procedura sprzątania — **kolejność jest obowiązkowa**:

```bash
df -h /                                              # 1. zmierz stan, nie zgaduj
git worktree list                                    # 2. wypisz istniejące
git merge-base --is-ancestor <commit> origin/main    # 3. PRZED usunięciem każdego
```

Usuwaj wyłącznie worktree, którego praca jest już przodkiem `origin/main` albo
został jawnie odrzucony po `FAIL`. **Nigdy nie usuwaj worktree używanego przez
wciąż działający wątek** — także wtedy, gdy dysk jest pełny i wygląda to na
najszybsze rozwiązanie (C-014, C-032, C-033; `R-PROC-AUTOBOT.md` §2b).

Zakładaj worktree przez sparse-checkout, bez `gra-robocza/`, `gra-kanon/` i
katalogów `dist/` — ~370 MB zamiast ~810 MB na worktree (C-015). To jest
najtańsza profilaktyka przeciw całej tej klasie `INFRA`.

## 6. Wzorzec promptu dla wywołania `agent()`

Cztery pola obowiązkowe (`R-PROC-AUTOBOT.md` §15) plus wiązania techniczne tej
ścieżki. Kopiuj i wypełnij — pola oznaczone `<…>` uzupełnia orkiestrator
z `00-dispatch.md`, nigdy sam agent.

```text
KONTEKST PROJEKTU
Przeczytaj obowiązkowo, w tej kolejności: README.md, docs/procesy/INDEX-PROCESU.md,
docs/decyzje/R-PROC-AUTOBOT.md, playbook.md,
dyspozycje/_handoff/HANDOFF-AKTUALNY.md, dyspozycje/autobot/runs/<ID>/00-dispatch.md
Civ „The Game" to gra 4X. Ten temat dotyczy <GAME | PROCESS | INFRA | INFORMATIONAL>.

TWOJA ROLA: Operator | Evaluator | Operator (obrona) | Final Control
TEMAT:      <PEŁNE ID>[-<litera węzła>]
RUNDA:      <n>/5
MODEL+EFFORT: <model>, effort <medium|high>   ← zapisz też w raporcie (C-052)

ZADANIE
<wąski zakres, jedno zdanie — co ma być prawdą po zakończeniu>

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
<konkretny tryb z tabeli „Nasze tryby samooszukiwania" w civ-autobot/SKILL.md —
 np. „zakaz uznania tematu wizualnego za zamknięty bez zrzutu z żywego Chromium
 i bez pokazania, że test czerwienieje po mutacji źródła">

BINARNE KRYTERIUM SUKCESU
<sprawdzalne PRAWDA/FAŁSZ>
Dodatkowo zielone: tsc --noEmit, <testy tematu>, 5 bramek referencyjnych
(logic-test, tech-tree-test, research-test, unit-replace-test, combat-test).

ALLOWLISTA
<pozycje, per plik/katalog>
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json.

IZOLACJA
worktree <ścieżka>, gałąź autobot/<ID>, baza <jawnie: origin/main albo inna>.
C-001 (bariera CHRONIONA), brzmienie dosłowne z playbook.md: „Zakaz npm run
build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir".
Zakaz dotyczy rodziny komend build/compile, nie wszystkich komend w gra/:
jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit;
bramki referencyjne node tools/*-test.cjs nie są nim objęte (R-PROC-AUTOBOT.md
§6, §9 poz. 1).
WIĄŻĄCY jest zakaz npm run build / npm run dev — to jest istota tej bariery.
Wartość --outDir jest PARAMETREM katalogu docelowego, nie treścią zakazu: w tym
repo musi wskazywać katalog POZA drzewem repo (scratch/tmp, np.
--outDir /tmp/civ-dist --emptyOutDir), bo „OneDrive blokuje unlink w gra/dist/
(EPERM), więc vite nie może wyczyścić katalogu wyjściowego"
(SILNIK/SILNIK-ARCHITEKTURA-DEWELOPER.md:265) — dosłowne --outDir dist
fizycznie nie działa na maszynie właściciela; tak samo buduje istniejąca bramka
gra/tools/sidepanel-event-header-wydarzenie-real-render-test.cjs (os.tmpdir(),
komentarz „kanon C-001 buduje dokładnie tak"). Podanie innego katalogu w
--outDir NIE jest zmianą bariery i nie wymaga ECHO; ECHO wymaga dopiero
dopuszczenie npm run build / npm run dev (R-PROC-AUTOBOT.md §9 poz. 1).

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM
ID i TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
- maksymalnie ok. 400 słów w raporcie (R-PROC-AUTOBOT.md §11)
- destylat, nie surowe dane: ścieżki + SHA zamiast diffu, wynik bramki zamiast logu
- nie edytujesz plików spoza allowlisty; zakaz `git add -A` / `git add .`
- przy decyzji produktowej zatrzymujesz się ze statusem DECISION_REQUIRED
- nie integrujesz, nie deployujesz, nie pushujesz

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO

<gdy ROLA = Evaluator — dopisz PRZED „FORMAT ODPOWIEDZI" powyżej>
Nie wydajesz jednego werdyktu PASS/FAIL. Wypisz KAŻDE niespełnienie punktu z
checklisty (R-PROC-AUTOBOT.md §16a) jako osobny, PONUMEROWANY zarzut: numer,
dokładne miejsce (plik+linia/funkcja/pozycja allowlisty), co narusza i dlaczego
ma znaczenie dla GOAL albo granic §9. Lista może być PUSTA (po realnym
sprawdzeniu wszystkich 10 punktów — nie zadeklarowaniu braku zastrzeżeń).
Nie wydajesz werdyktu — to robi Final Control, po obronie (§3c).
Pole FORMAT ODPOWIEDZI dostaje dodatkowo: ZARZUTY: <lista ponumerowana albo „brak">

<gdy ROLA = Operator (obrona) — druga runda tego samego Operatora, NIE nowa
kalibracja modelu/effort>
Dostajesz pełną listę zarzutów Evaluatora. Odpowiedz na KAŻDY z osobna:
PRZYJMUJĘ (trafny, poprawiam w tej samej rundzie) albo ODRZUCAM (nietrafny) —
zawsze z DOWODEM z wytworu (cytat, linia, wynik bramki/testu). Zapewnienie
„to działa poprawnie"/„to było zamierzone" bez dowodu NIE jest obroną — Final
Control potraktuje to jak brak odpowiedzi. Brak odpowiedzi na zarzut liczy się
jak PRZYJMUJĘ. Gdy zarzut zależy wyłącznie od intencji, której wytwór sam nie
rozstrzyga — wskaż to wprost jako kandydata do DO DECYZJI CZŁOWIEKA, zamiast
na siłę dowodzić z materiału, którego tam nie ma.
Pole FORMAT ODPOWIEDZI dostaje dodatkowo: OBRONA: <numer zarzutu> →
PRZYJMUJĘ/ODRZUCAM + dowód, dla każdej pozycji z listy Evaluatora.

<gdy ROLA = Final Control>
Dostajesz zarzuty i odpowiedzi obrony PONUMEROWANE i BEZ ETYKIET wskazujących
która rola co napisała (orkiestrator ma obowiązek usunąć nagłówki
„wg Evaluatora"/„wg Operatora" przy składaniu tego promptu — zostaw samą
numerację). Orzekaj na podstawie treści i dowodu z wytworu w worktree, nie
autorytetu strony. Dla KAŻDEGO zarzutu jeden werdykt: NAPRAW (trafny, obrona
nie obaliła dowodem — wskaż co i gdzie poprawić) / ODDAL (obrona obaliła
dowodem) / DO DECYZJI CZŁOWIEKA (zależy od intencji, której wytwór sam nie
rozstrzyga — brak dowodu w którąkolwiek stronę = domyślnie ten werdykt).
Agregat: choć jeden NAPRAW → FAIL; brak NAPRAW, choć jeden DO DECYZJI
CZŁOWIEKA → DECISION_REQUIRED; same ODDAL → PASS.
Pole FORMAT ODPOWIEDZI dostaje dodatkowo: WERDYKTY: <numer zarzutu> →
NAPRAW/ODDAL/DO DECYZJI CZŁOWIEKA, dla każdej pozycji.
```

Pełny opis mechanizmu (kiedy runda Obrony w ogóle się uruchamia, jak liczy się
do limitu 5 rund, format tabeli śladu dla właściciela): `R-PROC-AUTOBOT.md` §3c.

### 6a. Czego w prompcie nie może zabraknąć

| Pole | Co się dzieje przy braku |
|---|---|
| Reguła przeciw samooszukiwaniu | agent wypełni lukę domysłem i nie zauważy, że zgaduje — to jest pole pomijane najczęściej |
| Binarne kryterium | Evaluator nie ma wobec czego orzekać, ocena robi się uznaniowa |
| Limit objętości | do syntezy trafiają surowe logi i zatruwają kontekst orkiestratora |
| Allowlista | zmiana wychodzi poza zakres tematu, integracja staje się ryzykowna |
| Kolejność czytania | agent zaczyna od przypadkowego pliku i buduje na nieaktualnym stanie |
| Izolacja z jawną bazą | agent pracuje na gałęzi o kilka fal wstecz i „gubi" cudzą pracę (C-035) |
| Jawny `model` + `effort` | przydział z `R-PROC-AUTOBOT.md` §5a nie został zastosowany — to jest właśnie powód istnienia tej ścieżki (C-052, C-061) |

## 7. Powiązane

- `docs/decyzje/R-PROC-AUTOBOT.md` §5a (uzasadnienie effort per rola), §1a (jawny model Codex),
  §9 (granice nienaruszalne), §11 (zasada czystości raportu), §12 (podział na węzły),
  §15 (cztery pola promptu), §16 (checklisty Evaluatora i Final Control)
- `playbook.md` C-042 (Workflow nie zastępuje AutoBota), C-044 (kanon routingu), C-050
  (limit 5 rund), C-051 (ledger+watchdog), C-054 (`DECISION_REQUIRED`), C-059
  (integracja allowlist-only), C-061 (dwie ścieżki dispatchu, incydent źródłowy)
- `.claude/skills/civ-autobot/SKILL.md` i `.claude/skills/autobots/SKILL.md` — Ścieżka B
  (różnicowanie wyłącznie przez prompt), używana też przez narzędzia bez koncepcji
  Workflow (Cursor, GPT i inne)
