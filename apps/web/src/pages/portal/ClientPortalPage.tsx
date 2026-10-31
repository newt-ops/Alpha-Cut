import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight01Icon,
  PlayIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  SparklesIcon,
  Logout01Icon,
  PlusSignIcon,
  StarIcon,
  File01Icon,
  TelegramIcon,
  SecurityCheckIcon,
  SentIcon,
} from "hugeicons-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Textarea,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  notify,
  Skeleton,
} from "@alpha-cut/ui";
import { useAuth } from "../../context/AuthContext.js";
import { ThemeToggle } from "../../components/ThemeToggle.js";
import { EDITING_STYLES, type Project, type VideoFormat, type EditingStyle, type PackageTier, type Proposal } from "@alpha-cut/types";

export function ClientPortalPage() {
  const { user, logout, refreshUser, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(true);

  // Telegram 1:1 Integration State
  const [connectingTelegram, setConnectingTelegram] = useState(false);
  const [awaitingTelegramLink, setAwaitingTelegramLink] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [unlinkingTelegram, setUnlinkingTelegram] = useState(false);

  // Poll for link status when awaiting user to tap START in Telegram
  useEffect(() => {
    if (!awaitingTelegramLink) return;
    const interval = setInterval(async () => {
      try {
        await refreshUser();
      } catch {
        // ignore
      }
    }, 2500);

    const timeout = setTimeout(() => {
      setAwaitingTelegramLink(false);
    }, 120000); // Stop polling after 2 minutes

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [awaitingTelegramLink, refreshUser]);

  // Turn off awaiting link once user.telegramId becomes available
  useEffect(() => {
    if (user?.telegramId && awaitingTelegramLink) {
      setAwaitingTelegramLink(false);
      notify.success("Telegram Connected!", "Your Telegram account is now paired 1:1 with Alpha Cut.");
    }
  }, [user?.telegramId, awaitingTelegramLink]);

  const handleConnectTelegram = async () => {
    try {
      setConnectingTelegram(true);
      const res = await fetch("/api/auth/telegram-bind-token", {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate link");
      }
      const data = await res.json();
      window.open(data.bindUrl, "_blank");
      setAwaitingTelegramLink(true);
      notify.info("Telegram Opened", "Tap START in Telegram to complete the 1:1 account connection.");
    } catch (err: any) {
      notify.error("Connection Failed", err.message);
    } finally {
      setConnectingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    try {
      setTestingTelegram(true);
      const res = await fetch("/api/auth/telegram-test", {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to deliver ping");
      }
      notify.success("Ping Dispatched", "Check your Telegram app for the verification alert.");
    } catch (err: any) {
      notify.error("Ping Failed", err.message);
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!confirm("Are you sure you want to disconnect your Telegram account? You will no longer receive fast 1-tap alerts on your phone.")) {
      return;
    }
    try {
      setUnlinkingTelegram(true);
      const res = await fetch("/api/auth/telegram-unlink", {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to unlink account");
      }
      await refreshUser();
      notify.success("Account Unlinked", "Your Telegram account has been disconnected.");
    } catch (err: any) {
      notify.error("Unlink Failed", err.message);
    } finally {
      setUnlinkingTelegram(false);
    }
  };

  // Proposal Modals & Actions
  const [proposalRevisionModal, setProposalRevisionModal] = useState<Proposal | null>(null);
  const [proposalRevisionNotes, setProposalRevisionNotes] = useState("");
  const [submittingProposalRevision, setSubmittingProposalRevision] = useState(false);
  const [acceptingProposalId, setAcceptingProposalId] = useState<string | null>(null);

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    title: "",
    format: "short_form" as VideoFormat,
    style: "hook_talking_head" as EditingStyle,
    tier: "professional" as PackageTier,
    footageUrl: "",
    notes: "",
    deadline: "",
    clientTelegram: user?.telegramUsername || "",
  });

  // Action modals
  const [revisionModalProject, setRevisionModalProject] = useState<Project | null>(null);
  const [revisionText, setRevisionText] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const [reviewModalProject, setReviewModalProject] = useState<Project | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {
      notify.error("Error", "Could not load projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchProposals = async () => {
    try {
      setLoadingProposals(true);
      const res = await fetch("/api/proposals");
      if (res.ok) {
        const data = await res.json();
        const propList: Proposal[] = data.proposals || [];
        setProposals(propList);

        // Auto-mark newly viewed proposals
        for (const p of propList) {
          if (p.status === "sent" && p._id) {
            fetch(`/api/proposals/${p._id}`).catch(() => {});
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchProposals();
    }
  }, [user]);

  const handleAcceptFormalProposal = async (proposalId: string) => {
    try {
      setAcceptingProposalId(proposalId);
      const res = await fetch(`/api/proposals/${proposalId}/accept`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to accept proposal");
      }
      notify.success("Proposal Accepted!", "Your project is now officially activated and in production.");
      await Promise.all([fetchProposals(), fetchProjects()]);
    } catch (err: any) {
      notify.error("Error", err.message);
    } finally {
      setAcceptingProposalId(null);
    }
  };

  const handleRequestProposalRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalRevisionModal?._id || !proposalRevisionNotes.trim()) return;
    try {
      setSubmittingProposalRevision(true);
      const res = await fetch(`/api/proposals/${proposalRevisionModal._id}/request-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: proposalRevisionNotes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit revision request");
      }
      notify.success("Revision Request Sent", "Amir & Aymen will review and dispatch updated terms.");
      setProposalRevisionModal(null);
      setProposalRevisionNotes("");
      await fetchProposals();
    } catch (err: any) {
      notify.error("Error", err.message);
    } finally {
      setSubmittingProposalRevision(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: wizardData.title,
        format: wizardData.format,
        style: wizardData.style,
        tier: wizardData.tier,
        footageUrl: wizardData.footageUrl,
        notes: wizardData.notes,
        deadline: wizardData.deadline || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        clientTelegram: wizardData.clientTelegram,
        price: 0,
        currency: "USD",
        revisionsAllowed: 2,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create brief");

      notify.success("Brief Submitted!", "Amir & Aymen will review and send a proposal.");
      setShowWizard(false);
      setWizardStep(1);
      fetchProjects();
    } catch (err: any) {
      notify.error("Submission failed", err.message);
    }
  };

  const handleAcceptProposal = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/accept-proposal`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to accept proposal");

      notify.success("Proposal Accepted!", "Your project is now in production.");
      fetchProjects();
    } catch (err: any) {
      notify.error("Action failed", err.message);
    }
  };

  const handleApproveCut = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to approve cut");

      notify.success("Cut Approved!", "Thank you! Please leave a review.");
      const approvedProj = projects.find((p) => p._id === projectId);
      if (approvedProj) setReviewModalProject(approvedProj);
      fetchProjects();
    } catch (err: any) {
      notify.error("Approval failed", err.message);
    }
  };

  const handleSubmitRevision = async () => {
    if (!revisionModalProject || !revisionText.trim()) return;
    setSubmittingRevision(true);
    try {
      const res = await fetch(`/api/projects/${revisionModalProject._id}/request-revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: revisionText }),
      });
      if (!res.ok) throw new Error("Failed to submit revision");

      notify.success("Revision Submitted", "Your editor has been notified.");
      setRevisionModalProject(null);
      setRevisionText("");
      fetchProjects();
    } catch (err: any) {
      notify.error("Revision submission failed", err.message);
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewModalProject) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/projects/${reviewModalProject._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, testimonial: reviewText }),
      });
      if (!res.ok) throw new Error("Failed to submit review");

      notify.success("Review Submitted", "Thank you for supporting Alpha Cut!");
      setReviewModalProject(null);
      setReviewText("");
      fetchProjects();
    } catch (err: any) {
      notify.error("Review submission failed", err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-surface-lightBg dark:bg-surface-darkBg flex items-center justify-center p-6">
        <Skeleton className="h-64 w-full max-w-md rounded-[20px]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-lightBg dark:bg-surface-darkBg flex flex-col">
      {/* Portal Top Bar */}
      <header className="border-b border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-brand-brown dark:bg-brand-terracotta flex items-center justify-center text-brand-cream dark:text-[#161412] font-black text-sm">
                A
              </div>
              <span className="font-extrabold text-base tracking-tight text-[#181818] dark:text-[#F5F3EC]">
                ALPHA CUT
              </span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-md bg-[#FBEFE1] text-[#451D13] dark:bg-[#754637] dark:text-[#FBEFE1] font-bold">
              Client Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[#181818] dark:text-[#F5F3EC]">{user.name}</span>
              <span className="text-[11px] text-[#868686] dark:text-[#8C8A89]">{user.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => logout()}
            >
              <Logout01Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#181818] dark:text-[#F5F3EC]">
              My Video Projects
            </h1>
            <p className="text-xs text-[#868686] dark:text-[#8C8A89] mt-1">
              Track video cuts, accept proposals, review deliverables, and request revisions.
            </p>
          </div>

          <Button
            variant="primary"
            className="gap-2 self-start sm:self-auto"
            onClick={() => {
              setWizardStep(1);
              setShowWizard(true);
            }}
          >
            <PlusSignIcon className="h-4 w-4" />
            <span>Submit New Brief</span>
          </Button>
        </div>

        {/* TELEGRAM 1:1 FAST ACTIONS & ALERTS CARD */}
        <div className="mb-10">
          <Card className="border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] overflow-hidden">
            <div className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center shrink-0">
                    <TelegramIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC]">
                        Telegram Fast Actions & Mobile Alerts
                      </h3>
                      {user.telegramId ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#2E7D32] dark:bg-[#1B5E20]/30 dark:text-[#81C784]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32] dark:bg-[#81C784] animate-pulse" />
                          1:1 Connected
                        </span>
                      ) : awaitingTelegramLink ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF8E1] text-[#F57F17] dark:bg-[#F57F17]/20 dark:text-[#FFD54F]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#F57F17] animate-ping" />
                          Waiting for /start in Telegram...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/5 dark:bg-white/10 text-[#868686] dark:text-[#8C8A89]">
                          Not Linked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#868686] dark:text-[#8C8A89] mt-0.5">
                      {user.telegramId
                        ? `Linked 1:1 with ${user.telegramUsername ? `@${user.telegramUsername}` : `Chat ID ${user.telegramId}`}. Fast 1-tap approvals and real-time project alerts are enabled.`
                        : "Connect your Telegram account to approve proposals and review deliverable cuts with 1 tap on your phone."}
                    </p>
                  </div>
                </div>

                {!user.telegramId && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs text-[#868686] dark:text-[#8C8A89]">
                    <div className="flex items-center gap-1.5">
                      <CheckmarkCircle02Icon className="h-3.5 w-3.5 text-brand-brown dark:text-brand-terracotta shrink-0" />
                      <span>1-Tap proposal acceptance</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckmarkCircle02Icon className="h-3.5 w-3.5 text-brand-brown dark:text-brand-terracotta shrink-0" />
                      <span>Real-time cut review notices</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <SecurityCheckIcon className="h-3.5 w-3.5 text-brand-brown dark:text-brand-terracotta shrink-0" />
                      <span>Strict 1:1 account security</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {user.telegramId ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={handleTestTelegram}
                      disabled={testingTelegram}
                    >
                      <SentIcon className="h-3.5 w-3.5" />
                      <span>{testingTelegram ? "Dispatching..." : "Send Test Ping"}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={handleUnlinkTelegram}
                      disabled={unlinkingTelegram}
                    >
                      <span>{unlinkingTelegram ? "Unlinking..." : "Disconnect"}</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={handleConnectTelegram}
                    disabled={connectingTelegram}
                  >
                    <TelegramIcon className="h-3.5 w-3.5" />
                    <span>{connectingTelegram ? "Connecting..." : awaitingTelegramLink ? "Re-open Telegram Link" : "Connect Telegram Account"}</span>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* PENDING PROPOSALS & AGREEMENTS SECTION */}
        {proposals.length > 0 && (
          <div className="mb-12 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#181818] dark:text-[#F5F3EC] flex items-center gap-2">
                  <File01Icon className="h-5 w-5 text-brand-brown dark:text-brand-terracotta" />
                  <span>Proposals & Project Agreements</span>
                </h2>
                <p className="text-xs text-[#868686] dark:text-[#8C8A89] mt-0.5">
                  Review terms, negotiate pricing or timeline, and officially activate production.
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {proposals.filter((p) => p.status === "sent" || p.status === "viewed").length} Pending Action
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {proposals.map((prop) => {
                const activeVersion =
                  prop.versions.find((v) => v.version === prop.currentVersion) || prop.versions[0];
                const isActionable = prop.status === "sent" || prop.status === "viewed";

                return (
                  <Card
                    key={prop._id}
                    className={`flex flex-col justify-between border ${
                      isActionable
                        ? "border-[#E4BCAE] dark:border-[#754637] shadow-sm bg-gradient-to-br from-white to-[#FBEFE1]/20 dark:from-[#161412] dark:to-[#754637]/10"
                        : "border-[#E5E5EA] dark:border-[#33302C]"
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand-brown dark:text-brand-terracotta">
                            {prop.proposalNumber}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 font-bold">
                            v{prop.currentVersion}
                          </span>
                        </div>
                        <Badge
                          variant={
                            prop.status === "accepted"
                              ? "success"
                              : prop.status === "revision_requested"
                              ? "warning"
                              : isActionable
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px] font-bold uppercase tracking-wider"
                        >
                          {prop.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <CardTitle className="text-lg sm:text-xl">
                        {activeVersion?.title || prop.proposalNumber}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {activeVersion?.format === "short_form"
                          ? "Short-Form (Reels / TikTok)"
                          : "Long-Form (YouTube / Course)"}{" "}
                        &bull; {activeVersion?.style ? (EDITING_STYLES[activeVersion.style]?.label || activeVersion.style) : ""}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Financial & Terms Summary */}
                      <div className="p-4 rounded-xl bg-[#FBEFE1] dark:bg-[#754637]/25 border border-[#E4BCAE] dark:border-[#754637]/40">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-xs font-bold text-[#451D13] dark:text-[#FBEFE1]/80 uppercase tracking-wider">
                            Agreed Investment
                          </span>
                          <span className="text-2xl font-black text-[#451D13] dark:text-[#FBEFE1]">
                            {activeVersion?.price?.toLocaleString()} {activeVersion?.currency}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-[#451D13] dark:text-[#FBEFE1]/90 pt-2 border-t border-[#E4BCAE]/60 dark:border-[#754637]/60">
                          <div>
                            <span className="block text-[10px] text-[#451D13]/70 dark:text-[#FBEFE1]/60">
                              Delivery Target
                            </span>
                            <span className="font-bold">
                              {activeVersion?.deadline
                                ? new Date(activeVersion.deadline).toLocaleDateString()
                                : "TBD"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[#451D13]/70 dark:text-[#FBEFE1]/60">
                              Included Revisions
                            </span>
                            <span className="font-bold">{activeVersion?.revisionsAllowed} rounds</span>
                          </div>
                        </div>
                      </div>

                      {/* Notes / Inclusions */}
                      {activeVersion?.notes && (
                        <div className="text-xs text-[#868686] dark:text-[#8C8A89] space-y-1">
                          <span className="text-[11px] font-semibold text-[#181818] dark:text-[#F5F3EC] block">
                            Scope Inclusions:
                          </span>
                          <p className="leading-relaxed bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-[#E5E5EA] dark:border-[#33302C]">
                            {activeVersion.notes}
                          </p>
                        </div>
                      )}

                      {/* Revision Feedback alert if requested */}
                      {prop.status === "revision_requested" && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                          <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">
                            Revision Requested by You:
                          </span>
                          <p className="italic text-[#868686] dark:text-[#8C8A89]">"{prop.revisionFeedback}"</p>
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2">
                            Amir & Aymen are preparing updated terms (v{prop.currentVersion + 1}).
                          </p>
                        </div>
                      )}

                      {/* Accepted Banner */}
                      {prop.status === "accepted" && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                          <span>Accepted & Activated in Production</span>
                          <CheckmarkCircle02Icon className="h-4 w-4" />
                        </div>
                      )}
                    </CardContent>

                    {/* Action Buttons */}
                    {isActionable && (
                      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#E5E5EA] dark:border-[#33302C]">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto flex-1"
                          onClick={() => {
                            setProposalRevisionModal(prop);
                            setProposalRevisionNotes("");
                          }}
                        >
                          Request Changes
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full sm:w-auto flex-1 gap-1.5"
                          isLoading={acceptingProposalId === prop._id}
                          onClick={() => prop._id && handleAcceptFormalProposal(prop._id)}
                        >
                          <CheckmarkCircle02Icon className="h-4 w-4" />
                          <span>Accept & Start Production</span>
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-[20px]" />
            <Skeleton className="h-48 rounded-[20px]" />
          </div>
        ) : projects.length === 0 && proposals.length === 0 && !showWizard ? (
          /* Empty state / Welcome wizard invite */
          <Card className="text-center py-16 px-6 max-w-xl mx-auto border border-[#E5E5EA] dark:border-[#33302C]">
            <div className="h-16 w-16 rounded-full bg-brand-brown/10 text-brand-brown dark:text-brand-terracotta flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Start Your First Video Project</CardTitle>
            <CardDescription className="text-xs max-w-sm mx-auto mt-2">
              Ready to turn your raw footage into retention-engineered content? Use our 3-step brief wizard to get an immediate proposal from Amir & Aymen.
            </CardDescription>
            <div className="mt-6">
              <Button
                variant="primary"
                size="lg"
                className="gap-2"
                onClick={() => setShowWizard(true)}
              >
                <span>Launch Brief Wizard</span>
                <ArrowRight01Icon className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ) : (
          /* Projects List */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => (
              <Card
                key={proj._id}
                className="flex flex-col justify-between border border-[#E5E5EA] dark:border-[#33302C] hover:border-brand-brown/40 dark:hover:border-brand-terracotta/40 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown dark:text-brand-terracotta">
                      {proj.format === "short_form" ? "9:16 Short-Form" : "16:9 Long-Form"} &bull; {proj.tier}
                    </span>
                    <Badge
                      variant={
                        proj.stage === "approved"
                          ? "success"
                          : proj.stage === "in_review"
                          ? "warning"
                          : "default"
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {proj.stage.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{proj.title}</CardTitle>
                  <CardDescription className="text-xs">
                    Style: {EDITING_STYLES[proj.style]?.label || proj.style}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status Banner */}
                  {proj.stage === "inquiry_pending" && (
                    <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[#E5E5EA] dark:border-[#33302C] text-xs">
                      <p className="font-semibold text-[#181818] dark:text-[#F5F3EC]">
                        Proposal Under Review
                      </p>
                      <p className="text-[#868686] dark:text-[#8C8A89] mt-0.5">
                        Amir & Aymen are reviewing your footage and crafting a custom quote.
                      </p>
                    </div>
                  )}

                  {proj.stage === "proposal_sent" && (
                    <div className="p-4 rounded-xl bg-[#FBEFE1] dark:bg-[#754637]/30 border border-[#E4BCAE] dark:border-[#754637] text-xs space-y-2">
                      <div className="flex justify-between items-center font-bold text-sm text-[#451D13] dark:text-[#FBEFE1]">
                        <span>Quoted Investment:</span>
                        <span>{proj.price} {proj.currency}</span>
                      </div>
                      <div className="text-[11px] text-[#451D13] dark:text-[#FBEFE1]/90 flex justify-between">
                        <span>Revisions Included: {proj.revisionsAllowed} rounds</span>
                        <span>Due: {new Date(proj.deadline).toLocaleDateString()}</span>
                      </div>
                      <Button
                        variant="primary"
                        className="w-full mt-2"
                        onClick={() => proj._id && handleAcceptProposal(proj._id)}
                      >
                        Accept Proposal & Start Production
                      </Button>
                    </div>
                  )}

                  {proj.stage === "in_progress" && (
                    <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[#E5E5EA] dark:border-[#33302C] text-xs flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[#181818] dark:text-[#F5F3EC]">Currently In Production</p>
                        <p className="text-[#868686] dark:text-[#8C8A89]">
                          Editor: {proj.assignedEditor !== "unassigned" ? proj.assignedEditor.toUpperCase() : "Amir & Aymen"}
                        </p>
                      </div>
                      <Clock01Icon className="h-5 w-5 text-brand-brown dark:text-brand-terracotta" />
                    </div>
                  )}

                  {proj.stage === "in_review" && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-3">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                        <CheckmarkCircle02Icon className="h-4 w-4" />
                        <span>Cut Ready for Client Review!</span>
                      </div>
                      {proj.deliverableUrl && (
                        <a
                          href={proj.deliverableUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors"
                        >
                          <PlayIcon className="h-3.5 w-3.5" />
                          <span>Watch Video Cut</span>
                        </a>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => proj._id && handleApproveCut(proj._id)}
                        >
                          Approve Final Cut
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setRevisionModalProject(proj)}
                        >
                          Request Revisions ({proj.revisionsUsed || 0}/{proj.revisionsAllowed})
                        </Button>
                      </div>
                    </div>
                  )}

                  {proj.stage === "revision_requested" && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                      <p className="font-bold text-amber-800 dark:text-amber-400">
                        Revision Round {proj.revisionsUsed} of {proj.revisionsAllowed} In Progress
                      </p>
                      <p className="text-amber-900/80 dark:text-amber-200 mt-1 italic">
                        "{proj.revisionFeedback}"
                      </p>
                    </div>
                  )}

                  {proj.stage === "approved" && (
                    <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[#E5E5EA] dark:border-[#33302C] text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#181818] dark:text-[#F5F3EC]">Cut Approved & Completed</p>
                        {proj.rating ? (
                          <div className="flex items-center gap-1 text-amber-500 mt-1">
                            {Array.from({ length: proj.rating }).map((_, i) => (
                              <StarIcon key={i} className="h-3 w-3 fill-amber-500" />
                            ))}
                          </div>
                        ) : (
                          <button
                            className="text-brand-brown dark:text-brand-terracotta font-semibold hover:underline mt-1 block"
                            onClick={() => setReviewModalProject(proj)}
                          >
                            Leave Rating & Testimonial
                          </button>
                        )}
                      </div>
                      <CheckmarkCircle02Icon className="h-6 w-6 text-emerald-500" />
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t border-[#E5E5EA] dark:border-[#33302C] text-[11px] text-[#868686] dark:text-[#8C8A89] flex justify-between">
                  <span>Created: {new Date(proj.createdAt || Date.now()).toLocaleDateString()}</span>
                  {proj.footageUrl && (
                    <a
                      href={proj.footageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline flex items-center gap-1 text-[#181818] dark:text-[#F5F3EC]"
                    >
                      <File01Icon className="h-3 w-3" />
                      <span>Raw Footage Link</span>
                    </a>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* 3-Step Guided Onboarding Wizard Modal */}
        <Dialog open={showWizard} onOpenChange={setShowWizard}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown dark:text-brand-terracotta">
                  Step {wizardStep} of 3
                </span>
              </div>
              <DialogTitle>
                {wizardStep === 1 && "Choose Format & Editing Style"}
                {wizardStep === 2 && "Package Tier & Footage Assets"}
                {wizardStep === 3 && "Project Scope & Vision"}
              </DialogTitle>
              <DialogDescription>
                {wizardStep === 1 && "Select the visual pacing engineered for your target platform."}
                {wizardStep === 2 && "Provide your raw footage links and target production tier."}
                {wizardStep === 3 && "Tell Amir and Aymen what you want to achieve with this cut."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateProject} className="space-y-4 pt-2">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label required>Content Format</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                          wizardData.format === "short_form"
                            ? "border-brand-brown dark:border-brand-terracotta bg-brand-brown/5 text-brand-brown dark:text-brand-terracotta"
                            : "border-[#E5E5EA] dark:border-[#33302C]"
                        }`}
                        onClick={() => setWizardData({ ...wizardData, format: "short_form" })}
                      >
                        <p className="font-bold">Short-Form (9:16)</p>
                        <p className="text-[11px] opacity-75 mt-0.5">Reels, TikTok, YouTube Shorts</p>
                      </button>
                      <button
                        type="button"
                        className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                          wizardData.format === "long_form"
                            ? "border-brand-brown dark:border-brand-terracotta bg-brand-brown/5 text-brand-brown dark:text-brand-terracotta"
                            : "border-[#E5E5EA] dark:border-[#33302C]"
                        }`}
                        onClick={() => setWizardData({ ...wizardData, format: "long_form" })}
                      >
                        <p className="font-bold">Long-Form (16:9)</p>
                        <p className="text-[11px] opacity-75 mt-0.5">YouTube, Podcasts, Brand Films</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label required>Signature Style</Label>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {Object.values(EDITING_STYLES).map((s) => (
                        <button
                          type="button"
                          key={s.key}
                          className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                            wizardData.style === s.key
                              ? "border-brand-brown dark:border-brand-terracotta bg-brand-brown/5"
                              : "border-[#E5E5EA] dark:border-[#33302C]"
                          }`}
                          onClick={() => setWizardData({ ...wizardData, style: s.key })}
                        >
                          <p className="font-bold text-[#181818] dark:text-[#F5F3EC]">{s.label}</p>
                          <p className="text-[11px] text-[#868686] dark:text-[#8C8A89] mt-0.5">{s.tagline}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-full mt-4"
                    onClick={() => setWizardStep(2)}
                  >
                    Continue to Step 2
                  </Button>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label required>Target Package Tier</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["basic", "professional", "premium"] as PackageTier[]).map((t) => (
                        <button
                          type="button"
                          key={t}
                          className={`p-3 rounded-xl border text-center text-xs font-bold uppercase tracking-wider capitalize transition-all ${
                            wizardData.tier === t
                              ? "border-brand-brown dark:border-brand-terracotta bg-brand-brown/5 text-brand-brown dark:text-brand-terracotta"
                              : "border-[#E5E5EA] dark:border-[#33302C]"
                          }`}
                          onClick={() => setWizardData({ ...wizardData, tier: t })}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label required>Raw Footage Link (Google Drive / Dropbox / Frame.io)</Label>
                    <Input
                      type="url"
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={wizardData.footageUrl}
                      onChange={(e) => setWizardData({ ...wizardData, footageUrl: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setWizardStep(1)}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => {
                        if (!wizardData.footageUrl) {
                          notify.error("Footage required", "Please paste your cloud storage link");
                          return;
                        }
                        setWizardStep(3);
                      }}
                    >
                      Continue to Step 3
                    </Button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label required>Project Title</Label>
                    <Input
                      placeholder="e.g. Episode 12 - Deep Work Mastery"
                      value={wizardData.title}
                      onChange={(e) => setWizardData({ ...wizardData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label required>Brief & Creative Vision</Label>
                    <Textarea
                      placeholder="Specify hooks, tone of voice, any specific timestamps to highlight, or pacing preferences."
                      value={wizardData.notes}
                      onChange={(e) => setWizardData({ ...wizardData, notes: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label>Telegram Handle (For Real-Time Notifications)</Label>
                    <Input
                      placeholder="@username"
                      value={wizardData.clientTelegram}
                      onChange={(e) => setWizardData({ ...wizardData, clientTelegram: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setWizardStep(2)}
                    >
                      Back
                    </Button>
                    <Button type="submit" variant="primary" className="flex-1">
                      Submit Brief
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>

        {/* Revision Request Modal */}
        {revisionModalProject && (
          <Dialog open={!!revisionModalProject} onOpenChange={() => setRevisionModalProject(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Request Revisions</DialogTitle>
                <DialogDescription>
                  Round {(revisionModalProject.revisionsUsed || 0) + 1} of {revisionModalProject.revisionsAllowed} included revisions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Textarea
                  placeholder="Detail your requested edits with timestamps (e.g. 0:12 - change text color, 0:34 - shorten punch zoom)."
                  value={revisionText}
                  onChange={(e) => setRevisionText(e.target.value)}
                  rows={4}
                />
                <Button
                  className="w-full"
                  isLoading={submittingRevision}
                  onClick={handleSubmitRevision}
                >
                  Submit Revision Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Review & Rating Modal */}
        {reviewModalProject && (
          <Dialog open={!!reviewModalProject} onOpenChange={() => setReviewModalProject(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Rate Your Experience</DialogTitle>
                <DialogDescription>
                  Your feedback helps Amir and Aymen hold our craftsmanship to the highest standard.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Star Rating</Label>
                  <div className="flex gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-2xl focus:outline-none"
                      >
                        <StarIcon
                          className={`h-7 w-7 ${
                            star <= reviewRating
                              ? "text-amber-500 fill-amber-500"
                              : "text-neutral-300 dark:text-neutral-700"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Testimonial / Review Note</Label>
                  <Textarea
                    placeholder="How did this edit perform? What was it like collaborating directly with Amir and Aymen?"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full"
                  isLoading={submittingReview}
                  onClick={handleSubmitReview}
                >
                  Submit Review
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Proposal Revision Request Modal */}
        {proposalRevisionModal && (
          <Dialog open={!!proposalRevisionModal} onOpenChange={() => setProposalRevisionModal(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Request Terms Revision</DialogTitle>
                <DialogDescription>
                  For {proposalRevisionModal.proposalNumber} (v{proposalRevisionModal.currentVersion})
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleRequestProposalRevision} className="space-y-4 pt-2">
                <div>
                  <Label required>What would you like adjusted?</Label>
                  <Textarea
                    placeholder="e.g. Can we adjust price to 4,500 ETB, extend delivery by 2 days, or include 1 more revision?"
                    value={proposalRevisionNotes}
                    onChange={(e) => setProposalRevisionNotes(e.target.value)}
                    rows={4}
                    required
                  />
                  <p className="text-[11px] text-[#868686] mt-1">
                    Amir & Aymen will review your notes and issue a revised version (v{proposalRevisionModal.currentVersion + 1}).
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setProposalRevisionModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    isLoading={submittingProposalRevision}
                  >
                    Send Request
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}

