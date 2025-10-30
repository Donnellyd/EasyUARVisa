from app import db
from datetime import datetime

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(255), unique=True, nullable=False)
    application_id = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), default='ZAR')
    email = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    country = db.Column(db.String(100))
    status = db.Column(db.String(50), default='pending')
    payment_id = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'reference': self.reference,
            'application_id': self.application_id,
            'amount': float(self.amount),
            'currency': self.currency,
            'email': self.email,
            'name': self.name,
            'country': self.country,
            'status': self.status,
            'payment_id': self.payment_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
