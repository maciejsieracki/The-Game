STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1
ROLA: Operator (Obrona), runda 2/5, drugie wywolanie tej samej rundy — Opus 5, effort Medium
GOAL: (A) sekcje „Ulepszenia terenu" i „Zmiany ekonomiczne" karty technologii rozwiniete
domyslnie, bez klikania; (B) `.entity-card-dialog` z TRWALE WIDOCZNYM paskiem przewijania.

## OBRONA

**#2 (bramka tautologiczna) → PRZYJMUJE.** Zarzut trafny, naprawiony w tej samej rundzie.
Dowod, ze byl trafny — z mojej naprawionej bramki, nowe kryterium (K6a) mierzy to wprost:
`PASS: (K6a) kryterium (K3) '>= 8' uruchomione na kodzie SPRZED tematu TEZ wypada zielono`,
`[info] PRZED … gutter=15px (PO: 10px)`. Naprawa (`gra/tools/…-real-render-test.cjs`, w allowliscie):
dodane (K5a-K5d) — licznik ZLOTYCH pikseli uchwytu w pasie prawej krawedzi dialogu, uchwyt
krotszy niz dialog, przy `scrollTop=0` przy gorze toru, i **przesuwa sie** po przewinieciu;
oraz (K6a-K6c) — ten sam pomiar na wersji PRZED. Zmierzone: **PO 1378 zlotych pikseli,
PRZED 0**, segmenty uchwytu `[[69,295]]` → `[[264,490]]` po scrollu.
DOWOD, ZE NAPRAWIONA BRAMKA FAKTYCZNIE CZERWIENIEJE NA KODZIE SPRZED TEMATU (mutacja:
`git show a391307f^:gra/src/ui/entityCards/renderer.ts` wgrany na dysk, po pomiarze przywrocony):
```
PASS: (K3) … offsetWidth - clientWidth >= 8px …          <- stare kryterium NADAL zielone
FAIL: (K5a, PIKSELE) … > 200 ZLOTYCH pikseli … — 0
FAIL: (K5b) … — {"thumbLen":0,"dialogH":448}
FAIL: (K5c) … — {"minY":null,"y0":56}
FAIL: (K5d) … — {"topMinY":null,"botMinY":null}
FAIL: (K6c) … — {"pre":0,"post":0}
[entitycard-rozwiniete-scrollbar] 20 pass, 9 fail   (EXIT=1)
```
To jest jednoczesnie dowod, ze zarzut byl sluszny (K3 zielone na starym kodzie) i ze naprawa
dziala (K5/K6c czerwone tylko tam). Na drzewie roboczym: **29 pass, 0 fail**.

**#3 („Pokaz pozostale N" niezarejestrowane) → PRZYJMUJE co do meritum, POTWIERDZAM rozumowanie
Evaluatora co do wykonawcy.** Luka jest realna (`technologyAdapter.ts:195-198` `previewLimit`,
`renderer.ts:242-254` „Pokaz pozostale N”) i wymaga wpisu do rejestru — nie kwestionuje tego.
Rozumowanie o wykonawcy potwierdzam dowodem z dokumentow, nie z wygody: `00-dispatch.md`
ALLOWLISTA wymienia wylacznie `technologyAdapter.ts` (linie `openDefault`), `renderer.ts`
(blok CSS), `gra/tools/*.cjs` i katalog runu — `dyspozycje/REJESTR-PROSB-I-ZADAN.md` tam **nie
wystepuje**. `R-PROC-AUTOBOT.md` §14 sam zamyka ten spor: po zdaniu „zapisz go jako nowy temat
w `REJESTR-PROSB-I-ZADAN.md`" stoi wprost „To jest ta sama zasada co C-025 …, **widziana od
strony orkiestratora zamiast od strony Operatora**" (l. 821-825). **PRZEKAZUJE TO ORKIESTRATOROWI
JAKO ZADANIE INTEGRACYJNE:** przy integracji dopisac do `dyspozycje/REJESTR-PROSB-I-ZADAN.md`
pozycje „karta technologii: sekcja Jednostki chowa nadmiar za przyciskiem »Pokaz pozostale N«
(`previewLimit`, `UNIT_PREVIEW=3`), dotyczy 5 technologii: Brazownictwo 20, Hutnictwo zelaza 19,
Jezdziectwo 8, Lucznictwo 6, Obrobka zelaza 4 — sprzeczne z doslownym zgloszeniem wlasciciela
»wszystkie elementy rozwiniete«, decyzja UX wymaga ABC". Sam tego nie robie: wpis w tej
allowliscie byloby jej poszerzeniem w biegu (§14, §9 poz. 2).

**#4 (bramka niewpisana do tabeli §6) → PRZYJMUJE co do meritum, POTWIERDZAM rozumowanie co do
wykonawcy.** Sprawdzilem sam: `grep -n "entitycard-rozwiniete-scrollbar" docs/decyzje/R-PROC-AUTOBOT.md`
→ brak trafien. §6 ma racje, ze bez wpisu bramka po kilku falach przestanie byc uruchamiana.
Rozumowanie o wykonawcy potwierdzam **cytatem z §9 poz. 4** (l. 596): „**Zmiana samego procesu
nigdy nie jedzie w allowliscie tematu produktowego** — nawet jednolinijkowa. To osobny temat
w domenie `PROCESS`, z wlasnym ID i wlasnym dispatchem". `R-PROC-AUTOBOT.md` nie jest w allowliscie
`00-dispatch.md`. **PRZEKAZUJE TO ORKIESTRATOROWI JAKO ZADANIE INTEGRACYJNE:** dopisac do tabeli §6
wiersz `gra/tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs` z komenda
`xvfb-run -a node tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs` i referencja
**29 pass / 0 fail** (nie 21 — bramka urosla o K5/K6 w tej rundzie).

**#5 (stale nazwy plikow tymczasowych w `gra/tools/`) → PRZYJMUJE.** Zarzut trafny i zweryfikowany
przeze mnie: `git check-ignore -v gra/tools/.entitycard-rozwiniete-scrollbar-bundle-fixed.cjs`
→ `exit=1` (nieignorowany). Naprawa w tej samej rundzie, w allowliscie: wszystkie trzy pliki ida
teraz do `fs.mkdtempSync(path.join(os.tmpdir(), 'entitycard-rozwiniete-scrollbar-'))`, `finally`
kasuje caly katalog (`fs.rmSync(TMPDIR, {recursive:true})`). Konsekwencja techniczna, ktora musialem
obsluzyc: ENTRY poza repo, wiec import `registry.ts` w entry jest teraz ABSOLUTNY (relatywny
`../src/...` rozwiazalby sie wzgledem `/tmp`). Weryfikacja: bramka uruchomiona **2x pelnym procesem**
`xvfb-run -a node tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs` → **29 pass, 0 fail**
oba razy; `ls -a gra/tools | grep entitycard-rozwiniete-scrollbar` → tylko sam plik bramki, zero
artefaktow; `ls -d /tmp/entitycard-rozwiniete-scrollbar-*` → 0 katalogow. Efekt uboczny na plus:
meta-bramka `bramki-tmpdir-unikalnosc-test.cjs` skanuje teraz **69** plikow z `tmpdir` (wczesniej 68) —
ta bramka weszla pod zasieg istniejacego straznika, wiec luka z zarzutu #5 jest juz pilnowana
maszynowo, nie tylko naprawiona.

## ZMIANY/COMMIT

Wylacznie `gra/tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs` (+130/-16) oraz ten
raport. `gra/src/` **NIETKNIETE** — zaden z zarzutow nie kwestionowal `a391307f` w `gra/src/`.
`git diff --check` czysty, bez `git add -A`.

## TESTY (moje, tej rundy, po naprawach — wyniki realne)

| Bramka | Wynik |
|---|---|
| `xvfb-run -a node tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs` (przebieg 1) | **29 pass, 0 fail** |
| to samo, przebieg 2 | **29 pass, 0 fail** |
| to samo, z `renderer.ts` SPRZED tematu (mutacja) | **20 pass, 9 fail, EXIT=1** — dowod nietautologicznosci |
| `node ./node_modules/typescript/bin/tsc --noEmit` | `TSC EXIT=0`, 0 bledow |
| `node tools/logic-test.cjs` | `LOGIC OK (213/213)` |
| `node tools/tech-tree-test.cjs` | `tech-tree-test: 19 pass, 0 fail` |
| `node tools/research-test.cjs` | `PASSED: 33 / FAILED: 0 / TOTAL: 33 · ALL GREEN` |
| `node tools/unit-replace-test.cjs` | `WSZYSTKIE TESTY ZIELONE (13/13)` |
| `node tools/combat-test.cjs` | `COMBAT TEST: 6/6 pass` |
| `node tools/bramki-tmpdir-unikalnosc-test.cjs` | `przeskanowano 69 plikow z tmpdir` · `PASS=3 FAIL=0` |
| `node tools/entity-card-contract-test.cjs` | `75 pass, 0 fail` |

Zero `npm run build`/`npm run dev` (C-001, §9 poz. 1).
§0c: `grep -nE 'STATUS:[[:space:]]*\*{0,2}OTWARTE' dyspozycje/PYTANIA-OTWARTE.md` → 72 trafienia;
w tej rundzie niczego nie rejestrowalem (patrz #3/#4 — poza allowlista).

## BLOKADY: brak

## RUNDY: 2/5

## NASTEPNY KROK
Final Control (Sonnet 5, effort High) orzeka per zarzut. Do integracji orkiestratora — dwie
pozycje przekazane wyzej: wpis rejestrowy z #3 i wiersz tabeli §6 z #4 (referencja 29/0).

DEPLOY/PUSH: NIE WYKONANO
