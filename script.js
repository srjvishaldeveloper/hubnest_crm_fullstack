
const fs = require('fs');
let content = fs.readFileSync('client/app/super-admin/dashboard/page.tsx', 'utf8');

content = content.replace(/const MOCK_[A-Z_]+ = \[[\s\S]*?\];/g, '');
content = content.replace(/const TOP_PERFORMERS = \[[\s\S]*?\];/g, '');
content = content.replace(/const SYSTEM_STATUS = \[[\s\S]*?\];/g, '');
content = content.replace(/const QUICK_ACTIONS = \[[\s\S]*?\];/, '');

content = content.replace(/const \[users, setUsers\] = useState.*[\s\S]*?const \[showAddTenant, setShowAddTenant\] = useState\(false\);/, \const [chartTab, setChartTab] = useState<'leads' | 'tickets' | 'revenue'>('leads');
  const [notifOpen, setNotifOpen] = useState(false);
  const [moduleToggles, setModuleToggles] = useState({ sales: true, marketing: true, support: true, finance: true });\);

content = content.replace(/\{activities\.map/g, '{dashboardData?.recent_activities?.map');
content = content.replace(/\{alerts\.map/g, '{(dashboardData?.alerts || []).map');
content = content.replace(/\{MOCK_AI_INSIGHTS\.map/g, '{dashboardData?.ai_insights?.map');
content = content.replace(/\{TOP_PERFORMERS\.map/g, '{(dashboardData?.topPerformers || []).map');
content = content.replace(/\{SYSTEM_STATUS\.map/g, '{(dashboardData?.systemStatus || []).map');
content = content.replace(/\{MOCK_INTEGRATIONS\.map/g, '{(dashboardData?.integrations || []).map');
content = content.replace(/<AreaChart data=\{MOCK_WEEKLY\}>/g, '<AreaChart data={dashboardData?.weeklyActivity || []}>');
content = content.replace(/<AreaChart data=\{MOCK_REVENUE\}>/g, '<AreaChart data={dashboardData?.revenueTrend || []}>');
content = content.replace(/<Pie data=\{rolePie\}/g, '<Pie data={dashboardData?.rolePie || []}');
content = content.replace(/\{rolePie\.map/g, '{(dashboardData?.rolePie || []).map');

// 3. Clean up the fetchData logic
content = content.replace(/const fetchData = useCallback\([\s\S]*?  useEffect\(\(\) => \{ fetchData\(\); \}, \[fetchData\]\);/m, 'useEffect(() => { refetch(); }, []);');

// Quick fix for kpi mapping
content = content.replace(/kpi\.totalUsers/g, 'dashboardData?.total_users');
content = content.replace(/kpi\.activeUsers/g, 'dashboardData?.active_users');
content = content.replace(/kpi\.totalLeads/g, 'dashboardData?.total_leads');
content = content.replace(/kpi\.totalTickets/g, 'dashboardData?.open_tickets');
content = content.replace(/kpi\.campaigns/g, 'dashboardData?.campaigns');
content = content.replace(/kpi\.revenue/g, 'dashboardData?.revenue');

fs.writeFileSync('client/app/super-admin/dashboard/page.tsx', content);
console.log('Super Admin dashboard migrated.');

