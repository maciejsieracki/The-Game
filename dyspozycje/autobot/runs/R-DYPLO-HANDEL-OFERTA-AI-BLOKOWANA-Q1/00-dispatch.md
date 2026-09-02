TEMAT:  R-DYPLO-HANDEL-OFERTA-AI-BLOKOWANA-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat LOGIKI GRY (nie wizualny — R-PROC-AUTOBOT.md
domyślny routing) — Operator Sonnet 5 effort=medium / Evaluator Sonnet 5
effort=high / Final Control Sonnet 5 effort=high.

## WYZWALACZ
Właściciel, cztery zrzuty ekranu panelu "Stół negocjacji" (frakcje Harappa
×2, Chińczycy, Sumerowie): "Cywilizacje AI przedstawiają propozycje
handlowe, które są na bilansie ujemnym, czyli nie mogą być przeze mnie
zaakceptowane. Powinny być zawsze propozycje na zerze, bilans zero,
ewentualnie delikatny plus, albo jest jakiś błąd w obliczeniach, albo błąd
w logice i kodzie."

## RECON (wykonany, NIE jest ostatecznym rozpoznaniem przyczyny — patrz
## niżej "co NIE jest jeszcze potwierdzone")

**Konwencja znaku "BILANS (NETTO)" — potwierdzona wprost w kodzie:**
`gra/src/ui/diplomacyAcceptanceBalance.ts:380` (komentarz):
"Netto PW: dodatnie = gracz oddaje więcej (przewaga partnera)." Czyli
**ujemny bilans = przewaga PO STRONIE GRACZA** (gracz oddaje MNIEJ niż
dostaje) — potwierdza to też etykieta w tym samym pliku, linia 399:
`if (netPw < 0) return 'Przewaga u Ciebie: +...'`.

We WSZYSTKICH czterech zrzutach właściciela bilans jest UJEMNY (-25, -20,
-10, -25) — czyli, wg własnej konwencji znaku gry, oferta jest KORZYSTNA
dla gracza. Mimo to `verdictHtml()` (`diplomacyAcceptanceBalance.ts:403-
413`) w gałęzi `isIncomingBasketTradePanel(data) && data.canAccept ===
false` renderuje komunikat "Przewaga u Ciebie — oferta nieuczciwa dla
partnera" i blokuje `Przyjmij` — czyli oferta KORZYSTNA dla gracza jest
odrzucana jako "nieuczciwa dla partnera" (AI), zamiast być zawsze
akceptowalna przez gracza.

`canAccept` (dla wiersza incoming) pochodzi z `row.responderPreview.
accepted` — wynik `evaluateProposal()` w `gra/src/game/diplomacy-
proposals.ts`, case `'handel'` (linia ~1177+), przez `handelFairnessGate`
(linia 917) / `handelRequiredPn` (linia 907), na bazie `givePn`/`receivePn`
z `resolveProposalPn(payload, pnOpts)` (`diplomacy-pn-engine.ts:211`).

**Ważny, udokumentowany w kodzie fakt o kierunku propozycji:** komentarz
`diplomacy-proposals.ts:820-830` mówi wprost, że mechanizm mnożnika chęci
handlu (`handelWillingnessMultiplier`) był "zaprojektowany" głównie dla
kierunku gracz→AI (`proposerIsPlayer`, "najczęstszy scenariusz"), a dla
kierunku AI→gracz (`responderIsPlayer===true`, czyli DOKŁADNIE nasz
przypadek — AI proponuje, gracz odpowiada) mnożnik jest na sztywno
wymuszony na `1` — z komentarzem, że wcześniej (runda 2) było to źródłem
osobnej regresji ("chęć AI" była błędnie liczona w złym kierunku). To NIE
dowodzi, że to jest dzisiejsza przyczyna — ale pokazuje, że kierunek
AI→gracz w tej bramce ma udokumentowaną historię asymetrycznych błędów i
jest słabiej zweryfikowany niż kierunek gracz→AI.

**Co NIE jest jeszcze potwierdzone (Operator MUSI to ustalić sam, żywą
reprodukcją, zanim zacznie poprawiać kod):**
1. Czy `givePn`/`receivePn` z `resolveProposalPn` (na bazie `payload.
   giveItems`/`receiveItems`) są liczone konsekwentnie z perspektywy
   PROPONENTA (czyli gdy AI proponuje, `giveItems` = to co AI oddaje) we
   WSZYSTKICH miejscach, które tę parę potem konsumują (`handelFairnessGate`,
   UI "My oferujemy"/"Oni oferują") — czy może gdzieś rola gracza/AI jest
   pomylona (np. bramka liczy próg tak, jakby to zawsze GRACZ był stroną,
   która musi spełnić próg, niezależnie od tego kto faktycznie proponuje).
2. Czy błąd jest w SAMEJ bramce akceptacji (blokuje korzystne dla gracza
   oferty, które powinny przechodzić zawsze), czy w GENEROWANIU propozycji
   AI (AI proponuje sobie niekorzystne umowy, których sama bramka fair-play
   by nie zaakceptowała, gdyby to AI było proszone o zgodę) — to DWIE różne
   możliwe przyczyny z różnymi poprawkami; Operator musi ustalić, która to
   jest, dowodem z żywej reprodukcji (np. test jednostkowy wywołujący
   `evaluateProposal` z payloadem odpowiadającym dokładnie jednemu ze
   zrzutów, oraz/lub prześledzenie funkcji generującej te propozycje AI
   po stronie `main.ts`/`diplomacy-proposals.ts`).
3. Czy wszystkie 4 zrzuty (2 z nich to PAKIETY 2 umów, w tym "Traktat
   handlowy" edytowany przez gracza do 56 PW przy bazie 80 PW — to może
   być OSOBNA, uzasadniona blokada niezwiązana z tym bugiem, bo gracz sam
   zaniżył własną ofertę traktatu) faktycznie demonstrują TEN SAM problem,
   czy dwa różne (jeden: gracz świadomie/nieświadomie zaniżył WŁASNĄ
   pozycję w pakiecie i słusznie zablokowane; drugi: AI samo zaproponowało
   ewidentnie dla siebie niekorzystną "Umowę wymiany surowców" — zrzuty
   Chińczycy/Sumerowie, TYLKO JEDNA pozycja na stole, żadna nie jest
   edytowana przez gracza — to jest najczystszy, najbardziej podejrzany
   przypadek do reprodukcji w pierwszej kolejności).

## GOAL
Ustal PRAWDZIWĄ przyczynę (żywą reprodukcją + śledzeniem kodu, nie
domysłem) tego, że AI potrafi zaproponować graczowi umowę wymiany
surowców/handlową, której WŁASNA bramka uczciwości gry ocenia jako
"nieuczciwą dla partnera" mimo że bilans (wg udokumentowanej w kodzie
konwencji znaku) jest korzystny dla gracza — i napraw tak, żeby:
(a) gracz ZAWSZE mógł zaakceptować ofertę, która wg wewnętrznej miary PW
    jest dla niego neutralna lub korzystna (nigdy nie blokuj `Przyjmij`
    z powodu "nieuczciwości dla partnera", gdy to partner (AI) traci, a
    gracz zyskuje — z zastrzeżeniem punktu (b) tam gdzie to gracz
    świadomie zaniżył WŁASNĄ pozycję pakietu, patrz RECON pkt 3);
(b) JEŻELI faktyczna przyczyna leży w generowaniu propozycji AI (AI
    proponuje sobie niekorzystne umowy przez błąd w formule/rolach
    give/receive), napraw ŹRÓDŁO (generator propozycji AI), nie tylko
    objaw w bramce akceptacji — Operator ma wybrać właściwe miejsce
    naprawy na podstawie dowodu, nie zgadywać.
Zero zmian w bramkach chroniących GRACZA przed nieuczciwymi (dla niego)
ofertami AI ani w bramce chroniącej AI przed rażąco zaniżonymi ofertami
GRACZA (kierunek gracz→AI, `proposerIsPlayer`) — te mają zostać nietknięte.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywa reprodukcja PRZED poprawką (test w `gra/tools/` wywołujący
   realny `evaluateProposal`/pełną ścieżkę `previewNegotiationEntry`, LUB
   żywy scenariusz w grze — Twój wybór, uzasadniony w raporcie): oferta
   AI typu "Umowa wymiany surowców" z bilansem (wg konwencji znaku z
   RECON) korzystnym dla gracza pokazuje `canAccept===false` / `Przyjmij`
   zablokowany — dokładnie odtwarzający jeden z podanych zrzutów
   (Chińczycy albo Sumerowie — pojedyncza pozycja, bez edycji gracza).
2. Zidentyfikowana i w raporcie NAZWANA dokładna linia/funkcja przyczyny
   (nie ogólnikowo "bramka handlu" — konkretne miejsce w kodzie z
   uzasadnieniem dlaczego akurat tam powstaje błąd kierunku/roli).
3. Żywy dowód PO poprawce: TA SAMA sytuacja z kryterium 1 — `canAccept
   === true`, `Przyjmij` odblokowany, gracz może przyjąć ofertę korzystną
   dla siebie.
4. Żywy dowód braku regresu: oferta GRACZA do AI (`proposerIsPlayer`),
   celowo zaniżona poniżej progu uczciwości, NADAL poprawnie zablokowana
   (AI nie da się oszukać) — test na tę samą bramkę z odwróconym
   kierunkiem.
5. Żywy dowód braku regresu: pakiet z jedną pozycją świadomie zaniżoną
   przez GRACZA (jak w zrzutach Harappa — "Traktat handlowy" 56 PW przy
   bazie 80 PW) NADAL poprawnie blokuje CAŁY pakiet (to osobna, zasadna
   ochrona — patrz RECON pkt 3), o ile Operator potwierdzi że to faktycznie
   inny przypadek niż 1-3.
6. Diff ograniczony do plików wskazanych w ALLOWLIŚCIE, zakres zmiany
   dokładnie tak wąski jak wymaga naprawiona przyczyna (nie przepisuj
   całej bramki "na wszelki wypadek").
7. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu
   + istniejące testy dyplomacji/handlu w `gra/tools/` (znajdź je po
   nazwie, np. `*dyplo*`, `*handel*`, `*trade*`, `*negotiation*`) bez
   regresu + nowy/rozszerzony test dowodzący kryteriów 1, 3, 4, 5.

## ALLOWLISTA — nic poza tym
`gra/src/game/diplomacy-proposals.ts`, `gra/src/game/diplomacy-pn-engine.ts`,
`gra/src/ui/diplomacyAcceptanceBalance.ts`, `gra/src/game/diplomacy-
acceptance-points.ts` — WYŁĄCZNIE w zakresie funkcji faktycznie
zaangażowanych w przyczynę (nie edytuj plików z tej listy "na zapas"),
nowy/rozszerzony plik testowy w `gra/tools/`. Jeśli po recon Operator
ustali, że przyczyna leży W INNYM pliku (np. w `main.ts` przy generowaniu
propozycji AI) — STOP, nie edytuj poza allowlistą, zgłoś to jako
DECISION_REQUIRED z dokładnym wskazaniem miejsca, orkiestrator rozszerzy
allowlistę w rundzie 2. Zakazane bezwzględnie: `gra/data/**`,
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-DYPLO-HANDEL-OFERTA-AI-BLOKOWANA-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`,
`gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz naprawiania OBJAWU (np. "po prostu zwróć accepted=true gdy net<0")
bez ustalenia przyczyny w konkretnym miejscu kodu — to złamałoby ochronę
w kierunku gracz→AI, jeśli poprawka nie rozróżni kierunku poprawnie. Zakaz
zakładania z góry, że to bramka akceptacji a nie generator ofert AI —
sprawdź OBA, dowodem. Zakaz uznania kryterium 1/3 za spełnione bez
realnego wywołania kodu produkcyjnego (nie ręcznie policzonych liczb w
raporcie) — uruchom faktyczną funkcję/ścieżkę i pokaż wynik.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator (Sonnet 5) → Evaluator (Sonnet 5, zarzuty, lista może być pusta) →
Operator (Obrona, Sonnet 5, tylko gdy zarzuty niepuste) → Final Control
(Sonnet 5, osobne wywołanie Workflow) → orkiestrator integruje
allowlist-only i cutuje kolejną FALĘ ROBOCZA.
