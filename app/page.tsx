
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import type { CSSProperties } from 'react';

const APP_STORE_URL = 'https://apps.apple.com/kr/search?term=NADA';

const marqueeItems = [
  'CREATE',
  'DISCOVER',
  'ARTIST',
  'INDEPENDENT MUSIC',
  'COMMUNITY',
  'SHARE YOUR SOUND',
  'NADA',
];

export default function HomePage() {
  useEffect(() => {
    const elements = document.querySelectorAll(
      '.nada-test .reveal'
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="nada-test">

      {/* NAVIGATION */}

      <nav className="nt-nav">
        <a href="#home" className="nt-logo">NADA</a>

        <span>INDEPENDENT MUSIC PLATFORM</span>

        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="nt-nav-button"
        >
          DOWNLOAD APP
        </a>
      </nav>

      {/* HERO */}

      <section className="nt-hero" id="home">
        <div className="nt-grid" />
        <div className="nt-glow" />

        <div className="nt-hero-content reveal">
          <span className="nt-eyebrow">
            <span />
            A NEW WAY TO EXPERIENCE MUSIC
          </span>

          <h1>
            MUSIC
            <br />
            HAS NO
            <br />
            <span>LIMITS.</span>
          </h1>

          <p>
            Discover new sounds.
            <br />
            Create your own universe.
            <br />
            Connect through music.
          </p>

          <a href="#discover" className="nt-button">
            EXPLORE NADA
          </a>
        </div>

        <div className="nt-planet">
          <div className="nt-planet-core" />
          <div className="nt-orbit nt-orbit-one" />
          <div className="nt-orbit nt-orbit-two" />
          <div className="nt-orbit nt-orbit-three" />
        </div>

        <div className="nt-hero-footer">
          <span>INDEPENDENT MUSIC</span>
          <span>CREATE YOUR OWN SOUND</span>
          <span>EST. NADA</span>
        </div>
      </section>

      {/* DISCOVER */}

      <section className="nt-discover" id="discover">
        <div className="nt-section-heading reveal">
          <span className="nt-eyebrow">
            01 — DISCOVER
          </span>

          <h2>
            A WORLD
            <br />
            BEYOND <span>SOUND.</span>
          </h2>

          <p>
            Explore music beyond boundaries.
            <br />
            Find sounds that speak to you.
          </p>
        </div>

        {/* PURPLE MARQUEE */}

     <div
  className="nt-marquee nt-marquee-purple"
  aria-label="NADA music culture"
>
  <div className="nt-marquee-track">
    {[0, 1].map((group) => (
      <div className="nt-marquee-group" key={group}>
        {marqueeItems.map((item, index) => (
          <span
            className="nt-marquee-item"
            key={`${group}-${item}`}
          >
            {item}
            <i>★</i>
          </span>
        ))}
      </div>
    ))}
  </div>
</div>
        {/* ALBUM CARDS */}

        <div className="nt-albums">
          <div className="nt-album album-one">
            <small>NADA ORIGINAL 001</small>
            <strong>PURE<br />SOUND.</strong>
            <span>01 / DISCOVER</span>
          </div>

          <div className="nt-album album-two">
            <small>NADA ORIGINAL 002</small>
            <strong>NEW<br />WAVE.</strong>
            <span>02 / EXPLORE</span>
          </div>

          <div className="nt-album album-three">
            <small>NADA ORIGINAL 003</small>
            <strong>YOUR<br />VIBE.</strong>
            <span>03 / FEEL</span>
          </div>

          <div className="nt-album album-four">
            <small>NADA ORIGINAL 004</small>
            <strong>FRESH<br />SOUND.</strong>
            <span>04 / LISTEN</span>
          </div>
        </div>

        <div className="nt-caption">
          <span>NEW ARTISTS</span>
          <span>NEW MUSIC</span>
          <span>NEW EXPERIENCES</span>
        </div>
      </section>

      {/* CREATE */}

      <section className="nt-artist" id="artist">
        <div className="nt-artist-content reveal">
          <span className="nt-eyebrow">
            02 — CREATE
          </span>

          <h2>
            YOUR SOUND.
            <br />
            YOUR <span>UNIVERSE.</span>
          </h2>

          <p>
            Your music deserves to be heard.
            <br />
            Create, upload and share your sound with the world.
          </p>
        </div>

        {/* 48-BAR AUDIO EQUALIZER */}

       
<div className="nt-wave nt-equalizer">
  <div className="nt-wave-bars nt-equalizer-bars">
    {Array.from({ length: 48 }).map((_, i) => {
      const height = Math.round(
        20 + Math.abs(Math.sin(i * 0.45)) * 90
      );

      const delay = (i * 45) / 1000;
      const duration = (55 + (i % 7) * 13) / 100;

      return (
        <span
          key={i}
          style={{
            '--height': `${height}px`,
            '--delay': `${delay}s`,
            '--duration': `${duration}s`,
          } as CSSProperties}
        />
      );
    })}
  </div>

  <small>YOUR MUSIC. YOUR VOICE. YOUR NADA</small>
</div>

      </section>

      {/* CONNECT */}

      <section className="nt-connect" id="connect">
        <div className="nt-connect-text reveal">
          <span className="nt-eyebrow">
            03 — CONNECT
          </span>

          <h2>
            MUSIC
            <br />
            CONNECTS
            <br />
            <span>US ALL.</span>
          </h2>

          <p>
            Meet artists.
            <br />
            Discover communities.
            <br />
            Connect through the sounds you love.
          </p>
        </div>

        <div className="nt-network">
          <div className="nt-network-ring">
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <span
                key={angle}
                className="nt-node"
                style={{
                  '--angle': `${angle}deg`,
                  '--distance': '125px',
                } as CSSProperties}
              />
            ))}
          </div>

          <div className="nt-network-ring outer">
            {[30, 90, 150, 210, 270, 330].map((angle) => (
              <span
                key={angle}
                className="nt-node"
                style={{
                  '--angle': `${angle}deg`,
                  '--distance': '175px',
                } as CSSProperties}
              />
            ))}
          </div>

          <div className="nt-network-core">N</div>
        </div>
      </section>

      {/* DOWNLOAD */}

      <section className="nt-download" id="download">
        <div className="nt-download-content reveal">
          <span className="nt-eyebrow">
            YOUR NEXT MUSIC EXPERIENCE
          </span>

          <div className="nt-big-logo">
            <span>NADA</span>
          </div>

          <h2>
            THE NEXT
            <br />
            SOUND IS <span>YOURS.</span>
          </h2>

          <p>
            Discover. Create. Connect.
            <br />
            Start your journey with NADA
          </p>

          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="nt-download-button"
          >
            DOWNLOAD NADA APP 
          </a>
        </div>

        <div className="nt-bottom">
          <span>© NADA ALL RIGHTS RESERVED.</span>

          <div className="nt-footer-links">
            <Link href="/privacy-policy">
              PRIVACY POLICY
            </Link>

            <Link href="/admin/login">
              ADMIN
            </Link>
          </div>

          <span>INDEPENDENT MUSIC PLATFORM</span>
        </div>
      </section>

    </main>
  );
}
