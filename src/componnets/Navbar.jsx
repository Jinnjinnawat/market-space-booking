import { Container, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import LogoutButton from "./LogoutButton";
import { isAdmin } from "../utils/roles";

export default function NavbarComponent() {
  const { user } = useAuth();
  const admin = isAdmin(user);

  return (
    <Navbar bg="light" expand="lg" className="shadow-sm" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center gap-2">
          <img
            src="https://upload.wikimedia.org/wikipedia/th/thumb/5/51/Logo_ku_th.svg/1200px-Logo_ku_th.svg.png"
            alt="KU Logo"
            style={{ width: "40px", height: "40px", objectFit: "contain" }}
          />
          ระบบเช่าพื้นที่ตลาดหอใน
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">หน้าหลัก</Nav.Link>
            <Nav.Link as={Link} to="/home">เช่าพื้นที่</Nav.Link>
            <Nav.Link as={Link} to="/rentalCheck">ตรวจสอบการเช่าพื้นที่</Nav.Link>
            <Nav.Link as={Link} to="/utilitiesuser">ชำระค่าค่าสาธารณูปโภค</Nav.Link>
            <Nav.Link as={Link} to="/ExpenseSummaryPage">ประวัติค่าใช้จ่ายทั้งหมด</Nav.Link>

          </Nav>

          {/* ขวาสุด */}
          <Nav className="align-items-center gap-2">
            {user ? (
              <>
                <span className="me-2 text-dark fw-semibold">
                  {user.displayName || user.email}
                </span>
                <LogoutButton className="btn btn-outline-danger rounded-pill px-3 py-1" size="sm" />
              </>
            ) : (
              <Nav.Link as={Link} to="/login" className="btn btn-outline-primary rounded-pill px-3">
                เข้าสู่ระบบ
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
