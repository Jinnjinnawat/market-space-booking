// src/components/Login.jsx
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Container, Form, InputGroup, Row, Alert } from 'react-bootstrap';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../service/Firebase';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import LogoutButton from '../componnets/LogoutButton';
import NavbarComponent from '../componnets/Navbar';

function mapFirebaseError(code) {
  const map = {
    'auth/invalid-email': 'อีเมลไม่ถูกต้อง',
    'auth/missing-password': 'กรุณากรอกรหัสผ่าน',
    'auth/user-not-found': 'ไม่พบบัญชีผู้ใช้',
    'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
    'auth/too-many-requests': 'พยายามหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง',
    'auth/popup-closed-by-user': 'ปิดหน้าต่างก่อนลงชื่อเข้าใช้',
  };
  return map[code] || 'เกิดข้อผิดพลาด ไม่สามารถลงชื่อเข้าใช้ได้';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // path ที่มาจาก ProtectedRoute (ถ้ามี)
  const from = location.state?.from?.pathname;

  // ใช้ redirectTo เฉพาะกรณี email/password เท่านั้น
  const redirectTo = useMemo(
    () => from || '/lots',
    [from]
  );

  // ถ้ามี user อยู่แล้ว ให้ redirect กลับไปยัง 'from' เท่านั้น (กันการทับ /home ของ Google)
  useEffect(() => {
    if (user && from) {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

  async function handleEmailLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // อีเมล/พาสเวิร์ด: ไปยัง redirectTo (from หรือ /AdminDashboard)
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(mapFirebaseError(err.code));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setSubmitting(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      // Google: บังคับไปหน้า /home ตามที่ต้องการ
      navigate('/home', { replace: true });
    } catch (err) {
      setError(mapFirebaseError(err.code));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <NavbarComponent />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="shadow-lg border-0 rounded-4">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-3">
                  <h3 className="fw-bold mb-1">เข้าสู่ระบบ</h3>
                  <div className="text-muted">ระบบเช่าพื้นที่ตลาด</div>
                </div>

                {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

                <Form onSubmit={handleEmailLogin}>
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>อีเมล</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>รหัสผ่าน</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowPassword((v) => !v)}
                        type="button"
                      >
                        {showPassword ? 'ซ่อน' : 'แสดง'}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <div className="d-grid gap-2 mt-3">
                    <Button type="submit" disabled={submitting} className="rounded-3" size="lg">
                      {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </Button>
                    <Button
                      variant="outline-dark"
                      onClick={handleGoogleLogin}
                      disabled={submitting}
                      className="rounded-3"
                    >
                      ลงชื่อเข้าใช้ด้วย Google
                    </Button>
                  </div>
                </Form>

                <div className="text-center mt-3">
                  <small className="text-muted">
                    ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
                  </small>
                </div>
              </Card.Body>
            </Card>

            {user && (
              <div className="mt-3">
                <LogoutButton className="w-100 rounded-3" size="lg" />
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}
