import React, { useState, useEffect } from 'react';

function App() {
  // States for interactive components
  const [activeFaq, setActiveFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMockLottery, setActiveMockLottery] = useState(0);

  // Monitor scroll to apply header background changes
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mock data for the phone dashboard depending on active card
  const mockLotteries = [
    {
      name: "Kerala Bumper",
      time: "Draws Daily at 4:00 PM",
      ticketPrice: "₹40",
      jackpot: "₹80 Lakh",
      winningNum: ["04", "18", "29", "45", "88"],
    },
    {
      name: "Dear Daily",
      time: "Draws Daily at 8:00 PM",
      ticketPrice: "₹6",
      jackpot: "₹1.2 Crore",
      winningNum: ["12", "27", "34", "61", "90"],
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const currentMock = mockLotteries[activeMockLottery] || mockLotteries[0];

  return (
    <div style={{ position: 'relative' }}>
      {/* Background Decorative Glow Orbs */}
      <div className="bg-glow-orb orb-top-right"></div>
      <div className="bg-glow-orb orb-middle-left"></div>
      <div className="bg-glow-orb orb-bottom-right"></div>

      {/* HEADER / NAVIGATION */}
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <a href="#" className="logo-wrapper">
            <img src="/lakshmi_logo_icon.png" alt="Lakshmi Logo" className="logo-img" />
            <span className="logo-text gradient-text-gold">Lakshmi</span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#games" className="nav-link">Lotteries</a>
            <a href="#guide" className="nav-link">Installation Guide</a>
            <a href="#faqs" className="nav-link">FAQs</a>
            <a href="/lakshmi.apk" download className="nav-download-btn">Download App</a>
          </nav>

          {/* Mobile Menu Icon */}
          <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div style={{
            background: 'var(--bg-dark-offset)',
            borderBottom: '1px solid var(--border-glass-hover)',
            padding: '1.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
            zIndex: 99
          }}>
            <a href="#features" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#games" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Lotteries</a>
            <a href="#guide" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Installation Guide</a>
            <a href="#faqs" className="nav-link" onClick={() => setMobileMenuOpen(false)}>FAQs</a>
            <a href="/lakshmi.apk" download className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
              Download APK
            </a>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <div className="badge-wrapper">
            <div className="badge-dot"></div>
            <span className="badge-text">Secure Android Build v1.0.0</span>
          </div>
          
          <h1 className="hero-title">
            India's Premier <br />
            <span className="gradient-text-gold">Lottery Platform</span>
          </h1>
          
          <p className="hero-description">
            Experience the excitement of official Indian lotteries on your phone. Purchase tickets, track schedules, and get verified results instantly on the secure <strong>Lakshmi App</strong>.
          </p>

          <div className="hero-ctas">
            <a href="/lakshmi.apk" download className="btn-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download for Android
            </a>
            <a href="#guide" className="btn-secondary">
              Install Instructions
            </a>
          </div>

          <div className="hero-stats-grid">
            <div className="hero-stat-item">
              <h3 className="gradient-text-gold">100%</h3>
              <p>Legal &amp; Certified</p>
            </div>
            <div className="hero-stat-item">
              <h3 className="gradient-text-gold">₹10Cr+</h3>
              <p>Weekly Prize Pool</p>
            </div>
            <div className="hero-stat-item">
              <h3 className="gradient-text-gold">4.8★</h3>
              <p>Average App Rating</p>
            </div>
          </div>
        </div>

        {/* INTERACTIVE SMARTPHONE MOCKUP */}
        <div className="hero-visual">
          {/* Floating Badges */}
          <div className="visual-badge badge-top-left">
            <div className="visual-badge-icon">🏆</div>
            <div className="visual-badge-text">
              <p>Recent Winner</p>
              <p>₹3.5 Lakhs (Dear)</p>
            </div>
          </div>
          <div className="visual-badge badge-bottom-right">
            <div className="visual-badge-icon">🔒</div>
            <div className="visual-badge-text">
              <p>Security</p>
              <p>256-bit Encrypted</p>
            </div>
          </div>

          <div className="phone-mockup-wrapper">
            <div className="phone-inner-bezel">
              <div className="phone-camera"></div>
              
              {/* Inside Mock App */}
              <div className="mock-app">
                
                {/* Header */}
                <div className="mock-app-header">
                  <div className="mock-user-info">
                    <div className="mock-avatar">L</div>
                    <div>
                      <div className="mock-user-name">Lakshmi User</div>
                      <div style={{ fontSize: '0.55rem', color: '#ffcdd2' }}>Standard Member</div>
                    </div>
                  </div>
                  <div className="mock-wallet">
                    <span className="mock-wallet-lbl">Balance</span>
                    <span className="mock-wallet-bal">₹4,850.00</span>
                  </div>
                </div>

                {/* Body */}
                <div className="mock-app-body">
                  
                  {/* Jackpot Banner */}
                  <div className="mock-jackpot-banner">
                    <div className="mock-jackpot-lbl">Active Jackpot</div>
                    <div className="mock-jackpot-val">₹2,40,00,000</div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Next draw in 02h 45m</div>
                  </div>

                  {/* Lottery interactive switcher */}
                  <div className="mock-game-selector">
                    <div className="mock-selector-title">Select Lottery (Tap to view)</div>
                    
                    {mockLotteries.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`mock-lottery-card ${activeMockLottery === idx ? 'active' : ''}`}
                        onClick={() => setActiveMockLottery(idx)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="mock-lottery-details">
                          <span className="mock-lottery-name">{item.name}</span>
                          <span className="mock-lottery-time">{item.time}</span>
                        </div>
                        <span className="mock-buy-btn">
                          {item.ticketPrice}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Results Widget */}
                  <div className="mock-result-widget">
                    <div className="mock-result-header">
                      <span className="mock-result-title">{currentMock.name} Results</span>
                      <span className="mock-result-badge">Latest Draw</span>
                    </div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Jackpot Value: {currentMock.jackpot}
                    </div>
                    <div className="mock-numbers">
                      {currentMock.winningNum.map((num, i) => (
                        <div key={i} className="mock-num">{num}</div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Bottom Bar Navigation */}
                <div className="mock-app-nav">
                  <div className="mock-nav-item active">
                    <span className="mock-nav-icon">🏠</span>
                    <span>Home</span>
                  </div>
                  <div className="mock-nav-item">
                    <span className="mock-nav-icon">📊</span>
                    <span>Results</span>
                  </div>
                  <div className="mock-nav-item">
                    <span className="mock-nav-icon">💳</span>
                    <span>Wallet</span>
                  </div>
                  <div className="mock-nav-item">
                    <span className="mock-nav-icon">💬</span>
                    <span>Support</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* TRUST CREDENTIALS RIBBON */}
      <section className="trust-banner">
        <div className="trust-container">
          <div className="trust-item">
            <div className="trust-icon-box">🛡️</div>
            <div className="trust-text">
              <h4>RNG Certified</h4>
              <p>Fair play results assured</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-box">⚡</div>
            <div className="trust-text">
              <h4>Instant Payouts</h4>
              <p>UPI and direct bank transfers</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-box">🔐</div>
            <div className="trust-text">
              <h4>Safe &amp; Encrypted</h4>
              <p>100% secure ticket records</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-box">🔞</div>
            <div className="trust-text">
              <h4>18+ Responsible Play</h4>
              <p>Strict age-restricted guidelines</p>
            </div>
          </div>
        </div>
      </section>

      {/* APP FEATURE HIGHLIGHTS */}
      <section id="features" className="section">
        <h2 className="section-title">Why Play on the <span className="gradient-text-gold">Lakshmi App</span>?</h2>
        <p className="section-subtitle">
          The ultimate platform for Indian lottery enthusiasts. Get the premium features you deserve in one secure mobile environment.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">🎟️</div>
            <h3>Government Lotteries</h3>
            <p>Direct entry tickets for leading state lotteries, fully authorized and legally verified.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">💸</div>
            <h3>Instant Withdrawals</h3>
            <p>Zero wait time. Move your winnings directly to your UPI ID or bank account within 15 minutes.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">📢</div>
            <h3>Live Results</h3>
            <p>Get push notifications as soon as lottery draws conclude. Check winning numbers instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">💬</div>
            <h3>24/7 Chat Support</h3>
            <p>Have questions? Connect with our dedicated, round-the-clock Indian customer support team.</p>
          </div>
        </div>
      </section>

      {/* LOTTERY GAMES SHOWCASE */}
      <section id="games" className="section" style={{ background: 'var(--bg-dark-offset)' }}>
        <h2 className="section-title">Supported <span className="gradient-text-gold">Lottery Games</span></h2>
        <p className="section-subtitle">
          Participate in massive state bumper jackpots and daily lotteries. Download the app to buy your tickets today.
        </p>

        <div className="games-grid">
          {/* Card 1: Kerala Bumper */}
          <div className="game-card">
            <div className="game-img-wrapper">
              <img src="/kerala_lottery.png" alt="Kerala Lottery" className="game-img" />
              <div className="game-category-badge">State Govt</div>
            </div>
            <div className="game-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <h3 className="game-title" style={{ marginBottom: 0 }}>Kerala Bumper</h3>
              <a href="/lakshmi.apk" download className="game-play-btn" style={{ marginTop: 'auto' }}>
                Play on App
              </a>
            </div>
          </div>

          {/* Card 2: Dear Lottery */}
          <div className="game-card">
            <div className="game-img-wrapper">
              <img src="/dear_lottery.png" alt="Dear Lottery" className="game-img" />
              <div className="game-category-badge">Daily State</div>
            </div>
            <div className="game-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <h3 className="game-title" style={{ marginBottom: 0 }}>Dear Daily Bumper</h3>
              <a href="/lakshmi.apk" download className="game-play-btn" style={{ marginTop: 'auto' }}>
                Play on App
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STEP-BY-STEP ANDROID INSTALLATION GUIDE */}
      <section id="guide" className="section">
        <h2 className="section-title">How to Install <span className="gradient-text-gold">Lakshmi APK</span></h2>
        <p className="section-subtitle">
          Since Google Play Store restricts real-money gaming apps in some regions, you need to download and install our secure APK directly. Follow these simple steps.
        </p>

        <div className="guide-container">
          <div className="guide-line"></div>
          
          <div className="guide-step">
            <span className="step-number">1</span>
            <span className="step-icon">📥</span>
            <h3>Download APK</h3>
            <p>Click any download button on this page to fetch the verified <strong>lakshmi.apk</strong> file safely to your Android device.</p>
          </div>

          <div className="guide-step">
            <span className="step-number">2</span>
            <span className="step-icon">⚙️</span>
            <h3>Allow Settings</h3>
            <p>If prompted by your browser, go to your settings and toggle <strong>"Allow installations from Unknown Sources"</strong> to proceed.</p>
          </div>

          <div className="guide-step">
            <span className="step-number">3</span>
            <span className="step-icon">🎉</span>
            <h3>Install &amp; Play</h3>
            <p>Open the downloaded APK file from your file manager or notifications, tap <strong>"Install"</strong>, log in, and buy your first ticket!</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
          <a href="/lakshmi.apk" download className="btn-primary">
            Download App Instantly
          </a>
        </div>
      </section>

      {/* LIVE RECENT WINNERS TICKER */}
      <section className="ticker-section">
        <div className="ticker-wrapper">
          <div className="ticker-content">
            <div className="ticker-item">
              <span className="ticker-bullet"></span>
              <span className="ticker-name">Rajesh Kumar (KL)</span>
              <span>won</span>
              <span className="ticker-prize">₹2,00,000</span>
              <span className="ticker-game">on Kerala Bumper</span>
            </div>
            <div className="ticker-item">
              <span className="ticker-bullet"></span>
              <span className="ticker-name">Aarav S. (DL)</span>
              <span>won</span>
              <span className="ticker-prize">₹75,000</span>
              <span className="ticker-game">on Dear Morning Draw</span>
            </div>
            <div className="ticker-item">
              <span className="ticker-bullet"></span>
              <span className="ticker-name">Meena Patel (GJ)</span>
              <span>won</span>
              <span className="ticker-prize">₹3,50,000</span>
              <span className="ticker-game">on Dear Daily</span>
            </div>
            <div className="ticker-item">
              <span className="ticker-bullet"></span>
              <span className="ticker-name">Sunil V. (TN)</span>
              <span>won</span>
              <span className="ticker-prize">₹35,000</span>
              <span className="ticker-game">on Dear Show</span>
            </div>
            <div className="ticker-item">
              <span className="ticker-bullet"></span>
              <span className="ticker-name">Vikram R. (MH)</span>
              <span>won</span>
              <span className="ticker-prize">₹1,20,000</span>
              <span className="ticker-game">on Kerala Draw</span>
            </div>
          </div>
          {/* Duplicate contents for seamless looping */}
          <div className="ticker-content" aria-hidden="true">
            <div className="ticker-item">
              <span className="ticker-bullet"></span>
              <span className="ticker-name">Rajesh Kumar (KL)</span>
              <span>won</span>
              <span className="ticker-prize">₹2,00,000</span>
              <span className="ticker-game">on Kerala Bumper</span>
            </div>
            <div className="ticker-item">
              <span className="ticker-bullet"></span>
              <span className="ticker-name">Aarav S. (DL)</span>
              <span>won</span>
              <span className="ticker-prize">₹75,000</span>
              <span className="ticker-game">on Dear Morning Draw</span>
            </div>
            <div className="ticker-item">
              <span className="ticker-bullet"></span>
              <span className="ticker-name">Meena Patel (GJ)</span>
              <span>won</span>
              <span className="ticker-prize">₹3,50,000</span>
              <span className="ticker-game">on Dear Daily</span>
            </div>
            <div className="ticker-item">
              <span className="ticker-bullet"></span>
              <span className="ticker-name">Sunil V. (TN)</span>
              <span>won</span>
              <span className="ticker-prize">₹35,000</span>
              <span className="ticker-game">on Dear Show</span>
            </div>
            <div className="ticker-item">
              <span className="ticker-bullet"></span>
              <span className="ticker-name">Vikram R. (MH)</span>
              <span>won</span>
              <span className="ticker-prize">₹1,20,000</span>
              <span className="ticker-game">on Kerala Draw</span>
            </div>
          </div>
        </div>
      </section>

      {/* ACCORDION FAQS */}
      <section id="faqs" className="section">
        <h2 className="section-title">Frequently Asked <span className="gradient-text-gold">Questions</span></h2>
        <p className="section-subtitle">
          Got questions about legality, deposits, withdrawals, or general app installation? We've got answers.
        </p>

        <div className="faq-container">
          {/* FAQ 1 */}
          <div className={`faq-item ${activeFaq === 0 ? 'active' : ''}`}>
            <div className="faq-header" onClick={() => toggleFaq(0)}>
              <span className="faq-question">Is it legal to play lottery online on the Lakshmi App?</span>
              <span className="faq-icon">+</span>
            </div>
            <div className="faq-answer-wrapper">
              <div className="faq-answer">
                Yes. Lakshmi facilitates entry tickets for official state-run paper and paperless lotteries (such as Kerala State and Dear State lotteries) which are fully legal under Indian state laws. We comply with all relevant state lotteries regulations. Players must be at least 18 years old.
              </div>
            </div>
          </div>

          {/* FAQ 2 */}
          <div className={`faq-item ${activeFaq === 1 ? 'active' : ''}`}>
            <div className="faq-header" onClick={() => toggleFaq(1)}>
              <span className="faq-question">How do I add money and withdraw my winnings?</span>
              <span className="faq-icon">+</span>
            </div>
            <div className="faq-answer-wrapper">
              <div className="faq-answer">
                You can easily add money using UPI, Debit/Credit Cards, or NetBanking inside the app. For winnings, you can submit a withdrawal request directly to your UPI ID or Bank account. Withdrawals are processed within 15 minutes after approval.
              </div>
            </div>
          </div>

          {/* FAQ 3 */}
          <div className={`faq-item ${activeFaq === 2 ? 'active' : ''}`}>
            <div className="faq-header" onClick={() => toggleFaq(2)}>
              <span className="faq-question">Is the Lakshmi APK safe for my mobile phone?</span>
              <span className="faq-icon">+</span>
            </div>
            <div className="faq-answer-wrapper">
              <div className="faq-answer">
                Yes, our APK is completely safe and compiled securely. Android operating systems block app installations outside the official Play Store by default as a security measure, which is why you need to enable "Unknown Sources" manually. Our app contains zero malware or tracking scripts.
              </div>
            </div>
          </div>

          {/* FAQ 4 */}
          <div className={`faq-item ${activeFaq === 3 ? 'active' : ''}`}>
            <div className="faq-header" onClick={() => toggleFaq(3)}>
              <span className="faq-question">Can I play from any state in India?</span>
              <span className="faq-icon">+</span>
            </div>
            <div className="faq-answer-wrapper">
              <div className="faq-answer">
                Lottery laws vary by state. Players from states where lottery operations are legally recognized (like Kerala, West Bengal, Maharashtra, Punjab, Sikkim, Goa) are welcome to participate. It is the responsibility of the player to verify local restrictions.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USER TESTIMONIALS */}
      <section className="section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 className="section-title">What Our <span className="gradient-text-gold">Winners Say</span></h2>
        <p className="section-subtitle">
          Real players, real wins, verified payouts. Join thousands of satisfied Indian lottery players.
        </p>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p className="testimonial-quote">
              "I couldn't believe it when I got the result notification on my phone. Winning 80 Lakhs on Kerala Bumper changed my life. The payout was credited directly to my bank within hours!"
            </p>
            <div className="testimonial-user">
              <div className="testimonial-avatar">RK</div>
              <div className="testimonial-info">
                <h4>Rajesh Kumar</h4>
                <p>Kerala Winner - ₹80,00,000</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <p className="testimonial-quote">
              "Buying paper tickets was always such a hassle because I kept losing them. With the Lakshmi App, my tickets are recorded securely, and payouts are instant through UPI. Highly recommend!"
            </p>
            <div className="testimonial-user">
              <div className="testimonial-avatar">AS</div>
              <div className="testimonial-info">
                <h4>Amit Sharma</h4>
                <p>Punjab Winner - ₹1,20,00,000</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <p className="testimonial-quote">
              "I love playing the Dear Daily Bumper on the Lakshmi App. Buying tickets and checking results is incredibly smooth, and the withdrawals are super fast. I got my ₹50,000 payout in exactly 10 minutes!"
            </p>
            <div className="testimonial-user">
              <div className="testimonial-avatar">DP</div>
              <div className="testimonial-info">
                <h4>Deepika P.</h4>
                <p>Sikkim Winner - ₹50,000</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/lakshmi_logo_icon.png" alt="Lakshmi" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              <span className="logo-text gradient-text-gold" style={{ fontSize: '1.3rem' }}>Lakshmi</span>
            </div>
            <p className="footer-description">
              India's leading and most trusted lottery distribution platform. Play state lotteries securely online.
            </p>
            <div className="footer-socials">
              <a href="#" className="social-icon-btn" aria-label="Telegram">💬</a>
              <a href="#" className="social-icon-btn" aria-label="Support Email">📧</a>
              <a href="#" className="social-icon-btn" aria-label="WhatsApp">📞</a>
            </div>
          </div>

          <div className="footer-nav-col">
            <h3>Quick Links</h3>
            <ul className="footer-links-list">
              <li><a href="#features">Features</a></li>
              <li><a href="#games">Supported Lotteries</a></li>
              <li><a href="#guide">Installation Guide</a></li>
              <li><a href="#faqs">FAQs</a></li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h3>Security &amp; Legal</h3>
            <ul className="footer-links-list">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms &amp; Conditions</a></li>
              <li><a href="#">Responsible Gaming</a></li>
              <li><a href="#">RNG Certification</a></li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h3>Customer Support</h3>
            <div className="footer-contact-info">
              <div className="footer-contact-item">
                <span>📍</span>
                <span>Lakshmi Lottery Group, Bengaluru, Karnataka</span>
              </div>
              <div className="footer-contact-item">
                <span>📧</span>
                <span>support@lakshmilottery.in</span>
              </div>
              <div className="footer-contact-item">
                <span>⏰</span>
                <span>Response Time: &lt; 5 minutes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Lakshmi App. All rights reserved.</p>
          
          <div className="responsible-gaming-tag">
            <span className="age-badge">18+</span>
            <span>Play Responsibly. Subject to financial risks.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
