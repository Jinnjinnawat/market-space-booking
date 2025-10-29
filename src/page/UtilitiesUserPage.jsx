// src/page/UtilitiesUserPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Container,
  Form,
  Table,
  Spinner,
  Row,
  Col,
  Badge,
  Button,
} from "react-bootstrap";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../service/Firebase";
import NavbarComponent from "../componnets/Navbar";
import Footer from "../componnets/Footer";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

const fmtTHB = (n) =>
  typeof n === "number"
    ? n.toLocaleString("th-TH", { style: "currency", currency: "THB" })
    : "-";

const fmtDateTime = (ts) => {
  try {
    const d =
      typeof ts?.toDate === "function" ? ts.toDate() :
      typeof ts === "number" ? new Date(ts) :
      ts?.seconds ? new Date(ts.seconds * 1000) :
      null;
    return d ? d.toLocaleString("th-TH") : "-";
  } catch {
    return "-";
  }
};

const payStatusLabel = (s) => {
  const t = String(s || "").toLowerCase();
  if (t === "paid") return "ชำระแล้ว";
  if (t === "pending") return "รอตรวจสอบ";
  if (t === "unpaid" || !t) return "ยังไม่ชำระ";
  return s;
};
const payStatusVariant = (s) => {
  const t = String(s || "").toLowerCase();
  if (t === "paid") return "success";
  if (t === "pending") return "warning";
  return "secondary";
};

// ✅ normalize lotId ที่อาจเป็น string หรือ DocumentReference
const normLotId = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v.id) return v.id; // DocumentReference
  return null;
};

export default function UtilitiesUserPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [lots, setLots] = useState([]);
  const [items, setItems] = useState([]);

  // เอา lotIds จาก bookings ด้วย (กันกรณี lots ยังไม่ผูก)
  const [bookingLotIds, setBookingLotIds] = useState([]);

  const [lotFilter, setLotFilter] = useState(""); // lotId
  const [q, setQ] = useState(""); // ค้นหาชื่อรายการ
  const [billingFilter, setBillingFilter] = useState(""); // YYYY-MM

  // ----- โหลด lots -----
  useEffect(() => {
    const qLots = query(collection(db, "lots"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qLots, (snap) => {
      setLots(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ----- โหลด utilities (ฝั่งผู้ใช้ดูทั้งหมดแล้วไปกรองในแอป) -----
  useEffect(() => {
    const qU = query(collection(db, "utilities"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qU, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ----- โหลด bookings ของ user เพื่อดู lotId ที่เกี่ยวข้อง -----
  useEffect(() => {
    if (!user) { setBookingLotIds([]); return; }
    const base = collection(db, "bookings");
    const q1 = query(base, where("uid", "==", user.uid));
    const q2 = query(base, where("userId", "==", user.uid));
    const q3 = query(base, where("createdBy.uid", "==", user.uid));
    const pool = new Set();
    const collect = (snap) => {
      snap.docs.forEach((d) => {
        const b = d.data();
        const lid = normLotId(b.lotId ?? b.lotID ?? b.lotRef);
        if (lid) pool.add(lid);
      });
      setBookingLotIds(Array.from(pool));
    };
    const u1 = onSnapshot(q1, collect);
    const u2 = onSnapshot(q2, collect);
    const u3 = onSnapshot(q3, collect);
    return () => { u1(); u2(); u3(); };
  }, [user]);

  // map lotId -> lotNo
  const lotMap = useMemo(
    () =>
      Object.fromEntries(
        lots.map((l) => [
          l.id,
          l.lotNo || l.code || l.number || l.name || l.id.slice(0, 6),
        ])
      ),
    [lots]
  );

  // หา lot ของผู้ใช้ (รองรับหลายฟิลด์)
  const myLotIds = useMemo(() => {
    if (!user) return bookingLotIds;
    const uid = user.uid;
    const email = (user.email || "").toLowerCase();
    const fromLots = lots
      .filter((l) => {
        const renterUid = String(l.renterUid || l.currentRenterUid || "");
        const renterEmail = String(l.renterEmail || "").toLowerCase();
        const members = Array.isArray(l.members) ? l.members : [];
        const inMembers = members.includes(uid) || members.includes(email);
        return renterUid === uid || (!!email && renterEmail === email) || inMembers;
      })
      .map((l) => l.id);
    return Array.from(new Set([...fromLots, ...bookingLotIds]));
  }, [lots, user, bookingLotIds]);

  // กรอง utilities ที่เกี่ยวข้องกับผู้ใช้
  const myUtilities = useMemo(() => {
    if (!user) return [];
    const uid = user.uid;

    const base = items.filter((it) => {
      const lotIdNorm = normLotId(it.lotId);
      const byLot = lotIdNorm ? myLotIds.includes(lotIdNorm) : false;
      const createdByUid =
        typeof it.createdBy === "string"
          ? it.createdBy
          : it?.createdBy?.uid;
      const byCreator = createdByUid === uid;
      return byLot || byCreator;
    });

    const s = q.trim().toLowerCase();
    return base
      .filter((it) => (lotFilter ? normLotId(it.lotId) === lotFilter : true))
      .filter((it) => (billingFilter ? (it.billingMonth || "") === billingFilter : true))
      .filter((it) =>
        !s
          ? true
          : [
              it.name,
              lotMap[normLotId(it.lotId)] ?? it.lotNo,
              it.unit,
              it.billingMonth || ""
            ]
              .join(" ")
              .toLowerCase()
              .includes(s)
      );
  }, [items, myLotIds, lotFilter, billingFilter, q, user, lotMap]);

  const grandTotal = useMemo(
    () =>
      myUtilities.reduce(
        (sum, it) => sum + (typeof it.total === "number" ? it.total : 0),
        0
      ),
    [myUtilities]
  );

  const canPay = (it) => String(it?.paymentStatus || "").toLowerCase() !== "paid";
  const handlePay = (it) => navigate(`/utility-pay/${it.id}`);

  // เอา list เดือนที่มีในข้อมูลของผู้ใช้ไว้ทำดรอปดาวน์กรอง
  const monthOptions = useMemo(() => {
    const set = new Set(
      myUtilities
        .map((it) => it.billingMonth)
        .filter(Boolean)
    );
    return Array.from(set).sort(); // YYYY-MM จัดเรียงได้ตามตัวเลข
  }, [myUtilities]);

  return (
    <>
      <NavbarComponent />
      <Container className="py-4">
        <Card className="shadow-sm">
          <Card.Header>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h5 className="mb-0">ค่าสาธารณูปโภคของฉัน</h5>
              <Badge bg="secondary">รวมทั้งหมด: {fmtTHB(grandTotal)}</Badge>
            </div>
          </Card.Header>

          <Card.Body>
            {/* ตัวกรอง */}
            <Row className="g-2 mb-3">
              <Col md={4} sm={6}>
                <Form.Label>เลือกล็อต (lotNo)</Form.Label>
                <Form.Select
                  value={lotFilter}
                  onChange={(e) => setLotFilter(e.target.value)}
                >
                  <option value="">ทั้งหมด</option>
                  {lots
                    .filter((l) => myLotIds.includes(l.id))
                    .sort((a, b) => (a.lotNo || "").localeCompare(b.lotNo || ""))
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.lotNo || l.code || l.number || l.name || l.id}
                      </option>
                    ))}
                </Form.Select>
              </Col>

              <Col md={4} sm={6}>
                <Form.Label>เลือกเดือน</Form.Label>
                <Form.Select
                  value={billingFilter}
                  onChange={(e) => setBillingFilter(e.target.value)}
                >
                  <option value="">ทุกเดือน</option>
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={4} sm={12}>
                <Form.Label>ค้นหาชื่อรายการ</Form.Label>
                <Form.Control
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="พิมพ์ เช่น ค่าน้ำ หรือ ค่าไฟ"
                />
              </Col>
            </Row>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : (
              <Table bordered hover responsive className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ลำดับ</th>
                    <th>ชื่อรายการ</th>
                    <th>ล็อต (lotNo)</th>
                    <th>เดือน</th>
                    <th>หน่วย</th>
                    <th className="text-end">จำนวนที่ใช้</th>
                    <th className="text-end">ราคาต่อหน่วย</th>
                    <th className="text-end">รวม (บาท)</th>
                    <th>สถานะ</th>
                    <th className="text-center">หลักฐาน</th>
                    <th className="text-center">จัดการ</th>
                    <th>วันที่สร้าง</th>
                  </tr>
                </thead>
                <tbody>
                  {myUtilities.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center text-muted">
                        ไม่มีรายการที่เกี่ยวข้องกับบัญชีของคุณ
                      </td>
                    </tr>
                  ) : (
                    myUtilities.map((it, i) => {
                      const lotIdNorm = normLotId(it.lotId);
                      const lotNoDisplay = lotMap[lotIdNorm] ?? it.lotNo ?? "-";
                      return (
                        <tr key={it.id}>
                          <td>{i + 1}</td>
                          <td>{it.name || "-"}</td>
                          <td>{lotNoDisplay}</td>
                          <td>{it.billingMonth || "-"}</td>
                          <td>{it.unit || "-"}</td>
                          <td className="text-end">
                            {typeof it.usage === "number"
                              ? it.usage.toLocaleString("th-TH")
                              : "-"}
                          </td>
                          <td className="text-end">
                            {typeof it.pricePerUnit === "number"
                              ? it.pricePerUnit.toLocaleString("th-TH")
                              : "-"}
                          </td>
                          <td className="text-end">
                            {typeof it.total === "number"
                              ? it.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })
                              : "-"}
                          </td>
                          <td>
                            <Badge bg={payStatusVariant(it.paymentStatus)}>
                              {payStatusLabel(it.paymentStatus)}
                            </Badge>
                          </td>
                          <td className="text-center">
                            {it.billUrl ? (
                              <Button
                                as="a"
                                href={it.billUrl}
                                target="_blank"
                                rel="noreferrer"
                                size="sm"
                                variant="outline-secondary"
                              >
                                ดูบิล
                              </Button>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-center">
                            {canPay(it) ? (
                              <Button size="sm" variant="success" onClick={() => handlePay(it)}>
                                ชำระเงิน
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline-secondary" disabled>
                                ชำระเงินแล้ว
                              </Button>
                            )}
                          </td>
                          <td>{fmtDateTime(it.createdAt)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {myUtilities.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={7} className="text-end fw-bold">รวมทั้งหมด</td>
                      <td className="text-end fw-bold">
                        {grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={4} />
                    </tr>
                  </tfoot>
                )}
              </Table>
            )}

            
          </Card.Body>
        </Card>
      </Container>
      <Footer />
    </>
  );
}
