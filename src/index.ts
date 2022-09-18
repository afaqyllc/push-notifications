export * from './push-notification.module';
export * from './push-notification.service';

export interface NotificationInterface {
  title: string;
  body: string;
  token: string;
}
