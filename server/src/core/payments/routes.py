import datetime
import os
from typing import List, Optional

import stripe
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..customers.controllers import get_customer
from ..customers.models import Customer
from ..database import get_db
from ..exceptions import ConditionException, NotFoundException
from ..items.models import Item, PurchasedItem
from .controllers import get_payments_by_customer, create_payment_sheet, check_payment
from .models import Payment
from .schemas import (PaymentCheckSchema, PaymentCreateSchema, PaymentSchema,
                      PaymentSheetSchema)

payments_router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
    responses={
        400: {"description": "Bad Request"},
        404: {"description": "Not found"},
    }
)


@payments_router.get('/', response_model=List[PaymentSchema])
def get_payments(
    offset: int = 0,
    limit: int = Query(default=100, lte=100),
    db: Session = Depends(get_db)
):
    # ERROR: RecursionError: maximum recursion depth exceeded
    # return get_payments(offset, limit)

    return db.query(Payment).offset(offset).limit(limit).all()


@payments_router.get('/{customer_id}', response_model=List[PaymentSchema])
def get_payments_by_customer_id(
    customer_id: str,
    offset: int = 0,
    limit: int = Query(default=100, lte=100),
    db: Session = Depends(get_db)
):
    # ERROR: Parent instance <Payment at 0x7f88a9185f90> is not bound to 
    #   a Session; lazy load operation of attribute 'customer' cannot 
    #   proceed (Background on this error at: https://sqlalche.me/e/14/bhk3)
    # return get_payments_by_customer(customer_id, offset, limit)

    return db.query(Payment).filter(Payment.customer_id == customer_id).offset(offset).limit(limit).all()

@payments_router.post('/', response_model=PaymentSheetSchema)
def create_sheet(
    payment_sheet: PaymentCreateSchema,
    db: Session = Depends(get_db)
):
    # Delegate logic to controller to keep route thin and re-usable
    return create_payment_sheet(payment_sheet)

@payments_router.post('/check/{payment_intent_id}', response_model=PaymentSchema)
def check_sheet_status_and_get_purchased_items(
    payment_intent_id: str,
    payment_check: PaymentCheckSchema,
    db: Session = Depends(get_db)
):
    return check_payment(payment_intent_id, payment_check)
