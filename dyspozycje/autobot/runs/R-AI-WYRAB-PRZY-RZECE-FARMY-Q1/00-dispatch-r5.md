# DISPATCH — R-AI-WYRAB-PRZY-RZECE-FARMY-Q1, runda 5 (OSTATNIA)

TEMAT: R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 (runda 5 z 5 — OSTATNIA DOZWOLONA)
DOMAIN: GAME
DATA: 2026-08-28

## KONTEKST

Runda 4 zakonczyla sie BLOCK od Final Control, cztery blokady. Ten dispatch obejmuje
WYLACZNIE dwie z nich — te, ktore da sie naprawic w kodzie bez decyzji wlasciciela.
Pozostale dwie (Z-1 dot. `onlyWorked` na wszystkich profilach, FC-1 dot. recznego przycisku
budowy) sa zadane wlascicielowi rownolegle jako Pytania 3 i 4 — NIE rozstrzygaj ich sam.

Galaz startowa: `autobot/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1-R4` (zawiera juz Zasady 1-3 + R4-Q2
z rundy 4, zintegrowane z aktualnym `origin/main` w probnym scaleniu Final Control).

## KRYTERIA KONCA (obie naprawy wymagane)

### Naprawa 1 — Z-3: `aiSurplusRedirectedOwners` nie persistowany

`aiSurplusRedirectedOwners` (`main.ts:7495`) sterowany przez blok Zasady 3 zmienia
`ownerDefaultPodzialPracy.procentBudynki` (co JEST zapisywane), ale sam znacznik AI
CYWILIZACJI ktore dostaly przekierowanie NIE jest zapisywany. Po save/load w turze
z nadwyzka, gra moze trwale zostac na `procentBudynki=100` → `procentPuliImperiumZBudynkow(100)=0`
→ zero Pracy do puli imperium → zero ulepszen terenu NA STALE dla tego ownera.

1. Zapisz `aiSurplusRedirectedOwners` w sejwie (analogicznie do istniejacych wzorcow
   serializacji zbiorow ownerId w tym samym pliku — sa co najmniej trzy takie wzorce
   z tematow wojny wymuszonej, uzyj ich jako przykladu formatu).
2. Wczytaj go z powrotem przy deserializacji.
3. **Dowod: PRZED naprawa** — zapisz gre w turze z aktywna nadwyzka, wczytaj, pokaz ze
   `procentBudynki` zostaje trwale zablokowany na 100 mimo ze nadwyzka juz minela.
   **PO naprawie** — ten sam scenariusz, `procentBudynki` wraca do normalnego zachowania
   po wczytaniu.
4. Mutacja: usuniecie nowego zapisu/odczytu musi zaczerwienic nowa asercje.

### Naprawa 2 — FC-2: Zasada 3 dotyka miast-panstw

Blok Zasady 3 (`main.ts:28482`) nie wylacza `defensiveCopy` (miasta-panstwa), w
przeciwienstwie do sasiedniego bloku CUDA-AI, ktory to robi jawnie. Skutek: miasta-panstwa
(ktore nie powinny byc czescia tego tematu — dispatch mowil o AI CYWILIZACJI, czyli
glownych rywalach, nie o miastach-panstwach) dostaja przekierowanie budzetu na budynki.

1. Dodaj analogiczny warunek wykluczajacy `defensiveCopy`, wzorem sasiedniego bloku
   CUDA-AI w tym samym pliku (przeczytaj go najpierw, skopiuj wzorzec wykluczenia).
2. Dowod: pomiar PRZED (miasto-panstwo dostaje przekierowanie) i PO (nie dostaje) na
   >= 2 ziarnach z aktywnymi miastami-panstwami w stanie nadwyzki.
3. Mutacja: usuniecie wykluczenia musi zaczerwienic nowa asercje.

## KRYTERIA WSPOLNE

- Piec bramek referencyjnych bez pogorszenia: logic 213/213, tech-tree 19/0, research 33/33,
  unit-replace 13/13, combat 6/6. `tsc --noEmit` zero bledow.
- Bramka `ai4-popyt-obywatele-test` (48/0) i `ai2-heks-po-heksie-test` (35/0) bez pogorszenia,
  z DWIEMA nowymi asercjami (po jednej na naprawe).
- `ai-praca-split-parity-test` 21/1 to ZASTANY regres z `main`, potwierdzony identyczny na
  swiezym `origin/main` — NIE naprawiac, tylko potwierdzic ze sie nie pogorszyl.
- Zero nowych zmian dotyczacych Z-1 i FC-1 — te dwie sprawy czekaja na ABC. Jesli w trakcie
  naprawy okaze sie, ze dotkniecie ich jest niezbedne do naprawy Z-3/FC-2 — STOP, zglos jako
  BLOCK z uzasadnieniem, nie decyduj sam.

## ALLOWLISTA (nic poza tym)

- `gra/src/main.ts`
- `gra/tools/**` (bramki + sondy)
- `dyspozycje/autobot/runs/R-AI-WYRAB-PRZY-RZECE-FARMY-Q1/**`

## GRANICE (naruszenie = FAIL)

- Zakaz `npm run build` / `npm run dev`; build wylacznie
  `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-ai-r5-<rola> --emptyOutDir`.
- Zakaz `npx`, `git add -A`, pushu do `main`, zmian w `dyspozycje/WERSJE.md`.
- **To jest OSTATNIA runda (5/5).** BLOCK/FAIL w tej rundzie oznacza, ze temat NIE zamyka sie
  bez decyzji wlasciciela co do calosci — zglos to jawnie, nie przedluzaj.

## OBIEG

Operator (Opus 5, effort high) -> Evaluator (Opus 5, effort high) -> Final Control (Opus 5,
effort high) -> integracja orkiestratora.

**Final Control obowiazkowo:** `git fetch` + `git log` + SHA + potwierdzenie ze zmiany SA
W COMMITACH. Praca niezacommitowana = BLOKER.
