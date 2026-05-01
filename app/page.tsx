"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  BookOpen,
  FileText,
  Book,
  Video,
  Users,
  Share2,
  History,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Activity,
  Map,
  Library,
  Target,
  Wand2,
  Sparkles,
  Link as LinkIcon,
  ChevronRight,
  Download
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface SkillScore {
  skill: string;
  current: number;
  required: number;
  category: string;
  gap: number;
}

interface RoadmapStep {
  step: number;
  title: string;
  description: string;
  duration: string;
  priority: "high" | "medium" | "low";
}

interface Resource {
  title: string;
  url: string;
  type: "course" | "docs" | "book" | "video" | "community";
  free: boolean;
}

interface AnalysisResult {
  summary: string;
  overallReadiness: number;
  skillScores: SkillScore[];
  roadmap: RoadmapStep[];
  resources: Resource[];
  strengths: string[];
  quickWins: string[];
}

interface HistoryEntry {
  id: string;
  name: string;
  goal: string;
  date: string;
  result: AnalysisResult;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  course: <BookOpen className="w-5 h-5 text-indigo-500" />,
  docs: <FileText className="w-5 h-5 text-blue-500" />,
  book: <Book className="w-5 h-5 text-amber-500" />,
  video: <Video className="w-5 h-5 text-red-500" />,
  community: <Users className="w-5 h-5 text-emerald-500" />,
};

function ReadinessRing({ value }: { value: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value >= 70 ? "#10b981" : value >= 40 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative flex items-center justify-center drop-shadow-xl">
      <svg width="136" height="136" className="-rotate-90">
        <circle cx="68" cy="68" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <motion.circle
          cx="68"
          cy="68"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-500"
        >
          {value}%
        </motion.div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ready</div>
      </div>
    </div>
  );
}

// ── Animations ───────────────────────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"radar" | "roadmap" | "resources">("radar");
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("sgr-history");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !skills.trim() || !goal.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, skills, goal }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      const parsed: AnalysisResult = data.data;
      setResult(parsed);

      // Save to history
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        name,
        goal,
        date: new Date().toISOString(),
        result: parsed,
      };
      const updated = [entry, ...history].slice(0, 10);
      setHistory(updated);
      localStorage.setItem("sgr-history", JSON.stringify(updated));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setName(entry.name);
    setGoal(entry.goal);
    setResult(entry.result);
    setShowHistory(false);
  };

  const shareResult = () => {
    const text = `AI Skill Gap Analysis for ${name}\nGoal: ${goal}\nReadiness: ${result?.overallReadiness}%\n\nAnalyzed with AI Skill Gap Radar`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadPdf = async () => {
    if (!result) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxTextWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureRoom = (requiredHeight = 18) => {
      if (y + requiredHeight <= pageHeight - margin) return;
      doc.addPage();
      y = margin;
    };

    const addHeading = (text: string) => {
      ensureRoom(24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(text, margin, y);
      y += 22;
    };

    const addParagraph = (text: string, fontSize = 11) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxTextWidth);
      lines.forEach((line: string) => {
        ensureRoom(16);
        doc.text(line, margin, y);
        y += 16;
      });
      y += 6;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("SkillRadar AI - Analysis Report", margin, y);
    y += 28;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Name: ${name}`, margin, y);
    y += 16;
    doc.text(`Goal: ${goal}`, margin, y);
    y += 16;
    doc.text(`Overall Readiness: ${result.overallReadiness}%`, margin, y);
    y += 24;

    addHeading("Summary");
    addParagraph(result.summary);

    if (result.strengths?.length) {
      addHeading("Strengths");
      result.strengths.forEach((strength) => addParagraph(`- ${strength}`));
    }

    if (result.quickWins?.length) {
      addHeading("Quick Wins");
      result.quickWins.forEach((quickWin) => addParagraph(`- ${quickWin}`));
    }

    if (result.skillScores?.length) {
      addHeading("Skill Scores");
      result.skillScores.forEach((skill) => {
        addParagraph(
          `${skill.skill} (${skill.category}): Current ${skill.current}/10, Required ${skill.required}/10, Gap ${skill.gap}`
        );
      });
    }

    if (result.roadmap?.length) {
      addHeading("Roadmap");
      result.roadmap.forEach((step) => {
        addParagraph(
          `Step ${step.step}: ${step.title} (${step.priority} priority, ${step.duration})`
        );
        addParagraph(step.description);
      });
    }

    if (result.resources?.length) {
      addHeading("Resources");
      result.resources.forEach((resource) => {
        addParagraph(
          `${resource.title} [${resource.type}${resource.free ? ", free" : ""}]`
        );
        addParagraph(resource.url, 10);
      });
    }

    const safeName = (name || "analysis").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    doc.save(`skillradar-report-${safeName}.pdf`);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("sgr-history");
  };

  return (
    <div className="min-h-screen bg-[#fafcff] text-slate-900 selection:bg-indigo-500/30 overflow-x-hidden font-sans relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
      
      <div className="mx-auto max-w-6xl px-4 py-12 relative z-10">

        {/* ── Header ── */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                SkillRadar AI
              </h1>
              <p className="mt-0.5 text-sm font-medium text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Map strengths, bridge gaps, accelerate growth
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="group relative flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/60 backdrop-blur-md px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-white hover:shadow-md hover:border-slate-300"
          >
            <History className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            History
            {history.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {history.length}
              </span>
            )}
          </button>
        </motion.div>

        {/* ── History Panel ── */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl p-6 shadow-xl shadow-slate-200/40">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-500" />
                    Past Analyses
                  </h2>
                  {history.length > 0 && (
                    <button onClick={clearHistory} className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-md transition-colors">
                      <Trash2 className="w-3 h-3" /> Clear All
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-sm font-medium text-slate-400">No history found yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {history.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => loadFromHistory(h)}
                        className="group relative flex flex-col items-start w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5"
                      >
                        <div className="flex w-full items-start justify-between mb-2">
                          <span className="text-sm font-bold text-slate-800 line-clamp-1 pr-4">{h.name}</span>
                          <span className="flex-shrink-0 inline-flex items-center justify-center h-6 px-2 rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 ring-1 ring-inset ring-indigo-500/10">
                            {h.result.overallReadiness}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 line-clamp-1 mb-3">
                          <Target className="w-3 h-3 text-slate-400" />
                          {h.goal}
                        </div>
                        <div className="mt-auto pt-3 border-t border-slate-50 w-full text-[10px] font-medium text-slate-400 flex justify-between items-center">
                          {new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-indigo-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`grid gap-8 transition-all duration-500 ease-in-out ${result ? "lg:grid-cols-12" : "max-w-2xl mx-auto"}`}>

          {/* ── Input Form ── */}
          <div className={`${result ? "lg:col-span-4" : "col-span-1"}`}>
            <motion.div 
              layout
              className="sticky top-6 rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-32 bg-indigo-50 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
              
              <h2 className="mb-6 text-lg font-bold text-slate-800 flex items-center gap-2 relative">
                <Target className="w-5 h-5 text-indigo-500" />
                Your Profile
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5 relative">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Alex Chen"
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Current Skills
                  </label>
                  <textarea
                    rows={4}
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="E.g. Python, basic ML, React, SQL..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white/50 px-4 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Target Role / Goal
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="E.g. Senior Frontend Engineer"
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    required
                  />
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600 flex items-start gap-2">
                    <div className="mt-0.5"><Activity className="w-4 h-4" /></div>
                    {error}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 disabled:cursor-not-allowed disabled:opacity-70 mt-4"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Wand2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Skill Radar
                      </>
                    )}
                  </span>
                </motion.button>
              </form>
            </motion.div>
          </div>

          {/* ── Results ── */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-8 space-y-6"
              >
                {/* Summary card */}
                <div className="rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-slate-200/40">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="shrink-0">
                      <ReadinessRing value={result.overallReadiness} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-black text-slate-800 mb-2">Analysis Complete</h3>
                      <p className="text-sm font-medium leading-relaxed text-slate-600 mb-6">{result.summary}</p>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                          {result.strengths?.map((s, i) => (
                            <span key={i} className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {s}
                            </span>
                          ))}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={downloadPdf}
                            className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900"
                          >
                            <Download className="w-4 h-4" />
                            Download PDF
                          </button>
                          <button
                            onClick={shareResult}
                            className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900"
                          >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                            {copied ? "Copied!" : "Share Results"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick wins */}
                {result.quickWins?.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 shadow-sm"
                  >
                    <div className="absolute -right-4 -top-4 text-amber-500/10">
                      <Sparkles className="w-32 h-32" />
                    </div>
                    <p className="mb-4 text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Quick Wins
                    </p>
                    <ul className="grid gap-3 sm:grid-cols-2 relative z-10">
                      {result.quickWins.map((w, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-amber-900 bg-white/40 p-3 rounded-xl border border-amber-100">
                          <ArrowRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* ── Tabs: Radar / Roadmap / Resources ── */}
                <div className="rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/40 overflow-hidden">
                  
                  {/* Tab bar */}
                  <div className="flex p-2 bg-slate-50/80 border-b border-slate-100 gap-2">
                    {[
                      { id: "radar", icon: Activity, label: "Skill Radar" },
                      { id: "roadmap", icon: Map, label: "Roadmap" },
                      { id: "resources", icon: Library, label: "Resources" }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold transition-all rounded-2xl z-10 ${
                            isActive ? "text-indigo-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-slate-200/50 -z-10"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <Icon className={`w-4 h-4 ${isActive ? "text-indigo-500" : ""}`} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Content Area */}
                  <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                      {/* ── Radar tab ── */}
                      {activeTab === "radar" && (
                        <motion.div 
                          key="radar"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="p-8"
                        >
                          {result.skillScores?.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-8 items-center">
                              <div className="relative aspect-square">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart data={result.skillScores} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis
                                      dataKey="skill"
                                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                                    />
                                    <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                                    <Radar
                                      name="Required"
                                      dataKey="required"
                                      stroke="#cbd5e1"
                                      fill="#f8fafc"
                                      fillOpacity={0.8}
                                      strokeWidth={2}
                                      strokeDasharray="4 4"
                                    />
                                    <Radar
                                      name="Current"
                                      dataKey="current"
                                      stroke="#6366f1"
                                      fill="url(#colorCurrent)"
                                      fillOpacity={1}
                                      strokeWidth={3}
                                    />
                                    <defs>
                                      <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                      </linearGradient>
                                    </defs>
                                    <Tooltip
                                      contentStyle={{ 
                                        fontSize: 12, 
                                        fontWeight: 600,
                                        borderRadius: 16, 
                                        border: "1px solid #e2e8f0",
                                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                                      }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 20 }} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Skill bars */}
                              <div className="space-y-5">
                                {result.skillScores.map((s, i) => (
                                  <div key={i} className="group">
                                    <div className="mb-2 flex justify-between items-end">
                                      <div>
                                        <span className="font-bold text-slate-800">{s.skill}</span>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{s.category}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-xs font-bold text-slate-600">
                                          {s.current} <span className="text-slate-300">/</span> {s.required}
                                        </span>
                                        {s.gap > 0 && (
                                          <span className="block text-[10px] font-bold text-rose-500 mt-0.5 bg-rose-50 px-1.5 py-0.5 rounded ml-auto w-fit">
                                            Gap: {s.gap}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-slate-100 relative group-hover:bg-slate-200 transition-colors">
                                      <div
                                        className="absolute top-0 left-0 h-full rounded-full bg-slate-300 transition-all duration-1000"
                                        style={{ width: `${(s.required / 10) * 100}%` }}
                                      />
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(s.current / 10) * 100}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 + 0.5, type: "spring" }}
                                        className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-20 text-slate-400 font-medium">No skill data available.</div>
                          )}
                        </motion.div>
                      )}

                      {/* ── Roadmap tab ── */}
                      {activeTab === "roadmap" && (
                        <motion.div 
                          key="roadmap"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="p-8"
                        >
                          <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="relative space-y-2 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500/20 before:via-indigo-500/20 before:to-transparent"
                          >
                            {result.roadmap?.map((step, i) => (
                              <motion.div variants={itemVariants} key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                {/* Timeline Dot */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 font-bold shadow-sm md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 transition-transform group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white">
                                  {step.step}
                                </div>
                                
                                {/* Content Card */}
                                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-indigo-100 hover:-translate-y-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide border ${PRIORITY_COLORS[step.priority]}`}>
                                      {step.priority} Priority
                                    </span>
                                    <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-500">
                                      {step.duration}
                                    </span>
                                  </div>
                                  <h4 className="text-base font-bold text-slate-800 mb-1.5">{step.title}</h4>
                                  <p className="text-sm font-medium text-slate-500 leading-relaxed">{step.description}</p>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        </motion.div>
                      )}

                      {/* ── Resources tab ── */}
                      {activeTab === "resources" && (
                        <motion.div 
                          key="resources"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="p-8"
                        >
                          <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid gap-4 sm:grid-cols-2"
                          >
                            {result.resources?.map((r, i) => (
                              <motion.a
                                variants={itemVariants}
                                key={i}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-300 hover:-translate-y-1 relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                                
                                <div>
                                  <div className="flex items-start justify-between mb-4 relative">
                                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-2xl group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                      {TYPE_ICONS[r.type] || <LinkIcon className="w-5 h-5 text-slate-400" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        {r.type}
                                      </span>
                                      {r.free && (
                                        <span className="rounded-md bg-emerald-50 border border-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                          Free
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 pr-4">
                                    {r.title}
                                  </h4>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs font-bold text-indigo-500 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                                  Access Resource <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                              </motion.a>
                            ))}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
