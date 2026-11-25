import os
from sqlalchemy import URL, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

class Base(DeclarativeBase):
    pass

engine = create_engine(URL.create("postgresql+psycopg", username=os.getenv("DB_USER","aihub"),
    password=os.getenv("DB_PASSWORD","local_dev_only"), host=os.getenv("DB_HOST","localhost"),
    database=os.getenv("DB_NAME","aihub")), pool_pre_ping=True)
Session = sessionmaker(engine)
def get_db():
    with Session() as session:
        yield session
