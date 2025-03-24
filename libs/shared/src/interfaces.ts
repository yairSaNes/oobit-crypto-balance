export interface CryptoBalance {
  userId: string;
  wallet: { coin: string; amount: number }[];
}

export interface CryptoRate {
  coin: string;
  rate: number;
  currency: string;
}