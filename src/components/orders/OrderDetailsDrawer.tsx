import React, { useState } from "react";
import type { Order } from "./OrderTypes";
import { useOrderDetailsData } from "./orderDetails/useOrderDetailsData";
import { useOrderEvents } from "./orderDetails/useOrderEvents";
import { useOrderStatusActions } from "./orderDetails/useOrderStatusActions";
import { useRiderAssignment } from "./orderDetails/useRiderAssignment";
import OrderStatusHeader from "./orderDetails/OrderStatusHeader";
import CustomerDeliveryCard from "./orderDetails/CustomerDeliveryCard";
import OrderItemsList from "./orderDetails/OrderItemsList";
import PaymentInfoCard from "./orderDetails/PaymentInfoCard";
import RatingsSection from "./orderDetails/RatingsSection";
import InternalTimelineSection from "./orderDetails/InternalTimelineSection";
import RiderAssignmentModal from "./orderDetails/RiderAssignmentModal";

interface Props {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: Partial<Order>) => void;
}

const OrderDetailsDrawer: React.FC<Props> = ({ open, order, onClose, onOrderUpdated }) => {
  // Shared across status/payment/rider-assignment actions — see
  // useOrderStatusActions for why this isn't split per-hook.
  const [loading, setLoading] = useState(false);

  const { orderIdNum, detailsLoading, detailsError, detailsItems, riderRatingData, recipientInfo, productReviewsData } =
    useOrderDetailsData(order, open);
  const {
    orderEvents,
    eventsLoading,
    newEventStage,
    setNewEventStage,
    newEventCustomStage,
    setNewEventCustomStage,
    newEventPerformedBy,
    setNewEventPerformedBy,
    loggingEvent,
    handleLogEvent,
  } = useOrderEvents(orderIdNum, open);
  const {
    statusDropdownOpen,
    setStatusDropdownOpen,
    paymentDropdownOpen,
    setPaymentDropdownOpen,
    selectedStatus,
    selectedPaymentStatus,
    handleUpdateStatus,
    handleUpdatePaymentStatus,
  } = useOrderStatusActions(order, onOrderUpdated, setLoading);
  const {
    riderModalOpen,
    setRiderModalOpen,
    availableRiders,
    ridersLoading,
    selectedRiderId,
    setSelectedRiderId,
    openRiderModal,
    handleAssignRider,
  } = useRiderAssignment(order, onOrderUpdated, setLoading);

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity pointer-events-auto" onClick={onClose} />
      {/* Drawer */}
      <div className="ml-auto w-full max-w-2xl bg-white h-full shadow-xl flex flex-col pointer-events-auto" style={{zIndex: 50}}>
        <OrderStatusHeader
          order={order}
          onClose={onClose}
          loading={loading}
          selectedStatus={selectedStatus}
          selectedPaymentStatus={selectedPaymentStatus}
          statusDropdownOpen={statusDropdownOpen}
          setStatusDropdownOpen={setStatusDropdownOpen}
          paymentDropdownOpen={paymentDropdownOpen}
          setPaymentDropdownOpen={setPaymentDropdownOpen}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePaymentStatus={handleUpdatePaymentStatus}
          onOpenRiderModal={openRiderModal}
        />

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 space-y-6">
            <CustomerDeliveryCard order={order} recipientInfo={recipientInfo} />

            <OrderItemsList items={detailsItems} loading={detailsLoading} error={detailsError} />

            <PaymentInfoCard order={order} selectedPaymentStatus={selectedPaymentStatus} />

            <RatingsSection riderRatingData={riderRatingData} productReviewsData={productReviewsData} />

            <InternalTimelineSection
              eventsLoading={eventsLoading}
              orderEvents={orderEvents}
              newEventStage={newEventStage}
              setNewEventStage={setNewEventStage}
              newEventCustomStage={newEventCustomStage}
              setNewEventCustomStage={setNewEventCustomStage}
              newEventPerformedBy={newEventPerformedBy}
              setNewEventPerformedBy={setNewEventPerformedBy}
              loggingEvent={loggingEvent}
              onLogEvent={handleLogEvent}
            />
          </div>
        </div>

        {/* Rider Assignment Modal */}
        {riderModalOpen && (
          <RiderAssignmentModal
            order={order}
            onClose={() => setRiderModalOpen(false)}
            ridersLoading={ridersLoading}
            availableRiders={availableRiders}
            selectedRiderId={selectedRiderId}
            setSelectedRiderId={setSelectedRiderId}
            loading={loading}
            onAssign={handleAssignRider}
          />
        )}
      </div>
    </div>
  );
};

export default OrderDetailsDrawer;
