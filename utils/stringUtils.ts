
/**
 * Loại bỏ dấu tiếng Việt và đưa về chữ thường.
 */
export const removeDiacritics = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

/**
 * Tạo chuỗi viết tắt (acronym).
 * Ví dụ: "Nguyễn Văn A" -> "nva", "U.Hưng" -> "uh"
 */
export const getAcronym = (text: string): string => {
  const normalized = removeDiacritics(text);
  return normalized
    .split(/[\s.]+/)
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('');
};

/**
 * Làm sạch chuỗi để so sánh (bỏ dấu chấm và khoảng trắng).
 */
export const cleanForCompare = (str: string): string => {
  return removeDiacritics(str).replace(/[.\s]/g, '');
};

/**
 * Tính toán điểm phù hợp của từ khóa tìm kiếm.
 */
export const getRelevanceScore = (query: string, target: string): number => {
  if (!query) return 0;
  
  const qOrig = query.trim();
  const tOrig = target.trim();
  
  const qNorm = removeDiacritics(qOrig);
  const tNorm = removeDiacritics(tOrig);
  
  const qClean = cleanForCompare(qOrig);
  const tClean = cleanForCompare(tOrig);
  
  const qAcro = getAcronym(qOrig);
  const tAcro = getAcronym(tOrig);

  // 1. Khớp chính xác tuyệt đối
  if (qNorm === tNorm) return 3000;
  
  // 2. Tên trong danh sách bắt đầu bằng từ khóa
  if (tNorm.startsWith(qNorm)) return 2000;

  // 3. Khớp từ viết tắt hoàn toàn (nva -> Nguyễn Văn A hoặc ngược lại)
  if (qClean === tAcro || tClean === qAcro) return 1500;

  // 4. Khớp Shorthand (Ví dụ: Nhập Uyên Hưng [qAcro=uh] khớp U.Hưng [tAcro=uh])
  if (qAcro === tAcro && qAcro.length > 1) return 1400;

  // 5. Khớp chứa chuỗi con
  if (tNorm.includes(qNorm)) return 1000;

  // 6. Khớp một phần viết tắt (Ví dụ: nhập "nv" cũng ra "Nguyễn Văn A")
  if (tAcro.startsWith(qClean) || qAcro.startsWith(tClean)) return 800;

  // 7. Khớp "sạch" (bỏ qua dấu chấm và khoảng trắng)
  if (tClean.includes(qClean) || qClean.includes(tClean)) return 500;

  return 0;
};

/**
 * Định dạng tiền tệ VNĐ.
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};
