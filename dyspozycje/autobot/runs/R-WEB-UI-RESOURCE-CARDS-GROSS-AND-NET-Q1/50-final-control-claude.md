# R-WEB-UI-RESOURCE-CARDS-GROSS-AND-NET-Q1 — raport Final Control (Sonnet)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-CARDS-GROSS-AND-NET-Q1
GOAL: w panelu surowców każda karta pokazuje BRUTTO i NETTO na turę; suma kart = nagłówek „Brutto … → netto …”.
ZMIANY/COMMIT: kandydat do integracji `14f242b7e` (potomek bazy `15d0a81a5` — `merge-base --is-ancestor` = tak). Diff vs baza: 8 plików (resource-gross-net.ts nowy, main.ts +import/3 linie, empireDetailPanel.ts, nowy test, poradnik 08, wikiBundle.json, 2 raporty). Brak zmian produkcji/zużycia/balansu/danych. Allowlista zachowana poza main.ts (patrz zarzut 3). Ten raport: osobny commit (tylko ten plik).

## Werdykt per zarzut
| Nr | Werdykt | Uzasadnienie |
|---|---|---|
| 1 plakietka +X vs netto | ODDAL (założenie) + nota dla właściciela | Na żywo plakietka = brutto (Drewno +5, brutto +5, netto +2). Dispatch sam zakładał „plakietka = netto”, co jest nieprawdą w kodzie; „suma kart = nagłówek” wymusza formułę nagłówka. Karta nie jest sprzeczna, co najwyżej redundantna. Opcjonalne ABC: przemianować/ukryć plakietkę. Nie blokuje. |
| 2 brak żywej gry | ODDAL — domknięte przeze mnie | Zbudowałem vite do /tmp, uruchomiłem Chromium `?playtest=mapa&civTest=1`, kliknąłem komórkę „Surowce”: panel pokazuje nagłówek „Brutto +52 → netto −13” i karty. Suma brutto kart 5+2+45+0 = 52, suma netto 2+0+45−60 = −13 — równa nagłówkowi. Brak przewijania poziomego (`ow=false`), 0 pageerror. Surowiec bez produkcji i z zużyciem (Żelazo): „Brutto 0 · netto −60”; bez produkcji i zużycia: bez wiersza („—”). |
| 3 main.ts | ODDAL | Minimalna zmiana (import + 3 linie) wymuszona zakazem drugiej kalkulacji; auto-merge z aktualnym origin/main przechodzi bez konfliktu w main.ts i empireDetailPanel.ts. |
| 4 fixture dyplomacji | ODDAL | Naprawione w d0653de1a (ratePerTurn 9, netto 8); formuła identyczna z nagłówkiem. |
| 5 hotseat / test D kruchy | ODDAL jako NIE_ZMIERZONO | Karty i nagłówek biorą te same wiersze `shortageRows`; testy B/C/M1/M2 wykrywają regresje. |
Żaden zarzut nie wymaga NAPRAW.

## TESTY (surowe wyjście, worktree na 14f242b7e)
- `git diff --check 15d0a81a5 14f242b7e`: exit 0
- `tsc --noEmit`: exit 0
- `resource-cards-gross-net-test.cjs`: 22 pass, 0 fail
- logic-test: LOGIC OK (213/213); tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6 pass 0 fail (wszystkie exit 0)
- Test nowy czerwony na bazie: z konstrukcji (moduł nie istnieje na bazie); mutanty M1/M2 w teście wykrywane.
- Żywy Chromium: patrz zarzut 2 (zrzut: /tmp/fc-gn/live.png, poza repo).

## BLOKADY
Brak blokad kodu. Uwaga integracyjna: `git merge-tree 14f242b7e origin/main` (origin/main = b4d12de7d) daje JEDYNY konflikt w `gra/src/data/wikiBundle.json` (plik generowany). Przy integracji: wziąć wikiBundle z main i zregenerować `node tools/bundle-wiki-for-game.cjs`; po merge ponownie `tsc --noEmit` i test tematu.

UWAGI-DLA-ORKIESTRATORA: (a) ABC opcjonalne o plakietce „+X” (dubluje brutto); (b) dług bazowy 4 testów (resource-usage-breakdown, ui-language-count-renderer, citizen-resource-upkeep, empire-armia-produkcja) poza tematem; (c) wizualny zrzut panelu przy wąskim oknie wykonał Operator (statyczny), żywy zrzut tylko 1600 px.

RUNDY: Final Control r1/5 (temat: runda 1 Operatora + obrona r1)
NASTĘPNY KROK: integracja orkiestratora (merge z main, regeneracja wikiBundle, tsc + test), potem deploy ROBOCZA po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
