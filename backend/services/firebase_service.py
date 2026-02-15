import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone
import os

# Lazy Firebase initialization
_db = None


def _get_db():
    global _db
    if _db is not None:
        return _db

    if not firebase_admin._apps:
        try:
            # Try service account file first
            sa_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if sa_path:
                cred = credentials.Certificate(sa_path)
                firebase_admin.initialize_app(cred, {"projectId": "early-warning-analyst"})
            else:
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred, {"projectId": "early-warning-analyst"})
        except Exception:
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
