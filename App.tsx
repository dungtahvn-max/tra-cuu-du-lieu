
import React, { useState, useEffect, useMemo } from 'react';
import { fetchSheetData } from './services/sheetService';
import { SheetRow } from './types';
import { removeDiacritics, getRelevanceScore, formatCurrency, cleanForCompare } from './utils/stringUtils';

const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <span className="whitespace-pre-wrap break-words">{text}</span>;

  const qNorm = removeDiacritics(query.trim());
  const tNorm = removeDiacritics(text);
  
  const index = tNorm.indexOf(qNorm);
  if (index !== -1) {
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.trim().length);
    const after = text.substring(index + query.trim().length);
    return (
      <span className="whitespace-pre-wrap break-words">
        {before}
        <mark className="bg-yellow-200 text-yellow-900 px-0.5 rounded-sm shadow-sm font-bold">{match}</mark>
        {after}
      </span>
    );
  }

  const qClean = cleanForCompare(query);
  const words = text.split(/(\s+|\.+)/);
  let qIdx = 0;

  return (
    <span className="whitespace-pre-wrap break-words">
      {words.map((part, i) => {
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

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchSheetData();
      setAllData(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const { filteredData, totalAmount } = useMemo(() => {
    let result = allData;
    if (searchTerm.trim()) {
      result = allData
        .map(item => ({
          ...item,
          score: getRelevanceScore(searchTerm, item.name)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
    }
    const total = result.reduce((sum, item) => sum + item.amount, 0);
    return { filteredData: result, totalAmount: total };
  }, [allData, searchTerm]);

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-900 pb-20">
      {/* Search Header với Pastel Gradient loang màu */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-[#e0e7ff] via-[#fae8ff] to-[#fce7f3] border-b border-white/50 shadow-sm backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 uppercase italic">
                Tra cứu dữ liệu
              </h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
                Dữ liệu nội bộ • {allData.length.toLocaleString()} Bản ghi
              </p>
            </div>
            

          </div>
          
          <div className="relative max-w-3xl mx-auto">
            <input
              type="text"
              placeholder="Nhập tên đầy đủ hoặc viết tắt (vd: nva, vks)..."
              className="w-full pl-14 pr-12 py-5 bg-white/80 border-2 border-white focus:border-indigo-300 focus:bg-white rounded-3xl shadow-lg outline-none transition-all text-xl font-medium placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400">
              <i className="fa-solid fa-search text-2xl"></i>
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-400 transition-colors"
              >
                <i className="fa-solid fa-times-circle text-2xl"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="max-w-6xl mx-auto px-4 mt-10 relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-white overflow-hidden">
          {isLoading ? (
            <div className="py-40 text-center">
              <div className="inline-block w-12 h-12 border-4 border-slate-100 border-t-indigo-400 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-slate-400 border-b border-slate-100">
                    <th className="px-8 py-6 font-bold uppercase text-[11px] tracking-[0.2em] w-24 text-center">STT</th>
                    <th className="px-4 py-6 font-bold uppercase text-[11px] tracking-[0.2em]">Họ Tên & Nội Dung</th>
                    <th className="px-8 py-6 font-bold uppercase text-[11px] tracking-[0.2em] text-right w-56">Số Tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                      <tr 
                        key={index} 
                        className={`group transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-[#fafcfe]'} hover:bg-indigo-50/50`}
                      >
                        <td className="px-8 py-6 text-center font-black text-sm text-blue-900 border-r border-slate-50/50">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-6">
                          <div className="text-base md:text-lg font-bold text-slate-700 leading-tight uppercase group-hover:text-indigo-900 transition-colors">
                            <HighlightedText text={item.name} query={searchTerm} />
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-xl md:text-2xl font-black text-emerald-500 tabular-nums tracking-tighter">
                            {formatCurrency(item.amount)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-8 py-48 text-center bg-white">
                        <div className="flex flex-col items-center">
                          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <i className="fa-solid fa-folder-open text-4xl text-slate-200"></i>
                          </div>
                          <p className="text-xl font-bold text-slate-300 uppercase tracking-widest">Không tìm thấy thông tin</p>
                          <p className="text-sm text-slate-400 mt-2">Hãy thử tìm kiếm với từ khóa khác</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="text-center mt-16 mb-12">
        <div className="inline-block px-6 py-2 bg-white/50 rounded-full border border-white text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">
          TRẦN ANH DŨNG • 2025
        </div>
      </div>
    </div>
  );
};

export default App;
