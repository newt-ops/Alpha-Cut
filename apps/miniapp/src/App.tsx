import React, { useState, useEffect, useCallback } from "react";
import {
  PlayIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  SparklesIcon,
  StarIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  File01Icon,
  PlusSignIcon,
  UserIcon,
  Layers01Icon,
  Cancel01Icon,
} from "hugeicons-react";
import {
  EDITING_STYLES,
  type Project,
  type Proposal,
  type VideoFormat,
  type EditingStyle,
  type PackageTier,
} from "@alpha-cut/types";

type MiniAppTab = "projects" | "new_brief" | "styles" | "team";

export default function App() {
  const [activeTab, setActiveTab] = useState<MiniAppTab>("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected project or proposal for deep inspection / actions
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  // Proposal Revision
  const [showProposalRevisionModal, setShowProposalRevisionModal] = useState(false);
  const [proposalRevisionNotes, setProposalRevisionNotes] = useState("");

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
  const [actionInProgress, setActionInProgress] = useState(false);

  // Helper for Telegram Haptic Feedback
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

  const hapticError = () => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    }
  };

  // Authenticated API request helper carrying Telegram initData
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const initData = window.Telegram?.WebApp?.initData || "";
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
      "x-telegram-init-data": initData,
    };
    return fetch(url, { ...options, headers });
  }, []);

  // Fetch Projects and Proposals belonging to this Telegram client
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [projRes, propRes] = await Promise.all([
        apiFetch("/api/projects"),
        apiFetch("/api/proposals"),
      ]);

      let projList: Project[] = [];
      let propList: Proposal[] = [];

      if (projRes.ok) {
        const data = await projRes.json();
        projList = data.projects || [];
        setProjects(projList);
      }

      if (propRes.ok) {
        const data = await propRes.json();
        propList = data.proposals || [];
        setProposals(propList);
      }

      // Check URL params for deep-linking
      const params = new URLSearchParams(window.location.search);
      const proposalId = params.get("proposal");
      const projectId = params.get("project");
      const tabParam = params.get("tab") as MiniAppTab | null;

      if (proposalId) {
        const matchProp = propList.find((p) => p._id === proposalId);
        if (matchProp) {
          setSelectedProposal(matchProp);
          if (matchProp.status === "sent" && matchProp._id) {
            apiFetch(`/api/proposals/${matchProp._id}`).catch(() => {});
          }
        }
      } else if (projectId) {
        const matchProj = projList.find((p) => p._id === projectId);
        if (matchProj) setSelectedProject(matchProj);
      }

      if (tabParam && ["projects", "new_brief", "styles", "team"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    } catch (err) {
      console.error("[MiniApp fetch error]:", err);
      setErrorMsg("Network error contacting Alpha Cut servers.");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  // Telegram WebApp Initialization and BackButton binding
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      // Configure BackButton
      if (selectedProject || selectedProposal || showRevisionModal || showReviewModal || showProposalRevisionModal) {
        tg.BackButton.show();
        const handleBack = () => {
          if (showProposalRevisionModal) {
            setShowProposalRevisionModal(false);
          } else if (selectedProposal) {
            setSelectedProposal(null);
          } else if (showRevisionModal) {
            setShowRevisionModal(false);
          } else if (showReviewModal) {
            setShowReviewModal(false);
          } else {
            setSelectedProject(null);
          }
        };
        tg.BackButton.onClick(handleBack);
        return () => {
          tg.BackButton.offClick(handleBack);
        };
      } else {
        tg.BackButton.hide();
      }
    }
  }, [selectedProject, selectedProposal, showRevisionModal, showReviewModal, showProposalRevisionModal]);

  // Initial load
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Accept Formal Proposal (Choice A Project Activation)
  const handleAcceptFormalProposal = async (proposalId: string) => {
    haptic("heavy");
    setActionInProgress(true);
    try {
      const res = await apiFetch(`/api/proposals/${proposalId}/accept`, {
        method: "POST",
      });
      if (res.ok) {
        hapticSuccess();
        await fetchProjects();
        setSelectedProposal(null);
        setActiveTab("projects");
      } else {
        hapticError();
      }
    } catch (err) {
      console.error(err);
      hapticError();
    } finally {
      setActionInProgress(false);
    }
  };

  // Submit Formal Proposal Revision Request
  const handleRequestFormalProposalRevision = async () => {
    if (!selectedProposal || !proposalRevisionNotes.trim()) return;
    haptic("medium");
    setActionInProgress(true);
    try {
      const res = await apiFetch(`/api/proposals/${selectedProposal._id}/request-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: proposalRevisionNotes }),
      });
      if (res.ok) {
        hapticSuccess();
        setShowProposalRevisionModal(false);
        setProposalRevisionNotes("");
        await fetchProjects();
        setSelectedProposal(null);
      } else {
        hapticError();
      }
    } catch (err) {
      console.error(err);
      hapticError();
    } finally {
      setActionInProgress(false);
    }
  };

  // Accept Scope Proposal
  const handleAcceptProposal = async (projectId: string) => {
    haptic("heavy");
    setActionInProgress(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/accept-proposal`, {
        method: "POST",
      });
      if (res.ok) {
        hapticSuccess();
        await fetchProjects();
        if (selectedProject?._id === projectId) {
          setSelectedProject((prev) => (prev ? { ...prev, stage: "in_progress" } : null));
        }
      } else {
        hapticError();
      }
    } catch (err) {
      console.error(err);
      hapticError();
    } finally {
      setActionInProgress(false);
    }
  };

  // Approve Final Cut
  const handleApproveCut = async (projectId: string) => {
    haptic("heavy");
    setActionInProgress(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        hapticSuccess();
        setShowReviewModal(true);
        await fetchProjects();
      } else {
        hapticError();
      }
    } catch (err) {
      console.error(err);
      hapticError();
    } finally {
      setActionInProgress(false);
    }
  };

  // Submit Revision Notes
  const handleSubmitRevision = async () => {
    if (!selectedProject || !revisionText.trim()) return;
    haptic("medium");
    setActionInProgress(true);
    try {
      const res = await apiFetch(`/api/projects/${selectedProject._id}/request-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: revisionText }),
      });
      if (res.ok) {
        hapticSuccess();
        setShowRevisionModal(false);
        setRevisionText("");
        await fetchProjects();
        if (selectedProject?._id) {
          setSelectedProject((prev) =>
            prev ? { ...prev, stage: "revision_requested", revisionFeedback: revisionText } : null
          );
        }
      } else {
        hapticError();
      }
    } catch (err) {
      console.error(err);
      hapticError();
    } finally {
      setActionInProgress(false);
    }
  };

  // Submit Review Testimonial
  const handleSubmitReview = async () => {
    if (!selectedProject) return;
    haptic("medium");
    setActionInProgress(true);
    try {
      const res = await apiFetch(`/api/projects/${selectedProject._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, testimonial: reviewText }),
      });
      if (res.ok) {
        hapticSuccess();
        setShowReviewModal(false);
        setSelectedProject(null);
        await fetchProjects();
      } else {
        hapticError();
      }
    } catch (err) {
      console.error(err);
      hapticError();
    } finally {
      setActionInProgress(false);
    }
  };

  // Create New Video Brief
  const handleCreateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic("heavy");
    setActionInProgress(true);
    try {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const payload = {
        ...newBrief,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        clientTelegram: tgUser?.username || (tgUser?.id ? String(tgUser.id) : ""),
        price: 0,
        currency: "USD",
        revisionsAllowed: 2,
      };

      const res = await apiFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        hapticSuccess();
        setNewBrief({
          title: "",
          format: "short_form",
          style: "hook_talking_head",
          tier: "professional",
          footageUrl: "",
          notes: "",
        });
        setActiveTab("projects");
        await fetchProjects();
      } else {
        hapticError();
      }
    } catch (err) {
      console.error(err);
      hapticError();
    } finally {
      setActionInProgress(false);
    }
  };

  // Open link in Telegram-friendly manner
  const openExternal = (url: string) => {
    haptic("light");
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, "_blank");
    }
  };

  // Select style from catalog and transition into brief creation
  const handleSelectStyleForBrief = (styleKey: EditingStyle) => {
    haptic("light");
    setNewBrief((prev) => ({ ...prev, style: styleKey }));
    setActiveTab("new_brief");
  };

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  return (
    <div className="min-h-screen bg-tg-bg text-tg-text pb-20 select-none font-sans transition-colors">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 px-4 py-3 bg-tg-secondaryBg border-b border-black/10 dark:border-white/10 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-tg-button text-tg-buttonText flex items-center justify-center font-bold text-xs tracking-wider">
            AC
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-tg-text leading-tight">
              Alpha Cut
            </h1>
            <p className="text-[10px] text-tg-hint uppercase tracking-wider font-semibold">
              Client Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-tg-bg border border-black/5 dark:border-white/5 text-[11px] font-medium text-tg-hint">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{tgUser?.first_name || "Client"}</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-4 max-w-lg mx-auto">
        {/* Error notification banner */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* 1. PROPOSAL DETAIL VIEW */}
        {selectedProposal ? (
          <div className="space-y-4">
            {(() => {
              const v =
                selectedProposal.versions.find((ver) => ver.version === selectedProposal.currentVersion) ||
                selectedProposal.versions[0];
              const isActionable =
                selectedProposal.status === "sent" || selectedProposal.status === "viewed";

              return (
                <div className="p-4 rounded-2xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-tg-bg text-tg-button">
                        {selectedProposal.proposalNumber}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                        v{selectedProposal.currentVersion}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-tg-button/10 text-tg-button">
                      {selectedProposal.status.replace("_", " ")}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-tg-text leading-snug">
                      {v?.title || selectedProposal.proposalNumber}
                    </h2>
                    <p className="text-xs text-tg-hint mt-0.5">
                      {v?.format === "short_form"
                        ? "Short-Form (Reels / TikTok)"
                        : "Long-Form (YouTube / Course)"}{" "}
                      &bull; {v?.style ? (EDITING_STYLES[v.style]?.label || v.style) : ""}
                    </p>
                  </div>

                  {/* Pricing Card */}
                  <div className="p-4 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-tg-hint uppercase tracking-wider">
                        Agreed Investment
                      </span>
                      <span className="text-xl font-black text-tg-text">
                        {v?.price.toLocaleString()} {v?.currency}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-black/5 dark:border-white/5 pt-2 text-tg-hint">
                      <div>
                        <span className="block text-[10px]">Delivery Target</span>
                        <span className="font-bold text-tg-text">
                          {v?.deadline ? new Date(v.deadline).toLocaleDateString() : "TBD"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px]">Revisions</span>
                        <span className="font-bold text-tg-text">{v?.revisionsAllowed} rounds</span>
                      </div>
                    </div>
                  </div>

                  {/* Scope Notes */}
                  {v?.notes && (
                    <div className="p-3 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 text-xs space-y-1">
                      <span className="font-bold text-tg-text block text-[11px]">
                        Scope Inclusions:
                      </span>
                      <p className="text-tg-hint leading-relaxed">{v.notes}</p>
                    </div>
                  )}

                  {/* Revision feedback alert */}
                  {selectedProposal.status === "revision_requested" && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                      <span className="font-bold text-amber-700 dark:text-amber-400 block">
                        Revision Requested:
                      </span>
                      <p className="text-tg-hint italic">"{selectedProposal.revisionFeedback}"</p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        Amir & Aymen are preparing updated terms (v{selectedProposal.currentVersion + 1}).
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {isActionable && (
                    <div className="space-y-2 pt-2">
                      <button
                        disabled={actionInProgress}
                        className="w-full py-3 px-4 rounded-xl font-bold bg-tg-button text-tg-buttonText text-xs shadow-sm active:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-50"
                        onClick={() =>
                          selectedProposal._id && handleAcceptFormalProposal(selectedProposal._id)
                        }
                      >
                        <CheckmarkCircle02Icon className="h-4 w-4" />
                        <span>Accept Proposal & Start Production</span>
                      </button>

                      <button
                        disabled={actionInProgress}
                        className="w-full py-2.5 px-4 rounded-xl font-bold bg-tg-bg text-tg-hint border border-black/10 dark:border-white/10 text-xs active:opacity-90 transition-opacity"
                        onClick={() => {
                          haptic("light");
                          setShowProposalRevisionModal(true);
                        }}
                      >
                        Request Changes / Negotiate
                      </button>
                    </div>
                  )}

                  {selectedProposal.status === "accepted" && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span>Accepted & In Production</span>
                      <CheckmarkCircle02Icon className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })()}

            <button
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-tg-hint bg-tg-secondaryBg border border-black/10 dark:border-white/10 flex items-center justify-center gap-1.5"
              onClick={() => {
                haptic("light");
                setSelectedProposal(null);
              }}
            >
              <ArrowLeft01Icon className="h-3.5 w-3.5" />
              <span>Back to Pipeline</span>
            </button>
          </div>
        ) : selectedProject ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-tg-hint">
                  {selectedProject.format === "short_form" ? "9:16 Short-Form" : "16:9 Long-Form"} &bull; {selectedProject.tier}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-tg-button/10 text-tg-button">
                  {selectedProject.stage.replace("_", " ")}
                </span>
              </div>

              <div>
                <h2 className="text-base font-bold text-tg-text leading-snug">
                  {selectedProject.title}
                </h2>
                <p className="text-xs text-tg-hint mt-0.5">
                  Style: {EDITING_STYLES[selectedProject.style]?.label || selectedProject.style.replace("_", " ")}
                </p>
              </div>

              {/* Stage: Inquiry Pending */}
              {selectedProject.stage === "inquiry_pending" && (
                <div className="p-3.5 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-tg-text">
                    <Clock01Icon className="h-4 w-4 text-tg-button" />
                    <span>Inquiry Under Creative Review</span>
                  </div>
                  <p className="text-tg-hint">
                    Amir & Aymen are reviewing your footage link and creative notes. You will receive an exact scope quote shortly.
                  </p>
                </div>
              )}

              {/* Stage: Proposal Sent */}
              {selectedProject.stage === "proposal_sent" && (
                <div className="p-4 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span>Quoted Investment:</span>
                    <span className="text-tg-button text-base">
                      {selectedProject.price} {selectedProject.currency}
                    </span>
                  </div>
                  <div className="text-[11px] text-tg-hint flex justify-between border-t border-black/5 dark:border-white/5 pt-2">
                    <span>Revisions: {selectedProject.revisionsAllowed} rounds</span>
                    <span>Due: {new Date(selectedProject.deadline).toLocaleDateString()}</span>
                  </div>
                  <button
                    disabled={actionInProgress}
                    className="w-full py-3 px-4 rounded-xl font-bold bg-tg-button text-tg-buttonText text-xs shadow-sm active:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-50"
                    onClick={() => selectedProject._id && handleAcceptProposal(selectedProject._id)}
                  >
                    <CheckmarkCircle02Icon className="h-4 w-4" />
                    <span>Accept Proposal</span>
                  </button>
                </div>
              )}

              {/* Stage: In Production */}
              {selectedProject.stage === "in_progress" && (
                <div className="p-3.5 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-tg-text">Footage on Timeline</p>
                    <p className="text-tg-hint mt-0.5">
                      Assigned Lead: {selectedProject.assignedEditor.toUpperCase()}
                    </p>
                    <p className="text-[10px] text-tg-hint mt-1">
                      Target Cut: {new Date(selectedProject.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <Clock01Icon className="h-6 w-6 text-tg-button" />
                </div>
              )}

              {/* Stage: Cut Delivered for Review */}
              {selectedProject.stage === "in_review" && (
                <div className="p-4 rounded-xl bg-tg-button/10 border border-tg-button/20 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-tg-button">
                    <CheckmarkCircle02Icon className="h-4 w-4" />
                    <span>Initial Cut Delivered for Review</span>
                  </div>

                  {selectedProject.deliverableUrl && (
                    <button
                      className="w-full py-2.5 px-4 rounded-xl bg-tg-button text-tg-buttonText font-bold text-xs active:opacity-90 transition-opacity"
                      onClick={() => openExternal(selectedProject.deliverableUrl!)}
                    >
                      Watch Cut in Frame.io / Drive
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      disabled={actionInProgress}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs active:opacity-90 disabled:opacity-50"
                      onClick={() => selectedProject._id && handleApproveCut(selectedProject._id)}
                    >
                      Approve Cut
                    </button>
                    <button
                      disabled={actionInProgress}
                      className="py-2.5 px-3 rounded-xl bg-tg-secondaryBg text-tg-text font-bold text-xs active:opacity-90 border border-black/10 dark:border-white/10 disabled:opacity-50"
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

              {/* Stage: Revision Requested */}
              {selectedProject.stage === "revision_requested" && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
                  <p className="font-bold text-amber-600 dark:text-amber-400">
                    Revision Round {selectedProject.revisionsUsed} of {selectedProject.revisionsAllowed} In Progress
                  </p>
                  {selectedProject.revisionFeedback && (
                    <p className="text-tg-hint italic">
                      "{selectedProject.revisionFeedback}"
                    </p>
                  )}
                </div>
              )}

              {/* Stage: Approved */}
              {selectedProject.stage === "approved" && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      Final Cut Approved
                    </p>
                    <p className="text-tg-hint">Master render delivered & archived.</p>
                  </div>
                  <CheckmarkCircle02Icon className="h-6 w-6 text-emerald-500" />
                </div>
              )}

              {/* Raw Footage Reference */}
              {selectedProject.footageUrl && (
                <div className="pt-2 border-t border-black/5 dark:border-white/5 text-[11px] flex items-center justify-between text-tg-hint">
                  <span className="truncate max-w-[200px]">Footage: {selectedProject.footageUrl}</span>
                  <button
                    className="text-tg-button font-semibold"
                    onClick={() => openExternal(selectedProject.footageUrl!)}
                  >
                    Open Link
                  </button>
                </div>
              )}
            </div>

            <button
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-tg-hint bg-tg-secondaryBg border border-black/10 dark:border-white/10 flex items-center justify-center gap-1.5"
              onClick={() => {
                haptic("light");
                setSelectedProject(null);
              }}
            >
              <ArrowLeft01Icon className="h-3.5 w-3.5" />
              <span>Back to Active Edits</span>
            </button>
          </div>
        ) : activeTab === "projects" ? (
          /* 2. ACTIVE PROJECTS TAB */
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-tg-text">Active Pipeline</h2>
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
              <div className="p-12 text-center text-xs text-tg-hint space-y-2">
                <Clock01Icon className="h-6 w-6 text-tg-button animate-spin mx-auto" />
                <p>Loading projects & proposals...</p>
              </div>
            ) : (
              <>
                {/* Actionable Proposals */}
                {proposals
                  .filter((p) => p.status === "sent" || p.status === "viewed" || p.status === "revision_requested")
                  .map((p) => {
                    const v = p.versions.find((ver) => ver.version === p.currentVersion) || p.versions[0];
                    return (
                      <div
                        key={p._id}
                        className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 active:scale-[0.99] transition-transform cursor-pointer space-y-1.5"
                        onClick={() => {
                          haptic("light");
                          setSelectedProposal(p);
                          if (p.status === "sent" && p._id) {
                            apiFetch(`/api/proposals/${p._id}`).catch(() => {});
                          }
                        }}
                      >
                        <div className="flex justify-between items-center text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          <span>PROPOSAL READY FOR REVIEW &bull; v{p.currentVersion}</span>
                          <span className="uppercase px-1.5 py-0.5 rounded bg-amber-500/20">
                            {p.status.replace("_", " ")}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-tg-text">{v?.title || p.proposalNumber}</h4>
                        <div className="flex justify-between items-center text-[11px] text-tg-hint pt-1 border-t border-amber-500/20">
                          <span className="font-semibold text-tg-text">
                            {v?.price} {v?.currency}
                          </span>
                          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                            Review & Accept <ArrowRight01Icon className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {projects.length === 0 && proposals.length === 0 ? (
                  <div className="p-8 text-center bg-tg-secondaryBg rounded-2xl border border-black/10 dark:border-white/10 space-y-3">
                    <SparklesIcon className="h-8 w-8 text-tg-button mx-auto" />
                    <h3 className="text-sm font-bold text-tg-text">No active cuts in queue</h3>
                    <p className="text-xs text-tg-hint max-w-xs mx-auto">
                      Submit raw footage with your creative brief to receive a customized scope quote within hours.
                    </p>
                    <button
                      className="py-2.5 px-4 rounded-xl font-bold bg-tg-button text-tg-buttonText text-xs shadow-sm active:opacity-90"
                      onClick={() => {
                        haptic("light");
                        setActiveTab("new_brief");
                      }}
                    >
                      Start First Project
                    </button>
                  </div>
                ) : (
                  projects.map((proj) => (
                <div
                  key={proj._id}
                  className="p-3.5 rounded-xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 active:scale-[0.99] transition-transform cursor-pointer space-y-2"
                  onClick={() => {
                    haptic("light");
                    setSelectedProject(proj);
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-tg-hint">
                      {proj.format === "short_form" ? "9:16 Short" : "16:9 Long"} &bull; {proj.tier}
                    </span>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-tg-button/10 text-tg-button">
                      {proj.stage.replace("_", " ")}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-tg-text leading-snug">
                    {proj.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-tg-hint pt-1 border-t border-black/5 dark:border-white/5">
                    <span>
                      {proj.stage === "proposal_sent" && `Quote: ${proj.price} ${proj.currency}`}
                      {proj.stage === "in_progress" && `Lead: ${proj.assignedEditor.toUpperCase()}`}
                      {proj.stage === "in_review" && "Cut Ready for Review"}
                      {proj.stage === "revision_requested" && `Round ${proj.revisionsUsed} of ${proj.revisionsAllowed}`}
                      {proj.stage === "approved" && "Final Approved"}
                      {proj.stage === "inquiry_pending" && "Brief in Review"}
                    </span>
                    <ArrowRight01Icon className="h-3.5 w-3.5 text-tg-hint" />
                  </div>
                </div>
              ))
            )}
            </>
            )}
          </div>
        ) : activeTab === "new_brief" ? (
          /* 3. SUBMIT BRIEF TAB */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 space-y-4">
              <div>
                <h2 className="text-base font-bold text-tg-text">Submit Creative Brief</h2>
                <p className="text-xs text-tg-hint mt-0.5">
                  Direct submission to Amir & Aymen. No middlemen, no account password required.
                </p>
              </div>

              <form onSubmit={handleCreateBrief} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-tg-text block mb-1">Project Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 3x TikTok Hook Batch or SaaS Promo"
                    className="w-full h-10 px-3 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 text-tg-text text-xs focus:outline-none focus:ring-1 focus:ring-tg-button"
                    value={newBrief.title}
                    onChange={(e) => setNewBrief({ ...newBrief, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-tg-text block mb-1">Target Format</label>
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
                  <label className="font-semibold text-tg-text block mb-1">Signature Style</label>
                  <select
                    className="w-full h-10 px-3 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 text-tg-text text-xs focus:outline-none focus:ring-1 focus:ring-tg-button"
                    value={newBrief.style}
                    onChange={(e) => setNewBrief({ ...newBrief, style: e.target.value as EditingStyle })}
                  >
                    {Object.entries(EDITING_STYLES).map(([k, meta]) => (
                      <option key={k} value={k}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-tg-text block mb-1">Package Tier</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["basic", "professional", "premium"] as PackageTier[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`py-2 px-2 rounded-xl border text-xs font-semibold capitalize ${
                          newBrief.tier === t
                            ? "border-tg-button bg-tg-button/10 text-tg-button"
                            : "border-black/10 dark:border-white/10 bg-tg-bg text-tg-text"
                        }`}
                        onClick={() => {
                          haptic("light");
                          setNewBrief({ ...newBrief, tier: t });
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-tg-text block mb-1">Raw Footage Link</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... or Dropbox"
                    className="w-full h-10 px-3 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 text-tg-text text-xs focus:outline-none focus:ring-1 focus:ring-tg-button"
                    value={newBrief.footageUrl}
                    onChange={(e) => setNewBrief({ ...newBrief, footageUrl: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-tg-text block mb-1">Creative Notes & References</label>
                  <textarea
                    rows={3}
                    placeholder="Pacing notes, specific hooks, reference video links..."
                    className="w-full p-3 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 text-tg-text text-xs focus:outline-none focus:ring-1 focus:ring-tg-button"
                    value={newBrief.notes}
                    onChange={(e) => setNewBrief({ ...newBrief, notes: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="w-full py-3 px-4 rounded-xl font-bold bg-tg-button text-tg-buttonText text-xs shadow-sm active:opacity-90 transition-opacity mt-2 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckmarkCircle02Icon className="h-4 w-4" />
                  <span>Submit Brief to Amir & Aymen</span>
                </button>
              </form>
            </div>
          </div>
        ) : activeTab === "styles" ? (
          /* 4. STYLES & PACKAGES CATALOG TAB */
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-tg-text">Signature Editing Styles</h2>
              <p className="text-xs text-tg-hint">
                Specialized aesthetics crafted to maximize audience retention.
              </p>
            </div>

            <div className="space-y-3">
              {Object.entries(EDITING_STYLES).map(([k, item]) => (
                <div
                  key={k}
                  className="p-3.5 rounded-xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-xs font-bold text-tg-text">{item.label}</h3>
                    <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-tg-hint">
                      {item.formats.join(" / ").replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-tg-hint leading-relaxed">
                    {item.tagline}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5">
                    <span className="text-[10px] text-tg-hint italic">
                      Best for: {item.bestFor}
                    </span>
                    <button
                      className="text-[11px] font-bold text-tg-button flex items-center gap-1"
                      onClick={() => handleSelectStyleForBrief(k as EditingStyle)}
                    >
                      <span>Use Style</span>
                      <ArrowRight01Icon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Packages Summary */}
            <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-tg-text">Package Tiers & SLAs</h3>
              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Basic Tier</span>
                    <span className="text-tg-button">$250 - $450</span>
                  </div>
                  <p className="text-[11px] text-tg-hint">
                    Fast pacing, essential sound design, clean subtitles, 2 revision rounds.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-tg-secondaryBg border border-tg-button/30 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Professional Tier (Popular)</span>
                    <span className="text-tg-button">$450 - $850</span>
                  </div>
                  <p className="text-[11px] text-tg-hint">
                    Motion graphics, kinetic typography, bespoke SFX, 48h turnaround, 3 revision rounds.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Premium Tier</span>
                    <span className="text-tg-button">$850 - $1,500+</span>
                  </div>
                  <p className="text-[11px] text-tg-hint">
                    Film-grade color grading, bespoke 3D/2D animation, dedicated lead editor, priority delivery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 5. TEAM & DIRECT CONTACT TAB */
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-tg-text">The Editing Team</h2>
              <p className="text-xs text-tg-hint">
                Direct access to the founders and lead editors.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center font-bold text-sm">
                    A
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-tg-text">Amir</h3>
                    <p className="text-[11px] text-tg-hint">
                      Lead Video Editor & Creative Director
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-tg-hint">
                  Specialized in Premiere Pro, DaVinci Resolve color pipelines, and high-retention pacing.
                </p>
                <button
                  className="w-full py-2 rounded-xl bg-tg-button text-tg-buttonText font-bold text-xs active:opacity-90 transition-opacity"
                  onClick={() => openExternal("https://t.me/Amir_Alpha_Cut")}
                >
                  Direct Message Amir on Telegram
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center font-bold text-sm">
                    AY
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-tg-text">Aymen</h3>
                    <p className="text-[11px] text-tg-hint">
                      Full-Stack Engineer & Motion Editor
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-tg-hint">
                  Specialized in After Effects, kinetic motion graphics, and SaaS product demos.
                </p>
                <button
                  className="w-full py-2 rounded-xl bg-tg-bg border border-black/10 dark:border-white/10 text-tg-text font-bold text-xs active:opacity-90"
                  onClick={() => openExternal("https://alpha-cut.com")}
                >
                  Visit Official Agency Website
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 space-y-2 text-xs">
              <h4 className="font-bold text-tg-text">Agency Contacts</h4>
              <p className="text-[11px] text-tg-hint">
                Email: alphacutagency@gmail.com
              </p>
              <p className="text-[11px] text-tg-hint">
                Turnaround SLA: 24h - 48h Rapid Cuts
              </p>
              <p className="text-[11px] text-tg-hint">
                Guarantee: 100% money-back if initial cut does not align with brief
              </p>
            </div>
          </div>
        )}

        {/* Revision Modal */}
        {showRevisionModal && selectedProject && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-tg-bg rounded-2xl p-5 w-full max-w-sm space-y-3.5 border border-black/10 dark:border-white/10">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-tg-text">Request Revisions</h3>
                <button
                  onClick={() => setShowRevisionModal(false)}
                  className="text-tg-hint hover:text-tg-text"
                >
                  <Cancel01Icon className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-tg-hint">
                Round {(selectedProject.revisionsUsed || 0) + 1} of {selectedProject.revisionsAllowed} included rounds.
              </p>
              <textarea
                rows={4}
                placeholder="Include exact timestamps (e.g. 0:12 fix kinetic title, 0:35 replace b-roll clip)..."
                className="w-full p-3 rounded-xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 text-tg-text text-xs focus:outline-none"
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  className="py-2.5 rounded-xl text-xs font-semibold bg-tg-secondaryBg text-tg-text"
                  onClick={() => setShowRevisionModal(false)}
                >
                  Cancel
                </button>
                <button
                  disabled={actionInProgress || !revisionText.trim()}
                  className="py-2.5 rounded-xl text-xs font-bold bg-tg-button text-tg-buttonText disabled:opacity-50"
                  onClick={handleSubmitRevision}
                >
                  Submit Notes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5-Star Testimonial Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-tg-bg rounded-2xl p-5 w-full max-w-sm space-y-3 border border-black/10 dark:border-white/10 text-center">
              <h3 className="font-bold text-sm text-tg-text">Rate the Final Cut</h3>
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
                placeholder="Share a short testimonial for our public showcase..."
                className="w-full p-3 rounded-xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 text-tg-text text-xs focus:outline-none text-left"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
              <button
                disabled={actionInProgress}
                className="w-full py-3 rounded-xl font-bold bg-tg-button text-tg-buttonText text-xs disabled:opacity-50"
                onClick={handleSubmitReview}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        )}

        {/* Proposal Revision Request Modal */}
        {showProposalRevisionModal && selectedProposal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-tg-bg rounded-2xl p-5 w-full max-w-sm space-y-3.5 border border-black/10 dark:border-white/10">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-tg-text">Request Changes</h3>
                <button
                  onClick={() => setShowProposalRevisionModal(false)}
                  className="text-tg-hint hover:text-tg-text"
                >
                  <Cancel01Icon className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-tg-hint">
                For {selectedProposal.proposalNumber} (v{selectedProposal.currentVersion}). Explain what terms to adjust.
              </p>
              <textarea
                rows={4}
                placeholder="e.g. Can we adjust price to 4,500 ETB, extend delivery by 2 days, or include 1 more revision?"
                className="w-full p-3 rounded-xl bg-tg-secondaryBg border border-black/10 dark:border-white/10 text-tg-text text-xs focus:outline-none"
                value={proposalRevisionNotes}
                onChange={(e) => setProposalRevisionNotes(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  className="py-2.5 rounded-xl text-xs font-semibold bg-tg-secondaryBg text-tg-text"
                  onClick={() => setShowProposalRevisionModal(false)}
                >
                  Cancel
                </button>
                <button
                  disabled={actionInProgress || !proposalRevisionNotes.trim()}
                  className="py-2.5 rounded-xl text-xs font-bold bg-tg-button text-tg-buttonText disabled:opacity-50"
                  onClick={handleRequestFormalProposalRevision}
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Centum Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-tg-secondaryBg border-t border-black/10 dark:border-white/10 backdrop-blur-lg">
        <div className="max-w-lg mx-auto grid grid-cols-4 py-2 px-1">
          <button
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === "projects" && !selectedProject && !selectedProposal
                ? "text-tg-button font-bold"
                : "text-tg-hint font-medium"
            }`}
            onClick={() => {
              haptic("light");
              setSelectedProject(null);
              setSelectedProposal(null);
              setActiveTab("projects");
            }}
          >
            <Layers01Icon className="h-4 w-4" />
            <span className="text-[10px]">Cuts</span>
          </button>

          <button
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === "new_brief"
                ? "text-tg-button font-bold"
                : "text-tg-hint font-medium"
            }`}
            onClick={() => {
              haptic("light");
              setSelectedProject(null);
              setSelectedProposal(null);
              setActiveTab("new_brief");
            }}
          >
            <PlusSignIcon className="h-4 w-4" />
            <span className="text-[10px]">New Brief</span>
          </button>

          <button
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === "styles"
                ? "text-tg-button font-bold"
                : "text-tg-hint font-medium"
            }`}
            onClick={() => {
              haptic("light");
              setSelectedProject(null);
              setSelectedProposal(null);
              setActiveTab("styles");
            }}
          >
            <SparklesIcon className="h-4 w-4" />
            <span className="text-[10px]">Styles</span>
          </button>

          <button
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === "team"
                ? "text-tg-button font-bold"
                : "text-tg-hint font-medium"
            }`}
            onClick={() => {
              haptic("light");
              setSelectedProject(null);
              setSelectedProposal(null);
              setActiveTab("team");
            }}
          >
            <UserIcon className="h-4 w-4" />
            <span className="text-[10px]">Agency</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
