import {
  FlowRetryStrategy,
  FlowRun,
  FlowRunStatus,
  isFailedState,
  Permission,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, PlayIcon, Redo, RotateCw, ChevronDown } from 'lucide-react';
import { useMemo, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useNewWindow } from '../../../components/embed-provider';
import { TableTitle } from '../../../components/ui/table-title';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
  DataTable,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageTooltip } from '@/components/ui/message-tooltip';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';

type SelectedRow = {
  id: string;
  status: FlowRunStatus;
};

const FlowRunsPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedRowIds, setSelectedRowIds] = useState<Array<SelectedRow>>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['flow-run-table', searchParams.toString()],
    staleTime: 0,
    gcTime: 0,
    queryFn: () => {
      const status = searchParams.getAll('status') as FlowRunStatus[];
      const flowId = searchParams.getAll('flowId');
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM)
        ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
        : 10;
      const createdAfter = searchParams.get('createdAfter');
      const createdBefore = searchParams.get('createdBefore');

      return flowRunsApi.list({
        status: status ? status.map((s) => s as FlowRunStatus) : undefined,
        projectId: authenticationSession.getProjectId()!,
        flowId,
        cursor: cursor ?? undefined,
        limit,
        createdAfter: createdAfter ?? undefined,
        createdBefore: createdBefore ?? undefined,
      });
    },
  });

  const navigate = useNavigate();
  const { data: flowsData, isFetching: isFetchingFlows } = flowsHooks.useFlows({
    limit: 1000,
    cursor: undefined,
  });
  const openNewWindow = useNewWindow();
  const flows = flowsData?.data;
  const { checkAccess } = useAuthorization();
  const userHasPermissionToRetryRun = checkAccess(Permission.RETRY_RUN);

  const columns: ColumnDef<RowDataWithActions<FlowRun>>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => {
            const isChecked = !!value;
            table.toggleAllPageRowsSelected(isChecked);
            console.log('isChecked', isChecked);

            if (isChecked) {
              const allRowIds = table.getRowModel().rows.map((row) => ({
                id: row.original.id,
                status: row.original.status,
              }));

              const newSelectedRowIds = [...allRowIds, ...selectedRowIds];

              const uniqueRowIds = Array.from(
                new Map(
                  newSelectedRowIds.map((item) => [item.id, item]),
                ).values(),
              );

              setSelectedRowIds(uniqueRowIds);
            } else {
              const filteredRowIds = selectedRowIds.filter((row) => {
                return !table
                  .getRowModel()
                  .rows.some((r) => r.original.id === row.id);
              });
              setSelectedRowIds(filteredRowIds);
            }
          }}
        />
      ),
      cell: ({ row }) => {
        const isChecked = selectedRowIds.some(
          (selectedRow) =>
            selectedRow.id === row.original.id &&
            selectedRow.status === row.original.status,
        );
        return (
          <Checkbox
            checked={isChecked}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              let newSelectedRowIds = [...selectedRowIds];
              if (isChecked) {
                const exists = newSelectedRowIds.some(
                  (selectedRow) =>
                    selectedRow.id === row.original.id &&
                    selectedRow.status === row.original.status,
                );
                if (!exists) {
                  newSelectedRowIds.push({
                    id: row.original.id,
                    status: row.original.status,
                  });
                }
              } else {
                newSelectedRowIds = newSelectedRowIds.filter(
                  (selectedRow) => selectedRow.id !== row.original.id,
                );
              }
              setSelectedRowIds(newSelectedRowIds);
              row.toggleSelected(!!value);
            }}
          />
        );
      },
    },
    {
      accessorKey: 'flowId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Flow')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.flowDisplayName}</div>;
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Status')} />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const { variant, Icon } = flowRunUtils.getStatusIcon(status);
        return (
          <div className="text-left">
            <StatusIconWithText
              icon={Icon}
              text={formatUtils.convertEnumToHumanReadable(status)}
              variant={variant}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Start Time')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {formatUtils.formatDate(new Date(row.original.startTime))}
          </div>
        );
      },
    },
    {
      accessorKey: 'duration',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Duration')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {row.original.finishTime &&
              formatUtils.formatDuration(row.original.duration)}
          </div>
        );
      },
    },
  ];

  const filters = useMemo(
    () => [
      {
        type: 'select',
        title: t('Flow name'),
        accessorKey: 'flowId',
        options:
          flows?.map((flow) => ({
            label: flow.version.displayName,
            value: flow.id,
          })) || [],
        icon: CheckIcon,
      } as const,
      {
        type: 'select',
        title: t('Status'),
        accessorKey: 'status',
        options: Object.values(FlowRunStatus)
          .filter((status) => status !== FlowRunStatus.STOPPED)
          .map((status) => {
            return {
              label: formatUtils.convertEnumToHumanReadable(status),
              value: status,
              icon: flowRunUtils.getStatusIcon(status).Icon,
            };
          }),
        icon: CheckIcon,
      } as const,
      {
        type: 'date',
        title: t('Created'),
        accessorKey: 'created',
        options: [],
        icon: CheckIcon,
      } as const,
    ],
    [flows],
  );

  const replayRun = useMutation({
    mutationFn: (retryParams: {
      runIds: string[];
      strategy: FlowRetryStrategy;
    }) => {
      const status = searchParams.getAll('status') as FlowRunStatus[];
      const flowId = searchParams.getAll('flowId');
      const createdAfter = searchParams.get('createdAfter') || undefined;
      const createdBefore = searchParams.get('createdBefore') || undefined;

      return flowRunsApi.bulkRetry({
        projectId: authenticationSession.getProjectId()!,
        flowRunIds: retryParams.runIds,
        strategy: retryParams.strategy,
        status,
        flowId,
        createdAfter,
        createdBefore,
      });
    },
    onSuccess: () => {
      toast({
        title: t('Runs replayed successfully'),
        variant: 'default',
      });
      navigate(window.location.pathname);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const bulkActions: BulkAction<FlowRun>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => {
          const allFailed = selectedRowIds.every((row) =>
            isFailedState(row.status),
          );
          const isDisabled =
            selectedRowIds.length === 0 || !userHasPermissionToRetryRun;

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild disabled={isDisabled}>
                  <Button disabled={isDisabled} className="h-9 w-full">
                    <PlayIcon className="mr-2 h-3 w-4" />
                    {selectedRowIds.length > 0
                      ? `${t('Retry')} (${selectedRowIds.length})`
                      : t('Retry')}
                    <ChevronDown className="h-3 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <PermissionNeededTooltip
                    hasPermission={userHasPermissionToRetryRun}
                  >
                    <DropdownMenuItem
                      disabled={!userHasPermissionToRetryRun}
                      onClick={() => {
                        replayRun.mutate({
                          runIds: selectedRowIds.map((row) => row.id),
                          strategy: FlowRetryStrategy.ON_LATEST_VERSION,
                        });
                        resetSelection();
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-row gap-2 items-center">
                        <RotateCw className="h-4 w-4" />
                        <span>{t('on latest version')}</span>
                      </div>
                    </DropdownMenuItem>
                  </PermissionNeededTooltip>

                  {selectedRowIds.some((row) => isFailedState(row.status)) && (
                    <MessageTooltip
                      message={t(
                        'Only failed runs can be retried from failed step',
                      )}
                      isDisabled={!allFailed}
                    >
                      <DropdownMenuItem
                        disabled={!userHasPermissionToRetryRun || !allFailed}
                        onClick={() => {
                          replayRun.mutate({
                            runIds: selectedRowIds.map((row) => row.id),
                            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
                          });
                          resetSelection();
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <Redo className="h-4 w-4" />
                          <span>{t('from failed step')}</span>
                        </div>
                      </DropdownMenuItem>
                    </MessageTooltip>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [replayRun, userHasPermissionToRetryRun, t, selectedRowIds, data],
  );

  const handleRowClick = useCallback(
    (row: FlowRun, newWindow: boolean) => {
      if (newWindow) {
        openNewWindow(`/runs/${row.id}`);
      } else {
        navigate(`/runs/${row.id}`);
      }
    },
    [navigate, openNewWindow],
  );

  return (
    <div className="flex-col w-full">
      <div className="mb-4 flex">
        <TableTitle>{t('Flow Runs')}</TableTitle>
        <div className="ml-auto"></div>
      </div>
      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading || isFetchingFlows}
        filters={filters}
        bulkActions={bulkActions}
        onRowClick={(row, newWindow) => handleRowClick(row, newWindow)}
      />
    </div>
  );
};

FlowRunsPage.displayName = 'FlowRunsTable';
export { FlowRunsPage };
