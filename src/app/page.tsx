import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem' 
    }}>
      <div 
        className="glass-panel animate-fade-in" 
        style={{ 
          padding: '5rem 3rem', 
          textAlign: 'center', 
          maxWidth: '800px', 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div 
          className="animate-fade-in delay-100" 
          style={{ 
            width: '80px', 
            height: '80px', 
            background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
            borderRadius: '20px',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px var(--primary-glow)'
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>

        <h1 className="title-gradient animate-fade-in delay-200" style={{ fontSize: '4.5rem', marginBottom: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>
          CHART BOX
        </h1>
        
        <p className="animate-fade-in delay-300" style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '3rem', lineHeight: 1.6, maxWidth: '600px' }}>
          Mfumo wa kitaalamu wa mawasiliano wa kizazi kipya.
          Ungana na marafiki na wafanyakazi wenzako kupitia ujumbe wa maandishi, sauti na video kwa ubora wa hali ya juu.
        </p>
        
        <div className="animate-fade-in delay-300" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login">
            <button className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.1rem' }}>
              Kuingia (Login)
            </button>
          </Link>
          <Link href="/register">
            <button className="btn-secondary" style={{ padding: '16px 36px', fontSize: '1.1rem' }}>
              Jisajili (Register)
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
