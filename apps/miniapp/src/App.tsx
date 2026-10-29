import React, { useState, useEffect } from "react";
import {
  PlayIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  SparklesIcon,
  StarIcon,
  ArrowRight01Icon,
  File01Icon,
  PlusSignIcon,
} from "hugeicons-react";
import type { Project, VideoFormat, EditingStyle, PackageTier } from "@alpha-cut/types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"projects" | "new_brief">("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected project for deep inspection / actions
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Forms & Modals
  const [newBrief, setNewBrief] = useState({
    title: "",
    format: "short_form" as VideoFormat,
    style: "hook_talking_head" as EditingStyle,
    tier: "professional" as PackageTier,
    footageUrl: "",
    notes: "",
  });

  const [revisionText, setRevisionText] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Initialize Telegram WebApp
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      // Configure BackButton behavior
      if (selectedProject) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
          setSelectedProject(null);
          setShowRevisionModal(false);
          setShowReviewModal(false);
          tg.BackButton.hide();
        });
      } else {
        tg.BackButton.hide();
      }
    }
  }, [selectedProject]);

  const haptic = (type: "light" | "medium" | "heavy" = "medium") => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
    }
  };

  const hapticSuccess = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const tgInitData = window.Telegram?.WebApp?.initData || "";
      const res = await fetch("/api/projects", {
        headers: {
          "x-telegram-init-data": tgInitData,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const list = data.projects || [];
        setProjects(list);

        // Check URL params for deep-linking
        const params = new URLSearchParams(window.location.search);
        const proposalId = params.get("proposal");
        const projectId = params.get("project");

        if (proposalId) {
          const match = list.find((p: Project) => p._id === proposalId);
          if (match) setSelectedProject(match);
        } else if (projectId) {
          const match = list.find((p: Project) => p._id === projectId);
          if (match) setSelectedProject(match);
        }
      }
    } catch (err) {
      console.error("[MiniApp fetch error]:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAcceptProposal = async (projectId: string) => {
    haptic("heavy");
    try {
      const res = await fetch(`/api/projects/${projectId}/accept-proposal`, {
        method: "POST",
      });
      if (res.ok) {
        hapticSuccess();
        fetchProjects();
        if (selectedProject?._id === projectId) {
          setSelectedProject((prev) => (prev ? { ...prev, stage: "in_progress" } : null));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveCut = async (projectId: string) => {
    haptic("heavy");
    try {
      const res = await fetch(`/api/projects/${projectId}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        hapticSuccess();
        setShowReviewModal(true);
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitRevision = async () => {
    if (!selectedProject || !revisionText.trim()) return;
    haptic("medium");
    try {
      const res = await fetch(`/api/projects/${selectedProject._id}/request-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: revisionText }),
      });
      if (res.ok) {
        hapticSuccess();
        setShowRevisionModal(false);
        setRevisionText("");
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedProject) return;
    haptic("medium");
    try {
      const res = await fetch(`/api/projects/${selectedProject._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, testimonial: reviewText }),
      });
      if (res.ok) {
        hapticSuccess();
        setShowReviewModal(false);
        setSelectedProject(null);
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic("heavy");
    try {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const payload = {
        ...newBrief,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        clientTelegram: tgUser?.username || "",
        price: 0,
        currency: "USD",
        revisionsAllowed: 2,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": window.Telegram?.WebApp?.initData || "",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        hapticSuccess();
        setActiveTab("projects");
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-tg-bg text-tg-text pb-12 transition-colors">
      {/* Top Telegram Header Bar */}
      <header className="px-4 py-3 bg-tg-secondaryBg border-b border-black/5 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-tg-button text-tg-buttonText flex items-center justify-center font-bold text-xs">
            A
          </div>
          <span className="font-bold text-sm tracking-tight text-tg-text">Alpha Cut Portal</span>
        </div>
        <span className="text-[11px] font-semibold text-tg-hint">
          {window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || "Client"}
        </span>
      </header>

      {/* Main Container */}
      <main className="p-4 max-w-lg mx-auto">
        {selectedProject ? (
          /* PROJECT DETAIL VIEW */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-tg-secondaryBg border border-black/5 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-tg-hint">
                  {selectedProject.format === "short_form" ? "9:16 Short-Form" : "16:9 Long-Form"} &bull; {selectedProject.tier}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-tg-button/10 text-tg-button">
                  {selectedProject.stage.replace("_", " ")}
                </span>
              </div>
              <h2 className="text-lg font-bold text-tg-text">{selectedProject.title}</h2>
              <p className="text-xs text-tg-hint">
                Style: {selectedProject.style.replace("_", " ")}
              </p>

              {/* Proposal Action Card */}
              {selectedProject.stage === "proposal_sent" && (
                <div className="p-4 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 space-y-3 mt-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span>Quoted Investment:</span>
                    <span className="text-tg-button">{selectedProject.price} {selectedProject.currency}</span>
                  </div>
                  <div className="text-[11px] text-tg-hint flex justify-between">
                    <span>Included Revisions: {selectedProject.revisionsAllowed} rounds</span>
                    <span>Due: {new Date(selectedProject.deadline).toLocaleDateString()}</span>
                  </div>
                  <button
                    className="w-full py-3 px-4 rounded-xl font-bold bg-tg-button text-tg-buttonText text-sm shadow active:opacity-90 transition-opacity"
                    onClick={() => selectedProject._id && handleAcceptProposal(selectedProject._id)}
                  >
                    Accept Proposal ⚡
                  </button>
                </div>
              )}

              {/* In Production Card */}
              {selectedProject.stage === "in_progress" && (
                <div className="p-3.5 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-tg-text">Editor Cutting Footage</p>
                    <p className="text-tg-hint mt-0.5">
                      Editor: {selectedProject.assignedEditor.toUpperCase()}
                    </p>
                  </div>
                  <Clock01Icon className="h-5 w-5 text-tg-button" />
                </div>
              )}

              {/* Cut Review Card */}
              {selectedProject.stage === "in_review" && (
                <div className="p-4 rounded-xl bg-tg-button/10 border border-tg-button/20 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-tg-button">
                    <CheckmarkCircle02Icon className="h-4 w-4" />
                    <span>Cut Delivered for Review!</span>
                  </div>
                  {selectedProject.deliverableUrl && (
                    <a
                      href={selectedProject.deliverableUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center py-2.5 px-4 rounded-xl bg-tg-button text-tg-buttonText font-bold text-xs"
                      onClick={() => haptic("light")}
                    >
                      Watch Cut in Frame.io / Drive
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs active:opacity-90"
                      onClick={() => selectedProject._id && handleApproveCut(selectedProject._id)}
                    >
                      Approve Cut
                    </button>
                    <button
                      className="py-2.5 px-3 rounded-xl bg-tg-secondaryBg text-tg-text font-bold text-xs active:opacity-90 border border-black/10 dark:border-white/10"
                      onClick={() => {
                        haptic("light");
                        setShowRevisionModal(true);
                      }}
                    >
                      Request Edits ({selectedProject.revisionsUsed || 0}/{selectedProject.revisionsAllowed})
                    </button>
                  </div>
                </div>
              )}

              {/* Revision Progress Card */}
              {selectedProject.stage === "revision_requested" && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <p className="font-bold text-amber-600 dark:text-amber-400">
                    Revision Round {selectedProject.revisionsUsed} of {selectedProject.revisionsAllowed} In Progress
                  </p>
                  <p className="text-tg-hint mt-1 italic">"{selectedProject.revisionFeedback}"</p>
                </div>
              )}

              {/* Completed Card */}
              {selectedProject.stage === "approved" && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">Final Cut Approved</p>
                    <p className="text-tg-hint">Delivered & verified.</p>
                  </div>
                  <CheckmarkCircle02Icon className="h-6 w-6 text-emerald-500" />
                </div>
              )}
            </div>

            <button
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-tg-hint bg-tg-secondaryBg border border-black/5 dark:border-white/5"
              onClick={() => setSelectedProject(null)}
            >
              &larr; Back to Active Edits
            </button>
          </div>
        ) : activeTab === "new_brief" ? (
          /* SUBMIT NEW BRIEF TAB */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-tg-secondaryBg border border-black/5 dark:border-white/5 space-y-4">
              <h2 className="text-base font-bold text-tg-text">Submit a Video Brief</h2>
              <form onSubmit={handleCreateBrief} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-tg-text block mb-1">Project Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 3x TikTok Listicle Batch"
                    className="w-full h-10 px-3 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 text-tg-text text-xs focus:outline-none focus:ring-1 focus:ring-tg-button"
                    value={newBrief.title}
                    onChange={(e) => setNewBrief({ ...newBrief, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-tg-text block mb-1">Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                        newBrief.format === "short_form"
                          ? "border-tg-button bg-tg-button/10 text-tg-button"
                          : "border-black/10 dark:border-white/10 bg-tg-bg text-tg-text"
                      }`}
                      onClick={() => {
                        haptic("light");
                        setNewBrief({ ...newBrief, format: "short_form" });
                      }}
                    >
                      9:16 Short-Form
                    </button>
                    <button
                      type="button"
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                        newBrief.format === "long_form"
                          ? "border-tg-button bg-tg-button/10 text-tg-button"
                          : "border-black/10 dark:border-white/10 bg-tg-bg text-tg-text"
                      }`}
                      onClick={() => {
                        haptic("light");
                        setNewBrief({ ...newBrief, format: "long_form" });
                      }}
                    >
                      16:9 Long-Form
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-tg-text block mb-1">Raw Footage Link</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    className="w-full h-10 px-3 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 text-tg-text text-xs focus:outline-none focus:ring-1 focus:ring-tg-button"
                    value={newBrief.footageUrl}
                    onChange={(e) => setNewBrief({ ...newBrief, footageUrl: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-tg-text block mb-1">Creative Brief Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Pacing notes, specific hooks, references..."
                    className="w-full p-3 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 text-tg-text text-xs focus:outline-none focus:ring-1 focus:ring-tg-button"
                    value={newBrief.notes}
                    onChange={(e) => setNewBrief({ ...newBrief, notes: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-bold bg-tg-button text-tg-buttonText text-xs shadow active:opacity-90 transition-opacity mt-2"
                >
                  Submit Brief to Amir & Aymen
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ACTIVE PROJECTS LIST */
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-tg-text">Active Video Edits</h2>
              <button
                className="text-xs font-semibold text-tg-button flex items-center gap-1"
                onClick={() => {
                  haptic("light");
                  setActiveTab("new_brief");
                }}
              >
                <PlusSignIcon className="h-3.5 w-3.5" />
                <span>New Brief</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-tg-hint">Loading cuts...</div>
            ) : projects.length === 0 ? (
              <div className="p-8 text-center bg-tg-secondaryBg rounded-2xl border border-black/5 dark:border-white/5 space-y-3">
                <SparklesIcon className="h-8 w-8 text-tg-button mx-auto" />
                <h3 className="text-sm font-bold text-tg-text">No active cuts</h3>
                <p className="text-xs text-tg-hint max-w-xs mx-auto">
                  Submit a brief to get an instant scope proposal from Amir & Aymen.
                </p>
                <button
                  className="py-2.5 px-4 rounded-xl font-bold bg-tg-button text-tg-buttonText text-xs"
                  onClick={() => {
                    haptic("light");
                    setActiveTab("new_brief");
                  }}
                >
                  Start a Project
                </button>
              </div>
            ) : (
              projects.map((proj) => (
                <div
                  key={proj._id}
                  className="p-3.5 rounded-xl bg-tg-secondaryBg border border-black/5 dark:border-white/5 active:scale-[0.99] transition-transform cursor-pointer"
                  onClick={() => {
                    haptic("light");
                    setSelectedProject(proj);
                  }}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-tg-hint">
                      {proj.format === "short_form" ? "9:16 Short" : "16:9 Long"}
                    </span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-tg-button/10 text-tg-button">
                      {proj.stage.replace("_", " ")}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-tg-text">{proj.title}</h4>
                  <p className="text-[11px] text-tg-hint mt-0.5">
                    {proj.stage === "proposal_sent" && `Proposal: ${proj.price} ${proj.currency} ready`}
                    {proj.stage === "in_progress" && `Cutting: ${proj.assignedEditor.toUpperCase()}`}
                    {proj.stage === "in_review" && "Cut delivered — tap to review"}
                    {proj.stage === "approved" && "Final Cut Approved"}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Revision Modal */}
        {showRevisionModal && selectedProject && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-tg-bg rounded-2xl p-5 w-full max-w-sm space-y-3 border border-black/10 dark:border-white/10">
              <h3 className="font-bold text-sm text-tg-text">Request Revisions</h3>
              <p className="text-xs text-tg-hint">
                Round {(selectedProject.revisionsUsed || 0) + 1} of {selectedProject.revisionsAllowed} included revisions.
              </p>
              <textarea
                rows={3}
                placeholder="Include timestamps (e.g. 0:15 text edit, 0:45 punch zoom)..."
                className="w-full p-3 rounded-xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 text-tg-text text-xs focus:outline-none"
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  className="py-2.5 rounded-xl text-xs font-semibold bg-tg-secondaryBg text-tg-text"
                  onClick={() => setShowRevisionModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="py-2.5 rounded-xl text-xs font-bold bg-tg-button text-tg-buttonText"
                  onClick={handleSubmitRevision}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-tg-bg rounded-2xl p-5 w-full max-w-sm space-y-3 border border-black/10 dark:border-white/10 text-center">
              <h3 className="font-bold text-sm text-tg-text">Rate Your Experience</h3>
              <p className="text-xs text-tg-hint">How was collaborating directly with Amir and Aymen?</p>
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setReviewRating(star);
                    }}
                  >
                    <StarIcon
                      className={`h-7 w-7 ${
                        star <= reviewRating ? "text-amber-500 fill-amber-500" : "text-neutral-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                placeholder="Write a brief testimonial..."
                className="w-full p-3 rounded-xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 text-tg-text text-xs focus:outline-none text-left"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
              <button
                className="w-full py-3 rounded-xl font-bold bg-tg-button text-tg-buttonText text-xs"
                onClick={handleSubmitReview}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
