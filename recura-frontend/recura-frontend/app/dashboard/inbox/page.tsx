"use client";
import { useState, useEffect } from "react";
import { CheckCircle, Clock, UserSearch } from "lucide-react";

export default function DoctorInboxPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  
  useEffect(() => {
    fetch("http://127.0.0.1:8000/doctor/pending-reviews?doctor_id=1")
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(err => console.error(err));
  }, []);

  const respond = async (reviewId: number, action: str, note: str) => {
    await fetch("http://127.0.0.1:8000/doctor/respond-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: reviewId, doctor_id: 1, action, doctor_note: note })
    });
    setReviews(reviews.filter(r => r.id !== reviewId));
    alert("Instructions sent to patient!");
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h1 className="text-3xl font-bold mb-6">Patient Self-Check Inbox</h1>
      {reviews.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg border">No pending reviews.</div>
      ) : (
        reviews.map(review => (
          <div key={review.id} className="bg-white p-6 rounded-lg border mb-4 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{review.patient_name} ({review.patient_id})</h3>
                <p className="text-sm text-gray-500">Submitted: {new Date(review.created_at).toLocaleString()}</p>
              </div>
              <span className={px-3 py-1 rounded-full text-xs font-bold }>
                {review.self_check_json.status.toUpperCase()}
              </span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mb-4 text-sm">
              <p><strong>Tg Level:</strong> {review.self_check_json.reasons[0]}</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => respond(review.id, "ALL_CLEAR", "Everything looks great, see you in 6 months.")} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-bold flex items-center gap-2 hover:bg-green-700">
                <CheckCircle size={16} /> Mark All Clear
              </button>
              <button onClick={() => respond(review.id, "SCHEDULE_VISIT", "Please call the clinic to schedule an ultrasound.")} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                <Clock size={16} /> Request Clinic Visit
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
