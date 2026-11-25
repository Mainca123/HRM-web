import React, { useEffect, useState } from 'react';
import { Check, XCircle, RefreshCw, X } from 'lucide-react';
import { apiClient, extractErrorMessage } from '../api/client';
import {
  ApiResponse,
  LeaveRequestDto,
  OvertimeRequestDto,
  PagedResult,
  RegisterLateEarlyDto,
} from '../types/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';

export function ApprovalsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'leave' | 'ot' | 'explain'>('leave');
  const [leaves, setLeaves] = useState<LeaveRequestDto[]>([]);
  const [ots, setOts] = useState<OvertimeRequestDto[]>([]);
  const [explains, setExplains] = useState<RegisterLateEarlyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const [actionModal, setActionModal] = useState<{
    kind: 'leave' | 'ot' | 'explain';
    action: 'approve' | 'reject';
    item: LeaveRequestDto | OvertimeRequestDto | RegisterLateEarlyDto;
    label: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('Không phù hợp kế hoạch công tác');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [lRes, oRes, eRes] = await Promise.all([
        apiClient.get<ApiResponse<PagedResult<LeaveRequestDto>>>('/api/leave-requests', {
          params: { pageIndex: 1, pageSize: 100 },
        }),
        apiClient.get<ApiResponse<PagedResult<OvertimeRequestDto>>>('/api/overtime/requests', {
          params: { pageIndex: 1, pageSize: 100 },
        }),
        apiClient.get<ApiResponse<PagedResult<RegisterLateEarlyDto>>>('/api/attendance/explain-late-early', {
          params: { pageIndex: 1, pageSize: 100 },
        }),
      ]);
      const selfId = user?.employeeId;
      setLeaves(
        (lRes.data.data?.items || []).filter((i) => (i.status == null || i.status === 0) && i.employeeId !== selfId)
      );
      setOts(
        (oRes.data.data?.items || []).filter((i) => !i.modifiedUserName && i.employeeId !== selfId)
      );
      setExplains(
        (eRes.data.data?.items || []).filter((i) => !i.modifiedUserName && i.employeeId !== selfId)
      );
    } catch (err) {
      setFeedback({ type: 'err', msg: extractErrorMessage(err, 'Không tải được danh sách đơn chờ duyệt.') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const executeAction = async () => {
    if (!actionModal) return;
    setSaving(true);
    try {
      const { kind, action, item } = actionModal;
      if (kind === 'leave') {
        const lv = item as LeaveRequestDto;
        if (action === 'approve') {
          await apiClient.post('/api/leave-requests/approve', {
            employeeId: lv.employeeId,
            fromDate: lv.fromDate,
            absenceId: lv.absenceId,
          });
        } else {
          await apiClient.post('/api/leave-requests/reject', {
            employeeId: lv.employeeId,
            fromDate: lv.fromDate,
            absenceId: lv.absenceId,
            rejectReason: rejectReason.trim() || 'Không phù hợp kế hoạch công tác',
          });
        }
      } else if (kind === 'ot') {
        const ot = item as OvertimeRequestDto;
        if (action === 'approve') {
          await apiClient.put('/api/overtime/requests', {
            employeeId: ot.employeeId,
            fromDate: ot.fromDate.slice(0, 10),
            type: ot.type,
            value: ot.value || 1,
          });
        } else {
          await apiClient.delete('/api/overtime/requests', {
            params: { employeeId: ot.employeeId, fromDate: ot.fromDate.slice(0, 10), type: ot.type },
          });
        }
      } else {
        const ex = item as RegisterLateEarlyDto;
        if (action === 'approve') {
          await apiClient.put('/api/attendance/explain-late-early/approve', {
            employeeId: ex.employeeId,
            fromDate: ex.fromDate.slice(0, 10),
            type: ex.type,
          });
        } else {
          await apiClient.delete('/api/attendance/explain-late-early', {
            params: { employeeId: ex.employeeId, fromDate: ex.fromDate.slice(0, 10), type: ex.type },
          });
        }
      }

      setFeedback({
        type: 'ok',
        msg: `${action === 'approve' ? 'Đã phê duyệt' : 'Đã từ chối'} đơn của ${actionModal.label}.`,
      });
      setActionModal(null);
      loadAll();
    } catch (err) {
      setFeedback({ type: 'err', msg: extractErrorMessage(err, 'Thao tác thất bại.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Phê duyệt đơn từ tập trung</h1>
          <p className="mt-1 text-sm text-slate-500">Xử lý toàn bộ đơn Nghỉ phép, Tăng ca (OT) và Giải trình chờ duyệt</p>
        </div>
        <button
          onClick={loadAll}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-sm ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab('leave')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === 'leave' ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600'
          }`}
        >
          Nghỉ phép ({leaves.length})
        </button>
        <button
          onClick={() => setTab('ot')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === 'ot' ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600'
          }`}
        >
          Tăng ca OT ({ots.length})
        </button>
        <button
          onClick={() => setTab('explain')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === 'explain' ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600'
          }`}
        >
          Giải trình ({explains.length})
        </button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
          Đang tải danh sách đơn chờ duyệt...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tab === 'leave' &&
            (leaves.length === 0 ? (
              <EmptyBox text="Không có đơn nghỉ phép nào đang chờ duyệt" />
            ) : (
              leaves.map((lv, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{lv.employeeFullName || `NV #${lv.employeeId}`}</div>
                      <div className="text-xs text-slate-500">
                        {lv.employeeCode} · {lv.departmentName || '—'}
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      Chờ duyệt
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-slate-700">
                    <span className="font-semibold">{lv.absenceName || lv.absenceId}</span> · {lv.fromDate.slice(0, 10)} →{' '}
                    {(lv.toDate || lv.fromDate).slice(0, 10)} ({lv.unit ?? 1} ngày)
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Lý do: {lv.notes || 'Không có ghi chú'}</div>
                  <div className="mt-4 flex gap-2.5">
                    <button
                      onClick={() =>
                        setActionModal({
                          kind: 'leave',
                          action: 'reject',
                          item: lv,
                          label: lv.employeeFullName || `NV #${lv.employeeId}`,
                        })
                      }
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" /> Từ chối
                    </button>
                    <button
                      onClick={() =>
                        setActionModal({
                          kind: 'leave',
                          action: 'approve',
                          item: lv,
                          label: lv.employeeFullName || `NV #${lv.employeeId}`,
                        })
                      }
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4" /> Phê duyệt
                    </button>
                  </div>
                </div>
              ))
            ))}

          {tab === 'ot' &&
            (ots.length === 0 ? (
              <EmptyBox text="Không có đơn tăng ca (OT) nào đang chờ duyệt" />
            ) : (
              ots.map((ot, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{ot.employeeFullName}</div>
                      <div className="text-xs text-slate-500">
                        {ot.employeeCode} · {ot.departmentName || '—'}
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      OT{ot.type}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-slate-700">
                    Ngày <span className="font-semibold">{ot.fromDate.slice(0, 10)}</span> ·{' '}
                    <span className="font-bold text-blue-700">{ot.value ?? 0} giờ</span>
                  </div>
                  <div className="mt-4 flex gap-2.5">
                    <button
                      onClick={() =>
                        setActionModal({ kind: 'ot', action: 'reject', item: ot, label: ot.employeeFullName })
                      }
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" /> Từ chối
                    </button>
                    <button
                      onClick={() =>
                        setActionModal({ kind: 'ot', action: 'approve', item: ot, label: ot.employeeFullName })
                      }
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4" /> Xác nhận
                    </button>
                  </div>
                </div>
              ))
            ))}

          {tab === 'explain' &&
            (explains.length === 0 ? (
              <EmptyBox text="Không có đơn giải trình nào đang chờ duyệt" />
            ) : (
              explains.map((ex, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{ex.employeeFullName}</div>
                      <div className="text-xs text-slate-500">
                        {ex.employeeCode} · {ex.departmentName || '—'}
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {ex.typeName || (ex.type ? 'Về sớm' : 'Đi muộn')}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-slate-700">Ngày {ex.fromDate.slice(0, 10)}</div>
                  <div className="mt-1 text-xs text-slate-500">Lý do: {ex.reason || 'Không có lý do'}</div>
                  <div className="mt-4 flex gap-2.5">
                    <button
                      onClick={() =>
                        setActionModal({ kind: 'explain', action: 'reject', item: ex, label: ex.employeeFullName })
                      }
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" /> Từ chối
                    </button>
                    <button
                      onClick={() =>
                        setActionModal({ kind: 'explain', action: 'approve', item: ex, label: ex.employeeFullName })
                      }
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4" /> Phê duyệt
                    </button>
                  </div>
                </div>
              ))
            ))}
        </div>
      )}

      <ConfirmModal
        open={!!actionModal}
        title={actionModal?.action === 'approve' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối đơn'}
        message={`Bạn có chắc chắn muốn ${
          actionModal?.action === 'approve' ? 'phê duyệt' : 'từ chối'
        } đơn của ${actionModal?.label}?`}
        confirmText={actionModal?.action === 'approve' ? 'Phê duyệt' : 'Từ chối'}
        tone={actionModal?.action === 'approve' ? 'primary' : 'danger'}
        loading={saving}
        onClose={() => setActionModal(null)}
        onConfirm={executeAction}
      >
        {actionModal?.kind === 'leave' && actionModal.action === 'reject' && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Lý do từ chối</label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}
