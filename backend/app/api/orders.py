from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import exc
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.models.order import Order
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse

router = APIRouter()

def format_order(order: Order, customer: Customer):
    data = {c.name: getattr(order, c.name) for c in order.__table__.columns}
    data["customer_code"] = customer.customer_code if customer else None
    data["customer_name"] = customer.customer_name if customer else None
    data["company_name"] = customer.company_name if customer else None
    
    if order.quantity > 0:
        data["progress_percentage"] = round((order.completed_quantity / order.quantity) * 100, 2)
    else:
        data["progress_percentage"] = 0.0
        
    return data

@router.post("/", response_model=OrderResponse)
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    try:
        new_order = Order(**data.model_dump())
        if new_order.unit_price is not None and new_order.quantity is not None:
            new_order.total_amount = new_order.unit_price * new_order.quantity
            
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        return format_order(new_order, customer)
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Order number already exists")

@router.get("/", response_model=List[OrderResponse])
def get_orders(
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    customer_id: Optional[int] = None,
    order_date: Optional[date] = None,
    expected_delivery_date: Optional[date] = None,
    delivery_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Order, Customer).join(Customer, Order.customer_id == Customer.id)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Order.order_number.ilike(search_term)) |
            (Customer.customer_name.ilike(search_term)) |
            (Order.product_name.ilike(search_term)) |
            (Order.product_category.ilike(search_term))
        )
    if status:
        query = query.filter(Order.status == status)
    if priority:
        query = query.filter(Order.priority == priority)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    if order_date:
        query = query.filter(Order.order_date == order_date)
    if expected_delivery_date:
        query = query.filter(Order.expected_delivery_date == expected_delivery_date)
        
    if delivery_filter:
        today = date.today()
        if delivery_filter == "Today":
            query = query.filter(Order.expected_delivery_date == today)
        elif delivery_filter == "Upcoming":
            query = query.filter(Order.expected_delivery_date > today)
        elif delivery_filter == "Overdue":
            query = query.filter(
                Order.expected_delivery_date < today,
                Order.status.notin_(["Delivered", "Cancelled"])
            )
            
    # sort nearest delivery first usually, but let's just order by ID desc for now
    query = query.order_by(Order.id.desc())
    results = query.all()
    return [format_order(o, c) for o, c in results]

@router.get("/{id}", response_model=OrderResponse)
def get_one_order(id: int, db: Session = Depends(get_db)):
    result = db.query(Order, Customer).join(Customer, Order.customer_id == Customer.id).filter(Order.id == id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Order not found")
    o, c = result
    return format_order(o, c)

@router.put("/{id}", response_model=OrderResponse)
def update_order(id: int, data: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if data.customer_id:
        customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
            
    update_data = data.model_dump(exclude_unset=True)
    
    # Handle constraints logically
    if 'completed_quantity' in update_data:
        q = update_data.get('quantity', order.quantity)
        if update_data['completed_quantity'] > q:
             raise HTTPException(status_code=400, detail="Completed quantity cannot exceed total quantity")
             
    for key, value in update_data.items():
        setattr(order, key, value)
        
    # Recalculate total amount
    if order.unit_price is not None and order.quantity is not None:
        order.total_amount = order.unit_price * order.quantity
        
    # Handle actual delivery date logic
    if order.status == "Delivered" and not order.actual_delivery_date:
        order.actual_delivery_date = date.today()
        
    try:
        db.commit()
        db.refresh(order)
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Order number already exists")
        
    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
    return format_order(order, customer)

@router.delete("/{id}")
def delete_order(id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully"}
