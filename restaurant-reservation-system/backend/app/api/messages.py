from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.user_message import UserMessage
from app.schemas.user_message import UserMessageCreate, UserMessageOut
from app.core.security import get_current_admin

router = APIRouter(prefix="/messages")


@router.post("/", response_model=UserMessageOut)
def create_message(data: UserMessageCreate, db: Session = Depends(get_db)):
    """Public endpoint — any user can send a suggestion/message."""
    msg = UserMessage(
        name=data.name,
        email=data.email,
        subject=data.subject,
        message=data.message,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/", response_model=List[UserMessageOut])
def get_messages(
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    """Admin-only — list all messages, newest first."""
    return db.query(UserMessage).order_by(UserMessage.created_at.desc()).all()


@router.patch("/{message_id}/read", response_model=UserMessageOut)
def mark_read(
    message_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    """Admin-only — mark a message as read."""
    msg = db.query(UserMessage).filter(UserMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_read = True
    db.commit()
    db.refresh(msg)
    return msg


@router.delete("/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    """Admin-only — delete a message."""
    msg = db.query(UserMessage).filter(UserMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(msg)
    db.commit()
    return {"ok": True}
