import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, X, Sparkles, BookOpen, ArrowLeft, CheckCircle2, Phone, AlertTriangle } from 'lucide-react';
import { motherApi } from '../api';
import { MotherPregnancyTrackingData } from '../types';
import { CATEGORIES, WARNING_SIGNS, QUICK_TIPS, ARTICLES, WEEK_GUIDES, findClosestWeek, getTrimester, CategorySlug, ContentItem, WeekGuide } from '../data/learnContent';

type View = 'home' | 'category' | 'article' | 'week' | 'warnings';

export default function MotherLearn() {
  const [data, setData] = useState<MotherPregnancyTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ContentItem | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await motherApi.pregnancyTracking();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const weeks_pregnant = data?.weeks_pregnant;
  const stage: 'pregnant' | 'postnatal' = weeks_pregnant && weeks_pregnant > 0 ? 'pregnant' : 'postnatal';
  const trimester = weeks_pregnant ? getTrimester(weeks_pregnant) : null;

  const openCategory = (slug: CategorySlug) => {
    setSelectedCategory(slug);
    setView('category');
  };

  const openArticle = (article: ContentItem) => {
    setSelectedArticle(article);
    setView('article');
  };

  const openWeek = (week: number) => {
    setSelectedWeek(week);
    setView('week');
  };

  const goHome = () => {
    setView('home');
    setSelectedCategory(null);
    setSelectedArticle(null);
    setSelectedWeek(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.08) 0%, rgba(253, 224, 207, 0.08) 50%, rgba(186, 226, 230, 0.08) 100%)',
      }} />
      <div className="relative z-10 p-4 md:p-6 max-w-4xl mx-auto pb-32">
        {view === 'home' && (
          <HomeView
            weeksPregnant={weeks_pregnant}
            trimester={trimester}
            stage={stage}
            onOpenCategory={openCategory}
            onOpenArticle={openArticle}
            onOpenWeek={openWeek}
            onOpenWarnings={() => setView('warnings')}
          />
        )}
        {view === 'category' && selectedCategory && (
          <CategoryView
            slug={selectedCategory}
            stage={stage}
            onBack={goHome}
            onOpenArticle={openArticle}
            onOpenWarnings={() => setView('warnings')}
          />
        )}
        {view === 'article' && selectedArticle && (
          <ArticleView article={selectedArticle} onBack={goHome} />
        )}
        {view === 'week' && selectedWeek && (
          <WeekView week={selectedWeek} guide={WEEK_GUIDES[selectedWeek]} onBack={goHome} />
        )}
        {view === 'warnings' && (
          <WarningsView onBack={goHome} />
        )}
      </div>
    </div>
  );
}

// ─── Home View ────────────────────────────────────────────────────────────────
function HomeView({
  weeksPregnant, trimester, stage, onOpenCategory, onOpenArticle, onOpenWeek, onOpenWarnings,
}: {
  weeksPregnant?: number;
  trimester: 'first' | 'second' | 'third' | null;
  stage: 'pregnant' | 'postnatal';
  onOpenCategory: (slug: CategorySlug) => void;
  onOpenArticle: (a: ContentItem) => void;
  onOpenWeek: (w: number) => void;
  onOpenWarnings: () => void;
}) {
  // Build recommended list
  const recommended = useMemo(() => {
    if (stage !== 'pregnant' || !weeksPregnant) return [];
    const items: { title: string; subtitle: string; onClick: () => void }[] = [];
    const closest = findClosestWeek(weeksPregnant);
    items.push({
      title: `What is happening at week ${closest}`,
      subtitle: 'Your personalized week guide',
      onClick: () => onOpenWeek(closest),
    });
    if (trimester === 'second') {
      items.push({
        title: 'Nutrition During Second Trimester',
        subtitle: 'What to eat and why',
        onClick: () => onOpenCategory('nutrition'),
      });
      items.push({
        title: `Common Changes At ${weeksPregnant} Weeks`,
        subtitle: 'Your body this week',
        onClick: () => onOpenCategory('pregnancy'),
      });
    }
    if (trimester === 'third') {
      items.push({
        title: 'Preparing For Delivery',
        subtitle: 'Get ready for the big day',
        onClick: () => onOpenCategory('pregnancy'),
      });
      const kick = ARTICLES.find(a => a.id === 'kick-counts');
      if (kick) {
        items.push({
          title: 'Fetal Movement Tracking',
          subtitle: 'How to do kick counts',
          onClick: () => onOpenArticle(kick),
        });
      }
    }
    if (trimester === 'first') {
      items.push({
        title: 'Managing Early Pregnancy',
        subtitle: 'Coping with early symptoms',
        onClick: () => onOpenCategory('pregnancy'),
      });
    }
    return items;
  }, [stage, weeksPregnant, trimester, onOpenCategory, onOpenArticle, onOpenWeek]);

  return (
    <>
      {/* Hero */}
      <div className="mb-6 rounded-3xl p-6 md:p-8 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.3) 0%, rgba(236, 72, 153, 0.2) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(192, 132, 252, 0.3)',
        }}>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2 flex items-center gap-2">
          <BookOpen className="text-purple-300" size={32} />
          Learn
        </h1>
        <p className="text-white/90 text-sm md:text-base drop-shadow">
          {stage === 'pregnant' && weeksPregnant
            ? `Educational guides tailored to week ${weeksPregnant} of your pregnancy`
            : 'Educational guides for you and your new baby'}
        </p>
        {stage === 'pregnant' && weeksPregnant && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
            <Sparkles className="text-yellow-300" size={16} />
            <span className="text-white text-sm font-semibold">
              {trimester === 'first' && 'First Trimester'}
              {trimester === 'second' && 'Second Trimester'}
              {trimester === 'third' && 'Third Trimester'}
              {' '}• Week {weeksPregnant}
            </span>
          </div>
        )}
      </div>

      {/* Recommended For You */}
      {recommended.length > 0 && (
        <div className="mb-6 rounded-3xl p-6 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.18) 0%, rgba(192, 132, 252, 0.12) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
          }}>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="text-pink-300" size={20} />
            Recommended For You
          </h2>
          <div className="space-y-3">
            {recommended.map((r, i) => (
              <button key={i} onClick={r.onClick}
                className="w-full text-left rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="text-pink-300 shrink-0" size={16} />
                    <div className="text-white font-semibold text-sm">{r.title}</div>
                  </div>
                  <div className="text-white/60 text-xs ml-6">{r.subtitle}</div>
                </div>
                <ChevronRight className="text-white/50 shrink-0" size={20} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Warning signs - always visible */}
      <button onClick={onOpenWarnings}
        className="w-full mb-6 rounded-3xl p-5 shadow-lg text-left transition-all active:scale-[0.99]"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(239, 68, 68, 0.5)',
        }}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl shrink-0" style={{ background: 'rgba(239, 68, 68, 0.3)' }}>
            <AlertTriangle className="text-red-200" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-base mb-0.5">Warning Signs</div>
            <div className="text-white/80 text-xs">When to seek help immediately</div>
          </div>
          <ChevronRight className="text-white/70 shrink-0" size={20} />
        </div>
      </button>

      {/* Categories */}
      <h2 className="text-lg font-bold text-white mb-4 px-2">Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CATEGORIES.map(cat => (
          <button key={cat.slug} onClick={() => onOpenCategory(cat.slug)}
            className="rounded-3xl p-5 shadow-lg text-left transition-all active:scale-95 hover:shadow-xl"
            style={{
              background: cat.bgGradient,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${cat.border}`,
              minHeight: '140px',
            }}>
            <div className="p-3 rounded-2xl inline-flex mb-3" style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
              <span style={{ color: cat.accent }}>{cat.icon}</span>
            </div>
            <h3 className="text-white font-bold text-sm md:text-base leading-tight mb-1">
              {cat.title}
            </h3>
            <p className="text-white/70 text-xs leading-snug">{cat.description}</p>
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Category View ────────────────────────────────────────────────────────────
function CategoryView({
  slug, stage, onBack, onOpenArticle, onOpenWarnings,
}: {
  slug: CategorySlug;
  stage: 'pregnant' | 'postnatal';
  onBack: () => void;
  onOpenArticle: (a: ContentItem) => void;
  onOpenWarnings: () => void;
}) {
  const category = CATEGORIES.find(c => c.slug === slug)!;
  const tips = QUICK_TIPS[slug] ?? [];
  const articles = ARTICLES.filter(a => a.category === slug);
  const showWarningsLink = slug === 'warning-signs';

  return (
    <>
      <BackBar onBack={onBack} title={category.title} accent={category.accent} />
      <div className="mb-6 rounded-3xl p-6 shadow-2xl"
        style={{ background: category.bgGradient, backdropFilter: 'blur(20px)', border: `1px solid ${category.border}` }}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.15)' }}>
            <span style={{ color: category.accent }}>{category.icon}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-white">{category.title}</h1>
            <p className="text-white/80 text-sm">{category.description}</p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      {tips.length > 0 && (
        <div className="mb-6 rounded-3xl p-6 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(192, 132, 252, 0.25)',
          }}>
          <h2 className="text-base font-bold text-white mb-4">Quick Tips</h2>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl p-3"
                style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <div className="p-1.5 rounded-lg shrink-0" style={{ background: 'rgba(192, 132, 252, 0.2)', color: category.accent }}>
                  {tip.icon}
                </div>
                <p className="text-white/90 text-sm leading-relaxed flex-1">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles */}
      {articles.length > 0 ? (
        <>
          <h2 className="text-base font-bold text-white mb-3 px-2">Short Articles</h2>
          <div className="space-y-3 mb-6">
            {articles.map(article => (
              <button key={article.id} onClick={() => onOpenArticle(article)}
                className="w-full text-left rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
                style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm mb-1">{article.title}</h3>
                  <p className="text-white/60 text-xs line-clamp-2">{article.body}</p>
                </div>
                <ChevronRight className="text-white/50 shrink-0" size={20} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl p-6 text-center"
          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px dashed rgba(255, 255, 255, 0.2)' }}>
          <p className="text-white/60 text-sm">No articles yet for this category.</p>
        </div>
      )}

      {/* Inline warnings link for warning-signs category */}
      {showWarningsLink && (
        <div className="mt-6 rounded-3xl p-6 shadow-lg"
          style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)', backdropFilter: 'blur(20px)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
          <h2 className="text-base font-bold text-red-200 mb-3">Seek Medical Attention Immediately</h2>
          <div className="space-y-2">
            {WARNING_SIGNS.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-2.5"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div className="text-red-300 shrink-0 mt-0.5">{s.icon}</div>
                <p className="text-white/90 text-sm flex-1">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Article View ─────────────────────────────────────────────────────────────
function ArticleView({ article, onBack }: { article: ContentItem; onBack: () => void }) {
  return (
    <>
      <BackBar onBack={onBack} title={article.title} />
      <div className="rounded-3xl p-6 md:p-8 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 206, 0.2) 0%, rgba(186, 226, 230, 0.15) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
        }}>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-4">{article.title}</h1>
        <p className="text-white/85 text-base leading-relaxed whitespace-pre-line">{article.body}</p>
      </div>
    </>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({ week, guide, onBack }: { week: number; guide: WeekGuide; onBack: () => void }) {
  return (
    <>
      <BackBar onBack={onBack} title={`Week ${week}`} />
      <div className="rounded-3xl p-6 md:p-8 shadow-2xl mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(244, 114, 182, 0.15) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(236, 72, 153, 0.35)',
        }}>
        <p className="text-pink-200 text-xs uppercase tracking-widest mb-2">Pregnancy Guide</p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">{guide.title}</h1>
        <p className="text-white/80 text-sm">Your baby is about the size of <strong>{guide.babySize}</strong></p>
      </div>

      <Section title="Your Baby" accent="#f472b6">
        <ul className="space-y-2">
          {guide.babyDev.map((b, i) => (
            <li key={i} className="flex items-start gap-3 text-white/85 text-sm">
              <CheckCircle2 className="text-pink-300 shrink-0 mt-0.5" size={16} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Your Body" accent="#c4b5fd">
        <ul className="space-y-2">
          {guide.bodyChanges.map((b, i) => (
            <li key={i} className="flex items-start gap-3 text-white/85 text-sm">
              <CheckCircle2 className="text-purple-300 shrink-0 mt-0.5" size={16} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Recommended Actions" accent="#5eead4">
        <ul className="space-y-2">
          {guide.actions.map((b, i) => (
            <li key={i} className="flex items-start gap-3 text-white/85 text-sm">
              <CheckCircle2 className="text-teal-300 shrink-0 mt-0.5" size={16} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

// ─── Warnings View ────────────────────────────────────────────────────────────
function WarningsView({ onBack }: { onBack: () => void }) {
  return (
    <>
      <BackBar onBack={onBack} title="Warning Signs" />
      <div className="rounded-3xl p-6 md:p-8 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.15) 100%)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(239, 68, 68, 0.5)',
        }}>
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="text-red-200" size={32} />
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Seek Medical Attention Immediately</h1>
        </div>
        <p className="text-white/85 text-sm">If you experience any of these, go to your clinic or call right away.</p>
      </div>

      <div className="mt-6 space-y-3">
        {WARNING_SIGNS.map((s, i) => (
          <div key={i} className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div className="p-2 rounded-xl shrink-0" style={{ background: 'rgba(239, 68, 68, 0.25)' }}>
              <div className="text-red-200">{s.icon}</div>
            </div>
            <p className="text-white text-sm font-semibold flex-1">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl p-5 shadow-lg"
        style={{ background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)', backdropFilter: 'blur(20px)', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Phone className="text-purple-300" size={18} />
          Call your clinic
        </h2>
        <p className="text-white/80 text-sm mb-3">If you are not sure whether something is serious, call anyway. It is always better to be checked.</p>
        <a href="tel:999" className="block w-full text-center rounded-2xl py-3 font-bold text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)' }}>
          Call Now
        </a>
      </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function BackBar({ onBack, title, accent }: { onBack: () => void; title: string; accent?: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <button onClick={onBack} className="p-2 rounded-full transition-all active:scale-95"
        aria-label="Go back"
        style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: accent || 'white' }}>
        <ArrowLeft size={20} />
      </button>
      <h2 className="text-lg font-bold text-white truncate">{title}</h2>
    </div>
  );
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-3xl p-5 shadow-lg"
      style={{ background: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
      <h3 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>{title}</h3>
      {children}
    </div>
  );
}
