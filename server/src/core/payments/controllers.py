from typing import List

from sqlalchemy.orm import Session

from ..database import engine, get_db
from .models import Payment
import datetime
import os
import stripe
from typing import Optional
from ..customers.controllers import get_customer
from ..exceptions import ConditionException, NotFoundException
from ..items.models import Item, PurchasedItem
from .schemas import PaymentCreateSchema, PaymentCheckSchema


def create_payment_sheet(payment_sheet: PaymentCreateSchema):
    """Create a Stripe PaymentIntent, persist Payment and PurchasedItems, and return client secrets.

    Mirrors the logic previously in payments/routes.create_sheet so other server modules can call it.
    """
    customer: Optional[object] = get_customer(payment_sheet.customer_id)

    ephemeral_key = stripe.EphemeralKey.create(
        customer=customer.id,
        stripe_version='2022-08-01',
    )

    customer_stripe = stripe.Customer.retrieve(customer.id)

    pending_items: dict = {pi.id: pi.amount for pi in payment_sheet.pending_items}
    items_id: List[int] = [pi.id for pi in payment_sheet.pending_items]
    with Session(engine) as db:
        items: List[Item] = db.query(Item).filter(Item.id.in_(items_id)).all()

        if len(items) != len(payment_sheet.pending_items):
            raise NotFoundException(detail="Item not found.")

        price: int = sum([pending_items[i.id] * i.price for i in items])

        payment_intent = stripe.PaymentIntent.create(
            amount=price,
            currency='xof',
            customer=customer_stripe,
            automatic_payment_methods={
                'enabled': True,
            },
        )

        payment: Payment = Payment(
            id=payment_intent.id,
            customer_id=payment_sheet.customer_id
        )

        db.add(payment)
        db.commit()
        db.refresh(payment)

        purchased_items: List[PurchasedItem] = []
        for key, value in pending_items.items():
            purchased_item: PurchasedItem = PurchasedItem(
                customer_id=payment_sheet.customer_id,
                amount=value,
                item_id=key,
                payment_id=payment.id
            )
            purchased_items.append(purchased_item)
            db.add(purchased_item)

        db.commit()

    return {
        "paymentIntent": payment_intent.client_secret,
        "ephemeralKey": ephemeral_key.secret,
        "customer": customer_stripe["id"],
        "publishableKey": os.environ.get("STRIPE_PK")
    }


def check_payment(payment_intent_id: str, payment_check: PaymentCheckSchema) -> Payment:
    """Validate a payment intent (status succeeded), mark payment as checked and return the Payment record."""
    with Session(engine) as db:
        payment: Optional[Payment] = db.query(Payment).filter(
            Payment.customer_id == payment_check.customer_id,
            Payment.id == payment_intent_id,
            Payment.is_checked == False
        ).first()

        if not payment:
            raise NotFoundException(detail="Payment not found or already checked.")

        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)

        if not payment_intent:
            raise NotFoundException(detail="Payment intent not found.")

        if not payment_intent.status == "succeeded":
            raise ConditionException(detail="Unsuccessful payment intent.")
        
        amount: int = payment_intent.amount_received

        purchased_items: List[PurchasedItem] = db.query(PurchasedItem).filter(
            PurchasedItem.payment_id == payment.id
        ).all()

        price: int = sum([pi.amount * pi.item.price for pi in purchased_items])

        # validation of the price against the amount paid
        if not price == amount:
            print(price, amount)
            raise ConditionException(detail="Price does not match with amount paid.")

        # payment validation to avoid fraud
        payment.is_checked = True
        payment.checkout_date = datetime.datetime.now()

        db.add(payment)
        db.commit()

        db.refresh(payment)

        return payment


def get_payments(offset: int, limit: int) -> List[Payment]:
    with Session(engine) as db:
        return db.query(Payment).offset(offset).limit(limit).all()


def get_payments_by_customer(customer_id: str, offset: int, limit: int) -> List[Payment]:
    with Session(engine) as db:
        return db.query(Payment).filter(Payment.customer_id == customer_id).offset(offset).limit(limit).all()
