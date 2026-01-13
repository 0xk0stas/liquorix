// prettier-ignore
export default {
  leftPanelContainer: 'left-panel-container flex flex-col w-screen lg:w-80 gap-6 lg:gap-0 p-6 sticky lg:h-screen top-0 bg-neutral-950 lg:bg-accent border-t lg:border-t-0 border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] lg:shadow-none transition-all duration-300 ease-out overflow-y-auto',
  leftPanelContainerOpen: 'left-panel-container-open rounded-t-[2.5rem] lg:rounded-t-none h-[80vh] lg:h-screen',
  leftPanelMobileHeader: 'left-panel-mobile-header flex lg:hidden justify-between items-center pb-6 border-b border-white/5 transition-all duration-300 ease-out',
  leftPanelMobileHeaderIconClose: 'left-panel-mobile-header-icon-close text-orange-500 hover:text-orange-400 transition-all duration-200 ease-out',
  leftPanelMobileHeaderIconOpen: 'left-panel-mobile-header-icon-open fill-orange-500 transition-all duration-200 ease-out',
  leftPanel: 'left-panel flex flex-col gap-6 lg:!block',
  leftPanelHidden: 'hidden',
  leftPanelMobileAddressSection: 'left-panel-mobile-address-section lg:hidden bg-neutral-900/50 backdrop-blur-sm transition-all duration-200 ease-out h-12 flex items-center justify-between rounded-2xl border border-white/5 px-6',
  leftPanelMobileAddress: 'left-panel-mobile-address flex text-white font-mono text-xs gap-3 items-center justify-start w-[calc(100%-50px)]',
  leftPanelMobileAddressIcon: 'left-panel-mobile-address-icon text-orange-500 transition-all duration-200 ease-out',
  leftPanelMobileAddressWithExplorerLink: 'left-panel-mobile-address-with-explorer-link overflow-hidden text-ellipsis',
  logoutButton: 'text-center text-neutral-500 hover:text-orange-500 transition-all duration-200 ease-out cursor-pointer',
  leftPanelComponents: 'flex flex-col gap-6 lg:p-0 transition-all duration-200 ease-out',
  leftPanelBar: 'w-full h-px bg-white/5 transition-all duration-200 ease-out'
} satisfies Record<string, string>;
