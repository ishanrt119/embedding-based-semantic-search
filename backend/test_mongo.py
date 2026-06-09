import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def test_conn():
    try:
        print("connecting...")
        uri = "mongodb+srv://ishantoraskar07_db_user:CMkCBxU6vSqPWR6S@cluster0.utaidf5.mongodb.net/"
        client = AsyncIOMotorClient(uri, tls=True, tlsAllowInvalidCertificates=True)
        print("pinging...")
        await client.admin.command('ping')
        print("Connected successfully!")
        client.close()
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_conn())
