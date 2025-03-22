export interface CryptoBalance {
  userId: string;
  asset: string;
  amount: number;
}

export interface CryptoRate {
  asset: string;
  rate: number;
  currency: string;
}