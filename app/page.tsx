'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎉 환영합니다, NADA입니다!</h1>

      <div style={styles.buttonGroup}>
        <button style={styles.button} onClick={() => router.push('/privacy-policy')}>
          개인정보 처리방침 보기
        </button>
        <button style={{ ...styles.button, backgroundColor: '#6c63ff' }} onClick={() => router.push('/admin/login')}>
          관리자 로그인
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    color: '#fff',
    padding: '0 20px',
  },
  title: {
    fontSize: '28px',
    marginBottom: '40px',
    textAlign: 'center' as const,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    width: '100%',
    maxWidth: '300px',
  },
  button: {
    padding: '12px 20px',
    fontSize: '16px',
    backgroundColor: '#444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
