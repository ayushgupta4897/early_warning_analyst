import os
import json
import logging
import anthropic
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ewa.claude")

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MODEL = "claude-opus-4-6"
MAX_TOKENS = 16000


async def stream_agent_response(system_prompt: str, user_prompt: str, use_web_search: bool = False):
    """Stream a Claude response, yielding text chunks and the final full text."""
    tools = []
    if use_web_search:
        tools.append({"type": "web_search_20250305", "name": "web_search", "max_uses": 5})

    kwargs = dict(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    if tools:
        kwargs["tools"] = tools

    logger.info(f"[Claude API] Calling model={MODEL}, max_tokens={MAX_TOKENS}, web_search={use_web_search}")
    logger.debug(f"[Claude API] System prompt length: {len(system_prompt)} chars")
    logger.debug(f"[Claude API] User prompt length: {len(user_prompt)} chars")

    full_text = ""
    chunk_count = 0
    try:
        with client.messages.stream(**kwargs) as stream:
            for event in stream:
                if event.type == "content_block_delta":
                    if hasattr(event.delta, "text") and event.delta.text is not None:
                        full_text += event.delta.text
                        chunk_count += 1
                        yield {"type": "chunk", "content": event.delta.text}

        logger.info(f"[Claude API] Response complete: {chunk_count} chunks, {len(full_text)} chars total")
    except Exception as e:
        logger.error(f"[Claude API] Error during streaming: {type(e).__name__}: {e}")
        raise

    yield {"type": "complete", "content": full_text}


def extract_json_from_response(text: str):
    """Extract JSON from a Claude response that may contain markdown code blocks."""
    import re

    if not text:
        logger.warning("[JSON Extract] Empty text provided")
        return None

    # Try to find JSON in code blocks first
    json_match = re.search(r"```(?:json)?\s*\n([\s\S]*?)\n```", text)
    if json_match:
        try:
            result = json.loads(json_match.group(1))
            logger.info(f"[JSON Extract] Extracted JSON from code block ({len(json_match.group(1))} chars)")
            return result
        except json.JSONDecodeError as e:
            logger.warning(f"[JSON Extract] Code block JSON parse failed: {e}")

    # Try parsing the whole text as JSON
    try:
        result = json.loads(text)
        logger.info(f"[JSON Extract] Parsed entire text as JSON ({len(text)} chars)")
        return result
    except json.JSONDecodeError:
        pass

    # Try to find any JSON array or object
    for start_char, end_char in [("[", "]"), ("{", "}")]:
        start = text.find(start_char)
        if start == -1:
            continue
        depth = 0
        for i in range(start, len(text)):
            if text[i] == start_char:
                depth += 1
            elif text[i] == end_char:
                depth -= 1
                if depth == 0:
                    try:
                        result = json.loads(text[start : i + 1])
                        logger.info(f"[JSON Extract] Found embedded JSON ({i - start + 1} chars, starts at pos {start})")
                        return result
                    except json.JSONDecodeError:
                        break

    logger.error(f"[JSON Extract] Failed to extract JSON from response ({len(text)} chars). First 200 chars: {text[:200]}")
    return None
