import { v4 as uuidv4 } from 'uuid';

const generateId = (prefix: string): string => `${prefix}-${uuidv4()}`;

/** Generic ID generator for use in new feature sections. */
export { generateId };

export const messageId = () => generateId('msg');
export const threadId = () => generateId('thr');
export const eventId = () => generateId('evt');
export const expenseId = () => generateId('exp');
export const shoppingItemId = () => generateId('item');
export const taskId = () => generateId('task');
export const mealPlanId = () => generateId('meal');
export const handoverId = () => generateId('hov');
export const notificationId = () => generateId('notif');
export const transferId = () => generateId('xfr');
export const milestoneId = () => generateId('ms');
export const documentId = () => generateId('doc');
export const checklistItemId = () => generateId('chk');
export const meetingMinutesId = () => generateId('mm');
export const decisionId = () => generateId('dec');
export const agreementId = () => generateId('agr');
export const nextStepId = () => generateId('ns');
export const attendeeId = () => generateId('att');
export const attachmentId = () => generateId('att');
export const calendarSourceId = () => generateId('cal');
export const childId = () => generateId('child');
export const userId = () => generateId('user');
export const institutionId = () => generateId('inst');
export const custodyPlanId = () => generateId('cp');
export const paymentAccountId = () => generateId('pay');
export const emergencyContactId = () => generateId('ec');
export const holidayId = () => generateId('hol');
export const specialDayId = () => generateId('sd');
export const templateId = () => generateId('tpl');
export const photoId = () => generateId('photo');
export const diaryEntryId = () => generateId('diary');
export const keyDateId = () => generateId('kd');
