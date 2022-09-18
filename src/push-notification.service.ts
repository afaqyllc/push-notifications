import { Injectable } from '@nestjs/common';
import fcmAdmin = require('firebase-admin');
import { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class PushNotificationService {
  async send(
    title: string,
    body: string,
    deviceTokens: string[],
  ): Promise<any> {
    const messaging = fcmAdmin.messaging();
    const payload: MulticastMessage = {
      tokens: deviceTokens,
      notification: {
        title,
        body,
      },
      android: {
        notification: {
          sound: 'default',
          defaultSound: true,
          priority: 'high',
          visibility: 'public',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };
    return messaging.sendMulticast(payload);
  }

  async sendExpo(notifications: ExpoPushMessage[]): Promise<any> {
    const expo = new Expo();
    const messages: ExpoPushMessage[] = [];
    for (const notification of notifications) {
      if (!Expo.isExpoPushToken(notification.to)) {
        console.error(
          `Push token ${notification.to} is not a valid Expo push token`,
        );
        continue;
      }
      messages.push({
        to: notification.to,
        sound: 'default',
        body: notification.body,
        title: notification.title,
      });
    }
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    chunks?.map(async (chunk) => {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log({ ticketChunk });
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    });

    const receiptIds = [];
    tickets.map((ticket) => {
      if (ticket.id) {
        receiptIds.push(ticket.id);
      }
    });

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    const receipts = receiptIdChunks.map(async (chunk) => {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        console.log({ receipts });
        return receipts.length;
      } catch (error) {
        console.error(error);
      }
    });
    return {
      messages: messages?.length ?? 0,
      chunks: chunks?.length ?? 0,
      tickets: tickets?.length ?? 0,
      receipts: receipts?.length ?? 0,
    };
  }
}
