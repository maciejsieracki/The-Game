# R-WEB-DOCS-DIPLO-LEGACY-EVENTS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-DOCS-DIPLO-LEGACY-EVENTS-Q1
GOAL: dokumentacja poza encyklopedią nie wymienia już usuniętych zdarzeń dyplomacji (`wspolna_religia`, `ultimatum_spelnione`) ani starych liczb (kara za sąsiedztwo −2/−3/−4, religia ±0,5 na Zaufanie, „Wrogi" jako relacja <30). ZERO zmian kodu.
BAZA: origin/main d4d261e3b (HEAD worktree = d4d261e3b, detached).

## Zastrzeżenia do wejścia

- Dodatek orkiestratora `00-dispatch-DODATEK-claude.md` NIE istnieje ani na `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, ani na `origin/main`. Użyto `00-dispatch.md` z gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (GOAL, ALLOWLISTA, ZAKAZ, Kryteria są w nim kompletne). Plik `00-dispatch.md` NIE istnieje na `origin/main` (wbrew wskazaniu w zleceniu); nie kopiowano go do tego commita.
- Zlecenie wskazuje do commita wyłącznie plik raportu, ale bez zmian w czterech plikach dokumentacji nie ma czego integrować. Zacommitowano więc 4 pliki doc (wymienione niżej) plus raport, wszystkie ścieżkami jawnie (bez `git add -A`).

## ZMIANY-COMMIT

Zmienione pliki (wszystkie w allowliście; `git diff --name-only` = 4 pliki + raport):

1. `Dyplomacja/Dyplomacja-zasady.md`
   - tabela modyfikatorów §3.2: religia wspólna/odmienna → 0 (było +0,5 max +15 / −0,5 max −10); ekspansja przy granicy −2 → −3/−4/−5 wg epoki pary.
   - tabela zdarzeń §3.3: usunięte wiersze `ultimatum_spelnione` i `wspolna_religia (seed)`.
2. `Dyplomacja/Dyplomacja-DOKUMENTACJA-DEV.md`
   - parametry: `wspolnaReligia_zaufanie_perTura` 0,5 → 0; `odmiennaReligia_zaufanie_perTura` −0,5 → 0; `ekspansjaGranica_zaufanie_perTura` −2 → −3 (+ Brąz −4, Żelazo −5); usunięte wiersze `ultimatum_spelnione` i `wspolna_religia (seed)`; wiersz „Civ MAPA” `ekspansjaGranica (−2)` → (−3/−4/−5 wg epoki).
3. `Civ-CYWILIZACJE/DOKUMENTACJA-DEV-CYWILIZACJE.md`
   - tabela tierów relacji: „Wrogi" = Zaufanie <10 (nie score <30); Neutralny = Zaufanie ≥10 i score <60; Przyjazny = score [60,130); Sojusz = score ≥130 lub status sojusz.
   - usunięte wiersze `wspolna_religia` i `ultimatum_spelnione`; ekspansja −2 → −3/−4/−5; religia ±0,5 → 0; tabela flag `wspolnaReligia`/`odmiennaReligia`/`ekspansjaPrzyGranicy` zaktualizowana.
4. `Dyplomacja/Dyplomacja-szablon.md`
   - wiersze „Wspólna religia” / „Odmienna religia” → 0 (bez wpływu na Zaufanie); „Bliskość granic” −2 → −3/−4/−5 wg epoki.

Źródła kontrolne (odczyt, nie zmiana):
- `gra/src/game/diplomacy.ts:160` `odmiennaReligia_zaufanie_perTura: 0`; `:162-166` `ekspansjaGranica_zaufanie_perTura: -3`, `ekspansjaGranicaBraz_…: -4`, `ekspansjaGranicaZelazo_…: -5`; `:608-610` wybór wartości wg epoki pary; `:1534` `RELATION_TIER_PROG_WROGI_ZAUFANIE = 10`; `:1551-1560` `relationTier` (Wojna/Sojusz nadrzędne, Wrogi = Zaufanie <10, Neutralny score <60, Przyjazny score <130, Sojusz score ≥130).
- `gra/data/diplomacy.json:26-30` (religia 0, granica −3/−4/−5); `:33` `urazyHistoryczne_zaufanie_perTura: -2` (bez zmiany dokumentacji — zgodne z kodem).
- Brak w kodzie `ultimatum_spelnione` i `wspolna_religia` w `gra/src/game/diplomacy.ts` oraz w `gra/data/diplomacy.json`.

## TESTY

- Bramki kodu: NIE_DOTYCZY (brak zmian w `gra/`). `npm run build/dev` nie uruchamiano (zakaz). tsc nie wymagany.
- `git diff --check`: CZYSTO (wynik: brak ostrzeżeń).
- `git diff --stat`: 4 pliki, 20 wstawień, 26 usunięć.
- Ponowny grep po allowliście (`*.md` poza `gra/`, `docs/encyklopedia`, `dyspozycje/`, `docs/archiwum`): `wspolna_religia|ultimatum_spelnione` = 0 trafień. Tier „score < 30”/„Wrogi(15..30)” = 0 trafień w tych plikach.

## BLOKADY

Brak blokad dla zakresu allowlisty. Poza zakresem (patrz UWAGI-DLA-ORKIESTRATORA).

## RUNDY

1/5

## UWAGI-DLA-ORKIESTRATORA

1. Pliki w `gra/` (zakaz tematu), zawierające nadal martwe nazwy zdarzeń: `gra/tools/.dip-bundle2.cjs` (plik generowany — tylko wylistowany), `gra/tools/diplo-json-descriptions-sync-test.cjs`, `gra/tools/diplomacy-test.cjs`. Testy mogą wymagać osobnej decyzji (sprawdzić, czy asertują obecność starych nazw). Nie dotykano.
2. Poza allowlistą, do decyzji orkiestratora (nie zmieniano):
   - `docs/analiza/06-DYPLOMACJA-SPOLECZENSTWO.md:23` — progi tierów „Wrogi(15..30)”, „Neutralny(30..60)” (stan sprzed zmiany tierów);
   - `docs/analiza/06-DYSPOZYCJE-stan.md:31` — „Wrogi<30/Neutralny<60”;
   - `docs/analiza/05-AI-CYWILIZACJE-DANE.md:56` — progi `<15/<30/<60/<120/>=120`;
   - `Civ-CYWILIZACJE/_archiwum/PROPOZYCJA-dyplomacja-AI-v0.1.md:128-130` — historyczna propozycja (religia ±0,5, ekspansja −2): archiwum, zostawiono;
   - `docs/archiwum/dyspozycje/CYWILIZACJE-DO-MASTERA.md:169` — archiwum, zostawiono.
3. `Dyplomacja/Dyplomacja-szablon.md` (wiersz „Spełnienie ultimatum: −5 Relacja ogólna”) — to inna księga (Relacja, nie Zaufanie) i nie ma w nim nazwy `ultimatum_spelnione`; nie zmieniano. Wymaga osobnej decyzji, czy liczba −5 Relacji nadal obowiązuje (dispatch: „−5 Relacja u adresata” jest na liście nierozstrzygniętych z W51 / #354).
4. Limit „max −20” przy karze za granicę (`Dyplomacja-szablon.md`, wiersz „Bliskość granic”) NIE ZWERYFIKOWANY: w `gra/src/game/diplomacy.ts` (okolice :985-992 i :1819) nie znaleziono clampu −20. Zostawiono z adnotacją „limit do weryfikacji w kodzie”.
5. Niespójność terminów zmęczenia wojną (do wyjaśnienia przez właściciela, patrz sekcja poniżej): `war-weariness-params.json` używa pełnego zmęczenia po 200 turach, a warunek pokoju AI w `diplomacy.ts:1361-1371` oraz `diplomacy-war-peace-params.json` (T ≤ 20) używa 20 tur. Dokumentacja nie opisuje, który wpływ dotyczy której decyzji.

## Wyjaśnienie: jak działa zmęczenie wojną (prośba z wiadomości użytkownika, wykonana z kodu)

Są dwa niezależne mechanizmy, oba w kodzie; nie są ze sobą zsynchronizowane.

A) Zmęczenie pary — `gra/data/war-weariness-params.json`, `gra/src/game/war-weariness.ts` (R-WEB-AI-WAR-WEARINESS-PEACE-Q1, LIVE-AUDIT-Q1):
- poziom = min(1, turyWojny / 200) + 0,03 × (utracone miasta obu stron) + stagnacja (0,3 × clamp((tury bez zmiany miast − 30)/100, 0, 1)); zapamiętywany szczyt (nie spada).
- progChetnosci = 0,5: powyżej tego poziomu przegrywający chętniej składa ofertę.
- Przegrywający (wyraźnie słabszy, udział < 0,45): desperacja = 0,5·poziom + 0,5·luka siły + 0,3·straty (nasycenie 3). Stopnie oferty: 1 (złoto + surowce), 2 (+ 1 miasto), 3 (+ do 2 miast). Progi 0,25 / 0,45 / 0,65.
- Ofertę przegrywający składa od tury wojny 8 (od tury 25, jeśli nie stracił żadnego miasta).
- Ochrona przed snowballem: przegrywający z ≤3 miastami (po utracie) lub z ≥3 utratami w tej wojnie — zwycięzca MUSI przyjąć ofertę.
- Rabat ceny: cena pokoju żądana od gracza spada z poziomem zmęczenia o do 60 %.
- Wyjście awaryjne: szczyt ≥ 0,8 i ≥ 3 odrzucone oferty → wygrywający przyjmuje to, co przegrywający może zapłacić.

B) Chęć pokoju AI — `gra/src/game/diplomacy.ts:1358-1371` oraz `gra/src/game/diplomacy-war-peace-profile.ts:213-225` (`warWearinessShare`), parametry `diplomacy-war-peace-params.json` (`zmeczenie`):
- udział zmęczenia = 0,5 × min(1, tury wojny / T), gdzie T = min(20, 15 + agresywność AI) (pełne zmęczenie najpóźniej po 20 turach).
- waga pokoju AI (peaceW) = clamp(zmęczenie + presja wojskowa + dobra wola), gdzie presja = 0,4 × (1 − stosunek siły), gdy stosunek < 1, a dobra wola = 0,2 × zaufanie/100.
- AI proponuje pokój przy ułamku zmęczenia ≥ 0,4 (`sygnalyPokoju.e`), i tylko gdy sama przyjęłaby pokój od gracza.

Co zmęczenie wpływa, w skrócie: (1) kiedy AI i przegrywający chcą pokoju (czas, straty miast, stagnacja, siła); (2) ile przegrywający oferuje (stopnie złoto → miasta); (3) ile wygrywający żąda (rabat do 60 %); (4) kiedy wygrywający musi przyjąć ofertę (ochrona przed snowballem, wyczerpanie). Efektem jest pokój zamiast eliminacji jednej strony.

Otwarte: próg końca zmęczenia 0,8 jest do potwierdzenia przez właściciela (task #361); dwa różne horyzonty czasu (200 vs 20 tur) wymagają decyzji, który jest wiążący w dokumentacji.

## NASTĘPNY KROK

Orkiestrator: integracja commita z dokumentacją (Final Control Sonnet: diff 4 plików vs allowlista, grep = 0). Decyzje z UWAG 1–5 poza tym tematem.

DEPLOY/PUSH: NIE WYKONANO
