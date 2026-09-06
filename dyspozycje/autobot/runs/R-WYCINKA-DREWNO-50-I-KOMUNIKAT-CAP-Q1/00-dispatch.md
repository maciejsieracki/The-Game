# R-WYCINKA-DREWNO-50-I-KOMUNIKAT-CAP-Q1

STATUS: DYSPOZYCJA
DOMAIN: GAME
TEMAT: R-WYCINKA-DREWNO-50-I-KOMUNIKAT-CAP-Q1
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a, temat balansowy, nie wizualny).

## GENEZA (zgłoszenie właściciela + ECHO)

Zgłoszenie: „wycięcie lasu powinno dawać plus 50 drewna, a nie pięć, jak teraz."

**ECHO właściciela (AskUserQuestion):**
1. „50 łącznie, jednorazowo (1 tura)" — prosta podmiana wartości, bez rozkładania w czasie.
2. „Tak, w tym samym temacie" — naprawić przy okazji ciche przycięcie limitem magazynu
   (patrz PROBLEM 2 niżej).

**Rozbieżność do wyjaśnienia przez Operatora, nie do zgadywania:** dzisiejsza wartość w danych
to **25**, nie 5, jak pamiętał właściciel (`gra/data/terrain-improvements.json:185-187`,
klucz `wycinka.praca_per_tura`). Podejrzenie: gracz widział niższą liczbę PRZEZ WZGLĄD na
PROBLEM 2 (komunikat pokazuje surową wartość przed przycięciem magazynu, więc jeśli magazyn
był bliski capu, gracz mógł widzieć occasionally mniej niż 25 — ale to nie tłumaczy „5" wprost).
Operator ma to zbadać (grep historii/innych miejsc z „5" per wycinka) i skomentować w raporcie,
NIE zgadywać ani nie zmieniać ECHO — cel liczbowy jest jednoznaczny: **`praca_per_tura` = 50**.

## GOAL

1. `gra/data/terrain-improvements.json` → `wycinka.praca_per_tura`: **25 → 50**. Jedna liczba,
   bez zmiany `tury` (zostaje 1 — jednorazowo, zgodnie z ECHO 1).
2. **PROBLEM 2 — komunikat gracza liczy PRZED przycięciem magazynu, nie PO:**
   `gra/src/main.ts` (ścieżka gracza, ok. linii 28942-28962 — **numery linii zweryfikowane
   PO integracji `R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1` i rebase tego worktree na `origin/main`,
   Operator MUSI zweryfikować je ponownie grepem przed edycją, nie ufać ślepo tym liczbom**):
   `drewnoCredit` (wartość surowa, przed capem) jest używana WPROST w
   `showHintMessage('Wycinka: +' + drewnoCredit + ...)`, podczas gdy realny, zapisany do
   magazynu kredyt to zwrócona wartość `creditOwnerResourceStock(...)` (przycięta do
   `drewnoCap`). Ścieżka AI (ok. linii 32374-32388) robi to POPRAWNIE — używa zwróconej
   wartości `drewnoCredited`, nie surowej `drewnoCredit`. Napraw ścieżkę gracza analogicznie
   do AI: komunikat ma pokazywać FAKTYCZNIE zapisaną ilość, nie zamierzoną. Precedens tej
   klasy błędu w komentarzu kodu: `P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO`.
3. Przy okazji (tylko jeśli tanio, nie rozszerzaj zakresu): fallbacki `?? 20`/`?? 3` w
   `gra/src/game/improvement-tech.ts` (`readMeta`, pola `pracaPerTura`/`tury`) są martwe,
   bo `terrain-improvements.json` zawsze ma `wycinka.praca_per_tura` — zostaw jak jest, chyba
   że naprawa #2 wymusza dotknięcie tego pliku.
4. Zweryfikuj CivPedię/opis wyrębu w UI (jeśli gdziekolwiek pokazuje liczbę „25" na sztywno) —
   grep, nie zgadywanie.

## BINARNE KRYTERIUM SUKCESU

- `terrain-improvements.json`: `wycinka.praca_per_tura === 50`.
- Realny test (nie tylko odczyt configu): symulacja tury wyrębu z magazynem BLISKO capu
  (np. cap - 10) potwierdza, że komunikat gracza pokazuje DOKŁADNIE tyle, ile faktycznie
  trafiło do magazynu (przycięta wartość), zgodnie z tym co dziś robi ścieżka AI.
  Kontrola mutacyjna: cofnij naprawę #2 (podmień z powrotem na `drewnoCredit` surowe),
  pokaż że nowa asercja czerwienieje przy magazynie bliskim capu, cofnij.
- Dodatkowo zielone: `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test,
  research-test, unit-replace-test, combat-test), istniejące bramki wyrębu/ulepszeń
  (grep `tools/*wyrab*`, `tools/*clearing*`, `tools/*wycink*` — znajdź i uruchom wszystkie).

## ALLOWLISTA

- `gra/data/terrain-improvements.json`
- `gra/src/main.ts` (**wyłącznie** okolice wywołania `creditOwnerResourceStock`/
  `showHintMessage('Wycinka: ...')` ok. linii 28942-28962 — analogiczna naprawa do wzorca AI
  w tym samym pliku ok. linii 32374-32388; zakaz zmian gdziekolwiek indziej w main.ts)
- `gra/src/game/improvement-tech.ts` (tylko jeśli naprawa #2 tego wymaga)
- `gra/tools/*wyrab*.cjs`, `gra/tools/*clearing*.cjs`, `gra/tools/*wycink*.cjs` (istniejące,
  do zaktualizowania) lub nowa bramka `gra/tools/wycinka-drewno-cap-test.cjs`
- `dyspozycje/autobot/runs/R-WYCINKA-DREWNO-50-I-KOMUNIKAT-CAP-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`,
`gra/src/game/society-breakdown.ts`, `gra/src/game/order.ts` (poza zakresem tego tematu),
jakiekolwiek zmiany w `gra/src/main.ts` poza jednym wskazanym miejscem.
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-wycinka`, gałąź `autobot/R-WYCINKA-DREWNO-50-I-KOMUNIKAT-CAP-Q1`,
baza jawnie `origin/main` (po rebase: `60f35d2c`, PO integracji Prawa/Garnizon/AI-produkcja
ORAZ `R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1`) — potwierdź `git log -1` PRZED pracą (SS2b: jeden
pisarz na worktree, cała runda kończy się dopiero gdy skrypt Workflow zwróci wynik).

C-001, brzmienie dosłowne: „Zakaz `npm run build`/`dev` w `gra/` (export-data nadpisuje JSON)
— dozwolona komenda: `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir`.
Jedyna dozwolona kompilacja: `node ./node_modules/typescript/bin/tsc --noEmit`; bramki
`node tools/*-test.cjs` nie są objęte zakazem. `--outDir` MUSI wskazywać katalog poza drzewem
repo.

**Kolejka `main.ts` (§2b — jeden temat dotykający main.ts naraz):** `R-HANDEL-DOCHOD-PRZEZ-PODZIAL-MIASTA-Q1`
(`e9606371`) i `R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1` (`6d082b9a`) już zintegrowane do `main` —
ten temat jest teraz PIERWSZY w kolejce, dispatch może ruszyć od razu. Po tym temacie w
kolejce: `R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1`, `R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1`,
`P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1`.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje JEDEN konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ
gałęzi. Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian mechaniki poza dwoma punktami GOAL (wartość + komunikat). Nie dodawaj rozkładania
  w czasie, nie zmieniaj kosztu Pracy wyrębu, nie zmieniaj który budynek/technologia odblokowuje
  wyręb.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Rozbieżność „5 vs 25" w zgłoszeniu właściciela: skomentuj w raporcie, nie traktuj jako
  DECISION_REQUIRED — cel liczbowy (50) jest jednoznaczny niezależnie od punktu startowego.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
