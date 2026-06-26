# PACZKA: MIASTO -> MASTER : ulepszenia terenu + posterunki (rozdziel do MAPA/EKONOMIA)
Data: 2026-06-24. Na prośbę Maciej (lane MIASTO = bonusy/efekty/koszt ulepszeń). Do rozdania: MAPA (placement/render/warunki),
EKONOMIA (doliczanie bonusów do plonów), SILNIK (przepływ w turze + check granic).

ŹRÓDŁA (moje, tunowalne):
- DANE: `gra/data/terrain-improvements.json` (9 ulepszeń + posterunek; bonus/teren/warunek/koszt_praca/tech).
- SPEC: `MIASTO/Ulepszenia-terenu-spec.md` (tabela + reguły + definicja posterunku + styki).

NAJWAŻNIEJSZE REGUŁY (decyzje Maciej):
1. IRYGACJA tylko na polu bezpośrednio przylegającym do rzeki (lub na rzece) — BRAK łańcuchów przez pola bez rzeki.
   FARMA = alternatywa bez rzeki (+1 żywność na ziemi uprawnej). -> MAPA egzekwuje warunek rzeki przy placemencie.
2. DROGA tylko między miastami i posterunkami. -> MAPA.
3. KOSZT ulepszeń płacony z PULI PRACY w skarbcu (Q4). -> SILNIK (przepływ: Praca z puli -> postęp -> flaga na heksie).
4. POSTERUNEK (=Strażnica): nie-miasto; rozszerza zasięg terytorium o promień 3; widoczność; węzeł dróg; bez plonów;
   koszt ~30 Praca. -> MAPA (placement/render/zasięg) + SILNIK (check granic). Definicja pełna w spec.

DLA EKONOMII: bonusy ulepszeń (np. Farma +1 żywność, Kopalnia +2 Praca) doliczać do plonów OBRABIANYCH pól
(workedTilesForCity). Wartości w terrain-improvements.json (mój panel — strojenie po mojej stronie).

DLA MAPA: placement z mapy strategicznej (klik), warunki (rzeka/granica/miasto↔posterunek), stan+render na heksie,
panel zasięgów + blokada poza granicą. Posterunek rozszerza granicę (promień 3).

MOJA CZĘŚĆ (zrobione): dane + spec. (Ew. dołożę terrain-improvements do panelu Excela + dashboardu przy hydracji.)
DO POTWIERDZENIA (Maciej): wartości bonusów/kosztów (propozycje), promień posterunku (3), czy posterunek ma utrzymanie.
