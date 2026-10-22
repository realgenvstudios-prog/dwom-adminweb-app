import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, RotateCw, UserCheck, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import adminAuthService from '../services/authService';
import { canAccessRoute, resolveUiRole } from '../config/permissions';
import { formatGhs } from './orders/order-status';
import { customerColumns } from './customers/columns';
import CustomerSheet from './customers/CustomerSheet';
import { CUSTOMER_STATUSES } from './customers/CustomerTypes';
import { useCustomersData } from './customers/useCustomersData';
import SignupsPanel from './customers/SignupsPanel';
import { joinedIn } from './customers/signups';
import { rangeOf } from './finance/overview/period';
import { usePeriodParam } from './finance/overview/use-period-param';

const CustomersPage: React.FC = () => {
  const { customers, loading, error, refresh } = useCustomersData();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // ?customer=<id> (from search) opens that customer once the list has loaded.
  const [params, setParams] = useSearchParams();
  const linked = params.get('customer');
  useEffect(() => {
    if (!linked || loading) return;
    const t = setTimeout(() => {
      const id = Number(linked);
      if (customers.some((c) => c.id === id)) {
        setSelectedId(id);
        setSheetOpen(true);
      }
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('customer');
          return next;
        },
        { replace: true },
      );
    }, 0);
    return () => clearTimeout(t);
  }, [linked, loading, customers, setParams]);
  const [monthAgo] = useState(() => Date.now() - 30 * 86_400_000);
  // Sign-ups panel: its period lives in the URL like Finance's, so a link opens the same view.
  const [period, setPeriod] = usePeriodParam();
  const [onlyThese, setOnlyThese] = useState(false);
  const range = rangeOf(period);
  const tableData = onlyThese ? joinedIn(customers, range.start, range.end) : customers;
  const canOpenOrders = canAccessRoute(resolveUiRole(adminAuthService.getCurrentAdmin()), '/orders');

  const selected = customers.find((c) => c.id === selectedId) ?? null;
  const count = (s: string) => customers.filter((c) => c.status === s).length;
  const joinedThisMonth = customers.filter((c) => new Date(c.createdAt).getTime() >= monthAgo).length;
  const totalSpend = customers.reduce((s, c) => s + c.totalSpend, 0);
  const paying = customers.filter((c) => c.totalSpend > 0).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">Everyone who has signed up for the DWOM app, and how they’re ordering.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Customers"
          value={customers.length.toLocaleString()}
          hint={`${joinedThisMonth} joined in the last 30 days`}
          icon={Users}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="Active"
          value={count('Active').toLocaleString()}
          hint="Ordered in the last 30 days"
          icon={UserCheck}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="At risk"
          value={count('At Risk').toLocaleString()}
          hint="Last order 31–90 days ago"
          icon={AlertTriangle}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard
          label="Lifetime paid spend"
          value={formatGhs(totalSpend)}
          hint={paying ? `${formatGhs(totalSpend / paying)} per paying customer` : 'No paid orders yet'}
          icon={Wallet}
          tint="bg-violet-500/10 text-violet-600"
          loading={loading}
          failed={!!error}
        />
      </div>

      <SignupsPanel customers={customers} period={period} onPeriodChange={setPeriod} onlyThese={onlyThese} onOnlyTheseChange={setOnlyThese} loading={loading} />

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load customers: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={customerColumns}
        data={tableData}
        isLoading={loading}
        getRowId={(c) => String(c.id)}
        initialSorting={[{ id: 'joined', desc: true }]}
        searchPlaceholder="Search name, phone, email, or #ID…"
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: CUSTOMER_STATUSES.map((s) => ({
              value: s.value,
              label: s.label,
              icon: ({ className }: { className?: string }) => <span className={`size-2 rounded-full ${s.dot} ${className ?? ''}`} />,
            })),
          },
        ]}
        onRowClick={(c) => {
          setSelectedId(c.id);
          setSheetOpen(true);
        }}
        emptyMessage={customers.length === 0 ? 'No customers yet. They’ll appear here as people sign up.' : 'No customers match these filters.'}
      />

      {selected && <CustomerSheet key={selected.id} customer={selected} open={sheetOpen} onOpenChange={setSheetOpen} canOpenOrders={canOpenOrders} />}
    </div>
  );
};

export default CustomersPage;
