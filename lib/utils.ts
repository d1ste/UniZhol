// lib/utils.ts

/**
 * Преобразует строку в URL-безопасный "слаг" (slug).
 * Пример: "L.N. Gumilyov Eurasian National University" -> "ln-gumilyov-eurasian-national-university"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Удалить все, кроме слов, пробелов и дефисов
    .replace(/[\s_-]+/g, '-') // Заменить пробелы и подчеркивания дефисами
    .replace(/^-+|-+$/g, ''); // Удалить ведущие/завершающие дефисы
}