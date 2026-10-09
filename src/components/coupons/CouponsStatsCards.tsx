interface CouponsStatsCardsProps {
  totalCoupons: number;
  activeCoupons: number;
  totalUses: number;
}

export default function CouponsStatsCards({ totalCoupons, activeCoupons, totalUses }: CouponsStatsCardsProps) {
  const stats = [
    { label: 'Total Coupons', value: totalCoupons },
    { label: 'Active', value: activeCoupons },
    { label: 'Inactive', value: totalCoupons - activeCoupons },
    { label: 'Total Uses', value: totalUses },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map(stat => (
        <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
