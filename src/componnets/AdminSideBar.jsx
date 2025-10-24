// src/components/AdminSidebar.jsx
import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import LogoutButton from "./LogoutButton";

export default function AdminSidebar() {
  const { user } = useAuth();

  const linkClass = ({ isActive }) =>
    `rounded px-3 py-2 d-flex align-items-center gap-2 my-1 ${
      isActive ? "bg-primary text-white" : "text-dark"
    }`;

  return (
    <div
      className="d-flex flex-column bg-light border-end position-fixed top-0 start-0"
      style={{ height: "100vh", width: "240px", zIndex: 1000 }}
    >
      {/* Header */}
      <div
        className="d-flex align-items-center gap-2 border-bottom"
        style={{ padding: "12px 16px", minHeight: "70px" }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/th/thumb/5/51/Logo_ku_th.svg/1200px-Logo_ku_th.svg.png"
          alt="KU Logo"
          style={{ width: 45, height: 45, objectFit: "contain", borderRadius: "50%" }}
        />
        <span className="fw-bold fs-6 text-nowrap">ระบบเช่าพื้นที่ตลาด</span>
      </div>

      {/* เมนูแอดมิน */}
      <Nav className="flex-column mt-3 px-2">
        <div className="small text-secondary px-3 mb-2">แอดมิน</div>

        <Nav.Link as={NavLink} to="/announcements" className={linkClass} end>
          
          <span>จัดการข่าวสาร</span>
        </Nav.Link>

        <Nav.Link as={NavLink} to="/admin/rentals" className={linkClass}>
          <span>🧾</span>
          <span>จัดการการเช่า</span>
        </Nav.Link>

        <Nav.Link as={NavLink} to="/admin/users" className={linkClass}>
          <span>👤</span>
          <span>ผู้ใช้งาน</span>
        </Nav.Link>
      </Nav>

      {/* ส่วนล่าง: แสดงอีเมล และปุ่มออกจากระบบ/เข้าสู่ระบบ */}
      <div className="mt-auto border-top p-3">
        {user ? (
          <>
            <div className="small text-muted mb-2 text-truncate" title={user.email || user.displayName}>
              {user.displayName || user.email}
            </div>
            <LogoutButton className="w-100 rounded-pill" />
          </>
        ) : (
          <Nav.Link
            as={NavLink}
            to="/login"
            className="btn btn-outline-warning w-100 rounded-pill d-flex align-items-center justify-content-center gap-2"
          >
            <span>🔒</span>
            <span>เข้าสู่ระบบ</span>
          </Nav.Link>
        )}
      </div>
    </div>
  );
}
