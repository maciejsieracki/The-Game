/**
 * danina-nazwa.ts
 *
 * Decyzje wlasciciela 65B/66B (Maciej 2026-07-25): "Danina -> Podatek" -- zmiana
 * NAZEWNICTWA (nie liczb) strumienia dochodu miasta oddawanego wladcy (dawny
 * "Handel" w UI -- handelBrutto/handelNetto, game/economy.ts). Kontekst
 * wlasciciela: "Handel odbywa sie pomiedzy cywilizacjami. To, co miasto oddaje
 * wladcy, to danina. Po wprowadzeniu pieniadza, czyli kiedy budujemy mennice,
 * danina zmienia sie w podatek."
 *
 * Strumien nazywa sie "Danina" domyslnie. Zmienia sie na "Podatek" dla CALEJ
 * cywilizacji (wszystkie miasta tego ownera, nawet oddalone od stolicy) dopiero
 * gdy OBA warunki sa spelnione:
 *   1) technologia Waluta jest odkryta (ta sama bramka co `walutaOdkryta` w
 *      game/turn-economy.ts / `ctx.walutaOdkryta` w game/economy.ts -- patrz
 *      `walutaActive` w economy.ts ok. linii 962),
 *   2) Mennica jest zbudowana W STOLICY tej cywilizacji.
 *
 * WAZNE -- ta bramka (2) jest CELOWO SCISLEJSZA niz `ownersWithMennica()` w
 * game/turn-economy.ts (uzywana dla mnoznika Efektu 1 -- ekonomia, NIE nazwa).
 * `ownersWithMennica` traktuje Mennice "gdziekolwiek w imperium" jako
 * rownowazna "w stolicy", bo normalnie Mennica MOZE stac tylko w stolicy
 * (buildings.json 'mennica'.lokalizacja='stolica', pytanie 70/B). Ale STARE
 * ZAPISY sprzed tej bramki moga miec Mennice w miescie REGIONALNYM (patrz
 * komentarz przy buildings.json 'mennica': "Stare zapisy z Mennica w miescie
 * regionalnym NIE sa cofane -- budynek zostaje"). Dla TEJ funkcji (nazwa
 * Danina/Podatek) taki przypadek ma pozostac "Danina", mimo ze ekonomiczny
 * mnoznik Efektu 1 nadal dziala (to osobny, nieruszany mechanizm) -- stad
 * osobna, scislejsza funkcja zamiast ponownego uzycia ownersWithMennica.
 *
 * Jedna funkcja rozstrzygajaca, PARYTET AI (ownerId-agnostic) -- wolaj ja
 * wszedzie w UI zamiast duplikowac te dwa warunki lub liczyc "Mennica w
 * stolicy" osobno w kazdym pliku.
 */

/** Etykieta widoczna dla gracza -- "Danina" (domyslnie) lub "Podatek" (po Walucie + Mennicy w stolicy). */
export type DaninaLabel = 'Danina' | 'Podatek';

/**
 * Odmiana etykiety -- "Danina" i "Podatek" maja rozny rodzaj gramatyczny
 * (danina = zenski, podatek = meski), wiec proste ".toLowerCase()" psuje
 * zdania wymagajace dopelniacza/biernika ("Podzial X", "% X", "mnozy X z pol").
 * Te dwie funkcje daja poprawna forme do wstawienia w zdanie -- UZYWAJ ICH
 * zamiast recznego sklejania, zeby nie powtarzac tej samej pulapki w kazdym
 * miejscu UI.
 */
export function daninaLabelGenitive(label: DaninaLabel): 'daniny' | 'podatku' {
  return label === 'Podatek' ? 'podatku' : 'daniny';
}

export function daninaLabelAccusative(label: DaninaLabel): 'daninę' | 'podatek' {
  return label === 'Podatek' ? 'podatek' : 'daninę';
}

/**
 * Czy strumien nazywa sie "Podatek" (true) czy pozostaje "Danina" (false) dla
 * danej cywilizacji. Oba pierwsze argumenty juz gotowe (policzone przez
 * wolajacego) -- ta funkcja tylko laczy warunki AND, zeby nie bylo dwoch
 * miejsc z ta sama logika bramki.
 *
 * PYTANIE 83=B (Maciej 2026-07-25): "Mennica przestaje działać po utracie
 * dostępu do złota. Mnożnik znika, Podatek wraca do Daniny." -- trzeci,
 * OPCJONALNY argument `maDostepDoZlota` rozszerza istniejącą bramkę (nie
 * duplikuje jej): gdy cywilizacja STRACI dostęp do złota (własna Kopalnia
 * złota zniszczona/utracona ALBO szlak handlowy zerwany -- game/zloto-access.ts),
 * nazwa wraca na "Danina" mimo że Mennica fizycznie nadal stoi w stolicy
 * (budynek NIE jest burzony -- patrz turn-economy.ts maMennicaBuiltEmpireWide
 * vs maMennicaEmpireWide, ten sam wzorzec "budynek stoi, efekt śpi"). Domyślnie
 * `true` -- zachowuje DOKŁADNIE stare zachowanie dla wołających, którzy jeszcze
 * nie liczą dostępu do złota (np. gra/src/ui/cityPanel.ts daninaLabelForCity,
 * należy do innego agenta -- patrz raport zadania PYTANIE 83).
 */
export function isPodatekActive(
  walutaOdkryta: boolean,
  mennicaWStolicy: boolean,
  maDostepDoZlota: boolean = true,
): boolean {
  return walutaOdkryta === true && mennicaWStolicy === true && maDostepDoZlota === true;
}

/** Etykieta do wyswietlenia graczowi na podstawie stanu bramki (patrz isPodatekActive). */
export function daninaLabel(
  walutaOdkryta: boolean,
  mennicaWStolicy: boolean,
  maDostepDoZlota: boolean = true,
): DaninaLabel {
  return isPodatekActive(walutaOdkryta, mennicaWStolicy, maDostepDoZlota) ? 'Podatek' : 'Danina';
}

/**
 * Czy Mennica stoi W STOLICY danego ownera. `capitalCityId` = id miasta-stolicy
 * tego ownera (np. z main.ts capitalCityIdForOwner / cfg.getCapitalCityId w
 * UI) -- null gdy nieznane (bezpieczny fallback: false, wiec nazwa zostaje
 * "Danina"). `builtBuildingIdsForCapital` = lista id budynkow ZBUDOWANYCH W TYM
 * KONKRETNYM MIESCIE (nie unia calego imperium) -- rozstrzyga case ze starym
 * zapisem, gdzie Mennica stoi w miescie regionalnym: wtedy stolica jej NIE ma
 * i funkcja poprawnie zwraca false.
 */
export function mennicaWStolicy(
  capitalCityId: string | null | undefined,
  builtBuildingIdsForCapital: readonly string[] | null | undefined,
): boolean {
  if (!capitalCityId) return false;
  return (builtBuildingIdsForCapital ?? []).includes('mennica');
}

/**
 * Wygodny "one-shot" helper dla wolajacych, ktorzy maja gotowa liste miast +
 * mape builtByCity (jak turn-economy.ts) zamiast juz-wyliczonego
 * builtBuildingIdsForCapital. Szuka stolicy PO HEURYSTYCE "pierwsze miasto
 * ownera w tablicy cities" (spojne z turn-economy.ts isCapital / main.ts
 * oldestCityOfOwner gdy brak jawnie wyznaczonej stolicy) -- wolajacy z
 * dostepem do autorytatywnego capitalCityIdForOwner (main.ts) / cfg.getCapitalCityId
 * (UI) powinien wolac mennicaWStolicy() bezposrednio z tym id zamiast tej
 * heurystyki.
 */
export function daninaLabelForOwnerByCityList(
  ownerId: number,
  walutaOdkryta: boolean,
  cities: ReadonlyArray<{ id: string; ownerId: number }>,
  builtByCity: ReadonlyMap<string, readonly string[]>,
  capitalCityId?: string | null,
  /** PYTANIE 83=B: patrz isPodatekActive powyżej. Domyślnie true (stare zachowanie). */
  maDostepDoZlota: boolean = true,
): DaninaLabel {
  const capId = capitalCityId ?? cities.find(c => c.ownerId === ownerId)?.id ?? null;
  const hasMennicaWStolicy = mennicaWStolicy(capId, capId ? builtByCity.get(capId) : undefined);
  return daninaLabel(walutaOdkryta, hasMennicaWStolicy, maDostepDoZlota);
}
