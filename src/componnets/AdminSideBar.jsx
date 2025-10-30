// src/components/AdminSidebar.jsx
import { useEffect, useState } from "react";
import { Nav, NavDropdown } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(() => {
    try {
      const raw = sessionStorage.getItem("adminUser");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "adminUser") {
        try {
          setAdmin(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setAdmin(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const linkClass = ({ isActive }) =>
    `rounded px-3 py-2 d-flex align-items-center gap-2 my-1 ${
      isActive ? "bg-primary text-white" : "text-dark"
    }`;

  const handleLogout = () => {
    sessionStorage.removeItem("adminUser");
    navigate("/login", { replace: true });
  };

  return (
    <div
      className="d-flex flex-column bg-light border-end position-fixed top-0 start-0"
      style={{ height: "100vh", width: "240px", zIndex: 1000 }}
    >
      {/* Header */}
      <div
        className="d-flex flex-column align-items-start border-bottom"
        style={{ padding: "12px 16px", minHeight: "80px" }}
      >
        <div className="d-flex align-items-center gap-2 mb-1">
          <img
            src="https://upload.wikimedia.org/wikipedia/th/thumb/5/51/Logo_ku_th.svg/1200px-Logo_ku_th.svg.png"
            alt="KU Logo"
            style={{ width: 45, height: 45, objectFit: "contain", borderRadius: "50%" }}
          />
          <span className="fw-bold fs-6 text-nowrap">ระบบเช่าพื้นที่ตลาด</span>
        </div>
      </div>

      {/* เมนูหลัก */}
      <Nav className="flex-column mt-3 px-2">
        <Nav.Link as={NavLink} to="/announcements" className={linkClass} end>
          จัดการข่าวสาร
        </Nav.Link>

        <Nav.Link as={NavLink} to="/lots" className={linkClass}>
          จัดการพื้นที่
        </Nav.Link>

        <Nav.Link as={NavLink} to="/requeststable" className={linkClass}>
          จัดการการเช่า
        </Nav.Link>

        {/* ✅ ใช้ NavDropdown ของ React-Bootstrap */}
        <NavDropdown
          title="จัดการค่าสาธารณูปโภค"
          id="utilities-dropdown"
          className="my-1 px-2"
          menuVariant="light"
        >
          <NavDropdown.Item as={NavLink} to="/utilities">
            รายการ/บันทึกมิเตอร์
          </NavDropdown.Item>
          <NavDropdown.Item as={NavLink} to="/UtilitiesPaymentsAdmin">
            ข้อมูลการชำระเงินค่าสารณูปโภค
          </NavDropdown.Item>
        </NavDropdown>

        <Nav.Link as={NavLink} to="/AdminUsersPage" className={linkClass}>
          จัดการผู้ใช้งาน
        </Nav.Link>
      </Nav>

      {/* ส่วนล่าง */}
      <div className="mt-auto border-top p-3">
        {admin && (
          <div className="mb-2 p-2 rounded bg-white border small">
            <div className="fw-semibold text-truncate" title={admin.email}>
              {admin.email}
            </div>
            <div className="text-muted">
              บทบาท: {admin.role || "-"} •{" "}
              {admin.provider === "google" ? "Google" : "อีเมล/รหัสผ่าน"}
            </div>
          </div>
        )}

        {admin ? (
          <button
            className="btn btn-outline-danger w-100 rounded-pill"
            onClick={handleLogout}
            type="button"
          >
            ออกจากระบบ
          </button>
        ) : (
          <Nav.Link
            as={NavLink}
            to="/login"
            className="btn btn-outline-warning w-100 rounded-pill text-center"
          >
            🔒 เข้าสู่ระบบ
          </Nav.Link>
        )}
      </div>
    </div>
  );
}
