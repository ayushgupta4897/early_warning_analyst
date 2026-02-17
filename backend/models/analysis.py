from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class AnalysisScope(str, Enum):
    NATIONAL = "national"
    DEPARTMENT = "department"


class AnalysisConfig(BaseModel):
    country: str
    country_code: str = ""
    scope: AnalysisScope = AnalysisScope.NATIONAL
    department_name: Optional[str] = None
    horizon: int = Field(default=5, ge=1, le=10)
    signal_count: int = Field(default=20, ge=10, le=40)
    domains: list[str] = Field(default_factory=lambda: [
        "economy", "infrastructure", "health", "climate",
        "food_water", "social_cohesion", "security", "energy"
    ])
    custom_indicators: list[str] = Field(default_factory=list)


class RiskBand(str, Enum):
    GREEN = "green"
    AMBER = "amber"
    RED_WATCH = "red_watch"
    RED_ACTION = "red_action"


class SignalScores(BaseModel):
    impact: float = 0
    lead_time: float = 0
    reliability: float = 0
    near_term: float = 0
    structural: float = 0
    overall: float = 0
    risk_band: RiskBand = RiskBand.GREEN


class AnalysisRequest(BaseModel):
    config: AnalysisConfig
    password: str = ""


class WhatIfRequest(BaseModel):
    scenario: str
