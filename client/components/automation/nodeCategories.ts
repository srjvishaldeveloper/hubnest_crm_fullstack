export type NodeKind = 'trigger' | 'action' | 'condition' | 'ai' | 'integration';

export interface NodeDef {
  type: NodeKind;
  label: string;
  icon: string;
  brand?: boolean;
  description?: string;
}

export interface NodeCategory {
  category: string;
  color: string;
  icon: string;
  nodes: NodeDef[];
}

export const CATEGORY_COLORS: Record<string, string> = {
  Triggers:     '#F97316',
  CRM:          '#3B82F6',
  Communication:'#10B981',
  AI:           '#8B5CF6',
  Conditions:   '#F59E0B',
  Integrations: '#EC4899',
  Data:         '#06B6D4',
  Notifications:'#EF4444',
};

export const nodeCategories: NodeCategory[] = [
  {
    category: 'Triggers',
    color: '#F97316',
    icon: 'Zap',
    nodes: [
      { type: 'trigger', label: 'Form Submitted',      icon: 'FileText',    description: 'Fires when a form is submitted' },
      { type: 'trigger', label: 'Lead Created',        icon: 'UserPlus',    description: 'New lead enters the CRM' },
      { type: 'trigger', label: 'Deal Won',            icon: 'Trophy',      description: 'A deal is marked as won' },
      { type: 'trigger', label: 'Deal Lost',           icon: 'TrendingDown',description: 'A deal is marked as lost' },
      { type: 'trigger', label: 'Appointment Booked',  icon: 'Calendar',    description: 'New appointment scheduled' },
      { type: 'trigger', label: 'Webhook',             icon: 'Webhook',     description: 'Incoming HTTP webhook' },
      { type: 'trigger', label: 'Tag Added',           icon: 'Tag',         description: 'Tag applied to a contact' },
      { type: 'trigger', label: 'Tag Removed',         icon: 'TagOff',      description: 'Tag removed from a contact' },
      { type: 'trigger', label: 'Page Visited',        icon: 'Globe',       description: 'Contact visits a landing page' },
      { type: 'trigger', label: 'Email Opened',        icon: 'MailOpen',    description: 'Contact opens an email' },
      { type: 'trigger', label: 'Link Clicked',        icon: 'MousePointer',description: 'Contact clicks an email link' },
      { type: 'trigger', label: 'Email Replied',       icon: 'MailCheck',   description: 'Contact replies to an email' },
      { type: 'trigger', label: 'Email Bounced',       icon: 'MailX',       description: 'Email could not be delivered' },
      { type: 'trigger', label: 'Email Unsubscribed',  icon: 'MailMinus',   description: 'Contact unsubscribes from emails' },
      { type: 'trigger', label: 'Schedule / Cron',     icon: 'Clock',       description: 'Time-based trigger (daily, weekly)' },
      { type: 'trigger', label: 'Pipeline Stage Change',icon: 'ArrowRight', description: 'Deal moves to a new stage' },
      { type: 'trigger', label: 'Call Missed',         icon: 'PhoneMissed', description: 'A call was missed' },
      { type: 'trigger', label: 'Note Added',          icon: 'StickyNote',  description: 'A note is added to a contact' },
    ],
  },
  {
    category: 'CRM',
    color: '#3B82F6',
    icon: 'Database',
    nodes: [
      { type: 'action', label: 'Create Contact',   icon: 'UserPlus',   description: 'Add a new contact to CRM' },
      { type: 'action', label: 'Update Contact',   icon: 'UserCog',    description: 'Update contact fields' },
      { type: 'action', label: 'Delete Contact',   icon: 'UserX',      description: 'Remove a contact' },
      { type: 'action', label: 'Add Tag',          icon: 'Tag',        description: 'Apply a tag to a contact' },
      { type: 'action', label: 'Remove Tag',       icon: 'TagOff',     description: 'Remove a tag from a contact' },
      { type: 'action', label: 'Create Deal',      icon: 'Briefcase',  description: 'Create a new deal in pipeline' },
      { type: 'action', label: 'Update Deal',      icon: 'Edit2',      description: 'Modify deal fields' },
      { type: 'action', label: 'Move Pipeline',    icon: 'ArrowRight', description: 'Move deal to another stage' },
      { type: 'action', label: 'Assign Owner',     icon: 'UserCheck',  description: 'Assign lead to a team member' },
      { type: 'action', label: 'Create Task',      icon: 'CheckSquare',description: 'Create a follow-up task' },
      { type: 'action', label: 'Add Note',         icon: 'StickyNote', description: 'Add a note to a contact' },
      { type: 'action', label: 'Create Lead',      icon: 'Layers',     description: 'Add a new lead record' },
    ],
  },
  {
    category: 'Communication',
    color: '#10B981',
    icon: 'MessageSquare',
    nodes: [
      { type: 'action', label: 'Send Email',        icon: 'Mail',          description: 'Send a personalized email' },
      { type: 'action', label: 'Send SMS',          icon: 'MessageSquare', description: 'Send an SMS message' },
      { type: 'action', label: 'Send WhatsApp',     icon: 'whatsapp',      brand: true, description: 'Send a WhatsApp message' },
      { type: 'action', label: 'Send Push',         icon: 'Bell',          description: 'Push notification to app/browser' },
      { type: 'action', label: 'Schedule Email',    icon: 'CalendarClock', description: 'Schedule email for later' },
      { type: 'action', label: 'Email Sequence',    icon: 'ListOrdered',   description: 'Start a drip email sequence' },
    ],
  },
  {
    category: 'Conditions',
    color: '#F59E0B',
    icon: 'GitBranch',
    nodes: [
      { type: 'condition', label: 'If / Else',     icon: 'GitBranch',  description: 'Branch on a condition' },
      { type: 'condition', label: 'Switch',        icon: 'Shuffle',    description: 'Multi-path branching' },
      { type: 'condition', label: 'Wait',          icon: 'Clock',      description: 'Wait until a condition is met' },
      { type: 'condition', label: 'Delay',         icon: 'Timer',      description: 'Wait a fixed amount of time' },
      { type: 'condition', label: 'Filter',        icon: 'Filter',     description: 'Stop flow if condition fails' },
      { type: 'condition', label: 'Split / AB',    icon: 'Divide',     description: 'A/B split test routing' },
      { type: 'condition', label: 'Loop',          icon: 'RefreshCw',  description: 'Iterate over a list of items' },
      { type: 'condition', label: 'Merge',         icon: 'Merge',      description: 'Merge multiple branches' },
    ],
  },
  {
    category: 'AI',
    color: '#8B5CF6',
    icon: 'Bot',
    nodes: [
      { type: 'ai', label: 'AI Agent',       icon: 'Bot',     description: 'Run a custom AI agent' },
      { type: 'ai', label: 'OpenAI',         icon: 'openai',  brand: true, description: 'GPT-4 / ChatGPT' },
      { type: 'ai', label: 'Claude',         icon: 'Bot',     description: 'Anthropic Claude' },
      { type: 'ai', label: 'Gemini',         icon: 'Sparkles',description: 'Google Gemini' },
      { type: 'ai', label: 'Classify Lead',  icon: 'Tags',    description: 'Auto-classify lead intent' },
      { type: 'ai', label: 'Sentiment',      icon: 'Heart',   description: 'Analyze message sentiment' },
      { type: 'ai', label: 'Summarize',      icon: 'AlignLeft',description: 'Summarize a long text' },
      { type: 'ai', label: 'Generate Copy',  icon: 'Pen',     description: 'AI-write email/SMS copy' },
    ],
  },
  {
    category: 'Integrations',
    color: '#EC4899',
    icon: 'Plug',
    nodes: [
      { type: 'integration', label: 'Google Sheets', icon: 'googlesheets', brand: true, description: 'Read/write Google Sheets rows' },
      { type: 'integration', label: 'Slack',         icon: 'slack',        brand: true, description: 'Post message to Slack channel' },
      { type: 'integration', label: 'Stripe',        icon: 'stripe',       brand: true, description: 'Trigger on Stripe events' },
      { type: 'integration', label: 'Razorpay',      icon: 'razorpay',     brand: true, description: 'Razorpay payment events' },
      { type: 'integration', label: 'Shopify',       icon: 'shopify',      brand: true, description: 'Shopify order/customer events' },
      { type: 'integration', label: 'Discord',       icon: 'discord',      brand: true, description: 'Send Discord message' },
      { type: 'integration', label: 'Notion',        icon: 'FileText',     description: 'Create/update Notion pages' },
      { type: 'integration', label: 'Airtable',      icon: 'Table',        description: 'Read/write Airtable records' },
      { type: 'integration', label: 'Zapier',        icon: 'Zap',          description: 'Trigger a Zapier zap' },
      { type: 'integration', label: 'HTTP Request',  icon: 'Globe',        description: 'Make any HTTP API call' },
      { type: 'integration', label: 'Meta / Facebook', icon: 'facebook',   brand: true, description: 'Meta Graph API — Ads, Pages, Leads' },
      { type: 'integration', label: 'Instagram',    icon: 'instagram',    brand: true, description: 'Instagram Graph API — DMs, posts' },
    ],
  },
  {
    category: 'Data',
    color: '#06B6D4',
    icon: 'Database',
    nodes: [
      { type: 'action', label: 'Set Variable',    icon: 'Variable',   description: 'Store a value for use later' },
      { type: 'action', label: 'Transform Data',  icon: 'Wand',       description: 'Map/transform field values' },
      { type: 'action', label: 'Lookup Record',   icon: 'Search',     description: 'Look up a CRM record' },
      { type: 'action', label: 'Format Date',     icon: 'Calendar',   description: 'Convert/format date values' },
      { type: 'action', label: 'Calculate',       icon: 'Calculator', description: 'Do math on field values' },
      { type: 'action', label: 'Parse JSON',      icon: 'Braces',     description: 'Extract fields from JSON' },
    ],
  },
  {
    category: 'Notifications',
    color: '#EF4444',
    icon: 'Bell',
    nodes: [
      { type: 'action', label: 'Internal Alert',  icon: 'Bell',       description: 'Notify a team member in-app' },
      { type: 'action', label: 'Email Alert',     icon: 'MailWarning',description: 'Send an internal alert email' },
      { type: 'action', label: 'Log Event',       icon: 'FileText',   description: 'Log event to activity feed' },
    ],
  },
];

// ── Workflow Templates ──────────────────────────────────────────────────────
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Array<{ type: NodeKind; label: string; icon: string; brand?: boolean; position: { x: number; y: number }; config?: Record<string, string> }>;
  edges: Array<{ source: string; target: string }>;
  color: string;
  icon: string;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'tpl-lead-welcome',
    name: 'Lead Welcome Sequence',
    description: 'Send a welcome email + SMS when a new lead is created',
    category: 'Lead Nurture',
    color: '#F97316',
    icon: 'UserPlus',
    nodes: [
      { type: 'trigger', label: 'Lead Created',  icon: 'UserPlus',      position: { x: 320, y: 80 } },
      { type: 'action',  label: 'Send Email',    icon: 'Mail',          position: { x: 320, y: 220 }, config: { subject: 'Welcome! Here\'s what\'s next', fromName: 'HubNest CRM' } },
      { type: 'condition',label: 'Delay',        icon: 'Timer',         position: { x: 320, y: 360 }, config: { duration: '1', unit: 'days' } },
      { type: 'action',  label: 'Send SMS',      icon: 'MessageSquare', position: { x: 320, y: 500 }, config: { message: 'Hi {{first_name}}, just checking in! Let us know if you need help.' } },
    ],
    edges: [
      { source: '0', target: '1' },
      { source: '1', target: '2' },
      { source: '2', target: '3' },
    ],
  },
  {
    id: 'tpl-deal-won',
    name: 'Deal Won Celebration',
    description: 'Notify team on Slack + create follow-up task when a deal is won',
    category: 'Sales',
    color: '#10B981',
    icon: 'Trophy',
    nodes: [
      { type: 'trigger',     label: 'Deal Won',      icon: 'Trophy',      position: { x: 320, y: 80 } },
      { type: 'action',      label: 'Add Tag',        icon: 'Tag',         position: { x: 160, y: 230 }, config: { tag: 'customer' } },
      { type: 'integration', label: 'Slack',          icon: 'slack',       brand: true, position: { x: 480, y: 230 }, config: { message: '🎉 New deal won: {{deal_name}} ({{deal_value}})!' } },
      { type: 'action',      label: 'Create Task',    icon: 'CheckSquare', position: { x: 320, y: 390 }, config: { note: 'Send onboarding materials to {{contact_name}}' } },
      { type: 'action',      label: 'Send Email',     icon: 'Mail',        position: { x: 320, y: 540 }, config: { subject: 'Welcome aboard, {{first_name}}!', fromName: 'HubNest CRM' } },
    ],
    edges: [
      { source: '0', target: '1' },
      { source: '0', target: '2' },
      { source: '1', target: '3' },
      { source: '2', target: '3' },
      { source: '3', target: '4' },
    ],
  },
  {
    id: 'tpl-form-lead',
    name: 'Form → Lead Qualify',
    description: 'Create a lead from a form submission, classify with AI, route by score',
    category: 'Lead Capture',
    color: '#8B5CF6',
    icon: 'FileText',
    nodes: [
      { type: 'trigger',   label: 'Form Submitted',  icon: 'FileText',  position: { x: 320, y: 80 } },
      { type: 'action',    label: 'Create Lead',     icon: 'Layers',    position: { x: 320, y: 220 } },
      { type: 'ai',        label: 'Classify Lead',   icon: 'Tags',      position: { x: 320, y: 360 } },
      { type: 'condition', label: 'If / Else',       icon: 'GitBranch', position: { x: 320, y: 500 }, config: { field: 'ai_score', operator: 'gt', value: '70' } },
      { type: 'action',    label: 'Assign Owner',    icon: 'UserCheck', position: { x: 150, y: 640 } },
      { type: 'action',    label: 'Add Tag',         icon: 'Tag',       position: { x: 490, y: 640 }, config: { tag: 'low-score' } },
    ],
    edges: [
      { source: '0', target: '1' },
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '3', target: '4' },
      { source: '3', target: '5' },
    ],
  },
  {
    id: 'tpl-re-engage',
    name: 'Re-engagement Drip',
    description: 'Win back inactive leads with a 3-step email sequence',
    category: 'Lead Nurture',
    color: '#3B82F6',
    icon: 'RefreshCw',
    nodes: [
      { type: 'trigger',   label: 'Tag Added',      icon: 'Tag',         position: { x: 320, y: 80 },  config: { tag: 'inactive' } },
      { type: 'action',    label: 'Send Email',     icon: 'Mail',        position: { x: 320, y: 220 }, config: { subject: 'We miss you, {{first_name}}!', fromName: 'HubNest CRM' } },
      { type: 'condition', label: 'Delay',          icon: 'Timer',       position: { x: 320, y: 360 }, config: { duration: '3', unit: 'days' } },
      { type: 'action',    label: 'Send Email',     icon: 'Mail',        position: { x: 320, y: 500 }, config: { subject: 'A special offer for you 🎁', fromName: 'HubNest CRM' } },
      { type: 'condition', label: 'Delay',          icon: 'Timer',       position: { x: 320, y: 640 }, config: { duration: '5', unit: 'days' } },
      { type: 'condition', label: 'If / Else',      icon: 'GitBranch',   position: { x: 320, y: 780 }, config: { field: 'email_opened', operator: 'equals', value: 'true' } },
      { type: 'action',    label: 'Add Tag',        icon: 'Tag',         position: { x: 150, y: 920 }, config: { tag: 're-engaged' } },
      { type: 'action',    label: 'Remove Tag',     icon: 'TagOff',      position: { x: 490, y: 920 }, config: { tag: 'inactive' } },
    ],
    edges: [
      { source: '0', target: '1' }, { source: '1', target: '2' }, { source: '2', target: '3' },
      { source: '3', target: '4' }, { source: '4', target: '5' }, { source: '5', target: '6' }, { source: '5', target: '7' },
    ],
  },
  {
    id: 'tpl-appointment',
    name: 'Appointment Confirmation',
    description: 'Confirm appointment and send reminders via WhatsApp + email',
    category: 'Appointments',
    color: '#EC4899',
    icon: 'Calendar',
    nodes: [
      { type: 'trigger', label: 'Appointment Booked', icon: 'Calendar',      position: { x: 320, y: 80 } },
      { type: 'action',  label: 'Send Email',         icon: 'Mail',          position: { x: 160, y: 230 }, config: { subject: 'Your appointment is confirmed ✅', fromName: 'HubNest CRM' } },
      { type: 'action',  label: 'Send WhatsApp',      icon: 'whatsapp',      brand: true, position: { x: 480, y: 230 }, config: { message: 'Hi {{first_name}}! Your appointment on {{date}} at {{time}} is confirmed.' } },
      { type: 'condition',label: 'Delay',             icon: 'Timer',         position: { x: 320, y: 390 }, config: { duration: '1', unit: 'days' } },
      { type: 'action',  label: 'Send SMS',           icon: 'MessageSquare', position: { x: 320, y: 540 }, config: { message: 'Reminder: Your appointment is tomorrow at {{time}}. See you!' } },
    ],
    edges: [
      { source: '0', target: '1' }, { source: '0', target: '2' },
      { source: '1', target: '3' }, { source: '2', target: '3' }, { source: '3', target: '4' },
    ],
  },
  {
    id: 'tpl-payment',
    name: 'Payment Received Flow',
    description: 'On Razorpay payment, update CRM, send receipt, and move pipeline',
    category: 'Payments',
    color: '#06B6D4',
    icon: 'CreditCard',
    nodes: [
      { type: 'trigger',     label: 'Webhook',        icon: 'Webhook',     position: { x: 320, y: 80 },  config: { method: 'POST', url: 'https://your-domain.com/webhooks/razorpay' } },
      { type: 'integration', label: 'Razorpay',       icon: 'razorpay',    brand: true, position: { x: 320, y: 220 } },
      { type: 'action',      label: 'Update Deal',    icon: 'Edit2',       position: { x: 160, y: 380 } },
      { type: 'action',      label: 'Move Pipeline',  icon: 'ArrowRight',  position: { x: 320, y: 380 }, config: { stage: 'Won' } },
      { type: 'action',      label: 'Send Email',     icon: 'Mail',        position: { x: 480, y: 380 }, config: { subject: 'Payment received — Thank you!', fromName: 'HubNest CRM' } },
      { type: 'action',      label: 'Add Tag',        icon: 'Tag',         position: { x: 320, y: 540 }, config: { tag: 'paid-customer' } },
    ],
    edges: [
      { source: '0', target: '1' }, { source: '1', target: '2' }, { source: '1', target: '3' },
      { source: '1', target: '4' }, { source: '2', target: '5' }, { source: '3', target: '5' },
    ],
  },
];
