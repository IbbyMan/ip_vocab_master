
import React, { useRef, useState } from 'react';
import { SavedWord, IPType } from '../types';
import { IP_CONFIGS } from '../constants';

interface VocabBookProps {
  isOpen: boolean;
  onClose: () => void;
  words: SavedWord[];
  onRemove: (id: string) => void;
  onImport: (words: SavedWord[]) => void;
}

const VocabBook: React.FC<VocabBookProps> = ({ isOpen, onClose, words, onRemove, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleExport = () => {
    if (words.length === 0) {
      alert("生词本是空的，无法导出。");
      return;
    }
    const headers = ["单词", "音标", "释义", "记忆脑洞", "锚点", "IP名称"];
    const rows = words.map(w => {
      const ipConfig = IP_CONFIGS.find(c => c.type === w.ip);
      const displayName = w.customIPName || ipConfig?.label || w.ip;
      const values = [w.word, w.pronunciation, w.definition, w.mnemonic, w.sound_anchor, displayName];
      return values.map(val => `"${(val || "").toString().replace(/"/g, '""')}"`).join(",");
    });
    const csvContent = "\ufeff" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vocab_${new Date().toLocaleDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);
        const importedWords: SavedWord[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const fields: string[] = [];
          let currentField = '', inQuotes = false;
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { fields.push(currentField); currentField = ''; }
            else currentField += char;
          }
          fields.push(currentField);
          if (fields.length >= 6) {
            const [word, pron, def, mnemonic, anchor, ipName] = fields;
            const config = IP_CONFIGS.find(c => c.label === ipName);
            importedWords.push({
              id: `imp-${word}-${Date.now()}-${Math.random()}`,
              word, pronunciation: pron, definition: def, mnemonic, sound_anchor: anchor,
              ip: config ? config.type : IPType.CUSTOM,
              customIPName: config ? undefined : ipName,
              timestamp: Date.now()
            });
          }
        }
        onImport(importedWords);
      } catch (err) { alert("文件解析失败"); }
    };
    reader.readAsText(file);
  };

  const handleCopyWord = (word: SavedWord) => {
    const config = IP_CONFIGS.find(c => c.type === word.ip);
    const displayName = word.customIPName || config?.label || '未知';
    
    const textToCopy = [
      `单词：${word.word}`,
      `音标：${word.pronunciation}`,
      `释义：${word.definition}`,
      `记忆脑洞：${word.mnemonic}`,
      `锚点：${word.sound_anchor}`,
      `IP名称：${displayName}`
    ].join('\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(word.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`fixed right-0 top-0 h-full w-full sm:max-w-md bg-white z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform ${
        isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <div className="p-5 md:p-6 border-b bg-slate-50/80 backdrop-blur-md flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">📖 生词本</h2>
                <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 mt-2 border border-amber-100/50">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                  为避免网页缓存失效，请及时导出备份
                </span>
              </div>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm active:scale-90 transition-transform">✕</button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExport} className="flex-1 bg-white border border-slate-200 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95">📥 导出 CSV</button>
              <button onClick={handleImportClick} className="flex-1 bg-white border border-slate-200 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95">📤 导入 CSV</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {words.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                <span className="text-6xl grayscale opacity-50">📚</span>
                <p className="font-bold">暂时还没有收藏哦</p>
              </div>
            ) : (
              words.map((word) => {
                const config = IP_CONFIGS.find(c => c.type === word.ip);
                const displayName = word.customIPName || config?.label || '未知';
                return (
                  <div key={word.id} className="p-5 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all relative">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{word.word}</h3>
                        <span className="text-xs text-slate-400 font-serif">{word.pronunciation}</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleCopyWord(word)} 
                          className={`p-2 rounded-lg transition-colors ${copiedId === word.id ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                          title="复制详情"
                        >
                          {copiedId === word.id ? '✅' : '📋'}
                        </button>
                        <button 
                          onClick={() => onRemove(word.id)} 
                          className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 font-bold mb-3">{word.definition}</p>
                    <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/30 mb-3">
                      <p className="text-xs font-black text-indigo-900 leading-relaxed italic">“{word.mnemonic}”</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${config?.color || 'bg-slate-100'}`}>
                        {config?.icon} {displayName}
                      </span>
                      <span className="text-[10px] font-medium text-slate-300">{new Date(word.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VocabBook;
