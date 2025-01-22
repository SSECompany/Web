import { WarningOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';

const CustomConfirmModal = ({
    visible,
    title,
    content,
    onConfirm,
    onCancel,
    confirmText = 'Xóa',
    cancelText = 'Hủy',
}) => {
    return (
        <Modal
            centered
            visible={visible}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <WarningOutlined style={{ color: 'red', fontSize: 20 }} />
                    <span>{title || 'Xác nhận hành động'}</span>
                </div>
            }
            footer={[
                <Button key="cancel" onClick={onCancel} style={{ fontWeight: 'bold' }}>
                    {cancelText}
                </Button>,
                <Button
                    key="confirm"
                    type="primary"
                    danger
                    onClick={onConfirm}
                    style={{ fontWeight: 'bold' }}
                >
                    {confirmText}
                </Button>,
            ]}
            onCancel={onCancel}
        >
            <div style={{ fontSize: '14px', color: '#595959' }}>{content || 'Bạn có chắc chắn muốn thực hiện hành động này không?'}</div>
        </Modal>
    );
};

export default CustomConfirmModal;
