export interface CryptoBalance {
  userId: string;
  wallet: { coin: string; amount: number }[];
}

export interface CryptoRate {
  asset: string;
  rate: number;
  currency: string;
}