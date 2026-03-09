
import React from 'react';
import { WordAssociation } from '../types';
import { IP_CONFIGS } from '../constants';

interface WordCardProps {
  data: WordAssociation;
  isSaved: boolean;
  onSave: () => void;
}

const WordCard: React.FC<WordCardProps> = ({ data, isSaved, onSave }) => {
  const ipConfig = IP_CONFIGS.find(c => c.type === data.ip);
  const displayName = data.customIPName || ipConfig?.label || data.ip;

  return (
    <div className="bg-white rounded-3xl md:rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl transition-all active:scale-[0.98]">
      <div className={`px-5 py-3 md:px-8 md:py-4 flex justify-between items-center ${ipConfig?.color} bg-opacity-30 border-b border-slate-100`}>
        <div className="flex items-center gap-2">
          <span className="text-xl md:text-2xl">{ipConfig?.icon}</span>
          <span className="font-black text-[10px] md:text-xs uppercase tracking-widest truncate max-w-[100px] sm:max-w-none">
            {displayName} · 助记招式
          </span>
        </div>
        <button 
          onClick={onSave}
          className={`px-4 py-1.5 md:px-5 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black transition-all shadow-sm active:scale-90 ${
            isSaved 
            ? 'bg-indigo-600 text-white' 
            : 'bg-white/80 text-slate-800'
          }`}
        >
          {isSaved ? '已收藏' : '收藏此招'}
        </button>
      </div>

      <div className="p-6 md:p-10">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-3 mb-1">
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{data.word}</h3>
                <span className="text-sm md:text-lg text-slate-400 font-medium font-serif">{data.pronunciation}</span>
              </div>
              <p className="text-lg md:text-xl text-slate-600 font-bold border-l-4 border-indigo-200 pl-4 py-1">{data.definition}</p>
            </div>
            {data.sound_anchor && (
              <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-2xl self-start sm:self-auto">
                <span className="text-[9px] font-black text-amber-500 uppercase block mb-0.5">听感锚点</span>
                <span className="text-base md:text-lg font-black text-amber-700">“{data.sound_anchor}”</span>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-slate-50/50 p-5 rounded-2xl md:rounded-3xl border border-slate-100">
              <h4 className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">词源拆解</h4>
              <p className="text-slate-700 text-sm md:text-base font-bold leading-relaxed">{data.association}</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-indigo-100/50 relative overflow-hidden group">
               <div className="absolute -top-4 -right-4 text-5xl md:text-6xl opacity-10">💡</div>
               <h4 className="text-[9px] font-black text-indigo-400 uppercase mb-2 tracking-widest">技能脑洞</h4>
               <p className="text-indigo-900 text-base md:text-lg leading-relaxed font-black italic">
                 “{data.mnemonic}”
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordCard;
