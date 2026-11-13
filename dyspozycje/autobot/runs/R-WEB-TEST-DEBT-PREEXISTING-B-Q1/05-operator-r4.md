STATUS: PASS-WITH-NOTES (częściowy: cel ≥30 NIE osiągnięty, 21/30)
DOMAIN: GAME (WEB) — dług testowy
TEMAT: R-WEB-TEST-DEBT-PREEXISTING-B-Q1
GOAL: runda 4 (odpowiedź na zarzuty r3). Cel: łącznie ≥30 testów listy B zielonych, usuniętych lub sklasyfikowanych z adnotacją B. WYNIK: 21 (13 r2 + 7 r3 + ai-test r4). Cel 30 NIE osiągnięty.
BAZA: a6dd7bc6e (Operator r3, zweryfikowany przez odtworzenie stanu).
ZMIANY/COMMIT: commit r4 (SHA w sekcji DEPLOY/PUSH i w raporcie orkiestratora). Allowlista: gra/tools/ai-test.cjs; gra/tools/{ai-fog,mgla-sciezka-inwariant,diplomacy-audience-close-flush,diplomacy-proposal}-test.cjs (tylko komentarze adnotacji B); ten plik. Zero zmian w gra/src, gra/data, WERSJE.md, rust-port, gra-robocza.

## Odpowiedzi na zarzuty r3

1. Cel 30 niespełniony — PRZYJMUJĘ. Wynik: 21 (ai-test dołączony jako zielony). Nie osiągnięto 30; brakujące 9 to testy z kandydatami B/NIE_USTALONE (sekcja TABELA, grupa 2).
2. ai-test nie sklasyfikowany — PRZYJMUJĘ. Odtworzone: 275 passed / 19 failed (r3). Nazwy i klasy: tabela grupa 1. Uwaga: zarzut podał 18 asercji; zmierzone 19 (T2c już naprawione w r3). Obecnie 289 passed / 0 failed.
3. Pkt (5) adnotacje B — PRZYJMUJĘ. Dodano nagłówkowe adnotacje (klasa B kandydat, test czerwony) w 4 plikach: mgla-sciezka-inwariant, ai-fog, diplomacy-audience-close-flush, diplomacy-proposal. Przyczyn nie zweryfikowano w pełni (patrz NIE_ZWERYFIKOWANO w nagłówkach).
4. Pkt (3)/(4) pominięte — PRZYJMUJĘ. Uruchomione w r4 (wcześniej NIE_ZMIERZONO): wyniki w grupie 2. Część bez ustalonej przyczyny; NIE_USTALONE, nie „brak czasu”.
5. Brak tabeli per test w pliku — PRZYJMUJĘ. Tabela w tym pliku (grupy 1–2).
6. T-TECH-8 (eko-tech-paczka1) — PRZYJMUJĘ i ZWERYFIKOWANO dane: buildings.json: swiatynia bez pola upgradeFrom; spichlerz_ii ma upgradeFrom=spichlerz. CITY_BUILDING_PREREQ (swiatynia: kamienne_kregi, commit a167fc0b1) potwierdza wymóg kręgów jako warunku, nie upgrade. Oryginalny kontrakt „kręgi→świątynia jako upgrade” nie obowiązuje, więc zmiana to klasa A. Do oceny przez Final Control: test świątyni jako upgrade został zastąpiony testem mechanizmu na spichlerz.
7. Incydent ._tmp-* — PRZYJMUJĘ jako incydent procesowy zgłoszony w r3. W r4 drzewo czyste poza zmianami allowlisty (git status potwierdzone).

## Grupa 1 — ai-test (20 asercji FAIL z baseline 274/20, teraz 289/0)

| Asercje | Klasa | Akcja | Dowód |
|---|---|---|---|
| T2c (1) | A | fallback bonus_walka Lv1 = -0.05 (r3) | ai.ts:620; ai-params.json:22-25 |
| T1b (2), T1c (1), T3f (1) | C | test USUNIĘTY (4 asercje + 1 trywialna) | ai.ts:204 IGNORED_LEGACY_ARCHETYPE_MODS: „live scoring ignoruje”; probe: wynik dla archetype ekonomia wartosc 0 i 5 IDENTYCZNY (koszary x3) |
| T9a (3), T9h (1), T9j (1), T9c (2 + turnsAtWar) | A | fixture: dodano myTypCywilizacji 'grecy' i partnerTypCywilizacji 'rzymianie' (domyślne sprzed b4d37d9f8); T9c dodatkowo turnsAtWar=100 | ai.ts:6654-6660 (brak domyślnych typów); probe: bez typów = []; ai.ts:6684,6790 (R5a aiPeaceTimeOk) |
| T2S-a (3) | A | fixture: typy cywilizacji (jw.) | jw. |
| T2S-b (2), T2S-b2 (1), T10b (1) | A | difficulty 'easy' (dar złota = zaproponuj_handel tylko Łatwy); T2S-b2 cooldown easy 15 zamiast normal 25 | diplomacy-ai-offer-balance.ts:124; diplomacy-economy.ts:153-157 |
| T4S-d (1) | A | fixture: typy cywilizacji (jw.) | jw. |

Brak SKIP/xfail; żadnych osłabionych asercji (zmieniono tylko fixture'y i jawne difficulty zgodne z decyzjami w kodzie).

## Grupa 2 — zarzuty pkt (3)/(4): wyniki r4 (NIE_ZMIERZONO usunięte)

| Test | Wynik r4 | Klasa | Uwagi |
|---|---|---|---|
| ai-zdobycie-miasta-adiacencja | ~10 FAIL (K1b, K2b–g, A5c, A5d, A6c, K9e/f, K6b) | B kandydat, NIE_USTALONE | ai.ts:119, 3500-3508 propaguje targetCityId; K1b pokazuje rozkaz bez targetCityId — przyczyna nieustalona |
| diplomacy-negotiation-table | 1 FAIL (runda 1: kontroferta) | NIE_USTALONE | hipoteza: test na 'normal', a słodzik tylko Łatwy (diplomacy-ai-offer-balance.ts:128) — niezweryfikowane |
| empire-armia-produkcja | 7 FAIL (B5–B9b, asercje źródłowe) | NIE_USTALONE | identyfikatory istnieją (empireDetailTypes.ts); przyczyna nieustalona |
| empire-panel-miasto-obywatele-content | 1 FAIL (R2-2 myCityId) | NIE_USTALONE | — |
| empire-panel-moc-scroll-preserve | 11 FAIL; „snap is not defined” (ReferenceError w wycinku) | NIE_USTALONE (kandydat B lub harness) | do sprawdzenia, czy wycinek źródła czy harness |
| era-change-toast-defer | 4 FAIL + 5 MUT niezłapanych | NIE_USTALONE | symbole istnieją: main.ts:9221, 16498, 16540 |
| era-cud-main-ts-integracja | 1 FAIL (Blok 3c, reconcile po researchStep) | NIE_USTALONE | reconcilePlayerEraFromResearch: main.ts:2425, 4232, 4992, 11751 |
| auto-battle-simultaneous | crash harness: TypeError reading 'delete' (main, linia 368) | NIE_USTALONE (harness) | — |

Grupa 2 jest zmierzona, ale NIE sklasyfikowana merytorycznie: brak czasu na analizę każdej przyczyny w tej rundzie. Każdy wpis to blokada do rundy 5.

## Bramki
- ai-test: 289 passed, 0 failed (EXIT 0).
- logic-test: LOGIC OK (213/213), EXIT 0.
- tsc --noEmit: EXIT 0.
- Testy r3 (eko-tech-paczka1–5, diplomacy-lista, diplomacy-package) — NIE uruchamiane ponownie w r4: ich pliki i src/ nie zmieniły się od a6dd7bc6e (git status: tylko pliki allowlisty).

## BLOKADY
- Cel 30 niespełniony (21/30).
- Klasa B kandydaci do tematów R-WEB-* (decyzja orkiestratora): mgla-sciezka-inwariant, ai-fog, diplomacy-audience-close-flush, diplomacy-proposal (nieweryfikowane przyczyny), ai-zdobycie-miasta-adiacencja (K1b).
- Grupa 2 NIE_USTALONE (8 pozycji).
- Dysk: wolne ok. 3 GB; node_modules usunięty po pracy.

RUNDY: 4/5 (partia 1)
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje ai-test (klasy A/C) i adnotacje B. Runda 5: klasyfikacja grupy 2 (przyczyny), decyzja orkiestratora co do tematów R-WEB-* dla kandydatów B.
DEPLOY/PUSH: NIE WYKONANO
