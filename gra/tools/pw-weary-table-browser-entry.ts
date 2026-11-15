// R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1, runda 2 — zrzut stolu z wierszem „Zmęczenie wojną +N PW".
// Wynik evaluateProposal (prawdziwy silnik) trafia do renderPnBalancePanelHtml (prawdziwy renderer tabeli).
// Stan: window.__pwTable.ready / .states (dane z silnika, do asercji w runnerze).
import { createNegotiation, negotiationAsProposal, evaluateProposal } from '../src/game/diplomacy-proposals';
import { renderPnBalancePanelHtml } from '../src/ui/diplomacyAcceptanceBalance';

const rwOf = (ai: number, plr: number) => ai / (ai + plr);
const WOJNA = { zaufanie: 5, respekt: 5, status: 'wojna' };

function playerPeace(t: number, pos: 'slabsza' | 'silniejsza') {
  const entry = createNegotiation({ actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload: {} } as any, 80, 'player', 1);
  const rw = pos === 'slabsza' ? rwOf(75, 100) : rwOf(125, 100);
  return evaluateProposal(negotiationAsProposal(entry), {
    relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1,
    respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
    responderPlayer: { ownerId: 1, typCywilizacji: 'rzymianie' }, proposerPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' },
    authorOwnerId: 0,
    warState: { turnsAtWar: t, lostCitiesResponder: 0, turnsSinceCityChange: t, responderRw: rw, responderPozycjaMilitarna: pos },
  } as any);
}

const SCENARIOS = [
  { id: 'wczesna', label: 'Wojna: tura 11 (zmęczenie ok. 0,55) — AI słabsza, pokój od gracza', t: 11, pos: 'slabsza' as const },
  { id: 'pozna', label: 'Wojna: tura 15 (zmęczenie ok. 0,75) — AI słabsza, pokój od gracza', t: 15, pos: 'slabsza' as const },
  { id: 'silna', label: 'Wojna: tura 15 — AI silniejsza militarnie (komunikat o cenie)', t: 15, pos: 'silniejsza' as const },
];

const states: any[] = [];
const root = document.createElement('div');
root.id = 'stol';
root.style.cssText = 'width:760px;padding:12px;background:#1b2330;color:#eee;font:14px sans-serif;';
document.body.appendChild(root);

for (const s of SCENARIOS) {
  const r: any = playerPeace(s.t, s.pos);
  states.push({ id: s.id, t: s.t, pos: s.pos, accepted: r.accepted, reason: r.reason, pwBalance: r.pwBalance, wearinessPw: r.wearinessPw, wearinessInfo: r.wearinessInfo });
  const block = document.createElement('section');
  block.dataset.state = s.id;
  block.innerHTML = `<h4 style="margin:8px 0 4px">${s.label}</h4>`;
  const panel = {
    actionLabel: 'Pokój', myOfferPn: 0, theirOfferPn: 0,
    theirBalance: { mode: 'treaty', pw: 0 }, myBalance: { mode: 'treaty', pw: 0 },
    canAccept: r.accepted === true, extraOnTable: 0,
    responderPreview: { accepted: r.accepted === true, reason: r.reason, pwBalance: r.pwBalance, wearinessPw: r.wearinessPw, wearinessInfo: r.wearinessInfo },
  } as any;
  const wrap = document.createElement('div');
  wrap.innerHTML = renderPnBalancePanelHtml(panel);
  block.appendChild(wrap);
  root.appendChild(block);
}

(window as any).__pwTable = { ready: true, states };
