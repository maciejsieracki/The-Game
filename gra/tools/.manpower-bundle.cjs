"use strict";

// data/epoka-ludnosc-manpower.json
var epoka_ludnosc_manpower_default = {
  _opis: "Skala ludno\u015Bci i Manpower per epoka imperium (wiersze 1\u201310). 1 ludek = ludno\u015B\u0107 absolutna na slot population (1\u201310). manpowerNaLudka = 10% ludekNaLudka. manpowerNaJednostke = manpowerNaLudka (koszt rekrutacji 1 jednostki = pe\u0142ny slot manpower; 1 ludek = 1 jednostka przy pe\u0142nej puli).",
  _formuly: {
    ludnoscAbsolutna: "population \xD7 ludekNaLudka[epoka]",
    manpowerMax: "population \xD7 manpowerNaLudka[epoka]",
    kosztRekrutacji: "manpowerNaJednostke[epoka] = manpowerNaLudka[epoka] per jednostka"
  },
  epoki: [
    { epoka: 1, ludekNaLudka: 1e4, manpowerNaLudka: 1e3, manpowerNaJednostke: 1e3 },
    { epoka: 2, ludekNaLudka: 2e4, manpowerNaLudka: 2e3, manpowerNaJednostke: 2e3 },
    { epoka: 3, ludekNaLudka: 4e4, manpowerNaLudka: 4e3, manpowerNaJednostke: 4e3 },
    { epoka: 4, ludekNaLudka: 8e4, manpowerNaLudka: 8e3, manpowerNaJednostke: 8e3 },
    { epoka: 5, ludekNaLudka: 16e4, manpowerNaLudka: 16e3, manpowerNaJednostke: 16e3 },
    { epoka: 6, ludekNaLudka: 32e4, manpowerNaLudka: 32e3, manpowerNaJednostke: 32e3 },
    { epoka: 7, ludekNaLudka: 64e4, manpowerNaLudka: 64e3, manpowerNaJednostke: 64e3 },
    { epoka: 8, ludekNaLudka: 12e5, manpowerNaLudka: 12e4, manpowerNaJednostke: 12e4 },
    { epoka: 9, ludekNaLudka: 24e5, manpowerNaLudka: 24e4, manpowerNaJednostke: 24e4 },
    { epoka: 10, ludekNaLudka: 48e5, manpowerNaLudka: 48e4, manpowerNaJednostke: 48e4 }
  ]
};

// data/miasto-params.json
var miasto_params_default = {
  min_dystans_miast: {
    wartosc: 5,
    jednostka: "heksy",
    opis: "Minimalny dystans (w heksach) miedzy dwoma miastami przy zakladaniu. Uzywane w cities.canFoundCity (reason 'za blisko innego miasta')."
  },
  jednostka_koszt_ludnosci: {
    wartosc: 0,
    jednostka: "ludnosc",
    opis: "Koszt ludnosci miasta za ukonczenie jednostki z kolejki (rekrutacja). USTAWIONE 0 (Maciej 2026-07-21): rekrutacja NIE zabiera juz populacji miasta \u2014 jedynym kosztem werbu jest pula Manpower (epoka-ludnosc-manpower.json / manpower.ts). production.populationCostOf; przy 0 populacja pozostaje bez zmian."
  },
  manpower_regen_proc_max_tura: {
    wartosc: 2,
    jednostka: "% max/ture",
    opis: "Co koniec tury miasto odzyskuje floor(manpowerMax \xD7 wartosc/100) Manpower (do cap). Ep1, 10 ludkow, max=10k \u2192 +200/ture. Pusta pula \u224850 tur do pelna. manpower.tickManpowerRegen."
  },
  manpower_regen_blok_oblezenie: {
    wartosc: 1,
    jednostka: "0/1",
    opis: "1 = brak odnowy Manpower gdy city.oblegane=true. 0 = regen normalnie podczas obl\u0119\u017Cenia."
  },
  jednostka_koszt_domyslny: {
    wartosc: 10,
    jednostka: "Praca",
    opis: "Domyslny koszt Pracy jednostki, gdy brak pola 'Pieniadz (koszt)' w units.json i brak dopasowania roli. production.DEFAULT_UNIT_COST."
  },
  zaloz_miasto_koszt_praca: {
    wartosc: 20,
    jednostka: "Praca",
    opis: "Koszt za\u0142o\u017Cenia miasta z mapy (tryb Budowa) \u2014 jak historyczny Osadnik (B1 Maciej 2026-06-29). Pierwsze miasto onboarding = 0 (Silnik)."
  },
  zaloz_miasto_koszt_ludnosci: {
    wartosc: 1,
    jednostka: "ludnosc",
    opis: "Ludno\u015B\u0107 pobierana przy za\u0142o\u017Ceniu kolejnego miasta (jak Osadnik Ludno\u015B\u0107=1)."
  },
  jednostka_koszt_rola_wsparcie: {
    wartosc: 12,
    jednostka: "Praca",
    opis: "Fallback kosztu Pracy dla roli 'Wsparcie', gdy brak 'Pieniadz (koszt)'."
  },
  jednostka_koszt_rola_dystans: {
    wartosc: 8,
    jednostka: "Praca",
    opis: "Fallback kosztu Pracy dla roli 'Dystans' (jednostki dystansowe)."
  },
  jednostka_koszt_rola_wrecz: {
    wartosc: 10,
    jednostka: "Praca",
    opis: "Fallback kosztu Pracy dla roli 'Wrecz' (piechota wrecz)."
  },
  jednostka_koszt_rola_konnica: {
    wartosc: 16,
    jednostka: "Praca",
    opis: "Fallback kosztu Pracy dla roli 'Konnica'."
  },
  zasieg_okolicy_miasta: {
    wartosc: 10,
    jednostka: "pola/strona",
    opis: "Promien okolicy roboczej miasta (pola na plony) z kazdej strony = 10 (bylo 5; ROZSZERZONE o +5 z kazdej strony, decyzja Naster). ~21x21 ~331 heksow. Tu przydzielasz mieszkancow; to tez zasieg budowy miasta."
  },
  zasieg_okolicy_max: {
    wartosc: 15,
    jednostka: "pola/strona",
    opis: "Maksymalny promien okolicy miasta (cap) w modelu: cityRangeForPopulation(pop)=max(zasieg_okolicy_baza, min(pop,cap)). Maciej 2026-06-27: start min 5, rosnie 1:1 z pop."
  },
  praca_udzial_budynki: {
    wartosc: 0.7,
    jednostka: "udzial [0..1]",
    opis: "Q4: czesc Pracy miasta do kolejki budynkow; reszta -> globalna pula Pracy w skarbcu."
  },
  bonus_obrona_mur_proc: {
    wartosc: 200,
    jednostka: "% Obrony",
    opis: "Miasto Z MUREM (budynek 'mury', City.maMur) daje +200% Obrony broniacym sie jednostkom (bitwa/oblezenie). Decyzja Naster 2026-06-25. Konsumuje main.ts structureDefenseBonusFor -> combat.ts structureDefBonusPct + battleScene.ts (onWallWalkway). Miasto bez muru = brak tego bonusu. Miasto z Cytadela (upgrade Murow, patrz bonus_obrona_cytadela_proc) dostaje ten bonus RAZEM z dodatkowym -- lacznie +300%, nie osobnymi warstwami w kodzie (jeden zwracany procent: 200 albo 300)."
  },
  bonus_obrona_cytadela_proc: {
    wartosc: 100,
    jednostka: "% Obrony (dodatkowo do muru)",
    opis: `Miasto z Cytadela (budynek 'fort' -- UWAGA: to jest budynek Cytadela, upgrade Murow; NIE mylic z ulepszeniem terenowym 'fort' na mapie, ktore daje osobny bonus +100% dla obozujacych jednostek poza miastem) daje DODATKOWE +100% Obrony PONAD bonus muru -- lacznie +300% (200 mur + 100 cytadela). Decyzja Maciej 2026-07-25: "3, 100%. Bo to juz by bylo za duzo, i tak z murami jest 300%." Cytadela to upgrade budynku 'mury' (ID podmieniane w cityBuilt), wiec miasto z Cytadela NIE ma juz 'mury' w liscie budynkow -- flaga City.maMur pozostaje true (main.ts ustawia ja dla obu ID), a rozroznienie mur/cytadela robi structureDefenseBonusFor po cityBuilt.includes('fort'). Konsumuje main.ts structureDefenseBonusFor -> combat.ts structureDefBonusPct + battleScene.ts (onWallWalkway).`
  },
  bonus_obrona_baszta_proc: {
    wartosc: 100,
    jednostka: "% Obrony (dodatkowo do muru+cytadeli)",
    opis: "Decyzja 41B (Maciej 2026-07-25): Baszta -- TRZECI, niezalezny budynek obronny (buildings.json id='baszta'), dokladany obok Murow i Cytadeli (brak upgradeFrom, zaden nie zastepuje pozostalych). Daje DODATKOWE +100% Obrony PONAD Mury (+200%) i Cytadele (+100%) -- miasto z kompletem trzech budowli obronnych = +400% lacznie (200 mur + 100 cytadela + 100 baszta). Konsumuje main.ts structureDefenseBonusFor -> game/city-defense.ts cityWallDefenseBonusPercent -> combat.ts structureDefBonusPct + battleScene.ts (onWallWalkway). Baszta sama (bez Murow/Cytadeli) daje WYLACZNIE swoj wlasny +100% -- baza 'mur' (200%) aktywuje sie tylko gdy w miescie stoi realnie budynek 'mury' lub 'fort'."
  },
  zasieg_okolicy_baza: {
    wartosc: 5,
    jednostka: "pola/strona",
    opis: "Minimalny promien okolicy przy populacji 1..4 (start miasta = 5 heksow). Czytane przez okolica.cityRangeForPopulation (Maciej 2026-06-27)."
  },
  zasieg_okolicy_pop5: {
    wartosc: 10,
    jednostka: "pola/strona",
    opis: "[LEGACY - nieuzywane od 2026-06-25] Zasieg okolicy przy populacji >= 5 (stary model schodkowy). Zachowane dla wstecznej zgodnosci parsowania."
  },
  zasieg_okolicy_pop10: {
    wartosc: 15,
    jednostka: "pola/strona",
    opis: "[LEGACY - nieuzywane od 2026-06-25] Zasieg okolicy przy populacji >= 10 (stary model schodkowy). Zachowane dla wstecznej zgodnosci parsowania."
  },
  udzial_output_produkcja: {
    wartosc: 0.4,
    jednostka: "udzial [0..1]",
    opis: "Domyslny udzial outputu miasta kierowany do strumienia PRODUKCJA. production.DEFAULT_OUTPUT_SHARES / splitOutput."
  },
  udzial_output_pieniadz: {
    wartosc: 0.3,
    jednostka: "udzial [0..1]",
    opis: "Domyslny udzial outputu miasta kierowany do strumienia PIENIADZ. production.DEFAULT_OUTPUT_SHARES / splitOutput."
  },
  udzial_output_nauka: {
    wartosc: 0.2,
    jednostka: "udzial [0..1]",
    opis: "Domyslny udzial outputu miasta kierowany do strumienia NAUKA. production.DEFAULT_OUTPUT_SHARES / splitOutput."
  },
  udzial_output_rozwoj: {
    wartosc: 0.1,
    jednostka: "udzial [0..1]",
    opis: "Domyslny udzial outputu miasta kierowany do strumienia ROZWOJ. production.DEFAULT_OUTPUT_SHARES / splitOutput."
  }
};

// src/game/manpower.ts
var ROWS = epoka_ludnosc_manpower_default.epoki;
var MAX_EPOKA = 10;
var DEFAULT_REGEN = {
  regenProcMaxPerTurn: 2,
  blockWhenBesieged: true
};
function loadManpowerRegenParams(raw = miasto_params_default) {
  const pct = raw.manpower_regen_proc_max_tura?.wartosc;
  const block = raw.manpower_regen_blok_oblezenie?.wartosc;
  return {
    regenProcMaxPerTurn: typeof pct === "number" && pct >= 0 ? pct : DEFAULT_REGEN.regenProcMaxPerTurn,
    blockWhenBesieged: block === void 0 ? true : block !== 0
  };
}
function civManpowerRegenMult(bonusy) {
  let mult = 1;
  if (!bonusy?.length) return mult;
  for (const b of bonusy) {
    if (b.typ === "bonus_pobor_regen" && typeof b.wartosc === "number") {
      mult *= 1 + b.wartosc;
    } else if (b.typ === "mnoznik_pobor_regen" && typeof b.wartosc === "number") {
      mult *= b.wartosc;
    }
  }
  return Math.max(0.1, mult);
}
function civManpowerMaxMult(bonusy) {
  let mult = 1;
  if (!bonusy?.length) return mult;
  for (const b of bonusy) {
    if (b.typ === "bonus_pobor_pula" && typeof b.wartosc === "number") {
      mult *= 1 + b.wartosc;
    } else if (b.typ === "mnoznik_manpower_max" && typeof b.wartosc === "number") {
      mult *= b.wartosc;
    }
  }
  return Math.max(0.1, mult);
}
function civManpowerMults(bonusy) {
  return {
    regenMult: civManpowerRegenMult(bonusy),
    maxMult: civManpowerMaxMult(bonusy)
  };
}
function scaledManpower(base, maxMult) {
  return Math.floor(base * Math.max(0.1, maxMult));
}
function manpowerRegenGain(ludki, epoka, params = DEFAULT_REGEN, regenMult = 1, maxMult = 1) {
  const max = cityManpowerMax(ludki, epoka, maxMult);
  if (max <= 0 || params.regenProcMaxPerTurn <= 0) return 0;
  const pct = Math.min(100, params.regenProcMaxPerTurn) / 100;
  return Math.floor(max * pct * Math.max(0, regenMult));
}
function tickManpowerRegen(city, epoka, params = DEFAULT_REGEN, regenMult = 1, maxMult = 1) {
  const max = cityManpowerMax(city.population, epoka, maxMult);
  const cur = cityManpowerCurrent(city, epoka, maxMult);
  if (cur >= max) return max;
  if (params.blockWhenBesieged && city.oblegane) return cur;
  const gain = manpowerRegenGain(city.population, epoka, params, regenMult, maxMult);
  if (gain <= 0) return cur;
  return Math.min(max, cur + gain);
}
function epokaManpowerRow(epoka) {
  const e = Math.max(1, Math.min(MAX_EPOKA, Math.floor(epoka) || 1));
  return ROWS.find((r) => r.epoka === e) ?? ROWS[0];
}
function clampLudki(population) {
  return Math.max(1, Math.floor(population) || 1);
}
function cityLudnoscAbsolutna(ludki, epoka) {
  const row = epokaManpowerRow(epoka);
  return clampLudki(ludki) * row.ludekNaLudka;
}
function cityManpowerMax(ludki, epoka, maxMult = 1) {
  const row = epokaManpowerRow(epoka);
  return scaledManpower(clampLudki(ludki) * row.manpowerNaLudka, maxMult);
}
var SCOUT_TYPE_ID = "Zwiadowca";
function isScoutTypeId(typeId) {
  return typeId === SCOUT_TYPE_ID;
}
function unitManpowerCost(epoka, maxMult = 1) {
  return scaledManpower(epokaManpowerRow(epoka).manpowerNaJednostke, maxMult);
}
function unitManpowerCostForType(typeId, epoka, maxMult = 1) {
  if (isScoutTypeId(typeId)) return 0;
  return unitManpowerCost(epoka, maxMult);
}
function cityManpowerCurrent(city, epoka, maxMult = 1) {
  const max = cityManpowerMax(city.population, epoka, maxMult);
  if (city.manpower === void 0 || !Number.isFinite(city.manpower)) return max;
  return Math.max(0, Math.min(max, Math.floor(city.manpower)));
}
function empirePoborTotals(cities, ownerId, epoka, maxMult = 1) {
  let sumaLudkow = 0;
  let ludnoscAbsolutna = 0;
  let rekruci = 0;
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    sumaLudkow += clampLudki(c.population);
    ludnoscAbsolutna += cityLudnoscAbsolutna(c.population, epoka);
    rekruci += cityManpowerCurrent(c, epoka, maxMult);
  }
  return { sumaLudkow, ludnoscAbsolutna, rekruci, poborRaw: ludnoscAbsolutna + rekruci };
}
function cityManpowerSnapshot(city, epoka, regenMult = 1, maxMult = 1) {
  const ludki = clampLudki(city.population);
  const row = epokaManpowerRow(epoka);
  const ludnoscAbsolutna = ludki * row.ludekNaLudka;
  const manpowerMax = scaledManpower(ludki * row.manpowerNaLudka, maxMult);
  const kosztJednostki = scaledManpower(row.manpowerNaJednostke, maxMult);
  const manpowerBiezacy = cityManpowerCurrent(city, epoka, maxMult);
  const regenParams = loadManpowerRegenParams();
  return {
    epoka: row.epoka,
    ludki,
    ludnoscAbsolutna,
    manpowerMax,
    manpowerBiezacy,
    kosztJednostki,
    regenPerTurn: manpowerRegenGain(ludki, epoka, regenParams, regenMult, maxMult),
    werbMaxPrzyPelnejPuli: kosztJednostki > 0 ? Math.floor(manpowerBiezacy / kosztJednostki) : 0
  };
}
function canAffordUnitManpower(city, epoka, maxMult = 1, typeId) {
  const cost = unitManpowerCostForType(typeId, epoka, maxMult);
  if (cost <= 0) return true;
  return cityManpowerCurrent(city, epoka, maxMult) >= cost;
}
function empireManpowerCurrent(cities, ownerId, epoka, maxMult = 1) {
  return empirePoborTotals(cities, ownerId, epoka, maxMult).rekruci;
}
function deductManpowerFromEmpire(cities, ownerId, epoka, amount, maxMult = 1) {
  if (amount <= 0) return true;
  if (empireManpowerCurrent(cities, ownerId, epoka, maxMult) < amount) return false;
  let remaining = amount;
  const ownerCities = cities.filter((c) => c.ownerId === ownerId);
  const sorted = [...ownerCities].sort((a, b) => {
    const curDiff = cityManpowerCurrent(b, epoka, maxMult) - cityManpowerCurrent(a, epoka, maxMult);
    return curDiff !== 0 ? curDiff : a.id.localeCompare(b.id);
  });
  for (const c of sorted) {
    if (remaining <= 0) break;
    const cur = cityManpowerCurrent(c, epoka, maxMult);
    const take = Math.min(cur, remaining);
    if (take > 0) {
      c.manpower = cur - take;
      remaining -= take;
    }
  }
  return remaining <= 0;
}
function refundManpowerToEmpire(cities, ownerId, epoka, amount, maxMult = 1) {
  if (amount <= 0) return;
  let remaining = amount;
  const ownerCities = cities.filter((c) => c.ownerId === ownerId);
  const sorted = [...ownerCities].sort((a, b) => {
    const roomA = cityManpowerMax(a.population, epoka, maxMult) - cityManpowerCurrent(a, epoka, maxMult);
    const roomB = cityManpowerMax(b.population, epoka, maxMult) - cityManpowerCurrent(b, epoka, maxMult);
    const roomDiff = roomB - roomA;
    return roomDiff !== 0 ? roomDiff : a.id.localeCompare(b.id);
  });
  for (const c of sorted) {
    if (remaining <= 0) break;
    const max = cityManpowerMax(c.population, epoka, maxMult);
    const cur = cityManpowerCurrent(c, epoka, maxMult);
    const room = max - cur;
    if (room <= 0) continue;
    const add = Math.min(room, remaining);
    c.manpower = cur + add;
    remaining -= add;
  }
}
function canAffordUnitManpowerEmpire(cities, ownerId, _recruitingCity, epoka, _popCost = 0, maxMult = 1, typeId) {
  const kosztManpower = unitManpowerCostForType(typeId, epoka, maxMult);
  if (kosztManpower <= 0) return true;
  return empireManpowerCurrent(cities, ownerId, epoka, maxMult) >= kosztManpower;
}
function tryDeductUnitSpawnCostsEmpire(cities, recruitingCityId, ownerId, epoka, _popCost = 0, maxMult = 1, typeId) {
  const recruitingCity = cities.find((c) => c.id === recruitingCityId && c.ownerId === ownerId);
  const kosztManpower = unitManpowerCostForType(typeId, epoka, maxMult);
  const recruitingMp = recruitingCity ? cityManpowerCurrent(recruitingCity, epoka, maxMult) : 0;
  const recruitingPop = recruitingCity?.population ?? 0;
  if (!recruitingCity) {
    return {
      ok: false,
      population: 0,
      manpower: 0,
      kosztManpower,
      reason: "brak_manpower"
    };
  }
  if (kosztManpower > 0 && !deductManpowerFromEmpire(cities, ownerId, epoka, kosztManpower, maxMult)) {
    return {
      ok: false,
      population: recruitingPop,
      manpower: recruitingMp,
      kosztManpower,
      reason: "brak_manpower"
    };
  }
  return {
    ok: true,
    population: recruitingPop,
    manpower: cityManpowerCurrent(recruitingCity, epoka, maxMult),
    kosztManpower
  };
}
function tryDeductUnitSpawnCosts(city, epoka, popCost = 0, maxMult = 1, typeId) {
  const kosztManpower = unitManpowerCostForType(typeId, epoka, maxMult);
  const cur = cityManpowerCurrent(city, epoka, maxMult);
  if (cur < kosztManpower) {
    return {
      ok: false,
      population: city.population,
      manpower: cur,
      kosztManpower,
      reason: "brak_manpower"
    };
  }
  if (popCost > 0 && city.population <= popCost) {
    return {
      ok: false,
      population: city.population,
      manpower: cur,
      kosztManpower,
      reason: "brak_ludnosci"
    };
  }
  return {
    ok: true,
    population: city.population - popCost,
    manpower: cur - kosztManpower,
    kosztManpower
  };
}
function spendManpower(city, epoka, amount, maxMult = 1) {
  const cost = amount ?? unitManpowerCost(epoka, maxMult);
  const cur = cityManpowerCurrent(city, epoka, maxMult);
  return Math.max(0, cur - cost);
}
function formatPopulationAbs(n) {
  if (n >= 1e6) {
    const m = n / 1e6;
    return (m >= 10 ? Math.round(m) : Math.round(m * 10) / 10) + " mln";
  }
  if (n >= 1e3) {
    const t = n / 1e3;
    return (t >= 100 ? Math.round(t) : Math.round(t * 10) / 10) + " tys.";
  }
  return String(n);
}

// tools/.manpower-entry.ts
module.exports = {
  cityManpowerSnapshot,
  unitManpowerCost,
  unitManpowerCostForType,
  isScoutTypeId,
  SCOUT_TYPE_ID,
  cityLudnoscAbsolutna,
  cityManpowerMax,
  spendManpower,
  formatPopulationAbs,
  tryDeductUnitSpawnCosts,
  canAffordUnitManpower,
  tryDeductUnitSpawnCostsEmpire,
  canAffordUnitManpowerEmpire,
  empireManpowerCurrent,
  tickManpowerRegen,
  manpowerRegenGain,
  civManpowerRegenMult,
  civManpowerMaxMult,
  civManpowerMults,
  empirePoborTotals,
  deductManpowerFromEmpire,
  refundManpowerToEmpire
};
