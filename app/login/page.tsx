// app/login/page.tsx

import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center border border-slate-200">
                <h1 className="text-3xl font-bold text-blue-600 mb-4">🚪 Вход в UniZhol</h1>
                <p className="text-lg text-slate-700 mb-6">
                    Раздел авторизации находится в активной разработке.
                    <span className="font-semibold">Скоро вы сможете сохранять избранные вузы и настройки!</span>
                </p>

                {/* Это просто заглушка для отображения функциональности */}
                <div className="space-y-4 mb-8">
                    <input
                        type="text"
                        placeholder="Имя пользователя или Email"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <Link
                    href="/"
                    className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-full text-base font-medium hover:bg-blue-700 transition shadow-md"
                >
                    Войти (Функция в разработке)
                </Link>

                <p className="text-sm mt-4 text-slate-500">
                    Нет аккаунта? <a href="#" className="text-blue-500 hover:underline">Зарегистрируйтесь</a>
                </p>
            </div>
        </div>
    );
}