TEMAT: P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA
RUNDA: 2/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/ui/diplomacyAcceptanceBalance.ts (canAccept/balancePanelDataFromRows),
gra/src/game/diplomacy-proposals.ts (evaluateProposal, AI-autorskie propozycje),
gra/src/game/diplomacy-pn-engine.ts jeśli recon wskaże (nie zakładaj z góry)
MODEL+EFFORT: claude-sonnet-5, effort high (porządny audyt logiki, nie punktowa łatka —
wyraźne żądanie właściciela)

WYZWALACZ (dosłownie od właściciela, DWA zrzuty ekranu w PRZECIWNYCH kierunkach + wcześniejsza
wypowiedź wiążąca)
1. "Moim zdaniem coś nie tak jest z bilansem tych umów [...] nawet przy ujemnym bilansie jest
   możliwość podpisania umowy [...] nie powinno być możliwości przyjęcia oferty, której bilans
   jest ujemny [...] Można zaakceptować tylko taki deal, który jest co najmniej na zero lub na
   plusie [...] Tak samo cywilizacje AI powinny proponować deale, które są na zero lub na
   plusie, a nie na ujemnym [...] Trzeba to dokładnie przeliczyć i zrobić porządny audyt, co z
   czego wynika, jak to się liczy i dlaczego liczy się to wiecznie źle." (zrzut: Stół negocjacji
   z Chińczykami, bilans −51, zielone "Możesz przyjąć", aktywny Przyjmij)
2. "Kolejne niezrozumiałe sytuacje, bilans netto plus 123, a nie mogę przyjąć oferty. Co się
   nie tak z tym balansem i z tym wyliczaniem? To jest mega dziwne." (zrzut: pakiet 3 umów —
   Traktat handlowy + Traktat przemarszu + kontroferta Umowa wymiany surowców, "Kontroferta
   2/3", BILANS (NETTO) = +123, czerwone "Nie można przyjąć — warunki niespełnione")

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji)
- Runda 1 (zintegrowana, `3ca7c600`) naprawiła WYŁĄCZNIE etykietę "Bilans (Oni)"/"(netto)"
  zależną od kolejności wierszy — realny mechanizm `net`/`canAccept` NIE był ruszany.
- Mechanizm dokładnie zlokalizowany, `gra/src/ui/diplomacyAcceptanceBalance.ts`,
  `balancePanelDataFromRows` (linie 229-392):
  - `canAccept = blockReason == null` (linia 340), gdzie `blockReason` ustawiane per wiersz
    z `row.responderPreview.accepted === false` (linia 322-325) — TYLKO dla wierszy
    "actionable" (`direction==='incoming'` lub `own && awaitingAiResponse`, linia 317-318).
    `responderPreview` pochodzi z `evaluateProposal` (silnik), to JEDYNE źródło prawdy realnie
    używane przy wykonaniu (main.ts `handleNegotiationAcceptPackage` → `previewNegotiationEntry`
    → ta sama `evaluateProposal`).
  - Wyświetlany "Bilans" (`net`, linia 339) = `unifiedPwBalance` GDY wszystkie wiersze
    "actionable" mają numeryczny `responderPreview.pwBalance` (`allActionableHavePwBalance`,
    linia 264,330-332) — `unifiedPwBalance` to MIN z `pwBalance` po wszystkich wierszach
    (linia 262-337, komentarz "RUNDA 2 (N4)" w KODZIE, osobna wcześniejsza runda, nie mylić z
    tą rundą 2 dyspozycji). GDY choć jeden wiersz NIE MA numerycznego `pwBalance` (np. traktat
    bez bramki PW — pakt/sojusz/przemarsz bez koszyka), `net` PRZEŁĄCZA SIĘ na surowe
    `myOfferPn - theirOfferPn` (suma wartości PW zaoferowanych obu stron, linia 339) —
    CAŁKOWICIE OSOBNA formuła, niepowiązana z tym, co faktycznie bramkuje `canAccept`.
  - **To jest udokumentowany w kodzie, ale NIGDY nie naprawiony punkt rozjazdu**: gdy pakiet
    zawiera WIERSZ TRAKTATOWY BEZ WŁASNEJ BRAMKI PW (np. Traktat przemarszu — `evaluateProposal`
    case 'granice' w `diplomacy-proposals.ts:1457-1506` NIE zwraca `pwBalance` w ogóle, tylko
    `accepted`/`reason` na podstawie progów Relacja/Zaufanie/Respekt), wyświetlany "Bilans"
    przełącza się na surowy `myOfferPn - theirOfferPn` (suma OFEROWANYCH wartości, nie próg
    akceptacji), podczas gdy `canAccept` nadal poprawnie zależy od `responderPreview.accepted`
    TEGO KONKRETNEGO wiersza (Relacja/Zaufanie/Respekt, zupełnie inna skala niż PW). Rezultat:
    liczba widoczna graczowi i rzeczywista bramka mogą wskazywać w przeciwne strony — DOKŁADNIE
    oba zrzuty właściciela pasują do tego mechanizmu (przypadek 2 ma w pakiecie "Traktat
    przemarszu", czyli dokładnie ten rodzaj wiersza bez `pwBalance`).
- Trzecie, DODATKOWE źródło rozjazdu warte sprawdzenia empirycznie: temat równoległy
  `P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1` (ten sam dispatch-cykl, osobny worktree) właśnie
  naprawia brak blokady "już zawarty" dla Traktatu przemarszu — jeśli zrzut 2 właściciela
  zawierał traktat przemarszu, który BYŁ JUŻ AKTYWNY, `evaluateProposal` mógł go odrzucić z
  zupełnie innego powodu niż PW (np. duplikat) — do potwierdzenia/wykluczenia reconem w tej
  rundzie, nie zakładać bez dowodu.
- Właściciel dodatkowo zgłosił (dołączone do tej rundy, nie osobny temat): opłata za wariant
  Traktatu przemarszu (`feeC`/`feeM`, 20/40 ¤) jest dziś STAŁA, wpisana w sam traktat,
  nieedytowalna w formularzu — jedyny sposób zbalansowania kosztu to dodanie OSOBNEJ pozycji
  (np. "Umowa wymiany surowców") do tego samego pakietu na stole negocjacji. To już
  architektonicznie działa (wielopozycyjny koszyk istnieje), ale trzeba potwierdzić, że po
  dodaniu takiej drugiej pozycji panel poprawnie AGREGUJE oba wiersze w jedną spójną liczbę
  (patrz mechanizm `unifiedPwBalance`/fallback wyżej) — nie zakładać, sprawdzić żywym testem.

GOAL
1. **Diagnoza z dowodem, PRZED jakąkolwiek poprawką**: odtworzyć OBA zrzuty właściciela żywym
   testem (Playwright/Chromium lub deterministyczny test jednostkowy na tej samej strukturze
   danych co silnik), z jawnym wypisaniem: `myOfferPn`, `theirOfferPn`, `unifiedPwBalance`,
   `allActionableHavePwBalance`, `canAccept`, `blockReason`, oraz PER WIERSZ:
   `responderPreview.accepted`, `responderPreview.pwBalance` (jeśli jest), `responderPreview.reason`.
   Zidentyfikować DOKŁADNIE, który wiersz w każdym z dwóch przypadków jest źródłem rozjazdu.
2. **Naprawa strukturalna, nie łatka jednego przypadku**: wyświetlany "Bilans" i `canAccept`
   MUSZĄ być wyprowadzone z tej samej, spójnej logiki. Rekomendowany kierunek (do potwierdzenia/
   skorygowania przez Operatora na podstawie diagnozy z pkt 1, nie sztywna instrukcja):
   - Gdy KTÓRYKOLWIEK wiersz nie ma numerycznego `pwBalance`, panel NIE MOŻE pokazywać liczby,
     która sugeruje spełnienie/niespełnienie progu PW dla całego pakietu w oderwaniu od
     realnego stanu tego wiersza — albo (a) taki wiersz musi też dawać porównywalną liczbę PW
     (rozszerzyć `evaluateProposal` o `pwBalance` nawet dla traktatów bez koszyka — 0 gdy
     `accepted`, ujemna umowna wartość gdy nie), albo (b) panel musi jawnie oznaczyć, że
     wyświetlana liczba NIE jest pełną bramką, i osobno pokazać `blockReason` per-wiersz w
     sposób widoczny (nie tylko generyczne "warunki niespełnione").
3. **Wiążąca reguła właściciela wprost w kodzie**: `canAccept` MUSI być fałszywe zawsze, gdy
   POPRAWNIE POLICZONY bilans dla gracza jest ujemny — nie tylko gdy `responderPreview.accepted`
   jest fałszywe z innego powodu. Jeśli dziś istnieje ścieżka, gdzie `net < 0` a `canAccept ===
   true` (przypadek 1, do potwierdzenia reconem), to jest TWARDY błąd do naprawienia w tej
   rundzie.
4. **AI-autorskie propozycje** (`diplomacy-proposals.ts`, funkcje generujące oferty AI — znajdź
   reconem, np. `buildAiCounterOffer`/`generateAiProposal` czy podobne) NIE MOGĄ proponować
   pakietów o ujemnym dla GRACZA bilansie (tej samej, poprawionej metryki z pkt 2) — sprawdź czy
   dziś istnieje jakikolwiek gate na to PRZED wysłaniem propozycji do gracza; jeśli nie, dodaj.
5. Traktat przemarszu z fixed fee (`feeC`/`feeM`) w pakiecie z osobną umową wymiany surowców —
   potwierdzić żywym testem, że po naprawie z pkt 2 łączny bilans pakietu poprawnie odzwierciedla
   OBA składniki (opłatę traktatu + wartość wymienianych surowców), a `canAccept` zgadza się z tą
   liczbą.
6. Zero zmian w progach dyplomatycznych (Relacja/Zaufanie/Respekt) ani w regułach osobnych
   traktatów (poza tym, co ściśle wymaga pkt 2/4 — np. dodanie pola `pwBalance` do zwracanego
   obiektu `evaluateProposal` dla case 'granice' BEZ zmiany warunków accepted/reason).

KRYTERIA KOŃCA (binarne)
1. Test (jednostkowy lub Playwright) odtwarzający strukturę danych ZRZUTU 1 (Chińczycy, bilans
   ujemny) pokazuje PRZED naprawą: `canAccept===true` mimo poprawnie policzonego ujemnego
   bilansu; PO naprawie: `canAccept===false` I przycisk Przyjmij faktycznie zablokowany w UI.
2. Test odtwarzający strukturę danych ZRZUTU 2 (pakiet 3 pozycji, bilans dodatni, zablokowane)
   pokazuje PRZED naprawą: wyświetlany "Bilans" dodatni mimo `canAccept===false`; PO naprawie —
   ALBO wyświetlany bilans i `canAccept` są spójne (oba wskazują to samo), ALBO — jeśli realny
   powód blokady jest NIE-PW (np. próg Respektu/Relacji jednego z traktatów) — panel jawnie
   pokazuje TEN powód obok liczby PW, zamiast zostawiać samą sprzeczną liczbę bez wyjaśnienia.
3. Nowy test: pakiet AI-autorski (AI proponuje graczowi) z celowo ujemnym dla gracza bilansem —
   silnik ODRZUCA/nie generuje takiej propozycji (albo koryguje ją do ≥0) PRZED wysłaniem do
   gracza.
4. Zero regresji na wszystkich istniejących testach panelu bilansu/negocjacji/dyplomacji
   (dyplo-bilans-gate-n-e1-reprodukcja-test.cjs z rundy 1 + inne diplomacy-*-test.cjs w
   gra/tools/ — znajdź reconem pełną listę, wszystkie muszą pozostać zielone).
5. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/ui/diplomacyAcceptanceBalance.ts
- gra/src/game/diplomacy-proposals.ts — WYŁĄCZNIE `evaluateProposal` (dodanie `pwBalance` gdzie
  brakuje, BEZ zmiany warunków accepted/reason) i funkcja(e) generujące propozycje AI (gate na
  ujemny bilans).
- gra/src/game/diplomacy-pn-engine.ts — WYŁĄCZNIE jeśli recon jednoznacznie wykaże konieczność,
  z uzasadnieniem w raporcie.
- Nowe lub rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**, dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana progów dyplomatycznych
(Relacja/Zaufanie/Respekt), zmiana warunków accepted/reason w `evaluateProposal` poza dodaniem
pola `pwBalance` (czyli: KOGO silnik akceptuje/odrzuca się NIE zmienia, zmienia się WYŁĄCZNIE
spójność między tym a wyświetlaną liczbą + gate na AI-propozycje).

IZOLACJA
worktree /home/user/wt-dyplo-bilans-gate (istniejący, zresetowany do najnowszego origin/main
przez orkiestratora przed tą rundą), gałąź autobot/P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA,
baza jawnie: origin/main (commit de41ebd5 lub nowszy jeśli main ruszył w międzyczasie).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-dyplo-bilans-r2 --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania KTÓREGOKOLWIEK kryterium końca za spełnione na podstawie samego czytania kodu —
wymagany żywy test z jawnym wypisaniem wartości pośrednich (myOfferPn/theirOfferPn/
unifiedPwBalance/allActionableHavePwBalance/canAccept/blockReason/per-wiersz responderPreview)
PRZED i PO poprawce, na strukturze danych odpowiadającej OBU zrzutom właściciela osobno — nie
wolno uznać jednego naprawionego przypadku za dowód naprawy drugiego, to są DWA RÓŻNE kierunki
błędu na tym samym mechanizmie. Zakaz redukowania GOAL 4 (gate na AI-propozycje) do samego
stwierdzenia "AI już tego nie robi" bez konkretnego testu wymuszającego scenariusz, w którym
AI HISTORYCZNIE mogłoby zaproponować ujemny dla gracza pakiet.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i integracja
(allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora, ręką orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
