// app/chance/[uniName]/page.tsx

import { unis } from '@/data/unis'; // Предполагаем, что unis.ts находится в папке data
import { slugify } from '@/lib/utils'; // Импортируем slugify
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Lazy loading the calculator to ensure it's a client component and for optimization
const AdmissionChanceCalculator = dynamic(() => import('@/components/AdmissionChanceCalculator'), {
    ssr: false, // Client component
});

// Assuming you have Uni type definition
type Uni = typeof unis[0];

// Define the structure of the page's parameters
interface ChancePageProps {
    params: {
        uniName: string;
    };
}

export default function ChancePage({ params }: ChancePageProps) {
    // 1. Находим университет, используя слаг из URL
    const uniSlug = params.uniName;
    const selectedUni: Uni | undefined = unis.find(uni => slugify(uni.name) === uniSlug);

    if (!selectedUni) {
        // Если университет не найден, показываем страницу 404
        notFound();
    }

    // Добавляем текущий ВУЗ в калькулятор как первый элемент массива
    // (для совместимости с AdmissionChanceCalculator, который ожидает Uni[]).
    const unisForCalculator = [selectedUni];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium transition">
                    {'<'} Назад к Каталогу
                </Link>
                <h1 className="text-4xl font-extrabold mb-4">
                    Калькулятор шансов поступления:
                </h1>
                <p className="text-xl text-blue-700 font-semibold mb-8 border-b pb-4">
                    {selectedUni.name}
                </p>

                {/* 2. Рендер Калькулятора */}
                <AdmissionChanceCalculator selectedUnis={unisForCalculator} />
            </div>
        </div>
    );
}