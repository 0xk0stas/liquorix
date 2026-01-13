// prettier-ignore
export default {
  connectedAccountContainer: 'connected-account flex flex-col gap-6',
  connectedAccountHeader: 'connected-account-header flex justify-between items-center',
  connectedAccountHeaderTitle: 'connected-account-header-title text-sm font-bold tracking-[0.2em] uppercase text-neutral-500',
  connectedAccountHeaderIcon: 'connected-account-header-icon text-orange-500/50 transition-transform duration-300 ease-out hover:text-orange-500',
  connectedAccountHeaderIconRotated: 'rotate-180',
  connectedAccountDetails: 'connected-account-details flex flex-col gap-6',
  connectedAccountDetailsHidden: 'hidden',

  // Account Info (Top section)
  connectedAccountInfo: 'connected-account-info flex h-14 gap-3 items-center bg-white/[0.02] border border-white/5 rounded-2xl px-4 transition-all hover:border-white/10',
  connectedAccountInfoIcon: 'connected-account-info-icon min-w-10 min-h-10 flex items-center justify-center text-orange-500/80 bg-orange-500/5 rounded-xl overflow-hidden p-2 border border-orange-500/10',
  connectedAccountInfoText: 'connected-account-info-text truncate flex flex-col',
  connectedAccountInfoTextValue: 'connected-account-info-text-value text-white font-mono text-sm tracking-tight',
  connectedAccountDetailsIcon: 'w-5 h-5',
  connectedAccountDetailsXLogo: 'fill-orange-500 w-5 h-5',
  connectedAccountDetailsTrimAddress: 'w-full',

  // Liquorix Sections
  divider: 'w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent my-2',
  sectionTitle: 'section-title text-[9px] font-black uppercase tracking-[0.4em] text-neutral-600 mb-2 mt-4 flex items-center gap-2 after:content-[""] after:flex-1 after:h-px after:bg-white/5',

  // Stats Layout
  statsContainer: 'stats-container flex flex-col gap-2',
  statCard: 'stat-card bg-neutral-900/40 border border-white/5 rounded-2xl p-4 transition-all hover:bg-neutral-900/60 hover:border-orange-500/20 group',
  statRowSmall: 'stat-row-small flex justify-between items-center',
  statLabel: 'stat-label text-[10px] font-mono tracking-widest text-neutral-500 uppercase group-hover:text-neutral-400 transition-colors',
  statValue: 'stat-value text-sm font-black text-white tabular-nums tracking-tight',
  statSubValue: 'stat-sub-value text-[10px] font-mono text-orange-500/60 mt-0.5',

  // Statuses
  healthBar: 'h-1.5 w-full bg-neutral-950 rounded-full mt-2 overflow-hidden border border-white/5',
  healthProgress: 'h-full bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]',
  badge: 'px-2 py-0.5 rounded text-[8px] font-bold tracking-[0.1em] uppercase',
  badgeGreen: 'bg-green-500/10 text-green-500 border border-green-500/20',
  badgeRed: 'bg-red-500/10 text-red-500 border border-red-500/20'
} satisfies Record<string, string>;
