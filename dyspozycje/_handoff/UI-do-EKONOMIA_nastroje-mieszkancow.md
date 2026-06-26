# ZAPYTANIE UI -> EKONOMIA (przez Maciej): nastroje mieszkancow w panelu miasta  [2026-06-25]

Kontekst: panel miasta ma sekcje "Mieszkancy". Makieta pokazuje ROZKLAD nastrojow:
Zadowoleni / Kontentni / Niezadowoleni + premia szczescia. MIASTO uznalo rozklad 3-koszykowy za kosmetyke
(nie v0.1) i odeslalo do ekonomii (to Wy macie miasto/model). Pytania:

1. Czy w v0.1 model liczy LICZBE mieszkancow wg nastroju (zadowoleni/kontentni/niezadowoleni),
   czy tylko NETTO szczescie + prog (T1/T2)? (UI ma juz getOrderState = netto + tier.)
2. Jesli liczycie rozklad -> jak UI go dostanie? Propozycja hak:
   getHappinessBreakdown(cityId) => { zadowoleni:number, kontentni:number, niezadowoleni:number }.
   Jesli NIE liczycie -> UI pokaze tylko netto szczescie/tier (bez 3 koszykow) — OK?
3. Premia szczescia (np. "+1 ze Swiatyni") + zrodla szczescia per miasto — skad dane? Hak (lista zrodel)?

Po odpowiedzi: jak jest rozklad -> dorobie pasek 3-koszykowy; jak nie -> zostaje netto/tier z getOrderState.
