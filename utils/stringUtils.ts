
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
 * Hỗ trợ tìm theo cụm từ: "pham trang" khớp "Phạm Thị Trắng"
 */
export const getRelevanceScore = (query: string, target: string): number => {
  if (!query.trim()) return 0;
  
  const qNorm = removeDiacritics(query.trim());
  const tNorm = removeDiacritics(target);
  
  // Tách query thành các từ đơn
  const qWords = qNorm.split(/\s+/).filter(w => w.length > 0);
  
  // Kiểm tra xem TẤT CẢ các từ trong query có xuất hiện trong target không
  const allWordsPresent = qWords.every(word => tNorm.includes(word));
  
  if (allWordsPresent) {
    let score = 1000;
    
    // Thưởng nếu khớp cả cụm từ liên tục
    if (tNorm.includes(qNorm)) score += 1000;
    
    // Thưởng nếu bắt đầu bằng từ đầu tiên của query
    if (tNorm.startsWith(qWords[0])) score += 500;
    
    // Thưởng cho mỗi từ khớp chính xác (không chỉ là chuỗi con)
    const tWords = tNorm.split(/[\s.]+/);
    qWords.forEach(qw => {
      if (tWords.includes(qw)) score += 200;
    });

    return score;
  }
  
  // Fallback: Kiểm tra viết tắt (acronym)
  const qClean = cleanForCompare(query);
  const tAcro = getAcronym(target);
  if (tAcro.includes(qClean)) return 500;

  return 0;
};

/**
 * Định dạng tiền tệ VNĐ.
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};
