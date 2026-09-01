TEMAT:  R-KARTY-HISTORIA-I2-Q1
RUNDA:  1/5
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Część 8/17 projektu `R-KARTY-HISTORIA-Q1` — DRUGI (ostatni) z dwóch batchy
treści dla ULEPSZEŃ TERENU (I1 już zintegrowany). Zawiera „Tarasy uprawne" —
encję z ORYGINALNEGO zgłoszenia właściciela, która uruchomiła cały projekt.

## GOAL
Dopisz pole `historia` (lowercase, konwencja `terrain-improvements.json`) do
KAŻDEGO z poniższych 11 ulepszeń w `gra/data/terrain-improvements.json`:

1. Tarasy uprawne
2. Łodzie rybackie
3. Warzelnia soli
4. Fort
5. Droga
6. Droga brukowana
7. Kopalnia miedzi
8. Kopalnia żelaza
9. Kopalnia cyny
10. Kopalnia złota
11. Posterunek (Strażnica)

## WYTYCZNE PISANIA RYSU HISTORYCZNEGO
Identyczne wytyczne jak w `R-KARTY-HISTORIA-I1-Q1`. DLA „Tarasy uprawne"
UŻYJ DOKŁADNIE tego tekstu (już zaakceptowanego przez właściciela osobiście,
NIE parafrazuj, wpisz 1:1):

„Tarasy uprawne to system stopniowanych, murowanych poletek wykuwanych w
zboczach gór, praktykowany od tysięcy lat w Andach, Azji Południowo-
Wschodniej i na Bliskim Wschodzie. Najbardziej znane przykłady zostawili
Inkowie w Peru (m.in. Moray i doliny wokół Machu Picchu, XV wiek), którzy w
ten sposób zdobywali żyzną ziemię uprawną na stromym, górzystym terenie i
jednocześnie zapobiegali erozji gleby. Każdy poziom tarasu miał własny
mikroklimat, co pozwalało uprawiać różne rośliny na różnych wysokościach
tego samego zbocza. Budowa wymagała ogromnego nakładu pracy zbiorowej —
kamiennych murów oporowych, systemów drenażu i nawadniania — ale w zamian
dawała stabilne plony tam, gdzie płaska ziemia była rzadkością."

Dla pozostałych 10 ulepszeń napisz WŁASNY, oryginalny tekst wg tych samych
zasad (~4-6 zdań, REALNA historia, zero mechaniki/identyfikatorów repo).
„Droga" i „Droga brukowana" to KOLEJNE poziomy tej samej infrastruktury —
mimo to każdy wpis musi mieć WŁASNY tekst (np. wczesne drogi ubite/
utwardzone żwirem vs rzymskie/chińskie drogi brukowane — różne technologie,
różne epoki).

Format wpisu w JSON: pojedynczy string, bez HTML, UTF-8 z polskimi znakami
wprost. NIE zmieniaj żadnego innego pola. Waliduj
`jq . gra/data/terrain-improvements.json` przed commitem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `jq . gra/data/terrain-improvements.json` bez błędu składni.
2. Wszystkich 11 wskazanych ulepszeń ma niepuste pole `historia`; „Tarasy
   uprawne" ma DOKŁADNIE tekst podany wyżej (porównanie string-equal);
   pozostałe 10 mają 4-6 zdań, zero identyfikatorów repo, zero mechaniki,
   zero duplikatów (w tym Droga vs Droga brukowana).
3. Żadne INNE ulepszenie i żadne INNE pole tych 11 nie zostały zmienione.
4. Realny, żywy dowód: karta „Tarasy uprawne" w żywej przeglądarce pokazuje
   sekcję „Rys historyczny" z DOKŁADNIE tym tekstem — to jest bezpośrednia
   odpowiedź na oryginalny zrzut ekranu właściciela, priorytet wysoki.
5. `tsc --noEmit` 0 błędów + 5 bramek referencyjnych +
   map-improvement-qualify-test/hodowla-las-test bez regresu.

## ALLOWLISTA — nic poza tym
`gra/data/terrain-improvements.json` WYŁĄCZNIE. Zakazane bezwzględnie:
wszelkie inne pliki w `gra/data/**`, `gra/src/**`, `gra/tools/**`,
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-KARTY-HISTORIA-I2-Q1`, baza JAWNIE
`origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 4 za spełnione bez realnego zrzutu pokazującego
DOKŁADNIE kartę Tarasów z zaakceptowanym tekstem — to jest zamknięcie pętli
od oryginalnego zgłoszenia, musi być bezbłędne.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz
`git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
