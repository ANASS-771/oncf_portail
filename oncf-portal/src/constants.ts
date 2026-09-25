// Pagination
export const PAGE_SIZE         = 20;
export const PAGE_SIZE_SM      = 15;  // ReclamationsPage (client view)
export const PAGE_SIZE_XS      = 10;  // SimulateurPage

// Search debounce
export const SEARCH_DEBOUNCE_MS = 300;

// Alert type codes (match backend STOCK_45J / STOCK_30J)
export const ALERT_TYPE_SOUFFRANCE = 'STOCK_45J';
export const ALERT_TYPE_CRITICAL   = 'STOCK_30J';

// Alert day thresholds
export const ALERT_DAYS_WARNING    = 15;
export const ALERT_DAYS_CRITICAL   = 30;
export const ALERT_DAYS_SOUFFRANCE = 45;

// Simulateur billing tariffs (confirmed against real FELog invoices)
export const SIMU_MANUT_PU         = 400;   // MAD/TC (entrée 200 + sortie 200)
export const SIMU_APM_PU           = 310;   // MAD/TC (APM Terminal Tanger Med)
export const SIMU_OP_DOC_PU_MAERSK =  50;   // MAD/TC  (Maersk clients, TVA exo)
export const SIMU_OP_DOC_PU_STD    = 500;   // MAD/acquit (autres clients, TVA 20%)
export const SIMU_REDEVANCE_PU     = 150;   // MAD/acquit
export const SIMU_CAMIONNAGE_PU    = 1260;  // MAD/acquit

// Visite prestation codes (GPLOG)
export const VISITE_CODES = [103, 116, 117] as const;
