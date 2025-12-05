type Pos = { lat: number; lng: number } | null;

export interface Positions {
  coords: Pos;
  name: string;
  timestamp: number;
}

export interface AppUrlOpenData {
  url: string;
}