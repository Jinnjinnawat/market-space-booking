// src/page/PaymentPage.jsx
import { useEffect, useState } from "react";
import {
  Button, Card, Col, Container, Form, Image, Row, Spinner, Toast,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import NavbarComponent from "../componnets/Navbar";

import { db, storage } from "../service/Firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function PaymentPage() {
  const { id } = useParams(); // /payments/:id (id = booking doc id)
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null); // data จาก /bookings/{id}
  const [lot, setLot] = useState(null);         // data จาก /lots/{lotId}
  const [loading, setLoading] = useState(true);

  const [method, setMethod] = useState(""); // card | transfer | cash
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const toTHB = (n) =>
    typeof n === "number"
      ? n.toLocaleString("th-TH", { style: "currency", currency: "THB" })
      : "-";

  // ✅ โหลดข้อมูลจาก /bookings/{id} แล้วตามด้วย /lots/{lotId}
  useEffect(() => {
    const load = async () => {
      try {
        const bSnap = await getDoc(doc(db, "bookings", id));
        if (!bSnap.exists()) {
          setToast({ type: "error", msg: "ไม่พบข้อมูลการจองนี้" });
          setLoading(false);
          return;
        }
        const b = { id: bSnap.id, ...bSnap.data() };
        setBooking(b);

        // ถ้ามี lotId ให้โหลดข้อมูลล็อต
        if (b.lotId) {
          const lSnap = await getDoc(doc(db, "lots", b.lotId));
          if (lSnap.exists()) setLot({ id: lSnap.id, ...lSnap.data() });
        }
      } catch (e) {
        console.error(e);
        setToast({ type: "error", msg: "โหลดข้อมูลล้มเหลว" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ✅ ยอดชำระ = pricePerMonth จาก bookings (ถ้าไม่มี ค่อย fallback จาก lots)
  const monthlyAmount = Number(
    booking?.pricePerMonth ?? lot?.pricePerMonth ?? 0
  );

  // ✅ อัปโหลดสลิป (เฉพาะโอน)
  const uploadSlip = async () => {
    if (!file) return null;
    const storageRef = ref(storage, `payment_slips/${id}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // ✅ ยืนยันการชำระ: เพิ่มเอกสารใน /payments และอัปเดต /bookings/{id} เป็น 'paid'
  const handleSubmit = async () => {
    if (!method) {
      setToast({ type: "error", msg: "กรุณาเลือกวิธีชำระเงิน" });
      return;
    }
    if (method === "transfer" && !file) {
      setToast({ type: "error", msg: "โปรดแนบสลิปโอนเงิน" });
      return;
    }

    try {
      setSubmitting(true);
      const slipUrl = method === "transfer" ? await uploadSlip() : null;

      // 1) บันทึกไปที่ /payments
      const paymentData = {
        bookingId: id,
        lotId: booking?.lotId || null,
        lotName: lot?.name || lot?.lotNo || "",
        renterName: booking?.name || "",
        phone: booking?.phone || "",
        amount: monthlyAmount,
        currency: "THB",
        method,                // card | transfer | cash
        slipUrl: slipUrl || null,
        createdAt: serverTimestamp(),
        paidAt: serverTimestamp(),
      };
      await addDoc(collection(db, "payments"), paymentData);

      // 2) อัปเดตสถานะใน /bookings/{id} เป็นภาษาอังกฤษ: 'paid'
      await updateDoc(doc(db, "bookings", id), {
        status: "paid",
        paymentMethod: method,
        paymentSlip: slipUrl || null,
        paymentAmount: monthlyAmount,
        paymentDate: serverTimestamp(),
      });

      setToast({ type: "success", msg: "บันทึกการชำระเงินเรียบร้อย!" });
      setTimeout(() => navigate("/home"), 1500);
    } catch (e) {
      console.error(e);
      setToast({ type: "error", msg: "บันทึกไม่สำเร็จ กรุณาลองใหม่" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );

  if (!booking)
    return (
      <Container className="py-5 text-center text-muted">
        ไม่พบข้อมูลการจอง
      </Container>
    );

  return (
    <>
      <NavbarComponent />
      <Container className="my-4">
        <Card className="shadow-sm border-0">
          <Card.Body>
            <h4 className="mb-3">ชำระเงินสำหรับการจอง #{id}</h4>

            <Row>
              <Col md={6}>
                <dl className="row mb-0">
                  <dt className="col-5">ชื่อผู้เช่า</dt>
                  <dd className="col-7">{booking.name || "-"}</dd>

                  <dt className="col-5">เบอร์โทร</dt>
                  <dd className="col-7">{booking.phone || "-"}</dd>

                  <dt className="col-5">ล็อต / โซน</dt>
                  <dd className="col-7">
                    {(lot?.lotNo || lot?.name || `ล็อต ${booking.lotId ?? "-"}`)} /{" "}
                    {lot?.zone || "-"}
                  </dd>

                  <dt className="col-5">ยอดที่ต้องชำระ</dt>
                  <dd className="col-7 fw-bold text-success">
                    {toTHB(monthlyAmount)}
                  </dd>
                </dl>
              </Col>
            </Row>

            <hr />

            {/* 🧾 วิธีการชำระเงิน */}
            <h5 className="mb-3">เลือกวิธีชำระเงิน</h5>
            <Form>
              <div className="mb-3">
                <Form.Check
                  type="radio"
                  id="pay-card"
                  name="method"
                  label="💳 บัตรเครดิต / เดบิต"
                  value="card"
                  checked={method === "card"}
                  onChange={(e) => setMethod(e.target.value)}
                />
                <Form.Check
                  type="radio"
                  id="pay-transfer"
                  name="method"
                  label="💸 โอนเงิน"
                  value="transfer"
                  checked={method === "transfer"}
                  onChange={(e) => setMethod(e.target.value)}
                />
                <Form.Check
                  type="radio"
                  id="pay-cash"
                  name="method"
                  label="💵 เงินสด"
                  value="cash"
                  checked={method === "cash"}
                  onChange={(e) => setMethod(e.target.value)}
                />
              </div>

              {method === "card" && (
                <Card className="p-3 mb-3">
                  <h6>รายละเอียดบัตร</h6>
                  <Form.Group className="mb-2">
                    <Form.Label>หมายเลขบัตร</Form.Label>
                    <Form.Control placeholder="XXXX-XXXX-XXXX-XXXX" />
                  </Form.Group>
                  <Row>
                    <Col>
                      <Form.Group className="mb-2">
                        <Form.Label>วันหมดอายุ</Form.Label>
                        <Form.Control placeholder="MM/YY" />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group className="mb-2">
                        <Form.Label>CVC</Form.Label>
                        <Form.Control placeholder="123" />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card>
              )}

              {method === "transfer" && (
                <Card className="p-3 mb-3">
                  <h6>ข้อมูลโอนเงิน</h6>
                  <p className="mb-1">
                    💰 <b>ธนาคารกสิกรไทย</b> 123-456-7890 (ชื่อบัญชี: ตลาดKU)
                  </p>
                  <Form.Group className="mt-2">
                    <Form.Label>แนบสลิปโอนเงิน</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    {file && (
                      <div className="mt-2">
                        <Image
                          src={URL.createObjectURL(file)}
                          thumbnail
                          style={{ maxHeight: 180 }}
                        />
                      </div>
                    )}
                  </Form.Group>
                </Card>
              )}

              {method === "cash" && (
                <Card className="p-3 mb-3">
                  <p className="m-0">
                    💵 โปรดชำระเงินสดที่สำนักงานตลาดหอใน ภายในเวลาทำการ
                  </p>
                </Card>
              )}
            </Form>

            <div className="text-end">
              <Button variant="success" disabled={submitting} onClick={handleSubmit}>
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" /> กำลังบันทึก...
                  </>
                ) : (
                  "ยืนยันการชำระเงิน"
                )}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>

      {/* ✅ Toast */}
      {toast && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}>
          <Toast
            bg={toast.type === "error" ? "danger" : "success"}
            onClose={() => setToast(null)}
            delay={2500}
            autohide
          >
            <Toast.Body className="text-white">{toast.msg}</Toast.Body>
          </Toast>
        </div>
      )}
    </>
  );
}
