import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

function DeleteConfirmModal() {
  return (
    <div
      className="modal show"
      style={{ display: 'block', position: 'initial' }}
    >
      <Modal.Dialog>
        <Modal.Header closeButton>
          <Modal.Title>ต้องการลบข้อมูลหรือไม่</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary">ยกเลิก</Button>
          <Button variant="danger">ลบข้อมูล</Button>
        </Modal.Footer>
      </Modal.Dialog>
    </div>
  );
}

export default DeleteConfirmModal;
