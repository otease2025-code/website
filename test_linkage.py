import requests

BASE_URL = "http://16.171.58.155api"

def test_linkage_flow():
    # 1. Register Therapist
    therapist_email = "test_therapist_link@example.com"
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": therapist_email, "password": "password123", "role": "THERAPIST", "name": "Dr. Tester"
        })
        if resp.status_code == 201:
            therapist_id = resp.json()["userId"]
            print(f"Created Therapist: {therapist_id}")
        else:
            # Login if exists
            resp = requests.post(f"{BASE_URL}/auth/login", json={"email": therapist_email, "password": "password123"})
            therapist_id = resp.json()["user"]["id"]
            print(f"Logged in Therapist: {therapist_id}")
            
        # 2. Generate Linkage Code for Patient
        resp = requests.post(f"{BASE_URL}/therapist/linkage-code?therapist_id={therapist_id}")
        linkage_code = resp.json()["code"]
        print(f"Therapist Linkage Code: {linkage_code}")
        
        # 3. Register Patient with Linkage Code
        patient_email = "test_patient_link@example.com"
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": patient_email, "password": "password123", "role": "PATIENT", "name": "Patient Tester",
            "linkage_code": linkage_code
        })
        if resp.status_code == 201:
            patient_id = resp.json()["userId"]
            print(f"Created Patient: {patient_id}")
        else:
             resp = requests.post(f"{BASE_URL}/auth/login", json={"email": patient_email, "password": "password123"})
             patient_id = resp.json()["user"]["id"]
             print(f"Logged in Patient: {patient_id}")
        
        # 4. Get Caregiver Code for Patient
        resp = requests.get(f"{BASE_URL}/patient/caregiver-code?user_id={patient_id}")
        if resp.status_code != 200:
            print(f"Failed to get caregiver code: {resp.text}")
            return
        caregiver_code = resp.json()["code"]
        print(f"Patient's Caregiver Code: {caregiver_code}")
        
        # 5. Register Caregiver (No code needed now)
        caregiver_email = "test_caregiver_link@example.com"
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": caregiver_email, "password": "password123", "role": "CAREGIVER", "name": "Caregiver Tester"
        })
        if resp.status_code == 201:
            caregiver_id = resp.json()["userId"]
            print(f"Created Caregiver: {caregiver_id}")
        else:
             resp = requests.post(f"{BASE_URL}/auth/login", json={"email": caregiver_email, "password": "password123"})
             caregiver_id = resp.json()["user"]["id"]
             print(f"Logged in Caregiver: {caregiver_id}")
             
        # 6. Link Caregiver using code
        print(f"Attempting to link Caregiver {caregiver_id} with code {caregiver_code}...")
        resp = requests.post(f"{BASE_URL}/caregiver/link-patient", json={
            "caregiver_id": caregiver_id,
            "code": caregiver_code
        })
        
        print(f"Link Response: {resp.status_code} - {resp.text}")
        
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_linkage_flow()
