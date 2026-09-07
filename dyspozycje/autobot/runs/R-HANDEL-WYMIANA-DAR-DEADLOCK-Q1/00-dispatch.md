STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HANDEL-WYMIANA-DAR-DEADLOCK-Q1
GOAL: Technologia "Wymiana" (`TRADE_TECH`, jedyna odblokowująca CAŁY handel szlakowy z
danym partnerem — `ownerHasTradeTech`) ma dać się PODAROWAĆ/PRZEHANDLOWAĆ partnerowi,
który jeszcze NIE ma zbadanych jej prerekwizytów (Garncarstwo + Rolnictwo + Oswojenie
zwierząt) — WYŁĄCZNIE dla tej jednej technologii, ogólna reguła "dar wymaga zbadanych
prereq u odbiorcy" zostaje bez zmian dla wszystkich pozostałych technologii.

WYZWALACZ: żywe zgłoszenie właściciela (zrzut popupu "Prezent/dar", zakładka
"Technologia", tylko 3 opcje: Rolnictwo/Łowiectwo/Oswojenie zwierząt — "Wymiana" nie
widoczna mimo posiadania). Recon (Explore agent) ustalił DOKŁADNY mechanizm i
POTWIERDZIŁ realny, udokumentowany w kodzie deadlock kompozycyjny między dwiema
OSOBNO poprawnymi, wcześniej zamkniętymi decyzjami:
(a) `R-HANDEL-WYMIANA-TECH-GATE-Q1` (zintegrowane, `73037f75`) — cały handel wymaga
    zbadanej "Wymiany" PRZEZ PARTNERA (`ownerHasTradeTech`, `main.ts:10828-10830`).
(b) `P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE` (zamknięte 2026-08-09) — dar/handel
    technologii wymaga, żeby odbiorca miał już zbadane WSZYSTKIE jej prerekwizyty
    (`techIdsWithPrereqsMetForRecipient`, `gra/src/game/diplomacy-tech-trade.ts:35-47`).
Razem: cywilizacji BEZ Garncarstwa/Rolnictwa/Oswojenia zwierząt nie da się podarować
"Wymiany" (bo nie spełnia jej prereqów), więc NIGDY nie odblokuje się z nią handlu
przez dar — musiałaby sama samodzielnie zbadać te trzy technologie. To podważa sens
mechaniki "dar dyplomatyczny", która w grach 4X typowo służy właśnie do podciągania
mniej rozwiniętego partnera.

DECYZJA PROJEKTOWA ORKIESTRATORA (świadomy, wąski wyjątek, nie ogólne rozluźnienie
reguły — jeśli właściciel się z tym nie zgodzi po przebudzeniu, łatwo cofnąć: to jeden
warunek w dwóch miejscach): "Wymiana" (`TRADE_TECH`) jest WYJĄTKIEM od reguły
prereq-dla-odbiorcy z (b) — bo jej JEDYNYM sensownym zastosowaniem jest właśnie
odblokowanie handlu z partnerem, który sam jeszcze nie doszedł do tego punktu drzewka;
wymaganie prereqów tutaj tworzy zamknięte koło bez żadnego wyjścia dla gracza. Wszystkie
POZOSTAŁE technologie nadal wymagają zbadanych prereqów u odbiorcy — to nie jest
generalne złagodzenie reguły (b), wyłącznie punktowy wyjątek dla jednej, konkretnej
technologii, której natura semantycznie różni się od reszty drzewka (nie daje bonusu
odbiorcy tak jak inne techy, tylko WŁĄCZA mechanikę handlu jako taką).

KONTEKST TECHNICZNY (zlokalizowany przez recon):
- `gra/src/game/trade-routes.ts:1132` — `TRADE_TECH = 'Wymiana'`.
- `gra/src/game/diplomacy-tech-trade.ts:35-47`, `techIdsWithPrereqsMetForRecipient()` —
  filtr sprawdzający prereq odbiorcy dla KAŻDEJ technologii w liście do daru/handlu.
- `gra/src/game/diplomacy-basket-transfer.ts:92-99`, `grantTechToOwner()` — DRUGI,
  niezależny gate z tym samym warunkiem (prereq odbiorcy), egzekwowany przy FAKTYCZNYM
  transferze (nawet gdyby udało się ominąć filtr listy, transfer i tak by odrzucił).
  OBA miejsca wymagają zmiany, inaczej naprawa jest tylko kosmetyczna (tech pojawi się
  na liście, ale transfer się nie powiedzie).
- `main.ts:18891-18921`, `getSellableTechForPlayer`/`getBuyableTechFromOwner` — wołające
  `techIdsWithPrereqsMetForRecipient`.

ZADANIE:
1. W `techIdsWithPrereqsMetForRecipient()` (`diplomacy-tech-trade.ts:35-47`) — dodaj
   wyjątek: jeśli `id === TRADE_TECH` (import z `trade-routes.ts`), pomiń sprawdzenie
   `prerequisitesOf(def).every(...)` dla TEJ technologii (epoch-gate/epoch-tier-gate
   nadal obowiązują — to inne zabezpieczenia, nie ruszać ich bez wyraźnego powodu).
2. W `grantTechToOwner()` (`diplomacy-basket-transfer.ts:92-99`) — analogiczny wyjątek
   dla `TRADE_TECH`, żeby transfer faktycznie się powiódł, nie tylko lista.
3. Napisz/rozszerz test dowodzący: (i) partner BEZ prereqów "Wymiany" — "Wymiana" TERAZ
   pojawia się na liście do podarowania/handlu i transfer się powodzi, (ii) partner BEZ
   prereqów INNEJ technologii (np. dowolnej losowej z drzewka, nie "Wymiany") — nadal
   NIE pojawia się na liście (regres reguły ogólnej — kontrola, że wyjątek jest
   PUNKTOWY, nie ogólnym rozluźnieniem), (iii) po transferze "Wymiany" partner
   faktycznie ma ją zbadaną (`ownerResearchedTechs`) i `ownerHasTradeTech` zwraca true
   dla niego.

BINARNE KRYTERIUM SUKCESU: scenariusz (i) i (ii) z punktu 3 zielone, `ownerHasTradeTech`
po transferze zwraca `true` dla odbiorcy.

ALLOWLISTA:
- `gra/src/game/diplomacy-tech-trade.ts` (wyłącznie `techIdsWithPrereqsMetForRecipient`)
- `gra/src/game/diplomacy-basket-transfer.ts` (wyłącznie `grantTechToOwner`)
- `gra/tools/*.cjs` (nowa albo rozszerzona bramka)
- `dyspozycje/autobot/runs/R-HANDEL-WYMIANA-DAR-DEADLOCK-Q1/*`
Zakaz zmiany `ownerHasTradeTech`/bramki "cały handel wymaga Wymiany" (`R-HANDEL-WYMIANA-TECH-GATE-Q1`
— zostaje nietknięta). Zakaz rozluźniania reguły prereq dla JAKIEJKOLWIEK innej
technologii niż `TRADE_TECH`. Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania za gotowe bez testu (ii) dowodzącego, że
wyjątek jest PUNKTOWY (inne technologie nadal blokowane brakiem prereq u odbiorcy) —
łatwo przez przypadek napisać warunek, który rozluźnia regułę dla wszystkich, nie tylko
"Wymiany".

IZOLACJA: worktree `/home/user/wt-handel-wymiana-dar-deadlock`, gałąź
`autobot/R-HANDEL-WYMIANA-DAR-DEADLOCK-Q1`, baza `origin/main` @ `f029ffbf`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

UWAGA DLA WŁAŚCICIELA (do ABC jutro, jeśli się nie zgadza): to jest decyzja projektowa
orkiestratora podjęta autonomicznie w nocy (właściciel śpi, temat nie blokuje — łatwo
odwracalny, jeden warunek w dwóch miejscach). Jeśli wolisz inne rozwiązanie (np. osobna
ścieżka "dar startowy" tylko dla pierwszego kontaktu, albo w ogóle brak zmiany i
akceptacja że taki partner musi sam dobadać drzewko) — daj znać, cofniemy/zmienimy.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
