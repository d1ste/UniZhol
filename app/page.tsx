"use client";
import { useState, useEffect, useMemo } from 'react';
// 💡 Убедитесь, что useEffect импортирован!
import { motion } from 'framer-motion';
import { Search, MapPin, Cpu, Globe, Scale, Check, X } from 'lucide-react';
import Link from 'next/link';
// ...
import { slugify } from '@/lib/utils'; // Если вы создали этот файл
// ...
// Тип данных, который мы ожидаем от сервера
interface University {
    id: number;
    name: string;
    city: string;
    country_rank: number;
    has_dormitory: boolean;
    ml_cs_strength: number;
    ExchangePrograms: string;
    PartnerUniversities: string;
    tour_url: string | null;
    website: string;
    [key: string]: any;
}

// ----------------------------------------------------
// 💡 СТАТИЧЕСКИЙ СПИСОК 3D ТУРОВ (10 ВУЗОВ, БЕЗ NU)
// ----------------------------------------------------
const STATIC_3D_TOURS = [
    { name: "Taraz Auesov University (TAU)", url: "https://evgeniyvolkov.com/pano/tau/" },
    { name: "Kazakh University of Technology and Business (КУТиБ)", url: "https://evgeniyvolkov.com/pano/kutib/index.html" },
    { name: "KIMEP University", url: "https://www.kimep.kz/3d-tour/#pano753/179.7/30.6/74.4" },
    { name: "Turan University", url: "https://turan.edu.kz/ru/3dtour/" },
    { name: "Almaty Management University (AlmaU)", url: "https://pano3d.kz/AlmaU_VR/#media=1&yaw=-8.52&pitch=-14.65&fov=110.00" },
    { name: "Atyrau University of Oil and Gas", url: "https://vrmir3d.com/AGEU_VR/#media=1&yaw=-3.85&pitch=5.19&fov=109.96" },
    { name: "Sh. Yessenov Caspian State University (Есенов)", url: "https://yu.edu.kz/ru/3d-tur/" },
    { name: "Maqsut Narikbayev University (MNU/Narxoz)", url: "https://mir3d.kz/Narxoz_VR/" },
    { name: "QyzPU (Q-Uni)", url: "https://q-university.edu.kz/ru/about/virtual-tour" },
    { name: "Kazakh National Pedagogical University (Abai)", url: "https://mir3d.kz/2017/04/05/kaznpu-im-abaya/" },
];

// ХАРАКТЕРИСТИКИ ДЛЯ СРАВНЕНИЯ (КЛЮЧИ СООТВЕТСТВУЮТ CSV)
const comparisonFields = [
    { key: 'country_rank', name: 'Нац. Рейтинг', format: (v: number) => `#${v}` },
    { key: 'ml_cs_strength', name: 'Сила IT/ML (1-5)', format: (v: number) => v },
    { key: 'city', name: 'Город', format: (v: string) => v },
    { key: 'has_dormitory', name: 'Общежитие', format: (v: boolean) => v ? <Check className="text-green-500" size={20} /> : <X className="text-red-500" size={20} /> },
    { key: 'has_sports_facilities', name: 'Спорт. Комплекс', format: (v: boolean) => v ? <Check className="text-green-500" size={20} /> : <X className="text-red-500" size={20} /> },
    { key: 'has_exchange', name: 'Обмен', format: (v: boolean) => v ? <Check className="text-green-500" size={20} /> : <X className="text-red-500" size={20} /> },
    { key: 'Partner Universities', name: 'Партнеры по Обмену', format: (v: string) => v },
    { key: 'Financial Aid', name: 'Фин. Помощь', format: (v: string) => v },
];

export default function Home() {
    const [query, setQuery] = useState('');
    const [aiResult, setAiResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('home');

    // Состояние данных
    const [isMounted, setIsMounted] = useState(false);
    const [unis, setUnis] = useState<University[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const [selectedUnis, setSelectedUnis] = useState<(University | null)[]>([null, null]);
    const [selectedTour, setSelectedTour] = useState<string | null>(STATIC_3D_TOURS[0]?.url || null);

    // НОВЫЕ СОСТОЯНИЯ ДЛЯ МОДАЛЬНОГО ОКНА И AI-ДАННЫХ
    const [modalUni, setModalUni] = useState<University | null>(null);
    const [uniDetails, setUniDetails] = useState<any>(null); // Здесь будут данные от AI
    const [isDetailsLoading, setIsDetailsLoading] = useState(false); // Состояние загрузки AI


    // --- ФУНКЦИЯ ЗАГРУЗКИ ДАННЫХ ИЗ НАШЕГО CSV ЧЕРЕЗ API ---
    useEffect(() => {
        setIsMounted(true);

        async function fetchUnis() {
            try {
                const res = await fetch('/api/universities');
                const data = await res.json();

                if (data.error) {
                    console.error("Error loading universities:", data.error);
                    setUnis([]);
                } else {
                    setUnis(data);
                }
            } catch (e) {
                console.error("Failed to fetch universities API:", e);
                setUnis([]);
            } finally {
                setIsDataLoading(false);
            }
        }
        fetchUnis();
    }, []);

    // 💡 ФУНКЦИЯ: ОТКРЫТИЕ МОДАЛЬНОГО ОКНА И ЗАПРОС К AI
    const openUniModal = async (uni: University) => {
        setModalUni(uni);
        setUniDetails(null); // Очищаем старые данные
        setIsDetailsLoading(true);

        console.log(`[DEBUG] Запрос деталей для: ${uni.name}`); // Диагностика

        try {
            const res = await fetch('/api/uni-details', {
                method: 'POST',
                body: JSON.stringify({ uniName: uni.name }),
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();

            console.log("[DEBUG] Ответ AI:", data); // Диагностика
            setUniDetails(data);
        } catch (e) {
            console.error("Failed to fetch university details:", e);
            setUniDetails({ error: "Не удалось получить информацию от AI. Проверьте консоль." });
        } finally {
            setIsDetailsLoading(false);
        }
    };

    // 💡 ФУНКЦИЯ: ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА
    const closeUniModal = () => {
        setModalUni(null);
        setUniDetails(null);
        setIsDetailsLoading(false);
    };

    const handleAiSearch = async () => {
        // ... (остальной код AI Search) ...
        if (!query) return;
        setLoading(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({ query }),
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            setAiResult(data);
        } catch (e) {
            console.error(e);
            setAiResult({ error: "Ошибка соединения с AI. Проверьте API Key." });
        } finally {
            setLoading(false);
        }
    };

    const handleTourSelection = (url: string | null) => {
        if (url) {
            setSelectedTour(url);
        }
    };

    const handleComparisonSelect = (uniName: string, index: number) => {
        const uni = unis.find(u => u.name === uniName) || null;
        const newSelectedUnis = [...selectedUnis];
        newSelectedUnis[index] = uni;
        setSelectedUnis(newSelectedUnis);
    };

    if (!isMounted || isDataLoading) {
        if (isDataLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <p className="text-xl font-medium text-blue-600">Загрузка данных из CSV...</p>
                </div>
            );
        }
    }

    // 💡 ИСПРАВЛЕННЫЙ КОМПОНЕНТ: МОДАЛЬНОЕ ОКНО С БЕЗОПАСНЫМ РЕНДЕРИНГОМ
    const UniModal = () => {
        if (!modalUni) return null;

        const tabs = [
            { key: 'Mission', name: 'Миссия' },
            { key: 'History', name: 'История' },
            { key: 'Leadership', name: 'Лидерство' },
            { key: 'Achievements', name: 'Достижения' },
        ];

        const [activeInfoTab, setActiveInfoTab] = useState('Mission');

        useEffect(() => {
            setActiveInfoTab('Mission');
        }, [modalUni]);

        const currentContent = uniDetails ? uniDetails[activeInfoTab] : null;

        // 💡 ФУНКЦИЯ БЕЗОПАСНОГО РЕНДЕРИНГА
        const renderContent = (content: any) => {
            if (typeof content === 'string' || typeof content === 'number') {
                return <p className="text-slate-700 whitespace-pre-line">{content}</p>;
            }

            // Обработка случая, когда AI вернул объект или массив вместо строки
            if (content && typeof content === 'object') {
                // Отображаем ошибку и сам объект в формате JSON для отладки
                return (
                    <>
                        <p className="text-red-500 font-bold mb-2">⚠️ Ошибка форматирования данных от AI!</p>
                        <p className="text-red-700 mb-2">AI вернул структурированный объект вместо простого текста.</p>
                        <pre className="bg-red-50 p-3 rounded text-sm overflow-auto text-red-900">
                            {JSON.stringify(content, null, 2)}
                        </pre>
                    </>
                );
            }
            return <p className="text-slate-500">Информация не предоставлена.</p>;
        };

        return (
            <div
                className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
                onClick={closeUniModal}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
                        <h3 className="text-2xl font-bold text-blue-600">{modalUni.name}</h3>
                        <p className="text-sm text-slate-500">{modalUni.city} | <a href={modalUni.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{modalUni.website}</a></p>
                        <button onClick={closeUniModal} className="absolute top-4 right-4 text-slate-500 hover:text-slate-900">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 min-h-[300px]">
                        {/* Навигация по вкладкам */}
                        <div className="flex border-b border-slate-200 mb-4">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveInfoTab(tab.key)}
                                    className={`px-4 py-2 text-sm font-medium ${activeInfoTab === tab.key
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    disabled={isDetailsLoading}
                                >
                                    {tab.name}
                                </button>
                            ))}
                        </div>

                        {/* Контент */}
                        <motion.div
                            key={activeInfoTab + (isDetailsLoading ? 'loading' : 'loaded')}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isDetailsLoading ? (
                                <div className="flex flex-col gap-3 p-4">
                                    <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse"></div>
                                    <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                                    <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
                                    <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                                </div>
                            ) : uniDetails && uniDetails.error ? (
                                <p className="text-red-500">Ошибка: {uniDetails.error}</p>
                            ) : (
                                <>
                                    <h4 className="font-semibold text-lg mb-2">{tabs.find(t => t.key === activeInfoTab)?.name}:</h4>
                                    {renderContent(currentContent)} {/* 💡 ИСПОЛЬЗУЕМ БЕЗОПАСНЫЙ РЕНДЕРИНГ */}
                                </>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        );
    };


    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* --- NAVBAR --- */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">U</div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        UniZhol
                    </span>
                </div>
                <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
                    <button onClick={() => setActiveTab('home')} className={`hover:text-blue-600 ${activeTab === 'home' ? 'text-blue-600' : ''}`}>AI Репликатор</button>
                    <Link href="/roadmap" className="hover:text-blue-600">AI Roadmap</Link> {/* 💡 ДОБАВИТЬ ЭТУ ССЫЛКУ */}
                    <button onClick={() => setActiveTab('tour')} className={`hover:text-blue-600 ${activeTab === 'tour' ? 'text-blue-600' : ''}`}>3D Кампус</button>
                    <button onClick={() => setActiveTab('comparison')} className={`hover:text-blue-600 ${activeTab === 'comparison' ? 'text-blue-600' : ''}`}>Сравнение Вузов</button>
                    <button onClick={() => setActiveTab('catalog')} className={`hover:text-blue-600 ${activeTab === 'catalog' ? 'text-blue-600' : ''}`}>Каталог</button>
                </div>
                <Link
                    href="/login" // Ссылка на новую страницу
                    className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition shadow-md"
                >
                    Войти
                </Link>
            </nav>

            {/* БЛОК ЗАГРУЗКИ */}
            {isDataLoading && (
                <div className="flex items-center justify-center h-[calc(100vh-80px)] text-xl font-medium text-blue-600">
                    Загрузка данных ({unis.length} вузов) из CSV...
                </div>
            )}

            {/* --- ОСНОВНОЙ КОНТЕНТ --- */}
            {!isDataLoading && (
                <>
                    {/* 1. AI REPLICATOR SECTION */}
                    {activeTab === 'home' && (
                        // ... (остается прежним) ...
                        <div className="max-w-5xl mx-auto px-6 pt-20 pb-20">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
                                    UniZhol: Ваш <span className="text-blue-600">Идеальный Путь</span> в Университет
                                </h1>
                                <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                                    AI-репликатор использует полную базу {unis.length} вузов для точного подбора.
                                </p>
                            </motion.div>

                            <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex flex-col md:flex-row gap-2 max-w-3xl mx-auto mb-16 relative overflow-hidden">
                                <textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Пример: Хочу стать ML-инженером, нужен вуз в Алматы с общежитием и обменом в Корею..."
                                    className="flex-1 p-4 outline-none text-slate-700 resize-none h-24 md:h-auto rounded-xl"
                                />
                                <button
                                    onClick={handleAiSearch}
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 md:w-auto w-full"
                                >
                                    {loading ? <Cpu className="animate-spin" /> : <Search size={20} />}
                                    {loading ? "Анализ..." : "Подобрать"}
                                </button>
                            </div>

                            {aiResult && aiResult.error ? (
                                <div className="text-center p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl max-w-xl mx-auto">
                                    <p>⚠️ **Ошибка AI:** {aiResult.error}</p>
                                    <p className="mt-2 text-sm">Проверьте, установлен ли **MISTRAL_API_KEY** на Vercel или в `.env.local`.</p>
                                </div>
                            ) : aiResult && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
                                    {aiResult.recommendations?.map((rec: any, idx: number) => {
                                        const uni = unis.find(u => u.name === rec.name);
                                        if (!uni) return null;

                                        return (
                                            <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 bg-green-100 text-green-700 px-3 py-1 rounded-bl-lg text-sm font-bold">
                                                    {rec.match_score}% Match
                                                </div>
                                                <div className="flex gap-4 mb-4">
                                                    <Globe size={40} className="text-blue-500 mt-2" />
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-900 leading-tight">{uni.name}</h3>
                                                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin size={14} /> {uni.city}</p>
                                                    </div>
                                                </div>
                                                <p className="text-slate-700 mb-4 bg-slate-50 p-3 rounded-lg text-sm">
                                                    🤖 <b>AI анализ:</b> {rec.reason}
                                                </p>
                                                <div className="flex gap-2 flex-wrap text-xs text-slate-500">
                                                    <span className="bg-slate-100 px-2 py-1 rounded">Рейтинг IT: {uni.ml_cs_strength}/5</span>
                                                    <span className="bg-slate-100 px-2 py-1 rounded">Общежитие: {uni.has_dormitory ? 'Есть' : 'Нет'}</span>
                                                    <span className="bg-slate-100 px-2 py-1 rounded">Обмен: {uni.ExchangePrograms ? 'Да' : 'Нет'}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* 2. 3D TOUR SECTION */}
                    {activeTab === 'tour' && (
                        // ... (остается прежним) ...
                        <div className="h-[calc(100vh-80px)] w-full bg-slate-100 relative">
                            <div className="absolute top-0 w-full z-10 bg-white/95 p-4 shadow-md">
                                <h3 className="font-bold text-lg mb-2">Виртуальный Кампус ({STATIC_3D_TOURS.length} туров)</h3>
                                <p className="text-sm text-slate-600 mb-3">Выберите университет, чтобы посетить его виртуально:</p>
                                <select
                                    onChange={(e) => handleTourSelection(e.target.value)}
                                    value={selectedTour || ''}
                                    className="w-full md:w-1/3 p-2 border border-slate-300 rounded-lg bg-white"
                                >
                                    <option value="" disabled>Выберите 3D тур...</option>
                                    {STATIC_3D_TOURS.map((tour) => (
                                        <option key={tour.url} value={tour.url}>{tour.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedTour ? (
                                <iframe
                                    src={selectedTour}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, marginTop: '120px' }}
                                    allowFullScreen
                                    loading="lazy"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-xl text-slate-500 pt-20">
                                    Выберите университет из списка выше, чтобы начать 3D-тур.
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. COMPARISON SECTION */}
                    {activeTab === 'comparison' && (
                        // ... (остается прежним) ...
                        <div className="max-w-7xl mx-auto px-6 py-12">
                            <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
                                <Scale size={30} className="text-blue-600" /> Сравнение Университетов
                            </h2>
                            <p className="text-lg text-slate-600 mb-8">Выберите два университета, чтобы сравнить их ключевые параметры.</p>

                            <div className="grid md:grid-cols-2 gap-6 mb-10">
                                <select
                                    onChange={(e) => handleComparisonSelect(e.target.value, 0)}
                                    className="p-3 border border-slate-300 rounded-lg bg-white text-lg font-medium"
                                    value={selectedUnis[0]?.name || ''}
                                >
                                    <option value="">Выберите ВУЗ 1 ({unis.length} в базе)...</option>
                                    {unis.map(uni => (
                                        <option key={uni.id} value={uni.name}>{uni.name} ({uni.city})</option>
                                    ))}
                                </select>
                                <select
                                    onChange={(e) => handleComparisonSelect(e.target.value, 1)}
                                    className="p-3 border border-slate-300 rounded-lg bg-white text-lg font-medium"
                                    value={selectedUnis[1]?.name || ''}
                                >
                                    <option value="">Выберите ВУЗ 2 ({unis.length} в базе)...</option>
                                    {unis.map(uni => (
                                        <option key={uni.id} value={uni.name}>{uni.name} ({uni.city})</option>
                                    ))}
                                </select>
                            </div>

                            {(selectedUnis[0] || selectedUnis[1]) && (
                                <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                                    <div className="grid grid-cols-3 bg-blue-50 font-bold text-slate-700 border-b border-blue-200 p-4">
                                        <div>Параметр</div>
                                        <div>{selectedUnis[0]?.name || 'ВУЗ 1'}</div>
                                        <div>{selectedUnis[1]?.name || 'ВУЗ 2'}</div>
                                    </div>

                                    {comparisonFields.map((field) => (
                                        <div key={field.key} className="grid grid-cols-3 border-b border-slate-100 p-4 hover:bg-slate-50 transition">
                                            <div className="font-medium text-slate-700">{field.name}</div>
                                            <div className="text-slate-600">
                                                {selectedUnis[0] ? field.format((selectedUnis[0] as any)[field.key]) : '—'}
                                            </div>
                                            <div className="text-slate-600">
                                                {selectedUnis[1] ? field.format((selectedUnis[1] as any)[field.key]) : '—'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. CATALOG SECTION */}
                    {activeTab === 'catalog' && (
                        <div className="max-w-7xl mx-auto px-6 py-12">
                            <h2 className="text-3xl font-bold mb-8">Каталог Вузов (Все {unis.length} из CSV)</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {unis.map((uni) => (
                                    // 💡 ИСПРАВЛЕНИЕ: Добавляем клик для открытия модального окна
                                    <div
                                        key={uni.id}
                                        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition cursor-pointer"
                                        onClick={() => openUniModal(uni)}
                                    >
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg leading-tight">{uni.name}</h3>
                                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">Rank #{uni.country_rank}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-4 flex items-center gap-1"><MapPin size={14} /> {uni.city}</p>

                                            <div className="space-y-2 text-sm text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <Cpu size={16} className="text-slate-400" />
                                                    <span>IT Strength: <b>{uni.ml_cs_strength}/5</b></span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Globe size={16} className="text-slate-400" />
                                                    <span className="truncate w-full">Обмен: {uni['Exchange Programs']}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>



                    )}
                </>
            )}

            {/* 💡 ДОБАВЛЯЕМ МОДАЛЬНОЕ ОКНО В КОНЕЦ ТЕЛА */}
            <UniModal />
        </main>
    );
}