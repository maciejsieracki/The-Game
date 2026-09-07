# P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1 — Final Control, runda 1

MODEL+EFFORT: Opus 5, effort high · 2026-09-06.
GUARD §2b: HEAD `7c7e1619` = oczekiwany, `git status --short` PUSTY. Panel md5
`b122876f…` przed i po WSZYSTKICH moich mutacjach; każda cofana KOPIĄ pliku
(`/scratchpad/panel.orig.ts`), nigdy `git checkout`. Drzewo czyste na koniec.

## Weryfikacja niezależna (odtworzona, nie przepisana)

**Zarzut 4 — PRZYJMUJĘ Obronę → ODDAL.** Odtworzyłem mutację Evaluatora sam:
usunięcie `pendingScrollSection = null;` z `render()` (`empireDetailPanel.ts:4002`).
Bramka SPRZED poprawki (`git show HEAD~1:…`, uruchomiona w lustrze) → **OK 57/57,
ślepa**. Bramka PO poprawce → **57/1**, czerwieni się dokładnie nowa asercja
`S4 (LUKA Z RUNDY 1): pendingScrollSection WYZEROWANE po zuzyciu`. Asercja nie jest
tautologiczna, luka realnie zamknięta.

**Zarzut 5 — PRZYJMUJĘ Obronę → ODDAL.** Komentarz przy `safeRun()` faktycznie
przepisany (diff `7c7e1619`, +10 linii): gwarancja zawężona do licznika samego
`safeRun`. Sprawdziłem MERYTORYCZNIE, nie tylko obecność: dołożenie modułowej
`function scrollTarget()` daje **53 asercje (33/20)**, nie 57 — teza „liczba nie zależy
od wyniku" jest obalona tak, jak opisuje korekta. Rozjazd wobec cytowanego w komentarzu
`34/19` to inny korpus mojej funkcji; suma 53 identyczna, teza nośna potwierdzona.

**Zarzut 2 — PRZYJMUJĘ Obronę → ODDAL.** `renderDefaultPodzialPracySection()` nie
istnieje w `gra/src` (jedyny ślad: komentarz `empirePanelSectionMap.ts:102`). Trafny
powód zapisany w Obronie i w ratyfikacji; nieścisłe brzmienie w `01-operator` zostaje
jako zapis historyczny rundy — raportów wstecz się nie przepisuje.

**Mutacje własne (5, wszystkie inne niż Operatora i Evaluatora):** M2 wyciek innej sekcji
(`= 'kultura'`) → **56/2**; M3 `block === 'all'` → `!==` → **52/6**; M4 zamiana kolejności
(zerowanie przed odczytem) → **55/3**; M5 rAF → wywołanie synchroniczne → **56/2**;
M6 modułowa `scrollTarget()` → **33/20**. Wszystkie złapane.

**Ratyfikacja (1, 3, 6) spójna z worktree:** `git diff 094be1db..HEAD -- gra/src` = 0 plików;
`24456a72` przodkiem bazy (potwierdzone); ujawnienie „PRZED" w `dowody/README.md:24-27`;
pięć czerwonych odtworzonych co do liczby (econ-slider 57/3, obywatele 113/2,
sliders-always-visible 6/2).

---

STATUS: PASS
DOMAIN: GAME
TEMAT: P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1
GOAL: sąd Final Control nad rundą 1 — zarzuty 2/4/5 zweryfikowane niezależnie, ratyfikacja
orkiestratora (1/3/6) potwierdzona jako spójna ze stanem worktree.
ZMIANY-COMMIT: `dyspozycje/autobot/runs/P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1/04-final-control-runda1.md`
— ten raport. Kodu nie zmieniałem.
TESTY: `empire-panel-moc-scroll-preserve-test.cjs` **58/58 exit 0** · porównanie etykiet
57 vs 58: **0 utraconych, 1 dodana** · `tsc --noEmit` exit 0 · logic 213/213 · tech-tree 19/19 ·
research 33/33 · unit-replace 13/13 · combat 6/6 · mutacja zarzutu 4: stara bramka 57/57 ślepa,
nowa 57/1 · 5 mutacji własnych, wszystkie czerwone.
BLOKADY: brak. Pięć pre-istniejąco czerwonych bramek rodziny — poza tym tematem, osobny
temat `P-BRAMKI-EMPIRE-PANEL-PIEC-CZERWONYCH-ZASTALE-Q1`.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora → `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO
