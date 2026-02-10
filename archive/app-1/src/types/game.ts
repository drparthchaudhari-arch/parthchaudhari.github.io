export interface Cell {
  letter: string;
  row: number;
  col: number;
  isSelected: boolean;
  isFound: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Level {
  id: number;
  theme: string;
  words: string[];
  grid: string[];
  difficulty: number;
}
