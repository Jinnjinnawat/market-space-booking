import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Badge,
  ListGroup,
} from "react-bootstrap";
import NavbarComponent from "../componnets/Navbar"; // ถ้าโฟลเดอร์สะกด components ให้แก้ path ให้ตรง
import FromRegister from "../componnets/Formregister";

export default function Home() {
  const [showRegister, setShowRegister] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);

  // ฟังก์ชันช่วยแปลงราคาเป็น THB
  const toTHB = (n) =>
    n?.toLocaleString("th-TH", { style: "currency", currency: "THB" });

  // ตัวอย่างข้อมูลล็อตตลาด (เพิ่มรายละเอียด)
  const lots = [
    {
      id: 1,
      name: "ล็อตที่ 1",
      status: "ว่าง",
      size: "2x2 ม.",
      pricePerDay: 300,
      deposit: 500,
      zone: "A",
      amenities: ["ปลั๊กไฟ", "หลังคา", "ใกล้ทางเข้า"],
      desc: "ทำเลดี เหมาะขายของกินและของแห้ง คนเดินผ่านเยอะ",
      image:
        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    {
      id: 2,
      name: "ล็อตที่ 2",
      status: "ถูกเช่าแล้ว",
      size: "3x2 ม.",
      pricePerDay: 350,
      deposit: 500,
      zone: "B",
      amenities: ["ปลั๊กไฟ", "ใกล้ห้องน้ำ"],
      desc: "เหมาะขายเสื้อผ้า/เครื่องประดับ",
      image:
        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    {
      id: 3,
      name: "ล็อตที่ 3",
      status: "ว่าง",
      size: "2x2 ม.",
      pricePerDay: 280,
      deposit: 500,
      zone: "A",
      amenities: ["ปลั๊กไฟ"],
      desc: "ทำเลกลางตลาด มองเห็นชัดจากหลายทาง",
      image:
        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    // ... เพิ่มตามต้องการ
  ];

  // เปิด/ปิดฟอร์มลงทะเบียน
  const openRegister = (lot) => {
    setSelectedLot(lot);
    setShowRegister(true);
  };
  const closeRegister = () => {
    setShowRegister(false);
    setSelectedLot(null);
  };

  // เปิด/ปิดรายละเอียด
  const openDetails = (lot) => {
    setSelectedLot(lot);
    setShowDetails(true);
  };
  const closeDetails = () => {
    setShowDetails(false);
    setSelectedLot(null);
  };

  // จาก modal รายละเอียด -> เปิดฟอร์มลงทะเบียน
  const rentFromDetails = () => {
    const lot = selectedLot;
    setShowDetails(false);
    setShowRegister(true);
    setSelectedLot(lot);
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
                  src={lot.image}
                  className="p-3"
                  style={{ width: "150px", margin: "0 auto" }}
                  alt={lot.name}
                />
                <Card.Body>
                  <Card.Title className="d-flex justify-content-center align-items-center gap-2">
                    {lot.name}
                    <Badge bg={lot.status === "ว่าง" ? "success" : "secondary"}>
                      {lot.status}
                    </Badge>
                  </Card.Title>

                  <Card.Text className="mb-2">
                    <strong>ราคา:</strong> {toTHB(lot.pricePerDay)}/วัน
                  </Card.Text>
                  <Card.Text className="text-muted" style={{ minHeight: 48 }}>
                    {lot.desc}
                  </Card.Text>

                  <div className="d-flex justify-content-center gap-2">
                    <Button variant="outline-primary" onClick={() => openDetails(lot)}>
                      รายละเอียด
                    </Button>
                    <Button
                      variant={lot.status === "ว่าง" ? "success" : "secondary"}
                      disabled={lot.status !== "ว่าง"}
                      onClick={() => openRegister(lot)}
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

      {/* ✅ Modal: รายละเอียดการเช่า */}
      <Modal show={showDetails} onHide={closeDetails} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            รายละเอียดการเช่า {selectedLot ? `- ${selectedLot.name}` : ""}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedLot && (
            <Row className="g-3">
              <Col md={4} className="text-center">
                <img
                  src={selectedLot.image}
                  alt={selectedLot.name}
                  style={{ width: "70%", maxWidth: 220 }}
                  className="mb-3"
                />
                <div className="d-inline-block">
                  <Badge bg={selectedLot.status === "ว่าง" ? "success" : "secondary"}>
                    {selectedLot.status}
                  </Badge>
                </div>
              </Col>

              <Col md={8}>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>ขนาดพื้นที่:</strong> {selectedLot.size}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>โซน:</strong> {selectedLot.zone}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>ราคา/วัน:</strong> {toTHB(selectedLot.pricePerDay)}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>มัดจำ:</strong> {toTHB(selectedLot.deposit)}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>สิ่งอำนวยความสะดวก:</strong>{" "}
                    {selectedLot.amenities?.length
                      ? selectedLot.amenities.join(" • ")
                      : "-"}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>คำอธิบาย:</strong> {selectedLot.desc}
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          )}
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <div className="text-muted small">
            *โปรดเตรียมบัตรประชาชน (ถ่ายรูป) และเบอร์โทรติดต่อ สำหรับยืนยันการเช่า
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={closeDetails}>
              ปิด
            </Button>
            <Button
              variant={selectedLot?.status === "ว่าง" ? "success" : "secondary"}
              disabled={selectedLot?.status !== "ว่าง"}
              onClick={rentFromDetails}
            >
              เช่าพื้นที่
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* ✅ Modal: ฟอร์มลงทะเบียนเช่า */}
      <Modal show={showRegister} onHide={closeRegister} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            ลงทะเบียนเช่าพื้นที่ {selectedLot ? `- ${selectedLot.name}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FromRegister selectedLot={selectedLot} onClose={closeRegister} />
        </Modal.Body>
      </Modal>
    </>
  );
}
