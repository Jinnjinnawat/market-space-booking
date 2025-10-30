import { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Alert from "react-bootstrap/Alert";

export default function FromRegister({ selectedLot, onClose, onSave }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    agree: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    // ✅ ตรวจสอบว่ากรอกครบ
    if (!form.firstName || !form.lastName || !form.phone || !form.email || !form.address)
      return alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");

    // ✅ ส่งข้อมูลกลับไปให้ parent (Home)
    onSave?.({
      name: `${form.firstName} ${form.lastName}`,
      phone: form.phone,
      email: form.email,
      address: form.address,
    });

    setSubmitted(true);
    // รีเซ็ตฟอร์ม
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      agree: false,
    });
  };

  return (
    <Form onSubmit={onSubmit}>
      {submitted && (
        <Alert variant="success" className="mb-3">
          ✅ บันทึกข้อมูลเรียบร้อย! ขอบคุณที่เข้าร่วมประมูล
        </Alert>
      )}

      <Row className="g-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>ชื่อ</Form.Label>
            <Form.Control
              name="firstName"
              value={form.firstName}
              onChange={onChange}
              required
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>นามสกุล</Form.Label>
            <Form.Control
              name="lastName"
              value={form.lastName}
              onChange={onChange}
              required
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>เบอร์โทรศัพท์</Form.Label>
            <Form.Control
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="เช่น 0812345678"
              required
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>อีเมล</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="example@email.com"
              required
            />
          </Form.Group>
        </Col>

        <Col xs={12}>
          <Form.Group>
            <Form.Label>ที่อยู่</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="address"
              value={form.address}
              onChange={onChange}
              placeholder="ระบุบ้านเลขที่ หมู่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด"
              required
            />
          </Form.Group>
        </Col>

        

        <Col xs={12} className="d-flex justify-content-end gap-2">
          <Button variant="outline-secondary" onClick={onClose} type="button">
            ปิด
          </Button>
          <Button variant="success" type="submit">
            บันทึกข้อมูล
          </Button>
        </Col>
      </Row>
    </Form>
  );
}
