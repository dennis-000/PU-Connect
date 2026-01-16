# Quick Actions & Header Buttons Update

## Changes Needed in AdminDashboard.tsx:

### 1. State Already Added ✅
Lines 69-70 now have:
```tsx
const [showAddPersonModal, setShowAddPersonModal] = useState(false);
const [newPersonData, setNewPersonData] = useState({ full_name: '', email: '', password: '', role: 'buyer' as 'buyer' | 'admin' | 'news_publisher' });
```

### 2. Header Buttons (Lines 418-433) - MANUAL EDIT NEEDED:

Replace the buttons section with:
```tsx
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setShowAddPersonModal(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <i className="ri-user-add-line"></i>
              Add Person
            </button>
            <button 
              onClick={() => setShowAddAdminModal(true)}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700 transition-all flex items-center gap-2"
            >
              <i className="ri-shield-user-line text-blue-400"></i>
              <span className="hidden md:inline">Manage Access</span>
            </button>
            <button 
              onClick={fetchData}
              className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center"
              title="Refresh Data"
            >
              <i className="ri-refresh-line text-xl"></i>
            </button>
          </div>
```

### 3. Make Quick Actions Smaller (Around line 577):

Change the grid from:
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
```

To:
```tsx
<div className="grid grid-cols-3 md:grid-cols-5 gap-3">
```

And change the card padding from `p-6` to `p-4` and reduce icon/text sizes.

### 4. Add "Add Person" Modal (Before closing div, around line 940):

Add this modal before the Access Manager Modal:

```tsx
{/* Add Person Modal */}
{showAddPersonModal && (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl">
          <i className="ri-user-add-line"></i>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Add New Person</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Create a new user account</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
          <input 
            type="text" 
            value={newPersonData.full_name}
            onChange={(e) => setNewPersonData({...newPersonData, full_name: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all font-bold text-sm text-white placeholder-slate-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
          <input 
            type="email" 
            value={newPersonData.email}
            onChange={(e) => setNewPersonData({...newPersonData, email: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all font-bold text-sm text-white placeholder-slate-500"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
          <input 
            type="password" 
            value={newPersonData.password}
            onChange={(e) => setNewPersonData({...newPersonData, password: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all font-bold text-sm text-white placeholder-slate-500"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role</label>
          <select 
            value={newPersonData.role}
            onChange={(e) => setNewPersonData({...newPersonData, role: e.target.value as any})}
            className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all font-bold text-sm text-white"
          >
            <option value="buyer">Buyer</option>
            <option value="admin">Admin</option>
            <option value="news_publisher">News Publisher</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-10">
        <button onClick={() => setShowAddPersonModal(false)} className="py-5 rounded-2xl bg-slate-800 text-slate-300 font-black text-[10px] uppercase tracking-wider hover:bg-slate-700 transition-all">Cancel</button>
        <button 
          onClick={async () => {
            // TODO: Add handleCreatePerson function
            setNotification({ type: 'info', message: 'Feature coming soon!' });
            setShowAddPersonModal(false);
          }}
          className="py-5 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider hover:bg-emerald-700 transition-all"
        >
          Create User
        </button>
      </div>
    </div>
  </div>
)}
```

## Summary:
1. ✅ State added for Add Person modal
2. ⏳ Header buttons need manual update (Add Person button, icon-only Refresh, responsive Manage Access)
3. ⏳ Quick Actions need to be made smaller
4. ⏳ Add Person modal needs to be added

The file has HTML entity encoding issues preventing automated edits. Please make these changes manually.
