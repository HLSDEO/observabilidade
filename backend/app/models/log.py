from sqlalchemy import Column, String, DateTime, Text, Index
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database import Base

class Log(Base):
    __tablename__ = "logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    source = Column(String(255), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)
    identifier = Column(String(255), nullable=False, index=True)
    data = Column(Text, nullable=False)
    location = Column(String(255))
    environment = Column(String(50), nullable=False)
    status_code = Column(String(50))
    identifier_2 = Column(String(255), index=True)
    identifier_3 = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index('idx_start_end_time', 'start_time', 'end_time'),
    )

    def __repr__(self):
        return f"<Log(id={self.id}, source={self.source}, type={self.type})>"
