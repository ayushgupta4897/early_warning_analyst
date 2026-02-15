"""Quick Firebase connectivity test. Run from project root:
   python test_firebase.py
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv("backend/.env")

sa_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
print(f"1. GOOGLE_APPLICATION_CREDENTIALS = {sa_path}")

if not sa_path:
    print("   MISSING! Add GOOGLE_APPLICATION_CREDENTIALS=backend/firebase-sa.json to backend/.env")
    sys.exit(1)

if not os.path.exists(sa_path):
    print(f"   File not found at: {sa_path}")
    print("   Download your service account key from Firebase Console:")
    print("   Project Settings → Service accounts → Generate new private key")
    print(f"   Save it as: {sa_path}")
    sys.exit(1)

print("   Found service account file")

import json
with open(sa_path) as f:
    sa = json.load(f)
print(f"2. Project ID: {sa.get('project_id')}")
print(f"   Client email: {sa.get('client_email')}")

try:
    import firebase_admin
    from firebase_admin import credentials, firestore

    cred = credentials.Certificate(sa_path)
    app = firebase_admin.initialize_app(cred, {"projectId": sa.get("project_id")})
    print("3. Firebase Admin initialized OK")

    db = firestore.client()
    print("4. Firestore client created OK")

    # Test write
    test_ref = db.collection("_test").document("connectivity")
    test_ref.set({"status": "ok", "timestamp": firestore.SERVER_TIMESTAMP})
    print("5. Test write OK")

    # Test read
    doc = test_ref.get()
    print(f"6. Test read OK: {doc.to_dict()}")

    # Cleanup
    test_ref.delete()
    print("7. Test cleanup OK")

    print("\nFirebase is working! You can now run the backend.")

except Exception as e:
    print(f"\nERROR: {type(e).__name__}: {e}")
    sys.exit(1)
