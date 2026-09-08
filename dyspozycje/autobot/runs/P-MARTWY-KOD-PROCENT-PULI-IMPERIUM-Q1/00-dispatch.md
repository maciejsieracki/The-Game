STATUS: DISPATCH
DOMAIN: PROCESS
TEMAT: P-MARTWY-KOD-PROCENT-PULI-IMPERIUM-Q1
GOAL: Usuń rozjazd między martwą funkcją `procentPuliImperiumForOwner` w `main.ts` a bramką
`gra/tools/ai-praca-split-parity-test.cjs`, która oczekuje jej wywołania. Kosmetyczny porządek
zgłoszony przez Operatora `P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1` przy okazji niepowiązanej
diagnozy — zero wpływu na rozgrywkę, realna logika podziału działa poprawnie gdzie indziej.

KONTEKST:
- `gra/src/main.ts:5242-5245` (świeżo zweryfikuj numer linii): funkcja
  `procentPuliImperiumForOwner(ownerId)` jest ZDEFINIOWANA, ale ma ZERO wywołań w całym
  `gra/src` (potwierdzone grepem przez orkiestratora) — martwy kod.
  Komentarz nad nią (R-PRACA-JEDEN-PODZIAL-Q1) mówi że to "dopełnienie jedynego podziału
  `ownerDefaultPodzialPracy` do 100%" — realna logika tego dopełnienia najwyraźniej jest dziś
  liczona inline w miejscach, które faktycznie potrzebują tej wartości, nie przez ten helper.
- `gra/tools/ai-praca-split-parity-test.cjs` ma asercję (nazwaną wg raportu Operatora "gracz i
  AI czytają udział ulepszeń jako dopełnienie jedynego podziału"), która dziś PADA — sprawdź
  świeżo dokładną treść tej asercji i czego oczekuje (prawdopodobnie oczekuje wywołania
  `procentPuliImperiumForOwner(0)` gdzieś w `main.ts`, którego nie ma).

ZADANIE:
1. Przeczytaj dokładnie failującą asercję w `ai-praca-split-parity-test.cjs` i ustal co
   faktycznie sprawdza oraz gdzie w `main.ts` żyje dziś REALNA logika dopełnienia
   procent-puli-imperium (ta, którą test miał w zamyśle testować).
2. Wybierz mniejsze ryzyko z dwóch opcji, w zależności od tego co znajdziesz:
   a. Jeśli realna logika jest identyczna co do wzoru z martwą funkcją, tylko inline w innym
      miejscu — podmień to miejsce na wywołanie `procentPuliImperiumForOwner()` (eliminacja
      duplikacji, test zaczyna sprawdzać prawdziwą ścieżkę) — TO jest preferowane rozwiązanie
      jeśli bezpieczne (zero zmiany zachowania, czysty refaktor).
   b. Jeśli funkcja jest faktycznie zbędna (test sprawdzał założenie, które już nie jest
      prawdziwe architekturze) — usuń martwą funkcję i popraw/usuń tę jedną asercję w teście
      tak, żeby sprawdzała rzeczywisty, aktualny mechanizm zamiast nieistniejącego.
   NIE zmieniaj żadnej wartości balansu ani zachowania gry w żadnym z wariantów — to jest
   czysto porządkowy temat.
3. Upewnij się że reszta `ai-praca-split-parity-test.cjs` (pozostałe 21 asercji, dziś zielone)
   nie regresuje.

BINARNE KRYTERIUM SUKCESU: `ai-praca-split-parity-test.cjs` w całości zielone (22/22), zero
zmian zachowania gry/liczb balansu, martwy kod wyeliminowany (albo faktycznie użyty, albo
usunięty razem ze swoim testem). `tsc --noEmit` czysty, 5 bramek referencyjnych zielone.

ALLOWLISTA:
- `gra/src/main.ts` (WYŁĄCZNIE `procentPuliImperiumForOwner` i bezpośrednie miejsce jej
  ewentualnego podłączenia — nie dotykaj innych funkcji podziału Pracy)
- `gra/tools/ai-praca-split-parity-test.cjs`
- `dyspozycje/autobot/runs/P-MARTWY-KOD-PROCENT-PULI-IMPERIUM-Q1/*`
Zakaz `git add -A`. Zakaz zmiany jakiejkolwiek liczby balansu.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz "naprawienia" testu przez samo złagodzenie/usunięcie
asercji bez zrozumienia co faktycznie sprawdzała — jeśli usuwasz asercję, uzasadnij dlaczego
przestała mieć sens, nie tylko że przeszkadzała.

IZOLACJA: worktree `/home/user/wt-martwy-kod-puli-imperium`, gałąź
`autobot/P-MARTWY-KOD-PROCENT-PULI-IMPERIUM-Q1`, baza `origin/main` @ `70f6b3a8`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → integracja bezpośrednio po
PASS (temat PROCESS, kosmetyczny, Final Control nie wymagany — zero zmian zachowania gry).
DEPLOY/PUSH: NIE WYKONANO
