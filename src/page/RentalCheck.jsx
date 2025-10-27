import { useMemo, useState, useEffect } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  Row,
  Table,
  Pagination,
  Spinner,
} from "react-bootstrap";
import NavbarComponent from "../componnets/Navbar"; // ⚠️ ถ้าโฟลเดอร์สะกดเป็น components ให้แก้ให้ตรง

// 🔗 Firebase
import { db } from "../service/Firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function RentalCheck() {
  // ---------- state ----------
  const [rentalsRaw, setRentalsRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const pageSize = 8;

  // ---------- utils ----------
  const toTHB = (n) =>
    n?.toLocaleString("th-TH", { style: "currency", currency: "THB" });

  const toDateString = (v) => {
    // รองรับ Firestore Timestamp / Date / String (YYYY-MM-DD)
    if (!v) return "";
    try {
      if (typeof v?.toDate === "function") {
        const d = v.toDate();
        return d.toISOString().slice(0, 10);
      }
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      if (typeof v === "string") return v.slice(0, 10);
      return "";
    } catch {
      return "";
    }
  };

  // ---------- fetch Firestore ----------
  useEffect(() => {
    // ควรมีคอลเลกชันชื่อ "bookings"
    const qRef = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const rows = snap.docs.map((doc) => {
          const d = doc.data() || {};

          // พยายามจับคู่ฟิลด์ที่อาจต่างชื่อกันเล็กน้อย
          const startDate = toDateString(d.startDate || d.from || d.start);
          const endDate = toDateString(d.endDate || d.to || d.end);
          const pricePerDay = Number(d.pricePerDay ?? d.price ?? 0);
          const deposit = Number(d.deposit ?? 0);

          const lotName = d.lotName ?? d.lot ?? `ล็อตที่ ${d.lotId ?? "-"}`;
          const zone = d.zone ?? "-";
          const renter = d.renter ?? d.renterName ?? d.name ?? "-";
          const phone = d.phone ?? d.tel ?? "-";
          const status = d.status ?? "-"; // ✅ จะได้ "อนุมัติ" จาก Firestore
          const note = d.note ?? d.remark ?? "";

          // คำนวณวัน/ยอดรวม
          const days =
            startDate && endDate
              ? 1 +
                Math.round(
                  (new Date(endDate) - new Date(startDate)) /
                    (1000 * 60 * 60 * 24)
                )
              : 0;
          const rentTotal = days * pricePerDay;
          const grandTotal = rentTotal + deposit;

          return {
            id: d.code || d.bookingCode || doc.id,
            lotId: d.lotId ?? null,
            lotName,
            zone,
            renter,
            phone,
            startDate,
            endDate,
            pricePerDay,
            deposit,
            status,
            note,
            days,
            rentTotal,
            grandTotal,
          };
        });
        setRentalsRaw(rows);
        setLoading(false);
      },
      (err) => {
        console.error("bookings onSnapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ---------- filter/search ----------
  useEffect(() => setPage(1), [q, statusFilter]);

  const computedRentals = rentalsRaw; // คำนวณแล้วตอน map ข้างบน

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return computedRentals.filter((r) => {
      const hay = [r.id, r.lotName, r.zone, r.renter, r.phone, r.note]
        .join(" ")
        .toLowerCase();
      const matchQ = !qLower || hay.includes(qLower);
      const matchStatus = !statusFilter || r.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [computedRentals, q, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ---------- view helpers ----------
  const badgeVariant = (status) => {
    switch (status) {
      case "อนุมัติ":
      case "ยืนยันแล้ว":
        return "success";
      case "รอชำระ":
        return "warning";
      case "ยกเลิก":
        return "secondary";
      default:
        return "light";
    }
  };

  // ---------- actions ----------
  const handlePay = (record) => {
  navigate(`/payments/${record.id}`); // ✅ ไปหน้าใหม่พร้อมส่ง booking id
};

  return (
    <>
      <NavbarComponent />

      <Container className="mt-4 mb-5">
        <Card className="shadow-sm border-0">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col xs={12} md={5}>
                <Form.Label>ค้นหา</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="ชื่อผู้เช่า / เบอร์โทร / ล็อต / โซน / หมายเหตุ"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </InputGroup>
              </Col>

              <Col xs={12} md={3}>
                <Form.Label>สถานะ</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">ทั้งหมด</option>
                  <option value="อนุมัติ">อนุมัติ</option>
                  <option value="รอชำระ">รอชำระ</option>
                  <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
                  <option value="ยกเลิก">ยกเลิก</option>
                </Form.Select>
              </Col>

              <Col xs={12} md={2}>
                <Button
                  className="w-100"
                  variant="outline-secondary"
                  onClick={() => {
                    setQ("");
                    setStatusFilter("");
                  }}
                >
                  ล้าง
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="shadow-sm border-0 mt-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="m-0">ผลการค้นหา</h5>
              <small className="text-muted">
                {loading ? (
                  <>
                    กำลังโหลดข้อมูล… <Spinner animation="border" size="sm" />
                  </>
                ) : (
                  <>ทั้งหมด {filtered.length} รายการ • หน้า {page}/{totalPages}</>
                )}
              </small>
            </div>

            <Table hover responsive className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>เลขที่เช่า</th>
                  <th>ล็อต</th>
                  <th>โซน</th>
                  <th>ผู้เช่า</th>
                  <th>ช่วงเช่า</th>
                  <th className="text-end">รวมค่าเช่า</th>
                  <th className="text-center">สถานะ</th>
                  <th className="text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <Spinner animation="border" role="status" />
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      ไม่พบข้อมูลที่ตรงเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  pageItems.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.lotName}</td>
                      <td>{r.zone}</td>
                      <td>
                        <div>{r.renter}</div>
                        <small className="text-muted">{r.phone}</small>
                      </td>
                      <td>
                        {r.startDate} → {r.endDate} ({r.days} วัน)
                      </td>
                      <td className="text-end">
                        {toTHB(r.rentTotal)}{" "}
                        <small className="text-muted">
                          (+มัดจำ {toTHB(r.deposit)})
                        </small>
                      </td>
                      <td className="text-center">
                        <Badge bg={badgeVariant(r.status)}>{r.status}</Badge>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => {
                              setDetail(r);
                              setShowDetail(true);
                            }}
                          >
                            รายละเอียด
                          </Button>

                          {/* ✅ แสดงเฉพาะเมื่อสถานะจาก Firestore เป็น "อนุมัติ" */}
                          {r.status === "อนุมัติ" && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handlePay(r)}
                            >
                              ชำระเงิน
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            {!loading && totalPages > 1 && (
              <div className="d-flex justify-content-center">
                <Pagination className="m-0">
                  <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
                  <Pagination.Prev
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  />
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Pagination.Item
                      key={i + 1}
                      active={i + 1 === page}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Modal รายละเอียด */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>รายละเอียดการเช่า {detail ? `• ${detail.id}` : ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detail && (
            <Row className="g-3">
              <Col md={6}>
                <dl className="row mb-0">
                  <dt className="col-5">ผู้เช่า</dt>
                  <dd className="col-7">{detail.renter}</dd>

                  <dt className="col-5">เบอร์ติดต่อ</dt>
                  <dd className="col-7">{detail.phone}</dd>

                  <dt className="col-5">ล็อต / โซน</dt>
                  <dd className="col-7">
                    {detail.lotName} / {detail.zone}
                  </dd>

                  <dt className="col-5">ช่วงวันที่</dt>
                  <dd className="col-7">
                    {detail.startDate} → {detail.endDate} ({detail.days} วัน)
                  </dd>

                  <dt className="col-5">ราคา/วัน</dt>
                  <dd className="col-7">{toTHB(detail.pricePerDay)}</dd>
                </dl>
              </Col>
              <Col md={6}>
                <dl className="row mb-0">
                  <dt className="col-5">ค่าเช่ารวม</dt>
                  <dd className="col-7">{toTHB(detail.rentTotal)}</dd>

                  <dt className="col-5">มัดจำ</dt>
                  <dd className="col-7">{toTHB(detail.deposit)}</dd>

                  <dt className="col-5">ยอดชำระรวม</dt>
                  <dd className="col-7">{toTHB(detail.grandTotal)}</dd>

                  <dt className="col-5">สถานะ</dt>
                  <dd className="col-7">
                    <Badge bg={badgeVariant(detail.status)}>{detail.status}</Badge>
                  </dd>

                  <dt className="col-5">หมายเหตุ</dt>
                  <dd className="col-7">{detail.note || "-"}</dd>
                </dl>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          {/* ถ้าสถานะเป็นอนุมัติ แสดงปุ่มชำระเงินในโมดอลด้วยก็ได้ */}
          {detail?.status === "อนุมัติ" && (
            <Button variant="success" onClick={() => handlePay(detail)}>
              ชำระเงิน
            </Button>
          )}
          <Button variant="outline-secondary" onClick={() => setShowDetail(false)}>
            ปิด
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
