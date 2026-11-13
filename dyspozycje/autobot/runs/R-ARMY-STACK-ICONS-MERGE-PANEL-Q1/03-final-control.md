# Final Control — R-ARMY-STACK-ICONS-MERGE-PANEL-Q1 — runda 3

WERDYKT: **TAK — zakres gotowy do integracji z main i przygotowania release Robocza.**
DATA: 2026-10-28
BAZA: `origin/main` = `32d27454be213e0e9342435b81c0271999e99513`

## Zakres

Integruję wyłącznie wcześniej zaakceptowany panel łączenia armii wraz z poprawką
marginesu dla krótkiego viewportu i logiem geometrii. Nie obejmuje to innych
modyfikacji obecnych w dirty worktree.

Pliki produktu/testu:
- `gra/src/ui/armyMergePanel.ts`
- `gra/src/ui/armyStackHud.ts` (już w zaakceptowanym commicie `29c98643`; brak zmian w r3)
- `gra/tools/army-merge-panel-scroll-real-render-test.cjs`
- `gra/tools/army-split-ruch-icons-test.cjs` (zaakceptowany commit `29c98643`; brak zmian w r3)

## Niezależny dowód

- Prawdziwy render Chromium przy CSS viewport `600×413` i DPR `1.5`: trzy
  niezależne przebiegi po 26/26 PASS. Wszystkie zmierzone górne/dolne odstępy
  wynoszą co najmniej `27.882828px`, powyżej wymogu 24px.
- Ikony Rozdziel/Połącz: 7/7 PASS.
- TypeScript: PASS.
- Vite build: 916 modułów, PASS.
- `git diff --check` dla zakresu: PASS.
- Test nie zmienia viewportu, DPR ani progu; log surowych pomiarów dodano po
  zaobserwowanej rozbieżności między uruchomieniami. Niezależne odczyty
  przekraczają pełne 24px.

## Granice i bramki

- Final Control nie obejmuje rekrutacji wodza, markerów, ustawienia bitwy, AI ani
  pozostałych zmian w worktree.
- `origin/main` był zweryfikowany zdalnie jako `32d27454`; kandydat jest fast-forward
  względem tej bazy.
- Push do `main` jest dozwolony przez bieżące polecenie właściciela „scal do main”.
- Deploy do Roboczej nie jest wykonywany w ramach tej bramki; przygotowuję osobny
  bundle do późniejszej publikacji.
