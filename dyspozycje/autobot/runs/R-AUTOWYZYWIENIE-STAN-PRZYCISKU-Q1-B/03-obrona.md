# R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B — Obrona Operatora, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B
MODEL+EFFORT: Opus 5, effort high (obrona nie zwiększa licznika rund)
GOAL: stan przełącznika wyżywienia czytelny bez klikania — aktywny świeci, nieaktywny
wygaszony, wszędzie.

## OBRONA

**1 → ODRZUCAM co do wady wytworu; PRZYJMUJĘ, że kryterium zostaje otwarte → kandydat
`DO DECYZJI CZŁOWIEKA` (§3c pkt 2).** Identyczny md5 zrzutów Spichlerza nie jest brakiem
dowodu — jest dowodem. Dwa stany nie istnieją, bo to nie jest przełącznik, co przesądziła
**wcześniejsza decyzja właściciela**, zapisana w wytworze: `empireDetailPanel.ts:176-179` —
„przycisk jest jednorazową akcją »ustaw teraz«, nie przełącznikiem stanu"
(`P-SPICHLERZ-AUTO-ZYWIENIE-PRZYCISK-TEKST-Q1`); bramka pinuje to blokiem (G), 5/5.
Kryterium 4 zakładało przełącznik, którego tam nie ma; runda naprawcza go nie domknie:
`EmpireFoodCityUiRow` (`empireDetailTypes.ts:531-539`) nie niesie `autoWyzywienie`, a producent
snapshotu jest w zakazanym `main.ts`.

**2 → PRZYJMUJĘ. Naprawione.** Trafny: bramka mierzyła 1 z 3 wywołań współdzielonego
`appendIndywidualneToggle` (C-026). Dowód: **90/90** (było 57/57). Doszły realne buildery
`renderEkonomiaStrip` i `renderPodzialPracy` (nie atrapy) na własnych scenach, blok **(C2)**
dla grup Skarbiec+Nauka i Praca (`active`/`off`/`data-stan`/`aria-pressed`), (D) XOR z 4 na **8**
stanów, (E) SEDNO wobec neutralnego `.hbtn` dla obu, (A) kotwice trzech miejsc wywołania
z własnym `rowCls` i hookiem. Nietautologiczność: 4 nowe predykaty (F) dają FAŁSZ na bundlu
z cofniętą poprawką. Zrzuty przegenerowane — `po-miasto-{auto,indywidualne}.png` pokazują teraz
**wszystkie trzy** kontrolki plus „Odniesienie".

**3 → PRZYJMUJĘ.** Trafny: `cs-manager` (`cityPanel.ts:9871`) czyta trwały stan
`cfg.isAutoManageEnabled?.(city.id)` (`cityPanel.ts:11493-11501`, źródło `main.ts:6598`),
a w gałęzi `else` robi tylko `classList.remove('active')` — ta sama wada. Nie zgłosiłem:
błąd mój. Nie naprawiam (C-025 — GOAL mówi o przełączniku **wyżywienia**) i nie wpisuję sam
do `REJESTR-PROSB-I-ZADAN.md` — plik poza allowlistą `00-dispatch.md`. Wpis gotowy do
skopiowania: `NOTA-N3-REJESTR-CS-MANAGER.md`. Sąsiedni `cs-artview` (`cityPanel.ts:11504`)
sprawdzony — tej wady NIE ma, woła samo `onArtView`.

**4 → PRZYJMUJĘ. Naprawione.** `01-operator.md` skrócony 604 → **402 słowa** (`wc -w`), ze
śladem korekty w nagłówku (§13b pkt 2); treść merytoryczna niezmieniona, pierwotny tekst
zostaje w `4b0aeec5`.

## ZMIANY-COMMIT

`gra/tools/autowyzywienie-stan-przycisku-test.cjs`, `01-operator.md`,
`NOTA-N3-REJESTR-CS-MANAGER.md` (nowy), 6 przegenerowanych zrzutów. **`gra/src/**` NIETKNIĘTE**
— `git diff HEAD -- gra/src/ui/cityPanel.ts` pusty.

## TESTY

Bramka **90/90** · tsc **0 błędów** · logic 213/213 · tech-tree 19/19 · research 33/33 ·
unit-replace 13/13 · combat 6/6. Bramki panelu miasta i imperium bez regresu — obrona nie
dotyka `gra/src`. Kryterium 3: po cofnięciu `cityPanel.ts` do `bec25312` bramka daje
`FAILED — pass 39, fail 25`, exit **1**. Uboczna poprawa (nota Evaluatora o stack trace):
nieaktualna kotwica mutacji to teraz FAIL, nie wyjątek.

## BLOKADY

N1 (zarzut 1) — poza allowlistą, do właściciela. N2 — do węzła A. N3 — wpis do rejestru ręką
orkiestratora.

RUNDY: 1/5
NASTĘPNY KROK: Final Control (Sonnet 5, effort high)
DEPLOY/PUSH: NIE WYKONANO
