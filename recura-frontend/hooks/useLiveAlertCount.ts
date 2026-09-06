import { useState, useEffect } from "react";

export function useLiveAlertCount(doctorId: string = "1") {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/alerts/counts?doctor_id=${doctorId}`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread || 0);
        }
      } catch (err) {
        console.error("Failed to fetch live counts:", err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 4000); // Check every 4s
    return () => clearInterval(interval);
  }, [doctorId]);

  return unreadCount;
}