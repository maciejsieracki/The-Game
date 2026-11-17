STATUS: PASS-WITH-NOTES (obrona, runda 3 tego ID; odpowiedź na zarzuty Evaluatora r3 (794ec7a7f): 1-6 PRZYJĘTE; pomiar powtórzony i uzupełniony, wszystkie liczby z surowego JSON; jedna część (ręczna vs Wojownik) NIE ZMIERZONO z dowodem niemożliwości)
DOMAIN: GAME (pomiar na żywo w Chromium, bez zmian w gra/src i gra/data)
TEMAT: R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1
GOAL: punkt 3 dispatchu (straty zwycięzcy; ręczna bitwa Z ROZKAZAMI vs AUTO vs skip; pary 10 vs 10; „pewne” 1 przebieg, „losowe” 3 ziarna). Obrona domyka dowody: evidence zgodne z harnessem, kontrola negatywna (ręczna bez rozkazów), dokumentacja liczenia rozkazów, bramki referencyjne zmierzone.
BAZA/KANDYDAT: 08297531d159db34b22cb79a59db46d3e79d2ed3 (kandydat r3 Operatora, baza bf3f65f04). Kod gry (gra/src, gra/data) niezmieniony względem bf3f65f04 (git diff --stat bf3f65f04 -- gra/src gra/data = puste).
ZMIANY-COMMIT: (SHA w polu końcowym raportu, sekcja DEPLOY/PUSH niżej) — zmienione pliki: gra/tools/live-verify-w3-manual-orders-r3.cjs (harness), dyspozycje/.../evidence/w3-manual-orders-10v10-r3.json (regenerowany), dyspozycje/.../30-obrona-claude.md (ten raport). Nic poza tym.

## ODPOWIEDZI NA ZARZUTY EVALUATORA (794ec7a7f)

Zarzut 1 (dane diag_survivors_rerun / survivors / endLogTail nie są w committowanym evidence; JSON nie odpowiada harnessowi): PRZYJMUJĘ.
- Dowód zarzutu: stary JSON miał res.keys = [winner,round,manualAtEnd,wallBreached,atk,def,endText] — bez survivors/endLogTail, choć harness je zapisywał. JSON był z wcześniejszej wersji harnessu.
- Poprawka: cały zestaw 32 przebiegów (24 z punktu 3 + 8 kontroli negatywnej) przepuszczono ponownie zacommitowanym harnessem (build z bf3f65f04, Chromium /usr/bin/chromium). Wynik: 0 błędów (`errors`=0, brak `error`), res zawiera `survivors` i `endLogTail` w każdym przebiegu.
- Zweryfikowane z JSON: dystans-losowe-s1|manual: 5 Łuczników zostaje, każdy hp 20, amunicja 11-12, routed=false wszystkie; endLogTail = "-> Archer uciekl z pola bitwy" x kilka, "=== Koniec bitwy: zwyciestwo OBRONCY ===". Analogicznie dystans-losowe-s3|manual (6 Łuczników, hp 20, amunicja 11-12) i dystans-pewne-s1|manual (5 Łuczników, hp 20, amunicja 11-12). Obserwacja 2 operatora (r3) jest teraz udokumentowana w evidence; „diag_survivors_rerun” była nazwą nieistniejącego pliku — wycofuję ją.
- Log „uciekł z pola bitwy” to wpis z endLogTail; przyczyna (morale vs inny mechanizm) pozostaje NIEPOTWIERDZONA.

Zarzut 2 (para wręcz to Hastati vs Falanga, nie Wojownik vs Wojownik; brak drugiego podejścia, brak sprawdzenia __civTest.addUnit): CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM.
- PRZYJĘTE: para nie jest lustrzana, w dispatchu była przykładem („np.”), a raport operatora r3 tego jasno nie wyjaśnił jako błędu. Wynik dotyczy par Hastati/Łucznik vs Falanga, nie Wojownika. Ograniczenie opisane w raporcie.
- DRUGIE PODEJŚCIE (dowód z kodu, nie z przebiegu): __civTest.addUnit NIE wybiera typu. Cytat src/main.ts:31094-31099:
  `addUnit: (ownerId, q, r, civilian) => { const tpl = units.find(u => u.ownerId === ownerId && isCivilianUnit(u) === civilian) ?? units.find(u => isCivilianUnit(u) === civilian); ... units.push({ ...tpl, id, ownerId, q, r, inGarnizon: false }) }`
  Hak klonuje pierwszy szablon danego właściciela (dla ownerId 0 = Hastati), nie przyjmuje typeId. Wojownik nie da się więc wstawić bez zmiany gra/src, co jest poza zakresem tematu. Podejście 1 (przycięcie presetu bitwa-duza, 28 vs 28 do 10 vs 10) i podejście 2 (addUnit, odrzucone po analizie kodu) są udokumentowane.
- Wniosek: para Wojownik vs Wojownik pozostaje NIE ZMIERZONO, z dowodem niemożliwości bez zmiany src (nie z lenistwa). Decyzja właściciela: czy dopuścić zmianę src w osobnym temacie.

Zarzut 3 (rozkazy „dla każdej żywej jednostki w każdej rundzie” nie są wyjaśnione; 34 rundy/74 rozkazy vs 55 rund/220 rozkazów): PRZYJMUJĘ z poprawką twierdzenia.
- Harness r3 wydaje rozkaz tylko jednostkom gracza spełniającym: nie dead/removed/routed/fadingOut i nie `acted` i mającym `_nearestEnemy`. Dotąd tego nie logowano. Dodano `actions.perRound` = {round, alive, eligible, issued} dla każdej rundy rozkazów.
- Zmierzone z JSON (suma po rundach, tylko przebiegi „manual”):
  - issued == eligible w KAŻDEJ rundzie wszystkich 8 przebiegów ręcznych (mismatch = 0).
  - sumAlive vs sumEligible: dystans (4 przebiegi) — równe (185/185, 176/176, 197/197, 168/168); melee-losowe-s2 i -s3 — równe (205/205, 220/220); melee-losowe-s1: alive 141, eligible 132 (9 żywych jednostek-rund z flagą `acted`, pominięte); melee-pewne-s1: alive 79, eligible 74 (5 jak wyżej).
- Dlatego „74 rozkazy / 34 rundy” w melee-pewne to skutek ubywania jednostek atakującego (utracił 10/10 w ok. 34 rundach; suma żywych po rundach = 79, ≈2,3 na rundę), a NIE pominięcie żywych jednostek. Wyjątek: 9 i 5 jednostko-rund pominięto przez flagę `acted` (zachowanie sterownika/silnika, nieobjaśnione; zapisane jako obserwacja, nie naprawiane).
- Poprawne sformułowanie: „rozkazy wydawane każdej żywej jednostce bez flagi acted w każdej rundzie oczekującej na rozkazy”, nie „każdej żywej”.

Zarzut 4 (tsc i 5 bramek referencyjnych oznaczone NIE ZMIERZONO): PRZYJMUJĘ — zmierzone w tej obronie (surowe wyjście, worktree 08297531d, `npm ci --ignore-scripts`, esbuild install):
- `node ./node_modules/typescript/bin/tsc --noEmit` -> exit 0 (bez błędów).
- `node tools/logic-test.cjs` -> `LOGIC OK (213/213)`.
- `node tools/tech-tree-test.cjs` -> `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs` -> `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs` -> `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node tools/combat-test.cjs` -> `COMBAT TEST: 6/6 pass`.

Zarzut 5 (brak kontroli negatywnej: ręczna BEZ rozkazów w tej samej konfiguracji): PRZYJMUJĘ — wykonano. Tryb `manual-null` (klik Start, tylko Spacja, zero rozkazów), 8 przebiegów (wszystkie konfiguracje: 2 pary x {pewne s1, losowe s1-s3}), wynik w evidence. Wynik kontroli:
- Wynik NIE jest tautologiczny: manual-null różni się od manual (z rozkazami) we wszystkich 8 konfiguracjach. W 2 z 8 zwycięzca się zmienia: dystans-pewne-s1 (z rozkazami obrońca, bez rozkazów atakujący: atk 0/10 lost, def 10/10 lost) i melee-losowe-s3 (z rozkazami obrońca, bez rozkazów atakujący: atk 0/10 lost, def 10/10 lost).
- Oznacza to, że sterownik z rozkazami realnie zmienia przebieg. Obserwacja do decyzji właściciela (bez wyroku): bez rozkazów wygrywa atakujący w 2 konfiguracjach, z rozkazami (atak na najbliższego) obrońca we wszystkich 8.

Zarzut 6 (drobne: usage, martwy kod w trimInfo, brak składu przed przycięciem w evidence): PRZYJMUJĘ — poprawione w harnessie:
- Komunikat usage: `node live-verify-w3-manual-orders-r3.cjs <dist-dir> <out.json> [limitSekund]` (była stara nazwa r2).
- Martwy fragment `cnt(bs.atk.length ? [] : [])` usunięty; `trimInfo.before` zapisuje teraz liczniki składu przed przycięciem (w evidence: atk {Hastati:10, Archer:10, Horseman:8}, def {Phalanx:10, Archer:10, Horseman:8}) — potwierdza, że preset nie zawiera Wojownika.
- Po przycięciu w każdym przebiegu trimInfo.atkAfter/defAfter = 10/10 (dla pary melee atk {Hastati:10}, def {Phalanx:10}; dla dystansu atk {Archer:10}, def {Phalanx:10}).

## POMIAR (regenerowany, 32 przebiegi; liczby z JSON)

Kolumny: para | trafienia | ziarno | tryb | zwycięzca | straty obrońcy (Falanga, z 10) i HP | straty atakującego (z 10) i HP | rundy | rozkazy (rundy/łącznie)

dystans Łucznik 10 vs Falanga 10:
| trafienia | ziarno | tryb | zwycięzca | straty obrońcy | straty atakującego | rundy | rozkazy |
|---|---|---|---|---|---|---|---|
| pewne | 1 | manual (rozkazy) | obrońca | 0/10, HP 398 | 5/10, HP 100 | 27 | 168 (28) |
| pewne | 1 | auto | obrońca | 0/10, HP 382 | 10/10, HP 0 | 8 | - |
| pewne | 1 | skip | obrońca | 0/10, HP 382 | 10/10, HP 0 | 8 | - |
| pewne | 1 | manual-null (bez rozkazów) | ATAKUJĄCY | 10/10, HP 0 | 0/10, HP 200 | 32 | 0 |
| losowe | 1 | manual (rozkazy) | obrońca | 0/10, HP 400 | 5/10, HP 100 | 29 | 185 (30) |
| losowe | 1 | auto | obrońca | 0/10, HP 396 | 10/10, HP 0 | 9 | - |
| losowe | 1 | skip | obrońca | 0/10, HP 396 | 10/10, HP 0 | 33 | - |
| losowe | 1 | manual-null | obrońca | 0/10, HP 331 | 10/10, HP 0 | 43 | 0 |
| losowe | 2 | manual (rozkazy) | obrońca | 0/10, HP 400 | 5/10, HP 100 | 27 | 176 (28) |
| losowe | 2 | auto | obrońca | 0/10, HP 390 | 10/10, HP 0 | 12 | - |
| losowe | 2 | skip | obrońca | 0/10, HP 394 | 10/10, HP 0 | 35 | - |
| losowe | 2 | manual-null | obrońca | 0/10, HP 357 | 10/10, HP 0 | 41 | 0 |
| losowe | 3 | manual (rozkazy) | obrońca | 0/10, HP 400 | 4/10, HP 120 | 28 | 197 (29) |
| losowe | 3 | auto | obrońca | 0/10, HP 390 | 10/10, HP 0 | 35 | - |
| losowe | 3 | skip | obrońca | 0/10, HP 390 | 10/10, HP 0 | 12 | - |
| losowe | 3 | manual-null | obrońca | 0/10, HP 353 | 10/10, HP 0 | 41 | 0 |

wręcz Hastati 10 vs Falanga 10:
| trafienia | ziarno | tryb | zwycięzca | straty obrońcy | straty atakującego | rundy | rozkazy |
|---|---|---|---|---|---|---|---|
| pewne | 1 | manual (rozkazy) | obrońca | 0/10, HP 361 | 10/10, HP 0 | 33 | 74 (34) |
| pewne | 1 | auto | obrońca | 0/10, HP 351 | 10/10, HP 0 | 13 | - |
| pewne | 1 | skip | obrońca | 0/10, HP 351 | 10/10, HP 0 | 12 | - |
| pewne | 1 | manual-null | obrońca | 3/10, HP 225 | 10/10, HP 0 | 33 | 0 |
| losowe | 1 | manual (rozkazy) | obrońca | 0/10, HP 373 | 10/10, HP 0 | 40 | 132 (41) |
| losowe | 1 | auto | obrońca | 1/10, HP 323 | 10/10, HP 0 | 25 | - |
| losowe | 1 | skip | obrońca | 1/10, HP 323 | 10/10, HP 0 | 22 | - |
| losowe | 1 | manual-null | obrońca | 0/10, HP 349 | 10/10, HP 0 | 31 | 0 |
| losowe | 2 | manual (rozkazy) | obrońca | 0/10, HP 367 | 10/10, HP 0 | 54 | 205 (55) |
| losowe | 2 | auto | obrońca | 0/10, HP 358 | 10/10, HP 0 | 26 | - |
| losowe | 2 | skip | obrońca | 0/10, HP 358 | 10/10, HP 0 | 26 | - |
| losowe | 2 | manual-null | obrońca | 2/10, HP 284 | 10/10, HP 0 | 36 | 0 |
| losowe | 3 | manual (rozkazy) | obrońca | 0/10, HP 355 | 10/10, HP 0 | 54 | 220 (55) |
| losowe | 3 | auto | obrońca | 2/10, HP 285 | 10/10, HP 0 | 32 | - |
| losowe | 3 | skip | obrońca | 2/10, HP 285 | 10/10, HP 0 | 32 | - |
| losowe | 3 | manual-null | ATAKUJĄCY | 10/10, HP 0 | 0/10, HP 251 | 30 | 0 |

Uwaga: wszystkie wartości „HP” w tabeli są z pola `res` (zaokrąglone); „straty atakującego” dla trybu z rozkazami pochodzą z `res.atk.lost`. Przebiegi `losowe` są 3 niezależnymi ziarnami (1, 2, 3), `pewne` 1 przebiegiem (deterministyczne; ziarno nie zmienia wyniku, zgodnie z DODATKIEM).

## OBSERWACJE (dane, bez wyroku „błąd/OK”)

1. W trybach manual (rozkazy), AUTO i skip obrońca (Falanga) wygrywa we wszystkich 8 konfiguracjach. Ręczna (rozkazy) daje dystansowi: atakujący traci 4-5 z 10 Łuczników i 5-6 przeżywa z HP 20 i amunicją 11-12 (log: „Archer uciekł z pola bitwy”), AUTO/skip: 10/10 strat. Przyczyny nie diagnozowano (hipoteza: morale/ucieczka po stratach przy rozkazie „atakuj najbliższego”; do potwierdzenia osobnym pomiarem).
2. Wręcz: w trybie z rozkazami obrońca traci 0 jednostek w 4 z 4 konfiguracji; AUTO/skip 0-2. Rundy: ręczna 33-54, AUTO/skip 12-32.
3. AUTO vs skip: „pewne” wrecz — ten sam wynik (HP 351, 0/10) przy 13 vs 12 rundach; dystans pewne — identyczny (HP 382, r8). „losowe”: liczba strat obrońcy identyczna AUTO vs skip we wszystkich 6 konfiguracjach wrecz+dystans; rundy różne przy dystansie (s1 AUTO 9 vs skip 33; s2 12 vs 35; s3 35 vs 12). Hipoteza bez potwierdzenia: skip i AUTO różnią się kolejnością zużycia strumienia losowego przy pocisku dystansowym. Obserwacja z r2 (P1 11 vs 10; P2 10 vs 13) dotyczyła armii mieszanych 28 vs 28 i tu nie jest powtarzana.
4. Kontrola negatywna (manual-null): zwycięzca zmienia się w 2 z 8 konfiguracji (dystans-pewne-s1, melee-losowe-s3: bez rozkazów wygrywa atakujący). Sterownik z rozkazami realnie kształtuje wynik.

## BLOKADY (jawnie)

1. Rozkazy są wydawane wywołaniem metody sceny `_issueBattleAttack(id, queueOnly=true)` (ta sama ścieżka co Shift+LPM), a nie klikiem myszy w płótno (płótno przy zamrożonym rAF nie jest wiarygodne). Spacja i Start są prawdziwymi klawiszami/klikami Playwright. Ograniczenie zostaje.
2. Strategia: „atakuj najbliższego wroga” dla każdej jednostki bez flagi acted. To pomiar tego sterownika, nie „gracza w ogóle”.
3. Wojownik vs Wojownik: NIE ZMIERZONO (addUnit nie wybiera typu; preset bitwa-duza nie zawiera Wojownika; wymaga zmiany gra/src).
4. Przycięcie rosteru: operacja na stanie sceny w fazie rozstawienia (page.evaluate), nie wybór w UI.
5. Bramki referencyjne zmierzone (zarzut 4). Punkt 2 dispatchu (dowód SIGTRAP) bez zmian: nie diagnozowano przyczyny, sterownik z rozkazami użyty zamiast harnessu battle-manual-full-roster-pointer.
6. Obserwacja „acted”: 9 (melee-losowe-s1) i 5 (melee-pewne-s1) jednostko-rund pominięto przez flagę acted; przyczyna w silniku nieobjaśniona.

## TESTY (surowe wyniki)

- tsc: exit 0. logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6 (zob. zarzut 4).
- Pomiar: 32 przebiegi (24 manual/auto/skip + 8 manual-null), errors = 0, brak wpisów `error`. Runda regenerowana w tym samym worktree (build vite z gra/, wyjście poza repo, `vite.js build --outDir <scratchpad>/dist-r4`, src = bf3f65f04).
- Odtwarzalność: porównanie maszynowe starego evidence r3 (08297531d) z regenerowanym JSON: 24/24 przebiegów identycznych (zwycięzca, rundy, straty i HP obu stron, liczba rozkazów). Harness jest deterministyczny.

## RUNDY / NASTĘPNY KROK

RUNDY: obrona r3 (runda 3/5 tematu). Operator r3 (SONNET, uzasadnienie w dispatchu: 2 nieudane rundy Haiku na tym samym punkcie).
NASTĘPNY KROK: Evaluator r4 / Final Control. Decyzje właściciela (poza zakresem tematu): (a) czy balans Falanga vs Hastati/Łucznik (obrońca wygrywa 8/8 w trybach z rozkazami, AUTO i skip) jest zamierzony; (b) czy zachowanie łuczników w ręcznej („atakuj najbliższego”, 5-6 z HP 20 ucieka) jest zamierzone; (c) czy dopuścić zmianę gra/src, aby zmierzyć parę Wojownik vs Wojownik; (d) czy zbadać flagę acted (9 i 5 jednostko-rund).

UWAGI-DLA-ORKIESTRATORA:
- Pliki zmienione tą obroną: gra/tools/live-verify-w3-manual-orders-r3.cjs (perRound, manual-null, usage, trimInfo.before), dyspozycje/.../evidence/w3-manual-orders-10v10-r3.json (regeneracja, 32 przebiegi), ten raport. Nic w gra/src ani gra/data.
- Build do pomiaru: <scratchpad>/dist-r4 (poza repo, nie commitowany). Node_modules w gra/ (ignorowane przez git) zainstalowany przez `npm ci --ignore-scripts`; do sprzątnięcia po integracji.
- Komenda: cd gra; NODE_PATH=/opt/node-tools/node_modules node tools/live-verify-w3-manual-orders-r3.cjs <dist> <out.json> [limit_s]; filtry env W3_ONLY=<id,..>, W3_MODES=manual,auto,skip,manual-null.

DEPLOY/PUSH: NIE WYKONANO
