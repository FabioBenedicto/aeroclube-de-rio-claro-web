import client from './client';

export interface PermissionAction {
  key: string;
  action: string;
  action_label: string;
}

export interface PermissionGroup {
  module: string;
  module_label: string;
  actions: PermissionAction[];
}

export const getPermissions = () =>
  client.get<PermissionGroup[]>('/permissions').then((r) => r.data);
