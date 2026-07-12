"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from "@tael/ui";
import { deleteCapability } from "./actions";
import type { CapabilityListItem } from "./list-item";

const CONFIRM_WORD = "delete";

export function DeleteCapabilityDialog({
  item,
  onClose,
}: {
  item: CapabilityListItem | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Reset the typed confirmation whenever the target changes.
  useEffect(() => {
    setValue("");
    setError(null);
  }, [item?.id]);

  const canDelete = value.trim().toLowerCase() === CONFIRM_WORD;

  function onConfirm() {
    if (!item || !canDelete) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCapability(item.id);
      if (result.ok) {
        onClose();
        router.refresh();
      } else {
        setError(result.error ?? "Could not delete.");
      }
    });
  }

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <DialogTitle className="pt-2">Delete capability</DialogTitle>
          <DialogDescription>
            This permanently removes{" "}
            <span className="font-medium text-foreground">{item?.name}</span> from the marketplace.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Type <span className="font-mono font-semibold text-foreground">{CONFIRM_WORD}</span> to
            confirm
          </label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={CONFIRM_WORD}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && canDelete) onConfirm();
            }}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
            disabled={!canDelete || pending}
          >
            {pending ? "Deleting…" : "Delete capability"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
