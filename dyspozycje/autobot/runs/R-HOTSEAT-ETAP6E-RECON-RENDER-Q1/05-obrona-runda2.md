# R-HOTSEAT-ETAP6E-RECON-RENDER-Q1 — Obrona, runda 2

Evaluator rundy 2 zwrócił jeden zarzut (nr 5): suma §3B „9+10+1+1+1+2 = 21" jest
arytmetycznie błędna (realnie 24) i cząstkowa suma „10" pomija 2 pozycje z własnej
Tabeli B (`_cityRenderOpts().getCiv` 2450-2456, `getCivIconId` 2480-2483).

**PRZYJMUJĘ oba pod-zarzuty, z dowodem:**

```
$ python3 -c "print(9+10+1+1+1+2)"
24
```

Potwierdza to: `9+10+1+1+1+2` rzeczywiście daje 24, nie 21 — czysty błąd
rachunkowy w rundzie 1, niezależny od kompletności składników.

Drugi pod-zarzut również trafny: Tabela B w §3B wymienia 7 pozycji
(`getCiv`, `getCivIconId`, `playerOwnerId`, `syncWorkerFieldOverlay`,
`refreshTerritoryBorderOverlay`, `syncOkolicaOverlay`, 6× `cityRenderer.sync`),
ale cząstkowa suma „10" liczyła tylko 5 z tych grup
(`1+1+1+1+6=10`), pomijając `getCiv` i `getCivIconId` — mimo że oba są opisane w
tabeli jako żywe, odrębne hardkody (inline duplikaty logiki `civTypeForOwner`,
NIE wołające współdzielonego rezolwera). To błąd sumowania (pozycje były już
zinwentaryzowane, tylko nie doliczone), nie brakująca inwentaryzacja.

Przeliczyłem §3B od zera trzema grupami:
- A (funkcje-rezolwery, Tabela A): `1+2+2+2+1+1=9`
- B (WSZYSTKIE 7 pozycji Tabeli B): `1+1+1+1+1+1+6=12`
- C (pozycje spoza tabel: `render/units.ts:5798`, martwy default
  `setSelectionHex`, martwy default `applyFogVisibility`, 2 żywe fallbacki
  `cities.ts:784/803`, fallback `cityOkolicaOverlay.ts:298`): `1+1+1+2+1=6`

```
$ python3 -c "print(9+12+6)"
27
$ python3 -c "print(9+12+1+1+1+2+1)"
27
```

Obie ścieżki liczenia (moje grupowanie A/B/C i grupowanie Evaluatora
`9+12+1+1+1+2+1`) dają tę samą liczbę: **27**.

Zaktualizowałem `01-operator-runda1.md`:
- §3B — pełne przeliczenie od zera z jawnym rozbiciem A/B/C i dowodem
  arytmetycznym, jedna liczba **27**.
- §4 — „16→21/22" zmienione na „27 (§3B)".
- §6 — „~22" (dwa wystąpienia) zmienione na „27".
- §9 — dopisany zarzut 5 (runda 2) do listy korekt, nagłówek sekcji rozszerzony
  na "runda 1 + runda 2", finalne podsumowanie zmienione na „27".

Nie znaleziono innych wystąpień starych wariantów liczby (`grep -n "~15\|~21\|~22\|16→21"`
po edycji — zero trafień poza cytatami historycznymi w §9 opisującymi sam błąd).

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6E-RECON-RENDER-Q1
GOAL: Recon-only kategorii render/kamera Etapu 6 (patrz 00-dispatch.md)
ZMIANY/COMMIT: `01-operator-runda1.md` poprawiony w Obronie runda 2 (§3B/§4/§6/§9,
korekta arytmetyczna sumy 21→27), zero zmian w `gra/`
TESTY: brak (docs-only); dowód arytmetyczny `python3 -c "print(...)"` w treści wyżej
BLOKADY: brak
RUNDY: 2/5 (Obrona wykonana w tej samej rundzie)
OBRONA: 5 -> PRZYJMUJĘ + dowód (python3: 9+10+1+1+1+2=24≠21; pominięte getCiv/getCivIconId
w cząstkowej „10"; przeliczenie A=9+B=12+C=6=27, zweryfikowane dwiema niezależnymi
ścieżkami sumowania)
NASTĘPNY KROK: kolejny Evaluator (runda 3, po Obronie — R-PROC-AUTOBOT.md §3c)
DEPLOY/PUSH: NIE WYKONANO
