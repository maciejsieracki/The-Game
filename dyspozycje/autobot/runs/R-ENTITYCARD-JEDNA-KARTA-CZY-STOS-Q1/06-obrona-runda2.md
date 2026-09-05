# R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 — Operator, OBRONA (runda 2/5, obrona nie zwiększa licznika)

STATUS: DECISION_REQUIRED (zarzut 1 zależy od intencji właściciela; 2 i 3 przyjęte i poprawione)
DOMAIN: GAME
TEMAT: R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1
GOAL: jak ratyfikacja rundy 2 w `00-dispatch.md` (8 kryteriów) — bez zmiany.
MODEL+EFFORT: Opus 5, effort high.
ZMIANY-COMMIT: baza `0a80c8d5` (`git log -1` potwierdzone przed pracą). Allowlista:
`gra/tools/entitycard-sufit-dwoch-kart-test.cjs` (2 asercje przemianowane + **2 NOWE**
pikselowe), `gra/src/ui/entityCards/renderer.ts` (**wyłącznie komentarz** przy
`backdrop.addEventListener` — jawne oznaczenie interpretacji), `04-operator-runda2.md`
(skrócony), ten raport. `git diff --check` czysty; treści oczekiwań w bramkach civpedia
i nested-overlay nietknięte.
TESTY (moje, sekwencyjne): `tsc --noEmit` 0 błędów · `entitycard-sufit-dwoch-kart` **67/67**
(było 65/65; +2 asercje) · single-dialog 25/25 · civpedia-caly-wiersz 85/85 ·
nested-overlay 16/24 (bez zmian, kategoria b) · civpedia-karty-nazwa 27/27 ·
improvement-card-callsites 36/36 · unit-info-card-viewport-height 35/35 ·
tech-discovery-card-real-click 12/12 · logic 213/213, tech-tree 19/19, research 33/33,
unit-replace 13/13, combat 6/6.
BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: Final Control (osobne wywołanie), z zarzutem 1 jako kandydatem `DO DECYZJI CZŁOWIEKA`.
DEPLOY/PUSH: NIE WYKONANO

## OBRONA

**1 → PRZYJMUJĘ co do faktu i co do niezgłoszenia interpretacji; DO DECYZJI CZŁOWIEKA co do
rozstrzygnięcia.** Fakt potwierdzam własnym pomiarem (sonda poza repo, żywy Chromium,
1280×900): `elementFromPoint(346,450)` → `DIV.entity-card-backdrop`, `topIsCardA=false`.
Zarzut jest trafny i nie próbuję go obalić.

Czego wytwór **nie** rozstrzyga: oba zdania ECHO nie dają się spełnić literalnie naraz.
Zmierzyłem to, zamiast twierdzić — mutacja `pointer-events:none` na wierzchnim backdropie
(minimalna literalna realizacja „backdrop B nie zakrywa brzegu A"): hit-test w brzegu daje
wtedy `SPAN.entity-card-row-key`, `topIsCardA=true` (ECHO 1 literalnie spełnione), ale
**klik w brzeg A przestaje cokolwiek robić** (`[unit, tech] → [unit, tech]`) i **klik
w dalekie tło (8,450) zdejmuje NAJSTARSZĄ** (`[unit, tech] → [tech]`). Na HEAD oba te
gesty dają `[unit, tech] → [unit]`, czyli dokładnie ECHO 2. Wybór między „brzeg
przechwytuje klik" a „brzeg jest interaktywny inaczej" to decyzja właściciela o zachowaniu
gry, nie technika.

Zdanie z ECHO 1 uzasadnia zakaz zakrycia słowem **„więc"** (żeby brzeg był klikalny) —
i klikalny jest. Ale to jest moje czytanie, którego w rundzie 2 **nie oznaczyłem jako
czytania**, choć dispatch kazał takie miejsca oddawać właścicielowi. Poprawka: interpretacja
jest teraz jawna w `renderer.ts:550-558` i w nazwie asercji `entitycard-sufit-dwoch-kart-test.cjs:376`,
która wskazuje ten raport zamiast udawać spełnienie ECHO 1.

Warstwa wizualna ECHO 1 jest niezależnie spełniona: piksel w (346,450) = `[12,16,22]`
z backdropem B i `[12,16,22]` po jego zdjęciu, przy tle strony `[4,5,8]` — B tego brzegu
nie przyciemnia, a widać tam kartę A.

**2 → PRZYJMUJĘ, poprawione.** Zarzut odtworzyłem co do liczby: po mutacji
`renderer.ts:662` (`transparent` → `rgba(0,0,0,.62)`) bramka dawała **64/1**, a asercje
„POMIAR WIDOCZNOSCI" i „PRZEZROCZYSTY backdrop" **przechodziły** — mierzyły hit-test,
nie malowanie, i nazwy to zacierały. Naprawa: obie przemianowane na „UKLAD/KOLEJNOSC
HIT-TESTU" (mówią to, co sprawdzają) i dołożone **dwie asercje pikselowe** ze zrzutu żywej
strony — brzeg A z backdropem B i bez niego, oraz brzeg A vs tło strony. Dowód
nietautologiczności nowej asercji: pod tą samą mutacją bramka daje **65/2**, a asercja
malowania czerwienieje z `pxWithB [4,6,8]` vs `pxWithoutB [12,16,22]`. Mutacja cofnięta
(`git checkout`), bramka na czystym drzewie **67/67**.

**3 → PRZYJMUJĘ, poprawione.** `04-operator-runda2.md` skrócony **776 → 450 słów** (z tego
~180 to obowiązkowe pola kontraktu raportu). Treść merytoryczna bez ubytku; wersja pierwotna
zostaje w Gicie pod `f24af77b`, więc ślad nie ginie.
