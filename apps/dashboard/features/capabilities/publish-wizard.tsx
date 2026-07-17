"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  FlaskConical,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button, cn, Input } from "@tael/ui";
import { generateQuestions, publishCapability, testRequest, type TestResult } from "./actions";
import { formatPrice, kindMeta } from "./kind-meta";
import { CapabilityLogo } from "./capability-logo";
import { LogoField } from "./logo-field";
import { HTTP_METHODS, kindFields } from "./kind-fields";

const KINDS = ["api", "mcp", "agent", "model", "dataset", "credit"] as const;
type Kind = (typeof KINDS)[number];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// The USDC issuer Tael settles in. A payout wallet MUST hold a trustline for
// this issuer, or Stellar rejects the payment (op_no_trust). Shown to publishers
// so they set it up before listing.
const USDC_ISSUER =
  process.env.NEXT_PUBLIC_USDC_ISSUER ?? "GBCDXWBEN7YMCBI3DPIWQ5QBGG2NE7G5REZLNJI2E57VVNVDQM7PF7RA";

type Step = "describe" | "test" | "verify" | "done";
type Answer = { question: string; answer: string };
type Operation = {
  name: string;
  path: string;
  method: string;
  sampleRequest: string;
  sampleResponse: string;
  price: string;
};

function newOperation(): Operation {
  return { name: "", path: "", method: "POST", sampleRequest: "", sampleResponse: "", price: "" };
}

/** Restrained HTTP-method tints (subtle, not the loud Swagger palette). */
const METHOD_COLORS: Record<string, string> = {
  GET: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  POST: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  PUT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PATCH: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  DELETE: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

/** A small colored method chip for a request row. */
function MethodBadge({ method }: { method: string }) {
  const m = (method || "POST").toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-md px-2 font-mono text-[11px] font-semibold tracking-wide",
        METHOD_COLORS[m] ?? "bg-muted text-muted-foreground",
      )}
    >
      {m}
    </span>
  );
}

/** Price summary on a request row: a "Free" pill for 0, else "$X/call". */
function PriceTag({ price }: { price: string }) {
  if (!price.trim()) {
    return <span className="shrink-0 text-xs text-muted-foreground">Set price</span>;
  }
  if (Number(price) <= 0) {
    return (
      <span className="shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        Free
      </span>
    );
  }
  return (
    <span className="shrink-0 text-xs font-medium tabular-nums">
      ${price}
      <span className="text-muted-foreground">/call</span>
    </span>
  );
}

export function PublishWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("describe");
  const [kind, setKind] = useState<Kind>("api");
  const [operations, setOperations] = useState<Operation[]>([newOperation()]);
  // Which request row is expanded for editing (accordion). -1 = all collapsed.
  const [openOp, setOpenOp] = useState<number>(0);

  function addOp() {
    setOpenOp(operations.length); // open the row we're about to add
    setOperations((prev) => [...prev, newOperation()]);
  }

  function removeOp(i: number) {
    setOperations((prev) => prev.filter((_, j) => j !== i));
    setOpenOp((cur) => (cur === i ? -1 : cur > i ? cur - 1 : cur));
  }
  // Describe-step fields live in state (controlled) so they survive navigating
  // back and forth between steps instead of resetting.
  const [describe, setDescribe] = useState<Record<string, string>>({ visibility: "public" });
  const [results, setResults] = useState<Record<number, TestResult>>({});
  const [testingIndex, setTestingIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
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
    const base = describe.upstreamUrl ?? "";
    const url = op.path ? `${base.replace(/\/+$/, "")}/${op.path.replace(/^\/+/, "")}` : base;
    startTransition(async () => {
      const res = await testRequest({
        name: op.name || `Request ${i + 1}`,
        url,
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
  const headlinePrice =
    operations
      .map((o) => o.price)
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b))[0] ?? "0";

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
            <Field label="Product name" required>
              <Input
                value={describe.name ?? ""}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Document OCR"
                required
              />
            </Field>

            <Field label="Logo">
              <LogoField
                value={describe.logoUrl ?? ""}
                kind={kind}
                name={describe.name || "?"}
                onChange={(v) => setField("logoUrl", v)}
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

            <Field label="Description" required>
              <textarea
                value={describe.description ?? ""}
                onChange={(e) => setField("description", e.target.value)}
                required
                rows={3}
                placeholder="What does it do, and what should a buyer expect?"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Contact" hint="Where buyers can reach you about this capability.">
              <Input
                value={describe.contact ?? ""}
                onChange={(e) => setField("contact", e.target.value)}
                placeholder="you@example.com, a link, or @handle"
              />
            </Field>

            <Field label={fields.urlLabel} required>
              <Input
                value={describe.upstreamUrl ?? ""}
                onChange={(e) => setField("upstreamUrl", e.target.value)}
                type="url"
                placeholder={fields.urlPlaceholder}
                required
              />
            </Field>

            <Field
              label="Upstream secret"
              hint="Your key for the endpoint above. We encrypt it and add it to every call, so buyers never see it."
            >
              <Input
                value={describe.upstreamSecret ?? ""}
                onChange={(e) => setField("upstreamSecret", e.target.value)}
                type="password"
                placeholder="sk-…"
              />
            </Field>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Requests</span>
                <button
                  type="button"
                  onClick={addOp}
                  className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground"
                >
                  <Plus className="h-4 w-4" /> Add request
                </button>
              </div>

              <div className="divide-y overflow-hidden rounded-xl border">
                {operations.map((op, i) => {
                  const open = openOp === i;
                  return (
                    <div key={i}>
                      {/* Summary row — click to expand its editor. */}
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setOpenOp(open ? -1 : i)}
                          className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
                        >
                          {fields.method ? <MethodBadge method={op.method} /> : null}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {op.name || (
                                <span className="text-muted-foreground">Untitled request</span>
                              )}
                            </span>
                            {op.path ? (
                              <span className="block truncate font-mono text-xs text-muted-foreground">
                                {op.path}
                              </span>
                            ) : null}
                          </span>
                          <PriceTag price={op.price} />
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                              open && "rotate-180",
                            )}
                          />
                        </button>
                        {operations.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeOp(i)}
                            aria-label="Remove request"
                            className="px-3 text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>

                      {/* Editor — revealed for the open row. */}
                      {open ? (
                        <div className="space-y-3 border-t bg-muted/20 px-3.5 py-4 duration-150 ease-out animate-in fade-in slide-in-from-top-1">
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
                            <Field label="Name">
                              <Input
                                value={op.name}
                                onChange={(e) => updateOp(i, { name: e.target.value })}
                                placeholder="Extract text"
                              />
                            </Field>
                            <Field label="Price" required>
                              <Input
                                value={op.price}
                                onChange={(e) => updateOp(i, { price: e.target.value })}
                                placeholder="0.02"
                                required
                              />
                            </Field>
                          </div>

                          <Field
                            label="Path"
                            hint="Added to the endpoint URL for this request. Leave empty to call the base URL."
                          >
                            <Input
                              value={op.path}
                              onChange={(e) => updateOp(i, { path: e.target.value })}
                              placeholder="/swap"
                            />
                          </Field>

                          <Field
                            label={fields.requestLabel}
                            hint="Shown on the listing and used to test this request."
                          >
                            <textarea
                              rows={4}
                              value={op.sampleRequest}
                              onChange={(e) => updateOp(i, { sampleRequest: e.target.value })}
                              placeholder={fields.requestPlaceholder}
                              className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs"
                            />
                          </Field>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                Set a price of <span className="font-medium text-foreground">0</span> to make a
                request free.
              </p>
            </div>

            <Field
              label="Pay to"
              required
              hint="The Stellar address that receives your USDC earnings."
            >
              <Input
                value={describe.payTo ?? ""}
                onChange={(e) => setField("payTo", e.target.value)}
                placeholder="G…"
                required
              />
            </Field>

            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2.5 text-xs text-amber-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0">
                Your pay-to wallet must hold a <span className="font-semibold">USDC trustline</span>{" "}
                for Tael&apos;s issuer, or payments will be rejected on-chain. Add a trustline to:
                <span className="mt-1 block break-all font-mono text-[11px] text-amber-800">
                  {USDC_ISSUER}
                </span>
              </span>
            </div>

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
                disabled={pending || answers.some((a) => a.answer.trim().length < 8)}
              >
                {pending ? "Publishing…" : "Publish capability"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-md space-y-6 animate-in fade-in duration-300">
          <div className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Published and verified
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {describe.name || "Your capability"} is live
            </h1>
            <p className="text-sm text-muted-foreground">
              Agents can discover it and pay per call in USDC now.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <CapabilityLogo
                src={describe.logoUrl}
                name={describe.name || "?"}
                kind={kind}
                className="h-11 w-11"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{describe.name}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live · ${formatPrice(headlinePrice)} USDC/call
                </p>
              </div>
            </div>
            {publishedSlug ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                  {API_URL}/c/{publishedSlug}
                </code>
                <button
                  type="button"
                  aria-label="Copy endpoint"
                  onClick={() => {
                    void navigator.clipboard.writeText(`${API_URL}/c/${publishedSlug}`);
                    setCopiedEndpoint(true);
                    setTimeout(() => setCopiedEndpoint(false), 1500);
                  }}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {copiedEndpoint ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            {publishedSlug ? (
              <Button asChild className="flex-1">
                <Link href={`/marketplace/${publishedSlug}`}>
                  <ExternalLink className="h-4 w-4" /> View listing
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="flex-1">
              <Link href="/capabilities">My Capabilities</Link>
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
  const activeIndex = step === "describe" ? 0 : step === "test" ? 1 : step === "verify" ? 2 : 3;

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

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {hint ? (
        <span className="block text-xs leading-snug text-muted-foreground">{hint}</span>
      ) : null}
      {children}
    </label>
  );
}
