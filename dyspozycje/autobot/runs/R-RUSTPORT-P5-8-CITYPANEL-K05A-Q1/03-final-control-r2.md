STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1
GOAL: Final Control rundy 2: werdykt na zarzuty r1 i obrone (782ef2bb, baza 2270712b).

WERYFIKACJA WLASNA (detached 782ef2bb, pin edb8fb56 poza repo):
- npm ci 0; verify-k05a-copies 10 blokow OK; run-k05a-units 1712 porownan/0 roznic;
  mutate-k05a-units 24 mutacji/23 zabite/1 rownowazna/0 przezylych;
  npm run check 0 (435 plikow, 0 niezgodnych); npm run typecheck 0.
- Allowlista: zero zmian w gra/**, package.json, WERSJE.md; git diff --check czysty.

WERDYKT PER ZARZUT:
1. Zakres: NAPRAW. 8/45 jednostek. Dispatch wymaga calego zakresu K05A i zabrania odraczania z powodu DTO.
   Obrona sama przyznaje 37 odroczonych (T 17, P 1, DOM 19). Odroczenie T/P do "r3 K05A-Z4" to to samo
   odroczenie pod nowa nazwa. Wynik regul jako pola DTO (Z4) jest dokladnie tym zalozeniem, ktore dispatch
   nakazuje przyjac teraz. Argument "T to wywolania logiki" nie uzasadnia odroczenia: P5.13 rozwiazuje to
   polami DTO (dopiski w viewmodel/types.ts) i lokalnymi kopiami typow.
2. T/R/P a DOM: NAPRAW (jak 1). Do K05B moga trafic tylko 19 jednostek DOM. R zrobione, T 17 + P 1 otwarte.
3. verify-k05a-copies: ODDAL (zrealizowane, 10 blokow OK).
4. Osierocone komentarze: ODDAL (usuniete, ORPHAN=0).
5. <HEADER>: ODDAL (pseudo-wpis naglowka importow; blok 5 = 45 jednostek/1500 LOC).
6. Harness/mutacje: ODDAL dla zakresu 8 jednostek (w tym pola DTO city.q/r). Pelne pokrycie zalezy od pkt 1.

NAPRAW w r3 (ten sam ID): dopiski DTO (K05A-Z4) w viewmodel/types.ts, port 17 jednostek T + P
(buildingLocationRequirementMet) w partiach <=8, commit po kazdej, harness + mutacje pol DTO dla kazdej partii,
rozszerzenie verify-k05a-copies. DOM (19) zostaje do K05B.

BLOKADY: brak technicznych.
RUNDY: 2/5.
NASTEPNY KROK: runda 3 do Operatora.
DEPLOY/PUSH: NIE WYKONANO
