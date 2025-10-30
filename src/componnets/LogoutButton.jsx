// src/components/LogoutButton.jsx
import { useState } from "react";
import { Button } from "react-bootstrap";
import { signOut } from "firebase/auth";
import { auth } from "../service/Firebase";
import { useNavigate } from "react-router-dom";

export default function LogoutButton({ className = "", size = "md" }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      setLoading(true);
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (e) {
      console.error("Sign out error:", e);
      // ถ้าต้องการแจ้งเตือน ใช้ Toast/Alert ตรงนี้ได้
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline-danger"
      className={className}
      size={size}
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
    </Button>
  );
}
