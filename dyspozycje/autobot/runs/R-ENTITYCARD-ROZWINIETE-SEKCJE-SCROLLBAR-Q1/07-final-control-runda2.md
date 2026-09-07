STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1
ROLA: Final Control, runda 2/5 — Sonnet 5, effort High
GOAL (z `00-dispatch.md`): (A) sekcje „Ulepszenia terenu" i „Zmiany ekonomiczne" karty
technologii domyślnie ROZWINIĘTE, bez klikania. (B) `.entity-card-dialog` z TRWALE WIDOCZNYM
paskiem przewijania, bez polegania na geście scrolla.

## Guard wstępny (§2b)
`git log -1 --oneline` → `dcd4d261` (oczekiwana baza, zgodna z dyspozycją) · `git status --short`
puste — przed i po całej mojej weryfikacji.

## Metoda: orzekam na wytworze, nie na raportach (§3c pkt 3, §16b)

## WERDYKTY

**#2 (bramka tautologiczna dla K3) → ODDAL.**
Sam uruchomiłem naprawioną bramkę: `xvfb-run -a node tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs`
→ **29 pass, 0 fail** (dwa niezależne przebiegi, identyczny wynik). Nie poprzestałem na liczbach
Obrony: `git show a391307f^:gra/src/ui/entityCards/{renderer,technologyAdapter}.ts` do plików
tymczasowych, zdiffowane z drzewem roboczym — dokładnie dwie linie `openDefault` i jeden blok CSS,
zero innych zmian. Zweryfikowałem też, że wewnętrzna rekonstrukcja „PRZED" bramki (regex w pamięci)
jest **bajt-w-bajt identyczna** z realnym blobem Gita (`techPre === gitTech` → true, `rendererPre ===
gitRenderer` → true) — więc pomiar bramki nie jest fabrykowaną mutacją, tylko realnym stanem sprzed
tematu. Poszedłem dalej niż wymagane: **podmieniłem realne pliki na dysku** na wersję `a391307f^`
(kopią pliku, nie `git checkout`), uruchomiłem PEŁNĄ bramkę przeciwko temu stanowi i przywróciłem
oryginał kopią + `git diff --quiet` (czysto). Wynik na realnym starym kodzie: **9 pass, 20 fail** —
(K1a/K1b) sekcje zwinięte, (K5a-d) zero złotych pikseli uchwytu, a stare kryterium **(K3) nadal
PASS** (scrollbarWidth=15, natywny pasek) — to jest dokładnie tautologia z zarzutu, teraz potwierdzona
moim własnym, niezależnym przebiegiem, nie przepisana z raportu Obrony. Nowe kryteria (K5/K6)
poprawnie odróżniają obie wersje; zarzut był trafny i jest naprawiony.

**#5 (stałe nazwy plików tymczasowych) → ODDAL.**
Kod bramki (l. 69-72): `TMPDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'entitycard-rozwiniete-scrollbar-'))`,
a `ENTRY`/`OUTFILE_FIXED`/`OUTFILE_PRE` oraz wszystkie zrzuty PNG leżą pod tym samym `TMPDIR`. Sprzątanie
w `finally` (l. 456): `fs.rmSync(TMPDIR, {recursive:true, force:true})`. Uruchomiłem bramkę 2×: obie
**29 pass, 0 fail**; po obu przebiegach `ls -d /tmp/entitycard-rozwiniete-scrollbar-*` → brak katalogów,
`ls -a gra/tools | grep entitycard-rozwiniete-scrollbar` → wyłącznie sam plik bramki, `git status --short`
puste. Żadnych nieignorowanych artefaktów w `gra/tools/`. Zarzut trafny, naprawa zweryfikowana
bezpośrednio, nie z deklaracji.

**#3 („Pokaż pozostałe N" niezarejestrowane) → ODDAL (jako zarzut wobec Operatora), pozycja
integracyjna.** Potwierdzam rozumowanie: `00-dispatch.md` ALLOWLISTA wymienia wyłącznie
`technologyAdapter.ts` (linie `openDefault`), `renderer.ts` (blok CSS), `gra/tools/*.cjs` i katalog
runu — `dyspozycje/REJESTR-PROSB-I-ZADAN.md` tam nie występuje (sprawdzone osobiście w treści
dispatchu). §14 R-PROC-AUTOBOT.md nazywa to wprost obowiązkiem strony integrującej („zapisz go jako
nowy temat […] — to jest ta sama zasada co C-025 […] widziana od strony orkiestratora"). Operator nie
mógł wykonać tego wpisu bez poszerzenia allowlisty w biegu (§9 poz. 2, §14). Luka jest realna i
potwierdzona przeze mnie w kodzie: `technologyAdapter.ts:195-198` (`previewLimit`,
`UNIT_PREVIEW=3`), `renderer.ts:242-254` (`moreBtn.textContent`). Tekst do integracji (orkiestrator
dopisuje do `dyspozycje/REJESTR-PROSB-I-ZADAN.md` i/lub `PYTANIA-OTWARTE.md`):
„Karta technologii: sekcja »Jednostki« chowa nadmiar za przyciskiem »Pokaż pozostałe N«
(`previewLimit`, `UNIT_PREVIEW=3` w `technologyAdapter.ts`) — dotyczy 5 technologii: Brązownictwo
(20 jednostek), Hutnictwo żelaza (19), Jeździectwo (8), Łucznictwo (6), Obróbka żelaza (4). Sprzeczne
z dosłownym zgłoszeniem właściciela »wszystkie elementy rozwinięte« — wymaga decyzji ABC (usunąć limit
vs. zostawić jako świadomy mechanizm UX przeciw kartom na 20+ wierszy), nie jest oczywistą poprawką."

**#4 (bramka niewpisana do tabeli §6) → ODDAL (jako zarzut wobec Operatora), pozycja integracyjna.**
`grep -n "entitycard-rozwiniete-scrollbar" docs/decyzje/R-PROC-AUTOBOT.md` → brak (sprawdzone przeze
mnie). §9 poz. 4 R-PROC-AUTOBOT.md zabrania wożenia zmian samego procesu w allowliście tematu
produktowego, a `R-PROC-AUTOBOT.md` nie jest w allowliście `00-dispatch.md` — poprawna klasyfikacja
jako zadanie orkiestratora. Aktualną liczbę testów bramki potwierdzam WŁASNYM przebiegiem (nie z
cudzego raportu): **29 pass, 0 fail** (nie 21 — bramka urosła o (K5)/(K6) w rundzie 2). Tekst do
integracji (wiersz do tabeli §6 `R-PROC-AUTOBOT.md`):
„| **Karta technologii — sekcje rozwinięte i pasek przewijania** | `xvfb-run -a node
tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs` | **29/0** — żywy render Chromium/Playwright;
K1-K2 stan startowy sekcji i akordeon ręczny, K3 rezerwacja miejsca paska (tautologiczne samo w
sobie), K4 dowód przyczynowości na kodzie sprzed tematu, K5/K6 analiza pikseli uchwytu (namalowany,
przesuwa się, znika na starym kodzie) — dopiero K5/K6 realnie odróżniają obie wersje. |"

## Pełna regresja (uruchomiona przeze mnie, z `gra/`)

| Bramka | Komenda | Wynik |
|---|---|---|
| TypeScript | `node ./node_modules/typescript/bin/tsc --noEmit` (5.9.3) | EXIT=0, 0 błędów |
| Logika | `node tools/logic-test.cjs` | LOGIC OK (213/213) |
| Drzewo technologii | `node tools/tech-tree-test.cjs` | 19 pass, 0 fail |
| Badania | `node tools/research-test.cjs` | 33/33 ALL GREEN |
| Wymiana jednostek | `node tools/unit-replace-test.cjs` | 13/13 ZIELONE |
| Walka | `node tools/combat-test.cjs` | 6/6 pass |
| Bramka tematu | `xvfb-run -a …-real-render-test.cjs` ×2 | 29/0, 29/0 |

`git diff --stat c03a3f49..HEAD -- gra/ docs/`: dokładnie 3 pliki —
`technologyAdapter.ts` (+2/-2, wyłącznie `openDefault`), `renderer.ts` (+13/-1, wyłącznie blok CSS
`.entity-card-dialog`, `buildSectionEl` nietknięty), nowa bramka `gra/tools/*.cjs`. **Zero zmian w
`docs/`.** Allowlist-only potwierdzone treścią diffu, nie tylko listą plików. Skan sekretów na tym
zakresie diffu — zero trafień. Zero `npm run build`/`dev`, jedyna kompilacja `tsc --noEmit` (C-001).

## Checklista §16b
1. `00-dispatch.md` istnieje, GOAL niezmieniony między rundami — potwierdzone. 2. ID identyczne we
wszystkich plikach runu. 3. Każdy z 4 zarzutów ma obronę i werdykt (wyżej). 5. Licznik: runda 2/5,
Obrona NIE jest osobną rundą (§3a) — zgadza się. 6. Rejestr — patrz notatka integracyjna #3/#4 wyżej,
do wykonania przez orkiestratora. 7. Węzły — nie dotyczy (temat niedzielony). 8. Agregat: brak
`NAPRAW`, brak `DO DECYZJI CZŁOWIEKA` → **PASS**.

ZMIANY/COMMIT: `dcd4d261` (allowlist: `technologyAdapter.ts`, `renderer.ts`, `gra/tools/*-real-render-test.cjs`,
katalog runu) — bez zmian w tej rundzie Final Control poza niniejszym raportem.
TESTY: patrz tabela wyżej — wszystkie uruchomione niezależnie przeze mnie.
BLOKADY: brak.
RUNDY: 2/5.
NASTĘPNY KROK: integracja orkiestratora allowlist-only + dwa wpisy notatki integracyjnej (rejestr dla
#3, tabela §6 dla #4) → `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO
