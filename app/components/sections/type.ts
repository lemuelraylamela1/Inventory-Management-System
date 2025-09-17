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
};

export type CustomerType = {
  _id: string;
  createdDT: Date;
  groupCode: string;
  groupName: string;
  discount1: number;
  discount2: number;
  discount3: number;
  discount4: number;
  discount5: number;
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
