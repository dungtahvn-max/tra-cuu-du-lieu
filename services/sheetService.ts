
import { SheetRow } from '../types';
import { STATIC_DATA } from '../data/staticData';

export const fetchSheetData = async (): Promise<SheetRow[]> => {
  // Trả về dữ liệu tĩnh ngay lập tức
  return STATIC_DATA;
};
