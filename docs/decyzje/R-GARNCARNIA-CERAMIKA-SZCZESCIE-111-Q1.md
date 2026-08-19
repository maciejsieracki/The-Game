# R-GARNCARNIA-CERAMIKA-SZCZESCIE-111-Q1

## ECHO właściciela — sprostowanie obowiązującej reguły

Właściciel odrzucił warianty naliczania bonusu „za każdą Ceramikę”. Obowiązuje:

- dostęp do Ceramiki = dokładnie **+1 punkt Szczęścia** w mieście;
- działający Spichlerz = dokładnie **+1 punkt Szczęścia** w mieście;
- liczba sztuk Ceramiki nie zwiększa tego bonusu;
- nie wolno wykorzystywać luki ani błędnego naliczania jako mechaniki.

W czacie padła wcześniej odpowiedź `a`, ale bez dostępnej w repozytorium pełnej treści pierwotnego pytania nie należy traktować samej litery jako samodzielnej specyfikacji. Późniejsze, jednoznaczne sprostowanie właściciela jest źródłem prawdy.

## Status

Reguła jest uwzględniona w FALI 299, commit `d3324f00`, w aktualnej ROBOCZEJ md5 `5dba37a12900d8f9a03a2da592d2cd8c`, `VERIFY OK`. Dowody regresyjne: `gra/tools/converters-test.cjs`, `gra/tools/society-breakdown-test.cjs` oraz `gra/tools/r-wzrost-szczescie-dubel-wealth-ceramika-test.cjs`.

Powiązany temat podwójnego Wealth został rozstrzygnięty osobno w `R-WZROST-SZCZESCIE-DUBEL-WEALTH-I-CERAMIKA-Q1`; oba kanały nie mogą być ponownie sumowane w podglądzie ani w realnym wzroście.
