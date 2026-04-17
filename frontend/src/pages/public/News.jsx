import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/public/News.css';

const News = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 800, once: true, easing: 'ease-out' });
    fetchArticles();
  }, []);

  const fetchArticles = () => {
    const mockArticles = [
      {
        id: 1,
        title: "AI Achieves 95% Accuracy in Pneumonia Detection",
        excerpt: "New study shows revolutionary improvement in early pneumonia detection using deep learning models.",
        category: "research",
        author: "Dr. Sarah Johnson",
        date: "2026-02-18",
        readTime: 8,
        image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=700&fit=crop",
        featured: true,
        views: 12400
      },
      {
        id: 2,
        title: "Understanding Pleural Effusion: Causes and Treatment",
        excerpt: "Comprehensive guide to pleural effusion, its symptoms, diagnosis, and modern treatment approaches.",
        category: "medical",
        author: "Dr. Michael Chen",
        date: "2026-02-17",
        readTime: 6,
        image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&h=400&fit=crop",
        views: 8900
      },
      {
        id: 3,
        title: "DenseNet-121 vs ResNet-50: Performance Comparison",
        excerpt: "In-depth analysis of two leading architectures for chest X-ray classification.",
        category: "technology",
        author: "Prof. James Williams",
        date: "2026-02-16",
        readTime: 12,
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
        views: 15200
      },
      {
        id: 4,
        title: "Case Study: Early Detection Saves Lives",
        excerpt: "How AI-powered radiology detected critical condition in asymptomatic patient.",
        category: "casestudies",
        author: "Dr. Emily Davis",
        date: "2026-02-15",
        readTime: 10,
        image: "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=600&h=400&fit=crop",
        views: 9800
      },
      {
        id: 5,
        title: "Cardiomegaly: What You Need to Know",
        excerpt: "Understanding enlarged heart condition, risk factors, and modern diagnostic techniques.",
        category: "medical",
        author: "Dr. Robert Martinez",
        date: "2026-02-14",
        readTime: 7,
        image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&h=400&fit=crop",
        views: 7600
      },
      {
        id: 6,
        title: "The Future of Radiology: AI Integration",
        excerpt: "Exploring how artificial intelligence is transforming diagnostic radiology practices worldwide.",
        category: "technology",
        author: "Dr. Lisa Anderson",
        date: "2026-02-13",
        readTime: 9,
        image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop",
        views: 11300
      }
    ];
    setFeaturedArticle(mockArticles.find(a => a.featured));
    setArticles(mockArticles.filter(a => !a.featured));
  };

  const categories = [
    { value: 'all',        label: t('news.all') },
    { value: 'research',   label: t('news.research') },
    { value: 'technology', label: t('news.technology') },
    { value: 'medical',    label: t('news.medical') },
    { value: 'casestudies',label: t('news.casestudies') }
  ];

  const categoryColors = {
    research:    '#0066CC',
    technology:  '#00BFA6',
    medical:     '#EF4444',
    casestudies: '#F59E0B'
  };

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="news-page">

      {/* HERO */}
      <section className="news-hero">
        <div
          className="news-hero-bg"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=1920&h=700&fit=crop)` }}
        >
          <div className="news-hero-overlay" />
        </div>
        <div className="container news-hero-inner">
          <div className="about-badge" data-aos="fade-up">
            <div className="about-badge-dot" />
            <span>Research & Updates</span>
          </div>
          <h1 className="news-hero-title" data-aos="fade-up" data-aos-delay="80">
            {t('news.title').replace('& Research', '').replace('et recherche', '')}
            <span className="title-gradient-modern">
              {t('news.title').includes('recherche') ? '& Recherche' : '& Research'}
            </span>
          </h1>
          <p className="news-hero-subtitle" data-aos="fade-up" data-aos-delay="160">
            {t('news.subtitle') || 'Latest updates in pulmonary radiology and AI-powered diagnostics'}
          </p>
        </div>
      </section>

      <div className="container news-content">

        {/* SEARCH & FILTERS */}
        <div className="news-controls" data-aos="fade-up">
          <div className="search-wrap">
            <svg className="search-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder={t('news.search') || 'Search articles...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pathology-search-input"
            />
          </div>

          <div className="filter-chips">
            {categories.map(cat => (
              <button
                key={cat.value}
                className={`filter-chip ${selectedCategory === cat.value ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FEATURED ARTICLE */}
        {featuredArticle && (
          <div className="featured-article" data-aos="fade-up">
            <div className="featured-img-col">
              <img src={featuredArticle.image} alt={featuredArticle.title} className="featured-img" />
              <div className="featured-img-overlay" />
              <div className="featured-top-badges">
                <span className="featured-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {t('news.featured') || 'Featured'}
                </span>
                <span className="featured-cat-badge" style={{ background: `${categoryColors[featuredArticle.category]}25`, borderColor: `${categoryColors[featuredArticle.category]}40`, color: categoryColors[featuredArticle.category] }}>
                  {t(`news.${featuredArticle.category}`) || featuredArticle.category}
                </span>
              </div>
            </div>

            <div className="featured-text-col">
              <h2 className="featured-title">{featuredArticle.title}</h2>
              <p className="featured-excerpt">{featuredArticle.excerpt}</p>

              <div className="featured-meta">
                <div className="author-chip">
                  <div className="author-avatar-sm">
                    {featuredArticle.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <span className="author-name-sm">{featuredArticle.author}</span>
                    <span className="article-date-sm">{new Date(featuredArticle.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="meta-chips">
                  <span className="meta-chip">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {featuredArticle.readTime} min read
                  </span>
                  <span className="meta-chip">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    {featuredArticle.views.toLocaleString()}
                  </span>
                </div>
              </div>

              <button className="featured-read-btn" onClick={() => navigate(`/news/${featuredArticle.id}`)}>
                <span>{t('news.readMore') || 'Read More'}</span>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ARTICLES GRID */}
        <div className="articles-section">
          <h2 className="section-title-modern" data-aos="fade-up">
            {t('news.latestNews') || 'Latest'} <span className="title-gradient-modern">News</span>
          </h2>

          <div className="articles-grid">
            {filteredArticles.map((article, index) => (
              <div
                key={article.id}
                className="article-card"
                onClick={() => navigate(`/news/${article.id}`)}
                data-aos="fade-up"
                data-aos-delay={index * 80}
              >
                <div className="article-img-wrap">
                  <img src={article.image} alt={article.title} className="article-img" />
                  <div className="article-img-overlay" />
                  <span
                    className="article-cat-badge"
                    style={{ background: `${categoryColors[article.category]}25`, borderColor: `${categoryColors[article.category]}45`, color: categoryColors[article.category] }}
                  >
                    {t(`news.${article.category}`) || article.category}
                  </span>
                </div>

                <div className="article-body">
                  <h3 className="article-title">{article.title}</h3>
                  <p className="article-excerpt">{article.excerpt}</p>

                  <div className="article-footer">
                    <div className="author-chip">
                      <div className="author-avatar-sm">
                        {article.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="author-name-sm">{article.author}</span>
                        <span className="article-date-sm">{new Date(article.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="meta-chip">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {article.readTime} min
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NEWSLETTER */}
        <div
          className="newsletter-section"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&h=500&fit=crop)` }}
          data-aos="fade-up"
        >
          <div className="newsletter-overlay" />
          <div className="newsletter-inner">
            <div className="newsletter-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h3 className="newsletter-title">{t('news.subscribe') || 'Subscribe to Newsletter'}</h3>
            <p className="newsletter-desc">{t('news.subscribeDesc') || 'Get the latest updates delivered to your inbox'}</p>
            <div className="newsletter-form">
              <input
                type="email"
                placeholder={t('news.emailPlaceholder') || 'Enter your email'}
                className="newsletter-input"
              />
              <button className="newsletter-btn">
                {t('news.subscribeBtn') || 'Subscribe'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default News;