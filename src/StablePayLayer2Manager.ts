import { StablePayLayer2Provider } from "StablePayLayer2Provider";

export interface StablePayLayer2Manager {
  getBalance(layer2Type: Layer2Type, token: string): string;
  getBalanceVerified(layer2Type: Layer2Type, token: string): string;

  getProviderByLayer2Type(layer2Type: Layer2Type): StablePayLayer2Provider;
  getProviderByName(name: string): StablePayLayer2Provider;
  registerProvider(provider: StablePayLayer2Provider): boolean;
  getProviders(): Set<StablePayLayer2Provider>;
}
