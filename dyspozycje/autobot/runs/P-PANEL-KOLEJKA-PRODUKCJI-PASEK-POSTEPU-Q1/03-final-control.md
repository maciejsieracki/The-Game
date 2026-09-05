# P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1 — Final Control, runda 1/5

STATUS: PASS
DOMAIN: GAME
TEMAT: P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1
GOAL: pasek postępu w sekcji „Kolejka produkcji" (procent liczbowy zostaje), stopka
rozróżnia znaczenie od paska „Produkcji nauki", pięć przypadków brzegowych, nowa bramka.
GOAL w raporcie = GOAL w `00-dispatch.md`, ID to samo we wszystkich rundach.
ROLA: Final Control · Sonnet 5, effort high · HEAD `87c722e1`, baza `21ae70b6`.

ZMIANY/COMMIT: `1e549cd0` (kod + bramka + dowody) i `87c722e1` (obrona) — obie
allowlist-only: `gra/src/ui/empireDetailPanel.ts`, `gra/tools/panel-kolejka-pasek-postepu-test.cjs`,
`dyspozycje/autobot/runs/<ID>/**`. `git diff 21ae70b6..HEAD` = 12 plików, żaden poza allowlistą.
Bez sekretów, bez `git add -A`, bez `npm run build/dev` (bramka woła `vite.js` z `node_modules`
do `os.tmpdir()` — C-001 zachowane).

TESTY (uruchomione przeze mnie, nie przepisane):
`tsc --noEmit` zielone · bramka tematu **82/0** (dwa przebiegi) · logic **213/213**,
tech-tree **19/19**, research **33/33**, unit-replace **13/13**, combat **6/6**.
Mutacja własna, INNA niż operatorska: `empireBarHtml(Math.round(pct/2), …)` — pasek nadal
JEST w DOM, procent liczbowy bez zmian, zmienia się tylko szerokość. Bramka: **69 pass, 13 fail**,
czerwone (A)/(C2)/(C5)/(D) z pomiarem `getBoundingClientRect` (np. Sparta 32% zamiast 63%).
**Bramka mierzy SZEROKOŚĆ, nie istnienie elementu** — zarzut z briefu nie potwierdza się.
Drzewo przywrócone, `git status --porcelain` pusty.

Weryfikacja wizualna (§9 poz. 6b): własne zrzuty z żywego Chromium `--shots`, md5 **identyczne**
z `dowody/`. Obejrzane: 12 miast, Sparta 63% ≈ 2/3 toru, Qin/Qi 100% bez przelania, Yan/Zhao
pusty tor przy 0%, Wei bez paska i bez procentu, Chu „pusta", Han pasek wygaszony + „wstrzymana",
Lu 7% widoczny kikut. Stopka niesie rozróżnienie znaczenia ORAZ zastrzeżenie N5.

WERDYKTY (odtworzone z `02-operator-obrona.md`; treść wszystkich trzech odtwarza się w całości):
1. **bilans bramek panelu nie domyka się (45 ≠ 43, brak `hud-tooltip…` na liście) → ODDAL.**
   Zarzut był TRAFNY i obrona go nie obaliła — naprawiła. Sprawdziłem naprawę: 43 pliki `.cjs`,
   sześć czerwonych odtworzyło się co do liczby (25/3, 57/3, 113/2, 38/9, 6/2, `hint-toast` rc=1),
   `hud-tooltip…` **16/0** zielone; 36+6+1 = 43. Nie ma czego naprawiać — zarzut zamknięty.
2. **liczba 47/0 nie istnieje po żadnej stronie → ODDAL.** Uruchomiłem
   `sidepanel-blocking-card-cutoff-real-render-test` na HEAD: **47 pass, 0 fail**. Liczba istnieje.
3. **raport terminalny ponad ~400 słów → ODDAL z notą.** Zarzut trafny (585 słów, przyznane),
   ale §11 kwalifikuje przekroczenie jako `PASS-WITH-NOTES`, nie `FAIL`; tekst terminalny przepadł
   z restartem, więc nie ma artefaktu do skrócenia. Nota kosmetyczna → §16b pkt 4: orkiestrator
   zapisuje ją osobno, nie zostawia w raporcie.

BLOKADY: raport Evaluatora przepadł przy restarcie — **nie da się zweryfikować, czy lista
zarzutów była kompletna ani czy Evaluator przeszedł wszystkie 10 punktów §16a.** Kompensuję to
własnym przejściem tych punktów po wytworze (zakres, §9, bramki, brzegi, sekrety, usunięcia,
kolizja z §2b, dowód wizualny, zgodność GOAL) — wynik czysty. Zapisuję to jako lukę, nie ukrywam.

RUNDY: 1/5 (obrona nie jest osobną rundą, licznik nie resetowany).
NASTĘPNY KROK: integracja allowlist-only ręką orkiestratora, potem `READY_FOR_DEPLOY`.
DEPLOY/PUSH: NIE WYKONANO
