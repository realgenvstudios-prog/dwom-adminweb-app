import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CustomerGroup } from '../../services/marketingService';
import customerGroupsService from '../../services/marketing/customerGroupsService';
import ridersService, { type Zone } from '../../services/ridersService';
import { logger } from '../../utils/logger';
import { AUDIENCES } from './campaign-meta';
import CustomerPicker from './CustomerPicker';
import { useCustomerDirectory } from './customer-directory';
import ZonePicker from './ZonePicker';
import type { AudienceMode, AudienceValue } from './audience';

interface AudiencePickerProps {
  value: AudienceValue;
  onChange: (v: AudienceValue) => void;
  /** Called with a group's name when one is picked, e.g. for the button label. */
  onGroups?: (groups: CustomerGroup[]) => void;
}

/** Who gets it: everyone (narrowed by zone and subscription), chosen customers, or a saved group. */
export default function AudiencePicker({ value: a, onChange, onGroups }: AudiencePickerProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [groups, setGroups] = useState<CustomerGroup[] | null>(null);
  const [groupName, setGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const { customers, failed } = useCustomerDirectory();
  const set = (patch: Partial<AudienceValue>) => onChange({ ...a, ...patch });
  const group = groups?.find((g) => String(g.id) === a.groupId);

  useEffect(() => {
    ridersService
      .getAllZones()
      .then(setZones)
      .catch((err) => logger.error('Failed to load zones:', err));
    customerGroupsService
      .list()
      .then((g) => {
        setGroups(g);
        onGroups?.(g);
      })
      .catch((err) => {
        logger.error('Failed to load customer groups:', err);
        setGroups([]);
      });
    // Load once per open; onGroups is a notification, not an input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveGroup = async () => {
    const name = groupName.trim();
    if (!name) return;
    try {
      setSavingGroup(true);
      const g = await customerGroupsService.create({ name, userIds: a.userIds });
      const next = [...(groups ?? []), g].sort((x, y) => x.name.localeCompare(y.name));
      setGroups(next);
      onGroups?.(next);
      setGroupName('');
      toast.success(`Saved “${g.name}” with ${g.members.length} customer${g.members.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t save the group.');
    } finally {
      setSavingGroup(false);
    }
  };

  return (
    <div className="grid gap-2">
      <Tabs value={a.mode} onValueChange={(v) => set({ mode: v as AudienceMode })}>
        <TabsList className="grid h-9 w-full grid-cols-3">
          <TabsTrigger value="everyone" className="text-xs">
            Everyone
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-xs">
            Chosen customers
          </TabsTrigger>
          <TabsTrigger value="group" className="text-xs">
            A group
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {a.mode === 'everyone' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="ap-zones" className="text-xs text-muted-foreground">
              Zones
            </Label>
            <ZonePicker id="ap-zones" zones={zones} value={a.zones} onChange={(v) => set({ zones: v })} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ap-status" className="text-xs text-muted-foreground">
              Subscription
            </Label>
            <Select value={a.status} onValueChange={(v) => set({ status: v })}>
              <SelectTrigger id="ap-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((x) => (
                  <SelectItem key={x.value} value={x.value}>
                    {x.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">A zone matches customers with any saved address inside it.</p>
        </div>
      )}

      {a.mode === 'customers' && (
        <>
          <CustomerPicker customers={customers} failed={failed} value={a.userIds} onChange={(ids) => set({ userIds: ids })} />
          {a.userIds.length >= 2 && (
            <div className="flex gap-2">
              <Input
                aria-label="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void saveGroup();
                  }
                }}
                placeholder="Save these customers as a group, e.g. VIPs"
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={() => void saveGroup()} disabled={!groupName.trim() || savingGroup}>
                {savingGroup ? <Loader2 className="animate-spin" /> : <Save />}
                Save
              </Button>
            </div>
          )}
        </>
      )}

      {a.mode === 'group' &&
        (groups && groups.length === 0 ? (
          <p className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
            No groups yet. Choose customers, then save them as a group, or create one under Notifications → Customer groups.
          </p>
        ) : (
          <>
            <Select value={a.groupId} onValueChange={(v) => set({ groupId: v })} disabled={!groups}>
              <SelectTrigger aria-label="Group" className="w-full">
                <SelectValue placeholder={groups ? 'Choose a group' : 'Loading groups…'} />
              </SelectTrigger>
              <SelectContent>
                {(groups ?? []).map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name} · {g.members.length}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {group && (
              <p className="text-xs text-muted-foreground">
                {group.members
                  .slice(0, 6)
                  .map((m) => m.name || m.phoneNumber)
                  .join(', ')}
                {group.members.length > 6 ? ` and ${group.members.length - 6} more` : ''}. Changes to the group apply to later sends.
              </p>
            )}
          </>
        ))}
    </div>
  );
}
