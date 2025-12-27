
import React, { useState, useEffect, useMemo } from 'react';
import { fetchSheetData, SHEET_ID } from './services/sheetService';
import { SheetRow } from './types';
import { removeDiacritics, getRelevanceScore, formatCurrency, cleanForCompare } from './utils/stringUtils';

const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <span>{text}</span>;

  const qNorm = removeDiacritics(query.trim());
  const tNorm = removeDiacritics(text);
  
  // Ưu tiên 1: Khớp chuỗi trực tiếp
  const index = tNorm.indexOf(qNorm);
  if (index !== -1) {
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.trim().length);
    const after = text.substring(index + query.trim().length);
    return (
      <span>
        {before}
        <mark className="bg-yellow-200 text-slate-900 px-0.5 rounded-sm shadow-sm">{match}</mark>
        {after}
      </span>
    );
  }

  // Ưu tiên 2: Khớp theo ký tự đầu (viết tắt)
  const qClean = cleanForCompare(query);
  const words = text.split(/(\s+|\.+)/); // Giữ lại cả khoảng trắng và dấu chấm để render đúng
  let qIdx = 0;

  return (
    <span>
      {words.map((part, i) => {
        // Nếu là khoảng trắng hoặc dấu chấm, in ra bình thường
        if (/^[\s.]+$/.test(part)) return <span key={i}>{part}</span>;

        const firstCharNorm = removeDiacritics(part[0] || '');
        const shouldHighlight = qIdx < qClean.length && firstCharNorm === qClean[qIdx];
        
        if (shouldHighlight) qIdx++;

        return (
          <span key={i}>
            {shouldHighlight ? (
              <mark className="bg-blue-100 text-blue-700 font-bold px-0.5 rounded-sm">{part[0]}</mark>
            ) : (
              part[0]
            )}
            {part.substring(1)}
          </span>
        );
      })}
    </span>
  );
};

const App: React.FC = () => {
  const [allData, setAllData] = useState<SheetRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSheetData();
        setAllData(data);
        setError(null);
      } catch (err) {
        setError('Lỗi tải dữ liệu. Hãy kiểm tra file Google Sheet hoặc quyền truy cập.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return allData;

    return allData
      .map(item => ({
        ...item,
        score: getRelevanceScore(searchTerm, item.name)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [allData, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-white shadow-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-black text-center text-slate-800 mb-8 tracking-tighter">
            TRA CỨU DANH SÁCH
          </h1>
          
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Tìm tên đầy đủ, viết tắt (nva), hoặc ký hiệu (u.hưng)..."
              className="w-full pl-14 pr-12 py-5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl transition-all outline-none text-xl shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
              <i className="fa-solid fa-search text-2xl"></i>
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <i className="fa-solid fa-times-circle text-xl"></i>
              </button>
            )}
          </div>
          
          {searchTerm && (
            <div className="mt-4 text-center">
              <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100">
                Tìm thấy {filteredData.length} kết quả
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-5xl mx-auto px-4 mt-10">
        {isLoading ? (
          <div className="bg-white rounded-3xl p-20 shadow-sm border border-slate-100 text-center">
            <div className="inline-block w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-medium">Đang đồng bộ dữ liệu mới nhất...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-12 shadow-sm border border-red-100 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-exclamation-triangle text-3xl"></i>
            </div>
            <p className="text-xl font-bold text-slate-800 mb-2">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-all"
            >
              THỬ LẠI
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-8 py-6 font-bold uppercase text-[10px] tracking-[0.2em] w-24 text-center border-r border-slate-700">STT</th>
                    <th className="px-8 py-6 font-bold uppercase text-[10px] tracking-[0.2em]">Họ Tên / Nội Dung Ghi Chú</th>
                    <th className="px-8 py-6 font-bold uppercase text-[10px] tracking-[0.2em] text-right">Số Tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                      <tr 
                        key={index} 
                        className={`group transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/50`}
                      >
                        <td className="px-8 py-6 text-slate-400 text-center font-mono text-sm border-r border-slate-50">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-lg font-bold text-slate-800 leading-tight">
                            <HighlightedText text={item.name} query={searchTerm} />
                          </div>
                          {searchTerm && item.score >= 1400 && (
                            <div className="mt-1">
                              <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                Ưu tiên khớp
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-2xl font-black text-emerald-600 tabular-nums tracking-tight">
                            {formatCurrency(item.amount)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-8 py-32 text-center bg-slate-50/30">
                        <div className="opacity-20 mb-4">
                          <i className="fa-solid fa-folder-open text-6xl"></i>
                        </div>
                        <p className="text-xl font-bold text-slate-400">Không tìm thấy kết quả phù hợp</p>
                        <p className="text-sm text-slate-300 mt-1">Vui lòng kiểm tra lại từ khóa hoặc cách viết tắt</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="max-w-4xl mx-auto px-4 text-center opacity-30 select-none">
        <div className="inline-flex flex-col items-center">
          <div className="h-px w-20 bg-slate-400 mb-4"></div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">2025 - Trần Anh Dũng</p>
          <p className="text-[9px] mt-1 font-mono">{SHEET_ID}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
