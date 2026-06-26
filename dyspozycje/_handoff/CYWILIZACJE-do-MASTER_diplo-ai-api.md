# CYWILIZACJE → MASTER : nowe funkcje dyplomacji/AI — API + wpięcie

Data: 2026-06-25 | Od: **CYWILIZACJE** | Status: **GOTOWE DO WPIĘCIA** (czyste, no DOM/THREE, NIEwpięte do main.ts; wpięcie = master)

Wszystko przetestowane: `diplomacy-test 119/0`, `ai-test 132/0`. Backupy `.bak-CYWILIZACJE*`.

## diplomacy.ts (nowe)
- `computeRespekt(inputs: RespektInputs, wagi = DEFAULT_RESPEKT_WAGI) -> number 0..100`
  - **Domyka brakujący Respekt (T1=A).** Liczony WZGLĘDEM partnera. SILNIK dostarcza 6 znormalizowanych inputs [0,1] (1=dominacja gracza): `stosunekWojska, wygraneBitwy, wielkoscWojska, miasta, gospodarka, epoka` — z UNITS (wojsko/bitwy), MIASTO (miasta), EKONOMIA (gospodarka), epoka z silnika. Wagi = panel: 25/20/18/15/12/10 (`DEFAULT_RESPEKT_WAGI`, strojalne).
  - Wpięcie: raz/turę per para → `relation.respekt = computeRespekt(inputs)`.
- `tickDiplomacy(rdip: RelacjaDyplomatyczna, ctx: TickCtx) -> RelacjaDyplomatyczna` (immutable)
  - Per-turę: delty Zaufania wg flag `ctx` (handel +1, pakt +1, dobraWola +1, wspólnyWróg +1, religia ±0.5, ekspansja −2), wygasanie traktatów (`wygasaTura<=turn`), zanik urazów co 20 tur, clamp + przelicz `relacjaOgolna`.
  - `TickCtx{ turn, aktywnyHandel?, aktywnyPakt?, dobraWolaAktywna?, wspolnyWrog?, wspolnaReligia?, odmiennaReligia?, ekspansjaPrzyGranicy? }` — flagi ze stanu gry.
  - Wpięcie: w pętli tury dla każdej pary z kontaktem.
  - TODO v0.2: per-źródłowe capy religii (±15/∓10) — teraz tylko clamp globalny.
- event `zerwanie_handlu` (−10 Zaufanie) w `applyDiplomaticEvent` (domyka szablon §1.5).

## ai.ts (nowe)
- `decideAIReaction(inp: ReakcjaInputs) -> { akcja:'bitwa'|'odwrot', ratio, powod }`
  - **Decyzja 2 (fight/flee, BRAK ZoC):** gdy jednostka gracza obok jednostki AI. Wejścia: `silaAI, silaGracza, wartoscJednostkiAI, weWlasnymTerytorium, stanWojny, zaufanie?, respekt?, agresjaArchetypu?`. Pokój+przyjaźń → odwrót (przepuszcza). Progi: `PROG_BITWA=0.9, TERYTORIUM_MNOZNIK=1.25, AGRESJA_WPLYW=0.4`.
  - Wykonanie: **bitwa=UNITS, odwrot=MAPA** (nie mój kod).
- `decideAIReinforcements(silaAIstarcie, silaGracza, kandydaci: PosilekKandydat[]) -> { dorzuc: string[], powod }`
  - **Posiłki AI (≤1 heks):** dorzuca kandydatów aż łączna siła ~1.2× gracza; oszczędza gdy duży zapas; pomija dystans>1.
- `decideAIDiplomacy(inp: DiplomacjaInputs, params?) -> AIDiplomacyCommand[]`
  - **AI uprawia dyplomację v0.1 (T2=C, rdzeń):** `wypowiedz_wojne | zaproponuj_pokoj | zadaj_trybut | oferuj_trybut_za_pokoj` (max 1/partner). Reużywa `aiDiplomacyStance`. Wejścia: `relacje[{partnerId, relation, respektWzgledny, stanWojny}], agresja, epoka?`. Progi: `PROG_WOJNA_SILA=0.6, PROG_WOJNA_AGRESJA=0.5, PROG_TRYBUT=0.7, PROG_POKOJ_SLABOSC=0.4`.
  - `respektWzgledny` = z `computeRespekt` (lub militaryRatio). Wpięcie: w fazie dyplomacji tury AI → wykonaj komendy (zmień stanWojny / zastosuj event pokoj/trybut przez applyDiplomaticEvent).
  - TODO v0.2: `zaproponuj_sojusz` (willingnessAlly), `zaproponuj_handel` (willingnessTrade) — zaznaczone w kodzie.

## Dane (gra/data)
- `civs.json`: + `bonusy[]` strukturalne `{typ, cel, wartosc, opis, realizuje}` (T3=A; 3/cyw, 27 łącznie) — działy `walka|miasto|ekonomia|mapa` czytają i REALIZUJĄ (wartości wstępne, do korekty). + `mnoznikHandelPieniadz` per-cyw 1.7–2.4 (baza 2; mechanika = EKONOMIA, gated Waluta+Mennica). `export-civs.py` chroni `bonusy/mnoznik/nazwyKlastra`.
- `tech.json`: **Koszt nauki** dostrojony wg referencji tempa (`EKONOMIA-do-MASTER_tempo-nauki.md`) — **PROPOZYCJA do akceptacji Macieja** (cel ~3 tury/tech; gate Bronzownictwo=45, Waluta=100; monotoniczność OK). 4 pytania balansu w raporcie do Macieja.

## Decyzje/flagi (nie blokują wpięcia core)
- Decyzje **T1–T4 ABC** dla Macieja: `Civ-CYWILIZACJE/PROPOZYCJA-dyplomacja-AI-v0.1.md` §5 (rekom.: T1=A, T2=C, T3=A, T4=C).
- `TypCywilizacji` enum 7+drobna vs roster 9 (brak Celtów/Germanów) — cross-lane, koordynacja mastera.
- `Typ główny=false` dla wszystkich — flaga martwa, potwierdzić.
- self-check `civ-dane-self-check` czyta martwy `DANE.md` (z handoffu DANE pkt6) — repoint na `CYWILIZACJE.md` lub wyłączyć.
