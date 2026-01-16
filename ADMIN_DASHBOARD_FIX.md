# Admin Dashboard Fix Required

## Issue:
The stats grid replacement was incomplete. The grid header changed to 6 columns but the old large alert cards (SMS Balance and Pending Applications) are still present, creating a broken layout.

## Current State (Lines 434-538):
- Header says "Unified Stats Grid" with 6-column grid
- But contains 2 large alert cards (SMS Balance, Pending Applications)  
- Followed by a duplicate 4-column stats grid (Users, Admins, Sellers, Publishers)

## Required Fix:
Replace lines 434-538 with a single unified 6-column grid containing:

```tsx
{/* Unified Stats Grid - All 6 Stats in One Line */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
  {[
    { label: 'Total Users', value: stats.users, icon: 'ri-group-line', gradient: 'from-blue-600 to-blue-700', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
    { label: 'Total Admins', value: stats.admins, icon: 'ri-shield-user-line', gradient: 'from-emerald-600 to-emerald-700', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
    { label: 'Total Buyers', value: stats.buyers, icon: 'ri-shopping-cart-line', gradient: 'from-violet-600 to-violet-700', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-400' },
    { label: 'Total Sellers', value: stats.sellers, icon: 'ri-store-2-line', gradient: 'from-cyan-600 to-cyan-700', iconBg: 'bg-cyan-500/10', iconColor: 'text-cyan-400' },
    { 
      label: 'SMS Balance', 
      value: stats.smsBalance, 
      icon: 'ri-message-3-line', 
      gradient: stats.smsBalance < 50 ? 'from-rose-600 to-rose-700' : 'from-purple-600 to-purple-700', 
      iconBg: stats.smsBalance < 50 ? 'bg-rose-500/10' : 'bg-purple-500/10', 
      iconColor: stats.smsBalance < 50 ? 'text-rose-400' : 'text-purple-400',
      alert: stats.smsBalance < 50
    },
    { 
      label: 'Pending Apps', 
      value: pendingApps.length, 
      icon: 'ri-file-list-3-line', 
      gradient: pendingApps.length > 0 ? 'from-amber-600 to-amber-700' : 'from-emerald-600 to-emerald-700', 
      iconBg: pendingApps.length > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10', 
      iconColor: pendingApps.length > 0 ? 'text-amber-400' : 'text-emerald-400',
      pulse: pendingApps.length > 0
    }
  ].map((stat: any, i) => (
    <div key={i} className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-all">
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor} group-hover:scale-110 transition-transform`}>
            <i className={`${stat.icon} text-lg ${stat.pulse ? 'animate-pulse' : ''}`}></i>
          </div>
          <div className={`text-2xl font-black ${stat.iconColor}`}>{stat.value.toLocaleString()}</div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
          {stat.alert && <i className="ri-alert-line text-rose-400 text-xs animate-pulse"></i>}
        </div>
      </div>
    </div>
  ))}
</div>
```

## Manual Fix Instructions:
1. Open `src/pages/admin/AdminDashboard.tsx`
2. Find line 434: `{/* Unified Stats Grid - All in One Line */}`
3. Delete everything from line 434 to line 538 (the closing `</div>` after the duplicate stats grid)
4. Paste the code above

This will create a clean, compact 6-column grid with all stats on one line.
