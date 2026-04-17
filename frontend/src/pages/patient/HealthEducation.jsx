import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/patient/HealthEducation.css';

const HealthEducation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
  }, []);

  const categories = [
    { id: 'all',        label: 'All Topics',  color: '#0066CC',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg> },
    { id: 'prevention', label: 'Prevention',  color: '#10B981',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { id: 'symptoms',   label: 'Symptoms',    color: '#F59E0B',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
    { id: 'treatment',  label: 'Treatment',   color: '#8B5CF6',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
    { id: 'lifestyle',  label: 'Lifestyle',   color: '#00BFA6',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  ];

  const articles = [
    { 
      id:1, 
      title:'Understanding Pneumonia: Causes, Symptoms and Treatment', 
      category:'symptoms', 
      image:'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop', 
      excerpt:'Learn about pneumonia, one of the most common respiratory infections, its symptoms, and modern treatment approaches.', 
      recommended:true, 
      tags:['Pneumonia','Respiratory','Infection'],
      author: 'Dr. Sarah Johnson',
      date: 'January 15, 2024',
      content: `Pneumonia is an infection that inflames the air sacs in one or both lungs. The air sacs may fill with fluid or pus, causing cough with phlegm or pus, fever, chills, and difficulty breathing.

Causes:
• Bacteria (most common)
• Viruses
• Fungi

Symptoms:
• Chest pain when breathing or coughing
• Confusion or changes in mental awareness
• Cough with phlegm
• Fatigue
• Fever, sweating and shaking chills
• Lower than normal body temperature
• Nausea, vomiting or diarrhea
• Shortness of breath

Treatment:
Treatment depends on the type and severity of pneumonia. Bacterial pneumonia is treated with antibiotics, while viral pneumonia may improve on its own.`
    },
    { 
      id:2, 
      title:'10 Ways to Keep Your Lungs Healthy', 
      category:'prevention', 
      image:'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop', 
      excerpt:'Practical tips and lifestyle changes to maintain optimal lung health and prevent respiratory diseases.', 
      recommended:true, 
      tags:['Prevention','Wellness','Tips'],
      author: 'Dr. Michael Chen',
      date: 'February 1, 2024',
      content: `Your lungs are essential for breathing and overall health. Here are 10 evidence-based ways to keep them healthy:

1. Don't smoke - Smoking is the leading cause of lung cancer and COPD
2. Exercise regularly - Physical activity helps your lungs work better
3. Improve indoor air quality - Use air purifiers and ventilate your home
4. Avoid exposure to pollutants - Limit time outdoors when air quality is poor
5. Prevent infections - Get vaccinated and practice good hygiene
6. Practice breathing exercises - Diaphragmatic breathing strengthens lungs
7. Maintain a healthy weight - Excess weight can compress lungs
8. Stay hydrated - Water helps keep lung tissue moist
9. Eat antioxidant-rich foods - Berries, leafy greens support lung health
10. Regular check-ups - Early detection of problems is key`
    },
    { 
      id:3, 
      title:'Early Warning Signs of Respiratory Problems', 
      category:'symptoms', 
      image:'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=400&fit=crop', 
      excerpt:'Recognize the early symptoms of respiratory conditions and when to seek medical attention.', 
      recommended:false, 
      tags:['Symptoms','Early Detection','Awareness'],
      author: 'Dr. Emily Davis',
      date: 'January 20, 2024',
      content: `Early detection of respiratory problems can lead to better outcomes. Watch for these warning signs:

Persistent cough:
A cough lasting more than 3 weeks needs evaluation.

Shortness of breath:
Difficulty breathing during normal activities is a red flag.

Wheezing:
A whistling sound when breathing may indicate airway obstruction.

Chest pain:
Pain when breathing deeply could signal lung issues.

Chronic mucus production:
Coughing up mucus for a month or more warrants medical attention.

When to see a doctor immediately:
• Severe shortness of breath
• Chest pain
• Coughing up blood
• Blue lips or fingernails
• Dizziness or confusion`
    },
    { 
      id:4, 
      title:'Breathing Exercises for Better Lung Function', 
      category:'lifestyle', 
      image:'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&h=400&fit=crop', 
      excerpt:'Step-by-step guide to breathing exercises that can improve your lung capacity and overall respiratory health.', 
      recommended:true, 
      tags:['Exercise','Breathing','Wellness'],
      author: 'Dr. Robert Martinez',
      date: 'February 10, 2024',
      content: `Breathing exercises can strengthen your lungs and improve oxygen intake. Try these techniques:

Pursed-lip breathing:
1. Breathe in through your nose (2 counts)
2. Purse your lips as if whistling
3. Breathe out slowly through pursed lips (4 counts)

Diaphragmatic breathing:
1. Lie on your back with knees bent
2. Place one hand on chest, one on belly
3. Breathe in through nose, belly should rise
4. Breathe out through mouth, belly should fall

Box breathing:
1. Inhale for 4 counts
2. Hold for 4 counts
3. Exhale for 4 counts
4. Hold for 4 counts
5. Repeat

Practice these exercises daily for best results.`
    },
    { 
      id:5, 
      title:'Modern Treatments for Chronic Respiratory Diseases', 
      category:'treatment', 
      image:'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600&h=400&fit=crop', 
      excerpt:'Overview of cutting-edge treatments and therapies for managing chronic respiratory conditions.', 
      recommended:false, 
      tags:['Treatment','Chronic','Therapy'],
      author: 'Dr. Lisa Anderson',
      date: 'January 25, 2024',
      content: `Chronic respiratory diseases like COPD and asthma now have advanced treatment options:

Biologics:
Targeted therapies that modify the immune response in severe asthma.

Targeted therapies:
Medications that target specific pathways in disease progression.

Pulmonary rehabilitation:
Comprehensive program including:
• Exercise training
• Nutrition counseling
• Education
• Psychological support

Bronchial thermoplasty:
Minimally invasive procedure for severe asthma.

Lung volume reduction:
Surgical or bronchoscopic procedures for emphysema.

Oxygen therapy:
Supplemental oxygen for advanced disease.

Consult your healthcare provider to determine the best treatment plan for your condition.`
    },
    { 
      id:6, 
      title:'Air Quality and Your Respiratory Health', 
      category:'prevention', 
      image:'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&h=400&fit=crop', 
      excerpt:'How environmental factors affect your lungs and what you can do to protect yourself.', 
      recommended:false, 
      tags:['Environment','Prevention','Awareness'],
      author: 'Dr. James Wilson',
      date: 'February 5, 2024',
      content: `Air pollution is a major threat to respiratory health. Learn how to protect yourself:

Understanding Air Quality Index (AQI):
• 0-50: Good
• 51-100: Moderate
• 101-150: Unhealthy for sensitive groups
• 151-200: Unhealthy
• 201-300: Very unhealthy
• 301+: Hazardous

Protection strategies:
1. Monitor air quality daily
2. Limit outdoor activities when AQI is high
3. Use air purifiers indoors
4. Keep windows closed on high pollution days
5. Wear N95 masks when necessary
6. Avoid exercising near busy roads
7. Support clean air policies

Indoor air quality:
• Ventilate your home
• Use exhaust fans
• Avoid smoking indoors
• Reduce use of harsh chemicals`
    },
    { 
      id:7, 
      title:'Nutrition for Healthy Lungs', 
      category:'lifestyle', 
      image:'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop', 
      excerpt:'Foods and nutrients that support respiratory health and boost your immune system.', 
      recommended:true, 
      tags:['Nutrition','Diet','Wellness'],
      author: 'Dr. Maria Garcia',
      date: 'January 30, 2024',
      content: `Diet plays a crucial role in lung health. Include these foods in your diet:

Antioxidant-rich foods:
• Berries (blueberries, strawberries)
• Leafy greens (spinach, kale)
• Tomatoes
• Oranges

Omega-3 fatty acids:
• Fatty fish (salmon, mackerel)
• Walnuts
• Flaxseeds
• Chia seeds

Vitamins and minerals:
Vitamin C: Citrus fruits, bell peppers
Vitamin E: Nuts, seeds, vegetable oils
Vitamin D: Fatty fish, fortified foods
Magnesium: Nuts, whole grains, leafy greens

Foods to avoid:
• Processed foods
• Excessive sugar
• Trans fats
• High sodium foods

Stay hydrated: Drink 8-10 glasses of water daily to keep lung tissue moist.`
    },
    { 
      id:8, 
      title:'Understanding Chest X-Rays: A Patient Guide', 
      category:'treatment', 
      image:'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop', 
      excerpt:'What to expect during a chest X-ray examination and how to interpret basic findings.', 
      recommended:false, 
      tags:['Imaging','Diagnosis','Education'],
      author: 'Dr. David Thompson',
      date: 'February 15, 2024',
      content: `Chest X-rays are a common diagnostic tool. Here's what you need to know:

What is a chest X-ray?
A painless imaging test that uses small amounts of radiation to create pictures of your chest structures.

Preparation:
• Remove jewelry and metal objects
• Wear a hospital gown if requested
• Inform technician if pregnant
• No special dietary restrictions

During the exam:
• You'll stand against a plate
• Technician will position you
• You'll hold your breath briefly
• Takes only a few minutes

What it can detect:
• Lung infections (pneumonia)
• Lung diseases (COPD, emphysema)
• Lung cancer
• Heart problems
• Broken ribs
• Fluid around lungs

Results:
Your doctor will review the images and discuss findings with you, usually within a few days.`
    },
  ];

  const filtered = articles.filter(a => {
    const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const recommended = articles.filter(a => a.recommended);

  const getCat = (id) => categories.find(c => c.id === id);

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setShowModal(true);
  };

  return (
    <div className="edu-page">
      <div className="container">

        {/* HEADER */}
        <div className="edu-header" data-aos="fade-down">
          <div className="edu-header-badge">
            <div className="edu-badge-dot" />
            <span>Patient Education</span>
          </div>
          <h1 className="edu-title">
            <span className="edu-title-grad">{t('patient.education.title') || 'Health Education'}</span>
          </h1>
          <p className="edu-subtitle">
            {t('patient.education.subtitle') || 'Evidence-based articles to help you understand your respiratory health'}
          </p>
        </div>

        {/* SEARCH */}
        <div className="edu-search-wrap" data-aos="fade-up">
          <div className="edu-search-inner">
            <div className="edu-search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <input
              type="text"
              className="edu-search-input"
              placeholder="Search articles about lung health, symptoms, treatments..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="edu-search-clear" onClick={() => setSearchTerm('')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="edu-categories" data-aos="fade-up">
          {categories.map((cat, i) => (
            <button
              key={cat.id}
              className={`edu-cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              style={{ '--cat-color': cat.color }}
              onClick={() => setSelectedCategory(cat.id)}
              data-aos="fade-up" data-aos-delay={i * 60}
            >
              <span className="edu-cat-icon">{cat.icon}</span>
              <span className="edu-cat-label">{cat.label}</span>
              {selectedCategory === cat.id && <div className="edu-cat-active-dot" />}
            </button>
          ))}
        </div>

        {/* FEATURED / RECOMMENDED */}
        {selectedCategory === 'all' && !searchTerm && (
          <div className="edu-featured-section" data-aos="fade-up">
            <div className="edu-section-header">
              <div>
                <h2 className="edu-section-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:'0.5rem',verticalAlign:'middle'}}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {t('patient.education.recommended') || 'Recommended for You'}
                </h2>
                <p className="edu-section-sub">Curated articles based on your health profile</p>
              </div>
            </div>

            {/* Big featured card */}
            <div className="edu-featured-grid">
              <div
                className="edu-featured-main"
                data-aos="fade-right"
                onClick={() => handleArticleClick(recommended[0])}
                style={{ cursor: 'pointer' }}
              >
                <div className="edu-featured-img-wrap">
                  <img src={recommended[0].image} alt={recommended[0].title} className="edu-featured-img" />
                  <div className="edu-featured-overlay" />
                  <div className="edu-featured-top">
                    <span className="edu-cat-pill" style={{ background: getCat(recommended[0].category)?.color }}>
                      {getCat(recommended[0].category)?.icon}
                      <span>{getCat(recommended[0].category)?.label}</span>
                    </span>
                    <span className="edu-star-badge">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      Featured
                    </span>
                  </div>
                  <div className="edu-featured-bottom">
                    <h3 className="edu-featured-title">{recommended[0].title}</h3>
                  </div>
                </div>
              </div>

              <div className="edu-featured-side">
                {recommended.slice(1, 4).map((art, i) => (
                  <div key={art.id} className="edu-featured-side-card" data-aos="fade-left" data-aos-delay={i * 100} onClick={() => handleArticleClick(art)} style={{ cursor: 'pointer' }}>
                    <img src={art.image} alt={art.title} className="edu-side-img" />
                    <div className="edu-side-body">
                      <span className="edu-side-cat" style={{ color: getCat(art.category)?.color }}>
                        {getCat(art.category)?.label}
                      </span>
                      <h4 className="edu-side-title">{art.title}</h4>
                    </div>
                    <svg className="edu-side-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ALL ARTICLES */}
        <div className="edu-articles-section">
          <div className="edu-section-header">
            <div>
              <h2 className="edu-section-title">
                {selectedCategory === 'all'
                  ? 'All Articles'
                  : `${getCat(selectedCategory)?.label} Articles`}
              </h2>
              <p className="edu-section-sub">
                {filtered.length} article{filtered.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="edu-empty" data-aos="fade-up">
              <div className="edu-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h3>No articles found</h3>
              <p>Try adjusting your search or browse all categories</p>
              <button className="edu-reset-btn" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
                View All Articles
              </button>
            </div>
          ) : (
            <div className="edu-articles-grid">
              {filtered.map((art, i) => (
                <div key={art.id} className="edu-article-card" data-aos="fade-up" data-aos-delay={i * 70} onClick={() => handleArticleClick(art)} style={{ cursor: 'pointer' }}>
                  <div className="edu-article-img-wrap">
                    <img src={art.image} alt={art.title} className="edu-article-img" />
                    <div className="edu-article-img-overlay" />
                    <span className="edu-article-cat-pill" style={{ background: getCat(art.category)?.color }}>
                      {getCat(art.category)?.icon}
                    </span>
                    {art.recommended && (
                      <span className="edu-article-star">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      </span>
                    )}
                  </div>

                  <div className="edu-article-body">
                    <div className="edu-article-top">
                      <span className="edu-article-cat-label" style={{ color: getCat(art.category)?.color }}>
                        {getCat(art.category)?.label}
                      </span>
                    </div>

                    <h3 className="edu-article-title">{art.title}</h3>
                    <p className="edu-article-excerpt">{art.excerpt}</p>

                    <div className="edu-article-tags">
                      {art.tags.slice(0, 2).map((tag, ti) => (
                        <span key={ti} className="edu-tag">{tag}</span>
                      ))}
                    </div>

                    <div className="edu-article-footer">
                      <span className="edu-read-link">
                        Read More
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA BANNER */}
        <div className="edu-cta" data-aos="zoom-in">
          <div className="edu-cta-bg" />
          <div className="edu-cta-content">
            <div className="edu-cta-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            </div>
            <div className="edu-cta-text">
              <h3>Want personalized health education?</h3>
              <p>Get tailored articles and resources based on your medical history and analyses</p>
            </div>
            <button className="edu-cta-btn" onClick={() => alert('📧 Contact your radiologist for personalized content!\n\nYour doctor can recommend articles based on your condition.')}>
              Get Personalized Content
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* ARTICLE MODAL */}
        {showModal && selectedArticle && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="edu-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface-primary)', borderRadius: '20px', padding: '0' }}>
              
              {/* Modal Header */}
              <div style={{ position: 'sticky', top: 0, background: 'var(--surface-primary)', zIndex: 10, padding: '2rem 2rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ display: 'inline-block', padding: '0.5rem 1rem', background: `${getCat(selectedArticle.category)?.color}20`, color: getCat(selectedArticle.category)?.color, borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                    {getCat(selectedArticle.category)?.label}
                  </span>
                  <button onClick={() => setShowModal(false)} style={{ padding: '0.5rem', background: 'var(--surface-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: '0.75rem', lineHeight: '1.3' }}>{selectedArticle.title}</h2>
                <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <span>By {selectedArticle.author}</span>
                  <span>•</span>
                  <span>{selectedArticle.date}</span>
                </div>
              </div>

              {/* Image */}
              <img src={selectedArticle.image} alt={selectedArticle.title} style={{ width: '100%', height: '300px', objectFit: 'cover' }} />

              {/* Content */}
              <div style={{ padding: '2rem', color: 'var(--text-secondary)', lineHeight: '1.8', whiteSpace: 'pre-line', fontSize: '1rem' }}>
                {selectedArticle.content}
              </div>

              {/* Tags */}
              <div style={{ padding: '0 2rem 2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedArticle.tags.map((tag, i) => (
                  <span key={i} className="edu-tag">{tag}</span>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HealthEducation;