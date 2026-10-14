import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import marketingService, {
  type NotificationTemplate,
} from "../../services/marketingService";
import { logger } from "../../utils/logger";

interface TemplateDialogProps {
  /** null = new. Mount with a fresh `key` per open. */
  template: NotificationTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function TemplateDialog({
  template,
  open,
  onOpenChange,
  onSaved,
}: TemplateDialogProps) {
  const [form, setForm] = useState({
    name: template?.name ?? "",
    description: template?.description ?? "",
    title: template?.title ?? "",
    body: template?.body ?? "",
    actionUrl: template?.actionUrl ?? "",
    inAppTitle: template?.inAppTitle ?? "",
    inAppBody: template?.inAppBody ?? "",
  });
  const [inbox, setInbox] = useState(
    !!(template?.inAppTitle || template?.inAppBody),
  );
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.name.trim()) return setProblem("Give the template a name.");
    if (!form.title.trim() || !form.body.trim())
      return setProblem("A title and message are required.");
    setProblem(null);
    const inAppTitle = inbox ? form.inAppTitle.trim() : "";
    const inAppBody = inbox ? form.inAppBody.trim() : "";
    try {
      setSaving(true);
      if (template) {
        // '' clears an optional field on the server; title/body are always set.
        await marketingService.updateTemplate(template.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          title: form.title.trim(),
          body: form.body.trim(),
          actionUrl: form.actionUrl.trim(),
          inAppTitle,
          inAppBody,
        });
        toast.success("Template saved");
      } else {
        await marketingService.createTemplate({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          title: form.title.trim(),
          body: form.body.trim(),
          actionUrl: form.actionUrl.trim() || undefined,
          inAppTitle: inAppTitle || undefined,
          inAppBody: inAppBody || undefined,
        });
        toast.success("Template created");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error("Failed to save template:", err);
      setProblem(
        err instanceof Error ? err.message : "Couldn’t save the template.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit template" : "New template"}
          </DialogTitle>
          <DialogDescription>
            A message you can send again and again. SMS and email use the same
            title and message.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="tp-name">Template name</Label>
            <Input
              id="tp-name"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Weekend restock"
              autoFocus={!template}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tp-title">Title</Label>
            <Input
              id="tp-title"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Fresh stock just landed 🍅"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tp-body">Message</Label>
            <Textarea
              id="tp-body"
              rows={3}
              value={form.body}
              onChange={(e) => set({ body: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tp-link">Link when tapped</Label>
            <Input
              id="tp-link"
              value={form.actionUrl}
              onChange={(e) => set({ actionUrl: e.target.value })}
              placeholder="Optional, e.g. dwom://"
            />
          </div>

          <div className="grid gap-3 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="tp-inbox">
                  Different text in the app inbox
                </Label>
                <p className="text-xs text-muted-foreground">
                  Otherwise the inbox shows the same title and message.
                </p>
              </div>
              <Switch
                id="tp-inbox"
                checked={inbox}
                onCheckedChange={setInbox}
              />
            </div>
            {inbox && (
              <div className="grid gap-3">
                <Input
                  aria-label="Inbox title"
                  value={form.inAppTitle}
                  onChange={(e) => set({ inAppTitle: e.target.value })}
                  placeholder="Inbox title"
                />
                <Textarea
                  aria-label="Inbox message"
                  rows={2}
                  value={form.inAppBody}
                  onChange={(e) => set({ inAppBody: e.target.value })}
                  placeholder="Inbox message"
                />
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tp-desc">Internal notes</Label>
            <Input
              id="tp-desc"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Optional — when to use it"
            />
          </div>
        </div>

        <DialogFooter className="items-center">
          {problem && (
            <p className="mr-auto text-sm text-destructive">{problem}</p>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {template ? "Save changes" : "Create template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
