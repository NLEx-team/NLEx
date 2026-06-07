from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
async def me():
    return {"message": "Me"}

@router.get("/:id")
async def get_user(id: int):
    return {"message": "Get user"}

@router.get("/all")
async def get_all_users():
    return {"message": "Get all users"}

@router.patch("/me")
async def update_me():
    return {"message": "Update me"}

@router.delete("/me")
async def delete_me():
    return {"message": "Delete me"}

@router.delete("/:id")
async def delete_user(id: int):
    return {"message": "Delete user"}