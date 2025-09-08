export type ItemType = {
  _id: string;
  item_code: string;
  item_name: string;
  item_description: string;
  item_category: string;
  item_status: string;
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
  createdDT: string;
  warehouse_code: string;
  warehouse_name: string;
  warehouse_location: string;
};
