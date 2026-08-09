import Link from "next/link";

function ChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

function StudentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  );
}

function TeacherIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 mb-5">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">WordFlip</h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium tracking-widest uppercase">Español · English</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/student/login"
            className="group flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <StudentIcon />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Acceso alumnos</p>
                <p className="text-slate-400 text-xs mt-0.5">Entra con tu usuario y contraseña</p>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all">
              <ChevronRight />
            </span>
          </Link>

          <Link
            href="/teacher/login"
            className="group flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                <TeacherIcon />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Acceso profesores</p>
                <p className="text-slate-400 text-xs mt-0.5">Gestiona tus clases y grupos</p>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all">
              <ChevronRight />
            </span>
          </Link>
        </div>

        <p className="text-center text-slate-400 text-xs mt-10">
          WordFlip · Vocabulario ES ↔ EN
        </p>
      </div>
    </main>
  );
}
