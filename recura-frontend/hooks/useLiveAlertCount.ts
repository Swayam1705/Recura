import { useState, useEffect } from "react";

export function useLiveAlertCount(doctorId: string = "1") {
  const [unreadCount, setUnreadCount] = useState(1);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${apiUrl}/alerts/counts?doctor_id=${doctorId}`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread || 0);
        }
      } catch {
        // Fallback live count for offline/demo
        setUnreadCount((prev) => (prev > 0 ? prev : 1));
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 4000); // Check every 4s
    return () => clearInterval(interval);
  }, [doctorId]);

  return unreadCount;
}