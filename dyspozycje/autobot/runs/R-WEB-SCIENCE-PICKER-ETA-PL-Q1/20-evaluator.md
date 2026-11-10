# 20 — Evaluator

STATUS: PASS
DOMAIN: GAME / UI
TEMAT: R-WEB-SCIENCE-PICKER-ETA-PL-Q1
KANDYDAT: `772ddf78276fff4d9790b1036ad63e6261d5dc17` (`772ddf782`)
WYNIK: PASS — brak zarzutów; obrona pominięta.

## Zakres i ryzyko regresji

1. **SCOPE — PASS.** Kandydat zmienia `gra/src/ui/sciencePicker.ts`, dodaje focused test w `gra/tools/science-picker-eta-real-render-test.cjs`, oraz raport Operatora i obraz dowodowy w katalogu tego runu. Są to wyłącznie pliki z allowlisty dispatchu. Zmiana kodu dodaje lokalny formatter i podmienia tekst dodatniej ETA; nie zmienia danych, obliczeń kosztu ani wartości stanu.
2. **NO-SIDE-EFFECT — PASS.** Porównanie `772ddf782^..772ddf782` pokazuje wyłącznie cztery pliki dopuszczone dispatchiem. Współdzielony checkout ma osobny, nieśledzony `10-diagnosis.md` innego runu; pozostawiono go bez zmian.
3. **NO-REGRESSION — PASS w sprawdzonym zakresie.** Żywy test weryfikuje, że przy wszystkich liczbach cel `Łowiectwo`, pula `23 / 100 PN` i pasek `23%` pozostają takie same. Dla stanu `null` pozostaje prompt wyboru, pusty pasek `0%` i brak ETA. Nie wykonano szerszej regresji UI; dla tej lokalnej zmiany dowód ogranicza się do realnego renderera i kontroli pól sąsiednich.

## Niezależne pomiary

- `node ./node_modules/typescript/bin/tsc --noEmit` z `gra/` — PASS, exit 0.
- `node tools/science-picker-eta-real-render-test.cjs /tmp/science-picker-eta-evaluator-live` z `gra/` — PASS, 16/16 asercji, 0 błędów. Niezależnie sprawdzono 0, 1, 2, 5, 12, 21, 22 oraz `null` w działającym DOM w Chromium; Playwright uruchomił zainstalowany systemowy `/usr/bin/chromium`.
- `SCIENCE_PICKER_ETA_MUTATE=1 node tools/science-picker-eta-real-render-test.cjs /tmp/science-picker-eta-evaluator-mutant` — oczekiwany FAIL, exit 1. Mutant przywracający `tur` dla każdej liczby nie przechodzi przypadków 2 i 22; pozostałe asercje, w tym target, pula, postęp i `null`, przechodzą. To potwierdza, że regresja odmiany jest wykrywana przez test.
- `git diff --check 772ddf782^ 772ddf782` — PASS.

## Jakość testu i dalszy krok

**STRICT-EDGE — PASS.** Test obejmuje przypadki wskazane w kryteriach, w tym 0 i null, oraz mutację łamiącą obie formy „tury”. Sprawdza oba widoczne miejsca ETA, brak błędów strony i zachowanie sąsiedniego stanu. **STRICT-PARITY / STRICT-SAVE:** nie dotyczy; zmiana nie zależy od tożsamości gracza/AI i nie dodaje trwałego pola stanu.

Zarówno artefakt testu, jak i źródło w HEAD odpowiadają treści kandydata; kandydat `772ddf782` jest przodkiem bieżącego `HEAD` `e68aa2e2f`. Nie uruchamiano builda ani dodatkowych sąsiednich testów: zmiana jest lokalna, a dispatch wymagał testu rzeczywistego renderera i typechecku, które przeszły. Nie wykonano merge, deployu ani pushu.

NASTĘPNY KROK: Final Control na kandydacie `772ddf782`.
DEPLOY/PUSH: NIE WYKONANO.
