# R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2 — 05-evaluator (runda 2/5)

STATUS: ZARZUTY (0) — bez werdyktu PASS/FAIL, §3c pkt 1; lista pusta → od razu Final Control
DOMAIN: GAME
TEMAT: R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2
MODEL+EFFORT: Sonnet 5, effort high
GOAL: zgodny z ratyfikacją R2-1 (§16a pkt 9, bez rozjazdu) — `morale_startowe =
max(fleeMorale + epsilon, morale_bazowe × (1 − spadek))`; praca rundy 1 utrzymana.

ZMIANY-COMMIT: baza `36f40c7d`, commit `9d45d9b7`, 4 pliki (266+/3−), wszystkie w allowliście.
`auto-battle-power.ts`, `auto-battle-params.json`, `main.ts`, `WERSJE.md`, `docs/decyzje/**`,
`playbook.json` — 0 zmian. `git diff --check` czysto, brak sekretów, drzewo czyste.
`e356d144` (runda 1) jest przodkiem HEAD; reset flagi `battleScene.ts:9230` na miejscu.
Nie pushowano (`git branch -r --contains 9d45d9b7` puste).

## ZARZUTY: brak

Po realnym sprawdzeniu 10 punktów §16a — bramki uruchomione samodzielnie, źródło zmutowane
czterokrotnie, dane przeliczone niezależnie od bramki.

TESTY (uruchomione przeze mnie, nie streszczone z raportu):
- `walka-morale-przewaga-mocy` **123/123** exit=0; `walka-jeden-kontratak` **24/24** exit=0;
  `tsc --noEmit` 0 błędów.
- Referencyjne: logic 213/213, tech-tree 19/19, research ALL GREEN, unit-replace 13/13,
  combat OK. Kryt. 8: battle-roster 7/7, battle-summary OK, battle-hp-display 7/7,
  teren-walki-etapy 33/33, army-hunger-combat 13/13 — wszystkie exit=0.
- **(i) 71 rekordów, nie próbka — DOWÓD Z MUTACJI.** Własnym odczytem `units.json`: 75 rekordów,
  71 z obiema kolumnami morale (4 pominięte to machiny oblężnicze z pustym „Morale ucieczki",
  `isNeverRout`). Mutacja sabotująca WYŁĄCZNIE rekordy `mb=100` (spoza czwórki z ratyfikacji):
  CZĘŚĆ G czerwienieje i wymienia **40 nazw** — pętla obejmuje cały zbiór. Wariant bez weterana
  jest faktycznie najtrudniejszy (`veteran.ts:405,411`: mb w górę, fm w dół).
- **(ii) `moraleMax`/`fleeMorale` nietknięte.** W całym diffie 0 przypisań (jedyne trafienie to
  komentarz). Mutacja dopisująca `u.moraleMax = …` / `u.fleeMorale = …`: **108/123**, exit=1,
  8 asercji czerwonych (D1, D2, ułamek strony, CZĘŚĆ F, asercje strukturalne) — kryterium 4
  rundy 1 ma zęby.
- **(iii) tabela GOAL 2 bez zmian.** Przeliczona niezależnie: r=1,5/2/3/5/10 → 91/85/76/65/50,
  klamp nieaktywny (baza 100, fm=22 = mediana `units.json`, potwierdzona). Mutacja podnosząca
  podłogę o 45: **czerwone `r=5` i `r=10`** — CZĘŚĆ I realnie mierzy.
- Mutacja kryterium 7 (cofnięty sam klamp): **113/123**, exit=1, dokładnie cztery rekordy
  (Wojownik 50/22, Łucznik 40/25, Zwiadowca 30/25, Wojownik z mieczem i tarczą 60/22).
  Po przywróceniu 123/123, exit=0.
- §16a pkt 4 (brzegi): `save.ts` nie serializuje morale — brak ekspozycji save/load. `RuntimeUnit`
  i `effectiveDefenderM` nietknięte (zakaz „morale na mapę" utrzymany). Machiny oblężnicze
  (`mb=100/fm→25`): przy suficie 35 > 26 — klamp dla nich **nigdy nie odpala**, więc nie osłabia
  kary jednostkom `neverRout`. `mb <= fm` nie występuje w danych; `Math.min(u.morale, …)` chroni
  przed PODNIESIENIEM morale.
- Bundle `.\*-bundle.cjs` są gitignorowane i regenerowane — zawierają już `epsilon_ponad_flee: 1`.

BLOKADY: `map-field-battle-test.cjs` exit=1, `TypeError: import_meta.glob is not a function` —
potwierdzone przeze mnie, znana INFRA, osobny temat. Nie defekt tej pracy.

UWAGA POZA LISTĄ ZARZUTÓW (nie jest punktem §16a, więc nie dostaje numeru — §3c pkt 1):
`04-operator-runda2.md` ma 555 słów wobec orientacyjnych ~400 z §11. Treść jest destylatem
(bez diffów, logów i stack trace'ów); kwalifikacja `PASS-WITH-NOTES` należy do Final Control.

RUNDY: 2/5
NASTĘPNY KROK: Final Control (Sonnet 5, effort high) → `06-final-control-runda2.md`.
Lista zarzutów pusta → obrona Operatora nie jest potrzebna (§3c pkt 1).
DEPLOY/PUSH: NIE WYKONANO
