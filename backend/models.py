from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    display_name: str
    phone: str
    password: str
    avatar_color: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    about: Optional[str] = None
    avatar_color: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    display_name: str
    phone: str
    avatar_color: str
    avatar_url: Optional[str]
    about: Optional[str]
    is_online: int
    last_seen: Optional[datetime]

class ContactAdd(BaseModel):
    username: str

class ConversationCreate(BaseModel):
    type: str
    member_ids: List[str]
    name: Optional[str] = None

class ConversationUpdate(BaseModel):
    is_pinned: Optional[int] = None
    is_archived: Optional[int] = None
    is_muted: Optional[int] = None
    name: Optional[str] = None

class MessageCreate(BaseModel):
    content: str
    message_type: Optional[str] = 'text'

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: Optional[str] = None
    sender_avatar_color: Optional[str] = None
    content: str
    message_type: str
    status: str
    created_at: datetime

class ConversationResponse(BaseModel):
    id: str
    type: str
    name: Optional[str]
    avatar_url: Optional[str]
    members: List[UserResponse]
    last_message: Optional[MessageResponse] = None
    unread_count: int
    is_pinned: int
    is_archived: int
    is_muted: int
    created_at: datetime
    updated_at: datetime
