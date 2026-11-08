import { showTechDiscoveryNotice, hideTechDiscoveryNotice } from 'GRA/src/ui/techDiscoveryNotice';
(window as any).__show = (n: string) => { hideTechDiscoveryNotice(); showTechDiscoveryNotice({ techName: n, eraIndex: 1, kind: 'preview' }); };
