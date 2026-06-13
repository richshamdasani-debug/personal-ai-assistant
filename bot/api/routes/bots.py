import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from bot.api.dependencies import get_current_user_id
from bot.api.models import (
    BotCreate,
    BotResponse,
    BotUpdate,
    DecisionResponse,
    TradeResponse,
)
from bot.db.supabase import get_supabase

router = APIRouter()


def _get_bot_or_404(supabase, bot_id: str, user_id: str) -> dict:
    """Fetch a bot row and verify it belongs to the requesting user."""
    result = (
        supabase.table("trading_bots")
        .select("*")
        .eq("id", bot_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Bot not found")
    bot = result.data
    if bot.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorised to access this bot")
    return bot


# ---------------------------------------------------------------------------
# List bots
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[BotResponse])
async def list_bots(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase()
    result = (
        supabase.table("trading_bots")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ---------------------------------------------------------------------------
# Create bot
# ---------------------------------------------------------------------------

@router.post("/", response_model=BotResponse, status_code=201)
async def create_bot(
    body: BotCreate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()

    # Enforce handle uniqueness across the platform
    existing = (
        supabase.table("trading_bots")
        .select("id")
        .eq("handle", body.handle)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=409, detail=f"Handle '{body.handle}' is already taken"
        )

    now = datetime.utcnow().isoformat()
    bot_id = str(uuid.uuid4())

    row = {
        "id": bot_id,
        "user_id": user_id,
        "handle": body.handle,
        "name": body.name,
        "model": body.model,
        "llm_provider": body.llm_provider,
        "symbol": body.symbol,
        "timeframes": body.timeframes,
        "system_prompt": body.system_prompt,
        "risk_mode": body.risk_mode,
        "max_position_usd": body.max_position_usd,
        "mode": body.mode,
        "hl_wallet_address": body.hl_wallet_address,
        "hl_private_key": body.hl_private_key,
        "status": "stopped",
        "equity_usd": None,
        "initial_equity_usd": 100.0,
        "total_trades": 0,
        "total_prompts": 0,
        "created_at": now,
        "updated_at": now,
    }

    result = supabase.table("trading_bots").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create bot")
    return result.data[0]


# ---------------------------------------------------------------------------
# Get single bot
# ---------------------------------------------------------------------------

@router.get("/{bot_id}", response_model=BotResponse)
async def get_bot(bot_id: str, user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase()
    return _get_bot_or_404(supabase, bot_id, user_id)


# ---------------------------------------------------------------------------
# Update bot settings
# ---------------------------------------------------------------------------

@router.put("/{bot_id}", response_model=BotResponse)
async def update_bot(
    bot_id: str,
    body: BotUpdate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    bot = _get_bot_or_404(supabase, bot_id, user_id)

    if bot.get("status") == "running":
        raise HTTPException(
            status_code=409,
            detail="Cannot update settings while bot is running. Stop it first.",
        )

    updates: dict = {
        k: v for k, v in body.model_dump(exclude_none=True).items()
    }
    if not updates:
        return bot

    updates["updated_at"] = datetime.utcnow().isoformat()
    result = (
        supabase.table("trading_bots")
        .update(updates)
        .eq("id", bot_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Update failed")
    return result.data[0]


# ---------------------------------------------------------------------------
# Delete bot
# ---------------------------------------------------------------------------

@router.delete("/{bot_id}", status_code=204)
async def delete_bot(bot_id: str, user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase()
    bot = _get_bot_or_404(supabase, bot_id, user_id)

    if bot.get("status") == "running":
        raise HTTPException(
            status_code=409,
            detail="Stop the bot before deleting it.",
        )

    supabase.table("trading_bots").delete().eq("id", bot_id).execute()


# ---------------------------------------------------------------------------
# Start bot
# ---------------------------------------------------------------------------

@router.post("/{bot_id}/start", response_model=BotResponse)
async def start_bot(bot_id: str, user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase()
    _get_bot_or_404(supabase, bot_id, user_id)

    now = datetime.utcnow().isoformat()
    result = (
        supabase.table("trading_bots")
        .update({"status": "running", "updated_at": now})
        .eq("id", bot_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to start bot")
    return result.data[0]


# ---------------------------------------------------------------------------
# Stop bot
# ---------------------------------------------------------------------------

@router.post("/{bot_id}/stop", response_model=BotResponse)
async def stop_bot(bot_id: str, user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase()
    _get_bot_or_404(supabase, bot_id, user_id)

    now = datetime.utcnow().isoformat()
    result = (
        supabase.table("trading_bots")
        .update({"status": "stopped", "updated_at": now})
        .eq("id", bot_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to stop bot")
    return result.data[0]


# ---------------------------------------------------------------------------
# Bot decisions (paginated)
# ---------------------------------------------------------------------------

@router.get("/{bot_id}/decisions", response_model=list[DecisionResponse])
async def get_decisions(
    bot_id: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    _get_bot_or_404(supabase, bot_id, user_id)

    offset = (page - 1) * limit
    result = (
        supabase.table("bot_decisions")
        .select("*")
        .eq("bot_id", bot_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data or []


# ---------------------------------------------------------------------------
# Bot trades (paginated)
# ---------------------------------------------------------------------------

@router.get("/{bot_id}/trades", response_model=list[TradeResponse])
async def get_trades(
    bot_id: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    _get_bot_or_404(supabase, bot_id, user_id)

    offset = (page - 1) * limit
    result = (
        supabase.table("bot_trades")
        .select("*")
        .eq("bot_id", bot_id)
        .order("opened_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data or []
