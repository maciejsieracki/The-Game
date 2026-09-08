STATUS: DISPATCH
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6E-RECON-RENDER-Q1
GOAL: Recon-only (ZERO zmian kodu) dla piątego pod-etapu Etapu 6 planu hot-seat
(`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §C, wiersz "6": "(e) render ~15"). Kategoria
z §A8 ("Render / kamera — ~15 miejsc, większość już sparametryzowana"). Docelowy alias
prawdopodobnie `isMe`/`ME()` (render pokazuje PERSPEKTYWĘ aktywnego fotela — pierścienie
jednostek, kolory, kamera), analogicznie do (a)/(b) — ale ZWERYFIKUJ, nie zakładaj (Etap
6d pokazał, że kategoria potrafi wymagać więcej niż jednego aliasu naraz). Kryterium
gotowości §C: "po każdym podetapie: typecheck + bramki + 20 tur" (behawioralny no-op przy
`humanOwnerIds=[0]`).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED DISPATCHEM RUND KOLEJNYCH:
- `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §A8: `render/units.ts:5797-5798`
  (`ringStanceForOwner` — domyślna wartość pola, realny resolver w `main.ts:7722`),
  `main.ts:7833, 3239, 2238, 2268, 11283, 26447, 12849, 22438`. `render/camera.ts` —
  plan twierdzi "owner-agnostyczna, zero pracy (potrzebne tylko zapamiętanie pozycji per
  fotel jako NOWA funkcjonalność)" — **zweryfikuj to twierdzenie świeżo**, wzorem tego jak
  recon Etapu 6c obalił analogiczne twierdzenie planu o `game/empire-food.ts`.
- **Ta sama uwaga co przy KAŻDYM poprzednim etapie: main.ts zmienia się codziennie,
  numery linii z planu z dużym prawdopodobieństwem martwe.** Sprawdź `git log`/rejestr na
  start — Etap 6a (implementacja input) może być w toku LUB już zintegrowana w chwili
  Twojej pracy; NIE zakładaj żadnego stanu bez `git merge-base --is-ancestor`/świeżego
  `git log origin/main`, i sprawdź TAKŻE stan roboczy równoległego worktree
  `/home/user/wt-hotseat-etap6a-input` (`git status`/`git diff`) jeśli wciąż istnieje —
  dokładnie to Evaluator Etapu 6d musiał poprawić Operatorowi w rundzie 1 (Operator
  sprawdził tylko zintegrowany `main`, pomijając robotę w toku w równoległym worktree).
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-RECON-DIPLOMACY-Q1/01-operator-runda1.md` —
  najświeższy, najbardziej dopracowany wzorzec formatu (3 rundy Evaluatora, 2 Obrony) —
  przeczytaj jako wzorzec jakości, zwłaszcza podejście do "sprawdzenia nakładania z
  równoległym Etapem 6a" i jawnego przyznawania granic metody zamiast deklarowania
  fałszywej kompletności.
- Klaster A9 (AI, main.ts) i klaster A2 (input, Etap 6a) mogą fizycznie nakładać się z
  renderem (np. `ringStanceForOwner`/pierścienie jednostek na mapie renderowane przy
  input) — sprawdź jawnie.

ZADANIE TEJ RUNDY (WYŁĄCZNIE recon, zero kodu produkcyjnego):
1. **Zainwentaryzuj WSZYSTKIE miejsca w `render/*.ts` i `main.ts`** dotyczące renderu/
   kamery zależnego od właściciela (kolory jednostek/miast na mapie, pierścienie stance,
   podświetlenia terytorium, ikony/etykiety zależne od "czy to mój", pozycja/fokus kamery)
   — świeżym grepem `ownerId\s*(===|!==)\s*0` w `render/` + `main.ts` w kontekście
   renderu, z dzisiejszymi numerami linii.
2. **Zweryfikuj świeżym `Read`** czy `render/camera.ts` jest naprawdę "owner-agnostyczna,
   zero pracy" (twierdzenie planu) — potwierdź lub obal dowodem kodowym.
3. **Potwierdź/skoryguj liczbę "~15"** z planu — policz realnie (wzorem 42/78/32/136 z
   Etapów 6a/6b/6c/6d) — jeśli liczba się różni, wyjaśnij dlaczego.
4. **Dla każdego znalezionego miejsca zaproponuj konkretną podmianę** z uzasadnieniem
   aliasu (`isMe`/`ME()` najprawdopodobniej, ale rozstrzygnij per klaster, nie zakładaj).
5. **Sprawdź nakładanie z Etapami 6a (input)/6d (dyplomacja, AI-detekcja Etapu 1)** — czy
   którekolwiek miejsce jest już zmigrowane albo fizycznie leży w kodzie dotkniętym przez
   równoległą implementację 6a (sprawdź STAN ROBOCZY worktree, nie tylko zintegrowany
   main — patrz kontekst wyżej).
6. **Zaproponuj plan dowodu no-op** — behawioralny no-op przy `humanOwnerIds=[0]`, z
   konkretną metodą (Chromium prawdopodobnie — render jest DOM/canvas-bound — ale
   zweryfikuj per klaster, wzorem poprzednich recon).

BINARNE KRYTERIUM SUKCESU TEJ RUNDY: potwierdzenie/obalenie twierdzenia planu o
`render/camera.ts`, kompletna świeżo zweryfikowana lista miejsc kategorii "render" z
dzisiejszymi numerami linii i uzasadnionym aliasem per miejsce/klaster, jawne rozliczenie
z liczbą "~15", jawne sprawdzenie nakładania z Etapami 6a/6d (w tym stanu roboczego, nie
tylko zintegrowanego), konkretny plan dowodu no-op.

ALLOWLISTA:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6E-RECON-RENDER-Q1/*` (WYŁĄCZNIE dokument recon —
  zero zmian w `gra/`)
Zakaz `git add -A`. Zakaz jakiegokolwiek kodu w `gra/src/**`/`gra/tools/**` w tej rundzie.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz przyjęcia twierdzenia planu o `render/camera.ts`
("zero pracy") bez świeżego dowodu kodowego. Zakaz przepisywania starych numerów linii
bez weryfikacji. Zakaz sprawdzenia nakładania z Etapem 6a wyłącznie przez `git log
origin/main` — MUSISZ też sprawdzić stan roboczy worktree
`/home/user/wt-hotseat-etap6a-input` jeśli istnieje (`git status`/`git diff`),
dokładnie tak jak Evaluator Etapu 6d musiał to wymusić na Operatorze w rundzie 1.

IZOLACJA: worktree `/home/user/wt-hotseat-etap6e-recon`, gałąź
`autobot/R-HOTSEAT-ETAP6E-RECON-RENDER-Q1`, baza `origin/main` @ `9acad8db`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit` (nie powinno być nawet potrzebne — zero
zmian kodu).

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli Evaluator zwraca
NIEPUSTĄ listę zarzutów (niezależnie od etykiety STATUS w nagłówku) — zawsze wymagana
runda Obrony przed kolejnym Evaluatorem (R-PROC-AUTOBOT.md §3c) — nie pomijaj tego kroku.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty, ta sama runda) → kolejny
Evaluator jeśli była Obrona (Ścieżka A, Workflow). Final Control NIE dispatchowany
(dokument, nie kod). Po zamknięciu: dispatch `R-HOTSEAT-ETAP6E-RENDER-Q1` (implementacja)
jako osobny temat, gdy zwolni się lania.
DEPLOY/PUSH: NIE WYKONANO
