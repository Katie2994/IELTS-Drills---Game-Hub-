export interface BaseFolderInfo {
  title: string;
  gameUrl: string;
  thumbnailUrl?: string;
  category: string;
  content: {
    title: string;
    description: string;
  };
  tabOffset?: number;
  icon: string;
  textColor?: string;
}

export interface FolderInfo extends BaseFolderInfo {
  color: string;
  borderColor: string;
}

export type FolderData = FolderInfo & { originalIndex: number };
