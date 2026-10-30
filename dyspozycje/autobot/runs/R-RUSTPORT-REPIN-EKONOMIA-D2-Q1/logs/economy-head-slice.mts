// Wycinek weba (verbatim) economy.ts@91dc998a: Step 2 (L849-860), Step 3' port (L884-890),
// praca netto (L892-903). Jedyna zmiana wzgledem zrodla: naglowek funkcji; agregaty Step 1/3
// (pracaTerenu, pracaBudynkow, pieniadzBudynkow, pieniadzPortu) podane jawnie przez obiekt a.
import { applyCivMatrixParam, civMatrixParam } from './civ-matrix.ts';

export function cityYieldHeadSlice(city: any, ctx: any, params: any, a: any): any {
  const pracaTerenu = a.pracaTerenu;
  const pracaBudynkow = a.pracaBudynkow;
  let pieniadzBudynkow = a.pieniadzBudynkow;
  const pieniadzPortu = a.pieniadzPortu;

  // --- Step 2: Mlyn multiplier on tile Praca (Spec ss.1.2) ---
  let pracaBruttoTerenu: number;
  if (ctx.maMlyn) {
    pracaBruttoTerenu = pracaTerenu * params.budynekMlynMnoznikPracy
                      + params.budynekMlynBonusPracy;
  } else {
    pracaBruttoTerenu = pracaTerenu;
  }
  // Cegielnia bonus applied AFTER Mlyn
  if (ctx.maCegielnia) {
    pracaBruttoTerenu = pracaBruttoTerenu * (1 + params.budynekCegielniBonusPracy);
  }
  // Port income is a separately named source: its own building cash and connected
  // maritime routes receive this coefficient once, before the general gross-trade
  // and cash-share stages. Land-route income remains untouched here.
  const portRaw = city.civKey ? civMatrixParam(city.civKey, 'eko_pieniadz_port_proc') : 0;
  if (city.civKey && portRaw !== 0) {
    pieniadzBudynkow += pieniadzPortu * portRaw;
  }
  // Dawne "mnoznik% -> Praca" USUNIETE 2026-07-25 — patrz komentarz funkcji powyzej.
  // Praca miasta to czysta suma teren+budynki, bez mnoznika.
  const pracaBruttoLacznie = pracaBruttoTerenu + pracaBudynkow;
  // D1 (Maciej 2026-07-25): "Korupcja ma dotykać tylko i wyłącznie daniny, a potem
  // podatku, nie pracy." -- Praca NIGDY nie jest mnozona przez strate korupcji
  // (patrz Step 5 nizej, ktory strata dotyka tylko Handel/Danine).
  // F-04 approved owner work coefficient (mul_proc). A source zero is neutral;
  // the matrix owns this effect, while unrelated building/terrain/Order effects
  // remain in their existing stages. Missing owner identity stays neutral.
  const pracaNetto = city.civKey
    ? applyCivMatrixParam(pracaBruttoLacznie, city.civKey, 'eko_praca_proc')
    : pracaBruttoLacznie;

  return { pracaBruttoTerenu, pieniadzBudynkow, pracaBruttoLacznie, pracaNetto };
}
