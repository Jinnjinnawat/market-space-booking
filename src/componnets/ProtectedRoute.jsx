// src/components/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { Spinner } from "react-bootstrap";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ระหว่างโหลดสถานะจาก Firebase (ตอนเปิดหน้าใหม่)
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center vh-100"
        style={{ background: "#f9f9f9" }}
      >
        <Spinner animation="border" role="status" />
        <span className="ms-2 text-muted">กำลังตรวจสอบสิทธิ์...</span>
      </div>
    );
  }

  // ถ้าไม่ได้ล็อกอิน -> เด้งไปหน้า Login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ถ้าล็อกอินแล้ว -> แสดงเนื้อหาภายใน Route
  return <Outlet />;
}
