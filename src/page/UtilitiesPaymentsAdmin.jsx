// src/page/UtilitiesPaymentsAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../service/Firebase";
import AdminSidebar from "../componnets/AdminSideBar";

const SIDEBAR_WIDTH = 260;
const UTIL_COL = "utilities";
const LOTS_COL = "lots";
const UTIL_PAY_COL = "utilityPayments"; // ชื่อคอลเลกชันชำระเงินค่าสาธารณูปโภค

// ---------- helpers ----------
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

const statusLabel = (s) => {
  const t = String(s || "").toLowerCase();
  if (t === "paid") return "ชำระแล้ว";
  if (t === "pending") return "รอตรวจสอบ";
  if (t === "unpaid" || !t) return "ยังไม่ชำระ";
  return s;
};
const statusVariant = (s) => {
  const t = String(s || "").toLowerCase();
  if (t === "paid") return "success";
  if (t === "pending") return "warning";
  return "secondary";
};

// normalize lotId (string / DocumentReference)
const normLotId = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v.id) return v.id;
  return null;
};

export default function UtilitiesPaymentsAdmin() {
  // ---------- state ----------
  const [loading, setLoading] = useState(true);
  const [lots, setLots] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [payments, setPayments] = useState([]);

  // filters
  const [lotFilter, setLotFilter] = useState("");
  const [billingFilter, setBillingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [q, setQ] = useState("");

  // ---------- load data ----------
  useEffect(() => {
    const qLots = query(collection(db, LOTS_COL), orderBy("createdAt", "desc"));
    const unsubLots = onSnapshot(qLots, (snap) => {
      setLots(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const qUtils = query(collection(db, UTIL_COL), orderBy("createdAt", "desc"));
    const unsubUtils = onSnapshot(qUtils, (snap) => {
      setUtilities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const qPays = query(collection(db, UTIL_PAY_COL), orderBy("createdAt", "desc"));
    const unsubPays = onSnapshot(qPays, (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubLots();
      unsubUtils();
      unsubPays();
    };
  }, []);

  // ---------- maps ----------
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

  const utilMap = useMemo(
    () =>
      Object.fromEntries(
        utilities.map((u) => [
          u.id,
          {
            name: u.name || "-",
            billingMonth: u.billingMonth || "",
            lotId: normLotId(u.lotId),
            unit: u.unit || "-",
            usage: u.usage,
            pricePerUnit: u.pricePerUnit,
            total: u.total,
            paymentStatus: u.paymentStatus,
          },
        ])
      ),
    [utilities]
  );

  // ---------- derive list ----------
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();

    return payments
      .map((p) => {
        const util = utilMap[p.utilityId] || {};
        const lotId = normLotId(p.lotId) || util.lotId;
        const lotNo = lotMap[lotId] || p.lotNo;

        return {
          ...p,
          _lotId: lotId,
          _lotNo: lotNo,
          _utilName: p.name || util.name || "-",
          _billingMonth: p.billingMonth || util.billingMonth || "",
          _amount: typeof p.amount === "number" ? p.amount : util.total,
          _method: p.method || "-",
          _status: p.status || util.paymentStatus || "unpaid",
          _paidByName:
            p.paidBy?.displayName ||
            p.paidBy?.name ||
            p.paidBy?.email ||
            "-",
        };
      })
      .filter((r) => (lotFilter ? r._lotId === lotFilter : true))
      .filter((r) => (billingFilter ? r._billingMonth === billingFilter : true))
      .filter((r) =>
        statusFilter ? String(r._status).toLowerCase() === statusFilter : true
      )
      .filter((r) =>
        methodFilter ? String(r._method).toLowerCase() === methodFilter : true
      )
      .filter((r) =>
        !s
          ? true
          : [
              r._utilName,
              r._lotNo,
              r._billingMonth,
              r._method,
              r._status,
              r._paidByName,
            ]
              .join(" ")
              .toLowerCase()
              .includes(s)
      );
  }, [payments, utilMap, lotMap, lotFilter, billingFilter, statusFilter, methodFilter, q]);

  const grandTotal = useMemo(
    () =>
      rows.reduce(
        (sum, r) => sum + (typeof r._amount === "number" ? r._amount : 0),
        0
      ),
    [rows]
  );

  // ---------- options ----------
  const monthOptions = useMemo(() => {
    const set = new Set();
    payments.forEach((p) => {
      if (p.billingMonth) set.add(p.billingMonth);
      const utilMonth = utilMap[p.utilityId]?.billingMonth;
      if (utilMonth) set.add(utilMonth);
    });
    return Array.from(set).sort();
  }, [payments, utilMap]);

  const lotOptions = useMemo(() => {
    return lots
      .slice()
      .sort((a, b) => (a.lotNo || "").localeCompare(b.lotNo || ""));
  }, [lots]);

  // ---------- export CSV ----------
  const exportCSV = () => {
    const headers = [
      "ลำดับ",
      "LotNo",
      "เดือน",
      "ชื่อรายการ",
      "จำนวนเงิน",
      "วิธีชำระ",
      "สถานะ",
      "ผู้ชำระ",
      "สร้างเมื่อ",
      "ชำระเมื่อ",
      "SlipURL",
      "PaymentID",
      "UtilityID",
      "LotID",
    ];
    const lines = rows.map((r, i) => [
      i + 1,
      r._lotNo || "",
      r._billingMonth || "",
      r._utilName || "",
      typeof r._amount === "number" ? r._amount : "",
      r._method || "",
      r._status || "",
      r._paidByName || "",
      fmtDateTime(r.createdAt),
      fmtDateTime(r.paidAt),
      r.slipUrl || "",
      r.id,
      r.utilityId || "",
      r._lotId || "",
    ]);

    const csv =
      "\uFEFF" +
      [headers, ...lines]
        .map((arr) =>
          arr
            .map((v) => {
              const s = String(v ?? "");
              return `"${s.replaceAll(`"`, `""`)}"`;
            })
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utility-payments-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ---------- render ----------
  return (
    <div className="d-flex">
      <div
        className="border-end bg-light position-fixed top-0 start-0"
        style={{ width: SIDEBAR_WIDTH, height: "100vh", zIndex: 1000 }}
      >
        <AdminSidebar />
      </div>

      <div style={{ marginLeft: SIDEBAR_WIDTH, width: `calc(100% - ${SIDEBAR_WIDTH}px)` }}>
        <Container className="py-4">
          <Card className="shadow-sm">
            <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h5 className="mb-0">ข้อมูลการชำระเงินค่าสาธารณูปโภค (แอดมิน)</h5>
              <div className="d-flex align-items-center gap-2">
                <Badge bg="secondary">
                  จำนวนรายการ: {rows.length.toLocaleString("th-TH")}
                </Badge>
                <Badge bg="info" text="dark">
                  ยอดรวม: {fmtTHB(grandTotal)}
                </Badge>
                <Button variant="outline-primary" size="sm" onClick={exportCSV}>
                  Export CSV
                </Button>
              </div>
            </Card.Header>

            <Card.Body>
              {/* Filters */}
              <Row className="g-2 mb-3">
                <Col md={3} sm={6}>
                  <Form.Label>เลือกล็อต (lotNo)</Form.Label>
                  <Form.Select
                    value={lotFilter}
                    onChange={(e) => setLotFilter(e.target.value)}
                  >
                    <option value="">ทั้งหมด</option>
                    {lotOptions.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.lotNo || l.code || l.number || l.name || l.id}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={3} sm={6}>
                  <Form.Label>เลือกเดือน</Form.Label>
                  <Form.Select
                    value={billingFilter}
                    onChange={(e) => setBillingFilter(e.target.value)}
                  >
                    <option value="">ทุกเดือน</option>
                    {monthOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={2} sm={6}>
                  <Form.Label>สถานะ</Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="paid">ชำระแล้ว</option>
                    <option value="pending">รอตรวจสอบ</option>
                    <option value="unpaid">ยังไม่ชำระ</option>
                  </Form.Select>
                </Col>

                <Col md={2} sm={6}>
                  <Form.Label>วิธีชำระ</Form.Label>
                  <Form.Select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="transfer">โอน</option>
                    <option value="cash">เงินสด</option>
                    <option value="card">บัตร</option>
                    <option value="qr">QR</option>
                  </Form.Select>
                </Col>

                <Col md={2} sm={12}>
                  <Form.Label>ค้นหา</Form.Label>
                  <Form.Control
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="LotNo / ชื่อ / ผู้ชำระ"
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
                      <th>Lot</th>
                      <th>เดือน</th>
                      <th>ชื่อรายการ</th>
                      <th className="text-end">จำนวนเงิน</th>
                      <th>วิธีชำระ</th>
                      <th>ผู้ชำระ</th>
                      <th>สถานะ</th>
                      <th className="text-center">สลิป</th>
                      <th>สร้างเมื่อ</th>
                      <th>ชำระเมื่อ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center text-muted">
                          ไม่มีข้อมูลการชำระเงิน
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => (
                        <tr key={r.id}>
                          <td>{i + 1}</td>
                          <td>{r._lotNo || "-"}</td>
                          <td>{r._billingMonth || "-"}</td>
                          <td>{r._utilName || "-"}</td>
                          <td className="text-end">
                            {typeof r._amount === "number"
                              ? r._amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })
                              : "-"}
                          </td>
                          <td>{r._method || "-"}</td>
                          <td>{r._paidByName}</td>
                          <td>
                            <Badge bg={statusVariant(r._status)}>
                              {statusLabel(r._status)}
                            </Badge>
                          </td>
                          <td className="text-center">
                            {r.slipUrl ? (
                              <Button
                                as="a"
                                href={r.slipUrl}
                                target="_blank"
                                rel="noreferrer"
                                variant="outline-secondary"
                                size="sm"
                              >
                                ดูสลิป
                              </Button>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>{fmtDateTime(r.createdAt)}</td>
                          <td>{fmtDateTime(r.paidAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {rows.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="text-end fw-bold">
                          รวมทั้งหมด
                        </td>
                        <td className="text-end fw-bold">
                          {grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </td>
                        {/* คอลัมน์ที่เหลือหลังจาก "จำนวนเงิน" = 11 - 5 = 6 */}
                        <td colSpan={6}></td>
                      </tr>
                    </tfoot>
                  )}
                </Table>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
}
