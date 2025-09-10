export type ItemType = {
  _id: string;
  item_code: string;
  item_name: string;
  item_description: string;
  purchasePrice: number;
  salesPrice: number;
  item_status: string;
  item_category: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  createdDT: string;
  imageUrl: string;
  imageFile?: File;
  imagePublicId?: string;
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
  address: string;
  TIN: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
};
