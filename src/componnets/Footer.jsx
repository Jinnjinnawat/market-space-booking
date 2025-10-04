import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light pt-5 mt-5">
      <Container>
        <Row className="g-4">
          {/* แบรนด์/คำอธิบาย */}
          <Col md={4}>
            <h5 className="fw-bold">ตลาดนัดเช่าง่าย</h5>
            <p className="mb-2">
              ระบบบริหาร “เช่าพื้นที่ตลาดนัด” สำหรับผู้จัดตลาดและพ่อค้าแม่ค้า
              จองล็อก โอนเงิน ยืนยัน และดูรายงานได้ในที่เดียว
            </p>
            <div className="small text-secondary">
              จ-ศ 09:00–18:00 (หยุดนักขัตฤกษ์)
            </div>
          </Col>

          {/* ลิงก์ด่วน */}
          <Col md={4}>
            <h6 className="text-uppercase text-secondary">ลิงก์ด่วน</h6>
            <ul className="list-unstyled mb-0">
              <li><Link to="/" className="link-light text-decoration-none">หน้าแรก</Link></li>
              <li><Link to="/markets" className="link-light text-decoration-none">ค้นหาพื้นที่ตลาด</Link></li>
              <li><Link to="/pricing" className="link-light text-decoration-none">ราคาและแพ็กเกจ</Link></li>
              <li><Link to="/bookings" className="link-light text-decoration-none">การจองของฉัน</Link></li>
              <li><Link to="/dashboard" className="link-light text-decoration-none">แดชบอร์ดผู้ดูแล</Link></li>
              <li><Link to="/faq" className="link-light text-decoration-none">คำถามที่พบบ่อย</Link></li>
            </ul>
          </Col>

          {/* ติดต่อเรา */}
          <Col md={4}>
            <h6 className="text-uppercase text-secondary">ติดต่อเรา</h6>
            <ul className="list-unstyled mb-2">
              <li>โทร: 02-123-4567</li>
              <li>อีเมล: support@taladrent.example</li>
              <li>ที่อยู่: 88 ถนนตัวอย่าง กรุงเทพฯ</li>
            </ul>
            {/* ปุ่มเล็กๆ */}
            <div className="d-flex gap-2">
              <Link to="/contact" className="btn btn-outline-light btn-sm">ติดต่อทีมงาน</Link>
              <Link to="/report-issue" className="btn btn-outline-light btn-sm">แจ้งปัญหา</Link>
            </div>
          </Col>
        </Row>

        <hr className="border-secondary my-4" />

        {/* แถบล่าง */}
        <Row className="align-items-center pb-3">
          <Col md={6} className="small">
            © {year} ตลาดนัดเช่าง่าย · สงวนลิขสิทธิ์
          </Col>
          <Col md={6} className="small d-flex gap-3 justify-content-md-end">
            <Link to="/terms" className="link-secondary text-decoration-none">ข้อตกลงการใช้งาน</Link>
            <Link to="/privacy" className="link-secondary text-decoration-none">นโยบายความเป็นส่วนตัว</Link>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}
