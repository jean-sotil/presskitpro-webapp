'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useState, useTransition } from 'react';

import {
  deleteAccountAction,
  type DeleteAccountState,
} from './actions';

export interface PrivacyFormsProps {
  /** Current user's email; pre-filled placeholder for the typed-email
   *  confirmation. Server action re-checks against the authenticated
   *  identity — never trust client-side state for the gate. */
  userEmail: string;
}

const INITIAL_DELETE_STATE: DeleteAccountState = { ok: false };

export function PrivacyForms({ userEmail }: PrivacyFormsProps) {
  const t = useTranslations('privacySettings');
  const [exportPending, startExport] = useTransition();
  const [exportQueued, setExportQueued] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAccountAction,
    INITIAL_DELETE_STATE,
  );
  const [confirmEmail, setConfirmEmail] = useState('');

  function onExport() {
    startExport(async () => {
      // PR-B will wire the real export pipeline. For PR-A the click
      // just flips a local "we'll email you" notice so the UX is
      // testable end-to-end.
      await Promise.resolve();
      setExportQueued(true);
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="border border-border bg-surface p-6 md:p-8">
        <h2 className="font-display text-2xl uppercase tracking-tight">
          {t('export.title')}
        </h2>
        <p className="mt-3 text-sm text-text-muted">{t('export.body')}</p>
        <button
          type="button"
          onClick={onExport}
          disabled={exportPending || exportQueued}
          className="mt-6 inline-flex h-10 items-center border border-border bg-transparent px-5 text-xs uppercase tracking-wider text-text hover:bg-bg disabled:opacity-50"
        >
          {t('export.cta')}
        </button>
        {exportQueued ? (
          <p
            role="status"
            className="mt-4 text-xs uppercase tracking-wider text-text-muted"
          >
            {t('export.pending')}
          </p>
        ) : null}
      </section>

      <section className="border border-border bg-surface p-6 md:p-8">
        <h2 className="font-display text-2xl uppercase tracking-tight">
          {t('delete.title')}
        </h2>
        <p className="mt-3 text-sm text-text-muted">{t('delete.body')}</p>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="mt-6 inline-flex h-10 items-center border border-error bg-transparent px-5 text-xs uppercase tracking-wider text-error hover:bg-error hover:text-bg"
        >
          {t('delete.cta')}
        </button>
      </section>

      {deleteOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4"
        >
          <div className="w-full max-w-md border border-border bg-surface p-6 md:p-8">
            <h3
              id="delete-modal-title"
              className="font-display text-xl uppercase tracking-tight"
            >
              {t('delete.confirmTitle')}
            </h3>
            <p className="mt-3 text-sm text-text-muted">
              {t('delete.confirmBody')}
            </p>
            <form
              action={deleteFormAction}
              className="mt-6 flex flex-col gap-3"
            >
              <label className="flex flex-col gap-1 text-xs uppercase tracking-wider text-text-muted">
                {t('delete.confirmInputLabel')}
                <input
                  type="email"
                  name="confirmEmail"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  required
                  placeholder={userEmail}
                  className="border border-border bg-bg px-3 py-2 font-mono text-sm text-text"
                />
              </label>
              {!deleteState.ok && deleteState.reason === 'email-mismatch' ? (
                <p role="alert" className="text-xs text-error">
                  {t('delete.errorEmail')}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={deletePending || confirmEmail.trim() === ''}
                  className="inline-flex h-10 items-center border border-error bg-error px-5 text-xs uppercase tracking-wider text-bg disabled:opacity-50"
                >
                  {t('delete.confirmDestructive')}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  className="inline-flex h-10 items-center border border-border bg-transparent px-5 text-xs uppercase tracking-wider text-text hover:bg-bg"
                >
                  {t('delete.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
