import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone
import json
import logging
import os

logger = logging.getLogger("ewa.firebase")

# Lazy Firebase initialization
_db = None


def _get_db():
    global _db
    if _db is not None:
        return _db

    if not firebase_admin._apps:
        try:
            # Option 1: JSON string in env var (for Railway/cloud deploys)
            sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            if sa_json:
                logger.info("Found FIREBASE_SERVICE_ACCOUNT_JSON env var (%d chars)", len(sa_json))
                sa_dict = json.loads(sa_json)
                cred = credentials.Certificate(sa_dict)
                firebase_admin.initialize_app(cred, {"projectId": sa_dict.get("project_id", "early-warning-analyst")})
                logger.info("Firebase initialized with service account JSON")
            else:
                # Option 2: File path (for local dev)
                sa_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
                if sa_path:
                    cred = credentials.Certificate(sa_path)
                    firebase_admin.initialize_app(cred, {"projectId": "early-warning-analyst"})
                    logger.info("Firebase initialized with credentials file")
                else:
                    logger.warning("No Firebase credentials found, falling back to Application Default")
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred, {"projectId": "early-warning-analyst"})
        except Exception as e:
            logger.error("Firebase init failed: %s", e)
            firebase_admin.initialize_app(options={"projectId": "early-warning-analyst"})

    _db = firestore.client()
    return _db


def save_analysis(analysis_id: str, config: dict, status: str = "running"):
    db = _get_db()
    doc_ref = db.collection("analyses").document(analysis_id)
    doc_ref.set(
        {
            "config": config,
            "status": status,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        },
        merge=True,
    )
    return analysis_id


def update_analysis_status(analysis_id: str, status: str):
    db = _get_db()
    doc_ref = db.collection("analyses").document(analysis_id)
    doc_ref.update({"status": status, "updated_at": datetime.now(timezone.utc)})


def save_agent_output(analysis_id: str, agent_name: str, output: dict):
    db = _get_db()
    doc_ref = db.collection("analyses").document(analysis_id)
    doc_ref.update(
        {
            f"agents.{agent_name}": output,
            "updated_at": datetime.now(timezone.utc),
        }
    )


def save_final_analysis(analysis_id: str, final_data: dict):
    db = _get_db()
    doc_ref = db.collection("analyses").document(analysis_id)
    doc_ref.update(
        {
            "status": "completed",
            "final_data": final_data,
            "updated_at": datetime.now(timezone.utc),
        }
    )


def get_analysis(analysis_id: str):
    db = _get_db()
    doc_ref = db.collection("analyses").document(analysis_id)
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict()
    return None


def list_analyses():
    """List all analyses from Firestore (most recent first)."""
    db = _get_db()
    docs = db.collection("analyses").order_by("created_at", direction=firestore.Query.DESCENDING).limit(50).stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(data)
    return results


def save_what_if(analysis_id: str, scenario_id: str, result: dict):
    db = _get_db()
    doc_ref = (
        db.collection("analyses")
        .document(analysis_id)
        .collection("what_if_scenarios")
        .document(scenario_id)
    )
    doc_ref.set(
        {
            "result": result,
            "created_at": datetime.now(timezone.utc),
        }
    )
