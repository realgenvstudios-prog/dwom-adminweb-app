import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import riderApplicationsService, { type DocRule, type DocumentType, type DocumentTypeInput } from '../../../services/riderApplicationsService';
import { logger } from '../../../utils/logger';
import { RULES, VEHICLES } from './application-meta';

const RULE_TONE: Record<DocRule, string> = {
  required: 'text-foreground font-medium',
  optional: 'text-muted-foreground',
  off: 'text-muted-foreground/60',
};

/** Which documents riders provide, per vehicle. Changes save as you make them. */
export default function DocumentRulesDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [types, setTypes] = useState<DocumentType[] | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    riderApplicationsService
      .documentTypes()
      .then(setTypes)
      .catch((err) => {
        logger.error('Failed to load document types:', err);
        toast.error('Couldn’t load the document list');
      });
  }, []);

  const save = async (t: DocumentType, patch: DocumentTypeInput) => {
    setTypes((list) => list?.map((x) => (x.id === t.id ? { ...x, ...patch, rules: { ...x.rules, ...patch.rules } } : x)) ?? null);
    setSavingId(t.id);
    try {
      const saved = await riderApplicationsService.updateDocumentType(t.id, patch);
      setTypes((list) => list?.map((x) => (x.id === t.id ? saved : x)) ?? null);
    } catch (err) {
      setTypes((list) => list?.map((x) => (x.id === t.id ? t : x)) ?? null);
      toast.error(err instanceof Error ? err.message : 'Couldn’t save');
    } finally {
      setSavingId(null);
    }
  };

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const created = await riderApplicationsService.createDocumentType({
        name: newName.trim(),
        rules: { motorbike: 'optional', bicycle: 'optional', car: 'optional' },
      });
      setTypes((list) => [...(list ?? []), created]);
      setNewName('');
      toast.success(`${created.name} added as optional for every vehicle`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t add it');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Rider documents</DialogTitle>
          <DialogDescription>
            Required documents must be uploaded before a rider can send their application. Optional ones are asked for but can be skipped. Off means riders with that vehicle never see it.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Document</TableHead>
                {VEHICLES.map((v) => (
                  <TableHead key={v.key}>{v.label}</TableHead>
                ))}
                <TableHead>Photos</TableHead>
                <TableHead className="text-center">Number</TableHead>
                <TableHead className="text-center">Expiry date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!types && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {types?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Input
                      defaultValue={t.name}
                      onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== t.name && void save(t, { name: e.target.value.trim() })}
                      className="h-8"
                    />
                    {savingId === t.id && <Loader2 className="mt-1 size-3 animate-spin text-muted-foreground" />}
                  </TableCell>
                  {VEHICLES.map((v) => {
                    const rule = t.rules[v.key] ?? 'off';
                    return (
                      <TableCell key={v.key}>
                        <Select value={rule} onValueChange={(value) => void save(t, { rules: { [v.key]: value as DocRule } })}>
                          <SelectTrigger size="sm" className={`w-[110px] ${RULE_TONE[rule]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RULES.map((r) => (
                              <SelectItem key={r.key} value={r.key}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <Select
                      value={t.capture === 'camera' ? 'camera' : String(t.sides)}
                      onValueChange={(value) => void save(t, value === 'camera' ? { capture: 'camera', sides: 1 } : { capture: 'upload', sides: Number(value) })}
                    >
                      <SelectTrigger size="sm" className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">One photo</SelectItem>
                        <SelectItem value="2">Front and back</SelectItem>
                        <SelectItem value="camera">Live selfie</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={t.hasNumber} onCheckedChange={(v) => void save(t, { hasNumber: v })} aria-label={`${t.name} asks for a number`} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={t.hasExpiry} onCheckedChange={(v) => void save(t, { hasExpiry: v })} aria-label={`${t.name} has an expiry date`} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void add()} placeholder="New document, e.g. Helmet photo" className="max-w-xs" />
          <Button variant="outline" onClick={() => void add()} disabled={adding || !newName.trim()}>
            {adding ? <Loader2 className="animate-spin" /> : <Plus />}
            Add document
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Payout account (MoMo or bank) and the safety briefing are always required; they aren’t documents. A newly required document doesn’t block riders already approved; they’re asked to add it from their profile.
        </p>
      </DialogContent>
    </Dialog>
  );
}
