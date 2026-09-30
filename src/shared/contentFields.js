/**
 * @file Canonical list of the content pieces WishReach generates per client.
 * Shared between the main process (prompt routing, stats) and the renderer
 * (tab labels) so the two never drift apart.
 */

export const CONTENT_FIELDS = Object.freeze([
  { key: 'coldEmail', label: 'Cold Email', kind: 'email' },
  { key: 'linkedinConnection', label: 'LinkedIn Request', kind: 'linkedin' },
  { key: 'linkedinDm', label: 'LinkedIn DM', kind: 'linkedin' },
  { key: 'followUp1', label: 'Follow-up 1', kind: 'email' },
  { key: 'followUp2', label: 'Follow-up 2', kind: 'email' },
  { key: 'breakUp', label: 'Break-up', kind: 'email' },
  { key: 'meetingInvite', label: 'Meeting Invite', kind: 'email' },
  { key: 'subjectLines', label: 'Subject Lines', kind: 'text' },
  { key: 'icebreakers', label: 'Hooks & Icebreakers', kind: 'text' },
]);
