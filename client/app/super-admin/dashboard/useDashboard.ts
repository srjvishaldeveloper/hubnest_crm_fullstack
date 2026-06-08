import { useState, useEffect } from 'react';
import api from '../../../services/api';

export interface DashboardData {
  total_users: number;
  active_users: number;
  total_leads: number;
  open_tickets: number;
  campaigns: number;
  revenue: number;
  sales_performance: { day: string; leads: number; converted: number }[];
  revenue_snapshot: {
    total_revenue: number;
    expenses: number;
    net_profit: number;
    revenue_trend: string;
    expense_trend: string;
    profit_trend: string;
  };
  lead_pipeline: {
    new: number;
    contacted: number;
    interested: number;
    negotiation: number;
    converted: number;
  };
  support_overview: {
    open: number;
    in_progress: number;
    resolved: number;
  };
  campaign_performance: {
    active: number;
    leads: number;
    roi: string;
  };
  finance_overview: {
    revenue: number;
    pending: number;
    collected: number;
  };
  recent_activities?: {
    icon: string;
    text: string;
    time: string;
    color: string;
    bg: string;
  }[];
  ai_insights?: {
    icon: string;
    text: string;
    type: 'positive' | 'warning' | 'negative' | string;
  }[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/super-admin/dashboard');
      setData(response.data.data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}
