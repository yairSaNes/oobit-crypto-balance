export interface CryptoBalance {
  userId: string;
  wallet: { coin: string; amount: number }[];
}

export interface CoinRate {
  [key: string]: number; // Key: currency, Value: rate
}

export interface TrackedData {
  timeStamp: number;
  trackedCoins: string[];
  trackedCurrencies: string[];
}
