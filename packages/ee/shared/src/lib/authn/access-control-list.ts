import { Permission, DefaultProjectRole } from '@activepieces/shared'

export const rolePermissions: Record<DefaultProjectRole, Permission[]> = {
    [DefaultProjectRole.ADMIN]: [
        Permission.READ_APP_CONNECTION,
        Permission.WRITE_APP_CONNECTION,
        Permission.READ_FLOW,
        Permission.WRITE_FLOW,
        Permission.UPDATE_FLOW_STATUS,
        Permission.READ_PROJECT_MEMBER,
        Permission.WRITE_PROJECT_MEMBER,
        Permission.WRITE_INVITATION,
        Permission.READ_INVITATION,
        Permission.WRITE_GIT_REPO,
        Permission.READ_GIT_REPO,
        Permission.READ_RUN,
        Permission.WRITE_RUN,
        Permission.READ_ISSUES,
        Permission.WRITE_ISSUES,
        Permission.WRITE_ALERT,
        Permission.READ_ALERT,
        Permission.WRITE_PROJECT,
        Permission.READ_PROJECT,
    ],
    [DefaultProjectRole.EDITOR]: [
        Permission.READ_APP_CONNECTION,
        Permission.WRITE_APP_CONNECTION,
        Permission.READ_FLOW,
        Permission.WRITE_FLOW,
        Permission.UPDATE_FLOW_STATUS,
        Permission.READ_PROJECT_MEMBER,
        Permission.READ_INVITATION,
        Permission.WRITE_GIT_REPO,
        Permission.READ_GIT_REPO,
        Permission.READ_RUN,
        Permission.WRITE_RUN,
        Permission.READ_ISSUES,
        Permission.WRITE_ISSUES,
        Permission.READ_PROJECT
    ],
    [DefaultProjectRole.OPERATOR]: [
        Permission.READ_APP_CONNECTION,
        Permission.WRITE_APP_CONNECTION,
        Permission.READ_FLOW,
        Permission.UPDATE_FLOW_STATUS,
        Permission.READ_PROJECT_MEMBER,
        Permission.READ_INVITATION,
        Permission.READ_GIT_REPO,
        Permission.READ_RUN,
        Permission.WRITE_RUN,
        Permission.READ_ISSUES,
        Permission.READ_PROJECT,
    ],
    [DefaultProjectRole.VIEWER]: [
        Permission.READ_APP_CONNECTION,
        Permission.READ_FLOW,
        Permission.READ_PROJECT_MEMBER,
        Permission.READ_INVITATION,
        Permission.READ_ISSUES,
        Permission.READ_PROJECT,
    ],
}
