export const PERM = {
  RECEIVABLES: { VIEW: 'receivables:view', CREATE: 'receivables:create', UPDATE: 'receivables:update', DELETE: 'receivables:delete' },
  PAYABLES:    { VIEW: 'payables:view',    CREATE: 'payables:create',    UPDATE: 'payables:update',    DELETE: 'payables:delete'    },
  INVOICES:    { VIEW: 'invoices:view',    CREATE: 'invoices:create',    UPDATE: 'invoices:update',    DELETE: 'invoices:delete'    },
  FLIGHTS:     { VIEW: 'flights:view',     CREATE: 'flights:create',     UPDATE: 'flights:update',     DELETE: 'flights:delete'     },
  PLANES:      { VIEW: 'planes:view',      CREATE: 'planes:create',      UPDATE: 'planes:update',      DELETE: 'planes:delete'      },
  CUSTOMERS:   { VIEW: 'customers:view',   CREATE: 'customers:create',   UPDATE: 'customers:update',   DELETE: 'customers:delete'   },
  COMPANIES:   { VIEW: 'companies:view',   CREATE: 'companies:create',   UPDATE: 'companies:update',   DELETE: 'companies:delete'   },
} as const;
