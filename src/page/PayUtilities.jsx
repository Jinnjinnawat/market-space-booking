// src/page/PayUtilities.jsx
import { useLocation, Link } from "react-router-dom";
import { Card, Container, Button } from "react-bootstrap";
import NavbarComponent from "../componnets/Navbar";
import Footer from "../componnets/Footer";

export default function PayUtilities() {
  const { state } = useLocation() || {};
  const { paymentId, utilityId, amount, method, slipUrl } = state || {};

  return (
    <>
      <NavbarComponent />
      <Container className="py-4">
        <Card className="shadow-sm">
          <Card.Header><h5 className="mb-0">บันทึกการชำระสำเร็จ</h5></Card.Header>
          <Card.Body>
            {paymentId ? (
              <>
                <p className="mb-1">รหัสการชำระเงิน: <strong>{paymentId}</strong></p>
                <p className="mb-1">Utility ID: <strong>{utilityId}</strong></p>
                <p className="mb-1">วิธีชำระ: <strong>{method || "-"}</strong></p>
                <p className="mb-3">จำนวนเงิน: <strong>{amount?.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</strong> บาท</p>
                {slipUrl ? (
                  <p className="mb-3">
                    สลิป: <a href={slipUrl} target="_blank" rel="noreferrer">เปิดดู</a>
                  </p>
                ) : null}
                <Button as={Link} to="/utilities" variant="primary">
                  กลับไปหน้าค่าสาธารณูปโภคของฉัน
                </Button>
              </>
            ) : (
              <>
                <p>ไม่พบข้อมูลการชำระล่าสุด</p>
                <Button as={Link} to="/utilities" variant="secondary">
                  กลับไปหน้ารายการ
                </Button>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
      <Footer />
    </>
  );
}
