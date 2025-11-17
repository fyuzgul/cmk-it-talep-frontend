import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { requestService } from '../../services/requestService';

const dateToInputValue = (date) => date.toISOString().slice(0, 10);

const quickRanges = [
  { label: 'Son 30 Gün', value: 30 },
  { label: 'Son 90 Gün', value: 90 },
  { label: 'Son 180 Gün', value: 180 },
];

const SupportKpiDashboard = () => {
  const [filters, setFilters] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: dateToInputValue(start),
      endDate: dateToInputValue(end),
      resolvedStatusIds: [],
    };
  });

  const [statusOptions, setStatusOptions] = useState([]);
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    requestService.getRequestStatuses()
      .then((statuses) => setStatusOptions(statuses))
      .catch(() => setStatusOptions([]));
  }, []);

  const loadKpis = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};

      if (filters.startDate) {
        params.startDate = new Date(filters.startDate).toISOString();
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        params.endDate = endDate.toISOString();
      }
      if (filters.resolvedStatusIds.length > 0) {
        params.resolvedStatusIds = filters.resolvedStatusIds;
      }

      const result = await requestService.getSupportKpis(params);
      setKpiData(result);
    } catch (err) {
      setError('KPI verileri alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleStatusSelection = (statusId) => {
    setFilters((prev) => {
      const exists = prev.resolvedStatusIds.includes(statusId);
      const resolvedStatusIds = exists
        ? prev.resolvedStatusIds.filter((id) => id !== statusId)
        : [...prev.resolvedStatusIds, statusId];

      return { ...prev, resolvedStatusIds };
    });
  };

  const selectedStatusesLabel = useMemo(() => {
    if (!filters.resolvedStatusIds.length) {
      return 'Varsayılan kapalı durumlar';
    }

    const names = statusOptions
      .filter((status) => filters.resolvedStatusIds.includes(status.id))
      .map((status) => status.name);

    if (!names.length) {
      return 'Seçili durum yok';
    }

    return names.join(', ');
  }, [filters.resolvedStatusIds, statusOptions]);

  const summary = useMemo(() => {
    const raw = kpiData?.summary ?? kpiData?.Summary ?? null;
    if (!raw) {
      return null;
    }
    return {
      totalAssignedRequests: raw.totalAssignedRequests ?? raw.TotalAssignedRequests ?? 0,
      resolvedRequests: raw.resolvedRequests ?? raw.ResolvedRequests ?? 0,
      openRequests: raw.openRequests ?? raw.OpenRequests ?? 0,
      averageResolutionTimeHours: raw.averageResolutionTimeHours ?? raw.AverageResolutionTimeHours ?? 0,
      medianResolutionTimeHours: raw.medianResolutionTimeHours ?? raw.MedianResolutionTimeHours ?? 0,
      resolutionRate: raw.resolutionRate ?? raw.ResolutionRate ?? 0,
    };
  }, [kpiData]);

  const agents = useMemo(() => {
    const rawAgents = kpiData?.agents ?? kpiData?.Agents ?? [];
    if (!Array.isArray(rawAgents)) {
      return [];
    }
    return rawAgents.map((agent) => ({
      supportUserId: agent.supportUserId ?? agent.SupportUserId ?? 0,
      fullName: agent.fullName ?? agent.FullName ?? 'Atanmamış',
      email: agent.email ?? agent.Email ?? '',
      assignedRequests: agent.assignedRequests ?? agent.AssignedRequests ?? 0,
      resolvedRequests: agent.resolvedRequests ?? agent.ResolvedRequests ?? 0,
      resolutionRate: agent.resolutionRate ?? agent.ResolutionRate ?? 0,
      averageResolutionTimeHours: agent.averageResolutionTimeHours ?? agent.AverageResolutionTimeHours ?? 0,
      medianResolutionTimeHours: agent.medianResolutionTimeHours ?? agent.MedianResolutionTimeHours ?? 0,
      lastResolvedAt: agent.lastResolvedAt ?? agent.LastResolvedAt ?? null,
    }));
  }, [kpiData]);

  const resolutionTrend = useMemo(() => {
    const rawTrend = kpiData?.resolutionTrend ?? kpiData?.ResolutionTrend ?? [];
    if (!Array.isArray(rawTrend)) {
      return [];
    }
    return rawTrend.map((point) => ({
      date: point.date ?? point.Date,
      resolvedCount: point.resolvedCount ?? point.ResolvedCount ?? 0,
    }));
  }, [kpiData]);

  if (!kpiData || !summary) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        {loading ? (
          <div className="flex items-center space-x-3 text-gray-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            <span>KPI verileri yükleniyor...</span>
          </div>
        ) : (
          <div className="text-gray-500">KPI verileri yüklenemedi.</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Destek KPI Filtreleri</h3>
              <p className="text-sm text-gray-500">Zaman aralığı ve kapalı durum filtresini seçin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={filters.startDate}
                  max={filters.endDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full rounded-lg border-gray-200 focus:ring-primary-red focus:border-primary-red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                <input
                  type="date"
                  value={filters.endDate}
                  min={filters.startDate}
                  max={dateToInputValue(new Date())}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full rounded-lg border-gray-200 focus:ring-primary-red focus:border-primary-red"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapalı Durumlar</label>
                <div className="relative">
                  <select
                    className="hidden"
                    multiple
                    value={filters.resolvedStatusIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((option) => Number(option.value));
                      handleFilterChange('resolvedStatusIds', selected);
                    }}
                  />
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-50">
                      <span className="truncate">{selectedStatusesLabel}</span>
                      <svg
                        className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                      {statusOptions.length === 0 ? (
                        <p className="text-sm text-gray-500 px-2">Durumlar yüklenemedi.</p>
                      ) : (
                        statusOptions.map((status) => (
                          <label key={status.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.resolvedStatusIds.includes(status.id)}
                              onChange={() => toggleStatusSelection(status.id)}
                              className="rounded text-primary-red focus:ring-primary-red"
                            />
                            <span className="text-sm text-gray-700">{status.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </details>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center flex-wrap gap-2">
                {quickRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(start.getDate() - range.value);
                      setFilters((prev) => ({
                        ...prev,
                        startDate: dateToInputValue(start),
                        endDate: dateToInputValue(end),
                      }));
                    }}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-full text-gray-600 hover:border-primary-red hover:text-primary-red transition-colors"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <button
                onClick={loadKpis}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-red text-white rounded-full text-sm font-medium hover:bg-primary-red-700 transition-colors disabled:opacity-60"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                Filtreyi Uygula
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Atanan Talep" value={summary.totalAssignedRequests} trend={`${summary.openRequests} açık`} icon="📋" accent="blue" />
        <KpiCard title="Çözülen Talep" value={summary.resolvedRequests} trend={`${summary.resolutionRate}% çözüm oranı`} icon="✅" accent="green" />
        <KpiCard title="Ort. Çözüm Süresi" value={`${summary.averageResolutionTimeHours} sa`} trend={`Median ${summary.medianResolutionTimeHours} sa`} icon="⏱️" accent="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Destek Uzmanı KPI&apos;ları</h3>
              <p className="text-sm text-gray-500">Performans sıralaması</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3">Destek Uzmanı</th>
                  <th className="py-3">Atanan</th>
                  <th className="py-3">Çözülen</th>
                  <th className="py-3">Çözüm Oranı</th>
                  <th className="py-3">Ort. Süre</th>
                  <th className="py-3">Son Çözüm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      Filtre kriterlerine uygun kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  agents.map((agent) => (
                    <tr key={agent.supportUserId}>
                      <td className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600">
                            {(agent.fullName || 'NA')
                              .split(' ')
                              .map((word) => word.charAt(0))
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{agent.fullName || 'Atanmamış'}</p>
                            {agent.email && <p className="text-xs text-gray-500">{agent.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-medium">{agent.assignedRequests}</td>
                      <td className="py-3 font-medium text-green-600">{agent.resolvedRequests}</td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${Math.min(agent.resolutionRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-800">{agent.resolutionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-800">
                        <div className="text-sm font-medium text-gray-900">{agent.averageResolutionTimeHours} sa</div>
                        <div className="text-xs text-gray-500">Median {agent.medianResolutionTimeHours} sa</div>
                      </td>
                      <td className="py-3 text-gray-600">
                        {agent.lastResolvedAt
                          ? new Date(agent.lastResolvedAt).toLocaleString('tr-TR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Veri yok'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Günlük Çözüm Trendleri</h3>
              <p className="text-sm text-gray-500">Seçilen aralıkta çözülen talepler</p>
            </div>
          </div>
          <div className="space-y-3">
            {resolutionTrend.length === 0 ? (
              <p className="text-sm text-gray-500">Trend verisi yok.</p>
            ) : (
              resolutionTrend.map((point) => {
                const widthPercent = Math.min((point.resolvedCount / (summary.resolvedRequests || 1)) * 100, 100);
                return (
                  <div key={point.date} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {new Date(point.date).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                      <span>{point.resolvedCount} talep</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-red rounded-full" style={{ width: `${widthPercent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, trend, icon, accent = 'blue' }) => {
  const accentClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${accentClasses[accent] || accentClasses.blue}`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">LİVE</span>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      <p className="text-sm text-gray-500">{trend}</p>
    </div>
  );
};

export default SupportKpiDashboard;

