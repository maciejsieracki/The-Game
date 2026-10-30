// Wycinek weba (verbatim) economy.ts@91dc998a L908-1009 (Step 5-9 ogona cityYieldPerTurn).
// Jedyne zmiany wzgledem zrodla: naglowek funkcji (wejscia agregatow z Step 1-4 podane
// jawnie), usuniety wiersz `const pracaInt = cityPracaInteger(pracaNetto);` (Step 4 Praca,
// poza zakresem tej partii), zwrot pol wyniku (ta sama skladnia co web L1011-1020).
import { applyCivMatrixParam } from './civ-matrix.ts';

export function cityYieldTailSlice(city: any, ctx: any, params: any, a: any): any {
  const handelTerenu = a.handelTerenu;
  const pieniadzBudynkow = a.pieniadzBudynkow;
  const naukaBudynkow = a.naukaBudynkow;
  const zywnoscTerenu = a.zywnoscTerenu;
  const zywnoscBudynkow = a.zywnoscBudynkow;
  const kulturaBudynkow = a.kulturaBudynkow;
  const walutaOdkrytaOnly = ctx.walutaOdkryta === true;
  const pieniadzZPracy = 0;

  // City tax excludes route proceeds. Manual Work tax is added after route-only
  // bonuses, then follows the ordinary corruption, Mint and slider stages.
  const handelBazowy = handelTerenu + pieniadzBudynkow;
  let handelBrutto = handelBazowy;
  // For a known matrix owner, the matrix is authoritative (including raw zero)
  // for this legacy-overlapping gross-trade effect. Unknown/missing owner keys
  // retain the existing legacy multiplier behavior.
  const civHandelMult = city.civKey ? 1 : (ctx.civHandelMult ?? 1);
  if (civHandelMult !== 1) {
    handelBrutto *= civHandelMult;
  }
  // T4 (runda 2): premia za trasy handlowe Z BUDYNKIEM, addytywna suma
  // per-trasowych bonusow 0.05*wlasny dochod dystansowy -- patrz
  // CityYieldContext.premiaHandluTrasHandlowych. ZASTEPUJE stary mnoznik
  // (1+0.05*n) liczony ze WSZYSTKICH polaczonych tras niezaleznie od budynku.
  const premiaTrasHandlowych = ctx.premiaHandluTrasHandlowych ?? 0;
  if (premiaTrasHandlowych > 0) {
    handelBrutto += premiaTrasHandlowych;
  }
  // F-04: replace the same-effect legacy multiplier above and apply the approved
  // general gross-trade coefficient once to the complete named gross stage.
  if (city.civKey) handelBrutto = applyCivMatrixParam(handelBrutto, city.civKey, 'eko_handel_brutto_proc');
  // Manual Work tax joins after local and route-only gross modifiers, so it is
  // never multiplied by the Market route bonus or route-building premiums.
  handelBrutto += Math.max(0, ctx.additionalTax ?? 0);

  // --- Step 5: Apply corruption/waste to the complete tax base, including manual
  // Work tax. Unconverted Work still in the empire pool is not affected. ---
  const strataRaw = city.civKey
    ? applyCivMatrixParam(ctx.strataFraction, city.civKey, 'eko_korupcja_proc')
    : ctx.strataFraction;
  const strata = Math.min(strataRaw, params.korupcjaCap);
  const handelNettoRaw    = handelBrutto       * (1 - strata);
  // Mint affects the local tax pool only. Separately settled route cash bypasses it.
  const walutaActive = walutaOdkrytaOnly && ctx.maMennica === true;
  const walutaMnoznikBase = params.mennicaMnoznikPoWalucie;
  const walutaMnoznikAktywny = walutaActive ? walutaMnoznikBase : 1;
  const handelNetto   = handelNettoRaw * walutaMnoznikAktywny;

  // --- Step 6+7: Trade slider -> Nauka / Pieniadz / Luksus ---
  // Dawny osobny mnoznik ctx.mennicaMnoznik (Handel->Pieniadz, TYLKO strumien
  // Pieniadza) zostal USUNIETY 2026-07-25 -- Mennica jest teraz jednym z dwoch
  // warunkow bramki Efektu 1 powyzej (handelNetto), wiec mnozy juz i tak Skarb+
  // Nauke+Zamoznosc razem; osobne mnozenie tutaj dublowaloby efekt.
  const pctNauka    = city.podziałHandlu.procentNauka    / 100;
  const pctPieniadz = city.podziałHandlu.procentPieniadz / 100;
  const pctLuksus   = city.podziałHandlu.procentLuksus   / 100;

  const naukaZHandlu    = Math.floor(handelNetto * pctNauka);
  const pieniadzZHandlu = Math.floor(handelNetto * pctPieniadz);
  // Luksus stream (Spec ss.2.1/2.2): feeds Zadowolenie downstream (society lane).
  const luksusZHandluRaw = Math.floor(handelNetto * pctLuksus);
  const luksusZHandlu = city.civKey
    ? Math.floor(applyCivMatrixParam(luksusZHandluRaw, city.civKey, 'eko_luksus_proc'))
    : luksusZHandluRaw;

  // Biblioteka: +Nauka% applied to the city's local science (master par.2a).
  // Akademia (ZADANIE 2, 2026-07-25, decyzja 4): +Nauka% osobny, stackuje ADDYTYWNIE
  // z Biblioteka -- (1 + bibliotekaBonus + akademiaBonus), NIE (1+b)*(1+a). Kolejnosc
  // nie zmieniona: premia dziala PO zsumowaniu plonow budynkow (naukaBudynkow), wiec
  // mnozy takze wlasne 6 pkt Nauki Akademii -- ten sam efekt co Biblioteka ma dzis.
  const naukaBonusFactor = 1
    + (ctx.maBiblioteka ? params.budynekBibliotekaBonusNauki : 0)
    + (ctx.maAkademia   ? params.budynekAkademiaBonusNauki   : 0);
  const naukaLokalnaRaw  = Math.floor((naukaZHandlu + naukaBudynkow) * naukaBonusFactor);
  const naukaLokalna = city.civKey
    ? Math.floor(applyCivMatrixParam(naukaLokalnaRaw, city.civKey, 'eko_nauka_proc'))
    : (ctx.civNaukaMult !== undefined && ctx.civNaukaMult !== 1
      ? Math.floor(naukaLokalnaRaw * ctx.civNaukaMult)
      : naukaLokalnaRaw);

  // --- Step 8: Money from the tax allocation plus specialist Poborca. Building
  // money, manual Work tax, and route-derived amounts are each added to their own
  // appropriate stage above, preventing duplicate credit.
  let pieniadzTotal = city.civKey
    ? applyCivMatrixParam(pieniadzZHandlu, city.civKey, 'eko_pieniadz_proc')
    : pieniadzZHandlu;
  for (const spec of city.specjalisci) {
    if (spec === 'poborca') {
      pieniadzTotal += 2;
    }
  }

  // --- Step 9: Net food ---
  // Garncarnia (Zadanie 2, 2026-07-23): +Zywnosc% LOKALNIE po zsumowaniu bazowej
  // Zywnosci (teren+budynki), PRZED odjeciem konsumpcji. Stackuje za kazda sztuke
  // zbudowana w TYM miescie (civ-wide NIE dotyczy -- patrz Stolarnia/Warsztat kamieniarski
  // w turn-economy.ts, ktore dzialaja na drewno/kamien, nie zywnosc).
  const zywnoscBruttoBaza = zywnoscTerenu + zywnoscBudynkow;
  const liczbaGarncarni = ctx.liczbaGarncarni ?? 0;
  const garncarniaMnoznikZywnosci = 1 + params.budynekGarncarniaBonusZywnosci * liczbaGarncarni;
  const zywnoscBruttoRaw = zywnoscBruttoBaza * garncarniaMnoznikZywnosci;
  const zywnoscBrutto = city.civKey
    ? applyCivMatrixParam(zywnoscBruttoRaw, city.civKey, 'eko_zywnosc_proc')
    : zywnoscBruttoRaw;
  const zywnoscZuzyta = city.ludnosc * params.zywnoscZuzytkaPopulacja
                       + ctx.wojskoZuzycieZywnosci;
  const zywnoscNetto  = zywnoscBrutto - zywnoscZuzyta;
  return {
    pieniadz:       Math.floor(pieniadzTotal),
    zywnosc:        Math.floor(zywnoscNetto),
    nauka:          naukaLokalna,
    luksus:         luksusZHandlu,
    kultura:        Math.floor(city.civKey
      ? applyCivMatrixParam(kulturaBudynkow, city.civKey, 'eko_kultura_proc')
      : kulturaBudynkow),
    zywnoscBrutto:  Math.floor(zywnoscBrutto),
    handelBrutto:   Math.floor(handelBrutto),
  };
}
