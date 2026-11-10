// Sprawdza na PRAWDZIWYM webie: mapa bez ladu => buildSameTypeRivalCandidateHexes === [] (test brzegowy Rust).
const root = process.argv[2];
const S = await import(`file://${root}/gra/src/map/cluster-spawn.ts`);
const map = { szerokoscQ: 4, wysokoscR: 4, hexes: {} };
console.log(JSON.stringify(S.buildSameTypeRivalCandidateHexes(map, { q: 5, r: 5 }, 3, 1)));
