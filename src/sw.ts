import { Serwist, type PrecacheEntry } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST: (string | PrecacheEntry)[];
  }
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  navigationPreload: true,
});

serwist.addEventListeners();
