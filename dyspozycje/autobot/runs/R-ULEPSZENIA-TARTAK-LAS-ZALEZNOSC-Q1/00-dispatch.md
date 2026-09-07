STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1
GOAL: Dwie niezależne poprawki dotyczące zależności Tartaku od lasu, obie z jednego
zgłoszenia właściciela (żywa rozmowa, zrzuty ekranu):

CZĘŚĆ A (BUG, priorytet wyższy) — brak ponownej weryfikacji lasu przy komicie budowy AI:
zgłoszenie "system znowu stawia tartak i obóz łowiecki w miejscu, gdzie w ogóle nie ma
lasu" + "było ustalone, że AI może postawić tartak i obóz łowiecki tylko w lesie".
Recon (orkiestrator) potwierdził: `qualifies()` DLA BUDOWY poprawnie wymaga lasu
(`improvement-build.ts:1077-1080` tartak, `:1095-1097` oboz_lowiecki), ALE komit AI w
`main.ts` (`cmd.type === 'buildImprovement'`, ok. linii 32489-32528) NIE weryfikuje
ponownie `nakladka === Nakladka.Las` tuż przed dopisaniem do `placedImprovements` —
w kontraście do ścieżki `wyrąb`, która ma explicite taki strażnik: "if
(hexForImprovement.nakladka !== Nakladka.Las) continue; // już wycięte (wyścig miast)"
(main.ts:32545). Ryzyko wyścigu: plan budowy tartaku powstał gdy hex miał las, ale w tej
samej turze inny komit (własna wycinka albo wycinka innego miasta) zdążył usunąć las
zanim komit budowy się wykonał. NIE zweryfikowano live-repro — to hipoteza wsparta kodem
i asymetrią względem analogicznego strażnika `wyrąb`, do potwierdzenia przez Operatora
scenariuszem testowym (dwa komity w tej samej turze: wycinka + budowa na tym samym heksie).

CZĘŚĆ B (DECYZJA PROJEKTOWA — odwrócenie wcześniejszego kanonu, ABC dla właściciela rano):
zgłoszenie "po usunięciu lasu obóz łowiecki zniknął, a tartak został, a też powinien
zniknąć, bo może istnieć tylko w lesie" (dwa kolejne zrzuty ekranu tego samego heksa,
przed i po wycince). DZISIAJ kod celowo NIE usuwa tartaku przy zniknięciu lasu —
`FOREST_DEPENDENT_IMPROVEMENT_KEYS` (`improvement-build.ts:187-189`) zawiera WYŁĄCZNIE
`oboz_lowiecki`, komentarz explicite: "tartak NIE — kanon: las zostaje przy tartaku"
(linia 191), potwierdzone osobną asercją testową `tools/map-improvement-qualify-test.cjs`
("tartak stays when forest removed (kanon)"). Ta wcześniejsza decyzja NIE była udokumentowana
osobnym plikiem `docs/decyzje/` (recon potwierdził: nie istnieje) — żyje wyłącznie w
komentarzu kodu i teście, i dotyczyła INNEGO scenariusza (wizualnego znikania lasu na
wzgórzu, `R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1`, 2026-09-02) — NIE scenariusza
"właściciel/AI ręcznie wycina las mając już zbudowany tartak", którego dzisiejsze zgłoszenie
dotyczy wprost i jednoznacznie, dwukrotnie, z dowodem zrzutu przed/po.

DECYZJA ORKIESTRATORA (autonomiczna, w nocy, właściciel śpi — ODWRACALNA, DO POTWIERDZENIA
RANO przez ABC): odwrócić ten fragment kanonu. Dodać `'tartak'` do
`FOREST_DEPENDENT_IMPROVEMENT_KEYS` — tartak znika razem z lasem, tak jak obóz łowiecki
(oba wymagają lasu do budowy, więc spójnie oba znikają gdy las znika). Zaktualizować
komentarz przy stałej (usunąć "tartak NIE — kanon: las zostaje przy tartaku", opisać nowy
stan) oraz przekotwiczyć istniejącą asercję testową z "tartak stays" na "tartak removed
too" — to jest ŚWIADOMA zmiana testu odzwierciedlająca nową, jawnie odnotowaną decyzję,
NIE cichą naprawę zastałego testu. Sprawdzić też (bez zmiany, tylko potwierdzić w raporcie)
czy `ULEPSZENIA_ZYWNOSCIOWE`/kontrakt widoczności lasu z main.ts (komentarz
auto-improvements.ts:80-84, "droga/fort/posterunek/tartak/glinianka NIE są ulepszeniami
żywnościowymi i spłaszczają wzgórze") jest logicznie NIEZALEŻNY od tej zmiany (dotyczy
INNEGO mechanizmu — spłaszczania wzgórza pod ulepszeniem, nie usuwania ulepszenia przy
usunięciu lasu) — jeśli okaże się że NIE jest niezależny, zatrzymać się i zgłosić
DECISION_REQUIRED zamiast zgadywać.

ZADANIE:
1. (Część A) `main.ts`, komit AI `buildImprovement` (~32489-32528): dodać strażnik
   analogiczny do `wyrąb` (linia ~32545) — przed dopisaniem `tartak`/`oboz_lowiecki` do
   `placedImprovements`, ponownie zweryfikować `nakladka === Nakladka.Las` na docelowym
   heksie; jeśli nie — pomiń komit (analogiczny komentarz "już wycięte (wyścig miast)").
   Sprawdzić czy analogiczny brak dotyczy też komitu GRACZA (nie tylko AI) — jeśli tak,
   naprawić symetrycznie.
2. (Część B) `improvement-build.ts`: dodać `'tartak'` do `FOREST_DEPENDENT_IMPROVEMENT_KEYS`,
   zaktualizować komentarz. Przekotwiczyć test w `map-improvement-qualify-test.cjs` z nowym
   oczekiwanym zachowaniem (tartak znika razem z lasem), z jawnym komentarzem w teście
   odnotowującym że to ŚWIADOME odwrócenie wcześniejszej decyzji z datą i numerem tego tematu.
3. Test scenariusza wyścigu dla Części A: symulacja dwóch komitów w tej samej turze
   (wycinka lasu + próba budowy tartaku/obozu na tym samym heksie) — potwierdzić że budowa
   NIE dochodzi do skutku gdy las już zniknął.
4. Żywy test end-to-end (może być na poziomie silnika/headless, nie wymaga Chromium —
   to zmiana logiki, nie UI): usuń las ręcznie (wycinka) na heksie z tartakiem — potwierdź
   że tartak znika z `placedImprovements`.

BINARNE KRYTERIUM SUKCESU: (A) nowy test wyścigu czerwienieje na kodzie sprzed zmiany i
zielenieje po zmianie (dowód nietautologiczności); (B) tartak znika z `placedImprovements`
natychmiast po usunięciu lasu z heksa, potwierdzone testem silnika.

ALLOWLISTA:
- `gra/src/main.ts` (wyłącznie komit budowy `buildImprovement`, strażnik lasu — nie ruszać
  reszty funkcji obsługi komend)
- `gra/src/map/improvement-build.ts` (wyłącznie `FOREST_DEPENDENT_IMPROVEMENT_KEYS` i
  bezpośrednio przyległy komentarz)
- `gra/tools/*.cjs` (nowe/rozszerzone testy)
- `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` (jeśli dotyczy tego kanonu — append-only,
  jeśli w ogóle wspomina o tartak/las; sprawdzić przed edycją)
- `dyspozycje/autobot/runs/R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1/*`
Zakaz `git add -A`. Zakaz zmiany `auto-improvements.ts` (Część B tego tematu jest
WYŁĄCZNIE o `FOREST_DEPENDENT_IMPROVEMENT_KEYS`, nie o kolejności budowy/profilach AI —
jeśli podczas pracy okaże się że coś w `auto-improvements.ts` jest logicznie sprzężone i
wymaga zmiany, ZATRZYMAJ SIĘ i zgłoś DECISION_REQUIRED zamiast poszerzać zakres).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania Części A za naprawioną bez testu, który
REALNIE demonstruje wyścig (czerwony na starym kodzie, zielony na nowym) — sam odczyt kodu
"strażnik istnieje" nie wystarcza, bo dokładnie taki sam błąd (istniejący strażnik gdzie
indziej, brak tu) już raz umknął. Zakaz uznania Części B za zamkniętą bez testu silnika
faktycznie usuwającego tartak z `placedImprovements` po znikięciu lasu (nie tylko zmiana
stałej + odczyt kodu).

IZOLACJA: worktree `/home/user/wt-ulepszenia-tartak-las-zaleznosc`, gałąź
`autobot/R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1`, baza `origin/main` @ `fa697d83`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.
Zero nakładania plików z aktywnymi tematami `wt-entitycard-rozwiniete-scrollbar` i
`wt-hotseat-etap4-noop-harness` (potwierdzone: żaden nie dotyka `main.ts` w tym zakresie
ani `improvement-build.ts`).

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
