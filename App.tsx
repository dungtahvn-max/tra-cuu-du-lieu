
import React, { useState, useMemo } from 'react';
import { fetchSheetData } from './services/sheetService';
import { SheetRow } from './types';
import { removeDiacritics, getRelevanceScore, formatCurrency } from './utils/stringUtils';

const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <span className="whitespace-pre-wrap break-words">{text}</span>;

  const qWords = removeDiacritics(query.trim()).split(/\s+/).filter(w => w.length > 0);
  const tNorm = removeDiacritics(text);
  
  // Tìm tất cả các vị trí khớp của từng từ khóa
  const matches: {start: number, end: number}[] = [];
  qWords.forEach(qw => {
    let pos = tNorm.indexOf(qw);
    while (pos !== -1) {
      matches.push({start: pos, end: pos + qw.length});
      pos = tNorm.indexOf(qw, pos + 1);
    }
  });

  if (matches.length === 0) return <span className="whitespace-pre-wrap break-words">{text}</span>;

  // Sắp xếp và gộp các vùng chồng lấp
  matches.sort((a, b) => a.start - b.start);
  const merged: {start: number, end: number}[] = [];
  let current = matches[0];
  for (let i = 1; i < matches.length; i++) {
    if (matches[i].start < current.end) {
      current.end = Math.max(current.end, matches[i].end);
    } else {
      merged.push(current);
      current = matches[i];
    }
  }
  merged.push(current);

  // Rebuild chuỗi với các thẻ <mark>
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach((m, i) => {
    parts.push(text.substring(cursor, m.start));
    parts.push(
      <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded-sm shadow-sm font-bold">
        {text.substring(m.start, m.end)}
      </mark>
    );
    cursor = m.end;
  });
  parts.push(text.substring(cursor));

  return <span className="whitespace-pre-wrap break-words">{parts}</span>;
};

const App: React.FC = () => {
  const [allData] = useState<SheetRow[]>(fetchSheetData());
  const [searchTerm, setSearchTerm] = useState('');

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
    <div className="min-h-screen bg-[#f0f4f8] text-slate-900 pb-20">
      {/* Search Header với Pastel Gradient loang màu */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-[#e0e7ff] via-[#fae8ff] to-[#fce7f3] border-b border-white/50 shadow-sm backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800 uppercase">
              TRA CỨU DỮ LIỆU
            </h1>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.5em] mt-3">
              DỮ LIỆU NỘI BỘ - 1436 BẢN GHI
            </p>
          </div>
          
          <div className="relative max-w-3xl mx-auto">
            <input
              type="text"
              placeholder="Nhập từ khóa (vd: pham trang, ut co trach)..."
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
                          <i className="fa-solid fa-search-plus text-4xl text-slate-200"></i>
                        </div>
                        <p className="text-xl font-bold text-slate-300 uppercase tracking-widest">Không có kết quả khớp</p>
                        <p className="text-sm text-slate-400 mt-2 italic">Thử tìm "ut trach" thay vì "ut co trach"</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="text-center mt-16 mb-12">
        <div className="inline-block px-8 py-3 bg-white/50 rounded-full border border-white text-[12px] font-black text-slate-500 uppercase tracking-[0.4em]">
          TRẦN ANH DŨNG - 2025
        </div>
      </div>
    </div>
  );
};

export default App;
