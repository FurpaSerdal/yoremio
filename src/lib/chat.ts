"use client";

import * as signalR from "@microsoft/signalr";

import { API_BASE_URL, type ChatMessageDto, type NotificationDto } from "@/lib/api";

export type { ChatMessageDto, NotificationDto };

export function createChatConnection(getToken: () => string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE_URL}/chathub`, {
      accessTokenFactory: getToken,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

export function bindChatEvents(
  connection: signalR.HubConnection,
  handlers: {
    onConnected?: (userId: string) => void;
    onReceive?: (message: ChatMessageDto) => void;
    onSent?: (message: ChatMessageDto) => void;
    onRead?: (readerUserId: string, readAtUtc: string) => void;
    onConversationRead?: (otherUserId: string, markedCount: number, readAtUtc: string) => void;
    onTyping?: (fromUserId: string) => void;
    onNotification?: (notification: NotificationDto) => void;
    onUnreadNotifications?: (count: number) => void;
  },
) {
  if (handlers.onConnected) {
    connection.on("Connected", handlers.onConnected);
  }
  if (handlers.onReceive) {
    connection.on("ReceiveMessageV2", handlers.onReceive);
  }
  if (handlers.onSent) {
    connection.on("MessageSentV2", handlers.onSent);
  }
  if (handlers.onRead) {
    connection.on("MessagesRead", handlers.onRead);
  }
  if (handlers.onConversationRead) {
    connection.on("ConversationRead", handlers.onConversationRead);
  }
  if (handlers.onTyping) {
    connection.on("Typing", handlers.onTyping);
  }
  if (handlers.onNotification) {
    connection.on("NotificationReceived", handlers.onNotification);
  }
  if (handlers.onUnreadNotifications) {
    connection.on("UnreadNotificationCountUpdated", handlers.onUnreadNotifications);
  }

  return () => {
    connection.off("Connected");
    connection.off("ReceiveMessageV2");
    connection.off("MessageSentV2");
    connection.off("MessagesRead");
    connection.off("ConversationRead");
    connection.off("Typing");
    connection.off("NotificationReceived");
    connection.off("UnreadNotificationCountUpdated");
  };
}
