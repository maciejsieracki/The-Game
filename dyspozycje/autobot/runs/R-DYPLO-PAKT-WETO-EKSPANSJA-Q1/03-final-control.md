# 03 — FINAL CONTROL (runda 1)

STATUS: PASS-WITH-NOTES
GOTOWOŚĆ DO INTEGRACJI: **TAK** — orkiestrator może scalić tę gałąź do `main` (fast-forward,
zero konfliktów zmierzone próbnym mergem) i wystawić `READY_FOR_DEPLOY` po standardowej
integracji.
DOMAIN: GAME
TEMAT: `R-DYPLO-PAKT-WETO-EKSPANSJA-Q1`
GOAL: zgodny co do słowa z `00-dispatch.md` — sprawdzone (diff `00-dispatch.md` nie ruszony).

WERYFIKACJA: własny, trzeci niezależny worktree `/home/user/wt-FC-R-DYPLO-PAKT`, checkout
`origin/autobot/R-DYPLO-PAKT-WETO-EKSPANSJA-Q1` @ `4dbb564c` (detached), `node_modules`
dowiązane z checkoutu `main`. Nic z raportów Operatora/Evaluatora nie przyjęte na słowo —
każde twierdzenie niżej jest zmierzone w tym worktree.

ZMIANY/COMMIT: bazowa naprawa `60f3b1a1` (niezmieniona), + **jeden micro-fix integracyjny
mojego autorstwa** w `gra/tools/diplomacy-proposal-test.cjs` (patrz §2, N1). Wszystkie pliki
w allowliście. `gra/data/**`, `WERSJE.md`, pozostałe typy umów, `gra/dist` — nietknięte
(zweryfikowane `git status`/`git diff --check`, czyste). `origin/main` nadal `a79614db`
(niezmieniony od dispatchu).

TESTY (uruchomione przeze mnie, po moim micro-fixie, nie streszczone z raportów):
- `dyplo-pakt-ekspansja-granica-test.cjs` — **26/26**, exit 0
- `diplomacy-proposal-test.cjs` — **188/188**, exit 0 (po micro-fixie N1 nadal 188/188)
- **wszystkie 51** bramek `diplomacy-*`/`dyplo-*`/`granice-relacja-*`/`wiarygodnosc-*`/
  `eot-diplomacy-*` — **0 czerwonych**, exit 0 każda
- referencyjne: logic **213/213** · tech-tree **19/19** · research **33/33** ·
  unit-replace **13/13** · combat **6/6** — identyczne liczby jak w raportach
- `tsc --noEmit` exit **0** (po micro-fixie też)
- `vite build` (C-001, `--outDir /tmp/civ-dist-fc-dyplo`) exit **0**, 23,1 s, `gra/dist`
  nie powstał
- **Mutacja 1 — kod sprzed naprawy** (`a79614db`): nie odtwarzałem ponownie (Operator i
  Evaluator zgodni co do 14/26, brak sprzeczności do rozstrzygnięcia)
- **Mutacja 2 — `NAP_EKSPANSJA_RELACJA_NARZUT = 0`**: zmierzone samodzielnie →
  **17/26** (czerwienieją A2a, B2, B3, C0, C1, C2, C3, F1, F2). Potwierdza liczbę
  Evaluatora, **nie** Operatora (§1 niżej).
- **Próbny merge z `origin/main`** (`git merge-tree`): **zero konfliktów** — `main` nie
  przesunął się od bazy dispatchu (`a79614db`), scalenie jest trywialnym fast-forwardem.
  Nie merguję do `main` — rekomendacja dla orkiestratora: prosty `git merge --ff-only`
  (albo integracja wg standardowego procesu), bez rozstrzygania konfliktów, bo ich nie ma.

BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora → `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO (deploy/push to osobna bramka po integracji orkiestratora).

---

## 1. N1 (Evaluator) — potwierdzone, naprawione jako micro-fix integracyjny

Zmierzone samodzielnie: przy `NAP_EKSPANSJA_RELACJA_NARZUT = 0`,
`diplomacy-proposal-test.cjs` (para asercji poz. 3) daje **188/188 PASS** — czynnik może
zostać cicho wyzerowany bez czerwonego testu w tym pliku, bo para jest sparametryzowana samą
mutowaną stałą (`napProg + napNarzut ± 1`), więc jest tautologiczna wobec jej wartości.
Zdanie w komentarzu Operatora „Potwierdza to mutacja NARZUT = 0: test czerwienieje" jest
**mierzalnie fałszywe** — i to samo zdanie żyło w komentarzu kodu (`diplomacy-proposal-
test.cjs:173`, `AKTUALIZACJA UZASADNIONA... czynnik nadal musi coś kosztować, żeby test
przeszedł"`), więc wjechałoby do `main` jako trwałe, nieprawdziwe uzasadnienie.

Rzeczywista ochrona przed cichym wyzerowaniem istnieje — ale wyłącznie w
`dyplo-pakt-ekspansja-granica-test.cjs` (A2a/B2/B3, hardcodowane wartości niezależne od
mutowanej stałej): tam `NARZUT=0` realnie czerwienieje (zmierzone: 17/26, nie 15/26 z
`01-operator.md` — Evaluator miał rację co do liczby, ja reprodukuję **17/26**, nie 15).

**Naprawiłem to jako drobiazg tekstowy w allowliście** (`gra/tools/diplomacy-proposal-
test.cjs`, komentarz przy asercji poz. 3) — sprostowałem zdanie, wskazałem że realna ochrona
jest w drugim pliku i podałem zmierzoną liczbę 17/26. Zero zmiany logiki testu ani kodu gry;
po zmianie nadal 188/188 i 26/26 (potwierdzone wyżej). To nie jest defekt kodu gry — to była
nieprawdziwa treść komentarza, w zakresie mojego mandatu na integration micro-fix.

## 2. Kryteria dispatchu 1–7 — zweryfikowane od zera, niezależnie

1. **Zamierzone czy defekt.** Sprawdziłem sam: `Dyplomacja/Dyplomacja-zasady.md` §3.2,
   `Dyplomacja-DOKUMENTACJA-DEV.md:180`, `gra/data/diplomacy.json:746` modelują czynnik
   WYŁĄCZNIE jako −2 Zaufania/turę; żadna tabela progów go nie wspomina.
   Dodatkowo potwierdziłem **N5 Evaluatora** wprost w źródle:
   `docs/decyzje/D3-PROG-DIFF-2026-07-21.md:37` — decyzja właściciela „NAP | progNapRelacja |
   — | NIE | tylko Relacja" — zamknięta decyzja, nie tylko brak źródła. Wniosek „defekt, nie
   zamiar" ma **mocniejsze** pokrycie źródłowe niż w raporcie Operatora. `DECISION_REQUIRED`
   nie było wymagane.
2. **Czy weto było wyjściowe.** Zmierzone bezpośrednio w `main.ts` (4 miejsca: 16283, 16319,
   17481, 27599) — dosłownie `cities.filter(...).length > 2 && cities.filter(...).length > 2`,
   zero granic/sąsiedztwa/osadnictwa, przeliczane co turę, bez żadnej akcji gracza zdejmującej
   flagę poza spadkiem poniżej 3 miast. „Strukturalnie nieosiągalne" — **potwierdzone przeze
   mnie z kodu**, nie z cytatu raportu.
3. **One-shot vs −2/turę.** Diff w `diplomacy.ts` to wyłącznie komentarz (sprawdzone `git
   diff` linia po linii) — zero zmiany zachowania. UI (`diplomacy-factors.ts`, nietknięty)
   zgodny ze specyfikacją.
4. **Parytet.** Sprawdziłem żywą ścieżkę samodzielnie: `main.ts:14930`
   `previewNegotiationEntry` → dla `nap`, `previewIncomingPlayerAccept` zwraca `null`
   (potwierdziłem: `nap` NIE jest w `INCOMING_NET_PW_ACTIONS` —
   `diplomacy-acceptance-points.ts:614-618`, zbiór zawiera tylko `handel`/`umowa_handlowa`/
   `umowa_szlakow`) → spada do `evaluateProposal`. Narzut stosuje się **symetrycznie na
   żywej ścieżce Stołu negocjacji w obu kierunkach**. Potwierdzam też **N3 Evaluatora**:
   `evaluatePendingFromAI` jest w `main.ts` zaimportowane (linia 1151) i **nigdzie nie
   wołane** (jedyne wystąpienie w `gra/src` poza plikiem definicji) — testy E1/E2 dowodzą
   symetrii helpera POZA żywą ścieżką, ale substancja (żywa ścieżka jest symetryczna) się
   potwierdza niezależnie przez `previewNegotiationEntry`. Jedyna asymetria —
   `resolvePlayerAcceptsAiPending` bez progów przy ręcznym kliknięciu gracza — jest
   pre-istniejąca, jawnie opisana (`C-DYP-Q1=A`) i nie jest regresją: diff w tej funkcji to
   wyłącznie dodany komentarz, zero zmiany logiki.
5. **Uczciwość komunikatu.** Scenariusz właściciela (Zaufanie 17 + Respekt 64 = Relacja 81)
   → próg 50+20=70 → **81 ≥ 70 → pakt zawarty** (zweryfikowane testem A3, zielony).
   Komunikat odmowy podaje liczbę progu, przyczynę narzutu i dwie akcje — zweryfikowane
   czytaniem kodu źródłowego bramki.
6. **Zero regresji.** 51/51 bramek dyplomacji + 5/5 referencyjnych, zero czerwonych —
   zmierzone przeze mnie od zera, identyczne liczby jak w obu poprzednich raportach.
   Brak cichego rozluźnienia `R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1`: sprawdziłem, że
   `unfairToPartnerGate`/`treatyPnGate` (bramki tamtego tematu) wykonują się PRZED `switch
   (actionId)` i nie są dotknięte diffem — kolejność bramek nienaruszona, więc klasa
   regresji „fałszywa przyczyna" i „priorytet uczciwość vs chęć do handlu" się nie odtwarza.
   Nie odtworzyła się też klasa „regresja AI→gracz" (§4 wyżej: `resolvePlayerAcceptsAiPending`
   diff to tylko komentarz) ani „overpay" (bramka `nap` nie ma i nigdy nie miała
   PW-fairness gate — `nap` nie jest w `INCOMING_NET_PW_ACTIONS`, zero zmiany w tym diffie).
7. **`tsc`/`vite build`/real render.** `tsc` 0 błędów, `vite build` exit 0 (§ „TESTY" wyżej).
   Real render: żaden plik UI (`diplomacyAcceptanceBalance.ts`, `diplomacy-factors.ts`) nie
   był zmieniony w tym diffie, więc kryterium 7 dispatchu („real render dla **zmienionego**
   UI") nie stosuje się dosłownie; niemniej sprawdziłem źródłowo CSS `.da-pn-bal-hint`
   (`diplomacyAudience.ts:764`, `diplomacyTradeBasket.ts:372`) — brak `white-space:nowrap`
   i `text-overflow:ellipsis` na tym elemencie ani na rodzicach, więc dłuższy tekst
   komunikatu zawija się, nie ucina. Potwierdza to N7 Evaluatora bezpośrednio ze źródła
   (bez potrzeby odtwarzania pełnego harnessu w przeglądarce — brak zmiany CSS oznacza brak
   ryzyka regresji layoutu, którego CSS-owy render Evaluatora już nie wykrył).

## 3. Pozostałe uwagi Evaluatora (N2, N4, N6, N8) — status

- **N2** (liczba mutacji 15/26 vs 17/26): rozstrzygnięte w §1 — **17/26**, zgodnie z
  Evaluatorem. Liczba Operatora była błędna z pamięci, nie z pomiaru.
- **N4** (`diplomacy-locks.ts` — podgląd „Możliwe umowy" nie zna narzutu, więc NAP przy
  Relacji [50,70) pokazuje się jako odblokowany, a ocena i tak odrzuca): **potwierdzone
  przeze mnie z kodu** (`diplomacy-locks.ts:178`, `relacjaGate(ctx.progNapRelacja, ...)`,
  `DiplomacyActionLockContext` bez pola flagi). Realne, ale plik poza allowlistą tego
  tematu i **nie jest regresją** — przed naprawą to samo okno było [50,∞) i kończyło się
  ścianą przy ocenie identycznie. Zgadzam się z Evaluatorem: nie zamykać w całości wpisu
  `P-DYPLO-PAKT-NIEAGRESJI-ZAUFANIE-MIMO-PLUS-BILANS` w `PYTANIA-OTWARTE.md` przy integracji
  — połowa zgłoszenia (podgląd listy) zostaje otwarta pod osobnym ID
  (`R-DYPLO-PAKT-LOCK-PREVIEW-NARZUT-Q1`, zaproponowanym przez Evaluatora).
- **N6** (długość raportu Operatora): stylistyczne, nie blokuje.
- **N8** (`diplomacy-acceptance-points.ts:156/168` — przykładowy komentarz „NAP @ Rel 61 →
  accepted" jest teraz nieaktualny przy aktywnym czynniku): **potwierdzone przeze mnie z
  kodu** — plik poza allowlistą tego tematu, więc **nie dotykam** go jako micro-fix (w
  odróżnieniu od N1, które leżało w `gra/tools/*`, wewnątrz allowlisty). Do rejestru przy
  najbliższym temacie dotykającym tego pliku.

## 4. Rekomendacja dla orkiestratora przy zamykaniu `PYTANIA-OTWARTE.md`

`P-DYPLO-PAKT-NIEAGRESJI-ZAUFANIE-MIMO-PLUS-BILANS` — **nie zamykać w całości**. Ta paczka
domyka połowę zgłoszenia (bramka oceny `evaluateProposal`). Druga połowa (podgląd „Możliwe
umowy" w `diplomacy-locks.ts` pokazujący NAP jako odblokowany mimo narzutu) zostaje otwarta —
proponowane odesłanie: `supersedes`/`duplicate_of` częściowy, z nowym ID
`R-DYPLO-PAKT-LOCK-PREVIEW-NARZUT-Q1` dla reszty.

Do rejestru (poza tą paczką, zgłoszone przez Operatora/Evaluatora, potwierdzone przeze mnie):
1. `R-DYPLO-AI-INICJATYWA-PAKT-PARYTET-Q1` (`ai.ts` nie zna flagi przy własnej inicjatywie).
2. `R-DYPLO-EKSPANSJA-GRANICA-HEURYSTYKA-FALSZYWA-NAZWA-Q1` (flaga mierzy liczbę miast, nie
   ekspansję/granicę/sąsiedztwo — fałszywa przyczyna w panelu „ZA CO CIĘ NIE LUBIĄ").
3. `R-DYPLO-PAKT-LOCK-PREVIEW-NARZUT-Q1` (N4, wyżej).
4. Stały komentarz w `diplomacy-acceptance-points.ts:156/168` (N8) do sprostowania przy
   najbliższej okazji dotykającej tego pliku.

## 5. Werdykt

Naprawa jest rzetelna, zmierzona niezależnie od zera w trzecim worktree, zero regresji na
51+5 bramkach, `tsc`/`vite build` czyste, próbny merge z `origin/main` bezkonfliktowy
(fast-forward — main niezmieniony od bazy dispatchu). Jedyny realny defekt w samej paczce
(N1: nieprawdziwe zdanie w komentarzu testu) był drobiazgiem tekstowym w allowliście —
naprawiony przeze mnie jako integration micro-fix, zweryfikowany ponownym zielonym przebiegiem
wszystkich bramek. Żaden z trzech historycznych wzorców regresji tego obszaru (fałszywa
przyczyna w komunikacie, regresja AI→gracz, overpay) się nie odtworzył. `DECISION_REQUIRED`
nie jest potrzebny — źródła (w tym D3-PROG-DIFF, dotąd pominięty) jednoznacznie wspierają
„defekt, nie zamiar".

**PASS-WITH-NOTES. Gotowa do integracji.**

---

Commit: `fa8591c1` — `03-final-control.md` (+ micro-fix `diplomacy-proposal-test.cjs`),
wypushowany na `origin/autobot/R-DYPLO-PAKT-WETO-EKSPANSJA-Q1` (`4dbb564c..fa8591c1`).
`origin/main` nadal `a79614db`. Mój worktree: `/home/user/wt-FC-R-DYPLO-PAKT` (zostawiony,
czysty).
