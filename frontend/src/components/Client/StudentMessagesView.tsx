import MessagesCenter from "../Messages/MessagesCenter";

/**
 * Student wrapper around the shared MessagesCenter.
 * The shared component already supports student recipients
 * (only their assigned class coordinators), so this is mostly
 * a thin wrapper for routing clarity.
 */
const StudentMessagesView: React.FC = () => {
    return <MessagesCenter />;
};

export default StudentMessagesView;
