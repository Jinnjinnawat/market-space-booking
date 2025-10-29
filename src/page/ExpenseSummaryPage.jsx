// src/page/ExpenseSummaryPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Card,
  Col,
  Container,
  Row,
  Spinner,
  Table,
  Accordion,
} from "react-bootstrap";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../service/Firebase";
import { useAuth } from "../context/AuthProvider";
import NavbarComponent from "../componnets/Navbar";
import Footer from "../componnets/Footer";

// -------- helpers --------
const fmtTHB = (n) =>
  typeof n === "number"
    ? n.toLocaleString("th-TH", { style: "currency", currency: "THB" })
    : "-";

const fmtDateTime = (ts) => {
  if (!ts) return "-";
  try {
    const d =
      typeof ts?.toDate === "function"
        ? ts.toDate()
        : typeof ts === "number"
        ? new Date(ts)
        : ts?.seconds
        ? new Date(ts.seconds * 1000)
        : new Date(ts);
    return d.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "-";
  }
};

const getMonthKey = (ts) => {
  if (!ts) return "-";
  const d =
    typeof ts?.toDate === "function"
      ? ts.toDate()
      : ts?.seconds
      ? new Date(ts.seconds * 1000)
      : new Date(ts);
  if (isNaN(d)) return "-";
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`; // YYYY-MM
};

// Firestore 'in' จำกัด 10 รายการ
const chunk = (arr, size = 10) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export default function ExpenseSummaryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [myBookings, setMyBookings] = useState([]); // /bookings ของ user
  const [myUtilities, setMyUtilities] = useState([]); // /utilityPayments (paidBy.uid)
  const [myRentPayments, setMyRentPayments] = useState([]); // /payments ที่ bookingId อยู่ใน myBookings

  // 1) โหลด /bookings ของผู้ใช้ (เพื่อหา bookingId/lotId)
  useEffect(() => {
    if (!user) return;
    const qBk = query(
      collection(db, "bookings"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(qBk, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMyBookings(rows);
    });
    return () => unsub();
  }, [user]);

  // 2) โหลด /utilityPayments ของผู้ใช้ (paidBy.uid == user.uid)
  useEffect(() => {
    if (!user) return;
    const qUt = query(
      collection(db, "utilityPayments"),
      where("paidBy.uid", "==", user.uid),
      orderBy("paidAt", "desc")
    );
    const unsub = onSnapshot(qUt, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMyUtilities(rows);
    });
    return () => unsub();
  }, [user]);

  // 3) โหลด /payments โดยอิง bookingId จาก myBookings (แบ่งชุด in ≤ 10)
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const bookingIds = myBookings.map((b) => b.id);
        if (bookingIds.length === 0) {
          // ไม่มีการจอง → ไม่มี rent payments
          if (active) setMyRentPayments([]);
          return;
        }
        const chunks = chunk(bookingIds, 10);
        const collected = [];
        for (const ids of chunks) {
          const qPay = query(
            collection(db, "payments"),
            where("bookingId", "in", ids)
          );
          const snap = await getDocs(qPay);
          collected.push(
            ...snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          );
        }
        // เรียงตาม paidAt ใหม่
        collected.sort((a, b) => {
          const da = a?.paidAt?.seconds || 0;
          const dbs = b?.paidAt?.seconds || 0;
          return dbs - da;
        });
        if (active) setMyRentPayments(collected);
      } catch (e) {
        console.error("Load payments error:", e);
        if (active) setMyRentPayments([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [user, myBookings]);

  // -------- รวมต่อเดือน (YYYY-MM) --------
  const monthly = useMemo(() => {
    const map = new Map();

    // รวม utility
    for (const u of myUtilities) {
      const m = getMonthKey(u?.paidAt || u?.createdAt);
      if (!map.has(m))
        map.set(m, {
          month: m,
          rent: 0,
          utilities: 0,
          items: [],
        });
      const bucket = map.get(m);
      bucket.utilities += Number(u?.amount || 0);
      bucket.items.push({
        type: "utility",
        name: u?.name || "ค่าสาธารณูปโภค",
        lotId: u?.lotId || "",
        amount: Number(u?.amount || 0),
        method: u?.method || "",
        status: u?.status || "",
        when: u?.paidAt || u?.createdAt,
        refId: u?.id,
      });
    }

    // รวม rent (payments)
    for (const p of myRentPayments) {
      const m = getMonthKey(p?.paidAt || p?.createdAt);
      if (!map.has(m))
        map.set(m, {
          month: m,
          rent: 0,
          utilities: 0,
          items: [],
        });
      const bucket = map.get(m);
      bucket.rent += Number(p?.amount || 0);
      bucket.items.push({
        type: "rent",
        name: `ค่าเช่าล็อต ${p?.lotName || ""}`,
        lotId: p?.lotId || "",
        amount: Number(p?.amount || 0),
        method: p?.method || "",
        status: "paid", // โครงสร้าง /payments ที่ให้มาถือว่าจ่ายแล้ว
        when: p?.paidAt || p?.createdAt,
        refId: p?.id,
      });
    }

    const arr = Array.from(map.values());
    // เรียงใหม่: ใหม่ → เก่า
    arr.sort((a, b) => b.month.localeCompare(a.month));
    return arr;
  }, [myUtilities, myRentPayments]);

  const grandTotal = useMemo(
    () => monthly.reduce((s, m) => s + m.rent + m.utilities, 0),
    [monthly]
  );

  const loadingUI = (
    <div className="text-center my-5">
      <Spinner animation="border" />
    </div>
  );

  return (
    <>
      <NavbarComponent />
      <Container className="my-4">
        <h3 className="fw-bold text-center mb-3">สรุปค่าใช้จ่ายทั้งหมด</h3>
        <p className="text-center text-muted mb-4">
          
        </p>

        {loading ? (
          loadingUI
        ) : (
          <>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <Card className="border-0 bg-light">
                      <Card.Body>
                        <div className="small text-muted">จำนวนเดือนที่มีรายการ</div>
                        <div className="fs-4 fw-bold">{monthly.length}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="border-0 bg-light">
                      <Card.Body>
                        <div className="small text-muted">รวมค่าเช่าทั้งหมด</div>
                        <div className="fs-4 fw-bold text-primary">
                          {fmtTHB(
                            monthly.reduce((s, m) => s + m.rent, 0)
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="border-0 bg-light">
                      <Card.Body>
                        <div className="small text-muted">รวมค่าสาธารณูปโภคทั้งหมด</div>
                        <div className="fs-4 fw-bold text-info">
                          {fmtTHB(
                            monthly.reduce((s, m) => s + m.utilities, 0)
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                <hr />
                <div className="text-end">
                  <span className="me-2 fw-semibold">ยอดรวมทั้งหมด</span>
                  <span className="fs-4 fw-bold text-success">
                    {fmtTHB(grandTotal)}
                  </span>
                </div>
              </Card.Body>
            </Card>

            {/* ตารางสรุปต่อเดือน */}
            <Card className="shadow-sm">
              <Card.Body>
                <Table responsive bordered hover>
                  <thead className="table-secondary">
                    <tr>
                      <th style={{ width: 140 }}>เดือน</th>
                      <th>ค่าเช่า</th>
                      <th>ค่าสาธารณูปโภค</th>
                      <th style={{ width: 180 }}>รวมต่อเดือน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((m) => (
                      <tr key={m.month}>
                        <td className="fw-semibold">{m.month}</td>
                        <td>{fmtTHB(m.rent)}</td>
                        <td>{fmtTHB(m.utilities)}</td>
                        <td className="fw-bold text-success">
                          {fmtTHB(m.rent + m.utilities)}
                        </td>
                      </tr>
                    ))}
                    {monthly.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted">
                          ยังไม่มีรายการค่าใช้จ่าย
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* รายการย่อยรายเดือน (Expandable) */}
            {monthly.length > 0 && (
              <Card className="shadow-sm mt-4">
                <Card.Header className="bg-white fw-bold">
                  รายละเอียดรายการตามเดือน
                </Card.Header>
                <Card.Body>
                  <Accordion alwaysOpen>
                    {monthly.map((m, idx) => (
                      <Accordion.Item eventKey={String(idx)} key={m.month}>
                        <Accordion.Header>
                          เดือน {m.month} — รวม{" "}
                          <span className="ms-1 text-success fw-bold">
                            {fmtTHB(m.rent + m.utilities)}
                          </span>
                        </Accordion.Header>
                        <Accordion.Body>
                          <Table responsive bordered size="sm" hover>
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: 110 }}>ประเภท</th>
                                <th>รายละเอียด</th>
                                <th style={{ width: 120 }}>จำนวนเงิน</th>
                                <th style={{ width: 120 }}>วิธีชำระ</th>
                                <th style={{ width: 160 }}>วันที่ชำระ</th>
                                <th style={{ width: 120 }}>สถานะ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {m.items.map((it) => (
                                <tr key={it.refId}>
                                  <td>
                                    {it.type === "utility" ? (
                                      <Badge bg="info">ค่าสาธารณูปโภค</Badge>
                                    ) : (
                                      <Badge bg="primary">ค่าเช่า</Badge>
                                    )}
                                  </td>
                                  <td>
                                    <div className="fw-semibold">
                                      {it.name || "-"}
                                    </div>
                                    <div className="text-muted small">
                                      Lot: {it.lotId || "-"}
                                      {it.type === "utility" ? "" : ""}
                                    </div>
                                  </td>
                                  <td className="fw-semibold">
                                    {fmtTHB(it.amount)}
                                  </td>
                                  <td>{it.method || "-"}</td>
                                  <td>{fmtDateTime(it.when)}</td>
                                  <td>
                                    <Badge
                                      bg={
                                        (it.status || "").toLowerCase() ===
                                        "paid"
                                          ? "success"
                                          : (it.status || "").toLowerCase() ===
                                            "pending"
                                          ? "warning"
                                          : "secondary"
                                      }
                                    >
                                      {it.status || "-"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Card.Body>
              </Card>
            )}
          </>
        )}
      </Container>
      <Footer />
    </>
  );
}
