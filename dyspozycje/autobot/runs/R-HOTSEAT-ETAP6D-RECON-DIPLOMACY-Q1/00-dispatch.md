STATUS: DISPATCH
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6D-RECON-DIPLOMACY-Q1
GOAL: Recon-only (ZERO zmian kodu) dla czwartego pod-etapu Etapu 6 planu hot-seat
(`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §C, wiersz "6": "(d) dyplomacja ~55"). Kategoria
z §A6 ("Dyplomacja — ~55 miejsc, rdzeń JUŻ symetryczny"): `getDiploRelation(a, b)` używa
klucza `a < b ? a_b : b_a` — para `0_1` jest legalna już dziś (rdzeń przechowywania
relacji jest per-para-ownerów, nie hardkodowany na `0`), ale **49 wywołań hardkoduje `0`
jako "stronę człowieka"** przy CZYTANIU/WYŚWIETLANIU relacji. Kryterium gotowości §C:
"po każdym podetapie: typecheck + bramki + 20 tur" (behawioralny no-op przy
`humanOwnerIds=[0]`).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED DISPATCHEM RUND KOLEJNYCH:
- `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §A6 (lista przybliżonych starych numerów linii
  — WSZYSTKIE do zweryfikowania świeżym grepem) i §B2 (tabela decyzyjna, wiersz
  dyplomacja).
- **KLUCZOWE, INNE NIŻ (a)/(b)/(c): ta kategoria NIE MA jednego jednoznacznego aliasu
  docelowego.** Trzy poprzednie recon (6a/6b/6c) ustaliły: (a) input→`isMe(id)` (tylko
  aktywny wydaje rozkazy), (b) UI→`isMe(id)`/`ME()` (co widzi aktywny), (c) ekonomia→
  `isHuman(id)` (liczy WSZYSTKICH ludzi jednocześnie). Dyplomacja może wymagać OBU wzorców
  jednocześnie w różnych miejscach tego samego klastra: **przechowywanie/liczenie relacji
  między parą ownerów** (np. stan wojny, sojusz, kara graniczna — wpływa na OBU ludzi
  niezależnie od aktywnego fotela) → prawdopodobnie `isHuman(id)`; **wyświetlanie
  komunikatu/HUD "Twoja relacja z X"** (perspektywa AKTYWNEGO fotela) → prawdopodobnie
  `isMe(id)`/`ME()`. Rozstrzygnij per klaster, z uzasadnieniem — nie zakładaj jednego
  wzorca dla całej kategorii.
- **Znana, jawna zależność z recon Etapu 6a** (zintegrowany,
  `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6A-RECON-INPUT-Q1/01-operator-runda1-analiza.md`
  §1 Klaster E): `playerIsAtWarWith` (`main.ts` ok. 9825, dwa hardkodowane `0`) jest
  wołane WEWNĄTRZ input-handlera inicjacji ataku (Etap 6a świadomie jej NIE migrował,
  zaflagował jako należącą do tej kategorii). Zweryfikuj świeżym grepem czy nadal tam jest
  pod tym numerem, potwierdź że wchodzi w zakres tego recon, i sprawdź czy Etap 6a
  (dziś w RÓWNOLEGŁYM dispatchu implementacji — sprawdź `git log`/rejestr czy już
  zintegrowany) faktycznie jej nie tknął.
- **Ta sama uwaga co przy KAŻDYM poprzednim etapie: main.ts (i pliki game/*) zmieniają się
  codziennie, numery linii z planu z dużym prawdopodobieństwem martwe.** main.ts przeszedł
  przez integrację Etapów 6a/6b/6c (docs-only, więc SAM main.ts nie zmienił się od nich),
  ale Etap 6a IMPLEMENTACJA (kod, nie recon) może być w toku lub już zintegrowana —
  sprawdź `git log --oneline origin/main` i rejestr na start.
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1/01-operator-runda1-analiza.md`
  — najświeższy wzorzec formatu i najważniejsza przestroga: jego Evaluator dwukrotnie
  znalazł niekompletną inwentaryzację main.ts (pominięte funkcje ery/technologii) — przy
  dyplomacji, gdzie plan sam pisze "49 wywołań" bez pełnej listy (kończy się "…"), ryzyko
  niedoliczenia jest WYSOKIE — grepuj cały plik, nie tylko okolice numerów z planu.

ZADANIE TEJ RUNDY (WYŁĄCZNIE recon, zero kodu produkcyjnego):
1. **Zweryfikuj świeżym `Read`** `getDiploRelation(a, b)` (main.ts ok. 7696-7698) i
   potwierdź/obal twierdzenie planu że klucz `a < b ? a_b : b_a` już dziś poprawnie
   obsługuje parę `0_1` bez żadnej specjalnej logiki dla `0`.
2. **Zainwentaryzuj WSZYSTKIE miejsca w `main.ts` i 3 plikach `game/*.ts`**
   (`forced-war-bronze.ts`, `forced-war-stone.ts`, `diplomacy-border-march.ts`)
   hardkodujące `0` jako "stronę człowieka" w kontekście dyplomacji (relacje, wojna, pokój,
   sojusz, kara graniczna, kontakt pierwszy raz, prezenty/handel dyplomatyczny) — świeżym
   grepem `\bownerId\s*(===|!==)\s*0\b` ORAZ `getDiploRelation(0` / podobnymi wzorcami
   literału `0` jako argumentu funkcji dyplomacji, z dzisiejszymi numerami linii.
3. **Dla każdego miejsca rozstrzygnij i uzasadnij alias docelowy** (`isMe`/`ME()` vs
   `isHuman`) zgodnie z zasadą z kontekstu wyżej — pogrupuj w klastry.
4. **Potwierdź/skoryguj liczbę "~55"** — policz realnie (wzorem 42/78/32 z Etapów
   6a/6b/6c) — jeśli liczba się różni, wyjaśnij dlaczego.
5. **Sprawdź nakładanie z Etapami 1/4/6a** — Etap 1 już migrował 31 miejsc `ownerId>0`→
   `isAiOwner` (dotyczy WYKRYWANIA AI, blisko dyplomacji koncepcyjnie — sprawdź czy któreś
   z 31 miejsc jest fizycznie w tym samym klastrze co dyplomacja ludzka, czy to rozłączne
   zbiory); sprawdź `playerIsAtWarWith` (zależność z Etapu 6a, patrz kontekst wyżej).
6. **Zaproponuj plan dowodu no-op** — behawioralny no-op przy `humanOwnerIds=[0]`, z
   konkretną metodą (rozstrzygnij headless Node vs Chromium per klaster, wzorem recon 6c).

BINARNE KRYTERIUM SUKCESU TEJ RUNDY: potwierdzenie/obalenie twierdzenia o symetrii
`getDiploRelation`, kompletna świeżo zweryfikowana lista miejsc kategorii "dyplomacja" z
dzisiejszymi numerami linii i uzasadnionym aliasem per klaster (`isMe`/`ME()` albo
`isHuman`), jawne rozliczenie z liczbą "~55", jawne sprawdzenie nakładania z Etapami
1/4/6a (w tym `playerIsAtWarWith`), konkretny plan dowodu no-op.

ALLOWLISTA:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-RECON-DIPLOMACY-Q1/*` (WYŁĄCZNIE dokument
  recon — zero zmian w `gra/`)
Zakaz `git add -A`. Zakaz jakiegokolwiek kodu w `gra/src/**`/`gra/tools/**` w tej rundzie.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz przepisywania listy "49 wywołań, …" z planu bez
świeżej weryfikacji KAŻDEGO numeru i bez własnego pełnego grepa całego main.ts (plan sam
przyznaje niekompletność własną wielokropkiem "…"). Zakaz przypisania jednego aliasu
całej kategorii bez uzasadnienia per klaster — patrz ostrzeżenie w kontekście wyżej.

IZOLACJA: worktree `/home/user/wt-hotseat-etap6d-recon`, gałąź
`autobot/R-HOTSEAT-ETAP6D-RECON-DIPLOMACY-Q1`, baza `origin/main` @ `28a6bb47`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit` (nie powinno być nawet potrzebne — zero
zmian kodu).

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli Evaluator zwraca
NIEPUSTĄ listę zarzutów (niezależnie od etykiety STATUS w nagłówku) — zawsze wymagana
runda Obrony przed kolejnym Evaluatorem (R-PROC-AUTOBOT.md §3c) — nie pomijaj tego kroku.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty, ta sama runda) → kolejny
Evaluator jeśli była Obrona (Ścieżka A, Workflow). Final Control NIE dispatchowany
(dokument, nie kod). Po zamknięciu: dispatch `R-HOTSEAT-ETAP6D-DIPLOMACY-Q1` (implementacja)
jako osobny temat, gdy zwolni się lania.
DEPLOY/PUSH: NIE WYKONANO
