
import Link from 'next/link';

const APP_STORE_URL = 'https://apps.apple.com/kr/search?term=NADA';

export default function HomePage() {
  return (
    <main className="nada">

      {/* 상단 메뉴 */}
      <header className="header">
        <Link href="/" className="logo">NADA.</Link>
        <a href="#download" className="header-button">
          앱 다운로드
        </a>
      </header>

      {/* 메인 화면 */}
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">A NEW MUSIC PLATFORM</span>
          <h1>
            당신의 음악을<br />
            세상과 연결하다.
          </h1>
          <p>
            음악을 듣고, 만들고, 공유하는 새로운 경험.<br />
            당신의 음악 이야기를 NADA에서 시작하세요.
          </p>
          <a href="#download" className="primary-button">
            NADA 시작하기 <span>→</span>
          </a>
        </div>

        <div className="hero-art">
          <div className="art-circle"></div>
          <div className="phone">
            <div className="phone-top">NADA.</div>
            <div className="phone-label">YOUR MUSIC</div>
            <div className="album-art">
              <span>♪</span>
            </div>
            <div className="phone-song">Discover your sound.</div>
            <div className="phone-sub">MUSIC FOR EVERYONE</div>
            <div className="phone-player">
              <span>Ⅱ</span>
              <span>♡</span>
            </div>
          </div>
          <div className="floating-note">♫</div>
        </div>
      </section>

      {/* 음악 감상 */}
      <section className="feature">
        <div className="feature-text">
          <span className="eyebrow">01 / DISCOVER MUSIC</span>
          <h2>
            새로운 음악을<br />
            발견하는 즐거움.
          </h2>
          <p>
            다양한 장르의 음악을 만나고<br />
            지금까지 몰랐던 새로운 아티스트를 발견하세요.
          </p>
        </div>
        <div className="visual visual-music">
          <div className="music-card">
            <div className="music-cover cover-one">N</div>
            <div className="music-cover cover-two">A</div>
            <div className="music-cover cover-three">♪</div>
            <div className="music-cover cover-four">D</div>
          </div>
          <div className="visual-caption">FIND YOUR NEXT FAVORITE.</div>
        </div>
      </section>

      {/* 아티스트 */}
      <section className="feature reverse">
        <div className="feature-text">
          <span className="eyebrow">02 / BE AN ARTIST</span>
          <h2>
            당신의 음악이<br />
            누군가의 시작이 되도록.
          </h2>
          <p>
            나만의 음악을 세상에 들려주세요.<br />
            NADA에서 새로운 팬과 음악으로 연결됩니다.
          </p>
        </div>
        <div className="visual visual-artist">
          <div className="artist-symbol">♫</div>
          <div className="artist-text">
            <span>YOUR SOUND</span>
            <strong>YOUR STORY.</strong>
          </div>
          <div className="sound-bars">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} style={{ height: `${15 + ((i * 17) % 65)}px` }} />
            ))}
          </div>
        </div>
      </section>

      {/* 커뮤니티 */}
      <section className="community">
        <span className="eyebrow">03 / CONNECT THROUGH MUSIC</span>
        <h2>
          음악으로 연결되는<br />
          새로운 사람들.
        </h2>
        <p>
          좋아하는 아티스트를 응원하고<br />
          음악을 통해 더 가까워지는 경험.
        </p>
        <div className="community-visual">
          <div className="community-circle circle-one">N</div>
          <div className="community-circle circle-two">♫</div>
          <div className="community-circle circle-three">A</div>
          <div className="community-circle circle-four">D</div>
        </div>
      </section>

      {/* 다운로드 */}
      <section className="download" id="download">
        <span className="eyebrow">WELCOME TO NADA</span>
        <h2>
          당신의 음악,<br />
          이제 NADA에서.
        </h2>
        <p>
          새로운 음악의 경험을 지금 시작해 보세요.
        </p>
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="download-button"
        >
          App Store에서 다운로드 <span>↗</span>
        </a>
        <div className="download-logo">NADA.</div>
      </section>

      {/* 하단 */}
      <footer className="footer">
        <div className="footer-logo">NADA.</div>
        <div className="footer-links">
          <Link href="/privacy-policy">개인정보 처리방침</Link>
          <Link href="/admin/login">관리자</Link>
        </div>
        <p>© NADA. All rights reserved.</p>
      </footer>

      {/* 디자인 */}
      
    </main>
  );
}
