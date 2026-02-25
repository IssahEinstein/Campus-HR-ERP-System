import asyncio
from prisma import Prisma

async def main():
    db = Prisma()
    await db.connect()
    # Replace 'user' with one of your model names
    print("Connected to Supabase!")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())