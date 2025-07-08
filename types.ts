export type MessagePayload = {
    message_id: string;
    room_id?: string;
    thread_id?: string;
    content_type: string;
    content: string;
    metadata?: object;
};

export type Message = {
    message_id: string;
    room_id?: string;
    thread_id?: string;
    sender_id: string;
    content_type: string;
    content: string;
    metadata?: object;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

export const UserStatuses = [
    "online",
    "offline",
    "away",
    "do_not_disturb",
] as const;
export type UserStatus = (typeof UserStatuses)[number];
