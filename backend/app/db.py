from dotenv import load_dotenv
load_dotenv()

from prisma import Prisma

db = Prisma()

async def connect_db():
    await db.connect()
    print("✅ Connected to Supabase via Prisma")

async def disconnect_db():
    await db.disconnect()
    print("🔌 Disconnected from Supabase")
