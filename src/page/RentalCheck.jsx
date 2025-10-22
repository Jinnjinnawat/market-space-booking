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
} from "react-bootstrap";
import NavbarComponent from "../componnets/Navbar"; // แก้เป็น ../components/Navbar ถ้าโฟลเดอร์คุณสะกดถูก

export default function RentalCheck() {
  // ---------- ตัวอย่างข้อมูลการเช่า ----------
  const [rentals, setRentals] = useState([
    {
      id: "BK-0001",
      lotId: 1,
      lotName: "ล็อตที่ 1",
      zone: "A",
      renter: "สมชาย ใจดี",
      phone: "081-234-5678",
      startDate: "2025-10-24",
      endDate: "2025-10-26",
      pricePerDay: 300,
      deposit: 500,
      status: "ยืนยันแล้ว", // ยืนยันแล้ว | รอชำระ | ยกเลิก
      note: "ขายของกิน",
    },
    {
      id: "BK-0002",
      lotId: 3,
      lotName: "ล็อตที่ 3",
      zone: "A",
      renter: "กนกวรรณ สายชล",
      phone: "089-000-1122",
      startDate: "2025-10-22",
      endDate: "2025-10-22",
      pricePerDay: 280,
      deposit: 500,
      status: "รอชำระ",
      note: "ขายเสื้อผ้า",
    },
    {
      id: "BK-0003",
      lotId: 5,
      lotName: "ล็อตที่ 5",
      zone: "B",
      renter: "วีรชน แสงทอง",
      phone: "086-555-4444",
      startDate: "2025-10-27",
      endDate: "2025-10-29",
      pricePerDay: 350,
      deposit: 500,
      status: "ยกเลิก",
      note: "เครื่องประดับ",
    },
  ]);

  // ---------- states สำหรับค้นหา/กรอง/เพจิเนชัน ----------
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // ---------- Modal รายละเอียด ----------
  const [detail, setDetail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const openDetail = (item) => {
    setDetail(item);
    setShowDetail(true);
  };
  const closeDetail = () => setShowDetail(false);

  // ---------- คำนวณผลรวม ----------
  const toTHB = (n) =>
    n?.toLocaleString("th-TH", { style: "currency", currency: "THB" });

  const withComputed = useMemo(
    () =>
      rentals.map((r) => {
        const nights =
          1 +
          Math.round(
            (new Date(r.endDate) - new Date(r.startDate)) / (1000 * 60 * 60 * 24)
          );
        const rentTotal = nights * r.pricePerDay;
        const grandTotal = rentTotal + (r.deposit || 0);
        return { ...r, nights, rentTotal, grandTotal };
      }),
    [rentals]
  );

  // ---------- ฟังก์ชันกรอง ----------
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return withComputed.filter((r) => {
      const matchQ =
        !qLower ||
        [r.id, r.lotName, r.zone, r.renter, r.phone, r.note]
          .join(" ")
          .toLowerCase()
          .includes(qLower);

      const matchStatus = !statusFilter || r.status === statusFilter;

      const inRange =
        (!dateFrom || new Date(r.startDate) >= new Date(dateFrom)) &&
        (!dateTo || new Date(r.endDate) <= new Date(dateTo));

      return matchQ && matchStatus && inRange;
    });
  }, [withComputed, q, statusFilter, dateFrom, dateTo]);

  // ---------- รีเซ็ตหน้าเมื่อมีการค้นหา/กรอง ----------
  useEffect(() => setPage(1), [q, statusFilter, dateFrom, dateTo]);

  // ---------- เพจิเนชัน ----------
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const badgeVariant = (status) =>
    status === "ยืนยันแล้ว" ? "success" : status === "รอชำระ" ? "warning" : "secondary";

  return (
    <>
      <NavbarComponent />

      <Container className="mt-4 mb-5">
        <Card className="shadow-sm border-0">
          <Card.Body>
            <Row className="g-3 align-items-end">
              <Col xs={12} md={4}>
                <Form.Label>ค้นหา</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="ชื่อผู้เช่า / เบอร์ / เลขที่เช่า / ล็อต / โซน / หมายเหตุ"
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
                  <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
                  <option value="รอชำระ">รอชำระ</option>
                  <option value="ยกเลิก">ยกเลิก</option>
                </Form.Select>
              </Col>

              <Col xs={6} md={2}>
                <Form.Label>ตั้งแต่วันที่</Form.Label>
                <Form.Control
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </Col>

              <Col xs={6} md={2}>
                <Form.Label>ถึงวันที่</Form.Label>
                <Form.Control
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </Col>

              <Col xs={12} md={1}>
                <Button
                  className="w-100"
                  variant="outline-secondary"
                  onClick={() => {
                    setQ("");
                    setStatusFilter("");
                    setDateFrom("");
                    setDateTo("");
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
                ทั้งหมด {filtered.length} รายการ • หน้า {page}/{totalPages}
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
                {pageItems.length === 0 ? (
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
                        {r.startDate} → {r.endDate} ({r.nights} วัน)
                      </td>
                      <td className="text-end">
                        {toTHB(r.rentTotal)}{" "}
                        <small className="text-muted">(+มัดจำ {toTHB(r.deposit)})</small>
                      </td>
                      <td className="text-center">
                        <Badge bg={badgeVariant(r.status)}>{r.status}</Badge>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => openDetail(r)}
                          >
                            รายละเอียด
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            disabled={r.status === "ยกเลิก"}
                            onClick={() =>
                              setRentals((prev) =>
                                prev.map((x) =>
                                  x.id === r.id ? { ...x, status: "ยกเลิก" } : x
                                )
                              )
                            }
                          >
                            ยกเลิก
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            {totalPages > 1 && (
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
      <Modal show={showDetail} onHide={closeDetail} centered size="lg">
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
                    {detail.startDate} → {detail.endDate} ({detail.nights} วัน)
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
          <Button variant="outline-secondary" onClick={closeDetail}>
            ปิด
          </Button>
          {detail?.status !== "ยกเลิก" && (
            <Button
              variant="outline-danger"
              onClick={() => {
                setRentals((prev) =>
                  prev.map((x) => (x.id === detail.id ? { ...x, status: "ยกเลิก" } : x))
                );
                closeDetail();
              }}
            >
              ยกเลิกการเช่า
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
}
