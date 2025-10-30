// src/components/UtilityPayModal.jsx
import { useState, useMemo } from "react";
import { Modal, Form, Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import { db, storage } from "../service/Firebase";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

const fmtTHB = (n) =>
  typeof n === "number"
    ? n.toLocaleString("th-TH", { style: "currency", currency: "THB" })
    : "-";

/**
 * props:
 * - show: boolean
 * - onHide: fn()
 * - utility: {id, name, total, unit, usage, pricePerUnit, lotId, billingMonth, billUrl, paymentStatus, ...}
 * - lotNo: string (เพื่อโชว์ในหัวรายการ)
 */
export default function UtilityPayModal({ show, onHide, utility, lotNo }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [method, setMethod] = useState(""); // card | transfer | cash
  const [amount, setAmount] = useState(utility?.total || 0);
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const title = useMemo(() => {
    const n = utility?.name || "ค่าสาธารณูปโภค";
    const m = utility?.billingMonth ? ` (${utility.billingMonth})` : "";
    const l = lotNo ? ` • ล็อต ${lotNo}` : "";
    return `${n}${m}${l}`;
  }, [utility, lotNo]);

  const handleSubmit = async () => {
    try {
      setErr("");
      if (!user) {
        setErr("กรุณาเข้าสู่ระบบก่อนทำรายการ");
        return;
      }
      if (!utility?.id) {
        setErr("ไม่พบข้อมูลรายการค่าสาธารณูปโภค");
        return;
      }
      if (!method) {
        setErr("กรุณาเลือกวิธีชำระเงิน");
        return;
      }
      const payAmount = Number(amount || 0);
      if (isNaN(payAmount) || payAmount <= 0) {
        setErr("จำนวนเงินไม่ถูกต้อง");
        return;
      }

      setSubmitting(true);

      // 1) เตรียมข้อมูลชำระ
      const paymentBase = {
        utilityId: utility.id,
        lotId: utility.lotId || null,
        billingMonth: utility.billingMonth || null,
        name: utility.name || "",
        amount: payAmount,
        method,
        note: note?.trim() || "",
        status: "paid", // ✅ ตีเป็นชำระแล้ว
        createdAt: serverTimestamp(),
        paidAt: serverTimestamp(),
        paidBy: user
          ? { uid: user.uid, email: user.email || "", displayName: user.displayName || "" }
          : null,
      };

      // 2) สร้างเอกสารชำระเงินก่อน (เพื่อได้ paymentId)
      const paymentRef = await addDoc(collection(db, "utilityPayments"), {
        ...paymentBase,
        slipUrl: "",
        slipName: "",
      });

      // 3) อัปโหลดสลิป (ถ้ามี) แล้วอัปเดตเอกสารชำระเงิน
      let slipMeta = { slipUrl: "", slipName: "" };
      if (file) {
        const safeName = file.name?.replace(/\s+/g, "_") || "slip";
        const path = `utility_payments/${utility.lotId || "no_lot"}/${utility.billingMonth || "no_month"}/${paymentRef.id}-${safeName}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        slipMeta = { slipUrl: url, slipName: file.name || "slip" };
        await updateDoc(paymentRef, { ...slipMeta, updatedAt: serverTimestamp() });
      }

      // 4) อัปเดตเอกสาร utilities ให้เป็น paid
      await updateDoc(doc(db, "utilities", utility.id), {
        paymentStatus: "paid",
        paidAt: serverTimestamp(),
        paidBy: paymentBase.paidBy,
        lastPaymentId: paymentRef.id,
        lastPaymentMethod: method,
        lastPaymentAmount: payAmount,
        lastPaymentSlipUrl: slipMeta.slipUrl || "",
        updatedAt: serverTimestamp(),
      });

      // 5) ปิดโมดอล และส่งไปหน้า 
      onHide?.();
      navigate("/utilitiesuser", {
        state: {
          paymentId: paymentRef.id,
          utilityId: utility.id,
          amount: payAmount,
          method,
          slipUrl: slipMeta.slipUrl || "",
        },
        replace: true,
      });
    } catch (e) {
      console.error(e);
      setErr("เกิดข้อผิดพลาดระหว่างทำรายการ");
    } finally {
      setSubmitting(false);
    }
  };

  if (!utility) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>ชำระค่าน้ำ/ค่าไฟ</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-2 fw-semibold">{title}</div>

        {err ? <Alert variant="danger" className="py-2">{err}</Alert> : null}

        <Row className="g-2">
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>วิธีชำระเงิน</Form.Label>
              <Form.Select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="">เลือกวิธีชำระ</option>
                <option value="card">บัตร</option>
                <option value="transfer">โอน</option>
                <option value="cash">เงินสด</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Label>จำนวนเงิน</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="small text-muted">
                ยอดตามบิล: {fmtTHB(utility.total || 0)}
              </div>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-2">
          <Form.Label>อัปโหลดสลิป/หลักฐาน (ไม่บังคับ)</Form.Label>
          <Form.Control
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>หมายเหตุ</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ข้อมูลอ้างอิง เช่น เวลาที่โอน, ธนาคาร, เลขอ้างอิง ฯลฯ"
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" disabled={submitting} onClick={onHide}>
          ยกเลิก
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || !method}>
          {submitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              กำลังบันทึก...
            </>
          ) : (
            "ยืนยันการชำระ"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
