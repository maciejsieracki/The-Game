# Final Control — runda 2 — R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1

STATUS: FAIL
TEMAT: R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1
GOAL: Watki A–F (duplikat panelu PRACA IMPERIUM, nazewnictwo Budynki/Ulepszenia, cap 50% wspolny
dla suwaka #1/#2 ORAZ historycznego automatu #3/#4, naprawa "+N" PULA IMPERIUM, przeprojektowanie
prezentacji panelu "Podzial pracy") — zgodnie z `docs/decyzje/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1.md`,
`dyspozycje/autobot/runs/.../00-dispatch.md` i ECHO wlasciciela (Watek C = A).

## Weryfikacja techniczna (zielona)

- `cd gra && npx tsc --noEmit` — 0 bledow.
- `node tools/praca-limit-50-test.cjs` — 23 pass / 0 fail.
- `node tools/praca-miasto-limit-50-cap-test.cjs` (nowy) — 46 pass / 0 fail.
- `node tools/praca-miasto-limit-50-test.cjs` — 33 pass / 0 fail.
- `node tools/praca-split-ui-test.cjs` — 14 pass / 0 fail.
- `node tools/praca-pula-rate-parity-test.cjs` (nowy) — 3 pass / 0 fail.
- `node tools/praca-na-pieniadz-test.cjs`, `praca-global-default-live-test.cjs` — zielone (regresja).

Logika Watkow A/B/C/D/F sama w sobie jest poprawna i pokryta testami; kosmetyczna uwaga
Evaluatora (martwy `Math.min(100,...)` w lokalnym podglądzie `buildModeHud.ts`) potwierdzona,
nieblokujaca — natywny `<input max=50>` + autorytatywny `clampUlepszeniaPracaPercent` i tak
egzekwuja cap.

## Blokada — branch nieaktualny wzgledem `main`, diff wykracza poza allowlist/ECHO tego tematu

`git merge-base main HEAD` = `acd403803af329b015f1c0e02d1acd54b56d71e`. Ten worktree odgalezil sie
PRZED trzema commitami, ktore main ma dzis, a ktore sa juz WDROZONE
(`3d672ba4 deploy: publish ROBOCZA FALA 304 - pasek-ostrzegawczy r3 ... + popup-odkrycie zloty
scrollbar`):

```
f3c93da6 Merge branch 'autobot/R-UI-POPUP-ODKRYCIE-OVERFLOW-Q1'
ec699da3 autobot(operator-r3): R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1 - 5 podmian CSS Designera
d51aad51 fix(tech): zloty scrollbar w karcie odkrycia technologii (R-UI-POPUP-ODKRYCIE-OVERFLOW-Q1)
```

W efekcie `git diff main..HEAD -- gra/` (ktory Operator/Evaluator ocenili) zawiera TRZY pliki
spoza zakresu tego tematu (nie ma ich w `00-dispatch.md` ani w ECHO C=A), ktore w rzeczywistosci
COFAJA juz wdrozone zmiany innych, zamknietych tematow:

- `gra/src/ui/bottomBarHud.ts` — usuwa komentarze i CSS rundy 3 `.end-turn`/`.et-signal`
  (R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1 runda 3) i przywraca styl rundy 2 (dashed border,
  inset 1.5px, box-shadow:none na disabled).
- `gra/src/ui/sidePanelHud.ts` — usuwa `.sp-blk-alert` (pasek "Wymaga natychmiastowej decyzji",
  runda 3) i przywraca `.sp-event:focus-visible`/`.sp-action-btn:focus-visible` do wariantu
  rundy 2 (inset+outline zamiast czystego `outline`).
- `gra/src/ui/techDiscoveryNotice.ts` — cofa `STYLE_ID` `v3`→`v2` i usuwa wlasny cienki
  scrollbar `.tdn-scroll` (z paczki R-UI-POPUP-ODKRYCIE-OVERFLOW-Q1, `d51aad51`, juz wdrozonej
  w FALI 304), wracajac do `overflow:auto` bez stylizacji.

Zadna z tych trzech zmian nie jest wspomniana w `00-dispatch.md`, `01-operator.md` ani
`04-operator-r2.md` tego tematu — nie sa czescia Watkow A–F i nie maja zwiazku z suwakami Pracy.
To potwierdza, ze to nie swiadoma decyzja tego tematu, tylko martwy stan brancha sprzed integracji
tamtych dwoch tematow do `main`.

Integracja tego brancha w obecnym stanie (merge/rebase do `main` bez naprawy) cofnelaby dwie juz
wdrozone, zamkniete paczki UI (`READY_FOR_DEPLOY` + `deploy: publish ROBOCZA FALA 304`). To realny
regres produkcyjny, nie kosmetyka — nie moge wystawic PASS/READY_FOR_DEPLOY z takim zakresem.

## Decyzja

FAIL. readyForDeploy = false.

## Blokady (jawna lista)

1. Branch `autobot/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1` trzeba zaktualizowac wzgledem
   aktualnego `main` (rebase lub merge `main` do brancha) PRZED integracja, tak zeby diff
   `main..HEAD -- gra/` obejmowal WYLACZNIE pliki Watkow A–F tego tematu
   (`gra/src/game/cities.ts`, `gra/src/main.ts`, `gra/src/ui/cityPanel.ts`,
   `gra/src/ui/empireDetailPanel.ts`, `gra/src/ui/buildModeHud.ts`, `gra/tools/praca-*.cjs`).
2. Po aktualizacji brancha: rozwiazac ewentualne konflikty w `gra/src/ui/bottomBarHud.ts`,
   `gra/src/ui/sidePanelHud.ts`, `gra/src/ui/techDiscoveryNotice.ts` tak, zeby zostal stan
   z `main` (runda 3 pasek-ostrzegawczy + scrollbar popup-odkrycie) — te trzy pliki NIE powinny
   sie w ogole pojawic w diffie tego tematu.
3. Po naprawie: ponownie `npx tsc --noEmit` + pelny zestaw `gra/tools/praca-*.cjs` (oczekuje sie
   zielonych, logika Watkow A–F sama w sobie juz zweryfikowana i poprawna) + swiezy
   `git diff main..HEAD -- gra/ --stat`, zeby potwierdzic zakres = tylko allowlista tematu.
4. Kosmetyczna uwaga Evaluatora (martwy `Math.max(0, Math.min(100, ...))` lokalnego podgladu w
   `gra/src/ui/buildModeHud.ts`, event handlery `input`/`change` suwakow automatu, ~linie
   619/625/657/664) — nie blokuje, mozna posprzatac przy okazji rundy naprawczej.

## Nastepny krok

Powrot do Operatora: rebase/merge brancha na aktualny `main`, ograniczenie diffu do allowlisty
Watkow A–F, ponowna weryfikacja (tsc + testy + `git diff --stat` zakresu), potem ponownie
Evaluator → Final Control.

## Zmiany/commit

Brak zmian kodu w tej rundzie Final Control — wylacznie ten raport, zakomitowany na tym samym
branchu `autobot/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1`. Brak merge do `main`.

```text
STATUS: FAIL
TEMAT: R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1
GOAL: Watki A-F (duplikat panelu PRACA IMPERIUM, nazewnictwo Budynki/Ulepszenia, cap 50% wspolny,
naprawa "+N" PULA IMPERIUM, przeprojektowanie prezentacji podzialu pracy)
ZMIANY/COMMIT: brak zmian kodu; dodano ten raport (05-final-control-r2.md), commit na
autobot/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1
TESTY: npx tsc --noEmit = 0 bledow; gra/tools/praca-*.cjs = wszystkie zielone (logika Watkow A-F
poprawna i pokryta testami)
BLOKADY: branch odgalezil sie PRZED 3 commitami juz wdrozonymi na main (runda 3
R-UI-OBRAMOWKA-PASEK-OSTRZEGAWCZY-Q1 + R-UI-POPUP-ODKRYCIE-OVERFLOW-Q1, FALA 304) - diff
main..HEAD wskutek tego COFA te zmiany w bottomBarHud.ts/sidePanelHud.ts/techDiscoveryNotice.ts,
poza allowlista tego tematu
NASTEPNY KROK: Operator - rebase/merge na aktualny main, ograniczenie diffu do allowlisty A-F,
ponowna weryfikacja, potem Evaluator -> Final Control
DEPLOY/PUSH: NIE WYKONANO
```
