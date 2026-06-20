import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="glass-panel animate-fade-in px-6 py-12 md:px-12 md:py-20 text-center max-w-3xl w-full flex flex-col items-center">
        
        <div className="animate-fade-in delay-100 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-pink-500 rounded-2xl mb-6 md:mb-8 flex items-center justify-center shadow-[0_8px_32px_rgba(59,130,246,0.4)]">
          <svg className="w-8 h-8 md:w-10 md:h-10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>

        <h1 className="title-gradient animate-fade-in delay-200 text-5xl md:text-7xl font-bold mb-4 md:mb-6 leading-tight">
          CHART BOX
        </h1>
        
        <p className="animate-fade-in delay-300 text-gray-400 text-lg md:text-xl mb-10 md:mb-12 leading-relaxed max-w-2xl">
          Mfumo wa kitaalamu wa mawasiliano wa kizazi kipya.
          Ungana na marafiki na wafanyakazi wenzako kupitia ujumbe wa maandishi, sauti na video kwa ubora wa hali ya juu.
        </p>
        
        <div className="animate-fade-in delay-300 flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <Link href="/login" className="w-full sm:w-auto">
            <button className="btn-primary w-full sm:w-auto px-8 py-4 text-lg">
              Kuingia (Login)
            </button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <button className="btn-secondary w-full sm:w-auto px-8 py-4 text-lg">
              Jisajili (Register)
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
