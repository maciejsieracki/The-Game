# R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — Final Control, runda 2

STATUS: PASS
DOMAIN: GAME
TEMAT: R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1
GOAL: niezależna weryfikacja całości — bramka `eliminacja-lup-kwoty-test.cjs` przepisana
na `reportRows` bez osłabienia, crash naprawiony, dowód mutacyjny prawdziwy, allowlista
dotrzymana.

## Metoda

Weryfikacja od zera we własnym uruchomieniu worktree `/home/user/wt-miasta-zdobycie-raport`,
gałąź `autobot/R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1`, HEAD `d9778076`, baza `99d6bcf0`.
Nie ufano raportom Operatora/Evaluatora — każdy wynik odtworzony niezależnie.

## Zakres zmian (diff 99d6bcf0..HEAD)

`git diff --stat` pokazuje wyłącznie:
`gra/tools/eliminacja-lup-kwoty-test.cjs` (396 zmian) i
`dyspozycje/.../04-operator-runda2.md` (nowy). `git diff -- gra/src/main.ts
gra/src/game/capital-capture.ts gra/src/ui/cityCaptureNotice.ts` = **0 linii** — potwierdzone
bezpośrednio, te trzy pliki NIETKNIĘTE.

## Bramki (uruchomione osobiście)

- `eliminacja-lup-kwoty-test.cjs` — **35 passed, 0 failed, exit 0**.
- `miasto-zdobycie-raport-test.cjs` — **95 passed, 0 failed**.
- `tsc --noEmit` — **0 błędów**.
- Referencyjne: logic **213/213**, tech-tree **19/19**, research **33/33**,
  unit-replace **13/13**, combat **6/6**.
- Rodzina capture/elim: capital-capture **86/86**, elimination-toast-merge **54/54**,
  oblezenie **27/27**, post-capture-law **25/25**.

## Zliczenie asercji (niezależne od raportu Operatora)

Policzono programowo wywołania `ok(`/`eq(` w treści testu (z wyłączeniem definicji funkcji
`eq`, która sama zawiera jedno `ok(`): stara wersja (`git show 99d6bcf0:...`) = **24**
call-site'y; nowa = **35**. Runtime potwierdza: 35 linii `OK:`/`FAIL:` w wyjściu. Zgodne
z deklaracją Operatora (24→35), policzone od zera, nie przepisane z jego raportu.

## Dowód crasha na starej wersji (odtworzony niezależnie)

Uruchomiono starą wersję bramki (z `99d6bcf0`) przeciw DZISIEJSZEMU `main.ts`: twardy
`ReferenceError: eliminatedDetails is not defined` w `renderEliminatedDetails`, proces
kończy się bez podsumowania (Node stack trace, nie `N passed, M failed`). Potwierdza to,
że naprawa nie jest fikcyjna — problem był realny i nowa wersja go usuwa.

## Własne mutacje (3, niezależne od mutacji Operatora M1–M3)

Punkt startowy zawsze czysty `git status --porcelain` (puste), po każdej mutacji
przywrócono plik z kopii i potwierdzono ponownie czysty status oraz 35/0 i 95/0.

1. **Podmiana kwoty w miejscu wywołania eliminacji** (`main.ts:26606`,
   `zloto: Math.floor(outcome.skarbiecPrzejety)` → `zloto: 0`): **27 passed, 8 failed**
   (1d, 2a, 2a-kontrola, 2c, 2c-kontrola2, 2d, 4e, 4f). Bramka faktycznie mierzy mapowanie
   kwoty w `main.ts`, nie tylko obecność buildera.
2. **Usunięcie jednego z dwóch wycinków** (zepsucie markera `BLOK CZYSTY: KONIEC` na
   `KONIECXX`, symulacja utraty wycinka): **11 passed, 24 failed, exit 1, bez wyjątku** —
   podsumowanie wypisane normalnie. Potwierdza odporność (naprawiony crash) pod mutacją
   INNĄ niż testowana przez Operatora (M3 psuł nazwę funkcji, ja zepsułem marker).
3. **Zmiana etykiety** (`main.ts:1411`, `label: 'Złoto ze skarbca'` →
   `'Zloto ZMIENIONE'`): **30 passed, 5 failed** (2a, 2c, 2d, 4e, 4f — `rowFor()` po etykiecie
   przestaje trafiać wiersz). Dowodzi, że dopasowanie po etykiecie nie jest tautologią —
   zależy od realnego tekstu w `main.ts`, nie od stałej w teście.

Po każdej mutacji: przywrócenie pliku, `git status --porcelain` puste, ponowne 35/0 i 95/0.

## Ocena §16a (10 punktów, skrót)

Cel bramki niezmieniony (kwoty konkretne, nie ogólniki); nośnik zmieniony zasadnie (GOAL 2
wymusza usunięcie literału, który stara bramka wycinała); mapowanie 1:1 sprawdzone z
raportem Operatora i zgodne; brak martwych asercji (36 wywołań źródłowych − 1 wewnątrz
definicji `eq` = 35, każde faktycznie egzekwowane w runtime); crash naprawiony i
zweryfikowany na starej wersji; trzy własne mutacje (różne od operatorowych) czerwienieją
bramkę we właściwych miejscach i wracają do zera po cofnięciu; zero zmian poza allowlistą;
zero regresu w rodzinie referencyjnej i capture/elim.

## BLOKADY

Brak. Żaden nowy defekt nie znaleziony.

RUNDY: 2/5
NASTĘPNY KROK: integracja allowlist-only ręką orkiestratora (allowlista: bramka + runs/**),
potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
