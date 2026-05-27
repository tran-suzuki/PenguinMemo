import React from 'react';
import { ServerConfig } from '../../../types';
import { ConfigEditor } from '../ConfigEditor';
import { ConfigSearchResults } from '../ConfigSearchResults';

interface ConfigsViewProps {
  searchQuery: string;
  filteredConfigs: ServerConfig[];
  serverConfigs: ServerConfig[];
  activeConfigId: string | null;
  isCreatingConfig: boolean;
  onSelectSearchResult: (id: string) => void;
  onSaveConfig: (path: string, content: string, type: string) => void;
  onDeleteActiveConfig?: () => void;
}

/**
 * configs ビューのメインコンテンツ。検索中は検索結果、それ以外は設定エディタを表示する。
 */
export const ConfigsView: React.FC<ConfigsViewProps> = ({
  searchQuery,
  filteredConfigs,
  serverConfigs,
  activeConfigId,
  isCreatingConfig,
  onSelectSearchResult,
  onSaveConfig,
  onDeleteActiveConfig,
}) => {
  if (searchQuery) {
    return (
      <ConfigSearchResults
        results={filteredConfigs}
        onSelect={onSelectSearchResult}
      />
    );
  }

  return (
    <ConfigEditor
      config={activeConfigId ? serverConfigs.find(c => c.id === activeConfigId) || null : null}
      onSave={onSaveConfig}
      onDelete={onDeleteActiveConfig}
      isNew={isCreatingConfig}
    />
  );
};
