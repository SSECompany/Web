import { Modal } from "antd";
import "./Modal.css";
const showConfirm = ({ title, onOk, onCancel }) => {
    Modal.confirm({
        title: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
            </div>
        ),
        okText: 'Xác nhận',
        cancelText: 'Huỷ',
        okButtonProps: { style: { backgroundColor: '#1677ff', borderColor: '#1677ff', width: 100 } },
        cancelButtonProps: { style: { borderColor: '#d9d9d9', width: 100 } },
        centered: true,
        className: 'centered-buttons fixed-height',
        onOk,
        onCancel,
    });
};

export default showConfirm;