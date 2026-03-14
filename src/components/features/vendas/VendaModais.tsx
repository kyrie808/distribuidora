import { Modal, ModalActions, Button, ConfirmDialog } from '@/components/ui'

interface VendaModaisProps {
    showDeleteModal: boolean
    setShowDeleteModal: (val: boolean) => void
    handleDelete: () => void
    isDeleting: boolean
    showRevertModal: boolean
    setShowRevertModal: (val: boolean) => void
    handleRevertDelivery: () => void
    showUndoPaymentConfirm: boolean
    setShowUndoPaymentConfirm: (val: boolean) => void
    handleDesfazerPagamento: () => void
    loadingAction: boolean
}

export function VendaModais({
    showDeleteModal,
    setShowDeleteModal,
    handleDelete,
    isDeleting,
    showRevertModal,
    setShowRevertModal,
    handleRevertDelivery,
    showUndoPaymentConfirm,
    setShowUndoPaymentConfirm,
    handleDesfazerPagamento,
    loadingAction
}: VendaModaisProps) {
    return (
        <>
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Excluir Venda"
                size="sm"
            >
                <p className="text-gray-600 mb-4 dark:text-gray-300">
                    Tem certeza que deseja excluir esta venda?
                    <br />
                    <span className="text-sm text-gray-500">
                        Esta ação não pode ser desfeita.
                    </span>
                </p>
                <ModalActions>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
                        Excluir
                    </Button>
                </ModalActions>
            </Modal>

            <Modal
                isOpen={showRevertModal}
                onClose={() => setShowRevertModal(false)}
                title="Reverter Entrega"
                size="sm"
            >
                <p className="text-gray-600 mb-4 dark:text-gray-300">
                    Deseja desfazer a entrega e marcar esta venda como <strong>Pendente</strong> novamente?
                </p>
                <ModalActions>
                    <Button variant="secondary" onClick={() => setShowRevertModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleRevertDelivery}>
                        Confirmar
                    </Button>
                </ModalActions>
            </Modal>

            <ConfirmDialog
                open={showUndoPaymentConfirm}
                title="Desfazer Pagamento"
                message="Deseja realmente desfazer o último pagamento registrado?"
                confirmLabel="Desfazer"
                variant="danger"
                isLoading={loadingAction}
                onConfirm={handleDesfazerPagamento}
                onCancel={() => setShowUndoPaymentConfirm(false)}
            />
        </>
    )
}
