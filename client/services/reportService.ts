import api from './api';

export interface KPIStats {
  total_leads: number;
  converted: number;
  lost: number;
  conversion_rate: number;
  revenue: number;
  campaign_spent?: number;
  sla_breach_rate?: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

export interface TeamPerformanceUser {
  name: string;
  leads: number;
  converted: number;
  revenue: number;
  rate: number;
}

export interface CampaignAnalyticsRow {
  name: string;
  platform: string;
  leads: number;
  cost: number;
  roi: number;
}

export interface TicketStats {
  open: number;
  in_progress: number;
  resolved: number;
  sla_rate: number;
}

export interface TopPerformerRow {
  rank: number;
  name: string;
  role: string;
  metric: string;
  score: string;
  bar: number;
}

export const reportService = {
  // Sales
  async getSalesKpis(): Promise<KPIStats> {
    const res = await api.get('/reports/sales/kpis');
    return res.data.data;
  },
  async getRevenueTrend(): Promise<RevenueTrendPoint[]> {
    const res = await api.get('/reports/sales/revenue-trend');
    return res.data.data;
  },
  async getPipelineStages(): Promise<Record<string, number>> {
    const res = await api.get('/reports/sales/pipeline');
    return res.data.data;
  },
  async getTeamPerformance(): Promise<TeamPerformanceUser[]> {
    const res = await api.get('/reports/sales/team-performance');
    return res.data.data;
  },
  async getTopPerformers(): Promise<TopPerformerRow[]> {
    const res = await api.get('/reports/sales/top-performers');
    return res.data.data;
  },

  // Marketing
  async getCampaigns(): Promise<CampaignAnalyticsRow[]> {
    const res = await api.get('/reports/marketing/campaigns');
    return res.data.data;
  },
  async getMarketingFunnel(): Promise<Record<string, number>> {
    const res = await api.get('/reports/marketing/funnel');
    return res.data.data;
  },
  async getLeadSources(): Promise<Record<string, number>> {
    const res = await api.get('/reports/marketing/lead-sources');
    return res.data.data;
  },

  // Support
  async getTicketStats(): Promise<TicketStats> {
    const res = await api.get('/reports/support/tickets');
    return res.data.data;
  },
  async getSupportPerformance(): Promise<TopPerformerRow[]> {
    const res = await api.get('/reports/support/agent-performance');
    return res.data.data;
  },

  // Finance
  async getFinanceRevenue(): Promise<any> {
    const res = await api.get('/reports/finance/revenue');
    return res.data.data;
  },
  async getFinancePayments(): Promise<any[]> {
    const res = await api.get('/reports/finance/payments');
    return res.data.data;
  },
  async getFinanceInvoices(): Promise<any[]> {
    const res = await api.get('/reports/finance/invoices');
    return res.data.data;
  },

  // File exports
  async triggerDownload(urlPath: string, filename: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    
    try {
      const response = await fetch(`${baseUrl}${urlPath}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('File export error:', e);
      alert('Failed to download report. Make sure the Reports microservice is running.');
    }
  }
};
