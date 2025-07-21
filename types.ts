export type MessagePayload = {
    message_id: string;
    room_id?: string;
    thread_id?: string;
    content_type: "text" | "image" | "video" | "file";
    content: string;
    metadata?: object;
    attachments?: MessageAttachment[];
};

export type Message = {
    message_id: string;
    room_id?: string;
    thread_id?: string;
    sender_id: string;
    content_type: "text" | "image" | "video" | "file";
    content: string;
    metadata?: object;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    attachments?: MessageAttachment[];
};

export type MessageAttachment = {
    file_url: string;
    file_key: string;
    file_size: number;
    filename: string;
};

export const UserStatuses = [
    "online",
    "offline",
    "away",
    "do_not_disturb",
] as const;
export type UserStatus = (typeof UserStatuses)[number];
