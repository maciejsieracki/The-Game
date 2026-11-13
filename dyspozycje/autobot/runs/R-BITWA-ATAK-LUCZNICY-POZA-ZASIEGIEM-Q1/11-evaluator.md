# Niezależny Evaluator — `R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1`

**Werdykt: NOT PASS — wymagany retry Operatora.** Zmiana usuwa potwierdzony błąd
łuczników w Ataku, ale wprowadza regresję wspólnego planera używanego przez doktrynę
Skirmish. Nie rekomenduję integracji przed naprawą i ponowną ewaluacją.

## Niezależne uruchomienia

- `npm run typecheck` — PASS.
- `node tools/battle-ranged-mounted-doctrine-test.cjs` — 9/9 PASS.
- `node tools/battle-melee-attack-doctrine-test.cjs` — PASS; 24v24 Atak i Szturm,
  72 ataki wręcz i 720 HP straty w każdym sprawdzanym wariancie.
- `node tools/battle-manual-choice-contract-test.cjs` — 12/12 PASS.
- `FOCUSED=approach node tools/battle-ranged-approach-regression-test.cjs` — Chromium
  PASS na produkcyjnym `BattleScene`, skład 42v42. Łucznik rozpoczął poza zasięgiem 3,
  przemieścił się przez trzy aktywacje, dystans w trace zmalał 8 → 5 → 3, a w zasięgu
  oddał strzał i zużył amunicję 12 → 11. Równocześnie log zawiera jeden oczekiwany
  brak `/favicon.ico` (404), bez błędów żądań HTTP w teście.
- Kontrola strzału w zasięgu zarejestrowana przez Operatora: jeden strzał, amunicja
  12 → 11, HP celu 1000 → 997. Raport Chromium: `evidence/chromium-ranged-attack-probe-report.json`.

W teście zbliżania HP testowego celu wynosiło 999 przed i po strzale (a po ponownym
uruchomieniu 1000 przed i po). Test zbliżania dowodzi ruchu, wejścia w zasięg i strzału,
ale sam nie dowodzi obrażeń; obrażenia potwierdza osobna kontrola in-range.

## Zarzut blokujący

`gra/src/battle/battleScene.ts` w `_rangedForwardStep` wybiera teraz
`_rangedFiringStepStaysBehindMelee` za każdym razem, gdy strona ma żywą piechotę,
bez względu na doktrynę. Ta funkcja natychmiast zwraca `false`, jeśli efektywna doktryna
nie jest `steady`. Tymczasem `_executeSkirmishDoctrineStep` dla łucznika poza zasięgiem
wywołuje `_rangedAction`, która dochodzi do `_rangedForwardStep`. W rezultacie każdy
skirmishowy łucznik poza zasięgiem, przy żywej własnej piechocie, kończy akcję bez ruchu.
Testy 9/9 nie wykrywają tego przypadku — skirmish w tej suite nie jest sprawdzany.

Wymagane: ograniczyć nową regułę „pozostań za linią” do Ataku albo zachować jawne
dotychczasowe zachowanie innych doktryn; dodać regresję skirmish dla dystansowego celu
poza zasięgiem z własną piechotą w armii. Następnie ponownie uruchomić wymienione bramki
i test Chromium zbliżania.

## Zakres akceptacji

Root cause Ataku jest prawidłowo zidentyfikowany: poza zasięgiem łucznik wpadał do
planera kontaktu piechoty i obchodził własną linię. Nowa ścieżka dla Ataku i mieszany
test produkcyjny są wiarygodne. Brak istotnej regresji Obrony i Szturmu potwierdzają
testy kierunkowe; zgłoszony zarzut dotyczy Skirmish, którego produktowa ścieżka została
niezamierzenie zmieniona. Do czasu usunięcia zarzutu nie przechodzi dalej do Final Control,
integracji, deploymentu ani push.
