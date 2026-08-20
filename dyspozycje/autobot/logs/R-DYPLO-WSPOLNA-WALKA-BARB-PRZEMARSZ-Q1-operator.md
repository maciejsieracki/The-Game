# Raport Operatora — `R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1`

Data audytu: 2026-08-20
Rola: Operator AutoBot
Status: **IMPLEMENTACJA-OBSERWOWANA / BLOCK-ABC**

## 1. Korekta poprzedniego raportu

Poprzedni raport oznaczał temat jako „bez implementacji”. Ten opis jest
nieaktualny wobec commit `93b0fbef` w worktree
`_worktrees/R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1`.

Formalny dokument `docs/decyzje/R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1.md`
zapisuje wybór właściciela **1A + 2A + 3A**. Zdanie o „wyłącznie
dokumentacji” opisuje zakres commita dokumentacyjnego `885011ce`; nie może być
traktowane jako dowód, że późniejsza implementacja `93b0fbef` nie istnieje.
Nie zmieniam formalnego dokumentu decyzji ani logiki gry w tym audycie.

## 2. Dowody zakresu implementacji

Commit `93b0fbef` zmienia produkcyjnie:

- `gra/src/game/diplomacy-treaties.ts` — dedykowany, terminowy kind traktatu,
  strony wyłącznie cywilizacyjne i aktywność po turze wygaśnięcia;
- `gra/src/game/diplomacy-proposals.ts` — propozycję i akceptację akcji
  `wspolna_walka_barb_przemarsz`;
- `gra/src/game/diplomacy-border-march.ts` — obustronną wojskową autoryzację
  przemarszu z kontrolą bieżącej tury;
- `gra/src/game/joint-barbarian-war.ts` oraz `gra/src/main.ts` — dołączanie
  wojskowego partnera do walki z barbarzyńcami w promieniu 1, z wyłączeniem
  cywilów i po wygaśnięciu traktatu;
- `gra/src/ui/diplomacyNegotiationModal.ts`,
  `gra/src/ui/diplomacyTradeBasket.ts` i `gra/src/game/diplomacy-display.ts` —
  obsługę formularza i etykiety;
- `gra/tools/r-dyplo-wspolna-walka-barb-przemarsz-q1-test.cjs` — test kontraktu
  dla zakresu 1A/2A/3A.

Wniosek: commit zawiera zaakceptowaną implementację produkcyjną zakresu
decyzji 1A/2A/3A. Nie należy raportować tego zakresu jako
„dokumentacyjnego/bez zmian w `gra/`”.

## 3. Zakres nadal nierozstrzygnięty

Decyzja formalnie nie określa kolejności naliczania kary **−15 Zaufania** przy
jednoczesnym działaniu modyfikatora Wiarygodności. Samo 3A rozstrzyga, że
zerwanie ma karę Zaufania; nie rozstrzyga, czy kara jest wartością absolutną,
czy deltą podlegającą modyfikacji.

### `R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1-D` — semantyka kary −15 Zaufania

**Pytanie:** Czy kara za zerwanie traktatu jest naliczana przed czy po
modyfikatorze Wiarygodności? Właściciel powinien wybrać dokładnie jeden
wariant. Operator nie wybiera wariantu.

#### A — −15 absolutne po wszystkich modyfikatorach

Kara końcowa na Zaufaniu wynosi zawsze dokładnie **−15 pkt**, niezależnie od
wartości i kierunku modyfikatora Wiarygodności; modyfikator nie skaluje tej
delty.

Za:

- wynik jest stały, łatwy do pokazania w komunikacie i przewidywalny dla gracza;
- chroni znaczenie formalnej liczby „−15” przed ukrytym zwiększeniem albo
  zmniejszeniem przez reputację.

Przeciw:

- kara nie korzysta z ogólnej zasady modyfikowania zmian Zaufania przez
  Wiarygodność;
- wymaga jawnego wyjątku w kontrakcie naliczania, aby nie pomylić jej z innymi
  karami jednorazowymi.

#### B — −15 bazowe przed modyfikatorem Wiarygodności

**−15** jest deltą bazową, a następnie zostaje przeliczona przez aktualny
modyfikator Wiarygodności. Przykładowo, przy mnożniku `m`, wynik wynosi
`−15 × m`, z zastosowaniem obowiązujących reguł zaokrągleń i clampowania.

Za:

- zachowuje jedną wspólną regułę dla zmian Zaufania i pozwala, by reputacja
  wzmacniała lub łagodziła koszt zerwania;
- nie wymaga osobnego wyjątku w pipeline delty, jeśli kara jest traktowana jak
  każda inna modyfikowalna zmiana.

Przeciw:

- gracz może otrzymać inną karę niż komunikowane „−15”, zależnie od
  Wiarygodności;
- trzeba formalnie ustalić moment odczytu Wiarygodności, kolejność clampowania
  oraz zaokrąglanie, aby wynik był deterministyczny.

#### C — inna reguła, do opisania przez właściciela

Właściciel może wskazać regułę odmienną od A i B, np. stałe **−15** tylko dla
zerwania przez właściciela traktatu, skalowanie wyłącznie dla strony z niską
Wiarygodnością, limit minimalny/maksymalny albo rozdzielenie kary na Zaufanie
i Wiarygodność. Wybór C jest ważny dopiero po podaniu wzoru, stron objętych
karą, momentu naliczenia, kolejności modyfikatorów, zaokrąglenia i clampowania.

Za:

- pozwala dopasować koszt do zamierzonej asymetrii winy lub do pełnej ekonomii
  reputacji;
- może rozwiązać przypadki brzegowe, których nie opisują proste A i B.

Przeciw:

- bez kompletnego wzoru nie da się zbudować jednoznacznego kontraktu ani testu;
- zwiększa ryzyko rozjazdu między silnikiem, komunikatem, save/load i
  Evaluatorem.

**Rekomendacja Operatora:** brak. To jest pytanie decyzyjne dla właściciela,
nie rekomendacja techniczna.

## 4. Test kontraktowy i bramka

Istniejący test `gra/tools/r-dyplo-wspolna-walka-barb-przemarsz-q1-test.cjs`
jest uzasadniony formalną decyzją 1A/2A/3A i pokrywa terminowość, obustronny
przemarsz, udział w walce, zerwanie, brak teleportu oraz save/load. Nie
dopisuję testu dla kolejności kary −15, ponieważ ta semantyka nie jest jeszcze
formalnie dostępna.

Status pozostaje **BLOCK-ABC** wyłącznie dla pytania D. Nie wolno na tej
podstawie zmieniać implementacji ani wybierać A/B/C za właściciela. Deploy i
push są poza zakresem.
