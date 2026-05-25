-- Extend actions.status with `cancelled` so an operator rejecting a
-- review item can mark the linked pending actions cancelled (preserving
-- the audit trail of what would have been executed) instead of deleting
-- them. Spec §6 + decision #3 from the plan's upfront clarifications.

alter table public.actions
  drop constraint actions_status_check;

alter table public.actions
  add constraint actions_status_check
  check (status in ('pending', 'executing', 'completed', 'failed', 'cancelled'));
