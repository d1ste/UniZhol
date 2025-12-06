// app/api/universities/route.ts

import { loadUniversitiesFromCSV } from '@/lib/data';
import { NextResponse } from 'next/server';

export async function GET() {
    const universities = loadUniversitiesFromCSV();
    
    if (universities.length === 0) {
        return NextResponse.json(
            { error: "Не удалось загрузить данные из CSV. Проверьте путь к файлу." },
            { status: 500 }
        );
    }
    
    // В ответ отправится полный список из 25+ вузов
    return NextResponse.json(universities); 
}