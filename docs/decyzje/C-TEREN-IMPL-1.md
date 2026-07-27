# C-TEREN-IMPL-1 — Deploy terenu bitwy: jeden batch czy trzy etapy

**Status:** ✅ WDROŻONA (decyzja)  
**Grupa:** C (walka / bitwa ręczna 3D)  
**Ekran:** [EKRAN: Bitwa ręczna 3D — teren, etapy 1–3]

## Sytuacja

Decyzja C-TEREN-Q1=A przewidywała wdrożenie etapów 1–3 w jednym batchu. Kod etapów 1–3 (teren bitwy: klasyfikacja, koszty ruchu, obrona) jest zmergowany w `gra/src/` — test `teren-walki-etapy` **26/26** zielony. Zmiany **nie są** jeszcze w `gra-robocza/` (brak deployu Integratora). Plan R-TEREN-DOPIAC przewidywał trzy osobne publikacje z weryfikacją między etapami.

## Cel pytania

Ustalić strategię publikacji do wersji roboczej: jeden deploy ze wszystkimi etapami naraz, trzy osobne deploye, czy jeden deploy z checklistą scenariuszy.

## Dlaczego teraz

Integrator potrzebuje decyzji przed buildem i wpisem w `WERSJE.md`. Bez tego nie wiadomo, czy rozbijać zmergowany kod na sztuczne etapy, czy publikować całość.

## Opcja A — Jeden deploy (3 etapy naraz)

Opis: Publikacja całego batcha terenu bitwy w jednym buildzie do `gra-robocza/`; jeden wpis w `WERSJE.md`.

**Za:** Kod jest już spięty w jednym batchu — naturalny deploy · mniej iteracji Integratora · szybsze dotarcie do wersji roboczej · jeden md5 do weryfikacji.

**Przeciw:** Trudniej wyizolować regresję do konkretnego etapu, jeśli coś się wysypie · jeden duży diff w playteście · brak punktów kontrolnych między etapami.

## Opcja B — Trzy deploye etapami

Opis: Sztuczne rozbicie zmergowanego kodu na trzy publikacje (etap 1 → weryfikacja → etap 2 → …) zgodnie z planem R-TEREN-DOPIAC.

**Za:** Zgodne z pierwotnym planem R-TEREN-DOPIAC · izolacja regresji per etap · Master może zatrzymać serię po etapie 1, jeśli coś nie gra.

**Przeciw:** Sztuczne rozbijanie już zmergowanego kodu — dodatkowa praca Integratora · trzy buildy zamiast jednego · kod etapów 2–3 może nie działać sensownie bez etapu 1 (coupling).

## Opcja C — Jeden deploy + checklista 3 scenariuszy w jednej sesji

Opis: Jeden build do `gra-robocza/`, ale obowiązkowa checklista weryfikacji trzech scenariuszy (ruch po brodzie, obrona na Górach, blokada gór) w **jednej** sesji playtestu Mastera przed zamknięciem tematu.

**Za:** Kompromis — kod jeden batch, ale kontrola jakości jak przy etapach · jeden wpis WERSJE · scenariusze mapują się na etapy 1–3 bez rozbijania buildu · rejestr playtestów dostaje jeden wpis z trzema punktami.

**Przeciw:** Nadal jeden wpis WERSJE — mniej śladów pośrednich · wymaga dyscypliny Mastera (checklista, nie „wrzuć i zapomnij") · jeśli etap 2 failuje, rollback dotyczy całego batcha.

## Rekomendacja

**Litera:** C — kod jest jednym batchiem; checklista 3 scenariuszy daje kontrolę bez sztucznego rozbijania deployu.

## Odpowiedź Macieja

> **A** — jeden deploy (etapy 1–3 naraz w jednym buildzie do `gra-robocza/`).

## Wdrożenie (2026-07-27)

**Strategia deployu:** jeden batch — **nie** rozbijać na trzy publikacje (odrzucone B). **Bez** obowiązkowej checklisty Mastera z opcji C — Maciej wybrał czyste A.

**Stan kodu (`gra/src/`):**
- ETAP 1: Góry na planszy = nazwa bojowa `Gory`, obrona broniącego **×1,75**
- ETAP 2: Δ Zasięg dystansowych — Las **−1**, Wzgórza/Góry **+1**
- ETAP 3: Konnica/rydwan — Las koszt **×2**, Góry **NIEDOSTĘPNE**

**Test:** `teren-walki-etapy-test.cjs` **26/26**

**Następny krok:** Integrator — jeden build → `gra-robocza/` + wpis `WERSJE.md` (na polecenie **deploy** od Macieja).

**Powiązane:** C-TEREN-IMPL-2 (kanon liczb JSON) · C-TEREN-IMPL-3 (widoczność w UI) — osobne decyzje przed/po deploy.

**Warstwa:** 🟡 (deploy Integratora)
