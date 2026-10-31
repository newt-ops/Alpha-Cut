import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InquirySchema, type Inquiry, EDITING_STYLES } from "@alpha-cut/types";
import { ArrowRight01Icon, CheckmarkCircle02Icon } from "hugeicons-react";
import { Button, Input, Textarea, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, notify } from "@alpha-cut/ui";

export function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Inquiry>({
    resolver: zodResolver(InquirySchema),
    defaultValues: {
      format: "short_form",
      style: "hook_talking_head",
    },
  });

  const onSubmit = async (data: Inquiry) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to submit inquiry");
      }

      setSubmitted(true);
      notify.success("Inquiry received!", "Amir & Aymen will review your brief within 24 hours.");
      reset();
    } catch {
      notify.error("Submission failed", "Please try again or contact us directly on Telegram @alpha_cut_bot");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="inquiry" className="py-24 bg-black/[0.02] dark:bg-white/[0.01] border-t border-[#E5E5EA] dark:border-[#33302C]">
      <div className="max-w-3xl mx-auto px-6">
        <Card className="border border-[#E5E5EA] dark:border-[#33302C] shadow-lg">
          <CardHeader className="text-center pb-8 border-b border-[#E5E5EA] dark:border-[#33302C]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-brown dark:text-brand-terracotta mb-1 block">
              Direct Agency Inquiry
            </span>
            <CardTitle className="text-3xl font-extrabold">Start a Project with Alpha Cut</CardTitle>
            <CardDescription className="text-sm max-w-md mx-auto mt-2">
              Tell us about your footage, content goals, and timeline. You'll receive a detailed scope breakdown and proposal within 24 hours.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckmarkCircle02Icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-[#181818] dark:text-[#F5F3EC]">Brief Received!</h3>
                <p className="text-sm text-[#868686] dark:text-[#8C8A89] max-w-md mx-auto">
                  We've sent a confirmation email with details. Amir and Aymen are reviewing your project.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="https://t.me/alpha_cut_bot"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button variant="primary" className="w-full">
                      Open Telegram Bot (@alpha_cut_bot)
                    </Button>
                  </a>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Submit Another Brief
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label required>Your Name</Label>
                    <Input
                      placeholder="Jane Doe"
                      {...register("name")}
                      error={errors.name?.message}
                    />
                  </div>
                  <div>
                    <Label required>Work / Creator Email</Label>
                    <Input
                      type="email"
                      placeholder="jane@brand.com"
                      {...register("email")}
                      error={errors.email?.message}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Brand / Creator Social Handle</Label>
                    <Input
                      placeholder="@handle or youtube.com/@channel"
                      {...register("brandHandle")}
                    />
                  </div>
                  <div>
                    <Label>Telegram Username (For Instant Bot Updates)</Label>
                    <Input
                      placeholder="@yourusername"
                      {...register("telegramUsername")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label required>Video Format</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown dark:focus-visible:ring-brand-terracotta"
                      {...register("format")}
                    >
                      <option value="short_form">Short-Form (9:16 Vertical - Reels/TikTok/Shorts)</option>
                      <option value="long_form">Long-Form (16:9 Widescreen - YouTube/Podcasts)</option>
                    </select>
                  </div>
                  <div>
                    <Label required>Target Editing Style</Label>
                    <select
                      className="flex h-11 w-full rounded-xl border border-[#E5E5EA] dark:border-[#33302C] bg-white dark:bg-[#161412] px-4 py-2 text-sm text-[#181818] dark:text-[#F5F3EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brown dark:focus-visible:ring-brand-terracotta"
                      {...register("style")}
                    >
                      {Object.values(EDITING_STYLES).map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Budget Range (USD or ETB)</Label>
                  <Input
                    placeholder="e.g. $500 - $1,500 / month, or ETB 20,000"
                    {...register("budget")}
                  />
                </div>

                <div>
                  <Label required>Project Scope & Footage Details</Label>
                  <Textarea
                    placeholder="Tell us what you're creating, expected turnaround time, footage links (Google Drive, Frame.io, Dropbox), and any reference links."
                    {...register("notes")}
                    error={errors.notes?.message}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full justify-center gap-2"
                  isLoading={submitting}
                >
                  <span>Submit Project Brief</span>
                  <ArrowRight01Icon className="h-4 w-4" />
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

