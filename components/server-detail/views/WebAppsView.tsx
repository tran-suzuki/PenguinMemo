import React from 'react';
import { ServerWebApp } from '../../../types';
import { WebAppList } from '../WebAppList';

interface WebAppsViewProps {
  serverId: string;
  webApps: ServerWebApp[];
}

export const WebAppsView: React.FC<WebAppsViewProps> = ({ serverId, webApps }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <WebAppList serverId={serverId} webApps={webApps} />
    </div>
  );
};
