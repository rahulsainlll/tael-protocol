"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  FlaskConical,
  PartyPopper,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button, cn, Input } from "@tael/ui";
import { generateQuestions, publishCapability, testRequest, type TestResult } from "./actions";
import { kindMeta } from "./kind-meta";
import { HTTP_METHODS, kindFields } from "./kind-fields";

const KINDS = ["api", "mcp", "agent", "model", "dataset"] as const;
type Kind = (typeof KINDS)[number];

type Step = "describe" | "test" | "verify" | "done";
type Answer = { question: string; answer: string };
type Operation = {
  name: string;
  method: string;
  sampleRequest: string;
  sampleResponse: string;
  price: string;
};

function newOperation(): Operation {
  return { name: "", method: "POST", sampleRequest: "", sampleResponse: "", price: "" };
}

export function PublishWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("describe");
  const [kind, setKind] = useState<Kind>("api");
  const [operations, setOperations] = useState<Operation[]>([newOperation()]);
  // Describe-step fields live in state (controlled) so they survive navigating
  // back and forth between steps instead of resetting.
  const [describe, setDescribe] = useState<Record<string, string>>({ visibility: "public" });
  const [results, setResults] = useState<Record<number, TestResult>>({});
  const [testingIndex, setTestingIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fields = kindFields(kind);

  function setField(key: string, value: string) {
    setDescribe((prev) => ({ ...prev, [key]: value }));
  }

  function updateOp(i: number, patch: Partial<Operation>) {
    setOperations((prev) => prev.map((op, j) => (j === i ? { ...op, ...patch } : op)));
    // Editing a request invalidates its previous test result.
    setResults((prev) => {
      if (!prev[i]) return prev;
      const next = { ...prev };
      delete next[i];
      return next;
    });
  }

  // Step 1 → 2: validate the (already-captured) metadata and move to Test.
  function onDescribe() {
    setError(null);
    if (
      !describe.name?.trim() ||
      !describe.description?.trim() ||
      !describe.upstreamUrl?.trim() ||
      !describe.payTo?.trim()
    ) {
      setError("Fill in name, description, endpoint URL, and pay-to.");
      return;
    }
    if (operations.some((op) => !op.price.trim())) {
      setError("Each request needs a price.");
      return;
    }
    setStep("test");
  }

  // Test one request live; on success, capture the response as its sample.
  function testOne(i: number) {
    setError(null);
    setTestingIndex(i);
    const op = operations[i]!;
    startTransition(async () => {
      const res = await testRequest({
        name: op.name || `Request ${i + 1}`,
        url: describe.upstreamUrl ?? "",
        method: op.method || "POST",
        body: op.sampleRequest,
        secret: describe.upstreamSecret ?? "",
      });
      setTestingIndex(null);
      if (!res.ok || !res.result) {
        setError(res.error ?? "Test failed.");
        return;
      }
      setResults((prev) => ({ ...prev, [i]: res.result! }));
      if (res.result.ok) {
        setOperations((prev) =>
          prev.map((o, j) => (j === i ? { ...o, sampleResponse: res.result!.response } : o)),
        );
      }
    });
  }

  const allTested = operations.every((_, i) => results[i]);
  const anyOk = operations.some((_, i) => results[i]?.ok);

  // Step 2 → 3: generate FAQ questions from the real captured response. Only
  // generate once — re-entering Verify keeps the answers the publisher typed.
  function continueToVerify() {
    setError(null);
    if (answers.length > 0) {
      setStep("verify");
      return;
    }
    const okIdx = operations.findIndex((_, i) => results[i]?.ok);
    startTransition(async () => {
      const res = await generateQuestions({
        kind,
        name: describe.name ?? "",
        description: describe.description ?? "",
        sampleRequest: operations[0]?.sampleRequest,
        sampleResponse: okIdx >= 0 ? results[okIdx]!.response : undefined,
      });
      if (!res.ok || !res.questions) {
        setError(res.error ?? "Could not generate questions.");
        return;
      }
      setAnswers(res.questions.map((question) => ({ question, answer: "" })));
      setStep("verify");
    });
  }

  function onPublish() {
    setError(null);
    const formData = new FormData();
    Object.entries(describe).forEach(([k, v]) => formData.set(k, v));
    formData.set("kind", kind);
    formData.set("operations", JSON.stringify(operations));
    formData.set("faqs", JSON.stringify(answers));
    startTransition(async () => {
      const result = await publishCapability(formData);
      if (result.ok) {
        setPublishedSlug(result.slug ?? null);
        setStep("done");
        // Refresh the list in the background so it's current when they go back.
        router.refresh();
      } else {
        setError(result.error ?? "Could not publish.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Link
        href="/capabilities"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> My Capabilities
      </Link>

      <StepIndicator step={step} />

      {step === "describe" ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Describe your capability</h1>
            <p className="text-sm text-muted-foreground">
              Add one or more requests, each with its own price. Next, you&apos;ll test them live.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onDescribe();
            }}
            className="space-y-4"
          >
            <Field label="Name">
              <Input
                value={describe.name ?? ""}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Document OCR"
                required
              />
            </Field>

            <Field label="Kind">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {KINDS.map((k) => {
                  const km = kindMeta(k);
                  const Icon = km.icon;
                  return (
                    <label
                      key={k}
                      className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors has-[:checked]:border-foreground/30 has-[:checked]:bg-muted/50"
                    >
                      <input
                        type="radio"
                        name="kind"
                        value={k}
                        checked={kind === k}
                        onChange={() => setKind(k)}
                        className="sr-only"
                      />
                      <span className={cn("rounded-md p-1.5", km.tile)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {km.label}
                    </label>
                  );
                })}
              </div>
            </Field>

            <Field label="Visibility">
              <select
                value={describe.visibility ?? "public"}
                onChange={(e) => setField("visibility", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </Field>

            <Field label="Description">
              <textarea
                value={describe.description ?? ""}
                onChange={(e) => setField("description", e.target.value)}
                required
                rows={3}
                placeholder="What does it do, and what should a buyer expect?"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </Field>

            <Field label={fields.urlLabel}>
              <Input
                value={describe.upstreamUrl ?? ""}
                onChange={(e) => setField("upstreamUrl", e.target.value)}
                type="url"
                placeholder={fields.urlPlaceholder}
                required
              />
            </Field>

            <Field label="Upstream secret (encrypted at rest)">
              <Input
                value={describe.upstreamSecret ?? ""}
                onChange={(e) => setField("upstreamSecret", e.target.value)}
                type="password"
                placeholder="sk-… (optional)"
              />
            </Field>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Requests</span>
                <button
                  type="button"
                  onClick={() => setOperations((prev) => [...prev, newOperation()])}
                  className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground"
                >
                  <Plus className="h-4 w-4" /> Add request
                </button>
              </div>

              {operations.map((op, i) => (
                <div key={i} className="space-y-3 rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Request {i + 1}
                    </span>
                    {operations.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setOperations((prev) => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <div
                    className={cn(
                      "grid gap-3",
                      fields.method ? "grid-cols-[6rem_1fr_7rem]" : "grid-cols-[1fr_7rem]",
                    )}
                  >
                    {fields.method ? (
                      <Field label="Method">
                        <select
                          value={op.method}
                          onChange={(e) => updateOp(i, { method: e.target.value })}
                          className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                        >
                          {HTTP_METHODS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </Field>
                    ) : null}
                    <Field label="Label">
                      <Input
                        value={op.name}
                        onChange={(e) => updateOp(i, { name: e.target.value })}
                        placeholder="Extract text"
                      />
                    </Field>
                    <Field label="Price/call">
                      <Input
                        value={op.price}
                        onChange={(e) => updateOp(i, { price: e.target.value })}
                        placeholder="0.02"
                        required
                      />
                    </Field>
                  </div>

                  <Field label={`${fields.requestLabel} (optional)`}>
                    <textarea
                      rows={4}
                      value={op.sampleRequest}
                      onChange={(e) => updateOp(i, { sampleRequest: e.target.value })}
                      placeholder={fields.requestPlaceholder}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs"
                    />
                  </Field>
                </div>
              ))}
            </div>

            <Field label="Pay to (Stellar address)">
              <Input
                value={describe.payTo ?? ""}
                onChange={(e) => setField("payTo", e.target.value)}
                placeholder="G…"
                required
              />
            </Field>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full">
              Continue to test
            </Button>
          </form>
        </div>
      ) : step === "test" ? (
        <div className="space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <FlaskConical className="h-5 w-5 text-blue-500" /> Test your requests
            </h1>
            <p className="text-sm text-muted-foreground">
              Run each request against your endpoint. Edit the input and re-test if you need to.
            </p>
          </div>

          <div className="space-y-3">
            {operations.map((op, i) => {
              const result = results[i];
              return (
                <div key={i} className="space-y-3 rounded-xl border p-4">
                  <div className="flex items-center gap-2">
                    {result ? (
                      result.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    )}
                    {op.method ? (
                      <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-600">
                        {op.method}
                      </span>
                    ) : null}
                    <span className="font-medium">{op.name || `Request ${i + 1}`}</span>
                    {result ? (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-xs",
                          result.ok
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {result.status ? `HTTP ${result.status}` : "no response"}
                      </span>
                    ) : null}
                    <span className="ml-auto text-sm font-medium text-muted-foreground">
                      ${op.price} USDC/call
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={op.sampleRequest}
                    onChange={(e) => updateOp(i, { sampleRequest: e.target.value })}
                    placeholder={fields.requestPlaceholder}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testOne(i)}
                    disabled={testingIndex === i}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {testingIndex === i ? "Testing…" : result ? "Re-test" : "Test request"}
                  </Button>

                  {result?.error ? (
                    <p className="text-sm text-destructive">{result.error}</p>
                  ) : result ? (
                    <pre className="max-h-56 overflow-auto rounded-lg bg-muted/50 p-3 text-xs leading-relaxed">
                      <code>{result.response.slice(0, 4000)}</code>
                    </pre>
                  ) : null}
                </div>
              );
            })}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!anyOk ? (
              <p className="text-xs text-muted-foreground">
                Test at least one request successfully to continue.
              </p>
            ) : null}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("describe")}
                disabled={pending}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={continueToVerify}
                disabled={pending || !allTested || !anyOk}
              >
                {pending ? "Analyzing…" : "Continue to verify"}
              </Button>
            </div>
          </div>
        </div>
      ) : step === "verify" ? (
        <div className="space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Sparkles className="h-5 w-5 text-amber-500" /> Answer to get verified
            </h1>
            <p className="text-sm text-muted-foreground">
              AI wrote these from your real response. Buyers see your answers on the listing.
            </p>
          </div>

          <div className="space-y-4">
            {answers.map((item, i) => (
              <label key={i} className="block space-y-1.5">
                <span className="text-sm font-medium">{item.question}</span>
                <textarea
                  rows={2}
                  value={item.answer}
                  onChange={(e) =>
                    setAnswers((prev) =>
                      prev.map((a, j) => (j === i ? { ...a, answer: e.target.value } : a)),
                    )
                  }
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  placeholder="Your answer…"
                />
              </label>
            ))}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("test")}
                disabled={pending}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={onPublish}
                disabled={pending || answers.some((a) => a.answer.trim().length === 0)}
              >
                {pending ? "Publishing…" : "Publish capability"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/20" />
            <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <PartyPopper className="h-9 w-9 text-emerald-600" />
            </span>
          </div>

          <div className="animate-in fade-in zoom-in-95 space-y-3 duration-500">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">You&apos;re live</h1>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{describe.name}</span> is published and
              verified. Agents can discover it and pay per call in USDC now.
            </p>
          </div>

          <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
            {publishedSlug ? (
              <Button asChild className="w-full">
                <Link href={`/marketplace/${publishedSlug}`}>
                  <ExternalLink className="h-4 w-4" /> View live listing
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="w-full">
              <Link href="/capabilities">Back to My Capabilities</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { key: "describe", label: "Describe", icon: FileText },
    { key: "test", label: "Test", icon: FlaskConical },
    { key: "verify", label: "Verify", icon: Sparkles },
    { key: "done", label: "Publish", icon: Check },
  ];
  const activeIndex =
    step === "describe" ? 0 : step === "test" ? 1 : step === "verify" ? 2 : 3;

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={s.key} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-xs",
                done || active
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 ? <span className="h-px flex-1 bg-border" /> : null}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
