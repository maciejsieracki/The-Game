/**
 * defenseBreakdown.ts
 *
 * R-OBRONA-MIASTA-MP-Q1=A (Maciej 2026-08-06): "Zostawić mechanikę; dodać w preBattle
 * rozbicie bonusów (garnizon +50%, cyw, weteran, liczba obrońców)" — gracz ma widzieć
 * SKĄD bierze się siła obrony miasta bez murów, bez zmiany samej mechaniki walki.
 *
 * Pure, ownerId-agnostyczne funkcje (bez importu main.ts/DOM/silnika) — testowalne
 * bezpośrednio esbuildem (wzór: gra/tools/*-test.cjs), identyczne dla gracza i AI.
 * Wołający (main.ts) dostarcza WARTOŚCI/PREDYKATY już liczone PRAWDZIWYMI funkcjami
 * walki (unitGetsFortifyBonus / veteranCombatBonusFrac / unitDefFor) jako WSTRZYKNIĘTE
 * zależności (patrz buildDefenseRosterUnits ponizej) — ten moduł tylko AGREGUJE je do
 * czytelnego tekstu, nigdy nie przelicza ich od nowa (zero rownoleglej kopii formuly
 * bonusu -- jedno zrodlo prawdy w city-defense.ts / veteran.ts / civ-bonuses.ts, ten
 * plik go tylko konsumuje).
 *
 * Runda 4 (domkniecie luki znalezionej przez Evaluatora w rundzie 3):
 * defenderCivBonusBreakdown liczyl "N z M jednostek" per bonus_obrona WYLACZNIE
 * przez unitMatchesCel(u.celShape, b.cel) -- realna walka bramkuje bonus_obrona
 * PELNA funkcja bonusApplies() (civ-bonuses.ts), ktora oprocz unitMatchesCel
 * sprawdza DODATKOWO opisForestOrCharge/opisMentionsForest (bonus dziala tylko
 * w lesie/dzungli/na wzgorzu -- ctx.terrain) i opisChargeOnly (bonus dziala
 * tylko przy szarzy -- ctx.isChargeRound). Dzis (2026-08-07) zero rozbieznosci
 * w danych (wszystkie wpisy bonus_obrona w civs.json maja prosty cel bez tych
 * dodatkowych warunkow), ale KAZDY NOWY wpis bonus_obrona z opisem o lesie/
 * szarzy sprawilby, ze panel preBattle klamalby (pokazywalby bonus jako
 * dotyczacy jednostek, dla ktorych faktycznie NIE zadziala w bitwie). Naprawa:
 * defenderCivBonusBreakdown wola TERAZ bonusApplies() (eksportowana z
 * civ-bonuses.ts), budujac CivCombatContext {side:'defender', terrain,
 * isChargeRound:false} -- `terrain` to opcjonalny parametr wstrzykniety z
 * main.ts (teren heksu miasta bronionego, patrz cityDefenseBreakdownFor),
 * `isChargeRound` zawsze false w preBattle (szarza jeszcze sie nie odbyla --
 * konserwatywnie NIE pokazujemy bonusu wymagajacego szarzy, dopoki faktycznie
 * nie nastapi w bitwie). Zero zmiany funkcjonalnosci "N z M jednostek" -- to
 * WYLACZNIE doszczelnienie predykatu dopasowania.
 */

import { isCombatModifierBonus, bonusApplies, type CivBonusUnitShape, type CivCombatContext } from './civ-bonuses';
import type { CivBonusLite } from './production';

// ---------------------------------------------------------------------------
// Chip texts (przeniesione z ui/preBattle.ts — była to jedyna implementacja,
// main.ts miał DRUGĄ, dosłownie skopiowaną — patrz komentarz w cityDefenseBreakdownLines).
// ---------------------------------------------------------------------------

/**
 * Teksty opisów bonusów cywilizacji przechodzących przez `filter` (domyślnie
 * isCombatModifierBonus — WSZYSTKIE liczbowe bonusy walki, atak i obrona łącznie;
 * używane przez chipy "atrybuty cywilizacji" przy portrecie dowódcy, obie strony).
 * Puste opisy pomijane.
 */
export function bonusChipTexts(
  bonusy: readonly CivBonusLite[],
  filter: (b: CivBonusLite) => boolean = isCombatModifierBonus,
): string[] {
  const out: string[] = [];
  for (const b of bonusy) {
    if (!filter(b)) continue;
    const text = (b.opis ?? '').trim();
    if (!text) continue;
    out.push(text);
  }
  return out;
}

/**
 * Filtr WYŁĄCZNIE bonusów obrony (typ==='bonus_obrona' w civs.json) — węższy niż
 * isCombatModifierBonus, który przepuszcza też 'bonus_walka' ogólne (mogą mówić
 * wprost o ataku, np. "Brawura szarży: +25% ataku piechoty"). Do użycia WYŁĄCZNIE
 * pod nagłówkiem tłumaczącym obronę (panel "Rozbicie obrony") — nie zastępuje
 * bonusChipTexts/isCombatModifierBonus używanego przez ogólne chipy atrybutów.
 *
 * Znana niedoskonałość (świadomie zaakceptowana, poza zakresem tej naprawy):
 * pojedyncze wpisy 'bonus_walka' w civs.json opisowo dotyczą też obrony (np.
 * "Ciężkie rydwany bojowe: +15% HP i obrony rydwanów") — te NIE przejdą tego
 * filtra, bo dane nie niosą osobnego typu na "bonus_walka, ale też obrona".
 * Rozdzielenie po typ==='bonus_obrona' jest jednoznaczne i data-driven (nie
 * heurystyka po treści opisu).
 */
export function isDefenseOnlyCivBonus(b: CivBonusLite): boolean {
  return b.realizuje === 'walka' && b.typ === 'bonus_obrona' && typeof b.wartosc === 'number';
}

// ---------------------------------------------------------------------------
// Roster jednostek obrony -- ksztalt minimalny + budowanie z wstrzykniętych zależności.
// ---------------------------------------------------------------------------

/**
 * Kształt minimalny jednostki dla rozbicia obrony — wołający (main.ts) wypełnia
 * te pola PRAWDZIWYMI funkcjami walki (parytet gwarantowany, bo to te same
 * wywołania co realna bitwa), patrz buildDefenseRosterUnits ponizej:
 *   getsFortifyBonus -- unitGetsFortifyBonus(u) (main.ts, wola
 *                        unitGetsFortifyDefenseBonus z city-defense.ts) —
 *                        pole LUB garnizon w mieście bez muru.
 *   veteranFrac      -- veteranCombatBonusFrac(u) (veteran.ts) — 0 / 0.10 / 0.15 / 0.20
 *                        (wartości dzisiejsze; funkcje ponizej nie zakladaja, ze to
 *                        akurat te liczby — dzialaja dla dowolnego ulamka, patrz test).
 *   celShape         -- {typNazwa, rola, missileAttack} z unitDefFor(u) (main.ts) --
 *                        DOKLADNIE ksztalt, ktorego bonusApplies()/unitMatchesCel()
 *                        (civ-bonuses.ts) uzywaja do dopasowania bonusu 'cel'
 *                        (np. 'piechota') do jednostki -- jedno zrodlo prawdy.
 */
export interface DefenseRosterUnit {
  getsFortifyBonus: boolean;
  veteranFrac: number;
  celShape: CivBonusUnitShape;
}

/**
 * buildDefenseRosterUnits (warunek 2, runda 3) -- CZYSTA funkcja, generyczna nad
 * typem elementu rosteru `T` (main.ts przekazuje RuntimeUnit, test przekazuje
 * wlasny lekki fixture) -- getsFortifyBonus/veteranFrac/celShapeFor SĄ WSTRZYKNIĘTE
 * jako parametry (nie hardkodowane booleany w wywolujacym), wiec main.ts moze
 * przekazac REALNE funkcje walki, a test moze przekazac te same REALNE funkcje
 * (unitGetsFortifyDefenseBonus z city-defense.ts) na wlasnych fixture'ach --
 * zero rownoleglej reimplementacji predykatu w tescie.
 */
export function buildDefenseRosterUnits<T>(
  roster: readonly T[],
  getsFortifyBonus: (u: T) => boolean,
  veteranFrac: (u: T) => number,
  celShapeFor: (u: T) => CivBonusUnitShape,
): DefenseRosterUnit[] {
  return roster.map(u => ({
    getsFortifyBonus: getsFortifyBonus(u),
    veteranFrac: veteranFrac(u),
    celShape: celShapeFor(u),
  }));
}

/**
 * civBonusUnitShapeFromDef -- buduje CivBonusUnitShape z surowego rekordu units.json
 * (main.ts unitDefFor(u) zwraca dokladnie taki rekord) -- jedyne miejsce, gdzie
 * main.ts musi znac klucze 'Jednostka'/'Rola (linia)'/missileAttack; reszta modulu
 * operuje wylacznie na CivBonusUnitShape.
 */
export function civBonusUnitShapeFromDef(
  def: Record<string, unknown>,
  fallbackTypNazwa: string,
): CivBonusUnitShape {
  return {
    typNazwa: String(def['Jednostka'] ?? fallbackTypNazwa),
    rola: String(def['Rola (linia)'] ?? 'Wrecz'),
    missileAttack: typeof def['missileAttack'] === 'number' ? def['missileAttack'] : 0,
  };
}

// ---------------------------------------------------------------------------
// Rozbicie per-jednostka (garnizon / weteran / cel bonusu cyw.) — N z M, nigdy
// skalar calego rosteru.
// ---------------------------------------------------------------------------

/** Wynik rozbicia jednego bonusu na roster — tekst gotowy do UI + liczności do testu/logiki. */
export interface RosterBonusBreakdown {
  text: string;
  affectedCount: number;
  totalCount: number;
}

/**
 * Garnizon "Ufortyfikuj" +fortifyPct% Obrony — PER JEDNOSTKA (getsFortifyBonus),
 * NIE jako pojedynczy % udający mnożnik całego rosteru. Zwraca null gdy roster
 * pusty lub żadna jednostka nie kwalifikuje się (nic do pokazania).
 */
export function garrisonFortifyBreakdown(
  roster: readonly DefenseRosterUnit[],
  fortifyPct: number,
): RosterBonusBreakdown | null {
  const total = roster.length;
  if (total === 0) return null;
  const affected = roster.filter(u => u.getsFortifyBonus).length;
  if (affected === 0) return null;
  const pct = Math.round(fortifyPct);
  return {
    text: 'Garnizon (Ufortyfikuj) +' + String(pct) + '% Obrony — ' + String(affected) + ' z ' + String(total) + ' jednostek',
    affectedCount: affected,
    totalCount: total,
  };
}

/**
 * Premia weterana — najwyższy ułamek premii OBECNY w rosterze + liczba jednostek
 * DOKŁADNIE na tym poziomie. Jednostki z NIŻSZYM poziomem weterana mają WŁASNY
 * wkład do realnej Obrony, ale nie są częścią TEJ etykiety — panel pokazuje
 * szczyt + ilu go ma, zamiast fałszywie sugerować że wszyscy mają identyczny
 * bonus. Zwraca null gdy roster pusty lub nikt nie ma premii weterana (>0).
 */
export function bestVeteranAmongRoster(
  roster: readonly DefenseRosterUnit[],
): RosterBonusBreakdown | null {
  const total = roster.length;
  if (total === 0) return null;
  let maxFrac = 0;
  for (const u of roster) {
    if (u.veteranFrac > maxFrac) maxFrac = u.veteranFrac;
  }
  if (maxFrac <= 0) return null;
  const affected = roster.filter(u => u.veteranFrac === maxFrac).length;
  const pct = Math.round(maxFrac * 100);
  return {
    text: 'Premia weterana +' + String(pct) + '% Obrony — ' + String(affected) + ' z ' + String(total) + ' jednostek',
    affectedCount: affected,
    totalCount: total,
  };
}

/**
 * defenderCivBonusBreakdown (runda 4 -- domkniecie luki rundy 3) -- bonusy cyw.
 * obroncze (isDefenseOnlyCivBonus) filtrowane PELNA funkcja bonusApplies()
 * (civ-bonuses.ts) -- DOKLADNIE ten sam predykat, ktorym realna walka bramkuje
 * bonus_obrona (unitMatchesCel + opisForestOrCharge/opisMentionsForest +
 * opisChargeOnly). `terrain` to teren heksu miasta bronionego (opcjonalny --
 * main.ts go wstrzykuje z mapy; brak = '' = bonusy lesne/wzgorzowe NIE
 * dopasowywane, konserwatywnie jak w bonusApplies). `isChargeRound` jest
 * ZAWSZE false tutaj -- panel preBattle dziala PRZED bitwa, szarza jeszcze
 * sie nie odbyla, wiec bonus wymagajacy szarzy NIE jest obiecywany z gory
 * (moze sie nie zmaterializowac, gdyby szarzy nie bylo). Bonus, ktory nie
 * pasuje do ZADNEJ jednostki rosteru (np. grecka Falanga cel='piechota' na
 * rosterze zlozonym z samej kawalerii/rydwanow, ALBO bonus lesny na terenie
 * nie-lesnym) jest POMIJANY calkowicie (affected===0 -> nie trafia do wyniku)
 * -- panel nie klamie, ze bonus dotyczy jednostek/warunkow, ktorych realnie
 * nie wzmacnia.
 */
export function defenderCivBonusBreakdown(
  roster: readonly DefenseRosterUnit[],
  bonusy: readonly CivBonusLite[],
  terrain?: string,
): RosterBonusBreakdown[] {
  const total = roster.length;
  if (total === 0) return [];
  const ctx: CivCombatContext = { side: 'defender', terrain, isChargeRound: false };
  const out: RosterBonusBreakdown[] = [];
  for (const b of bonusy) {
    if (!isDefenseOnlyCivBonus(b)) continue;
    const text = (b.opis ?? '').trim();
    if (!text) continue;
    const affected = roster.filter(u => bonusApplies(b, u.celShape, ctx)).length;
    if (affected === 0) continue;
    out.push({
      text: text + ' — ' + String(affected) + ' z ' + String(total) + ' jednostek',
      affectedCount: affected,
      totalCount: total,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pelna agregacja panelu "Rozbicie obrony" (warunek 2, runda 3) -- main.ts ma
// juz TYLKO cienki wrapper wolajacy ta funkcje z realnymi danymi gry.
// ---------------------------------------------------------------------------

/**
 * Ksztalt linii panelu preBattle "warunki" -- strukturalnie identyczny z
 * PreBattleModifier (ui/preBattle.ts: {tekst, wartosc?, typ?}), celowo
 * NIE importowany stad (unika cyklu main.ts <-> ui/preBattle.ts <->
 * defenseBreakdown.ts) -- TS assignability jest structural, wiec wynik tej
 * funkcji jest bezposrednio przypisywalny do PreBattleModifier[] w main.ts.
 */
export interface DefenseBreakdownLine {
  tekst: string;
  wartosc?: string;
  typ?: 'pos' | 'neg' | 'neu';
}

export interface CityDefenseBreakdownOpts {
  /** fortify_obrona_proc (combat-params.json, main.ts FORTIFY_OBRONA_PROC_FIELD), np. 50. */
  fortifyPct: number;
  /** Bonusy cywilizacji obrońcy (main.ts civBonusyForOwnerId(defenderOwnerId)). */
  civBonusy: readonly CivBonusLite[];
  /**
   * P-AI-MOC-BONUS=A: mnoznik trudnosci AI (main.ts difficultyCombatMultForOwner)
   * -- gdy >1 (poziom Trudny gry), pokazany jawnie. Pozycja czeka na potwierdzenie
   * Macieja (R-OBRONA-MIASTA-MP-SCOPE-Q1) -- NIE zmieniac/usuwac bez jego decyzji.
   */
  difficultyMult: number;
  /**
   * Teren heksu miasta bronionego (runda 4) -- wstrzykniety z main.ts (patrz
   * cityDefenseBreakdownFor), przekazywany dalej do defenderCivBonusBreakdown
   * jako CivCombatContext.terrain. Opcjonalny -- brak = bonusy lesne/wzgorzowe
   * NIE dopasowywane (konserwatywnie).
   */
  terrain?: string;
}

/**
 * cityDefenseBreakdownLines -- PELNA agregacja panelu "Rozbicie obrony" z
 * jednego, juz zbudowanego DefenseRosterUnit[] (patrz buildDefenseRosterUnits).
 * Kolejnosc linii: garnizon -> weteran -> bonusy cyw. obronne (per-bonus,
 * "N z M") -> bonus trudnosci AI.
 */
export function cityDefenseBreakdownLines(
  roster: readonly DefenseRosterUnit[],
  opts: CityDefenseBreakdownOpts,
): DefenseBreakdownLine[] {
  if (roster.length === 0) return [];
  const out: DefenseBreakdownLine[] = [];

  const garrison = garrisonFortifyBreakdown(roster, opts.fortifyPct);
  if (garrison) out.push({ tekst: garrison.text, typ: 'pos' });

  const veteran = bestVeteranAmongRoster(roster);
  if (veteran) out.push({ tekst: veteran.text, typ: 'pos' });

  const civLines = defenderCivBonusBreakdown(roster, opts.civBonusy, opts.terrain);
  for (const c of civLines) out.push({ tekst: 'Bonus cywilizacji obrońcy: ' + c.text, typ: 'pos' });

  if (opts.difficultyMult > 1) {
    const diffPct = Math.round((opts.difficultyMult - 1) * 100);
    out.push({
      tekst: 'Bonus trudności (Trudny)',
      wartosc: '+' + String(diffPct) + '% Atak/Obrona',
      typ: 'pos',
    });
  }

  return out;
}
