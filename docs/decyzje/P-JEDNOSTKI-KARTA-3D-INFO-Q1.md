# P-JEDNOSTKI-KARTA-3D-INFO-Q1 — integracja tymczasowej karty jednostki

**Status:** **🔵 W TRAKCIE — ECHO 2026-08-18; integracja wzorca Hastati**
**Data:** 2026-08-18

## ECHO właściciela

Właściciel zaakceptował tymczasowe makiety kart i chce rozpocząć ich spokojne
wdrażanie do gry. Pierwszym krokiem jest generyczna karta jednostki otwierana
z istniejącego ekranu wejścia, z Hastati jako wzorcem. Karta ma pokazywać
prawdziwe dane jednostki oraz slot prawdziwego modelu 3D z istniejącego
renderera.

## Zakres tej paczki

- podłączenie generycznej karty do najlepszego istniejącego ekranu wejścia:
  lista/panel armii lub istniejąca karta jednostki;
- dane karty wyłącznie z istniejących definicji jednostek, kontr, technologii
  i dostępnych statusów runtime;
- Hastati jako przypadek wzorcowy, bez specjalnego kodu ograniczającego kartę
  do Hastati;
- model 3D przez `buildUnitModel` / `mountUnitMiniPreview`;
- brakujące pola pomijane, bez wyświetlania `undefined`, pustych atrap lub
  fałszywych wartości;
- prosty, tymczasowy CSS zgodny z zaakceptowaną makietą.

## Poza zakresem

- finalny polish Designera;
- linki Civpedii, Wikipedii i inne linki zewnętrzne;
- zmiany balansu, `units.json`, kontrów, rendererów modeli i definicji modeli;
- przebudowa całego panelu armii lub kart wszystkich jednostek;
- publikacja, deploy, merge i push.

## Kryteria akceptacji

- klik/otwarcie z istniejącego panelu pokazuje prawdziwą kartę wybranej
  jednostki, a nie dane wpisane na stałe dla Hastati;
- karta zachowuje się generycznie dla innych jednostek i pomija brakujące pola;
- slot 3D wywołuje istniejący pipeline `buildUnitModel` przez
  `mountUnitMiniPreview`; brak WebGL jest jawnie sygnalizowany;
- test karty jednostki: 23/23, istniejący test: 29/29, test wiring panelu,
  `tsc` i build przechodzą;
- jeśli zrzut/render 3D nie jest możliwy w środowisku, blocker zostaje
  jawnie odnotowany w raporcie.

