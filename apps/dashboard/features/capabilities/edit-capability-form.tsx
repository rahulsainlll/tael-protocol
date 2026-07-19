"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button, Input } from "@tael/ui";
import { editCapability } from "./actions";
import { HTTP_METHODS } from "./kind-fields";

/** A single editable operation row in the form. */
export interface EditOperation {
  name: string;
  method: string;
  path: string;
  price: string;
  sampleRequest: string;
  sampleResponse: string;
}

/** The capability data the form is prefilled from (plain + serializable). */
export interface EditCapabilityData {
  id: string;
  name: string;
  kind: string;
  description: string;
  logoUrl: string;
  contact: string;
  visibility: string;
  payTo: string;
  upstreamUrl: string;
  authScheme: "bearer" | "header" | "none";
  authHeader: string;
  authExtraHeaders: string;
  hasSecret: boolean;
  operations: EditOperation[];
}

const fieldClass = "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm";

/**
 * Edit an existing capability: its metadata, payout, upstream connection, and
 * the list of priced operations. The upstream secret is never shown; leaving it
 * blank keeps the current one. Only the owner (or a Tael admin) can save.
 */
export function EditCapabilityForm({ data }: { data: EditCapabilityData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(data.name);
  const [description, setDescription] = useState(data.description);
  const [contact, setContact] = useState(data.contact);
  const [payTo, setPayTo] = useState(data.payTo);
  const [upstreamUrl, setUpstreamUrl] = useState(data.upstreamUrl);
  const [upstreamSecret, setUpstreamSecret] = useState("");
  const [authScheme, setAuthScheme] = useState(data.authScheme);
  const [authHeader, setAuthHeader] = useState(data.authHeader);
  const [authExtraHeaders, setAuthExtraHeaders] = useState(data.authExtraHeaders);
  const [visibility, setVisibility] = useState(data.visibility);
  const [operations, setOperations] = useState<EditOperation[]>(
    data.operations.length > 0
      ? data.operations
      : [{ name: "", method: "POST", path: "", price: "", sampleRequest: "", sampleResponse: "" }],
  );

  function updateOp(i: number, patch: Partial<EditOperation>) {
    setOperations((prev) => prev.map((op, j) => (j === i ? { ...op, ...patch } : op)));
  }
  function addOp() {
    setOperations((prev) => [
      ...prev,
      { name: "", method: "POST", path: "", price: "", sampleRequest: "", sampleResponse: "" },
    ]);
  }
  function removeOp(i: number) {
    setOperations((prev) => prev.filter((_, j) => j !== i));
  }

  function save() {
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("kind", data.kind);
    fd.set("description", description);
    fd.set("logoUrl", data.logoUrl);
    fd.set("contact", contact);
    fd.set("payTo", payTo);
    fd.set("upstreamUrl", upstreamUrl);
    fd.set("upstreamSecret", upstreamSecret);
    fd.set("authScheme", authScheme);
    fd.set("authHeader", authHeader);
    fd.set("authExtraHeaders", authExtraHeaders);
    fd.set("visibility", visibility);
    fd.set("operations", JSON.stringify(operations));

    startTransition(async () => {
      const res = await editCapability(data.id, fd);
      if (res.ok) router.push(`/marketplace/${res.slug}`);
      else setError(res.error ?? "Could not save.");
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Field label="Product name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Description">
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Support contact" hint="Email, link, or @handle buyers can reach you at.">
        <Input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>

      <Field label="Pay to" hint="The Stellar address that receives your USDC earnings.">
        <Input value={payTo} onChange={(e) => setPayTo(e.target.value)} placeholder="G…" />
      </Field>

      <Field label="Visibility">
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className={fieldClass}
        >
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="private">Private</option>
        </select>
      </Field>

      <div className="space-y-4 rounded-xl border p-4">
        <p className="text-sm font-medium">Connection</p>
        <Field label="Endpoint URL">
          <Input
            value={upstreamUrl}
            onChange={(e) => setUpstreamUrl(e.target.value)}
            placeholder="https://…"
          />
        </Field>
        <Field
          label="Upstream secret"
          hint={
            data.hasSecret
              ? "Leave blank to keep the current key."
              : "Add a key if your endpoint needs one."
          }
        >
          <Input
            value={upstreamSecret}
            onChange={(e) => setUpstreamSecret(e.target.value)}
            type="password"
            placeholder={data.hasSecret ? "•••••••• (unchanged)" : "sk-…"}
          />
        </Field>
        <Field
          label="Auth scheme"
          hint="How Tael sends your secret. Use a header like x-api-key for Anthropic."
        >
          <select
            value={authScheme}
            onChange={(e) => setAuthScheme(e.target.value as EditCapabilityData["authScheme"])}
            className={fieldClass}
          >
            <option value="bearer">Bearer (Authorization: Bearer …)</option>
            <option value="header">Custom header (e.g. x-api-key)</option>
            <option value="none">None (no secret sent)</option>
          </select>
        </Field>
        {authScheme === "header" ? (
          <Field label="Header name">
            <Input
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
              placeholder="x-api-key"
            />
          </Field>
        ) : null}
        <Field label="Extra headers" hint="Static headers, one per line as Name: value.">
          <textarea
            rows={2}
            value={authExtraHeaders}
            onChange={(e) => setAuthExtraHeaders(e.target.value)}
            placeholder="anthropic-version: 2023-06-01"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs"
          />
        </Field>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Requests</span>
          <button
            type="button"
            onClick={addOp}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> Add request
          </button>
        </div>
        {operations.map((op, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <select
                value={op.method}
                onChange={(e) => updateOp(i, { method: e.target.value })}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
              >
                {HTTP_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <Input
                value={op.name}
                onChange={(e) => updateOp(i, { name: e.target.value })}
                placeholder="Request name"
                className="h-8"
              />
              {operations.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeOp(i)}
                  aria-label="Remove request"
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Path" hint="Appended to the endpoint URL, e.g. /swap.">
                <Input
                  value={op.path}
                  onChange={(e) => updateOp(i, { path: e.target.value })}
                  placeholder="/…"
                />
              </Field>
              <Field label="Price" hint="USDC per call. 0 = free.">
                <Input
                  value={op.price}
                  onChange={(e) => updateOp(i, { price: e.target.value })}
                  placeholder="0.01"
                />
              </Field>
            </div>
            <Field label="Sample request">
              <textarea
                rows={2}
                value={op.sampleRequest}
                onChange={(e) => updateOp(i, { sampleRequest: e.target.value })}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs"
              />
            </Field>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending || !name.trim()}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
