# R-HOTSEAT-ETAP6E-RECON-RENDER-Q1 — Evaluator, runda 3

Niezależna weryfikacja poprawki Obrony rundy 2 (`c5f70632`).

**Arytmetyka (świeże `python3`, nie przepisane z raportu):**
- A: `1+2+2+2+1+1` → 9
- B (7/7 pozycji Tabeli B): `1+1+1+1+1+1+6` → 12
- C: `1+1+1+2+1` → 6
- A+B+C: `9+12+6` → 27
- grupowanie alternatywne: `9+12+1+1+1+2+1` → 27

Obie ścieżki potwierdzone niezależnie, zgodne z raportem Obrony.

**Spójność w dokumencie (świeży `grep`):** „27" występuje w §3B (linie 74, 93,
95), §4 (linia 117, jako odniesienie „poza sumą 27"), §6 (linia 166, „moich 27
pozycjach") i §9 (linie 215-220, finalne podsumowanie). Wszystkie pozostałe
wystąpienia „16"/„21"/„22" w pliku (`grep -n '\b16\b\|\b21\b\|\b22\b'`) są albo
cytatami historycznymi w cudzysłowie opisującymi sam błąd (§3B linia 76, 81, 96;
§9 linia 211, 217), albo niezwiązane z sumą render (linia 131: „21 użyć" ME() —
inna liczba, inny kontekst). Zero żywych, nieujednoliconych deklaracji sumy.

**Weryfikacja treściowa Grupy C:** sprawdzono `Read gra/src/render/units.ts:5798`
— pole `ringStanceForOwner: (ownerId) => ownerId === 0 ? 'own' : 'hostile'`,
zgodne z opisem z rundy 1 (§2, potwierdzone też w oryginalnym commit `7061363f`:
ten sam hardkod był tam już policzony w sumie „16"). Pozycja nie jest nowo
dodanym, niepopartym elementem — jest ciągła od rundy 1, tylko skrócony opis w
rekapitulacji §3B rundy 2 nie powtarza pełnego opisu z §2 (styl, nie błąd).

**Ślad zmiany 16→27:** 16 (runda 1) + 4 (poszerzony grep §2: applyFogVisibility
default, 2× fallback `cities.ts`, fallback `cityOkolicaOverlay.ts:298`) + 1
(`syncOkolicaOverlay` 5372) + 6 (pozostałe wywołania `cityRenderer.sync`) = 27.
Rachunek zamyka się dokładnie, bez luk i bez nadliczenia.

**Commit:** `c5f70632`, tylko `01-operator-runda1.md` i `05-obrona-runda2.md`,
zero zmian w `gra/`, `git diff --check` czysty.

ZARZUTY: brak

STATUS: PASS
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6E-RECON-RENDER-Q1
GOAL: Recon-only kategorii render/kamera Etapu 6 (patrz 00-dispatch.md)
TESTY: niezależna arytmetyka `python3` (9+12+6=27; 9+12+1+1+1+2+1=27), świeży
`grep` spójności §3B/§4/§6/§9, `Read` weryfikujący treść `render/units.ts:5798`,
`git show --stat`/`git diff --check` na commit `c5f70632`
BLOKADY: brak
RUNDY: 3/5
ZARZUTY: brak
NASTĘPNY KROK: Final Control (R-PROC-AUTOBOT.md — po PASS Evaluatora)
DEPLOY/PUSH: NIE WYKONANO
