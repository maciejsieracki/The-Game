# P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-N2 — targeted overlay

**Status:** 🟡 **ZAPISANA — ECHO C; gotowe do dispatchu Operatora Workflow**
**Data ECHO:** 2026-08-18

## Decyzja właściciela

**C** — docelowo zastosować targeted overlay, który zachowuje widoczność
kwalifikujących się heksów pod modelem kopalni bez globalnego przebijania
przez teren i jednostki.

## Kontekst

Aktualne podświetlenie używa `depthTest:false`, ponieważ model kopalni zasłania
overlay. Skutkiem ubocznym jest niebieska warstwa widoczna przez grzbiety
terenu i od spodu modeli jednostek. N3, N5 i N6 pozostają osobnymi tematami.

## Kontrakt Operatora

- zmienić wyłącznie warstwę wizualną N2 w `rangeOverlay.ts` i powiązanym
  rendererze;
- zachować widoczność kwalifikujących się heksów pod modelem kopalni;
- ograniczyć overlay do właściwego heksa/warstwy gruntu, bez globalnego
  przebijania przez teren i jednostki;
- nie zmieniać kwalifikatora kopalni, ekonomii, zasięgu ani innych ulepszeń;
- dodać testy strukturalne i, jeśli środowisko pozwala, wizualny smoke;
- N3/N5/N6 nie wchodzą do tego dispatchu.

## Następny gate

Operator Workflow → niezależny Evaluator renderu → finalna kontrola → integracja.
