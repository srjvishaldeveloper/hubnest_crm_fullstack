-- 023: Campaign Template Gallery — dedicated table with categories and seed data

CREATE TABLE IF NOT EXISTS campaign_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = global/shared
  name          VARCHAR(255) NOT NULL,
  category      VARCHAR(50)  NOT NULL DEFAULT 'general',
  type          VARCHAR(20)  NOT NULL DEFAULT 'email', -- email | sms
  description   TEXT,
  thumbnail_url TEXT,
  html_content  TEXT NOT NULL,
  tags          TEXT[]       DEFAULT '{}',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_camp_tpl_type     ON campaign_templates(type);
CREATE INDEX IF NOT EXISTS idx_camp_tpl_category ON campaign_templates(category);
CREATE INDEX IF NOT EXISTS idx_camp_tpl_active   ON campaign_templates(is_active);

-- ──────────────────────────────────────────────────────────────
-- SEED: Email Templates
-- ──────────────────────────────────────────────────────────────

-- Welcome
INSERT INTO campaign_templates (name, category, type, description, tags, html_content) VALUES
(
  'Warm Welcome',
  'welcome',
  'email',
  'Onboard new subscribers with a warm greeting and key product highlights.',
  ARRAY['welcome','onboarding'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome</title><style>body{margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#f4f6f8}table{border-collapse:collapse}.wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}</style></head><body><table class="wrapper" width="600" cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#F97316,#f59e0b);padding:48px 40px;text-align:center"><h1 style="color:#fff;margin:0;font-size:32px;font-weight:800">Welcome! 🎉</h1><p style="color:rgba(255,255,255,.9);margin:12px 0 0;font-size:16px">We''re thrilled to have you on board.</p></td></tr><tr><td style="padding:40px"><p style="color:#374151;font-size:16px;line-height:1.7">Hi {{first_name}},</p><p style="color:#374151;font-size:16px;line-height:1.7">Thank you for joining us! Here''s what you can expect:</p><ul style="color:#374151;font-size:15px;line-height:2"><li>Exclusive offers &amp; early access</li><li>Weekly updates and insights</li><li>Priority customer support</li></ul><div style="text-align:center;margin:32px 0"><a href="{{cta_url}}" style="background:#F97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Get Started →</a></div></td></tr><tr><td style="background:#f9fafb;padding:24px 40px;text-align:center;color:#9ca3af;font-size:13px"><p>You''re receiving this because you signed up at {{company_name}}.<br><a href="{{unsubscribe_url}}" style="color:#9ca3af">Unsubscribe</a></p></td></tr></table></body></html>'
),
(
  'Product Welcome Series',
  'welcome',
  'email',
  'Feature your top product benefits and drive first-time engagement.',
  ARRAY['welcome','product'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#f4f6f8}</style></head><body><table width="100%" cellpadding="0" cellspacing="0"><tr><td><table width="600" style="margin:32px auto;background:#fff;border-radius:12px;overflow:hidden" cellpadding="0" cellspacing="0"><tr><td style="padding:40px;background:#1e293b;text-align:center"><img src="{{logo_url}}" alt="Logo" height="40" style="margin-bottom:16px"><h1 style="color:#fff;margin:0;font-size:28px">Start Your Journey</h1></td></tr><tr><td style="padding:40px"><p style="font-size:16px;color:#374151;line-height:1.7">Hi {{first_name}}, you''ve made a great choice.</p><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px"><tr><td width="33%" style="text-align:center;padding:16px"><div style="background:#fff7ed;border-radius:12px;padding:20px"><p style="font-size:28px;margin:0">⚡</p><p style="font-weight:700;margin:8px 0 4px;color:#1e293b">Fast</p><p style="font-size:13px;color:#64748b">Setup in minutes</p></div></td><td width="33%" style="text-align:center;padding:16px"><div style="background:#fff7ed;border-radius:12px;padding:20px"><p style="font-size:28px;margin:0">🔒</p><p style="font-weight:700;margin:8px 0 4px;color:#1e293b">Secure</p><p style="font-size:13px;color:#64748b">Enterprise-grade</p></div></td><td width="33%" style="text-align:center;padding:16px"><div style="background:#fff7ed;border-radius:12px;padding:20px"><p style="font-size:28px;margin:0">🚀</p><p style="font-weight:700;margin:8px 0 4px;color:#1e293b">Scalable</p><p style="font-size:13px;color:#64748b">Grows with you</p></div></td></tr></table><div style="text-align:center;margin-top:32px"><a href="{{cta_url}}" style="background:#F97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700">Explore Features</a></div></td></tr></table></td></tr></table></body></html>'
);

-- Promotional
INSERT INTO campaign_templates (name, category, type, description, tags, html_content) VALUES
(
  'Flash Sale 🔥',
  'promotional',
  'email',
  'Urgent, high-converting flash sale with countdown urgency.',
  ARRAY['sale','discount','urgent'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#fff8f0}</style></head><body><table width="100%" cellpadding="0"><tr><td><table width="600" style="margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:2px solid #FED7AA" cellpadding="0"><tr><td style="background:#F97316;padding:48px;text-align:center"><p style="color:#fff;font-size:13px;font-weight:700;margin:0 0 8px;letter-spacing:3px;text-transform:uppercase">Limited Time Offer</p><h1 style="color:#fff;margin:0;font-size:52px;font-weight:900">40% OFF</h1><p style="color:rgba(255,255,255,.9);font-size:16px;margin:8px 0 0">Everything. Today only.</p></td></tr><tr><td style="padding:40px;text-align:center"><p style="color:#374151;font-size:16px;line-height:1.7">Hey {{first_name}}, we''re doing something we''ve never done before. <strong>40% off your entire order.</strong> No code needed.</p><div style="background:#fff7ed;border:2px dashed #F97316;border-radius:12px;padding:20px;margin:24px 0"><p style="font-size:13px;color:#9ca3af;margin:0 0 8px">Use code at checkout</p><p style="font-size:28px;font-weight:900;color:#F97316;margin:0;letter-spacing:4px">FLASH40</p></div><a href="{{cta_url}}" style="background:#F97316;color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:800;font-size:16px;display:inline-block">Shop Now</a><p style="font-size:13px;color:#9ca3af;margin-top:16px">Offer expires in: <strong style="color:#ef4444">24 hours</strong></p></td></tr></table></td></tr></table></body></html>'
),
(
  'New Product Launch',
  'promotional',
  'email',
  'Announce and drive pre-orders or first purchases for a new product.',
  ARRAY['launch','product','new'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#f8fafc}</style></head><body><table width="600" style="margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)" cellpadding="0"><tr><td style="height:240px;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);text-align:center;padding:48px"><p style="color:#F97316;font-size:12px;font-weight:700;letter-spacing:4px;text-transform:uppercase;margin:0 0 16px">Introducing</p><h1 style="color:#fff;font-size:36px;font-weight:900;margin:0">{{product_name}}</h1><p style="color:#94a3b8;font-size:16px;margin:12px 0 0">{{tagline}}</p></td></tr><tr><td style="padding:40px"><p style="color:#374151;font-size:16px;line-height:1.8">Hi {{first_name}},</p><p style="color:#374151;font-size:16px;line-height:1.8">We''ve been working on something big. {{product_name}} is here — and it''s changing the game.</p><div style="text-align:center;margin:32px 0"><a href="{{cta_url}}" style="background:#F97316;color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px">Be First to Try It</a></div></td></tr></table></body></html>'
);

-- Newsletter
INSERT INTO campaign_templates (name, category, type, description, tags, html_content) VALUES
(
  'Monthly Newsletter',
  'newsletter',
  'email',
  'Clean, multi-section monthly digest with top stories and CTA blocks.',
  ARRAY['newsletter','digest','monthly'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#f4f6f8}</style></head><body><table width="600" style="margin:32px auto;background:#fff;border-radius:12px;overflow:hidden" cellpadding="0"><tr><td style="background:#1e293b;padding:32px 40px;text-align:center"><h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">{{newsletter_name}}</h1><p style="color:#94a3b8;margin:6px 0 0;font-size:13px">{{month_year}} Edition</p></td></tr><tr><td style="padding:32px 40px"><p style="color:#374151;font-size:16px;line-height:1.8">Hey {{first_name}} 👋</p><p style="color:#374151;font-size:15px;line-height:1.8">Here''s your monthly roundup of everything worth knowing.</p><hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0"><h2 style="color:#1e293b;font-size:18px;margin:0 0 16px">🔥 Top Story</h2><p style="color:#374151;font-size:15px;line-height:1.8">{{top_story_text}}</p><a href="{{story_url}}" style="color:#F97316;font-weight:600;font-size:14px;text-decoration:none">Read more →</a><hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0"><h2 style="color:#1e293b;font-size:18px;margin:0 0 16px">📣 Updates</h2><ul style="color:#374151;font-size:15px;line-height:2;padding-left:20px"><li>{{update_1}}</li><li>{{update_2}}</li><li>{{update_3}}</li></ul><div style="text-align:center;margin:32px 0"><a href="{{cta_url}}" style="background:#F97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700">Read the Full Issue</a></div></td></tr><tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;color:#9ca3af;font-size:13px"><a href="{{unsubscribe_url}}" style="color:#9ca3af">Unsubscribe</a> · <a href="{{preferences_url}}" style="color:#9ca3af">Preferences</a></td></tr></table></body></html>'
),
(
  'Weekly Digest',
  'newsletter',
  'email',
  'Lightweight weekly roundup with link-based story cards.',
  ARRAY['newsletter','weekly'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#f8fafc}</style></head><body><table width="600" style="margin:32px auto;background:#fff;border-radius:12px" cellpadding="0"><tr><td style="padding:32px 40px 0"><p style="font-size:12px;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;margin:0">Week of {{week_date}}</p><h1 style="font-size:28px;font-weight:900;color:#1e293b;margin:8px 0">Your Weekly Brief</h1><hr style="border:none;border-top:2px solid #F97316;width:48px;margin:0 0 24px"></td></tr><tr><td style="padding:0 40px 40px"><p style="color:#374151;font-size:15px;line-height:1.8">Hi {{first_name}}, here''s what happened this week:</p><table width="100%" cellpadding="0" style="margin-top:24px"><tr><td style="padding:16px;background:#fff7ed;border-radius:10px;margin-bottom:12px"><p style="font-size:12px;font-weight:700;color:#F97316;margin:0 0 6px;text-transform:uppercase">{{category_1}}</p><p style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 6px">{{headline_1}}</p><a href="{{url_1}}" style="font-size:13px;color:#F97316;font-weight:600;text-decoration:none">Read →</a></td></tr></table></td></tr></table></body></html>'
);

-- Event Invite
INSERT INTO campaign_templates (name, category, type, description, tags, html_content) VALUES
(
  'Webinar Invitation',
  'event',
  'email',
  'Drive webinar registrations with speaker cards and a bold CTA.',
  ARRAY['event','webinar','invite'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#f4f6f8}</style></head><body><table width="600" style="margin:32px auto;background:#fff;border-radius:16px;overflow:hidden" cellpadding="0"><tr><td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:48px 40px;text-align:center"><p style="color:rgba(255,255,255,.8);font-size:13px;font-weight:700;letter-spacing:3px;margin:0 0 12px;text-transform:uppercase">You''re Invited</p><h1 style="color:#fff;font-size:28px;font-weight:900;margin:0">{{webinar_title}}</h1><p style="color:rgba(255,255,255,.9);font-size:16px;margin:12px 0 0">📅 {{event_date}} at {{event_time}} {{timezone}}</p></td></tr><tr><td style="padding:40px;text-align:center"><p style="color:#374151;font-size:16px;line-height:1.8">Join us for a live session on <strong>{{webinar_topic}}</strong>. Learn from experts and get your questions answered in real time.</p><div style="background:#faf5ff;border-radius:12px;padding:20px;margin:24px 0;text-align:left"><p style="font-weight:700;margin:0 0 12px;color:#1e293b">What you''ll learn:</p><ul style="color:#374151;font-size:14px;line-height:2;margin:0;padding-left:20px"><li>{{learning_point_1}}</li><li>{{learning_point_2}}</li><li>{{learning_point_3}}</li></ul></div><a href="{{register_url}}" style="background:#7c3aed;color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;display:inline-block">Register Free →</a></td></tr></table></body></html>'
),
(
  'Conference Invite',
  'event',
  'email',
  'Multi-day conference invitation with agenda highlights and early-bird CTA.',
  ARRAY['event','conference'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#f4f6f8}</style></head><body><table width="600" style="margin:32px auto;background:#fff;border-radius:16px;overflow:hidden" cellpadding="0"><tr><td style="background:#1e293b;padding:48px;text-align:center"><h1 style="color:#F97316;font-size:36px;font-weight:900;margin:0">{{conference_name}}</h1><p style="color:#fff;font-size:16px;margin:8px 0 0">{{event_date}} · {{event_location}}</p></td></tr><tr><td style="padding:40px"><p style="color:#374151;font-size:16px;line-height:1.8">Hi {{first_name}}, we''re excited to invite you to <strong>{{conference_name}}</strong> — the premier industry event of the year.</p><h3 style="color:#1e293b;font-size:16px;margin:24px 0 12px">🗓 Agenda Highlights</h3><table width="100%" cellpadding="0"><tr><td style="padding:12px;border-left:3px solid #F97316;margin-bottom:8px"><p style="font-weight:700;margin:0;color:#1e293b;font-size:14px">Day 1: {{day1_theme}}</p><p style="color:#64748b;font-size:13px;margin:4px 0 0">{{day1_highlight}}</p></td></tr></table><div style="text-align:center;margin:32px 0"><a href="{{register_url}}" style="background:#F97316;color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:800">Get Early Bird Tickets</a></div></td></tr></table></body></html>'
);

-- Follow Up
INSERT INTO campaign_templates (name, category, type, description, tags, html_content) VALUES
(
  'Sales Follow Up',
  'followup',
  'email',
  'Personal-feeling follow up after a demo or sales call.',
  ARRAY['followup','sales'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#f8fafc}</style></head><body><table width="600" style="margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0" cellpadding="0"><tr><td style="padding:40px"><p style="color:#374151;font-size:16px;line-height:1.8">Hi {{first_name}},</p><p style="color:#374151;font-size:16px;line-height:1.8">Thanks for taking the time to connect with us about {{topic}}. I wanted to follow up and see if you had any questions.</p><p style="color:#374151;font-size:16px;line-height:1.8">As discussed, here''s a quick recap:</p><ul style="color:#374151;font-size:15px;line-height:2"><li>{{point_1}}</li><li>{{point_2}}</li><li>{{point_3}}</li></ul><p style="color:#374151;font-size:16px;line-height:1.8">Would love to jump on a quick call to answer any questions. Here''s my calendar:</p><div style="text-align:center;margin:32px 0"><a href="{{calendar_url}}" style="background:#F97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700">Book a Call</a></div><p style="color:#374151;font-size:15px;line-height:1.8">Looking forward to connecting,<br><strong>{{sender_name}}</strong><br>{{sender_title}}</p></td></tr></table></body></html>'
),
(
  'Cart Abandonment',
  'followup',
  'email',
  'Recover abandoned carts with personalized product reminder.',
  ARRAY['followup','ecommerce','cart'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#fff8f0}</style></head><body><table width="600" style="margin:32px auto;background:#fff;border-radius:16px;overflow:hidden" cellpadding="0"><tr><td style="background:#F97316;padding:32px 40px;text-align:center"><h1 style="color:#fff;font-size:22px;font-weight:800;margin:0">You left something behind! 🛒</h1></td></tr><tr><td style="padding:40px;text-align:center"><p style="color:#374151;font-size:16px;line-height:1.8">Hi {{first_name}}, you left <strong>{{product_name}}</strong> in your cart. Don''t miss out — it''s still waiting for you.</p><div style="background:#fff7ed;border-radius:12px;padding:20px;margin:20px 0"><p style="font-size:18px;font-weight:700;color:#1e293b;margin:0">{{product_name}}</p><p style="color:#64748b;font-size:14px;margin:8px 0">{{product_description}}</p><p style="font-size:22px;font-weight:900;color:#F97316;margin:8px 0">{{price}}</p></div><a href="{{cart_url}}" style="background:#F97316;color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;display:inline-block">Complete Purchase →</a></td></tr></table></body></html>'
);

-- Re-engagement
INSERT INTO campaign_templates (name, category, type, description, tags, html_content) VALUES
(
  'Win Back Campaign',
  'reengagement',
  'email',
  'Re-engage inactive subscribers with a special offer.',
  ARRAY['reengagement','winback'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#f4f6f8}</style></head><body><table width="600" style="margin:32px auto;background:#fff;border-radius:16px;overflow:hidden" cellpadding="0"><tr><td style="background:linear-gradient(135deg,#1e293b,#334155);padding:48px;text-align:center"><p style="font-size:48px;margin:0">💔</p><h1 style="color:#fff;font-size:28px;font-weight:900;margin:16px 0 8px">We miss you, {{first_name}}</h1><p style="color:#94a3b8;font-size:16px;margin:0">It''s been a while since we''ve heard from you.</p></td></tr><tr><td style="padding:40px;text-align:center"><p style="color:#374151;font-size:16px;line-height:1.8">A lot has changed since your last visit. Here''s what''s new — and a little something to welcome you back:</p><div style="background:#fff7ed;border:2px solid #FED7AA;border-radius:12px;padding:24px;margin:24px 0"><p style="font-size:14px;color:#9ca3af;margin:0 0 8px">Your exclusive comeback offer</p><p style="font-size:36px;font-weight:900;color:#F97316;margin:0">25% OFF</p><p style="font-size:14px;color:#64748b;margin:8px 0 0">Use code <strong>MISSYOU25</strong></p></div><a href="{{cta_url}}" style="background:#F97316;color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:800;display:inline-block">Come Back →</a></td></tr></table></body></html>'
),
(
  'Subscription Renewal',
  'reengagement',
  'email',
  'Remind lapsing customers to renew before they lose access.',
  ARRAY['reengagement','renewal','subscription'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#f4f6f8}</style></head><body><table width="600" style="margin:32px auto;background:#fff;border-radius:16px;overflow:hidden" cellpadding="0"><tr><td style="background:#ef4444;padding:32px 40px;text-align:center"><p style="color:#fff;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 8px">Action Required</p><h1 style="color:#fff;font-size:24px;font-weight:900;margin:0">Your subscription expires in {{days_left}} days</h1></td></tr><tr><td style="padding:40px;text-align:center"><p style="color:#374151;font-size:16px;line-height:1.8">Hi {{first_name}}, don''t lose access to {{product_name}}. Renew today and keep everything you''ve built.</p><div style="background:#fef2f2;border-radius:12px;padding:20px;margin:24px 0"><p style="color:#b91c1c;font-size:14px;font-weight:600;margin:0">⏰ Expires: {{expiry_date}}</p></div><a href="{{renew_url}}" style="background:#ef4444;color:#fff;padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:800;display:inline-block">Renew Now</a></td></tr></table></body></html>'
);

-- Announcement
INSERT INTO campaign_templates (name, category, type, description, tags, html_content) VALUES
(
  'Company Announcement',
  'announcement',
  'email',
  'Formal company announcement: funding, acquisition, product milestone.',
  ARRAY['announcement','corporate'],
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#f8fafc}</style></head><body><table width="600" style="margin:32px auto;background:#fff;border-radius:16px;overflow:hidden" cellpadding="0"><tr><td style="background:#1e293b;padding:40px;text-align:center"><p style="color:#F97316;font-size:12px;font-weight:700;letter-spacing:4px;text-transform:uppercase;margin:0 0 12px">Official Announcement</p><h1 style="color:#fff;font-size:28px;font-weight:900;margin:0">{{announcement_title}}</h1></td></tr><tr><td style="padding:40px"><p style="color:#374151;font-size:16px;line-height:1.8">Dear {{first_name}},</p><p style="color:#374151;font-size:16px;line-height:1.8">{{announcement_body}}</p><div style="border-left:4px solid #F97316;padding:16px 20px;background:#fff7ed;border-radius:0 8px 8px 0;margin:24px 0"><p style="color:#92400e;font-size:15px;margin:0;line-height:1.7"><strong>Key takeaway:</strong> {{key_takeaway}}</p></div><p style="color:#374151;font-size:15px;line-height:1.8">If you have any questions, please reply to this email or contact our team.</p><div style="text-align:center;margin:32px 0"><a href="{{learn_more_url}}" style="background:#F97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700">Learn More</a></div></td></tr></table></body></html>'
);

-- ──────────────────────────────────────────────────────────────
-- SEED: SMS Templates
-- ──────────────────────────────────────────────────────────────

INSERT INTO campaign_templates (name, category, type, description, tags, html_content) VALUES
(
  'OTP Verification',
  'sms',
  'sms',
  'Send a one-time password for login or transaction verification.',
  ARRAY['otp','verification','security'],
  'Your {{company_name}} verification code is: {{otp_code}}. Valid for {{expiry_minutes}} minutes. Do not share this code with anyone.'
),
(
  'Promotional Offer',
  'sms',
  'sms',
  'Short, punchy promotional SMS with coupon code.',
  ARRAY['promo','discount'],
  '🎉 {{first_name}}, get {{discount}}% OFF today only! Use code {{coupon_code}} at checkout. Shop now: {{short_url}} Reply STOP to opt out.'
),
(
  'Appointment Reminder',
  'sms',
  'sms',
  'Friendly appointment reminder to reduce no-shows.',
  ARRAY['reminder','appointment'],
  'Hi {{first_name}}, this is a reminder of your appointment with {{business_name}} on {{date}} at {{time}}. Reply YES to confirm or CANCEL to reschedule.'
),
(
  'Order Status Update',
  'sms',
  'sms',
  'Real-time order dispatch and delivery updates.',
  ARRAY['order','shipping','update'],
  'Hi {{first_name}}! Your order #{{order_id}} has been {{status}}. {{tracking_message}} Track here: {{tracking_url}}'
),
(
  'Event Alert',
  'sms',
  'sms',
  'Last-call reminder for an upcoming event.',
  ARRAY['event','reminder'],
  '⏰ Reminder: {{event_name}} starts in {{time_until}}! {{location_or_link}} See you there! — {{company_name}}'
),
(
  'Sales Follow Up SMS',
  'sms',
  'sms',
  'Quick SMS follow up after a call or meeting.',
  ARRAY['followup','sales'],
  'Hi {{first_name}}, great speaking with you today! Here''s the info we discussed: {{short_url}} — {{sender_name}}, {{company_name}}'
);
