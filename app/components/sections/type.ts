export type ItemType = {
  /* item details */
  _id: string;
  itemCode: string;
  itemName: string;
  description: string;
  purchasePrice: number;
  salesPrice: number;
  status: "ACTIVE" | "INACTIVE";
  category: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  createdDT: string;
  imageUrl: string | null;
  imageFile: File | null;
  imagePublicId?: string;
  /* unit of measurement */
  unitCode: string;
  unitDescription: string;
  unitType: string;
  unitStatus: "ACTIVE" | "INACTIVE";
  createdAt?: Date;
  updatedAt?: Date;
  quantity?: number;
};

export type WarehouseType = {
  _id: string;
  createdDT: Date;
  warehouse_code: string;
  warehouse_name: string;
  warehouse_location: string;
};

export type SalesPersonType = {
  _id: string;
  createdDT: Date;
  salesPersonCode: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  contactNumber: string;
  area: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  salesPersonName?: string;
};

export type CustomerType = {
  _id: string;
  createdDT: string; // MMDDYYYY format from virtual
  groupCode: string;
  groupName: string;
  discounts: string[]; // formatted with two decimals via getter
  createdAt?: Date;
  updatedAt?: Date;
};

export type SupplierType = {
  _id: string;
  createdDT: Date;
  supplierCode: string;
  supplierName: string;
  contactPerson: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Customer = {
  _id: string;
  createdDT: string;
  customerCode: string;
  customerName: string;
  address: string;
  contactPerson: string;
  contactNumber: string;
  emailAddress?: string;
  TIN: string;
  customerGroup: string;
  salesAgent: string;
  terms: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PurchaseOrderItem = {
  itemName: string;
  quantity: number;
  unitType?: string;
  purchasePrice: number;
  itemCode?: string;
  amount?: number;
};

export type PurchaseOrderType = {
  _id: string;
  poNumber: string;
  referenceNumber: string;
  supplierName: string;
  warehouse: string;
  items: PurchaseOrderItem[];
  total?: number;
  totalQuantity?: number;
  balance?: number;
  remarks?: string;
  status: "PENDING" | "PARTIAL" | "REJECTED" | "COMPLETED";
  createdAt?: Date;
};

export type PurchaseOrderResponse = PurchaseOrderType & {
  _id: string;
  poNumber: string;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseReceiptType = {
  _id?: string;
  prNumber?: string;
  supplierInvoiceNum: string;
  poNumber: string[];
  amount?: number;
  supplierName?: string;
  warehouse?: string;
  status?: "OPEN" | "RECEIVED";
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: {
    itemCode: string;
    itemName: string;
    quantity: number;
    unitType: string;
    purchasePrice: number;
    amount: number;
  }[];
};

export type ReceiptItem = {
  itemCode: string;
  itemName: string;
  quantity: number;
  unitType: string;
  purchasePrice: number;
  receiptQty?: number;
  qtyLeft?: number;
  amount: number;
  selected?: boolean;
};

export type PurchaseReceiptResponse = Required<PurchaseReceiptType>;

export type PurchaseReturnType = {
  _id: string;
  returnNumber: string;
  prNumber: string;
  supplierName: string;
  reason: string;
  status: string;
  notes?: string;
  receiptQty: number;
  qtyLeft: number;
  warehouse?: string; // ✅ Add this if it's part of the return context
  items: ReceiptItem[];
  createdAt: string;
  updatedAt?: string;
};

export type PurchaseReturnResponse = {
  _id: string;
  returnNumber: string;
  prNumber: string;
  supplierName: string;
  status: string;
  notes?: string;
  reason: string;
  receiptQty: number;
  qtyLeft: number;
  createdAt?: string;
  items: {
    itemCode: string;
    itemName: string;
    unitType: string;
    purchasePrice: number;
    quantity: number;
    amount?: number;
  }[];
};

export type InventoryItem = {
  itemCode: string;
  itemName: string;
  description: string;
  category: string;
  quantity: number;
  unitType: string;
  purchasePrice?: number;
  salesPrice?: number;
  source?: string; // e.g. PR or PO reference
  referenceNumber: string;
  receivedAt?: Date;
  updatedAt?: Date;
  createdAt?: Date;
  inQty?: number;
  outQty?: number;
};

export type InventoryType = {
  _id: string;
  warehouse: string;
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number;
  remarks?: string;
  referenceNumber: string;
  particulars: string;
  user: string;
  activity: string;
  date: string;
  inQty: number;
  outQty: number;
  currentOnhand: number;
  createdAt?: Date;
  updatedAt?: Date;
  unitType?: string;
};

import type { Types } from "mongoose";

// 🔹 Base item type
export type SalesOrderItem = {
  _id?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitType: string;
  price: number;
  amount: number;
  itemCode?: string;
  salesPrice?: number;
  weight?: number;
  cbm?: number;
};

// 🔹 Discount deduction step
export type DiscountStep = {
  rate: number;
  amount: number;
  remaining: number;
};

// 🔹 Full SalesOrder document (from DB)
export type SalesOrder = {
  _id: string | Types.ObjectId;
  soNumber: string;
  customer: string;
  salesPerson: string;
  warehouse: string;
  transactionDate: string;
  deliveryDate?: string;
  shippingAddress?: string;
  notes?: string;
  status: "PENDING" | "TO PREPARE" | "COMPLETED" | "CANCELLED";
  items: SalesOrderItem[];
  discounts?: string[];
  discountBreakdown: DiscountStep[];
  total: number;
  totalQuantity: number;
  formattedWeight: string;
  formattedCBM: string;
  formattedTotal: string;
  formattedNetTotal: string;
  creationDate: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Status = SalesOrder["status"];

// 🔹 Input payload for creation
export type SalesOrderInput = Omit<
  SalesOrder,
  "_id" | "soNumber" | "createdAt" | "updatedAt"
>;

export type SalesInvoice = {
  _id: string;
  invoiceNo: string; // e.g. "SI0000000001"
  invoiceDate: Date;
  customer: string; // uppercase name
  customerRef?: string; // ObjectId reference
  salesPerson: string;
  salesOrder?: string; // ObjectId reference
  amount: number;
  balance: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "VOID";
  reference?: string;
  TIN?: string;
  terms?: string;
  address?: string;
  dueDate?: Date; // ISO format
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  items: SalesInvoiceItem[];
};

export type SalesInvoiceItem = {
  _id: string;
  itemCode: string;
  itemName: string;
  description: string;
  unitType: string;
  price: number;
  quantity: number;
  amount: number;
};

export type TransferRequestItem = {
  itemCode: string;
  quantity: number;
  unitType: string;
};

export type TransferRequest = {
  _id?: string;
  requestNo: string;
  requestingWarehouse: string;
  sourceWarehouse: string;
  transactionDate: Date | string;
  transferDate?: Date | string; // 🆕 Optional transfer date
  reference?: string; // 🆕 Optional reference number
  notes?: string; // 🆕 Optional notes
  preparedBy: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  items: TransferRequestItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type TransferApproval = {
  _id: string;
  transferApproveNo: string; // Auto-generated: TA0000000001, TA0000000002, ...
  transferRequestNo: string; // References TransferRequest.requestNo
  approvedBy: string;
  approvedDate: Date;
  status: "APPROVED" | "REJECTED";
};
export type TransferApprovalInput = Omit<
  TransferApproval,
  "_id" | "approvedDate"
>;

export type AccountCode = {
  _id?: string;
  accountCode: string;
  accountName: string;
  salesAccount: string;
  purchaseAccount: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Bank = {
  _id?: string;
  bankAccountName: string;
  bankAccountCode: string;
  bankAccountNumber: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
};

export type AtcCode = {
  _id?: string;
  atcCode: string;
  taxRate: number;
  taxCode: string;
  description?: string;
  ewt?: number;
  cwt?: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
};
