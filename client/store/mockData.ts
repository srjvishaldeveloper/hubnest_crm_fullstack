/* ─────────────────────────────────────────────────
   Mock data for the entire Admin Management System
   All data is dynamic (generated) and can be imported
   from any component.
   ───────────────────────────────────────────────── */

// ── Seeded Random Generator ──────────────────────
let seed = 123456789;
function seededRandom() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// ── Helpers ──────────────────────────────────────
function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + seededRandom() * (end.getTime() - start.getTime()));
}
function fmtDate(d: Date) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}
function fmtDateTime(d: Date) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}
function randomPhone() {
  return `+91 ${Math.floor(7000000000 + seededRandom() * 2999999999)}`;
}

// ── Types ────────────────────────────────────────
export type AdminStatus = 'Active' | 'Inactive' | 'Blocked';
export type UserStatus = 'Active' | 'Inactive' | 'Blocked';

export interface AdminPermissions {
  canManageUsers: boolean;
  canManageLeads: boolean;
  canManageCampaigns: boolean;
  canManageTickets: boolean;
  canViewReports: boolean;
  canManageFinance: boolean;
}

export interface AdminRecord {
  id: string;
  adminId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  status: AdminStatus;
  joinedDate: string;
  lastLogin: string;
  avatar: string;
  permissions: AdminPermissions;
  activityLog: { action: string; timestamp: string }[];
  performance: { usersManaged: number; reportsGenerated: number };
}

export type UserRole =
  | 'Sales Manager'
  | 'Sales Executive'
  | 'Marketing Head'
  | 'Marketing Executive'
  | 'Support Manager'
  | 'Support Agent'
  | 'Finance Executive';

export interface UserRecord {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  joinedDate: string;
  lastLogin: string;
  avatar: string;
  team?: string;
  performance: {
    loginDays: number;
    actions: number;
    leadsHandled: number;
    conversionRate: number;
    dealsClosed: number;
    revenueGenerated: string;
  };
}

export interface LeadRecord {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: 'New' | 'Qualified' | 'Proposal' | 'Closed Won' | 'Closed Lost';
  value: string;
  assignedTo: string;
  createdAt: string;
  lastActivity: string;
  source: string;
}

// ── Admin Data ───────────────────────────────────
const COMPANIES = [
  'TechVista Corp', 'GreenEdge Solutions', 'NovaStar Digital', 'Pinnacle Group',
  'CloudBridge Tech', 'DataForge Systems', 'NextGen Retail', 'UrbanMart Global',
  'SwiftLogic Inc', 'BluePeak Partners', 'AeroMind Labs', 'PureHealth Inc'
];
const PLANS: ('Starter' | 'Pro' | 'Enterprise')[] = ['Starter', 'Pro', 'Enterprise'];

const ADMIN_NAMES = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta', 'Vikram Singh',
  'Ananya Reddy', 'Karthik Nair', 'Meera Iyer', 'Arjun Das', 'Pooja Mehta',
  'Rohit Verma', 'Divya Joshi',
];

const ACTIONS = [
  'Created a new user', 'Updated permissions', 'Generated report', 'Blocked a user',
  'Reset user password', 'Updated settings', 'Approved campaign', 'Resolved ticket',
  'Exported user data', 'Changed department settings',
];

export const MOCK_ADMINS: AdminRecord[] = ADMIN_NAMES.map((name, i) => {
  const joinDate = randomDate(new Date(2024, 0, 1), new Date(2025, 11, 31));
  const lastLogin = randomDate(new Date(2026, 4, 1), new Date(2026, 5, 5));
  const statuses: AdminStatus[] = ['Active', 'Active', 'Active', 'Active', 'Inactive', 'Blocked'];
  return {
    id: `admin-${String(i + 1).padStart(3, '0')}`,
    adminId: `ADM-${String(1000 + i)}`,
    name,
    email: name.toLowerCase().replace(' ', '.') + '@jobnest.com',
    phone: randomPhone(),
    company: COMPANIES[i % COMPANIES.length],
    plan: PLANS[i % PLANS.length],
    status: statuses[i % statuses.length],
    joinedDate: fmtDate(joinDate),
    lastLogin: fmtDateTime(lastLogin),
    avatar: name.split(' ').map(n => n[0]).join(''),
    permissions: {
      canManageUsers: seededRandom() > 0.3,
      canManageLeads: seededRandom() > 0.2,
      canManageCampaigns: seededRandom() > 0.4,
      canManageTickets: seededRandom() > 0.3,
      canViewReports: seededRandom() > 0.1,
      canManageFinance: seededRandom() > 0.6,
    },
    activityLog: Array.from({ length: 10 }, (_, j) => ({
      action: ACTIONS[j % ACTIONS.length],
      timestamp: fmtDateTime(randomDate(new Date(2026, 4, 1), new Date(2026, 5, 5))),
    })),
    performance: {
      usersManaged: Math.floor(20 + seededRandom() * 80),
      reportsGenerated: Math.floor(5 + seededRandom() * 50),
    },
  };
});

// ── User Data ────────────────────────────────────
const USER_ROLES: UserRole[] = [
  'Sales Manager', 'Sales Executive', 'Marketing Head', 'Marketing Executive',
  'Support Manager', 'Support Agent', 'Finance Executive',
];
const USER_NAMES = [
  'Arun Menon', 'Deepa Krishnan', 'Farhan Ali', 'Geeta Rao', 'Harish Bhatt',
  'Isha Kapoor', 'Jayant Tiwari', 'Kavitha Pillai', 'Lakshmi Devi', 'Manish Saxena',
  'Neha Agarwal', 'Omkar Patil', 'Pallavi Shenoy', 'Qadir Sheikh', 'Ritu Chauhan',
  'Suresh Yadav', 'Tanvi Deshmukh', 'Umesh Kulkarni', 'Varun Malhotra', 'Waseema Khan',
];
const TEAMS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];

export const MOCK_USERS: UserRecord[] = USER_NAMES.map((name, i) => {
  const joinDate = randomDate(new Date(2024, 6, 1), new Date(2026, 3, 30));
  const lastLogin = randomDate(new Date(2026, 4, 20), new Date(2026, 5, 5));
  const statuses: UserStatus[] = ['Active', 'Active', 'Active', 'Inactive', 'Blocked'];
  const role = USER_ROLES[i % USER_ROLES.length];
  return {
    id: `user-${String(i + 1).padStart(3, '0')}`,
    employeeId: `EMP-${String(2000 + i)}`,
    name,
    email: name.toLowerCase().replace(' ', '.') + '@jobnest.com',
    phone: randomPhone(),
    role,
    department: role.includes('Sales') ? 'Sales' : role.includes('Marketing') ? 'Marketing' : role.includes('Support') ? 'Support' : 'Finance',
    status: statuses[i % statuses.length],
    joinedDate: fmtDate(joinDate),
    lastLogin: fmtDateTime(lastLogin),
    avatar: name.split(' ').map(n => n[0]).join(''),
    team: seededRandom() > 0.4 ? TEAMS[i % TEAMS.length] : undefined,
    performance: {
      loginDays: Math.floor(15 + seededRandom() * 15),
      actions: Math.floor(50 + seededRandom() * 200),
      leadsHandled: Math.floor(10 + seededRandom() * 90),
      conversionRate: Math.floor(20 + seededRandom() * 60),
      dealsClosed: Math.floor(2 + seededRandom() * 30),
      revenueGenerated: `₹${(seededRandom() * 20 + 1).toFixed(1)}L`,
    },
  };
});

// ── Lead Data ────────────────────────────────────
const LEAD_NAMES = [
  'TechVista Solutions', 'GreenEdge Corp', 'NovaStar Ltd', 'Pinnacle Systems',
  'CloudBridge Inc', 'DataForge Labs', 'NextGen Retail', 'UrbanMart',
  'SwiftLogic Tech', 'BluePeak Consulting', 'AeroMind AI', 'PureHealth Pharma',
];
const SOURCES = ['Website', 'LinkedIn', 'Referral', 'Cold Call', 'Email Campaign', 'Trade Show'];
const STAGES: LeadRecord['stage'][] = ['New', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost'];

export const MOCK_LEADS: LeadRecord[] = LEAD_NAMES.map((company, i) => {
  const contact = USER_NAMES[i % USER_NAMES.length];
  return {
    id: `lead-${String(i + 1).padStart(3, '0')}`,
    name: contact,
    company,
    email: contact.toLowerCase().replace(' ', '.') + '@' + company.toLowerCase().replace(/\s/g, '') + '.com',
    phone: randomPhone(),
    stage: STAGES[i % STAGES.length],
    value: `₹${(seededRandom() * 50 + 2).toFixed(1)}L`,
    assignedTo: MOCK_USERS[i % MOCK_USERS.length].name,
    createdAt: fmtDate(randomDate(new Date(2026, 3, 1), new Date(2026, 5, 1))),
    lastActivity: fmtDateTime(randomDate(new Date(2026, 5, 1), new Date(2026, 5, 5))),
    source: SOURCES[i % SOURCES.length],
  };
});

// ── Stats helpers ────────────────────────────────
export function getAdminStats() {
  const total = MOCK_ADMINS.length;
  const active = MOCK_ADMINS.filter(a => a.status === 'Active').length;
  const inactive = MOCK_ADMINS.filter(a => a.status === 'Inactive').length;
  const blocked = MOCK_ADMINS.filter(a => a.status === 'Blocked').length;
  return { total, active, inactive, blocked };
}

export function getUserStats() {
  const total = MOCK_USERS.length;
  const active = MOCK_USERS.filter(u => u.status === 'Active').length;
  const inactive = MOCK_USERS.filter(u => u.status === 'Inactive').length;
  const blocked = MOCK_USERS.filter(u => u.status === 'Blocked').length;
  return { total, active, inactive, blocked };
}

export function getLeadStats() {
  const total = MOCK_LEADS.length;
  const newLeads = MOCK_LEADS.filter(l => l.stage === 'New').length;
  const converted = MOCK_LEADS.filter(l => l.stage === 'Closed Won').length;
  const lost = MOCK_LEADS.filter(l => l.stage === 'Closed Lost').length;
  return { total, newLeads, converted, lost };
}
