export enum AddressType {
  TaiwanIsland,
  OuterIsland,
  ForeignCountry,
}

export function checkAddressType() : AddressType {
  // TODO: distinguish where the address is localted
  return AddressType.TaiwanIsland;
}
