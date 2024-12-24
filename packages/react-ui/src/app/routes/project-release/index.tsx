import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Plus, ChevronDown, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableTitle } from '@/components/ui/table-title';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { formatUtils } from '@/lib/utils';
import {
  ProjectRelease,
  ProjectReleaseType,
} from '@activepieces/shared';
import { DownloadButton } from './download-button';
import { useApplyPlan } from './apply-plan';

const ProjectReleasesPage = () => {

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['project-releases'],
    queryFn: () => projectReleaseApi.list(),
  });

  const { ApplyButton, ApplyPlanDialog } = useApplyPlan({
    onSuccess: refetch,
  });

  const columns: ColumnDef<RowDataWithActions<ProjectRelease>>[] = [
    {
      accessorKey: 'name',
      accessorFn: (row) => row.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => <div className="text-left">{row.original.name}</div>,
    },
    {
      accessorKey: 'created',
      accessorFn: (row) => row.created,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Imported At')} />
      ),
      cell: ({ row }) => (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      ),
    },
    {
      accessorKey: 'importedBy',
      accessorFn: (row) => row.importedBy,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Imported By')}
          className="text-center"
        />
      ),
      cell: ({ row }) => (
        <div className="text-left">{row.original.importedByUser?.email}</div>
      ),
    },
    {
      accessorKey: 'type',
      accessorFn: (row) => row.type,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Type')} />
      ),
    },
  ];

  return (
    <div className="flex-col w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <TableTitle>{t('Project Releases')}</TableTitle>
          <div className="text-sm text-muted-foreground">
            {t('View all history of imported project releases')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button className="h-9 w-full">
                {t('Create Release')}
                <ChevronDown className="h-3 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="cursor-pointer">
                <ApplyButton
                  variant="ghost"
                  className="w-full justify-start"
                  request={{ type: ProjectReleaseType.GIT }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <Plus className="h-4 w-4" />
                    <span>{t('From Git')}</span>
                  </div>
                </ApplyButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        actions={[
          (row) => <DownloadButton release={row} />,
          (row) => {
            return (
              <div className="flex items-center justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ApplyButton
                      variant="ghost"
                      className="size-8 p-0"
                      request={{
                        type: ProjectReleaseType.ROLLBACK,
                        projectReleaseId: row.id,
                      }}
                    >
                      <Undo2 className="size-4" />
                    </ApplyButton>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t('Rollback')}</TooltipContent>
                </Tooltip>
              </div>
            );
          },
        ]}
      />
      <ApplyPlanDialog />
    </div>
  );
};

ProjectReleasesPage.displayName = 'ProjectReleasesPage';
export { ProjectReleasesPage };
