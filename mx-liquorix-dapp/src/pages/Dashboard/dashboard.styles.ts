// prettier-ignore
export default {
  dashboardContainer: 'dashboard-container flex w-screen min-h-screen relative border-t border-b border-secondary transition-all duration-200',
  mobilePanelContainer: 'mobile-panel-container fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ease-in-out lg:static lg:z-auto',
  desktopPanelContainer: 'desktop-panel-container lg:flex',
  dashboardContent: 'dashboard-content flex flex-col gap-2 justify-start items-center flex-1 w-full overflow-auto border-l border-white/5 p-4 lg:p-6 transition-all duration-300 ease-out min-h-screen',
  dashboardContentMobilePanelOpen: 'dashboard-content-mobile-panel-open brightness-50 grayscale transition-all duration-300 pointer-events-none',
  dashboardWidgets: 'dashboard-widgets flex flex-col gap-6  w-full max-w-320'
} satisfies Record<string, string>;
