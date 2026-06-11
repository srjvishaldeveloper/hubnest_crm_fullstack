'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, X, Zap, Crown, Gem } from 'lucide-react';

interface UpgradePromptProps {
  resource: string;
  currentPlan: string;
  currentCount: number;
  maxAllowed: number;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

const PLAN_ICONS: Record<string, any> = {
  starter: Zap,
  pro: Crown,
  enterprise: Gem,
};

const RESOURCE_LABELS: Record<string, string> = {
  leads: 'Leads',
  team_members: 'Team Members',
  departments: 'Departments',
  contacts: 'Contacts',
  campaigns: 'Marketing Campaigns',
  pipelines: 'Pipelines',
};

const NEXT_PLAN: Record<string, string> = {
  starter: 'Pro',
  pro: 'Enterprise',
};

export default function UpgradePrompt({
  resource,
  currentPlan,
  currentCount,
  maxAllowed,
  onUpgrade,
  onDismiss,
}: UpgradePromptProps) {
  const [visible, setVisible] = useState(true);
  const planLower = currentPlan.toLowerCase();
  const nextPlan = NEXT_PLAN[planLower] || 'Enterprise';
  const resourceLabel = RESOURCE_LABELS[resource] || resource;
  const percentage = maxAllowed > 0 ? Math.round((currentCount / maxAllowed) * 100) : 100;
  const isAtLimit = currentCount >= maxAllowed;

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        className={`relative p-4 rounded-2xl border shadow-sm ${
          isAtLimit
            ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
            : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
        }`}
      >
        {onDismiss && (
          <button
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/50 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isAtLimit ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${isAtLimit ? 'text-red-600' : 'text-amber-600'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-bold ${isAtLimit ? 'text-red-800' : 'text-amber-800'}`}>
              {isAtLimit
                ? `You've reached your ${currentPlan} plan limit`
                : `${resourceLabel} usage is ${percentage}%`
              }
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              {isAtLimit
                ? `You have used ${currentCount} of ${maxAllowed} ${resourceLabel.toLowerCase()}. Upgrade to ${nextPlan} for more capacity.`
                : `${currentCount} of ${maxAllowed} ${resourceLabel.toLowerCase()} used. Consider upgrading to ${nextPlan} before reaching your limit.`
              }
            </p>

            {/* Progress bar */}
            <div className="mt-2 w-full h-2 bg-white/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAtLimit ? 'bg-red-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className={`mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl transition shadow-sm ${
                  isAtLimit
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Upgrade to {nextPlan}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
