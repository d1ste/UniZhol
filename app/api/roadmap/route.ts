// app/api/roadmap/route.ts

import { NextRequest, NextResponse } from 'next/server';
// Убедитесь, что эта библиотека установлена: npm install @mistralai/mistralai
import { Mistral } from '@mistralai/mistralai';


// Важно: API ключ должен быть доступен
const apiKey = process.env.MISTRAL_API_KEY;

export async function POST(req: NextRequest) {
    
    // Шаг 1: Проверка наличия API ключа
    if (!apiKey) {
        console.error("ERROR: MISTRAL_API_KEY is not set in .env.local");
        return NextResponse.json({ 
            error: "MISTRAL_API_KEY is missing on the server. Please check your .env.local file and restart the server." 
        }, { status: 500 });
    }
    
    // Инициализация клиента
    const mistralClient = new Mistral({ apiKey });
    
    try {
        const { uniName, major, grade, goal } = await req.json();

        // Шаг 2: Проверка входных данных
        if (!uniName || !major || !grade) {
            return NextResponse.json({ error: "Missing required fields (University, Major, Grade)." }, { status: 400 });
        }

        const prompt = `
            Ты — эксперт-консультант по поступлению в университеты Казахстана. Твоя задача — составить подробный, пошаговый план поступления (Roadmap) для студента, основанный на его целях и текущей ситуации.

            **Входные данные студента:**
            - Целевой университет: ${uniName}
            - Желаемая специальность: ${major}
            - Текущий класс/курс: ${grade}
            - Главная цель: ${goal || 'Успешное поступление на бюджетное место или грант.'}

            Составь Roadmap, разделенный по месяцам (начиная с текущего месяца). Каждый шаг должен быть конкретным и применимым к условиям Казахстана (например, сдача ЕНТ, сбор документов, подача на гранты).

            **Требуемый формат ответа:**
            Ответ должен быть СТРОГО в формате JSON.
            Ключи: 
            1. roadmapTitle: (Краткое название плана)
            2. steps: (Массив объектов-шагов)

            Формат JSON должен быть следующим:
            {
                "roadmapTitle": "Индивидуальный план поступления в ${uniName}",
                "steps": [
                    {"month": "Декабрь 2025", "action": "Начать интенсивную подготовку к профильным предметам ЕНТ."},
                    {"month": "Март 2026", "action": "Сдать пробный тест IELTS или TOEFL. Определить слабые места."},
                    {"month": "Июнь 2026", "action": "Подача документов для сдачи основного ЕНТ."},
                    // ... добавь не менее 8-10 релевантных шагов
                ]
            }
        `;

        const chatResponse = await mistralClient.chat.complete({
            model: 'mistral-large-latest',
            messages: [{ role: 'user', content: prompt }],
            responseFormat: { type: "json_object" }, 
        });

        const content = chatResponse.choices[0].message.content;
        
        try {
            const roadmapDetails = JSON.parse(content);
            // Убеждаемся, что AI вернул ожидаемую структуру, чтобы избежать ошибок на клиенте
            if (!roadmapDetails.roadmapTitle || !Array.isArray(roadmapDetails.steps)) {
                 throw new Error("Invalid structure from AI.");
            }
            return NextResponse.json(roadmapDetails);
            
        } catch (jsonError) {
            console.error("Failed to parse AI JSON roadmap response:", content);
            return NextResponse.json({ error: "AI returned invalid JSON format. (Internal error)" }, { status: 500 });
        }

    } catch (error) {
        console.error("Roadmap API general error. Next.js might be crashing:", error);
        return NextResponse.json({ error: "Failed to communicate with AI service. Check server console for logs." }, { status: 500 });
    }
}