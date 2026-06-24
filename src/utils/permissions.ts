export const PERMISSIONS = {
  RECEIVABLES: { VIEW: 'receivables:view', CREATE: 'receivables:create', UPDATE: 'receivables:update', DELETE: 'receivables:delete' },
  PAYABLES:    { VIEW: 'payables:view',    CREATE: 'payables:create',    UPDATE: 'payables:update',    DELETE: 'payables:delete'    },
  BILLS:       { VIEW: 'bills:view',       CREATE: 'bills:create',       UPDATE: 'bills:update',       DELETE: 'bills:delete'       },
  FLIGHTS:     { VIEW: 'flights:view',     CREATE: 'flights:create',     UPDATE: 'flights:update',     DELETE: 'flights:delete'     },
  AIRCRAFT:    { VIEW: 'aircraft:view',    CREATE: 'aircraft:create',    UPDATE: 'aircraft:update',    DELETE: 'aircraft:delete'    },
  CUSTOMERS:   { VIEW: 'customers:view',   CREATE: 'customers:create',   UPDATE: 'customers:update',   DELETE: 'customers:delete'   },
  COMPANIES:   { VIEW: 'companies:view',   CREATE: 'companies:create',   UPDATE: 'companies:update',   DELETE: 'companies:delete'   },
  REPORTS:     { VIEW: 'reports:view' },
  TITLE_TYPES: { VIEW: 'title-types:view', CREATE: 'title-types:create', UPDATE: 'title-types:update', DELETE: 'title-types:delete' },
} as const;
