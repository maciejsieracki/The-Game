const m = await import(process.env.SCR + '/webarch/gra/src/game/diplomacy-peace-lock.ts');
function mk(cfg) {
  const log = [];
  let meta = { ...cfg.meta };
  let status = cfg.status;
  let inboxN = 0;
  const ports = {
    getMeta: () => meta,
    setMeta: (a, b, v) => { meta = v; log.push('setMeta'); },
    getStatus: () => status,
    getArmyM: (o) => cfg.army[o],
    isHuman: (o) => cfg.human.includes(o),
    declareWarAfterTruce: (a, b) => { status = 'wojna'; log.push('war'); },
    enqueueOffer: (o, r) => { log.push('enqueue:' + o); return 'inbox' + (++inboxN); },
    removeOffer: (id) => log.push('remove:' + id),
    finalizePeace: (p, r) => { status = 'pokoj'; log.push('peace:' + p + '>' + r); },
  };
  return { ports, log, get meta() { return meta; }, get status() { return status; } };
}
const scen = {
  S1_ai_accept: { meta: { truceUntilTurn: 10, truceInitiatorId: 1 }, status: 'pokoj', army: { 1: 80, 2: 100 }, human: [1] },
  S2_ai_reject: { meta: { truceUntilTurn: 10, truceInitiatorId: 1 }, status: 'pokoj', army: { 1: 100, 2: 100 }, human: [1] },
  S3_human_offer: { meta: { truceUntilTurn: 10, truceInitiatorId: 1 }, status: 'pokoj', army: { 1: 1, 2: 100 }, human: [2] },
  S4_offer_expired: { meta: { truceEndOffer: { turn: 10, fromOwnerId: 1, toOwnerId: 2, inboxId: 'x9' } }, status: 'pokoj', army: {}, human: [] },
  S5_not_peace: { meta: { truceUntilTurn: 10, truceInitiatorId: 1 }, status: 'wojna', army: { 1: 1, 2: 100 }, human: [] },
  S6_no_initiator: { meta: { truceUntilTurn: 10 }, status: 'pokoj', army: { 1: 1, 2: 100 }, human: [] },
  S7_before_expiry: { meta: { truceUntilTurn: 10, truceInitiatorId: 1 }, status: 'pokoj', army: { 1: 1, 2: 100 }, human: [] },
};
const turns = { S4_offer_expired: 11, S7_before_expiry: 9 };
for (const [k, c] of Object.entries(scen)) {
  const s = mk(c);
  m.truceEndTickPair(s.ports, 1, 2, turns[k] ?? 10);
  console.log(k, JSON.stringify({ log: s.log, status: s.status, meta: s.meta }));
}
// Dwa kolejne ticki na tej samej parze (oferta czeka, nie wygasa w tej samej turze)
{
  const s = mk(scen.S3_human_offer);
  m.truceEndTickPair(s.ports, 1, 2, 10);
  m.truceEndTickPair(s.ports, 1, 2, 10);
  console.log('S8_offer_same_turn_twice', JSON.stringify({ log: s.log, meta: s.meta }));
}
