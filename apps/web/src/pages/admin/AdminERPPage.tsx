import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Coins01Icon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  Logout01Icon,
  PlusSignIcon,
  SparklesIcon,
  StarIcon,
  PlayIcon,
  File01Icon,
  Mail01Icon,
  ArrowRight01Icon,
} from "hugeicons-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
import type {
  Project,
  Inquiry,
  Invoice,
  Expense,
  ProjectStage,
  PackageTier,
  Proposal,
  ProposalVersion,
  VideoFormat,
  EditingStyle,
} from "@alpha-cut/types";

export function AdminERPPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"overview" | "proposals" | "pipeline" | "inquiries" | "finances" | "reviews">("overview");

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [financeSummary, setFinanceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Proposal Modals
  const [newProposalModal, setNewProposalModal] = useState(false);
  const [newProposalForm, setNewProposalForm] = useState({
    clientId: "",
    clientName: "",
    clientEmail: "",
    clientTelegram: "",
    title: "",
    format: "short_form" as VideoFormat,
    style: "viral_animation" as EditingStyle,
    tier: "professional" as PackageTier,
    price: 350,
    currency: "USD" as "USD" | "ETB",
    revisionsAllowed: 2,
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    footageUrl: "",
    notes: "",
    assignedEditor: "amir" as "amir" | "aymen",
    status: "draft" as "draft" | "sent",
  });

  const [versionModalProposal, setVersionModalProposal] = useState<Proposal | null>(null);
  const [versionForm, setVersionForm] = useState({
    title: "",
    price: 350,
    currency: "USD" as "USD" | "ETB",
    revisionsAllowed: 2,
    deadline: "",
    notes: "",
    assignedEditor: "amir" as "amir" | "aymen",
  });

  // Modals
  const [proposalProject, setProposalProject] = useState<Project | null>(null);
  const [proposalForm, setProposalForm] = useState({
    price: 350,
    currency: "USD" as "USD" | "ETB",
    deadline: "",
    revisionsAllowed: 2,
    tier: "professional" as PackageTier,
    assignedEditor: "amir" as "amir" | "aymen",
  });

  const [deliveryProject, setDeliveryProject] = useState<Project | null>(null);
  const [deliveryUrl, setDeliveryUrl] = useState("");

  const [newInvoiceModal, setNewInvoiceModal] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
    projectId: "",
    projectTitle: "",
    clientId: "",
    clientName: "",
    amount: 350,
    currency: "USD" as "USD" | "ETB",
    paymentMethod: "Bank Wire / Transfer",
    notes: "",
  });

  const [newExpenseModal, setNewExpenseModal] = useState(false);
  const [newExpenseForm, setNewExpenseForm] = useState({
    title: "",
    category: "software" as any,
    amount: 50,
    currency: "USD" as "USD" | "ETB",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [projRes, inqRes, invRes, expRes, sumRes, propRes, clientRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/inquiries"),
        fetch("/api/finances/invoices"),
        fetch("/api/finances/expenses"),
        fetch("/api/finances/summary"),
        fetch("/api/proposals"),
        fetch("/api/auth/clients"),
      ]);

      if (projRes.ok) setProjects((await projRes.json()).projects || []);
      if (inqRes.ok) setInquiries((await inqRes.json()).inquiries || []);
      if (invRes.ok) setInvoices((await invRes.json()).invoices || []);
      if (expRes.ok) setExpenses((await expRes.json()).expenses || []);
      if (sumRes.ok) setFinanceSummary((await sumRes.json()).summary || null);
      if (propRes.ok) setProposals((await propRes.json()).proposals || []);
      if (clientRes.ok) setClients((await clientRes.json()).clients || []);
    } catch {
      notify.error("Error", "Could not load ERP data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent, status: "draft" | "sent") => {
    e.preventDefault();
    if (!newProposalForm.clientEmail) {
      notify.error("Client Required", "Please select or enter client email");
      return;
    }

    try {
      const payload = {
        ...newProposalForm,
        status,
      };

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create proposal");
      const data = await res.json();

      notify.success(
        status === "sent" ? "Proposal Sent!" : "Draft Saved",
        status === "sent" ? `Dispatched to ${newProposalForm.clientName} on Telegram` : "Saved to ERP drafts"
      );

      setNewProposalModal(false);
      fetchAllData();
    } catch (err: any) {
      notify.error("Error creating proposal", err.message);
    }
  };

  const handleSendDraftProposal = async (proposalId: string) => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/send`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to send proposal");

      notify.success("Proposal Sent", "Client has been notified via Telegram & Portal");
      fetchAllData();
    } catch (err: any) {
      notify.error("Failed to send", err.message);
    }
  };

  const handleCreateNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionModalProposal) return;

    try {
      const res = await fetch(`/api/proposals/${versionModalProposal._id}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(versionForm),
      });

      if (!res.ok) throw new Error("Failed to create version");
      const data = await res.json();

      notify.success("New Version Dispatched", `Created v${data.version} with updated terms`);
      setVersionModalProposal(null);
      fetchAllData();
    } catch (err: any) {
      notify.error("Version creation failed", err.message);
    }
  };

  const handleConvertInquiryToProposal = (inq: Inquiry) => {
    // Check if client exists in clients list
    const matchedClient = clients.find((c) => c.email.toLowerCase() === inq.email.toLowerCase());

    setNewProposalForm({
      ...newProposalForm,
      clientId: matchedClient ? matchedClient._id : "",
      clientName: inq.name,
      clientEmail: inq.email,
      clientTelegram: inq.telegramUsername || "",
      title: `${inq.style.replace("_", " ").toUpperCase()} Project for ${inq.name}`,
      format: inq.format,
      style: inq.style,
      tier: "professional",
      price: inq.budget ? Number(inq.budget.replace(/[^0-9]/g, "")) || 350 : 350,
      notes: inq.notes,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      assignedEditor: "amir",
      status: "draft",
    });

    setNewProposalModal(true);
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
      } else if (user.role !== "super_admin") {
        notify.error("Access Denied", "ERP Dashboard is reserved for Super Admins");
        navigate("/portal");
      } else {
        fetchAllData();
      }
    }
  }, [user, authLoading, navigate]);

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalProject) return;

    try {
      const res = await fetch(`/api/projects/${proposalProject._id}/proposal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposalForm),
      });

      if (!res.ok) throw new Error("Failed to send proposal");

      notify.success("Proposal Sent", "Client has been notified on Telegram & Portal");
      setProposalProject(null);
      fetchAllData();
    } catch (err: any) {
      notify.error("Failed to send proposal", err.message);
    }
  };

  const handlePublishDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryProject || !deliveryUrl) return;

    try {
      const res = await fetch(`/api/projects/${deliveryProject._id}/delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverableUrl: deliveryUrl }),
      });

      if (!res.ok) throw new Error("Failed to publish cut");

      notify.success("Delivery Published", "Client has been notified to review the cut");
      setDeliveryProject(null);
      setDeliveryUrl("");
      fetchAllData();
    } catch (err: any) {
      notify.error("Publish failed", err.message);
    }
  };

  const handleToggleFeaturedReview = async (projectId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featuredOnWebsite: !current }),
      });
      if (!res.ok) throw new Error("Update failed");

      notify.success("Updated", !current ? "Published to website social proof" : "Hidden from website");
      fetchAllData();
    } catch (err: any) {
      notify.error("Update failed", err.message);
    }
  };

  const handleInvoiceStatusUpdate = async (invoiceId: string, status: string) => {
    try {
      const res = await fetch(`/api/finances/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      notify.success("Status Updated", `Invoice marked as ${status}`);
      fetchAllData();
    } catch (err: any) {
      notify.error("Update failed", err.message);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finances/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoiceForm),
      });
      if (!res.ok) throw new Error("Failed to create invoice");

      notify.success("Invoice Logged", "Saved to manual financial ledger");
      setNewInvoiceModal(false);
      fetchAllData();
    } catch (err: any) {
      notify.error("Invoice creation failed", err.message);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finances/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpenseForm),
      });
      if (!res.ok) throw new Error("Failed to log expense");

      notify.success("Expense Logged", "Expense recorded in accounting ledger");
      setNewExpenseModal(false);
      fetchAllData();
    } catch (err: any) {
      notify.error("Expense logging failed", err.message);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-surface-lightBg dark:bg-surface-darkBg flex items-center justify-center p-6">
        <Skeleton className="h-64 w-full max-w-md rounded-[20px]" />
      </div>
    );
  }

  const activeProjectsCount = projects.filter((p) =>
    ["in_progress", "in_review", "revision_requested"].includes(p.stage)
  ).length;

  const newInquiriesCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <div className="min-h-screen bg-surface-lightBg dark:bg-surface-darkBg flex flex-col">
      {/* ERP Top Bar */}
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
            <span className="text-xs px-2 py-0.5 rounded-md bg-brand-brown text-brand-cream dark:bg-brand-terracotta dark:text-[#161412] font-extrabold tracking-wide">
              AGENCY ERP
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-[#E5E5EA] dark:border-[#33302C]">
            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-white dark:bg-[#252321] text-[#181818] dark:text-[#F5F3EC] shadow-sm"
                  : "text-[#868686] hover:text-[#181818]"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "proposals"
                  ? "bg-white dark:bg-[#252321] text-[#181818] dark:text-[#F5F3EC] shadow-sm"
                  : "text-[#868686] hover:text-[#181818]"
              }`}
              onClick={() => setActiveTab("proposals")}
            >
              Proposals ({proposals.length})
            </button>
            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "pipeline"
                  ? "bg-white dark:bg-[#252321] text-[#181818] dark:text-[#F5F3EC] shadow-sm"
                  : "text-[#868686] hover:text-[#181818]"
              }`}
              onClick={() => setActiveTab("pipeline")}
            >
              Pipeline ({projects.length})
            </button>
            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "inquiries"
                  ? "bg-white dark:bg-[#252321] text-[#181818] dark:text-[#F5F3EC] shadow-sm"
                  : "text-[#868686] hover:text-[#181818]"
              }`}
              onClick={() => setActiveTab("inquiries")}
            >
              Leads ({newInquiriesCount})
            </button>
            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "finances"
                  ? "bg-white dark:bg-[#252321] text-[#181818] dark:text-[#F5F3EC] shadow-sm"
                  : "text-[#868686] hover:text-[#181818]"
              }`}
              onClick={() => setActiveTab("finances")}
            >
              Finances
            </button>
            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "reviews"
                  ? "bg-white dark:bg-[#252321] text-[#181818] dark:text-[#F5F3EC] shadow-sm"
                  : "text-[#868686] hover:text-[#181818]"
              }`}
              onClick={() => setActiveTab("reviews")}
            >
              Testimonials
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#181818] dark:text-[#F5F3EC]">
              {user.name} (Founder)
            </span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <Logout01Icon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton className="h-32 rounded-[20px]" />
            <Skeleton className="h-32 rounded-[20px]" />
            <Skeleton className="h-32 rounded-[20px]" />
            <Skeleton className="h-32 rounded-[20px]" />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border border-[#E5E5EA] dark:border-[#33302C]">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center text-[#868686] dark:text-[#8C8A89]">
                        <span className="text-xs font-semibold uppercase tracking-wider">Active In-Flight Edits</span>
                        <Clock01Icon className="h-4 w-4 text-brand-brown dark:text-brand-terracotta" />
                      </div>
                      <CardTitle className="text-3xl font-black mt-2">{activeProjectsCount}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[11px] text-[#868686]">In progress, review, or revision</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-[#E5E5EA] dark:border-[#33302C]">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center text-[#868686] dark:text-[#8C8A89]">
                        <span className="text-xs font-semibold uppercase tracking-wider">New Inquiries</span>
                        <Mail01Icon className="h-4 w-4 text-brand-brown dark:text-brand-terracotta" />
                      </div>
                      <CardTitle className="text-3xl font-black mt-2">{newInquiriesCount}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[11px] text-[#868686]">Awaiting review & quote</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-[#E5E5EA] dark:border-[#33302C]">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center text-[#868686] dark:text-[#8C8A89]">
                        <span className="text-xs font-semibold uppercase tracking-wider">Net Profit (USD)</span>
                        <Coins01Icon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <CardTitle className="text-3xl font-black mt-2 text-emerald-600">
                        ${financeSummary?.usd?.netProfit?.toLocaleString() || 0}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[11px] text-[#868686]">Revenue minus logged expenses</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-[#E5E5EA] dark:border-[#33302C]">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center text-[#868686] dark:text-[#8C8A89]">
                        <span className="text-xs font-semibold uppercase tracking-wider">Net Profit (ETB)</span>
                        <Coins01Icon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <CardTitle className="text-3xl font-black mt-2 text-emerald-600">
                        {financeSummary?.etb?.netProfit?.toLocaleString() || 0} ETB
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[11px] text-[#868686]">Local Ethiopian ledger</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Action Pipelines */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Needs Proposal */}
                  <Card className="border border-[#E5E5EA] dark:border-[#33302C]">
                    <CardHeader>
                      <CardTitle className="text-lg">Needs Proposal Quote</CardTitle>
                      <CardDescription className="text-xs">
                        Clients awaiting scope agreement and pricing.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {projects.filter((p) => p.stage === "inquiry_pending").length === 0 ? (
                        <p className="text-xs text-[#868686] py-4 text-center">No projects awaiting proposal.</p>
                      ) : (
                        projects
                          .filter((p) => p.stage === "inquiry_pending")
                          .map((p) => (
                            <div
                              key={p._id}
                              className="p-3.5 rounded-xl border border-[#E5E5EA] dark:border-[#33302C] flex items-center justify-between"
                            >
                              <div>
                                <h4 className="text-xs font-bold text-[#181818] dark:text-[#F5F3EC]">{p.title}</h4>
                                <p className="text-[11px] text-[#868686]">
                                  {p.clientName} &bull; {p.format} &bull; {p.style}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  setProposalProject(p);
                                  setProposalForm({
                                    ...proposalForm,
                                    price: 350,
                                    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                                  });
                                }}
                              >
                                Send Quote
                              </Button>
                            </div>
                          ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Ready for Delivery */}
                  <Card className="border border-[#E5E5EA] dark:border-[#33302C]">
                    <CardHeader>
                      <CardTitle className="text-lg">In Production / Ready for Review</CardTitle>
                      <CardDescription className="text-xs">
                        Active edits being cut by Amir or Aymen.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {projects.filter((p) => ["in_progress", "revision_requested"].includes(p.stage)).length === 0 ? (
                        <p className="text-xs text-[#868686] py-4 text-center">No active cuts in production.</p>
                      ) : (
                        projects
                          .filter((p) => ["in_progress", "revision_requested"].includes(p.stage))
                          .map((p) => (
                            <div
                              key={p._id}
                              className="p-3.5 rounded-xl border border-[#E5E5EA] dark:border-[#33302C] flex items-center justify-between"
                            >
                              <div>
                                <h4 className="text-xs font-bold text-[#181818] dark:text-[#F5F3EC]">{p.title}</h4>
                                <p className="text-[11px] text-[#868686]">
                                  Editor: {p.assignedEditor.toUpperCase()} &bull; Revisions: {p.revisionsUsed}/{p.revisionsAllowed}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDeliveryProject(p);
                                  setDeliveryUrl(p.deliverableUrl || "");
                                }}
                              >
                                Submit Cut Link
                              </Button>
                            </div>
                          ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* PROPOSALS TAB */}
            {activeTab === "proposals" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#181818] dark:text-[#F5F3EC]">
                      Client Proposals & Agreements
                    </h2>
                    <p className="text-xs text-[#868686] mt-1">
                      Draft formal scopes, negotiate terms with version history, and dispatch agreements to clients. Projects activate automatically upon client acceptance.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="gap-2 self-start sm:self-auto"
                    onClick={() => setNewProposalModal(true)}
                  >
                    <PlusSignIcon className="h-4 w-4" />
                    <span>Create Proposal</span>
                  </Button>
                </div>

                {proposals.length === 0 ? (
                  <Card className="text-center py-16 px-6 border border-[#E5E5EA] dark:border-[#33302C]">
                    <div className="h-14 w-14 rounded-2xl bg-brand-brown/10 text-brand-brown dark:text-brand-terracotta flex items-center justify-center mx-auto mb-3">
                      <File01Icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-lg font-bold">No Proposals Yet</CardTitle>
                    <CardDescription className="text-xs max-w-sm mx-auto mt-1">
                      Craft a formal scope proposal for any registered client. Set agreed price, format, style, and turnaround deadline.
                    </CardDescription>
                    <div className="mt-5">
                      <Button variant="primary" onClick={() => setNewProposalModal(true)}>
                        Create First Proposal
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {proposals.map((prop) => {
                      const v = prop.versions[prop.currentVersion - 1];
                      return (
                        <Card
                          key={prop._id}
                          className="border border-[#E5E5EA] dark:border-[#33302C] flex flex-col justify-between"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown dark:text-brand-terracotta">
                                {prop.proposalNumber} &bull; v{prop.currentVersion}
                              </span>
                              <Badge
                                variant={
                                  prop.status === "accepted"
                                    ? "success"
                                    : prop.status === "revision_requested"
                                    ? "warning"
                                    : prop.status === "sent" || prop.status === "viewed"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-[9px] uppercase font-bold"
                              >
                                {prop.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <CardTitle className="text-base">{v.title}</CardTitle>
                            <CardDescription className="text-xs">
                              Client: <span className="font-semibold text-[#181818] dark:text-[#F5F3EC]">{prop.clientName}</span> ({prop.clientEmail})
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="space-y-3 text-xs">
                            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 space-y-1.5 border border-[#E5E5EA] dark:border-[#33302C]">
                              <div className="flex justify-between font-bold text-sm">
                                <span>Agreed Investment:</span>
                                <span className="text-brand-brown dark:text-brand-terracotta">
                                  {v.price.toLocaleString()} {v.currency}
                                </span>
                              </div>
                              <div className="flex justify-between text-[#868686] text-[11px]">
                                <span>Format: {v.format === "short_form" ? "9:16 Short" : "16:9 Long"}</span>
                                <span>Tier: {v.tier}</span>
                              </div>
                              <div className="flex justify-between text-[#868686] text-[11px]">
                                <span>Revisions: {v.revisionsAllowed} rounds</span>
                                <span>Due: {new Date(v.deadline).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between text-[#868686] text-[11px]">
                                <span>Lead Editor:</span>
                                <span className="font-semibold text-[#181818] dark:text-[#F5F3EC]">
                                  {v.assignedEditor.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Revision feedback alert if requested by client */}
                            {prop.status === "revision_requested" && prop.revisionFeedback && (
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                                <span className="font-bold text-amber-700 dark:text-amber-400 block text-[11px]">
                                  Client Requested Changes:
                                </span>
                                <p className="italic text-[#868686] dark:text-[#8C8A89]">
                                  "{prop.revisionFeedback}"
                                </p>
                              </div>
                            )}

                            {/* View tracking timestamp */}
                            {prop.viewedAt && (
                              <p className="text-[10px] text-[#868686]">
                                Viewed by client on {new Date(prop.viewedAt).toLocaleDateString()}
                              </p>
                            )}

                            {/* Accepted timestamp & link */}
                            {prop.status === "accepted" && (
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                                <span>Project Activated & On Timeline</span>
                                <CheckmarkCircle02Icon className="h-4 w-4" />
                              </div>
                            )}
                          </CardContent>

                          <div className="p-4 pt-0 border-t border-[#E5E5EA] dark:border-[#33302C] mt-2 flex flex-col gap-2">
                            {prop.status === "draft" && (
                              <Button
                                size="sm"
                                variant="primary"
                                className="w-full"
                                onClick={() => prop._id && handleSendDraftProposal(prop._id)}
                              >
                                Send Proposal to Client
                              </Button>
                            )}

                            {(prop.status === "sent" || prop.status === "viewed" || prop.status === "revision_requested") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  setVersionModalProposal(prop);
                                  setVersionForm({
                                    title: v.title,
                                    price: v.price,
                                    currency: v.currency,
                                    revisionsAllowed: v.revisionsAllowed,
                                    deadline: typeof v.deadline === "string" ? v.deadline.split("T")[0] : new Date(v.deadline).toISOString().split("T")[0],
                                    notes: v.notes || "",
                                    assignedEditor: v.assignedEditor === "aymen" ? "aymen" : "amir",
                                  });
                                }}
                              >
                                Create Revised Version (v{prop.currentVersion + 1})
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PIPELINE TAB */}
            {activeTab === "pipeline" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#181818] dark:text-[#F5F3EC]">All Active Projects</h2>
                  <Badge variant="secondary">{projects.length} Total Projects</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((proj) => (
                    <Card key={proj._id} className="border border-[#E5E5EA] dark:border-[#33302C] flex flex-col justify-between">
                      <CardHeader>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown dark:text-brand-terracotta">
                            {proj.format} &bull; {proj.tier}
                          </span>
                          <Badge variant="default" className="text-[10px]">
                            {proj.stage.replace("_", " ")}
                          </Badge>
                        </div>
                        <CardTitle className="text-base">{proj.title}</CardTitle>
                        <CardDescription className="text-xs">
                          Client: {proj.clientName} ({proj.clientEmail})
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs">
                        <div className="flex justify-between text-[#868686]">
                          <span>Editor Assigned:</span>
                          <span className="font-semibold text-[#181818] dark:text-[#F5F3EC]">{proj.assignedEditor.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between text-[#868686]">
                          <span>Quoted Price:</span>
                          <span className="font-semibold text-[#181818] dark:text-[#F5F3EC]">
                            {proj.price > 0 ? `${proj.price} ${proj.currency}` : "Pending Quote"}
                          </span>
                        </div>
                        <div className="flex justify-between text-[#868686]">
                          <span>Revisions Used:</span>
                          <span className="font-semibold text-[#181818] dark:text-[#F5F3EC]">
                            {proj.revisionsUsed || 0} of {proj.revisionsAllowed}
                          </span>
                        </div>
                        {proj.footageUrl && (
                          <div className="pt-2">
                            <a
                              href={proj.footageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-brand-brown dark:text-brand-terracotta font-semibold hover:underline flex items-center gap-1"
                            >
                              <File01Icon className="h-3.5 w-3.5" />
                              <span>Open Raw Footage Folder</span>
                            </a>
                          </div>
                        )}
                        {proj.deliverableUrl && (
                          <div className="pt-1">
                            <a
                              href={proj.deliverableUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                            >
                              <PlayIcon className="h-3.5 w-3.5" />
                              <span>Watch Deliverable Cut</span>
                            </a>
                          </div>
                        )}
                      </CardContent>
                      <div className="p-4 pt-0 border-t border-[#E5E5EA] dark:border-[#33302C] mt-2 flex gap-2">
                        {proj.stage === "inquiry_pending" && (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setProposalProject(proj);
                              setProposalForm({
                                ...proposalForm,
                                price: 350,
                                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                              });
                            }}
                          >
                            Craft Proposal
                          </Button>
                        )}
                        {["in_progress", "revision_requested"].includes(proj.stage) && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="w-full"
                            onClick={() => {
                              setDeliveryProject(proj);
                              setDeliveryUrl(proj.deliverableUrl || "");
                            }}
                          >
                            Upload Delivery Link
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* INQUIRIES TAB */}
            {activeTab === "inquiries" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#181818] dark:text-[#F5F3EC]">Public Website Inquiries</h2>
                  <Badge variant="secondary">{inquiries.length} Inquiries</Badge>
                </div>

                <div className="space-y-4">
                  {inquiries.map((inq) => (
                    <Card key={inq._id} className="p-6 border border-[#E5E5EA] dark:border-[#33302C]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                          <h3 className="text-base font-bold text-[#181818] dark:text-[#F5F3EC]">{inq.name}</h3>
                          <p className="text-xs text-[#868686]">
                            {inq.email} &bull; Telegram: {inq.telegramUsername ? `@${inq.telegramUsername}` : "None"} &bull; {inq.brandHandle || "No handle"}
                          </p>
                        </div>
                        <Badge variant="outline" className="self-start sm:self-auto uppercase text-[10px]">
                          {inq.status}
                        </Badge>
                      </div>

                      <div className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded-xl mb-3">
                        <span className="font-bold text-[#181818] dark:text-[#F5F3EC] block mb-1">
                          {inq.format === "short_form" ? "Short-Form (9:16)" : "Long-Form (16:9)"} &bull; Style: {inq.style} &bull; Budget: {inq.budget || "Flexible"}
                        </span>
                        <p className="text-[#868686]">{inq.notes}</p>
                      </div>

                      <div className="text-[11px] text-[#868686] flex justify-between items-center pt-1">
                        <span>Received: {new Date(inq.createdAt || Date.now()).toLocaleString()}</span>
                        <div className="flex items-center gap-3">
                          <a
                            href={`mailto:${inq.email}`}
                            className="font-semibold text-[#868686] hover:underline"
                          >
                            Email Client
                          </a>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleConvertInquiryToProposal(inq)}
                          >
                            Convert to Proposal
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* FINANCES TAB */}
            {activeTab === "finances" && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-[#181818] dark:text-[#F5F3EC]">Manual Financial Ledger</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setNewExpenseModal(true)}>
                      Log Expense
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setNewInvoiceModal(true)}>
                      Create Invoice
                    </Button>
                  </div>
                </div>

                {/* Invoices List */}
                <Card className="border border-[#E5E5EA] dark:border-[#33302C] overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base">Invoices & Receivables</CardTitle>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-black/5 dark:bg-white/5 border-y border-[#E5E5EA] dark:border-[#33302C]">
                        <tr>
                          <th className="p-3 font-bold">Invoice #</th>
                          <th className="p-3 font-bold">Client</th>
                          <th className="p-3 font-bold">Project</th>
                          <th className="p-3 font-bold">Amount</th>
                          <th className="p-3 font-bold">Status</th>
                          <th className="p-3 font-bold">Method</th>
                          <th className="p-3 font-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#33302C]">
                        {invoices.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-[#868686]">No invoices recorded yet.</td>
                          </tr>
                        ) : (
                          invoices.map((inv) => (
                            <tr key={inv._id}>
                              <td className="p-3 font-mono font-bold">{inv.invoiceNumber}</td>
                              <td className="p-3">{inv.clientName}</td>
                              <td className="p-3 font-medium">{inv.projectTitle}</td>
                              <td className="p-3 font-bold">{inv.amount} {inv.currency}</td>
                              <td className="p-3">
                                <Badge
                                  variant={inv.status === "paid" ? "success" : "warning"}
                                  className="uppercase text-[10px]"
                                >
                                  {inv.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-[#868686]">{inv.paymentMethod || "Pending"}</td>
                              <td className="p-3">
                                {inv.status !== "paid" ? (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => inv._id && handleInvoiceStatusUpdate(inv._id, "paid")}
                                  >
                                    Mark Paid
                                  </Button>
                                ) : (
                                  <span className="text-emerald-600 font-semibold text-[11px]">Settled</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Expenses List */}
                <Card className="border border-[#E5E5EA] dark:border-[#33302C] overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base">Agency Operating Expenses</CardTitle>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-black/5 dark:bg-white/5 border-y border-[#E5E5EA] dark:border-[#33302C]">
                        <tr>
                          <th className="p-3 font-bold">Expense Title</th>
                          <th className="p-3 font-bold">Category</th>
                          <th className="p-3 font-bold">Amount</th>
                          <th className="p-3 font-bold">Date</th>
                          <th className="p-3 font-bold">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5EA] dark:divide-[#33302C]">
                        {expenses.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-[#868686]">No expenses recorded yet.</td>
                          </tr>
                        ) : (
                          expenses.map((exp) => (
                            <tr key={exp._id}>
                              <td className="p-3 font-bold">{exp.title}</td>
                              <td className="p-3 uppercase text-[10px] text-[#868686]">{exp.category}</td>
                              <td className="p-3 font-semibold text-red-600">-{exp.amount} {exp.currency}</td>
                              <td className="p-3 text-[#868686]">{new Date(exp.date).toLocaleDateString()}</td>
                              <td className="p-3 text-[#868686]">{exp.notes || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#181818] dark:text-[#F5F3EC]">Client Testimonial Curation</h2>
                  <Badge variant="secondary">Direct Feedback</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.filter((p) => p.rating).length === 0 ? (
                    <Card className="p-8 text-center text-xs text-[#868686] md:col-span-2">
                      No ratings or reviews submitted yet. They will appear here once clients approve cuts.
                    </Card>
                  ) : (
                    projects
                      .filter((p) => p.rating)
                      .map((p) => (
                        <Card key={p._id} className="p-6 border border-[#E5E5EA] dark:border-[#33302C] flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex text-amber-500">
                                {Array.from({ length: p.rating || 5 }).map((_, i) => (
                                  <StarIcon key={i} className="h-4 w-4 fill-amber-500" />
                                ))}
                              </div>
                              <span className="text-[10px] uppercase font-bold text-[#868686]">
                                {p.clientName}
                              </span>
                            </div>
                            <p className="text-sm italic text-[#181818] dark:text-[#F5F3EC]">
                              "{p.testimonial || "Great cut, rapid delivery!"}"
                            </p>
                          </div>
                          <div className="pt-4 border-t border-[#E5E5EA] dark:border-[#33302C] mt-4 flex items-center justify-between">
                            <span className="text-xs text-[#868686]">
                              {p.featuredOnWebsite ? "⭐ Shown on Website" : "Private review"}
                            </span>
                            <Button
                              size="sm"
                              variant={p.featuredOnWebsite ? "outline" : "primary"}
                              onClick={() => p._id && handleToggleFeaturedReview(p._id, !!p.featuredOnWebsite)}
                            >
                              {p.featuredOnWebsite ? "Unpublish" : "Feature on Website"}
                            </Button>
                          </div>
                        </Card>
                      ))
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* PROPOSAL CRAFTING MODAL */}
        {proposalProject && (
          <Dialog open={!!proposalProject} onOpenChange={() => setProposalProject(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Proposal Quote</DialogTitle>
                <DialogDescription>
                  For: {proposalProject.title} ({proposalProject.clientName})
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSendProposal} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Price Quote</Label>
                    <Input
                      type="number"
                      value={proposalForm.price}
                      onChange={(e) => setProposalForm({ ...proposalForm, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label required>Currency</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC]"
                      value={proposalForm.currency}
                      onChange={(e) => setProposalForm({ ...proposalForm, currency: e.target.value as any })}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="ETB">ETB (Birr)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Included Revisions</Label>
                    <Input
                      type="number"
                      value={proposalForm.revisionsAllowed}
                      onChange={(e) => setProposalForm({ ...proposalForm, revisionsAllowed: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label required>Assigned Editor</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC]"
                      value={proposalForm.assignedEditor}
                      onChange={(e) => setProposalForm({ ...proposalForm, assignedEditor: e.target.value as any })}
                    >
                      <option value="amir">Amir (Lead Editor)</option>
                      <option value="aymen">Aymen (Dev & Editor)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label required>Delivery Deadline</Label>
                  <Input
                    type="date"
                    value={proposalForm.deadline}
                    onChange={(e) => setProposalForm({ ...proposalForm, deadline: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full gap-2">
                  <ArrowRight01Icon className="h-4 w-4" />
                  <span>Send Proposal to Client</span>
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* DELIVERY PUBLISH MODAL */}
        {deliveryProject && (
          <Dialog open={!!deliveryProject} onOpenChange={() => setDeliveryProject(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Publish Deliverable Cut</DialogTitle>
                <DialogDescription>
                  For: {deliveryProject.title} ({deliveryProject.clientName})
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handlePublishDelivery} className="space-y-4 pt-2">
                <div>
                  <Label required>Deliverable Review URL (Frame.io / Drive / Vimeo)</Label>
                  <Input
                    type="url"
                    placeholder="https://f.io/xyz123 or Google Drive link"
                    value={deliveryUrl}
                    onChange={(e) => setDeliveryUrl(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2">
                  <ArrowRight01Icon className="h-4 w-4" />
                  <span>Publish for Client Review</span>
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* LOG INVOICE MODAL */}
        {newInvoiceModal && (
          <Dialog open={newInvoiceModal} onOpenChange={setNewInvoiceModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log New Invoice</DialogTitle>
                <DialogDescription>Record a manual invoice in the agency financial ledger</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateInvoice} className="space-y-4 pt-2">
                <div>
                  <Label required>Client Name</Label>
                  <Input
                    placeholder="Client or Brand Name"
                    value={newInvoiceForm.clientName}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, clientName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label required>Project Title</Label>
                  <Input
                    placeholder="e.g. 5x Reels Batch"
                    value={newInvoiceForm.projectTitle}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, projectTitle: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Amount</Label>
                    <Input
                      type="number"
                      value={newInvoiceForm.amount}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, amount: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label required>Currency</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC]"
                      value={newInvoiceForm.currency}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, currency: e.target.value as any })}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="ETB">ETB (Birr)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Input
                    placeholder="e.g. Bank Transfer, Telebirr, CBE, Wire"
                    value={newInvoiceForm.paymentMethod}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, paymentMethod: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Save Invoice</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* LOG EXPENSE MODAL */}
        {newExpenseModal && (
          <Dialog open={newExpenseModal} onOpenChange={setNewExpenseModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Agency Expense</DialogTitle>
                <DialogDescription>Track software subscriptions, assets, plugins, or gear</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateExpense} className="space-y-4 pt-2">
                <div>
                  <Label required>Expense Title</Label>
                  <Input
                    placeholder="e.g. Adobe Creative Cloud, Envato Elements"
                    value={newExpenseForm.title}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Amount</Label>
                    <Input
                      type="number"
                      value={newExpenseForm.amount}
                      onChange={(e) => setNewExpenseForm({ ...newExpenseForm, amount: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label required>Category</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC]"
                      value={newExpenseForm.category}
                      onChange={(e) => setNewExpenseForm({ ...newExpenseForm, category: e.target.value as any })}
                    >
                      <option value="software">Software</option>
                      <option value="assets">Assets / Stock</option>
                      <option value="gear">Gear & Hardware</option>
                      <option value="marketing">Marketing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full">Log Expense</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* NEW PROPOSAL MODAL */}
        {newProposalModal && (
          <Dialog open={newProposalModal} onOpenChange={setNewProposalModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Client Proposal</DialogTitle>
                <DialogDescription>
                  Craft a formal agreement. Work initiates only after client accepts.
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-4 pt-2">
                {/* Client Picker */}
                <div className="space-y-2 p-3 rounded-xl bg-[#F9F8F5] dark:bg-[#1E1C1A] border border-[#E5E5EA] dark:border-[#33302C]">
                  <Label required>Select Registered Client</Label>
                  <select
                    className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC]"
                    value={newProposalForm.clientId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const c = clients.find((client) => client._id === selectedId);
                      if (c) {
                        setNewProposalForm({
                          ...newProposalForm,
                          clientId: c._id,
                          clientName: c.name || "",
                          clientEmail: c.email || "",
                          clientTelegram: c.telegramUsername || c.telegramChatId || "",
                        });
                      } else {
                        setNewProposalForm({
                          ...newProposalForm,
                          clientId: "",
                        });
                      }
                    }}
                  >
                    <option value="">-- Choose registered client ({clients.length} clients) --</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} &bull; {c.email} {c.telegramUsername ? `(@${c.telegramUsername})` : ""}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                    <div>
                      <Label className="text-[11px]">Client Name</Label>
                      <Input
                        placeholder="Client Name"
                        value={newProposalForm.clientName}
                        onChange={(e) => setNewProposalForm({ ...newProposalForm, clientName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]" required>Client Email</Label>
                      <Input
                        type="email"
                        placeholder="client@domain.com"
                        value={newProposalForm.clientEmail}
                        onChange={(e) => setNewProposalForm({ ...newProposalForm, clientEmail: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Client Telegram</Label>
                      <Input
                        placeholder="@username or Chat ID"
                        value={newProposalForm.clientTelegram}
                        onChange={(e) => setNewProposalForm({ ...newProposalForm, clientTelegram: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Proposal Title */}
                <div>
                  <Label required>Project Agreement Title</Label>
                  <Input
                    placeholder="e.g. 5x Viral Reels - October Launch"
                    value={newProposalForm.title}
                    onChange={(e) => setNewProposalForm({ ...newProposalForm, title: e.target.value })}
                    required
                  />
                </div>

                {/* Format, Style, Tier */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label required>Format</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC]"
                      value={newProposalForm.format}
                      onChange={(e) => setNewProposalForm({ ...newProposalForm, format: e.target.value as any })}
                    >
                      <option value="short_form">Short Form (Reels/TikTok)</option>
                      <option value="long_form">Long Form (YouTube/Course)</option>
                    </select>
                  </div>

                  <div>
                    <Label required>Style</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC]"
                      value={newProposalForm.style}
                      onChange={(e) => setNewProposalForm({ ...newProposalForm, style: e.target.value as any })}
                    >
                      <option value="viral_animation">Viral Animation (Hormozi / Vox)</option>
                      <option value="cinematic_vlog">Cinematic Vlog (Magnates)</option>
                      <option value="talking_head">Talking Head (Ali Abdaal)</option>
                      <option value="documentarian">Documentarian (Johnny Harris)</option>
                      <option value="faceless_automation">Faceless / Cash-cow</option>
                    </select>
                  </div>

                  <div>
                    <Label required>Package Tier</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC]"
                      value={newProposalForm.tier}
                      onChange={(e) => setNewProposalForm({ ...newProposalForm, tier: e.target.value as any })}
                    >
                      <option value="starter">Starter Cut</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                {/* Price, Currency, Revisions, Deadline */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label required>Price</Label>
                    <Input
                      type="number"
                      value={newProposalForm.price}
                      onChange={(e) => setNewProposalForm({ ...newProposalForm, price: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <Label required>Currency</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC]"
                      value={newProposalForm.currency}
                      onChange={(e) => setNewProposalForm({ ...newProposalForm, currency: e.target.value as any })}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="ETB">ETB (Birr)</option>
                    </select>
                  </div>

                  <div>
                    <Label required>Revisions Allowed</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={newProposalForm.revisionsAllowed}
                      onChange={(e) => setNewProposalForm({ ...newProposalForm, revisionsAllowed: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <Label required>Target Deadline</Label>
                    <Input
                      type="date"
                      value={newProposalForm.deadline}
                      onChange={(e) => setNewProposalForm({ ...newProposalForm, deadline: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Editor & Footage URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label required>Assigned Production Lead</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC]"
                      value={newProposalForm.assignedEditor}
                      onChange={(e) => setNewProposalForm({ ...newProposalForm, assignedEditor: e.target.value as any })}
                    >
                      <option value="amir">Amir &bull; Senior Lead Editor</option>
                      <option value="aymen">Aymen &bull; Creative Director</option>
                    </select>
                  </div>

                  <div>
                    <Label>Footage / Brief URL (Optional)</Label>
                    <Input
                      placeholder="https://drive.google.com/..."
                      value={newProposalForm.footageUrl}
                      onChange={(e) => setNewProposalForm({ ...newProposalForm, footageUrl: e.target.value })}
                    />
                  </div>
                </div>

                {/* Scope Notes */}
                <div>
                  <Label>Scope Notes & Agreed Deliverables</Label>
                  <textarea
                    rows={3}
                    className="flex w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2.5 text-sm text-[#181818] dark:text-[#F5F3EC] focus:outline-none focus:ring-1 focus:ring-brand-brown dark:focus:ring-brand-terracotta"
                    placeholder="Specific inclusions: Sound design, Alex Hormozi captions, motion graphics, 2 revisions..."
                    value={newProposalForm.notes}
                    onChange={(e) => setNewProposalForm({ ...newProposalForm, notes: e.target.value })}
                  />
                </div>

                {/* Submission Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5EA] dark:border-[#33302C]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => handleCreateProposal(e, "draft")}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={(e) => handleCreateProposal(e, "sent")}
                  >
                    Send to Client Now
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* VERSION PROPOSAL MODAL */}
        {versionModalProposal && (
          <Dialog open={!!versionModalProposal} onOpenChange={() => setVersionModalProposal(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Create Revised Terms (v{versionModalProposal.currentVersion + 1})
                </DialogTitle>
                <DialogDescription>
                  For {versionModalProposal.proposalNumber} &bull; {versionModalProposal.clientName}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateNewVersion} className="space-y-4 pt-2">
                <div>
                  <Label required>Agreement Title</Label>
                  <Input
                    value={versionForm.title}
                    onChange={(e) => setVersionForm({ ...versionForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Agreed Price</Label>
                    <Input
                      type="number"
                      value={versionForm.price}
                      onChange={(e) => setVersionForm({ ...versionForm, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label required>Currency</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC]"
                      value={versionForm.currency}
                      onChange={(e) => setVersionForm({ ...versionForm, currency: e.target.value as any })}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="ETB">ETB (Birr)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Revisions Allowed</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={versionForm.revisionsAllowed}
                      onChange={(e) => setVersionForm({ ...versionForm, revisionsAllowed: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label required>Target Deadline</Label>
                    <Input
                      type="date"
                      value={versionForm.deadline}
                      onChange={(e) => setVersionForm({ ...versionForm, deadline: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label required>Assigned Production Lead</Label>
                  <select
                    className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC]"
                    value={versionForm.assignedEditor}
                    onChange={(e) => setVersionForm({ ...versionForm, assignedEditor: e.target.value as any })}
                  >
                    <option value="amir">Amir &bull; Senior Lead Editor</option>
                    <option value="aymen">Aymen &bull; Creative Director</option>
                  </select>
                </div>

                <div>
                  <Label>Negotiation Notes / Changelog</Label>
                  <textarea
                    rows={3}
                    className="flex w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2.5 text-sm text-[#181818] dark:text-[#F5F3EC] focus:outline-none focus:ring-1 focus:ring-brand-brown dark:focus:ring-brand-terracotta"
                    placeholder="e.g. Adjusted price to 4,500 ETB and added 1 extra revision as requested by client."
                    value={versionForm.notes}
                    onChange={(e) => setVersionForm({ ...versionForm, notes: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Dispatch Revised Version (v{versionModalProposal.currentVersion + 1})
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
