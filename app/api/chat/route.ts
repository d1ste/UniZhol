// app/api/chat/route.ts

import { Mistral } from '@mistralai/mistralai';
import { loadUniversitiesFromCSV, University } from '@/lib/data'; // ИСПОЛЬЗУЕМ ФУНКЦИЮ ДЛЯ ЧТЕНИЯ CSV
import { NextResponse } from 'next/server';

const apiKey = process.env.MISTRAL_API_KEY;

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: 'API Key MISTRAL_API_KEY не настроен.' }, { status: 500 });
  }

  const client = new Mistral({ apiKey: apiKey });
  const { query } = await req.json();

  const universities = loadUniversitiesFromCSV(); // ЧИТАЕМ CSV НАПРЯМУЮ
  if (universities.length === 0) {
      return NextResponse.json({ error: "Не удалось загрузить данные из CSV для AI-анализа." }, { status: 500 });
  }

  // Превращаем полную базу данных в компактный текст для Mistral
  const context = universities.map((u: University) => 
    // Формируем детальный контекст для ИИ
    `ВУЗ: ${u.name} (Город: ${u.city}, Рейтинг: #${u.country_rank}, IT/ML Сила: ${u.ml_cs_strength}/5, Общежитие: ${u.has_dormitory ? 'Да' : 'Нет'}, Обмен: ${u.ExchangePrograms}, Партнеры: ${u.PartnerUniversities})`
  ).join("\n");

  const systemPrompt = `
    Ты эксперт по вузам Казахстана. Твоя задача - проанализировать запрос студента и выбрать 1-2 идеальных вуза из списка ниже.
    ... (остальная часть промпта не меняется)
    
    Список вузов (все ${universities.length} вузов из CSV):
    ${context}
    
    Верни ответ СТРОГО в формате JSON:
    {
      "recommendations": [
        {
          "name": "Точное название вуза как в списке",
          "match_score": 95,
          "reason": "Краткое объяснение на русском, почему подходит (на основе данных)"
        }
      ]
    }
  `;

  try {
    const chatResponse = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        {"role": "system", "content": systemPrompt},
        {"role": "user", "content": query},
      ],
      responseFormat: { type: 'json_object' },
    });

    const content = chatResponse.choices?.[0]?.message?.content;

    if (typeof content === 'string') {
        return NextResponse.json(JSON.parse(content));
    } else {
        return NextResponse.json({ error: "Некорректный ответ от AI" }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Критическая ошибка Mistral AI' }, { status: 500 });
  }
}