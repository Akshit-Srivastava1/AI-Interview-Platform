from sqlalchemy import Column, Integer, String
from sqlalchemy import DateTime
from datetime import datetime
from database import Base
import pytz

india = pytz.timezone("Asia/Kolkata")
# USER TABLE

class UserDB(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String)
    email = Column(
        String,
        unique=True,
        index=True
    )

    password = Column(String)

# INTERVIEW HISTORY TABLE

class InterviewHistory(Base):
    __tablename__ = "interview_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_email = Column(String)
    confidence = Column(Integer)
    eye_contact = Column(Integer)
    engagement = Column(Integer)
    speech = Column(Integer)
    feedback = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(india))

# CODING HISTORY TABLE

class CodingHistory(Base):
    __tablename__ = "coding_history"
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_email = Column(String)
    question = Column(String)
    score = Column(Integer)
    feedback = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(india))