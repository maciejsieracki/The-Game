# P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1 — dispatch

TEMAT: `P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1`
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — **Opus 5**, effort high; Evaluator — **Opus 5**, effort high;
Final Control — Sonnet 5, effort high.

## WYZWALACZ (dosłownie, wiadomość właściciela, ze zrzutem mapy)

> „Problem przechodzenia i nieodkrywania lądu dalej istnieje i nie został rozwiązany.
> Czasem, kiedy jednostka bardzo szybko przejdzie, **zwłaszcza rzekami**, to nie zdąży
> system odnotować tego przejścia i odkryć terenu. Dopiero odkrywa się w tym miejscu,
> w którym pojawi się na końcu, a nie odkrywa nic po drodze."

## TO JEST CZWARTE ZGŁOSZENIE TEGO SAMEGO BŁĘDU

I to jest najważniejszy fakt tego dispatchu. Trzy poprzednie tematy naprawiły po
JEDNYM miejscu wywołania i **każdy z nich został ogłoszony jako ostatni**:

| Temat | Naprawione miejsce | Deklaracja |
|---|---|---|
| `P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1` | ruch natychmiastowy + koniec animacji | „naprawione" |
| (drugi w tej rodzinie) | koniec animacji marszu | „naprawione" |
| `P-MGLA-ODKRYCIE-TELEPORT-KONIEC-TURY-Q1` | koniec tury w trakcie animacji | **„TRZECIE i ostatnie miejsce wzorca"** |

Deklaracja „ostatnie miejsce" była **nieprawdziwa trzy razy z rzędu**. Dlatego ten
temat ma inny cel niż poprzednie: **nie znaleźć czwartego miejsca, tylko ustanowić
INWARIANT**, po którym czwartego miejsca nie da się dodać niezauważenie.

Metoda „szukaj kolejnego miejsca i załataj" jest w tym temacie **zabroniona jako
jedyne rozwiązanie**. Możesz jej użyć, żeby zdiagnozować objaw — ale zamknięcie
tematu wymaga strukturalnego zabezpieczenia.

## RECON (zweryfikowany odczytem kodu; POTWIERDŹ własnym odczytem)

**A. Dokładnie TRZY miejsca odkrywają wzdłuż ścieżki** — `grep -n
"computeVisibleAlongPath" gra/src/main.ts` daje 3 wywołania (plus import w l. 158):
- `main.ts:22514` — ruch natychmiastowy stosu (`result.movePath`);
- `main.ts:27689` — koniec tury podczas trwającej animacji (`anim.pathHexes`),
  naprawa `P-MGLA-ODKRYCIE-TELEPORT-KONIEC-TURY-Q1`, zintegrowana dziś (`cb067a17`);
- `main.ts:32435` — koniec animacji marszu (`pathHexes`).

`computeVisibleAlongPath` jest zdefiniowane w `gra/src/game/visibility.ts:105`
i **nie jest wołane nigdzie poza `main.ts`** (sprawdzone grepem po całym `gra/src`).

**B. Jedyny inny konsument `explored` przy ruchu to `refreshFog`** (`main.ts:9709-9715`),
który robi `addExplored(explored, currentVisible())` — czyli odkrywa **wyłącznie z
AKTUALNEJ pozycji jednostki**, bez ścieżki. **To jest dokładnie objaw opisany przez
właściciela**: „odkrywa się w tym miejscu, w którym pojawi się na końcu, a nie
odkrywa nic po drodze". Każda ścieżka przemieszczenia, która kończy się samym
`refreshFog()` bez towarzyszącego `computeVisibleAlongPath`, produkuje ten objaw.

**C. Hipoteza o rzekach — do potwierdzenia LUB obalenia, nie do przyjęcia na wiarę.**
Właściciel podkreśla „zwłaszcza rzekami". Ruch wzdłuż rzeki ma obniżony koszt, więc
w jednej turze powstaje ŚCIEŻKA DŁUŻSZA niż zwykle. To nie musi być osobny błąd
rzeczny — może być zwykłe uwidocznienie tego samego defektu (im dłuższa ścieżka, tym
więcej pominiętych heksów, tym bardziej widoczne). **Sprawdź jednak wprost, czy ruch
rzeczny nie ma własnej ścieżki kodu**, omijającej te trzy miejsca.

**D. „Nie zdąży system odnotować" — uwaga na fałszywy trop.** Gra jest turowa
i deterministyczna; nic tu nie zależy od wydajności procesora w sensie wyścigu.
Ale **animacja jest asynchroniczna**, a poprzedni temat udowodnił, że przerwanie
animacji (koniec tury) daje realny, zależny od czasu objaw. Szukaj innych przerwań
animacji: anulowanie ruchu, walka w trakcie marszu, wejście do miasta, zaokrętowanie,
podniesienie nagrody z wioski, zniszczenie obozu, **ruch wielotorowy/automatyczny
(goto przez wiele tur)**, przejęcie sterowania przez inną akcję gracza.

## GOAL

### GOAL 1 — inwentaryzacja WSZYSTKICH miejsc zmiany pozycji jednostki

Wypisz w raporcie **kompletną tabelę** każdego miejsca w `gra/src`, w którym pole
`q`/`r` jednostki jest przypisywane, wraz z odpowiedzią: czy to przemieszczenie może
przeskoczyć więcej niż jeden heks, i jeśli tak — czy odkrywa mgłę wzdłuż ścieżki.
Metoda ma być mechaniczna i powtarzalna (grep po `\.q\s*=` / `\.r\s*=` na jednostkach
plus ręczna klasyfikacja), a nie „przejrzałem i wygląda dobrze". Tabela jest
artefaktem tematu — trafia do raportu i do katalogu runu.

### GOAL 2 — naprawa znalezionych miejsc

Każde miejsce z tabeli, które może przeskoczyć więcej niż jeden heks bez odkrycia
ścieżki, dostaje odkrycie. **Preferowane rozwiązanie: jeden wspólny helper**
(np. `revealAlongPathForStack(stack, pathHexes)`), wołany ze wszystkich miejsc,
zamiast czwartej kopii tych samych trzech linii. Jeśli uznasz, że wspólny helper
jest niemożliwy — uzasadnij to w raporcie konkretnie, nie ogólnikiem.

### GOAL 3 — INWARIANT, czyli sedno tematu

Zabezpieczenie strukturalne, po którym **dodanie czwartego miejsca bez odkrycia
ścieżki jest wykrywalne automatycznie**, a nie dopiero przez właściciela w grze.
Wybierz JEDNO i uzasadnij wybór (to jest decyzja inżynierska, nie dowolność):

- **(a) Bramka statyczna** — test skanujący `main.ts` po miejscach przypisania
  pozycji jednostki i wymagający, żeby każde było albo na jawnej, uzasadnionej
  whiteliście (ruch o jeden heks), albo w promieniu N linii od wywołania odkrycia
  ścieżki. Wzorzec whitelisty z uzasadnieniem per wpis: `wyrab-wycinka-nazwa-live-test.cjs`
  blok [11] (`DOZWOLONE_WYRAB_SRC`), zintegrowany dziś.
- **(b) Bramka behawioralna** — test symulujący ruch wielohesowy przez WSZYSTKIE
  ścieżki przemieszczenia (instant, animowany, przerwany końcem tury, automatyczny,
  rzeczny) i sprawdzający, że każdy heks pośredni trafił do `explored`.
- **(c) Inwariant runtime** — asercja deweloperska wykrywająca przeskok pozycji
  o więcej niż 1 heks bez wcześniejszego odkrycia ścieżki.

**(b) jest preferowane, jeśli wykonalne** — łapie defekt niezależnie od tego, jak
kod zostanie w przyszłości przepisany. (a) jest kruche wobec refaktoru, ale tanie.
Możesz połączyć (a)+(b).

### GOAL 4 — dowód na scenariuszu rzecznym

Jawny test odtwarzający scenariusz właściciela: jednostka z dużym budżetem ruchu
przechodzi **wzdłuż rzeki** przez kilka heksów w jednej turze; asercja sprawdza, że
KAŻDY heks pośredni (nie tylko początek i koniec) jest w `explored`. Jeśli GOAL 1
wykaże, że ruch rzeczny nie ma osobnej ścieżki — test i tak zostaje, jako regresja
na dokładnie ten zgłoszony przypadek.

## KRYTERIA KOŃCA (binarne)

- [ ] `node ./node_modules/typescript/bin/tsc --noEmit` — zielone.
- [ ] Nowa bramka inwariantu (GOAL 3) — 100% pass.
- [ ] Test scenariusza rzecznego (GOAL 4) — 100% pass.
- [ ] `mgla-teleport-koniec-tury-test.cjs` (16/16) — bez regresu.
- [ ] Tabela GOAL 1 w raporcie, kompletna, z metodą wyszukiwania podaną wprost.
- [ ] Pięć bramek referencyjnych bez regresu: logic 213/213, tech-tree 19/19,
      research 33/33, unit-replace 13/13, combat 6/6.

## REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)

**Tryb pierwszy, potwierdzony TRZY RAZY w tej rodzinie tematów: ogłoszenie
„to było ostatnie miejsce" bez metody, która by to gwarantowała.** Zakaz użycia
w raporcie sformułowania „ostatnie miejsce", „wszystkie miejsca naprawione" lub
równoważnego, jeśli nie towarzyszy mu **mechaniczna, powtarzalna metoda
wyszukiwania**, którą ktoś inny może uruchomić i dostać ten sam wynik. Wypisz tę
komendę dosłownie w raporcie.

**Tryb drugi: naprawa objawu w miejscu, w którym się objawił, zamiast w miejscu,
w którym powstaje.** Jeśli znajdziesz czwarte miejsce i dodasz w nim czwartą kopię
tych samych trzech linii — temat NIE jest zamknięty, bo piąte miejsce powstanie tak
samo. GOAL 3 jest obowiązkowy, nie opcjonalny.

**Tryb trzeci: test tautologiczny.** Pokaż, że nowa bramka czerwienieje po mutacji
źródła — usuń odkrywanie ścieżki w JEDNYM z trzech istniejących miejsc
(`main.ts:22514`, `27689` lub `32435`), uruchom bramkę, wklej liczbę faili, przywróć.
Jeśli bramka NIE czerwienieje po usunięciu któregokolwiek z tych trzech — nie
pokrywa tego, co ma pokrywać.

**Tryb czwarty: przyjęcie hipotezy rzecznej na wiarę.** Właściciel napisał
„zwłaszcza rzekami". To jest obserwacja, nie diagnoza. Sprawdź wprost, czy ruch
rzeczny ma własną ścieżkę kodu, i **napisz w raporcie, czy hipoteza się potwierdziła
czy nie** — obie odpowiedzi są wartościowe, milczenie nie.

## ALLOWLISTA

- `gra/src/main.ts`
- `gra/src/game/visibility.ts`
- `gra/tools/mgla-teleport-koniec-tury-test.cjs`
- nowe bramki `gra/tools/*-test.cjs`
- `dyspozycje/autobot/runs/P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`.
**`gra/src/ui/entityCards/**` i `gra/src/ui/techDiscoveryNotice.ts`** — świadomie poza
allowlistą, równolegle biegnie `P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1`
(`R-PROC-AUTOBOT.md` §2b).
Zakaz `git add -A` i `git add .` — dodawaj pliki po nazwie.

## IZOLACJA

Worktree `/home/user/wt-mgla-sciezka-inwariant`, gałąź
`autobot/P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1`, baza jawnie `origin/main` —
potwierdź `git log -1` PRZED pracą.

C-001, brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje
JSON) — dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist
--emptyOutDir". Jedyna dozwolona kompilacja: `node ./node_modules/typescript/bin/tsc
--noEmit`; bramki `node tools/*-test.cjs` nie są zakazem objęte. `--outDir` poza
drzewem repo.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID
i TEJ SAMEJ gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Nie zmieniasz zasięgu wzroku jednostek ani reguł widoczności — to temat
  o ODKRYWANIU wzdłuż ścieżki, nie o balansie widoczności.
- Nie zmieniasz kosztów ruchu ani bonusu rzecznego.
- Nie usuwasz istniejących trzech wywołań odkrywania, chyba że zastępujesz je
  wspólnym helperem wołanym z tych samych miejsc (GOAL 2).
- Nie integrujesz, nie deployujesz, nie pushujesz.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec
skryptu. Final Control osobno, integracja allowlist-only ręką orkiestratora.
