import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function NavbarComponent() {
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold ">
         ระบบเช่าพื้นที่ตลาด
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">หน้าหลัก</Nav.Link>
            <Nav.Link as={Link} to="/fromregister">เช่าพื้นที่</Nav.Link>
            <Nav.Link as={Link} to="/about">เกี่ยวกับเรา</Nav.Link>

            <NavDropdown title="เพิ่มเติม" id="basic-nav-dropdown">
              <NavDropdown.Item as={Link} to="/contact">
                ติดต่อเรา
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/faq">
                คำถามที่พบบ่อย
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>

          <Nav>
            <Nav.Link
              as={Link}
              to="/login"
              className="btn btn-outline-primary rounded-pill px-3"
            >
              เข้าสู่ระบบ
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
