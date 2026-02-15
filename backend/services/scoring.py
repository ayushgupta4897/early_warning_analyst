from backend.models.analysis import SignalScores, RiskBand


def compute_scores(impact: float, lead_time: float, reliability: float) -> SignalScores:
    near_term = 0.35 * impact + 0.45 * lead_time + 0.20 * reliability
    structural = 0.55 * impact + 0.20 * lead_time + 0.25 * reliability
    overall = 0.25 * near_term + 0.50 * impact + 0.25 * structural

    if overall >= 75:
        risk_band = RiskBand.RED_ACTION
    elif overall >= 60:
        risk_band = RiskBand.RED_WATCH
    elif overall >= 40:
        risk_band = RiskBand.AMBER
    else:
        risk_band = RiskBand.GREEN

    return SignalScores(
        impact=round(impact, 1),
        lead_time=round(lead_time, 1),
        reliability=round(reliability, 1),
        near_term=round(near_term, 1),
        structural=round(structural, 1),
        overall=round(overall, 1),
        risk_band=risk_band,
    )
