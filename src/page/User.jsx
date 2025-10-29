// src/page/PaymentsPage.jsx  (หรือเปลี่ยนชื่อเป็น UserProfilePage.jsx ก็ได้)
import { useEffect, useState } from "react";
import { Card, Col, Container, Row, Spinner, Badge, Button } from "react-bootstrap";
import AdminSidebar from "../componnets/AdminSideBar";
import { useAuth } from "../context/AuthProvider";
import { auth } from "../service/Firebase";

const SIDEBAR_WIDTH = 260;

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [claims, setClaims] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!user) {
        setClaims(null);
        return;
      }
      const idTokenResult = await user.getIdTokenResult();
      setClaims(idTokenResult.claims || {});
    };
    run();
  }, [user]);

  const refreshToken = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      await user.getIdToken(true); // force refresh
      const res = await user.getIdTokenResult();
      setClaims(res.claims || {});
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <div className="admin-shell" style={{ paddingLeft: SIDEBAR_WIDTH, minHeight: "100vh" }}>
        <AdminSidebar />
        <Container fluid className="py-4">
          <Row className="mb-3">
            <Col><h4 className="fw-bold">ข้อมูลผู้ใช้งาน (Firebase Authentication)</h4></Col>
          </Row>

          <Card className="shadow-sm">
            <Card.Body>
              {authLoading ? (
                <div className="py-5 text-center"><Spinner animation="border" /></div>
              ) : !user ? (
                <div className="py-4 text-muted">ยังไม่ได้เข้าสู่ระบบ</div>
              ) : (
                <Row className="g-4">
                  <Col md="auto" className="d-flex align-items-start">
                    <img
                      src={user.photoURL || "https://via.placeholder.com/96"}
                      alt="profile"
                      style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }}
                    />
                  </Col>
                  <Col>
                    <h5 className="mb-1">{user.displayName || user.email || "ผู้ใช้"}</h5>
                    <div className="text-muted small mb-2">UID: {user.uid}</div>

                    <Row className="gy-2">
                      <Col sm={6}>
                        <div><strong>อีเมล:</strong> {user.email || "-"}</div>
                        <div><strong>ยืนยันอีเมล:</strong> {user.emailVerified ? "✔️ Verified" : "❌ ยังไม่ยืนยัน"}</div>
                        {user.phoneNumber && <div><strong>เบอร์โทร:</strong> {user.phoneNumber}</div>}
                      </Col>
                      <Col sm={6}>
                        <div><strong>สร้างบัญชีเมื่อ:</strong> {user.metadata?.creationTime || "-"}</div>
                        <div><strong>ลงชื่อเข้าล่าสุด:</strong> {user.metadata?.lastSignInTime || "-"}</div>
                      </Col>
                    </Row>

                    <div className="mt-3">
                      <strong>ผู้ให้บริการ (providers):</strong>{" "}
                      {user.providerData?.length
                        ? user.providerData.map((p) => (
                            <Badge key={p.providerId} bg="secondary" className="me-2">
                              {p.providerId}
                            </Badge>
                          ))
                        : <span className="text-muted">-</span>}
                    </div>

                    <div className="mt-3">
                      <strong>Custom Claims (ถ้ามี):</strong>{" "}
                      {claims && Object.keys(claims).length ? (
                        <code className="d-inline-block bg-light p-2 rounded">
                          {JSON.stringify(claims)}
                        </code>
                      ) : (
                        <span className="text-muted">ไม่มี</span>
                      )}
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="ms-2"
                        disabled={refreshing}
                        onClick={refreshToken}
                      >
                        {refreshing ? "กำลังรีเฟรช..." : "รีเฟรชโทเคน"}
                      </Button>
                    </div>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      <style>{`
        @media (max-width: 991.98px) {
          .admin-shell { padding-left: 0 !important; }
        }
      `}</style>
    </>
  );
}
