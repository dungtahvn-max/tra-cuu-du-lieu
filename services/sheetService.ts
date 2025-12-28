
import { SheetRow } from '../types';
import { STATIC_DATA } from '../data/staticData';

/**
 * Trả về dữ liệu tĩnh trực tiếp từ bộ nhớ.
 * Không sử dụng async/await để đảm bảo tính tĩnh hoàn toàn và tốc độ tức thì.
 */
export const fetchSheetData = (): SheetRow[] => {
  return STATIC_DATA;
};
