
import { SheetRow } from '../types';
import { removeDiacritics, getAcronym } from '../utils/stringUtils';

export const SHEET_ID = '1h3g4T8HP_07zTuQqHr2lQTT_3jUlekj_aI4UHqgEyKA';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

/**
 * Phân tách một dòng CSV thành mảng các cột, xử lý được dấu ngoặc kép bao quanh.
 */
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export const fetchSheetData = async (): Promise<SheetRow[]> => {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error('Failed to fetch data');
    
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/);
    
    // Bỏ qua dòng tiêu đề, duyệt từng dòng dữ liệu
    return lines.slice(1).reduce((acc: SheetRow[], line) => {
      if (!line.trim()) return acc;

      const columns = splitCSVLine(line);
      
      if (columns.length >= 2) {
        // Lấy đầy đủ tên ở cột 1, loại bỏ dấu ngoặc kép thừa
        const name = columns[0].replace(/^"|"$/g, '').trim();
        // Lấy số tiền ở cột 2, loại bỏ dấu ngoặc kép và dấu phẩy ngăn cách nghìn
        const rawAmountStr = columns[1].replace(/^"|"$/g, '').replace(/,/g, '');
        const amount = parseFloat(rawAmountStr) || 0;
        
        if (name) {
          acc.push({
            name,
            originalAmount: amount,
            amount: amount, // Dữ liệu đã nhân sẵn 100k từ sheet theo yêu cầu mới
            normalizedName: removeDiacritics(name),
            acronym: getAcronym(name)
          });
        }
      }
      return acc;
    }, []);
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu Sheet:', error);
    return [];
  }
};
