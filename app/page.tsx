import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-blue-700 mb-2">🔄 WordFlip</h1>
          <p className="text-gray-400 text-xl">ES ↔ EN</p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Student panel */}
          <Link
            href="/student/login"
            className="bg-white border-2 border-blue-200 rounded-3xl p-8 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-5xl">🎒</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Soy alumno</h2>
                  <p className="text-gray-400 text-sm mt-0.5">Entra con tu usuario y contraseña</p>
                </div>
              </div>
              <span className="text-3xl text-blue-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">→</span>
            </div>
          </Link>

          {/* Teacher panel */}
          <Link
            href="/teacher/login"
            className="bg-white border-2 border-purple-200 rounded-3xl p-8 shadow-sm hover:shadow-lg hover:border-purple-400 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-5xl">👨‍🏫</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Soy profesor</h2>
                  <p className="text-gray-400 text-sm mt-0.5">Gestionar clases y alumnos</p>
                </div>
              </div>
              <span className="text-3xl text-purple-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all">→</span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
