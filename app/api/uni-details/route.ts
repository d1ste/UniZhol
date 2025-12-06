// app/api/uni-details/route.ts (ИСПРАВЛЕННЫЙ КОД)

import { NextRequest, NextResponse } from 'next/server';
// 💡 ИСПРАВЛЕНИЕ 1: Используем ИМЕНОВАННЫЙ ИМПОРТ { MistralClient }
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
    console.error("ENVIRONMENT ERROR: MISTRAL_API_KEY is not set. AI functions will fail.");
}

// 💡 ИСПРАВЛЕНИЕ 2: Конструктор вызывается с ОБЪЕКТОМ КОНФИГУРАЦИИ { apiKey }
  const mistralClient = new Mistral({ apiKey: apiKey });

export async function POST(req: NextRequest) {
    // Если ключ отсутствует, возвращаем ошибку сразу
    if (!mistralClient) {
        return NextResponse.json({ 
            error: "Mistral API Key is missing on the server. Please check your .env.local file." 
        }, { status: 500 });
    }
    
    try {
        const { uniName } = await req.json();

        if (!uniName) {
            return NextResponse.json({ error: "Missing uniName in request body." }, { status: 400 });
        }

const prompt = `
            Ты эксперт по университетам Казахстана. Предоставь следующую информацию о ${uniName} (Казахстан).
            
            Требования к содержимому: ВСЕ поля (Миссия, История, Лидерство, Достижения) должны быть представлены как ЕДИНАЯ СТРОКА ТЕКСТА, а не массивом или объектом. Используй переносы строки \\n для форматирования внутри строки.
            
            1. **Миссия:** (1-2 предложения, как одна строка текста)
            2. **История:** (Кратко, ключевые даты/этапы, объединенные в ОДНУ строку текста)
            3. **Лидерство:** (Название должности и имя/фамилия текущего руководителя, как одна строка текста)
            4. **Достижения:** (Краткий список из 2-3 ключевых достижений или наград, объединенные в ОДНУ строку текста)
            
            Ответ должен быть СТРОГО в формате JSON, без лишнего текста, с использованием ключей: Mission, History, Leadership, Achievements.

            Пример желаемого формата (обрати внимание, все значения - это строки):
            {
                "Mission": "Наша миссия заключается в подготовке высококвалифицированных специалистов.",
                "History": "Основан в 2010 году. В 2015 открыта Школа медицины. В 2020 отпраздновано 10-летие.",
                "Leadership": "Ректор: Имя Фамилия, Доктор наук.",
                "Achievements": "Победитель международных олимпиад \\nВходит в топ-5 по IT-специальностям."
            }
        `;

        const chatResponse = await mistralClient.chat.complete({
            model: 'mistral-large-latest',
            messages: [{ role: 'user', content: prompt }],
            responseFormat: { type: "json_object" },
        });

        const content = chatResponse.choices?.[0]?.message?.content;
        
        try {
            const uniDetails = JSON.parse(content);
            return NextResponse.json(uniDetails);
        } catch (jsonError) {
            console.error("Failed to parse AI JSON response:", content);
            return NextResponse.json({ error: "AI returned invalid JSON format. (Internal error)" }, { status: 500 });
        }

    } catch (error) {
        console.error("Mistral API error:", error);
        return NextResponse.json({ error: "Failed to communicate with AI service (Check key/rate limits)." }, { status: 500 });
    }
}