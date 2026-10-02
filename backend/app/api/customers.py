from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import exc
from typing import List, Optional
from app.core.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter()

@router.post("/", response_model=CustomerResponse)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    try:
        new_cust = Customer(**data.model_dump())
        db.add(new_cust)
        db.commit()
        db.refresh(new_cust)
        new_cust.order_count = 0
        return new_cust
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Customer code already exists")

@router.get("/", response_model=List[CustomerResponse])
def get_customers(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Customer)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Customer.customer_code.ilike(search_term)) |
            (Customer.customer_name.ilike(search_term)) |
            (Customer.company_name.ilike(search_term)) |
            (Customer.email.ilike(search_term))
        )
    customers = query.all()
    # Add order count
    for c in customers:
        c.order_count = db.query(Order).filter(Order.customer_id == c.id).count()
    return customers

@router.get("/{id}", response_model=CustomerResponse)
def get_customer(id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer.order_count = db.query(Order).filter(Order.customer_id == customer.id).count()
    return customer

@router.put("/{id}", response_model=CustomerResponse)
def update_customer(id: int, data: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)
        
    try:
        db.commit()
        db.refresh(customer)
        customer.order_count = db.query(Order).filter(Order.customer_id == customer.id).count()
        return customer
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Customer code already exists")

@router.delete("/{id}")
def delete_customer(id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    orders_count = db.query(Order).filter(Order.customer_id == id).count()
    if orders_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete customer. There are {orders_count} orders attached to this customer.")
        
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}
