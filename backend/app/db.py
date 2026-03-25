from dotenv import load_dotenv
load_dotenv()

from prisma import Prisma

db = Prisma()


def get_db() -> Prisma:
    """Return the single shared Prisma client instance for the whole app."""
    return db


async def connect_db():
    await db.connect()
    print("✅ Connected to Supabase via Prisma")

async def disconnect_db():
    await db.disconnect()
    print("🔌 Disconnected from Supabase")
