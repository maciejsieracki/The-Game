STATUS: DISPATCH
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6B-RECON-UI-Q1
GOAL: Recon-only (ZERO zmian kodu) dla drugiego pod-etapu Etapu 6 planu hot-seat
(`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §C, wiersz "6": "(b) UI ~75" — NAJWIĘKSZA
kategoria wg planu, ale najmniej ryzykowna per-miejsce). Kategoria z §A3/§B2 (wiersz 3):
"Panel/HUD/lista/tooltip pokazuje dane → `isMe`/`ME()` ('co widzi AKTYWNY człowiek')".
Kryterium gotowości z §C: "po każdym podetapie: typecheck + bramki + 20 tur" (behawioralny
no-op przy `humanOwnerIds=[0]`).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED DISPATCHEM RUND KOLEJNYCH:
- `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §A3 ("UI / HUD / panele / listy") i §B2 (tabela
  decyzyjna, wiersz 3, wzorzec dominujący `cities.filter(c => c.ownerId === 0)` jako
  źródło danych widoku; lista przybliżonych starych numerów linii — WSZYSTKIE do
  zweryfikowania świeżym grepem, plan był pisany na dawno nieaktualnym stanie pliku).
- **Ta sama uwaga co przy KAŻDYM poprzednim etapie tej nocy: main.ts zmienia się codziennie,
  numery linii z planu z dużym prawdopodobieństwem martwe — nie kopiuj ich bez świeżej
  weryfikacji.** Etapy 0-5 i Etap 6a (kategoria input, jeśli już zintegrowany w momencie
  tego recon — sprawdź `git log`/rejestr) są zintegrowane — sprawdź czy któreś z ~75
  miejsc UI JUŻ zostało przy okazji zamigrowane.
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6A-RECON-INPUT-Q1/01-operator-runda1-analiza.md`
  i `03-obrona-runda1.md` — wzorzec formatu tego recon (tabele klastrów z cytatem linii
  przed/po, rozliczenie liczby z planem, sprawdzenie nakładania z innymi etapami, plan
  dowodu no-op) — powtórz identyczną strukturę dla kategorii UI.
- **Etap 5 (`switchActiveHuman()`, zintegrowany, main.ts:10426) KROK 5 zeruje 20 zmiennych
  cache `_last*` PRZY PRZEŁĄCZENIU FOTELA** — ale to jest invalidacja przy handoff, NIE
  migracja samych miejsc, które te cache czytają/zapisują z filtrem `ownerId===0`. Sprawdź
  jawnie: czy zerowanie cache w Etapie 5 czyni migrację read-site'ów w tej kategorii
  częściowo zbędną, czy to dwie niezależne, obie potrzebne warstwy (podejrzenie: obie
  potrzebne — zerowanie zapobiega STARYM danym po handoffie, migracja na `isMe` zapobiega
  odczytowi/zapisowi cache pod złym kluczem gdy oba fotele istnieją jednocześnie).

ZADANIE TEJ RUNDY (WYŁĄCZNIE recon, zero kodu produkcyjnego):
1. **Zainwentaryzuj WSZYSTKIE miejsca w `gra/src/main.ts` i `gra/src/ui/*.ts` dotyczące
   kategorii "UI / HUD / panele / listy"**: filtrowanie list miast/jednostek do wyświetlenia
   (`cities.filter(c => c.ownerId === 0)` i analogiczne), HUD imperium (skarbiec/Praca/
   Nauka/stopy), panel wydarzeń/cywilizacji, cuda, rekrutacja, panele w `ui/cityPanel.ts`/
   `ui/siegeMapPanel.ts`/`ui/preBattle.ts`/`ui/powerOverlayHud.ts` — świeżym grepem, z
   dzisiejszymi numerami linii. Dla KAŻDEGO miejsca ustal: czy dziś jawnie sprawdza
   `ownerId === 0`/`!== 0` (kandydat `isMe`/`!isMe`), czy już zamigrowane (pomiń), czy to
   w istocie inna kategoria pomieszana z UI (np. mechanika ekonomii czytana W panelu —
   sprawdź granicę, jak recon Etapu 6a zrobił dla `afterPlayerUnitSpawned`/build-mode).
2. **Osobno zinwentaryzuj 19-20 zmiennych cache `let _last*`** (`main.ts` ok. 10054-10142
   wg planu, zweryfikuj świeżym grepem — recon Etapu 5 już znalazł "18+2, nie 19" przy
   okazji swojej pracy, sprawdź czy ta liczba i te same nazwy nadal aktualne) — ustal czy
   ich MIGRACJA (nie tylko zerowanie przy handoff, które już robi Etap 5) należy do tego
   podetapu, i jeśli tak, jaki mechanizm (np. keyed by ownerId zamiast singleton) minimalnie
   zmienia dzisiejsze zachowanie.
3. **Potwierdź/skoryguj liczbę "~75"** z planu — policz realnie, analogicznie do Etapu 6a
   (recon znalazł 42 zamiast ~25) — jeśli liczba się różni, wyjaśnij dlaczego.
4. **Dla każdego znalezionego miejsca zaproponuj konkretną podmianę** (`ownerId === 0` →
   `isMe(ownerId)`/`ME()`, z cytatem dokładnej linii przed/po) — grupując w logiczne
   klastry jak recon Etapu 6a (klastry A-H), nie jako płaską listę 75+ pozycji.
5. **Sprawdź nakładanie z Etapami 4/5/6a** (wszystkie potencjalnie zintegrowane do czasu
   tego recon — zweryfikuj świeżo, nie zakładaj) — czy którekolwiek z miejsc UI jest w
   kodzie już przepisanym przez wcześniejsze etapy, czy `switchActiveHuman()` już
   częściowo zamyka (patrz punkt kontekstu o `_last*`) — nie dublować pracy.
6. **Zaproponuj plan dowodu no-op** — behawioralny no-op przy `humanOwnerIds=[0]`, z
   konkretną, wykonywalną metodą (prawdopodobnie Chromium — UI dotyka DOM/renderu — ale
   zweryfikuj, nie zakładaj z automatu, wzorem recon Etapu 4a/5/6a §4.1/§5).

BINARNE KRYTERIUM SUKCESU TEJ RUNDY: kompletna, świeżo zweryfikowana lista miejsc kategorii
"UI" z dzisiejszymi numerami linii i konkretną podmianą per miejsce (pogrupowaną w klastry),
jawne rozliczenie z liczbą "~75" z planu, jawne sprawdzenie nakładania z Etapami 4/5/6a,
konkretny plan dowodu no-op, jawna decyzja co do migracji vs zerowania cache `_last*`.

ALLOWLISTA:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6B-RECON-UI-Q1/*` (WYŁĄCZNIE dokument recon —
  zero zmian w `gra/`)
Zakaz `git add -A`. Zakaz jakiegokolwiek kodu w `gra/src/**`/`gra/tools/**` w tej rundzie.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz przepisywania listy z planu bez świeżej weryfikacji
KAŻDEGO numeru linii osobno — main.ts przeszedł przez ~16+ integracji tej samej nocy
(Etapy 0-5 hot-seat + Etap 6a + ~11 innych tematów), stare numery linii z planu są z
dużym prawdopodobieństwem nieaktualne. Zakaz spłaszczenia ~75 pozycji do jednej
niezróżnicowanej listy — grupuj w klastry z uzasadnieniem, jak recon Etapu 6a.

IZOLACJA: worktree `/home/user/wt-hotseat-etap6b-recon`, gałąź
`autobot/R-HOTSEAT-ETAP6B-RECON-UI-Q1`, baza `origin/main` @ `fe74fb0f`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit` (nie powinno być nawet potrzebne — zero
zmian kodu).

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow). Final Control NIE dispatchowany
(dokument, nie kod). Po zamknięciu: dispatch `R-HOTSEAT-ETAP6B-UI-Q1` (implementacja)
jako osobny temat, gdy zwolni się lania (po Etapie 6a).
DEPLOY/PUSH: NIE WYKONANO
