import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShoppingBasket, 
  History as HistoryIcon, 
  Plus, 
  Minus, 
  ChevronDown, 
  ChevronUp, 
  List, 
  Settings, 
  Check,
  Trash2,
  Calendar,
  Store,
  X,
  Camera,
  Tag,
  Sun,
  Moon,
  Share2,
  ScanLine,
  Loader,
  TrendingUp,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Tipler
type Category = 'MANAV' | 'SÜT' | 'ET' | 'KİLER' | 'DİĞER';

interface GroceryItem {
  id: string;
  name: string;
  category: Category;
  market: string;
  quantity: number;
  completed: boolean;
}

interface HistoryItem {
  name: string;
  market: string;
}

interface HistoryTrip {
  id: string;
  store: string;
  date: string;
  itemCount: number;
  detailedItems: HistoryItem[];
}

interface ReceiptAnalysis {
  storeName: string;
  date: string;
  total: number;
}

interface ReceiptPhoto {
  id: string;
  date: string;
  imageUrl: string;
  analysis?: ReceiptAnalysis;
}

export default function App() {
  const [view, setView] = useState<'list' | 'history' | 'receipts' | 'settings'>('list');
  
  // Yerel Hafızadan Yükleme Fonksiyonu
  const getSavedData = (key: string, defaultValue: any) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  };

  // State Tanımlamaları (Başlangıç verilerini localStorage'dan alıyoruz)
  const [items, setItems] = useState<GroceryItem[]>(() => getSavedData('fc_items', []));
  const [history, setHistory] = useState<HistoryTrip[]>(() => getSavedData('fc_history', []));
  const [markets, setMarkets] = useState<string[]>(() => getSavedData('fc_markets', ['Genel', 'Migros', 'BİM', 'A101', 'Şok', 'Kasap']));
  const [receipts, setReceipts] = useState<ReceiptPhoto[]>(() => getSavedData('fc_receipts', []));
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getSavedData('fc_darkmode', true));
  const [apiKey, setApiKey] = useState<string>(() => getSavedData('fc_apikey', ''));
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptPhoto | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('Genel');
  const [newMarketName, setNewMarketName] = useState('');
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  // VERİLERİ KAYDETME (Her değişimde otomatik çalışır)
  useEffect(() => { localStorage.setItem('fc_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('fc_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('fc_markets', JSON.stringify(markets)); }, [markets]);
  useEffect(() => { localStorage.setItem('fc_receipts', JSON.stringify(receipts)); }, [receipts]);
  useEffect(() => { localStorage.setItem('fc_darkmode', JSON.stringify(isDarkMode)); }, [isDarkMode]);
  useEffect(() => { localStorage.setItem('fc_apikey', JSON.stringify(apiKey)); }, [apiKey]);

  // Tema Uygulama
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const activeItems = useMemo(() => items.filter(i => !i.completed), [items]);
  const completedItems = useMemo(() => items.filter(i => i.completed), [items]);
  const categories = useMemo(() => Array.from(new Set(activeItems.map(i => i.category))).sort(), [activeItems]);

  const addItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;
    setItems([{ id: Date.now().toString(), name: newItemName.trim(), category: 'DİĞER', market: selectedMarket, quantity: 1, completed: false }, ...items]);
    setNewItemName('');
    inputRef.current?.focus();
  };

  const finishShopping = () => {
    if (completedItems.length === 0) return;
    const newTrip: HistoryTrip = {
      id: Date.now().toString(),
      store: new Set(completedItems.map(i => i.market)).size > 1 ? "Çoklu Market" : completedItems[0].market,
      date: new Date().toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
      itemCount: completedItems.length,
      detailedItems: completedItems.map(i => ({ name: i.name, market: i.market }))
    };
    setHistory([newTrip, ...history]);
    setItems(items.filter(i => !i.completed));
    setView('history');
  };

  const analyzeReceipt = async (receipt: ReceiptPhoto) => {
    if (!apiKey) { alert('Lütfen önce Ayarlar bölümünden API anahtarınızı girin.'); setView('settings'); return; }
    setAnalyzingId(receipt.id);
    try {
      const prompt = 'Bu bir market fişi. Sadece şu JSON formatında yanıt ver, başka hiçbir şey yazma: {"storeName":"Market adı","date":"GG/AA/YYYY","total":125.00} Toplam tutarı fişin en altındaki TOPLAM veya GENEL TOPLAM satırından al. Sayı olarak ver, TL/₺ sembolü olmadan.';

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://bilgenotlar.github.io/freshcart',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: receipt.imageUrl } },
              { type: 'text', text: prompt }
            ]
          }]
        })
      });
      clearTimeout(timeout);

      const data = await response.json();
      if (data.error) throw new Error(`Hata: ${data.error.message}`);
      const text = data.choices?.[0]?.message?.content || '';
      if (!text) throw new Error('Model boş yanıt döndü. Tekrar deneyin.');
      const clean = text.replace(/```json|```/g, '').trim();
      const analysis: ReceiptAnalysis = JSON.parse(clean);
      setReceipts(prev => prev.map(r => r.id === receipt.id ? { ...r, analysis } : r));
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        alert('Zaman aşımı: 30 saniyede yanıt gelmedi.');
      } else {
        alert(`Hata: ${err?.message || JSON.stringify(err)}`);
      }
    } finally {
      setAnalyzingId(null);
    }
  };

  const shareViaWhatsApp = async () => {
    if (activeItems.length === 0 && completedItems.length === 0) return;

    const allItems = [...activeItems, ...completedItems];
    const byMarket: Record<string, GroceryItem[]> = {};
    allItems.forEach(item => {
      if (!byMarket[item.market]) byMarket[item.market] = [];
      byMarket[item.market].push(item);
    });

    let message = `🛒 *FreshCart Alışveriş Listem*\n`;
    message += `📅 ${today}\n\n`;

    Object.entries(byMarket).forEach(([market, marketItems]) => {
      message += `🏪 *${market.toUpperCase()}*\n`;
      marketItems.forEach(item => {
        const check = item.completed ? '✅' : '☐';
        message += `  ${check} ${item.name}\n`;
      });
      message += '\n';
    });

    message += `─────────────────\n`;
    message += `📦 Toplam: ${allItems.length} ürün`;
    if (completedItems.length > 0) {
      message += ` (${completedItems.length} alındı)`;
    }
    message += `\n\n💬 *Eklemek veya çıkarmak istediğin bir şey varsa bana yaz* 😊\n\n🔗 _bilgenotlar.github.io/freshcart_`;

    // PWA ve mobilde Web Share API dene, olmazsa WhatsApp linkine düş
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
        return;
      } catch (err) {
        // Kullanıcı iptal ettiyse sessizce geç
      }
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex justify-center transition-colors duration-300 select-none">
      <div className="w-full max-w-md relative flex flex-col h-[100dvh] overflow-hidden border-x border-black/5 dark:border-white/5 shadow-2xl">
        
        <header className="px-6 pt-10 pb-4 sticky top-0 z-20 bg-inherit/90 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBasket className="text-[var(--primary-color)]" size={28} />
              <h1 className="text-2xl font-bold tracking-tight uppercase">
                {view === 'list' ? 'Listem' : view === 'history' ? 'Geçmiş' : view === 'receipts' ? 'Fişlerim' : 'Ayarlar'}
              </h1>
            </div>
            <div className="opacity-60 text-[10px] font-bold flex items-center gap-1 uppercase tracking-tighter">
              <Calendar size={12} className="text-[var(--primary-color)]" /> {today}
            </div>
            {view === 'list' && (activeItems.length > 0 || completedItems.length > 0) && (
              <button
                onClick={shareViaWhatsApp}
                className="flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-2 rounded-xl text-[10px] font-black shadow-lg active:scale-95 transition-transform"
              >
                <Share2 size={13} />
                <span>PAYLAŞ</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-36 px-6 scrolling-touch">
          <AnimatePresence mode="wait">
            
            {view === 'list' && (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <form onSubmit={addItem} className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <button type="button" onClick={() => addItem()} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-color)] active:scale-125 z-10"><Plus size={22} strokeWidth={3} /></button>
                    <input ref={inputRef} type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Ürün adı..." enterKeyHint="done" className="w-full h-14 pl-12 pr-4 bg-black/5 dark:bg-white/5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary/30 text-base" />
                  </div>
                  <div className="relative">
                    <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="h-14 px-4 bg-black/5 dark:bg-white/5 rounded-2xl border-none outline-none text-xs font-black text-[var(--primary-color)] appearance-none min-w-[90px] dark:text-[#13ec5b]">
                      {markets.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                  </div>
                </form>

                {categories.map(cat => (
                  <section key={cat} className="mt-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">{cat}</h2>
                    <div className="space-y-3">
                      {activeItems.filter(i => i.category === cat).map(item => (
                        <div key={item.id} className="flex items-center justify-between card-bg p-4 rounded-2xl shadow-sm active:bg-black/5 dark:active:bg-white/5" onClick={() => setItems(items.map(i => i.id === item.id ? {...i, completed: true} : i))}>
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full border-2 border-primary/30 flex items-center justify-center transition-colors" />
                            <div><p className="font-bold text-sm">{item.name}</p><p className="text-[9px] text-[var(--primary-color)] font-black flex items-center gap-1 uppercase tracking-wider"><Store size={9} /> {item.market}</p></div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setItems(items.filter(i => i.id !== item.id)); }} className="p-2 opacity-30 text-red-500"><X size={20}/></button>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                {completedItems.length > 0 && (
                  <section className="mt-10 pt-6 border-t border-black/5 dark:border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <button onClick={() => setIsCompletedExpanded(!isCompletedExpanded)} className="flex items-center gap-2 opacity-40 text-[10px] font-black uppercase tracking-wider">ALINANLAR ({completedItems.length}) {isCompletedExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</button>
                      <button onClick={finishShopping} className="bg-[#13ec5b] text-black px-4 py-2 rounded-xl text-[10px] font-black shadow-lg">BİTİR</button>
                    </div>
                    {isCompletedExpanded && (
                      <div className="space-y-2 opacity-60">
                        {completedItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-xl" onClick={() => setItems(items.map(i => i.id === item.id ? {...i, completed: false} : i))}>
                            <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-black"><Check size={14} strokeWidth={4}/></div><span className="line-through text-xs font-bold">{item.name}</span></div>
                            <button onClick={(e) => { e.stopPropagation(); setItems(items.filter(i => i.id !== item.id)); }} className="p-2 opacity-40"><Trash2 size={16}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </motion.div>
            )}

            {view === 'history' && (
              <motion.div key="history" className="space-y-4 pt-2">
                {history.map(trip => (
                  <div key={trip.id} className="card-bg rounded-2xl overflow-hidden transition-all active:scale-[0.98]" onClick={() => setExpandedHistoryId(expandedHistoryId === trip.id ? null : trip.id)}>
                    <div className="p-5 relative">
                      <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2 text-[var(--primary-color)] font-black text-[10px] uppercase tracking-widest"><Store size={14} />{trip.store}</div>{expandedHistoryId === trip.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                      <h3 className="font-black text-base mb-1">{trip.itemCount} Ürün</h3>
                      <p className="text-[10px] opacity-40 font-bold uppercase">{trip.date}</p>
                      <button onClick={(e) => { e.stopPropagation(); setHistory(history.filter(t => t.id !== trip.id)); }} className="absolute bottom-5 right-5 text-red-500 opacity-20"><Trash2 size={18}/></button>
                    </div>
                    <AnimatePresence>{expandedHistoryId === trip.id && (<motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/5 px-5 py-4 overflow-hidden"><div className="space-y-3">{trip.detailedItems.map((detail, idx) => (<div key={idx} className="flex justify-between items-center text-xs font-bold"><div className="flex items-center gap-2"><Tag size={12} className="text-[var(--primary-color)]" /><span>{detail.name}</span></div><span className="text-[9px] bg-primary/20 text-[var(--primary-color)] px-2 py-1 rounded-md uppercase">{detail.market}</span></div>))}</div></motion.div>)}</AnimatePresence>
                  </div>
                ))}
              </motion.div>
            )}

            {view === 'receipts' && (
              <motion.div key="receipts" className="space-y-4 pt-2">

                {/* Fotoğraf ekle butonu - canvas ile sıkıştırarak kaydeder */}
                <button onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center gap-2 text-[var(--primary-color)] bg-primary/5 active:bg-primary/10">
                  <Camera size={32} />
                  <span className="text-xs font-black">FİŞ FOTOĞRAFI EKLE</span>
                </button>
                <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const img = new Image();
                    const objectUrl = URL.createObjectURL(file);
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      const MAX = 1200;
                      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
                      canvas.width = img.width * ratio;
                      canvas.height = img.height * ratio;
                      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
                      const imageUrl = canvas.toDataURL('image/jpeg', 0.82);
                      setReceipts(prev => [{ id: Date.now().toString(), date: new Date().toLocaleString('tr-TR'), imageUrl }, ...prev]);
                      URL.revokeObjectURL(objectUrl);
                    };
                    img.src = objectUrl;
                    e.target.value = '';
                  }}
                />

                {/* Fiş listesi */}
                <div className="space-y-3">
                  {receipts.map(r => (
                    <div key={r.id} className="card-bg rounded-2xl overflow-hidden">
                      <div className="flex gap-3 p-3 items-center">
                        {/* Fotoğrafa tıklayınca tam ekran */}
                        <img
                          src={r.imageUrl}
                          className="w-20 h-20 object-cover rounded-xl flex-shrink-0 cursor-pointer active:opacity-80"
                          alt="Fiş"
                          onClick={() => setViewingPhoto(r.imageUrl)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] opacity-40 font-bold uppercase mb-1">{r.date}</p>
                          {r.analysis ? (
                            <div>
                              <p className="font-black text-sm text-[var(--primary-color)]">{r.analysis.storeName}</p>
                              <p className="text-[10px] opacity-50 font-bold">{r.analysis.date}</p>
                              <p className="text-xl font-black mt-1 flex items-center gap-1">
                                <TrendingUp size={14} className="text-[var(--primary-color)]" />
                                {r.analysis.total.toFixed(2)} ₺
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() => analyzeReceipt(r)}
                              disabled={analyzingId === r.id}
                              className="flex items-center gap-2 bg-[var(--primary-color)] text-black px-3 py-2 rounded-xl text-[10px] font-black active:scale-95 disabled:opacity-50"
                            >
                              {analyzingId === r.id
                                ? <><Loader size={12} className="animate-spin" /> OKUNUYOR...</>
                                : <><ScanLine size={12} /> TOPLAMI OKU</>}
                            </button>
                          )}
                        </div>
                        <button onClick={() => setReceipts(receipts.filter(x => x.id !== r.id))} className="self-start p-1 opacity-30 text-red-500">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tam Ekran Fotoğraf Görüntüleyici */}
                <AnimatePresence>
                  {viewingPhoto && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
                      onClick={() => setViewingPhoto(null)}
                    >
                      <button className="absolute top-6 right-6 bg-white/10 p-3 rounded-full z-10">
                        <X size={22} className="text-white" />
                      </button>
                      <img
                        src={viewingPhoto}
                        className="max-w-full max-h-full object-contain"
                        alt="Fiş"
                        onClick={e => e.stopPropagation()}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}

            {view === 'settings' && (
              <motion.div key="settings" className="space-y-8 pt-2">
                <section>
                  <h2 className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-widest mb-4">Görünüm</h2>
                  <div className="card-bg p-4 rounded-2xl flex items-center justify-between" onClick={() => setIsDarkMode(!isDarkMode)}>
                    <div className="flex items-center gap-3">{isDarkMode ? <Moon size={20} className="text-[#13ec5b]" /> : <Sun size={20} className="text-orange-500" />}<span className="text-sm font-bold">{isDarkMode ? 'Karanlık Mod' : 'Açık Mod'}</span></div>
                    <div className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-[#13ec5b]' : 'bg-slate-300'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${isDarkMode ? 'left-7' : 'left-1'}`} /></div>
                  </div>
                </section>
                <section>
                  <h2 className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-widest mb-1">AI Fiş Okuma</h2>
                  <p className="text-[10px] opacity-40 font-bold mb-4">Fişleri otomatik okutmak için OpenRouter API anahtarı gerekli.<br/>Türkiye'de çalışır, <span className="text-[var(--primary-color)]">ücretsiz</span> modeller mevcut.<br/>openrouter.ai adresinden kayıt ol → API Keys → Create Key.</p>
                  <div className="card-bg p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3"><KeyRound size={16} className="text-[var(--primary-color)]" /><span className="text-xs font-black uppercase tracking-wider">API Anahtarı</span></div>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-or-..."
                      className="w-full h-12 px-4 bg-black/5 dark:bg-white/10 rounded-xl outline-none text-sm font-mono"
                    />
                    {apiKey && <p className="text-[10px] text-[var(--primary-color)] font-black mt-2 flex items-center gap-1"><Check size={10}/> API anahtarı kayıtlı</p>}
                  </div>
                </section>
                <section>
                  <h2 className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-widest mb-4">Marketler</h2>
                  <div className="flex gap-2 mb-4"><input type="text" value={newMarketName} onChange={(e) => setNewMarketName(e.target.value)} placeholder="Yeni market..." className="flex-1 h-12 px-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-sm" /><button onClick={() => { if(newMarketName.trim()) { setMarkets([...markets, newMarketName]); setNewMarketName(''); } }} className="bg-[#13ec5b] text-black px-4 rounded-xl font-black text-xs">EKLE</button></div>
                  <div className="grid grid-cols-2 gap-2">{markets.map(m => (<div key={m} className="bg-black/5 dark:bg-white/5 p-3 rounded-xl flex items-center justify-between"><span className="text-xs font-bold">{m}</span>{m !== 'Genel' && <button onClick={() => setMarkets(markets.filter(item => item !== m))} className="p-1 opacity-30 text-red-500"><X size={16}/></button>}</div>))}</div>
                </section>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-inherit/40 backdrop-blur-xl border-t border-black/5 dark:border-white/5 pb-10 pt-4 px-6 flex justify-around">
          <NavButton active={view === 'list'} icon={<List size={26}/>} label="LİSTE" onClick={() => setView('list')} />
          <NavButton active={view === 'receipts'} icon={<Camera size={26}/>} label="FİŞLER" onClick={() => setView('receipts')} />
          <NavButton active={view === 'history'} icon={<HistoryIcon size={26}/>} label="GEÇMİŞ" onClick={() => setView('history')} />
          <NavButton active={view === 'settings'} icon={<Settings size={26}/>} label="AYARLAR" onClick={() => setView('settings')} />
        </nav>
      </div>
    </div>
  );
}

const NavButton = ({ active, icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all active:scale-125 ${active ? 'text-[var(--primary-color)]' : 'opacity-30'}`}>
    {icon}
    <span className="text-[8px] font-black tracking-widest">{label}</span>
  </button>
);