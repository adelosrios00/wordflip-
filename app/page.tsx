import Link from "next/link";
import Image from "next/image";

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
    <main className="min-h-screen flex flex-col" style={{ background: "#ffffff" }}>
      {/* Hero azul integrado */}
      <div
        className="flex flex-col items-center justify-center pt-16 pb-12 px-6"
        style={{
          background: "linear-gradient(160deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
        }}
      >
        <Image
          src="/logo.png"
          alt="WordFlip"
          width={180}
          height={180}
          priority
          style={{ borderRadius: 32, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        />
        <p className="text-blue-200 text-xs mt-5 font-bold tracking-widest uppercase">
          Vocabulary App
        </p>
      </div>

      {/* Curva de transición */}
      <div style={{ marginTop: -2 }}>
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%" }}>
          <path d="M0 0 Q720 60 1440 0 L1440 60 L0 60 Z" fill="#ffffff" />
        </svg>
      </div>

      {/* Botones de acceso */}
      <div className="flex flex-col items-center px-6 pb-10" style={{ background: "#ffffff", marginTop: -8 }}>
        <div className="w-full max-w-xs flex flex-col gap-3 mt-2">
          <Link
            href="/student/login"
            className="group flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <StudentIcon />
              </div>
              <div>
                <p className="font-bold text-slate-800">Student access</p>
                <p className="text-slate-400 text-xs mt-0.5">Log in with your username and password</p>
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
                <p className="font-bold text-slate-800">Teacher access</p>
                <p className="text-slate-400 text-xs mt-0.5">Manage your classes and groups</p>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all">
              <ChevronRight />
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
