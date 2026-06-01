from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./aegis_data.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class NetworkEvent(Base):
    __tablename__ = "network_events"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    total_packets = Column(Integer)
    total_bytes = Column(Integer)
    avg_packet_size = Column(Float)
    packet_rate = Column(Float)
    byte_rate = Column(Float)
    tcp_packets = Column(Integer)
    udp_packets = Column(Integer)
    icmp_packets = Column(Integer)
    tcp_udp_ratio = Column(Float)
    avg_ttl = Column(Float)
    unique_src_ips = Column(Integer)
    unique_dst_ips = Column(Integer)
    unique_src_ports = Column(Integer)
    unique_dst_ports = Column(Integer)
    syn_count = Column(Integer)
    ack_count = Column(Integer)
    fin_count = Column(Integer)
    rst_count = Column(Integer)
    avg_tcp_window = Column(Float)
    prediction = Column(String(50))
    confidence = Column(Float)
    source_device = Column(String(100), nullable=True)
    source_ip = Column(String(50), nullable=True)


class Threat(Base):
    __tablename__ = "threats"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    threat_type = Column(String(50))
    severity = Column(String(20))
    confidence = Column(Float)
    device_id = Column(String(100))
    device_name = Column(String(200))
    device_ip = Column(String(50))
    department = Column(String(50))
    status = Column(String(20), default="active")
    description = Column(Text)
    blocked_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)


class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), unique=True)
    name = Column(String(200))
    device_type = Column(String(50))
    department = Column(String(50))
    ip_address = Column(String(50))
    status = Column(String(20), default="normal")
    is_compromised = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.utcnow)
    packets_in = Column(Integer, default=0)
    packets_out = Column(Integer, default=0)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
