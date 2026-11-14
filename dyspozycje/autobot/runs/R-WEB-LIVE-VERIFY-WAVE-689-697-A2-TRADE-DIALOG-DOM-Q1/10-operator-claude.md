# R-WEB-LIVE-VERIFY-WAVE-689-697-A2-TRADE-DIALOG-DOM-Q1 — raport Operatora (runda 1/5)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-A2-TRADE-DIALOG-DOM-Q1
GOAL: Na żywej grze (headless Chromium, zbudowany bundle vite, `?playtest=mapa&civTest=1`) potwierdzić, że okno „Umowa wymiany surowców” (akcja '14') z AI nie przebudowuje węzłów DOM przy dodawaniu pozycji po obu stronach, że obie strony są wypełnialne przed jednym „Zaproponuj”, że pusta strona pokazuje neutralną podpowiedź, oraz zebrać zrzuty przed/po.
BAZA: detached ddc0d8dda (origin/main wskazany w dispatchu jako 75e238e52 — wykonano na kandydacie ddc0d8dda zgodnie z treścią zadania).

## Punkty dispatchu

| Punkt | Wynik | Dowód |
|---|---|---|
| 1. Otwarcie okna z AI (klik akcji 14 w audiencji) | PASS | JSON `trade-live-pre.json` (`points.P1`); overlay `.civ-diplo-basket-overlay` otwarty |
| 2a. Znaczniki przeżywają dodanie po stronie „oferujemy” (give) | PASS | `checks` P2a: box, `.cdb-body-scroll`, `.cdb-col` strony B — identyczność `===` przed/po; expando `__w2a2` obecny |
| 2b. Znaczniki przeżywają dodanie po stronie „oferują” (recv) | PASS | `checks` P2b: te same trzy węzły `===` przed/po |
| 3a. Obie strony niepuste → „Zaproponuj” aktywny | PASS | `checks` P3a (`disabled=false`) |
| 3b. Jeden klik = jedna propozycja | PASS | `tableBefore=0`, `tableAfter=1` (`state().tableLen`); w audiencji 2 wiersze własne (po jednym na stronę); toast „Propozycja na stole — użyj Przyjmij w Punkty wymiany” |
| 3c. Propozycja zawiera obie strony | PASS | `audLabels`: „Drewno” oferowane i „Drewno” żądane znalezione w tekście `.civ-diplo-aud` |
| 4. Neutralna podpowiedź przy pustej stronie | PASS | `hintAfterGive` = „Dodaj, co chcesz dostać w zamian — albo wyślij jako dar”; brak frazy „ryzyko odrzucenia” |
| 5. Zrzuty przed/po, obejrzane | PASS | `shots-pre/01..04*.png` (deviceScaleFactor 1, 1600×1000); opis niżej |

Mutacja (dowód nietautologiczności): `shots-mut/`, `trade-live-mut.json`. Kopia `gra/` z cofniętą poprawką w `morphBasketMarkup` (`basketMorphChildren(...)` zastąpione `box.innerHTML = inner`), zbudowana osobno poza repo. Na tej kopii P2a i P2b dają FAIL (`.cdb-body-scroll` i `.cdb-col` strony B to już inne węzły; box zostaje), P1, P3 i P4 PASS. Czyli kryterium węzłowe rozróżnia wersję poprawną od cofniętej.

## Wynik na czysto zbudowanym kandydacie
Wynik `RESULT tag=pre: checks=9 FAIL=0 pageErrors=0`, `{"P1":PASS,"P2":PASS,"P3":PASS,"P4":PASS,"P5":PASS}`.
Wynik na mutancie `RESULT tag=mut: checks=9 FAIL=2 pageErrors=0`, P2 = FAIL (oczekiwane).
Dodatkowo istniejący test jednostkowy `gra/tools/trade-dialog-no-rerender-test.cjs` (jsdom): `19/19 PASS`.

## Zrzuty — opis (obejrzane)
- 01 `shots-pre/01-okno-otwarte-puste.png`: okno otwarte, obie strony puste („—”), „Dodaj co najmniej jedną pozycję…” pod przyciskiem, „Zaproponuj” nieaktywny. Wybrany chip „Pieniądze”.
- 02 `shots-pre/02-po-dodaniu-oferujemy.png`: po stronie „OFERUJEMY” jest „20 Drewno jednorazowo”; strona „OFERUJĄ” pusta; w podsumowaniu neutralna podpowiedź „Dodaj, co chcesz dostać w zamian — albo wyślij jako dar”; brak ostrzeżenia „ryzyko odrzucenia”.
- 03 `shots-pre/03-po-dodaniu-oferuja-przed-zaproponuj.png`: po obu stronach po „20 Drewno”; panel punktów wymiany pokazuje ostrzeżenia o fair min (wynik zależy od wyceny, nie od tego tematu); „Zaproponuj” aktywny.
- 04 `shots-pre/04-po-zaproponuj.png`: po kliknięciu okno audiencji pokazuje jedną kartę „Umowa wymiany surowców” z „TWOJA PROPOZYCJA” w kolumnie „My oferujemy” i „ONI OFERUJĄ” w kolumnie „Oni oferują” — po „20 Drewno” z każdej strony; „wygasa za 5 tur”.

Uwaga do zrzutów: pojedynczy zrzut nie pokazuje migotania klatka po klatce. Kryterium „brak migotania = brak zastąpienia węzła” zmierzono przez identyczność węzłów `===` i expando, nie przez analizę wideo.

## Zmiany i commit
- Nowy runner: `gra/tools/live-verify-wave-689-697-a2-trade.cjs` (allowlista: `gra/tools/live-verify-wave-689-697-a2-*.cjs`).
- Artefakty: `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-689-697-A2-TRADE-DIALOG-DOM-Q1/` (ten raport, `trade-live-pre.json`, `trade-live-mut.json`, `shots-pre/`, `shots-mut/`).
- Brak zmian w `gra/src`, `gra/data`, `WERSJE.md`, `gra-robocza/`, `rust-port/`. `git diff --check` czysty. Build wykonany do katalogu poza repo (`--outDir` w katalogu sesji); `npm run build`/`dev` w `gra/` nie uruchamiano.
- Hak testowy nie był potrzebny (wszystkie punkty zmierzone przez istniejące `__aiTradeWiringTestDebug`, `__audienceRelTestDebug` i `__eraTestDebug.getToast`).

## Testy
- `vite build` (kandydat) → `dist-trade-w` poza repo, „built in 17.97s / 18s”.
- Runner live, tag pre: 9/9 PASS (`pageErrors=0`).
- Runner live, tag mut (kopia z cofniętą poprawką): P2 FAIL (2 checki), reszta PASS.
- `node tools/trade-dialog-no-rerender-test.cjs`: 19/19 PASS.

## BLOKADY
Brak blokad technicznych. Lista odstępstw od dispatchu, wszystkie zamierzone:
- Baza: dispatch wskazywał origin/main 75e238e52, zadanie wskazywało ddc0d8dda; wykonano na ddc0d8dda (wskazanym w zadaniu). Plik 00-dispatch.md istnieje tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie na origin/main; treść dispatchu wzięto z obu źródeł.
- `gra/node_modules` zainstalowano przez `npm ci --ignore-scripts` w worktree (ignorowane przez `gra/.gitignore`); usuwane po zakończeniu.

## UWAGI-DLA-ORKIESTRATORA
1. Poza zakresem (obserwacja, nie naprawiano): oferta „20 Drewno za 20 Drewno” zostaje wysłana mimo ostrzeżenia w panelu punktów wymiany (fair min 4 PW, oferujesz 2 PW). W oknie audiencji ta propozycja pokazuje „Nie spełnia warunków: Oferta nieuczciwa dla partnera” i przycisk „Przyjmij” jest wyłączony. Czy to zamierzone zachowanie koszyka, decyduje właściciel (zgłoszenie do rejestru, nie do tego tematu).
2. Brak kroku CI/lint w tym temacie; nie dotyczy.
3. Nie zakładano sesji, nie użyto narzędzi tworzących zadania ani sesje (zgodnie z zakazem).

## RUNDY
1/5. Wynik PASS, bez zwrotów do Operatora.

## NASTĘPNY KROK
Evaluator (SONNET) — weryfikacja runnera i artefaktów w tym commicie; ewentualnie Final Control.

DEPLOY/PUSH: NIE WYKONANO
