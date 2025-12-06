// lib/data.ts (УЛУЧШЕННЫЙ МЭПИНГ ДЛЯ ВСЕХ 11 3D ТУРОВ)

import * as fs from 'fs';
import * as path from 'path';

// 1. Статический маппинг 3D туров
// Используем максимально полные имена как ключи, плюс добавляем альтернативные ключи.
const tourMapping: { [key: string]: string } = {
    // Основные 11 туров (ключи должны совпадать с именами из CSV или быть их упрощенной версией)
    "Taraz Auesov University": "https://evgeniyvolkov.com/pano/tau/",
    "Kazakh University of Technology and Business": "https://evgeniyvolkov.com/pano/kutib/index.html",
    "KIMEP University": "https://www.kimep.kz/3d-tour/#pano753/179.7/30.6/74.4",
    "Turan University": "https://turan.edu.kz/ru/3dtour/",
    "Nazarbayev University": "https://nu.edu.kz/ru/campus/campustour", 
    "Almaty Management University": "https://pano3d.kz/AlmaU_VR/#media=1&yaw=-8.52&pitch=-14.65&fov=110.00",
    "Atyrau University of Oil and Gas": "https://vrmir3d.com/AGEU_VR/#media=1&yaw=-3.85&pitch=5.19&fov=109.96",
    "Sh. Yessenov Caspian State University of Technology and Engineering": "https://yu.edu.kz/ru/3d-tur/",
    "Maqsut Narikbayev University (MNU)": "https://mir3d.kz/Narxoz_VR/", 
    "QyzPU": "https://q-university.edu.kz/ru/about/virtual-tour",
    "Kazakh National Pedagogical University (Abai)": "https://mir3d.kz/2017/04/05/kaznpu-im-abaya/",
    
    // Дополнительные ключи для покрытия вариантов CSV
    "Maqsut Narikbayev University": "https://mir3d.kz/Narxoz_VR/",
    "Kazakh National Pedagogical University": "https://mir3d.kz/2017/04/05/kaznpu-im-abaya/",
    "AlmaU": "https://pano3d.kz/AlmaU_VR/#media=1&yaw=-8.52&pitch=-14.65&fov=110.00",
    "Taraz University": "https://evgeniyvolkov.com/pano/tau/", 
};

// Путь к вашему CSV файлу. Файл должен быть в корне проекта!
const CSV_FILE_PATH = path.join(process.cwd(), 'kz_universities_top25_expanded (1).csv');

export type University = {
    id: number;
    name: string;
    city: string;
    country_rank: number;
    has_dormitory: boolean;
    ml_cs_strength: number;
    ExchangePrograms: string;
    PartnerUniversities: string;
    tour_url: string | null;
    [key: string]: any;
};

/**
 * Читает и парсит CSV файл, добавляя ссылки на 3D туры.
 */
export function loadUniversitiesFromCSV(): University[] {
    try {
        // ... (Парсинг CSV остается надежным, как в предыдущем шаге)
        const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
        const lines = fileContent.trim().split('\r\n');
        
        if (lines.length <= 1) return [];
        
        const headers = lines[0].split(',').map(h => h.trim());
        const universities: University[] = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
            
            if (!values || values.length !== headers.length) {
                continue; 
            }

            let uni: any = { id: i };
            let success = true;

            headers.forEach((header, index) => {
                let value = values[index];
                
                if (!value) {
                    success = false;
                    return;
                }
                
                value = value.trim().replace(/^"|"$/g, ''); // Удаляем внешние кавычки
                
                // Приведение типов
                if (header === 'country_rank' || header === 'ml_cs_strength') {
                    uni[header] = parseInt(value) || 0;
                } else if (value.toLowerCase() === 'yes') {
                    uni[header] = true;
                } else if (value.toLowerCase() === 'no') {
                    uni[header] = false;
                } else {
                    uni[header] = value;
                }
            });

            if (success) {
                const uniName = uni.name.trim();
                let tourUrl = null;
                
                // 1. Попытка точного совпадения (включая имена с акронимами в скобках)
                tourUrl = tourMapping[uniName] || null;
                
                // 2. Попытка совпадения с очищенным именем (без акронимов в скобках)
                if (!tourUrl) {
                    const cleanName = uniName.replace(/\s*\(.*\)\s*$/, '').trim(); 
                    tourUrl = tourMapping[cleanName] || null;
                }
                
                // 3. Попытка совпадения по ключевому слову (для AlmaU, Narxoz)
                if (!tourUrl) {
                    if (uniName.includes('AlmaU')) {
                        tourUrl = tourMapping['Almaty Management University'];
                    } else if (uniName.includes('Narxoz') || uniName.includes('Narikbayev')) {
                         // Используем ключ с акронимом для MNU/Narxoz
                         tourUrl = tourMapping['Maqsut Narikbayev University (MNU)']; 
                    } else if (uniName.includes('Taraz') && uniName.includes('University')) {
                        tourUrl = tourMapping['Taraz Auesov University'];
                    }
                }
                
                uni.tour_url = tourUrl;
                universities.push(uni as University);
            }
        }
        
        return universities;

    } catch (error) {
        console.error("КРИТИЧЕСКАЯ ОШИБКА: Не удалось загрузить или проанализировать CSV. Проверьте путь.", error);
        return [];
    }
}