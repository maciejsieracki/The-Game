# 01 — OPERATOR (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-DYPLO-PAKT-WETO-EKSPANSJA-Q1`
GOAL: Audyt bramki „Ekspansja przy granicy — brak zaufania do paktu": ustalić, czy twarde,
niekompensowalne weto Paktu o nieagresji jest zamierzone, czy jest defektem, i doprowadzić
do stanu, w którym gracz **wie, co ma zrobić, żeby zawrzeć umowę** — albo umowa jest
osiągalna, albo jej niedostępność jest jawnie i uczciwie zakomunikowana.

MODEL WYKONAWCY: **Opus 5** (`claude-opus-5[1m]`, odczytane ze środowiska sesji).
Effort: NIEPOTWIERDZALNY po stronie Operatora — parametr nie jest odczytywalną wartością
w tej sesji, więc zgodnie z §13a nie deklaruję go jako faktu.

ZMIANY/COMMIT: 4 pliki, wszystkie w allowliście (+ artefakt runu):
- `gra/src/game/diplomacy-proposals.ts` — WYŁĄCZNIE bramka `case 'nap'` (+ nowa stała
  `NAP_EKSPANSJA_RELACJA_NARZUT`) i jawny zapis parytetu przy `resolvePlayerAcceptsAiPending`
- `gra/src/game/diplomacy.ts` — WYŁĄCZNIE komentarz przy `case 'tarcia_graniczne'`
  (sprostowanie, **zero zmiany zachowania**)
- `gra/tools/dyplo-pakt-ekspansja-granica-test.cjs` — nowy, 26 asercji
- `gra/tools/diplomacy-proposal-test.cjs` — jedna zaktualizowana asercja (uzasadnienie niżej)
NIETKNIĘTE mimo obecności w allowliście: `diplomacy-factors.ts` i
`ui/diplomacyAcceptanceBalance.ts` — pomiar wykazał, że są poprawne (patrz §3 i §5).
`gra/data/**`, `WERSJE.md`, pozostałe typy umów: `git status` = 0 zmian. `gra/dist` nie powstał.

TESTY (wyniki wklejone z przebiegu):
- `dyplo-pakt-ekspansja-granica-test.cjs` (nowy) — **26/26**
- **Dowód nietautologiczności — dwie niezależne mutacje:**
  kod sprzed naprawy → **14/26** (czerwienieją A1–A4, C1/C3/C4, F1/F3 — dokładna
  reprodukcja zgłoszenia); `NAP_EKSPANSJA_RELACJA_NARZUT = 0` (ciche rozluźnienie do
  no-op) → **15/26** (czerwienieją B2/B3, C0–C3).
- `diplomacy-proposal-test.cjs` — **188/188** (przed zmianą asercji: 186/187 z 1 FAIL)
- **Wszystkie 49 bramek dyplomacji** (`diplomacy-*`, `dyplo-*`, `granice-relacja-*`,
  `wiarygodnosc-*`, `eot-diplomacy-*`) — exit=0. M.in. `diplomacy-test` 148/148,
  `diplomacy-locks` 78/78, `diplomacy-negotiation-table` 62/62,
  `diplomacy-acceptance-points` OK, `granice-relacja-dyplomatyczna` 52/52.
- Bramki referencyjne §6: logic **213/213** · tech-tree **19/19** · research **33/33** ·
  unit-replace **13/13** · combat **6/6** — zgodne z punktem odniesienia.
- `tsc --noEmit` **0 błędów** · `vite build` (C-001: `node ./node_modules/vite/bin/vite.js
  build --outDir /tmp/civ-dist-dyplo-pakt --emptyOutDir`) OK, 19,6 s.

BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Opus 5, adwersaryjnie).
DEPLOY/PUSH: NIE WYKONANO (push gałęzi roboczej `autobot/R-DYPLO-PAKT-WETO-EKSPANSJA-Q1`
to nie deploy; `main` nietknięty).

---

## 1. Czy weto było zamierzone — ustalenie U ŹRÓDŁA

**Nie. Weto nie ma ŻADNEGO źródła projektowego, a jedyne istniejące źródła mu przeczą.**

Kanoniczna specyfikacja dyplomacji opisuje ten czynnik **wyłącznie** jako ciągły
modyfikator Zaufania, i to w sekcji, której tytuł tego nie pozostawia otwartym:

- `Dyplomacja/Dyplomacja-zasady.md` §3.2 „**Co turę — stany trwające**":
  `| Ekspansja przy granicy | −2 |`
- `Dyplomacja/Dyplomacja-DOKUMENTACJA-DEV.md:180`:
  `| ekspansjaGranica_zaufanie_perTura | −2 | ekspansja/osadnictwo przy granicy |`
- `gra/data/diplomacy.json:746` (dane gry):
  `"Stan / zdarzenie ciągłe": "Ekspansja przy granicy", "Δ Zaufanie/turę": -2`

W **żadnej** tabeli progów ani warunków akceptacji tej specyfikacji (§2.1 „Progi", §2.3,
§5 „Dostępność akcji") czynnik nie występuje. `docs/decyzje/` nie zawiera ani jednego
dokumentu ustanawiającego weto. `git log -S"ekspansjaPrzyGranicy"` na tym pliku nie
pokazuje commitu wprowadzającego (historia repo jest po imporcie/spłaszczeniu — rząd 2
nie daje tu odpowiedzi, i tak to zapisuję zamiast zgadywać).

**Właściciel zgłosił dokładnie ten sam defekt już 2026-08-10** i sformułował kryterium
akceptacji — zgłoszenie leży w `dyspozycje/PYTANIA-OTWARTE.md:10748` jako
`P-DYPLO-PAKT-NIEAGRESJI-ZAUFANIE-MIMO-PLUS-BILANS`, **STATUS: zarejestrowane, w kolejce**
(nigdy nie rozstrzygnięte, więc nie było czego naruszyć):

> „w opcjach miałem pakt o nieagresji, ale kiedy spełniam bilans na plusie, to niestety
> system twierdzi, że brak mam zaufania do paktu. No to albo nie mam zaufania i nie ma
> tego w opcjach do wyboru, **albo jest w opcjach do wyboru, kwestią jest tylko
> zbalansowanie innymi propozycjami**."

Wcześniejszy audyt w archiwum czatów (`MASTER-Work_KORESPONDENCJA.md:75873`) postawił tę
samą diagnozę i rekomendował zmianę, na którą właściciel nigdy nie odpowiedział:

> „To **uproszczona heurystyka (liczy miasta, nie realną ekspansję)**. […] Handel można
> »kupić« […]; **pakt nie ma takiego mechanizmu**." → rekomendacja: „Wyłączyć lub
> złagodzić `ekspansjaPrzyGranicy` dla NAP — nie blokuje późnej gry".

**Wniosek: defekt, nie zamiar.** Nie jest to `DECISION_REQUIRED` — źródła nie są
sprzeczne ani nieobecne w sposób wymagający decyzji: istnieje jedno spójne źródło
projektowe i mówi ono, że to modyfikator per-tura, a nie bramka.

## 2. Czy weto było w ogóle wyjściowe — POMIAR

**Nie było. Pakt był z takim sąsiadem strukturalnie nieosiągalny.**

Co ustawia flagę (`main.ts`, 4 identyczne miejsca — 16283, 16319, 17481, 27599):

```ts
ekspansjaPrzyGranicy:
  cities.filter(c => c.ownerId === a).length > 2 && cities.filter(c => c.ownerId === b).length > 2,
```

To czysta funkcja **liczby miast**, przeliczana od nowa co turę. Nie ma w niej granic,
sąsiedztwa, osadnictwa ani ruchu wojsk. Konsekwencje zmierzone:

- **Jak długo trwa:** dopóki obie strony mają ≥3 miasta — czyli praktycznie do końca partii.
- **Jaka akcja gracza ją zdejmuje:** **żadna**, poza zejściem poniżej 3 miast (utrata /
  oddanie miast). Nie ma dyplomatycznej, ekonomicznej ani wojskowej drogi wyjścia.
- **Czy dało się przepłacić:** nie. Pomiar `evaluateProposal` przy Relacji **200/200**
  (maksimum skali) i słodziku **100 000 ¤** → `accepted=false`,
  `reason='Ekspansja przy granicy — brak zaufania do paktu'`. Identycznie dla 0/100/500/5000 ¤.

To była też sprzeczność wewnątrz jednej funkcji: dwie linijki wyżej próg Relacji jest
jawnie kompensowalny słodzikiem (`C-DYP-STOL-Q1=B`), a bezpośrednio pod nim stało „nigdy".

## 3. Rozjazd one-shot vs −2/turę — ROZSTRZYGNIĘTY POMIAREM

**UI ma rację, komentarz w kodzie był mylący. To dwa różne mechanizmy, nie jeden.**

- Stan ciągły `ctx.ekspansjaPrzyGranicy` → `computeTickZaufanieDelta` (`diplomacy.ts:1685`).
  Pomiar `tickDiplomacy`: Zaufanie 50 → **48 / 46 / 44 / 42 / 40** w pięciu turach
  (kontrola z flagą `false`: 50 → 50). Delta per tura = **−2**. To jest czynnik ze zrzutu.
- Dyskretne zdarzenie `'tarcia_graniczne'` → `applyDiplomaticEvent` (`diplomacy.ts:922`).
  Jednorazowe; pożycza tylko *wartość* parametru per-turowego. Pomiar: 20 → **18**, raz.
  Pinowane od dawna przez `diplomacy-test.cjs:158`.

Komentarz `„Ekspansja przy granicy" -- modelled as one-shot -2 Zaufanie` stał przy tym
**drugim** mechanizmie i opisywał go nazwą **pierwszego** — stąd pozorna sprzeczność
z UI. Sprostowany (komentarz, zero zmiany zachowania). Wiersz UI zweryfikowany pomiarem:
`buildRelationBreakdown` zwraca `{label:'Ekspansja przy granicy', value:-2, perTurn:true}`
— **zgodny ze specyfikacją, nic do naprawy** w `diplomacy-factors.ts`.

## 4. Parytet (rule_108) — ZMIERZONY, jedna luka nazwana

| Ścieżka | Kto jest responderem | Czy stosuje bramkę | Ocena |
|---|---|---|---|
| gracz → AI (`evaluateProposal`) | AI | TAK | — |
| AI → AI (`main.ts` → `evaluateProposal`) | AI | TAK, ta sama `ctx` | — |
| AI → gracz, gracz klika „Przyjmij" (`resolvePlayerAcceptsAiPending`) | **człowiek** | NIE | wyjątek **jawny**, `C-DYP-Q1=A` |
| **inicjatywa AI** (`ai.ts` Priorytet 3b, ~4344) | — | **NIE ZNA FLAGI** | **luka, poza allowlistą** |

Pomiar asymetrii **przed** naprawą (dowód, że weto było defektem, a nie modelowaną
nieufnością): w **tej samej** sytuacji `ekspansjaPrzyGranicy=true` AI jednocześnie
odmawiało graczowi (`accepted=false`, „brak zaufania do paktu") **i samo oferowało mu
ten sam pakt**, który gracz przyjmował bez żadnej bramki (`resolvePlayerAcceptsAiPending`
→ `accepted=true`, traktat zawarty). Weto biło **wyłącznie** w gracza jako proponenta.

Po naprawie parytet bramki jest pełny — test E1/E2 sprawdza, że `evaluateProposal`
(gracz→AI) i `evaluatePendingFromAI` (AI→gracz) dają **identyczny werdykt i identyczny
komunikat** po obu stronach progu. Wyjątek ręcznej akceptacji gracza jest udokumentowany
w kodzie i **przypięty testem E3**, żeby przyszła zmiana nie przemknęła jako „asymetria
przypadkowa".

**Luka rezydualna, zgłaszana jawnie:** `ai.ts` sprawdza przy własnej inicjatywie tylko
`score >= progNapRelacja - napScoreEase` i **nie zna flagi w ogóle** (`AIDiplomacyInput`
jej nie niesie), więc AI potrafi zaproponować pakt przy Relacji 50–69, którego samo by
nie przyjęło. Domknięcie wymaga `ai.ts` **i** `main.ts` — **oba poza allowlistą** tego
tematu. Zgodnie z §14 nie poszerzam zakresu w biegu; zgłaszam jako osobny temat (§6).
Moja zmiana tej luki nie tworzy i nie poszerza — **zawęża ją** z „zawsze" do „przedział
20 punktów Relacji".

## 5. Którą drogę wybrałem i dlaczego

**Droga A z GOAL: warunek staje się kompensowalny, spójnie z `sweetenerEasePoints`.**
Weto zamienione na **narzut na próg Relacji**:

```ts
const napExpansionSurcharge = ctx.ekspansjaPrzyGranicy ? NAP_EKSPANSJA_RELACJA_NARZUT : 0;
const napThreshold = Math.max(0, p.progNapRelacja + napExpansionSurcharge - napEase);
```

Uzasadnienie, wprost z ustaleń §1:

1. **Źródła zabraniają drogi B.** Droga B („niedostępne dopóki X") wymagałaby podania
   `X = „dopóki obie strony mają >2 miasta"` — czyli uczciwego przyznania, że Pakt
   o nieagresji znika z gry od ~3. miasta. To wprost przeczy `Dyplomacja-zasady.md` §5
   („2. Pakt o nieagresji | główni: TAK"), a heurystyka, którą trzeba by graczowi
   nazwać, i tak nie mierzy tego, co obiecuje jej nazwa.
2. **Właściciel opisał dokładnie ten stan docelowy** (§1): skoro Pakt **jest** w opcjach
   do wyboru, to „kwestią jest tylko zbalansowanie innymi propozycjami".
3. **Spójność wewnątrz funkcji.** Dwa warunki nad tym są progowe i kompensowalne mocą
   decyzji `C-DYP-STOL-Q1=B`. Trzeci nie miał powodu być inny.

**Wartość narzutu jest WYPROWADZONA, nie wymyślona:** `NAP_EKSPANSJA_RELACJA_NARZUT =
SWEETENER_EASE_MAX_POINTS` (20). Ta równość jest treścią decyzji, nie zbiegiem
okoliczności: **maksymalny słodzik dokładnie kasuje narzut**, więc czynnik nigdy nie
czyni paktu nieosiągalnym — czyni go droższym. To zamyka GOAL nie przez złagodzenie
liczby, tylko przez własność strukturalną, którą test A2 sprawdza wprost. Żadnego nowego
balansu nie wprowadzam.

**Uczciwość komunikatu (GOAL: „gracz WIE, co ma zrobić").** Zamiast bezwyjściowego
„Ekspansja przy granicy — brak zaufania do paktu" gracz dostaje:

> `Relacja zbyt niska na pakt (wymagana ≥ 70; +20 za ekspansję przy granicy — dołóż do oferty lub podnieś Relację)`

— liczba do osiągnięcia, przyczyna narzutu i dwie konkretne akcje. Bez czynnika komunikat
zostaje w starej, krótkiej formie (test C5 — brak szumu). `ui/diplomacyAcceptanceBalance.ts`
renderuje `responderPreview.reason` dosłownie, więc **nie wymagał zmiany**; że komunikat
faktycznie dociera na ekran, sprawdza sekcja F testu na wyjściu
`renderPnBalancePanelHtml` (F1–F4, w tym brak regresji tonu panelu).

**Sytuacja ze zgłoszenia jest odblokowana:** Zaufanie 17 + Respekt 64 = Relacja 81 ≥ 70
→ pakt zawarty nawet bez słodzika (test A3).

## 6. Zaktualizowana istniejąca asercja — jawne uzasadnienie

Dokładnie **jedna**: `diplomacy-proposal-test.cjs` poz. 3, dotąd
`ok(!r.accepted, 'NAP reject ekspansja')` przy domyślnej Relacji 110. Sprawdzała binarne
weto, które §1 i §2 identyfikują jako defekt bez źródła.

**Nie została rozluźniona — została wzmocniona.** Jednolinijkowe `!accepted` zastąpiła
**para** asercji po obu stronach progu (Relacja `próg+narzut−1` → odrzucone; Relacja
`próg+narzut` → przyjęte), więc czynnik **musi nadal coś kosztować**, żeby test przeszedł.
Potwierdza to mutacja `NARZUT = 0`: test czerwienieje (15/26 w nowym pliku, B2/B3 w tym
mechanizmie). Powód aktualizacji zapisany w komentarzu przy asercji, nie tylko w raporcie.

## 7. Znaleziska POZA zakresem — do rejestru, nie do tej paczki (§14)

Nie ruszałem ich. Proponowane ID dla orkiestratora:

1. **`R-DYPLO-AI-INICJATYWA-PAKT-PARYTET-Q1`** — `ai.ts` Priorytet 3b nie zna
   `ekspansjaPrzyGranicy`; AI oferuje pakt, którego samo by nie przyjęło (Relacja 50–69).
   Allowlista musiałaby objąć `ai.ts` + `main.ts`. Szczegóły i pomiar: §4 wyżej.
2. **`R-DYPLO-EKSPANSJA-GRANICA-HEURYSTYKA-FALSZYWA-NAZWA-Q1`** — flaga nazywa się
   „Ekspansja przy granicy", a mierzy `obie strony > 2 miasta`: bez granic, bez
   sąsiedztwa, bez osadnictwa. Gracz w panelu „ZA CO CIĘ NIE LUBIĄ" widzi **fałszywą
   przyczynę** −2/turę — ta sama klasa błędu, którą `R-DYPLOMACJA-HANDEL-BRAMKA-
   PRIORYTET-Q1` domykał przez 4 rundy. Naprawa = `main.ts` (4 miejsca), poza allowlistą.
3. `dyspozycje/PYTANIA-OTWARTE.md:10748` (`P-DYPLO-PAKT-NIEAGRESJI-ZAUFANIE-MIMO-PLUS-BILANS`)
   opisuje **ten sam** defekt i jest tym tematem obsłużone — do zamknięcia z odsyłaczem
   (`supersedes`/`duplicate_of`, C-057). Rejestru nie edytowałem: nie jest w allowliście,
   a przy trzech tematach równoległych to plik konfliktogenny (§2b, C-059).
