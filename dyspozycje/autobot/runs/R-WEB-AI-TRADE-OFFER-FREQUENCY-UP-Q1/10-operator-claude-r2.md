# R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1 — Operator, runda 2/5 (raport)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (oferty handlowe AI→gracz; pomiar w pełnej grze)
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1
GOAL: w scenariuszu „prepared” z ekonomią gracza (3 ziarna × 150 tur) oferty AI→gracz 3–6 na 100 tur, bez spamu.
BAZA: origin/main 359d2df9c (FALA 713). Pierwsza runda (63cb4e12b) zakończyła się decyzją o rozszerzeniu pomiaru; ta runda wykonuje OPCJĘ A (scenariusz z ekonomią) i OPCJĘ D (cooldown 15→5).

## WYNIK (liczby z surowych JSON, nie z pamięci)

Scenariusz: `MEAS_ARM=prepared MEAS_ECON=1 MEAS_REL=80 MEAS_TURNS=150`, ziarna 1111/2222/3333, tryb przyspieszony, realny endTurn.
ECON = zapasy surowców gracza ustawione hakiem `setStock` (parzyste klucze 400 = nadwyżka, nieparzyste 0), to symulacja STANU, nie produkcji. Relacja przypięta na 80 (jedna wartość; wg dispatchu relacja nie mnożona).

| wariant | ziarno 1111 | ziarno 2222 | ziarno 3333 | razem | ofert /100 tur |
|---|---|---|---|---|---|
| baza (cooldown 15) | 0 | 0 | 1 (tura 21, sol→glina, „Przyjmij” aktywne) | 1 / 450 tur | **0,22** |
| cooldown 5 (D) | 0 | 0 | 1 (ta sama tura 21) | 1 / 450 tur | **0,22** |

Cel 3–6 /100 tur NIE osiągnięty. Cooldown 15→5 nie zmienił wyniku (w 3333 jedyna oferta była przed pierwszym cooldownem).
Dla porównania r4 (scenariusz bez ekonomii, bez obsługi bramki NNS) dawał 0,89; wynik sprzed obsługi NNS nie jest porównywalny (patrz „Narzędzie”).

Surowe pliki: `evidence/base-econ-cd15/cell-s<ziarno>-r80.json`, `evidence/cd5/cell-s<ziarno>-r80.json`, podsumowania `summary.md` w obu katalogach. Każdy JSON zawiera `perTurn`, `offerLog`, `funnel`, `funnelLog`.

## DIAGNOZA — który warunek odcina (dane z lejka, per tura)

Lejek (`funnel` w JSON; zlicza tury BEZ aktywnego cooldownu propozycji):

| ziarno | tury z cooldownem | tury: sonda znalazła parę (`probeBarter`) | tury: brak pary, brak nadwyżki AI | tury: brak pary mimo obu stron | ofert |
|---|---|---|---|---|---|
| 1111 | 0 | 129 | 7 | 14 | 0 |
| 2222 | 0 | 139 | 8 | 3 | 0 |
| 3333 | 15 (baza) / 5 (D) | 119 / 129 | 6 | 10 | 1 |

Wniosek 1. Cooldown NIE jest głównym ogranicznikiem: w 1111 i 2222 cooldown nigdy nie działał, a pary istnieją w 119–139 turach na 150.
Wniosek 2. Brak nadwyżki AI (7–8 tur) i brak uczciwej pary (3–14 tur) to wąskie gardło tylko w ~10% tur.
Wniosek 3 (główny): **pary znalezione przez sondę NIE trafiają na stół**. Instrumentowany przebieg (tymczasowe logi w `main.ts`, cofnięte; dane w `evidence/diag-gt-drop-s1111-cd15.json`): w buforze z ostatnich 30 prób propozycji (tury ~121–150, ziarno 1111, cooldown 15) każda próba doszła do wejścia na stół i została odrzucona przez bramkę `givePn > receivePn` (main.ts, blok `zaproponuj_wymiane_cykliczna`). Przykład: AI daje cegla×20, dostaje ruda_zelaza×10; wycena przy wejściu na stół `givePn=10`, `receivePn=0`.
Przyczyna prawdopodobna (NIE potwierdzona dalszym pomiarem): wycena w ścieżce wejścia na stół (`pnBalanceOpts`, main.ts ~l. 20958) nie dostaje `...proposalPnTurnsMultiplier(payload)` ani `tempoGry`, które są w `pnOpts` wyboru pary (`pickAiPlayerCyclicBarter`, main.ts ~l. 24249). Wybór pary i bramka wejścia liczą więc tę samą ofertę różnymi wycenami. Dowód pośredni: jedna oferta (sol→glina, tura 21) przeszła, więc odcięcie zależy od pozycji.

Lejek ma błąd etykiet w wersji bazowej: bucket „brak deficytu gracza” nie uwzględniał `resourceDeficitKeysForOwner` (używanego przez wybór pary). Naprawione w narzędziu przed serią D (bucket przemianowany na `noCdPairNullBothSides`; w bazie wartości te same tury). Agregat `cdBlockedPairOrProbe` wskazany w dispatchu NIE istnieje w repozytorium (grep: 0 trafień) — NIE_ZMIERZONO jako osobny byt, zastąpiony powyższym lejkiem.

## ZMIANY (commit)

1. `gra/data/ai-params.json` — `propozycja_wymiany_surowcow_cooldown_tur`: **15 → 5** (jedyna zmiana danych; zgodnie z opcją D). Przed: 15. Po: 5. Uwaga: przy cooldownie 5 i limicie 1 aktywnej oferty teoretyczny sufit wynosi 20 ofert /100 tur na AI (przy 15: ~6,7). Zmierzony wynik to 0,22, więc sufit nie jest osiągany — ale decyzję o wartości podejmuje właściciel (łatwe cofnięcie do 15).
2. `gra/tools/measure-ai-trade-offer-frequency.cjs` — narzędzie pomiarowe (nie gra):
   - `MEAS_ECON=1` — zapasy surowców gracza (`setStock`).
   - Lejek per tura (`funnel`, `funnelLog`) — sonda `probeBarter` + `diag` przed endTurn.
   - Obsługa bramki NNS „Zakończ turę” (od tury 11, `NNS_WOLNE_TURY=10`): skrypt dosypuje dodatnie zasoby hakami `grantPlayerGold`/`grantPlayerFood` (licznik `nnsGrants`: 27/23/28). Bez tego każdy przebieg zatrzymywał się w turze 11 (`[EndTurn] blocked: prognoza skarbca/spichlerza < 0 (NNS)`), co wcześniej wyglądało jak wolny endTurn. Ta zmiana wpływa na porównywalność z r4.
   - `MEAS_CD_TURNS` — cooldown używany przez lejek.
3. `gra/tools/ai-trade-offer-frequency-up-test.cjs` (nowy) — 10 asercji: cooldown=5 (ai-params i ai.ts), odstęp 5 tur (`canAiProposeResourceTrade`), limit 1 aktywnej oferty i bramki wojny/kontaktu (źródłowo w main.ts/ai.ts — to sprawdzenie obecności kodu, NIE zachowania w grze).
4. `gra/tools/ai-trade-proposal-branch-test.cjs` — asercje E0–E2 zaktualizowane do cooldownu 5 (dawniej twarde 15; bez tej zmiany test był czerwony po D).
5. `gra/tools/ai-trade-proposal-to-player-test.cjs` — asercja cooldownu zaktualizowana do 5 (j.w.).
6. `evidence/` — surowe JSON-y pomiarów, podsumowania i diagnostyka `diag-gt-drop-s1111-cd15.json`.

NIE zmieniano `gra/src/main.ts` (instrumentacja cofnięta, `git diff` pokazuje brak zmian w grze poza ai-params.json).

## TESTY (surowe wyniki)

- `npx tsc --noEmit` → exit 0.
- Bramki referencyjne: `logic-test` 213/213; `tech-tree-test` 20 pass 0 fail; `research-test` 33/0; `unit-replace-test` 21/21; `combat-test` 6/6; `unit-power-test` 6 pass 0 fail.
- `ai-trade-offer-frequency-up-test.cjs`: 10 pass, 0 fail na zmianie. **Dowód mutacyjny**: z cooldownem 15 (stan bazy) → 3 FAIL (`wartosc = 15`, `AI_TRADE_BARTER_COOLDOWN_TURNS = 15`, „tura 5 po propozycji dozwolona”) → test czerwony na bazie.
- `ai-trade-proposal-branch-test.cjs`: 10 passed, 0 failed (po aktualizacji asercji E0–E2).
- `ai-trade-proposal-to-player-test.cjs`: exit 0 (po aktualizacji asercji).
- `ai-trade-oneshot-overpay-limit-test.cjs`: FAIL — `main.ts enqueue filter calls aiOneshotHandelOverpaysPlayer(converted.actionId, workingCmd.type, balancedPayload, pnBalanceOpts) -> return` (asercja tekstowa). `main.ts` nie zmieniono względem bazy, więc porażka istnieje także na 359d2df9c (NIE spowodowana tą rundą). Nieusuwane w tej rundzie.
- `git diff --check` na zmienionych plikach śledzonych: czysto.
- Pomiar: 6 przebiegów × 150 tur (3 ziarna × 2 warianty), wszystkie `koniec przebiegu`, bez blokad technicznych.

## BLOKADY / DECYZJA WŁAŚCICIELA

GOAL nieosiągnięty bez zmiany wyceny w ścieżce wejścia na stół (dyspozycja: „jeśli nie da się bez zmiany uczciwości — DECISION_REQUIRED”). Opcje:

- **O1 (rekomendowana, wymaga zgody):** wyrównać wycenę wejścia na stół z wyborem pary — dodać do `pnBalanceOpts` (main.ts ~l. 20958) `...proposalPnTurnsMultiplier(balancedPayload)` i `tempoGry` (jak w `pnOpts` ~l. 24249). Bramka `givePn <= receivePn` i uczciwość zostają bez zmian (oferta nadal „na plus”, liczona tą samą wyceną co już przepuszczona przez wybór). Skutek liczbowy NIE zmierzony — wymaga rundy 3 tym samym narzędziem (3 ziarna × 150 tur). Zmienia zachowanie istniejącej bramki, więc wymaga potwierdzenia właściciela.
- **O2:** zostawić cooldown 5 bez O1 — wynik 0,22/100 tur, cel nieosiągnięty; ryzyko spamu praktycznie zerowe, ale bez korzyści.
- **O3:** cofnąć cooldown do 15 (jedna linia w ai-params.json; testy wymagają wtedy powrotu asercji w 3 plikach testów).
- Odrzucone: obniżenie wymagań uczciwości (sprzeczne z decyzją „oferta na plus”).

Ryzyko spamu (wniosek): limit 1 aktywnej oferty na AI jest zachowany; odstęp = cooldown. Maks. teoretyczne 20/100 tur przy cd 5 (6,7 przy cd 15). Zmierzone 0,22/100 tur; przy O1 wynik trzeba zmierzyć przed wdrożeniem.

Dług (do REPIN Rust): `ai-params.json` (cooldown 5) oraz ewentualna zmiana wyceny z O1.

## RUNDY

Runda 2/5 (ta). Kolejna runda (3/5) dopiero po decyzji O1/O2/O3.

## NASTĘPNY KROK

Właściciel wybiera O1/O2/O3. Przy O1: runda 3 — zmiana wyceny w main.ts (allowlista), test parytetu wyceny (wejście na stół = wybór pary dla tego samego payloadu), pomiar 3×150 tur tym samym narzędziem, aktualizacja funnelu. Przy O2/O3: zamknięcie tematu z wynikiem 0,22/100 tur.

## NIE_ZMIERZONO

- Efekt O1 (liczba ofert po zmianie wyceny) — nie zmierzono.
- Przyczyna rozbieżności wycen: wskazana na podstawie jednego instrumentowanego przebiegu (ziarno 1111, ostatnie 30 prób) i porównania wycen z kodu; pełnego rozkładu odrzuceń po ziarnach nie zmierzono.
- Zachowanie gry w scenariuszu bez ECON (r4) po obsłudze NNS — nie powtórzono.
- Bramki „brak technologii handlu / brak kontaktu / wojna / NNS gracza” są sprawdzone tylko źródłowo.

DEPLOY/PUSH: NIE WYKONANO
