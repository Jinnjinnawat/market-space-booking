import { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Alert from "react-bootstrap/Alert";

export default function FromRegister({ selectedLot, onClose }) {
  const [form, setForm] = useState({
    name: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    agree: false,
  });

  const [submitted, setSubmitted] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: call API/Firestore/SQL ที่นี่
    // ตัวอย่าง log:
    console.log("Rent request:", { lot: selectedLot, ...form });
    setSubmitted(true);

    // ปิด Modal หลังแจ้งเตือนเล็กน้อย หรือจะปิดทันทีเลยก็ได้
    setTimeout(() => {
      onClose?.();
    }, 800);
  };

  return (
    <Form onSubmit={onSubmit}>
      <h4 className="mb-3">
        ฟอร์มลงทะเบียนเช่าพื้นที่ {selectedLot ? `(${selectedLot.name})` : ""}
      </h4>

      {submitted && (
        <Alert variant="success" className="py-2">
          ส่งคำขอเช่าสำเร็จ! เราจะติดต่อกลับโดยเร็วที่สุด
        </Alert>
      )}

      <Row className="mb-3">
        <Form.Group as={Col} controlId="formName">
          <Form.Label>ชื่อ</Form.Label>
          <Form.Control
            placeholder="ชื่อ"
            name="name"
            value={form.name}
            onChange={onChange}
            required
          />
        </Form.Group>

        <Form.Group as={Col} controlId="formLastName">
          <Form.Label>นามสกุล</Form.Label>
          <Form.Control
            placeholder="นามสกุล"
            name="lastName"
            value={form.lastName}
            onChange={onChange}
            required
          />
        </Form.Group>

        <Form.Group as={Col} controlId="formPhone">
          <Form.Label>เบอร์โทรศัพท์</Form.Label>
          <Form.Control
            placeholder="เบอร์โทรศัพท์"
            name="phone"
            value={form.phone}
            onChange={onChange}
            required
          />
        </Form.Group>
      </Row>

      <Form.Group className="mb-3" controlId="formGridAddress1">
        <Form.Label>ที่อยู่</Form.Label>
        <Form.Control
          placeholder="1234 Main St"
          name="address"
          value={form.address}
          onChange={onChange}
          required
        />
      </Form.Group>

      <Row className="mb-3">
        <Form.Group as={Col} controlId="formGridCity">
          <Form.Label>อำเภอ/เขต</Form.Label>
          <Form.Control
            name="city"
            value={form.city}
            onChange={onChange}
          />
        </Form.Group>

        <Form.Group as={Col} controlId="formGridState">
          <Form.Label>จังหวัด</Form.Label>
          <Form.Select
            defaultValue=""
            name="state"
            value={form.state}
            onChange={onChange}
          >
            <option value="">เลือกจังหวัด...</option>
            <option>กรุงเทพมหานคร</option>
            <option>เชียงใหม่</option>
            <option>ขอนแก่น</option>
            <option>ภูเก็ต</option>
            <option>...</option>
          </Form.Select>
        </Form.Group>

        <Form.Group as={Col} controlId="formGridZip">
          <Form.Label>รหัสไปรษณีย์</Form.Label>
          <Form.Control
            name="zip"
            value={form.zip}
            onChange={onChange}
          />
        </Form.Group>
      </Row>

      <Form.Group className="mb-3" id="formGridCheckbox">
        <Form.Check
          type="checkbox"
          label="ยอมรับเงื่อนไขการเช่า"
          name="agree"
          checked={form.agree}
          onChange={onChange}
          required
        />
      </Form.Group>

      <div className="d-flex gap-2 justify-content-end">
        <Button variant="outline-secondary" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button variant="success" type="submit">
          เช่าพื้นที่
        </Button>
      </div>
    </Form>
  );
}
