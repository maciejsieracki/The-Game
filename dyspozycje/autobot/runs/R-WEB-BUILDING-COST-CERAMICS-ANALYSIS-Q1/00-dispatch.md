# R-WEB-BUILDING-COST-CERAMICS-ANALYSIS-Q1 — dispatch (2026-11-09) — ANALIZA (bez zmian kodu/danych)

GOAL (polecenie właściciela): „pomyśl, które budynki jeszcze powinny zużywać ceramikę”. Wskaż budynki, które tematycznie i systemowo powinny mieć koszt surowcowy w CERAMICE (surowiec `ceramika`, produkowany przez Garncarnię z gliny), poza obecnymi; z propozycją ilości i uzasadnieniem. Zasada właściciela (jak dla kamienia/cegły): NIGDY wcześniej, niż ceramika jest realnie dostępna (Garncarstwo → Garncarnia), oraz ilości 1:1 zastępujące istniejący składnik, albo dodawane z uzasadnieniem.
BAZA: main po FALA 569+ (uwzględnij decyzje w R-WEB-BUILDING-COST-STONE-BRICK-IMPL-Q1, żeby nie kolidować: tamten temat zmienia koszty kamień→cegła w 10 budynkach Brązu i kamieniarski w Kamieniu). Operator: SONNET 5.5.
ZAKRES (tylko analiza + raport + propozycja; DANYCH I KODU NIE ZMIENIAJ):
1. Ustal: gdzie ceramika jest dziś produkowana (Garncarnia — receptura, epoka, bramka Garncarstwo/Glina) i zużywana (które budynki/jednostki mają `ceramika` w koszt_surowce lub utrzymaniu; do czego służy wg kart — por. R-WEB-CARDS-RESOURCE-PURPOSE-Q1).
2. Tabela: wszystkie budynki × (tech wymagana, czy gwarantowanie PO Garncarni, obecny koszt, czy tematycznie pasuje ceramika: magazyny, spichlerze, studnia, łaźnia, świątynie, akwedukt, targowisko, itp.). Kandydaci tylko spośród budynków odblokowanych po ceramice.
3. Propozycja z ilościami (skala zgodna z istniejącymi kosztami surowcowymi i efektywnym mnożnikiem ×2 × epoka), wpływ na ekonomię (produkcja Garncarni vs zużycie), AI (ai-resource-needs, konwerter ceramiki), pętle zależności (Garncarnia nie może kosztować ceramiki), konflikt z STONE-BRICK-IMPL.
4. Wynik: raport + CSV w runs/<ID>/; STATUS: DECISION_REQUIRED z pytaniami ABC (zalety/wady, rekomendacja) — które budynki i ile.
ALLOWLISTA: tylko dyspozycje/autobot/runs/R-WEB-BUILDING-COST-CERAMICS-ANALYSIS-Q1/. Zakaz zmian w gra/, WERSJE.md, gra-robocza/, build/dev, git add -A, push/deploy.
