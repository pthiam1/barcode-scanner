# server/src/core/items/schemas.py
from typing import Optional

from pydantic import BaseModel


class ItemBase(BaseModel):
    name: str
    price: int
    barcode: Optional[str] = None # code barre [Papa thiam]

    class Config:
        orm_mode = True


class ItemSchema(ItemBase):
    id: int
    barcode: Optional[str] = None

    class Config:
        orm_mode = True


class AddItemSchema(ItemBase):
    pass


class RemoveItemSchema(BaseModel):
    id: int

    class Config:
        orm_mode = True


class PendingItem(BaseModel):
    id: int
    amount: int

    class Config:
        orm_mode = True


class PurchasedItem(BaseModel):
    item: Optional[ItemSchema]
    amount: int

    class Config:
        orm_mode = True
