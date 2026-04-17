from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

# ========== DASHBOARD STATS ==========

class DashboardStats(BaseModel):
    total_predictions: int
    month_predictions: int
    average_processing_time: float
    success_rate: float
    recent_predictions: List[Dict]
    top_pathologies: List[Dict]


# ========== PERFORMANCE METRICS ==========

class PerformanceMetrics(BaseModel):
    total_analyses: int
    completed: int
    failed: int
    success_rate: float
    average_processing_time: float
    period: Dict[str, Optional[str]]


# ========== PATHOLOGY DISTRIBUTION ==========

class PathologyDistribution(BaseModel):
    name: str
    count: int
    percentage: float


class PathologyDistributionResponse(BaseModel):
    period: str
    total_detections: int
    total_analyses: int
    distribution: List[PathologyDistribution]


# ========== TIME SERIES ==========

class TimeSeriesData(BaseModel):
    date: str
    count: int
    completed: int
    failed: int


class TimeSeriesResponse(BaseModel):
    interval: str
    data: List[TimeSeriesData]


# ========== COMPARISON ==========

class PeriodStats(BaseModel):
    total: int
    completed: int
    success_rate: float
    avg_processing_time: float


class PeriodComparison(BaseModel):
    start: str
    end: str
    stats: PeriodStats


class ComparisonResponse(BaseModel):
    period1: PeriodComparison
    period2: PeriodComparison