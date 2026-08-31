import Dexie, { type Table } from 'dexie'

// The offline-first POS's local database. Schema changes are additive,
// versioned Dexie migrations (never edit an existing .version() block once
// shipped) — new stores just appear in a later version; Dexie carries
// forward every existing store's data untouched. Nothing here is ever
// destroyed by a schema upgrade, including pending (unsynced) rows.

export interface DeviceMetaRecord {
  id: 'device' // singleton row
  deviceId: string
  // Non-extractable — IndexedDB's structured-clone algorithm supports storing
  // a CryptoKey object directly, so raw key bytes never touch JS.
  cryptoKey: CryptoKey
  encryptedCredential: ArrayBuffer | null
  credentialIv: ArrayBuffer | null
  credentialExpiresAt: string | null
}

export type OutboxEntityType = 'pos_sale' | 'pos_void'
export type OutboxState = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict' | 'rejected' | 'pending_approval'

export interface OutboxMutationRecord {
  id: string // UUIDv7 — the idempotency key the server also keys off of
  entityType: OutboxEntityType
  payload: unknown
  createdAt: string
  state: OutboxState
  retryCount: number
  lastError?: string
  resultEntityId?: string
}

export interface ProductCacheRecord {
  id: string
  name: string
  price: number
  salePrice: number | null
  stock: number
  costPrice: number
  isActive: boolean
  categoryId: string | null
  updatedAt: string
}

export interface CustomerCacheRecord {
  id: string
  name: string | null
  phone: string
  email: string | null
  creditLimit: number
  creditBalance: number
}

export interface LocalSaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface LocalSaleRecord {
  id: string // same id as its 'pos_sale' outbox mutation
  receiptCode: string
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  customerId?: string
  status: 'pending_sync' | 'synced' | 'voided' | 'rejected'
  createdAt: string
  items: LocalSaleItem[]
}

export interface SyncMetaRecord {
  id: 'cursor'
  cursor: number
}

// A last-known-good snapshot of this device's staff permission grant,
// refreshed every time the normal online access check succeeds. Lets the
// router allow a genuinely-offline reload into /pos (the one route this
// architecture supports working that way) using the last confirmed grant,
// rather than bouncing to a login screen the device has no way to satisfy
// right now. Never authorizes an actual API call — only local UI gating;
// every real write still goes through the separate device-session
// credential's own server-side checks (see routes/sync.ts).
export interface SessionCacheRecord {
  id: 'session'
  role: string
  isOwner: boolean
  permissions: string[]
  cachedAt: string
}

class OfflineDatabase extends Dexie {
  deviceMeta!: Table<DeviceMetaRecord, string>
  outboxMutations!: Table<OutboxMutationRecord, string>
  productsCache!: Table<ProductCacheRecord, string>
  customersCache!: Table<CustomerCacheRecord, string>
  salesLocal!: Table<LocalSaleRecord, string>
  syncMeta!: Table<SyncMetaRecord, string>
  sessionCache!: Table<SessionCacheRecord, string>

  constructor() {
    super('qesuite_pos_offline')

    this.version(1).stores({
      deviceMeta: 'id',
    })

    this.version(2).stores({
      deviceMeta: 'id',
      outboxMutations: 'id, state, createdAt',
      productsCache: 'id, isActive',
      customersCache: 'id, phone',
      salesLocal: 'id, status, createdAt',
      syncMeta: 'id',
    })

    this.version(3).stores({
      deviceMeta: 'id',
      outboxMutations: 'id, state, createdAt',
      productsCache: 'id, isActive',
      customersCache: 'id, phone',
      salesLocal: 'id, status, createdAt',
      syncMeta: 'id',
      sessionCache: 'id',
    })
  }
}

export const offlineDb = new OfflineDatabase()

// Reconstructs a UI-renderable Product from the local cache — used only when
// a genuinely-offline reload can't reach the server for the live product
// list at all (see SalesTerminalView.vue's offline-device-mode fallback).
// Fields this cache doesn't carry get safe, inert defaults; nothing here is
// ever written back to the server.
export function productCacheToDisplayProduct(record: ProductCacheRecord) {
  return {
    id: record.id,
    tenant_id: '',
    category_id: record.categoryId,
    name: record.name,
    description: null,
    price: record.price,
    sale_price: record.salePrice,
    stock: record.stock,
    image_url: null,
    featured: false,
    on_sale: record.salePrice !== null,
    is_active: record.isActive,
    sku: null,
    barcode: null,
    cost_price: record.costPrice,
    unit_of_measure: 'unit',
    reorder_level: 0,
    expiry_date: null,
    supplier_id: null,
    created_at: record.updatedAt,
    updated_at: record.updatedAt,
  }
}
