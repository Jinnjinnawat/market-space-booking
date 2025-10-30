import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-light text-dark border-top shadow-sm mt-5 pt-5">
      <Container>
        <Row className="g-4">
          {/* แบรนด์/คำอธิบาย */}
          <Col md={4}>
            <h5 className="fw-bold">ตลาดนัดเช่าง่าย</h5>
            <p className="mb-2 text-muted">
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
              <li><Link to="/" className="footer-link">หน้าแรก</Link></li>
              <li><Link to="/home" className="footer-link">เช่าพื้นที่</Link></li>
              <li><Link to="/rentalCheck" className="footer-link">ตรวจสอบการเช่าพื้นที่</Link></li>
              <li><Link to="/utilitiesuser" className="footer-link">ชำระค่าสาธารณูปโภค</Link></li>
              <li><Link to="/ExpenseSummaryPage" className="footer-link">ประวัติค่าใช้จ่ายทั้งหมด</Link></li>
              <li><Link to="/AdminDashboard" className="footer-link">แดชบอร์ดผู้ดูแล</Link></li>
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

            <div className="d-flex gap-2">
              <Link to="/contact" className="btn btn-outline-primary btn-sm">
                ติดต่อทีมงาน
              </Link>
              <Link to="/report-issue" className="btn btn-outline-secondary btn-sm">
                แจ้งปัญหา
              </Link>
            </div>
          </Col>
        </Row>

        <hr className="border-secondary opacity-25 my-4" />

        {/* แถบล่าง */}
        <Row className="align-items-center pb-3">
          <Col md={6} className="small text-secondary">
            © {year} ตลาดนัดเช่าง่าย · สงวนลิขสิทธิ์
          </Col>
          <Col md={6} className="small d-flex gap-3 justify-content-md-end">
            <Link to="/terms" className="footer-link">ข้อตกลงการใช้งาน</Link>
            <Link to="/privacy" className="footer-link">นโยบายความเป็นส่วนตัว</Link>
          </Col>
        </Row>
      </Container>

      <style>{`
        .footer-link {
          color: #0d6efd;
          text-decoration: none;
          transition: 0.2s;
        }
        .footer-link:hover {
          color: #084298;
          text-decoration: underline;
        }
      `}</style>
    </footer>
  );
}
