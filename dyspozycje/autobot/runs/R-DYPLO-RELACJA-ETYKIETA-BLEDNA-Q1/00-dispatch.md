STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1
GOAL: Wiersz "Wpływ Relacji na deal" w Stole negocjacji dla propozycji POKOJU/zawieszenia
broni ma pokazywać REALNĄ wartość Relacji użytą do wyliczenia modyfikatora siły PW
(dziś fałszywie zawsze pokazuje "Relacja 100"), nie zmieniając SAMEGO wyliczenia PW ani
żadnej bramki decyzyjnej (`canAccept`) — WYŁĄCZNIE poprawka wyświetlanej etykiety.

WYZWALACZ: recon (Explore agent) na żywe zgłoszenie właściciela (zrzut Stołu negocjacji:
"My oferujemy 145 PW (baza 500, Relacja −71% siła)" ale niżej "WPŁYW RELACJI NA DEAL:
Relacja 100 · balans (0%…)") ustalił dokładną przyczynę: `computePeaceAcceptanceSides()`
(`gra/src/game/diplomacy-acceptance-points.ts`, funkcje `buildPlayerSide`/`buildPartnerSide`,
linie ok. 248-284) NIGDY nie ustawia pola `relCurrent` na zwracanych obiektach
`AcceptanceSideBalance` (to pole jest ustawiane wyłącznie w `computeSideBalance()`, linia
ok. 342, używanej dla INNYCH typów traktatów niż pokój). W efekcie
`relationRowFromBalance()` (`gra/src/ui/diplomacyAcceptanceBalance.ts`, linia ok. 136-142)
i render (linia ok. 633) czytają `const relTotal = side.relCurrent ?? my?.relCurrent ?? 100;`
— dla pokoju `relCurrent` jest zawsze `undefined`, więc fallback zawsze zwraca 100.
Realna wartość faktycznie użyta przez `treatyPwForRole`/`effectiveTreatyPnRequired` do
policzenia modyfikatora −71% to `relSigned=-71` → `relTotal = relSigned + 100 = 29`.

WAŻNE — to NIE jest ten sam temat co `P-DYPLO-BILANS-GATE` (runda 4, zintegrowana,
commit `e253e64a`): TAMTA decyzja mówi, że bramka bilansu PW (`canAccept`) jest CELOWO
pomijana dla pokoju — to zostaje BEZ ZMIAN, nie ruszać. TEN temat to WYŁĄCZNIE błędna
etykieta liczby w wierszu informacyjnym, nie dotyka logiki decyzyjnej ani wyliczenia PW.

ZADANIE: w `computePeaceAcceptanceSides()` (`buildPlayerSide`/`buildPartnerSide`) ustaw
`relCurrent` na zwracanych obiektach `AcceptanceSideBalance` na REALNĄ wartość relacji
użytą w tej samej funkcji do wyliczenia modyfikatora PW (ten sam `relSigned`/`relTotal`,
NIE przeliczaj od nowa inną ścieżką) — analogicznie do tego, jak robi to
`computeSideBalance()` dla pozostałych typów traktatów. Sprawdź OBIE strony (nasza
oferta I oferta partnera) — z recon wynika, że po stronie `partner` PW zawsze jest na
bazie (`partnerTreatyPnRequired`, bez modyfikatora relacji) — ustal, czy dla tej strony
`relCurrent` powinien pokazywać relację 100 (bo faktycznie nie wpływa na ich PW) czy też
realną relację (informacyjnie) — Operator ma to jawnie uzasadnić w raporcie, nie zgadywać.

BINARNE KRYTERIUM SUKCESU: dla scenariusza ze zrzutu (relSigned=-71, baseline 500→145 po
naszej stronie) wiersz "WPŁYW RELACJI NA DEAL" pokazuje relację ~29 (albo jawnie
uzasadnioną inną wartość dla strony partnera), NIE 100. `canAccept`/bramka bilansu dla
`pokoj` pozostaje NIETKNIĘTA (nadal zawsze true niezależnie od bilansu — to jest kanon
z rundy 4, NIE cofać).

ALLOWLISTA:
- `gra/src/game/diplomacy-acceptance-points.ts` (wyłącznie `computePeaceAcceptanceSides`/
  `buildPlayerSide`/`buildPartnerSide` — nie ruszać `computeSideBalance` ani innych funkcji)
- `gra/src/ui/diplomacyAcceptanceBalance.ts` (jeśli render wymaga drobnej korekty czytania
  pola — bez zmiany logiki `canAccept`)
- `gra/tools/*.cjs` — wolno dodać/rozszerzyć bramkę diagnostyczną dla tego pola
- `dyspozycje/autobot/runs/R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1/*` (raporty własne)
Zakaz zmiany logiki `canAccept`/bramki bilansu PW dla `pokoj` (kanon P-DYPLO-BILANS-GATE
runda 4 — NIE cofać). Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania naprawy za gotową bez pokazania w raporcie
KONKRETNEJ liczby przed/po dla scenariusza ze zrzutu (relSigned=-71 → jaka wartość
wyświetlana dziś, jaka po poprawce) — nie ogólnikowe "działa poprawnie".

IZOLACJA: worktree `/home/user/wt-dyplo-relacja-etykieta`, gałąź
`autobot/R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1`, baza `origin/main` @ `c469c7b5`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
