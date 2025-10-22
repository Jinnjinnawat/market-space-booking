// src/components/AdminSidebar.jsx
import { useState } from "react";
import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`d-flex flex-column border-end bg-light ${
        collapsed ? "sidebar-collapsed" : "sidebar"
      }`}
      style={{ minHeight: "100vh" }}
    >
      {/* Header + Toggle */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
        <span className="fw-bold">ระบบเช่าพื้นที่ตลาด</span>
        <button
          className="btn btn-sm btn-outline-secondary d-lg-none"
          onClick={() => setCollapsed((s) => !s)}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
      </div>

      {/* เมนูหลัก */}
      <div className={`px-2 py-3 ${collapsed ? "d-none d-lg-block" : ""}`}>
        <Nav className="flex-column gap-1">
          <Nav.Link as={NavLink} end to="/" className="rounded px-3 py-2">
            หน้าหลัก
          </Nav.Link>
          <Nav.Link as={NavLink} to="/fromregister" className="rounded px-3 py-2">
            เช่าพื้นที่
          </Nav.Link>
          <Nav.Link as={NavLink} to="/about" className="rounded px-3 py-2">
            เกี่ยวกับเรา
          </Nav.Link>

        {/* กลุ่มเมนูเพิ่มเติม */}
          <div className="mt-3 small text-secondary px-3">เพิ่มเติม</div>
          <Nav.Link as={NavLink} to="/contact" className="rounded px-3 py-2">
            ติดต่อเรา
          </Nav.Link>
          <Nav.Link as={NavLink} to="/faq" className="rounded px-3 py-2">
            คำถามที่พบบ่อย
          </Nav.Link>

        {/* แบ็กเอนด์/หลังบ้าน (ตัวอย่าง) */}
          <div className="mt-4 small text-secondary px-3">แอดมิน</div>
          <Nav.Link as={NavLink} to="/admin/dashboard" className="rounded px-3 py-2">
            แผงควบคุม
          </Nav.Link>
          <Nav.Link as={NavLink} to="/admin/rentals" className="rounded px-3 py-2">
            จัดการการเช่า
          </Nav.Link>
          <Nav.Link as={NavLink} to="/admin/users" className="rounded px-3 py-2">
            ผู้ใช้งาน
          </Nav.Link>
        </Nav>
      </div>

      {/* ปุ่มเข้าสู่ระบบ/ออกระบบ (ตัวอย่าง) */}
      <div className={`mt-auto p-3 border-top ${collapsed ? "d-none d-lg-block" : ""}`}>
        <Nav className="flex-column">
          <Nav.Link as={NavLink} to="/login" className="btn btn-outline-primary rounded-pill">
            เข้าสู่ระบบ
          </Nav.Link>
        </Nav>
      </div>
    </div>
  );
}
