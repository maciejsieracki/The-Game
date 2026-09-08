# P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1 — Obrona operatora, runda 1/5

Odpowiedź na oba zarzuty z `02-evaluator-runda1.md` (STATUS: DECISION_REQUIRED), z osobna,
z dowodem źródłowym/testowym. Aneks kodu opisany tu jest już zapisany w `01-operator-runda1.md`
(sekcja ANEKS) i w diffie `gra/src/main.ts`.

## Zarzut 1 — brak `diplomaticallyDiscoveredOwners`/degradacja karty `warEventLog`

**PRZYJMUJE w części dot. braku discovery/kontaktu — naprawione w tej samej rundzie. PRZYJMUJE
fakt degradacji karty `warEventLog`, ODRZUCAM że wymaga naprawy w tym samym, minimalnym
zakresie tej rundy — argumentacja niżej.**

### 1a. Brak `diplomaticallyDiscoveredOwners.add`/`diplomaticContactEstablished.add` — PRZYJMUJE, NAPRAWIONE

Dowód, że zarzut był trafny (przed aneksem): blok wykonania `wypowiedz_wojne` (main.ts,
ówczesne ~32232-32325) rzeczywiście nie zawierał żadnego wywołania `diplomaticallyDiscoveredOwners.add`
ani `diplomaticContactEstablished.add` dla `ownerId`/`targetId` — sprawdzone bezpośrednim
czytaniem bloku, potwierdza to również sam Evaluator (grep źródłowy, zero trafień w diffie).
Skutek: `buildAudienceActions`/`playerDiplomacyActionAllowed` liczą `layer` z
`diplomacyLayerForOwner(ownerId, ..., contactedOwners)`, gdzie `contactedOwners` to properties
karmione z `diplomaticallyDiscoveredOwners` — bez wpisu, `layer==='pre_contact'` mimo
`relacja==='wojna'`. To dokładnie analiza Evaluatora, potwierdzona.

Naprawa (ten sam plik z allowlisty, ten sam blok wykonania, przed `recordWarDeclarationEvent`):
przy skutecznym wypowiedzeniu komendy z markerem `powod` wymuszonej wojny epoki
(`isForcedEpochWarDeclareCmd(cmd)`, już istniejąca klasyfikacja z pierwotnej naprawy) na gracza
(`targetId === 0`), dodano:

```
diplomaticallyDiscoveredOwners.add(ownerId);
diplomaticContactEstablished.add(ownerId);
```

Zakres: WYŁĄCZNIE komendy z tym `powod` — zwykłe (niewymuszone) DOW AI na gracza nietknięte,
D3-Q2 dla nich bez zmian (regresja pokryta przez istniejącą asercję w
`forced-war-player-pre-contact-gate-test.cjs`, patrz TESTY niżej — nadal 45/45 po aneksie).

Weryfikacja: `tsc --noEmit` 0 błędów po aneksie; wszystkie 23 bramki jednostkowe (5 referencyjnych
+ 18 forced-war/dyplomacja) ponownie zielone, identyczne liczby — zero regresji. Żywe bramki
uruchomione ponownie po aneksie:

- `forced-war-player-no-contact-live-test.cjs` — dodano NOWĄ asercję (krok D2, bezpośredni
  dowód domykający Zarzut 1a): `isDiplomaticallyDiscovered(attackerId) === true` PO turze
  (PRZED aneksem byłoby `false` — to jest dokładnie stan opisany przez Evaluatora). Wynik po
  aneksie: **14/14 pass** (13 istniejących + 1 nowa asercja D2), zero regresji na pozostałych
  13. Log: `/tmp/live3.log` (ten sam worktree, ta sama sesja).
- `forced-war-player-target-live-test.cjs` (regresja scenariusza "już poznał", NIETKNIĘTY plik)
  — ponownie uruchomiony po aneksie: **12/12 pass**, bez zmian, w tym nadal dedykowana karta
  `kind:'enemy'` w top-3 (scenariusz z kolokacją, mniej zdarzeń w turze — patrz 1b niżej).

To bezpośrednio realizuje sugestię samego Evaluatora ("Minimalna łatka... dodanie
`diplomaticallyDiscoveredOwners.add(...)`... usunęłaby obie konsekwencje") — nie dyskutuję z
diagnozą, przyjmuję ją i naprawiam w tej samej rundzie, zamiast liczyć na ABC/odłożenie.

### 1b. Degradacja karty `warEventLog` (`kind:'info'` zamiast `kind:'enemy'`) — PRZYJMUJE fakt, ODRZUCAM że wymaga naprawy TERAZ w tym zakresie

Fakt jest prawdziwy i nieukrywany — udokumentowany wprost w komentarzu własnego testu
(`forced-war-player-no-contact-live-test.cjs`, krok E), tak jak zauważył Evaluator. Źródłowo
ustaliłem PRZYCZYNĘ dokładnie (nieznaną w momencie pisania oryginalnego testu): `getWarEventLogHead()`
(main.ts:21907) zwraca WYŁĄCZNIE `warEventLog.slice(0, 3)` — trzy najnowsze wpisy. Dedykowana
karta `kind:'enemy'` JEST tworzona bezwarunkowo przez `recordWarDeclarationEvent` (main.ts:8389-8429,
`kind: 'enemy'` na stałe, niezależnie od stanu discovery) w MOMENCIE wykonania komendy
`wypowiedz_wojne` w pętli AI. Toast dla gracza (`showHintMessage`, main.ts:32328) trafia — bo
wywołany w trakcie `endTurnInProgress` — do kolejki `deferredEotHints`, konwertowanej na
generyczne karty `kind:'info'` PO całej pętli AI (`deferredHintsToSidePanelEvents`,
main.ts:33641-33647) i UNSHIFTOWANE przed kartę `enemy`. W scenariuszu bez kolokacji (tura 25,
pełna pętla AI z wieloma zdarzeniami ubocznymi tej samej tury) liczba wpisów `info` unshiftowanych
PO karcie `enemy` przekracza 3 → `getWarEventLogHead()` przycina kartę `enemy` poza widoczne okno.
W scenariuszu kolokowanym (`forced-war-player-target-live-test.cjs`) tura i otoczenie są prostsze,
mniej zdarzeń ubocznych → karta `enemy` mieści się w top-3. To NIE jest różnica przyczynowa
związana z discovery/kontaktem (karta `enemy` powstaje niezależnie od stanu
`diplomaticallyDiscoveredOwners`) — to efekt kolejności/przycinania wspólnej, ISTNIEJĄCEJ
wcześniej (poza tym tematem) kolejki `deferredEotHints`, dotyczącej WSZYSTKICH zdarzeń
wywołanych w fazie AI (bunty, elekcje, handel AI↔AI, nie tylko wymuszona wojna na gracza) —
potwierdzone komentarzem źródłowym main.ts:22531 ("`getWarEventLogHead()` obcina do 3, za mało
gdy w tej samej turze obok buntu...").

ODRZUCAM naprawę TEGO w tej rundzie z trzech powodów:
1. Poza minimalnym zakresem dispatchu — GOAL to "wojna wybucha niezależnie od poznania", nie
   "kolejność kart w dzienniku wydarzeń"; karta `kind:'enemy'` FAKTYCZNIE powstaje (dowód:
   `recordWarDeclarationEvent` wywoływane bezwarunkowo), tylko bywa przycięta poza top-3 przez
   mechanizm sprzed tego tematu.
2. Zmiana wymagałaby dotknięcia `deferredEotHints`/`getWarEventLogHead`/`slice(0,3)` — kolejki
   współdzielonej przez wszystkie typy zdarzeń EOT, poza plikami wskazanymi w allowlisty tego
   dispatchu jako "MIEJSCA GATINGU tych mechanizmów" — realne ryzyko regresji w niepowiązanych
   zdarzeniach (bunty, elekcje), bez dowodu z wieloseedowej symulacji że taka zmiana jest
   bezpieczna (REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu wymaga dokładnie takiego dowodu przed
   zmianą wspólnego mechanizmu).
3. Nie wpływa na binarne kryterium sukcesu (wojna faktycznie wybucha, potwierdzone żywo) — jest
   to strata jakości UI (gracz widzi ogólną kartę zamiast dedykowanej w top-3), nie regresja
   funkcjonalna ani utrata GOAL.

Rekomendacja: zgłoszenie osobnego, mniejszego tematu (`P-WYDARZENIA-WOJNA-KARTA-PRZYCIETA-Q1`
lub podobne) albo ECHO do właściciela z pytaniem czy akceptowalne. Jeśli Evaluator/właściciel
uzna to za blokujące GOAL — cofam ten punkt i naprawię w rundzie 2 (kandydat: zwiększyć limit
`getWarEventLogHead`/`warEventLog.length>8` cap albo dać karcie `enemy` priorytet nad `info` przy
przycinaniu top-3 — wymaga ABC bo dotyka wspólnego mechanizmu poza obecną allowlistą).

## Zarzut 2 — brak wiążącego żywego dowodu PRZED/PO (niedeterminizm `?playtest=mapa`)

**PRZYJMUJE w całości — fakt jest dokładnie taki, jak opisuje Evaluator, i już udokumentowany
przeze mnie z pełną szczerością w oryginalnym raporcie (sekcja TESTY, akapit "PRZED/PO na żywym
silniku"), zgodnie z C-058. Nie ma tu sporu faktycznego.**

Uzupełnienie/kontekst, nie sprzeciw:
- Przyczyna niedeterminizmu (`refreshFog`/`updateDiplomaticDiscovery` odświeżający widoczność
  wielokrotnie w trakcie `endTurn()` na małej mapie `?playtest=mapa`, niezależnie od stanu
  naprawy) jest zjawiskiem środowiska testowego (sandboks), nie artefaktem naprawy — potwierdzone
  tym, że OBIE wersje kodu (przed i po naprawie) dawały PASS w tym samym powtórzonym eksperymencie.
  Gdyby naprawa była fałszywym PASS-em (np. przypadkowo nic nie zmieniała), Dowód 1 (jednostkowy,
  na REALNYCH, nietkniętych funkcjach silnika: `decideAIDiplomacy`,
  `partitionDiplomacyCommandsForPlayerFog`, `filterDiplomacyCommandsForLayer`,
  `diplomacyLayerForOwner`) wykryłby to deterministycznie — nie wykrył, bo naprawa faktycznie
  zmienia wynik filtrowania na poziomie logiki (PRZED: komenda skasowana pod `pre_contact`; PO:
  przechodzi), co Evaluator sam niezależnie zweryfikował i potwierdził.
- Dowód 2 (żywy) POTWIERDZA stan PO (13/13, relacja faktycznie `'wojna'`, bez wcześniejszego
  `isDiplomaticallyDiscovered`) — brakuje wyłącznie WIĄŻĄCEGO żywego kontrastu PRZED, nie
  potwierdzenia że naprawa działa.

Nie odrzucam żadnej części zarzutu — zgadzam się, że formalnie litera dispatchu (pkt 1 i 4
ZADANIA, "żywy dowód PRZED/PO") nie jest w 100% spełniona przez żywą symulację, tylko przez
połączenie jednostkowego PRZED/PO + żywego PO. Decyzja czy to wystarcza wobec ducha dispatchu
(cel: udowodnić że naprawa realnie usuwa blokadę, nie uzyskać dokładnie ten konkretny artefakt
dowodowy) należy do Evaluatora/Final Control/właściciela — nie uważam za swoją rolę przeforsowywać
że to wystarczy, skoro sam odnotowałem lukę. Jeśli wymagany jest deterministyczny żywy PRZED/PO,
proponuję (do ABC, bo dotyka trybu testowego poza obecną allowlistą): tymczasowe wyłączenie
`refreshFog` w trybie `__eraTestDebug` na czas jednej tury testowej, albo osobny fixture mapy bez
tego zjawiska — obie opcje wymagają nowego haka testowego (w allowlisty: `gra/tools/*-test.cjs`,
ale hak sam byłby w `main.ts` pod `__eraTestDebug`, w zakresie).

## PODSUMOWANIE

| Zarzut | Werdykt | Status |
|---|---|---|
| 1a (brak discovery/kontaktu) | PRZYJMUJE | NAPRAWIONE w tej rundzie |
| 1b (karta `warEventLog` `info` zamiast `enemy` w top-3) | PRZYJMUJE fakt / ODRZUCAM zakres naprawy teraz | Zidentyfikowana przyczyna (przycinanie `slice(0,3)` wspólnej kolejki EOT), rekomendacja: osobny temat/ECHO |
| 2 (brak wiążącego żywego PRZED/PO) | PRZYJMUJE w całości | Bez zmian — udokumentowane, wymaga decyzji Evaluatora/właściciela czy wystarcza |

## NASTĘPNY KROK

Evaluator: (i) zweryfikować niezależnie aneks (discovery/kontakt) i wynik żywych bramek po
aneksie, (ii) zdecydować czy analiza 1b (poza zakresem, osobny temat) jest akceptowalna czy
wymaga ABC do właściciela, (iii) zdecydować czy Zarzut 2 (przyjęty bez sporu) wymaga dodatkowej
rundy z nowym fixture testowym czy jednostkowy PRZED/PO + żywy PO wystarcza jako łączny dowód.

## DEPLOY/PUSH: NIE WYKONANO
