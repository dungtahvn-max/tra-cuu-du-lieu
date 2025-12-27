
export interface SheetRow {
  name: string;
  amount: number;
  originalAmount: number;
  normalizedName: string;
  acronym: string;
}

export interface SearchStats {
  totalCount: number;
  totalAmount: number;
}
