from pydantic import BaseModel
from typing import Optional, Union, List, Dict, Any


class SSEEvent(BaseModel):
    type: str  # agent_start, agent_chunk, agent_complete, analysis_complete, error
    agent: Optional[str] = None
    content: Optional[str] = None
    data: Optional[Union[Dict[str, Any], List[Any]]] = None
    status: Optional[str] = None
    message: Optional[str] = None

    def to_sse(self) -> str:
        import json
        return json.dumps(self.model_dump(exclude_none=True))
