# Weryfikacja surowych danych Operatora (Evaluator, runda 1)

Regula przeciw samooszukiwaniu, punkt (a): **nie wolno przepisac liczb Operatora.**
Ten plik nie jest przepisaniem — jest **przeliczeniem** jego liczb z jego surowych
zrzutow JSON wlasnym kodem Evaluatora. Odpowiada wylacznie na pytanie: czy liczby
w `01-operator.md` faktycznie wynikaja z `dowody/*.json`. Wlasny, niezalezny pomiar
Evaluatora jest w `pomiar-ev-*.md` / `podsumowanie-ev.json`.

## Brama AI -> gracz (`gatesVsPlayer`)

| ziarno | n | rw min | rw mediana | rw max | rw >= progSila | score < progRel | oba naraz | min(score-100*rw) | zaobserwowane progSila | progRel |
|---|---|---|---|---|---|---|---|---|---|---|
| 111 | 174 | 0,486 | 0,730 | 0,799 | 174 | 0 | **0** | +48,21 | {0,38} | {30} |
| 222 | 211 | 0,500 | 0,793 | 0,976 | 211 | 0 | **0** | +18,01 | {0,38 · 0,6} | {30} |
| 333 | 206 | 0,500 | 0,625 | 0,935 | 206 | 0 | **0** | +18,07 | {0,38 · 0,6} | {30} |

**Zgodne co do cyfry z tabelami §3 raportu Operatora.** Zero rozbieznosci.

## Stan koncowy przebiegow bazowych

| ziarno | tur | par w stanie wojny (kiedykolwiek) | rekordow `stoneCand` | `pending` kiedykolwiek niepusty | wpisow `warEventLog` | z tego o wojnie | zwisow tury (`turnLog`) | mediana tury |
|---|---|---|---|---|---|---|---|---|
| 111 | 60 | **nie** | 0 | **nie** | 8 | **0** | 0 | 19,6 s |
| 222 | 60 | **nie** | 0 | **nie** | 8 | **0** | 0 | 18,6 s |
| 333 | 60 | **nie** | 0 | **nie** | 8 | **0** | 0 | 21,4 s |

## Mutant M1 Operatora (ziarno 111, 33 tury)

| miara | wartosc z jego JSON |
|---|---|
| rekordow z niepustym `pending` | 286, pierwsza tura **20** |
| rekordow z wybranym celem | 81 |
| wybrane cele | 8→36 (14) · 15→1 (14) · 22→29 (14) · 29→22 (13) · 1→15 (13) · 36→8 (13) |
| owner 0 w `aiOwnerList` | **0 / 81** |
| owner 0 w `stoneCandidates` | **0 / 81** |
| `stoneForceWarActiveByPairKey` kiedykolwiek niepusty | **nie** |
| par w stanie wojny | **0** |
| AI z relacja z graczem | wylacznie 43, 44, 45 |

**Zgodne co do cyfry z §5 i §6 raportu Operatora.** Zero rozbieznosci.

## NOTA E1 — jedno nadmiernie ogolne zdanie Operatora

Raport Operatora (§0, Z5) pisze: „**Zmierzone: 0/6 glownych AI mialo kontakt z graczem**".
To jest prawda **wylacznie dla przebiegu mutanta M1** (ziarno 111, 33 tury). W jego
wlasnych przebiegach BAZOWYCH tak nie jest:

| ziarno | glowne AI, ktore gracz odkryl | od tury | `isCityState` w tych turach | miast AI | rw min/max wobec gracza | **min `score`** | prog |
|---|---|---|---|---|---|---|---|
| 111 | brak | — | — | — | — | — | 30 |
| 222 | **owner 8** (37 ocen) | 24 | true | 8–10 | 0,927 / 0,976 | **110,7** | 30 |
| 333 | **owner 15** (32 oceny) | 29 | true | 10 | 0,886 / 0,935 | **106,7** | 30 |

Skutek dla wniosku: **zaden** — wojna i tak nie wybucha. Ale przyczyna jest w tych
dwoch przypadkach INNA niz Z5: te AI **nie byly** w warstwie `pre_contact`, ich komendy
nie byly kasowane; zablokowal je warunek relacji (Z2). To wzmacnia Z2 i oslabia
sformulowanie Z5 („wojny AI↔AI sa niemozliwe poza zasiegiem wzroku gracza" pozostaje
prawda; „0/6 glownych AI mialo kontakt" — nie).

Dodatkowo te dwa wiersze sa **najlepsza ilustracja sprzecznosci Z2 w calym audycie**:
AI 13–40x silniejsza od gracza, kontakt nawiazany, warstwa pelna — i `score` = 107–111
przy progu 30. Im AI silniejsza, tym **dalej** jej do wypowiedzenia wojny, bo ta sama
liczba (respekt) jest jednoczesnie miara przewagi i skladnikiem relacji.
