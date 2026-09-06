# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — Final Control, runda 1/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1
GOAL: AI wybiera budynki z tego samego źródła co gracz (availableProduction()), punktowane po BuildingDef.grupa, zero zaszytych id budynków jako źródła kandydatów.

## Werdykty (1-7)

1 -> DO DECYZJI CZLOWIEKA (korekta przyjęta i zweryfikowana co do faktów: niezależnie
przeczytałem `ai.ts:1745-1778` i `ai.ts:2105-2152` — 8 dodatkowych literałów
(cegielnia/odlewnia_brazu/odlewnia_zelaza/wielka_odlewnia/stolarnia/garncarnia/
kamieniarski/kuznia), oba miejsca robią `candidates.push({id:<literał>})`. Zgadza się
z odpowiedzią Obrony co do liczby i lokalizacji. Pełna eliminacja wymaga pola w
buildings.json — poza allowlistą, DECISION_REQUIRED #4 zasadny.)
2 -> DO DECYZJI CZLOWIEKA (kryterium 4 nadal niedostarczone; pogłębiłem problem —
patrz Nowe ustalenie niżej. Nie NAPRAW, bo nic w kodzie nie jest do naprawy — brakuje
dowodu, nie poprawności.)
3 -> ODDAL częściowo / DO DECYZJI częściowo (fałszywy odnośnik w komentarzu faktycznie
usunięty — zweryfikowałem `git show de83c098`: diff ai.ts to WYŁĄCZNIE ta zmiana
komentarza, zero logiki. Ślad z proxy-symulacji dostarczony i u mnie się REPRODUKUJE
1:1 tymi samymi 8 budynkami w tej samej kolejności — proxy jest deterministyczny i
wiarygodny w tym zakresie. Priorytet Spichlerza pozostaje DO DECYZJI, patrz niżej.)
4 -> DO DECYZJI CZLOWIEKA (39/42 potwierdzone STATYCZNIE przeze mnie: CITY_BUILDING_PREREQ
ma `fort:'mury'`, `baszta:'mury'`; major AI filtruje `mury` bezwarunkowo z
buildingCandidates (ai.ts:1576-1578) -> fort/baszta nieosiągalne z definicji. 42-3=39,
zgodne z raportem.)
5 -> DO DECYZJI CZLOWIEKA (stan zgodny, teraz część łącznego DECISION_REQUIRED #1 z 13
literałami).
6 -> DO DECYZJI CZLOWIEKA (potwierdzone i POGŁĘBIONE: w mojej niezależnej symulacji 400
tur major AI Spichlerz NIE wchodzi WCALE, nie tylko "później" — patrz Nowe ustalenie.)
7 -> ODDAL wobec zarzutu regresji, DO DECYZJI wobec pokrycia kryterium 9 (przeczytałem
nagłówek `ai-buduje-budynki-test.cjs` — dotyczy `seedCityOwnerDefaults`/auto-manage
(P-AI-NIE-STAWIA-BUDYNKOW-Q1), NIE `chooseCityProduction`; 4× realny `vite build`+
Chromium z konstrukcji — potwierdzam niezależnie, że to ograniczenie infra, nie
regresja tego diffu.)

## Nowe ustalenie (własna symulacja, esbuild + realny buildings.json, bez Vite/Chromium)

Zbudowałem niezależny harness (bundlujący prawdziwy `ai.ts` przez esbuild, wołający
`chooseCityProduction` bezpośrednio z prawdziwym `data/buildings.json`, BEZ
`opts.canAfford`/`opts.isProductionAllowed` — jak proxy Operatora). Major AI (3 miasta,
mid-game, 400 tur): dokładnie te same 8 budynków co w tabeli Obrony, w TEJ SAMEJ
kolejności — potwierdza determinizm i wiarygodność proxy. ALE: po turze 8 AI
**trwale** utyka na `Wojownik`/`Łucznik` (score 270/265) do końca 400 tur — Spichlerz,
Targowisko i 24 inne budynki nigdy nie wchodzą. Przyczyna jest udokumentowana wprost w
komentarzu kalibracyjnym (ai.ts ok. l.1296-1301): warstwy grup są CELOWO kalibrowane
PONIŻEJ nieotłumionego score jednostki w fazie mid-game — funkcja zakłada, że
`opts.canAfford`/ekonomia w realnym silniku przerwie tę rekrutację. Bez realnej
150-turowej symulacji (kryterium 4) NIE WIADOMO, czy AI w prawdziwej grze rzeczywiście
wychodzi z tego platonu, czy koszary+8 budynków to praktyczny sufit — to samo
ograniczenie dotyczy proxy Operatora (też bez canAfford). Wzmacnia to zarzuty #2/#3/#6:
kryterium 4 nie jest formalnością, tylko jedynym sposobem rozstrzygnięcia, czy
39/42 (i priorytet Spichlerza) są osiągalne w praktyce, nie tylko na papierze.
Miasto-państwo (defensiveCopy, ta sama metoda, 400 tur): **42/42**, bez platonu
(cap wojska + tłumienie grup działa) — potwierdza „42/42 miasto-państwo" Operatora.

## Tabela pokrycia (zweryfikowana niezależnie)

| Zakres | Wynik | Weryfikacja FC |
|---|---|---|
| Major AI, pełny katalog | 39/42 (brak: mury, fort, baszta) | Potwierdzone statycznie (CITY_BUILDING_PREREQ + filtr `mury`) |
| Miasto-państwo (defensiveCopy) | 42/42 | Potwierdzone symulacją własną (400 tur) |
| Katalog łącznie | 42 | Potwierdzone (`node -e` na `buildings.json`) |

## Tabela symulacji własnej (major AI, 400 tur, esbuild, bez canAfford)

| # | Tura | Budynek/jednostka |
|---|---|---|
| 1 | 1 | koszary |
| 2 | 2 | studnia |
| 3 | 3 | akwedukt |
| 4 | 4 | laznia_publiczna |
| 5 | 5 | stolarnia |
| 6 | 6 | kamieniarski |
| 7 | 7 | garncarnia |
| 8 | 8 | cegielnia |
| 9-400 | — | Wojownik/Łucznik (plateau, 0 nowych budynków) |

## BLOKADY

Guard SS2b: dispatch podał oczekiwany HEAD `918e5993`; faktyczny HEAD to `de83c098`.
Zweryfikowałem: `918e5993` jest przodkiem HEAD (`git merge-base --is-ancestor` = true),
branch poprawny (`autobot/R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1`), drzewo czyste,
a 3 commity między nimi to dokładnie Operator/Evaluator/Obrona rundy 1 opisane w tym
dispatchu — nie rozbieżność tożsamości, tylko nieodświeżony snapshot guarda z
początku tematu. Nie BLOCK, kontynuowałem; odnotowane do wiadomości orkiestratora.
DECISION_REQUIRED #1 (13 literałów), #2 (39/42, P-AI-008), #3 (Spichlerz — pogłębione),
#4 (schemat buildings.json) — czekają na właściciela. Kryterium 4 niedostarczone.
Kryterium 9 niezweryfikowane (infra).

RUNDY: 1/5
NASTĘPNY KROK: Właściciel rozstrzyga DECISION_REQUIRED #1-#4 oraz sposób dostarczenia
kryterium 4 (pełny silnik vs proxy z canAfford vs osobny temat harnessu ekonomii —
moje ustalenie pokazuje, że proxy BEZ canAfford nie wystarczy, bo produkuje trwały
platon na jednostkach). Do integracji orkiestratora dopiero po tych decyzjach.
DEPLOY/PUSH: NIE WYKONANO
