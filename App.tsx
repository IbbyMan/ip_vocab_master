
import React, { useState, useEffect, useCallback } from 'react';
import { IPType, WordAssociation, SavedWord } from './types';
import { IP_CONFIGS, WORD_LIST } from './constants';
import { generateWordAssociation } from './services/geminiService';
import WordCard from './components/WordCard';
import VocabBook from './components/VocabBook';

const STORAGE_KEY = 'vocab_master_saved_v2';

const App: React.FC = () => {
  const [selectedIPs, setSelectedIPs] = useState<IPType[]>([]);
  const [customIPName, setCustomIPName] = useState('');
  const [inputWord, setInputWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<WordAssociation[]>([]);
  const [showVocabBook, setShowVocabBook] = useState(false);

  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load saved words from localStorage", e);
      return [];
    }
  });

  const presets = IP_CONFIGS.filter(ip => ip.type !== IPType.CUSTOM);
  const customConfig = IP_CONFIGS.find(ip => ip.type === IPType.CUSTOM)!;

  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(persistent => {
        if (persistent) {
          console.debug("💾 浏览器已授权持久化存储");
        }
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedWords));
  }, [savedWords]);

  const toggleSave = useCallback((item: WordAssociation) => {
    setSavedWords(prev => {
      const existingIndex = prev.findIndex(sw => 
        sw.word === item.word && 
        sw.ip === item.ip && 
        (sw.customIPName || '') === (item.customIPName || '')
      );

      if (existingIndex > -1) {
        return prev.filter((_, i) => i !== existingIndex);
      } else {
        const newWord: SavedWord = {
          id: `${item.word}-${item.ip}-${item.customIPName || 'default'}-${Date.now()}`,
          word: item.word,
          pronunciation: item.pronunciation,
          definition: item.definition,
          sound_anchor: item.sound_anchor,
          mnemonic: item.mnemonic,
          ip: item.ip,
          customIPName: item.customIPName,
          timestamp: Date.now()
        };
        return [newWord, ...prev];
      }
    });
  }, []);

  const removeSavedWord = useCallback((id: string) => {
    setSavedWords(prev => prev.filter(w => w.id !== id));
  }, []);

  const importWords = useCallback((words: SavedWord[]) => {
    setSavedWords(prev => {
      const combined = [...words, ...prev];
      const unique = Array.from(new Map(combined.map(item => [item.word + item.ip + (item.customIPName || ''), item])).values());
      return unique.sort((a, b) => b.timestamp - a.timestamp);
    });
  }, []);

  const toggleIP = (type: IPType) => {
    setSelectedIPs(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleAllPresets = () => {
    const presetTypes = presets.map(ip => ip.type);
    const areAllPresetsSelected = presetTypes.every(t => selectedIPs.includes(t));
    if (areAllPresetsSelected) {
      setSelectedIPs(prev => prev.filter(t => t === IPType.CUSTOM));
    } else {
      setSelectedIPs(prev => {
        const hasCustom = prev.includes(IPType.CUSTOM);
        return hasCustom ? [...presetTypes, IPType.CUSTOM] : [...presetTypes];
      });
    }
  };

  const isAllPresetsSelected = presets.map(ip => ip.type).every(t => selectedIPs.includes(t));

  const handleRoll = () => {
    const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setInputWord(randomWord);
  };

  const startGeneration = async () => {
    if (!inputWord || selectedIPs.length === 0) return;
    if (selectedIPs.includes(IPType.CUSTOM) && !customIPName.trim()) {
      alert("请输入你想定义的 IP 名称");
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const associations = await Promise.all(
        selectedIPs.map(ip => {
          const config = IP_CONFIGS.find(c => c.type === ip);
          const ipLabel = ip === IPType.CUSTOM ? customIPName : (config?.label || ip);
          return generateWordAssociation(inputWord, ipLabel, ip);
        })
      );
      setResults(associations.sort((a, b) => b.funScore - a.funScore));
    } catch (error) {
      alert("生成失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 pb-20 overflow-x-hidden selection:bg-indigo-100">
      <header className="bg-white/90 backdrop-blur-lg sticky top-0 z-30 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center border-b border-slate-100 shadow-sm transition-all">
        <div className="flex items-center gap-2.5">
          <img 
            src="/ipvocablogo.png" 
            alt="Logo" 
            className="w-9 h-9 md:w-10 md:h-10 object-contain"
          />
          <h1 className="text-lg md:text-2xl font-black tracking-tight text-slate-800">技能背单词</h1>
        </div>
        <button 
          onClick={() => setShowVocabBook(true)}
          className="relative group bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-white transition-all active:scale-90"
        >
          <span className="text-xl">📖</span>
          {savedWords.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ring-2 ring-white animate-in zoom-in">
              {savedWords.length}
            </span>
          )}
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12">
        <div className="mb-8 md:mb-16 space-y-2 md:space-y-4 text-center md:text-left">
          <p className="text-[#6C7C9E] text-xs md:text-base font-medium tracking-tight opacity-80">
            传统的背单词🙇就是反复地记忆📝好无趣而
          </p>
          <h2 className="text-4xl md:text-[64px] font-black text-[#1A1F36] tracking-tighter leading-[1.1] flex items-center justify-center md:justify-start gap-3">
            <img 
              src="/ipvocablogo.png" 
              alt="Logo" 
              className="w-12 h-12 md:w-16 md:h-16 object-contain"
            />
            技能⚡️背单词
          </h2>
          <p className="text-[#6C7C9E] text-xs md:text-base font-medium tracking-tight opacity-80">
            就是在传统的背单词📚加入IP💡好好玩😆
          </p>
        </div>

        <section className="mb-8 md:mb-14">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              第一步：挑选 IP
            </h3>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button 
                onClick={toggleAllPresets}
                className="text-[11px] md:text-xs font-black text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-lg active:scale-95 transition-all"
              >
                {isAllPresetsSelected ? '取消全选' : '全选预设'}
              </button>
              <span className="text-[10px] md:text-xs text-slate-400 font-medium">支持多选</span>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 mb-4">
            {presets.map(ip => (
              <button
                key={ip.type}
                onClick={() => toggleIP(ip.type)}
                className={`group relative aspect-[1/1.1] md:aspect-[4/5] rounded-2xl md:rounded-[2rem] overflow-hidden border-2 transition-all duration-300 ${
                  selectedIPs.includes(ip.type) 
                  ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-md bg-white' 
                  : 'border-slate-100 hover:border-slate-200 bg-white'
                } active:scale-95`}
              >
                <div className={`absolute inset-0 opacity-10 ${selectedIPs.includes(ip.type) ? 'opacity-20' : ''} ${ip.color}`}></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 gap-1">
                  <div className={`text-2xl md:text-4xl transition-transform ${selectedIPs.includes(ip.type) ? 'scale-110 rotate-6' : ''}`}>
                    {ip.icon}
                  </div>
                  <span className={`font-black text-xs md:text-base tracking-tight ${selectedIPs.includes(ip.type) ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {ip.label}
                  </span>
                </div>
                {selectedIPs.includes(ip.type) && (
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-[8px] md:text-[10px] font-bold">✓</div>
                )}
              </button>
            ))}
          </div>

          <div className="w-full">
            <button
              onClick={() => toggleIP(customConfig.type)}
              className={`w-full group relative py-4 md:py-6 rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 flex flex-col sm:flex-row items-center justify-between px-4 md:px-8 gap-3 ${
                selectedIPs.includes(customConfig.type) 
                ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-md bg-white' 
                : 'border-slate-100 bg-white'
              }`}
            >
              <div className="flex items-center gap-3 z-10">
                <div className={`text-2xl md:text-3xl ${selectedIPs.includes(customConfig.type) ? 'rotate-12 scale-110' : ''}`}>
                  {customConfig.icon}
                </div>
                <span className={`font-black text-sm md:text-lg ${selectedIPs.includes(customConfig.type) ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {customConfig.label}
                </span>
              </div>

              {selectedIPs.includes(customConfig.type) && (
                <div className="w-full sm:flex-1 relative z-10" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={customIPName}
                    onChange={(e) => setCustomIPName(e.target.value)}
                    placeholder="输入 IP 名称 (如: 原神)"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 outline-none text-sm font-bold bg-slate-50/50"
                  />
                </div>
              )}
            </button>
          </div>
        </section>

        <section className="mb-8 md:mb-14">
          <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
            第二步：输入单词
          </h3>
          <div className="flex flex-col gap-3">
            <div className="relative group flex-1">
              <input
                type="text"
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                placeholder="例如: apocalyptic"
                className="w-full pl-5 pr-5 py-4 md:py-5 rounded-2xl md:rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-lg md:text-xl font-bold shadow-sm"
              />
            </div>
            <button
              onClick={handleRoll}
              className="w-full md:w-auto px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-slate-500 font-bold text-sm"
            >
              🎲 随机抽一个单词
            </button>
          </div>
        </section>

        <div className="flex justify-center mb-10 md:mb-16">
          <button
            onClick={startGeneration}
            disabled={loading || !inputWord || selectedIPs.length === 0}
            className={`w-full md:w-auto px-16 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-xl shadow-xl transition-all active:scale-95 ${
              loading || !inputWord || selectedIPs.length === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-indigo-200'
            }`}
          >
            {loading ? '⚡️ 脑暴中...' : '梆梆 👊'}
          </button>
        </div>

        <div className="space-y-6 md:space-y-10">
          {results.map((res, idx) => (
            <WordCard 
              key={`${res.ip}-${idx}`} 
              data={res} 
              isSaved={savedWords.some(sw => sw.word === res.word && sw.ip === res.ip)}
              onSave={() => toggleSave(res)} 
            />
          ))}
        </div>
      </main>

      <VocabBook 
        isOpen={showVocabBook} 
        onClose={() => setShowVocabBook(false)} 
        words={savedWords}
        onRemove={removeSavedWord}
        onImport={importWords}
      />
    </div>
  );
};

export default App;
