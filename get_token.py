import asyncio
import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from database.mongodb import db_client
from api.auth import create_access_token

async def run():
    await db_client.connect()
    # Find any user
    user = await db_client.db.users.find_one({})
    if user:
        token = create_access_token({"sub": user["email"]})
        print(token)
    else:
        print("No user found")

if __name__ == '__main__':
    asyncio.run(run())
