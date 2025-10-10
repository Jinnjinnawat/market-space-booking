import { useState } from "react";
import { Container, Row, Col, Card, Button, Modal } from "react-bootstrap";
import NavbarComponent from "../componnets/Navbar"; // ✅ แก้สะกดเป็น components ไม่ใช่ componnets
import FromRegister from "../componnets/Formregister";   // ปรับ path ให้ตรงโปรเจกต์ของคุณ

export default function Home() {
  const [show, setShow] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);

  // ตัวอย่างข้อมูลล็อตตลาด
  const lots = [
    { id: 1, name: "ล็อตที่ 1", status: "ว่าง" },
    { id: 2, name: "ล็อตที่ 2", status: "ถูกเช่าแล้ว" },
    { id: 3, name: "ล็อตที่ 3", status: "ว่าง" },
    { id: 4, name: "ล็อตที่ 4", status: "ว่าง" },
    { id: 5, name: "ล็อตที่ 5", status: "ถูกเช่าแล้ว" },
    { id: 6, name: "ล็อตที่ 6", status: "ว่าง" },
    { id: 7, name: "ล็อตที่ 7", status: "ว่าง" },
    { id: 8, name: "ล็อตที่ 8", status: "ว่าง" },
    { id: 9, name: "ล็อตที่ 9", status: "ถูกเช่าแล้ว" },
  ];

  const handleOpen = (lot) => {
    setSelectedLot(lot);
    setShow(true);
  };

  const handleClose = () => {
    setShow(false);
    setSelectedLot(null);
  };

  return (
    <>
      <NavbarComponent />

      <Container className="mt-4 mb-5">
        <h2 className="text-center mb-4">รายการพื้นที่ให้เช่า</h2>

        <Row className="g-4 justify-content-center">
          {lots.map((lot) => (
            <Col key={lot.id} xs={12} sm={6} md={4}>
              <Card className="shadow-sm text-center h-100 border-0">
                <Card.Img
                  variant="top"
                  src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  className="p-3"
                  style={{ width: "150px", margin: "0 auto" }}
                />
                <Card.Body>
                  <Card.Title>{lot.name}</Card.Title>
                  <Card.Text>
                    <strong>สถานะ:</strong>{" "}
                    <span
                      style={{
                        color: lot.status === "ว่าง" ? "green" : "red",
                        fontWeight: "bold",
                      }}
                    >
                      {lot.status}
                    </span>
                  </Card.Text>
                  <div className="d-flex justify-content-center gap-2">
                    <Button variant="outline-primary">รายละเอียด</Button>
                    <Button
                      variant={lot.status === "ว่าง" ? "success" : "secondary"}
                      disabled={lot.status !== "ว่าง"}
                      onClick={() => handleOpen(lot)}   // ✅ กดแล้วเด้ง Modal
                    >
                      เช่าพื้นที่
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* ✅ Modal ฟอร์มลงทะเบียน */}
      <Modal show={show} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            ลงทะเบียนเช่าพื้นที่ {selectedLot ? `- ${selectedLot.name}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FromRegister selectedLot={selectedLot} onClose={handleClose} />
        </Modal.Body>
      </Modal>
    </>
  );
}
