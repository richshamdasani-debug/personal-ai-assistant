import json
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import ollama
from anthropic import Anthropic

from bot.config import settings


@dataclass
class TradingDecision:
    decision: str               # "buy" | "sell" | "hold"
    crv_score: int              # 1-5, 1=high conviction, 5=strong hold
    reasoning: str
    entry_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    prompt_tokens: Optional[int] = None


SYSTEM_PROMPT = """\
You are an algorithmic trading assistant operating on Hyperliquid perpetuals.
Your goal is to identify high-conviction trading opportunities using multi-timeframe analysis.

Decision Framework (CRV Score):
- Score 1-2: HIGH conviction → EXECUTE the trade (BUY or SELL)
- Score 3: MODERATE — wait for better entry, HOLD
- Score 4: LOW conviction — HOLD, unfavorable setup
- Score 5: STRONG HOLD — active risk-off, do not trade

Risk Modes:
- Conservative: Only trade with |Z-score| > 2.0 AND clear slope alignment
- Moderate: Trade with |Z-score| > 1.5 AND supporting slope
- Aggressive: Trade with |Z-score| > 1.0 AND any trending momentum

You MUST respond ONLY with a valid JSON object, no other text:
{
  "decision": "buy" | "sell" | "hold",
  "crv_score": 1-5,
  "reasoning": "detailed multi-timeframe analysis...",
  "entry_price": null | number,
  "stop_loss": null | number,
  "take_profit": null | number
}"""


def _build_timeframe_section(tf: str, analysis: dict) -> str:
    """Build a formatted timeframe section string from an analysis dict."""
    z = analysis.get("zscore", 0.0)
    slope = analysis.get("slope", 0.0)
    chop = analysis.get("chop", 50.0)
    price_vs_sma = analysis.get("price_vs_sma_pct", 0.0)
    trend = analysis.get("trend", "neutral")
    momentum = analysis.get("momentum", "weak")

    if z > 1.5:
        z_label = "OVERBOUGHT"
    elif z < -1.5:
        z_label = "OVERSOLD"
    else:
        z_label = "NEUTRAL"

    slope_dir = "positive" if slope >= 0 else "negative"

    if chop < 38.2:
        chop_label = "TRENDING"
    elif chop > 61.8:
        chop_label = "CHOPPY"
    else:
        chop_label = "MODERATE"

    return (
        f"### {tf} Timeframe\n"
        f"Z-Score: {z:.3f} ({z_label})\n"
        f"Slope: {slope:.3f} ({slope_dir} momentum)\n"
        f"CHOP: {chop:.1f} ({chop_label})\n"
        f"Price vs 20SMA: {price_vs_sma:+.2f}%\n"
        f"Trend: {trend} | Momentum: {momentum}"
    )


def _build_user_message(context: dict) -> str:
    """Build the user prompt from the context dict."""
    symbol = context.get("symbol", "UNKNOWN")
    price = float(context.get("price", 0.0))
    timestamp = context.get("timestamp", datetime.utcnow().isoformat())
    risk_mode = context.get("risk_mode", "moderate")
    max_position_usd = context.get("max_position_usd", 100)
    timeframe_data: dict = context.get("timeframe_data", {})
    position = context.get("position")
    consecutive_losses = context.get("consecutive_losses", 0)

    # Build timeframe sections
    timeframe_sections = "\n\n".join(
        _build_timeframe_section(tf, analysis)
        for tf, analysis in timeframe_data.items()
    )

    # Build position text
    if position and position.get("size", 0) != 0:
        side = position.get("side", "unknown")
        size = float(position.get("size", 0))
        entry = float(position.get("entry_price", 0))
        upnl = float(position.get("unrealized_pnl", 0))
        position_text = (
            f"Side: {side.upper()}\n"
            f"Size: {size:.4f}\n"
            f"Entry Price: ${entry:.2f}\n"
            f"Unrealized PnL: ${upnl:.2f}"
        )
    else:
        position_text = "No open position (flat)"

    # Build recent trades text
    recent_trades_text = f"{consecutive_losses} consecutive losses detected" if consecutive_losses > 0 else "No recent losses"

    return (
        f"## Market Analysis: {symbol}\n"
        f"Current Price: ${price:.2f}\n"
        f"Timestamp: {timestamp}\n"
        f"Risk Mode: {risk_mode}\n\n"
        f"{timeframe_sections}\n\n"
        f"## Current Position\n"
        f"{position_text}\n\n"
        f"## Recent Performance\n"
        f"Consecutive losses: {consecutive_losses}\n"
        f"Recent trades: {recent_trades_text}\n\n"
        f"## Bot Settings\n"
        f"Max position size: ${max_position_usd}"
    )


def _extract_json(text: str) -> dict:
    """
    Extract a JSON object from an LLM response string.
    Tries direct parse first, then looks for a ```json ... ``` block,
    then falls back to regex extraction.
    """
    stripped = text.strip()

    # 1. Direct parse
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    # 2. Fenced code block  ```json ... ```
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", stripped, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1))
        except json.JSONDecodeError:
            pass

    # 3. Generic regex — allow nested one level deep
    obj_match = re.search(r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}", stripped, re.DOTALL)
    if obj_match:
        try:
            return json.loads(obj_match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract valid JSON from LLM response:\n{text[:500]}")


class LLMClient:
    def __init__(
        self,
        provider: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
    ) -> None:
        self.provider: str = provider or settings.llm_provider
        self.model: str = model or settings.default_model
        self.api_key: str | None = api_key

    async def chat(self, system: str, user: str) -> tuple[str, int | None]:
        """
        Send a system + user message to the configured LLM provider.
        Returns (response_text, prompt_tokens_or_None).
        """
        if self.provider == "ollama":
            response = ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
            text: str = response["message"]["content"]
            return text, None

        elif self.provider == "anthropic":
            effective_key = self.api_key or settings.anthropic_api_key
            if not effective_key:
                raise RuntimeError(
                    "anthropic_api_key is required when llm_provider='anthropic'. "
                    "Set ANTHROPIC_API_KEY in your environment."
                )
            client = Anthropic(api_key=effective_key)
            message = client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            content_block = message.content[0]
            anthropic_text: str = content_block.text  # type: ignore[attr-defined]
            tokens: int = message.usage.input_tokens
            return anthropic_text, tokens

        else:
            raise ValueError(
                f"Unknown LLM provider '{self.provider}'. "
                "Supported providers: 'ollama', 'anthropic'."
            )

    async def make_trading_decision(self, context: dict) -> TradingDecision:
        """
        Build the trading prompt from context, call the LLM, parse and return
        a TradingDecision.
        """
        # Allow per-bot system prompt override; fall back to built-in
        custom_system = context.get("system_prompt")
        system_prompt = custom_system if custom_system else SYSTEM_PROMPT

        user_message = _build_user_message(context)

        response_text, prompt_tokens = await self.chat(system_prompt, user_message)

        raw: dict = _extract_json(response_text)

        # Validate and coerce fields
        decision_str = str(raw.get("decision", "hold")).lower()
        if decision_str not in {"buy", "sell", "hold"}:
            decision_str = "hold"

        crv_raw = raw.get("crv_score", 5)
        try:
            crv_score = max(1, min(5, int(crv_raw)))
        except (TypeError, ValueError):
            crv_score = 5

        reasoning = str(raw.get("reasoning", "No reasoning provided."))

        def _optional_float(val: object) -> float | None:
            if val is None:
                return None
            try:
                return float(val)  # type: ignore[arg-type]
            except (TypeError, ValueError):
                return None

        return TradingDecision(
            decision=decision_str,
            crv_score=crv_score,
            reasoning=reasoning,
            entry_price=_optional_float(raw.get("entry_price")),
            stop_loss=_optional_float(raw.get("stop_loss")),
            take_profit=_optional_float(raw.get("take_profit")),
            prompt_tokens=prompt_tokens,
        )
