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
  TrendingUp,
  BarChart2,
  Users,
  Copy,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, remove, off } from 'firebase/database';

// ── Firebase ──────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyC0AhpRpL2JS-_WtBenBNadgusp4FVxHPI",
  authDomain: "harcama-takip-487405.firebaseapp.com",
  databaseURL: "https://harcama-takip-487405-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "harcama-takip-487405",
  storageBucket: "harcama-takip-487405.firebasestorage.app",
  messagingSenderId: "730116755949",
  appId: "1:730116755949:web:50119049fa3eeabf7357e4"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
// ─────────────────────────────────────────────────────────────────

// ── IndexedDB yardımcısı ──────────────────────────────────────────
const DB_NAME = 'freshcart';
const STORE = 'photos';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function savePhoto(id: string, dataUrl: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(dataUrl, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getPhoto(id: string): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || '');
    req.onerror = () => reject(req.error);
  });
}

async function deletePhoto(id: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
// ─────────────────────────────────────────────────────────────────

// Tipler
type Category = 'MANAV' | 'SÜT' | 'ET' | 'KİLER' | 'DİĞER';

interface GroceryItem {
  id: string;
  name: string;
  category: Category;
  market: string;
  quantity: number;
  completed: boolean;
  addedBy?: string;
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

// imageUrl artık IndexedDB'de, metadata localStorage'da
interface ReceiptMeta {
  id: string;
  date: string;
  receiptDate: string;
  storeName?: string;
  total?: number;
}

interface ReceiptPhoto extends ReceiptMeta {
  imageUrl: string; // sadece bellekte, render için
}

export default function App() {
  const [view, setView] = useState<'list' | 'history' | 'receipts' | 'stats' | 'settings'>('list');
  
  // Yerel Hafızadan Yükleme Fonksiyonu
  const getSavedData = (key: string, defaultValue: any) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  };

  // State Tanımlamaları (Başlangıç verilerini localStorage'dan alıyoruz)
  const [items, setItems] = useState<GroceryItem[]>(() => getSavedData('fc_items', []));
  const [history, setHistory] = useState<HistoryTrip[]>(() => getSavedData('fc_history', []));
  const [markets, setMarkets] = useState<string[]>(() => getSavedData('fc_markets', ['Genel', 'Migros', 'BİM', 'A101', 'Şok', 'Kasap']));
  const [receipts, setReceipts] = useState<ReceiptPhoto[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getSavedData('fc_darkmode', true));
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // Aile paylaşımı
  const [roomCode, setRoomCode] = useState<string>(() => getSavedData('fc_roomcode', ''));
  const [userName, setUserName] = useState<string>(() => getSavedData('fc_username', ''));
  const [roomInput, setRoomInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Firebase'e bağlan / bağlantıyı kes
  useEffect(() => {
    if (!roomCode || !userName) { setIsConnected(false); return; }
    const itemsRef = ref(db, `rooms/${roomCode}/items`);
    const unsub = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loaded: GroceryItem[] = Object.values(data);
        setItems(loaded);
      } else {
        setItems([]);
      }
      setIsConnected(true);
    });
    return () => off(itemsRef);
  }, [roomCode, userName]);

  // Uygulama açılınca: metadata localStorage'dan, fotoğraflar IndexedDB'den yükle
  useEffect(() => {
    const metas: ReceiptMeta[] = getSavedData('fc_receipts_meta', []);
    if (metas.length === 0) return;
    Promise.all(metas.map(async m => ({ ...m, imageUrl: await getPhoto(m.id) })))
      .then(loaded => setReceipts(loaded));
  }, []);
  
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('Genel');
  const [newMarketName, setNewMarketName] = useState('');
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  // VERİLERİ KAYDETME (Her değişimde otomatik çalışır)
  useEffect(() => {
    localStorage.setItem('fc_items', JSON.stringify(items));
    if (roomCode && userName && isConnected) {
      const itemsRef = ref(db, `rooms/${roomCode}/items`);
      const obj: Record<string, GroceryItem> = {};
      items.forEach(i => { obj[i.id] = i; });
      set(itemsRef, items.length > 0 ? obj : null);
    }
  }, [items]);
  useEffect(() => { localStorage.setItem('fc_roomcode', JSON.stringify(roomCode)); }, [roomCode]);
  useEffect(() => { localStorage.setItem('fc_username', JSON.stringify(userName)); }, [userName]);
  useEffect(() => { localStorage.setItem('fc_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('fc_markets', JSON.stringify(markets)); }, [markets]);
  useEffect(() => {
    // Sadece metadata localStorage'a (fotoğraf hariç)
    const metas: ReceiptMeta[] = receipts.map(({ id, date, receiptDate, storeName, total }) => ({ id, date, receiptDate, storeName, total }));
    localStorage.setItem('fc_receipts_meta', JSON.stringify(metas));
  }, [receipts]);
  useEffect(() => { localStorage.setItem('fc_darkmode', JSON.stringify(isDarkMode)); }, [isDarkMode]);

  // Tema Uygulama
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const activeItems = useMemo(() => items.filter(i => !i.completed), [items]);
  const completedItems = useMemo(() => items.filter(i => i.completed), [items]);
  const marketGroups = useMemo(() => {
    const groups: Record<string, typeof activeItems> = {};
    activeItems.forEach(i => {
      if (!groups[i.market]) groups[i.market] = [];
      groups[i.market].push(i);
    });
    return groups;
  }, [activeItems]);

  const addItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;
    setItems([{ id: Date.now().toString(), name: newItemName.trim(), category: 'DİĞER', market: selectedMarket, quantity: 1, completed: false, addedBy: userName || undefined }, ...items]);
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
                    <select value={selectedMarket} onChange={(e) => { setSelectedMarket(e.target.value); if (newItemName.trim()) { setItems(prev => [{ id: Date.now().toString(), name: newItemName.trim(), category: 'DİĞER', market: e.target.value, quantity: 1, completed: false, addedBy: userName || undefined }, ...prev]); setNewItemName(''); inputRef.current?.focus(); } }} className="h-14 px-4 bg-black/5 dark:bg-white/5 rounded-2xl border-none outline-none text-xs font-black text-[var(--primary-color)] appearance-none min-w-[90px] dark:text-[#13ec5b]">
                      {markets.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                  </div>
                </form>

                {Object.entries(marketGroups).map(([market, marketItems]) => (
                  <section key={market} className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Store size={11} className="text-[var(--primary-color)]" />
                      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary-color)]">{market}</h2>
                      <span className="text-[9px] font-black opacity-30 ml-auto">{marketItems.length} ürün</span>
                    </div>
                    <div className="space-y-3">
                      {marketItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between card-bg p-4 rounded-2xl shadow-sm active:bg-black/5 dark:active:bg-white/5" onClick={() => setItems(items.map(i => i.id === item.id ? {...i, completed: true} : i))}>
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full border-2 border-primary/30 flex items-center justify-center transition-colors" />
                            <div>
                              <p className="font-bold text-sm">{item.name}</p>
                              {item.addedBy && item.addedBy.trim() && (
                                <p className="text-[9px] text-[var(--primary-color)] font-black opacity-70">{item.addedBy} ekledi</p>
                              )}
                            </div>
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

                {/* Fotoğraf ekle butonu */}
                <button onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center gap-2 text-[var(--primary-color)] bg-primary/5 active:bg-primary/10">
                  <Camera size={32} />
                  <span className="text-xs font-black">FİŞ FOTOĞRAFI EKLE</span>
                </button>
                <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      const MAX = 1200;
                      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
                      canvas.width = Math.round(img.width * ratio);
                      canvas.height = Math.round(img.height * ratio);
                      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
                      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
                      const id = Date.now().toString();
                      savePhoto(id, imageUrl); // IndexedDB'ye kaydet
                      setReceipts(prev => [{ id, date: new Date().toLocaleString('tr-TR'), receiptDate: new Date().toISOString().split('T')[0], imageUrl }, ...prev]);
                      URL.revokeObjectURL(url);
                    };
                    img.src = url;
                    e.target.value = '';
                  }}
                />

                {/* Fişler - tarihe göre gruplandırılmış */}
                {(() => {
                  // Tarihe göre grupla
                  const groups: Record<string, ReceiptPhoto[]> = {};
                  receipts.forEach(r => {
                    const key = r.receiptDate || r.date.split(' ')[0];
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(r);
                  });
                  // Tarihe göre sırala (yeniden eskiye)
                  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

                  if (sortedDates.length === 0) return (
                    <p className="text-center text-[11px] opacity-30 font-bold uppercase pt-4">Henüz fiş eklenmedi</p>
                  );

                  return sortedDates.map(dateKey => {
                    const dayReceipts = groups[dateKey];
                    const dayTotal = dayReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
                    const label = (() => {
                      try {
                        const d = new Date(dateKey);
                        return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                      } catch { return dateKey; }
                    })();

                    return (
                      <div key={dateKey} className="space-y-2">
                        {/* Gün başlığı + günlük toplam */}
                        <div className="flex items-center justify-between px-1 pt-2">
                          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-50">{label}</h3>
                          {dayTotal > 0 && (
                            <span className="text-xs font-black text-[var(--primary-color)] flex items-center gap-1">
                              <TrendingUp size={11} /> {dayTotal.toFixed(2)} ₺
                            </span>
                          )}
                        </div>

                        {dayReceipts.map(r => (
                          <div key={r.id} className="card-bg rounded-2xl overflow-hidden">
                            <div className="flex gap-3 p-3 items-start">
                              <img
                                src={r.imageUrl}
                                className="w-20 h-20 object-cover rounded-xl flex-shrink-0 cursor-pointer active:opacity-80"
                                alt="Fiş"
                                onClick={() => setViewingPhoto(r.imageUrl)}
                              />
                              <div className="flex-1 min-w-0 space-y-2">
                                {/* Tarih seçici */}
                                <input
                                  type="date"
                                  value={r.receiptDate || ''}
                                  onChange={(e) => setReceipts(prev => prev.map(x => x.id === r.id ? { ...x, receiptDate: e.target.value } : x))}
                                  className="w-full h-9 px-3 bg-black/5 dark:bg-white/10 rounded-xl outline-none text-xs font-bold"
                                />
                                {/* Market seçici */}
                                <select
                                  value={r.storeName || ''}
                                  onChange={(e) => setReceipts(prev => prev.map(x => x.id === r.id ? { ...x, storeName: e.target.value } : x))}
                                  className="w-full h-9 px-3 bg-black/5 dark:bg-white/10 rounded-xl outline-none text-xs font-black text-[var(--primary-color)] appearance-none"
                                >
                                  <option value="">Market seç...</option>
                                  {markets.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                {/* Tutar girişi */}
                                <div className="relative">
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="Toplam tutar"
                                    value={r.total ?? ''}
                                    onChange={(e) => setReceipts(prev => prev.map(x => x.id === r.id ? { ...x, total: parseFloat(e.target.value) || undefined } : x))}
                                    className="w-full h-9 pl-3 pr-8 bg-black/5 dark:bg-white/10 rounded-xl outline-none text-sm font-black"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black opacity-40">₺</span>
                                </div>
                                {r.storeName && r.total && (
                                  <p className="text-sm font-black flex items-center gap-1 text-[var(--primary-color)]">
                                    <TrendingUp size={12} /> {r.total.toFixed(2)} ₺
                                  </p>
                                )}
                              </div>
                              <button onClick={() => { deletePhoto(r.id); setReceipts(receipts.filter(x => x.id !== r.id)); }} className="p-1 opacity-30 text-red-500 flex-shrink-0">
                                <Trash2 size={18}/>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  });
                })()}

                {/* Tam Ekran Fotoğraf */}
                <AnimatePresence>
                  {viewingPhoto && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => setViewingPhoto(null)}>
                      <button className="absolute top-6 right-6 bg-white/10 p-3 rounded-full z-10"><X size={22} className="text-white" /></button>
                      <img src={viewingPhoto} className="max-w-full max-h-full object-contain" alt="Fiş" onClick={e => e.stopPropagation()} />
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}

            {view === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-2">

                {(() => {
                  if (receipts.length === 0) return (
                    <p className="text-center text-[11px] opacity-30 font-bold uppercase pt-10">Henüz fiş eklenmedi</p>
                  );

                  // Tüm fişlerden aylık ve haftalık data üret
                  const monthly: Record<string, number> = {};
                  const byMarket: Record<string, number> = {};

                  receipts.forEach(r => {
                    if (!r.total || !r.receiptDate) return;
                    const d = new Date(r.receiptDate);
                    const monthKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                    monthly[monthKey] = (monthly[monthKey] || 0) + r.total;
                    if (r.storeName) byMarket[r.storeName] = (byMarket[r.storeName] || 0) + r.total;
                  });

                  const monthKeys = Object.keys(monthly).sort();
                  const maxMonthly = Math.max(...Object.values(monthly), 1);

                  const marketKeys = Object.keys(byMarket).sort((a,b) => byMarket[b] - byMarket[a]);
                  const maxMarket = Math.max(...Object.values(byMarket), 1);

                  const grandTotal = receipts.reduce((s, r) => s + (r.total || 0), 0);
                  const receiptCount = receipts.filter(r => r.total).length;

                  return (
                    <>
                      {/* Özet kartlar */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="card-bg rounded-2xl p-4">
                          <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">Toplam Harcama</p>
                          <p className="text-lg font-black text-[var(--primary-color)]">{grandTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})} ₺</p>
                        </div>
                        <div className="card-bg rounded-2xl p-4">
                          <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">Fiş Sayısı</p>
                          <p className="text-lg font-black text-[var(--primary-color)]">{receiptCount} fiş</p>
                        </div>
                        {receiptCount > 0 && (
                          <div className="card-bg rounded-2xl p-4 col-span-2">
                            <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">Fiş Başı Ortalama</p>
                            <p className="text-lg font-black text-[var(--primary-color)]">{(grandTotal / receiptCount).toLocaleString('tr-TR', {minimumFractionDigits:2})} ₺</p>
                          </div>
                        )}
                      </div>

                      {/* Aylık harcama grafiği */}
                      {monthKeys.length > 0 && (
                        <section className="card-bg rounded-2xl p-4">
                          <h2 className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-widest mb-4">Aylık Harcama</h2>
                          <div className="space-y-3">
                            {monthKeys.map(mk => {
                              const [y, m] = mk.split('-');
                              const label = new Date(parseInt(y), parseInt(m)-1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                              const val = monthly[mk];
                              const pct = (val / maxMonthly) * 100;
                              return (
                                <div key={mk}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold opacity-60 capitalize">{label}</span>
                                    <span className="text-[11px] font-black text-[var(--primary-color)]">{val.toLocaleString('tr-TR', {minimumFractionDigits:2})} ₺</span>
                                  </div>
                                  <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--primary-color)] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      )}

                      {/* Market bazlı harcama */}
                      {marketKeys.length > 0 && (
                        <section className="card-bg rounded-2xl p-4">
                          <h2 className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-widest mb-4">Markete Göre</h2>
                          <div className="space-y-3">
                            {marketKeys.map(mk => {
                              const val = byMarket[mk];
                              const pct = (val / maxMarket) * 100;
                              return (
                                <div key={mk}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold opacity-60">{mk}</span>
                                    <span className="text-[11px] font-black text-[var(--primary-color)]">{val.toLocaleString('tr-TR', {minimumFractionDigits:2})} ₺</span>
                                  </div>
                                  <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--primary-color)] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      )}
                    </>
                  );
                })()}
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

                {/* Aile Paylaşımı */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={13} className="text-[var(--primary-color)]" />
                    <h2 className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-widest">Aile Paylaşımı</h2>
                    {isConnected && <span className="ml-auto text-[9px] font-black text-[#13ec5b] flex items-center gap-1">● BAĞLI</span>}
                  </div>

                  {!roomCode ? (
                    <div className="card-bg p-4 rounded-2xl space-y-3">
                      <p className="text-[10px] opacity-50 font-bold">Eşinle aynı listeyi paylaşmak için bir oda oluştur veya mevcut oda kodunu gir.</p>
                      <input
                        type="text"
                        placeholder="Adın (örn: Kemal)"
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        className="w-full h-10 px-3 bg-black/5 dark:bg-white/10 rounded-xl outline-none text-sm font-bold"
                      />
                      <button
                        onClick={() => {
                          if (!nameInput.trim()) return;
                          const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                          setUserName(nameInput.trim());
                          setRoomCode(code);
                        }}
                        className="w-full h-10 bg-[var(--primary-color)] text-black rounded-xl text-xs font-black"
                      >YENİ ODA OLUŞTUR</button>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Oda kodu gir..."
                          value={roomInput}
                          onChange={e => setRoomInput(e.target.value.toUpperCase())}
                          className="flex-1 h-10 px-3 bg-black/5 dark:bg-white/10 rounded-xl outline-none text-sm font-black tracking-widest"
                        />
                        <button
                          onClick={() => {
                            if (!nameInput.trim() || !roomInput.trim()) return;
                            setUserName(nameInput.trim());
                            setRoomCode(roomInput.trim());
                          }}
                          className="h-10 px-4 bg-black/10 dark:bg-white/10 rounded-xl text-xs font-black flex items-center gap-1"
                        ><LogIn size={14}/> GİR</button>
                      </div>
                    </div>
                  ) : (
                    <div className="card-bg p-4 rounded-2xl space-y-3">
                      <div>
                        <p className="text-[9px] opacity-40 font-bold uppercase mb-1">Adın</p>
                        <p className="font-black text-sm">{userName}</p>
                      </div>
                      <div>
                        <p className="text-[9px] opacity-40 font-bold uppercase mb-1">Oda Kodu</p>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-xl tracking-widest text-[var(--primary-color)]">{roomCode}</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(roomCode)}
                            className="p-2 bg-black/5 dark:bg-white/10 rounded-lg"
                          ><Copy size={14}/></button>
                        </div>
                        <p className="text-[9px] opacity-40 font-bold mt-1">Bu kodu eşine gönder, aynı kodu girerek bağlansın.</p>
                      </div>
                      <button
                        onClick={() => { setRoomCode(''); setUserName(''); setRoomInput(''); setNameInput(''); }}
                        className="text-[10px] font-black text-red-400 opacity-60"
                      >Odadan ayrıl</button>
                    </div>
                  )}
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

        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-inherit/40 backdrop-blur-xl border-t border-black/5 dark:border-white/5 pb-10 pt-4 px-4 flex justify-around">
          <NavButton active={view === 'list'} icon={<List size={24}/>} label="LİSTE" onClick={() => setView('list')} />
          <NavButton active={view === 'receipts'} icon={<Camera size={24}/>} label="FİŞLER" onClick={() => setView('receipts')} />
          <NavButton active={view === 'stats'} icon={<BarChart2 size={24}/>} label="ÖZET" onClick={() => setView('stats')} />
          <NavButton active={view === 'history'} icon={<HistoryIcon size={24}/>} label="GEÇMİŞ" onClick={() => setView('history')} />
          <NavButton active={view === 'settings'} icon={<Settings size={24}/>} label="AYARLAR" onClick={() => setView('settings')} />
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